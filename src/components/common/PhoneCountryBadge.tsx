import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { analyzeCountryPhone } from '../../utils/phoneCountryUtils';

interface PhoneCountryBadgeProps {
  value?: string;
  countryOverride?: string;
  currencyOverride?: string;
  className?: string;
  dark?: boolean;
}

export const PhoneCountryBadge: React.FC<PhoneCountryBadgeProps> = ({
  value = '',
  countryOverride,
  currencyOverride,
  className = '',
  dark = false,
}) => {
  const { currentTenant, config } = useStock();
  const analysis = analyzeCountryPhone(value, {
    tenantCountry: countryOverride || currentTenant?.country,
    currencySymbol: currencyOverride || config?.currencySymbol || currentTenant?.currencySymbol,
  });

  if (analysis.isEmpty) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
          dark
            ? 'bg-slate-800/80 text-slate-300 border-slate-700'
            : 'bg-slate-100 text-slate-600 border-slate-200'
        } ${className}`}
        title={`Detected Country: ${analysis.country.name} (${analysis.country.dialCode})`}
      >
        <span>{analysis.country.flag}</span>
        <span>{analysis.country.dialCode}</span>
        <span className="opacity-75">• {analysis.expectedTotalDigits} digits</span>
      </span>
    );
  }

  if (analysis.isComplete) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
          dark
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        } ${className}`}
        title={`Valid ${analysis.country.name} phone number`}
      >
        <span>{analysis.country.flag}</span>
        <span>{analysis.country.dialCode}</span>
        <span>• {analysis.enteredTotalDigits}/{analysis.expectedTotalDigits} digits</span>
        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
        dark
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      } ${className}`}
      title={analysis.error}
    >
      <span>{analysis.country.flag}</span>
      <span>{analysis.country.dialCode}</span>
      <span>• {analysis.enteredTotalDigits}/{analysis.expectedTotalDigits} digits</span>
      <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
    </span>
  );
};
