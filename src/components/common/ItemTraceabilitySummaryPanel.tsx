import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Building2,
  Users,
  Hammer,
  AlertTriangle,
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
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Item } from '../../types';
import { formatNumber, formatDateTime } from '../../utils/exportUtils';
import { printHtmlElement, downloadElementAsPdf } from '../../utils/printUtils';

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
    allTeamsInHandStock,
  } = useStock();

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [printWithImage, setPrintWithImage] = useState<boolean>(() => Boolean(item.imageUrl));
  const [activeSubView, setActiveSubView] = useState<
    'overview' | 'central-foc' | 'inbound' | 'sites' | 'teams' | 'projects' | 'reconciliation'
  >('overview');

  const printElementId = `item-trace-print-${mode}-${item.id}-${siteId || 'hq'}-${focProjectId || 'all'}`;

  const targetSite = useMemo(
    () => (siteId ? sites.find((s) => s.id === siteId) || null : null),
    [sites, siteId]
  );

  const targetFocProject = useMemo(
    () => (focProjectId ? projects.find((p) => p.id === focProjectId) || null : null),
    [projects, focProjectId]
  );

  // Resolve project family IDs & names when focProjectId is passed (or when site has FOC projects)
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

    // If no explicit focProjectId, find projects assigned to siteId
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

  // STAGE 1: INITIAL FOC RECEIPTS AT CENTRAL STOCK (Client Free-Issue Vouchers received at Central)
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
          // Only show Central FOC at a Site Branch IF there is an actual FOC issue to THIS site
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

          // Legacy fallback without focProjectId: strictly match vouchers explicitly assigned to THIS site
          const fProj = projects.find((p) => p.id === f.projectId || p.id === f.parentProjectId);
          const effectiveSiteId = f.assignedSiteId || fProj?.siteId;
          return effectiveSiteId === siteId;
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
  ]);

  // 2. INBOUND SOURCES TO CENTRAL STOCK (POs, Manual Entries, Client FOC, Branch Returns)
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
        partyName: `${f.clientName} (${f.projectName}) • DN: ${f.dispatchNoteNo}`,
        date: f.date,
        qty: f.qty,
        receivedBy: f.receivedBy,
        notes: `Allocated Site: ${f.assignedSiteName} • Stored at: ${f.storageLocation}`,
        badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      });
    });

    if (!focProjectId) {
      branchReturns
        .filter((br) => !br.isDeleted && br.itemId === item.id)
        .forEach((br) => {
          records.push({
            id: `br-${br.id}`,
            refNo: br.branchReturnNumber,
            sourceType: 'Site Good Return',
            isCentralFoc: false,
            partyName: `Site: ${br.siteName || br.fromSiteName || 'Branch Site'} (${br.condition})`,
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
  }, [mainStockEntries, initialCentralFocReceipts, branchReturns, item.id, focProjectId]);

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
      .filter((br) => !br.isDeleted && br.itemId === item.id)
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
  }, [mainStockEntries, initialCentralFocReceipts, branchReturns, purchaseOrders, item.id]);

  // 3. SITE BRANCH DISTRIBUTION & SITE IN-HAND BREAKDOWN
  const siteBranchBreakdown = useMemo(() => {
    const branchSites = activeSites.filter((s) => !s.isMainWarehouse);

    return branchSites
      .map((site) => {
        const sStock = getSiteItemStock(site.id, item.id);

        const returnedToHqGood = branchReturns
          .filter(
            (br) =>
              !br.isDeleted &&
              (br.siteId === site.id || br.fromSiteId === site.id) &&
              br.itemId === item.id &&
              br.condition === 'Good / Restock'
          )
          .reduce((sum, br) => sum + Number(br.quantity || 0), 0);

        const returnedToHqDamaged = branchReturns
          .filter(
            (br) =>
              !br.isDeleted &&
              (br.siteId === site.id || br.fromSiteId === site.id) &&
              br.itemId === item.id &&
              br.condition === 'Damaged / Scrap'
          )
          .reduce((sum, br) => sum + Number(br.quantity || 0), 0);

        const inTransitQty = stockRequests
          .filter((req) => req.siteId === site.id && req.status === 'Approved / In-Transit')
          .reduce((sum, req) => {
            const row = (req.items || []).find((r) => r.itemId === item.id);
            return sum + (row ? Number(row.approvedQty ?? row.requestedQty ?? 0) : 0);
          }, 0);

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

        const hasAnyActivity =
          sStock.received > 0 ||
          inTransitQty > 0 ||
          sStock.issued > 0 ||
          sStock.returned > 0 ||
          sStock.availableBalance > 0 ||
          siteTeamsInHand > 0 ||
          siteUsedQty > 0 ||
          siteWastedQty > 0 ||
          returnedToHqGood > 0 ||
          returnedToHqDamaged > 0;

        return {
          site,
          receivedFromHq: sStock.received,
          normalReceived: sStock.normalReceived,
          focReceived: sStock.focReceived,
          inTransitQty,
          issuedToTeams: sStock.issued,
          returnedFromTeams: sStock.returned,
          returnedToHqGood,
          returnedToHqDamaged,
          siteInHand: sStock.availableBalance,
          siteTeamsInHand,
          siteUsedQty,
          siteWastedQty,
          hasAnyActivity,
        };
      })
      .filter((row) => (mode === 'site' && siteId ? row.site.id === siteId : row.hasAnyActivity));
  }, [
    activeSites,
    getSiteItemStock,
    item.id,
    branchReturns,
    stockRequests,
    allTeamsInHandStock,
    projectUsages,
    mode,
    siteId,
  ]);

  // STAGE 2: SITE ISSUE TRANSFERS (Central -> Site Branch Requisitions, cleanly separated from Stage 1 Central FOC Receipt)
  const siteInboundTransfers = useMemo(() => {
    const list: Array<{
      id: string;
      voucherNo: string;
      date: string;
      siteName: string;
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
      .filter(
        (req) =>
          (req.status === 'Accepted' || req.status === 'Approved / In-Transit') &&
          (!siteId || mode === 'central' || req.siteId === siteId)
      )
      .forEach((req) => {
        const row = (req.items || []).find((i) => i.itemId === item.id);
        if (!row) return;
        const qty =
          req.status === 'Accepted'
            ? Number(row.receivedQty ?? row.approvedQty ?? row.requestedQty ?? 0)
            : Number(row.approvedQty ?? row.requestedQty ?? 0);
        if (qty <= 0) return;

        // Determine if this requisition is a Central FOC transfer
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

        // If viewing a specific FOC Project (focProjectId is passed), check if this FOC transfer belongs to that project
        if (focProjectId && isFocReq && req.focProjectId && !focProjectFamily.familyIds.has(req.focProjectId)) {
          return;
        }

        const sName = sites.find((s) => s.id === req.siteId)?.name || 'Site Branch';
        const projLabel =
          req.focProjectName ||
          targetFocProject?.projectName ||
          initialCentralFocReceipts[0]?.projectName ||
          'Assigned Project';

        list.push({
          id: req.id,
          voucherNo: req.requestNoteNumber,
          date: req.acceptanceDate || req.approvalDate || req.requestedDate,
          siteName: sName,
          category: isFocReq
            ? `Central FOC Issue (${projLabel})`
            : 'Normal HQ Stock Transfer',
          isCentralFoc: isFocReq,
          focProjectLabel: isFocReq ? projLabel : undefined,
          status: req.status,
          qty,
          byUser: req.acceptedBy || req.approvedBy || req.requestedBy,
        });
      });

    // Fallback: Only include a clientFreeIssue directly as a Site Issue if it was physically stored at the Site Branch
    // AND no requisition transfer exists for it (legacy direct-to-site entry)
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
          list.push({
            id: `foc-direct-${f.id}`,
            voucherNo: f.voucherNo,
            date: f.date,
            siteName: f.assignedSiteName,
            category: `Central FOC Direct Site Receipt (${f.clientName} — ${f.projectName})`,
            isCentralFoc: true,
            focProjectLabel: f.projectName,
            status: 'Accepted at Site',
            qty: f.qty,
            byUser: f.receivedBy,
          });
        }
      });
    }

    // Sort so Central FOC transfers appear prominently first, then by newest date
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
    item.id,
    siteId,
    mode,
    getSiteItemStock,
  ]);

  // STAGE 3: FIELD TEAMS BREAKDOWN (Issued, Used, Wasted, Returned, Team In-Hand)
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

  // STAGE 4: PROJECT CONSUMPTION & WASTAGE LOGS
  const projectUsageLogs = useMemo(() => {
    const logs: Array<{
      id: string;
      voucherNo: string;
      date: string;
      projectId: string;
      projectCode: string;
      projectName: string;
      siteName: string;
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
        const sName = sites.find((s) => s.id === u.siteId)?.name || 'Site Branch';
        const tName =
          u.teamName || teams.find((t) => t.id === u.teamId)?.teamName || 'Field Team';

        logs.push({
          id: u.id,
          voucherNo: u.usageVoucherNumber,
          date: u.usageDate || u.date,
          projectId: u.projectId,
          projectCode: proj?.projectId || 'PRJ',
          projectName: u.projectName || proj?.projectName || 'Project Installation',
          siteName: sName,
          teamName: tName,
          usedQty,
          wastedQty,
          totalDeducted: usedQty + wastedQty,
          workDetails: u.workDetails || '',
        });
      });

    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [projectUsages, projects, sites, teams, item.id, mode, siteId, focProjectId, focProjectFamily]);

  // SUB-PROJECT SEQUENTIAL FLOW SECTIONS (For Main Projects with Sub-Projects e.g. KT-RGL-0505, KT-ABK-0506)
  const subProjectFlowSections = useMemo(() => {
    const rootId = focProjectFamily.rootProjectId;
    const childSubProjs = rootId
      ? projects.filter((p) => !p.isDeleted && p.parentProjectId === rootId)
      : [];

    // Also include any distinct projects present in projectUsageLogs if no childSubProjs found
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

  // STAGE 5: AGGREGATE CUSTODY & 5-STAGE FOC RECONCILIATION TOTALS
  const grandTotals = useMemo(() => {
    const allSitesInHand = siteBranchBreakdown.reduce((s, r) => s + r.siteInHand, 0);
    const allSitesInTransit = siteBranchBreakdown.reduce((s, r) => s + r.inTransitQty, 0);
    const allTeamsInHand = teamBreakdown.reduce((s, r) => s + r.inHandQty, 0);
    const totalIssuedToTeams = teamBreakdown.reduce((s, r) => s + r.issuedQty, 0);
    const totalUsedOnProjects = projectUsageLogs.reduce((s, r) => s + r.usedQty, 0);
    const totalWastedOnProjects = projectUsageLogs.reduce((s, r) => s + r.wastedQty, 0);
    const totalTeamDamagedReturns = teamBreakdown.reduce((s, r) => s + r.returnedDamagedQty, 0);
    const totalTeamGoodReturns = teamBreakdown.reduce((s, r) => s + r.returnedGoodQty, 0);

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

    // 5-Stage FOC Reconciliation Specific Metrics
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

    const centralFocPoolRemaining = Math.max(0, stage1InitialCentralFoc - effectiveSiteFocIssued);

    const stage3TeamIssued = totalIssuedToTeams;
    const stage3TeamReturnedGood = totalTeamGoodReturns;
    const stage3NetTeamIssued = Math.max(0, stage3TeamIssued - stage3TeamReturnedGood);

    const stage4Used = totalUsedOnProjects;
    const stage4Wastage = totalWastedOnProjects + totalTeamDamagedReturns;
    const stage4TotalConsumed = stage4Used + stage4Wastage;

    // Stage 5: Balance / Returnable Stock on Project Completion
    // FOC Balance remaining at Site (Site Yard FOC + Team In-Hand FOC) = Site FOC Issued - Consumed (capped at 0)
    const focConsumedAtSite =
      effectiveSiteFocIssued > 0
        ? Math.min(effectiveSiteFocIssued, stage4TotalConsumed)
        : 0;
    const stage5SiteFocReturnableBalance = Math.max(0, effectiveSiteFocIssued - focConsumedAtSite);
    const stage5TotalProjectReturnableToClient = Math.max(
      0,
      stage1InitialCentralFoc - stage4TotalConsumed
    );

    // Normal HQ stock balance at site (if site also received Normal HQ transfers)
    const normalConsumedAtSite = Math.max(0, stage4TotalConsumed - focConsumedAtSite);
    const siteNormalRemainingBalance = Math.max(0, effectiveSiteNormalIssued - normalConsumedAtSite);

    const hasFocFlow =
      Boolean(focProjectId) ||
      (mode === 'site' ? effectiveSiteFocIssued > 0 : stage1InitialCentralFoc > 0 || effectiveSiteFocIssued > 0);

    return {
      centralInHand: mainStock.availableBalance,
      centralNormalInHand: Math.max(0, mainStock.companyReceived - mainStock.companyDispatched),
      centralFocInHand: Math.max(0, mainStock.focReceived - mainStock.focDispatched),
      totalReceivedAtHq: mainStock.totalReceived,
      dispatchedFromHq: mainStock.dispatched,
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
      // 5-Stage FOC Reconciliation Fields
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
    };
  }, [
    siteBranchBreakdown,
    teamBreakdown,
    projectUsageLogs,
    supplierReturns,
    mainStock,
    getSiteItemStock,
    siteId,
    item.id,
    mode,
    initialCentralFocReceipts,
    siteInboundTransfers,
    focProjectId,
  ]);

  const handlePrintReport = async () => {
    const safeCode = (item.itemCode || 'ITEM').replace(/[^a-zA-Z0-9_-]/g, '_');
    const prefix = focProjectId
      ? `FOC_Reconciliation_${targetFocProject?.projectId || 'Project'}`
      : mode === 'central'
      ? 'Central_Stock_Item_Trace'
      : `Site_Stock_Item_Trace_${targetSite?.name || 'Branch'}`;
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
        ? 'Central_Item_Traceability'
        : `Site_Item_Traceability_${targetSite?.name || 'Branch'}`;
      const ok = await downloadElementAsPdf(printElementId, `${prefix}_${safeCode}`);
      if (ok) {
        setPdfNotice({
          type: 'success',
          text: `✓ PDF downloaded: ${prefix}_${safeCode}.pdf`,
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

  // Filter transfers when in pure FOC project view vs general Site view
  const displayedSiteTransfers = useMemo(() => {
    if (focProjectId) {
      const focOnly = siteInboundTransfers.filter((tr) => tr.isCentralFoc);
      return focOnly.length > 0 ? focOnly : siteInboundTransfers;
    }
    return siteInboundTransfers;
  }, [siteInboundTransfers, focProjectId]);

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
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                {focProjectId
                  ? `🏢 Standard 5-Stage FOC Reconciliation — ${targetSite?.name || 'Assigned Site Branch'}`
                  : mode === 'central'
                  ? 'Full End-to-End Material Lifecycle & Custody Summary'
                  : `Site Branch Reconciliation & Forward Traceability — ${targetSite?.name || 'Branch Yard'}`}
              </span>
              {grandTotals.hasFocFlow && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500 text-white border border-indigo-300 shadow-xs">
                  <Gift className="w-3 h-3" />
                  Central FOC
                </span>
              )}
              {targetFocProject && (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/30 text-indigo-100 border border-indigo-300/40">
                  Project: [{targetFocProject.projectId}] {targetFocProject.projectName}
                </span>
              )}
              <span className="font-mono text-xs font-bold text-emerald-300 bg-black/25 px-2 py-0.5 rounded">
                {item.itemCode}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                • {item.category} ({item.unit})
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5 tracking-tight">
              {item.itemName}
            </h3>
            <p className="text-[11px] text-emerald-200/90 font-medium mt-0.5">
              ✓ Standard Reconciliation Flow:{' '}
              <strong>
                1. FOC Central Stock Receipt → 2. Site Issue → 3. Team Issue → 4. Usage &amp; Wastage → 5. Balance / Returnable Stock on Completion
              </strong>
            </p>
          </div>
        </div>

        {/* Action Buttons: Print with Image Toggle & Print & PDF & Close */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/30 hover:bg-black/40 border border-amber-400/40 text-amber-200 text-xs font-bold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={printWithImage}
              onChange={(e) => setPrintWithImage(e.target.checked)}
              className="rounded border-amber-400 text-amber-500 focus:ring-amber-500"
            />
            <span>Print with Image</span>
          </label>
          <button
            type="button"
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            Print A4 Item Report
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
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
        {/* 5-STAGE STANDARD RECONCILIATION FLOW KPI PIPELINE */}
        {grandTotals.hasFocFlow || mode === 'site' ? (
          <div className="space-y-2.5">
            {/* Flow Pipeline Header Strip */}
            <div
              className={`flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-white border ${
                grandTotals.hasFocFlow
                  ? 'bg-indigo-950 border-indigo-800'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-white font-extrabold uppercase tracking-wider ${
                    grandTotals.hasFocFlow ? 'bg-indigo-500' : 'bg-emerald-600'
                  }`}
                >
                  {grandTotals.hasFocFlow ? (
                    <>
                      <Gift className="w-3 h-3" />
                      Standard FOC Reconciliation Flow
                    </>
                  ) : (
                    <>
                      <Boxes className="w-3 h-3" />
                      Standard Site Material Flow
                    </>
                  )}
                </span>
                <span className={grandTotals.hasFocFlow ? 'text-indigo-200' : 'text-slate-300'}>
                  {grandTotals.hasFocFlow
                    ? '1. FOC Central Stock Receipt → 2. Site Issue → 3. Team Issue → 4. Usage & Wastage → 5. Balance / Returnable Stock'
                    : '1. Central HQ Pool → 2. Site Issue → 3. Team Issue → 4. Usage & Wastage → 5. Site Yard Balance'}
                </span>
              </div>
              {grandTotals.hasFocFlow && grandTotals.effectiveSiteNormalIssued > 0 && !focProjectId && (
                <span className="text-[11px] font-mono bg-white/10 px-2.5 py-0.5 rounded text-emerald-300 border border-white/15">
                  Central FOC &amp; Normal HQ Stock Separated Below
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* STAGE 1: FOC CENTRAL RECEIPT (ONLY IF SITE HAS FOC) OR CENTRAL HQ POOL */}
              {grandTotals.hasFocFlow ? (
                <div className="bg-indigo-50/80 p-3.5 rounded-xl border-2 border-indigo-400/70 shadow-2xs relative">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-indigo-950 uppercase">
                    <span>1. FOC Central Receipt</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-600 text-white">
                      Central FOC
                    </span>
                  </div>
                  <div className="text-2xl font-black font-mono tabular-nums text-indigo-900 mt-1">
                    {formatNumber(grandTotals.stage1InitialCentralFoc)}{' '}
                    <span className="text-xs font-semibold text-indigo-700">{item.unit}</span>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-indigo-200/80 space-y-0.5 text-[11px] text-indigo-900">
                    <div className="flex justify-between">
                      <span>Initial Receipt at HQ:</span>
                      <strong className="font-mono tabular-nums">
                        {formatNumber(grandTotals.stage1InitialCentralFoc)} {item.unit}
                      </strong>
                    </div>
                    <div className="flex justify-between text-indigo-700">
                      <span>Issued to Site(s):</span>
                      <strong className="font-mono tabular-nums">
                        -{formatNumber(grandTotals.effectiveSiteFocIssued)} {item.unit}
                      </strong>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-800">
                      <span>Central FOC Balance:</span>
                      <strong className="font-mono tabular-nums">
                        {formatNumber(grandTotals.centralFocPoolRemaining)} {item.unit}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-300 shadow-2xs relative">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-800 uppercase">
                    <span>1. Central HQ Pool</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-700">
                      Normal HQ
                    </span>
                  </div>
                  <div className="text-2xl font-black font-mono tabular-nums text-slate-900 mt-1">
                    {formatNumber(mainStock.companyReceived)}{' '}
                    <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-200 space-y-0.5 text-[11px] text-slate-700">
                    <div className="flex justify-between">
                      <span>HQ Available:</span>
                      <strong className="font-mono tabular-nums">
                        {formatNumber(grandTotals.centralNormalInHand)} {item.unit}
                      </strong>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-semibold">
                      <span>Issued to This Site:</span>
                      <strong className="font-mono tabular-nums">
                        {formatNumber(grandTotals.effectiveSiteNormalIssued)} {item.unit}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 2: SITE ISSUE (Central -> Site Branch) */}
              <div
                className={`bg-white p-3.5 rounded-xl border-2 shadow-2xs ${
                  grandTotals.hasFocFlow ? 'border-indigo-300' : 'border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-800 uppercase">
                  <span>2. Site Issue (HQ → Site)</span>
                  <Truck className={`w-3.5 h-3.5 ${grandTotals.hasFocFlow ? 'text-indigo-600' : 'text-emerald-700'}`} />
                </div>
                <div
                  className={`text-2xl font-black font-mono tabular-nums mt-1 ${
                    grandTotals.hasFocFlow ? 'text-indigo-700' : 'text-slate-900'
                  }`}
                >
                  {formatNumber(
                    focProjectId
                      ? grandTotals.effectiveSiteFocIssued
                      : grandTotals.hasFocFlow
                      ? grandTotals.effectiveSiteFocIssued
                      : grandTotals.siteSpecificStock?.received || 0
                  )}{' '}
                  <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-100 space-y-0.5 text-[11px]">
                  {grandTotals.hasFocFlow && (
                    <div className="flex justify-between items-center text-indigo-800 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        Central FOC Issue:
                      </span>
                      <strong className="font-mono tabular-nums">
                        {formatNumber(grandTotals.effectiveSiteFocIssued)} {item.unit}
                      </strong>
                    </div>
                  )}
                  {(!focProjectId || grandTotals.effectiveSiteNormalIssued > 0) && (
                    <div className="flex justify-between text-slate-700 font-semibold px-1.5">
                      <span>Normal HQ Issue:</span>
                      <strong className="font-mono tabular-nums">
                        {formatNumber(grandTotals.effectiveSiteNormalIssued)} {item.unit}
                      </strong>
                    </div>
                  )}
                  {!focProjectId && grandTotals.effectiveSiteFocIssued > 0 && grandTotals.effectiveSiteNormalIssued > 0 && (
                    <div className="flex justify-between text-slate-800 font-semibold px-1.5">
                      <span>Total Site Inbound:</span>
                      <strong className="font-mono tabular-nums">
                        {formatNumber(
                          grandTotals.effectiveSiteFocIssued + grandTotals.effectiveSiteNormalIssued
                        )}{' '}
                        {item.unit}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* STAGE 3: TEAM ISSUE (Site -> Field Teams) */}
              <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-300 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-blue-950 uppercase">
                  <span>3. Team Issue (Site → Team)</span>
                  <Users className="w-3.5 h-3.5 text-blue-700" />
                </div>
                <div className="text-2xl font-black font-mono tabular-nums text-blue-800 mt-1">
                  {formatNumber(grandTotals.stage3TeamIssued)}{' '}
                  <span className="text-xs font-semibold text-blue-700">{item.unit}</span>
                </div>
                <div className="mt-2 pt-1.5 border-t border-blue-200/70 space-y-0.5 text-[11px] text-blue-900">
                  <div className="flex justify-between">
                    <span>Returned Good to Site:</span>
                    <strong className="font-mono tabular-nums text-emerald-700">
                      +{formatNumber(grandTotals.stage3TeamReturnedGood)} {item.unit}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Team Allocation:</span>
                    <strong className="font-mono tabular-nums">
                      {formatNumber(grandTotals.stage3NetTeamIssued)} {item.unit}
                    </strong>
                  </div>
                  <div className="flex justify-between font-bold text-indigo-800">
                    <span>Current Teams In-Hand:</span>
                    <strong className="font-mono tabular-nums">
                      {formatNumber(grandTotals.allTeamsInHand)} {item.unit}
                    </strong>
                  </div>
                </div>
              </div>

              {/* STAGE 4: USAGE & WASTAGE (Field Consumption) */}
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-300 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-950 uppercase">
                  <span>4. Usage &amp; Wastage</span>
                  <Hammer className="w-3.5 h-3.5 text-amber-700" />
                </div>
                <div className="text-2xl font-black font-mono tabular-nums text-slate-900 mt-1">
                  {formatNumber(grandTotals.stage4TotalConsumed)}{' '}
                  <span className="text-xs font-semibold text-slate-600">{item.unit}</span>
                </div>
                <div className="mt-2 pt-1.5 border-t border-amber-200/80 space-y-0.5 text-[11px]">
                  <div className="flex justify-between text-teal-800 font-semibold">
                    <span>Field Usage (Installed):</span>
                    <strong className="font-mono tabular-nums">
                      {formatNumber(grandTotals.stage4Used)} {item.unit}
                    </strong>
                  </div>
                  <div className="flex justify-between text-rose-700 font-semibold">
                    <span>Field Wastage / Scrap:</span>
                    <strong className="font-mono tabular-nums">
                      {formatNumber(grandTotals.stage4Wastage)} {item.unit}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Usage Vouchers:</span>
                    <strong className="font-mono tabular-nums">{projectUsageLogs.length} log(s)</strong>
                  </div>
                </div>
              </div>

              {/* STAGE 5: BALANCE / RETURNABLE STOCK ON PROJECT COMPLETION */}
              <div className="bg-emerald-50/90 p-3.5 rounded-xl border-2 border-emerald-500/60 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-950 uppercase">
                  <span>5. Balance / Returnable</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <div className="text-2xl font-black font-mono tabular-nums text-emerald-800 mt-1">
                  {formatNumber(
                    grandTotals.effectiveSiteFocIssued > 0
                      ? grandTotals.stage5SiteFocReturnableBalance
                      : grandTotals.siteSpecificStock?.availableBalance || 0
                  )}{' '}
                  <span className="text-xs font-semibold text-emerald-700">{item.unit}</span>
                </div>
                <div className="mt-2 pt-1.5 border-t border-emerald-200 space-y-0.5 text-[11px] text-emerald-950">
                  {grandTotals.effectiveSiteFocIssued > 0 && (
                    <>
                      <div className="flex justify-between font-bold text-indigo-900 bg-indigo-100/80 px-1.5 py-0.5 rounded">
                        <span>Site FOC Returnable:</span>
                        <strong className="font-mono tabular-nums">
                          {formatNumber(grandTotals.stage5SiteFocReturnableBalance)} {item.unit}
                        </strong>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-900 px-1">
                        <span>Total Client Returnable (Site+HQ):</span>
                        <strong className="font-mono tabular-nums">
                          {formatNumber(grandTotals.stage5TotalProjectReturnableToClient)} {item.unit}
                        </strong>
                      </div>
                    </>
                  )}
                  {!focProjectId && grandTotals.effectiveSiteNormalIssued > 0 && (
                    <div className="flex justify-between text-slate-700 px-1">
                      <span>Normal HQ Site Balance:</span>
                      <strong className="font-mono tabular-nums">
                        {formatNumber(grandTotals.siteNormalRemainingBalance)} {item.unit}
                      </strong>
                    </div>
                  )}
                  {!focProjectId &&
                    grandTotals.effectiveSiteFocIssued > 0 &&
                    grandTotals.effectiveSiteNormalIssued > 0 && (
                      <div className="flex justify-between text-emerald-950 font-extrabold px-1 pt-0.5 border-t border-emerald-200/70">
                        <span>Total Physical Site Yard:</span>
                        <strong className="font-mono tabular-nums">
                          {formatNumber(grandTotals.siteSpecificStock?.availableBalance || 0)} {item.unit}
                        </strong>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* CENTRAL MODE WITHOUT FOC (PURE COMPANY INVENTORY) */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                <span>1. Total Inbound</span>
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xl font-black font-mono text-slate-900 mt-1">
                {formatNumber(grandTotals.totalReceivedAtHq)}{' '}
                <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
              </div>
              <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>PO GRN:</span>
                  <strong className="font-mono text-slate-800">{formatNumber(inboundBreakdownTotals.poReceivedQty)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Manual Entry:</span>
                  <strong className="font-mono text-slate-800">{formatNumber(inboundBreakdownTotals.manualReceivedQty)}</strong>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-xl border-2 border-emerald-500/40 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-900 uppercase">
                <span>2. Central In-Hand</span>
                <Boxes className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <div className="text-xl font-black font-mono text-emerald-800 mt-1">
                {formatNumber(grandTotals.centralInHand)}{' '}
                <span className="text-xs font-semibold text-emerald-700">{item.unit}</span>
              </div>
              <div className="mt-1.5 space-y-0.5 text-[11px] text-emerald-900">
                <div className="flex justify-between">
                  <span>Dispatched Sites:</span>
                  <strong className="font-mono">-{formatNumber(grandTotals.dispatchedFromHq)}</strong>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-300 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-blue-900 uppercase">
                <span>3. Sites In-Hand</span>
                <Building2 className="w-3.5 h-3.5 text-blue-700" />
              </div>
              <div className="text-xl font-black font-mono text-blue-800 mt-1">
                {formatNumber(grandTotals.allSitesInHand)}{' '}
                <span className="text-xs font-semibold text-blue-700">{item.unit}</span>
              </div>
              <div className="mt-1.5 space-y-0.5 text-[11px] text-blue-900">
                <div className="flex justify-between">
                  <span>Active Sites:</span>
                  <strong className="font-mono">{siteBranchBreakdown.length}</strong>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-300 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-indigo-900 uppercase">
                <span>4. Teams In-Hand</span>
                <Users className="w-3.5 h-3.5 text-indigo-700" />
              </div>
              <div className="text-xl font-black font-mono text-indigo-800 mt-1">
                {formatNumber(grandTotals.allTeamsInHand)}{' '}
                <span className="text-xs font-semibold text-indigo-700">{item.unit}</span>
              </div>
              <div className="mt-1.5 space-y-0.5 text-[11px] text-indigo-900">
                <div className="flex justify-between">
                  <span>Total Issued:</span>
                  <strong className="font-mono">{formatNumber(grandTotals.totalIssuedToTeams)}</strong>
                </div>
              </div>
            </div>

            <div className="bg-teal-50/60 p-3.5 rounded-xl border border-teal-300 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-teal-900 uppercase">
                <span>5. Installed / Used</span>
                <Hammer className="w-3.5 h-3.5 text-teal-700" />
              </div>
              <div className="text-xl font-black font-mono text-teal-800 mt-1">
                {formatNumber(grandTotals.totalUsedOnProjects)}{' '}
                <span className="text-xs font-semibold text-teal-700">{item.unit}</span>
              </div>
              <div className="mt-1.5 space-y-0.5 text-[11px] text-teal-900">
                <div className="flex justify-between">
                  <span>Usage Vouchers:</span>
                  <strong className="font-mono">{projectUsageLogs.length}</strong>
                </div>
              </div>
            </div>

            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-300 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-rose-900 uppercase">
                <span>6. Waste / Damaged</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className="text-xl font-black font-mono text-rose-700 mt-1">
                {formatNumber(grandTotals.totalWasteAndDamage)}{' '}
                <span className="text-xs font-semibold text-rose-600">{item.unit}</span>
              </div>
              <div className="mt-1.5 space-y-0.5 text-[11px] text-rose-900">
                <div className="flex justify-between">
                  <span>Project Waste:</span>
                  <strong className="font-mono">{formatNumber(grandTotals.totalWastedOnProjects)}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Filter Tabs for Detailed Tables (Ordered by the 5-Stage Reconciliation Flow) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveSubView('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubView === 'overview'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All 5 Stages View
            </button>
            {grandTotals.hasFocFlow && (
              <button
                type="button"
                onClick={() => setActiveSubView('central-foc')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSubView === 'central-foc'
                    ? 'bg-indigo-700 text-white shadow-2xs'
                    : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                1. FOC Central Stock Receipt ({initialCentralFocReceipts.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveSubView('inbound')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubView === 'inbound'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {mode === 'central' && !focProjectId
                ? `Inbound PO / Manual / FOC (${centralInboundRecords.length})`
                : `2. Site Issue (${displayedSiteTransfers.length})`}
            </button>
            {mode === 'central' && !focProjectId && (
              <button
                type="button"
                onClick={() => setActiveSubView('sites')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSubView === 'sites'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Site Branches Distribution ({siteBranchBreakdown.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveSubView('teams')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubView === 'teams'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              3. Team Issue ({teamBreakdown.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('projects')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubView === 'projects'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              4. Usage &amp; Wastage ({projectUsageLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('reconciliation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubView === 'reconciliation'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              5. Balance / Returnable Stock
            </button>
          </div>

          <span className="text-[11px] font-semibold text-slate-500">
            Click &ldquo;Print A4 Item Report&rdquo; above to print or download this item&apos;s reconciliation sheet.
          </span>
        </div>

        {/* STAGE 1 TABLE: INITIAL FOC RECEIPT AT CENTRAL STOCK */}
        {grandTotals.hasFocFlow &&
          (activeSubView === 'overview' || activeSubView === 'central-foc') && (
            <div className="bg-white rounded-xl border-2 border-indigo-300 shadow-2xs overflow-hidden">
              <div className="px-4 py-2.5 bg-indigo-950 text-white flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-indigo-300" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider">
                    1. FOC Central Stock Receipt (Initial Client FOC Received at Central Warehouse)
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500 text-white uppercase">
                    Central FOC
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <span className="text-indigo-200">
                    Initial Central FOC:{' '}
                    <strong className="text-white">
                      {formatNumber(grandTotals.stage1InitialCentralFoc)} {item.unit}
                    </strong>
                  </span>
                  <span className="text-emerald-300">
                    Central FOC Pool Remaining:{' '}
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
                              {foc.storageLocation} • By {foc.receivedBy}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-900 text-sm">
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

        {/* STAGE 2 TABLE: SITE ISSUE (TRANSFERS FROM CENTRAL TO SITE) OR CENTRAL INBOUND */}
        {(activeSubView === 'overview' || activeSubView === 'inbound') && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  {mode === 'central' && !focProjectId
                    ? 'Inbound Stock Sources at Central Warehouse (POs, Manual GRN, Client FOC & Site Returns)'
                    : `2. Site Issue — Transfers Issued from Central Stock to ${targetSite?.name || 'Site Branch'}`}
                </h4>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-bold">
                {mode === 'central' && !focProjectId ? (
                  <span className="text-emerald-800">
                    Total Central Inbound: {formatNumber(grandTotals.totalReceivedAtHq)} {item.unit}
                  </span>
                ) : (
                  <>
                    {grandTotals.effectiveSiteFocIssued > 0 && (
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-300">
                        Central FOC Issued to Site: +{formatNumber(grandTotals.effectiveSiteFocIssued)} {item.unit}
                      </span>
                    )}
                    {!focProjectId && grandTotals.effectiveSiteNormalIssued > 0 && (
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        Normal HQ Issued to Site: +{formatNumber(grandTotals.effectiveSiteNormalIssued)} {item.unit}
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
                          className={
                            rec.isCentralFoc
                              ? 'bg-indigo-50/45 hover:bg-indigo-50/80 border-l-4 border-l-indigo-600'
                              : 'hover:bg-slate-50/70'
                          }
                        >
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{rec.refNo}</td>
                          <td className="py-2 px-3">
                            {rec.isCentralFoc ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-600 text-white shadow-2xs">
                                <Gift className="w-3 h-3" />
                                Central FOC
                              </span>
                            ) : (
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${rec.badgeColor}`}>
                                {rec.sourceType}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{rec.partyName}</td>
                          <td className="py-2 px-3 text-slate-600">{formatDateTime(rec.date)}</td>
                          <td className="py-2 px-3 text-slate-600">{rec.receivedBy}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
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
                No stock transfer requisitions issued from Central Stock to this site for this item yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Requisition #</th>
                      <th className="py-2.5 px-3">Stock Origin Tag</th>
                      <th className="py-2.5 px-3">Transfer Category &amp; Project</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Accepted / Approved By</th>
                      <th className="py-2.5 px-3 text-right">Site Issue Qty ({item.unit})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedSiteTransfers.map((tr) => (
                      <tr
                        key={tr.id}
                        className={
                          tr.isCentralFoc
                            ? 'bg-indigo-50/50 hover:bg-indigo-100/60 border-l-4 border-l-indigo-600'
                            : 'hover:bg-slate-50/70'
                        }
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {tr.voucherNo}
                        </td>
                        <td className="py-2.5 px-3">
                          {tr.isCentralFoc ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-600 text-white shadow-2xs">
                              <Gift className="w-3 h-3" />
                              Central FOC
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                              Normal HQ Stock
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {tr.category}
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
                          className={`py-2.5 px-3 text-right font-mono font-black text-sm ${
                            tr.isCentralFoc ? 'text-indigo-800' : 'text-emerald-700'
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

        {/* SITE BRANCHES DISTRIBUTION (CENTRAL MODE) */}
        {mode === 'central' && !focProjectId && (activeSubView === 'overview' || activeSubView === 'sites') && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-blue-50/80 border-b border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-700" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-950">
                  2. Site Issue — Distribution Across Site Branches &amp; Site Store In-Hand
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-blue-900">
                Total Sites In-Hand: {formatNumber(grandTotals.allSitesInHand)} {item.unit}
              </span>
            </div>

            {siteBranchBreakdown.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                This item has not been transferred to any site branches yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Site Branch Name</th>
                      <th className="py-2.5 px-3 text-right">2. Site Issue (HQ → Site)</th>
                      <th className="py-2.5 px-3 text-right">3. Team Issue</th>
                      <th className="py-2.5 px-3 text-right">Team Ret (Good)</th>
                      <th className="py-2.5 px-3 text-right">4. Usage &amp; Wastage</th>
                      <th className="py-2.5 px-3 text-right bg-blue-50/60 text-blue-900">5. Site Yard Balance</th>
                      <th className="py-2.5 px-3 text-right bg-indigo-50/60 text-indigo-900">Teams In-Hand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siteBranchBreakdown.map((row) => (
                      <tr
                        key={row.site.id}
                        className={
                          row.focReceived > 0
                            ? 'bg-indigo-50/35 hover:bg-indigo-50/70 border-l-4 border-l-indigo-600'
                            : 'hover:bg-slate-50/70'
                        }
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{row.site.name}</span>
                            {row.focReceived > 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-600 text-white">
                                Central FOC
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            Supervisor: {row.site.supervisorName}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                          <div>{formatNumber(row.receivedFromHq)}</div>
                          {row.focReceived > 0 && (
                            <div className="text-[10px] text-indigo-700 font-extrabold">
                              Central FOC: {formatNumber(row.focReceived)}
                            </div>
                          )}
                          {row.normalReceived > 0 && row.focReceived > 0 && (
                            <div className="text-[10px] text-slate-500">
                              Normal HQ: {formatNumber(row.normalReceived)}
                            </div>
                          )}
                          {row.inTransitQty > 0 && (
                            <div className="text-[10px] text-amber-700">+{formatNumber(row.inTransitQty)} Transit</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {formatNumber(row.issuedToTeams)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                          +{formatNumber(row.returnedFromTeams)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className="text-teal-700 font-bold">{formatNumber(row.siteUsedQty)}</span>
                          {row.siteWastedQty > 0 && (
                            <span className="text-rose-600 font-bold ml-1">
                              (+{formatNumber(row.siteWastedQty)} waste)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-blue-800 bg-blue-50/30">
                          {formatNumber(row.siteInHand)} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-800 bg-indigo-50/30">
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

        {/* STAGE 3 TABLE: FIELD TEAMS ISSUE, USAGE, WASTAGE & TEAM IN-HAND */}
        {(activeSubView === 'overview' || activeSubView === 'teams') && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-blue-50/80 border-b border-blue-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-700" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-950">
                  3. Team Issue — Field Teams Allocation, Returns &amp; Team In-Hand Balance
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-blue-900">
                Total Issued to Teams: {formatNumber(grandTotals.stage3TeamIssued)} {item.unit} | Teams In-Hand:{' '}
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
                      <th className="py-2.5 px-3">Assigned Site</th>
                      <th className="py-2.5 px-3 text-right">3. Team Issue (From Site)</th>
                      <th className="py-2.5 px-3 text-right">Returned to Site (Good / Dmg)</th>
                      <th className="py-2.5 px-3 text-right">4a. Used on Projects</th>
                      <th className="py-2.5 px-3 text-right">4b. Project Wastage</th>
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
                        <td className="py-2.5 px-3 font-medium text-slate-700">{tb.siteName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-800">
                          {formatNumber(tb.issuedQty)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          <span className="text-emerald-700 font-semibold">+{formatNumber(tb.returnedGoodQty)} Good</span>
                          {tb.returnedDamagedQty > 0 && (
                            <span className="text-rose-600 font-semibold ml-1.5">
                              / {formatNumber(tb.returnedDamagedQty)} Dmg
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-700">
                          {formatNumber(tb.usedQty)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                          {formatNumber(tb.wastedQty)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-800 bg-indigo-50/40">
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

        {/* STAGE 4 TABLE: SUB-PROJECT-WISE USAGE FLOW & WASTAGE VOUCHERS */}
        {(activeSubView === 'overview' || activeSubView === 'projects') && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-teal-50/80 border-b border-teal-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Hammer className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-950">
                  4. Usage &amp; Wastage — Sub-Project-wise Usage Flow &amp; Field Scrap Logs
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-teal-900">
                Usage (Installed): {formatNumber(grandTotals.stage4Used)} {item.unit} | Wastage:{' '}
                {formatNumber(grandTotals.stage4Wastage)} {item.unit} | Total:{' '}
                {formatNumber(grandTotals.stage4TotalConsumed)} {item.unit}
              </span>
            </div>

            {/* Clean Project & Sub-Project Distribution Summary Table */}
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
                            <td className="py-2 px-3 text-center font-mono text-slate-600">
                              {spf.spLogs.length}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-teal-700">
                              {formatNumber(spf.spUsed)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                              {formatNumber(spf.spWastage)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                              {formatNumber(spf.spTotalConsumed)} {item.unit}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-600">
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
                      <th className="py-2.5 px-3">Site &amp; Executing Team</th>
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
                            <span className="font-semibold">{log.siteName}</span> • {log.teamName}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-teal-700">
                            {formatNumber(log.usedQty)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                            {formatNumber(log.wastedQty)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
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

        {/* STAGE 5 TABLE: BALANCE / RETURNABLE STOCK ON PROJECT COMPLETION */}
        {(activeSubView === 'overview' || activeSubView === 'reconciliation') && (
          <div className="bg-emerald-50/50 rounded-xl border-2 border-emerald-500/50 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-emerald-900 text-white flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider">
                  5. Balance / Returnable Stock on Project Completion (Standard Reconciliation Statement)
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-200">
                {grandTotals.hasFocFlow
                  ? `Site FOC Returnable: ${formatNumber(grandTotals.stage5SiteFocReturnableBalance)} ${item.unit} | Total Client Returnable: ${formatNumber(grandTotals.stage5TotalProjectReturnableToClient)} ${item.unit}`
                  : `Available Balance: ${formatNumber(grandTotals.siteSpecificStock?.availableBalance ?? grandTotals.centralInHand)} ${item.unit}`}
              </span>
            </div>

            <div className="overflow-x-auto bg-white">
              {grandTotals.hasFocFlow ? (
                <table className="w-full text-xs text-left">
                  <thead className="bg-emerald-50/70 text-emerald-950 uppercase border-b border-emerald-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">1. FOC Central Receipt</th>
                      <th className="py-2.5 px-3">2. Site Issue (Central → Site)</th>
                      <th className="py-2.5 px-3">3. Team Issue (Site → Teams)</th>
                      <th className="py-2.5 px-3">4. Usage &amp; Wastage</th>
                      <th className="py-2.5 px-3 text-right bg-indigo-50 text-indigo-950">
                        5a. Site FOC Balance / Returnable
                      </th>
                      <th className="py-2.5 px-3 text-right bg-emerald-100/80 text-emerald-950">
                        5b. Total Client Returnable (Site + Central)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="divide-x divide-slate-200">
                      <td className="py-3 px-3 font-mono">
                        <div className="text-sm font-black text-indigo-900">
                          {formatNumber(grandTotals.stage1InitialCentralFoc)} {item.unit}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Central FOC Pool Rem:{' '}
                          <strong className="text-emerald-700">
                            {formatNumber(grandTotals.centralFocPoolRemaining)} {item.unit}
                          </strong>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="text-sm font-black text-indigo-700">
                          {formatNumber(grandTotals.effectiveSiteFocIssued)} {item.unit}{' '}
                          <span className="text-[10px] font-sans font-extrabold px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                            Central FOC
                          </span>
                        </div>
                        {!focProjectId && grandTotals.effectiveSiteNormalIssued > 0 && (
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            + Normal HQ: <strong>{formatNumber(grandTotals.effectiveSiteNormalIssued)} {item.unit}</strong>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="text-sm font-black text-blue-800">
                          {formatNumber(grandTotals.stage3TeamIssued)} {item.unit}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Returned Good: <strong className="text-emerald-700">+{formatNumber(grandTotals.stage3TeamReturnedGood)}</strong> • Team In-Hand:{' '}
                          <strong>{formatNumber(grandTotals.allTeamsInHand)}</strong>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="text-sm font-black text-slate-900">
                          {formatNumber(grandTotals.stage4TotalConsumed)} {item.unit}
                        </div>
                        <div className="text-[11px] mt-0.5">
                          <span className="text-teal-700 font-bold">
                            Used: {formatNumber(grandTotals.stage4Used)}
                          </span>{' '}
                          •{' '}
                          <span className="text-rose-600 font-bold">
                            Wastage: {formatNumber(grandTotals.stage4Wastage)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono bg-indigo-50/50">
                        <div className="text-base font-black text-indigo-900">
                          {formatNumber(grandTotals.stage5SiteFocReturnableBalance)} {item.unit}
                        </div>
                        <div className="text-[10px] font-sans text-indigo-700 font-semibold">
                          Site Issue ({formatNumber(grandTotals.effectiveSiteFocIssued)}) − Consumed ({formatNumber(Math.min(grandTotals.effectiveSiteFocIssued, grandTotals.stage4TotalConsumed))})
                        </div>
                        {!focProjectId && grandTotals.effectiveSiteNormalIssued > 0 && (
                          <div className="text-[10px] font-sans text-slate-600 mt-0.5">
                            + Normal HQ Site Bal: <strong>{formatNumber(grandTotals.siteNormalRemainingBalance)} {item.unit}</strong>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono bg-emerald-50/70">
                        <div className="text-base font-black text-emerald-800">
                          {formatNumber(grandTotals.stage5TotalProjectReturnableToClient)} {item.unit}
                        </div>
                        <div className="text-[10px] font-sans text-emerald-700 font-semibold">
                          Central Pool ({formatNumber(grandTotals.centralFocPoolRemaining)}) + Site Bal ({formatNumber(grandTotals.stage5SiteFocReturnableBalance)})
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-emerald-50/70 text-emerald-950 uppercase border-b border-emerald-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">1. Central HQ Stock</th>
                      <th className="py-2.5 px-3">2. Site Issue (Central → Site)</th>
                      <th className="py-2.5 px-3">3. Team Issue (Site → Teams)</th>
                      <th className="py-2.5 px-3">4. Usage &amp; Wastage</th>
                      <th className="py-2.5 px-3 text-right bg-emerald-100/80 text-emerald-950">
                        5. Available Site Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="divide-x divide-slate-200">
                      <td className="py-3 px-3 font-mono">
                        <div className="text-sm font-black text-slate-900">
                          {formatNumber(mainStock.companyReceived)} {item.unit}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          HQ In-Hand:{' '}
                          <strong className="text-emerald-700">
                            {formatNumber(grandTotals.centralNormalInHand)} {item.unit}
                          </strong>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="text-sm font-black text-slate-900">
                          {formatNumber(grandTotals.effectiveSiteNormalIssued)} {item.unit}{' '}
                          <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            Normal HQ
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="text-sm font-black text-blue-800">
                          {formatNumber(grandTotals.stage3TeamIssued)} {item.unit}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Returned Good: <strong className="text-emerald-700">+{formatNumber(grandTotals.stage3TeamReturnedGood)}</strong> • Team In-Hand:{' '}
                          <strong>{formatNumber(grandTotals.allTeamsInHand)}</strong>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="text-sm font-black text-slate-900">
                          {formatNumber(grandTotals.stage4TotalConsumed)} {item.unit}
                        </div>
                        <div className="text-[11px] mt-0.5">
                          <span className="text-teal-700 font-bold">
                            Used: {formatNumber(grandTotals.stage4Used)}
                          </span>{' '}
                          •{' '}
                          <span className="text-rose-600 font-bold">
                            Wastage: {formatNumber(grandTotals.stage4Wastage)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono bg-emerald-50/70">
                        <div className="text-base font-black text-emerald-800">
                          {formatNumber(grandTotals.siteSpecificStock?.availableBalance ?? 0)} {item.unit}
                        </div>
                        <div className="text-[10px] font-sans text-emerald-700 font-semibold">
                          Physical Site Yard Stock Remaining
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* HIDDEN / ISOLATED A4 PRINTABLE DOCUMENT FOR printHtmlElement & downloadElementAsPdf */}
      <div id={printElementId} className="hidden print:block bg-white text-slate-900 p-6">
        <div className="border-2 border-slate-900 p-5 space-y-5">
          {/* ISO Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
                ISO 9001:2015 STANDARD 5-STAGE MATERIAL RECONCILIATION &amp; CUSTODY REPORT
              </div>
              <h1 className="text-xl font-black text-slate-900 uppercase mt-0.5">
                {companyDisplayName}
              </h1>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                {focProjectId
                  ? `INDIVIDUAL ISSUED ITEM FOC RECONCILIATION REPORT — PROJECT: [${targetFocProject?.projectId || 'FOC'}] ${targetFocProject?.projectName || ''}`
                  : mode === 'central'
                  ? 'CENTRAL WAREHOUSE END-TO-END ITEM RECONCILIATION SUMMARY'
                  : `SITE BRANCH ITEM RECONCILIATION REPORT — ${targetSite?.name?.toUpperCase() || 'SITE YARD'}`}
              </p>
            </div>
            <div className="text-right text-xs space-y-0.5 font-mono">
              <div>
                <strong>Doc Ref:</strong> {grandTotals.hasFocFlow ? 'FOC-REC' : 'STD-REC'}-{item.itemCode}-{new Date().getFullYear()}
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

          {/* 5-Stage Standard Reconciliation KPI Grid */}
          <div className="grid grid-cols-5 gap-2 text-center border-2 border-slate-800 p-2.5 bg-white">
            {grandTotals.hasFocFlow ? (
              <div className="border-r border-slate-300 pr-2">
                <div className="text-[11px] font-extrabold uppercase text-indigo-900">
                  1. FOC Central Receipt
                </div>
                <div className="text-sm font-black font-mono text-indigo-900 mt-0.5">
                  {formatNumber(grandTotals.stage1InitialCentralFoc)} {item.unit}
                </div>
                <div className="text-[10.5px] text-slate-600">
                  Central Pool Rem: {formatNumber(grandTotals.centralFocPoolRemaining)} {item.unit}
                </div>
              </div>
            ) : (
              <div className="border-r border-slate-300 pr-2">
                <div className="text-[11px] font-extrabold uppercase text-slate-800">
                  1. Central HQ Pool
                </div>
                <div className="text-sm font-black font-mono text-slate-900 mt-0.5">
                  {formatNumber(mainStock.companyReceived)} {item.unit}
                </div>
                <div className="text-[10.5px] text-slate-600">
                  HQ In-Hand: {formatNumber(grandTotals.centralNormalInHand)} {item.unit}
                </div>
              </div>
            )}
            <div className="border-r border-slate-300 pr-2">
              <div className="text-[11px] font-extrabold uppercase text-slate-800">
                2. Site Issue (HQ → Site)
              </div>
              {grandTotals.hasFocFlow ? (
                <>
                  <div className="text-sm font-black font-mono text-indigo-800 mt-0.5">
                    {formatNumber(grandTotals.effectiveSiteFocIssued)} {item.unit} (FOC)
                  </div>
                  {!focProjectId && grandTotals.effectiveSiteNormalIssued > 0 && (
                    <div className="text-[10.5px] text-slate-600">
                      + Normal HQ: {formatNumber(grandTotals.effectiveSiteNormalIssued)} {item.unit}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-sm font-black font-mono text-slate-900 mt-0.5">
                    {formatNumber(grandTotals.effectiveSiteNormalIssued)} {item.unit}
                  </div>
                  <div className="text-[10.5px] text-slate-600">Normal HQ Issue</div>
                </>
              )}
            </div>
            <div className="border-r border-slate-300 pr-2">
              <div className="text-[11px] font-extrabold uppercase text-blue-900">
                3. Team Issue (Site → Team)
              </div>
              <div className="text-sm font-black font-mono text-blue-800 mt-0.5">
                {formatNumber(grandTotals.stage3TeamIssued)} {item.unit}
              </div>
              <div className="text-[10.5px] text-slate-600">
                Ret Good: +{formatNumber(grandTotals.stage3TeamReturnedGood)} | In-Hand: {formatNumber(grandTotals.allTeamsInHand)}
              </div>
            </div>
            <div className="border-r border-slate-300 pr-2">
              <div className="text-[11px] font-extrabold uppercase text-teal-900">
                4. Usage &amp; Wastage
              </div>
              <div className="text-sm font-black font-mono text-slate-900 mt-0.5">
                {formatNumber(grandTotals.stage4TotalConsumed)} {item.unit}
              </div>
              <div className="text-[10.5px] text-slate-600">
                Used: {formatNumber(grandTotals.stage4Used)} | Waste: {formatNumber(grandTotals.stage4Wastage)}
              </div>
            </div>
            {grandTotals.hasFocFlow ? (
              <div>
                <div className="text-[11px] font-extrabold uppercase text-emerald-900">
                  5. Balance / Returnable
                </div>
                <div className="text-sm font-black font-mono text-emerald-800 mt-0.5">
                  Site FOC: {formatNumber(grandTotals.stage5SiteFocReturnableBalance)} {item.unit}
                </div>
                <div className="text-[10.5px] font-bold text-emerald-900">
                  Total Client Returnable: {formatNumber(grandTotals.stage5TotalProjectReturnableToClient)} {item.unit}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-[11px] font-extrabold uppercase text-emerald-900">
                  5. Available Site Balance
                </div>
                <div className="text-sm font-black font-mono text-emerald-800 mt-0.5">
                  {formatNumber(grandTotals.siteSpecificStock?.availableBalance ?? grandTotals.centralInHand)} {item.unit}
                </div>
                <div className="text-[10.5px] font-bold text-emerald-900">
                  Physical Site Yard Stock
                </div>
              </div>
            )}
          </div>

          {/* Print Table 1: Initial FOC Receipt at Central Stock */}
          {grandTotals.hasFocFlow && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider bg-indigo-50 px-2.5 py-1.5 border border-slate-300">
                1. FOC Central Stock Receipt (Initial Client FOC Vouchers Received at Central Warehouse)
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

          {/* Print Table 2: Site Issue */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider bg-slate-100 px-2.5 py-1.5 border border-slate-300">
              2. Site Issue — Transfers Issued from Central Stock to {targetSite?.name || 'Site Branch(es)'}
            </h3>
            <table className="w-full text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-300 p-2 text-left">Requisition #</th>
                  <th className="border border-slate-300 p-2 text-left">Stock Tag</th>
                  <th className="border border-slate-300 p-2 text-left">Category &amp; Site</th>
                  <th className="border border-slate-300 p-2 text-left">Date</th>
                  <th className="border border-slate-300 p-2 text-left">Status</th>
                  <th className="border border-slate-300 p-2 text-right">Qty ({item.unit})</th>
                </tr>
              </thead>
              <tbody>
                {displayedSiteTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-slate-300 p-2 text-center text-slate-500">
                      No site issue transfer records.
                    </td>
                  </tr>
                ) : (
                  displayedSiteTransfers.map((tr) => (
                    <tr key={tr.id}>
                      <td className="border border-slate-300 p-2 font-mono font-bold">{tr.voucherNo}</td>
                      <td className="border border-slate-300 p-2 font-bold">
                        {tr.isCentralFoc ? '[CENTRAL FOC]' : 'Normal HQ'}
                      </td>
                      <td className="border border-slate-300 p-2">
                        {tr.category} ({tr.siteName})
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

          {/* Print Table 3: Field Teams Issue */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider bg-slate-100 px-2.5 py-1.5 border border-slate-300">
              3. Team Issue — Field Teams Allocation, Returns &amp; Team In-Hand
            </h3>
            <table className="w-full text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-300 p-2 text-left">Field Team</th>
                  <th className="border border-slate-300 p-2 text-left">Site Branch</th>
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
                      <td className="border border-slate-300 p-2">{tb.siteName}</td>
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

          {/* Print Table 4: Sub-Project Flows + Project Usage & Wastage */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider bg-slate-100 px-2.5 py-1.5 border border-slate-300">
              4. Usage &amp; Wastage — Sub-Project-wise Usage Flow &amp; Field Scrap Records
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
                        <td className="border border-slate-300 p-2 text-center font-mono">
                          {spf.spLogs.length}
                        </td>
                        <td className="border border-slate-300 p-2 text-right font-mono">
                          {formatNumber(spf.spUsed)}
                        </td>
                        <td className="border border-slate-300 p-2 text-right font-mono">
                          {formatNumber(spf.spWastage)}
                        </td>
                        <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                          {formatNumber(spf.spTotalConsumed)} {item.unit}
                        </td>
                        <td className="border border-slate-300 p-2 text-right font-mono">
                          {sharePct}%
                        </td>
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
                  <th className="border border-slate-300 p-2 text-left">Site &amp; Team</th>
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
                        {log.siteName} — {log.teamName}
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

          {/* Print Table 5: Balance / Returnable Stock on Project Completion */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider bg-emerald-50 px-2.5 py-1.5 border border-slate-300">
              {grandTotals.hasFocFlow
                ? '5. Balance / Returnable Stock on Project Completion'
                : '5. Site Material Balance & Reconciliation Statement'}
            </h3>
            {grandTotals.hasFocFlow ? (
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 p-2 text-right">1. Central FOC Receipt</th>
                    <th className="border border-slate-300 p-2 text-right">2. Site Issue (FOC)</th>
                    <th className="border border-slate-300 p-2 text-right">Central Pool Rem.</th>
                    <th className="border border-slate-300 p-2 text-right">3. Team Issue</th>
                    <th className="border border-slate-300 p-2 text-right">4. Usage + Wastage</th>
                    <th className="border border-slate-300 p-2 text-right">5a. Site FOC Returnable</th>
                    <th className="border border-slate-300 p-2 text-right">5b. Total Client Returnable</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                      {formatNumber(grandTotals.stage1InitialCentralFoc)} {item.unit}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                      {formatNumber(grandTotals.effectiveSiteFocIssued)} {item.unit}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {formatNumber(grandTotals.centralFocPoolRemaining)} {item.unit}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {formatNumber(grandTotals.stage3TeamIssued)} {item.unit}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {formatNumber(grandTotals.stage4TotalConsumed)} {item.unit} ({formatNumber(grandTotals.stage4Used)} + {formatNumber(grandTotals.stage4Wastage)})
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                      {formatNumber(grandTotals.stage5SiteFocReturnableBalance)} {item.unit}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-black">
                      {formatNumber(grandTotals.stage5TotalProjectReturnableToClient)} {item.unit}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 p-2 text-right">1. Central HQ Stock</th>
                    <th className="border border-slate-300 p-2 text-right">2. Site Issue (Normal HQ)</th>
                    <th className="border border-slate-300 p-2 text-right">3. Team Issue</th>
                    <th className="border border-slate-300 p-2 text-right">4. Usage + Wastage</th>
                    <th className="border border-slate-300 p-2 text-right">5. Available Site Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                      {formatNumber(mainStock.companyReceived)} {item.unit}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                      {formatNumber(grandTotals.effectiveSiteNormalIssued)} {item.unit}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {formatNumber(grandTotals.stage3TeamIssued)} {item.unit}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {formatNumber(grandTotals.stage4TotalConsumed)} {item.unit} ({formatNumber(grandTotals.stage4Used)} + {formatNumber(grandTotals.stage4Wastage)})
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-black">
                      {formatNumber(grandTotals.siteSpecificStock?.availableBalance ?? grandTotals.centralInHand)} {item.unit}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* ISO Sign-off Footer */}
          <div className="grid grid-cols-3 gap-6 pt-8 text-xs">
            <div className="border-t border-slate-400 pt-1.5 text-center font-semibold">
              Prepared By (Store / Inventory Officer)
            </div>
            <div className="border-t border-slate-400 pt-1.5 text-center font-semibold">
              Verified By (Site / Operations Engineer)
            </div>
            <div className="border-t border-slate-400 pt-1.5 text-center font-semibold">
              Client / Management Reconciliation Sign-Off
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
