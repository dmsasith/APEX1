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
    <div className="min-h-screen construction-blueprint-canvas text-white flex flex-col font-sans selection:bg-[#dc9750] selection:text-[#1e2640] overflow-x-hidden relative">
      {/* Desert Sun (#dc9750) & Architectural Dark Blue (#1e2640) Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 no-print">
        <div className="absolute -top-28 -left-24 w-[540px] h-[540px] rounded-full bg-gradient-to-br from-[#dc9750]/22 via-[#dc9750]/8 to-transparent blur-[120px]" />
        <div className="absolute top-1/5 -right-28 w-[520px] h-[520px] rounded-full bg-gradient-to-bl from-[#dc9750]/24 via-[#2d3960]/30 to-transparent blur-[125px]" />
        <div className="absolute bottom-1/6 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#2b375c]/40 via-[#dc9750]/12 to-transparent blur-[130px]" />
      </div>

      {/* Top Desert Sun (#dc9750) & Dark Blue (#1e2640) Architectural Accent Rule */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#1e2640] via-[#dc9750] to-[#1e2640] relative z-50 no-print" />

      {/* Sticky Architectural Dark Blue (#1e2640) & Desert Sun (#dc9750) Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#192038]/92 backdrop-blur-2xl border-b border-[#dc9750]/25 shadow-[0_10px_30px_-10px_rgba(10,14,26,0.55)] no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-6">
          {/* Zone 1: Clean Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleSwitchToOverviewSection()}
            className="flex items-center gap-2 sm:gap-2.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#dc9750] flex items-center justify-center shadow-md shadow-[#dc9750]/20">
              <Boxes className="w-4 h-4 sm:w-5 sm:h-5 text-[#1e2640] stroke-[2.25]" />
            </div>
            <span className="font-black text-base sm:text-lg text-white tracking-tight">Apex Stock</span>
          </button>

          {/* Zone 2: Primary Top Tabs & Concise Section Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-200">
            <button
              type="button"
              onClick={() => handleSwitchToOverviewSection()}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 ${
                activeLandingTab === 'overview'
                  ? 'text-[#dc9750] border-b-2 border-[#dc9750] font-extrabold'
                  : 'hover:text-[#dc9750]'
              }`}
            >
              Overview
            </button>

            <button
              type="button"
              onClick={handleOpenGuideTab}
              className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 ${
                activeLandingTab === 'guide'
                  ? 'text-[#dc9750] border-b-2 border-[#dc9750] font-extrabold'
                  : 'text-slate-200 hover:text-[#dc9750]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#dc9750]" />
              <span>User Guide & Features</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchToOverviewSection('industries')}
              className="hover:text-[#dc9750] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1"
            >
              Industries
            </button>

            <button
              type="button"
              onClick={() => handleSwitchToOverviewSection('features')}
              className="hover:text-[#dc9750] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1"
            >
              Capabilities
            </button>

            <button
              type="button"
              onClick={() => handleSwitchToOverviewSection('pricing')}
              className="hover:text-[#dc9750] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1"
            >
              Pricing
            </button>
          </nav>

          {/* Zone 3: Workspace Access & Trial Action (Mobile Optimized, Zero Clipping) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={onOpenLogin}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold text-slate-100 hover:text-white bg-[#25304f]/90 hover:bg-[#2d3a5e] border border-[#dc9750]/35 rounded-xl transition flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              title="Client Login"
            >
              <LogIn className="w-3.5 h-3.5 text-[#dc9750]" />
              <span className="hidden sm:inline">Client </span>
              <span>Login</span>
            </button>

            <button
              onClick={() => setIsSignupOpen(true)}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#dc9750] hover:bg-[#e5a460] text-[#1e2640] font-black rounded-xl text-xs flex items-center gap-1 sm:gap-1.5 shadow-md shadow-[#dc9750]/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            >
              <span className="hidden sm:inline">Start 7-Day </span>
              <span>Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#1e2640] stroke-[2.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Quick Top Tab Switcher (Visible below lg breakpoint) */}
      <div className="lg:hidden relative z-30 max-w-7xl w-full mx-auto px-3 sm:px-4 pt-2 sm:pt-3 no-print">
        <div className="grid grid-cols-2 gap-1.5 p-1 sm:p-1.5 rounded-2xl bg-[#192038]/90 backdrop-blur-xl border border-[#dc9750]/30 shadow-md">
          <button
            type="button"
            onClick={() => handleSwitchToOverviewSection()}
            className={`py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-extrabold transition cursor-pointer whitespace-nowrap text-center ${
              activeLandingTab === 'overview'
                ? 'bg-[#dc9750] text-[#1e2640] shadow-xs'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            Platform Overview
          </button>
          <button
            type="button"
            onClick={handleOpenGuideTab}
            className={`py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeLandingTab === 'guide'
                ? 'bg-[#dc9750] text-[#1e2640] shadow-xs'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            <BookOpen className={`w-3.5 h-3.5 ${activeLandingTab === 'guide' ? 'text-[#1e2640]' : 'text-[#dc9750]'}`} />
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
          {/* ==================== HERO SECTION (DARK BLUE #1e2640 + DESERT SUN #dc9750 STAGE) ==================== */}
          <section className="relative pt-6 pb-14 sm:pt-14 sm:pb-20 z-10">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center">
              {/* Architectural Dark Blue & Desert Sun Hero Stage */}
              <div className="relative rounded-2xl sm:rounded-[32px] bg-gradient-to-br from-[#253050]/92 via-[#1e2640]/95 to-[#181f36]/96 backdrop-blur-2xl border border-[#dc9750]/35 shadow-[0_28px_64px_-16px_rgba(8,12,24,0.65)] p-4 sm:p-10 lg:p-14 overflow-hidden">
                {/* Warm Desert Sun Specular Accents */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#dc9750] to-transparent" />
                <div className="absolute -top-24 left-1/5 w-96 h-96 rounded-full bg-gradient-to-br from-[#dc9750]/20 via-[#dc9750]/6 to-transparent blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 right-1/5 w-96 h-96 rounded-full bg-gradient-to-tl from-[#dc9750]/18 via-[#2f3d66]/25 to-transparent blur-3xl pointer-events-none" />

                {/* Clean Editorial Kicker */}
                <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-200 tracking-wide mb-4 sm:mb-5">
                  <HardHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#dc9750]" />
                  <span>Built for Construction, EPC, Telecom & Multi-Site Contractors</span>
                  <span aria-hidden="true" className="text-[#dc9750]/60">·</span>
                  <span className="text-[#e8ac6e] font-extrabold">7-Day Unrestricted Free Trial</span>
                </div>

                {/* High-Impact Display Headline */}
                <h1 className="relative z-10 text-2xl sm:text-5xl lg:text-[54px] font-black text-white tracking-tight leading-[1.18] sm:leading-[1.13] max-w-4xl mx-auto text-balance">
                  Complete Inventory Control Across All Your{' '}
                  <span className="text-[#e5a460]">
                    Warehouses, Project Sites & Field Teams
                  </span>
                </h1>

                {/* Clear Subtitle */}
                <p className="relative z-10 mt-3.5 sm:mt-5 text-xs sm:text-base lg:text-lg text-slate-200/95 max-w-3xl mx-auto leading-relaxed font-medium">
                  Stop losing track of construction materials, tools, and site stock across spreadsheets. Manage your{' '}
                  <strong className="text-white font-bold">Central Warehouse</strong>,{' '}
                  <strong className="text-white font-bold">Regional Site Branches</strong>,{' '}
                  <strong className="text-[#eec08e] font-bold">Client-Supplied Free Materials</strong>,{' '}
                  <strong className="text-white font-bold">Heavy Machinery Fleets</strong>, and{' '}
                  <strong className="text-white font-bold">Daily Crew Dispatches</strong> in one real-time cloud workspace.
                </p>

                {/* 4 Core Operational Pillars (Clean Unboxed Architectural Strip) */}
                <div className="relative z-10 mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-[#dc9750]/20 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 max-w-4xl mx-auto text-[11px] sm:text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#dc9750]" />
                    <span>Central & Branch Warehouses</span>
                  </span>
                  <span aria-hidden="true" className="hidden sm:inline text-[#dc9750]/50">·</span>
                  <span className="flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#dc9750]" />
                    <span>Client-Supplied Free Materials</span>
                  </span>
                  <span aria-hidden="true" className="hidden sm:inline text-[#dc9750]/50">·</span>
                  <span className="flex items-center gap-1.5">
                    <Users2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#dc9750]" />
                    <span>Field Crew In-Hand Tracking</span>
                  </span>
                  <span aria-hidden="true" className="hidden sm:inline text-[#dc9750]/50">·</span>
                  <span className="flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#dc9750]" />
                    <span>Project Usage Reconciliation</span>
                  </span>
                </div>

                {/* Hero CTAs */}
                <div className="relative z-10 mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3.5 max-w-md sm:max-w-none mx-auto">
                  <button
                    onClick={() => setIsSignupOpen(true)}
                    className="w-full sm:w-auto px-5 sm:px-7 py-3 sm:py-3.5 bg-[#dc9750] hover:bg-[#e7a662] text-[#1e2640] font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 sm:gap-2.5 shadow-xl shadow-[#dc9750]/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    <span>Start 7-Day Free Trial</span>
                    <span className="text-[#1e2640]/80 font-bold text-[11px] sm:text-xs">($0 Today)</span>
                    <ArrowRight className="w-4 h-4 text-[#1e2640] stroke-[2.5]" />
                  </button>

                  <button
                    onClick={onOpenLogin}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-3.5 bg-[#161d33] hover:bg-[#222c4a] text-white border border-[#dc9750]/45 font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md cursor-pointer whitespace-nowrap"
                  >
                    <LogIn className="w-4 h-4 text-[#dc9750]" />
                    <span>Client Sign In / Workspace Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenGuideTab}
                    className="w-full sm:w-auto px-4 sm:px-5 py-3 sm:py-3.5 bg-[#dc9750]/15 hover:bg-[#dc9750]/25 text-[#f4c694] border border-[#dc9750]/40 font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap"
                  >
                    <BookOpen className="w-4 h-4 text-[#dc9750]" />
                    <span>Read Full User Guide & PDF</span>
                  </button>
                </div>

                {/* Trust Guarantees (Clean Editorial Inline Metadata) */}
                <div className="relative z-10 mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1.5 text-[11px] sm:text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#dc9750]" />
                    <span>60-Second Workspace Setup</span>
                  </span>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span className="flex items-center gap-1.5 text-white font-bold">
                    <CreditCard className="w-3.5 h-3.5 text-[#dc9750] shrink-0" />
                    <span>No Credit Card Required</span>
                  </span>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span className="tabular-nums">$19.90/mo or $189/yr (Save 21%)</span>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span>100% Isolated Tenant Cloud</span>
                </div>

                {/* Executive Site Operations Preview Console */}
                <div className="relative z-10 mt-8 sm:mt-10 rounded-2xl sm:rounded-[24px] bg-[#dc9750]/20 p-2 sm:p-3 border border-[#dc9750]/40 shadow-[0_22px_50px_-12px_rgba(8,11,22,0.7)] max-w-5xl mx-auto">
                  <div className="bg-gradient-to-br from-[#161d33] via-[#1a223b] to-[#13192c] rounded-xl sm:rounded-[18px] border border-[#dc9750]/25 p-3.5 sm:p-6 text-left relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#dc9750]/12 blur-3xl pointer-events-none" />
                    {/* Top window bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 sm:pb-4 border-b border-white/10 mb-4 sm:mb-5 relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#2c3759]" />
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#dc9750]" />
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/90" />
                        <span className="text-[11px] sm:text-xs text-slate-300 font-mono ml-1.5 sm:ml-2 truncate max-w-[200px] sm:max-w-none">
                          apex-stock-cloud / site-operations-control
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-semibold text-slate-300">
                        <span>Client Stock Synced</span>
                        <span aria-hidden="true" className="text-slate-500">·</span>
                        <span className="text-[#e7a662]">Multi-Site Active</span>
                      </div>
                    </div>

                    {/* Live Preview KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-3.5 sm:mb-4 relative z-10">
                      <div className="bg-[#1e2640]/90 border border-white/10 rounded-xl p-3 sm:p-3.5">
                        <div className="text-[11px] text-slate-300 font-semibold">Central Warehouse Stock</div>
                        <div className="text-lg sm:text-xl font-black text-white mt-0.5 font-mono tabular-nums">
                          24,580 <span className="text-xs font-normal text-slate-300">units</span>
                        </div>
                        <div className="text-[10px] text-[#e7a662] font-semibold mt-1">Materials & Machinery Fleet</div>
                      </div>
                      <div className="bg-[#1e2640]/90 border border-white/10 rounded-xl p-3 sm:p-3.5">
                        <div className="text-[11px] text-slate-300 font-semibold">Client-Supplied Stock</div>
                        <div className="text-lg sm:text-xl font-black text-[#e7a662] mt-0.5 font-mono tabular-nums">12,400 m</div>
                        <div className="text-[10px] text-slate-300 mt-1">Free-Issue Project Materials</div>
                      </div>
                      <div className="bg-[#1e2640]/90 border border-white/10 rounded-xl p-3 sm:p-3.5">
                        <div className="text-[11px] text-slate-300 font-semibold">Active Sites & Crews</div>
                        <div className="text-lg sm:text-xl font-black text-white mt-0.5 font-mono tabular-nums">6 Sites · 18 Crews</div>
                        <div className="text-[10px] text-emerald-400 font-semibold mt-1">Live In-Hand Custody</div>
                      </div>
                      <div className="bg-[#1e2640]/90 border border-white/10 rounded-xl p-3 sm:p-3.5">
                        <div className="text-[11px] text-slate-300 font-semibold">Project Reconciliations</div>
                        <div className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5 font-mono tabular-nums">100% Audited</div>
                        <div className="text-[10px] text-slate-300 mt-1">Multi-Crew BOQ & WBS</div>
                      </div>
                    </div>

                    {/* Smart Priority Strip */}
                    <div className="bg-[#1e2640] border border-[#dc9750]/40 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-xs relative z-10">
                      <div className="flex items-start sm:items-center gap-2">
                        <span className="text-[11px] font-extrabold text-[#e7a662] shrink-0">
                          Smart Stock Deduction:
                        </span>
                        <span className="text-slate-200 text-[11px]">
                          Project <strong>HIGHWAY-SEC-04</strong> consumes Client-Supplied Free Materials first
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0">
                        Zero Discrepancy ✓
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== SECTION 1: WHO IS THIS BUILT FOR? (#industries — WARM DESERT SUN ARCHITECTURAL BAND) ==================== */}
          <section
            id="industries"
            className="py-12 sm:py-22 relative z-10 bg-gradient-to-b from-[#f3e1c8] via-[#f8ede0] to-[#edd6b8] text-[#1e2640] border-y-2 border-[#dc9750]"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              {/* Section Header */}
              <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
                <div className="text-xs font-extrabold text-[#9e5c19] tracking-wide mb-2 flex items-center justify-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#b56b21]" />
                  <span>Target Construction & Engineering Sectors</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-[#1e2640] tracking-tight text-balance">
                  Built for Multi-Site Contractors, Civil Engineering & Warehousing
                </h2>
                <p className="text-xs sm:text-sm text-[#2d3859] mt-2.5 font-semibold">
                  Whether you manage civil construction yards, road & bridge works, fiber optic rollouts, solar & power grid EPC projects, or multi-branch supply hubs—Apex Stock fits your exact field workflow.
                </p>
              </div>

              {/* 6 Sector Cards Pairing Dark Blue (#1e2640) & Desert Sun (#dc9750) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {industries.map((ind, idx) => {
                  const IconComponent = ind.icon;
                  const isSelected = selectedIndustryIdx === idx;
                  return (
                    <div
                      key={ind.title}
                      onClick={() => setSelectedIndustryIdx(idx)}
                      className={`group relative overflow-hidden rounded-2xl sm:rounded-[24px] p-4 sm:p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#1e2640] text-white border-2 border-[#dc9750] shadow-[0_20px_44px_-12px_rgba(30,38,64,0.38)] -translate-y-0.5'
                          : 'bg-white/92 hover:bg-white text-[#1e2640] border border-[#dc9750]/45 shadow-[0_10px_28px_-10px_rgba(30,38,64,0.12)] hover:border-[#1e2640]'
                      }`}
                    >
                      <div
                        className={`absolute top-0 inset-x-0 h-1.5 ${
                          isSelected
                            ? 'bg-[#dc9750]'
                            : 'bg-gradient-to-r from-[#1e2640] via-[#dc9750] to-[#1e2640]'
                        }`}
                      />

                      <div>
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${
                              isSelected
                                ? 'bg-[#dc9750] text-[#1e2640]'
                                : 'bg-[#1e2640] text-[#dc9750]'
                            }`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-[11px] font-bold ${
                              isSelected ? 'text-[#e8ac6e]' : 'text-[#475577]'
                            }`}
                          >
                            {ind.badge}
                          </span>
                        </div>

                        <h3
                          className={`text-base font-black tracking-tight leading-snug ${
                            isSelected ? 'text-white' : 'text-[#1e2640]'
                          }`}
                        >
                          {ind.title}
                        </h3>
                        <p
                          className={`text-[11px] font-bold mt-1 ${
                            isSelected ? 'text-[#e8ac6e]' : 'text-[#a6601a]'
                          }`}
                        >
                          {ind.subtitle}
                        </p>
                        <p
                          className={`text-xs mt-2.5 leading-relaxed font-medium ${
                            isSelected ? 'text-slate-200' : 'text-[#334063]'
                          }`}
                        >
                          {ind.desc}
                        </p>
                      </div>

                      <div
                        className={`mt-5 pt-3.5 border-t space-y-1.5 ${
                          isSelected ? 'border-white/15' : 'border-[#dc9750]/30'
                        }`}
                      >
                        {ind.features.map((feat) => (
                          <div
                            key={feat}
                            className={`flex items-center gap-2 text-[11px] font-bold ${
                              isSelected ? 'text-white' : 'text-[#1e2640]'
                            }`}
                          >
                            <CheckCircle2
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? 'text-[#dc9750]' : 'text-[#b56b21]'
                              }`}
                            />
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

          {/* ==================== SECTION 2: SYSTEM CAPABILITIES & 4-STEP WORKFLOW (#features — DARK BLUE #1e2640) ==================== */}
          <section
            id="features"
            className="py-12 sm:py-22 relative z-10"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
                <div className="text-xs font-extrabold text-[#e5a460] tracking-wide mb-2">
                  End-to-End Site & Warehouse Capabilities
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight text-balance">
                  How Apex Stock Controls Your Daily Site Operations
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 mt-2 font-medium">
                  From Central Warehouse procurement and Client-Supplied Free Materials to regional yard transfers, field crew dispatches, and project reconciliation.
                </p>
              </div>

              {/* 4-Step Industrial Workflow Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-12">
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
                    className="relative rounded-2xl bg-[#161d33]/95 text-white p-4 sm:p-5 border border-[#dc9750]/35 shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono font-bold text-[#e5a460]">
                          {item.step}
                        </span>
                        <span className="text-xs font-mono text-slate-400 tabular-nums">0{idx + 1}/04</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-white mt-2">{item.title}</h4>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 6 Detailed Feature Cards in Elevated Dark Blue (#253050) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-[#253050]/90 hover:bg-[#2a375c] border border-[#dc9750]/30 hover:border-[#dc9750]/70 rounded-2xl sm:rounded-[22px] p-5 sm:p-6 shadow-lg transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-[#dc9750] text-[#1e2640] flex items-center justify-center mb-4 shadow-sm">
                    <Gift className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    Client-Supplied Free Stock & Client Register
                  </h3>
                  <p className="text-xs text-slate-200 mt-2 leading-relaxed font-medium">
                    Directly connected Master Client Register and Free-Issue Stock ledger. Record client-provided project materials at zero cost liability and auto-deduct them when projects consume stock.
                  </p>
                </div>

                <div className="bg-[#253050]/90 hover:bg-[#2a375c] border border-[#dc9750]/30 hover:border-[#dc9750]/70 rounded-2xl sm:rounded-[22px] p-5 sm:p-6 shadow-lg transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-[#161d33] border border-[#dc9750]/40 text-[#dc9750] flex items-center justify-center mb-4">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    Multi-Team Project Usage & Section Templates
                  </h3>
                  <p className="text-xs text-slate-200 mt-2 leading-relaxed font-medium">
                    Load reusable project section templates, assign multiple field crews to the same project, and track exact material installation per crew and WBS site identifier.
                  </p>
                </div>

                <div className="bg-[#253050]/90 hover:bg-[#2a375c] border border-[#dc9750]/30 hover:border-[#dc9750]/70 rounded-2xl sm:rounded-[22px] p-5 sm:p-6 shadow-lg transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-[#dc9750] text-[#1e2640] flex items-center justify-center mb-4 shadow-sm">
                    <Truck className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    Materials + Heavy Machinery Fleet Control
                  </h3>
                  <p className="text-xs text-slate-200 mt-2 leading-relaxed font-medium">
                    Dedicated classification for Consumable Materials and Returnable Heavy Machinery/Tools (Excavators, Generators, Compactors, Splicers) with custom fleet categories.
                  </p>
                </div>

                <div className="bg-[#253050]/90 hover:bg-[#2a375c] border border-[#dc9750]/30 hover:border-[#dc9750]/70 rounded-2xl sm:rounded-[22px] p-5 sm:p-6 shadow-lg transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-[#161d33] border border-[#dc9750]/40 text-[#dc9750] flex items-center justify-center mb-4">
                    <Send className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    Inter-Branch Requisitions & Shortage Review
                  </h3>
                  <p className="text-xs text-slate-200 mt-2 leading-relaxed font-medium">
                    Site yards request stock from Central HQ. Central logistics officers review live warehouse balances with 1-click &ldquo;Send Available Only&rdquo; or shortage adjustments.
                  </p>
                </div>

                <div className="bg-[#253050]/90 hover:bg-[#2a375c] border border-[#dc9750]/30 hover:border-[#dc9750]/70 rounded-2xl sm:rounded-[22px] p-5 sm:p-6 shadow-lg transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-[#dc9750] text-[#1e2640] flex items-center justify-center mb-4 shadow-sm">
                    <Users2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    Field Team In-Hand Custody & Return Notes
                  </h3>
                  <p className="text-xs text-slate-200 mt-2 leading-relaxed font-medium">
                    See every item and tool currently held by each field crew leader. Process unused or damaged stock returns back into Site Branch or Central inventory.
                  </p>
                </div>

                <div className="bg-[#253050]/90 hover:bg-[#2a375c] border border-[#dc9750]/30 hover:border-[#dc9750]/70 rounded-2xl sm:rounded-[22px] p-5 sm:p-6 shadow-lg transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-[#161d33] border border-[#dc9750]/40 text-[#dc9750] flex items-center justify-center mb-4">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    Excel Bulk Import, JSON Backup & Printable PDFs
                  </h3>
                  <p className="text-xs text-slate-200 mt-2 leading-relaxed font-medium">
                    Import thousands of catalog items via Excel/CSV, print official Dispatch/Issue/PO Gate Passes, and safeguard records with 1-Click JSON Backup & Restore.
                  </p>
                </div>
              </div>

              {/* Signature Desert Sun (#dc9750) + Dark Blue (#1e2640) Callout Banner */}
              <div className="mt-10 sm:mt-12 rounded-2xl bg-[#dc9750] text-[#1e2640] p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-start sm:items-center gap-3.5 text-left">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#1e2640] text-[#dc9750] flex items-center justify-center shrink-0 shadow-md">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-[#1e2640]">
                      Want to see step-by-step how every module works in practice?
                    </h4>
                    <p className="text-xs text-[#1e2640]/90 font-semibold mt-0.5">
                      Explore our complete client-friendly System User Guide & Feature Handbook—or download it as an A4 PDF for your team.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenGuideTab}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-[#1e2640] hover:bg-[#151b2e] text-[#dc9750] font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition whitespace-nowrap shrink-0 shadow-md"
                >
                  <span>Open Full User Guide & PDF</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* ==================== SECTION 3: MULTI-TENANT CLOUD ARCHITECTURE (#architecture) ==================== */}
          <section id="architecture" className="py-12 sm:py-20 relative z-10">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-br from-[#161d33] via-[#1a223b] to-[#12182b] rounded-2xl sm:rounded-[28px] p-4 sm:p-10 lg:p-12 border border-[#dc9750]/35 shadow-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#1e2640] via-[#dc9750] to-[#1e2640]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#dc9750]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10">
                  <div>
                    <div className="flex items-center gap-2 text-[#e5a460] text-xs font-bold mb-3">
                      <Database className="w-4 h-4" />
                      <span>Enterprise Multi-Tenancy & Data Security</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight text-balance">
                      100% Isolated Cloud Workspace for Every Registered Company
                    </h2>
                    <p className="text-slate-200 text-xs sm:text-sm mt-3.5 leading-relaxed">
                      Each contractor operates in its own dedicated tenant partition on Firebase Realtime Cloud. Your stock balances, supplier rates, Client Register, and field team logs are strictly isolated and protected.
                    </p>

                    <div className="mt-7 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-[#dc9750]/20 text-[#e5a460] flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white">Zero Cross-Tenant Data Leakage</h4>
                          <p className="text-[11px] sm:text-xs text-slate-300">
                            Strict tenantId isolation guarantees Company A can never see or modify Company B records.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-[#dc9750]/20 text-[#e5a460] flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white">Branch-Level Site Yard Locks</h4>
                          <p className="text-[11px] sm:text-xs text-slate-300">
                            Branch supervisors are automatically restricted to their assigned site yard with zero access to other branches.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-[#dc9750]/20 text-[#e5a460] flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white">Safe Flush & 1-Click JSON Backups</h4>
                          <p className="text-[11px] sm:text-xs text-slate-300">
                            Export full JSON backups anytime. Even when flushing stock transactions, your tenant account and user logins remain safe.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Architecture Diagram Card */}
                  <div className="bg-[#1e2640]/90 border border-[#dc9750]/30 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                      <span className="text-xs font-mono text-[#e5a460] font-bold flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        <span>Tenant Data Isolation Model</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-300">Firebase Cloud RTDB</span>
                    </div>

                    <div className="space-y-3.5">
                      <div className="p-4 rounded-xl bg-[#141a2e] border border-[#dc9750]/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Your Company Tenant Partition</span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            ISOLATED
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-2 text-[10px] text-slate-200 font-mono">
                          <div className="bg-[#232d4b] p-2 rounded text-center">/items</div>
                          <div className="bg-[#232d4b] p-2 rounded text-center">/sites</div>
                          <div className="bg-[#232d4b] p-2 rounded text-center">/clients</div>
                          <div className="bg-[#232d4b] p-2 rounded text-center">/users</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#141a2e]/70 border border-white/10 opacity-75">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">Other Enterprise Client Partition</span>
                          <span className="text-[10px] font-mono text-slate-300">
                            ENCRYPTED
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#dc9750]" />
                        <span>Role-Based Access Control (RBAC)</span>
                      </span>
                      <span className="text-[#e5a460] font-bold">100% Protected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== SECTION 4: PRICING PLANS (#pricing — DESERT SUN BAND + DARK BLUE VIP FLAGSHIP) ==================== */}
          <section
            id="pricing"
            className="py-12 sm:py-24 relative z-10 bg-gradient-to-b from-[#f3e1c8] via-[#f9efe2] to-[#edd6b8] text-[#1e2640] border-y-2 border-[#dc9750]"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
                <div className="text-xs font-extrabold text-[#9e5c19] tracking-wide mb-2">
                  Clear & Transparent Enterprise Pricing
                </div>
                <h2 className="text-2xl sm:text-5xl font-black text-[#1e2640] tracking-tight text-balance">
                  Choose the Plan That Fits Your Operations
                </h2>
                <p className="text-xs sm:text-sm text-[#2d3859] mt-2.5 sm:mt-3 max-w-xl mx-auto font-semibold">
                  Start with our unrestricted 7-day free trial ($0 today). Continue seamlessly with flexible monthly billing or our discounted annual VIP plan.
                </p>
              </div>

              {/* 3-Step Onboarding Strip */}
              <div className="max-w-4xl mx-auto mb-10 sm:mb-12 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 bg-white/95 border border-[#dc9750]/50 rounded-2xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-3 px-3 py-2">
                  <span className="w-7 h-7 rounded-lg bg-[#1e2640] text-[#dc9750] font-mono text-xs font-black flex items-center justify-center shrink-0 tabular-nums">
                    01
                  </span>
                  <div className="text-xs">
                    <div className="font-extrabold text-[#1e2640]">Sign Up in 60 Seconds</div>
                    <div className="text-[11px] text-[#475577]">No credit card required</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 sm:border-x sm:border-[#dc9750]/35">
                  <span className="w-7 h-7 rounded-lg bg-[#1e2640] text-[#dc9750] font-mono text-xs font-black flex items-center justify-center shrink-0 tabular-nums">
                    02
                  </span>
                  <div className="text-xs">
                    <div className="font-extrabold text-[#1e2640]">Test Everything for 7 Days</div>
                    <div className="text-[11px] text-[#475577]">100% full modules unlocked</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2">
                  <span className="w-7 h-7 rounded-lg bg-[#1e2640] text-[#dc9750] font-mono text-xs font-black flex items-center justify-center shrink-0 tabular-nums">
                    03
                  </span>
                  <div className="text-xs">
                    <div className="font-extrabold text-[#1e2640]">Easy QR / Wire Activation</div>
                    <div className="text-[11px] text-[#475577]">All trial data stays intact</div>
                  </div>
                </div>
              </div>

              {/* 3 Pricing Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto items-stretch pt-2 sm:pt-4">
                {/* Card 1: 7-Day Free Trial */}
                <div className="bg-white/95 hover:bg-white border border-[#dc9750]/50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col relative transition-all duration-200 shadow-[0_16px_40px_-12px_rgba(30,38,64,0.12)]">
                  <div className="mb-5 sm:mb-6">
                    <div className="text-xs font-bold text-[#526080]">Risk-Free Evaluation</div>
                    <h3 className="text-xl sm:text-2xl font-black text-[#1e2640] mt-1.5 sm:mt-2">7-Day Free Trial</h3>
                    <p className="text-xs text-[#3a4769] mt-2 leading-relaxed font-medium">
                      Full unrestricted access to evaluate our multi-site inventory & dispatch platform with your team.
                    </p>
                  </div>

                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-[#1e2640] tabular-nums">$0</span>
                      <span className="text-xs font-bold text-[#526080]">/ 7 days free</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#9e5c19] font-extrabold mt-2">
                      <CreditCard className="w-3.5 h-3.5 text-[#b56b21] shrink-0" />
                      <span>No credit card required to start</span>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-3.5 mb-6 sm:mb-8 flex-1 text-xs text-[#1e2640] font-semibold">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#b56b21] shrink-0 stroke-[2.5]" />
                      <span>Full access to all Enterprise modules</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#b56b21] shrink-0 stroke-[2.5]" />
                      <span>Unlimited Site Branches & Field Teams</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#b56b21] shrink-0 stroke-[2.5]" />
                      <span>Client-Supplied Free Stock & Client Register</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#b56b21] shrink-0 stroke-[2.5]" />
                      <span>Excel & CSV bulk catalog import</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#b56b21] shrink-0 stroke-[2.5]" />
                      <span>Official PDF Issue, DN & Requisition Notes</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#b56b21] shrink-0 stroke-[2.5]" />
                      <span>Isolated private tenant database</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSignupOpen(true)}
                    className="w-full py-3.5 bg-[#1e2640] hover:bg-[#283354] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-sm whitespace-nowrap"
                  >
                    <span>Start 7-Day Free Trial</span>
                    <ArrowRight className="w-4 h-4 text-[#dc9750]" />
                  </button>
                </div>

                {/* Card 2: Pro Monthly Plan */}
                <div className="bg-white border-2 border-[#1e2640] rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col relative transition-all duration-200 shadow-[0_18px_44px_-12px_rgba(30,38,64,0.18)]">
                  <div className="mb-5 sm:mb-6">
                    <div className="text-xs font-extrabold text-[#9e5c19]">Standard Monthly Plan</div>
                    <h3 className="text-xl sm:text-2xl font-black text-[#1e2640] mt-1.5 sm:mt-2">Pro Monthly</h3>
                    <p className="text-xs text-[#3a4769] mt-2 leading-relaxed font-medium">
                      Ideal for growing contractors requiring monthly flexibility and continuous multi-site control.
                    </p>
                  </div>

                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-[#1e2640] tabular-nums">$19.90</span>
                      <span className="text-xs font-bold text-[#526080]">/ month</span>
                    </div>
                    <div className="text-[11px] text-[#526080] font-semibold mt-2">
                      Bank QR / Wire transfer supported worldwide
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-3.5 mb-6 sm:mb-8 flex-1 text-xs text-[#1e2640] font-semibold">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#b56b21] shrink-0 stroke-[2.5]" />
                      <span className="font-extrabold text-[#1e2640]">All Free Trial features included</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#b56b21] shrink-0 stroke-[2.5]" />
                      <span>Unlimited site requisitions & dispatches</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#b56b21] shrink-0 stroke-[2.5]" />
                      <span>Multi-Team Project Usage & Templates</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#b56b21] shrink-0 stroke-[2.5]" />
                      <span>Supplier Purchase Orders & GRN Receipts</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#b56b21] shrink-0 stroke-[2.5]" />
                      <span>Priority technical email support</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#b56b21] shrink-0 stroke-[2.5]" />
                      <span>Cancel or upgrade subscription anytime</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSignupOpen(true)}
                    className="w-full py-3.5 bg-[#1e2640] hover:bg-[#283354] text-[#dc9750] font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#1e2640]/15 transition cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    <span>Select Pro Monthly</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 3: Pro Annual Plan (DARK BLUE #1e2640 & DESERT SUN #dc9750 FLAGSHIP VIP CARD) */}
                <div className="relative group flex flex-col transition-all duration-200">
                  {/* Desert Sun Glow Ring */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#dc9750] via-[#ecc08e] to-[#dc9750] rounded-2xl sm:rounded-[28px] blur-xs opacity-90 group-hover:opacity-100 transition duration-300" />

                  {/* Main Dark Blue (#1e2640) & Desert Sun (#dc9750) Card Container */}
                  <div className="relative h-full bg-gradient-to-b from-[#1e2640] via-[#181f36] to-[#13192c] rounded-2xl sm:rounded-[26px] p-5 sm:p-8 flex flex-col border border-[#dc9750]/70 shadow-2xl">
                    <div className="mb-5 sm:mb-6 relative z-10">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-[#e5a460] flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-[#dc9750] fill-[#dc9750]" />
                          <span>Flagship Enterprise VIP</span>
                        </span>
                        <span className="text-xs font-black text-emerald-400">Save 21%</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white mt-1.5 sm:mt-2 tracking-tight">
                        Pro Annual
                      </h3>
                      <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                        Built for established contractors. Pay once for 12 months with maximum cost savings & VIP engineering onboarding.
                      </p>
                    </div>

                    <div className="mb-6 sm:mb-8 relative z-10">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-6xl font-black text-[#e5a460] tabular-nums">
                          $189.00
                        </span>
                        <span className="text-xs font-bold text-slate-300">/ year</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[#f2c391] text-[11px] font-bold tabular-nums">
                        <Zap className="w-3.5 h-3.5 text-[#dc9750] fill-[#dc9750]" />
                        <span>Only ~$15.75/month · Save $49.80 every year</span>
                      </div>
                    </div>

                    <div className="space-y-3.5 mb-8 flex-1 text-xs text-slate-200 relative z-10">
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#dc9750] shrink-0 stroke-[2.5]" />
                        <span className="font-bold text-white">All Pro Monthly features included</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#dc9750] shrink-0 stroke-[2.5]" />
                        <span className="text-[#f2c391] font-semibold">Save 21% compared to monthly billing</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#dc9750] shrink-0 stroke-[2.5]" />
                        <span>VIP Dedicated Engineering & Priority Setup</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#dc9750] shrink-0 stroke-[2.5]" />
                        <span>Free white-glove Excel/CSV catalog migration</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#dc9750] shrink-0 stroke-[2.5]" />
                        <span>Bank QR / Wire Transfer Slip instant approval</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#dc9750] shrink-0 stroke-[2.5]" />
                        <span>Custom corporate branding & locked-in renewal rate</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsSignupOpen(true)}
                      className="w-full py-4 bg-[#dc9750] hover:bg-[#e7a662] text-[#1e2640] font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-[#dc9750]/25 transition-all duration-200 cursor-pointer active:scale-95 relative z-10 whitespace-nowrap"
                    >
                      <Crown className="w-4 h-4 fill-[#1e2640]" />
                      <span>Select Pro Annual (Save 21%)</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Method Notice */}
              <div className="mt-12 max-w-2xl mx-auto bg-white/95 border border-[#dc9750]/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#2d3859] text-center sm:text-left shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1e2640] flex items-center justify-center text-[#dc9750] shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-[#1e2640] block">Easy Bank Payments & QR Wire Transfer</span>
                    <span className="font-medium">Instant activation via Bank QR or direct wire transfer slip upload.</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsSignupOpen(true)}
                  className="px-4 py-2.5 bg-[#1e2640] hover:bg-[#283354] text-[#dc9750] rounded-xl font-bold text-xs shrink-0 transition cursor-pointer whitespace-nowrap"
                >
                  Start Free Trial First
                </button>
              </div>
            </div>
          </section>

          {/* ==================== SECTION 5: FAQ (#faq — DARK BLUE #1e2640) ==================== */}
          <section
            id="faq"
            className="py-12 sm:py-22 relative z-10"
          >
            <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
                <div className="text-xs font-extrabold text-[#e5a460] tracking-wide mb-2">
                  Frequently Asked Questions
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Everything You Need to Know
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 mt-2 font-medium">
                  Answers to common questions about the 7-day free trial, Client-Supplied Free Stock, multi-tenancy, and billing.
                </p>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="bg-[#253050]/90 hover:bg-[#2a375c] border border-[#dc9750]/30 rounded-2xl overflow-hidden shadow-md transition"
                  >
                    <button
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="w-full px-4 sm:px-6 py-3.5 sm:py-4 text-left font-extrabold text-xs sm:text-sm text-white flex justify-between items-center gap-3 sm:gap-4 cursor-pointer hover:text-[#e5a460] transition"
                    >
                      <span className="leading-snug">{faq.q}</span>
                      <div className="w-7 h-7 rounded-xl bg-[#161d33] border border-[#dc9750]/35 flex items-center justify-center shrink-0">
                        {activeFaq === idx ? (
                          <ChevronUp className="w-4 h-4 text-[#dc9750]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                    </button>
                    {activeFaq === idx && (
                      <div className="px-4 sm:px-6 pb-4 sm:pb-5 text-xs text-slate-200 leading-relaxed border-t border-white/10 pt-3 font-medium">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick Help Box */}
              <div className="mt-8 sm:mt-10 text-center p-4 sm:p-6 bg-[#161d33]/95 border border-[#dc9750]/35 rounded-2xl shadow-lg">
                <h4 className="text-sm font-extrabold text-white mb-1">
                  Still have questions or want to read the complete User Guide?
                </h4>
                <p className="text-xs text-slate-300 mb-4 font-medium">
                  Browse our step-by-step client documentation or contact our engineering support team anytime.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={handleOpenGuideTab}
                    className="px-4 py-2.5 rounded-xl bg-[#dc9750] hover:bg-[#e7a662] text-[#1e2640] text-xs font-black flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open User Guide & PDF</span>
                  </button>
                  <a
                    href="mailto:apexdevinfo@gmail.com"
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-100 hover:text-[#dc9750] transition-colors"
                  >
                    <span>Contact Support: apexdevinfo@gmail.com</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#dc9750]" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ==================== FOOTER ==================== */}
      <footer className="mt-auto border-t border-[#dc9750]/25 bg-[#141a2e]/95 backdrop-blur-2xl py-8 sm:py-10 px-3 sm:px-6 lg:px-8 relative z-10 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#dc9750] flex items-center justify-center shadow-sm">
              <Boxes className="w-4 h-4 text-[#1e2640] stroke-[2.25]" />
            </div>
            <div>
              <span className="font-black text-sm text-white">Apex Stock Enterprise SaaS</span>
              <span className="text-[11px] text-slate-300 block font-medium">
                Centralized Multi-Site Inventory, Project Materials & Field Crew Dispatch
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1">
            <div className="text-xs font-bold text-slate-300">
              Apex Stock SaaS © {new Date().getFullYear()} · All Rights Reserved
            </div>
            <div className="text-[11px] text-[#e5a460] font-extrabold">
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
