import { DocumentFormatGroupId, SectionFormatConfig } from '../types';

export interface AffectedSectionInfo {
  sectionName: string;
  tabId: string;
  docCode: string;
  voucherTitle: string;
}

export interface FormatGroupDefinition {
  groupId: DocumentFormatGroupId;
  groupCode: string;
  title: string;
  sinhalaTitle: string;
  description: string;
  badgeColor: string;
  affectedSections: AffectedSectionInfo[];
}

export const COMPANY_FORMAT_GROUPS: FormatGroupDefinition[] = [
  {
    groupId: 'REQUISITION_ISSUE_USAGE',
    groupCode: 'FORMAT-01',
    title: 'Material Requisition, Team Issue & Site Usage Format',
    sinhalaTitle: 'බඩු ඉල්ලුම්පත්, නිකුත් කිරීම් සහ වැඩබිම් භාවිත වවුචර් ආකෘතිය (RN / IN / PU / TSR)',
    description:
      'Common standard voucher format used for internal stock transfer requests, daily field team dispatches/gate passes, project/site material usage logs, and team in-hand stock balance audits.',
    badgeColor: 'emerald',
    affectedSections: [
      {
        sectionName: 'Stock Requisitions',
        tabId: 'requests',
        docCode: 'RN-YYYY-XXXX',
        voucherTitle: 'Material Requisition & Transfer Note',
      },
      {
        sectionName: 'Issue to Teams',
        tabId: 'dispatch',
        docCode: 'IN-YYYY-XXXX',
        voucherTitle: 'Daily Field Dispatch & Issue Note / Gate Pass',
      },
      {
        sectionName: 'Material Usage (Projects)',
        tabId: 'project-usage',
        docCode: 'PU-YYYY-XXXX',
        voucherTitle: 'Project Material Consumption Voucher',
      },
      {
        sectionName: 'Site Branch Stock',
        tabId: 'site-stock',
        docCode: 'PU-YYYY-XXXX',
        voucherTitle: 'Site Material Usage Voucher',
      },
      {
        sectionName: 'Team In-Hand Stock',
        tabId: 'team-stock',
        docCode: 'TSR-XXXX',
        voucherTitle: 'Field Team In-Hand Stock Balance Audit',
      },
    ],
  },
  {
    groupId: 'RECEIPT_RETURN_FOC',
    groupCode: 'FORMAT-02',
    title: 'Goods Receipt (GRN), Client FOC & Stock Returns Format',
    sinhalaTitle: 'භාණ්ඩ භාරගැනීම් (GRN / FOC) සහ ආපසු භාරදීමේ ආකෘතිය (GRN / FOC / RV / BRM)',
    description:
      'Common standard format used when receiving goods into the warehouse (GRN), logging client free-issue materials (FOC), returning items from field teams (RV), or returning branch stock to Central Yard (BRM).',
    badgeColor: 'blue',
    affectedSections: [
      {
        sectionName: 'Supplier Orders (GRN)',
        tabId: 'procurement',
        docCode: 'GRN-PO-XXXX',
        voucherTitle: 'Goods Receipt Note (Inbound Delivery Voucher)',
      },
      {
        sectionName: 'Main Central Stock',
        tabId: 'main-stock',
        docCode: 'GRN / PO / BRM',
        voucherTitle: 'Central Warehouse Inbound & Return Slip',
      },
      {
        sectionName: 'Client Free Stock (FOC)',
        tabId: 'client-free-stock',
        docCode: 'FOC-YYYY-XXXX',
        voucherTitle: 'Client Free-Issue Material Receipt Voucher',
      },
      {
        sectionName: 'Team Returns',
        tabId: 'returns',
        docCode: 'RV-YYYY-XXXX',
        voucherTitle: 'Team Stock Return Voucher (To Branch Yard)',
      },
      {
        sectionName: 'Branch Returns',
        tabId: 'branch-returns',
        docCode: 'BRM-YYYY-XXXX',
        voucherTitle: 'Inter-Branch Return to Central Yard Note',
      },
    ],
  },
  {
    groupId: 'PURCHASE_ORDER',
    groupCode: 'FORMAT-03',
    title: 'Official Supplier Purchase Order (PO) Format',
    sinhalaTitle: 'සැපයුම්කරුවන්ගෙන් භාණ්ඩ ඇණවුම් කිරීමේ නිල ආකෘතිය (Purchase Order - PO)',
    description:
      'Commercial Purchase Order format with Vendor/Ship-To blocks, unit rates, VAT/Tax & discount calculations, terms & conditions, and 3-column commercial approval signatures.',
    badgeColor: 'indigo',
    affectedSections: [
      {
        sectionName: 'Supplier Orders (PO)',
        tabId: 'procurement',
        docCode: 'PO-YYYY-XXXX',
        voucherTitle: 'Official Commercial Purchase Order (Print & PDF)',
      },
    ],
  },
  {
    groupId: 'SUPPLIER_RETURN_DEBIT_NOTE',
    groupCode: 'FORMAT-04',
    title: 'Return to Vendor (RTV) & Official Debit Note Format',
    sinhalaTitle: 'සැපයුම්කරු වෙත භාණ්ඩ ආපසු යැවීමේ සහ හර සටහන් ආකෘතිය (RTV / Debit Note & Gate Pass)',
    description:
      'Official Debit Note & Return to Vendor (RTV) format for defective/excess supplier deliveries, including financial claim summary, transporter/vehicle details, and outward Gate Pass.',
    badgeColor: 'amber',
    affectedSections: [
      {
        sectionName: 'Supplier Orders (RTV / Debit Note)',
        tabId: 'procurement',
        docCode: 'RTV-YYYY-XXXX',
        voucherTitle: 'Return to Vendor & Official Debit Note Voucher',
      },
      {
        sectionName: 'Supplier Outward Gate Pass',
        tabId: 'procurement',
        docCode: 'GATE-PASS',
        voucherTitle: 'Outward Return Dispatch Gate Pass',
      },
    ],
  },
];

