import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Edit3,
  Check,
  X,
  UserCheck,
  Bell,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Layers,
  Trash2,
  AlertTriangle,
  Database,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Camera,
  Boxes,
  Factory,
  Cpu,
  Palette,
  ShieldAlert,
} from 'lucide-react';
import { useStock } from '../context/StockContext';
import { ConfirmModal } from './common/ConfirmModal';
import { SystemBackupModal } from './backup/SystemBackupModal';
import { getThemeConfig, APP_THEMES } from '../utils/themeUtils';

interface HeaderProps {
  onOpenPendingRequests?: () => void;
  onOpenRecycleBin?: () => void;
}

const PRESET_ICONS = [
  { id: 'building', name: 'Building', icon: Building2 },
  { id: 'boxes', name: 'Warehouse / Boxes', icon: Boxes },
  { id: 'factory', name: 'Factory / Yard', icon: Factory },
  { id: 'shield', name: 'Shield / Security', icon: ShieldCheck },
  { id: 'sparkles', name: 'Modern / Tech', icon: Sparkles },
  { id: 'cpu', name: 'Industrial / IoT', icon: Cpu },
  { id: 'layers', name: 'Logistics Layers', icon: Layers },
];

const MONOGRAM_COLORS = [
  { id: 'emerald', bgClass: 'bg-emerald-600', borderClass: 'border-emerald-400', label: 'Emerald' },
  { id: 'blue', bgClass: 'bg-blue-600', borderClass: 'border-blue-400', label: 'Sapphire' },
  { id: 'indigo', bgClass: 'bg-indigo-600', borderClass: 'border-indigo-400', label: 'Indigo' },
  { id: 'purple', bgClass: 'bg-purple-600', borderClass: 'border-purple-400', label: 'Purple' },
  { id: 'amber', bgClass: 'bg-amber-600', borderClass: 'border-amber-400', label: 'Amber' },
  { id: 'rose', bgClass: 'bg-rose-600', borderClass: 'border-rose-400', label: 'Crimson' },
  { id: 'slate', bgClass: 'bg-slate-700', borderClass: 'border-slate-500', label: 'Slate' },
];

