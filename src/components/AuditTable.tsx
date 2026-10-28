import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ReconciliationItem, UnmatchedWarehouseItem } from '../types';

interface AuditTableProps {
  items: ReconciliationItem[];
  warehouseOnlyItems: UnmatchedWarehouseItem[];
  targetQtyColumn: string;
}

type TabType = 'all' | 'updated' | 'identical' | 'unmatched' | 'warehouse_only';

export const AuditTable: React.FC<AuditTableProps> = ({
  items,
  warehouseOnlyItems,
  targetQtyColumn,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'index' | 'cleanIsbn' | 'delta' | 'originalQty' | 'newQty'>('index');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Tab counts
  const counts = useMemo(() => {
    let updated = 0;
    let identical = 0;
    let unmatched = 0;
    for (const item of items) {
      if (item.status === 'matched_updated') updated++;
      else if (item.status === 'matched_identical') identical++;
      else if (item.status === 'unmatched_retained') unmatched++;
    }
    return {
      all: items.length,
      updated,
      identical,
      unmatched,
      warehouseOnly: warehouseOnlyItems.length,
    };
  }, [items, warehouseOnlyItems]);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    if (activeTab === 'warehouse_only') {
      const q = searchQuery.toLowerCase().trim();
      let res = warehouseOnlyItems;
      if (q) {
        res = res.filter(
          (w) =>
            w.cleanIsbn.toLowerCase().includes(q) ||
            w.rawIsbn.toLowerCase().includes(q) ||
            (w.productName && w.productName.toLowerCase().includes(q))
        );
      }
      return res;
    }

    let list = items;
    if (activeTab === 'updated') {
      list = list.filter((i) => i.status === 'matched_updated');
    } else if (activeTab === 'identical') {
      list = list.filter((i) => i.status === 'matched_identical');
    } else if (activeTab === 'unmatched') {
      list = list.filter((i) => i.status === 'unmatched_retained');
    }

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (i) =>
          i.cleanIsbn.toLowerCase().includes(q) ||
          i.rawIsbn.toLowerCase().includes(q) ||
          (i.productName && i.productName.toLowerCase().includes(q)) ||
          (i.productId && i.productId.toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'index') cmp = a.index - b.index;
      else if (sortField === 'cleanIsbn') cmp = a.cleanIsbn.localeCompare(b.cleanIsbn);
      else if (sortField === 'delta') cmp = a.delta - b.delta;
      else if (sortField === 'originalQty') cmp = a.originalQty - b.originalQty;
      else if (sortField === 'newQty') cmp = a.newQty - b.newQty;
      return sortAsc ? cmp : -cmp;
    });
  }, [items, warehouseOnlyItems, activeTab, searchQuery, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSort = (field: 'index' | 'cleanIsbn' | 'delta' | 'originalQty' | 'newQty') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div id="reconciliation-results" className="bg-[#0e0e13] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Top Controls: Filter Tabs & Search */}
      <div className="p-4 border-b border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#0a0a0f]">
        {/* Segmented Filter Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-black/60 border border-white/5 rounded-lg overflow-x-auto text-xs font-medium">
          <button
            onClick={() => switchTab('all')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/30'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
            }`}
          >
            All Final Items ({counts.all.toLocaleString()})
          </button>
          <button
            onClick={() => switchTab('updated')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'updated'
                ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/30'
                : 'text-zinc-400 hover:text-emerald-300 hover:bg-white/5'
            }`}
          >
            Updated ({counts.updated.toLocaleString()})
          </button>
          <button
            onClick={() => switchTab('identical')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'identical'
                ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/30'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
            }`}
          >
            In Sync ({counts.identical.toLocaleString()})
          </button>
          <button
            onClick={() => switchTab('unmatched')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'unmatched'
                ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/30'
                : 'text-zinc-400 hover:text-amber-300 hover:bg-white/5'
            }`}
          >
            Unmatched in Warehouse ({counts.unmatched.toLocaleString()})
          </button>
          {counts.warehouseOnly > 0 && (
            <button
              onClick={() => switchTab('warehouse_only')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'warehouse_only'
                  ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-purple-300 hover:bg-white/5'
              }`}
            >
              Warehouse Only ({counts.warehouseOnly.toLocaleString()})
            </button>
          )}
        </div>

        {/* Live Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by ISBN, Name, ID..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-black/60 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Main Table View */}
      <div className="overflow-x-auto">
        {activeTab === 'warehouse_only' ? (
          /* Table for AutoCount Warehouse items missing in OpenCart export */
          <table className="w-full text-left text-xs text-zinc-300 border-collapse">
            <thead className="bg-[#08080c] border-b border-white/10 text-zinc-400 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Normalized ISBN</th>
                <th className="py-3 px-4">Raw File ISBN</th>
                <th className="py-3 px-4">Product / Item Description</th>
                <th className="py-3 px-4 text-right">Physical Balance</th>
                <th className="py-3 px-4">Reconciliation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 italic">
                    No warehouse-only items found matching filter.
                  </td>
                </tr>
              ) : (
                (paginatedData as UnmatchedWarehouseItem[]).map((item, idx) => (
                  <tr key={idx} className="hover:bg-purple-950/20 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-zinc-500">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-purple-300">
                      {item.cleanIsbn}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-zinc-400">
                      {item.rawIsbn || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-200 font-medium max-w-xs truncate">
                      {item.productName || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-white">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-amber-400 text-xs">
                      In AutoCount warehouse but missing from OpenCart final export
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          /* Standard Reconciliation Grid */
          <table className="w-full text-left text-xs text-zinc-300 border-collapse">
            <thead className="bg-[#08080c] border-b border-white/10 text-zinc-400 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort('index')}
                  className="py-3 px-4 cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Row</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cleanIsbn')}
                  className="py-3 px-4 cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>ISBN</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th className="py-3 px-4">Product Identifier / Title</th>
                <th
                  onClick={() => handleSort('originalQty')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Before ({targetQtyColumn})</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('newQty')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>After (AutoCount)</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('delta')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Delta</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th className="py-3 px-4">Audit Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 italic">
                    No items found matching the current criteria.
                  </td>
                </tr>
              ) : (
                (paginatedData as ReconciliationItem[]).map((item) => (
                  <tr
                    key={item.index}
                    className={`transition-colors ${
                      item.status === 'matched_updated'
                        ? 'bg-emerald-950/15 hover:bg-emerald-950/30'
                        : item.status === 'unmatched_retained'
                        ? 'bg-amber-950/10 hover:bg-amber-950/25'
                        : 'hover:bg-purple-950/15'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-mono text-zinc-500 text-xs">
                      {item.index}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-purple-300">
                      {item.cleanIsbn}
                    </td>
                    <td className="py-2.5 px-4 max-w-xs">
                      <div className="truncate font-medium text-zinc-100">
                        {item.productName || item.productId || '—'}
                      </div>
                      {item.productId && item.productName && (
                        <div className="text-[11px] text-zinc-500 font-mono">
                          ID: {item.productId}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-zinc-400">
                      {item.originalQty.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-white">
                      {item.newQty.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {item.delta > 0 ? (
                        <span className="text-emerald-400 font-semibold">
                          +{item.delta.toLocaleString()}
                        </span>
                      ) : item.delta < 0 ? (
                        <span className="text-rose-400 font-semibold">
                          {item.delta.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-zinc-500">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-xs">
                      {item.status === 'matched_updated' && (
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Updated from AutoCount</span>
                        </div>
                      )}
                      {item.status === 'matched_identical' && (
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <span>In sync (no shift)</span>
                        </div>
                      )}
                      {item.status === 'unmatched_retained' && (
                        <div className="flex items-center gap-1.5 text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Not in AutoCount · Retained existing</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0a0a0f] text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-black/60 border border-zinc-700 rounded px-2.5 py-1 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
            <option value={250}>250 rows</option>
          </select>
          <span>
            of <strong className="font-mono tabular-nums text-zinc-200">{filteredData.length.toLocaleString()}</strong> items
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-zinc-700 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>
          <span className="font-mono tabular-nums px-2 text-zinc-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 border border-zinc-700 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 flex items-center gap-1 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