export const DEFAULT_SECTION_FORMATS: Record<DocumentFormatGroupId, SectionFormatConfig> = {
  REQUISITION_ISSUE_USAGE: {
    groupId: 'REQUISITION_ISSUE_USAGE',
    groupName: 'Material Requisition, Team Issue & Site Usage Format',
    isCustomUploaded: false,
    headerCropHeightPercent: 22,
    renderMode: 'smart_reconstructed',
    gridStyle: 'classic_bordered',
    accentColor: '#0f172a',
    formRefCode: 'CTS-MAT-REQ-022 / QP 2B',
    customMainTitle: '',
    showMetadataThreeBox: true,
    showIsoRevisionFooter: true,
    colItemNoLabel: 'Item No',
    colDescriptionLabel: 'Item Description',
    colUnitLabel: 'Unit',
    colQtyLabel: 'Quantity',
    colSecondaryLabel: 'Category',
    colRemarksLabel: 'Remarks / Custody',
    signPreparedLabel: 'Prepared & Checked By',
    signApprovedLabel: 'Approved By',
    signThirdLabel: 'Reviewed By',
    linkedToGroupId: '',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  RECEIPT_RETURN_FOC: {
    groupId: 'RECEIPT_RETURN_FOC',
    groupName: 'Goods Receipt (GRN), Client FOC & Stock Returns Format',
    isCustomUploaded: false,
    headerCropHeightPercent: 22,
    renderMode: 'smart_reconstructed',
    gridStyle: 'classic_bordered',
    accentColor: '#065f46',
    formRefCode: 'CTS-GRN-RET-014 / WH-01',
    customMainTitle: '',
    showMetadataThreeBox: true,
    showIsoRevisionFooter: true,
    colItemNoLabel: 'Item No',
    colDescriptionLabel: 'Material Description',
    colUnitLabel: 'Unit',
    colQtyLabel: 'Received / Returned Qty',
    colSecondaryLabel: 'Category / Condition',
    colRemarksLabel: 'Remarks / Inspection',
    signPreparedLabel: 'Received / Logged By',
    signApprovedLabel: 'Verified & Approved By',
    signThirdLabel: 'Store In-Charge',
    linkedToGroupId: '',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  PURCHASE_ORDER: {
    groupId: 'PURCHASE_ORDER',
    groupName: 'Official Supplier Purchase Order (PO) Format',
    isCustomUploaded: false,
    headerCropHeightPercent: 22,
    renderMode: 'smart_reconstructed',
    gridStyle: 'modern_corporate',
    accentColor: '#0f172a',
    formRefCode: 'PROC-PO-STD-001',
    customMainTitle: 'PURCHASE ORDER',
    showMetadataThreeBox: true,
    showIsoRevisionFooter: true,
    colItemNoLabel: '#',
    colDescriptionLabel: 'Item Code & Material Description',
    colUnitLabel: 'Unit',
    colQtyLabel: 'Qty',
    colSecondaryLabel: 'Unit Price',
    colRemarksLabel: 'Amount',
    signPreparedLabel: 'Prepared By',
    signApprovedLabel: 'Approved By',
    signThirdLabel: 'Supplier Acknowledgment',
    termsAndConditionsText:
      'Goods must be supplied strictly in accordance with specified standards. Delivery note & test certificates must accompany all shipments.',
    linkedToGroupId: '',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  SUPPLIER_RETURN_DEBIT_NOTE: {
    groupId: 'SUPPLIER_RETURN_DEBIT_NOTE',
    groupName: 'Return to Vendor (RTV) & Official Debit Note Format',
    isCustomUploaded: false,
    headerCropHeightPercent: 22,
    renderMode: 'smart_reconstructed',
    gridStyle: 'modern_corporate',
    accentColor: '#78350f',
    formRefCode: 'PROC-RTV-DN-009',
    customMainTitle: 'DEBIT NOTE / RETURN TO VENDOR (RTV)',
    showMetadataThreeBox: true,
    showIsoRevisionFooter: true,
    colItemNoLabel: '#',
    colDescriptionLabel: 'Description & Defect Reason',
    colUnitLabel: 'Unit',
    colQtyLabel: 'Quantity',
    colSecondaryLabel: 'Rate',
    colRemarksLabel: 'Debit Amount',
    signPreparedLabel: 'Prepared By',
    signApprovedLabel: 'Authorized By',
    signThirdLabel: 'Supplier Acknowledgment',
    termsAndConditionsText:
      'This Debit Note serves as an official accounting claim against delivered stock. Goods returned remain the property of the vendor pending credit note issuance or authorized replacement.',
    linkedToGroupId: '',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};

export interface ExtractedFormatMetadata {
  companyName?: string;
  tel?: string;
  email?: string;
  address?: string;
  formRefCode?: string;
  detectedTitle?: string;
  signPreparedLabel?: string;
  signApprovedLabel?: string;
  signThirdLabel?: string;
  colDescriptionLabel?: string;
  colQtyLabel?: string;
  summaryText: string;
}

/**
 * Extracts dominant brand accent color from an image element or canvas
 */
function extractDominantBrandColor(canvas: HTMLCanvasElement): string {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#0f172a';
    const sampleHeight = Math.max(10, Math.floor(canvas.height * 0.3));
    const imgData = ctx.getImageData(0, 0, canvas.width, sampleHeight).data;

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let count = 0;

    for (let i = 0; i < imgData.length; i += 16) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const a = imgData[i + 3];
      if (a < 128) continue;

      // Skip near-white background pixels
      if (r > 230 && g > 230 && b > 230) continue;
      // Skip near-black text pixels unless it has some color saturation
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;

      if (saturation > 0.18 && max > 35 && max < 235) {
        rSum += r;
        gSum += g;
        bSum += b;
        count++;
      }
    }

    if (count > 20) {
      const rAvg = Math.round(rSum / count);
      const gAvg = Math.round(gSum / count);
      const bAvg = Math.round(bSum / count);
      const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
      return `#${toHex(rAvg)}${toHex(gAvg)}${toHex(bAvg)}`;
    }
  } catch {
    // Fallback
  }
  return '#0f172a';
}

/**
 * Crops the top `cropPercent`% of a full-page Data URL into a clean Header Banner Data URL
 */
export async function recropHeaderBannerFromImage(
  fullPageDataUrl: string,
  cropPercent = 22
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const safePercent = Math.max(10, Math.min(45, cropPercent));
        const targetWidth = Math.min(img.width, 950);
        const scale = targetWidth / img.width;
        const sourceCropHeight = Math.max(40, Math.round(img.height * (safePercent / 100)));
        const targetHeight = Math.round(sourceCropHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(fullPageDataUrl);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          sourceCropHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        resolve(fullPageDataUrl);
      }
    };
    img.onerror = () => resolve(fullPageDataUrl);
    img.src = fullPageDataUrl;
  });
}

