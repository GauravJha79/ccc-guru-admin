import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, Mail } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { AdminUser, AdminRole } from '../../types/database';
import { adminService } from '../../services/adminService';
import { DataTable, Column } from '../../components/common/DataTable';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Switch } from '../../components/common/Switch';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../lib/utils';
import { ADMIN_ROLE_OPTIONS } from '../../constants/config';

export const AdminUsersPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('editor');
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAdminUsers();
      setAdminUsers(data);
    } catch (err: any) {
      toastError('Fetch Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const openCreateModal = () => {
    setEditingAdmin(null);
    setName('');
    setEmail('');
    setRole('editor');
    setIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setName(admin.name);
    setEmail(admin.email);
    setRole(admin.role);
    setIsActive(admin.is_active);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!name.trim()) errors.name = 'Full name is required.';
    if (!email.trim()) errors.email = 'Valid email is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        is_active: isActive,
      };

      if (editingAdmin) {
        const updated = await adminService.updateAdminUser(editingAdmin.id, payload);
        setAdminUsers((prev) =>
          prev.map((a) => (a.id === editingAdmin.id ? { ...a, ...updated } : a))
        );
        success('Admin Updated', `Saved profile for ${name}`);
      } else {
        const created = await adminService.createAdminUser(payload);
        setAdminUsers((prev) => [...prev, created]);
        success(
          'Admin Created',
          `Added ${name} to admin_users in Supabase.`
        );
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not save admin user.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminService.deleteAdminUser(deleteTarget.id);
      setAdminUsers((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      success('Admin Deleted', `${deleteTarget.name} was removed from admin_users.`);
      setDeleteTarget(null);
    } catch (err: any) {
      toastError('Delete Failed', err.message || 'Could not delete admin user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAdmins = adminUsers.filter((a) => {
    const query = searchQuery.toLowerCase();
    const matchSearch = a.name.toLowerCase().includes(query) || a.email.toLowerCase().includes(query);
    const matchRole = roleFilter === '' ? true : a.role === roleFilter;
    const matchStatus =
      statusFilter === '' ? true : statusFilter === 'active' ? a.is_active : !a.is_active;

    return matchSearch && matchRole && matchStatus;
  });

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'Admin Staff & Email',
      render: (item) => {
        const isSelf = item.id === currentAdmin?.id;
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-lavender-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
              {item.name ? item.name[0].toUpperCase() : 'A'}
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs truncate">{item.name}</span>
                {isSelf && (
                  <Badge variant="primary" size="sm">
                    You
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-dark-muted truncate">
                <Mail className="w-3 h-3 text-dark-dim" />
                <span>{item.email}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      header: 'Role & Permissions',
      width: '160px',
      render: (item) => (
        <Badge variant={item.role === 'super_admin' ? 'primary' : 'neutral'} size="sm">
          <ShieldCheck className="w-3 h-3 mr-1" />
          {item.role === 'super_admin' ? 'Super Admin' : 'Editor'}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Account Status',
      width: '130px',
      render: (item) => (
        <Badge variant={item.is_active ? 'success' : 'danger'} dot>
          {item.is_active ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Registered',
      width: '140px',
      render: (item) => (
        <span className="text-xs text-dark-muted">{formatDate(item.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '110px',
      align: 'right',
      render: (item) => {
        const isSelf = item.id === currentAdmin?.id;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => openEditModal(item)}
              className="p-1.5 text-dark-muted hover:text-lavender-300 hover:bg-lavender-500/10 rounded-lg transition-colors"
              title="Edit Admin"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(item)}
              disabled={isSelf}
              className={`p-1.5 rounded-lg transition-colors ${
                isSelf
                  ? 'text-dark-dim opacity-30 cursor-not-allowed'
                  : 'text-dark-muted hover:text-rose-400 hover:bg-rose-500/10'
              }`}
              title={isSelf ? 'Cannot delete own account' : 'Delete Admin'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search admin staff by name or email..."
        filters={[
          {
            key: 'role',
            label: 'Role',
            value: roleFilter,
            options: ADMIN_ROLE_OPTIONS,
            onChange: setRoleFilter,
          },
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            options: [
              { value: 'active', label: 'Active Only' },
              { value: 'inactive', label: 'Deactivated Only' },
            ],
            onChange: setStatusFilter,
          },
        ]}
        hasActiveFilters={Boolean(searchQuery || roleFilter || statusFilter)}
        onClearFilters={() => {
          setSearchQuery('');
          setRoleFilter('');
          setStatusFilter('');
        }}
        actionButton={{
          label: 'Add Admin',
          onClick: openCreateModal,
        }}
      />

      <DataTable
        columns={columns}
        data={filteredAdmins}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        emptyTitle="No admin users found in Supabase"
        emptyDescription="Only authorized accounts in admin_users can sign in to this portal."
        emptyActionText="Add Admin Staff"
        onEmptyAction={openCreateModal}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAdmin ? 'Edit Admin User' : 'Authorize New Admin'}
        subtitle="Manage administrator access privileges in Supabase"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingAdmin ? 'Save Changes' : 'Authorize Admin'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Gaurav Jha"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={formErrors.name}
            required
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="admin@cccprep.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={formErrors.email}
            helperText="The user must sign up or be created in Supabase Auth with this exact email."
            required
          />

          <Select
            label="Admin Role"
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            options={ADMIN_ROLE_OPTIONS}
          />

          <div className="pt-2">
            <Switch
              checked={isActive}
              onChange={setIsActive}
              label="Account Active Status"
              description="Deactivating revokes panel access immediately."
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Revoke Admin Access"
        message={`Are you sure you want to remove ${deleteTarget?.name} (${deleteTarget?.email}) from the admin_users table in Supabase?`}
      />
    </div>
  );
};
