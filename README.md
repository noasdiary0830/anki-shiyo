# Anki自動問題生成・登録ツール

医学テキストのPDFをアップロードすると、Claude AIが自動で問題を生成し、AnkiConnectを通じてAnkiに直接登録するWebアプリケーションです。

## 機能

- PDFアップロード（ドラッグ＆ドロップ対応）
- Claude AIによる一問一答カード自動生成（最大200問）
- Web検索による補足解説の自動追加（※AI補足説明 + 参考URL）
- 問題の個別選択・確認UI（全選択 / 全解除）
- AnkiConnectを通じたAnkiへの直接登録
- デッキ作成・既存デッキ選択・タグ付け

## セットアップ

### 1. AnkiConnectのインストール

1. Ankiを開き、**ツール → アドオン → アドオンを取得** を選択
2. アドオンコード `2055492159` を入力してインストール
3. Ankiを再起動

### 2. AnkiConnectのCORS設定

1. **ツール → アドオン → AnkiConnect → 設定** を開く
2. `webCorsOriginList` に以下を追加:

```json
[
  "https://your-app.vercel.app",
  "http://localhost:3000"
]
```

3. Ankiを再起動

### 3. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集して Anthropic API キーを設定:

```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 4. 開発サーバーの起動

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## Vercelへのデプロイ

1. GitHubリポジトリをVercelに接続
2. 環境変数 `ANTHROPIC_API_KEY` をVercelのダッシュボードで設定
3. AnkiConnectのCORSリストにデプロイ先のURLを追加

## 技術スタック

- **フロントエンド**: Next.js (App Router) + Tailwind CSS
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Web検索**: Claude Web Search Tool
- **PDF処理**: pdf-parse
- **Anki連携**: AnkiConnect (localhost:8765)

## 使い方

1. Ankiを起動した状態でアプリにアクセス
2. PDFをアップロードして単元名と問題数を設定
3. 「問題を生成する」をクリック（数分かかります）
4. 生成された問題を確認・選択
5. デッキ名・タグを設定して「Ankiに登録」をクリック

## ディレクトリ構成

```
app/
├── page.tsx                  # アップロード画面
├── generating/page.tsx       # 生成中画面
├── review/page.tsx           # 問題確認・選択画面
└── result/page.tsx           # 登録完了画面
app/api/
├── generate/route.ts         # PDF解析 + 問題生成 + 補足解説
└── extract-images/route.ts   # PDF画像抽出（将来拡張用）
lib/
├── anki.ts                   # AnkiConnect API クライアント
├── claude.ts                 # Claude API クライアント
└── pdf.ts                    # PDF解析ユーティリティ
components/
├── CardPreview.tsx           # 問題カードプレビュー
└── DeckSelector.tsx          # デッキ選択
types/
└── index.ts                  # 型定義
```
