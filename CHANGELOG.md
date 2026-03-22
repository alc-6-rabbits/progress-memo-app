# CHANGELOG

## [1.4.0] - 2026-03-22
### Added
- **統合ダッシュボード機能 (Phase 2 & 3)**
  - `useGitHubGraphQL` composable による GitHub Projects V2 サーチおよび連携機能追加。
  - BRIEFING 画面の新規追加（ローカル/GitHub タスクの一元管理、カンバンボード型 Status Overview 対応）。
  - OPERATION TIMELINE 画面の新規追加（ガントチャート、表示の調整、遅延アイテムのハイライト、プロジェクトフィルタ表示機能実装）。
  - ナビゲーションバーの刷新および、起動画面設定に BRIEFING / TIMELINE オプションを追加。
- **GitHub 連携の強化**
  - REPORT画面のコンテキストメニューに「GitHub Activity を挿入」機能を追加（当日の活動ログを自動取得）。
  - 外部リンクをOSのデフォルトブラウザで開く機能の実装（`openExternal` IPC 追加）。

## [1.3.0] - 2026-03-22
### Added
- **REPORT画面の全面改修 (Phase 1b)**
  - エディタ部を従来のフォーム構造化型から、マークダウンフリーエディタ型に刷新。
  - マークダウンツールバー（太字、斜体、取り消し線、見出し、リスト、コード）の実装。
  - 日報・週報テンプレート挿入機能。
  - 右クリックコンテキストメニューによるプロジェクト名・タスク名のクイック挿入。
- **Google Chat 連携の強化**
  - `useGoogleChatMd` composable による Google Chat 独自マークダウン仕様への相互変換。
  - 送信前の「GOOGLE CHAT」プレビューモードを追加。実際のチャット画面に近い見た目で確認可能。
- **GitHub Issue 自動進捗コメント (FR-007)**
  - 日報送信成功時、関連する GitHub Issue へ進捗コメントを自動投稿する機能を実装。
  - `useGitHubREST` composable による GitHub API 操作の共通化。
- **SETTINGS画面の更新**
  - GitHub Issue 自動コメント機能の有効/無効切り替えトグルを追加。

## [1.2.0] - 2026-03-22
### Added
- **プロジェクトタグ機能 (Phase 1a)**
  - PROJECTS画面で各プロジェクトにマルチタグを付与できるUIを実装。
  - TASKS画面（Dashboard）に「BY TAG」トグルを追加。タグ > プロジェクト > タスクの2階層グルーピング表示を実現。
  - `useProjects` composableによるプロジェクトデータ管理の共通化。
- **データ連携・追跡の強化**
  - アキュムレーション（日報収集データ）分配時、反映先タスクファイルが存在しない場合の自動作成機能を追加。
  - プロジェクトメタデータの自動同期・補完ロジックの改善。
  - TASK.mdテンプレートおよびワークフローにGitHub Issue番号参照フィールドを追加。

## [1.1.0] - 2026-03-18
### Added
- フォントサイズ調整機能の追加
  - 設定画面（SETTINGS）からのフォントサイズ（12px 〜 32px）変更。
  - キーボードショートカット (`Ctrl + +`, `Ctrl + -`, `Ctrl + 0`) による動的なサイズ変更。
  - `localStorage` への保存および起動時の自動適用。
- Tailwind CSS へのカスタムフォントサイズ (`xxs`, `tiny`) の追加。
