import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'


const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB

function validateFile(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const quality = parseInt(formData.get('quality') as string) || 80
    const width = formData.get('width') ? parseInt(formData.get('width') as string) : undefined
    const height = formData.get('height') ? parseInt(formData.get('height') as string) : undefined
    const format = (formData.get('format') as 'jpeg' | 'png' | 'webp') || 'jpeg'
    const maintainAspectRatio = formData.get('maintainAspectRatio') === 'true'
    
    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 400 }
      )
    }

    if (!validateFile(file)) {
      return NextResponse.json(
        { error: '無効なファイル形式またはサイズが大きすぎます' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    let sharpInstance = sharp(buffer)
    
    // リサイズ処理
    if (width || height) {
      const resizeOptions: sharp.ResizeOptions = {
        fit: maintainAspectRatio ? 'inside' : 'fill',
        withoutEnlargement: true
      }
      
      sharpInstance = sharpInstance.resize(width, height, resizeOptions)
    }
    
    // 形式変換と品質設定
    let compressedBuffer: Buffer
    
    switch (format) {
      case 'jpeg':
        compressedBuffer = await sharpInstance.jpeg({ quality }).toBuffer()
        break
      case 'png':
        compressedBuffer = await sharpInstance.png({ 
          quality,
          compressionLevel: Math.floor((100 - quality) / 10)
        }).toBuffer()
        break
      case 'webp':
        compressedBuffer = await sharpInstance.webp({ quality }).toBuffer()
        break
      default:
        compressedBuffer = await sharpInstance.jpeg({ quality }).toBuffer()
    }
    
    // メタデータ取得
    const metadata = await sharp(buffer).metadata()
    const compressedMetadata = await sharp(compressedBuffer).metadata()
    
    const compressionRatio = ((file.size - compressedBuffer.length) / file.size * 100).toFixed(1)
    
    return NextResponse.json({
      success: true,
      originalSize: file.size,
      compressedSize: compressedBuffer.length,
      compressionRatio: `${compressionRatio}%`,
      originalDimensions: {
        width: metadata.width,
        height: metadata.height
      },
      compressedDimensions: {
        width: compressedMetadata.width,
        height: compressedMetadata.height
      },
      compressedImage: `data:image/${format};base64,${compressedBuffer.toString('base64')}`
    })
    
  } catch (error) {
    console.error('圧縮エラー:', error)
    return NextResponse.json(
      { error: '画像圧縮に失敗しました' },
      { status: 500 }
    )
  }
}