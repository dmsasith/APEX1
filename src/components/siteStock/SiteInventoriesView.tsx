import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Filter,
  ArrowRightLeft,
  Send,
  RotateCcw,
  AlertTriangle,
  Download,
  Truck,
  CheckCircle2,
  Edit2,
  FileCheck2,
  Check,
  FileText,
  Clock,
  Printer,
  Users2,
  Phone,
  Hash,
  Layers,
  Calendar,
  Boxes,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ArrowRight,
  ArrowDown,
  MapPin,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatNumber, exportToCsv, formatDateTime } from '../../utils/exportUtils';
import { pickBestTimestamp } from '../../utils/countryTimezoneUtils';
import { StockBalanceCell } from '../common/LowStockIndicator';
import {
  StockTransferRequest,
  ProjectMaterialUsage,
  BranchReturn,
  isCentralOrAllSiteAdmin,
  isUserAllSites,
  userHasSiteAccess,
  isSubSite,
  isRegionalSiteBranch,
  getParentSite,
  getChildSubSites,
  sortSitesHierarchically,
} from '../../types';
import { PrintableDocumentModal } from '../common/PrintableDocumentModal';
import { ItemTraceabilitySummaryPanel } from '../common/ItemTraceabilitySummaryPanel';
import { SearchableItemSelect } from '../common/SearchableItemSelect';

