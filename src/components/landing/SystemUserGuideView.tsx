import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  BookOpen,
  Boxes,
  Building2,
  Users2,
  Send,
  Truck,
  Gift,
  FolderKanban,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Search,
  ShoppingCart,
  RotateCcw,
  FileText,
  HardHat,
  Layers,
  UserCheck,
  Lock,
} from 'lucide-react';

interface SystemUserGuideViewProps {
  onBackToOverview: () => void;
  onOpenSignup: () => void;
  onOpenLogin: () => void;
}

interface GuideChapter {
  id: string;
  number: string;
  category: 'setup' | 'warehouse' | 'operations' | 'projects' | 'admin';
  categoryLabel: string;
  title: string;
  summary: string;
  icon: React.ElementType;
  steps: Array<{
    stepTitle: string;
    detail: string;
  }>;
  keyOutputs: string[];
}

const GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: 'ch-01',
    number: 'Chapter 01',
    category: 'setup',
    categoryLabel: 'Getting Started & Setup',
    title: 'Workspace Registration & Master Directory Setup',
    summary:
      'Set up your isolated company cloud workspace in 60 seconds and register your master catalog, regional site yards, field crews, suppliers, and clients.',
    icon: Boxes,
    steps: [
      {
        stepTitle: '1. Create Your Company Workspace',
        detail:
          'Click "Start 7-Day Free Trial" and enter your Company Name, Admin Username, and Password. Your private cloud database is created immediately with no credit card required.',
      },
      {
        stepTitle: '2. Register Materials & Heavy Machinery (or Bulk Import Excel)',
        detail:
          'Open "Master Registrations → Item Catalog" to add Consumable Materials (cables, cement, pipes, fittings) and Returnable Machinery/Tools (excavators, generators, fusion splicers) with minimum low-stock alert levels—or import thousands of items at once via Excel/CSV.',
      },
      {
        stepTitle: '3. Add Site Branches, Field Crews, Suppliers & Clients',
        detail:
          'Register your Regional Site Yards (Branches), Field Crew Teams (with Team Leader names & mobile numbers), Approved Vendors, and Project Clients in one unified Master Directory.',
      },
      {
        stepTitle: '4. Create Staff Logins with Branch Security Locks',
        detail:
          'Under "User Management", create accounts for HQ Storekeepers and Site Supervisors. Assigning a user to a specific Site Branch automatically locks their view to that branch only.',
      },
    ],
    keyOutputs: [
      'Master Material & Machinery Catalog',
      'Excel / CSV Bulk Catalog Import',
      'Branch-Locked Supervisor Accounts',
    ],
  },
  {
    id: 'ch-02',
    number: 'Chapter 02',
    category: 'warehouse',
    categoryLabel: 'Warehouse & Procurement',
    title: 'Central Warehouse, Supplier Orders (PO) & Client-Supplied Free Stock',
    summary:
      'Manage both company-purchased stock and free-issue materials supplied by project clients without mixing up financial valuation.',
    icon: Gift,
    steps: [
      {
        stepTitle: '1. Issue Official Supplier Purchase Orders (PO)',
        detail:
          'In "Supplier Orders (PO)", generate numbered Purchase Orders for your vendors, track pending vs. delivered quantities, and print official A4 PO documents.',
      },
      {
        stepTitle: '2. Receive Stock into Main Central Warehouse (GRN)',
        detail:
          'Record Goods Received Notes (GRN) directly into Central HQ Stock. The system updates live warehouse quantities, unit rates, and total inventory valuation automatically.',
      },
      {
        stepTitle: '3. Record Client-Supplied Free Materials Separately',
        detail:
          'When a client or main contractor provides project materials free of charge, open "Client Free Stock" and log their Dispatch Note (DN) under that registered client. These items stay at zero purchase cost while remaining fully traceable.',
      },
      {
        stepTitle: '4. Monitor Real-Time Low-Stock Alerts',
        detail:
          'Your Dashboard and Item Catalog highlight any material that drops below its minimum safety threshold so procurement teams can reorder before site work stops.',
      },
    ],
    keyOutputs: [
      'Printable Purchase Orders & GRN Vouchers',
      '2-Way Synced Client Register & Free-Issue Stock Ledger',
      'Automated Low-Stock Warning Thresholds',
    ],
  },
  {
    id: 'ch-03',
    number: 'Chapter 03',
    category: 'operations',
    categoryLabel: 'Site Transfers & Field Dispatch',
    title: 'Site Stock Requisitions, HQ Dispatches & Crew Issuance',
    summary:
      'Control every movement of stock from Central Headquarters to Regional Site Yards, and from Site Yards into the hands of Field Teams.',
    icon: Send,
    steps: [
      {
        stepTitle: '1. Digital Stock Requisitions from Site Branches',
        detail:
          'Site Supervisors submit a Stock Requisition from their assigned Site Branch to Central HQ specifying required items, quantities, and urgency.',
      },
      {
        stepTitle: '2. Smart Shortage Check & HQ Dispatch Approval',
        detail:
          'Central HQ reviews the request against live warehouse stock. If any item is short, HQ can use 1-click "Send Available Only" or adjust quantities, generating an official Dispatch Note that transfers stock to the Site Branch.',
      },
      {
        stepTitle: '3. Daily Issuance to Field Crews',
        detail:
          'In "Issue to Teams", HQ or Site Supervisors issue consumable materials and returnable tools to a specific Field Team Leader (includingdrum/batch/serial remarks) and print a signable Issue Note / Gate Pass.',
      },
      {
        stepTitle: '4. Live Team In-Hand Custody Tracking',
        detail:
          'Open "Team In-Hand Stock" anytime to see the exact balance of materials and tools currently held by each Field Crew Leader across every branch.',
      },
    ],
    keyOutputs: [
      'Inter-Branch Requisition & Approval Workflow',
      'Printable Numbered Issue Notes & Gate Passes',
      'Live Field Crew In-Hand Custody Balances',
    ],
  },
  {
    id: 'ch-04',
    number: 'Chapter 04',
    category: 'projects',
    categoryLabel: 'Projects & Reconciliation',
    title: 'Project Material Usage, Section Templates & Surplus Returns',
    summary:
      'Reconcile issued stock against actual on-site installation across multiple teams, deduct client stock automatically, and recover unused materials.',
    icon: FolderKanban,
    steps: [
      {
        stepTitle: '1. Create Projects & Reusable BOQ Section Templates',
        detail:
          'Register active contracts or WBS sites in "Project Registry" (e.g., Road Section A, Fiber Zone 04, Substation B) and create reusable Material Templates for recurring engineering sections.',
      },
      {
        stepTitle: '2. Multi-Team Material Consumption Logging',
        detail:
          'Multiple field crews working on the same project log actual installed quantities in "Material Usage". Every entry records who installed what, where, and on which date.',
      },
      {
        stepTitle: '3. Automatic Client-Supplied Stock Priority',
        detail:
          'When logging usage for a client-linked project, the system automatically deducts available Client-Supplied Free Materials first before deducting company-purchased stock—preventing billing disputes.',
      },
      {
        stepTitle: '4. Team Returns & Branch-to-HQ Returns',
        detail:
          'Unused surplus materials, empty drums, or returnable machinery are returned from Field Crews to the Site Branch ("Team Returns") or from a Site Branch back to Central HQ ("Branch Returns") with full condition notes.',
      },
    ],
    keyOutputs: [
      'Automatic Client Free-Stock Priority Deduction',
      'Multi-Crew BOQ & WBS Usage Reports',
      'Verified Team & Branch Return Vouchers',
    ],
  },
  {
    id: 'ch-05',
    number: 'Chapter 05',
    category: 'admin',
    categoryLabel: 'Machinery, Audits & Backups',
    title: 'Plant & Equipment Fleet, Custom Letterheads, Audit Trail & Backups',
    summary:
      'Maintain full accountability over high-value machinery assets, corporate PDF branding, user activity logs, and offline data backups.',
    icon: ShieldCheck,
    steps: [
      {
        stepTitle: '1. Dedicated Plant & Machinery Fleet View',
        detail:
          'Track heavy machinery, generators, testing instruments, and power tools separately from consumables—know whether an asset is in the Central Yard, at a Site Branch, or with a Field Crew.',
      },
      {
        stepTitle: '2. Custom Corporate Document Templates',
        detail:
          'In "Document Templates", configure your Company Name, Logo, Address, Header Style, and Signature Blocks ("Prepared By", "Checked By", "Received By") for all printed PDFs.',
      },
      {
        stepTitle: '3. Tamper-Proof Audit Trail & Safe Recycle Bin',
        detail:
          'Every stock addition, dispatch, edit, or deletion is recorded with user identity and timestamp in "Audit Trail". Accidentally deleted records can be restored safely from the "Recycle Bin".',
      },
      {
        stepTitle: '4. 1-Click Full System JSON & Excel Backups',
        detail:
          'Export a complete offline snapshot of your entire workspace (JSON Backup) or download clean Excel reports at any time from the top header bar.',
      },
    ],
    keyOutputs: [
      'Machinery & Returnable Tool Custody Ledger',
      'Branded Corporate A4 PDF Vouchers',
      '1-Click Full JSON Backup, Excel Export & Audit Log',
    ],
  },
];

