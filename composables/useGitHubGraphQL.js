// composables/useGitHubGraphQL.js
import { ref } from 'vue'
import { useGitHubREST } from './useGitHubREST'

/**
 * Projects V2 アイテムの共通フラグメント（viewer / organization 両方で再利用）
 */
const PROJECT_ITEMS_FRAGMENT = `
  nodes {
    id
    title
    number
    items(first: 100) {
      nodes {
        id
        content {
          ... on Issue {
            title
            number
            url
            state
            repository {
              nameWithOwner
            }
          }
          ... on PullRequest {
            title
            number
            url
            state
            repository {
              nameWithOwner
            }
          }
        }
        fieldValues(first: 10) {
          nodes {
            ... on ProjectV2ItemFieldSingleSelectValue {
              name
              field {
                ... on ProjectV2SingleSelectField {
                  name
                }
              }
            }
            ... on ProjectV2ItemFieldDateValue {
              date
              field {
                ... on ProjectV2Field {
                  name
                }
              }
            }
            ... on ProjectV2ItemFieldIterationValue {
              title
              startDate
              duration
              field {
                ... on ProjectV2IterationField {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`

/**
 * ユーザー個人の Projects V2 を取得するクエリ
 */
const VIEWER_PROJECTS_QUERY = `
query {
  viewer {
    projectsV2(first: 20) {
      ${PROJECT_ITEMS_FRAGMENT}
    }
  }
}
`

/**
 * Organization の Projects V2 を取得するクエリ
 */
const ORG_PROJECTS_QUERY = `
query($orgLogin: String!) {
  organization(login: $orgLogin) {
    projectsV2(first: 20) {
      ${PROJECT_ITEMS_FRAGMENT}
    }
  }
}
`

/**
 * スケジュールステータスを算出する
 * @param {string|null} status - "Todo", "In Progress", "Done" 等
 * @param {string|null} startDate - "YYYY-MM-DD"
 * @param {string|null} dueDate - "YYYY-MM-DD"
 * @returns {string} "on-track" | "at-risk" | "overdue" | "completed" | "unscheduled"
 */
const calculateScheduleStatus = (status, startDate, dueDate) => {
  // Done は完了
  if (status && status.toLowerCase() === 'done') return 'completed'

  // 日付未設定はスケジュール未定
  if (!dueDate) return 'unscheduled'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)

  const daysRemaining = Math.ceil((due - today) / (1000 * 60 * 60 * 24))

  if (daysRemaining < 0) return 'overdue'       // 期限超過
  if (daysRemaining <= 3) return 'at-risk'       // 期限接近（3日以内）
  return 'on-track'                               // 順調
}

/**
 * GraphQL レスポンスのアイテムを正規化する
 * @param {Object} item - ProjectV2Item ノード
 * @param {string} projectTitle - 所属プロジェクト名
 * @param {number} projectNumber - 所属プロジェクト番号
 * @returns {Object|null} 正規化されたアイテム、またはnull（コンテンツなしの場合）
 */
const normalizeProjectItem = (item, projectTitle, projectNumber) => {
  const content = item.content
  if (!content || !content.title) return null  // DraftIssue などを除外

  // フィールド値をパース
  let status = null
  let startDate = null
  let dueDate = null
  let iterationTitle = null

  for (const fieldValue of (item.fieldValues?.nodes || [])) {
    if (!fieldValue) continue

    // Status フィールド（SingleSelect型）
    if (fieldValue.field?.name === 'Status' && fieldValue.name) {
      status = fieldValue.name  // "Todo", "In Progress", "Done" 等
    }

    // Date フィールド
    if (fieldValue.date && fieldValue.field?.name) {
      const fieldName = fieldValue.field.name.toLowerCase()
      if (fieldName.includes('start') || fieldName === '開始日') {
        startDate = fieldValue.date
      }
      if (fieldName.includes('due') || fieldName.includes('end') || fieldName.includes('target') || fieldName.includes('deadline') || fieldName === '期限' || fieldName === '終了日') {
        dueDate = fieldValue.date
      }
    }

    // Iteration フィールド
    if (fieldValue.startDate && fieldValue.duration != null) {
      iterationTitle = fieldValue.title
      if (!startDate) startDate = fieldValue.startDate
      if (!dueDate) {
        // duration は日数なので、startDate + duration で終了日を算出
        const start = new Date(fieldValue.startDate)
        start.setDate(start.getDate() + fieldValue.duration)
        dueDate = start.toISOString().split('T')[0]
      }
    }
  }

  // スケジュールステータスの算出
  const scheduleStatus = calculateScheduleStatus(status, startDate, dueDate)

  return {
    id: item.id,
    source: 'github',
    title: content.title,
    number: content.number,
    url: content.url,
    state: content.state,
    repository: content.repository?.nameWithOwner || '',
    status: status,
    startDate: startDate,
    dueDate: dueDate,
    iterationTitle: iterationTitle,
    scheduleStatus: scheduleStatus,
    projectTitle: projectTitle,
    projectNumber: projectNumber
  }
}

