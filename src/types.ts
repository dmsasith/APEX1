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
  if (user.username === 'admin' || isSuperAdmin(user.role)) return true;
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
  if (isUserAllSites(user) || isCentralOrAllSiteAdmin(user.role)) return true;
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
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface ExcelItemRow {
  itemNo?: number | string;
  itemCode: string;
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

export interface Team {
  id: string;
  teamName: string;
  teamLeaderName: string;
  teamLeaderIdNumber?: string; // Leader NIC or Worker ID Number
  assignedSiteId: string;
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
  requestNoteNumber: string; // RN-2026-XXXX
  siteId: string;
  requestedBy: string;
  requestedDate: string;
  status: RequestStatus;
  priority: RequestPriority;
  purpose: string;
  items: RequestItemRow[];
  approvalDate?: string;
  approvedBy?: string;
  approvalNotes?: string;
  acceptanceDate?: string;
  acceptedBy?: string;
  acceptanceNotes?: string;
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
  templateItems: ProjectTypeTemplateItem[];
  createdAt: string;
  isDeleted?: boolean;
}

export interface Project {
  id: string;
  projectId: string; // e.g. PRJ-2026-001 or Site ID / Order No
  projectName: string;
  customerName?: string;
  customerPhone?: string;
  siteIdentifier?: string; // Physical Site ID, Connection ID, Work Order No
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
}

export interface ProjectMaterialUsage {
  id: string;
  usageVoucherNumber: string; // UV-2026-XXXX
  projectId: string;
  projectName: string;
  customerName?: string;
  customerPhone?: string;
  siteIdentifier?: string;
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
  siteIdentifier?: string;
  dispatchNoteNo?: string; // Client Gate Pass / Dispatch Note Number
  receivedDate: string;
  receivedBy: string;
  storageLocation?: string; // Central Yard, Site Branch, etc.
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
  currentInHand: number;
  lastIssuedDate: string;
}

export interface TeamInHandSummary {
  team: Team;
  site: Site;
  items: TeamInHandBalanceItem[];
  totalUnitsHeld: number;
  distinctItemsCount: number;
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

