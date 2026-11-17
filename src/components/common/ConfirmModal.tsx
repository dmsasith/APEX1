import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { isSuperAdmin, isCentralOrAllSiteAdmin } from '../../types';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  requireAdminPassword?: boolean;
  onConfirm: () => void;
  onClose?: () => void;
  onCancel?: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  requireAdminPassword,
  onConfirm,
  onClose,
  onCancel,
}) => {
  const { currentUser, users, currentTenant } = useStock();
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const needsPassword = requireAdminPassword ?? isDestructive;

  useEffect(() => {
    if (isOpen) {
      setAdminPassword('');
      setShowPassword(false);
      setErrorMsg(null);
    }
  }, [isOpen, title]);

  const handleClose = onClose || onCancel || (() => {});
  if (!isOpen) return null;

  const verifyAdminPassword = (input: string): boolean => {
    const trimmed = input.trim();
    if (!trimmed) return false;

    // 1. Check if master workspace default admin password matches
    if (
      currentTenant?.id === 'tenant-apex-main' &&
      (currentUser?.username === 'admin' || currentUser?.id === 'usr-admin-1')
    ) {
      if (trimmed === 'sasith@123') return true;
    }

    // 2. Check current logged-in user's password
    if (currentUser?.password && trimmed === currentUser.password.trim()) {
      return true;
    }

    // 3. Check any active Super Admin / Central Admin account password in the current workspace
    const adminUsers = (users || []).filter(
      (u) =>
        !u.isDeleted &&
        (isSuperAdmin(u.role) || isCentralOrAllSiteAdmin(u.role) || u.username === 'admin')
    );

    for (const admin of adminUsers) {
      const isMasterDefault =
        currentTenant?.id === 'tenant-apex-main' &&
        (admin.username === 'admin' || admin.id === 'usr-admin-1');
      if (isMasterDefault && trimmed === 'sasith@123') {
        return true;
      }
      const expected = (admin.password || 'password123').trim();
      if (trimmed === expected) {
        return true;
      }
    }

    return false;
  };

  const handleConfirmSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (needsPassword) {
      if (!adminPassword.trim()) {
        setErrorMsg('Please enter the Admin Password to authorize this deletion.');
        return;
      }
      if (!verifyAdminPassword(adminPassword)) {
        setErrorMsg('Incorrect Admin Password. Deletion blocked.');
        return;
      }
    }

    onConfirm();
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/65 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
              }`}
            >
              {isDestructive ? <Trash2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-snug">{title}</h3>
              {needsPassword && (
                <p className="text-[11px] font-semibold text-rose-600">
                  Admin Password Verification Required
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirmSubmit}>
          <p className="text-xs text-slate-600 leading-relaxed my-4">{message}</p>

          {needsPassword && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Enter Admin Password to Confirm *</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Enter Admin Password..."
                  autoFocus
                  className="w-full pl-3 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errorMsg && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 pt-0.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={needsPassword && !adminPassword.trim()}
              className={`px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
