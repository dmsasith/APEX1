import React, { useState } from 'react';
import {
  Boxes,
  ShieldCheck,
  Building2,
  Users2,
  Send,
  Truck,
  Sparkles,
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
  Play,
  Youtube,
  ExternalLink,
  Plus,
  Link2,
  X,
  BookOpen,
  Globe,
} from 'lucide-react';
import { TenantSignupModal } from './TenantSignupModal';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenSignup?: () => void;
}

interface GuideVideoItem {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  duration: string;
  category: string;
  youtubeUrl: string;
  highlights: string[];
}

const DEFAULT_GUIDE_VIDEOS: GuideVideoItem[] = [
  {
    id: 'guide-1',
    step: 'Part 01',
    title: 'Quick Workspace Setup & Master Registrations',
    subtitle: 'Set up your company workspace, master item catalog, site branches, field teams, and client directory.',
    duration: '04:30 min',
    category: 'Getting Started',
    youtubeUrl: '',
    highlights: [
      'Registering Consumable Materials vs. Machinery Fleet assets & Excel bulk import',
      'Creating Regional Site Branches, Field Crews & Master Client Directory',
      'Setting up Site Supervisor accounts with automatic Branch-Lock permissions',
    ],
  },
  {
    id: 'guide-2',
    step: 'Part 02',
    title: 'Central Warehouse, Supplier Orders & Client-Supplied Stock',
    subtitle: 'Receive vendor purchase orders (GRN) and track client-provided free project materials separately.',
    duration: '05:45 min',
    category: 'Warehouse & Procurement',
    youtubeUrl: '',
    highlights: [
      'Receiving bulk inventory into the Central Warehouse with official GRN vouchers',
      'Logging Client-Supplied Free Materials under Client Dispatch Notes (DN)',
      'Managing Supplier Purchase Orders (PO) and tracking partial deliveries',
    ],
  },
  {
    id: 'guide-3',
    step: 'Part 03',
    title: 'Site Requisitions, Warehouse Dispatches & Crew Issuance',
    subtitle: 'Request stock from headquarters, transfer materials to branches, and issue daily stock to field teams.',
    duration: '06:15 min',
    category: 'Operations & Dispatch',
    youtubeUrl: '',
    highlights: [
      'Submitting digital Stock Requisitions from Site Branches to Central HQ',
      'Smart shortage detection & 1-click Dispatch Note generation',
      'Issuing materials & returnable tools to Field Teams (Live In-Hand Custody)',
    ],
  },
  {
    id: 'guide-4',
    step: 'Part 04',
    title: 'Project Material Usage, Templates & Returns Reconciliation',
    subtitle: 'Record actual on-site material installation across multiple teams and reconcile unused stock returns.',
    duration: '05:10 min',
    category: 'Projects & Audits',
    youtubeUrl: '',
    highlights: [
      'Logging project material consumption with automatic Client-Supplied Stock priority',
      'Loading reusable Project Section Templates & tracking multi-team usage',
      'Returning surplus stock or machinery & exporting 1-Click Full System Backups',
    ],
  },
];

