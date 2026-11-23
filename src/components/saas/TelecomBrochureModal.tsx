import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Mail,
  FileText,
  Sparkles,
  CheckCircle2,
  Award,
  Phone,
  Globe,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { computePlatformPricingMetrics } from '../../types';
import { downloadElementAsPdf, printHtmlElement } from '../../utils/printUtils';
import { OFFICIAL_SUPPORT_EMAIL, OFFICIAL_SYSTEM_URL } from '../../firebase';

interface TelecomBrochureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelecomBrochureModal: React.FC<TelecomBrochureModalProps> = ({ isOpen, onClose }) => {
  const { platformPricing, config } = useStock();
  const pricing = computePlatformPricingMetrics(platformPricing);
  const usdRate = config?.usdToLkrRate || 300;
  const monthlyLkr = Math.round(pricing.monthlyPrice * usdRate);
  const annualMonthlyLkr = Math.round(pricing.annualMonthlyEquivalent * usdRate);
  const annualLkr = Math.round(pricing.annualPrice * usdRate);

  const [activeTab, setActiveTab] = useState<'brochure' | 'email'>('brochure');
  const [contactPhone, setContactPhone] = useState(config?.phone || '+94 77 123 4567');
  const [contactEmail, setContactEmail] = useState(OFFICIAL_SUPPORT_EMAIL);
  const [senderName, setSenderName] = useState('Sasith Dissanayake');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const brochureRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const emailSubject = `Telecom Contractors ලා සඳහාම නිර්මාණය කළ Smart Stock & Project ERP පද්ධතිය — Apex Stock (වසර 19ක ප්‍රායෝගික අත්දැකීම් සමඟ)`;

