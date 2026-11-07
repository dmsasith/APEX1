import React, { useState, useEffect } from 'react';
import { Sliders, X, Check, Building2, Phone, Mail, MapPin, DollarSign, Palette, AlertTriangle } from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { APP_THEMES } from '../../utils/themeUtils';

interface SystemConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemConfigModal: React.FC<SystemConfigModalProps> = ({ isOpen, onClose }) => {
  const { config, updateConfig, currentUser } = useStock();
  const isCentralAdmin = currentUser?.role === 'Central Warehouse Admin';

  const [companyName, setCompanyName] = useState(config.companyName || '');
  const [systemName, setSystemName] = useState(config.systemName || '');
  const [defaultLowStockThreshold, setDefaultLowStockThreshold] = useState<number>(config.defaultLowStockThreshold || 10);
  const [currencySymbol, setCurrencySymbol] = useState(config.currencySymbol || 'Rs.');
  const [address, setAddress] = useState(config.address || '');
  const [phone, setPhone] = useState(config.phone || '');
  const [email, setEmail] = useState(config.email || '');
  const [themeId, setThemeId] = useState(config.themeId || config.logoColor || 'emerald');
  const [usdToLkrRate, setUsdToLkrRate] = useState<number>(config.usdToLkrRate || 332.64);

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCompanyName(config.companyName || '');
      setSystemName(config.systemName || '');
      setDefaultLowStockThreshold(config.defaultLowStockThreshold || 10);
      setCurrencySymbol(config.currencySymbol || 'Rs.');
      setAddress(config.address || '');
      setPhone(config.phone || '');
      setEmail(config.email || '');
      setThemeId(config.themeId || config.logoColor || 'emerald');
      setUsdToLkrRate(config.usdToLkrRate || 332.64);
      setSavedSuccess(false);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCentralAdmin) return;

    updateConfig({
      companyName: companyName.trim(),
      systemName: systemName.trim(),
      defaultLowStockThreshold: Math.max(1, Number(defaultLowStockThreshold) || 10),
      currencySymbol: currencySymbol.trim() || 'Rs.',
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      themeId,
      logoColor: themeId,
      usdToLkrRate: Number(usdToLkrRate) || 332.64,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white leading-tight">System Settings & Operational Control</h2>
              <p className="text-xs text-slate-400">Main Central Warehouse Admin Global Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isCentralAdmin ? (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              System Settings can only be configured by the Main Central Warehouse Admin.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>System settings updated and applied successfully!</span>
              </div>
            )}

            {/* Section 1: Organization & Identity */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Organization Identity</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="e.g. Apex Construction & Logistics"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">System Subtitle / Name *</label>
                  <input
                    type="text"
                    required
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="e.g. Stock & Site Management System"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> Head Office Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white text-slate-900"
                    placeholder="Colombo 03, Sri Lanka"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white text-slate-900"
                    placeholder="+94 11 2345678"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" /> Support Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white text-slate-900"
                    placeholder="info@company.com"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Stock Control & Theme Defaults */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Stock Control & Visual Theme</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Low Stock Alert Level</label>
                  <input
                    type="number"
                    min={1}
                    value={defaultLowStockThreshold}
                    onChange={(e) => setDefaultLowStockThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Default minimum quantity for alert</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-slate-400" /> Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900"
                    placeholder="Rs. or LKR"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-slate-400" /> Application Theme
                  </label>
                  <select
                    value={themeId}
                    onChange={(e) => setThemeId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900"
                  >
                    {Object.entries(APP_THEMES).map(([key, t]) => (
                      <option key={key} value={key}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Exchange Rate (1 USD to LKR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={100}
                  value={usdToLkrRate}
                  onChange={(e) => setUsdToLkrRate(Number(e.target.value))}
                  className="w-full sm:w-48 px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold font-mono bg-white text-slate-900"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 italic">
                Apex Developer | System Developed By Sasith Dissanayake
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Save System Settings</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
