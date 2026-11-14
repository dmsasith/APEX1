import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatNumber } from '../../utils/exportUtils';

interface StockBalanceCellProps {
  balance: number;
  threshold: number;
  unit?: string;
  showThresholdHint?: boolean;
  isLow?: boolean;
  unallocated?: boolean;
}

export const StockBalanceCell: React.FC<StockBalanceCellProps> = ({
  balance,
  threshold,
  unit = '',
  showThresholdHint = true,
  isLow: explicitIsLow,
  unallocated = false,
}) => {
  const isLow = unallocated ? false : explicitIsLow !== undefined ? explicitIsLow : balance <= threshold;

  return (
    <div className="inline-flex flex-col items-end text-right ml-auto">
      <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums">
        {unallocated ? (
          <span className="text-slate-400 font-medium text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
            <span>0 {unit}</span>
            <span className="text-[10px] text-slate-500 font-sans">(Not Allocated)</span>
          </span>
        ) : isLow ? (
          <span className="text-red-600 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded text-sm inline-flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
            <span>{formatNumber(balance)} {unit}</span>
          </span>
        ) : (
          <span className="text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-0.5 rounded-md font-bold text-sm inline-flex items-center gap-1">
            <span>{formatNumber(balance)} {unit}</span>
          </span>
        )}
      </div>

      {showThresholdHint && (
        <span className={`text-[11px] mt-0.5 ${unallocated ? 'text-slate-400' : isLow ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
          {unallocated ? `Catalog Threshold: ${threshold}` : isLow ? `Low Stock (Min: ${threshold})` : `Min Threshold: ${threshold}`}
        </span>
      )}
    </div>
  );
};

export const LowStockBadge: React.FC<{ isLow: boolean; threshold?: number }> = ({ isLow, threshold }) => {
  if (isLow) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded">
        <AlertTriangle className="w-3 h-3 text-red-600" />
        LOW STOCK
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
      Adequate
    </span>
  );
};
