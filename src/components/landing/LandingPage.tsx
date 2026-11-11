import React, { useState } from 'react';
import {
  Boxes,
  ShieldCheck,
  Building2,
  Users2,
  Send,
  Truck,
  CheckCircle2,
  ArrowRight,
  Database,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  LogIn,
  Check,
  QrCode,
  Zap,
  Layers,
  CheckCheck,
  Crown,
  CreditCard,
  Gift,
  FolderKanban,
  Wrench,
  Radio,
  HardHat,
  Droplets,
  Warehouse,
  BookOpen,
} from 'lucide-react';
import { TenantSignupModal } from './TenantSignupModal';
import { SystemUserGuideView } from './SystemUserGuideView';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenSignup?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [activeLandingTab, setActiveLandingTab] = useState<'overview' | 'guide'>('overview');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [selectedIndustryIdx, setSelectedIndustryIdx] = useState<number>(0);

  const handleOpenGuideTab = () => {
    setActiveLandingTab('guide');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchToOverviewSection = (sectionId?: string) => {
    setActiveLandingTab('overview');
    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 40);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Target Industries ("Who Is This Built For?") — 100% International English
  const industries = [
    {
      icon: HardHat,
      badge: 'Civil & Construction',
      title: 'Civil, Building & Road Construction Firms',
      subtitle: 'Multi-Site Construction Yards & Heavy Fleet Operations',
      desc: 'Control cement, steel, aggregates, and heavy machinery fleets (excavators, generators, compactors) across multiple active construction sites and central storage yards.',
      features: [
        'Consumable Materials + Machinery Fleet',
        'Central Warehouse to Site Transfers',
        'Multi-Crew BOQ Material Consumption',
      ],
    },
    {
      icon: Radio,
      badge: 'Telecom & Fiber EPC',
      title: 'Telecom & Fiber Optic Contractors',
      subtitle: 'OSP Rollouts, FTTH Deployments & Tower Infrastructure',
      desc: 'Track fiber cable drums, splice closures, poles, and network hardware across regional yards. Manage Client-Supplied Free Materials received from telecom operators with automatic project deduction.',
      features: [
        'Client-Supplied Free Stock Tracking',
        'Cable Drum & Batch Serial Remarks',
        'Site / WBS Project Reconciliation',
      ],
    },
    {
      icon: Zap,
      badge: 'Power & Solar EPC',
      title: 'Electrical, Solar & Power Grid Contractors',
      subtitle: 'Substations, Renewable Energy & Transmission Projects',
      desc: 'Manage high-value transformers, solar panels, inverters, and transmission cables. Issue materials to specialized electrical line crews and monitor live in-hand custody balances.',
      features: [
        'High-Value Equipment Custody Audits',
        'Field Crew In-Hand Stock Balances',
        'Supplier Purchase Orders & GRN Logs',
      ],
    },
    {
      icon: Droplets,
      badge: 'Water & Utilities',
      title: 'Water Supply, Drainage & Pipeline Projects',
      subtitle: 'Municipal Utility Networks & Pipeline Infrastructure',
      desc: 'Track HDPE/DI pipes, valves, fittings, and jointing kits across pipeline sections. Reconcile issued vs. installed quantities and process surplus material returns cleanly.',
      features: [
        'Reusable Pipeline Section Templates',
        'Issued vs. Installed Variance Reports',
        'Surplus & Damaged Stock Returns',
      ],
    },
    {
      icon: Warehouse,
      badge: 'Warehousing & Supply',
      title: 'Multi-Branch Hardware & Central Distributors',
      subtitle: 'Central Distribution Hubs & Regional Branch Stores',
      desc: 'Operate a Central HQ Warehouse that supplies multiple regional branches. Branch supervisors only access and manage their own assigned branch stock with strict security locks.',
      features: [
        'Branch-Locked Supervisor Access',
        'Automated Low-Stock Threshold Alerts',
        'Official Printable Dispatch & Gate Passes',
      ],
    },
    {
      icon: Wrench,
      badge: 'MEP & Field Service',
      title: 'Engineering, MEP & Facility Maintenance Teams',
      subtitle: 'Mobile Service Crews, Technicians & Tool Custody',
      desc: 'Issue returnable testing instruments, power tools, and spare parts to mobile technician teams. Know exactly which team leader holds every tool or instrument at any moment.',
      features: [
        'Returnable Tool & Instrument Custody',
        'Field Technician Crew Directory',
        'Tamper-Proof Transaction Audit Trail',
      ],
    },
  ];

  const faqs = [
    {
      q: 'How does the 7-Day Free Trial work?',
      a: 'You can register your company workspace in under 60 seconds with zero commitment. No credit card is required to sign up. You get 100% full access to all enterprise modules—including unlimited site branches, field teams, client-supplied stock tracking, supplier purchase orders, and PDF voucher printing for a full 7 days.',
    },
    {
      q: 'What happens after the 7-day free trial?',
      a: 'After 7 days, you can choose between our Pro Monthly plan ($19.90/mo) or our cost-saving Pro Annual VIP plan ($189/yr — Save 21%). All data, inventory records, and transaction history entered during your trial remain 100% safe and intact. You can activate your plan via Bank QR or wire transfer slip upload.',
    },
    {
      q: 'How does Client-Supplied Free Stock work with the Master Client Register?',
      a: 'When a project owner or main contractor supplies materials free of charge for a specific project, you register the client in the Client Register and log their Dispatch Note (DN). When field teams record material installation on that project, the system automatically deducts from the Client-Supplied Stock first before touching your company-purchased inventory.',
    },
    {
      q: 'How is our company data kept separate from other clients (Multi-Tenant Security)?',
      a: 'Apex Stock runs on a strict multi-tenant cloud architecture on Firebase. Each registered company receives an isolated cryptographic tenant partition (tenantId). Company A can never view, search, or access Company B records.',
    },
    {
      q: 'Can site branch supervisors view or issue materials from other branches?',
      a: 'No. When you create a user account assigned to a specific Site Branch, their workspace automatically locks to that branch. They can only request stock from Central HQ, manage their own branch inventory, and issue items to field teams under their branch.',
    },
    {
      q: 'Can we import our existing inventory catalog from Excel and back up our data?',
      a: 'Yes! You can bulk-import thousands of material items and machinery assets from Excel/CSV in seconds, and export a 1-Click Full System JSON Backup (or Excel spreadsheets) anytime from your header toolbar.',
    },
  ];

  return (
    <div className="min-h-screen construction-blueprint-canvas text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-amber-400 overflow-x-hidden relative">
      {/* Rich Industrial Ambient Orbs (Blueprint Blue + Construction Amber + Deep Survey Emerald) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 no-print">
        <div className="absolute -top-28 -left-24 w-[540px] h-[540px] rounded-full bg-gradient-to-br from-sky-700/25 via-blue-800/18 to-transparent blur-[115px]" />
        <div className="absolute top-1/6 -right-28 w-[520px] h-[520px] rounded-full bg-gradient-to-bl from-amber-500/30 via-amber-600/18 to-transparent blur-[120px]" />
        <div className="absolute bottom-1/6 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-700/22 via-sky-800/15 to-amber-500/15 blur-[130px]" />
      </div>

      {/* Top Industrial Safety Amber & Gunmetal Accent Rule */}
      <div className="h-1 w-full bg-gradient-to-r from-slate-950 via-amber-500 to-slate-950 relative z-50 no-print" />

      {/* Sticky Tempered Architectural Glass Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-2xl border-b border-slate-300/80 shadow-[0_8px_28px_-10px_rgba(15,23,42,0.10),inset_0_1px_0_0_rgba(255,255,255,0.95)] no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Clean Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleSwitchToOverviewSection()}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-sm">
              <Boxes className="w-5 h-5 text-amber-400" />
            </div>
            <span className="font-black text-lg text-slate-950 tracking-tight">Apex Stock</span>
          </button>

          {/* Zone 2: Primary Top Tabs & Concise Section Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-700">
            <button
              type="button"
              onClick={() => handleSwitchToOverviewSection()}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                activeLandingTab === 'overview'
                  ? 'text-slate-950 border-b-2 border-amber-500 font-extrabold'
                  : 'hover:text-slate-950'
              }`}
            >
              Overview
            </button>

            <button
              type="button"
              onClick={handleOpenGuideTab}
              className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                activeLandingTab === 'guide'
                  ? 'text-amber-700 border-b-2 border-amber-500 font-extrabold'
                  : 'text-slate-800 hover:text-amber-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>User Guide & Features</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchToOverviewSection('industries')}
              className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Industries
            </button>

            <button
              type="button"
              onClick={() => handleSwitchToOverviewSection('features')}
              className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Capabilities
            </button>

            <button
              type="button"
              onClick={() => handleSwitchToOverviewSection('pricing')}
              className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Pricing
            </button>
          </nav>

          {/* Zone 3: Workspace Access & Trial Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenLogin}
              className="px-3.5 py-2 text-xs font-bold text-slate-800 hover:text-slate-950 bg-white/90 hover:bg-white border border-slate-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-700" />
              <span>Client Login</span>
            </button>

            <button
              onClick={() => setIsSignupOpen(true)}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-slate-950/15 transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0 border border-slate-800"
            >
              <span className="text-amber-400 font-black">Start 7-Day Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Quick Top Tab Switcher (Visible below lg breakpoint) */}
      <div className="lg:hidden relative z-30 max-w-7xl w-full mx-auto px-4 pt-3 no-print">
        <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-300/80 shadow-2xs">
          <button
            type="button"
            onClick={() => handleSwitchToOverviewSection()}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
              activeLandingTab === 'overview'
                ? 'bg-slate-950 text-amber-400 shadow-xs'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            Platform Overview
          </button>
          <button
            type="button"
            onClick={handleOpenGuideTab}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeLandingTab === 'guide'
                ? 'bg-slate-950 text-amber-400 shadow-xs'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>User Guide & PDF</span>
          </button>
        </div>
      </div>

      {/* ==================== CONDITIONAL VIEW: DEDICATED USER GUIDE TAB OR MAIN OVERVIEW ==================== */}
      {activeLandingTab === 'guide' ? (
        <SystemUserGuideView
          onBackToOverview={() => handleSwitchToOverviewSection()}
          onOpenSignup={() => setIsSignupOpen(true)}
          onOpenLogin={onOpenLogin}
        />
      ) : (
        <>
          {/* ==================== HERO SECTION (TEMPERED ARCHITECTURAL GLASS ON CONCRETE BLUEPRINT) ==================== */}
          <section className="relative pt-10 pb-16 sm:pt-14 sm:pb-20 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              {/* Tempered Architectural Glass Hero Stage */}
              <div className="relative rounded-[32px] bg-white/65 backdrop-blur-3xl border border-white/95 ring-1 ring-slate-900/8 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.14),inset_0_1px_2px_0_rgba(255,255,255,1)] p-6 sm:p-10 lg:p-14 overflow-hidden">
                {/* Inner Blueprint-Blue & Construction-Amber Specular Reflections */}
                <div className="absolute -top-24 left-1/5 w-96 h-96 rounded-full bg-gradient-to-br from-sky-600/18 via-blue-500/10 to-transparent blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 right-1/5 w-96 h-96 rounded-full bg-gradient-to-tl from-amber-500/22 via-amber-400/12 to-transparent blur-3xl pointer-events-none" />

                {/* Clean Editorial Kicker */}
                <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-slate-600 tracking-wide mb-5">
                  <HardHat className="w-4 h-4 text-amber-600" />
                  <span className="text-slate-800">Built for Construction, EPC, Telecom & Multi-Site Contractors</span>
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span className="text-emerald-700 font-extrabold">7-Day Unrestricted Free Trial</span>
                </div>

                {/* Clear, Immediately Understandable International Headline */}
                <h1 className="relative z-10 text-3xl sm:text-5xl lg:text-[54px] font-black text-slate-950 tracking-tight leading-[1.13] max-w-4xl mx-auto text-balance">
                  Complete Inventory Control Across All Your{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-900 via-amber-700 to-emerald-800">
                    Warehouses, Project Sites & Field Teams
                  </span>
                </h1>

                {/* Clear Subtitle Without Confusing Jargon */}
                <p className="relative z-10 mt-5 text-sm sm:text-base lg:text-lg text-slate-700 max-w-3xl mx-auto leading-relaxed font-medium">
                  Stop losing track of construction materials, tools, and site stock across spreadsheets. Manage your{' '}
                  <strong className="text-slate-950">Central Warehouse</strong>,{' '}
                  <strong className="text-slate-950">Regional Site Branches</strong>,{' '}
                  <strong className="text-slate-950">Client-Supplied Free Materials</strong>,{' '}
                  <strong className="text-slate-950">Heavy Machinery Fleets</strong>, and{' '}
                  <strong className="text-slate-950">Daily Crew Dispatches</strong> in one real-time cloud workspace.
                </p>

                {/* 4 Core Operational Pillars (Clean Unboxed Architectural Strip) */}
                <div className="relative z-10 mt-6 pt-5 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 max-w-4xl mx-auto text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Warehouse className="w-4 h-4 text-slate-700" />
                    <span>Central & Branch Warehouses</span>
                  </span>
                  <span aria-hidden="true" className="hidden sm:inline text-slate-300">·</span>
                  <span className="flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-amber-600" />
                    <span>Client-Supplied Free Materials</span>
                  </span>
                  <span aria-hidden="true" className="hidden sm:inline text-slate-300">·</span>
                  <span className="flex items-center gap-1.5">
                    <Users2 className="w-4 h-4 text-slate-700" />
                    <span>Field Crew In-Hand Tracking</span>
                  </span>
                  <span aria-hidden="true" className="hidden sm:inline text-slate-300">·</span>
                  <span className="flex items-center gap-1.5">
                    <FolderKanban className="w-4 h-4 text-amber-600" />
                    <span>Project Usage Reconciliation</span>
                  </span>
                </div>

                {/* Hero CTAs */}
                <div className="relative z-10 mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                  <button
                    onClick={() => setIsSignupOpen(true)}
                    className="w-full sm:w-auto px-7 py-3.5 bg-slate-950 hover:bg-slate-800 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-slate-950/20 border border-slate-800 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    <span className="text-amber-400">Start 7-Day Free Trial</span>
                    <span className="text-slate-400 font-medium text-xs">($0 Today)</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </button>

                  <button
                    onClick={onOpenLogin}
                    className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 hover:border-slate-400 font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <LogIn className="w-4 h-4 text-slate-700" />
                    <span>Client Sign In / Workspace Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenGuideTab}
                    className="w-full sm:w-auto px-5 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <BookOpen className="w-4 h-4 text-slate-950" />
                    <span>Read Full User Guide & PDF</span>
                  </button>
                </div>

                {/* Trust Guarantees (Clean Editorial Inline Metadata) */}
                <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>60-Second Workspace Setup</span>
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <CreditCard className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>No Credit Card Required for Trial</span>
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="tabular-nums">$19.90/mo or $189/yr (Save 21%)</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>100% Isolated Tenant Cloud</span>
                </div>

                {/* Dark Gunmetal Executive Site Operations Preview inside Tempered Glass Frame */}
                <div className="relative z-10 mt-10 rounded-[24px] bg-slate-200/70 backdrop-blur-2xl border border-white p-2.5 sm:p-3.5 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.22)] max-w-5xl mx-auto">
                  <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-stone-950 rounded-[18px] border border-slate-800 p-4 sm:p-6 text-left relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
                    {/* Top window bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800 mb-5 relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-700" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/90" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/90" />
                        <span className="text-xs text-slate-400 font-mono ml-2">
                          apex-stock-cloud / site-operations-control
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-300">
                        <span>Client-Supplied Stock Synced</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-amber-400">Multi-Site Cloud Active</span>
                      </div>
                    </div>

                    {/* Mock dashboard KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 relative z-10">
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                        <div className="text-[11px] text-slate-400 font-semibold">Central Warehouse Stock</div>
                        <div className="text-xl font-black text-white mt-0.5 font-mono tabular-nums">
                          24,580 <span className="text-xs font-normal text-slate-400">units</span>
                        </div>
                        <div className="text-[10px] text-amber-400 mt-1">Materials & Machinery Fleet</div>
                      </div>
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                        <div className="text-[11px] text-slate-400 font-semibold">Client-Supplied Stock</div>
                        <div className="text-xl font-black text-amber-400 mt-0.5 font-mono tabular-nums">12,400 m</div>
                        <div className="text-[10px] text-slate-400 mt-1">Free-Issue Project Materials</div>
                      </div>
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                        <div className="text-[11px] text-slate-400 font-semibold">Active Sites & Crews</div>
                        <div className="text-xl font-black text-white mt-0.5 font-mono tabular-nums">6 Sites · 18 Crews</div>
                        <div className="text-[10px] text-emerald-400 mt-1">Live In-Hand Custody</div>
                      </div>
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                        <div className="text-[11px] text-slate-400 font-semibold">Project Reconciliations</div>
                        <div className="text-xl font-black text-emerald-400 mt-0.5 font-mono tabular-nums">100% Audited</div>
                        <div className="text-[10px] text-slate-400 mt-1">Multi-Crew BOQ & WBS</div>
                      </div>
                    </div>

                    {/* Smart Priority Strip */}
                    <div className="bg-slate-900/95 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs relative z-10">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-extrabold text-amber-400">
                          Smart Stock Deduction:
                        </span>
                        <span className="text-slate-300 text-[11px]">
                          Project <strong>HIGHWAY-SEC-04</strong> automatically consumes Client-Supplied Free Materials before company warehouse stock
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-400">
                        Zero Stock Discrepancy ✓
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== SECTION 1: WHO IS THIS BUILT FOR? (#industries) ==================== */}
          <section id="industries" className="py-16 sm:py-20 relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Section Header */}
              <div className="text-center max-w-3xl mx-auto mb-12">
                <div className="text-xs font-extrabold text-amber-700 tracking-wide mb-2 flex items-center justify-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Target Construction & Engineering Sectors</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight text-balance">
                  Built for Multi-Site Contractors, Civil Engineering & Warehousing
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 mt-2.5 font-medium">
                  Whether you manage civil construction yards, road & bridge works, fiber optic rollouts, solar & power grid EPC projects, or multi-branch supply hubs—Apex Stock fits your exact field workflow.
                </p>
              </div>

              {/* 6 Industrial Tempered Glass Sector Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {industries.map((ind, idx) => {
                  const IconComponent = ind.icon;
                  const isSelected = selectedIndustryIdx === idx;
                  return (
                    <div
                      key={ind.title}
                      onClick={() => setSelectedIndustryIdx(idx)}
                      className={`group relative overflow-hidden rounded-[24px] p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between backdrop-blur-2xl ${
                        isSelected
                          ? 'bg-white/90 border-2 border-amber-500 shadow-[0_20px_44px_-12px_rgba(15,23,42,0.16),inset_0_1px_1px_0_rgba(255,255,255,1)] -translate-y-0.5'
                          : 'bg-white/75 hover:bg-white/90 border border-white/95 ring-1 ring-slate-900/6 shadow-[0_10px_28px_-10px_rgba(15,23,42,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.95)] hover:ring-amber-500/50'
                      }`}
                    >
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-slate-900 via-amber-500 to-slate-800" />

                      <div>
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div className="w-11 h-11 rounded-xl bg-slate-950 text-amber-400 border border-slate-800 flex items-center justify-center shadow-sm">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">
                            {ind.badge}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-slate-950 tracking-tight leading-snug">
                          {ind.title}
                        </h3>
                        <p className="text-[11px] font-bold text-amber-700 mt-1">
                          {ind.subtitle}
                        </p>
                        <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-medium">
                          {ind.desc}
                        </p>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-slate-200/90 space-y-1.5">
                        {ind.features.map((feat) => (
                          <div key={feat} className="flex items-center gap-2 text-[11px] font-bold text-slate-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ==================== SECTION 2: SYSTEM CAPABILITIES & 4-STEP WORKFLOW (#features) ==================== */}
          <section
            id="features"
            className="py-16 sm:py-20 border-y border-white/75 bg-white/35 backdrop-blur-xl relative z-10"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <div className="text-xs font-extrabold text-amber-700 tracking-wide mb-2">
                  End-to-End Site & Warehouse Capabilities
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight text-balance">
                  How Apex Stock Controls Your Daily Site Operations
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 mt-2 font-medium">
                  From Central Warehouse procurement and Client-Supplied Free Materials to regional yard transfers, field crew dispatches, and project reconciliation.
                </p>
              </div>

              {/* 4-Step Industrial Workflow Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {[
                  {
                    step: '01. Procurement & Intake',
                    title: 'Central Stock & Client Stock',
                    desc: 'Receive Supplier Purchase Orders (GRN) or log Client-Supplied Free Materials into your Central Warehouse.',
                  },
                  {
                    step: '02. Regional Transfers',
                    title: 'Branch Site Requisitions',
                    desc: 'Regional Site Yards request materials; Central HQ dispatches stock with smart shortage verification.',
                  },
                  {
                    step: '03. Field Dispatch',
                    title: 'Field Crew Issuance',
                    desc: 'Site Supervisors issue materials & machinery to Field Crews with official numbered Issue Notes.',
                  },
                  {
                    step: '04. Site Audit',
                    title: 'Project Usage & Returns',
                    desc: 'Log multi-team project consumption (client stock deducted first) & return unused items to inventory.',
                  },
                ].map((item, idx) => (
                  <div
                    key={item.step}
                    className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-stone-950 text-white p-5 border border-slate-800 shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono font-bold text-amber-400">
                          {item.step}
                        </span>
                        <span className="text-xs font-mono text-slate-500 tabular-nums">0{idx + 1}/04</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-white mt-2">{item.title}</h4>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 6 Detailed Feature Cards in Tempered Architectural Glass */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white/80 hover:bg-white/95 backdrop-blur-2xl border border-white ring-1 ring-slate-900/6 rounded-[22px] p-6 shadow-[0_10px_28px_-10px_rgba(15,23,42,0.08)] hover:ring-amber-500/50 transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center mb-4">
                    <Gift className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-950">
                    Client-Supplied Free Stock & Client Register
                  </h3>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                    Directly connected Master Client Register and Free-Issue Stock ledger. Record client-provided project materials at zero cost liability and auto-deduct them when projects consume stock.
                  </p>
                </div>

                <div className="bg-white/80 hover:bg-white/95 backdrop-blur-2xl border border-white ring-1 ring-slate-900/6 rounded-[22px] p-6 shadow-[0_10px_28px_-10px_rgba(15,23,42,0.08)] hover:ring-amber-500/50 transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center mb-4">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-950">
                    Multi-Team Project Usage & Section Templates
                  </h3>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                    Load reusable project section templates, assign multiple field crews to the same project, and track exact material installation per crew and WBS site identifier.
                  </p>
                </div>

                <div className="bg-white/80 hover:bg-white/95 backdrop-blur-2xl border border-white ring-1 ring-slate-900/6 rounded-[22px] p-6 shadow-[0_10px_28px_-10px_rgba(15,23,42,0.08)] hover:ring-amber-500/50 transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center mb-4">
                    <Truck className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-950">
                    Materials + Heavy Machinery Fleet Control
                  </h3>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                    Dedicated classification for Consumable Materials and Returnable Heavy Machinery/Tools (Excavators, Generators, Compactors, Splicers) with custom fleet categories.
                  </p>
                </div>

                <div className="bg-white/80 hover:bg-white/95 backdrop-blur-2xl border border-white ring-1 ring-slate-900/6 rounded-[22px] p-6 shadow-[0_10px_28px_-10px_rgba(15,23,42,0.08)] hover:ring-amber-500/50 transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center mb-4">
                    <Send className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-950">
                    Inter-Branch Requisitions & Shortage Review
                  </h3>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                    Site yards request stock from Central HQ. Central logistics officers review live warehouse balances with 1-click &ldquo;Send Available Only&rdquo; or shortage adjustments.
                  </p>
                </div>

                <div className="bg-white/80 hover:bg-white/95 backdrop-blur-2xl border border-white ring-1 ring-slate-900/6 rounded-[22px] p-6 shadow-[0_10px_28px_-10px_rgba(15,23,42,0.08)] hover:ring-amber-500/50 transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center mb-4">
                    <Users2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-950">
                    Field Team In-Hand Custody & Return Notes
                  </h3>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                    See every item and tool currently held by each field crew leader. Process unused or damaged stock returns back into Site Branch or Central inventory.
                  </p>
                </div>

                <div className="bg-white/80 hover:bg-white/95 backdrop-blur-2xl border border-white ring-1 ring-slate-900/6 rounded-[22px] p-6 shadow-[0_10px_28px_-10px_rgba(15,23,42,0.08)] hover:ring-amber-500/50 transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center mb-4">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-950">
                    Excel Bulk Import, JSON Backup & Printable PDFs
                  </h3>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                    Import thousands of catalog items via Excel/CSV, print official Dispatch/Issue/PO Gate Passes, and safeguard records with 1-Click JSON Backup & Restore.
                  </p>
                </div>
              </div>

              {/* Direct Callout Banner to Open the Full Step-by-Step User Guide & PDF */}
              <div className="mt-10 rounded-2xl bg-white/90 border border-slate-300/90 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start sm:items-center gap-3.5 text-left">
                  <div className="w-11 h-11 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-950">
                      Want to see step-by-step how every module works in practice?
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Explore our complete client-friendly System User Guide & Feature Handbook—or download it as an A4 PDF for your team.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenGuideTab}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition whitespace-nowrap shrink-0 shadow-sm"
                >
                  <span>Open Full User Guide & PDF</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* ==================== SECTION 3: MULTI-TENANT CLOUD ARCHITECTURE (#architecture) ==================== */}
          <section id="architecture" className="py-16 sm:py-20 relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-stone-950 rounded-[28px] p-6 sm:p-10 lg:p-12 border border-slate-800 shadow-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-slate-800 via-amber-500 to-slate-800" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10">
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-3">
                      <Database className="w-4 h-4" />
                      <span>Enterprise Multi-Tenancy & Data Security</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight text-balance">
                      100% Isolated Cloud Workspace for Every Registered Company
                    </h2>
                    <p className="text-slate-300 text-xs sm:text-sm mt-3.5 leading-relaxed">
                      Each contractor operates in its own dedicated tenant partition on Firebase Realtime Cloud. Your stock balances, supplier rates, Client Register, and field team logs are strictly isolated and protected.
                    </p>

                    <div className="mt-7 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white">Zero Cross-Tenant Data Leakage</h4>
                          <p className="text-[11px] sm:text-xs text-slate-400">
                            Strict tenantId isolation guarantees Company A can never see or modify Company B records.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white">Branch-Level Site Yard Locks</h4>
                          <p className="text-[11px] sm:text-xs text-slate-400">
                            Branch supervisors are automatically restricted to their assigned site yard with zero access to other branches.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white">Safe Flush & 1-Click JSON Backups</h4>
                          <p className="text-[11px] sm:text-xs text-slate-400">
                            Export full JSON backups anytime. Even when flushing stock transactions, your tenant account and user logins remain safe.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Architecture Diagram Card */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                      <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        <span>Tenant Data Isolation Model</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Firebase Cloud RTDB</span>
                    </div>

                    <div className="space-y-3.5">
                      <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Your Company Tenant Partition</span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            ISOLATED
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-2 text-[10px] text-slate-300 font-mono">
                          <div className="bg-slate-900 p-2 rounded text-center">/items</div>
                          <div className="bg-slate-900 p-2 rounded text-center">/sites</div>
                          <div className="bg-slate-900 p-2 rounded text-center">/clients</div>
                          <div className="bg-slate-900 p-2 rounded text-center">/users</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 opacity-65">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">Other Enterprise Client Partition</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ENCRYPTED
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Role-Based Access Control (RBAC)</span>
                      </span>
                      <span className="text-emerald-400 font-bold">100% Protected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== SECTION 4: PRICING PLANS (#pricing — TEMPERED GLASS + CARBON GOLD VIP CARD) ==================== */}
          <section id="pricing" className="py-16 sm:py-24 border-t border-slate-300/70 relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-10">
                <div className="text-xs font-extrabold text-amber-700 tracking-wide mb-2">
                  Clear & Transparent Enterprise Pricing
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight text-balance">
                  Choose the Plan That Fits Your Operations
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 mt-3 max-w-xl mx-auto font-medium">
                  Start with our unrestricted 7-day free trial ($0 today). Continue seamlessly with flexible monthly billing or our discounted annual VIP plan.
                </p>
              </div>

              {/* 3-Step Onboarding Strip */}
              <div className="max-w-4xl mx-auto mb-12 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/80 backdrop-blur-2xl border border-white ring-1 ring-slate-900/6 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-3 px-3 py-2">
                  <span className="w-7 h-7 rounded-lg bg-slate-950 text-amber-400 font-mono text-xs font-black flex items-center justify-center shrink-0 tabular-nums">
                    01
                  </span>
                  <div className="text-xs">
                    <div className="font-extrabold text-slate-950">Sign Up in 60 Seconds</div>
                    <div className="text-[11px] text-slate-600">No credit card required</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 sm:border-x sm:border-slate-200">
                  <span className="w-7 h-7 rounded-lg bg-slate-950 text-amber-400 font-mono text-xs font-black flex items-center justify-center shrink-0 tabular-nums">
                    02
                  </span>
                  <div className="text-xs">
                    <div className="font-extrabold text-slate-950">Test Everything for 7 Days</div>
                    <div className="text-[11px] text-slate-600">100% full modules unlocked</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2">
                  <span className="w-7 h-7 rounded-lg bg-slate-950 text-amber-400 font-mono text-xs font-black flex items-center justify-center shrink-0 tabular-nums">
                    03
                  </span>
                  <div className="text-xs">
                    <div className="font-extrabold text-slate-950">Easy QR / Wire Activation</div>
                    <div className="text-[11px] text-slate-600">All trial data stays intact</div>
                  </div>
                </div>
              </div>

              {/* 3 Pricing Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch pt-4">
                {/* Card 1: 7-Day Free Trial (Tempered Glass) */}
                <div className="bg-white/80 hover:bg-white/95 border border-white ring-1 ring-slate-900/8 rounded-3xl p-8 flex flex-col relative transition-all duration-200 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
                  <div className="mb-6">
                    <div className="text-xs font-bold text-slate-500">Risk-Free Evaluation</div>
                    <h3 className="text-2xl font-black text-slate-950 mt-2">7-Day Free Trial</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                      Full unrestricted access to evaluate our multi-site inventory & dispatch platform with your team.
                    </p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-slate-950 tabular-nums">$0</span>
                      <span className="text-xs font-bold text-slate-500">/ 7 days free</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-bold mt-2">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>No credit card required to start</span>
                    </div>
                  </div>

                  <div className="space-y-3.5 mb-8 flex-1 text-xs text-slate-800 font-medium">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Full access to all Enterprise modules</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Unlimited Site Branches & Field Teams</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Client-Supplied Free Stock & Client Register</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Excel & CSV bulk catalog import</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Official PDF Issue, DN & Requisition Notes</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Isolated private tenant database</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSignupOpen(true)}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-sm whitespace-nowrap"
                  >
                    <span>Start 7-Day Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 2: Pro Monthly Plan (Reinforced Tempered Glass) */}
                <div className="bg-white/90 hover:bg-white border-2 border-slate-900 rounded-3xl p-8 flex flex-col relative transition-all duration-200 shadow-[0_18px_44px_-12px_rgba(15,23,42,0.14)] backdrop-blur-2xl">
                  <div className="mb-6">
                    <div className="text-xs font-extrabold text-amber-700">Standard Monthly Plan</div>
                    <h3 className="text-2xl font-black text-slate-950 mt-2">Pro Monthly</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                      Ideal for growing contractors requiring monthly flexibility and continuous multi-site control.
                    </p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-slate-950 tabular-nums">$19.90</span>
                      <span className="text-xs font-bold text-slate-500">/ month</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-2">
                      Bank QR / Wire transfer supported worldwide
                    </div>
                  </div>

                  <div className="space-y-3.5 mb-8 flex-1 text-xs text-slate-800 font-medium">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-slate-950">All Free Trial features included</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Unlimited site requisitions & dispatches</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Multi-Team Project Usage & Templates</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Supplier Purchase Orders & GRN Receipts</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Priority technical email support</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Cancel or upgrade subscription anytime</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSignupOpen(true)}
                    className="w-full py-3.5 bg-slate-950 hover:bg-slate-800 text-amber-400 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-slate-950/15 transition cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    <span>Select Pro Monthly</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 3: Pro Annual Plan (CARBON GUNMETAL & BRUSHED INDUSTRIAL GOLD VIP CARD) */}
                <div className="relative group flex flex-col transition-all duration-200">
                  {/* Metallic Industrial Gold / Amber Glow Ring */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-[28px] blur-xs opacity-85 group-hover:opacity-100 transition duration-300" />

                  {/* Main Dark Carbon & Gold Card Container */}
                  <div className="relative h-full bg-gradient-to-b from-slate-900 via-slate-950 to-stone-950 rounded-[26px] p-8 flex flex-col border border-amber-400/50 shadow-2xl">
                    <div className="mb-6 relative z-10">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>Flagship Enterprise VIP</span>
                        </span>
                        <span className="text-xs font-black text-emerald-400">Save 21%</span>
                      </div>
                      <h3 className="text-3xl font-black text-white mt-2 tracking-tight">
                        Pro Annual
                      </h3>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        Built for established contractors. Pay once for 12 months with maximum cost savings & VIP engineering onboarding.
                      </p>
                    </div>

                    <div className="mb-8 relative z-10">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl sm:text-6xl font-black text-amber-400 tabular-nums">
                          $189.00
                        </span>
                        <span className="text-xs font-bold text-slate-400">/ year</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-amber-300 text-[11px] font-bold tabular-nums">
                        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>Only ~$15.75/month · Save $49.80 every year</span>
                      </div>
                    </div>

                    <div className="space-y-3.5 mb-8 flex-1 text-xs text-slate-200 relative z-10">
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.5]" />
                        <span className="font-bold text-white">All Pro Monthly features included</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.5]" />
                        <span className="text-amber-300 font-semibold">Save 21% compared to monthly billing</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.5]" />
                        <span>VIP Dedicated Engineering & Priority Setup</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.5]" />
                        <span>Free white-glove Excel/CSV catalog migration</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.5]" />
                        <span>Bank QR / Wire Transfer Slip instant approval</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.5]" />
                        <span>Custom corporate branding & locked-in renewal rate</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsSignupOpen(true)}
                      className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all duration-200 cursor-pointer active:scale-95 relative z-10 whitespace-nowrap"
                    >
                      <Crown className="w-4 h-4 fill-slate-950" />
                      <span>Select Pro Annual (Save 21%)</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Method Notice */}
              <div className="mt-12 max-w-2xl mx-auto bg-white/85 backdrop-blur-2xl border border-white ring-1 ring-slate-900/6 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-700 text-center sm:text-left shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-amber-400 shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-950 block">Easy Bank Payments & QR Wire Transfer</span>
                    <span>Instant activation via Bank QR or direct wire transfer slip upload.</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsSignupOpen(true)}
                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-amber-400 rounded-xl font-bold text-xs shrink-0 transition cursor-pointer whitespace-nowrap"
                >
                  Start Free Trial First
                </button>
              </div>
            </div>
          </section>

          {/* ==================== SECTION 5: FAQ (#faq) ==================== */}
          <section
            id="faq"
            className="py-16 sm:py-22 border-t border-white/75 bg-white/35 backdrop-blur-xl relative z-10"
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <div className="text-xs font-extrabold text-amber-700 tracking-wide mb-2">
                  Frequently Asked Questions
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                  Everything You Need to Know
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 mt-2 font-medium">
                  Answers to common questions about the 7-day free trial, Client-Supplied Free Stock, multi-tenancy, and billing.
                </p>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="bg-white/85 hover:bg-white backdrop-blur-2xl border border-white ring-1 ring-slate-900/6 rounded-2xl overflow-hidden shadow-2xs transition"
                  >
                    <button
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="w-full px-6 py-4 text-left font-extrabold text-xs sm:text-sm text-slate-950 flex justify-between items-center gap-4 cursor-pointer hover:text-amber-700 transition"
                    >
                      <span>{faq.q}</span>
                      <div className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        {activeFaq === idx ? (
                          <ChevronUp className="w-4 h-4 text-amber-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                    </button>
                    {activeFaq === idx && (
                      <div className="px-6 pb-5 text-xs text-slate-700 leading-relaxed border-t border-slate-200/80 pt-3 font-medium">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick Help Box */}
              <div className="mt-10 text-center p-6 bg-white/85 backdrop-blur-2xl border border-white ring-1 ring-slate-900/6 rounded-2xl shadow-2xs">
                <h4 className="text-sm font-extrabold text-slate-950 mb-1">
                  Still have questions or want to read the complete User Guide?
                </h4>
                <p className="text-xs text-slate-600 mb-4 font-medium">
                  Browse our step-by-step client documentation or contact our engineering support team anytime.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={handleOpenGuideTab}
                    className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open User Guide & PDF</span>
                  </button>
                  <a
                    href="mailto:apexdevinfo@gmail.com"
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-950 hover:text-amber-700 transition-colors"
                  >
                    <span>Contact Support: apexdevinfo@gmail.com</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ==================== FOOTER ==================== */}
      <footer className="mt-auto border-t border-slate-300/80 bg-white/80 backdrop-blur-2xl py-10 px-4 sm:px-6 lg:px-8 relative z-10 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center shadow-sm">
              <Boxes className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="font-black text-sm text-slate-950">Apex Stock Enterprise SaaS</span>
              <span className="text-[11px] text-slate-600 block font-medium">
                Centralized Multi-Site Inventory, Project Materials & Field Crew Dispatch
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1">
            <div className="text-xs font-bold text-slate-700">
              Apex Stock SaaS © {new Date().getFullYear()} · All Rights Reserved
            </div>
            <div className="text-[11px] text-slate-900 font-extrabold">
              Apex Developer | System Developed By Sasith Dissanayake
            </div>
          </div>
        </div>
      </footer>

      {/* Tenant Registration Modal */}
      <TenantSignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSuccessLogin={onOpenLogin}
      />
    </div>
  );
};
