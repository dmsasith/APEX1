import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface TermsConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsConditionsModal: React.FC<TermsConditionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="text-sm font-black uppercase tracking-wider">Terms & Conditions</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 text-xs text-slate-400 leading-relaxed max-h-[60vh] overflow-y-auto">
          <p>By creating a workspace and starting your 7-day free trial, you agree to the following terms:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Trial Period:</strong> You are granted 7 days of unrestricted access to all SaaS features. No payment method is required for the trial.</li>
            <li><strong>Subscription:</strong> After the trial, continued access to your workspace requires a subscription of $19.90/month or $189.00/year.</li>
            <li><strong>Data Privacy:</strong> We employ strict multi-tenant isolation to ensure your inventory, site balances, and PO data are private and inaccessible to other tenants.</li>
            <li><strong>Platform Usage:</strong> You are responsible for ensuring authorized users in your company workspace have appropriate permission levels.</li>
            <li><strong>Termination:</strong> You may cancel your subscription at any time. We retain data for 30 days after cancellation before permanent deletion.</li>
          </ul>
          <p className="font-bold text-slate-200">By proceeding, you acknowledge that you have read and agreed to these terms.</p>
        </div>
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            Close & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
