import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Edit3,
  Check,
  X,
  Bell,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Layers,
  Trash2,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Camera,
  Boxes,
  Factory,
  Cpu,
  Palette,
  ShieldAlert,
  LogOut,
  Zap,
  FileSpreadsheet,
} from 'lucide-react';
import { useStock } from '../context/StockContext';
import { ConfirmModal } from './common/ConfirmModal';
import { SystemBackupModal } from './backup/SystemBackupModal';
import { SubscriptionModal } from './subscription/SubscriptionModal';
import { UserProfileModal } from './auth/UserProfileModal';
import { EmailVerificationModal } from './auth/EmailVerificationModal';
import { SystemConfigModal } from './common/SystemConfigModal';
import { getThemeConfig, APP_THEMES } from '../utils/themeUtils';
import { isCentralOrAllSiteAdmin, isSuperAdmin } from '../types';

interface HeaderProps {
  onOpenPendingRequests?: () => void;
  onOpenRecycleBin?: () => void;
  onReturnToGateway?: () => void;
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

export const Header: React.FC<HeaderProps> = ({ onOpenPendingRequests, onOpenRecycleBin, onReturnToGateway }) => {
  const {
    config,
    updateConfig,
    currentUser,
    authUser,
    setViewAsUser,
    logout,
    activeUsers,
    activeSites,
    pendingRequestsCount,
    recycleBinCount,
    firebaseConnected,
    isFirebaseSyncing,
    syncWithFirebaseNow,
    firebaseDbUrl,
    currentTenant,
  } = useStock();

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);

  const isAdmin = isCentralOrAllSiteAdmin(currentUser?.role) || currentUser?.username === 'admin' || authUser?.username === 'admin';

  const [isEditingNames, setIsEditingNames] = useState(false);
  const [tempCompanyName, setTempCompanyName] = useState(config.companyName);
  const [tempSystemName, setTempSystemName] = useState(config.systemName);

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

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

