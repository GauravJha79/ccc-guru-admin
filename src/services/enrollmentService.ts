import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SeriesEnrollment } from '../types/database';

export const enrollmentService = {
  async getEnrollments(): Promise<SeriesEnrollment[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('series_enrollments')
        .select('*, series:test_series(*)')
        .order('enrolled_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async createEnrollment(
    payload: Omit<SeriesEnrollment, 'id' | 'enrolled_at' | 'series'>
  ): Promise<SeriesEnrollment> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('series_enrollments')
        .insert(payload)
        .select('*, series:test_series(*)')
        .single();
      if (error) throw error;
      return data;
    }
    return {
      ...payload,
      id: `enr-${Date.now()}`,
      enrolled_at: new Date().toISOString(),
    } as SeriesEnrollment;
  },

  async updateEnrollment(
    id: string,
    updates: Partial<SeriesEnrollment>
  ): Promise<SeriesEnrollment> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('series_enrollments')
        .update(updates)
        .eq('id', id)
        .select('*, series:test_series(*)')
        .single();
      if (error) throw error;
      return data;
    }
    return { id, ...updates } as SeriesEnrollment;
  },

  async updateEnrollmentStatus(id: string, status: SeriesEnrollment['status']): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('series_enrollments').update({ status }).eq('id', id);
      if (error) throw error;
    }
  },

  async deleteEnrollment(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('series_enrollments').delete().eq('id', id);
      if (error) throw error;
    }
  },
};
