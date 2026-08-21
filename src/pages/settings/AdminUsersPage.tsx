import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, Mail, Key, Eye, EyeOff, Sparkles, CheckCircle2, Copy, Check, Send } from 'lucide-react';
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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [role, setRole] = useState<AdminRole>('editor');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Success Confirmation Modal after creating
  const [createdSuccessData, setCreatedSuccessData] = useState<{
    name: string;
    email: string;
    role: AdminRole;
    password?: string;
    emailConfirmationRequired: boolean;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'Admin#2026!';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

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
    setPassword(generateRandomPassword());
    setShowPassword(true);
    setRole('editor');
    setIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setName(admin.name);
    setEmail(admin.email);
    setPassword('');
    setRole(admin.role);
    setIsActive(admin.is_active);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSendPasswordReset = async (adminEmail: string) => {
    try {
      await adminService.sendPasswordResetEmail(adminEmail);
      success('Recovery Email Sent', `Password reset instructions sent to ${adminEmail}`);
    } catch (err: any) {
      toastError('Reset Failed', err.message || 'Could not send reset email.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!name.trim()) errors.name = 'Full name is required.';
    if (!email.trim()) errors.email = 'Valid email is required.';

    if (!editingAdmin) {
      if (!password || password.length < 6) {
        errors.password = 'Password must be at least 6 characters long.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAdmin) {
        const payload = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          is_active: isActive,
        };
        const updated = await adminService.updateAdminUser(editingAdmin.id, payload);
        setAdminUsers((prev) =>
          prev.map((a) => (a.id === editingAdmin.id ? { ...a, ...updated } : a))
        );
        success('Admin Updated', `Saved profile for ${name}`);
      } else {
        const result = await adminService.createAdminUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          password,
          is_active: isActive,
        });

        setAdminUsers((prev) => [result.admin, ...prev]);
        setIsModalOpen(false);

        // Open detailed credential & verification modal
        setCreatedSuccessData({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          password,
          emailConfirmationRequired: result.emailConfirmationRequired,
        });
        setIsCopied(false);

        if (result.emailConfirmationRequired) {
          success(
            'Admin Created & Email Sent',
            `Verification email dispatched by Supabase to ${email}.`
          );
        } else {
          success(
            'Admin Created & Activated',
            `Account for ${name} created in Supabase Auth & admin_users.`
          );
        }
      }
    } catch (err: any) {
      toastError('Operation Failed', err.message || 'Could not create admin user.');
    } finally {
      setIsSubmitting(false);
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
      width: '130px',
      align: 'right',
      render: (item) => {
        const isSelf = item.id === currentAdmin?.id;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleSendPasswordReset(item.email)}
              className="p-1.5 text-dark-muted hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
              title="Send Password Reset Email"
            >
              <Key className="w-4 h-4" />
            </button>
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
        subtitle="Manage administrator access privileges in Supabase Auth & Database"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={isSubmitting}>
              {editingAdmin ? 'Save Changes' : 'Create in Auth & DB'}
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
            helperText={
              editingAdmin
                ? 'Email address linked to Supabase account.'
                : 'A Supabase Auth account will be created with this email.'
            }
            required
          />

          {!editingAdmin && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted">
                  Initial Password *
                </label>
                <button
                  type="button"
                  onClick={() => setPassword(generateRandomPassword())}
                  className="flex items-center gap-1 text-xs text-lavender-400 hover:text-lavender-300 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Strong</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter initial password (min 6 chars)"
                  className="w-full bg-background-elevated/70 border border-dark-border rounded-xl px-3.5 py-2.5 pr-10 text-sm text-dark-text placeholder:text-dark-dim focus:outline-none focus:border-lavender-500 focus:ring-1 focus:ring-lavender-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-dim hover:text-dark-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-xs text-rose-400 font-medium">{formErrors.password}</p>
              )}

              {/* Sync Alert Banner */}
              <div className="p-3.5 rounded-xl bg-lavender-500/10 border border-lavender-500/30 flex items-start gap-2.5 text-xs text-lavender-300 mt-2">
                <CheckCircle2 className="w-4 h-4 text-lavender-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-dark-text">Automatic Auth & DB Provisioning:</span>
                  <p className="text-dark-muted mt-0.5">
                    This admin user will be created directly in <strong>Supabase Auth</strong> and linked to the <strong>admin_users</strong> table. They can log in immediately.
                  </p>
                </div>
              </div>
            </div>
          )}

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

          {editingAdmin && (
            <div className="pt-2 border-t border-dark-border/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-dark-text">Password Reset</span>
                <p className="text-[11px] text-dark-muted">Send a password recovery email to this admin</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSendPasswordReset(email)}
                leftIcon={<Key className="w-3.5 h-3.5" />}
              >
                Send Reset Link
              </Button>
            </div>
          )}
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

      {/* Admin Created Success & Confirmation Email Modal */}
      {createdSuccessData && (
        <Modal
          isOpen={Boolean(createdSuccessData)}
          onClose={() => setCreatedSuccessData(null)}
          title="Admin Account Created"
          subtitle="Provisioned in Supabase Auth & admin_users database"
          size="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const text = `CCC Prep Admin Account:\nName: ${createdSuccessData.name}\nEmail: ${createdSuccessData.email}\nRole: ${createdSuccessData.role}\nPassword: ${createdSuccessData.password}\nLogin URL: ${window.location.origin}/login`;
                  navigator.clipboard.writeText(text);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 3000);
                }}
                leftIcon={isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              >
                {isCopied ? 'Copied to Clipboard' : 'Copy Credentials'}
              </Button>
              <Button onClick={() => setCreatedSuccessData(null)}>
                Done & Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Confirmation Email Status Card */}
            <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
              createdSuccessData.emailConfirmationRequired
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <Send className={`w-5 h-5 shrink-0 mt-0.5 ${
                createdSuccessData.emailConfirmationRequired ? 'text-amber-400' : 'text-emerald-400'
              }`} />
              <div>
                <span className="font-bold text-dark-text text-sm">
                  {createdSuccessData.emailConfirmationRequired
                    ? '📧 Confirmation Email Dispatched'
                    : '⚡ Account Active & Ready to Login'}
                </span>
                <p className="text-dark-muted mt-1 leading-relaxed">
                  {createdSuccessData.emailConfirmationRequired ? (
                    <>
                      Supabase Auth has automatically sent a <strong>verification / confirmation link</strong> to{' '}
                      <span className="text-dark-text font-semibold underline">{createdSuccessData.email}</span>.
                      Please advise the admin to check their inbox or spam folder to confirm their email before signing in.
                    </>
                  ) : (
                    <>
                      The admin user has been authorized and can sign in immediately using their email and password.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Account Credentials Box */}
            <div className="p-4 rounded-2xl bg-background-elevated/60 border border-dark-border space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-dark-dim">
                Account Credentials
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-dark-muted">Full Name</span>
                  <p className="font-bold text-dark-text mt-0.5">{createdSuccessData.name}</p>
                </div>
                <div>
                  <span className="text-dark-muted">Admin Role</span>
                  <p className="font-bold text-dark-text mt-0.5 capitalize">{createdSuccessData.role.replace('_', ' ')}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-dark-muted">Login Email</span>
                  <p className="font-mono text-dark-text font-semibold mt-0.5">{createdSuccessData.email}</p>
                </div>
                {createdSuccessData.password && (
                  <div className="col-span-2">
                    <span className="text-dark-muted">Initial Password</span>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-background-card border border-dark-border mt-1">
                      <code className="font-mono text-xs text-lavender-300 font-bold tracking-wide">
                        {createdSuccessData.password}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
