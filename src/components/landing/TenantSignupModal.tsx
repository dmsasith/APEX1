import React, { useState } from 'react';
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  Coins,
  Warehouse,
  CheckCircle2,
  ShieldCheck,
  X,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  TenantRegistrationForm,
  computePlatformPricingMetrics,
  isGenericSuperAdminName,
  stripSuperAdminSuffix,
} from '../../types';
import { TermsConditionsModal } from './TermsConditionsModal';
import { LegalDocId } from './legalPoliciesData';
import {
  detectActivePhoneCountry,
  enforceCountryPhoneInput,
  analyzeCountryPhone,
} from '../../utils/phoneCountryUtils';
import { ALL_WORLD_COUNTRIES } from '../../utils/worldCountriesData';
import { PhoneCountryBadge } from '../common/PhoneCountryBadge';
import { SearchableCountrySelect } from '../common/SearchableCountrySelect';

interface TenantSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: () => void;
}

export const TenantSignupModal: React.FC<TenantSignupModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
}) => {
  const { registerTenant, platformPricing } = useStock();
  const pricingMetrics = computePlatformPricingMetrics(platformPricing);

  const initialDetectedRule = detectActivePhoneCountry();

  const [formData, setFormData] = useState<TenantRegistrationForm>({
    companyName: '',
    slug: '',
    adminFullName: '',
    adminEmail: '',
    adminPassword: '',
    contactPhone: '',
    currencySymbol: initialDetectedRule.currencies[0] || 'Rs.',
    country: initialDetectedRule.name || 'Sri Lanka',
    initialWarehouseName: 'Central Main Warehouse',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [legalDocTab, setLegalDocTab] = useState<LegalDocId>('terms');

  if (!isOpen) return null;

  const activeCountryRule = detectActivePhoneCountry({
    phoneValue: formData.contactPhone,
    tenantCountry: formData.country,
    currencySymbol: formData.currencySymbol,
  });

  const generateWorkspaceSlug = (name: string): string =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const handleCompanyNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      companyName: name,
      slug: generateWorkspaceSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!agreedToTerms) {
      setErrorMsg('You must agree to the Terms & Conditions to proceed.');
      return;
    }

    if (!formData.companyName.trim()) {
      setErrorMsg('Please enter your company or business name.');
      return;
    }
    const cleanAdminName = stripSuperAdminSuffix(formData.adminFullName);
    if (!cleanAdminName || cleanAdminName.length < 2 || isGenericSuperAdminName(cleanAdminName)) {
      setErrorMsg(
        'Super Admin Full Name is mandatory (e.g. Kamal Perera). Generic names like "Admin" or "Super Admin" are not allowed.'
      );
      return;
    }
    if (!formData.adminEmail.trim()) {
      setErrorMsg('Please enter your administrator email address.');
      return;
    }
    if (!formData.adminPassword || formData.adminPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if ((formData.contactPhone || '').trim()) {
      const phoneCheck = analyzeCountryPhone(formData.contactPhone || '', {
        tenantCountry: formData.country,
        currencySymbol: formData.currencySymbol,
      });
      if (!phoneCheck.isValid) {
        setErrorMsg(phoneCheck.error || 'Please enter a valid phone number for your selected country.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const submissionPayload: TenantRegistrationForm = {
        ...formData,
        slug: generateWorkspaceSlug(formData.companyName),
      };
      const res = registerTenant(submissionPayload);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onClose();
          if (onSuccessLogin) onSuccessLogin();
        }, 1200);
      } else {
        setErrorMsg(res.message);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create workspace.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-slate-800/80 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{pricingMetrics.trialDays}-Day Free Trial · $0 Today</span>
            </span>
            <span className="text-xs text-slate-400">
              Then ${pricingMetrics.monthlyPriceFormatted}/mo or ${pricingMetrics.annualPriceClean}/yr (Save {pricingMetrics.annualSavingsPercent}%)
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Register Your Company Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Get instant access to your private, isolated multi-site inventory platform in under 60 seconds.
          </p>
        </div>

        {/* Content & Form */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-950/60 border border-emerald-700 rounded-xl text-xs text-emerald-300 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Company / Organization Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Telecommunications"
                    value={formData.companyName}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-xs font-bold text-slate-300">
                    Workspace Slug / Identifier
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>Auto-generated · View-Only</span>
                  </span>
                </div>
                <div className="relative">
                  <span className="text-[11px] text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 font-mono pointer-events-none">
                    app/
                  </span>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    aria-readonly="true"
                    placeholder="auto-generated-from-company"
                    value={formData.slug}
                    className="w-full pl-11 pr-8 py-2 bg-slate-950/45 border border-slate-800/90 rounded-xl text-xs font-mono text-emerald-400/90 placeholder:text-slate-600 cursor-not-allowed select-all focus:outline-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Administrator Account */}
            <div className="border-t border-slate-800/80 pt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2 block">
                Super Admin Account
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Super Admin Full Name <span className="text-emerald-400">(Mandatory) *</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kamal Perera"
                      value={formData.adminFullName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, adminFullName: e.target.value }))
                      }
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Your First Name is verified on Super Admin login &amp; actions log as <strong className="text-slate-200">{stripSuperAdminSuffix(formData.adminFullName) || 'Your Name'} (as Super Admin)</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Admin Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="kasun@company.com"
                      value={formData.adminEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, adminEmail: e.target.value }))
                      }
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Admin Password * (Min 6 chars)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={formData.adminPassword}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, adminPassword: e.target.value }))
                      }
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label className="block text-xs font-bold text-slate-300">
                      Contact Phone Number
                    </label>
                    <PhoneCountryBadge
                      value={formData.contactPhone}
                      countryOverride={formData.country}
                      currencyOverride={formData.currencySymbol}
                      dark
                    />
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder={activeCountryRule.localPlaceholder}
                      value={formData.contactPhone}
                      onChange={(e) => {
                        const capped = enforceCountryPhoneInput(e.target.value, {
                          tenantCountry: formData.country,
                          currencySymbol: formData.currencySymbol,
                        });
                        setFormData((prev) => ({ ...prev, contactPhone: capped }));
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Country, Warehouse & Currency Preferences */}
            <div className="border-t border-slate-800/80 pt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2 block">
                Country, Warehouse &amp; Currency
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Operating Country (All Countries)
                  </label>
                  <SearchableCountrySelect
                    variant="dark"
                    value={formData.country || 'Sri Lanka'}
                    onChange={(selectedCountryObj) => {
                      const nextCurrency = selectedCountryObj.defaultCurrency || formData.currencySymbol;
                      setFormData((prev) => ({
                        ...prev,
                        country: selectedCountryObj.name,
                        currencySymbol: nextCurrency,
                        contactPhone: enforceCountryPhoneInput(prev.contactPhone || '', {
                          tenantCountry: selectedCountryObj.name,
                          currencySymbol: nextCurrency,
                        }),
                      }));
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Default Currency Symbol
                  </label>
                  <div className="relative">
                    <Coins className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={formData.currencySymbol}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, currencySymbol: e.target.value }))
                      }
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Rs.">Rs. (Sri Lankan Rupee)</option>
                      <option value="$">$ (USD - US Dollar)</option>
                      <option value="€">€ (EUR - Euro)</option>
                      <option value="£">£ (GBP - British Pound)</option>
                      <option value="₹">₹ (INR - Indian Rupee)</option>
                      <option value="AED">AED (UAE Dirham)</option>
                      <option value="A$">A$ (Australian Dollar)</option>
                      <option value="S$">S$ (Singapore Dollar)</option>
                      <option value="QAR">QAR (Qatari Riyal)</option>
                      <option value="SAR">SAR (Saudi Riyal)</option>
                      <option value="MVR">MVR (Maldivian Rufiyaa)</option>
                      {(() => {
                        const presetCurrencies = new Set([
                          'Rs.',
                          '$',
                          '€',
                          '£',
                          '₹',
                          'AED',
                          'A$',
                          'S$',
                          'QAR',
                          'SAR',
                          'MVR',
                        ]);
                        const uniqueExtra = new Map<string, string>();
                        ALL_WORLD_COUNTRIES.forEach((wc) => {
                          if (!presetCurrencies.has(wc.defaultCurrency) && !uniqueExtra.has(wc.defaultCurrency)) {
                            uniqueExtra.set(wc.defaultCurrency, wc.currencyLabel);
                          }
                        });
                        return Array.from(uniqueExtra.entries()).map(([code, label]) => (
                          <option key={code} value={code}>
                            {label}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Initial Central Main Yard
                  </label>
                  <div className="relative">
                    <Warehouse className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Central Main Warehouse"
                      value={formData.initialWarehouseName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          initialWarehouseName: e.target.value,
                        }))
                      }
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Trial Guarantee Callout & Terms Checkbox */}
            <div className="space-y-3">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  <span className="font-bold text-slate-200">100% Risk Free:</span> No credit card required to start. Your {pricingMetrics.trialDays}-day free trial gives full access to all features. Continue for ${pricingMetrics.monthlyPriceFormatted}/month thereafter.
                </div>
              </div>
              
              <div className="flex items-start gap-2 px-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-950 checked:bg-emerald-500 focus:ring-emerald-500 cursor-pointer shrink-0"
                />
                <label htmlFor="terms" className="text-xs text-slate-400 leading-relaxed">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setLegalDocTab('terms');
                      setShowTermsModal(true);
                    }}
                    className="text-emerald-400 hover:underline font-bold cursor-pointer"
                  >
                    Terms &amp; Conditions
                  </button>
                  ,{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setLegalDocTab('privacy');
                      setShowTermsModal(true);
                    }}
                    className="text-emerald-400 hover:underline font-bold cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  , and{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setLegalDocTab('refund');
                      setShowTermsModal(true);
                    }}
                    className="text-emerald-400 hover:underline font-bold cursor-pointer"
                  >
                    Refund Policy
                  </button>
                  .
                </label>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Provisioning Workspace...</span>
                ) : (
                  <>
                    <span>Create Workspace & Start {pricingMetrics.trialDays}-Day Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <TermsConditionsModal
      isOpen={showTermsModal}
      onClose={() => setShowTermsModal(false)}
      initialDoc={legalDocTab}
    />
    </>
  );
};
