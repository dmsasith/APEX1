export type UserRole = 
  | 'Super Admin Central'
  | 'All Site Branch Admin'
  | 'Branch Admin'
  | 'Branch System User';

export function isSuperAdmin(role?: string): boolean {
  return role === 'Super Admin Central';
}

export function isAllSiteBranchAdmin(role?: string): boolean {
  return role === 'All Site Branch Admin';
}

export function isBranchAdmin(role?: string): boolean {
  return role === 'Branch Admin';
}

export function isBranchSystemUser(role?: string): boolean {
  return role === 'Branch System User';
}

export function isCentralOrAllSiteAdmin(role?: string): boolean {
  return isSuperAdmin(role) || isAllSiteBranchAdmin(role);
}

export function normalizeRole(role?: string): 'Super Admin Central' | 'All Site Branch Admin' | 'Branch Admin' | 'Branch System User' {
  if (!role) return 'Branch System User';
  if (role === 'Super Admin Central') return 'Super Admin Central';
  if (role === 'All Site Branch Admin') return 'All Site Branch Admin';
  if (role === 'Branch Admin') return 'Branch Admin';
  return 'Branch System User';
}

export interface SystemConfig {
  companyName: string;
  systemName: string;
  defaultLowStockThreshold: number;
  currencySymbol: string;
  address?: string;
  phone?: string;
  email?: string;
  logoType?: 'icon' | 'image' | 'monogram';
  logoIcon?: string;
  logoImage?: string;
  logoMonogram?: string;
  logoColor?: string;
  themeId?: string;
  bgEffect?: string;
  // SaaS Owner Bank & QR Payment Gateway Settings
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranchSwift?: string;
  bankQrImage?: string;
  usdToLkrRate?: number; // USD to LKR conversion rate (e.g. 332.64)
  // Barcode & Scanner Settings (USB HID + Mobile Camera + Firebase Sync)
  barcodeEnabled?: boolean;
  usbScannerEnabled?: boolean;
  mobileCameraScannerEnabled?: boolean;
  barcodeAutoSelect?: boolean;
  barcodeBeepEnabled?: boolean;
  barcodeSymbology?: 'CODE128' | 'CODE39' | 'EAN13';
  barcodePrefix?: string;
  usbScanMaxLatencyMs?: number;
}

export interface Site {
  id: string;
  name: string;
  isMainWarehouse: boolean;
  supervisorName: string;
  supervisorUserId?: string; // Linked registered User ID when assigned to a system user ('' when custom/unassigned)
  location: string;
  contactNumber: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  siteId: string; // 'all', 'unassigned', or primary assigned site id (kept synced with siteIds[0])
  siteIds?: string[]; // ['all'], ['unassigned'], or array of 1+ assigned site IDs
  role: UserRole;
  password: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  tenantId?: string;
}

export function isUserAllSites(
  user?: Pick<User, 'siteId' | 'siteIds' | 'role' | 'username'> | null
): boolean {
  if (!user) return false;
  const hasSpecificSites =
    (Array.isArray(user.siteIds) &&
      user.siteIds.length > 0 &&
      user.siteIds.some((id) => id && id !== 'all' && id !== 'unassigned') &&
      !user.siteIds.includes('all')) ||
    (Boolean(user.siteId) && user.siteId !== 'all' && user.siteId !== 'unassigned');
  if (hasSpecificSites) return false;
  if (user.username === 'admin' || isCentralOrAllSiteAdmin(user.role)) return true;
  if (user.siteId === 'all') return true;
  if (Array.isArray(user.siteIds) && user.siteIds.includes('all')) return true;
  return false;
}

export function getUserSupervisedSites(
  user?: Pick<User, 'id' | 'fullName'> | null,
  sites?: Site[]
): Site[] {
  if (!user || !sites || sites.length === 0) return [];
  const normName = (user.fullName || '').trim().toLowerCase();
  return sites.filter((s) => {
    if (s.isDeleted) return false;
    if (s.supervisorUserId && s.supervisorUserId === user.id) return true;
    if (
      !s.supervisorUserId &&
      normName &&
      (s.supervisorName || '').trim().toLowerCase() === normName
    ) {
      return true;
    }
    return false;
  });
}

