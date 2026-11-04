import React from 'react';
import { Eye, ShieldCheck, X, ArrowLeft, UserCheck } from 'lucide-react';
import { useStock } from '../../context/StockContext';

export const AdminPreviewBanner: React.FC = () => {
  const { authUser, viewAsUser, exitViewAsMode } = useStock();

  const isCentralAdmin = authUser?.role === 'Central Warehouse Admin';

  if (!isCentralAdmin || !viewAsUser) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2 text-xs font-bold shadow-md flex items-center justify-between gap-3 border-b border-amber-400 no-print">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-5 h-5 rounded bg-slate-950 text-amber-400 flex items-center justify-center shrink-0">
          <Eye className="w-3.5 h-3.5 animate-pulse" />
        </div>
        <div className="truncate">
          <span className="font-black uppercase tracking-wider text-[10px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded mr-2 border border-amber-400/40">
            Admin View-As Preview
          </span>
          <span className="text-slate-950 font-extrabold">
            Currently Inspecting Scope As:{' '}
            <u className="decoration-2 underline-offset-2">
              {viewAsUser.fullName} ({viewAsUser.role})
            </u>
          </span>
          <span className="hidden sm:inline text-slate-900 font-semibold ml-2">
            (Full Admin Rights &amp; User Switcher Remain Active)
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={exitViewAsMode}
        className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-white rounded-lg text-xs font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm active:scale-95"
        title="Exit Preview and Return to Full Admin View"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
        <span>Return to Full Admin View</span>
      </button>
    </div>
  );
};
