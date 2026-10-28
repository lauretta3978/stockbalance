import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, X, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { ParsedDataset } from '../types';

interface FileUploadCardProps {
  title: string;
  fileId: 'autocount' | 'opencart';
  subtitle: string;
  required?: boolean;
  dataset: ParsedDataset | null;
  isLoading: boolean;
  error?: string | null;
  suggestedUrl?: string;
  onFileSelect: (file: File, fileId: 'autocount' | 'opencart') => void;
  onUrlFetch?: (url: string, fileId: 'autocount' | 'opencart') => void;
  onSheetChange?: (sheetName: string) => void;
  onClear: () => void;
}

export const FileUploadCard: React.FC<FileUploadCardProps> = ({
  title,
  fileId,
  subtitle,
  required = false,
  dataset,
  isLoading,
  error,
  suggestedUrl,
  onFileSelect,
  onUrlFetch,
  onSheetChange,
  onClear,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState(suggestedUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (isValidFile(file)) {
        onFileSelect(file, fileId);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (isValidFile(file)) {
        onFileSelect(file, fileId);
      }
    }
  };

  const isValidFile = (file: File) => {
    const ext = file.name.toLowerCase();
    return ext.endsWith('.csv') || ext.endsWith('.xlsx') || ext.endsWith('.xls');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleLoadUrl = () => {
    if (urlInput.trim() && onUrlFetch) {
      onUrlFetch(urlInput.trim(), fileId);
    }
  };

  return (
    <div className="bg-[#0e0e13] rounded-xl border border-white/10 p-5 flex flex-col justify-between transition-all hover:border-purple-500/30">
      <div>
        {/* Title & Requirement Indicator */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm text-zinc-100 leading-tight">
            {title}
          </h3>
          <span className="text-xs">
            {required ? (
              <span className="text-purple-400 font-medium">Required</span>
            ) : (
              <span className="text-zinc-500">Optional</span>
            )}
          </span>
        </div>
        <p className="text-xs text-zinc-400 mb-3">{subtitle}</p>

        {/* Dropzone or Loaded State */}
        {!dataset ? (
          <div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-purple-500 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                className="hidden"
                onChange={handleInputChange}
              />
              <div className="w-11 h-11 rounded-full bg-purple-950/50 border border-purple-500/20 mx-auto flex items-center justify-center text-purple-400 mb-2.5">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-zinc-200">
                {isLoading ? 'Parsing spreadsheet...' : 'Click or drop file (.csv / .xlsx / .xls)'}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Drag and drop your spreadsheet here
              </p>
            </div>

            {/* Quick URL Ingest Option */}
            {onUrlFetch && (
              <div className="mt-2.5">
                {!showUrlInput ? (
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(true)}
                    className="text-[11px] text-zinc-400 hover:text-purple-400 flex items-center gap-1 transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Or load directly from Google Sheets URL</span>
                  </button>
                ) : (
                  <div className="space-y-1.5 mt-2 bg-zinc-900/90 p-2.5 rounded-lg border border-white/10">
                    <input
                      type="text"
                      placeholder="Paste Google Sheets link..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full text-xs bg-black/60 border border-zinc-700 rounded px-2 py-1 text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleLoadUrl}
                        disabled={isLoading || !urlInput.trim()}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded transition-colors"
                      >
                        {isLoading ? 'Loading...' : 'Fetch Sheet'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(false)}
                        className="text-[11px] text-zinc-500 hover:text-zinc-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="border border-purple-500/30 bg-purple-950/20 rounded-lg p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-900/40 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-100 truncate" title={dataset.fileName}>
                    {dataset.fileName}
                  </p>
                  <p className="text-[11px] text-zinc-400 font-mono tabular-nums">
                    {dataset.rowCount.toLocaleString()} rows · {formatSize(dataset.fileSize)} {dataset.isExcel ? '(Excel)' : `(CSV)`}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Excel Sheet selector if multiple sheets present */}
            {dataset.sheetNames && dataset.sheetNames.length > 1 && onSheetChange && (
              <div className="mt-2.5 pt-2 border-t border-white/10">
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Active Worksheet:
                </label>
                <select
                  value={dataset.selectedSheet}
                  onChange={(e) => onSheetChange(e.target.value)}
                  className="w-full text-xs bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {dataset.sheetNames.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Auto-detected columns feedback */}
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1.5 text-[11px] text-purple-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">
                Detected: {dataset.detectedIsbnCol || 'ISBN?'} · {dataset.detectedQtyCol || 'Quantity?'}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/30 border border-rose-800/40 p-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
