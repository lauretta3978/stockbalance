import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  BarChart3,
  PieChart as PieIcon,
  Layers,
} from 'lucide-react';
import { ReconciliationItem, ReconciliationSummary } from '../types';

interface StockDistributionChartsProps {
  items: ReconciliationItem[];
  summary: ReconciliationSummary;
}

const COLORS = {
  increased: '#10b981', // Emerald
  decreased: '#f43f5e', // Rose
  identical: '#64748b', // Slate
  unmatched: '#f59e0b', // Amber
};

export const StockDistributionCharts: React.FC<StockDistributionChartsProps> = ({
  items,
  summary,
}) => {
  const [viewMode, setViewMode] = useState<'both' | 'variance' | 'pie'>('both');

  // 1. Calculate Shift Breakdown (Increased vs Decreased vs Identical vs Unmatched)
  const breakdown = useMemo(() => {
    let increasedCount = 0;
    let increasedUnits = 0;
    let decreasedCount = 0;
    let decreasedUnits = 0;
    let identicalCount = 0;
    let identicalUnits = 0;
    let unmatchedCount = 0;
    let unmatchedUnits = 0;

    for (const item of items) {
      if (item.status === 'matched_updated') {
        if (item.delta > 0) {
          increasedCount++;
          increasedUnits += item.delta;
        } else if (item.delta < 0) {
          decreasedCount++;
          decreasedUnits += Math.abs(item.delta);
        }
      } else if (item.status === 'matched_identical') {
        identicalCount++;
        identicalUnits += item.newQty;
      } else if (item.status === 'unmatched_retained') {
        unmatchedCount++;
        unmatchedUnits += item.originalQty;
      }
    }

    return {
      increased: { count: increasedCount, units: increasedUnits },
      decreased: { count: decreasedCount, units: decreasedUnits },
      identical: { count: identicalCount, units: identicalUnits },
      unmatched: { count: unmatchedCount, units: unmatchedUnits },
    };
  }, [items]);

  // Donut chart dataset
  const pieData = useMemo(() => {
    return [
      {
        name: 'Stock Increased',
        value: breakdown.increased.count,
        color: COLORS.increased,
        units: breakdown.increased.units,
      },
      {
        name: 'Stock Decreased',
        value: breakdown.decreased.count,
        color: COLORS.decreased,
        units: breakdown.decreased.units,
      },
      {
        name: 'In Sync (Unchanged)',
        value: breakdown.identical.count,
        color: COLORS.identical,
        units: breakdown.identical.units,
      },
      {
        name: 'Unmatched in Warehouse',
        value: breakdown.unmatched.count,
        color: COLORS.unmatched,
        units: breakdown.unmatched.units,
      },
    ].filter((item) => item.value > 0);
  }, [breakdown]);

  // 2. Variance Distribution Buckets (Histogram-style Bar Chart)
  const distributionData = useMemo(() => {
    const buckets = [
      { range: '< -20', count: 0, label: 'Large Deficit (<-20)', fill: '#e11d48' },
      { range: '-20 to -6', count: 0, label: 'Moderate Deficit (-20 to -6)', fill: '#f43f5e' },
      { range: '-5 to -1', count: 0, label: 'Small Deficit (-5 to -1)', fill: '#fb7185' },
      { range: '0 (No Change)', count: 0, label: 'In Sync (Delta: 0)', fill: '#94a3b8' },
      { range: '+1 to +5', count: 0, label: 'Small Surplus (+1 to +5)', fill: '#34d399' },
      { range: '+6 to +20', count: 0, label: 'Moderate Surplus (+6 to +20)', fill: '#10b981' },
      { range: '> +20', count: 0, label: 'Large Surplus (>+20)', fill: '#059669' },
    ];

    for (const item of items) {
      if (item.status === 'unmatched_retained') continue; // Only count matched comparisons
      const delta = item.delta;
      if (delta < -20) buckets[0].count++;
      else if (delta >= -20 && delta <= -6) buckets[1].count++;
      else if (delta >= -5 && delta <= -1) buckets[2].count++;
      else if (delta === 0) buckets[3].count++;
      else if (delta >= 1 && delta <= 5) buckets[4].count++;
      else if (delta >= 6 && delta <= 20) buckets[5].count++;
      else if (delta > 20) buckets[6].count++;
    }

    return buckets;
  }, [items]);

  // Custom Tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg border border-slate-700">
          <p className="font-semibold text-slate-200">{data.label}</p>
          <p className="mt-1 font-mono tabular-nums text-emerald-400">
            {data.count.toLocaleString()} products
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg border border-slate-700">
          <p className="font-semibold" style={{ color: data.color }}>
            {data.name}
          </p>
          <p className="mt-1 font-mono tabular-nums">
            {data.value.toLocaleString()} items ({((data.value / summary.totalOpenCartRows) * 100).toFixed(1)}%)
          </p>
          <p className="text-[11px] text-slate-400 font-mono tabular-nums">
            Total Shift: {data.units.toLocaleString()} units
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Stock Quantity Shift & Variance Distribution
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Visual breakdown of inventory adjustments between Autocount warehouse and OpenCart catalog
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setViewMode('both')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              viewMode === 'both'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dual View
          </button>
          <button
            onClick={() => setViewMode('variance')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              viewMode === 'variance'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Variance Histogram
          </button>
          <button
            onClick={() => setViewMode('pie')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              viewMode === 'pie'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Adjustment Share
          </button>
        </div>
      </div>

      {/* 4 Quick Stat Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Increased */}
        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Stock Increased
            </span>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-emerald-700">
              {breakdown.increased.count.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-600 font-mono tabular-nums">
              (+{breakdown.increased.units.toLocaleString()} units)
            </span>
          </div>
        </div>

        {/* Decreased */}
        <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Stock Decreased
            </span>
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-rose-700">
              {breakdown.decreased.count.toLocaleString()}
            </span>
            <span className="text-xs text-rose-600 font-mono tabular-nums">
              (-{breakdown.decreased.units.toLocaleString()} units)
            </span>
          </div>
        </div>

        {/* Identical */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Identical / In Sync
            </span>
            <Minus className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-slate-800">
              {breakdown.identical.count.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">items</span>
          </div>
        </div>

        {/* Unmatched */}
        <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Unmatched in Warehouse
            </span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-amber-700">
              {breakdown.unmatched.count.toLocaleString()}
            </span>
            <span className="text-xs text-amber-600">retained</span>
          </div>
        </div>
      </div>

      {/* Visual Charts Layout */}
      <div
        className={`grid gap-6 ${
          viewMode === 'both'
            ? 'grid-cols-1 lg:grid-cols-12'
            : 'grid-cols-1'
        }`}
      >
        {/* Histogram: Distribution of Stock Deltas */}
        {(viewMode === 'both' || viewMode === 'variance') && (
          <div
            className={`border border-slate-200 rounded-xl p-4 bg-slate-50/30 ${
              viewMode === 'both' ? 'lg:col-span-7' : 'w-full'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Variance Spread (Quantity Delta Buckets)
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {items.length.toLocaleString()} total items
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distributionData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                <span>Deficit (Autocount &lt; OpenCart)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" />
                <span>In Sync</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                <span>Surplus (Autocount &gt; OpenCart)</span>
              </div>
            </div>
          </div>
        )}

        {/* Donut Chart: Inventory Proportion */}
        {(viewMode === 'both' || viewMode === 'pie') && (
          <div
            className={`border border-slate-200 rounded-xl p-4 bg-slate-50/30 flex flex-col justify-between ${
              viewMode === 'both' ? 'lg:col-span-5' : 'w-full'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Reconciliation Distribution
              </h3>
              <span className="text-[11px] text-slate-500">Share of Catalog</span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`slice-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-600 truncate">{item.name}</p>
                    <p className="font-mono text-slate-900 font-semibold tabular-nums text-xs">
                      {item.value.toLocaleString()}{' '}
                      <span className="text-slate-400 font-normal">
                        ({((item.value / summary.totalOpenCartRows) * 100).toFixed(0)}%)
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
