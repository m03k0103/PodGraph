# PodGraph Agent Guidelines

本リポジトリは `C:\Users\m03k0\.gemini\antigravity\rules\GLOBAL_RULES.md` および `D:\dev\Orchestration\Design.md` に準拠する。

## 1. プロジェクト概要 & ポート設定
- **概要**: ポッドキャスター・番組の共演相関図可視化アプリ（React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + `react-force-graph-2d`）
- **専用ポート**: プライマリ `8010` / フォールバック `8060`（`D:\dev\Orchestration\ports.json` 登録済み）
- **起動 / 停止**: `start.bat`（二重起動時は既存サーバー再利用、`.server_port` / `.server_pid` を管理）、`stop.bat`（自プロセスのみ停止）

## 2. デザイン・テーマ規約 (`Design.md` 準拠)
- **デフォルトテーマ**: Light テーマ（`:root, [data-theme="light"]`, `#f8fafc` ベース）。`localStorage` キー `podgraph_theme` で永続化（初期値フォールバック `'light'`）。
- **ドメイン識別色（固定）**:
  - 人物モード / メインMC: エメラルド `#10b981`
  - 番組モード: インディゴ `#6366f1`
  - ゲスト出演: アンバー `#f59e0b`
  - 元MC: スレート `#94a3b8`
  - Spotify: `#1DB954` / Pocket Casts: ローズ (`rose-*`)
- **UI/UX 規約**:
  - ポップアップ・検索ドロップダウンの 3 経路閉鎖保証（`×` ボタン / Canvas 背景クリック / `Escape` キー）
  - 配信日 (`publishedAt`)・件数・ノード/エッジ集計への `tabular-nums` 適用
  - 外部再生リンク順序固定（① Spotify → ② Pocket Casts）
  - 0 件のオプションセクション（元MC等）は非表示維持

## 3. 検証コマンド
- 単体テスト & Design Quality Gate: `npm test`
- 型チェック & 本番ビルド: `npm run build` (`tsc -b && vite build`)
