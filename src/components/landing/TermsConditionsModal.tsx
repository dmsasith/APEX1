import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, RefreshCw, FileText, Printer } from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { computePlatformPricingMetrics } from '../../types';
import { getLegalDocuments, LegalDocId } from './legalPoliciesData';

interface TermsConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: LegalDocId;
  agreeLabel?: string;
}

export const TermsConditionsModal: React.FC<TermsConditionsModalProps> = ({
  isOpen,
  onClose,
  initialDoc = 'terms',
  agreeLabel = 'Close & Agree',
}) => {
  const { platformPricing } = useStock();
  const pricingMetrics = computePlatformPricingMetrics(platformPricing);
  const [activeDoc, setActiveDoc] = useState<LegalDocId>(initialDoc);

  useEffect(() => {
    if (isOpen) {
      setActiveDoc(initialDoc);
    }
  }, [isOpen, initialDoc]);

  if (!isOpen) return null;

  const docs = getLegalDocuments({
    trialDays: pricingMetrics.trialDays,
    monthlyPriceFormatted: pricingMetrics.monthlyPriceFormatted,
    annualPriceClean: pricingMetrics.annualPriceClean,
    annualPriceFormatted: pricingMetrics.annualPriceFormatted,
    annualSavingsPercent: pricingMetrics.annualSavingsPercent,
    includedSiteBranches: pricingMetrics.includedSiteBranches,
    extraSiteMonthlyPriceFormatted: pricingMetrics.extraSiteMonthlyPriceFormatted,
    extraSiteAnnualPriceFormatted: pricingMetrics.extraSiteAnnualPriceFormatted,
  });

  const currentDoc = docs[activeDoc];

  const tabs: { id: LegalDocId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { id: 'refund', label: 'Refund Policy', icon: RefreshCw },
  ];

  const handleOpenDedicatedPage = () => {
    const slugMap: Record<LegalDocId, string> = {
      privacy: 'privacy-policy',
      refund: 'refund-policy',
      terms: 'terms-and-conditions',
    };
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('page', slugMap[activeDoc]);
      window.history.replaceState({}, document.title, url.toString());
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <div>
              <h2 className="text-sm font-black tracking-tight text-white">
                {currentDoc.title}
              </h2>
              <p className="text-[11px] text-slate-400">
                Apex Stock Enterprise SaaS · Effective {currentDoc.effectiveDate} · Version {currentDoc.version}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
              title="Print policy document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close legal policy modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Policy Switcher Bar */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center gap-1.5 shrink-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeDoc === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveDoc(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-emerald-600 text-slate-950'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Legal Content */}
        <div className="p-5 sm:p-6 space-y-5 text-xs text-slate-300 leading-relaxed overflow-y-auto flex-1">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 leading-relaxed">
            {currentDoc.summary}
          </div>

          {currentDoc.sections.map((section) => (
            <div key={section.id} className="space-y-2 pt-4 first:pt-0 border-t border-slate-800/80 first:border-t-0">
              <h3 className="text-sm font-extrabold text-white flex items-baseline gap-2">
                <span className="font-mono text-emerald-400 tabular-nums">{section.number}.</span>
                <span>{section.title}</span>
              </h3>
              {section.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-slate-300 leading-relaxed">
                  {p}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  {section.bullets.map((b, bIdx) => (
                    <li key={bIdx}>
                      <strong className="text-slate-100">{b.label}:</strong> {b.text}
                    </li>
                  ))}
                </ul>
              )}
              {section.table && (
                <div className="overflow-x-auto rounded-xl border border-slate-800 mt-2">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-950 text-slate-200 border-b border-slate-800">
                        {section.table.headers.map((h) => (
                          <th key={h} className="py-2 px-3 font-bold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {section.table.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="bg-slate-900/70">
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`py-2 px-3 align-top ${cIdx === 0 ? 'font-bold text-slate-100' : 'text-slate-300'}`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-slate-400">
            Questions? Email{' '}
            <a
              href="mailto:support@apexstox.com"
              onClick={handleOpenDedicatedPage}
              className="text-emerald-400 font-bold hover:underline"
            >
              support@apexstox.com
            </a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold rounded-xl text-xs transition cursor-pointer"
          >
            {agreeLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
