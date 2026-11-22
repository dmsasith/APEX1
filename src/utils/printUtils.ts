import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';

const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const UNSUPPORTED_COLOR_FN_RE = /(oklch|oklab|color-mix|lch|lab)\s*\(/i;

/**
 * Resolves a single CSS color expression (e.g. oklch(...), oklab(...), color-mix(...))
 * into a standard hex/rgba color string using Canvas2D, with a safe fallback.
 */
function resolveColorFnWithCanvas(
  expr: string,
  ctx: CanvasRenderingContext2D,
  fallback = '#0f172a'
): string {
  try {
    // Use two sentinels so any valid color (even #000000) is reliably detected
    ctx.fillStyle = '#010203';
    ctx.fillStyle = expr;
    const first = ctx.fillStyle;

    if (first && first !== '#010203' && !UNSUPPORTED_COLOR_FN_RE.test(first)) {
      return first;
    }

    ctx.fillStyle = '#fefefe';
    ctx.fillStyle = expr;
    const second = ctx.fillStyle;
    if (second && second !== '#fefefe' && !UNSUPPORTED_COLOR_FN_RE.test(second)) {
      return second;
    }
  } catch {
    // ignore unsupported expression
  }
  return fallback;
}

/**
 * Replaces balanced CSS function calls such as oklch(...), oklab(...), color-mix(...), lch(...), lab(...)
 * inside raw CSS text so html2canvas's CSS parser never encounters unsupported color functions.
 */
function sanitizeCssTextColorFunctions(cssText: string, ctx: CanvasRenderingContext2D): string {
  if (!cssText || !UNSUPPORTED_COLOR_FN_RE.test(cssText)) return cssText;

  let result = '';
  let i = 0;
  const len = cssText.length;

  while (i < len) {
    const rest = cssText.slice(i);
    const match = rest.match(/^(oklch|oklab|color-mix|lch|lab)\s*\(/i);
    if (match) {
      const startParen = i + match[0].length - 1;
      let depth = 0;
      let endIdx = startParen;
      while (endIdx < len) {
        const ch = cssText[endIdx];
        if (ch === '(') depth++;
        else if (ch === ')') {
          depth--;
          if (depth === 0) break;
        }
        endIdx++;
      }

      if (depth === 0) {
        const fullExpr = cssText.slice(i, endIdx + 1);
        const fnName = match[1].toLowerCase();
        // If color-mix or unknown, try canvas conversion; if not supported by canvas, fall back cleanly
        const resolved = resolveColorFnWithCanvas(
          fullExpr,
          ctx,
          fnName === 'color-mix' ? 'rgba(15, 23, 42, 0.15)' : '#0f172a'
        );
        result += resolved;
        i = endIdx + 1;
        continue;
      }
    }
    result += cssText[i];
    i++;
  }

  return result;
}

/**
 * Converts modern Tailwind v4 CSS color functions (oklch, oklab, color-mix, lch, lab)
 * in both stylesheets (<style> and same-origin <link>) and computed element styles
 * inside html2canvas's cloned document so html2canvas renders faithfully in dev & prod builds.
 */
function sanitizeOklchForHtml2Canvas(clonedDoc: Document): void {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Resolve computed inline colors BEFORE mutating stylesheets
    const elements = clonedDoc.querySelectorAll('*');
    const colorProps = [
      'color',
      'background-color',
      'border-color',
      'border-top-color',
      'border-bottom-color',
      'border-left-color',
      'border-right-color',
      'outline-color',
      'fill',
      'stroke',
    ];

    const view = clonedDoc.defaultView || window;
    elements.forEach((node) => {
      if (node instanceof HTMLElement || node instanceof SVGElement) {
        const computed = view.getComputedStyle(node);
        colorProps.forEach((prop) => {
          const val = computed.getPropertyValue(prop);
          if (val && UNSUPPORTED_COLOR_FN_RE.test(val)) {
            const safeColor = resolveColorFnWithCanvas(
              val,
              ctx,
              prop === 'background-color' ? '#ffffff' : '#0f172a'
            );
            node.style.setProperty(prop, safeColor, 'important');
          }
        });

        const bgImg = computed.getPropertyValue('background-image');
        if (bgImg && UNSUPPORTED_COLOR_FN_RE.test(bgImg)) {
          node.style.setProperty(
            'background-image',
            sanitizeCssTextColorFunctions(bgImg, ctx),
            'important'
          );
        }

        const boxShadow = computed.getPropertyValue('box-shadow');
        if (boxShadow && UNSUPPORTED_COLOR_FN_RE.test(boxShadow)) {
          node.style.setProperty(
            'box-shadow',
            sanitizeCssTextColorFunctions(boxShadow, ctx),
            'important'
          );
        }
      }
    });

    // 2. Sanitize inline <style> blocks
    clonedDoc.querySelectorAll('style').forEach((styleEl) => {
      if (styleEl.textContent && UNSUPPORTED_COLOR_FN_RE.test(styleEl.textContent)) {
        styleEl.textContent = sanitizeCssTextColorFunctions(styleEl.textContent, ctx);
      }
    });

    // 3. In production Vite builds, Tailwind CSS v4 lives in same-origin <link rel="stylesheet">.
    // Inline a sanitized copy of any same-origin stylesheet containing oklch/oklab/color-mix.
    const linkSheets = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"]'));
    linkSheets.forEach((linkEl) => {
      try {
        const sheet = (linkEl as HTMLLinkElement).sheet;
        if (!sheet) return;
        const rules = sheet.cssRules;
        if (!rules) return;
        let combinedCss = '';
        for (let r = 0; r < rules.length; r++) {
          combinedCss += rules[r].cssText + '\n';
        }
        if (UNSUPPORTED_COLOR_FN_RE.test(combinedCss)) {
          const cleanStyle = clonedDoc.createElement('style');
          cleanStyle.textContent = sanitizeCssTextColorFunctions(combinedCss, ctx);
          linkEl.parentNode?.replaceChild(cleanStyle, linkEl);
        }
      } catch {
        // Cross-origin stylesheet (e.g. Google Fonts) cannot be read and has no Tailwind oklch
      }
    });
  } catch (err) {
    console.warn('sanitizeOklchForHtml2Canvas error:', err);
  }
}

/**
 * Unhides `.hidden` / `print:block` / `print:flex` / etc. on a cloned element tree,
 * strips `.no-print`, expands scrollable containers, and converts `<canvas>` elements to `<img>`.
 */
function prepareClonedPrintableTree(origEl: HTMLElement, clonedEl: HTMLElement): void {
  // Unhide root element cleanly even if hidden via Tailwind `hidden print:block`
  clonedEl.classList.remove('hidden');
  clonedEl.style.display = 'block';
  clonedEl.style.visibility = 'visible';
  clonedEl.style.opacity = '1';
  clonedEl.style.width = '100%';
  clonedEl.style.maxWidth = '100%';
  clonedEl.style.overflow = 'visible';
  clonedEl.style.maxHeight = 'none';
  clonedEl.style.height = 'auto';

  // Remove any UI-only `.no-print` elements or `print:hidden` elements inside clone
  clonedEl.querySelectorAll('.no-print, [class*="print:hidden"]').forEach((node) => node.remove());

  // Unhide any print-only blocks inside clone
  const printDisplayMap: Array<[string, string]> = [
    ['[class*="print:block"]', 'block'],
    ['[class*="print:flex"]', 'flex'],
    ['[class*="print:inline-flex"]', 'inline-flex'],
    ['[class*="print:inline-block"]', 'inline-block'],
    ['[class*="print:grid"]', 'grid'],
    ['[class*="print:table-row"]', 'table-row'],
    ['[class*="print:table-cell"]', 'table-cell'],
    ['[class*="print:table"]', 'table'],
  ];

  printDisplayMap.forEach(([selector, displayVal]) => {
    clonedEl.querySelectorAll(selector).forEach((node) => {
      if (node instanceof HTMLElement) {
        node.classList.remove('hidden');
        node.style.display = displayVal;
      }
    });
  });

  // Expand all internal scrollable/clipped containers so full multi-page reports render
  clonedEl
    .querySelectorAll(
      '.overflow-auto, .overflow-y-auto, .overflow-x-auto, .overflow-hidden, [class*="max-h-"]'
    )
    .forEach((node) => {
      if (node instanceof HTMLElement) {
        node.style.overflow = 'visible';
        node.style.maxHeight = 'none';
        node.style.height = 'auto';
      }
    });

  // Snapshot live <canvas> elements (barcodes, signatures) into crisp <img> tags
  const origCanvases = origEl.querySelectorAll('canvas');
  const clonedCanvases = clonedEl.querySelectorAll('canvas');
  origCanvases.forEach((origCanvas, idx) => {
    const clonedCanvas = clonedCanvases[idx];
    if (clonedCanvas) {
      try {
        const dataUrl = origCanvas.toDataURL('image/png');
        const img = document.createElement('img');
        img.src = dataUrl;
        img.className = clonedCanvas.className;
        img.style.cssText = clonedCanvas.style.cssText;
        if (origCanvas.width) img.width = origCanvas.width;
        if (origCanvas.height) img.height = origCanvas.height;
        clonedCanvas.parentNode?.replaceChild(img, clonedCanvas);
      } catch {
        // Ignore tainted canvas errors
      }
    }
  });
}

/**
 * Waits briefly for all images inside the cloned staging tree to settle;
 * replaces broken or blocked external images so rendering never aborts.
 */
async function waitForClonedImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  if (imgs.length === 0) return;

  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            if (img.naturalWidth === 0) {
              img.src = TRANSPARENT_PIXEL;
              img.style.display = 'none';
            }
            resolve();
            return;
          }
          const timer = setTimeout(() => {
            if (img.naturalWidth === 0) {
              img.src = TRANSPARENT_PIXEL;
              img.style.display = 'none';
            }
            resolve();
          }, 1800);
          img.onload = () => {
            clearTimeout(timer);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timer);
            img.src = TRANSPARENT_PIXEL;
            img.style.display = 'none';
            resolve();
          };
        })
    )
  );
}

