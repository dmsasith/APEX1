import * as XLSX from 'xlsx';
import { Item, ExcelItemRow, SystemConfig } from '../types';

/**
 * Standard pre-filled template items matching the exact telecommunications & infrastructure
 * assembly unit structure shown in the user's specification.
 */
export const SAMPLE_TEMPLATE_ROWS: ExcelItemRow[] = [
  {
    itemNo: 1,
    itemCode: 'MH-HH-1',
    itemName: 'Construction of new hand holes type HH-1',
    category: 'Assembly Units (Manholes & Handholes)',
    unit: 'Pcs',
    unitPrice: 150.0,
    lowStockThreshold: 10,
    description: 'Standard concrete hand hole enclosure type HH-1 with reinforced cover',
  },
  {
    itemNo: 2,
    itemCode: 'MH-HH-2',
    itemName: 'Construction of new hand holes type HH-2',
    category: 'Assembly Units (Manholes & Handholes)',
    unit: 'Pcs',
    unitPrice: 185.0,
    lowStockThreshold: 10,
    description: 'Double cavity hand hole unit type HH-2 suitable for optic fiber branching',
  },
  {
    itemNo: 3,
    itemCode: 'MH-HH-3',
    itemName: 'Construction of new hand holes type HH-3',
    category: 'Assembly Units (Manholes & Handholes)',
    unit: 'Pcs',
    unitPrice: 220.0,
    lowStockThreshold: 8,
    description: 'Heavy-duty precast hand hole enclosure type HH-3',
  },
  {
    itemNo: 4,
    itemCode: 'MH-HH-1-IS',
    itemName: 'Construction of new hand holes type HH-1 Insitu',
    category: 'Assembly Units (Manholes & Handholes)',
    unit: 'Pcs',
    unitPrice: 240.0,
    lowStockThreshold: 5,
    description: 'Poured in-situ hand hole assembly type HH-1-IS with cast iron frame',
  },
  {
    itemNo: 5,
    itemCode: 'MH-HH-2-IS',
    itemName: 'Construction of new hand holes type HH-2 Insitu',
    category: 'Assembly Units (Manholes & Handholes)',
    unit: 'Pcs',
    unitPrice: 285.0,
    lowStockThreshold: 5,
    description: 'Cast in-situ double chamber hand hole structure type HH-2-IS',
  },
  {
    itemNo: 6,
    itemCode: 'MH-HH-3-IS',
    itemName: 'Construction of new hand holes type HH-3 Insitu',
    category: 'Assembly Units (Manholes & Handholes)',
    unit: 'Pcs',
    unitPrice: 340.0,
    lowStockThreshold: 5,
    description: 'Deep foundation cast in-situ hand hole type HH-3-IS for underground trunk',
  },
  {
    itemNo: 7,
    itemCode: 'MH-S-1-IS',
    itemName: 'Construction of new manholes type S-1 Insitu',
    category: 'Assembly Units (Manholes & Handholes)',
    unit: 'Pcs',
    unitPrice: 650.0,
    lowStockThreshold: 4,
    description: 'Reinforced concrete telecommunication manhole type S-1 cast in-situ',
  },
  {
    itemNo: 8,
    itemCode: 'MH-L-1',
    itemName: 'Construction of new manholes type L-1',
    category: 'Assembly Units (Manholes & Handholes)',
    unit: 'Pcs',
    unitPrice: 820.0,
    lowStockThreshold: 3,
    description: 'Large modular manhole unit type L-1 for multi-duct telecommunication lines',
  },
  {
    itemNo: 9,
    itemCode: 'MH-SP',
    itemName: 'Construction of new special type manholes',
    category: 'Assembly Units (Manholes & Handholes)',
    unit: 'm3',
    unitPrice: 420.0,
    lowStockThreshold: 15,
    description: 'Special engineered manhole construction volume measured in cubic meters',
  },
];

