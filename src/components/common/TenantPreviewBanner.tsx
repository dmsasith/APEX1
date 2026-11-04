import React from 'react';
import { Eye, ShieldCheck, X, ArrowLeft } from 'lucide-react';
import { useStock } from '../../context/StockContext';

export const TenantPreviewBanner: React.FC = () => {
  const { previewTenant, exitTenantPreview } = useStock();

  if (!previewTenant) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 text-white px-4 py-2.5 text-xs font-bold shadow-md flex items-center justify-between gap-3 border-b border-emerald-400 no-print">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-5 h-5 rounded bg-slate-950 text-emerald-400 flex items-center justify-center shrink-0">
          <Eye className="w-3.5 h-3.5 animate-pulse" />
        </div>
        <div className="truncate">
          <span className="font-black uppercase tracking-wider text-[10px] bg-slate-950 text-emerald-300 px-2 py-0.5 rounded mr-2 border border-emerald-400/40">
            SaaS Tenant Preview Mode
          </span>
          <span className="text-white font-extrabold">
            Inspecting Client Workspace:{' / '}
            <u className="decoration-2 underline-offset-2 text-amber-300">
              {previewTenant.companyName} (app/{previewTenant.slug})
            </u>
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={exitTenantPreview}
        className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-emerald-300 hover:text-white rounded-lg text-xs font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm active:scale-95 border border-emerald-500/40"
        title="Exit Tenant Preview and Return to SaaS Master Control"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
        <span>Exit Client Preview</span>
      </button>
    </div>
  );
};
