import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { BlogCategory, Blog } from '../types/database';

export const blogService = {
  // Categories
  async getCategories(): Promise<BlogCategory[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('blog_categories').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async createCategory(payload: Omit<BlogCategory, 'id' | 'created_at'>): Promise<BlogCategory> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('blog_categories').insert(payload).select().single();
      if (error) throw error;
      return data;
    }
    return { ...payload, id: `bcat-${Date.now()}`, created_at: new Date().toISOString() };
  },

  async updateCategory(id: string, updates: Partial<BlogCategory>): Promise<BlogCategory> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('blog_categories').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    return { id, ...updates } as BlogCategory;
  },

  async deleteCategory(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('blog_categories').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // Blogs
  async getBlogs(): Promise<Blog[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('blogs').select('*, category:blog_categories(*)').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async createBlog(payload: Omit<Blog, 'id' | 'created_at' | 'category'>): Promise<Blog> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('blogs').insert(payload).select('*, category:blog_categories(*)').single();
      if (error) throw error;
      return data;
    }
    return { ...payload, id: `blog-${Date.now()}`, created_at: new Date().toISOString() };
  },

  async updateBlog(id: string, updates: Partial<Blog>): Promise<Blog> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('blogs').update(updates).eq('id', id).select('*, category:blog_categories(*)').single();
      if (error) throw error;
      return data;
    }
    return { id, ...updates } as Blog;
  },

  async deleteBlog(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('blogs').delete().eq('id', id);
      if (error) throw error;
    }
  },
};
