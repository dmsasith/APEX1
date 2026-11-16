import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';

/**
 * Converts any modern Tailwind v4 oklch colors in a cloned DOM into standard hex/rgb
 * so that html2canvas will not fail with "Attempting to parse an unsupported color function 'oklch'".
 */
function sanitizeOklchForHtml2Canvas(clonedDoc: Document): void {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const elements = clonedDoc.querySelectorAll('*');
    elements.forEach((node) => {
      if (node instanceof HTMLElement) {
        const computed = window.getComputedStyle(node);
        const colorProps = [
          'color',
          'background-color',
          'border-color',
          'border-top-color',
          'border-bottom-color',
          'border-left-color',
          'border-right-color',
          'outline-color',
        ];

        colorProps.forEach((prop) => {
          const val = computed.getPropertyValue(prop);
          if (val && val.includes('oklch')) {
            try {
              ctx.fillStyle = '#000000';
              ctx.fillStyle = val;
              node.style.setProperty(prop, ctx.fillStyle, 'important');
            } catch {
              node.style.setProperty(prop, '#000000', 'important');
            }
          }
        });
      }
    });
  } catch (err) {
    console.warn('sanitizeOklch error:', err);
  }
}

/**
 * High-fidelity client-side PDF export using html-to-image & jsPDF (with html2canvas fallback).
 * Immune to Tailwind CSS v4 oklch color parsing errors.
 * Generates genuine .pdf binary files and downloads them directly to user device.
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
  
  try {
    const el: HTMLElement | null =
      typeof element === 'string' ? document.getElementById(element) : element;

    if (!el) {
      console.warn('exportElementToPdf: Target element not found');
      return false;
    }

    let imgData: string;
    let imgWidth: number;
    let imgHeight: number;

    const prevOverflow = el.style.overflow;
    const prevMaxHeight = el.style.maxHeight;
    const prevHeight = el.style.height;
    el.style.overflow = 'visible';
    el.style.maxHeight = 'none';
    el.style.height = 'auto';

    // Strategy 1: Use html-to-image which natively renders SVG foreignObject
    // This has 100% native support for Tailwind CSS v4 oklch colors!
    try {
      imgData = await toPng(el, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: true,
        fontEmbedCSS: '',
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('no-print')) {
            return false;
          }
          return true;
        },
      });

      // Load image to calculate true natural aspect ratio
      const img = new Image();
      img.src = imgData;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load rendered image'));
      });
      imgWidth = img.naturalWidth || img.width || 1024;
      imgHeight = img.naturalHeight || img.height || 1448;
    } catch (toPngErr) {
      console.warn('toPng failed, falling back to html2canvas with oklch sanitizer:', toPngErr);

      // Scroll element to top to avoid offset bugs in html2canvas
      const prevScrollTop = el.scrollTop;
      el.scrollTop = 0;

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
        onclone: (clonedDoc) => {
          sanitizeOklchForHtml2Canvas(clonedDoc);
        },
      });

      el.scrollTop = prevScrollTop;

      imgData = canvas.toDataURL('image/png', 1.0);
      imgWidth = canvas.width;
      imgHeight = canvas.height;
    } finally {
      el.style.overflow = prevOverflow;
      el.style.maxHeight = prevMaxHeight;
      el.style.height = prevHeight;
    }

    // Standard A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const margin = 8; // 8mm border margins
    const printableWidth = pageWidth - margin * 2; // 194mm
    const calculatedHeight = (imgHeight * printableWidth) / imgWidth;

    // If document fits within 1 page, render cleanly
    if (calculatedHeight <= pageHeight - margin * 2) {
      pdf.addImage(imgData, 'PNG', margin, margin, printableWidth, calculatedHeight, undefined, 'FAST');
    } else {
      // Multi-page slicing if table has 25+ rows
      let heightLeft = calculatedHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, printableWidth, calculatedHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - margin * 2);

      while (heightLeft > 0) {
        position = heightLeft - calculatedHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, printableWidth, calculatedHeight, undefined, 'FAST');
        heightLeft -= (pageHeight - margin * 2);
      }
    }

    const safeTitle = (filename || 'Official_Voucher').replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalFilename = safeTitle.toLowerCase().endsWith('.pdf') ? safeTitle : `${safeTitle}.pdf`;

    // Generate and download the genuine high-res A4 PDF file
    pdf.save(finalFilename);

    if (action === 'print') {
      await printHtmlElement(el, safeTitle);
    }

    return true;
  } catch (err) {
    console.error('exportElementToPdf error:', err);
    return false;
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
    clonedEl.classList.remove('hidden');
    clonedEl.style.overflow = 'visible';
    clonedEl.style.maxHeight = 'none';
    clonedEl.style.height = 'auto';

    // Remove any .no-print elements inside the cloned tree
    clonedEl.querySelectorAll('.no-print').forEach((node) => node.remove());

    // Unhide any print-only blocks (e.g. .hidden.print\:block)
    clonedEl.querySelectorAll('[class*="print:block"]').forEach((node) => {
      if (node instanceof HTMLElement) {
        node.classList.remove('hidden');
        node.style.display = 'block';
      }
    });

    // Ensure scrollable inner containers expand fully in print
    clonedEl.querySelectorAll('.overflow-auto, .overflow-y-auto, .overflow-x-auto, .overflow-hidden').forEach((node) => {
      if (node instanceof HTMLElement) {
        node.style.overflow = 'visible';
        node.style.maxHeight = 'none';
        node.style.height = 'auto';
      }
    });

    // Convert any <canvas> elements (barcodes, signatures) into <img> so they render in the print iframe
    const origCanvases = el.querySelectorAll('canvas');
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
export async function downloadElementAsPdf(element: HTMLElement | string, filename: string = 'Voucher_Document'): Promise<boolean> {
  return exportElementToPdf(element, filename, { action: 'download' });
}

/**
 * Backward compatibility alias: downloads a genuine .pdf file instead of raw HTML.
 */
export async function downloadPrintableHtml(element: HTMLElement | string, filename: string = 'Voucher_Document'): Promise<void> {
  await downloadElementAsPdf(element, filename);
}
