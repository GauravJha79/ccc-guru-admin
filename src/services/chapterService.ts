import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Chapter } from '../types/database';

export const chapterService = {
  async getChapters(): Promise<Chapter[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('chapters').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async createChapter(payload: Omit<Chapter, 'id' | 'created_at'>): Promise<Chapter> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('chapters').insert(payload).select().single();
      if (error) throw error;
      return data;
    }
    return { ...payload, id: `ch-${Date.now()}`, created_at: new Date().toISOString() };
  },

  async updateChapter(id: string, updates: Partial<Chapter>): Promise<Chapter> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('chapters').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    return { id, ...updates } as Chapter;
  },

  async deleteChapter(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('chapters').delete().eq('id', id);
      if (error) throw error;
    }
  },
};
