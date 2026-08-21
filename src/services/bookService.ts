import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { BookCategory, Book, BookLink } from '../types/database';

export const bookService = {
  // Categories
  async getCategories(): Promise<BookCategory[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('book_categories').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async createCategory(payload: Omit<BookCategory, 'id' | 'created_at'>): Promise<BookCategory> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('book_categories').insert(payload).select().single();
      if (error) throw error;
      return data;
    }
    return { ...payload, id: `bkcat-${Date.now()}`, created_at: new Date().toISOString() };
  },

  async updateCategory(id: string, updates: Partial<BookCategory>): Promise<BookCategory> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('book_categories').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    return { id, ...updates } as BookCategory;
  },

  async deleteCategory(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('book_categories').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // Books
  async getBooks(): Promise<Book[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('books').select('*, category:book_categories(*)').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async createBook(payload: Omit<Book, 'id' | 'created_at' | 'category'>): Promise<Book> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('books').insert(payload).select('*, category:book_categories(*)').single();
      if (error) throw error;
      return data;
    }
    return { ...payload, id: `book-${Date.now()}`, created_at: new Date().toISOString() };
  },

  async updateBook(id: string, updates: Partial<Book>): Promise<Book> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('books').update(updates).eq('id', id).select('*, category:book_categories(*)').single();
      if (error) throw error;
      return data;
    }
    return { id, ...updates } as Book;
  },

  async deleteBook(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // Book Retailer Links
  async getBookLinks(bookId: string): Promise<BookLink[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('book_links').select('*').eq('book_id', bookId).order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async createBookLink(payload: Omit<BookLink, 'id' | 'created_at'>): Promise<BookLink> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('book_links').insert(payload).select().single();
      if (error) throw error;
      return data;
    }
    return { ...payload, id: `bl-${Date.now()}`, created_at: new Date().toISOString() };
  },

  async updateBookLink(id: string, updates: Partial<BookLink>): Promise<BookLink> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('book_links').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    return { id, ...updates } as BookLink;
  },

  async deleteBookLink(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('book_links').delete().eq('id', id);
      if (error) throw error;
    }
  },
};
