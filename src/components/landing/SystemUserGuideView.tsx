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
  onOpenSignup: () => void;
  onOpenLogin: () => void;
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

// ==================== ENGLISH GUIDE CONTENT ====================
const GUIDE_CHAPTERS_EN: GuideChapter[] = [
  {
    id: 'ch-01',
    number: 'Chapter 01',
    category: 'setup',
    categoryLabel: 'Getting Started & Master Registry',
    title: 'Workspace Registration, Master Directory & Smart Crew Roster Setup',
    summary:
      'Set up your isolated company cloud workspace in 60 seconds and register your master catalog, regional site yards, field crews with auto-calculated crew sizes, suppliers, and clients.',
    icon: Boxes,
    steps: [
      {
        stepTitle: '1. Workspace Registration, Super Admin First-Name Accountability & 20-Site Default Capacity',
        detail:
          'Click "Start 7-Day Free Trial" and enter your Company Name, the Super Admin\'s mandatory real Personal Full Name (generic labels like "Admin" are disallowed), Username, and Password. Every plan includes Unlimited Users, Unlimited Field Teams, 1 Central HQ Warehouse, and 20 Regional/Sub-Site Branches (+$10/mo per extra site). Whenever logging in with the Super Admin password, the user enters their personal name: the system verifies First-Name match against the registered Super Admin profile and logs every Audit Trail & Voucher action as "[Name] (as Super Admin)". All Item Codes (ITM-0001), Project IDs, and Vouchers automatically increment from 0001.',
      },
      {
        stepTitle: '2. Register Materials, Heavy Machinery, Auto-Compressed Item Photos (<200KB) & Single-Shot Barcode Scanning',
        detail:
          'Open "Master Registrations -> Item Catalog" to add Consumable Materials and Returnable Machinery/Tools or bulk import via Excel/CSV. You can optionally attach an Item Photo when adding or editing any item — the system automatically resizes and compresses the image to under 200KB for fast cloud loading, and every printable voucher/report includes a "Print with Image" checkbox to optionally print item thumbnails. When scanning barcodes via Mobile Camera or USB/Wireless Barcode Gun, the scanner detects once, automatically stops and hides the camera view to prevent continuous duplicate scans, and provides a "Scan Now" button to re-activate the scanner.',
      },
      {
        stepTitle: '3. 3-Tier Branches (Regional -> Optional Sub-Site), Field Teams, Team Name Lock & Site Transfers',
        detail:
          'In "Master Registrations -> Sites / Branches", create Regional Site Branches (supplied directly by Central HQ) and optionally nest Sub-Site Branches underneath any Regional Site (parent branches with active Sub-Sites cannot be deleted). Field Teams can be registered inside BOTH Regional Site Branches and Sub-Site Branches normally — Crew Size auto-calculates, Team Names lock after stock issue, and "Transfer / Site History" manages "Temporary Assigned to - [New Site]" -> Permanent "[Team Name] (Ref: [Old Site])" cleanly.',
      },
      {
        stepTitle: '4. Create Staff Logins (Regional, Sub-Site, Multi-Site, HQ) & Auto Email Verification',
        detail:
          'Under "User Management", create unlimited accounts for HQ Storekeepers, Regional Branch Admins (who also hold dispatch/approval authority over child Sub-Site Branches), and Sub-Site Supervisors. Assign All Sites (Central HQ), a Single Site/Sub-Site, or Multiple Specific Branches. Account security features 1-click "Send Verification Email" via apexstox.com (support@apexstox.com) for automatic verification.',
      },
    ],
    keyOutputs: [
      'Mandatory Personal Super Admin Full Name + First-Name Verified Login ("[Name] (as Super Admin)")',
      'Unlimited Users & Teams + 1 Central HQ + 20 Regional/Sub-Site Branches Included (+$10/mo extra site)',
      '3-Tier Hierarchy (Central HQ -> Regional Site -> Optional Sub-Site -> Field Teams) & Team Name Lock',
      'Auto-Compressed Item Photos (<200KB), "Print with Image" & Auto Email Verification (apexstox.com)',
    ],
  },
  {
    id: 'ch-02',
    number: 'Chapter 02',
    category: 'warehouse',
    categoryLabel: 'Warehouse, PO / GRN & RTV',
    title: 'Central Warehouse, Supplier Orders (PO / GRN), Vendor Returns (RTV) & Client Free Stock',
    summary:
      'Manage company-purchased stock, multi-item Goods Receipt Notes (GRN), supplier returns with official Debit Notes (RTV), damaged stock restoration, and client-supplied free materials with automatic branch allocation.',
    icon: Gift,
    steps: [
      {
        stepTitle: '1. Issue Official Supplier Purchase Orders (PO)',
        detail:
          'In "Supplier Orders (PO)", generate sequential 0001-numbered Purchase Orders for your approved vendors with commercial terms, tax/discount calculations, and 3-signature approval blocks, and print official A4 PO documents.',
      },
      {
        stepTitle: '2. Receive Multi-Item PO Stock into Central Warehouse & Print GRN Vouchers',
        detail:
          'Record full or partial Goods Received Notes (GRN) from Supplier POs or direct warehouse entries. All line items in a multi-item PO are atomically added into Central Main Stock with a dedicated "Print GRN" voucher.',
      },
      {
        stepTitle: '3. Return to Vendor (RTV), Official Debit Notes & Damaged Stock Restoration',
        detail:
          'For defective or excess vendor deliveries, create an official Return to Vendor (RTV) / Debit Note with outward Gate Pass and credit claim tracking. For site-damaged items, inspect and restore repaired units back into Main Stock via the Damaged Stock ledger.',
      },
      {
        stepTitle: '4. Client Free Stock (FOC) 5-Stage Reconciliation Flow, Color-Coded Project Cards & Full Central Reports',
        detail:
          'Open "Client Free Stock", click "+ Log Client Free Stock", and select "Under Main Project" or "Individual Project". Physical FOC deliveries default to Central Warehouse, while selecting a project automatically LOCKS its "Allocated Site Branch" (or choose "ALL AREAS" for island-wide contracts usable by any branch). Both Client Free Stock and Project Reconciliation follow the clear 5-Stage Standard Reconciliation Flow: (1) Initial FOC Receipt at Central -> (2) Site Issue -> (3) Team Issue -> (4) Usage & Wastage -> (5) Balance / Returnable Stock on Project Completion. Color-coded Main Project cards link every Sub-Project (e.g., KT-RGL-0505, KT-ABK-0506) below with its own flow and end with a consolidated Full Usage & Client Balance Summary. You can also print clean A4/PDF reports per individual issued item or as one Full Consolidated Project Report, and Admins can reassign mis-logged FOC vouchers anytime.',
      },
      {
        stepTitle: '5. Central Stock Item Selection — Full End-to-End Lifecycle Summary & PO / Return Dropdown Item Images',
        detail:
          'In "Main Stock Control -> Central Stock Inventory", click any item row (or "Summary") to expand its End-to-End Lifecycle & Custody Summary underneath: Inbound Sources (PO/GRN, Manual, Client FOC, Site Good Returns), Site Branch Distribution & Site In-Hand, Field Teams Allocation, Project Consumption & Wastage, and live Custody KPIs with "Print A4 Summary" & "Download PDF". Additionally, item thumbnails appear directly in PO, Requisition, Team Return (RV), and Branch Return (BRM) dropdown lists.',
      },
    ],
    keyOutputs: [
      'Printable Purchase Orders (PO), Multi-Item Batch GRNs & Item Thumbnails in PO / Return Dropdowns',
      'Return to Vendor (RTV) Debit Notes & Outward Gate Passes',
      '5-Stage Client FOC Reconciliation Flow, Individual-Item & Full Project A4/PDF Reports + ALL AREAS Support',
      'Central Stock Item Selection -> Full End-to-End Lifecycle Summary (Printable A4 / PDF)',
    ],
  },
  {
    id: 'ch-03',
    number: 'Chapter 03',
    category: 'operations',
    categoryLabel: 'Site Transfers & Field Dispatch',
    title: '3-Tier Site/Sub-Site Transfers, Direct Sub-Site Dispatch, 2-Tab Requisitions & Field Crew Issuance (IN)',
    summary:
      'Submit Normal or FOC Stock Requisitions (with automatic Parent-Site routing for Sub-Sites), issue stock directly from Regional Branches to Sub-Sites, inspect forward item traceability, and supply Field Teams across both tiers.',
    icon: Send,
    steps: [
      {
        stepTitle: '1. Two-Tab Stock Requisitions (HQ Routing for Regional Sites & Auto Parent Routing for Sub-Sites)',
        detail:
          'In "Stock Requisitions -> + New Stock Requirement Form", choose your Requesting Site Branch first, then switch between "1. Normal Stock Request" ("Site Low" items auto-sorted to top) or "2. Client Free Stock for Assigned Project Request" (including "ALL AREAS" projects). When a Regional Site Branch creates a request, it routes to Central HQ (showing "Main:" balance). When a child Sub-Site Branch creates a request, it automatically routes upstream to its Parent Regional Site Branch (showing live "Parent Avl:" stock alongside "Site Avl:")!',
      },
      {
        stepTitle: '2. HQ / Parent-Site Dispatch Approval & Atomic Inventory Transfer',
        detail:
          'Central HQ approves Regional Site requests, while either the Parent Regional Branch Admin or Central Admin can approve child Sub-Site requisitions. Once approved and confirmed as received, Normal requests transfer stock down the chain (Central -> Regional OR Parent Regional -> Sub-Site), while Central HQ also tracks Sub-Site lineage in full lifecycle traceability.',
      },
      {
        stepTitle: '3. Site Branch Stock: Direct "Issue Stock to Sub-Site", "Central FOC" Badges & 5-Stage Forward Summary',
        detail:
          'Open "Site Branch Stock (Site Inventories)" under any Parent Regional Site Branch and click the emerald "Issue Stock to Sub-Site" action to transfer stock directly from the Regional Site Store down to any nested Sub-Site Branch without waiting for a requisition. Central FOC receipts carry a "Central FOC" badge highlight, and clicking any item row expands its 5-Stage Forward Traceability Summary with "Print A4 Summary" & "Download PDF".',
      },
      {
        stepTitle: '4. Field Crew Issuance (IN) Inside Regional & Sub-Site Branches + Site-Separated Team Stock',
        detail:
          'Both Regional Site Branches and Sub-Site Branches issue materials & tools directly to their Field Teams via "Issue to Teams" with signable Issue Notes (IN) / Gate Passes. In "Team In-Hand Stock", transferred team balances stay strictly separated per site ("Stock to Return - [Previous Site Name]" vs. "[Current Site Name] - Active Site Stock") and are never summed across branches.',
      },
    ],
    keyOutputs: [
      'Direct "Issue Stock to Sub-Site" from Parent Regional Branch Store + Parent-Routed Sub-Site Requisitions ("Parent Avl:")',
      '2-Tab Stock Requisitions: Normal Stock ("Site Low" Top Sort) vs. Assigned-Site & "ALL AREAS" Client FOC',
      'Site Branch Stock "Central FOC" Highlight Badge & 5-Stage Forward Traceability Summary (Printable A4 / PDF)',
      'Field Teams in Both Regional & Sub-Site Tiers + Site-Separated Team In-Hand Stock ("Stock to Return")',
    ],
  },
  {
    id: 'ch-04',
    number: 'Chapter 04',
    category: 'projects',
    categoryLabel: 'Projects, International Templates (Telecom/Water/Electric/Solar), "+ Add Field" & Full Reports',
    title: 'Project Registry, International Section Templates (Telecom, Water, Electric, Solar), "+ Add Field" Custom Builder & Full Site Reports',
    summary:
      'Load ready-made International Industry Section Templates (Telecom FTTH, Water Supply, Electrical Power, Solar PV, or Standard EPC), add unlimited custom fields with "+ Add Field", record daily consumption with a 3-step Team-Locked workflow, and generate Full Site Reports.',
    icon: FolderKanban,
    steps: [
      {
        stepTitle: '1. International Industry Section Templates (Telecom, Water, Electric, Solar) & "+ Add Field" Custom Field Builder',
        detail:
          'In "Project & New Section Registry -> New Section Registry & Material Templates", click "+ Add New Section" (or use the 1-click Quick-Load Template buttons) to load international standard templates for: (1) Telecom New Connection (ITU-T G.984 / FTTH), (2) Water Supply & Utility Project (ISO 4064 / AWWA — Water Account No, Meter Serial, Pipe DN/PN, Pressure Bar, Ferrule Size), (3) Electrical Power Connection (IEC 60364 — Service Order No, Energy Meter kWh, Phase/Voltage, kVA Demand, Earth Resistance Ω), (4) Solar PV & Net-Metering (IEC 62446 — Net-Metering Ref, Inverter Serial, kWp DC/kW AC, PV Panels, BESS kWh, Bi-Directional Meter), or (5) Standard EPC Project. You can customize all 6 Core Field Labels and click "+ Add Field" to add unlimited custom technical fields (or add fields on the fly inside the Register Project modal).',
      },
      {
        stepTitle: '2. "Main Project -> Under New Connections" (Telecom/Water/Electric/Solar), Section-Filtered FOC & "ALL AREAS" Branch',
        detail:
          'Across all 4 New Connection sections (Telecom, Water, Electrical, Solar), you can register a "Standalone New Connection", an umbrella "Main Project (For New Connections)", or a connection "Under Main Project (New Connection)". When registering any project, pick a specific Site Branch OR choose "ALL AREAS (All Site Branches)" so any branch can use the project and its Client FOC pool. In "Material Usage / Daily Progress Entry", Step 1 locks Team & Area until refresh, Step 2 registers/selects the connection, and FOC Main Project selectors ONLY appear if Client FOC stock exists specifically for that active section (so normal Company Stock remains clutter-free).',
      },
      {
        stepTitle: '3. Log Installed Qty + "Wastage Qty", Active-Site Stock Guard & Sub-Project / Main Project Reconciliation Flow',
        detail:
          'Enter both Installed Quantity (Qty Used) and "Wastage Qty" per item. Teams only consume active-site stock (unless the project or Main Project is "ALL AREAS", which allows all branches). In Reconciliation, color-coded Main Project cards show each linked Sub-Project (e.g., KT-RGL-0505, KT-ABK-0506) below in its own flow (Central Receipt -> Site Issue -> Team Issue -> Usage & Wastage -> Balance), ending with a Full Usage & Client Completion Returnable Balance Report; selecting a single Sub-Project shows that Sub-Project\'s dedicated flow.',
      },
      {
        stepTitle: '4. Usage Vouchers History — "Full Report for This Site" & Upstream Multi-Item Returns (RV / BRM)',
        detail:
          'Open "Usage Vouchers History" and select a project to unlock "Full Report for This Site (Project)" showing Team Subtotals and Full Site Consolidated Grand Total (Print/PDF or Excel CSV). In "Team Returns" (RV) and "Branch Returns" (BRM), item thumbnails appear in dropdowns and you can add multiple items at once ("+ Add Item" / "+ Add All Held"). Note that Branch Returns (BRM) route upstream automatically: Regional Site Branches return to Central Main Warehouse, while Sub-Site Branches return directly to their Parent Regional Site Branch!',
      },
    ],
    keyOutputs: [
      'International Section Templates (Telecom, Water, Electric, Solar) + "+ Add Field" Builder & "ALL AREAS" Branch Option',
      'Main Project -> Under New Connections Hierarchy + Section-Filtered FOC Visibility (Only When FOC Exists)',
      'Main & Sub-Project Color-Coded 5-Stage Reconciliation + Completion Returnable Balance Report',
      'Full Report for This Site (Project) & Upstream Multi-Item Returns (RV -> Branch, Sub-Site BRM -> Parent Site)',
    ],
  },
  {
    id: 'ch-05',
    number: 'Chapter 05',
    category: 'formats',
    categoryLabel: 'ISO Format Settings, Signers & Digital Signatures',
    title: 'How to Configure ISO 9001:2015 Document Formats, Auto Tenant Header, Signers & Digital Signatures',
    summary:
      'Step-by-step guide to the 3 tabs inside Document Templates: (1) Section Formats (ISO 9001:2015 Standard & PDF/Image Upload), (2) Auto Tenant Header & Signer Roles, and (3) Digital Signatures Library + Isolated Single-Click A4 Printing.',
    icon: Upload,
    steps: [
      {
        stepTitle: '1. Tab 1 — "1. Section Formats (ISO Standard & Upload PDF/Image)" & Format Settings',
        detail:
          'Open "Document Templates -> 1. Section Formats (ISO Standard & Upload PDF/Image)". By default, all 4 format groups (FORMAT-01 to FORMAT-04) use the official ISO 9001:2015 Controlled Document Format (ISO-9001-QMS-F01 to F04) with your logged-in Tenant Company Name, Phone, Email, and Address auto-populated into the header. You can also upload your own company PDF (.pdf) or Image (.png, .jpg, .webp) into any card, enable "Use FORMAT-01 across all GRN, FOC & Stock Return sections too" to unify Format-01 & 02 in 1 click, or click "Customize Format Settings & Preview" to edit Render Mode, Header Crop %, Table Column Labels, and Sign-Off Titles in the Live A4 Studio.',
      },
      {
        stepTitle: '2. Tab 2 — "2. Auto Tenant Header & Signers" (Company Logo & Signer Matrix)',
        detail:
          'Switch to Tab 2 ("2. Auto Tenant Header & Signers") to configure your ISO header and default Signers: (a) Under "1. Tenant Company Identity & ISO Header Details", review your auto-loaded Company Name, Scope Subtitle, Phone, Email, Address, and choose "Logo Monogram Text" or "Logo Image (Upload)" (click "Sync from Tenant Account" anytime to re-sync). (b) Under "2. ISO Signer Names, Designations & Department Matrix", enter the Signer Full Name, Designation, and Department for "Prepared & Checked By" and "Authorized & Approved By", plus "Reviewed By", "ISO Issue Number", and "ISO Revision Number", then click "Save ISO Header & Signers".',
      },
      {
        stepTitle: '3. Tab 3 — "3. Digital Signatures" (Draw/Upload) & Global "Off Digital Signature (Default for Printing)"',
        detail:
          'Switch to Tab 3 ("3. Digital Signatures") and click "+ Add Digital Signature". Enter the Signer Full Name (matching your Prepared By or Approved By name), Designation/Role, and Department, then either draw on the Signature Pad or upload a PNG/JPG signature image and click "Save Signature". Need wet-ink pen signatures on paper printouts? Enable "Off Digital Signature (Default for Printing)" in Tab 3 to hide digital signature images globally by default and leave generous blank dashed hand-signing boxes ("Hand Signature & Date / Stamp") above signer titles on all vouchers and reports.',
      },
      {
        stepTitle: '4. "Off Digital Signature" Per-Print Mode, Single-Click A4 Print Preview & PDF Export',
        detail:
          'Every Print/PDF dialog across Vouchers (RN, IN, PU, TSR, GRN, FOC, RV, BRM, PO, RTV/Debit Note), "Full Report for This Site (Project)", Client FOC Reports, Item Summaries, and Branch Directory includes an "Off Digital Signature" toggle right in the toolbar (plus per-signer "Off Digital Signature (Blank Hand-Sign Space)" options inside Edit Signers). Toggle it anytime for physical pen signing & rubber stamping! All tables and printed reports also use standardized crisp typography (13.5px body / 12px headers) and isolated single-click A4 Print Preview & direct PDF download.',
      },
    ],
    keyOutputs: [
      'Default ISO 9001:2015 Controlled Formats (FORMAT-01 to FORMAT-04) + Auto Tenant Header',
      'Custom PDF/Image Upload, 1-Click Format Unification & Live A4 Column/Title Settings',
      'Digital Signatures Library (Draw/Upload) + "Off Digital Signature" Physical Hand-Sign Print Mode',
      'Uniform Crisp Report/Table Typography (13.5px) + Isolated Single-Click A4 Print & PDF',
    ],
  },
  {
    id: 'ch-06',
    number: 'Chapter 06',
    category: 'admin',
    categoryLabel: 'Themes, Subscriptions, Audits & Backups',
    title: 'Live Glass Tone Themes (Sapphire & Gold Default), Plant Fleet, Subscriptions & Backups',
    summary:
      'Switch live across 9 Apple Liquid Glass themes from the top Header, manage heavy machinery, configure per-print hand-sign blocks, manage recurring card subscriptions, and protect data with Admin-locked deletions and offline backups.',
    icon: ShieldCheck,
    steps: [
      {
        stepTitle: '1. Live "Glass Tone" Theme Switcher (9 Themes, Default "Sapphire & Gold") & Refined Workspace UI',
        detail:
          'The workspace opens by default in "Sapphire & Gold" (matching the landing palette). Use the "Glass Tone" color-swatch dropdown in the top Header sub-bar (or System Config) anytime to switch live between 9 curated Apple Liquid Glass themes: Sapphire & Gold, Liquid Emerald, Oceanic Teal, Cobalt Azure, Liquid Indigo, Liquid Amethyst, Obsidian Amber, Liquid Crimson, and Liquid Titanium — dynamically updating the Header, Workspace Navigation Sidebar, Canvas backdrop, Hero Banners, and Mobile Dock. Main Central Stock also features a structured filter bar and compact Inbound Receipts ledger.',
      },
      {
        stepTitle: '2. Dedicated Plant & Machinery Fleet + Per-Voucher "Edit Signers" & Hand-Sign Overrides',
        detail:
          'Track heavy machinery, generators, testing instruments, and power tools separately across Central Yard, Site Branches, and Field Crews. When printing any voucher or report, use "Customize Voucher Header, Signers & Digital Signatures" to override Document No, Date, Signer Names, Designations, or switch individual signers to "Off Digital Signature (Blank Hand-Sign Space)" without affecting other prints.',
      },
      {
        stepTitle: '3. Admin Password Verification for Deletions, Audit Trail & Recurring Card Subscriptions (USD -> LKR)',
        detail:
          'Any delete, clear, or purge action requires Admin Password verification, and all activity is logged in "Audit Trail" with safe restoration in "Recycle Bin". In the "Subscription" portal, workspaces can activate auto-renewing Pro Monthly or Pro Annual card subscriptions via Payments.lk / PAYable (with live server-fetched USD -> LKR exchange rate conversion) or Stripe, and manage auto-renewal from the Customer Billing Portal.',
      },
      {
        stepTitle: '4. Country-Based Phone Digit Validation & 1-Click Full System Backups',
        detail:
          'All phone number inputs automatically detect the logged-in workspace country (e.g., Sri Lanka 10 local digits / 9 subscriber digits) and enforce exact digit limits. Export a complete offline snapshot of your entire workspace (JSON Backup with built-in Offline Backup Viewer) or download multi-sheet Excel reports anytime.',
      },
    ],
    keyOutputs: [
      '9 Live "Glass Tone" Liquid Glass Themes ("Sapphire & Gold" Default) + Clean Workspace Tables',
      'Machinery Custody Ledger + Per-Print "Off Digital Signature" Hand-Sign Blank Boxes',
      'Auto-Renewing Card Subscriptions (Payments.lk / Stripe) with Live USD -> LKR Conversion',
      'Admin Password Deletion Guard, Audit Trail, Recycle Bin & 1-Click JSON/Excel Backups',
    ],
  },
];

