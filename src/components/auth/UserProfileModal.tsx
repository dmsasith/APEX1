import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Eye,
  EyeOff,
  MapPin,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  isUserAllSites,
  getUserAssignedSiteIds,
  getUserSupervisedSites,
  isSuperAdmin,
  isGenericSuperAdminName,
  stripSuperAdminSuffix,
  Site,
} from '../../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    authUser,
    activeSites,
    updateUser,
    setCurrentUser,
    superAdminOperatorName,
    setSuperAdminOperatorName,
  } = useStock();

  const isTargetSuperAdmin = Boolean(
    isSuperAdmin(currentUser.role) || currentUser.username === 'admin'
  );

  const resolveInitialName = () => {
    if (isTargetSuperAdmin) {
      if (currentUser.id === authUser.id && stripSuperAdminSuffix(superAdminOperatorName)) {
        return stripSuperAdminSuffix(superAdminOperatorName);
      }
      if (!isGenericSuperAdminName(currentUser.fullName)) {
        return stripSuperAdminSuffix(currentUser.fullName);
      }
      return '';
    }
    return currentUser.fullName;
  };

  const [fullName, setFullName] = useState(resolveInitialName);
  const [username, setUsername] = useState(currentUser.username);
  const [userEmail, setUserEmail] = useState(
    currentUser.email || (currentUser.username.includes('@') ? currentUser.username : '')
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setFullName(resolveInitialName());
      setUsername(currentUser.username);
      setUserEmail(
        currentUser.email || (currentUser.username.includes('@') ? currentUser.username : '')
      );
      setPassword('');
      setStatusMsg(null);
    }
  }, [isOpen, currentUser, superAdminOperatorName]);

  if (!isOpen) return null;

  const cleanPersonalName = stripSuperAdminSuffix(fullName);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanPersonalName || !username.trim()) {
      setStatusMsg({ type: 'error', text: 'Full Name and Username/Email cannot be empty.' });
      return;
    }

    if (isTargetSuperAdmin && isGenericSuperAdminName(cleanPersonalName)) {
      setStatusMsg({
        type: 'error',
        text: 'Enter your personal Full Name (e.g. Sasith Dissanayake). Generic names like "System Super Admin" are blocked for individual accountability.',
      });
      return;
    }

    const normalizedEmail = userEmail.trim().toLowerCase();
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid Recovery / Work Email address or leave it blank.' });
      return;
    }

    const cleanNewPass = password.trim();
    if (cleanNewPass && cleanNewPass.length < 6) {
      setStatusMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    const updated = {
      fullName: cleanPersonalName,
      username: username.trim(),
      email: normalizedEmail || undefined,
      ...(cleanNewPass ? { password: cleanNewPass } : {}),
    };

    updateUser(currentUser.id, updated);
    if (isTargetSuperAdmin && currentUser.id === authUser.id) {
      setSuperAdminOperatorName(cleanPersonalName, false);
    }
    setCurrentUser({
      ...currentUser,
      ...updated,
    });

    setStatusMsg({ type: 'success', text: 'Profile & Account credentials updated successfully!' });
    setTimeout(() => {
      setStatusMsg(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative p-5 border-b border-slate-800/80 bg-gradient-to-r from-emerald-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              {(cleanPersonalName || currentUser.fullName)
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Edit My Account Settings
              </h2>
              <p className="text-xs text-slate-400">
                {isTargetSuperAdmin
                  ? `${cleanPersonalName || 'Your Name'} (as Super Admin)`
                  : 'Update login credentials & profile information'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {statusMsg && (
            <div
              className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMsg.type === 'error'
                  ? 'bg-rose-950/80 border-rose-700/80 text-rose-200'
                  : 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300'
              }`}
            >
              {statusMsg.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {isTargetSuperAdmin && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-[11px] leading-relaxed">
              <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Individual Super Admin Accountability</span>
              </div>
              <span>
                All logs, approvals &amp; stock vouchers will be attributed to:{' '}
                <strong className="text-white">
                  {cleanPersonalName && !isGenericSuperAdminName(cleanPersonalName)
                    ? `${cleanPersonalName} (as Super Admin)`
                    : 'Your Name (as Super Admin)'}
                </strong>
              </span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {isTargetSuperAdmin ? 'Acting Admin Full Name (Personal Name) *' : 'Full Name *'}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sasith Dissanayake"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Username *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or yourname@company.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Recovery / Work Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Recovery / Work Email <span className="text-slate-500 font-normal">(Used for Forgot Password)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="e.g. name@company.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                New Account Password <span className="text-slate-500 font-normal">(Leave blank to keep current)</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password (optional)"
                  className="w-full pl-9 pr-10 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role & Assigned Site(s) Summary */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Assigned System Role:</span>
                <span className="font-bold text-emerald-400">
                  {currentUser.role}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-slate-400 mb-1.5">Assigned Site(s):</div>
                {(() => {
                  const allScope = isUserAllSites(currentUser);
                  const assignedIds = getUserAssignedSiteIds(currentUser, activeSites);
                  const assignedObjs = allScope
                    ? []
                    : assignedIds
                        .map((sid) => activeSites.find((s) => s.id === sid))
                        .filter((s): s is Site => Boolean(s));
                  const supervised = getUserSupervisedSites(currentUser, activeSites);

                  if (allScope) {
                    return (
                      <div className="space-y-1">
                        <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>All Sites / Central Warehouse HQ</span>
                        </div>
                        {supervised.length > 0 && (
                          <div className="text-[11px] text-slate-400">
                            Direct Supervisor Of: <strong className="text-slate-200">{supervised.map((s) => s.name).join(', ')}</strong>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (assignedObjs.length === 0) {
                    return <div className="text-amber-400 font-semibold">No active site assigned</div>;
                  }

                  return (
                    <div className="space-y-2 divide-y divide-slate-800/80">
                      {assignedObjs.map((siteObj) => {
                        const isSup = supervised.some((sp) => sp.id === siteObj.id);
                        return (
                          <div key={siteObj.id} className="pt-2 first:pt-0 space-y-0.5">
                            <div className="flex items-start gap-1.5 text-slate-200 font-semibold leading-snug break-words">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{siteObj.name}</span>
                              {isSup && (
                                <span className="text-[10px] font-bold text-emerald-400">
                                  · Supervisor
                                </span>
                              )}
                            </div>
                            {siteObj.location && (
                              <div className="pl-5 text-[11px] text-slate-400 leading-relaxed break-words">
                                {siteObj.location}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