export const useGitHubGraphQL = () => {
  const loading = ref(false)
  const error = ref(null)
  const cache = ref({}) // シンプルなインメモリキャッシュ

  const { getDecryptedPat } = useGitHubREST()

  /**
   * GraphQL API に POST リクエストを送信する
   * @param {string} graphqlQuery - GraphQL クエリ文字列
   * @param {Object} variables - クエリ変数
   * @returns {Promise<Object>} レスポンスの data 部分
   */
  const query = async (graphqlQuery, variables = {}) => {
    const pat = await getDecryptedPat()
    if (!pat) {
      throw new Error('GitHub PAT is not configured. Please set it in CONFIG.')
    }

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${pat}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: graphqlQuery, variables })
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`GraphQL request failed (${response.status}): ${text}`)
    }

    const result = await response.json()
    if (result.errors && result.errors.length > 0) {
      throw new Error(`GraphQL error: ${result.errors.map(e => e.message).join(', ')}`)
    }

    return result.data
  }

  /**
   * ユーザーの個人プロジェクトと Organization プロジェクトの両方を横断取得する
   * Organization 名は githubRepo 設定 (owner/repo) の owner 部分から推定する
   * @returns {Promise<Array>} 正規化されたアイテム配列
   */
  const fetchAllProjectItems = async () => {
    // キャッシュチェック（5分間有効）
    const cacheKey = 'allProjectItems'
    const cached = cache.value[cacheKey]
    if (cached && (Date.now() - cached.timestamp) < 5 * 60 * 1000) {
      return cached.data
    }

    loading.value = true
    error.value = null

    try {
      const allProjects = []

      // 1. ユーザー個人プロジェクトを取得
      try {
        const viewerData = await query(VIEWER_PROJECTS_QUERY)
        const viewerProjects = viewerData?.viewer?.projectsV2?.nodes || []
        console.log(`[GraphQL] Viewer projects: ${viewerProjects.length}`, viewerProjects.map(p => p.title))
        allProjects.push(...viewerProjects)
      } catch (e) {
        console.warn('[GraphQL] Failed to fetch viewer projects:', e.message)
      }

      // 2. Organization プロジェクトを取得（githubRepo の owner 部分を使用）
      const githubRepo = localStorage.getItem('githubRepo') || ''
      if (githubRepo) {
        const orgLogin = githubRepo.split('/')[0]
        if (orgLogin) {
          try {
            const orgData = await query(ORG_PROJECTS_QUERY, { orgLogin })
            const orgProjects = orgData?.organization?.projectsV2?.nodes || []
            console.log(`[GraphQL] Org "${orgLogin}" projects: ${orgProjects.length}`, orgProjects.map(p => p.title))
            allProjects.push(...orgProjects)
          } catch (e) {
            // owner がユーザー名（Organization ではない）場合はここに入る。正常動作。
            console.warn(`[GraphQL] Org query for "${orgLogin}" failed (may be a user, not org):`, e.message)
          }
        }
      }

      // 3. 重複排除（プロジェクト ID ベース）
      const seenProjectIds = new Set()
      const uniqueProjects = allProjects.filter(p => {
        if (seenProjectIds.has(p.id)) return false
        seenProjectIds.add(p.id)
        return true
      })

      console.log(`[GraphQL] Total unique projects: ${uniqueProjects.length}`)

      // 4. 全アイテムを正規化
      const items = []
      for (const project of uniqueProjects) {
        const projectTitle = project.title
        const projectNumber = project.number
        const rawItems = project.items?.nodes || []
        console.log(`[GraphQL] Project "${projectTitle}" has ${rawItems.length} raw items`)

        for (const item of rawItems) {
          const normalized = normalizeProjectItem(item, projectTitle, projectNumber)
          if (normalized) {
            items.push(normalized)
          } else {
            console.log('[GraphQL] Skipped item (no content):', item.id)
          }
        }
      }

      console.log(`[GraphQL] Total normalized items: ${items.length}`, items.map(i => `${i.title} [status=${i.status}]`))

      // キャッシュに保存
      cache.value[cacheKey] = { data: items, timestamp: Date.now() }
      return items
    } catch (e) {
      error.value = e.message
      console.error('[GraphQL] fetchAllProjectItems failed:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * PAT の Projects V2 アクセス権を簡易チェックする
   * （実際にクエリを投げて成功するか確認）
   * @returns {Promise<{ available: boolean, message: string }>}
   */
  const checkProjectsAccess = async () => {
    try {
      const data = await query('query { viewer { login, projectsV2(first: 1) { totalCount } } }')
      const count = data?.viewer?.projectsV2?.totalCount || 0
      return {
        available: true,
        message: `Authenticated as ${data.viewer.login}. ${count} project(s) found.`
      }
    } catch (e) {
      return {
        available: false,
        message: `Projects access check failed: ${e.message}. Ensure PAT has 'read:project' scope.`
      }
    }
  }

  /**
   * キャッシュをクリアして再取得を強制する
   */
  const invalidateCache = () => {
    cache.value = {}
  }

  return {
    query,
    fetchAllProjectItems,
    checkProjectsAccess,
    invalidateCache,
    loading,
    error
  }
}
