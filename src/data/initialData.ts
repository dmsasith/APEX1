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
} from '../types';

export const INITIAL_CONFIG: SystemConfig = {
  companyName: 'Comtec Systems',
  systemName: 'Apex Stock & Site Management System',
  defaultLowStockThreshold: 15,
  currencySymbol: 'Rs.',
  address: 'Central Logistics Yard & Operations Hub',
  phone: '+94 77 123 4567',
  email: 'admin@comtecsystems.com',
};

export const INITIAL_SITES: Site[] = [
  {
    id: 'site-main',
    name: 'Main Central Warehouse',
    isMainWarehouse: true,
    supervisorName: 'Arthur Vance',
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
    role: 'Central Warehouse Admin',
    password: 'password123',
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
export const INITIAL_PROJECT_USAGES: any[] = [];
export const INITIAL_BRANCH_RETURNS: any[] = [];
export const INITIAL_BACKUPS: any[] = [];

export const DEFAULT_LETTERHEAD_TEMPLATES = [
  {
    id: 'tpl-comtec-default',
    templateName: 'Comtec Systems (Pvt) Ltd (Default)',
    companyName: 'COMTEC SYSTEMS (PVT) LTD.',
    subtitle: 'Civil Contractors, Telecommunication Engineers and Transport Services, Building Maintenance, and Earth movers, Road Contractors, J.C.B.Backhoe Loader, Boom Truck, Drum Truck, Lories, Excavators, Forklift for Hire. Building Material suppliers.',
    tel: '+94 11 2549590',
    fax: '+94 11 2549591',
    email: 'comtecsystems@sltnet.lk',
    address: 'No: 36, Udumulla, Malgama Road, Himbutana, Mulleriyawa.',
    logoText: 'COMTEC',
    designeePrepared: 'Site In-Charge / Store Keeper',
    designeeApproved: 'Central Project Engineer',
    departmentPrepared: 'Telecom & Civil Projects',
    departmentApproved: 'Central Logistics & Procurement',
    issueNo: '01',
    revisionNo: '00',
    reviewedBy: 'Dissanayake',
    approvedBy: 'Arthur Vance',
    preparedBy: 'Dissanayake',
    paperSize: 'a4',
    orientation: 'portrait'
  },
  {
    id: 'tpl-apex-eng',
    templateName: 'Apex Engineering & Logistics (Pvt) Ltd',
    companyName: 'APEX ENGINEERING & LOGISTICS (PVT) LTD.',
    subtitle: 'Industrial Construction, Heavy Infrastructure Contractors, Electrical Substation Engineering & Turnkey Supply Chain.',
    tel: '+94 11 2889900',
    fax: '+94 11 2889901',
    email: 'operations@apexengineering.lk',
    address: 'Apex Tower, 120 Nawala Road, Nugegoda, Sri Lanka.',
    logoText: 'APEX',
    designeePrepared: 'Site Logistics Supervisor',
    designeeApproved: 'Head of Operations',
    departmentPrepared: 'Field Construction Dept',
    departmentApproved: 'Central Stores Dept',
    issueNo: '01',
    revisionNo: '01',
    reviewedBy: 'K. Perera',
    approvedBy: 'Arthur Vance',
    preparedBy: 'K. Perera',
    paperSize: 'a4',
    orientation: 'portrait'
  }
];

export const DEFAULT_DIGITAL_SIGNATURES = [
  {
    id: 'sig-arthur',
    name: 'Arthur Vance',
    role: 'Central Project Engineer',
    department: 'Central Logistics & Procurement',
    signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M20,48 C35,20 45,15 55,30 C65,45 70,48 85,25 C100,2 105,50 120,40 C135,30 150,22 170,42 C185,55 195,30 205,38 M40,32 L85,28 M110,45 C125,58 140,58 160,50" fill="none" stroke="%230f2b5c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    createdAt: '2026-01-01'
  },
  {
    id: 'sig-dissanayake',
    name: 'Dissanayake',
    role: 'Site In-Charge / Supervisor',
    department: 'Civil & Telecom Operations',
    signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M15,35 C30,15 45,55 60,30 C75,5 90,45 105,35 C125,20 140,48 165,28 C185,12 195,45 205,32 M45,45 L170,45" fill="none" stroke="%231e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    createdAt: '2026-01-01'
  },
  {
    id: 'sig-sunil',
    name: 'Sunil Perera',
    role: 'Site Logistics Supervisor',
    department: 'Field Construction Dept',
    signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M20,42 C38,18 48,15 62,35 C70,48 88,20 102,30 C120,42 140,15 158,35 C175,50 188,25 200,35 M50,42 L130,42" fill="none" stroke="%23047857" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    createdAt: '2026-01-01'
  }
];
