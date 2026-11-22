import {
  SystemConfig,
  Site,
  User,
  Item,
  Team,
  MainStockEntry,
  StockTransferRequest,
  TeamIssue,
  TeamReturn,
  AuditLogEntry,
  Supplier,
  PurchaseOrder,
  Tenant,
  ProjectType,
  ClientFreeIssueEntry,
  Client,
} from '../types';

export const DEFAULT_TENANT: Tenant = {
  id: 'tenant-apex-main',
  companyName: 'Apex Developer',
  slug: 'apex-developer',
  contactEmail: 'support@apexstox.com',
  contactPhone: '+94 77 123 4567',
  currencySymbol: 'Rs.',
  country: 'Sri Lanka',
  subscription: {
    plan: 'free_trial',
    status: 'trialing',
    trialStartedAt: '2026-11-01T00:00:00.000Z',
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    monthlyPrice: 19.90,
    currency: 'USD',
    paymentMethodStatus: 'pending_setup',
  },
  createdAt: '2026-11-01T00:00:00.000Z',
  ownerUserId: 'usr-admin-1',
  isActive: true,
};

export const INITIAL_TENANTS: Tenant[] = [DEFAULT_TENANT];

export const INITIAL_CONFIG: SystemConfig = {
  companyName: 'Apex Developer',
  systemName: 'Apex Stock & Site Management System',
  defaultLowStockThreshold: 15,
  currencySymbol: 'Rs.',
  address: 'Apex Software Engineering & Logistics Hub',
  phone: '+94 77 123 4567',
  email: 'support@apexstox.com',
  glassTone: 'sapphire',
  themeId: 'sapphire',
  logoColor: 'sapphire',
  barcodeEnabled: true,
  usbScannerEnabled: true,
  mobileCameraScannerEnabled: true,
  barcodeAutoSelect: true,
  barcodeBeepEnabled: true,
  barcodeSymbology: 'CODE128',
  barcodePrefix: 'APX-',
  usbScanMaxLatencyMs: 60,
};

export const INITIAL_SITES: Site[] = [
  {
    id: 'site-main',
    name: 'Main Central Warehouse',
    isMainWarehouse: true,
    supervisorName: 'Sasith Dissanayake',
    location: 'Central Logistics Yard',
    contactNumber: '+94 77 123 4567',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    fullName: 'System Super Admin',
    siteId: 'all',
    role: 'Super Admin Central',
    password:
      '$sha256$108d08133197debe60ff8ba1$bb9914cd7e862f0e15ab1d63be3a6bfbe857a428db612ee53d42cf1814dc9c7b',
    createdAt: new Date().toISOString(),
  },
];

// Clean Production Initial State: No dummy items, teams, or transactions
export const INITIAL_ITEMS: Item[] = [];
export const INITIAL_TEAMS: Team[] = [];
export const INITIAL_MAIN_STOCK_ENTRIES: MainStockEntry[] = [];
export const INITIAL_STOCK_REQUESTS: StockTransferRequest[] = [];
export const INITIAL_TEAM_ISSUES: TeamIssue[] = [];
export const INITIAL_TEAM_RETURNS: TeamReturn[] = [];
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];
export const INITIAL_PROJECTS: any[] = [];
export const INITIAL_PROJECT_TYPES: ProjectType[] = [
  {
    id: 'pt-tnc',
    name: 'Telecom New Connection',
    code: 'TNC',
    description: 'FTTH, copper & customer subscriber installations',
    color: 'emerald',
    templateItems: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pt-tcd',
    name: 'Telecom Cable Development',
    code: 'TCD',
    description: 'Main backbone fiber, feeder route & cable development',
    color: 'blue',
    templateItems: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pt-mfr',
    name: 'Maintenance & Fault Rectification',
    code: 'MFR',
    description: 'Cable breakdown restoration & routine field maintenance',
    color: 'amber',
    templateItems: [],
    createdAt: new Date().toISOString(),
  },
];
export const INITIAL_PROJECT_USAGES: any[] = [];
export const INITIAL_BRANCH_RETURNS: any[] = [];
export const INITIAL_BACKUPS: any[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [];
export const INITIAL_SUPPLIER_RETURNS: any[] = [];
export const INITIAL_CLIENT_FREE_ISSUES: ClientFreeIssueEntry[] = [];
export const INITIAL_CLIENTS: Client[] = [];

export const DEFAULT_LETTERHEAD_TEMPLATES = [
  {
    id: 'tpl-iso-9001-standard',
    templateName: 'ISO 9001:2015 Standard Controlled Format',
    companyName: '',
    subtitle: 'ISO 9001:2015 Quality Management System — Official Inventory, Warehouse & Site Operations Controlled Document',
    tel: '',
    fax: '',
    email: '',
    address: 'Head Office & Central Warehouse Operations',
    logoText: '',
    designeePrepared: 'Storekeeper / Site Officer',
    designeeApproved: 'Authorized Manager / Head of Operations',
    departmentPrepared: 'Warehouse & Site Logistics',
    departmentApproved: 'Central Operations & Quality Control',
    issueNo: '01',
    revisionNo: '00',
    reviewedBy: '',
    approvedBy: '',
    preparedBy: '',
    paperSize: 'a4' as const,
    orientation: 'portrait' as const,
  },
];

export const DEFAULT_DIGITAL_SIGNATURES: any[] = [];

