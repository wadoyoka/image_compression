# 画像圧縮ツール (Image Compressor)

ユーザーが画像をアップロードし、品質調整・リサイズ・形式変換を行える Web アプリケーション。  
直感的な GUI でバッチ処理にも対応した高機能な画像圧縮ツールです。

## 🌟 主要機能

### 📁 画像アップロード
- **ドラッグ&ドロップ対応**: 簡単に画像をアップロード
- **複数ファイル同時選択**: 一度に複数の画像を処理
- **大容量ファイル対応**: 最大1GBまでの画像ファイルをサポート
- **プレビュー表示**: アップロード前に画像を確認

### ⚙️ 圧縮設定
- **品質調整**: スライダーでの直感的な品質設定 (1-100%)
- **リサイズ**: 幅・高さの指定、アスペクト比維持オプション
- **形式変換**: JPEG ↔ PNG ↔ WebP の相互変換

### 🔄 バッチ処理
- **複数画像の一括処理**: すべての画像を一度に圧縮
- **個別処理**: 画像ごとに個別に圧縮処理
- **処理状況表示**: リアルタイムで処理状況を確認

### 💾 ダウンロード
- **個別ダウンロード**: 処理済み画像を1つずつダウンロード
- **一括ダウンロード**: すべての処理済み画像をまとめてダウンロード
- **ファイルサイズ比較**: 処理前後のファイルサイズを表示

## 🛠️ 技術スタック

- **フレームワーク**: [Next.js 15](https://nextjs.org) (App Router)
- **言語**: [TypeScript](https://www.typescriptlang.org)
- **画像処理**: [Sharp](https://sharp.pixelplumbing.com/) (高性能な画像処理ライブラリ)
- **スタイリング**: [Tailwind CSS](https://tailwindcss.com)
- **パッケージマネージャー**: npm

## 📋 対応画像形式

- **入力**: JPEG, PNG, WebP
- **出力**: JPEG, PNG, WebP (相互変換可能)

## 🚀 セットアップ

### 前提条件
- Node.js 18.0以上
- npm

### インストールと起動

```bash
# リポジトリをクローン
git clone <repository-url>
cd image_compression

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## 📜 利用可能なスクリプト

```bash
# 開発サーバー起動 (Turbopack使用)
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# コード品質チェック
npm run lint
```

## 🏗️ プロジェクト構造

```
src/
├── app/
│   ├── api/
│   │   └── compress/
│   │       └── route.ts     # Sharp画像圧縮API
│   ├── globals.css          # グローバルスタイル
│   ├── layout.tsx           # ルートレイアウト
│   └── page.tsx             # メインページ
├── components/
│   ├── ImageUploader.tsx    # 画像アップロード機能
│   └── ImageProcessor.tsx   # 画像処理・表示機能
├── types/
│   └── image.ts            # 型定義
docs/
└── Next_Best.md            # Next.js 15 ベストプラクティス
```

## 🎯 使用方法

1. **画像をアップロード**: ドラッグ&ドロップまたはクリックで画像を選択（最大1GB）
2. **設定を調整**: 品質（1-100%）、サイズ、出力形式を指定
3. **圧縮実行**: 個別または一括で画像を処理（Sharpによる高品質圧縮）
4. **結果確認**: 圧縮率とファイルサイズの削減量を確認
5. **ダウンロード**: 処理済み画像をダウンロード

## 🌐 デプロイ

### Vercel (推奨)

最も簡単なデプロイ方法は [Vercel Platform](https://vercel.com/import?filter=next.js) を使用することです。

詳細は [Next.js デプロイメントドキュメント](https://nextjs.org/docs/app/building-your-application/deploying) を参照してください。

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。
