import * as XLSX from 'xlsx';
import { StockBackup } from '../types';

export function exportBackupToExcel(backup: StockBackup, filename?: string) {
  const wb = XLSX.utils.book_new();
  const snap = backup.snapshot;

  // 1. Items & Inventory Sheet
  if (snap.items && snap.items.length > 0) {
    const itemsData = snap.items.map((i, idx) => ({
      '#': idx + 1,
      'Item Code': i.itemCode,
      'Item Name': i.itemName,
      'Category': i.category,
      'Item Type': i.itemType || 'Material',
      'Unit': i.unit,
      'Unit Price': i.unitPrice || 0,
      'Low Stock Alert Threshold': i.lowStockThreshold || 0,
      'Description': i.description || '',
    }));
    const ws = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Items Catalog');
  }

  // 2. Sites & Warehouses Sheet
  if (snap.sites && snap.sites.length > 0) {
    const sitesData = snap.sites.map((s, idx) => ({
      '#': idx + 1,
      'Site / Warehouse Name': s.name,
      'Is Main Warehouse': s.isMainWarehouse ? 'YES' : 'NO',
      'Location': s.location,
      'Supervisor / Manager': s.supervisorName,
      'Contact Phone': s.contactNumber,
      'Created Date': s.createdAt ? s.createdAt.split('T')[0] : '',
    }));
    const ws = XLSX.utils.json_to_sheet(sitesData);
    XLSX.utils.book_append_sheet(wb, ws, 'Warehouses & Sites');
  }

  // 3. Field Teams Sheet
  if (snap.teams && snap.teams.length > 0) {
    const teamsData = snap.teams.map((t, idx) => {
      const site = snap.sites?.find((s) => s.id === t.assignedSiteId);
      return {
        '#': idx + 1,
        'Team Name': t.teamName,
        'Team Leader': t.teamLeaderName,
        'Assigned Site': site?.name || t.assignedSiteId,
        'Contact Phone': t.contactPhone,
        'Crew Size': t.crewSize,
      };
    });
    const ws = XLSX.utils.json_to_sheet(teamsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Field Teams');
  }

  // 4. Main Stock Receipts Sheet
  if (snap.mainStockEntries && snap.mainStockEntries.length > 0) {
    const entriesData = snap.mainStockEntries.map((e, idx) => {
      const item = snap.items?.find((i) => i.id === e.itemId);
      return {
        '#': idx + 1,
        'Date & Time': e.timestamp,
        'Reference / PO No': e.referenceNo,
        'Supplier': e.supplier,
        'Item Code': item?.itemCode || e.itemId,
        'Item Name': item?.itemName || '',
        'Quantity Received': e.quantity,
        'Unit Cost': e.unitCost || 0,
        'Total Cost': (e.quantity || 0) * (e.unitCost || 0),
        'Received By': e.receivedBy,
        'Notes': e.notes || '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(entriesData);
    XLSX.utils.book_append_sheet(wb, ws, 'Main Stock Receipts');
  }

  // 5. Team Issues / Dispatches Sheet
  if (snap.teamIssues && snap.teamIssues.length > 0) {
    const issuesData: Record<string, unknown>[] = [];
    snap.teamIssues.forEach((issue) => {
      const team = snap.teams?.find((t) => t.id === issue.teamId);
      const site = snap.sites?.find((s) => s.id === issue.siteId);
      issue.items.forEach((row, rowIdx) => {
        const itm = snap.items?.find((i) => i.id === row.itemId);
        issuesData.push({
          'Issue Note #': issue.issueNoteNumber,
          'Date': issue.issueDate,
          'Branch Site': site?.name || issue.siteId,
          'Team Name': team?.teamName || issue.teamId,
          'Work Order / Ref': issue.workOrderRef,
          'Item Code': itm?.itemCode || row.itemId,
          'Item Name': itm?.itemName || '',
          'Dispatched Qty': row.quantity,
          'Unit': itm?.unit || '',
          'Issued By': issue.issuedBy,
          'Notes': issue.notes || '',
        });
      });
    });
    if (issuesData.length > 0) {
      const ws = XLSX.utils.json_to_sheet(issuesData);
      XLSX.utils.book_append_sheet(wb, ws, 'Team Dispatches');
    }
  }

  // 6. Team Returns Sheet
  if (snap.teamReturns && snap.teamReturns.length > 0) {
    const returnsData = snap.teamReturns.map((r, idx) => {
      const team = snap.teams?.find((t) => t.id === r.teamId);
      const site = snap.sites?.find((s) => s.id === r.siteId);
      const itm = snap.items?.find((i) => i.id === r.itemId);
      return {
        '#': idx + 1,
        'Return Voucher #': r.returnVoucherNumber,
        'Date': r.returnDate,
        'Team Name': team?.teamName || r.teamId,
        'Receiving Branch': site?.name || r.siteId,
        'Item Code': itm?.itemCode || r.itemId,
        'Item Name': itm?.itemName || '',
        'Returned Quantity': r.quantity,
        'Condition': r.condition,
        'Reason': r.reason,
        'Returned By': r.returnedBy,
      };
    });
    const ws = XLSX.utils.json_to_sheet(returnsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Team Returns');
  }

  // 7. Project Registry & Usages Sheet
  if (snap.projectUsages && snap.projectUsages.length > 0) {
    const usagesData: Record<string, unknown>[] = [];
    snap.projectUsages.forEach((u) => {
      const site = snap.sites?.find((s) => s.id === u.siteId);
      const team = snap.teams?.find((t) => t.id === u.teamId);
      u.items.forEach((row) => {
        const itm = snap.items?.find((i) => i.id === row.itemId);
        usagesData.push({
          'Usage Voucher #': u.usageVoucherNumber,
          'Usage Date': u.usageDate || u.date,
          'Project Name': u.projectName,
          'Project ID / Ref': u.projectId,
          'Customer': u.customerName || '',
          'Site Branch': site?.name || u.siteId,
          'Field Team': team?.teamName || u.teamName || u.teamId,
          'Item Code': itm?.itemCode || row.itemId,
          'Item Name': itm?.itemName || '',
          'Used Qty': row.quantity,
          'Unit': itm?.unit || '',
          'Logged By': u.loggedBy,
          'Work Details': u.workDetails || '',
        });
      });
    });
    if (usagesData.length > 0) {
      const ws = XLSX.utils.json_to_sheet(usagesData);
      XLSX.utils.book_append_sheet(wb, ws, 'Project Material Usage');
    }
  }

  // 8. Suppliers & Purchase Orders Sheet
  if (snap.purchaseOrders && snap.purchaseOrders.length > 0) {
    const poData = snap.purchaseOrders.map((po: any, idx: number) => ({
      '#': idx + 1,
      'PO Number': po.poNumber || `PO-${idx + 1}`,
      'Supplier': po.supplierName || '',
      'Order Date': po.orderDate || '',
      'Status': po.status || '',
      'Subtotal': po.subtotal || 0,
      'Tax Amount': po.taxAmount || 0,
      'Grand Total': po.grandTotal || 0,
      'Prepared By': po.preparedBy || '',
      'Delivery Location': po.deliveryLocation || '',
    }));
    const ws = XLSX.utils.json_to_sheet(poData);
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Orders');
  }

  const cleanCompanyName = (snap.config?.companyName || 'StockSystem').replace(/[^a-z0-9]/gi, '_');
  const finalFilename = filename || `${cleanCompanyName}_Emergency_Full_Backup_${new Date().toISOString().split('T')[0]}.xlsx`;

  XLSX.writeFile(wb, finalFilename);
}
