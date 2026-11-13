import React, { useState } from 'react';
import jsPDF from 'jspdf';
import {
  ArrowLeft,
  Printer,
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
  Sparkles,
} from 'lucide-react';

interface SystemUserGuideViewProps {
  onBackToOverview: () => void;
  onOpenSignup: () => void;
  onOpenLogin: () => void;
}

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

const GUIDE_CHAPTERS: GuideChapter[] = [
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
        stepTitle: '3. Register Field Teams with Auto-Calculated Crew Size & Usage Protection',
        detail:
          'In "Master Registrations → Teams", enter the Team Leader name (Crew Size automatically starts at 1). Each time you add a Team Member with their NIC/ID number, Crew Size automatically increments (1 Leader + N Members). Duplicate team names are blocked across active and Recycle Bin teams—and if a deleted team name is entered, you can restore and update the existing team in 1 click so past Material Usage history stays 100% unified.',
      },
      {
        stepTitle: '4. Create Staff Logins (Single Site, Multi-Site, or Central HQ)',
        detail:
          'Under "User Management", create accounts for HQ Storekeepers and Site Supervisors. You can assign a user to All Sites (Central HQ), a Single Site Branch, or Multiple Specific Site Branches, and view all branch staff and crew rosters in the "Branch Directory".',
      },
    ],
    keyOutputs: [
      'Master Material & Machinery Catalog + Excel Import',
      'Auto-Calculated Crew Size (1 Leader + N Members)',
      'Unique Team Name & Historical Usage Ledger Protection',
      'Single-Site & Multi-Site Branch Supervisor Locks',
    ],
  },
  {
    id: 'ch-02',
    number: 'Chapter 02',
    category: 'warehouse',
    categoryLabel: 'Warehouse, PO / GRN & RTV',
    title: 'Central Warehouse, Supplier Orders (PO / GRN), Vendor Returns (RTV) & Client Free Stock',
    summary:
      'Manage company-purchased stock, partial/full Goods Receipt Notes (GRN), supplier returns with official Debit Notes (RTV), damaged stock restoration, and client-supplied free materials.',
    icon: Gift,
    steps: [
      {
        stepTitle: '1. Issue Official Supplier Purchase Orders (PO)',
        detail:
          'In "Supplier Orders (PO)", generate numbered Purchase Orders for your approved vendors with commercial terms, tax/discount calculations, and 3-signature approval blocks, and print official A4 PO documents.',
      },
      {
        stepTitle: '2. Receive Stock into Central Warehouse & Print GRN Vouchers',
        detail:
          'Record full or partial Goods Received Notes (GRN) from Supplier POs or direct warehouse entries. Every inbound delivery batch has a dedicated "Print GRN" button in both Supplier Orders and Main Stock Inbound History.',
      },
      {
        stepTitle: '3. Return to Vendor (RTV), Official Debit Notes & Damaged Stock Restoration',
        detail:
          'For defective or excess vendor deliveries, create an official Return to Vendor (RTV) / Debit Note with outward Gate Pass and credit claim tracking. For site-damaged items, inspect and restore repaired units back into Main Stock via the Damaged Stock ledger.',
      },
      {
        stepTitle: '4. Record Client-Supplied Free Materials (FOC) Separately',
        detail:
          'When a project client provides materials free of charge, open "Client Free Stock" and log their receipt (FOC). These items stay at zero purchase cost while remaining fully traceable per client and project.',
      },
    ],
    keyOutputs: [
      'Printable Purchase Orders (PO) & Batch GRN Vouchers',
      'Return to Vendor (RTV) Debit Notes & Outward Gate Passes',
      'Client Free-Issue (FOC) Ledger & Damaged Stock Restoration',
    ],
  },
  {
    id: 'ch-03',
    number: 'Chapter 03',
    category: 'operations',
    categoryLabel: 'Site Transfers & Field Dispatch',
    title: 'Site Stock Requisitions (RN), HQ Dispatches & Crew Issuance (IN)',
    summary:
      'Control every movement of stock from Central Headquarters to Regional Site Yards, and from Site Yards into the hands of Field Teams.',
    icon: Send,
    steps: [
      {
        stepTitle: '1. Digital Stock Requisitions (RN) with Available Stock Filter',
        detail:
          'Site Supervisors submit a Stock Requisition Note (RN) from their assigned Site Branch to Central HQ. Use the 1-click "Available Stock Only" filter to view only items currently in stock at the Central Warehouse.',
      },
      {
        stepTitle: '2. Smart Shortage Check & HQ Dispatch Approval',
        detail:
          'Central HQ reviews the request against live warehouse stock. If any item is short, HQ can click "Send Available Only" or remove out-of-stock lines in 1 click, generating an official Transfer & Dispatch Note.',
      },
      {
        stepTitle: '3. Daily Issuance to Field Crews (IN / Gate Pass)',
        detail:
          'In "Issue to Teams", HQ or Site Supervisors issue consumable materials and returnable tools to a specific Field Team Leader (including drum/batch/serial remarks) and print a signable Issue Note (IN) / Gate Pass.',
      },
      {
        stepTitle: '4. Live Team In-Hand Custody & Deletion Guard',
        detail:
          'Open "Team In-Hand Stock" anytime to audit the exact balance held by each Field Crew Leader and print Team Stock Audit Reports (TSR). Teams holding unreturned In-Hand Stock are automatically protected from accidental deletion.',
      },
    ],
    keyOutputs: [
      'Stock Requisition Notes (RN) with Available Stock Filter',
      'Printable Numbered Issue Notes (IN) & Gate Passes',
      'Live Field Crew In-Hand Custody & TSR Audit Reports',
    ],
  },
  {
    id: 'ch-04',
    number: 'Chapter 04',
    category: 'projects',
    categoryLabel: 'Projects & Reconciliation',
    title: 'Project Material Usage (PU), Section Templates & Surplus Returns (RV / BRM)',
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
        stepTitle: '2. Multi-Team Material Consumption Logging (PU)',
        detail:
          'Multiple field crews working on the same project log actual installed quantities in "Material Usage" or "Site Stock" and print official Project Usage Vouchers (PU). Every entry records which team installed what, where, and on which date.',
      },
      {
        stepTitle: '3. Automatic Client-Supplied Stock Priority',
        detail:
          'When logging usage for a client-linked project, the system automatically deducts available Client-Supplied Free Materials first before deducting company-purchased stock—preventing billing disputes.',
      },
      {
        stepTitle: '4. Team Returns (RV) & Branch-to-HQ Returns (BRM)',
        detail:
          'Unused surplus materials, empty drums, or returnable machinery are returned from Field Crews to the Site Branch ("Team Returns" — RV) or from a Site Branch back to Central HQ ("Branch Returns" — BRM) with printable return vouchers.',
      },
    ],
    keyOutputs: [
      'Automatic Client Free-Stock Priority Deduction',
      'Printable Project & Site Material Usage Vouchers (PU)',
      'Verified Team Return (RV) & Branch Return (BRM) Vouchers',
    ],
  },
  {
    id: 'ch-05',
    number: 'Chapter 05',
    category: 'formats',
    categoryLabel: 'Document Formats & Print Studio',
    title: 'How to Configure Company Document Formats (Upload PDF / Image)',
    summary:
      'Upload your existing company PDF or Image forms into 4 unified Format Slots so the system automatically adapts them and prints every operational voucher in your official company format.',
    icon: Upload,
    steps: [
      {
        stepTitle: '1. Open Document Templates → Section Formats (Upload PDF / Image)',
        detail:
          'Go to "Document Templates" in the sidebar and open the "Section Formats (Upload PDF / Image)" tab. All company printable documents are grouped into 4 standard Format Slots (FORMAT-01 to FORMAT-04) according to their table structure.',
      },
      {
        stepTitle: '2. Upload Your Company Format (PDF or Image) & Check "This Format Affects To"',
        detail:
          'Upload a PDF (.pdf) or Image (.png, .jpg, .webp) of your company form into any Format Slot. The system automatically extracts the top header banner, brand color, ISO form reference code, and table/signature metadata. Directly below each upload box, the "This Format Affects To" panel shows every system section and document code (RN, IN, PU, TSR, GRN, FOC, RV, BRM, PO, RTV) governed by that format.',
      },
      {
        stepTitle: '3. Use Unified Format Mode or Customize in the Live A4 Studio',
        detail:
          'If your company uses the same voucher layout for both Internal Issues/Usages (FORMAT-01) and Goods Receipts/Returns (FORMAT-02), enable the 1-click "Use Unified Format-01 & 02" toggle. Use the Live A4 Format Studio on the right to choose Render Mode (Header Banner + System Table, Full Page Background Watermark, or Smart Reconstructed Grid), adjust Header Crop %, and edit Column Headers & Sign-off Titles.',
      },
      {
        stepTitle: '4. Print Directly from Any Operational Section',
        detail:
          'Once saved, clicking "Print / Save PDF" in Stock Requisitions (RN), Issue to Teams (IN), Project Usage (PU), Team Stock Audit (TSR), Goods Receipt (GRN), Client FOC (FOC), Team/Branch Returns (RV/BRM), Purchase Orders (PO), or Supplier Debit Notes (RTV) automatically prints in your configured company format.',
      },
    ],
    keyOutputs: [
      '4 Grouped Company Format Slots (FORMAT-01 to FORMAT-04)',
      'Client-Side PDF & Image Header / Brand Color Auto-Extractor',
      '"This Format Affects To" Section Mapping Badges',
      'Live A4 Format Builder & 3 Print Render Modes',
    ],
  },
  {
    id: 'ch-06',
    number: 'Chapter 06',
    category: 'admin',
    categoryLabel: 'Machinery, Audits & Backups',
    title: 'Plant & Equipment Fleet, Corporate Letterheads, Audit Trail & Backups',
    summary:
      'Maintain full accountability over high-value machinery assets, global letterhead branding, user activity logs, and offline data backups.',
    icon: ShieldCheck,
    steps: [
      {
        stepTitle: '1. Dedicated Plant & Machinery Fleet View',
        detail:
          'Track heavy machinery, generators, testing instruments, and power tools separately from consumables—know whether an asset is in the Central Yard, at a Site Branch, or with a Field Crew.',
      },
      {
        stepTitle: '2. Global Letterhead & Company Branding Studio',
        detail:
          'In "Document Templates → Global Letterhead Studio", configure your Company Name, Logo, Address, Header Style, and default Signature Blocks ("Prepared By", "Checked By", "Received By") across all system reports.',
      },
      {
        stepTitle: '3. Tamper-Proof Audit Trail & Safe Recycle Bin',
        detail:
          'Every stock addition, dispatch, edit, or deletion is recorded with user identity and timestamp in "Audit Trail". Deleted records can be restored from the "Recycle Bin", while historical team usage links remain permanently protected.',
      },
      {
        stepTitle: '4. 1-Click Full System JSON & Multi-Sheet Excel Backups',
        detail:
          'Export a complete offline snapshot of your entire workspace (JSON Backup with built-in Offline Backup Viewer) or download clean multi-sheet Excel reports at any time.',
      },
    ],
    keyOutputs: [
      'Machinery & Returnable Tool Custody Ledger',
      'Tamper-Proof Audit Trail & Protected Recycle Bin',
      '1-Click Full JSON Backup, Offline Viewer & Excel Export',
    ],
  },
];

