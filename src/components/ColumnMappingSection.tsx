import React from 'react';
import { SlidersHorizontal, ArrowRight } from 'lucide-react';
import { ColumnMappingConfig, ParsedDataset } from '../types';

interface ColumnMappingSectionProps {
  config: ColumnMappingConfig;
  onChange: (config: ColumnMappingConfig) => void;
  autocountDataset: ParsedDataset | null;
  opencartDataset: ParsedDataset | null;
}

export const ColumnMappingSection: React.FC<ColumnMappingSectionProps> = ({
  config,
  onChange,
  autocountDataset,
  opencartDataset,
}) => {
  const updateField = (field: keyof ColumnMappingConfig, value: string) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const renderDropdownOrInput = (
    label: string,
    field: keyof ColumnMappingConfig,
    dataset: ParsedDataset | null,
    fallbackPlaceholder: string
  ) => {
    const value = config[field];
    const headers = dataset?.headers || [];

    return (
      <div>
        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
          {label}
        </label>
        {headers.length > 0 ? (
          <div className="relative">
            <select
              value={value}
              onChange={(e) => updateField(field, e.target.value)}
              className="w-full text-xs bg-black/60 border border-zinc-700 hover:border-zinc-600 rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            >
              <option value="">-- Select Column --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input
            type="text"
            value={value}
            placeholder={fallbackPlaceholder}
            onChange={(e) => updateField(field, e.target.value)}
            className="w-full text-xs bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        )}
      </div>
    );
  };

  return (
    <div id="column-mapping" className="bg-[#0e0e13] rounded-xl border border-white/10 p-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-400" />
            <span>2. Column Matching & Field Assignment</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Auto-detected from file headers. Confirm or select the exact column names used for matching.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source AutoCount ERP Keys */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
              AutoCount ERP (Physical Warehouse Balance)
            </h3>
            {autocountDataset && (
              <span className="text-[11px] text-zinc-500 font-mono">
                {autocountDataset.headers.length} columns
              </span>
            )}
          </div>
          <div className="space-y-3.5">
            {renderDropdownOrInput(
              'AutoCount ISBN Key (Primary Key)',
              'autocountIsbnCol',
              autocountDataset,
              'e.g. ISBN'
            )}
            {renderDropdownOrInput(
              'AutoCount Stock Balance Column (Physical Qty)',
              'autocountQtyCol',
              autocountDataset,
              'e.g. Balance Quantity / Balance'
            )}
          </div>
        </div>

        {/* Target OpenCart File Keys */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
              OpenCart Product File (Target to Update)
            </h3>
            {opencartDataset && (
              <span className="text-[11px] text-zinc-500 font-mono">
                {opencartDataset.headers.length} columns
              </span>
            )}
          </div>
          <div className="space-y-3.5">
            {renderDropdownOrInput(
              'OpenCart Target ISBN Column',
              'opencartIsbnCol',
              opencartDataset,
              'e.g. isbn'
            )}
            {renderDropdownOrInput(
              'OpenCart Target Quantity Column (To Overwrite)',
              'opencartQtyCol',
              opencartDataset,
              'e.g. quantity'
            )}
          </div>
        </div>
      </div>

      {/* Matching Rule Summary Banner */}
      <div className="mt-5 p-3.5 bg-purple-950/25 rounded-lg border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-purple-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-purple-300">VLOOKUP Rule:</span>
          <span className="font-mono bg-purple-900/40 px-1.5 py-0.5 rounded text-purple-100">
            AutoCount [{config.autocountIsbnCol || 'ISBN'}]
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-mono bg-purple-900/40 px-1.5 py-0.5 rounded text-purple-100">
            OpenCart [{config.opencartIsbnCol || 'isbn'}]
          </span>
          <span className="text-purple-500/70">|</span>
          <span>Copy AutoCount [{config.autocountQtyCol || 'Balance Quantity'}] ➔ OpenCart [{config.opencartQtyCol || 'quantity'}]</span>
        </div>
        <span className="text-[11px] text-purple-400 font-medium">Strict ISBN parity</span>
      </div>
    </div>
  );
};
