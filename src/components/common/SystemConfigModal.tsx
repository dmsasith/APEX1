import React, { useState, useEffect } from 'react';
import {
  Sliders,
  X,
  Check,
  Building2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Palette,
  AlertTriangle,
  Barcode,
  Usb,
  Camera,
  Volume2,
  RefreshCw,
  Database,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { APP_THEMES } from '../../utils/themeUtils';
import { isSuperAdmin } from '../../types';
import { playScanBeep } from '../../utils/barcodeUtils';

interface SystemConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemConfigModal: React.FC<SystemConfigModalProps> = ({ isOpen, onClose }) => {
  const { config, updateConfig, currentUser, activeItems, autoGenerateMissingBarcodes, firebaseConnected } = useStock();
  const isCentralAdmin = isSuperAdmin(currentUser?.role) || currentUser?.username === 'admin';

  const [companyName, setCompanyName] = useState(config.companyName || '');
  const [systemName, setSystemName] = useState(config.systemName || '');
  const [defaultLowStockThreshold, setDefaultLowStockThreshold] = useState<number>(config.defaultLowStockThreshold || 10);
  const [currencySymbol, setCurrencySymbol] = useState(config.currencySymbol || 'Rs.');
  const [address, setAddress] = useState(config.address || '');
  const [phone, setPhone] = useState(config.phone || '');
  const [email, setEmail] = useState(config.email || '');
  const [themeId, setThemeId] = useState(config.themeId || config.logoColor || 'emerald');
  const [usdToLkrRate, setUsdToLkrRate] = useState<number>(config.usdToLkrRate || 332.64);

  // Barcode & Scanner Settings
  const [barcodeEnabled, setBarcodeEnabled] = useState<boolean>(config.barcodeEnabled !== false);
  const [usbScannerEnabled, setUsbScannerEnabled] = useState<boolean>(config.usbScannerEnabled !== false);
  const [mobileCameraScannerEnabled, setMobileCameraScannerEnabled] = useState<boolean>(config.mobileCameraScannerEnabled !== false);
  const [barcodeAutoSelect, setBarcodeAutoSelect] = useState<boolean>(config.barcodeAutoSelect !== false);
  const [barcodeBeepEnabled, setBarcodeBeepEnabled] = useState<boolean>(config.barcodeBeepEnabled !== false);
  const [barcodeSymbology, setBarcodeSymbology] = useState<'CODE128' | 'CODE39' | 'EAN13'>(config.barcodeSymbology || 'CODE128');
  const [barcodePrefix, setBarcodePrefix] = useState<string>(config.barcodePrefix || 'APX-');
  const [usbScanMaxLatencyMs, setUsbScanMaxLatencyMs] = useState<number>(config.usbScanMaxLatencyMs || 60);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [barcodeSyncNotice, setBarcodeSyncNotice] = useState<string | null>(null);

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

      setBarcodeEnabled(config.barcodeEnabled !== false);
      setUsbScannerEnabled(config.usbScannerEnabled !== false);
      setMobileCameraScannerEnabled(config.mobileCameraScannerEnabled !== false);
      setBarcodeAutoSelect(config.barcodeAutoSelect !== false);
      setBarcodeBeepEnabled(config.barcodeBeepEnabled !== false);
      setBarcodeSymbology(config.barcodeSymbology || 'CODE128');
      setBarcodePrefix(config.barcodePrefix || 'APX-');
      setUsbScanMaxLatencyMs(config.usbScanMaxLatencyMs || 60);

      setSavedSuccess(false);
      setBarcodeSyncNotice(null);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const missingBarcodesCount = activeItems.filter((i) => !i.barcode || !i.barcode.trim()).length;

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
      barcodeEnabled,
      usbScannerEnabled,
      mobileCameraScannerEnabled,
      barcodeAutoSelect,
      barcodeBeepEnabled,
      barcodeSymbology,
      barcodePrefix: (barcodePrefix || 'APX-').trim().toUpperCase(),
      usbScanMaxLatencyMs: Math.max(20, Math.min(200, Number(usbScanMaxLatencyMs) || 60)),
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
              <h2 className="font-bold text-lg text-white leading-tight">System Settings &amp; Operational Control</h2>
              <p className="text-xs text-slate-400">Super Admin Central Global Configuration &amp; Barcode Sync</p>
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
              System Settings can only be configured by the Super Admin Central.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>System &amp; Barcode settings updated and synced to Firebase!</span>
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

            {/* Section 2: Barcode & Scanner Control (USB HID + Mobile Camera + Firebase Sync) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Barcode &amp; Scanner Settings (USB &amp; Mobile Camera)</span>
                </h3>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  <span>{firebaseConnected ? 'Firebase Cloud Synced' : 'Local + Cloud Sync'}</span>
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-start gap-2.5 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={barcodeEnabled}
                      onChange={(e) => setBarcodeEnabled(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Barcode className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Enable System-Wide Barcode Scanning</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Activates barcode scanning across Main Stock, Requisitions, Dispatch, Returns &amp; Catalog.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={usbScannerEnabled}
                      onChange={(e) => setUsbScannerEnabled(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Usb className="w-3.5 h-3.5 text-blue-600" />
                        <span>Allow USB / Bluetooth Gun (HID Mode)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Auto-detects rapid hardware barcode gun triggers terminated by Enter/Tab.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mobileCameraScannerEnabled}
                      onChange={(e) => setMobileCameraScannerEnabled(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Allow Mobile Phone Camera &amp; Photo Scan</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Enables live rear/front mobile camera scanning and image file barcode decoding.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={barcodeAutoSelect}
                      onChange={(e) => setBarcodeAutoSelect(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-slate-900">
                        Instant Auto-Select / Auto-Add on Scan
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Immediately selects the matched item or increments quantity (+1) when scanned.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Barcode Format, Prefix, Speed & Audio Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Label Symbology</label>
                    <select
                      value={barcodeSymbology}
                      onChange={(e) => setBarcodeSymbology(e.target.value as 'CODE128' | 'CODE39' | 'EAN13')}
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900"
                    >
                      <option value="CODE128">CODE-128 (Standard)</option>
                      <option value="CODE39">CODE-39 (Industrial)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Auto Barcode Prefix</label>
                    <input
                      type="text"
                      value={barcodePrefix}
                      onChange={(e) => setBarcodePrefix(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white text-slate-900"
                      placeholder="APX-"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">USB Gun Speed (ms)</label>
                    <input
                      type="number"
                      min={20}
                      max={200}
                      value={usbScanMaxLatencyMs}
                      onChange={(e) => setUsbScanMaxLatencyMs(Number(e.target.value))}
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Laser Beep Sound</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setBarcodeBeepEnabled(!barcodeBeepEnabled)}
                        className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          barcodeBeepEnabled
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-600 border-slate-300'
                        }`}
                      >
                        {barcodeBeepEnabled ? 'ON' : 'OFF'}
                      </button>
                      <button
                        type="button"
                        onClick={() => playScanBeep('success', true)}
                        className="p-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
                        title="Test Laser Beep Sound"
                      >
                        <Volume2 className="w-4 h-4 text-emerald-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* One-Click Firebase Barcode Sync for Existing Catalog Items */}
                <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-800">Catalog Barcode Status:</span>{' '}
                    {missingBarcodesCount === 0 ? (
                      <span className="text-emerald-700 font-semibold">
                        All {activeItems.length} active items have assigned barcodes synced with Firebase.
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold">
                        {missingBarcodesCount} of {activeItems.length} items do not have an explicit barcode yet.
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const res = autoGenerateMissingBarcodes();
                      setBarcodeSyncNotice(
                        res.updatedCount > 0
                          ? `Generated & synced ${res.updatedCount} barcode(s) to Firebase!`
                          : 'All items already have barcodes assigned & synced!'
                      );
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sync &amp; Generate Missing Barcodes</span>
                  </button>
                </div>

                {barcodeSyncNotice && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{barcodeSyncNotice}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Stock Control & Theme Defaults */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Stock Control &amp; Visual Theme</span>
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
