export interface ElectronAPI {
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  send: (channel: string, args: unknown) => void;
  compressImage: (data: CompressImageData) => Promise<CompressImageResult>;
  compressBatch: (data: CompressBatchData) => Promise<CompressBatchResult>;
  isElectron: boolean;
}

export interface CompressImageData {
  buffer: ArrayBuffer;
  type: string;
  size: number;
  quality: number;
  width?: number;
  height?: number;
  format: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio: boolean;
}

export interface CompressImageResult {
  success?: boolean;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: string;
  originalDimensions?: { width: number; height: number };
  compressedDimensions?: { width: number; height: number };
  compressedImage?: string;
}

export interface CompressBatchData {
  files: Array<{
    buffer: ArrayBuffer;
    name: string;
    type: string;
    size: number;
  }>;
  quality: number;
  width?: number;
  height?: number;
  format: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio: boolean;
}

export interface CompressBatchResult {
  success?: boolean;
  error?: string;
  results?: Array<{
    originalName: string;
    compressedName: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: string;
  }>;
  zipFile?: string;
  zipSize?: number;
  totalOriginalSize?: number;
  totalCompressedSize?: number;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