    if (typeof document !== 'undefined') {
      document.title = `${config.companyName} | ${config.systemName}`;
    }
  }, [config]);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const currentThemeId = config.themeId || config.logoColor || 'emerald';
  const currentTheme = getThemeConfig(currentThemeId);
  const isCentralAdmin = isSuperAdmin(authUser?.role) || authUser?.username === 'admin';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--theme-primary', currentTheme.accentHex);
      document.documentElement.setAttribute('data-theme', currentThemeId);
    }
  }, [currentTheme, currentThemeId]);

  const handleSaveInlineNames = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCentralAdmin) {
      showStatus('Access restricted: Only Super Admin Central can edit company names.');
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

  const handleOpenLogoModal = () => {
    if (!isCentralAdmin) {
      showStatus('Access restricted: Only Super Admin Central can change Company Identity & Logo.');
      return;
    }
    setShowLogoModal(true);
  };

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

  const activeSiteName =
    currentUser.siteId === 'all'
      ? 'Central HQ / All Sites'
      : activeSites.find((s) => s.id === currentUser.siteId)?.name || 'Branch Site';

  const renderCurrentLogo = (type: 'icon' | 'image' | 'monogram', image?: string, iconId?: string, monogram?: string, color?: string) => {
    if (type === 'image' && image) {
      return <img src={image} alt={config.companyName} className="w-full h-full object-contain rounded-lg p-0.5" />;
    }
    if (type === 'monogram') {
      const selectedColor = MONOGRAM_COLORS.find((c) => c.id === color) || MONOGRAM_COLORS[0];
      return (
        <div className={`w-full h-full rounded-lg ${selectedColor.bgClass} flex items-center justify-center font-bold text-white text-xs tracking-wider shadow-inner`}>
          {monogram || config.companyName.slice(0, 2).toUpperCase()}
        </div>
      );
    }
    const iconObj = PRESET_ICONS.find((p) => p.id === iconId) || PRESET_ICONS[0];
    const IconComponent = iconObj.icon;
    return <IconComponent className="w-5 h-5 text-emerald-600" />;
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/88 backdrop-blur-xl text-slate-900 border-b border-white/95 shadow-[0_8px_28px_-10px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,1)]">
        {/* Main Top Liquid Glass Bar - Aligned to exact same 1600px grid as Workspace */}
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-2.5 min-h-[60px] flex items-center justify-between gap-4">
          {/* Zone 1: Company & System Identity (Left-aligned with Sidebar) */}
          <div className="flex items-center gap-3.5 min-w-0">
            {isCentralAdmin ? (
              <button
                type="button"
                onClick={handleOpenLogoModal}
                className="group relative w-10 h-10 rounded-2xl bg-gradient-to-br from-white to-emerald-50/90 border border-white shadow-[0_6px_16px_-4px_rgba(16,185,129,0.22),inset_0_1.5px_0_rgba(255,255,255,1)] flex items-center justify-center shrink-0 transition-transform duration-150 hover:scale-105 cursor-pointer"
                title="Click to customize Company Logo & Identity (Main Admin Only)"
              >
                {renderCurrentLogo(config.logoType || (config.logoImage ? 'image' : 'icon'), config.logoImage, config.logoIcon, config.logoMonogram, config.logoColor)}
                <div className="absolute inset-0 bg-slate-900/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </button>
            ) : (
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-white to-emerald-50/90 border border-white shadow-[0_6px_16px_-4px_rgba(16,185,129,0.18),inset_0_1.5px_0_rgba(255,255,255,1)] flex items-center justify-center shrink-0">
                {renderCurrentLogo(config.logoType || (config.logoImage ? 'image' : 'icon'), config.logoImage, config.logoIcon, config.logoMonogram, config.logoColor)}
              </div>
            )}

            {!isEditingNames ? (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  {isCentralAdmin ? (
                    <>
                      <span
                        onClick={handleOpenLogoModal}
                        className="font-extrabold text-slate-900 tracking-tight text-base sm:text-[17px] leading-tight truncate cursor-pointer hover:text-emerald-700 transition-colors"
                        title="Click to customize"
                      >
                        {config.companyName}
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenLogoModal}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                        aria-label="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-[17px] leading-tight truncate">
                      {config.companyName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 truncate mt-0.5">
                  <span className="text-emerald-700 font-semibold truncate">{config.systemName}</span>
                  <span aria-hidden="true" className="text-slate-300 hidden sm:inline">·</span>
                  <span className="text-slate-500 hidden sm:inline font-medium whitespace-nowrap">Liquid Glass Enterprise OS</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveInlineNames} className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-lg">
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    value={tempCompanyName}
                    onChange={(e) => setTempCompanyName(e.target.value)}
                    placeholder="Company Name"
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-48 sm:w-60"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={tempSystemName}
                    onChange={(e) => setTempSystemName(e.target.value)}
                    placeholder="System Name"
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-emerald-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-48 sm:w-60"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <button type="submit" className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center justify-center cursor-pointer" title="Save">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setIsEditingNames(false)} className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs flex items-center justify-center cursor-pointer" title="Cancel">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Zone 2: Liquid Glass Action Controls & Status (Right-aligned with Main Workspace) */}
          <div className="hidden lg:flex items-center gap-2 text-xs shrink-0">
            {onReturnToGateway && authUser.username === 'admin' && (
              <button
                type="button"
                onClick={onReturnToGateway}
                className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap bg-white/90 hover:bg-white text-teal-800 border border-slate-200/90 shadow-2xs transition cursor-pointer"
                title="Return to Developer Portal Gateway"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Portal Gateway</span>
              </button>
            )}

            {/* Subscription Trial Badge & Verify Email Badge (Admin Only) */}
            {isAdmin && currentTenant && (() => {
              const sub = currentTenant.subscription;
              const expiry = new Date(sub.trialEndsAt || sub.nextBillingDate || Date.now());
              const daysLeft = Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
              const planLabel = sub.plan === 'pro_annual' ? 'Pro Annual' : sub.plan === 'pro_monthly' ? 'Pro Monthly' : 'Free Trial';

              return (
                <button
                  type="button"
                  onClick={() => setShowSubscriptionModal(true)}
                  className={`h-9 flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap border transition cursor-pointer shadow-2xs ${
                    sub.status === 'trialing'
                      ? 'bg-amber-50/90 hover:bg-amber-100/80 border-amber-300 text-amber-900'
                      : 'bg-emerald-50/90 hover:bg-emerald-100/80 border-emerald-300 text-emerald-900'
                  }`}
                  title={`Subscription: ${planLabel} (${daysLeft} days remaining). Click to view details.`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{planLabel} ({daysLeft}d left)</span>
                </button>
              );
            })()}

            {isAdmin && currentTenant && (
              !currentTenant.emailVerified ? (
                <button
                  type="button"
                  onClick={() => setShowEmailVerifyModal(true)}
                  className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap bg-amber-100/90 hover:bg-amber-200/70 border border-amber-300 text-amber-900 transition cursor-pointer shadow-2xs"
                  title="Verify Email"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Verify Email</span>
                </button>
              ) : (
                <div
                  className="h-9 flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap bg-emerald-50/90 border border-emerald-200 text-emerald-800"
                  title="Email Verified"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Verified</span>
                </div>
              )
            )}

            {pendingRequestsCount > 0 && (
              <button
                onClick={onOpenPendingRequests}
                className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl whitespace-nowrap bg-amber-50/90 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{pendingRequestsCount} Pending</span>
              </button>
            )}

            {recycleBinCount > 0 && (
              <button
                onClick={onOpenRecycleBin}
                className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl whitespace-nowrap bg-rose-50/90 hover:bg-rose-100 border border-rose-200 text-rose-800 font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{recycleBinCount} in Bin</span>
              </button>
            )}

            {/* Backup/Flush & Settings - Restricted to Central Admin */}
            {isCentralAdmin && (
              <>
                <button
                  onClick={() => setShowBackupModal(true)}
                  className="h-8 px-2.5 rounded-xl whitespace-nowrap bg-rose-50/90 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition"
                  title="Backup & Flush"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Backup & Flush</span>
                </button>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border border-slate-200 cursor-pointer shadow-2xs transition shrink-0"
                  title="System Settings (Main Admin Only)"
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Row 2: Sub-Bar (Aligned to exact same 1600px grid as Row 1 & Workspace) */}
        <div className="bg-slate-50/85 border-t border-slate-200/75">
          <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
            {/* Active User Controls (Left-aligned with Logo & Sidebar) */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <div className="h-8 flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-2.5 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                  title="Click to edit account profile & email"
                >
                  {currentUser?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U'}
                </button>
                <div className="flex items-center gap-1.5 min-w-0">
                  {isCentralAdmin ? (
                    <select
                      value={currentUser.id}
                      onChange={(e) => setViewAsUser(activeUsers.find((u) => u.id === e.target.value)!)}
                      className="bg-transparent text-slate-900 font-bold text-xs focus:outline-none cursor-pointer truncate max-w-[165px]"
                    >
                      {activeUsers.map((u) => (
                        <option key={u.id} value={u.id} className="bg-white text-slate-900">
                          {u.id === authUser.id ? `★ ${u.fullName}` : u.fullName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-bold text-slate-900 text-xs truncate max-w-[165px]">
                      {currentUser?.fullName} ({currentUser?.role})
                    </span>
                  )}
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(true)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-600 font-bold cursor-pointer hover:underline whitespace-nowrap"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="h-8 flex items-center gap-1.5 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs cursor-pointer transition whitespace-nowrap"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5 text-white shrink-0" />
                <span>Log Out</span>
              </button>
            </div>

            {/* Status & Scope (Right-aligned with Action Buttons & Main Workspace) */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <div className="h-8 flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-3 text-slate-600 shadow-2xs whitespace-nowrap">
                <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Scope: <strong className="text-slate-900">{activeSiteName}</strong>
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>
                  Role: <strong className="text-emerald-700">{currentUser.role}</strong>
                </span>
              </div>

              <div className="h-8 flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-xl px-3 text-xs shadow-2xs whitespace-nowrap">
                <Palette className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-slate-500 font-medium">Glass Tone:</span>
                <select
                  value={currentThemeId}
                  onChange={(e) => updateConfig({ themeId: e.target.value, logoColor: e.target.value })}
                  className="bg-transparent text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  {Object.entries(APP_THEMES).map(([key, t]) => (
                    <option key={key} value={key} className="bg-white text-slate-900">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden xl:flex h-8 items-center gap-1.5 bg-white border border-slate-200/90 rounded-xl px-3 text-[11px] font-bold text-slate-800 shadow-2xs whitespace-nowrap">
                <span className="text-emerald-600">◆</span>
                <span>Apex Developer | System Developed By Sasith Dissanayake</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modals rendered outside <header> so fixed positioning covers 100% of the screen */}
      {showLogoModal && isCentralAdmin && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="font-bold text-lg text-slate-900">Company Identity & Logo</h3>
              <button onClick={() => setShowLogoModal(false)} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveBranding} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
                <input type="text" required value={modalCompanyName} onChange={(e) => setModalCompanyName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Application / System Subtitle</label>
                <input
                  type="text"
                  value={modalSystemName}
                  onChange={(e) => currentTenant?.id === 'tenant-apex-main' && setModalSystemName(e.target.value)}
                  readOnly={currentTenant?.id !== 'tenant-apex-main'}
                  className={`w-full px-3 py-2 border border-slate-300 rounded-xl text-sm ${currentTenant?.id !== 'tenant-apex-main' ? 'bg-slate-100 text-slate-500' : ''}`}
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowLogoModal(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold">Save & Apply Identity</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <SystemConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
      <SystemBackupModal isOpen={showBackupModal} onClose={() => setShowBackupModal(false)} />
      <SubscriptionModal isOpen={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} />
      <UserProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <EmailVerificationModal isOpen={showEmailVerifyModal} onClose={() => setShowEmailVerifyModal(false)} />
    </>
  );
};
