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

  return {
    getDecryptedPat,
    getHeaders,
    postIssueComment,
    parseIssueUrl
  }
}
