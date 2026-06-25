import React from 'react';
import { Play, Download, Trash2, Ban, Loader2, Sliders } from 'lucide-react';
import { ImageFile } from '../types';
import { formatBytes, calculateSavings } from '../utils';

interface QualityControlProps {
  quality: number; // between 0.01 and 1.00
  setQuality: (quality: number) => void;
  files: ImageFile[];
  onConvertAll: () => void;
  onDownloadZip: () => void;
  onClearQueue: () => void;
  onCancelConversion: () => void;
  isConverting: boolean;
}

export default function QualityControl({
  quality,
  setQuality,
  files,
  onConvertAll,
  onDownloadZip,
  onClearQueue,
  onCancelConversion,
  isConverting
}: QualityControlProps) {
  if (files.length === 0) return null;

  // Stat calculations
  const totalCount = files.length;
  const completedCount = files.filter(f => f.status === 'done').length;

  const totalOriginalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const totalConvertedBytes = files.reduce((sum, f) => sum + (f.convertedSize || 0), 0);
  
  // Calculate savings on finished files only
  const finishedFiles = files.filter(f => f.status === 'done' && f.convertedSize !== null);
  const finishedOriginalSize = finishedFiles.reduce((sum, f) => sum + f.size, 0);
  const finishedConvertedSize = finishedFiles.reduce((sum, f) => sum + (f.convertedSize || 0), 0);
  const totalSavingsPercent = calculateSavings(finishedOriginalSize, finishedConvertedSize);
  const savedBytes = finishedOriginalSize - finishedConvertedSize;

  const hasConvertible = files.some(f => f.status === 'waiting' || f.status === 'failed');
  const hasCompleted = files.some(f => f.status === 'done');

  return (
    <div id="quality-control-card" className="bg-white dark:bg-neutral-900 border border-slate-250 dark:border-neutral-800 rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800/80">
        <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">WebP Quality</span>
        <span id="quality-display-badge" className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
          {Math.round(quality * 100)}%
        </span>
      </div>

      <div className="space-y-1.5">
        <input
          type="range"
          id="quality-slider"
          min="5"
          max="100"
          step="5"
          value={Math.round(quality * 100)}
          onChange={(e) => setQuality(parseFloat(e.target.value) / 100)}
          disabled={isConverting}
          aria-valuemin={5}
          aria-valuemax={100}
          aria-valuenow={Math.round(quality * 100)}
          className="w-full h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-[10px] text-slate-400 dark:text-neutral-500 font-semibold uppercase tracking-wider">
          <span>Smaller</span>
          <span>Better</span>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-neutral-800/80 my-3"></div>

      {/* Bulk actions */}
      <div className="space-y-3">
        {isConverting ? (
          <button
            type="button"
            id="cancel-batch-btn"
            onClick={onCancelConversion}
            className="w-full py-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/25 dark:hover:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Ban className="w-4 h-4" />
            <span>Cancel Batch</span>
          </button>
        ) : (
          <button
            type="button"
            id="convert-all-btn"
            onClick={onConvertAll}
            disabled={!hasConvertible}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-600 rounded-lg font-bold text-sm shadow-md disabled:shadow-none transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Convert All ({files.filter(f => f.status === 'waiting' || f.status === 'failed').length})</span>
          </button>
        )}

        {hasCompleted && (
          <button
            type="button"
            id="download-zip-btn"
            onClick={onDownloadZip}
            className="w-full py-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-neutral-850 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{completedCount === 1 ? 'Download WebP' : `Download ZIP (${completedCount})`}</span>
          </button>
        )}
      </div>

      {/* Progress Info */}
      {isConverting && (
        <div id="active-conversion-ticker" className="flex items-center gap-2.5 bg-indigo-50/50 dark:bg-indigo-950/10 p-3 rounded-lg border border-indigo-100/50 dark:border-indigo-950/30">
          <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
          <div className="text-left text-xs">
            <p className="font-semibold text-indigo-950 dark:text-indigo-300">Processing Batch</p>
            <p className="font-mono text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">
              {completedCount} / {totalCount} completed
            </p>
          </div>
        </div>
      )}

      {/* Stats Table */}
      <div className="border-t border-slate-100 dark:border-neutral-800/80 pt-4 space-y-2.5 text-xs">
        <div className="flex justify-between font-medium">
          <span className="text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-[10px]">Queue Progress</span>
          <span className="text-slate-700 dark:text-neutral-300 font-mono">
            {completedCount} / {totalCount}
          </span>
        </div>
        <div className="flex justify-between font-medium">
          <span className="text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-[10px]">Original Size</span>
          <span className="text-slate-700 dark:text-neutral-300 font-mono">
            {formatBytes(totalOriginalBytes)}
          </span>
        </div>
        {completedCount > 0 && (
          <>
            <div className="flex justify-between font-medium">
              <span className="text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-[10px]">WebP Size</span>
              <span className="text-slate-700 dark:text-neutral-300 font-mono">
                {formatBytes(totalConvertedBytes)}
              </span>
            </div>
            {savedBytes > 0 && (
              <div className="flex justify-between font-medium">
                <span className="text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-[10px]">Total Saved</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  {formatBytes(savedBytes)} (-{totalSavingsPercent}%)
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
