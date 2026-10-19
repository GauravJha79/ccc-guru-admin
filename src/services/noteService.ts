import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { NoteCategory, Note } from '../types/database';

export const noteService = {
  // Categories
  async getCategories(): Promise<NoteCategory[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('note_categories').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async createCategory(payload: Omit<NoteCategory, 'id' | 'created_at'>): Promise<NoteCategory> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('note_categories').insert(payload).select().single();
      if (error) throw error;
      return data;
    }
    return { ...payload, id: `ncat-${Date.now()}`, created_at: new Date().toISOString() };
  },

  async updateCategory(id: string, updates: Partial<NoteCategory>): Promise<NoteCategory> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('note_categories').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    return { id, ...updates } as NoteCategory;
  },

  async deleteCategory(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('note_categories').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // Notes
  async getNotes(): Promise<Note[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('notes')
        .select('*, category:note_categories(*)')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async createNote(payload: Omit<Note, 'id' | 'created_at' | 'category'>): Promise<Note> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('notes').insert(payload).select('*, category:note_categories(*)').single();
      if (error) throw error;
      return data;
    }
    return { ...payload, id: `note-${Date.now()}`, created_at: new Date().toISOString() };
  },

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('notes').update(updates).eq('id', id).select('*, category:note_categories(*)').single();
      if (error) throw error;
      return data;
    }
    return { id, ...updates } as Note;
  },

  async deleteNote(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    }
  },

  async reorderNotes(items: { id: string; sort_order: number }[]): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      await Promise.all(
        items.map((item) =>
          client
            .from('notes')
            .update({ sort_order: item.sort_order })
            .eq('id', item.id)
        )
      );
    }
  },
};
