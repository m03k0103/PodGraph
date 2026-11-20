# PodGraph セキュリティスキャン (OWASP ZAP DAST)

本プロジェクトでは、GitHub Actions (`.github/workflows/zap-dast.yml`) により OWASP ZAP (`ghcr.io/zaproxy/zaproxy:stable`) を用いた動的脆弱性スキャン（DAST）を自動実行しています。

## 1. CI/CD パイプライン仕様

| 項目 | 設定内容 |
| :--- | :--- |
| **PR / `main` プッシュ時** | `zap-baseline.py`（パッシブスキャン中心・高速チェック） |
| **定期実行（毎週日曜 04:00 JST）/ 手動実行 (`full`)** | `zap-full-scan.py`（アクティブスキャンを含む詳細チェック） |
| **CI 対象サーバー** | `http://127.0.0.1:8010/index.html`（CI 環境内で一時起動するローカルサーバーのみ） |
| **失敗基準** | **High** (`riskcode == 3`) 検出時のみ CI 失敗 (`exit 1`)。Medium / Low は警告出力のみ |
| **レポート保管** | Artifact `zap-scan-report`（HTML / JSON / Markdown）＋ Job Summary ＋ PR コメント |

> **安全制約**: `.zap/evaluate_zap_report.py --validate-target` により、`127.0.0.1` / `localhost` / `host.docker.internal` 以外の外部 URL や本番 URL へのスキャンは実行前に拒否されます。

## 2. ローカル環境での再現手順

Docker Desktop / Docker Engine がインストールされている環境で、ローカルサーバーを起動してからスキャンを実行してください。

### ステップ 1: ローカルサーバー起動（別ターミナル）

```bash
npm run build && python3 scripts/serve_dist.py --port 8010 --directory dist --bind 127.0.0.1
```

### ステップ 2: ZAP ベースラインスキャン実行

**Bash / Git Bash / WSL の場合:**
```bash
./scripts/run-zap-scan.sh baseline
```

**Windows PowerShell の場合:**
```powershell
.\scripts\run-zap-scan.ps1 -ScanMode baseline
```

**Docker ワンライナーで直接実行する場合:**
```bash
mkdir -p .zap/reports && cp .zap/rules.tsv .zap/reports/rules.tsv
docker run --rm --add-host=host.docker.internal:host-gateway \
  -v "$(pwd)/.zap/reports:/zap/wrk/:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://host.docker.internal:8010/index.html \
  -c rules.tsv -J report_json.json -w report_md.md -r report_html.html -I
```

スキャン完了後、`.zap/reports/report_html.html` および `.zap/reports/summary.md` に結果が出力されます。

## 3. ルールチューニング方法 (`.zap/rules.tsv`)

誤検知（False Positive）やテスト環境特有の無害なヘッダー警告を調整する場合は、`.zap/rules.tsv` を編集します。

- 形式は **必ず TAB (`\t`) 区切り**（`<plugin_id>\t<IGNORE|WARN|FAIL|OUTOFSCOPE>\t(<説明またはURL正規表現>)`）を使用してください。
- 例: 特定ルールを無効化する場合:
  ```tsv
  10038	IGNORE	(Content Security Policy Header Not Set - managed by CDN)
  ```
- 詳細な共通仕様は `D:\dev\Orchestration\docs\security-scan.md` を参照してください。

## 4. セキュリティヘッダー設定 (Track C)

初回 DAST スキャンで検出されたヘッダー未設定および `Server` バージョン露出に対応するため、以下のハードニングを実施しています。

- **単一設定ファイル (`scripts/security-headers.json`)**: `Content-Security-Policy`、`X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、`Referrer-Policy`、`Permissions-Policy`、`Cross-Origin-Opener-Policy: same-origin`、`Cross-Origin-Embedder-Policy: credentialless`、`Cross-Origin-Resource-Policy: same-origin`、`Cache-Control` および `<meta>` 用 CSP (`metaCsp`) を一元定義。
- **ハードニング配信サーバー (`scripts/serve_dist.py`)**: `start.bat` および CI (`.github/workflows/zap-dast.yml`) で共通利用し、200/404 を含む全レスポンスへ上記ヘッダーを付与するとともに、`Server` ヘッダーの隠蔽およびディレクトリ一覧表示の抑止（404 返却）を行います。
- **ビルド時 `<meta>` CSP 注入 (`vite.config.ts`)**: 本番ビルド時 (`apply: 'build'`) のみ `dist/index.html` の `<head>` に `<meta http-equiv="Content-Security-Policy">` を注入し、GitHub Pages 上でも CSP を適用します（`npm run dev` の Vite HMR には影響しません）。
- **外部アートワーク両立設計**: 多数のポッドキャスト配信 CDN からカバー画像を読み込むため `img-src 'self' data: https:` と `Cross-Origin-Embedder-Policy: credentialless` を採用し、サイト分離と外部画像表示を両立しています。また `react-force-graph-2d` / `float-tooltip` の CSS ルールを `src/index.css` へ外出しし、ビルド時に動的 `<style>` 挿入を除去することで `style-src 'self'`（`'unsafe-inline'`・ハッシュ不要）を実現しています。
