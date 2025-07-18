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