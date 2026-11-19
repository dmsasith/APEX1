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
  Play,
} from 'lucide-react';
import { TenantSignupModal } from './TenantSignupModal';
import { SystemUserGuideView } from './SystemUserGuideView';
import { useStock } from '../../context/StockContext';
import { computePlatformPricingMetrics } from '../../types';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenSignup?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  const { platformPricing } = useStock();
  const pricingMetrics = computePlatformPricingMetrics(platformPricing);

  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [activeLandingTab, setActiveLandingTab] = useState<'overview' | 'guide'>('overview');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [selectedIndustryIdx, setSelectedIndustryIdx] = useState<number>(0);
  const [isIntroVideoPlaying, setIsIntroVideoPlaying] = useState<boolean>(false);
  const [comparisonCategory, setComparisonCategory] = useState<
    'all' | 'pricing' | 'warehouse' | 'field' | 'projects' | 'security'
  >('all');

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
      q: `How does the ${pricingMetrics.trialDays}-Day Free Trial work?`,
      a: `You can register your company workspace in under 60 seconds with zero commitment. No credit card is required to sign up. You get 100% full access to all enterprise modules—including unlimited site branches, field teams, client-supplied stock tracking, supplier purchase orders, and PDF voucher printing for a full ${pricingMetrics.trialDays} days.`,
    },
    {
      q: `What happens after the ${pricingMetrics.trialDays}-day free trial?`,
      a: `After ${pricingMetrics.trialDays} days, you can choose between our Pro Monthly plan ($${pricingMetrics.monthlyPriceFormatted}/mo) or our cost-saving Pro Annual VIP plan ($${pricingMetrics.annualPriceClean}/yr — Save ${pricingMetrics.annualSavingsPercent}%). All data, inventory records, and transaction history entered during your trial remain 100% safe and intact. You can activate your plan via Bank QR or wire transfer slip upload.`,
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

  const comparisonRows: Array<{
    category: 'pricing' | 'warehouse' | 'field' | 'projects' | 'security';
    categoryLabel: string;
    feature: string;
    detail: string;
    isSpecialHighlight?: boolean;
    apex: string;
    sortly: string;
    zoho: string;
    inflowCin7: string;
    legacyErp: string;
  }> = [
    // 1. PRICING, USERS & SCALABILITY
    {
      category: 'pricing',
      categoryLabel: 'Pricing & Scale',
      feature: 'Monthly Subscription Price (All Modules Unlocked)',
      detail: 'Complete multi-site warehouse, project, procurement & field crew ERP with zero hidden add-on fees.',
      isSpecialHighlight: true,
      apex: `$${pricingMetrics.monthlyPriceFormatted} / mo ($${pricingMetrics.annualMonthlyEquivalentFormatted}/mo Annual)`,
      sortly: '$149 – $299+ / mo',
      zoho: '$99 – $249+ / mo',
      inflowCin7: '$149 – $399+ / mo',
      legacyErp: '$800 – $2,500+ / mo',
    },
    {
      category: 'pricing',
      categoryLabel: 'Pricing & Scale',
      feature: 'Annual Total Cost (Unlimited Users & Unlimited Site Branches)',
      detail: 'Flat yearly rate for your entire company with Unlimited Users, Unlimited Regional Site Branches & Unlimited Field Teams — vs. competitor tiered user/branch caps & add-on seat fees.',
      isSpecialHighlight: true,
      apex: `✓ $${pricingMetrics.annualPriceClean} / year Flat (Unlimited Users & Unlimited Branches · Save 90%+)`,
      sortly: '✕ $1,788 – $3,588+ / year (Capped at 5–8 users; +$240/yr per extra user & no branch RBAC)',
      zoho: '✕ $1,548 – $2,988+ / year (Capped at 2–5 users & limited warehouses; extra seats & locations billed extra)',
      inflowCin7: '✕ $2,148 – $4,788+ / year (Capped at 2–5 users; +$468/yr per extra user & paid per-location add-ons)',
      legacyErp: '✕ $10,000+ / year (+$900–$1,800/yr per user + paid branch licenses & setup fees)',
    },
    {
      category: 'pricing',
      categoryLabel: 'Pricing & Scale',
      feature: 'Unlimited System Users & Staff Logins',
      detail: 'Create accounts for all HQ Storekeepers, Branch Admins, and Site Supervisors without paying per-seat fees.',
      apex: '✓ Unlimited Users ($0 extra)',
      sortly: '✕ 5–8 Users max (Extra seats $20+/mo each)',
      zoho: '✕ 2–5 Users max (Extra seats charged per user)',
      inflowCin7: '✕ 2–5 Users max (Extra seats $39+/mo each)',
      legacyErp: '✕ $75 – $150+ per user/month',
    },
    {
      category: 'pricing',
      categoryLabel: 'Pricing & Scale',
      feature: 'Unlimited Regional Site Branches & Yards',
      detail: 'Add unlimited regional site stores, project yards, and central warehouses as your projects expand.',
      apex: '✓ Unlimited Site Yards ($0 extra)',
      sortly: '✕ Folder-based only (No branch RBAC)',
      zoho: '✕ Limited warehouses per tier (Extra locations paid)',
      inflowCin7: '✕ Paid per-location add-on fee',
      legacyErp: '✕ Paid multi-location licensing',
    },
    {
      category: 'pricing',
      categoryLabel: 'Pricing & Scale',
      feature: 'Unlimited Items, Barcodes, Orders & Monthly Transactions',
      detail: 'Zero artificial caps on SKU count, monthly purchase orders, dispatches, or barcode scans.',
      apex: '✓ 100% Unlimited',
      sortly: '✕ Capped by item/entry tier',
      zoho: '✕ Capped by monthly order volume',
      inflowCin7: '◐ Capped on lower plans',
      legacyErp: '✓ Unlimited (High contract cost)',
    },

    // 2. CENTRAL WAREHOUSE, PO/GRN/RTV & ITEM LIFECYCLE TRACEABILITY
    {
      category: 'warehouse',
      categoryLabel: 'Warehouse, PO & FOC',
      feature: '1-Click Central Stock End-to-End Item Lifecycle Summary (Printable A4/PDF)',
      detail: 'Select any item in Central Stock to view every PO/Manual/FOC inbound source, how it split across Sites, how Sites issued to Teams, Used/Wasted, and Central/Site/Team In-Hand.',
      isSpecialHighlight: true,
      apex: '✓ Built-In Interactive + A4/PDF Print',
      sortly: '✕ Not Available',
      zoho: '✕ Basic stock card only (No team/site chain)',
      inflowCin7: '✕ Warehouse level only',
      legacyErp: '◐ Requires custom BI report coding',
    },
    {
      category: 'warehouse',
      categoryLabel: 'Warehouse, PO & FOC',
      feature: '1-Click Site Branch Forward Traceability Summary (Printable A4/PDF)',
      detail: 'Select any item inside a Site Branch to see HQ transfers received, quantities issued to each Field Team at that site, Project Used/Wastage, and Site/Team In-Hand.',
      isSpecialHighlight: true,
      apex: '✓ Built-In Forward Traceability + Print',
      sortly: '✕ Not Available',
      zoho: '✕ Not Available',
      inflowCin7: '✕ Not Available',
      legacyErp: '✕ Not Available',
    },
    {
      category: 'warehouse',
      categoryLabel: 'Warehouse, PO & FOC',
      feature: 'Client-Supplied Free Stock (FOC) with Auto-Locked Site Branch',
      detail: 'Receive client/telecom-operator free materials at zero cost liability; selecting the project auto-locks the Allocated Site Branch so FOC stock never mixes across branches.',
      isSpecialHighlight: true,
      apex: '✓ Native FOC Pool + Auto Branch Lock',
      sortly: '✕ No Client FOC concept',
      zoho: '✕ Built for retail sales, not Client FOC',
      inflowCin7: '✕ No Client FOC accounting',
      legacyErp: '◐ Complex manual workaround',
    },
    {
      category: 'warehouse',
      categoryLabel: 'Warehouse, PO & FOC',
      feature: 'Admin FOC Voucher Reassignment (1-Click Project Correction)',
      detail: 'If a client FOC shipment was mistakenly logged under the wrong project, Admins can edit and reassign the voucher to the right project with full Audit Trail.',
      apex: '✓ 1-Click Admin Reassignment',
      sortly: '✕ Not Available',
      zoho: '✕ Not Available',
      inflowCin7: '✕ Not Available',
      legacyErp: '✕ Requires reversal journal entries',
    },
    {
      category: 'warehouse',
      categoryLabel: 'Warehouse, PO & FOC',
      feature: 'Official Supplier Purchase Orders (PO) & Multi-Item Atomic GRN',
      detail: 'Generate sequential 0001-numbered POs with tax/discount/commercial terms and receive full or partial multi-item batch deliveries with printable GRN vouchers.',
      apex: '✓ Included (PO + Full/Partial GRN)',
      sortly: '◐ Basic PO only on higher tiers',
      zoho: '✓ Included',
      inflowCin7: '✓ Included',
      legacyErp: '✓ Included',
    },
    {
      category: 'warehouse',
      categoryLabel: 'Warehouse, PO & FOC',
      feature: 'Return to Vendor (RTV), Official Debit Notes & Outward Gate Passes',
      detail: 'Dispatch defective supplier goods with vehicle/driver Gate Pass, print official commercial Debit Notes, and track vendor settlements (Replacement, Credit, Refund).',
      apex: '✓ Full RTV + Debit Note + Gate Pass',
      sortly: '✕ Not Available',
      zoho: '◐ Vendor credits only (No Gate Pass)',
      inflowCin7: '◐ Basic vendor return',
      legacyErp: '✓ Included',
    },
    {
      category: 'warehouse',
      categoryLabel: 'Warehouse, PO & FOC',
      feature: 'Damaged Stock Ledger & 1-Click Repair Restoration to Main Stock',
      detail: 'Quarantine damaged items returned from teams/sites and restore repaired equipment back into usable Main Stock with DSR vouchers.',
      apex: '✓ Dedicated Damaged & Restoration Ledger',
      sortly: '✕ Manual folder move only',
      zoho: '✕ Manual adjustment only',
      inflowCin7: '✕ Manual adjustment only',
      legacyErp: '◐ Complex scrap module',
    },
    {
      category: 'warehouse',
      categoryLabel: 'Warehouse, PO & FOC',
      feature: 'Optional Item Photo Upload (<200KB Auto-Compression) & "Print with Image" Option',
      detail: 'Attach item photos that automatically resize & compress under 200KB for fast cloud loading, choose "Print with Image" on any voucher/report, and view Two-Line Item Code + Name dropdowns in POs & Requisitions.',
      isSpecialHighlight: true,
      apex: '✓ <200KB Auto-Compress + "Print with Image"',
      sortly: '◐ Photos supported (No voucher print toggle)',
      zoho: '◐ Basic item image',
      inflowCin7: '◐ Basic item image',
      legacyErp: '✕ Text-only item masters',
    },

    // 3. SITE TRANSFERS, FIELD CREW CUSTODY & BARCODE SCANNING
    {
      category: 'field',
      categoryLabel: 'Site & Field Crews',
      feature: '2-Tab Site Stock Requisitions (Normal Stock vs. Branch-Exclusive FOC)',
      detail: 'Separate requisition tabs for regular warehouse stock and branch-assigned Client FOC projects so supervisors never request another site’s project materials.',
      isSpecialHighlight: true,
      apex: '✓ 2-Tab Normal vs. Branch-Locked FOC',
      sortly: '✕ No requisition approval workflow',
      zoho: '✕ Inter-warehouse transfer only',
      inflowCin7: '✕ Standard stock transfer only',
      legacyErp: '◐ Generic internal requisition',
    },
    {
      category: 'field',
      categoryLabel: 'Site & Field Crews',
      feature: 'Auto Low-Stock Priority Top Sorting & Live "Site Avl:" + "Main:" Balances',
      detail: 'When a site creates a requisition, items low at that site automatically appear at the very top with a "⚠️ Site Low" badge and live Site vs. HQ stock numbers.',
      isSpecialHighlight: true,
      apex: '✓ Auto Priority Sort + Dual Live Balances',
      sortly: '✕ Not Available',
      zoho: '✕ Not Available',
      inflowCin7: '✕ Not Available',
      legacyErp: '✕ Not Available',
    },
    {
      category: 'field',
      categoryLabel: 'Site & Field Crews',
      feature: 'HQ "Send Available Only" 1-Click Shortage Adjustment',
      detail: 'If a branch requests 100 units when Central HQ only holds 60, HQ can adjust to the available 60 units in one click during dispatch approval.',
      apex: '✓ 1-Click Shortage Adjustment',
      sortly: '✕ Not Available',
      zoho: '✕ Manual edit required',
      inflowCin7: '✕ Manual edit required',
      legacyErp: '✕ Manual edit required',
    },
    {
      category: 'field',
      categoryLabel: 'Site & Field Crews',
      feature: 'Live Field Crew In-Hand Stock Custody Ledger (TSR Audit Reports)',
      detail: 'Track exact balances held by every Field Crew Leader right now (Issued − Used in Projects − Wastage − Returned to Site) with printable TSR reports.',
      isSpecialHighlight: true,
      apex: '✓ Real-Time Crew In-Hand Ledger',
      sortly: '✕ No field crew custody tracking',
      zoho: '✕ Designed for customers, not field crews',
      inflowCin7: '✕ No crew custody balance',
      legacyErp: '✕ Requires custom sub-warehouse per crew',
    },
    {
      category: 'field',
      categoryLabel: 'Site & Field Crews',
      feature: 'Field Team Site Transfer Workflow ("Temporary Assigned" -> Permanent "Ref: Old Site")',
      detail: 'Transferring a team to a new site marks them "Temporary Assigned to - [New Site]" until old-site stock is cleared (or Admin-confirmed), then promotes to Permanent "[Team Name] (Ref: [Old Site])" with full Assigned Sites History.',
      isSpecialHighlight: true,
      apex: '✓ Temp -> Permanent + "Ref: Old Site" History',
      sortly: '✕ Not Available',
      zoho: '✕ Not Available',
      inflowCin7: '✕ Not Available',
      legacyErp: '✕ Not Available',
    },
    {
      category: 'field',
      categoryLabel: 'Site & Field Crews',
      feature: 'Site-Separated Team In-Hand Stock ("Stock to Return - [Old Site]" vs. Active Site)',
      detail: 'Never mixes a transferred team’s stock across sites: unreturned old-site items appear under "Stock to Return - [Previous Site]" (blocked from new-site usage), while new-site stock is listed under the new site name.',
      isSpecialHighlight: true,
      apex: '✓ Strict Site-Wise Stock Isolation',
      sortly: '✕ Not Available',
      zoho: '✕ Not Available',
      inflowCin7: '✕ Not Available',
      legacyErp: '✕ Not Available',
    },
    {
      category: 'field',
      categoryLabel: 'Site & Field Crews',
      feature: 'Multi-Item Batch Returns in Both Team Returns (RV) & Branch Returns (BRM)',
      detail: 'Add multiple items at once ("+ Add Item" / "+ Add All Held or Available"), set Good or Damaged condition per row, and return the entire batch on a single shared Return Voucher.',
      isSpecialHighlight: true,
      apex: '✓ Multi-Item Batch RV & BRM Vouchers',
      sortly: '✕ Single item move only',
      zoho: '✕ Customer sales returns only',
      inflowCin7: '✕ Customer sales returns only',
      legacyErp: '◐ Complex movement journal',
    },
    {
      category: 'field',
      categoryLabel: 'Site & Field Crews',
      feature: 'Consumable Materials vs. Returnable Heavy Machinery & Tools Fleet',
      detail: 'Dedicated Plant & Equipment Fleet view to track excavators, generators, fusion splicers, and testing meters separately from consumable materials.',
      apex: '✓ Materials + Plant/Machinery Fleet',
      sortly: '◐ Basic asset tags only',
      zoho: '✕ E-commerce SKU focus only',
      inflowCin7: '✕ Inventory parts only',
      legacyErp: '◐ Paid Fixed Assets add-on module',
    },
    {
      category: 'field',
      categoryLabel: 'Site & Field Crews',
      feature: 'Auto Crew Size (1 Leader + N NIC Members) & Team Name Lock After Stock Issue',
      detail: 'Crew size auto-calculates as NIC-verified members are added; locks Team Name against renaming once stock has been issued to protect historical vouchers, and supports Admin Password team deletion.',
      apex: '✓ Auto Crew Size + Name Lock after Issue',
      sortly: '✕ No crew directory',
      zoho: '✕ No crew directory',
      inflowCin7: '✕ No crew directory',
      legacyErp: '✕ Requires separate HR module',
    },
    {
      category: 'field',
      categoryLabel: 'Site & Field Crews',
      feature: 'Single-Shot Camera & USB Barcode Scanner with Auto-Hide & "Scan Now"',
      detail: 'Mobile camera and USB gun scanner detects once, immediately stops/hides the camera to prevent duplicate rapid scans, and gives a 1-click "Scan Now" button + sticker printing.',
      isSpecialHighlight: true,
      apex: '✓ Single-Shot Anti-Duplicate Scan + Stickers',
      sortly: '◐ Camera scan (No single-shot auto-hide)',
      zoho: '◐ Barcode support',
      inflowCin7: '◐ Barcode support',
      legacyErp: '◐ Requires paid mobile scanner license',
    },

    // 4. PROJECTS, INTERNATIONAL SECTION TEMPLATES (TELECOM, WATER, ELECTRIC, SOLAR) & WASTAGE ACCOUNTING
    {
      category: 'projects',
      categoryLabel: 'Projects & Industry Templates',
      feature: '3-Tier Project Hierarchy (Major/Main Umbrella, Sub-Projects & Individual)',
      detail: 'Receive bulk Client FOC under a Major Project; logging usage on any linked Sub-Project automatically deducts from the parent Main Project FOC pool.',
      isSpecialHighlight: true,
      apex: '✓ 3-Tier Main/Sub/Individual + Auto Pool Deduct',
      sortly: '✕ Flat folders only',
      zoho: '✕ No Main/Sub-Project FOC pool sharing',
      inflowCin7: '✕ Single job reference only',
      legacyErp: '✓ WBS Hierarchy (Complex setup)',
    },
    {
      category: 'projects',
      categoryLabel: 'Projects & Industry Templates',
      feature: 'International Industry Section Templates (Telecom, Water, Electric & Solar PV)',
      detail: '1-click auto-load of international standard fields for Telecom New Connection (ITU-T G.984), Water Supply (ISO 4064 / AWWA), Electrical Power (IEC 60364), Solar PV & Net-Metering (IEC 62446) & Standard EPC.',
      isSpecialHighlight: true,
      apex: '✓ Telecom, Water, Electric & Solar Presets',
      sortly: '✕ Not Available',
      zoho: '✕ Not Available',
      inflowCin7: '✕ Not Available',
      legacyErp: '✕ Requires expensive custom development',
    },
    {
      category: 'projects',
      categoryLabel: 'Projects & Industry Templates',
      feature: '"+ Add Field" Dynamic Custom Section Field Builder & Core Label Customizer',
      detail: 'Customize the 6 Core Connection Field labels and click "+ Add Field" when creating/editing a section (or inline during Project Registration) to add unlimited custom technical fields.',
      isSpecialHighlight: true,
      apex: '✓ Unlimited "+ Add Field" Custom Builder',
      sortly: '◐ Limited custom fields on higher plans',
      zoho: '◐ Generic SKU fields only',
      inflowCin7: '◐ Generic custom fields',
      legacyErp: '✕ Requires database schema consultant',
    },
    {
      category: 'projects',
      categoryLabel: 'Projects & Industry Templates',
      feature: '3-Step Connection Daily Progress with Session-Locked Team & Area',
      detail: 'For Telecom, Water, Electric & Solar connection sections, Step 1 (Team & Area) sits at the top and LOCKS until page refresh so supervisors can log 20+ daily connections back-to-back.',
      isSpecialHighlight: true,
      apex: '✓ 1-2-3 Connection Flow + Team/Area Lock',
      sortly: '✕ Not Available',
      zoho: '✕ Not Available',
      inflowCin7: '✕ Not Available',
      legacyErp: '✕ Not Available',
    },
    {
      category: 'projects',
      categoryLabel: 'Projects & Industry Templates',
      feature: 'Custom Project Section Registry, BOM Templates & 1-Click Template Restore',
      detail: 'Create custom sections, attach Default Material Templates (BOM) that auto-fill daily progress, and quick-load or restore Telecom, Water, Electric, or Solar templates in 1 click.',
      apex: '✓ Custom Sections + Auto BOM + 1-Click Load',
      sortly: '✕ Not Available',
      zoho: '✕ Manufacturing BOM only (Not field sections)',
      inflowCin7: '✕ Assembly BOM only',
      legacyErp: '◐ Complex engineering BOM',
    },
    {
      category: 'projects',
      categoryLabel: 'Projects & Telecom NC',
      feature: 'Installed Qty + "Wastage Qty" Dual Tracking & Live In-Hand Validation',
      detail: 'Enter both Installed Qty and Wastage Qty per item; validates live (Used + Wastage <= Team In-Hand) and updates Team Wastage columns, Reconciliation, and PU vouchers.',
      isSpecialHighlight: true,
      apex: '✓ Installed + Wastage Dual Ledger',
      sortly: '✕ Simple quantity reduction only',
      zoho: '✕ No field crew wastage breakdown',
      inflowCin7: '✕ No field wastage tracking',
      legacyErp: '◐ Separate scrap transaction required',
    },
    {
      category: 'projects',
      categoryLabel: 'Projects & Telecom NC',
      feature: 'User-Site Branch Lock & Project-Reserved Item Override Workflow',
      detail: 'Automatically locks usage entry if a project belongs to another branch, and protects project-reserved items with an Admin Cross-Project Override approval flow.',
      apex: '✓ Auto Branch Lock + Override Approval',
      sortly: '✕ Not Available',
      zoho: '✕ Not Available',
      inflowCin7: '✕ Not Available',
      legacyErp: '◐ Custom permission rules required',
    },
    {
      category: 'projects',
      categoryLabel: 'Projects & Telecom NC',
      feature: '"Full Report for This Site (Project)" — Team Subtotals + Site Grand Total',
      detail: '1-click A4 PDF & Excel report showing Part 1 (Every Team’s individual consumption, wastage & Team Subtotal) and Part 2 (Full Site Consolidated Grand Total).',
      isSpecialHighlight: true,
      apex: '✓ 1-Click Team Subtotals + Grand Total Report',
      sortly: '✕ Not Available',
      zoho: '✕ Not Available',
      inflowCin7: '✕ Not Available',
      legacyErp: '◐ Custom Crystal/BI report needed',
    },

    // 5. ISO 9001:2015 FORMAT STUDIO, DIGITAL SIGNATURES & ENTERPRISE SECURITY
    {
      category: 'security',
      categoryLabel: 'ISO Formats & Security',
      feature: 'ISO 9001:2015 Controlled Formats (FORMAT-01 to 04) + Auto Tenant Header',
      detail: 'Every RN, IN, PU, TSR, GRN, FOC, RV, BRM, PO & RTV prints in official ISO 9001:2015 layout with your registered Company Name, Logo, Address & Contact auto-synced.',
      isSpecialHighlight: true,
      apex: '✓ Built-In ISO 9001:2015 QMS Formats',
      sortly: '✕ Basic generic PDF list',
      zoho: '◐ Retail invoice templates only',
      inflowCin7: '◐ Standard commercial invoices',
      legacyErp: '◐ Requires paid form designer',
    },
    {
      category: 'security',
      categoryLabel: 'ISO Formats & Security',
      feature: 'Upload Your Own Company PDF / Image Format (Max 1MB) + Live A4 Studio',
      detail: 'Upload your official company letterhead/stationery as PDF or Image, adjust header crop %, rename table columns, or unify Format-01 & 02 in 1 click.',
      isSpecialHighlight: true,
      apex: '✓ PDF/Image Upload + Live A4 Studio',
      sortly: '✕ Cannot upload PDF stationery',
      zoho: '✕ HTML/CSS coding required',
      inflowCin7: '✕ Word template mail-merge required',
      legacyErp: '✕ Developer consultant required',
    },
    {
      category: 'security',
      categoryLabel: 'ISO Formats & Security',
      feature: 'ISO Signer Matrix & Interactive Digital Signatures (Draw on Pad or Upload)',
      detail: 'Configure Prepared By, Approved By & Reviewed By names/designations; draw signatures on screen or upload PNG/JPG that auto-match signers + Per-Voucher live override.',
      isSpecialHighlight: true,
      apex: '✓ Draw/Upload Signatures + Auto-Match',
      sortly: '◐ Simple sign-on-glass only',
      zoho: '◐ Requires paid Zoho Sign integration',
      inflowCin7: '✕ Not built-in',
      legacyErp: '✕ Requires 3rd-party e-sign plugin',
    },
    {
      category: 'security',
      categoryLabel: 'ISO Formats & Security',
      feature: 'Isolated Single-Click A4 Print Preview & Genuine Vector PDF Download',
      detail: 'Clicking Print on any voucher or report opens an isolated, clean A4 print window of ONLY that document (never prints the messy browser screen).',
      apex: '✓ Isolated A4 Print + Direct Vector PDF',
      sortly: '✕ Basic browser print',
      zoho: '✓ PDF print',
      inflowCin7: '✓ PDF print',
      legacyErp: '✓ PDF print',
    },
    {
      category: 'security',
      categoryLabel: 'ISO Formats & Security',
      feature: 'Mandatory Admin Password Verification for Any Deletion + Safe Recycle Bin',
      detail: 'Zero accidental deletions: deleting any item, project, section, or transaction across the system requires entering the Admin Password, backed by Recycle Bin restore.',
      isSpecialHighlight: true,
      apex: '✓ Admin Password Gate on Every Delete',
      sortly: '✕ Simple click confirmation',
      zoho: '✕ Simple click confirmation',
      inflowCin7: '✕ Simple click confirmation',
      legacyErp: '◐ Role-based only (No password prompt)',
    },
    {
      category: 'security',
      categoryLabel: 'ISO Formats & Security',
      feature: 'Sequential 0001 Auto-Numbering & Country-Aware Phone Digit Validation',
      detail: 'All codes (ITM-0001, PO-2026-0001, PU-2026-0001) increment cleanly from 0001, and phone fields automatically enforce exact digit rules for your country.',
      apex: '✓ 0001 Sequential IDs + Country Phone Guard',
      sortly: '✕ Random/manual IDs',
      zoho: '◐ Basic numbering (No phone digit guard)',
      inflowCin7: '◐ Basic numbering',
      legacyErp: '◐ Manual number series setup',
    },
    {
      category: 'security',
      categoryLabel: 'ISO Formats & Security',
      feature: '1-Click JSON Offline Backup Viewer, Admin View-As Mode & Bilingual (EN/SI) Help',
      detail: 'Export/inspect full JSON backups offline, preview the workspace as any staff user (View-As Mode), and access built-in English & Sinhala User Guides + 24/7 AI Chat Support.',
      isSpecialHighlight: true,
      apex: '✓ Offline Backup Viewer + EN/SI AI Support',
      sortly: '✕ CSV export only (English only)',
      zoho: '✕ Paid backup add-on (English only)',
      inflowCin7: '✕ CSV export only (English only)',
      legacyErp: '✕ DBA required for backups',
    },
  ];

  const filteredComparisonRows =
    comparisonCategory === 'all'
      ? comparisonRows
      : comparisonRows.filter((r) => r.category === comparisonCategory);

  const microFeaturesSpotlight = [
    {
      title: 'Telecom, Water, Electric & Solar Templates + "+ Add Field"',
      desc: '1-click load International Industry Section Templates (ITU-T, ISO 4064, IEC 60364, IEC 62446) and add unlimited custom fields via "+ Add Field".',
    },
    {
      title: 'Team Site Transfer ("Temp" -> Permanent "Ref: Old Site")',
      desc: 'Transfers start as "Temporary Assigned to - [New Site]" and promote to Permanent "[Team] (Ref: [Old Site])" once prior-site stock is cleared.',
    },
    {
      title: 'Site-Separated In-Hand ("Stock to Return - [Site]")',
      desc: 'Never sums transferred team stock across sites—old-site items stay under "Stock to Return - [Old Site]" and cannot be consumed on new-site projects.',
    },
    {
      title: 'Multi-Item Batch Team (RV) & Branch Returns (BRM)',
      desc: 'Add multiple items at once ("+ Add Item" / "+ Add All Held") with Good/Damaged conditions and return the entire batch on a single shared voucher.',
    },
    {
      title: '<200KB Auto-Compressed Item Photos & "Print with Image"',
      desc: 'Attach optional item photos (auto-compressed under 200KB), toggle "Print with Image" on any voucher, and see Item Code + Name in all dropdowns.',
    },
    {
      title: '1-Click Item Lifecycle & Forward Summary',
      desc: 'Click any item in Central Stock or Site Branch Stock to see every PO, site transfer, team issue, project usage, and wastage in one printable A4 view.',
    },
    {
      title: '3-Step Connection Progress with Session-Locked Team',
      desc: 'Locks Field Team & Working Area until page refresh so supervisors can enter 20+ daily Telecom/Water/Electric/Solar connections without re-selecting the team.',
    },
    {
      title: 'Auto Low-Stock Top Sorting in Requisitions',
      desc: 'Items running low at a requesting site automatically jump to the top of the requisition list with live "Site Avl:" and "Main:" balances.',
    },
    {
      title: 'Single-Shot Barcode Scan ("Scan Now")',
      desc: 'Camera scanner detects once and immediately hides to prevent duplicate rapid scans, with a 1-click "Scan Now" trigger for the next item.',
    },
    {
      title: 'Client FOC Auto-Locked Site Branch',
      desc: 'Selecting a project when receiving Client Free Stock automatically locks the Allocated Site Branch so FOC materials never leak to another branch.',
    },
    {
      title: 'Team Name Lock After Stock Issue & Admin Delete Gate',
      desc: 'Locks Team Name against renaming once stock is issued to protect historical vouchers, and requires Admin Password verification on every delete action.',
    },
    {
      title: 'Full Site Report (Team Subtotals + Grand Total)',
      desc: 'Generates a 2-part A4 PDF & Excel report showing each team’s individual subtotal followed by the consolidated site grand total.',
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
              onClick={() => handleSwitchToOverviewSection('intro-video')}
              className="flex items-center gap-1.5 hover:text-[#dc9750] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1"
            >
              <Play className="w-3.5 h-3.5 text-[#dc9750] fill-[#dc9750]" />
              <span>Intro Video</span>
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
              <span className="hidden sm:inline">Start {pricingMetrics.trialDays}-Day </span>
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
                  <span className="text-[#e8ac6e] font-extrabold">{pricingMetrics.trialDays}-Day Unrestricted Free Trial</span>
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
                    <span>Start {pricingMetrics.trialDays}-Day Free Trial</span>
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
                  <span className="tabular-nums">
                    ${pricingMetrics.monthlyPriceFormatted}/mo or ${pricingMetrics.annualPriceClean}/yr (Save {pricingMetrics.annualSavingsPercent}%)
                  </span>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span>100% Isolated Tenant Cloud</span>
                </div>

                {/* Official Landscape Introduction Video Showcase (Click-to-Play, No Auto-Play on Load) */}
                <div
                  id="intro-video"
                  className="relative z-10 mt-8 sm:mt-10 rounded-2xl sm:rounded-[26px] bg-gradient-to-b from-[#dc9750]/30 via-[#dc9750]/15 to-[#dc9750]/25 p-2 sm:p-3.5 border border-[#dc9750]/50 shadow-[0_24px_56px_-12px_rgba(8,11,22,0.78)] max-w-4xl mx-auto scroll-mt-24"
                >
                  <div className="bg-[#141a2e] rounded-xl sm:rounded-[20px] border border-[#dc9750]/30 overflow-hidden">
                    {/* Video Frame Top Header Bar */}
                    <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-[#192038] border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-left">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#dc9750] text-[#1e2640]">
                          <Play className="w-3.5 h-3.5 fill-[#1e2640]" />
                        </span>
                        <div>
                          <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
                            Official System Introduction Video
                          </span>
                          <span className="hidden sm:inline text-xs text-slate-300 ml-2">
                            · Complete Walkthrough of Apex Stock &amp; Site Operations
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#dc9750]/20 text-[#e8ac6e] border border-[#dc9750]/35">
                        16:9 HD Landscape
                      </span>
                    </div>

                    {/* 16:9 Landscape Video Container */}
                    <div className="relative aspect-video w-full bg-[#0d1222] overflow-hidden">
                      {!isIntroVideoPlaying ? (
                        <button
                          type="button"
                          onClick={() => setIsIntroVideoPlaying(true)}
                          className="group relative w-full h-full block cursor-pointer text-left focus:outline-none"
                          aria-label="Play Apex Stock Introduction Video"
                        >
                          {/* YouTube High-Res Landscape Thumbnail */}
                          <img
                            src="https://i.ytimg.com/vi/XlwzxdTIwjQ/maxresdefault.jpg"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.includes('hqdefault.jpg')) {
                                target.src = 'https://i.ytimg.com/vi/XlwzxdTIwjQ/hqdefault.jpg';
                              }
                            }}
                            alt="Apex Stock Official System Introduction Video"
                            className="w-full h-full object-cover opacity-85 group-hover:scale-[1.02] group-hover:opacity-95 transition-all duration-300"
                          />

                          {/* Subtle Dark Vignette Overlay for Contrast */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1526]/85 via-[#1e2640]/35 to-[#0f1526]/40 transition-opacity group-hover:opacity-75" />

                          {/* Center Play Button Action */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#dc9750] group-hover:bg-[#e8a864] text-[#1e2640] flex items-center justify-center shadow-[0_0_40px_rgba(220,151,80,0.65)] ring-4 ring-white/25 group-hover:scale-110 transition-all duration-200">
                              <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-[#1e2640] text-[#1e2640] ml-1" />
                            </div>
                            <span className="mt-3 sm:mt-4 px-4 py-1.5 rounded-full bg-[#161d33]/90 border border-[#dc9750]/50 text-white text-xs sm:text-sm font-extrabold tracking-wide shadow-lg">
                              Click to Play Introduction Video
                            </span>
                          </div>
                        </button>
                      ) : (
                        <iframe
                          className="w-full h-full border-0"
                          src="https://www.youtube.com/embed/XlwzxdTIwjQ?autoplay=1&rel=0&modestbranding=1&playsinline=1"
                          title="Apex Stock Official Introduction Video"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Executive Site Operations Preview Console */}
                <div className="relative z-10 mt-6 sm:mt-8 rounded-2xl sm:rounded-[24px] bg-[#dc9750]/20 p-2 sm:p-3 border border-[#dc9750]/40 shadow-[0_22px_50px_-12px_rgba(8,11,22,0.7)] max-w-5xl mx-auto">
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
                  Start with our unrestricted {pricingMetrics.trialDays}-day free trial ($0 today). Continue seamlessly with flexible monthly billing or our discounted annual VIP plan.
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
                    <div className="font-extrabold text-[#1e2640]">Test Everything for {pricingMetrics.trialDays} Days</div>
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
                {/* Card 1: Free Trial */}
                <div className="bg-white/95 hover:bg-white border border-[#dc9750]/50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col relative transition-all duration-200 shadow-[0_16px_40px_-12px_rgba(30,38,64,0.12)]">
                  <div className="mb-5 sm:mb-6">
                    <div className="text-xs font-bold text-[#526080]">Risk-Free Evaluation</div>
                    <h3 className="text-xl sm:text-2xl font-black text-[#1e2640] mt-1.5 sm:mt-2">
                      {pricingMetrics.trialDays}-Day Free Trial
                    </h3>
                    <p className="text-xs text-[#3a4769] mt-2 leading-relaxed font-medium">
                      Full unrestricted access to evaluate our multi-site inventory & dispatch platform with your team.
                    </p>
                  </div>

                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-[#1e2640] tabular-nums">$0</span>
                      <span className="text-xs font-bold text-[#526080]">/ {pricingMetrics.trialDays} days free</span>
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
                    <span>Start {pricingMetrics.trialDays}-Day Free Trial</span>
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
                      <span className="text-4xl sm:text-5xl font-black text-[#1e2640] tabular-nums">
                        ${pricingMetrics.monthlyPriceFormatted}
                      </span>
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
                    <span>Select Pro Monthly (${pricingMetrics.monthlyPriceFormatted}/mo)</span>
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
                        <span className="text-xs font-black text-emerald-400">
                          Save {pricingMetrics.annualSavingsPercent}%
                        </span>
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
                          ${pricingMetrics.annualPriceFormatted}
                        </span>
                        <span className="text-xs font-bold text-slate-300">/ year</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[#f2c391] text-[11px] font-bold tabular-nums">
                        <Zap className="w-3.5 h-3.5 text-[#dc9750] fill-[#dc9750]" />
                        <span>
                          Only ~${pricingMetrics.annualMonthlyEquivalentFormatted}/month · Save ${pricingMetrics.annualSavingsFormatted} every year
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3.5 mb-8 flex-1 text-xs text-slate-200 relative z-10">
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#dc9750] shrink-0 stroke-[2.5]" />
                        <span className="font-bold text-white">All Pro Monthly features included</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#dc9750] shrink-0 stroke-[2.5]" />
                        <span className="text-[#f2c391] font-semibold">
                          Save {pricingMetrics.annualSavingsPercent}% compared to monthly billing
                        </span>
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
                      <span>Select Pro Annual (Save {pricingMetrics.annualSavingsPercent}%)</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ==================== GLOBAL COMPETITOR & ALL-FEATURES COMPARISON MATRIX (BELOW PRICING CARDS) ==================== */}
              <div
                id="global-comparison"
                className="mt-14 sm:mt-20 rounded-2xl sm:rounded-[30px] bg-gradient-to-br from-[#161d33] via-[#1c2540] to-[#12182b] text-white border-2 border-[#dc9750] shadow-[0_28px_70px_-15px_rgba(15,20,38,0.65)] p-4 sm:p-8 lg:p-10 relative overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#dc9750] via-[#f3c896] to-[#dc9750]" />

                {/* Executive Header: The Core Message to the Customer */}
                <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-10">
                  <div className="inline-flex items-center gap-2 text-xs font-extrabold text-[#e8ac6e] tracking-wide mb-2.5">
                    <Crown className="w-4 h-4 text-[#dc9750] fill-[#dc9750]" />
                    <span>Global Market &amp; Feature-by-Feature Comparison ({comparisonRows.length} Built-In Capabilities)</span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl lg:text-[40px] font-black text-white tracking-tight leading-tight text-balance">
                    Why Pay <span className="text-rose-400 line-through decoration-2">$150 to $400+/Month</span> for Generic Retail Inventory Apps That Still Lack Field Site Control?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 mt-3 leading-relaxed max-w-3xl mx-auto font-medium">
                    Global systems like <strong className="text-white">Sortly, Zoho Inventory, inFlow, and Cin7 Core</strong> were designed for retail shops and e-commerce boxes—not for multi-site construction yards, telecom FTTH / water / electrical / solar projects, client free-issue stock (FOC), or site-separated field crew custody. Even after charging you thousands of dollars a year for extra users and warehouses, they still cannot track what is in your field teams&apos; hands today.{' '}
                    <strong className="text-[#f0c08d]">
                      Apex Stock gives you 100% of these specialized field &amp; warehouse features for one flat ${pricingMetrics.monthlyPriceFormatted}/mo (${pricingMetrics.annualPriceClean}/year).
                    </strong>
                  </p>
                </div>

                {/* Visual Annual Cost Shock Comparison Cards (Unlimited Users & Site Branches Flat Rate vs. Competitor Caps) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-3.5 mb-8 sm:mb-10">
                  {/* Apex Stock Winner Card */}
                  <div className="lg:col-span-1 rounded-2xl bg-gradient-to-b from-[#dc9750] to-[#c9823b] text-[#1e2640] p-4 shadow-lg border-2 border-white/80 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-[#1e2640]/80">
                        ★ Best Value Worldwide
                      </div>
                      <div className="text-base font-black text-[#1e2640] mt-0.5">Apex Stock VIP</div>
                      <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#1e2640] mt-2">
                        ${pricingMetrics.annualPriceClean}<span className="text-xs font-extrabold">/yr</span>
                      </div>
                      <div className="text-[11px] font-extrabold text-[#1e2640]/90 font-mono tabular-nums">
                        (~${pricingMetrics.annualMonthlyEquivalentFormatted}/mo or ${pricingMetrics.monthlyPriceFormatted} monthly)
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#1e2640]/20 text-[11px] font-bold text-[#1e2640] space-y-1">
                      <div>✓ Unlimited Users &amp; Branches</div>
                      <div>✓ All {comparisonRows.length} Field &amp; ERP Modules</div>
                      <div>✓ $0 Setup · {pricingMetrics.trialDays}-Day Free Trial</div>
                    </div>
                  </div>

                  {/* Sortly */}
                  <div className="rounded-2xl bg-[#232d4b]/90 border border-white/15 p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400">Visual Asset Tracker</div>
                      <div className="text-sm font-extrabold text-white mt-0.5">Sortly (Ultra / Ent.)</div>
                      <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-rose-400 mt-2">
                        ~$1,788+<span className="text-xs font-semibold text-slate-300">/yr</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono tabular-nums">($149 – $299+ / month)</div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-slate-300 space-y-1">
                      <div className="flex items-start gap-1.5"><span className="text-red-500 font-black">✗</span><span>Capped at 5–8 users (+$20/mo/seat)</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-red-500 font-black">✗</span><span>No Crew In-Hand or Client FOC</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-red-500 font-black">✗</span><span>No Industry Templates or Wastage</span></div>
                    </div>
                  </div>

                  {/* Zoho Inventory */}
                  <div className="rounded-2xl bg-[#232d4b]/90 border border-white/15 p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400">Retail / E-Commerce App</div>
                      <div className="text-sm font-extrabold text-white mt-0.5">Zoho Inventory</div>
                      <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-rose-400 mt-2">
                        ~$1,548+<span className="text-xs font-semibold text-slate-300">/yr</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono tabular-nums">($129 – $249+ / month)</div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-slate-300 space-y-1">
                      <div className="flex items-start gap-1.5"><span className="text-red-500 font-black">✗</span><span>Capped at 2–5 users &amp; warehouses</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-red-500 font-black">✗</span><span>Built for online shops, not sites</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-red-500 font-black">✗</span><span>No Main/Sub FOC or Team custody</span></div>
                    </div>
                  </div>

                  {/* inFlow / Cin7 Core */}
                  <div className="rounded-2xl bg-[#232d4b]/90 border border-white/15 p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400">Wholesale Warehouse</div>
                      <div className="text-sm font-extrabold text-white mt-0.5">inFlow / Cin7 Core</div>
                      <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-rose-400 mt-2">
                        ~$2,388+<span className="text-xs font-semibold text-slate-300">/yr</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono tabular-nums">($199 – $399+ / month)</div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-slate-300 space-y-1">
                      <div className="flex items-start gap-1.5"><span className="text-red-500 font-black">✗</span><span>2–5 user cap (+$39/mo/user &amp; branch)</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-red-500 font-black">✗</span><span>No Field Crew issue/return loop</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-red-500 font-black">✗</span><span>No Custom PDF stationery upload</span></div>
                    </div>
                  </div>

                  {/* Legacy Construction ERP */}
                  <div className="rounded-2xl bg-[#232d4b]/90 border border-white/15 p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400">Heavy Legacy ERP</div>
                      <div className="text-sm font-extrabold text-white mt-0.5">Procore / SAP / NetSuite</div>
                      <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-rose-400 mt-2">
                        $10,000+<span className="text-xs font-semibold text-slate-300">/yr</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono tabular-nums">(+ $5,000+ Consultant Setup)</div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-slate-300 space-y-1">
                      <div className="flex items-start gap-1.5"><span className="text-red-500 font-black">✗</span><span>$75–$150+/mo per user &amp; branch license</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-red-500 font-black">✗</span><span>Paid consultants for every change</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-red-500 font-black">✗</span><span>Locked into multi-year contracts</span></div>
                    </div>
                  </div>
                </div>

                {/* Interactive Category Filter Buttons for the Feature Matrix */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/15">
                  <div className="text-left">
                    <h4 className="text-sm sm:text-base font-black text-white">
                      Complete {comparisonRows.length}-Point Feature &amp; Micro-Capability Comparison
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Filter by operational area or inspect all {comparisonRows.length} large and small specialized features side-by-side:
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'all', label: `All Features (${comparisonRows.length})` },
                      { id: 'pricing', label: 'Pricing & Scale' },
                      { id: 'warehouse', label: 'Warehouse, PO & FOC' },
                      { id: 'field', label: 'Site & Field Crews' },
                      { id: 'projects', label: 'Projects & Industry Templates' },
                      { id: 'security', label: 'ISO Formats & Security' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() =>
                          setComparisonCategory(
                            tab.id as 'all' | 'pricing' | 'warehouse' | 'field' | 'projects' | 'security'
                          )
                        }
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
                          comparisonCategory === tab.id
                            ? 'bg-[#dc9750] text-[#1e2640] shadow-xs'
                            : 'bg-[#232d4b] hover:bg-[#2c385c] text-slate-200 border border-white/10'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Responsive Comparison Table */}
                <div className="overflow-x-auto rounded-2xl border border-[#dc9750]/45 bg-[#12182b] shadow-inner">
                  <table className="w-full text-left border-collapse min-w-[880px]">
                    <thead>
                      <tr className="bg-[#1e2640] border-b border-[#dc9750]/40 text-[11px] font-black text-slate-200">
                        <th className="py-3.5 px-4 w-[34%]">
                          System Capability / Specialized Feature ({filteredComparisonRows.length})
                        </th>
                        <th className="py-3.5 px-4 w-[18%] bg-[#dc9750] text-[#1e2640] font-black">
                          <div className="flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5 fill-[#1e2640]" />
                            <span>Apex Stock (${pricingMetrics.monthlyPriceFormatted}/mo)</span>
                          </div>
                        </th>
                        <th className="py-3.5 px-3.5 w-[16%] text-slate-200">
                          Sortly ($149+/mo)
                        </th>
                        <th className="py-3.5 px-3.5 w-[16%] text-slate-200">
                          Zoho Inventory ($99+/mo)
                        </th>
                        <th className="py-3.5 px-3.5 w-[16%] text-slate-200">
                          inFlow / Cin7 ($199+/mo)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-xs">
                      {filteredComparisonRows.map((row, idx) => {
                        const renderCompetitorCell = (val: string) => {
                          const trimmed = val.trim();
                          if (trimmed.startsWith('✕') || trimmed.startsWith('✗') || trimmed.startsWith('❌')) {
                            const textPart = trimmed.replace(/^[✕✗❌]\s*/, '');
                            return (
                              <div className="flex items-start gap-2">
                                <span
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-red-500/25 border border-red-500/60 text-[#ff3b3b] font-black text-xs leading-none shrink-0 mt-0.5 shadow-xs"
                                  aria-label="Missing or Capped Feature"
                                >
                                  ✗
                                </span>
                                <span className="text-slate-200 font-semibold leading-snug">{textPart}</span>
                              </div>
                            );
                          }
                          if (trimmed.startsWith('◐')) {
                            const textPart = trimmed.replace(/^◐\s*/, '');
                            return (
                              <div className="flex items-start gap-2">
                                <span
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-400 font-black text-xs leading-none shrink-0 mt-0.5"
                                  aria-label="Partial Support"
                                >
                                  ◐
                                </span>
                                <span className="text-slate-300 font-medium leading-snug">{textPart}</span>
                              </div>
                            );
                          }
                          if (trimmed.startsWith('✓')) {
                            const textPart = trimmed.replace(/^✓\s*/, '');
                            return (
                              <div className="flex items-start gap-2">
                                <span
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-400/50 text-emerald-400 font-black text-xs leading-none shrink-0 mt-0.5"
                                  aria-label="Included"
                                >
                                  ✓
                                </span>
                                <span className="text-slate-200 font-medium leading-snug">{textPart}</span>
                              </div>
                            );
                          }
                          return <span className="text-slate-200 font-semibold leading-snug">{val}</span>;
                        };

                        return (
                          <tr
                            key={row.feature}
                            className={`transition-colors ${
                              row.isSpecialHighlight
                                ? 'bg-[#1c2644]/90 hover:bg-[#232f52]'
                                : idx % 2 === 0
                                ? 'bg-[#141b30] hover:bg-[#1c2540]'
                                : 'bg-[#171f36] hover:bg-[#1c2540]'
                            }`}
                          >
                            <td className="py-3 px-4 align-top">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-[#e8ac6e] mb-0.5">
                                <span>{row.categoryLabel}</span>
                                {row.isSpecialHighlight && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-emerald-400 font-extrabold">★ Exclusive Advantage</span>
                                  </>
                                )}
                              </div>
                              <div className="font-extrabold text-white text-xs leading-snug">
                                {row.feature}
                              </div>
                              <div className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                                {row.detail}
                              </div>
                            </td>

                            {/* Apex Stock Highlighted Column */}
                            <td className="py-3 px-4 align-middle bg-[#dc9750]/14 border-x border-[#dc9750]/35 font-extrabold text-emerald-300 text-xs">
                              {row.apex}
                            </td>

                            {/* Sortly */}
                            <td className="py-3 px-3.5 align-middle text-slate-300 font-medium text-[11px]">
                              {renderCompetitorCell(row.sortly)}
                            </td>

                            {/* Zoho */}
                            <td className="py-3 px-3.5 align-middle text-slate-300 font-medium text-[11px]">
                              {renderCompetitorCell(row.zoho)}
                            </td>

                            {/* inFlow / Cin7 */}
                            <td className="py-3 px-3.5 align-middle text-slate-300 font-medium text-[11px]">
                              {renderCompetitorCell(row.inflowCin7)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 12 Small-Yet-Special Micro-Features Spotlight Grid ("Podi Podi Unata Wisesa Features") */}
                <div className="mt-8 sm:mt-10 pt-7 border-t border-white/15">
                  <div className="text-center max-w-3xl mx-auto mb-6">
                    <div className="text-xs font-extrabold text-[#e8ac6e] mb-1">
                      Thoughtful Field-Engineered Details You Won&apos;t Find Anywhere Else
                    </div>
                    <h4 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                      12 Small-Yet-Special Features Built for Real Daily Site Challenges
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Every micro-feature in Apex Stock was designed around real warehouse storekeepers, site supervisors, and field crew leaders:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
                    {microFeaturesSpotlight.map((mf, i) => (
                      <div
                        key={mf.title}
                        className="rounded-xl bg-[#222c4a]/90 border border-[#dc9750]/30 p-3.5 text-left hover:border-[#dc9750] transition"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-mono font-black text-[#dc9750] tabular-nums">
                            {String(i + 1).padStart(2, '0')}.
                          </span>
                          <h5 className="text-xs font-extrabold text-white leading-snug">
                            {mf.title}
                          </h5>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {mf.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Decision Banner inside Comparison */}
                <div className="mt-8 rounded-2xl bg-gradient-to-r from-[#dc9750] via-[#e8a864] to-[#dc9750] text-[#1e2640] p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                  <div className="text-center md:text-left">
                    <div className="text-sm sm:text-lg font-black text-[#1e2640]">
                      Get Every Single Feature Above for $0 Today ({pricingMetrics.trialDays}-Day Unrestricted Free Trial)
                    </div>
                    <div className="text-xs font-bold text-[#1e2640]/90 mt-0.5">
                      Then just <span className="underline font-black">${pricingMetrics.monthlyPriceFormatted}/month</span> or <span className="underline font-black">${pricingMetrics.annualPriceClean}/year</span> for your entire company — Unlimited Users, Unlimited Sites &amp; Zero Per-Seat Fees.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsSignupOpen(true)}
                      className="px-5 py-3 rounded-xl bg-[#1e2640] hover:bg-[#141a2e] text-[#dc9750] font-black text-xs flex items-center gap-2 shadow-md transition cursor-pointer whitespace-nowrap"
                    >
                      <span>Start Your {pricingMetrics.trialDays}-Day Free Trial Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenGuideTab}
                      className="px-4 py-3 rounded-xl bg-white/90 hover:bg-white text-[#1e2640] font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>View Full User Guide</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Method Notice */}
              <div className="mt-10 max-w-2xl mx-auto bg-white/95 border border-[#dc9750]/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#2d3859] text-center sm:text-left shadow-sm">
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
                    href="mailto:support@apexstox.com"
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-100 hover:text-[#dc9750] transition-colors"
                  >
                    <span>Contact Support: support@apexstox.com</span>
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
