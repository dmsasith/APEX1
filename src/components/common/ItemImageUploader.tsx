import React, { useRef, useState } from 'react';
import { ImagePlus, Trash2, CheckCircle2, Loader2, Sparkles, UploadCloud, Eye, X } from 'lucide-react';
import { compressImageUnder200KB, getDataUrlSizeKb } from '../../utils/imageCompressionUtils';

interface ItemImageUploaderProps {
  imageUrl?: string;
  imageSizeKb?: number;
  onChange: (imageUrl: string | undefined, imageSizeKb: number | undefined) => void;
  compact?: boolean;
  label?: string;
}

export const ItemImageUploader: React.FC<ItemImageUploaderProps> = ({
  imageUrl,
  imageSizeKb,
  onChange,
  compact = false,
  label = 'Item Photo / Reference Image (Optional • Auto-Compressed < 200KB)',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalKb: number;
    compressedKb: number;
    width: number;
    height: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const displayedSizeKb =
    imageSizeKb ?? (imageUrl ? getDataUrlSizeKb(imageUrl) : undefined);

  const processFile = async (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    setIsCompressing(true);
    try {
      const result = await compressImageUnder200KB(file, 200);
      setCompressionStats({
        originalKb: result.originalSizeKb,
        compressedKb: result.sizeKb,
        width: result.width,
        height: result.height,
      });
      onChange(result.dataUrl, result.sizeKb);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to compress image.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = () => {
    setCompressionStats(null);
    setErrorMsg(null);
    onChange(undefined, undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          {label}
        </label>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
          <Sparkles className="w-2.5 h-2.5" />
          Auto &lt; 200KB Optimizer
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {imageUrl ? (
        <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50/90 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div
              onClick={() => setShowPreviewModal(true)}
              className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0 cursor-pointer group shadow-xs"
              title="Click to view full preview"
            >
              <img
                src={imageUrl}
                alt="Item thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Image Ready ({displayedSizeKb ? `${displayedSizeKb} KB` : '< 200 KB'})
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Within 200KB Limit
                </span>
              </div>

              {compressionStats ? (
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Compressed from{' '}
                  <span className="font-semibold text-slate-700">
                    {compressionStats.originalKb > 1024
                      ? `${(compressionStats.originalKb / 1024).toFixed(2)} MB`
                      : `${compressionStats.originalKb} KB`}
                  </span>{' '}
                  →{' '}
                  <span className="font-bold text-emerald-700">
                    {compressionStats.compressedKb} KB
                  </span>{' '}
                  ({compressionStats.width}×{compressionStats.height}px)
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Optimized catalog photo ready for display &amp; printing
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressing}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isCompressing}
              className="p-1.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
              title="Remove image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isCompressing && fileInputRef.current?.click()}
          className={`flex items-center justify-between gap-3 ${
            compact ? 'p-2.5' : 'p-3'
          } border-2 border-dashed rounded-xl transition-all cursor-pointer ${
            isDragging
              ? 'border-amber-500 bg-amber-50/60'
              : 'border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
              {isCompressing ? (
                <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
              ) : (
                <ImagePlus className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">
                {isCompressing
                  ? 'Compressing photo under 200KB...'
                  : 'Click to upload item image or drag & drop (Optional)'}
              </p>
              <p className="text-[11px] text-slate-500">
                Any large photo (5MB–10MB+) is automatically resized &amp; compressed below 200KB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isCompressing) fileInputRef.current?.click();
            }}
            disabled={isCompressing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Browse Photo
          </button>
        </div>
      )}

      {errorMsg && (
        <p className="text-xs font-semibold text-rose-600">{errorMsg}</p>
      )}

      {showPreviewModal && imageUrl && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-md w-full p-4 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Item Image Preview</h4>
                <p className="text-[11px] text-slate-500">
                  Optimized Size: {displayedSizeKb ? `${displayedSizeKb} KB` : '< 200 KB'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center max-h-96">
              <img
                src={imageUrl}
                alt="Full item preview"
                className="max-h-96 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
