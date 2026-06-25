import React from 'react';
import { Shield, HelpCircle } from 'lucide-react';

export default function HowItWorks() {
  return (
    <div id="how-it-works-section" className="space-y-4">
      {/* Privacy Guarantee Card */}
      <div 
        id="privacy-card" 
        className="p-5 rounded-xl border border-emerald-150 bg-emerald-50/40 dark:border-emerald-950/40 dark:bg-emerald-950/10"
      >
        <div className="flex items-center gap-2.5 mb-2.5 text-emerald-800 dark:text-emerald-400">
          <Shield id="privacy-icon" className="w-4 h-4 shrink-0" />
          <h3 id="privacy-title" className="font-bold text-xs uppercase tracking-wider">
            100% Local & Offline
          </h3>
        </div>
        <p id="privacy-text" className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
          Your images are converted locally in your browser. They are <strong className="text-slate-800 dark:text-neutral-200 font-semibold">never uploaded to any server</strong>, guaranteeing complete privacy and absolute security.
        </p>
      </div>

      {/* Quick Guide Card */}
      <div 
        id="how-it-works-card" 
        className="p-5 rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/40"
      >
        <div className="flex items-center gap-2.5 mb-3 text-slate-700 dark:text-neutral-300">
          <HelpCircle id="guide-icon" className="w-4 h-4 shrink-0" />
          <h3 id="how-it-works-title" className="font-bold text-xs uppercase tracking-wider">
            How It Works
          </h3>
        </div>
        <ol id="how-it-works-steps" className="space-y-2.5 text-xs text-slate-500 dark:text-neutral-400">
          <li className="flex gap-2">
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">1.</span>
            <span>Drag & drop PNG files into the upload target.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">2.</span>
            <span>Set WebP Compression quality preference.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">3.</span>
            <span>Click <strong>&quot;Convert All&quot;</strong> to start local batch conversion.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">4.</span>
            <span>Download files individually or bundled as a single <strong>ZIP</strong>.</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
