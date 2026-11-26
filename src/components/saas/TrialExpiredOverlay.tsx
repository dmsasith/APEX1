import React, { useEffect, useState } from 'react';
import {
  Lock,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Clock,
  LogOut,
  Copy,
  ExternalLink,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  SubscriptionPaymentCurrency,
  computePlatformPricingMetrics,
  getSubscriptionStatusSummary,
  getTenantBranchQuotaSummary,
} from '../../types';
import { formatDateTime } from '../../utils/exportUtils';
import {
  fetchPaymentsLkGatewayStatus,
  startPaymentsLkAutoSubscription,
  verifyPaymentsLkSubscription,
  type PaymentsLkGatewayStatus,
} from '../../utils/paymentsLkClient';
import { CurrencyRateSelector } from '../subscription/CurrencyRateSelector';
import {
  type FxRatesMap,
  convertUsdToCurrency,
  detectDefaultPaymentCurrency,
  fetchLiveMultiCurrencyRates,
  formatConvertedCurrency,
  formatFxRateLabel,
  mergeFxRates,
  normalizePaymentCurrency,
  readCachedFxSnapshot,
} from '../../utils/subscriptionCurrencyUtils';

export const TrialExpiredOverlay: React.FC = () => {
  const { currentTenant, currentUser, activeSites, updateTenantSubscription, platformPricing, config, logout } = useStock();
  const pricingMetrics = computePlatformPricingMetrics(platformPricing);
  const branchQuota = getTenantBranchQuotaSummary(currentTenant, activeSites, platformPricing);

  const masterBankConfig = (() => {
    try {
      const raw = localStorage.getItem('apex_master_bank_config_v1');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const activeBankName = config?.bankName || masterBankConfig?.bankName || 'Commercial Bank PLC / Sampath Bank';
  const activeBankAccountName = config?.bankAccountName || masterBankConfig?.bankAccountName || 'Apex Developer (Pvt) Ltd';
  const activeBankAccountNumber = config?.bankAccountNumber || masterBankConfig?.bankAccountNumber || '1000 4829 5012';
  const activeBankBranchSwift = config?.bankBranchSwift || masterBankConfig?.bankBranchSwift || 'Mulleriyawa Branch / CCBLLKLX';
  const activeBankQrImage = config?.bankQrImage || masterBankConfig?.bankQrImage || '';
  const baseStoredRate = config?.usdToLkrRate || masterBankConfig?.usdToLkrRate || 300;
  const initialFx = readCachedFxSnapshot(baseStoredRate);

  const [selectedCurrency, setSelectedCurrency] = useState<SubscriptionPaymentCurrency>(() =>
    detectDefaultPaymentCurrency(currentTenant)
  );
  const [fxRates, setFxRates] = useState<FxRatesMap>(initialFx.rates);
  const [isLiveRate, setIsLiveRate] = useState<boolean>(initialFx.isLive);
  const [isRefreshingFx, setIsRefreshingFx] = useState<boolean>(false);
  const [gatewayStatus, setGatewayStatus] = useState<PaymentsLkGatewayStatus | null>(null);
  const [gatewayBusy, setGatewayBusy] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [gatewayNotice, setGatewayNotice] = useState<string | null>(null);
  const [fallbackCheckoutUrl, setFallbackCheckoutUrl] = useState<string | null>(null);

  const [bankSlipRef, setBankSlipRef] = useState('');
  const [bankNotes, setBankNotes] = useState('');
  const [showSlipSuccess, setShowSlipSuccess] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>(
    currentTenant?.subscription?.billingCycle || 'annual'
  );

  const handleRefreshLiveRates = async (forceRefresh = true) => {
    setIsRefreshingFx(true);
    try {
      const snap = await fetchLiveMultiCurrencyRates({
        forceRefresh,
        fallbackLkrRate: baseStoredRate,
      });
      setFxRates(snap.rates);
      setIsLiveRate(snap.isLive);
    } finally {
      setIsRefreshingFx(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchPaymentsLkGatewayStatus().then((st) => {
      if (!mounted) return;
      setGatewayStatus(st);
      if (st.fxRates) {
        setFxRates((prev) => mergeFxRates({ ...prev, ...st.fxRates }, st.usdToLkrRate || baseStoredRate));
        if (st.isLiveFxRate) {
          setIsLiveRate(true);
        }
      }
    });
    fetchLiveMultiCurrencyRates({ fallbackLkrRate: baseStoredRate }).then((snap) => {
      if (!mounted) return;
      setFxRates(snap.rates);
      if (snap.isLive) setIsLiveRate(true);
    });
    return () => {
      mounted = false;
    };
  }, [baseStoredRate]);

  if (!currentTenant || currentTenant.id === 'tenant-apex-main') return null;

  const sub = currentTenant.subscription;
  const subSummary = getSubscriptionStatusSummary(sub);
  const isTrialExpired = subSummary.isTrial && subSummary.isExpired;

  // If trial is NOT expired and status is active/trialing, do not block UI
  if (!isTrialExpired && sub.status !== 'canceled' && sub.status !== 'past_due') {
    return null;
  }

  const handleSelectCurrency = (code: SubscriptionPaymentCurrency) => {
    setSelectedCurrency(code);
    updateTenantSubscription(currentTenant.id, {
      preferredPaymentCurrency: code,
    });
  };

  const isAnnual = selectedPlan === 'annual';
  const activeExtraSiteSlots = Math.max(
    branchQuota.extraSiteSlots,
    Math.max(0, branchQuota.activeBranchCount - branchQuota.includedBranches)
  );
  const extraAddonUsd = Number(
    (
      activeExtraSiteSlots *
      pricingMetrics.extraSiteMonthlyPrice *
      (isAnnual ? 12 : 1)
    ).toFixed(2)
  );
  const monthlyUsdTotal = Number(
    (pricingMetrics.monthlyPrice + activeExtraSiteSlots * pricingMetrics.extraSiteMonthlyPrice).toFixed(2)
  );
  const annualUsdTotal = Number(
    (pricingMetrics.annualPrice + activeExtraSiteSlots * pricingMetrics.extraSiteAnnualPrice).toFixed(2)
  );
  const baseUsdAmount = isAnnual ? pricingMetrics.annualPrice : pricingMetrics.monthlyPrice;
  const selectedUsdAmount = Number((baseUsdAmount + extraAddonUsd).toFixed(2));
  const selectedUsdFormatted = selectedUsdAmount.toFixed(2);
  const selectedLkrAmount = convertUsdToCurrency(selectedUsdAmount, 'LKR', fxRates);
  const selectedCurrencyAmount = convertUsdToCurrency(selectedUsdAmount, selectedCurrency, fxRates);
  const selectedCurrencyFormatted = formatConvertedCurrency(selectedCurrencyAmount, selectedCurrency, true);
  const selectedCurrencyRate = fxRates[selectedCurrency] || 1;
  const existingPending = sub.pendingBankPayment?.status === 'pending' ? sub.pendingBankPayment : null;

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyNotice(`${label} copied`);
    setTimeout(() => setCopyNotice(null), 2000);
  };

  const handleSubmitBankSlip = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedRef = bankSlipRef.trim();
    if (!cleanedRef) return;

    updateTenantSubscription(currentTenant.id, {
      billingCycle: selectedPlan,
      preferredPaymentCurrency: selectedCurrency,
      pendingBankPayment: {
        submittedAt: new Date().toISOString(),
        referenceNo: cleanedRef,
        amount: selectedUsdAmount,
        currency: selectedCurrency,
        paidAmount: selectedCurrencyAmount,
        exchangeRateUsed: selectedCurrencyRate,
        billingCycle: selectedPlan,
        extraSiteSlotsRequested: activeExtraSiteSlots,
        notes:
          bankNotes.trim() ||
          `${selectedCurrencyFormatted} (@ ${formatFxRateLabel(selectedCurrency, fxRates)})${
            activeExtraSiteSlots > 0
              ? ` · Includes +${activeExtraSiteSlots} Extra Site Branch(es)`
              : ' · Lock Screen'
          }`,
        slipName: 'Bank_Transfer_Reference',
        status: 'pending',
      },
    });

    setShowSlipSuccess(true);
  };

  const isEmbeddedIframe = (() => {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const handleStartAutoRenewCheckout = async () => {
    setGatewayError(null);
    setGatewayNotice(null);
    setFallbackCheckoutUrl(null);
    setGatewayBusy(true);
    try {
      const res = await startPaymentsLkAutoSubscription({
        billingCycle: selectedPlan,
        tenantId: currentTenant.id,
        extraSiteSlots: activeExtraSiteSlots,
        selectedCurrency,
        customerEmail: currentTenant.contactEmail,
        customerName: currentTenant.companyName,
        currentUser,
      });

      if (res.fxRates) {
        setFxRates((prev) => mergeFxRates({ ...prev, ...res.fxRates }, res.usdToLkrRate));
      }
      updateTenantSubscription(currentTenant.id, res.subscriptionPatch);

      const paidLabel = formatConvertedCurrency(
        res.selectedCurrencyAmount,
        res.selectedCurrency || selectedCurrency,
        true
      );

      if (res.status === 'active') {
        setGatewayNotice(`Subscription (${paidLabel}) activated! Unlocking your workspace...`);
      } else if (res.checkoutUrl) {
        setFallbackCheckoutUrl(res.checkoutUrl);
        if (isEmbeddedIframe) {
          setGatewayNotice(
            `Payments.lk (${res.mode === 'test' ? 'Sandbox' : 'Live'}) session ready for ${paidLabel} (Rs. ${res.lkrAmount.toLocaleString()} LKR settlement). Click "Open Checkout", pay in the new tab, then click "Check & Unlock".`
          );
        } else {
          setGatewayNotice(
            `Redirecting to Payments.lk (${res.mode === 'test' ? 'Sandbox' : 'Live'}) for ${paidLabel} (Rs. ${res.lkrAmount.toLocaleString()})...`
          );
          window.location.assign(res.checkoutUrl);
        }
      }
    } catch (err: unknown) {
      setGatewayError(err instanceof Error ? err.message : 'Unable to start Payments.lk checkout.');
    } finally {
      setGatewayBusy(false);
    }
  };

  const handleVerifyGateway = async () => {
    setGatewayError(null);
    setGatewayNotice(null);
    setGatewayBusy(true);
    try {
      const res = await verifyPaymentsLkSubscription({
        tenantId: currentTenant.id,
        subscriptionId: sub.paymentsLkSubscriptionId,
        currentUser,
      });
      if (res.subscriptionPatch || res.clearPendingProratedAddon) {
        updateTenantSubscription(currentTenant.id, {
          ...(res.subscriptionPatch || {}),
          ...(res.clearPendingProratedAddon ? { pendingProratedAddon: undefined } : {}),
        });
      }
      setGatewayNotice(res.message);
      if (res.verified) {
        setFallbackCheckoutUrl(null);
      } else if (res.checkoutUrl) {
        setFallbackCheckoutUrl(res.checkoutUrl);
      }
    } catch (err: unknown) {
      setGatewayError(err instanceof Error ? err.message : 'Unable to verify payment status.');
    } finally {
      setGatewayBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200/90 text-slate-900 rounded-2xl max-w-xl w-full shadow-[0_24px_64px_-12px_rgba(15,23,42,0.28)] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Sapphire & Gold Accent Rule */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#091533] via-amber-400 to-[#091533]" />

        {/* Bright Executive Header Banner */}
        <div className="bg-gradient-to-b from-amber-50/90 via-slate-50/70 to-white px-6 py-5 text-center border-b border-slate-200 relative">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300/90 mx-auto flex items-center justify-center shadow-xs mb-2.5 text-amber-700">
            <Lock className="w-6 h-6" />
          </div>

          <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
            {sub.status === 'canceled'
              ? 'Workspace Subscription Inactive'
              : `${pricingMetrics.trialDays}-Day Free Trial Ended`}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#091533] tracking-tight mt-1 text-balance">
            Subscription Renewal Required
          </h2>

          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
            Workspace: <strong className="text-slate-900">{currentTenant.companyName}</strong>
            <span aria-hidden="true"> · </span>
            Expired on {formatDateTime(subSummary.expiryDateIso || sub.trialEndsAt)}
          </p>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5 bg-white">
          {/* Data Protection Guarantee */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-slate-900 block">Your Records Are 100% Safe:</strong>
              All your sites, items, team issues, and requisition notes are securely preserved. Select a plan and pay online or submit your bank transfer reference below to reactivate commercial access.
            </div>
          </div>

          {/* Payment Currency & Live FX Rate Selector (LKR + 5 Major Currencies) */}
          <CurrencyRateSelector
            selectedCurrency={selectedCurrency}
            onSelectCurrency={handleSelectCurrency}
            fxRates={fxRates}
            isLive={isLiveRate}
            isRefreshing={isRefreshingFx}
            onRefreshRates={() => handleRefreshLiveRates(true)}
            usdAmount={selectedUsdAmount}
            title="Select Currency & Live FX Rate"
          />

          {/* Pricing Plan Selection: Monthly vs Annual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedPlan('monthly')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                selectedPlan === 'monthly'
                  ? 'bg-emerald-50/45 border-2 border-emerald-600 shadow-xs ring-2 ring-emerald-500/15'
                  : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900">Pro Monthly</span>
                  <span className="text-[10px] font-semibold text-slate-500 font-mono">
                    Flexible
                  </span>
                </div>
                <div className="text-xl font-black text-slate-900 mt-2 tabular-nums">
                  {formatConvertedCurrency(
                    convertUsdToCurrency(monthlyUsdTotal, selectedCurrency, fxRates),
                    selectedCurrency
                  )}
                </div>
                <div className="text-[11px] text-slate-600 font-medium tabular-nums">
                  / month (${monthlyUsdTotal.toFixed(2)} USD{activeExtraSiteSlots > 0 ? ` · +${activeExtraSiteSlots} extra site${activeExtraSiteSlots === 1 ? '' : 's'}` : ''})
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPlan('annual')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between relative ${
                selectedPlan === 'annual'
                  ? 'bg-amber-50/60 border-2 border-amber-500 shadow-xs ring-2 ring-amber-500/15'
                  : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="absolute -top-2.5 right-3 bg-amber-400 text-[#091533] font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md border border-amber-500/50 shadow-2xs">
                Save {pricingMetrics.annualSavingsPercent}%
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900">Pro Annual (Yearly)</span>
                  <span className="text-[10px] text-amber-700 font-bold">
                    Best Value
                  </span>
                </div>
                <div className="text-xl font-black text-amber-700 mt-2 tabular-nums">
                  {formatConvertedCurrency(
                    convertUsdToCurrency(annualUsdTotal, selectedCurrency, fxRates),
                    selectedCurrency
                  )}
                </div>
                <div className="text-[11px] text-amber-800 font-semibold tabular-nums">
                  / year (${annualUsdTotal.toFixed(2)} USD{activeExtraSiteSlots > 0 ? ` · +${activeExtraSiteSlots} extra site${activeExtraSiteSlots === 1 ? '' : 's'}` : ` · Save $${pricingMetrics.annualSavingsFormatted}/yr`})
                </div>
              </div>
            </button>
          </div>

          {/* Instant Online Reactivation via Payments.lk */}
          <div className="bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/80 border border-emerald-200 rounded-xl p-4 space-y-3 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div>
                <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </span>
                  <span>Instant Unlock · Card Auto-Renewal (Payments.lk)</span>
                  {gatewayStatus?.mode === 'test' && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[9px] uppercase font-black">
                      Sandbox
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 mt-1 tabular-nums">
                  {formatFxRateLabel(selectedCurrency, fxRates)}
                  {isLiveRate ? ' ⚡ Live' : ''} ·{' '}
                  <strong className="text-emerald-700 font-mono">{selectedCurrencyFormatted}</strong>
                  {selectedCurrency !== 'LKR' ? ` (Gateway LKR: Rs. ${selectedLkrAmount.toLocaleString()})` : ''}
                </div>
              </div>

              <button
                type="button"
                disabled={gatewayBusy || (gatewayStatus !== null && !gatewayStatus.configured)}
                onClick={handleStartAutoRenewCheckout}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0 whitespace-nowrap"
              >
                {gatewayBusy ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay {formatConvertedCurrency(selectedCurrencyAmount, selectedCurrency)} Online</span>
                  </>
                )}
              </button>
            </div>

            {sub.paymentsLkSubscriptionId && (
              <div className="flex items-center justify-between gap-2 bg-white border border-emerald-200 rounded-lg px-3 py-2 text-[11px]">
                <span className="text-slate-700">
                  Pending Ref: <strong className="font-mono text-emerald-700">{sub.paymentsLkSubscriptionId}</strong>
                </span>
                <button
                  type="button"
                  disabled={gatewayBusy}
                  onClick={handleVerifyGateway}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${gatewayBusy ? 'animate-spin' : ''}`} />
                  <span>Check &amp; Unlock</span>
                </button>
              </div>
            )}

            {gatewayError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{gatewayError}</span>
              </div>
            )}

            {gatewayNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 flex items-center justify-between gap-2 flex-wrap">
                <span>{gatewayNotice}</span>
                {fallbackCheckoutUrl && (
                  <a
                    href={fallbackCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold text-[10px]"
                  >
                    <span>Open Checkout</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Pending Verification Status or Bank Transfer Submission Form */}
          {showSlipSuccess || existingPending ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-2">
              <div className="flex items-start gap-2.5">
                {showSlipSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <strong className="text-slate-900 block">
                    {showSlipSuccess
                      ? 'Payment Reference Submitted for Verification'
                      : 'Pending Master Admin Verification'}
                  </strong>
                  <p className="mt-1 text-slate-700 leading-relaxed tabular-nums">
                    Reference No:{' '}
                    <strong className="text-slate-900 font-mono">
                      {existingPending?.referenceNo || bankSlipRef}
                    </strong>{' '}
                    · Plan Amount:{' '}
                    <strong className="text-amber-700">
                      {existingPending?.currency && typeof existingPending?.paidAmount === 'number'
                        ? `${formatConvertedCurrency(
                            existingPending.paidAmount,
                            normalizePaymentCurrency(existingPending.currency),
                            true
                          )} ($${(existingPending.amount ?? selectedUsdAmount).toFixed(2)} USD)`
                        : `${selectedCurrencyFormatted} ($${(existingPending?.amount ?? selectedUsdAmount).toFixed(2)} USD)`}
                    </strong>
                    {existingPending?.submittedAt && (
                      <span className="block text-[11px] text-slate-600 mt-0.5">
                        Submitted: {formatDateTime(existingPending.submittedAt)}
                      </span>
                    )}
                  </p>
                  <p className="mt-1.5 text-[11px] text-slate-600">
                    Once the platform administrator approves this transfer, your workspace will unlock automatically.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitBankSlip} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Bank Transfer / LankaQR Payment Verification</span>
                </div>
                {copyNotice && (
                  <span className="text-[10px] font-bold text-emerald-700">{copyNotice}</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-start bg-white border border-slate-200 p-3 rounded-lg">
                <div className="flex-1 text-[11px] text-slate-600 space-y-1 font-mono tabular-nums">
                  <div>
                    Bank: <strong className="text-slate-900">{activeBankName}</strong>
                  </div>
                  <div>
                    Account Name: <strong className="text-slate-900">{activeBankAccountName}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Account No:</span>
                    <strong className="text-emerald-700 font-bold">{activeBankAccountNumber}</strong>
                    <button
                      type="button"
                      onClick={() => handleCopyText(activeBankAccountNumber, 'Account No')}
                      className="text-slate-400 hover:text-slate-800 p-0.5 cursor-pointer"
                      title="Copy Account Number"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    Branch / SWIFT: <strong className="text-slate-900">{activeBankBranchSwift}</strong>
                  </div>
                  <div>
                    Amount to Transfer:{' '}
                    <strong className="text-amber-700 font-bold">
                      {selectedCurrencyFormatted}
                      {selectedCurrency !== 'USD' ? ` / $${selectedUsdFormatted} USD` : ''}
                      {selectedCurrency !== 'LKR' ? ` / Rs. ${selectedLkrAmount.toLocaleString()} LKR` : ''}
                    </strong>
                  </div>
                </div>

                {activeBankQrImage && (
                  <div className="shrink-0 bg-white p-1.5 rounded-lg border border-slate-300 self-center shadow-2xs">
                    <img
                      src={activeBankQrImage}
                      alt="Bank Payment QR"
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  required
                  placeholder="Enter Bank Deposit / Transfer Reference No..."
                  value={bankSlipRef}
                  onChange={(e) => setBankSlipRef(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Optional note (Bank branch, depositor name)..."
                    value={bankNotes}
                    onChange={(e) => setBankNotes(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shrink-0 shadow-xs"
                  >
                    Submit Reference
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
            <span className="text-[11px] text-slate-500">
              Need assistance? Contact platform billing support with your reference number.
            </span>

            <button
              type="button"
              onClick={logout}
              className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
