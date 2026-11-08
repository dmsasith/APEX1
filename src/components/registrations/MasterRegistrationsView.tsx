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
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { UserRole, Item, Site, User, Team, TeamMember, isSuperAdmin, isCentralOrAllSiteAdmin, normalizeRole } from '../../types';
import { formatDate, formatNumber } from '../../utils/exportUtils';
import {
  isMachineryItem,
  getItemClassification,
  STANDARD_MACHINERY_CATEGORIES,
  STANDARD_MACHINERY_UNITS,
} from '../../utils/itemTypeUtils';
import { ConfirmModal } from '../common/ConfirmModal';

interface MasterRegistrationsViewProps {
  initialTab?: 'items' | 'sites' | 'users' | 'teams';
}

export const MasterRegistrationsView: React.FC<MasterRegistrationsViewProps> = ({ initialTab = 'items' }) => {
  const {
    config,
    currentUser,
    activeSites,
    activeUsers,
    activeItems,
    activeTeams,
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
    setCurrentUser,
    currentTenant,
    getWorkspaceLoginUrl,
  } = useStock();

  const isCentralAdmin = isSuperAdmin(currentUser.role) || currentUser.username === 'admin';

  const [activeTab, setActiveTab] = useState<'items' | 'sites' | 'users' | 'teams'>(initialTab);

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
  const [editingUser, setEditingUser] = useState<User | null>(null);
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
  };

  // --- SITE FORM STATE ---
  const [siteName, setSiteName] = useState('');
  const [siteSupervisor, setSiteSupervisor] = useState('');
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

  const handleDeleteUser = (u: User) => {
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

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="bg-emerald-800 text-white px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 shadow-md animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">System Setup</span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
          Master Registration Forms & Data Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Register, edit, delete, or bulk-manage material items, site branches, operational users, and field crews with safe Recycle Bin protection.
        </p>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'items'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <PackagePlus className="w-4 h-4 text-emerald-400" />
            <span>ADD & Manage Items ({activeItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('sites')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'sites'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building className="w-4 h-4 text-emerald-400" />
            <span>ADD & Manage Sites ({activeSites.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>ADD & Manage Users ({activeUsers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'teams'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users2 className="w-4 h-4 text-emerald-400" />
            <span>ADD & Manage Teams ({activeTeams.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ADD & MANAGE ITEMS */}
      {activeTab === 'items' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Creation Form */}
          {isCentralAdmin ? (
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <PackagePlus className="w-4 h-4 text-slate-700" />
                <h2 className="font-semibold text-sm text-slate-900">Master Item Creation Form</h2>
              </div>

            <form onSubmit={handleCreateItem} className="space-y-3.5">
              {/* Item Classification Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Classification *</label>
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
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      itemClassification === 'Material'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
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
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      itemClassification === 'Machinery'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>🚜 Machinery / Equipment</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Code *</label>
                <input
                  type="text"
                  placeholder={itemClassification === 'Machinery' ? 'e.g. EXC-CAT-320, GEN-KUB-50, WELD-400' : 'e.g. CBL-CU-500, ST-BAR-20'}
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  placeholder={itemClassification === 'Machinery' ? 'e.g. Caterpillar 320 Hydraulic Excavator' : 'Full material specification'}
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Category *</label>
                  {itemClassification === 'Machinery' && (
                    <span className="text-[10px] text-amber-700 font-bold">Standard Fleet Equipment</span>
                  )}
                </div>

                {itemClassification === 'Machinery' ? (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-1">
                      {STANDARD_MACHINERY_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setItemCategory(cat)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                            itemCategory === cat
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                              : 'bg-amber-50/70 border-amber-200 text-amber-900 hover:bg-amber-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Or specify custom category..."
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      required
                    />
                  </div>
                ) : (
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure *</label>
                <select
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specify Custom Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. liters, cartons, pallets"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price ({config.currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Low Stock Alert Min</label>
                  <input
                    type="number"
                    min="1"
                    value={itemThreshold}
                    onChange={(e) => setItemThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                <label className="block text-xs font-bold text-emerald-900 mb-1">
                  Initial Received Quantity (Auto-posted to Main Stock)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0 (Optional opening stock in Main Warehouse)"
                  value={initialReceivedQty}
                  onChange={(e) => setInitialReceivedQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClearItemForm}
                  className="px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                  title="Clear all item form fields"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Master Item</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Master Item Catalog (Read-Only)</h3>
            <p className="text-xs text-slate-600 mt-1.5 max-w-sm leading-relaxed">
              Site branch personnel can view items, units, and codes. Adding or modifying master item specifications is managed by <strong>Super Admin Central</strong>.
            </p>
            <div className="mt-4 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
              Role: <strong className="text-slate-800">{currentUser.fullName}</strong> ({currentUser.role})
            </div>
          </div>
        )}

        {/* Master Item List with Edit, Delete, Bulk Clear */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm text-slate-900">Active Master Catalog</h2>
              <span className="text-xs text-slate-500 font-mono">({activeItems.length} active)</span>
            </div>

            {isCentralAdmin && (
              <div className="flex items-center gap-2">
                {selectedItemIds.length > 0 && (
                  <button
                    onClick={handleBulkDeleteItems}
                    className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedItemIds.length})</span>
                  </button>
                )}
                {activeItems.length > 0 && (
                  <button
                    onClick={handleClearAllItems}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Move all active items to Recycle Bin"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All Items</span>
                  </button>
                )}
              </div>
            )}
          </div>

            <div className="overflow-x-auto flex-1 max-h-[500px]">
              <table className="w-full min-w-[720px] text-xs text-left table-fixed">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 w-[5%]">
                      <input
                        type="checkbox"
                        checked={activeItems.length > 0 && selectedItemIds.length === activeItems.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedItemIds(activeItems.map((i) => i.id));
                          else setSelectedItemIds([]);
                        }}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                    </th>
                    <th className="py-2.5 px-3 w-[20%]">Item Code</th>
                    <th className="py-2.5 px-4 w-[32%]">Item Name</th>
                    <th className="py-2.5 px-3 w-[21%]">Category</th>
                    <th className="py-2.5 px-3 text-center w-[7%]">Unit</th>
                    <th className="py-2.5 px-3 text-right w-[9%]">Main Stock</th>
                    <th className="py-2.5 px-3 text-right w-[6%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No active items in catalog. Register an item on the left.
                      </td>
                    </tr>
                  ) : (
                    activeItems.map((i) => {
                      const mainStock = getMainWarehouseStock(i.id);
                      const isChecked = selectedItemIds.includes(i.id);

                      return (
                        <tr key={i.id} className={`hover:bg-slate-50 ${isChecked ? 'bg-slate-50' : ''}`}>
                          <td className="py-2.5 px-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setSelectedItemIds((prev) =>
                                  prev.includes(i.id) ? prev.filter((id) => id !== i.id) : [...prev, i.id]
                                )
                              }
                              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                            {i.itemCode}
                          </td>
                          <td className="py-2.5 px-4 text-slate-800 font-medium whitespace-normal break-words" title={i.itemName}>
                            {i.itemName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium whitespace-normal break-words">{i.category}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{i.unit}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                            {formatNumber(mainStock.availableBalance)}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            {isCentralAdmin ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setEditingItem({ ...i })}
                                  className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                  title="Edit Item"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(i)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <Building className="w-4 h-4 text-slate-700" />
                <h2 className="font-semibold text-sm text-slate-900">Register New Site Branch</h2>
              </div>

              <form onSubmit={handleCreateSite} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Site Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. East River Transmission Depot"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supervisor Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Samuel Jenkins"
                    value={siteSupervisor}
                    onChange={(e) => setSiteSupervisor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Details *</label>
                  <input
                    type="text"
                    placeholder="Highway mile marker, grid address, or depot code"
                    value={siteLocation}
                    onChange={(e) => setSiteLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={sitePhone}
                    onChange={(e) => setSitePhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClearSiteForm}
                    className="px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                    title="Clear all site form fields"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register Site Branch</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Site Branch Setup (Read-Only)</h3>
              <p className="text-xs text-slate-600 mt-1.5 max-w-sm leading-relaxed">
                Branch creation, supervisor assignment, and location configurations are managed exclusively by <strong>Super Admin Central</strong>.
              </p>
              <div className="mt-4 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                Logged in as: <strong className="text-slate-800">{currentUser.fullName}</strong> ({currentUser.role})
              </div>
            </div>
          )}

          {/* Sites Grid with Edit & Delete */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-slate-900">Current Operational Sites ({activeSites.length})</h2>
              {isCentralAdmin && (
                <div className="flex items-center gap-2">
                  {selectedSiteIds.length > 0 && (
                    <button
                      onClick={handleBulkDeleteSites}
                      className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Selected ({selectedSiteIds.length})</span>
                    </button>
                  )}
                  {activeSites.filter((s) => !s.isMainWarehouse).length > 0 && (
                    <button
                      onClick={handleClearAllSites}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Move branch sites to Recycle Bin"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear All Sites</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeSites.map((s) => {
                const assignedTeams = activeTeams.filter((t) => t.assignedSiteId === s.id);
                const isChecked = selectedSiteIds.includes(s.id);

                return (
                  <div
                    key={s.id}
                    className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between ${
                      s.isMainWarehouse ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
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
                              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            />
                          )}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              s.isMainWarehouse
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {s.isMainWarehouse ? 'Central HQ Warehouse' : 'Site Branch'}
                          </span>
                        </div>

                        {/* Edit & Delete Controls */}
                        {isCentralAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingSite({ ...s })}
                              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Edit Site Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!s.isMainWarehouse && (
                              <button
                                onClick={() => handleDeleteSite(s)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Move to Recycle Bin"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm mt-1">{s.name}</h3>

                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{s.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{s.contactNumber}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Supervisor: <strong>{s.supervisorName}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Assigned Crews: <strong className="font-mono text-slate-800">{assignedTeams.length}</strong></span>
                      <span className="text-[11px] text-emerald-700 font-medium">Active Status</span>
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
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center max-w-lg mx-auto my-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">User & Role Management Restricted</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Adding new user accounts, modifying credentials, and configuring permissions is restricted to <strong>Super Admin Central</strong>.
            </p>
            <div className="mt-4 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 inline-block">
              Logged in as: <strong className="text-slate-800">{currentUser.fullName}</strong> ({currentUser.role})
            </div>
          </div>
        ) : (
        <div className="space-y-5">
          {/* Company Staff Direct Login Link Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-800/60 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Company Staff Direct Login Link</span>
                    <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      Workspace: {currentTenant.slug}
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-300">
                  Provide this direct link to your company staff members for logging in. It logs them directly into <strong>{currentTenant.companyName}</strong> workspace, ensuring user accounts never overlap with other companies.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const loginUrl = getWorkspaceLoginUrl(currentTenant.slug);
                    navigator.clipboard.writeText(loginUrl);
                    setSuccessToast(`Company login link copied to clipboard! Share this URL with your staff.`);
                    setTimeout(() => setSuccessToast(null), 3500);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Login Link</span>
                </button>
              </div>
            </div>

            {/* Link Preview box */}
            <div className="mt-3.5 p-2.5 bg-black/40 rounded-xl border border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-indigo-200">
              <span className="truncate">{getWorkspaceLoginUrl(currentTenant.slug)}</span>
              <span className="text-[10px] text-slate-400 font-sans shrink-0">
                Workspace Code: <strong className="text-amber-300 font-mono">{currentTenant.slug}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* User Form */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <UserPlus className="w-4 h-4 text-slate-700" />
              <h2 className="font-semibold text-sm text-slate-900">Register New User Account</h2>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username *</label>
                <input
                  type="text"
                  placeholder="e.g. jason.site, mark.admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Jason Miller"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Site</label>
                <select
                  value={userSiteId}
                  onChange={(e) => setUserSiteId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">User Role *</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
                >
                  <option value="Super Admin Central">1. Super Admin Central (Full System & HQ Control)</option>
                  <option value="All Site Branch Admin">2. All Site Branch Admin (All Branch Supervision)</option>
                  <option value="Branch Admin">3. Branch Admin (Branch Inbound, Outbound & Teams)</option>
                  <option value="Branch System User">4. Branch System User (Standard Site Operations)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none pr-8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClearUserForm}
                  className="px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                  title="Clear all user form fields"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create User</span>
                </button>
              </div>
            </form>
          </div>

          {/* User Table with Edit & Delete */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm text-slate-900">System Users ({activeUsers.length})</h2>
              </div>

              <div className="flex items-center gap-2">
                {selectedUserIds.length > 0 && (
                  <button
                    onClick={handleBulkDeleteUsers}
                    className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedUserIds.length})</span>
                  </button>
                )}
                {activeUsers.filter((u) => u.id !== currentUser.id && !isSuperAdmin(u.role)).length > 0 && (
                  <button
                    onClick={handleClearAllUsers}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
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
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={activeUsers.length > 0 && selectedUserIds.length === activeUsers.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedUserIds(activeUsers.map((u) => u.id));
                          else setSelectedUserIds([]);
                        }}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                    </th>
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
                      'Super Admin Central': 'bg-purple-100 text-purple-900 border-purple-200',
                      'All Site Branch Admin': 'bg-blue-100 text-blue-900 border-blue-200',
                      'Branch Admin': 'bg-emerald-100 text-emerald-900 border-emerald-200',
                      'Branch System User': 'bg-slate-100 text-slate-800 border-slate-200',
                    }[norm] || 'bg-slate-100 text-slate-800 border-slate-200';

                    return (
                      <tr key={u.id} className={`hover:bg-slate-50 ${isChecked ? 'bg-slate-50' : ''}`}>
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setSelectedUserIds((prev) =>
                                prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                              )
                            }
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{u.username}</td>
                        <td className="py-2.5 px-3 text-slate-800 font-medium">
                          {u.fullName}
                          <div className="text-[10px] text-slate-500">{u.siteId === 'all' ? 'All Sites / HQ' : s?.name}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeStyles}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setCurrentUser(u);
                                showToast(`Switched active session to: ${u.fullName}`);
                              }}
                              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline mr-1"
                            >
                              Switch
                            </button>
                            <button
                              onClick={() => setEditingUser({ ...u })}
                              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Edit User Role"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Users2 className="w-4 h-4 text-slate-700" />
              <h2 className="font-semibold text-sm text-slate-900">Register Field Work Team</h2>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Team Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Echo High-Tension Stringing Squad"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Team Leader Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Connor"
                    value={teamLeaderName}
                    onChange={(e) => setTeamLeaderName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Leader NIC / Worker ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 198845123V / EMP-010"
                    value={teamLeaderIdNumber}
                    onChange={(e) => setTeamLeaderIdNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Site Base *</label>
                <select
                  value={assignedSiteId}
                  onChange={(e) => setAssignedSiteId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  {activeSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Team Members Roster with Individual Names and ID Numbers */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Team Members & ID Roster ({teamMembers.length})</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Add names & ID numbers</span>
                </div>

                {/* Input row for adding a member */}
                <div className="space-y-1.5 bg-white p-2.5 rounded-md border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Member Full Name *"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="ID / NIC Number *"
                      value={newMemberIdNumber}
                      onChange={(e) => setNewMemberIdNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono uppercase focus:outline-none focus:border-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Role / Skill (e.g. Technician)"
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-slate-800"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Phone (Optional)"
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-slate-800"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={handleAddTeamMember}
                        className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Member</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Added members list */}
                {teamMembers.length > 0 ? (
                  <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-100 bg-white rounded border border-slate-200 p-1">
                    {teamMembers.map((m, idx) => (
                      <div key={m.id} className="flex items-center justify-between px-2 py-1 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 w-4">{idx + 1}.</span>
                          <div className="truncate">
                            <span className="font-semibold text-slate-900">{m.name}</span>
                            <span className="ml-1.5 font-mono text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              {m.idNumber}
                            </span>
                            {m.role && <span className="ml-1 text-[10px] text-slate-500">({m.role})</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTeamMember(m.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 ml-2 cursor-pointer"
                          title="Remove member"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic text-center py-1">
                    No members added yet. Add individual team member names & ID numbers above.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Crew Size ({teamMembers.length > 0 ? 'Auto-Calculated' : 'Persons'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={teamMembers.length > 0 ? teamMembers.length + 1 : crewSize}
                    onChange={(e) => setCrewSize(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={teamMembers.length > 0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600"
                  />
                  {teamMembers.length > 0 && (
                    <span className="text-[10px] text-emerald-600 font-medium">1 Leader + {teamMembers.length} Members</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 789-0000"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClearTeamForm}
                  className="px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                  title="Clear all team form fields"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Field Team</span>
                </button>
              </div>
            </form>
          </div>

          {/* Teams Cards List with Edit & Delete */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-slate-900">Active Field Crews ({activeTeams.length})</h2>
              <div className="flex items-center gap-2">
                {selectedTeamIds.length > 0 && (
                  <button
                    onClick={handleBulkDeleteTeams}
                    className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedTeamIds.length})</span>
                  </button>
                )}
                {activeTeams.length > 0 && (
                  <button
                    onClick={handleClearAllTeams}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Move all field teams to Recycle Bin"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All Teams</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeTeams.map((t) => {
                const s = activeSites.find((site) => site.id === t.assignedSiteId);
                const isChecked = selectedTeamIds.includes(t.id);
                const hasMembers = t.members && t.members.length > 0;

                return (
                  <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
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
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          />
                          <h3 className="font-bold text-slate-900 text-sm">{t.teamName}</h3>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingTeam({ ...t })}
                            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Edit Team"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeam(t)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-emerald-700 font-semibold flex items-center justify-between">
                        <span>Base: {s?.name}</span>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {t.crewSize} Persons
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2">
                        <div>
                          <span className="text-slate-500">Leader: </span>
                          <strong className="text-slate-900">{t.teamLeaderName}</strong>
                          {t.teamLeaderIdNumber && (
                            <span className="ml-1.5 font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold border border-slate-200">
                              NIC: {t.teamLeaderIdNumber}
                            </span>
                          )}
                        </div>

                        {hasMembers ? (
                          <div className="text-[11px] bg-slate-50 p-2 rounded border border-slate-200 space-y-1">
                            <div className="font-bold text-slate-700 text-[10px] uppercase tracking-wider flex items-center justify-between">
                              <span>Registered Members ({t.members!.length})</span>
                            </div>
                            <div className="space-y-0.5 max-h-20 overflow-y-auto">
                              {t.members!.slice(0, 3).map((m) => (
                                <div key={m.id} className="flex items-center justify-between text-[10px]">
                                  <span className="font-medium text-slate-800 truncate">{m.name}</span>
                                  <span className="font-mono text-emerald-800 font-bold ml-1">{m.idNumber}</span>
                                </div>
                              ))}
                              {t.members!.length > 3 && (
                                <div className="text-[10px] text-slate-500 italic">
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

                        <div className="text-[11px] text-slate-500 pt-0.5">
                          Phone: <span className="font-mono text-slate-800 font-semibold">{t.contactPhone}</span>
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-slate-800" />
                <h3 className="font-bold text-base text-slate-900">Edit Registered Item</h3>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Code</label>
                <input
                  type="text"
                  value={editingItem.itemCode}
                  onChange={(e) => setEditingItem({ ...editingItem, itemCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  value={editingItem.itemName}
                  onChange={(e) => setEditingItem({ ...editingItem, itemName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price ({config.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.unitPrice}
                    onChange={(e) => setEditingItem({ ...editingItem, unitPrice: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder / Low Stock Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.lowStockThreshold}
                    onChange={(e) => setEditingItem({ ...editingItem, lowStockThreshold: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SITE MODAL */}
      {editingSite && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-slate-800" />
                <h3 className="font-bold text-base text-slate-900">Edit Site Branch</h3>
              </div>
              <button onClick={() => setEditingSite(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSiteEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Site Name</label>
                <input
                  type="text"
                  value={editingSite.name}
                  onChange={(e) => setEditingSite({ ...editingSite, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supervisor Name</label>
                <input
                  type="text"
                  value={editingSite.supervisorName}
                  onChange={(e) => setEditingSite({ ...editingSite, supervisorName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location Details</label>
                <input
                  type="text"
                  value={editingSite.location}
                  onChange={(e) => setEditingSite({ ...editingSite, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editingSite.contactNumber}
                  onChange={(e) => setEditingSite({ ...editingSite, contactNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingSite(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-slate-800" />
                <h3 className="font-bold text-base text-slate-900">Edit User Account & Role</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">User Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
                >
                  <option value="Super Admin Central">1. Super Admin Central (Full System & HQ Control)</option>
                  <option value="All Site Branch Admin">2. All Site Branch Admin (All Branch Supervision)</option>
                  <option value="Branch Admin">3. Branch Admin (Branch Inbound, Outbound & Teams)</option>
                  <option value="Branch System User">4. Branch System User (Standard Site Operations)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Site Base</label>
                <select
                  value={editingUser.siteId}
                  onChange={(e) => setEditingUser({ ...editingUser, siteId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="text"
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-slate-800" />
                <h3 className="font-bold text-base text-slate-900">Edit Field Team</h3>
              </div>
              <button onClick={() => setEditingTeam(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeamEdit} className="space-y-3.5 max-h-[80vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Team Name</label>
                <input
                  type="text"
                  value={editingTeam.teamName}
                  onChange={(e) => setEditingTeam({ ...editingTeam, teamName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Team Leader Name</label>
                  <input
                    type="text"
                    value={editingTeam.teamLeaderName}
                    onChange={(e) => setEditingTeam({ ...editingTeam, teamLeaderName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Leader NIC / Worker ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 198845123V / EMP-010"
                    value={editingTeam.teamLeaderIdNumber || ''}
                    onChange={(e) => setEditingTeam({ ...editingTeam, teamLeaderIdNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Site Base</label>
                <select
                  value={editingTeam.assignedSiteId}
                  onChange={(e) => setEditingTeam({ ...editingTeam, assignedSiteId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  {activeSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Edit Team Members Roster */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Team Members Roster ({editingTeam.members?.length || 0})</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Names & ID / NIC numbers</span>
                </div>

                {/* Add member row */}
                <div className="space-y-1.5 bg-white p-2 rounded-md border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Member Name"
                      value={editMemberName}
                      onChange={(e) => setEditMemberName(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="ID / NIC No."
                      value={editMemberIdNumber}
                      onChange={(e) => setEditMemberIdNumber(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono uppercase focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-8">
                      <input
                        type="text"
                        placeholder="Role / Skill (e.g. Technician)"
                        value={editMemberRole}
                        onChange={(e) => setEditMemberRole(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <button
                        type="button"
                        onClick={handleAddEditTeamMember}
                        className="w-full py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Member</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Existing members */}
                {editingTeam.members && editingTeam.members.length > 0 ? (
                  <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-100 bg-white rounded border border-slate-200 p-1">
                    {editingTeam.members.map((m, idx) => (
                      <div key={m.id} className="flex items-center justify-between px-2 py-1 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 w-4">{idx + 1}.</span>
                          <div className="truncate">
                            <span className="font-semibold text-slate-900">{m.name}</span>
                            <span className="ml-1.5 font-mono text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              {m.idNumber}
                            </span>
                            {m.role && <span className="ml-1 text-[10px] text-slate-500">({m.role})</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEditTeamMember(m.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 ml-2 cursor-pointer"
                          title="Remove member"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic text-center py-1">
                    No members roster added yet.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Crew Size (Persons)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingTeam.crewSize}
                    onChange={(e) => setEditingTeam({ ...editingTeam, crewSize: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editingTeam.contactPhone}
                    onChange={(e) => setEditingTeam({ ...editingTeam, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Team Changes
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
