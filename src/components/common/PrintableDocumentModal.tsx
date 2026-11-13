import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  Sliders,
  Check,
  Building2,
  PenTool,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatDateTime, formatDate, formatNumber } from '../../utils/exportUtils';
import { StockTransferRequest, TeamIssue, TeamReturn, TeamInHandSummary, LetterheadTemplate, DocumentFormatGroupId } from '../../types';
import { printHtmlElement, downloadElementAsPdf } from '../../utils/printUtils';
import { isMachineryItem } from '../../utils/itemTypeUtils';
import { COMPANY_FORMAT_GROUPS } from '../../utils/formatAnalyzerUtils';

type DocType =
  | { type: 'REQUEST_NOTE'; data: StockTransferRequest }
  | { type: 'ISSUE_NOTE'; data: TeamIssue }
  | { type: 'RETURN_VOUCHER'; data: TeamReturn }
  | { type: 'TEAM_STOCK_REPORT'; data: TeamInHandSummary };

export interface PrintableDocumentItem {
  itemCode: string;
  itemName: string;
  category?: string;
  quantity: number;
  unit?: string;
  remarks?: string;
}

export interface PrintableDocumentModalProps {
  document?: DocType;
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  documentNumber?: string;
  documentDate?: string;
  recipientLabel?: string;
  recipientName?: string;
  recipientSubDetails?: string;
  notes?: string;
  items?: PrintableDocumentItem[];
  formatGroupOverride?: DocumentFormatGroupId;
}

