---
title: "DESIGN-20260401: Tactical Command Center (TCC) 機能設計書"
status: "approved"
ref: "REQ-20260325-2315-TCC.md"
author: "Antigravity (Architect)"
date: "2026-04-01"
approved_at: "2026-04-01"
---

# DESIGN: Tactical Command Center (TCC) 機能設計書

## 0. アプリケーション基本情報

| 項目 | 設計値 |
|------|--------|
| 正式名称 | Tactical Command Center (TCC) |
| package.json name | `tactical-command-center` (要変更) |
| productName | `Tactical Command Center` (要変更) |
| バージョン表示 | Nuxt の `useRuntimeConfig` 経由で `package.json` の `version` を UI へ動的注入 |

---

## 1. アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tactical Command Center                       │
│  ┌──────────────────────────────┐  ┌────────────────────────┐   │
│  │  Nuxt 3 / Vue 3 フロントエンド│  │  Electron Main Process  │   │
│  │  (Renderer Process)          │  │  (Node.js)              │   │
│  │                              │  │                         │   │
│  │  pages/               IPC   │  │  IPC Handlers:          │   │
│  │  ├── index.vue  ←──────────→│  │  ・FS操作 (MD, JSON)    │   │
│  │  ├── tasks.vue             │  │  ・safeStorage          │   │
│  │  ├── briefing.vue          │  │  ・dialog               │   │
│  │  ├── timeline.vue          │  │  ・MCP Server (NEW)     │   │
│  │  ├── report.vue            │  │                         │   │
│  │  ├── projects.vue          │  │  外部接続:               │   │
│  │  └── settings.vue          │  │  ・GitHub API           │   │
│  │                            │  │  ・Google Calendar API  │   │
│  │  composables/              │  │  ・Google Chat Webhook  │   │
│  │  layouts/                  │  │                         │   │
│  └──────────────────────────────┘  └────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Local Data Store (ユーザー指定ディレクトリ)                  │ │
│  │  <rootDir>/                                                  │ │
│  │  ├── tasks/           ← ローカルタスク Markdown群            │ │
│  │  ├── reports/         ← 日報/週報 (NEW: 分離保存)            │ │
│  │  ├── projects.json    ← プロジェクト定義                     │ │
│  │  └── weekly-reports/  ← 旧互換 (phase-outへ)                │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. データモデル設計

### 2.1. ローカルタスク Markdown (Front-matter 拡張版)

現仕様の Front-matter を拡張し、GitHub Projects のフィールドに準拠させる。

```yaml
---
# === 基本識別情報 ===
id: "task-20240101-001"               # ユニーク ID (自動生成)
title: "タスク名"

# === プロジェクト帰属 ===
project_id: "2"                       # projects.json のキー
project_name: "ScreenAP開発"          # 人間向け表示名

# === ステータス ===
# 現在: inProgress / icebox / archived
# NEW:  todo / in-progress / done / icebox  (GitHub Projects 準拠)
status: "in-progress"

# === スケジュール (NEW) ===
start_date: "2026-04-01"             # 開始日 (YYYY-MM-DD)
due_date: "2026-04-15"               # 期限日 (YYYY-MM-DD)

# === タグ / 分類 (NEW) ===
tags: ["feature", "ui"]

# === 優先度 (NEW) ===
# High / Medium / Low の3段階
priority: "Medium"

# === 親 Issue 連携 (NEW) ===
# GitHub の親 Issue 番号（あればこのタスクは Sub-Issue として扱われる）
# ローカルオンリー運用でも「親タスクの ID」として流用可能
parent_issue: null        # 例: 12 (Issue 番号) or "task-20240101-001" (ローカル ID)

# === GitHub 紐付け ===
issue: 42                             # Issue 番号 (旧互換)
issue_url: "https://github.com/..."

# === タイムスタンプ ===
created_at: "2026-04-01T10:00:00.000Z"
updated_at: "2026-04-01T10:00:00.000Z"
---

本文 (Markdown)
```

> [!IMPORTANT]
> **ステータス移行方針**: 既存の `inProgress` → `in-progress`, `archived` → `done` への変換が必要。
> `get-all-markdowns` IPC ハンドラー内でマイグレーションロジックを実行し、旧フォーマットを透過的に変換する。

### 2.2. projects.json スキーマ

```json
{
  "project": {
    "1": {
      "id": "1",
      "name": "ScreenAP開発",
      "repo": "username/screap",     // GitHub リポジトリ名 (optional)
      "tags": ["feature", "dev"],
      "color": "#347eb1",            // 表示色 (optional)
      "description": "プロジェクト説明"
    }
  }
}
```

---

## 3. 画面設計

