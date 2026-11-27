import React, { useState, useEffect } from 'react';
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
  Radio,
  HardHat,
  Droplets,
  Warehouse,
  BookOpen,
  Play,
  ArrowUp,
  Infinity as InfinityIcon,
  Video,
  AlertTriangle,
  Sun,
  Hammer,
  LayoutGrid,
  Trees,
  Ruler,
  Wind,
  Camera,
  Printer,
  RotateCcw,
  ClipboardCheck,
  ShieldAlert,
} from 'lucide-react';
import { TenantSignupModal } from './TenantSignupModal';
import { SystemUserGuideView } from './SystemUserGuideView';
import { LegalPoliciesView } from './LegalPoliciesView';
import { LegalDocId } from './legalPoliciesData';
import { useStock } from '../../context/StockContext';
import {
  SubscriptionPaymentCurrency,
  computePlatformPricingMetrics,
  LandingVideoTab,
  normalizeLandingVideos,
  extractYouTubeVideoInfo,
} from '../../types';
import { CurrencyRateSelector } from '../subscription/CurrencyRateSelector';
import {
  type FxRatesMap,
  convertUsdToCurrency,
  fetchLiveMultiCurrencyRates,
  formatConvertedCurrency,
  getCurrencyMeta,
  readCachedFxSnapshot,
} from '../../utils/subscriptionCurrencyUtils';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenSignup?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  const { platformPricing } = useStock();
  const pricingMetrics = computePlatformPricingMetrics(platformPricing);

  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<SubscriptionPaymentCurrency>('USD');
  const [fxRates, setFxRates] = useState<FxRatesMap>(() => readCachedFxSnapshot().rates);
  const [isLiveFx, setIsLiveFx] = useState<boolean>(() => readCachedFxSnapshot().isLive);
  const [isRefreshingFx, setIsRefreshingFx] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    fetchLiveMultiCurrencyRates({ forceRefresh: true }).then((snap) => {
      if (!mounted) return;
      setFxRates(snap.rates);
      setIsLiveFx(snap.isLive);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleRefreshLandingFx = async () => {
    setIsRefreshingFx(true);
    try {
      const snap = await fetchLiveMultiCurrencyRates({ forceRefresh: true });
      setFxRates(snap.rates);
      setIsLiveFx(snap.isLive);
    } finally {
      setIsRefreshingFx(false);
    }
  };

  const displayCurrencyMeta = getCurrencyMeta(displayCurrency);
  const displayMonthlyPrice = formatConvertedCurrency(
    convertUsdToCurrency(pricingMetrics.monthlyPrice, displayCurrency, fxRates),
    displayCurrency
  );
  const displayAnnualPrice = formatConvertedCurrency(
    convertUsdToCurrency(pricingMetrics.annualPrice, displayCurrency, fxRates),
    displayCurrency
  );
  const displayAnnualMonthlyEqv = formatConvertedCurrency(
    convertUsdToCurrency(pricingMetrics.annualMonthlyEquivalent, displayCurrency, fxRates),
    displayCurrency
  );
  const displayAnnualSavings = formatConvertedCurrency(
    convertUsdToCurrency(pricingMetrics.annualSavingsAmount, displayCurrency, fxRates),
    displayCurrency
  );
  const displayExtraSiteMonthly = formatConvertedCurrency(
    convertUsdToCurrency(pricingMetrics.extraSiteMonthlyPrice, displayCurrency, fxRates),
    displayCurrency
  );

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [activeLandingTab, setActiveLandingTab] = useState<
    'overview' | 'guide' | 'privacy' | 'refund' | 'terms'
  >(() => {
    if (typeof window !== 'undefined') {
      const pageParam = new URLSearchParams(window.location.search).get('page')?.trim().toLowerCase();
      const hashParam = window.location.hash.replace('#', '').trim().toLowerCase();
      const target = pageParam || hashParam;
      if (target === 'privacy' || target === 'privacy-policy') return 'privacy';
      if (target === 'refund' || target === 'refund-policy') return 'refund';
      if (target === 'terms' || target === 'terms-and-conditions') return 'terms';
      if (target === 'guide' || target === 'user-guide') return 'guide';
    }
    return 'overview';
  });
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [selectedIndustryIdx, setSelectedIndustryIdx] = useState<number>(0);
  const [isIntroVideoPlaying, setIsIntroVideoPlaying] = useState<boolean>(false);
  const landingVideos: LandingVideoTab[] = normalizeLandingVideos(platformPricing.landingVideos);
  const [selectedVideoTabId, setSelectedVideoTabId] = useState<string>(
    () => normalizeLandingVideos(platformPricing.landingVideos)[0]?.id || 'vid-introduction'
  );
  const activeVideoTab =
    landingVideos.find((v) => v.id === selectedVideoTabId) || landingVideos[0];
  const activeYoutubeInfo = extractYouTubeVideoInfo(activeVideoTab?.youtubeUrl);
  const [comparisonCategory, setComparisonCategory] = useState<
    'all' | 'pricing' | 'warehouse' | 'field' | 'projects' | 'security'
  >('all');

  const syncPageParamInUrl = (slug: string | null) => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (slug) {
        url.searchParams.set('page', slug);
      } else {
        url.searchParams.delete('page');
      }
      window.history.replaceState({}, document.title, url.toString());
    } catch {
      // ignore history errors
    }
  };

  const handleOpenGuideTab = () => {
    setActiveLandingTab('guide');
    syncPageParamInUrl('user-guide');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPolicyTab = (policy: LegalDocId) => {
    const slugMap: Record<LegalDocId, string> = {
      privacy: 'privacy-policy',
      refund: 'refund-policy',
      terms: 'terms-and-conditions',
    };
    setActiveLandingTab(policy);
    syncPageParamInUrl(slugMap[policy]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchToOverviewSection = (sectionId?: string) => {
    setActiveLandingTab('overview');
    syncPageParamInUrl(null);
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

  // Pain-to-Solution Challenges ("Sound Familiar?")
  const painToSolutionItems = [
    {
      icon: ShieldAlert,
      painTitle: 'Unexplained Material & Stock Loss',
      painDesc:
        'Materials disappearing between central store, site yards, and field crews with no clear custody trail.',
      solutionLabel: '2-Tier / 3-Tier Custody Ledger',
      solutionDesc:
        'Track every unit in real time across Central HQ, Regional & Sub-Sites, and Crew In-Hand balances with signed transfer notes.',
    },
    {
      icon: AlertTriangle,
      painTitle: 'Hidden Wastage & Offcut Costs',
      painDesc:
        'No separation between actual installed quantities and wastage/scrap, eating into project profit margins.',
      solutionLabel: 'Installed Qty + Wastage Qty',
      solutionDesc:
        'Log Installed Qty separately from Wastage/Offcuts per item with live Team In-Hand validation and per-project wastage reports.',
    },
    {
      icon: Gift,
      painTitle: 'Client Free-Issue (FOC) & Audit Headaches',
      painDesc:
        'Struggling to reconcile client-supplied materials and returnable balances during final billing or audits.',
      solutionLabel: '5-Stage Client FOC Reconciliation',
      solutionDesc:
        'Follows Receipt -> Site -> Team -> Usage & Wastage -> Returnable Client Balance with "ALL AREAS" tracking & 1-click A4 PDF audits.',
    },
    {
      icon: FileSpreadsheet,
      painTitle: 'Chaotic Excel, WhatsApp & Paper Slips',
      painDesc:
        'Lost handwritten vouchers, duplicate entries, and zero real-time visibility across multiple active sites.',
      solutionLabel: 'ISO 9001:2015 Digital Control',
      solutionDesc:
        'Auto-numbered RN, IN, PU, RV, BRM & GRN vouchers, single-shot barcode scanning, and Admin Password delete locks.',
    },
  ];

  // Top Featured Core Utility & Infrastructure Sectors (4 Prominent Cards)
  const coreUtilityIndustries = [
    {
      icon: Radio,
      badge: '01 · Core Utility & Telecom',
      title: 'Telecom FTTH, OSP & Tower Projects',
      fitLabel: 'Client FOC tracking · Exchange/LEA fields · Cable usage + wastage',
      desc: 'Track fiber cable drums, splice closures, drop cables, and network hardware across regional and sub-site yards with strict Client FOC section filtering.',
      features: [
        'Main Project -> New Connections & FOC Pool',
        'Installed Qty + Cable/Drop Wastage Tracking',
        'Team In-Hand Ledger & Upstream Returns',
      ],
    },
    {
      icon: Zap,
      badge: '02 · Core Utility & MEP',
      title: 'Electrical & Power Distribution (MEP)',
      fitLabel: 'HV/LV cable & switchgear issue · Crew custody · Tool returns',
      desc: 'Control transformers, switchgear, armored cables, and testing tools issued to field crews with real-time branch balances and IEC section templates.',
      features: [
        'Material Consumables + Testing Tool Custody',
        '2-Tier or 3-Tier Branch-Locked Stock Flow',
        'Supplier PO, GRN & Outward Gate Passes',
      ],
    },
    {
      icon: Sun,
      badge: '03 · Clean Energy EPC',
      title: 'Solar PV & Net-Metering Installations',
      fitLabel: 'Panels/inverters dispatch · Site/sub-site flow · Net-metering logs',
      desc: 'Manage solar panels, inverters, DC cables, and mounting rails across multi-site installation crews with serialized notes and completion audits.',
      features: [
        'Solar PV Section Fields & BOM Auto-Fill',
        'Crew-Wise Usage, Offcuts & Balance Audits',
        'Printable ISO 9001:2015 A4 PDF Vouchers',
      ],
    },
    {
      icon: Droplets,
      badge: '04 · Municipal Infrastructure',
      title: 'Water Supply, Pipeline & Utility Projects',
      fitLabel: 'HDPE/DI pipe issue · Installed vs. wastage · Surplus BRM returns',
      desc: 'Reconcile pipes, valves, meters, and jointing kits from depot to trench teams, separating installed lengths from wastage and returning surplus upstream.',
      features: [
        'Pipeline & New Connection Section Templates',
        'Multi-Item Upstream Returns (RV & BRM)',
        'Client FOC vs. Company Stock Separation',
      ],
    },
  ];

  // Specialty & Finishing Contracting Trades (Grouped Right Below with Exact Fit Micro-Labels)
  const specialtyTradeIndustries = [
    {
      icon: Hammer,
      num: '05',
      title: 'Pantry Cupboards & Interior Joinery',
      fitLabel: 'Boards, hardware, offcuts & site/unit installs',
    },
    {
      icon: LayoutGrid,
      num: '06',
      title: 'Ceiling Installation — Gypsum, PVC, T-Grid & Acoustic',
      fitLabel: 'Sheets, framing, wastage & returns',
    },
    {
      icon: Trees,
      num: '07',
      title: 'Landscaping, Hardscaping & Irrigation',
      fitLabel: 'Materials, plants/blocks, site stock & wastage',
    },
    {
      icon: Ruler,
      num: '08',
      title: 'Aluminum Fabrication & Glazing',
      fitLabel: 'Profiles, glass, consumables & scrap tracking',
    },
    {
      icon: Wind,
      num: '09',
      title: 'HVAC / Air Conditioning & Refrigeration',
      fitLabel: 'Units, copper/insulation & crew dispatch',
    },
    {
      icon: Camera,
      num: '10',
      title: 'CCTV, Security & Fire Alarm Systems',
      fitLabel: 'Cables, devices & multi-site installation',
    },
    {
      icon: HardHat,
      num: '11',
      title: 'Civil, Road & Municipal Maintenance',
      fitLabel: 'Depot-to-site materials, tools & daily progress',
    },
  ];

  const faqs = [
    {
      q: `How does the ${pricingMetrics.trialDays}-Day Free Trial work?`,
      a: `You can register your company workspace in under 60 seconds with zero commitment. No credit card is required to sign up. You get 100% full access to all enterprise modules—including 1 Central HQ Warehouse + ${pricingMetrics.includedSiteBranches} Site Branches, Unlimited Users, Unlimited Field Teams, client-supplied stock tracking, supplier purchase orders, and PDF voucher printing for a full ${pricingMetrics.trialDays} days.`,
    },
    {
      q: `What happens after the ${pricingMetrics.trialDays}-day free trial?`,
      a: `After ${pricingMetrics.trialDays} days, you can choose between our Pro Monthly plan ($${pricingMetrics.monthlyPriceFormatted}/mo) or our cost-saving Pro Annual VIP plan ($${pricingMetrics.annualPriceClean}/yr — Save ${pricingMetrics.annualSavingsPercent}%). Every plan includes Unlimited Users, Unlimited Field Teams, 1 Central HQ + ${pricingMetrics.includedSiteBranches} Site Branches, and you can add extra Site Branches anytime for +$${pricingMetrics.extraSiteMonthlyPriceClean}/mo per site.`,
    },
    {
      q: 'How does Client-Supplied Free Stock (FOC) & 5-Stage Reconciliation work?',
      a: 'Register the client in the Master Client Register and log their FOC Receipt against a Project (assigned to a single Site Branch OR "🌐 ALL AREAS (All Site Branches)" for island-wide contracts). Both Central Stock and Site Branch Stock highlight these goods with a "Central FOC" badge and follow the clear 5-Stage Reconciliation Flow: 1. Central FOC Receipt -> 2. Site Issue -> 3. Team Issue -> 4. Usage & Wastage -> 5. Returnable Client Balance on Project Completion—complete with color-coded Main Project cards, per-Sub-Project breakdowns, and 1-click A4/PDF individual & consolidated project reports.',
    },
    {
      q: 'How does the "Main Project -> Under New Connections" & "ALL AREAS" structure work?',
      a: 'Across Telecom, Water, Electrical, and Solar sections, you can register a Main Project and nest New Connections underneath it. When recording Daily Progress, only FOC stock allocated to that active section appears in the FOC dropdown—zero cross-section confusion. Plus, selecting "🌐 ALL AREAS (All Site Branches)" on a Project lets any site branch request and consume that project’s FOC stock with consolidated cross-branch reporting.',
    },
    {
      q: 'How does the 3-Tier Hierarchy (Central HQ -> Regional Site -> Optional Sub-Site -> Teams) work?',
      a: 'Under your Central Main Warehouse, you can register Regional Site Branches and optionally nest Sub-Site Branches underneath any Regional Site. Field Teams can be created and managed inside BOTH Regional Site Branches and Sub-Site Branches normally. Parent Regional Branches supply child Sub-Sites either directly via "Issue Stock to Sub-Site" in Site Branch Stock or by approving Stock Requisitions routed upstream from the Sub-Site ("Parent Avl:" live balances), and Sub-Site Branch Returns (BRM) route upstream back to the Parent Regional Site.',
    },
    {
      q: 'How does Super Admin First-Name Accountability Login work?',
      a: 'During workspace registration, entering the Super Admin’s real Personal Full Name is mandatory (generic labels like "Admin" or "Super Admin" are rejected). Whenever someone logs in using the Super Admin password, they enter their personal name—the system verifies their First Name against the registered Super Admin profile and stamps every Audit Trail entry and Voucher as "[Name] (as Super Admin)" for clear individual accountability.',
    },
    {
      q: 'How is our company data kept separate from other clients (Multi-Tenant Security)?',
      a: 'ApexStox runs on a strict multi-tenant cloud architecture on Secure Cloud. Each registered company receives an isolated cryptographic tenant partition (tenantId). Company A can never view, search, or access Company B records.',
    },
    {
      q: 'Can site branch supervisors view or issue materials from other branches?',
      a: 'No. When you create a user account assigned to a specific Regional or Sub-Site Branch, their workspace locks to that branch (and Parent Regional Branch Admins hold oversight to supply and approve requisitions for their own nested Sub-Site Branches only).',
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
    manual: string;
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
      manual: '✕ Hidden stock loss, rework & admin hours',
      sortly: '$149 – $299+ / mo',
      zoho: '$99 – $249+ / mo',
      inflowCin7: '$149 – $399+ / mo',
      legacyErp: '$800 – $2,500+ / mo',
    },
    {
      category: 'pricing',
      categoryLabel: 'Pricing & Scale',
      feature: `Annual Total Cost (Unlimited Users, Unlimited Teams & ${pricingMetrics.includedSiteBranches} Site Branches)`,
      detail: `Flat yearly rate for your entire company with Unlimited Users, Unlimited Field Teams & 1 Central HQ + ${pricingMetrics.includedSiteBranches} Regional Site Branches (expandable at +$${pricingMetrics.extraSiteMonthlyPriceClean}/mo per extra site) — vs. spreadsheet errors & competitor user/branch caps.`,
      isSpecialHighlight: true,
      apex: `✓ $${pricingMetrics.annualPriceClean} / year Flat (Unlimited Users & Teams · ${pricingMetrics.includedSiteBranches} Sites Included)`,
      manual: '✕ Lost stock, unbilled wastage & hours of manual reconciliation',
      sortly: '✕ $1,788 – $3,588+ / year (Capped at 5–8 users; +$240/yr per extra user)',
      zoho: '✕ $1,548 – $2,988+ / year (Capped at 2–5 users & limited warehouses)',
      inflowCin7: '✕ $2,148 – $4,788+ / year (Capped at 2–5 users; paid per-location add-ons)',
      legacyErp: '✕ $10,000+ / year (+$900–$1,800/yr per user + paid branch licenses)',
    },
    {
      category: 'pricing',
      categoryLabel: 'Pricing & Scale',
      feature: 'Unlimited System Users & Staff Logins',
      detail: 'Create accounts for all HQ Storekeepers, Branch Admins, and Site Supervisors without paying per-seat fees.',
      apex: '✓ Unlimited Users ($0 extra)',
      manual: '✕ Broken Excel file copies & WhatsApp chats',
      sortly: '✕ 5–8 Users max (Extra seats $20+/mo each)',
      zoho: '✕ 2–5 Users max (Extra seats charged per user)',
      inflowCin7: '✕ 2–5 Users max (Extra seats $39+/mo each)',
      legacyErp: '✕ $75 – $150+ per user/month',
    },
    {
      category: 'pricing',
      categoryLabel: 'Pricing & Scale',
      feature: `2-Tier or 3-Tier Branches (${pricingMetrics.includedSiteBranches} Sites + HQ Included + $${pricingMetrics.extraSiteMonthlyPriceClean}/mo Extra)`,
      detail: `Choose 2-Tier (Store -> Site/Crew) or 3-Tier (Central HQ -> Regional -> Sub-Site -> Crew) with 1 HQ + ${pricingMetrics.includedSiteBranches} Sites included and expandable at +$${pricingMetrics.extraSiteMonthlyPriceClean}/mo per extra site.`,
      isSpecialHighlight: true,
      apex: `✓ 2-Tier & 3-Tier (${pricingMetrics.includedSiteBranches} Sites + HQ · +$${pricingMetrics.extraSiteMonthlyPriceClean}/mo extra)`,
      manual: '✕ Separate confusing tabs per site & zero custody chain',
      sortly: '✕ Folder-based only (No branch RBAC)',
      zoho: '✕ Limited warehouses per tier (Extra locations paid)',
      inflowCin7: '✕ Paid per-location add-on fee ($99+/mo)',
      legacyErp: '✕ Paid multi-location licensing',
    },
    {
      category: 'pricing',
      categoryLabel: 'Pricing & Scale',
      feature: 'Unlimited Items, Barcodes, Orders & Monthly Transactions',
      detail: 'Zero artificial caps on SKU count, monthly purchase orders, dispatches, or barcode scans.',
      apex: '✓ 100% Unlimited',
      manual: '✕ Slow spreadsheets & formula crashes',
      sortly: '✕ Capped by item/entry tier',
      zoho: '✕ Capped by monthly order volume',
      inflowCin7: '◐ Capped on lower plans',
      legacyErp: '✓ Unlimited (High contract cost)',
    },

    // 2. CENTRAL WAREHOUSE, PO/GRN/RTV & ITEM LIFECYCLE TRACEABILITY
    {
      category: 'warehouse',
      categoryLabel: 'Warehouse, PO & FOC',
      feature: '1-Click Central Stock End-to-End & Project A4/PDF Reports (Individual + Consolidated)',
      detail: 'Select any item in Central Stock to trace every PO/Manual/FOC receipt, site splits, team issues, usage/wastage, and print both Per-Item A4/PDF reports and Consolidated All-Items Project Reports.',
      isSpecialHighlight: true,
      apex: '✓ Per-Item + Consolidated Project A4/PDF',
      manual: '✕ Hours of manual VLOOKUP & copy-paste',
      sortly: '✕ Not Available',
      zoho: '✕ Basic stock card only (No team/site chain)',
      inflowCin7: '✕ Warehouse level only',
      legacyErp: '◐ Requires custom BI report coding',
    },
    {
      category: 'warehouse',
      categoryLabel: 'Warehouse, PO & FOC',
      feature: 'Site Branch "Central FOC" Badge & Forward 5-Stage Traceability (Printable A4/PDF)',
      detail: 'Site Branch Stock visually highlights Central-received free stock with a distinct "Central FOC" badge/row accent and tracks Inbound -> Site Issue -> Team Issue -> Usage & Wastage -> Balance.',
      isSpecialHighlight: true,
      apex: '✓ "Central FOC" Highlight + 5-Stage Print',
      manual: '✕ Mixes client free stock with purchased stock',
      sortly: '✕ Not Available',
      zoho: '✕ Not Available',
      inflowCin7: '✕ Not Available',
      legacyErp: '✕ Not Available',
    },
    {
      category: 'warehouse',
      categoryLabel: 'Warehouse, PO & FOC',
      feature: '5-Stage Client FOC Reconciliation (Auto Branch Lock + "🌐 ALL AREAS" Multi-Site)',
      detail: 'Standard 5-Stage FOC Flow (Central Receipt -> Site Issue -> Team Issue -> Usage & Wastage -> Client Returnable Balance) with color-coded Main Project cards, per-Sub-Project flows, and "ALL AREAS" island-wide contract support.',
      isSpecialHighlight: true,
      apex: '✓ 5-Stage FOC Flow + "ALL AREAS" Multi-Site',
      manual: '✕ Billing disputes & missing client return balances',
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
      manual: '✕ Manual cell edits with no audit history',
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
      manual: '✕ Separate Word/Excel POs & paper GRNs',
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
      manual: '✕ Paper gate passes easily misplaced',
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
      manual: '✕ Forgotten broken tools & unrecorded scrap',
      sortly: '✕ Manual folder move only',
      zoho: '✕ Manual adjustment only',
      inflowCin7: '✕ Manual adjustment only',
      legacyErp: '◐ Complex scrap module',
    },
    {
      category: 'warehouse',
      categoryLabel: 'Warehouse, PO & FOC',
      feature: 'Item Photos (<200KB), PO/Return Dropdown Thumbnails & "Print with Image"',
      detail: 'Auto-compress item photos under 200KB, see item thumbnails directly inside Purchase Order (PO), Team/Branch Return (RV/BRM) & Requisition dropdowns, and toggle "Print with Image" on vouchers/reports.',
      isSpecialHighlight: true,
      apex: '✓ PO/Return Thumbnails + "Print with Image"',
      manual: '✕ Text-only rows or broken spreadsheet images',
      sortly: '◐ Photos supported (No PO/Return print toggle)',
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
      manual: '✕ WhatsApp voice notes & paper request chits',
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
      manual: '✕ Stockouts discovered only when crews stop work',
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
      manual: '✕ Phone calls & scribbled quantity edits',
      sortly: '✕ Not Available',
      zoho: '✕ Manual edit required',
      inflowCin7: '✕ Manual edit required',
      legacyErp: '✕ Manual edit required',
    },
    {
      category: 'field',
      categoryLabel: 'Site & Field Crews',
      feature: 'Live Field Crew In-Hand Stock Custody Ledger (TSR Audit Reports)',
      detail: 'Eliminates unexplained stock loss: track exact balances held by every Field Crew right now (Issued - Installed - Wastage - Returned) with printable TSR custody reports.',
      isSpecialHighlight: true,
      apex: '✓ Real-Time Crew In-Hand Ledger',
      manual: '✕ Zero visibility into what crews hold on site',
      sortly: '✕ No field crew custody tracking',
      zoho: '✕ Designed for customers, not field crews',
      inflowCin7: '✕ No crew custody balance',
      legacyErp: '✕ Requires custom sub-warehouse per crew',
    },
    {
      category: 'field',
      categoryLabel: 'Site & Field Crews',
      feature: 'Upstream Returns Routing: Field Crew -> Sub-Site -> Parent Regional -> Central HQ',
      detail: 'Nest Sub-Site Branches under any Regional Site; supply via direct "Issue Stock to Sub-Site" or parent-routed Requisitions, and route unused or damaged returns cleanly upstream tier-by-tier.',
      isSpecialHighlight: true,
      apex: '✓ Full Upstream BRM & RV Return Routing',
      manual: '✕ Returned materials vanish or get double-counted',
      sortly: '✕ Basic folders (No dispatch/return chain)',
      zoho: '✕ Flat warehouses only',
      inflowCin7: '✕ Flat locations only (No team tier)',
      legacyErp: '◐ Requires complex ERP sub-org config',
    },
    {
      category: 'field',
      categoryLabel: 'Site & Field Crews',
      feature: 'Field Team Site Transfer Workflow ("Temporary Assigned" -> Permanent "Ref: Old Site")',
      detail: 'Transferring a team to a new site marks them "Temporary Assigned to - [New Site]" until old-site stock is cleared (or Admin-confirmed), then promotes to Permanent "[Team Name] (Ref: [Old Site])" with full Assigned Sites History.',
      isSpecialHighlight: true,
      apex: '✓ Temp -> Permanent + "Ref: Old Site" History',
      manual: '✕ Untracked crew moves leave old stock lost',
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
      manual: '✕ Cross-site material mixing & wrong job costing',
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
      manual: '✕ Loose paper return chits & slow entry',
      sortly: '✕ Single item move only',
      zoho: '✕ Customer sales returns only',
      inflowCin7: '✕ Customer sales returns only',
      legacyErp: '◐ Complex movement journal',
    },
    {
      category: 'field',
      categoryLabel: 'Site & Field Crews',
      feature: 'Consumable Materials vs. Returnable Heavy Machinery & Tools Fleet',
      detail: 'Dedicated Plant & Equipment Fleet view to track excavators, generators, fusion splicers, drills, and testing meters separately from consumable materials.',
      apex: '✓ Materials + Plant/Machinery Fleet',
      manual: '✕ Missing power tools & untracked site machinery',
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
      manual: '✕ Duplicate crew names across sheets',
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
      manual: '✕ Manual typing errors & SKU mix-ups',
      sortly: '◐ Camera scan (No single-shot auto-hide)',
      zoho: '◐ Barcode support',
      inflowCin7: '◐ Barcode support',
      legacyErp: '◐ Requires paid mobile scanner license',
    },

    // 4. PROJECTS, ALL 11 INDUSTRY TEMPLATES & WASTAGE / OFFCUT ACCOUNTING
    {
      category: 'projects',
      categoryLabel: 'Projects & All 11 Trades',
      feature: 'All 11 Utility & Specialty Contracting Workflows (Core Utility + Finishing Trades)',
      detail: 'Ready for Telecom, Electrical, Solar & Water utilities PLUS Pantry Joinery, Ceilings, Landscaping, Aluminum Fabrication, HVAC, CCTV/Security & Civil/Road Maintenance.',
      isSpecialHighlight: true,
      apex: '✓ Utility + Specialty Contractor Workflows',
      manual: '✕ One-off messy sheets per project type',
      sortly: '✕ Generic retail folders only',
      zoho: '✕ E-commerce/retail workflow only',
      inflowCin7: '✕ Wholesale/manufacturing only',
      legacyErp: '◐ Heavy custom consulting required',
    },
    {
      category: 'projects',
      categoryLabel: 'Projects & All 11 Trades',
      feature: '3-Tier Project Hierarchy + "Main Project -> Under New Connections" & Section-Filtered FOC',
      detail: 'Receive bulk Client FOC under a Main Project and nest Sub-Projects OR New Connections (Telecom, Water, Electric, Solar) beneath it. Usage dropdowns show only FOC stock allocated to that active section—zero cross-section clutter.',
      isSpecialHighlight: true,
      apex: '✓ Main/Sub + New Connection Section FOC',
      manual: '✕ Cannot link sub-jobs to bulk client FOC pools',
      sortly: '✕ Flat folders only',
      zoho: '✕ No Main/Sub-Project FOC pool sharing',
      inflowCin7: '✕ Single job reference only',
      legacyErp: '✓ WBS Hierarchy (Complex setup)',
    },
    {
      category: 'projects',
      categoryLabel: 'Projects & All 11 Trades',
      feature: 'International Industry Section Templates (Telecom, Water, Electric & Solar PV)',
      detail: '1-click auto-load of international standard fields for Telecom New Connection (ITU-T G.984), Water Supply (ISO 4064 / AWWA), Electrical Power (IEC 60364), Solar PV & Net-Metering (IEC 62446) & Standard EPC.',
      isSpecialHighlight: true,
      apex: '✓ Telecom, Water, Electric & Solar Presets',
      manual: '✕ Manual inconsistent columns per supervisor',
      sortly: '✕ Not Available',
      zoho: '✕ Not Available',
      inflowCin7: '✕ Not Available',
      legacyErp: '✕ Requires expensive custom development',
    },
    {
      category: 'projects',
      categoryLabel: 'Projects & All 11 Trades',
      feature: '"+ Add Field" Dynamic Custom Section Field Builder & Core Label Customizer',
      detail: 'Adapt labels for any trade (e.g., Exchange/LEA, Unit/Apartment, Zone, Feeder) and click "+ Add Field" when creating/editing a section to add unlimited custom technical fields.',
      isSpecialHighlight: true,
      apex: '✓ Unlimited "+ Add Field" Custom Builder',
      manual: '✕ Breaks spreadsheet formulas when columns change',
      sortly: '◐ Limited custom fields on higher plans',
      zoho: '◐ Generic SKU fields only',
      inflowCin7: '◐ Generic custom fields',
      legacyErp: '✕ Requires database schema consultant',
    },
    {
      category: 'projects',
      categoryLabel: 'Projects & All 11 Trades',
      feature: '3-Step Connection Daily Progress with Session-Locked Team & Area',
      detail: 'Step 1 (Team & Area) sits at the top and LOCKS until page refresh so supervisors across Telecom, Solar, Joinery, Ceiling & MEP jobs can log 20+ daily installs back-to-back.',
      isSpecialHighlight: true,
      apex: '✓ 1-2-3 Progress Flow + Team/Area Lock',
      manual: '✕ Repeated typing for every daily job card',
      sortly: '✕ Not Available',
      zoho: '✕ Not Available',
      inflowCin7: '✕ Not Available',
      legacyErp: '✕ Not Available',
    },
    {
      category: 'projects',
      categoryLabel: 'Projects & All 11 Trades',
      feature: 'Custom Project Section Registry, BOM Templates & 1-Click Template Restore',
      detail: 'Create custom sections for any contracting trade, attach Default Material Templates (BOM) that auto-fill daily progress, and quick-load standard templates in 1 click.',
      apex: '✓ Custom Sections + Auto BOM + 1-Click Load',
      manual: '✕ Copy-pasting templates across sheets',
      sortly: '✕ Not Available',
      zoho: '✕ Manufacturing BOM only (Not field sections)',
      inflowCin7: '✕ Assembly BOM only',
      legacyErp: '◐ Complex engineering BOM',
    },
    {
      category: 'projects',
      categoryLabel: 'Projects & All 11 Trades',
      feature: 'Installed Qty + "Wastage / Offcuts Qty" Dual Tracking & Live In-Hand Validation',
      detail: 'Enter both Installed Qty and Wastage/Offcut Qty per item (cables, pipes, gypsum sheets, aluminum profiles, boards); validates live (Used + Wastage <= Team In-Hand) across ledgers and PU vouchers.',
      isSpecialHighlight: true,
      apex: '✓ Installed + Wastage/Offcuts Dual Ledger',
      manual: '✕ Wastage hidden inside "used" totals—kills margins',
      sortly: '✕ Simple quantity reduction only',
      zoho: '✕ No field crew wastage breakdown',
      inflowCin7: '✕ No field wastage tracking',
      legacyErp: '◐ Separate scrap transaction required',
    },
    {
      category: 'projects',
      categoryLabel: 'Projects & All 11 Trades',
      feature: 'User-Site Branch Lock & Project-Reserved Item Override Workflow',
      detail: 'Automatically locks usage entry if a project belongs to another branch, and protects project-reserved items with an Admin Cross-Project Override approval flow.',
      apex: '✓ Auto Branch Lock + Override Approval',
      manual: '✕ Anyone can overwrite any site’s numbers',
      sortly: '✕ Not Available',
      zoho: '✕ Not Available',
      inflowCin7: '✕ Not Available',
      legacyErp: '◐ Custom permission rules required',
    },
    {
      category: 'projects',
      categoryLabel: 'Projects & All 11 Trades',
      feature: '"Full Report for This Site (Project)" — Team Subtotals + Site Grand Total',
      detail: '1-click A4 PDF & Excel report showing Part 1 (Every Team’s individual consumption, wastage & Team Subtotal) and Part 2 (Full Site Consolidated Grand Total).',
      isSpecialHighlight: true,
      apex: '✓ 1-Click Team Subtotals + Grand Total Report',
      manual: '✕ Days spent building end-of-month pivot tables',
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
      detail: 'Every RN, IN, PU, TSR, GRN, FOC, RV, BRM, PO & RTV prints in official ISO 9001:2015 A4/PDF layout with your registered Company Name, Logo, Address & Contact auto-synced.',
      isSpecialHighlight: true,
      apex: '✓ Built-In ISO 9001:2015 A4/PDF Formats',
      manual: '✕ Unformatted Word/Excel printouts fail QA audits',
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
      manual: '✕ Pre-printed carbon books or manual formatting',
      sortly: '✕ Cannot upload PDF stationery',
      zoho: '✕ HTML/CSS coding required',
      inflowCin7: '✕ Word template mail-merge required',
      legacyErp: '✕ Developer consultant required',
    },
    {
      category: 'security',
      categoryLabel: 'ISO Formats & Security',
      feature: 'ISO Signer Matrix: Digital Signatures OR "Off Digital Signature" Wet-Ink Sign Blocks',
      detail: 'Configure Prepared By, Approved By & Reviewed By names/designations; draw signatures on screen, upload PNG/JPG, or toggle "Off Digital Signature" for clean wet-ink pen signing & stamping.',
      isSpecialHighlight: true,
      apex: '✓ Digital Signatures OR Wet-Ink Sign Blocks',
      manual: '✕ Chasing physical signatures on paper slips',
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
      manual: '✕ Awkward page breaks & cut-off columns',
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
      manual: '✕ Anyone can delete rows with zero trace',
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
      manual: '✕ Duplicate voucher numbers & typos',
      sortly: '✕ Random/manual IDs',
      zoho: '◐ Basic numbering (No phone digit guard)',
      inflowCin7: '◐ Basic numbering',
      legacyErp: '◐ Manual number series setup',
    },
    {
      category: 'security',
      categoryLabel: 'ISO Formats & Security',
      feature: 'Super Admin Mandatory Full Name, First-Name Login Check & "(as Super Admin)" Audit',
      detail: 'Requires real Personal Full Name on workspace registration and verifies First Name on every Super Admin password login, stamping all Audit Trail logs & Vouchers as "[Name] (as Super Admin)".',
      isSpecialHighlight: true,
      apex: '✓ First-Name Verified Personal Audit',
      manual: '✕ No audit log of who changed numbers',
      sortly: '✕ Shared generic admin login',
      zoho: '✕ Generic admin account only',
      inflowCin7: '✕ Generic admin login',
      legacyErp: '◐ Paid SSO/IAM audit add-on',
    },
    {
      category: 'security',
      categoryLabel: 'ISO Formats & Security',
      feature: '1-Click JSON Offline Backup Viewer, Admin View-As Mode & Bilingual (EN/SI) Help',
      detail: 'Export/inspect full JSON backups offline, preview the workspace as any staff user (View-As Mode), and access built-in English & Sinhala User Guides + Tutorial Videos.',
      isSpecialHighlight: true,
      apex: '✓ Offline Backup Viewer + EN/SI Guides',
      manual: '✕ Corrupted files lost on one laptop crash',
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
      title: '3-Tier Branches: Central HQ -> Regional -> Optional Sub-Site',
      desc: 'Nest Sub-Site Branches under Regional Sites with Field Teams in both tiers, direct "Issue Stock to Sub-Site" dispatch, parent-routed Requisitions ("Parent Avl:") & upstream Sub-Site returns.',
    },
    {
      title: 'Super Admin First-Name Verified Login & Personal Audit',
      desc: 'Mandatory real Full Name on signup and First-Name verification on every Super Admin password login—stamping vouchers & audit trails as "[Name] (as Super Admin)".',
    },
    {
      title: '5-Stage Client FOC Reconciliation & Color-Coded Project Cards',
      desc: 'Tracks 1. Central Receipt -> 2. Site Issue -> 3. Team Issue -> 4. Usage & Wastage -> 5. Client Returnable Balance with distinct Main Project cards & per-Sub-Project flows.',
    },
    {
      title: '"🌐 ALL AREAS (All Site Branches)" Universal Contracts',
      desc: 'Assign an island-wide Project or FOC voucher to "ALL AREAS" so any Site Branch can request, issue, and consume FOC stock under one consolidated audit trail.',
    },
    {
      title: '"Main Project -> Under New Connections" & Section-Filtered FOC',
      desc: 'Nest Telecom, Water, Electric, or Solar New Connections under a Main Project; material usage only shows FOC dropdowns when FOC exists for that exact section.',
    },
    {
      title: 'Site Branch "Central FOC" Badge & Consolidated Project Reports',
      desc: 'Site Branch Stock highlights HQ-supplied FOC items with a "Central FOC" badge, and Central Stock exports both Individual-Item and Consolidated All-Items Project PDFs.',
    },
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
      title: 'Multi-Item Batch RV/BRM Returns & Item Dropdown Photos',
      desc: 'Add multiple items at once ("+ Add Item" / "+ Add All"), view <200KB item thumbnails inside PO & Return dropdowns, and toggle "Print with Image".',
    },
    {
      title: 'Auto Low-Stock Priority Requisitions & Team-Locked 1-2-3 Usage',
      desc: 'Low-stock items float to the top of requisitions with live "Site Avl:" / "Parent Avl:" / "Main:" balances, while 1-2-3 Usage locks Team & Area until refresh.',
    },
    {
      title: '"Off Digital Signature" Hand-Sign Mode & 9 Glass Tone Themes',
      desc: 'Switch live across 9 Apple Liquid Glass themes ("Sapphire & Gold" default) and toggle "Off Digital Signature" on any voucher/report for wet-ink pen signing & stamping.',
    },
  ];

  const isPolicyTabActive =
    activeLandingTab === 'privacy' || activeLandingTab === 'refund' || activeLandingTab === 'terms';

  return (
    <div className="min-h-screen construction-blueprint-canvas text-white flex flex-col font-sans selection:bg-amber-400 selection:text-[#071026] overflow-x-hidden relative">
      {/* Crisp Luminous Sapphire & Soft Gold Glass Refraction Glows (Zero Dusty Haze) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 no-print">
        <div className="absolute -top-32 -left-24 w-[560px] h-[560px] rounded-full bg-gradient-to-br from-sky-400/16 via-blue-500/8 to-transparent blur-[130px]" />
        <div className="absolute top-1/5 -right-28 w-[520px] h-[520px] rounded-full bg-gradient-to-bl from-amber-400/12 via-yellow-400/6 to-transparent blur-[130px]" />
        <div className="absolute bottom-1/6 left-1/4 w-[540px] h-[540px] rounded-full bg-gradient-to-tr from-blue-600/16 via-sky-400/8 to-transparent blur-[135px]" />
      </div>

      {/* Top Specular Gold Crystal Rule */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-400/85 to-transparent relative z-50 no-print" />

      {/* Sticky Translucent Frosted Sapphire Glass Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#060c1d]/78 backdrop-blur-2xl border-b border-white/12 shadow-[0_14px_38px_-12px_rgba(2,6,18,0.72)] no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleSwitchToOverviewSection()}
            className="group flex items-center gap-2.5 sm:gap-3 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/25 ring-1 ring-white/45 transition-transform duration-200 group-hover:scale-105">
              <Boxes className="w-4 h-4 sm:w-5 sm:h-5 text-[#071026] stroke-[2.25]" />
            </div>
            <span
              className="text-xl sm:text-[23px] font-extrabold tracking-[-0.03em] leading-none select-none flex items-baseline"
              style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
            >
              <span className="text-white">Apex</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300">
                Stox
              </span>
            </span>
          </button>

          {/* Zone 2: Primary Top Tabs & Section Links */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs font-bold text-slate-200">
            <button
              type="button"
              onClick={() => handleSwitchToOverviewSection()}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 ${
                activeLandingTab === 'overview'
                  ? 'text-amber-300 border-b-2 border-amber-400 font-extrabold'
                  : 'hover:text-amber-300'
              }`}
            >
              Overview
            </button>

            <button
              type="button"
              onClick={handleOpenGuideTab}
              className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 ${
                activeLandingTab === 'guide'
                  ? 'text-amber-300 border-b-2 border-amber-400 font-extrabold'
                  : 'text-slate-200 hover:text-amber-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>User Guide & Features</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchToOverviewSection('intro-video')}
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1"
            >
              <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Intro Video</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchToOverviewSection('industries')}
              className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1"
            >
              Industries
            </button>

            <button
              type="button"
              onClick={() => handleSwitchToOverviewSection('features')}
              className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1"
            >
              Capabilities
            </button>

            <button
              type="button"
              onClick={() => handleSwitchToOverviewSection('pricing')}
              className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1"
            >
              Pricing
            </button>

            <button
              type="button"
              onClick={() => handleOpenPolicyTab('privacy')}
              className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 ${
                isPolicyTabActive
                  ? 'text-amber-300 border-b-2 border-amber-400 font-extrabold'
                  : 'text-slate-200 hover:text-amber-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Our Policies</span>
            </button>
          </nav>

          {/* Zone 3: Workspace Access & Trial Action */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={onOpenLogin}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold text-white bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-xl border border-white/20 rounded-xl transition flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
              title="Client Login"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Client </span>
              <span>Login</span>
            </button>

            <button
              onClick={() => setIsSignupOpen(true)}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-[#071026] font-black rounded-xl text-xs flex items-center gap-1 sm:gap-1.5 shadow-lg shadow-amber-500/25 ring-1 ring-white/45 transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            >
              <span className="hidden sm:inline">Start {pricingMetrics.trialDays}-Day </span>
              <span>Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#071026] stroke-[2.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Quick Top Tab Switcher (Visible below lg breakpoint) */}
      <div className="lg:hidden relative z-30 max-w-7xl w-full mx-auto px-3 sm:px-4 pt-2 sm:pt-3 no-print">
        <div className="grid grid-cols-3 gap-1.5 p-1 sm:p-1.5 rounded-2xl bg-[#08122b]/75 backdrop-blur-2xl border border-white/15 shadow-lg">
          <button
            type="button"
            onClick={() => handleSwitchToOverviewSection()}
            className={`py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-extrabold transition cursor-pointer whitespace-nowrap text-center ${
              activeLandingTab === 'overview'
                ? 'bg-gradient-to-r from-amber-300 to-amber-400 text-[#071026] shadow-sm'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={handleOpenGuideTab}
            className={`py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeLandingTab === 'guide'
                ? 'bg-gradient-to-r from-amber-300 to-amber-400 text-[#071026] shadow-sm'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            <BookOpen className={`w-3.5 h-3.5 shrink-0 ${activeLandingTab === 'guide' ? 'text-[#071026]' : 'text-amber-400'}`} />
            <span>User Guide</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenPolicyTab('privacy')}
            className={`py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer whitespace-nowrap ${
              isPolicyTabActive
                ? 'bg-gradient-to-r from-amber-300 to-amber-400 text-[#071026] shadow-sm'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isPolicyTabActive ? 'text-[#071026]' : 'text-amber-400'}`} />
            <span>Our Policies</span>
          </button>
        </div>
      </div>

      {/* ==================== CONDITIONAL VIEW: LEGAL POLICIES, USER GUIDE TAB OR MAIN OVERVIEW ==================== */}
      {isPolicyTabActive ? (
        <LegalPoliciesView
          activePolicy={activeLandingTab}
          onSelectPolicy={handleOpenPolicyTab}
          onBackToOverview={() => handleSwitchToOverviewSection()}
          onOpenSignup={() => setIsSignupOpen(true)}
        />
      ) : activeLandingTab === 'guide' ? (
        <SystemUserGuideView
          onBackToOverview={() => handleSwitchToOverviewSection()}
          onOpenSignup={() => setIsSignupOpen(true)}
          onOpenLogin={onOpenLogin}
        />
      ) : (
        <>
          {/* ==================== HERO SECTION (FROSTED ROYAL SAPPHIRE LIQUID GLASS STAGE) ==================== */}
          <section className="relative pt-6 pb-14 sm:pt-12 sm:pb-20 z-10">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center">
              {/* Smoked Royal Sapphire Frosted Glass Stage */}
              <div className="relative rounded-2xl sm:rounded-[32px] landing-glass-card p-4 sm:p-10 lg:p-14 overflow-hidden">
                {/* Specular Top Gold-Sapphire Prism Highlight */}
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-300/85 to-transparent" />
                <div className="absolute -top-24 left-1/5 w-96 h-96 rounded-full bg-gradient-to-br from-sky-400/14 via-blue-400/6 to-transparent blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 right-1/5 w-96 h-96 rounded-full bg-gradient-to-tl from-amber-400/14 via-yellow-300/6 to-transparent blur-3xl pointer-events-none" />

                {/* Clean Editorial Kicker */}
                <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-200 tracking-wide mb-4 sm:mb-5">
                  <HardHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <span>Built for Construction, EPC, Telecom & Multi-Site Contractors</span>
                  <span aria-hidden="true" className="text-white/35">·</span>
                  <span className="text-amber-300 font-extrabold">{pricingMetrics.trialDays}-Day Unrestricted Free Trial</span>
                </div>

                {/* High-Impact Display Headline */}
                <h1 className="relative z-10 text-2xl sm:text-5xl lg:text-[54px] font-black text-white tracking-tight leading-[1.18] sm:leading-[1.13] max-w-4xl mx-auto text-balance">
                  Complete Inventory Control Across All Your{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200">
                    Warehouses, Project Sites & Field Teams
                  </span>
                </h1>

                {/* Clear Subtitle */}
                <p className="relative z-10 mt-3.5 sm:mt-5 text-xs sm:text-base lg:text-lg text-slate-200/95 max-w-3xl mx-auto leading-relaxed font-medium">
                  Stop losing track of construction materials, tools, and site stock across spreadsheets. Manage your{' '}
                  <strong className="text-white font-bold">Central Warehouse</strong>,{' '}
                  <strong className="text-white font-bold">Regional &amp; Sub-Site Branches</strong>,{' '}
                  <strong className="text-amber-300 font-bold">Client-Supplied Free Materials</strong>,{' '}
                  <strong className="text-white font-bold">Heavy Machinery Fleets</strong>, and{' '}
                  <strong className="text-white font-bold">Daily Crew Dispatches</strong> in one real-time cloud workspace.
                </p>

                {/* Eye-Catching Unlimited Capacity Showcase Dock (Users · Sites · Teams) */}
                <div className="relative z-10 mt-6 sm:mt-7 max-w-4xl mx-auto rounded-2xl bg-gradient-to-r from-[#07132f]/95 via-[#0d2252]/90 to-[#07132f]/95 border border-amber-300/40 shadow-[0_18px_40px_-14px_rgba(251,191,36,0.28),inset_0_1px_0_rgba(255,255,255,0.2)] overflow-hidden">
                  {/* Top Gold Specular Hairline */}
                  <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-amber-300/90 to-transparent" />
                  <div className="px-4 py-2 border-b border-white/10 bg-white/[0.03] flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] font-bold text-amber-200 tracking-wide">
                    <Crown className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Zero Per-Seat Fees — Unlimited Users &amp; Teams + {pricingMetrics.includedSiteBranches} Site Branches &amp; HQ Included</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/12 text-left">
                    {/* Pillar 1: Unlimited Users */}
                    <div className="px-4 sm:px-5 py-3.5 sm:py-4 flex items-center gap-3.5 hover:bg-white/[0.03] transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300/20 to-amber-500/10 border border-amber-300/40 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
                        <Users2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <InfinityIcon className="w-4 h-4 text-amber-300 stroke-[2.5] shrink-0" />
                          <span className="text-sm sm:text-[15px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-200 tracking-tight whitespace-nowrap">
                            Unlimited Users
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium mt-0.5 leading-snug">
                          Storekeepers, admins &amp; supervisors at $0 extra
                        </p>
                      </div>
                    </div>

                    {/* Pillar 2: 20 Site Branches + HQ */}
                    <div className="px-4 sm:px-5 py-3.5 sm:py-4 flex items-center gap-3.5 hover:bg-white/[0.03] transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-300/20 to-blue-500/10 border border-sky-300/40 flex items-center justify-center text-sky-300 shrink-0 shadow-inner">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-sky-400/20 border border-sky-300/40 text-[11px] font-black font-mono text-sky-200 leading-none shrink-0">
                            {pricingMetrics.includedSiteBranches}
                          </span>
                          <span className="text-sm sm:text-[15px] font-extrabold text-sky-100 tracking-tight whitespace-nowrap">
                            Site Branches + HQ
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium mt-0.5 leading-snug">
                          Regional &amp; Sub-Site hierarchy (+${pricingMetrics.extraSiteMonthlyPriceClean}/mo extra)
                        </p>
                      </div>
                    </div>

                    {/* Pillar 3: Unlimited Teams */}
                    <div className="px-4 sm:px-5 py-3.5 sm:py-4 flex items-center gap-3.5 hover:bg-white/[0.03] transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-300/20 to-teal-500/10 border border-emerald-300/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                        <HardHat className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <InfinityIcon className="w-4 h-4 text-emerald-300 stroke-[2.5] shrink-0" />
                          <span className="text-sm sm:text-[15px] font-extrabold text-emerald-200 tracking-tight whitespace-nowrap">
                            Unlimited Teams
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium mt-0.5 leading-snug">
                          Field crews, tool custody &amp; daily issue logs
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 Core Operational Pillars (Clean Unboxed Strip) */}
                <div className="relative z-10 mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-white/12 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 max-w-4xl mx-auto text-[11px] sm:text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                    <span>Central & Branch Warehouses</span>
                  </span>
                  <span aria-hidden="true" className="hidden sm:inline text-white/30">·</span>
                  <span className="flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-300" />
                    <span>Client-Supplied Free Materials</span>
                  </span>
                  <span aria-hidden="true" className="hidden sm:inline text-white/30">·</span>
                  <span className="flex items-center gap-1.5">
                    <Users2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                    <span>Field Crew In-Hand Tracking</span>
                  </span>
                  <span aria-hidden="true" className="hidden sm:inline text-white/30">·</span>
                  <span className="flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-300" />
                    <span>Project Usage Reconciliation</span>
                  </span>
                </div>

                {/* Hero CTAs */}
                <div className="relative z-10 mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3.5 max-w-md sm:max-w-none mx-auto">
                  <button
                    onClick={() => setIsSignupOpen(true)}
                    className="w-full sm:w-auto px-5 sm:px-7 py-3 sm:py-3.5 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-[#071026] font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 sm:gap-2.5 shadow-xl shadow-amber-500/25 ring-1 ring-white/45 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    <span>Start {pricingMetrics.trialDays}-Day Free Trial</span>
                    <span className="text-[#071026]/75 font-bold text-[11px] sm:text-xs">($0 Today)</span>
                    <ArrowRight className="w-4 h-4 text-[#071026] stroke-[2.5]" />
                  </button>

                  <button
                    onClick={onOpenLogin}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-3.5 bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-xl text-white border border-white/25 font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer whitespace-nowrap"
                  >
                    <LogIn className="w-4 h-4 text-amber-400" />
                    <span>Client Sign In / Workspace Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenGuideTab}
                    className="w-full sm:w-auto px-4 sm:px-5 py-3 sm:py-3.5 bg-amber-400/12 hover:bg-amber-400/20 backdrop-blur-xl text-amber-200 border border-amber-300/35 font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap"
                  >
                    <BookOpen className="w-4 h-4 text-amber-300" />
                    <span>Read Full User Guide & PDF</span>
                  </button>
                </div>

                {/* Trust Guarantees */}
                <div className="relative z-10 mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1.5 text-[11px] sm:text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>60-Second Workspace Setup</span>
                  </span>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span className="flex items-center gap-1.5 text-white font-bold">
                    <CreditCard className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                    <span>No Credit Card Required</span>
                  </span>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span className="tabular-nums">
                    ${pricingMetrics.monthlyPriceFormatted}/mo or ${pricingMetrics.annualPriceClean}/yr (Save {pricingMetrics.annualSavingsPercent}%)
                  </span>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span>100% Isolated Tenant Cloud</span>
                </div>

                {/* Official Landscape Video Showcase with Master-Managed Tabs */}
                <div
                  id="intro-video"
                  className="relative z-10 mt-8 sm:mt-10 rounded-2xl sm:rounded-[26px] bg-white/[0.06] backdrop-blur-xl p-2 sm:p-3 border border-white/20 shadow-[0_24px_60px_-14px_rgba(2,6,18,0.8),inset_0_1px_0_rgba(255,255,255,0.22)] max-w-4xl mx-auto scroll-mt-24"
                >
                  {/* Video Selector Tabs Above Video Frame */}
                  <div className="px-1 pb-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
                    {landingVideos.map((vTab, vIdx) => {
                      const isTabActive = activeVideoTab?.id === vTab.id;
                      const hasValidYt = Boolean(extractYouTubeVideoInfo(vTab.youtubeUrl));
                      return (
                        <button
                          key={vTab.id}
                          type="button"
                          onClick={() => {
                            const switchingTab = activeVideoTab?.id !== vTab.id;
                            setSelectedVideoTabId(vTab.id);
                            if (switchingTab) {
                              setIsIntroVideoPlaying(hasValidYt);
                            }
                          }}
                          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                            isTabActive
                              ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 text-[#071026] shadow-[0_6px_18px_-4px_rgba(251,191,36,0.55)]'
                              : 'bg-white/[0.07] hover:bg-white/[0.14] text-slate-200 border border-white/12'
                          }`}
                        >
                          <Play
                            className={`w-3 h-3 shrink-0 ${
                              isTabActive ? 'fill-[#071026] text-[#071026]' : 'text-amber-300'
                            }`}
                          />
                          <span>
                            {vIdx + 1}. {vTab.tabName}
                          </span>
                          {!hasValidYt && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isTabActive
                                  ? 'bg-[#071026]/15 text-[#071026]'
                                  : 'bg-white/10 text-slate-300'
                              }`}
                            >
                              Soon
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="bg-[#060c1d]/95 rounded-xl sm:rounded-[20px] border border-white/12 overflow-hidden">
                    {/* Video Frame Top Header Bar */}
                    <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-white/[0.04] border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-left">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-[#071026] shrink-0">
                          <Play className="w-3.5 h-3.5 fill-[#071026]" />
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
                            {activeVideoTab?.tabName || 'Introduction'}
                          </span>
                          {activeVideoTab?.subtitle && (
                            <span className="hidden sm:inline text-xs text-slate-300 ml-2">
                              · {activeVideoTab.subtitle}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-300 shrink-0">
                        {activeYoutubeInfo ? 'YouTube HD · 16:9' : 'Pending Video Link'}
                      </span>
                    </div>

                    {/* 16:9 Landscape Video Container */}
                    <div className="relative aspect-video w-full bg-[#040814] overflow-hidden">
                      {!activeYoutubeInfo ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#071026] via-[#0b1838] to-[#050a18]">
                          <div className="w-16 h-16 rounded-2xl bg-white/[0.08] border border-amber-300/30 text-amber-300 flex items-center justify-center mb-3 shadow-lg">
                            <Video className="w-8 h-8" />
                          </div>
                          <h3 className="text-base sm:text-lg font-extrabold text-white">
                            {activeVideoTab?.tabName} Video Coming Soon
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-md leading-relaxed">
                            {activeVideoTab?.subtitle ||
                              'Add or paste a YouTube video link for this tab inside SaaS Master Panel → Landing Page Videos.'}
                          </p>
                        </div>
                      ) : !isIntroVideoPlaying ? (
                        <button
                          type="button"
                          onClick={() => setIsIntroVideoPlaying(true)}
                          className="group relative w-full h-full block cursor-pointer text-left focus:outline-none"
                          aria-label={`Play ${activeVideoTab?.tabName || 'System'} Video`}
                        >
                          <img
                            src={activeYoutubeInfo.thumbnailUrl}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.includes('hqdefault.jpg')) {
                                target.src = activeYoutubeInfo.fallbackThumbnailUrl;
                              }
                            }}
                            alt={`Apex Stock ${activeVideoTab?.tabName || 'Introduction'} Video`}
                            className="w-full h-full object-cover opacity-85 group-hover:scale-[1.02] group-hover:opacity-95 transition-all duration-300"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-[#040814]/85 via-[#09132c]/35 to-[#040814]/40 transition-opacity group-hover:opacity-75" />

                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 group-hover:from-amber-200 group-hover:to-amber-400 text-[#071026] flex items-center justify-center shadow-[0_0_45px_rgba(251,191,36,0.5)] ring-4 ring-white/35 group-hover:scale-110 transition-all duration-200">
                              <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-[#071026] text-[#071026] ml-1" />
                            </div>
                            <span className="mt-3 sm:mt-4 px-4 py-1.5 rounded-full bg-[#060c1d]/80 backdrop-blur-xl border border-amber-300/40 text-white text-xs sm:text-sm font-extrabold tracking-wide shadow-lg">
                              Click to Play {activeVideoTab?.tabName || 'Introduction'} Video
                            </span>
                          </div>
                        </button>
                      ) : (
                        <iframe
                          key={`${activeVideoTab.id}-${activeYoutubeInfo.videoId}`}
                          className="w-full h-full border-0"
                          src={activeYoutubeInfo.embedUrl}
                          title={`Apex Stock ${activeVideoTab?.tabName || 'Introduction'} Video`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Executive Site Operations Preview Console (Frosted Royal Sapphire Glass) */}
                <div className="relative z-10 mt-6 sm:mt-8 rounded-2xl sm:rounded-[24px] bg-white/[0.06] backdrop-blur-xl p-2 sm:p-3 border border-white/18 shadow-[0_24px_56px_-14px_rgba(2,6,18,0.75),inset_0_1px_0_rgba(255,255,255,0.2)] max-w-5xl mx-auto">
                  <div className="bg-gradient-to-br from-[#071026]/95 via-[#0b1838]/95 to-[#060d20]/95 rounded-xl sm:rounded-[18px] border border-white/10 p-3.5 sm:p-6 text-left relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
                    {/* Top window bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 sm:pb-4 border-b border-white/10 mb-4 sm:mb-5 relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/25" />
                        <div className="w-2.5 h-2.5 rounded-full bg-sky-300/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/85" />
                        <span className="text-[11px] sm:text-xs text-slate-300 font-mono ml-1.5 sm:ml-2 truncate max-w-[200px] sm:max-w-none">
                          apex-stock-cloud / site-operations-control
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-semibold text-slate-300">
                        <span>Client Stock Synced</span>
                        <span aria-hidden="true" className="text-slate-500">·</span>
                        <span className="text-amber-300">Multi-Site Active</span>
                      </div>
                    </div>

                    {/* Live Preview KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-3.5 sm:mb-4 relative z-10">
                      <div className="bg-white/[0.06] border border-white/12 rounded-xl p-3 sm:p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                        <div className="text-[11px] text-slate-300 font-semibold">Central Warehouse Stock</div>
                        <div className="text-lg sm:text-xl font-black text-white mt-0.5 font-mono tabular-nums">
                          24,580 <span className="text-xs font-normal text-slate-300">units</span>
                        </div>
                        <div className="text-[10px] text-amber-300 font-semibold mt-1">Materials & Machinery Fleet</div>
                      </div>
                      <div className="bg-white/[0.06] border border-white/12 rounded-xl p-3 sm:p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                        <div className="text-[11px] text-slate-300 font-semibold">Client-Supplied Stock</div>
                        <div className="text-lg sm:text-xl font-black text-amber-300 mt-0.5 font-mono tabular-nums">12,400 m</div>
                        <div className="text-[10px] text-slate-300 mt-1">Free-Issue Project Materials</div>
                      </div>
                      <div className="bg-white/[0.06] border border-white/12 rounded-xl p-3 sm:p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                        <div className="text-[11px] text-slate-300 font-semibold">Active Sites & Crews</div>
                        <div className="text-lg sm:text-xl font-black text-white mt-0.5 font-mono tabular-nums">6 Sites · 18 Crews</div>
                        <div className="text-[10px] text-sky-300 font-semibold mt-1">Live In-Hand Custody</div>
                      </div>
                      <div className="bg-white/[0.06] border border-white/12 rounded-xl p-3 sm:p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                        <div className="text-[11px] text-slate-300 font-semibold">Project Reconciliations</div>
                        <div className="text-lg sm:text-xl font-black text-amber-300 mt-0.5 font-mono tabular-nums">100% Audited</div>
                        <div className="text-[10px] text-slate-300 mt-1">Multi-Crew BOQ & WBS</div>
                      </div>
                    </div>

                    {/* Smart Priority Strip */}
                    <div className="bg-white/[0.045] border border-amber-400/25 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-xs relative z-10">
                      <div className="flex items-start sm:items-center gap-2">
                        <span className="text-[11px] font-extrabold text-amber-300 shrink-0">
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

          {/* ==================== PAIN POINTS WE SOLVE ("SOUND FAMILIAR?") — FROSTED SAPPHIRE & GOLD ==================== */}
          <section id="challenges" className="py-10 sm:py-16 relative z-10">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
                <div className="inline-flex items-center gap-2 text-xs font-extrabold text-amber-300 tracking-wide mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Sound Familiar? · Operational Challenges We Solve</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight text-balance">
                  Why Contractors Switch From Paper &amp; Excel to{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200">
                    ApexStox
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2.5 font-medium">
                  Every daily headache across stores, site yards, and field crews—solved in one structured control system.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {painToSolutionItems.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <div
                      key={item.painTitle}
                      className="landing-glass-card rounded-2xl sm:rounded-[24px] p-4 sm:p-6 border border-white/15 hover:border-amber-400/50 transition-all flex flex-col justify-between gap-4 relative overflow-hidden"
                    >
                      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                      {/* Top: Daily Pain Point */}
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-400/35 text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300 mb-0.5">
                            Daily Contractor Headache
                          </div>
                          <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                            {item.painTitle}
                          </h3>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {item.painDesc}
                          </p>
                        </div>
                      </div>

                      {/* Bottom: Direct ApexStox Solution */}
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-3 sm:p-3.5 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-[11px] font-extrabold text-amber-300">
                            ApexStox Solution: {item.solutionLabel}
                          </div>
                          <p className="text-xs text-slate-100 mt-0.5 leading-relaxed font-medium">
                            {item.solutionDesc}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ==================== SECTION 1: PRIORITIZED INDUSTRIES (#industries — CRISP PEARL PORCELAIN GLASS BAND) ==================== */}
          <section
            id="industries"
            className="py-12 sm:py-20 relative z-10 bg-gradient-to-b from-[#f3f6fc] via-[#ffffff] to-[#eff4fb] text-slate-900 border-y border-white/80"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              {/* Section Header */}
              <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
                <div className="text-xs font-extrabold text-amber-700 tracking-wide mb-2 flex items-center justify-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Built for 11 Utility, Infrastructure &amp; Finishing Contracting Trades</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-[#081024] tracking-tight text-balance">
                  See How ApexStox Fits Your Exact Field Workflow
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2.5 font-semibold">
                  Leading utility &amp; infrastructure sectors first, followed by specialty finishing &amp; contracting trades—every card highlights your exact stock, wastage, and site flow.
                </p>
              </div>

              {/* Tier 1: Core Utility & Infrastructure Sectors (Featured 4) */}
              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">
                  Core Utility &amp; Infrastructure Sectors
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  Click any sector to highlight
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {coreUtilityIndustries.map((ind, idx) => {
                  const IconComponent = ind.icon;
                  const isSelected = selectedIndustryIdx === idx;
                  return (
                    <div
                      key={ind.title}
                      onClick={() => setSelectedIndustryIdx(idx)}
                      className={`group relative overflow-hidden rounded-2xl sm:rounded-[24px] p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#071026]/98 via-[#0d1b3e]/98 to-[#060d20]/98 backdrop-blur-2xl text-white border border-amber-400/55 shadow-[0_24px_54px_-14px_rgba(245,158,11,0.25),inset_0_1px_0_rgba(255,255,255,0.22)] -translate-y-0.5'
                          : 'landing-glass-card-light hover:bg-white text-slate-900 hover:border-amber-400/55'
                      }`}
                    >
                      <div
                        className={`absolute top-0 inset-x-0 h-[2px] ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300'
                            : 'bg-gradient-to-r from-transparent via-amber-400/50 to-transparent'
                        }`}
                      />

                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3.5">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                              isSelected
                                ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-[#071026]'
                                : 'bg-[#081024] text-amber-400'
                            }`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-[10.5px] font-extrabold ${
                              isSelected ? 'text-amber-300' : 'text-slate-500'
                            }`}
                          >
                            {ind.badge}
                          </span>
                        </div>

                        <h3
                          className={`text-[15px] font-black tracking-tight leading-snug ${
                            isSelected ? 'text-white' : 'text-[#081024]'
                          }`}
                        >
                          {ind.title}
                        </h3>

                        {/* Instant "Why It Fits" Micro-Label */}
                        <div
                          className={`mt-2 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold leading-snug border ${
                            isSelected
                              ? 'bg-amber-400/15 border-amber-300/35 text-amber-200'
                              : 'bg-amber-50/90 border-amber-200/80 text-amber-900'
                          }`}
                        >
                          Why it fits: {ind.fitLabel}
                        </div>

                        <p
                          className={`text-xs mt-2.5 leading-relaxed font-medium ${
                            isSelected ? 'text-slate-200' : 'text-slate-600'
                          }`}
                        >
                          {ind.desc}
                        </p>
                      </div>

                      <div
                        className={`mt-4 pt-3 border-t space-y-1.5 ${
                          isSelected ? 'border-white/15' : 'border-slate-200/80'
                        }`}
                      >
                        {ind.features.map((feat) => (
                          <div
                            key={feat}
                            className={`flex items-center gap-2 text-[11px] font-bold ${
                              isSelected ? 'text-white' : 'text-[#081024]'
                            }`}
                          >
                            <CheckCircle2
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? 'text-amber-400' : 'text-amber-600'
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

              {/* Tier 2: Specialty & Finishing Contracting Trades (Compact Scannable Grid) */}
              <div className="mt-8 sm:mt-10 pt-6 border-t border-slate-200/90">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#081024]">
                      Specialty &amp; Finishing Contracting Trades
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      · Instant workflow fit across materials, offcuts &amp; multi-site installs
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {specialtyTradeIndustries.map((trade) => {
                    const TradeIcon = trade.icon;
                    return (
                      <div
                        key={trade.title}
                        className="rounded-2xl bg-white/95 hover:bg-white border border-slate-200/90 hover:border-amber-400/70 p-3.5 shadow-2xs transition-all flex items-start gap-3"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#081024] text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                          <TradeIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono font-black text-amber-700">
                            {trade.num}. SPECIALTY TRADE
                          </div>
                          <h4 className="text-xs sm:text-[13px] font-extrabold text-[#081024] leading-snug mt-0.5">
                            {trade.title}
                          </h4>
                          <p className="text-[11px] font-semibold text-slate-600 mt-1 leading-snug">
                            {trade.fitLabel}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ==================== SECTION 2: SYSTEM CAPABILITIES & 4-STEP WORKFLOW (#features — FROSTED ROYAL SAPPHIRE GLASS) ==================== */}
          <section
            id="features"
            className="py-12 sm:py-22 relative z-10"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
                <div className="text-xs font-extrabold text-amber-300 tracking-wide mb-2">
                  End-to-End Site & Warehouse Capabilities
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight text-balance">
                  How Apex Stock Controls Your Daily Site Operations
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium">
                  From Central Warehouse procurement and Client-Supplied Free Materials to regional yard transfers, field crew dispatches, and project reconciliation.
                </p>
              </div>

              {/* 4-Step Frosted Glass Workflow Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-12">
                {[
                  {
                    step: '01. Procurement & Intake',
                    title: 'Central Stock & Client Stock',
                    desc: 'Receive Supplier Purchase Orders (GRN) or log Client-Supplied Free Materials into your Central Warehouse.',
                  },
                  {
                    step: '02. 3-Tier Distribution',
                    title: 'Regional & Sub-Site Branches',
                    desc: 'Central HQ supplies Regional Site Yards, which can create optional Sub-Site Branches via "Issue Stock to Sub-Site" or parent-routed requests.',
                  },
                  {
                    step: '03. Field Dispatch',
                    title: 'Teams in Regional & Sub-Sites',
                    desc: 'Both Regional and Sub-Site managers run unlimited Field Teams, issue materials & tools (IN), and log site-separated crew custody.',
                  },
                  {
                    step: '04. Site Audit',
                    title: 'Project Usage & Returns',
                    desc: 'Log multi-team project consumption (client stock deducted first) & return unused items to inventory.',
                  },
                ].map((item, idx) => (
                  <div
                    key={item.step}
                    className="relative rounded-2xl landing-glass-card text-white p-4 sm:p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono font-bold text-amber-300">
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

              {/* 6 Detailed Frosted Crystal Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="landing-glass-card hover:bg-white/[0.08] hover:border-amber-400/50 rounded-2xl sm:rounded-[22px] p-5 sm:p-6 transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-[#071026] flex items-center justify-center mb-4 shadow-md shadow-amber-500/20">
                    <Gift className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    5-Stage Client FOC Reconciliation & &ldquo;ALL AREAS&rdquo; Support
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                    Track Client Free Stock across 5 clear stages (Central Receipt &rarr; Site Issue &rarr; Team Issue &rarr; Usage &amp; Wastage &rarr; Client Balance), highlight Central FOC inside Site Stock, and assign island-wide contracts to &ldquo;🌐 ALL AREAS&rdquo;.
                  </p>
                </div>

                <div className="landing-glass-card hover:bg-white/[0.08] hover:border-amber-400/50 rounded-2xl sm:rounded-[22px] p-5 sm:p-6 transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.08] border border-sky-400/35 text-sky-300 flex items-center justify-center mb-4">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    Main Project &rarr; New Connections &amp; Section FOC
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                    Group Telecom, Water, Electrical &amp; Solar New Connections under Main Projects, filter FOC selectors strictly by active section, and print Individual or Consolidated Project A4/PDF reports.
                  </p>
                </div>

                <div className="landing-glass-card hover:bg-white/[0.08] hover:border-amber-400/50 rounded-2xl sm:rounded-[22px] p-5 sm:p-6 transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-[#071026] flex items-center justify-center mb-4 shadow-md shadow-amber-500/20">
                    <Truck className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    Materials + Heavy Machinery Fleet Control
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                    Dedicated classification for Consumable Materials and Returnable Heavy Machinery/Tools (Excavators, Generators, Compactors, Splicers) with custom fleet categories.
                  </p>
                </div>

                <div className="landing-glass-card hover:bg-white/[0.08] hover:border-amber-400/50 rounded-2xl sm:rounded-[22px] p-5 sm:p-6 transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.08] border border-amber-400/35 text-amber-300 flex items-center justify-center mb-4">
                    <Send className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    3-Tier Sub-Site Dispatch, Requisitions &amp; Upstream Returns
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                    Regional yards supply nested Sub-Site Branches via direct &ldquo;Issue Stock to Sub-Site&rdquo; or approve parent-routed Requisitions (&ldquo;Parent Avl:&rdquo;), while Sub-Site Returns route upstream cleanly to their Parent Branch.
                  </p>
                </div>

                <div className="landing-glass-card hover:bg-white/[0.08] hover:border-amber-400/50 rounded-2xl sm:rounded-[22px] p-5 sm:p-6 transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-[#071026] flex items-center justify-center mb-4 shadow-md shadow-amber-500/20">
                    <Users2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    Field Team In-Hand Custody & Return Notes
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                    See every item and tool currently held by each field crew leader. Process unused or damaged stock returns back into Site Branch or Central inventory.
                  </p>
                </div>

                <div className="landing-glass-card hover:bg-white/[0.08] hover:border-amber-400/50 rounded-2xl sm:rounded-[22px] p-5 sm:p-6 transition duration-200">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.08] border border-sky-400/35 text-sky-300 flex items-center justify-center mb-4">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    Excel Bulk Import, JSON Backup & Printable PDFs
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                    Import thousands of catalog items via Excel/CSV, print official Dispatch/Issue/PO Gate Passes, and safeguard records with 1-Click JSON Backup & Restore.
                  </p>
                </div>
              </div>

              {/* Luminous Gold Crystal Callout Banner */}
              <div className="mt-10 sm:mt-12 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300 text-[#071026] p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl border border-white/60">
                <div className="flex items-start sm:items-center gap-3.5 text-left">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#071026] text-amber-300 flex items-center justify-center shrink-0 shadow-md">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-[#071026]">
                      Want to see step-by-step how every module works in practice?
                    </h4>
                    <p className="text-xs text-[#071026]/85 font-semibold mt-0.5">
                      Explore our complete client-friendly System User Guide & Feature Handbook—or download it as an A4 PDF for your team.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenGuideTab}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-[#071026] hover:bg-[#0d1b3e] text-amber-300 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition whitespace-nowrap shrink-0 shadow-md"
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
              <div className="landing-glass-card rounded-2xl sm:rounded-[28px] p-4 sm:p-10 lg:p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/75 to-transparent" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10">
                  <div>
                    <div className="flex items-center gap-2 text-amber-300 text-xs font-bold mb-3">
                      <Database className="w-4 h-4" />
                      <span>Enterprise Multi-Tenancy & Data Security</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight text-balance">
                      100% Isolated Cloud Workspace for Every Registered Company
                    </h2>
                    <p className="text-slate-300 text-xs sm:text-sm mt-3.5 leading-relaxed">
                      Each contractor operates in its own dedicated tenant partition on Realtime Cloud. Your stock balances, supplier rates, Client Register, and field team logs are strictly isolated and protected.
                    </p>

                    <div className="mt-7 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-amber-400/15 border border-amber-400/35 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
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
                        <div className="w-6 h-6 rounded-lg bg-amber-400/15 border border-amber-400/35 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white">3-Tier Regional &amp; Sub-Site Branch Locks</h4>
                          <p className="text-[11px] sm:text-xs text-slate-300">
                            Supervisors stay locked to their assigned Regional or Sub-Site branch, while Parent Regional Admins can dispatch to and approve requests from their own nested Sub-Sites.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-amber-400/15 border border-amber-400/35 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white">First-Name Super Admin Accountability &amp; 1-Click Backups</h4>
                          <p className="text-[11px] sm:text-xs text-slate-300">
                            Enforces mandatory Super Admin Full Name + First-Name login checks (&ldquo;as Super Admin&rdquo; audit stamps), Admin-password deletion gates, and instant JSON offline backups.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Architecture Diagram Card */}
                  <div className="bg-white/[0.05] backdrop-blur-xl border border-white/15 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                      <span className="text-xs font-mono text-amber-300 font-bold flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        <span>Tenant Data Isolation Model</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-300">Secure Cloud RTDB</span>
                    </div>

                    <div className="space-y-3.5">
                      <div className="p-4 rounded-xl bg-[#050a18]/80 border border-amber-400/45">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Your Company Tenant Partition</span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            ISOLATED
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-2 text-[10px] text-slate-200 font-mono">
                          <div className="bg-white/[0.07] border border-white/10 p-2 rounded text-center">/items</div>
                          <div className="bg-white/[0.07] border border-white/10 p-2 rounded text-center">/sites</div>
                          <div className="bg-white/[0.07] border border-white/10 p-2 rounded text-center">/clients</div>
                          <div className="bg-white/[0.07] border border-white/10 p-2 rounded text-center">/users</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#050a18]/45 border border-white/10 opacity-75">
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
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Role-Based Access Control (RBAC)</span>
                      </span>
                      <span className="text-emerald-400 font-bold">100% Protected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== SECTION 4: PRICING PLANS (#pricing — CRISP PEARL PORCELAIN GLASS BAND + SAPPHIRE VIP CARD) ==================== */}
          <section
            id="pricing"
            className="py-12 sm:py-24 relative z-10 bg-gradient-to-b from-[#f3f6fc] via-[#ffffff] to-[#eff4fb] text-slate-900 border-y border-white/80"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
                <div className="text-xs font-extrabold text-amber-700 tracking-wide mb-2">
                  Clear & Transparent Enterprise Pricing
                </div>
                <h2 className="text-2xl sm:text-5xl font-black text-[#081024] tracking-tight text-balance">
                  Choose the Plan That Fits Your Operations
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2.5 sm:mt-3 max-w-xl mx-auto font-semibold">
                  Start with our unrestricted {pricingMetrics.trialDays}-day free trial ($0 today). Continue seamlessly with flexible monthly billing or our discounted annual VIP plan.
                </p>
              </div>

              {/* 3-Step Onboarding Strip */}
              <div className="max-w-4xl mx-auto mb-10 sm:mb-12 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 landing-glass-card-light rounded-2xl p-3 sm:p-4">
                <div className="flex items-center gap-3 px-3 py-2">
                  <span className="w-7 h-7 rounded-lg bg-[#081024] text-amber-300 font-mono text-xs font-black flex items-center justify-center shrink-0 tabular-nums">
                    01
                  </span>
                  <div className="text-xs">
                    <div className="font-extrabold text-[#081024]">Sign Up in 60 Seconds</div>
                    <div className="text-[11px] text-slate-600">No credit card required</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 sm:border-x sm:border-slate-200/90">
                  <span className="w-7 h-7 rounded-lg bg-[#081024] text-amber-300 font-mono text-xs font-black flex items-center justify-center shrink-0 tabular-nums">
                    02
                  </span>
                  <div className="text-xs">
                    <div className="font-extrabold text-[#081024]">Test Everything for {pricingMetrics.trialDays} Days</div>
                    <div className="text-[11px] text-slate-600">100% full modules unlocked</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2">
                  <span className="w-7 h-7 rounded-lg bg-[#081024] text-amber-300 font-mono text-xs font-black flex items-center justify-center shrink-0 tabular-nums">
                    03
                  </span>
                  <div className="text-xs">
                    <div className="font-extrabold text-[#081024]">Easy QR / Wire Activation</div>
                    <div className="text-[11px] text-slate-600">All trial data stays intact</div>
                  </div>
                </div>
              </div>

              {/* Live Currency Preview Switcher (LKR + 5 Major Global Currencies) */}
              <div className="max-w-3xl mx-auto mb-6">
                <CurrencyRateSelector
                  selectedCurrency={displayCurrency}
                  onSelectCurrency={setDisplayCurrency}
                  fxRates={fxRates}
                  isLive={isLiveFx}
                  isRefreshing={isRefreshingFx}
                  onRefreshRates={handleRefreshLandingFx}
                  title="Preview Plans in Your Local Currency (Live FX)"
                />
              </div>

              {/* 3 Pricing Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto items-stretch pt-2 sm:pt-4">
                {/* Card 1: Free Trial */}
                <div className="landing-glass-card-light hover:bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col relative transition-all duration-200">
                  <div className="mb-5 sm:mb-6">
                    <div className="text-xs font-bold text-slate-500">Risk-Free Evaluation</div>
                    <h3 className="text-xl sm:text-2xl font-black text-[#081024] mt-1.5 sm:mt-2">
                      {pricingMetrics.trialDays}-Day Free Trial
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                      Full unrestricted access to evaluate our multi-site inventory & dispatch platform with your team.
                    </p>
                  </div>

                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-[#081024] tabular-nums">
                        {displayCurrency === 'LKR' ? 'Rs. 0' : `${displayCurrencyMeta.symbol}0`}
                      </span>
                      <span className="text-xs font-bold text-slate-500">/ {pricingMetrics.trialDays} days free</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-extrabold mt-2">
                      <CreditCard className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>No credit card required to start</span>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-3.5 mb-6 sm:mb-8 flex-1 text-xs text-slate-800 font-semibold">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5]" />
                      <span>Full access to all Enterprise modules</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5]" />
                      <span>1 Central HQ + {pricingMetrics.includedSiteBranches} Site Branches · Unlimited Teams &amp; Users</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5]" />
                      <span>Client-Supplied Free Stock &amp; Client Register</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5]" />
                      <span>Excel & CSV bulk catalog import</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5]" />
                      <span>Official PDF Issue, DN & Requisition Notes</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5]" />
                      <span>Isolated private tenant database</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSignupOpen(true)}
                    className="w-full py-3.5 bg-[#081024] hover:bg-[#0f1d3d] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-sm whitespace-nowrap"
                  >
                    <span>Start {pricingMetrics.trialDays}-Day Free Trial</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </button>
                </div>

                {/* Card 2: Pro Monthly Plan */}
                <div className="landing-glass-card-light hover:bg-white border-2 border-[#081024]/20 rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col relative transition-all duration-200 shadow-[0_20px_48px_-14px_rgba(8,16,36,0.16)]">
                  <div className="mb-5 sm:mb-6">
                    <div className="text-xs font-extrabold text-sky-700">Standard Monthly Plan</div>
                    <h3 className="text-xl sm:text-2xl font-black text-[#081024] mt-1.5 sm:mt-2">Pro Monthly</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                      Ideal for growing contractors requiring monthly flexibility and continuous multi-site control.
                    </p>
                  </div>

                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-[#081024] tabular-nums">
                        {displayMonthlyPrice}
                      </span>
                      <span className="text-xs font-bold text-slate-500">/ month</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold mt-2 tabular-nums">
                      Includes {pricingMetrics.includedSiteBranches} Sites + HQ · Extra site +{displayExtraSiteMonthly}/mo
                      {displayCurrency !== 'USD' ? ` ($${pricingMetrics.monthlyPriceFormatted} USD)` : ''}
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-3.5 mb-6 sm:mb-8 flex-1 text-xs text-slate-800 font-semibold">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5]" />
                      <span className="font-extrabold text-[#081024]">All Free Trial features included</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5]" />
                      <span>{pricingMetrics.includedSiteBranches} Regional Sites (+{displayExtraSiteMonthly}/mo extra site)</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5]" />
                      <span>Multi-Team Project Usage & Templates</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5]" />
                      <span>Supplier Purchase Orders & GRN Receipts</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5]" />
                      <span>Priority technical email support</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5]" />
                      <span>Cancel or upgrade subscription anytime</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSignupOpen(true)}
                    className="w-full py-3.5 bg-[#081024] hover:bg-[#0f1d3d] text-amber-300 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#081024]/15 transition cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    <span>Select Pro Monthly ({displayMonthlyPrice}/mo)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 3: Pro Annual Plan (FROSTED ROYAL SAPPHIRE & GOLD VIP CARD) */}
                <div className="relative group flex flex-col transition-all duration-200">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300 rounded-2xl sm:rounded-[28px] blur-xs opacity-85 group-hover:opacity-100 transition duration-300" />

                  <div className="relative h-full bg-gradient-to-b from-[#071026]/98 via-[#0c1a3a]/98 to-[#060c1d]/98 backdrop-blur-2xl rounded-2xl sm:rounded-[26px] p-5 sm:p-8 flex flex-col border border-amber-300/45 shadow-[0_28px_64px_-16px_rgba(3,7,18,0.65),inset_0_1px_0_rgba(255,255,255,0.22)]">
                    <div className="mb-5 sm:mb-6 relative z-10">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>Flagship Enterprise VIP</span>
                        </span>
                        <span className="text-xs font-black text-amber-200">
                          Save {pricingMetrics.annualSavingsPercent}%
                        </span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white mt-1.5 sm:mt-2 tracking-tight">
                        Pro Annual
                      </h3>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        Built for established contractors. Pay once for 12 months with maximum cost savings & VIP engineering onboarding.
                      </p>
                    </div>

                    <div className="mb-6 sm:mb-8 relative z-10">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-200 tabular-nums">
                          {displayAnnualPrice}
                        </span>
                        <span className="text-xs font-bold text-slate-300">/ year</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-amber-200 text-[11px] font-bold tabular-nums">
                        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>
                          Only ~{displayAnnualMonthlyEqv}/month · Save {displayAnnualSavings} every year
                          {displayCurrency !== 'USD' ? ` ($${pricingMetrics.annualPriceClean} USD)` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3.5 mb-8 flex-1 text-xs text-slate-200 relative z-10">
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.5]" />
                        <span className="font-bold text-white">All Pro Monthly features included</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.5]" />
                        <span className="text-amber-200 font-semibold">
                          Save {pricingMetrics.annualSavingsPercent}% compared to monthly billing
                        </span>
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
                      className="w-full py-4 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-[#071026] font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 ring-1 ring-white/45 transition-all duration-200 cursor-pointer active:scale-95 relative z-10 whitespace-nowrap"
                    >
                      <Crown className="w-4 h-4 fill-[#071026]" />
                      <span>Select Pro Annual (Save {pricingMetrics.annualSavingsPercent}%)</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ==================== COMPACT 3-STEP VISUAL FLOW STRIP (RIGHT BEFORE COMPARISON) ==================== */}
              <div className="mt-14 sm:mt-18 rounded-2xl sm:rounded-[26px] bg-gradient-to-br from-[#071026] via-[#0c1a3d] to-[#060d20] text-white border border-amber-300/35 shadow-[0_24px_60px_-18px_rgba(3,7,18,0.65)] p-5 sm:p-7 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/85 to-transparent" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3.5 border-b border-white/12">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                      How ApexStox Works in 3 Simple Steps
                    </div>
                    <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight mt-0.5">
                      From Central Store Setup to ISO 9001:2015 Site Reconciliation
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/15 border border-amber-300/35 text-[11px] font-extrabold text-amber-200 whitespace-nowrap self-start sm:self-center">
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    <span>1 HQ + {pricingMetrics.includedSiteBranches} Sites + Unlimited Users &amp; Teams</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative">
                  {/* Step 1 */}
                  <div className="rounded-2xl bg-white/[0.06] border border-white/14 p-4 sm:p-5 flex flex-col justify-between relative">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-2 text-xs font-black text-amber-300">
                          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-[#071026] font-mono text-xs font-black flex items-center justify-center shadow-sm">
                            01
                          </span>
                          <span>Setup &amp; Hierarchy</span>
                        </span>
                        <Building2 className="w-4 h-4 text-sky-300 shrink-0" />
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-white leading-snug">
                        Central Store + 2-Tier or 3-Tier Sites
                      </h4>
                      <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                        Run <strong className="text-white">2-Tier</strong> (Store &rarr; Site/Crew) or <strong className="text-white">3-Tier</strong> (Central HQ &rarr; Regional Site &rarr; Sub-Site &rarr; Crew) — includes <strong className="text-amber-300">1 HQ + {pricingMetrics.includedSiteBranches} Sites + Unlimited Users/Teams</strong>.
                      </p>
                    </div>
                    <div className="hidden lg:flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#08122b] border border-amber-300/60 text-amber-300 shadow">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="rounded-2xl bg-white/[0.06] border border-white/14 p-4 sm:p-5 flex flex-col justify-between relative">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-2 text-xs font-black text-amber-300">
                          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-[#071026] font-mono text-xs font-black flex items-center justify-center shadow-sm">
                            02
                          </span>
                          <span>Issue &amp; Daily Usage</span>
                        </span>
                        <ClipboardCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-white leading-snug">
                        Issue Stock &amp; Log Daily Progress
                      </h4>
                      <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                        Dispatch to sites &amp; crews and record <strong className="text-white">Installed Qty + Wastage Qty</strong> separately alongside <strong className="text-amber-300">Client FOC tracking</strong>.
                      </p>
                    </div>
                    <div className="hidden lg:flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#08122b] border border-amber-300/60 text-amber-300 shadow">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="rounded-2xl bg-white/[0.06] border border-white/14 p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-2 text-xs font-black text-amber-300">
                          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-[#071026] font-mono text-xs font-black flex items-center justify-center shadow-sm">
                            03
                          </span>
                          <span>Returns &amp; ISO Reports</span>
                        </span>
                        <div className="flex items-center gap-1.5 text-amber-300 shrink-0">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <Printer className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-white leading-snug">
                        Upstream Returns &amp; ISO 9001:2015 PDFs
                      </h4>
                      <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                        Reconcile <strong className="text-white">upstream returns</strong> (Crew &rarr; Sub-Site &rarr; Regional &rarr; HQ) and print <strong className="text-amber-300">ISO 9001:2015 Vouchers &amp; Reports</strong> with Digital or Wet-Ink Signature blocks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ==================== GLOBAL COMPETITOR & ALL-FEATURES COMPARISON MATRIX ==================== */}
              <div
                id="global-comparison"
                className="mt-10 sm:mt-14 rounded-2xl sm:rounded-[30px] bg-gradient-to-br from-[#060c1d] via-[#0b1736] to-[#071026] text-white border border-white/18 shadow-[0_32px_80px_-20px_rgba(3,7,18,0.8)] p-5 sm:p-8 lg:p-10 relative overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

                {/* Executive Header */}
                <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-10">
                  <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-amber-300 tracking-wide mb-3">
                    <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Spreadsheets / Manual Tracking &amp; Global Apps vs. ApexStox ({comparisonRows.length} Capabilities)</span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl lg:text-[42px] font-black text-white tracking-tight leading-tight text-balance">
                    Spreadsheets &amp; Generic Retail Apps Can&apos;t Stop Field Stock Loss—<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200">ApexStox Does</span>
                  </h3>
                  <p className="text-sm sm:text-base text-slate-200 mt-3.5 leading-relaxed max-w-3xl mx-auto font-medium">
                    Whether you are struggling with <strong className="text-white">Excel sheets, WhatsApp &amp; paper slips</strong> or paying <span className="text-rose-300 font-bold">$150–$400+/mo</span> for retail apps like <strong className="text-white">Sortly, Zoho, inFlow, or Cin7</strong>, none give you 2-tier/3-tier site flexibility, Installed vs. Wastage/Offcut tracking, Client FOC reconciliation, upstream returns, or ISO 9001:2015 A4/PDF vouchers across all 11 contracting trades.{' '}
                    <strong className="text-amber-300">
                      ApexStox includes {pricingMetrics.includedSiteBranches} Sites + HQ (+${pricingMetrics.extraSiteMonthlyPriceClean}/mo extra site) and Unlimited Users/Teams for ${pricingMetrics.monthlyPriceFormatted}/mo (${pricingMetrics.annualPriceClean}/year).
                    </strong>
                  </p>
                </div>

                {/* Visual Annual Cost Comparison Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5 mb-8 sm:mb-10">
                  {/* ApexStox Winner Card */}
                  <div className="rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-[#071026] p-4 shadow-xl border border-white/60 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-[#071026]/85">
                        ★ Best Value Worldwide
                      </div>
                      <div className="text-base font-black text-[#071026] mt-1">ApexStox VIP</div>
                      <div className="text-2xl font-black font-mono tabular-nums text-[#071026] mt-2">
                        ${pricingMetrics.annualPriceClean}<span className="text-xs font-extrabold">/yr</span>
                      </div>
                      <div className="text-xs font-extrabold text-[#071026]/90 font-mono tabular-nums mt-0.5">
                        (~${pricingMetrics.annualMonthlyEquivalentFormatted}/mo · ${pricingMetrics.monthlyPriceFormatted}/mo)
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#071026]/20 text-[11.5px] font-bold text-[#071026] space-y-1 leading-snug">
                      <div>✓ Unlimited Users &amp; Teams</div>
                      <div>✓ {pricingMetrics.includedSiteBranches} Sites + HQ (+${pricingMetrics.extraSiteMonthlyPriceClean}/mo extra)</div>
                      <div>✓ ISO 9001:2015 PDF · {pricingMetrics.trialDays}-Day Free Trial</div>
                    </div>
                  </div>

                  {/* Spreadsheets / Manual Tracking */}
                  <div className="rounded-2xl bg-rose-500/[0.08] border border-rose-400/30 p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-rose-300">Manual Baseline</div>
                      <div className="text-base font-extrabold text-white mt-0.5">Excel / Paper &amp; Chat</div>
                      <div className="text-xl font-black font-mono tabular-nums text-rose-300 mt-2">
                        High Hidden Loss
                      </div>
                      <div className="text-[11.5px] text-slate-200 font-medium mt-0.5">(Lost stock &amp; rework hours)</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 text-[11.5px] text-slate-200 space-y-1 leading-snug">
                      <div className="flex items-start gap-1.5"><span className="text-rose-400 font-black">✗</span><span>Unexplained crew stock loss</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-rose-400 font-black">✗</span><span>Zero Installed vs. Wastage split</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-rose-400 font-black">✗</span><span>Fails Client FOC &amp; QA audits</span></div>
                    </div>
                  </div>

                  {/* Sortly */}
                  <div className="rounded-2xl bg-white/[0.05] border border-white/14 p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-300">Visual Asset Tracker</div>
                      <div className="text-base font-extrabold text-white mt-0.5">Sortly (Ultra / Ent.)</div>
                      <div className="text-xl font-black font-mono tabular-nums text-rose-400 mt-2">
                        ~$1,788+<span className="text-xs font-semibold text-slate-300">/yr</span>
                      </div>
                      <div className="text-[11.5px] text-slate-200 font-mono tabular-nums mt-0.5">($149 – $299+ / month)</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 text-[11.5px] text-slate-200 space-y-1 leading-snug">
                      <div className="flex items-start gap-1.5"><span className="text-rose-400 font-black">✗</span><span>Capped at 5–8 users (+$20/mo/seat)</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-rose-400 font-black">✗</span><span>No Crew In-Hand or Client FOC</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-rose-400 font-black">✗</span><span>No Trade Presets or Wastage</span></div>
                    </div>
                  </div>

                  {/* Zoho Inventory */}
                  <div className="rounded-2xl bg-white/[0.05] border border-white/14 p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-300">Retail / E-Commerce App</div>
                      <div className="text-base font-extrabold text-white mt-0.5">Zoho Inventory</div>
                      <div className="text-xl font-black font-mono tabular-nums text-rose-400 mt-2">
                        ~$1,548+<span className="text-xs font-semibold text-slate-300">/yr</span>
                      </div>
                      <div className="text-[11.5px] text-slate-200 font-mono tabular-nums mt-0.5">($129 – $249+ / month)</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 text-[11.5px] text-slate-200 space-y-1 leading-snug">
                      <div className="flex items-start gap-1.5"><span className="text-rose-400 font-black">✗</span><span>Capped at 2–5 users &amp; branches</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-rose-400 font-black">✗</span><span>Built for online shops, not sites</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-rose-400 font-black">✗</span><span>No FOC pools or Team custody</span></div>
                    </div>
                  </div>

                  {/* inFlow / Cin7 Core */}
                  <div className="rounded-2xl bg-white/[0.05] border border-white/14 p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-300">Wholesale Warehouse</div>
                      <div className="text-base font-extrabold text-white mt-0.5">inFlow / Cin7 Core</div>
                      <div className="text-xl font-black font-mono tabular-nums text-rose-400 mt-2">
                        ~$2,388+<span className="text-xs font-semibold text-slate-300">/yr</span>
                      </div>
                      <div className="text-[11.5px] text-slate-200 font-mono tabular-nums mt-0.5">($199 – $399+ / month)</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 text-[11.5px] text-slate-200 space-y-1 leading-snug">
                      <div className="flex items-start gap-1.5"><span className="text-rose-400 font-black">✗</span><span>2–5 user cap (+$39/mo/user &amp; site)</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-rose-400 font-black">✗</span><span>No Field Crew issue/return loop</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-rose-400 font-black">✗</span><span>No Custom PDF stationery upload</span></div>
                    </div>
                  </div>

                  {/* Legacy Construction ERP */}
                  <div className="rounded-2xl bg-white/[0.05] border border-white/14 p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-300">Heavy Legacy ERP</div>
                      <div className="text-base font-extrabold text-white mt-0.5">Procore / SAP / NetSuite</div>
                      <div className="text-xl font-black font-mono tabular-nums text-rose-400 mt-2">
                        $10,000+<span className="text-xs font-semibold text-slate-300">/yr</span>
                      </div>
                      <div className="text-[11.5px] text-slate-200 font-mono tabular-nums mt-0.5">(+ $5,000+ Consultant Setup)</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 text-[11.5px] text-slate-200 space-y-1 leading-snug">
                      <div className="flex items-start gap-1.5"><span className="text-rose-400 font-black">✗</span><span>$75–$150+/mo per user &amp; site</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-rose-400 font-black">✗</span><span>Paid consultants for changes</span></div>
                      <div className="flex items-start gap-1.5"><span className="text-rose-400 font-black">✗</span><span>Locked into multi-year contracts</span></div>
                    </div>
                  </div>
                </div>

                {/* Interactive Category Filter Buttons for the Feature Matrix */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-5 pb-4 border-b border-white/15">
                  <div className="text-left">
                    <h4 className="text-base sm:text-lg font-black text-white">
                      Spreadsheets / Manual Tracking vs. ApexStox &amp; Global Apps ({comparisonRows.length} Capabilities)
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-200 mt-0.5">
                      Compare 2-tier/3-tier sites, Installed vs. Wastage tracking, Client FOC, upstream returns, 20-site scale &amp; ISO 9001:2015 PDFs:
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: 'all', label: `All Features (${comparisonRows.length})` },
                      { id: 'pricing', label: 'Pricing & Scale' },
                      { id: 'warehouse', label: 'Warehouse, PO & FOC' },
                      { id: 'field', label: 'Site & Field Crews' },
                      { id: 'projects', label: 'Projects & All 11 Trades' },
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
                        className={`px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
                          comparisonCategory === tab.id
                            ? 'bg-gradient-to-r from-amber-300 to-amber-400 text-[#071026] shadow-sm'
                            : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-100 border border-white/12'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Responsive Comparison Table */}
                <div className="overflow-x-auto rounded-2xl border border-white/15 bg-[#040917]/90 shadow-inner">
                  <table className="w-full text-left border-collapse min-w-[1080px]">
                    <thead>
                      <tr className="bg-white/[0.06] border-b border-white/15 text-xs sm:text-[13px] font-black text-slate-100">
                        <th className="py-4 px-4 w-[30%]">
                          System Capability / Operational Challenge ({filteredComparisonRows.length})
                        </th>
                        <th className="py-4 px-4 w-[16%] bg-gradient-to-r from-amber-300 to-amber-400 text-[#071026] font-black">
                          <div className="flex items-center gap-1.5">
                            <Crown className="w-4 h-4 fill-[#071026] shrink-0" />
                            <span>ApexStox (${pricingMetrics.monthlyPriceFormatted}/mo)</span>
                          </div>
                        </th>
                        <th className="py-4 px-4 w-[15%] bg-rose-500/12 text-rose-200 border-r border-white/10">
                          Spreadsheets / Manual Slips
                        </th>
                        <th className="py-4 px-4 w-[13%] text-slate-100">
                          Sortly ($149+/mo)
                        </th>
                        <th className="py-4 px-4 w-[13%] text-slate-100">
                          Zoho Inventory ($99+/mo)
                        </th>
                        <th className="py-4 px-4 w-[13%] text-slate-100">
                          inFlow / Cin7 ($199+/mo)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-xs sm:text-[13px]">
                      {filteredComparisonRows.map((row, idx) => {
                        const renderCompetitorCell = (val: string) => {
                          const trimmed = val.trim();
                          if (trimmed.startsWith('✕') || trimmed.startsWith('✗') || trimmed.startsWith('❌')) {
                            const textPart = trimmed.replace(/^[✕✗❌]\s*/, '');
                            return (
                              <div className="flex items-start gap-2">
                                <span
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-rose-500/20 border border-rose-500/45 text-rose-400 font-black text-xs leading-none shrink-0 mt-0.5"
                                  aria-label="Missing or Capped Feature"
                                >
                                  ✗
                                </span>
                                <span className="text-slate-100 font-semibold leading-relaxed">{textPart}</span>
                              </div>
                            );
                          }
                          if (trimmed.startsWith('◐')) {
                            const textPart = trimmed.replace(/^◐\s*/, '');
                            return (
                              <div className="flex items-start gap-2">
                                <span
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black text-xs leading-none shrink-0 mt-0.5"
                                  aria-label="Partial Support"
                                >
                                  ◐
                                </span>
                                <span className="text-slate-200 font-medium leading-relaxed">{textPart}</span>
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
                                <span className="text-slate-100 font-medium leading-relaxed">{textPart}</span>
                              </div>
                            );
                          }
                          return <span className="text-slate-100 font-semibold leading-relaxed">{val}</span>;
                        };

                        return (
                          <tr
                            key={row.feature}
                            className={`transition-colors ${
                              row.isSpecialHighlight
                                ? 'bg-white/[0.045] hover:bg-white/[0.08]'
                                : idx % 2 === 0
                                ? 'bg-transparent hover:bg-white/[0.05]'
                                : 'bg-white/[0.02] hover:bg-white/[0.06]'
                            }`}
                          >
                            <td className="py-3.5 px-4 align-top">
                              <div className="flex items-center gap-2 text-xs font-bold text-sky-300 mb-1">
                                <span>{row.categoryLabel}</span>
                                {row.isSpecialHighlight && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-amber-300 font-extrabold">★ Exclusive Advantage</span>
                                  </>
                                )}
                              </div>
                              <div className="font-extrabold text-white text-sm sm:text-[15px] leading-snug">
                                {row.feature}
                              </div>
                              <div className="text-xs sm:text-[13px] text-slate-200/90 mt-1.5 leading-relaxed">
                                {row.detail}
                              </div>
                            </td>

                            {/* Apex Stock Highlighted Column */}
                            <td className="py-3.5 px-4 align-middle bg-emerald-500/10 border-x border-emerald-500/30 font-bold text-emerald-300 text-xs sm:text-sm leading-relaxed">
                              {(() => {
                                const rawApex = row.apex.trim();
                                if (rawApex.startsWith('✓')) {
                                  const rest = rawApex.replace(/^✓\s*/, '');
                                  return (
                                    <div className="flex items-start gap-2">
                                      <span
                                        className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/25 border border-emerald-400/60 text-emerald-300 font-black text-xs leading-none shrink-0 mt-0.5"
                                        aria-label="Included"
                                      >
                                        ✓
                                      </span>
                                      <span className="text-emerald-200 font-bold leading-relaxed">{rest}</span>
                                    </div>
                                  );
                                }
                                return <span className="text-emerald-200 font-bold leading-relaxed">{row.apex}</span>;
                              })()}
                            </td>

                            {/* Excel / Manual Tracking Highlighted Pain Column */}
                            <td className="py-3.5 px-4 align-middle bg-rose-500/[0.05] border-r border-white/10 text-slate-200 font-medium text-xs sm:text-[13px]">
                              {renderCompetitorCell(row.manual)}
                            </td>

                            {/* Sortly */}
                            <td className="py-3.5 px-4 align-middle text-slate-200 font-medium text-xs sm:text-[13px]">
                              {renderCompetitorCell(row.sortly)}
                            </td>

                            {/* Zoho */}
                            <td className="py-3.5 px-4 align-middle text-slate-200 font-medium text-xs sm:text-[13px]">
                              {renderCompetitorCell(row.zoho)}
                            </td>

                            {/* inFlow / Cin7 */}
                            <td className="py-3.5 px-4 align-middle text-slate-200 font-medium text-xs sm:text-[13px]">
                              {renderCompetitorCell(row.inflowCin7)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 12 Small-Yet-Special Micro-Features Spotlight Grid */}
                <div className="mt-8 sm:mt-10 pt-7 border-t border-white/15">
                  <div className="text-center max-w-3xl mx-auto mb-6">
                    <div className="text-xs sm:text-sm font-extrabold text-amber-300 mb-1.5">
                      Thoughtful Field-Engineered Details You Won&apos;t Find Anywhere Else
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      12 Small-Yet-Special Features Built for Real Daily Site Challenges
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-200 mt-1.5">
                      Every micro-feature in Apex Stock was designed around real warehouse storekeepers, site supervisors, and field crew leaders:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                    {microFeaturesSpotlight.map((mf, i) => (
                      <div
                        key={mf.title}
                        className="rounded-xl bg-white/[0.05] border border-white/14 p-4 text-left hover:border-amber-400/50 hover:bg-white/[0.08] transition"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono font-black text-amber-400 tabular-nums">
                            {String(i + 1).padStart(2, '0')}.
                          </span>
                          <h5 className="text-sm font-extrabold text-white leading-snug">
                            {mf.title}
                          </h5>
                        </div>
                        <p className="text-xs sm:text-[13px] text-slate-200/90 leading-relaxed">
                          {mf.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Decision Banner inside Comparison */}
                <div className="mt-8 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300 text-[#071026] p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                  <div className="text-center md:text-left">
                    <div className="text-base sm:text-xl font-black text-[#071026]">
                      Get Every Single Feature Above for $0 Today ({pricingMetrics.trialDays}-Day Unrestricted Free Trial)
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-[#071026]/90 mt-1">
                      Then just <span className="underline font-black">${pricingMetrics.monthlyPriceFormatted}/month</span> or <span className="underline font-black">${pricingMetrics.annualPriceClean}/year</span> — Unlimited Users &amp; Teams, {pricingMetrics.includedSiteBranches} Site Branches + HQ included (+${pricingMetrics.extraSiteMonthlyPriceClean}/mo extra site).
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsSignupOpen(true)}
                      className="px-5 py-3 rounded-xl bg-[#071026] hover:bg-[#0d1b3e] text-amber-300 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition cursor-pointer whitespace-nowrap"
                    >
                      <span>Start Your {pricingMetrics.trialDays}-Day Free Trial Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenGuideTab}
                      className="px-4 py-3 rounded-xl bg-white/95 hover:bg-white text-[#071026] font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>View Full User Guide</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Method Notice */}
              <div className="mt-10 max-w-2xl mx-auto landing-glass-card-light rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-700 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#081024] flex items-center justify-center text-amber-400 shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-[#081024] block">Easy Bank Payments & QR Wire Transfer</span>
                    <span className="font-medium">Instant activation via Bank QR or direct wire transfer slip upload.</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsSignupOpen(true)}
                  className="px-4 py-2.5 bg-[#081024] hover:bg-[#0f1d3d] text-amber-300 rounded-xl font-bold text-xs shrink-0 transition cursor-pointer whitespace-nowrap"
                >
                  Start Free Trial First
                </button>
              </div>
            </div>
          </section>

          {/* ==================== SECTION 5: FAQ (#faq — FROSTED ROYAL SAPPHIRE GLASS) ==================== */}
          <section
            id="faq"
            className="py-12 sm:py-22 relative z-10"
          >
            <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
                <div className="text-xs font-extrabold text-amber-300 tracking-wide mb-2">
                  Frequently Asked Questions
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Everything You Need to Know
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium">
                  Answers to common questions about the {pricingMetrics.trialDays}-day free trial, Client-Supplied Free Stock, multi-tenancy, and billing.
                </p>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="landing-glass-card hover:bg-white/[0.08] rounded-2xl overflow-hidden transition"
                  >
                    <button
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="w-full px-4 sm:px-6 py-3.5 sm:py-4 text-left font-extrabold text-xs sm:text-sm text-white flex justify-between items-center gap-3 sm:gap-4 cursor-pointer hover:text-amber-300 transition"
                    >
                      <span className="leading-snug">{faq.q}</span>
                      <div className="w-7 h-7 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center shrink-0">
                        {activeFaq === idx ? (
                          <ChevronUp className="w-4 h-4 text-amber-400" />
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
              <div className="mt-8 sm:mt-10 text-center p-4 sm:p-6 landing-glass-card rounded-2xl">
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
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 hover:from-amber-200 hover:to-amber-300 text-[#071026] text-xs font-black flex items-center gap-1.5 cursor-pointer transition shadow-md shadow-amber-500/20"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open User Guide & PDF</span>
                  </button>
                  <a
                    href="mailto:support@apexstox.com"
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-100 hover:text-amber-300 transition-colors"
                  >
                    <span>Contact Support: support@apexstox.com</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ==================== FOOTER (FROSTED ROYAL SAPPHIRE GLASS) ==================== */}
      <footer className="mt-auto border-t border-white/12 bg-[#050a18]/85 backdrop-blur-2xl py-8 sm:py-10 px-3 sm:px-6 lg:px-8 relative z-10 no-print">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 flex items-center justify-center shadow-sm shrink-0">
                <Boxes className="w-4 h-4 text-[#071026] stroke-[2.25]" />
              </div>
              <div>
                <span
                  className="font-extrabold text-base tracking-[-0.02em] inline-flex items-baseline"
                  style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
                >
                  <span className="text-white">Apex</span>
                  <span className="text-amber-300">Stox</span>
                  <span className="text-slate-300 font-semibold text-xs ml-1.5">Enterprise SaaS</span>
                </span>
                <span className="text-[11px] text-slate-300 block font-medium">
                  Centralized Multi-Site Inventory, Project Materials &amp; Field Crew Dispatch
                </span>
              </div>
            </div>

            {/* Standard Legal & Documentation Links */}
            <nav
              aria-label="Footer Legal & Documentation Links"
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-200"
            >
              <button
                type="button"
                onClick={handleOpenGuideTab}
                className="hover:text-amber-300 hover:underline underline-offset-4 transition cursor-pointer whitespace-nowrap"
              >
                User Guide
              </button>
              <button
                type="button"
                onClick={() => handleOpenPolicyTab('privacy')}
                className={`hover:text-amber-300 hover:underline underline-offset-4 transition cursor-pointer whitespace-nowrap ${
                  activeLandingTab === 'privacy' ? 'text-amber-300 underline' : ''
                }`}
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => handleOpenPolicyTab('refund')}
                className={`hover:text-amber-300 hover:underline underline-offset-4 transition cursor-pointer whitespace-nowrap ${
                  activeLandingTab === 'refund' ? 'text-amber-300 underline' : ''
                }`}
              >
                Refund Policy
              </button>
              <button
                type="button"
                onClick={() => handleOpenPolicyTab('terms')}
                className={`hover:text-amber-300 hover:underline underline-offset-4 transition cursor-pointer whitespace-nowrap ${
                  activeLandingTab === 'terms' ? 'text-amber-300 underline' : ''
                }`}
              >
                Terms &amp; Conditions
              </button>
              <a
                href="mailto:support@apexstox.com"
                className="hover:text-amber-300 hover:underline underline-offset-4 transition whitespace-nowrap"
              >
                support@apexstox.com
              </a>
            </nav>
          </div>

          <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="font-semibold text-slate-300">
              ApexStox SaaS © {new Date().getFullYear()} · All Rights Reserved
            </div>
            <div className="text-[11px] text-amber-300 font-extrabold">
              Apex Developer | System Developed By Sasith Dissanayake
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 px-3.5 py-3 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 rounded-2xl shadow-[0_10px_25px_rgba(251,191,36,0.4)] border border-amber-200/80 flex items-center gap-2 font-black text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="Back to Top"
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
          <span className="hidden sm:inline tracking-wide">Back to Top</span>
        </button>
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
