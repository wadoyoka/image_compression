'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { ImageFile } from '@/app/page';
import LoadingButton from './LoadingButton';

interface ImageProcessorProps {
  images: ImageFile[];
  onRemoveImage: (id: string) => void;
  onImageProcessed: (id: string, processedUrl: string, compressedSize: number) => void;
}

interface ProcessingSettings {
  quality: number;
  width?: number;
  height?: number;
  format: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio: boolean;
}

const defaultSettings: ProcessingSettings = {
  quality: 80,
  format: 'jpeg',
  maintainAspectRatio: true,
};

export default function ImageProcessor({ images, onRemoveImage, onImageProcessed }: ImageProcessorProps) {
  const [settings, setSettings] = useState<ProcessingSettings>(defaultSettings);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [isZipDownloading, setIsZipDownloading] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processImage = useCallback(async (imageFile: ImageFile) => {
    setProcessing(prev => new Set(prev).add(imageFile.id));
    
    try {
      const formData = new FormData();
      formData.append('file', imageFile.file);
      formData.append('quality', settings.quality.toString());
      formData.append('format', settings.format);
      formData.append('maintainAspectRatio', settings.maintainAspectRatio.toString());
      
      if (settings.width) {
        formData.append('width', settings.width.toString());
      }
      if (settings.height) {
        formData.append('height', settings.height.toString());
      }
      
      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('圧縮に失敗しました');
      }
      
      const result = await response.json();
      
      if (result.success) {
        onImageProcessed(imageFile.id, result.compressedImage, result.compressedSize);
      } else {
        throw new Error(result.error || '圧縮に失敗しました');
      }
    } catch (error) {
      console.error('画像処理エラー:', error);
      alert('画像の圧縮に失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageFile.id);
        return newSet;
      });
    }
  }, [settings, onImageProcessed]);

  const downloadImage = useCallback((imageFile: ImageFile) => {
    if (!imageFile.processed) return;
    
    const extension = settings.format === 'jpeg' ? 'jpg' : settings.format;
    const filename = `compressed_${imageFile.file.name.split('.')[0]}.${extension}`;
    
    // data: URLからBlobを作成
    if (imageFile.processed.startsWith('data:')) {
      const byteCharacters = atob(imageFile.processed.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: `image/${settings.format}` });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // URLをクリーンアップ
      URL.revokeObjectURL(url);
    } else {
      // Blob URLの場合
      const a = document.createElement('a');
      a.href = imageFile.processed;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [settings.format]);

  const downloadAll = useCallback(() => {
    images.forEach(image => {
      if (image.processed) {
        downloadImage(image);
      }
    });
  }, [images, downloadImage]);

  const downloadAllAsZip = useCallback(async () => {
    const processedImages = images.filter(img => img.processed);
    if (processedImages.length === 0) return;

    setIsZipDownloading(true);
    try {
      const formData = new FormData();
      
      // 処理済み画像のファイルを追加
      processedImages.forEach(imageFile => {
        formData.append('files', imageFile.file);
      });
      
      formData.append('quality', settings.quality.toString());
      formData.append('format', settings.format);
      formData.append('maintainAspectRatio', settings.maintainAspectRatio.toString());
      
      if (settings.width) {
        formData.append('width', settings.width.toString());
      }
      if (settings.height) {
        formData.append('height', settings.height.toString());
      }
      
      const response = await fetch('/api/compress-batch', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('ZIP作成に失敗しました');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // ZIPファイルをダウンロード
        const byteCharacters = atob(result.zipFile.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `compressed_images_${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
      } else {
        throw new Error(result.error || 'ZIP作成に失敗しました');
      }
    } catch (error) {
      console.error('ZIP作成エラー:', error);
      alert('ZIPファイルの作成に失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
    } finally {
      setIsZipDownloading(false);
    }
  }, [images, settings]);

  const processBatch = useCallback(async () => {
    setIsBatchProcessing(true);
    try {
      await Promise.all(images.map(processImage));
    } finally {
      setIsBatchProcessing(false);
    }
  }, [images, processImage]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">圧縮設定</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              品質: {settings.quality}%
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={settings.quality}
              onChange={(e) => setSettings(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              形式
            </label>
            <select
              value={settings.format}
              onChange={(e) => setSettings(prev => ({ ...prev, format: e.target.value as 'jpeg' | 'png' | 'webp' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              幅 (px)
            </label>
            <input
              type="number"
              placeholder="元のサイズ"
              value={settings.width || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, width: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              高さ (px)
            </label>
            <input
              type="number"
              placeholder="元のサイズ"
              value={settings.height || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, height: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.maintainAspectRatio}
              onChange={(e) => setSettings(prev => ({ ...prev, maintainAspectRatio: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">アスペクト比を維持</span>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <LoadingButton
            onClick={processBatch}
            isLoading={isBatchProcessing}
            variant="blue"
          >
            すべて圧縮
          </LoadingButton>
          
          <LoadingButton
            onClick={downloadAll}
            disabled={!images.some(img => img.processed)}
            variant="green"
          >
            すべてダウンロード
          </LoadingButton>
          
          <LoadingButton
            onClick={downloadAllAsZip}
            isLoading={isZipDownloading}
            disabled={!images.some(img => img.processed)}
            variant="purple"
          >
            ZIPでダウンロード
          </LoadingButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((imageFile) => (
          <div key={imageFile.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative">
              <Image
                src={imageFile.processed || imageFile.preview}
                alt="プレビュー"
                width={300}
                height={200}
                className="w-full h-48 object-cover"
              />
              <LoadingButton
                onClick={() => onRemoveImage(imageFile.id)}
                variant="red"
                size="sm"
                className="absolute top-2 right-2 !w-6 !h-6 !p-0 rounded-full !text-sm"
              >
                ×
              </LoadingButton>
            </div>
            
            <div className="p-4">
              <h3 className="font-medium text-gray-800 mb-2 truncate">
                {imageFile.file.name}
              </h3>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div>元のサイズ: {formatBytes(imageFile.originalSize)}</div>
                {imageFile.compressedSize && (
                  <div>
                    圧縮後: {formatBytes(imageFile.compressedSize)}
                    <span className="text-green-600 ml-1">
                      ({Math.round((1 - imageFile.compressedSize / imageFile.originalSize) * 100)}% 削減)
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <LoadingButton
                  onClick={() => processImage(imageFile)}
                  isLoading={processing.has(imageFile.id)}
                  variant="blue"
                  size="sm"
                  className="flex-1"
                >
                  圧縮
                </LoadingButton>
                
                {imageFile.processed && (
                  <LoadingButton
                    onClick={() => downloadImage(imageFile)}
                    variant="green"
                    size="sm"
                    className="flex-1"
                  >
                    ダウンロード
                  </LoadingButton>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}