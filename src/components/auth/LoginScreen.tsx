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
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { TenantSignupModal } from '../landing/TenantSignupModal';

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
    return <IconComp className="w-8 h-8 text-emerald-600" />;
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
    <>
      <div className="min-h-screen liquid-glass-canvas flex flex-col justify-between text-slate-900 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Ambient Decorative Light Orbs (Pure CSS, Zero Lag) */}
        <div className="pointer-events-none absolute -top-28 -left-28 w-96 h-96 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="pointer-events-none absolute top-1/4 -right-28 w-96 h-96 rounded-full bg-emerald-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 w-96 h-96 rounded-full bg-indigo-300/20 blur-3xl" />

        {/* Top Liquid Glass Navigation Bar */}
        <div className="relative z-10 max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 rounded-2xl bg-white/75 backdrop-blur-md border border-white/95 shadow-[0_8px_28px_-8px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,1)] text-xs">
          <div className="flex items-center gap-3">
            {onBackToLanding && (
              <button
                type="button"
                onClick={onBackToLanding}
                className="flex items-center gap-1.5 text-slate-700 hover:text-slate-950 font-bold py-1.5 px-3.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200/80 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-emerald-600" />
                <span>Back to Home & Plans</span>
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 text-slate-600 font-semibold px-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cloud Sync Protected</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 bg-white/90 border border-slate-200/80 rounded-xl px-3.5 py-1.5 shadow-2xs">
              <span className="text-emerald-600 font-bold">◆</span>
              <span className="font-bold text-slate-800 text-[11px] tracking-tight">
                Apex Developer | System Developed By Sasith Dissanayake
              </span>
            </div>
          </div>
        </div>

        {/* Center Main Liquid Glass Login Card */}
        <div className="relative z-10 max-w-md w-full mx-auto my-8">
          <div className="bg-gradient-to-br from-white/88 via-white/78 to-emerald-50/65 backdrop-blur-xl border border-white/95 rounded-[32px] shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12),0_8px_24px_-6px_rgba(16,185,129,0.08),inset_0_2px_0_0_rgba(255,255,255,1)] overflow-hidden">
            {/* Hero Header Inside Login Card */}
            <div className="px-7 pt-8 pb-6 text-center border-b border-slate-200/60 bg-gradient-to-b from-white/70 to-transparent">
              {/* Liquid Glass Logo Capsule */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white to-emerald-50 border border-white shadow-[0_12px_28px_-6px_rgba(16,185,129,0.25),inset_0_1.5px_0_rgba(255,255,255,1)] mx-auto flex items-center justify-center mb-4">
                {renderLogo()}
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-bold mb-2">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Client Workspace Portal</span>
              </div>

              <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-800 bg-clip-text text-transparent leading-tight">
                {config.systemName || 'Apex Stock & Site Management System'}
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-1.5">
                Secure Central Warehouse & Multi-Site Logistics Access
              </p>
            </div>

            <div className="p-7">
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Interactive Workspace Chooser on Collision */}
              {collisionCompanies.length > 0 && (
                <div className="mb-5 p-4 bg-white/90 border border-emerald-200 rounded-2xl space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Choose Your Company Workspace:</span>
                  </div>
                  <div className="space-y-2">
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
                        className="w-full p-2.5 rounded-xl bg-slate-50/90 hover:bg-emerald-50 border border-slate-200/90 hover:border-emerald-300 flex items-center justify-between text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                            {comp.name.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition">
                            {comp.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">
                          {comp.slug}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Company Workspace Badge */}
              {Boolean(workspaceCode) && (
                <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border border-emerald-200/90 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                        Logging in to Workspace
                      </div>
                      <div className="text-xs font-extrabold text-slate-900">
                        {tenants
                          .filter(
                            (t) =>
                              t.slug.toLowerCase() === workspaceCode.toLowerCase() ||
                              t.id === workspaceCode
                          )
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.companyName ||
                          workspaceCode}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                    {workspaceCode}
                  </span>
                </div>
              )}

              {/* Secure Sign In Form */}
              <form onSubmit={handleFormLogin} className="space-y-4">
                {/* Username / Email Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Username or Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin or yourname@company.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white/90 border border-slate-200/90 rounded-2xl text-sm text-slate-900 placeholder-slate-400 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)] focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4 text-emerald-600" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2.5 bg-white/90 border border-slate-200/90 rounded-2xl text-sm text-slate-900 placeholder-slate-400 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)] focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Company Workspace Code (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Company Workspace Code <span className="text-slate-400 font-medium">(Optional)</span>
                    </label>
                    {workspaceCode && (
                      <button
                        type="button"
                        onClick={() => setWorkspaceCode('')}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                      >
                        Clear Code
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      value={workspaceCode}
                      onChange={(e) => setWorkspaceCode(e.target.value)}
                      placeholder="e.g. apex-telecom (or leave blank)"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white/90 border border-slate-200/90 rounded-2xl text-xs text-slate-900 placeholder-slate-400 font-mono shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)] focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    If your username exists in multiple companies, specify your Workspace Code or use your direct company link.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 border border-white/30 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.45),inset_0_1.5px_0_rgba(255,255,255,0.45)] transition-all duration-200 hover:-translate-y-0.5 active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? 'Signing In...' : 'Log In to Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Demo Quick Fill */}
                <div className="pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/70">
                  <span className="font-medium">Demo Workspace Access:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('admin');
                      setPassword('password123');
                      setErrorMessage(null);
                    }}
                    className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                  >
                    Fill Demo Admin Credentials
                  </button>
                </div>
              </form>
            </div>

            {/* New Company Workspace Link */}
            <div className="px-7 py-4 bg-white/75 border-t border-white/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 font-medium">Need a private company workspace?</span>
              <button
                type="button"
                onClick={() => setShowSignupModal(true)}
                className="text-emerald-700 hover:text-emerald-900 font-extrabold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Start 7-Day Free Trial</span>
              </button>
            </div>

            {/* Footer Security Note */}
            <div className="px-7 py-3 bg-slate-50/80 border-t border-slate-200/60 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Multi-User Session Protected with Real-Time Cloud Sync</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer Details */}
        <div className="relative z-10 max-w-6xl w-full mx-auto text-center py-2 text-xs font-medium text-slate-500">
          <p>© {new Date().getFullYear()} {config.companyName}. All rights reserved.</p>
        </div>
      </div>

      {/* Modals rendered outside main container so fixed positioning covers 100% of viewport */}
      <TenantSignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />
    </>
  );
};