// ==================== SINHALA GUIDE CONTENT (සිංහල උපදෙස් අත්පොත) ====================
const GUIDE_CHAPTERS_SI: GuideChapter[] = [
  {
    id: 'ch-01',
    number: '01 වන පරිච්ඡේදය',
    category: 'setup',
    categoryLabel: 'මූලික සැකසුම් සහ ලියාපදිංචි කිරීම් (Master Setup)',
    title: 'ආයතන ගිණුම ආරම්භ කිරීම, 0001 අනුක්‍රමික අංකනය, Single-Shot Barcode Scanner සහ Teams ලියාපදිංචිය',
    summary:
      'විනාඩියක් ඇතුළත ඔබේ ආයතනයේ Cloud පද්ධතිය සකසාගෙන, 0001 සිට පිළිවෙළට අංකනය වන භාණ්ඩ සහ යන්ත්‍රෝපකරණ, Single-Shot Barcode Scanner ("Scan Now"), ශාඛා ගබඩා (Site Branches), සහ වැඩ කණ්ඩායම් (Field Teams) ලියාපදිංචි කරගන්නා ආකාරය.',
    icon: Boxes,
    steps: [
      {
        stepTitle: '1. ආයතන ගිණුම, Super Admin First-Name වගකීම සහ මූලික Site Branches 20 පහසුකම',
        detail:
          '"Start 7-Day Free Trial" ක්ලික් කර Company Name සමඟ ප්‍රධාන Super Admin ගේ සැබෑ Personal Full Name ("Admin" වැනි පොදු නම් වලට ඉඩ නොදේ), Username සහ Password ඇතුළත් කරන්න. සෑම පැකේජයකටම Unlimited Users, Unlimited Field Teams, 1 Central HQ සහ Site Branches 20ක් නොමිලේ ලැබේ (අමතර Site එකකට +$10/mo). Super Admin Password ගසා ලොග් වන සෑම විටම පුද්ගලයාගේ නමේ First Name ගැළපේදැයි පරීක්ෂා කර සෑම ක්‍රියාවක්ම "[නම] (as Super Admin)" ලෙස Audit Trail හි සටහන් කරයි.',
      },
      {
        stepTitle: '2. භාණ්ඩ ලියාපදිංචිය, 200KB ට අඩු Item Image Upload ("Print with Image") සහ Single-Shot Barcode Scanner',
        detail:
          '"Master Registrations -> Item Catalog" හරහා අමුද්‍රව්‍ය (Materials) සහ යන්ත්‍රෝපකරණ (Machinery) ඇතුළත් කරන්න හෝ Excel මගින් Import කරන්න. භාණ්ඩයක් Add/Edit කිරීමේදී අවශ්‍ය නම් භාණ්ඩයේ ඡායාරූපයක් (Item Photo) එක් කළ හැකි අතර පද්ධතිය මගින් එය ස්වයංක්‍රීයව 200KB ට අඩු ප්‍රමාණයකට (Auto-Compress) සකසා ගබඩා කරයි. ඕනෑම වවුචරයක් Print කිරීමේදී "Print with Image" තේරීම මගින් භාණ්ඩයේ රූපය සමඟ හෝ රූපය රහිතව Print කළ හැක. Barcode Scan කිරීමේදී එක වරක් Detect වූ සැණින් Camera එක ඉබේම නතර වන අතර ඊළඟ භාණ්ඩය සඳහා "Scan Now" බටන් එක භාවිත කළ හැක.',
      },
      {
        stepTitle: '3. 3-Tier ශාඛා ව්‍යුහය (Regional Site -> Sub-Site Branch), Field Teams, Team Name Lock සහ Site Transfer',
        detail:
          '"Master Registrations -> Sites / Branches" හි Central HQ යටතේ Regional Site Branches සෑදිය හැකි අතර, අවශ්‍ය නම් Regional Site Branch එකක් යටතේ Sub-Site Branches ද ලියාපදිංචි කළ හැක (සක්‍රීය Sub-Sites ඇති Regional Site එකක් Delete කළ නොහැක). Regional Site සහ Sub-Site යන දෙවර්ගය තුළම සාමාන්‍ය පරිදි Field Teams නිර්මාණය කළ හැකිය (Auto Crew Size, බඩු ගත් පසු Team Name Lock සහ "Temporary Assigned" -> Permanent "Ref: Old Site" Transfer ක්‍රියාවලිය සහිතයි).',
      },
      {
        stepTitle: '4. නිලධාරීන්ගේ ගිණුම් (Regional, Sub-Site, Multi-Site, HQ) සහ Auto Email Verification',
        detail:
          '"User Management" යටතේ ප්‍රධාන ගබඩා භාරකරුවන්, Regional Branch Admins (තමන් යටතේ ඇති Sub-Site Branches පාලන බලය සහිත), සහ Sub-Site Supervisors සඳහා සීමා රහිත ගිණුම් සාදන්න. "Send Verification Email" ක්ලික් කර apexstox.com (support@apexstox.com) ලින්ක් එක ක්ලික් කළ සැණින් ගිණුම ස්වයංක්‍රීයව Verify වේ.',
      },
    ],
    keyOutputs: [
      'අනිවාර්ය Super Admin Full Name ලියාපදිංචිය සහ First-Name Verified Login ("[නම] (as Super Admin)")',
      'Unlimited Users & Teams + 1 Central HQ + Site Branches 20ක් මූලික පැකේජයටම (+$10/mo extra)',
      '3-Tier ශාඛා ව්‍යුහය (Central HQ -> Regional Site -> Sub-Site -> Field Teams) සහ Team Name Lock',
      '200KB Auto-Compress Item Images, "Print with Image" සහ ස්වයංක්‍රීය Email Verification (apexstox.com)',
    ],
  },
  {
    id: 'ch-02',
    number: '02 වන පරිච්ඡේදය',
    category: 'warehouse',
    categoryLabel: 'ප්‍රධාන ගබඩාව, PO / GRN සහ RTV',
    title: 'ප්‍රධාන ගබඩාව, සැපයුම්කරු ඇණවුම් (PO / GRN), ආපසු යැවීම් (RTV) සහ සේවාදායක නොමිලේ තොග (FOC)',
    summary:
      'ආයතනය මිලදී ගන්නා තොග, භාණ්ඩ කිහිපයක් සහිත PO එකවර ප්‍රධාන ගබඩාවට භාරගැනීම (GRN), සැපයුම්කරු වෙත ආපසු යැවීමේ හර සටහන් (RTV / Debit Note), සහ Client Free Stock (FOC) ප්‍රධාන ගබඩාවට ගෙන අදාළ Site Branch එකට පමණක් ස්වයංක්‍රීයව වෙන් කිරීම.',
    icon: Gift,
    steps: [
      {
        stepTitle: '1. නිල සැපයුම්කරු ඇණවුම් පත්‍රිකා (Purchase Orders - PO) නිකුත් කිරීම',
        detail:
          '"Supplier Orders (PO)" වෙත ගොස් අනුමත සැපයුම්කරුවන් සඳහා මිල ගණන්, බදු (VAT/Tax), වට්ටම් සහ අනුමත කිරීමේ අත්සන් තීරු 3 සහිත නිල Purchase Order (PO-2026-0001) සාදා A4 පත්‍රිකාවක් ලෙස Print හෝ PDF ලෙස ලබාගන්න.',
      },
      {
        stepTitle: '2. PO එකක සියලුම භාණ්ඩ ප්‍රධාන ගබඩාවට (Central Main Stock) භාරගැනීම සහ GRN මුද්‍රණය',
        detail:
          'PO ඇණවුමකට අදාළව භාණ්ඩ කිහිපයක් එකවර හෝ කොටස් වශයෙන් (Partial Delivery) ලැබුණු විට එම සියලුම Items එකවර නිවැරදිව ප්‍රධාන ගබඩාවට (Central Main Stock) එකතු වන අතර, "Print GRN" බටන් එකෙන් නිල GRN වවුචරය මුද්‍රණය කළ හැක.',
      },
      {
        stepTitle: '3. සැපයුම්කරු වෙත භාණ්ඩ ආපසු යැවීම (RTV / Debit Note) සහ Damaged Stock',
        detail:
          'ප්‍රමිතියෙන් තොර හෝ වැඩිපුර ලැබුණු භාණ්ඩ ආපසු සැපයුම්කරු වෙත යැවීමේදී "Return to Vendor (RTV) / Debit Note" සහ Gate Pass පත්‍රිකා නිකුත් කරන්න. වැඩබිම්වලදී හානි වූ භාණ්ඩ අලුත්වැඩියා කර නැවත ප්‍රධාන තොගයට එකතු කිරීමට Damaged Stock කොටස භාවිත කරන්න.',
      },
      {
        stepTitle: '4. Client Free Stock (FOC) පියවර 5 Reconciliation Flow, වර්ණ ගැන්වූ Project Cards සහ Central Reports',
        detail:
          '"Client Free Stock" හි "+ Log Client Free Stock" තුළ Project එක තේරූ සැණින් "Allocated Site Branch" එක එම Project එකේ ශාඛාවට Lock වේ ("ALL AREAS" ලෙස සෑදූ Project සඳහා ඕනෑම Site එකකට නිකුත් කළ හැක). FOC වාර්තා පැහැදිලි පියවර 5 ක්‍රමයට පෙන්වයි: (1) Central Stock FOC ලැබීම -> (2) Site Issue -> (3) Team Issue -> (4) Usage & Wastage -> (5) Project Completion පසු Client වෙත ආපසු භාර දිය හැකි ඉතිරිය (Returnable Balance). වෙනස් වර්ණවලින් වෙන් කළ Main Project Cards යටතේ සෑම Sub-Project එකකම (උදා: KT-RGL-0505, KT-ABK-0506) Flow එක වෙන වෙනමත්, අවසානයේ මුළු Main Project එකේම Full Usage & Balance Report එකත් ලබාගත හැක. එමෙන්ම Central Stock වෙතින් එක් එක් Issued Item එක වෙන වෙනමත්, Project එකේ සියලු Items එකටත් A4/PDF Report ලෙස ගත හැක.',
      },
      {
        stepTitle: '5. Central Stock Item Summary සහ PO / Return Dropdown වල Item Image පෙන්වීම',
        detail:
          '"Main Stock Control -> Central Stock Inventory" වගුවේ ඕනෑම භාණ්ඩ පේළියක් මත ක්ලික් කළ විට (හෝ "Summary" බටන් එක එබූ විට) එම භාණ්ඩය PO/GRN, Manual හෝ FOC හරහා ආ ආකාරය, Site සහ Teams වලට බෙදී ගිය ආකාරය, Used/Wasted සහ Central/Site/Team In-Hand තොග සියල්ල "Print A4 Summary" සහ "Download PDF" සමඟ පෙන්වයි. තවද PO දැමීමේදී සහ Team/Branch Returns දැමීමේදී Dropdown ලැයිස්තුවල Item Image එකද පැහැදිලිව පෙන්වයි.',
      },
    ],
    keyOutputs: [
      'Purchase Orders (PO), Multi-Item GRN සහ PO/Return Dropdown වල Item Images පෙන්වීම',
      'Return to Vendor (RTV) Debit Notes සහ Outward Gate Pass පත්‍රිකා',
      'පියවර 5 Client FOC Reconciliation, වෙන වෙනම/සම්පූර්ණ Central FOC Reports සහ "ALL AREAS" පහසුකම',
      'Central Stock Item Summary — PO/Manual ලැබීම්, Site/Team බෙදීම්, Used/Wasted සහ Printable A4/PDF',
    ],
  },
  {
    id: 'ch-03',
    number: '03 වන පරිච්ඡේදය',
    category: 'operations',
    categoryLabel: 'ශාඛා හුවමාරු සහ කණ්ඩායම් නිකුත් කිරීම්',
    title: '3-Tier Regional/Sub-Site නිකුත් කිරීම්, Requisitions ("Parent Avl:"), Forward Summary සහ Field Teams (IN)',
    summary:
      'සාමාන්‍ය හා FOC බඩු ඉල්ලුම්පත් (Sub-Site නම් ඉබේම Parent Regional Site එකට යොමු වේ), Regional Site සිට Sub-Site වෙත සෘජුව "Issue Stock to Sub-Site", Forward Summary සහ Regional/Sub-Site Teams වෙත නිකුත් කිරීම්.',
    icon: Send,
    steps: [
      {
        stepTitle: '1. Stock Requisition ටැබ් 2 — Regional Sites HQ වෙතත්, Sub-Sites ඉබේම Parent Site වෙතත් යොමු වීම',
        detail:
          '"Stock Requisitions -> + New Stock Requirement Form" හි "Requesting Site Branch *" තෝරා "1. Normal Stock Request" ("Site Low" උඩින්ම) හෝ "2. Client Free Stock (ALL AREAS ඇතුළුව)" භාවිත කරන්න. Regional Site Branch එකක ඉල්ලුම්පත් Central HQ වෙත යොමු වන අතර, Sub-Site Branch එකක් Requisition එකක් දැමූ විට එය ස්වයංක්‍රීයව එහි Parent Regional Site Branch එක වෙත යොමු වේ (සජීවී "Parent Avl:" තොගය සමඟ)!',
      },
      {
        stepTitle: '2. HQ / Parent Site Approve කිරීම සහ තොග ශ්‍රේණිගතව මාරු වීම',
        detail:
          'Regional Site ඉල්ලුම්පත් Central HQ විසින් Approve කරන අතර, Sub-Site Requisitions එහි Parent Regional Branch Admin හෝ Central Admin විසින් Approve කරයි. භාරගත් පසු Regional සිට Sub-Site දක්වා තොග නිවැරදිව හුවමාරු වන අතර සම්පූර්ණ Item Traceability හිද එම Sub-Site ධුරාවලිය පෙන්වයි.',
      },
      {
        stepTitle: '3. Site Branch Stock — සෘජු "Issue Stock to Sub-Site", "Central FOC" Badge සහ Forward Summary',
        detail:
          '"Site Branch Stock (Site Inventories)" හි ඕනෑම Parent Regional Site Branch එකක් තේරූ විට පෙනෙන "Issue Stock to Sub-Site" බටන් එක මගින් Requisition එකක් නැතිවම Regional Site තොගයෙන් කෙලින්ම තම Sub-Site Branches වෙත බඩු නිකුත් කළ හැක. Central FOC බඩු "Central FOC" Badge එකෙන් Highlight වන අතර Item පේළියක් ක්ලික් කර Printable Forward Reconciliation Summary ලබාගත හැක.',
      },
      {
        stepTitle: '4. Regional සහ Sub-Site දෙවර්ගයේම වැඩ කණ්ඩායම් නිකුත් කිරීම් (IN) සහ Site-Separated Team Stock',
        detail:
          'Regional Site Branches වගේම Sub-Site Branches ඇතුළතද සාමාන්‍ය පරිදි "Issue to Teams" හරහා Field Teams වෙත භාණ්ඩ නිකුත් කර Issue Note (IN) මුද්‍රණය කළ හැක. "Team In-Hand Stock" හි Transfer කළ Team වල පරණ Site බඩු "Stock to Return - [Previous Site Name]" ලෙස වෙනම පෙන්වයි.',
      },
    ],
    keyOutputs: [
      'Regional Site වෙතින් සෘජු "Issue Stock to Sub-Site" සහ Sub-Site Requisitions ඉබේම Parent Site වෙත යොමු වීම',
      'Normal Stock ("Site Low" Top Sort) සහ Assigned-Site / "ALL AREAS" Client FOC ටැබ් 2',
      'Site Branch Stock හි "Central FOC" Badge Highlight සහ Forward Reconciliation Summary (Printable A4 / PDF)',
      'Regional & Sub-Site දෙකේම Teams නිකුත් කිරීම් සහ "Stock to Return - [පරණ Site නම]" වෙන් කර පෙන්වීම',
    ],
  },
  {
    id: 'ch-04',
    number: '04 වන පරිච්ඡේදය',
    category: 'projects',
    categoryLabel: 'ව්‍යාපෘති, International Section Templates (Telecom/Water/Electric/Solar), "+ Add Field" සහ Full Reports',
    title: 'Project Registry, International Section Templates (Telecom, Water, Electric, Solar), "+ Add Field" සහ Full Site වාර්තා',
    summary:
      'Telecom New Connection මෙන්ම Water Project, Electrical Power Project සහ Solar PV Project සඳහා ජාත්‍යන්තර ප්‍රමිතියේ (International Standard) Section Templates එක ක්ලික් එකකින් Load කරගැනීම, "+ Add Field" හරහා අලුත් Fields කැමති ගණනක් එකතු කිරීම, 1-2-3 Daily Progress සහ Full Site Report ලබාගැනීම.',
    icon: FolderKanban,
    steps: [
      {
        stepTitle: '1. International Section Templates (Telecom, Water, Electric, Solar) සහ "+ Add Field" මගින් අලුත් Fields එකතු කිරීම',
        detail:
          '"Project & New Section Registry -> New Section Registry & Material Templates" හි "+ Add New Section" (හෝ Quick-Load බටන්) මගින් පහත International Templates එක ක්ලික් එකකින් Load කරගත හැක: (1) Telecom New Connection (ITU-T G.984 / FTTH — NC No, ONT Serial, FDP/Splitter Port, Optical Power dBm), (2) Water Supply Project (ISO 4064 / AWWA — Water Account No, Water Meter Serial, Pipe Diameter DN/PN, Pressure Bar, Ferrule/Saddle Size), (3) Electrical Power Project (IEC 60364 — Consumer Account No, Energy Meter Serial kWh, Phase/Voltage, Contract Demand kVA, Earth Resistance Ω), (4) Solar PV & Net-Metering Project (IEC 62446 — Solar Project/Net-Metering Ref, Inverter Serial, System Capacity kWp DC/kW AC, PV Module & Panel Count, Battery BESS kWh), හෝ (5) Standard EPC Project. එමෙන්ම "+ Add Field" බටන් එක මගින් ඔබට අවශ්‍ය ඕනෑම අලුත් Field එකක් (හෝ Project Register කරන තැනදීම "+ Add Custom Field") එකතු කරගත හැක.',
      },
      {
        stepTitle: '2. "Main Project -> Under New Connections" (Telecom/Water/Electric/Solar), Section-Filtered FOC සහ "ALL AREAS" Branch',
        detail:
          'Telecom, Water, Electrical, සහ Solar යන සියලුම New Connection Section 4 තුළම (1) Standalone New Connection, (2) Main Project (For New Connections), හෝ (3) Under Main Project (New Connection) ලෙස Register කළ හැක. Project Register කරද්දී "Assigned Site Branch" Dropdown එකෙන් අදාළ Site Branch එක හෝ පොදු "ALL AREAS (All Site Branches)" තෝරාගත හැක (එවිට ඕනෑම Site එකකින් එම Project/FOC බඩු භාවිත කළ හැක). Daily Progress හි 1-2-3 පියවර වලදී එම අදාළ Section එකට FOC තොග ලැබී ඇත්නම් පමණක් FOC Main Project Dropdown එක පෙරී (Filter වී) පෙන්වන අතර Company Stock පමණක් නම් අනවශ්‍ය FOC Options පෙන්වන්නේ නැත.',
      },
      {
        stepTitle: '3. "Wastage Qty", Site-Only / ALL AREAS Stock සහ Main Project & Sub-Project Reconciliation වාර්තාව',
        detail:
          'Qty Used සමඟ "Wastage Qty" සටහන් කළ හැකි අතර Main Project එකක් තෝරාගත් විට වර්ණ ගැන්වූ Cards මගින් වෙන් වූ ඒ යටතේ ඇති සෑම Sub-Project එකකම (උදා: KT-RGL-0505, KT-ABK-0506) Flow එක වෙන වෙනම පෙන්වා අවසානයේ Project Completion පසු Client වෙත භාර දිය යුතු Returnable Balance ඇතුළත් Full Usage & Balance Report එක ලබාදෙයි. තනි Sub-Project එකක් තේරූ විට එම Sub-Project එකට පමණක් අදාළ Usage Flow එක පෙන්වයි.',
      },
      {
        stepTitle: '4. Usage Vouchers History — "Full Report for This Site" සහ Upstream Multi-Item Returns (RV / BRM)',
        detail:
          '"Usage Vouchers History" හි Project එකක් තේරූ විට "Full Report for This Site (Project)" මගින් Team Subtotals සහ Full Grand Total ලබාගත හැක. ඉතිරි අමුද්‍රව්‍ය හෝ යන්ත්‍රෝපකරණ ආපසු භාරදීමේදී "Team Returns" (RV -> Regional හෝ Sub-Site වෙත) සහ "Branch Returns" (BRM) දෙකේම "+ Add Item" / "+ Add All" මගින් භාණ්ඩ ගණනාවක් එකවර Return කළ හැක. විශේෂයෙන් Sub-Site Branch එකක Branch Return (BRM) ඉබේම එහි Parent Regional Site Branch එකටත්, Regional Site Return ඉබේම Central HQ වෙතත් ආපසු යොමු වේ!',
      },
    ],
    keyOutputs: [
      'International Section Templates (Telecom, Water, Electric, Solar) + "+ Add Field" සහ "ALL AREAS" Branch විකල්පය',
      'Main Project -> Under New Connections ව්‍යුහය සහ Section අනුව Filter වන Client FOC Dropdown',
      'වර්ණ ගැන්වූ Main Project & Sub-Project 5-Stage Reconciliation සහ Client Completion Returnable Report',
      '"Full Report for This Site (Project)" සහ Upstream Returns (Sub-Site BRM -> Parent Site, Regional -> Central)',
    ],
  },
  {
    id: 'ch-05',
    number: '05 වන පරිච්ඡේදය',
    category: 'formats',
    categoryLabel: 'Format Settings, Signers සහ Digital Signatures සකස් කිරීම',
    title: 'ISO 9001:2015 Format Settings, Auto Tenant Header, Signers සහ Digital Signatures සකස් කරගන්නා ආකාරය',
    summary:
      '"Document Templates" හි ඇති ටැබ් 3 හරහා (1) ISO 9001:2015 Standard Format සහ PDF/Image Upload කිරීම, (2) Auto Tenant Header සහ Signers (අත්සන් කරන නිලධාරීන්ගේ නම් හා තනතුරු) සැකසීම, සහ (3) Digital Signatures එකතු කර තනි ක්ලික් එකකින් A4 Voucher Print කරගන්නා සම්පූර්ණ පියවර.',
    icon: Upload,
    steps: [
      {
        stepTitle: '1. Tab 1 — "1. Section Formats (ISO Standard & Upload PDF/Image)" සහ Format Settings',
        detail:
          'වම්පස මෙනුවෙන් "Document Templates" වෙත ගොස් 1 වන ටැබ් එක ("1. Section Formats") විවෘත කරන්න. කිසිදු ගොනුවක් Upload නොකළද, කාණ්ඩ 4ම (FORMAT-01 සිට FORMAT-04 දක්වා) ජාත්‍යන්තර ISO 9001:2015 Controlled Document Format එකෙන් සහ ඔබේ ආයතනයේ නම (Tenant Company Name), දුරකථන, Email හා ලිපිනය ස්වයංක්‍රීයව Header එකට යොදාගනී. ඔබට ඔබේම PDF (.pdf) හෝ Image (.png/.jpg) ආකෘතියක් Upload කිරීමටත්, "Use FORMAT-01 across all GRN, FOC & Stock Return sections too" මගින් Format-01 සහ 02 ඒකාබද්ධ කිරීමටත්, "Customize Format Settings & Preview" ක්ලික් කර Table Column Names, Sign-off Titles හා Render Mode වෙනස් කිරීමටත් පුළුවන.',
      },
      {
        stepTitle: '2. Tab 2 — "2. Auto Tenant Header & Signers" (ආයතනයේ විස්තර, Logo සහ Signers සැකසීම)',
        detail:
          '2 වන ටැබ් එක ("2. Auto Tenant Header & Signers") වෙත ගොස්: (අ) "1. Tenant Company Identity & ISO Header Details" යටතේ ස්වයංක්‍රීයව ලැබී ඇති ආයතනයේ නම, ලිපිනය, දුරකථන අංක පරීක්ෂා කර "Logo Monogram Text" හෝ "Logo Image (Upload)" මගින් ඔබේ ලාංඡනය එක් කරන්න ("Sync from Tenant Account" බටන් එකෙන් ඕනෑම විටෙක Tenant ගිණුමේ විස්තර නැවත Auto-fill කරගත හැක). (ආ) "2. ISO Signer Names, Designations & Department Matrix" යටතේ වවුචර්වල අත්සන් තබන "Prepared & Checked By", "Authorized & Approved By" සහ "Reviewed By" නිලධාරීන්ගේ නම් (Signer Full Name), තනතුරු (Designation), අංශ (Department) සහ ISO Issue/Revision අංක ඇතුළත් කර "Save ISO Header & Signers" ක්ලික් කරන්න.',
      },
      {
        stepTitle: '3. Tab 3 — "3. Digital Signatures" සහ "Off Digital Signature (Default for Printing)" පහසුකම',
        detail:
          '3 වන ටැබ් එක ("3. Digital Signatures") වෙත ගොස් "+ Add Digital Signature" ක්ලික් කර නිලධාරියාගේ නම, තනතුර හා අංශය ඇතුළත් කර තිරය මත අත්සන අඳින්න (Draw) නැතිනම් PNG/JPG Image එකක් Upload කර Save කරන්න. තවද කඩදාසි මත පෑනෙන් අත්සන් (Hand Signature) තැබීමට අවශ්‍ය නම් මෙම ටැබ් එකේ ඇති "Off Digital Signature (Default for Printing)" Checkbox එක On කර සියලුම වාර්තා සඳහා ස්ථිර Default ක්‍රමය ලෙස සැකසිය හැක.',
      },
      {
        stepTitle: '4. "Off Digital Signature" Hand-Sign Print ක්‍රමය, පැහැදිලි අකුරු ප්‍රමාණය (13.5px) සහ A4 Print / PDF',
        detail:
          'ඕනෑම වවුචරයක් (RN, IN, PU, TSR, GRN, FOC, RV, BRM, PO, RTV/Debit Note), "Full Report for This Site (Project)", Client FOC වාර්තාවක්, Item Summary එකක් හෝ Branch Directory වාර්තාවක් Print කිරීමේදී ඉහළ තීරුවේ ඇති "Off Digital Signature" Checkbox එක On කළ හැක (නැතිනම් Edit Signers වෙතින් එක් නිලධාරියෙකු සඳහා පමණක් "Off Digital Signature (Blank Hand-Sign Space)" තේරිය හැක). එවිට Digital අත්සන සැඟවී, පෑනෙන් අත්සන් කිරීමට සහ රබර් මුද්‍රා (Stamp) තැබීමට ප්‍රමාණවත් ඉඩක් ("Hand Signature & Stamp") ඉතිරි වේ. සියලුම වගු සහ වාර්තා එකම ප්‍රමිතියක පැහැදිලි අකුරු ප්‍රමාණයකින් (13.5px / 12px) Print හා PDF වේ.',
      },
    ],
    keyOutputs: [
      'ISO 9001:2015 Controlled Formats (FORMAT-01 සිට 04) + Auto Tenant Header',
      'Tab 2: ආයතනයේ Logo සහ Signers (Prepared / Approved / Reviewed) තනතුරු සැකසුම',
      'Digital Signatures Library + පෑනෙන් අත්සන් තැබීමට ඉඩ තබන "Off Digital Signature" Print Mode',
      'සියලුම වගු සහ වාර්තා සඳහා පැහැදිලි Uniform අකුරු ප්‍රමාණය සහ Single-Click A4 Print / PDF',
    ],
  },
  {
    id: 'ch-06',
    number: '06 වන පරිච්ඡේදය',
    category: 'admin',
    categoryLabel: 'Glass Tone Themes, Subscriptions, විගණන සහ Backups',
    title: 'Glass Tone Live Themes (Sapphire & Gold Default), යන්ත්‍රෝපකරණ, Recurring Subscriptions සහ Backups',
    summary:
      'ඉහළ Header තීරුවෙන් සජීවීව Theme 9ක් අතර මාරු වීම, යන්ත්‍රෝපකරණ පාලනය, Print මොහොතේදීම Hand-Sign ඉඩ සැකසීම, Payments.lk / Stripe ස්වයංක්‍රීය කාඩ් ගෙවීම් සහ ආරක්ෂිත Offline Backups.',
    icon: ShieldCheck,
    steps: [
      {
        stepTitle: '1. සජීවී "Glass Tone" Theme 9 ("Sapphire & Gold" Default) සහ පිළිවෙළ Workspace පෙනුම',
        detail:
          'පද්ධතිය විවෘත වන විට Default වර්ණය ලෙස Landing Page එකට ගැළපෙන "Sapphire & Gold" (Royal Navy & Gold) Theme එක ක්‍රියාත්මක වේ. ඉහළ Header තීරුවේ ඇති "Glass Tone" Dropdown එකෙන් (හෝ System Config වෙතින්) ඕනෑම මොහොතක Theme 9ක් අතර සජීවීව මාරු විය හැක: Sapphire & Gold, Liquid Emerald, Oceanic Teal, Cobalt Azure, Liquid Indigo, Liquid Amethyst, Obsidian Amber, Liquid Crimson සහ Liquid Titanium — එවිට Header, Workspace Navigation තීරුව, Background Canvas, Banners සහ Mobile Dock ඉබේම අලංකාරව වෙනස් වේ. Main Central Stock වල Filter Buttons සහ Inbound Receipts වගුවද වඩාත් පැහැදිලි හා සංයුක්ත ලෙස සකසා ඇත.',
      },
      {
        stepTitle: '2. යන්ත්‍රෝපකරණ (Plant & Machinery) සහ Print කරන මොහොතේදීම Signers / Hand-Sign වෙනස් කිරීම',
        detail:
          'සාමාන්‍ය අමුද්‍රව්‍ය වලින් වෙන්ව යන්ත්‍රෝපකරණ සහ ටූල්ස් ප්‍රධාන ගබඩාවේද, ශාඛාවකද, නැතහොත් කණ්ඩායමක් ළඟද යන්න බලාගන්න. ඕනෑම වවුචරයක් Print කිරීමේදී උඩින් ඇති "Customize Voucher Header, Signers & Digital Signatures" ක්ලික් කර එම මුද්‍රණයට පමණක් Document No, දිනය, නිලධාරීන්ගේ නම්, Digital Signatures හෝ "Off Digital Signature (Blank Hand-Sign Space)" තෝරා Print කළ හැක.',
      },
      {
        stepTitle: '3. Admin Password ආරක්ෂාව, Audit Trail, Recycle Bin සහ Payments.lk / Stripe Auto-Renew Subscriptions',
        detail:
          'පද්ධතියේ ඕනෑම දෙයක් Delete කිරීමේදී Admin Password ඇතුළත් කිරීම අනිවාර්ය වන අතර සෑම ක්‍රියාවක්ම "Audit Trail" හි සටහන් වී මැකුණු දත්ත "Recycle Bin" හරහා Restore කළ හැක. "Subscription" කොටස හරහා Payments.lk / PAYable (සජීවී USD -> LKR විනිමය අනුපාතය සමඟ) හෝ Stripe මගින් ස්වයංක්‍රීයව අලුත් වන (Auto-Renewing) Pro Monthly / Pro Annual කාඩ් ගෙවීම් සක්‍රිය කර Billing Portal හරහා පාලනය කළ හැක.',
      },
      {
        stepTitle: '4. රටට අදාළ දුරකථන අංක ගණන ස්වයංක්‍රීයව හඳුනාගැනීම සහ 1-Click JSON/Excel Backups',
        detail:
          'ලොග් වී සිටින ආයතනයේ රට අනුව (උදා: ශ්‍රී ලංකාව සඳහා ඉලක්කම් 10 / +94 සමඟ 9) දුරකථන අංක ඇතුළත් කරන සෑම තැනකම නිවැරදි අංක ගණන ස්වයංක්‍රීයව පරීක්ෂා කෙරේ. ඕනෑම මොහොතක සම්පූර්ණ පද්ධතියේම දත්ත Offline JSON Backup ගොනුවක් ලෙස හෝ Multi-Sheet Excel වාර්තාවක් ලෙස බාගත කරගත හැක.',
      },
    ],
    keyOutputs: [
      'සජීවී "Glass Tone" Theme 9 ("Sapphire & Gold" Default) සහ පිළිවෙළ Main Stock / Inbound පෙනුම',
      'යන්ත්‍රෝපකරණ Custody ලෙජරය සහ Print මොහොතේදී "Off Digital Signature" Hand-Sign පහසුකම',
      'Payments.lk / Stripe Auto-Renew Card Subscriptions සහ සජීවී USD -> LKR පරිවර්තනය',
      'Admin Password Delete ආරක්ෂාව, Audit Trail, Recycle Bin සහ 1-Click JSON/Excel Backups',
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
    group: '3-Tier Company Hierarchy, 20 Sites Default & Super Admin Accountability',
    items: [
      '3-Tier Hierarchy: Central HQ -> Regional Site Branches -> Optional Nested Sub-Site Branches -> Field Teams (Teams supported in BOTH tiers)',
      'Direct Parent-to-Sub-Site Dispatch: "Issue Stock to Sub-Site" button inside Site Branch Stock + Parent-Routed Sub-Site Requisitions ("Parent Avl:")',
      'Smart Upstream Branch Returns (BRM): Sub-Sites automatically return to Parent Regional Branch; Regional Branches return to Central Main Warehouse',
      'Included Capacity: Unlimited Users, Unlimited Field Teams & 1 Central HQ + 20 Regional/Sub-Site Branches (+$10/mo extra site)',
      'Super Admin Personal Accountability: Mandatory Full Name on signup + First-Name check on login stamped as "[Name] (as Super Admin)"',
      'Hierarchical Branch Directory & Central Item Traceability: Parent Regional Sites sort neatly above child Sub-Sites with full parent-child flow',
    ],
  },
  {
    group: 'Warehouse, 5-Stage Client FOC Reconciliation & End-to-End Traceability',
    items: [
      '5-Stage Standard Client FOC Reconciliation Flow: Initial Central Receipt -> Site Issue -> Team Issue -> Usage & Wastage -> Completion Returnable Balance',
      'Color-Coded Main Project Cards + Sub-Project Individual Flow (KT-RGL-0505, KT-ABK-0506) & Full Consolidated Balance Report',
      'Central FOC A4/PDF Reports: Generate Separate Reports per Issued Item OR One Full Consolidated Report for the Entire Project',
      'Site Branch Stock "Central FOC" Highlight Badge & Forward Traceability Summary (Printable A4 / PDF)',
      'Central Stock Item Selection -> Full End-to-End Lifecycle Summary (PO/Manual/FOC Inbound, Site & Sub-Site Distribution, Used/Wasted, In-Hand)',
      'Sequential 0001-Based Codes, IDs & Voucher References (ITM-0001, PO-2026-0001, RN-2026-0001)',
      'Single-Shot Camera & USB Gun Barcode Scanner with Auto-Hide & "Scan Now" Button',
      'Supplier Purchase Orders (PO), Multi-Item Atomic GRN Vouchers & Return to Vendor (RTV) Debit Notes',
      'Item Photos (<200KB Auto-Compressed) Displayed in Item Catalog, Requisitions, POs & Return Dropdowns + "Print with Image" Toggle',
      'Excel / CSV Bulk Import, Multi-Sheet Export & Low-Stock Alerts',
    ],
  },
  {
    group: 'Field Operations, "ALL AREAS" Multi-Site Projects, New Connection FOC & Batch Returns',
    items: [
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
    group: 'ISO 9001:2015 Format Settings, Off Digital Signature, Glass Tone Themes & Subscriptions',
    items: [
      'Default ISO 9001:2015 Controlled Formats (FORMAT-01 to 04) with Auto-Synced Tenant Company Header',
      'Tab 2 Signer Governance: Prepared By, Approved By & Reviewed By Names, Designations & Departments',
      'Tab 3 Digital Signatures Library (Draw/Upload) + "Off Digital Signature (Default for Printing)" Global Toggle',
      '"Off Digital Signature" Per-Print Hand-Sign Mode Across All Vouchers & Reports (Generous Dashed Ink-Sign & Stamp Space)',
      'Uniform Crisp Typography (13.5px Body / 12px Headers) Across All Tables, Inbound Ledgers & Printed A4 Reports',
      'Live "Glass Tone" Theme Switcher in Header (9 Apple Liquid Glass Themes, Default "Sapphire & Gold")',
      'Auto-Renewing Card Subscriptions (Payments.lk / PAYable & Stripe) with Live USD -> LKR FX Rate Conversion',
      'Optional PDF / Image Company Format Upload (Max 1MB Limit), Live A4 Format Studio & Isolated PDF Export',
      'Admin Password Verification Required for All Deletions, Audit Trail, Recycle Bin & 1-Click JSON Backup',
    ],
  },
];

const FEATURE_SUMMARY_LIST_SI: FeatureSummaryGroup[] = [
  {
    group: '3-Tier ආයතනික ව්‍යුහය, Site Branches 20 ධාරිතාව සහ Super Admin First-Name වගකීම',
    items: [
      '3-Tier ගබඩා ව්‍යුහය: Central HQ -> Regional Site Branches -> Optional Sub-Site Branches -> Field Teams (Tiers දෙකේම Teams ක්‍රියාත්මක වේ)',
      'Regional Site වෙතින් Sub-Site වෙත සෘජු බඩු නිකුත් කිරීම ("Issue Stock to Sub-Site") සහ Parent-Routed Requisitions ("Parent Avl:")',
      'ස්වයංක්‍රීය Upstream Branch Returns (BRM): Sub-Site වෙතින් Parent Regional Branch වෙතත් Regional වෙතින් Central HQ වෙතත් Return වේ',
      'මූලික පැකේජයටම: Unlimited Users, Unlimited Teams & 1 Central HQ + Site Branches 20ක් ඇතුළත් (අමතර Site +$10/mo)',
      'Super Admin පුද්ගලික වගකීම: ලියාපදිංචියේදී අනිවාර්ය Full Name + Login වීමේදී First-Name පරීක්ෂා කර "[නම] (as Super Admin)" ලෙස සටහන් කිරීම',
      'Hierarchical Branch Directory & Central Traceability: Parent Regional Site යටතේ Sub-Sites පිළිවෙළට පෙන්වීම',
    ],
  },
  {
    group: 'ගබඩා කළමනාකරණය, පියවර 5 Free Stock Reconciliation සහ Item Lifecycle Summary',
    items: [
      'පියවර 5 Client FOC Reconciliation Flow: Central Receipt -> Site Issue -> Team Issue -> Usage & Wastage -> Project Completion Returnable Balance',
      'වර්ණ ගැන්වූ Main Project Cards + එක් එක් Sub-Project Flow (KT-RGL-0505, KT-ABK-0506) සහ අවසන් Full Usage & Balance Report',
      'Central Stock වෙතින් එක් එක් Issued Item එක වෙන වෙනමත්, Project එකේ සියලු Items එකටත් A4/PDF Report ලබාගැනීම',
      'Site Branch Stock හි "Central FOC" Badge/Highlight සහ Forward Traceability Summary (Printable A4 / PDF)',
      'Central Stock Item Summary: PO/Manual/FOC ලැබීම්, Site/Sub-Site/Team බෙදීම්, Used/Wasted සහ Central/Site/Team In-Hand පෙන්වීම',
      '0001 සිට පිළිවෙළට ජනනය වන Item Codes, Project IDs සහ PO / Requisition / Return Dropdown වල Item Images පෙන්වීම',
      'Detect වූ සැණින් නතර වී Camera ඉවත් වන Single-Shot Scanner සහ "Scan Now" බටන් එක',
      'නිල Purchase Orders (PO), Multi-Item GRN සහ Return to Vendor (RTV) Debit Notes / Gate Pass',
      '200KB ට අඩුවෙන් Auto-Compress වන Item Image Upload සහ වවුචර් Print කිරීමේදී "Print with Image" තේරීම',
      'Excel / CSV Bulk Import, Multi-Sheet Export සහ අවම තොග අනතුරු ඇඟවීම්',
    ],
  },
  {
    group: 'වැඩබිම් මෙහෙයුම්, "ALL AREAS" Projects, New Connection FOC සහ Multi-Item Returns',
    items: [
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
    group: 'ISO Formats, Off Digital Signature, Glass Tone Themes, Subscriptions සහ ආරක්ෂිත පාලනය',
    items: [
      'Default ISO 9001:2015 Controlled Formats (FORMAT-01 සිට 04) සහ ස්වයංක්‍රීය Tenant Company Header',
      'Tab 2 Signer Governance: Prepared By, Approved By සහ Reviewed By නිලධාරීන්ගේ නම්, තනතුරු සහ අංශ',
      'Tab 3 Digital Signatures (Draw / Upload) සහ ස්ථිර "Off Digital Signature (Default for Printing)" විකල්පය',
      'සෑම වවුචරයකම සහ වාර්තාවකම පෑනෙන් අත්සන් (Hand Sign & Stamp) තැබීමට ඉඩ තබන "Off Digital Signature" ක්‍රමය',
      'සියලුම වගු (Inbound Receipts ඇතුළුව) සහ A4 වාර්තා සඳහා පැහැදිලි Uniform අකුරු ප්‍රමාණය (13.5px / 12px)',
      'Header එකෙන් සජීවීව මාරු විය හැකි "Glass Tone" Theme 9 ("Sapphire & Gold" Default ලෙස විවෘත වේ)',
      'Payments.lk / PAYable සහ Stripe මගින් සජීවී USD -> LKR අනුපාතය සමඟ Auto-Renew කාඩ් Subscriptions',
      'PDF හෝ Image මගින් ආයතනයේ Format එක Upload කිරීම (උපරිම 1MB), Live A4 Format Studio සහ Isolated PDF',
      'Delete කිරීමේදී Admin Password අනිවාර්ය වීම, Audit Trail, Recycle Bin සහ 1-Click JSON Offline Backup',
    ],
  },
];

export const SystemUserGuideView: React.FC<SystemUserGuideViewProps> = ({
  onBackToOverview,
  onOpenSignup,
  onOpenLogin,
}) => {
  const [guideLang, setGuideLang] = useState<GuideLanguage>('en');
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

    // 6-Stage Flow
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 38, 64);
    doc.text('END-TO-END OPERATIONAL FLOW AT A GLANCE (6 CORE STAGES)', marginX, y);
    y += 4;

    const stages = [
      'Stage 01: Master, 20 Sites & First-Name Super Admin Setup - Register with mandatory Super Admin Full Name ("Name (as Super Admin)" logging), 1 HQ + 20 Sites (+$10/mo extra), Unlimited Users/Teams & optional Sub-Site Branches.',
      'Stage 02: PO, GRN & RTV - Issue Supplier Purchase Orders (PO), print batch GRN vouchers, log Client Free Stock (FOC) & RTV Debit Notes.',
      'Stage 03: Regional & Sub-Site Transfers - Regional Sites request from Central HQ; Parent Regional Branches issue stock directly to nested Sub-Sites or approve Sub-Site Requisitions.',
      'Stage 04: Field Crew Issue (Regional & Sub-Site) - Issue materials & tools to Crew Leaders inside both Regional and Sub-Site branches (IN / Gate Pass).',
      'Stage 05: Daily Progress, Wastage & Upstream Returns - Log Installed + Wastage Qty (PU), print Full Site Reports, & return surplus upstream (Sub-Site BRM -> Parent Site -> Central HQ).',
      'Stage 06: ISO Formats, Hand-Sign Print & Themes - Configure ISO 9001:2015 Formats, Digital Signatures or "Off Digital Signature" hand-sign mode, plus 9 Glass Tone themes ("Sapphire & Gold" default).',
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

    // ==================== 2. 6-STAGE OPERATIONAL FLOW ====================
    current.ctx.font = `800 21px ${fontStack}`;
    current.ctx.fillStyle = '#1e2640';
    current.ctx.fillText('පද්ධතිය ක්‍රියාත්මක වන ප්‍රධාන පියවර 6 (Operational Flow at a Glance)', MARGIN_X, current.y);
    current.y += 32;

    const siStages = [
      'පියවර 01 (Master Setup, Site 20 & Super Admin First-Name): අනිවාර්ය Full Name ලියාපදිංචිය, First-Name Verified Login ("[නම] (as Super Admin)"), Unlimited Users/Teams, Site Branches 20 (+$10/mo extra) සහ Sub-Site Branches සැකසීම.',
      'පියවර 02 (PO, GRN & පියවර 5 FOC): PO නිකුත් කිරීම, GRN, සහ Client FOC (Central -> Site -> Team -> Usage -> Returnable Balance) සටහන් කිරීම.',
      'පියවර 03 (Regional & Sub-Site බෙදාහැරීම්): Regional Sites HQ වෙතින්ද, Sub-Site Branches තම Parent Regional Site මගින් ("Issue Stock to Sub-Site" හෝ RN) බඩු ලබාගැනීම.',
      'පියවර 04 (Field Crew Issue - Tiers 2ම): Regional හා Sub-Site යන දෙකේම Teams වෙත භාණ්ඩ නිකුත් කිරීම (IN) සහ Site-Separated In-Hand තොග.',
      'පියවර 05 (Usage, Wastage & Upstream Returns): Main/Sub-Project Balance Reports, සහ Sub-Site -> Parent Site -> Central HQ ලෙස Upstream Returns (RV / BRM).',
      'පියවර 06 (ISO Formats, Hand-Sign & Glass Tone): ISO 9001:2015 Formats, Digital Signatures හෝ "Off Digital Signature" ක්‍රමය සහ Sapphire & Gold ඇතුළු Glass Tone Themes 9.',
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

    // ==================== 3. CHAPTERS 01 TO 06 ====================
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
              <span>{guideLang === 'si' ? 'ප්‍රධාන පිටුවට (Overview)' : 'Back to Platform Overview'}</span>
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

            {/* ==================== 6-STAGE VISUAL STOCK FLOW ("AT A GLANCE") ==================== */}
            <div className="mt-8 pt-7 border-t border-slate-200/80">
              <div className="text-xs font-extrabold text-[#081024] mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>
                  {guideLang === 'si'
                    ? 'පද්ධතියේ සමස්ත ක්‍රියාවලිය කෙටියෙන් (ප්‍රධාන පියවර 6)'
                    : 'End-to-End Operational Flow at a Glance (6 Core Stages)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                {(guideLang === 'si'
                  ? [
                      {
                        stage: 'පියවර 01',
                        title: 'මූලික ලියාපදිංචිය',
                        desc: 'භාණ්ඩ, යන්ත්‍රෝපකරණ, ශාඛා, සැපයුම්කරුවන් සහ Teams (Auto Crew Size) ඇතුළත් කිරීම.',
                        icon: HardHat,
                      },
                      {
                        stage: 'පියවර 02',
                        title: 'PO, GRN, FOC සහ RTV',
                        desc: 'Item Images සහිත PO නිකුත් කිරීම, GRN, 5-Stage Client FOC ("ALL AREAS" ඇතුළුව) සහ RTV.',
                        icon: ShoppingCart,
                      },
                      {
                        stage: 'පියවර 03',
                        title: 'ශාඛා තොග සහ Central FOC',
                        desc: 'ශාඛා මගින් බඩු ඉල්ලුම් කිරීම (RN), Central FOC badge හඳුනාගැනීම සහ ප්‍රධාන ගබඩාවෙන් යැවීම.',
                        icon: Building2,
                      },
                      {
                        stage: 'පියවර 04',
                        title: 'කණ්ඩායම් නිකුත් කිරීම්',
                        desc: 'Team Leaders වෙත භාණ්ඩ හා ටූල්ස් නිකුත් කිරීම (IN) සහ අත ඇති තොග පරීක්ෂාව.',
                        icon: Users2,
                      },
                      {
                        stage: 'පියවර 05',
                        title: 'Usage, 5-Stage FOC සහ Reports',
                        desc: 'Main Project -> New Connections භාවිතය, Wastage, 5-Stage FOC Balance සහ ආපසු භාරදීම (RV/BRM).',
                        icon: RotateCcw,
                      },
                      {
                        stage: 'පියවර 06',
                        title: 'ISO Formats, Hand-Sign සහ Glass Tone',
                        desc: 'ISO 9001:2015 Formats, Digital Signatures හෝ "Off Digital Signature" (Hand-Sign), සහ Glass Tone Themes 9.',
                        icon: Upload,
                      },
                    ]
                  : [
                      {
                        stage: 'Stage 01',
                        title: 'Master & Crew Setup',
                        desc: 'Register items, site yards, suppliers, clients & teams (auto crew size).',
                        icon: HardHat,
                      },
                      {
                        stage: 'Stage 02',
                        title: 'PO, GRN, FOC & RTV',
                        desc: 'Issue POs with thumbnails, print GRNs, log Client FOC ("ALL AREAS" supported) & RTV.',
                        icon: ShoppingCart,
                      },
                      {
                        stage: 'Stage 03',
                        title: 'Branch Stock & Central FOC',
                        desc: 'Request stock (RN), identify "Central FOC" items in Site Stock & dispatch from HQ.',
                        icon: Building2,
                      },
                      {
                        stage: 'Stage 04',
                        title: 'Field Crew Issue',
                        desc: 'Issue materials & tools to Crew Leaders (IN) with live custody guard.',
                        icon: Users2,
                      },
                      {
                        stage: 'Stage 05',
                        title: 'Usage, 5-Stage FOC & Reports',
                        desc: 'Log Main Project -> New Connections usage & wastage, 5-Stage FOC balance & returns (RV/BRM).',
                        icon: RotateCcw,
                      },
                      {
                        stage: 'Stage 06',
                        title: 'ISO Formats, Hand-Sign & Themes',
                        desc: 'ISO 9001:2015 formats, Digital Signatures or "Off Digital Signature" hand-sign mode, and 9 Glass Tone themes.',
                        icon: Upload,
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
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-medium">
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
                    { id: 'all', label: 'සියලුම පරිච්ඡේද (06)' },
                    { id: 'setup', label: '01. ලියාපදිංචිය සහ Teams' },
                    { id: 'warehouse', label: '02. PO, GRN සහ RTV' },
                    { id: 'operations', label: '03. ශාඛා සහ Crew නිකුත් කිරීම්' },
                    { id: 'projects', label: '04. ව්‍යාපෘති සහ Returns' },
                    { id: 'formats', label: '05. Format, Signers සහ Signatures' },
                    { id: 'admin', label: '06. යන්ත්‍රෝපකරණ සහ Backups' },
                  ]
                : [
                    { id: 'all', label: 'All Chapters (06)' },
                    { id: 'setup', label: '01. Setup & Teams' },
                    { id: 'warehouse', label: '02. PO, GRN & RTV' },
                    { id: 'operations', label: '03. Site & Crew Dispatch' },
                    { id: 'projects', label: '04. Projects & Returns' },
                    { id: 'formats', label: '05. ISO Formats, Signers & Signatures' },
                    { id: 'admin', label: '06. Machinery & Security' },
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
