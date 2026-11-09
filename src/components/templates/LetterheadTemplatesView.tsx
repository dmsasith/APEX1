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
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { LetterheadTemplate, DigitalSignature } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { printHtmlElement, downloadElementAsPdf } from '../../utils/printUtils';

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
  } = useStock();

  const [activeTab, setActiveTab] = useState<'templates' | 'signatures'>('templates');

  // Currently selected template for editing
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(activeTemplateId);

  // Form State
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
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

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

  const revSig = digitalSignatures.find(
    (s) =>
      s.name.toLowerCase().includes(reviewedBy.toLowerCase()) ||
      (reviewedBy && s.name.toLowerCase().includes(reviewedBy.split(' ')[0].toLowerCase()))
  ) || digitalSignatures[1];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Document Layout & Sign-Off Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Letterhead Templates & Signers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Customize header branding, company legal identities, and sign-off designations (Site In-Charge, Central Project Engineer) across all printed vouchers.
          </p>
        </div>

        {/* Tab Switcher & Quick Actions */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'templates'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Letterhead Templates ({letterheadTemplates.length})
            </button>
            <button
              onClick={() => setActiveTab('signatures')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'signatures'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Digital Signatures ({digitalSignatures.length})
            </button>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs font-bold hover:underline">
            ✕
          </button>
        </div>
      )}

      {activeTab === 'templates' ? (
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
                When printing transfer notes, daily issue notes, team return vouchers, or branch return slips, the names and designations entered on this template will automatically render in the official 3-tier sign-off table.
              </p>
            </div>
          </div>

          {/* Right Column: Template Editor Form & Live Preview */}
          <div className="lg:col-span-8 space-y-6">
            {/* Editor Form */}
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
                {/* 1. Template Identity */}
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
                        placeholder="+94 11 2549590"
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
                        placeholder="+94 11 2549591"
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
                        placeholder="apexdevinfo@gmail.com"
                        className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Logo Display Option: Monogram Text vs Logo Image */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-800">
                          Company Logo Display Mode *
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Choose whether to display an oval Monogram Text badge or your custom Logo Image on the printed document.
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
                            className="w-28 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono uppercase font-black text-center bg-slate-50"
                          />
                        </div>
                        <div className="text-[11px] text-slate-500 leading-relaxed sm:pt-4">
                          Renders inside an official black oval badge (e.g., <span className="font-mono font-bold">COM</span>, <span className="font-mono font-bold">CTS</span>, <span className="font-mono font-bold">HQ</span>) next to the company title.
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
                                title="Remove Logo Image"
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
                            <span>{logoImage ? 'Change / Upload New Logo' : 'Upload Company Logo Image'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Recommended format: PNG with transparent background or high-res JPG (under 2MB).
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Address (Street, City, Province)
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="No: 36, Udumulla, Malgama Road, Himbutana, Mulleriyawa."
                      className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* 2. SIGNER NAMES & DESIGNATIONS (USER CORE REQUIREMENT) */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 border-b pb-1">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      2. Signer Names, Designations & Department Matrix
                    </h3>
                  </div>

                  {/* Prepared & Checked Signer Box */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span>Prepared & Checked By (Field / Site Requester)</span>
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
                          placeholder="e.g. Dissanayake"
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Designation (Title / Role) *
                        </label>
                        <input
                          type="text"
                          required
                          value={designeePrepared}
                          onChange={(e) => setDesigneePrepared(e.target.value)}
                          placeholder="e.g. Site In-Charge / Store Keeper"
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
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
                          placeholder="e.g. Telecom & Civil Projects"
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Approved By Signer Box */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>Approved By (Central Management / Logistics Controller)</span>
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
                          placeholder="e.g. Arthur Vance"
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Designation (Title / Role) *
                        </label>
                        <input
                          type="text"
                          required
                          value={designeeApproved}
                          onChange={(e) => setDesigneeApproved(e.target.value)}
                          placeholder="e.g. Central Project Engineer"
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
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
                          placeholder="e.g. Central Logistics & Procurement"
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reviewer & Issue Matrix Box */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      <span>Revision Tracking & Quality Reviewer</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Reviewed By (Signer Name)
                        </label>
                        <input
                          type="text"
                          value={reviewedBy}
                          onChange={(e) => setReviewedBy(e.target.value)}
                          placeholder="Dissanayake"
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
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
                          placeholder="01"
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-center"
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
                          placeholder="00"
                          className="w-full text-xs px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Document Status
                        </label>
                        <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-bold text-xs text-center">
                          Active Ready
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors"
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
                    title="Download standalone self-printing document to save as PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Convert / Save as PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintPreview}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    title="Print this letterhead voucher format"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Voucher</span>
                  </button>
                </div>
              </div>

              {/* Rendered Preview Card (Exact Comtec Style) */}
              <div
                id="template-preview-printable-area"
                className="printable-voucher-sheet border border-slate-300 rounded-lg p-6 bg-white text-black font-sans text-xs shadow-xs max-w-3xl mx-auto"
              >
                {/* Header */}
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
                    {subtitle || 'Civil Contractors, Telecommunication Engineers and Transport Services...'}
                  </p>
                  <div className="flex justify-between items-start text-[9.5px] font-medium text-slate-900 mt-2 px-2 border-t pt-1">
                    <div className="text-left space-y-0.5">
                      <div>Tel: <span className="font-mono">{tel || '+94 11 2549590'}</span></div>
                      <div>Fax: <span className="font-mono">{fax || '+94 11 2549591'}</span></div>
                      <div>Email: <span className="font-mono">{email || 'apexdevinfo@gmail.com'}</span></div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div>{address || 'No: 36, Udumulla, Malgama Road, Himbutana, Mulleriyawa.'}</div>
                    </div>
                  </div>
                </div>

                {/* 3-Box Metadata Bar */}
                <div className="border border-black flex items-stretch text-xs divide-x divide-black my-3">
                  <div className="w-1/3 p-1.5 flex items-center justify-between">
                    <span className="font-bold text-[11px]">DATE OF REQ:</span>
                    <span className="font-mono font-bold">{new Date().toISOString().split('T')[0]}</span>
                  </div>
                  <div className="w-1/3 p-1.5 text-center flex items-center justify-center font-bold">
                    <span>DOCUMENT NO - </span>
                    <span className="font-mono font-black underline ml-1">RN-2026-0042</span>
                  </div>
                  <div className="w-1/3 p-1 text-center font-bold text-[11px] leading-tight flex flex-col justify-center">
                    <div className="font-mono font-extrabold">QP 2B</div>
                    <div className="text-red-700 font-black uppercase text-[10px]">MATALE CENTRAL SITE</div>
                  </div>
                </div>

                {/* Sample items row */}
                <div className="border border-black text-[10px] my-2">
                  <div className="grid grid-cols-6 bg-slate-100 font-bold border-b border-black text-center py-1">
                    <div className="col-span-1 border-r border-black">Item No</div>
                    <div className="col-span-2 border-r border-black text-left px-2">Item Description</div>
                    <div className="col-span-1 border-r border-black">Unit</div>
                    <div className="col-span-1 border-r border-black">Quantity</div>
                    <div className="col-span-1">Remarks</div>
                  </div>
                  <div className="grid grid-cols-6 text-center py-1 border-b border-slate-200">
                    <div className="col-span-1 border-r border-black font-mono">1</div>
                    <div className="col-span-2 border-r border-black text-left px-2 font-medium">FIBER OPTIC CABLE 48 CORE ARMORED</div>
                    <div className="col-span-1 border-r border-black font-mono">Mtrs</div>
                    <div className="col-span-1 border-r border-black font-mono font-bold">1,250</div>
                    <div className="col-span-1 text-slate-600">Telecom Trunk Line</div>
                  </div>
                </div>

                {/* APPROVAL & SIGN-OFF MATRIX WITH DYNAMIC NAMES & DESIGNATIONS */}
                <div className="border border-black text-[10px] mt-3">
                  <table className="w-full border-collapse">
                    <tbody>
                      {/* Row 1: Prepared & Checked */}
                      <tr className="border-b border-black">
                        <td className="w-1/4 p-1.5 border-r border-black font-mono font-bold">
                          <div className="text-[9px] text-slate-500 font-sans">Date</div>
                          <div>{new Date().toISOString().split('T')[0]}</div>
                        </td>
                        <td className="w-1/4 p-1.5 border-r border-black">
                          <div className="text-[9px] text-slate-600 font-bold">Prepaired & Checked By</div>
                          {prepSig && (
                            <div className="h-7 flex items-center justify-start my-0.5">
                              <img
                                src={prepSig.signatureDataUrl}
                                alt="Prepared Sig"
                                className="max-h-6 max-w-[120px] object-contain mix-blend-multiply"
                              />
                            </div>
                          )}
                          <div className="font-bold text-[11px] text-slate-900">{preparedBy || 'Dissanayake'}</div>
                        </td>
                        <td className="w-1/4 p-1.5 border-r border-black">
                          <div className="text-[9px] text-slate-600 font-bold">Designee</div>
                          <div className="font-bold text-[10.5px] text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">
                            {designeePrepared || 'Site In-Charge'}
                          </div>
                        </td>
                        <td className="w-1/4 p-1.5">
                          <div className="text-[9px] text-slate-600 font-bold">Department</div>
                          <div className="font-medium text-slate-800">{departmentPrepared || 'Civil & Telecom Operations'}</div>
                        </td>
                      </tr>

                      {/* Row 2: Approved by */}
                      <tr className="border-b border-black">
                        <td className="w-1/4 p-1.5 border-r border-black font-mono font-bold">
                          <div className="text-[9px] text-slate-500 font-sans">Date</div>
                          <div>{new Date().toISOString().split('T')[0]}</div>
                        </td>
                        <td className="w-1/4 p-1.5 border-r border-black">
                          <div className="text-[9px] text-slate-600 font-bold">Approved by</div>
                          {apprSig && (
                            <div className="h-7 flex items-center justify-start my-0.5">
                              <img
                                src={apprSig.signatureDataUrl}
                                alt="Approved Sig"
                                className="max-h-6 max-w-[120px] object-contain mix-blend-multiply"
                              />
                            </div>
                          )}
                          <div className="font-bold text-[11px] text-slate-900">{approvedBy || 'Arthur Vance'}</div>
                        </td>
                        <td className="w-1/4 p-1.5 border-r border-black">
                          <div className="text-[9px] text-slate-600 font-bold">Designee</div>
                          <div className="font-bold text-[10.5px] text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">
                            {designeeApproved || 'Central Project Engineer'}
                          </div>
                        </td>
                        <td className="w-1/4 p-1.5">
                          <div className="text-[9px] text-slate-600 font-bold">Department</div>
                          <div className="font-medium text-slate-800">{departmentApproved || 'Central Procurement & Logistics'}</div>
                        </td>
                      </tr>

                      {/* Row 3: Issue No & Revision Matrix */}
                      <tr>
                        <td colSpan={2} className="p-1 border-r border-black">
                          <div className="grid grid-cols-2 text-[9px] gap-x-2">
                            <div>Issue NO: <strong className="font-mono">{issueNo || '01'}</strong></div>
                            <div>Date Of Issue: <span className="font-mono">{new Date().toISOString().split('T')[0]}</span></div>
                            <div>Revision No: <strong className="font-mono">{revisionNo || '00'}</strong></div>
                            <div>Date of Rev: <span className="font-mono">{new Date().toISOString().split('T')[0]}</span></div>
                          </div>
                        </td>
                        <td className="p-1 border-r border-black">
                          <div className="text-[8.5px] text-slate-500">Reviewed By</div>
                          <div className="font-bold text-[9.5px]">{reviewedBy || 'Dissanayake'}</div>
                        </td>
                        <td className="p-1">
                          <div className="text-[8.5px] text-slate-500">Approved BY</div>
                          <div className="font-bold text-[9.5px]">{approvedBy || 'Arthur Vance'}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono mt-2 pt-1 border-t border-slate-200">
                  <span>Form Ref: CTS-MAT-REQ-022 / QP 2B</span>
                  <span>Apex Stock Management System · Comtec Letterhead</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: DIGITAL SIGNATURES LIBRARY */
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

                  {/* Signature Image Preview */}
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
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
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
                    placeholder="Site In-Charge"
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    placeholder="Field Operations"
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Mode Toggle: Draw vs Upload */}
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
                  <div className="text-[10px] text-slate-500 mt-1">
                    Draw your signature smoothly using your mouse or touch screen.
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