  const emailBody = `හිතවත් Telecom Contractor මහත්මයා / ආයතන ප්‍රධානීතුමනි,

වසර 19කට ආසන්න Telecom (FTTH, Copper, OSP, Tower) සහ Project Management ක්ෂේත්‍රයේ මගේ ප්‍රායෝගික අත්දැකීම් භාවිතා කරමින්, Telecom Contractor ආයතන දිනපතා මුහුණ දෙන Main Stock, Branch Yards, Field Teams, Client FOC Reconciliation සහ Daily New Connection Usage ගැටලු 100%ක් විසඳීම සඳහාම නිර්මාණය කළ "Apex Stock" පද්ධතිය ඔබ වෙත හඳුන්වා දීමට කැමැත්තෙමි.

මෙම පද්ධතියේ විශේෂත්වයන් කිහිපයක්:
✅ භාවිතයේ අතිශය පහසුව — සංකීර්ණ පුහුණුවකින් තොරව විනාඩි 10න් ක්‍රියාත්මක කළ හැක (සිංහල සහ ඉංග්‍රීසි AI Support Assistant සහිතයි).
✅ Unlimited Users & Unlimited Field Teams + Central HQ Warehouse & ප්‍රාදේශීය Site Branches ${pricing.includedSiteBranches}ක් මූලික පැකේජයටම නොමිලේ! (අමතර Site Branch එකකට මසකට $${pricing.extraSiteMonthlyPriceClean}ක් පමණි).
✅ Telecom FTTH & Client FOC Full Reconciliation — Client ලබා දෙන FOC (Drop Cable, ONT, Splitters, Poles) Main Store -> Branch -> Team -> Connection Usage & Wastage -> Returnable Balance දක්වා තනි Click එකෙන් A4/PDF Reports.
✅ Team Transfers වලදී Stock පටලැවෙන්නේ නැත — පැරණි Site එකේ Stock ("Stock to Return") සහ අලුත් Site එකේ Stock වෙන් වෙන්ව පාලනය වේ.
✅ ඉතාම සාධාරණ මිල — මසකට $${pricing.monthlyPriceFormatted} (හෝ වාර්ෂිකව $${pricing.annualPriceClean}/yr — මසකට ~$${pricing.annualMonthlyEquivalentFormatted} ක් පමණයි!). අනෙකුත් විදේශීය Systems වලට වඩා 90%කට වඩා මුදල් ඉතිරියක්.

සම්පූර්ණ විස්තර ඇතුළත් සිංහල PDF අත්පත්‍රිකාව (Brochure) මේ සමඟ අමුණා ඇත.

දින ${pricing.trialDays}ක් කිසිදු ගෙවීමකින් තොරව නොමිලේ අත්හදා බැලීමට:
🌐 ${OFFICIAL_SYSTEM_URL} වෙත පිවිස "Start ${pricing.trialDays}-Day Free Trial" click කරන්න.

වැඩි විස්තර හෝ Live Demo එකක් සඳහා අමතන්න:
📞 ${contactPhone}
✉️ ${contactEmail}

මෙයට විශ්වාසී,
${senderName}
Apex Stock Platform (${OFFICIAL_SYSTEM_URL})`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2200);
  };

  const handleDownloadPdf = async () => {
    if (!brochureRef.current) return;
    setIsGeneratingPdf(true);
    try {
      await downloadElementAsPdf(
        brochureRef.current,
        'ApexStock_Telecom_Contractors_Guide_Sinhala'
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintVectorPdf = async () => {
    if (!brochureRef.current) return;
    await printHtmlElement(
      brochureRef.current,
      'ApexStock - Telecom Contractors Sinhala Brochure'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Modal Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                Telecom Contractors Marketing Kit — Sinhala PDF &amp; Email Draft
              </h2>
              <p className="text-[11px] text-slate-400">
                Ready-to-email Sinhala A4 Brochure + Live Dynamic Pricing (${pricing.monthlyPriceFormatted}/mo · ${pricing.annualPriceClean}/yr)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('brochure')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'brochure'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Sinhala A4 Brochure (PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Subject &amp; Text</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Customization Bar */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="flex items-center gap-1.5 text-slate-300">
              <span className="text-[11px] text-slate-400">Name:</span>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white w-36"
              />
            </label>
            <label className="flex items-center gap-1.5 text-slate-300">
              <span className="text-[11px] text-slate-400">Phone/WhatsApp:</span>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white w-36"
              />
            </label>
            <label className="flex items-center gap-1.5 text-slate-300">
              <span className="text-[11px] text-slate-400">Email:</span>
              <input
                type="text"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white w-44"
              />
            </label>
          </div>

          {activeTab === 'brochure' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintVectorPdf}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 border border-slate-600 cursor-pointer"
                title="Recommended for razor-sharp Sinhala text: Choose 'Save as PDF' in print dialog"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print / Save High-Res PDF</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download .PDF File'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
          {activeTab === 'email' ? (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Email Subject Line
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(emailSubject, 'subject')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'subject' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Subject</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-semibold">
                  {emailSubject}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Email Message Body (Attach Downloaded PDF)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(emailBody, 'body')}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-xs font-black text-slate-950 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'body' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Email Body</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {emailBody}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              {/* Printable A4 Executive Sinhala Brochure */}
              <div
                ref={brochureRef}
                className="bg-white text-slate-900 w-[794px] shadow-2xl rounded-sm overflow-hidden border border-slate-300"
                style={{ fontFamily: "'Noto Sans Sinhala', 'Inter', system-ui, sans-serif" }}
              >
                {/* ==================== PAGE 1 HEADER HERO ==================== */}
                <div
                  className="px-8 py-7 text-white"
                  style={{ background: 'linear-gradient(135deg, #071026 0%, #0f2347 55%, #064e3b 100%)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 max-w-[540px]">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950">
                        <Award className="w-3.5 h-3.5" />
                        <span>වසර 19ක Telecom &amp; Project ක්ෂේත්‍රයේ අත්දැකීම් මත නිර්මාණය වූ පද්ධතිය</span>
                      </div>
                      <h1 className="text-[26px] font-black leading-tight tracking-tight text-white pt-1">
                        Apex Stock — Telecom Contractors ලා සඳහාම නිර්මාණය කළ Smart Stock &amp; Project ERP පද්ධතිය
                      </h1>
                      <p className="text-[12.5px] text-slate-200 leading-relaxed">
                        Main Warehouse, Site Branch Yards, Field Work Teams, Client FOC Reconciliation සහ Daily New Connection Material Usage එකම තැනකින් 100% නිවැරදිව පාලනය කරන්න.
                      </p>
                    </div>

                    <div className="bg-white/10 border border-amber-400/50 rounded-xl px-4 py-3 text-center shrink-0 min-w-[165px]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        Special Launch Offer
                      </div>
                      <div className="text-[26px] font-black text-amber-400 leading-none mt-1">
                        ${pricing.annualMonthlyEquivalentFormatted}
                        <span className="text-xs font-bold text-white">/mo</span>
                      </div>
                      <div className="text-[10px] text-slate-200 mt-1">
                        වාර්ෂිකව ${pricing.annualPriceClean} (~රු. {annualMonthlyLkr.toLocaleString()}/මසකට)
                      </div>
                      <div className="mt-2 bg-emerald-500 text-slate-950 text-[10px] font-black py-1 px-2 rounded">
                        දින {pricing.trialDays}ක් නොමිලේ අත්හදා බලන්න!
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-6 space-y-5">
                  {/* ==================== FOUNDER 19-YEAR STORY ==================== */}
                  <div className="bg-slate-50 border-l-4 border-emerald-600 rounded-r-xl p-4">
                    <h2 className="text-[14px] font-black text-slate-900 mb-1.5">
                      ඇයි Apex Stock අනෙකුත් සාමාන්‍ය Stock Systems වලට වඩා වෙනස්?
                    </h2>
                    <p className="text-[11.5px] text-slate-700 leading-relaxed">
                      සාමාන්‍ය වෙළඳසැල් සඳහා හදාපු Inventory software වලින් Telecom Project එකක වැඩ හරියට කරන්න බැහැ.{' '}
                      <strong className="text-slate-900">
                        වසර 19කට ආසන්න කාලයක් Telecom (FTTH, Copper, OSP, Civil) සහ Project Management ක්ෂේත්‍රයේ මා ලැබූ ප්‍රායෝගික අත්දැකීම්
                      </strong>{' '}
                      සෘජුවම යොදාගෙන, Telecom Contractor ආයතනයක Store එකේ සිට Field Team එක දක්වා සිදුවන සියලුම ගැටලු, නාස්ති (Wastage) සහ Client FOC ගණන් පියවීම් 100%ක් විසඳෙන පරිදි මෙය නිර්මාණය කර ඇත.
                    </p>
                  </div>

                  {/* ==================== UNLIMITED POWER BANNER ==================== */}
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { title: 'Unlimited Users', sub: 'කාර්ය මණ්ඩල සාමාජිකයින් සීමා රහිතයි — අමතර ගාස්තු නැත' },
                      { title: `${pricing.includedSiteBranches} Site Branches + HQ`, sub: `Main Store + Site ${pricing.includedSiteBranches}ක් ඇතුළත් (අමතර +$${pricing.extraSiteMonthlyPriceClean}/mo)` },
                      { title: 'Unlimited Teams', sub: 'Field Work Teams සහ Crew Members සීමා රහිතව ලියාපදිංචි කරන්න' },
                      { title: 'Unlimited Projects', sub: 'Main Projects, Sub-Projects & New Connections සීමා නැත' },
                    ].map((card) => (
                      <div
                        key={card.title}
                        className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center"
                      >
                        <div className="text-[12px] font-black text-emerald-900">{card.title}</div>
                        <div className="text-[10px] text-emerald-800 mt-1 leading-snug">{card.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* ==================== KEY TELECOM FEATURES ==================== */}
                  <div>
                    <h2 className="text-[14px] font-black text-slate-900 border-b border-slate-200 pb-1.5 mb-3">
                      Telecom Contractors ලාට ලැබෙන ප්‍රධාන පහසුකම් (Features)
                    </h2>

                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div className="border border-slate-200 rounded-xl p-3 bg-white">
                        <div className="font-black text-slate-900 text-[12px] mb-1">
                          1. Client Free Stock (FOC) — 5-Stage Full Reconciliation
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          SLT / Dialog වැනි Principal ආයතන ලබා දෙන Drop Cable, ONT, Splitters, Poles ආදිය Central FOC ලැබීම → Site Issue → Team Issue → Usage &amp; Wastage → Returnable Balance දක්වා සම්පූර්ණයෙන් ගණන් පියවා තනි Click එකෙන් A4/PDF Report ගත හැක.
                        </p>
                      </div>

                      <div className="border border-slate-200 rounded-xl p-3 bg-white">
                        <div className="font-black text-slate-900 text-[12px] mb-1">
                          2. Telecom FTTH Templates (ITU-T G.984) &amp; Main/Sub Projects
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          Telecom New Connection, Water, Electrical, Solar සඳහා අන්තර්ජාතික Section Templates 1-Click මගින් load වේ. Main Project එකක් යටතේ Sub-Projects / Connections ඕනෑම ගණනක් සහ <strong>ALL AREAS</strong> දීපව්‍යාප්ත Projects පාලනය කළ හැක.
                        </p>
                      </div>

                      <div className="border border-slate-200 rounded-xl p-3 bg-white">
                        <div className="font-black text-slate-900 text-[12px] mb-1">
                          3. Field Team Site Transfers (බඩු පටලැවීම 0%)
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          Team එකක් වෙනත් Site Branch එකකට මාරු කළ විට, පැරණි Site එකේ ඉතිරි Stock <strong>(&quot;Stock to Return&quot;)</strong> සහ අලුත් Site එකේ Active Stock වෙන් වෙන්ව පෙන්වයි. Team Name එක Stock issue කළ පසු Lock වන නිසා Audit ගැටලු ඇති නොවේ.
                        </p>
                      </div>

                      <div className="border border-slate-200 rounded-xl p-3 bg-white">
                        <div className="font-black text-slate-900 text-[12px] mb-1">
                          4. සරල 1-2-3 Daily Progress &amp; Wastage Entry
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          Step 1: Team &amp; Area තහවුරු කිරීම → Step 2: Connection තේරීම → Step 3: Used Qty + Wastage ඇතුළත් කිරීම. Team වෙන වෙනම හා සම්පූර්ණ Site Consolidated Full Reports ක්ෂණිකව Print/PDF කළ හැක.
                        </p>
                      </div>

                      <div className="border border-slate-200 rounded-xl p-3 bg-white">
                        <div className="font-black text-slate-900 text-[12px] mb-1">
                          5. Multi-Item Returns, Damaged Restoration &amp; Supplier PO/RTV
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          Items කිහිපයක් එකවර Good / Damaged ලෙස Team Returns (RV) හා Branch Returns (BRM) දැමිය හැක. Supplier Purchase Orders, Partial GRN, Debit Notes, සහ Damaged Stock Repair පාලනය ඇතුළත්ය.
                        </p>
                      </div>

                      <div className="border border-slate-200 rounded-xl p-3 bg-white">
                        <div className="font-black text-slate-900 text-[12px] mb-1">
                          6. භාවිතයේ පහසුව + ISO Letterheads + Barcode &amp; AI Support
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          Phone Camera / USB Barcode Scanner සහිතයි. ඔබේ Logo, Custom PDF Letterhead සහ Digital Signatures සමඟ A4 Vouchers print වේ. සිංහල හා ඉංග්‍රීසි <strong>AI Support Chat</strong> එක පැය 24ම උදව් කරයි.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ==================== COMPETITOR COST & VALUE COMPARISON ==================== */}
                  <div>
                    <h2 className="text-[14px] font-black text-slate-900 border-b border-slate-200 pb-1.5 mb-2.5">
                      අනෙකුත් Systems සමඟ මිල සහ පහසුකම් සැසඳීම (90%+ මුදල් ඉතිරියක්!)
                    </h2>

                    <table className="w-full border-collapse text-[11px] border border-slate-300 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-slate-900 text-white text-left">
                          <th className="p-2.5 font-bold">පද්ධතිය (System)</th>
                          <th className="p-2.5 font-bold">වාර්ෂික / මාසික මිල</th>
                          <th className="p-2.5 font-bold">Users &amp; Branches</th>
                          <th className="p-2.5 font-bold">Telecom FOC &amp; Field Teams</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-amber-50 border-b border-amber-200 font-bold text-slate-900">
                          <td className="p-2.5 text-emerald-900 font-black">★ Apex Stock (ඔබේ තේරීම)</td>
                          <td className="p-2.5 font-black text-emerald-800">
                            ${pricing.monthlyPriceFormatted}/mo හෝ ${pricing.annualPriceClean}/yr (~රු. {annualLkr.toLocaleString()}/වසරට)
                          </td>
                          <td className="p-2.5 text-emerald-900">✓ Users/Teams සීමා නැත · {pricing.includedSiteBranches} Sites (+${pricing.extraSiteMonthlyPriceClean}/mo extra)</td>
                          <td className="p-2.5 text-emerald-900">✓ 100% Telecom &amp; FOC සඳහාම</td>
                        </tr>
                        <tr className="border-b border-slate-200 bg-white text-slate-700">
                          <td className="p-2.5 font-semibold">Zoho Inventory / Sortly</td>
                          <td className="p-2.5 text-rose-700 font-bold">$1,548 – $1,788+ / වසරට (රු. ලක්ෂ 4.6+)</td>
                          <td className="p-2.5">✗ Users 2–8 ට සීමිතයි (+අමතර ගාස්තු)</td>
                          <td className="p-2.5">✗ Retail Shop සඳහා පමණි; FOC නැත</td>
                        </tr>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                          <td className="p-2.5 font-semibold">inFlow / Cin7 Core</td>
                          <td className="p-2.5 text-rose-700 font-bold">$2,388+ / වසරට (රු. ලක්ෂ 7.1+)</td>
                          <td className="p-2.5">✗ අමතර User/Branch $39+/mo බැගින්</td>
                          <td className="p-2.5">✗ Field Crew Transfer / Return නැත</td>
                        </tr>
                        <tr className="bg-white text-slate-700">
                          <td className="p-2.5 font-semibold">Custom ERP / Procore / SAP</td>
                          <td className="p-2.5 text-rose-700 font-bold">$10,000+ / වසරට + Setup රු. ලක්ෂ 15+</td>
                          <td className="p-2.5">✗ Seat License ගාස්තු ඉතා ඉහළයි</td>
                          <td className="p-2.5">✗ වෙනස්කම් වලට IT ගාස්තු අය කෙරේ</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* ==================== FOOTER CTA ==================== */}
                  <div
                    className="rounded-xl p-4 text-white flex items-center justify-between gap-4"
                    style={{ background: 'linear-gradient(90deg, #064e3b 0%, #071026 100%)' }}
                  >
                    <div className="space-y-1">
                      <div className="text-[13px] font-black text-amber-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>අදම දින {pricing.trialDays}ක් නොමිලේ අත්හදා බලන්න (Setup Fee $0 · Credit Card අවශ්‍ය නැත)</span>
                      </div>
                      <div className="text-[11px] text-slate-200">
                        පියවර 1: <strong>{OFFICIAL_SYSTEM_URL}</strong> වෙත පිවිසෙන්න → පියවර 2: <strong>&quot;Start {pricing.trialDays}-Day Free Trial&quot;</strong> click කර විනාඩි 2න් ඔබේ Workspace එක අරඹන්න!
                      </div>
                    </div>

                    <div className="text-right text-[11px] shrink-0 border-l border-white/20 pl-4 space-y-0.5">
                      <div className="font-black text-white">{senderName}</div>
                      <div className="text-emerald-300 flex items-center justify-end gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{contactPhone}</span>
                      </div>
                      <div className="text-amber-300 flex items-center justify-end gap-1">
                        <Globe className="w-3 h-3" />
                        <span>{OFFICIAL_SYSTEM_URL}</span>
                      </div>
                      <div className="text-slate-300 text-[10px]">
                        Monthly: ${pricing.monthlyPriceFormatted} (~Rs. {monthlyLkr.toLocaleString()}) · Annual: ${pricing.annualPriceClean}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
