import { Item } from '../types';

/**
 * Keywords commonly used in construction, telecom, electrical and heavy engineering
 * for machinery, plant, tools, and heavy equipment.
 */
const MACHINERY_KEYWORDS = [
  'machinery',
  'machine',
  'equipment',
  'heavy',
  'vehicle',
  'truck',
  'lorry',
  'excavator',
  'backhoe',
  'loader',
  'roller',
  'compactor',
  'mixer',
  'concrete mixer',
  'generator',
  'genset',
  'welder',
  'welding',
  'compressor',
  'pump',
  'submersible',
  'drilling',
  'drill',
  'saw',
  'cutter',
  'vibrator',
  'crane',
  'boom truck',
  'forklift',
  'scaffold',
  'ladder',
  'total station',
  'theodolite',
  'plant',
  'tool',
  'power tool',
  'winch',
  'hoist',
  'breaker',
  'jackhammer',
  'fusion machine',
  'splicer',
  'otdr',
  'blower',
];

/**
 * Checks if an item is classified as Machinery, Equipment, or Tool
 * versus consumable raw Materials.
 */
export function isMachineryItem(item: {
  itemType?: 'Material' | 'Machinery';
  category?: string;
  itemName?: string;
  description?: string;
}): boolean {
  if (item.itemType === 'Machinery') return true;
  if (item.itemType === 'Material') return false;

  const combined = `${item.category || ''} ${item.itemName || ''} ${item.description || ''}`.toLowerCase();
  return MACHINERY_KEYWORDS.some((kw) => combined.includes(kw));
}

export function getItemClassification(item: {
  itemType?: 'Material' | 'Machinery';
  category?: string;
  itemName?: string;
  description?: string;
}): 'Material' | 'Machinery' {
  return isMachineryItem(item) ? 'Machinery' : 'Material';
}

/**
 * Standard categories requested specifically for Machinery & Equipment
 */
export const STANDARD_MACHINERY_CATEGORIES = [
  'Excavator',
  'Compactor',
  'Generator',
  'Welding Plant',
  'Power Tools',
  'Heavy Machinery',
] as const;

export type StandardMachineryCategory = (typeof STANDARD_MACHINERY_CATEGORIES)[number];

export const STANDARD_MACHINERY_UNITS = [
  'Nos',
  'Pcs',
  'Units',
  'Sets',
  'Machines',
  'Hours',
] as const;

export const STANDARD_MATERIAL_UNITS = [
  'Pcs',
  'm',
  'm3',
  'kg',
  'boxes',
  'sets',
  'bags',
  'coils',
  'drums',
  'rolls',
] as const;
