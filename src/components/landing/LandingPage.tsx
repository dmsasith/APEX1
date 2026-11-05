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
  FileText,
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
} from 'lucide-react';
import { TenantSignupModal } from './TenantSignupModal';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenSignup?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
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
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">
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
          <div className="flex items-center gap-3">
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

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[250px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

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
          <div className="mt-12 sm:mt-16 rounded-2xl bg-slate-900 border border-slate-800 p-2 sm:p-3 shadow-2xl relative overflow-hidden">
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 sm:p-6 text-left">
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
      <section id="features" className="py-16 sm:py-24 border-t border-slate-800/80 bg-slate-950">
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
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Inter-Branch Requisitions & Shortage Review</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Site Admins requisition materials from Central Main Warehouse. Central Logistics reviews balances with smart shortage warnings and 1-click actions.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Issue to Field Teams (Daily Dispatch)</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Site supervisors dispatch materials to work crews with instant inventory deduction and official numbered Issue Notes.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Users2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Team In-Hand Stock & Consumption</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Always know what tools and materials each field crew holds on-site. Log project usage per installation ref number.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tenant Self-Registration Modal */}
      <TenantSignupModal isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
    </div>
  );
};