/**
 * Parses readable text tokens from raw PDF bytes to auto-detect form fields & company headers
 */
function parsePdfTextMetadata(arrayBuffer: ArrayBuffer, fileName: string): ExtractedFormatMetadata {
  const bytes = new Uint8Array(arrayBuffer);
  let rawAscii = '';
  const maxScan = Math.min(bytes.length, 450000);
  for (let i = 0; i < maxScan; i++) {
    const code = bytes[i];
    if ((code >= 32 && code <= 126) || code === 10 || code === 13) {
      rawAscii += String.fromCharCode(code);
    } else {
      rawAscii += ' ';
    }
  }

  // Extract parenthesized strings from PDF content streams: (...)
  const extractedChunks: string[] = [];
  const parenRegex = /\(([^()]{3,120})\)/g;
  let match: RegExpExecArray | null;
  while ((match = parenRegex.exec(rawAscii)) !== null) {
    const cleaned = match[1]
      .replace(/\\[nrt]/g, ' ')
      .replace(/\\([()\\])/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
    if (
      cleaned.length >= 3 &&
      !/^(Identity|Adobe|MacRoman|WinAnsi|DeviceRGB|DeviceCMYK|Type|Font|Page|Catalog|Outlines)/i.test(cleaned) &&
      /[a-zA-Z]{2,}/.test(cleaned)
    ) {
      extractedChunks.push(cleaned);
    }
  }

  const combinedText = extractedChunks.join(' | ');
  const result: ExtractedFormatMetadata = {
    summaryText: '',
  };

  // Detect Company Name
  const companyCandidate = extractedChunks.find((c) =>
    /\b(PVT|LTD|LIMITED|SYSTEMS|ENGINEERING|CONSTRUCTION|CONTRACTORS|LOGISTICS|ENTERPRISES|HOLDINGS|CORP|GROUP)\b/i.test(c)
  );
  if (companyCandidate) {
    result.companyName = companyCandidate.slice(0, 70);
  }

  // Detect Form Ref / ISO Code
  const formRefMatch =
    combinedText.match(/\b(Form\s*(?:No|Ref|Code)?\s*[:.-]?\s*[A-Z0-9/-]{3,25})/i) ||
    combinedText.match(/\b(ISO\s*[0-9:-]{4,18})/i) ||
    combinedText.match(/\b([A-Z]{2,5}-[A-Z]{2,5}-[0-9]{2,5})\b/);
  if (formRefMatch) {
    result.formRefCode = formRefMatch[1].trim();
  } else {
    const cleanFileCode = fileName
      .replace(/\.[^.]+$/, '')
      .toUpperCase()
      .replace(/[^A-Z0-9-]+/g, '-')
      .slice(0, 22);
    if (cleanFileCode) {
      result.formRefCode = `FMT-${cleanFileCode}`;
    }
  }

  // Detect Document Title
  const titleCandidate = extractedChunks.find((c) =>
    /\b(PURCHASE ORDER|GOODS RECEIPT|GRN|REQUISITION|ISSUE NOTE|GATE PASS|DEBIT NOTE|RETURN VOUCHER|DELIVERY NOTE|CONSUMPTION|STOCK AUDIT)\b/i.test(
      c
    )
  );
  if (titleCandidate) {
    result.detectedTitle = titleCandidate.toUpperCase().slice(0, 60);
  }

  // Detect Signer Labels
  if (/Requested By/i.test(combinedText)) result.signPreparedLabel = 'Requested By';
  else if (/Issued By/i.test(combinedText)) result.signPreparedLabel = 'Issued By';
  else if (/Prepared By/i.test(combinedText)) result.signPreparedLabel = 'Prepared By';

  if (/Authorized By/i.test(combinedText)) result.signApprovedLabel = 'Authorized By';
  else if (/Approved By/i.test(combinedText)) result.signApprovedLabel = 'Approved By';

  if (/Received By/i.test(combinedText)) result.signThirdLabel = 'Received By';
  else if (/Checked By/i.test(combinedText)) result.signThirdLabel = 'Checked By';
  else if (/Storekeeper/i.test(combinedText)) result.signThirdLabel = 'Storekeeper / Receiver';

  const detectedParts: string[] = [];
  if (result.companyName) detectedParts.push(`Company: ${result.companyName}`);
  if (result.detectedTitle) detectedParts.push(`Title: ${result.detectedTitle}`);
  if (result.formRefCode) detectedParts.push(`Form Ref: ${result.formRefCode}`);
  if (result.signPreparedLabel || result.signApprovedLabel) {
    detectedParts.push(
      `Signers: ${result.signPreparedLabel || 'Prepared By'} / ${result.signApprovedLabel || 'Approved By'}`
    );
  }

  result.summaryText =
    detectedParts.length > 0
      ? `Auto-extracted from PDF: ${detectedParts.join(' • ')}`
      : `Uploaded PDF format "${fileName}" analyzed and mapped to system layout.`;

  return result;
}

/**
 * Generates a clean visual A4 representation on Canvas when a PDF cannot be rasterized via external worker
 */
function synthesizePdfPreviewCanvas(
  fileName: string,
  meta: ExtractedFormatMetadata,
  fallbackCompanyName = 'COMPANY OFFICIAL FORMAT'
): { fullPageDataUrl: string; headerBannerDataUrl: string } {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1130;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // White A4 sheet
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Top corporate accent bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, 14);

    // Header box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(36, 28, canvas.width - 72, 165);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 28, canvas.width - 72, 165);

    // Badge
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(56, 52, 68, 44);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DOC', 90, 80);

    // Company Title
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px serif';
    ctx.fillText((meta.companyName || fallbackCompanyName).toUpperCase().slice(0, 38), 142, 74);

    ctx.fillStyle = '#475569';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Uploaded Official Format Reference: ${fileName}`, 142, 100);
    ctx.fillText(`Form Control Code: ${meta.formRefCode || 'STD-DOC-2026'}`, 142, 122);

    // Document Title Banner
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(36, 210, canvas.width - 72, 38);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      meta.detectedTitle || 'OFFICIAL STANDARD VOUCHER FORMAT (PDF TEMPLATE)',
      canvas.width / 2,
      234
    );

    // Table Grid Skeleton
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(36, 270, canvas.width - 72, 560);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(37, 271, canvas.width - 74, 36);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('#', 52, 294);
    ctx.fillText(meta.colDescriptionLabel || 'Item Code & Material Description', 100, 294);
    ctx.fillText('Unit', 490, 294);
    ctx.fillText(meta.colQtyLabel || 'Quantity', 565, 294);
    ctx.fillText('Remarks', 665, 294);

    // Sign-off Footer Skeleton
    ctx.strokeRect(36, 860, canvas.width - 72, 180);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(meta.signPreparedLabel || 'Prepared & Checked By', 60, 995);
    ctx.fillText(meta.signApprovedLabel || 'Approved By', 330, 995);
    ctx.fillText(meta.signThirdLabel || 'Reviewed / Received By', 560, 995);
  }

  const fullPageDataUrl = canvas.toDataURL('image/jpeg', 0.84);

  // Header crop
  const headerCanvas = document.createElement('canvas');
  headerCanvas.width = 800;
  headerCanvas.height = 205;
  const hCtx = headerCanvas.getContext('2d');
  if (hCtx) {
    hCtx.drawImage(canvas, 0, 0, 800, 205, 0, 0, 800, 205);
  }
  const headerBannerDataUrl = headerCanvas.toDataURL('image/jpeg', 0.85);
  return { fullPageDataUrl, headerBannerDataUrl };
}

/**
 * Attempts to render Page 1 of a PDF file using pdf.js from CDN if available in the browser
 */
async function tryRasterizePdfFirstPage(arrayBuffer: ArrayBuffer): Promise<HTMLCanvasElement | null> {
  try {
    const win = window as unknown as { pdfjsLib?: any };
    if (!win.pdfjsLib) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load pdf.js'));
        document.head.appendChild(script);
      });
    }
    if (!win.pdfjsLib) return null;
    win.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const loadingTask = win.pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (!context) return null;
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas;
  } catch {
    return null;
  }
}

/**
 * Processes an uploaded Image or PDF file, returning compressed preview images,
 * cropped header banner, detected brand color, and extracted document metadata.
 */
export async function analyzeUploadedFormatFile(
  file: File,
  cropPercent = 22,
  fallbackCompanyName = 'COMTEC SYSTEMS (PVT) LTD.'
): Promise<{
  fileType: 'image' | 'pdf';
  fullPageDataUrl: string;
  headerBannerDataUrl: string;
  detectedAccentColor: string;
  metadata: ExtractedFormatMetadata;
}> {
  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    const arrayBuffer = await file.arrayBuffer();
    const metadata = parsePdfTextMetadata(arrayBuffer, file.name);
    const rasterizedCanvas = await tryRasterizePdfFirstPage(arrayBuffer);

    if (rasterizedCanvas) {
      const detectedAccentColor = extractDominantBrandColor(rasterizedCanvas);
      // Scale to max width 950px
      const targetWidth = Math.min(rasterizedCanvas.width, 950);
      const scale = targetWidth / rasterizedCanvas.width;
      const targetHeight = Math.round(rasterizedCanvas.height * scale);

      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = targetWidth;
      scaledCanvas.height = targetHeight;
      const sCtx = scaledCanvas.getContext('2d');
      if (sCtx) {
        sCtx.fillStyle = '#ffffff';
        sCtx.fillRect(0, 0, targetWidth, targetHeight);
        sCtx.drawImage(rasterizedCanvas, 0, 0, targetWidth, targetHeight);
      }

      const fullPageDataUrl = scaledCanvas.toDataURL('image/jpeg', 0.82);
      const headerBannerDataUrl = await recropHeaderBannerFromImage(fullPageDataUrl, cropPercent);

      return {
        fileType: 'pdf',
        fullPageDataUrl,
        headerBannerDataUrl,
        detectedAccentColor,
        metadata,
      };
    }

    // Fallback synthesized visual preview from extracted PDF text
    const synth = synthesizePdfPreviewCanvas(file.name, metadata, fallbackCompanyName);
    return {
      fileType: 'pdf',
      fullPageDataUrl: synth.fullPageDataUrl,
      headerBannerDataUrl: synth.headerBannerDataUrl,
      detectedAccentColor: '#0f172a',
      metadata,
    };
  }

  // Handle Image upload (.png, .jpg, .jpeg, .webp)
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(String(e.target?.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const targetWidth = Math.min(img.width, 1000);
      const scale = targetWidth / img.width;
      const targetHeight = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      }

      const detectedAccentColor = extractDominantBrandColor(canvas);
      const fullPageDataUrl = canvas.toDataURL('image/jpeg', 0.82);
      const headerBannerDataUrl = await recropHeaderBannerFromImage(fullPageDataUrl, cropPercent);

      const cleanCode = file.name
        .replace(/\.[^.]+$/, '')
        .toUpperCase()
        .replace(/[^A-Z0-9-]+/g, '-')
        .slice(0, 20);

      resolve({
        fileType: 'image',
        fullPageDataUrl,
        headerBannerDataUrl,
        detectedAccentColor,
        metadata: {
          formRefCode: cleanCode ? `FMT-${cleanCode}` : undefined,
          summaryText: `Uploaded format image "${file.name}" (${img.width}×${img.height}px) analyzed. Header banner cropped and brand color (${detectedAccentColor}) applied to system voucher layout.`,
        },
      });
    };
    img.onerror = () => {
      resolve({
        fileType: 'image',
        fullPageDataUrl: rawDataUrl,
        headerBannerDataUrl: rawDataUrl,
        detectedAccentColor: '#0f172a',
        metadata: {
          summaryText: `Uploaded format image "${file.name}" linked to system voucher layout.`,
        },
      });
    };
    img.src = rawDataUrl;
  });
}
