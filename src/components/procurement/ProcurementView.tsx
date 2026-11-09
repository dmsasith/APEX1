import React, { useState, useMemo, useRef } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Printer,
  Download,
  Send,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  ArrowRight,
  Package,
  Layers,
  DollarSign,
  Copy,
  ExternalLink,
  ShieldAlert,
  Boxes,
  FileCheck,
  Check,
  AlertCircle,
  X,
  CreditCard,
  Briefcase,
  RotateCcw,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  SupplierReturn,
  SupplierReturnStatus,
  SettlementType,
  isSuperAdmin,
} from '../../types';
import { getThemeConfig } from '../../utils/themeUtils';
import { formatNumber, formatDate, formatDateTime } from '../../utils/exportUtils';
import { exportElementToPdf, printHtmlElement } from '../../utils/printUtils';
import { ConfirmModal } from '../common/ConfirmModal';
import { SupplierReturnModal } from './SupplierReturnModal';
import { DebitNoteModal } from './DebitNoteModal';
import { SettleReturnModal } from './SettleReturnModal';
import { SearchableItemSelect } from '../common/SearchableItemSelect';

export const ProcurementView: React.FC = () => {
  const {
    config,
    currentUser,
    activeItems,
    suppliers,
    activeSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    purchaseOrders,
    activePurchaseOrders,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    receivePurchaseOrderToMainStock,
    closePurchaseOrderRemainder,
    activeTemplate,
    supplierReturns,
    activeSupplierReturns,
    deleteSupplierReturn,
    dispatchSupplierReturn,
    activeProjects,
    projects,
  } = useStock();

  const theme = getThemeConfig(config?.themeId || config?.logoColor);
  const isCentralAdmin = isSuperAdmin(currentUser?.role) || currentUser?.username === 'admin';

  const [activeTab, setActiveTab] = useState<'orders' | 'returns' | 'suppliers'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [returnStatusFilter, setReturnStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals - Supplier Returns
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [editingReturn, setEditingReturn] = useState<SupplierReturn | null>(null);
  const [selectedReturnForDebitNote, setSelectedReturnForDebitNote] = useState<SupplierReturn | null>(null);
  const [settlingReturn, setSettlingReturn] = useState<SupplierReturn | null>(null);

  // Modals
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null);
  const [printingOrder, setPrintingOrder] = useState<PurchaseOrder | null>(null);

  // Partial Goods Receipt Note (GRN) Modal State
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [grnDeliveryNote, setGrnDeliveryNote] = useState('');
  const [grnNotes, setGrnNotes] = useState('');
  const [grnReceivedBy, setGrnReceivedBy] = useState('');
  const [grnReceiptDate, setGrnReceiptDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [grnItemInputs, setGrnItemInputs] = useState<Record<string, number>>({});
  const [grnError, setGrnError] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Confirm delete modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // ------------------ SUPPLIER FORM STATE ------------------
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supTaxNo, setSupTaxNo] = useState('');
  const [supTerms, setSupTerms] = useState('Net 30');
  const [supCategory, setSupCategory] = useState('');
  const [supNotes, setSupNotes] = useState('');
  const [supError, setSupError] = useState('');

  const openAddSupplier = () => {
    setEditingSupplier(null);
    setSupName('');
    setSupContact('');
    setSupEmail('');
    setSupPhone('');
    setSupAddress('');
    setSupTaxNo('');
    setSupTerms('Net 30');
    setSupCategory('');
    setSupNotes('');
    setSupError('');
    setShowSupplierModal(true);
  };

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupName(s.name);
    setSupContact(s.contactPerson || '');
    setSupEmail(s.email);
    setSupPhone(s.phone);
    setSupAddress(s.address || '');
    setSupTaxNo(s.businessRegNo || '');
    setSupTerms(s.paymentTerms || 'Net 30');
    setSupCategory(s.category || '');
    setSupNotes(s.notes || '');
    setSupError('');
    setShowSupplierModal(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) {
      setSupError('Supplier Company Name is required.');
      return;
    }
    if (!supEmail.trim()) {
      setSupError('Supplier Email is required for automated PO dispatch.');
      return;
    }

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name: supName.trim(),
        contactPerson: supContact.trim(),
        email: supEmail.trim(),
        phone: supPhone.trim(),
        address: supAddress.trim(),
        businessRegNo: supTaxNo.trim(),
        paymentTerms: supTerms.trim(),
        category: supCategory.trim(),
        notes: supNotes.trim(),
      });
      showToast(`Supplier "${supName.trim()}" updated successfully.`);
    } else {
      addSupplier({
        name: supName.trim(),
        contactPerson: supContact.trim(),
        email: supEmail.trim(),
        phone: supPhone.trim(),
        address: supAddress.trim(),
        businessRegNo: supTaxNo.trim(),
        paymentTerms: supTerms.trim(),
        category: supCategory.trim(),
        notes: supNotes.trim(),
      });
      showToast(`New Supplier "${supName.trim()}" registered.`);
    }
    setShowSupplierModal(false);
  };

  const handleDeleteSupplier = (s: Supplier) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Supplier Record?',
      message: `Are you sure you want to delete supplier "${s.name}"? Past purchase orders associated with this supplier will remain in history.`,
      onConfirm: () => {
        deleteSupplier(s.id);
        showToast(`Supplier "${s.name}" removed.`);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // ------------------ PURCHASE ORDER FORM STATE ------------------
  const generateNextPoNumber = () => {
    const year = new Date().getFullYear();
    const count = purchaseOrders.length + 1;
    return `PO-${year}-${String(count).padStart(4, '0')}`;
  };

  const [poNumber, setPoNumber] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [deliveryLocation, setDeliveryLocation] = useState(
    'Central Main Warehouse Logistics Yard, Himbutana, Mulleriyawa'
  );
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [orderNotes, setOrderNotes] = useState('');
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [poReservedProjectId, setPoReservedProjectId] = useState<string>('none');
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [orderError, setOrderError] = useState('');

  const openCreateOrder = () => {
    setPoNumber(generateNextPoNumber());
    setPoReservedProjectId('none');
    const defaultSup = activeSuppliers[0];
    if (defaultSup) {
      setSelectedSupplierId(defaultSup.id);
      setPaymentTerms(defaultSup.paymentTerms || 'Net 30');
    } else {
      setSelectedSupplierId('');
      setPaymentTerms('Net 30');
    }
    setOrderDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setExpectedDate(d.toISOString().split('T')[0]);
    setDeliveryLocation('Central Main Warehouse Logistics Yard, Himbutana, Mulleriyawa');
    setOrderNotes('Goods to be delivered in sound packaging with original delivery note & test certificates.');
    setTaxPercent(0);
    setDiscountAmount(0);
    setOrderItems([
      {
        itemId: activeItems[0]?.id || '',
        itemCode: activeItems[0]?.itemCode || '',
        itemName: activeItems[0]?.itemName || '',
        category: activeItems[0]?.category || '',
        unit: activeItems[0]?.unit || 'pcs',
        quantity: 10,
        unitPrice: activeItems[0]?.unitPrice || 0,
        lineTotal: (activeItems[0]?.unitPrice || 0) * 10,
      },
    ]);
    setOrderError('');
    setShowOrderModal(true);
  };

  const handleSupplierSelectChange = (supId: string) => {
    setSelectedSupplierId(supId);
    const sup = activeSuppliers.find((s) => s.id === supId);
    if (sup && sup.paymentTerms) {
      setPaymentTerms(sup.paymentTerms);
    }
  };

  const handleAddItemRow = () => {
    const firstItem = activeItems[0];
    const newItem: PurchaseOrderItem = {
      itemId: firstItem?.id || '',
      itemCode: firstItem?.itemCode || '',
      itemName: firstItem?.itemName || '',
      category: firstItem?.category || '',
      unit: firstItem?.unit || 'pcs',
      quantity: 1,
      unitPrice: firstItem?.unitPrice || 0,
      lineTotal: firstItem?.unitPrice || 0,
    };
    setOrderItems((prev) => [...prev, newItem]);
  };

  const handleItemChange = (index: number, itemId: string) => {
    const catalogItem = activeItems.find((i) => i.id === itemId);
    setOrderItems((prev) => {
      const updated = [...prev];
      if (catalogItem) {
        updated[index] = {
          ...updated[index],
          itemId: catalogItem.id,
          itemCode: catalogItem.itemCode,
          itemName: catalogItem.itemName,
          category: catalogItem.category,
          unit: catalogItem.unit,
          unitPrice: catalogItem.unitPrice || updated[index].unitPrice,
          lineTotal: (catalogItem.unitPrice || updated[index].unitPrice) * updated[index].quantity,
        };
      }
      return updated;
    });
  };

  const handleItemQuantityChange = (index: number, qty: number) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      const validQty = Math.max(0, qty);
      updated[index] = {
        ...updated[index],
        quantity: validQty,
        lineTotal: validQty * updated[index].unitPrice,
      };
      return updated;
    });
  };

  const handleItemPriceChange = (index: number, price: number) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      const validPrice = Math.max(0, price);
      updated[index] = {
        ...updated[index],
        unitPrice: validPrice,
        lineTotal: updated[index].quantity * validPrice,
      };
      return updated;
    });
  };

  const handleItemCustomNameChange = (index: number, name: string) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        itemName: name,
      };
      return updated;
    });
  };

  const handleItemUnitChange = (index: number, unit: string) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        unit,
      };
      return updated;
    });
  };

  const handleRemoveItemRow = (index: number) => {
    if (orderItems.length <= 1) {
      showToast('A Purchase Order must contain at least one line item.');
      return;
    }
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedSubtotal = useMemo(() => {
    return orderItems.reduce((acc, row) => acc + (row.lineTotal || 0), 0);
  }, [orderItems]);

  const calculatedTaxAmount = useMemo(() => {
    return (calculatedSubtotal * (taxPercent || 0)) / 100;
  }, [calculatedSubtotal, taxPercent]);

  const calculatedGrandTotal = useMemo(() => {
    return Math.max(0, calculatedSubtotal + calculatedTaxAmount - (discountAmount || 0));
  }, [calculatedSubtotal, calculatedTaxAmount, discountAmount]);

  const handleSaveOrder = (status: PurchaseOrderStatus = 'Order Sent') => {
    if (!poNumber.trim()) {
      setOrderError('PO Receipt Number is required.');
      return;
    }
    const sup = activeSuppliers.find((s) => s.id === selectedSupplierId);
    if (!sup) {
      setOrderError('Please select a registered supplier.');
      return;
    }
    if (orderItems.length === 0 || orderItems.some((i) => !i.itemName.trim() || i.quantity <= 0)) {
      setOrderError('Please verify line items. All materials must have a name and quantity > 0.');
      return;
    }

    const selectedProj = activeProjects.find((p) => p.id === poReservedProjectId) || projects.find((p) => p.id === poReservedProjectId);

    const newOrder = addPurchaseOrder({
      poNumber: poNumber.trim(),
      supplierId: sup.id,
      supplierName: sup.name,
      supplierEmail: sup.email,
      supplierPhone: sup.phone,
      supplierAddress: sup.address,
      supplierTaxNo: sup.businessRegNo,
      orderDate,
      expectedDeliveryDate: expectedDate,
      deliveryLocation,
      paymentTerms,
      status,
      items: orderItems,
      subtotal: calculatedSubtotal,
      taxRatePercent: taxPercent,
      taxAmount: calculatedTaxAmount,
      discountAmount,
      grandTotal: calculatedGrandTotal,
      notes: orderNotes,
      preparedBy: currentUser?.fullName || 'Super Administrator',
      reservedProjectId: poReservedProjectId !== 'none' ? poReservedProjectId : undefined,
      reservedProjectName: poReservedProjectId !== 'none' ? (selectedProj?.projectName || selectedProj?.projectId) : undefined,
    });

    setShowOrderModal(false);
    showToast(`Purchase Order #${newOrder.poNumber} created successfully!`);
    setViewingOrder(newOrder);
  };

  const handleDeleteOrder = (order: PurchaseOrder) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Order #${order.poNumber}?`,
      message: `Are you sure you want to delete this purchase order? If items were already received into Main Stock, their inventory balance will remain intact.`,
      onConfirm: () => {
        deletePurchaseOrder(order.id);
        showToast(`Order #${order.poNumber} deleted.`);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (viewingOrder?.id === order.id) setViewingOrder(null);
      },
    });
  };

  // Keep viewingOrder synchronized with purchaseOrders updates
  React.useEffect(() => {
    if (viewingOrder) {
      const refreshed = purchaseOrders.find((p) => p.id === viewingOrder.id);
      if (refreshed) {
        setViewingOrder(refreshed);
      }
    }
  }, [purchaseOrders]);

  // ------------------ GOODS RECEIPT NOTE (GRN) HANDLERS ------------------
  const openGrnModal = (order: PurchaseOrder) => {
    setReceivingOrder(order);
    setGrnDeliveryNote('');
    setGrnNotes('');
    setGrnReceivedBy(currentUser?.fullName || 'Central Store In-Charge');
    setGrnReceiptDate(new Date().toISOString().split('T')[0]);
    setGrnError('');

    // Pre-populate each item input with remaining balance
    const inputs: Record<string, number> = {};
    order.items.forEach((it) => {
      const prevRec = it.receivedQuantity || 0;
      const remaining = Math.max(0, it.quantity - prevRec);
      inputs[it.itemId] = remaining;
    });
    setGrnItemInputs(inputs);
    setShowGrnModal(true);
  };

  const handleFillAllRemaining = () => {
    if (!receivingOrder) return;
    const inputs: Record<string, number> = {};
    receivingOrder.items.forEach((it) => {
      const prevRec = it.receivedQuantity || 0;
      inputs[it.itemId] = Math.max(0, it.quantity - prevRec);
    });
    setGrnItemInputs(inputs);
  };

  const handleClearAllGrnInputs = () => {
    if (!receivingOrder) return;
    const inputs: Record<string, number> = {};
    receivingOrder.items.forEach((it) => {
      inputs[it.itemId] = 0;
    });
    setGrnItemInputs(inputs);
  };

  const handleGrnItemInputChange = (itemId: string, val: number) => {
    setGrnItemInputs((prev) => ({
      ...prev,
      [itemId]: Math.max(0, val),
    }));
  };

  const handleConfirmGrnReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingOrder) return;

    const batchItems: Array<{ itemId: string; quantityToReceive: number }> = [];
    let totalBatchQty = 0;

    for (const it of receivingOrder.items) {
      const prevRec = it.receivedQuantity || 0;
      const remaining = Math.max(0, it.quantity - prevRec);
      const inputVal = Number(grnItemInputs[it.itemId]) || 0;

      if (inputVal < 0) {
        setGrnError(`Quantity for "${it.itemName}" cannot be negative.`);
        return;
      }
      if (inputVal > remaining) {
        setGrnError(
          `Cannot receive ${inputVal} units of "${it.itemName}". Only ${remaining} units remain pending on this PO.`
        );
        return;
      }

      if (inputVal > 0) {
        batchItems.push({
          itemId: it.itemId,
          quantityToReceive: inputVal,
        });
        totalBatchQty += inputVal;
      }
    }

    if (totalBatchQty <= 0) {
      setGrnError('Please enter at least one item quantity to receive in this delivery batch.');
      return;
    }

    const res = receivePurchaseOrderToMainStock(receivingOrder.id, {
      receivedBy: grnReceivedBy.trim() || currentUser?.fullName || 'Central Store In-Charge',
      deliveryNoteNo: grnDeliveryNote.trim(),
      notes: grnNotes.trim(),
      receiptDate: grnReceiptDate ? new Date(grnReceiptDate).toISOString() : new Date().toISOString(),
      items: batchItems,
    });

    if (res.success) {
      showToast(res.message);
      setShowGrnModal(false);
      const updated = purchaseOrders.find((p) => p.id === receivingOrder.id);
      if (updated) setViewingOrder(updated);
    } else {
      setGrnError(res.message);
    }
  };

  const handleShortClosePo = (order: PurchaseOrder) => {
    setConfirmModal({
      isOpen: true,
      title: `Short-Close PO #${order.poNumber}?`,
      message: `The supplier delivered fewer items than originally ordered. If the supplier cannot deliver the remaining pending items, closing this PO will finalize the order as completed (short-delivered). All stock already credited to Central Main Warehouse will remain safely intact.`,
      onConfirm: () => {
        const res = closePurchaseOrderRemainder(
          order.id,
          'Short delivery finalized by Super Admin Central. Remaining unfulfilled balance cancelled with supplier.'
        );
        if (res.success) {
          showToast(res.message);
          const updated = purchaseOrders.find((p) => p.id === order.id);
          if (updated) setViewingOrder(updated);
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // ------------------ EMAIL & EXPORT HELPERS ------------------
  const generateEmailBody = (po: PurchaseOrder): string => {
    const currency = config.currencySymbol || 'Rs.';
    const itemsFormatted = po.items
      .map(
        (it, idx) =>
          `  ${idx + 1}. [${it.itemCode || 'N/A'}] ${it.itemName} | Qty: ${it.quantity} ${it.unit} | Unit Price: ${currency} ${formatNumber(it.unitPrice)} | Total: ${currency} ${formatNumber(it.lineTotal)}`
      )
      .join('\n');

    return `Dear ${po.supplierName} Sales & Dispatch Team,

Please find our Purchase Order / Material Requisition #${po.poNumber} for delivery to our Central Logistics Warehouse.

ORDER SPECIFICATIONS:
- PO Reference Number: ${po.poNumber}
- Order Date: ${po.orderDate}
- Required Delivery Date: ${po.expectedDeliveryDate}
- Delivery Location: ${po.deliveryLocation}
- Agreed Payment Terms: ${po.paymentTerms || 'Standard'}

REQUESTED MATERIALS:
${itemsFormatted}

FINANCIAL SUMMARY:
- Subtotal: ${currency} ${formatNumber(po.subtotal)}
- Tax / VAT: ${currency} ${formatNumber(po.taxAmount || 0)}
- Grand Total: ${currency} ${formatNumber(po.grandTotal)}

DELIVERY & PACKAGING INSTRUCTIONS:
${po.notes || 'Please ensure original delivery notes, invoice, and manufacturer certificates accompany the consignment.'}

Kindly review and reply to this email to confirm acceptance and scheduled delivery dispatch time.

Best regards,

${po.preparedBy || currentUser?.fullName || 'Procurement Team'}
Central Logistics & Warehouse Operations
${config.companyName || 'Apex Developer'}
Contact: ${config.phone || '+94 11 2549590'}
Email: ${config.email || 'apexdevinfo@gmail.com'}`;
  };

  const handleOpenEmailClient = (po: PurchaseOrder) => {
    const subject = encodeURIComponent(`Purchase Order ${po.poNumber} - ${config.companyName || 'Comtec Systems'}`);
    const body = encodeURIComponent(generateEmailBody(po));
    const mailtoUrl = `mailto:${encodeURIComponent(po.supplierEmail)}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
  };

  const handleCopyEmailText = (po: PurchaseOrder) => {
    const text = generateEmailBody(po);
    navigator.clipboard.writeText(text);
    showToast('Purchase Order email body copied to clipboard!');
  };

  const handlePrintDocument = (po: PurchaseOrder) => {
    setPrintingOrder(po);
    setTimeout(() => {
      const el = document.getElementById('printable-purchase-order');
      if (el) {
        printHtmlElement(el, `PO_${po.poNumber}`);
      }
    }, 200);
  };

  const handleDownloadPdf = async (po: PurchaseOrder) => {
    setPrintingOrder(po);
    setTimeout(async () => {
      const el = document.getElementById('printable-purchase-order');
      if (el) {
        try {
          await exportElementToPdf(el, `Purchase_Order_${po.poNumber}`, {
            action: 'download',
            title: `PO_${po.poNumber}`,
          });
          showToast(`PDF for PO #${po.poNumber} downloaded successfully!`);
        } catch (err) {
          console.error('PDF export failed:', err);
          showToast('Failed to generate PDF. You can use the Print button to Save as PDF.');
        }
      }
    }, 250);
  };

  // Filtered lists
  const filteredOrders = useMemo(() => {
    return activePurchaseOrders.filter((po) => {
      const matchesSearch =
        po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.items.some((i) => i.itemName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activePurchaseOrders, searchQuery, statusFilter]);

  const filteredSuppliers = useMemo(() => {
    return activeSuppliers.filter((s) => {
      return (
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [activeSuppliers, searchQuery]);

  const filteredReturns = useMemo(() => {
    return activeSupplierReturns.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.rtvNumber.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q) ||
        (r.poReference && r.poReference.toLowerCase().includes(q)) ||
        (r.gatePassNo && r.gatePassNo.toLowerCase().includes(q)) ||
        (r.siteName && r.siteName.toLowerCase().includes(q)) ||
        r.items.some(
          (it) => it.itemName.toLowerCase().includes(q) || it.itemCode.toLowerCase().includes(q)
        );

      const matchesStatus = returnStatusFilter === 'all' || r.status === returnStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activeSupplierReturns, searchQuery, returnStatusFilter]);

  const handleOpenCreateReturn = () => {
    setEditingReturn(null);
    setShowReturnModal(true);
  };

  const handleOpenEditReturn = (ret: SupplierReturn) => {
    setEditingReturn(ret);
    setShowReturnModal(true);
  };

  const handleDispatchReturn = (ret: SupplierReturn) => {
    setConfirmModal({
      isOpen: true,
      title: `Dispatch Return #${ret.rtvNumber} to Supplier?`,
      message: `Are you sure you want to dispatch ${ret.rtvNumber} to "${ret.supplierName}"? This will officially deduct ${ret.items.reduce((s, i) => s + i.quantity, 0)} units from ${ret.locationType === 'Main Stock' ? 'Main Central Stock' : 'Site Stock'} inventory.`,
      onConfirm: () => {
        const res = dispatchSupplierReturn(ret.id, {
          dispatchedBy: currentUser?.fullName || 'Central Storekeeper',
          gatePassNo: ret.gatePassNo,
          transporterName: ret.transporterName,
          vehicleNo: ret.vehicleNo,
        });
        showToast(res.message);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDeleteReturn = (ret: SupplierReturn) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Return #${ret.rtvNumber}?`,
      message: `Are you sure you want to delete supplier return voucher ${ret.rtvNumber} (${ret.supplierName})?`,
      onConfirm: () => {
        deleteSupplierReturn(ret.id);
        showToast(`Return #${ret.rtvNumber} deleted.`);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Non-admin restriction guard
  if (!isCentralAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <ShieldAlert className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Central Procurement Restricted</h2>
        <p className="text-sm text-slate-600 mb-6">
          Material Requisitions to external suppliers and Supplier Directory management are strictly designated for the{' '}
          <span className="font-semibold text-slate-800">Super Admin Central</span>.
        </p>
        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
          Currently logged in as: <strong className="text-slate-700">{currentUser?.fullName}</strong> ({currentUser?.role})
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShoppingCart className="w-3.5 h-3.5" />
              Main Stock Procurement & Requisitions
            </span>
            <span className="text-xs font-semibold text-slate-400">• Main Admin Only</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Material Requisitions & Supplier Orders
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Request materials from external suppliers into Central Main Stock, manage registered vendors, and generate international standard Purchase Orders with PDF, Print & Direct Email.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2.5">
          {activeTab === 'orders' ? (
            <button
              onClick={openCreateOrder}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 ${theme.primaryBtn}`}
            >
              <Plus className="w-4 h-4" />
              <span>New Material Requisition (PO)</span>
            </button>
          ) : activeTab === 'returns' ? (
            <button
              onClick={handleOpenCreateReturn}
              className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <RotateCcw className="w-4 h-4" />
              <span>New Return to Supplier (Debit Note)</span>
            </button>
          ) : (
            <button
              onClick={openAddSupplier}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 ${theme.primaryBtn}`}
            >
              <Plus className="w-4 h-4" />
              <span>Register New Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
              activeTab === 'suppliers'
                ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400'
                : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-950 border border-indigo-300 hover:from-indigo-100 hover:to-purple-100 shadow-2xs'
            }`}
          >
            <Building2 className={`w-4 h-4 ${activeTab === 'suppliers' ? 'text-white' : 'text-indigo-600'}`} />
            <span>✨ Suppliers Directory ({activeSuppliers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 bg-white hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Purchase Orders ({activePurchaseOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'returns'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 bg-white hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return to Supplier (RTV & Debit Notes)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'returns' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {activeSupplierReturns.length}
            </span>
          </button>
        </div>

        {/* Search & Filter - Enlarged for mobile accessibility */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative w-full sm:w-80 md:w-96 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeTab === 'orders'
                  ? 'Search PO #, supplier, material...'
                  : activeTab === 'returns'
                  ? 'Search RTV #, supplier, gate pass, item...'
                  : 'Search supplier name, phone, email...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-100 text-xs font-bold cursor-pointer"
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>

          {activeTab === 'orders' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Order Sent">Order Sent / Pending</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Received into Main Stock">Received into Main Stock</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          )}

          {activeTab === 'returns' && (
            <select
              value={returnStatusFilter}
              onChange={(e) => setReturnStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Return Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Dispatched to Supplier">Dispatched to Supplier</option>
              <option value="Debit Note Settled">Debit Note Settled</option>
              <option value="Replacement Stock Received">Replacement Received</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          )}
        </div>
      </div>

      {/* TAB 1: PURCHASE ORDERS / MATERIAL REQUISITIONS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Purchase Orders Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Create a material requisition to order stock from suppliers directly into Central Main Stock.
              </p>
              <button
                onClick={openCreateOrder}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
              >
                Create First Purchase Order
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((po) => {
                const isReceived = po.status === 'Received into Main Stock';
                const isPartial = po.status === 'Partially Received';
                const isDraft = po.status === 'Draft';
                const isCancelled = po.status === 'Cancelled';

                const totalOrderedUnits = po.items.reduce((sum, it) => sum + it.quantity, 0);
                const totalReceivedUnits = po.items.reduce((sum, it) => sum + (it.receivedQuantity || 0), 0);
                const percentReceived = totalOrderedUnits > 0 ? Math.min(100, Math.round((totalReceivedUnits / totalOrderedUnits) * 100)) : 0;

                return (
                  <div
                    key={po.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all p-5 shadow-xs flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="text-[11px] font-mono font-bold text-slate-400">PO VOUCHER</div>
                          <div className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition">
                            {po.poNumber}
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            isReceived
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isPartial
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isDraft
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : isCancelled
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {po.status}
                        </span>
                      </div>

                      {/* Supplier & Details */}
                      <div className="space-y-1.5 text-xs text-slate-600 mb-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{po.supplierName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{po.supplierEmail}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Order Date: {po.orderDate} • Due: {po.expectedDeliveryDate}</span>
                        </div>
                      </div>

                      {/* Partial delivery progress indicator */}
                      {isPartial && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3 text-xs">
                          <div className="flex items-center justify-between text-amber-900 font-bold text-[11px] mb-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Partial Delivery: {totalReceivedUnits} / {totalOrderedUnits} units
                            </span>
                            <span>{percentReceived}%</span>
                          </div>
                          <div className="w-full bg-amber-200/70 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-amber-600 h-1.5 rounded-full transition-all" style={{ width: `${percentReceived}%` }} />
                          </div>
                          <div className="text-[10px] text-amber-700 mt-1 flex justify-between font-semibold">
                            <span>Pending: {totalOrderedUnits - totalReceivedUnits} units</span>
                            <span>Batches: {po.receiptHistory?.length || 1}</span>
                          </div>
                        </div>
                      )}

                      {/* Items Preview */}
                      <div className="bg-slate-50 rounded-xl p-2.5 mb-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                          <span>Items ({po.items.length})</span>
                          <span>Est. Total</span>
                        </div>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {po.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                              <span className="truncate font-medium max-w-[170px]">
                                {it.quantity} {it.unit} • {it.itemName}
                                {it.receivedQuantity !== undefined && it.receivedQuantity > 0 && (
                                  <span className="text-[10px] text-emerald-700 font-bold ml-1">
                                    ({it.receivedQuantity} rec.)
                                  </span>
                                )}
                              </span>
                              <span className="font-mono text-slate-600 text-[11px]">
                                {config.currencySymbol} {formatNumber(it.lineTotal)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financial Total */}
                      <div className="flex items-baseline justify-between text-xs font-bold pt-1">
                        <span className="text-slate-500">Grand Total:</span>
                        <span className="text-base font-black text-slate-900 font-mono">
                          {config.currencySymbol} {formatNumber(po.grandTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5">
                      <button
                        onClick={() => setViewingOrder(po)}
                        className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                        title="View Full PO Voucher & Details"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => handleOpenEmailClient(po)}
                        className="py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                        title="Open in Email App (Pre-filled Mailto)"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </button>

                      <button
                        onClick={() => handlePrintDocument(po)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center transition cursor-pointer"
                        title="Print Purchase Order"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {!isReceived && !isCancelled && (
                        <button
                          onClick={() => openGrnModal(po)}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer active:scale-95 shadow-xs ${
                            isPartial
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                          title={isPartial ? 'Receive next delivery batch from supplier' : 'Receive materials into Main Warehouse Stock'}
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>{isPartial ? 'Receive Next Batch' : 'Receive'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUPPLIER RETURNS (RTV & DEBIT NOTES) */}
      {activeTab === 'returns' && (
        <div className="space-y-4">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold uppercase text-slate-500">Total Returns Created</div>
              <div className="text-xl font-black text-slate-900 mt-1">{activeSupplierReturns.length}</div>
              <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                Total Value: {config.currencySymbol} {formatNumber(activeSupplierReturns.reduce((s, r) => s + r.grandTotal, 0))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold uppercase text-blue-600">Dispatched / In-Transit</div>
              <div className="text-xl font-black text-blue-900 mt-1">
                {activeSupplierReturns.filter((r) => r.status === 'Dispatched to Supplier').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Awaiting credit note / settlement</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold uppercase text-emerald-600">Debit Notes Settled</div>
              <div className="text-xl font-black text-emerald-900 mt-1">
                {activeSupplierReturns.filter((r) => r.status === 'Debit Note Settled').length}
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5">Credits / refunds finalized</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold uppercase text-teal-600">Replacement Received</div>
              <div className="text-xl font-black text-teal-900 mt-1">
                {activeSupplierReturns.filter((r) => r.status === 'Replacement Stock Received').length}
              </div>
              <div className="text-[11px] text-teal-700 mt-0.5">Restocked into inventory</div>
            </div>
          </div>

          {filteredReturns.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <RotateCcw className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Supplier Returns Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No vendor returns have been recorded yet. Click below to initiate an official Return to Vendor (RTV) & Debit Note for defective, damaged, or rejected stock.
              </p>
              <button
                onClick={handleOpenCreateReturn}
                className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
              >
                + Create Return to Supplier
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReturns.map((ret) => {
                const totalUnits = ret.items.reduce((s, i) => s + i.quantity, 0);
                const isDraft = ret.status === 'Draft';
                const isDispatched = ret.status === 'Dispatched to Supplier';
                const isSettled = ret.status === 'Debit Note Settled' || ret.status === 'Replacement Stock Received';

                return (
                  <div
                    key={ret.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{ret.rtvNumber}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-bold text-slate-800">{ret.supplierName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ret.status === 'Dispatched to Supplier'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : ret.status === 'Debit Note Settled'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : ret.status === 'Replacement Stock Received'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : ret.status === 'Draft'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {ret.status}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          ({ret.settlementType})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>Date: <strong>{formatDate(ret.returnDate)}</strong></span>
                        <span>
                          Origin: <strong>{ret.locationType === 'Main Stock' ? 'Main Central Depot' : ret.siteName || 'Site Yard'}</strong>
                        </span>
                        {ret.poReference && <span>PO Ref: <strong className="font-mono">{ret.poReference}</strong></span>}
                        {ret.gatePassNo && <span>Gate Pass: <strong className="font-mono">{ret.gatePassNo}</strong></span>}
                        {ret.settlementRef && <span>Settlement Ref: <strong className="font-mono text-emerald-700">{ret.settlementRef}</strong></span>}
                      </div>

                      {/* Items Pill Summary */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-700">
                          {totalUnits} units across {ret.items.length} item(s):
                        </span>
                        {ret.items.slice(0, 3).map((it, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700"
                          >
                            <span className="font-semibold">{it.itemName}</span>
                            <span className="text-slate-500">({it.quantity} {it.unit})</span>
                            <span className="text-amber-700 font-medium">• {it.reasonCategory}</span>
                          </span>
                        ))}
                        {ret.items.length > 3 && (
                          <span className="text-[11px] text-slate-500 italic">+{ret.items.length - 3} more</span>
                        )}
                      </div>
                    </div>

                    {/* Financial Amount & Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="text-left md:text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Debit Claim Total</div>
                        <div className="font-mono font-black text-base text-emerald-800">
                          {config.currencySymbol} {formatNumber(ret.grandTotal)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {isDraft && (
                          <button
                            onClick={() => handleDispatchReturn(ret)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer active:scale-95"
                            title="Dispatch goods to supplier & deduct stock from inventory"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch</span>
                          </button>
                        )}

                        {isDispatched && (
                          <button
                            onClick={() => setSettlingReturn(ret)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer active:scale-95"
                            title="Record vendor credit note or replacement goods arrival"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Settle Claim</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedReturnForDebitNote(ret)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer active:scale-95"
                          title="View & Print Official Debit Note / RTV Voucher"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-300" />
                          <span>Debit Note</span>
                        </button>

                        {isDraft && (
                          <button
                            onClick={() => handleOpenEditReturn(ret)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Edit Return"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteReturn(ret)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Return Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          {filteredSuppliers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Suppliers Registered</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Add your approved material suppliers, hardware vendors, cable manufacturers, and equipment providers.
              </p>
              <button
                onClick={openAddSupplier}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
              >
                Register First Supplier
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map((s) => {
                const supplierPoCount = activePurchaseOrders.filter((po) => po.supplierId === s.id).length;

                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Supplier Top Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-slate-900 truncate">{s.name}</h3>
                          {s.category && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {s.category}
                            </span>
                          )}
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          {supplierPoCount} Orders
                        </span>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 text-xs text-slate-600 py-2 border-t border-b border-slate-100">
                        {s.contactPerson && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-800">{s.contactPerson}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <a
                            href={`mailto:${s.email}`}
                            className="text-emerald-700 hover:underline truncate"
                          >
                            {s.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{s.phone}</span>
                        </div>
                        {s.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="text-[11px] text-slate-500 line-clamp-2">{s.address}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>Terms: <strong className="text-slate-700">{s.paymentTerms || 'Net 30'}</strong></span>
                          {s.businessRegNo && <span>Tax/BRN: <strong className="text-slate-700">{s.businessRegNo}</strong></span>}
                        </div>
                      </div>

                      {s.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-2 line-clamp-2">
                          "{s.notes}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditSupplier(s)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Edit Supplier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(s)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          openCreateOrder();
                          handleSupplierSelectChange(s.id);
                        }}
                        className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Issue PO</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------ MODAL: REGISTER / EDIT SUPPLIER ------------------ */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}
                  </h3>
                  <p className="text-xs text-slate-500">Main Warehouse Approved Vendor Directory</p>
                </div>
              </div>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {supError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{supError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSupplier} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supplier / Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lanka Cables PLC / ACL Cables / Sinwa Hardware"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Ruwan Wickramasinghe (Sales Manager)"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sales@vendor.com"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone / Mobile</label>
                  <input
                    type="text"
                    placeholder="e.g. +94 11 254 9590 / +94 77 123 4567"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tax No. / BRN</label>
                  <input
                    type="text"
                    placeholder="e.g. PV-12345 / VAT 11442233"
                    value={supTaxNo}
                    onChange={(e) => setSupTaxNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Terms</label>
                  <select
                    value={supTerms}
                    onChange={(e) => setSupTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                    <option value="Advance 50%">Advance 50% / Balance on Delivery</option>
                    <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                    <option value="Immediate">Immediate Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category Supplied</label>
                  <input
                    type="text"
                    placeholder="e.g. Power Cables, HDPE Conduits, Fasteners"
                    value={supCategory}
                    onChange={(e) => setSupCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Physical / Delivery Address</label>
                <input
                  type="text"
                  placeholder="e.g. No. 45, Industrial Zone, Ekala, Ja-Ela"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Preferred vendor for 33kV ABC conductor fittings"
                  value={supNotes}
                  onChange={(e) => setSupNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-sm active:scale-95"
                >
                  {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ MODAL: CREATE PURCHASE ORDER ------------------ */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-6xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-2 sm:my-6 max-h-[94vh] sm:max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <ShoppingCart className="w-4 sm:w-5 h-4 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    New Material Requisition & Purchase Order
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                    Issue order for Main Stock arrival • Comtec Systems Procurement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0 ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {orderError && (
              <div className="my-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{orderError}</span>
              </div>
            )}

            {/* Form Body */}
            <div className="overflow-y-auto flex-1 py-3 sm:py-4 space-y-3.5 sm:space-y-4 pr-0.5 sm:pr-1">
              {/* Row 1: PO Number & Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PO / Receipt Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="w-full px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Select Supplier <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOrderModal(false);
                        openAddSupplier();
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      + Register New
                    </button>
                  </div>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => handleSupplierSelectChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {activeSuppliers.length === 0 ? (
                      <option value="">No suppliers available. Please register a supplier first.</option>
                    ) : (
                      activeSuppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.email}) — Terms: {s.paymentTerms || 'Net 30'}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Row 2: Dates, Terms, Receiving Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Order Date</label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g. Net 30 Days"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Destination</label>
                  <input
                    type="text"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="Delivery address / warehouse yard"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Allocate to Project (Optional)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Project reservation</span>
                  </label>
                  <select
                    value={poReservedProjectId}
                    onChange={(e) => setPoReservedProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value="none">📦 Unrestricted General Main Stock (Default)</option>
                    {activeProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        🎯 {p.projectName} ({p.projectId}) {p.siteIdentifier ? `— Site: ${p.siteIdentifier}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>Requested Materials / Items</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Material Row</span>
                  </button>
                </div>

                {/* 1. Mobile Item Cards Layout (Shown on small screens to prevent right-side clipping) */}
                <div className="space-y-3 md:hidden">
                  {orderItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                        <span className="font-bold text-xs text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          Item #{idx + 1}
                        </span>
                        {orderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-1 text-rose-600 hover:bg-rose-100 rounded-md transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Material / Description
                        </label>
                        {activeItems.length > 0 ? (
                          <div className="space-y-1.5 relative" style={{ zIndex: 40 - idx }}>
                            <SearchableItemSelect
                              selectedItemId={item.itemId}
                              onSelectItem={(selected) => handleItemChange(idx, selected.id)}
                              placeholder="Search item by code, name, category..."
                              showStockBadge={true}
                            />
                            <input
                              type="text"
                              placeholder="Or enter custom item description"
                              value={item.itemName}
                              onChange={(e) => handleItemCustomNameChange(idx, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
                            />
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Material Description"
                            value={item.itemName}
                            onChange={(e) => handleItemCustomNameChange(idx, e.target.value)}
                            className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Qty *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity || ''}
                            onChange={(e) => handleItemQuantityChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Unit
                          </label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemUnitChange(idx, e.target.value)}
                            placeholder="pcs"
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase truncate">
                            Unit Price ({config.currencySymbol})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice || ''}
                            onChange={(e) => handleItemPriceChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 text-right"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                        <span className="text-slate-500 font-semibold">Line Total:</span>
                        <span className="font-mono font-black text-emerald-700 text-sm">
                          {config.currencySymbol} {formatNumber(item.lineTotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. Desktop Table Layout (Shown on md+ screens with proper horizontal scroll protection & deep dropdown area) */}
                <div className="hidden md:block border border-slate-200 rounded-xl overflow-x-auto shadow-2xs min-h-[300px] pb-44">
                  <table className="w-full text-left text-xs min-w-[880px]">
                    <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[320px] lg:min-w-[400px]">Material / Catalog Item</th>
                        <th className="py-2.5 px-3 w-32 min-w-[110px]">Qty *</th>
                        <th className="py-2.5 px-3 w-28 min-w-[90px]">Unit</th>
                        <th className="py-2.5 px-3 w-40 min-w-[140px]">Unit Price ({config.currencySymbol})</th>
                        <th className="py-2.5 px-3 w-36 min-w-[130px] text-right">Line Total</th>
                        <th className="py-2.5 px-2 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orderItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70" style={{ zIndex: 40 - idx }}>
                          <td className="py-2.5 px-3 text-slate-400 font-bold text-center">{idx + 1}</td>

                          {/* Item Selector with Search Bar / Custom input */}
                          <td className="py-2.5 px-3 min-w-[320px] lg:min-w-[400px]">
                            {activeItems.length > 0 ? (
                              <div className="space-y-1 relative" style={{ zIndex: 40 - idx }}>
                                <SearchableItemSelect
                                  selectedItemId={item.itemId}
                                  onSelectItem={(selected) => handleItemChange(idx, selected.id)}
                                  placeholder="Search item by code, name, category..."
                                  showStockBadge={true}
                                />
                                <input
                                  type="text"
                                  placeholder="Or enter custom item description"
                                  value={item.itemName}
                                  onChange={(e) => handleItemCustomNameChange(idx, e.target.value)}
                                  className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-700 focus:bg-white focus:outline-none"
                                />
                              </div>
                            ) : (
                              <input
                                type="text"
                                placeholder="Material Description"
                                value={item.itemName}
                                onChange={(e) => handleItemCustomNameChange(idx, e.target.value)}
                                className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                              />
                            )}
                          </td>

                          {/* Quantity */}
                          <td className="py-2.5 px-3 w-32 min-w-[110px]">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity || ''}
                              onChange={(e) => handleItemQuantityChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-emerald-500 rounded-lg text-xs font-bold text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-center"
                              placeholder="0"
                            />
                          </td>

                          {/* Unit */}
                          <td className="py-2.5 px-3 w-28 min-w-[90px]">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleItemUnitChange(idx, e.target.value)}
                              placeholder="Pcs"
                              className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-emerald-500 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-center"
                            />
                          </td>

                          {/* Unit Price */}
                          <td className="py-2.5 px-3 w-40 min-w-[140px]">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice || ''}
                              onChange={(e) => handleItemPriceChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-emerald-500 rounded-lg text-xs font-mono font-bold text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-right"
                              placeholder="0.00"
                            />
                          </td>

                          {/* Line Total */}
                          <td className="py-2.5 px-3 w-36 min-w-[130px] text-right font-mono font-black text-slate-900 text-sm">
                            {formatNumber(item.lineTotal)}
                          </td>

                          {/* Delete */}
                          <td className="py-2.5 px-2 w-12 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                              title="Remove item row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculations & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Delivery Instructions / Commercial Terms
                  </label>
                  <textarea
                    rows={4}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Deliver to Central Store between 8 AM - 5 PM. Invoice copy required."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 resize-none"
                  />
                </div>

                <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 font-semibold">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {config.currencySymbol} {formatNumber(calculatedSubtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span>VAT / Tax:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={taxPercent || ''}
                        onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                        className="w-14 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-center text-xs font-bold"
                        placeholder="0"
                      />
                      <span>%</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {config.currencySymbol} {formatNumber(calculatedTaxAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Discount:</span>
                    <span className="flex items-center gap-1">
                      <span className="text-slate-400 font-mono">- {config.currencySymbol}</span>
                      <input
                        type="number"
                        min="0"
                        value={discountAmount || ''}
                        onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-0.5 bg-white border border-slate-200 rounded text-right text-xs font-mono font-bold"
                        placeholder="0"
                      />
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between text-sm font-black">
                    <span className="text-slate-900">Grand Total:</span>
                    <span className="text-base font-black text-emerald-700 font-mono">
                      {config.currencySymbol} {formatNumber(calculatedGrandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => handleSaveOrder('Draft')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer text-center"
              >
                Save as Draft
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveOrder('Order Sent')}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-sm active:scale-95 text-center"
                >
                  Create & Issue PO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ MODAL: VIEW PURCHASE ORDER ------------------ */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-3.5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-2 sm:my-6 max-h-[92vh] sm:max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                  PO
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    Purchase Order #{viewingOrder.poNumber}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                    Supplier: <span className="font-semibold text-slate-700">{viewingOrder.supplierName}</span> • Status:{' '}
                    <span className="font-bold text-emerald-700">{viewingOrder.status}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0 ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-3 sm:py-4 space-y-3.5 sm:space-y-4">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-400 font-bold text-[10px] uppercase">Order Date</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingOrder.orderDate}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold text-[10px] uppercase">Delivery Due</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingOrder.expectedDeliveryDate}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold text-[10px] uppercase">Payment Terms</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingOrder.paymentTerms || 'Net 30'}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold text-[10px] uppercase">Prepared By</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingOrder.preparedBy}</div>
                </div>
              </div>

              {/* Vendor & Ship to details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Vendor / Supplier</div>
                  <div className="font-bold text-slate-900">{viewingOrder.supplierName}</div>
                  <div className="text-slate-600">{viewingOrder.supplierEmail}</div>
                  <div className="text-slate-600">{viewingOrder.supplierPhone}</div>
                  {viewingOrder.supplierAddress && <div className="text-slate-500 mt-1">{viewingOrder.supplierAddress}</div>}
                </div>

                <div className="p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ship To (Central Stock)</div>
                  <div className="font-bold text-slate-900">{config.companyName || 'Comtec Systems (Pvt) Ltd'}</div>
                  <div className="text-slate-600">{viewingOrder.deliveryLocation}</div>
                  <div className="text-slate-500 mt-1">Recipient: Arthur Vance / Central Warehouse Store</div>
                </div>
              </div>

              {/* Line items table with Ordered vs Received tracking */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs min-w-[580px]">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Material Description</th>
                      <th className="py-2.5 px-3 text-center">Ordered</th>
                      <th className="py-2.5 px-3 text-center">Received</th>
                      <th className="py-2.5 px-3 text-center">Remaining</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total ({config.currencySymbol})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingOrder.items.map((it, idx) => {
                      const recQty = it.receivedQuantity || 0;
                      const remainingQty = Math.max(0, it.quantity - recQty);
                      const isLineComplete = recQty >= it.quantity;
                      const isLinePartial = recQty > 0 && recQty < it.quantity;

                      return (
                        <tr key={idx} className={isLinePartial ? 'bg-amber-50/40' : ''}>
                          <td className="py-2.5 px-3 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">
                              {it.itemCode && <span className="text-slate-400 font-mono text-[11px] mr-1">[{it.itemCode}]</span>}
                              {it.itemName}
                            </div>
                            {isLinePartial && (
                              <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                                Partial batch arrived • {remainingQty} {it.unit} pending
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                            {it.quantity} {it.unit}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {recQty > 0 ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-xs ${
                                isLineComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {recQty} {it.unit}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">
                            {remainingQty === 0 ? (
                              <span className="text-emerald-600 flex items-center justify-center gap-0.5 text-[11px]">
                                <Check className="w-3 h-3" /> None
                              </span>
                            ) : (
                              <span className="text-amber-700 font-bold text-xs">
                                {remainingQty} {it.unit}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {formatNumber(it.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatNumber(it.lineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                    <tr>
                      <td colSpan={6} className="py-2 px-3 text-right text-slate-600">Subtotal:</td>
                      <td className="py-2 px-3 text-right font-mono">{config.currencySymbol} {formatNumber(viewingOrder.subtotal)}</td>
                    </tr>
                    {viewingOrder.taxAmount ? (
                      <tr>
                        <td colSpan={6} className="py-1 px-3 text-right text-slate-600">Tax/VAT ({viewingOrder.taxRatePercent}%):</td>
                        <td className="py-1 px-3 text-right font-mono">{config.currencySymbol} {formatNumber(viewingOrder.taxAmount)}</td>
                      </tr>
                    ) : null}
                    <tr>
                      <td colSpan={6} className="py-2 px-3 text-right text-slate-900 text-sm">Grand Total:</td>
                      <td className="py-2 px-3 text-right font-mono text-sm text-emerald-700">{config.currencySymbol} {formatNumber(viewingOrder.grandTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Goods Receipt History (GRN Delivery Batches) */}
              {viewingOrder.receiptHistory && viewingOrder.receiptHistory.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Goods Receipt History ({viewingOrder.receiptHistory.length} Delivery Batches Received)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold">Credited to Central Main Stock</span>
                  </div>
                  <div className="space-y-2">
                    {viewingOrder.receiptHistory.map((grn, gIdx) => (
                      <div key={grn.id || gIdx} className="bg-white border border-slate-200 rounded-lg p-3 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                              {grn.grnNumber}
                            </span>
                            {grn.deliveryNoteNo && (
                              <span className="text-[11px] text-slate-600 font-normal">
                                • Delivery Note / Invoice: <strong>{grn.deliveryNoteNo}</strong>
                              </span>
                            )}
                          </div>
                          <span className="text-slate-500 text-[11px] font-normal">
                            {formatDate(grn.receiptDate)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mb-1.5">
                          Received By: <strong className="text-slate-700">{grn.receivedBy}</strong>
                          {grn.notes && <span className="italic ml-2 text-slate-500">"{grn.notes}"</span>}
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-100">
                          {grn.itemsReceived.map((itemRec, iIdx) => (
                            <span key={iIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              {itemRec.itemName}: +{itemRec.quantityReceived} {itemRec.unit}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingOrder.closedNotes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <strong>Short-Delivery Finalized:</strong> {viewingOrder.closedNotes}
                </div>
              )}

              {viewingOrder.notes && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <strong className="text-slate-700">Special Notes:</strong> {viewingOrder.notes}
                </div>
              )}
            </div>

            {/* Modal Action Bar */}
            <div className="pt-3 border-t border-slate-200 shrink-0 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePrintDocument(viewingOrder)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PO</span>
                </button>
                <button
                  onClick={() => handleDownloadPdf(viewingOrder)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF Download</span>
                </button>
                <button
                  onClick={() => handleOpenEmailClient(viewingOrder)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email App</span>
                </button>
                <button
                  onClick={() => handleCopyEmailText(viewingOrder)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Copy email body text to paste manually"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {viewingOrder.status === 'Partially Received' && (
                  <>
                    <button
                      onClick={() => openGrnModal(viewingOrder)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                    >
                      <Boxes className="w-4 h-4" />
                      <span>Receive Next Batch</span>
                    </button>
                    <button
                      onClick={() => handleShortClosePo(viewingOrder)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      title="Close PO if supplier cannot deliver remaining balance"
                    >
                      <span>Short-Close PO</span>
                    </button>
                  </>
                )}
                {(viewingOrder.status === 'Order Sent' || viewingOrder.status === 'Draft') && (
                  <button
                    onClick={() => openGrnModal(viewingOrder)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                  >
                    <Boxes className="w-4 h-4" />
                    <span>Receive into Main Stock</span>
                  </button>
                )}
                <button
                  onClick={() => handleDeleteOrder(viewingOrder)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Delete Order"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ MODAL: GOODS RECEIPT NOTE (GRN) / PARTIAL DELIVERY ------------------ */}
      {showGrnModal && receivingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-3.5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-2 sm:my-6 max-h-[94vh] sm:max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Boxes className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      Goods Receipt Note (GRN) • Inbound Delivery
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                      {receivingOrder.poNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Supplier: <strong className="text-slate-700">{receivingOrder.supplierName}</strong> • Credit directly to Central Main Warehouse
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGrnModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanatory Guidance Banner */}
            <div className="mt-3 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
              <div className="p-1 bg-blue-100 rounded-lg text-blue-700 shrink-0 mt-0.5">
                <Package className="w-3.5 h-3.5" />
              </div>
              <div className="leading-relaxed">
                <span className="font-bold">Partial / Split Delivery Support:</span> If the supplier delivered fewer goods than ordered, enter the exact quantity physically received in this delivery batch below. Only the received quantity will be added to Central Main Stock, and the remaining balance will stay pending for the next delivery.
              </div>
            </div>

            {grnError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{grnError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmGrnReceipt} className="overflow-y-auto flex-1 py-3 space-y-4">
              {/* Delivery Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Delivery Note / Supplier Inv. #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DN-2026-9042 / INV-8812"
                    value={grnDeliveryNote}
                    onChange={(e) => setGrnDeliveryNote(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Receipt Date
                  </label>
                  <input
                    type="date"
                    required
                    value={grnReceiptDate}
                    onChange={(e) => setGrnReceiptDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Received By (Store Keeper)
                  </label>
                  <input
                    type="text"
                    required
                    value={grnReceivedBy}
                    onChange={(e) => setGrnReceivedBy(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Items Receipt Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-800">
                    Consignment Items Verification:
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleFillAllRemaining}
                      className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition cursor-pointer"
                    >
                      Receive All Remaining
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllGrnInputs}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                    >
                      Clear to 0
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                  <table className="w-full text-left text-xs min-w-[580px]">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Material Description</th>
                        <th className="py-2.5 px-3 text-center w-24">Ordered</th>
                        <th className="py-2.5 px-3 text-center w-24">Prev. Rec.</th>
                        <th className="py-2.5 px-3 text-center w-24">Remaining</th>
                        <th className="py-2.5 px-3 text-right w-44">
                          Receive Now (Batch)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receivingOrder.items.map((it, idx) => {
                        const prevRec = it.receivedQuantity || 0;
                        const remaining = Math.max(0, it.quantity - prevRec);
                        const currentInput = grnItemInputs[it.itemId] !== undefined ? grnItemInputs[it.itemId] : remaining;
                        const isRemainingFulfilled = currentInput >= remaining && remaining > 0;
                        const isPartial = currentInput > 0 && currentInput < remaining;

                        return (
                          <tr key={idx} className={remaining === 0 ? 'bg-slate-50/60 opacity-60' : 'hover:bg-slate-50/50'}>
                            <td className="py-2.5 px-3 text-slate-400 font-bold">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-800">
                                {it.itemCode && <span className="text-slate-400 font-mono text-[11px] mr-1">[{it.itemCode}]</span>}
                                {it.itemName}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Unit Price: {config.currencySymbol} {formatNumber(it.unitPrice)}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                              {it.quantity} {it.unit}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                              {prevRec} {it.unit}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {remaining === 0 ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3" /> Fully Rec.
                                </span>
                              ) : (
                                <span className="font-bold text-amber-700 text-xs font-mono">
                                  {remaining} {it.unit}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {remaining === 0 ? (
                                <span className="text-xs text-slate-400 font-medium">Completed</span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    max={remaining}
                                    step="any"
                                    value={currentInput === 0 ? 0 : (currentInput || '')}
                                    onChange={(e) =>
                                      handleGrnItemInputChange(
                                        it.itemId,
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className={`w-24 px-2 py-1.5 rounded-lg text-right text-xs font-bold font-mono border focus:outline-none focus:ring-2 ${
                                      isRemainingFulfilled
                                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 focus:ring-emerald-500/20'
                                        : isPartial
                                        ? 'bg-amber-50/70 border-amber-300 text-amber-900 focus:ring-amber-500/20'
                                        : 'bg-white border-slate-200 text-slate-700'
                                    }`}
                                  />
                                  <span className="text-xs text-slate-500 font-medium w-8 text-left">
                                    {it.unit}
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delivery Batch Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Physical Inspection / Packaging Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delivered 60 bags sound packaging. Driver confirmed remaining 40 bags arriving Friday."
                  value={grnNotes}
                  onChange={(e) => setGrnNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              {/* Real-time Result Summary Box */}
              {(() => {
                let batchUnitsTotal = 0;
                let isBatchPartial = false;
                let totalRemainingAfterBatch = 0;

                receivingOrder.items.forEach((it) => {
                  const prevRec = it.receivedQuantity || 0;
                  const remaining = Math.max(0, it.quantity - prevRec);
                  const inputVal = Number(grnItemInputs[it.itemId]) || 0;
                  batchUnitsTotal += inputVal;
                  const leftOver = Math.max(0, remaining - inputVal);
                  totalRemainingAfterBatch += leftOver;
                  if (leftOver > 0) isBatchPartial = true;
                });

                return (
                  <div className={`p-4 rounded-xl border text-xs ${
                    isBatchPartial
                      ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                      : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                  }`}>
                    <div className="flex items-center justify-between font-bold text-sm mb-1.5">
                      <span className="flex items-center gap-1.5">
                        {isBatchPartial ? (
                          <Clock className="w-4 h-4 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                        <span>Batch Receipt Impact:</span>
                      </span>
                      <span className="font-mono text-base font-black">
                        +{batchUnitsTotal} Units into Central Main Stock
                      </span>
                    </div>

                    <div className="text-xs leading-relaxed">
                      {isBatchPartial ? (
                        <div>
                          • <strong className="text-amber-900">PO Status will become: "Partially Received"</strong>
                          <br />• <strong>{totalRemainingAfterBatch} units</strong> will remain outstanding. You can record further deliveries anytime by clicking "Receive Next Batch".
                        </div>
                      ) : (
                        <div>
                          • <strong className="text-emerald-900">PO Status will become: "Received into Main Stock"</strong> (100% Completed).
                          <br />• All materials requested under PO #{receivingOrder.poNumber} will be fully satisfied.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowGrnModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-sm active:scale-95 flex items-center gap-2"
                >
                  <Boxes className="w-4 h-4" />
                  <span>Confirm Goods Receipt (GRN)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ HIDDEN PRINTABLE PURCHASE ORDER (INTERNATIONAL FORMAT) ------------------ */}
      <div className="hidden">
        {printingOrder && (
          <div id="printable-purchase-order" className="p-10 bg-white text-slate-900 max-w-[850px] mx-auto font-sans leading-relaxed">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {config.companyName || 'APEX DEVELOPER (PVT) LTD'}
                </h1>
                <p className="text-xs text-slate-600 mt-1 max-w-md">
                  {config.address || 'Apex Software Engineering & Logistics Hub, Colombo, Sri Lanka.'}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Tel: {config.phone || '+94 11 2549590'} • Email: {config.email || 'apexdevinfo@gmail.com'}
                </p>
              </div>

              <div className="text-right">
                <div className="inline-block bg-slate-900 text-white px-4 py-1 text-sm font-black uppercase tracking-wider rounded">
                  PURCHASE ORDER
                </div>
                <div className="text-lg font-mono font-black text-slate-900 mt-2">
                  #{printingOrder.poNumber}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Date: {printingOrder.orderDate}
                </div>
              </div>
            </div>

            {/* Vendor & Ship-To Grid */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="border border-slate-300 rounded p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  VENDOR / SUPPLIER
                </div>
                <div className="text-sm font-bold text-slate-900">{printingOrder.supplierName}</div>
                {printingOrder.supplierAddress && (
                  <div className="text-xs text-slate-600 mt-1">{printingOrder.supplierAddress}</div>
                )}
                <div className="text-xs text-slate-600 mt-1">
                  Email: {printingOrder.supplierEmail}
                </div>
                <div className="text-xs text-slate-600">
                  Phone: {printingOrder.supplierPhone}
                </div>
                {printingOrder.supplierTaxNo && (
                  <div className="text-xs text-slate-600">
                    Tax / VAT No: {printingOrder.supplierTaxNo}
                  </div>
                )}
              </div>

              <div className="border border-slate-300 rounded p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  SHIP TO / DESTINATION
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {config.companyName || 'COMTEC SYSTEMS (PVT) LTD'} - MAIN STOCK
                </div>
                <div className="text-xs text-slate-600 mt-1">{printingOrder.deliveryLocation}</div>
                <div className="text-xs text-slate-600 mt-1">
                  Delivery Due Date: <strong className="text-slate-800">{printingOrder.expectedDeliveryDate}</strong>
                </div>
                <div className="text-xs text-slate-600">
                  Payment Terms: <strong className="text-slate-800">{printingOrder.paymentTerms || 'Net 30'}</strong>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-300 rounded overflow-hidden mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 w-10">#</th>
                    <th className="py-2.5 px-3">Item Code & Material Description</th>
                    <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                    <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 w-32 text-right">Amount ({config.currencySymbol})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {printingOrder.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold">
                        {it.itemCode && <span className="font-mono text-slate-600 mr-2">[{it.itemCode}]</span>}
                        {it.itemName}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{it.unit}</td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {it.quantity}
                        {it.receivedQuantity !== undefined && it.receivedQuantity > 0 && (
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            (Rec: {it.receivedQuantity})
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatNumber(it.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">{formatNumber(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-300 bg-slate-50 font-bold">
                  <tr>
                    <td colSpan={5} className="py-2 px-3 text-right text-slate-600">SUBTOTAL</td>
                    <td className="py-2 px-3 text-right font-mono">{config.currencySymbol} {formatNumber(printingOrder.subtotal)}</td>
                  </tr>
                  {printingOrder.taxAmount ? (
                    <tr>
                      <td colSpan={5} className="py-1 px-3 text-right text-slate-600">VAT / TAX ({printingOrder.taxRatePercent}%)</td>
                      <td className="py-1 px-3 text-right font-mono">{config.currencySymbol} {formatNumber(printingOrder.taxAmount)}</td>
                    </tr>
                  ) : null}
                  {printingOrder.discountAmount ? (
                    <tr>
                      <td colSpan={5} className="py-1 px-3 text-right text-slate-600">DISCOUNT</td>
                      <td className="py-1 px-3 text-right font-mono">- {config.currencySymbol} {formatNumber(printingOrder.discountAmount)}</td>
                    </tr>
                  ) : null}
                  <tr className="border-t-2 border-slate-400 text-sm">
                    <td colSpan={5} className="py-2.5 px-3 text-right font-black text-slate-900">GRAND TOTAL</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">{config.currencySymbol} {formatNumber(printingOrder.grandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Special Instructions */}
            <div className="border border-slate-200 rounded p-3 mb-8 text-xs text-slate-600">
              <strong className="text-slate-800">TERMS & SPECIAL CONDITIONS:</strong>
              <p className="mt-0.5">{printingOrder.notes || 'Goods must be supplied strictly in accordance with specified standards. Delivery note & test certificates must accompany all shipments.'}</p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-center text-xs">
              <div>
                <div className="h-14 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center pb-1 text-slate-400 text-[10px]">
                  {printingOrder.preparedBy}
                </div>
                <div className="font-bold text-slate-800">Prepared By</div>
                <div className="text-[10px] text-slate-500">Central Warehouse Store</div>
              </div>

              <div>
                <div className="h-14 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center pb-1 text-slate-400 text-[10px]">
                  Authorized Signature
                </div>
                <div className="font-bold text-slate-800">Approved By</div>
                <div className="text-[10px] text-slate-500">Procurement / Project Director</div>
              </div>

              <div>
                <div className="h-14 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center pb-1 text-slate-400 text-[10px]">
                  Sign & Date
                </div>
                <div className="font-bold text-slate-800">Supplier Acknowledgment</div>
                <div className="text-[10px] text-slate-500">Stamp & Delivery Acceptance</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------ MODAL: SUPPLIER RETURN (CREATE/EDIT) ------------------ */}
      {showReturnModal && (
        <SupplierReturnModal
          isOpen={showReturnModal}
          editingReturn={editingReturn}
          onClose={() => {
            setShowReturnModal(false);
            setEditingReturn(null);
          }}
          onSuccess={(msg) => showToast(msg)}
        />
      )}

      {/* ------------------ MODAL: PRINT / VIEW DEBIT NOTE (RTV) ------------------ */}
      {selectedReturnForDebitNote && (
        <DebitNoteModal
          isOpen={!!selectedReturnForDebitNote}
          supplierReturn={selectedReturnForDebitNote}
          onClose={() => setSelectedReturnForDebitNote(null)}
        />
      )}

      {/* ------------------ MODAL: SETTLE SUPPLIER RETURN ------------------ */}
      {settlingReturn && (
        <SettleReturnModal
          isOpen={!!settlingReturn}
          supplierReturn={settlingReturn}
          onClose={() => setSettlingReturn(null)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