// Helper to extract YouTube Video ID from any standard YouTube URL
const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = trimmed.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [selectedIndustryIdx, setSelectedIndustryIdx] = useState<number>(0);

  // User Guide Videos State (persisted in localStorage under international v2 key)
  const [guideVideos, setGuideVideos] = useState<GuideVideoItem[]>(() => {
    try {
      const saved = localStorage.getItem('apex_landing_guide_videos_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_GUIDE_VIDEOS;
  });

  const [activeVideoId, setActiveVideoId] = useState<string>('guide-1');
  const [editingVideoModal, setEditingVideoModal] = useState<GuideVideoItem | null>(null);
  const [tempYoutubeUrl, setTempYoutubeUrl] = useState('');
  const [tempVideoTitle, setTempVideoTitle] = useState('');
  const [isPlayingEmbed, setIsPlayingEmbed] = useState(false);

  const activeGuide = guideVideos.find((v) => v.id === activeVideoId) || guideVideos[0];
  const activeYoutubeEmbedId = extractYoutubeId(activeGuide?.youtubeUrl || '');

  const handleOpenEditVideo = (video: GuideVideoItem) => {
    setEditingVideoModal(video);
    setTempYoutubeUrl(video.youtubeUrl || '');
    setTempVideoTitle(video.title);
  };

  const handleSaveVideoLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideoModal) return;
    const updated = guideVideos.map((v) =>
      v.id === editingVideoModal.id
        ? { ...v, title: tempVideoTitle.trim() || v.title, youtubeUrl: tempYoutubeUrl.trim() }
        : v
    );
    setGuideVideos(updated);
    try {
      localStorage.setItem('apex_landing_guide_videos_v2', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    setEditingVideoModal(null);
    setIsPlayingEmbed(false);
  };

  // Target Industries ("Who Is This Built For?") — 100% International English
  const industries = [
    {
      icon: Radio,
      badge: 'Telecom & Fiber Networks',
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
    <div
      className="min-h-screen text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white overflow-x-hidden relative"
      style={{
        background:
          'radial-gradient(circle at 8% 6%, rgba(16, 185, 129, 0.25), transparent 34%), radial-gradient(circle at 92% 10%, rgba(6, 182, 212, 0.22), transparent 36%), radial-gradient(circle at 50% 35%, rgba(99, 102, 241, 0.12), transparent 44%), radial-gradient(circle at 18% 68%, rgba(20, 184, 166, 0.20), transparent 38%), radial-gradient(circle at 85% 82%, rgba(16, 185, 129, 0.18), transparent 40%), linear-gradient(135deg, #DCF2E9 0%, #EBF7F4 30%, #E3F2FA 65%, #DDF3EB 100%)',
      }}
    >
      {/* Ambient Liquid Glass Floating Gradient Orbs for Deep Glass Refraction */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-28 -left-24 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-emerald-400/30 via-teal-300/25 to-cyan-400/20 blur-[110px]" />
        <div className="absolute top-1/4 -right-28 w-[520px] h-[520px] rounded-full bg-gradient-to-bl from-cyan-400/25 via-indigo-400/15 to-emerald-400/25 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[460px] h-[460px] rounded-full bg-gradient-to-tr from-teal-300/20 via-emerald-400/20 to-sky-300/20 blur-[130px]" />
      </div>

      {/* Sticky Apple Liquid Glass Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/65 backdrop-blur-2xl border-b border-white/80 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.07),inset_0_1px_0_0_rgba(255,255,255,0.9)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-600 p-0.5 shadow-md shadow-emerald-600/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Boxes className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-slate-950 tracking-tight">Apex Stock</span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600/15 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-600/25">
                  Enterprise Cloud
                </span>
              </div>
              <span className="text-[11px] text-slate-600 font-medium hidden sm:block">
                Multi-Site Inventory, Project Materials & Field Crew Dispatch
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-700">
            <a href="#industries" className="hover:text-emerald-700 transition-colors flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Who Can Use</span>
            </a>
            <a href="#features" className="hover:text-emerald-700 transition-colors">Platform Capabilities</a>
            <a href="#user-guide" className="hover:text-emerald-700 transition-colors flex items-center gap-1">
              <Youtube className="w-3.5 h-3.5 text-rose-600" />
              <span>Video Guide</span>
            </a>
            <a href="#architecture" className="hover:text-emerald-700 transition-colors">Cloud Security</a>
            <a href="#pricing" className="hover:text-emerald-700 transition-colors">Pricing ($19.90/mo)</a>
            <a href="#faq" className="hover:text-emerald-700 transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenLogin}
              className="px-3.5 py-2 text-xs font-bold text-slate-800 hover:text-slate-950 bg-white/75 hover:bg-white backdrop-blur-xl border border-white/90 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-600" />
              <span>Client Login</span>
            </button>

            <button
              onClick={() => setIsSignupOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/15 transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Start 7-Day Free Trial</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==================== HERO SECTION (TRUE APPLE LIQUID GLASS + CLEAR HEADLINE) ==================== */}
      <section className="relative pt-10 pb-16 sm:pt-14 sm:pb-20 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Frosted Glass Hero Stage */}
          <div className="relative rounded-[36px] bg-white/55 backdrop-blur-3xl border border-white/85 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.12),inset_0_1px_2px_0_rgba(255,255,255,0.95)] p-6 sm:p-10 lg:p-14 overflow-hidden">
            {/* Inner Specular Glass Highlights */}
            <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-emerald-400/20 via-teal-300/15 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 right-1/4 w-96 h-96 rounded-full bg-gradient-to-tl from-cyan-400/20 via-indigo-400/15 to-transparent blur-3xl pointer-events-none" />

            {/* Top Pill Badge */}
            <div className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-xl border border-white shadow-xs text-slate-800 text-xs font-bold mb-6">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enterprise Cloud Inventory & Site Operations Platform</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700 font-extrabold">7-Day Free Trial</span>
            </div>

            {/* Clear, Immediately Understandable International Headline */}
            <h1 className="relative z-10 text-3xl sm:text-5xl lg:text-[54px] font-black text-slate-950 tracking-tight leading-[1.13] max-w-4xl mx-auto">
              Complete Inventory Control Across All Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-600 to-indigo-700">
                Warehouses, Project Sites & Field Teams
              </span>
            </h1>

            {/* Clear Subtitle Without Confusing Jargon */}
            <p className="relative z-10 mt-5 text-sm sm:text-base lg:text-lg text-slate-700 max-w-3xl mx-auto leading-relaxed font-medium">
              Stop losing track of materials, tools, and site stock across spreadsheets. Manage your{' '}
              <strong className="text-slate-900">Central Warehouse</strong>,{' '}
              <strong className="text-slate-900">Regional Site Branches</strong>,{' '}
              <strong className="text-slate-900">Client-Supplied Free Materials</strong>,{' '}
              <strong className="text-slate-900">Machinery Fleets</strong>, and{' '}
              <strong className="text-slate-900">Daily Crew Dispatches</strong> in one real-time cloud workspace.
            </p>

            {/* 4 Quick Visual Value Pills (Explaining the 4 Core Pillars at a Glance) */}
            <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-2.5 max-w-3xl mx-auto">
              <span className="px-3.5 py-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-white shadow-2xs text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                <span>Central & Branch Warehouses</span>
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-white shadow-2xs text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-indigo-600" />
                <span>Client-Supplied Free Materials</span>
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-white shadow-2xs text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Field Crew In-Hand Tracking</span>
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-white shadow-2xs text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-amber-600" />
                <span>Project Usage Reconciliation</span>
              </span>
            </div>

            {/* Hero CTAs */}
            <div className="relative z-10 mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={() => setIsSignupOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 transition-all cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start 7-Day Free Trial ($0 Today)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenLogin}
                className="w-full sm:w-auto px-6 py-3.5 bg-white/85 hover:bg-white backdrop-blur-xl text-slate-900 border border-white hover:border-emerald-400 font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-emerald-600" />
                <span>Client Sign In / Workspace Login</span>
              </button>

              <a
                href="#user-guide"
                className="w-full sm:w-auto px-5 py-3.5 bg-slate-900/90 hover:bg-slate-900 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
              >
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>Watch Video Guide</span>
              </a>
            </div>

            {/* Trust Guarantees */}
            <div className="relative z-10 mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant setup in 60s</span>
              </div>
              <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-600/15 border border-emerald-600/30 text-emerald-950 font-bold">
                <CreditCard className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>No Credit Card Required for Trial</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>$19.90/mo or $189/yr (Save 21%)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Isolated Tenant Database</span>
              </div>
            </div>

            {/* Contrasting Dark Obsidian Executive Dashboard Mockup inside Glass Frame */}
            <div className="relative z-10 mt-10 rounded-[26px] bg-white/60 backdrop-blur-2xl border border-white p-2.5 sm:p-3.5 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18)] max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 rounded-[20px] border border-slate-800 p-4 sm:p-6 text-left relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
                {/* Top window bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800/80 mb-5 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/90" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/90" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/90" />
                    <span className="text-xs text-slate-400 font-mono ml-2">
                      apex-stock-cloud / live-operations-hub
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-indigo-300 bg-indigo-950/70 border border-indigo-700/60 px-2.5 py-0.5 rounded-full font-semibold">
                      Client-Supplied Stock Synced
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Multi-Tenant Cloud Live</span>
                    </div>
                  </div>
                </div>

                {/* Mock dashboard KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 relative z-10">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                    <div className="text-[11px] text-slate-400 font-semibold">Central Warehouse Stock</div>
                    <div className="text-xl font-black text-white mt-0.5 font-mono">
                      24,580 <span className="text-xs font-normal text-slate-400">units</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-1">Materials & Machinery Fleet</div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                    <div className="text-[11px] text-slate-400 font-semibold">Client-Supplied Stock</div>
                    <div className="text-xl font-black text-indigo-400 mt-0.5 font-mono">12,400 m</div>
                    <div className="text-[10px] text-slate-400 mt-1">Free-Issue Project Materials</div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                    <div className="text-[11px] text-slate-400 font-semibold">Active Branches & Crews</div>
                    <div className="text-xl font-black text-emerald-400 mt-0.5 font-mono">6 Sites · 18 Crews</div>
                    <div className="text-[10px] text-slate-400 mt-1">Real-time In-Hand custody</div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                    <div className="text-[11px] text-slate-400 font-semibold">Project Reconciliations</div>
                    <div className="text-xl font-black text-amber-400 mt-0.5 font-mono">100% Audited</div>
                    <div className="text-[10px] text-slate-400 mt-1">Multi-team WBS tracking</div>
                  </div>
                </div>

                {/* Mock Smart Alert Strip */}
                <div className="bg-emerald-950/40 border border-emerald-800/70 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-900/70 px-2.5 py-0.5 rounded-md border border-emerald-700">
                      Smart Stock Priority Active
                    </span>
                    <span className="text-slate-300 text-[11px]">
                      Project <strong>FTTH-METRO-04</strong> automatically deducts Client-Supplied Free Materials before company warehouse stock
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

      {/* ==================== SECTION 1: WHO CAN USE THIS SYSTEM? (#industries) ==================== */}
      <section id="industries" className="py-16 sm:py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-xl border border-white shadow-2xs text-emerald-800 text-xs font-extrabold uppercase tracking-wider mb-3">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Who Is This Built For? · Target Industries</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Designed for Multi-Site Contractors, Engineering & Warehousing
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 mt-2.5 font-medium">
              Whether you manage fiber optic rollouts, civil construction yards, solar & power grid EPC projects, or multi-branch distribution—Apex Stock adapts to your exact operational workflow.
            </p>
          </div>

          {/* 6 High-Craft Liquid Glass Industry Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {industries.map((ind, idx) => {
              const IconComponent = ind.icon;
              const isSelected = selectedIndustryIdx === idx;
              return (
                <div
                  key={ind.title}
                  onClick={() => setSelectedIndustryIdx(idx)}
                  className={`group relative overflow-hidden rounded-[26px] p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between backdrop-blur-2xl ${
                    isSelected
                      ? 'bg-white/85 border-2 border-emerald-500 shadow-[0_20px_44px_-12px_rgba(16,185,129,0.22),inset_0_1px_1px_0_rgba(255,255,255,0.95)] -translate-y-0.5'
                      : 'bg-white/60 hover:bg-white/80 border border-white/90 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.07),inset_0_1px_1px_0_rgba(255,255,255,0.9)] hover:border-emerald-400/70'
                  }`}
                >
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 opacity-85" />

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-800 text-emerald-400 flex items-center justify-center shadow-md">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/80 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                        {ind.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-950 tracking-tight leading-snug">
                      {ind.title}
                    </h3>
                    <p className="text-[11px] font-bold text-emerald-700 mt-1">
                      {ind.subtitle}
                    </p>
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-medium">
                      {ind.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-emerald-950/10 space-y-1.5">
                    {ind.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-2 text-[11px] font-bold text-slate-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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
        className="py-16 sm:py-20 border-t border-white/70 bg-white/35 backdrop-blur-2xl relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white shadow-2xs">
              End-to-End Platform Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight mt-3">
              How Apex Stock Powers Your Daily Operations
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 mt-2 font-medium">
              From Central Warehouse procurement and Client-Supplied Free Materials to regional branch transfers, field crew dispatches, and project reconciliation.
            </p>
          </div>

          {/* 4-Step Visual Workflow Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              {
                step: 'STEP 01',
                title: 'Central Stock & Client Stock',
                desc: 'Receive Supplier Purchase Orders (GRN) or log Client-Supplied Free Materials into your Central Warehouse.',
              },
              {
                step: 'STEP 02',
                title: 'Branch Site Requisitions',
                desc: 'Regional Site Branches request materials; Central HQ dispatches stock with smart shortage checks.',
              },
              {
                step: 'STEP 03',
                title: 'Field Crew Issuance',
                desc: 'Site Supervisors issue materials & machinery to Field Crews with official numbered Issue Notes.',
              },
              {
                step: 'STEP 04',
                title: 'Project Usage & Returns',
                desc: 'Log multi-team project consumption (client stock deducted first) & return unused items to inventory.',
              },
            ].map((item, idx) => (
              <div
                key={item.step}
                className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white p-5 border border-slate-800 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800">
                      {item.step}
                    </span>
                    <span className="text-xs font-mono text-slate-500">0{idx + 1}/04</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-white mt-2">{item.title}</h4>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 6 Detailed Feature Cards in Deep Apple Liquid Glass */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/65 hover:bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[24px] p-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.95)] hover:border-indigo-400 hover:shadow-xl transition duration-300">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-700 mb-4">
                <Gift className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-950">
                Client-Supplied Free Stock & Client Register
              </h3>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                Directly connected Master Client Register and Free-Issue Stock ledger. Record client-provided project materials at zero cost liability and auto-deduct them when projects consume stock.
              </p>
            </div>

            <div className="bg-white/65 hover:bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[24px] p-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.95)] hover:border-emerald-400 hover:shadow-xl transition duration-300">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-700 mb-4">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-950">
                Multi-Team Project Usage & Section Templates
              </h3>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                Load reusable project section templates, assign multiple field crews to the same project, and track exact material installation per crew and WBS site identifier.
              </p>
            </div>

            <div className="bg-white/65 hover:bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[24px] p-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.95)] hover:border-amber-400 hover:shadow-xl transition duration-300">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-700 mb-4">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-950">
                Materials + Heavy Machinery Fleet Control
              </h3>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                Dedicated classification for Consumable Materials and Returnable Machinery/Tools (Excavators, Generators, Splicers) with custom machinery categories.
              </p>
            </div>

            <div className="bg-white/65 hover:bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[24px] p-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.95)] hover:border-teal-400 hover:shadow-xl transition duration-300">
              <div className="w-11 h-11 rounded-2xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center text-teal-700 mb-4">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-950">
                Inter-Branch Requisitions & Shortage Review
              </h3>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                Site branches request stock from Central HQ. Central logistics officers review live warehouse balances with 1-click &ldquo;Send Available Only&rdquo; or shortage adjustments.
              </p>
            </div>

            <div className="bg-white/65 hover:bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[24px] p-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.95)] hover:border-purple-400 hover:shadow-xl transition duration-300">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-700 mb-4">
                <Users2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-950">
                Field Team In-Hand Custody & Return Notes
              </h3>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                See every item and tool currently held by each field crew leader. Process unused or damaged stock returns back into Site Branch or Central inventory.
              </p>
            </div>

            <div className="bg-white/65 hover:bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[24px] p-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.95)] hover:border-rose-400 hover:shadow-xl transition duration-300">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-700 mb-4">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-950">
                Excel Bulk Import, JSON Backup & Printable PDFs
              </h3>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                Import thousands of catalog items via Excel/CSV, print official Dispatch/Issue/PO documents, and safeguard records with 1-Click JSON Backup & Restore.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 3: SYSTEM USER GUIDE & YOUTUBE VIDEO TUTORIALS (#user-guide) ==================== */}
      <section id="user-guide" className="py-16 sm:py-22 border-t border-white/70 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-xl border border-white shadow-2xs text-rose-700 text-xs font-extrabold uppercase tracking-wider mb-3">
                <Youtube className="w-4 h-4 text-rose-600" />
                <span>System User Guide & Video Walkthroughs</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
                Step-by-Step Video Tutorials & User Guide
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 mt-1.5 font-medium max-w-2xl">
                Watch how each module operates from initial company setup to daily field crew dispatching. You can link or update YouTube tutorial URLs for any guide module below and play them directly on the page.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenEditVideo(activeGuide)}
              className="px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white backdrop-blur-xl text-slate-800 border border-white shadow-sm text-xs font-extrabold flex items-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <Link2 className="w-4 h-4 text-emerald-600" />
              <span>Attach / Edit YouTube Link ({activeGuide.step})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Selector Column: 4 Module Video Cards */}
            <div className="lg:col-span-5 space-y-3">
              {guideVideos.map((vid) => {
                const isSelected = vid.id === activeGuide.id;
                const hasYoutube = Boolean(vid.youtubeUrl?.trim());
                return (
                  <div
                    key={vid.id}
                    onClick={() => {
                      setActiveVideoId(vid.id);
                      setIsPlayingEmbed(false);
                    }}
                    className={`rounded-2xl p-4 transition-all cursor-pointer border backdrop-blur-2xl ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xl'
                        : 'bg-white/65 hover:bg-white/85 text-slate-900 border-white/90 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-white text-slate-700 shadow-2xs'
                          }`}
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded ${
                                isSelected
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {vid.step}
                            </span>
                            <span
                              className={`text-[10px] font-semibold ${
                                isSelected ? 'text-slate-400' : 'text-slate-500'
                              }`}
                            >
                              {vid.duration}
                            </span>
                            {hasYoutube && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                                <Youtube className="w-3 h-3" />
                                <span>YouTube Linked</span>
                              </span>
                            )}
                          </div>
                          <h4
                            className={`font-extrabold text-xs sm:text-sm mt-1 leading-snug ${
                              isSelected ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {vid.title}
                          </h4>
                          <p
                            className={`text-[11px] mt-0.5 leading-snug ${
                              isSelected ? 'text-slate-300' : 'text-slate-600'
                            }`}
                          >
                            {vid.subtitle}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditVideo(vid);
                        }}
                        className={`p-1.5 rounded-lg text-[10px] font-bold shrink-0 transition ${
                          isSelected
                            ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                            : 'text-slate-400 hover:text-slate-800 hover:bg-white'
                        }`}
                        title="Add or change YouTube URL"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Main Video Player & Walkthrough Stage */}
            <div className="lg:col-span-7 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 rounded-[28px] border border-slate-800 p-5 sm:p-7 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

              {/* Top Stage Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800 mb-5 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-xs font-extrabold">
                    {activeGuide.step}
                  </span>
                  <span className="text-xs font-bold text-slate-300">{activeGuide.category}</span>
                </div>

                <div className="flex items-center gap-2">
                  {activeGuide.youtubeUrl ? (
                    <a
                      href={activeGuide.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      <span>Open on YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenEditVideo(activeGuide)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add YouTube Video Link</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Video Canvas / Embedded Player */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex flex-col items-center justify-center">
                {activeYoutubeEmbedId && isPlayingEmbed ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${activeYoutubeEmbedId}?autoplay=1&rel=0`}
                    title={activeGuide.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="p-6 text-center max-w-lg mx-auto space-y-4 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-rose-600/30">
                      <Play className="w-7 h-7 fill-white ml-0.5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                        {activeGuide.step} · Video Guide Ready
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                        {activeGuide.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        {activeGuide.subtitle}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                      {activeYoutubeEmbedId ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsPlayingEmbed(true)}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25"
                          >
                            <Play className="w-4 h-4 fill-slate-950" />
                            <span>Play Video Here on Page</span>
                          </button>
                          <a
                            href={activeGuide.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
                          >
                            <Youtube className="w-4 h-4 text-rose-500" />
                            <span>Watch on YouTube</span>
                          </a>
                        </>
                      ) : activeGuide.youtubeUrl ? (
                        <a
                          href={activeGuide.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg"
                        >
                          <Youtube className="w-4 h-4" />
                          <span>Watch Tutorial Video on YouTube</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenEditVideo(activeGuide)}
                          className="px-5 py-2.5 bg-slate-800/90 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                        >
                          <Youtube className="w-4 h-4 text-rose-500" />
                          <span>Link YouTube Guide Video ({activeGuide.step})</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Key Topics Covered in This Guide */}
              <div className="mt-5 pt-4 border-t border-slate-800/90 relative z-10">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>What You Will Learn in {activeGuide.step}:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {activeGuide.highlights.map((h) => (
                    <div
                      key={h}
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-200 font-medium leading-snug flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 4: MULTI-TENANT CLOUD ARCHITECTURE (#architecture) ==================== */}
      <section id="architecture" className="py-16 sm:py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 rounded-[32px] p-6 sm:p-10 lg:p-12 border border-slate-800 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-4">
                  <Database className="w-3.5 h-3.5" />
                  <span>Enterprise Multi-Tenancy & Data Security</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  100% Isolated Cloud Workspace for Every Registered Company
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm mt-3.5 leading-relaxed">
                  Each company operates in its own dedicated tenant partition on Firebase Realtime Cloud. Your stock balances, supplier rates, Client Register, and field team logs are strictly isolated and protected.
                </p>

                <div className="mt-7 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
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
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Branch-Level Site Locks</h4>
                      <p className="text-[11px] sm:text-xs text-slate-400">
                        Branch supervisors are automatically restricted to their assigned site yard with zero access to other branches.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
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
                  <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>Tenant Data Isolation Model</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Firebase Cloud RTDB</span>
                </div>

                <div className="space-y-3.5">
                  <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-white">Your Company Tenant Partition</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
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
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                        <span className="text-xs font-bold text-slate-400">Other Enterprise Client Partition</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
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

      {/* ==================== SECTION 5: PRICING PLANS (#pricing — APPLE GLASS + DARK VIP CARD) ==================== */}
      <section id="pricing" className="py-16 sm:py-24 border-t border-white/70 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white shadow-2xs">
              Clear & Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight mt-3">
              Choose the Plan That Fits Your Operations
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 mt-3 max-w-xl mx-auto font-medium">
              Start with our unrestricted 7-day free trial ($0 today). Continue seamlessly with flexible monthly billing or our discounted annual VIP plan.
            </p>
          </div>

          {/* 3-Step Onboarding Strip */}
          <div className="max-w-4xl mx-auto mb-12 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/65 backdrop-blur-2xl border border-white/90 rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/80 border border-emerald-200/60">
              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-mono text-xs font-black flex items-center justify-center shrink-0">
                01
              </span>
              <div className="text-xs">
                <div className="font-extrabold text-slate-900">Sign Up in 60 Seconds</div>
                <div className="text-[11px] text-slate-500">No credit card required</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/80 border border-emerald-200/60">
              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-mono text-xs font-black flex items-center justify-center shrink-0">
                02
              </span>
              <div className="text-xs">
                <div className="font-extrabold text-slate-900">Test Everything for 7 Days</div>
                <div className="text-[11px] text-slate-500">100% full modules unlocked</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/80 border border-emerald-200/60">
              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-mono text-xs font-black flex items-center justify-center shrink-0">
                03
              </span>
              <div className="text-xs">
                <div className="font-extrabold text-slate-900">Easy QR / Wire Activation</div>
                <div className="text-[11px] text-slate-500">All trial data stays intact</div>
              </div>
            </div>
          </div>

          {/* 3 Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch pt-4">
            {/* Card 1: 7-Day Free Trial (Frosted Apple Liquid Glass) */}
            <div className="bg-white/65 hover:bg-white/80 border border-white/90 hover:border-emerald-400 rounded-3xl p-8 flex flex-col relative transition-all duration-300 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl">
              <div className="mb-6">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 bg-white/90 px-3 py-1 rounded-full border border-slate-200">
                  Risk-Free Evaluation
                </span>
                <h3 className="text-2xl font-black text-slate-950 mt-4">7-Day Free Trial</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  Full unrestricted access to evaluate our multi-site inventory & dispatch platform with your team.
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-slate-950">$0</span>
                  <span className="text-xs font-bold text-slate-500">/ 7 days free</span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold mt-2">
                  <CreditCard className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>No credit card required to start</span>
                </div>
              </div>

              <div className="space-y-3.5 mb-8 flex-1 text-xs text-slate-800 font-medium">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Full access to all Enterprise modules</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Unlimited Site Branches & Field Teams</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Client-Supplied Free Stock & Client Register</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Excel & CSV bulk catalog import</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Official PDF Issue, DN & Requisition Notes</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Isolated private tenant database</span>
                </div>
              </div>

              <button
                onClick={() => setIsSignupOpen(true)}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
              >
                <span>Start 7-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 2: Pro Monthly Plan (Emerald-Tinted Apple Liquid Glass) */}
            <div className="bg-white/75 hover:bg-white/90 border-2 border-emerald-500/60 hover:border-emerald-600 rounded-3xl p-8 flex flex-col relative transition-all duration-300 shadow-[0_18px_44px_-12px_rgba(16,185,129,0.18),inset_0_1px_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl">
              <div className="absolute -top-3.5 right-6">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-3 py-1 rounded-full shadow-md">
                  Monthly Flexibility
                </span>
              </div>

              <div className="mb-6">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Standard Plan
                </span>
                <h3 className="text-2xl font-black text-slate-950 mt-4">Pro Monthly</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  Ideal for growing contractors requiring monthly flexibility and continuous multi-site control.
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-slate-950">$19.90</span>
                  <span className="text-xs font-bold text-slate-500">/ month</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  Bank QR / Wire transfer supported worldwide
                </div>
              </div>

              <div className="space-y-3.5 mb-8 flex-1 text-xs text-slate-800 font-medium">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-950">All Free Trial features included</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Unlimited site requisitions & dispatches</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Multi-Team Project Usage & Templates</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Supplier Purchase Orders & GRN Receipts</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Priority technical email support</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cancel or upgrade subscription anytime</span>
                </div>
              </div>

              <button
                onClick={() => setIsSignupOpen(true)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer active:scale-95"
              >
                <span>Select Pro Monthly</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 3: Pro Annual Plan (CONTRASTING DARK OBSIDIAN LUXURY VIP CARD) */}
            <div className="relative group flex flex-col transition-all duration-300">
              {/* Vivid Multi-Color Radiant Iridescent Glow Outer Ring */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-rose-500 via-purple-600 to-emerald-400 rounded-[32px] blur-sm opacity-90 group-hover:opacity-100 transition duration-500 group-hover:blur-md" />

              {/* Highlight Best Value Top Pill */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30">
                <span className="text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 via-rose-500 to-amber-300 text-slate-950 px-5 py-1.5 rounded-full shadow-xl shadow-rose-500/40 flex items-center gap-1.5 border border-amber-200/80 whitespace-nowrap">
                  <Crown className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                  <span>Luxury VIP · Save 21%</span>
                </span>
              </div>

              {/* Main Dark Luxury Card Container */}
              <div className="relative h-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 rounded-[30px] p-8 flex flex-col border border-amber-400/40 shadow-2xl backdrop-blur-2xl">
                <div className="absolute inset-0 rounded-[30px] overflow-hidden pointer-events-none">
                  <div className="absolute -top-20 -right-20 w-56 h-56 bg-gradient-to-br from-amber-400/30 via-rose-500/25 to-purple-600/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
                  <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-indigo-600/25 rounded-full blur-3xl" />
                </div>

                <div className="mb-6 pt-3 relative z-10">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-purple-500/25 px-3.5 py-1 rounded-full border border-amber-500/40 inline-flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Flagship Enterprise</span>
                  </span>
                  <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300 mt-4 tracking-tight">
                    Pro Annual
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    The ultimate high-performance suite. Pay once for 12 months with maximum cost savings & VIP engineering privileges.
                  </p>
                </div>

                <div className="mb-8 relative z-10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500">
                      $189.00
                    </span>
                    <span className="text-xs font-bold text-amber-200/80">/ year</span>
                  </div>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-emerald-500/20 border border-amber-500/40 text-amber-200 text-[11px] font-bold">
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>Only ~$15.75/month · Save $49.80 every year</span>
                  </div>
                </div>

                <div className="space-y-3.5 mb-8 flex-1 text-xs text-slate-200 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-500 text-slate-950 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    </div>
                    <span className="font-bold text-white">All Pro Monthly features included</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-500 text-slate-950 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    </div>
                    <span className="text-amber-200 font-semibold">Save 21% instantly compared to monthly billing</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-500 text-slate-950 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    </div>
                    <span>VIP Dedicated Engineering & Priority Setup</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-500 text-slate-950 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    </div>
                    <span>Free white-glove Excel/CSV catalog migration</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-500 text-slate-950 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    </div>
                    <span>Bank QR / Wire Transfer Slip instant approval</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-500 text-slate-950 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    </div>
                    <span>Custom corporate branding & locked-in renewal rate</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsSignupOpen(true)}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 via-rose-500 to-amber-300 hover:from-amber-300 hover:via-rose-400 hover:to-yellow-200 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-2xl shadow-rose-500/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer active:scale-95 uppercase tracking-wider relative z-10"
                >
                  <Crown className="w-4 h-4 fill-slate-950" />
                  <span>Select Pro Annual (Save 21%)</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>

          {/* Payment Method Notice */}
          <div className="mt-12 max-w-2xl mx-auto bg-white/70 backdrop-blur-2xl border border-white/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-700 text-center sm:text-left shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 block">Easy Bank Payments & QR Wire Transfer</span>
                <span>Instant activation via Bank QR or direct wire transfer slip upload.</span>
              </div>
            </div>
            <button
              onClick={() => setIsSignupOpen(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shrink-0 transition cursor-pointer"
            >
              Start Free Trial First
            </button>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 6: FAQ (#faq) ==================== */}
      <section
        id="faq"
        className="py-16 sm:py-22 border-t border-white/70 bg-white/35 backdrop-blur-2xl relative z-10"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white shadow-2xs">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mt-3">
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
                className="bg-white/70 hover:bg-white/85 backdrop-blur-2xl border border-white/90 rounded-2xl overflow-hidden shadow-xs transition"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left font-extrabold text-xs sm:text-sm text-slate-900 flex justify-between items-center gap-4 cursor-pointer hover:text-emerald-700 transition"
                >
                  <span>{faq.q}</span>
                  <div className="w-7 h-7 rounded-xl bg-white/90 border border-slate-200/80 flex items-center justify-center shrink-0">
                    {activeFaq === idx ? (
                      <ChevronUp className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-5 text-xs text-slate-700 leading-relaxed border-t border-emerald-950/10 pt-3 font-medium">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Help Box */}
          <div className="mt-10 text-center p-6 bg-white/70 backdrop-blur-2xl border border-white/90 rounded-2xl shadow-xs">
            <h4 className="text-sm font-extrabold text-slate-900 mb-1">
              Still have questions or need a custom walkthrough?
            </h4>
            <p className="text-xs text-slate-600 mb-3 font-medium">
              Our engineering support team is ready to assist your company setup.
            </p>
            <a
              href="mailto:apexdevinfo@gmail.com"
              className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-700 hover:text-emerald-800"
            >
              <span>Contact Apex Support: apexdevinfo@gmail.com</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="mt-auto border-t border-white/80 bg-white/65 backdrop-blur-2xl py-10 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
              <Boxes className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-black text-sm text-slate-900">Apex Stock Enterprise SaaS</span>
              <span className="text-[11px] text-slate-600 block font-medium">
                Centralized Multi-Site Inventory, Project Materials & Field Crew Dispatch
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1">
            <div className="text-xs font-bold text-slate-700">
              Apex Stock SaaS © {new Date().getFullYear()} · All Rights Reserved
            </div>
            <div className="text-[11px] text-emerald-700 font-extrabold">
              Apex Developer | System Developed By Sasith Dissanayake
            </div>
          </div>
        </div>
      </footer>

      {/* ==================== MODAL: ATTACH / EDIT YOUTUBE GUIDE VIDEO LINK ==================== */}
      {editingVideoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Link YouTube Guide Video ({editingVideoModal.step})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Paste any YouTube watch or share link to enable in-page & YouTube playback
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingVideoModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVideoLink} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Guide Title</label>
                <input
                  type="text"
                  required
                  value={tempVideoTitle}
                  onChange={(e) => setTempVideoTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  YouTube Video URL (watch?v=... or youtu.be/...)
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={tempYoutubeUrl}
                  onChange={(e) => setTempYoutubeUrl(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Once saved, visitors can play this video directly inside the landing page or open it on YouTube.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingVideoModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition"
                >
                  Save Video Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tenant Registration Modal */}
      <TenantSignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSuccessLogin={onOpenLogin}
      />
    </div>
  );
};
