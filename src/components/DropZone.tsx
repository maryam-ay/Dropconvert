import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export default function DropZone({ onFilesSelected }: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setErrorText(null);

    const filesArray = Array.from(fileList);
    const validFiles: File[] = [];
    let skippedCount = 0;

    filesArray.forEach((file) => {
      // Check for image MIME type or common image extension
      const isImage = file.type.startsWith('image/') || 
        /\.(png|jpe?g|webp|gif|bmp|svg|avif|tiff|ico|heic)$/i.test(file.name);
      
      if (isImage) {
        validFiles.push(file);
      } else {
        skippedCount++;
      }
    });

    if (skippedCount > 0) {
      setErrorText(
        `Skipped ${skippedCount} file${skippedCount > 1 ? 's' : ''} (only common image formats are supported).`
      );
      // Automatically clear warning after 5 seconds
      setTimeout(() => setErrorText(null), 6000);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="dropzone-container" className="w-full space-y-3">
      <div
        id="drag-drop-area"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onButtonClick();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Upload image files. Drag and drop images here, or click to browse."
        className={`relative flex flex-col items-center justify-center w-full p-8 text-center border border-dashed rounded-xl cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-950/20 scale-[0.995]'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/35 bg-white dark:border-slate-800 dark:bg-neutral-900/40 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-950/10'
        } group`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="file-input-raw"
          multiple
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          tabIndex={-1}
        />

        <div id="dropzone-inner" className="flex flex-col items-center pointer-events-none select-none">
          <div 
            id="dropzone-icon-bg"
            className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/40 text-slate-400 dark:text-neutral-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
          >
            <Upload id="dropzone-upload-icon" className="w-8 h-8 animate-pulse" />
          </div>
          
          <h2 id="dropzone-prompt" className="text-lg font-semibold text-slate-700 dark:text-neutral-200">
            Drop your images here
          </h2>
          
          <p id="dropzone-subprompt" className="text-sm text-slate-400 dark:text-neutral-400 mt-1 mb-4">
            Drag and drop or click to browse (supports batch select)
          </p>

          <button 
            type="button"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-sm transition-colors"
          >
            Select Files
          </button>
        </div>
      </div>

      {errorText && (
        <div
          id="dropzone-error"
          role="alert"
          className="flex items-center gap-2 p-3 text-xs font-medium border rounded-lg bg-red-50 text-red-800 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-950/40"
        >
          <AlertCircle id="error-alert-icon" className="w-4 h-4 shrink-0" />
          <span>{errorText}</span>
        </div>
      )}
    </div>
  );
}
