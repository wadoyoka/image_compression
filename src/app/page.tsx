'use client';

import { useState, useCallback } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ImageProcessor from '@/components/ImageProcessor';

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  processed?: string;
  originalSize: number;
  compressedSize?: number;
}

export default function Home() {
  const [images, setImages] = useState<ImageFile[]>([]);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    const imageFiles: ImageFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      file,
      preview: URL.createObjectURL(file),
      originalSize: file.size,
    }));
    setImages(prev => [...prev, ...imageFiles]);
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      // Clean up object URLs
      const removed = prev.find(img => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
        if (removed.processed) {
          URL.revokeObjectURL(removed.processed);
        }
      }
      return updated;
    });
  }, []);

  const handleImageProcessed = useCallback((id: string, processedUrl: string, compressedSize: number) => {
    setImages(prev => prev.map(img => 
      img.id === id 
        ? { ...img, processed: processedUrl, compressedSize }
        : img
    ));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">画像圧縮ツール</h1>
          <p className="text-gray-600">画像を簡単に圧縮・リサイズ・形式変換できます</p>
        </header>

        <div className="max-w-4xl mx-auto">
          <ImageUploader onFilesSelected={handleFilesSelected} />
          
          {images.length > 0 && (
            <ImageProcessor 
              images={images}
              onRemoveImage={handleRemoveImage}
              onImageProcessed={handleImageProcessed}
            />
          )}
        </div>
      </div>
    </div>
  );
}