export const Header: React.FC<HeaderProps> = ({ onOpenPendingRequests, onOpenRecycleBin }) => {
  const {
    config,
    updateConfig,
    resetAllData,
    clearAllDemoData,
    restoreDemoData,
    currentUser,
    setCurrentUser,
    activeUsers,
    activeSites,
    pendingRequestsCount,
    totalLowStockAlertsCount,
    recycleBinCount,
    firebaseConnected,
    isFirebaseSyncing,
    syncWithFirebaseNow,
    firebaseDbUrl,
  } = useStock();

  // Inline quick editing state
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [tempCompanyName, setTempCompanyName] = useState(config.companyName);
  const [tempSystemName, setTempSystemName] = useState(config.systemName);

  // Dedicated Company Identity & Logo Customizer Modal
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [modalCompanyName, setModalCompanyName] = useState(config.companyName);
  const [modalSystemName, setModalSystemName] = useState(config.systemName);
  const [modalLogoType, setModalLogoType] = useState<'icon' | 'image' | 'monogram'>(
    config.logoType || (config.logoImage ? 'image' : 'icon')
  );
  const [modalLogoImage, setModalLogoImage] = useState<string>(config.logoImage || '');
  const [modalLogoIcon, setModalLogoIcon] = useState<string>(config.logoIcon || 'building');
  const [modalLogoMonogram, setModalLogoMonogram] = useState<string>(
    config.logoMonogram || config.companyName.slice(0, 2).toUpperCase()
  );
  const [modalLogoColor, setModalLogoColor] = useState<string>(config.logoColor || 'emerald');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // General Settings & Reset Modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showReloadConfirmModal, setShowReloadConfirmModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Keep state synchronized whenever config updates (e.g. from Firebase subscription or localStorage)
  useEffect(() => {
    setTempCompanyName(config.companyName);
    setTempSystemName(config.systemName);
    setModalCompanyName(config.companyName);
    setModalSystemName(config.systemName);
    setModalLogoType(config.logoType || (config.logoImage ? 'image' : 'icon'));
    setModalLogoImage(config.logoImage || '');
    setModalLogoIcon(config.logoIcon || 'building');
    setModalLogoMonogram(config.logoMonogram || config.companyName.slice(0, 2).toUpperCase());
    setModalLogoColor(config.logoColor || 'emerald');

    // Sync HTML document title
    if (typeof document !== 'undefined') {
      document.title = `${config.companyName} | ${config.systemName}`;
    }
  }, [
    config.companyName,
    config.systemName,
    config.logoType,
    config.logoImage,
    config.logoIcon,
    config.logoMonogram,
    config.logoColor,
  ]);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const currentThemeId = config.themeId || config.logoColor || 'emerald';
  const currentTheme = getThemeConfig(currentThemeId);
  const isCentralAdmin = currentUser?.role === 'Central Warehouse Admin';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--theme-primary', currentTheme.accentHex);
      document.documentElement.setAttribute('data-theme', currentThemeId);
    }
  }, [currentTheme, currentThemeId]);

  // Quick inline name save
  const handleSaveInlineNames = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCentralAdmin) {
      showStatus('Access restricted: Only Central Warehouse Admin can edit company names.');
      setIsEditingNames(false);
      return;
    }
    if (tempCompanyName.trim() && tempSystemName.trim()) {
      updateConfig({
        companyName: tempCompanyName.trim(),
        systemName: tempSystemName.trim(),
      });
      setIsEditingNames(false);
      showStatus('Company & System Name updated and applied.');
    }
  };

  // Open Full Logo & Identity modal
  const handleOpenLogoModal = () => {
    if (!isCentralAdmin) {
      showStatus('Access restricted: Only Central Warehouse Admin can change Company Identity & Logo.');
      return;
    }
    setModalCompanyName(config.companyName);
    setModalSystemName(config.systemName);
    setModalLogoType(config.logoType || (config.logoImage ? 'image' : 'icon'));
    setModalLogoImage(config.logoImage || '');
    setModalLogoIcon(config.logoIcon || 'building');
    setModalLogoMonogram(config.logoMonogram || config.companyName.slice(0, 2).toUpperCase());
    setModalLogoColor(config.logoColor || 'emerald');
    setShowLogoModal(true);
  };

  // Handle Logo Image Upload (Converts file to base64 Data URL)
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Selected image exceeds 2MB. Please choose a smaller logo file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      if (base64Data) {
        setModalLogoImage(base64Data);
        setModalLogoType('image');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Full Branding & Identity
  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCompanyName.trim()) return;

    const updatedConfig = {
      companyName: modalCompanyName.trim(),
      systemName: modalSystemName.trim() || 'Apex Stock & Site Management System',
      logoType: modalLogoType,
      logoImage: modalLogoType === 'image' ? modalLogoImage : '',
      logoIcon: modalLogoIcon,
      logoMonogram: modalLogoMonogram.trim().toUpperCase(),
      logoColor: modalLogoColor,
    };

    updateConfig(updatedConfig);
    setShowLogoModal(false);
    showStatus('Company name & logo updated and applied successfully.');
  };

  const handleConfirmClearDemoData = () => {
    clearAllDemoData();
    setShowClearConfirmModal(false);
    setShowConfigModal(false);
    showStatus('All sample data cleared. System ready for production.');
  };

  const activeSiteName =
    currentUser.siteId === 'all'
      ? 'Central HQ / All Sites'
      : activeSites.find((s) => s.id === currentUser.siteId)?.name || 'Branch Site';

  // Helper to render dynamic logo
  const renderCurrentLogo = (type: 'icon' | 'image' | 'monogram', image?: string, iconId?: string, monogram?: string, color?: string) => {
    if (type === 'image' && image) {
      return (
        <img
          src={image}
          alt={config.companyName}
          className="w-full h-full object-contain rounded-lg p-0.5"
        />
      );
    }

    if (type === 'monogram') {
      const selectedColor = MONOGRAM_COLORS.find((c) => c.id === color) || MONOGRAM_COLORS[0];
      return (
        <div className={`w-full h-full rounded-lg ${selectedColor.bgClass} flex items-center justify-center font-bold text-white text-xs tracking-wider shadow-inner`}>
          {monogram || config.companyName.slice(0, 2).toUpperCase()}
        </div>
      );
    }

    // Default or chosen icon
    const iconObj = PRESET_ICONS.find((p) => p.id === iconId) || PRESET_ICONS[0];
    const IconComponent = iconObj.icon;
    return <IconComponent className="w-5 h-5 text-emerald-400" />;
  };

  return (
    <header className={`sticky top-0 z-30 ${currentTheme.headerBg} text-white border-b ${currentTheme.headerBorder} shadow-md transition-colors duration-200`}>
      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Company & System Identity (Dynamic Logo + Name Display & Click to Edit) */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Company Brand Logo: Interactive for Central Warehouse Admin, Static for others */}
          {isCentralAdmin ? (
            <button
              type="button"
              onClick={handleOpenLogoModal}
              className="group relative w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400 flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs"
              title="Click to customize Company Logo & Identity (Main Admin Only)"
              aria-label="Change Company Logo"
            >
              {renderCurrentLogo(
                config.logoType || (config.logoImage ? 'image' : 'icon'),
                config.logoImage,
                config.logoIcon,
                config.logoMonogram,
                config.logoColor
              )}
              <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </button>
          ) : (
            <div
              className="relative w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs"
              title="Company Brand Identity"
            >
              {renderCurrentLogo(
                config.logoType || (config.logoImage ? 'image' : 'icon'),
                config.logoImage,
                config.logoIcon,
                config.logoMonogram,
                config.logoColor
              )}
            </div>
          )}

          {!isEditingNames ? (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                {isCentralAdmin ? (
                  <>
                    <span
                      onClick={handleOpenLogoModal}
                      className="font-bold text-slate-100 tracking-tight text-base sm:text-lg truncate cursor-pointer hover:text-emerald-300 transition-colors"
                      title="Click to customize Company Name & Logo (Main Admin Only)"
                    >
                      {config.companyName}
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenLogoModal}
                      title="Change Company Name & Logo (Main Admin Only)"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      aria-label="Edit Company Identity & Logo"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <span className="font-bold text-slate-100 tracking-tight text-base sm:text-lg truncate">
                    {config.companyName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
                <span className="text-emerald-400 font-medium truncate">{config.systemName}</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-300 hidden sm:inline">Live Stock & Site Control</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveInlineNames} className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-lg border border-slate-700">
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  value={tempCompanyName}
                  onChange={(e) => setTempCompanyName(e.target.value)}
                  placeholder="Company Name"
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48 sm:w-60"
                  autoFocus
                />
                <input
                  type="text"
                  value={tempSystemName}
                  onChange={(e) => setTempSystemName(e.target.value)}
                  placeholder="System / Application Name"
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48 sm:w-60"
                />
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="submit"
                  className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center justify-center cursor-pointer"
                  title="Save and Apply"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingNames(false)}
                  className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs flex items-center justify-center cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Zone 2: Status / Alerts Quick Badges (Low stock box removed per request) */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          {pendingRequestsCount > 0 && (
            <button
              onClick={onOpenPendingRequests}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>{pendingRequestsCount} Pending Request{pendingRequestsCount > 1 ? 's' : ''}</span>
            </button>
          )}

          {recycleBinCount > 0 && (
            <button
              onClick={onOpenRecycleBin}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition-colors font-medium cursor-pointer"
              title="Open Recycle Bin"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{recycleBinCount} in Recycle Bin</span>
            </button>
          )}
        </div>

        {/* Zone 3: Active User Role Switcher & Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Role & Site Simulator (Login Button) */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1 text-xs shadow-xs">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-400 font-medium">Logged in Role:</span>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const selected = activeUsers.find((u) => u.id === e.target.value);
                  if (selected) setCurrentUser(selected);
                }}
                className="bg-transparent text-slate-100 font-semibold text-xs focus:outline-none cursor-pointer pr-1"
                title="Switch Active User / Role"
              >
                {activeUsers.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                    {u.fullName} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Firebase RTDB Live Indicator */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-slate-300"
            title={`Firebase Realtime Database: ${firebaseDbUrl}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                firebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-mono text-[11px] font-semibold text-slate-200">Firebase RTDB</span>
            <button
              onClick={async () => {
                await syncWithFirebaseNow();
                showStatus('Synced directly with Firebase Realtime Database.');
              }}
              disabled={isFirebaseSyncing}
              className="p-0.5 hover:text-white transition-colors cursor-pointer"
              title="Click to force sync with Firebase"
            >
              <RotateCcw className={`w-3 h-3 ${isFirebaseSyncing ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
            </button>
          </div>

          {/* Admin System Backup & Flush Button (Visible ONLY to Central Warehouse Admin) */}
          {isCentralAdmin && (
            <button
              onClick={() => setShowBackupModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-white transition-colors border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Admin Password Protected Full System Flush & Versioned Backups (Main Admin Only)"
              aria-label="Backup & Flush"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Backup & Flush</span>
            </button>
          )}

          {/* Quick System Settings & Demo Reset */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 cursor-pointer"
            title="System Configuration & Administrative Data Reset"
            aria-label="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-bar below Top Bar: Scope Indicator (Left) & Heading + Theme Dropdown directly below Login on the Right */}
      <div className={`${currentTheme.headerSubBarBg} border-t ${currentTheme.headerBorder} px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400 transition-colors duration-200`}>
        {/* Left: Active Scope & Role */}
        <div className="flex items-center gap-2 truncate">
          <Layers className={`w-3.5 h-3.5 ${currentTheme.accentText} shrink-0`} />
          <span>Active Scope:</span>
          <span className="text-slate-100 font-semibold">{activeSiteName}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Role: <strong className={`${currentTheme.accentText} font-medium`}>{currentUser.role}</strong></span>
          {statusMessage && (
            <span className={`${currentTheme.accentText} text-xs font-semibold animate-pulse ml-2`}>
              {statusMessage}
            </span>
          )}
        </div>

        {/* Right Side: Developer Badge, Heading & Theme Dropdown placed directly under Login/Role button */}
        <div className="flex items-center gap-2.5 sm:gap-3 self-end sm:self-auto shrink-0 flex-wrap">
          {/* Permanent Developer Credit Badge */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs shadow-2xs shrink-0 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="font-bold text-amber-300 text-[11px] tracking-tight">System Developed By Sasith Dissanayake</span>
          </div>

          <span className="text-slate-600" aria-hidden="true">|</span>

          {/* Theme Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-md px-2 py-1 text-xs text-slate-200 shadow-2xs">
            <Palette className={`w-3 h-3 ${currentTheme.accentText} shrink-0`} />
            <span className="text-[10px] text-slate-400 font-medium">Theme:</span>
            <select
              value={currentThemeId}
              onChange={(e) => {
                const selected = e.target.value;
                updateConfig({ themeId: selected, logoColor: selected });
                showStatus(`Theme switched to ${APP_THEMES[selected]?.name || selected}`);
              }}
              className="bg-transparent text-slate-100 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              title="System Theme / Brand Color"
            >
              {Object.entries(APP_THEMES).map(([key, t]) => (
                <option key={key} value={key} className="bg-slate-900 text-slate-100">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* MODAL 1: Dedicated Company Identity & Logo Branding Customizer (Main Admin Only) */}
      {showLogoModal && isCentralAdmin && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Company Identity & Logo</h3>
                  <p className="text-xs text-slate-500">Customize branding across system and vouchers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-4">
              {/* Live Preview Card */}
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-white">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">Live Header Preview</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    {renderCurrentLogo(
                      modalLogoType,
                      modalLogoImage,
                      modalLogoIcon,
                      modalLogoMonogram,
                      modalLogoColor
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-slate-100 tracking-tight text-base truncate">
                      {modalCompanyName || 'Company Name'}
                    </span>
                    <span className="text-xs text-emerald-400 font-medium truncate">
                      {modalSystemName || 'System Name'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={modalCompanyName}
                  onChange={(e) => {
                    setModalCompanyName(e.target.value);
                    if (modalLogoType === 'monogram' && !modalLogoMonogram) {
                      setModalLogoMonogram(e.target.value.slice(0, 2).toUpperCase());
                    }
                  }}
                  placeholder="e.g. Comtec Systems"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Application / System Subtitle</label>
                <input
                  type="text"
                  value={modalSystemName}
                  onChange={(e) => setModalSystemName(e.target.value)}
                  placeholder="e.g. Apex Stock & Site Management System"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {/* Logo Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Choose Logo Format</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalLogoType('image')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      modalLogoType === 'image'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Image / Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalLogoType('monogram')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      modalLogoType === 'monogram'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Monogram</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalLogoType('icon')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      modalLogoType === 'icon'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>System Icon</span>
                  </button>
                </div>
              </div>

              {/* Conditional Logo Controls */}
              {modalLogoType === 'image' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Upload Image File (PNG, JPG, SVG)</span>
                    {modalLogoImage && (
                      <button
                        type="button"
                        onClick={() => setModalLogoImage('')}
                        className="text-[11px] text-rose-600 hover:underline font-medium cursor-pointer"
                      >
                        Remove Logo Image
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>Browse Logo File...</span>
                    </button>
                    <span className="text-xs text-slate-500">Max size 2MB</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Or Paste Image URL directly:</label>
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={modalLogoImage.startsWith('data:') ? '' : modalLogoImage}
                      onChange={(e) => setModalLogoImage(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>
              )}

              {modalLogoType === 'monogram' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Monogram Text (1-4 letters)</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={modalLogoMonogram}
                        onChange={(e) => setModalLogoMonogram(e.target.value.toUpperCase())}
                        placeholder="e.g. CS"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-mono font-bold tracking-widest text-center uppercase focus:outline-none focus:border-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Emblem Color</label>
                      <div className="flex items-center gap-1.5 mt-1">
                        {MONOGRAM_COLORS.map((col) => (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => setModalLogoColor(col.id)}
                            className={`w-6 h-6 rounded-full ${col.bgClass} border-2 transition-all cursor-pointer ${
                              modalLogoColor === col.id ? 'border-slate-900 scale-110 shadow-xs' : 'border-transparent opacity-80 hover:opacity-100'
                            }`}
                            title={col.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalLogoType === 'icon' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Select Icon Symbol</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {PRESET_ICONS.map((item) => {
                      const IconComp = item.icon;
                      const isSelected = modalLogoIcon === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setModalLogoIcon(item.id)}
                          className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 text-[10px] border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-emerald-400 border-slate-900 shadow-xs font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                          title={item.name}
                        >
                          <IconComp className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogoModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Save & Apply Identity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: General System & Administration Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-slate-700" />
                <h3 className="font-semibold text-lg text-slate-900">System & Data Administration</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Quick Branding Shortcut */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    {renderCurrentLogo(
                      config.logoType || (config.logoImage ? 'image' : 'icon'),
                      config.logoImage,
                      config.logoIcon,
                      config.logoMonogram,
                      config.logoColor
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{config.companyName}</div>
                    <div className="text-[11px] text-slate-500">{config.systemName}</div>
                  </div>
                </div>
                {isCentralAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfigModal(false);
                      handleOpenLogoModal();
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-emerald-400" />
                    <span>Edit Logo & Identity</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  disabled={!isCentralAdmin}
                  value={config.companyName}
                  onChange={(e) => updateConfig({ companyName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm font-medium ${
                    !isCentralAdmin
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                      : 'border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Application / System Name</label>
                <input
                  type="text"
                  disabled={!isCentralAdmin}
                  value={config.systemName}
                  onChange={(e) => updateConfig({ systemName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${
                    !isCentralAdmin
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                      : 'border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Low Stock Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={config.defaultLowStockThreshold}
                    onChange={(e) => updateConfig({ defaultLowStockThreshold: Number(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Triggers Bold Red indicator when stock ≤ this value</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={config.currencySymbol}
                    onChange={(e) => updateConfig({ currencySymbol: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Requirement: Administrative Settings section with "Clear All Demo Data" button - Main Admin Only */}
              {isCentralAdmin && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-2">
                    <Database className="w-4 h-4 text-slate-700" />
                    <span>Administrative Production Reset (Main Admin Only)</span>
                  </div>
                  <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-lg space-y-2">
                    <div className="text-xs text-rose-900">
                      <strong>Production Readiness:</strong> Wipe all dummy items, sample site branches, fake field crews, and test transaction notes to start with a pristine, blank system.
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowClearConfirmModal(true)}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear All Demo Data</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          restoreDemoData();
                          showStatus('Sample demo dataset restored.');
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        Reload Demo Data
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowConfigModal(false);
                  showStatus('Settings saved and applied.');
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing All Demo Data */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Clear All Demo Data?</h3>
                <p className="text-xs text-slate-500">Pristine Production Reset</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed mb-4">
              Are you sure you want to delete all demo transactions, dummy sites, items, and team data?
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1 mb-5">
              <div>✓ Purges all sample PO entries, transfer requisitions, dispatches, and returns.</div>
              <div>✓ Cleans dummy site branches, items, and teams.</div>
              <div>✓ Leaves a clean default Super Admin ready to register live business data.</div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearDemoData}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Clear All Demo Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Reloading Demo Data */}
      <ConfirmModal
        isOpen={showReloadConfirmModal}
        title="Reload Sample Infrastructure Records?"
        message="Are you sure you want to reload default sample demo records? This will restore sample items, transactions, sites, and teams to showcase the system."
        confirmLabel="Reload Demo Records"
        isDestructive={false}
        onConfirm={() => {
          restoreDemoData();
          setShowReloadConfirmModal(false);
          showStatus('Demo dataset reloaded successfully.');
        }}
        onClose={() => setShowReloadConfirmModal(false)}
      />

      {/* Admin Password Protected Full System Flush & Versioned Backups Modal */}
      <SystemBackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
      />
    </header>
  );
};
