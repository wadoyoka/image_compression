import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import JSZip from 'jszip'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB

function validateFile(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const quality = parseInt(formData.get('quality') as string) || 80
    const width = formData.get('width') ? parseInt(formData.get('width') as string) : undefined
    const height = formData.get('height') ? parseInt(formData.get('height') as string) : undefined
    const format = (formData.get('format') as 'jpeg' | 'png' | 'webp') || 'jpeg'
    const maintainAspectRatio = formData.get('maintainAspectRatio') === 'true'
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 400 }
      )
    }

    // すべてのファイルをバリデーション
    for (const file of files) {
      if (!validateFile(file)) {
        return NextResponse.json(
          { error: `無効なファイル形式またはサイズが大きすぎます: ${file.name}` },
          { status: 400 }
        )
      }
    }

    const zip = new JSZip()
    const results = []

    // 各ファイルを処理してZIPに追加
    for (const file of files) {
      try {
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
        
        // ファイル名の拡張子を変更
        const extension = format === 'jpeg' ? 'jpg' : format
        const originalName = file.name.split('.')[0]
        const compressedFileName = `compressed_${originalName}.${extension}`
        
        // ZIPにファイルを追加
        zip.file(compressedFileName, compressedBuffer)
        
        // メタデータ取得
        const metadata = await sharp(buffer).metadata()
        const compressedMetadata = await sharp(compressedBuffer).metadata()
        
        const compressionRatio = ((file.size - compressedBuffer.length) / file.size * 100).toFixed(1)
        
        results.push({
          originalName: file.name,
          compressedName: compressedFileName,
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
          }
        })
      } catch (error) {
        console.error(`ファイル処理エラー (${file.name}):`, error)
        return NextResponse.json(
          { error: `ファイル処理に失敗しました: ${file.name}` },
          { status: 500 }
        )
      }
    }

    // ZIPファイルを生成
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    
    // ZIPファイルをBase64として返す
    return NextResponse.json({
      success: true,
      results,
      zipFile: `data:application/zip;base64,${zipBuffer.toString('base64')}`,
      zipSize: zipBuffer.length,
      totalOriginalSize: results.reduce((sum, result) => sum + result.originalSize, 0),
      totalCompressedSize: results.reduce((sum, result) => sum + result.compressedSize, 0)
    })
    
  } catch (error) {
    console.error('バッチ圧縮エラー:', error)
    return NextResponse.json(
      { error: '画像のバッチ圧縮に失敗しました' },
      { status: 500 }
    )
  }
}