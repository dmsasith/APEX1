import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Building2,
  Users,
  Hammer,
  ArrowRight,
  Printer,
  Download,
  X,
  ShoppingCart,
  RotateCcw,
  Gift,
  CheckCircle2,
  Layers,
  Truck,
  PenTool,
  GitBranch,
  CornerDownRight,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  Item,
  Site,
  isSubSite,
  getParentSite,
  getChildSubSites,
  sortSitesHierarchically,
} from '../../types';
import { formatNumber, formatDateTime } from '../../utils/exportUtils';
import { printHtmlElement, downloadElementAsPdf } from '../../utils/printUtils';
import { matchDigitalSignature } from '../../utils/signatureUtils';

interface ItemTraceabilitySummaryPanelProps {
  item: Item;
  mode: 'central' | 'site';
  siteId?: string;
  focProjectId?: string;
  onClose?: () => void;
}

export const ItemTraceabilitySummaryPanel: React.FC<ItemTraceabilitySummaryPanelProps> = ({
  item,
  mode,
  siteId,
  focProjectId,
  onClose,
}) => {
  const {
    config,
    currentTenant,
    currentUser,
    sites,
    activeSites,
    teams,
    activeTeams,
    projects,
    mainStockEntries,
    purchaseOrders,
    clientFreeIssues,
    stockRequests,
    branchReturns,
    supplierReturns,
    teamIssues,
    teamReturns,
    projectUsages,
    getMainWarehouseStock,
    getSiteItemStock,
    getSiteDamagedStock,
    allTeamsInHandStock,
    digitalSignatures,
    activeTemplate,
  } = useStock();

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [printWithImage, setPrintWithImage] = useState<boolean>(() => Boolean(item.imageUrl));
  const [offDigitalSignature, setOffDigitalSignature] = useState<boolean>(
    Boolean(config?.offDigitalSignature)
  );
  const [activeSubView, setActiveSubView] = useState<
    'overview' | 'central-foc' | 'inbound' | 'sites' | 'subsites' | 'teams' | 'projects' | 'reconciliation'
  >('overview');

  const printElementId = `item-trace-print-${mode}-${item.id}-${siteId || 'hq'}-${focProjectId || 'all'}`;

  const mainWarehouseIds = useMemo(
    () => new Set(sites.filter((s) => s.isMainWarehouse).map((s) => s.id)),
    [sites]
  );

  const targetSite = useMemo(
    () => (siteId ? sites.find((s) => s.id === siteId) || null : null),
    [sites, siteId]
  );

  const isSubSiteView = mode === 'site' && Boolean(targetSite) && isSubSite(targetSite);
  const parentRegionalSite = useMemo(
    () => (isSubSiteView && targetSite ? getParentSite(targetSite, sites) || null : null),
    [isSubSiteView, targetSite, sites]
  );

  const targetFocProject = useMemo(
    () => (focProjectId ? projects.find((p) => p.id === focProjectId) || null : null),
    [projects, focProjectId]
  );

  // Resolve project family IDs & names when focProjectId is passed
  const focProjectFamily = useMemo(() => {
    if (focProjectId) {
      const targetProj = projects.find((p) => p.id === focProjectId);
      const parentProj = targetProj?.parentProjectId
        ? projects.find((p) => p.id === targetProj.parentProjectId && !p.isDeleted)
        : undefined;
      const rootProjectId = parentProj ? parentProj.id : targetProj?.parentProjectId || focProjectId;
      const rootProjObj = parentProj || projects.find((p) => p.id === rootProjectId);
      const childSubProjects = projects.filter((p) => !p.isDeleted && p.parentProjectId === rootProjectId);
      const familyIds = new Set<string>([
        rootProjectId,
        focProjectId,
        ...childSubProjects.map((sp) => sp.id),
      ]);
      const familyNamesLower = new Set<string>(
        [
          rootProjObj?.projectName,
          rootProjObj?.projectId,
          targetProj?.projectName,
          targetProj?.projectId,
          ...childSubProjects.flatMap((sp) => [sp.projectName, sp.projectId]),
        ]
          .filter(Boolean)
          .map((s) => String(s).trim().toLowerCase())
      );
      return { rootProjectId, rootProjObj, familyIds, familyNamesLower, hasProjectFilter: true };
    }

    if (siteId) {
      const siteProjs = projects.filter((p) => !p.isDeleted && p.siteId === siteId);
      const familyIds = new Set<string>(siteProjs.map((p) => p.id));
      projects
        .filter((p) => !p.isDeleted && p.parentProjectId && familyIds.has(p.parentProjectId))
        .forEach((sp) => familyIds.add(sp.id));
      const familyNamesLower = new Set<string>(
        siteProjs
          .flatMap((p) => [p.projectName, p.projectId])
          .filter(Boolean)
          .map((s) => String(s).trim().toLowerCase())
      );
      return {
        rootProjectId: siteProjs[0]?.id || '',
        rootProjObj: siteProjs[0] || null,
        familyIds,
        familyNamesLower,
        hasProjectFilter: false,
      };
    }

    return {
      rootProjectId: '',
      rootProjObj: null,
      familyIds: new Set<string>(),
      familyNamesLower: new Set<string>(),
      hasProjectFilter: false,
    };
  }, [focProjectId, siteId, projects]);

  // 1. CENTRAL WAREHOUSE STOCK METRICS
  const mainStock = useMemo(() => getMainWarehouseStock(item.id), [getMainWarehouseStock, item.id]);

  // Parent Regional Branch stock context (when viewing a Sub-Site)
  const parentSiteStock = useMemo(
    () => (parentRegionalSite ? getSiteItemStock(parentRegionalSite.id, item.id) : null),
    [parentRegionalSite, getSiteItemStock, item.id]
  );

  // STAGE 1: INITIAL FOC RECEIPTS AT CENTRAL STOCK
  const initialCentralFocReceipts = useMemo(() => {
    const list: Array<{
      id: string;
      voucherNo: string;
      dispatchNoteNo: string;
      clientName: string;
      projectName: string;
      projectId: string;
      assignedSiteName: string;
      storageLocation: string;
      date: string;
      receivedBy: string;
      qty: number;
      remarks?: string;
    }> = [];

    const siteStockForSite = mode === 'site' && siteId ? getSiteItemStock(siteId, item.id) : null;
    const siteFocReqsForItem =
      mode === 'site' && siteId
        ? stockRequests.filter(
            (req) =>
              req.siteId === siteId &&
              (req.status === 'Accepted' || req.status === 'Approved / In-Transit') &&
              (req.requestCategory === 'foc' || Boolean(req.focProjectId)) &&
              (req.items || []).some((ri) => ri.itemId === item.id)
          )
        : [];
    const siteIssuedProjectFamilyIds = new Set<string>();
    siteFocReqsForItem.forEach((req) => {
      if (req.focProjectId) {
        siteIssuedProjectFamilyIds.add(req.focProjectId);
        const p = projects.find((pr) => pr.id === req.focProjectId);
        const rootId = p?.parentProjectId || req.focProjectId;
        siteIssuedProjectFamilyIds.add(rootId);
        projects
          .filter((sp) => !sp.isDeleted && sp.parentProjectId === rootId)
          .forEach((sp) => siteIssuedProjectFamilyIds.add(sp.id));
      }
    });
    const targetSiteNameLower = (targetSite?.name || '').trim().toLowerCase();

    clientFreeIssues
      .filter((f) => {
        if (f.isDeleted) return false;
        const hasItem = (f.items || []).some((i) => i.itemId === item.id && Number(i.quantity) > 0);
        if (!hasItem) return false;

        if (focProjectId) {
          return (
            focProjectFamily.familyIds.has(f.projectId) ||
            Boolean(f.parentProjectId && focProjectFamily.familyIds.has(f.parentProjectId))
          );
        }

        if (mode === 'site' && siteId) {
          if (!siteStockForSite || siteStockForSite.focReceived <= 0) return false;

          const isStoredAtThisSite =
            Boolean(targetSiteNameLower) &&
            Boolean(f.storageLocation) &&
            f.storageLocation!.trim().toLowerCase() === targetSiteNameLower;
          if (isStoredAtThisSite) return true;

          if (siteIssuedProjectFamilyIds.size > 0) {
            return (
              siteIssuedProjectFamilyIds.has(f.projectId) ||
              Boolean(f.parentProjectId && siteIssuedProjectFamilyIds.has(f.parentProjectId))
            );
          }

          const fProj = projects.find((p) => p.id === f.projectId || p.id === f.parentProjectId);
          const effectiveSiteId = f.assignedSiteId || fProj?.siteId;
          return (
            effectiveSiteId === siteId ||
            (isSubSiteView && parentRegionalSite ? effectiveSiteId === parentRegionalSite.id : false)
          );
        }

        return true;
      })
      .forEach((f) => {
        const row = (f.items || []).find((i) => i.itemId === item.id);
        if (!row || Number(row.quantity) <= 0) return;
        const fProj = projects.find((p) => p.id === f.projectId || p.id === f.parentProjectId);
        const effectiveSiteId = f.assignedSiteId || fProj?.siteId;
        const siteName =
          f.assignedSiteName ||
          (effectiveSiteId ? sites.find((s) => s.id === effectiveSiteId)?.name : '') ||
          targetSite?.name ||
          'Assigned Site Branch';

        list.push({
          id: f.id,
          voucherNo: f.voucherNumber,
          dispatchNoteNo: f.dispatchNoteNo || 'N/A',
          clientName: f.clientName,
          projectName: f.projectName,
          projectId: f.projectId,
          assignedSiteName: siteName,
          storageLocation: f.storageLocation || 'Main Central Warehouse',
          date: f.receivedDate || f.createdAt,
          receivedBy: f.receivedBy || 'Central Store',
          qty: Number(row.quantity),
          remarks: row.remarks || f.notes,
        });
      });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    clientFreeIssues,
    item.id,
    focProjectId,
    focProjectFamily,
    mode,
    siteId,
    projects,
    stockRequests,
    sites,
    targetSite,
    getSiteItemStock,
    isSubSiteView,
    parentRegionalSite,
  ]);

  // 2. INBOUND SOURCES TO CENTRAL STOCK (POs, Manual Entries, Client FOC, Branch Returns to HQ)
  const centralInboundRecords = useMemo(() => {
    const records: Array<{
      id: string;
      refNo: string;
      sourceType: 'PO Receipt' | 'Manual / Spot Entry' | 'Client FOC' | 'Site Good Return';
      isCentralFoc: boolean;
      partyName: string;
      date: string;
      qty: number;
      receivedBy: string;
      notes: string;
      badgeColor: string;
    }> = [];

    if (!focProjectId) {
      mainStockEntries
        .filter((e) => e.itemId === item.id)
        .forEach((e) => {
          const isPo = e.entryType === 'Purchase' || (e.referenceNo || '').toUpperCase().startsWith('PO-');
          records.push({
            id: `mse-${e.id}`,
            refNo: e.referenceNo || 'GRN-MANUAL',
            sourceType: isPo ? 'PO Receipt' : 'Manual / Spot Entry',
            isCentralFoc: false,
            partyName: e.supplier || (isPo ? 'Registered Supplier' : 'Direct / Manual Receipt'),
            date: e.timestamp,
            qty: Number(e.quantity || 0),
            receivedBy: e.receivedBy || 'Storekeeper',
            notes: e.notes || '',
            badgeColor: isPo
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-sky-50 text-sky-800 border-sky-200',
          });
        });
    }

    initialCentralFocReceipts.forEach((f) => {
      records.push({
        id: `foc-${f.id}`,
        refNo: f.voucherNo,
        sourceType: 'Client FOC',
        isCentralFoc: true,
        partyName: `${f.clientName} (${f.projectName}) · DN: ${f.dispatchNoteNo}`,
        date: f.date,
        qty: f.qty,
        receivedBy: f.receivedBy,
        notes: `Allocated Site: ${f.assignedSiteName} · Stored at: ${f.storageLocation}`,
        badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      });
    });

    if (!focProjectId) {
      branchReturns
        .filter(
          (br) =>
            !br.isDeleted &&
            br.itemId === item.id &&
            (!br.toSiteId || mainWarehouseIds.has(br.toSiteId))
        )
        .forEach((br) => {
          records.push({
            id: `br-${br.id}`,
            refNo: br.branchReturnNumber,
            sourceType: 'Site Good Return',
            isCentralFoc: false,
            partyName: `Branch Return: ${br.siteName || br.fromSiteName || 'Site Branch'} (${br.condition})`,
            date: br.returnDate,
            qty: Number(br.quantity || 0),
            receivedBy: br.returnedBy || 'Site Supervisor',
            notes: br.reason || '',
            badgeColor:
              br.condition === 'Good / Restock'
                ? 'bg-teal-50 text-teal-800 border-teal-200'
                : 'bg-rose-50 text-rose-800 border-rose-200',
          });
        });
    }

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [mainStockEntries, initialCentralFocReceipts, branchReturns, mainWarehouseIds, item.id, focProjectId]);

  const inboundBreakdownTotals = useMemo(() => {
    let poReceivedQty = 0;
    let manualReceivedQty = 0;
    let focReceivedQty = 0;
    let siteGoodReturnedQty = 0;
    let siteDamagedReturnedQty = 0;

    mainStockEntries
      .filter((e) => e.itemId === item.id)
      .forEach((e) => {
        const isPo = e.entryType === 'Purchase' || (e.referenceNo || '').toUpperCase().startsWith('PO-');
        if (isPo) poReceivedQty += Number(e.quantity || 0);
        else manualReceivedQty += Number(e.quantity || 0);
      });

    focReceivedQty = initialCentralFocReceipts.reduce((sum, r) => sum + r.qty, 0);

    branchReturns
      .filter(
        (br) =>
          !br.isDeleted &&
          br.itemId === item.id &&
          (!br.toSiteId || mainWarehouseIds.has(br.toSiteId))
      )
      .forEach((br) => {
        if (br.condition === 'Good / Restock') siteGoodReturnedQty += Number(br.quantity || 0);
        else siteDamagedReturnedQty += Number(br.quantity || 0);
      });

    let totalPoOrderedQty = 0;
    purchaseOrders
      .filter((po) => !po.isDeleted && po.status !== 'Cancelled')
      .forEach((po) => {
        const line = (po.items || []).find((i) => i.itemId === item.id);
        if (line) totalPoOrderedQty += Number(line.quantity || 0);
      });

    return {
      poReceivedQty,
      manualReceivedQty,
      focReceivedQty,
      siteGoodReturnedQty,
      siteDamagedReturnedQty,
      totalPoOrderedQty,
    };
  }, [mainStockEntries, initialCentralFocReceipts, branchReturns, purchaseOrders, mainWarehouseIds, item.id]);

  // 3. BRANCH & SUB-SITE BREAKDOWN
  const siteBranchBreakdown = useMemo(() => {
    const branchSites = sortSitesHierarchically(activeSites.filter((s) => !s.isMainWarehouse));

    return branchSites
      .map((site) => {
        const sStock = getSiteItemStock(site.id, item.id);
        const sDamaged = getSiteDamagedStock(site.id, item.id);
        const siteIsSub = isSubSite(site);
        const parentObj = siteIsSub ? getParentSite(site, sites) : undefined;

        let receivedFromHqOnly = 0;
        let receivedFromParentBranch = 0;
        let inTransitFromHq = 0;
        let inTransitFromParent = 0;

        stockRequests
          .filter(
            (req) =>
              req.siteId === site.id &&
              (req.status === 'Accepted' || req.status === 'Approved / In-Transit')
          )
          .forEach((req) => {
            const row = (req.items || []).find((r) => r.itemId === item.id);
            if (!row) return;
            const qty =
              req.status === 'Accepted'
                ? Number(row.receivedQty ?? row.approvedQty ?? row.requestedQty ?? 0)
                : Number(row.approvedQty ?? row.requestedQty ?? 0);
            if (qty <= 0) return;

            const isFromParent = Boolean(req.sourceSiteId && !mainWarehouseIds.has(req.sourceSiteId));
            if (isFromParent) {
              receivedFromParentBranch += qty;
              if (req.status === 'Approved / In-Transit') inTransitFromParent += qty;
            } else {
              receivedFromHqOnly += qty;
              if (req.status === 'Approved / In-Transit') inTransitFromHq += qty;
            }
          });

        const siteNameLower = (site.name || '').trim().toLowerCase();
        if (siteNameLower) {
          clientFreeIssues
            .filter(
              (v) =>
                !v.isDeleted &&
                v.storageLocation &&
                v.storageLocation.trim().toLowerCase() === siteNameLower
            )
            .forEach((v) => {
              const row = (v.items || []).find((it) => it.itemId === item.id);
              if (row && Number(row.quantity) > 0) {
                receivedFromHqOnly += Number(row.quantity);
              }
            });
        }

        const inTransitQty = inTransitFromHq + inTransitFromParent;

        let returnedToHqGood = 0;
        let returnedToHqDamaged = 0;
        let returnedToParentGood = 0;
        let returnedToParentDamaged = 0;

        branchReturns
          .filter(
            (br) =>
              !br.isDeleted &&
              (br.fromSiteId === site.id || br.siteId === site.id) &&
              br.itemId === item.id
          )
          .forEach((br) => {
            const q = Number(br.quantity || 0);
            const destIsHq = !br.toSiteId || mainWarehouseIds.has(br.toSiteId);
            if (destIsHq) {
              if (br.condition === 'Good / Restock') returnedToHqGood += q;
              else returnedToHqDamaged += q;
            } else {
              if (br.condition === 'Good / Restock') returnedToParentGood += q;
              else returnedToParentDamaged += q;
            }
          });

        const returnedFromSubSitesDamaged = branchReturns
          .filter(
            (br) =>
              !br.isDeleted &&
              br.toSiteId === site.id &&
              br.itemId === item.id &&
              br.condition === 'Damaged / Scrap'
          )
          .reduce((sum, br) => sum + Number(br.quantity || 0), 0);

        const siteTeamsInHand = allTeamsInHandStock
          .filter((ts) => ts.site?.id === site.id)
          .reduce((sum, ts) => {
            const found = ts.items.find((i) => i.itemId === item.id);
            return sum + (found ? Number(found.currentInHand || 0) : 0);
          }, 0);

        let siteUsedQty = 0;
        let siteWastedQty = 0;
        projectUsages
          .filter((u) => !u.isDeleted && u.siteId === site.id)
          .forEach((u) => {
            const row = (u.items || []).find((i) => i.itemId === item.id);
            if (row) {
              siteUsedQty += Number(row.quantity || 0);
              siteWastedQty += Number(row.wastageQuantity || 0);
            }
          });

        const teamDamagedRet = sDamaged.teamDamagedReturned;
        const upstreamReturnedGood = returnedToHqGood + returnedToParentGood;
        const upstreamReturnedDamaged = returnedToHqDamaged + returnedToParentDamaged;

        const hasAnyActivity =
          sStock.received > 0 ||
          inTransitQty > 0 ||
          sStock.issued > 0 ||
          sStock.returned > 0 ||
          sStock.issuedToSubSites > 0 ||
          sStock.returnedFromSubSitesGood > 0 ||
          returnedFromSubSitesDamaged > 0 ||
          sStock.availableBalance > 0 ||
          sDamaged.availableDamagedBalance > 0 ||
          siteTeamsInHand > 0 ||
          siteUsedQty > 0 ||
          siteWastedQty > 0 ||
          upstreamReturnedGood > 0 ||
          upstreamReturnedDamaged > 0;

        return {
          site,
          tier: siteIsSub ? ('subsite' as const) : ('regional' as const),
          parentSiteObj: parentObj,
          parentSiteId: site.parentSiteId || parentObj?.id || '',
          parentSiteName: parentObj?.name || site.parentSiteName || '',
          receivedTotal: sStock.received,
          receivedFromHq: receivedFromHqOnly,
          receivedFromParentBranch,
          normalReceived: sStock.normalReceived,
          focReceived: sStock.focReceived,
          inTransitQty,
          inTransitFromHq,
          inTransitFromParent,
          issuedToTeams: sStock.issued,
          returnedFromTeams: sStock.returned,
          teamDamagedRet,
          issuedToSubSites: sStock.issuedToSubSites,
          returnedFromSubSitesGood: sStock.returnedFromSubSitesGood,
          returnedFromSubSitesDamaged,
          returnedToHqGood,
          returnedToHqDamaged,
          returnedToParentGood,
          returnedToParentDamaged,
          upstreamReturnedGood,
          upstreamReturnedDamaged,
          siteInHand: sStock.availableBalance,
          siteDamagedQuarantine: sDamaged.availableDamagedBalance,
          siteTeamsInHand,
          siteUsedQty,
          siteWastedQty,
          hasAnyActivity,
        };
      })
      .filter((row) => {
        if (mode === 'site' && siteId) {
          if (row.site.id === siteId) return true;
          if (!isSubSiteView && row.parentSiteId === siteId) return true;
          return false;
        }
        return row.hasAnyActivity;
      });
  }, [
    activeSites,
    sites,
    getSiteItemStock,
    getSiteDamagedStock,
    item.id,
    branchReturns,
    stockRequests,
    clientFreeIssues,
    allTeamsInHandStock,
    projectUsages,
    mainWarehouseIds,
    mode,
    siteId,
    isSubSiteView,
  ]);

  const regionalBranchRows = useMemo(
    () => siteBranchBreakdown.filter((r) => r.tier === 'regional'),
    [siteBranchBreakdown]
  );

  const subSiteBranchRows = useMemo(
    () => siteBranchBreakdown.filter((r) => r.tier === 'subsite'),
    [siteBranchBreakdown]
  );

  const targetSiteBreakdownRow = useMemo(
    () => (mode === 'site' && siteId ? siteBranchBreakdown.find((r) => r.site.id === siteId) || null : null),
    [siteBranchBreakdown, mode, siteId]
  );

  const childSubSiteRows = useMemo(
    () =>
      mode === 'site' && siteId && !isSubSiteView
        ? subSiteBranchRows.filter((r) => r.parentSiteId === siteId)
        : [],
    [subSiteBranchRows, mode, siteId, isSubSiteView]
  );

  // TRANSFERS (HQ -> Site AND Regional -> Sub-Site)
  const allSiteTransfers = useMemo(() => {
    const list: Array<{
      id: string;
      voucherNo: string;
      date: string;
      sourceSiteId: string;
      sourceSiteName: string;
      isFromParentBranch: boolean;
      targetSiteId: string;
      siteName: string;
      targetIsSubSite: boolean;
      category: string;
      isCentralFoc: boolean;
      focProjectLabel?: string;
      status: string;
      qty: number;
      byUser: string;
    }> = [];

    const companyGrnReceivedForItem = mainStockEntries
      .filter((e) => e.itemId === item.id)
      .reduce((sum, e) => sum + Number(e.quantity || 0), 0);

    const totalInitialFocQty = initialCentralFocReceipts.reduce((s, r) => s + r.qty, 0);
    const hasSiteFocForThisSite =
      mode === 'central' || (siteId ? getSiteItemStock(siteId, item.id).focReceived > 0 : false);
    const isExclusiveFocItem =
      hasSiteFocForThisSite && totalInitialFocQty > 0 && companyGrnReceivedForItem === 0;

    stockRequests
      .filter((req) => req.status === 'Accepted' || req.status === 'Approved / In-Transit')
      .forEach((req) => {
        const row = (req.items || []).find((i) => i.itemId === item.id);
        if (!row) return;
        const qty =
          req.status === 'Accepted'
            ? Number(row.receivedQty ?? row.approvedQty ?? row.requestedQty ?? 0)
            : Number(row.approvedQty ?? row.requestedQty ?? 0);
        if (qty <= 0) return;

        const isFromParent = Boolean(req.sourceSiteId && !mainWarehouseIds.has(req.sourceSiteId));
        const srcSiteObj = req.sourceSiteId ? sites.find((s) => s.id === req.sourceSiteId) : undefined;
        const mainWh = sites.find((s) => s.isMainWarehouse);
        const sourceSiteName =
          srcSiteObj?.name || req.sourceSiteName || mainWh?.name || 'Main Central Warehouse';

        const destSiteObj = sites.find((s) => s.id === req.siteId);
        const sName = destSiteObj?.name || 'Site Branch';
        const targetIsSub = Boolean(destSiteObj && isSubSite(destSiteObj));

        if (mode === 'site' && siteId && req.siteId !== siteId && req.sourceSiteId !== siteId) {
          return;
        }

        let isFocReq = req.requestCategory === 'foc' || Boolean(req.focProjectId) || isExclusiveFocItem;
        if (!isFocReq && req.purpose && focProjectFamily.familyNamesLower.size > 0) {
          const pLow = req.purpose.trim().toLowerCase();
          for (const fName of focProjectFamily.familyNamesLower) {
            if (fName.length >= 3 && pLow.includes(fName)) {
              isFocReq = true;
              break;
            }
          }
        }

        if (focProjectId && isFocReq && req.focProjectId && !focProjectFamily.familyIds.has(req.focProjectId)) {
          return;
        }

        const projLabel =
          req.focProjectName ||
          targetFocProject?.projectName ||
          initialCentralFocReceipts[0]?.projectName ||
          'Assigned Project';

        list.push({
          id: req.id,
          voucherNo: req.requestNoteNumber,
          date: req.acceptanceDate || req.approvalDate || req.requestedDate,
          sourceSiteId: req.sourceSiteId || mainWh?.id || 'hq',
          sourceSiteName,
          isFromParentBranch: isFromParent,
          targetSiteId: req.siteId,
          siteName: sName,
          targetIsSubSite: targetIsSub,
          category: isFocReq
            ? `Central FOC (${projLabel})`
            : isFromParent
            ? 'Parent Regional → Sub-Site Issue'
            : 'Normal HQ Stock Transfer',
          isCentralFoc: isFocReq,
          focProjectLabel: isFocReq ? projLabel : undefined,
          status: req.status,
          qty,
          byUser: req.acceptedBy || req.approvedBy || req.requestedBy,
        });
      });

    const hasFocRequisition = list.some((tr) => tr.isCentralFoc);
    if (!hasFocRequisition) {
      const mainWarehouse = sites.find((s) => s.isMainWarehouse);
      const mainWhNameLower = (mainWarehouse?.name || 'main central warehouse').trim().toLowerCase();
      initialCentralFocReceipts.forEach((f) => {
        const locLower = (f.storageLocation || '').trim().toLowerCase();
        const isStoredAtCentral =
          !locLower ||
          locLower.includes('main') ||
          locLower.includes('central') ||
          locLower === mainWhNameLower;
        if (!isStoredAtCentral) {
          const matchedSite = sites.find(
            (s) => s.name.trim().toLowerCase() === f.assignedSiteName.trim().toLowerCase()
          );
          if (mode === 'site' && siteId && matchedSite?.id !== siteId) return;
          list.push({
            id: `foc-direct-${f.id}`,
            voucherNo: f.voucherNo,
            date: f.date,
            sourceSiteId: mainWarehouse?.id || 'hq',
            sourceSiteName: mainWarehouse?.name || 'Main Central Warehouse',
            isFromParentBranch: false,
            targetSiteId: matchedSite?.id || '',
            siteName: f.assignedSiteName,
            targetIsSubSite: Boolean(matchedSite && isSubSite(matchedSite)),
            category: `Central FOC Direct Receipt (${f.clientName} — ${f.projectName})`,
            isCentralFoc: true,
            focProjectLabel: f.projectName,
            status: 'Accepted at Site',
            qty: f.qty,
            byUser: f.receivedBy,
          });
        }
      });
    }

    return list.sort((a, b) => {
      if (a.isCentralFoc !== b.isCentralFoc) return a.isCentralFoc ? -1 : 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [
    stockRequests,
    mainStockEntries,
    initialCentralFocReceipts,
    focProjectFamily,
    focProjectId,
    targetFocProject,
    sites,
    mainWarehouseIds,
    item.id,
    siteId,
    mode,
    getSiteItemStock,
  ]);

  const siteInboundTransfers = useMemo(() => {
    if (mode === 'site' && siteId) {
      return allSiteTransfers.filter((tr) => tr.targetSiteId === siteId);
    }
    return allSiteTransfers.filter((tr) => !tr.isFromParentBranch);
  }, [allSiteTransfers, mode, siteId]);

  // Parent Regional -> Sub-Site Dispatch Vouchers
  const subSiteDispatchTransfers = useMemo(() => {
    if (mode === 'site' && siteId) {
      if (isSubSiteView) {
        return allSiteTransfers.filter((tr) => tr.targetSiteId === siteId && tr.isFromParentBranch);
      }
      return allSiteTransfers.filter((tr) => tr.sourceSiteId === siteId && tr.isFromParentBranch);
    }
    return allSiteTransfers.filter((tr) => tr.isFromParentBranch);
  }, [allSiteTransfers, mode, siteId, isSubSiteView]);

  // Branch Return Merchandise (BRM) Log
  const branchReturnRecords = useMemo(() => {
    const mainWh = sites.find((s) => s.isMainWarehouse);
    return branchReturns
      .filter((br) => {
        if (br.isDeleted || br.itemId !== item.id) return false;
        const fromId = br.fromSiteId || br.siteId;
        if (mode === 'site' && siteId) {
          return fromId === siteId || br.toSiteId === siteId;
        }
        return true;
      })
      .map((br) => {
        const fromId = br.fromSiteId || br.siteId;
        const fromSite = sites.find((s) => s.id === fromId);
        const destId = br.toSiteId || mainWh?.id || '';
        const destSite = destId ? sites.find((s) => s.id === destId) : mainWh;
        const isSubSiteToParent = Boolean(
          (fromSite && isSubSite(fromSite)) || (br.toSiteId && !mainWarehouseIds.has(br.toSiteId))
        );
        return {
          id: br.id,
          brmNo: br.branchReturnNumber,
          date: br.returnDate,
          fromSiteId: fromId,
          fromSiteName: br.fromSiteName || br.siteName || fromSite?.name || 'Branch Site',
          toSiteId: destId,
          toSiteName: br.toSiteName || destSite?.name || 'Main Central Warehouse',
          isSubSiteToParent,
          condition: br.condition,
          qty: Number(br.quantity || 0),
          returnedBy: br.returnedBy || 'Supervisor',
          reason: br.reason || '',
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [branchReturns, sites, mainWarehouseIds, item.id, mode, siteId]);

  // FIELD TEAMS BREAKDOWN
  const teamBreakdown = useMemo(() => {
    const relevantTeams = activeTeams.filter((t) => {
      if (mode === 'site' && siteId) {
        if (t.assignedSiteId === siteId) return true;
        const hadSiteIssue = teamIssues.some(
          (iss) => iss.teamId === t.id && iss.siteId === siteId && (iss.items || []).some((i) => i.itemId === item.id)
        );
        const hadSiteUsage = projectUsages.some(
          (u) => !u.isDeleted && u.teamId === t.id && u.siteId === siteId && (u.items || []).some((i) => i.itemId === item.id)
        );
        return hadSiteIssue || hadSiteUsage;
      }
      return true;
    });

    return relevantTeams
      .map((team) => {
        const siteObj = sites.find((s) => s.id === team.assignedSiteId);
        const teamOnSubSite = Boolean(siteObj && isSubSite(siteObj));
        const teamParentSite = teamOnSubSite && siteObj ? getParentSite(siteObj, sites) : undefined;

        const issuedQty = teamIssues
          .filter(
            (iss) =>
              iss.teamId === team.id &&
              (mode === 'central' || !siteId || iss.siteId === siteId)
          )
          .reduce((sum, iss) => {
            const row = (iss.items || []).find((i) => i.itemId === item.id);
            return sum + (row ? Number(row.quantity || 0) : 0);
          }, 0);

        const returnedGoodQty = teamReturns
          .filter(
            (ret) =>
              ret.teamId === team.id &&
              ret.itemId === item.id &&
              ret.condition === 'Good / Restock' &&
              (mode === 'central' || !siteId || ret.siteId === siteId)
          )
          .reduce((sum, ret) => sum + Number(ret.quantity || 0), 0);

        const returnedDamagedQty = teamReturns
          .filter(
            (ret) =>
              ret.teamId === team.id &&
              ret.itemId === item.id &&
              ret.condition === 'Damaged / Scrap' &&
              (mode === 'central' || !siteId || ret.siteId === siteId)
          )
          .reduce((sum, ret) => sum + Number(ret.quantity || 0), 0);

        let usedQty = 0;
        let wastedQty = 0;
        projectUsages
          .filter(
            (u) =>
              !u.isDeleted &&
              u.teamId === team.id &&
              (mode === 'central' || !siteId || u.siteId === siteId) &&
              (!focProjectId ||
                focProjectFamily.familyIds.has(u.projectId) ||
                Boolean(u.parentProjectId && focProjectFamily.familyIds.has(u.parentProjectId)))
          )
          .forEach((u) => {
            const row = (u.items || []).find((i) => i.itemId === item.id);
            if (row) {
              usedQty += Number(row.quantity || 0);
              wastedQty += Number(row.wastageQuantity || 0);
            }
          });

        const summaryObj = allTeamsInHandStock.find((ts) => ts.team.id === team.id);
        const itemSummary = summaryObj?.items.find((i) => i.itemId === item.id);
        const inHandQty =
          mode === 'central' && !focProjectId && itemSummary
            ? itemSummary.currentInHand
            : Math.max(0, issuedQty - returnedGoodQty - returnedDamagedQty - usedQty - wastedQty);

        const hasActivity =
          issuedQty > 0 ||
          returnedGoodQty > 0 ||
          returnedDamagedQty > 0 ||
          usedQty > 0 ||
          wastedQty > 0 ||
          inHandQty > 0;

        return {
          team,
          siteName: siteObj?.name || 'Unassigned Site',
          isSubSiteTeam: teamOnSubSite,
          parentSiteName: teamParentSite?.name || siteObj?.parentSiteName || '',
          issuedQty,
          returnedGoodQty,
          returnedDamagedQty,
          usedQty,
          wastedQty,
          inHandQty,
          hasActivity,
        };
      })
      .filter((r) => r.hasActivity);
  }, [
    activeTeams,
    sites,
    teamIssues,
    teamReturns,
    projectUsages,
    allTeamsInHandStock,
    item.id,
    mode,
    siteId,
    focProjectId,
    focProjectFamily,
  ]);

  const [selectedSubProjectFilter, setSelectedSubProjectFilter] = useState<string>('all');

  // PROJECT CONSUMPTION & WASTAGE LOGS
  const projectUsageLogs = useMemo(() => {
    const logs: Array<{
      id: string;
      voucherNo: string;
      date: string;
      projectId: string;
      projectCode: string;
      projectName: string;
      siteId: string;
      siteName: string;
      siteIsSubSite: boolean;
      teamName: string;
      usedQty: number;
      wastedQty: number;
      totalDeducted: number;
      workDetails: string;
    }> = [];

    projectUsages
      .filter(
        (u) =>
          !u.isDeleted &&
          (mode === 'central' || !siteId || u.siteId === siteId) &&
          (!focProjectId ||
            focProjectFamily.familyIds.has(u.projectId) ||
            Boolean(u.parentProjectId && focProjectFamily.familyIds.has(u.parentProjectId)))
      )
      .forEach((u) => {
        const row = (u.items || []).find((i) => i.itemId === item.id);
        if (!row) return;
        const usedQty = Number(row.quantity || 0);
        const wastedQty = Number(row.wastageQuantity || 0);
        if (usedQty <= 0 && wastedQty <= 0) return;

        const proj = projects.find((p) => p.id === u.projectId);
        const siteObj = sites.find((s) => s.id === u.siteId);
        const sName = siteObj?.name || 'Site Branch';
        const tName =
          u.teamName || teams.find((t) => t.id === u.teamId)?.teamName || 'Field Team';

        logs.push({
          id: u.id,
          voucherNo: u.usageVoucherNumber,
          date: u.usageDate || u.date,
          projectId: u.projectId,
          projectCode: proj?.projectId || 'PRJ',
          projectName: u.projectName || proj?.projectName || 'Project Installation',
          siteId: u.siteId,
          siteName: sName,
          siteIsSubSite: Boolean(siteObj && isSubSite(siteObj)),
          teamName: tName,
          usedQty,
          wastedQty,
          totalDeducted: usedQty + wastedQty,
          workDetails: u.workDetails || '',
        });
      });

    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [projectUsages, projects, sites, teams, item.id, mode, siteId, focProjectId, focProjectFamily]);

  // SUB-PROJECT SEQUENTIAL FLOW SECTIONS
  const subProjectFlowSections = useMemo(() => {
    const rootId = focProjectFamily.rootProjectId;
    const childSubProjs = rootId
      ? projects.filter((p) => !p.isDeleted && p.parentProjectId === rootId)
      : [];

    const distinctProjs =
      childSubProjs.length > 0
        ? childSubProjs
        : Array.from(
            new Map(
              projectUsageLogs
                .map((l) => projects.find((p) => p.id === l.projectId))
                .filter((p): p is NonNullable<typeof p> => Boolean(p))
                .map((p) => [p.id, p])
            ).values()
          );

    const stage1CentralFoc = initialCentralFocReceipts.reduce((s, r) => s + r.qty, 0);
    const stage2SiteFoc = siteInboundTransfers
      .filter((tr) => tr.isCentralFoc)
      .reduce((s, tr) => s + tr.qty, 0);
    const effectiveSitePool = stage2SiteFoc > 0 ? stage2SiteFoc : stage1CentralFoc;

    let runningConsumed = 0;
    return distinctProjs.map((sp, idx) => {
      const spLogs = projectUsageLogs.filter((l) => l.projectId === sp.id);
      const spUsed = spLogs.reduce((s, l) => s + l.usedQty, 0);
      const spWastage = spLogs.reduce((s, l) => s + l.wastedQty, 0);
      const spTotalConsumed = spUsed + spWastage;

      const openingPoolBefore = Math.max(0, effectiveSitePool - runningConsumed);
      const closingPoolAfter = Math.max(0, openingPoolBefore - spTotalConsumed);
      const closingClientPoolAfter = Math.max(0, stage1CentralFoc - (runningConsumed + spTotalConsumed));
      runningConsumed += spTotalConsumed;

      return {
        subProject: sp,
        orderIndex: idx + 1,
        stage1CentralFoc,
        stage2SiteFoc: effectiveSitePool,
        openingPoolBefore,
        spUsed,
        spWastage,
        spTotalConsumed,
        closingPoolAfter,
        closingClientPoolAfter,
        spLogs,
      };
    });
  }, [
    focProjectFamily.rootProjectId,
    projects,
    projectUsageLogs,
    initialCentralFocReceipts,
    siteInboundTransfers,
  ]);

  // AGGREGATE TOTALS
  const grandTotals = useMemo(() => {
    const regionalSitesCount = regionalBranchRows.length;
    const subSitesCount = subSiteBranchRows.length;

    const hqToRegionalIssued = regionalBranchRows.reduce((s, r) => s + r.receivedFromHq, 0);
    const hqToSubSiteDirectIssued = subSiteBranchRows.reduce((s, r) => s + r.receivedFromHq, 0);
    const regionalToSubSiteIssued = regionalBranchRows.reduce((s, r) => s + r.issuedToSubSites, 0);
    const subSiteFromParentReceived = subSiteBranchRows.reduce((s, r) => s + r.receivedFromParentBranch, 0);
    const subSiteTotalReceived = subSiteBranchRows.reduce((s, r) => s + r.receivedTotal, 0);
    const subSiteToRegionalReturnedGood = regionalBranchRows.reduce((s, r) => s + r.returnedFromSubSitesGood, 0);
    const subSiteToRegionalReturnedDamaged = regionalBranchRows.reduce((s, r) => s + r.returnedFromSubSitesDamaged, 0);

    const regionalSitesYardInHand = regionalBranchRows.reduce((s, r) => s + r.siteInHand, 0);
    const subSitesYardInHand = subSiteBranchRows.reduce((s, r) => s + r.siteInHand, 0);
    const allSitesInHand =
      mode === 'site' && siteId
        ? targetSiteBreakdownRow?.siteInHand || 0
        : regionalSitesYardInHand + subSitesYardInHand;

    const allSitesInTransit = siteBranchBreakdown.reduce((s, r) => s + r.inTransitQty, 0);
    const allTeamsInHand = teamBreakdown.reduce((s, r) => s + r.inHandQty, 0);
    const totalIssuedToTeams = teamBreakdown.reduce((s, r) => s + r.issuedQty, 0);
    const totalUsedOnProjects = projectUsageLogs.reduce((s, r) => s + r.usedQty, 0);
    const totalWastedOnProjects = projectUsageLogs.reduce((s, r) => s + r.wastedQty, 0);
    const totalTeamDamagedReturns = teamBreakdown.reduce((s, r) => s + r.returnedDamagedQty, 0);
    const totalTeamGoodReturns = teamBreakdown.reduce((s, r) => s + r.returnedGoodQty, 0);

    // Child Sub-Sites cluster rollup (used in Regional Site Branch view)
    const subSitesClusterReceivedFromParent = childSubSiteRows.reduce((s, r) => s + r.receivedFromParentBranch, 0);
    const subSitesClusterTeamsIssued = childSubSiteRows.reduce((s, r) => s + r.issuedToTeams, 0);
    const subSitesClusterTeamsInHand = childSubSiteRows.reduce((s, r) => s + r.siteTeamsInHand, 0);
    const subSitesClusterUsed = childSubSiteRows.reduce((s, r) => s + r.siteUsedQty, 0);
    const subSitesClusterWasted = childSubSiteRows.reduce(
      (s, r) => s + r.siteWastedQty + r.teamDamagedRet,
      0
    );
    const subSitesClusterYardInHand = childSubSiteRows.reduce((s, r) => s + r.siteInHand, 0);

    const totalRtvQty = supplierReturns
      .filter(
        (rtv) =>
          !rtv.isDeleted &&
          rtv.status !== 'Cancelled' &&
          (mode === 'central' || !siteId || rtv.siteId === siteId)
      )
      .reduce((sum, rtv) => {
        const row = (rtv.items || []).find((i) => i.itemId === item.id);
        return sum + (row ? Number(row.quantity || 0) : 0);
      }, 0);

    const siteSpecificStock = siteId ? getSiteItemStock(siteId, item.id) : null;
    const siteDamagedStock = siteId ? getSiteDamagedStock(siteId, item.id) : null;

    const stage1InitialCentralFoc = initialCentralFocReceipts.reduce((s, r) => s + r.qty, 0);
    const stage2SiteFocIssued = siteInboundTransfers
      .filter((tr) => tr.isCentralFoc)
      .reduce((s, tr) => s + tr.qty, 0);
    const stage2SiteNormalIssued = siteInboundTransfers
      .filter((tr) => !tr.isCentralFoc)
      .reduce((s, tr) => s + tr.qty, 0);

    const effectiveSiteFocIssued =
      stage2SiteFocIssued > 0
        ? stage2SiteFocIssued
        : siteSpecificStock?.focReceived || 0;

    const effectiveSiteNormalIssued =
      stage2SiteNormalIssued > 0
        ? stage2SiteNormalIssued
        : siteSpecificStock?.normalReceived || 0;

    const centralFocPoolRemaining = Math.max(0, mainStock.focReceived - mainStock.focDispatched);

    const stage3TeamIssued = totalIssuedToTeams;
    const stage3TeamReturnedGood = totalTeamGoodReturns;
    const stage3NetTeamIssued = Math.max(0, stage3TeamIssued - stage3TeamReturnedGood);

    const stage4Used = totalUsedOnProjects;
    const stage4Wastage = totalWastedOnProjects + totalTeamDamagedReturns;
    const stage4TotalConsumed = stage4Used + stage4Wastage;

    const clusterTotalUsed = stage4Used + subSitesClusterUsed;
    const clusterTotalWastage = stage4Wastage + subSitesClusterWasted;
    const clusterTotalConsumed = clusterTotalUsed + clusterTotalWastage;

    const upstreamReturnedGood = targetSiteBreakdownRow?.upstreamReturnedGood || 0;
    const upstreamReturnedDamaged = targetSiteBreakdownRow?.upstreamReturnedDamaged || 0;

    const consumedForFoc =
      mode === 'site' && !isSubSiteView && childSubSiteRows.length > 0
        ? clusterTotalConsumed
        : stage4TotalConsumed;

    const focConsumedAtSite =
      effectiveSiteFocIssued > 0 ? Math.min(effectiveSiteFocIssued, consumedForFoc) : 0;
    const stage5SiteFocReturnableBalance = Math.max(
      0,
      effectiveSiteFocIssued - focConsumedAtSite - upstreamReturnedGood
    );
    const stage5TotalProjectReturnableToClient = Math.max(
      0,
      stage1InitialCentralFoc - consumedForFoc
    );

    const normalConsumedAtSite = Math.max(0, consumedForFoc - focConsumedAtSite);
    const siteNormalRemainingBalance = Math.max(
      0,
      effectiveSiteNormalIssued -
        normalConsumedAtSite -
        (targetSiteBreakdownRow?.issuedToSubSites || 0) +
        (targetSiteBreakdownRow?.returnedFromSubSitesGood || 0) -
        upstreamReturnedGood
    );

    const hasFocFlow =
      Boolean(focProjectId) ||
      (mode === 'site'
        ? effectiveSiteFocIssued > 0
        : stage1InitialCentralFoc > 0 || effectiveSiteFocIssued > 0);

    const totalSystemRemainingAllTiers =
      mainStock.availableBalance +
      regionalSitesYardInHand +
      subSitesYardInHand +
      allTeamsInHand;

    return {
      centralInHand: mainStock.availableBalance,
      centralNormalInHand: Math.max(0, mainStock.companyReceived - mainStock.companyDispatched),
      centralFocInHand: Math.max(0, mainStock.focReceived - mainStock.focDispatched),
      totalReceivedAtHq: mainStock.totalReceived,
      dispatchedFromHq: mainStock.dispatched,
      regionalSitesCount,
      subSitesCount,
      hqToRegionalIssued,
      hqToSubSiteDirectIssued,
      regionalToSubSiteIssued,
      subSiteFromParentReceived,
      subSiteTotalReceived,
      subSiteToRegionalReturnedGood,
      subSiteToRegionalReturnedDamaged,
      regionalSitesYardInHand,
      subSitesYardInHand,
      allSitesInHand,
      allSitesInTransit,
      allTeamsInHand,
      totalIssuedToTeams,
      totalUsedOnProjects,
      totalWastedOnProjects,
      totalTeamDamagedReturns,
      totalTeamGoodReturns,
      totalWasteAndDamage: totalWastedOnProjects + totalTeamDamagedReturns,
      totalRtvQty,
      siteSpecificStock,
      siteDamagedStock,
      subSitesClusterReceivedFromParent,
      subSitesClusterTeamsIssued,
      subSitesClusterTeamsInHand,
      subSitesClusterUsed,
      subSitesClusterWasted,
      subSitesClusterYardInHand,
      clusterTotalUsed,
      clusterTotalWastage,
      clusterTotalConsumed,
      upstreamReturnedGood,
      upstreamReturnedDamaged,
      receivedFromParentQty: targetSiteBreakdownRow?.receivedFromParentBranch || 0,
      receivedFromHqDirectQty: targetSiteBreakdownRow?.receivedFromHq || 0,
      hasFocFlow,
      stage1InitialCentralFoc,
      effectiveSiteFocIssued,
      effectiveSiteNormalIssued,
      centralFocPoolRemaining,
      stage3TeamIssued,
      stage3TeamReturnedGood,
      stage3NetTeamIssued,
      stage4Used,
      stage4Wastage,
      stage4TotalConsumed,
      stage5SiteFocReturnableBalance,
      stage5TotalProjectReturnableToClient,
      siteNormalRemainingBalance,
      totalSystemRemainingAllTiers,
    };
  }, [
    regionalBranchRows,
    subSiteBranchRows,
    siteBranchBreakdown,
    childSubSiteRows,
    targetSiteBreakdownRow,
    teamBreakdown,
    projectUsageLogs,
    supplierReturns,
    mainStock,
    getSiteItemStock,
    getSiteDamagedStock,
    siteId,
    item.id,
    mode,
    isSubSiteView,
    initialCentralFocReceipts,
    siteInboundTransfers,
    focProjectId,
  ]);

  // CORE FLOW DECISION:
  // If goods were issued to Sub-Sites (or Sub-Sites received stock / Parent->Sub-Site activity exists),
  // render the 6-Step Flow:
  //   1. Main Central -> 2. Regional -> 3. Sub-Site -> 4. Team -> 5. Usage & Wastage -> 6. Total Balance
  // Otherwise, render the classic 5-Step Flow:
  //   1. Main Central -> 2. Regional / Site -> 3. Team -> 4. Usage & Wastage -> 5. Total Balance
  const hasSubSiteStep = useMemo(() => {
    if (mode === 'central') {
      return (
        grandTotals.regionalToSubSiteIssued > 0 ||
        grandTotals.subSiteTotalReceived > 0 ||
        subSiteBranchRows.length > 0 ||
        subSiteDispatchTransfers.length > 0
      );
    }
    if (isSubSiteView) {
      return grandTotals.receivedFromParentQty > 0 || subSiteDispatchTransfers.length > 0;
    }
    return (
      (targetSiteBreakdownRow?.issuedToSubSites || 0) > 0 ||
      (targetSiteBreakdownRow?.returnedFromSubSitesGood || 0) > 0 ||
      (targetSiteBreakdownRow?.returnedFromSubSitesDamaged || 0) > 0 ||
      subSiteDispatchTransfers.length > 0
    );
  }, [
    mode,
    isSubSiteView,
    grandTotals.regionalToSubSiteIssued,
    grandTotals.subSiteTotalReceived,
    grandTotals.receivedFromParentQty,
    subSiteBranchRows.length,
    subSiteDispatchTransfers.length,
    targetSiteBreakdownRow,
  ]);

  // Strict Sequential Step Numbering
  const stepNo = useMemo(() => {
    if (hasSubSiteStep) {
      return {
        central: 1,
        regional: 2,
        subSite: 3,
        team: 4,
        usage: 5,
        balance: 6,
        totalSteps: 6,
      };
    }
    return {
      central: 1,
      regional: 2,
      subSite: null as number | null,
      team: 3,
      usage: 4,
      balance: 5,
      totalSteps: 5,
    };
  }, [hasSubSiteStep]);

  const effectiveSubView = activeSubView === 'subsites' && !hasSubSiteStep ? 'overview' : activeSubView;

  const handlePrintReport = async () => {
    const safeCode = (item.itemCode || 'ITEM').replace(/[^a-zA-Z0-9_-]/g, '_');
    const prefix = focProjectId
      ? `FOC_Reconciliation_${targetFocProject?.projectId || 'Project'}`
      : mode === 'central'
      ? 'Central_Stock_Item_Flow'
      : isSubSiteView
      ? `SubSite_Item_Flow_${targetSite?.name || 'SubSite'}`
      : `Regional_Branch_Item_Flow_${targetSite?.name || 'Branch'}`;
    await printHtmlElement(printElementId, `${prefix}_${safeCode}`);
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    setPdfNotice(null);
    try {
      const safeCode = (item.itemCode || 'ITEM').replace(/[^a-zA-Z0-9_-]/g, '_');
      const prefix = focProjectId
        ? `FOC_Reconciliation_${targetFocProject?.projectId || 'Project'}`
        : mode === 'central'
        ? 'Central_Item_Flow'
        : isSubSiteView
        ? `SubSite_Item_Flow_${targetSite?.name || 'SubSite'}`
        : `Regional_Item_Flow_${targetSite?.name || 'Branch'}`;
      const ok = await downloadElementAsPdf(printElementId, `${prefix}_${safeCode}`);
      if (ok) {
        setPdfNotice({
          type: 'success',
          text: `PDF downloaded: ${prefix}_${safeCode}.pdf`,
        });
      } else {
        setPdfNotice({
          type: 'error',
          text: 'Direct PDF download could not complete — opening Print dialog so you can Save as PDF.',
        });
        await printHtmlElement(printElementId, `${prefix}_${safeCode}`);
      }
    } catch {
      setPdfNotice({
        type: 'error',
        text: 'Failed to generate PDF. Please use Print A4 Item Report -> Save as PDF.',
      });
    } finally {
      setIsExportingPdf(false);
      setTimeout(() => setPdfNotice(null), 4500);
    }
  };

  const companyDisplayName =
    currentTenant?.companyName || config.companyName || 'Corporate Inventory & Asset Control';

  const displayedSiteTransfers = useMemo(() => {
    if (focProjectId) {
      const focOnly = siteInboundTransfers.filter((tr) => tr.isCentralFoc);
      return focOnly.length > 0 ? focOnly : siteInboundTransfers;
    }
    return siteInboundTransfers;
  }, [siteInboundTransfers, focProjectId]);

  const perspectiveTitle = useMemo(() => {
    if (focProjectId) {
      return `FOC ${stepNo.totalSteps}-Step Reconciliation — ${targetSite?.name || 'Main Central & Branches'}`;
    }
    if (mode === 'central') {
      return `Master Stock ${stepNo.totalSteps}-Step Item Flow & Custody Summary`;
    }
    if (isSubSiteView) {
      return `Sub-Site ${stepNo.totalSteps}-Step Traceability — ${targetSite?.name || 'Sub-Site'} (Under ${parentRegionalSite?.name || targetSite?.parentSiteName || 'Parent Branch'})`;
    }
    return `Regional Branch ${stepNo.totalSteps}-Step Traceability — ${targetSite?.name || 'Branch Yard'}`;
  }, [focProjectId, stepNo.totalSteps, mode, isSubSiteView, targetSite, parentRegionalSite]);

  const flowBreadcrumbText = useMemo(() => {
    if (hasSubSiteStep) {
      return '1. Main Central → 2. Regional → 3. Sub-Site → 4. Team → 5. Usage & Wastage → 6. Total Balance';
    }
    return '1. Main Central → 2. Regional / Site → 3. Team → 4. Usage & Wastage → 5. Total Balance';
  }, [hasSubSiteStep]);

  // Sub-sites summary rows for Step 3 section (Central shows all subSiteBranchRows; Regional shows childSubSiteRows)
  const displayedSubSiteRows = mode === 'central' ? subSiteBranchRows : childSubSiteRows;

  return (
    <div className="my-2 mx-2 rounded-2xl border-2 border-emerald-600/30 bg-gradient-to-b from-slate-50 via-white to-slate-50/90 shadow-lg overflow-hidden transition-all">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#071a12] via-[#0c2e20] to-[#134e35] text-white px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.itemName}
              className="w-12 h-12 rounded-xl object-cover border border-emerald-400/40 bg-white shrink-0 shadow-sm"
              title={`Item Image (${item.imageSizeKb ? `${item.imageSizeKb} KB` : '< 200KB'})`}
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-emerald-300" />
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-200 font-semibold">
              <span className="text-white font-extrabold tracking-tight">{perspectiveTitle}</span>
              {grandTotals.hasFocFlow && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-indigo-200 font-extrabold">
                    <Gift className="w-3.5 h-3.5 text-indigo-300" />
                    Central FOC
                  </span>
                </>
              )}
              {targetFocProject && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-indigo-200">
                    Project: [{targetFocProject.projectId}] {targetFocProject.projectName}
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="font-mono font-bold text-emerald-300">{item.itemCode}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300 font-medium">
                {item.category} ({item.unit})
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5 tracking-tight">
              {item.itemName}
            </h3>
            <p className="text-[11px] text-emerald-200/95 font-semibold mt-0.5">
              Flow: {flowBreadcrumbText}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/30 hover:bg-black/40 border border-amber-400/40 text-amber-200 text-xs font-bold cursor-pointer select-none whitespace-nowrap">
            <input
              type="checkbox"
              checked={printWithImage}
              onChange={(e) => setPrintWithImage(e.target.checked)}
              className="rounded border-amber-400 text-amber-500 focus:ring-amber-500"
            />
            <span>Print with Image</span>
          </label>
          <label
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer select-none transition-colors whitespace-nowrap ${
              offDigitalSignature
                ? 'bg-rose-500/25 border-rose-300 text-rose-100'
                : 'bg-black/30 hover:bg-black/40 border-white/25 text-slate-200'
            }`}
            title="Hide digital signatures and leave blank space for manual hand signing"
          >
            <input
              type="checkbox"
              checked={offDigitalSignature}
              onChange={(e) => setOffDigitalSignature(e.target.checked)}
              className="rounded border-slate-400 text-rose-500 focus:ring-rose-500"
            />
            <PenTool className="w-3.5 h-3.5 shrink-0" />
            <span>Off Digital Signature</span>
          </label>
          <button
            type="button"
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-sm transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            Print A4 Item Report
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            {isExportingPdf ? 'Generating PDF...' : 'Download PDF'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-white border border-white/15 text-xs font-bold transition-all cursor-pointer"
              title="Close Summary Panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Screen Content */}
      <div className="p-4 sm:p-5 space-y-5">
        {pdfNotice && (
          <div
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center justify-between gap-2 ${
              pdfNotice.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            <span>{pdfNotice.text}</span>
            <button
              type="button"
              onClick={() => setPdfNotice(null)}
              className="text-current opacity-70 hover:opacity-100 cursor-pointer"
              aria-label="Dismiss notice"
            >
              ✕
            </button>
          </div>
        )}

        {/* SEQUENTIAL VISUAL FLOW TRAIL STRIP */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border ${
            grandTotals.hasFocFlow
              ? 'bg-indigo-950 text-white border-indigo-800'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
            <span className="px-2 py-0.5 rounded bg-white/15 font-bold text-white">
              1. Main Central
            </span>
            <ArrowRight className="w-3 h-3 text-emerald-400" />
            <span className="px-2 py-0.5 rounded bg-blue-500/30 font-bold text-blue-100">
              2. {isSubSiteView ? `Regional (${parentRegionalSite?.name || 'Parent'})` : 'Regional'}
            </span>
            {hasSubSiteStep && (
              <>
                <ArrowRight className="w-3 h-3 text-sky-400" />
                <span className="px-2 py-0.5 rounded bg-sky-500/35 font-bold text-sky-100">
                  3. Sub-Site{isSubSiteView ? ` (${targetSite?.name})` : ''}
                </span>
              </>
            )}
            <ArrowRight className="w-3 h-3 text-indigo-400" />
            <span className="px-2 py-0.5 rounded bg-indigo-500/30 font-bold text-indigo-100">
              {stepNo.team}. Team
            </span>
            <ArrowRight className="w-3 h-3 text-amber-400" />
            <span className="px-2 py-0.5 rounded bg-amber-500/25 font-bold text-amber-100">
              {stepNo.usage}. Usage &amp; Wastage
            </span>
            <ArrowRight className="w-3 h-3 text-emerald-400" />
            <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-extrabold">
              {stepNo.balance}. Total Balance
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-300">
            {hasSubSiteStep ? '6-Step Sub-Site Flow' : '5-Step Direct Branch Flow'}
          </span>
        </div>

        {/* =================================================================== */}
        {/* ORDERED STEP FLOW CARDS (5 STEPS OR 6 STEPS WHEN SUB-SITE ISSUE EXISTS) */}
        {/* =================================================================== */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            hasSubSiteStep ? 'lg:grid-cols-6' : 'lg:grid-cols-5'
          } gap-3`}
        >
          {/* STEP 1: MAIN CENTRAL */}
          {grandTotals.hasFocFlow ? (
            <div className="bg-indigo-50/80 p-3.5 rounded-xl border-2 border-indigo-400/70 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-indigo-950 uppercase">
                <span>1. Main Central (FOC)</span>
                <Gift className="w-3.5 h-3.5 text-indigo-700" />
              </div>
              <div className="text-xl font-black font-mono tabular-nums text-indigo-900 mt-1">
                {formatNumber(
                  mode === 'central' && mainStock.totalReceived > grandTotals.stage1InitialCentralFoc
                    ? mainStock.totalReceived
                    : grandTotals.stage1InitialCentralFoc
                )}{' '}
                <span className="text-xs font-semibold text-indigo-700">{item.unit}</span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-indigo-200/80 space-y-0.5 text-[11px] text-indigo-900">
                <div className="flex justify-between">
                  <span>Central FOC Rec:</span>
                  <strong className="font-mono tabular-nums">
                    +{formatNumber(grandTotals.stage1InitialCentralFoc)}
                  </strong>
                </div>
                {mode === 'central' && mainStock.companyReceived > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>PO / Manual GRN:</span>
                    <strong className="font-mono tabular-nums">+{formatNumber(mainStock.companyReceived)}</strong>
                  </div>
                )}
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>HQ Balance:</span>
                  <strong className="font-mono tabular-nums">
                    {formatNumber(mode === 'central' ? grandTotals.centralInHand : grandTotals.centralFocPoolRemaining)}{' '}
                    {item.unit}
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-800 uppercase">
                <span>1. Main Central</span>
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <div className="text-xl font-black font-mono tabular-nums text-slate-900 mt-1">
                {formatNumber(grandTotals.totalReceivedAtHq)}{' '}
                <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100 space-y-0.5 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>PO + Manual:</span>
                  <strong className="font-mono tabular-nums text-slate-900">
                    +{formatNumber(mainStock.companyReceived)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>HQ Dispatched:</span>
                  <strong className="font-mono tabular-nums">-{formatNumber(grandTotals.dispatchedFromHq)}</strong>
                </div>
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>HQ Balance:</span>
                  <strong className="font-mono tabular-nums">{formatNumber(grandTotals.centralInHand)}</strong>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REGIONAL BRANCHES (OR SITE RECEIPT WHEN DIRECT) */}
          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-300 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-blue-950 uppercase">
              <span>
                {hasSubSiteStep
                  ? isSubSiteView
                    ? '2. Regional Parent'
                    : '2. Regional'
                  : '2. Regional / Site'}
              </span>
              <Building2 className="w-3.5 h-3.5 text-blue-700" />
            </div>
            <div className="text-xl font-black font-mono tabular-nums text-blue-900 mt-1">
              {formatNumber(
                mode === 'central'
                  ? grandTotals.hqToRegionalIssued
                  : isSubSiteView && hasSubSiteStep
                  ? parentSiteStock?.received || 0
                  : grandTotals.siteSpecificStock?.received || 0
              )}{' '}
              <span className="text-xs font-semibold text-blue-700">{item.unit}</span>
            </div>
            <div className="mt-2 pt-1.5 border-t border-blue-200/70 space-y-0.5 text-[11px] text-blue-950">
              {mode === 'central' ? (
                <>
                  <div className="flex justify-between">
                    <span>Regional Hubs:</span>
                    <strong className="font-mono tabular-nums">{grandTotals.regionalSitesCount}</strong>
                  </div>
                  {hasSubSiteStep && grandTotals.regionalToSubSiteIssued > 0 && (
                    <div className="flex justify-between text-sky-800 font-semibold">
                      <span>Sent → Sub-Sites:</span>
                      <strong className="font-mono tabular-nums">
                        -{formatNumber(grandTotals.regionalToSubSiteIssued)}
                      </strong>
                    </div>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>Regional Yard Bal:</span>
                    <strong className="font-mono tabular-nums">
                      {formatNumber(grandTotals.regionalSitesYardInHand)} {item.unit}
                    </strong>
                  </div>
                </>
              ) : isSubSiteView && hasSubSiteStep ? (
                <>
                  <div className="flex justify-between">
                    <span>Branch:</span>
                    <strong className="truncate max-w-[110px]" title={parentRegionalSite?.name}>
                      {parentRegionalSite?.name || 'Parent'}
                    </strong>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Parent Yard Bal:</span>
                    <strong className="font-mono tabular-nums">
                      {formatNumber(parentSiteStock?.availableBalance || 0)} {item.unit}
                    </strong>
                  </div>
                </>
              ) : (
                <>
                  {grandTotals.effectiveSiteFocIssued > 0 && (
                    <div className="flex justify-between text-indigo-800 font-semibold">
                      <span>Central FOC:</span>
                      <strong className="font-mono tabular-nums">+{formatNumber(grandTotals.effectiveSiteFocIssued)}</strong>
                    </div>
                  )}
                  {grandTotals.effectiveSiteNormalIssued > 0 && (
                    <div className="flex justify-between">
                      <span>Normal HQ:</span>
                      <strong className="font-mono tabular-nums">+{formatNumber(grandTotals.effectiveSiteNormalIssued)}</strong>
                    </div>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>Yard Balance:</span>
                    <strong className="font-mono tabular-nums">
                      {formatNumber(grandTotals.siteSpecificStock?.availableBalance || 0)} {item.unit}
                    </strong>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* STEP 3 (ONLY WHEN GOODS WERE ISSUED TO SUB-SITES): SUB-SITE */}
          {hasSubSiteStep && (
            <div className="bg-sky-50/80 p-3.5 rounded-xl border-2 border-sky-400/80 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-sky-950 uppercase">
                <span>3. Sub-Site</span>
                <GitBranch className="w-3.5 h-3.5 text-sky-700" />
              </div>
              <div className="text-xl font-black font-mono tabular-nums text-sky-900 mt-1">
                {formatNumber(
                  mode === 'central'
                    ? grandTotals.regionalToSubSiteIssued > 0
                      ? grandTotals.subSiteTotalReceived
                      : grandTotals.hqToSubSiteDirectIssued
                    : isSubSiteView
                    ? grandTotals.siteSpecificStock?.received || 0
                    : targetSiteBreakdownRow?.issuedToSubSites || 0
                )}{' '}
                <span className="text-xs font-semibold text-sky-700">{item.unit}</span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-sky-200/80 space-y-0.5 text-[11px] text-sky-950">
                {mode === 'central' ? (
                  <>
                    <div className="flex justify-between">
                      <span>From Regional:</span>
                      <strong className="font-mono tabular-nums">
                        +{formatNumber(grandTotals.subSiteFromParentReceived)}
                      </strong>
                    </div>
                    {grandTotals.hqToSubSiteDirectIssued > 0 && (
                      <div className="flex justify-between text-indigo-800">
                        <span>Direct HQ / FOC:</span>
                        <strong className="font-mono tabular-nums">
                          +{formatNumber(grandTotals.hqToSubSiteDirectIssued)}
                        </strong>
                      </div>
                    )}
                    <div className="flex justify-between font-bold">
                      <span>Sub-Site Bal ({grandTotals.subSitesCount}):</span>
                      <strong className="font-mono tabular-nums">
                        {formatNumber(grandTotals.subSitesYardInHand)} {item.unit}
                      </strong>
                    </div>
                  </>
                ) : isSubSiteView ? (
                  <>
                    <div className="flex justify-between">
                      <span>From Parent:</span>
                      <strong className="font-mono tabular-nums">
                        +{formatNumber(grandTotals.receivedFromParentQty)}
                      </strong>
                    </div>
                    {grandTotals.receivedFromHqDirectQty > 0 && (
                      <div className="flex justify-between text-indigo-800">
                        <span>Direct HQ / FOC:</span>
                        <strong className="font-mono tabular-nums">
                          +{formatNumber(grandTotals.receivedFromHqDirectQty)}
                        </strong>
                      </div>
                    )}
                    <div className="flex justify-between font-bold">
                      <span>Sub-Site Bal:</span>
                      <strong className="font-mono tabular-nums">
                        {formatNumber(grandTotals.siteSpecificStock?.availableBalance || 0)} {item.unit}
                      </strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Issued → Sub-Sites:</span>
                      <strong className="font-mono tabular-nums">
                        {formatNumber(targetSiteBreakdownRow?.issuedToSubSites || 0)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-teal-800">
                      <span>BRM Returned:</span>
                      <strong className="font-mono tabular-nums">
                        +{formatNumber(targetSiteBreakdownRow?.returnedFromSubSitesGood || 0)}
                      </strong>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Sub-Site Bal ({childSubSiteRows.length}):</span>
                      <strong className="font-mono tabular-nums">
                        {formatNumber(grandTotals.subSitesClusterYardInHand)} {item.unit}
                      </strong>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 3/4: TEAM ISSUE */}
          <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-300 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-indigo-950 uppercase">
              <span>{stepNo.team}. Team</span>
              <Users className="w-3.5 h-3.5 text-indigo-700" />
            </div>
            <div className="text-xl font-black font-mono tabular-nums text-indigo-900 mt-1">
              {formatNumber(grandTotals.stage3TeamIssued)}{' '}
              <span className="text-xs font-semibold text-indigo-700">{item.unit}</span>
            </div>
            <div className="mt-2 pt-1.5 border-t border-indigo-200/70 space-y-0.5 text-[11px] text-indigo-950">
              <div className="flex justify-between text-emerald-700">
                <span>Returned Good:</span>
                <strong className="font-mono tabular-nums">+{formatNumber(grandTotals.stage3TeamReturnedGood)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Net Allocated:</span>
                <strong className="font-mono tabular-nums">{formatNumber(grandTotals.stage3NetTeamIssued)}</strong>
              </div>
              <div className="flex justify-between font-bold">
                <span>Teams In-Hand:</span>
                <strong className="font-mono tabular-nums">
                  {formatNumber(grandTotals.allTeamsInHand)} {item.unit}
                </strong>
              </div>
            </div>
          </div>

          {/* STEP 4/5: USAGE & WASTAGE */}
          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-300 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-950 uppercase">
              <span>{stepNo.usage}. Usage &amp; Waste</span>
              <Hammer className="w-3.5 h-3.5 text-amber-700" />
            </div>
            <div className="text-xl font-black font-mono tabular-nums text-slate-900 mt-1">
              {formatNumber(grandTotals.stage4TotalConsumed)}{' '}
              <span className="text-xs font-semibold text-slate-600">{item.unit}</span>
            </div>
            <div className="mt-2 pt-1.5 border-t border-amber-200/80 space-y-0.5 text-[11px]">
              <div className="flex justify-between text-teal-800 font-semibold">
                <span>Used (Installed):</span>
                <strong className="font-mono tabular-nums">{formatNumber(grandTotals.stage4Used)}</strong>
              </div>
              <div className="flex justify-between text-rose-700 font-semibold">
                <span>Wastage / Scrap:</span>
                <strong className="font-mono tabular-nums">{formatNumber(grandTotals.stage4Wastage)}</strong>
              </div>
              {mode === 'site' && hasSubSiteStep && !isSubSiteView && grandTotals.subSitesClusterUsed + grandTotals.subSitesClusterWasted > 0 && (
                <div className="flex justify-between text-sky-800 font-semibold">
                  <span>+ Sub-Sites Used:</span>
                  <strong className="font-mono tabular-nums">
                    {formatNumber(grandTotals.subSitesClusterUsed + grandTotals.subSitesClusterWasted)}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* STEP 5/6: TOTAL BALANCE */}
          <div className="bg-emerald-50/90 p-3.5 rounded-xl border-2 border-emerald-500/60 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-950 uppercase">
              <span>{stepNo.balance}. Total Balance</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            </div>
            <div className="text-xl font-black font-mono tabular-nums text-emerald-800 mt-1">
              {formatNumber(
                mode === 'central'
                  ? grandTotals.totalSystemRemainingAllTiers
                  : grandTotals.siteSpecificStock?.availableBalance ?? 0
              )}{' '}
              <span className="text-xs font-semibold text-emerald-700">{item.unit}</span>
            </div>
            <div className="mt-2 pt-1.5 border-t border-emerald-200 space-y-0.5 text-[11px] text-emerald-950">
              {mode === 'central' ? (
                <>
                  <div className="flex justify-between">
                    <span>HQ + Regional:</span>
                    <strong className="font-mono tabular-nums">
                      {formatNumber(grandTotals.centralInHand + grandTotals.regionalSitesYardInHand)}
                    </strong>
                  </div>
                  {hasSubSiteStep && (
                    <div className="flex justify-between text-sky-900">
                      <span>Sub-Sites Yard:</span>
                      <strong className="font-mono tabular-nums">{formatNumber(grandTotals.subSitesYardInHand)}</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Teams In-Hand:</span>
                    <strong className="font-mono tabular-nums">{formatNumber(grandTotals.allTeamsInHand)}</strong>
                  </div>
                  {grandTotals.hasFocFlow && (
                    <div className="flex justify-between font-bold text-indigo-900 pt-0.5 border-t border-emerald-200/70">
                      <span>Client FOC Ret:</span>
                      <strong className="font-mono tabular-nums">
                        {formatNumber(grandTotals.stage5TotalProjectReturnableToClient)}
                      </strong>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between font-bold">
                    <span>{isSubSiteView ? 'Sub-Site Yard:' : 'Regional Yard:'}</span>
                    <strong className="font-mono tabular-nums">
                      {formatNumber(grandTotals.siteSpecificStock?.availableBalance || 0)}
                    </strong>
                  </div>
                  {hasSubSiteStep && !isSubSiteView && (
                    <div className="flex justify-between text-sky-900">
                      <span>Sub-Sites Yards:</span>
                      <strong className="font-mono tabular-nums">{formatNumber(grandTotals.subSitesClusterYardInHand)}</strong>
                    </div>
                  )}
                  {(grandTotals.upstreamReturnedGood > 0 || grandTotals.upstreamReturnedDamaged > 0) && (
                    <div className="flex justify-between text-teal-800">
                      <span>{isSubSiteView ? 'BRM → Parent:' : 'BRM → HQ:'}</span>
                      <strong className="font-mono tabular-nums">
                        {formatNumber(grandTotals.upstreamReturnedGood)}G
                      </strong>
                    </div>
                  )}
                  {grandTotals.hasFocFlow && (
                    <div className="flex justify-between font-bold text-indigo-900 pt-0.5 border-t border-emerald-200/70">
                      <span>FOC Returnable:</span>
                      <strong className="font-mono tabular-nums">
                        {formatNumber(grandTotals.stage5SiteFocReturnableBalance)}
                      </strong>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filter Tabs (Strictly Numbered in Flow Order) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveSubView('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                effectiveSubView === 'overview'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All {stepNo.totalSteps} Steps View
            </button>
            {grandTotals.hasFocFlow && (
              <button
                type="button"
                onClick={() => setActiveSubView('central-foc')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  effectiveSubView === 'central-foc'
                    ? 'bg-indigo-700 text-white shadow-2xs'
                    : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                1a. FOC Central Receipt ({initialCentralFocReceipts.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveSubView('inbound')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                effectiveSubView === 'inbound'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {mode === 'central' && !focProjectId
                ? `1b. Main Central Inbound (${centralInboundRecords.length})`
                : isSubSiteView && hasSubSiteStep
                ? `3. Sub-Site Inbound (${displayedSiteTransfers.length})`
                : `2. Inbound Receipts (${displayedSiteTransfers.length})`}
            </button>
            {mode === 'central' && !focProjectId && (
              <button
                type="button"
                onClick={() => setActiveSubView('sites')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  effectiveSubView === 'sites'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                2. Regional Branches ({regionalBranchRows.length})
              </button>
            )}
            {hasSubSiteStep && !focProjectId && (mode === 'central' || !isSubSiteView) && (
              <button
                type="button"
                onClick={() => setActiveSubView('subsites')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  effectiveSubView === 'subsites'
                    ? 'bg-sky-700 text-white shadow-2xs'
                    : 'bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100'
                }`}
              >
                3. Sub-Site Distribution ({displayedSubSiteRows.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveSubView('teams')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                effectiveSubView === 'teams'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {stepNo.team}. Team Issue ({teamBreakdown.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('projects')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                effectiveSubView === 'projects'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {stepNo.usage}. Usage &amp; Wastage ({projectUsageLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('reconciliation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                effectiveSubView === 'reconciliation'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {stepNo.balance}. Total Balance &amp; BRM
            </button>
          </div>

          <span className="text-[11px] font-semibold text-slate-500">
            Print or export the matching {stepNo.totalSteps}-Step A4 Final Report above.
          </span>
        </div>

        {/* STEP 1A TABLE: INITIAL FOC RECEIPT AT CENTRAL STOCK */}
        {grandTotals.hasFocFlow &&
          (effectiveSubView === 'overview' || effectiveSubView === 'central-foc') && (
            <div className="bg-white rounded-xl border-2 border-indigo-300 shadow-2xs overflow-hidden">
              <div className="px-4 py-2.5 bg-indigo-950 text-white flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-indigo-300" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider">
                    1a. FOC Central Stock Receipt (Client FOC Received at Main Central Warehouse)
                  </h4>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
                  <span className="text-indigo-200">
                    Initial Central FOC:{' '}
                    <strong className="text-white">
                      {formatNumber(grandTotals.stage1InitialCentralFoc)} {item.unit}
                    </strong>
                  </span>
                  <span className="text-emerald-300">
                    Central FOC Rem:{' '}
                    <strong>
                      {formatNumber(grandTotals.centralFocPoolRemaining)} {item.unit}
                    </strong>
                  </span>
                </div>
              </div>

              {initialCentralFocReceipts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No initial Central FOC receipt vouchers recorded for this item.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-indigo-50/80 text-indigo-950 uppercase border-b border-indigo-200 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">FOC Voucher #</th>
                        <th className="py-2.5 px-3">Source Tag</th>
                        <th className="py-2.5 px-3">Client &amp; Dispatch Note (DN)</th>
                        <th className="py-2.5 px-3">Assigned Project &amp; Site</th>
                        <th className="py-2.5 px-3">Received Date &amp; Location</th>
                        <th className="py-2.5 px-3 text-right">Initial Central FOC ({item.unit})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-100">
                      {initialCentralFocReceipts.map((foc) => (
                        <tr key={foc.id} className="bg-indigo-50/30 hover:bg-indigo-50/70">
                          <td className="py-2.5 px-3 font-mono font-black text-indigo-950">
                            {foc.voucherNo}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-600 text-white shadow-2xs">
                              <Gift className="w-3 h-3" />
                              Central FOC
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{foc.clientName}</div>
                            <div className="text-[11px] font-mono text-slate-600">
                              DN: {foc.dispatchNoteNo}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-indigo-950">{foc.projectName}</div>
                            <div className="text-[11px] text-slate-600">
                              Allocated Site: <strong>{foc.assignedSiteName}</strong>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            <div>{formatDateTime(foc.date)}</div>
                            <div className="text-[10px] font-semibold text-indigo-700">
                              {foc.storageLocation} · By {foc.receivedBy}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-black text-indigo-900 text-sm">
                            +{formatNumber(foc.qty)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        {/* STEP 1B (CENTRAL INBOUND) OR STEP 2/3 (SITE INBOUND TRANSFERS) */}
        {(effectiveSubView === 'overview' || effectiveSubView === 'inbound') && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  {mode === 'central' && !focProjectId
                    ? '1b. Main Central Inbound Sources (POs, Manual GRN, Client FOC & HQ Branch Returns)'
                    : isSubSiteView && hasSubSiteStep
                    ? `3. Sub-Site Inbound Receipts — Stock Received by ${targetSite?.name} (From Parent / HQ)`
                    : `2. ${isSubSiteView ? 'Sub-Site' : 'Regional Site'} Inbound Receipts — Supply Received by ${targetSite?.name || 'Branch'}`}
                </h4>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums font-bold">
                {mode === 'central' && !focProjectId ? (
                  <span className="text-emerald-800">
                    Total Central Inbound: {formatNumber(grandTotals.totalReceivedAtHq)} {item.unit}
                  </span>
                ) : (
                  <>
                    {isSubSiteView && grandTotals.receivedFromParentQty > 0 && (
                      <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300">
                        From Parent ({parentRegionalSite?.name || 'Parent'}): +{formatNumber(grandTotals.receivedFromParentQty)} {item.unit}
                      </span>
                    )}
                    {grandTotals.effectiveSiteFocIssued > 0 && (
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-300">
                        Central FOC: +{formatNumber(grandTotals.effectiveSiteFocIssued)} {item.unit}
                      </span>
                    )}
                    {!focProjectId && !isSubSiteView && grandTotals.effectiveSiteNormalIssued > 0 && (
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        Normal HQ: +{formatNumber(grandTotals.effectiveSiteNormalIssued)} {item.unit}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {mode === 'central' && !focProjectId ? (
              centralInboundRecords.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No inbound PO receipts, manual stock entries, or FOC vouchers recorded for this item yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Voucher / PO Ref</th>
                        <th className="py-2.5 px-3">Inbound Channel</th>
                        <th className="py-2.5 px-3">Supplier / Client / Source</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Logged By</th>
                        <th className="py-2.5 px-3 text-right">Quantity ({item.unit})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {centralInboundRecords.map((rec) => (
                        <tr
                          key={rec.id}
                          className={rec.isCentralFoc ? 'bg-indigo-50/45 hover:bg-indigo-50/80' : 'hover:bg-slate-50/70'}
                        >
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{rec.refNo}</td>
                          <td className="py-2 px-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${rec.badgeColor}`}>
                              {rec.isCentralFoc && <Gift className="w-3 h-3" />}
                              {rec.sourceType}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{rec.partyName}</td>
                          <td className="py-2 px-3 text-slate-600">{formatDateTime(rec.date)}</td>
                          <td className="py-2 px-3 text-slate-600">{rec.receivedBy}</td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                            +{formatNumber(rec.qty)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : displayedSiteTransfers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No stock transfer requisitions or parent branch issues received for this item yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Requisition / Issue #</th>
                      <th className="py-2.5 px-3">Supply Source Branch</th>
                      <th className="py-2.5 px-3">Transfer Category &amp; Destination</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Accepted / Issued By</th>
                      <th className="py-2.5 px-3 text-right">Received Qty ({item.unit})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedSiteTransfers.map((tr) => (
                      <tr
                        key={tr.id}
                        className={
                          tr.isCentralFoc
                            ? 'bg-indigo-50/50 hover:bg-indigo-100/60'
                            : tr.isFromParentBranch
                            ? 'bg-sky-50/40 hover:bg-sky-50/80'
                            : 'hover:bg-slate-50/70'
                        }
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{tr.voucherNo}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">
                            {tr.isFromParentBranch ? `Parent: ${tr.sourceSiteName}` : tr.sourceSiteName}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-500">
                            {tr.isCentralFoc
                              ? 'Central FOC Pool'
                              : tr.isFromParentBranch
                              ? 'Tier 2 Regional Hub'
                              : 'Tier 1 Main Central'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          <div>{tr.category}</div>
                          <div className="text-[10px] text-slate-500">
                            → {tr.targetIsSubSite ? `Sub-Site: ${tr.siteName}` : tr.siteName}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{formatDateTime(tr.date)}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                              tr.status === 'Accepted' || tr.status === 'Accepted at Site'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {tr.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{tr.byUser}</td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono tabular-nums font-black text-sm ${
                            tr.isCentralFoc
                              ? 'text-indigo-800'
                              : tr.isFromParentBranch
                              ? 'text-sky-800'
                              : 'text-emerald-700'
                          }`}
                        >
                          +{formatNumber(tr.qty)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 TABLE (CENTRAL MODE): REGIONAL SITE BRANCHES DISTRIBUTION */}
        {mode === 'central' && !focProjectId && (effectiveSubView === 'overview' || effectiveSubView === 'sites') && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-blue-50/80 border-b border-blue-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-700" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-950">
                  2. Regional Site Branches — Distribution from Main Central ({regionalBranchRows.length} Hub(s))
                </h4>
              </div>
              <span className="text-xs font-mono tabular-nums font-bold text-blue-900">
                Regional Yard Balance: {formatNumber(grandTotals.regionalSitesYardInHand)} {item.unit}
              </span>
            </div>

            {regionalBranchRows.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No Regional Site Branches have received this item yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Regional Site Branch</th>
                      <th className="py-2.5 px-3 text-right">From Main Central</th>
                      {hasSubSiteStep && <th className="py-2.5 px-3 text-right">Issued → Sub-Sites</th>}
                      <th className="py-2.5 px-3 text-right">Team Issue / Ret</th>
                      <th className="py-2.5 px-3 text-right">Usage &amp; Wastage</th>
                      <th className="py-2.5 px-3 text-right">HQ BRM Ret</th>
                      <th className="py-2.5 px-3 text-right bg-blue-50/60 text-blue-900">Regional Yard Bal</th>
                      <th className="py-2.5 px-3 text-right bg-indigo-50/60 text-indigo-900">Teams In-Hand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {regionalBranchRows.map((row) => (
                      <tr
                        key={row.site.id}
                        className={row.focReceived > 0 ? 'bg-indigo-50/35 hover:bg-indigo-50/70' : 'hover:bg-slate-50/70'}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{row.site.name}</span>
                            {row.focReceived > 0 && (
                              <span className="text-[10px] font-extrabold text-indigo-700">· Central FOC</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            Supervisor: {row.site.supervisorName}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-800">
                          <div>+{formatNumber(row.receivedTotal)}</div>
                          {row.focReceived > 0 && (
                            <div className="text-[10px] font-sans text-indigo-700 font-extrabold">
                              FOC: {formatNumber(row.focReceived)}
                            </div>
                          )}
                          {row.inTransitQty > 0 && (
                            <div className="text-[10px] font-sans text-amber-700">
                              +{formatNumber(row.inTransitQty)} Transit
                            </div>
                          )}
                        </td>
                        {hasSubSiteStep && (
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {row.issuedToSubSites > 0 || row.returnedFromSubSitesGood > 0 ? (
                              <div>
                                {row.issuedToSubSites > 0 && (
                                  <div className="text-sky-800 font-bold">-{formatNumber(row.issuedToSubSites)}</div>
                                )}
                                {row.returnedFromSubSitesGood > 0 && (
                                  <div className="text-[10px] text-teal-700 font-bold">
                                    BRM In: +{formatNumber(row.returnedFromSubSitesGood)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                          <div>{formatNumber(row.issuedToTeams)}</div>
                          {row.returnedFromTeams > 0 && (
                            <div className="text-[10px] text-emerald-700 font-bold">
                              Ret: +{formatNumber(row.returnedFromTeams)}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          <span className="text-teal-700 font-bold">{formatNumber(row.siteUsedQty)}</span>
                          {row.siteWastedQty + row.teamDamagedRet > 0 && (
                            <span className="text-rose-600 font-bold ml-1">
                              (+{formatNumber(row.siteWastedQty + row.teamDamagedRet)} w)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {row.returnedToHqGood > 0 || row.returnedToHqDamaged > 0 ? (
                            <div className="text-[10.5px]">
                              {row.returnedToHqGood > 0 && (
                                <div className="text-teal-700 font-bold">-{formatNumber(row.returnedToHqGood)}G</div>
                              )}
                              {row.returnedToHqDamaged > 0 && (
                                <div className="text-rose-600 font-bold">-{formatNumber(row.returnedToHqDamaged)}D</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-black text-blue-800 bg-blue-50/30">
                          {formatNumber(row.siteInHand)} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-black text-indigo-800 bg-indigo-50/30">
                          {formatNumber(row.siteTeamsInHand)} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* STEP 3 DEDICATED SECTION (ONLY WHEN SUB-SITE DISTRIBUTION EXISTS): REGIONAL -> SUB-SITE */}
        {hasSubSiteStep &&
          !focProjectId &&
          (mode === 'central' || !isSubSiteView) &&
          (effectiveSubView === 'overview' || effectiveSubView === 'subsites') && (
            <div className="bg-white rounded-xl border-2 border-sky-300 shadow-2xs overflow-hidden">
              <div className="px-4 py-2.5 bg-sky-900 text-white flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-sky-300" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider">
                    3. Sub-Site Distribution — Issued from Regional Branches to Sub-Sites ({displayedSubSiteRows.length})
                  </h4>
                </div>
                <span className="text-xs font-mono tabular-nums font-bold text-sky-200">
                  Regional → Sub-Site: {formatNumber(mode === 'central' ? grandTotals.regionalToSubSiteIssued : targetSiteBreakdownRow?.issuedToSubSites || 0)} {item.unit} | Sub-Site Yards:{' '}
                  {formatNumber(mode === 'central' ? grandTotals.subSitesYardInHand : grandTotals.subSitesClusterYardInHand)} {item.unit}
                </span>
              </div>

              {displayedSubSiteRows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-sky-50 text-sky-950 uppercase border-b border-sky-200 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Sub-Site Branch</th>
                        <th className="py-2.5 px-3">Parent Regional Hub</th>
                        <th className="py-2.5 px-3 text-right">From Parent Regional</th>
                        <th className="py-2.5 px-3 text-right">Direct from HQ / FOC</th>
                        <th className="py-2.5 px-3 text-right">Team Issue / Ret</th>
                        <th className="py-2.5 px-3 text-right">Usage &amp; Wastage</th>
                        <th className="py-2.5 px-3 text-right">BRM → Parent</th>
                        <th className="py-2.5 px-3 text-right bg-sky-100/70 text-sky-950">Sub-Site Yard Bal</th>
                        <th className="py-2.5 px-3 text-right bg-indigo-50/70 text-indigo-950">Teams In-Hand</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedSubSiteRows.map((row) => (
                        <tr key={row.site.id} className="bg-sky-50/30 hover:bg-sky-50/70">
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <CornerDownRight className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span>{row.site.name}</span>
                              {row.focReceived > 0 && (
                                <span className="text-[10px] font-extrabold text-indigo-700">· Central FOC</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-normal pl-5">
                              Supervisor: {row.site.supervisorName}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-blue-900">
                            {row.parentSiteName || 'Parent Regional'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-black text-sky-800">
                            +{formatNumber(row.receivedFromParentBranch)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-indigo-800">
                            {row.receivedFromHq > 0 ? `+${formatNumber(row.receivedFromHq)}` : '0'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                            <div>{formatNumber(row.issuedToTeams)}</div>
                            {row.returnedFromTeams > 0 && (
                              <div className="text-[10px] text-emerald-700 font-bold">
                                Ret: +{formatNumber(row.returnedFromTeams)}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            <span className="text-teal-700 font-bold">{formatNumber(row.siteUsedQty)}</span>
                            {row.siteWastedQty + row.teamDamagedRet > 0 && (
                              <span className="text-rose-600 font-bold ml-1">
                                (+{formatNumber(row.siteWastedQty + row.teamDamagedRet)} w)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {row.returnedToParentGood > 0 || row.returnedToParentDamaged > 0 ? (
                              <div className="text-[10.5px]">
                                {row.returnedToParentGood > 0 && (
                                  <div className="text-teal-700 font-bold">-{formatNumber(row.returnedToParentGood)}G</div>
                                )}
                                {row.returnedToParentDamaged > 0 && (
                                  <div className="text-rose-600 font-bold">-{formatNumber(row.returnedToParentDamaged)}D</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-black text-sky-900 bg-sky-50/60">
                            {formatNumber(row.siteInHand)} {item.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-black text-indigo-900 bg-indigo-50/30">
                            {formatNumber(row.siteTeamsInHand)} {item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Parent Regional -> Sub-Site Dispatch Vouchers */}
              {subSiteDispatchTransfers.length > 0 && (
                <div className="border-t border-sky-200 bg-sky-50/40 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-950">
                      Regional → Sub-Site Dispatch Vouchers ({subSiteDispatchTransfers.length})
                    </span>
                    <span className="text-[11px] font-mono tabular-nums font-bold text-sky-900">
                      Total Regional → Sub-Site: {formatNumber(subSiteDispatchTransfers.reduce((s, t) => s + t.qty, 0))} {item.unit}
                    </span>
                  </div>
                  <div className="overflow-x-auto bg-white rounded-lg border border-sky-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-sky-50/80 text-sky-950 uppercase font-bold text-[10px] border-b border-sky-200">
                        <tr>
                          <th className="py-2 px-3">Transfer #</th>
                          <th className="py-2 px-3">From Regional Hub</th>
                          <th className="py-2 px-3">To Sub-Site</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3 text-right">Qty ({item.unit})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subSiteDispatchTransfers.map((tr) => (
                          <tr key={tr.id} className="hover:bg-sky-50/40">
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{tr.voucherNo}</td>
                            <td className="py-2 px-3 font-semibold text-blue-900">{tr.sourceSiteName}</td>
                            <td className="py-2 px-3 font-bold text-sky-900">↳ {tr.siteName}</td>
                            <td className="py-2 px-3 text-slate-600">{formatDateTime(tr.date)}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                  tr.status === 'Accepted'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {tr.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums font-black text-sky-800">
                              {formatNumber(tr.qty)} {item.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        {/* STEP 3 OR 4: FIELD TEAMS ISSUE */}
        {(effectiveSubView === 'overview' || effectiveSubView === 'teams') && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-blue-50/80 border-b border-blue-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-700" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-950">
                  {stepNo.team}. Team Issue — Field Teams Allocation, Returns &amp; Team In-Hand Balance
                </h4>
              </div>
              <span className="text-xs font-mono tabular-nums font-bold text-blue-900">
                Issued to Teams: {formatNumber(grandTotals.stage3TeamIssued)} {item.unit} | Teams In-Hand:{' '}
                {formatNumber(grandTotals.allTeamsInHand)} {item.unit}
              </span>
            </div>

            {teamBreakdown.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No field teams have been issued this item yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Field Team &amp; Leader</th>
                      <th className="py-2.5 px-3">Assigned Branch &amp; Tier</th>
                      <th className="py-2.5 px-3 text-right">Team Issue</th>
                      <th className="py-2.5 px-3 text-right">Returned (Good / Dmg)</th>
                      <th className="py-2.5 px-3 text-right">Used on Projects</th>
                      <th className="py-2.5 px-3 text-right">Project Wastage</th>
                      <th className="py-2.5 px-3 text-right bg-indigo-50/70 text-indigo-950">Current Team In-Hand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamBreakdown.map((tb) => (
                      <tr key={tb.team.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          <div>{tb.team.teamName}</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            Leader: {tb.team.teamLeaderName}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          <div>{tb.isSubSiteTeam ? `↳ ${tb.siteName}` : tb.siteName}</div>
                          <div className="text-[10px] text-slate-500">
                            {tb.isSubSiteTeam
                              ? `Sub-Site (Under ${tb.parentSiteName || 'Parent'})`
                              : 'Regional Branch'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-blue-800">
                          {formatNumber(tb.issuedQty)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                          <span className="text-emerald-700 font-semibold">+{formatNumber(tb.returnedGoodQty)} Good</span>
                          {tb.returnedDamagedQty > 0 && (
                            <span className="text-rose-600 font-semibold ml-1.5">
                              / {formatNumber(tb.returnedDamagedQty)} Dmg
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-teal-700">
                          {formatNumber(tb.usedQty)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-rose-600">
                          {formatNumber(tb.wastedQty)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-black text-indigo-800 bg-indigo-50/40">
                          {formatNumber(tb.inHandQty)} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* STEP 4 OR 5: USAGE & WASTAGE */}
        {(effectiveSubView === 'overview' || effectiveSubView === 'projects') && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-teal-50/80 border-b border-teal-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Hammer className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-950">
                  {stepNo.usage}. Usage &amp; Wastage — Sub-Project Usage Flow &amp; Field Scrap Logs
                </h4>
              </div>
              <span className="text-xs font-mono tabular-nums font-bold text-teal-900">
                Usage: {formatNumber(grandTotals.stage4Used)} {item.unit} | Wastage:{' '}
                {formatNumber(grandTotals.stage4Wastage)} {item.unit} | Total:{' '}
                {formatNumber(grandTotals.stage4TotalConsumed)} {item.unit}
              </span>
            </div>

            {subProjectFlowSections.length > 0 && (
              <div className="p-3.5 bg-teal-50/30 border-b border-teal-200/80 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-extrabold text-teal-950">
                    Where This Item Was Used (Sub-Project Distribution) — Click a Sub-Project to filter vouchers below
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedSubProjectFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                        selectedSubProjectFilter === 'all'
                          ? 'bg-indigo-600 text-white border-indigo-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-indigo-50'
                      }`}
                    >
                      All ({subProjectFlowSections.length})
                    </button>
                    {subProjectFlowSections.map((spf) => (
                      <button
                        key={spf.subProject.id}
                        type="button"
                        onClick={() =>
                          setSelectedSubProjectFilter((prev) =>
                            prev === spf.subProject.id ? 'all' : spf.subProject.id
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border cursor-pointer ${
                          selectedSubProjectFilter === spf.subProject.id
                            ? 'bg-teal-700 text-white border-teal-800'
                            : 'bg-white text-teal-900 border-teal-300 hover:bg-teal-50'
                        }`}
                      >
                        ↳ {spf.subProject.projectId} ({formatNumber(spf.spTotalConsumed)})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-xl border border-teal-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-teal-50/80 text-teal-950 uppercase font-bold text-[10px] border-b border-teal-200">
                      <tr>
                        <th className="py-2 px-3">Sub-Project Code &amp; Name</th>
                        <th className="py-2 px-3 text-center">Vouchers</th>
                        <th className="py-2 px-3 text-right">Used ({item.unit})</th>
                        <th className="py-2 px-3 text-right">Wastage ({item.unit})</th>
                        <th className="py-2 px-3 text-right">Total Consumed ({item.unit})</th>
                        <th className="py-2 px-3 text-right">Share %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subProjectFlowSections.map((spf) => {
                        const isSelected = selectedSubProjectFilter === spf.subProject.id;
                        const sharePct =
                          grandTotals.stage4TotalConsumed > 0
                            ? Math.round((spf.spTotalConsumed / grandTotals.stage4TotalConsumed) * 100)
                            : 0;
                        return (
                          <tr
                            key={spf.subProject.id}
                            onClick={() =>
                              setSelectedSubProjectFilter((prev) =>
                                prev === spf.subProject.id ? 'all' : spf.subProject.id
                              )
                            }
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-teal-50 font-bold' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-2 px-3 text-slate-900">
                              <span className="font-mono font-bold text-teal-800 mr-1.5">
                                ↳ [{spf.subProject.projectId}]
                              </span>
                              <span className="font-semibold">{spf.subProject.projectName}</span>
                            </td>
                            <td className="py-2 px-3 text-center font-mono tabular-nums text-slate-600">
                              {spf.spLogs.length}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-teal-700">
                              {formatNumber(spf.spUsed)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-rose-600">
                              {formatNumber(spf.spWastage)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums font-black text-slate-900">
                              {formatNumber(spf.spTotalConsumed)} {item.unit}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-600">
                              {sharePct}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {projectUsageLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No project installation or wastage vouchers recorded for this item yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Voucher #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Sub-Project / Project Name</th>
                      <th className="py-2.5 px-3">Branch &amp; Executing Team</th>
                      <th className="py-2.5 px-3 text-right">Usage (Installed)</th>
                      <th className="py-2.5 px-3 text-right">Wastage / Scrap</th>
                      <th className="py-2.5 px-3 text-right">Total Consumed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projectUsageLogs
                      .filter(
                        (log) =>
                          selectedSubProjectFilter === 'all' ||
                          log.projectId === selectedSubProjectFilter
                      )
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{log.voucherNo}</td>
                          <td className="py-2 px-3 text-slate-600">{formatDateTime(log.date)}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">
                            <span className="font-mono text-[11px] text-teal-700 mr-1.5">[{log.projectCode}]</span>
                            {log.projectName}
                          </td>
                          <td className="py-2 px-3 text-slate-700">
                            <span className="font-semibold">
                              {log.siteIsSubSite ? `Sub-Site: ${log.siteName}` : log.siteName}
                            </span>{' '}
                            · {log.teamName}
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-teal-700">
                            {formatNumber(log.usedQty)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-rose-600">
                            {formatNumber(log.wastedQty)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums font-black text-slate-900">
                            {formatNumber(log.totalDeducted)} {item.unit}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* STEP 5 OR 6: TOTAL BALANCE & UPSTREAM BRM RETURNS */}
        {(effectiveSubView === 'overview' || effectiveSubView === 'reconciliation') && (
          <div className="space-y-4">
            {branchReturnRecords.length > 0 && (
              <div className="bg-white rounded-xl border border-teal-300 shadow-2xs overflow-hidden">
                <div className="px-4 py-2.5 bg-teal-900 text-white flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-teal-300" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider">
                      Upstream Branch Return Notes (BRM — Sub-Site → Regional &amp; Regional → Main Central)
                    </h4>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-teal-200 font-bold">
                    {branchReturnRecords.length} BRM Voucher(s)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-teal-50/70 text-teal-950 uppercase border-b border-teal-200 font-bold">
                      <tr>
                        <th className="py-2 px-3">BRM #</th>
                        <th className="py-2 px-3">From Sending Branch</th>
                        <th className="py-2 px-3">Returned To (Destination)</th>
                        <th className="py-2 px-3">Condition</th>
                        <th className="py-2 px-3">Date &amp; By</th>
                        <th className="py-2 px-3 text-right">Qty ({item.unit})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {branchReturnRecords.map((br) => (
                        <tr key={br.id} className="hover:bg-teal-50/30">
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{br.brmNo}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{br.fromSiteName}</td>
                          <td className="py-2 px-3 font-bold text-teal-800">
                            → {br.toSiteName}
                            <span className="ml-1.5 text-[10px] font-normal text-slate-500">
                              ({br.isSubSiteToParent ? 'Sub-Site → Parent' : 'Regional → HQ'})
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                                br.condition === 'Good / Restock'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              {br.condition}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {formatDateTime(br.date)} · {br.returnedBy}
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums font-black text-teal-800">
                            {formatNumber(br.qty)} {item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Final Reconciliation Statement Table (Matched 5-Step or 6-Step Columns) */}
            <div className="bg-emerald-50/50 rounded-xl border-2 border-emerald-500/50 shadow-2xs overflow-hidden">
              <div className="px-4 py-2.5 bg-emerald-900 text-white flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider">
                    {stepNo.balance}. Total Balance &amp; {stepNo.totalSteps}-Step Reconciliation Statement
                  </h4>
                </div>
                <span className="text-xs font-mono tabular-nums font-bold text-emerald-200">
                  {mode === 'central'
                    ? `Total Custody Balance: ${formatNumber(grandTotals.totalSystemRemainingAllTiers)} ${item.unit}${
                        grandTotals.hasFocFlow
                          ? ` | Client FOC Ret: ${formatNumber(grandTotals.stage5TotalProjectReturnableToClient)} ${item.unit}`
                          : ''
                      }`
                    : `Physical Yard Balance: ${formatNumber(grandTotals.siteSpecificStock?.availableBalance ?? 0)} ${item.unit}`}
                </span>
              </div>

              <div className="overflow-x-auto bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-emerald-50/70 text-emerald-950 uppercase border-b border-emerald-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">1. Main Central</th>
                      <th className="py-2.5 px-3">
                        {hasSubSiteStep ? '2. Regional' : '2. Regional / Site'}
                      </th>
                      {hasSubSiteStep && <th className="py-2.5 px-3 bg-sky-50 text-sky-950">3. Sub-Site</th>}
                      <th className="py-2.5 px-3">{stepNo.team}. Team Issue</th>
                      <th className="py-2.5 px-3">{stepNo.usage}. Usage &amp; Wastage</th>
                      <th className="py-2.5 px-3 text-right bg-emerald-100/80 text-emerald-950">
                        {stepNo.balance}. Total Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="divide-x divide-slate-200">
                      <td className="py-3 px-3 font-mono tabular-nums">
                        <div className="text-sm font-black text-slate-900">
                          {formatNumber(grandTotals.totalReceivedAtHq)} {item.unit}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          HQ Bal: <strong className="text-emerald-700">{formatNumber(grandTotals.centralInHand)}</strong>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums">
                        <div className="text-sm font-black text-blue-800">
                          {formatNumber(
                            mode === 'central'
                              ? grandTotals.hqToRegionalIssued
                              : isSubSiteView && hasSubSiteStep
                              ? parentSiteStock?.received || 0
                              : grandTotals.siteSpecificStock?.received || 0
                          )}{' '}
                          {item.unit}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Bal:{' '}
                          <strong>
                            {formatNumber(
                              mode === 'central'
                                ? grandTotals.regionalSitesYardInHand
                                : isSubSiteView && hasSubSiteStep
                                ? parentSiteStock?.availableBalance || 0
                                : grandTotals.siteSpecificStock?.availableBalance || 0
                            )}
                          </strong>
                        </div>
                      </td>
                      {hasSubSiteStep && (
                        <td className="py-3 px-3 font-mono tabular-nums bg-sky-50/40">
                          <div className="text-sm font-black text-sky-800">
                            {formatNumber(
                              mode === 'central'
                                ? grandTotals.regionalToSubSiteIssued > 0
                                  ? grandTotals.subSiteTotalReceived
                                  : grandTotals.hqToSubSiteDirectIssued
                                : isSubSiteView
                                ? grandTotals.siteSpecificStock?.received || 0
                                : targetSiteBreakdownRow?.issuedToSubSites || 0
                            )}{' '}
                            {item.unit}
                          </div>
                          <div className="text-[11px] text-sky-900 mt-0.5">
                            Sub Bal:{' '}
                            <strong>
                              {formatNumber(
                                mode === 'central'
                                  ? grandTotals.subSitesYardInHand
                                  : isSubSiteView
                                  ? grandTotals.siteSpecificStock?.availableBalance || 0
                                  : grandTotals.subSitesClusterYardInHand
                              )}
                            </strong>
                          </div>
                        </td>
                      )}
                      <td className="py-3 px-3 font-mono tabular-nums">
                        <div className="text-sm font-black text-indigo-800">
                          {formatNumber(grandTotals.stage3TeamIssued)} {item.unit}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          In-Hand: <strong>{formatNumber(grandTotals.allTeamsInHand)}</strong>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums">
                        <div className="text-sm font-black text-slate-900">
                          {formatNumber(grandTotals.stage4TotalConsumed)} {item.unit}
                        </div>
                        <div className="text-[11px] mt-0.5">
                          <span className="text-teal-700 font-bold">{formatNumber(grandTotals.stage4Used)}U</span> ·{' '}
                          <span className="text-rose-600 font-bold">{formatNumber(grandTotals.stage4Wastage)}W</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums bg-emerald-50/70">
                        <div className="text-base font-black text-emerald-800">
                          {formatNumber(
                            mode === 'central'
                              ? grandTotals.totalSystemRemainingAllTiers
                              : grandTotals.siteSpecificStock?.availableBalance ?? 0
                          )}{' '}
                          {item.unit}
                        </div>
                        {grandTotals.hasFocFlow && (
                          <div className="text-[10px] font-sans font-bold text-indigo-800">
                            FOC Client Ret: {formatNumber(grandTotals.stage5TotalProjectReturnableToClient)} {item.unit}
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* HIDDEN / ISOLATED A4 PRINTABLE FINAL REPORT (STRICT 5/6-STEP FLOW)  */}
      {/* =================================================================== */}
      <div id={printElementId} className="hidden print:block bg-white text-slate-900 p-6">
        <div className="border-2 border-slate-900 p-5 space-y-5">
          {/* ISO Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
                ISO 9001:2015 {stepNo.totalSteps}-STEP MATERIAL RECONCILIATION &amp; CUSTODY REPORT
              </div>
              <h1 className="text-xl font-black text-slate-900 uppercase mt-0.5">
                {companyDisplayName}
              </h1>
              <p className="text-xs text-slate-700 font-bold mt-0.5">
                {focProjectId
                  ? `FOC ${stepNo.totalSteps}-STEP RECONCILIATION REPORT — PROJECT: [${targetFocProject?.projectId || 'FOC'}] ${targetFocProject?.projectName || ''}`
                  : mode === 'central'
                  ? `MASTER STOCK ${stepNo.totalSteps}-STEP ITEM TRACEABILITY REPORT`
                  : isSubSiteView
                  ? `SUB-SITE BRANCH ITEM REPORT — ${targetSite?.name?.toUpperCase() || 'SUB-SITE'} (UNDER: ${(parentRegionalSite?.name || targetSite?.parentSiteName || 'PARENT').toUpperCase()})`
                  : `REGIONAL SITE BRANCH ITEM REPORT — ${targetSite?.name?.toUpperCase() || 'BRANCH'}`}
              </p>
            </div>
            <div className="text-right text-xs space-y-0.5 font-mono">
              <div>
                <strong>Doc Ref:</strong> {grandTotals.hasFocFlow ? 'FOC' : 'STD'}-{stepNo.totalSteps}S-{item.itemCode}-{new Date().getFullYear()}
              </div>
              <div>
                <strong>Printed:</strong> {formatDateTime(new Date().toISOString())}
              </div>
              <div>
                <strong>By:</strong> {currentUser?.fullName || 'Authorized Officer'}
              </div>
            </div>
          </div>

          {/* Item Metadata Box */}
          <div className="flex items-center gap-4 bg-slate-50 p-3 border border-slate-300 text-xs">
            {printWithImage && item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.itemName}
                className="w-16 h-16 object-cover rounded-lg border border-slate-300 bg-white shrink-0"
              />
            )}
            <div className="grid grid-cols-4 gap-3 flex-1">
              <div>
                <div className="text-[10px] uppercase text-slate-500 font-bold">Item Code</div>
                <div className="font-mono font-black text-sm text-slate-900">{item.itemCode}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[10px] uppercase text-slate-500 font-bold">Material / Asset Description</div>
                <div className="font-black text-sm text-slate-900">
                  {item.itemName}{' '}
                  {grandTotals.hasFocFlow && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 rounded">
                      Central FOC
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-500 font-bold">Category &amp; Unit</div>
                <div className="font-bold text-slate-900">
                  {item.category} ({item.unit})
                </div>
              </div>
            </div>
          </div>

          {/* Print Flow Banner */}
          <div className="px-3 py-2 bg-slate-100 border border-slate-300 text-[11px] font-bold text-slate-800">
            Flow: {flowBreadcrumbText}
          </div>

          {/* Print KPI Grid (Strict 5 or 6 Sequential Steps) */}
          <div
            className={`grid ${
              hasSubSiteStep ? 'grid-cols-6' : 'grid-cols-5'
            } gap-2 text-center border-2 border-slate-800 p-2.5 bg-white`}
          >
            <div className="border-r border-slate-300 pr-1.5">
              <div className="text-[10px] font-extrabold uppercase text-slate-800">
                1. Main Central
              </div>
              <div className="text-xs font-black font-mono text-slate-900 mt-0.5">
                {formatNumber(grandTotals.totalReceivedAtHq)} {item.unit}
              </div>
              <div className="text-[9.5px] text-slate-600">
                HQ Bal: {formatNumber(grandTotals.centralInHand)}
              </div>
            </div>

            <div className="border-r border-slate-300 pr-1.5">
              <div className="text-[10px] font-extrabold uppercase text-blue-900">
                {hasSubSiteStep ? '2. Regional' : '2. Regional / Site'}
              </div>
              <div className="text-xs font-black font-mono text-blue-800 mt-0.5">
                {formatNumber(
                  mode === 'central'
                    ? grandTotals.hqToRegionalIssued
                    : isSubSiteView && hasSubSiteStep
                    ? parentSiteStock?.received || 0
                    : grandTotals.siteSpecificStock?.received || 0
                )}{' '}
                {item.unit}
              </div>
              <div className="text-[9.5px] text-slate-600">
                Bal:{' '}
                {formatNumber(
                  mode === 'central'
                    ? grandTotals.regionalSitesYardInHand
                    : isSubSiteView && hasSubSiteStep
                    ? parentSiteStock?.availableBalance || 0
                    : grandTotals.siteSpecificStock?.availableBalance || 0
                )}
              </div>
            </div>

            {hasSubSiteStep && (
              <div className="border-r border-slate-300 pr-1.5">
                <div className="text-[10px] font-extrabold uppercase text-sky-900">3. Sub-Site</div>
                <div className="text-xs font-black font-mono text-sky-800 mt-0.5">
                  {formatNumber(
                    mode === 'central'
                      ? grandTotals.regionalToSubSiteIssued > 0
                        ? grandTotals.subSiteTotalReceived
                        : grandTotals.hqToSubSiteDirectIssued
                      : isSubSiteView
                      ? grandTotals.siteSpecificStock?.received || 0
                      : targetSiteBreakdownRow?.issuedToSubSites || 0
                  )}{' '}
                  {item.unit}
                </div>
                <div className="text-[9.5px] text-slate-600">
                  Sub Bal:{' '}
                  {formatNumber(
                    mode === 'central'
                      ? grandTotals.subSitesYardInHand
                      : isSubSiteView
                      ? grandTotals.siteSpecificStock?.availableBalance || 0
                      : grandTotals.subSitesClusterYardInHand
                  )}
                </div>
              </div>
            )}

            <div className="border-r border-slate-300 pr-1.5">
              <div className="text-[10px] font-extrabold uppercase text-indigo-900">
                {stepNo.team}. Team
              </div>
              <div className="text-xs font-black font-mono text-indigo-800 mt-0.5">
                {formatNumber(grandTotals.stage3TeamIssued)} {item.unit}
              </div>
              <div className="text-[9.5px] text-slate-600">
                In-Hand: {formatNumber(grandTotals.allTeamsInHand)}
              </div>
            </div>

            <div className="border-r border-slate-300 pr-1.5">
              <div className="text-[10px] font-extrabold uppercase text-teal-900">
                {stepNo.usage}. Usage
              </div>
              <div className="text-xs font-black font-mono text-slate-900 mt-0.5">
                {formatNumber(grandTotals.stage4TotalConsumed)} {item.unit}
              </div>
              <div className="text-[9.5px] text-slate-600">
                {formatNumber(grandTotals.stage4Used)}U / {formatNumber(grandTotals.stage4Wastage)}W
              </div>
            </div>

            <div>
              <div className="text-[10px] font-extrabold uppercase text-emerald-900">
                {stepNo.balance}. Total Bal
              </div>
              <div className="text-xs font-black font-mono text-emerald-800 mt-0.5">
                {formatNumber(
                  mode === 'central'
                    ? grandTotals.totalSystemRemainingAllTiers
                    : grandTotals.siteSpecificStock?.availableBalance ?? 0
                )}{' '}
                {item.unit}
              </div>
              <div className="text-[9.5px] font-bold text-emerald-900">
                {grandTotals.hasFocFlow
                  ? `FOC Ret: ${formatNumber(grandTotals.stage5TotalProjectReturnableToClient)}`
                  : mode === 'central'
                  ? 'All Tiers'
                  : 'Yard Bal'}
              </div>
            </div>
          </div>

          {/* Print Table 1a: FOC Central Stock Receipt */}
          {grandTotals.hasFocFlow && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider bg-indigo-50 px-2.5 py-1.5 border border-slate-300">
                1a. FOC Central Stock Receipt (Client FOC Vouchers at Main Central Warehouse)
              </h3>
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 p-2 text-left">FOC Voucher #</th>
                    <th className="border border-slate-300 p-2 text-left">Client &amp; Dispatch Note</th>
                    <th className="border border-slate-300 p-2 text-left">Project &amp; Allocated Site</th>
                    <th className="border border-slate-300 p-2 text-left">Received Date</th>
                    <th className="border border-slate-300 p-2 text-right">Initial FOC Qty ({item.unit})</th>
                  </tr>
                </thead>
                <tbody>
                  {initialCentralFocReceipts.map((foc) => (
                    <tr key={foc.id}>
                      <td className="border border-slate-300 p-2 font-mono font-bold">{foc.voucherNo}</td>
                      <td className="border border-slate-300 p-2">
                        {foc.clientName} (DN: {foc.dispatchNoteNo})
                      </td>
                      <td className="border border-slate-300 p-2">
                        {foc.projectName} — Site: {foc.assignedSiteName}
                      </td>
                      <td className="border border-slate-300 p-2">{formatDateTime(foc.date)}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                        +{formatNumber(foc.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Print Table 1b: Main Central Inbound */}
          {mode === 'central' && !focProjectId && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider bg-slate-100 px-2.5 py-1.5 border border-slate-300">
                1b. Main Central Inbound Sources (PO GRNs, Manual Entries, Client FOC &amp; HQ Branch Returns)
              </h3>
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 p-2 text-left">Ref / PO #</th>
                    <th className="border border-slate-300 p-2 text-left">Channel</th>
                    <th className="border border-slate-300 p-2 text-left">Supplier / Source</th>
                    <th className="border border-slate-300 p-2 text-left">Date</th>
                    <th className="border border-slate-300 p-2 text-right">Qty ({item.unit})</th>
                  </tr>
                </thead>
                <tbody>
                  {centralInboundRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="border border-slate-300 p-2 text-center text-slate-500">
                        No central inbound records.
                      </td>
                    </tr>
                  ) : (
                    centralInboundRecords.map((rec) => (
                      <tr key={rec.id}>
                        <td className="border border-slate-300 p-2 font-mono font-bold">{rec.refNo}</td>
                        <td className="border border-slate-300 p-2">{rec.sourceType}</td>
                        <td className="border border-slate-300 p-2">{rec.partyName}</td>
                        <td className="border border-slate-300 p-2">{formatDateTime(rec.date)}</td>
                        <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                          +{formatNumber(rec.qty)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Print Table 2: Regional Site Branches (Central) OR Site Inbound (Site Mode) */}
          {mode === 'central' && !focProjectId ? (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider bg-blue-50 px-2.5 py-1.5 border border-slate-300">
                2. Regional Site Branches — Distribution from Main Central
              </h3>
              <table className="w-full text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 p-1.5 text-left">Regional Branch</th>
                    <th className="border border-slate-300 p-1.5 text-right">From Central</th>
                    {hasSubSiteStep && <th className="border border-slate-300 p-1.5 text-right">To Sub-Sites</th>}
                    <th className="border border-slate-300 p-1.5 text-right">Team Issue</th>
                    <th className="border border-slate-300 p-1.5 text-right">Used + Waste</th>
                    <th className="border border-slate-300 p-1.5 text-right">HQ BRM</th>
                    <th className="border border-slate-300 p-1.5 text-right">Regional Bal</th>
                    <th className="border border-slate-300 p-1.5 text-right">Teams Hand</th>
                  </tr>
                </thead>
                <tbody>
                  {regionalBranchRows.length === 0 ? (
                    <tr>
                      <td colSpan={hasSubSiteStep ? 8 : 7} className="border border-slate-300 p-2 text-center text-slate-500">
                        No regional branch distributions recorded.
                      </td>
                    </tr>
                  ) : (
                    regionalBranchRows.map((row) => (
                      <tr key={row.site.id}>
                        <td className="border border-slate-300 p-1.5 font-bold">{row.site.name}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">+{formatNumber(row.receivedTotal)}</td>
                        {hasSubSiteStep && (
                          <td className="border border-slate-300 p-1.5 text-right font-mono">
                            {row.issuedToSubSites > 0 ? `-${formatNumber(row.issuedToSubSites)}` : '0'}
                          </td>
                        )}
                        <td className="border border-slate-300 p-1.5 text-right font-mono">{formatNumber(row.issuedToTeams)}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">
                          {formatNumber(row.siteUsedQty + row.siteWastedQty + row.teamDamagedRet)}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">
                          {formatNumber(row.returnedToHqGood)}G
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">
                          {formatNumber(row.siteInHand)} {item.unit}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">
                          {formatNumber(row.siteTeamsInHand)} {item.unit}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider bg-slate-100 px-2.5 py-1.5 border border-slate-300">
                {isSubSiteView && hasSubSiteStep
                  ? `3. Sub-Site Inbound Receipts — Received by ${targetSite?.name}`
                  : `2. ${isSubSiteView ? 'Sub-Site' : 'Regional Site'} Inbound Receipts`}
              </h3>
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 p-2 text-left">Requisition #</th>
                    <th className="border border-slate-300 p-2 text-left">Source Branch</th>
                    <th className="border border-slate-300 p-2 text-left">Destination &amp; Category</th>
                    <th className="border border-slate-300 p-2 text-left">Date</th>
                    <th className="border border-slate-300 p-2 text-left">Status</th>
                    <th className="border border-slate-300 p-2 text-right">Qty ({item.unit})</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedSiteTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-slate-300 p-2 text-center text-slate-500">
                        No transfer records.
                      </td>
                    </tr>
                  ) : (
                    displayedSiteTransfers.map((tr) => (
                      <tr key={tr.id}>
                        <td className="border border-slate-300 p-2 font-mono font-bold">{tr.voucherNo}</td>
                        <td className="border border-slate-300 p-2 font-semibold">
                          {tr.isFromParentBranch ? `Parent: ${tr.sourceSiteName}` : tr.sourceSiteName}
                        </td>
                        <td className="border border-slate-300 p-2">
                          {tr.targetIsSubSite ? `Sub-Site: ${tr.siteName}` : tr.siteName} — {tr.category}
                        </td>
                        <td className="border border-slate-300 p-2">{formatDateTime(tr.date)}</td>
                        <td className="border border-slate-300 p-2">{tr.status}</td>
                        <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                          +{formatNumber(tr.qty)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Print Table 3 (ONLY WHEN SUB-SITE STEP EXISTS): SUB-SITE DISTRIBUTION */}
          {hasSubSiteStep && !focProjectId && (mode === 'central' || !isSubSiteView) && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider bg-sky-50 px-2.5 py-1.5 border border-slate-300">
                3. Sub-Site Distribution — Issued from Regional Branches to Sub-Sites
              </h3>
              {displayedSubSiteRows.length > 0 && (
                <table className="w-full text-[11px] border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-300 p-1.5 text-left">Sub-Site</th>
                      <th className="border border-slate-300 p-1.5 text-left">Parent Regional</th>
                      <th className="border border-slate-300 p-1.5 text-right">From Parent</th>
                      <th className="border border-slate-300 p-1.5 text-right">Direct HQ</th>
                      <th className="border border-slate-300 p-1.5 text-right">Team Issue</th>
                      <th className="border border-slate-300 p-1.5 text-right">Used + Waste</th>
                      <th className="border border-slate-300 p-1.5 text-right">BRM → Parent</th>
                      <th className="border border-slate-300 p-1.5 text-right">Sub-Site Bal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedSubSiteRows.map((row) => (
                      <tr key={row.site.id} className="bg-sky-50/30">
                        <td className="border border-slate-300 p-1.5 font-bold">↳ {row.site.name}</td>
                        <td className="border border-slate-300 p-1.5">{row.parentSiteName || 'Parent'}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">
                          +{formatNumber(row.receivedFromParentBranch)}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">
                          {row.receivedFromHq > 0 ? `+${formatNumber(row.receivedFromHq)}` : '0'}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">{formatNumber(row.issuedToTeams)}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">
                          {formatNumber(row.siteUsedQty + row.siteWastedQty + row.teamDamagedRet)}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">
                          {formatNumber(row.returnedToParentGood)}G
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">
                          {formatNumber(row.siteInHand)} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {subSiteDispatchTransfers.length > 0 && (
                <table className="w-full text-[11px] border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-sky-50">
                      <th className="border border-slate-300 p-1.5 text-left">Transfer #</th>
                      <th className="border border-slate-300 p-1.5 text-left">From Regional Hub</th>
                      <th className="border border-slate-300 p-1.5 text-left">To Sub-Site</th>
                      <th className="border border-slate-300 p-1.5 text-left">Date</th>
                      <th className="border border-slate-300 p-1.5 text-right">Qty ({item.unit})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subSiteDispatchTransfers.map((tr) => (
                      <tr key={tr.id}>
                        <td className="border border-slate-300 p-1.5 font-mono font-bold">{tr.voucherNo}</td>
                        <td className="border border-slate-300 p-1.5">{tr.sourceSiteName}</td>
                        <td className="border border-slate-300 p-1.5 font-bold">↳ {tr.siteName}</td>
                        <td className="border border-slate-300 p-1.5">{formatDateTime(tr.date)}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">
                          {formatNumber(tr.qty)} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Print Table 3 or 4: Field Teams Issue */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider bg-slate-100 px-2.5 py-1.5 border border-slate-300">
              {stepNo.team}. Team Issue — Field Teams Allocation, Returns &amp; Team In-Hand
            </h3>
            <table className="w-full text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-300 p-2 text-left">Field Team</th>
                  <th className="border border-slate-300 p-2 text-left">Assigned Branch &amp; Tier</th>
                  <th className="border border-slate-300 p-2 text-right">Team Issue</th>
                  <th className="border border-slate-300 p-2 text-right">Returned (G/D)</th>
                  <th className="border border-slate-300 p-2 text-right">Used</th>
                  <th className="border border-slate-300 p-2 text-right">Wasted</th>
                  <th className="border border-slate-300 p-2 text-right">Team In-Hand</th>
                </tr>
              </thead>
              <tbody>
                {teamBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-slate-300 p-2 text-center text-slate-500">
                      No field team allocations.
                    </td>
                  </tr>
                ) : (
                  teamBreakdown.map((tb) => (
                    <tr key={tb.team.id}>
                      <td className="border border-slate-300 p-2 font-bold">
                        {tb.team.teamName} ({tb.team.teamLeaderName})
                      </td>
                      <td className="border border-slate-300 p-2">
                        {tb.isSubSiteTeam ? `↳ ${tb.siteName} (Sub-Site)` : tb.siteName}
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-mono">{formatNumber(tb.issuedQty)}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono">
                        {formatNumber(tb.returnedGoodQty)} / {formatNumber(tb.returnedDamagedQty)}
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-mono">{formatNumber(tb.usedQty)}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono">{formatNumber(tb.wastedQty)}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                        {formatNumber(tb.inHandQty)} {item.unit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Print Table 4 or 5: Usage & Wastage */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider bg-slate-100 px-2.5 py-1.5 border border-slate-300">
              {stepNo.usage}. Usage &amp; Wastage — Sub-Project Usage Flow &amp; Field Scrap Records
            </h3>

            {subProjectFlowSections.length > 0 && (
              <table className="w-full text-xs border-collapse border border-slate-300 mb-2">
                <thead>
                  <tr className="bg-teal-50">
                    <th className="border border-slate-300 p-2 text-left">Sub-Project Code &amp; Name</th>
                    <th className="border border-slate-300 p-2 text-center">Vouchers</th>
                    <th className="border border-slate-300 p-2 text-right">Used ({item.unit})</th>
                    <th className="border border-slate-300 p-2 text-right">Wastage ({item.unit})</th>
                    <th className="border border-slate-300 p-2 text-right">Total Consumed ({item.unit})</th>
                    <th className="border border-slate-300 p-2 text-right">Share %</th>
                  </tr>
                </thead>
                <tbody>
                  {subProjectFlowSections.map((spf) => {
                    const sharePct =
                      grandTotals.stage4TotalConsumed > 0
                        ? Math.round((spf.spTotalConsumed / grandTotals.stage4TotalConsumed) * 100)
                        : 0;
                    return (
                      <tr key={spf.subProject.id}>
                        <td className="border border-slate-300 p-2 font-bold">
                          [{spf.subProject.projectId}] {spf.subProject.projectName}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-mono">{spf.spLogs.length}</td>
                        <td className="border border-slate-300 p-2 text-right font-mono">{formatNumber(spf.spUsed)}</td>
                        <td className="border border-slate-300 p-2 text-right font-mono">{formatNumber(spf.spWastage)}</td>
                        <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                          {formatNumber(spf.spTotalConsumed)} {item.unit}
                        </td>
                        <td className="border border-slate-300 p-2 text-right font-mono">{sharePct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            <table className="w-full text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-300 p-2 text-left">Voucher #</th>
                  <th className="border border-slate-300 p-2 text-left">Date</th>
                  <th className="border border-slate-300 p-2 text-left">Sub-Project / Project</th>
                  <th className="border border-slate-300 p-2 text-left">Branch &amp; Team</th>
                  <th className="border border-slate-300 p-2 text-right">Usage</th>
                  <th className="border border-slate-300 p-2 text-right">Wastage</th>
                  <th className="border border-slate-300 p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {projectUsageLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-slate-300 p-2 text-center text-slate-500">
                      No project consumption records.
                    </td>
                  </tr>
                ) : (
                  projectUsageLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="border border-slate-300 p-2 font-mono font-bold">{log.voucherNo}</td>
                      <td className="border border-slate-300 p-2">{formatDateTime(log.date)}</td>
                      <td className="border border-slate-300 p-2 font-semibold">
                        [{log.projectCode}] {log.projectName}
                      </td>
                      <td className="border border-slate-300 p-2">
                        {log.siteIsSubSite ? `Sub-Site: ${log.siteName}` : log.siteName} — {log.teamName}
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-mono">{formatNumber(log.usedQty)}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono">{formatNumber(log.wastedQty)}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                        {formatNumber(log.totalDeducted)} {item.unit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Print Upstream BRM Table */}
          {branchReturnRecords.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider bg-teal-50 px-2.5 py-1.5 border border-slate-300">
                Upstream Branch Return Notes (BRM — Sub-Site → Regional &amp; Regional → Main Central)
              </h3>
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 p-2 text-left">BRM #</th>
                    <th className="border border-slate-300 p-2 text-left">From Branch</th>
                    <th className="border border-slate-300 p-2 text-left">Returned To</th>
                    <th className="border border-slate-300 p-2 text-left">Condition</th>
                    <th className="border border-slate-300 p-2 text-left">Date</th>
                    <th className="border border-slate-300 p-2 text-right">Qty ({item.unit})</th>
                  </tr>
                </thead>
                <tbody>
                  {branchReturnRecords.map((br) => (
                    <tr key={br.id}>
                      <td className="border border-slate-300 p-2 font-mono font-bold">{br.brmNo}</td>
                      <td className="border border-slate-300 p-2">{br.fromSiteName}</td>
                      <td className="border border-slate-300 p-2">
                        {br.toSiteName} ({br.isSubSiteToParent ? 'Parent Branch' : 'Main Central'})
                      </td>
                      <td className="border border-slate-300 p-2">{br.condition}</td>
                      <td className="border border-slate-300 p-2">{formatDateTime(br.date)}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                        {formatNumber(br.qty)} {item.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Print Table 5 or 6: Final Total Balance Statement */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider bg-emerald-50 px-2.5 py-1.5 border border-slate-300">
              {stepNo.balance}. Total Balance &amp; {stepNo.totalSteps}-Step Reconciliation Statement
            </h3>
            <table className="w-full text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-300 p-2 text-right">1. Main Central</th>
                  <th className="border border-slate-300 p-2 text-right">
                    {hasSubSiteStep ? '2. Regional' : '2. Regional / Site'}
                  </th>
                  {hasSubSiteStep && <th className="border border-slate-300 p-2 text-right">3. Sub-Site</th>}
                  <th className="border border-slate-300 p-2 text-right">{stepNo.team}. Team Issue</th>
                  <th className="border border-slate-300 p-2 text-right">{stepNo.usage}. Used + Waste</th>
                  <th className="border border-slate-300 p-2 text-right">{stepNo.balance}. Total Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                    {formatNumber(grandTotals.totalReceivedAtHq)} {item.unit} (Bal: {formatNumber(grandTotals.centralInHand)})
                  </td>
                  <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                    {formatNumber(
                      mode === 'central'
                        ? grandTotals.hqToRegionalIssued
                        : isSubSiteView && hasSubSiteStep
                        ? parentSiteStock?.received || 0
                        : grandTotals.siteSpecificStock?.received || 0
                    )}{' '}
                    {item.unit}
                  </td>
                  {hasSubSiteStep && (
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                      {formatNumber(
                        mode === 'central'
                          ? grandTotals.regionalToSubSiteIssued > 0
                            ? grandTotals.subSiteTotalReceived
                            : grandTotals.hqToSubSiteDirectIssued
                          : isSubSiteView
                          ? grandTotals.siteSpecificStock?.received || 0
                          : targetSiteBreakdownRow?.issuedToSubSites || 0
                      )}{' '}
                      {item.unit}
                    </td>
                  )}
                  <td className="border border-slate-300 p-2 text-right font-mono">
                    {formatNumber(grandTotals.stage3TeamIssued)} {item.unit}
                  </td>
                  <td className="border border-slate-300 p-2 text-right font-mono">
                    {formatNumber(grandTotals.stage4TotalConsumed)} {item.unit} ({formatNumber(grandTotals.stage4Used)}U + {formatNumber(grandTotals.stage4Wastage)}W)
                  </td>
                  <td className="border border-slate-300 p-2 text-right font-mono font-black">
                    {formatNumber(
                      mode === 'central'
                        ? grandTotals.totalSystemRemainingAllTiers
                        : grandTotals.siteSpecificStock?.availableBalance ?? 0
                    )}{' '}
                    {item.unit}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ISO Sign-off Footer */}
          <div className="grid grid-cols-3 gap-6 pt-6 text-xs">
            <div className="text-center">
              {!offDigitalSignature &&
              matchDigitalSignature(digitalSignatures, activeTemplate?.preparedBy || currentUser?.fullName, 'prepared') ? (
                <div className="h-14 flex items-end justify-center pb-1 border-b border-slate-400 mb-1.5">
                  <img
                    src={
                      matchDigitalSignature(digitalSignatures, activeTemplate?.preparedBy || currentUser?.fullName, 'prepared')!
                        .signatureDataUrl
                    }
                    alt="Prepared Signature"
                    className="max-h-12 max-w-[140px] object-contain mix-blend-multiply"
                  />
                </div>
              ) : (
                <div className="h-16 flex flex-col justify-end border-b border-dashed border-slate-400 mb-1.5 pb-1">
                  <span className="text-[10px] text-slate-400 italic">Hand Signature &amp; Date</span>
                </div>
              )}
              <div className="font-semibold text-slate-900">Prepared By (Store / Inventory Officer)</div>
            </div>
            <div className="text-center">
              {!offDigitalSignature &&
              matchDigitalSignature(digitalSignatures, activeTemplate?.approvedBy || currentUser?.fullName, 'approved') ? (
                <div className="h-14 flex items-end justify-center pb-1 border-b border-slate-400 mb-1.5">
                  <img
                    src={
                      matchDigitalSignature(digitalSignatures, activeTemplate?.approvedBy || currentUser?.fullName, 'approved')!
                        .signatureDataUrl
                    }
                    alt="Verified Signature"
                    className="max-h-12 max-w-[140px] object-contain mix-blend-multiply"
                  />
                </div>
              ) : (
                <div className="h-16 flex flex-col justify-end border-b border-dashed border-slate-400 mb-1.5 pb-1">
                  <span className="text-[10px] text-slate-400 italic">Hand Signature &amp; Date</span>
                </div>
              )}
              <div className="font-semibold text-slate-900">Verified By (Site / Operations Engineer)</div>
            </div>
            <div className="text-center">
              <div className="h-16 flex flex-col justify-end border-b border-dashed border-slate-400 mb-1.5 pb-1">
                <span className="text-[10px] text-slate-400 italic">Hand Signature &amp; Stamp</span>
              </div>
              <div className="font-semibold text-slate-900">Client / Management Reconciliation Sign-Off</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
