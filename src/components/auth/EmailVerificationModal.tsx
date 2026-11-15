import React, { useState, useEffect } from 'react';
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Send,
  ExternalLink,
  HelpCircle,
  Settings,
  KeyRound,
  Flame,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  sendRealFirebaseVerificationEmail,
  checkRealFirebaseEmailVerified,
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
    'dmsasith@gmail.com';

  const [emailInput, setEmailInput] = useState(initialEmail);
  const [verifyMode, setVerifyMode] = useState<'firebase-link' | 'emailjs-otp'>('firebase-link');
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Firebase Link Verification State
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [firebaseLinkSent, setFirebaseLinkSent] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsConsoleEnable, setNeedsConsoleEnable] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // Optional EmailJS 6-Digit OTP State
  const [emailJsServiceId, setEmailJsServiceId] = useState(
    () => localStorage.getItem('apex_emailjs_service_id') || ''
  );
  const [emailJsTemplateId, setEmailJsTemplateId] = useState(
    () => localStorage.getItem('apex_emailjs_template_id') || ''
  );
  const [emailJsPublicKey, setEmailJsPublicKey] = useState(
    () => localStorage.getItem('apex_emailjs_public_key') || ''
  );
  const [showEmailJsConfig, setShowEmailJsConfig] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const nextEmail =
        emailToVerify ||
        (currentTenant?.contactEmail?.includes('@') ? currentTenant.contactEmail : '') ||
        (currentUser?.username?.includes('@') ? currentUser.username : '') ||
        'dmsasith@gmail.com';
      setEmailInput(nextEmail);
      setErrorMsg(null);
      setStatusMessage(null);
      setVerifiedSuccess(false);
    }
  }, [isOpen, emailToVerify, currentTenant?.contactEmail, currentUser?.username]);

  if (!isOpen) return null;

  const markWorkspaceEmailVerified = (verifiedEmail: string) => {
    setVerifiedSuccess(true);
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
    }, 2000);
  };

  // 1. Send Real Verification Link via Firebase Auth (apexdevoloper-31068)
  const handleSendFirebaseLink = async () => {
    setErrorMsg(null);
    setStatusMessage(null);
    setNeedsConsoleEnable(false);

    if (!emailInput.trim() || !emailInput.includes('@')) {
      setErrorMsg('Please enter a valid email address (e.g. yourname@gmail.com).');
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
      setFirebaseLinkSent(true);
      setStatusMessage(res.message);
      return;
    }

    setErrorMsg(res.message);
    if (
      res.errorCode === 'auth/operation-not-allowed' ||
      res.errorCode === 'auth/configuration-not-found'
    ) {
      setNeedsConsoleEnable(true);
      setShowSetupGuide(true);
    }
  };

  // 2. Check with Firebase if user clicked the link in their email inbox
  const handleCheckFirebaseVerified = async () => {
    setErrorMsg(null);
    setStatusMessage(null);
    setIsCheckingStatus(true);

    const res = await checkRealFirebaseEmailVerified(
      emailInput.trim(),
      currentUser?.password
    );
    setIsCheckingStatus(false);

    if (res.verified) {
      setStatusMessage(res.message);
      markWorkspaceEmailVerified(emailInput.trim());
    } else {
      setErrorMsg(res.message);
    }
  };

  // 3. Optional: Send 6-Digit OTP via EmailJS REST API
  const handleSendRealOtpViaEmailJs = async () => {
    setErrorMsg(null);
    setStatusMessage(null);

    if (!emailInput.trim() || !emailInput.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!emailJsServiceId.trim() || !emailJsTemplateId.trim() || !emailJsPublicKey.trim()) {
      setShowEmailJsConfig(true);
      setErrorMsg('Please enter your EmailJS Service ID, Template ID, and Public Key first (or use the Official Firebase Email Link tab above, which requires zero third-party keys!).');
      return;
    }

    localStorage.setItem('apex_emailjs_service_id', emailJsServiceId.trim());
    localStorage.setItem('apex_emailjs_template_id', emailJsTemplateId.trim());
    localStorage.setItem('apex_emailjs_public_key', emailJsPublicKey.trim());

    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setIsSendingOtp(true);

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: emailJsServiceId.trim(),
          template_id: emailJsTemplateId.trim(),
          user_id: emailJsPublicKey.trim(),
          template_params: {
            to_email: emailInput.trim(),
            to_name: currentUser?.fullName || currentTenant?.companyName || 'Admin',
            otp_code: code,
            company_name: currentTenant?.companyName || 'Apex Stock & Site Management',
          },
        }),
      });

      setIsSendingOtp(false);
      if (response.ok) {
        setStatusMessage(`6-digit OTP code dispatched to ${emailInput.trim()} via EmailJS!`);
      } else {
        const text = await response.text();
        setErrorMsg(`EmailJS Error: ${text || response.statusText}`);
      }
    } catch (err: any) {
      setIsSendingOtp(false);
      setErrorMsg(err?.message || 'Failed to dispatch OTP via EmailJS.');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!generatedOtp) {
      setErrorMsg('Please click "Send 6-Digit OTP to Email" first.');
      return;
    }
    if (otpInput.trim() === generatedOtp) {
      markWorkspaceEmailVerified(emailInput.trim());
    } else {
      setErrorMsg('Invalid 6-digit OTP code. Please check the code sent to your email inbox.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden relative my-auto max-h-[94vh] flex flex-col">
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
              <span>Real Firebase Cloud Email Verification</span>
            </span>
          </div>

          <h3 className="text-lg font-extrabold text-white tracking-tight">
            Verify Official Workspace Email
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Connected to Firebase Project: <strong className="text-emerald-400 font-mono">apexdevoloper-31068</strong>
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {verifiedSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                <CheckCircle2 className="w-8 h-8 animate-in zoom-in-50 duration-200" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">
                Email Verified via Firebase!
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                <strong className="text-slate-900">{emailInput}</strong> is now verified and synced with your Firebase workspace.
              </p>
            </div>
          ) : (
            <>
              {/* Verification Method Selector Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMode('firebase-link');
                    setErrorMsg(null);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    verifyMode === 'firebase-link'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>1. Firebase Email Link (Free)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMode('emailjs-otp');
                    setErrorMsg(null);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    verifyMode === 'emailjs-otp'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2. EmailJS 6-Digit OTP</span>
                </button>
              </div>

              {/* Email Input Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Target Email Address to Verify <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSetupGuide(!showSetupGuide)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showSetupGuide ? 'Hide Firebase Guide' : 'Firebase Setup Guide (සිංහල)'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. dmsasith@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Interactive Step-by-Step Firebase Console Setup Guide */}
              {(showSetupGuide || needsConsoleEnable) && (
                <div className="p-4 bg-indigo-50/90 border border-indigo-200 rounded-2xl space-y-2.5 text-xs text-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-600" />
                      <span>Firebase Console එකේ Email Verification සක්‍රීය කරන පියවර:</span>
                    </span>
                    <a
                      href="https://console.firebase.google.com/project/apexdevoloper-31068/authentication/providers"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shadow-2xs"
                    >
                      <span>Open Firebase Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-slate-700 font-medium">
                    <li>
                      ඉහත <strong>&quot;Open Firebase Console&quot;</strong> බොත්තම ඔබා ඔබගේ <strong>apexdevoloper-31068</strong> Firebase Project එකට යන්න.
                    </li>
                    <li>
                      වම් පස මෙනුවෙන් <strong>Build &rarr; Authentication</strong> තෝරා <strong>&quot;Get Started&quot;</strong> (හෝ <strong>Sign-in method</strong> tab එක) ක්ලික් කරන්න.
                    </li>
                    <li>
                      එහි <strong>Email/Password</strong> තෝරා, පළමු Switch එක (<strong>Enable</strong>) ON කර <strong>Save</strong> ඔබන්න. (Email link passwordless sign-in එක ON කිරීම අවශ්‍ය නැත).
                    </li>
                    <li>
                      අවශ්‍ය නම් <strong>Templates &rarr; Email address verification</strong> වෙත ගොස් Email එකේ පෙනෙන Sender Name එක (උදා: <em>Apex Stock System</em>) ලෙස වෙනස් කරගත හැක.
                    </li>
                  </ol>
                </div>
              )}

              {/* Status & Error Alerts */}
              {statusMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{statusMessage}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {/* MODE 1: OFFICIAL FIREBASE EMAIL VERIFICATION LINK */}
              {verifyMode === 'firebase-link' && (
                <div className="space-y-3.5 pt-1">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>How Official Firebase Verification Works:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                      <li>
                        Click <strong>&quot;1. Send Verification Email via Firebase&quot;</strong> below.
                      </li>
                      <li>
                        Firebase (<code className="text-indigo-700 font-bold">noreply@apexdevoloper-31068.firebaseapp.com</code>) sends a real verification link to your email inbox (check <strong>Spam / Junk</strong> folder too).
                      </li>
                      <li>
                        Click the link inside that email, then click <strong>&quot;2. I Clicked the Link — Verify Now&quot;</strong> below!
                      </li>
                    </ol>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={handleSendFirebaseLink}
                      disabled={isSendingLink}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      {isSendingLink ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Dispatching Email from Firebase...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>
                            {firebaseLinkSent
                              ? 'Resend Verification Email via Firebase'
                              : '1. Send Verification Email via Firebase'}
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCheckFirebaseVerified}
                      disabled={isCheckingStatus}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      {isCheckingStatus ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Checking Firebase Verification Status...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>2. I Clicked the Link — Check & Confirm Verification</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 2: OPTIONAL EMAILJS 6-DIGIT OTP */}
              {verifyMode === 'emailjs-otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-3.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Send 6-Digit OTP Code via EmailJS API
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowEmailJsConfig(!showEmailJsConfig)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>{showEmailJsConfig ? 'Hide API Settings' : 'Configure EmailJS Keys'}</span>
                    </button>
                  </div>

                  {showEmailJsConfig && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
                      <p className="text-[11px] text-slate-600">
                        Create a free account at <strong>emailjs.com</strong> and enter your Service ID, Template ID (containing <code className="font-mono text-indigo-700">{'{{otp_code}}'}</code> and <code className="font-mono text-indigo-700">{'{{to_email}}'}</code>), and Public Key:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Service ID (service_xxx)"
                          value={emailJsServiceId}
                          onChange={(e) => setEmailJsServiceId(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Template ID (template_xxx)"
                          value={emailJsTemplateId}
                          onChange={(e) => setEmailJsTemplateId(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Public Key"
                          value={emailJsPublicKey}
                          onChange={(e) => setEmailJsPublicKey(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSendRealOtpViaEmailJs}
                      disabled={isSendingOtp}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingOtp ? 'Sending...' : 'Send 6-Digit OTP'}</span>
                    </button>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-center font-mono text-base font-black tracking-widest"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={otpInput.length < 6}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Verify OTP</span>
                  </button>
                </form>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
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

