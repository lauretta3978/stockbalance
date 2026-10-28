import React, { useState } from 'react';
import { Download, FileCheck, FileSpreadsheet, Check } from 'lucide-react';
import { ReconciliationResult } from '../types';
import {
  downloadUpdatedOpenCartFile,
  downloadAuditCsv,
  downloadAuditXlsx,
} from '../utils/exportUtils';

interface ExportToolbarProps {
  result: ReconciliationResult;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({ result }) => {
  const [downloadedFinal, setDownloadedFinal] = useState(false);
  const [downloadedXlsx, setDownloadedXlsx] = useState(false);
  const [downloadedCsv, setDownloadedCsv] = useState(false);

  const handleDownloadFinal = () => {
    downloadUpdatedOpenCartFile(result);
    setDownloadedFinal(true);
    setTimeout(() => setDownloadedFinal(false), 3000);
  };

  const handleDownloadXlsx = () => {
    downloadAuditXlsx(result);
    setDownloadedXlsx(true);
    setTimeout(() => setDownloadedXlsx(false), 3000);
  };

  const handleDownloadCsv = () => {
    downloadAuditCsv(result);
    setDownloadedCsv(true);
    setTimeout(() => setDownloadedCsv(false), 3000);
  };

  const fileFormat = result.isExcel ? 'XLSX' : 'CSV';

  return (
    <div id="export-section" className="bg-[#0e0e13] rounded-xl border border-white/10 p-6 shadow-2xl relative overflow-hidden">
      {/* Background purple accent blur */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-white tracking-tight">
              Export Updated OpenCart File ({fileFormat})
            </h2>
            <span className="text-xs text-purple-300 font-semibold bg-purple-900/50 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
              Same OpenCart Format Preserved
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Quantities updated from AutoCount. All original OpenCart columns, headers, and row sequences are completely preserved.
          </p>
        </div>

        {/* Action Buttons: Purple Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
          {/* Primary Action: Purple Button with Glow */}
          <button
            onClick={handleDownloadFinal}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-lg shadow-lg shadow-purple-600/30 border border-purple-400/20 transition-all whitespace-nowrap"
          >
            {downloadedFinal ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Downloaded Updated OpenCart File!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Updated OpenCart File ({fileFormat})</span>
              </>
            )}
          </button>

          {/* Secondary Action: Excel Multi-Sheet Audit */}
          <button
            onClick={handleDownloadXlsx}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-zinc-200 bg-zinc-900/90 hover:bg-zinc-800 hover:text-white border border-white/10 hover:border-purple-500/40 rounded-lg transition-all whitespace-nowrap"
          >
            {downloadedXlsx ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Downloaded Excel</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                <span>Audit Report (.xlsx)</span>
              </>
            )}
          </button>

          {/* Tertiary Action: Discrepancy Log */}
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-zinc-200 bg-zinc-900/90 hover:bg-zinc-800 hover:text-white border border-white/10 hover:border-purple-500/40 rounded-lg transition-all whitespace-nowrap"
          >
            {downloadedCsv ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Downloaded Log</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4 text-purple-400" />
                <span>Discrepancy Log (CSV)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
