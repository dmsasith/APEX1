export type UserRole = 
  | 'Central Warehouse Admin' 
  | 'Site Admin' 
  | 'Field Logistics Officer' 
  | 'Auditor';

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
  location: string;
  contactNumber: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  siteId: string; // 'all' or specific site id
  role: UserRole;
  password: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
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
}

export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
  total: number;
  errors: string[];
}

export interface Team {
  id: string;
  teamName: string;
  teamLeaderName: string;
  assignedSiteId: string;
  contactPhone: string;
  crewSize: number;
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
  | 'OTHER';

export type RecycleEntityType = 'item' | 'site' | 'user' | 'team' | 'project';

export interface Project {
  id: string;
  projectId: string; // e.g. PRJ-2026-001
  projectName: string;
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
    branchReturns: BranchReturn[];
    damagedRestorations?: DamagedStockRestoration[];
    projects: Project[];
    sites: Site[];
    teams: Team[];
    users: User[];
    auditLogs: AuditLogEntry[];
    config: SystemConfig;
  };
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