### 3.1. 共通レイアウト (`layouts/default.vue`)

**現在の構造を継続しつつ、以下を変更・追加する:**

```
┌─────────────────────────────────────────────────┐
│  [ TACTICAL COMMAND CENTER v1.5 ]  DATE  TIME   │  ← ヘッダー
├──────────┬──────────────────────────────────────┤
│          │                                      │
│  HOME    │                                      │
│  TASKS   │         <メインコンテンツ>            │
│  REPORTS │                                      │
│  SETTINGS│                                      │
│  ────    │                                      │
│  [+NEW]  │                                      │
│          │                                      │
│  (装飾)  │                                      │
├──────────┴──────────────────────────────────────┤
│  SYSTEM STATUS: ONLINE | SECURE CONNECTION ...   │  ← フッター
└─────────────────────────────────────────────────┘
```

**変更点:**
- `version` をヘッダーのタイトル横に動的表示する
- サイドナビの `FROM GITHUB` インポートリンクを削除
- タスク新規作成 `[+NEW]` ボタンをサイドナビの下段に固定配置

---

### 3.2. HOME / BRIEFING (`pages/index.vue`)

```
┌──────────────────────────────────────────────────┐
│  TACTICAL STATUS                                  │
│  [ ALERT ▮ ▮ ▮ ▮ アラートバナー ▮ ▮ ▮ ▮ ]      │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────┐│
│  │ TASK STATUS  │ │ SYSTEM STATUS│ │ GITHUB    ││
│  │ ToDo: 5      │ │ API: ONLINE  │ │ OPEN: 3   ││
│  │ In Prog: 3   │ │ Sync: OK     │ │ MERGED: 1 ││
│  └──────────────┘ └──────────────┘ └───────────┘│
├──────────────────────┬───────────────────────────┤
│  DAILY ITINERARY     │  DATALINK FEED            │  
│  (本日の予定)        │  (最近の更新ストリーム)    │
│  10:00 [■] WEEKLY   │  > 19:55 tcc_ui.md        │
│  13:00 [  ] DEV      │  > 18:30 report_gen.md    │
│                      │                           │
├──────────────────────┴───────────────────────────┤
│  TASK BOARD          │  TACTICAL TIMELINE        │
│ [TODO] [ENGAGED] ... │ (ミニガントチャート統合)  │
└──────────────────────┴───────────────────────────┘
```

**フェーズ分け:**
- **Phase 1 (現在)**: DATALINK FEED のみ実装済み（`index.vue` 刷新完了）。STATUS ウィジェットの実装。
- **Phase 2**: Google Calendar API 連携後、DAILY ITINERARY の実装。

---

### 3.3. TASKS / TACTICAL EDITOR (`pages/tasks.vue` ← `pages/index.vue` から分離)

> [!IMPORTANT]
> **現在の `index.vue` の2カラムタスク管理UIは、`pages/tasks.vue` として独立させる。**
> `index.vue` はダッシュボードに専念させる。ナビゲーションの `HOME` → `tasks.vue`。

```
┌───────────────────────────────────────────────────────────┐
│  [IN PROGRESS ▼] [BY TAG □] [>30DAYS □] [RELOAD]        │
├─────────────────────┬─────────────────────────────────────┤
│  タスクリスト(左)   │  タスク詳細 / Tactical Editor(右)   │
│                     │                                     │
│  ▶ ProjectA (5)    │  Title: xxxxxxxxxx                  │
│    > Task1          │  PJ: ProjectA  UPDATED: xx/xx       │
│    > Task2 ◀ selected│                                    │
│  ▶ ProjectB (3)    │  [Markdown Preview: Auto-Accordion]  │
│    > Task3          │                                     │
│                     │  ---                               │
│  [+ FROM GITHUB]   │  [>> EDIT CONTENT]                  │
│  は廃止へ           │  [>> IN PROGRESS] [>> ICEBOX]       │
│                     │  [>> ARCHIVE]                       │
└─────────────────────┴─────────────────────────────────────┘
```

**Tactical Editor (フルスクリーンオーバーレイ) は現状維持。**

---

### 3.4. REPORT GENERATION (`pages/report.vue` 改修)

**「Reports as Documents」アプローチ** の実装。専用エディタを持たず、Tactical Editor を活用する。

