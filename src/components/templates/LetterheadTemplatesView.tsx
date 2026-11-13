import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Edit3,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Copy,
  PenTool,
  Upload,
  RotateCcw,
  Eye,
  Building2,
  UserCheck,
  Award,
  Sparkles,
  Info,
  Printer,
  Download,
  Layers,
  Sliders,
  FileUp,
  Image as ImageIcon,
  CheckSquare,
  ArrowRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  LetterheadTemplate,
  DocumentFormatGroupId,
  SectionFormatConfig,
  FormatRenderMode,
  FormatGridStyle,
} from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { PrintableDocumentModal } from '../common/PrintableDocumentModal';
import { printHtmlElement, downloadElementAsPdf } from '../../utils/printUtils';
import {
  COMPANY_FORMAT_GROUPS,
  FormatGroupDefinition,
  analyzeUploadedFormatFile,
  recropHeaderBannerFromImage,
} from '../../utils/formatAnalyzerUtils';

export const LetterheadTemplatesView: React.FC = () => {
  const {
    letterheadTemplates,
    activeTemplateId,
    activeTemplate,
    setActiveTemplateId,
    updateLetterheadTemplate,
    addLetterheadTemplate,
    deleteLetterheadTemplate,
    digitalSignatures,
    addDigitalSignature,
    deleteDigitalSignature,
    sectionFormats,
    updateSectionFormat,
    resetSectionFormat,
    getEffectiveSectionFormat,
  } = useStock();

  const [activeTab, setActiveTab] = useState<'section-formats' | 'templates' | 'signatures'>('section-formats');

  // ------------------ SECTION FORMAT UPLOADER & STUDIO STATE ------------------
  const [editingGroupId, setEditingGroupId] = useState<DocumentFormatGroupId>('REQUISITION_ISSUE_USAGE');
  const [uploadingGroupId, setUploadingGroupId] = useState<DocumentFormatGroupId | null>(null);
  const [draftFormat, setDraftFormat] = useState<SectionFormatConfig>(() =>
    getEffectiveSectionFormat('REQUISITION_ISSUE_USAGE')
  );
  const [testPrintGroupId, setTestPrintGroupId] = useState<DocumentFormatGroupId | null>(null);

  // Sync draftFormat when editingGroupId or sectionFormats changes
  useEffect(() => {
    const current = sectionFormats[editingGroupId];
    if (current) {
      setDraftFormat({ ...current });
    }
  }, [editingGroupId, sectionFormats]);

  // Currently selected template for editing in Tab 2
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(activeTemplateId);

  // Form State for Tab 2 (Master Letterhead)
  const [templateName, setTemplateName] = useState(activeTemplate.templateName);
  const [companyName, setCompanyName] = useState(activeTemplate.companyName);
  const [subtitle, setSubtitle] = useState(activeTemplate.subtitle);
  const [tel, setTel] = useState(activeTemplate.tel);
  const [fax, setFax] = useState(activeTemplate.fax);
  const [email, setEmail] = useState(activeTemplate.email);
  const [address, setAddress] = useState(activeTemplate.address);
  const [logoText, setLogoText] = useState(activeTemplate.logoText);
  const [logoType, setLogoType] = useState<'text' | 'image'>(activeTemplate.logoType || 'text');
  const [logoImage, setLogoImage] = useState<string>(activeTemplate.logoImage || '');
  const [designeePrepared, setDesigneePrepared] = useState(activeTemplate.designeePrepared);
  const [designeeApproved, setDesigneeApproved] = useState(activeTemplate.designeeApproved);
  const [departmentPrepared, setDepartmentPrepared] = useState(activeTemplate.departmentPrepared);
  const [departmentApproved, setDepartmentApproved] = useState(activeTemplate.departmentApproved);
  const [issueNo, setIssueNo] = useState(activeTemplate.issueNo);
  const [revisionNo, setRevisionNo] = useState(activeTemplate.revisionNo);
  const [reviewedBy, setReviewedBy] = useState(activeTemplate.reviewedBy);
  const [approvedBy, setApprovedBy] = useState(activeTemplate.approvedBy);
  const [preparedBy, setPreparedBy] = useState(activeTemplate.preparedBy || activeTemplate.reviewedBy || '');

  // Notifications
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete Template Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<LetterheadTemplate | null>(null);

  // New Signature Modal
  const [showSigModal, setShowSigModal] = useState(false);
  const [sigName, setSigName] = useState('');
  const [sigRole, setSigRole] = useState('Central Project Engineer');
  const [sigDept, setSigDept] = useState('Central Logistics & Procurement');
  const [sigInputMode, setSigInputMode] = useState<'draw' | 'upload'>('draw');
  const [sigDataUrl, setSigDataUrl] = useState('');
  const [deleteSigId, setDeleteSigId] = useState<string | null>(null);

  // Canvas drawing ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef<boolean>(false);

  // When selectedTemplateId changes, reload form
  useEffect(() => {
    const tpl = letterheadTemplates.find((t) => t.id === selectedTemplateId) || activeTemplate;
    if (tpl) {
      setTemplateName(tpl.templateName || '');
      setCompanyName(tpl.companyName || '');
      setSubtitle(tpl.subtitle || '');
      setTel(tpl.tel || '');
      setFax(tpl.fax || '');
      setEmail(tpl.email || '');
      setAddress(tpl.address || '');
      setLogoText(tpl.logoText || 'COM');
      setLogoType(tpl.logoType || 'text');
      setLogoImage(tpl.logoImage || '');
      setDesigneePrepared(tpl.designeePrepared || 'Site In-Charge');
      setDesigneeApproved(tpl.designeeApproved || 'Central Project Engineer');
      setDepartmentPrepared(tpl.departmentPrepared || 'Civil & Telecom Operations');
      setDepartmentApproved(tpl.departmentApproved || 'Central Logistics & Procurement');
      setIssueNo(tpl.issueNo || '01');
      setRevisionNo(tpl.revisionNo || '00');
      setReviewedBy(tpl.reviewedBy || 'Dissanayake');
      setApprovedBy(tpl.approvedBy || 'Arthur Vance');
      setPreparedBy(tpl.preparedBy || tpl.reviewedBy || 'Dissanayake');
    }
  }, [selectedTemplateId, letterheadTemplates]);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // ------------------ HANDLE PDF / IMAGE FORMAT UPLOAD FOR A GROUP ------------------
  const handleFormatFileUpload = async (
    groupId: DocumentFormatGroupId,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 15 * 1024 * 1024) {
      showFeedback('Please upload a PDF or Image file under 15MB.', 'error');
      return;
    }

    setUploadingGroupId(groupId);
    setEditingGroupId(groupId);

    try {
      const currentCfg = sectionFormats[groupId];
      const cropPct = currentCfg?.headerCropHeightPercent || 22;
      const analysis = await analyzeUploadedFormatFile(
        file,
        cropPct,
        activeTemplate.companyName || 'COMTEC SYSTEMS (PVT) LTD.'
      );

      const newConfig: SectionFormatConfig = {
        ...currentCfg,
        groupId,
        isCustomUploaded: true,
        uploadedFileName: file.name,
        uploadedFileType: analysis.fileType,
        uploadedFileDataUrl: analysis.fullPageDataUrl,
        uploadedHeaderBannerDataUrl: analysis.headerBannerDataUrl,
        headerCropHeightPercent: cropPct,
        // Automatically use the uploaded header banner + live system data table so the printed document matches their uploaded format
        renderMode: 'uploaded_header_banner',
        accentColor: analysis.detectedAccentColor || currentCfg.accentColor || '#0f172a',
        formRefCode: analysis.metadata.formRefCode || currentCfg.formRefCode,
        customMainTitle: analysis.metadata.detectedTitle || currentCfg.customMainTitle || '',
        signPreparedLabel: analysis.metadata.signPreparedLabel || currentCfg.signPreparedLabel,
        signApprovedLabel: analysis.metadata.signApprovedLabel || currentCfg.signApprovedLabel,
        signThirdLabel: analysis.metadata.signThirdLabel || currentCfg.signThirdLabel,
        extractedSummary: analysis.metadata.summaryText,
        linkedToGroupId: '',
        updatedAt: new Date().toISOString(),
      };

      updateSectionFormat(groupId, newConfig);
      setDraftFormat(newConfig);

      // If PDF contained company name, also offer/sync feedback
      const groupDef = COMPANY_FORMAT_GROUPS.find((g) => g.groupId === groupId);
      const affectedCount = groupDef?.affectedSections.length || 1;
      showFeedback(
        `✓ "${file.name}" (${analysis.fileType.toUpperCase()}) converted into system format and applied across ${affectedCount} section(s)!`
      );
    } catch (err) {
      console.error('Format upload analysis error:', err);
      showFeedback('Could not process the uploaded file. Please try a valid PDF, PNG, or JPG.', 'error');
    } finally {
      setUploadingGroupId(null);
    }
  };

  // Handle Header Crop Slider Change
  const handleCropPercentChange = async (newPercent: number) => {
    setDraftFormat((prev) => ({ ...prev, headerCropHeightPercent: newPercent }));
    if (draftFormat.uploadedFileDataUrl) {
      const recropped = await recropHeaderBannerFromImage(draftFormat.uploadedFileDataUrl, newPercent);
      setDraftFormat((prev) => ({
        ...prev,
        headerCropHeightPercent: newPercent,
        uploadedHeaderBannerDataUrl: recropped,
      }));
    }
  };

  const handleSaveDraftFormat = (e: React.FormEvent) => {
    e.preventDefault();
    updateSectionFormat(editingGroupId, draftFormat);
    const groupDef = COMPANY_FORMAT_GROUPS.find((g) => g.groupId === editingGroupId);
    showFeedback(
      `✓ Saved format settings for "${groupDef?.title || editingGroupId}". All linked sections will now print with this format!`
    );
  };

  const handleToggleShareFormat01With02 = (share: boolean) => {
    const fmt02 = sectionFormats.RECEIPT_RETURN_FOC;
    const updated02: SectionFormatConfig = {
      ...fmt02,
      linkedToGroupId: share ? 'REQUISITION_ISSUE_USAGE' : '',
      updatedAt: new Date().toISOString(),
    };
    updateSectionFormat('RECEIPT_RETURN_FOC', updated02);
    if (editingGroupId === 'RECEIPT_RETURN_FOC') {
      setDraftFormat(updated02);
    }
    showFeedback(
      share
        ? '✓ Unified Format enabled! FORMAT-01 now applies to all 10 Requisition, Issue, Usage, GRN, FOC & Return sections.'
        : '✓ FORMAT-02 separated! You can now upload a dedicated format for GRN, FOC & Stock Returns.'
    );
  };

  // ------------------ TAB 2: MASTER LETTERHEAD HANDLERS ------------------
  const handleLogoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showFeedback('Logo image should be under 2MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (typeof evt.target?.result === 'string') {
        setLogoImage(evt.target.result);
        setLogoType('image');
        showFeedback('Logo image uploaded successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      showFeedback('Please enter a Template Name.', 'error');
      return;
    }

    const existingTpl = letterheadTemplates.find((t) => t.id === selectedTemplateId);
    const updatedTemplate: LetterheadTemplate = {
      id: selectedTemplateId,
      templateName: templateName.trim(),
      companyName: companyName.trim(),
      subtitle: subtitle.trim(),
      tel: tel.trim(),
      fax: fax.trim(),
      email: email.trim(),
      address: address.trim(),
      logoText: logoText.trim() || 'COM',
      logoType,
      logoImage: logoType === 'image' ? logoImage : undefined,
      designeePrepared: designeePrepared.trim(),
      designeeApproved: designeeApproved.trim(),
      departmentPrepared: departmentPrepared.trim(),
      departmentApproved: departmentApproved.trim(),
      issueNo: issueNo.trim() || '01',
      revisionNo: revisionNo.trim() || '00',
      reviewedBy: reviewedBy.trim(),
      approvedBy: approvedBy.trim(),
      preparedBy: preparedBy.trim(),
      paperSize: 'a4',
      orientation: 'portrait',
      sectionFormats: existingTpl?.sectionFormats || activeTemplate.sectionFormats,
    };

    updateLetterheadTemplate(updatedTemplate);
    showFeedback(`Template "${updatedTemplate.templateName}" and signers saved successfully!`);
  };

  const handleDuplicateTemplate = () => {
    const newTpl = addLetterheadTemplate({
      templateName: `${templateName} (Copy)`,
      companyName,
      subtitle,
      tel,
      fax,
      email,
      address,
      logoText,
      logoType,
      logoImage,
      designeePrepared,
      designeeApproved,
      departmentPrepared,
      departmentApproved,
      issueNo,
      revisionNo,
      reviewedBy,
      approvedBy,
      preparedBy,
      paperSize: 'a4',
      orientation: 'portrait',
      sectionFormats: activeTemplate.sectionFormats,
    });
    setSelectedTemplateId(newTpl.id);
    showFeedback(`Duplicated template as "${newTpl.templateName}".`);
  };

  const handleCreateNewTemplate = () => {
    const newTpl = addLetterheadTemplate({
      templateName: 'New Project Letterhead Format',
      companyName: 'PROJECT CONTRACTORS & LOGISTICS (PVT) LTD.',
      subtitle: 'Telecommunication Infrastructure, Fiber Optic Network Deployment, Civil Engineering & Power Supply.',
      tel: '+94 11 2000000',
      fax: '+94 11 2000001',
      email: 'operations@logistics.lk',
      address: 'Central Yard & Logistics Hub, Colombo, Sri Lanka.',
      logoText: 'PCL',
      logoType: 'text',
      logoImage: '',
      designeePrepared: 'Site In-Charge / Store Keeper',
      designeeApproved: 'Central Project Engineer',
      departmentPrepared: 'Field Construction Dept',
      departmentApproved: 'Central Logistics & Procurement',
      issueNo: '01',
      revisionNo: '00',
      reviewedBy: 'Site In-Charge',
      approvedBy: 'Arthur Vance',
      preparedBy: 'Store Keeper',
      paperSize: 'a4',
      orientation: 'portrait',
    });
    setSelectedTemplateId(newTpl.id);
    showFeedback('Created new letterhead template.');
  };

  const confirmDeleteTemplate = () => {
    if (!templateToDelete) return;
    if (letterheadTemplates.length <= 1) {
      showFeedback('Cannot delete the last remaining template.', 'error');
      setShowDeleteModal(false);
      return;
    }
    deleteLetterheadTemplate(templateToDelete.id);
    const remaining = letterheadTemplates.filter((t) => t.id !== templateToDelete.id);
    if (remaining.length > 0) {
      setSelectedTemplateId(remaining[0].id);
    }
    setShowDeleteModal(false);
    setTemplateToDelete(null);
    showFeedback(`Template "${templateToDelete.templateName}" removed.`);
  };

  const handlePrintPreview = async () => {
    showFeedback('Processing voucher print & A4 document generation...');
    try {
      window.focus();
      await printHtmlElement('template-preview-printable-area', `${templateName || 'Voucher'}_Template_Preview`);
      showFeedback('✓ Print dialog invoked and high-res A4 PDF document generated successfully!');
    } catch (err) {
      console.warn('Print preview fallback:', err);
      try {
        await downloadElementAsPdf('template-preview-printable-area', `${templateName || 'Voucher'}_Template_Preview`);
        showFeedback('✓ A4 PDF document downloaded successfully for printing!');
      } catch (e) {
        window.focus();
        try { window.print(); } catch (err2) {}
      }
    }
  };

  const handleDownloadPdfPreview = async () => {
    showFeedback('Rendering high-resolution A4 PDF document...');
    try {
      await downloadElementAsPdf('template-preview-printable-area', `${templateName || 'Voucher'}_Template`);
      showFeedback('✓ Genuine PDF document downloaded successfully!');
    } catch (err) {
      console.error('PDF export failed:', err);
      showFeedback('PDF generation error, trying print dialog...', 'error');
      window.focus();
      window.print();
    }
  };

  // Canvas signature handling
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0f2b5c';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setSigDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigDataUrl('');
  };

  const handleFileUploadSig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (typeof evt.target?.result === 'string') {
        setSigDataUrl(evt.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSignature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sigName.trim()) {
      showFeedback('Please enter Signer Full Name.', 'error');
      return;
    }
    if (!sigDataUrl) {
      showFeedback('Please draw or upload a signature image.', 'error');
      return;
    }

    addDigitalSignature({
      name: sigName.trim(),
      role: sigRole.trim() || 'Logistics Officer',
      department: sigDept.trim() || 'Operations',
      signatureDataUrl: sigDataUrl,
    });

    setShowSigModal(false);
    setSigName('');
    setSigDataUrl('');
    showFeedback(`Added digital signature for ${sigName}.`);
  };

  // Find sample signatures matching names for the live preview
  const prepSig = digitalSignatures.find(
    (s) =>
      s.name.toLowerCase().includes(preparedBy.toLowerCase()) ||
      (preparedBy && s.name.toLowerCase().includes(preparedBy.split(' ')[0].toLowerCase()))
  ) || digitalSignatures[1];

  const apprSig = digitalSignatures.find(
    (s) =>
      s.name.toLowerCase().includes(approvedBy.toLowerCase()) ||
      (approvedBy && s.name.toLowerCase().includes(approvedBy.split(' ')[0].toLowerCase()))
  ) || digitalSignatures[0];

  const isFormat02LinkedTo01 =
    sectionFormats.RECEIPT_RETURN_FOC?.linkedToGroupId === 'REQUISITION_ISSUE_USAGE';

  const currentEditingGroupDef: FormatGroupDefinition =
    COMPANY_FORMAT_GROUPS.find((g) => g.groupId === editingGroupId) || COMPANY_FORMAT_GROUPS[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sm:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Company Standard Formats, Letterheads & Sign-Off Governance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Document Templates & Format Uploader
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Upload your company&apos;s official voucher/order formats (PDF or Image) for each grouped operation. The system automatically builds the printable A4 format and applies it to all affected sections.
          </p>
        </div>

        {/* 3-Tab Switcher */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('section-formats')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'section-formats'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Section Formats (Upload PDF / Image)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Company Letterhead & Signers ({letterheadTemplates.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signatures')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'signatures'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Digital Signatures ({digitalSignatures.length})</span>
            </button>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs font-bold hover:underline ml-3">
            ✕
          </button>
        </div>
      )}

      {/* =====================================================================================
          TAB 1: COMPANY SECTION FORMATS (GROUPED FORMAT SLOTS + PDF/IMAGE UPLOAD + AFFECTS TO)
         ===================================================================================== */}
      {activeTab === 'section-formats' && (
        <div className="space-y-6">
          {/* Top Guidance + Unified Toggle Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 shadow-md border border-slate-700/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Smart Grouped Format Engine • Upload Once, Print Everywhere</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Company Standard Document Formats (Grouped by Identical Structure)
              </h2>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                Sections that share the same document layout are grouped together below. Upload a <strong>PDF (.pdf)</strong> or <strong>Image (.png / .jpg)</strong> of your company&apos;s format into any card — the system automatically extracts the header/layout and uses it whenever you print from the listed <strong>&ldquo;This Format Affects To&rdquo;</strong> sections.
              </p>
            </div>

            {/* 1-Click Unified Option for Format 01 & Format 02 */}
            <div className="bg-slate-800/90 border border-slate-600 rounded-xl p-3.5 shrink-0 max-w-md">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFormat02LinkedTo01}
                  onChange={(e) => handleToggleShareFormat01With02(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-bold text-emerald-300">
                    Use FORMAT-01 across all GRN, FOC & Stock Return sections too
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Enable this if your company uses <strong>one common voucher format</strong> for all 10 internal requisitions, issues, usages, GRNs, FOC receipts, and returns.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 4 GROUPED FORMAT CARDS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {COMPANY_FORMAT_GROUPS.map((group) => {
              const rawFmt = sectionFormats[group.groupId];
              const effectiveFmt = getEffectiveSectionFormat(group.groupId);
              const isSelectedForEdit = editingGroupId === group.groupId;
              const isLinkedTo01 =
                group.groupId === 'RECEIPT_RETURN_FOC' && isFormat02LinkedTo01;
              const isUploadingThis = uploadingGroupId === group.groupId;

              // If Format 01 is unified with Format 02, show combined affected sections on Format 01
              const displayedAffectedSections =
                group.groupId === 'REQUISITION_ISSUE_USAGE' && isFormat02LinkedTo01
                  ? [
                      ...group.affectedSections,
                      ...COMPANY_FORMAT_GROUPS[1].affectedSections,
                    ]
                  : group.affectedSections;

              return (
                <div
                  key={group.groupId}
                  onClick={() => setEditingGroupId(group.groupId)}
                  className={`rounded-2xl border-2 transition-all bg-white overflow-hidden flex flex-col justify-between cursor-pointer ${
                    isSelectedForEdit
                      ? 'border-emerald-600 shadow-lg ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Card Top Header */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className="px-2.5 py-0.5 rounded-md text-[11px] font-black font-mono uppercase text-white"
                            style={{ backgroundColor: effectiveFmt.accentColor || '#0f172a' }}
                          >
                            {group.groupCode}
                          </span>
                          {isLinkedTo01 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              Linked to FORMAT-01 (Unified)
                            </span>
                          ) : rawFmt.isCustomUploaded ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Custom {rawFmt.uploadedFileType?.toUpperCase()} Format Active</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700">
                              System Standard Format
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900">
                          {group.title}
                        </h3>
                        <p className="text-xs font-semibold text-emerald-800 mt-0.5">
                          {group.sinhalaTitle}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {group.description}
                        </p>
                      </div>
                    </div>

                    {/* PDF / Image Upload Zone */}
                    <div className="p-5 space-y-4">
                      {isLinkedTo01 ? (
                        <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="font-bold flex items-center gap-1.5">
                              <Layers className="w-4 h-4 text-blue-700" />
                              <span>Sharing Format with FORMAT-01</span>
                            </div>
                            <p className="text-[11px] text-blue-800">
                              All GRN, Client FOC, and Stock Return vouchers are currently using the format uploaded in <strong>FORMAT-01</strong>.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleShareFormat01With02(false);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold text-[11px] shrink-0 cursor-pointer"
                          >
                            Use Separate Format
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              {rawFmt.isCustomUploaded &&
                              (rawFmt.uploadedHeaderBannerDataUrl || rawFmt.uploadedFileDataUrl) ? (
                                <div className="w-20 h-14 rounded-lg border border-slate-300 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                  <img
                                    src={rawFmt.uploadedHeaderBannerDataUrl || rawFmt.uploadedFileDataUrl}
                                    alt="Uploaded Format Preview"
                                    className="max-h-full max-w-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-600/20 text-emerald-700 flex items-center justify-center shrink-0">
                                  <FileUp className="w-6 h-6" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-extrabold text-slate-900 truncate">
                                  {rawFmt.isCustomUploaded && rawFmt.uploadedFileName
                                    ? `Uploaded: ${rawFmt.uploadedFileName}`
                                    : 'Upload Company Format (PDF or Image)'}
                                </div>
                                <div className="text-[11px] text-slate-600 mt-0.5">
                                  {rawFmt.isCustomUploaded
                                    ? `Mode: ${
                                        rawFmt.renderMode === 'uploaded_header_banner'
                                          ? 'Uploaded Header Banner + System Table'
                                          : rawFmt.renderMode === 'full_page_stationery'
                                          ? 'Full Uploaded Stationery Sheet'
                                          : 'Smart Reconstructed System Format'
                                      }`
                                    : 'Supports .PDF, .PNG, .JPG, .WEBP — Auto-converts into system print layout'}
                                </div>
                                {rawFmt.extractedSummary && (
                                  <div className="text-[10px] text-emerald-800 font-medium mt-1 line-clamp-1">
                                    {rawFmt.extractedSummary}
                                  </div>
                                )}
                              </div>
                            </div>

                            <label
                              onClick={(e) => e.stopPropagation()}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0 transition-colors"
                            >
                              {isUploadingThis ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Analyzing...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>{rawFmt.isCustomUploaded ? 'Replace PDF / Image' : 'Upload PDF / Image'}</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp,.pdf,.png,.jpg,.jpeg,.webp"
                                onChange={(e) => handleFormatFileUpload(group.groupId, e)}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* Card Quick Action Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingGroupId(group.groupId);
                                  const studioEl = document.getElementById('format-customizer-studio');
                                  if (studioEl) studioEl.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Customize Layout & Columns</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTestPrintGroupId(group.groupId);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Test Print Preview</span>
                              </button>
                            </div>

                            {rawFmt.isCustomUploaded && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  resetSectionFormat(group.groupId);
                                  showFeedback(`Reset ${group.groupCode} back to standard system layout.`);
                                }}
                                className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reset Default</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* =====================================================================
                          "THIS FORMAT AFFECTS TO:" SECTION (USER CORE REQUIREMENT)
                         ===================================================================== */}
                      <div className="rounded-xl bg-slate-900 text-white p-3.5 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-400">
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>This Format Affects To ({displayedAffectedSections.length} Sections):</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Auto-applied on Print & PDF
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {displayedAffectedSections.map((sec, idx) => (
                            <div
                              key={`${sec.tabId}-${sec.docCode}-${idx}`}
                              className="bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-2 flex items-start justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">
                                  {sec.sectionName}
                                </div>
                                <div className="text-[10px] text-slate-300 truncate">
                                  {sec.voucherTitle}
                                </div>
                              </div>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[9.5px] font-bold shrink-0">
                                {sec.docCode}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* =====================================================================================
              INTERACTIVE FORMAT CUSTOMIZER & LIVE SIDE-BY-SIDE A4 SYSTEM FORMAT PREVIEW
             ===================================================================================== */}
          <div
            id="format-customizer-studio"
            className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black">
                      System Format Builder & Live A4 Print Preview
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Editing: {currentEditingGroupDef.groupCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {currentEditingGroupDef.title} — Customize how the uploaded PDF/Image format renders across all {currentEditingGroupDef.affectedSections.length} affected sections.
                  </p>
                </div>
              </div>

              {/* Group Switcher Pills */}
              <div className="flex items-center flex-wrap gap-1.5">
                {COMPANY_FORMAT_GROUPS.map((g) => (
                  <button
                    key={g.groupId}
                    type="button"
                    onClick={() => setEditingGroupId(g.groupId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      editingGroupId === g.groupId
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {g.groupCode}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Left 5 Columns: Format Controls & Extracted Settings */}
              <form onSubmit={handleSaveDraftFormat} className="xl:col-span-5 space-y-5">
                {/* 1. Render Mode Selector */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    1. How to Render Uploaded Format on Printouts
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        id: 'uploaded_header_banner' as FormatRenderMode,
                        title: 'Uploaded Header Banner + Dynamic System Table (Recommended)',
                        desc: 'Places the exact top header cropped from your uploaded PDF/Image at the top of the A4 page, and renders the live system table & sign-off matrix below it.',
                      },
                      {
                        id: 'smart_reconstructed' as FormatRenderMode,
                        title: 'Smart Reconstructed System Format',
                        desc: 'Uses the system corporate letterhead styled with your brand accent color, custom column headers, form code, and sign-off designations.',
                      },
                      {
                        id: 'full_page_stationery' as FormatRenderMode,
                        title: 'Uploaded Stationery Sheet + System Table',
                        desc: 'Displays your uploaded letterhead banner & framing with the live system voucher fields.',
                      },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                          draftFormat.renderMode === opt.id
                            ? 'bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-500/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="renderMode"
                          checked={draftFormat.renderMode === opt.id}
                          onChange={() =>
                            setDraftFormat((prev) => ({ ...prev, renderMode: opt.id }))
                          }
                          className="mt-0.5 accent-emerald-600"
                        />
                        <div className="text-xs">
                          <div className="font-bold text-slate-900">{opt.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Header Crop Height Slider when an uploaded file exists */}
                  {draftFormat.isCustomUploaded && draftFormat.uploadedFileDataUrl && (
                    <div className="pt-2 border-t border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">
                          Uploaded Header Banner Crop Height:
                        </span>
                        <span className="font-mono font-bold text-emerald-700">
                          {draftFormat.headerCropHeightPercent || 22}% of Page Height
                        </span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={42}
                        value={draftFormat.headerCropHeightPercent || 22}
                        onChange={(e) => handleCropPercentChange(Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-500">
                        Slide to adjust how much of the top of your uploaded PDF/Image is captured as the voucher header banner.
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Visual Grid Style, Brand Color & Form Reference */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    2. Table Style, Brand Color & Form Control Code
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Table Grid Style
                      </label>
                      <select
                        value={draftFormat.gridStyle}
                        onChange={(e) =>
                          setDraftFormat((prev) => ({
                            ...prev,
                            gridStyle: e.target.value as FormatGridStyle,
                          }))
                        }
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                      >
                        <option value="classic_bordered">Classic ISO Boxed Grid</option>
                        <option value="modern_corporate">Modern Corporate Colored Bar</option>
                        <option value="minimal_iso">Minimalist Underlined Header</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Brand Accent Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={draftFormat.accentColor || '#0f172a'}
                          onChange={(e) =>
                            setDraftFormat((prev) => ({ ...prev, accentColor: e.target.value }))
                          }
                          className="h-9 w-12 rounded border border-slate-300 cursor-pointer bg-white p-0.5"
                        />
                        <input
                          type="text"
                          value={draftFormat.accentColor || '#0f172a'}
                          onChange={(e) =>
                            setDraftFormat((prev) => ({ ...prev, accentColor: e.target.value }))
                          }
                          className="flex-1 text-xs px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Form Control / ISO Code
                      </label>
                      <input
                        type="text"
                        value={draftFormat.formRefCode}
                        onChange={(e) =>
                          setDraftFormat((prev) => ({ ...prev, formRefCode: e.target.value }))
                        }
                        placeholder="e.g. CTS-MAT-REQ-022"
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Custom Title Override (Optional)
                      </label>
                      <input
                        type="text"
                        value={draftFormat.customMainTitle || ''}
                        onChange={(e) =>
                          setDraftFormat((prev) => ({ ...prev, customMainTitle: e.target.value }))
                        }
                        placeholder="Leave blank for section auto-title"
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Custom Table Column Headers & Sign-Off Titles */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    3. Table Column Headings & Sign-Off Labels
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Col 1 (No)
                      </label>
                      <input
                        type="text"
                        value={draftFormat.colItemNoLabel}
                        onChange={(e) =>
                          setDraftFormat((prev) => ({ ...prev, colItemNoLabel: e.target.value }))
                        }
                        className="w-full text-xs px-2.5 py-1.5 bg-white border rounded-lg"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Col 2 (Item Description)
                      </label>
                      <input
                        type="text"
                        value={draftFormat.colDescriptionLabel}
                        onChange={(e) =>
                          setDraftFormat((prev) => ({
                            ...prev,
                            colDescriptionLabel: e.target.value,
                          }))
                        }
                        className="w-full text-xs px-2.5 py-1.5 bg-white border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Col 3 (Unit)
                      </label>
                      <input
                        type="text"
                        value={draftFormat.colUnitLabel}
                        onChange={(e) =>
                          setDraftFormat((prev) => ({ ...prev, colUnitLabel: e.target.value }))
                        }
                        className="w-full text-xs px-2.5 py-1.5 bg-white border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Col 4 (Quantity)
                      </label>
                      <input
                        type="text"
                        value={draftFormat.colQtyLabel}
                        onChange={(e) =>
                          setDraftFormat((prev) => ({ ...prev, colQtyLabel: e.target.value }))
                        }
                        className="w-full text-xs px-2.5 py-1.5 bg-white border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Col 5 (Remarks / Total)
                      </label>
                      <input
                        type="text"
                        value={draftFormat.colRemarksLabel}
                        onChange={(e) =>
                          setDraftFormat((prev) => ({ ...prev, colRemarksLabel: e.target.value }))
                        }
                        className="w-full text-xs px-2.5 py-1.5 bg-white border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        1st Signer Label
                      </label>
                      <input
                        type="text"
                        value={draftFormat.signPreparedLabel}
                        onChange={(e) =>
                          setDraftFormat((prev) => ({ ...prev, signPreparedLabel: e.target.value }))
                        }
                        className="w-full text-xs px-2.5 py-1.5 bg-white border rounded-lg font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        2nd Signer Label
                      </label>
                      <input
                        type="text"
                        value={draftFormat.signApprovedLabel}
                        onChange={(e) =>
                          setDraftFormat((prev) => ({ ...prev, signApprovedLabel: e.target.value }))
                        }
                        className="w-full text-xs px-2.5 py-1.5 bg-white border rounded-lg font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        3rd Signer Label
                      </label>
                      <input
                        type="text"
                        value={draftFormat.signThirdLabel}
                        onChange={(e) =>
                          setDraftFormat((prev) => ({ ...prev, signThirdLabel: e.target.value }))
                        }
                        className="w-full text-xs px-2.5 py-1.5 bg-white border rounded-lg font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setTestPrintGroupId(editingGroupId)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-emerald-600" />
                    <span>Open Full Print / PDF Modal</span>
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save & Apply Format to Sections</span>
                  </button>
                </div>
              </form>

              {/* Right 7 Columns: Side-by-Side Uploaded Reference & Live Generated System Format */}
              <div className="xl:col-span-7 space-y-4">
                {draftFormat.isCustomUploaded && draftFormat.uploadedFileDataUrl && (
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={draftFormat.uploadedFileDataUrl}
                        alt="Uploaded Full Reference"
                        className="w-16 h-20 object-cover rounded border border-slate-300 bg-white shadow-2xs shrink-0"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Uploaded Reference Sheet: {draftFormat.uploadedFileName}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          The live A4 preview below shows how the system adapts your uploaded format when printing in{' '}
                          <strong>
                            {currentEditingGroupDef.affectedSections.map((s) => s.sectionName).join(', ')}
                          </strong>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* LIVE A4 SYSTEM PRINT PREVIEW FOR SELECTED FORMAT GROUP */}
                <div className="border-2 border-slate-300 rounded-xl p-5 sm:p-6 bg-white text-black font-sans text-xs shadow-sm">
                  {/* Header: Either Uploaded Header Banner OR Dynamic Letterhead */}
                  {draftFormat.isCustomUploaded &&
                  (draftFormat.renderMode === 'uploaded_header_banner' ||
                    draftFormat.renderMode === 'full_page_stationery') &&
                  (draftFormat.uploadedHeaderBannerDataUrl || draftFormat.uploadedFileDataUrl) ? (
                    <div className="pb-2 mb-3 border-b-2 border-black">
                      <img
                        src={draftFormat.uploadedHeaderBannerDataUrl || draftFormat.uploadedFileDataUrl}
                        alt="Uploaded Company Header Banner"
                        className="w-full max-h-[165px] object-contain mx-auto"
                      />
                    </div>
                  ) : (
                    <div
                      className="text-center pb-2 mb-2 border-b-2"
                      style={{ borderColor: draftFormat.accentColor || '#0f172a' }}
                    >
                      <div className="flex items-center justify-center gap-3 mb-1">
                        {logoType === 'image' && logoImage ? (
                          <img
                            src={logoImage}
                            alt="Company Logo"
                            className="h-9 max-w-[120px] object-contain"
                          />
                        ) : (
                          <div
                            className="w-10 h-7 rounded-full text-white flex items-center justify-center text-[10px] font-black tracking-widest uppercase"
                            style={{ backgroundColor: draftFormat.accentColor || '#0f172a' }}
                          >
                            {logoText || 'COM'}
                          </div>
                        )}
                        <h2
                          className="text-lg sm:text-xl font-black font-serif tracking-tight uppercase"
                          style={{ color: draftFormat.accentColor || '#0f172a' }}
                        >
                          {companyName || 'COMTEC SYSTEMS (PVT) LTD.'}
                        </h2>
                      </div>
                      <p className="text-[9px] leading-tight text-slate-700 max-w-xl mx-auto">
                        {subtitle || 'Civil Contractors, Telecommunication Engineers and Transport Services'}
                      </p>
                    </div>
                  )}

                  {/* 3-Box Metadata Bar */}
                  <div className="border border-black flex items-stretch text-[11px] divide-x divide-black my-2.5">
                    <div className="w-1/3 p-1.5 flex items-center justify-between">
                      <span className="font-bold">DATE OF DOC:</span>
                      <span className="font-mono font-bold">{new Date().toISOString().split('T')[0]}</span>
                    </div>
                    <div className="w-1/3 p-1.5 text-center flex items-center justify-center font-bold">
                      <span>DOC NO - </span>
                      <span className="font-mono font-black underline ml-1">
                        {currentEditingGroupDef.affectedSections[0]?.docCode || 'DOC-2026-0001'}
                      </span>
                    </div>
                    <div className="w-1/3 p-1 text-center font-bold leading-tight flex flex-col justify-center">
                      <div className="font-mono font-extrabold">QP 2B</div>
                      <div className="text-red-700 font-black uppercase text-[10px]">CENTRAL YARD</div>
                    </div>
                  </div>

                  {/* Document Title */}
                  <div className="text-center my-2.5">
                    <span
                      className="inline-block px-3.5 py-1 rounded text-xs font-extrabold uppercase tracking-wide"
                      style={
                        draftFormat.gridStyle === 'modern_corporate'
                          ? { backgroundColor: draftFormat.accentColor || '#0f172a', color: '#ffffff' }
                          : { color: draftFormat.accentColor || '#0f172a' }
                      }
                    >
                      {draftFormat.customMainTitle ||
                        currentEditingGroupDef.affectedSections[0]?.voucherTitle.toUpperCase()}
                    </span>
                  </div>

                  {/* Sample Dynamic Items Table */}
                  <div className="border border-black my-2">
                    <table className="w-full text-[10.5px] border-collapse">
                      <thead>
                        <tr
                          className="font-bold text-center border-b border-black"
                          style={
                            draftFormat.gridStyle === 'modern_corporate'
                              ? { backgroundColor: draftFormat.accentColor || '#0f172a', color: '#ffffff' }
                              : { backgroundColor: '#f1f5f9', color: '#000000' }
                          }
                        >
                          <th className="py-1.5 px-1.5 w-[10%] border-r border-black/30">
                            {draftFormat.colItemNoLabel || '#'}
                          </th>
                          <th className="py-1.5 px-2 w-[44%] text-left border-r border-black/30">
                            {draftFormat.colDescriptionLabel || 'Item Description'}
                          </th>
                          <th className="py-1.5 px-1 w-[12%] border-r border-black/30">
                            {draftFormat.colUnitLabel || 'Unit'}
                          </th>
                          <th className="py-1.5 px-1.5 w-[16%] border-r border-black/30 text-right">
                            {draftFormat.colQtyLabel || 'Qty'}
                          </th>
                          <th className="py-1.5 px-2 w-[18%] text-left">
                            {draftFormat.colRemarksLabel || 'Remarks'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                        <tr>
                          <td className="py-1.5 px-1.5 text-center font-mono border-r border-black">1</td>
                          <td className="py-1.5 px-2 font-medium border-r border-black">
                            <span className="font-mono font-bold mr-1">FOC-48C</span>
                            FIBER OPTIC CABLE 48 CORE ARMORED
                          </td>
                          <td className="py-1.5 px-1 text-center font-mono border-r border-black">Mtrs</td>
                          <td className="py-1.5 px-1.5 text-right font-mono font-bold border-r border-black">1,250</td>
                          <td className="py-1.5 px-2 text-slate-600 text-[10px]">Verified</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-1.5 text-center font-mono border-r border-black">2</td>
                          <td className="py-1.5 px-2 font-medium border-r border-black">
                            <span className="font-mono font-bold mr-1">MH-HH-1</span>
                            PRECAST CONCRETE HAND HOLE UNIT HH-1
                          </td>
                          <td className="py-1.5 px-1 text-center font-mono border-r border-black">Pcs</td>
                          <td className="py-1.5 px-1.5 text-right font-mono font-bold border-r border-black">12</td>
                          <td className="py-1.5 px-2 text-slate-600 text-[10px]">Standard</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Sign-off Matrix Preview */}
                  <div className="border border-black text-[10px] mt-3">
                    <div className="grid grid-cols-3 divide-x divide-black">
                      <div className="p-2">
                        <div className="text-[9px] text-slate-500 font-bold">
                          {draftFormat.signPreparedLabel || 'Prepared & Checked By'}
                        </div>
                        {prepSig && (
                          <img
                            src={prepSig.signatureDataUrl}
                            alt="Sig"
                            className="h-6 object-contain my-0.5 mix-blend-multiply"
                          />
                        )}
                        <div className="font-bold text-slate-900">{preparedBy || 'Dissanayake'}</div>
                        <div className="text-[9px] text-slate-600">{designeePrepared}</div>
                      </div>
                      <div className="p-2">
                        <div className="text-[9px] text-slate-500 font-bold">
                          {draftFormat.signApprovedLabel || 'Approved By'}
                        </div>
                        {apprSig && (
                          <img
                            src={apprSig.signatureDataUrl}
                            alt="Sig"
                            className="h-6 object-contain my-0.5 mix-blend-multiply"
                          />
                        )}
                        <div className="font-bold text-slate-900">{approvedBy || 'Arthur Vance'}</div>
                        <div className="text-[9px] text-slate-600">{designeeApproved}</div>
                      </div>
                      <div className="p-2">
                        <div className="text-[9px] text-slate-500 font-bold">
                          {draftFormat.signThirdLabel || 'Reviewed / Received By'}
                        </div>
                        <div className="h-6 flex items-end text-[9px] text-slate-400 italic">
                          Sign & Stamp
                        </div>
                        <div className="font-bold text-slate-900">{reviewedBy || 'Authorized Officer'}</div>
                        <div className="text-[9px] text-slate-600">Issue: {issueNo} | Rev: {revisionNo}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-mono mt-2 pt-1 border-t border-slate-200">
                    <span>Form Ref: {draftFormat.formRefCode || 'CTS-MAT-REQ-022'}</span>
                    <span>Applies to: {currentEditingGroupDef.affectedSections.map((s) => s.sectionName).join(' • ')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================================
          TAB 2: MASTER COMPANY LETTERHEAD & SIGNERS GOVERNANCE
         ===================================================================================== */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Template Selector List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Registered Templates
                </h3>
                <button
                  type="button"
                  onClick={handleCreateNewTemplate}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Template</span>
                </button>
              </div>

              <div className="space-y-2">
                {letterheadTemplates.map((tpl) => {
                  const isSelected = tpl.id === selectedTemplateId;
                  const isDefault = tpl.id === activeTemplateId;

                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                              {tpl.logoText || 'COM'}
                            </span>
                            <span className="font-bold text-sm text-slate-900 truncate">
                              {tpl.templateName}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 truncate">
                            {tpl.companyName}
                          </div>
                        </div>

                        {isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                        <span>Signers: <strong className="text-slate-800">{tpl.designeePrepared}</strong> / <strong className="text-slate-800">{tpl.designeeApproved}</strong></span>
                      </div>

                      {isSelected && !isDefault && (
                        <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTemplateId(tpl.id);
                              showFeedback(`"${tpl.templateName}" set as system default template.`);
                            }}
                            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                          >
                            Set as Default Active
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-xs text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <Info className="w-4 h-4" />
                <span>Custom Signer Designations</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                When printing transfer notes, daily issue notes, team return vouchers, or branch return slips, the names and designations entered on this template will automatically render in the official sign-off table.
              </p>
            </div>
          </div>

          {/* Right Column: Template Editor Form & Live Preview */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Edit Letterhead & Signer Governance
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDuplicateTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </button>
                  {letterheadTemplates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const cur = letterheadTemplates.find((t) => t.id === selectedTemplateId);
                        if (cur) {
                          setTemplateToDelete(cur);
                          setShowDeleteModal(true);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveTemplate} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
                    1. Template Identity & Company Heading
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g. Comtec Systems Standard Voucher"
                        className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Company Registered Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. COMTEC SYSTEMS (PVT) LTD."
                        className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Business Description / Tagline (Printed below header)
                    </label>
                    <textarea
                      rows={2}
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Civil Contractors, Telecommunication Engineers and Transport Services..."
                      className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Telephone
                      </label>
                      <input
                        type="text"
                        value={tel}
                        onChange={(e) => setTel(e.target.value)}
                        className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Fax
                      </label>
                      <input
                        type="text"
                        value={fax}
                        onChange={(e) => setFax(e.target.value)}
                        className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email
                      </label>
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Logo Display Option */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-800">
                          Company Logo Display Mode *
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Choose whether to display an oval Monogram Text badge or your custom Logo Image.
                        </p>
                      </div>
                      <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => setLogoType('text')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                            logoType === 'text'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Logo Monogram Text
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoType('image')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                            logoType === 'image'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Logo Image (Upload)
                        </button>
                      </div>
                    </div>

                    {logoType === 'text' ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Monogram Letters (1-8 chars)
                          </label>
                          <input
                            type="text"
                            maxLength={8}
                            value={logoText}
                            onChange={(e) => setLogoText(e.target.value)}
                            placeholder="COM"
                            className="w-28 text-xs px-3 py-2 border rounded-lg font-mono uppercase font-black text-center bg-slate-50"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          {logoImage ? (
                            <div className="relative group bg-slate-50 border border-slate-300 rounded-lg p-2 flex items-center justify-center h-14 min-w-[120px]">
                              <img
                                src={logoImage}
                                alt="Company Logo Preview"
                                className="max-h-full max-w-[140px] object-contain"
                              />
                              <button
                                type="button"
                                onClick={() => setLogoImage('')}
                                className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-1 hover:bg-rose-700 shadow-xs cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="h-14 w-32 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-xs bg-slate-50">
                              No image chosen
                            </div>
                          )}

                          <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                            <Upload className="w-3.5 h-3.5 text-slate-500" />
                            <span>{logoImage ? 'Change Logo' : 'Upload Logo Image'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-xs px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                {/* 2. SIGNER NAMES & DESIGNATIONS */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 border-b pb-1">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      2. Signer Names, Designations & Department Matrix
                    </h3>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-800">
                      Prepared & Checked By (Field / Site Requester)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Signer Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={preparedBy}
                          onChange={(e) => setPreparedBy(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Designation *
                        </label>
                        <input
                          type="text"
                          required
                          value={designeePrepared}
                          onChange={(e) => setDesigneePrepared(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Department *
                        </label>
                        <input
                          type="text"
                          required
                          value={departmentPrepared}
                          onChange={(e) => setDepartmentPrepared(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-800">
                      Approved By (Central Management / Logistics Controller)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Signer Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={approvedBy}
                          onChange={(e) => setApprovedBy(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Designation *
                        </label>
                        <input
                          type="text"
                          required
                          value={designeeApproved}
                          onChange={(e) => setDesigneeApproved(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Department *
                        </label>
                        <input
                          type="text"
                          required
                          value={departmentApproved}
                          onChange={(e) => setDepartmentApproved(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-800">
                      Revision Tracking & Quality Reviewer
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Reviewed By
                        </label>
                        <input
                          type="text"
                          value={reviewedBy}
                          onChange={(e) => setReviewedBy(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Issue Number
                        </label>
                        <input
                          type="text"
                          value={issueNo}
                          onChange={(e) => setIssueNo(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Revision Number
                        </label>
                        <input
                          type="text"
                          value={revisionNo}
                          onChange={(e) => setRevisionNo(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Template & Signers</span>
                  </button>
                </div>
              </form>
            </div>

            {/* LIVE VOUCHER PREVIEW BOX */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-slate-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Live Letterhead & Sign-Off Matrix Preview
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadPdfPreview}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white border border-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Convert / Save as PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintPreview}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Voucher</span>
                  </button>
                </div>
              </div>

              <div
                id="template-preview-printable-area"
                className="printable-voucher-sheet border border-slate-300 rounded-lg p-6 bg-white text-black font-sans text-xs shadow-xs max-w-3xl mx-auto"
              >
                <div className="text-center pb-2">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    {logoType === 'image' && logoImage ? (
                      <img
                        src={logoImage}
                        alt="Company Logo"
                        className="h-9 max-w-[120px] object-contain"
                      />
                    ) : (
                      <div className="w-10 h-7 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black tracking-widest uppercase">
                        {logoText || 'COM'}
                      </div>
                    )}
                    <h2 className="text-xl font-black font-serif tracking-tight uppercase text-black">
                      {companyName || 'COMTEC SYSTEMS (PVT) LTD.'}
                    </h2>
                  </div>
                  <p className="text-[9px] leading-tight text-slate-800 max-w-xl mx-auto font-medium">
                    {subtitle}
                  </p>
                  <div className="flex justify-between items-start text-[9.5px] font-medium text-slate-900 mt-2 px-2 border-t pt-1">
                    <div className="text-left space-y-0.5">
                      <div>Tel: <span className="font-mono">{tel}</span></div>
                      <div>Fax: <span className="font-mono">{fax}</span></div>
                      <div>Email: <span className="font-mono">{email}</span></div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div>{address}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================================
          TAB 3: DIGITAL SIGNATURES LIBRARY
         ===================================================================================== */}
      {activeTab === 'signatures' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-emerald-600" />
                  <span>Authorized Digital Signatures Library</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Store and manage digital signatures for project controllers, site supervisors, and warehouse managers.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSigModal(true);
                  setSigName('');
                  setSigDataUrl('');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Digital Signature</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {digitalSignatures.map((sig) => (
                <div
                  key={sig.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{sig.name}</div>
                      <div className="text-xs text-emerald-700 font-medium">{sig.role}</div>
                      <div className="text-[11px] text-slate-500">{sig.department}</div>
                    </div>
                    {digitalSignatures.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDeleteSigId(sig.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                        title="Delete Signature"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="h-20 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center p-2">
                    <img
                      src={sig.signatureDataUrl}
                      alt={sig.name}
                      className="max-h-16 max-w-full object-contain mix-blend-multiply"
                    />
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono text-right">
                    Added: {sig.createdAt ? sig.createdAt.split('T')[0] : '2026-01-01'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TEST PRINT MODAL FOR SELECTED FORMAT GROUP */}
      {testPrintGroupId && (
        <PrintableDocumentModal
          isOpen={!!testPrintGroupId}
          onClose={() => setTestPrintGroupId(null)}
          formatGroupOverride={testPrintGroupId}
          title={
            sectionFormats[testPrintGroupId]?.customMainTitle ||
            COMPANY_FORMAT_GROUPS.find((g) => g.groupId === testPrintGroupId)?.affectedSections[0]?.voucherTitle.toUpperCase() ||
            'OFFICIAL COMPANY VOUCHER FORMAT PREVIEW'
          }
          documentNumber={
            COMPANY_FORMAT_GROUPS.find((g) => g.groupId === testPrintGroupId)?.affectedSections[0]?.docCode ||
            'DOC-2026-0001'
          }
          documentDate={new Date().toISOString()}
          recipientLabel="SAMPLE DESTINATION / PARTY"
          recipientName="Central Logistics Yard & Regional Site Operations"
          recipientSubDetails={`Format Slot: ${testPrintGroupId} | Applied to: ${
            COMPANY_FORMAT_GROUPS.find((g) => g.groupId === testPrintGroupId)
              ?.affectedSections.map((s) => s.sectionName)
              .join(', ') || ''
          }`}
          notes="Sample test printout demonstrating how your uploaded company format renders across all linked sections."
          items={[
            {
              itemCode: 'FOC-48C',
              itemName: 'FIBER OPTIC CABLE 48 CORE ARMORED',
              category: 'Telecom Cable',
              quantity: 1250,
              unit: 'Mtrs',
              remarks: 'Batch #01 Verified',
            },
            {
              itemCode: 'MH-HH-1',
              itemName: 'PRECAST CONCRETE HAND HOLE ENCLOSURE HH-1',
              category: 'Civil Assembly',
              quantity: 10,
              unit: 'Pcs',
              remarks: 'Standard Issue',
            },
          ]}
        />
      )}

      {/* MODAL: ADD NEW DIGITAL SIGNATURE */}
      {showSigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-emerald-600" />
                <span>Capture Digital Signature</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSigModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSignature} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Signer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={sigName}
                  onChange={(e) => setSigName(e.target.value)}
                  placeholder="e.g. K. Dissanayake"
                  className="w-full text-xs px-3 py-2 border rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    value={sigRole}
                    onChange={(e) => setSigRole(e.target.value)}
                    className="w-full text-xs px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={sigDept}
                    onChange={(e) => setSigDept(e.target.value)}
                    className="w-full text-xs px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-slate-700">Signature Input:</span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setSigInputMode('draw')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      sigInputMode === 'draw' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Draw on Screen
                  </button>
                  <button
                    type="button"
                    onClick={() => setSigInputMode('upload')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      sigInputMode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Upload Image
                  </button>
                </div>
              </div>

              {sigInputMode === 'draw' ? (
                <div>
                  <div className="relative border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={380}
                      height={120}
                      className="cursor-crosshair w-full h-[120px] touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="absolute top-2 right-2 text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-white/90 px-2 py-1 rounded border shadow-xs"
                    >
                      Clear Pad
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-700">
                      Choose signature image file (PNG / JPEG)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUploadSig}
                      className="hidden"
                    />
                  </label>
                  {sigDataUrl && (
                    <div className="h-16 bg-slate-50 border rounded-lg flex items-center justify-center p-2">
                      <img src={sigDataUrl} alt="Preview" className="max-h-14 object-contain" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowSigModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                >
                  Save Signature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Template Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Letterhead Template"
        message={`Are you sure you want to delete the letterhead template "${templateToDelete?.templateName}"? All vouchers currently using this template will fall back to the default format.`}
        confirmLabel="Delete Template"
        isDestructive={true}
        onConfirm={confirmDeleteTemplate}
        onCancel={() => {
          setShowDeleteModal(false);
          setTemplateToDelete(null);
        }}
      />

      {/* Confirm Delete Signature Modal */}
      <ConfirmModal
        isOpen={deleteSigId !== null}
        title="Delete Digital Signature"
        message="Are you sure you want to remove this digital signature from the authorized signatures library?"
        confirmLabel="Remove Signature"
        isDestructive={true}
        onConfirm={() => {
          if (deleteSigId) {
            deleteDigitalSignature(deleteSigId);
            setDeleteSigId(null);
            showFeedback('Digital signature removed.');
          }
        }}
        onCancel={() => setDeleteSigId(null)}
      />
    </div>
  );
};
