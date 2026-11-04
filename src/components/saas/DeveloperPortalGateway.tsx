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
    <div className="min-h-screen bg-slate-950 bg-radial-[at_top_center] from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center text-slate-100 p-4 sm:p-6 lg:p-8 relative selection:bg-emerald-500 selection:text-slate-950">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        {/* Top Header & Developer Identity Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Master Super Admin Portal</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Developer Admin Portal Gateway
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Welcome back, <strong className="text-slate-200">Sasith Dissanayake</strong>. Select your destination below. Your master account provides direct access to your personal stock as well as full SaaS administration.
          </p>
        </div>

        {/* Sync Toast Feedback */}
        {resetToast && (
          <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 shadow-xl animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{resetToast}</span>
          </div>
        )}

        {/* Selection Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Card 1: Dedicated Master Stock (Apex Developer Only) */}
          <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/70 hover:border-emerald-400 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl shadow-emerald-950/50 transition-all group">
            {/* Top pill badge */}
            <div className="absolute -top-3.5 left-7 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Strictly My Apex Stock Only</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform">
                  <Boxes className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-semibold text-emerald-400/80 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  Master Workspace
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                  <span>📦 My Apex Developer Stock</span>
                </h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Direct, private access to your own inventory system. Opens the Central Warehouse, POs, dispatch notes, items catalog, and project stock for <strong>Apex Developer</strong>.
                </p>
              </div>

              {/* Isolation & Feature Guarantees */}
              <div className="bg-slate-950/60 border border-emerald-900/40 rounded-xl p-3 space-y-2 text-[11px]">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Company: Apex Developer (100% Isolated)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Primary Warehouse: Main Central Warehouse</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Guaranteed: Client companies never mix here</span>
                </div>
              </div>
            </div>

            {/* Direct Action Button */}
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleOpenMyStock}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-98 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-slate-950 shrink-0" />
                <span>Go to My Apex Stock Manager</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>

          {/* Card 2: SaaS Multi-Tenant Platform Master Owner Control */}
          <div className="relative bg-slate-900/80 hover:bg-slate-850/90 border-2 border-slate-800 hover:border-slate-700 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl transition-all group">
            {/* Top pill badge */}
            <div className="absolute -top-3.5 left-7 bg-slate-800 border border-slate-700 text-teal-300 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Multi-Tenant Platform Control</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform">
                  <Sparkles className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  Super Admin
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-white group-hover:text-teal-300 transition-colors flex items-center gap-2">
                  <span>👑 SaaS Master Owner Panel</span>
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Platform management dashboard to view all registered client companies, extend 7-day trials, activate $19.90/mo or $189/yr subscriptions, inspect workspaces, and monitor revenue.
                </p>
              </div>

              {/* Platform Modules list */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2 text-[11px]">
                <div className="flex items-center gap-2 text-teal-400 font-semibold">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Client Registry &amp; Workspace Management</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Monthly ($19.90) &amp; Annual ($189) Plans</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Isolated Inspection (No state mutation)</span>
                </div>
              </div>
            </div>

            {/* SaaS Control Action Button */}
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={onSelectSaasOwner}
                className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600 active:scale-98 cursor-pointer shadow-md"
              >
                <span>Open SaaS Master Control</span>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Utility Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-900 px-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualReset}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-emerald-300 rounded-lg font-semibold transition inline-flex items-center gap-1.5 cursor-pointer border border-slate-800 shadow-2xs"
              title="Force environment reset and lock strictly to Apex Developer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Force Reset to Apex Developer</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={logout}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-rose-300 rounded-lg font-semibold transition inline-flex items-center gap-1.5 cursor-pointer border border-slate-800"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out / Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
