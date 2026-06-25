import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Play, 
  Ban, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Info,
  Clock,
  Sun,
  Moon
} from 'lucide-react';
import JSZip from 'jszip';

import { ImageFile } from './types';
import { getUniqueFilename } from './utils';
import DropZone from './components/DropZone';
import ConversionQueue from './components/ConversionQueue';
import QualityControl from './components/QualityControl';
import HowItWorks from './components/HowItWorks';

export default function App() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [quality, setQuality] = useState<number>(0.80);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const cancelRef = useRef<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dropconvert_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('dropconvert_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  // Clean up object URLs on unmount to prevent leaks
  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.webpUrl) {
          URL.revokeObjectURL(f.webpUrl);
        }
      });
    };
  }, []);

  // Helper: Create mini thumbnail (saves substantial memory for large files)
  const createMiniThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 80;
          let width = img.naturalWidth;
          let height = img.naturalHeight;

          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(dataUrl);
          } else {
            resolve('');
          }
        } catch {
          resolve('');
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve('');
      };

      img.src = objectUrl;
    });
  };

  // Handle file addition
  const handleFilesSelected = async (newRawFiles: File[]) => {
    const existingNames = new Set<string>(files.map(f => f.name));
    const processedItems: ImageFile[] = [];

    for (const file of newRawFiles) {
      // De-duplicate filename
      const uniqueName = getUniqueFilename(file.name, existingNames);
      existingNames.add(uniqueName);

      // Create WebP target filename by replacing the extension (or appending if none)
      let convertedName = uniqueName;
      const lastDotIndex = convertedName.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        convertedName = convertedName.slice(0, lastDotIndex) + '.webp';
      } else {
        convertedName = convertedName + '.webp';
      }

      // Generate a mini-thumbnail asynchronously
      const thumbnailUrl = await createMiniThumbnail(file);

      processedItems.push({
        id: Math.random().toString(36).substring(2, 11),
        file,
        name: uniqueName,
        size: file.size,
        convertedName,
        convertedSize: null,
        convertedBlob: null,
        status: 'waiting',
        thumbnailUrl: thumbnailUrl || null,
        webpUrl: null
      });
    }

    setFiles(prev => [...prev, ...processedItems]);
  };

  // Convert individual file helper
  const convertImageToWebp = (
    fileItem: ImageFile,
    currentQuality: number
  ): Promise<{ blob: Blob; url: string; size: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(fileItem.file);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 300;
          canvas.height = img.naturalHeight || img.height || 300;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Could not initialize canvas context'));
            return;
          }

          // Render onto transparent canvas (retains transparency)
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              // Revoke the original load objectURL to free memory
              URL.revokeObjectURL(objectUrl);

              if (blob) {
                const url = URL.createObjectURL(blob);
                resolve({
                  blob,
                  url,
                  size: blob.size,
                });
              } else {
                reject(new Error('Failed to generate WebP.'));
              }
            },
            'image/webp',
            currentQuality
          );
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('This image format is either corrupted or not supported/decodable by your browser.'));
      };

      img.src = objectUrl;
    });
  };

  // Orchestrate batch conversion with limited concurrency (3 workers)
  const startBatchConversion = async () => {
    if (isConverting) return;
    setIsConverting(true);
    cancelRef.current = false;

    // Get list of currently convertible files (waiting or failed)
    const itemsToProcess = files.filter(f => f.status === 'waiting' || f.status === 'failed');
    if (itemsToProcess.length === 0) {
      setIsConverting(false);
      return;
    }

    // Set failed/waiting statuses cleanly
    setFiles(prev =>
      prev.map(f => {
        if (f.status === 'failed' || f.status === 'waiting') {
          return { ...f, status: 'waiting', error: undefined };
        }
        return f;
      })
    );

    const queue = [...itemsToProcess];
    const concurrency = 3;

    const worker = async () => {
      while (queue.length > 0 && !cancelRef.current) {
        const item = queue.shift();
        if (!item) break;

        // Mark item as active
        setFiles(prev =>
          prev.map(f => (f.id === item.id ? { ...f, status: 'converting' } : f))
        );

        try {
          const result = await convertImageToWebp(item, quality);

          if (cancelRef.current) {
            URL.revokeObjectURL(result.url);
            // Revert canceled file to waiting state
            setFiles(prev =>
              prev.map(f => (f.id === item.id ? { ...f, status: 'waiting' } : f))
            );
            break;
          }

          setFiles(prev =>
            prev.map(f =>
              f.id === item.id
                ? {
                    ...f,
                    status: 'done',
                    convertedSize: result.size,
                    convertedBlob: result.blob,
                    webpUrl: result.url
                  }
                : f
            )
          );
        } catch (err: any) {
          if (cancelRef.current) {
            setFiles(prev =>
              prev.map(f => (f.id === item.id ? { ...f, status: 'waiting' } : f))
            );
            break;
          }

          setFiles(prev =>
            prev.map(f =>
              f.id === item.id
                ? {
                    ...f,
                    status: 'failed',
                    error: err.message || 'Conversion failed'
                  }
                : f
            )
          );
        }
      }
    };

    // Spin up concurrent workers
    const workers = Array.from({ length: Math.min(concurrency, itemsToProcess.length) }, worker);
    await Promise.all(workers);

    setIsConverting(false);
  };

  // Cancel current running batch
  const handleCancelConversion = () => {
    cancelRef.current = true;
    setIsConverting(false);
    // Any remaining 'converting' or 'waiting' states will be normalized
    setFiles(prev =>
      prev.map(f => {
        if (f.status === 'converting') {
          return { ...f, status: 'waiting' };
        }
        return f;
      })
    );
  };

  // Remove individual file + revoke WebP URL
  const handleRemoveFile = (id: string) => {
    setFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target?.webpUrl) {
        URL.revokeObjectURL(target.webpUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  // Reset/Clear entire queue
  const handleClearQueue = () => {
    files.forEach(f => {
      if (f.webpUrl) {
        URL.revokeObjectURL(f.webpUrl);
      }
    });
    setFiles([]);
    setIsConverting(false);
    cancelRef.current = false;
  };

  // Download individual file
  const handleDownloadFile = (item: ImageFile) => {
    if (!item.webpUrl) return;
    const a = document.createElement('a');
    a.href = item.webpUrl;
    a.download = item.convertedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Compile and download all completed as a single ZIP or individual file
  const handleDownloadZip = async () => {
    const completedFiles = files.filter(f => f.status === 'done' && f.convertedBlob);
    if (completedFiles.length === 0) return;

    if (completedFiles.length === 1) {
      handleDownloadFile(completedFiles[0]);
      return;
    }

    const zip = new JSZip();
    completedFiles.forEach(f => {
      if (f.convertedBlob) {
        zip.file(f.convertedName, f.convertedBlob);
      }
    });

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = 'converted-webp-images.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(zipUrl), 3000);
    } catch (e) {
      alert('Failed to generate ZIP file. Please download files individually.');
    }
  };

  const handleRetryFile = (id: string) => {
    setFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, status: 'waiting', error: undefined } : f))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-neutral-950 dark:text-neutral-100 font-sans transition-colors duration-200 flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 py-8 md:py-10 flex flex-col gap-6 flex-1">
        
        {/* Header Title Grid (Geometric Balance design, clean & modern) */}
        <header id="app-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shrink-0">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 id="app-title" className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
                DropConvert — Convert Images to WebP
              </h1>
              <p id="app-subtitle" className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 tracking-wider uppercase">
                Local Batch Image-to-WebP Converter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-150 dark:border-emerald-900/50 flex items-center gap-2 text-xs font-semibold">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span>100% PRIVATE & OFFLINE</span>
            </div>

            <button
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-neutral-850 shadow-sm transition-colors cursor-pointer flex items-center justify-center"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
            </button>
          </div>
        </header>

        {/* Content Workspace Split-Screen */}
        <main id="app-main" className="flex-1 flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Left Column: Dropzone and Queue table */}
          <div className="flex-1 w-full space-y-6">
            <DropZone onFilesSelected={handleFilesSelected} />

            <p className="text-xs text-slate-400 dark:text-neutral-500 text-center">
              Supports most common image formats (PNG, JPG/JPEG, WebP, GIF, BMP, SVG, AVIF). Some formats depend on your browser.
            </p>

            {files.length > 0 && (
              <ConversionQueue
                files={files}
                onRemoveFile={handleRemoveFile}
                onDownloadFile={handleDownloadFile}
                onRetryFile={handleRetryFile}
                onClearQueue={handleClearQueue}
              />
            )}
          </div>

          {/* Right Column: Settings, statistics & guides */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            {files.length > 0 ? (
              <QualityControl
                quality={quality}
                setQuality={setQuality}
                files={files}
                onConvertAll={startBatchConversion}
                onDownloadZip={handleDownloadZip}
                onClearQueue={handleClearQueue}
                onCancelConversion={handleCancelConversion}
                isConverting={isConverting}
              />
            ) : (
              <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider block pb-2 border-b border-slate-100 dark:border-neutral-800/80">
                  Settings Panel
                </span>
                <p className="text-xs text-slate-400 dark:text-neutral-500 leading-relaxed">
                  Select your image files to unlock compression controls, bulk actions, and file download options.
                </p>
              </div>
            )}

            <HowItWorks />
          </div>

        </main>

        {/* System Footer (Humble, clean, no system telemetry clutter) */}
        <footer id="app-footer" className="text-center pt-8 border-t border-slate-200 dark:border-neutral-900">
          <p className="text-[11px] text-slate-400 dark:text-slate-600">
            Secure client-side utility built with modern Web APIs. Zero telemetry, zero servers.
          </p>
        </footer>

      </div>
    </div>
  );
}
