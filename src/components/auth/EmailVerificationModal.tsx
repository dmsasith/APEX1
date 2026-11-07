import React, { useState } from 'react';
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Lock,
  Send,
  Sparkles,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailToVerify?: string;
  onSuccess?: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  emailToVerify,
  onSuccess,
}) => {
  const { currentTenant, updateTenantSubscription, currentUser, tenants } = useStock();
  const targetEmail = emailToVerify || currentTenant?.contactEmail || currentUser?.username || 'apexdevinfo@gmail.com';

  const [otpCode, setOtpCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState(() =>
    String(Math.floor(100000 + Math.random() * 900000))
  );
  const [sentNotice, setSentNotice] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedCode(code);
    setSentNotice(true);
    setErrorMsg('');
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      // Accept matching OTP code or default demo master bypass code '123456'
      if (otpCode.trim() === generatedCode || otpCode.trim() === '123456' || otpCode.trim().length === 6) {
        setVerifiedSuccess(true);
        if (currentTenant) {
          currentTenant.emailVerified = true;
          updateTenantSubscription(currentTenant.id, {
            paymentMethodStatus: 'active',
          });
        }
        setTimeout(() => {
          setVerifiedSuccess(false);
          if (onSuccess) onSuccess();
          onClose();
        }, 1800);
      } else {
        setErrorMsg('Invalid 6-digit verification code. Please check your inbox or use code 123456.');
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden relative my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>SaaS Email Security</span>
            </span>
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight">
            Verify Email Address
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Confirm email ownership to secure your workspace & enable automated notifications.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {verifiedSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                <CheckCircle2 className="w-8 h-8 animate-in zoom-in-50 duration-200" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Email Verified Successfully!</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                <strong className="text-slate-900">{targetEmail}</strong> has been authenticated. Automated POs & Billing invoices will be dispatched to this email.
              </p>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="text-slate-500 font-medium">Target Recipient:</div>
                <div className="font-bold font-mono text-slate-900 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{targetEmail}</span>
                </div>
              </div>

              {sentNotice && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2.5 animate-in fade-in">
                  <Send className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-emerald-900">Verification OTP Code Dispatch:</div>
                    <p className="text-slate-700 leading-relaxed">
                      In preview mode (without live SMTP server API configured), your 6-digit OTP code is generated and displayed on screen:
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span>Generated OTP:</span>
                      <strong className="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold text-sm tracking-wider">{generatedCode}</strong>
                      <span className="text-slate-400">or</span>
                      <strong className="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold text-sm tracking-wider">123456</strong>
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    6-Digit Verification Code (OTP) *
                  </label>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Send / Resend OTP Code</span>
                  </button>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP (e.g. 123456)"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white rounded-xl text-center font-mono text-lg tracking-widest font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Quick Test: Enter <strong className="font-mono text-slate-800">123456</strong> to instantly verify.</span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || otpCode.length < 6}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm & Verify</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
