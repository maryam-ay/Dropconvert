import React from 'react';
import { 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { ImageFile } from '../types';
import { formatBytes, calculateSavings } from '../utils';

interface ConversionQueueProps {
  files: ImageFile[];
  onRemoveFile: (id: string) => void;
  onDownloadFile: (file: ImageFile) => void;
  onRetryFile?: (id: string) => void;
  onClearQueue?: () => void;
}

export default function ConversionQueue({
  files,
  onRemoveFile,
  onDownloadFile,
  onRetryFile,
  onClearQueue
}: ConversionQueueProps) {
  if (files.length === 0) return null;

  const totalCount = files.length;
  const readyCount = files.filter(f => f.status === 'waiting' || f.status === 'failed').length;
  const completedCount = files.filter(f => f.status === 'done').length;

  return (
    <div id="conversion-queue-section" className="flex-1 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-sm flex flex-col min-h-[350px] overflow-hidden">
      <div id="queue-header" className="p-4 border-b border-slate-100 dark:border-neutral-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-neutral-900/50">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">Process Queue</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 rounded text-[10px] font-bold">
              {totalCount} {totalCount === 1 ? 'FILE' : 'FILES'} TOTAL
            </span>
            {readyCount > 0 && (
              <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-bold">
                {readyCount} READY
              </span>
            )}
            {completedCount > 0 && (
              <span className="px-2 py-0.5 bg-emerald-150 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-bold">
                {completedCount} DONE
              </span>
            )}
          </div>
        </div>
        {onClearQueue && (
          <button 
            type="button"
            onClick={onClearQueue}
            className="text-xs text-slate-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 font-medium transition-colors cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      <div id="queue-table-wrapper" className="flex-1 overflow-auto">
        <table id="queue-table" className="w-full text-left border-collapse min-w-[640px]">
          <thead className="sticky top-0 bg-white dark:bg-neutral-900 shadow-sm z-10 border-b border-slate-100 dark:border-neutral-800/80">
            <tr id="table-head-row" className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase">
              <th scope="col" className="px-6 py-3">Filename</th>
              <th scope="col" className="px-6 py-3">Original Size</th>
              <th scope="col" className="px-6 py-3">WebP Size</th>
              <th scope="col" className="px-6 py-3">Savings</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody id="queue-table-body" className="divide-y divide-slate-50 dark:divide-neutral-850/30">
            {files.map((item) => {
              const savings = calculateSavings(item.size, item.convertedSize);

              return (
                <tr 
                  key={item.id} 
                  id={`queue-row-${item.id}`}
                  className="hover:bg-slate-50/80 dark:hover:bg-neutral-850/10 transition-colors text-sm"
                >
                  {/* Filename & Small thumbnail */}
                  <td className="px-6 py-3 max-w-xs truncate">
                    <div className="flex items-center gap-3">
                      <div 
                        id={`thumbnail-box-${item.id}`}
                        className="w-8 h-8 rounded bg-slate-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200/60 dark:border-neutral-700/60 relative"
                      >
                        {item.thumbnailUrl ? (
                          <img 
                            src={item.thumbnailUrl} 
                            alt="" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-400 dark:text-neutral-500" />
                        )}
                      </div>
                      <span className="font-medium text-slate-700 dark:text-neutral-200" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                  </td>

                  {/* Original Size */}
                  <td className="px-6 py-3 text-slate-500 dark:text-neutral-400 font-mono text-xs">
                    {formatBytes(item.size)}
                  </td>

                  {/* WebP Size */}
                  <td className="px-6 py-3 text-slate-500 dark:text-neutral-300 font-mono text-xs">
                    {item.convertedSize ? formatBytes(item.convertedSize) : (
                      <span className="text-slate-300 dark:text-neutral-600">—</span>
                    )}
                  </td>

                  {/* Savings percentage */}
                  <td className="px-6 py-3 font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                    {item.status === 'done' && item.convertedSize ? (
                      `-${savings}%`
                    ) : (
                      <span className="text-slate-300 dark:text-neutral-600 font-normal">—</span>
                    )}
                  </td>

                  {/* Status Badges */}
                  <td className="px-6 py-3">
                    {item.status === 'waiting' && (
                      <span id={`status-badge-${item.id}`} className="px-2 py-1 bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 rounded text-xs font-medium">
                        Queued
                      </span>
                    )}
                    {item.status === 'converting' && (
                      <div id={`status-badge-${item.id}`} className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium text-xs">Processing...</span>
                      </div>
                    )}
                    {item.status === 'done' && (
                      <span id={`status-badge-${item.id}`} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium">
                        Success
                      </span>
                    )}
                    {item.status === 'failed' && (
                      <span id={`status-badge-${item.id}`} className="px-2 py-1 bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded text-xs font-medium" title={item.error}>
                        Failed
                      </span>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {item.status === 'done' && (
                        <button
                          type="button"
                          onClick={() => onDownloadFile(item)}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold text-xs hover:underline cursor-pointer"
                        >
                          Download
                        </button>
                      )}

                      {item.status === 'converting' && (
                        <span className="text-slate-300 dark:text-neutral-600 text-xs">Wait</span>
                      )}

                      {item.status === 'waiting' && (
                        <span className="text-slate-300 dark:text-neutral-600 text-xs">—</span>
                      )}

                      {item.status === 'failed' && onRetryFile && (
                        <button
                          type="button"
                          onClick={() => onRetryFile(item.id)}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold text-xs hover:underline cursor-pointer"
                        >
                          Retry
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onRemoveFile(item.id)}
                        className="text-slate-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
