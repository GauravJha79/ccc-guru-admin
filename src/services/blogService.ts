import { hygraphBlogService } from './hygraphBlogService';
import { BlogCategory, Blog } from '../types/database';

export const blogService = {
  // Categories
  getCategories(): Promise<BlogCategory[]> {
    return hygraphBlogService.getCategories();
  },

  createCategory(payload: {
    title: string;
    hindi_title?: string;
    slug?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<BlogCategory> {
    return hygraphBlogService.createCategory(payload);
  },

  updateCategory(id: string, updates: Partial<BlogCategory>): Promise<BlogCategory> {
    return hygraphBlogService.updateCategory(id, updates);
  },

  deleteCategory(id: string): Promise<void> {
    return hygraphBlogService.deleteCategory(id);
  },

  // Blogs / Posts
  getBlogs(): Promise<Blog[]> {
    return hygraphBlogService.getBlogs();
  },

  getBlogById(id: string): Promise<Blog | null> {
    return hygraphBlogService.getBlogById(id);
  },

  createBlog(payload: any): Promise<Blog> {
    return hygraphBlogService.createBlog(payload);
  },

  updateBlog(id: string, updates: Partial<Blog>): Promise<Blog> {
    return hygraphBlogService.updateBlog(id, updates);
  },

  deleteBlog(id: string): Promise<void> {
    return hygraphBlogService.deleteBlog(id);
  },

  // Multilingual & Translation Operations
  linkTranslations(postAId: string, postBId: string): Promise<void> {
    return hygraphBlogService.linkTranslations(postAId, postBId);
  },

  unlinkTranslation(postId: string): Promise<void> {
    return hygraphBlogService.unlinkTranslation(postId);
  },

  createTranslationDraft(sourcePostId: string): Promise<Blog> {
    return hygraphBlogService.createTranslationDraft(sourcePostId);
  },

  getEligibleTranslations(targetLanguage: 'EN' | 'HI', excludeId?: string): Promise<Blog[]> {
    return hygraphBlogService.getEligibleTranslations(targetLanguage, excludeId);
  },

  getAuthors() {
    return hygraphBlogService.getAuthors();
  },
};

export { hygraphBlogService };
