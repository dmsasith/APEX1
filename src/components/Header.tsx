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
  Award,
  Crown,
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
  Barcode,
  ChevronDown,
  Play,
  BookOpen,
} from 'lucide-react';
import { useStock } from '../context/StockContext';
import { ConfirmModal } from './common/ConfirmModal';
import { SystemBackupModal } from './backup/SystemBackupModal';
import { SubscriptionModal } from './subscription/SubscriptionModal';
import { UserProfileModal } from './auth/UserProfileModal';
import { EmailVerificationModal } from './auth/EmailVerificationModal';
import { SystemConfigModal } from './common/SystemConfigModal';
import { BarcodeScannerModal } from './common/BarcodeScannerModal';
import { TutorialVideosModal } from './common/TutorialVideosModal';
import { SystemUserGuideView } from './landing/SystemUserGuideView';
import { getThemeConfig, APP_THEMES } from '../utils/themeUtils';
import {
  isCentralOrAllSiteAdmin,
  isSuperAdmin,
  isUserAllSites,
  getUserAssignedSiteIds,
  getSubscriptionStatusSummary,
  formatActorDisplayName,
  stripSuperAdminSuffix,
  isGenericSuperAdminName,
  normalizeTutorialVideos,
} from '../types';

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
  { id: 'sparkles', name: 'Executive / Award', icon: Award },
  { id: 'cpu', name: 'Industrial / IoT', icon: Cpu },
  { id: 'layers', name: 'Logistics Layers', icon: Layers },
];

const MONOGRAM_COLORS = [
  { id: 'sapphire', bgClass: 'bg-blue-800', borderClass: 'border-amber-400', label: 'Sapphire & Gold' },
  { id: 'emerald', bgClass: 'bg-emerald-600', borderClass: 'border-emerald-400', label: 'Emerald' },
  { id: 'teal', bgClass: 'bg-teal-600', borderClass: 'border-teal-400', label: 'Teal' },
  { id: 'blue', bgClass: 'bg-blue-600', borderClass: 'border-blue-400', label: 'Cobalt' },
  { id: 'indigo', bgClass: 'bg-indigo-600', borderClass: 'border-indigo-400', label: 'Indigo' },
  { id: 'purple', bgClass: 'bg-purple-600', borderClass: 'border-purple-400', label: 'Amethyst' },
  { id: 'amber', bgClass: 'bg-amber-600', borderClass: 'border-amber-400', label: 'Amber' },
  { id: 'rose', bgClass: 'bg-rose-600', borderClass: 'border-rose-400', label: 'Crimson' },
  { id: 'slate', bgClass: 'bg-slate-700', borderClass: 'border-slate-500', label: 'Titanium' },
];