const FEATURE_SUMMARY_LIST = [
  {
    group: 'Warehouse & Inventory',
    items: [
      'Central HQ Warehouse + Unlimited Regional Site Yards',
      'Consumable Materials vs. Heavy Machinery Classification',
      'Client-Supplied Free Materials Ledger (Zero-Cost Liability)',
      'Excel / CSV Bulk Import & Export',
      'Minimum Stock Level Alerts & Valuation Tracking',
    ],
  },
  {
    group: 'Field Operations & Projects',
    items: [
      'Site-to-HQ Stock Requisitions with Shortage Handling',
      'Field Crew Issuance with Serial / Drum / Batch Remarks',
      'Real-Time Field Crew In-Hand Stock Custody',
      'Multi-Crew Project Material Usage & Section Templates',
      'Team-to-Branch & Branch-to-HQ Stock Return Workflows',
    ],
  },
  {
    group: 'Enterprise Control & Documents',
    items: [
      'Supplier Purchase Orders (PO) & Goods Received Notes (GRN)',
      'Customizable Corporate PDF Vouchers & Gate Passes',
      'Branch-Locked Supervisor Access & Role Permissions',
      '100% Isolated Multi-Tenant Cloud Database',
      'Tamper-Proof Audit Trail, Recycle Bin & 1-Click JSON Backup',
    ],
  },
];

