import { useEffect, useRef } from 'react';
import { Item } from '../types';

/**
 * Plays a crisp industrial barcode scanner audio tone using Web Audio API.
 * Requires zero external audio assets and works offline.
 */
export function playScanBeep(
  typeOrSuccess: 'success' | 'error' | boolean = 'success',
  enabled = true
): void {
  if (!enabled || typeof window === 'undefined') return;
  const type: 'success' | 'error' =
    typeof typeOrSuccess === 'boolean' ? (typeOrSuccess ? 'success' : 'error') : typeOrSuccess;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1950, now);
      osc.frequency.exponentialRampToValueAtTime(2550, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.start(now);
      osc.stop(now + 0.12);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(220, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.start(now);
      osc.stop(now + 0.27);
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 350);
  } catch {
    // Ignore audio context restrictions if user hasn't interacted yet
  }
}

/**
 * Normalizes a barcode or item code for resilient matching
 */
export function normalizeBarcodeString(raw: string): string {
  return (raw || '')
    .trim()
    .replace(/[\r\n\t]+/g, '')
    .toUpperCase();
}

/**
 * Matches a scanned barcode or QR code payload against active catalog items.
 * Checks:
 *  1. JSON QR payload ({ barcode, itemCode, id })
 *  2. Exact item.barcode match (case-insensitive)
 *  3. Exact item.itemCode match (case-insensitive)
 *  4. Alphanumeric stripped match (handles scanners that omit dashes)
 */
export function matchItemByScannedCode(
  arg1: string | Item[],
  arg2: Item[] | string
): Item | undefined {
  const rawScanned = typeof arg1 === 'string' ? arg1 : (arg2 as string);
  const items = Array.isArray(arg1) ? arg1 : (arg2 as Item[]);
  const cleaned = normalizeBarcodeString(rawScanned);
  if (!cleaned || !items || items.length === 0) return undefined;

  // 1. Check if QR JSON payload
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    try {
      const parsed = JSON.parse(rawScanned.trim());
      const targetCode = normalizeBarcodeString(parsed.barcode || parsed.itemCode || parsed.code || '');
      if (targetCode) {
        const foundFromJson = items.find(
          (i) =>
            !i.isDeleted &&
            (normalizeBarcodeString(i.barcode || '') === targetCode ||
              normalizeBarcodeString(i.itemCode) === targetCode ||
              i.id === parsed.id)
        );
        if (foundFromJson) return foundFromJson;
      }
    } catch {
      // Not valid JSON, continue standard matching
    }
  }

  // 2. Exact match on dedicated barcode
  const exactBarcode = items.find(
    (i) => !i.isDeleted && i.barcode && normalizeBarcodeString(i.barcode) === cleaned
  );
  if (exactBarcode) return exactBarcode;

  // 3. Exact match on itemCode
  const exactItemCode = items.find(
    (i) => !i.isDeleted && normalizeBarcodeString(i.itemCode) === cleaned
  );
  if (exactItemCode) return exactItemCode;

  // 4. Alphanumeric normalized match (if scanner strips hyphens or spaces)
  const alphaClean = cleaned.replace(/[^A-Z0-9]/g, '');
  if (alphaClean.length >= 3) {
    const fuzzyMatch = items.find((i) => {
      if (i.isDeleted) return false;
      const bAlpha = (i.barcode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const cAlpha = i.itemCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return (bAlpha && bAlpha === alphaClean) || cAlpha === alphaClean;
    });
    if (fuzzyMatch) return fuzzyMatch;
  }

  return undefined;
}

/**
 * Generates a unique, human- and scanner-friendly Code-128 barcode for an item.
 */
