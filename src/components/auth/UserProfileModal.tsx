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
import { isUserAllSites, getUserAssignedSiteIds, getUserSupervisedSites, Site } from '../../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, activeSites, updateUser, setCurrentUser } = useStock();

  const [fullName, setFullName] = useState(currentUser.fullName);
  const [username, setUsername] = useState(currentUser.username);
  const [password, setPassword] = useState(currentUser.password || 'password123');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setFullName(currentUser.fullName);
      setUsername(currentUser.username);
      setPassword(currentUser.password || 'password123');
      setStatusMsg(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      setStatusMsg('Full Name and Username/Email cannot be empty.');
      return;
    }

    const updated = {
      fullName: fullName.trim(),
      username: username.trim(),
      password: password.trim() || 'password123',
    };

    updateUser(currentUser.id, updated);
    setCurrentUser({
      ...currentUser,
      ...updated,
    });

    setStatusMsg('Profile & Account credentials updated successfully!');
    setTimeout(() => {
      setStatusMsg(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative p-5 border-b border-slate-800/80 bg-gradient-to-r from-emerald-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              {currentUser.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Edit My Account Settings
              </h2>
              <p className="text-xs text-slate-400">
                Update login credentials &amp; profile information
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
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Full Name *
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

            {/* Username / Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Username or Work Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dmsasith@gmail.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Account Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secret password"
                  className="w-full pl-9 pr-10 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
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
