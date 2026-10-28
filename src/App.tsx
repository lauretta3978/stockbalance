import React, { useState } from 'react';
import {
  Play,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { ColumnMappingConfig, ParsedDataset, ReconciliationResult } from './types';
import { parseFile } from './utils/fileParser';
import { runReconciliation } from './utils/reconciliationEngine';
import { TopBar } from './components/TopBar';
import { FileUploadCard } from './components/FileUploadCard';
import { ColumnMappingSection } from './components/ColumnMappingSection';
import { ReconciliationSummaryCards } from './components/ReconciliationSummaryCards';
import { AuditTable } from './components/AuditTable';
import { ExportToolbar } from './components/ExportToolbar';

const DEFAULT_CONFIG: ColumnMappingConfig = {
  autocountIsbnCol: 'ISBN',
  autocountQtyCol: 'Balance Quantity',
  opencartIsbnCol: 'isbn',
  opencartQtyCol: 'quantity',
};

const SUGGESTED_SHEETS = {
  autocount: 'https://docs.google.com/spreadsheets/d/1PLN7PM7iId1KsEGumRdWppxx03aE8cr6/edit?gid=748996129#gid=748996129',
  opencart: 'https://docs.google.com/spreadsheets/d/19LvlhUgwg4Lu7pCEOaFBDZZGhRL-wBlv/edit?gid=2033321851#gid=2033321851',
};

export default function App() {
  const [autocountData, setAutocountData] = useState<ParsedDataset | null>(null);
  const [opencartData, setOpencartData] = useState<ParsedDataset | null>(null);

  const [loadingFile, setLoadingFile] = useState<Record<string, boolean>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string | null>>({});

  const [columnConfig, setColumnConfig] = useState<ColumnMappingConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle uploading and parsing spreadsheets
  const handleFileSelect = async (
    file: File,
    fileId: 'autocount' | 'opencart'
  ) => {
    setLoadingFile((prev) => ({ ...prev, [fileId]: true }));
    setFileErrors((prev) => ({ ...prev, [fileId]: null }));

    try {
      const parsed = await parseFile(file, fileId);

      if (fileId === 'autocount') {
        setAutocountData(parsed);
        setColumnConfig((prev) => ({
          ...prev,
          autocountIsbnCol: parsed.detectedIsbnCol || prev.autocountIsbnCol,
          autocountQtyCol: parsed.detectedQtyCol || prev.autocountQtyCol,
        }));
      } else if (fileId === 'opencart') {
        setOpencartData(parsed);
        setColumnConfig((prev) => ({
          ...prev,
          opencartIsbnCol: parsed.detectedIsbnCol || prev.opencartIsbnCol,
          opencartQtyCol: parsed.detectedQtyCol || prev.opencartQtyCol,
        }));
      }

      setResult(null);
    } catch (err: any) {
      setFileErrors((prev) => ({
        ...prev,
        [fileId]: err.message || 'Failed to parse spreadsheet file.',
      }));
    } finally {
      setLoadingFile((prev) => ({ ...prev, [fileId]: false }));
    }
  };

  // Convert Google Sheets URL to CSV export link and fetch
  const handleUrlFetch = async (
    inputUrl: string,
    fileId: 'autocount' | 'opencart'
  ) => {
    setLoadingFile((prev) => ({ ...prev, [fileId]: true }));
    setFileErrors((prev) => ({ ...prev, [fileId]: null }));

    try {
      let csvUrl = inputUrl;
      const sheetMatch = inputUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (sheetMatch) {
        const sheetId = sheetMatch[1];
        const gidMatch = inputUrl.match(/[#&?]gid=([0-9]+)/);
        const gid = gidMatch ? gidMatch[1] : '0';
        csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      }

      const res = await fetch(csvUrl);
      if (!res.ok) {
        throw new Error(
          'Could not fetch Google Sheet. Please ensure the sheet is set to "Anyone with the link can view", or download it as CSV/XLSX and drop the file here.'
        );
      }
      const blob = await res.blob();
      const filename = `${fileId}_sheet.csv`;
      const file = new File([blob], filename, { type: 'text/csv' });
      await handleFileSelect(file, fileId);
    } catch (err: any) {
      setFileErrors((prev) => ({
        ...prev,
        [fileId]: err.message || 'Error fetching sheet. Download CSV and drop file instead.',
      }));
      setLoadingFile((prev) => ({ ...prev, [fileId]: false }));
    }
  };

  const handleClearFile = (fileId: 'autocount' | 'opencart') => {
    if (fileId === 'autocount') setAutocountData(null);
    if (fileId === 'opencart') setOpencartData(null);
    setFileErrors((prev) => ({ ...prev, [fileId]: null }));
    setResult(null);
  };

  const handleResetSession = () => {
    setAutocountData(null);
    setOpencartData(null);
    setFileErrors({});
    setColumnConfig(DEFAULT_CONFIG);
    setResult(null);
  };

  const handleRunReconciliation = () => {
    if (!autocountData || !opencartData) return;

    setIsProcessing(true);
    setTimeout(() => {
      try {
        const reconciliationOutput = runReconciliation(
          autocountData,
          opencartData,
          columnConfig
        );
        setResult(reconciliationOutput);
      } catch (err: any) {
        alert(`Reconciliation error: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    }, 150);
  };

  const isReadyToProcess = Boolean(
    autocountData &&
      opencartData &&
      columnConfig.autocountIsbnCol &&
      columnConfig.autocountQtyCol &&
      columnConfig.opencartIsbnCol &&
      columnConfig.opencartQtyCol
  );

  return (
    <div className="min-h-screen bg-[#07070a] text-zinc-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white relative">
      {/* Cinematic ambient background glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(147,51,234,0.18),rgba(0,0,0,0))] pointer-events-none" />

      <TopBar
        onReset={handleResetSession}
        hasData={Boolean(autocountData || opencartData || result)}
      />

      <main className="max-w-7xl mx-auto px-6 py-8 flex-grow w-full space-y-8 relative z-10">
        {/* Cinematic Hero Card */}
        <section className="bg-[#0e0e13]/90 backdrop-blur-md rounded-2xl border border-white/10 p-7 shadow-2xl relative overflow-hidden">
          {/* Subtle violet highlight line at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-75" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
                <ShieldCheck className="w-4 h-4" />
                <span>AutoCount to OpenCart Inventory Sync</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                Stock Balance Update & ISBN VLOOKUP
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
                Checks physical balance quantities from your AutoCount file and updates the quantity column in your uploaded OpenCart product file using strict ISBN matching. The exported file maintains your exact OpenCart format, columns, headers, and row sequences.
              </p>
            </div>

            {/* Configured Policy Badges */}
            <div className="flex items-center gap-4 text-xs text-zinc-400 bg-black/60 border border-white/10 px-5 py-3.5 rounded-xl shrink-0 shadow-inner">
              <div className="space-y-0.5">
                <div className="text-[11px] text-zinc-500 font-medium">Export Guarantee</div>
                <div className="font-semibold text-zinc-200">Identical OpenCart Format</div>
              </div>
              <div className="h-7 w-px bg-white/10" />
              <div className="space-y-0.5">
                <div className="text-[11px] text-zinc-500 font-medium">Matching Key</div>
                <div className="font-semibold text-purple-400">Strict ISBN Parity</div>
              </div>
            </div>
          </div>
        </section>

        {/* 1. Two-File Upload Stage */}
        <section id="upload-section" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">
                1. Upload The Two Source Spreadsheets
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Upload your AutoCount stock file and your OpenCart product file (.csv, .xlsx, .xls)
              </p>
            </div>

            {/* Quick Link Hints */}
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <a
                href={SUGGESTED_SHEETS.autocount}
                target="_blank"
                rel="noreferrer"
                className="hover:text-purple-400 flex items-center gap-1 transition-colors"
                title="Open AutoCount Google Sheet source in new tab"
              >
                <span>AutoCount Sheet</span>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>
              <span className="text-zinc-600">·</span>
              <a
                href={SUGGESTED_SHEETS.opencart}
                target="_blank"
                rel="noreferrer"
                className="hover:text-purple-400 flex items-center gap-1 transition-colors"
                title="Open OpenCart Google Sheet source in new tab"
              >
                <span>OpenCart Sheet</span>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File 1: AutoCount Stock File */}
            <FileUploadCard
              title="1. AutoCount Stock File"
              fileId="autocount"
              subtitle="Contains ISBN and physical Balance Quantity (source of truth)"
              required={true}
              dataset={autocountData}
              isLoading={Boolean(loadingFile.autocount)}
              error={fileErrors.autocount}
              suggestedUrl={SUGGESTED_SHEETS.autocount}
              onFileSelect={handleFileSelect}
              onUrlFetch={handleUrlFetch}
              onClear={() => handleClearFile('autocount')}
            />

            {/* File 2: OpenCart Product File */}
            <FileUploadCard
              title="2. OpenCart Product File"
              fileId="opencart"
              subtitle="Your OpenCart file containing ISBN and quantity to be updated"
              required={true}
              dataset={opencartData}
              isLoading={Boolean(loadingFile.opencart)}
              error={fileErrors.opencart}
              suggestedUrl={SUGGESTED_SHEETS.opencart}
              onFileSelect={handleFileSelect}
              onUrlFetch={handleUrlFetch}
              onClear={() => handleClearFile('opencart')}
            />
          </div>
        </section>

        {/* 2. Column Mapping & Keys Configuration */}
        {(autocountData || opencartData) && (
          <section className="space-y-4">
            <ColumnMappingSection
              config={columnConfig}
              onChange={setColumnConfig}
              autocountDataset={autocountData}
              opencartDataset={opencartData}
            />

            {/* Run Reconciliation Action Button: Purple Glow Button */}
            <div className="bg-[#0e0e13] rounded-xl border border-white/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isReadyToProcess
                      ? 'bg-purple-500 shadow-[0_0_10px_#a855f7]'
                      : 'bg-zinc-700'
                  }`}
                />
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {isReadyToProcess
                      ? 'Ready to Reconcile & Update OpenCart File'
                      : 'Upload both files and verify column keys to continue'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {autocountData && opencartData
                      ? `Matching ${opencartData.rowCount.toLocaleString()} OpenCart items against ${autocountData.rowCount.toLocaleString()} AutoCount stock records.`
                      : 'Requires both AutoCount Stock File and OpenCart Product File.'}
                  </p>
                </div>
              </div>

              {/* Purple Action Button */}
              <button
                onClick={handleRunReconciliation}
                disabled={!isReadyToProcess || isProcessing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-purple-600/35 border border-purple-400/20 transition-all whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isProcessing ? 'Updating Quantities...' : 'Update OpenCart Stock Balance'}</span>
              </button>
            </div>
          </section>
        )}

        {/* 3. Reconciliation Results & Summary */}
        {result && (
          <section className="space-y-6">
            {/* Download Action Bar */}
            <ExportToolbar result={result} />

            {/* KPI Cards Strip */}
            <ReconciliationSummaryCards summary={result.summary} />

            {/* Interactive Audit & Diff Table */}
            <AuditTable
              items={result.items}
              warehouseOnlyItems={result.unmatchedWarehouseItems}
              targetQtyColumn={columnConfig.opencartQtyCol || 'quantity'}
            />
          </section>
        )}
      </main>

      {/* Cinematic Footer */}
      <footer className="border-t border-white/10 bg-black/80 backdrop-blur-md py-6 mt-16 text-center text-xs text-zinc-500 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} AutoCount ERP · OpenCart Stock Balance Synchronization</p>
          <div className="flex items-center gap-4 text-zinc-600">
            <span>Direct OpenCart In-Place Update</span>
            <span>·</span>
            <span>Strict ISBN Normalization</span>
            <span>·</span>
            <span>Zero Data Loss</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
