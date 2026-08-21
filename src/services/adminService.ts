import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminUser } from '../types/database';

export const adminService = {
  async getAdminUsers(): Promise<AdminUser[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async createAdminUser(payload: Omit<AdminUser, 'id' | 'created_at' | 'updated_at'>): Promise<AdminUser> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('admin_users').insert(payload).select().single();
      if (error) throw error;
      return data;
    }
    return { ...payload, id: `adm-${Date.now()}`, created_at: new Date().toISOString() };
  },

  async updateAdminUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('admin_users').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
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
};
