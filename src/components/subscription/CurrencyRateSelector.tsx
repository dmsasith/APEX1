import React from 'react';
import { Globe, RefreshCw } from 'lucide-react';
import type { SubscriptionPaymentCurrency } from '../../types';
import {
  SUPPORTED_SUBSCRIPTION_CURRENCIES,
  type FxRatesMap,
  formatConvertedCurrency,
  formatFxRateLabel,
  convertUsdToCurrency,
} from '../../utils/subscriptionCurrencyUtils';

interface CurrencyRateSelectorProps {
  selectedCurrency: SubscriptionPaymentCurrency;
  onSelectCurrency: (currency: SubscriptionPaymentCurrency) => void;
  fxRates: FxRatesMap;
  isLive: boolean;
  isRefreshing?: boolean;
  onRefreshRates?: () => void;
  usdAmount?: number;
  variant?: 'light' | 'dark';
  title?: string;
}

export const CurrencyRateSelector: React.FC<CurrencyRateSelectorProps> = ({
  selectedCurrency,
  onSelectCurrency,
  fxRates,
  isLive,
  isRefreshing = false,
  onRefreshRates,
  usdAmount,
  variant = 'light',
  title = 'Select Payment Currency & Live FX Rate',
}) => {
  const isDark = variant === 'dark';

  return (
    <div
      className={`rounded-2xl border p-3.5 sm:p-4 space-y-2.5 ${
        isDark
          ? 'bg-[#081024]/90 border-white/15 text-white'
          : 'bg-slate-50/90 border-slate-200 text-slate-900'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Globe className={`w-4 h-4 shrink-0 ${isDark ? 'text-amber-400' : 'text-emerald-600'}`} />
          <span className="text-xs font-extrabold tracking-tight">{title}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
              isLive
                ? isDark
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700'
                : 'bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            {isLive ? '⚡ Live FX' : 'FX Ref'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-mono font-bold tabular-nums ${
              isDark ? 'text-amber-300' : 'text-slate-700'
            }`}
          >
            {formatFxRateLabel(selectedCurrency, fxRates)}
          </span>
          {onRefreshRates && (
            <button
              type="button"
              onClick={onRefreshRates}
              disabled={isRefreshing}
              title="Refresh real-time exchange rates"
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-white/10 hover:bg-white/15 border-white/15 text-slate-200'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Sync...' : 'Refresh'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 6 Currency Tiles: LKR + 5 Major Global Currencies */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {SUPPORTED_SUBSCRIPTION_CURRENCIES.map((cur) => {
          const active = selectedCurrency === cur.code;
          const rateVal = fxRates[cur.code];
          const rateMini =
            cur.code === 'USD'
              ? 'Base 1.00'
              : cur.code === 'LKR'
              ? `Rs.${rateVal.toFixed(0)}`
              : `${cur.symbol}${rateVal.toFixed(2)}`;

          return (
            <button
              key={cur.code}
              type="button"
              onClick={() => onSelectCurrency(cur.code)}
              className={`px-2.5 py-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                active
                  ? isDark
                    ? 'bg-gradient-to-br from-amber-300 to-amber-400 text-[#071026] border-white shadow-sm'
                    : 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : isDark
                  ? 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/15'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-black tracking-tight">{cur.code}</span>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    active
                      ? isDark
                        ? 'text-[#071026]'
                        : 'text-amber-300'
                      : isDark
                      ? 'text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  {cur.symbol}
                </span>
              </div>
              <div
                className={`text-[10px] font-mono tabular-nums mt-0.5 truncate ${
                  active
                    ? isDark
                      ? 'text-[#071026]/85 font-bold'
                      : 'text-emerald-300 font-semibold'
                    : isDark
                    ? 'text-slate-400'
                    : 'text-slate-500'
                }`}
              >
                {rateMini}
              </div>
            </button>
          );
        })}
      </div>

      {typeof usdAmount === 'number' && usdAmount > 0 && (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-[11px] tabular-nums ${
            isDark ? 'border-white/10 text-slate-300' : 'border-slate-200/80 text-slate-600'
          }`}
        >
          <span>
            Selected Payable Total ({selectedCurrency}):{' '}
            <strong className={isDark ? 'text-amber-300 font-mono' : 'text-emerald-700 font-mono'}>
              {formatConvertedCurrency(
                convertUsdToCurrency(usdAmount, selectedCurrency, fxRates),
                selectedCurrency,
                true
              )}
            </strong>
          </span>
          <span className="font-mono text-[10px]">
            Base: ${usdAmount.toFixed(2)} USD · LKR Eqv: Rs.{' '}
            {convertUsdToCurrency(usdAmount, 'LKR', fxRates).toLocaleString('en-US')}
          </span>
        </div>
      )}
    </div>
  );
};
