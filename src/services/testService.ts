import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TestCategory, TestSeries, TestSeriesItem, TestQuestion } from '../types/database';

export const testService = {
  // Test Categories
  async getCategories(): Promise<TestCategory[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('test_categories').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async createCategory(payload: Omit<TestCategory, 'id' | 'created_at'>): Promise<TestCategory> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('test_categories').insert(payload).select().single();
      if (error) throw error;
      return data;
    }
    return { ...payload, id: `tcat-${Date.now()}`, created_at: new Date().toISOString() };
  },

  async updateCategory(id: string, updates: Partial<TestCategory>): Promise<TestCategory> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('test_categories').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    return { id, ...updates } as TestCategory;
  },

  async deleteCategory(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('test_categories').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // Test Series
  async getSeries(): Promise<TestSeries[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('test_series').select('*, category:test_categories(*)').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async getSeriesById(id: string): Promise<TestSeries | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('test_series').select('*, category:test_categories(*)').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    }
    return null;
  },

  async createSeries(payload: Omit<TestSeries, 'id' | 'created_at' | 'last_updated_at' | 'updated_at' | 'category'>): Promise<TestSeries> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('test_series').insert(payload).select('*, category:test_categories(*)').single();
      if (error) throw error;
      return data;
    }
    return { ...payload, id: `tser-${Date.now()}`, created_at: new Date().toISOString(), last_updated_at: new Date().toISOString() } as TestSeries;
  },

  async updateSeries(id: string, updates: Partial<TestSeries>): Promise<TestSeries> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('test_series').update({ ...updates, last_updated_at: new Date().toISOString() }).eq('id', id).select('*, category:test_categories(*)').single();
      if (error) throw error;
      return data;
    }
    return { id, ...updates, last_updated_at: new Date().toISOString() } as TestSeries;
  },

  async deleteSeries(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('test_series').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // Test Series Items (Sets)
  async getSeriesItems(): Promise<TestSeriesItem[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('test_series_items')
        .select('*, series:test_series(*)')
        .order('sort_order', { ascending: true });
      if (error) throw error;

      // Efficiently aggregate question counts for each test series item
      const counts: Record<string, number> = {};
      try {
        let from = 0;
        const PAGE_SIZE = 1000;
        let hasMore = true;
        while (hasMore) {
          const { data: qData, error: qErr } = await supabase
            .from('questions')
            .select('test_ids')
            .not('test_ids', 'eq', '{}')
            .range(from, from + PAGE_SIZE - 1);

          if (qErr) break;
          if (qData && qData.length > 0) {
            for (const row of qData) {
              if (Array.isArray(row.test_ids)) {
                for (const tid of row.test_ids) {
                  counts[tid] = (counts[tid] || 0) + 1;
                }
              }
            }
            if (qData.length < PAGE_SIZE) hasMore = false;
            else from += PAGE_SIZE;
          } else {
            hasMore = false;
          }
        }
      } catch (err) {
        console.warn('Could not aggregate question counts for test items:', err);
      }

      return (data || []).map((item: any) => ({
        ...item,
        assigned_questions_count: counts[item.id] || 0,
      }));
    }
    return [];
  },

  async syncSeriesSetsCount(seriesId: string): Promise<number> {
    if (!isSupabaseConfigured || !supabase || !seriesId) return 0;
    try {
      const { count, error } = await supabase
        .from('test_series_items')
        .select('id', { count: 'exact', head: true })
        .eq('series_id', seriesId);

      if (!error && count !== null) {
        await supabase
          .from('test_series')
          .update({ total_sets_available: count })
          .eq('id', seriesId);
        return count;
      }
    } catch (e) {
      console.warn('Failed to sync total_sets_available:', e);
    }
    return 0;
  },

  async createSeriesItem(payload: Omit<TestSeriesItem, 'id' | 'created_at' | 'updated_at' | 'negative_marking' | 'series' | 'assigned_questions_count'>): Promise<TestSeriesItem> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('test_series_items').insert(payload).select('*, series:test_series(*)').single();
      if (error) throw error;
      if (payload.series_id) {
        await this.syncSeriesSetsCount(payload.series_id);
      }
      return data;
    }
    return { ...payload, id: `item-${Date.now()}`, created_at: new Date().toISOString() } as TestSeriesItem;
  },

  async updateSeriesItem(id: string, updates: Partial<TestSeriesItem>): Promise<TestSeriesItem> {
    if (isSupabaseConfigured && supabase) {
      // If series_id is changing, get the old series_id to sync both
      let oldSeriesId: string | null = null;
      if (updates.series_id) {
        const { data: current } = await supabase.from('test_series_items').select('series_id').eq('id', id).single();
        oldSeriesId = current?.series_id || null;
      }

      const { data, error } = await supabase.from('test_series_items').update(updates).eq('id', id).select('*, series:test_series(*)').single();
      if (error) throw error;

      if (updates.series_id) {
        await this.syncSeriesSetsCount(updates.series_id);
        if (oldSeriesId && oldSeriesId !== updates.series_id) {
          await this.syncSeriesSetsCount(oldSeriesId);
        }
      }
      return data;
    }
    return { id, ...updates } as TestSeriesItem;
  },

  async deleteSeriesItem(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { data: item } = await supabase.from('test_series_items').select('series_id').eq('id', id).single();
      const { error } = await supabase.from('test_series_items').delete().eq('id', id);
      if (error) throw error;
      if (item?.series_id) {
        await this.syncSeriesSetsCount(item.series_id);
      }
    }
  },
};
