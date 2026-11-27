import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import {
  ArrowLeft,
  Download,
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
  Upload,
  Award,
  Globe,
} from 'lucide-react';
import { printHtmlElement } from '../../utils/printUtils';

interface SystemUserGuideViewProps {
  onBackToOverview: () => void;
  onOpenSignup?: () => void;
  onOpenLogin?: () => void;
  initialLanguage?: GuideLanguage;
  isInsideWorkspaceModal?: boolean;
}

type GuideLanguage = 'en' | 'si';

interface GuideChapter {
  id: string;
  number: string;
  category: 'setup' | 'warehouse' | 'operations' | 'projects' | 'formats' | 'admin';
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

interface FormatSlotGuide {
  code: string;
  title: string;
  structure: string;
  affectsTo: string[];
}

interface FeatureSummaryGroup {
  group: string;
  items: string[];
}

// ==================== ENGLISH GUIDE CONTENT (12 CHRONOLOGICAL CHAPTERS) ====================
const GUIDE_CHAPTERS_EN: GuideChapter[] = [
  {
    id: 'ch-01',
    number: 'Chapter 01',
    category: 'setup',
    categoryLabel: 'Step 01 · Workspace Registration',
    title: 'Create Your Company Workspace (Auto View-Only Slug & All-Countries Setup)',
    summary:
      'Launch an isolated cloud workspace for your company in under 60 seconds with automatic non-editable workspace identification, global country support, and verified Super Admin identity.',
    icon: Globe,
    steps: [
      {
        stepTitle: '1. Auto-Generated View-Only Workspace Slug & Searchable All-Countries Picker',
        detail:
          'Click "Start 7-Day Free Trial" and enter your Company Name — the Workspace Slug / Identifier (app/...) is generated automatically as strictly View-Only so workspace IDs never break or conflict. Search and select your Operating Country from all ~197 countries of the world (by name, ISO code, or +dialCode), automatically matching default currency and phone number rules.',
      },
      {
        stepTitle: '2. Mandatory Super Admin Real Name, Included Capacity & First-Name Login Check',
        detail:
          'Enter the Super Admin\'s real Personal Full Name (generic names like "Admin" are rejected), Email, and Password. Every plan includes Unlimited Users, Unlimited Field Teams, 1 Central HQ Warehouse, and 20 Site Branches (+$10/mo per extra site). At login, Super Admin credentials verify the person\'s First Name and stamp Audit Trail & Vouchers as "[Name] (as Super Admin)".',
      },
    ],
    keyOutputs: [
      'Auto-Generated View-Only Workspace Slug (app/...)',
      'Searchable All-Countries Picker (~197 Countries) + Currency Sync',
      '1 Central HQ + 20 Branches + Unlimited Users & Field Teams',
    ],
  },
  {
    id: 'ch-02',
    number: 'Chapter 02',
    category: 'setup',
    categoryLabel: 'Step 02 · Head Office Master Registry',
    title: 'Head Office Registers Items, Suppliers (Payment Terms) & Clients',
    summary:
      'Master catalog registration is strictly controlled by Head Office (Main Admin) to keep codes, prices, photos, vendor terms, and client lists clean and uniform.',
    icon: Boxes,
    steps: [
      {
        stepTitle: '1. Head Office Adds Materials, Plant & Tools (<200KB Photos + Single-Shot Scanner)',
        detail:
          'Only Head Office (Main Admin) creates and manages "Master Registrations -> Item Catalog" (or imports via Excel/CSV). Optionally attach an Item Photo — automatically compressed under 200KB — which displays inside Item Catalog, PO, Requisition, and Return dropdowns, and can be printed using "Print with Image". Mobile Camera & USB Barcode scanners capture once and auto-stop to prevent duplicate scans.',
      },
      {
        stepTitle: '2. Register Approved Suppliers (With Payment Terms) & Project Clients',
        detail:
          'Add Suppliers with Contact, Email, Tax/BRN, and Payment Terms (Net 15, Net 30, Net 60, Advance 50% / Balance on Delivery, Cash on Delivery, or Immediate Bank Transfer) for Purchase Orders & Debit Notes. Register Clients / Principals separately so every project and Client Free Stock (FOC) batch traces back cleanly.',
      },
    ],
    keyOutputs: [
      'Head Office-Controlled Sequential 0001 Item Catalog & Machinery Registry',
      '<200KB Auto-Compressed Item Photos & Single-Shot Barcode Scanner',
      'Approved Supplier Terms Directory & Client Registry',
    ],
  },
  {
    id: 'ch-03',
    number: 'Chapter 03',
    category: 'setup',
    categoryLabel: 'Step 03 · 3-Tier Branches & Branch-Assigned Projects',
    title: 'Set Up Regional Branches, Sub-Sites (With Lock) & Assign Projects to Branches',
    summary:
      'Build your 3-Tier warehouse hierarchy (Main HQ -> Regional Branches -> Optional Sub-Sites) and bind each Project cleanly to its executing Site Branch.',
    icon: FolderKanban,
    steps: [
      {
        stepTitle: '1. 3-Tier Branches (Main HQ -> Regional -> Optional Sub-Site) & Sub-Site Protection Lock',
        detail:
          'Under "Master Registrations -> Sites / Branches", Head Office creates Regional Branches under Central Main Warehouse, plus optional child Sub-Site Branches nested beneath a Regional Branch. PROTECTION RULE: Once any stock dispatch, Client FOC allocation, team issue, usage, or return exists on a Sub-Site, deleting that Sub-Site OR changing its Parent Regional Branch is permanently LOCKED.',
      },
      {
        stepTitle: '2. Assigning Projects to Branches ("Assigned Site Branch *" or "ALL AREAS") + Custom Fields',
        detail:
          'In "Project & New Section Registry", load 1-click International Templates (Telecom FTTH, Water Supply, Electrical Power, Solar PV, or EPC) and add custom fields with "+ Add Field". When registering any Standalone Project, Main Project, or Under Main Project, you assign it to a specific Regional/Sub-Site Branch — or pick "🌐 ALL AREAS (All Site Branches)" for island-wide contracts usable by any branch.',
      },
    ],
    keyOutputs: [
      '3-Tier Branch Hierarchy (HQ -> Regional -> Optional Sub-Site) + Sub-Site Stock/FOC Lock',
      'Branch-Locked Project Assignment + "ALL AREAS" Multi-Site Support',
      'Telecom, Water, Electrical & Solar Templates + "+ Add Field" Builder',
    ],
  },
  {
    id: 'ch-04',
    number: 'Chapter 04',
    category: 'setup',
    categoryLabel: 'Step 04 · Teams Governance & Locks',
    title: 'Head Office Registers Teams (Mandatory Section), Staff View-Only & Delete/Rename Lock',
    summary:
      'Field Teams can ONLY be created, edited, or deleted by Head Office — ensuring every team belongs to a verified Project Section and cannot be deleted once stock is issued.',
    icon: Lock,
    steps: [
      {
        stepTitle: '1. Staff Users Cannot Register Teams (View-Only Except Main Admin) & Mandatory Section Selection',
        detail:
          'Creating, editing, or deleting Field Teams is exclusive to Head Office (Main Admin). Regional and Sub-Site Staff Users CANNOT register or alter teams — they see Teams as View-Only. When registering ANY Field Team, Head Office MUST select its Assigned Project Section (New Connection, Cable, Civil, Water, Electrical, Solar). A crew working across two sections must be registered separately with distinct names (e.g., "Alex NC Team 1" & "Alex Civil Team 1").',
      },
      {
        stepTitle: '2. Non-Deletable After Stock Issue, Name Lock & 0 In-Hand Balance Section Switch Lock',
        detail:
          'CRITICAL PROTECTION RULE: Once stock or tools are issued to a Field Team (or the team has any stock ledger activity), that Team CANNOT be deleted or renamed — preserving full audit custody forever. Furthermore, a team\'s Project Section is LOCKED while it holds any In-Hand Stock (> 0 units); once balanced to 0 via Material Usage or Team Returns, section switching unlocks automatically.',
      },
    ],
    keyOutputs: [
      'Head Office-Only Team Registration (View-Only for All Staff Users)',
      'Mandatory Project Section Selection + Separate Multi-Section Team Naming',
      'Delete & Rename Blocked After Stock Issue + 0-Balance Section Switch Lock',
    ],
  },
  {
    id: 'ch-05',
    number: 'Chapter 05',
    category: 'setup',
    categoryLabel: 'Step 05 · User / Manager Branch Assignment',
    title: 'Assign Staff Users & Site Managers to Branches + Full Site Assignment History',
    summary:
      'Create unlimited user logins across HQ, Regional, and Sub-Site tiers while automatically maintaining a complete assignment timeline whenever staff move between sites.',
    icon: UserCheck,
    steps: [
      {
        stepTitle: '1. Create Staff & Site Manager Logins Across Single, Multi-Site or All-Site Access',
        detail:
          'In "User Management", Head Office creates unlimited accounts ("Super Admin Central", "All Site Branch Admin", "Branch Admin" with authority over child Sub-Sites, and "Branch System User") and assigns them to specific Regional or Sub-Site branches. Includes 1-click "Send Verification Email" via apexstox.com.',
      },
      {
        stepTitle: '2. Automatic User & Supervisor Site Assignment History (Previous Sites, Start & End Dates)',
        detail:
          'Whenever any Staff User or Site Supervisor/Manager is transferred or reassigned to a different Site Branch, the system automatically logs a permanent Assigned Sites History record showing every Previous Site, exact Start Date, and End Date — making staff custody audits effortless.',
      },
    ],
    keyOutputs: [
      'Unlimited Role-Based User & Site Manager Accounts (Single / Multi / All Sites)',
      'Assigned Sites History Tracking Previous Sites, Start Dates & End Dates',
      '1-Click Email Verification via apexstox.com',
    ],
  },
  {
    id: 'ch-06',
    number: 'Chapter 06',
    category: 'warehouse',
    categoryLabel: 'Step 06 · PO, GRN & Client FOC Auto-Detect',
    title: 'Send Purchase Orders (PO), Receive GRN into Main HQ & Log Client FOC (Auto Branch Lock)',
    summary:
      'Order vendor materials into Central Main Warehouse, or receive client-supplied free materials with automatic project-to-branch detection and locking.',
    icon: Gift,
    steps: [
      {
        stepTitle: '1. Issue Official Supplier Purchase Orders (PO) & Receive Multi-Item GRNs into Main Stock',
        detail:
          'In "Supplier Orders (PO)", generate sequential 0001-numbered Purchase Orders showing Item Images, agreed Supplier Payment Terms, taxes, and 3 approval signature blocks. When deliveries arrive at Main Warehouse, confirm full or partial Goods Received Notes (GRN) to add all items into Main Central Stock and print the official GRN voucher.',
      },
      {
        stepTitle: '2. Client Free Stock (FOC) — Auto-Detected & Locked Site Branch + 5-Stage Tracking',
        detail:
          'Open "Client Free Stock (FOC)" -> "+ Log Client Free Stock" and select the Target Project ("Main Project", "Under Main Project", or "Individual Project"). The system AUTOMATICALLY DETECTS the Project\'s assigned Branch and LOCKS "Allocated Site Branch" to it (unless "ALL AREAS", which allows any branch). Generate A4/PDF reports per individual FOC item or as one Full Consolidated Project Report.',
      },
    ],
    keyOutputs: [
      'Sequential Purchase Orders (PO) with Item Photos & Multi-Item Atomic GRNs',
      'Automatic Project-to-Branch Detection & Lock When Logging Client FOC',
      '5-Stage Client FOC Tracking (Individual Item & Full Project Reports)',
    ],
  },
  {
    id: 'ch-07',
    number: 'Chapter 07',
    category: 'operations',
    categoryLabel: 'Step 07 · Branch & Sub-Site Stock Requests',
    title: 'Branches & Sub-Sites Request Stock (2-Tab Requisitions & Auto Parent-Site Routing)',
    summary:
      'Site branches request both normal purchased stock and branch-matched Client FOC stock cleanly through a smart 2-tab Stock Requisition workflow.',
    icon: Send,
    steps: [
      {
        stepTitle: '1. Tab 1 (Normal Stock Request) & Tab 2 (Branch-Matched + ALL AREAS Client FOC Request)',
        detail:
          'Open "Stock Requisitions -> + New Stock Requirement Form" and pick your Requesting Site Branch. Use Tab 1 ("Normal Stock Request", auto-sorting "Site Low" items to the top) or Tab 2 ("Client Free Stock for Assigned Project Request"), which automatically filters to ONLY Client FOC pools assigned to that Site Branch plus any "ALL AREAS" projects.',
      },
      {
        stepTitle: '2. Automatic Routing: Regional Requests Go to Main HQ; Sub-Site Requests Go to Parent Regional',
        detail:
          'When a Regional Site Branch submits a requisition, it routes to Central Main Warehouse (showing "Main:" available qty). When a child Sub-Site Branch submits a requisition, the system AUTOMATICALLY routes it upstream to its Parent Regional Site Branch and displays live "Parent Avl:" yard balance alongside "Site Avl:".',
      },
    ],
    keyOutputs: [
      '2-Tab Stock Requisitions (Normal Low-Stock Sorted + Branch-Matched Client FOC)',
      'Regional Requisitions Route to Main HQ; Sub-Site Requisitions Auto-Route to Parent Regional Branch',
    ],
  },
  {
    id: 'ch-08',
    number: 'Chapter 08',
    category: 'operations',
    categoryLabel: 'Step 08 · Dispatch, Direct Sub-Site Issue & Site Stock',
    title: 'Approve, Dispatch & Direct "Issue Stock to Sub-Site" into Site Branch Stock',
    summary:
      'Central HQ and Parent Regional Branches fulfill site requisitions or push stock directly downward to Sub-Sites with full FOC highlights.',
    icon: CheckCircle2,
    steps: [
      {
        stepTitle: '1. Approve Requisitions, Confirm Receipt (GRN) & Direct "Issue Stock to Sub-Site"',
        detail:
          'Main HQ approves & dispatches Regional requisitions, while Parent Regional Branch Admins (or Central Admin) approve Sub-Site requisitions — and the receiving site clicks "Confirm Receipt (GRN)" to add items into "Site Branch Stock". Regional Branches owning child Sub-Sites can also click "Issue Stock to Sub-Site" directly inside Site Branch Stock to send available yard materials down anytime.',
      },
      {
        stepTitle: '2. Site Branch Stock Ledger — "Central FOC" Highlights & 5-Stage Forward Summary',
        detail:
          'Inside "Site Branch Stock (Site Inventories)", stock received from Client Free Stock displays a bright "Central FOC" badge for clear segregation. Clicking any branch item opens its 5-Stage Forward Traceability Summary with single-click Print A4 Summary & Download PDF.',
      },
    ],
    keyOutputs: [
      'Atomic HQ -> Regional & Parent Regional -> Sub-Site Stock Transfers',
      'Direct "Issue Stock to Sub-Site" Button on Parent Regional Yards',
      '"Central FOC" Badge Highlights & Printable 5-Stage Branch Forward Summaries',
    ],
  },
  {
    id: 'ch-09',
    number: 'Chapter 09',
    category: 'operations',
    categoryLabel: 'Step 09 · Team Issue, Transfers & Team History',
    title: 'Issue Stock to Teams (IN), Own-Site Team Transfers, Separated Old Stock & Team History',
    summary:
      'Equip Field Teams across Regional and Sub-Site branches, execute controlled own-site team transfers, keep old-site balances strictly separated, and track full officer history.',
    icon: Users2,
    steps: [
      {
        stepTitle: '1. Issue Materials & Tools to Teams (IN) in Both Regional and Sub-Site Branches',
        detail:
          'Both Regional Site Branches and Sub-Site Branches issue materials & machinery directly to their assigned Field Teams via "Issue to Teams", printing official Issue Notes (IN) / Gate Passes. Team balances update live in "Team In-Hand Stock".',
      },
      {
        stepTitle: '2. Own-Site Team Transfers, "Stock to Return" Separation, Permanent Promotion & Officer History',
        detail:
          'While Teams setup is View-Only for staff, Site Officers can Transfer ONLY teams stationed at their own assigned site(s): (a) If the team still holds old-site stock, it moves as "Temporary Assigned to - [New Site]", and old-site items isolate strictly inside an amber "Stock to Return - [Previous Site]" section (never mixed or usable on the new site). (b) Once old-site stock clears to 0 (or Admin confirms zero stock), the team promotes to Permanent "[Team Name] (Ref: [Previous Site])". (c) Team History permanently logs all Previous Sites, Dates, AND the exact acting Officer\'s Name, Role & Site ("Transferred By").',
      },
    ],
    keyOutputs: [
      'Signable Issue to Teams Notes (IN) & Gate Passes on Both Regional & Sub-Site Tiers',
      'Own-Site-Only Transfer Permission with "Temporary" -> "Permanent" Promotion',
      'Strict "Stock to Return - [Previous Site]" Isolation & Permanent Officer History Log',
    ],
  },
  {
    id: 'ch-10',
    number: 'Chapter 10',
    category: 'projects',
    categoryLabel: 'Step 10 · Usage, Auto FOC Reduction & Reconciliation',
    title: 'Daily Usage (PU), Section-Filtered Teams, Automatic FOC Detect/Reduction & Reconciliation',
    summary:
      'Record installed + wastage quantities using strictly section-filtered teams while the system automatically detects and deducts matching Main Project Client FOC stock.',
    icon: HardHat,
    steps: [
      {
        stepTitle: '1. Strict Section-Filtered Teams, 1-2-3 Connection Workflow & Active-Site Stock Guard',
        detail:
          'In "Material Usage / Daily Progress Entry", selecting any Project Section (e.g., New Connection, Cable, Civil, Water, Electrical, Solar) strictly filters "Executing Field Team *" to ONLY teams registered under that section — preventing cross-section mistakes! Utility New Connection sections guide users cleanly in 3 steps: (1) Lock Site, Section-Filtered Team & Working Area -> (2) Pick/Register Connection -> (3) Enter Qty Used + Wastage Qty (consuming only the project\'s assigned branch stock unless "ALL AREAS").',
      },
      {
        stepTitle: '2. Automatic FOC Detection & Reduction + Color-Coded 5-Stage Reconciliation & Full Site Reports',
        detail:
          'When logging usage under a Main Project (such as New Connections), Client FOC dropdowns appear ONLY if matching FOC exists for that active section/branch, and submitting usage AUTOMATICALLY REDUCES (deducts) Installed + Wastage quantities from that Main Project FOC pool in real time! Color-coded Main Project cards show each Sub-Project\'s individual 5-Stage flow (Receipt -> Site Issue -> Team Issue -> Usage -> Completion Returnable Balance) plus "Full Report for This Site (Project)" in Usage History.',
      },
    ],
    keyOutputs: [
      'Strict Section-to-Team Filtering in Material Usage (No Cross-Section Mix-Ups)',
      'Automatic Client FOC Detection & Real-Time Pool Reduction on Usage Entry',
      '5-Stage Main/Sub-Project Reconciliation & Full Consolidated Site Reports',
    ],
  },
  {
    id: 'ch-11',
    number: 'Chapter 11',
    category: 'projects',
    categoryLabel: 'Step 11 · Batch Returns, Damaged Tab & RTV',
    title: 'Multi-Item Team Returns (RV), "Damaged Returns" Tab, Upstream BRM & Vendor RTV',
    summary:
      'Return surplus and damaged items effortlessly in multi-item batches while keeping usable yard stock cleanly isolated from damaged scrap returns.',
    icon: RotateCcw,
    steps: [
      {
        stepTitle: '1. Multi-Item Team Returns (RV) & Site "Damaged Returns" Quarantine Tab',
        detail:
          'In "Team Returns (RV)", select multiple held items at once ("+ Add Item" / "+ Add All Held", with item thumbnails shown in dropdowns), mark each line Good or Damaged/Scrap, and submit on one voucher. Good returns restore usable branch stock immediately, whereas ALL Damaged/Scrap returns from Teams and child Sub-Sites isolate inside the dedicated "Damaged Returns" tab in Site Branch Stock.',
      },
      {
        stepTitle: '2. Upstream Branch Returns (Sub-Site BRM -> Parent Regional -> Main HQ) & Vendor RTV Debit Notes',
        detail:
          'When a Sub-Site submits a "Branch Return (BRM)" (or dispatches directly from the Damaged Returns tab), items automatically route upstream to its Parent Regional Site Branch; Regional Sites return upstream to Central Main Warehouse. At Main HQ, defective vendor deliveries can be returned via "Return to Vendor (RTV)" with outward Gate Passes & official Debit Notes, or repaired via the Damaged Stock ledger.',
      },
    ],
    keyOutputs: [
      'Multi-Item Batch Team Returns (RV) & Branch Returns (BRM) with Item Thumbnails',
      'Isolated Site "Damaged Returns" Tab + Automatic Sub-Site -> Parent -> HQ Routing',
      'Return to Vendor (RTV) Official Debit Notes & Outward Gate Passes',
    ],
  },
  {
    id: 'ch-12',
    number: 'Chapter 12',
    category: 'formats',
    categoryLabel: 'Step 12 · 3-Tier Summaries, Formats & Security',
    title: 'Adaptive 3-Tier Summaries, ISO/Company Formats, Hand/Digital Sign, Themes & Backups',
    summary:
      'Inspect complete 3-tier item movement trails, customize ISO 9001:2015 or uploaded PDF/Image formats with Hand-Sign options, switch Glass Tone themes, and protect data.',
    icon: FileText,
    steps: [
      {
        stepTitle: '1. Adaptive 3-Tier Item Lifecycle Summary (With/Without Sub-Site) + Print A4 / PDF',
        detail:
          'In "Main Central Stock", click any item row (or "Summary") to open its complete End-to-End Material Lifecycle Summary numbered dynamically based on actual flow: (1) Main Central -> (2) Regional -> (3) Sub-Site (shown automatically when Regional stock moved to Sub-Sites) -> (4) Team -> (5) Usage -> (6) Total Balance; or directly (1) Main -> (2) Regional -> (3) Team -> (4) Usage -> (5) Total Balance — ready for Print A4 Summary & PDF download.',
      },
      {
        stepTitle: '2. ISO 9001:2015 / Custom Company Formats, Signers & "Off Digital Signature" Hand-Sign Mode',
        detail:
          'Under "Document Templates": Tab 1 provides ISO 9001:2015 Controlled Formats (FORMAT-01 to 04) with Auto Tenant Header or custom PDF/Image upload (max 1MB); Tab 2 manages Logo & Signer Names/Designations (Prepared / Approved / Reviewed); Tab 3 stores Digital Signatures (Draw/Upload) plus an "Off Digital Signature" global/per-print toggle leaving generous blank dashed boxes for wet-ink pen signatures & stamps across all vouchers and reports.',
      },
      {
        stepTitle: '3. Live "Glass Tone" Themes, Multi-Currency FX Subscriptions, Admin Delete Lock & Backups',
        detail:
          'Switch live across 9 Apple Liquid Glass themes ("Sapphire & Gold" default) in the Header. Manage Multi-Currency Subscriptions across LKR, USD, EUR, GBP, AUD & SGD with real-time FX rates (Payments.lk / Stripe). Every deletion across the system requires Admin Password verification, logs into Audit Trail, supports Recycle Bin recovery, and exports 1-click JSON Offline Backups & Multi-Sheet Excel.',
      },
    ],
    keyOutputs: [
      'Adaptive 3-Tier Item Lifecycle Flow (Main -> Regional -> [Sub-Site ->] Team -> Usage -> Balance)',
      'ISO 9001:2015 Formats, Custom Upload (<=1MB), Digital Signatures & "Off Digital Signature" Hand-Sign',
      '9 Live Glass Tone Themes, Multi-Currency Subscriptions (6 Currencies), Audit Trail & Backups',
    ],
  },
];

// ==================== SINHALA GUIDE CONTENT (පිළිවෙළ පරිච්ඡේද 12 - සිංහල අත්පොත) ====================
const GUIDE_CHAPTERS_SI: GuideChapter[] = [
  {
    id: 'ch-01',
    number: '01 වන පරිච්ඡේදය',
    category: 'setup',
    categoryLabel: 'පියවර 01 · ආයතනය ලියාපදිංචිය',
    title: 'ආයතන ගිණුම සෑදීම (View-Only Auto Slug සහ ලෝකයේ සියලුම රටවල් Search කිරීම)',
    summary:
      'විනාඩියක් ඇතුළත ඔබේ ආයතනයටම වෙන් වූ Cloud ගිණුම සාදාගෙන, රට, මුදල් වර්ගය සහ පරිපාලකගේ සැබෑ නම සමඟ ආරක්ෂිතව වැඩ ආරම්භ කරන ආකාරය.',
    icon: Globe,
    steps: [
      {
        stepTitle: '1. ස්වයංක්‍රීය View-Only Workspace Slug සහ ලෝකයේ සියලුම රටවල් Search & Select කිරීම',
        detail:
          '"Start 7-Day Free Trial" මත ක්ලික් කර Company Name ඇතුළත් කළ සැණින් ඔබේ Workspace Slug / Identifier (app/...) ඉබේම සෑදෙන අතර එය Edit කළ නොහැකි ලෙස View-Only කර ඇත. Operating Country තුළ ලෝකයේ සියලුම රටවල් (~197) නම හෝ +dialCode අනුව Search කර තෝරාගත හැකි අතර Currency හා දුරකථන නීති ස්වයංක්‍රීයව සැකසේ.',
      },
      {
        stepTitle: '2. අනිවාර්ය Super Admin නම, ලැබෙන පහසුකම් සහ First-Name පරීක්ෂාව',
        detail:
          'ප්‍රධාන Super Admin ගේ සැබෑ Full Name ඇතුළත් කිරීම අනිවාර්ය වේ ("Admin" වැනි පොදු නම් භාර නොගනී). සෑම පැකේජයකටම Unlimited Users, Unlimited Field Teams, 1 Central HQ සහ Site Branches 20ක් (+$10/mo අමතර Site) ඇතුළත්ය. Login වීමේදී First Name පරීක්ෂා කර Audit Trail හි "[නම] (as Super Admin)" ලෙස සටහන් කෙරේ.',
      },
    ],
    keyOutputs: [
      'Company Name අනුව ස්වයංක්‍රීය View-Only Workspace Slug (app/...)',
      'ලෝකයේ සියලුම රටවල් (~197) Search & Select + මුදල් වර්ග සමමුහුර්ත වීම',
      '1 Central HQ + Site Branches 20ක් + Unlimited Users සහ Teams',
    ],
  },
  {
    id: 'ch-02',
    number: '02 වන පරිච්ඡේදය',
    category: 'setup',
    categoryLabel: 'පියවර 02 · Head Office Master දත්ත',
    title: 'Head Office මගින් භාණ්ඩ (Items), Suppliers (Payment Terms) සහ Clients ලියාපදිංචිය',
    summary:
      'සියලුම මූලික Master දත්ත පාලනය Head Office (Main Admin) හරහා සිදු කෙරෙන අතර අනුක්‍රමික 0001 අංකනය, Item Images සහ Payment Terms සකස් කෙරේ.',
    icon: Boxes,
    steps: [
      {
        stepTitle: '1. Head Office මගින් භාණ්ඩ හා යන්ත්‍රෝපකරණ දැමීම (<200KB Photos & Single-Shot Scanner)',
        detail:
          'Master Registrations -> Item Catalog තුළ භාණ්ඩ හා යන්ත්‍රෝපකරණ ඇතුළත් කිරීම (හෝ Excel Import) සිදු කරන්නේ Head Office (Main Admin) පමණි. අවශ්‍ය නම් භාණ්ඩයේ Photo එකක් Upload කළ හැකි අතර එය 200KB ට අඩුවෙන් Auto-Compress වී PO, Requisitions සහ Returns Dropdown වලද පෙන්වයි ("Print with Image" මගින් Print කළ හැක). Barcode Scanner එක වරක් Detect වූ සැණින් ඉබේම නතර වේ ("Scan Now").',
      },
      {
        stepTitle: '2. Suppliers (Payment Terms සමඟ) සහ Clients ලියාපදිංචි කිරීම',
        detail:
          'සැපයුම්කරුවන් (Suppliers) ලියාපදිංචි කිරීමේදී ගෙවීමේ කොන්දේසි (Net 15, Net 30, Net 60, Advance 50% / Balance on Delivery, Cash on Delivery, Immediate Bank Transfer) තෝරාගත හැක. ව්‍යාපෘති සහ Client Free Stock (FOC) සඳහා Clients ලියාපදිංචි කිරීමද මෙහිදී සිදු කෙරේ.',
      },
    ],
    keyOutputs: [
      'Head Office මගින් පමණක් පාලනය වන 0001 අංකිත Item Catalog සහ Machinery ලැයිස්තුව',
      '200KB ට අඩුවෙන් Compress වන Item Photos + Single-Shot Barcode Scanner',
      'Payment Terms සහිත Suppliers සහ Clients නාමාවලිය',
    ],
  },
  {
    id: 'ch-03',
    number: '03 වන පරිච්ඡේදය',
    category: 'setup',
    categoryLabel: 'පියවර 03 · ශාඛා, Sub-Sites සහ Branch Projects',
    title: '3-Tier ශාඛා (Sub-Site Lock) සෑදීම සහ Branch වලට අදාළව Projects Assign කිරීම',
    summary:
      'Main HQ යටතේ Regional ශාඛා හා Sub-Sites සාදා, සෑම ව්‍යාපෘතියක්ම අදාළ ශාඛාවට නිවැරදිව සම්බන්ධ කරන (Assign) ආකාරය.',
    icon: FolderKanban,
    steps: [
      {
        stepTitle: '1. 3-Tier ශාඛා ව්‍යුහය (HQ -> Regional -> Sub-Site) සහ Sub-Site ආරක්ෂණ Lock එක',
        detail:
          '"Master Registrations -> Sites / Branches" තුළ Main HQ යටතේ Regional Site Branches ද, අවශ්‍ය නම් Regional Branch එකක් යටතේ Sub-Site Branches ද Head Office මගින් සාදයි. වැදගත් නීතිය: Sub-Site එකකට බඩු හෝ Client FOC ලබාදුන් පසු එම Sub-Site එක Delete කිරීම හෝ Parent Regional Branch එක මාරු කිරීම සම්පූර්ණයෙන්ම LOCK වේ.',
      },
      {
        stepTitle: '2. Branch අනුව Project Assign වීම ("Assigned Site Branch *" හෝ "ALL AREAS")',
        detail:
          '"Project & New Section Registry" හි International Section Templates (Telecom FTTH, Water, Electrical, Solar, EPC) Load කර "+ Add Field" මගින් අමතර Fields එක් කළ හැක. සෑම Standalone, Main Project හෝ Under Main Project එකක්ම Register කිරීමේදී එය ක්‍රියාත්මක වන නිශ්චිත Regional/Sub-Site Branch එකට Assign කෙරේ — නැතහොත් මුළු රටේම ශාඛා සඳහා "🌐 ALL AREAS (All Site Branches)" තෝරාගත හැක.',
      },
    ],
    keyOutputs: [
      'HQ -> Regional -> Sub-Site 3-Tier ව්‍යුහය + බඩු/FOC ඇති Sub-Site Delete/Move Lock',
      'සෑම Project එකක්ම අදාළ Site Branch එකට Assign වීම (හෝ ALL AREAS)',
      'Telecom, Water, Electrical, Solar Templates + "+ Add Field" පහසුකම',
    ],
  },
  {
    id: 'ch-04',
    number: '04 වන පරිච්ඡේදය',
    category: 'setup',
    categoryLabel: 'පියවර 04 · Teams සෑදීම, Section හා Delete Lock',
    title: 'Head Office මගින් Teams (Section සමඟ) සෑදීම, Users View-Only සහ බඩු දුන් පසු Delete Lock',
    summary:
      'සාමාන්‍ය Users ලට Teams සෑදිය නොහැකි අතර Head Office විසින් අදාළ Project Section එක තෝරා Teams ලියාපදිංචි කිරීම සහ බඩු Issue කළ Teams ආරක්ෂා වන ආකාරය.',
    icon: Lock,
    steps: [
      {
        stepTitle: '1. සාමාන්‍ය Users ලට Teams Register කළ නොහැක (View-Only) — Head Office පමණක් Section තෝරා Teams සෑදීම',
        detail:
          'Field Teams අලුතින් සෑදීම, Edit කිරීම හෝ Delete කිරීම කළ හැක්කේ Head Office (Main Admin) හට පමණි. Regional හා Sub-Site Users ලට Teams පෙනෙන්නේ View-Only ලෙසයි. Head Office විසින් Team එකක් Register කරන විට අදාළ Project Section එක (New Connection, Cable, Civil, Water, Electrical, Solar) තේරීම අනිවාර්ය වේ. එකම කණ්ඩායම Sections දෙකක වැඩ කරන්නේ නම් වෙනම නම්වලින් ("Alex NC Team 1", "Alex Civil Team 1") Register කළ යුතුය.',
      },
      {
        stepTitle: '2. Team එකට බඩු Issue කර ඇත්නම් Delete හෝ Rename කළ නොහැකි වීම + 0-Balance Section Lock',
        detail:
          'වැදගත් ආරක්ෂාව: Team එකකට භාණ්ඩ හෝ ටූල්ස් Issue කර ඇත්නම් (හෝ ගනුදෙනු ඉතිහාසයක් ඇත්නම්) එම Team එක කිසිසේත් Delete කිරීමට හෝ නම වෙනස් කිරීමට නොහැක (Locked). තවද Team එක අතේ බඩු (> 0) තිබෙන තාක් එහි Project Section එක වෙනස් කළ නොහැකි අතර, Usage හෝ Return මගින් අත ඇති බඩු 0 වූ පසු පමණක් Section මාරු කිරීම Unlock වේ.',
      },
    ],
    keyOutputs: [
      'Teams ලියාපදිංචිය Head Office සතු වීම (අනිත් Users ලට View-Only)',
      'Team Register කිරීමේදී අනිවාර්ය Project Section තේරීම',
      'බඩු Issue කළ Team Delete/Rename තහනම් වීම + 0 Balance වූ පසු Section Unlock',
    ],
  },
  {
    id: 'ch-05',
    number: '05 වන පරිච්ඡේදය',
    category: 'setup',
    categoryLabel: 'පියවර 05 · Users/Managers Assign සහ History',
    title: 'Branch වලට Users හා Managers ලා Assign කිරීම සහ Site Assignment History පවත්වාගැනීම',
    summary:
      'ප්‍රධාන කාර්යාලයේ සිට ප්‍රාදේශීය ශාඛා හා Sub-Sites දක්වා නිලධාරීන්ට ගිණුම් සාදා Assign කිරීම සහ මාරු වීම්වල සම්පූර්ණ දින වකවානු ඉතිහාසය.',
    icon: UserCheck,
    steps: [
      {
        stepTitle: '1. Staff Users හා Site Managers ලා සාදා Regional හෝ Sub-Site ශාඛාවලට Assign කිරීම',
        detail:
          '"User Management" තුළ Head Office විසින් සීමා රහිත නිලධාරී ගිණුම් (Super Admin Central, All Site Branch Admin, Sub-Sites පාලනය සහිත Branch Admin, සහ Branch System User) සාදා තනි ශාඛාවකට හෝ ශාඛා කිහිපයකට Assign කරයි. "Send Verification Email" මගින් Email තහවුරු කළ හැක.',
      },
      {
        stepTitle: '2. User / Supervisor කෙනෙකු වෙනත් Site එකකට Assign කරද්දී Site History (Start / End Dates) සටහන් වීම',
        detail:
          'ඕනෑම User කෙනෙකු හෝ Site Supervisor/Manager කෙනෙකු වෙනත් Site Branch එකකට Assign හෝ මාරු කරන සෑම විටම, කලින් සේවය කළ Sites (Previous Sites), ආරම්භ කළ දිනය (Start Date) සහ අවසන් කළ දිනය (End Date) සමඟ සම්පූර්ණ Assigned Sites History වාර්තාවක් පද්ධතිය තුළ ස්වයංක්‍රීයව සුරැකේ.',
      },
    ],
    keyOutputs: [
      'HQ, Regional සහ Sub-Site නිලධාරීන් සඳහා Role-Based ගිණුම්',
      'Previous Sites, Start Dates සහ End Dates පෙන්වන Site Assignment History',
      'apexstox.com හරහා 1-Click Email Verification',
    ],
  },
  {
    id: 'ch-06',
    number: '06 වන පරිච්ඡේදය',
    category: 'warehouse',
    categoryLabel: 'පියවර 06 · PO, GRN සහ FOC Auto-Branch Detect',
    title: 'PO නිකුත් කිරීම, GRN මගින් ප්‍රධාන ගබඩාවට ගැනීම සහ Client FOC (Auto Branch Lock)',
    summary:
      'සැපයුම්කරුවන්ගෙන් මිලදී ගන්නා බඩු ප්‍රධාන ගබඩාවට ලබාගැනීම සහ Client නොමිලේ දෙන බඩු (FOC) අදාළ Project එකේ Branch එකට ඉබේම Lock වී සටහන් වීම.',
    icon: Gift,
    steps: [
      {
        stepTitle: '1. සැපයුම්කරු Purchase Orders (PO) දැමීම සහ GRN මගින් Main Central Stock වෙත භාරගැනීම',
        detail:
          '"Supplier Orders (PO)" තුළ Item Images, Payment Terms, Tax සහ අනුමත අත්සන් 3 සහිතව 0001-අංකිත PO නිකුත් කරන්න. භාණ්ඩ ප්‍රධාන ගබඩාවට ආ පසු සම්පූර්ණයෙන් හෝ කොටස් වශයෙන් (Partial GRN) තහවුරු කර Main Central Stock වෙත ගෙන නිල GRN වවුචරය Print කරගන්න.',
      },
      {
        stepTitle: '2. Client Free Stock (FOC) — Project එක අනුව Branch එක ස්වයංක්‍රීයව Auto-Detect වී Lock වීම',
        detail:
          '"Client Free Stock -> + Log Client Free Stock" විවෘත කර Target Project එක ("Main Project", "Under Main Project", හෝ "Individual Project") තේරූ සැණින් එම Project එක Assign කර ඇති Site Branch එක ස්වයංක්‍රීයව Auto-Detect වී "Allocated Site Branch" ක්ෂේත්‍රයට Lock වේ ("ALL AREAS" Project හැර). Central FOC වෙතින් එක් එක් Item හෝ මුළු Project A4/PDF Report ලෙස ලබාගත හැක.',
      },
    ],
    keyOutputs: [
      'Item Photos සහිත Purchase Orders (PO) සහ Multi-Item Atomic GRN වවුචර',
      'Client FOC දැමීමේදී Project එකේ Branch එක ඉබේම Auto-Detect වී Lock වීම',
      'එක් එක් Issued Item හා මුළු Project FOC Reconciliation A4/PDF වාර්තා',
    ],
  },
  {
    id: 'ch-07',
    number: '07 වන පරිච්ඡේදය',
    category: 'operations',
    categoryLabel: 'පියවර 07 · ශාඛා හා Sub-Site Stock Requests',
    title: 'Regional සහ Sub-Site ශාඛා සඳහා බඩු ඉල්ලුම් කිරීම (2-Tab Stock Requisitions - RN)',
    summary:
      'සාමාන්‍ය තොග හා අදාළ ශාඛාවට වෙන් කළ Client FOC තොග ඉල්ලුම් කිරීම සහ Sub-Site ඉල්ලුම්පත් ස්වයංක්‍රීයව තම Parent Regional ශාඛාවට යොමු වීම.',
    icon: Send,
    steps: [
      {
        stepTitle: '1. Tab 1 (සාමාන්‍ය Stock Request) සහ Tab 2 (තම Branch එකේ + ALL AREAS Client FOC Request)',
        detail:
          '"Stock Requisitions -> + New Stock Requirement Form" හි Requesting Site Branch තෝරන්න. Tab 1 ("Normal Stock Request") හි අඩු තොග ("Site Low") උඩින්ම පෙන්වන අතර, Tab 2 ("Client Free Stock for Assigned Project Request") හි පෙන්වන්නේ එම ශාඛාවට Assign කළ FOC Projects සහ "ALL AREAS" Projects පමණි.',
      },
      {
        stepTitle: '2. ස්වයංක්‍රීය යොමු වීම: Regional ඉල්ලුම් HQ වෙතත්, Sub-Site ඉල්ලුම් Parent Regional වෙතත්',
        detail:
          'Regional Site Branch එකක් බඩු ඉල්ලුම් කරන විට එය ප්‍රධාන ගබඩාවට (Central HQ — "Main:" ශේෂය සමඟ) යොමු වේ. නමුත් Sub-Site Branch එකක් Requisition එකක් දැමූ විට එය ස්වයංක්‍රීයව එහි Parent Regional Site Branch එකට යොමු වී සජීවී "Parent Avl:" තොග ප්‍රමාණය පෙන්වයි.',
      },
    ],
    keyOutputs: [
      'Normal (Low-Stock Top) සහ Branch-Matched FOC ටැබ් 2ක Stock Requisitions (RN)',
      'Regional -> HQ හා Sub-Site -> Parent Regional Branch ස්වයංක්‍රීය යොමු වීම',
    ],
  },
  {
    id: 'ch-08',
    number: '08 වන පරිච්ඡේදය',
    category: 'operations',
    categoryLabel: 'පියවර 08 · අනුමත කිරීම, Sub-Site Dispatch සහ ශාඛා තොග',
    title: 'බඩු අනුමත කර ශාඛාවට Receive කිරීම, සෘජු "Issue Stock to Sub-Site" සහ "Central FOC"',
    summary:
      'ඉල්ලුම් කළ බඩු HQ හෝ Regional ශාඛාවෙන් අනුමත කර ශාඛා ගබඩාවට ලබාගැනීම සහ Regional සිට Sub-Site වෙත සෘජුව බඩු නිකුත් කිරීම.',
    icon: CheckCircle2,
    steps: [
      {
        stepTitle: '1. Requisition Approve, Confirm Receipt (GRN) සහ සෘජු "Issue Stock to Sub-Site"',
        detail:
          'Regional ඉල්ලුම් Central HQ මගින් ද, Sub-Site ඉල්ලුම් එහි Parent Regional Branch Admin (හෝ Central Admin) මගින් ද Approve කර Dispatch කරන අතර, ලැබෙන ශාඛාව "Confirm Receipt (GRN)" කළ සැණින් "Site Branch Stock" වෙත එකතු වේ. Sub-Sites ඇති Regional Branch වලට Site Branch Stock ඇතුළතින්ම "Issue Stock to Sub-Site" මගින් කෙලින්ම බඩු යැවීමටද පුළුවන.',
      },
      {
        stepTitle: '2. Site Branch Stock වගුව — "Central FOC" Badge සහ 5-Stage Forward Summary',
        detail:
          '"Site Branch Stock (Site Inventories)" තුළ Client FOC මගින් ලැබුණු භාණ්ඩ "Central FOC" Badge එකෙන් පැහැදිලිව වෙන් කර පෙන්වයි. ඕනෑම භාණ්ඩයක් මත ක්ලික් කර 5-Stage Forward Traceability Summary බැලීමටත්, Print A4 / PDF ගැනීමටත් හැක.',
      },
    ],
    keyOutputs: [
      'HQ -> Regional සහ Parent Regional -> Sub-Site නිවැරදි තොග හුවමාරු',
      'Regional ශාඛා තුළ සෘජු "Issue Stock to Sub-Site" පහසුකම',
      '"Central FOC" Badge Highlight සහ Printable 5-Stage Forward Summary',
    ],
  },
  {
    id: 'ch-09',
    number: '09 වන පරිච්ඡේදය',
    category: 'operations',
    categoryLabel: 'පියවර 09 · Teams නිකුත් කිරීම්, Transfer සහ History',
    title: 'Teams වෙත බඩු නිකුත් කිරීම (IN), Own-Site Team Transfer, වෙන් කළ තොග සහ Team History',
    summary:
      'Regional හා Sub-Site ශාඛා දෙකේම Teams වෙත බඩු නිකුත් කිරීම, Site නිලධාරීන් තම Site එකේ Team පමණක් Transfer කිරීම, පරණ බඩු මිශ්‍ර නොවීම සහ සම්පූර්ණ History.',
    icon: Users2,
    steps: [
      {
        stepTitle: '1. Regional සහ Sub-Site දෙකේම Field Teams වෙත භාණ්ඩ නිකුත් කිරීම (IN / Gate Pass)',
        detail:
          'Regional Site Branches මෙන්ම Sub-Site Branches ඇතුළතද "Issue to Teams" හරහා තම ශාඛාවේ Field Teams වෙත භාණ්ඩ හා යන්ත්‍රෝපකරණ නිකුත් කර අත්සන් සහිත Issue Note (IN) / Gate Pass මුද්‍රණය කළ හැක. සජීවී ශේෂය "Team In-Hand Stock" හි පෙන්වයි.',
      },
      {
        stepTitle: '2. තම Site එකේ Team Transfer කිරීම, "Stock to Return" වෙන් කිරීම, Permanent වීම සහ Officer History',
        detail:
          'Teams සෑදීම Users ලට View-Only වුවත්, Site නිලධාරීන්ට තමන්ගේ Site එකේ සිටින Team එකක් පමණක් වෙනත් Site එකකට Transfer කළ හැක: (අ) Team එක අතේ පරණ Site එකේ බඩු තිබේ නම් "Temporary Assigned to - [New Site]" ලෙස මාරු වන අතර පරණ බඩු "Stock to Return - [Previous Site]" යටතේ වෙනම පෙන්වයි (අලුත් Site බඩු සමඟ එකතු නොවේ, භාවිත කළද නොහැක). (ආ) පරණ බඩු 0 වූ පසු Permanent "[Team Name] (Ref: [Previous Site])" බවට පත්වේ. (ඇ) Team History හි පරණ Sites, දිනයන් සහ Transfer කළ නිලධාරියාගේ නම, තනතුර හා Site වගකීම ("Transferred By") ස්ථිරව සටහන් වේ.',
      },
    ],
    keyOutputs: [
      'Regional & Sub-Site ශාඛා දෙකේම Field Teams නිකුත් කිරීම් (IN / Gate Pass)',
      'තම Site එකේ Team Transfer පමණක් කළ හැකි වීම + Temporary -> Permanent ක්‍රමය',
      'පරණ බඩු "Stock to Return" වෙන් කිරීම + නිලධාරී වගකීම සහිත Team History',
    ],
  },
  {
    id: 'ch-10',
    number: '10 වන පරිච්ඡේදය',
    category: 'projects',
    categoryLabel: 'පියවර 10 · Usage, FOC ස්වයංක්‍රීය අඩුවීම සහ Reconciliation',
    title: 'දෛනික Usage (PU), Section-Filtered Teams, FOC Auto-Detect / Reduction සහ Reconciliation',
    summary:
      'අදාළ Section එකේ Teams පමණක් පෙන්වන Usage ක්‍රමවේදය, භාවිතය දමද්දී Main Project FOC තොගය ස්වයංක්‍රීයව හඳුනාගෙන අඩු වීම (Auto Reduction) සහ Full Site Reports.',
    icon: HardHat,
    steps: [
      {
        stepTitle: '1. Section අනුව Filter වන Teams, 1-2-3 Connection ක්‍රමය සහ අදාළ Site තොග පමණක් භාවිතය',
        detail:
          '"Material Usage / Daily Progress Entry" හි අදාළ Project Section එක තේරූ සැණින් "Executing Field Team *" Dropdown එකේ පෙන්වන්නේ එම Section එකට Register කළ Teams පමණි (Sections අතර Teams කිසිදා මාරු නොවේ). New Connection Sections (Telecom, Water, Electric, Solar) පියවර 1-2-3 ලෙස Team Lock -> Connection -> Qty Used + Wastage ලෙස පහසුවෙන් සටහන් කෙරේ (Team එක Project එකට අයත් Branch බඩු පමණක් භාවිත කරයි).',
      },
      {
        stepTitle: '2. Client FOC Auto-Detect හා ස්වයංක්‍රීය අඩුවීම (Auto Reduction) + පියවර 5 Reconciliation සහ Full Site Report',
        detail:
          'Main Project එකක් යටතේ Usage දමන විට එම ශාඛාවට හා Section එකට Client FOC තොග ඇත්නම් පද්ධතිය එය ස්වයංක්‍රීයව Auto-Detect කර පෙන්වන අතර, Qty Used + Wastage Qty Submit කළ සැණින් Main Project FOC තොගයෙන් එම ප්‍රමාණය ඉබේම අඩු වේ (Automatic Reduction)! වර්ණ ගැන්වූ Main/Sub-Project Reconciliation කාඩ් මගින් 5-Stage ප්‍රගතිය හා Project අවසානයේ Client Returnable Balance ලැබෙන අතර "Full Report for This Site (Project)" Print/PDF කළ හැක.',
      },
    ],
    keyOutputs: [
      'Usage හි අදාළ Section Teams පමණක් පෙන්වීම (Zero Cross-Section Errors)',
      'Usage දමද්දී Client FOC ස්වයංක්‍රීයව Auto-Detect වී ශේෂයෙන් ඉබේම අඩු වීම',
      'වර්ණ ගැන්වූ 5-Stage Main/Sub-Project Reconciliation සහ Full Site A4/PDF Reports',
    ],
  },
  {
    id: 'ch-11',
    number: '11 වන පරිච්ඡේදය',
    category: 'projects',
    categoryLabel: 'පියවර 11 · Batch Returns, Damaged Tab සහ RTV',
    title: 'Multi-Item Team Returns (RV), "Damaged Returns" ටැබ් එක, Upstream BRM සහ Vendor RTV',
    summary:
      'ඉතිරි හා කැඩුණු භාණ්ඩ බොහොමයක් එකවර ආපසු භාරදීම, කැඩුණු බඩු වෙනම Damaged Returns ටැබ් එකේ තබා Upstream ආපසු යැවීම සහ සැපයුම්කරු RTV.',
    icon: RotateCcw,
    steps: [
      {
        stepTitle: '1. Multi-Item Team Returns (RV) සහ Site Branch Stock හි වෙනම "Damaged Returns" ටැබ් එක',
        detail:
          '"Team Returns (RV)" හි භාණ්ඩවල Photo පෙන්වන Dropdown වලින් "+ Add Item" හෝ "+ Add All Held" මගින් Items ගණනාවක් එකවර තෝරා Good හෝ Damaged ලෙස Return කළ හැක. Good බඩු ශාඛා තොගයට එකතු වන අතර, Field Teams සහ Sub-Sites වෙතින් ආපසු එන සියලුම Damaged / Scrap බඩු Site Branch Stock හි "Damaged Returns" ටැබ් එක තුළ වෙනම ආරක්ෂිතව තබයි.',
      },
      {
        stepTitle: '2. Upstream Branch Returns (Sub-Site BRM -> Parent Regional -> Main HQ) සහ Vendor RTV Debit Notes',
        detail:
          'Sub-Site Branch එකක් "Branch Return (BRM)" එකක් (හෝ Damaged Returns ටැබ් එකෙන් Return එකක්) දැමූ විට එය ඉබේම එහි Parent Regional Site Branch එකටත්, Regional Site Return ඉබේම Central Main Warehouse වෙතත් යොමු වේ. Main HQ වෙතින් දෝෂ සහිත භාණ්ඩ Gate Pass හා නිල Debit Note සහිතව "Return to Vendor (RTV)" මගින් සැපයුම්කරුට යැවිය හැක.',
      },
    ],
    keyOutputs: [
      'Item Photos සමඟ Multi-Item Batch Returns (RV & BRM)',
      'වෙනම "Damaged Returns" ටැබ් එක + Sub-Site -> Parent Regional -> Main HQ Routing',
      'Return to Vendor (RTV) Debit Notes සහ Outward Gate Passes',
    ],
  },
  {
    id: 'ch-12',
    number: '12 වන පරිච්ඡේදය',
    category: 'formats',
    categoryLabel: 'පියවර 12 · 3-Tier වාර්තා, Formats සහ ආරක්ෂාව',
    title: 'Adaptive 3-Tier Item Summary, ISO/Company Formats, Hand/Digital Sign, Themes සහ Backups',
    summary:
      'Main Stock හි සම්පූර්ණ 3-Tier බෙදාහැරීමේ පිළිවෙළ බැලීම, ISO 9001:2015 හෝ Company Formats සහ අත්සන් සැකසීම, Theme මාරු කිරීම, Multi-Currency ගෙවීම් සහ ආරක්ෂිත Backups.',
    icon: FileText,
    steps: [
      {
        stepTitle: '1. Adaptive 3-Tier Item Lifecycle Summary (Sub-Site ඇති/නැති පිළිවෙළ) සහ Print A4 / PDF',
        detail:
          '"Main Central Stock" හි ඕනෑම Item පේළියක් ක්ලික් කළ විට පැහැදිලි පියවර අංක අනුව සම්පූර්ණ ඉතිහාසය පෙන්වයි: Regional සිට Sub-Site වෙත බඩු දී ඇත්නම් (1) Main Central -> (2) Regional -> (3) Sub-Site -> (4) Team -> (5) Usage -> (6) Total Balance ලෙසත්, නැතිනම් (1) Main -> (2) Regional -> (3) Team -> (4) Usage -> (5) Total Balance ලෙසත් Print A4 / Download PDF කළ හැක.',
      },
      {
        stepTitle: '2. ISO 9001:2015 / Company Formats (Upload PDF/Image), Signers සහ "Off Digital Signature"',
        detail:
          '"Document Templates" හි: Tab 1 තුළ ISO 9001:2015 Formats (FORMAT-01 සිට 04) හෝ ඔබේ PDF/Image Upload (උපරිම 1MB) සැකසිය හැක; Tab 2 හි Logo හා Signers (Prepared / Approved / Reviewed) නම් කරන්න; Tab 3 හි Digital Signatures (Draw/Upload) සුරැකීම හෝ පෑනෙන් අත්සන් (Hand Sign & Stamp) තැබීමට ඉඩ තබන "Off Digital Signature" ක්‍රමය Global ලෙස හෝ Print මොහොතේදී On කළ හැක.',
      },
      {
        stepTitle: '3. සජීවී "Glass Tone" Theme 9, Multi-Currency Subscriptions (6), Admin Delete Lock සහ Backups',
        detail:
          'ඉහළ Header එකෙන් Apple Liquid Glass Theme 9ක් ("Sapphire & Gold" Default) අතර සජීවීව මාරු වන්න. LKR, USD, EUR, GBP, AUD, SGD මුදල් ඒකක 6 සජීවී Real-Time FX අනුපාත සමඟ Subscriptions ගෙවීම් (Payments.lk / Stripe) කළ හැක. ඕනෑම Delete එකකට Admin Password අනිවාර්ය වන අතර Audit Trail, Recycle Bin සහ 1-Click JSON/Excel Backups ඇතුළත්ය.',
      },
    ],
    keyOutputs: [
      'Adaptive 3-Tier Item Summary (Main -> Regional -> [Sub-Site ->] Team -> Usage -> Balance)',
      'ISO 9001:2015 Formats, Custom Upload (<=1MB), Digital Signatures & "Off Digital Signature"',
      '9 Live Glass Tone Themes, Multi-Currency Subscriptions (6), Audit Trail & Backups',
    ],
  },
];

const FORMAT_GROUPS_MATRIX_EN: FormatSlotGuide[] = [
  {
    code: 'FORMAT-01',
    title: 'ISO 9001:2015 Material Requisition, Team Issue & Site Usage Format (ISO-9001-QMS-F01)',
    structure: 'ISO Controlled Header (Auto Tenant Details) + Item Movement Table + 3 Approval Signatures & Digital Sign-Off',
    affectsTo: [
      'RN - Stock Requisitions (Branch to Central HQ Request)',
      'IN - Issue to Teams (Daily Field Crew Dispatch & Gate Pass)',
      'PU - Material Usage / Daily Progress Entry Vouchers (Used + Wastage)',
      'TSR - Team In-Hand Stock Balance Audit Report',
    ],
  },
  {
    code: 'FORMAT-02',
    title: 'ISO 9001:2015 Goods Receipt (GRN), Client FOC & Stock Returns Format (ISO-9001-QMS-F02)',
    structure: 'ISO Controlled Header + Inbound / Return Table + Storekeeper Inspection Sign-Off (Can be unified with FORMAT-01 in 1 click)',
    affectsTo: [
      'GRN - Goods Receipt Notes (Supplier PO Delivery & Main Stock Inbound)',
      'FOC - Client Free-Issue Material Receipt Vouchers',
      'RV - Team Stock Return Vouchers (Field Crew to Branch Yard)',
      'BRM - Branch Return to Main Stock (Site Yard to Central HQ)',
    ],
  },
  {
    code: 'FORMAT-03',
    title: 'ISO 9001:2015 Official Supplier Purchase Order Format (ISO-9001-QMS-F03)',
    structure: 'ISO Controlled Header + 5-Column Priced Commercial Schedule + Tax/Discount + Commercial Terms & Digital Signatures',
    affectsTo: [
      'PO - Official Commercial Purchase Order (Procurement & PO Management)',
    ],
  },
  {
    code: 'FORMAT-04',
    title: 'ISO 9001:2015 Return to Vendor (RTV) & Official Debit Note Format (ISO-9001-QMS-F04)',
    structure: 'ISO Controlled Header + 5-Column Return Valuation Table + Claim Reason + Outward Gate Pass & Digital Sign-Off',
    affectsTo: [
      'RTV - Supplier Return / Official Debit Note Voucher',
      'GATE-PASS - Supplier Outward Return Dispatch Gate Pass',
    ],
  },
];

const FORMAT_GROUPS_MATRIX_SI: FormatSlotGuide[] = [
  {
    code: 'FORMAT-01',
    title: 'ISO 9001:2015 අභ්‍යන්තර බඩු ඉල්ලුම්පත්, නිකුත් කිරීම් සහ වැඩබිම් භාවිත ආකෘතිය (ISO-9001-QMS-F01)',
    structure: 'ISO Controlled Header (Auto Tenant විස්තර) + භාණ්ඩ වගුව + Prepared / Approved / Received Digital Signatures තීරු 3',
    affectsTo: [
      'RN - Stock Requisitions (ශාඛා මගින් ප්‍රධාන ගබඩාවෙන් බඩු ඉල්ලුම් කරන පත්‍රිකාව)',
      'IN - Issue to Teams (වැඩ කණ්ඩායම් වෙත බඩු නිකුත් කිරීමේ පත්‍රිකාව / Gate Pass)',
      'PU - Material Usage / Daily Progress Entry (ව්‍යාපෘති භාවිත හා Wastage වවුචරය)',
      'TSR - Team In-Hand Stock (කණ්ඩායම් සතු තොග පරීක්ෂණ වාර්තාව)',
    ],
  },
  {
    code: 'FORMAT-02',
    title: 'ISO 9001:2015 භාණ්ඩ භාරගැනීම් (GRN), සේවාදායක නොමිලේ තොග (FOC) සහ ආපසු භාරදීමේ ආකෘතිය (ISO-9001-QMS-F02)',
    structure: 'ISO Controlled Header + ලැබීම් / ආපසු භාරදීම් වගුව + ගබඩා පරීක්ෂණ අත්සන් තීරු (1-Click එකෙන් FORMAT-01 සමඟ ඒකාබද්ධ කළ හැක)',
    affectsTo: [
      'GRN - Goods Receipt Notes (සැපයුම්කරු PO භාණ්ඩ ලැබීම් සහ ප්‍රධාන ගබඩා GRN පත්‍රිකාව)',
      'FOC - Client Free Stock (සේවාදායකයා නොමිලේ සපයන භාණ්ඩ භාරගැනීමේ වවුචරය)',
      'RV - Team Returns (වැඩ කණ්ඩායම් මගින් ගබඩාවට භාණ්ඩ ආපසු භාරදීමේ වවුචරය)',
      'BRM - Branch Returns (ශාඛා ගබඩාවෙන් ප්‍රධාන ගබඩාවට භාණ්ඩ ආපසු යැවීමේ පත්‍රිකාව)',
    ],
  },
  {
    code: 'FORMAT-03',
    title: 'ISO 9001:2015 සැපයුම්කරු භාණ්ඩ ඇණවුම් කිරීමේ නිල ආකෘතිය (Official Purchase Order - ISO-9001-QMS-F03)',
    structure: 'ISO Controlled Header + මිල ගණන් සහිත තීරු 5ක වගුව + බදු/වට්ටම් + වාණිජ කොන්දේසි සහ Digital Signatures',
    affectsTo: [
      'PO - Supplier Orders (සැපයුම්කරුවන් වෙත නිකුත් කරන නිල Purchase Order පත්‍රිකාව)',
    ],
  },
  {
    code: 'FORMAT-04',
    title: 'ISO 9001:2015 සැපයුම්කරු වෙත භාණ්ඩ ආපසු යැවීමේ සහ හර සටහන් ආකෘතිය (RTV / Debit Note - ISO-9001-QMS-F04)',
    structure: 'ISO Controlled Header + තීරු 5ක ආපසු යැවීමේ වටිනාකම් වගුව + හේතුව + Outward Gate Pass සහ Digital Signatures',
    affectsTo: [
      'RTV - Supplier Return / Debit Note (ප්‍රමිතියෙන් තොර/වැඩිපුර භාණ්ඩ සැපයුම්කරුට ආපසු යැවීමේ වවුචරය)',
      'GATE-PASS - Supplier Outward Return Gate Pass (භාණ්ඩ පිටතට යැවීමේ අවසර පත්‍රය)',
    ],
  },
];

const FEATURE_SUMMARY_LIST_EN: FeatureSummaryGroup[] = [
  {
    group: '3-Tier Company Hierarchy, Governance, Site History & All-Countries Registration',
    items: [
      'New Tenant Registry: Auto-Generated View-Only Workspace Slug + Searchable Selector Covering All ~197 World Countries',
      '3-Tier Hierarchy: Central HQ -> Regional Site Branches -> Optional Nested Sub-Site Branches -> Field Teams (Supported in BOTH tiers)',
      'Teams Registered Exclusively by Head Office (Main Admin) — Staff Users View-Only & Cannot Delete Teams After Stock Issue',
      'Mandatory Team Project Section Selection + 0 In-Hand Balance Unlock & Team Name Integrity Lock',
      'Own-Site Team Site Transfer (Temporary -> Stock to Return Isolated -> Permanent) + Officer Responsibility in Team History',
      'User / Supervisor Site Assignment History: Logs Previous Sites with Exact Start Dates & End Dates on Every Reassignment',
      'Branch-Assigned Projects & Auto-Detected Client FOC Branch Lock + Automatic FOC Pool Reduction on Daily Usage',
      'Included Capacity: Unlimited Users, Unlimited Field Teams & 1 Central HQ + 20 Regional/Sub-Site Branches (+$10/mo extra site)',
      'Super Admin Personal Accountability: Mandatory Full Name on signup + First-Name check on login stamped as "[Name] (as Super Admin)"',
      'Adaptive 3-Tier Item Summary Flow: Main Central -> Regional -> [Sub-Site ->] Team -> Usage -> Total Balance',
    ],
  },
  {
    group: 'Warehouse, 5-Stage Client FOC Reconciliation & End-to-End Traceability',
    items: [
      '5-Stage Standard Client FOC Reconciliation Flow: Initial Central Receipt -> Site Issue -> Team Issue -> Usage & Wastage -> Completion Returnable Balance',
      'Color-Coded Main Project Cards + Sub-Project Individual Flow (KT-RGL-0505, KT-ABK-0506) & Full Consolidated Balance Report',
      'Central FOC A4/PDF Reports: Generate Separate Reports per Issued Item OR One Full Consolidated Report for the Entire Project',
      'Site Branch Stock "Central FOC" Highlight Badge & 5-Stage Forward Traceability Summary (Printable A4 / PDF)',
      'Central Stock Item Selection -> Full End-to-End Lifecycle Summary (PO/Manual/FOC Inbound, Regional/Sub-Site Flow, Used/Wasted, In-Hand)',
      'Sequential 0001-Based Codes, IDs & Voucher References (ITM-0001, PO-2026-0001, RN-2026-0001)',
      'Single-Shot Camera & USB Gun Barcode Scanner with Auto-Hide & "Scan Now" Button',
      'Supplier Purchase Orders (PO), Multi-Item Atomic GRN Vouchers & Return to Vendor (RTV) Debit Notes',
      'Item Photos (<200KB Auto-Compressed) Displayed in Item Catalog, Requisitions, POs & Return Dropdowns + "Print with Image" Toggle',
      'Excel / CSV Bulk Import, Multi-Sheet Export & Low-Stock Alerts',
    ],
  },
  {
    group: 'Field Operations, Mandatory Team Sections, Multi-Site "ALL AREAS" & Batch Returns',
    items: [
      'Mandatory Project Section on Field Teams + Multi-Section Separate Naming ("Alex NC Team 1" / "Alex Civil Team 1") & 0 In-Hand Section Lock',
      'Strict Usage Section-to-Team Filter: Choosing a Project Section in Material Usage filters "Executing Field Team *" strictly to that section\'s teams',
      '"ALL AREAS (All Site Branches)" Universal Branch Option: Register Island-Wide Projects/FOC Accessible by Any Site Branch',
      'Main Project -> Under New Connections Hierarchy Across All 4 Utility Sections (Telecom, Water, Electrical, Solar)',
      'Section-Filtered Client FOC Visibility: Only Shows FOC Main Projects Belonging to the Active NC Section When FOC Exists',
      'International Industry Section Templates + "+ Add Field" Dynamic Custom Field Builder',
      'Field Team Site Transfer Workflow: "Temporary Assigned to - [New Site]" -> Permanent "[Team Name] (Ref: [Previous Site])" & Assigned Sites History',
      'Site-Separated Team In-Hand Stock: Unreturned Old-Site Stock Under "Stock to Return - [Site Name]" (Never Combined with New Site Stock)',
      'Team Name Integrity Lock After Stock Issue + Active-Site Material Usage Enforcement',
      'Multi-Item Batch Returns in Both Team Returns (RV) & Branch Returns (BRM) ("+ Add Item" / "+ Add All Held or Available")',
      '3-Step Connection Daily Progress (Telecom, Water, Electric, Solar): Step 1 Team & Area (Locked Until Refresh) -> Step 2 Connection -> Step 3 Usage',
      '2-Tab Stock Requisitions (RN): Normal Stock (Low-Stock Top Sorted) vs. Assigned-Site & "ALL AREAS" Client FOC',
      'Installed Qty + Wastage Qty Tracking with Live (Used + Wastage) Team In-Hand Validation',
      'Usage Vouchers History -> "Full Report for This Site (Project)" (Team Subtotals + Grand Total)',
    ],
  },
  {
    group: 'ISO 9001:2015 Format Settings, Off Digital Signature, Glass Tone Themes & Multi-Currency Billing',
    items: [
      'Default ISO 9001:2015 Controlled Formats (FORMAT-01 to 04) with Auto-Synced Tenant Company Header',
      'Tab 2 Signer Governance: Prepared By, Approved By & Reviewed By Names, Designations & Departments',
      'Tab 3 Digital Signatures Library (Draw/Upload) + "Off Digital Signature (Default for Printing)" Global Toggle',
      '"Off Digital Signature" Per-Print Hand-Sign Mode Across All Vouchers & Reports (Generous Dashed Ink-Sign & Stamp Space)',
      'Uniform Crisp Typography (13.5px Body / 12px Headers) Across All Tables, Inbound Ledgers & Printed A4 Reports',
      'Live "Glass Tone" Theme Switcher in Header (9 Apple Liquid Glass Themes, Default "Sapphire & Gold")',
      'Multi-Currency Subscription Checkout (LKR, USD, EUR, GBP, AUD, SGD) with Real-Time FX Rates + Payments.lk / Stripe Auto-Renewal',
      'Optional PDF / Image Company Format Upload (Max 1MB Limit), Live A4 Format Studio & Isolated PDF Export',
      'Admin Password Verification Required for All Deletions, Audit Trail, Recycle Bin & 1-Click JSON Backup',
    ],
  },
];

const FEATURE_SUMMARY_LIST_SI: FeatureSummaryGroup[] = [
  {
    group: '3-Tier ආයතනික ව්‍යුහය, View-Only Teams, Site History සහ සියලුම රටවල් ලියාපදිංචිය',
    items: [
      'නව Tenant Registry: View-Only Auto-Generated Workspace Slug + ලෝකයේ සියලුම රටවල් (~197) Search & Select කිරීම',
      '3-Tier ගබඩා ව්‍යුහය: Central HQ -> Regional Site Branches -> Optional Sub-Site Branches -> Field Teams (Tiers දෙකේම Teams ක්‍රියාත්මක වේ)',
      'Teams ලියාපදිංචිය Head Office (Main Admin) සතු වීම — සාමාන්‍ය Users ලට View-Only වන අතර බඩු දුන් Teams Delete/Rename කළ නොහැක',
      'Team Register කිරීමේදී අනිවාර්ය Project Section තේරීම + අත ඇති බඩු 0 වූ පසු Section මාරු කිරීමේ ආරක්ෂාව',
      'තම Site එකේ Team Transfer කිරීම (Temporary -> පරණ බඩු "Stock to Return" වෙන් කිරීම -> Permanent) සහ Officer වගකීම Team History හි පෙන්වීම',
      'User/Supervisor Site Assignment History: වෙනත් Site එකකට Assign කළ විට Previous Sites, Start Dates සහ End Dates ඉතිහාසය සටහන් කිරීම',
      'Branch අනුව Project Assign වීම සහ Client FOC ස්වයංක්‍රීය Auto-Detect + Daily Usage මත FOC ඉබේම අඩු වීම (Automatic Reduction)',
      'මූලික පැකේජයටම: Unlimited Users, Unlimited Teams & 1 Central HQ + Site Branches 20ක් ඇතුළත් (අමතර Site +$10/mo)',
      'Super Admin පුද්ගලික වගකීම: ලියාපදිංචියේදී අනිවාර්ය Full Name + Login වීමේදී First-Name පරීක්ෂා කර "[නම] (as Super Admin)" ලෙස සටහන් කිරීම',
      'Item Summary පැහැදිලි 3-Tier Flow පිළිවෙළ: Main Central -> Regional -> [Sub-Site ->] Team -> Usage -> Total Balance',
    ],
  },
  {
    group: 'ගබඩා කළමනාකරණය, පියවර 5 Free Stock Reconciliation සහ Item Lifecycle Summary',
    items: [
      'පියවර 5 Client FOC Reconciliation Flow: Central Receipt -> Site Issue -> Team Issue -> Usage & Wastage -> Project Completion Returnable Balance',
      'වර්ණ ගැන්වූ Main Project Cards + එක් එක් Sub-Project Flow (KT-RGL-0505, KT-ABK-0506) සහ අවසන් Full Usage & Balance Report',
      'Central Stock වෙතින් එක් එක් Issued Item එක වෙන වෙනමත්, Project එකේ සියලු Items එකටත් A4/PDF Report ලබාගැනීම',
      'Site Branch Stock හි "Central FOC" Badge/Highlight සහ 5-Stage Forward Summary (Printable A4 / PDF)',
      'Central Stock Item Summary: PO/Manual/FOC ලැබීම්, Site/Sub-Site/Team බෙදීම්, Used/Wasted සහ Central/Site/Team In-Hand පෙන්වීම',
      '0001 සිට පිළිවෙළට ජනනය වන Item Codes, Project IDs සහ PO / Requisition / Return Dropdown වල Item Images පෙන්වීම',
      'Detect වූ සැණින් නතර වී Camera ඉවත් වන Single-Shot Scanner සහ "Scan Now" බටන් එක',
      'නිල Purchase Orders (PO), Multi-Item GRN සහ Return to Vendor (RTV) Debit Notes / Gate Pass',
      '200KB ට අඩුවෙන් Auto-Compress වන Item Image Upload සහ වවුචර් Print කිරීමේදී "Print with Image" තේරීම',
      'Excel / CSV Bulk Import, Multi-Sheet Export සහ අවම තොග අනතුරු ඇඟවීම්',
    ],
  },
  {
    group: 'වැඩබිම් මෙහෙයුම්, අනිවාර්ය Team Sections, "ALL AREAS" Projects සහ Batch Returns',
    items: [
      'Team ලියාපදිංචියේදී Project Section අනිවාර්ය කිරීම + වෙනම නම් ("Alex NC Team 1", "Alex Civil Team 1") සහ 0 Balance වූ පසු Section මාරු කිරීම',
      'Usage හි Strict Section Filter: Material Usage දමද්දී අදාළ Section එක යටතේ Register කළ Teams පමණක් පෙන්වීම',
      '"ALL AREAS (All Site Branches)" විකල්පය: Island-wide Projects/FOC ලියාපදිංචි කර ඕනෑම Site Branch එකකට Request හා Usage දැමීමට ඇති පහසුකම',
      'Telecom, Water, Electrical සහ Solar යන සියලුම New Connection Section 4 සඳහාම Main Project -> Under New Connections ව්‍යුහය',
      'Section අනුව Filter වන Client FOC: අදාළ NC Section එකට FOC ලැබුණු Main Projects ඇත්නම් පමණක් FOC Dropdown පෙන්වීම',
      'International Industry Section Templates (Telecom, Water, Electric, Solar) + "+ Add Field" Custom Field Builder',
      'Team Site Transfer ක්‍රියාවලිය: "Temporary Assigned to - [New Site]" -> Permanent "[Team Name] (Ref: [Previous Site])" සහ Sites History',
      'Site අනුව වෙන් වූ Team In-Hand Stock: කලින් Site එකේ භාර නොදුන් බඩු "Stock to Return - [Site Name]" යටතේ වෙනම පෙන්වීම',
      'බඩු ලබාගෙන ඇති Team Name Lock කිරීම සහ අදාළ Site එකේ බඩු පමණක් වැඩවලට භාවිත කිරීමේ නීතිය',
      'Team Returns (RV) සහ Branch Returns (BRM) දෙකේම Items ගණනාවක් ("+ Add Item" / "+ Add All") එක සැරේ Return කිරීම',
      'Connection Sections 1-2-3 Daily Progress: පියවර 1 Team & Area (Refresh කරන තුරු Lock වේ) -> පියවර 2 Connection -> පියවර 3 Usage',
      'ටැබ් 2කින් යුත් ශාඛා බඩු ඉල්ලුම්පත් (Normal Stock සහ Assigned-Site / ALL AREAS Client FOC Request)',
      'Material Usage / Daily Progress Entry හි Installed Qty සමඟ Wastage Qty (අපතේ යාම්) සටහන් කිරීම',
      'Usage History හි "Full Report for This Site (Project)" (Team Subtotals + Full Grand Total + PDF/CSV)',
    ],
  },
  {
    group: 'ISO Formats, Off Digital Signature, Glass Tone Themes, Multi-Currency Subscriptions සහ ආරක්ෂාව',
    items: [
      'Default ISO 9001:2015 Controlled Formats (FORMAT-01 සිට 04) සහ ස්වයංක්‍රීය Tenant Company Header',
      'Tab 2 Signer Governance: Prepared By, Approved By සහ Reviewed By නිලධාරීන්ගේ නම්, තනතුරු සහ අංශ',
      'Tab 3 Digital Signatures (Draw / Upload) සහ ස්ථිර "Off Digital Signature (Default for Printing)" විකල්පය',
      'සෑම වවුචරයකම සහ වාර්තාවකම පෑනෙන් අත්සන් (Hand Sign & Stamp) තැබීමට ඉඩ තබන "Off Digital Signature" ක්‍රමය',
      'සියලුම වගු (Inbound Receipts ඇතුළුව) සහ A4 වාර්තා සඳහා පැහැදිලි Uniform අකුරු ප්‍රමාණය (13.5px / 12px)',
      'Header එකෙන් සජීවීව මාරු විය හැකි "Glass Tone" Theme 9 ("Sapphire & Gold" Default ලෙස විවෘත වේ)',
      'LKR සහ ප්‍රධාන මුදල් ඒකක 5 (USD, EUR, GBP, AUD, SGD) සජීවී Real-Time FX අනුපාත සමඟ Subscriptions (Payments.lk / Stripe)',
      'PDF හෝ Image මගින් ආයතනයේ Format එක Upload කිරීම (උපරිම 1MB), Live A4 Format Studio සහ Isolated PDF',
      'Delete කිරීමේදී Admin Password අනිවාර්ය වීම, Audit Trail, Recycle Bin සහ 1-Click JSON Offline Backup',
    ],
  },
];

export const SystemUserGuideView: React.FC<SystemUserGuideViewProps> = ({
  onBackToOverview,
  onOpenSignup,
  onOpenLogin,
  initialLanguage = 'en',
  isInsideWorkspaceModal = false,
}) => {
  const [guideLang, setGuideLang] = useState<GuideLanguage>(initialLanguage);

  useEffect(() => {
    setGuideLang(initialLanguage);
  }, [initialLanguage]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  // Load Noto Sans Sinhala from Google Fonts so Sinhala text on screen & canvas PDF looks super crisp
  useEffect(() => {
    const fontId = 'apex-noto-sans-sinhala-font';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.crossOrigin = 'anonymous';
      link.href =
        'https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const activeChapters = guideLang === 'si' ? GUIDE_CHAPTERS_SI : GUIDE_CHAPTERS_EN;
  const activeFormatMatrix = guideLang === 'si' ? FORMAT_GROUPS_MATRIX_SI : FORMAT_GROUPS_MATRIX_EN;
  const activeFeatureList = guideLang === 'si' ? FEATURE_SUMMARY_LIST_SI : FEATURE_SUMMARY_LIST_EN;

  const filteredChapters = activeChapters.filter((ch) => {
    const matchesCat = selectedCategory === 'all' || ch.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesCat;
    const inTitle = ch.title.toLowerCase().includes(q) || ch.summary.toLowerCase().includes(q);
    const inSteps = ch.steps.some(
      (s) => s.stepTitle.toLowerCase().includes(q) || s.detail.toLowerCase().includes(q)
    );
    return matchesCat && (inTitle || inSteps);
  });

  // ==================== ENGLISH VECTOR A4 PDF GENERATOR ====================
  const generateEnglishVectorPdf = () => {
    const pdfSafeText = (raw: string): string =>
      raw
        .replace(/\u2192|→/g, '->')
        .replace(/\u2014|\u2013|—|–/g, ' - ')
        .replace(/\u2022|\u00B7|•|·/g, '-')
        .replace(/\u2713|\u2714|✓|✔/g, '[x]')
        .replace(/[\u201C\u201D“”]/g, '"')
        .replace(/[\u2018\u2019‘’]/g, "'")
        .replace(/[^\x20-\x7E\n]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageW = doc.internal.pageSize.getWidth(); // 210mm
    const pageH = doc.internal.pageSize.getHeight(); // 297mm
    const marginX = 14;
    const contentW = pageW - marginX * 2; // 182mm
    const innerPadX = 4.5;
    const innerTextW = contentW - innerPadX * 2 - 2; // 171mm
    let y = 14;

    const ensureSpace = (neededMm: number) => {
      if (y + neededMm > pageH - 18) {
        doc.addPage();
        doc.setFillColor(30, 38, 64);
        doc.rect(marginX, 10, contentW, 6.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(220, 151, 80);
        doc.text('APEX STOCK - OFFICIAL SYSTEM USER GUIDE & FEATURE HANDBOOK (ENGLISH)', marginX + 3, 14.5);
        doc.setTextColor(255, 255, 255);
        doc.text(`Edition ${new Date().getFullYear()}`, pageW - marginX - 3, 14.5, { align: 'right' });
        y = 22;
      }
    };

    // Cover Banner
    doc.setFillColor(30, 38, 64);
    doc.roundedRect(marginX, y, contentW, 28, 3, 3, 'F');
    doc.setFillColor(220, 151, 80);
    doc.rect(marginX, y + 26, contentW, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(220, 151, 80);
    doc.text('COMPLETE SYSTEM DOCUMENTATION & CLIENT HANDBOOK (ENGLISH EDITION)', marginX + 6, y + 7.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('APEX STOCK - SYSTEM USER GUIDE & FEATURE HANDBOOK', marginX + 6, y + 15.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(226, 232, 240);
    doc.text(
      'Multi-Site Warehouse Inventory, Field Crew Dispatch, Client FOC Stock & Company PDF/Image Format Studio',
      marginX + 6,
      y + 22
    );
    y += 34;

    // 12-Step Complete Chronological Guide
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 38, 64);
    doc.text('COMPLETE END-TO-END WORKSPACE FLOW & SYSTEM RULES (12 CLEAR STEPS)', marginX, y);
    y += 4;

    const stages = [
      'Step 01: Create Workspace - Sign up with Company Name, All-Countries Search, Currency, and real Admin Name (Workspace Slug app/... is auto-generated & View-Only).',
      'Step 02: Head Office Registers Master Data - Only Head Office (Main Admin) adds Items & Tools (with optional <200KB photo), Suppliers (with Payment Terms), and Clients.',
      'Step 03: Set Up Branches, Sub-Sites & Assign Projects - Head Office creates Regional Branches & optional Sub-Sites (locked once stock/FOC is issued), and assigns each Project to its specific Branch (or "ALL AREAS").',
      'Step 04: Head Office Registers Teams (With Section & Locks) - Main Admin registers Teams with mandatory Project Section (Staff Users see Teams View-Only and cannot create/edit/delete). Once stock is issued, Teams cannot be deleted or renamed, and Section unlocks only at 0 balance.',
      'Step 05: Assign Users & Managers to Branches + Site History - Head Office creates Staff/Manager accounts and assigns them to Regional or Sub-Site branches; every move logs Previous Sites, Start Dates & End Dates.',
      'Step 06: Send PO, Receive GRN & Client FOC Auto-Detect - Issue Supplier POs, confirm GRN deliveries into Main Stock, or log Client Free Stock (selecting a Project auto-detects and locks its assigned Branch).',
      'Step 07: Request Stock for Branches & Sub-Sites (RN) - Regional Branches request Normal or Branch-matched FOC stock from HQ; Sub-Sites request directly from their Parent Regional Branch (Parent Avl:).',
      'Step 08: Approve, Dispatch & Receive at Site - HQ approves Regional requests and Parent Regional approves Sub-Site requests (or uses "Issue Stock to Sub-Site"); receiving site confirms receipt into Site Branch Stock.',
      'Step 09: Issue to Teams (IN) & Team Site Transfer + History - Issue stock to Teams (IN). Staff can transfer ONLY their own site\'s teams: old-site stock stays isolated under "Stock to Return - [Previous Site]" until cleared to 0, logging Team History + Officer Name.',
      'Step 10: Daily Usage (PU), Section Team Filter & Auto FOC Reduction - Choosing a Project Section filters Teams strictly to that section; Usage auto-detects Branch/Main-Project Client FOC and automatically deducts Used + Wastage from the FOC pool.',
      'Step 11: Multi-Item Returns (RV / BRM), Damaged Tab & RTV - Teams return unused/damaged items (RV); damaged goods isolate in the Damaged Returns tab for upstream BRM dispatch (Sub-Site -> Parent Regional -> Main HQ -> Vendor RTV).',
      'Step 12: 3-Tier Lifecycle Summary, Formats & Final A4/PDF Reports - Click any Main Stock item for clean Adaptive 3-Tier flow (Main -> Regional -> [Sub-Site ->] Team -> Usage -> Balance), set ISO/Company Formats & Hand/Digital Signatures, and print A4/PDF reports.',
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const wrappedStages: string[][] = stages.map((stLine) =>
      doc.splitTextToSize(`- ${pdfSafeText(stLine)}`, innerTextW)
    );
    const totalStageLines = wrappedStages.reduce((acc, lines) => acc + lines.length, 0);
    const stagesBoxH = 5 + totalStageLines * 3.8 + (stages.length - 1) * 1.2;

    doc.setFillColor(250, 244, 236);
    doc.setDrawColor(220, 151, 80);
    doc.roundedRect(marginX, y, contentW, stagesBoxH, 2, 2, 'FD');

    let stageY = y + 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 38, 64);
    wrappedStages.forEach((lines) => {
      doc.text(lines, marginX + innerPadX, stageY);
      stageY += lines.length * 3.8 + 1.2;
    });
    y += stagesBoxH + 6;

    // Chapters
    GUIDE_CHAPTERS_EN.forEach((ch) => {
      ensureSpace(48);

      doc.setFillColor(30, 38, 64);
      doc.roundedRect(marginX, y, contentW, 8.5, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(220, 151, 80);
      doc.text(
        pdfSafeText(`${ch.number.toUpperCase()} | ${ch.categoryLabel.toUpperCase()}`),
        marginX + innerPadX,
        y + 5.7
      );
      y += 12;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      const titleLines = doc.splitTextToSize(pdfSafeText(ch.title), contentW);
      doc.text(titleLines, marginX, y);
      y += titleLines.length * 4.5 + 0.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(71, 85, 105);
      const summaryLines = doc.splitTextToSize(pdfSafeText(ch.summary), contentW);
      doc.text(summaryLines, marginX, y);
      y += summaryLines.length * 3.8 + 2.5;

      ch.steps.forEach((st) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.6);
        const stepTitleLines = doc.splitTextToSize(pdfSafeText(st.stepTitle), innerTextW);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const detailLines = doc.splitTextToSize(pdfSafeText(st.detail), innerTextW);

        const titleBlockH = stepTitleLines.length * 4;
        const detailBlockH = detailLines.length * 3.8;
        const boxH = 4 + titleBlockH + 1.5 + detailBlockH + 3;
        ensureSpace(boxH + 3);

        doc.setFillColor(253, 250, 245);
        doc.setDrawColor(220, 151, 80);
        doc.roundedRect(marginX, y, contentW, boxH, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.6);
        doc.setTextColor(30, 38, 64);
        doc.text(stepTitleLines, marginX + innerPadX, y + 4.8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(detailLines, marginX + innerPadX, y + 4.8 + titleBlockH + 1.2);

        y += boxH + 2.2;
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      const outputsText = pdfSafeText(`Key Outputs: ${ch.keyOutputs.join('  |  ')}`);
      const outLines = doc.splitTextToSize(outputsText, contentW);
      ensureSpace(outLines.length * 3.8 + 5);
      doc.setTextColor(158, 92, 25);
      doc.text(outLines, marginX, y + 2.2);
      y += outLines.length * 3.8 + 5.5;
    });

    // Format Studio Matrix
    ensureSpace(65);
    doc.setFillColor(30, 38, 64);
    doc.roundedRect(marginX, y, contentW, 8.5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(220, 151, 80);
    doc.text(
      'COMPANY DOCUMENT FORMAT STUDIO - 4 STANDARD FORMAT SLOTS & AFFECTED SECTIONS',
      marginX + innerPadX,
      y + 5.7
    );
    y += 12;

    FORMAT_GROUPS_MATRIX_EN.forEach((slot) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      const slotTitleLines = doc.splitTextToSize(
        pdfSafeText(`${slot.code}: ${slot.title}`),
        innerTextW
      );

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.8);
      const structLines = doc.splitTextToSize(
        pdfSafeText(`Structure: ${slot.structure}`),
        innerTextW
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      const affectsLines: string[] = [];
      slot.affectsTo.forEach((a) => {
        const wrapped = doc.splitTextToSize(pdfSafeText(`- ${a}`), innerTextW - 3);
        affectsLines.push(...wrapped);
      });

      const titleH = slotTitleLines.length * 4;
      const structH = structLines.length * 3.6;
      const affectsH = affectsLines.length * 3.6;
      const slotH = 5 + titleH + structH + 4.5 + affectsH + 3.5;
      ensureSpace(slotH + 3);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(marginX, y, contentW, slotH, 1.5, 1.5, 'FD');

      let curY = y + 4.8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(30, 38, 64);
      doc.text(slotTitleLines, marginX + innerPadX, curY);
      curY += titleH + 0.5;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.8);
      doc.setTextColor(100, 116, 139);
      doc.text(structLines, marginX + innerPadX, curY);
      curY += structH + 1;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(158, 92, 25);
      doc.text('This Format Affects To (Printed Sections):', marginX + innerPadX, curY);
      curY += 3.8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(15, 23, 42);
      doc.text(affectsLines, marginX + innerPadX + 2, curY);

      y += slotH + 2.5;
    });

    // Checklist
    ensureSpace(55);
    y += 2;
    doc.setFillColor(30, 38, 64);
    doc.roundedRect(marginX, y, contentW, 8.5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(220, 151, 80);
    doc.text('COMPLETE PLATFORM MODULE & FEATURE CHECKLIST', marginX + innerPadX, y + 5.7);
    y += 12;

    FEATURE_SUMMARY_LIST_EN.forEach((group) => {
      ensureSpace(24);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(30, 38, 64);
      doc.text(pdfSafeText(group.group), marginX, y);
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      group.items.forEach((item) => {
        const itemLines = doc.splitTextToSize(pdfSafeText(`[x]  ${item}`), contentW - 6);
        ensureSpace(itemLines.length * 3.8 + 1);
        doc.text(itemLines, marginX + 3, y);
        y += itemLines.length * 3.8 + 0.6;
      });
      y += 2.5;
    });

    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(203, 213, 225);
      doc.line(marginX, pageH - 12, pageW - marginX, pageH - 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Apex Stock Enterprise SaaS | Official Client User Guide & Feature Handbook | apexstox.com | support@apexstox.com',
        marginX,
        pageH - 7.5
      );
      doc.setFont('helvetica', 'bold');
      doc.text(`Page ${p} of ${totalPages}`, pageW - marginX, pageH - 7.5, { align: 'right' });
    }

    doc.save('Apex_Stock_English_User_Guide_Handbook.pdf');
  };

  // ==================== SINHALA NATIVE HARFBUZZ CANVAS A4 PDF GENERATOR ====================
  // Uses the browser's native 2D Canvas text shaper ("Noto Sans Sinhala", "Iskoola Pota", sans-serif)
  // so every Sinhala vowel sign (කොම්බුව, ඇලපිල්ල, ඉස්පිල්ල, පාපිල්ල) renders with 100% accuracy
  // and ctx.measureText wraps every line strictly inside its box with zero overflow!
  const generateSinhalaCanvasPdf = async () => {
    try {
      if ((document as any).fonts && (document as any).fonts.ready) {
        await (document as any).fonts.ready;
      }
    } catch {}

    const PAGE_W = 1240; // A4 Portrait at ~150 DPI
    const PAGE_H = 1754;
    const MARGIN_X = 76;
    const CONTENT_W = PAGE_W - MARGIN_X * 2; // 1088px
    const INNER_PAD_X = 28;
    const INNER_TEXT_W = CONTENT_W - INNER_PAD_X * 2 - 8; // 1024px safe text width inside boxes
    const BOTTOM_LIMIT = PAGE_H - 95;

    const fontStack = '"Noto Sans Sinhala", "Iskoola Pota", "Nirmala UI", system-ui, sans-serif';
    const pages: HTMLCanvasElement[] = [];

    const createPage = (isFirstPage: boolean): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; y: number } => {
      const canvas = document.createElement('canvas');
      canvas.width = PAGE_W;
      canvas.height = PAGE_H;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, PAGE_W, PAGE_H);
      ctx.textBaseline = 'top';

      if (!isFirstPage) {
        // Continuation header bar
        ctx.fillStyle = '#1e2640';
        ctx.fillRect(MARGIN_X, 52, CONTENT_W, 38);
        ctx.font = `700 15px ${fontStack}`;
        ctx.fillStyle = '#dc9750';
        ctx.fillText('APEX STOCK — නිල සිංහල පරිශීලක උපදෙස් සහ විශේෂාංග අත්පොත', MARGIN_X + 16, 62);
        return { canvas, ctx, y: 112 };
      }
      return { canvas, ctx, y: 68 };
    };

    const drawRoundedRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      fill?: string,
      stroke?: string,
      lineWidth: number = 2
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    };

    const wrapTextLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
      const paragraphs = text.split('\n');
      const lines: string[] = [];
      for (const para of paragraphs) {
        const words = para.trim().split(/\s+/);
        if (words.length === 0 || (words.length === 1 && words[0] === '')) {
          lines.push('');
          continue;
        }
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const testLine = `${currentLine} ${word}`;
          if (ctx.measureText(testLine).width <= maxWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        lines.push(currentLine);
      }
      return lines;
    };

    let current = createPage(true);
    pages.push(current.canvas);

    const ensureSpace = (neededPx: number) => {
      if (current.y + neededPx > BOTTOM_LIMIT) {
        current = createPage(false);
        pages.push(current.canvas);
      }
    };

    // ==================== 1. COVER HEADER BANNER ====================
    drawRoundedRect(current.ctx, MARGIN_X, current.y, CONTENT_W, 165, 16, '#1e2640');
    current.ctx.fillStyle = '#dc9750';
    current.ctx.fillRect(MARGIN_X, current.y + 153, CONTENT_W, 12);

    current.ctx.font = `700 17px ${fontStack}`;
    current.ctx.fillStyle = '#dc9750';
    current.ctx.fillText('සම්පූර්ණ පද්ධති උපදෙස් සහ විශේෂාංග අත්පොත (SINHALA USER GUIDE)', MARGIN_X + 30, current.y + 24);

    current.ctx.font = `800 30px ${fontStack}`;
    current.ctx.fillStyle = '#ffffff';
    current.ctx.fillText('APEX STOCK — නිල සිංහල පරිශීලක අත්පොත', MARGIN_X + 30, current.y + 58);

    current.ctx.font = `500 17px ${fontStack}`;
    current.ctx.fillStyle = '#e2e8f0';
    current.ctx.fillText(
      'ප්‍රධාන ගබඩාව, ශාඛා ගබඩා, වැඩ කණ්ඩායම්, ව්‍යාපෘති සහ Company Document Formats සකස් කරන ආකාරය',
      MARGIN_X + 30,
      current.y + 106
    );
    current.y += 195;

    // ==================== 2. 12-STEP CHRONOLOGICAL GUIDE & RULES ====================
    current.ctx.font = `800 21px ${fontStack}`;
    current.ctx.fillStyle = '#1e2640';
    current.ctx.fillText('ආරම්භයේ සිට අවසානය දක්වා පද්ධතිය සහ විශේෂ නීති (පියවර 12)', MARGIN_X, current.y);
    current.y += 32;

    const siStages = [
      'පියවර 01 (ආයතනය ලියාපදිංචි කරන්න): Company Name, ලෝකයේ ඕනෑම රටක්, මුදල් වර්ගය සහ පරිපාලකගේ නම දී ගිණුම සාදන්න (Workspace Slug ඉබේම සෑදෙන අතර View-Only වේ).',
      'පියවර 02 (Head Office මගින් Master දත්ත දමන්න): බඩු/උපකරණ, Suppliers (Payment Terms සමඟ) සහ Clients ලියාපදිංචි කරන්නේ Head Office (Main Admin) පමණි.',
      'පියවර 03 (ශාඛා, Sub-Sites හා Branch අනුව Projects සෑදීම): Regional ශාඛා හා Sub-Sites (බඩු දුන් පසු Delete/මාරු Lock වේ) සාදා, සෑම Project එකක්ම අදාළ Branch එකට Assign කරන්න ("ALL AREAS" ද හැක).',
      'පියවර 04 (Head Office මගින් Section සමඟ Teams සෑදීම): සාමාන්‍ය Users ලට Teams Register කළ නොහැක (View-Only). Team සෑදීමේදී Project Section අනිවාර්ය වන අතර බඩු Issue කළ Team Delete හෝ Rename කළ නොහැක.',
      'පියවර 05 (Users හා Managers ලා Branch වලට Assign + History): නිලධාරීන් ශාඛාවලට Assign කරන අතර, වෙනත් ශාඛාවකට මාරු කරද්දී Previous Sites, Start/End Dates ඉතිහාසය සටහන් වේ.',
      'පියවර 06 (PO දැමීම, GRN හා FOC Auto-Detect): Supplier වෙත PO දමා GRN මගින් ප්‍රධාන ගබඩාවට ගන්න. Client FOC දමද්දී Project එක තේරූ සැණින් අදාළ Branch එක Auto-Detect වී Lock වේ.',
      'පියවර 07 (ශාඛා සහ Sub-Sites සඳහා Stock Request): Regional ශාඛා HQ වෙතින් ද, Sub-Sites තම Parent Regional ශාඛාවෙන් ද (Parent Avl:) Stock Requisition (RN) මගින් බඩු ඉල්ලුම් කරයි.',
      'පියවර 08 (අනුමත කර ශාඛාවට ලබාගැනීම): HQ හෝ Regional ශාඛාව Approve කර එවූ පසු (හෝ "Issue Stock to Sub-Site" මගින්) ලැබෙන ශාඛාව Receive කර Site Stock වෙත ගනී.',
      'පියවර 09 (Teams වලට බඩු දීම, Team Transfer සහ History): ශාඛාවෙන් Teams වෙත බඩු දේ (IN). නිලධාරීන්ට තම Site එකේ Team පමණක් Transfer කළ හැක: පරණ බඩු "Stock to Return" ලෙස වෙන්ව පෙන්වා 0 වූ පසු Permanent වන අතර Transfer කළ නිලධාරියාගේ නම Team History හි සටහන් වේ.',
      'පියවර 10 (දෛනික Usage, Section Filter හා ස්වයංක්‍රීය FOC අඩුවීම): Usage හි Section තේරූ විට එම Section එකේ Teams පමණක් පෙන්වයි. Main Project FOC තොගය Auto-Detect වී භාවිත/අපතේ ප්‍රමාණ ඉබේම FOC වෙතින් අඩු වේ (Auto Reduction).',
      'පියවර 11 (ආපසු භාරදීම - RV/BRM, Damaged Tab සහ RTV): Teams ඉතිරි/කැඩුණු බඩු ශාඛාවට දේ (RV). Damaged ඒවා වෙනම Damaged Returns ටැබ් එකෙන් Sub-Site -> Regional -> HQ -> Supplier (RTV) ලෙස යැවේ.',
      'පියවර 12 (3-Tier Item Summary, Formats සහ අවසන් වාර්තා): ප්‍රධාන ගබඩාවේ Item ක්ලික් කර 3-Tier Flow බැලීම, ISO/Company Formats හා අත්සන් (Hand-Sign/Digital) සැකසීම සහ A4/PDF වාර්තා මුද්‍රණය.',
    ];

    current.ctx.font = `600 16.5px ${fontStack}`;
    const wrappedSiStages = siStages.map((s) => wrapTextLines(current.ctx, `• ${s}`, INNER_TEXT_W));
    const totalStageLineCount = wrappedSiStages.reduce((acc, l) => acc + l.length, 0);
    const stageBoxH = 28 + totalStageLineCount * 25 + (siStages.length - 1) * 8;

    drawRoundedRect(current.ctx, MARGIN_X, current.y, CONTENT_W, stageBoxH, 12, '#faf4ec', '#dc9750', 2);
    let stY = current.y + 16;
    current.ctx.fillStyle = '#1e2640';
    wrappedSiStages.forEach((lines) => {
      lines.forEach((line) => {
        current.ctx.fillText(line, MARGIN_X + INNER_PAD_X, stY);
        stY += 25;
      });
      stY += 8;
    });
    current.y += stageBoxH + 34;

    // ==================== 3. CHAPTERS 01 TO 12 ====================
    GUIDE_CHAPTERS_SI.forEach((ch) => {
      ensureSpace(240);

      // Chapter Banner
      drawRoundedRect(current.ctx, MARGIN_X, current.y, CONTENT_W, 46, 10, '#1e2640');
      current.ctx.font = `700 17px ${fontStack}`;
      current.ctx.fillStyle = '#dc9750';
      current.ctx.fillText(`${ch.number}  |  ${ch.categoryLabel}`, MARGIN_X + INNER_PAD_X, current.y + 13);
      current.y += 60;

      // Chapter Title
      current.ctx.font = `800 23px ${fontStack}`;
      current.ctx.fillStyle = '#0f172a';
      const chTitleLines = wrapTextLines(current.ctx, ch.title, CONTENT_W);
      chTitleLines.forEach((l) => {
        current.ctx.fillText(l, MARGIN_X, current.y);
        current.y += 31;
      });
      current.y += 4;

      // Chapter Summary
      current.ctx.font = `500 17px ${fontStack}`;
      current.ctx.fillStyle = '#334155';
      const chSumLines = wrapTextLines(current.ctx, ch.summary, CONTENT_W);
      chSumLines.forEach((l) => {
        current.ctx.fillText(l, MARGIN_X, current.y);
        current.y += 25;
      });
      current.y += 14;

      // Steps
      ch.steps.forEach((st) => {
        current.ctx.font = `700 18px ${fontStack}`;
        const stepTitleLines = wrapTextLines(current.ctx, st.stepTitle, INNER_TEXT_W);

        current.ctx.font = `500 16.5px ${fontStack}`;
        const stepDetailLines = wrapTextLines(current.ctx, st.detail, INNER_TEXT_W);

        const titleH = stepTitleLines.length * 26;
        const detailH = stepDetailLines.length * 24;
        const boxH = 22 + titleH + 8 + detailH + 18;

        ensureSpace(boxH + 16);
        drawRoundedRect(current.ctx, MARGIN_X, current.y, CONTENT_W, boxH, 10, '#fdfaf5', '#dc9750', 1.8);

        let curStepY = current.y + 14;
        current.ctx.font = `700 18px ${fontStack}`;
        current.ctx.fillStyle = '#1e2640';
        stepTitleLines.forEach((l) => {
          current.ctx.fillText(l, MARGIN_X + INNER_PAD_X, curStepY);
          curStepY += 26;
        });

        curStepY += 6;
        current.ctx.font = `500 16.5px ${fontStack}`;
        current.ctx.fillStyle = '#1e293b';
        stepDetailLines.forEach((l) => {
          current.ctx.fillText(l, MARGIN_X + INNER_PAD_X, curStepY);
          curStepY += 24;
        });

        current.y += boxH + 14;
      });

      // Key Outputs
      current.ctx.font = `700 16px ${fontStack}`;
      const outLines = wrapTextLines(
        current.ctx,
        `ප්‍රධාන ප්‍රතිඵල (Key Outputs): ${ch.keyOutputs.join('   |   ')}`,
        CONTENT_W
      );
      ensureSpace(outLines.length * 24 + 28);
      current.ctx.fillStyle = '#9e5c19';
      outLines.forEach((l) => {
        current.ctx.fillText(l, MARGIN_X, current.y + 4);
        current.y += 24;
      });
      current.y += 28;
    });

    // ==================== 4. COMPANY FORMAT SLOTS MATRIX ====================
    ensureSpace(320);
    drawRoundedRect(current.ctx, MARGIN_X, current.y, CONTENT_W, 46, 10, '#1e2640');
    current.ctx.font = `700 17px ${fontStack}`;
    current.ctx.fillStyle = '#dc9750';
    current.ctx.fillText(
      'COMPANY DOCUMENT FORMAT STUDIO — ආකෘති කාණ්ඩ 4 සහ අදාළ වන Sections (This Format Affects To)',
      MARGIN_X + INNER_PAD_X,
      current.y + 13
    );
    current.y += 62;

    FORMAT_GROUPS_MATRIX_SI.forEach((slot) => {
      current.ctx.font = `700 18px ${fontStack}`;
      const titleLines = wrapTextLines(current.ctx, `${slot.code}: ${slot.title}`, INNER_TEXT_W);

      current.ctx.font = `600 16px ${fontStack}`;
      const structLines = wrapTextLines(current.ctx, `ව්‍යුහය: ${slot.structure}`, INNER_TEXT_W);

      current.ctx.font = `500 16px ${fontStack}`;
      const affectsLines: string[] = [];
      slot.affectsTo.forEach((a) => {
        affectsLines.push(...wrapTextLines(current.ctx, `✓  ${a}`, INNER_TEXT_W - 12));
      });

      const boxH =
        24 +
        titleLines.length * 26 +
        structLines.length * 24 +
        30 +
        affectsLines.length * 24 +
        18;
      ensureSpace(boxH + 16);

      drawRoundedRect(current.ctx, MARGIN_X, current.y, CONTENT_W, boxH, 10, '#ffffff', '#cbd5e1', 2);

      let sy = current.y + 14;
      current.ctx.font = `700 18px ${fontStack}`;
      current.ctx.fillStyle = '#1e2640';
      titleLines.forEach((l) => {
        current.ctx.fillText(l, MARGIN_X + INNER_PAD_X, sy);
        sy += 26;
      });

      sy += 4;
      current.ctx.font = `600 16px ${fontStack}`;
      current.ctx.fillStyle = '#475569';
      structLines.forEach((l) => {
        current.ctx.fillText(l, MARGIN_X + INNER_PAD_X, sy);
        sy += 24;
      });

      sy += 6;
      current.ctx.font = `700 16px ${fontStack}`;
      current.ctx.fillStyle = '#9e5c19';
      current.ctx.fillText('මෙම Format එක අදාළ වන Sections (This Format Affects To):', MARGIN_X + INNER_PAD_X, sy);
      sy += 25;

      current.ctx.font = `500 16px ${fontStack}`;
      current.ctx.fillStyle = '#0f172a';
      affectsLines.forEach((l) => {
        current.ctx.fillText(l, MARGIN_X + INNER_PAD_X + 10, sy);
        sy += 24;
      });

      current.y += boxH + 16;
    });

    // ==================== 5. FEATURE CHECKLIST ====================
    ensureSpace(260);
    current.y += 10;
    drawRoundedRect(current.ctx, MARGIN_X, current.y, CONTENT_W, 46, 10, '#1e2640');
    current.ctx.font = `700 17px ${fontStack}`;
    current.ctx.fillStyle = '#dc9750';
    current.ctx.fillText('සම්පූර්ණ පද්ධති විශේෂාංග ලැයිස්තුව (Complete Feature Checklist)', MARGIN_X + INNER_PAD_X, current.y + 13);
    current.y += 62;

    FEATURE_SUMMARY_LIST_SI.forEach((grp) => {
      ensureSpace(140);
      current.ctx.font = `700 18px ${fontStack}`;
      current.ctx.fillStyle = '#1e2640';
      current.ctx.fillText(grp.group, MARGIN_X, current.y);
      current.y += 30;

      current.ctx.font = `500 16.5px ${fontStack}`;
      current.ctx.fillStyle = '#1e293b';
      grp.items.forEach((itm) => {
        const lines = wrapTextLines(current.ctx, `✓  ${itm}`, CONTENT_W - 20);
        ensureSpace(lines.length * 24 + 8);
        lines.forEach((l) => {
          current.ctx.fillText(l, MARGIN_X + 14, current.y);
          current.y += 24;
        });
        current.y += 4;
      });
      current.y += 16;
    });

    // ==================== 6. FOOTER & PAGE NUMBERS ON ALL PAGES ====================
    const totalPages = pages.length;
    pages.forEach((canvas, idx) => {
      const ctx = canvas.getContext('2d')!;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(MARGIN_X, PAGE_H - 68);
      ctx.lineTo(PAGE_W - MARGIN_X, PAGE_H - 68);
      ctx.stroke();

      ctx.font = `500 14px ${fontStack}`;
      ctx.fillStyle = '#64748b';
      ctx.fillText(
        'Apex Stock Enterprise SaaS · නිල සිංහල පරිශීලක උපදෙස් අත්පොත · apexstox.com · support@apexstox.com',
        MARGIN_X,
        PAGE_H - 48
      );
      ctx.font = `700 14px ${fontStack}`;
      const pageLabel = `පිටුව ${idx + 1} / ${totalPages}`;
      const labelW = ctx.measureText(pageLabel).width;
      ctx.fillText(pageLabel, PAGE_W - MARGIN_X - labelW, PAGE_H - 48);
    });

    // Pack all rendered A4 pages into a multi-page jsPDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    pages.forEach((canvas, idx) => {
      if (idx > 0) pdf.addPage();
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    });

    pdf.save('Apex_Stock_Sinhala_User_Guide_Handbook.pdf');
  };

  const handlePrintPdfManual = async () => {
    setIsDownloadingPdf(true);
    try {
      if (guideLang === 'si') {
        await generateSinhalaCanvasPdf();
        setPdfSuccessMessage('සිංහල PDF අත්පොත බාගත විය!');
      } else {
        generateEnglishVectorPdf();
        setPdfSuccessMessage('English PDF Downloaded!');
      }
      setTimeout(() => setPdfSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to generate User Guide PDF:', err);
      try {
        await printHtmlElement('user-guide-printable-area', 'Apex_Stock_User_Guide');
      } catch {}
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div
      className="py-6 sm:py-12 relative z-10"
      style={
        guideLang === 'si'
          ? { fontFamily: '"Noto Sans Sinhala", "Iskoola Pota", system-ui, sans-serif' }
          : undefined
      }
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* ==================== TOP BAR: BACK + LANGUAGE TABS + DOWNLOAD PDF ==================== */}
        <div className="no-print flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-5 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToOverview}
              className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-white/[0.09] hover:bg-white/[0.16] backdrop-blur-xl text-white border border-amber-300/35 text-xs font-extrabold flex items-center justify-center gap-1.5 sm:gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] cursor-pointer transition whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>
                {isInsideWorkspaceModal
                  ? guideLang === 'si'
                    ? 'වසන්න (Close Guide)'
                    : 'Close User Guide'
                  : guideLang === 'si'
                  ? 'ප්‍රධාන පිටුවට (Overview)'
                  : 'Back to Platform Overview'}
              </span>
            </button>

            {/* 2-TAB LANGUAGE SWITCHER: ENGLISH GUIDE vs SINHALA GUIDE */}
            <div className="bg-[#08122b]/75 backdrop-blur-xl p-1 rounded-xl border border-white/15 flex items-center gap-1 shadow-md">
              <button
                type="button"
                onClick={() => setGuideLang('en')}
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  guideLang === 'en'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-[#071026] shadow-xs'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>English Guide</span>
              </button>

              <button
                type="button"
                onClick={() => setGuideLang('si')}
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  guideLang === 'si'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-[#071026] shadow-xs'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Sinhala Guide (සිංහල අත්පොත)</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
            <button
              type="button"
              onClick={handlePrintPdfManual}
              disabled={isDownloadingPdf}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 text-[#071026] font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 ring-1 ring-white/40 cursor-pointer transition whitespace-nowrap disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>
                {isDownloadingPdf
                  ? guideLang === 'si'
                    ? 'සිංහල PDF සකසමින්...'
                    : 'Generating PDF...'
                  : pdfSuccessMessage
                  ? pdfSuccessMessage
                  : guideLang === 'si'
                  ? 'සිංහල Guide එක බාගන්න (PDF)'
                  : 'Download English Guide (PDF)'}
              </span>
            </button>

            {!isInsideWorkspaceModal && onOpenSignup && (
              <button
                type="button"
                onClick={onOpenSignup}
                className="w-full sm:w-auto px-3.5 sm:px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-xl text-white border border-white/18 font-bold text-xs flex items-center justify-center gap-1.5 sm:gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] cursor-pointer transition whitespace-nowrap"
              >
                <span className="text-amber-300 font-black">
                  {guideLang === 'si' ? 'දින 7ක නොමිලේ ගිණුම අරඹන්න' : 'Start 7-Day Free Trial'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            )}
          </div>
        </div>

        {/* ==================== PRINTABLE & INTERACTIVE MANUAL CONTAINER ==================== */}
        <div id="user-guide-printable-area" className="printable-document space-y-6 sm:space-y-8">
          {/* Official Print-Only Cover Header */}
          <div className="print-only border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-950">
                  {guideLang === 'si'
                    ? 'APEX STOCK — නිල සිංහල පරිශීලක උපදෙස් සහ විශේෂාංග අත්පොත'
                    : 'APEX STOCK — OFFICIAL SYSTEM USER GUIDE & FEATURE HANDBOOK'}
                </h1>
                <p className="text-xs text-slate-700 mt-1">
                  {guideLang === 'si'
                    ? 'ප්‍රධාන ගබඩාව, ශාඛා ගබඩා, වැඩ කණ්ඩායම්, ව්‍යාපෘති සහ Company PDF/Image Format Studio උපදෙස් මාලාව'
                    : 'Enterprise Cloud Inventory, Multi-Site Yard Operations, Company PDF/Image Format Studio & Field Crew Dispatch'}
                </p>
              </div>
              <div className="text-right text-xs text-slate-600 font-mono">
                <div>Edition: {new Date().getFullYear()} | apexstox.com</div>
                <div>support@apexstox.com</div>
              </div>
            </div>
          </div>

          {/* Hero Banner of the User Guide Tab */}
          <div className="rounded-2xl sm:rounded-[28px] landing-glass-card-light p-4 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#09132c] via-amber-400 to-[#09132c] no-print" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-700 mb-2">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>
                    {guideLang === 'si'
                      ? 'සම්පූර්ණ පද්ධති ක්‍රියාවලිය පැහැදිලි කරන සරල සිංහල අත්පොත'
                      : 'Complete System Documentation & Client Handbook'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-[#081024] tracking-tight leading-tight text-balance">
                  {guideLang === 'si'
                    ? 'Apex Stock ක්‍රියාත්මක වන ආකාරය: පියවරෙන් පියවර සරල සිංහල උපදෙස් මාලාව'
                    : 'How Apex Stock Works: Step-by-Step User Guide, Document Format Studio & Features'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed font-medium">
                  {guideLang === 'si'
                    ? 'ඔබේ ප්‍රධාන ගබඩාව (Central Warehouse), ප්‍රාදේශීය ශාඛා ගබඩා (Site Branches), වැඩ කණ්ඩායම් (Field Teams), සේවාදායකයින් නොමිලේ සපයන තොග (Client FOC), යන්ත්‍රෝපකරණ සහ ඔබේ ආයතනයේ PDF/Image Document Formats පද්ධතියට ඇතුළත් කර මුද්‍රණය කරගන්නා ආකාරය මෙහි සරල සිංහලෙන් විස්තර කර ඇත.'
                    : 'Everything you need to understand how materials, client-supplied stock, heavy machinery, daily crew dispatches, and custom PDF/Image company document formats work across your headquarters, regional site yards, and active projects. Read online below or save this handbook as an A4 PDF.'}
                </p>
              </div>

              {/* Quick PDF & Language Switch Box */}
              <div className="no-print shrink-0 landing-glass-card text-white rounded-2xl p-5 lg:w-80 shadow-xl">
                <div className="text-xs font-bold text-amber-300">
                  {guideLang === 'si' ? 'PDF අත්පොතක් ලෙස බාගත කරගන්න' : 'Share with Your Team or Management'}
                </div>
                <p className="text-[11px] text-slate-200 mt-1 leading-relaxed">
                  {guideLang === 'si'
                    ? 'මෙම සම්පූර්ණ සිංහල උපදෙස් මාලාව A4 PDF ගොනුවක් ලෙස ඔබේ දුරකථනයට හෝ පරිගණකයට බාගත කර කාර්ය මණ්ඩලය සමඟ බෙදාගන්න.'
                    : 'Save this complete guide as a clean A4 PDF document to review offline with project managers, engineers, or storekeepers.'}
                </p>
                <button
                  type="button"
                  onClick={handlePrintPdfManual}
                  disabled={isDownloadingPdf}
                  className="mt-3.5 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 text-[#071026] font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition whitespace-nowrap disabled:opacity-60 shadow-md shadow-amber-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isDownloadingPdf
                      ? guideLang === 'si'
                        ? 'සිංහල PDF සකසමින්...'
                        : 'Generating PDF...'
                      : pdfSuccessMessage
                      ? pdfSuccessMessage
                      : guideLang === 'si'
                      ? 'සිංහල PDF අත්පොත බාගන්න'
                      : 'Download English PDF Handbook'}
                  </span>
                </button>
              </div>
            </div>

            {/* ==================== 12-STEP COMPLETE CHRONOLOGICAL FLOW & SYSTEM RULES ==================== */}
            <div className="mt-8 pt-7 border-t border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="text-xs sm:text-sm font-extrabold text-[#081024] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {guideLang === 'si'
                      ? 'ආරම්භයේ සිට අවසානය දක්වා පද්ධතිය සහ විශේෂ පාලන නීති (පියවර 12)'
                      : 'Complete End-to-End Flow & Smart System Rules (12 Clear Steps)'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {guideLang === 'si'
                    ? 'Head Office සැකසුම් සිට බඩු ඉල්ලුම්, FOC ස්වයංක්‍රීය අඩුවීම් හා Team Transfers දක්වා'
                    : 'From Head Office setup to branch projects, team locks, auto FOC reduction & reports'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(guideLang === 'si'
                  ? [
                      {
                        stage: 'පියවර 01',
                        title: 'ආයතනය ලියාපදිංචි කරන්න',
                        desc: 'Company Name, ලෝකයේ ඕනෑම රටක් (Search), මුදල් වර්ගය සහ පරිපාලක නම දී ගිණුම සාදන්න. Workspace Slug ඉබේම සෑදෙන අතර View-Only වේ.',
                        icon: Globe,
                      },
                      {
                        stage: 'පියවර 02',
                        title: 'Head Office මගින් Master දත්ත දමන්න',
                        desc: 'Items/Tools (200KB ට අඩු Photo සමඟ), Suppliers (Payment Terms සමඟ) සහ Clients ඇතුළත් කරන්නේ Head Office (Main Admin) පමණි.',
                        icon: Boxes,
                      },
                      {
                        stage: 'පියවර 03',
                        title: 'ශාඛා, Sub-Sites හා Branch Projects',
                        desc: 'Regional ශාඛා හා Sub-Sites (බඩු දුන් පසු Delete/මාරු Lock වේ) සාදන්න. සෑම Project එකක්ම අදාළ Branch එකට Assign කෙරේ (හෝ ALL AREAS).',
                        icon: FolderKanban,
                      },
                      {
                        stage: 'පියවර 04',
                        title: 'Teams (Section සමඟ) හා Delete Lock',
                        desc: 'Users ලට Teams සෑදිය නොහැක (View-Only) — Head Office පමණක් Section එක තෝරා Teams සාදයි. බඩු දුන් Team එකක් Delete හෝ Rename කළ නොහැක.',
                        icon: Lock,
                      },
                      {
                        stage: 'පියවර 05',
                        title: 'Users / Managers Assign + Site History',
                        desc: 'Head Office විසින් Staff Users හා Site Managers ලා ශාඛාවලට Assign කරයි. වෙනත් Site එකකට මාරු කළ විට Previous Sites, Start/End Dates ඉතිහාසය සටහන් වේ.',
                        icon: UserCheck,
                      },
                      {
                        stage: 'පියවර 06',
                        title: 'PO, GRN සහ FOC Auto-Branch Detect',
                        desc: 'Supplier වෙත PO යවා GRN මගින් ප්‍රධාන ගබඩාවට ගන්න. Client FOC දමද්දී Project එක තේරූ සැණින් අදාළ Branch එක Auto-Detect වී Lock වේ.',
                        icon: Gift,
                      },
                      {
                        stage: 'පියවර 07',
                        title: 'ශාඛා හා Sub-Sites Stock Request (RN)',
                        desc: 'Regional ශාඛා HQ වෙතින් Normal හෝ Branch FOC ඉල්ලයි. Sub-Sites ඉබේම තම Parent Regional ශාඛාවෙන් (Parent Avl:) බඩු ඉල්ලුම් කරයි.',
                        icon: Send,
                      },
                      {
                        stage: 'පියවර 08',
                        title: 'අනුමත කර ශාඛාවට බඩු ලබාගන්න',
                        desc: 'HQ හෝ Parent Regional අනුමත කර එවූ පසු (හෝ Issue Stock to Sub-Site), ලැබෙන ශාඛාව Receive කර Site Branch Stock වෙත ගනී.',
                        icon: CheckCircle2,
                      },
                      {
                        stage: 'පියවර 09',
                        title: 'Teams නිකුත් කිරීම, Transfer & History',
                        desc: 'Teams වෙත බඩු දේ (IN). නිලධාරීන්ට තම Site එකේ Team පමණක් Transfer කළ හැක: පරණ බඩු "Stock to Return" වෙන්ව තබා 0 වූ පසු Permanent වී Officer නම සටහන් වේ.',
                        icon: Users2,
                      },
                      {
                        stage: 'පියවර 10',
                        title: 'Usage, Section Filter & FOC Auto-Reduce',
                        desc: 'Section තේරූ විට එම Section Teams පමණක් පෙන්වයි. Main Project FOC තොගය Auto-Detect වී භාවිත හා අපතේ ප්‍රමාණ ඉබේම FOC වෙතින් අඩු වේ.',
                        icon: HardHat,
                      },
                      {
                        stage: 'පියවර 11',
                        title: 'Returns (RV/BRM), Damaged Tab & RTV',
                        desc: 'Teams ඉතිරි/කැඩුණු බඩු ශාඛාවට දේ (RV). Damaged ඒවා Damaged Returns ටැබ් හරහා Sub-Site -> Regional -> HQ -> Supplier (RTV) ලෙස ආපසු යැවේ.',
                        icon: RotateCcw,
                      },
                      {
                        stage: 'පියවර 12',
                        title: '3-Tier Summary, Formats & Final Reports',
                        desc: 'Main Stock Item ක්ලික් කර 3-Tier Flow බලන්න (Main -> Regional -> [Sub-Site ->] Team -> Usage -> Balance), Formats/Signatures සකසා A4/PDF Print කරන්න.',
                        icon: FileText,
                      },
                    ]
                  : [
                      {
                        stage: 'Step 01',
                        title: 'Create Company Workspace',
                        desc: 'Sign up with Company Name, Searchable All-Countries picker, Currency & Admin Name. Workspace Slug (app/...) is auto-generated as View-Only.',
                        icon: Globe,
                      },
                      {
                        stage: 'Step 02',
                        title: 'Head Office Registers Master Data',
                        desc: 'Only Head Office (Main Admin) adds Items & Tools (with optional <200KB photo), Suppliers (with Payment Terms), and Clients.',
                        icon: Boxes,
                      },
                      {
                        stage: 'Step 03',
                        title: 'Branches, Sub-Sites & Branch Projects',
                        desc: 'Head Office sets up Regional Branches & optional Sub-Sites (locked after stock/FOC issue). Every Project is assigned to its Branch (or ALL AREAS).',
                        icon: FolderKanban,
                      },
                      {
                        stage: 'Step 04',
                        title: 'Teams (With Section) & Delete Lock',
                        desc: 'Staff Users cannot add/edit Teams (View-Only) — Head Office creates Teams with a mandatory Project Section. Stock-issued Teams cannot be deleted or renamed.',
                        icon: Lock,
                      },
                      {
                        stage: 'Step 05',
                        title: 'Assign Users & Managers + Site History',
                        desc: 'Head Office assigns Staff & Site Managers to Branches. Moving any User/Supervisor records Previous Sites, Start Dates & End Dates automatically.',
                        icon: UserCheck,
                      },
                      {
                        stage: 'Step 06',
                        title: 'PO, GRN & Client FOC Auto-Detect',
                        desc: 'Send Supplier POs and receive goods via GRN into Main Stock. When logging Client FOC, picking a Project auto-detects and locks its assigned Branch.',
                        icon: Gift,
                      },
                      {
                        stage: 'Step 07',
                        title: 'Request Stock for Branches & Sub-Sites',
                        desc: 'Regional Branches request Normal or Branch-matched FOC stock from HQ; Sub-Sites automatically request from their Parent Regional Branch (Parent Avl:).',
                        icon: Send,
                      },
                      {
                        stage: 'Step 08',
                        title: 'Approve, Dispatch & Receive at Site',
                        desc: 'HQ approves Regional requests and Parent Regional approves Sub-Site requests (or uses Issue Stock to Sub-Site). Receiving Branch confirms into Site Stock.',
                        icon: CheckCircle2,
                      },
                      {
                        stage: 'Step 09',
                        title: 'Issue to Teams, Transfer & History',
                        desc: 'Issue stock to Teams (IN). Officers can transfer ONLY own-site teams: old-site stock isolates under "Stock to Return" until cleared to 0, logging Officer Name in Team History.',
                        icon: Users2,
                      },
                      {
                        stage: 'Step 10',
                        title: 'Daily Usage, Section Filter & FOC Reduce',
                        desc: 'Selecting a Project Section filters Teams strictly to that section. Usage auto-detects Branch/Main-Project FOC and deducts Used + Wastage automatically.',
                        icon: HardHat,
                      },
                      {
                        stage: 'Step 11',
                        title: 'Returns (RV/BRM), Damaged Tab & RTV',
                        desc: 'Teams return extra/damaged items (RV); damaged stock isolates in the Damaged Returns tab for upstream BRM (Sub-Site -> Regional -> HQ -> Vendor RTV).',
                        icon: RotateCcw,
                      },
                      {
                        stage: 'Step 12',
                        title: '3-Tier Summary, Formats & Final Reports',
                        desc: 'Click any Main Stock item for clean 3-Tier Flow (Main -> Regional -> [Sub-Site ->] Team -> Usage -> Balance), set Formats/Signatures & print A4/PDF.',
                        icon: FileText,
                      },
                    ]
                ).map((item) => {
                  const StageIcon = item.icon;
                  return (
                    <div
                      key={item.stage}
                      className="rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 p-4 flex flex-col justify-between shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-mono font-extrabold text-amber-700">
                            {item.stage}
                          </span>
                          <StageIcon className="w-4 h-4 text-[#081024] shrink-0" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-black text-[#081024]">{item.title}</h3>
                        <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed font-medium">
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
          <div className="no-print rounded-2xl landing-glass-card-light p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Category Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {(guideLang === 'si'
                ? [
                    { id: 'all', label: 'සියලුම පරිච්ඡේද (12)' },
                    { id: 'setup', label: '01–05. සැකසුම්, Teams සහ Users' },
                    { id: 'warehouse', label: '06. PO, GRN සහ Client FOC' },
                    { id: 'operations', label: '07–09. ශාඛා තොග සහ Team Transfers' },
                    { id: 'projects', label: '10–11. Usage, Auto FOC සහ Returns' },
                    { id: 'formats', label: '12. 3-Tier වාර්තා, Formats සහ ආරක්ෂාව' },
                  ]
                : [
                    { id: 'all', label: 'All Chapters (12)' },
                    { id: 'setup', label: '01–05. Setup, Teams & Users' },
                    { id: 'warehouse', label: '06. PO, GRN & Client FOC' },
                    { id: 'operations', label: '07–09. Site Stock & Team Transfers' },
                    { id: 'projects', label: '10–11. Usage, Auto FOC & Returns' },
                    { id: 'formats', label: '12. 3-Tier Reports, Formats & Security' },
                  ]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedCategory === tab.id
                      ? 'bg-[#081024] text-amber-300 shadow-xs'
                      : 'text-[#081024] hover:bg-amber-400/20'
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
                placeholder={
                  guideLang === 'si'
                    ? 'උපදෙස් සොයන්න (උදා: Format, GRN, Team)...'
                    : 'Search guide (e.g. Format, GRN, Team, RTV)...'
                }
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/85 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* ==================== STEP-BY-STEP CHAPTERS ==================== */}
          <div className="space-y-6">
            {filteredChapters.length === 0 ? (
              <div className="rounded-2xl landing-glass-card-light p-10 text-center">
                <p className="text-sm font-bold text-slate-800">
                  {guideLang === 'si'
                    ? `"${searchQuery}" සඳහා ගැළපෙන කොටසක් හමු නොවීය.`
                    : `No guide sections matched "${searchQuery}".`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-[#081024] text-white text-xs font-bold cursor-pointer"
                >
                  {guideLang === 'si' ? 'සියලුම පරිච්ඡේද පෙන්වන්න' : 'Show All Guide Chapters'}
                </button>
              </div>
            ) : (
              filteredChapters.map((chapter) => {
                const ChapterIcon = chapter.icon;
                return (
                  <div
                    key={chapter.id}
                    className="rounded-[24px] landing-glass-card-light p-6 sm:p-8 break-inside-avoid"
                  >
                    {/* Chapter Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200/80">
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-[#081024] text-amber-400 flex items-center justify-center shrink-0 shadow-xs no-print">
                          <ChapterIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="font-mono font-extrabold text-amber-700">
                              {chapter.number}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="text-slate-500">{chapter.categoryLabel}</span>
                          </div>
                          <h2 className="text-lg sm:text-2xl font-black text-[#081024] mt-1 tracking-tight">
                            {chapter.title}
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed font-medium max-w-3xl">
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
                          className="rounded-2xl bg-white/90 border border-slate-200/80 p-4 shadow-2xs"
                        >
                          <h3 className="text-xs sm:text-sm font-extrabold text-[#081024]">
                            {st.stepTitle}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                            {st.detail}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Key Documents / Outputs Footer */}
                    <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                      <span className="font-extrabold text-[#081024] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {guideLang === 'si' ? 'ප්‍රධාන ප්‍රතිඵල සහ පාලනයන්:' : 'Key Outputs & Controls:'}
                        </span>
                      </span>
                      {chapter.keyOutputs.map((out) => (
                        <span key={out} className="flex items-center gap-1.5 font-bold text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{out}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ==================== DEDICATED COMPANY FORMAT UPLOAD & AFFECTED SECTIONS GUIDE ==================== */}
          <div className="rounded-[24px] landing-glass-card-light p-6 sm:p-8 break-inside-avoid">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-700 mb-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>
                    {guideLang === 'si'
                      ? 'ආයතනයේ Document Formats (PDF / Image) Upload කරන ආකාරය පිළිබඳ විශේෂ මාර්ගෝපදේශය'
                      : 'Standard Document Format Reference Guide (PDF / Image Upload)'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#081024] tracking-tight">
                  {guideLang === 'si'
                    ? 'Company Format Upload කිරීම සහ "This Format Affects To" ක්‍රියාත්මක වන ආකාරය'
                    : 'How Company Document Format Upload & "This Format Affects To" Works'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium max-w-4xl">
                  {guideLang === 'si' ? (
                    <>
                      <strong>Document Templates -&gt; Section Formats (Upload PDF / Image)</strong> තුළදී ඔබේ ආයතනයේ සමාන ව්‍යුහයක් ඇති ආකෘති පත්‍ර ප්‍රධාන කාණ්ඩ 4කට ගොනු කර ඇත. ඔබ PDF එකක් හෝ Image එකක් Upload කළ විට ඊට යටින් ඇති{' '}
                      <strong>&ldquo;This Format Affects To&rdquo;</strong> කොටසේ පෙන්වන සියලුම Sections වලින් මුද්‍රණය කරන විට එම Format එක ස්වයංක්‍රීයව භාවිත වේ.
                    </>
                  ) : (
                    <>
                      In <strong>Document Templates -&gt; Section Formats (Upload PDF / Image)</strong>, company forms sharing the same structure are grouped into 4 standard slots. Uploading a PDF or Image automatically adapts your company format for printing across every linked section listed under <strong>&ldquo;This Format Affects To&rdquo;</strong>.
                    </>
                  )}
                </p>
              </div>
              <div className="shrink-0 bg-[#081024] text-amber-300 px-4 py-2.5 rounded-xl text-xs font-extrabold border border-amber-400/35">
                {guideLang === 'si'
                  ? 'PDF (.pdf) සහ Images (.png, .jpg, .webp) සඳහා සහය දක්වයි'
                  : 'Supports PDF (.pdf) & Images (.png, .jpg, .webp)'}
              </div>
            </div>

            {/* 4 Format Groups Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {activeFormatMatrix.map((slot) => (
                <div
                  key={slot.code}
                  className="rounded-2xl bg-white/90 border border-slate-200/80 p-4 flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#081024] text-amber-300 font-mono text-[11px] font-black">
                        {slot.code}
                      </span>
                      <span className="text-[11px] font-bold text-amber-700">
                        {guideLang === 'si' ? 'PDF / Image Upload කාණ්ඩය' : 'PDF / Image Upload Slot'}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-[#081024]">{slot.title}</h3>
                    <p className="text-[11px] text-slate-600 mt-1 font-medium">
                      {slot.structure}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-200/80">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 mb-1.5">
                      {guideLang === 'si'
                        ? 'මෙම Format එක බලපාන Sections (This Format Affects To):'
                        : 'This Format Affects To (Printed Sections):'}
                    </div>
                    <div className="space-y-1">
                      {slot.affectsTo.map((sec) => (
                        <div key={sec} className="flex items-start gap-1.5 text-xs text-[#081024] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{sec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 3 Render Modes Explanation */}
            <div className="mt-5 pt-4 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-white/90 border border-slate-200/80 p-3.5">
                <div className="font-extrabold text-[#081024]">
                  {guideLang === 'si'
                    ? 'ක්‍රමය A: Extracted Header Banner + System Table'
                    : 'Mode A: Extracted Header Banner + System Table'}
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {guideLang === 'si'
                    ? 'ඔබ Upload කළ PDF/Image එකේ උඩ Letterhead/Header කොටස (10%–45% දක්වා උස සීරුමාරු කළ හැක) ලබාගෙන, ඊට යටින් පද්ධතියේ පැහැදිලි වගුව සහ අත්සන් තීරු 3 මුද්‍රණය කරයි.'
                    : 'Crops your uploaded PDF/Image letterhead banner at the top (adjustable 10%–45% crop height) and renders a crisp, brand-colored system table and 3-column signature block below.'}
                </p>
              </div>
              <div className="rounded-xl bg-white/90 border border-slate-200/80 p-3.5">
                <div className="font-extrabold text-[#081024]">
                  {guideLang === 'si'
                    ? 'ක්‍රමය B: Full Uploaded Form Background Watermark'
                    : 'Mode B: Full Uploaded Form Background Watermark'}
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {guideLang === 'si'
                    ? 'ඔබ Upload කළ සම්පූර්ණ A4 පත්‍රිකාව පසුබිම් ලිපි ශීර්ෂය (Background Stationery) ලෙස තබාගෙන ඒ මත පද්ධතියේ දත්ත සහ වගුව පැහැදිලිව මුද්‍රණය කරයි.'
                    : 'Uses your entire uploaded A4 page as the background stationery/watermark and overlays live system data, tables, and signature blocks cleanly on top.'}
                </p>
              </div>
              <div className="rounded-xl bg-white/90 border border-slate-200/80 p-3.5">
                <div className="font-extrabold text-[#081024]">
                  {guideLang === 'si'
                    ? 'ක්‍රමය C: Smart Reconstructed Digital Grid'
                    : 'Mode C: Smart Reconstructed Digital Grid'}
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {guideLang === 'si'
                    ? 'ඔබේ ආකෘති පත්‍රයේ Brand Color එක, ISO Form Reference අංකය, වගුවේ තීරු නාමයන් (Column Headers) සහ අත්සන් තීරු ඩිජිටල් ලෙස ප්‍රතිනිර්මාණය කර මුද්‍රණය කරයි.'
                    : 'Reconstructs your form digitally using the extracted brand color, ISO form reference code, custom table column headers, and custom bottom sign-off titles.'}
                </p>
              </div>
            </div>
          </div>

          {/* ==================== COMPLETE FEATURE CHECKLIST & USER ROLE PERMISSIONS ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 break-inside-avoid">
            {/* Complete Platform Features Overview */}
            <div className="lg:col-span-7 rounded-[24px] landing-glass-card-light p-6 sm:p-8">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-700 mb-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                <span>
                  {guideLang === 'si'
                    ? 'සම්පූර්ණ පද්ධති විශේෂාංග ලැයිස්තුව'
                    : 'Complete Module & Feature Checklist'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#081024] tracking-tight">
                {guideLang === 'si'
                  ? 'සෑම ආයතන ගිණුමකටම ඇතුළත් සියලුම පහසුකම්'
                  : 'Everything Included in Every Workspace'}
              </h2>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                {guideLang === 'si'
                  ? 'දින 7ක නොමිලේ කාලසීමාව (Free Trial) තුළ මෙන්ම Pro Monthly සහ Pro Annual සැලසුම් යටතේද පහත සියලුම පහසුකම් සම්පූර්ණයෙන්ම විවෘතය.'
                  : 'All modules below are unlocked during your 7-Day Free Trial as well as Pro Monthly and Pro Annual plans.'}
              </p>

              <div className="mt-5 space-y-5">
                {activeFeatureList.map((sec) => (
                  <div key={sec.group} className="pt-4 first:pt-0 border-t first:border-t-0 border-slate-200/80">
                    <h3 className="text-xs font-black text-[#081024] mb-2.5">{sec.group}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sec.items.map((item) => (
                        <div key={item} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Role & Branch-Lock Guide */}
            <div className="lg:col-span-5 rounded-[24px] landing-glass-card-light p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-700 mb-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>
                    {guideLang === 'si' ? 'නිලධාරී බලතල සහ ආරක්ෂාව' : 'Staff Access Control Guide'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#081024] tracking-tight">
                  {guideLang === 'si' ? 'නිලධාරී ගිණුම් ක්‍රියාත්මක වන ආකාරය' : 'How Staff Roles Work'}
                </h2>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  {guideLang === 'si'
                    ? 'ප්‍රධාන කාර්යාලයේ කළමනාකරුවන්ට සහ ප්‍රාදේශීය වැඩබිම් ගබඩා භාරකරුවන්ට වෙන් වෙන් වශයෙන් බලතල ලබාදිය හැක.'
                    : 'Assign tailored access to headquarters executives and regional site storekeepers.'}
                </p>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-white/90 border border-slate-200/80 p-4 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-black text-[#081024]">
                      <UserCheck className="w-4 h-4 text-amber-600" />
                      <span>
                        {guideLang === 'si'
                          ? 'Super Admin (First-Name Verified පුද්ගලික වගකීම සහිතයි)'
                          : 'Central HQ Super Admin (First-Name Verified Accountability)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                      {guideLang === 'si'
                        ? 'ප්‍රධාන ගබඩාව, PO/GRN/RTV, Regional & Sub-Site ශාඛා 20+, Unlimited Users/Teams සහ Audit Trail පූර්ණ බලතල හිමිවේ. Super Admin Password ගසා පිවිසෙන විට First Name පරීක්ෂා කර සෑම ක්‍රියාවක්ම "[නම] (as Super Admin)" ලෙස සටහන් කෙරේ.'
                        : 'Full control across Central HQ, 20+ Regional & Sub-Site branches, Unlimited Users/Teams, PO/GRN/RTV, Format Studio & Backups. Requires mandatory real Full Name on signup and verifies First Name on login, stamping every audit & voucher as "[Name] (as Super Admin)".'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/90 border border-slate-200/80 p-4 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-black text-[#081024]">
                      <Truck className="w-4 h-4 text-sky-700" />
                      <span>
                        {guideLang === 'si'
                          ? 'Regional & Sub-Site ශාඛා පරීක්ෂක / ගබඩා භාරකරු (Site Branch Admin / User)'
                          : 'Regional & Sub-Site Branch Supervisor / Yard Admin'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                      {guideLang === 'si'
                        ? 'Regional Site Branch Admin කෙනෙකුට තම ශාඛාවට අමතරව ඒ යටතේ ඇති Sub-Site Branches වලට බඩු නිකුත් කිරීමටත් ("Issue Stock to Sub-Site"), Sub-Site Requisitions Approve කිරීමටත් බලතල ඇත. Sub-Site Supervisor හට තම Sub-Site Teams, Usage (PU) හා Parent Site වෙත Returns (BRM) කළමනාකරණය කළ හැක.'
                        : 'Can be locked to a Regional Site, Sub-Site, or Multi-Site assignment. Parent Regional Branch Admins hold direct authority to supply stock ("Issue Stock to Sub-Site") and approve/reject Requisitions from their child Sub-Sites, while both tiers run Field Teams (IN), Project Usage (PU) & upstream Returns (RV/BRM).'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom CTA Card (Hidden when printing) */}
              <div className="no-print mt-6 pt-5 border-t border-slate-200/80">
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onOpenSignup}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#081024] hover:bg-[#0f1d3d] text-amber-300 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition whitespace-nowrap shadow-sm"
                  >
                    <span>
                      {guideLang === 'si' ? 'දින 7ක නොමිලේ ගිණුම අරඹන්න' : 'Start 7-Day Free Trial'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-[#081024] border border-slate-300 font-bold text-xs cursor-pointer transition whitespace-nowrap"
                  >
                    {guideLang === 'si' ? 'පද්ධතියට පිවිසෙන්න (Login)' : 'Client Login'}
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
