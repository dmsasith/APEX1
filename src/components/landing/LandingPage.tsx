import React, { useState } from 'react';
import {
  Boxes,
  ShieldCheck,
  Building2,
  Users2,
  Send,
  Truck,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
  Cloud,
  FileSpreadsheet,
  Coins,
  ChevronDown,
  ChevronUp,
  LogIn,
  Check,
  QrCode,
  Zap,
  Globe,
  Award,
  Layers,
  CheckCheck,
  Crown,
} from 'lucide-react';
import { TenantSignupModal } from './TenantSignupModal';
import { OfflineBackupViewerModal } from '../backup/OfflineBackupViewerModal';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenSignup?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isOfflineViewerOpen, setIsOfflineViewerOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  const faqs = [
    {
      q: 'How does the 7-Day Free Trial (Free Test) work?',
      a: 'You can register your company in under 60 seconds with zero commitment. No credit card is required to sign up. You get 100% full access to all features, including unlimited sites, team dispatching, supplier purchase orders, and PDF generation for a full 7 days.',
    },
    {
      q: 'What happens after the 7 days free trial?',
      a: 'After 7 days, you can choose between our Pro Monthly plan ($19.90/mo) or our cost-saving Pro Annual plan ($189/yr). Your data, inventory records, and history remain completely safe. You can easily activate your chosen plan via Bank QR or direct wire transfer through your Master Admin dashboard.',
    },
    {
      q: 'How is our company data kept separate from other clients (Multi-Tenant)?',
      a: 'Our platform uses high-security multi-tenant architecture on Firebase Realtime Database. Each company receives a private tenant identifier (tenantId). Company A cannot see, access, or modify Company B data—enforced strictly at the database security level.',
    },
    {
      q: 'Can site branch supervisors issue materials from other branches?',
      a: 'No. When an officer is assigned to a specific branch site (e.g., Matale or Kandy), their interface automatically locks to their assigned site. They can only issue inventory and view teams registered under their specific branch.',
    },
    {
      q: 'Can we import our existing inventory catalog from Excel?',
      a: 'Yes! The system includes an Excel & CSV Bulk Importer. You can upload thousands of materials, machinery equipment, item codes, and units in seconds with automatic column matching.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      {/* SaaS Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Boxes className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-white tracking-tight">Apex Stock</span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  SaaS
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:block">Multi-Site Logistics & Dispatch</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#architecture" className="hover:text-emerald-400 transition-colors">Multi-Tenant Cloud</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing ($19.90/mo)</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsOfflineViewerOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-400 hover:text-white hover:bg-slate-900 border border-emerald-500/30 rounded-xl transition cursor-pointer"
              title="Emergency offline reader to open and view your .json backup files and export to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Offline Data Viewer</span>
            </button>

            <button
              onClick={onOpenLogin}
              className="px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-400" />
              <span>Client Login</span>
            </button>

            <button
              onClick={() => setIsSignupOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start 7-Day Free Trial</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with High-End Lighting Effects */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[300px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Next-Gen Multi-Site Stock Management SaaS</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 font-bold">7-Day Free Test Period</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Centralized Multi-Site Inventory & Material Dispatching for Contractors
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate site shortages, lost equipment, and manual paperwork. Requisition materials from the Central Yard, dispatch with real-time stock deduction, track field teams in-hand, and manage supplier orders in one cloud platform.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => setIsSignupOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start 7-Day Free Trial ($0 Today)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>Client Sign In / Live Demo</span>
            </button>
          </div>

          {/* Guarantees */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant setup in 60s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>No credit card required for trial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>$19.90/mo or $189/yr (Save 21%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Isolated tenant database</span>
            </div>
          </div>

          {/* Interactive Mockup Graphic */}
          <div className="mt-12 sm:mt-16 rounded-2xl bg-slate-900/90 border border-slate-800 p-2 sm:p-3 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            <div className="bg-slate-950 rounded-xl border border-slate-800/80 p-4 sm:p-6 text-left">
              {/* Top window bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs text-slate-500 font-mono ml-2">apex-stock-saas / dashboard</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Cloud Sync Online</span>
                </div>
              </div>

              {/* Mock dashboard KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400 font-semibold">Central Yard Available</div>
                  <div className="text-xl font-black text-white mt-0.5">24,580 <span className="text-xs font-normal text-slate-400">units</span></div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400 font-semibold">Site Transfer Requests</div>
                  <div className="text-xl font-black text-amber-400 mt-0.5">3 Pending</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400 font-semibold">Field Teams In-Hand</div>
                  <div className="text-xl font-black text-emerald-400 mt-0.5">18 Active Crews</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400 font-semibold">Active Supplier POs</div>
                  <div className="text-xl font-black text-blue-400 mt-0.5">5 In Transit</div>
                </div>
              </div>

              {/* Mock Shortage Banner */}
              <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-amber-300 bg-amber-900/50 px-2 py-0.5 rounded border border-amber-700">
                    Central Stock Shortage Detected
                  </span>
                  <span className="text-slate-300 text-[11px]">
                    Site Requisition Note <strong>RN-2026-0006 (Matale)</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[11px] font-bold border border-amber-500/30">
                    ⚡ Send Available Only
                  </span>
                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded text-[11px] font-bold border border-rose-500/30">
                    🗑️ Remove Out-of-Stock
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core SaaS Features Grid */}
      <section id="features" className="py-16 sm:py-24 border-t border-slate-800/80 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              End-to-End Logistics Capability
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-2">
              Everything Your Operations Team Needs in One Place
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Tailored for telecommunication cable contractors, civil construction firms, and power projects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/40 hover:bg-slate-900 transition duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Inter-Branch Requisitions & Shortage Review</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Site Admins requisition materials from Central Main Warehouse. Central Logistics reviews balances with smart shortage warnings and 1-click actions.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/40 hover:bg-slate-900 transition duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Issue to Field Teams (Daily Dispatch)</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Site supervisors dispatch materials to work crews with instant inventory deduction and official numbered Issue Notes.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/40 hover:bg-slate-900 transition duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition">
                <Users2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Team In-Hand Stock & Consumption</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Always know what tools and materials each field crew holds on-site. Log project usage per installation ref number.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/40 hover:bg-slate-900 transition duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Procurement POs & Supplier GRN Receipts</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Issue vendor purchase orders, receive bulk goods with delivery note numbers, and track pending vs delivered quantities seamlessly.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:border-teal-500/40 hover:bg-slate-900 transition duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-110 transition">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Excel & CSV Catalog Migration</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Instantly import your existing item directory, codes, categories, units, and initial stock quantities using flexible spreadsheet columns.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:border-rose-500/40 hover:bg-slate-900 transition duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Tamper-Proof Audit Security</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Every dispatch, GRN receipt, transfer, and consumption is logged with the user identity, timestamp, and site location.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Tenant Cloud Architecture Section */}
      <section id="architecture" className="py-16 sm:py-24 border-t border-slate-800/80 bg-slate-950/70 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4">
                <Database className="w-3.5 h-3.5" />
                <span>Enterprise Multi-Tenancy</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Complete Isolation for Your Company Data
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-4 leading-relaxed">
                Each company operates in a dedicated, isolated workspace partition. Your stock records, confidential pricing, supplier rates, and field teams are strictly separated by cryptographic tenant guards on Firebase.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Zero Cross-Tenant Leakage</h4>
                    <p className="text-[11px] sm:text-xs text-slate-400">Strict database security rules guarantee Company A can never view or modify Company B data.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Branch-Level Site Locks</h4>
                    <p className="text-[11px] sm:text-xs text-slate-400">Branch supervisors are restricted to their assigned operational site with zero access to other branches.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Central Master Admin Control</h4>
                    <p className="text-[11px] sm:text-xs text-slate-400">Master Company Admin manages users, warehouses, sites, teams, and subscription renewals with bank transfer verification.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Graphic Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Tenant Data Isolation Model</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">Firebase Cloud RTDB</span>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-white">Your Company Tenant Partition</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">ISOLATED</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-slate-400 font-mono">
                    <div className="bg-slate-900 p-2 rounded text-center">/items</div>
                    <div className="bg-slate-900 p-2 rounded text-center">/warehouses</div>
                    <div className="bg-slate-900 p-2 rounded text-center">/dispatches</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-600" />
                      <span className="text-xs font-bold text-slate-400">Other Enterprise Client Partition</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">ENCRYPTED</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Role-Based Access Control (RBAC)</span>
                </span>
                <span className="text-emerald-400 font-bold">100% Protected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 High-End Pricing Plan Cards Section */}
      <section id="pricing" className="py-20 sm:py-28 border-t border-slate-800/80 bg-slate-950 relative">
        {/* Glow Lighting under pricing */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-teal-500/10 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Clear & Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-2">
              Choose the Plan That Fits Your Business
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 max-w-xl mx-auto">
              Start with our full-featured 7-day free trial. Then continue with our flexible monthly or discounted annual plan. Bank QR and wire transfer supported.
            </p>
          </div>

          {/* 3 Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch pt-6">
            {/* Card 1: 7-Day Free Trial */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-8 flex flex-col relative transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/50 backdrop-blur-md">
              <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                  Risk Free
                </span>
                <h3 className="text-2xl font-black text-white mt-4">7-Day Free Trial</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Full unrestricted access to evaluate our multi-site system with your team.
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">$0</span>
                  <span className="text-xs font-semibold text-slate-400">/ 7 days free</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                  No credit card required to start
                </div>
              </div>

              <div className="space-y-3.5 mb-8 flex-1 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full access to all SaaS features</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited sites & branch yards</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited field teams & crew dispatch</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Excel & CSV bulk catalog import</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Official PDF Issue & Requisition Notes</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Isolated private tenant database</span>
                </div>
              </div>

              <button
                onClick={() => setIsSignupOpen(true)}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer active:scale-95"
              >
                <span>Start 7-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 2: Pro Monthly Plan */}
            <div className="bg-slate-900/90 border border-emerald-500/40 hover:border-emerald-500/70 rounded-3xl p-8 flex flex-col relative transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 backdrop-blur-md">
              <div className="absolute -top-3.5 right-6">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-3 py-1 rounded-full shadow-md font-sans">
                  Monthly Flexibility
                </span>
              </div>

              <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
                  Standard Plan
                </span>
                <h3 className="text-2xl font-black text-white mt-4">Pro Monthly</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Ideal for contractors requiring monthly flexibility and ongoing operations.
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">$19.90</span>
                  <span className="text-xs font-semibold text-slate-400">/ month</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Bank QR / Wire transfer with live USD/LKR rate
                </div>
              </div>

              <div className="space-y-3.5 mb-8 flex-1 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-white">All Free Trial features included</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited site requisitions & transfers</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time material deduction & audits</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Purchase Orders & Supplier Receipts</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority technical email support</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cancel or pause subscription anytime</span>
                </div>
              </div>

              <button
                onClick={() => setIsSignupOpen(true)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer active:scale-95"
              >
                <span>Select Pro Monthly</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 3: Pro Annual Plan (VIVID COLOR LUXURY LOOK - BALANCED & ALIGNED) */}
            <div className="relative group flex flex-col transition-all duration-300">
              {/* Vivid Multi-Color Radiant Iridescent Glow Outer Ring */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-rose-500 via-purple-600 to-emerald-400 rounded-[32px] blur-sm opacity-85 group-hover:opacity-100 transition duration-500 group-hover:blur-md" />

              {/* Highlight Best Value Top Pill - Placed on outer wrapper so it never gets clipped */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30">
                <span className="text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 via-rose-500 to-amber-300 text-slate-950 px-5 py-1.5 rounded-full shadow-xl shadow-rose-500/40 flex items-center gap-1.5 border border-amber-200/80 font-sans whitespace-nowrap">
                  <Crown className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                  <span>Luxury VIP · Save 21%</span>
                </span>
              </div>

              {/* Main Card Container */}
              <div className="relative h-full bg-gradient-to-b from-slate-900/98 via-slate-950/98 to-slate-950 rounded-[30px] p-8 flex flex-col border border-amber-400/40 shadow-2xl shadow-amber-500/20 backdrop-blur-2xl">
                {/* Internal Luxury Ambient Glow Spheres (contained safely in an inner overflow-hidden layer) */}
                <div className="absolute inset-0 rounded-[30px] overflow-hidden pointer-events-none">
                  <div className="absolute -top-20 -right-20 w-56 h-56 bg-gradient-to-br from-amber-400/30 via-rose-500/25 to-purple-600/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
                  <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-indigo-600/25 rounded-full blur-3xl" />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
                </div>

                <div className="mb-6 pt-3 relative z-10">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-purple-500/25 px-3.5 py-1 rounded-full border border-amber-500/40 inline-flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Flagship Enterprise</span>
                  </span>
                  <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300 mt-4 tracking-tight">
                    Pro Annual
                  </h3>
                  <p className="text-xs text-slate-300/90 mt-2 leading-relaxed">
                    The ultimate high-performance suite. Pay once for 12 months with maximum cost savings & VIP engineering privileges.
                  </p>
                </div>

                <div className="mb-8 relative z-10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 drop-shadow-[0_2px_20px_rgba(245,158,11,0.6)]">
                      $189.00
                    </span>
                    <span className="text-xs font-bold text-amber-200/80">/ year</span>
                  </div>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-emerald-500/20 border border-amber-500/40 text-amber-200 text-[11px] font-bold shadow-sm">
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>Only ~$15.75/month · Save $49.80 every year</span>
                  </div>
                </div>

                <div className="space-y-3.5 mb-8 flex-1 text-xs text-slate-200 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-rose-500/30">
                      <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    </div>
                    <span className="font-bold text-white">All Pro Monthly features included</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-rose-500/30">
                      <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    </div>
                    <span className="text-amber-200 font-semibold">Save 21% instantly compared to monthly billing</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-rose-500/30">
                      <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    </div>
                    <span>👑 VIP Dedicated Engineering & Priority Setup</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-rose-500/30">
                      <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    </div>
                    <span>Free white-glove Excel/CSV catalog migration</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-rose-500/30">
                      <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    </div>
                    <span>Bank QR / Wire Transfer Slip instant approval</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-rose-500/30">
                      <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    </div>
                    <span>Custom corporate branding & locked-in renewal rate</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsSignupOpen(true)}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 via-rose-500 to-amber-300 hover:from-amber-300 hover:via-rose-400 hover:to-yellow-200 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-2xl shadow-rose-500/30 hover:shadow-amber-400/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer active:scale-95 uppercase tracking-wider relative z-10"
                >
                  <Crown className="w-4 h-4 fill-slate-950" />
                  <span>Select Pro Annual (Save 21%)</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>

          {/* Payment Method Notice */}
          <div className="mt-14 max-w-2xl mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block">Easy Bank Payments & QR Wire Transfer</span>
                <span>Commercial Bank, Sampath Bank, or any local/international bank wire supported.</span>
              </div>
            </div>
            <button
              onClick={() => setIsSignupOpen(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs shrink-0 transition"
            >
              Start Free Trial First
            </button>
          </div>
        </div>
      </section>

      {/* Comprehensive FAQ Section */}
      <section id="faq" className="py-20 sm:py-28 border-t border-slate-800/80 bg-slate-950 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
              Everything You Need to Know
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Have questions about trials, billing, or multi-tenancy? Here are the answers.
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left font-bold text-xs sm:text-sm text-white flex justify-between items-center gap-4 cursor-pointer hover:text-emerald-400 transition"
                >
                  <span>{faq.q}</span>
                  <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                    {activeFaq === idx ? (
                      <ChevronUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Help Box */}
          <div className="mt-12 text-center p-6 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <h4 className="text-sm font-bold text-white mb-1">Still have questions?</h4>
            <p className="text-xs text-slate-400 mb-4">Our engineering support team is ready to assist your company setup.</p>
            <a
              href="mailto:apexdevinfo@gmail.com"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300"
            >
              <span>Contact Apex Support: apexdevinfo@gmail.com</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* High-End Footer with Developer Attribution */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Boxes className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-black text-sm text-white">Apex Stock SaaS</span>
              <span className="text-[11px] text-slate-500 block">Centralized Multi-Site Inventory & Dispatch</span>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsOfflineViewerOpen(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1.5 transition cursor-pointer underline decoration-emerald-500/50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Offline Backup Viewer & Excel Converter (Emergency Data Tool)</span>
            </button>
            <div className="text-xs font-semibold text-slate-400">
              Apex Stock SaaS © {new Date().getFullYear()} · All Rights Reserved
            </div>
            <div className="text-[11px] text-emerald-400/80 font-medium">
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

      {/* Emergency Offline Backup Data Viewer Modal */}
      <OfflineBackupViewerModal
        isOpen={isOfflineViewerOpen}
        onClose={() => setIsOfflineViewerOpen(false)}
      />
    </div>
  );
};
