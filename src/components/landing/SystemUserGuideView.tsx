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
        stepTitle: '1. Create Your Company Workspace & Sequential 0001 Numbering',
        detail:
          'Click "Start 7-Day Free Trial" and enter your Company Name, Admin Username, and Password. All system codes, Item Codes (ITM-0001, MCH-0001), Barcodes (APX-0001), Project IDs (PRJ-2026-0001, MAJ-2026-0001), and Voucher Reference Numbers (PO, GRN, RN, DN, IN, PU, RV, BRM) automatically start from 0001 and increment sequentially.',
      },
      {
        stepTitle: '2. Register Materials, Heavy Machinery, Auto-Compressed Item Photos (<200KB) & Single-Shot Barcode Scanning',
        detail:
          'Open "Master Registrations -> Item Catalog" to add Consumable Materials and Returnable Machinery/Tools or bulk import via Excel/CSV. You can optionally attach an Item Photo when adding or editing any item — the system automatically resizes and compresses the image to under 200KB for fast cloud loading, and every printable voucher/report includes a "Print with Image" checkbox to optionally print item thumbnails. When scanning barcodes via Mobile Camera or USB/Wireless Barcode Gun, the scanner detects once, automatically stops and hides the camera view to prevent continuous duplicate scans, and provides a "Scan Now" button to re-activate the scanner.',
      },
      {
        stepTitle: '3. Register Field Teams, Auto Crew Size, Team Name Lock & Conflict-Free Site Transfer Workflow (Temporary vs. Permanent with Ref)',
        detail:
          'In "Master Registrations -> Teams", enter the Team Leader name (Crew Size automatically starts at 1 and increments with each Member added). To protect historical vouchers and audit integrity, once a team has received any stock item, its Team Name is automatically locked against renaming (while leader/member details remain editable). When transferring a Field Team to a new Site Branch via "Transfer / Site History", the system checks unreturned stock on their previous site and assigns them as "Temporary Assigned to - [New Site Name]" first. Once previous-site stock is cleared (or confirmed by Branch/System Admin when zero stock was held), the assignment promotes to "Permanent" and displays the team with a permanent prior-site reference: "[Team Name] (Ref: [Previous Site Name])", while preserving a Complete Assigned Sites History ledger.',
      },
      {
        stepTitle: '4. Create Staff Logins (Single Site, Multi-Site, HQ) & Auto Email Verification',
        detail:
          'Under "User Management", create accounts for HQ Storekeepers and Site Supervisors. Assign each user to All Sites (Central HQ), a Single Site Branch, or Multiple Specific Site Branches. Account security features 1-click "Send Verification Email" via apexstox.com (support@apexstox.com) — clicking the verification link in your inbox automatically completes verification.',
      },
    ],
    keyOutputs: [
      'Sequential 0001-Based Codes, IDs & Two-Line Item Code + Name Dropdowns',
      'Optional Item Photo Upload (<200KB Auto-Compression) & "Print with Image" Toggle',
      'Team Site Transfer ("Temporary Assigned" -> Permanent "Ref: Old Site") & Team Name Lock After Stock Issue',
      'Single-Site & Multi-Site Branch Locks + Auto Email Verification (apexstox.com)',
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
        stepTitle: '4. Record Client Free Materials (FOC) — Locked Site Branch, Assigned-Site Isolated FOC Summary & Admin Correction',
        detail:
          'Open "Client Free Stock", click "+ Log Client Free Stock", and choose "Under Main Project" or "Individual Project". Physical FOC materials default to "Main Central Warehouse (Central Yard)" as inbound storage, while selecting the Target Project automatically detects and LOCKS the "Allocated Site Branch" so stock cannot be accidentally issued to the wrong site. Furthermore, the Client FOC Lifecycle & Summary view is strictly isolated to the Assigned Site Branch — showing only teams, distributions, and project usage belonging to that specific site. If a shipment was logged under the wrong project, Admins can edit and reassign the FOC voucher directly inside Client Free Stock.',
      },
      {
        stepTitle: '5. Central Stock Item Selection — Full End-to-End Lifecycle Summary & Printable A4 Report',
        detail:
          'In "Main Stock Control -> Central Stock Inventory", click any item row (or its "Summary" button) to expand a complete End-to-End Material Lifecycle & Custody Summary directly underneath that item. It breaks down: (1) Inbound Sources (how much arrived via Supplier POs/GRN, Manual/Spot Entries, Client FOC, and Site Good Returns), (2) Site Branch Distribution & each site\'s current Site Store In-Hand, (3) Field Teams Allocation, Used, Wasted & each team\'s current Team In-Hand, (4) Project Consumption & Wastage logs, and live Custody KPI cards (Central In-Hand, Sites In-Hand, Teams In-Hand, Used, and Wasted/Damaged) — complete with "Print A4 Summary" and "Download PDF" buttons.',
      },
    ],
    keyOutputs: [
      'Printable Purchase Orders (PO) & Multi-Item Batch GRN Vouchers',
      'Return to Vendor (RTV) Debit Notes & Outward Gate Passes',
      'Client FOC Locked Site Branch, Assigned-Site Isolated FOC Summary & Admin Reassignment',
      'Central Stock Item Selection -> Full End-to-End Lifecycle Summary (Printable A4 / PDF)',
    ],
  },
  {
    id: 'ch-03',
    number: 'Chapter 03',
    category: 'operations',
    categoryLabel: 'Site Transfers & Field Dispatch',
    title: '2-Tab Site Stock Requisitions, Site Branch Item Forward Summary, HQ Dispatches & Crew Issuance (IN)',
    summary:
      'Submit Normal Stock or Branch-Exclusive Client Free Stock (FOC) requisitions, inspect forward item traceability at any Site Branch, and control every movement from Central HQ to Regional Site Yards and Field Teams.',
    icon: Send,
    steps: [
      {
        stepTitle: '1. Two-Tab Stock Requisition Form: Normal Stock vs. Client Free Stock (FOC) for Assigned Project',
        detail:
          'In "Stock Requisitions -> + New Stock Requirement Form", choose your Requesting Site Branch first, then switch between two dedicated tabs: (1) "Normal Stock Request" for regular warehouse stock (where items that are Low Stock at your site automatically appear at the very top of the list with "Site Low" & "Site Avl:" badges alongside "Main:" stock), or (2) "Client Free Stock for Assigned Project Request" which filters and displays ONLY the Major/Main Projects and Individual Projects allocated to your selected Site Branch.',
      },
      {
        stepTitle: '2. HQ Dispatch Approval & Automatic MainStock / FOC Pool Deduction to Site Branch',
        detail:
          'Central HQ reviews the requisition table (displaying full Item Code + Material Description, wrapped Date/Time, and project badges). When approved and confirmed as received at the Site Branch, Normal requests deduct from Central Main Stock and add to Site Branch Stock, while FOC requests deduct from the Central Main FOC Pool and transfer into the Site Branch Yard for Sub-Project or Individual Project usage.',
      },
      {
        stepTitle: '3. Site Branch Stock Item Selection — Forward Traceability Summary & Printable A4 Report',
        detail:
          'In "Site Branch Stock (Site Inventories)", click any item row (or its "Forward Summary" button) to expand the Site Branch Forward Traceability Summary underneath that item. It shows everything that happened to that item at and forward from the selected Site Branch: transfers received from HQ/FOC, quantities issued to each Field Team at that site, quantities used and wasted on site projects, Site Yard In-Hand, and Site Teams In-Hand — with "Print A4 Summary" and "Download PDF" buttons.',
      },
      {
        stepTitle: '4. Daily Issuance to Field Crews (IN) & Site-Separated Team In-Hand Stock ("Stock to Return - [Site Name]")',
        detail:
          'In "Issue to Teams", HQ or Site Supervisors issue consumable materials and returnable tools to a Field Team Leader and print a signable Issue Note (IN) / Gate Pass. In "Team In-Hand Stock", stock held by transferred teams is NEVER combined across sites: any unreturned balance from a previous site is displayed separately in an amber "Stock to Return - [Previous Site Name]" ledger (must be returned to that site and cannot be consumed at the new site), while materials issued at their new site appear separately under "[New Site Name] — Active Site Stock".',
      },
    ],
    keyOutputs: [
      '2-Tab Stock Requisitions: Normal Stock vs. Branch-Exclusive Client FOC',
      'Site Branch Stock Item Selection -> Forward Traceability Summary (Printable A4 / PDF)',
      'Site-Separated Team In-Hand Stock: "Stock to Return - [Old Site]" vs. Active Site Stock (Never Combined)',
      'Printable Numbered Issue Notes (IN), Gate Passes & TSR Audit Reports',
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
        stepTitle: '2. 6-Core + Custom Field Registration & 3-Step Session-Locked Team Daily Progress (Telecom, Water, Electric & Solar)',
        detail:
          'When any Connection/Utility Section (Telecom, Water, Electric, or Solar) is selected: (a) In Project Registration, the form automatically loads that template\'s 6 tailored Core Fields at the top plus all configured International & Custom Fields. (b) In "Material Usage / Daily Progress Entry", it switches to a streamlined 1-2-3 layout: Step 1 (Top) selects Field Team & Working Area and LOCKS them until the page is refreshed ("Confirm & Lock Team / Area") so the team\'s entire day of connections can be entered back-to-back without re-selecting the team; Step 2 lets you search/select a connection or click "+ Register New Connection" right there to fill the 6 Core Fields + Custom Fields on the spot; Step 3 records Material Usage and keeps Step 1 locked after submission.',
      },
      {
        stepTitle: '3. Log Installed Qty + "Wastage Qty", Active-Site-Only Stock Enforcement & Auto Main Pool Deduction',
        detail:
          'In "Material Usage / Daily Progress Entry" and Voucher Edit modals, enter both Installed Quantity (Qty Used) and "Wastage Qty" per item. Teams can ONLY consume materials issued under the project\'s own Site Branch — unreturned stock from a previous site ("Stock to Return - [Previous Site Name]") is automatically excluded and blocked from usage on the new site. Total Deduct (Used + Wastage) is validated live against the team\'s active-site In-Hand balance and auto-deducts from Parent Main Project FOC pools.',
      },
      {
        stepTitle: '4. Usage Vouchers History — "Full Report for This Site (Project)" & Multi-Item Batch Returns (RV / BRM)',
        detail:
          'Open "Usage Vouchers History" and select a project to unlock "Full Report for This Site (Project)" showing: (Part 1) Separate Team-by-Team consumption & Wastage with Team Subtotals, and (Part 2) Full Site Consolidated Grand Total (Print/PDF or Excel CSV). In both "Team Returns" (RV) and "Branch Returns" (BRM), you can add multiple items at once ("+ Add Item" or "+ Add All Held / Available"), set per-item quantities and conditions (Good / Damaged), and return the entire batch together on a single shared Return Voucher.',
      },
    ],
    keyOutputs: [
      'International Section Templates (Telecom FTTH, Water Supply, Electrical Power, Solar PV) + "+ Add Field" Builder',
      '6-Core + Custom Field Registration & 3-Step Daily Progress (Team & Area Locked Until Refresh)',
      'Active-Site-Only Team Stock Usage Enforcement & Multi-Item Batch Returns (RV / BRM)',
      'Full Report for This Site (Project): Team Subtotals + Full Grand Total (PDF/CSV)',
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
        stepTitle: '3. Tab 3 — "3. Digital Signatures" (Draw on Pad or Upload Signature Image)',
        detail:
          'Switch to Tab 3 ("3. Digital Signatures") and click "+ Add Digital Signature". Enter the Signer Full Name (e.g., matching your Prepared By or Approved By name), Designation/Role, and Department. Then either draw the signature directly on the interactive Signature Pad or click "Upload Signature Image" to upload a PNG/JPG signature, and click "Save Signature". Saved signatures automatically match Signers by name on all vouchers — and inside any Voucher Print window ("Customize Voucher Header, Signers & Digital Signatures"), you can also pick any saved Digital Signature from the dropdowns on the fly.',
      },
      {
        stepTitle: '4. Isolated Single-Click A4 Print Preview & Genuine PDF Export Across All Sections',
        detail:
          'Clicking "Print" on any voucher (RN, IN, PU, TSR, GRN, FOC, RV, BRM, PO, RTV) or report (including "Full Report for This Site (Project)", Team In-Hand, Branch Directory, Barcode Labels, and Audit Ledger) immediately opens a clean, isolated A4 print preview of ONLY that voucher or report without printing the full web page. Use the separate "Save PDF" / "Convert to PDF" button whenever you want to download an A4 PDF file directly.',
      },
    ],
    keyOutputs: [
      'Default ISO 9001:2015 Controlled Formats (FORMAT-01 to FORMAT-04) + Auto Tenant Header',
      'Custom PDF/Image Upload, 1-Click Format Unification & Live A4 Column/Title Settings',
      'ISO Signer Governance Matrix (Prepared By, Approved By, Reviewed By + Designations)',
      'Digital Signatures Library (Draw or Upload) + Isolated Single-Click A4 Voucher Print',
    ],
  },
  {
    id: 'ch-06',
    number: 'Chapter 06',
    category: 'admin',
    categoryLabel: 'Machinery, Audits & Backups',
    title: 'Plant & Equipment Fleet, Signer Governance, Audit Trail & Offline Backups',
    summary:
      'Maintain full accountability over high-value machinery assets, ISO document control, user activity logs, and offline data backups.',
    icon: ShieldCheck,
    steps: [
      {
        stepTitle: '1. Dedicated Plant & Machinery Fleet View',
        detail:
          'Track heavy machinery, generators, testing instruments, and power tools separately from consumables - know whether an asset is in the Central Yard, at a Site Branch, or with a Field Crew.',
      },
      {
        stepTitle: '2. Per-Voucher Live Customization (Header, Signers & Digital Signatures)',
        detail:
          'When opening any voucher for printing, click "Customize Voucher Header, Signers & Digital Signatures" at the top of the modal to override Document No, Date, Project Code, Prepared/Approved Signer Names, Designations, or Digital Signatures for that specific print.',
      },
      {
        stepTitle: '3. Admin Password Verification for Any Deletion, Audit Trail & Safe Recycle Bin',
        detail:
          'To prevent accidental or unauthorized data removal, any delete, clear, or purge action across the entire system requires entering the Admin Password before confirmation. Every stock addition, dispatch, edit, or deletion is recorded in "Audit Trail", and deleted records can be restored from the "Recycle Bin".',
      },
      {
        stepTitle: '4. Country-Based Phone Digit Validation & 1-Click Full System Backups',
        detail:
          'All phone number inputs automatically detect the logged-in workspace country (e.g., Sri Lanka 10 local digits / 9 subscriber digits) and enforce exact digit limits. Export a complete offline snapshot of your entire workspace (JSON Backup with built-in Offline Backup Viewer) or download multi-sheet Excel reports anytime.',
      },
    ],
    keyOutputs: [
      'Machinery & Returnable Tool Custody Ledger',
      'Admin Password Protection Required for All Deletions & Country Phone Digit Validation',
      'Tamper-Proof Audit Trail & Protected Recycle Bin',
      '1-Click Full JSON Backup, Offline Viewer & Excel Export',
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
        stepTitle: '1. ඔබේ ආයතනයේ Workspace ගිණුම සහ 0001 සිට ඇරඹෙන නිල අංකන පද්ධතිය',
        detail:
          '"Start 7-Day Free Trial" බටන් එක ක්ලික් කර ඔබේ ආයතනයේ ගිණුම අරඹන්න. පද්ධතියේ සියලුම Item Codes (ITM-0001, MCH-0001), Barcodes (APX-0001), Project IDs (PRJ-2026-0001, MAJ-2026-0001) සහ සියලුම වවුචර් අංක (PO, GRN, RN, DN, IN, PU, RV, BRM) ඉබේම 0001 සිට පිළිවෙළට (Sequential) ජනනය වේ.',
      },
      {
        stepTitle: '2. භාණ්ඩ ලියාපදිංචිය, 200KB ට අඩු Item Image Upload ("Print with Image") සහ Single-Shot Barcode Scanner',
        detail:
          '"Master Registrations -> Item Catalog" හරහා අමුද්‍රව්‍ය (Materials) සහ යන්ත්‍රෝපකරණ (Machinery) ඇතුළත් කරන්න හෝ Excel මගින් Import කරන්න. භාණ්ඩයක් Add/Edit කිරීමේදී අවශ්‍ය නම් භාණ්ඩයේ ඡායාරූපයක් (Item Photo) එක් කළ හැකි අතර පද්ධතිය මගින් එය ස්වයංක්‍රීයව 200KB ට අඩු ප්‍රමාණයකට (Auto-Compress) සකසා ගබඩා කරයි. ඕනෑම වවුචරයක් Print කිරීමේදී "Print with Image" තේරීම මගින් භාණ්ඩයේ රූපය සමඟ හෝ රූපය රහිතව Print කළ හැක. Barcode Scan කිරීමේදී එක වරක් Detect වූ සැණින් Camera එක ඉබේම නතර වන අතර ඊළඟ භාණ්ඩය සඳහා "Scan Now" බටන් එක භාවිත කළ හැක.',
      },
      {
        stepTitle: '3. වැඩ කණ්ඩායම් (Teams) ලියාපදිංචිය, Team Name ආරක්ෂාව සහ Site Transfer ක්‍රියාවලිය (Temporary vs. Permanent with Ref)',
        detail:
          '"Master Registrations -> Teams" තුළදී Team Leader සහ සාමාජිකයින් (Members) ඇතුළත් කරන විට Crew Size එක ඉබේම ගණනය වේ. එක භාණ්ඩයක් හෝ ලබාගෙන ඇති (Stock Issued) Team එකක නම (Team Name) වෙනස් කළ නොහැකි ලෙස Lock වන අතර එමගින් පැරණි වවුචර් සහ ගිණුම් වාර්තා ආරක්ෂා වේ. දැනට Site එකක සිටින Team එකක් වෙනත් Site එකකට මාරු කිරීමේදී ("Transfer / Site History"): පරණ Site එකේ භාර නොදුන් බඩු තිබුණත් නැතත් මුලින්ම අලුත් Site එකේ "Temporary Assigned to - [New Site Name]" ලෙස පෙන්වයි. පරණ Site එකේ බඩු Clear වූ පසු (හෝ බඩු නොගත් Team එකක් නම් Branch/System Admin විසින් Confirm කළ පසු) එය "Permanent" තත්ත්වයට පත් වී කලින් සිටි Site එකේ නම සමඟ "[Team Name] (Ref: [Previous Site Name])" ලෙස සටහන් වේ.',
      },
      {
        stepTitle: '4. නිලධාරීන්ගේ ගිණුම් (Staff Logins), ශාඛා බලතල සහ Auto Email Verification',
        detail:
          '"User Management" යටතේ ප්‍රධාන ගබඩා භාරකරුවන් සහ ප්‍රාදේශීය වැඩබිම් පරීක්ෂකවරුන් (Site Supervisors) සඳහා ගිණුම් සාදන්න (Single Site, Multi-Site හෝ Central HQ). ගිණුම Verify කිරීමේදී "Send Verification Email" ක්ලික් කර ඔබේ Email Inbox එකට ලැබෙන apexstox.com (support@apexstox.com) ලින්ක් එක ක්ලික් කළ සැණින් ගිණුම ස්වයංක්‍රීයව Verify වේ.',
      },
    ],
    keyOutputs: [
      '0001 සිට පිළිවෙළට යන Item Codes සහ Dropdown වල Item Code + Item Name එකට පෙන්වීම',
      '200KB ට අඩුවෙන් Auto-Compress වන Item Image Upload සහ "Print with Image" පහසුකම',
      'Team Site Transfer ("Temporary Assigned" -> Permanent "Ref: Old Site") සහ බඩු ගත් Team Name Lock කිරීම',
      'ශාඛා මට්ටමින් සීමා කළ හැකි ගිණුම් සහ ස්වයංක්‍රීය Email Verification (apexstox.com)',
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
        stepTitle: '4. Client Free Stock (FOC) — Auto-Locked Site Branch, අදාළ Site එකට පමණක් වෙන් වූ FOC Summary සහ Admin නිවැරදි කිරීම',
        detail:
          '"Client Free Stock" හි "+ Log Client Free Stock" තුළ Project එක තේරූ සැණින් "Allocated Site Branch" එක එම Project එකේ ශාඛාවට ස්වයංක්‍රීයව Link වී Lock වේ. එමෙන්ම Client FOC Summary බැලීමේදී එම FOC තොගය අදාළ Assigned Site එකේ විස්තර, එම Site එකේ Teams වලට නිකුත් කිරීම් සහ භාවිතයන් පමණක් වෙනම පැහැදිලිව පෙන්වයි. වැරදි Project එකකට FOC වවුචරයක් වැටී ඇත්නම් Admin හට එය Edit කර නිවැරදි Project එකට මාරු (Reassign) කළ හැක.',
      },
      {
        stepTitle: '5. Central Stock හි Item එකක් Select කළ විට පෙන්වන සම්පූර්ණ Item Lifecycle Summary සහ Printable වාර්තාව',
        detail:
          '"Main Stock Control -> Central Stock Inventory" වගුවේ ඕනෑම භාණ්ඩ පේළියක් මත ක්ලික් කළ විට (හෝ "Summary" බටන් එක එබූ විට) එම පේළියට යටින් සම්පූර්ණ Item Lifecycle & Custody Summary එක විවෘත වේ. එම භාණ්ඩය කවර සැපයුම්කරුවන්ගෙන් PO / GRN හරහා හෝ Manual / FOC මගින් කොපමණ ආවාද, එක් එක් Site Branch එකට බෙදී ගිය ආකාරය, Site වලින් Field Teams වලට බෙදුණු ආකාරය, Teams මගින් Projects වලට Used සහ Wasted ගිය ප්‍රමාණයන්, මෙන්ම Central In-Hand, Site In-Hand සහ Team In-Hand තොග සියල්ල එකම තැනකින් බලා "Print A4 Summary" හෝ "Download PDF" මගින් මුද්‍රණය කරගත හැක.',
      },
    ],
    keyOutputs: [
      'මුද්‍රණය කළ හැකි Purchase Orders (PO) සහ Multi-Item GRN වවුචර්',
      'Return to Vendor (RTV) Debit Notes සහ Outward Gate Pass පත්‍රිකා',
      'Client FOC Auto-Locked Site Branch, අදාළ Site එකට පමණක් වෙන් වූ FOC Summary සහ Admin නිවැරදි කිරීම',
      'Central Stock Item Summary — PO/Manual ලැබීම්, Site/Team බෙදීම්, Used/Wasted සහ Printable A4/PDF',
    ],
  },
  {
    id: 'ch-03',
    number: '03 වන පරිච්ඡේදය',
    category: 'operations',
    categoryLabel: 'ශාඛා හුවමාරු සහ කණ්ඩායම් නිකුත් කිරීම්',
    title: 'ටැබ් 2කින් යුත් ශාඛා බඩු ඉල්ලුම්පත්, Site Branch Item Forward Summary සහ වැඩ කණ්ඩායම් නිකුත් කිරීම් (IN)',
    summary:
      'සාමාන්‍ය තොග (Normal Stock) සහ Client Free Stock (FOC) වෙන වෙනම ටැබ් දෙකකින් ඉල්ලුම් කිරීම, ශාඛා ගබඩාවේ (Site Branch Stock) ඕනෑම භාණ්ඩයක් Select කළ විට ඉදිරියට සිදු වූ බෙදීම් හා භාවිතයන් පෙන්වන Printable Summary ලබාගැනීම.',
    icon: Send,
    steps: [
      {
        stepTitle: '1. Stock Requisition ෆෝම් එකේ ටැබ් 2: Normal Stock Request සහ Client Free Stock for Assigned Project Request',
        detail:
          '"Stock Requisitions -> + New Stock Requirement Form" විවෘත කර පළමුව බඩු ඉල්ලන "Requesting Site Branch *" තෝරන්න. එහි පැහැදිලි ටැබ් 2ක් ඇත: (1) "1. Normal Stock Request" — සාමාන්‍ය ගබඩා තොග ඉල්ලුම් කිරීමට (මෙහිදී එම ශාඛාවේ දැනට Low Stock වී ඇති භාණ්ඩ ලැයිස්තුවේ උඩින්ම "Site Low" ලෙස පෙරී පෙන්වන අතර සෑම භාණ්ඩයකම ප්‍රධාන ගබඩාවේ තොගය "Main:" සහ ශාඛාවේ දැනට ඇති තොගය "Site Avl:" ලෙස එතැනම පෙන්වයි). (2) "2. Client Free Stock for Assigned Project Request" — තෝරාගත් Site Branch එකට අදාළව ලියාපදිංචි කර ඇති Major/Main Projects සහ Individual Projects පමණක් පෙන්වන බැවින් වෙනත් ශාඛාවක Project බඩු පැටලෙන්නේ නැත.',
      },
      {
        stepTitle: '2. ප්‍රධාන ගබඩාවෙන් Approve කිරීම සහ Main Stock / FOC Pool එකෙන් අඩු වී Site Branch එකට ලැබීම',
        detail:
          'Stock Requisitions වගුවේ සෑම ඉල්ලුම්පතකම Item Code එක සමඟ භාණ්ඩයේ සම්පූර්ණ නම (Material Description) සහ Project විස්තර පැහැදිලිව පෙන්වයි. ප්‍රධාන ගබඩාවෙන් Approve කර ශාඛාවෙන් භාරගත් පසු, සාමාන්‍ය තොග Main Stock එකෙන්ද, FOC තොග ප්‍රධාන FOC Pool එකෙන්ද අඩු වී අදාළ Site Branch Stock එකට නිවැරදිව එකතු වේ.',
      },
      {
        stepTitle: '3. Site Branch Stock හි Item එකක් Select කළ විට පෙන්වන Forward Traceability Summary සහ Print පහසුකම',
        detail:
          '"Site Branch Stock (Site Inventories)" තුළ ඕනෑම භාණ්ඩ පේළියක් මත ක්ලික් කළ විට (හෝ "Forward Summary" බටන් එක එබූ විට) එම ශාඛාවට HQ/FOC වලින් ලැබුණු ප්‍රමාණය, එම ශාඛාවෙන් එක් එක් Field Team වලට නිකුත් කළ ප්‍රමාණය, ශාඛාවේ Projects වල Used සහ Wasted වූ ප්‍රමාණයන්, මෙන්ම දැනට පවතින Site Store In-Hand සහ Site Teams In-Hand තොග සාරාංශය එතැනම යටින් දිස්වේ. එයද "Print A4 Summary" හෝ "Download PDF" මගින් මුද්‍රණය කළ හැක.',
      },
      {
        stepTitle: '4. වැඩ කණ්ඩායම් වෙත භාණ්ඩ නිකුත් කිරීම (IN) සහ Site අනුව වෙන් වූ Team In-Hand Stock ("Stock to Return - [Site Name]")',
        detail:
          '"Issue to Teams" කොටසින් අදාළ වැඩ කණ්ඩායමේ නායකයා (Team Leader) වෙත අමුද්‍රව්‍ය සහ ටූල්ස් නිකුත් කර Issue Note (IN) මුද්‍රණය කරගන්න. "Team In-Hand Stock" බැලීමේදී Transfer කරපු Team වල බඩු සියල්ල එකට එකතු කර (Combine කර) පෙන්වන්නේ නැත: කලින් සිටි Site එකට භාර නොදුන් බඩු "Stock to Return - [කලින් Site එකේ නම]" යටතේ වෙනමම පෙන්වන අතර, අලුතින් ගිය Site එකෙන් ගත් බඩු එම අලුත් Site එකේ නම යටතේ ("[Current Site Name] — Active Site Stock") වෙනම පෙන්වයි.',
      },
    ],
    keyOutputs: [
      'Normal Stock සහ Branch-Exclusive Client FOC සඳහා වෙන් වූ Requisition ටැබ් 2',
      'Site Branch Stock Item Selection -> Forward Traceability Summary (Printable A4 / PDF)',
      'Team In-Hand Stock: "Stock to Return - [පරණ Site නම]" සහ අලුත් Site එකේ බඩු එකතු නොකර වෙන වෙනම පෙන්වීම',
      'Material Description සහිත පැහැදිලි Requisition වගුව, IN සහ TSR වාර්තා',
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
        stepTitle: '2. Core Fields 6 + Custom Fields ලියාපදිංචිය සහ පියවර 1, 2, 3 Daily Progress (Team & Area Lock සමඟ)',
        detail:
          'Telecom, Water, Electric හෝ Solar වැනි Connection Section එකක් තෝරාගත් විට: (අ) Project Register කරන තැන එම Section එකට අදාළ ප්‍රධාන කරුණු 6 (Core 6 Fields) සහ ඔබ එකතු කළ International / Custom Fields සියල්ල ස්වයංක්‍රීයව පෙන්වයි. (ආ) Daily Progress ("Material Usage / Daily Progress Entry") පිටුවේදී සරල 1, 2, 3 පියවර පෙන්වයි: පියවර 1 (උඩින්ම): Team & Area Selection — එක වරක් Team එක සහ Area එක තෝරා Confirm කළ පසු Page එක Refresh කරන තුරු එම විස්තර Lock වී පවතී. පියවර 2: Select Connection හෝ එතැනම ඇති "+ Register New Connection" Tab එකෙන් අදාළ Section එකේ Core Fields 6 සහ Custom Fields එවෙලේම ඇතුළත් කර Register කරගැනීමට. පියවර 3: Material Usage ඇතුළත් කර Submit කිරීම.',
      },
      {
        stepTitle: '3. Daily Progress Entry හි "Wastage Qty" සහ අදාළ Site එකේ බඩු පමණක් භාවිතා කිරීමේ නීතිය (Site-Only Stock Usage)',
        detail:
          'Material Usage / Daily Progress Entry හි භාවිතා කළ ප්‍රමාණය (Qty Used) මෙන්ම අපතේ ගිය ප්‍රමාණය ("Wastage Qty") ද ඇතුළත් කළ හැක. Team එකකට යම් Site එකක Project එකකට පාවිච්චි කළ හැක්කේ එම Site එකෙන් නිකුත් කළ බඩු පමණි — කලින් හිටපු Site එකක භාර නොදුන් බඩු ("Stock to Return - [Previous Site Name]") අලුත් Site එකේ වැඩවලට පාවිච්චි කිරීමට ඉඩ නොදෙන අතර ඒවා අදාළ පරණ Site එකටම Return කළ යුතුය.',
      },
      {
        stepTitle: '4. Usage Vouchers History — "Full Report for This Site" සහ භාණ්ඩ ගණනාවක් එකවර ආපසු භාරදීම (Multi-Item Team & Branch Returns)',
        detail:
          '"Usage Vouchers History" හි Project එකක් තේරූ විට "Full Report for This Site (Project)" මගින් Team Subtotals සහ Full Grand Total ලබාගත හැක. ඉතිරි අමුද්‍රව්‍ය හෝ යන්ත්‍රෝපකරණ ආපසු භාරදීමේදී "Team Returns" (RV) සහ "Branch Returns" (BRM) යන ස්ථාන දෙකේදීම එක වරකට එක භාණ්ඩයක් පමණක් නොව, "+ Add Item" හෝ "+ Add All Held / Available" මගින් භාණ්ඩ ගණනාවක් එකවර ලැයිස්තුවට එකතු කර තනි Return Voucher එකකින් එක සැරේ Return කළ හැක.',
      },
    ],
    keyOutputs: [
      'International Section Templates (Telecom, Water, Electric, Solar) + "+ Add Field" Custom Field Builder',
      'Core 6 + Custom Fields Register ආකෘතිය සහ 1-2-3 Daily Progress (Team & Area Lock)',
      'අලුත් Site එකේ වැඩවලට එම Site එකේ බඩු පමණක් භාවිතා කිරීම සහ Multi-Item Team/Branch Returns',
      '"Full Report for This Site (Project)" — Team Subtotals + Full Grand Total (PDF/CSV)',
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
        stepTitle: '3. Tab 3 — "3. Digital Signatures" (ඩිජිටල් අත්සන් ඇඳීම හෝ Image එකක් ලෙස Upload කිරීම)',
        detail:
          '3 වන ටැබ් එක ("3. Digital Signatures") වෙත ගොස් "+ Add Digital Signature" බටන් එක ක්ලික් කරන්න. එහිදී අත්සන් කරන නිලධාරියාගේ නම (Signer Full Name), තනතුර (Designation/Role) සහ අංශය (Department) ඇතුළත් කර, තිරයේ ඇති කොටුව තුළ Mouse/Touch මගින් කෙලින්ම අත්සන අඳින්න (Draw Signature) නැතිනම් අත්සනේ PNG/JPG ඡායාරූපයක් Upload කර "Save Signature" ක්ලික් කරන්න. මෙසේ Save කළ අත්සන්, නිලධාරියාගේ නම අනුව ස්වයංක්‍රීයව වවුචර් වලට වැටෙන අතර ඕනෑම වවුචරයක් Print කරන විට "Customize Voucher Header, Signers & Digital Signatures" කොටසින්ද කැමති Digital Signature එකක් තෝරාගත හැක.',
      },
      {
        stepTitle: '4. සම්පූර්ණ Web Page එක නොව අදාළ Voucher / Report එක පමණක් තනි ක්ලික් එකෙන් Print හා PDF කිරීම',
        detail:
          'ඕනෑම Section එකක (RN, IN, PU, TSR, GRN, FOC, RV, BRM, PO, RTV හෝ Full Site Report) "Print" බටන් එක එබූ සැණින් සම්පූර්ණ වෙබ් පිටුව පෙන්වන්නේ නැතිව, අදාළ A4 වවුචරය හෝ වාර්තාව පමණක් වෙන් කරගත් පැහැදිලි Print Preview එකක් එකවරම විවෘත වේ. PDF ගොනුවක් ලෙස බාගත කිරීමට "Convert / Save as PDF" බටන් එක භාවිත කරන්න.',
      },
    ],
    keyOutputs: [
      'ISO 9001:2015 Controlled Formats (FORMAT-01 සිට 04) + Auto Tenant Header',
      'Tab 2: ආයතනයේ Logo සහ Signers (Prepared / Approved / Reviewed) තනතුරු සැකසුම',
      'Tab 3: Digital Signatures (අත්සන ඇඳීම හෝ Image Upload) සහ Auto Signer Matching',
      'වවුචරය පමණක් එකවර Print වන Isolated Single-Click A4 Print සහ Direct PDF',
    ],
  },
  {
    id: 'ch-06',
    number: '06 වන පරිච්ඡේදය',
    category: 'admin',
    categoryLabel: 'යන්ත්‍රෝපකරණ, විගණන වාර්තා සහ Backups',
    title: 'යන්ත්‍රෝපකරණ කළමනාකරණය, Voucher Print Customization, Audit Trail සහ Offline Backups',
    summary:
      'වටිනා යන්ත්‍රෝපකරණ සහ ටූල්ස් පිළිබඳ පූර්ණ වගවීම, වවුචරයක් Print කරන මොහොතේදීම Signers/Signatures වෙනස් කිරීමේ පහසුව, Audit Trail සහ ආරක්ෂිත Offline දත්ත Backups.',
    icon: ShieldCheck,
    steps: [
      {
        stepTitle: '1. යන්ත්‍රෝපකරණ සහ ටූල්ස් සඳහාම වෙන්වූ Plant & Machinery Fleet කොටස',
        detail:
          'සාමාන්‍ය අමුද්‍රව්‍ය වලින් වෙන්ව එක්ස්කැවේටර්, ජෙනරේටර්, ටෙස්ටින් මීටර් සහ බල මෙවලම් දැනට ප්‍රධාන ගබඩාවේද, ශාඛාවකද, නැතහොත් කවර වැඩ කණ්ඩායමක් ළඟද යන්න ක්ෂණිකව බලාගන්න.',
      },
      {
        stepTitle: '2. වවුචරයක් Print කිරීමට පෙර එතැනදීම Signers සහ Digital Signatures වෙනස් කිරීම',
        detail:
          'ඕනෑම වවුචරයක් Print කිරීමට විවෘත කළ විට උඩින් ඇති "Customize Voucher Header, Signers & Digital Signatures" ක්ලික් කිරීමෙන් එම වවුචරයට පමණක් අදාළව Document No, දිනය, Prepared/Approved නිලධාරීන්ගේ නම්, තනතුරු සහ Digital Signatures එතැනදීම තෝරා Print හෝ PDF කළ හැක.',
      },
      {
        stepTitle: '3. ඕනෑම දත්තයක් Delete කිරීමේදී Admin Password ආරක්ෂාව, Audit Trail සහ Recycle Bin',
        detail:
          'අත්වැරදීමකින් හෝ අනවසරයෙන් දත්ත මැකී යාම වැළැක්වීම සඳහා පද්ධතියේ ඕනෑම දෙයක් Delete කිරීමේදී නිකන්ම Confirm වීම වෙනුවට Admin Password එක ඇතුළත් කිරීම අනිවාර්ය කර ඇත. සිදුවන සෑම ක්‍රියාවක්ම "Audit Trail" හි සටහන් වන අතර මැකුණු දත්ත "Recycle Bin" මගින් නැවත ලබාගත හැක.',
      },
      {
        stepTitle: '4. රටට අදාළ දුරකථන අංක ගණන ස්වයංක්‍රීයව හඳුනාගැනීම සහ 1-Click JSON/Excel Backups',
        detail:
          'ලොග් වී සිටින ආයතනයේ රට අනුව (උදා: ශ්‍රී ලංකාව සඳහා ඉලක්කම් 10 / +94 සමඟ 9) දුරකථන අංක ඇතුළත් කරන සෑම තැනකම නිවැරදි අංක ගණන ස්වයංක්‍රීයව පරීක්ෂා කෙරේ. ඕනෑම මොහොතක සම්පූර්ණ පද්ධතියේම දත්ත Offline JSON Backup ගොනුවක් ලෙස හෝ Multi-Sheet Excel වාර්තාවක් ලෙස බාගත කරගත හැක.',
      },
    ],
    keyOutputs: [
      'යන්ත්‍රෝපකරණ සහ ටූල්ස් භාරකාරත්ව ලෙජරය (Machinery Custody)',
      'Delete කිරීමේදී Admin Password අනිවාර්ය කිරීම සහ රට අනුව Phone Number Validation',
      'සම්පූර්ණ Audit Trail වාර්තා සහ ආරක්ෂිත Recycle Bin',
      '1-Click JSON Backup, Offline Viewer සහ Excel Export පහසුකම',
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
    group: 'Warehouse, Procurement & End-to-End Item Traceability',
    items: [
      'Central Stock Item Selection -> Full End-to-End Lifecycle Summary (PO/Manual/FOC Inbound, Site & Team Distribution, Used/Wasted, Central/Site/Team In-Hand + Printable A4/PDF)',
      'Site Branch Stock Item Selection -> Forward Traceability Summary (HQ Transfers, Site Team Issues, Project Used/Wasted, Site & Team In-Hand + Printable A4/PDF)',
      'Sequential 0001-Based Codes, IDs & Voucher References (ITM-0001, PO-2026-0001, RN-2026-0001)',
      'Central HQ Warehouse + Unlimited Regional Site Yards',
      'Single-Shot Camera & USB Gun Barcode Scanner with Auto-Hide & "Scan Now" Button',
      'Supplier Purchase Orders (PO) & Multi-Item Atomic GRN Vouchers',
      'Return to Vendor (RTV) Official Debit Notes & Outward Gate Passes',
      'Client Free Stock (FOC) Auto-Locked Site Branch, Assigned-Site Isolated FOC Summary & Admin Voucher Correction',
      'Optional Item Image Upload (Auto-Compressed <200KB) & "Print with Image" Option on Vouchers/Reports',
      'Excel / CSV Bulk Import, Multi-Sheet Export & Low-Stock Alerts',
    ],
  },
  {
    group: 'Field Operations, International Section Templates (Telecom/Water/Electric/Solar) & Batch Returns',
    items: [
      'International Industry Section Templates: 1-Click Auto-Load for Telecom New Connection (ITU-T G.984), Water Supply Project (ISO 4064 / AWWA), Electrical Power Project (IEC 60364), Solar PV & Net-Metering (IEC 62446) & Standard EPC Project',
      '"+ Add Field" Dynamic Custom Field Builder: Customize 6 Core Field Labels & Add Unlimited Custom Technical Fields per Section (or Inline During Project Registration)',
      'Field Team Site Transfer Workflow: "Temporary Assigned to - [New Site]" -> Permanent "[Team Name] (Ref: [Previous Site])" & Complete Assigned Sites History',
      'Site-Separated Team In-Hand Stock: Unreturned Old-Site Stock Shown Separately Under "Stock to Return - [Site Name]" (Never Combined with New Site Stock)',
      'Strict Active-Site Material Usage: Teams Can Only Consume Stock Issued at the Current Site for Current Site Projects',
      'Team Name Integrity Lock: Teams That Have Received Any Stock Cannot Be Renamed, Protecting Historical Voucher & In-Hand Audit Accuracy',
      'Multi-Item Batch Returns in Both Team Returns (RV) & Branch Returns (BRM) ("+ Add Item" / "+ Add All Held or Available" on One Voucher)',
      '3-Step Connection Daily Progress (Telecom, Water, Electric, Solar): Step 1 Team & Area (Locked Until Refresh) -> Step 2 Search or "+ Register New Connection" -> Step 3 Material Usage',
      '2-Tab Stock Requisitions (RN): Normal Stock vs. Branch-Exclusive Client FOC Request with Two-Line Item Code + Material Name Dropdowns',
      'Auto Low-Stock Priority Top Sorting & Live "Site Avl:" + "Main:" Balances in Requisitions',
      'Installed Qty + Wastage Qty Tracking with Live (Used + Wastage) Team In-Hand Validation',
      'Usage Vouchers History -> "Full Report for This Site (Project)" (Team Subtotals + Grand Total)',
    ],
  },
  {
    group: 'ISO 9001:2015 Format Settings, Signers, Digital Signatures & Enterprise Control',
    items: [
      'Default ISO 9001:2015 Controlled Formats (FORMAT-01 to 04) with Auto-Synced Tenant Company Header',
      'Tab 2 Signer Governance: Prepared By, Approved By & Reviewed By Names, Designations & Departments',
      'Tab 3 Digital Signatures Library: Draw on Interactive Pad or Upload PNG/JPG Signature + Auto-Match',
      'Optional PDF / Image Company Format Upload (Max 1MB Limit) + Live A4 Format Studio',
      'Isolated Single-Click A4 Print Preview (Prints Only the Voucher/Report) + Genuine A4 PDF Download',
      'Admin Password Verification Required for All Deletions & Country-Aware Phone Digit Validation',
      'Tamper-Proof Audit Trail, Safe Recycle Bin & 1-Click JSON Backup',
    ],
  },
];

