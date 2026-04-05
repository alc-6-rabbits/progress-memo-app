---
title: "DESIGN-20260402-2250: 日報・週報フォーマット更新詳細設計"
status: "draft"
ref: "REQ-20260402-2250-ReportFormat.md"
author: "Antigravity (Architect)"
date: "2026-04-02"
updated: "2026-04-05"
---

# DESIGN: 日報・週報フォーマット更新詳細設計

## 1. データ取得ロジックの拡張 (`useGitHubGraphQL.js`)

### 1.1. GraphQL クエリの更新 (`PROJECT_ITEMS_FRAGMENT`)
GitHub のサブ課題機能 (Sub-issues) のカウントを取得するためにフラグメントを拡張する。

```graphql
# Issue フラグメントに追加
... on Issue {
  title
  number
  url
  state
  repository {
    nameWithOwner
  }
  # サブ課題情報の追加
  subIssues(first: 50) {
    totalCount
    nodes {
      state # OPEN / CLOSED 判定用
    }
  }
}
```

**フォールバック**: `subIssues` フィールドが利用不可の場合（GitHub Enterprise 等）、GraphQL エラーが発生する可能性がある。その場合は `subIssues` を含まないフォールバッククエリを用意するか、レスポンスの `errors` を検知して再試行する。

### 1.2. 正規化処理の更新 (`normalizeProjectItem`)
取得したサブ課題情報を正規化データに含める。

- **新規フィールド**:
  - `subIssueCount`: 全サブ課題数 (`subIssues.totalCount`)。`subIssues` が取得できない場合は `null`。
  - `subIssueDoneCount`: 完了済みのサブ課題数 (`state === 'CLOSED'` の数)。
  - `progressRate`: `subIssueCount > 0` の場合、`Math.round((subIssueDoneCount / subIssueCount) * 100)`。`subIssueCount === 0` または `null` の場合は `null`。

### 1.3. 進捗率表示用ヘルパー関数の追加 (`useGitHubGraphQL.js`)

```javascript
/**
 * プロジェクトアイテムを進捗表示用 Markdown に変換する
 * @param {Array} items - normalizeProjectItem で正規化されたアイテム配列
 * @returns {string} プロジェクト進捗セクションの Markdown テキスト
 */
const formatProjectProgress = (items) => {
  // Status が 'In Progress' または 'Todo' のアイテムをフィルタ
  // startDate と dueDate が設定されているものを進捗管理用 Issue とみなす
  // projectTitle でグルーピング
  // 各プロジェクトのアイテムを Markdown に変換
}
```

## 2. 報告書生成ロジックの更新 (`pages/report.vue`)

### 2.1. 共通テンプレート生成関数 (`buildReportTemplate`)

日報・週報でテンプレート生成ロジックを共通化する新関数を導入する。

```javascript
/**
 * @param {Object} options
 * @param {string} options.type - 'daily' | 'weekly'
 * @param {string} options.title - レポートタイトル
 * @param {string} options.startStr - 開始日 (YYYY/MM/DD)
 * @param {string} options.endStr - 終了日 (YYYY/MM/DD)
 * @param {Array} options.allLocalTasks - 全ローカルタスク
 * @param {boolean} options.hasGitHub - GitHub 連携の有無
 * @returns {Promise<string>} Markdown テンプレート
 */
const buildReportTemplate = async (options) => { ... }
```

### 2.2. セクション構成（日報・週報 共通）

```markdown
# [DAILY/WEEKLY] REPORT: [期間]

## 1. プロジェクト進捗状況        ← ★新設（GitHub 連携時のみ）
【project-name】  
[In Progress 進捗状況]
・Issue Title　Done / Total　Rate%
・Issue Title　Sub-Issueなし

[ToDo リスト]
・Issue Title

## 2. [本日/今週]の実績
### [GitHub Activity]             ← GitHub 未連携時は
（GitHub 連携が設定されていません）   ←  このメッセージに置換
### [Local Tasks]
- [Project] Task Title
  ⇒　                            ← ★コメント記号の自動挿入

## 3. [明日/来週]の予定
- [Project] Task Title
  ⇒　                            ← ★コメント記号の自動挿入

## 4. 特記事項 / 定例メモ          ← 週報のみ

以上です。
```

