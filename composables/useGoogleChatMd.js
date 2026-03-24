// composables/useGoogleChatMd.js
//
// Google Chat は標準 Markdown と異なる独自仕様を持つ。
// このcomposableは以下2つの機能を提供する：
//   1. convertToGoogleChat  - 標準MD → Google Chat MD 変換（Webhook送信用）
//   2. renderGoogleChatPreview - Google Chat プレビュー用 HTML レンダリング
//
// 変換仕様（TASK-20260322-1534 §2 参照）:
//   **太字** → *太字*
//   ~~取り消し~~ → ~取り消し~
//   - リスト → ・リスト（リスト記法非対応のため全角ドットに変換）
//   # 見出し → 見出し（見出し記法非対応のため削除）
//   > 引用 → ＞ 引用（引用記法非対応のため全角に変換）
//   [text](url) → text（リンク記法非対応のためテキストのみ残す）

export const useGoogleChatMd = () => {

  /**
   * 標準 Markdown → Google Chat Markdown 変換
   * Webhook 送信時に適用する
   * @param {string} standardMd - 標準Markdownテキスト
   * @returns {string} Google Chat 用に変換されたテキスト
   */
  const convertToGoogleChat = (standardMd) => {
    if (!standardMd) return ''

    return standardMd
      // Bold: **text** → *text*（ただしすでに *text* の場合はそのまま）
      .replace(/\*\*(.+?)\*\*/g, '*$1*')
      // Strikethrough: ~~text~~ → ~text~
      .replace(/~~(.+?)~~/g, '~$1~')
      // リスト記法: "    - " or "- " → ・text（全角ドット）
      .replace(/^\s*- /gm, '・')
      // 見出し記法を除去: # heading → heading（装飾が効かないため）
      .replace(/^#{1,6}\s+/gm, '')
      // 引用記法: > text → ＞ text
      .replace(/^> /gm, '＞ ')
      // リンク記法: [text](url) → text（リンクが効かないため）
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  }

  /**
   * Google Chat プレビュー用 HTML レンダリング
   * Google Chat で装飾が適用された場合の見た目を再現する
   * @param {string} text - 標準Markdownテキスト（変換前）
   * @returns {string} プレビュー表示用のHTMLテキスト
   */
  const renderGoogleChatPreview = (text) => {
    if (!text) return ''

    // まずGChat形式に変換
    let converted = convertToGoogleChat(text)

    // HTML エスケープ（XSS対策）
    converted = converted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // Google Chat の装飾をHTMLに変換
    converted = converted
      // コードブロック（先に処理してインラインコードと干渉しないようにする）
      .replace(/```([\s\S]*?)```/g, '<pre class="gchat-code-block">$1</pre>')
      // インラインコード
      .replace(/`([^`]+)`/g, '<code class="gchat-inline-code">$1</code>')
      // 太字: *text* → <b>text</b>（リスト記号の * は除外）
      .replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g, '<b>$1</b>')
      // 斜体: _text_ → <i>text</i>
      .replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '<i>$1</i>')
      // 取り消し線: ~text~ → <s>text</s>
      .replace(/(?<!\w)~([^~\n]+)~(?!\w)/g, '<s>$1</s>')
      // 改行
      .replace(/\n/g, '<br>')

    return converted
  }

  return { convertToGoogleChat, renderGoogleChatPreview }
}