const FEATURE_SUMMARY_LIST_SI: FeatureSummaryGroup[] = [
  {
    group: 'ගබඩා කළමනාකරණය, ප්‍රසම්පාදනය සහ Item Lifecycle Summary',
    items: [
      'Central Stock Item Summary: ඕනෑම Item එකක් Select කළ විට PO/Manual/FOC ලැබීම්, Site හා Team බෙදීම්, Used/Wasted සහ Central/Site/Team In-Hand පෙන්වන Printable A4/PDF සාරාංශය',
      'Site Branch Stock Forward Summary: ශාඛා ගබඩාවේ Item එකක් Select කළ විට HQ ලැබීම්, ශාඛාවේ Teams වලට නිකුත් කිරීම්, Used/Wasted සහ In-Hand පෙන්වන Printable A4/PDF සාරාංශය',
      '0001 සිට පිළිවෙළට ජනනය වන Item Codes, Project IDs සහ PO/Site Request Dropdown වල Item Code එක යටින් Item Name පැහැදිලිව පෙන්වීම',
      'ප්‍රධාන ගබඩාව (Central HQ) සහ සීමාවකින් තොර ප්‍රාදේශීය ශාඛා ගබඩා (Site Yards)',
      'Detect වූ සැණින් නතර වී Camera ඉවත් වන Single-Shot Scanner සහ "Scan Now" බටන් එක',
      'නිල Purchase Orders (PO) සහ Multi-Item GRN ප්‍රධාන ගබඩාවට එකවර භාරගැනීම',
      'සැපයුම්කරු වෙත ආපසු යැවීමේ (RTV) Debit Notes සහ Outward Gate Pass',
      'Client FOC Auto-Locked Site Branch, අදාළ Site එකට පමණක් වෙන් වූ FOC Summary සහ Admin නිවැරදි කිරීමේ පහසුකම',
      '200KB ට අඩුවෙන් Auto-Compress වන Item Image Upload සහ වවුචර් Print කිරීමේදී "Print with Image" තේරීම',
      'Excel / CSV Bulk Import, Multi-Sheet Export සහ අවම තොග අනතුරු ඇඟවීම්',
    ],
  },
  {
    group: 'වැඩබිම් මෙහෙයුම්, International Templates (Telecom/Water/Electric/Solar), Team Transfers සහ Multi-Item Returns',
    items: [
      'International Industry Section Templates: Telecom New Connection (ITU-T G.984), Water Supply Project (ISO 4064), Electrical Power Project (IEC 60364), Solar PV Project (IEC 62446) සහ Standard EPC සඳහා සූදානම් කළ ජාත්‍යන්තර Templates',
      '"+ Add Field" Custom Field Builder: Section එකක් සෑදීමේදී හෝ Edit කිරීමේදී Core Fields 6 වෙනස් කිරීමට සහ අලුත් Custom Fields කැමති ගණනක් එකතු කිරීමට ඇති පහසුකම',
      'Team Site Transfer ක්‍රියාවලිය: "Temporary Assigned to - [New Site]" -> බඩු Clear වූ පසු Permanent "[Team Name] (Ref: [Previous Site])" සහ සම්පූර්ණ Assigned Sites History',
      'Site අනුව වෙන් වූ Team In-Hand Stock: කලින් Site එකේ භාර නොදුන් බඩු "Stock to Return - [Site Name]" යටතේත්, අලුත් Site එකේ බඩු අලුත් Site නම යටතේත් එකතු නොකර වෙන වෙනම පෙන්වීම',
      'අලුත් Site එකේ වැඩවලට එම Site එකෙන් නිකුත් කළ බඩු පමණක් භාවිතා කිරීමට ඉඩ දීම සහ බඩු ලබාගෙන ඇති Team වල නම (Team Name) වෙනස් කළ නොහැකි ලෙස ආරක්ෂා කිරීම',
      'Team Returns (RV) සහ Branch Returns (BRM) දෙකේම Items ගණනාවක් එකතු කර ("+ Add Item" / "+ Add All") එක සැරේ තනි වවුචරයකින් Return කිරීමේ පහසුකම',
      'Connection Sections (Telecom, Water, Electric, Solar) 1-2-3 Daily Progress: පියවර 1 Team & Area (Refresh කරන තුරු Lock වේ) -> පියවර 2 Select හෝ "+ Register New Connection" -> පියවර 3 Material Usage',
      'ටැබ් 2කින් යුත් ශාඛා බඩු ඉල්ලුම්පත් (Normal Stock සහ Branch-Exclusive Client FOC Request)',
      'Material Usage / Daily Progress Entry හි Installed Qty සමඟ Wastage Qty (අපතේ යාම්) සටහන් කිරීම',
      'Usage History හි "Full Report for This Site (Project)" (Team Subtotals + Full Grand Total + PDF/CSV)',
    ],
  },
  {
    group: 'ISO 9001:2015 Format Settings, Signers, Digital Signatures සහ ආරක්ෂිත පාලනය',
    items: [
      'Default ISO 9001:2015 Controlled Formats (FORMAT-01 සිට 04) සහ ස්වයංක්‍රීය Tenant Company Header',
      'Tab 2 Signer Governance: Prepared By, Approved By සහ Reviewed By නිලධාරීන්ගේ නම්, තනතුරු සහ අංශ',
      'Tab 3 Digital Signatures: තිරය මත අත්සන ඇඳීම (Draw) හෝ Image Upload කිරීම සහ වවුචර් වලට Auto-Match වීම',
      'PDF හෝ Image මගින් ආයතනයේ Format එක Upload කිරීම (උපරිම 1MB) සහ Live A4 Format Studio සැකසුම්',
      'සම්පූර්ණ වෙබ් පිටුව නොව අදාළ Voucher/Report එක පමණක් එකවර Print කරන Isolated A4 Print හා PDF',
      'ඕනෑම දෙයක් Delete කිරීමේදී Admin Password අනිවාර්ය වීම සහ රට අනුව Phone Number අංක ගණන පරීක්ෂාව',
      'Audit Trail විගණන වාර්තා, Recycle Bin සහ 1-Click JSON Offline Backup',
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
      'Stage 01: Master & Crew Setup - Register items, site yards, suppliers, clients & field teams (auto crew size: 1 Leader + N Members).',
      'Stage 02: PO, GRN & RTV - Issue Supplier Purchase Orders (PO), print batch GRN vouchers, log Client Free Stock (FOC) & RTV Debit Notes.',
      'Stage 03: Branch Transfer - Site branches submit Stock Requisitions (RN); Central HQ checks stock & dispatches to regional yards.',
      'Stage 04: Field Crew Issue - Issue materials & tools to Crew Leaders (IN / Gate Pass) with live in-hand custody tracking.',
      'Stage 05: Daily Progress, Wastage & Full Reports - Log project Installed + Wastage Qty (PU) in Material Usage / Daily Progress Entry, print Full Site Reports (Team + Grand Totals), & return surplus (RV / BRM).',
      'Stage 06: Company Formats - Upload PDF or Image company forms into 4 Format Slots so all sections print in your official layout.',
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
      'පියවර 01 (Master Setup): භාණ්ඩ, යන්ත්‍රෝපකරණ, ශාඛා ගබඩා, සැපයුම්කරුවන් සහ වැඩ කණ්ඩායම් (Auto Crew Size සමඟ) ලියාපදිංචි කිරීම.',
      'පියවර 02 (PO, GRN & RTV): සැපයුම්කරු PO නිකුත් කිරීම, GRN මුද්‍රණය, Client Free Stock (FOC) සහ RTV Debit Notes සටහන් කිරීම.',
      'පියවර 03 (Branch Transfer): ශාඛා මගින් බඩු ඉල්ලුම්පත් (RN) යොමු කිරීම සහ ප්‍රධාන ගබඩාවෙන් අනුමත කර ශාඛා වෙත යැවීම.',
      'පියවර 04 (Field Crew Issue): වැඩ කණ්ඩායම් නායකයින් වෙත එදිනෙදා භාණ්ඩ හා ටූල්ස් නිකුත් කිරීම (IN / Gate Pass) සහ In-Hand තොග පරීක්ෂාව.',
      'පියවර 05 (Daily Progress, Wastage & Returns): Material Usage / Daily Progress Entry හරහා භාවිතය සහ Wastage Qty සටහන් කිරීම, Full Site (Project) වාර්තා සහ ආපසු භාරදීම් (RV / BRM).',
      'පියවර 06 (Company Formats): ආයතනයේ PDF හෝ Image ආකෘති පත්‍ර Upload කර සියලුම වවුචර් එම Format එකෙන්ම මුද්‍රණය කරගැනීම.',
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
              className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#253050] hover:bg-[#2d3a5e] text-white border border-[#dc9750]/40 text-xs font-extrabold flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer transition whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4 text-[#dc9750]" />
              <span>{guideLang === 'si' ? 'ප්‍රධාන පිටුවට (Overview)' : 'Back to Platform Overview'}</span>
            </button>

            {/* 2-TAB LANGUAGE SWITCHER: ENGLISH GUIDE vs SINHALA GUIDE */}
            <div className="bg-[#161d33] p-1 rounded-xl border border-[#dc9750]/50 flex items-center gap-1 shadow-md">
              <button
                type="button"
                onClick={() => setGuideLang('en')}
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  guideLang === 'en'
                    ? 'bg-[#dc9750] text-[#1e2640] shadow-xs'
                    : 'text-slate-200 hover:text-white hover:bg-white/5'
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
                    ? 'bg-[#dc9750] text-[#1e2640] shadow-xs'
                    : 'text-slate-200 hover:text-white hover:bg-white/5'
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
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#dc9750] hover:bg-[#e7a662] text-[#1e2640] font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-[#dc9750]/20 cursor-pointer transition whitespace-nowrap disabled:opacity-60"
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
              className="w-full sm:w-auto px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#161d33] hover:bg-[#222c4a] text-white border border-[#dc9750]/40 font-bold text-xs flex items-center justify-center gap-1.5 sm:gap-2 shadow-md cursor-pointer transition whitespace-nowrap"
            >
              <span className="text-[#e5a460] font-black">
                {guideLang === 'si' ? 'දින 7ක නොමිලේ ගිණුම අරඹන්න' : 'Start 7-Day Free Trial'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#dc9750]" />
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
          <div className="rounded-2xl sm:rounded-[28px] bg-[#faf4ec] border border-[#dc9750]/60 shadow-[0_20px_50px_-15px_rgba(8,12,24,0.45)] p-4 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#1e2640] via-[#dc9750] to-[#1e2640] no-print" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#9e5c19] mb-2">
                  <BookOpen className="w-4 h-4 text-[#b56b21]" />
                  <span>
                    {guideLang === 'si'
                      ? 'සම්පූර්ණ පද්ධති ක්‍රියාවලිය පැහැදිලි කරන සරල සිංහල අත්පොත'
                      : 'Complete System Documentation & Client Handbook'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-[#1e2640] tracking-tight leading-tight text-balance">
                  {guideLang === 'si'
                    ? 'Apex Stock ක්‍රියාත්මක වන ආකාරය: පියවරෙන් පියවර සරල සිංහල උපදෙස් මාලාව'
                    : 'How Apex Stock Works: Step-by-Step User Guide, Document Format Studio & Features'}
                </h1>
                <p className="text-xs sm:text-sm text-[#2d3859] mt-3 leading-relaxed font-medium">
                  {guideLang === 'si'
                    ? 'ඔබේ ප්‍රධාන ගබඩාව (Central Warehouse), ප්‍රාදේශීය ශාඛා ගබඩා (Site Branches), වැඩ කණ්ඩායම් (Field Teams), සේවාදායකයින් නොමිලේ සපයන තොග (Client FOC), යන්ත්‍රෝපකරණ සහ ඔබේ ආයතනයේ PDF/Image Document Formats පද්ධතියට ඇතුළත් කර මුද්‍රණය කරගන්නා ආකාරය මෙහි සරල සිංහලෙන් විස්තර කර ඇත.'
                    : 'Everything you need to understand how materials, client-supplied stock, heavy machinery, daily crew dispatches, and custom PDF/Image company document formats work across your headquarters, regional site yards, and active projects. Read online below or save this handbook as an A4 PDF.'}
                </p>
              </div>

              {/* Quick PDF & Language Switch Box */}
              <div className="no-print shrink-0 bg-[#1e2640] text-white rounded-2xl p-5 border border-[#dc9750]/50 lg:w-80 shadow-xl">
                <div className="text-xs font-bold text-[#e5a460]">
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
                  className="mt-3.5 w-full py-2.5 px-4 rounded-xl bg-[#dc9750] hover:bg-[#e7a662] text-[#1e2640] font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition whitespace-nowrap disabled:opacity-60"
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
            <div className="mt-8 pt-7 border-t border-[#dc9750]/35">
              <div className="text-xs font-extrabold text-[#1e2640] mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#b56b21]" />
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
                        title: 'PO, GRN සහ RTV',
                        desc: 'සැපයුම්කරු PO නිකුත් කිරීම, GRN මුද්‍රණය, Client FOC සහ RTV හර සටහන්.',
                        icon: ShoppingCart,
                      },
                      {
                        stage: 'පියවර 03',
                        title: 'ශාඛා තොග හුවමාරුව',
                        desc: 'ශාඛා මගින් බඩු ඉල්ලුම් කිරීම (RN) සහ ප්‍රධාන ගබඩාවෙන් ශාඛා වෙත යැවීම.',
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
                        title: 'Daily Progress, Wastage සහ Reports',
                        desc: 'භාවිතය හා Wastage Qty සටහන් කිරීම (PU), Full Site වාර්තා සහ ආපසු භාරදීම (RV / BRM).',
                        icon: RotateCcw,
                      },
                      {
                        stage: 'පියවර 06',
                        title: 'ISO Formats සහ Signatures',
                        desc: 'ISO 9001:2015 Formats, Auto Tenant Header, Signers හා Digital Signatures සැකසීම.',
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
                        title: 'PO, GRN & RTV',
                        desc: 'Issue Supplier POs, print batch GRNs, log Client FOC & Debit Notes.',
                        icon: ShoppingCart,
                      },
                      {
                        stage: 'Stage 03',
                        title: 'Branch Transfer',
                        desc: 'Site branches request stock (RN); Central HQ approves & dispatches.',
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
                        title: 'Daily Progress, Wastage & Reports',
                        desc: 'Log usage & Wastage Qty (PU), run Full Site Reports, and return surplus (RV / BRM).',
                        icon: RotateCcw,
                      },
                      {
                        stage: 'Stage 06',
                        title: 'ISO Formats & Signatures',
                        desc: 'ISO 9001:2015 formats, Auto Tenant Header, Signers, Digital Signatures & PDF/Image upload.',
                        icon: Upload,
                      },
                    ]
                ).map((item) => {
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
                placeholder={
                  guideLang === 'si'
                    ? 'උපදෙස් සොයන්න (උදා: Format, GRN, Team)...'
                    : 'Search guide (e.g. Format, GRN, Team, RTV)...'
                }
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* ==================== STEP-BY-STEP CHAPTERS ==================== */}
          <div className="space-y-6">
            {filteredChapters.length === 0 ? (
              <div className="rounded-2xl bg-white/85 border border-slate-200 p-10 text-center">
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
                  className="mt-3 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
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
                        <span>
                          {guideLang === 'si' ? 'ප්‍රධාන ප්‍රතිඵල සහ පාලනයන්:' : 'Key Outputs & Controls:'}
                        </span>
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

          {/* ==================== DEDICATED COMPANY FORMAT UPLOAD & AFFECTED SECTIONS GUIDE ==================== */}
          <div className="rounded-[24px] bg-[#fdfaf5] border border-[#dc9750]/55 p-6 sm:p-8 shadow-md break-inside-avoid">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#dc9750]/30">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#9e5c19] mb-1.5">
                  <Award className="w-4 h-4 text-[#b56b21]" />
                  <span>
                    {guideLang === 'si'
                      ? 'ආයතනයේ Document Formats (PDF / Image) Upload කරන ආකාරය පිළිබඳ විශේෂ මාර්ගෝපදේශය'
                      : 'Standard Document Format Reference Guide (PDF / Image Upload)'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#1e2640] tracking-tight">
                  {guideLang === 'si'
                    ? 'Company Format Upload කිරීම සහ "This Format Affects To" ක්‍රියාත්මක වන ආකාරය'
                    : 'How Company Document Format Upload & "This Format Affects To" Works'}
                </h2>
                <p className="text-xs sm:text-sm text-[#2d3859] mt-1 font-medium max-w-4xl">
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
              <div className="shrink-0 bg-[#1e2640] text-[#dc9750] px-4 py-2.5 rounded-xl text-xs font-extrabold border border-[#dc9750]/40">
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
                  className="rounded-2xl bg-white border border-[#dc9750]/35 p-4 flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#1e2640] text-[#dc9750] font-mono text-[11px] font-black">
                        {slot.code}
                      </span>
                      <span className="text-[11px] font-bold text-[#9e5c19]">
                        {guideLang === 'si' ? 'PDF / Image Upload කාණ්ඩය' : 'PDF / Image Upload Slot'}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-[#1e2640]">{slot.title}</h3>
                    <p className="text-[11px] text-[#475577] mt-1 font-medium">
                      {slot.structure}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-200/80">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#9e5c19] mb-1.5">
                      {guideLang === 'si'
                        ? 'මෙම Format එක බලපාන Sections (This Format Affects To):'
                        : 'This Format Affects To (Printed Sections):'}
                    </div>
                    <div className="space-y-1">
                      {slot.affectsTo.map((sec) => (
                        <div key={sec} className="flex items-start gap-1.5 text-xs text-[#1e2640] font-semibold">
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
            <div className="mt-5 pt-4 border-t border-[#dc9750]/25 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-white/90 border border-[#dc9750]/25 p-3.5">
                <div className="font-extrabold text-[#1e2640]">
                  {guideLang === 'si'
                    ? 'ක්‍රමය A: Extracted Header Banner + System Table'
                    : 'Mode A: Extracted Header Banner + System Table'}
                </div>
                <p className="text-[11px] text-[#334063] mt-1 leading-relaxed">
                  {guideLang === 'si'
                    ? 'ඔබ Upload කළ PDF/Image එකේ උඩ Letterhead/Header කොටස (10%–45% දක්වා උස සීරුමාරු කළ හැක) ලබාගෙන, ඊට යටින් පද්ධතියේ පැහැදිලි වගුව සහ අත්සන් තීරු 3 මුද්‍රණය කරයි.'
                    : 'Crops your uploaded PDF/Image letterhead banner at the top (adjustable 10%–45% crop height) and renders a crisp, brand-colored system table and 3-column signature block below.'}
                </p>
              </div>
              <div className="rounded-xl bg-white/90 border border-[#dc9750]/25 p-3.5">
                <div className="font-extrabold text-[#1e2640]">
                  {guideLang === 'si'
                    ? 'ක්‍රමය B: Full Uploaded Form Background Watermark'
                    : 'Mode B: Full Uploaded Form Background Watermark'}
                </div>
                <p className="text-[11px] text-[#334063] mt-1 leading-relaxed">
                  {guideLang === 'si'
                    ? 'ඔබ Upload කළ සම්පූර්ණ A4 පත්‍රිකාව පසුබිම් ලිපි ශීර්ෂය (Background Stationery) ලෙස තබාගෙන ඒ මත පද්ධතියේ දත්ත සහ වගුව පැහැදිලිව මුද්‍රණය කරයි.'
                    : 'Uses your entire uploaded A4 page as the background stationery/watermark and overlays live system data, tables, and signature blocks cleanly on top.'}
                </p>
              </div>
              <div className="rounded-xl bg-white/90 border border-[#dc9750]/25 p-3.5">
                <div className="font-extrabold text-[#1e2640]">
                  {guideLang === 'si'
                    ? 'ක්‍රමය C: Smart Reconstructed Digital Grid'
                    : 'Mode C: Smart Reconstructed Digital Grid'}
                </div>
                <p className="text-[11px] text-[#334063] mt-1 leading-relaxed">
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
            <div className="lg:col-span-7 rounded-[24px] bg-[#fdfaf5] border border-[#dc9750]/45 p-6 sm:p-8 shadow-md">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#9e5c19] mb-2">
                <FileSpreadsheet className="w-4 h-4 text-[#b56b21]" />
                <span>
                  {guideLang === 'si'
                    ? 'සම්පූර්ණ පද්ධති විශේෂාංග ලැයිස්තුව'
                    : 'Complete Module & Feature Checklist'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1e2640] tracking-tight">
                {guideLang === 'si'
                  ? 'සෑම ආයතන ගිණුමකටම ඇතුළත් සියලුම පහසුකම්'
                  : 'Everything Included in Every Workspace'}
              </h2>
              <p className="text-xs text-[#475577] mt-1 font-medium">
                {guideLang === 'si'
                  ? 'දින 7ක නොමිලේ කාලසීමාව (Free Trial) තුළ මෙන්ම Pro Monthly සහ Pro Annual සැලසුම් යටතේද පහත සියලුම පහසුකම් සම්පූර්ණයෙන්ම විවෘතය.'
                  : 'All modules below are unlocked during your 7-Day Free Trial as well as Pro Monthly and Pro Annual plans.'}
              </p>

              <div className="mt-5 space-y-5">
                {activeFeatureList.map((sec) => (
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
                  <span>
                    {guideLang === 'si' ? 'නිලධාරී බලතල සහ ආරක්ෂාව' : 'Staff Access Control Guide'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#1e2640] tracking-tight">
                  {guideLang === 'si' ? 'නිලධාරී ගිණුම් ක්‍රියාත්මක වන ආකාරය' : 'How Staff Roles Work'}
                </h2>
                <p className="text-xs text-[#475577] mt-1 font-medium">
                  {guideLang === 'si'
                    ? 'ප්‍රධාන කාර්යාලයේ කළමනාකරුවන්ට සහ ප්‍රාදේශීය වැඩබිම් ගබඩා භාරකරුවන්ට වෙන් වෙන් වශයෙන් බලතල ලබාදිය හැක.'
                    : 'Assign tailored access to headquarters executives and regional site storekeepers.'}
                </p>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-white border border-[#dc9750]/30 p-4">
                    <div className="flex items-center gap-2 text-xs font-black text-[#1e2640]">
                      <UserCheck className="w-4 h-4 text-[#b56b21]" />
                      <span>
                        {guideLang === 'si'
                          ? 'ප්‍රධාන කාර්යාල පරිපාලක (Central HQ Admin / Store Manager)'
                          : 'Central HQ Administrator / Store Manager'}
                      </span>
                    </div>
                    <p className="text-xs text-[#334063] mt-1.5 leading-relaxed font-medium">
                      {guideLang === 'si'
                        ? 'ප්‍රධාන ගබඩාව, Client Free Stock, සැපයුම්කරු ඇණවුම් (PO/GRN/RTV), Master Registrations, Document Format Studio, සියලුම ශාඛා ගබඩා, Audit Trail සහ System Backups පිළිබඳ පූර්ණ බලතල හිමිවේ.'
                        : 'Full visibility across Central Warehouse, Client-Supplied Free Stock, Supplier Purchase Orders (PO/GRN/RTV), Master Registrations, Document Format Studio, all Regional Site Yards, Audit Trails, and System Backups.'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white border border-[#dc9750]/30 p-4">
                    <div className="flex items-center gap-2 text-xs font-black text-[#1e2640]">
                      <Truck className="w-4 h-4 text-[#1e2640]" />
                      <span>
                        {guideLang === 'si'
                          ? 'ශාඛා වැඩබිම් පරීක්ෂක / ගබඩා භාරකරු (Site Branch Supervisor)'
                          : 'Site Branch Supervisor / Yard Storekeeper'}
                      </span>
                    </div>
                    <p className="text-xs text-[#334063] mt-1.5 leading-relaxed font-medium">
                      {guideLang === 'si'
                        ? 'තමන්ට අනුයුක්ත කළ එක් ශාඛාවකට (Single Site) හෝ ශාඛා කිහිපයකට (Multi-Site) පමණක් ප්‍රවේශය සීමා කළ හැක. බඩු ඉල්ලුම්පත් (RN) යොමු කිරීම, ශාඛා තොග පාලනය, වැඩ කණ්ඩායම් වෙත බඩු නිකුත් කිරීම (IN) සහ ව්‍යාපෘති භාවිතයන් (PU) හා Returns (RV/BRM) සටහන් කළ හැක.'
                        : 'Can be locked to a Single Site Branch or assigned to Multiple Specific Site Branches. Can submit Stock Requisitions (RN) to HQ, manage their assigned Site Yard stock, issue items to Field Crews (IN), and log Project Material Usage (PU) & Returns (RV/BRM).'}
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
                    <span>
                      {guideLang === 'si' ? 'දින 7ක නොමිලේ ගිණුම අරඹන්න' : 'Start 7-Day Free Trial'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-[#1e2640] border border-[#1e2640]/30 font-bold text-xs cursor-pointer transition whitespace-nowrap"
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