export const Header: React.FC<HeaderProps> = React.memo(({ onOpenPendingRequests, onOpenRecycleBin, onReturnToGateway }) => {
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
    superAdminOperatorName,
    setSuperAdminOperatorName,
    actorDisplayName,
    superAdminDisplayLabel,
    needsSuperAdminIdentity,
    platformPricing,
  } = useStock();

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [suggestedExtraSiteSlots, setSuggestedExtraSiteSlots] = useState<number | undefined>(undefined);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
  const [dismissedIdentityPrompt, setDismissedIdentityPrompt] = useState(false);
  const [identityInput, setIdentityInput] = useState('');
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [showTutorialVideosModal, setShowTutorialVideosModal] = useState(false);
  const [isTutorialMinimized, setIsTutorialMinimized] = useState(false);
  const [showUserGuideModal, setShowUserGuideModal] = useState(false);
  const [userGuideModalLang, setUserGuideModalLang] = useState<'en' | 'si'>('en');
  const tutorialVideosCount = normalizeTutorialVideos(platformPricing?.tutorialVideos).length;

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
  const [modalLogoColor, setModalLogoColor] = useState<string>(config.logoColor || 'sapphire');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showBarcodeLookupModal, setShowBarcodeLookupModal] = useState(false);
  const [showToneMenu, setShowToneMenu] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const toneMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempCompanyName(config.companyName);
    setTempSystemName(config.systemName);
    setModalCompanyName(config.companyName);
    setModalSystemName(config.systemName);
    setModalLogoType(config.logoType || (config.logoImage ? 'image' : 'icon'));
    setModalLogoImage(config.logoImage || '');
    setModalLogoIcon(config.logoIcon || 'building');
    setModalLogoMonogram(config.logoMonogram || config.companyName.slice(0, 2).toUpperCase());
    setModalLogoColor(config.logoColor || 'sapphire');

    if (typeof document !== 'undefined') {
      document.title = `${config.companyName} | ${config.systemName}`;
    }
  }, [config]);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const currentTheme = getThemeConfig(config.glassTone);
  const currentThemeId = currentTheme.id;
  const isCentralAdmin = isSuperAdmin(authUser?.role) || authUser?.username === 'admin';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--theme-primary', currentTheme.accentHex);
      document.documentElement.setAttribute('data-theme', currentThemeId);
    }
  }, [currentTheme, currentThemeId]);

  useEffect(() => {
    const handleOpenSub = (e: Event) => {
      const detail = (e as CustomEvent<{ suggestedExtraSiteSlots?: number }>)?.detail;
      setSuggestedExtraSiteSlots(
        typeof detail?.suggestedExtraSiteSlots === 'number' ? detail.suggestedExtraSiteSlots : undefined
      );
      setShowSubscriptionModal(true);
    };
    window.addEventListener('open-subscription-modal', handleOpenSub);
    return () => window.removeEventListener('open-subscription-modal', handleOpenSub);
  }, []);

  useEffect(() => {
    if (!needsSuperAdminIdentity) {
      setIdentityInput('');
      setIdentityError(null);
    }
  }, [needsSuperAdminIdentity]);

  const handleSaveSuperAdminIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = stripSuperAdminSuffix(identityInput);
    if (!clean || isGenericSuperAdminName(clean)) {
      setIdentityError(
        'Please enter your actual personal Full Name (e.g. Sasith Dissanayake). Generic labels like "System Super Admin" cannot be used for audit logs.'
      );
      return;
    }
    setSuperAdminOperatorName(clean, true);
    setIdentityError(null);
    setDismissedIdentityPrompt(false);
    showStatus(`Signed in for audit logs as: ${clean} (as Super Admin)`);
  };

  useEffect(() => {
    if (!showToneMenu) return;
    const handleOutside = (e: MouseEvent) => {
      if (toneMenuRef.current && !toneMenuRef.current.contains(e.target as Node)) {
        setShowToneMenu(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowToneMenu(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showToneMenu]);

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

  const assignedHeaderSiteIds = getUserAssignedSiteIds(currentUser, activeSites);
  const assignedHeaderSiteNames = assignedHeaderSiteIds
    .map((sid) => activeSites.find((s) => s.id === sid)?.name)
    .filter((n): n is string => Boolean(n));
  const activeSiteName = isUserAllSites(currentUser)
    ? 'Central HQ / All Sites'
    : assignedHeaderSiteNames.length > 1
    ? `${assignedHeaderSiteNames[0]} +${assignedHeaderSiteNames.length - 1} more`
    : assignedHeaderSiteNames[0] || 'Branch Site';

  const renderCurrentLogo = (type: 'icon' | 'image' | 'monogram', image?: string, iconId?: string, monogram?: string, color?: string) => {
    if (type === 'image' && image) {
      return (
        <div className="w-full h-full rounded-[14px] bg-white/95 flex items-center justify-center p-0.5">
          <img src={image} alt={config.companyName} className="w-full h-full object-contain rounded-lg" />
        </div>
      );
    }
    if (type === 'monogram') {
      const selectedColor = MONOGRAM_COLORS.find((c) => c.id === color) || MONOGRAM_COLORS[0];
      return (
        <div className={`w-full h-full rounded-[14px] ${selectedColor.bgClass} flex items-center justify-center font-bold text-white text-xs tracking-wider shadow-inner`}>
          {monogram || config.companyName.slice(0, 2).toUpperCase()}
        </div>
      );
    }
    const iconObj = PRESET_ICONS.find((p) => p.id === iconId) || PRESET_ICONS[0];
    const IconComponent = iconObj.icon;
    return <IconComponent className={`w-5 h-5 ${currentTheme.logoBadgeText} stroke-[2.2]`} />;
  };

  return (
    <>
      <header className={`sticky top-0 z-30 ${currentTheme.headerBg} text-white border-b ${currentTheme.headerBorder} shadow-[0_14px_38px_-12px_rgba(2,6,18,0.68),inset_0_1px_0_rgba(255,255,255,0.12)] transition-colors duration-200`}>
        {/* Top Specular Crystal Rule matching Active Glass Tone */}
        <div className={`h-[2px] w-full ${currentTheme.topRuleBg}`} />

        {/* Main Top Glass Bar - Aligned to exact same 1680px grid as Workspace */}
        <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-5 lg:px-5 py-2.5 min-h-[60px] flex items-center justify-between gap-3 xl:gap-4">
          {/* Zone 1: Company & System Identity (Left-aligned with Sidebar) */}
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {isCentralAdmin ? (
              <button
                type="button"
                onClick={handleOpenLogoModal}
                className={`group relative w-10 h-10 rounded-2xl border ${currentTheme.logoBadgeBg} flex items-center justify-center shrink-0 transition-transform duration-150 hover:scale-105 cursor-pointer`}
                title="Click to customize Company Logo & Identity (Main Admin Only)"
              >
                {renderCurrentLogo(config.logoType || (config.logoImage ? 'image' : 'icon'), config.logoImage, config.logoIcon, config.logoMonogram, config.logoColor)}
                <div className="absolute inset-0 bg-[#071026]/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className={`w-4 h-4 ${currentTheme.accentText}`} />
                </div>
              </button>
            ) : (
              <div className={`relative w-10 h-10 rounded-2xl border ${currentTheme.logoBadgeBg} flex items-center justify-center shrink-0`}>
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
                        className={`font-extrabold text-white tracking-tight text-base sm:text-[17px] leading-tight truncate cursor-pointer ${currentTheme.accentHoverText} transition-colors`}
                        title="Click to customize"
                      >
                        {config.companyName}
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenLogoModal}
                        className={`p-1 rounded-lg text-slate-400 ${currentTheme.accentHoverText} hover:bg-white/10 transition-colors cursor-pointer shrink-0`}
                        aria-label="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="font-extrabold text-white tracking-tight text-base sm:text-[17px] leading-tight truncate">
                      {config.companyName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 truncate mt-0.5">
                  <span className={`${currentTheme.accentText} font-semibold truncate`}>{config.systemName}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveInlineNames} className={`flex items-center gap-2 ${currentTheme.headerPillBg} p-1.5 rounded-2xl border shadow-lg`}>
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    value={tempCompanyName}
                    onChange={(e) => setTempCompanyName(e.target.value)}
                    placeholder="Company Name"
                    className={`${currentTheme.headerInputBg} border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-400 focus:outline-none w-48 sm:w-60`}
                    autoFocus
                  />
                  <input
                    type="text"
                    value={tempSystemName}
                    onChange={(e) => setTempSystemName(e.target.value)}
                    placeholder="System Name"
                    className={`${currentTheme.headerInputBg} border border-white/20 rounded-lg px-2.5 py-1 text-[11px] ${currentTheme.accentText} placeholder-slate-400 focus:outline-none w-48 sm:w-60`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <button type="submit" className={`p-1.5 rounded-lg ${currentTheme.primaryCtaBg} text-xs flex items-center justify-center cursor-pointer`} title="Save">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setIsEditingNames(false)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs flex items-center justify-center cursor-pointer" title="Cancel">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Zone 2: Sapphire Glass Action Controls & Status (Right-aligned with Main Workspace) */}
          <div className="hidden lg:flex flex-wrap items-center justify-end gap-1.5 xl:gap-2 text-xs min-w-0">
            {onReturnToGateway && authUser.username === 'admin' && (
              <button
                type="button"
                onClick={onReturnToGateway}
                className={`h-9 flex items-center gap-1.5 px-3 xl:px-3.5 rounded-xl text-xs font-bold whitespace-nowrap bg-white/[0.08] hover:bg-white/[0.15] ${currentTheme.accentText} border border-white/15 shadow-2xs transition cursor-pointer`}
                title="Return to Developer Portal Gateway"
              >
                <Zap className={`w-3.5 h-3.5 ${currentTheme.accentText} shrink-0`} />
                <span>Portal Gateway</span>
              </button>
            )}

            {/* Subscription Trial Badge & Verify Email Badge (Admin Only) */}
            {isAdmin && currentTenant && (() => {
              const subSummary = getSubscriptionStatusSummary(currentTenant.subscription);
              const badgeStyles =
                subSummary.isExpired || subSummary.isCanceled
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-400/45 text-rose-200'
                  : subSummary.isTrial || subSummary.daysLeft <= 3
                  ? 'bg-amber-400/20 hover:bg-amber-400/30 border-amber-400/45 text-amber-200'
                  : 'bg-emerald-500/18 hover:bg-emerald-500/28 border-emerald-400/40 text-emerald-200';

              const iconColor =
                subSummary.isExpired || subSummary.isCanceled
                  ? 'text-rose-300'
                  : subSummary.isTrial || subSummary.daysLeft <= 3
                  ? 'text-amber-300'
                  : 'text-emerald-300';

              return (
                <button
                  type="button"
                  onClick={() => setShowSubscriptionModal(true)}
                  className={`h-9 flex items-center gap-1.5 px-3 xl:px-3.5 rounded-xl text-xs font-bold whitespace-nowrap border transition cursor-pointer shadow-2xs ${badgeStyles}`}
                  title={
                    subSummary.isCanceled
                      ? `Subscription: ${subSummary.planLabel} (Suspended). Click to view details.`
                      : subSummary.isExpired
                      ? `Subscription: ${subSummary.planLabel} (Expired). Click to renew or upgrade.`
                      : `Subscription: ${subSummary.planLabel} (${subSummary.daysLeft} ${
                          subSummary.daysLeft === 1 ? 'day' : 'days'
                        } remaining). Click to view details.`
                  }
                >
                  <Crown className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
                  <span>{subSummary.badgeText}</span>
                </button>
              );
            })()}

            {isAdmin && currentTenant && (
              !currentTenant.emailVerified ? (
                <button
                  type="button"
                  onClick={() => setShowEmailVerifyModal(true)}
                  className="h-9 flex items-center gap-1.5 px-3 xl:px-3.5 rounded-xl text-xs font-bold whitespace-nowrap bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/45 text-amber-200 transition cursor-pointer shadow-2xs"
                  title="Verify Email"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>Verify Email</span>
                </button>
              ) : (
                <div
                  className="h-9 flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap bg-emerald-500/15 border border-emerald-400/35 text-emerald-200"
                  title="Email Verified"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>Verified</span>
                </div>
              )
            )}

            {pendingRequestsCount > 0 && (
              <button
                onClick={onOpenPendingRequests}
                className="h-9 flex items-center gap-1.5 px-3 xl:px-3.5 rounded-xl whitespace-nowrap bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/45 text-amber-200 font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <Bell className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{pendingRequestsCount} Pending</span>
              </button>
            )}

            {recycleBinCount > 0 && (
              <button
                onClick={onOpenRecycleBin}
                className="h-9 flex items-center gap-1.5 px-3 xl:px-3.5 rounded-xl whitespace-nowrap bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                <span>{recycleBinCount} in Bin</span>
              </button>
            )}

            {/* Backup/Flush & Settings - Restricted to Central Admin */}
            {isCentralAdmin && (
              <>
                <button
                  onClick={() => setShowBackupModal(true)}
                  className="h-8 px-2.5 rounded-xl whitespace-nowrap bg-rose-500/18 hover:bg-rose-500/28 text-rose-200 border border-rose-400/35 text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition"
                  title="Backup & Flush"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                  <span>Backup & Flush</span>
                </button>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className={`h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.08] hover:bg-white/[0.16] ${currentTheme.accentText} border border-white/15 cursor-pointer shadow-2xs transition shrink-0`}
                  title="System Settings (Main Admin Only)"
                >
                  <Sliders className={`w-3.5 h-3.5 ${currentTheme.accentText}`} />
                </button>
              </>
            )}

            {/* Tutorial Videos Play Button & Bilingual User Guides (Available to All System Users) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setShowTutorialVideosModal(true);
                  setIsTutorialMinimized(false);
                }}
                className="h-9 flex items-center gap-2 px-3 rounded-xl text-xs font-extrabold whitespace-nowrap bg-gradient-to-r from-emerald-500/25 to-teal-500/25 hover:from-emerald-500/35 hover:to-teal-500/35 border border-emerald-400/50 text-emerald-100 transition cursor-pointer shadow-2xs"
                title={
                  showTutorialVideosModal && isTutorialMinimized
                    ? 'Restore Minimized Tutorial Video Window'
                    : 'Watch Step-by-Step System Tutorial Videos'
                }
              >
                <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                  <Play className="w-2.5 h-2.5 fill-slate-950 ml-0.5" />
                </span>
                <span>
                  {showTutorialVideosModal && isTutorialMinimized ? 'Tutorial (Docked)' : 'Tutorial Videos'}
                </span>
                {tutorialVideosCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-400/25 text-emerald-200 border border-emerald-400/35 text-[10px] font-black leading-none tabular-nums">
                    {tutorialVideosCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserGuideModalLang('en');
                  setShowUserGuideModal(true);
                }}
                className="h-9 flex items-center gap-1.5 px-2.5 rounded-xl text-xs font-bold whitespace-nowrap bg-white/[0.08] hover:bg-white/[0.16] border border-sky-400/40 text-sky-100 transition cursor-pointer shadow-2xs"
                title="Open Complete System User Guide (English)"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                <span>User Guide (EN)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserGuideModalLang('si');
                  setShowUserGuideModal(true);
                }}
                className="h-9 flex items-center gap-1.5 px-2.5 rounded-xl text-xs font-bold whitespace-nowrap bg-white/[0.08] hover:bg-white/[0.16] border border-amber-400/45 text-amber-100 transition cursor-pointer shadow-2xs"
                title="සිංහල පරිශීලක අත්පොත විවෘත කරන්න (Sinhala User Guide)"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>සිංහල Guide</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Theme-Synchronized Glass Sub-Bar */}
        <div className={`${currentTheme.headerSubBarBg} border-t border-white/10 transition-colors duration-200`}>
          <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-5 lg:px-5 py-2 flex flex-wrap items-center justify-between gap-2 xl:gap-3 text-xs text-slate-300">
            {/* Active User Controls (Left-aligned with Logo & Sidebar) */}
            <div className="flex items-center gap-2 min-w-0 max-w-full flex-wrap">
              <div className={`h-8 flex items-center gap-2 ${currentTheme.headerPillBg} border rounded-xl px-2.5 text-xs shadow-2xs max-w-full min-w-0`}>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className={`w-6 h-6 rounded-lg ${currentTheme.logoBadgeBg} ${currentTheme.logoBadgeText} font-extrabold text-[10px] flex items-center justify-center shrink-0 cursor-pointer shadow-2xs`}
                  title="Click to edit account profile & email"
                >
                  {(() => {
                    const opName =
                      currentUser?.id === authUser?.id && stripSuperAdminSuffix(superAdminOperatorName)
                        ? stripSuperAdminSuffix(superAdminOperatorName)
                        : stripSuperAdminSuffix(currentUser?.fullName || '');
                    const source = opName || currentUser?.username || 'U';
                    return source.split(/\s+/).filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
                  })()}
                </button>
                <div className="flex items-center gap-1.5 min-w-0">
                  {isCentralAdmin ? (
                    <select
                      value={currentUser.id}
                      onChange={(e) => setViewAsUser(activeUsers.find((u) => u.id === e.target.value)!)}
                      className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer truncate max-w-[230px] sm:max-w-[290px] xl:max-w-[340px]"
                      title={
                        currentUser.id === authUser.id
                          ? superAdminDisplayLabel
                          : formatActorDisplayName(currentUser)
                      }
                    >
                      {activeUsers.map((u) => (
                        <option key={u.id} value={u.id} className="bg-[#09132c] text-white">
                          {u.id === authUser.id
                            ? `★ ${superAdminDisplayLabel}`
                            : isSuperAdmin(u.role) || u.username === 'admin'
                            ? formatActorDisplayName(u)
                            : u.fullName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-bold text-white text-xs truncate max-w-[210px] sm:max-w-[270px]">
                      {actorDisplayName} ({currentUser?.role})
                    </span>
                  )}
                  <span className="text-white/25">·</span>
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(true)}
                    className={`text-[11px] ${currentTheme.accentText} ${currentTheme.accentHoverText} font-bold cursor-pointer hover:underline whitespace-nowrap shrink-0`}
                  >
                    Edit Profile
                  </button>
                  {needsSuperAdminIdentity && (
                    <>
                      <span className="text-white/25">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIdentityError(null);
                          setDismissedIdentityPrompt(false);
                        }}
                        className="text-[11px] bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/45 px-2 py-0.5 rounded-lg font-extrabold cursor-pointer whitespace-nowrap shrink-0 transition"
                        title="Confirm your personal name so actions don't appear as generic System Super Admin"
                      >
                        Set Admin Name
                      </button>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="group h-8 flex items-center gap-1.5 px-3 rounded-xl bg-white/[0.07] hover:bg-rose-500/20 text-slate-200 hover:text-rose-200 border border-white/14 hover:border-rose-400/40 font-bold text-xs shadow-2xs cursor-pointer transition whitespace-nowrap shrink-0"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-300 shrink-0 transition-colors" />
                <span>Log Out</span>
              </button>
            </div>

            {/* Status, Scope & Developer Credit */}
            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-1.5 xl:gap-2 min-w-0 max-w-full">
              {config.barcodeEnabled !== false && (
                <button
                  type="button"
                  onClick={() => setShowBarcodeLookupModal(true)}
                  className={`h-8 flex items-center gap-1.5 px-2.5 xl:px-3 rounded-xl border font-extrabold text-xs cursor-pointer transition whitespace-nowrap shrink-0 ${currentTheme.primaryCtaBg}`}
                  title="Scan Barcode via USB Gun or Mobile Phone Camera to check live stock"
                >
                  <Barcode className={`w-3.5 h-3.5 ${currentTheme.logoBadgeText} shrink-0`} />
                  <span>Scan Barcode</span>
                </button>
              )}

              <div
                className={`h-8 flex items-center gap-1.5 xl:gap-2 ${currentTheme.headerPillBg} border rounded-xl px-2.5 xl:px-3 text-slate-300 shadow-2xs min-w-0 max-w-full whitespace-nowrap`}
                title={`Scope: ${activeSiteName} · Role: ${currentUser.role}`}
              >
                <Layers className={`w-3.5 h-3.5 ${currentTheme.subAccentText} shrink-0`} />
                <span className="truncate max-w-[145px] 2xl:max-w-[220px]">
                  Scope: <strong className="text-white">{activeSiteName}</strong>
                </span>
                <span aria-hidden="true" className="text-white/25 shrink-0">·</span>
                <span className="truncate max-w-[125px] 2xl:max-w-none">
                  Role: <strong className={currentTheme.accentText}>{currentUser.role}</strong>
                </span>
              </div>

              {/* Interactive Glass Tone Color Palette Picker */}
              <div className="relative" ref={toneMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowToneMenu((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={showToneMenu}
                  className={`h-8 flex items-center gap-2 ${currentTheme.headerPillBg} hover:bg-white/[0.14] border rounded-xl px-2.5 text-xs shadow-2xs whitespace-nowrap shrink-0 cursor-pointer transition`}
                  title="Switch Glass Tone Theme"
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${currentTheme.swatchGradient} ring-1 ring-white/50 shadow-xs shrink-0`}
                  />
                  <span className="text-[11px] text-slate-300 font-medium hidden 2xl:inline">Glass Tone:</span>
                  <span className="text-white text-xs font-bold max-w-[120px] truncate">{currentTheme.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-150 shrink-0 ${showToneMenu ? 'rotate-180' : ''}`} />
                </button>

                {showToneMenu && (
                  <div
                    role="listbox"
                    aria-label="Glass Tone Themes"
                    className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#070f23]/98 backdrop-blur-2xl border border-white/18 shadow-[0_24px_60px_-12px_rgba(2,6,18,0.85)] p-2 z-[70]"
                  >
                    <div className="px-2.5 py-1.5 mb-1 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-200">
                        <Palette className={`w-3.5 h-3.5 ${currentTheme.accentText}`} />
                        <span>Select Glass Tone</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">Live Workspace</span>
                    </div>
                    <div className="space-y-1 max-h-80 overflow-y-auto pr-0.5">
                      {Object.values(APP_THEMES).map((t) => {
                        const isSelected = t.id === currentThemeId;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              updateConfig({ glassTone: t.id, themeId: t.id, logoColor: t.id });
                              setShowToneMenu(false);
                            }}
                            className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                              isSelected
                                ? 'bg-white/14 border border-white/25 text-white shadow-xs'
                                : 'border border-transparent text-slate-200 hover:bg-white/[0.08] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-5 h-5 rounded-full bg-gradient-to-br ${t.swatchGradient} ring-1 ring-white/45 shrink-0 shadow-xs`}
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold leading-tight truncate flex items-center gap-1.5">
                                  <span>{t.name}</span>
                                  {t.id === 'sapphire' && (
                                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10.5px] text-slate-400 leading-tight truncate mt-0.5">
                                  {t.tagline}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className={`w-4 h-4 shrink-0 ${t.accentText}`} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`flex min-h-8 items-center gap-1.5 ${currentTheme.headerPillBg} border rounded-xl px-2.5 xl:px-3 py-1 text-[11px] font-bold text-slate-200 shadow-2xs max-w-full`}
                title="Apex Developer | System Developed By Sasith Dissanayake"
              >
                <span className={`${currentTheme.accentText} shrink-0`}>◆</span>
                <span className="leading-tight break-words sm:whitespace-nowrap">
                  Apex Developer | System Developed By Sasith Dissanayake
                </span>
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
      {showConfigModal && <SystemConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />}
      {showBackupModal && <SystemBackupModal isOpen={showBackupModal} onClose={() => setShowBackupModal(false)} />}
      {showSubscriptionModal && (
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          initialExtraSiteSlots={suggestedExtraSiteSlots}
          onClose={() => {
            setShowSubscriptionModal(false);
            setSuggestedExtraSiteSlots(undefined);
          }}
        />
      )}
      {showProfileModal && <UserProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />}
      {showEmailVerifyModal && <EmailVerificationModal isOpen={showEmailVerifyModal} onClose={() => setShowEmailVerifyModal(false)} />}
      {showBarcodeLookupModal && (
        <BarcodeScannerModal
          isOpen={showBarcodeLookupModal}
          onClose={() => setShowBarcodeLookupModal(false)}
          mode="lookup"
          title="Live Inventory Barcode Lookup (USB & Mobile)"
          subtitle="Scan any item via USB Barcode Gun or Mobile Phone Camera to inspect stock balances"
        />
      )}
      <TutorialVideosModal
        isOpen={showTutorialVideosModal}
        isMinimized={isTutorialMinimized}
        onMinimizeChange={setIsTutorialMinimized}
        onClose={() => {
          setShowTutorialVideosModal(false);
          setIsTutorialMinimized(false);
        }}
      />
      {showUserGuideModal && (
        <div
          className="fixed inset-0 z-[120] bg-gradient-to-br from-[#060f26] via-[#0b1a3d] to-[#060f26] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="System User Guide"
        >
          <SystemUserGuideView
            initialLanguage={userGuideModalLang}
            isInsideWorkspaceModal={true}
            onBackToOverview={() => setShowUserGuideModal(false)}
          />
        </div>
      )}

      {/* Personal Super Admin Identity Prompt for already-signed-in generic sessions */}
      {needsSuperAdminIdentity && !dismissedIdentityPrompt && (
        <div className="fixed inset-0 z-[110] bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                    Confirm Personal Super Admin Identity
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Individual accountability for audit logs &amp; approvals
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDismissedIdentityPrompt(true)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Dismiss for now"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSuperAdminIdentity} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                Currently your actions are recorded under the generic label{' '}
                <strong>"System Super Admin"</strong>. Enter your personal name so all logs, approvals, and vouchers clearly record you individually.
              </div>

              {identityError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {identityError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Acting Super Admin Full Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={identityInput}
                  onChange={(e) => setIdentityInput(e.target.value)}
                  placeholder="e.g. Sasith Dissanayake / Kamal Perera"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Header &amp; Audit Attribution Preview
                </div>
                <div className="font-extrabold text-slate-900">
                  {stripSuperAdminSuffix(identityInput) && !isGenericSuperAdminName(identityInput)
                    ? `${stripSuperAdminSuffix(identityInput)} (as Super Admin)`
                    : 'Your Name (as Super Admin)'}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDismissedIdentityPrompt(true)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Remind Later
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-amber-300" />
                  <span>Confirm My Name</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
});
