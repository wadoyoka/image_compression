'use client';

import { useCallback, useState } from 'react';
import LoadingButton from './LoadingButton';

interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
}

export default function ImageUploader({ onFilesSelected }: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [isFolderLoading, setIsFolderLoading] = useState(false);

  const processEntry = useCallback(async (entry: FileSystemEntry, files: File[]): Promise<void> => {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      return new Promise((resolve) => {
        fileEntry.file((file) => {
          if (file.type.startsWith('image/')) {
            files.push(file);
          }
          resolve();
        });
      });
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const reader = dirEntry.createReader();
      return new Promise((resolve) => {
        reader.readEntries(async (entries) => {
          for (const childEntry of entries) {
            await processEntry(childEntry, files);
          }
          resolve();
        });
      });
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const items = Array.from(e.dataTransfer.items);
      const files: File[] = [];

      const processItems = async () => {
        for (const item of items) {
          if (item.kind === 'file') {
            const entry = item.webkitGetAsEntry();
            if (entry) {
              await processEntry(entry, files);
            }
          }
        }

        const imageFiles = files.filter((file) => file.type.startsWith('image/'));
        if (imageFiles.length > 0) {
          onFilesSelected(imageFiles);
        }
      };

      processItems();
    },
    [onFilesSelected, processEntry]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        setIsFileLoading(true);
        
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // 短い遅延でローディング表示
          const files = Array.from(e.target.files).filter((file) => file.type.startsWith('image/'));

          if (files.length > 0) {
            onFilesSelected(files);
          }
        } finally {
          setIsFileLoading(false);
        }
      }
    },
    [onFilesSelected]
  );

  const handleFolderButtonClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        setIsFolderLoading(true);
        
        try {
          await new Promise(resolve => setTimeout(resolve, 200)); // フォルダは少し長めの遅延
          const files = Array.from(target.files).filter((file) => file.type.startsWith('image/'));
          if (files.length > 0) {
            onFilesSelected(files);
          }
        } finally {
          setIsFolderLoading(false);
        }
      }
    };
    
    input.click();
  }, [onFilesSelected]);

  return (
    <div className="mb-8">
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="mb-4">
          <p className="text-lg font-medium text-gray-700 mb-2">
            画像ファイルやフォルダをドラッグ&ドロップ または クリックして選択
          </p>
          <p className="text-sm text-gray-500">JPEG、PNG、WebP形式に対応 • フォルダ内の画像ファイルも自動検出</p>
        </div>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          disabled={isFileLoading}
        />

        <div className="flex gap-3">
          <LoadingButton
            type="label"
            htmlFor="file-upload"
            isLoading={isFileLoading}
            variant="blue"
          >
            ファイルを選択
          </LoadingButton>
          
          <LoadingButton
            onClick={handleFolderButtonClick}
            isLoading={isFolderLoading}
            variant="green"
          >
            フォルダを選択
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