interface AtomicSpan {
  top: number;
  bottom: number;
  kind: 'tr' | 'heading' | 'block';
  isHead?: boolean;
}

interface TableRegion {
  top: number;
  bottom: number;
  theadTop: number | null;
  theadBottom: number | null;
}

interface PdfLayoutMetrics {
  refHeight: number;
  atomicSpans: AtomicSpan[];
  tableRegions: TableRegion[];
}

/**
 * Measures every table row (`<tr>`), heading, `<thead>`, and unbreakable UI block
 * inside the rendered staging DOM so multi-page PDF slicing never cuts text or rows in half.
 */
function collectPdfLayoutMetrics(rootEl: HTMLElement, fallbackHeight: number): PdfLayoutMetrics {
  const rootRect = rootEl.getBoundingClientRect();
  const refHeight = rootRect.height > 10 ? rootRect.height : fallbackHeight;
  const atomicSpans: AtomicSpan[] = [];
  const tableRegions: TableRegion[] = [];

  const toRel = (rect: DOMRect) => ({
    top: Math.max(0, rect.top - rootRect.top),
    bottom: Math.max(0, rect.bottom - rootRect.top),
  });

  // 1. Record tables & their thead bands for clean continuation headers
  rootEl.querySelectorAll('table').forEach((table) => {
    const tRect = table.getBoundingClientRect();
    if (tRect.height < 4) return;
    const tRel = toRel(tRect);
    const directThead = Array.from(table.children).find(
      (child) => child.tagName === 'THEAD'
    ) as HTMLElement | undefined;

    let theadTop: number | null = null;
    let theadBottom: number | null = null;
    if (directThead) {
      const hRect = directThead.getBoundingClientRect();
      if (hRect.height >= 4 && hRect.height <= 200) {
        const hRel = toRel(hRect);
        theadTop = hRel.top;
        theadBottom = hRel.bottom;
      }
    }

    tableRegions.push({
      top: tRel.top,
      bottom: tRel.bottom,
      theadTop,
      theadBottom,
    });
  });

  // 2. Protect every table row (`<tr>`) from horizontal slicing
  rootEl.querySelectorAll('tr').forEach((tr) => {
    const rect = tr.getBoundingClientRect();
    if (rect.height < 2) return;
    const rel = toRel(rect);
    atomicSpans.push({
      top: rel.top,
      bottom: rel.bottom,
      kind: 'tr',
      isHead: Boolean(tr.closest('thead')),
    });
  });

  // 3. Protect headings (`<h1>`-`<h5>`) so titles aren't sliced or orphaned
  rootEl.querySelectorAll('h1, h2, h3, h4, h5').forEach((heading) => {
    const rect = heading.getBoundingClientRect();
    if (rect.height < 2) return;
    const rel = toRel(rect);
    atomicSpans.push({
      top: rel.top,
      bottom: rel.bottom,
      kind: 'heading',
    });
  });

  // 4. Protect paragraphs, list items, KPI cards, signature rows & explicit avoid-break blocks
  rootEl
    .querySelectorAll(
      'p, li, .avoid-break, .pdf-avoid-break, [class*="break-inside-avoid"], .grid > div'
    )
    .forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      // Never lock a huge wrapper that contains a multi-row table
      if (node.querySelector('table')) return;
      const rect = node.getBoundingClientRect();
      if (rect.height < 2 || rect.height > 320) return;
      const rel = toRel(rect);
      atomicSpans.push({
        top: rel.top,
        bottom: rel.bottom,
        kind: 'block',
      });
    });

  return { refHeight, atomicSpans, tableRegions };
}

