# PodGraph — Drops & Progress

## 1. Tracks ロードマップ

| Track | 名称 | 状態 | 概要 |
| :--- | :--- | :--- | :--- |
| Track A | コア相関図・データ拡充 | 完了 | 人物/番組モード切替、力学グラフ、検索、詳細ポップアップ、ポッドキャスター/番組/共演エピソードデータの拡充・リファクタリング |
| Track B | Design.md 準拠 & Orchestration 連携 | 完了 | デフォルト Light テーマ化、標準 CSS トークン、Canvas 描画連動、Escape 閉鎖、`tabular-nums`、ポート 8010/8060 登録、Design Quality Gate テスト追加 |

## 2. Track 詳細

### Track A: コア相関図・データ拡充
- `react-force-graph-2d` による人物・番組 2 モードの相関図描画とポインター判定 (`hitTest.ts`, `graphRenderer.ts`)
- `DetailPopup` のコンポーネント分割 (`src/components/detail/*`)
- 名寄せ・番組/エピソードデータ拡充 (`src/data/*.json`)

### Track B: Design.md 準拠 & Orchestration 連携
- `src/index.css` への標準 Slate & Blue カラートークン定義（`:root, [data-theme="light"]` / `[data-theme="dark"]`）
- `HeaderBar` への Light/Dark テーマ切替トグル追加（`podgraph_theme` で永続化）および `GraphCanvas` / `graphRenderer` のテーマ連動
- `DetailPopup` / 検索候補の `Escape` キー閉鎖、`tabular-nums` 適用、リンク順固定（Spotify → Pocket Casts）
- `D:\dev\Orchestration` ポート登録 (`8010` / `8060`) および `start.bat` / `stop.bat` / `AGENTS.md` / `Drops.md` 整備
- Design Quality Gate テスト追加 (`src/lib/__tests__/designCompliance.test.ts`)

## 3. 完了済み Drops 一覧

| Drop | 内容 | 検証結果 |
| :--- | :--- | :--- |
| Drop 1 | 初期相関図アプリ構築・データ追加・詳細ポップアップ分割リファクタリング | `npm test` / `npm run build` PASS |
| Drop 2 | `Design.md` 準拠（Light テーマ標準化・Canvas 連動・Escape 閉鎖・`tabular-nums`）＆ Orchestration ポート 8010/8060 連携 | `npm test` (6 files / 18 tests PASS) / `npm run build` PASS |
| Drop 3 | 朝日新聞ポッドキャスト『MEDIA TALK メディアトーク』追加および共演エピソード登録 | `npm test` (6 files / 18 tests PASS) / `npm run build` PASS |
| Drop 4 | 番組モードにおける公式アートワーク画像の完全対応＆番組タイトルラベルの非表示化 | `npm test` (6 files / 18 tests PASS) / `npm run build` PASS |
| Drop 5 | トリカゴ放送（Spotify showリンク・公式アートワーク）＆さばラジオ（Pocket Castsアートワーク・Spotifyなし対応）反映 | `npm test` (6 files / 18 tests PASS) / `npm run build` PASS |
| Drop 6 | ゆる言語学ラジオ・ちりぬる・海外ブラックロードおよび既存番組（MEDIA TALK・トリカゴ放送）へのゲスト共演回追加 | `npm test` (6 files / 18 tests PASS) / `npm run build` PASS |

## 4. アーカイブ詳細

- **Drop 1**: コミット `0d08259` までに、`DetailPopup.tsx` の `src/components/detail/*` への分割、データ整合性テスト、多数のポッドキャスト番組・パーソナリティ・共演エピソードの追加を実施。
- **Drop 2**: `Design.md` および `GLOBAL_RULES.md` (§3-7, §5, §6) に基づき、UI トークン化・テーマ連動・起動/停止スクリプト・自動品質検証テストを導入。