const FORMAT_GROUPS_GUIDE_MATRIX = [
  {
    code: 'FORMAT-01',
    title: 'Material Requisition, Team Issue & Site Usage Format',
    structure: '3-Column / Item Movement Table + 3 Approval Signatures',
    affectsTo: [
      'RN — Stock Requisitions (Branch to Central HQ Request)',
      'IN — Issue to Teams (Daily Field Crew Dispatch & Gate Pass)',
      'PU — Project & Site Material Usage Vouchers',
      'TSR — Team In-Hand Stock Balance Audit Report',
    ],
  },
  {
    code: 'FORMAT-02',
    title: 'Goods Receipt (GRN), Client FOC & Stock Returns Format',
    structure: 'Inbound Delivery / Return Table + Storekeeper Inspection Sign-off (Can be unified with FORMAT-01 in 1 click)',
    affectsTo: [
      'GRN — Goods Receipt Notes (Supplier PO Delivery & Main Stock Inbound)',
      'FOC — Client Free-Issue Material Receipt Vouchers',
      'RV — Team Stock Return Vouchers (Field Crew to Branch Yard)',
      'BRM — Branch Return to Main Stock (Site Yard to Central HQ)',
    ],
  },
  {
    code: 'FORMAT-03',
    title: 'Official Supplier Purchase Order (PO) Format',
    structure: '5-Column Priced Commercial Schedule + Tax/Discount + Commercial Terms',
    affectsTo: [
      'PO — Official Commercial Purchase Order (Procurement & PO Management)',
    ],
  },
  {
    code: 'FORMAT-04',
    title: 'Return to Vendor (RTV) & Official Debit Note Format',
    structure: '5-Column Return Valuation Table + Claim Reason + Outward Gate Pass',
    affectsTo: [
      'RTV — Supplier Return / Official Debit Note Voucher',
      'GATE-PASS — Supplier Outward Return Dispatch Gate Pass',
    ],
  },
];