/**
 * High-fidelity client-side PDF export.
 * Stages a visible off-screen clone (bypassing ancestor `display: none` or `hidden print:block`),
 * captures via html-to-image with hardened html2canvas fallback (Tailwind v4 oklch/oklab/color-mix safe),
 * performs DOM-aware page-break slicing (never cutting table rows or headings in half and repeating
 * table `<thead>` headers on continuation pages), and triggers binary .pdf download.
 */
export async function exportElementToPdf(
  element: HTMLElement | string,
  filename: string = 'Voucher_Document',
  options?: {
    action?: 'download' | 'print';
    title?: string;
  }
): Promise<boolean> {
  const action = options?.action || 'download';
  let stagingHost: HTMLDivElement | null = null;

  try {
    const el: HTMLElement | null =
      typeof element === 'string' ? document.getElementById(element) : element;

    if (!el) {
      console.warn('exportElementToPdf: Target element not found:', element);
      return false;
    }

    // Create an off-screen staging container on document.body so elements inside
    // `hidden print:block` or `<div class="hidden">` get real A4 layout dimensions without UI flicker.
    stagingHost = document.createElement('div');
    stagingHost.setAttribute('data-pdf-staging', 'true');
    stagingHost.style.position = 'fixed';
    stagingHost.style.left = '-100000px';
    stagingHost.style.top = '0';
    stagingHost.style.width = '820px';
    stagingHost.style.minWidth = '820px';
    stagingHost.style.backgroundColor = '#ffffff';
    stagingHost.style.color = '#0f172a';
    stagingHost.style.opacity = '1';
    stagingHost.style.zIndex = '-9999';
    stagingHost.style.pointerEvents = 'none';
    stagingHost.style.margin = '0';
    stagingHost.style.padding = '0';

    const clonedEl = el.cloneNode(true) as HTMLElement;
    prepareClonedPrintableTree(el, clonedEl);
    stagingHost.appendChild(clonedEl);
    document.body.appendChild(stagingHost);

    await waitForClonedImages(clonedEl);

    // Wait 2 animation frames so layout, tables, and grids settle inside stagingHost
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

    const captureWidth = Math.max(clonedEl.scrollWidth, clonedEl.offsetWidth, 820);
    const captureHeight = Math.max(clonedEl.scrollHeight, clonedEl.offsetHeight, 120);

    // Measure exact row/heading/table coordinates before capturing image
    const layoutMetrics = collectPdfLayoutMetrics(clonedEl, captureHeight);

    let imgData = '';
    let capturedImg: HTMLImageElement | null = null;

    // Strategy 1: html-to-image SVG foreignObject (100% native Tailwind v4 CSS support)
    try {
      const candidateDataUrl = await toPng(clonedEl, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: captureWidth,
        height: captureHeight,
        skipFonts: true,
        fontEmbedCSS: '',
        imagePlaceholder: TRANSPARENT_PIXEL,
        filter: (node) => {
          if (
            node instanceof HTMLElement &&
            (node.classList.contains('no-print') || node.className?.includes?.('print:hidden'))
          ) {
            return false;
          }
          return true;
        },
      });

      if (!candidateDataUrl || candidateDataUrl.length < 256) {
        throw new Error('Empty image data returned by toPng');
      }

      const loaded = new Image();
      loaded.src = candidateDataUrl;
      await new Promise<void>((resolve, reject) => {
        loaded.onload = () => resolve();
        loaded.onerror = () => reject(new Error('Failed to decode toPng output'));
      });

      if ((loaded.naturalWidth || 0) < 10 || (loaded.naturalHeight || 0) < 10) {
        throw new Error('Zero-dimension image returned by toPng');
      }

      imgData = candidateDataUrl;
      capturedImg = loaded;
    } catch (toPngErr) {
      console.warn('toPng failed, falling back to html2canvas with Tailwind v4 sanitizer:', toPngErr);

      const canvas = await html2canvas(clonedEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: captureWidth,
        height: captureHeight,
        windowWidth: captureWidth,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          sanitizeOklchForHtml2Canvas(clonedDoc);
        },
      });

      if (canvas.width < 10 || canvas.height < 10) {
        throw new Error('html2canvas produced empty 0x0 canvas');
      }

      imgData = canvas.toDataURL('image/png', 1.0);
      const loaded = new Image();
      loaded.src = imgData;
      await new Promise<void>((resolve, reject) => {
        loaded.onload = () => resolve();
        loaded.onerror = () => reject(new Error('Failed to decode html2canvas output'));
      });
      capturedImg = loaded;
    }

    const imgWidth = capturedImg.naturalWidth || capturedImg.width || captureWidth * 2;
    const imgHeight = capturedImg.naturalHeight || capturedImg.height || captureHeight * 2;
    const domToImgScaleY = imgHeight / Math.max(1, layoutMetrics.refHeight);

    const imgSpans = layoutMetrics.atomicSpans.map((s) => ({
      topImg: s.top * domToImgScaleY,
      bottomImg: s.bottom * domToImgScaleY,
      kind: s.kind,
      isHead: Boolean(s.isHead),
    }));

    const imgTables = layoutMetrics.tableRegions.map((t) => ({
      topImg: t.top * domToImgScaleY,
      bottomImg: t.bottom * domToImgScaleY,
      theadTopImg: t.theadTop !== null ? t.theadTop * domToImgScaleY : null,
      theadBottomImg: t.theadBottom !== null ? t.theadBottom * domToImgScaleY : null,
    }));

    // Standard A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const margin = 8; // 8mm uniform border margin
    const contentWidthMm = pageWidth - margin * 2; // 194mm
    const contentHeightMm = pageHeight - margin * 2; // 281mm
    const totalHeightMm = (imgHeight * contentWidthMm) / imgWidth;

    if (totalHeightMm <= contentHeightMm) {
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidthMm, totalHeightMm, undefined, 'FAST');
    } else {
      // Smart DOM-aware multi-page slicing: never cuts rows/text mid-line and repeats thead cleanly
      const pxPerMm = imgWidth / contentWidthMm;
      const maxPageImgPx = Math.max(120, Math.floor(contentHeightMm * pxPerMm));
      let offsetY = 0;
      let pageIndex = 0;

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = imgWidth;
      const sliceCtx = sliceCanvas.getContext('2d');

      if (sliceCtx) {
        while (offsetY < imgHeight) {
          // Check if current page starts mid-table and should repeat the table's <thead> strip
          let activeThead: { topPx: number; heightPx: number } | null = null;
          if (offsetY > 0) {
            const continuingTable = imgTables.find(
              (t) =>
                t.topImg + 4 < offsetY &&
                offsetY < t.bottomImg - 4 &&
                t.theadTopImg !== null &&
                t.theadBottomImg !== null &&
                offsetY > t.theadBottomImg + 4
            );
            if (
              continuingTable &&
              continuingTable.theadTopImg !== null &&
              continuingTable.theadBottomImg !== null
            ) {
              const headTopPx = Math.max(0, Math.floor(continuingTable.theadTopImg));
              const headBottomPx = Math.min(imgHeight, Math.ceil(continuingTable.theadBottomImg) + 1);
              const headHeightPx = headBottomPx - headTopPx;
              if (headHeightPx > 4 && headHeightPx < maxPageImgPx * 0.35) {
                activeThead = { topPx: headTopPx, heightPx: headHeightPx };
              }
            }
          }

          const bodyBudgetPx = activeThead
            ? Math.max(120, maxPageImgPx - activeThead.heightPx)
            : maxPageImgPx;
          const rawEndY = offsetY + bodyBudgetPx;

          let cutY: number;
          if (rawEndY >= imgHeight) {
            cutY = imgHeight;
          } else {
            const minAllowedCut = offsetY + Math.max(80, Math.floor(bodyBudgetPx * 0.25));
            cutY = rawEndY;

            // Iteratively snap cutY upward above any straddling row/heading/block or orphaned header
            for (let pass = 0; pass < 8; pass++) {
              let nextCut = cutY;

              // 1. Do not split any unbreakable span (tr, heading, block) smaller than 72% of page height
              const straddling = imgSpans.filter(
                (s) =>
                  s.bottomImg - s.topImg <= bodyBudgetPx * 0.72 &&
                  s.topImg < nextCut - 1 &&
                  s.bottomImg > nextCut + 1
              );
              if (straddling.length > 0) {
                const earliestTop = Math.floor(Math.min(...straddling.map((s) => s.topImg)));
                if (earliestTop >= minAllowedCut && earliestTop < nextCut) {
                  nextCut = earliestTop;
                }
              }

              // 2. Pull up orphaned thead rows or section headings left right at the bottom with no body row/block after them
              const hasContentBetween = (afterY: number, beforeY: number) =>
                imgSpans.some(
                  (s) =>
                    ((s.kind === 'tr' && !s.isHead) || s.kind === 'block') &&
                    s.topImg >= afterY - 2 &&
                    s.bottomImg <= beforeY + 2
                );

              const orphanHeaders = imgSpans.filter(
                (s) =>
                  (s.kind === 'heading' || (s.kind === 'tr' && s.isHead)) &&
                  s.bottomImg <= nextCut + 6 &&
                  nextCut - s.bottomImg <= 44 &&
                  s.topImg >= minAllowedCut &&
                  !hasContentBetween(s.bottomImg, nextCut)
              );

              if (orphanHeaders.length > 0) {
                const earliestHeaderTop = Math.floor(Math.min(...orphanHeaders.map((s) => s.topImg)));
                if (earliestHeaderTop >= minAllowedCut && earliestHeaderTop < nextCut) {
                  nextCut = earliestHeaderTop;
                }
              }

              if (nextCut === cutY) break;
              cutY = nextCut;
            }
          }

          const endsMidTable =
            cutY < imgHeight &&
            imgTables.some((t) => t.topImg + 4 < cutY && cutY < t.bottomImg - 4);
          // Include the shared 1px bottom border at table breaks when safe
          const drawEndY = endsMidTable ? Math.min(imgHeight, cutY + 1) : cutY;
          const drawBodyStartY =
            offsetY > 0 && !activeThead && imgTables.some((t) => t.topImg + 4 < offsetY && offsetY < t.bottomImg - 4)
              ? Math.max(0, offsetY - 1)
              : offsetY;

          const bodySlicePx = Math.max(1, drawEndY - drawBodyStartY);
          const totalSlicePx = (activeThead ? activeThead.heightPx : 0) + bodySlicePx;

          sliceCanvas.height = totalSlicePx;
          sliceCtx.fillStyle = '#ffffff';
          sliceCtx.fillRect(0, 0, imgWidth, totalSlicePx);

          let destY = 0;
          if (activeThead) {
            sliceCtx.drawImage(
              capturedImg,
              0,
              activeThead.topPx,
              imgWidth,
              activeThead.heightPx,
              0,
              0,
              imgWidth,
              activeThead.heightPx
            );
            destY = activeThead.heightPx;
          }

          sliceCtx.drawImage(
            capturedImg,
            0,
            drawBodyStartY,
            imgWidth,
            bodySlicePx,
            0,
            destY,
            imgWidth,
            bodySlicePx
          );

          const sliceDataUrl = sliceCanvas.toDataURL('image/png', 1.0);
          const sliceHeightMm = (totalSlicePx * contentWidthMm) / imgWidth;

          if (pageIndex > 0) pdf.addPage();
          pdf.addImage(
            sliceDataUrl,
            'PNG',
            margin,
            margin,
            contentWidthMm,
            sliceHeightMm,
            undefined,
            'FAST'
          );

          offsetY = Math.max(offsetY + 1, cutY);
          pageIndex++;
        }
      } else {
        // Fallback offset placement if 2D context unavailable
        pdf.addImage(imgData, 'PNG', margin, margin, contentWidthMm, totalHeightMm, undefined, 'FAST');
      }
    }

    const baseName = (filename || 'Official_Voucher').replace(/\.pdf$/i, '');
    const safeTitle = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalFilename = `${safeTitle || 'Official_Voucher'}.pdf`;

    // Trigger genuine .pdf download via Blob URL (reliable inside iframes & modern browsers)
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);

    if (action === 'print') {
      await printHtmlElement(el, safeTitle);
    }

    return true;
  } catch (err) {
    console.error('exportElementToPdf error:', err);
    return false;
  } finally {
    if (stagingHost && stagingHost.parentNode) {
      stagingHost.parentNode.removeChild(stagingHost);
    }
  }
}

