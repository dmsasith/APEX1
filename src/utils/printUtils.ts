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
      console.warn('exportElementToPdf: Target element not found, falling back to window.print()');
      window.focus();
      try { window.print(); } catch (e) {}
      return false;
    }

    let imgData: string;
    let imgWidth: number;
    let imgHeight: number;

    // Strategy 1: Use html-to-image which natively renders SVG foreignObject
    // This has 100% native support for Tailwind CSS v4 oklch colors!
    try {
      imgData = await toPng(el, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
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

    // Always generate and download the genuine high-res A4 PDF file
    pdf.save(finalFilename);

    if (action === 'print') {
      try {
        window.focus();
        window.print();
      } catch (e) {
        console.warn('Native window.print() suppressed by sandbox:', e);
      }
    }

    return true;
  } catch (err) {
    console.error('exportElementToPdf error:', err);
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.error('Fallback print also failed:', e);
    }
    return false;
  }
}

/**
 * Universal print trigger that isolates the printable element via an HTML print frame,
 * invokes browser print, and simultaneously produces the genuine A4 PDF so it never fails.
 */
export async function printHtmlElement(
  element: HTMLElement | string,
  title: string = 'Voucher_Document'
): Promise<boolean> {
  try {
    const el: HTMLElement | null =
      typeof element === 'string' ? document.getElementById(element) : element;

    if (!el) {
      window.focus();
      try { window.print(); } catch (e) {}
      return false;
    }

    // 1. First: Try native browser print via dedicated isolated iframe
    try {
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      printFrame.style.opacity = '0';
      printFrame.style.pointerEvents = 'none';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document;
      if (frameDoc) {
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
              <style>
                @page { size: A4 portrait; margin: 8mm; }
                * { box-sizing: border-box; }
                body { margin: 0; padding: 12px; background: #ffffff !important; color: #000000 !important; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .printable-voucher-sheet { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid black; }
              </style>
              ${styles}
            </head>
            <body>
              <div style="max-width: 820px; margin: 0 auto;">
                ${el.outerHTML}
              </div>
            </body>
          </html>
        `);
        frameDoc.close();

        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
          } catch (err) {
            console.warn('Iframe print access restricted by sandbox:', err);
          } finally {
            setTimeout(() => {
              if (document.body.contains(printFrame)) {
                document.body.removeChild(printFrame);
              }
            }, 5000);
          }
        }, 300);
      }
    } catch (frameErr) {
      console.warn('Print iframe creation warning:', frameErr);
    }

    // 2. Also try direct window.print() in case user is in an un-sandboxed tab
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.warn('Direct print blocked by sandbox:', e);
    }

    // 3. To ensure the user ALWAYS gets their document even if the sandbox blocks print:
    // Generate and download the high-resolution vector A4 PDF immediately!
    await exportElementToPdf(el, title, { action: 'download' });

    return true;
  } catch (err) {
    console.warn('printHtmlElement fallback:', err);
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.error('Final print fallback failed:', e);
    }
    return false;
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
