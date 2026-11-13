import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import {
  Barcode,
  Printer,
  Download,
  X,
  Check,
  Copy,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Item } from '../../types';
import { useStock } from '../../context/StockContext';
import { formatNumber } from '../../utils/exportUtils';

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  title?: string;
}

const SingleBarcodeSvg: React.FC<{
  value: string;
  format?: 'CODE128' | 'CODE39';
  height?: number;
  width?: number;
}> = ({ value, format = 'CODE128', height = 44, width = 1.6 }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: format === 'CODE39' ? 'CODE39' : 'CODE128',
        lineColor: '#0f172a',
        background: '#ffffff',
        width,
        height,
        displayValue: true,
        fontSize: 12,
        fontOptions: 'bold',
        font: 'JetBrains Mono, monospace',
        margin: 4,
      });
    } catch {
      // Fallback to CODE128 if format character set fails
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          lineColor: '#0f172a',
          background: '#ffffff',
          width,
          height,
          displayValue: true,
          fontSize: 12,
          fontOptions: 'bold',
          font: 'JetBrains Mono, monospace',
          margin: 4,
        });
      } catch (e) {
        console.warn('Barcode render error:', e);
      }
    }
  }, [value, format, height, width]);

  return <svg ref={svgRef} className="max-w-full h-auto mx-auto" />;
};

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  isOpen,
  onClose,
  items,
  title = 'Print & Export Item Barcode Labels',
}) => {
  const { config } = useStock();
  const [copiesPerItem, setCopiesPerItem] = useState<number>(1);
  const [labelSize, setLabelSize] = useState<'compact' | 'standard' | 'large'>('standard');
  const [showPriceOnLabel, setShowPriceOnLabel] = useState<boolean>(false);
  const [showCompanyOnLabel, setShowCompanyOnLabel] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const symbology = config.barcodeSymbology === 'CODE39' ? 'CODE39' : 'CODE128';

  const expandedLabels: Item[] = [];
  items.forEach((item) => {
    const count = Math.max(1, Math.min(50, copiesPerItem));
    for (let c = 0; c < count; c++) {
      expandedLabels.push(item);
    }
  });

  const handlePrintLabels = () => {
    document.body.classList.add('has-print-modal');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('has-print-modal');
    }, 500);
  };

  const handleCopyBarcode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-white leading-tight">{title}</h2>
              <p className="text-xs text-slate-400">
                {items.length} Distinct Item{items.length !== 1 ? 's' : ''} · {expandedLabels.length} Total Printable Sticker{expandedLabels.length !== 1 ? 's' : ''} ({symbology})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintLabels}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Labels</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Label Customization Toolbar (Hidden when printing) */}
        <div className="no-print px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-700">Copies per Item:</label>
              <input
                type="number"
                min={1}
                max={30}
                value={copiesPerItem}
                onChange={(e) => setCopiesPerItem(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                className="w-16 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white text-center"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-700">Sticker Size:</label>
              <select
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value as 'compact' | 'standard' | 'large')}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-800"
              >
                <option value="compact">Compact (4 per row)</option>
                <option value="standard">Standard Warehouse (3 per row)</option>
                <option value="large">Large Shelf Tag (2 per row)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={showCompanyOnLabel}
                onChange={(e) => setShowCompanyOnLabel(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Company Header</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={showPriceOnLabel}
                onChange={(e) => setShowPriceOnLabel(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Unit Price</span>
            </label>
          </div>
        </div>

        {/* Printable Barcode Grid Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/60 printable-document">
          <div
            className={`grid gap-3 ${
              labelSize === 'compact'
                ? 'grid-cols-2 sm:grid-cols-4'
                : labelSize === 'large'
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
            }`}
          >
            {expandedLabels.map((item, idx) => {
              const codeToRender = (item.barcode || item.itemCode).trim().toUpperCase();
              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="bg-white border border-slate-300 rounded-xl p-3.5 flex flex-col justify-between text-center shadow-2xs break-inside-avoid"
                >
                  <div>
                    {showCompanyOnLabel && (
                      <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 truncate">
                        {config.companyName}
                      </div>
                    )}
                    <div className="text-xs font-extrabold text-slate-900 truncate mt-0.5" title={item.itemName}>
                      {item.itemName}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500 truncate">
                      Code: <span className="font-mono text-slate-800">{item.itemCode}</span> · Unit: {item.unit}
                      {showPriceOnLabel && item.unitPrice > 0
                        ? ` · ${config.currencySymbol}${formatNumber(item.unitPrice)}`
                        : ''}
                    </div>
                  </div>

                  <div className="my-2 py-1 bg-white rounded flex items-center justify-center overflow-hidden">
                    <SingleBarcodeSvg
                      value={codeToRender}
                      format={symbology}
                      height={labelSize === 'compact' ? 34 : labelSize === 'large' ? 54 : 42}
                      width={labelSize === 'compact' ? 1.3 : labelSize === 'large' ? 1.8 : 1.5}
                    />
                  </div>

                  <div className="no-print pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-mono truncate">{codeToRender}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyBarcode(codeToRender)}
                      className="text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      {copiedCode === codeToRender ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="no-print px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500">
            Compatible with all 1D/2D USB Laser Scanners, Wireless Guns &amp; Mobile Camera Scanners.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