/**
 * Universal print trigger that isolates ONLY the target printable element inside a dedicated hidden iframe
 * and opens a single, clean browser print preview for that voucher/report without printing the full web page.
 */
export async function printHtmlElement(
  element: HTMLElement | string,
  title: string = 'Voucher_Document'
): Promise<boolean> {
  try {
    const el: HTMLElement | null =
      typeof element === 'string' ? document.getElementById(element) : element;

    if (!el) {
      console.warn('printHtmlElement: Target element not found:', element);
      return false;
    }

    // Clone the target element so we can clean up scrollbars/no-print nodes without mutating live UI
    const clonedEl = el.cloneNode(true) as HTMLElement;
    prepareClonedPrintableTree(el, clonedEl);

    // Remove any existing print iframe from previous print actions
    const existingFrame = document.getElementById('isolated-print-iframe');
    if (existingFrame && existingFrame.parentNode) {
      existingFrame.parentNode.removeChild(existingFrame);
    }

    const printFrame = document.createElement('iframe');
    printFrame.id = 'isolated-print-iframe';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.opacity = '0';
    printFrame.style.pointerEvents = 'none';
    document.body.appendChild(printFrame);

    const frameWin = printFrame.contentWindow;
    const frameDoc = frameWin?.document;
    if (!frameWin || !frameDoc) {
      return await exportElementToPdf(el, title, { action: 'download' });
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((s) => s.outerHTML)
      .join('\n');

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          ${styles}
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
            }
            .no-print { display: none !important; }
            .printable-voucher-sheet, .printable-document {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              box-shadow: none !important;
            }
            table { page-break-inside: auto; break-inside: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            tr, th, td { page-break-inside: avoid !important; break-inside: avoid !important; }
            h1, h2, h3, h4, h5 { page-break-after: avoid !important; break-after: avoid !important; }
            .avoid-break, .pdf-avoid-break, [class*="break-inside-avoid"] { page-break-inside: avoid !important; break-inside: avoid !important; }
          </style>
        </head>
        <body>
          <div style="width: 100%; max-width: 820px; margin: 0 auto; padding: 4px;">
            ${clonedEl.outerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    // Wait briefly for stylesheets and images inside the iframe to settle before opening the print dialog
    await new Promise<void>((resolve) => {
      let settled = false;
      const done = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      const timer = setTimeout(done, 350);
      printFrame.onload = () => {
        clearTimeout(timer);
        setTimeout(done, 80);
      };
    });

    try {
      frameWin.focus();
      frameWin.print();
    } catch (printErr) {
      console.warn('Iframe print restricted by sandbox, downloading PDF fallback:', printErr);
      await exportElementToPdf(el, title, { action: 'download' });
    } finally {
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 6000);
    }

    return true;
  } catch (err) {
    console.warn('printHtmlElement error, falling back to PDF download:', err);
    return await exportElementToPdf(element, title, { action: 'download' });
  }
}

/**
 * Directly downloads a genuine .pdf file to user's device.
 */
export async function downloadElementAsPdf(
  element: HTMLElement | string,
  filename: string = 'Voucher_Document'
): Promise<boolean> {
  return exportElementToPdf(element, filename, { action: 'download' });
}

/**
 * Backward compatibility alias: downloads a genuine .pdf file instead of raw HTML.
 */
export async function downloadPrintableHtml(
  element: HTMLElement | string,
  filename: string = 'Voucher_Document'
): Promise<void> {
  await downloadElementAsPdf(element, filename);
}
