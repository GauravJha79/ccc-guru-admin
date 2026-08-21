import React, { useState } from "react";
import {
  User,
  Mail,
  Shield,
  Key,
  Save,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { formatDate } from "../../lib/utils";

export const AdminProfilePage: React.FC = () => {
  const { user, updateCurrentProfile, resetPassword } = useAuth();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError("Validation", "Name cannot be blank.");
      return;
    }
    setIsSaving(true);
    try {
      await updateCurrentProfile({ name: name.trim() });
    } catch (err: any) {
      toastError("Update Failed", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResetting(true);
    await resetPassword(user.email);
    setIsResetting(false);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Profile Header Card */}
      <div className="p-6 rounded-3xl bg-background-card border border-dark-border shadow-card flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-lavender-600 via-lavender-500 to-indigo-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-glow border border-lavender-400/40">
          {user?.name ? user.name[0].toUpperCase() : "A"}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-extrabold text-white">
              {user?.name || "Administrator"}
            </h2>
            <Badge variant="primary">
              {user?.role?.replace("_", " ") || "Super Admin"}
            </Badge>
          </div>
          <p className="text-xs text-dark-muted">{user?.email}</p>
          <p className="text-[11px] text-dark-dim pt-1">
            Registered: {formatDate(user?.created_at)}
          </p>
        </div>
      </div>

      {/* Profile Edit Form */}
      <div className="p-6 rounded-3xl bg-background-card border border-dark-border shadow-card space-y-6">
        <div className="border-b border-dark-border/80 pb-4">
          <h3 className="text-base font-bold text-white">Profile Details</h3>
          <p className="text-xs text-dark-muted">
            Update your display name and administrative credentials
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Admin Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Email Address (Login Identity)"
              value={email}
              disabled
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="Contact Super Admin to change primary email address."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Role"
              value={user?.role?.toUpperCase() || "SUPER_ADMIN"}
              disabled
              leftIcon={<Shield className="w-4 h-4" />}
            />
            <Input
              label="Account Status"
              value={user?.is_active ? "Active & Authorized" : "Inactive"}
              disabled
              leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            />
          </div>

          <div className="pt-3">
            <Button
              type="submit"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Security & Password Reset */}
      <div className="p-6 rounded-3xl bg-background-card border border-dark-border shadow-card space-y-4">
        <div className="border-b border-dark-border/80 pb-4">
          <h3 className="text-base font-bold text-white">
            Security & Password
          </h3>
          <p className="text-xs text-dark-muted">
            Send a password reset link to your email
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">
              Password Recovery
            </p>
            <p className="text-xs text-dark-muted mt-0.5">
              A secure password reset authorization link will be sent to{" "}
              {user?.email}.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePasswordReset}
            isLoading={isResetting}
            leftIcon={<Key className="w-4 h-4" />}
          >
            Send Reset Email
          </Button>
        </div>
      </div>
    </div>
  );
};
