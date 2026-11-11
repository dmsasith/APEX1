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
import {
  UserRole,
  Item,
  Site,
  User as UserType,
  Team,
  TeamMember,
  Client,
  isSuperAdmin,
  isCentralOrAllSiteAdmin,
  normalizeRole,
  isUserAllSites,
  getUserAssignedSiteIds,
  getUserSupervisedSites,
  isUserAssignedToSite,
} from '../../types';
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
    clientFreeIssues,
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
  const [editingSiteUserIds, setEditingSiteUserIds] = useState<string[]>([]);
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
  const [siteSupervisorUserId, setSiteSupervisorUserId] = useState('');
  const [newSiteAssignedUserIds, setNewSiteAssignedUserIds] = useState<string[]>([]);
  const [isCustomAddSupervisor, setIsCustomAddSupervisor] = useState(false);
  const [isCustomEditSupervisor, setIsCustomEditSupervisor] = useState(false);
  const [siteLocation, setSiteLocation] = useState('');
  const [sitePhone, setSitePhone] = useState('');

  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) return;

    addSite(
      {
        name: siteName.trim(),
        supervisorName: siteSupervisor.trim() || 'Assigned Supervisor',
        supervisorUserId: isCustomAddSupervisor ? '' : siteSupervisorUserId,
        location: siteLocation.trim() || 'On-site details pending',
        contactNumber: sitePhone.trim() || '+1 (555) 000-0000',
        isMainWarehouse: false,
      },
      newSiteAssignedUserIds
    );

    showToast(`Site Branch "${siteName}" added & synced with assigned user account(s)!`);
    setSiteName('');
    setSiteSupervisor('');
    setSiteSupervisorUserId('');
    setNewSiteAssignedUserIds([]);
    setIsCustomAddSupervisor(false);
    setSiteLocation('');
    setSitePhone('');
  };

  // --- USER FORM STATE (Supports All Sites, Single Site, or Multiple Sites) ---
  const defaultInitialBranchId =
    activeSites.find((s) => !s.isMainWarehouse)?.id || activeSites[0]?.id || '';
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [userSiteScope, setUserSiteScope] = useState<'all' | 'specific'>('specific');
  const [userSelectedSiteIds, setUserSelectedSiteIds] = useState<string[]>(
    defaultInitialBranchId ? [defaultInitialBranchId] : []
  );
  const [userRole, setUserRole] = useState<UserRole>('Branch Admin');
  const [password, setPassword] = useState('pass123');
  const [showPassword, setShowPassword] = useState(false);

  const toggleCreateUserSite = (targetSiteId: string) => {
    setUserSelectedSiteIds((prev) =>
      prev.includes(targetSiteId)
        ? prev.filter((id) => id !== targetSiteId)
        : [...prev, targetSiteId]
    );
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim() || !password.trim()) return;

    const normalizedUsername = username.trim().toLowerCase();
    if (activeUsers.some((u) => u.username.toLowerCase() === normalizedUsername)) {
      showToast(`Username "${normalizedUsername}" is already registered. Please use another.`);
      return;
    }

    const isAllSitesSelected = userSiteScope === 'all' || isSuperAdmin(userRole);
    if (!isAllSitesSelected && userSelectedSiteIds.length === 0) {
      showToast('Please select at least one site branch or switch to "All Sites / Central HQ".');
      return;
    }

    const finalSiteIds = isAllSitesSelected ? ['all'] : userSelectedSiteIds;
    const finalPrimarySiteId = isAllSitesSelected ? 'all' : (userSelectedSiteIds[0] || 'unassigned');

    addUser({
      username: normalizedUsername,
      fullName: fullName.trim(),
      siteId: finalPrimarySiteId,
      siteIds: finalSiteIds,
      role: userRole,
      password: password.trim(),
    });

    const countMsg = isAllSitesSelected
      ? 'All Sites / Central HQ'
      : `${userSelectedSiteIds.length} assigned site(s)`;
    showToast(`User "${normalizedUsername}" created (${countMsg})!`);
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
    setSiteSupervisorUserId('');
    setNewSiteAssignedUserIds([]);
    setIsCustomAddSupervisor(false);
    setSiteLocation('');
    setSitePhone('');
  };

  const handleClearUserForm = () => {
    const firstBranch = activeSites.find((s) => !s.isMainWarehouse)?.id || activeSites[0]?.id || '';
    setUsername('');
    setFullName('');
    setUserSiteScope('specific');
    setUserSelectedSiteIds(firstBranch ? [firstBranch] : []);
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
    updateSite(editingSite.id, editingSite, editingSiteUserIds);
    showToast(`Site Branch "${editingSite.name}" & assigned staff synchronized.`);
    setEditingSite(null);
    setEditingSiteUserIds([]);
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUser(editingUser.id, editingUser);
    showToast(`User "${editingUser.fullName}" settings & site assignments synchronized.`);
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
              <span>Client Register ({activeClients.length})</span>
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
                          <span>Add Machinery Category</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Site Creation Form */}
          {isCentralAdmin ? (
            <div className="lg:col-span-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-white/90 dark:border-slate-800 ring-1 ring-slate-900/[0.06] p-6 shadow-[0_12px_34px_-12px_rgba(15,23,42,0.12)] transition-all">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-emerald-600 dark:to-teal-700 text-emerald-400 dark:text-white flex items-center justify-center shadow-md shadow-slate-900/15 shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Branch & Depot Registry
                    </div>
                    <h2 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                      Register New Site Branch
                    </h2>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Location Setup
                </span>
              </div>

              <form onSubmit={handleCreateSite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Site Branch Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Matale Regional Depot, Kandy Operations Yard"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-2xl text-xs font-medium bg-slate-50/70 dark:bg-slate-800/60 dark:text-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Supervisor / Branch Manager *
                  </label>
                  <select
                    value={isCustomAddSupervisor ? '__custom__' : siteSupervisor}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        const prevSupId = siteSupervisorUserId;
                        setIsCustomAddSupervisor(true);
                        setSiteSupervisor('');
                        setSiteSupervisorUserId('');
                        if (prevSupId) {
                          setNewSiteAssignedUserIds((prev) => prev.filter((id) => id !== prevSupId));
                        }
                      } else {
                        const prevSupId = siteSupervisorUserId;
                        setIsCustomAddSupervisor(false);
                        setSiteSupervisor(val);
                        const matchedUser = activeUsers.find(
                          (u) => u.fullName.trim().toLowerCase() === val.trim().toLowerCase()
                        );
                        setSiteSupervisorUserId(matchedUser?.id || '');
                        setNewSiteAssignedUserIds((prev) => {
                          const withoutPrev = prevSupId ? prev.filter((id) => id !== prevSupId) : prev;
                          if (matchedUser && !isUserAllSites(matchedUser)) {
                            return Array.from(new Set([...withoutPrev, matchedUser.id]));
                          }
                          return withoutPrev;
                        });
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-2xl text-xs bg-slate-50/70 dark:bg-slate-800/60 dark:text-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 focus:outline-none transition-all font-medium"
                    required={!isCustomAddSupervisor}
                  >
                    <option value="">-- Select Registered Supervisor / Manager --</option>
                    {activeUsers.map((u) => {
                      const curSiteCount = isUserAllSites(u)
                        ? 'All Sites'
                        : `${getUserAssignedSiteIds(u, activeSites).length} site(s)`;
                      return (
                        <option key={u.id} value={u.fullName}>
                          {u.fullName} (@{u.username} · {curSiteCount})
                        </option>
                      );
                    })}
                    {siteSupervisor && !isCustomAddSupervisor && !activeUsers.some((u) => u.fullName.toLowerCase() === siteSupervisor.toLowerCase()) && (
                      <option value={siteSupervisor}>{siteSupervisor} (Custom)</option>
                    )}
                    <option value="__custom__">Enter Custom / Unregistered Supervisor Name...</option>
                  </select>

                  {isCustomAddSupervisor && (
                    <input
                      type="text"
                      placeholder="Type custom supervisor full name..."
                      value={siteSupervisor}
                      onChange={(e) => setSiteSupervisor(e.target.value)}
                      className="w-full mt-2 px-4 py-2.5 border border-amber-300 dark:border-amber-700/60 rounded-2xl text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-none bg-amber-50/60 dark:bg-amber-950/30 dark:text-white font-medium"
                      required
                    />
                  )}

                  {!isCustomAddSupervisor && siteSupervisorUserId && (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1.5 font-medium">
                      This site will be automatically linked to {siteSupervisor}&apos;s user account settings.
                    </p>
                  )}
                </div>

                {/* Additional Branch Users Multi-Assign on Site Creation */}
                {activeUsers.some((u) => !isUserAllSites(u)) && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Assign Branch System Users
                      </label>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {newSiteAssignedUserIds.length} selected
                      </span>
                    </div>
                    <div className="max-h-36 overflow-y-auto rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 divide-y divide-slate-200/60 dark:divide-slate-700/60">
                      {activeUsers
                        .filter((u) => !isUserAllSites(u))
                        .map((u) => {
                          const checked = newSiteAssignedUserIds.includes(u.id);
                          const isSelectedSup = !isCustomAddSupervisor && siteSupervisorUserId === u.id;
                          const existingCount = getUserAssignedSiteIds(u, activeSites).length;
                          return (
                            <label
                              key={u.id}
                              className={`flex items-center justify-between gap-2 px-3.5 py-2 text-xs cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                                  : 'hover:bg-white/80 dark:hover:bg-slate-800/70'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={checked || isSelectedSup}
                                  disabled={isSelectedSup}
                                  onChange={() => {
                                    setNewSiteAssignedUserIds((prev) =>
                                      prev.includes(u.id)
                                        ? prev.filter((id) => id !== u.id)
                                        : [...prev, u.id]
                                    );
                                  }}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-white break-words leading-snug">
                                    {u.fullName}
                                    {isSelectedSup && (
                                      <span className="ml-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                        · Supervisor
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 break-words leading-snug mt-0.5">
                                    @{u.username} · {u.role} · Currently {existingCount} site(s)
                                  </div>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Geographic Location / Address *
                  </label>
                  <input
                    type="text"
                    placeholder="Town, district, grid address, or depot code"
                    value={siteLocation}
                    onChange={(e) => setSiteLocation(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-2xl text-xs font-medium bg-slate-50/70 dark:bg-slate-800/60 dark:text-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Branch Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="+94 77 123 4567"
                    value={sitePhone}
                    onChange={(e) => setSitePhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-2xl text-xs font-mono tabular-nums bg-slate-50/70 dark:bg-slate-800/60 dark:text-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 focus:outline-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleClearSiteForm}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    title="Clear all site form fields"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-900/15 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register Site Branch</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center justify-center text-center">
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

          {/* Sites Grid with High-Craft Liquid Glass Cards */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/85 dark:border-slate-800 ring-1 ring-slate-900/[0.05] shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-5 rounded-full bg-emerald-500" />
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                  Current Operational Sites
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums font-bold">
                  · {activeSites.length} Registered
                </span>
              </div>
              {isCentralAdmin && (
                <div className="flex items-center gap-2">
                  {selectedSiteIds.length > 0 && (
                    <button
                      onClick={handleBulkDeleteSites}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Selected ({selectedSiteIds.length})</span>
                    </button>
                  )}
                  {activeSites.filter((s) => !s.isMainWarehouse).length > 0 && (
                    <button
                      onClick={handleClearAllSites}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                      title="Move branch sites to Recycle Bin"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear All Sites</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className={`grid grid-cols-1 ${activeSites.length > 1 ? '2xl:grid-cols-2' : ''} gap-4`}>
              {activeSites.map((s, idx) => {
                const assignedTeams = activeTeams.filter((t) => t.assignedSiteId === s.id);
                const assignedUsers = activeUsers.filter((u) => isUserAssignedToSite(u, s, activeSites));
                const isChecked = selectedSiteIds.includes(s.id);
                const supervisorInitials = (s.supervisorName || 'S')
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join('');

                return (
                  <div
                    key={s.id}
                    className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between group ${
                      s.isMainWarehouse
                        ? 'bg-gradient-to-br from-emerald-50/95 via-white/95 to-teal-50/80 dark:from-emerald-950/40 dark:via-slate-900/95 dark:to-slate-900 border border-emerald-400/60 dark:border-emerald-500/40 shadow-[0_14px_34px_-12px_rgba(16,185,129,0.22)] hover:shadow-[0_20px_42px_-12px_rgba(16,185,129,0.3)]'
                        : isChecked
                        ? 'bg-emerald-50/40 dark:bg-slate-900 border-2 border-emerald-500 shadow-md'
                        : 'bg-gradient-to-br from-white/95 via-white/90 to-slate-50/85 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-800/80 backdrop-blur-xl border border-white/95 dark:border-slate-800 ring-1 ring-slate-900/[0.06] dark:ring-white/[0.06] shadow-[0_10px_28px_-12px_rgba(15,23,42,0.1)] hover:shadow-[0_18px_38px_-12px_rgba(16,185,129,0.16)] hover:border-emerald-400/50'
                    }`}
                  >
                    {/* Top Row: Icon Badge + Title & Actions */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                              s.isMainWarehouse
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25'
                                : 'bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-emerald-400 shadow-slate-900/15'
                            }`}
                          >
                            {s.isMainWarehouse ? (
                              <Warehouse className="w-5 h-5" />
                            ) : (
                              <Building className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              <span className={s.isMainWarehouse ? 'text-emerald-700 dark:text-emerald-400' : ''}>
                                {s.isMainWarehouse ? 'Central HQ Warehouse' : 'Regional Site Branch'}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums text-[10px]">
                                {s.isMainWarehouse ? 'HQ-01' : `BR-${String(idx).padStart(2, '0')}`}
                              </span>
                            </div>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight leading-snug break-words mt-0.5">
                              {s.name}
                            </h3>
                          </div>
                        </div>

                        {/* Unified Glass Action Bar */}
                        <div className="flex items-center gap-1 bg-slate-100/85 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl px-1.5 py-1 shrink-0">
                          {!s.isMainWarehouse && isCentralAdmin && (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setSelectedSiteIds((prev) =>
                                  prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                                )
                              }
                              title="Select branch for bulk action"
                              className="w-3.5 h-3.5 mx-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          )}
                          {isCentralAdmin && (
                            <>
                              <button
                                onClick={() => {
                                  setIsCustomEditSupervisor(false);
                                  const staffIds = activeUsers
                                    .filter((u) => !isUserAllSites(u) && isUserAssignedToSite(u, s, activeSites))
                                    .map((u) => u.id);
                                  setEditingSiteUserIds(staffIds);
                                  setEditingSite({ ...s });
                                }}
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                title="Edit Site Details & Assigned Staff"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {!s.isMainWarehouse && (
                                <button
                                  onClick={() => handleDeleteSite(s)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Move to Recycle Bin"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Structured Details Surface */}
                      <div className="mt-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 p-3.5 space-y-2.5">
                        {/* Supervisor Row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                              {supervisorInitials || 'SV'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                                Supervisor / In-Charge
                              </div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug break-words mt-0.5">
                                {s.supervisorName || 'Unassigned'}
                              </div>
                            </div>
                          </div>
                          <Shield className="w-3.5 h-3.5 text-emerald-600/70 dark:text-emerald-400/70 shrink-0 mt-1" />
                        </div>

                        {/* Full-Width Location / Address & Direct Line Rows */}
                        <div className="space-y-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                          <div className="flex items-start gap-2 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-none">
                                Geographic Location / Address
                              </div>
                              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed break-words mt-0.5">
                                {s.location || 'Not specified'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 min-w-0 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                            <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-none">
                                Direct Line
                              </div>
                              <div className="text-xs font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-200 leading-snug break-words mt-0.5">
                                {s.contactNumber || 'Not specified'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Assigned System Users Row */}
                        <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                          <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-none mb-1">
                            Assigned System Users ({assignedUsers.length})
                          </div>
                          {assignedUsers.length === 0 ? (
                            <div className="text-slate-400 dark:text-slate-500 italic">
                              No user account linked yet
                            </div>
                          ) : (
                            <div className="text-slate-700 dark:text-slate-200 font-semibold leading-relaxed break-words">
                              {assignedUsers.map((u, uIdx) => (
                                <React.Fragment key={u.id}>
                                  {uIdx > 0 && <span className="text-slate-400 mx-1.5">·</span>}
                                  <span>{u.fullName}</span>
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                        <span>
                          Crews: <strong className="font-mono tabular-nums text-slate-900 dark:text-white font-extrabold">{assignedTeams.length}</strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Staff: <strong className="font-mono tabular-nums text-slate-900 dark:text-white font-extrabold">{assignedUsers.length}</strong>
                        </span>
                      </div>

                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{s.isMainWarehouse ? 'Primary Hub' : 'Operational'}</span>
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">User Role *</label>
                <select
                  value={userRole}
                  onChange={(e) => {
                    const nextR = e.target.value as UserRole;
                    setUserRole(nextR);
                    if (isCentralOrAllSiteAdmin(nextR)) {
                      setUserSiteScope('all');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all font-medium"
                >
                  <option value="Super Admin Central">1. Super Admin Central (Full System & HQ Control)</option>
                  <option value="All Site Branch Admin">2. All Site Branch Admin (All Branch Supervision)</option>
                  <option value="Branch Admin">3. Branch Admin (Branch Inbound, Outbound & Teams)</option>
                  <option value="Branch System User">4. Branch System User (Standard Site Operations)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Assigned Site(s) Scope *
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {userSiteScope === 'all' || isSuperAdmin(userRole)
                      ? 'All Sites / HQ'
                      : `${userSelectedSiteIds.length} site(s) selected`}
                  </span>
                </div>

                {/* Segmented Scope Selector */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 mb-2.5">
                  <button
                    type="button"
                    disabled={isSuperAdmin(userRole)}
                    onClick={() => setUserSiteScope('specific')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                      userSiteScope === 'specific' && !isSuperAdmin(userRole)
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Specific Site(s)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserSiteScope('all')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userSiteScope === 'all' || isSuperAdmin(userRole)
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All Sites / Central HQ
                  </button>
                </div>

                {userSiteScope === 'all' || isSuperAdmin(userRole) ? (
                  <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 p-3 text-xs text-emerald-900 dark:text-emerald-300">
                    <div className="font-bold">Full Multi-Branch &amp; Central Warehouse Access</div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      This user can view and manage inventory across all registered operational sites.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">
                        Select one or multiple site branches:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setUserSelectedSiteIds(activeSites.map((s) => s.id))}
                          className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">·</span>
                        <button
                          type="button"
                          onClick={() => setUserSelectedSiteIds([])}
                          className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 divide-y divide-slate-200/70 dark:divide-slate-700/60">
                      {activeSites.map((s) => {
                        const checked = userSelectedSiteIds.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            className={`flex items-center justify-between gap-2 px-3 py-2 text-xs cursor-pointer transition-colors ${
                              checked
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30'
                                : 'hover:bg-white dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCreateUserSite(s.id)}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white break-words leading-snug">
                                  {s.name}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 break-words leading-snug mt-0.5">
                                  {s.location} · In-Charge: {s.supervisorName || 'Unassigned'}
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
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

          {/* User Table with Multi-Site Visibility, Edit & Delete */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">System Users</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">
                  · {activeUsers.length} accounts
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
                    <th className="py-3 px-3">User Account</th>
                    <th className="py-3 px-3">Assigned Site(s)</th>
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
                    const isAll = isUserAllSites(u);
                    const assignedSiteIds = getUserAssignedSiteIds(u, activeSites);
                    const assignedSiteObjs = isAll
                      ? []
                      : assignedSiteIds
                          .map((sid) => activeSites.find((site) => site.id === sid))
                          .filter((site): site is Site => Boolean(site));
                    const supervisedSites = getUserSupervisedSites(u, activeSites);
                    const isChecked = selectedUserIds.includes(u.id);

                    const norm = normalizeRole(u.role);
                    const roleTextStyles = {
                      'Super Admin Central': 'text-purple-800 dark:text-purple-300 font-bold',
                      'All Site Branch Admin': 'text-blue-800 dark:text-blue-300 font-bold',
                      'Branch Admin': 'text-emerald-800 dark:text-emerald-300 font-bold',
                      'Branch System User': 'text-slate-700 dark:text-slate-300 font-semibold',
                    }[norm] || 'text-slate-700 dark:text-slate-300 font-semibold';

                    return (
                      <tr key={u.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isChecked ? 'bg-slate-50/80 dark:bg-slate-800/60' : ''}`}>
                        <td className="py-3 px-3 align-top">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setSelectedUserIds((prev) =>
                                prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                              )
                            }
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer mt-0.5"
                          />
                        </td>
                        <td className="py-3 px-3 align-top">
                          <div className="text-slate-900 dark:text-white font-bold">{u.fullName}</div>
                          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">@{u.username}</div>
                        </td>
                        <td className="py-3 px-3 align-top">
                          {isAll ? (
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                All Sites / Central HQ
                              </div>
                              {supervisedSites.length > 0 && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  In-Charge: {supervisedSites.map((st) => st.name).join(' · ')}
                                </div>
                              )}
                            </div>
                          ) : assignedSiteObjs.length === 0 ? (
                            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                              Unassigned (Click Edit to assign)
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                {assignedSiteObjs.length === 1
                                  ? '1 Assigned Site'
                                  : `${assignedSiteObjs.length} Assigned Sites`}
                              </div>
                              <div className="space-y-0.5">
                                {assignedSiteObjs.map((siteObj) => {
                                  const isSup = supervisedSites.some((sp) => sp.id === siteObj.id);
                                  return (
                                    <div
                                      key={siteObj.id}
                                      className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                                    >
                                      <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      <span>{siteObj.name}</span>
                                      {isSup && (
                                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                          · Supervisor
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 align-top">
                          <span className={`text-[11px] ${roleTextStyles}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap align-top">
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
                              onClick={() => {
                                const userAll = isUserAllSites(u);
                                const resolvedIds = userAll ? ['all'] : getUserAssignedSiteIds(u, activeSites);
                                setEditingUser({
                                  ...u,
                                  siteId: userAll ? 'all' : (resolvedIds[0] || 'unassigned'),
                                  siteIds: resolvedIds,
                                });
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit User Settings & Assigned Sites"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Team Creation Form */}
          <div className="lg:col-span-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-white/90 dark:border-slate-800 ring-1 ring-slate-900/[0.06] p-6 shadow-[0_12px_34px_-12px_rgba(15,23,42,0.12)] transition-all">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                  <Users2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    Field Operations & Roster
                  </div>
                  <h2 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                    Register Field Work Team
                  </h2>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Crew Roster
              </span>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Team / Squad Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Echo High-Tension Stringing Squad"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-2xl text-xs font-medium bg-slate-50/70 dark:bg-slate-800/60 dark:text-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Team Leader Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kasun Perera"
                    value={teamLeaderName}
                    onChange={(e) => setTeamLeaderName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-2xl text-xs font-medium bg-slate-50/70 dark:bg-slate-800/60 dark:text-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Leader NIC / Worker ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 198845123V / EMP-010"
                    value={teamLeaderIdNumber}
                    onChange={(e) => setTeamLeaderIdNumber(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-2xl text-xs font-mono tabular-nums uppercase bg-slate-50/70 dark:bg-slate-800/60 dark:text-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Assigned Site Base *
                </label>
                <select
                  value={assignedSiteId}
                  onChange={(e) => setAssignedSiteId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-2xl text-xs bg-slate-50/70 dark:bg-slate-800/60 dark:text-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 focus:outline-none transition-all font-medium"
                >
                  {activeSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Team Members Roster with Individual Names and ID Numbers */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/80 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Users2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Team Members & ID Roster ({teamMembers.length})</span>
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Add names & ID numbers
                  </span>
                </div>

                {/* Input row for adding a member */}
                <div className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Member Full Name *"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:bg-slate-800 dark:text-white focus:outline-none focus:border-emerald-600"
                    />
                    <input
                      type="text"
                      placeholder="ID / NIC Number *"
                      value={newMemberIdNumber}
                      onChange={(e) => setNewMemberIdNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono tabular-nums uppercase dark:bg-slate-800 dark:text-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Role / Skill (e.g. Technician)"
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:bg-slate-800 dark:text-white focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Phone (Optional)"
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:bg-slate-800 dark:text-white focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={handleAddTeamMember}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
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
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-[10px] font-mono tabular-nums font-bold text-slate-400 w-4 shrink-0 mt-0.5">{idx + 1}.</span>
                          <div className="break-words leading-snug min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-slate-200">{m.name}</span>
                            <span className="ml-2 font-mono tabular-nums text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                              · {m.idNumber}
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
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-1">
                    No members added yet. Add individual team member names & ID numbers above.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Crew Size ({teamMembers.length > 0 ? 'Auto-Calculated' : 'Persons'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={teamMembers.length > 0 ? teamMembers.length + 1 : crewSize}
                    onChange={(e) => setCrewSize(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={teamMembers.length > 0}
                    className="w-full px-4 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-2xl text-xs font-mono tabular-nums bg-slate-50/70 dark:bg-slate-800/60 dark:text-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 focus:outline-none transition-all disabled:opacity-60"
                  />
                  {teamMembers.length > 0 && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      1 Leader + {teamMembers.length} Members
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+94 77 123 4567"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-2xl text-xs font-mono tabular-nums bg-slate-50/70 dark:bg-slate-800/60 dark:text-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleClearTeamForm}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Clear all team form fields"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-900/15 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Field Team</span>
                </button>
              </div>
            </form>
          </div>

          {/* Teams Cards List with High-Craft Liquid Glass Cards */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/85 dark:border-slate-800 ring-1 ring-slate-900/[0.05] shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-5 rounded-full bg-emerald-500" />
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                  Active Field Crews
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums font-bold">
                  · {activeTeams.length} Registered
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedTeamIds.length > 0 && (
                  <button
                    onClick={handleBulkDeleteTeams}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedTeamIds.length})</span>
                  </button>
                )}
                {activeTeams.length > 0 && (
                  <button
                    onClick={handleClearAllTeams}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                    title="Move all field teams to Recycle Bin"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All Teams</span>
                  </button>
                )}
              </div>
            </div>

            {activeTeams.length === 0 ? (
              <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-3xl border border-white/90 dark:border-slate-800 ring-1 ring-slate-900/[0.05] p-10 text-center space-y-2 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <Users2 className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  No Active Field Teams Registered
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Use the Field Work Team registration panel on the left to register your field squads, team leaders, and member NIC rosters.
                </p>
              </div>
            ) : (
              <div className={`grid grid-cols-1 ${activeTeams.length > 1 ? '2xl:grid-cols-2' : ''} gap-4`}>
                {activeTeams.map((t, idx) => {
                  const s = activeSites.find((site) => site.id === t.assignedSiteId);
                  const isChecked = selectedTeamIds.includes(t.id);
                  const hasMembers = t.members && t.members.length > 0;
                  const leaderInitials = (t.teamLeaderName || 'TL')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join('');

                  return (
                    <div
                      key={t.id}
                      className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between group ${
                        isChecked
                          ? 'bg-emerald-50/40 dark:bg-slate-900 border-2 border-emerald-500 shadow-md'
                          : 'bg-gradient-to-br from-white/95 via-white/90 to-slate-50/85 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-800/80 backdrop-blur-xl border border-white/95 dark:border-slate-800 ring-1 ring-slate-900/[0.06] dark:ring-white/[0.06] shadow-[0_10px_28px_-12px_rgba(15,23,42,0.1)] hover:shadow-[0_18px_38px_-12px_rgba(16,185,129,0.18)] hover:border-emerald-400/50'
                      }`}
                    >
                      <div>
                        {/* Header: Icon Badge + Squad Title + Actions */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                              <Users2 className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                <span className="break-words">{s?.name || 'Central Base'}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                                  SQ-{String(idx + 1).padStart(2, '0')}
                                </span>
                              </div>
                              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight leading-snug break-words mt-0.5">
                                {t.teamName}
                              </h3>
                            </div>
                          </div>

                          {/* Unified Glass Action Bar */}
                          <div className="flex items-center gap-1 bg-slate-100/85 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl px-1.5 py-1 shrink-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setSelectedTeamIds((prev) =>
                                  prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                                )
                              }
                              title="Select team for bulk action"
                              className="w-3.5 h-3.5 mx-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <button
                              onClick={() => setEditingTeam({ ...t })}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              title="Edit Team"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(t)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Team"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Structured Leader & Contact Surface */}
                        <div className="mt-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 p-3.5 space-y-2.5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-emerald-600 text-emerald-400 dark:text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                {leaderInitials || 'TL'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                                  Squad Leader
                                </div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug break-words mt-0.5">
                                  {t.teamLeaderName}
                                </div>
                              </div>
                            </div>
                            {t.teamLeaderIdNumber && (
                              <span className="font-mono tabular-nums text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                ID: {t.teamLeaderIdNumber}
                              </span>
                            )}
                          </div>

                          <div className="space-y-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                            <div className="flex items-start gap-2 min-w-0">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-none">
                                  Assigned Base
                                </div>
                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug break-words mt-0.5">
                                  {s?.name || 'Central HQ'}
                                  {s?.location ? (
                                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                                      {' '}· {s.location}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 min-w-0 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                              <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-none">
                                  Contact Phone
                                </div>
                                <div className="text-xs font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-200 leading-snug break-words mt-0.5">
                                  {t.contactPhone || 'Not specified'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Member Roster Sub-list */}
                          {hasMembers ? (
                            <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                <span>Registered Crew Roster</span>
                                <span className="font-mono tabular-nums">{t.members!.length} Members</span>
                              </div>
                              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                                {t.members!.map((m, mIdx) => (
                                  <div
                                    key={m.id}
                                    className="flex flex-wrap items-start justify-between gap-2 text-[11px] bg-white/80 dark:bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800"
                                  >
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 break-words min-w-0 flex-1">
                                      <span className="font-mono tabular-nums text-slate-400 mr-1">{mIdx + 1}.</span>
                                      {m.name}
                                    </span>
                                    <span className="font-mono tabular-nums text-[10px] text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
                                      {m.idNumber}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
                              <span>Individual NIC roster not logged</span>
                              <button
                                type="button"
                                onClick={() => setEditingTeam({ ...t })}
                                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                              >
                                + Add Roster
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Telemetry Strip */}
                      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-600 dark:text-slate-400">
                          Total Strength: <strong className="font-mono tabular-nums text-slate-900 dark:text-white font-extrabold">{t.crewSize} Personnel</strong>
                        </span>

                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Active Squad</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* TAB 5: CLIENT REGISTER (SYNCED WITH CLIENT FREE STOCK) */}
      {activeTab === 'clients' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* New Client Register Form */}
          {isCentralAdmin ? (
            <div className="lg:col-span-5 relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[24px] border border-slate-200/90 dark:border-slate-800 p-6 shadow-[0_12px_36px_-12px_rgba(15,23,42,0.08)] transition-all">
              <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
              <div className="relative flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-emerald-600 dark:to-teal-700 text-emerald-400 dark:text-white flex items-center justify-center shadow-md shadow-slate-900/10">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">New Client Register</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Synced with Client Free Stock (FOC) & Projects</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg">
                  Client Register
                </span>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-3.5 relative">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Client Code</label>
                    <input
                      type="text"
                      value={clientCodeInput}
                      onChange={(e) => setClientCodeInput(e.target.value)}
                      placeholder={`Auto e.g. CLT-${String(clients.length + 1).padStart(3, '0')}`}
                      className="w-full px-3.5 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs font-mono font-bold bg-slate-50/70 dark:bg-slate-800 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Industry Category *</label>
                      {isCentralAdmin && (
                        <button
                          type="button"
                          onClick={() => setShowAddClientCategoryModal(!showAddClientCategoryModal)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Add Category</span>
                        </button>
                      )}
                    </div>

                    {/* Add Custom Category Inline Sub-Form */}
                    {isCentralAdmin && showAddClientCategoryModal && (
                      <div className="mb-2 p-2.5 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
                          <span>Add New Industry Category</span>
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
                            placeholder="e.g. Solar & Renewable Energy"
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
                      className="w-full px-3 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs font-semibold bg-slate-50/70 dark:bg-slate-800 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Client / Principal Name *</label>
                  <input
                    type="text"
                    required
                    value={clientNameInput}
                    onChange={(e) => setClientNameInput(e.target.value)}
                    placeholder="e.g. Sri Lanka Telecom PLC / National Grid Corp"
                    className="w-full px-3.5 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50/70 dark:bg-slate-800 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Primary Contact Person</label>
                    <input
                      type="text"
                      value={clientContactPersonInput}
                      onChange={(e) => setClientContactPersonInput(e.target.value)}
                      placeholder="e.g. Eng. K. Perera"
                      className="w-full px-3 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs font-medium bg-slate-50/70 dark:bg-slate-800 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tax / Reg Number</label>
                    <input
                      type="text"
                      value={clientTaxNoInput}
                      onChange={(e) => setClientTaxNoInput(e.target.value)}
                      placeholder="e.g. VAT-99201-X"
                      className="w-full px-3 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs font-mono bg-slate-50/70 dark:bg-slate-800 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Contact Phone</label>
                    <input
                      type="text"
                      value={clientPhoneInput}
                      onChange={(e) => setClientPhoneInput(e.target.value)}
                      placeholder="e.g. +94 11 234 5678"
                      className="w-full px-3 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs font-mono bg-slate-50/70 dark:bg-slate-800 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Contact Email</label>
                    <input
                      type="email"
                      value={clientEmailInput}
                      onChange={(e) => setClientEmailInput(e.target.value)}
                      placeholder="e.g. foc-logistics@client.com"
                      className="w-full px-3 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs bg-slate-50/70 dark:bg-slate-800 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Office / Headquarter Address</label>
                  <input
                    type="text"
                    value={clientAddressInput}
                    onChange={(e) => setClientAddressInput(e.target.value)}
                    placeholder="Corporate office or central yard address"
                    className="w-full px-3 py-2.5 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs bg-slate-50/70 dark:bg-slate-800 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">FOC Material Dispatch Notes / Terms</label>
                  <textarea
                    rows={2}
                    value={clientNotesInput}
                    onChange={(e) => setClientNotesInput(e.target.value)}
                    placeholder="Specific FOC material dispatch guidelines, drum return policies, or contract terms..."
                    className="w-full px-3 py-2 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs bg-slate-50/70 dark:bg-slate-800 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="pt-1 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setClientCodeInput('');
                      setClientNameInput('');
                      setClientContactPersonInput('');
                      setClientPhoneInput('');
                      setClientEmailInput('');
                      setClientAddressInput('');
                      setClientTaxNoInput('');
                      setClientNotesInput('');
                    }}
                    className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-emerald-600 hover:via-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-md shadow-slate-900/15 hover:shadow-emerald-600/25 transition-all text-xs cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save to Client Register</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-5 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900">
              <Shield className="w-6 h-6 text-amber-600 mb-2" />
              <h3 className="font-bold text-sm">Central Admin Required</h3>
              <p className="mt-1">Only Central Super Admins can register new Master Clients to the system.</p>
            </div>
          )}

          {/* Client Register Cards Directory */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>Registered Clients & Principals</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 text-emerald-400 dark:bg-slate-800 dark:text-emerald-300 font-mono font-bold">
                      {activeClients.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Directly linked with Client Free Stock (FOC) dispatches & project allocations
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedClientIds.length > 0 && isCentralAdmin && (
                  <button
                    onClick={handleBulkDeleteClients}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-500 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedClientIds.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Search Filter bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search client code, principal name, industry category, or contact person..."
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-medium border border-slate-200/90 dark:border-slate-800 rounded-2xl bg-white/90 dark:bg-slate-900/90 dark:text-white shadow-2xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Client Cards Grid */}
            {activeClients.length === 0 ? (
              <div className="p-10 text-center bg-white/90 dark:bg-slate-900/90 rounded-[22px] border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                <Handshake className="w-9 h-9 text-slate-300 mx-auto mb-2.5" />
                <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">No Clients Registered Yet</p>
                <p className="mt-1">Use the New Client Register form on the left or inside Client Free Stock (FOC) to add your first Client / Principal.</p>
              </div>
            ) : (
              <div className={`grid grid-cols-1 ${activeClients.length > 1 ? '2xl:grid-cols-2' : ''} gap-4`}>
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
                  .map((c) => {
                    const isSelected = selectedClientIds.includes(c.id);
                    const focVoucherCount = clientFreeIssues.filter(
                      (v) => !v.isDeleted && v.clientName.trim().toLowerCase() === c.name.trim().toLowerCase()
                    ).length;

                    return (
                      <div
                        key={c.id}
                        className={`group relative overflow-hidden rounded-[22px] p-5 transition-all duration-200 flex flex-col justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl ${
                          isSelected
                            ? 'border-2 border-rose-400 ring-2 ring-rose-500/10 shadow-md'
                            : 'border border-slate-200/90 dark:border-slate-800 shadow-[0_8px_28px_-10px_rgba(15,23,42,0.07)] hover:shadow-[0_14px_34px_-10px_rgba(16,185,129,0.14)] hover:border-emerald-300/80 dark:hover:border-emerald-700'
                        }`}
                      >
                        {/* Top Accent Line */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-teal-400 opacity-85" />

                        <div>
                          {/* Header Row */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              {isCentralAdmin && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    setSelectedClientIds((prev) =>
                                      prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                                    )
                                  }
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-3.5 h-3.5"
                                />
                              )}
                              <span className="font-mono text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-slate-900 text-emerald-400 dark:bg-slate-800 dark:text-emerald-300 tracking-wider">
                                {c.clientCode}
                              </span>
                              {c.category && (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 break-words">
                                  {c.category}
                                </span>
                              )}
                            </div>

                            {isCentralAdmin && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => setEditingClient(c)}
                                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
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

                          {/* Client Title & Icon */}
                          <div className="flex items-start gap-3 mb-3.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base tracking-tight leading-snug break-words">
                                {c.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug break-words mt-0.5">
                                {c.contactPerson ? `Contact: ${c.contactPerson}` : 'Registered Project Principal'}
                              </p>
                            </div>
                          </div>

                          {/* Structured Metadata Box */}
                          <div className="rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 p-3 space-y-2 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Phone</span>
                                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200 break-words block mt-0.5">
                                  {c.phone || 'Not specified'}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tax / Reg #</span>
                                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200 break-words block mt-0.5">
                                  {c.taxRegistrationNo || 'N/A'}
                                </span>
                              </div>
                            </div>
                            {(c.email || c.address || c.notes) && (
                              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
                                {c.email && (
                                  <div className="break-words leading-snug">
                                    <span className="text-slate-400 font-semibold">Email:</span> {c.email}
                                  </div>
                                )}
                                {c.address && (
                                  <div className="break-words leading-relaxed">
                                    <span className="text-slate-400 font-semibold">Address:</span> {c.address}
                                  </div>
                                )}
                                {c.notes && (
                                  <div className="break-words leading-relaxed">
                                    <span className="text-slate-400 font-semibold">Notes:</span> {c.notes}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold">
                            <span className="text-[11px]">FOC Dispatches:</span>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-extrabold text-[11px] border border-indigo-200/60 dark:border-indigo-800/50">
                              {focVoucherCount}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full font-bold border border-emerald-200/80 dark:border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Synced with FOC
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT SITE MODAL (Synced with User Assignments) */}
      {editingSite && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                    Edit Site Branch &amp; Staff
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Supervisor and staff changes automatically update User Settings
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingSite(null);
                  setEditingSiteUserIds([]);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
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
                    const prevSup = activeUsers.find(
                      (u) =>
                        (editingSite.supervisorUserId && u.id === editingSite.supervisorUserId) ||
                        (!editingSite.supervisorUserId &&
                          u.fullName.trim().toLowerCase() === (editingSite.supervisorName || '').trim().toLowerCase())
                    );

                    if (val === '__custom__') {
                      setIsCustomEditSupervisor(true);
                      setEditingSite({ ...editingSite, supervisorUserId: '' });
                      if (prevSup) {
                        setEditingSiteUserIds((prev) => prev.filter((id) => id !== prevSup.id));
                      }
                    } else {
                      setIsCustomEditSupervisor(false);
                      const matched = activeUsers.find(
                        (u) => u.fullName.trim().toLowerCase() === val.trim().toLowerCase()
                      );
                      setEditingSite({
                        ...editingSite,
                        supervisorName: val,
                        supervisorUserId: matched?.id || '',
                      });
                      setEditingSiteUserIds((prev) => {
                        const withoutOldSup = prevSup ? prev.filter((id) => id !== prevSup.id) : prev;
                        if (matched && !isUserAllSites(matched)) {
                          return Array.from(new Set([...withoutOldSup, matched.id]));
                        }
                        return withoutOldSup;
                      });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all font-medium"
                  required={!isCustomEditSupervisor}
                >
                  <option value="">-- Select Registered Supervisor / Manager --</option>
                  {activeUsers.map((u) => {
                    const siteCount = isUserAllSites(u)
                      ? 'All Sites'
                      : `${getUserAssignedSiteIds(u, activeSites).length} site(s)`;
                    return (
                      <option key={u.id} value={u.fullName}>
                        {u.fullName} (@{u.username} · {siteCount})
                      </option>
                    );
                  })}
                  {editingSite.supervisorName &&
                    !isCustomEditSupervisor &&
                    !activeUsers.some((u) => u.fullName.toLowerCase() === editingSite.supervisorName.toLowerCase()) && (
                      <option value={editingSite.supervisorName}>
                        {editingSite.supervisorName} (Current Custom Supervisor)
                      </option>
                    )}
                  <option value="__custom__">Enter Custom / Unregistered Supervisor Name...</option>
                </select>

                {isCustomEditSupervisor && (
                  <input
                    type="text"
                    placeholder="Type custom supervisor name..."
                    value={editingSite.supervisorName}
                    onChange={(e) =>
                      setEditingSite({ ...editingSite, supervisorName: e.target.value, supervisorUserId: '' })
                    }
                    className="w-full mt-2 px-3.5 py-2.5 border border-amber-300 dark:border-amber-700/60 rounded-xl text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-none bg-amber-50/50 dark:bg-amber-950/30 dark:text-white"
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </div>

              {/* Synced Site Users Checklist */}
              {activeUsers.some((u) => !isUserAllSites(u)) && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Assigned Branch Users ({editingSiteUserIds.length})
                    </label>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      Synced with User Accounts
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 divide-y divide-slate-200/70 dark:divide-slate-700/60">
                    {activeUsers
                      .filter((u) => !isUserAllSites(u))
                      .map((u) => {
                        const isSupOfThisSite =
                          !isCustomEditSupervisor &&
                          (editingSite.supervisorUserId === u.id ||
                            (!editingSite.supervisorUserId &&
                              u.fullName.trim().toLowerCase() === (editingSite.supervisorName || '').trim().toLowerCase()));
                        const checked = editingSiteUserIds.includes(u.id) || isSupOfThisSite;
                        const otherSitesCount = getUserAssignedSiteIds(u, activeSites).filter(
                          (sid) => sid !== editingSite.id
                        ).length;

                        return (
                          <label
                            key={u.id}
                            className={`flex items-center justify-between gap-2 px-3.5 py-2 text-xs cursor-pointer transition-colors ${
                              checked
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30'
                                : 'hover:bg-white dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={isSupOfThisSite}
                                onChange={() => {
                                  setEditingSiteUserIds((prev) =>
                                    prev.includes(u.id)
                                      ? prev.filter((id) => id !== u.id)
                                      : [...prev, u.id]
                                  );
                                }}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white break-words leading-snug">
                                  {u.fullName}
                                  {isSupOfThisSite && (
                                    <span className="ml-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                      · Selected Supervisor
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 break-words leading-snug mt-0.5">
                                  @{u.username} · {u.role}
                                  {otherSitesCount > 0 ? ` · Also on ${otherSitesCount} other site(s)` : ''}
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSite(null);
                    setEditingSiteUserIds([]);
                  }}
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

      {/* EDIT USER MODAL (Shows Single or All Multiple Assigned Sites & Bi-Directional Sync) */}
      {editingUser && (() => {
        const isEditingUserAllSites =
          editingUser.username === 'admin' ||
          isSuperAdmin(editingUser.role) ||
          editingUser.siteId === 'all' ||
          (Array.isArray(editingUser.siteIds) && editingUser.siteIds.includes('all'));

        const currentEditSiteIds = isEditingUserAllSites
          ? []
          : (Array.isArray(editingUser.siteIds)
              ? editingUser.siteIds.filter((id) => id && id !== 'all' && id !== 'unassigned')
              : editingUser.siteId && editingUser.siteId !== 'all' && editingUser.siteId !== 'unassigned'
              ? [editingUser.siteId]
              : []);

        const currentEditSiteObjs = currentEditSiteIds
          .map((sid) => activeSites.find((s) => s.id === sid))
          .filter((s): s is Site => Boolean(s));

        const supervisedByEditUser = getUserSupervisedSites(editingUser, activeSites);

        const setEditUserAllSitesMode = () => {
          setEditingUser({
            ...editingUser,
            siteId: 'all',
            siteIds: ['all'],
          });
        };

        const setEditUserSpecificSitesMode = () => {
          const fallbackIds =
            currentEditSiteIds.length > 0
              ? currentEditSiteIds
              : supervisedByEditUser.length > 0
              ? supervisedByEditUser.map((s) => s.id)
              : [];
          setEditingUser({
            ...editingUser,
            siteId: fallbackIds[0] || 'unassigned',
            siteIds: fallbackIds,
          });
        };

        const toggleEditUserSite = (targetSiteId: string) => {
          const exists = currentEditSiteIds.includes(targetSiteId);
          const nextIds = exists
            ? currentEditSiteIds.filter((id) => id !== targetSiteId)
            : [...currentEditSiteIds, targetSiteId];
          setEditingUser({
            ...editingUser,
            siteId: nextIds[0] || 'unassigned',
            siteIds: nextIds,
          });
        };

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center font-bold">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                      Edit User Account &amp; Assigned Sites
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      @{editingUser.username} · Synchronized with Site Branch Registry
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveUserEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                    <input
                      type="text"
                      value={editingUser.password}
                      onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono bg-slate-50/50 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">User Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => {
                      const nextR = e.target.value as UserRole;
                      if (isSuperAdmin(nextR)) {
                        setEditingUser({ ...editingUser, role: nextR, siteId: 'all', siteIds: ['all'] });
                      } else {
                        setEditingUser({ ...editingUser, role: nextR });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:outline-none transition-all font-medium"
                  >
                    <option value="Super Admin Central">1. Super Admin Central (Full System & HQ Control)</option>
                    <option value="All Site Branch Admin">2. All Site Branch Admin (All Branch Supervision)</option>
                    <option value="Branch Admin">3. Branch Admin (Branch Inbound, Outbound & Teams)</option>
                    <option value="Branch System User">4. Branch System User (Standard Site Operations)</option>
                  </select>
                </div>

                {/* ASSIGNED SITES SECTION (Single & Multi-Site) */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                        Assigned Site(s) &amp; Branch Access
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isEditingUserAllSites
                          ? 'Global access across all sites & central warehouse'
                          : currentEditSiteObjs.length === 0
                          ? 'Currently not assigned to any site branch'
                          : currentEditSiteObjs.length === 1
                          ? 'Assigned to 1 site branch'
                          : `Assigned to ${currentEditSiteObjs.length} multiple site branches`}
                      </div>
                    </div>
                  </div>

                  {/* Scope Switcher */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
                    <button
                      type="button"
                      disabled={editingUser.username === 'admin' || isSuperAdmin(editingUser.role)}
                      onClick={setEditUserSpecificSitesMode}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                        !isEditingUserAllSites
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Assigned Site(s) ({currentEditSiteObjs.length})
                    </button>
                    <button
                      type="button"
                      onClick={setEditUserAllSitesMode}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isEditingUserAllSites
                          ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      All Sites / Central HQ
                    </button>
                  </div>

                  {isEditingUserAllSites ? (
                    <div className="rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-3 text-xs space-y-1.5">
                      <div className="font-bold text-emerald-900 dark:text-emerald-300">
                        All Sites / Central Warehouse HQ Enabled
                      </div>
                      <div className="text-[11px] text-emerald-800/80 dark:text-emerald-400">
                        User can access inventory, transfers, and reports across every operational site.
                      </div>
                      {supervisedByEditUser.length > 0 && (
                        <div className="pt-1.5 border-t border-emerald-200/70 dark:border-emerald-800/50 text-[11px] text-slate-700 dark:text-slate-300">
                          <strong>Direct Supervisor Of:</strong>{' '}
                          {supervisedByEditUser.map((s) => s.name).join(', ')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Active Assigned Sites Summary */}
                      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            Active Assigned Sites ({currentEditSiteObjs.length})
                          </span>
                          <div className="flex items-center gap-2 text-[11px]">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingUser({
                                  ...editingUser,
                                  siteId: activeSites[0]?.id || 'unassigned',
                                  siteIds: activeSites.map((s) => s.id),
                                })
                              }
                              className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                            >
                              Assign All Branches
                            </button>
                            {currentEditSiteObjs.length > 0 && (
                              <>
                                <span className="text-slate-300">·</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingUser({
                                      ...editingUser,
                                      siteId: 'unassigned',
                                      siteIds: [],
                                    })
                                  }
                                  className="text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer"
                                >
                                  Unassign All
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {currentEditSiteObjs.length === 0 ? (
                          <div className="text-xs text-amber-700 dark:text-amber-400 font-medium py-1">
                            No sites currently assigned. Tick one or more site branches below to assign this user.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {currentEditSiteObjs.map((siteObj) => {
                              const isSup = supervisedByEditUser.some((sp) => sp.id === siteObj.id);
                              return (
                                <div
                                  key={siteObj.id}
                                  className="py-2 flex items-start justify-between gap-2 text-xs"
                                >
                                  <div className="flex items-start gap-2 min-w-0 flex-1">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1 break-words leading-snug">
                                      <span className="font-bold text-slate-900 dark:text-white">
                                        {siteObj.name}
                                      </span>
                                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {' '}· {siteObj.location}
                                        {isSup ? ' · Site Supervisor' : ''}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleEditUserSite(siteObj.id)}
                                    className="px-2 py-0.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer shrink-0"
                                    title={`Remove ${siteObj.name} from this user`}
                                  >
                                    Remove
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Multi-Site Selection Checklist */}
                      <div>
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                          Select / Update Site Branches (Single or Multiple):
                        </div>
                        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                          {activeSites.map((s) => {
                            const checked = currentEditSiteIds.includes(s.id);
                            const isSup = supervisedByEditUser.some((sp) => sp.id === s.id);
                            return (
                              <label
                                key={s.id}
                                className={`flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs cursor-pointer transition-colors ${
                                  checked
                                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                }`}
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleEditUserSite(s.id)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer mt-0.5"
                                  />
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-900 dark:text-white break-words leading-snug">
                                      {s.name}
                                      {isSup && (
                                        <span className="ml-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                          · Current Supervisor
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 break-words leading-snug mt-0.5">
                                      {s.location} · In-Charge: {s.supervisorName || 'Unassigned'}
                                    </div>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
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
        );
      })()}

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
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 w-4 shrink-0 mt-0.5">{idx + 1}.</span>
                          <div className="break-words leading-snug min-w-0">
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
