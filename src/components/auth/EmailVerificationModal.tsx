import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Send,
  Globe,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  sendRealFirebaseVerificationEmail,
  checkRealFirebaseEmailVerified,
  OFFICIAL_SUPPORT_EMAIL,
  OFFICIAL_SYSTEM_DOMAIN,
} from '../../firebase';

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
  const { currentTenant, updateTenantSubscription, updateTenantDetails, currentUser } = useStock();

  const initialEmail =
    emailToVerify ||
    (currentTenant?.contactEmail?.includes('@') ? currentTenant.contactEmail : '') ||
    (currentUser?.username?.includes('@') ? currentUser.username : '') ||
    OFFICIAL_SUPPORT_EMAIL;

  const [emailInput, setEmailInput] = useState(initialEmail);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [verificationLinkSent, setVerificationLinkSent] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  const hasVerifiedRef = useRef(false);
  const isCheckingRef = useRef(false);

  const markWorkspaceEmailVerified = useCallback(
    (verifiedEmail: string) => {
      if (hasVerifiedRef.current) return;
      hasVerifiedRef.current = true;
      setVerifiedSuccess(true);
      setErrorMsg(null);
      if (currentTenant) {
        updateTenantDetails(currentTenant.id, {
          emailVerified: true,
          contactEmail: verifiedEmail.trim(),
        });
        updateTenantSubscription(currentTenant.id, {
          paymentMethodStatus: 'active',
        });
      }
      setTimeout(() => {
        setVerifiedSuccess(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 1800);
    },
    [currentTenant, updateTenantDetails, updateTenantSubscription, onSuccess, onClose]
  );

  // Silent background check so as soon as the user clicks the email link, it verifies automatically
  const runAutoVerificationCheck = useCallback(async () => {
    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || hasVerifiedRef.current || isCheckingRef.current) {
      return;
    }
    isCheckingRef.current = true;
    try {
      const res = await checkRealFirebaseEmailVerified(cleanEmail, currentUser?.password);
      if (res.verified && !hasVerifiedRef.current) {
        setStatusMessage(res.message);
        markWorkspaceEmailVerified(cleanEmail);
      }
    } catch {
      // Silent retry on next poll
    } finally {
      isCheckingRef.current = false;
    }
  }, [emailInput, currentUser?.password, markWorkspaceEmailVerified]);

  useEffect(() => {
    if (isOpen) {
      hasVerifiedRef.current = false;
      const nextEmail =
        emailToVerify ||
        (currentTenant?.contactEmail?.includes('@') ? currentTenant.contactEmail : '') ||
        (currentUser?.username?.includes('@') ? currentUser.username : '') ||
        OFFICIAL_SUPPORT_EMAIL;
      setEmailInput(nextEmail);
      setErrorMsg(null);
      setStatusMessage(null);
      setVerifiedSuccess(false);
    }
  }, [isOpen, emailToVerify, currentTenant?.contactEmail, currentUser?.username]);

  // Continuous automatic polling + window focus/visibility listener while modal is open
  useEffect(() => {
    if (!isOpen || verifiedSuccess) return;

    // Immediate silent check when opened or when link was sent
    runAutoVerificationCheck();

    const intervalId = window.setInterval(() => {
      runAutoVerificationCheck();
    }, 2500);

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        runAutoVerificationCheck();
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [isOpen, verifiedSuccess, verificationLinkSent, runAutoVerificationCheck]);

  if (!isOpen) return null;

  const handleSendVerificationEmail = async () => {
    setErrorMsg(null);
    setStatusMessage(null);

    if (!emailInput.trim() || !emailInput.includes('@')) {
      setErrorMsg('Please enter a valid email address (e.g. support@apexstox.com).');
      return;
    }

    setIsSendingLink(true);
    const res = await sendRealFirebaseVerificationEmail(
      emailInput.trim(),
      currentUser?.password
    );
    setIsSendingLink(false);

    if (res.status === 'already_verified') {
      setStatusMessage(res.message);
      markWorkspaceEmailVerified(emailInput.trim());
      return;
    }

    if (res.status === 'sent') {
      setVerificationLinkSent(true);
      setStatusMessage(res.message);
      return;
    }

    setErrorMsg(res.message);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden relative my-auto flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Official Email Verification</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
              <Globe className="w-2.5 h-2.5 text-indigo-400" />
              <span>{OFFICIAL_SYSTEM_DOMAIN}</span>
            </span>
          </div>

          <h3 className="text-lg font-extrabold text-white tracking-tight">
            Verify Workspace Email
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Send a verification link to your email and click it to verify automatically.
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {verifiedSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                <CheckCircle2 className="w-8 h-8 animate-in zoom-in-50 duration-200" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">
                Email Automatically Verified!
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                <strong className="text-slate-900">{emailInput}</strong> is now verified and active for your workspace.
              </p>
            </div>
          ) : (
            <>
              {/* Email Input Field */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  Email Address to Verify <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={`e.g. ${OFFICIAL_SUPPORT_EMAIL}`}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Status & Error Alerts */}
              {statusMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-semibold leading-relaxed">{statusMessage}</span>
                  </div>
                  {verificationLinkSent && (
                    <div className="flex items-center gap-2 pt-1.5 border-t border-emerald-200/70 text-[11px] font-bold text-emerald-800">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />
                      <span>
                        Waiting for you to click the link in your email — will verify automatically...
                      </span>
                    </div>
                  )}
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {/* Primary Action Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSendVerificationEmail}
                  disabled={isSendingLink}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {isSendingLink ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Verification Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        {verificationLinkSent
                          ? 'Resend Verification Email'
                          : 'Send Verification Email'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Support: {OFFICIAL_SUPPORT_EMAIL}</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
