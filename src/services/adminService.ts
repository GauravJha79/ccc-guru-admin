import { supabase, isSupabaseConfigured, createIsolatedAuthClient } from '../lib/supabase';
import { AdminUser, AdminRole } from '../types/database';

export interface CreateAdminUserParams {
  name: string;
  email: string;
  role: AdminRole;
  password?: string;
  is_active?: boolean;
}

export const adminService = {
  async getAdminUsers(): Promise<AdminUser[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async createAdminUser(payload: CreateAdminUserParams): Promise<{
    admin: AdminUser;
    authUserId?: string;
    isAuthCreated: boolean;
    emailConfirmationRequired: boolean;
  }> {
    if (isSupabaseConfigured && supabase) {
      const tempClient = createIsolatedAuthClient();
      let authUserId: string | undefined = undefined;
      let isAuthCreated = false;
      let emailConfirmationRequired = false;

      // 1. Create User in Supabase Auth if a password is provided
      if (tempClient && payload.password) {
        const { data: authData, error: authError } = await tempClient.auth.signUp({
          email: payload.email,
          password: payload.password,
          options: {
            data: {
              name: payload.name,
              role: payload.role,
            },
          },
        });

        if (authError) {
          throw new Error(`Supabase Auth: ${authError.message}`);
        }

        if (authData?.user?.id) {
          authUserId = authData.user.id;
          isAuthCreated = true;
          // If session is null or confirmed_at is not set, a confirmation email was dispatched by Supabase
          if (!authData.session || !authData.user.confirmed_at) {
            emailConfirmationRequired = true;
          }
        }
      }

      // 2. Insert into public.admin_users
      const adminPayload: any = {
        name: payload.name,
        email: payload.email,
        role: payload.role,
        is_active: payload.is_active ?? true,
      };

      if (authUserId) {
        adminPayload.user_id = authUserId;
      }

      const { data, error } = await supabase
        .from('admin_users')
        .insert(adminPayload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        admin: data,
        authUserId,
        isAuthCreated,
        emailConfirmationRequired,
      };
    }

    // Mock fallback
    const mockAdmin: AdminUser = {
      id: `adm-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      is_active: payload.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { admin: mockAdmin, isAuthCreated: false, emailConfirmationRequired: true };
  },

  async updateAdminUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('admin_users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    return { id, ...updates } as AdminUser;
  },

  async deleteAdminUser(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('admin_users').delete().eq('id', id);
      if (error) throw error;
    }
  },

  async sendPasswordResetEmail(email: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
    }
  },
};