export function getUserAssignedSiteIds(
  user?: Pick<User, 'id' | 'fullName' | 'siteId' | 'siteIds' | 'role' | 'username'> | null,
  sites?: Site[]
): string[] {
  if (!user) return [];
  if (isUserAllSites(user)) return ['all'];

  const ids = new Set<string>();

  if (Array.isArray(user.siteIds) && user.siteIds.length > 0) {
    user.siteIds.forEach((id) => {
      if (id && id !== 'all' && id !== 'unassigned') {
        ids.add(id);
      }
    });
  } else if (user.siteId && user.siteId !== 'all' && user.siteId !== 'unassigned') {
    ids.add(user.siteId);
  }

  // Include any active site where this user is designated as supervisor
  if (sites && sites.length > 0) {
    const supervised = getUserSupervisedSites(user, sites);
    supervised.forEach((s) => ids.add(s.id));
  }

  const result = Array.from(ids);
  if (sites && sites.length > 0) {
    return result.filter((id) => sites.some((s) => s.id === id && !s.isDeleted));
  }
  return result;
}

export function userHasSiteAccess(
  user: Pick<User, 'id' | 'fullName' | 'siteId' | 'siteIds' | 'role' | 'username'> | null | undefined,
  siteId: string,
  sites?: Site[]
): boolean {
  if (!user || !siteId) return false;
  if (isUserAllSites(user)) return true;
  return getUserAssignedSiteIds(user, sites).includes(siteId);
}

export function isUserAssignedToSite(
  user: Pick<User, 'id' | 'fullName' | 'siteId' | 'siteIds' | 'role' | 'username' | 'isDeleted'>,
  site: Site,
  allSites?: Site[]
): boolean {
  if (!user || user.isDeleted || !site || site.isDeleted) return false;
  if (site.isMainWarehouse && isUserAllSites(user)) return true;
  if (site.supervisorUserId && site.supervisorUserId === user.id) return true;
  if (
    !site.supervisorUserId &&
    user.fullName &&
    site.supervisorName &&
    site.supervisorName.trim().toLowerCase() === user.fullName.trim().toLowerCase()
  ) {
    return true;
  }
  if (isUserAllSites(user)) return false;
  return getUserAssignedSiteIds(user, allSites).includes(site.id);
}

export interface Item {
  id: string;
  itemCode: string;
  barcode?: string; // Dedicated 1D/2D barcode (EAN-13, Code-128, UPC, QR, or custom SKU barcode)
  itemName: string;
  category: string;
  itemType?: 'Material' | 'Machinery'; // Dedicated classification: Material (consumable) vs Machinery/Equipment
  unit: string; // 'pcs' | 'm' | 'kg' | 'boxes' | 'bags' | 'sets' | 'coils' | 'drums' etc.
  unitPrice: number;
  lowStockThreshold: number;
  description?: string;
  reservedProjectId?: string; // Optional: ID of project this item is strictly reserved for ('none' or project.id)
  reservedProjectName?: string; // Optional: Display name of assigned project
  isProjectReserved?: boolean; // Optional: Flag indicating item is restricted to assigned project
  imageUrl?: string; // Optional: Client-side compressed <200KB base64 data URL or image link
  imageSizeKb?: number; // Optional: Compressed image size in KB (guaranteed <= 200KB)
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface ExcelItemRow {
  itemNo?: number | string;
  itemCode: string;
  barcode?: string;
  itemName: string;
  category?: string;
  itemType?: 'Material' | 'Machinery';
  unit: string;
  description?: string;
  unitPrice?: number;
  lowStockThreshold?: number;
  initialStock?: number;
  reservedProjectId?: string;
  reservedProjectName?: string;
  isProjectReserved?: boolean;
}

export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
  total: number;
  errors: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  idNumber: string; // NIC / Employee ID Number / Worker ID
  role?: string; // e.g. Technician, Helper, Driver, Fitter
  phone?: string;
}

export interface TeamSiteAssignmentHistoryRecord {
  id: string;
  siteId: string;
  siteName: string;
  assignmentType: 'Permanent' | 'Temporary';
  status: 'Active' | 'Completed / Transferred';
  previousSiteId?: string;
  previousSiteName?: string;
  pendingStockUnitsAtTransfer?: number;
  stockCleared?: boolean;
  stockClearedAt?: string;
  assignedAt: string;
  assignedBy?: string;
  promotedToPermanentAt?: string;
  promotedBy?: string;
  endedAt?: string;
  notes?: string;
}

