import React from 'react';
import { RotateCcw, Layers } from 'lucide-react';

interface TopBarProps {
  onReset: () => void;
  hasData: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ onReset, hasData }) => {
  return (
    <header className="bg-black/85 backdrop-blur-xl border-b border-white/10 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single Brand wordmark & Quiet Context Breadcrumb */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-purple-600/30 border border-purple-400/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white whitespace-nowrap">
                Stock Balance Reconciler
              </span>
            </div>
            <div className="text-xs text-zinc-400 font-medium">
              AutoCount ERP · OpenCart ISBN VLOOKUP
            </div>
          </div>
        </div>

        {/* Zone 2: 4 single-line links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
          <a
            href="#upload-section"
            className="hover:text-purple-300 transition-colors whitespace-nowrap shrink-0"
          >
            Source Files
          </a>
          <a
            href="#column-mapping"
            className="hover:text-purple-300 transition-colors whitespace-nowrap shrink-0"
          >
            Column Keys
          </a>
          <a
            href="#reconciliation-results"
            className="hover:text-purple-300 transition-colors whitespace-nowrap shrink-0"
          >
            Audit Log
          </a>
          <a
            href="#export-section"
            className="hover:text-purple-300 transition-colors whitespace-nowrap shrink-0"
          >
            Export Center
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {hasData && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 rounded-lg transition-all border border-white/10 hover:border-purple-500/40 whitespace-nowrap shrink-0"
              title="Clear all datasets and restart"
            >
              <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
              <span>Reset Session</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