export function generateUniqueBarcode(
  itemCode?: string,
  prefixOrIndex: string | number = 'APX-',
  existingItemsOrPrefix: Item[] | string = []
): string {
  const prefix =
    typeof prefixOrIndex === 'string'
      ? prefixOrIndex
      : typeof existingItemsOrPrefix === 'string'
      ? existingItemsOrPrefix
      : 'APX-';
  const existingItems = Array.isArray(existingItemsOrPrefix) ? existingItemsOrPrefix : [];
  const explicitSeqIndex = typeof existingItemsOrPrefix === 'number' && existingItemsOrPrefix > 0 ? existingItemsOrPrefix : null;
  const cleanPrefix = (prefix || 'APX-').trim().toUpperCase();
  const usedSet = new Set(
    existingItems.flatMap((i) => [
      normalizeBarcodeString(i.barcode || ''),
      normalizeBarcodeString(i.itemCode),
    ]).filter(Boolean)
  );

  if (itemCode && itemCode.trim() && itemCode.trim().toUpperCase() !== 'ITEM') {
    const cleanCode = itemCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '');
    const candidate = cleanCode.startsWith(cleanPrefix)
      ? cleanCode
      : `${cleanPrefix}${cleanCode}`;
    if (!usedSet.has(candidate)) {
      return candidate;
    }
  }

  // Sequential 4-digit 0001-based barcode generation
  const startSeq = explicitSeqIndex || existingItems.length + 1;
  for (let offset = 0; offset < 5000; offset++) {
    const seqDigits = String(startSeq + offset).padStart(4, '0');
    const candidate = `${cleanPrefix}${seqDigits}`;
    if (!usedSet.has(candidate)) {
      return candidate;
    }
  }

  return `${cleanPrefix}${String(startSeq).padStart(4, '0')}`;
}

/**
 * Generates the next sequential 4-digit Item Code starting from 0001
 * e.g. ITM-0001, ITM-0002 for Material or MCH-0001, MCH-0002 for Machinery
 */
export function generateNextSequentialItemCode(
  existingItems: Array<{ itemCode: string; itemType?: string }>,
  itemType: 'Material' | 'Machinery' = 'Material'
): string {
  const prefix = itemType === 'Machinery' ? 'MCH-' : 'ITM-';
  const usedCodes = new Set(existingItems.map((i) => i.itemCode.trim().toUpperCase()));

  let maxNum = 0;
  existingItems.forEach((i) => {
    const code = i.itemCode.trim().toUpperCase();
    if (code.startsWith(prefix)) {
      const numPart = parseInt(code.slice(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  });

  let nextNum = maxNum + 1;
  while (usedCodes.has(`${prefix}${String(nextNum).padStart(4, '0')}`)) {
    nextNum++;
  }
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

export interface UsbScannerOptions {
  enabled: boolean;
  maxLatencyMs?: number;
  maxInterKeyLatencyMs?: number;
  minLength?: number;
  onScan: (scannedCode: string) => void;
  captureInInputs?: boolean;
  ignoreInputs?: boolean;
}

/**
 * Hook that listens for USB / Bluetooth Wireless HID Barcode Scanners (Keyboard Wedge mode).
 * Hardware scanners emit characters rapidly (< 50-60ms between keystrokes) followed by Enter or Tab.
 */
export function useUsbBarcodeScanner({
  enabled,
  maxLatencyMs,
  maxInterKeyLatencyMs,
  minLength = 3,
  onScan,
  captureInInputs,
  ignoreInputs,
}: UsbScannerOptions): void {
  const resolvedMaxLatency = maxLatencyMs ?? maxInterKeyLatencyMs ?? 60;
  const resolvedCaptureInInputs = captureInInputs ?? (ignoreInputs !== undefined ? !ignoreInputs : false);
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier shortcuts
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable) &&
        !target.hasAttribute('data-usb-scanner-input');

      const now = performance.now();
      const timeDiff = now - lastKeyTimeRef.current;

      if (e.key === 'Enter' || e.key === 'Tab') {
        const currentBuffer = bufferRef.current.trim();
        const totalDuration = now - startTimeRef.current;
        const avgPerChar = currentBuffer.length > 0 ? totalDuration / currentBuffer.length : 999;

        // If buffer meets length and was typed at hardware scanner speed
        if (
          currentBuffer.length >= minLength &&
          timeDiff <= resolvedMaxLatency * 2.5 &&
          avgPerChar <= resolvedMaxLatency * 1.5
        ) {
          if (!isInputFocused || resolvedCaptureInInputs) {
            e.preventDefault();
            e.stopPropagation();
            bufferRef.current = '';
            lastKeyTimeRef.current = 0;
            onScanRef.current(currentBuffer);
            return;
          }
        }
        bufferRef.current = '';
        return;
      }

      // Printable single character
      if (e.key.length === 1) {
        if (isInputFocused && !resolvedCaptureInInputs) {
          bufferRef.current = '';
          return;
        }

        if (timeDiff > resolvedMaxLatency * 2) {
          bufferRef.current = e.key;
          startTimeRef.current = now;
        } else {
          bufferRef.current += e.key;
        }
        lastKeyTimeRef.current = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, resolvedMaxLatency, minLength, resolvedCaptureInInputs]);
}
