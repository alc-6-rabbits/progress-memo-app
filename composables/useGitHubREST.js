// composables/useGitHubREST.js
//
// GitHub REST API の共通操作を提供する composable。
// 日報送信時の Issue 自動コメント投稿（TASK-20260322-1536）などで使用する。

export const useGitHubREST = () => {

  /**
   * 復号化された PAT を取得する共通処理
   * settings.vue / import-github.vue と同一パターン
   * @returns {Promise<string|null>} 復号化されたPAT、またはnull
   */
  const getDecryptedPat = async () => {
    const savedPat = localStorage.getItem('githubPat') || ''
    if (!savedPat) return null

    if (window.electronAPI && window.electronAPI.decryptString) {
      return await window.electronAPI.decryptString(savedPat)
    }
    return savedPat
  }

  /**
   * GitHub API リクエスト共通ヘッダーを取得
   * @param {string} pat - GitHub Personal Access Token
   * @returns {Object} ヘッダーオブジェクト
   */
  const getHeaders = (pat) => ({
    'Authorization': `token ${pat}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  })

  /**
   * Issue にコメントを投稿する
   * @param {string} owner - リポジトリオーナー
   * @param {string} repo - リポジトリ名
   * @param {number} issueNumber - Issue 番号
   * @param {string} body - コメント本文
   * @returns {Promise<Object>} { success: boolean, commentUrl?: string, error?: string }
   */
  const postIssueComment = async (owner, repo, issueNumber, body) => {
    try {
      const pat = await getDecryptedPat()
      if (!pat) {
        return { success: false, error: 'GitHub PAT is not configured.' }
      }

      const url = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`
      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders(pat),
        body: JSON.stringify({ body })
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, commentUrl: data.html_url }
      } else {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: `${response.status}: ${errorData.message || response.statusText}`
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * issue_url から owner/repo/number を分解する
   * @param {string} issueUrl - "https://github.com/owner/repo/issues/42"
   * @returns {{ owner: string, repo: string, number: number } | null}
   */
  const parseIssueUrl = (issueUrl) => {
    if (!issueUrl) return null
    // 正規表現で owner, repo, number を抽出
    const match = issueUrl.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/)
    if (!match) return null
    return {
      owner: match[1],
      repo: match[2],
      number: parseInt(match[3], 10)
    }
  }

  /**
   * 認証ユーザーの詳細情報を取得する
   * @returns {Promise<Object>} { success: boolean, login?: string, avatar_url?: string, error?: string }
   */
  const getAuthenticatedUser = async () => {
    try {
      const pat = await getDecryptedPat()
      if (!pat) return { success: false, error: 'PAT not found' }

      const response = await fetch('https://api.github.com/user', {
        headers: getHeaders(pat)
      })
      
      if (response.ok) {
        const data = await response.json()
        return { success: true, login: data.login, avatar_url: data.avatar_url }
      } else {
        const errorData = await response.json().catch(() => ({}))
        return { success: false, error: `${response.status}: ${errorData.message || response.statusText}` }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * ローカルの YYYY/MM/DD 文字列を Date オブジェクトに変換する
   * @param {string} dateStr - "2026/04/07"
   * @param {boolean} [endOfDay=false] - その日の 23:59:59.999 を生成するかどうか
   * @returns {Date|null}
   */
  const parseLocalDate = (dateStr, endOfDay = false) => {
    if (!dateStr || typeof dateStr !== 'string') return null
    const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-')
    if (parts.length < 3) return null
    
    const [y, m, d] = parts.map(Number)
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null
    
    const dt = new Date(y, m - 1, d)
    if (endOfDay) dt.setHours(23, 59, 59, 999)
    else dt.setHours(0, 0, 0, 0)
    return dt
  }

  /**
   * ユーザーのイベントを取得する（期間内をフィルタリング）
   * @param {string} since - "YYYY/MM/DD" 形式の日付文字列
   * @param {string} [until] - "YYYY/MM/DD" 形式の日付文字列
   * @returns {Promise<{ events: Array, error: string|null }>} イベント配列とエラー情報
   */
  const fetchUserEvents = async (since, until) => {
    const pat = await getDecryptedPat()
    if (!pat) return { events: [], error: 'GitHub PAT is not configured.' }

    const userRes = await getAuthenticatedUser()
    if (!userRes.success) return { events: [], error: `Auth failed: ${userRes.error}` }
    const username = userRes.login

    // sinceDate: 基準日の 00:00:00 (Local/JST)
    const sinceDate = parseLocalDate(since)
    if (!sinceDate) return { events: [], error: `Invalid since date: ${since}` }
    
    // 境界値での漏れを防ぐため、さらに1時間余裕を持たせる
    const compareSinceDate = new Date(sinceDate.getTime() - 60 * 60 * 1000)

    // untilDate: 終了日の 23:59:59 (Local/JST)
    let untilDate = until ? parseLocalDate(until, true) : new Date()
    if (!until) untilDate.setHours(23, 59, 59, 999)

    const events = []
    let page = 1
    const maxPages = 10 

    try {
      while (page <= maxPages) {
        const url = `https://api.github.com/users/${username}/events?per_page=100&page=${page}`
        const response = await fetch(url, {
          headers: getHeaders(pat)
        })

        if (!response.ok) {
          const errText = await response.text().catch(() => response.statusText)
          throw new Error(`API error (${response.status}): ${errText}`)
        }

        const data = await response.json()
        if (data.length === 0) break

        for (const event of data) {
          const eventDate = new Date(event.created_at)
          
          // compareSinceDate より古い項目に到達したら停止
          if (eventDate < compareSinceDate) {
            return { events, error: null }
          }

          // untilDate より新しい項目はスキップ
          if (eventDate > untilDate) {
            continue
          }

          // sinceDate による厳密な判定
          if (eventDate >= sinceDate) {
            events.push(event)
          }
        }

        page++
      }
      return { events, error: null }
    } catch (e) {
      console.error('[GitHub REST] Error in fetchUserEvents:', e)
      return { events, error: e.message }
    }
  }

  /**
   * イベント配列をマークダウンテキストに変換する（極限まで簡素化）
   * @param {Array} events - GitHub Events API のレスポンス
   * @returns {string} マークダウンテキスト
   */
  const formatEventsAsMarkdown = (events) => {
    if (!events || events.length === 0) return '（期間内のアクティビティはありません）'

    const lines = []
    const repoGroups = {}

    // イベントの分類と集約
    for (const event of events) {
      const repo = event.repo?.name || 'unknown'
      if (!repoGroups[repo]) {
        repoGroups[repo] = {
          items: new Map(), // Map<number, string> (ID -> DisplayText)
          commits: new Set() // Set<string>
        }
      }

      const group = repoGroups[repo]
      const payload = event.payload || {}

      switch (event.type) {
        case 'PushEvent': {
          const commits = payload.commits || []
          for (const c of commits) {
            if (c.message) {
              group.commits.add(c.message.split('\n')[0])
            }
          }
          break
        }
        case 'IssuesEvent':
        case 'IssueCommentEvent':
        case 'PullRequestEvent':
        case 'PullRequestReviewEvent': {
          const isPR = event.type.includes('PullRequest')
          const item = isPR ? payload.pull_request : payload.issue
          if (!item || !item.title) break // タイトルが取得できない場合はスキップ

          const num = item.number
          const title = item.title
          
          // #123 Title の形式で集約
          group.items.set(num, `#${num} ${title}`)
          break
        }
      }
    }

    // マークダウンの組み立て
    for (const [repo, group] of Object.entries(repoGroups)) {
      const repoShort = repo.split('/')[1] || repo
      lines.push(`*【${repoShort}】*`)

      let hasContent = false

      // 1. Issues & PRs (Issue番号の昇順でソート)
      const sortedItems = Array.from(group.items.entries())
        .sort((a, b) => a[0] - b[0])
        .map(entry => entry[1])

      for (const displayText of sortedItems) {
        lines.push(`- ${displayText}`)
        hasContent = true
      }

      // 2. Commits (Issue/PR に紐付かない作業の補完)
      for (const msg of group.commits) {
        // コミットメッセージが既存の Issue タイトルと重複していないか簡易チェック
        const isDuplicate = Array.from(group.items.values()).some(val => val.includes(msg))
        if (!isDuplicate) {
          lines.push(`- ${msg}`)
          hasContent = true
        }
      }

      if (hasContent) lines.push('')
    }

    return lines.join('\n').trim()
  }

  return {
    getDecryptedPat,
    getHeaders,
    postIssueComment,
    parseIssueUrl,
    getAuthenticatedUser,
    fetchUserEvents,
    formatEventsAsMarkdown
  }
}
