'use client';

import { useCallback, useState } from 'react';

interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
}

export default function ImageUploader({ onFilesSelected }: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDirectoryMode, setIsDirectoryMode] = useState(false);

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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files).filter((file) => file.type.startsWith('image/'));

        if (files.length > 0) {
          onFilesSelected(files);
        }
      }
    },
    [onFilesSelected]
  );

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

        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isDirectoryMode}
              onChange={(e) => setIsDirectoryMode(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">フォルダを選択</span>
          </label>
        </div>

        <input
          type="file"
          multiple={!isDirectoryMode}
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          {...(isDirectoryMode ? { webkitdirectory: true, directory: true } : {})}
        />

        <label
          htmlFor="file-upload"
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white cursor-pointer ${
            isDirectoryMode ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {isDirectoryMode ? 'フォルダを選択' : 'ファイルを選択'}
        </label>
      </div>
    </div>
  );
}
