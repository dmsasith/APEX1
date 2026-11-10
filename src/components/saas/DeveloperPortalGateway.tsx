import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  ArrowRight,
  ShieldCheck,
  LogOut,
  Boxes,
  Zap,
  RotateCcw,
  CheckCircle2,
  Lock,
  Layers,
  ChevronRight,
  ShieldAlert,
  Warehouse,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';

interface DeveloperPortalGatewayProps {
  onSelectSaasOwner: () => void;
  onSelectStockManager: () => void;
}

export const DeveloperPortalGateway: React.FC<DeveloperPortalGatewayProps> = ({
  onSelectSaasOwner,
  onSelectStockManager,
}) => {
  const { logout, switchToMasterStock } = useStock();
  const [resetToast, setResetToast] = useState<string | null>(null);

  const handleOpenMyStock = () => {
    // 100% Guaranteed switch: resets URL parameters, wipes preview/viewAs, locks state to Apex Developer
    switchToMasterStock();
    onSelectStockManager();
  };

  const handleManualReset = () => {
    switchToMasterStock();
    setResetToast('Guaranteed sync: Environment locked strictly to Apex Developer Stock (tenant-apex-main).');
    setTimeout(() => setResetToast(null), 3500);
  };

  return (
    <div className="min-h-screen liquid-glass-canvas flex flex-col items-center justify-center text-slate-900 p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Ambient Liquid Glass Light Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-28 -left-24 w-[440px] h-[440px] rounded-full bg-gradient-to-br from-emerald-300/35 via-teal-200/25 to-transparent blur-3xl" />
        <div className="absolute top-1/4 -right-28 w-[460px] h-[460px] rounded-full bg-gradient-to-bl from-sky-300/35 via-indigo-200/25 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-[500px] h-[360px] rounded-full bg-gradient-to-tr from-teal-200/30 via-emerald-100/25 to-transparent blur-3xl" />
      </div>

      <div className="max-w-4xl w-full mx-auto space-y-6 relative z-10">
        {/* Top Header & Developer Identity Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-white/95 text-emerald-800 text-xs font-extrabold tracking-wide shadow-[0_6px_18px_-6px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,1)]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Master Super Admin Portal</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
            Developer Admin Portal Gateway
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Welcome back, <strong className="text-slate-900 font-extrabold">Sasith Dissanayake</strong>. Select your destination below. Your master account provides direct access to your personal stock as well as full SaaS administration.
          </p>
        </div>

        {/* Sync Toast Feedback */}
        {resetToast && (
          <div className="p-3.5 bg-emerald-50/95 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-center gap-2 shadow-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resetToast}</span>
          </div>
        )}

        {/* Selection Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Card 1: Dedicated Master Stock (Apex Developer Only) */}
          <div className="relative bg-gradient-to-br from-white/90 via-white/80 to-emerald-50/75 backdrop-blur-xl border border-white/95 hover:border-emerald-300 rounded-[28px] p-6 sm:p-8 flex flex-col justify-between shadow-[0_24px_60px_-15px_rgba(16,185,129,0.16),0_10px_28px_-10px_rgba(15,23,42,0.07),inset_0_1px_1px_rgba(255,255,255,1)] transition-all group">
            {/* Top pill badge */}
            <div className="absolute -top-3.5 left-7 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1.5 border border-emerald-400/50">
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Strictly My Apex Stock Only</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-[0_10px_22px_-6px_rgba(16,185,129,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] group-hover:scale-105 transition-transform">
                  <Boxes className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200/90">
                  Master Workspace
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                  <span>📦 My Apex Developer Stock</span>
                </h2>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  Direct, private access to your own inventory system. Opens the Central Warehouse, POs, dispatch notes, items catalog, and project stock for <strong>Apex Developer</strong>.
                </p>
              </div>

              {/* Isolation & Feature Guarantees */}
              <div className="bg-white/75 border border-white/95 rounded-2xl p-3.5 space-y-2 text-[11px] shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>Company: Apex Developer (100% Isolated)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Warehouse className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Primary Warehouse: Main Central Warehouse</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Guaranteed: Client companies never mix here</span>
                </div>
              </div>
            </div>

            {/* Direct Action Button */}
            <div className="mt-6 pt-4 border-t border-slate-200/70">
              <button
                type="button"
                onClick={handleOpenMyStock}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_12px_28px_-6px_rgba(16,185,129,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-98 cursor-pointer border border-emerald-400/40"
              >
                <Zap className="w-4 h-4 fill-white shrink-0" />
                <span>Go to My Apex Stock Manager</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>

          {/* Card 2: SaaS Multi-Tenant Platform Master Owner Control */}
          <div className="relative bg-gradient-to-br from-white/90 via-white/80 to-sky-50/75 backdrop-blur-xl border border-white/95 hover:border-sky-300 rounded-[28px] p-6 sm:p-8 flex flex-col justify-between shadow-[0_24px_60px_-15px_rgba(14,165,233,0.14),0_10px_28px_-10px_rgba(15,23,42,0.07),inset_0_1px_1px_rgba(255,255,255,1)] transition-all group">
            {/* Top pill badge */}
            <div className="absolute -top-3.5 left-7 bg-white/95 border border-sky-200 text-sky-800 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Multi-Tenant Platform Control</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-[0_10px_22px_-6px_rgba(14,165,233,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] group-hover:scale-105 transition-transform">
                  <Sparkles className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-extrabold text-sky-800 bg-sky-100/80 px-3 py-1 rounded-full border border-sky-200/90">
                  Super Admin
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900 group-hover:text-sky-700 transition-colors flex items-center gap-2">
                  <span>👑 SaaS Master Owner Panel</span>
                </h2>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  Platform management dashboard to view all registered client companies, extend 7-day trials, activate $19.90/mo or $189/yr subscriptions, inspect workspaces, and monitor revenue.
                </p>
              </div>

              {/* Platform Modules list */}
              <div className="bg-white/75 border border-white/95 rounded-2xl p-3.5 space-y-2 text-[11px] shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="flex items-center gap-2 text-sky-700 font-bold">
                  <Building2 className="w-3.5 h-3.5 shrink-0 text-sky-600" />
                  <span>Client Registry &amp; Workspace Management</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Monthly ($19.90) &amp; Annual ($189) Plans</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Isolated Inspection (No state mutation)</span>
                </div>
              </div>
            </div>

            {/* SaaS Control Action Button */}
            <div className="mt-6 pt-4 border-t border-slate-200/70">
              <button
                type="button"
                onClick={onSelectSaasOwner}
                className="w-full py-3.5 px-4 bg-white/90 hover:bg-white text-slate-900 font-extrabold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 border border-slate-200/90 hover:border-sky-300 active:scale-98 cursor-pointer shadow-sm"
              >
                <span>Open SaaS Master Control</span>
                <ChevronRight className="w-4 h-4 text-sky-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Utility Bar */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 border-t border-white/70 px-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualReset}
              className="px-3.5 py-2 bg-white/80 hover:bg-white text-slate-700 hover:text-emerald-700 rounded-xl font-bold transition inline-flex items-center gap-1.5 cursor-pointer border border-white/95 shadow-xs"
              title="Force environment reset and lock strictly to Apex Developer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Force Reset to Apex Developer</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 bg-white/80 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl font-bold transition inline-flex items-center gap-1.5 cursor-pointer border border-white/95 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Sign Out / Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
