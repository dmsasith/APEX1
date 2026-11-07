import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Building2,
  Boxes,
  Factory,
  ShieldCheck,
  Sparkles,
  Cpu,
  Layers,
  ArrowRight,
  Shield,
  AlertCircle,
  LogIn,
  ChevronLeft,
  FileSpreadsheet,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { TenantSignupModal } from '../landing/TenantSignupModal';
import { OfflineBackupViewerModal } from '../backup/OfflineBackupViewerModal';

const PRESET_ICONS = [
  { id: 'building', icon: Building2 },
  { id: 'boxes', icon: Boxes },
  { id: 'factory', icon: Factory },
  { id: 'shield', icon: ShieldCheck },
  { id: 'sparkles', icon: Sparkles },
  { id: 'cpu', icon: Cpu },
  { id: 'layers', icon: Layers },
];

interface LoginScreenProps {
  onBackToLanding?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onBackToLanding }) => {
  const { config, currentTenant, tenants, login } = useStock();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceCode, setWorkspaceCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const urlWs = p.get('workspace')?.trim();
      if (urlWs) return urlWs;
    }
    return '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [collisionCompanies, setCollisionCompanies] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showOfflineViewer, setShowOfflineViewer] = useState(false);

  // Render the Company Logo (matches Header)
  const renderLogo = () => {
    if (config.logoType === 'image' && config.logoImage) {
      return (
        <img
          src={config.logoImage}
          alt={config.companyName}
          className="w-full h-full object-contain rounded-xl p-1"
        />
      );
    }
    if (config.logoType === 'monogram' && config.logoMonogram) {
      return (
        <div className="w-full h-full rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-lg tracking-widest shadow-inner">
          {config.logoMonogram}
        </div>
      );
    }
    const iconObj = PRESET_ICONS.find((p) => p.id === config.logoIcon) || PRESET_ICONS[0];
    const IconComp = iconObj.icon;
    return <IconComp className="w-8 h-8 text-emerald-400" />;
  };

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputUser = username.trim();
    const inputPass = password;

    if (!inputUser || !inputPass) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    const res = await login(inputUser, inputPass, workspaceCode.trim() || undefined);
    if (!res.success) {
      setErrorMessage(res.message);
      if (res.collisionCompanies && res.collisionCompanies.length > 0) {
        setCollisionCompanies(res.collisionCompanies);
      } else {
        setCollisionCompanies([]);
      }
      setIsSubmitting(false);
    } else {
      setCollisionCompanies([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Bar with Back to Landing & Developer Credit */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white font-semibold py-1 px-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>← Back to Home & Plans</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-300 hidden sm:inline">Live Cloud Sync Active</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOfflineViewer(true)}
            className="flex items-center gap-1.5 text-emerald-300 hover:text-white font-bold py-1 px-3 rounded-lg bg-emerald-950/70 border border-emerald-500/40 hover:bg-emerald-900 transition cursor-pointer text-[11px]"
            title="Open emergency offline reader to view and convert .json backup files to Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Emergency Offline Data Viewer</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-full px-3.5 py-1 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="font-bold text-amber-300 text-[11px] tracking-tight">Apex Developer | System Developed By Sasith Dissanayake</span>
          </div>
        </div>
      </div>

      {/* Main Login Card Center */}
      <div className="max-w-md w-full mx-auto my-auto">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
          {/* Header Banner */}
          <div className="px-6 pt-8 pb-6 text-center border-b border-slate-800/80 bg-gradient-to-b from-slate-800/40 to-transparent">
            {/* Logo */}
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center shadow-lg mb-4">
              {renderLogo()}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {config.systemName || 'Apex Stock & Site Management System'}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5">
              Secure Central Warehouse & Multi-Site Logistics Access
            </p>
          </div>

          <div className="p-6">
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Interactive Workspace Chooser on Collision */}
            {collisionCompanies.length > 0 && (
              <div className="mb-4 p-3.5 bg-indigo-950/80 border border-indigo-500/50 rounded-xl space-y-2.5 animate-fadeIn">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Choose Your Company Workspace (ඔබේ සමාගම තෝරන්න):</span>
                </div>
                <div className="space-y-1.5">
                  {collisionCompanies.map((comp) => (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={async () => {
                        setWorkspaceCode(comp.slug);
                        setCollisionCompanies([]);
                        setErrorMessage(null);
                        setIsSubmitting(true);
                        const res = await login(username.trim(), password, comp.slug);
                        if (!res.success) {
                          setErrorMessage(res.message);
                          setIsSubmitting(false);
                        }
                      }}
                      className="w-full p-2.5 rounded-lg bg-slate-900 hover:bg-emerald-950/80 border border-slate-700 hover:border-emerald-500/60 flex items-center justify-between text-left transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                          {comp.name.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                          {comp.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {comp.slug}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Company Workspace Badge (Only shown when accessing via company link or explicit workspace code) */}
            {Boolean(workspaceCode) && (
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Logging in to Workspace</div>
                    <div className="text-xs font-black text-white">
                      {tenants.find(t => t.slug.toLowerCase() === workspaceCode.toLowerCase() || t.id === workspaceCode)?.companyName || workspaceCode}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {workspaceCode}
                </span>
              </div>
            )}

            {/* Secure Sign In Form */}
            <form onSubmit={handleFormLogin} className="space-y-4">
              {/* Username / Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username or Work Email / පරිශීලක නාමය හෝ Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin or yourname@company.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password / මුරපදය
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Company Workspace Code (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Company Workspace Code / සමාගම් කේතය (Optional)
                  </label>
                  {workspaceCode && (
                    <button
                      type="button"
                      onClick={() => setWorkspaceCode('')}
                      className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                    >
                      Clear Code
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={workspaceCode}
                    onChange={(e) => setWorkspaceCode(e.target.value)}
                    placeholder="e.g. apex-telecom (or leave blank)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  වෙනත් සමාගම් සමග එකම Username ගැටුමක් ඇත්නම් සමාගමේ කේතය (Workspace Slug) හෝ සෘජු Link එක භාවිත කරන්න.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In to Workspace (ප්‍රවේශ වන්න)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Demo Quick Fill for testing convenience without revealing any user data */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
                <span>Demo Workspace Access:</span>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('admin');
                    setPassword('password123');
                    setErrorMessage(null);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
                >
                  Fill Demo Admin Credentials
                </button>
              </div>
            </form>
          </div>

          {/* New Company Workspace Link */}
          <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="text-slate-400">Need a private company workspace?</span>
            <button
              type="button"
              onClick={() => setShowSignupModal(true)}
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start 7-Day Free Trial ($19.90/mo or $189/yr)</span>
            </button>
          </div>

          {/* Footer Security Note */}
          <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800/60 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Multi-User Session Protected with Firebase RTDB</span>
          </div>
        </div>

        {/* Emergency offline data access callout */}
        <div className="text-center mt-3">
          <button
            type="button"
            onClick={() => setShowOfflineViewer(true)}
            className="text-xs text-slate-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1.5 transition cursor-pointer underline decoration-slate-700 hover:decoration-emerald-400"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Server Down / Offline? View Your Backup File or Local Data (Emergency Offline Tool)</span>
          </button>
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="max-w-6xl w-full mx-auto text-center py-2 text-xs text-slate-400">
        <p>© {new Date().getFullYear()} {config.companyName}. All rights reserved.</p>
      </div>

      {/* Tenant Self-Registration Modal */}
      <TenantSignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />

      {/* Emergency Offline Backup Data Viewer Modal */}
      <OfflineBackupViewerModal
        isOpen={showOfflineViewer}
        onClose={() => setShowOfflineViewer(false)}
      />
    </div>
  );
};
