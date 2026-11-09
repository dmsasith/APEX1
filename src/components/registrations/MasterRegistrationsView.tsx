import React, { useState } from 'react';
import {
  PackagePlus,
  Building,
  UserPlus,
  Users2,
  Plus,
  Search,
  CheckCircle2,
  Shield,
  MapPin,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  RotateCcw,
  Link2,
  Copy,
  IdCard,
  UserCheck,
  Sparkles,
  Layers,
  ChevronRight,
  Warehouse,
  Target,
  Briefcase,
  Handshake,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { UserRole, Item, Site, User as UserType, Team, TeamMember, Client, isSuperAdmin, isCentralOrAllSiteAdmin, normalizeRole } from '../../types';
import { formatDate, formatNumber } from '../../utils/exportUtils';
import {
  isMachineryItem,
  getItemClassification,
  STANDARD_MACHINERY_CATEGORIES,
  STANDARD_MACHINERY_UNITS,
} from '../../utils/itemTypeUtils';
import { ConfirmModal } from '../common/ConfirmModal';

interface MasterRegistrationsViewProps {
  initialTab?: 'items' | 'sites' | 'users' | 'teams' | 'clients';
}

export const MasterRegistrationsView: React.FC<MasterRegistrationsViewProps> = ({ initialTab = 'items' }) => {
  const {
    config,
    currentUser,
    activeSites,
    activeUsers,
    activeItems,
    activeTeams,
    activeProjects,
    projects,
    addSite,
    addUser,
    addItem,
    addTeam,
    updateSite,
    updateUser,
    updateItem,
    updateTeam,
    softDeleteItem,
    softDeleteSite,
    softDeleteUser,
    softDeleteTeam,
    permanentlyDeleteUser,
    bulkSoftDeleteItems,
    bulkSoftDeleteSites,
    bulkSoftDeleteUsers,
    bulkSoftDeleteTeams,
    clearAllItems,
    clearAllSites,
    clearAllUsers,
    clearAllTeams,
    getMainWarehouseStock,
    activeClients,
    clients,
    addClient,
    updateClient,
    deleteClient,
    setCurrentUser,
    currentTenant,
    getWorkspaceLoginUrl,
  } = useStock();

  const isCentralAdmin = isSuperAdmin(currentUser.role) || currentUser.username === 'admin';

  const [activeTab, setActiveTab] = useState<'items' | 'sites' | 'users' | 'teams' | 'clients'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Reusable in-app confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  };

  // Checkbox selections for Bulk Delete
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  // Edit Modals State
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // --- ITEM FORM STATE ---
  const [itemClassification, setItemClassification] = useState<'Material' | 'Machinery'>('Material');
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Electrical & Power');
  const [itemUnit, setItemUnit] = useState('pcs');
  const [customUnit, setCustomUnit] = useState('');
  const [itemPrice, setItemPrice] = useState<number | ''>(25.0);
  const [itemThreshold, setItemThreshold] = useState<number | ''>(config.defaultLowStockThreshold);
  const [initialReceivedQty, setInitialReceivedQty] = useState<number | ''>('');
  const [reservedProjectId, setReservedProjectId] = useState<string>('none');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [editProjectSearchQuery, setEditProjectSearchQuery] = useState('');
  const [itemReservationFilter, setItemReservationFilter] = useState<'all' | 'general' | 'reserved'>('all');

  // --- DYNAMIC MACHINERY CATEGORIES STATE (ADMIN) ---
  const [customMachineryCategories, setCustomMachineryCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_machinery_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCustomCategoryName, setNewCustomCategoryName] = useState('');

  const allMachineryCategories = Array.from(
    new Set([
      ...STANDARD_MACHINERY_CATEGORIES,
      ...customMachineryCategories,
      ...activeItems
        .filter((i) => isMachineryItem(i) && i.category)
        .map((i) => i.category.trim()),
    ])
  );

  const handleAddCustomMachineryCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCustomCategoryName.trim();
    if (!trimmed) return;

    if (allMachineryCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Category "${trimmed}" already exists in the list.`);
      setItemCategory(trimmed);
      setNewCustomCategoryName('');
      setShowAddCategoryModal(false);
      return;
    }

    const updated = [...customMachineryCategories, trimmed];
    setCustomMachineryCategories(updated);
    try {
      localStorage.setItem('custom_machinery_categories', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    setItemCategory(trimmed);
    showToast(`New Machinery Category "${trimmed}" created & selected!`);
    setNewCustomCategoryName('');
    setShowAddCategoryModal(false);
  };

  const handleRemoveCustomMachineryCategory = (catToRemove: string) => {
    const updated = customMachineryCategories.filter((c) => c !== catToRemove);
    setCustomMachineryCategories(updated);
    try {
      localStorage.setItem('custom_machinery_categories', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    if (itemCategory === catToRemove) {
      setItemCategory(STANDARD_MACHINERY_CATEGORIES[0] || 'Excavator');
    }
    showToast(`Category "${catToRemove}" removed.`);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCode.trim() || !itemName.trim()) return;

    const upperCode = itemCode.trim().toUpperCase();
    if (activeItems.some((i) => i.itemCode.toUpperCase() === upperCode)) {
      showToast(`Item code "${upperCode}" already exists in the catalog. Please use a unique item code.`);
      return;
    }

    const finalUnit = itemUnit === 'custom' ? customUnit.trim() || 'units' : itemUnit;

    addItem(
      {
        itemCode: upperCode,
        itemName: itemName.trim(),
        category: itemCategory.trim(),
        itemType: itemClassification,
        unit: finalUnit,
        unitPrice: Number(itemPrice) || 0,
        lowStockThreshold: Number(itemThreshold) || config.defaultLowStockThreshold,
      },
      initialReceivedQty ? Number(initialReceivedQty) : 0
    );

    showToast(`Master Item ${upperCode} registered successfully!`);
    setItemCode('');
    setItemName('');
    setInitialReceivedQty('');
    setReservedProjectId('none');
  };

  // --- SITE FORM STATE ---
  const [siteName, setSiteName] = useState('');
  const [siteSupervisor, setSiteSupervisor] = useState('');
  const [isCustomAddSupervisor, setIsCustomAddSupervisor] = useState(false);
  const [isCustomEditSupervisor, setIsCustomEditSupervisor] = useState(false);
  const [siteLocation, setSiteLocation] = useState('');
  const [sitePhone, setSitePhone] = useState('');

  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) return;

    addSite({
      name: siteName.trim(),
      supervisorName: siteSupervisor.trim() || 'Assigned Supervisor',
      location: siteLocation.trim() || 'On-site details pending',
      contactNumber: sitePhone.trim() || '+1 (555) 000-0000',
      isMainWarehouse: false,
    });

    showToast(`Site Branch "${siteName}" added successfully!`);
    setSiteName('');
    setSiteSupervisor('');
    setIsCustomAddSupervisor(false);
    setSiteLocation('');
    setSitePhone('');
  };

  // --- USER FORM STATE ---
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [userSiteId, setUserSiteId] = useState(activeSites[0]?.id || 'all');
  const [userRole, setUserRole] = useState<UserRole>('Branch Admin');
  const [password, setPassword] = useState('pass123');
  const [showPassword, setShowPassword] = useState(false);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim() || !password.trim()) return;

    const normalizedUsername = username.trim().toLowerCase();
    if (activeUsers.some((u) => u.username.toLowerCase() === normalizedUsername)) {
      showToast(`Username "${normalizedUsername}" is already registered. Please use another.`);
      return;
    }

    addUser({
      username: normalizedUsername,
      fullName: fullName.trim(),
      siteId: userSiteId || 'all',
      role: userRole,
      password: password.trim(),
    });

    showToast(`User account "${normalizedUsername}" created with role "${userRole}"!`);
    setUsername('');
    setFullName('');
    setPassword('pass123');
  };

  // --- TEAM FORM STATE ---
  const [teamName, setTeamName] = useState('');
  const [teamLeaderName, setTeamLeaderName] = useState('');
  const [teamLeaderIdNumber, setTeamLeaderIdNumber] = useState('');
  const [assignedSiteId, setAssignedSiteId] = useState(activeSites.find((s) => !s.isMainWarehouse)?.id || activeSites[0]?.id);
  const [contactPhone, setContactPhone] = useState('');
  const [crewSize, setCrewSize] = useState<number | ''>(8);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Team Member scratchpad inputs
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberIdNumber, setNewMemberIdNumber] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Technician');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  const handleAddTeamMember = () => {
    if (!newMemberName.trim() || !newMemberIdNumber.trim()) {
      showToast('Please provide both Member Name and ID/NIC Number.');
      return;
    }
    const newMember: TeamMember = {
      id: `tm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newMemberName.trim(),
      idNumber: newMemberIdNumber.trim(),
      role: newMemberRole.trim() || 'Technician',
      phone: newMemberPhone.trim() || undefined,
    };
    const updated = [...teamMembers, newMember];
    setTeamMembers(updated);
    setCrewSize(updated.length + 1); // Team Leader + Members
    setNewMemberName('');
    setNewMemberIdNumber('');
    setNewMemberPhone('');
  };

  const handleRemoveTeamMember = (memberId: string) => {
    const updated = teamMembers.filter((m) => m.id !== memberId);
    setTeamMembers(updated);
    setCrewSize(updated.length + 1);
  };

  // Edit Team modal member scratchpad
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberIdNumber, setEditMemberIdNumber] = useState('');
  const [editMemberRole, setEditMemberRole] = useState('Technician');

  const handleAddEditTeamMember = () => {
    if (!editingTeam || !editMemberName.trim() || !editMemberIdNumber.trim()) {
      showToast('Please provide both Member Name and ID/NIC Number.');
      return;
    }
    const newMember: TeamMember = {
      id: `tm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: editMemberName.trim(),
      idNumber: editMemberIdNumber.trim(),
      role: editMemberRole.trim() || 'Technician',
    };
    const currentMembers = editingTeam.members || [];
    const updated = [...currentMembers, newMember];
    setEditingTeam({
      ...editingTeam,
      members: updated,
      crewSize: updated.length + 1,
    });
    setEditMemberName('');
    setEditMemberIdNumber('');
  };

  const handleRemoveEditTeamMember = (memberId: string) => {
    if (!editingTeam) return;
    const currentMembers = editingTeam.members || [];
    const updated = currentMembers.filter((m) => m.id !== memberId);
    setEditingTeam({
      ...editingTeam,
      members: updated,
      crewSize: updated.length + 1,
    });
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !teamLeaderName.trim()) return;

    const totalCrew = teamMembers.length > 0 ? teamMembers.length + 1 : (Number(crewSize) || 1);

    addTeam({
      teamName: teamName.trim(),
      teamLeaderName: teamLeaderName.trim(),
      teamLeaderIdNumber: teamLeaderIdNumber.trim() || undefined,
      assignedSiteId: assignedSiteId || activeSites[0]?.id,
      contactPhone: contactPhone.trim() || '+1 (555) 789-0000',
      crewSize: totalCrew,
      members: teamMembers,
    });

    showToast(`Field Team "${teamName}" registered with ${teamMembers.length} member(s)!`);
    setTeamName('');
    setTeamLeaderName('');
    setTeamLeaderIdNumber('');
    setContactPhone('');
    setCrewSize(8);
    setTeamMembers([]);
  };

  // --- FORM FIELD CLEAR HANDLERS ---
  const handleClearItemForm = () => {
    setItemCode('');
    setItemName('');
    setItemCategory('Electrical & Power');
    setItemUnit('pcs');
    setCustomUnit('');
    setItemPrice(25.0);
    setItemThreshold(config.defaultLowStockThreshold);
    setInitialReceivedQty('');
  };

  const handleClearSiteForm = () => {
    setSiteName('');
    setSiteSupervisor('');
    setIsCustomAddSupervisor(false);
    setSiteLocation('');
    setSitePhone('');
  };

  const handleClearUserForm = () => {
    setUsername('');
    setFullName('');
    setUserSiteId(activeSites[0]?.id || 'all');
    setUserRole('Branch Admin');
    setPassword('pass123');
  };

  const handleClearTeamForm = () => {
    setTeamName('');
    setTeamLeaderName('');
    setTeamLeaderIdNumber('');
    setAssignedSiteId(activeSites.find((s) => !s.isMainWarehouse)?.id || activeSites[0]?.id);
    setContactPhone('');
    setCrewSize(8);
    setTeamMembers([]);
    setNewMemberName('');
    setNewMemberIdNumber('');
    setNewMemberPhone('');
  };

  // --- EDIT HANDLERS ---
  const handleSaveItemEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateItem(editingItem.id, editingItem);
    showToast(`Item ${editingItem.itemCode} updated successfully.`);
    setEditingItem(null);
  };

  const handleSaveSiteEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite) return;
    updateSite(editingSite.id, editingSite);
    showToast(`Site Branch "${editingSite.name}" updated successfully.`);
    setEditingSite(null);
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUser(editingUser.id, editingUser);
    showToast(`User account "${editingUser.fullName}" updated.`);
    setEditingUser(null);
  };

  const handleSaveTeamEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    updateTeam(editingTeam.id, editingTeam);
    showToast(`Field Team "${editingTeam.teamName}" updated.`);
    setEditingTeam(null);
  };

  // --- BULK DELETE HANDLERS ---
  const handleBulkDeleteItems = () => {
    setConfirmState({
      isOpen: true,
      title: `Move ${selectedItemIds.length} Item(s) to Recycle Bin?`,
      message: `Are you sure you want to move ${selectedItemIds.length} selected items to the Recycle Bin? They can be restored anytime.`,
      confirmLabel: `Move (${selectedItemIds.length}) to Recycle Bin`,
      onConfirm: () => {
        bulkSoftDeleteItems(selectedItemIds);
        showToast(`Moved ${selectedItemIds.length} items to Recycle Bin.`);
        setSelectedItemIds([]);
      },
    });
  };

  const handleBulkDeleteSites = () => {
    setConfirmState({
      isOpen: true,
      title: `Move ${selectedSiteIds.length} Site(s) to Recycle Bin?`,
      message: `Are you sure you want to move ${selectedSiteIds.length} selected site branches to the Recycle Bin?`,
      confirmLabel: `Move (${selectedSiteIds.length}) to Recycle Bin`,
      onConfirm: () => {
        bulkSoftDeleteSites(selectedSiteIds);
        showToast(`Moved ${selectedSiteIds.length} sites to Recycle Bin.`);
        setSelectedSiteIds([]);
      },
    });
  };

  const handleBulkDeleteUsers = () => {
    const validIds = selectedUserIds.filter((id) => id !== currentUser?.id);
    if (validIds.length === 0) {
      showToast('Cannot delete the currently active logged-in user account.');
      return;
    }
    setConfirmState({
      isOpen: true,
      title: `Permanently Delete ${validIds.length} User(s)?`,
      message: `Are you sure you want to permanently delete ${validIds.length} selected user account(s)?`,
      confirmLabel: `Permanently Delete (${validIds.length})`,
      onConfirm: () => {
        validIds.forEach((id) => permanentlyDeleteUser(id));
        showToast(`Permanently deleted ${validIds.length} user(s).`);
        setSelectedUserIds([]);
      },
    });
  };

  const handleBulkDeleteTeams = () => {
    setConfirmState({
      isOpen: true,
      title: `Move ${selectedTeamIds.length} Team(s) to Recycle Bin?`,
      message: `Are you sure you want to move ${selectedTeamIds.length} selected field teams to the Recycle Bin?`,
      confirmLabel: `Move (${selectedTeamIds.length}) to Recycle Bin`,
      onConfirm: () => {
        bulkSoftDeleteTeams(selectedTeamIds);
        showToast(`Moved ${selectedTeamIds.length} teams to Recycle Bin.`);
        setSelectedTeamIds([]);
      },
    });
  };

  // Single Item/Site/User/Team Delete Handlers
  const handleDeleteItem = (i: Item) => {
    setConfirmState({
      isOpen: true,
      title: `Move Item "${i.itemCode}" to Recycle Bin?`,
      message: `Are you sure you want to move item "${i.itemCode} - ${i.itemName}" to the Recycle Bin? You can restore it anytime with all stock intact.`,
      confirmLabel: 'Move to Recycle Bin',
      onConfirm: () => {
        softDeleteItem(i.id);
        showToast(`Item ${i.itemCode} moved to Recycle Bin.`);
      },
    });
  };

  const handleDeleteSite = (s: Site) => {
    setConfirmState({
      isOpen: true,
      title: `Move Site "${s.name}" to Recycle Bin?`,
      message: `Are you sure you want to move site branch "${s.name}" (${s.location}) to the Recycle Bin?`,
      confirmLabel: 'Move to Recycle Bin',
      onConfirm: () => {
        softDeleteSite(s.id);
        showToast(`Site "${s.name}" moved to Recycle Bin.`);
      },
    });
  };

  const handleDeleteUser = (u: UserType) => {
    if (u.id === currentUser?.id) {
      showToast('Cannot delete the currently active logged-in user account.');
      return;
    }
    setConfirmState({
      isOpen: true,
      title: `Permanently Delete User "${u.fullName}"?`,
      message: `Are you sure you want to permanently delete user account "${u.fullName}" (@${u.username})?`,
      confirmLabel: 'Permanently Delete',
      onConfirm: () => {
        permanentlyDeleteUser(u.id);
        showToast(`User ${u.username} permanently deleted.`);
      },
    });
  };

  const handleDeleteTeam = (t: Team) => {
    setConfirmState({
      isOpen: true,
      title: `Move Team "${t.teamName}" to Recycle Bin?`,
      message: `Are you sure you want to move field team "${t.teamName}" (Leader: ${t.teamLeaderName}) to the Recycle Bin?`,
      confirmLabel: 'Move to Recycle Bin',
      onConfirm: () => {
        softDeleteTeam(t.id);
        showToast(`Team "${t.teamName}" moved to Recycle Bin.`);
      },
    });
  };

  // Section Clear Handlers
  const handleClearAllItems = () => {
    setConfirmState({
      isOpen: true,
      title: 'Clear All Active Items?',
      message: `Are you sure you want to move all ${activeItems.length} active items to the Recycle Bin? They will be preserved in the Recycle Bin and can be restored.`,
      confirmLabel: 'Clear All Items',
      onConfirm: () => {
        clearAllItems();
        setSelectedItemIds([]);
        showToast('All active items moved to Recycle Bin.');
      },
    });
  };

  const handleClearAllSites = () => {
    setConfirmState({
      isOpen: true,
      title: 'Clear All Site Branches?',
      message: 'Are you sure you want to move all site branches (except Central Main Warehouse) to the Recycle Bin?',
      confirmLabel: 'Clear All Sites',
      onConfirm: () => {
        clearAllSites();
        setSelectedSiteIds([]);
        showToast('All site branches moved to Recycle Bin.');
      },
    });
  };

  const handleClearAllUsers = () => {
    setConfirmState({
      isOpen: true,
      title: 'Clear All Non-Admin Users?',
      message: 'Are you sure you want to move all non-admin users to the Recycle Bin?',
      confirmLabel: 'Clear Users',
      onConfirm: () => {
        clearAllUsers();
        setSelectedUserIds([]);
        showToast('Non-admin users moved to Recycle Bin.');
      },
    });
  };

  const handleClearAllTeams = () => {
    setConfirmState({
      isOpen: true,
      title: 'Clear All Field Teams?',
      message: `Are you sure you want to move all ${activeTeams.length} field teams to the Recycle Bin?`,
      confirmLabel: 'Clear All Teams',
      onConfirm: () => {
        clearAllTeams();
        setSelectedTeamIds([]);
        showToast('All field teams moved to Recycle Bin.');
      },
    });
  };

  // --- CLIENT REGISTRATION & DIRECTORY STATE ---
  const STANDARD_CLIENT_CATEGORIES = [
    'Telecom Operator & Network Owner',
    'Power & Energy Utility Board',
    'Civil Infrastructure Authority',
    'Main EPC Contractor / Developer',
    'Commercial Project Owner',
    'Government & Municipal Body',
    'Water & Sewage Utility',
    'Transportation & Ports Authority',
  ];

  const [customClientCategories, setCustomClientCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_client_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showAddClientCategoryModal, setShowAddClientCategoryModal] = useState(false);
  const [newCustomClientCategoryName, setNewCustomClientCategoryName] = useState('');

  const [clientCodeInput, setClientCodeInput] = useState('');
  const [clientNameInput, setClientNameInput] = useState('');
  const [clientCategoryInput, setClientCategoryInput] = useState('Telecom Operator & Network Owner');
  const [clientContactPersonInput, setClientContactPersonInput] = useState('');
  const [clientEmailInput, setClientEmailInput] = useState('');
  const [clientPhoneInput, setClientPhoneInput] = useState('');
  const [clientAddressInput, setClientAddressInput] = useState('');
  const [clientTaxNoInput, setClientTaxNoInput] = useState('');
  const [clientNotesInput, setClientNotesInput] = useState('');

  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientCategoryFilter, setClientCategoryFilter] = useState('all');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const allClientCategories = Array.from(
    new Set([
      ...STANDARD_CLIENT_CATEGORIES,
      ...customClientCategories,
      ...activeClients
        .filter((c) => c.category)
        .map((c) => c.category!.trim()),
    ])
  );

  const handleAddCustomClientCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCustomClientCategoryName.trim();
    if (!trimmed) return;

    if (allClientCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Industry Category "${trimmed}" already exists.`);
      setClientCategoryInput(trimmed);
      setNewCustomClientCategoryName('');
      setShowAddClientCategoryModal(false);
      return;
    }

    const updated = [...customClientCategories, trimmed];
    setCustomClientCategories(updated);
    try {
      localStorage.setItem('custom_client_categories', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    setClientCategoryInput(trimmed);
    showToast(`New Industry Category "${trimmed}" created & selected!`);
    setNewCustomClientCategoryName('');
    setShowAddClientCategoryModal(false);
  };

  const handleRemoveCustomClientCategory = (catToRemove: string) => {
    const updated = customClientCategories.filter((c) => c !== catToRemove);
    setCustomClientCategories(updated);
    try {
      localStorage.setItem('custom_client_categories', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    if (clientCategoryInput === catToRemove) {
      setClientCategoryInput(STANDARD_CLIENT_CATEGORIES[0]);
    }
    showToast(`Industry Category "${catToRemove}" removed.`);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNameInput.trim()) return;

    const newClt = addClient({
      clientCode: clientCodeInput.trim() || undefined,
      name: clientNameInput.trim(),
      category: clientCategoryInput.trim(),
      contactPerson: clientContactPersonInput.trim() || undefined,
      email: clientEmailInput.trim() || undefined,
      phone: clientPhoneInput.trim() || undefined,
      address: clientAddressInput.trim() || undefined,
      taxRegistrationNo: clientTaxNoInput.trim() || undefined,
      notes: clientNotesInput.trim() || undefined,
    });

    showToast(`Master Client "${newClt.name}" (${newClt.clientCode}) registered successfully!`);
    setClientCodeInput('');
    setClientNameInput('');
    setClientContactPersonInput('');
    setClientEmailInput('');
    setClientPhoneInput('');
    setClientAddressInput('');
    setClientTaxNoInput('');
    setClientNotesInput('');
  };

  const handleUpdateClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editingClient.name.trim()) return;

    updateClient(editingClient.id, {
      name: editingClient.name.trim(),
      category: editingClient.category?.trim(),
      contactPerson: editingClient.contactPerson?.trim(),
      email: editingClient.email?.trim(),
      phone: editingClient.phone?.trim(),
      address: editingClient.address?.trim(),
      taxRegistrationNo: editingClient.taxRegistrationNo?.trim(),
      notes: editingClient.notes?.trim(),
    });

    showToast(`Updated Master Client "${editingClient.name}" successfully!`);
    setEditingClient(null);
  };

  const handleDeleteClientSingle = (client: Client) => {
    setConfirmState({
      isOpen: true,
      title: `Delete Master Client "${client.name}"?`,
      message: `Are you sure you want to delete client ${client.clientCode} (${client.name})?`,
      confirmLabel: 'Delete Client',
      onConfirm: () => {
        deleteClient(client.id);
        showToast(`Client "${client.name}" deleted successfully.`);
      },
    });
  };

  const handleBulkDeleteClients = () => {
    if (selectedClientIds.length === 0) return;
    setConfirmState({
      isOpen: true,
      title: `Delete ${selectedClientIds.length} Selected Clients?`,
      message: `Are you sure you want to delete these ${selectedClientIds.length} registered clients?`,
      confirmLabel: 'Delete Selected',
      onConfirm: () => {
        selectedClientIds.forEach((id) => deleteClient(id));
        setSelectedClientIds([]);
        showToast(`Deleted ${selectedClientIds.length} clients successfully.`);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between gap-3 shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Executive Header Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-sm overflow-hidden">
        {/* Subtle background mesh visual */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>System Master Registry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Master Registration & Asset Governance
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Register, configure, edit, or bulk-manage item catalogs, site branches, operational users, and field crews with Recycle Bin protection.
            </p>
          </div>

          {/* High-End Segmented Control Bar */}
          <div className="bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md shrink-0 flex flex-wrap sm:flex-nowrap gap-1">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'items'
                  ? 'bg-white text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <PackagePlus className={`w-4 h-4 ${activeTab === 'items' ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>Items ({activeItems.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('sites')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'sites'
                  ? 'bg-white text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Building className={`w-4 h-4 ${activeTab === 'sites' ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>Site Branches ({activeSites.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-white text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <UserPlus className={`w-4 h-4 ${activeTab === 'users' ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>Users ({activeUsers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'teams'
                  ? 'bg-white text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Users2 className={`w-4 h-4 ${activeTab === 'teams' ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>Teams ({activeTeams.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'clients'
                  ? 'bg-white text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Briefcase className={`w-4 h-4 ${activeTab === 'clients' ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>Clients / Principals ({activeClients.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: ADD & MANAGE ITEMS */}
      {activeTab === 'items' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Creation Form */}
          {isCentralAdmin ? (
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-emerald-400 flex items-center justify-center font-bold">
                    <PackagePlus className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">Master Item Creation Form</h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">HQ Admin</span>
              </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              {/* Item Classification Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Item Classification *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setItemClassification('Material');
                      if (STANDARD_MACHINERY_CATEGORIES.includes(itemCategory as any)) {
                        setItemCategory('Electrical & Power');
                      }
                      setItemUnit('pcs');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      itemClassification === 'Material'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>🧱 Material / Consumable</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItemClassification('Machinery');
                      if (!STANDARD_MACHINERY_CATEGORIES.includes(itemCategory as any)) {
                        setItemCategory('Excavator');
                      }
                      setItemUnit('Nos');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      itemClassification === 'Machinery'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>🚜 Machinery / Fleet</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Item Code *</label>
                <input
                  type="text"
                  placeholder={itemClassification === 'Machinery' ? 'e.g. EXC-CAT-320, GEN-KUB-50, WELD-400' : 'e.g. CBL-CU-500, ST-BAR-20'}
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Item Name *</label>
                <input
                  type="text"
                  placeholder={itemClassification === 'Machinery' ? 'e.g. Caterpillar 320 Hydraulic Excavator' : 'Full material specification'}
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Category *</label>
                  {itemClassification === 'Machinery' && (
                    <div className="flex items-center gap-1.5">
                      {isCentralAdmin ? (
                        <button
                          type="button"
                          onClick={() => setShowAddCategoryModal(!showAddCategoryModal)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 dark:text-amber-200 bg-amber-100/90 dark:bg-amber-950/70 hover:bg-amber-200 border border-amber-300 dark:border-amber-800/80 px-2.5 py-0.5 rounded-lg transition-all cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>+ Add Machinery Category</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">Standard Fleet Equipment</span>
                      )}
                    </div>
                  )}
                </div>

                {itemClassification === 'Machinery' ? (
                  <div className="space-y-2">
                    {/* Add Custom Category Inline Sub-Form for Admin */}
                    {isCentralAdmin && showAddCategoryModal && (
                      <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-300">
                          <span>Add New Machinery Category (Admin)</span>
                          <button
                            type="button"
                            onClick={() => setShowAddCategoryModal(false)}
                            className="text-amber-700 hover:text-amber-950 dark:hover:text-white p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Crane & Boom Truck, Drilling Rig, Mobile Pump"
                            value={newCustomCategoryName}
                            onChange={(e) => setNewCustomCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomMachineryCategory(e);
                              }
                            }}
                            className="flex-1 px-3 py-1.5 border border-amber-300 dark:border-amber-700 rounded-lg text-xs bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomMachineryCategory}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs shadow-2xs cursor-pointer active:scale-95"
                          >
                            Save Category
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {allMachineryCategories.map((cat) => {
                        const isCustom = customMachineryCategories.includes(cat);
                        const isSelected = itemCategory === cat;

                        return (
                          <div key={cat} className="inline-flex items-center">
                            <button
                              type="button"
                              onClick={() => setItemCategory(cat)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                  : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              <span>{cat}</span>
                              {isCustom && (
                                <span className="text-[9px] bg-amber-700/20 text-amber-900 dark:text-amber-300 px-1 rounded font-normal">custom</span>
                              )}
                            </button>
                            {isCustom && isCentralAdmin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCustomMachineryCategory(cat);
                                }}
                                className="ml-1 p-0.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded cursor-pointer transition-colors"
                                title={`Remove custom category "${cat}"`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      placeholder="Or specify custom category..."
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                      required
                    />
                  </div>
                ) : (
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all font-medium"
                  >
                    <option value="Electrical & Power">Electrical & Power</option>
                    <option value="Structural Steel">Structural Steel</option>
                    <option value="Civil & Concrete">Civil & Concrete</option>
                    <option value="Safety & PPE">Safety & PPE</option>
                    <option value="Hardware & Fasteners">Hardware & Fasteners</option>
                    <option value="Telecom & Signal">Telecom & Signal</option>
                    <option value="Equipment & Tools">Equipment & Tools</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit of Measure *</label>
                <select
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all font-medium"
                >
                  {itemClassification === 'Machinery' ? (
                    <>
                      {STANDARD_MACHINERY_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u} ({u === 'Nos' ? 'Numbers' : u === 'Pcs' ? 'Pieces' : u === 'Units' ? 'Equipment Units' : u})
                        </option>
                      ))}
                      <option value="custom">Other / Custom</option>
                    </>
                  ) : (
                    <>
                      <option value="pcs">pcs (Pieces)</option>
                      <option value="m">m (Meters)</option>
                      <option value="kg">kg (Kilograms)</option>
                      <option value="boxes">boxes (Boxes)</option>
                      <option value="bags">bags (Bags)</option>
                      <option value="sets">sets (Sets)</option>
                      <option value="coils">coils (Coils)</option>
                      <option value="drums">drums (Drums)</option>
                      <option value="pairs">pairs (Pairs)</option>
                      <option value="custom">Other / Custom</option>
                    </>
                  )}
                </select>
              </div>

              {itemUnit === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Specify Custom Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. liters, cartons, pallets"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Price ({config.currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Low Stock Alert Min</label>
                  <input
                    type="number"
                    min="1"
                    value={itemThreshold}
                    onChange={(e) => setItemThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl">
                <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-300 mb-1.5">
                  Initial Received Quantity (Auto-posted to Main Stock)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0 (Optional opening stock in Main Warehouse)"
                  value={initialReceivedQty}
                  onChange={(e) => setInitialReceivedQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClearItemForm}
                  className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Clear all item form fields"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Master Item</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Master Item Catalog (Read-Only)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 max-w-sm leading-relaxed">
              Site branch personnel can view items, units, and codes. Adding or modifying master item specifications is managed by <strong>Super Admin Central</strong>.
            </p>
            <div className="mt-4 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
              Role: <strong className="text-slate-800 dark:text-slate-200">{currentUser.fullName}</strong> ({currentUser.role})
            </div>
          </div>
        )}

        {/* Master Item List with Edit, Delete, Bulk Clear */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Active Master Catalog</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                {activeItems.length} active
              </span>
            </div>

            {/* Reservation Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setItemReservationFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  itemReservationFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({activeItems.length})
              </button>
              <button
                type="button"
                onClick={() => setItemReservationFilter('general')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  itemReservationFilter === 'general'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                📦 General ({activeItems.filter((i) => !i.isProjectReserved && (!i.reservedProjectId || i.reservedProjectId === 'none')).length})
              </button>
              <button
                type="button"
                onClick={() => setItemReservationFilter('reserved')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  itemReservationFilter === 'reserved'
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 font-bold shadow-2xs'
                    : 'text-amber-800/80 dark:text-amber-400/80 hover:text-amber-900'
                }`}
              >
                🎯 Reserved ({activeItems.filter((i) => i.isProjectReserved || (i.reservedProjectId && i.reservedProjectId !== 'none')).length})
              </button>
            </div>

            {isCentralAdmin && (
              <div className="flex items-center gap-2">
                {selectedItemIds.length > 0 && (
                  <button
                    onClick={handleBulkDeleteItems}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedItemIds.length})</span>
                  </button>
                )}
                {activeItems.length > 0 && (
                  <button
                    onClick={handleClearAllItems}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Move all active items to Recycle Bin"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            )}
          </div>

            <div className="overflow-x-auto flex-1 max-h-[500px]">
              <table className="w-full min-w-[720px] text-xs text-left table-fixed">
                <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 sticky top-0 backdrop-blur-xs">
                  <tr>
                    <th className="py-3 px-3 w-[5%]">
                      <input
                        type="checkbox"
                        checked={activeItems.length > 0 && selectedItemIds.length === activeItems.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedItemIds(activeItems.map((i) => i.id));
                          else setSelectedItemIds([]);
                        }}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3 w-[20%]">Item Code</th>
                    <th className="py-3 px-4 w-[32%]">Item Name</th>
                    <th className="py-3 px-3 w-[21%]">Category</th>
                    <th className="py-3 px-3 text-center w-[7%]">Unit</th>
                    <th className="py-3 px-3 text-right w-[9%]">Main Stock</th>
                    <th className="py-3 px-3 text-right w-[6%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {activeItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No active items in catalog. Register an item on the left.
                      </td>
                    </tr>
                  ) : (
                    activeItems
                      .filter((i) => {
                        if (itemReservationFilter === 'general') return !i.isProjectReserved && (!i.reservedProjectId || i.reservedProjectId === 'none');
                        if (itemReservationFilter === 'reserved') return i.isProjectReserved || (i.reservedProjectId && i.reservedProjectId !== 'none');
                        return true;
                      })
                      .map((i) => {
                      const mainStock = getMainWarehouseStock(i.id);
                      const isChecked = selectedItemIds.includes(i.id);

                      return (
                        <tr key={i.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isChecked ? 'bg-slate-50/80 dark:bg-slate-800/60' : ''}`}>
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setSelectedItemIds((prev) =>
                                  prev.includes(i.id) ? prev.filter((id) => id !== i.id) : [...prev, i.id]
                                )
                              }
                              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {i.itemCode}
                          </td>
                          <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-semibold whitespace-normal break-words" title={i.itemName}>
                            <div>{i.itemName}</div>
                            {i.isProjectReserved && (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800/80 px-2 py-0.5 rounded-md">
                                  <Target className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <span>Reserved: {i.reservedProjectName || i.reservedProjectId}</span>
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium whitespace-normal break-words">{i.category}</td>
                          <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">{i.unit}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-emerald-400">
                            {formatNumber(mainStock.availableBalance)}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {isCentralAdmin ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setEditingItem({ ...i })}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Edit Item"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(i)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Move to Recycle Bin (Soft Delete)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">Read-Only</span>
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
        </div>
      )}

      {/* TAB 2: ADD & MANAGE SITES */}
      {activeTab === 'sites' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Site Creation Form */}
          {isCentralAdmin ? (
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-emerald-400 flex items-center justify-center font-bold">
                    <Building className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">Register New Site Branch</h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">Location Setup</span>
              </div>

              <form onSubmit={handleCreateSite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Site Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. East River Transmission Depot"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Supervisor / Manager Name *</label>
                  <select
                    value={isCustomAddSupervisor ? '__custom__' : siteSupervisor}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        setIsCustomAddSupervisor(true);
                        setSiteSupervisor('');
                      } else {
                        setIsCustomAddSupervisor(false);
                        setSiteSupervisor(val);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all font-medium"
                    required={!isCustomAddSupervisor}
                  >
                    <option value="">-- Select Registered Supervisor / Manager --</option>
                    {activeUsers.map((u) => (
                      <option key={u.id} value={u.fullName}>
                        {u.fullName} ({u.role} - {u.username})
                      </option>
                    ))}
                    {siteSupervisor && !isCustomAddSupervisor && !activeUsers.some((u) => u.fullName.toLowerCase() === siteSupervisor.toLowerCase()) && (
                      <option value={siteSupervisor}>{siteSupervisor} (Custom)</option>
                    )}
                    <option value="__custom__">✍️ Enter Custom / Unregistered Supervisor Name...</option>
                  </select>

                  {isCustomAddSupervisor && (
                    <input
                      type="text"
                      placeholder="Type custom supervisor name..."
                      value={siteSupervisor}
                      onChange={(e) => setSiteSupervisor(e.target.value)}
                      className="w-full mt-2 px-3.5 py-2.5 border border-amber-300 dark:border-amber-700/60 rounded-xl text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-none bg-amber-50/50 dark:bg-amber-950/30 dark:text-white"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Location / Details *</label>
                  <input
                    type="text"
                    placeholder="Highway mile marker, grid address, or depot code"
                    value={siteLocation}
                    onChange={(e) => setSiteLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={sitePhone}
                    onChange={(e) => setSitePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClearSiteForm}
                    className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Clear all site form fields"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register Site Branch</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Site Branch Setup (Read-Only)</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 max-w-sm leading-relaxed">
                Branch creation, supervisor assignment, and location configurations are managed exclusively by <strong>Super Admin Central</strong>.
              </p>
              <div className="mt-4 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                Logged in as: <strong className="text-slate-800 dark:text-slate-200">{currentUser.fullName}</strong> ({currentUser.role})
              </div>
            </div>
          )}

          {/* Sites Grid with Edit & Delete */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">Current Operational Sites</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {activeSites.length}
                </span>
              </div>
              {isCentralAdmin && (
                <div className="flex items-center gap-2">
                  {selectedSiteIds.length > 0 && (
                    <button
                      onClick={handleBulkDeleteSites}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Selected ({selectedSiteIds.length})</span>
                    </button>
                  )}
                  {activeSites.filter((s) => !s.isMainWarehouse).length > 0 && (
                    <button
                      onClick={handleClearAllSites}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Move branch sites to Recycle Bin"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear All Sites</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeSites.map((s) => {
                const assignedTeams = activeTeams.filter((t) => t.assignedSiteId === s.id);
                const isChecked = selectedSiteIds.includes(s.id);

                return (
                  <div
                    key={s.id}
                    className={`rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between group ${
                      s.isMainWarehouse
                        ? 'border-emerald-500/40 dark:border-emerald-500/50 bg-gradient-to-br from-emerald-50/50 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 ring-1 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {!s.isMainWarehouse && (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setSelectedSiteIds((prev) =>
                                  prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                                )
                              }
                              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                            />
                          )}
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${
                              s.isMainWarehouse
                                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {s.isMainWarehouse && <Warehouse className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                            {s.isMainWarehouse ? 'Central HQ Warehouse' : 'Site Branch'}
                          </span>
                        </div>

                        {/* Edit & Delete Controls */}
                        {isCentralAdmin && (
                          <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setIsCustomEditSupervisor(false);
                                setEditingSite({ ...s });
                              }}
                              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit Site Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!s.isMainWarehouse && (
                              <button
                                onClick={() => handleDeleteSite(s)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Move to Recycle Bin"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base mt-1.5 tracking-tight">{s.name}</h3>

                      <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{s.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="font-mono">{s.contactNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>Supervisor: <strong className="text-slate-900 dark:text-slate-200">{s.supervisorName}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Assigned Crews: <strong className="font-mono text-slate-900 dark:text-white font-bold">{assignedTeams.length}</strong></span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Status
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ADD & MANAGE USERS */}
      {activeTab === 'users' && (
        !isCentralAdmin ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm text-center max-w-lg mx-auto my-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">User & Role Management Restricted</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Adding new user accounts, modifying credentials, and configuring permissions is restricted to <strong>Super Admin Central</strong>.
            </p>
            <div className="mt-4 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 inline-block">
              Logged in as: <strong className="text-slate-800 dark:text-slate-200">{currentUser.fullName}</strong> ({currentUser.role})
            </div>
          </div>
        ) : (
        <div className="space-y-6">
          {/* Company Staff Direct Login Link Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 text-white rounded-2xl p-6 border border-emerald-600/40 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <span>Company Staff Direct Login Link</span>
                    <span className="text-[10px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full">
                      Workspace: {currentTenant.slug}
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Provide this direct URL to company staff members for logging in directly into the <strong>{currentTenant.companyName}</strong> workspace.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const loginUrl = getWorkspaceLoginUrl(currentTenant.slug);
                    navigator.clipboard.writeText(loginUrl);
                    showToast(`Company login link copied to clipboard! Share this URL with your staff.`);
                  }}
                  className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition cursor-pointer active:scale-95"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Direct Login URL</span>
                </button>
              </div>
            </div>

            {/* Link Preview box */}
            <div className="mt-4 p-3 bg-black/50 rounded-xl border border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-emerald-200">
              <span className="truncate">{getWorkspaceLoginUrl(currentTenant.slug)}</span>
              <span className="text-[10px] text-slate-400 font-sans shrink-0">
                Workspace Code: <strong className="text-amber-300 font-mono">{currentTenant.slug}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* User Form */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-emerald-400 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">Register New User Account</h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">Access Control</span>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Username *</label>
                <input
                  type="text"
                  placeholder="e.g. jason.site, mark.admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Jason Miller"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Site Base</label>
                <select
                  value={userSiteId}
                  onChange={(e) => setUserSiteId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all font-medium"
                >
                  <option value="all">All Sites / Central Warehouse HQ</option>
                  {activeSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">User Role *</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all font-medium"
                >
                  <option value="Super Admin Central">1. Super Admin Central (Full System & HQ Control)</option>
                  <option value="All Site Branch Admin">2. All Site Branch Admin (All Branch Supervision)</option>
                  <option value="Branch Admin">3. Branch Admin (Branch Inbound, Outbound & Teams)</option>
                  <option value="Branch System User">4. Branch System User (Standard Site Operations)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClearUserForm}
                  className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Clear all user form fields"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create User Account</span>
                </button>
              </div>
            </form>
          </div>

          {/* User Table with Edit & Delete */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">System Users</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {activeUsers.length} accounts
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedUserIds.length > 0 && (
                  <button
                    onClick={handleBulkDeleteUsers}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedUserIds.length})</span>
                  </button>
                )}
                {activeUsers.filter((u) => u.id !== currentUser.id && !isSuperAdmin(u.role)).length > 0 && (
                  <button
                    onClick={handleClearAllUsers}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Move non-admin users to Recycle Bin"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Users</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={activeUsers.length > 0 && selectedUserIds.length === activeUsers.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedUserIds(activeUsers.map((u) => u.id));
                          else setSelectedUserIds([]);
                        }}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3">Username</th>
                    <th className="py-3 px-3">Full Name</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {activeUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No active users registered. Fill out the form on the left to add a user account.
                      </td>
                    </tr>
                  ) : (
                    activeUsers.map((u) => {
                    const s = activeSites.find((site) => site.id === u.siteId);
                    const isChecked = selectedUserIds.includes(u.id);

                    const norm = normalizeRole(u.role);
                    const badgeStyles = {
                      'Super Admin Central': 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
                      'All Site Branch Admin': 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
                      'Branch Admin': 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
                      'Branch System User': 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                    }[norm] || 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                    return (
                      <tr key={u.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isChecked ? 'bg-slate-50/80 dark:bg-slate-800/60' : ''}`}>
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setSelectedUserIds((prev) =>
                                prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                              )
                            }
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">@{u.username}</td>
                        <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-semibold">
                          {u.fullName}
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{u.siteId === 'all' ? 'All Sites / Central HQ' : s?.name}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${badgeStyles}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setCurrentUser(u);
                                showToast(`Switched active session to: ${u.fullName}`);
                              }}
                              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                            >
                              Switch
                            </button>
                            <button
                              onClick={() => setEditingUser({ ...u })}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit User Role"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
        )
      )}

      {/* TAB 4: ADD & MANAGE TEAMS */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Team Creation Form */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-emerald-400 flex items-center justify-center font-bold">
                  <Users2 className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">Register Field Work Team</h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">Crew Roster</span>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Team Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Echo High-Tension Stringing Squad"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Team Leader Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Connor"
                    value={teamLeaderName}
                    onChange={(e) => setTeamLeaderName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Leader NIC / Worker ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 198845123V / EMP-010"
                    value={teamLeaderIdNumber}
                    onChange={(e) => setTeamLeaderIdNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Site Base *</label>
                <select
                  value={assignedSiteId}
                  onChange={(e) => setAssignedSiteId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all font-medium"
                >
                  {activeSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Team Members Roster with Individual Names and ID Numbers */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/80 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Users2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Team Members & ID Roster ({teamMembers.length})</span>
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Add names & ID numbers</span>
                </div>

                {/* Input row for adding a member */}
                <div className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Member Full Name *"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:bg-slate-800 dark:text-white focus:outline-none focus:border-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="ID / NIC Number *"
                      value={newMemberIdNumber}
                      onChange={(e) => setNewMemberIdNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono uppercase dark:bg-slate-800 dark:text-white focus:outline-none focus:border-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Role / Skill (e.g. Technician)"
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:bg-slate-800 dark:text-white focus:outline-none focus:border-slate-800"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Phone (Optional)"
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:bg-slate-800 dark:text-white focus:outline-none focus:border-slate-800"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={handleAddTeamMember}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Added members list */}
                {teamMembers.length > 0 ? (
                  <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1.5">
                    {teamMembers.map((m, idx) => (
                      <div key={m.id} className="flex items-center justify-between px-2.5 py-1.5 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 w-4">{idx + 1}.</span>
                          <div className="truncate">
                            <span className="font-semibold text-slate-900 dark:text-slate-200">{m.name}</span>
                            <span className="ml-2 font-mono text-[10px] text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                              {m.idNumber}
                            </span>
                            {m.role && <span className="ml-1 text-[10px] text-slate-500">({m.role})</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTeamMember(m.id)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 cursor-pointer"
                          title="Remove member"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic text-center py-1">
                    No members added yet. Add individual team member names & ID numbers above.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Crew Size ({teamMembers.length > 0 ? 'Auto-Calculated' : 'Persons'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={teamMembers.length > 0 ? teamMembers.length + 1 : crewSize}
                    onChange={(e) => setCrewSize(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={teamMembers.length > 0}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all disabled:opacity-60"
                  />
                  {teamMembers.length > 0 && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">1 Leader + {teamMembers.length} Members</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 789-0000"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClearTeamForm}
                  className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Clear all team form fields"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Field Team</span>
                </button>
              </div>
            </form>
          </div>

          {/* Teams Cards List with Edit & Delete */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">Active Field Crews</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {activeTeams.length} teams
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedTeamIds.length > 0 && (
                  <button
                    onClick={handleBulkDeleteTeams}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedTeamIds.length})</span>
                  </button>
                )}
                {activeTeams.length > 0 && (
                  <button
                    onClick={handleClearAllTeams}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Move all field teams to Recycle Bin"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All Teams</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeTeams.map((t) => {
                const s = activeSites.find((site) => site.id === t.assignedSiteId);
                const isChecked = selectedTeamIds.includes(t.id);
                const hasMembers = t.members && t.members.length > 0;

                return (
                  <div key={t.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setSelectedTeamIds((prev) =>
                                prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                              )
                            }
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                          />
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">{t.teamName}</h3>
                        </div>

                        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingTeam({ ...t })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Team"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeam(t)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-between">
                        <span>Base: {s?.name}</span>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                          {t.crewSize} Persons
                        </span>
                      </div>

                      <div className="mt-3.5 space-y-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <div>
                          <span className="text-slate-500">Leader: </span>
                          <strong className="text-slate-900 dark:text-white">{t.teamLeaderName}</strong>
                          {t.teamLeaderIdNumber && (
                            <span className="ml-2 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold border border-slate-200 dark:border-slate-700">
                              NIC: {t.teamLeaderIdNumber}
                            </span>
                          )}
                        </div>

                        {hasMembers ? (
                          <div className="text-[11px] bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                            <div className="font-bold text-slate-700 dark:text-slate-300 text-[10px] uppercase tracking-wider flex items-center justify-between">
                              <span>Registered Members ({t.members!.length})</span>
                            </div>
                            <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
                              {t.members!.slice(0, 3).map((m) => (
                                <div key={m.id} className="flex items-center justify-between text-[10px]">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{m.name}</span>
                                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold ml-1">{m.idNumber}</span>
                                </div>
                              ))}
                              {t.members!.length > 3 && (
                                <div className="text-[10px] text-slate-500 italic pt-0.5">
                                  +{t.members!.length - 3} more members...
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">
                            No member ID details logged. Edit team to add roster.
                          </div>
                        )}

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                          Phone: <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{t.contactPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">Edit Registered Item</h3>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Item Code</label>
                <input
                  type="text"
                  value={editingItem.itemCode}
                  onChange={(e) => setEditingItem({ ...editingItem, itemCode: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Item Name</label>
                <input
                  type="text"
                  value={editingItem.itemName}
                  onChange={(e) => setEditingItem({ ...editingItem, itemName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Price ({config.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.unitPrice}
                    onChange={(e) => setEditingItem({ ...editingItem, unitPrice: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reorder / Low Stock Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.lowStockThreshold}
                    onChange={(e) => setEditingItem({ ...editingItem, lowStockThreshold: Number(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  🎯 Project Reservation Status
                </label>
                {!editingItem.reservedProjectId ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">📦 Unrestricted General Stock (Available to All)</span>
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, reservedProjectId: '' })}
                        className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        🔍 Search & Assign Project...
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(() => {
                      const selProj = activeProjects.find((p) => p.id === editingItem.reservedProjectId);
                      return (
                        <div className="flex items-center justify-between p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-300 dark:border-amber-700 text-xs">
                          <span className="font-bold text-amber-950 dark:text-amber-200 truncate">
                            🎯 Reserved: {selProj?.projectName || editingItem.reservedProjectName || editingItem.reservedProjectId}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingItem({
                                ...editingItem,
                                reservedProjectId: undefined,
                                reservedProjectName: undefined,
                                isProjectReserved: false,
                              })
                            }
                            className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer shrink-0 ml-2"
                          >
                            Clear / General
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {editingItem.reservedProjectId === '' && (
                  <div className="space-y-1.5 pt-2 animate-in fade-in">
                    <input
                      type="text"
                      placeholder="Type project name, ID, or customer to search..."
                      value={editProjectSearchQuery}
                      onChange={(e) => setEditProjectSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-xl text-xs bg-white dark:bg-slate-900 dark:text-white focus:outline-none font-medium"
                      autoFocus
                    />
                    <div className="max-h-36 overflow-y-auto space-y-1 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem({
                            ...editingItem,
                            reservedProjectId: undefined,
                            reservedProjectName: undefined,
                            isProjectReserved: false,
                          });
                          setEditProjectSearchQuery('');
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        📦 Unrestricted General Stock
                      </button>
                      {activeProjects
                        .filter((p) => {
                          const q = editProjectSearchQuery.toLowerCase();
                          return !q || p.projectName.toLowerCase().includes(q) || p.projectId.toLowerCase().includes(q) || (p.customerName || '').toLowerCase().includes(q);
                        })
                        .map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setEditingItem({
                                ...editingItem,
                                reservedProjectId: p.id,
                                reservedProjectName: p.projectName || p.projectId,
                                isProjectReserved: true,
                              });
                              setEditProjectSearchQuery('');
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-lg text-xs font-medium text-slate-900 dark:text-white flex items-center justify-between"
                          >
                            <span className="truncate pr-2">🎯 {p.projectName}</span>
                            <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-bold shrink-0">{p.projectId}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: ADD & MANAGE CLIENTS / PRINCIPALS */}
      {activeTab === 'clients' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Client Creation Form */}
          {isCentralAdmin ? (
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-emerald-400 flex items-center justify-center font-bold">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">Register Master Client / Principal</h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">HQ Registry</span>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Client Code</label>
                    <input
                      type="text"
                      value={clientCodeInput}
                      onChange={(e) => setClientCodeInput(e.target.value)}
                      placeholder={`Auto e.g. CLT-${String(clients.length + 1).padStart(3, '0')}`}
                      className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Industry Category *</label>
                      {isCentralAdmin && (
                        <button
                          type="button"
                          onClick={() => setShowAddClientCategoryModal(!showAddClientCategoryModal)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>+ Add Category</span>
                        </button>
                      )}
                    </div>

                    {/* Add Custom Category Inline Sub-Form */}
                    {isCentralAdmin && showAddClientCategoryModal && (
                      <div className="mb-2 p-2.5 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
                          <span>Add New Industry Category (Admin)</span>
                          <button
                            type="button"
                            onClick={() => setShowAddClientCategoryModal(false)}
                            className="text-emerald-700 hover:text-emerald-950 dark:hover:text-white p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="e.g. Solar & Renewable Energy, Data Center"
                            value={newCustomClientCategoryName}
                            onChange={(e) => setNewCustomClientCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomClientCategory(e);
                              }
                            }}
                            className="flex-1 px-2.5 py-1.5 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomClientCategory}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-2xs cursor-pointer active:scale-95"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}

                    <select
                      value={clientCategoryInput}
                      onChange={(e) => setClientCategoryInput(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {allClientCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat} {customClientCategories.includes(cat) ? '(Custom)' : ''}
                        </option>
                      ))}
                    </select>

                    {/* Manage Custom Category Tags */}
                    {customClientCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {customClientCategories.map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          >
                            <span>{cat}</span>
                            {isCentralAdmin && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomClientCategory(cat)}
                                className="text-emerald-500 hover:text-rose-600 cursor-pointer ml-0.5"
                                title={`Delete custom category "${cat}"`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Client / Principal Name *</label>
                  <input
                    type="text"
                    required
                    value={clientNameInput}
                    onChange={(e) => setClientNameInput(e.target.value)}
                    placeholder="e.g. National Telecom Infrastructure Operator"
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary Contact Person</label>
                    <input
                      type="text"
                      value={clientContactPersonInput}
                      onChange={(e) => setClientContactPersonInput(e.target.value)}
                      placeholder="e.g. John Smith (Project Lead)"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tax / Reg Number</label>
                    <input
                      type="text"
                      value={clientTaxNoInput}
                      onChange={(e) => setClientTaxNoInput(e.target.value)}
                      placeholder="e.g. TAX-99201-X"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={clientPhoneInput}
                      onChange={(e) => setClientPhoneInput(e.target.value)}
                      placeholder="e.g. +1 555 019 2831"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={clientEmailInput}
                      onChange={(e) => setClientEmailInput(e.target.value)}
                      placeholder="e.g. projects@clientcorp.com"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Office Address</label>
                  <input
                    type="text"
                    value={clientAddressInput}
                    onChange={(e) => setClientAddressInput(e.target.value)}
                    placeholder="Head office address"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes / Terms</label>
                  <textarea
                    rows={2}
                    value={clientNotesInput}
                    onChange={(e) => setClientNotesInput(e.target.value)}
                    placeholder="Specific FOC material dispatch guidelines or contract terms..."
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Master Client</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-5 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900">
              <Shield className="w-6 h-6 text-amber-600 mb-2" />
              <h3 className="font-bold text-sm">Central Admin Required</h3>
              <p className="mt-1">Only Central Super Admins can register new Master Clients to the system.</p>
            </div>
          )}

          {/* Directory & Table */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Registered Clients & Principals</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold">
                    {activeClients.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Master client directory for FOC material dispatches and project assignments</p>
              </div>

              {selectedClientIds.length > 0 && isCentralAdmin && (
                <button
                  onClick={handleBulkDeleteClients}
                  className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedClientIds.length})</span>
                </button>
              )}
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search client code, name, contact..."
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Client List */}
            {activeClients.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                <Handshake className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-300">No Master Clients Registered Yet</p>
                <p className="mt-1">Fill out the form on the left to add your first Client / Project Principal.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {activeClients
                  .filter((c) => {
                    const q = clientSearchQuery.toLowerCase();
                    return (
                      !q ||
                      c.clientCode.toLowerCase().includes(q) ||
                      c.name.toLowerCase().includes(q) ||
                      (c.contactPerson || '').toLowerCase().includes(q) ||
                      (c.category || '').toLowerCase().includes(q)
                    );
                  })
                  .map((c) => (
                    <div
                      key={c.id}
                      className="p-4 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-emerald-400">
                            {c.clientCode}
                          </span>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {c.name}
                          </h4>
                          {c.category && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                              {c.category}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                          {c.contactPerson && (
                            <span>Contact: <strong className="text-slate-800 dark:text-slate-200">{c.contactPerson}</strong></span>
                          )}
                          {c.phone && <span>Tel: {c.phone}</span>}
                          {c.email && <span>Email: {c.email}</span>}
                          {c.taxRegistrationNo && <span>Tax #: {c.taxRegistrationNo}</span>}
                        </div>

                        {c.address && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Address: {c.address}
                          </div>
                        )}
                      </div>

                      {isCentralAdmin && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setEditingClient(c)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                            title="Edit Client"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClientSingle(c)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                            title="Delete Client"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT SITE MODAL */}
      {editingSite && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">Edit Site Branch</h3>
              </div>
              <button onClick={() => setEditingSite(null)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSiteEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Site Name</label>
                <input
                  type="text"
                  value={editingSite.name}
                  onChange={(e) => setEditingSite({ ...editingSite, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Supervisor / Manager *</label>
                <select
                  value={isCustomEditSupervisor ? '__custom__' : editingSite.supervisorName}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__custom__') {
                      setIsCustomEditSupervisor(true);
                    } else {
                      setIsCustomEditSupervisor(false);
                      setEditingSite({ ...editingSite, supervisorName: val });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all font-medium"
                  required={!isCustomEditSupervisor}
                >
                  <option value="">-- Select Registered Supervisor / Manager --</option>
                  {activeUsers.map((u) => (
                    <option key={u.id} value={u.fullName}>
                      {u.fullName} ({u.role} - {u.username})
                    </option>
                  ))}
                  {editingSite.supervisorName &&
                    !isCustomEditSupervisor &&
                    !activeUsers.some((u) => u.fullName.toLowerCase() === editingSite.supervisorName.toLowerCase()) && (
                      <option value={editingSite.supervisorName}>
                        {editingSite.supervisorName} (Current Supervisor)
                      </option>
                    )}
                  <option value="__custom__">✍️ Enter Custom / Unregistered Supervisor Name...</option>
                </select>

                {isCustomEditSupervisor && (
                  <input
                    type="text"
                    placeholder="Type custom supervisor name..."
                    value={editingSite.supervisorName}
                    onChange={(e) => setEditingSite({ ...editingSite, supervisorName: e.target.value })}
                    className="w-full mt-2 px-3.5 py-2.5 border border-amber-300 dark:border-amber-700/60 rounded-xl text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-none bg-amber-50/50 dark:bg-amber-950/30 dark:text-white"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Location Details</label>
                <input
                  type="text"
                  value={editingSite.location}
                  onChange={(e) => setEditingSite({ ...editingSite, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editingSite.contactNumber}
                  onChange={(e) => setEditingSite({ ...editingSite, contactNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSite(null)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Save Site Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">Edit User Account & Role</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">User Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all font-medium"
                >
                  <option value="Super Admin Central">1. Super Admin Central (Full System & HQ Control)</option>
                  <option value="All Site Branch Admin">2. All Site Branch Admin (All Branch Supervision)</option>
                  <option value="Branch Admin">3. Branch Admin (Branch Inbound, Outbound & Teams)</option>
                  <option value="Branch System User">4. Branch System User (Standard Site Operations)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Site Base</label>
                <select
                  value={editingUser.siteId}
                  onChange={(e) => setEditingUser({ ...editingUser, siteId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all font-medium"
                >
                  <option value="all">All Sites / Central Warehouse HQ</option>
                  {activeSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input
                  type="text"
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Save User Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">Edit Field Team</h3>
              </div>
              <button onClick={() => setEditingTeam(null)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeamEdit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Team Name</label>
                <input
                  type="text"
                  value={editingTeam.teamName}
                  onChange={(e) => setEditingTeam({ ...editingTeam, teamName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Team Leader Name</label>
                  <input
                    type="text"
                    value={editingTeam.teamLeaderName}
                    onChange={(e) => setEditingTeam({ ...editingTeam, teamLeaderName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Leader NIC / Worker ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 198845123V / EMP-010"
                    value={editingTeam.teamLeaderIdNumber || ''}
                    onChange={(e) => setEditingTeam({ ...editingTeam, teamLeaderIdNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Site Base</label>
                <select
                  value={editingTeam.assignedSiteId}
                  onChange={(e) => setEditingTeam({ ...editingTeam, assignedSiteId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all font-medium"
                >
                  {activeSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Edit Team Members Roster */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/80 dark:bg-slate-800/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Users2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Team Members Roster ({editingTeam.members?.length || 0})</span>
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Names & ID / NIC numbers</span>
                </div>

                {/* Add member row */}
                <div className="space-y-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Member Name"
                      value={editMemberName}
                      onChange={(e) => setEditMemberName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:bg-slate-800 dark:text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="ID / NIC No."
                      value={editMemberIdNumber}
                      onChange={(e) => setEditMemberIdNumber(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono uppercase dark:bg-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-8">
                      <input
                        type="text"
                        placeholder="Role / Skill (e.g. Technician)"
                        value={editMemberRole}
                        onChange={(e) => setEditMemberRole(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:bg-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <button
                        type="button"
                        onClick={handleAddEditTeamMember}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Member</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Existing members */}
                {editingTeam.members && editingTeam.members.length > 0 ? (
                  <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1.5">
                    {editingTeam.members.map((m, idx) => (
                      <div key={m.id} className="flex items-center justify-between px-2.5 py-1.5 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 w-4">{idx + 1}.</span>
                          <div className="truncate">
                            <span className="font-semibold text-slate-900 dark:text-slate-200">{m.name}</span>
                            <span className="ml-2 font-mono text-[10px] text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                              {m.idNumber}
                            </span>
                            {m.role && <span className="ml-1 text-[10px] text-slate-500">({m.role})</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEditTeamMember(m.id)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 cursor-pointer"
                          title="Remove member"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic text-center py-1">
                    No members roster added yet.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Crew Size (Persons)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingTeam.crewSize}
                    onChange={(e) => setEditingTeam({ ...editingTeam, crewSize: Number(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editingTeam.contactPhone}
                    onChange={(e) => setEditingTeam({ ...editingTeam, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Save Team Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLIENT MODAL */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">Edit Client / Principal</h3>
              </div>
              <button onClick={() => setEditingClient(null)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateClientSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Client Code</label>
                  <input
                    type="text"
                    value={editingClient.clientCode}
                    disabled
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Industry Category / Sector</label>
                  <select
                    value={editingClient.category || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all font-medium"
                  >
                    <option value="">General Sector</option>
                    {allClientCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Client / Principal Name *</label>
                <input
                  type="text"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={editingClient.contactPerson || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, contactPerson: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editingClient.phone || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingClient.email || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tax / Reg No.</label>
                  <input
                    type="text"
                    value={editingClient.taxRegistrationNo || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, taxRegistrationNo: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={editingClient.address || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editingClient.notes || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Save Client Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Reusable in-app confirmation modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={confirmState.onConfirm}
        onClose={closeConfirm}
      />
    </div>
  );
};
