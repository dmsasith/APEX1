import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Barcode,
  Camera,
  Usb,
  X,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  RefreshCw,
  Upload,
  Search,
  Package,
  Boxes,
  Building2,
  Users2,
  Printer,
  Sparkles,
  Check,
  Zap,
} from 'lucide-react';
import { Item } from '../../types';
import { useStock } from '../../context/StockContext';
import {
  playScanBeep,
  matchItemByScannedCode,
  useUsbBarcodeScanner,
} from '../../utils/barcodeUtils';
import { formatNumber } from '../../utils/exportUtils';
import { BarcodeLabelModal } from './BarcodeLabelModal';

export interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * 'select': Matches scanned code against catalog items and calls onScanItem(item, code)
   * 'captureRaw': Captures any barcode string (even for a brand-new item) and calls onCaptureRawCode(code)
   * 'lookup': Shows full live inventory breakdown across Main Stock, Site Branches, and Field Teams
   */
  mode?: 'select' | 'captureRaw' | 'lookup';
  onScanItem?: (item: Item, scannedCode: string) => void;
  onSelectItem?: (item: Item, scannedCode: string) => void;
  onCaptureRawCode?: (scannedCode: string) => void;
  title?: string;
  subtitle?: string;
  siteId?: string;
  continuousScan?: boolean;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  mode = 'select',
  onScanItem,
  onSelectItem,
  onCaptureRawCode,
  title = 'Universal Barcode & QR Scanner',
  subtitle = 'Scan via USB / Bluetooth Hardware Gun or Mobile Phone Camera',
  siteId,
  continuousScan = false,
}) => {
  const resolvedOnSelect = onScanItem || onSelectItem;
  const {
    config,
    updateConfig,
    activeItems,
    activeSites,
    getMainWarehouseStock,
    getSiteItemStock,
    allTeamsInHandStock,
  } = useStock();

  const usbEnabled = config.usbScannerEnabled !== false;
  const mobileEnabled = config.mobileCameraScannerEnabled !== false;
  const beepEnabled = config.barcodeBeepEnabled !== false;

  // Default to mobile camera on mobile touch screens, or USB on desktop if preferred
  const isMobileDevice =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  const [scanTab, setScanTab] = useState<'usb' | 'camera'>(
    isMobileDevice && mobileEnabled ? 'camera' : 'usb'
  );
  const [manualOrUsbCode, setManualOrUsbCode] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [matchedItem, setMatchedItem] = useState<Item | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<
    Array<{ code: string; item?: Item; timestamp: string }>
  >([]);
  const [keepScanningMulti, setKeepScanningMulti] = useState<boolean>(continuousScan);

  // Camera state
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanningFile, setIsScanningFile] = useState(false);
  const [showLabelPrintModal, setShowLabelPrintModal] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const usbInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const readerContainerId = useRef(
    `apex-barcode-camera-reader-${Math.random().toString(36).slice(2, 8)}`
  ).current;

  // Focus USB input when in USB tab
  useEffect(() => {
    if (isOpen && scanTab === 'usb') {
      setTimeout(() => {
        usbInputRef.current?.focus();
      }, 80);
    }
  }, [isOpen, scanTab]);

  // Reset state on modal open
  useEffect(() => {
    if (isOpen) {
      setManualOrUsbCode('');
      setLastScannedCode('');
      setMatchedItem(null);
      setScanError(null);
      setCameraError(null);
      setKeepScanningMulti(continuousScan);
    } else {
      stopCameraScanner();
    }
    return () => {
      stopCameraScanner();
    };
  }, [isOpen, continuousScan]);

  // Start/Stop camera when switching tabs
  useEffect(() => {
    if (!isOpen) return;
    if (scanTab === 'camera' && mobileEnabled) {
      startCameraScanner(selectedCameraId || undefined);
    } else {
      stopCameraScanner();
    }
  }, [scanTab, isOpen, mobileEnabled]);

  const stopCameraScanner = async () => {
    const instance = html5QrCodeRef.current;
    if (instance) {
      try {
        if (instance.isScanning) {
          await instance.stop();
        }
        instance.clear();
      } catch {
        // Ignore cleanup errors
      }
      html5QrCodeRef.current = null;
    }
    setIsCameraRunning(false);
  };

  const startCameraScanner = async (preferredCameraId?: string) => {
    setCameraError(null);
    await stopCameraScanner();

    // Wait a tick for DOM container
    setTimeout(async () => {
      const container = document.getElementById(readerContainerId);
      if (!container) return;

      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices.map((d) => ({ id: d.id, label: d.label || `Camera ${d.id.slice(0, 5)}` })));
        }

        const scanner = new Html5Qrcode(readerContainerId);
        html5QrCodeRef.current = scanner;

        const cameraConfig = preferredCameraId
          ? preferredCameraId
          : { facingMode: 'environment' };

        await scanner.start(
          cameraConfig,
          {
            fps: 12,
            qrbox: { width: 260, height: 150 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            handleProcessScannedValue(decodedText, 'Mobile Camera');
          },
          () => {
            // Frame scan error (normal while aiming)
          }
        );

        setIsCameraRunning(true);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Unable to access camera. Check camera permissions or use "Scan from Barcode Photo" below.';
        setCameraError(msg);
        setIsCameraRunning(false);
      }
    }, 120);
  };

  const handlePhotoUploadScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningFile(true);
    setCameraError(null);
    setScanError(null);

    try {
      await stopCameraScanner();
      const tempScanner = new Html5Qrcode(readerContainerId);
      const decodedText = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      handleProcessScannedValue(decodedText, 'Barcode Image');
    } catch {
      playScanBeep('error', beepEnabled);
      setScanError(
        'Could not detect a clear 1D barcode or QR code in that image. Please try a sharper close-up photo or use USB/Manual entry.'
      );
    } finally {
      setIsScanningFile(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleProcessScannedValue = (rawValue: string, sourceLabel = 'Scanner') => {
    const cleaned = (rawValue || '').trim();
    if (!cleaned) return;

    setLastScannedCode(cleaned);
    setScanError(null);

    // 1. If capturing raw barcode string for item creation/editing
    if (mode === 'captureRaw') {
      playScanBeep('success', beepEnabled);
      if (onCaptureRawCode) {
        onCaptureRawCode(cleaned.toUpperCase());
      }
      onClose();
      return;
    }

    // 2. Match against active catalog items
    const found = matchItemByScannedCode(cleaned, activeItems);

    if (!found) {
      playScanBeep('error', beepEnabled);
      setMatchedItem(null);
      setScanError(
        `No catalog item matched barcode or code "${cleaned}" (${sourceLabel}). Register this barcode in Master Catalog first.`
      );
      setScanHistory((prev) => [
        { code: cleaned, timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ]);
      return;
    }

    playScanBeep('success', beepEnabled);
    setMatchedItem(found);
    setScanHistory((prev) => [
      { code: cleaned, item: found, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9),
    ]);

    if (mode === 'select' && resolvedOnSelect) {
      resolvedOnSelect(found, cleaned);
      if (!keepScanningMulti && config.barcodeAutoSelect !== false) {
        onClose();
      }
    }
  };

  // Listen to USB HID hardware barcode gun while modal is open
  useUsbBarcodeScanner({
    enabled: isOpen && usbEnabled,
    maxLatencyMs: config.usbScanMaxLatencyMs || 60,
    minLength: 2,
    captureInInputs: true,
    onScan: (code) => {
      setManualOrUsbCode('');
      handleProcessScannedValue(code, 'USB Hardware Scanner');
    },
  });

  if (!isOpen) return null;

  const mainStock = matchedItem ? getMainWarehouseStock(matchedItem.id) : null;
  const branchBalances = matchedItem
    ? activeSites
        .filter((s) => !s.isMainWarehouse)
        .map((s) => ({
          site: s,
          stock: getSiteItemStock(s.id, matchedItem.id),
        }))
    : [];
  const teamsHoldingItem = matchedItem
    ? allTeamsInHandStock
        .map((t) => {
          const held = t.items.find((i) => i.itemId === matchedItem.id);
          return held && held.currentInHand > 0
            ? { teamName: t.team.teamName, siteName: t.site.name, qty: held.currentInHand }
            : null;
        })
        .filter((x): x is { teamName: string; siteName: string; qty: number } => Boolean(x))
    : [];

  return (
    <>
      <div className="fixed inset-0 z-[105] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
          {/* Top Header */}
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Barcode className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-base sm:text-lg text-white leading-tight truncate">
                  {title}
                </h2>
                <p className="text-xs text-slate-400 truncate">{subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => updateConfig({ barcodeBeepEnabled: !beepEnabled })}
                className={`h-8 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                  beepEnabled
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Toggle Scanner Laser Beep Audio"
              >
                {beepEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{beepEnabled ? 'Beep ON' : 'Muted'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scanner Mode Switcher: USB Gun vs Mobile Phone Camera */}
          <div className="p-3 bg-slate-100 border-b border-slate-200 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setScanTab('usb')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                scanTab === 'usb'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Usb className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>USB / Wireless Barcode Gun</span>
            </button>

            <button
              type="button"
              onClick={() => setScanTab('camera')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                scanTab === 'camera'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Mobile Phone / Camera Scan</span>
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
            {/* Continuous Batch Scan Toggle (when in 'select' mode) */}
            {mode === 'select' && (
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <span className="font-semibold text-slate-700">
                  Scanner Action Mode:
                </span>
                <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={keepScanningMulti}
                    onChange={(e) => setKeepScanningMulti(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Keep Scanner Open for Multi-Item Batch Scanning</span>
                </label>
              </div>
            )}

            {/* TAB 1: USB / WIRELESS HARDWARE SCANNER */}
            {scanTab === 'usb' && (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>USB / Bluetooth HID Scanner Ready</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Auto-Enter / Tab Detection
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Point your USB or Wireless 2.4GHz/Bluetooth barcode scanner at any item label and pull the trigger—or type/paste a barcode below and press <strong>Enter</strong>.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (manualOrUsbCode.trim()) {
                        const code = manualOrUsbCode.trim();
                        setManualOrUsbCode('');
                        handleProcessScannedValue(code, 'USB / Manual Entry');
                      }
                    }}
                    className="flex gap-2"
                  >
                    <div className="relative flex-1">
                      <Barcode className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        ref={usbInputRef}
                        data-usb-scanner-input="true"
                        type="text"
                        value={manualOrUsbCode}
                        onChange={(e) => setManualOrUsbCode(e.target.value)}
                        placeholder="Waiting for USB gun trigger or type barcode / item code..."
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white text-slate-900 font-mono text-xs sm:text-sm font-bold border-2 border-emerald-500 focus:outline-none"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs whitespace-nowrap cursor-pointer transition"
                    >
                      Match Code
                    </button>
                  </form>
                </div>

                {/* Quick Test / Instant Tap from Registered Catalog */}
                {activeItems.length > 0 && mode !== 'captureRaw' && (
                  <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Quick-Scan Registered Catalog Barcodes ({activeItems.length})
                      </span>
                      <span className="text-[11px] text-slate-400">Click any item to simulate scan</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {activeItems.slice(0, 20).map((item) => {
                        const bCode = item.barcode || item.itemCode;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleProcessScannedValue(bCode, 'Quick Barcode Tap')}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5 transition cursor-pointer"
                            title={`${item.itemName} (Barcode: ${bCode})`}
                          >
                            <Barcode className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{bCode}</span>
                            <span className="font-sans font-medium text-slate-500 truncate max-w-[110px]">
                              {item.itemName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MOBILE PHONE / WEBCAM CAMERA SCANNER */}
            {scanTab === 'camera' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-700">Camera Lens:</span>
                    {cameras.length > 1 ? (
                      <select
                        value={selectedCameraId}
                        onChange={(e) => {
                          setSelectedCameraId(e.target.value);
                          startCameraScanner(e.target.value);
                        }}
                        className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
                      >
                        <option value="">Back / Environment Camera (Default)</option>
                        {cameras.map((cam) => (
                          <option key={cam.id} value={cam.id}>
                            {cam.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-slate-600 font-medium">Auto (Rear / Environment Lens)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startCameraScanner(selectedCameraId || undefined)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Restart Camera</span>
                    </button>

                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUploadScan}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isScanningFile}
                      onClick={() => photoInputRef.current?.click()}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{isScanningFile ? 'Decoding Photo...' : 'Scan from Photo / Camera Snap'}</span>
                    </button>
                  </div>
                </div>

                {/* Live Video Viewport */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 min-h-[240px] flex flex-col items-center justify-center">
                  <div id={readerContainerId} className="w-full max-w-[440px] mx-auto" />

                  {!isCameraRunning && !cameraError && (
                    <div className="p-6 text-center text-slate-300 space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
                      <p className="text-xs font-semibold">Initializing Mobile / Webcam Barcode Lens...</p>
                    </div>
                  )}

                  {cameraError && (
                    <div className="p-5 text-center max-w-md mx-auto space-y-3">
                      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                      <p className="text-xs font-bold text-white">Camera Stream Unavailable</p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{cameraError}</p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Take Barcode Photo / Upload Image</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setScanTab('usb')}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Usb className="w-3.5 h-3.5" />
                          <span>Switch to USB / Manual</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scan Error Feedback */}
            {scanError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Unrecognized Barcode</p>
                  <p className="mt-0.5">{scanError}</p>
                </div>
              </div>
            )}

            {/* Matched Item Details & Live Inventory Lookup Card */}
            {matchedItem && mainStock && (
              <div className="p-4 bg-emerald-50/70 border-2 border-emerald-500/80 rounded-2xl space-y-3 animate-in fade-in duration-150">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-xs font-extrabold">
                        {matchedItem.itemCode}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white border border-emerald-300 text-emerald-900 font-mono text-[11px] font-bold flex items-center gap-1">
                        <Barcode className="w-3 h-3 text-emerald-600" />
                        <span>{matchedItem.barcode || matchedItem.itemCode}</span>
                      </span>
                      <span className="text-[11px] font-bold text-emerald-800">
                        ✓ Matched ({lastScannedCode})
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                      {matchedItem.itemName}
                    </h3>
                    <p className="text-xs text-slate-600">
                      Category: <strong>{matchedItem.category}</strong> · Unit: <strong>{matchedItem.unit}</strong> · Rate: <strong className="font-mono">{config.currencySymbol}{formatNumber(matchedItem.unitPrice)}</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowLabelPrintModal(true)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-900 hover:text-white text-slate-800 border border-slate-300 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Label</span>
                  </button>
                </div>

                {/* Live Stock Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-emerald-200/80 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200/80">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Central Main Stock</div>
                    <div className="text-base font-extrabold font-mono text-slate-900 mt-0.5 tabular-nums">
                      {formatNumber(mainStock.availableBalance)} {matchedItem.unit}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200/80">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Site Branches Holding</div>
                    <div className="text-base font-extrabold font-mono text-blue-700 mt-0.5 tabular-nums">
                      {formatNumber(
                        branchBalances.reduce((s, b) => s + b.stock.availableBalance, 0)
                      )}{' '}
                      {matchedItem.unit}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200/80">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Field Teams In-Hand</div>
                    <div className="text-base font-extrabold font-mono text-amber-700 mt-0.5 tabular-nums">
                      {formatNumber(teamsHoldingItem.reduce((s, t) => s + t.qty, 0))} {matchedItem.unit}
                    </div>
                  </div>
                </div>

                {mode === 'select' && resolvedOnSelect && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        resolvedOnSelect(matchedItem, lastScannedCode || matchedItem.barcode || matchedItem.itemCode);
                        onClose();
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Use Selected Item &amp; Close</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Recent Scan Log inside session */}
            {scanHistory.length > 1 && (
              <div className="border-t border-slate-200 pt-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Session Scan History ({scanHistory.length})
                </div>
                <div className="space-y-1 max-h-28 overflow-y-auto text-xs">
                  {scanHistory.map((entry, idx) => (
                    <div
                      key={`${entry.code}-${idx}`}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-slate-800">{entry.code}</span>
                        {entry.item ? (
                          <span className="text-emerald-700 font-semibold truncate">
                            → {entry.item.itemCode} ({entry.item.itemName})
                          </span>
                        ) : (
                          <span className="text-rose-600 font-medium">Unmatched</span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {entry.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span className="font-semibold text-slate-700">Active Modes:</span>
              <span>{usbEnabled ? '🔌 USB HID Ready' : 'USB Off'}</span>
              <span>·</span>
              <span>{mobileEnabled ? '📱 Camera Ready' : 'Camera Off'}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 rounded-xl font-bold text-slate-700 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {matchedItem && (
        <BarcodeLabelModal
          isOpen={showLabelPrintModal}
          onClose={() => setShowLabelPrintModal(false)}
          items={[matchedItem]}
        />
      )}
    </>
  );
};
