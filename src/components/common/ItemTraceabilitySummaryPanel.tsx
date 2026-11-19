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
  FileCheck,
  RotateCcw,
  Gift,
  CheckCircle2,
  Layers,
  TrendingUp,
  Truck,
  ClipboardList,
  ShieldAlert,
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
  const [printWithImage, setPrintWithImage] = useState<boolean>(() => Boolean(item.imageUrl));
  const [activeSubView, setActiveSubView] = useState<'overview' | 'inbound' | 'sites' | 'teams' | 'projects'>('overview');

  const printElementId = `item-trace-print-${mode}-${item.id}-${siteId || 'hq'}-${focProjectId || 'all'}`;

  const targetSite = useMemo(
    () => (siteId ? sites.find((s) => s.id === siteId) || null : null),
    [sites, siteId]
  );

  const targetFocProject = useMemo(
    () => (focProjectId ? projects.find((p) => p.id === focProjectId) || null : null),
    [projects, focProjectId]
  );

  // 1. CENTRAL WAREHOUSE STOCK METRICS
  const mainStock = useMemo(() => getMainWarehouseStock(item.id), [getMainWarehouseStock, item.id]);

  // 2. INBOUND SOURCES TO CENTRAL STOCK (POs, Manual Entries, Client FOC, Branch Returns)
  const centralInboundRecords = useMemo(() => {
    const records: Array<{
      id: string;
      refNo: string;
      sourceType: 'PO Receipt' | 'Manual / Spot Entry' | 'Client FOC' | 'Site Good Return' | 'Pending PO Ordered';
      partyName: string;
      date: string;
      qty: number;
      receivedBy: string;
      notes: string;
      badgeColor: string;
    }> = [];

    // MainStockEntries (Purchase / Manual Entry)
    mainStockEntries
      .filter((e) => e.itemId === item.id)
      .forEach((e) => {
        const isPo = e.entryType === 'Purchase' || (e.referenceNo || '').toUpperCase().startsWith('PO-');
        records.push({
          id: `mse-${e.id}`,
          refNo: e.referenceNo || 'GRN-MANUAL',
          sourceType: isPo ? 'PO Receipt' : 'Manual / Spot Entry',
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

    // Client Free-Issue (FOC) received into Central or Direct
    clientFreeIssues
      .filter((f) => !f.isDeleted)
      .forEach((f) => {
        const row = (f.items || []).find((i) => i.itemId === item.id);
        if (row && Number(row.quantity) > 0) {
          records.push({
            id: `foc-${f.id}`,
            refNo: f.voucherNumber,
            sourceType: 'Client FOC',
            partyName: `${f.clientName} (${f.projectName})`,
            date: f.receivedDate || f.createdAt,
            qty: Number(row.quantity),
            receivedBy: f.receivedBy || 'Central Store',
            notes: f.storageLocation ? `Location: ${f.storageLocation}` : f.notes || '',
            badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          });
        }
      });

    // Branch Returns (Good / Restock back to Central)
    branchReturns
      .filter((br) => !br.isDeleted && br.itemId === item.id)
      .forEach((br) => {
        records.push({
          id: `br-${br.id}`,
          refNo: br.branchReturnNumber,
          sourceType: 'Site Good Return',
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

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [mainStockEntries, clientFreeIssues, branchReturns, item.id]);

  // Summary of PO vs Manual vs FOC quantities
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

    clientFreeIssues
      .filter((f) => !f.isDeleted)
      .forEach((f) => {
        const row = (f.items || []).find((i) => i.itemId === item.id);
        if (row) focReceivedQty += Number(row.quantity || 0);
      });

    branchReturns
      .filter((br) => !br.isDeleted && br.itemId === item.id)
      .forEach((br) => {
        if (br.condition === 'Good / Restock') siteGoodReturnedQty += Number(br.quantity || 0);
        else siteDamagedReturnedQty += Number(br.quantity || 0);
      });

    // Also check active POs ordered quantity for context
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
  }, [mainStockEntries, clientFreeIssues, branchReturns, purchaseOrders, item.id]);

  // 3. SITE BRANCH DISTRIBUTION & SITE IN-HAND BREAKDOWN
  const siteBranchBreakdown = useMemo(() => {
    const branchSites = activeSites.filter((s) => !s.isMainWarehouse);

    return branchSites
      .map((site) => {
        const sStock = getSiteItemStock(site.id, item.id);

        // Calculate site returns to HQ for this site & item
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

        // Calculate in-transit (Approved / In-Transit) to this site
        const inTransitQty = stockRequests
          .filter((req) => req.siteId === site.id && req.status === 'Approved / In-Transit')
          .reduce((sum, req) => {
            const row = (req.items || []).find((r) => r.itemId === item.id);
            return sum + (row ? Number(row.approvedQty ?? row.requestedQty ?? 0) : 0);
          }, 0);

        // Teams at this site
        const siteTeamsInHand = allTeamsInHandStock
          .filter((ts) => ts.site?.id === site.id)
          .reduce((sum, ts) => {
            const found = ts.items.find((i) => i.itemId === item.id);
            return sum + (found ? Number(found.currentInHand || 0) : 0);
          }, 0);

        // Project Used & Wasted at this site
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

  // 4. SITE INBOUND TRANSFERS LIST (Specifically useful for Site Mode & Detailed View)
  const siteInboundTransfers = useMemo(() => {
    const list: Array<{
      id: string;
      voucherNo: string;
      date: string;
      siteName: string;
      category: string;
      status: string;
      qty: number;
      byUser: string;
    }> = [];

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
        const sName = sites.find((s) => s.id === req.siteId)?.name || 'Site Branch';
        list.push({
          id: req.id,
          voucherNo: req.requestNoteNumber,
          date: req.acceptanceDate || req.approvalDate || req.requestedDate,
          siteName: sName,
          category:
            req.requestCategory === 'foc'
              ? `Client FOC (${req.focProjectName || 'Project'})`
              : 'Normal HQ Transfer',
          status: req.status,
          qty,
          byUser: req.acceptedBy || req.approvedBy || req.requestedBy,
        });
      });

    // Also include direct site FOC allocations (by assignedSiteId or project's assigned site or focProjectId)
    clientFreeIssues
      .filter((f) => {
        if (f.isDeleted) return false;
        if (mode === 'central' && !siteId && !focProjectId) return Boolean(f.assignedSiteId);
        const fProj = projects.find((p) => p.id === f.projectId || p.id === f.parentProjectId);
        const effectiveSiteId = f.assignedSiteId || fProj?.siteId;
        if (focProjectId && (f.projectId === focProjectId || f.parentProjectId === focProjectId)) {
          return true;
        }
        if (siteId && effectiveSiteId === siteId) {
          return true;
        }
        return false;
      })
      .forEach((f) => {
        const row = (f.items || []).find((i) => i.itemId === item.id);
        if (row && Number(row.quantity) > 0) {
          const fProj = projects.find((p) => p.id === f.projectId || p.id === f.parentProjectId);
          const effectiveSiteId = f.assignedSiteId || fProj?.siteId || siteId;
          list.push({
            id: `foc-site-${f.id}`,
            voucherNo: f.voucherNumber,
            date: f.receivedDate || f.createdAt,
            siteName:
              f.assignedSiteName ||
              sites.find((s) => s.id === effectiveSiteId)?.name ||
              targetSite?.name ||
              'Assigned Site Yard',
            category: `Client FOC (${f.clientName} — ${f.projectName})`,
            status: 'Allocated',
            qty: Number(row.quantity),
            byUser: f.receivedBy,
          });
        }
      });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [stockRequests, clientFreeIssues, projects, sites, targetSite, item.id, siteId, focProjectId, mode]);

  // 5. FIELD TEAMS BREAKDOWN (Issued, Used, Wasted, Returned, Team In-Hand)
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

        // Issued to this team
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

        // Returned from this team to Site (Good vs Damaged)
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

        // Used & Wasted by this team on Projects
        let usedQty = 0;
        let wastedQty = 0;
        projectUsages
          .filter(
            (u) =>
              !u.isDeleted &&
              u.teamId === team.id &&
              (mode === 'central' || !siteId || u.siteId === siteId)
          )
          .forEach((u) => {
            const row = (u.items || []).find((i) => i.itemId === item.id);
            if (row) {
              usedQty += Number(row.quantity || 0);
              wastedQty += Number(row.wastageQuantity || 0);
            }
          });

        // Get official in-hand from allTeamsInHandStock or compute
        const summaryObj = allTeamsInHandStock.find((ts) => ts.team.id === team.id);
        const itemSummary = summaryObj?.items.find((i) => i.itemId === item.id);
        const inHandQty =
          mode === 'central' && itemSummary
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
  ]);

  // 6. PROJECT CONSUMPTION & WASTAGE LOGS
  const projectUsageLogs = useMemo(() => {
    const logs: Array<{
      id: string;
      voucherNo: string;
      date: string;
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
      .filter((u) => !u.isDeleted && (mode === 'central' || !siteId || u.siteId === siteId))
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
  }, [projectUsages, projects, sites, teams, item.id, mode, siteId]);

  // 7. AGGREGATE CUSTODY TOTALS (Grand Equation)
  const grandTotals = useMemo(() => {
    const allSitesInHand = siteBranchBreakdown.reduce((s, r) => s + r.siteInHand, 0);
    const allSitesInTransit = siteBranchBreakdown.reduce((s, r) => s + r.inTransitQty, 0);
    const allTeamsInHand = teamBreakdown.reduce((s, r) => s + r.inHandQty, 0);
    const totalIssuedToTeams = teamBreakdown.reduce((s, r) => s + r.issuedQty, 0);
    const totalUsedOnProjects = projectUsageLogs.reduce((s, r) => s + r.usedQty, 0);
    const totalWastedOnProjects = projectUsageLogs.reduce((s, r) => s + r.wastedQty, 0);
    const totalTeamDamagedReturns = teamBreakdown.reduce((s, r) => s + r.returnedDamagedQty, 0);
    const totalTeamGoodReturns = teamBreakdown.reduce((s, r) => s + r.returnedGoodQty, 0);

    // Supplier RTV deductions
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

    const siteSpecificStock =
      siteId ? getSiteItemStock(siteId, item.id) : null;

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
  ]);

  const handlePrintReport = async () => {
    const safeCode = (item.itemCode || 'ITEM').replace(/[^a-zA-Z0-9_-]/g, '_');
    const prefix = mode === 'central' ? 'Central_Stock_Item_Trace' : `Site_Stock_Item_Trace_${targetSite?.name || 'Branch'}`;
    await printHtmlElement(printElementId, `${prefix}_${safeCode}`);
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const safeCode = (item.itemCode || 'ITEM').replace(/[^a-zA-Z0-9_-]/g, '_');
      const prefix = mode === 'central' ? 'Central_Item_Traceability' : `Site_Item_Traceability_${targetSite?.name || 'Branch'}`;
      await downloadElementAsPdf(printElementId, `${prefix}_${safeCode}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const companyDisplayName = currentTenant?.companyName || config.companyName || 'Corporate Inventory & Asset Control';

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
                {mode === 'central'
                  ? 'Full End-to-End Material Lifecycle & Custody Summary'
                  : focProjectId
                  ? `🏢 Assigned Site FOC Traceability — ${targetSite?.name || 'Assigned Site Branch'}`
                  : `Site Branch Forward Traceability — ${targetSite?.name || 'Branch Yard'}`}
              </span>
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
            {mode === 'site' && targetSite && (
              <p className="text-[11px] text-emerald-200/90 font-medium mt-0.5">
                ✓ Scoped exclusively to Assigned Site <strong>{targetSite.name}</strong> — showing only stock received at this site, issued to teams of this site, and consumed on projects by those teams.
              </p>
            )}
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
            Print A4 Summary
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
        {/* LIVE CUSTODY FLOW KPI CARDS */}
        {mode === 'central' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Total Inbound */}
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
                {inboundBreakdownTotals.focReceivedQty > 0 && (
                  <div className="flex justify-between text-indigo-700 font-semibold">
                    <span>Client FOC:</span>
                    <strong className="font-mono">{formatNumber(inboundBreakdownTotals.focReceivedQty)}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Central Stock In-Hand */}
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
                {inboundBreakdownTotals.siteGoodReturnedQty > 0 && (
                  <div className="flex justify-between text-teal-800">
                    <span>Site Restocked:</span>
                    <strong className="font-mono">+{formatNumber(inboundBreakdownTotals.siteGoodReturnedQty)}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Site Branches In-Hand */}
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
                {grandTotals.allSitesInTransit > 0 && (
                  <div className="flex justify-between text-amber-800 font-semibold">
                    <span>In-Transit:</span>
                    <strong className="font-mono">{formatNumber(grandTotals.allSitesInTransit)}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Field Teams In-Hand */}
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
                <div className="flex justify-between">
                  <span>Returned Good:</span>
                  <strong className="font-mono">{formatNumber(grandTotals.totalTeamGoodReturns)}</strong>
                </div>
              </div>
            </div>

            {/* 5. Used on Projects */}
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

            {/* 6. Wasted / Damaged */}
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
                <div className="flex justify-between">
                  <span>Damaged Ret:</span>
                  <strong className="font-mono">{formatNumber(grandTotals.totalTeamDamagedReturns)}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SITE BRANCH MODE KPI CARDS */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Received from HQ */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                <span>1. Received (HQ/FOC)</span>
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xl font-black font-mono text-slate-900 mt-1">
                {formatNumber(grandTotals.siteSpecificStock?.received || 0)}{' '}
                <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
              </div>
              <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Normal HQ:</span>
                  <strong className="font-mono">{formatNumber(grandTotals.siteSpecificStock?.normalReceived || 0)}</strong>
                </div>
                <div className="flex justify-between text-indigo-700">
                  <span>Client FOC:</span>
                  <strong className="font-mono">{formatNumber(grandTotals.siteSpecificStock?.focReceived || 0)}</strong>
                </div>
              </div>
            </div>

            {/* 2. Site Branch In-Hand */}
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border-2 border-emerald-500/40 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-900 uppercase">
                <span>2. Site Yard In-Hand</span>
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <div className="text-xl font-black font-mono text-emerald-800 mt-1">
                {formatNumber(grandTotals.siteSpecificStock?.availableBalance || 0)}{' '}
                <span className="text-xs font-semibold text-emerald-700">{item.unit}</span>
              </div>
              <div className="mt-1.5 text-[11px] text-emerald-800 font-medium">
                Ready for Team Issue
              </div>
            </div>

            {/* 3. Issued to Site Teams */}
            <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-300 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-blue-900 uppercase">
                <span>3. Issued to Teams</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-700" />
              </div>
              <div className="text-xl font-black font-mono text-blue-800 mt-1">
                {formatNumber(grandTotals.totalIssuedToTeams)}{' '}
                <span className="text-xs font-semibold text-blue-700">{item.unit}</span>
              </div>
              <div className="mt-1.5 space-y-0.5 text-[11px] text-blue-900">
                <div className="flex justify-between">
                  <span>Restocked by Teams:</span>
                  <strong className="font-mono">+{formatNumber(grandTotals.totalTeamGoodReturns)}</strong>
                </div>
              </div>
            </div>

            {/* 4. Site Teams In-Hand */}
            <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-300 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-indigo-900 uppercase">
                <span>4. Teams In-Hand</span>
                <Users className="w-3.5 h-3.5 text-indigo-700" />
              </div>
              <div className="text-xl font-black font-mono text-indigo-800 mt-1">
                {formatNumber(grandTotals.allTeamsInHand)}{' '}
                <span className="text-xs font-semibold text-indigo-700">{item.unit}</span>
              </div>
              <div className="mt-1.5 text-[11px] text-indigo-900">
                Held by {teamBreakdown.length} field crew(s)
              </div>
            </div>

            {/* 5. Installed / Used on Site Projects */}
            <div className="bg-teal-50/60 p-3.5 rounded-xl border border-teal-300 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-teal-900 uppercase">
                <span>5. Used on Projects</span>
                <Hammer className="w-3.5 h-3.5 text-teal-700" />
              </div>
              <div className="text-xl font-black font-mono text-teal-800 mt-1">
                {formatNumber(grandTotals.totalUsedOnProjects)}{' '}
                <span className="text-xs font-semibold text-teal-700">{item.unit}</span>
              </div>
              <div className="mt-1.5 text-[11px] text-teal-900">
                Across {projectUsageLogs.length} usage log(s)
              </div>
            </div>

            {/* 6. Wasted / Damaged at Site */}
            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-300 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-rose-900 uppercase">
                <span>6. Wasted / Damaged</span>
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
                <div className="flex justify-between">
                  <span>Damaged Ret:</span>
                  <strong className="font-mono">{formatNumber(grandTotals.totalTeamDamagedReturns)}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Filter Tabs for Detailed Tables */}
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
              All Sections View
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('inbound')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubView === 'inbound'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {mode === 'central'
                ? `1. Inbound PO / Manual / FOC (${centralInboundRecords.length})`
                : `1. Transfers from HQ (${siteInboundTransfers.length})`}
            </button>
            {mode === 'central' && (
              <button
                type="button"
                onClick={() => setActiveSubView('sites')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSubView === 'sites'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                2. Site Branches Distribution ({siteBranchBreakdown.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveSubView('teams')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubView === 'teams'
                  ? 'bg-indigo-700 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {mode === 'central' ? '3.' : '2.'} Field Teams Custody & In-Hand ({teamBreakdown.length})
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
              {mode === 'central' ? '4.' : '3.'} Project Usage & Wastage ({projectUsageLogs.length})
            </button>
          </div>

          <span className="text-[11px] font-semibold text-slate-500">
            Click &ldquo;Print A4 Summary&rdquo; above to print or save all tables on an official A4 sheet.
          </span>
        </div>

        {/* SECTION A: INBOUND SOURCES (CENTRAL OR SITE) */}
        {(activeSubView === 'overview' || activeSubView === 'inbound') && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  {mode === 'central'
                    ? '1. Inbound Stock Sources (Supplier POs, Manual GRN, Client FOC & Site Returns)'
                    : `1. Inbound Transfers Received at ${targetSite?.name || 'Site Branch'}`}
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800">
                {mode === 'central'
                  ? `Total Received: ${formatNumber(grandTotals.totalReceivedAtHq)} ${item.unit}`
                  : `Total Received: ${formatNumber(grandTotals.siteSpecificStock?.received || 0)} ${item.unit}`}
              </span>
            </div>

            {mode === 'central' ? (
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
                        <tr key={rec.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{rec.refNo}</td>
                          <td className="py-2 px-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${rec.badgeColor}`}>
                              {rec.sourceType}
                            </span>
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
            ) : siteInboundTransfers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No stock transfer requisitions or direct FOC deliveries received at this site for this item yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Requisition / FOC #</th>
                      <th className="py-2.5 px-3">Transfer Category</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Accepted / Approved By</th>
                      <th className="py-2.5 px-3 text-right">Quantity ({item.unit})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siteInboundTransfers.map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{tr.voucherNo}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{tr.category}</td>
                        <td className="py-2 px-3 text-slate-600">{formatDateTime(tr.date)}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                              tr.status === 'Accepted' || tr.status === 'Allocated'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {tr.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{tr.byUser}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
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

        {/* SECTION B: SITE BRANCHES DISTRIBUTION (CENTRAL MODE) */}
        {mode === 'central' && (activeSubView === 'overview' || activeSubView === 'sites') && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-blue-50/80 border-b border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-700" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-950">
                  2. Distribution Across Site Branches & Site Store In-Hand
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
                      <th className="py-2.5 px-3 text-right">Received from HQ</th>
                      <th className="py-2.5 px-3 text-right">Issued to Teams</th>
                      <th className="py-2.5 px-3 text-right">Team Ret (Good)</th>
                      <th className="py-2.5 px-3 text-right">Ret to HQ</th>
                      <th className="py-2.5 px-3 text-right bg-blue-50/60 text-blue-900">Site Store In-Hand</th>
                      <th className="py-2.5 px-3 text-right bg-indigo-50/60 text-indigo-900">Site Teams In-Hand</th>
                      <th className="py-2.5 px-3 text-right">Used / Wasted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siteBranchBreakdown.map((row) => (
                      <tr key={row.site.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          <div>{row.site.name}</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            Supervisor: {row.site.supervisorName}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                          <div>{formatNumber(row.receivedFromHq)}</div>
                          {row.focReceived > 0 && (
                            <div className="text-[10px] text-indigo-700">🎁 {formatNumber(row.focReceived)} FOC</div>
                          )}
                          {row.inTransitQty > 0 && (
                            <div className="text-[10px] text-amber-700">🚚 +{formatNumber(row.inTransitQty)} Transit</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          -{formatNumber(row.issuedToTeams)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                          +{formatNumber(row.returnedFromTeams)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {row.returnedToHqGood + row.returnedToHqDamaged > 0
                            ? `-${formatNumber(row.returnedToHqGood + row.returnedToHqDamaged)}`
                            : '0'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-blue-800 bg-blue-50/30">
                          {formatNumber(row.siteInHand)} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-800 bg-indigo-50/30">
                          {formatNumber(row.siteTeamsInHand)} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className="text-teal-700 font-bold">{formatNumber(row.siteUsedQty)}</span>
                          {row.siteWastedQty > 0 && (
                            <span className="text-rose-600 font-bold ml-1">
                              ({formatNumber(row.siteWastedQty)} waste)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SECTION C: FIELD TEAMS DISTRIBUTION, USAGE, WASTAGE & TEAM IN-HAND */}
        {(activeSubView === 'overview' || activeSubView === 'teams') && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-indigo-50/80 border-b border-indigo-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-700" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-950">
                  {mode === 'central'
                    ? '3. Field Teams Allocation, Used, Wasted & Team In-Hand Balance'
                    : `2. Field Teams at ${targetSite?.name || 'This Site'} — Issued, Used, Wasted & Team In-Hand`}
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-900">
                Total Teams In-Hand: {formatNumber(grandTotals.allTeamsInHand)} {item.unit}
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
                      <th className="py-2.5 px-3">Field Team & Leader</th>
                      <th className="py-2.5 px-3">Assigned Site</th>
                      <th className="py-2.5 px-3 text-right">Issued from Site</th>
                      <th className="py-2.5 px-3 text-right">Used on Projects</th>
                      <th className="py-2.5 px-3 text-right">Project Wastage</th>
                      <th className="py-2.5 px-3 text-right">Returned (Good / Dmg)</th>
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
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                          {formatNumber(tb.issuedQty)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-700">
                          {formatNumber(tb.usedQty)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                          {formatNumber(tb.wastedQty)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          <span className="text-emerald-700 font-semibold">{formatNumber(tb.returnedGoodQty)} Good</span>
                          {tb.returnedDamagedQty > 0 && (
                            <span className="text-rose-600 font-semibold ml-1.5">
                              / {formatNumber(tb.returnedDamagedQty)} Dmg
                            </span>
                          )}
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

        {/* SECTION D: PROJECT CONSUMPTION & WASTAGE VOUCHERS */}
        {(activeSubView === 'overview' || activeSubView === 'projects') && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-teal-50/80 border-b border-teal-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hammer className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-950">
                  {mode === 'central'
                    ? '4. Project Consumption (Used) & Field Wastage Log'
                    : `3. Project Usage & Wastage Records at ${targetSite?.name || 'This Site'}`}
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-teal-900">
                Used: {formatNumber(grandTotals.totalUsedOnProjects)} {item.unit} | Waste:{' '}
                {formatNumber(grandTotals.totalWastedOnProjects)} {item.unit}
              </span>
            </div>

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
                      <th className="py-2.5 px-3">Project Name</th>
                      <th className="py-2.5 px-3">Site & Executing Team</th>
                      <th className="py-2.5 px-3 text-right">Installed / Used</th>
                      <th className="py-2.5 px-3 text-right">Wasted / Scrap</th>
                      <th className="py-2.5 px-3 text-right">Total Consumed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projectUsageLogs.map((log) => (
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
      </div>

      {/* HIDDEN / ISOLATED A4 PRINTABLE DOCUMENT FOR printHtmlElement & downloadElementAsPdf */}
      <div id={printElementId} className="hidden print:block bg-white text-slate-900 p-6">
        <div className="border-2 border-slate-900 p-5 space-y-5">
          {/* ISO Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
                ISO 9001:2015 MATERIAL CUSTODY & TRACEABILITY REPORT
              </div>
              <h1 className="text-xl font-black text-slate-900 uppercase mt-0.5">
                {companyDisplayName}
              </h1>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                {mode === 'central'
                  ? 'CENTRAL WAREHOUSE END-TO-END ITEM LIFECYCLE SUMMARY'
                  : `SITE BRANCH FORWARD ITEM TRACEABILITY REPORT — ${targetSite?.name?.toUpperCase() || 'SITE YARD'}`}
              </p>
            </div>
            <div className="text-right text-xs space-y-0.5 font-mono">
              <div>
                <strong>Doc Ref:</strong> TRC-{item.itemCode}-{new Date().getFullYear()}
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
                <div className="font-black text-sm text-slate-900">{item.itemName}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-500 font-bold">Category & Unit</div>
                <div className="font-bold text-slate-900">
                  {item.category} ({item.unit})
                </div>
              </div>
            </div>
          </div>

          {/* Summary KPI Grid */}
          {mode === 'central' ? (
            <div className="grid grid-cols-6 gap-2 text-center border border-slate-300 p-2.5 bg-white">
              <div className="border-r border-slate-200 pr-2">
                <div className="text-[10px] font-bold uppercase text-slate-500">Total Inbound</div>
                <div className="text-sm font-black font-mono text-slate-900">
                  {formatNumber(grandTotals.totalReceivedAtHq)} {item.unit}
                </div>
                <div className="text-[9px] text-slate-500">
                  PO: {formatNumber(inboundBreakdownTotals.poReceivedQty)} | Man: {formatNumber(inboundBreakdownTotals.manualReceivedQty)} | FOC: {formatNumber(inboundBreakdownTotals.focReceivedQty)}
                </div>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <div className="text-[10px] font-bold uppercase text-emerald-800">Central In-Hand</div>
                <div className="text-sm font-black font-mono text-emerald-800">
                  {formatNumber(grandTotals.centralInHand)} {item.unit}
                </div>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <div className="text-[10px] font-bold uppercase text-blue-800">Sites In-Hand</div>
                <div className="text-sm font-black font-mono text-blue-800">
                  {formatNumber(grandTotals.allSitesInHand)} {item.unit}
                </div>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <div className="text-[10px] font-bold uppercase text-indigo-800">Teams In-Hand</div>
                <div className="text-sm font-black font-mono text-indigo-800">
                  {formatNumber(grandTotals.allTeamsInHand)} {item.unit}
                </div>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <div className="text-[10px] font-bold uppercase text-teal-800">Project Used</div>
                <div className="text-sm font-black font-mono text-teal-800">
                  {formatNumber(grandTotals.totalUsedOnProjects)} {item.unit}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-rose-800">Wasted / Dmg</div>
                <div className="text-sm font-black font-mono text-rose-700">
                  {formatNumber(grandTotals.totalWasteAndDamage)} {item.unit}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-2 text-center border border-slate-300 p-2.5 bg-white">
              <div className="border-r border-slate-200 pr-2">
                <div className="text-[10px] font-bold uppercase text-slate-500">Received at Site</div>
                <div className="text-sm font-black font-mono text-slate-900">
                  {formatNumber(grandTotals.siteSpecificStock?.received || 0)} {item.unit}
                </div>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <div className="text-[10px] font-bold uppercase text-emerald-800">Site Store In-Hand</div>
                <div className="text-sm font-black font-mono text-emerald-800">
                  {formatNumber(grandTotals.siteSpecificStock?.availableBalance || 0)} {item.unit}
                </div>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <div className="text-[10px] font-bold uppercase text-blue-800">Issued to Teams</div>
                <div className="text-sm font-black font-mono text-blue-800">
                  {formatNumber(grandTotals.totalIssuedToTeams)} {item.unit}
                </div>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <div className="text-[10px] font-bold uppercase text-indigo-800">Teams In-Hand</div>
                <div className="text-sm font-black font-mono text-indigo-800">
                  {formatNumber(grandTotals.allTeamsInHand)} {item.unit}
                </div>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <div className="text-[10px] font-bold uppercase text-teal-800">Used on Projects</div>
                <div className="text-sm font-black font-mono text-teal-800">
                  {formatNumber(grandTotals.totalUsedOnProjects)} {item.unit}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-rose-800">Wasted / Damaged</div>
                <div className="text-sm font-black font-mono text-rose-700">
                  {formatNumber(grandTotals.totalWasteAndDamage)} {item.unit}
                </div>
              </div>
            </div>
          )}

          {/* Print Table 1: Inbound Sources */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider bg-slate-100 px-2.5 py-1.5 border border-slate-300">
              {mode === 'central'
                ? '1. Inbound Receipts (PO / Manual Entry / Client FOC / Site Returns)'
                : `1. Inbound Transfers Received at ${targetSite?.name || 'Site Branch'}`}
            </h3>
            {mode === 'central' ? (
              <table className="w-full text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 p-1.5 text-left">Ref / PO #</th>
                    <th className="border border-slate-300 p-1.5 text-left">Source Channel</th>
                    <th className="border border-slate-300 p-1.5 text-left">Supplier / Client / Site</th>
                    <th className="border border-slate-300 p-1.5 text-left">Date</th>
                    <th className="border border-slate-300 p-1.5 text-right">Qty ({item.unit})</th>
                  </tr>
                </thead>
                <tbody>
                  {centralInboundRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="border border-slate-300 p-2 text-center text-slate-500">
                        No inbound records.
                      </td>
                    </tr>
                  ) : (
                    centralInboundRecords.map((r) => (
                      <tr key={r.id}>
                        <td className="border border-slate-300 p-1.5 font-mono font-bold">{r.refNo}</td>
                        <td className="border border-slate-300 p-1.5">{r.sourceType}</td>
                        <td className="border border-slate-300 p-1.5">{r.partyName}</td>
                        <td className="border border-slate-300 p-1.5">{formatDateTime(r.date)}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">
                          +{formatNumber(r.qty)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 p-1.5 text-left">Voucher #</th>
                    <th className="border border-slate-300 p-1.5 text-left">Category</th>
                    <th className="border border-slate-300 p-1.5 text-left">Date</th>
                    <th className="border border-slate-300 p-1.5 text-left">Status</th>
                    <th className="border border-slate-300 p-1.5 text-right">Qty ({item.unit})</th>
                  </tr>
                </thead>
                <tbody>
                  {siteInboundTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="border border-slate-300 p-2 text-center text-slate-500">
                        No inbound transfer records for this site.
                      </td>
                    </tr>
                  ) : (
                    siteInboundTransfers.map((tr) => (
                      <tr key={tr.id}>
                        <td className="border border-slate-300 p-1.5 font-mono font-bold">{tr.voucherNo}</td>
                        <td className="border border-slate-300 p-1.5">{tr.category}</td>
                        <td className="border border-slate-300 p-1.5">{formatDateTime(tr.date)}</td>
                        <td className="border border-slate-300 p-1.5">{tr.status}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">
                          +{formatNumber(tr.qty)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Print Table 2: Site Branch Distribution (Central Mode) */}
          {mode === 'central' && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider bg-slate-100 px-2.5 py-1.5 border border-slate-300">
                2. Site Branch Distribution & Site In-Hand Balances
              </h3>
              <table className="w-full text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 p-1.5 text-left">Site Branch</th>
                    <th className="border border-slate-300 p-1.5 text-right">Received (HQ)</th>
                    <th className="border border-slate-300 p-1.5 text-right">Issued to Teams</th>
                    <th className="border border-slate-300 p-1.5 text-right">Team Ret</th>
                    <th className="border border-slate-300 p-1.5 text-right">Site In-Hand</th>
                    <th className="border border-slate-300 p-1.5 text-right">Teams In-Hand</th>
                    <th className="border border-slate-300 p-1.5 text-right">Used / Wasted</th>
                  </tr>
                </thead>
                <tbody>
                  {siteBranchBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-slate-300 p-2 text-center text-slate-500">
                        No site branch allocations.
                      </td>
                    </tr>
                  ) : (
                    siteBranchBreakdown.map((row) => (
                      <tr key={row.site.id}>
                        <td className="border border-slate-300 p-1.5 font-bold">{row.site.name}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">{formatNumber(row.receivedFromHq)}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">{formatNumber(row.issuedToTeams)}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">{formatNumber(row.returnedFromTeams)}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">{formatNumber(row.siteInHand)}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">{formatNumber(row.siteTeamsInHand)}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">
                          {formatNumber(row.siteUsedQty)} / {formatNumber(row.siteWastedQty)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Print Table 3: Field Teams Breakdown */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider bg-slate-100 px-2.5 py-1.5 border border-slate-300">
              {mode === 'central'
                ? '3. Field Teams Allocation, Consumption & Team In-Hand'
                : '2. Site Field Teams Allocation, Consumption & Team In-Hand'}
            </h3>
            <table className="w-full text-[11px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-300 p-1.5 text-left">Field Team</th>
                  <th className="border border-slate-300 p-1.5 text-left">Site Branch</th>
                  <th className="border border-slate-300 p-1.5 text-right">Issued</th>
                  <th className="border border-slate-300 p-1.5 text-right">Used</th>
                  <th className="border border-slate-300 p-1.5 text-right">Wasted</th>
                  <th className="border border-slate-300 p-1.5 text-right">Returned (G/D)</th>
                  <th className="border border-slate-300 p-1.5 text-right">Team In-Hand</th>
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
                      <td className="border border-slate-300 p-1.5 font-bold">
                        {tb.team.teamName} ({tb.team.teamLeaderName})
                      </td>
                      <td className="border border-slate-300 p-1.5">{tb.siteName}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">{formatNumber(tb.issuedQty)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">{formatNumber(tb.usedQty)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">{formatNumber(tb.wastedQty)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">
                        {formatNumber(tb.returnedGoodQty)} / {formatNumber(tb.returnedDamagedQty)}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">
                        {formatNumber(tb.inHandQty)} {item.unit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Print Table 4: Project Usage & Wastage */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider bg-slate-100 px-2.5 py-1.5 border border-slate-300">
              {mode === 'central'
                ? '4. Project Consumption (Installed) & Wastage Records'
                : '3. Site Project Consumption (Installed) & Wastage Records'}
            </h3>
            <table className="w-full text-[11px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-300 p-1.5 text-left">Voucher #</th>
                  <th className="border border-slate-300 p-1.5 text-left">Date</th>
                  <th className="border border-slate-300 p-1.5 text-left">Project</th>
                  <th className="border border-slate-300 p-1.5 text-left">Site & Team</th>
                  <th className="border border-slate-300 p-1.5 text-right">Used</th>
                  <th className="border border-slate-300 p-1.5 text-right">Wasted</th>
                  <th className="border border-slate-300 p-1.5 text-right">Total</th>
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
                      <td className="border border-slate-300 p-1.5 font-mono font-bold">{log.voucherNo}</td>
                      <td className="border border-slate-300 p-1.5">{formatDateTime(log.date)}</td>
                      <td className="border border-slate-300 p-1.5 font-semibold">
                        [{log.projectCode}] {log.projectName}
                      </td>
                      <td className="border border-slate-300 p-1.5">
                        {log.siteName} — {log.teamName}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">{formatNumber(log.usedQty)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">{formatNumber(log.wastedQty)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">
                        {formatNumber(log.totalDeducted)} {item.unit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
              Approved By (Authorized Management)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