export const SiteInventoriesView: React.FC = () => {
  const {
    sites,
    activeSites,
    items,
    activeItems,
    projects,
    getSiteItemStock,
    getSiteDamagedStock,
    currentUser,
    stockRequests,
    acceptStockRequest,
    issueStockToSubSite,
    returnMultipleStockFromBranchToMain,
    projectUsages,
    teams,
    teamIssues,
    teamReturns,
    branchReturns,
    clientFreeIssues,
    getClientFreeStockBalance,
  } = useStock();

  const nonMainBranchSites = activeSites.filter((s) => !s.isMainWarehouse);
  const allBranchSites = sortSitesHierarchically(
    nonMainBranchSites.length > 0 ? nonMainBranchSites : activeSites
  );
  const canViewAllBranches = isCentralOrAllSiteAdmin(currentUser.role) || isUserAllSites(currentUser);
  const branchSites = canViewAllBranches
    ? allBranchSites
    : allBranchSites.filter((s) => userHasSiteAccess(currentUser, s.id, activeSites));
  const defaultSiteId = branchSites[0]?.id || allBranchSites[0]?.id || activeSites[0]?.id || '';

  const [selectedSiteId, setSelectedSiteId] = useState<string>(defaultSiteId);

  React.useEffect(() => {
    if (branchSites.length > 0 && !branchSites.some((s) => s.id === selectedSiteId)) {
      setSelectedSiteId(branchSites[0].id);
    }
  }, [branchSites, selectedSiteId]);
  const [activeSection, setActiveSection] = useState<'inventory' | 'foc-materials' | 'damaged-returns' | 'history'>('inventory');
  const [expandedSiteTraceItemId, setExpandedSiteTraceItemId] = useState<string | null>(null);
  const [expandedFocTabTraceItemId, setExpandedFocTabTraceItemId] = useState<string | null>(null);

  const selectedSite = activeSites.find((s) => s.id === selectedSiteId) || sites.find((s) => s.id === selectedSiteId);
  const selectedSiteParent =
    selectedSite && isSubSite(selectedSite) ? getParentSite(selectedSite, activeSites) : undefined;
  const selectedSiteSubSites =
    selectedSite && isRegionalSiteBranch(selectedSite)
      ? getChildSubSites(selectedSite.id, activeSites)
      : [];

  // Site-Specific Approved / Accepted FOC Stock Requests
  const siteFocRequests = useMemo(() => {
    if (!selectedSiteId) return [];
    return (stockRequests || []).filter(
      (req) =>
        req.siteId === selectedSiteId &&
        (req.status === 'Approved / In-Transit' || req.status === 'Accepted') &&
        (req.requestCategory === 'foc' || Boolean(req.focProjectId))
    );
  }, [stockRequests, selectedSiteId]);

  // Site-Specific Direct or Actually-Issued FOC Client Materials Vouchers
  const siteFocMaterials = useMemo(() => {
    if (!selectedSite) return [];
    const issuedProjectFamilyIds = new Set<string>();
    siteFocRequests.forEach((req) => {
      if (req.focProjectId) {
        issuedProjectFamilyIds.add(req.focProjectId);
        const p = (projects || []).find((pr) => pr.id === req.focProjectId);
        if (p?.parentProjectId) issuedProjectFamilyIds.add(p.parentProjectId);
        (projects || [])
          .filter((sp) => !sp.isDeleted && sp.parentProjectId === (p?.parentProjectId || req.focProjectId))
          .forEach((sp) => issuedProjectFamilyIds.add(sp.id));
      }
    });

    return (clientFreeIssues || []).filter((v) => {
      if (v.isDeleted) return false;
      const matchLocation =
        Boolean(v.storageLocation) &&
        v.storageLocation!.trim().toLowerCase() === selectedSite.name.trim().toLowerCase();
      if (matchLocation) return true;

      if (issuedProjectFamilyIds.size > 0) {
        return (
          issuedProjectFamilyIds.has(v.projectId) ||
          Boolean(v.parentProjectId && issuedProjectFamilyIds.has(v.parentProjectId))
        );
      }

      return false;
    });
  }, [clientFreeIssues, selectedSite, projects, siteFocRequests]);

  const totalSiteFocRecordsCount = siteFocRequests.length + siteFocMaterials.length;

  // Per-Item 5-Stage Standard Reconciliation Metrics at this Site Branch
  const siteItemReconciliationMap = useMemo(() => {
    const map = new Map<
      string,
      {
        stage1InitialCentralFoc: number;
        centralFocPoolRemaining: number;
        stage2SiteFocIssued: number;
        stage2SiteNormalIssued: number;
        stage2TotalSiteReceived: number;
        stage3TeamIssued: number;
        stage3TeamReturnedGood: number;
        stage3TeamReturnedDamaged: number;
        stage3TeamInHand: number;
        stage4Used: number;
        stage4Wastage: number;
        stage4TotalConsumed: number;
        stage5SiteFocReturnableBalance: number;
        stage5TotalClientReturnableBalance: number;
        stage5SiteNormalBalance: number;
        hasCentralFoc: boolean;
        primaryFocProjectId?: string;
        primaryFocProjectName?: string;
      }
    >();

    if (!selectedSiteId) return map;

    const selectedSiteNameLower = (selectedSite?.name || '').trim().toLowerCase();

    activeItems.forEach((item) => {
      const sStock = getSiteItemStock(selectedSiteId, item.id);

      // 2. Site Issue (Central -> Site)
      const stage2SiteFocIssued = sStock.focReceived;
      const stage2SiteNormalIssued = sStock.normalReceived;
      const stage2TotalSiteReceived = sStock.received;

      // 1. Initial FOC Receipt at Central Stock: ONLY match FOC projects actually issued to THIS site branch
      let stage1InitialCentralFoc = 0;
      let primaryFocProjectId: string | undefined;
      let primaryFocProjectName: string | undefined;

      if (stage2SiteFocIssued > 0) {
        const focReqsForItem = siteFocRequests.filter((req) =>
          (req.items || []).some((ri) => ri.itemId === item.id)
        );
        const issuedProjectFamilyIds = new Set<string>();
        focReqsForItem.forEach((req) => {
          if (req.focProjectId) {
            issuedProjectFamilyIds.add(req.focProjectId);
            const p = (projects || []).find((pr) => pr.id === req.focProjectId);
            const rootId = p?.parentProjectId || req.focProjectId;
            issuedProjectFamilyIds.add(rootId);
            (projects || [])
              .filter((sp) => !sp.isDeleted && sp.parentProjectId === rootId)
              .forEach((sp) => issuedProjectFamilyIds.add(sp.id));
          }
        });

        (clientFreeIssues || [])
          .filter((f) => {
            if (f.isDeleted) return false;
            const hasItm = (f.items || []).some((i) => i.itemId === item.id && Number(i.quantity) > 0);
            if (!hasItm) return false;

            const isStoredAtThisSite =
              Boolean(selectedSiteNameLower) &&
              Boolean(f.storageLocation) &&
              f.storageLocation!.trim().toLowerCase() === selectedSiteNameLower;
            if (isStoredAtThisSite) return true;

            if (issuedProjectFamilyIds.size > 0) {
              return (
                issuedProjectFamilyIds.has(f.projectId) ||
                Boolean(f.parentProjectId && issuedProjectFamilyIds.has(f.parentProjectId))
              );
            }

            // Legacy FOC request without focProjectId: only match vouchers explicitly assigned to THIS site
            const fProj = (projects || []).find((p) => p.id === f.projectId || p.id === f.parentProjectId);
            const effectiveSiteId = f.assignedSiteId || fProj?.siteId;
            return effectiveSiteId === selectedSiteId;
          })
          .forEach((f) => {
            const row = (f.items || []).find((i) => i.itemId === item.id);
            if (row && Number(row.quantity) > 0) {
              stage1InitialCentralFoc += Number(row.quantity);
              if (!primaryFocProjectId) {
                primaryFocProjectId = f.projectId;
                primaryFocProjectName = f.projectName;
              }
            }
          });

        if (!primaryFocProjectName) {
          const reqWithProj = focReqsForItem.find((r) => r.focProjectName);
          if (reqWithProj) {
            primaryFocProjectId = reqWithProj.focProjectId;
            primaryFocProjectName = reqWithProj.focProjectName;
          }
        }
      }

      if (stage2SiteFocIssued > 0 && stage1InitialCentralFoc === 0) {
        stage1InitialCentralFoc = stage2SiteFocIssued;
      }

      const centralFocPoolRemaining = Math.max(0, stage1InitialCentralFoc - stage2SiteFocIssued);

      // 3. Team Issue (Site -> Field Teams)
      const stage3TeamIssued = sStock.issued;
      const stage3TeamReturnedGood = sStock.returned;
      const stage3TeamReturnedDamaged = (teamReturns || [])
        .filter(
          (ret) =>
            ret.siteId === selectedSiteId &&
            ret.itemId === item.id &&
            ret.condition === 'Damaged / Scrap'
        )
        .reduce((s, r) => s + Number(r.quantity || 0), 0);

      // 4. Usage & Wastage at this Site
      let stage4Used = 0;
      let stage4Wastage = 0;
      (projectUsages || [])
        .filter((u) => !u.isDeleted && u.siteId === selectedSiteId)
        .forEach((u) => {
          const row = (u.items || []).find((i) => i.itemId === item.id);
          if (row) {
            stage4Used += Number(row.quantity || 0);
            stage4Wastage += Number(row.wastageQuantity || 0);
          }
        });
      stage4Wastage += stage3TeamReturnedDamaged;
      const stage4TotalConsumed = stage4Used + stage4Wastage;

      const stage3TeamInHand = Math.max(
        0,
        stage3TeamIssued - stage3TeamReturnedGood - stage4TotalConsumed
      );

      // Child sub-site consumption when viewing a Regional Site Branch
      let subSiteConsumed = 0;
      if (selectedSiteSubSites.length > 0) {
        const subIdSet = new Set(selectedSiteSubSites.map((s) => s.id));
        (projectUsages || [])
          .filter((u) => !u.isDeleted && subIdSet.has(u.siteId))
          .forEach((u) => {
            const row = (u.items || []).find((i) => i.itemId === item.id);
            if (row) {
              subSiteConsumed += Number(row.quantity || 0) + Number(row.wastageQuantity || 0);
            }
          });
      }

      const upstreamReturnedGood = (branchReturns || [])
        .filter(
          (br) =>
            !br.isDeleted &&
            (br.fromSiteId === selectedSiteId || br.siteId === selectedSiteId) &&
            br.itemId === item.id &&
            br.condition === 'Good / Restock'
        )
        .reduce((sum, br) => sum + Number(br.quantity || 0), 0);

      // 5. Balance / Returnable Stock on Project Completion (Accounting for 3-Tier Sub-Site Dispatches & BRMs)
      const clusterConsumed = stage4TotalConsumed + subSiteConsumed;
      const focConsumedAtSite =
        stage2SiteFocIssued > 0 ? Math.min(stage2SiteFocIssued, clusterConsumed) : 0;
      const stage5SiteFocReturnableBalance = Math.max(
        0,
        stage2SiteFocIssued - focConsumedAtSite - upstreamReturnedGood
      );
      const stage5TotalClientReturnableBalance = Math.max(
        0,
        stage1InitialCentralFoc - focConsumedAtSite
      );
      const normalConsumedAtSite = Math.max(0, clusterConsumed - focConsumedAtSite);
      const stage5SiteNormalBalance = Math.max(
        0,
        stage2SiteNormalIssued -
          normalConsumedAtSite -
          sStock.issuedToSubSites +
          sStock.returnedFromSubSitesGood -
          upstreamReturnedGood
      );

      const hasCentralFoc = stage2SiteFocIssued > 0;

      map.set(item.id, {
        stage1InitialCentralFoc,
        centralFocPoolRemaining,
        stage2SiteFocIssued,
        stage2SiteNormalIssued,
        stage2TotalSiteReceived,
        stage3TeamIssued,
        stage3TeamReturnedGood,
        stage3TeamReturnedDamaged,
        stage3TeamInHand,
        stage4Used,
        stage4Wastage,
        stage4TotalConsumed,
        stage5SiteFocReturnableBalance,
        stage5TotalClientReturnableBalance,
        stage5SiteNormalBalance,
        hasCentralFoc,
        primaryFocProjectId,
        primaryFocProjectName,
      });
    });

    return map;
  }, [
    selectedSiteId,
    selectedSite,
    selectedSiteSubSites,
    projects,
    activeItems,
    getSiteItemStock,
    clientFreeIssues,
    siteFocRequests,
    teamReturns,
    branchReturns,
    projectUsages,
  ]);

  // Inventory filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockScopeFilter, setStockScopeFilter] = useState<
    'allocated' | 'central-foc' | 'low-stock' | 'all'
  >('allocated');

  // History voucher filter states
  const [historySearch, setHistorySearch] = useState('');
  const [historyTeamFilter, setHistoryTeamFilter] = useState('all');
  const [selectedUsageForPrint, setSelectedUsageForPrint] = useState<ProjectMaterialUsage | null>(null);

  // Receiving state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [acceptingShipment, setAcceptingShipment] = useState<StockTransferRequest | null>(null);
  const [receivedItems, setReceivedItems] = useState<Array<{ itemId: string; receivedQty: number | '' }>>([]);
  const [receivingNotes, setReceivingNotes] = useState('');

  // Regional Branch -> Direct Issue to Sub-Site Modal State
  const [showIssueToSubSiteModal, setShowIssueToSubSiteModal] = useState(false);
  const [subSiteIssueTargetId, setSubSiteIssueTargetId] = useState('');
  const [subSiteIssueRows, setSubSiteIssueRows] = useState<Array<{ itemId: string; quantity: number | '' }>>([]);
  const [subSiteIssuePurpose, setSubSiteIssuePurpose] = useState('');
  const [subSiteIssueAutoAccept, setSubSiteIssueAutoAccept] = useState(true);
  const [subSiteIssueError, setSubSiteIssueError] = useState('');

  const handleOpenIssueToSubSiteModal = () => {
    if (!selectedSite || selectedSiteSubSites.length === 0) return;
    setSubSiteIssueTargetId(selectedSiteSubSites[0].id);
    const firstAvail =
      activeItems.find((i) => getSiteItemStock(selectedSite.id, i.id).availableBalance > 0) || activeItems[0];
    setSubSiteIssueRows(firstAvail ? [{ itemId: firstAvail.id, quantity: 1 }] : []);
    setSubSiteIssuePurpose('');
    setSubSiteIssueAutoAccept(true);
    setSubSiteIssueError('');
    setShowIssueToSubSiteModal(true);
  };

  const handleSubmitIssueToSubSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) return;
    setSubSiteIssueError('');
    try {
      const normalizedRows = subSiteIssueRows.map((r) => ({
        itemId: r.itemId,
        quantity: Number(r.quantity || 0),
      }));
      if (normalizedRows.some((r) => !r.itemId || r.quantity <= 0)) {
        setSubSiteIssueError('Please enter a valid quantity greater than zero for every item.');
        return;
      }
      const req = issueStockToSubSite({
        sourceSiteId: selectedSite.id,
        subSiteId: subSiteIssueTargetId,
        items: normalizedRows,
        purpose: subSiteIssuePurpose,
        autoAccept: subSiteIssueAutoAccept,
      });
      const destSub = selectedSiteSubSites.find((s) => s.id === subSiteIssueTargetId);
      setShowIssueToSubSiteModal(false);
      setToastMessage(
        `Issued ${req.requestNoteNumber} from ${selectedSite.name} to Sub-Site ${destSub?.name || ''} (${req.status}).`
      );
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      setSubSiteIssueError(err?.message || 'Could not issue stock to Sub-Site.');
    }
  };

  // Damaged Return Quarantine State & Upstream Return Modal (Sub-Site -> Parent Regional, or Regional -> Central HQ)
  const [damagedSearchQuery, setDamagedSearchQuery] = useState('');
  const [selectedDamagedItemIds, setSelectedDamagedItemIds] = useState<string[]>([]);
  const [showDamagedReturnModal, setShowDamagedReturnModal] = useState(false);
  const [damagedReturnRows, setDamagedReturnRows] = useState<
    Array<{ itemId: string; quantity: number | ''; maxAvailable: number }>
  >([]);
  const [damagedReturnReason, setDamagedReturnReason] = useState('');
  const [damagedReturnError, setDamagedReturnError] = useState('');
  const [selectedBranchReturnForPrint, setSelectedBranchReturnForPrint] = useState<BranchReturn | null>(null);

  React.useEffect(() => {
    setSelectedDamagedItemIds([]);
    setShowDamagedReturnModal(false);
    setDamagedReturnError('');
  }, [selectedSiteId]);

  const isSelectedSiteSub = Boolean(selectedSite && isSubSite(selectedSite));
  const mainWarehouseSiteObj =
    activeSites.find((s) => s.isMainWarehouse) || sites.find((s) => s.isMainWarehouse);
  const damagedReturnDestSiteId = isSelectedSiteSub
    ? selectedSiteParent?.id || selectedSite?.parentSiteId
    : mainWarehouseSiteObj?.id;
  const damagedReturnDestName = isSelectedSiteSub
    ? selectedSiteParent?.name || selectedSite?.parentSiteName || 'Parent Regional Branch'
    : mainWarehouseSiteObj?.name || 'Main Central Warehouse';

  const siteDamagedCatalog = useMemo(() => {
    if (!selectedSiteId) return [];
    return activeItems
      .map((item) => {
        const dStats = getSiteDamagedStock(selectedSiteId, item.id);
        return {
          item,
          ...dStats,
        };
      })
      .filter((row) => row.hasActivity);
  }, [selectedSiteId, activeItems, getSiteDamagedStock]);

  const filteredSiteDamagedCatalog = useMemo(() => {
    const q = damagedSearchQuery.trim().toLowerCase();
    if (!q) return siteDamagedCatalog;
    return siteDamagedCatalog.filter(
      (row) =>
        row.item.itemCode.toLowerCase().includes(q) ||
        row.item.itemName.toLowerCase().includes(q) ||
        row.item.category.toLowerCase().includes(q)
    );
  }, [siteDamagedCatalog, damagedSearchQuery]);

  const siteDamagedUnitsBalanceTotal = useMemo(
    () => siteDamagedCatalog.reduce((sum, r) => sum + r.availableDamagedBalance, 0),
    [siteDamagedCatalog]
  );
  const siteDamagedInboundTotal = useMemo(
    () => siteDamagedCatalog.reduce((sum, r) => sum + r.totalDamagedInbound, 0),
    [siteDamagedCatalog]
  );
  const siteDamagedSentUpstreamTotal = useMemo(
    () => siteDamagedCatalog.reduce((sum, r) => sum + r.damagedReturnedUpstream, 0),
    [siteDamagedCatalog]
  );

  const siteDamagedInboundRecords = useMemo(() => {
    if (!selectedSiteId) return [];
    const teamDamageList = (teamReturns || [])
      .filter((ret) => ret.siteId === selectedSiteId && ret.condition === 'Damaged / Scrap')
      .map((ret) => {
        const teamObj = teams.find((t) => t.id === ret.teamId);
        const itmObj = items.find((i) => i.id === ret.itemId);
        return {
          id: `tr-${ret.id}`,
          sourceType: 'team' as const,
          sourceLabel: `Field Team · ${teamObj?.teamName || 'Team'}`,
          voucherNumber: ret.returnVoucherNumber,
          date: ret.returnDate,
          itemId: ret.itemId,
          itemCode: itmObj?.itemCode || 'ITEM',
          itemName: itmObj?.itemName || 'Material Item',
          unit: itmObj?.unit || 'units',
          quantity: ret.quantity,
          reason: ret.reason || 'Damaged / scrap returned by team',
          actor: ret.returnedBy,
        };
      });

    const subSiteDamageList = (branchReturns || [])
      .filter(
        (br) =>
          !br.isDeleted &&
          br.toSiteId === selectedSiteId &&
          br.condition === 'Damaged / Scrap'
      )
      .map((br) => {
        const itmObj = items.find((i) => i.id === br.itemId);
        return {
          id: `br-in-${br.id}`,
          sourceType: 'subsite' as const,
          sourceLabel: `Sub-Site · ${br.fromSiteName || br.siteName}`,
          voucherNumber: br.branchReturnNumber,
          date: br.returnDate,
          itemId: br.itemId,
          itemCode: itmObj?.itemCode || 'ITEM',
          itemName: itmObj?.itemName || 'Material Item',
          unit: itmObj?.unit || 'units',
          quantity: br.quantity,
          reason: br.reason || 'Damaged return from Sub-Site',
          actor: br.returnedBy,
        };
      });

    return [...teamDamageList, ...subSiteDamageList].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [selectedSiteId, teamReturns, branchReturns, teams, items]);

  const siteDamagedOutboundRecords = useMemo(() => {
    if (!selectedSiteId) return [];
    return (branchReturns || [])
      .filter(
        (br) =>
          !br.isDeleted &&
          (br.fromSiteId === selectedSiteId || br.siteId === selectedSiteId) &&
          br.condition === 'Damaged / Scrap'
      )
      .sort((a, b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime());
  }, [selectedSiteId, branchReturns]);

  const handleOpenDamagedReturnModal = (targetItemIds?: string[]) => {
    const eligibleRows = siteDamagedCatalog.filter((r) => r.availableDamagedBalance > 0);
    if (eligibleRows.length === 0) return;

    const chosenIds =
      targetItemIds && targetItemIds.length > 0
        ? targetItemIds
        : selectedDamagedItemIds.length > 0
        ? selectedDamagedItemIds
        : eligibleRows.map((r) => r.item.id);

    const rows = eligibleRows
      .filter((r) => chosenIds.includes(r.item.id))
      .map((r) => ({
        itemId: r.item.id,
        quantity: r.availableDamagedBalance,
        maxAvailable: r.availableDamagedBalance,
      }));

    if (rows.length === 0) return;
    setDamagedReturnRows(rows);
    setDamagedReturnReason(
      `Damaged / scrap items returned upstream from ${selectedSite?.name || 'Site'} to ${damagedReturnDestName}.`
    );
    setDamagedReturnError('');
    setShowDamagedReturnModal(true);
  };

  const handleSubmitDamagedUpstreamReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) return;
    setDamagedReturnError('');

    const validRows = damagedReturnRows.filter((r) => r.itemId && Number(r.quantity) > 0);
    if (validRows.length === 0) {
      setDamagedReturnError('Please enter at least one damaged return quantity greater than 0.');
      return;
    }

    for (const r of validRows) {
      const qty = Number(r.quantity);
      const itm = items.find((i) => i.id === r.itemId);
      if (qty > r.maxAvailable) {
        setDamagedReturnError(
          `Return quantity (${qty}) for "${itm?.itemName || r.itemId}" exceeds site damaged balance (${r.maxAvailable} ${itm?.unit || 'units'}).`
        );
        return;
      }
    }

    try {
      const created = returnMultipleStockFromBranchToMain({
        siteId: selectedSite.id,
        siteName: selectedSite.name,
        fromSiteId: selectedSite.id,
        fromSiteName: selectedSite.name,
        toSiteId: damagedReturnDestSiteId,
        toSiteName: damagedReturnDestName,
        reason:
          damagedReturnReason.trim() ||
          `Damaged / scrap stock returned upstream to ${damagedReturnDestName}.`,
        items: validRows.map((r) => ({
          itemId: r.itemId,
          quantity: Number(r.quantity),
          condition: 'Damaged / Scrap',
        })),
      });

      setShowDamagedReturnModal(false);
      setSelectedDamagedItemIds([]);
      if (created.length > 0) {
        setSelectedBranchReturnForPrint(created[0]);
        setToastMessage(
          `Damaged Return Voucher ${created[0].branchReturnNumber} created! Returned ${created.length} damaged item(s) to ${damagedReturnDestName}.`
        );
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (err: any) {
      setDamagedReturnError(
        err?.message || `Failed to dispatch damaged return to ${damagedReturnDestName}.`
      );
    }
  };

  // Incoming shipments for selected site branch in transit
  const incomingShipments = stockRequests.filter(
    (req) => req.siteId === selectedSiteId && req.status === 'Approved / In-Transit'
  );

  // Site-Specific Material Usage Vouchers History
  const siteUsages = useMemo(() => {
    if (!selectedSiteId) return [];
    return (projectUsages || []).filter((pu) => pu.siteId === selectedSiteId && !pu.isDeleted);
  }, [selectedSiteId, projectUsages]);

  // Filtered Site Usage Vouchers
  const filteredSiteUsages = useMemo(() => {
    return siteUsages.filter((pu) => {
      if (historyTeamFilter !== 'all' && pu.teamId !== historyTeamFilter) return false;
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const matchVoucher = pu.usageVoucherNumber.toLowerCase().includes(q);
        const matchProject = pu.projectName.toLowerCase().includes(q);
        const matchCustomer = (pu.customerName || '').toLowerCase().includes(q);
        const matchSite = (pu.siteIdentifier || '').toLowerCase().includes(q);
        const matchPhone = (pu.customerPhone || '').toLowerCase().includes(q);
        const matchTeam = (pu.teamName || '').toLowerCase().includes(q);
        const matchSupervisor = (pu.supervisorOrLeaderName || pu.supervisorOrLeader || '').toLowerCase().includes(q);
        const matchWork = (pu.workDetails || '').toLowerCase().includes(q);
        return (
          matchVoucher ||
          matchProject ||
          matchCustomer ||
          matchSite ||
          matchPhone ||
          matchTeam ||
          matchSupervisor ||
          matchWork
        );
      }
      return true;
    });
  }, [siteUsages, historyTeamFilter, historySearch]);

  // Calculate Site History KPI Stats
  const siteTotalVouchersCount = siteUsages.length;
  const siteTotalItemsConsumedCount = useMemo(() => {
    return siteUsages.reduce((acc, pu) => {
      return acc + pu.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    }, 0);
  }, [siteUsages]);

  const siteActiveTeamsCount = useMemo(() => {
    const set = new Set(siteUsages.map((pu) => pu.teamId));
    return set.size;
  }, [siteUsages]);

  // Teams active at this site
  const siteActiveTeamsList = useMemo(() => {
    return (teams || []).filter((t) => t.assignedSiteId === selectedSiteId && !t.isDeleted);
  }, [teams, selectedSiteId]);

  const handleDirectReceive = (req: StockTransferRequest) => {
    const fullItems = req.items.map((r) => ({
      itemId: r.itemId,
      receivedQty: r.approvedQty ?? r.requestedQty,
    }));
    acceptStockRequest(req.id, fullItems, 'Direct received into site yard.');
    setToastMessage(`Shipment ${req.requestNoteNumber} received! Site inventory updated.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenEditReceive = (req: StockTransferRequest) => {
    setAcceptingShipment(req);
    setReceivedItems(
      req.items.map((r) => ({
        itemId: r.itemId,
        receivedQty: r.receivedQty ?? (r.approvedQty ?? r.requestedQty),
      }))
    );
    setReceivingNotes('');
  };

  const handleConfirmEditReceive = () => {
    if (!acceptingShipment) return;
    const normalizedReceived = receivedItems.map((r) => ({
      itemId: r.itemId,
      receivedQty: Math.max(0, Number(r.receivedQty || 0)),
    }));
    acceptStockRequest(
      acceptingShipment.id,
      normalizedReceived,
      receivingNotes.trim() || 'Verified and counted shipment at site yard.'
    );
    setToastMessage(`Shipment ${acceptingShipment.requestNoteNumber} received and updated.`);
    setAcceptingShipment(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const categories = Array.from(new Set(activeItems.map((i) => i.category)));

  // Count items with activity or balance at this site
  const siteAllocatedCount = useMemo(() => {
    if (!selectedSiteId) return 0;
    return activeItems.filter((i) => {
      const s = getSiteItemStock(selectedSiteId, i.id);
      const rec = siteItemReconciliationMap.get(i.id);
      return s.hasActivity || s.availableBalance > 0 || Boolean(rec?.hasCentralFoc);
    }).length;
  }, [selectedSiteId, activeItems, getSiteItemStock, siteItemReconciliationMap]);

  const siteCentralFocItemsCount = useMemo(() => {
    if (!selectedSiteId) return 0;
    return activeItems.filter((i) => siteItemReconciliationMap.get(i.id)?.hasCentralFoc).length;
  }, [selectedSiteId, activeItems, siteItemReconciliationMap]);

  const siteLowStockCount = useMemo(() => {
    if (!selectedSiteId) return 0;
    return activeItems.filter((i) => {
      const s = getSiteItemStock(selectedSiteId, i.id);
      return s.isLowStock;
    }).length;
  }, [selectedSiteId, activeItems, getSiteItemStock]);

  const filteredItems = activeItems.filter((item) => {
    const matchesSearch =
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    if (!matchesSearch || !matchesCategory) return false;

    const stock = getSiteItemStock(selectedSiteId, item.id);
    const rec = siteItemReconciliationMap.get(item.id);
    if (
      stockScopeFilter === 'allocated' &&
      !stock.hasActivity &&
      stock.availableBalance <= 0 &&
      !rec?.hasCentralFoc
    ) {
      return false;
    }
    if (stockScopeFilter === 'central-foc' && !rec?.hasCentralFoc) {
      return false;
    }
    if (stockScopeFilter === 'low-stock' && !stock.isLowStock) {
      return false;
    }

    return true;
  });

  const siteFocItemsList = useMemo(
    () => activeItems.filter((i) => siteItemReconciliationMap.get(i.id)?.hasCentralFoc),
    [activeItems, siteItemReconciliationMap]
  );

  const exportSiteInventoryCsv = () => {
    if (!selectedSite) return;
    const rows = filteredItems.map((item) => {
      const stock = getSiteItemStock(selectedSite.id, item.id);
      const rec = siteItemReconciliationMap.get(item.id);
      return {
        'Site Name': selectedSite.name,
        'Site Tier': isSubSite(selectedSite) ? 'Sub-Site Branch' : 'Regional Site Branch',
        'Parent Regional Branch': selectedSiteParent?.name || selectedSite.parentSiteName || 'Main Central Warehouse',
        Supervisor: selectedSite.supervisorName,
        'Item Code': item.itemCode,
        'Item Name': item.itemName,
        'Stock Source': rec?.hasCentralFoc ? 'Central FOC + Site Stock' : isSubSite(selectedSite) ? 'Parent Branch Stock' : 'Normal HQ Stock',
        Category: item.category,
        Unit: item.unit,
        '1. Initial Central FOC Receipt': rec?.stage1InitialCentralFoc || 0,
        '2a. Site Issue (Central FOC)': stock.focReceived,
        '2b. Site Issue (Normal / Parent)': stock.normalReceived,
        '2c. Total Site Received': stock.received,
        '3. Team Issue (Field Teams)': stock.issued,
        'Team Returned (Restocked)': stock.returned,
        'Sub-Site Issued': stock.issuedToSubSites,
        'Sub-Site Returned (Good)': stock.returnedFromSubSitesGood,
        '4a. Field Usage (Installed)': rec?.stage4Used || 0,
        '4b. Field Wastage': rec?.stage4Wastage || 0,
        '5a. Site FOC Returnable Balance': rec?.stage5SiteFocReturnableBalance || 0,
        '5b. Total Client Returnable (Site + Central)': rec?.stage5TotalClientReturnableBalance || 0,
        'Available Physical Site Yard Stock': stock.availableBalance,
        'Min Threshold': stock.threshold,
        'Low Stock Status': stock.isLowStock ? 'LOW STOCK' : 'Adequate',
      };
    });
    exportToCsv(`${selectedSite.name.replace(/\s+/g, '_')}_Inventory_Reconciliation`, rows);
  };

  const exportSiteUsageHistoryCsv = () => {
    if (!selectedSite) return;
    const rows: any[] = [];
    filteredSiteUsages.forEach((pu) => {
      pu.items.forEach((row) => {
        const itm = items.find((i) => i.id === row.itemId);
        rows.push({
          'Site Name': selectedSite.name,
          'Voucher No': pu.usageVoucherNumber,
          Date: formatDateTime(pickBestTimestamp(pu.date, pu.createdAt, pu.usageDate)),
          'Project Name': pu.projectName,
          'Customer Name': pu.customerName || '',
          'Customer Phone': pu.customerPhone || '',
          'Site ID / Ref': pu.siteIdentifier || '',
          'Project Section': pu.projectTypeName || '',
          'Executing Team': pu.teamName || '',
          'Supervisor / Lead': pu.supervisorOrLeaderName || pu.supervisorOrLeader || '',
          'Work Scope': pu.workDetails || '',
          'Item Code': itm?.itemCode || '',
          'Item Name': itm?.itemName || '',
          Category: itm?.category || '',
          'Quantity Used': row.quantity,
          Unit: itm?.unit || '',
          'Logged By': pu.loggedBy,
        });
      });
    });
    exportToCsv(`${selectedSite.name.replace(/\s+/g, '_')}_Material_Usage_History`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold tracking-wider uppercase">
              <span>Branch Custody &amp; Standard 5-Stage Reconciliation</span>
              <span aria-hidden="true" className="text-emerald-400/50">·</span>
              <span className="text-indigo-200">Central FOC Clearly Identified</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Site Branch Stock &amp; Material Reconciliation
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Standard reconciliation sequence across site branches:{' '}
              <strong>
                1. FOC Central Stock Receipt → 2. Site Issue → 3. Team Issue → 4. Usage &amp; Wastage → 5. Balance / Returnable Stock on Completion
              </strong>{' '}
              with distinct <strong>Central FOC</strong> visual identification.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {activeSection === 'inventory' ? (
              <button
                onClick={exportSiteInventoryCsv}
                className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-slate-900 border border-white/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export Site Inventory (CSV)</span>
              </button>
            ) : (
              <button
                onClick={exportSiteUsageHistoryCsv}
                className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-slate-900 border border-white/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export Site Usage Vouchers (CSV)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SELECT SITE Panel (Regional Site -> Matched Sub-Site 1 -> Downward Arrows for Additional Sub-Sites) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center shadow-2xs shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase text-slate-900">
                SELECT SITE
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Regional sites &amp; color-matched linked sub-sites arranged in operational order
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold tabular-nums">
            {branchSites.length} Active Branch{branchSites.length === 1 ? '' : 'es'}
          </span>
        </div>

        {(() => {
          const CLUSTER_PALETTES = [
            {
              clusterWrap:
                'bg-gradient-to-r from-emerald-50/90 via-emerald-50/45 to-teal-50/35 border-emerald-200/90',
              arrow: 'text-emerald-500',
              regIdle: 'bg-white text-emerald-950 border-emerald-300 hover:bg-emerald-50',
              regActive:
                'bg-emerald-700 text-white border-emerald-800 shadow-sm ring-2 ring-emerald-500/30',
              regIconIdle: 'text-emerald-600',
              regBadgeIdle: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              regBadgeActive: 'bg-emerald-600 text-white border-emerald-500',
              subIdle:
                'bg-gradient-to-r from-emerald-100/65 to-emerald-50/40 text-emerald-950 border-emerald-200 hover:from-emerald-100 hover:to-emerald-50/80',
              subActive:
                'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-500/25',
              subIconIdle: 'text-emerald-600',
              subBadgeIdle: 'bg-white/85 text-emerald-800 border-emerald-200',
              subBadgeActive: 'bg-emerald-500 text-white border-emerald-400',
            },
            {
              clusterWrap:
                'bg-gradient-to-r from-indigo-50/90 via-indigo-50/45 to-blue-50/35 border-indigo-200/90',
              arrow: 'text-indigo-500',
              regIdle: 'bg-white text-indigo-950 border-indigo-300 hover:bg-indigo-50',
              regActive:
                'bg-indigo-700 text-white border-indigo-800 shadow-sm ring-2 ring-indigo-500/30',
              regIconIdle: 'text-indigo-600',
              regBadgeIdle: 'bg-indigo-100 text-indigo-800 border-indigo-200',
              regBadgeActive: 'bg-indigo-600 text-white border-indigo-500',
              subIdle:
                'bg-gradient-to-r from-indigo-100/65 to-indigo-50/40 text-indigo-950 border-indigo-200 hover:from-indigo-100 hover:to-indigo-50/80',
              subActive:
                'bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-500/25',
              subIconIdle: 'text-indigo-600',
              subBadgeIdle: 'bg-white/85 text-indigo-800 border-indigo-200',
              subBadgeActive: 'bg-indigo-500 text-white border-indigo-400',
            },
            {
              clusterWrap:
                'bg-gradient-to-r from-violet-50/90 via-violet-50/45 to-purple-50/35 border-violet-200/90',
              arrow: 'text-violet-500',
              regIdle: 'bg-white text-violet-950 border-violet-300 hover:bg-violet-50',
              regActive:
                'bg-violet-700 text-white border-violet-800 shadow-sm ring-2 ring-violet-500/30',
              regIconIdle: 'text-violet-600',
              regBadgeIdle: 'bg-violet-100 text-violet-800 border-violet-200',
              regBadgeActive: 'bg-violet-600 text-white border-violet-500',
              subIdle:
                'bg-gradient-to-r from-violet-100/65 to-violet-50/40 text-violet-950 border-violet-200 hover:from-violet-100 hover:to-violet-50/80',
              subActive:
                'bg-violet-600 text-white border-violet-700 shadow-sm ring-2 ring-violet-500/25',
              subIconIdle: 'text-violet-600',
              subBadgeIdle: 'bg-white/85 text-violet-800 border-violet-200',
              subBadgeActive: 'bg-violet-500 text-white border-violet-400',
            },
            {
              clusterWrap:
                'bg-gradient-to-r from-amber-50/90 via-amber-50/45 to-orange-50/35 border-amber-200/90',
              arrow: 'text-amber-500',
              regIdle: 'bg-white text-amber-950 border-amber-300 hover:bg-amber-50',
              regActive:
                'bg-amber-700 text-white border-amber-800 shadow-sm ring-2 ring-amber-500/30',
              regIconIdle: 'text-amber-600',
              regBadgeIdle: 'bg-amber-100 text-amber-900 border-amber-200',
              regBadgeActive: 'bg-amber-600 text-white border-amber-500',
              subIdle:
                'bg-gradient-to-r from-amber-100/65 to-amber-50/40 text-amber-950 border-amber-200 hover:from-amber-100 hover:to-amber-50/80',
              subActive:
                'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-500/25',
              subIconIdle: 'text-amber-600',
              subBadgeIdle: 'bg-white/85 text-amber-900 border-amber-200',
              subBadgeActive: 'bg-amber-500 text-white border-amber-400',
            },
            {
              clusterWrap:
                'bg-gradient-to-r from-sky-50/90 via-sky-50/45 to-cyan-50/35 border-sky-200/90',
              arrow: 'text-sky-500',
              regIdle: 'bg-white text-sky-950 border-sky-300 hover:bg-sky-50',
              regActive:
                'bg-sky-700 text-white border-sky-800 shadow-sm ring-2 ring-sky-500/30',
              regIconIdle: 'text-sky-600',
              regBadgeIdle: 'bg-sky-100 text-sky-900 border-sky-200',
              regBadgeActive: 'bg-sky-600 text-white border-sky-500',
              subIdle:
                'bg-gradient-to-r from-sky-100/65 to-sky-50/40 text-sky-950 border-sky-200 hover:from-sky-100 hover:to-sky-50/80',
              subActive:
                'bg-sky-600 text-white border-sky-700 shadow-sm ring-2 ring-sky-500/25',
              subIconIdle: 'text-sky-600',
              subBadgeIdle: 'bg-white/85 text-sky-900 border-sky-200',
              subBadgeActive: 'bg-sky-500 text-white border-sky-400',
            },
            {
              clusterWrap:
                'bg-gradient-to-r from-rose-50/90 via-rose-50/45 to-pink-50/35 border-rose-200/90',
              arrow: 'text-rose-500',
              regIdle: 'bg-white text-rose-950 border-rose-300 hover:bg-rose-50',
              regActive:
                'bg-rose-700 text-white border-rose-800 shadow-sm ring-2 ring-rose-500/30',
              regIconIdle: 'text-rose-600',
              regBadgeIdle: 'bg-rose-100 text-rose-900 border-rose-200',
              regBadgeActive: 'bg-rose-600 text-white border-rose-500',
              subIdle:
                'bg-gradient-to-r from-rose-100/65 to-rose-50/40 text-rose-950 border-rose-200 hover:from-rose-100 hover:to-rose-50/80',
              subActive:
                'bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-500/25',
              subIconIdle: 'text-rose-600',
              subBadgeIdle: 'bg-white/85 text-rose-900 border-rose-200',
              subBadgeActive: 'bg-rose-500 text-white border-rose-400',
            },
          ];

          const topRegionalBranches = branchSites.filter((s) => !isSubSite(s));
          const topRegionalIds = new Set(topRegionalBranches.map((s) => s.id));
          const orphanSubSites = branchSites.filter(
            (s) => isSubSite(s) && (!s.parentSiteId || !topRegionalIds.has(s.parentSiteId))
          );

          return (
            <div className="flex flex-wrap items-start gap-3">
              {topRegionalBranches.map((reg, regIdx) => {
                const palette = CLUSTER_PALETTES[regIdx % CLUSTER_PALETTES.length];
                const childSubs = branchSites.filter(
                  (s) => isSubSite(s) && s.parentSiteId === reg.id
                );
                const isRegSelected = selectedSiteId === reg.id;

                return (
                  <div
                    key={reg.id}
                    className={`rounded-2xl border p-2.5 transition-all ${palette.clusterWrap} ${
                      childSubs.length > 0 ? 'flex flex-col sm:flex-row items-start gap-2' : 'inline-flex items-start'
                    }`}
                  >
                    {/* Regional Site Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedSiteId(reg.id)}
                      className={`px-3.5 py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                        isRegSelected ? palette.regActive : palette.regIdle
                      }`}
                    >
                      <Building2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isRegSelected ? 'text-white' : palette.regIconIdle
                        }`}
                      />
                      <span className="whitespace-nowrap">{reg.name}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase border ${
                          isRegSelected ? palette.regBadgeActive : palette.regBadgeIdle
                        }`}
                      >
                        {reg.isMainWarehouse ? 'HQ' : 'Regional'}
                      </span>
                    </button>

                    {/* Linked Sub-Sites: First Sub-Site directly in front of Regional Site via horizontal arrow, additional Sub-Sites stacked downward via vertical arrows */}
                    {childSubs.length > 0 && (
                      <div className="flex items-start gap-2 pl-2 sm:pl-0">
                        {/* Arrow connecting Regional Site -> First Sub-Site */}
                        <div
                          className={`flex items-center gap-1 pt-2.5 shrink-0 ${palette.arrow}`}
                          aria-hidden="true"
                          title={`Sub-sites under ${reg.name}`}
                        >
                          <span className="hidden sm:inline-block w-3 h-0.5 bg-current rounded-full opacity-75" />
                          <ArrowRight className="w-4 h-4 shrink-0" />
                        </div>

                        {/* Vertical Stack of Matched Sub-Sites */}
                        <div className="flex flex-col items-stretch">
                          {childSubs.map((sub, subIdx) => {
                            const isSubSelected = selectedSiteId === sub.id;
                            return (
                              <React.Fragment key={sub.id}>
                                {subIdx > 0 && (
                                  <div
                                    className={`flex items-center justify-center py-0.5 ${palette.arrow}`}
                                    aria-hidden="true"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5 shrink-0" />
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setSelectedSiteId(sub.id)}
                                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                    isSubSelected ? palette.subActive : palette.subIdle
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Building2
                                      className={`w-3.5 h-3.5 shrink-0 ${
                                        isSubSelected ? 'text-white' : palette.subIconIdle
                                      }`}
                                    />
                                    <span className="truncate whitespace-nowrap">{sub.name}</span>
                                  </div>
                                  <span
                                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase border shrink-0 ${
                                      isSubSelected ? palette.subBadgeActive : palette.subBadgeIdle
                                    }`}
                                  >
                                    Sub {subIdx + 1}
                                  </span>
                                </button>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Fallback for any sub-sites whose parent branch is hidden/filtered by site permissions */}
              {orphanSubSites.map((sub) => {
                const subParent = getParentSite(sub, activeSites);
                const isSubSelected = selectedSiteId === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSiteId(sub.id)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                      isSubSelected
                        ? 'bg-sky-700 text-white border-sky-800 shadow-xs ring-2 ring-sky-600/25'
                        : 'bg-sky-50/75 text-sky-900 border-sky-200 hover:bg-sky-100/80'
                    }`}
                  >
                    <Building2 className={`w-3.5 h-3.5 ${isSubSelected ? 'text-white' : 'text-sky-600'}`} />
                    <span>↳ {sub.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        isSubSelected
                          ? 'bg-sky-600 text-white'
                          : 'bg-sky-100 text-sky-800 border border-sky-300'
                      }`}
                    >
                      Sub ({subParent?.name || sub.parentSiteName || 'Parent'})
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* View Section Tabs (Live Stock vs FOC Reconciliation vs Damaged Returns vs Usage History) */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Site Operations View
          </span>
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveSection('inventory')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSection === 'inventory'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Boxes className="w-4 h-4 text-emerald-600" />
              <span>Live Yard Stock</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('foc-materials')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSection === 'foc-materials'
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'text-indigo-800 hover:bg-indigo-50'
              }`}
            >
              <span>🎁</span>
              <span>Central FOC Materials ({siteCentralFocItemsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('damaged-returns')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSection === 'damaged-returns'
                  ? 'bg-amber-600 text-white shadow-2xs font-bold'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 ${activeSection === 'damaged-returns' ? 'text-white' : 'text-amber-600'}`} />
              <span>Damaged Returns ({siteDamagedUnitsBalanceTotal})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('history')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSection === 'history'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Site Material Usage Vouchers ({siteTotalVouchersCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-800 text-white px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-200 hover:text-white">✕</button>
        </div>
      )}

      {/* Selected Site Details Banner */}
      {selectedSite && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700 shadow-2xs">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{selectedSite.name}</span>
              {isSubSite(selectedSite) ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-100 text-sky-900 border border-sky-300 uppercase">
                  Sub-Site Branch • Supplied by: {selectedSiteParent?.name || selectedSite.parentSiteName || 'Parent Branch'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase">
                  Regional Site Branch
                </span>
              )}
              {selectedSiteSubSites.length > 0 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {selectedSiteSubSites.length} Sub-Site(s) Under This Branch
                </span>
              )}
            </div>
            <div className="mt-1 text-slate-600">
              Location: {selectedSite.location} · Supervisor: <strong className="text-slate-800">{selectedSite.supervisorName}</strong>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedSiteSubSites.length > 0 && (
              <button
                type="button"
                onClick={handleOpenIssueToSubSiteModal}
                className="px-3.5 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Issue Stock to Sub-Site ({selectedSiteSubSites.length})</span>
              </button>
            )}
            {siteCentralFocItemsCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold">
                <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-extrabold uppercase">
                  Central FOC
                </span>
                <span>{siteCentralFocItemsCount} FOC Item(s) Active at Site</span>
              </div>
            )}
            <div className="text-slate-600">
              Active Field Teams: <strong className="text-slate-900 font-mono">{siteActiveTeamsList.length}</strong>
            </div>
            <div className="font-mono text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
              Tel: {selectedSite.contactNumber}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: LIVE YARD STOCK */}
      {activeSection === 'inventory' && (
        <div className="space-y-6">
          {/* Incoming Approved Shipments in Transit for this site */}
          {incomingShipments.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Incoming Approved Shipments ({incomingShipments.length} in transit)
                    </h3>
                    <p className="text-xs text-slate-600">
                      Shipments approved and dispatched to <strong>{selectedSite?.name}</strong>. Verify physical items and click &quot;Receive Stock&quot; to update this site yard ledger.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-xs font-bold border border-blue-300">
                  Ready to Receive
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {incomingShipments.map((req) => {
                  const isFocShipment = req.requestCategory === 'foc' || Boolean(req.focProjectId);
                  return (
                    <div
                      key={req.id}
                      className={`bg-white border rounded-lg p-3.5 shadow-xs flex flex-col justify-between space-y-3 ${
                        isFocShipment ? 'border-indigo-300 ring-1 ring-indigo-500/20' : 'border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between flex-wrap gap-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {req.requestNoteNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                              From: {req.sourceSiteName || 'Main Warehouse'}
                            </span>
                            {isFocShipment && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-600 text-white uppercase">
                                Central FOC
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {formatDateTime(req.approvalDate || req.requestedDate)}
                          </span>
                        </div>

                        <div className="mt-2 space-y-1">
                          <div className="text-xs font-semibold text-slate-700">Dispatched Materials:</div>
                          <div className="space-y-1 bg-slate-50 p-2 rounded border border-slate-100">
                            {req.items.map((row) => {
                              const itm = items.find((i) => i.id === row.itemId);
                              const apprv = row.approvedQty ?? row.requestedQty;
                              return (
                                <div key={row.itemId} className="flex items-center justify-between text-xs text-slate-800">
                                  <span className="truncate max-w-[200px]" title={itm?.itemName}>
                                    <strong className="font-mono">{itm?.itemCode}</strong> · {itm?.itemName}
                                  </span>
                                  <span className="font-mono font-bold text-emerald-700 shrink-0 ml-2">
                                    +{apprv} {itm?.unit}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {req.approvalNotes && (
                          <div className="text-[11px] text-slate-500 italic mt-1.5 truncate" title={req.approvalNotes}>
                            Dispatch Note: &ldquo;{req.approvalNotes}&rdquo;
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleOpenEditReceive(req)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Inspect physical count and adjust received quantity if damaged"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Count / Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDirectReceive(req)}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                          title="Confirm full shipment received into site stock"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Receive into Site Yard</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter and Search Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Scope Filter Buttons */}
              <div className="inline-flex flex-wrap rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                <button
                  onClick={() => setStockScopeFilter('allocated')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    stockScopeFilter === 'allocated'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Site Allocated ({siteAllocatedCount})</span>
                </button>
                <button
                  onClick={() => setStockScopeFilter('central-foc')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    stockScopeFilter === 'central-foc'
                      ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                      : 'text-indigo-800 hover:bg-indigo-50'
                  }`}
                >
                  <span>🎁 Central FOC Only ({siteCentralFocItemsCount})</span>
                </button>
                <button
                  onClick={() => setStockScopeFilter('low-stock')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    stockScopeFilter === 'low-stock'
                      ? 'bg-rose-50 text-rose-700 shadow-2xs font-bold border border-rose-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  <span>Low Stock ({siteLowStockCount})</span>
                </button>
                <button
                  onClick={() => setStockScopeFilter('all')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    stockScopeFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Full Master Catalog ({activeItems.length})</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative w-full sm:w-80 md:w-96 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search code or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200 text-xs font-bold cursor-pointer"
                    title="Clear Search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Site Branch Stock Table (Ordered by Standard 5-Stage Reconciliation Flow with Distinct Central FOC Identification) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-visible">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  Showing <strong className="font-mono text-slate-900">{filteredItems.length}</strong> items{' '}
                  {stockScopeFilter === 'allocated' ? (
                    <span>allocated to <strong>{selectedSite?.name}</strong></span>
                  ) : stockScopeFilter === 'central-foc' ? (
                    <span>received from <strong>Central FOC Stock</strong></span>
                  ) : stockScopeFilter === 'low-stock' ? (
                    <span>with low stock warning at this site</span>
                  ) : (
                    <span>from full master catalog</span>
                  )}
                </span>
                {siteCentralFocItemsCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold text-[11px]">
                    <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[9px] font-extrabold uppercase">
                      Central FOC
                    </span>
                    Rows highlighted in indigo indicate materials supplied from Central FOC Stock
                  </span>
                )}
              </div>
              <span className="font-mono text-[11px] text-slate-500">
                {isSubSite(selectedSite)
                  ? `1. HQ → ${selectedSiteParent?.name || 'Parent'} → 2. Sub-Site Receipt → 3. Team Issue → 4. Usage & Wastage → 5. Parent BRM & Balance`
                  : selectedSiteSubSites.length > 0
                  ? '1. HQ Source → 2. Regional Receipt → 3. Sub-Sites & Teams → 4. Usage & Wastage → 5. HQ BRM & Balance'
                  : '1. Central Stock → 2. Site Issue → 3. Team Issue → 4. Usage & Wastage → 5. Balance / Returnable'}
              </span>
            </div>

            <div className="overflow-x-auto pb-2">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[10.5px] xl:text-[11px] uppercase tracking-normal leading-tight">
                  <tr>
                    <th className="py-3 pl-2.5 pr-1.5">Item &amp; Source</th>
                    <th className="py-3 px-1.5">Material Description</th>
                    <th className="py-3 px-1.5 text-right bg-indigo-50/60 text-indigo-950">
                      {siteCentralFocItemsCount > 0 ? (
                        <>1. FOC Central<br className="hidden sm:inline" /> Receipt</>
                      ) : isSubSite(selectedSite) ? (
                        <>1. Parent Hub<br className="hidden sm:inline" /> Source</>
                      ) : (
                        <>1. Central HQ<br className="hidden sm:inline" /> Source</>
                      )}
                    </th>
                    <th className="py-3 px-1.5 text-right">
                      {isSubSite(selectedSite) ? (
                        <>2. Sub-Site Rec<br className="hidden sm:inline" /> (Parent → Sub)</>
                      ) : (
                        <>2. Site Issue<br className="hidden sm:inline" /> (HQ → Site)</>
                      )}
                    </th>
                    <th className="py-3 px-1.5 text-right">
                      {selectedSiteSubSites.length > 0 ? (
                        <>3. Sub-Sites &amp;<br className="hidden sm:inline" /> Team Issue</>
                      ) : (
                        <>3. Team Issue<br className="hidden sm:inline" /> (Site → Team)</>
                      )}
                    </th>
                    <th className="py-3 px-1.5 text-right">
                      4. Usage &amp;<br className="hidden sm:inline" /> Wastage
                    </th>
                    <th className="py-3 px-2 text-right bg-emerald-50/60 text-emerald-950">
                      5. Balance /<br className="hidden sm:inline" /> Returnable
                    </th>
                    <th className="py-3 pl-1.5 pr-2.5 text-center">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 px-4 text-center">
                        <div className="max-w-md mx-auto flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="text-sm font-semibold text-slate-800">
                            {stockScopeFilter === 'allocated'
                              ? `No materials currently allocated to ${selectedSite?.name || 'this site branch'}`
                              : stockScopeFilter === 'central-foc'
                              ? `No Central FOC items allocated to ${selectedSite?.name || 'this site branch'}`
                              : stockScopeFilter === 'low-stock'
                              ? `No low stock warnings for this site branch`
                              : 'No items match your search criteria'}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 max-w-sm">
                            {stockScopeFilter === 'allocated'
                              ? 'This site has not requisitioned or received any materials from Central Warehouse yet. Items will automatically appear here once stock transfer requests are accepted.'
                              : 'Try adjusting your search query, clearing filters, or switching to view the full catalog.'}
                          </p>
                          {stockScopeFilter !== 'all' && (
                            <div className="flex items-center gap-2 mt-4">
                              <button
                                onClick={() => setStockScopeFilter('all')}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Browse Full Catalog ({activeItems.length})
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const stock = getSiteItemStock(selectedSiteId, item.id);
                      const rec = siteItemReconciliationMap.get(item.id);
                      const hasCentralFoc = Boolean(rec?.hasCentralFoc);
                      const isUnallocated = !stock.hasActivity && stock.availableBalance <= 0 && !hasCentralFoc;
                      const isExpanded = expandedSiteTraceItemId === item.id;

                      return (
                        <React.Fragment key={item.id}>
                          <tr
                            onClick={() =>
                              setExpandedSiteTraceItemId((prev) => (prev === item.id ? null : item.id))
                            }
                            className={`transition-colors cursor-pointer ${
                              isExpanded
                                ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600'
                                : hasCentralFoc
                                ? 'bg-indigo-50/45 hover:bg-indigo-100/60 border-l-4 border-l-indigo-600'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3 pl-2.5 pr-1.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  )}
                                  <span className="text-xs">{item.itemCode}</span>
                                </div>
                                {hasCentralFoc ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-sans font-extrabold bg-indigo-600 text-white shadow-2xs w-fit">
                                    🎁 Central FOC
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-sans font-semibold bg-slate-100 text-slate-600 border border-slate-200 w-fit">
                                    Normal HQ
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-1.5 text-slate-900 font-bold">
                              <div className="max-w-[150px] xl:max-w-[190px]">
                                <div className="text-xs sm:text-[12.5px] leading-snug break-words">{item.itemName}</div>
                                <div className="text-[10px] font-normal text-slate-500 mt-0.5 leading-tight">
                                  {item.category} ({item.unit})
                                </div>
                                {rec?.primaryFocProjectName && (
                                  <div
                                    className="mt-0.5 text-[10px] font-semibold text-indigo-800 truncate"
                                    title={`Project: ${rec.primaryFocProjectName}`}
                                  >
                                    Project: {rec.primaryFocProjectName}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* STAGE 1: CENTRAL STOCK RECEIPT OR PARENT REGIONAL SOURCE */}
                            <td className="py-3 px-1.5 text-right font-mono bg-indigo-50/30 whitespace-nowrap">
                              {hasCentralFoc ? (
                                <div>
                                  <div className="font-black text-indigo-900 text-xs xl:text-[13px]">
                                    {formatNumber(rec?.stage1InitialCentralFoc || 0)} {item.unit}
                                  </div>
                                  <div className="text-[10px] font-sans font-semibold text-indigo-700">
                                    HQ Pool: {formatNumber(rec?.centralFocPoolRemaining || 0)} {item.unit}
                                  </div>
                                </div>
                              ) : isSubSite(selectedSite) ? (
                                <span className="text-[11px] text-sky-800 font-sans font-semibold">
                                  {selectedSiteParent?.name || selectedSite?.parentSiteName || 'Parent Branch'}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-500 font-sans">Central HQ</span>
                              )}
                            </td>

                            {/* STAGE 2: SITE ISSUE (CENTRAL OR PARENT -> SITE) */}
                            <td className="py-3 px-1.5 text-right font-mono whitespace-nowrap">
                              <div className="font-black text-slate-900 text-xs xl:text-[13px]">
                                {formatNumber(stock.received)} {item.unit}
                              </div>
                              <div className="mt-0.5 flex flex-col items-end gap-0.5">
                                {isSubSite(selectedSite) && (
                                  <span className="text-[10px] font-sans font-semibold text-sky-700">
                                    From {selectedSiteParent?.name || selectedSite?.parentSiteName || 'Parent Branch'}
                                  </span>
                                )}
                                {stock.focReceived > 0 && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-sans font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-300">
                                    FOC: +{formatNumber(stock.focReceived)}
                                  </span>
                                )}
                                {stock.normalReceived > 0 && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-sans font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                    {isSubSite(selectedSite) ? 'Parent' : 'Normal'}: +{formatNumber(stock.normalReceived)}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* STAGE 3: TEAM ISSUE (SITE -> FIELD TEAMS) & SUB-SITE TRANSFERS */}
                            <td className="py-3 px-1.5 text-right font-mono whitespace-nowrap">
                              <div className="font-bold text-blue-800 text-xs xl:text-[13px]">
                                {formatNumber(stock.issued)} {item.unit}
                              </div>
                              {stock.returned > 0 && (
                                <div className="text-[10px] font-sans font-semibold text-emerald-700">
                                  Ret Good: +{formatNumber(stock.returned)} {item.unit}
                                </div>
                              )}
                              {(rec?.stage3TeamInHand || 0) > 0 && (
                                <div className="text-[10px] font-sans font-bold text-indigo-700">
                                  In-Hand: {formatNumber(rec?.stage3TeamInHand || 0)}
                                </div>
                              )}
                              {stock.issuedToSubSites > 0 && (
                                <div className="text-[10px] font-sans font-bold text-sky-700">
                                  Sub Iss: -{formatNumber(stock.issuedToSubSites)} {item.unit}
                                </div>
                              )}
                              {stock.returnedFromSubSitesGood > 0 && (
                                <div className="text-[10px] font-sans font-bold text-teal-700">
                                  Sub Ret: +{formatNumber(stock.returnedFromSubSitesGood)} {item.unit}
                                </div>
                              )}
                            </td>

                            {/* STAGE 4: USAGE & WASTAGE */}
                            <td className="py-3 px-1.5 text-right font-mono whitespace-nowrap">
                              <div className="font-bold text-slate-900 text-xs xl:text-[13px]">
                                {formatNumber(rec?.stage4TotalConsumed || 0)} {item.unit}
                              </div>
                              <div className="text-[10px] font-sans">
                                <span className="text-teal-700 font-semibold">
                                  Used: {formatNumber(rec?.stage4Used || 0)}
                                </span>
                                {(rec?.stage4Wastage || 0) > 0 && (
                                  <span className="text-rose-600 font-semibold ml-1">
                                    • Waste: {formatNumber(rec?.stage4Wastage || 0)}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* STAGE 5: BALANCE / RETURNABLE STOCK ON COMPLETION */}
                            <td className="py-3 px-2 text-right whitespace-nowrap bg-emerald-50/20">
                              <div className="flex flex-col items-end gap-0.5">
                                {stock.focReceived > 0 && (
                                  <div className="text-right">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-indigo-600 text-white shadow-2xs">
                                      FOC Ret: {formatNumber(rec?.stage5SiteFocReturnableBalance || 0)} {item.unit}
                                    </span>
                                    {(rec?.centralFocPoolRemaining || 0) > 0 && (
                                      <div className="text-[9.5px] font-semibold text-emerald-800 mt-0.5">
                                        Client Ret: {formatNumber(rec?.stage5TotalClientReturnableBalance || 0)} {item.unit}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {stock.normalReceived > 0 && stock.focReceived > 0 && (
                                  <div className="text-[9.5px] font-mono text-slate-600">
                                    Normal Bal: <strong>{formatNumber(rec?.stage5SiteNormalBalance || 0)} {item.unit}</strong>
                                  </div>
                                )}
                                <StockBalanceCell
                                  balance={stock.availableBalance}
                                  threshold={stock.threshold}
                                  unit={item.unit}
                                  unallocated={isUnallocated}
                                  isLow={stock.isLowStock}
                                />
                              </div>
                            </td>

                            <td
                              className="py-3 pl-1.5 pr-2.5 text-center whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedSiteTraceItemId((prev) => (prev === item.id ? null : item.id))
                                }
                                className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold border shadow-2xs transition-all cursor-pointer active:scale-95 ${
                                  isExpanded
                                    ? 'bg-emerald-700 text-white border-emerald-800'
                                    : hasCentralFoc
                                    ? 'bg-indigo-700 hover:bg-indigo-600 text-white border-indigo-800'
                                    : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                                }`}
                              >
                                <Layers className="w-3.5 h-3.5 shrink-0" />
                                <span>{isExpanded ? 'Hide' : 'Flow Summary'}</span>
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-100/70">
                              <td colSpan={8} className="p-2 sm:p-3">
                                <ItemTraceabilitySummaryPanel
                                  item={item}
                                  mode="site"
                                  siteId={selectedSiteId}
                                  onClose={() => setExpandedSiteTraceItemId(null)}
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLIENT FOC MATERIALS ALLOCATED TO SITE YARD (STANDARD 5-STAGE RECONCILIATION TABLE) */}
      {activeSection === 'foc-materials' && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/40 text-white flex items-center justify-center font-bold text-lg shrink-0">
                🎁
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500 text-white uppercase tracking-wider">
                    Central FOC
                  </span>
                  <span className="text-xs text-indigo-200 font-semibold">
                    Standard 5-Stage FOC Reconciliation Ledger
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-white mt-0.5">
                  Client Free-Issue (FOC) Materials at {selectedSite?.name}
                </h3>
                <p className="text-xs text-indigo-200">
                  1. FOC Central Stock Receipt → 2. Site Issue → 3. Team Issue → 4. Usage &amp; Wastage → 5. Balance / Returnable Stock on Completion
                </p>
              </div>
            </div>
            <span className="px-3 py-1.5 bg-white/10 text-white border border-white/20 rounded-lg text-xs font-bold font-mono shrink-0">
              {siteFocItemsList.length} FOC Item(s) • {totalSiteFocRecordsCount} Transfer Record(s)
            </span>
          </div>

          {/* 5-Stage FOC Reconciliation Master Table for this Site */}
          {siteFocItemsList.length > 0 && (
            <div className="bg-white rounded-xl border-2 border-indigo-300 shadow-xs overflow-visible">
              <div className="px-4 py-3 bg-indigo-50/80 border-b border-indigo-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-600 text-white uppercase">
                    Central FOC
                  </span>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-950">
                    Standard 5-Stage FOC Reconciliation Summary at {selectedSite?.name}
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-indigo-800">
                  Click &ldquo;Item Report &amp; Print&rdquo; on any item to view or print its A4 reconciliation report
                </span>
              </div>

              <div className="overflow-x-auto pb-2">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 uppercase border-b border-slate-200 font-bold text-[11px] tracking-normal leading-tight">
                    <tr>
                      <th className="py-3 pl-3 pr-2">FOC Item &amp; Project</th>
                      <th className="py-3 px-2 text-right bg-indigo-50/60 text-indigo-950">
                        1. FOC Central<br className="hidden sm:inline" /> Receipt
                      </th>
                      <th className="py-3 px-2 text-right">
                        2. Site Issue<br className="hidden sm:inline" /> (Central FOC)
                      </th>
                      <th className="py-3 px-2 text-right">
                        3. Team Issue<br className="hidden sm:inline" /> (Site → Team)
                      </th>
                      <th className="py-3 px-2 text-right">
                        4. Usage &amp;<br className="hidden sm:inline" /> Wastage
                      </th>
                      <th className="py-3 px-2.5 text-right bg-emerald-50/70 text-emerald-950">
                        5. Balance /<br className="hidden sm:inline" /> Returnable
                      </th>
                      <th className="py-3 pl-2 pr-3 text-center">Item Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-100">
                    {siteFocItemsList.map((itm) => {
                      const rec = siteItemReconciliationMap.get(itm.id)!;
                      const isExpanded = expandedFocTabTraceItemId === itm.id;
                      return (
                        <React.Fragment key={itm.id}>
                          <tr className="bg-indigo-50/25 hover:bg-indigo-50/60 border-l-4 border-l-indigo-600">
                            <td className="py-3 pl-3 pr-2 max-w-[190px]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-black text-indigo-950">{itm.itemCode}</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-600 text-white uppercase">
                                  Central FOC
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 mt-0.5 break-words">{itm.itemName}</div>
                              {rec.primaryFocProjectName && (
                                <div className="text-[10.5px] text-indigo-700 font-semibold truncate" title={rec.primaryFocProjectName}>
                                  Project: {rec.primaryFocProjectName}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-2 text-right font-mono bg-indigo-50/40 whitespace-nowrap">
                              <div className="text-[13px] font-black text-indigo-900">
                                {formatNumber(rec.stage1InitialCentralFoc)} {itm.unit}
                              </div>
                              <div className="text-[10px] font-sans text-indigo-700">
                                Pool Rem: <strong>{formatNumber(rec.centralFocPoolRemaining)} {itm.unit}</strong>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right font-mono whitespace-nowrap">
                              <div className="text-[13px] font-black text-indigo-700">
                                +{formatNumber(rec.stage2SiteFocIssued)} {itm.unit}
                              </div>
                              <div className="text-[10px] font-sans text-slate-500">
                                Issued to {selectedSite?.name}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right font-mono whitespace-nowrap">
                              <div className="text-[13px] font-bold text-blue-800">
                                {formatNumber(rec.stage3TeamIssued)} {itm.unit}
                              </div>
                              <div className="text-[10px] font-sans text-emerald-700">
                                Ret: +{formatNumber(rec.stage3TeamReturnedGood)} | Hand: {formatNumber(rec.stage3TeamInHand)}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right font-mono whitespace-nowrap">
                              <div className="text-[13px] font-black text-slate-900">
                                {formatNumber(rec.stage4TotalConsumed)} {itm.unit}
                              </div>
                              <div className="text-[10px] font-sans">
                                <span className="text-teal-700 font-bold">Used: {formatNumber(rec.stage4Used)}</span>
                                {' • '}
                                <span className="text-rose-600 font-bold">Waste: {formatNumber(rec.stage4Wastage)}</span>
                              </div>
                            </td>
                            <td className="py-3 px-2.5 text-right font-mono bg-emerald-50/50 whitespace-nowrap">
                              <div className="text-[13px] font-black text-indigo-900">
                                Site Ret: {formatNumber(rec.stage5SiteFocReturnableBalance)} {itm.unit}
                              </div>
                              <div className="text-[10.5px] font-bold text-emerald-800">
                                Client Ret: {formatNumber(rec.stage5TotalClientReturnableBalance)} {itm.unit}
                              </div>
                            </td>
                            <td className="py-3 pl-2 pr-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedFocTabTraceItemId((prev) => (prev === itm.id ? null : itm.id))
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-700 hover:bg-indigo-600 text-white shadow-2xs cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5 shrink-0" />
                                <span>{isExpanded ? 'Hide Report' : 'Report & Print'}</span>
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-100/80">
                              <td colSpan={7} className="p-2.5">
                                <ItemTraceabilitySummaryPanel
                                  item={itm}
                                  mode="site"
                                  siteId={selectedSiteId}
                                  focProjectId={rec.primaryFocProjectId}
                                  onClose={() => setExpandedFocTabTraceItemId(null)}
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {totalSiteFocRecordsCount === 0 && siteFocItemsList.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center mx-auto mb-3 text-xl">
                🎁
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                No Client FOC Materials Assigned to {selectedSite?.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No client free-issue material requisitions or shipments have been approved for this site branch yet. Request FOC stock from 2. Site Requests &gt; Client Free Stock Request.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Approved / Accepted FOC Stock Transfer Requests */}
              {siteFocRequests.map((req) => (
                <div key={req.id} className="bg-white border border-indigo-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-indigo-900 text-white px-2.5 py-1 rounded">
                        {req.requestNoteNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-600 text-white uppercase">
                        Central FOC Site Issue
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300 uppercase">
                        {req.focProjectScope === 'main' ? '🏢 Under Main Project' : '📄 Individual Project'}
                      </span>
                      {req.focProjectName && (
                        <span className="text-xs font-bold text-slate-900">
                          Project: <span className="text-indigo-700">{req.focProjectCode ? `[${req.focProjectCode}] ` : ''}{req.focProjectName}</span>
                        </span>
                      )}
                      {req.focClientName && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="text-xs text-slate-600">Client: <strong>{req.focClientName}</strong></span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                        {req.status}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {formatDateTime(req.approvalDate || req.requestedDate)}
                      </span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Item Code</th>
                          <th className="py-2.5 px-3">Material Description</th>
                          <th className="py-2.5 px-3 text-center">Unit</th>
                          <th className="py-2.5 px-3 text-right">2. Site Issue (Central FOC)</th>
                          <th className="py-2.5 px-3 text-right">5. Site FOC Returnable Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {req.items.map((row, idx) => {
                          const itm = items.find((i) => i.id === row.itemId);
                          const rec = siteItemReconciliationMap.get(row.itemId);
                          const qty =
                            req.status === 'Accepted'
                              ? (row.receivedQty ?? row.approvedQty ?? row.requestedQty)
                              : (row.approvedQty ?? row.requestedQty);
                          return (
                            <tr key={idx} className="bg-white">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                {itm?.itemCode || 'ITEM'}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-800">
                                {itm?.itemName || 'Material Item'}
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-600">{itm?.unit || 'units'}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                                +{formatNumber(qty)} {itm?.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-700">
                                {formatNumber(rec?.stage5SiteFocReturnableBalance ?? 0)} {itm?.unit}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {req.purpose && (
                    <div className="text-xs text-slate-500 italic">
                      Purpose: &ldquo;{req.purpose}&rdquo;
                    </div>
                  )}
                </div>
              ))}

              {/* Initial Central FOC Vouchers Allocated to this Site */}
              {siteFocMaterials.map((foc) => (
                <div key={foc.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-indigo-900 text-white px-2.5 py-1 rounded">
                        {foc.voucherNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-300 uppercase">
                        1. Initial Central FOC Receipt
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        Client: <span className="text-indigo-700">{foc.clientName}</span>
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-xs text-slate-600">Project: {foc.projectName}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {formatDateTime(pickBestTimestamp(foc.receivedDate, foc.createdAt))}
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Item Code</th>
                          <th className="py-2.5 px-3">Material Description</th>
                          <th className="py-2.5 px-3 text-center">Unit</th>
                          <th className="py-2.5 px-3 text-right">1. Initial Central FOC Receipt</th>
                          <th className="py-2.5 px-3 text-right">Central FOC Pool Remaining</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {foc.items.map((row, idx) => {
                          const itm = items.find((i) => i.id === row.itemId);
                          const bal = getClientFreeStockBalance(foc.projectId, row.itemId);
                          return (
                            <tr key={idx} className="bg-white">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                {itm?.itemCode || 'ITEM'}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-800">
                                {itm?.itemName || 'Material Item'}
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-600">{itm?.unit || 'units'}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                                {formatNumber(row.quantity)} {itm?.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-700">
                                {formatNumber(bal.remainingBalance)} {itm?.unit}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {foc.notes && (
                    <div className="text-xs text-slate-500 italic">
                      Notes: &ldquo;{foc.notes}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SITE MATERIAL USAGE HISTORY VOUCHERS */}
      {activeSection === 'history' && (
        <div className="space-y-5">
          {/* Site Material Usage KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Site Usage Vouchers Logged
                </div>
                <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                  {siteTotalVouchersCount} <span className="text-xs font-medium text-slate-500">vouchers</span>
                </div>
                <div className="text-[11px] text-teal-700 font-medium mt-0.5">
                  Logged at {selectedSite?.name}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Material Qty Consumed
                </div>
                <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                  {formatNumber(siteTotalItemsConsumedCount)} <span className="text-xs font-medium text-slate-500">units</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  Issued to site projects
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
                <Users2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Active Executing Teams
                </div>
                <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                  {siteActiveTeamsCount} <span className="text-xs font-medium text-slate-500">crews</span>
                </div>
                <div className="text-[11px] text-sky-700 font-medium mt-0.5">
                  Consuming materials on-site
                </div>
              </div>
            </div>
          </div>

          {/* History Search & Team Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search voucher #, project, customer, phone, site ID, team or work..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs focus:outline-none"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200 text-xs font-bold cursor-pointer"
                  title="Clear Search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Team:</span>
              </label>
              <select
                value={historyTeamFilter}
                onChange={(e) => setHistoryTeamFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:outline-none shadow-2xs min-w-[160px]"
              >
                <option value="all">All Executing Teams ({siteUsages.length})</option>
                {siteActiveTeamsList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.teamName} ({t.teamLeaderName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vouchers List / Cards */}
          {filteredSiteUsages.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                No Material Usage Vouchers Found for {selectedSite?.name || 'this Site'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {historySearch || historyTeamFilter !== 'all'
                  ? 'No vouchers match your search criteria or team filter. Try clearing your search.'
                  : `No project material usages have been logged for ${selectedSite?.name || 'this site branch'} yet. Logged usages from Project Material Usage will automatically appear here.`}
              </p>
              {(historySearch || historyTeamFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setHistorySearch('');
                    setHistoryTeamFilter('all');
                  }}
                  className="mt-3 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSiteUsages.map((pu) => {
                const totalRowQty = pu.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

                return (
                  <div
                    key={pu.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
                  >
                    {/* Voucher Top Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-teal-400" />
                          <span>{pu.usageVoucherNumber}</span>
                        </span>

                        {pu.projectTypeName && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                            {pu.projectTypeName}
                          </span>
                        )}

                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateTime(pickBestTimestamp(pu.date, pu.createdAt, pu.usageDate))}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedUsageForPrint(pu)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-teal-600" />
                          <span>Print Voucher</span>
                        </button>
                      </div>
                    </div>

                    {/* Voucher Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Project & Customer Details
                        </div>
                        <div className="font-bold text-slate-900 text-sm mt-0.5 truncate" title={pu.projectName}>
                          {pu.projectName}
                        </div>
                        {pu.customerName && (
                          <div className="text-slate-600 font-semibold truncate mt-0.5">
                            Customer: {pu.customerName}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                          {pu.siteIdentifier && (
                            <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-0.5">
                              <Hash className="w-3 h-3 text-slate-400" />
                              <span>Site ID: {pu.siteIdentifier}</span>
                            </span>
                          )}
                          {pu.customerPhone && (
                            <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{pu.customerPhone}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Executing Field Crew & Leader
                        </div>
                        <div className="font-bold text-slate-900 text-xs mt-0.5 flex items-center gap-1">
                          <Users2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{pu.teamName || 'Assigned Crew'}</span>
                        </div>
                        <div className="text-slate-600 font-medium mt-1 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Supervisor: <strong>{pu.supervisorOrLeaderName || pu.supervisorOrLeader || 'N/A'}</strong></span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Logged By: {pu.loggedBy}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Work Scope & Consumed Items Summary
                        </div>
                        <div className="text-slate-800 font-medium mt-0.5 line-clamp-2" title={pu.workDetails}>
                          {pu.workDetails || 'General site material installation work'}
                        </div>
                        <div className="mt-1.5 font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block">
                          {pu.items.length} Item Line(s) · {formatNumber(totalRowQty)} Total Units
                        </div>
                      </div>
                    </div>

                    {/* Consumed Materials Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3.5">Item Code</th>
                            <th className="py-2.5 px-3.5">Material Description</th>
                            <th className="py-2.5 px-3.5">Category</th>
                            <th className="py-2.5 px-3.5 text-center">Unit</th>
                            <th className="py-2.5 px-3.5 text-right font-bold text-slate-900">Qty Consumed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pu.items.map((row, iIdx) => {
                            const itm = items.find((i) => i.id === row.itemId);
                            return (
                              <tr key={iIdx} className="hover:bg-slate-50/80">
                                <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                                  {itm?.itemCode || 'ITEM'}
                                </td>
                                <td className="py-2.5 px-3.5 font-bold text-slate-900">
                                  {itm?.itemName || 'Material Item'}
                                </td>
                                <td className="py-2.5 px-3.5 text-slate-600 font-medium">{itm?.category || 'General'}</td>
                                <td className="py-2.5 px-3.5 text-center font-medium text-slate-600">{itm?.unit || 'units'}</td>
                                <td className="py-2.5 px-3.5 text-right font-mono font-extrabold text-teal-800">
                                  {formatNumber(row.quantity)} {itm?.unit}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: DAMAGED RETURNS AT SITE QUARANTINE & UPSTREAM RETURN TO PARENT / MAIN */}
      {activeSection === 'damaged-returns' && selectedSite && (
        <div className="space-y-6">
          {/* Hierarchy-Aware Banner */}
          <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/25 border border-amber-400/40 text-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500 text-slate-950 uppercase tracking-wider">
                    Damaged Quarantine
                  </span>
                  <span className="text-xs text-amber-200 font-semibold">
                    Upstream Target: <strong className="text-white">{damagedReturnDestName}</strong>{' '}
                    ({isSelectedSiteSub ? 'Sub-Site → Parent Regional Branch' : 'Regional Site → Central Main Warehouse'})
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-white mt-0.5">
                  Damaged / Scrap Returns Held at {selectedSite.name}
                </h3>
                <p className="text-xs text-amber-100/90 mt-0.5 leading-relaxed">
                  Damaged items returned by Field Teams
                  {!isSelectedSiteSub ? ' and child Sub-Sites' : ''} are quarantined here separately from usable Site Stock.
                  Select items below to dispatch them upstream to <strong>{damagedReturnDestName}</strong> via an official BRM Return Voucher.
                </p>
              </div>
            </div>

            {siteDamagedUnitsBalanceTotal > 0 && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {selectedDamagedItemIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleOpenDamagedReturnModal(selectedDamagedItemIds)}
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md transition cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>
                      Return Selected ({selectedDamagedItemIds.length}) to {isSelectedSiteSub ? 'Parent' : 'Main HQ'}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenDamagedReturnModal()}
                  className="px-4 py-2.5 bg-white hover:bg-amber-50 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md transition cursor-pointer whitespace-nowrap"
                >
                  <Send className="w-4 h-4 text-amber-700" />
                  <span>
                    Return All Damaged ({formatNumber(siteDamagedUnitsBalanceTotal)}) → {isSelectedSiteSub ? 'Parent Site' : 'Main Warehouse'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider">Damaged Balance at Site</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-700 font-mono">
                {formatNumber(siteDamagedUnitsBalanceTotal)}
              </div>
              <div className="text-[11px] text-amber-800 font-medium mt-1">
                Units waiting to return to {damagedReturnDestName}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider">Total Damaged Received</span>
                <RotateCcw className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatNumber(siteDamagedInboundTotal)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                From Field Teams{!isSelectedSiteSub ? ' & Child Sub-Sites' : ''} ({siteDamagedInboundRecords.length} voucher{siteDamagedInboundRecords.length === 1 ? '' : 's'})
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider">Returned Upstream</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {formatNumber(siteDamagedSentUpstreamTotal)}
              </div>
              <div className="text-[11px] text-emerald-800 font-medium mt-1">
                Dispatched to {damagedReturnDestName} ({siteDamagedOutboundRecords.length} BRM)
              </div>
            </div>
          </div>

          {/* Search & Damaged Quarantine Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-visible">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Damaged Stock Quarantine Ledger — {selectedSite.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Isolated from usable Yard Stock. Check multiple items or click &ldquo;Return Upstream&rdquo; on any item row.
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={damagedSearchQuery}
                  onChange={(e) => setDamagedSearchQuery(e.target.value)}
                  placeholder="Search item code, name or category..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">Sel</th>
                    <th className="py-3 px-3">Item Code</th>
                    <th className="py-3 px-4">Material Description</th>
                    <th className="py-3 px-3 text-right">From Teams</th>
                    {!isSelectedSiteSub && <th className="py-3 px-3 text-right">From Sub-Sites</th>}
                    <th className="py-3 px-3 text-right">Sent to {isSelectedSiteSub ? 'Parent' : 'Main HQ'}</th>
                    <th className="py-3 px-4 text-right bg-amber-50/70 text-amber-950">Damaged Balance at Site</th>
                    <th className="py-3 px-4 text-center">Upstream Return Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSiteDamagedCatalog.length === 0 ? (
                    <tr>
                      <td colSpan={isSelectedSiteSub ? 7 : 8} className="py-12 px-4 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
                          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                          <div className="font-bold text-slate-800 text-sm">
                            No damaged returns recorded at {selectedSite.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            When Field Teams{!isSelectedSiteSub ? ' or child Sub-Sites' : ''} return items as &ldquo;Damaged / Scrap&rdquo;, they appear here for inspection and upstream return to {damagedReturnDestName}.
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSiteDamagedCatalog.map((row) => {
                      const canReturn = row.availableDamagedBalance > 0;
                      const isSel = selectedDamagedItemIds.includes(row.item.id);
                      return (
                        <tr
                          key={row.item.id}
                          className={canReturn ? 'bg-amber-50/25 hover:bg-amber-50/60 transition-colors' : 'hover:bg-slate-50'}
                        >
                          <td className="py-3 px-3 text-center">
                            {canReturn && (
                              <input
                                type="checkbox"
                                checked={isSel}
                                onChange={() =>
                                  setSelectedDamagedItemIds((prev) =>
                                    prev.includes(row.item.id)
                                      ? prev.filter((id) => id !== row.item.id)
                                      : [...prev, row.item.id]
                                  )
                                }
                                className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                              />
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {row.item.itemCode}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{row.item.itemName}</div>
                            <div className="text-[11px] text-slate-500">
                              {row.item.category} ({row.item.unit})
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-rose-700 font-semibold whitespace-nowrap">
                            {formatNumber(row.teamDamagedReturned)} {row.item.unit}
                          </td>
                          {!isSelectedSiteSub && (
                            <td className="py-3 px-3 text-right font-mono text-sky-700 font-semibold whitespace-nowrap">
                              {formatNumber(row.subSiteDamagedReturned)} {row.item.unit}
                            </td>
                          )}
                          <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold whitespace-nowrap">
                            {formatNumber(row.damagedReturnedUpstream)} {row.item.unit}
                          </td>
                          <td className="py-3 px-4 text-right bg-amber-50/30 whitespace-nowrap">
                            <span
                              className={`inline-block font-mono font-black px-2.5 py-1 rounded-md text-xs ${
                                canReturn
                                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {formatNumber(row.availableDamagedBalance)} {row.item.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {canReturn ? (
                              <button
                                type="button"
                                onClick={() => handleOpenDamagedReturnModal([row.item.id])}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Return to {isSelectedSiteSub ? 'Parent Site' : 'Main HQ'}</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                All Returned Upstream
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Two-Column Voucher Ledgers: Inbound Damaged vs Outbound Upstream BRM */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Inbound Damaged Receipts */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Inbound Damaged Vouchers ({siteDamagedInboundRecords.length})
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Teams{!isSelectedSiteSub ? ' & Sub-Sites' : ''} → {selectedSite.name}</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {siteDamagedInboundRecords.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No inbound damaged return vouchers yet.
                  </div>
                ) : (
                  siteDamagedInboundRecords.map((rec) => (
                    <div key={rec.id} className="p-3.5 flex items-start justify-between gap-3 text-xs hover:bg-slate-50/70">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {rec.voucherNumber}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            rec.sourceType === 'subsite'
                              ? 'bg-sky-50 text-sky-800 border border-sky-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {rec.sourceLabel}
                          </span>
                        </div>
                        <div className="font-bold text-slate-800 truncate">
                          [{rec.itemCode}] {rec.itemName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatDateTime(rec.date)} · Reason: {rec.reason}
                        </div>
                      </div>
                      <div className="font-mono font-black text-rose-700 whitespace-nowrap shrink-0">
                        +{formatNumber(rec.quantity)} {rec.unit}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Outbound Upstream Damaged BRM Dispatches */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Upstream Damaged Dispatches ({siteDamagedOutboundRecords.length})
                </div>
                <span className="text-[11px] text-slate-500 font-medium">{selectedSite.name} → {damagedReturnDestName}</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {siteDamagedOutboundRecords.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No damaged stock dispatched upstream from this site yet.
                  </div>
                ) : (
                  siteDamagedOutboundRecords.map((br) => {
                    const itmObj = items.find((i) => i.id === br.itemId);
                    return (
                      <div key={br.id} className="p-3.5 flex items-start justify-between gap-3 text-xs hover:bg-slate-50/70">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-slate-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {br.branchReturnNumber}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              To: {br.toSiteName || damagedReturnDestName}
                            </span>
                          </div>
                          <div className="font-bold text-slate-800 truncate">
                            [{itmObj?.itemCode || 'ITEM'}] {itmObj?.itemName || 'Material Item'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {formatDateTime(br.returnDate)} · By {br.returnedBy}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-black text-amber-800 whitespace-nowrap">
                            -{formatNumber(br.quantity)} {itmObj?.unit || 'units'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedBranchReturnForPrint(br)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title="Print Return Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification / Count Modal for Site Receiving */}
      {acceptingShipment && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="font-semibold text-base text-slate-900">
                    Verify & Receive Incoming Shipment ({acceptingShipment.requestNoteNumber})
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Destination: <strong className="text-slate-800">{selectedSite?.name}</strong>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAcceptingShipment(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Verify actual materials delivered to site gate. If all items match what was dispatched, keep the default quantities. If any items arrived damaged or short, enter the actual count.
            </p>

            <div className="border border-slate-200 rounded-lg overflow-x-auto mb-4">
              <table className="w-full text-xs text-left min-w-[460px]">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Item Specs</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                    <th className="py-2.5 px-3 text-right">Dispatched Qty</th>
                    <th className="py-2.5 px-3 text-right w-36 font-bold text-slate-900">Counted / Recv Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {acceptingShipment.items.map((row) => {
                    const itm = items.find((i) => i.id === row.itemId);
                    const apprv = row.approvedQty ?? row.requestedQty;
                    const currentRecv =
                      receivedItems.find((r) => r.itemId === row.itemId)?.receivedQty ?? apprv;

                    return (
                      <tr key={row.itemId}>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                            {itm?.itemCode}
                          </span>
                          <div className="text-xs font-semibold text-slate-800 mt-0.5">{itm?.itemName}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{itm?.unit}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">
                          {formatNumber(apprv)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={currentRecv}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              setReceivedItems((prev) =>
                                prev.map((item) =>
                                  item.itemId === row.itemId ? { ...item, receivedQty: val } : item
                                )
                              );
                            }}
                            placeholder="0"
                            className="w-24 px-2 py-1.5 border border-emerald-400 bg-emerald-50/40 rounded text-xs font-mono font-bold text-right focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                            required
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receiving Verification Notes
              </label>
              <textarea
                value={receivingNotes}
                onChange={(e) => setReceivingNotes(e.target.value)}
                placeholder="e.g. Received at site gate, packaging inspected and verified."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setAcceptingShipment(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEditReceive}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Confirm & Restock Site Yard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Voucher Modal */}
      {selectedUsageForPrint && (
        <PrintableDocumentModal
          isOpen={!!selectedUsageForPrint}
          onClose={() => setSelectedUsageForPrint(null)}
          title="SITE MATERIAL USAGE VOUCHER"
          documentNumber={selectedUsageForPrint.usageVoucherNumber}
          documentDate={
            pickBestTimestamp(
              selectedUsageForPrint.date,
              selectedUsageForPrint.createdAt,
              selectedUsageForPrint.usageDate
            ) || selectedUsageForPrint.date
          }
          recipientLabel="Site / Project Office"
          recipientName={selectedUsageForPrint.projectName}
          recipientSubDetails={`Supervisor / Lead: ${selectedUsageForPrint.supervisorOrLeaderName || selectedUsageForPrint.supervisorOrLeader} | Executing Team: ${selectedUsageForPrint.teamName} | Section: ${selectedUsageForPrint.projectTypeName || 'General'}${selectedUsageForPrint.siteIdentifier ? ` | Site ID: ${selectedUsageForPrint.siteIdentifier}` : ''}${selectedUsageForPrint.customerPhone ? ` | Tel: ${selectedUsageForPrint.customerPhone}` : ''}`}
          notes={`Work Scope / Details: ${selectedUsageForPrint.workDetails || 'General site material consumption'}`}
          items={selectedUsageForPrint.items.map((row) => {
            const itm = items.find((i) => i.id === row.itemId);
            return {
              itemCode: itm?.itemCode || 'ITEM',
              itemName: itm?.itemName || 'Material Item',
              category: itm?.category || 'General',
              quantity: row.quantity,
              unit: itm?.unit || 'units',
            };
          })}
        />
      )}
      {/* Direct Issue Stock to Child Sub-Site Modal */}
      {showIssueToSubSiteModal && selectedSite && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-700 text-white flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Issue Stock from {selectedSite.name} to Sub-Site Branch
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transfer materials directly from this Regional Branch&apos;s available yard stock to a child Sub-Site.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIssueToSubSiteModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {subSiteIssueError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{subSiteIssueError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitIssueToSubSite} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Destination Sub-Site Branch *
                  </label>
                  <select
                    value={subSiteIssueTargetId}
                    onChange={(e) => setSubSiteIssueTargetId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
                    required
                  >
                    {selectedSiteSubSites.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        ↳ {sub.name} ({sub.location || 'Sub-Site'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Purpose / Transfer Reference
                  </label>
                  <input
                    type="text"
                    value={subSiteIssuePurpose}
                    onChange={(e) => setSubSiteIssuePurpose(e.target.value)}
                    placeholder={`e.g. Sub-site stock allocation from ${selectedSite.name}`}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Items to Issue from {selectedSite.name} Yard
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextItm =
                        activeItems.find(
                          (i) =>
                            getSiteItemStock(selectedSite.id, i.id).availableBalance > 0 &&
                            !subSiteIssueRows.some((r) => r.itemId === i.id)
                        ) || activeItems[0];
                      if (nextItm) {
                        setSubSiteIssueRows((prev) => [...prev, { itemId: nextItm.id, quantity: 1 }]);
                      }
                    }}
                    className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {subSiteIssueRows.map((row, idx) => {
                    const parentBal = row.itemId
                      ? getSiteItemStock(selectedSite.id, row.itemId).availableBalance
                      : 0;
                    const itmObj = items.find((i) => i.id === row.itemId);
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <SearchableItemSelect
                            selectedItemId={row.itemId}
                            onSelectItem={(selected) =>
                              setSubSiteIssueRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, itemId: selected.id } : r))
                              )
                            }
                            siteId={selectedSite.id}
                            onlyAvailableStock={true}
                            showStockBadge={true}
                          />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-500">
                              Avl: <span className="font-mono text-slate-900">{formatNumber(parentBal)} {itmObj?.unit}</span>
                            </div>
                            <input
                              type="number"
                              min="0.01"
                              max={parentBal > 0 ? parentBal : undefined}
                              step="any"
                              value={row.quantity}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : Number(e.target.value);
                                setSubSiteIssueRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, quantity: val } : r))
                                );
                              }}
                              placeholder="0"
                              className="w-24 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-right bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
                              required
                            />
                          </div>
                          {subSiteIssueRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setSubSiteIssueRows((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={subSiteIssueAutoAccept}
                  onChange={(e) => setSubSiteIssueAutoAccept(e.target.checked)}
                  className="rounded border-sky-400 text-sky-700 focus:ring-sky-600"
                />
                <span>
                  <strong>Immediate Receive into Sub-Site Yard</strong> (uncheck to mark shipment as In-Transit for Sub-Site gate verification)
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowIssueToSubSiteModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Issue to Sub-Site</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Upstream Damaged Return Modal (Sub-Site -> Parent Regional OR Regional -> Central HQ) */}
      {showDamagedReturnModal && selectedSite && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Return Damaged / Scrap Stock Upstream
                  </h3>
                  <p className="text-xs text-slate-500">
                    From <strong>{selectedSite.name}</strong> → Destination: <strong className="text-amber-800">{damagedReturnDestName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDamagedReturnModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {damagedReturnError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{damagedReturnError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitDamagedUpstreamReturn} className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                {isSelectedSiteSub ? (
                  <span>
                    <strong>Sub-Site Return Rule:</strong> Damaged items from Sub-Site <strong>{selectedSite.name}</strong> route upstream to its Parent Regional Branch (<strong>{damagedReturnDestName}</strong>) and will enter its Damaged Return Quarantine.
                  </span>
                ) : (
                  <span>
                    <strong>Regional Return Rule:</strong> Damaged items from <strong>{selectedSite.name}</strong> route upstream to <strong>{damagedReturnDestName}</strong> and appear in Central <strong>Damaged / Scrap Yard</strong> (excluded from usable stock until repaired).
                  </span>
                )}
              </div>

              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {damagedReturnRows.map((row, idx) => {
                  const itm = items.find((i) => i.id === row.itemId);
                  return (
                    <div
                      key={row.itemId}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {itm?.itemCode || 'ITEM'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                            Damaged / Scrap
                          </span>
                        </div>
                        <div className="font-bold text-xs text-slate-800 truncate mt-0.5">
                          {itm?.itemName || 'Material Item'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-slate-500">
                            Max Damaged: <span className="font-mono text-amber-800">{formatNumber(row.maxAvailable)} {itm?.unit}</span>
                          </div>
                          <input
                            type="number"
                            min="0.01"
                            max={row.maxAvailable}
                            step="any"
                            value={row.quantity}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setDamagedReturnRows((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, quantity: raw === '' ? '' : Number(raw) } : r
                                )
                              );
                            }}
                            className="w-28 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-right bg-white focus:ring-2 focus:ring-amber-600 focus:outline-none"
                            required
                          />
                        </div>
                        {damagedReturnRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setDamagedReturnRows((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Remove item from voucher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Damage Inspection / Return Reason *
                </label>
                <textarea
                  value={damagedReturnReason}
                  onChange={(e) => setDamagedReturnReason(e.target.value)}
                  rows={2}
                  required
                  placeholder="Enter reason or damage inspection remarks..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDamagedReturnModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Dispatch Damaged Return to {isSelectedSiteSub ? 'Parent Site' : 'Main HQ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Upstream Damaged Return Voucher (BRM) */}
      {selectedBranchReturnForPrint && (
        <PrintableDocumentModal
          isOpen={!!selectedBranchReturnForPrint}
          onClose={() => setSelectedBranchReturnForPrint(null)}
          title={
            selectedBranchReturnForPrint.toSiteId &&
            !sites.find((s) => s.id === selectedBranchReturnForPrint.toSiteId)?.isMainWarehouse
              ? 'SUB-SITE DAMAGED RETURN TO PARENT BRANCH NOTE'
              : 'INTER-BRANCH DAMAGED RETURN TO CENTRAL YARD NOTE'
          }
          documentNumber={selectedBranchReturnForPrint.branchReturnNumber}
          documentDate={selectedBranchReturnForPrint.returnDate}
          recipientLabel="Receiving Yard"
          recipientName={selectedBranchReturnForPrint.toSiteName || 'Main Central Warehouse'}
          recipientSubDetails={`Returned from: ${selectedBranchReturnForPrint.siteName || selectedBranchReturnForPrint.fromSiteName} | Processed by: ${selectedBranchReturnForPrint.returnedBy}`}
          notes={`Reason: ${selectedBranchReturnForPrint.reason}`}
          items={(selectedBranchReturnForPrint.batchItems &&
          selectedBranchReturnForPrint.batchItems.length > 0
            ? selectedBranchReturnForPrint.batchItems
            : branchReturns
                .filter(
                  (r) =>
                    r.branchReturnNumber === selectedBranchReturnForPrint.branchReturnNumber &&
                    !r.isDeleted
                )
                .map((r) => ({ itemId: r.itemId, quantity: r.quantity, condition: r.condition }))
          ).map((row) => {
            const itm = items.find((i) => i.id === row.itemId);
            return {
              itemCode: itm?.itemCode || 'CODE',
              itemName: `${itm?.itemName || 'Material Item'} (${row.condition})`,
              category: itm?.category || 'General',
              quantity: row.quantity,
              unit: itm?.unit || 'units',
            };
          })}
        />
      )}
    </div>
  );
};