/**
 * Downloads a genuine formatted .xlsx Excel file with sample template items
 * containing both the user's specific headers ("Unit Designation", "Description of Assembly Unit")
 * and standard inventory columns.
 */
export const downloadSampleExcelTemplate = () => {
  const data = SAMPLE_TEMPLATE_ROWS.map((row) => ({
    'Item No': row.itemNo,
    'Unit Designation': row.itemCode,
    'Description of Assembly Unit': row.itemName,
    'Unit': row.unit,
    'Category': row.category,
    'Unit Price': row.unitPrice,
    'Low Stock Threshold': row.lowStockThreshold,
    'Detailed Description': row.description,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set standard column widths for clean readability
  worksheet['!cols'] = [
    { wch: 10 }, // Item No
    { wch: 20 }, // Unit Designation
    { wch: 45 }, // Description of Assembly Unit
    { wch: 12 }, // Unit
    { wch: 35 }, // Category
    { wch: 14 }, // Unit Price
    { wch: 20 }, // Low Stock Threshold
    { wch: 50 }, // Detailed Description
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Items Template');

  // Trigger browser download
  XLSX.writeFile(workbook, 'Items_Import_Template.xlsx');
};

/**
 * Exports current system items list to Excel (.xlsx)
 */
export const exportItemsToExcel = (items: Item[], filename = 'Master_Items_Catalog.xlsx') => {
  const data = items.map((item, index) => ({
    'Item No': index + 1,
    'Unit Designation (Code)': item.itemCode,
    'Item Name / Assembly Unit': item.itemName,
    'Category': item.category,
    'Unit': item.unit,
    'Unit Price': item.unitPrice,
    'Low Stock Threshold': item.lowStockThreshold,
    'Description': item.description || '',
    'Status': item.isDeleted ? 'In Recycle Bin' : 'Active',
    'Created At': item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 10 },
    { wch: 24 },
    { wch: 45 },
    { wch: 30 },
    { wch: 12 },
    { wch: 14 },
    { wch: 20 },
    { wch: 40 },
    { wch: 16 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Active Items');
  XLSX.writeFile(workbook, filename);
};

/**
 * Intelligent normalization of sheet row headers
 */
const normalizeKey = (key: string): string => {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

/**
 * Parses an uploaded .xlsx or .xls file into validated ExcelItemRow array
 */
export const parseExcelItemsFile = async (
  file: File
): Promise<{
  rows: ExcelItemRow[];
  errors: string[];
  warnings: string[];
  totalRawRows: number;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          resolve({
            rows: [],
            errors: ['The uploaded Excel workbook contains no readable sheets.'],
            warnings: [],
            totalRawRows: 0,
          });
          return;
        }

        // Use the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse to JSON array of objects
        const rawJson: Array<Record<string, unknown>> = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false,
        });

        if (!rawJson || rawJson.length === 0) {
          resolve({
            rows: [],
            errors: ['The selected worksheet is empty. Please add items or use the sample template.'],
            warnings: [],
            totalRawRows: 0,
          });
          return;
        }

        const parsedRows: ExcelItemRow[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];
        const seenCodes = new Set<string>();

        rawJson.forEach((row, index) => {
          const rowNumber = index + 2; // +2 for 1-based index and header row

          // Map headers flexibly by normalized key
          let itemCode = '';
          let itemName = '';
          let unit = '';
          let category = '';
          let description = '';
          let unitPrice = 0;
          let lowStockThreshold = 10;
          let itemNo: number | string = index + 1;

          for (const [rawKey, rawVal] of Object.entries(row)) {
            const normKey = normalizeKey(rawKey);
            const valStr = String(rawVal).trim();

            // Match Unit Designation / Item Code
            if (
              normKey.includes('unitdesignat') ||
              normKey.includes('designat') ||
              normKey.includes('itemcode') ||
              normKey === 'code' ||
              normKey.includes('partno') ||
              normKey.includes('productcode')
            ) {
              itemCode = valStr;
            }
            // Match Description of Assembly Unit / Item Name / Description
            else if (
              normKey.includes('descriptionofassembly') ||
              normKey.includes('assemblyunit') ||
              normKey.includes('itemname') ||
              normKey === 'name' ||
              normKey.includes('materialdescription')
            ) {
              itemName = valStr;
            }
            // Match Unit of Measure
            else if (
              normKey === 'unit' ||
              normKey.includes('unitofmeasure') ||
              normKey === 'uom' ||
              normKey === 'units'
            ) {
              unit = valStr;
            }
            // Match Category
            else if (
              normKey.includes('category') ||
              normKey.includes('group') ||
              normKey.includes('classification')
            ) {
              category = valStr;
            }
            // Match Unit Price / Rate / Cost
            else if (
              normKey.includes('price') ||
              normKey.includes('unitprice') ||
              normKey.includes('rate') ||
              normKey.includes('cost')
            ) {
              const parsedNum = parseFloat(valStr.replace(/[^0-9.-]/g, ''));
              if (!isNaN(parsedNum)) unitPrice = Math.max(0, parsedNum);
            }
            // Match Low Stock Threshold
            else if (
              normKey.includes('threshold') ||
              normKey.includes('lowstock') ||
              normKey.includes('minstock') ||
              normKey.includes('minimum')
            ) {
              const parsedNum = parseInt(valStr.replace(/[^0-9]/g, ''), 10);
              if (!isNaN(parsedNum)) lowStockThreshold = Math.max(0, parsedNum);
            }
            // Match Description
            else if (
              normKey.includes('description') ||
              normKey.includes('detail') ||
              normKey.includes('notes')
            ) {
              description = valStr;
            }
            // Match Item No / SNo
            else if (
              normKey.includes('itemno') ||
              normKey.includes('itemn') ||
              normKey === 'no' ||
              normKey === 'sno'
            ) {
              itemNo = valStr || index + 1;
            }
          }

          // Fallback if headers were simple / alternate
          if (!itemCode && (row['Item Code'] || row['Code'] || row['Unit Designation'])) {
            itemCode = String(row['Item Code'] || row['Code'] || row['Unit Designation']).trim();
          }
          if (!itemName && (row['Item Name'] || row['Description'] || row['Description of Assembly Unit'])) {
            itemName = String(row['Item Name'] || row['Description'] || row['Description of Assembly Unit']).trim();
          }

          // Validate required fields
          if (!itemCode && !itemName) {
            // Likely an empty row in Excel, ignore silently
            return;
          }

          if (!itemCode) {
            errors.push(`Row ${rowNumber}: Missing "Unit Designation" or "Item Code".`);
            return;
          }

          if (!itemName) {
            errors.push(`Row ${rowNumber}: Missing "Description of Assembly Unit" / "Item Name" for code "${itemCode}".`);
            return;
          }

          const upperCode = itemCode.toUpperCase();

          // Check duplicate codes in the current sheet
          if (seenCodes.has(upperCode)) {
            warnings.push(`Row ${rowNumber}: Duplicate item code "${upperCode}" detected in Excel file. The later row will be used.`);
          }
          seenCodes.add(upperCode);

          parsedRows.push({
            itemNo,
            itemCode: upperCode,
            itemName,
            unit: unit || 'Pcs',
            category: category || 'Assembly Units (Manholes & Handholes)',
            unitPrice,
            lowStockThreshold,
            description: description || itemName,
          });
        });

        resolve({
          rows: parsedRows,
          errors,
          warnings,
          totalRawRows: rawJson.length,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown Excel parsing error.';
        resolve({
          rows: [],
          errors: [`Failed to parse Excel file: ${msg}. Please ensure the file is a valid .xlsx or .xls document.`],
          warnings: [],
          totalRawRows: 0,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        rows: [],
        errors: ['File read error. Please try uploading the file again.'],
        warnings: [],
        totalRawRows: 0,
      });
    };

    reader.readAsArrayBuffer(file);
  });
};
