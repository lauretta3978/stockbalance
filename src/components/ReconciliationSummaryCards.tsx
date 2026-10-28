import React from 'react';
import { Package, CheckCircle, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { ReconciliationSummary } from '../types';

interface ReconciliationSummaryCardsProps {
  summary: ReconciliationSummary;
}

export const ReconciliationSummaryCards: React.FC<ReconciliationSummaryCardsProps> = ({
  summary,
}) => {
  const matchRate = summary.totalOpenCartRows > 0
    ? ((summary.matchedCount / summary.totalOpenCartRows) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Processed */}
        <div className="bg-[#0e0e13] rounded-xl border border-white/10 p-5 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              OpenCart Products
            </span>
            <Package className="w-4 h-4 text-zinc-500" />
          </div>
          <p className="text-3xl font-bold text-white font-mono tabular-nums tracking-tight">
            {summary.totalOpenCartRows.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400 mt-1.5">
            Total items in OpenCart file
          </p>
        </div>

        {/* KPI 2: Successfully Matched */}
        <div className="bg-[#0e0e13] rounded-xl border border-emerald-500/20 p-5 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Matched with AutoCount
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-emerald-400 font-mono tabular-nums tracking-tight">
            {summary.matchedCount.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1.5">
            <span className="font-semibold text-emerald-300">{matchRate}% matched</span>
            <span>·</span>
            <span>{summary.updatedCount} qty updated</span>
          </div>
        </div>

        {/* KPI 3: Unmatched in OpenCart */}
        <div className="bg-[#0e0e13] rounded-xl border border-amber-500/20 p-5 shadow-lg shadow-amber-950/20">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Unmatched in AutoCount
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-amber-400 font-mono tabular-nums tracking-tight">
            {summary.unmatchedOpenCartCount.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400 mt-1.5">
            Original stock retained · Logged in audit
          </p>
        </div>

        {/* KPI 4: Net Quantity Shift */}
        <div className="bg-[#0e0e13] rounded-xl border border-purple-500/30 p-5 shadow-lg shadow-purple-950/25">
          <div className="flex items-center justify-between text-purple-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Net Stock Variance
            </span>
            <ArrowUpDown className="w-4 h-4 text-purple-400" />
          </div>
          <p
            className={`text-3xl font-bold font-mono tabular-nums tracking-tight ${
              summary.netQuantityDelta > 0
                ? 'text-emerald-400'
                : summary.netQuantityDelta < 0
                ? 'text-rose-400'
                : 'text-zinc-200'
            }`}
          >
            {summary.netQuantityDelta > 0 ? `+${summary.netQuantityDelta.toLocaleString()}` : summary.netQuantityDelta.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400 mt-1.5">
            {summary.totalOriginalStock.toLocaleString()} ➔ {summary.totalUpdatedStock.toLocaleString()} units
          </p>
        </div>
      </div>

      {/* Contextual summary strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-[#09090d] rounded-lg border border-white/5 text-xs text-zinc-300">
        <div className="flex flex-wrap items-center gap-4">
          <span>
            Physical AutoCount Stock:{' '}
            <strong className="font-mono tabular-nums text-white">
              {summary.totalAutocountWarehouseStock.toLocaleString()} units
            </strong>
          </span>
          <span className="text-zinc-600">·</span>
          <span>
            In-Sync (Identical):{' '}
            <strong className="font-mono tabular-nums text-white">
              {summary.identicalCount.toLocaleString()} items
            </strong>
          </span>
          {summary.unmatchedAutocountCount > 0 && (
            <>
              <span className="text-zinc-600">·</span>
              <span className="text-amber-300">
                {summary.unmatchedAutocountCount.toLocaleString()} AutoCount items not listed in OpenCart file
              </span>
            </>
          )}
        </div>
        <span className="text-zinc-500 font-mono text-[11px]">
          Target: {summary.openCartFileName}
        </span>
      </div>
    </div>
  );
};