### 2.3. GitHub 非連携時のフォールバック

```javascript
// PAT の存在チェック
const hasGitHub = !!(localStorage.getItem('githubPat'))

// GitHub Activity セクション
const githubMd = hasGitHub
  ? formatEventsAsMarkdown(await fetchUserEvents(startStr, endStr))
  : '（GitHub 連携が設定されていません）'

// プロジェクト進捗セクション
let progressMd = ''
if (hasGitHub) {
  try {
    const items = await fetchAllProjectItems()
    progressMd = formatProjectProgress(items)
  } catch (e) {
    console.warn('[Report] Project progress fetch failed:', e.message)
    progressMd = '' // スキップ
  }
}
// progressMd が空の場合、セクションごと省略
```

### 2.4. コメント記号挿入ヘルパー

```javascript
/**
 * タスクリスト行にコメント記号を付与する
 * @param {Array<string>} lines - "- [Project] Title" 形式の行配列
 * @returns {string} コメント記号付き Markdown
 */
const withCommentMarkers = (lines) => {
  return lines.map(line => `${line}\n  ⇒　`).join('\n')
}
```

### 2.5. 明日/来週の予定ソートロジック

```javascript
const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2, undefined: 3 }

const sortedTasks = activeTasks.sort((a, b) => {
  // 1. 優先度でソート
  const pa = priorityOrder[a.priority] ?? 3
  const pb = priorityOrder[b.priority] ?? 3
  if (pa !== pb) return pa - pb
  
  // 2. 期限日の近さでソート（期限なしは後ろ）
  const da = a.due_date ? new Date(a.due_date) : new Date('9999-12-31')
  const db = b.due_date ? new Date(b.due_date) : new Date('9999-12-31')
  return da - db
})
```

## 3. 週報の期間指定 UI (`pages/report.vue`)

### 3.1. フロー

```
[+ WEEKLY] クリック
    ↓
[期間選択モーダル表示]
  ┌──────────────────────────────────┐
  │  WEEKLY REPORT PERIOD            │
  │                                  │
  │  START:  [2026/04/01]  📅       │
  │  END:    [2026/04/05]  📅       │
  │                                  │
  │  [ CANCEL ]    [ GENERATE >> ]   │
  └──────────────────────────────────┘
    ↓ GENERATE クリック
[createReport('weekly', startDate, endDate)]
```

### 3.2. モーダル実装

- **新規 reactive state**:
  - `showWeeklyDatePicker: ref(false)` — モーダルの表示制御
  - `weeklyStartDate: ref(null)` — 選択された開始日
  - `weeklyEndDate: ref(null)` — 選択された終了日

- **日付ピッカー**: 既存の `flatpickr` 依存を活用。`onMounted` でインスタンスを初期化。
  - デフォルト値: 当週の月曜日〜金曜日。
  - TCC テーマに合わせたダーク系スタイリング。

- **`+ WEEKLY` ボタン動作の変更**:
  - 現行: `@click="createReport('weekly')"` → 即座に生成開始
  - 変更後: `@click="openWeeklyDatePicker()"` → モーダル表示 → `GENERATE` で `createReport('weekly', start, end)` を呼び出し

### 3.3. `createReport` 関数シグネチャの変更

```javascript
// 変更前
const createReport = async (type) => { ... }

// 変更後
const createReport = async (type, customStart = null, customEnd = null) => {
  // weekly の場合、customStart / customEnd を使用
  // daily の場合、従来通り today を使用
}
```

## 4. 変更の影響範囲

| ファイル | 変更内容 |
|---------|---------|
| `composables/useGitHubGraphQL.js` | Sub-issues 取得クエリ追加、正規化フィールド追加、`formatProjectProgress` 関数追加 |
| `pages/report.vue` | テンプレート共通化、期間選択モーダル UI 追加、コメント記号挿入、ソートロジック改善、フォールバック処理 |
