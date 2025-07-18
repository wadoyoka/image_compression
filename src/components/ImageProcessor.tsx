'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { ImageFile } from '@/app/page';

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
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageFile.preview;
      });

      let { width, height } = img;
      
      if (settings.width || settings.height) {
        if (settings.maintainAspectRatio) {
          const aspectRatio = width / height;
          if (settings.width && settings.height) {
            const targetRatio = settings.width / settings.height;
            if (aspectRatio > targetRatio) {
              width = settings.width;
              height = settings.width / aspectRatio;
            } else {
              height = settings.height;
              width = settings.height * aspectRatio;
            }
          } else if (settings.width) {
            width = settings.width;
            height = settings.width / aspectRatio;
          } else if (settings.height) {
            height = settings.height;
            width = settings.height * aspectRatio;
          }
        } else {
          width = settings.width || width;
          height = settings.height || height;
        }
      }

      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        
        const mimeType = `image/${settings.format}`;
        const quality = settings.quality / 100;
        
        canvas.toBlob((blob) => {
          if (blob) {
            const processedUrl = URL.createObjectURL(blob);
            onImageProcessed(imageFile.id, processedUrl, blob.size);
          }
        }, mimeType, quality);
      }
    } catch (error) {
      console.error('画像処理エラー:', error);
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageFile.id);
        return newSet;
      });
    }
  }, [settings, onImageProcessed]);

  const downloadImage = useCallback((imageFile: ImageFile) => {
    const url = imageFile.processed || imageFile.preview;
    const extension = settings.format === 'jpeg' ? 'jpg' : settings.format;
    const filename = `compressed_${imageFile.file.name.split('.')[0]}.${extension}`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [settings.format]);

  const downloadAll = useCallback(() => {
    images.forEach(image => {
      if (image.processed) {
        downloadImage(image);
      }
    });
  }, [images, downloadImage]);

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

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => images.forEach(processImage)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            すべて圧縮
          </button>
          <button
            onClick={downloadAll}
            disabled={!images.some(img => img.processed)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            すべてダウンロード
          </button>
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
              <button
                onClick={() => onRemoveImage(imageFile.id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
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
                <button
                  onClick={() => processImage(imageFile)}
                  disabled={processing.has(imageFile.id)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
                >
                  {processing.has(imageFile.id) ? '処理中...' : '圧縮'}
                </button>
                {imageFile.processed && (
                  <button
                    onClick={() => downloadImage(imageFile)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    ダウンロード
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}