export const PrintableDocumentModal: React.FC<PrintableDocumentModalProps> = ({
  document,
  isOpen = true,
  onClose,
  title,
  documentNumber,
  documentDate,
  recipientLabel,
  recipientName,
  recipientSubDetails,
  notes,
  items: customItems,
  formatGroupOverride,
}) => {
  const {
    sites,
    items,
    teams,
    letterheadTemplates,
    activeTemplateId,
    activeTemplate: contextActiveTemplate,
    setActiveTemplateId,
    updateLetterheadTemplate,
    digitalSignatures,
    getEffectiveSectionFormat,
  } = useStock();

  // Selected template for this print session
  const [currentTemplateId, setCurrentTemplateId] = useState<string>(activeTemplateId);
  const activeTemplate: LetterheadTemplate =
    letterheadTemplates.find((t) => t.id === currentTemplateId) ||
    contextActiveTemplate ||
    letterheadTemplates[0];

  // Determine which Company Format Group applies to this document
  const detectedGroupId: DocumentFormatGroupId = (() => {
    if (formatGroupOverride) return formatGroupOverride;
    if (document) {
      if (document.type === 'RETURN_VOUCHER') return 'RECEIPT_RETURN_FOC';
      return 'REQUISITION_ISSUE_USAGE';
    }
    const upperNum = (documentNumber || '').toUpperCase();
    const upperTitle = (title || '').toUpperCase();
    if (
      upperNum.startsWith('GRN') ||
      upperNum.startsWith('FOC') ||
      upperNum.startsWith('BRM') ||
      upperNum.startsWith('RV') ||
      upperTitle.includes('RETURN') ||
      upperTitle.includes('FREE-ISSUE') ||
      upperTitle.includes('RECEIPT') ||
      upperTitle.includes('GRN')
    ) {
      return 'RECEIPT_RETURN_FOC';
    }
    return 'REQUISITION_ISSUE_USAGE';
  })();

  const effectiveFormat = getEffectiveSectionFormat(detectedGroupId);
  const formatGroupMeta = COMPANY_FORMAT_GROUPS.find((g) => g.groupId === effectiveFormat.groupId) || COMPANY_FORMAT_GROUPS[0];

  // Live Sheet & Signer Customizer Drawer toggle
  const [showSignerEditor, setShowSignerEditor] = useState<boolean>(false);

  // Editable Signers & Metadata state
  const [customPreparedBy, setCustomPreparedBy] = useState<string>('');
  const [customDesigneePrepared, setCustomDesigneePrepared] = useState<string>('');
  const [customDepartmentPrepared, setCustomDepartmentPrepared] = useState<string>('');
  const [customPreparedSigId, setCustomPreparedSigId] = useState<string>('');

  const [customApprovedBy, setCustomApprovedBy] = useState<string>('');
  const [customDesigneeApproved, setCustomDesigneeApproved] = useState<string>('');
  const [customDepartmentApproved, setCustomDepartmentApproved] = useState<string>('');
  const [customApprovedSigId, setCustomApprovedSigId] = useState<string>('');

  const [customReviewedBy, setCustomReviewedBy] = useState<string>('');
  const [customRevSigId, setCustomRevSigId] = useState<string>('');

  const [customIssueNo, setCustomIssueNo] = useState<string>('');
  const [customRevisionNo, setCustomRevisionNo] = useState<string>('');
  const [customProjectCode, setCustomProjectCode] = useState<string>('QP 2B');
  const [customSiteLocation, setCustomSiteLocation] = useState<string>('MATALE');
  const [customDocNumber, setCustomDocNumber] = useState<string>('');
  const [customDate, setCustomDate] = useState<string>('');

  // Sync state whenever activeTemplate or document changes
  useEffect(() => {
    if (activeTemplate) {
      setCustomPreparedBy(activeTemplate.preparedBy || activeTemplate.reviewedBy || 'Dissanayake');
      setCustomDesigneePrepared(activeTemplate.designeePrepared || 'Site In-Charge / Store Keeper');
      setCustomDepartmentPrepared(activeTemplate.departmentPrepared || 'Civil & Telecom Operations');

      setCustomApprovedBy(activeTemplate.approvedBy || 'Arthur Vance');
      setCustomDesigneeApproved(activeTemplate.designeeApproved || 'Central Project Engineer');
      setCustomDepartmentApproved(activeTemplate.departmentApproved || 'Central Logistics & Procurement');

      setCustomReviewedBy(activeTemplate.reviewedBy || 'Dissanayake');
      setCustomIssueNo(activeTemplate.issueNo || '01');
      setCustomRevisionNo(activeTemplate.revisionNo || '00');
    }
  }, [activeTemplate]);

  // Derive initial doc number & date
  useEffect(() => {
    if (document) {
      switch (document.type) {
        case 'REQUEST_NOTE': {
          setCustomDocNumber(document.data.requestNoteNumber);
          setCustomDate(document.data.requestedDate ? document.data.requestedDate.split('T')[0] : new Date().toISOString().split('T')[0]);
          const reqSite = sites.find((s) => s.id === document.data.siteId);
          if (reqSite) {
            setCustomSiteLocation(reqSite.name.toUpperCase());
          }
          if (document.data.requestedBy) {
            setCustomPreparedBy(document.data.requestedBy);
          }
          if (document.data.approvedBy) {
            setCustomApprovedBy(document.data.approvedBy);
          }
          break;
        }
        case 'ISSUE_NOTE': {
          setCustomDocNumber(document.data.issueNoteNumber);
          setCustomDate(document.data.issueDate ? document.data.issueDate.split('T')[0] : new Date().toISOString().split('T')[0]);
          const issSite = sites.find((s) => s.id === document.data.siteId);
          if (issSite) {
            setCustomSiteLocation(issSite.name.toUpperCase());
          }
          if (document.data.issuedBy) {
            setCustomPreparedBy(document.data.issuedBy);
          }
          break;
        }
        case 'RETURN_VOUCHER': {
          setCustomDocNumber(document.data.returnVoucherNumber);
          setCustomDate(document.data.returnDate ? document.data.returnDate.split('T')[0] : new Date().toISOString().split('T')[0]);
          const retSite = sites.find((s) => s.id === document.data.siteId);
          if (retSite) {
            setCustomSiteLocation(retSite.name.toUpperCase());
          }
          if (document.data.returnedBy) {
            setCustomPreparedBy(document.data.returnedBy);
          }
          break;
        }
        case 'TEAM_STOCK_REPORT': {
          setCustomDocNumber(`TSR-${Date.now().toString().slice(-4)}`);
          setCustomDate(new Date().toISOString().split('T')[0]);
          setCustomSiteLocation(document.data.site.name.toUpperCase());
          setCustomPreparedBy(document.data.team.teamLeaderName);
          break;
        }
      }
    } else {
      setCustomDocNumber(documentNumber || 'DOC-2026-0001');
      setCustomDate(documentDate ? documentDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    }
  }, [document, documentNumber, documentDate, sites]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      window.document.body.classList.add('has-print-modal');
      return () => {
        window.document.body.classList.remove('has-print-modal');
      };
    }
  }, [isOpen]);

  if (isOpen === false) return null;

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const handlePrint = async () => {
    setIsProcessing(true);
    setStatusNotice('Processing voucher print & A4 document generation...');
    try {
      window.focus();
      await printHtmlElement('letterhead-printable-area', `${customDocNumber || 'Voucher'}_Print`);
      setStatusNotice('✓ Print dialog invoked and high-res A4 PDF document generated successfully!');
    } catch (err) {
      console.warn('Print invocation warning, falling back to PDF download:', err);
      try {
        await downloadElementAsPdf('letterhead-printable-area', `${customDocNumber || 'Voucher'}_Print`);
        setStatusNotice('✓ A4 PDF downloaded successfully for printing!');
      } catch (e) {
        window.focus();
        try { window.print(); } catch (err2) {}
      }
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setTimeout(() => setStatusNotice(null), 3000);
      }, 1500);
    }
  };

  const handleDownloadPdf = async () => {
    setIsProcessing(true);
    setStatusNotice('Generating genuine A4 PDF document...');
    try {
      const docName = `${customDocNumber || 'Voucher'}_${activeTemplate.logoText || 'Comtec'}`;
      await downloadElementAsPdf('letterhead-printable-area', docName);
      setStatusNotice('✓ PDF generated and downloaded successfully!');
    } catch (err) {
      console.error('Download PDF error:', err);
      setStatusNotice('PDF generation failed, falling back to browser print...');
      window.focus();
      window.print();
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setTimeout(() => setStatusNotice(null), 3000);
      }, 1200);
    }
  };

  // Find digital signatures
  const prepSig =
    digitalSignatures.find((s) => s.id === customPreparedSigId) ||
    digitalSignatures.find(
      (s) =>
        s.name.toLowerCase().includes(customPreparedBy.toLowerCase()) ||
        (customPreparedBy && s.name.toLowerCase().includes(customPreparedBy.split(' ')[0].toLowerCase()))
    ) ||
    digitalSignatures[1];

  const apprSig =
    digitalSignatures.find((s) => s.id === customApprovedSigId) ||
    digitalSignatures.find(
      (s) =>
        s.name.toLowerCase().includes(customApprovedBy.toLowerCase()) ||
        (customApprovedBy && s.name.toLowerCase().includes(customApprovedBy.split(' ')[0].toLowerCase()))
    ) ||
    digitalSignatures[0];

  const revSig =
    digitalSignatures.find((s) => s.id === customRevSigId) ||
    digitalSignatures.find(
      (s) =>
        s.name.toLowerCase().includes(customReviewedBy.toLowerCase()) ||
        (customReviewedBy && s.name.toLowerCase().includes(customReviewedBy.split(' ')[0].toLowerCase()))
    ) ||
    digitalSignatures[1];

  // Save current signers back to template as default
  const handleSaveAsTemplateDefault = () => {
    updateLetterheadTemplate({
      ...activeTemplate,
      preparedBy: customPreparedBy,
      designeePrepared: customDesigneePrepared,
      departmentPrepared: customDepartmentPrepared,
      approvedBy: customApprovedBy,
      designeeApproved: customDesigneeApproved,
      departmentApproved: customDepartmentApproved,
      reviewedBy: customReviewedBy,
      issueNo: customIssueNo,
      revisionNo: customRevisionNo,
    });
  };

  // Dynamic Table Styling from effectiveFormat
  const isModernGrid = effectiveFormat.gridStyle === 'modern_corporate';
  const isMinimalGrid = effectiveFormat.gridStyle === 'minimal_iso';
  const tableHeaderStyle: React.CSSProperties = isModernGrid
    ? { backgroundColor: effectiveFormat.accentColor || '#0f172a', color: '#ffffff' }
    : isMinimalGrid
    ? { backgroundColor: '#f8fafc', color: '#0f172a', borderBottom: `2px solid ${effectiveFormat.accentColor || '#0f172a'}` }
    : { backgroundColor: '#f1f5f9', color: '#000000' };

  const colNo = effectiveFormat.colItemNoLabel || 'Item No';
  const colDesc = effectiveFormat.colDescriptionLabel || 'Item Description';
  const colUnit = effectiveFormat.colUnitLabel || 'Unit';
  const colQty = effectiveFormat.colQtyLabel || 'Quantity';
  const colSec = effectiveFormat.colSecondaryLabel || 'Category';
  const colRem = effectiveFormat.colRemarksLabel || 'Remarks / Condition';

  // Render items table based on document type
  const renderTableAndBody = () => {
    if (!document) {
      const displayTitle = effectiveFormat.customMainTitle || title || 'OFFICIAL INVENTORY VOUCHER';
      return (
        <div className="space-y-4">
          <div className="text-center my-2">
            <h2
              className="text-sm font-extrabold uppercase tracking-wide inline-block px-4 py-1 rounded"
              style={
                isModernGrid
                  ? { backgroundColor: effectiveFormat.accentColor || '#0f172a', color: '#ffffff' }
                  : { color: effectiveFormat.accentColor || '#0f172a' }
              }
            >
              {displayTitle}
            </h2>
          </div>

          {(recipientName || recipientLabel || notes) && (
            <div className="grid grid-cols-2 gap-4 bg-slate-50/90 p-3 rounded border border-slate-300 text-[11px] text-slate-700 mb-2">
              <div>
                <div className="font-bold text-slate-900 mb-0.5">
                  {recipientLabel || 'RECIPIENT / DESTINATION'}:
                </div>
                <div className="font-semibold text-slate-900">{recipientName}</div>
                {recipientSubDetails && <div className="text-[10px] text-slate-600">{recipientSubDetails}</div>}
              </div>
              <div>
                <div className="font-bold text-slate-900 mb-0.5">PURPOSE / NOTES:</div>
                <div className="text-slate-600 text-[10px]">{notes || 'Standard logistics transaction processed.'}</div>
              </div>
            </div>
          )}

          <div className="border border-black">
            <table className="w-full text-[10.5px] border-collapse">
              <thead>
                <tr className="font-bold text-center border-b border-black" style={tableHeaderStyle}>
                  <th className="py-1.5 px-1.5 w-[7%] border-r border-black/40 font-extrabold">{colNo}</th>
                  <th className="py-1.5 px-2 w-[41%] text-left border-r border-black/40 font-extrabold">{colDesc}</th>
                  <th className="py-1.5 px-1 w-[14%] border-r border-black/40 font-extrabold">{colSec}</th>
                  <th className="py-1.5 px-1 w-[8%] border-r border-black/40 font-extrabold">{colUnit}</th>
                  <th className="py-1.5 px-1.5 w-[14%] border-r border-black/40 font-extrabold text-right">{colQty}</th>
                  <th className="py-1.5 px-2 w-[16%] text-left font-extrabold">{colRem}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black text-black bg-white/90">
                {!customItems || customItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-500 italic">
                      No material items specified in this voucher.
                    </td>
                  </tr>
                ) : (
                  customItems.map((item, idx) => (
                    <tr key={idx} className="h-6">
                      <td className="py-1 px-1.5 text-center font-mono border-r border-black">{idx + 1}</td>
                      <td className="py-1 px-2 text-left border-r border-black font-medium">
                        <span className="font-mono font-bold mr-1.5">{item.itemCode}</span>
                        <span>{item.itemName}</span>
                      </td>
                      <td className="py-1 px-1 text-center border-r border-black text-slate-600">{item.category || 'General'}</td>
                      <td className="py-1 px-1 text-center font-mono border-r border-black">{item.unit || 'Nos'}</td>
                      <td className="py-1 px-1.5 text-right font-mono font-bold border-r border-black">{formatNumber(item.quantity)}</td>
                      <td className="py-1 px-2 text-left text-slate-600 text-[10px]">{item.remarks || 'Verified / Logged'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    switch (document.type) {
      case 'REQUEST_NOTE': {
        const req = document.data;
        const site = sites.find((s) => s.id === req.siteId);
        return (
          <div className="space-y-4">
            <div className="text-center my-2">
              <h2
                className="text-sm font-extrabold uppercase tracking-wide inline-block px-4 py-1 rounded"
                style={
                  isModernGrid
                    ? { backgroundColor: effectiveFormat.accentColor || '#0f172a', color: '#ffffff' }
                    : { color: effectiveFormat.accentColor || '#0f172a' }
                }
              >
                {effectiveFormat.customMainTitle || 'MATERIAL REQUISITION & TRANSFER NOTE'}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50/90 p-3 rounded border border-slate-300 text-[11px] text-slate-700 mb-2">
              <div>
                <div className="font-bold text-slate-900">SOURCE WAREHOUSE:</div>
                <div>Main Central Warehouse (HQ Logistics)</div>
                <div className="mt-1 font-bold text-slate-900">REQUISITION PURPOSE:</div>
                <div className="italic text-[10px]">{req.purpose || 'Site maintenance & installation project'}</div>
              </div>
              <div>
                <div className="font-bold text-slate-900">DESTINATION BRANCH SITE:</div>
                <div className="font-semibold text-slate-900">{site?.name}</div>
                <div>Location: {site?.location} | Supervisor: {site?.supervisorName}</div>
                <div className="mt-1 font-mono text-[10px]">
                  Priority: <strong className="text-slate-900">{req.priority}</strong> | Status: <strong>{req.status}</strong>
                </div>
              </div>
            </div>

            <div className="border border-black">
              <table className="w-full text-[10.5px] border-collapse">
                <thead>
                  <tr className="font-bold text-center border-b border-black" style={tableHeaderStyle}>
                    <th className="py-1.5 px-1.5 w-[6%] border-r border-black/40 font-extrabold">{colNo}</th>
                    <th className="py-1.5 px-2 w-[42%] text-left border-r border-black/40 font-extrabold">{colDesc}</th>
                    <th className="py-1.5 px-1 w-[8%] border-r border-black/40 font-extrabold">{colUnit}</th>
                    <th className="py-1.5 px-1.5 w-[14%] border-r border-black/40 font-extrabold text-right">Requested Qty</th>
                    <th className="py-1.5 px-1.5 w-[14%] border-r border-black/40 font-extrabold text-right">Approved Qty</th>
                    <th className="py-1.5 px-1.5 w-[16%] text-right font-extrabold">Received Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black text-black bg-white/90">
                  {req.items.map((row, idx) => {
                    const itm = items.find((i) => i.id === row.itemId);
                    return (
                      <tr key={row.itemId} className="h-6">
                        <td className="py-1 px-1.5 text-center font-mono border-r border-black">{idx + 1}</td>
                        <td className="py-1 px-2 text-left border-r border-black font-medium">
                          <span className="font-mono font-bold mr-1.5">{itm?.itemCode}</span>
                          {itm && isMachineryItem(itm) && (
                            <span className="text-[9px] font-bold bg-slate-200 px-1 py-0.2 rounded mr-1">
                              [Machinery]
                            </span>
                          )}
                          <span>{itm?.itemName}</span>
                        </td>
                        <td className="py-1 px-1 text-center font-mono border-r border-black">{itm?.unit}</td>
                        <td className="py-1 px-1.5 text-right font-mono border-r border-black">{formatNumber(row.requestedQty)}</td>
                        <td className="py-1 px-1.5 text-right font-mono font-medium border-r border-black">
                          {row.approvedQty !== undefined ? formatNumber(row.approvedQty) : '—'}
                        </td>
                        <td className="py-1 px-1.5 text-right font-mono font-bold text-slate-900">
                          {row.receivedQty !== undefined ? formatNumber(row.receivedQty) : (row.approvedQty ? formatNumber(row.approvedQty) : '—')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {req.acceptanceNotes && (
              <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-700">
                <strong className="text-slate-900">Site Receiving Remarks:</strong> {req.acceptanceNotes}
              </div>
            )}
          </div>
        );
      }

      case 'ISSUE_NOTE': {
        const iss = document.data;
        const site = sites.find((s) => s.id === iss.siteId);
        const team = teams.find((t) => t.id === iss.teamId);
        return (
          <div className="space-y-4">
            <div className="text-center my-2">
              <h2
                className="text-sm font-extrabold uppercase tracking-wide inline-block px-4 py-1 rounded"
                style={
                  isModernGrid
                    ? { backgroundColor: effectiveFormat.accentColor || '#0f172a', color: '#ffffff' }
                    : { color: effectiveFormat.accentColor || '#0f172a' }
                }
              >
                {effectiveFormat.customMainTitle || 'DAILY FIELD DISPATCH & ISSUE NOTE'}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50/90 p-3 rounded border border-slate-300 text-[11px] text-slate-700 mb-2">
              <div>
                <div className="font-bold text-slate-900">ISSUED TO FIELD TEAM:</div>
                <div className="font-bold text-slate-900">{team?.teamName}</div>
                <div>Team Leader: <strong className="text-slate-900">{team?.teamLeaderName}</strong></div>
                <div>Phone: {team?.contactPhone} | Crew: {team?.crewSize} technicians</div>
              </div>
              <div>
                <div className="font-bold text-slate-900">ISSUING BRANCH & PROJECT:</div>
                <div>Branch Yard: <strong className="text-slate-900">{site?.name}</strong></div>
                <div>Work Order / Ref: <span className="font-mono font-semibold">{iss.workOrderRef}</span></div>
                <div>Issued By: <span className="font-medium">{iss.issuedBy}</span></div>
              </div>
            </div>

            <div className="border border-black">
              <table className="w-full text-[10.5px] border-collapse">
                <thead>
                  <tr className="font-bold text-center border-b border-black" style={tableHeaderStyle}>
                    <th className="py-1.5 px-1.5 w-[6%] border-r border-black/40 font-extrabold">{colNo}</th>
                    <th className="py-1.5 px-2 w-[48%] text-left border-r border-black/40 font-extrabold">{colDesc}</th>
                    <th className="py-1.5 px-1 w-[10%] border-r border-black/40 font-extrabold">{colUnit}</th>
                    <th className="py-1.5 px-1.5 w-[18%] border-r border-black/40 font-extrabold text-right">{colQty}</th>
                    <th className="py-1.5 px-2 w-[18%] text-left font-extrabold">{colRem}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black text-black bg-white/90">
                  {iss.items.map((row, idx) => {
                    const itm = items.find((i) => i.id === row.itemId);
                    return (
                      <tr key={row.itemId} className="h-6">
                        <td className="py-1 px-1.5 text-center font-mono border-r border-black">{idx + 1}</td>
                        <td className="py-1 px-2 text-left border-r border-black font-medium">
                          <span className="font-mono font-bold mr-1.5">{itm?.itemCode}</span>
                          <span>{itm?.itemName}</span>
                        </td>
                        <td className="py-1 px-1 text-center font-mono border-r border-black">{itm?.unit}</td>
                        <td className="py-1 px-1.5 text-right font-mono font-bold text-slate-900 border-r border-black">
                          {formatNumber(row.quantity)}
                        </td>
                        <td className="py-1 px-2 text-left text-slate-600 text-[10px]">Issued to Crew</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {iss.notes && (
              <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-700">
                <strong className="text-slate-900">Dispatch Remarks:</strong> {iss.notes}
              </div>
            )}
          </div>
        );
      }

      case 'RETURN_VOUCHER': {
        const ret = document.data;
        const site = sites.find((s) => s.id === ret.siteId);
        const team = teams.find((t) => t.id === ret.teamId);
        return (
          <div className="space-y-4">
            <div className="text-center my-2">
              <h2
                className="text-sm font-extrabold uppercase tracking-wide inline-block px-4 py-1 rounded"
                style={
                  isModernGrid
                    ? { backgroundColor: effectiveFormat.accentColor || '#0f172a', color: '#ffffff' }
                    : { color: effectiveFormat.accentColor || '#0f172a' }
                }
              >
                {effectiveFormat.customMainTitle || 'TEAM STOCK RETURN VOUCHER (TO BRANCH YARD)'}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50/90 p-3 rounded border border-slate-300 text-[11px] text-slate-700 mb-2">
              <div>
                <div className="font-bold text-slate-900">RETURNING FIELD TEAM:</div>
                <div className="font-bold text-slate-900">{team?.teamName}</div>
                <div>Leader: {team?.teamLeaderName} | Returned By: {ret.returnedBy}</div>
              </div>
              <div>
                <div className="font-bold text-slate-900">RECEIVING BRANCH SITE:</div>
                <div className="font-semibold text-slate-900">{site?.name}</div>
                <div>Location: {site?.location} | Supervisor: {site?.supervisorName}</div>
              </div>
            </div>

            <div className="border border-black">
              <table className="w-full text-[10.5px] border-collapse">
                <thead>
                  <tr className="font-bold text-center border-b border-black" style={tableHeaderStyle}>
                    <th className="py-1.5 px-1.5 w-[6%] border-r border-black/40 font-extrabold">{colNo}</th>
                    <th className="py-1.5 px-2 w-[44%] text-left border-r border-black/40 font-extrabold">{colDesc}</th>
                    <th className="py-1.5 px-1 w-[8%] border-r border-black/40 font-extrabold">{colUnit}</th>
                    <th className="py-1.5 px-1.5 w-[14%] border-r border-black/40 font-extrabold text-right">{colQty}</th>
                    <th className="py-1.5 px-1.5 w-[14%] border-r border-black/40 font-extrabold text-center">{colSec}</th>
                    <th className="py-1.5 px-2 w-[14%] text-left font-extrabold">{colRem}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black text-black bg-white/90">
                  {(() => {
                    const itm = items.find((i) => i.id === ret.itemId);
                    return (
                      <tr className="h-6">
                        <td className="py-1 px-1.5 text-center font-mono border-r border-black">1</td>
                        <td className="py-1 px-2 text-left border-r border-black font-medium">
                          <span className="font-mono font-bold mr-1.5">{itm?.itemCode || 'CODE'}</span>
                          <span>{itm?.itemName || 'Material Item'}</span>
                        </td>
                        <td className="py-1 px-1 text-center font-mono border-r border-black">{itm?.unit || 'Nos'}</td>
                        <td className="py-1 px-1.5 text-right font-mono font-bold text-slate-900 border-r border-black">
                          {formatNumber(ret.quantity)}
                        </td>
                        <td className="py-1 px-1.5 text-center text-[10px] font-semibold border-r border-black">{ret.condition}</td>
                        <td className="py-1 px-2 text-left text-slate-600 text-[10px]">{ret.reason}</td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'TEAM_STOCK_REPORT': {
        const rep = document.data;
        return (
          <div className="space-y-4">
            <div className="text-center my-2">
              <h2
                className="text-sm font-extrabold uppercase tracking-wide inline-block px-4 py-1 rounded"
                style={
                  isModernGrid
                    ? { backgroundColor: effectiveFormat.accentColor || '#0f172a', color: '#ffffff' }
                    : { color: effectiveFormat.accentColor || '#0f172a' }
                }
              >
                {effectiveFormat.customMainTitle || 'FIELD TEAM IN-HAND STOCK BALANCE AUDIT'}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50/90 p-3 rounded border border-slate-300 text-[11px] text-slate-700 mb-2">
              <div>
                <div className="font-bold text-slate-900">AUDITED FIELD TEAM:</div>
                <div className="font-bold text-slate-900">{rep.team.teamName}</div>
                <div>Leader: {rep.team.teamLeaderName} | Crew Size: {rep.team.crewSize}</div>
              </div>
              <div>
                <div className="font-bold text-slate-900">ATTACHED BRANCH SITE:</div>
                <div className="font-semibold text-slate-900">{rep.site.name}</div>
                <div>Total Units in Hand: <strong className="font-mono">{formatNumber(rep.totalUnitsHeld)}</strong></div>
              </div>
            </div>

            <div className="border border-black">
              <table className="w-full text-[10.5px] border-collapse">
                <thead>
                  <tr className="font-bold text-center border-b border-black" style={tableHeaderStyle}>
                    <th className="py-1.5 px-1.5 w-[6%] border-r border-black/40 font-extrabold">{colNo}</th>
                    <th className="py-1.5 px-2 w-[44%] text-left border-r border-black/40 font-extrabold">{colDesc}</th>
                    <th className="py-1.5 px-1 w-[8%] border-r border-black/40 font-extrabold">{colUnit}</th>
                    <th className="py-1.5 px-1.5 w-[14%] border-r border-black/40 font-extrabold text-right">Total Issued</th>
                    <th className="py-1.5 px-1.5 w-[14%] border-r border-black/40 font-extrabold text-right">Total Returned</th>
                    <th className="py-1.5 px-1.5 w-[14%] text-right font-extrabold">In Hand Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black text-black bg-white/90">
                  {rep.items.map((row, idx) => (
                    <tr key={row.itemId} className="h-6">
                      <td className="py-1 px-1.5 text-center font-mono border-r border-black">{idx + 1}</td>
                      <td className="py-1 px-2 text-left border-r border-black font-medium">
                        <span className="font-mono font-bold mr-1.5">{row.itemCode}</span>
                        <span>{row.itemName}</span>
                      </td>
                      <td className="py-1 px-1 text-center font-mono border-r border-black">{row.unit}</td>
                      <td className="py-1 px-1.5 text-right font-mono border-r border-black">{formatNumber(row.totalIssued)}</td>
                      <td className="py-1 px-1.5 text-right font-mono border-r border-black">{formatNumber(row.totalReturned)}</td>
                      <td className="py-1 px-1.5 text-right font-mono font-bold text-slate-900">{formatNumber(row.currentInHand)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col border border-slate-200">
        {/* Top Control Bar (Hidden on window.print()) */}
        <div className="no-print px-5 py-3 border-b border-slate-200 bg-slate-900 text-white rounded-t-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                <span>Official Voucher Print Preview</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {formatGroupMeta.groupCode} {effectiveFormat.isCustomUploaded ? '• Custom Format Active' : '• Standard Format'}
                </span>
              </div>
              <div className="text-[10px] text-slate-300">
                Template: <strong className="text-emerald-300">{activeTemplate.templateName}</strong>
                {effectiveFormat.uploadedFileName && (
                  <span className="ml-2 text-amber-300 font-semibold">
                    (Uploaded Ref: {effectiveFormat.uploadedFileName})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Template Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
              <span className="text-[11px] text-slate-400">Template:</span>
              <select
                value={currentTemplateId}
                onChange={(e) => {
                  setCurrentTemplateId(e.target.value);
                  setActiveTemplateId(e.target.value);
                }}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {letterheadTemplates.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.templateName}
                  </option>
                ))}
              </select>
            </div>

            {/* Customize Signers & Designations Toggle */}
            <button
              type="button"
              onClick={() => setShowSignerEditor(!showSignerEditor)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                showSignerEditor
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showSignerEditor ? 'Close Signers Editor' : '✏️ Edit Signers & Designations'}</span>
            </button>

            {/* Save as PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isProcessing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                isProcessing
                  ? 'bg-slate-700 text-slate-300 cursor-wait'
                  : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white border border-slate-700'
              }`}
              title="Download genuine .pdf document file directly"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Generating PDF...' : 'Convert / Save as PDF'}</span>
            </button>

            {/* Print Voucher Button */}
            <button
              onClick={handlePrint}
              disabled={isProcessing}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                isProcessing
                  ? 'bg-emerald-800 text-emerald-200 cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
              title="Open browser print dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Printing...' : 'Print Voucher'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {statusNotice && (
          <div className="no-print bg-emerald-950 text-emerald-200 px-5 py-2 text-xs font-semibold border-b border-emerald-800 flex items-center justify-between">
            <span>{statusNotice}</span>
          </div>
        )}

        {/* CUSTOMIZE SIGNERS & DESIGNATIONS INLINE DRAWER (Non-print) */}
        {showSignerEditor && (
          <div className="no-print bg-amber-50 border-b border-amber-200 p-4 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-700" />
                <span>Quick Signers, Designations & Metadata Customizer:</span>
              </div>
              <button
                type="button"
                onClick={handleSaveAsTemplateDefault}
                className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded border border-emerald-300 transition-colors"
              >
                Save as Default for Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Prepared By Signer & Designation */}
              <div className="bg-white p-2.5 rounded border border-amber-200 space-y-2">
                <div className="font-bold text-slate-800 text-[11px]">
                  {effectiveFormat.signPreparedLabel || 'Prepared / Checked By'}:
                </div>
                <input
                  type="text"
                  value={customPreparedBy}
                  onChange={(e) => setCustomPreparedBy(e.target.value)}
                  placeholder="Signer Name"
                  className="w-full p-1 border rounded text-xs font-bold"
                />
                <input
                  type="text"
                  value={customDesigneePrepared}
                  onChange={(e) => setCustomDesigneePrepared(e.target.value)}
                  placeholder="Designation (e.g. Site In-Charge)"
                  className="w-full p-1 border rounded text-xs text-slate-700"
                />
                <select
                  value={customPreparedSigId}
                  onChange={(e) => setCustomPreparedSigId(e.target.value)}
                  className="w-full p-1 border rounded text-[11px] bg-slate-50"
                >
                  <option value="">Auto-match Digital Signature</option>
                  {digitalSignatures.map((s) => (
                    <option key={s.id} value={s.id}>
                      🖋️ {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Approved By Signer & Designation */}
              <div className="bg-white p-2.5 rounded border border-amber-200 space-y-2">
                <div className="font-bold text-slate-800 text-[11px]">
                  {effectiveFormat.signApprovedLabel || 'Approved By'}:
                </div>
                <input
                  type="text"
                  value={customApprovedBy}
                  onChange={(e) => setCustomApprovedBy(e.target.value)}
                  placeholder="Signer Name"
                  className="w-full p-1 border rounded text-xs font-bold"
                />
                <input
                  type="text"
                  value={customDesigneeApproved}
                  onChange={(e) => setCustomDesigneeApproved(e.target.value)}
                  placeholder="Designation (e.g. Central Project Engineer)"
                  className="w-full p-1 border rounded text-xs text-slate-700"
                />
                <select
                  value={customApprovedSigId}
                  onChange={(e) => setCustomApprovedSigId(e.target.value)}
                  className="w-full p-1 border rounded text-[11px] bg-slate-50"
                >
                  <option value="">Auto-match Digital Signature</option>
                  {digitalSignatures.map((s) => (
                    <option key={s.id} value={s.id}>
                      🖋️ {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reviewer, Project Code & Location */}
              <div className="bg-white p-2.5 rounded border border-amber-200 space-y-2">
                <div className="font-bold text-slate-800 text-[11px]">Voucher Reference & Location:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={customProjectCode}
                    onChange={(e) => setCustomProjectCode(e.target.value)}
                    placeholder="Project Code"
                    className="p-1 border rounded text-xs font-mono font-bold"
                  />
                  <input
                    type="text"
                    value={customSiteLocation}
                    onChange={(e) => setCustomSiteLocation(e.target.value)}
                    placeholder="Location"
                    className="p-1 border rounded text-xs uppercase font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={customReviewedBy}
                    onChange={(e) => setCustomReviewedBy(e.target.value)}
                    placeholder="Reviewed By"
                    className="p-1 border rounded text-xs"
                  />
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="p-1 border rounded text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRINTABLE VOUCHER SHEET BODY */}
        <div className="p-6 sm:p-8 overflow-y-auto printable-document bg-white">
          <div
            id="letterhead-printable-area"
            className="printable-voucher-sheet text-black font-sans leading-tight max-w-[820px] mx-auto bg-white relative"
          >
            {/* Optional Full-Page Stationery Background Overlay */}
            {effectiveFormat.isCustomUploaded &&
              effectiveFormat.renderMode === 'full_page_stationery' &&
              effectiveFormat.uploadedFileDataUrl && (
                <div className="pointer-events-none mb-3 border border-slate-200 rounded overflow-hidden">
                  <img
                    src={effectiveFormat.uploadedHeaderBannerDataUrl || effectiveFormat.uploadedFileDataUrl}
                    alt="Uploaded Company Format Header"
                    className="w-full max-h-[190px] object-contain mx-auto bg-white"
                  />
                </div>
              )}

            {/* 1. HEADER BANNER (Either Uploaded Header Banner OR Dynamic Company Letterhead) */}
            {effectiveFormat.isCustomUploaded &&
            effectiveFormat.renderMode === 'uploaded_header_banner' &&
            effectiveFormat.uploadedHeaderBannerDataUrl ? (
              <div className="pb-2 mb-2 border-b-2 border-black">
                <img
                  src={effectiveFormat.uploadedHeaderBannerDataUrl}
                  alt="Company Uploaded Format Header"
                  className="w-full max-h-[180px] object-contain mx-auto"
                />
              </div>
            ) : !(
                effectiveFormat.isCustomUploaded &&
                effectiveFormat.renderMode === 'full_page_stationery' &&
                effectiveFormat.uploadedFileDataUrl
              ) ? (
              <>
                <div className="text-center pb-2">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    {activeTemplate.logoType === 'image' && activeTemplate.logoImage ? (
                      <img
                        src={activeTemplate.logoImage}
                        alt="Company Logo"
                        className="h-9 max-w-[120px] object-contain"
                      />
                    ) : (
                      <div
                        className="w-10 h-7 rounded-full text-white flex items-center justify-center text-[10px] font-black tracking-widest uppercase"
                        style={{ backgroundColor: effectiveFormat.accentColor || '#000000' }}
                      >
                        {activeTemplate.logoText || 'COM'}
                      </div>
                    )}
                    <h1
                      className="text-xl sm:text-2xl font-black font-serif tracking-tight uppercase"
                      style={{ color: effectiveFormat.accentColor || '#000000' }}
                    >
                      {activeTemplate.companyName || 'COMTEC SYSTEMS (PVT) LTD.'}
                    </h1>
                  </div>

                  <p className="text-[9px] sm:text-[9.5px] leading-tight text-slate-900 max-w-2xl mx-auto font-sans font-medium">
                    {activeTemplate.subtitle ||
                      'Civil Contractors, Telecommunication Engineers and Transport Services, Building Maintenance, and Earth movers, Road Contractors, J.C.B.Backhoe Loader, Boom Truck, Drum Truck, Lories, Excavators, Forklift for Hire. Building Material suppliers.'}
                  </p>

                  <div className="flex justify-between items-start text-[9.5px] font-sans font-medium text-slate-900 mt-2 px-2 border-t pt-1">
                    <div className="text-left space-y-0.5">
                      <div>
                        Tel: <span className="font-mono">{activeTemplate.tel || '+94 11 2549590'}</span>
                      </div>
                      <div>
                        Fax: <span className="font-mono">{activeTemplate.fax || '+94 11 2549591'}</span>
                      </div>
                      <div>
                        E-mail: <span className="font-mono underline">{activeTemplate.email || 'apexdevinfo@gmail.com'}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div>{activeTemplate.address || 'No: 36, Udumulla, Malgama Road, Himbutana, Mulleriyawa.'}</div>
                    </div>
                  </div>
                </div>
                <div
                  className="border-t-2 my-1.5"
                  style={{ borderColor: effectiveFormat.accentColor || '#000000' }}
                ></div>
              </>
            ) : null}

            {/* 2. THREE-BOX METADATA BAR */}
            {effectiveFormat.showMetadataThreeBox !== false && (
              <div className="border border-black flex items-stretch text-xs divide-x divide-black my-2">
                <div className="w-1/3 p-1.5 flex items-center justify-between">
                  <span className="font-bold text-[11px]">DATE OF DOC:</span>
                  <span className="font-mono font-bold text-xs">{customDate || new Date().toISOString().split('T')[0]}</span>
                </div>
                <div className="w-1/3 p-1.5 text-center flex items-center justify-center font-bold">
                  <span className="mr-1">DOCUMENT NO -</span>
                  <span className="font-mono font-black text-xs underline">{customDocNumber}</span>
                </div>
                <div className="w-1/3 p-1 text-center font-bold text-[11px] leading-tight flex flex-col justify-center">
                  <div className="font-mono text-black font-extrabold">{customProjectCode || 'QP 2B'}</div>
                  <div className="text-red-700 font-black uppercase text-[10px] tracking-wide">{customSiteLocation || 'MATALE'}</div>
                </div>
              </div>
            )}

            {/* 3. DYNAMIC CONTENT & TABLE */}
            {renderTableAndBody()}

            {/* 4. APPROVAL & SIGN-OFF MATRIX WITH DYNAMIC NAMES & DESIGNATIONS */}
            <div className="border border-black text-[10px] mt-4 bg-white/95">
              <table className="w-full border-collapse">
                <tbody>
                  {/* Row 1: Prepared & Checked By */}
                  <tr className="border-b border-black">
                    <td className="w-1/4 p-1.5 font-bold border-r border-black">
                      <div className="text-[9px] text-slate-500 font-sans">Date</div>
                      <div className="font-mono font-bold">{customDate || new Date().toISOString().split('T')[0]}</div>
                    </td>
                    <td className="w-1/4 p-1.5 border-r border-black">
                      <div className="text-[9px] text-slate-600 font-bold">
                        {effectiveFormat.signPreparedLabel || 'Prepared & Checked By'}
                      </div>
                      {prepSig && (
                        <div className="h-8 flex items-center justify-start my-0.5">
                          <img
                            src={prepSig.signatureDataUrl}
                            alt="Prepared Signature"
                            className="max-h-7 max-w-[130px] object-contain mix-blend-multiply"
                          />
                        </div>
                      )}
                      <div className="font-bold text-[11px] text-slate-900">{customPreparedBy || 'Dissanayake'}</div>
                    </td>
                    <td className="w-1/4 p-1.5 border-r border-black">
                      <div className="text-[9px] text-slate-600 font-bold">Designee</div>
                      <div className="font-medium text-slate-800 text-[10.5px]">
                        {customDesigneePrepared || activeTemplate.designeePrepared || 'Site In-Charge'}
                      </div>
                    </td>
                    <td className="w-1/4 p-1.5">
                      <div className="text-[9px] text-slate-600 font-bold">Department</div>
                      <div className="font-medium text-slate-800 text-[10.5px]">
                        {customDepartmentPrepared || activeTemplate.departmentPrepared || 'Civil & Telecom Operations'}
                      </div>
                    </td>
                  </tr>

                  {/* Row 2: Approved by */}
                  <tr className={effectiveFormat.showIsoRevisionFooter !== false ? 'border-b border-black' : ''}>
                    <td className="w-1/4 p-1.5 font-bold border-r border-black">
                      <div className="text-[9px] text-slate-500 font-sans">Date</div>
                      <div className="font-mono font-bold">{customDate || new Date().toISOString().split('T')[0]}</div>
                    </td>
                    <td className="w-1/4 p-1.5 border-r border-black">
                      <div className="text-[9px] text-slate-600 font-bold">
                        {effectiveFormat.signApprovedLabel || 'Approved By'}
                      </div>
                      {apprSig && (
                        <div className="h-8 flex items-center justify-start my-0.5">
                          <img
                            src={apprSig.signatureDataUrl}
                            alt="Approved Signature"
                            className="max-h-7 max-w-[130px] object-contain mix-blend-multiply"
                          />
                        </div>
                      )}
                      <div className="font-bold text-[11px] text-slate-900">{customApprovedBy || 'Arthur Vance'}</div>
                    </td>
                    <td className="w-1/4 p-1.5 border-r border-black">
                      <div className="text-[9px] text-slate-600 font-bold">Designee</div>
                      <div className="font-medium text-slate-800 text-[10.5px]">
                        {customDesigneeApproved || activeTemplate.designeeApproved || 'Central Project Engineer'}
                      </div>
                    </td>
                    <td className="w-1/4 p-1.5">
                      <div className="text-[9px] text-slate-600 font-bold">Department</div>
                      <div className="font-medium text-slate-800 text-[10.5px]">
                        {customDepartmentApproved || activeTemplate.departmentApproved || 'Central Logistics & Procurement'}
                      </div>
                    </td>
                  </tr>

                  {/* Row 3: Issue No & Revision Matrix */}
                  {effectiveFormat.showIsoRevisionFooter !== false && (
                    <tr>
                      <td colSpan={2} className="p-1 border-r border-black">
                        <div className="grid grid-cols-2 text-[9px] gap-x-2">
                          <div>
                            Issue NO: <strong className="font-mono">{customIssueNo || activeTemplate.issueNo || '01'}</strong>
                          </div>
                          <div>
                            Date Of Issue: <span className="font-mono">{customDate || new Date().toISOString().split('T')[0]}</span>
                          </div>
                          <div>
                            Revision No: <strong className="font-mono">{customRevisionNo || activeTemplate.revisionNo || '00'}</strong>
                          </div>
                          <div>
                            Date of Rev: <span className="font-mono">{customDate || new Date().toISOString().split('T')[0]}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-1 border-r border-black">
                        <div className="text-[8.5px] text-slate-500">
                          {effectiveFormat.signThirdLabel || 'Reviewed By'}
                        </div>
                        {revSig && (
                          <div className="h-5 flex items-center justify-start my-0.2">
                            <img
                              src={revSig.signatureDataUrl}
                              alt="Reviewed Signature"
                              className="max-h-4 max-w-[80px] object-contain mix-blend-multiply"
                            />
                          </div>
                        )}
                        <div className="font-bold text-[9.5px]">{customReviewedBy || activeTemplate.reviewedBy || 'Dissanayake'}</div>
                      </td>
                      <td className="p-1">
                        <div className="text-[8.5px] text-slate-500">
                          {effectiveFormat.signApprovedLabel || 'Approved BY'}
                        </div>
                        {apprSig && (
                          <div className="h-5 flex items-center justify-start my-0.2">
                            <img
                              src={apprSig.signatureDataUrl}
                              alt="Approved Signature"
                              className="max-h-4 max-w-[80px] object-contain mix-blend-multiply"
                            />
                          </div>
                        )}
                        <div className="font-bold text-[9.5px]">{customApprovedBy || activeTemplate.approvedBy || 'Arthur Vance'}</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Form ID Print Watermark */}
            <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono mt-2 pt-1 border-t border-slate-200">
              <span>Form Ref: {effectiveFormat.formRefCode || 'CTS-MAT-REQ-022 / QP 2B'} • {customSiteLocation}</span>
              <span>Generated via Apex Stock Management System · {activeTemplate.companyName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
