# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要
画像圧縮・変換Webアプリケーション。ユーザーが画像をアップロードし、品質調整・リサイズ・形式変換を行える高機能な画像処理ツール。

## 技術スタック
- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
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
1. **画像アップロード**: ドラッグ&ドロップ対応、複数ファイル選択
2. **画像処理**: 品質調整(1-100%)、リサイズ、形式変換(JPEG/PNG/WebP)
3. **バッチ処理**: 複数画像の一括処理と進捗表示
4. **ダウンロード**: 個別・ZIP一括ダウンロード対応

### パス設定
- `@/*`エイリアスで`./src/*`にアクセス可能

## 対応画像形式
- **入力**: JPEG, PNG, WebP
- **出力**: JPEG, PNG, WebP (相互変換)

## 注意事項
- クライアントサイドでの画像処理を想定
- バッチ処理時の進捗表示とパフォーマンス考慮が必要
- ファイルサイズ比較表示機能を含む