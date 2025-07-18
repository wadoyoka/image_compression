# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要
画像圧縮・変換Webアプリケーション。ユーザーが画像をアップロードし、品質調整・リサイズ・形式変換を行える高機能な画像処理ツール。

## 技術スタック
- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **画像処理**: Sharp (サーバーサイド)
- **UI**: Tailwind CSS (現在) → 将来的にMaterial-UI (MUI)に移行予定
- **パッケージマネージャー**: npm

## 開発コマンド
```bash
# 開発サーバー起動 (Turbopack使用)
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# Linting実行
npm run lint
```

## アーキテクチャ
### 現在の状態
- Next.js 15の新しいApp Routerを使用
- `src/app/`ディレクトリ構成
- TypeScriptの厳格モード有効

### 今後実装予定の機能
1. **ZIP一括ダウンロード**: 複数画像の圧縮ダウンロード
2. **進捗表示の改善**: より詳細な処理状況表示
3. **画像フォーマット拡張**: AVIF、HEIC等の対応検討
4. **UI/UX改善**: Material-UI導入とデザイン向上

### パス設定
- `@/*`エイリアスで`./src/*`にアクセス可能

## 対応画像形式・制限
- **入力**: JPEG, PNG, WebP
- **出力**: JPEG, PNG, WebP (相互変換)
- **ファイルサイズ制限**: 最大1GB（1024MB）
- **処理エンジン**: Sharp (高性能画像処理ライブラリ)

## 実装済み機能
- Sharp によるサーバーサイド画像圧縮
- `/api/compress` エンドポイント経由での処理
- 品質調整、リサイズ、形式変換 (JPEG/PNG/WebP)
- ファイルサイズ制限: 最大1GB
- 圧縮率計算とメタデータ取得
- バッチ処理対応とエラーハンドリング