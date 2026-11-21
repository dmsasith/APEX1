import React from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  FileText,
  Printer,
  Mail,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { computePlatformPricingMetrics } from '../../types';
import { getLegalDocuments, LegalDocId } from './legalPoliciesData';

interface LegalPoliciesViewProps {
  activePolicy: LegalDocId;
  onSelectPolicy: (doc: LegalDocId) => void;
  onBackToOverview: () => void;
  onOpenSignup: () => void;
}

export const LegalPoliciesView: React.FC<LegalPoliciesViewProps> = ({
  activePolicy,
  onSelectPolicy,
  onBackToOverview,
  onOpenSignup,
}) => {
  const { platformPricing } = useStock();
  const pricingMetrics = computePlatformPricingMetrics(platformPricing);

  const docs = getLegalDocuments({
    trialDays: pricingMetrics.trialDays,
    monthlyPriceFormatted: pricingMetrics.monthlyPriceFormatted,
    annualPriceClean: pricingMetrics.annualPriceClean,
    annualPriceFormatted: pricingMetrics.annualPriceFormatted,
    annualSavingsPercent: pricingMetrics.annualSavingsPercent,
  });

  const currentDoc = docs[activePolicy];

  const policyTabs: { id: LegalDocId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { id: 'refund', label: 'Refund Policy', icon: RefreshCw },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
  ];

  const handleJumpToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="relative z-10 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Action & Segmented Policy Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#dc9750]/25 no-print">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBackToOverview}
            className="px-3.5 py-2 rounded-xl bg-[#25304f]/90 hover:bg-[#2d3a5e] border border-[#dc9750]/35 text-xs font-bold text-slate-100 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#dc9750]" />
            <span>Back to Overview</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-slate-100 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5 text-[#dc9750]" />
            <span>Print Document</span>
          </button>
        </div>

        {/* Interactive Policy Switcher Tabs */}
        <div
          role="tablist"
          aria-label="Legal Policy Documents"
          className="flex flex-wrap items-center gap-1.5 p-1 bg-[#141a2e]/90 border border-[#dc9750]/30 rounded-xl"
        >
          {policyTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activePolicy === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectPolicy(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#dc9750] text-[#1e2640] shadow-xs'
                    : 'text-slate-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1e2640]' : 'text-[#dc9750]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Editorial Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sticky Sidebar: Table of Contents & Official Compliance Info */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6 no-print">
          <div className="rounded-2xl bg-[#161d33]/95 border border-[#dc9750]/30 p-5 sm:p-6">
            <div className="text-xs font-extrabold text-[#e8ac6e] tracking-wide mb-1">
              Document Contents
            </div>
            <h2 className="text-base font-black text-white tracking-tight mb-4">
              {currentDoc.title}
            </h2>

            <nav aria-label="Section Navigation" className="space-y-1">
              {currentDoc.sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => handleJumpToSection(sec.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition flex items-baseline gap-2.5 cursor-pointer"
                >
                  <span className="font-mono font-bold text-[#dc9750] tabular-nums shrink-0">
                    {sec.number}.
                  </span>
                  <span className="leading-snug">{sec.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Official Compliance & Support Card */}
          <div className="rounded-2xl bg-[#161d33]/95 border border-white/12 p-5 sm:p-6 space-y-3 text-xs text-slate-300">
            <div className="font-extrabold text-white text-sm">
              Legal &amp; Billing Inquiries
            </div>
            <p className="leading-relaxed text-slate-300">
              Official operator for Apex Stock Enterprise SaaS workspaces, multi-tenant cloud storage, and billing settlements:
            </p>
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Globe className="w-3.5 h-3.5 text-[#dc9750] shrink-0" />
                <span>https://apexstox.com</span>
              </div>
              <a
                href="mailto:support@apexstox.com"
                className="flex items-center gap-2 text-[#e8ac6e] hover:underline font-bold"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>support@apexstox.com</span>
              </a>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={onOpenSignup}
                className="w-full py-2.5 px-4 rounded-xl bg-[#dc9750] hover:bg-[#e7a662] text-[#1e2640] font-black text-xs transition cursor-pointer whitespace-nowrap"
              >
                Start {pricingMetrics.trialDays}-Day Free Trial
              </button>
            </div>
          </div>
        </aside>

        {/* Right High-Legibility Editorial Legal Paper */}
        <article className="lg:col-span-8 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-10 print:shadow-none print:border-none print:p-0">
          {/* Document Header */}
          <header className="pb-6 mb-8 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium mb-3">
              <span>Apex Stock Enterprise SaaS</span>
              <span aria-hidden="true">·</span>
              <span>Effective {currentDoc.effectiveDate}</span>
              <span aria-hidden="true">·</span>
              <span>Version {currentDoc.version}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight text-balance">
              {currentDoc.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-2.5 leading-relaxed max-w-2xl">
              {currentDoc.subtitle}
            </p>

            {/* Executive Summary Notice */}
            <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Key Commitments Summary</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {currentDoc.summary}
              </p>
            </div>
          </header>

          {/* Numbered Legal Clauses */}
          <div className="space-y-9">
            {currentDoc.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 pt-6 first:pt-0 border-t border-slate-200/80 first:border-t-0"
              >
                <h2 className="text-base sm:text-lg font-extrabold text-slate-950 tracking-tight mb-3 flex items-baseline gap-2.5">
                  <span className="font-mono text-sm font-bold text-emerald-700 tabular-nums">
                    {section.number}.
                  </span>
                  <span>{section.title}</span>
                </h2>

                <div className="space-y-3 text-sm text-slate-700 leading-relaxed max-w-[72ch]">
                  {section.paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-4 space-y-2.5 pl-4 list-disc marker:text-emerald-700 text-sm text-slate-700 leading-relaxed max-w-[72ch]">
                    {section.bullets.map((b, bIdx) => (
                      <li key={bIdx}>
                        <strong className="text-slate-900">{b.label}:</strong> {b.text}
                      </li>
                    ))}
                  </ul>
                )}

                {section.table && (
                  <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-900 font-bold">
                          {section.table.headers.map((h) => (
                            <th key={h} className="py-3 px-4">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {section.table.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="bg-white hover:bg-slate-50/70 transition-colors">
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className={`py-3 px-4 align-top leading-relaxed ${
                                  cIdx === 0 ? 'font-bold text-slate-900 whitespace-nowrap sm:whitespace-normal' : 'text-slate-700'
                                }`}
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
              </section>
            ))}
          </div>

          {/* Document Footer Sign-off */}
          <footer className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Last Updated: {currentDoc.lastUpdated} · Apex Developer (apexstox.com)
            </div>
            <div>
              Official Inquiries:{' '}
              <a
                href="mailto:support@apexstox.com"
                className="font-bold text-emerald-700 hover:underline"
              >
                support@apexstox.com
              </a>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
};