```
┌──────────────────────────────────────────────────────────────┐
│  REPORT GENERATION                                            │
│                                                               │
│  ┌─Generated Reports ──────────┐  ┌─ Tactical Editor ────┐   │
│  │ [ 2026-04 ]                 │  │                      │   │
│  │ > DAILY REPORT 04.01        │  │  >> EDIT REPORT      │   │
│  │                             │  │  [ SAVE ]            │   │
│  │ [ 2026-03 ]                 │  │  [TRANSMIT TO G-CHAT]│   │
│  │ > WEEKLY REPORT 03.24-03.30 │  │                      │   │
│  └─────────────────────────────┘  └──────────────────────┘   │
│                                                               │
│  注: `[+ DAILY]` `[+ WEEKLY]` ボタンはエディタ画面のヘッダーに配置 │
└──────────────────────────────────────────────────────────────┘
```

**IPC 変更点:**
- `save-daily-report` ハンドラーの追加（`reports/daily/` 以下に保存）
- 日報生成ロジックは Google Chat Markdown 形式で出力

---

### 3.5. TIMELINE (`pages/timeline.vue` は廃止)

独立した画面としては廃止・削除し、HOME画面 (`pages/index.vue`) 下段右側の **TACTICAL TIMELINE** コンポーネントとして統合。
**Phase 1**: ローカルタスクの `start_date` / `due_date` メタデータを活用したミニガントチャート表示。

---

### 3.6. PROJECTS (`pages/projects.vue`) - 軽微な改修

- `repo` フィールドの追加（GitHub リポジトリ名との紐付け）
- `color` フィールドの追加（プロジェクト表示色）

---

### 3.7. SETTINGS (`pages/settings.vue`) - 追加項目

| 設定項目 | 説明 | 現状 |
|---------|------|------|
| 起動画面 | BRIEFING (デフォルト) / TASKS / TIMELINE / REPORT | あり |
| データ保存ディレクトリ | タスク・レポートの保存先 | あり |
| GitHub PAT | Issue/Projects アクセス用トークン | あり |
| Default GitHub Repository | Issue 紐付け時に使用するデフォルトリポジトリ | あり |
| Google Chat Webhook | 日報送信先 URL | あり |
| テーマ / フォントサイズ | UI 外観カスタマイズ | あり |
| Google Calendar API KEY | (Phase 2) カレンダー連携用 | NEW |
| AI API KEY | (Phase 3) AI アシスタント連携用 | NEW |
| MCP Server Port | (Phase 3) ローカル MCP サーバーのポート番号 | NEW |

---

## 4. 削除・廃止対象

| ページ / 機能 | 理由 |
|--------------|------|
| `pages/import-github.vue` | GitHub から手動インポートする操作フローが不要になるため |
| IPC ハンドラー（未使用分） | 精査の上、不要なものを整理 |

---

## 5. 新規 IPC ハンドラー設計

| ハンドラー名 | 概要 |
|-------------|------|
| `get-app-version` | `package.json` の `version` を返す |
| `save-daily-report` | 日報を `reports/daily/YYYYMMDD.md` に保存 |
| `save-periodic-report` | 週報等を `reports/periodic/YYYYMMDD-YYYYMMDD.md` に保存 |
| `get-reports` | `reports/` 以下のレポートファイル一覧を取得 |

---

## 6. 将来フェーズ (ロードマップ)

### Phase 2: Google Calendar 連携
- `googleapis` パッケージの追加
- OAuth 2.0 フローの実装（またはサービスアカウント）
- `get-calendar-events` IPC ハンドラーの追加
- `BRIEFING` 画面の DAILY ITINERARY セクション実装

### Phase 3: AI Agent & MCP Server
- Electron Main Process 内で `@modelcontextprotocol/sdk` を使って HTTP/SSE MCP サーバーを起動
- 公開するツール（MCP Tools）候補:
  - `list_tasks`: タスク一覧の取得
  - `create_task`: ローカルタスクの作成
  - `update_task_status`: タスクステータスの更新
  - `get_briefing`: 今日のサマリー取得
  - `generate_daily_report`: 日報ドラフトの生成
- AI エージェント（Antigravity, Claude Code 等）が任意のポートに接続して操作可能にする

### Phase 4: Excel 週報出力
- `exceljs` パッケージを使用した Excel ファイル生成
- ユーザー指定のテンプレートファイルへの書き込み

---

## 7. 実装フェーズ計画

| フェーズ | 目標 | 主な変更内容 |
|---------|------|------------|
| **Phase 0** (当面) | 基盤整備 | アプリ名変更、Front-matter 拡張マイグレーション、import-github 削除、バージョン表示 |
| **Phase 1** | UI 改修 | `tasks.vue` 分離、BRIEFING ウィジェット充実、REPORT 画面刷新 |
| **Phase 2** | カレンダー連携 | Google Calendar API 統合、DAILY ITINERARY 実装 |
| **Phase 3** | AI 統合 | MCP Server 実装、AI アシスタント連携 |
| **Phase 4** | Excel 出力 | 会社指定 Excel フォーマット対応 |
