# Next.js 15 ベストプラクティス

## App Router 基本原則

### 1. ディレクトリ構成
\`\`\`
app/
├── globals.css
├── layout.tsx          # ルートレイアウト
├── page.tsx           # ホームページ
├── loading.tsx        # ローディングUI
├── error.tsx          # エラーUI
├── not-found.tsx      # 404ページ
├── compress/
│   ├── page.tsx       # /compress ページ
│   ├── loading.tsx    # 圧縮ページ専用ローディング
│   └── layout.tsx     # 圧縮ページ専用レイアウト
└── api/
    └── compress/
        └── route.ts   # API Route Handler
\`\`\`

### 2. Server Components vs Client Components

#### Server Components（デフォルト）
\`\`\`typescript
// app/components/ImageList.tsx
import { getImages } from '@/lib/api'

export default async function ImageList() {
  const images = await getImages() // サーバーサイドでデータ取得
  
  return (
    <div>
      {images.map(image => (
        <div key={image.id}>{image.name}</div>
      ))}
    </div>
  )
}
\`\`\`

#### Client Components（'use client'が必要）
\`\`\`typescript
'use client'

import { useState } from 'react'
import { Button } from '@mui/material'

export default function ImageUploader() {
  const [files, setFiles] = useState<File[]>([])
  
  return (
    <Button onClick={() => setFiles([])}>
      アップロード
    </Button>
  )
}
\`\`\`

## TypeScript 設定

### 1. 厳密な型定義
\`\`\`typescript
// types/image.ts
export interface ImageFile {
  id: string
  name: string
  size: number
  type: 'jpeg' | 'png' | 'webp'
  url: string
  compressedUrl?: string
}

export interface CompressionSettings {
  quality: number // 1-100
  width?: number
  height?: number
  format: 'jpeg' | 'png' | 'webp'
  maintainAspectRatio: boolean
}
\`\`\`

### 2. API Route の型安全性
\`\`\`typescript
// app/api/compress/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 400 }
      )
    }
    
    // 圧縮処理...
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: '圧縮に失敗しました' },
      { status: 500 }
    )
  }
}
\`\`\`

## パフォーマンス最適化

### 1. 画像最適化
\`\`\`typescript
import Image from 'next/image'

export default function ImagePreview({ src, alt }: { src: string, alt: string }) {
  return (
    <Image
      src={src || "/placeholder.svg"}
      alt={alt}
      width={300}
      height={200}
      priority={false} // 重要な画像のみtrue
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..." // 低品質プレースホルダー
    />
  )
}
\`\`\`

### 2. 動的インポート
\`\`\`typescript
'use client'

import { lazy, Suspense } from 'react'
import { CircularProgress } from '@mui/material'

const ImageEditor = lazy(() => import('@/components/ImageEditor'))

export default function CompressPage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <ImageEditor />
    </Suspense>
  )
}
\`\`\`

### 3. メタデータ最適化
\`\`\`typescript
// app/compress/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '画像圧縮 | Image Compressor',
  description: '高品質な画像圧縮ツール。JPEG、PNG、WebPに対応',
  keywords: ['画像圧縮', '画像最適化', 'WebP変換'],
  openGraph: {
    title: '画像圧縮ツール',
    description: '簡単で高品質な画像圧縮',
    type: 'website',
  },
}
\`\`\`

## エラーハンドリング

### 1. エラーバウンダリ
\`\`\`typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>エラーが発生しました</h2>
      <p>{error.message}</p>
      <button onClick={reset}>再試行</button>
    </div>
  )
}
\`\`\`

### 2. ローディング状態
\`\`\`typescript
// app/compress/loading.tsx
import { CircularProgress, Box } from '@mui/material'

export default function Loading() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
      <CircularProgress />
    </Box>
  )
}
\`\`\`

## セキュリティ

### 1. ファイルバリデーション
\`\`\`typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB

export function validateFile(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE
}
\`\`\`

### 2. CSP設定
\`\`\`typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' data: blob:; script-src 'self' 'unsafe-eval';"
          }
        ]
      }
    ]
  }
}
\`\`\`

## 状態管理

### 1. Server Actions の活用
\`\`\`typescript
// app/actions/compress.ts
'use server'

export async function compressImage(formData: FormData) {
  const file = formData.get('file') as File
  
  // 圧縮処理...
  
  return { success: true, compressedUrl: '...' }
}
\`\`\`

### 2. useOptimistic の使用
\`\`\`typescript
'use client'

import { useOptimistic } from 'react'

export default function ImageList({ images }: { images: ImageFile[] }) {
  const [optimisticImages, addOptimisticImage] = useOptimistic(
    images,
    (state, newImage: ImageFile) => [...state, newImage]
  )
  
  return (
    <div>
      {optimisticImages.map(image => (
        <div key={image.id}>{image.name}</div>
      ))}
    </div>
  )
}
\`\`\`

## 開発・デバッグ

### 1. 環境変数
\`\`\`typescript
// .env.local
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
COMPRESSION_QUALITY_DEFAULT=80
\`\`\`

### 2. ログ出力
\`\`\`typescript
// lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data)
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error)
  }
}
\`\`\`

## 禁止事項

❌ **やってはいけないこと**
- Client Componentで不要な'use client'の使用
- Server Componentでのブラウザ専用APIの使用
- pages/ディレクトリとapp/ディレクトリの混在
- 未検証のファイルアップロードの許可
- メタデータの設定忘れ

✅ **推奨事項**
- Server Componentを優先的に使用
- 適切な型定義の実装
- エラーハンドリングの徹底
- パフォーマンス測定の実施
- セキュリティ対策の実装