export interface Team {
  id: string;
  teamName: string;
  baseTeamName?: string; // Original base team name without (Ref: ...) suffix
  teamLeaderName: string;
  teamLeaderIdNumber?: string; // Leader NIC or Worker ID Number
  assignedSiteId: string;
  assignmentStatus?: 'Permanent' | 'Temporary'; // Current site assignment state
  previousSiteId?: string; // Prior registered site ID before transfer
  previousSiteName?: string; // Prior registered site name (for Ref: [Previous Site Name])
  pendingClearanceSiteId?: string; // Previous site ID where unreturned stock is still pending clearance
  pendingClearanceSiteName?: string; // Previous site name where stock is pending clearance
  temporaryAssignedAt?: string;
  permanentConfirmedAt?: string;
  permanentConfirmedBy?: string;
  siteAssignmentHistory?: TeamSiteAssignmentHistoryRecord[];
  contactPhone: string;
  crewSize: number;
  members?: TeamMember[];
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export type MainStockEntryType = 'Purchase' | 'Manual Entry';

export interface MainStockEntry {
  id: string;
  timestamp: string;
  entryType: MainStockEntryType;
  referenceNo: string; // PO Number or Adjustment Ref
  supplier: string;
  itemId: string;
  quantity: number;
  unitCost: number;
  notes: string;
  receivedBy: string;
  reservedProjectId?: string;
  reservedProjectName?: string;
}

export type RequestStatus = 
  | 'Pending Approval' 
  | 'Approved / In-Transit' 
  | 'Accepted' 
  | 'Rejected';

export type RequestPriority = 'Normal' | 'Urgent' | 'Emergency';

export interface RequestItemRow {
  itemId: string;
  requestedQty: number;
  approvedQty?: number;
  receivedQty?: number;
}

export interface StockTransferRequest {
  id: string;
  requestNoteNumber: string; // RN-2026-0001
  siteId: string;
  requestedBy: string;
  requestedDate: string;
  status: RequestStatus;
  priority: RequestPriority;
  purpose: string;
  items: RequestItemRow[];
  requestCategory?: 'normal' | 'foc';
  focProjectId?: string;
  focProjectCode?: string;
  focProjectName?: string;
  focProjectScope?: 'main' | 'individual' | 'sub';
  focClientName?: string;
  approvalDate?: string;
  approvedBy?: string;
  approvalNotes?: string;
  acceptanceDate?: string;
  acceptedBy?: string;
  acceptanceNotes?: string;
  updatedAt?: string;
}

export interface CrossProjectOverrideItemRow {
  itemId: string;
  quantity: number;
}

export interface CrossProjectOverrideRequest {
  id: string;
  requestNumber: string; // OVR-2026-0001
  projectId: string;
  projectName: string;
  teamId: string;
  teamName: string;
  siteId: string;
  requestedBy: string;
  requestedDate: string;
  status: 'Pending Admin Review' | 'Accepted' | 'Rejected';
  items: CrossProjectOverrideItemRow[];
  reason: string;
  adminNotes?: string;
  usagePayload?: any;
}

export interface IssueItemRow {
  itemId: string;
  quantity: number;
}

export interface TeamIssue {
  id: string;
  issueNoteNumber: string; // IN-2026-XXXX
  siteId: string;
  teamId: string;
  issuedBy: string;
  issueDate: string;
  workOrderRef: string;
  items: IssueItemRow[];
  notes?: string;
}

export type ReturnCondition = 'Good / Restock' | 'Damaged / Scrap';

export interface TeamReturn {
  id: string;
  returnVoucherNumber: string; // RV-2026-XXXX
  siteId: string;
  teamId: string;
  returnedBy: string;
  returnDate: string;
  itemId: string;
  quantity: number;
  condition: ReturnCondition;
  reason: string;
}

export type AuditAction = 
  | 'MAIN_STOCK_RECEIPT'
  | 'SITE_REQUEST_CREATED'
  | 'SITE_REQUEST_APPROVED'
  | 'SITE_REQUEST_ACCEPTED'
  | 'SITE_REQUEST_REJECTED'
  | 'TEAM_ISSUE_DISPATCHED'
  | 'TEAM_RETURN_LOGGED'
  | 'RECORD_DELETED'
  | 'MASTER_ITEM_CREATED'
  | 'MASTER_ITEM_UPDATED'
  | 'MASTER_ITEM_SOFT_DELETED'
  | 'MASTER_ITEM_RESTORED'
  | 'MASTER_ITEM_PERMANENTLY_DELETED'
  | 'MASTER_SITE_CREATED'
  | 'MASTER_SITE_UPDATED'
  | 'MASTER_SITE_SOFT_DELETED'
  | 'MASTER_SITE_RESTORED'
  | 'MASTER_SITE_PERMANENTLY_DELETED'
  | 'MASTER_TEAM_CREATED'
  | 'MASTER_TEAM_UPDATED'
  | 'MASTER_TEAM_SOFT_DELETED'
  | 'MASTER_TEAM_RESTORED'
  | 'MASTER_TEAM_PERMANENTLY_DELETED'
  | 'MASTER_USER_CREATED'
  | 'MASTER_USER_UPDATED'
  | 'MASTER_USER_SOFT_DELETED'
  | 'MASTER_USER_RESTORED'
  | 'MASTER_USER_PERMANENTLY_DELETED'
  | 'ITEMS_IMPORTED_EXCEL'
  | 'DEMO_DATA_CLEARED'
  | 'DEMO_DATA_RESTORED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'PROJECT_MATERIAL_USED'
  | 'RESERVED_ITEM_CROSS_PROJECT_OVERRIDE'
  | 'CLIENT_FREE_ISSUE_RECEIVED'
  | 'CLIENT_FREE_ISSUE_DELETED'
  | 'BRANCH_RETURN_TO_MAIN'
  | 'DAMAGED_STOCK_RESTORED'
  | 'SUPPLIER_RETURN_CREATED'
  | 'SUPPLIER_RETURN_DISPATCHED'
  | 'SUPPLIER_RETURN_SETTLED'
  | 'SUPPLIER_RETURN_DELETED'
  | 'SYSTEM_FLUSHED_WITH_BACKUP'
  | 'BACKUP_CREATED'
  | 'BACKUP_RESTORED'
  | 'TEMPLATE_UPDATED'
  | 'TENANT_REGISTERED'
  | 'CONFIG_CHANGED'
  | 'CLIENT_CREATED'
  | 'CLIENT_UPDATED'
  | 'CLIENT_DELETED'
  | 'OTHER';

export type RecycleEntityType = 'item' | 'site' | 'user' | 'team' | 'project';

export interface ProjectTypeTemplateItem {
  itemId: string;
  suggestedQty?: number;
}

export interface ProjectType {
  id: string;
  name: string; // e.g. "Telecom New Connection", "Telecom Cable Development"
  code?: string; // e.g. "TNC", "TCD"
  description?: string;
  color?: string; // 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'teal' | 'indigo'
  workflowMode?: 'standard' | 'new_connection'; // Explicit workflow format selector when registering/editing a section
  templateItems: ProjectTypeTemplateItem[];
  createdAt: string;
  isDeleted?: boolean;
}

export function isTelecomNewConnectionSection(
  section?: Pick<ProjectType, 'id' | 'name' | 'code' | 'workflowMode'> | null,
  sectionNameFallback?: string
): boolean {
  if (section?.workflowMode === 'new_connection') return true;
  if (section?.workflowMode === 'standard') return false;
  if (section?.id === 'pt-tnc') return true;
  const code = (section?.code || '').trim().toUpperCase();
  if (code === 'TNC' || code === 'NC' || code === 'FTTH-NC') return true;
  const name = (section?.name || sectionNameFallback || '').trim().toLowerCase();
  if (name.includes('new connection') || name === 'telecom new connection') return true;
  return false;
}

export type ProjectScope = 'individual' | 'main' | 'sub';

export interface Project {
  id: string;
  projectId: string; // e.g. PRJ-2026-001 or Site ID / Order No / NC Number
  projectName: string;
  projectScope?: ProjectScope; // 'individual' (Standalone) | 'main' (Major Umbrella Project) | 'sub' (Sub-Project under Main Project)
  parentProjectId?: string; // ID of parent Major/Main Project when projectScope === 'sub'
  parentProjectCode?: string; // Display code of parent Major/Main Project
  parentProjectName?: string; // Display name of parent Major/Main Project
  siteId?: string; // Assigned Site Branch ID (e.g. Kaluthara, Matale)
  siteName?: string; // Assigned Site Branch Name
  customerName?: string;
  customerPhone?: string;
  siteIdentifier?: string; // Physical Site ID, Connection ID, Work Order No
  // Telecom New Connection (NC) specific fields
  ncNumber?: string; // Customer FTTH / NC Number
  ontSerialNo?: string; // ONT Serial No
  customerAddress?: string; // Customer Address
  exchangeArea?: string; // Exchange Area
  projectTypeId?: string; // Link to ProjectType
  projectTypeName?: string; // Display name
  referenceNo: string;
  district: string;
  subArea: string;
  status?: 'Active' | 'Completed' | 'On-Hold';
  createdAt: string;
  description?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface ProjectUsageItemRow {
  itemId: string;
  quantity: number;
  wastageQuantity?: number;
}

export interface ProjectMaterialUsage {
  id: string;
  usageVoucherNumber: string; // UV-2026-XXXX
  projectId: string;
  projectName: string;
  parentProjectId?: string;
  parentProjectName?: string;
  customerName?: string;
  customerPhone?: string;
  siteIdentifier?: string;
  ncNumber?: string;
  ontSerialNo?: string;
  customerAddress?: string;
  exchangeArea?: string;
  projectTypeId?: string;
  projectTypeName?: string;
  siteId: string;
  teamId: string;
  teamName?: string;
  supervisorOrLeader: string;
  supervisorOrLeaderName?: string;
  loggedBy: string;
  date: string;
  usageDate?: string;
  workDetails: string;
  items: ProjectUsageItemRow[];
  isDeleted?: boolean;
}

export interface Client {
  id: string;
  clientCode: string; // e.g. CLT-001
  name: string;
  category?: string; // e.g. Telecom Operator, Power Utility, Civil Infrastructure, EPC Main Contractor
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxRegistrationNo?: string;
  notes?: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface ClientFreeIssueItemRow {
  itemId: string;
  itemCode?: string;
  itemName?: string;
  unit?: string;
  quantity: number;
  remarks?: string;
  notes?: string;
}

export interface ClientFreeIssueEntry {
  id: string;
  voucherNumber: string; // e.g. FOC-2026-0001
  clientName: string; // e.g. Telecommunications Operator, Utility Owner, Main Contractor, etc.
  projectId: string;
  projectName: string;
  projectScope?: ProjectScope;
  parentProjectId?: string;
  parentProjectName?: string;
  assignedSiteId?: string; // Exclusive Site Branch ID allocated for this project's FOC stock
  assignedSiteName?: string; // Exclusive Site Branch Name allocated for this project's FOC stock
  siteIdentifier?: string;
  dispatchNoteNo?: string; // Client Gate Pass / Dispatch Note Number
  receivedDate: string;
  receivedBy: string;
  storageLocation?: string; // Physical receiving yard (defaults to Main Central Warehouse)
  items: ClientFreeIssueItemRow[];
  notes?: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface BranchReturn {
  id: string;
  branchReturnNumber: string; // BRN-2026-XXXX
  siteId: string;
  siteName: string;
  fromSiteId?: string;
  fromSiteName?: string;
  itemId: string;
  quantity: number;
  condition: ReturnCondition;
  reason: string;
  returnedBy: string;
  returnDate: string;
  receivedAtMainBy?: string;
  isDeleted?: boolean;
}

export interface DamagedStockRestoration {
  id: string;
  restorationNumber: string; // DSR-2026-XXXX
  itemId: string;
  quantity: number;
  restoredDate: string;
  restoredBy: string;
  notes: string;
  isDeleted?: boolean;
}

export interface StockBackup {
  id: string;
  backupNumber: number;
  name: string;
  createdAt: string;
  createdBy: string;
  reason: string;
  itemCount?: number;
  transactionCount?: number;
  stats?: {
    itemCount: number;
    siteCount: number;
    teamCount: number;
    projectCount: number;
    requestCount: number;
    issueCount: number;
    returnCount: number;
    usageCount: number;
    totalMainUnits: number;
  };
  snapshot: {
    items: Item[];
    mainStockEntries: MainStockEntry[];
    stockRequests: StockTransferRequest[];
    teamIssues: TeamIssue[];
    teamReturns: TeamReturn[];
    projectUsages: ProjectMaterialUsage[];
    crossProjectRequests?: CrossProjectOverrideRequest[];
    clientFreeIssues?: ClientFreeIssueEntry[];
    branchReturns: BranchReturn[];
    damagedRestorations?: DamagedStockRestoration[];
    projects: Project[];
    projectTypes?: ProjectType[];
    suppliers?: Supplier[];
    clients?: Client[];
    purchaseOrders?: PurchaseOrder[];
    supplierReturns?: SupplierReturn[];
    sites: Site[];
    teams: Team[];
    users: User[];
    auditLogs: AuditLogEntry[];
    config: SystemConfig;
  };
}

export interface FlushMeta {
  flushId: string;
  flushedAt: string;
  flushedAtMs: number;
  flushedBy: string;
  backupNumber: number;
}

export interface RecycleBinItem {
  id: string;
  type: RecycleEntityType;
  title: string;
  subtitle: string;
  deletedAt: string;
  deletedBy: string;
  originalData: Item | Site | User | Team | Project;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  referenceNo: string;
  siteName: string;
  performedBy: string;
  details: string;
  itemCode?: string;
  quantityChanged?: number;
}

export interface TeamInHandBalanceItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  totalIssued: number;
  totalReturned: number;
  totalUsedInProjects: number;
  totalWastageInProjects?: number;
  currentInHand: number;
  lastIssuedDate: string;
  siteId?: string;
  siteName?: string;
  isStockToReturn?: boolean;
  stockToReturnLabel?: string; // e.g. "Stock to Return - [Site Name]"
}

export interface TeamSiteStockBreakdown {
  siteId: string;
  siteName: string;
  isCurrentAssignedSite: boolean;
  isStockToReturn: boolean;
  sectionLabel: string; // e.g. "Stock to Return - [Site Name]" or "[Site Name] — Active Site Stock"
  items: TeamInHandBalanceItem[];
  totalIssued: number;
  totalReturned: number;
  totalUsedInProjects: number;
  totalWastageInProjects: number;
  totalUnitsHeld: number;
  distinctItemsCount: number;
}

export interface TeamInHandSummary {
  team: Team;
  site: Site;
  /** Strictly the items issued & usable at the team's currently assigned site (or requested filterSiteId) */
  items: TeamInHandBalanceItem[];
  /** Usable units held at the team's currently assigned site (or requested filterSiteId) */
  totalUnitsHeld: number;
  /** Distinct items held at the team's currently assigned site (or requested filterSiteId) */
  distinctItemsCount: number;
  /** Separate site-by-site stock groups belonging to previous site(s) that must be returned ("Stock to Return - [Site Name]") */
  previousSitesStockToReturn?: TeamSiteStockBreakdown[];
  /** Total unreturned units across previous site(s) ("Stock to Return") */
  totalUnitsToReturnFromPreviousSites?: number;
  /** Distinct unreturned items count across previous site(s) */
  distinctItemsToReturnCount?: number;
  /** All site breakdowns (Current Assigned Site + Previous Sites) kept strictly separated by site */
  siteBreakdowns?: TeamSiteStockBreakdown[];
}

export type DocumentFormatGroupId =
  | 'REQUISITION_ISSUE_USAGE'
  | 'RECEIPT_RETURN_FOC'
  | 'PURCHASE_ORDER'
  | 'SUPPLIER_RETURN_DEBIT_NOTE';

export type FormatRenderMode =
  | 'smart_reconstructed'
  | 'uploaded_header_banner'
  | 'full_page_stationery';

export type FormatGridStyle =
  | 'classic_bordered'
  | 'modern_corporate'
  | 'minimal_iso';

export interface SectionFormatConfig {
  groupId: DocumentFormatGroupId;
  groupName: string;
  isCustomUploaded: boolean;
  uploadedFileName?: string;
  uploadedFileType?: 'image' | 'pdf';
  uploadedFileDataUrl?: string; // Optimized full page preview image data URL
  uploadedHeaderBannerDataUrl?: string; // Cropped top header banner image data URL
  headerCropHeightPercent?: number; // Default 20 (%)
  renderMode: FormatRenderMode;
  gridStyle: FormatGridStyle;
  accentColor: string;
  formRefCode: string;
  customMainTitle?: string;
  showMetadataThreeBox: boolean;
  showIsoRevisionFooter: boolean;
  // Custom Table Column Header Labels
  colItemNoLabel: string;
  colDescriptionLabel: string;
  colUnitLabel: string;
  colQtyLabel: string;
  colSecondaryLabel: string;
  colRemarksLabel: string;
  // Custom Sign-Off Labels
  signPreparedLabel: string;
  signApprovedLabel: string;
  signThirdLabel: string;
  termsAndConditionsText?: string;
  linkedToGroupId?: DocumentFormatGroupId | '';
  extractedSummary?: string;
  updatedAt: string;
}

export interface LetterheadTemplate {
  id: string;
  templateName: string;
  companyName: string;
  subtitle: string;
  tel: string;
  fax: string;
  email: string;
  address: string;
  logoText: string;
  logoType?: 'text' | 'image';
  logoImage?: string;
  designeePrepared: string;
  designeeApproved: string;
  departmentPrepared: string;
  departmentApproved: string;
  issueNo: string;
  revisionNo: string;
  reviewedBy: string;
  approvedBy: string;
  preparedBy?: string;
  paperSize?: string;
  orientation?: string;
  sectionFormats?: Partial<Record<DocumentFormatGroupId, SectionFormatConfig>>;
}

export interface DigitalSignature {
  id: string;
  name: string;
  role: string;
  department: string;
  signatureDataUrl: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email: string;
  phone: string;
  address?: string;
  businessRegNo?: string;
  paymentTerms?: string;
  category?: string;
  notes?: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface GoodsReceiptRecord {
  id: string;
  grnNumber: string; // e.g. GRN-PO-2026-0001-1
  receiptDate: string;
  receivedBy: string;
  deliveryNoteNo?: string;
  notes?: string;
  itemsReceived: Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    quantityReceived: number;
    unit: string;
  }>;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  category?: string;
  unit: string;
  quantity: number;
  receivedQuantity?: number; // total accumulated units received across all batches
  unitPrice: number;
  lineTotal: number;
  notes?: string;
}

export type PurchaseOrderStatus =
  | 'Draft'
  | 'Order Sent'
  | 'Partially Received'
  | 'Received into Main Stock'
  | 'Cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  supplierPhone: string;
  supplierAddress?: string;
  supplierTaxNo?: string;
  orderDate: string;
  expectedDeliveryDate: string;
  deliveryLocation: string;
  paymentTerms: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxRatePercent?: number;
  taxAmount?: number;
  discountAmount?: number;
  grandTotal: number;
  notes?: string;
  preparedBy: string;
  approvedBy?: string;
  reservedProjectId?: string;
  reservedProjectName?: string;
  receivedDate?: string;
  receivedBy?: string;
  receiptHistory?: GoodsReceiptRecord[];
  closedNotes?: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export type ReturnReasonCategory =
  | 'Damaged Goods / In Transit'
  | 'Sub-standard / Quality Failure'
  | 'Incorrect Specification / Wrong Grade'
  | 'Excess Delivered'
  | 'Expired / Hardened Material'
  | 'Defective / Failed Lab Test'
  | 'Other';

export type SupplierReturnStatus =
  | 'Draft'
  | 'Dispatched to Supplier'
  | 'Debit Note Settled'
  | 'Replacement Stock Received'
  | 'Cancelled';

export type SettlementType = 'Debit Note / Refund Credit' | 'Replacement Material';

export interface SupplierReturnItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  category?: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  reasonCategory: ReturnReasonCategory;
  defectRemarks?: string;
  batchNo?: string;
}

export interface SupplierReturn {
  id: string;
  rtvNumber: string; // e.g. RTV-2026-0001
  supplierId: string;
  supplierName: string;
  supplierContactPerson?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  supplierTaxNo?: string;
  locationType: 'Main Stock' | 'Site Stock';
  siteId?: string;
  siteName?: string;
  poReference?: string;
  returnDate: string;
  expectedSettlementDate?: string;
  status: SupplierReturnStatus;
  items: SupplierReturnItem[];
  subtotal: number;
  taxAmount?: number;
  grandTotal: number; // Total debit note value
  settlementType: SettlementType;
  gatePassNo?: string;
  transporterName?: string;
  vehicleNo?: string;
  driverContact?: string;
  notes?: string;
  preparedBy: string;
  approvedBy?: string;
  dispatchedDate?: string;
  dispatchedBy?: string;
  settledDate?: string;
  settledBy?: string;
  settlementRef?: string; // Credit note # or Replacement GRN #
  settlementNotes?: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}
// ------------------ SAAS MULTI-TENANT & SUBSCRIPTION TYPES ------------------
export type TenantPlan = 'free_trial' | 'pro_monthly' | 'pro_annual';
export type TenantSubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

export interface PlatformPricingConfig {
  monthlyPrice: number; // e.g. 19.90
  annualPrice: number; // e.g. 189.00
  trialDays: number; // e.g. 7
  currency: string; // 'USD'
  currencySymbol: string; // '$'
  monthlyPlanName?: string; // 'Pro Monthly'
  annualPlanName?: string; // 'Pro Annual'
  trialPlanName?: string; // '7-Day Free Trial'
  updatedAt?: string;
}

export const DEFAULT_PLATFORM_PRICING: PlatformPricingConfig = {
  monthlyPrice: 19.90,
  annualPrice: 189.00,
  trialDays: 7,
  currency: 'USD',
  currencySymbol: '$',
  monthlyPlanName: 'Pro Monthly',
  annualPlanName: 'Pro Annual',
  trialPlanName: '7-Day Free Trial',
};

export function computePlatformPricingMetrics(raw?: Partial<PlatformPricingConfig> | null) {
  const monthlyPrice =
    typeof raw?.monthlyPrice === 'number' && !Number.isNaN(raw.monthlyPrice) && raw.monthlyPrice > 0
      ? Number(raw.monthlyPrice)
      : DEFAULT_PLATFORM_PRICING.monthlyPrice;
  const annualPrice =
    typeof raw?.annualPrice === 'number' && !Number.isNaN(raw.annualPrice) && raw.annualPrice > 0
      ? Number(raw.annualPrice)
      : DEFAULT_PLATFORM_PRICING.annualPrice;
  const trialDays =
    typeof raw?.trialDays === 'number' && !Number.isNaN(raw.trialDays) && raw.trialDays >= 1
      ? Math.round(raw.trialDays)
      : DEFAULT_PLATFORM_PRICING.trialDays;
  const currency = raw?.currency || DEFAULT_PLATFORM_PRICING.currency;
  const currencySymbol = raw?.currencySymbol || DEFAULT_PLATFORM_PRICING.currencySymbol;
  const monthlyPlanName = raw?.monthlyPlanName || DEFAULT_PLATFORM_PRICING.monthlyPlanName || 'Pro Monthly';
  const annualPlanName = raw?.annualPlanName || DEFAULT_PLATFORM_PRICING.annualPlanName || 'Pro Annual';
  const trialPlanName = raw?.trialPlanName || `${trialDays}-Day Free Trial`;

  const annualMonthlyEquivalent = Number((annualPrice / 12).toFixed(2));
  const fullYearAtMonthlyRate = Number((monthlyPrice * 12).toFixed(2));
  const annualSavingsAmount = Math.max(0, Number((fullYearAtMonthlyRate - annualPrice).toFixed(2)));
  const annualSavingsPercent =
    fullYearAtMonthlyRate > 0
      ? Math.max(0, Math.round(((fullYearAtMonthlyRate - annualPrice) / fullYearAtMonthlyRate) * 100))
      : 0;

  const formatPrice = (val: number, forceDecimals = true) => {
    if (!forceDecimals && Number.isInteger(val)) {
      return val.toString();
    }
    return val.toFixed(2);
  };

  return {
    monthlyPrice,
    annualPrice,
    trialDays,
    currency,
    currencySymbol,
    monthlyPlanName,
    annualPlanName,
    trialPlanName,
    annualMonthlyEquivalent,
    fullYearAtMonthlyRate,
    annualSavingsAmount,
    annualSavingsPercent,
    monthlyPriceFormatted: formatPrice(monthlyPrice, true),
    annualPriceFormatted: formatPrice(annualPrice, true),
    annualPriceClean: formatPrice(annualPrice, false),
    annualMonthlyEquivalentFormatted: formatPrice(annualMonthlyEquivalent, true),
    annualSavingsFormatted: formatPrice(annualSavingsAmount, true),
  };
}

export interface QueuedSubscription {
  plan: TenantPlan;
  billingCycle: 'monthly' | 'annual';
  scheduledStartDate: string;
  notes?: string;
  queuedAt: string;
}

export interface TenantSubscription {
  plan: TenantPlan;
  status: TenantSubscriptionStatus;
  trialStartedAt: string;
  trialEndsAt: string;
  monthlyPrice: number; // e.g. 19.90
  annualPrice?: number; // e.g. 189.00
  billingCycle?: 'monthly' | 'annual';
  currency: string; // 'USD'
  paymentMethodStatus?: 'pending_setup' | 'active';
  lastBillingDate?: string;
  nextBillingDate?: string;
  pendingBankPayment?: {
    submittedAt: string;
    referenceNo: string;
    amount: number;
    billingCycle: 'monthly' | 'annual';
    notes?: string;
    slipName?: string;
    slipFileName?: string;
    bankName?: string;
    planRequested?: 'pro_monthly' | 'pro_annual';
    status: 'pending' | 'approved' | 'rejected';
    approvedAt?: string;
  };
  queuedSubscription?: QueuedSubscription;
}

export interface Tenant {
  id: string; // e.g. "tenant-apex-main", "tenant-apex-telecom"
  companyName: string;
  slug: string; // "apex-developer", "apex-telecom"
  contactEmail: string;
  contactPhone?: string;
  currencySymbol: string; // "Rs.", "$", "€"
  country?: string;
  subscription: TenantSubscription;
  createdAt: string;
  ownerUserId: string;
  isActive: boolean;
  emailVerified?: boolean;
  emailVerificationCode?: string;
}

export interface TenantRegistrationForm {
  companyName: string;
  slug?: string;
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
  contactPhone?: string;
  currencySymbol: string;
  country?: string;
  initialWarehouseName?: string;
}