const FEATURE_SUMMARY_LIST = [
  {
    group: 'Warehouse, Procurement & Inventory',
    items: [
      'Central HQ Warehouse + Unlimited Regional Site Yards',
      'Consumable Materials vs. Heavy Machinery Classification',
      'Supplier Purchase Orders (PO) & Printable Batch GRN Vouchers',
      'Return to Vendor (RTV) Official Debit Notes & Outward Gate Passes',
      'Client-Supplied Free Materials (FOC) Ledger & Damaged Stock Restoration',
      'Excel / CSV Bulk Import, Multi-Sheet Export & Low-Stock Alerts',
    ],
  },
  {
    group: 'Field Operations, Teams & Projects',
    items: [
      'Site-to-HQ Stock Requisitions (RN) with Available Stock Filter',
      'Auto-Calculated Field Crew Size (1 Team Leader + N Members)',
      'Unique Team Name Lock & Historical Usage Data Protection',
      'Field Crew Issuance (IN) with Serial / Drum / Batch Remarks',
      'Real-Time Field Crew In-Hand Custody & Deletion Guard',
      'Multi-Crew Project Material Usage (PU) & Team/Branch Returns (RV/BRM)',
    ],
  },
  {
    group: 'Company Document Formats & Enterprise Control',
    items: [
      'PDF & Image Company Format Upload (Auto-Extracts Header & Brand Color)',
      '4 Unified Format Slots with "This Format Affects To" Section Mapping',
      'Live A4 Format Studio (Header Banner, Watermark, or Smart Grid Modes)',
      'Single-Site, Multi-Site & Central HQ Role Access Control',
      'Tamper-Proof Audit Trail, Safe Recycle Bin & 1-Click JSON Backup',
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

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  const handlePrintPdfManual = () => {
    setIsDownloadingPdf(true);
    try {
      // jsPDF built-in Helvetica only supports standard ASCII/WinAnsi cleanly.
      // Multi-byte Unicode characters (like →, —, •, ✓) trigger UTF-16 kerning bugs in jsPDF
      // that stretch letter spacing and push lines outside boxes.
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
      const innerPadX = 4.5; // 4.5mm left & right padding inside boxes
      const innerTextW = contentW - innerPadX * 2 - 2; // safe wrapping width inside boxes (171mm)
      let y = 14;

      const ensureSpace = (neededMm: number) => {
        if (y + neededMm > pageH - 18) {
          doc.addPage();
          // Top mini header on continuation pages
          doc.setFillColor(30, 38, 64);
          doc.rect(marginX, 10, contentW, 6.5, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(220, 151, 80);
          doc.text('APEX STOCK - OFFICIAL SYSTEM USER GUIDE & FEATURE HANDBOOK', marginX + 3, 14.5);
          doc.setTextColor(255, 255, 255);
          doc.text(`Edition ${new Date().getFullYear()}`, pageW - marginX - 3, 14.5, { align: 'right' });
          y = 22;
        }
      };

      // ==================== COVER HEADER BANNER ====================
      doc.setFillColor(30, 38, 64); // #1e2640
      doc.roundedRect(marginX, y, contentW, 28, 3, 3, 'F');
      doc.setFillColor(220, 151, 80); // #dc9750 accent stripe
      doc.rect(marginX, y + 26, contentW, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(220, 151, 80);
      doc.text('COMPLETE SYSTEM DOCUMENTATION & CLIENT HANDBOOK', marginX + 6, y + 7.5);

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

      // ==================== 6-STAGE OPERATIONAL FLOW SUMMARY ====================
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
        'Stage 05: Usage & Returns - Log project material installation (PU - deducts Client Free Stock first) & return surplus (RV / BRM).',
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

      // ==================== STEP-BY-STEP CHAPTERS (01 TO 06) ====================
      GUIDE_CHAPTERS.forEach((ch) => {
        ensureSpace(48);

        // Chapter Header Bar
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

        // Chapter Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        const titleLines = doc.splitTextToSize(pdfSafeText(ch.title), contentW);
        doc.text(titleLines, marginX, y);
        y += titleLines.length * 4.5 + 0.5;

        // Chapter Summary
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.2);
        doc.setTextColor(71, 85, 105);
        const summaryLines = doc.splitTextToSize(pdfSafeText(ch.summary), contentW);
        doc.text(summaryLines, marginX, y);
        y += summaryLines.length * 3.8 + 2.5;

        // Steps
        ch.steps.forEach((st) => {
          // Always set exact stepTitle font before splitting stepTitle
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.6);
          const stepTitleLines = doc.splitTextToSize(pdfSafeText(st.stepTitle), innerTextW);

          // Always set exact detail font before splitting detail
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

        // Key Outputs
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.8);
        const outputsText = pdfSafeText(`Key Outputs: ${ch.keyOutputs.join('  |  ')}`);
        const outLines = doc.splitTextToSize(outputsText, contentW);
        ensureSpace(outLines.length * 3.8 + 5);
        doc.setTextColor(158, 92, 25);
        doc.text(outLines, marginX, y + 2.2);
        y += outLines.length * 3.8 + 5.5;
      });

      // ==================== COMPANY FORMAT SLOTS & AFFECTED SECTIONS MATRIX ====================
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

      FORMAT_GROUPS_GUIDE_MATRIX.forEach((slot) => {
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

      // ==================== COMPLETE MODULE CHECKLIST ====================
      ensureSpace(55);
      y += 2;
      doc.setFillColor(30, 38, 64);
      doc.roundedRect(marginX, y, contentW, 8.5, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(220, 151, 80);
      doc.text('COMPLETE PLATFORM MODULE & FEATURE CHECKLIST', marginX + innerPadX, y + 5.7);
      y += 12;

      FEATURE_SUMMARY_LIST.forEach((group) => {
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

      // ==================== ADD FOOTER & PAGE NUMBERS TO EVERY PAGE ====================
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(203, 213, 225);
        doc.line(marginX, pageH - 12, pageW - marginX, pageH - 12);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          'Apex Stock Enterprise SaaS | Official Client User Guide & Feature Handbook | apexdevinfo@gmail.com',
          marginX,
          pageH - 7.5
        );
        doc.setFont('helvetica', 'bold');
        doc.text(`Page ${p} of ${totalPages}`, pageW - marginX, pageH - 7.5, { align: 'right' });
      }

      doc.save('Apex_Stock_Official_User_Guide_Handbook.pdf');
      setPdfSuccessMessage('PDF Handbook Downloaded!');
      setTimeout(() => setPdfSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to generate User Guide PDF:', err);
      try {
        window.print();
      } catch {}
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="py-6 sm:py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* ==================== WEB CONTROLS BAR (HIDDEN WHEN PRINTING PDF) ==================== */}
        <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 mb-5 sm:mb-6">
          <button
            type="button"
            onClick={onBackToOverview}
            className="w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#253050] hover:bg-[#2d3a5e] text-white border border-[#dc9750]/40 text-xs font-extrabold flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer transition whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 text-[#dc9750]" />
            <span className="hidden sm:inline">Back to Platform </span>
            <span>Overview</span>
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrintPdfManual}
              disabled={isDownloadingPdf}
              className="w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#dc9750] hover:bg-[#e7a662] text-[#1e2640] font-black text-xs flex items-center justify-center gap-1.5 sm:gap-2 shadow-md shadow-[#dc9750]/20 cursor-pointer transition whitespace-nowrap disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>
                {isDownloadingPdf
                  ? 'Generating PDF...'
                  : pdfSuccessMessage
                  ? pdfSuccessMessage
                  : 'Download Guide (PDF)'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenSignup}
              className="w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#161d33] hover:bg-[#222c4a] text-white border border-[#dc9750]/40 font-bold text-xs flex items-center justify-center gap-1.5 sm:gap-2 shadow-md cursor-pointer transition whitespace-nowrap"
            >
              <span className="text-[#e5a460] font-black">
                <span className="hidden sm:inline">Start 7-Day </span>Free Trial
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
                  APEX STOCK — OFFICIAL SYSTEM USER GUIDE & FEATURE HANDBOOK
                </h1>
                <p className="text-xs text-slate-700 mt-1">
                  Enterprise Cloud Inventory, Multi-Site Yard Operations, Company PDF/Image Format Studio & Field Crew Dispatch
                </p>
              </div>
              <div className="text-right text-xs text-slate-600 font-mono">
                <div>Edition: {new Date().getFullYear()} International</div>
                <div>apexdevinfo@gmail.com</div>
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
                  <span>Complete System Documentation & Client Handbook</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-[#1e2640] tracking-tight leading-tight text-balance">
                  How Apex Stock Works: Step-by-Step User Guide, Document Format Studio & Features
                </h1>
                <p className="text-xs sm:text-sm text-[#2d3859] mt-3 leading-relaxed font-medium">
                  Everything you need to understand how materials, client-supplied stock, heavy machinery, daily crew dispatches, and custom PDF/Image company document formats work across your headquarters, regional site yards, and active projects. Read online below or save this handbook as an A4 PDF.
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
                  disabled={isDownloadingPdf}
                  className="mt-3.5 w-full py-2.5 px-4 rounded-xl bg-[#dc9750] hover:bg-[#e7a662] text-[#1e2640] font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition whitespace-nowrap disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isDownloadingPdf
                      ? 'Generating PDF...'
                      : pdfSuccessMessage
                      ? pdfSuccessMessage
                      : 'Download PDF Handbook'}
                  </span>
                </button>
              </div>
            </div>

            {/* ==================== 6-STAGE VISUAL STOCK FLOW ("AT A GLANCE") ==================== */}
            <div className="mt-8 pt-7 border-t border-[#dc9750]/35">
              <div className="text-xs font-extrabold text-[#1e2640] mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#b56b21]" />
                <span>End-to-End Operational Flow at a Glance (6 Core Stages)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                {[
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
                    title: 'Usage & Returns',
                    desc: 'Log project usage (PU — client stock first) & return surplus (RV / BRM).',
                    icon: RotateCcw,
                  },
                  {
                    stage: 'Stage 06',
                    title: 'Company Formats',
                    desc: 'Upload PDF/Image company forms to print all vouchers in your layout.',
                    icon: Upload,
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
                { id: 'all', label: 'All Chapters (06)' },
                { id: 'setup', label: '01. Setup & Teams' },
                { id: 'warehouse', label: '02. PO, GRN & RTV' },
                { id: 'operations', label: '03. Site & Crew Dispatch' },
                { id: 'projects', label: '04. Projects & Returns' },
                { id: 'formats', label: '05. Format Upload Studio' },
                { id: 'admin', label: '06. Machinery & Security' },
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
                placeholder="Search guide (e.g. Format, GRN, Team, RTV)..."
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

          {/* ==================== DEDICATED COMPANY FORMAT UPLOAD & AFFECTED SECTIONS GUIDE ==================== */}
          <div className="rounded-[24px] bg-[#fdfaf5] border border-[#dc9750]/55 p-6 sm:p-8 shadow-md break-inside-avoid">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#dc9750]/30">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#9e5c19] mb-1.5">
                  <Sparkles className="w-4 h-4 text-[#b56b21]" />
                  <span>Standard Document Format Reference Guide (PDF / Image Upload)</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#1e2640] tracking-tight">
                  How Company Document Format Upload & &ldquo;This Format Affects To&rdquo; Works
                </h2>
                <p className="text-xs sm:text-sm text-[#2d3859] mt-1 font-medium max-w-4xl">
                  In <strong>Document Templates → Section Formats (Upload PDF / Image)</strong>, company forms sharing the same structure are grouped into 4 standard slots. Uploading a PDF or Image automatically adapts your company format for printing across every linked section listed under <strong>&ldquo;This Format Affects To&rdquo;</strong>.
                </p>
              </div>
              <div className="shrink-0 bg-[#1e2640] text-[#dc9750] px-4 py-2.5 rounded-xl text-xs font-extrabold border border-[#dc9750]/40">
                Supports PDF (.pdf) & Images (.png, .jpg, .webp)
              </div>
            </div>

            {/* 4 Format Groups Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {FORMAT_GROUPS_GUIDE_MATRIX.map((slot) => (
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
                        PDF / Image Upload Slot
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-[#1e2640]">{slot.title}</h3>
                    <p className="text-[11px] text-[#475577] mt-1 font-medium">
                      {slot.structure}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-200/80">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#9e5c19] mb-1.5">
                      This Format Affects To (Printed Sections):
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
                <div className="font-extrabold text-[#1e2640]">Mode A: Extracted Header Banner + System Table</div>
                <p className="text-[11px] text-[#334063] mt-1 leading-relaxed">
                  Crops your uploaded PDF/Image letterhead banner at the top (adjustable 10%–45% crop height) and renders a crisp, brand-colored system table and 3-column signature block below.
                </p>
              </div>
              <div className="rounded-xl bg-white/90 border border-[#dc9750]/25 p-3.5">
                <div className="font-extrabold text-[#1e2640]">Mode B: Full Uploaded Form Background Watermark</div>
                <p className="text-[11px] text-[#334063] mt-1 leading-relaxed">
                  Uses your entire uploaded A4 page as the background stationery/watermark and overlays live system data, tables, and signature blocks cleanly on top.
                </p>
              </div>
              <div className="rounded-xl bg-white/90 border border-[#dc9750]/25 p-3.5">
                <div className="font-extrabold text-[#1e2640]">Mode C: Smart Reconstructed Digital Grid</div>
                <p className="text-[11px] text-[#334063] mt-1 leading-relaxed">
                  Reconstructs your form digitally using the extracted brand color, ISO form reference code, custom table column headers, and custom bottom sign-off titles.
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
                      Full visibility across Central Warehouse, Client-Supplied Free Stock, Supplier Purchase Orders (PO/GRN/RTV), Master Registrations, Document Format Studio, all Regional Site Yards, Audit Trails, and System Backups.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white border border-[#dc9750]/30 p-4">
                    <div className="flex items-center gap-2 text-xs font-black text-[#1e2640]">
                      <Truck className="w-4 h-4 text-[#1e2640]" />
                      <span>Site Branch Supervisor / Yard Storekeeper</span>
                    </div>
                    <p className="text-xs text-[#334063] mt-1.5 leading-relaxed font-medium">
                      Can be locked to a Single Site Branch or assigned to Multiple Specific Site Branches. Can submit Stock Requisitions (RN) to HQ, manage their assigned Site Yard stock, issue items to Field Crews (IN), and log Project Material Usage (PU) & Returns (RV/BRM).
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
