import React, { useState, useEffect } from 'react';
import { Building2, Mail, Phone, Globe, DollarSign, X, Check, Edit3 } from 'lucide-react';
import { Tenant } from '../../types';

interface TenantWorkspaceEditModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    tenantId: string,
    updates: Partial<Pick<Tenant, 'companyName' | 'contactEmail' | 'contactPhone' | 'currencySymbol' | 'country' | 'slug'>>
  ) => void;
}

export const TenantWorkspaceEditModal: React.FC<TenantWorkspaceEditModalProps> = ({
  tenant,
  isOpen,
  onClose,
  onSave,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('Rs.');
  const [country, setCountry] = useState('Sri Lanka');
  const [slug, setSlug] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (tenant && isOpen) {
      setCompanyName(tenant.companyName || '');
      setContactEmail(tenant.contactEmail || '');
      setContactPhone(tenant.contactPhone || '');
      setCurrencySymbol(tenant.currencySymbol || 'Rs.');
      setCountry(tenant.country || 'Sri Lanka');
      setSlug(tenant.slug || '');
      setErrorMsg('');
    }
  }, [tenant, isOpen]);

  if (!isOpen || !tenant) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCompany = companyName.trim();
    const cleanEmail = contactEmail.trim();

    if (!cleanCompany) {
      setErrorMsg('Company Name is required.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid admin contact email address.');
      return;
    }

    const cleanSlug = (slug.trim() || cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, '-')).replace(/-+/g, '-');

    onSave(tenant.id, {
      companyName: cleanCompany,
      contactEmail: cleanEmail,
      contactPhone: contactPhone.trim(),
      currencySymbol: currencySymbol.trim() || 'Rs.',
      country: country.trim() || 'Sri Lanka',
      slug: cleanSlug,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Edit Workspace Details</h2>
              <p className="text-xs text-slate-400">Update company profile, admin email &amp; credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Company / Workspace Name *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Developer"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Admin Contact Email * (විද්‍යුත් තැපෑල)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.g. apexdevinfo@gmail.com"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Used in Client Workspaces Directory, invoices, and billing verification queues.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Currency Symbol
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="Rs. or USD"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Country
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Sri Lanka"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Workspace URL Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. apex-developer"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Save Workspace Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