export const SystemUserGuideView: React.FC<SystemUserGuideViewProps> = ({
  onBackToOverview,
  onOpenSignup,
  onOpenLogin,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredChapters = GUIDE_CHAPTERS.filter((ch) => {
    const matchesCat = selectedCategory === 'all' || ch.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesCat;
    const inTitle = ch.title.toLowerCase().includes(q) || ch.summary.toLowerCase().includes(q);
    const inSteps = ch.steps.some(
      (s) => s.stepTitle.toLowerCase().includes(q) || s.detail.toLowerCase().includes(q)
    );
    return matchesCat && (inTitle || inSteps);
  });

  const handlePrintPdfManual = () => {
    window.print();
  };

  return (
    <div className="py-8 sm:py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ==================== WEB CONTROLS BAR (HIDDEN WHEN PRINTING PDF) ==================== */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={onBackToOverview}
            className="px-4 py-2.5 rounded-xl bg-[#253050] hover:bg-[#2d3a5e] text-white border border-[#dc9750]/40 text-xs font-extrabold flex items-center gap-2 shadow-sm cursor-pointer transition whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 text-[#dc9750]" />
            <span>Back to Platform Overview</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrintPdfManual}
              className="px-4 py-2.5 rounded-xl bg-[#dc9750] hover:bg-[#e7a662] text-[#1e2640] font-black text-xs flex items-center gap-2 shadow-md shadow-[#dc9750]/20 cursor-pointer transition whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Download / Print Full Guide (PDF)</span>
            </button>

            <button
              type="button"
              onClick={onOpenSignup}
              className="px-4 py-2.5 rounded-xl bg-[#161d33] hover:bg-[#222c4a] text-white border border-[#dc9750]/40 font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition whitespace-nowrap"
            >
              <span className="text-[#e5a460] font-black">Start 7-Day Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#dc9750]" />
            </button>
          </div>
        </div>

        {/* ==================== PRINTABLE & INTERACTIVE MANUAL CONTAINER ==================== */}
        <div className="printable-document space-y-8">
          {/* Official Print-Only Cover Header */}
          <div className="print-only border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-950">
                  APEX STOCK — OFFICIAL SYSTEM USER GUIDE & FEATURE HANDBOOK
                </h1>
                <p className="text-xs text-slate-700 mt-1">
                  Enterprise Cloud Inventory, Multi-Site Yard Operations, Client-Supplied Stock & Field Crew Dispatch
                </p>
              </div>
              <div className="text-right text-xs text-slate-600 font-mono">
                <div>Edition: {new Date().getFullYear()} International</div>
                <div>apexdevinfo@gmail.com</div>
              </div>
            </div>
          </div>

          {/* Hero Banner of the User Guide Tab */}
          <div className="rounded-[28px] bg-[#faf4ec] border border-[#dc9750]/60 shadow-[0_20px_50px_-15px_rgba(8,12,24,0.45)] p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#1e2640] via-[#dc9750] to-[#1e2640] no-print" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#9e5c19] mb-2">
                  <BookOpen className="w-4 h-4 text-[#b56b21]" />
                  <span>Complete System Documentation & Client Handbook</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-[#1e2640] tracking-tight leading-tight text-balance">
                  How Apex Stock Works: Simple Step-by-Step User Guide & Features
                </h1>
                <p className="text-xs sm:text-sm text-[#2d3859] mt-3 leading-relaxed font-medium">
                  Everything you need to understand how materials, client-supplied stock, heavy machinery, and daily crew dispatches flow across your headquarters, regional site yards, and active projects. You can read online below or save this handbook as an A4 PDF for your team.
                </p>
              </div>

              {/* Quick PDF & Trial Box */}
              <div className="no-print shrink-0 bg-[#1e2640] text-white rounded-2xl p-5 border border-[#dc9750]/50 lg:w-80 shadow-xl">
                <div className="text-xs font-bold text-[#e5a460]">Share with Your Team or Management</div>
                <p className="text-[11px] text-slate-200 mt-1 leading-relaxed">
                  Save this complete guide as a clean A4 PDF document to review offline with project managers, engineers, or storekeepers.
                </p>
                <button
                  type="button"
                  onClick={handlePrintPdfManual}
                  className="mt-3.5 w-full py-2.5 px-4 rounded-xl bg-[#dc9750] hover:bg-[#e7a662] text-[#1e2640] font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition whitespace-nowrap"
                >
                  <Printer className="w-4 h-4" />
                  <span>Save / Print PDF Handbook</span>
                </button>
              </div>
            </div>

            {/* ==================== 5-STAGE VISUAL STOCK FLOW ("AT A GLANCE") ==================== */}
            <div className="mt-8 pt-7 border-t border-[#dc9750]/35">
              <div className="text-xs font-extrabold text-[#1e2640] mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#b56b21]" />
                <span>End-to-End Operational Flow at a Glance (5 Simple Stages)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  {
                    stage: 'Stage 01',
                    title: 'Master Setup',
                    desc: 'Register materials, machinery, site yards, crews, suppliers & clients.',
                    icon: HardHat,
                  },
                  {
                    stage: 'Stage 02',
                    title: 'Stock Intake',
                    desc: 'Receive Supplier POs (GRN) or log Client-Supplied Free Materials.',
                    icon: ShoppingCart,
                  },
                  {
                    stage: 'Stage 03',
                    title: 'Branch Transfer',
                    desc: 'Site branches request stock; Central HQ dispatches to regional yards.',
                    icon: Building2,
                  },
                  {
                    stage: 'Stage 04',
                    title: 'Field Crew Issue',
                    desc: 'Issue materials & tools to Crew Leaders with live in-hand custody.',
                    icon: Users2,
                  },
                  {
                    stage: 'Stage 05',
                    title: 'Usage & Returns',
                    desc: 'Log project installation (client stock first) & return unused surplus.',
                    icon: RotateCcw,
                  },
                ].map((item) => {
                  const StageIcon = item.icon;
                  return (
                    <div
                      key={item.stage}
                      className="rounded-2xl bg-white border border-[#dc9750]/35 p-4 flex flex-col justify-between shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-mono font-extrabold text-[#a6601a]">
                            {item.stage}
                          </span>
                          <StageIcon className="w-4 h-4 text-[#1e2640] shrink-0" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-black text-[#1e2640]">{item.title}</h3>
                        <p className="text-[11px] text-[#3a4769] mt-1 leading-relaxed font-medium">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ==================== INTERACTIVE FILTER & SEARCH BAR (WEB ONLY) ==================== */}
          <div className="no-print rounded-2xl bg-[#faf4ec] border border-[#dc9750]/50 p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
            {/* Category Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: 'All Chapters (05)' },
                { id: 'setup', label: '01. Setup' },
                { id: 'warehouse', label: '02. Warehouse & Client Stock' },
                { id: 'operations', label: '03. Site & Crew Dispatch' },
                { id: 'projects', label: '04. Projects & Returns' },
                { id: 'admin', label: '05. Machinery & Security' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedCategory === tab.id
                      ? 'bg-[#1e2640] text-[#dc9750] shadow-xs'
                      : 'text-[#1e2640] hover:bg-[#dc9750]/20'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quick Keyword Search */}
            <div className="relative md:w-68 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guide (e.g. Excel, PO, Client)..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* ==================== STEP-BY-STEP CHAPTERS ==================== */}
          <div className="space-y-6">
            {filteredChapters.length === 0 ? (
              <div className="rounded-2xl bg-white/85 border border-slate-200 p-10 text-center">
                <p className="text-sm font-bold text-slate-800">
                  No guide sections matched &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  Show All Guide Chapters
                </button>
              </div>
            ) : (
              filteredChapters.map((chapter) => {
                const ChapterIcon = chapter.icon;
                return (
                  <div
                    key={chapter.id}
                    className="rounded-[24px] bg-[#fdfaf5] border border-[#dc9750]/45 shadow-[0_14px_34px_-12px_rgba(8,12,24,0.35)] p-6 sm:p-8 break-inside-avoid"
                  >
                    {/* Chapter Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#dc9750]/30">
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-[#1e2640] text-[#dc9750] flex items-center justify-center shrink-0 shadow-xs no-print">
                          <ChapterIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="font-mono font-extrabold text-[#a6601a]">
                              {chapter.number}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="text-[#475577]">{chapter.categoryLabel}</span>
                          </div>
                          <h2 className="text-lg sm:text-2xl font-black text-[#1e2640] mt-1 tracking-tight">
                            {chapter.title}
                          </h2>
                          <p className="text-xs sm:text-sm text-[#2d3859] mt-1.5 leading-relaxed font-medium max-w-3xl">
                            {chapter.summary}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 4 Practical Steps Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                      {chapter.steps.map((st) => (
                        <div
                          key={st.stepTitle}
                          className="rounded-2xl bg-white border border-[#dc9750]/30 p-4"
                        >
                          <h3 className="text-xs sm:text-sm font-extrabold text-[#1e2640]">
                            {st.stepTitle}
                          </h3>
                          <p className="text-xs text-[#334063] mt-1.5 leading-relaxed font-medium">
                            {st.detail}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Key Documents / Outputs Footer */}
                    <div className="mt-5 pt-4 border-t border-[#dc9750]/25 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                      <span className="font-extrabold text-[#1e2640] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#b56b21]" />
                        <span>Key Outputs & Controls:</span>
                      </span>
                      {chapter.keyOutputs.map((out) => (
                        <span key={out} className="flex items-center gap-1.5 font-bold text-[#2d3859]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#b56b21] shrink-0" />
                          <span>{out}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ==================== COMPLETE FEATURE CHECKLIST & USER ROLE PERMISSIONS ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 break-inside-avoid">
            {/* Complete Platform Features Overview */}
            <div className="lg:col-span-7 rounded-[24px] bg-[#fdfaf5] border border-[#dc9750]/45 p-6 sm:p-8 shadow-md">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#9e5c19] mb-2">
                <FileSpreadsheet className="w-4 h-4 text-[#b56b21]" />
                <span>Complete Module & Feature Checklist</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1e2640] tracking-tight">
                Everything Included in Every Workspace
              </h2>
              <p className="text-xs text-[#475577] mt-1 font-medium">
                All modules below are unlocked during your 7-Day Free Trial as well as Pro Monthly and Pro Annual plans.
              </p>

              <div className="mt-5 space-y-5">
                {FEATURE_SUMMARY_LIST.map((sec) => (
                  <div key={sec.group} className="pt-4 first:pt-0 border-t first:border-t-0 border-[#dc9750]/25">
                    <h3 className="text-xs font-black text-[#1e2640] mb-2.5">{sec.group}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sec.items.map((item) => (
                        <div key={item} className="flex items-start gap-2 text-xs text-[#2d3859] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#b56b21] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Role & Branch-Lock Guide */}
            <div className="lg:col-span-5 rounded-[24px] bg-[#fdfaf5] border border-[#dc9750]/45 p-6 sm:p-8 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#9e5c19] mb-2">
                  <Lock className="w-4 h-4 text-[#b56b21]" />
                  <span>Staff Access Control Guide</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#1e2640] tracking-tight">
                  How Staff Roles Work
                </h2>
                <p className="text-xs text-[#475577] mt-1 font-medium">
                  Assign tailored access to headquarters executives and regional site storekeepers.
                </p>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-white border border-[#dc9750]/30 p-4">
                    <div className="flex items-center gap-2 text-xs font-black text-[#1e2640]">
                      <UserCheck className="w-4 h-4 text-[#b56b21]" />
                      <span>Central HQ Administrator / Store Manager</span>
                    </div>
                    <p className="text-xs text-[#334063] mt-1.5 leading-relaxed font-medium">
                      Full visibility across Central Warehouse, Client-Supplied Free Stock, Supplier Purchase Orders, Master Registrations, all Regional Site Yards, Audit Trails, and System Backups.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white border border-[#dc9750]/30 p-4">
                    <div className="flex items-center gap-2 text-xs font-black text-[#1e2640]">
                      <Truck className="w-4 h-4 text-[#1e2640]" />
                      <span>Site Branch Supervisor / Yard Storekeeper</span>
                    </div>
                    <p className="text-xs text-[#334063] mt-1.5 leading-relaxed font-medium">
                      Automatically locked to their assigned Site Branch. Can submit Stock Requisitions to HQ, manage their own Site Yard stock, issue items to their Field Crews, and log Project Material Usage & Returns—with zero access to other branches.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom CTA Card (Hidden when printing) */}
              <div className="no-print mt-6 pt-5 border-t border-[#dc9750]/30">
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onOpenSignup}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#1e2640] hover:bg-[#283354] text-[#dc9750] font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition whitespace-nowrap"
                  >
                    <span>Start 7-Day Free Trial</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-[#1e2640] border border-[#1e2640]/30 font-bold text-xs cursor-pointer transition whitespace-nowrap"
                  >
                    Client Login
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Print-Only Footer Attribution */}
          <div className="print-only pt-6 border-t border-slate-300 text-center text-xs text-slate-600">
            Apex Stock Enterprise SaaS · Official Client User Guide & Feature Handbook · Apex Developer | System Developed By Sasith Dissanayake
          </div>
        </div>
      </div>
    </div>
  );
};
