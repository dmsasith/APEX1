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
  Sparkles,
  ShieldCheck,
  X,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { TenantRegistrationForm } from '../../types';
import { TermsConditionsModal } from './TermsConditionsModal';

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
  const { registerTenant } = useStock();

  const [formData, setFormData] = useState<TenantRegistrationForm>({
    companyName: '',
    slug: '',
    adminFullName: '',
    adminEmail: '',
    adminPassword: '',
    contactPhone: '',
    currencySymbol: 'Rs.',
    country: 'Sri Lanka',
    initialWarehouseName: 'Central Main Warehouse',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  if (!isOpen) return null;

  const handleCompanyNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setFormData((prev) => ({
      ...prev,
      companyName: name,
      slug,
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
    if (!formData.adminEmail.trim()) {
      setErrorMsg('Please enter your administrator email address.');
      return;
    }
    if (!formData.adminPassword || formData.adminPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = registerTenant(formData);
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
              <Sparkles className="w-3 h-3" />
              <span>7-Day Free Trial · $0 Today</span>
            </span>
            <span className="text-xs text-slate-400">Then $19.90/mo or $189/yr (Save 21%)</span>
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
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Workspace Slug / Identifier
                </label>
                <div className="relative">
                  <span className="text-[11px] text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 font-mono">
                    app/
                  </span>
                  <input
                    type="text"
                    placeholder="apex-telecom"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))
                    }
                    className="w-full pl-11 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
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
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kasun Fernando"
                      value={formData.adminFullName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, adminFullName: e.target.value }))
                      }
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
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
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="+94 77 123 4567"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))
                      }
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Warehouse & Currency Preferences */}
            <div className="border-t border-slate-800/80 pt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2 block">
                Warehouse & Currency
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Initial Central Main Yard Name
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
                  <span className="font-bold text-slate-200">100% Risk Free:</span> No credit card required to start. Your 7-day free trial gives full access to all features. Continue for $19.90/month thereafter.
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 checked:bg-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="terms" className="text-xs text-slate-400">
                  I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-emerald-400 hover:underline font-bold">Terms & Conditions</button>
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
                    <span>Create Workspace & Start 7-Day Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <TermsConditionsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </>
  );
};
