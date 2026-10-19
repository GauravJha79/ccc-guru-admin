import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit2,
  Trash2,
  Eye,
  Calendar,
  User as UserIcon,
  Sparkles,
  Globe,
  Languages,
  Link2,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  Plus,
  LayoutGrid,
  List,
  Search,
  Check,
  Copy,
  Clock,
  ArrowRight,
  BookOpen,
  Layers,
  CheckCircle2,
  FileText,
  Star,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Blog, BlogCategory, ArticleLanguage } from '../../types/database';
import { blogService } from '../../services/blogService';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../lib/utils';
import { ROUTES } from '../../constants/routes';
import { AiBlogGenerateModal } from './AiBlogGenerateModal';

export const BlogsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [translationFilter, setTranslationFilter] = useState<string>('');

  // View mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Pagination (12 items per page for clean 3-col grid layout)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Modals & Dialogs
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [previewBlog, setPreviewBlog] = useState<Blog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  // Quick copied feedback tracker per card
  const [copiedSlugId, setCopiedSlugId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [blogsData, catsData] = await Promise.all([
        blogService.getBlogs(),
        blogService.getCategories(),
      ]);
      setBlogs(blogsData);
      setBlogCategories(catsData);
    } catch (err: any) {
      toastError('Fetch Error', err.message || 'Failed to fetch blogs from Hygraph');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await blogService.deleteBlog(deleteTarget.id);
      setBlogs((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      success(
        'Article Removed',
        `"${deleteTarget.title}" was removed from Hygraph. Translated counterpart preserved.`
      );
      setDeleteTarget(null);
    } catch (err: any) {
      toastError('Delete Failed', err.message || 'Could not delete article.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async (e: React.MouseEvent, blog: Blog) => {
    e.stopPropagation();
    try {
      const nextStatus = !blog.is_published;
      const updated = await blogService.updateBlog(blog.id, {
        is_published: nextStatus,
        published_at: nextStatus ? blog.published_at || new Date().toISOString() : undefined,
      });
      setBlogs((prev) => prev.map((b) => (b.id === blog.id ? { ...b, ...updated } : b)));
      success(nextStatus ? 'Article Published Live' : 'Article Moved to Draft', blog.title);
    } catch (err: any) {
      toastError('Update Failed', err.message);
    }
  };

  const handleCreateTranslationDraft = async (e: React.MouseEvent, sourceBlog: Blog) => {
    e.stopPropagation();
    setIsCreatingDraft(true);
    try {
      const targetLang = sourceBlog.language === 'EN' ? 'Hindi' : 'English';
      const newDraft = await blogService.createTranslationDraft(sourceBlog.id);
      success(
        'Translation Draft Created',
        `Created new ${targetLang} draft. Opening editor studio...`
      );
      navigate(`/blogs/edit/${newDraft.id}`);
    } catch (err: any) {
      toastError('Draft Creation Failed', err.message);
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleCopyPermalink = (e: React.MouseEvent, blog: Blog) => {
    e.stopPropagation();
    const urlPrefix = blog.language === 'EN' ? '/en/blogs/' : '/hi/blogs/';
    const fullUrl = `https://www.cccguru.in${urlPrefix}${blog.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlugId(blog.id);
    setTimeout(() => setCopiedSlugId(null), 2000);
  };

  // Filtered dataset
  const filteredBlogs = blogs.filter((b) => {
    const query = searchQuery.toLowerCase().trim();
    const matchSearch =
      !query ||
      b.title.toLowerCase().includes(query) ||
      b.slug.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query) ||
      (b.excerpt && b.excerpt.toLowerCase().includes(query)) ||
      (b.title_en && b.title_en.toLowerCase().includes(query)) ||
      (b.title_hi && b.title_hi.toLowerCase().includes(query));

    const matchCategory = categoryFilter === '' ? true : b.category_id === categoryFilter;
    const matchPublished =
      publishedFilter === '' ? true : publishedFilter === 'published' ? b.is_published : !b.is_published;
    const matchFeatured =
      featuredFilter === '' ? true : featuredFilter === 'featured' ? b.is_featured : !b.is_featured;
    const matchLanguage = languageFilter === '' ? true : b.language === languageFilter;
    const matchTranslation =
      translationFilter === ''
        ? true
        : translationFilter === 'linked'
        ? Boolean(b.linked_translation)
        : !b.linked_translation;

    return (
      matchSearch &&
      matchCategory &&
      matchPublished &&
      matchFeatured &&
      matchLanguage &&
      matchTranslation
    );
  });

  const totalPages = Math.ceil(filteredBlogs.length / pageSize);
  const paginatedBlogs = filteredBlogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Metrics counts
  const totalCount = blogs.length;
  const enCount = blogs.filter((b) => b.language === 'EN').length;
  const hiCount = blogs.filter((b) => b.language === 'HI').length;
  const missingTranslationCount = blogs.filter((b) => !b.linked_translation).length;
  const publishedCount = blogs.filter((b) => b.is_published).length;
  const draftCount = totalCount - publishedCount;

  const hasActiveFilters = Boolean(
    searchQuery ||
      categoryFilter ||
      publishedFilter ||
      featuredFilter ||
      languageFilter ||
      translationFilter
  );

  const clearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setPublishedFilter('');
    setFeaturedFilter('');
    setLanguageFilter('');
    setTranslationFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* 1. TOP HEADER & PRIMARY ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-dark-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Articles & Guides
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-lavender-500/10 border border-lavender-500/30 text-lavender-300 text-xs font-semibold">
              Hygraph CMS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-dark-muted">
            Manage multilingual NIELIT CCC exam articles, study notes, and independent Hindi/English translations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsAiModalOpen(true)}
            leftIcon={<Sparkles className="w-4 h-4 text-lavender-400 animate-pulse" />}
            className="bg-lavender-500/10 hover:bg-lavender-500/20 border-lavender-500/30 text-lavender-200 text-xs sm:text-sm font-semibold"
          >
            Generate with AI
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(ROUTES.BLOG_CREATE)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs sm:text-sm font-bold shadow-lg shadow-lavender-500/20"
          >
            Write Article
          </Button>
        </div>
      </div>

      {/* 2. KPI / METRICS SUMMARY TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Articles */}
        <div className="p-3.5 rounded-2xl bg-background-elevated/80 border border-dark-border flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-dark-muted uppercase tracking-wider">
              Total Posts
            </span>
            <div className="text-xl font-extrabold text-white">{totalCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-dark-muted">
            <BookOpen className="w-4 h-4 text-slate-300" />
          </div>
        </div>

        {/* English Articles */}
        <div
          onClick={() => {
            setLanguageFilter(languageFilter === 'EN' ? '' : 'EN');
            setCurrentPage(1);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            languageFilter === 'EN'
              ? 'bg-blue-500/20 border-blue-500/50 shadow-md shadow-blue-500/10'
              : 'bg-background-elevated/80 border-dark-border hover:border-blue-500/30'
          }`}
          title="Click to filter English articles"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">
                English
              </span>
              <div className="text-xl font-extrabold text-white">{enCount}</div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-xs">
              EN
            </div>
          </div>
        </div>

        {/* Hindi Articles */}
        <div
          onClick={() => {
            setLanguageFilter(languageFilter === 'HI' ? '' : 'HI');
            setCurrentPage(1);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            languageFilter === 'HI'
              ? 'bg-emerald-500/20 border-emerald-500/50 shadow-md shadow-emerald-500/10'
              : 'bg-background-elevated/80 border-dark-border hover:border-emerald-500/30'
          }`}
          title="Click to filter Hindi articles"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                हिन्दी (Hindi)
              </span>
              <div className="text-xl font-extrabold text-white">{hiCount}</div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-xs">
              HI
            </div>
          </div>
        </div>

        {/* Missing Translations */}
        <div
          onClick={() => {
            setTranslationFilter(translationFilter === 'missing' ? '' : 'missing');
            setCurrentPage(1);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            translationFilter === 'missing'
              ? 'bg-amber-500/20 border-amber-500/50 shadow-md shadow-amber-500/10'
              : 'bg-background-elevated/80 border-dark-border hover:border-amber-500/30'
          }`}
          title="Click to filter articles needing translation"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
                Needs Translation
              </span>
              <div className="text-xl font-extrabold text-amber-400">{missingTranslationCount}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Published Live vs Draft */}
        <div
          onClick={() => {
            setPublishedFilter(publishedFilter === 'published' ? '' : 'published');
            setCurrentPage(1);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            publishedFilter === 'published'
              ? 'bg-lavender-500/20 border-lavender-500/50 shadow-md shadow-lavender-500/10'
              : 'bg-background-elevated/80 border-dark-border hover:border-lavender-500/30'
          }`}
          title="Click to filter published articles"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-lavender-300 uppercase tracking-wider">
                Live / Draft
              </span>
              <div className="text-xl font-extrabold text-white">
                <span className="text-emerald-400">{publishedCount}</span>
                <span className="text-dark-muted font-normal text-sm"> / {draftCount}</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-lavender-500/10 border border-lavender-500/20 flex items-center justify-center text-lavender-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. MODERN SEARCH, FILTER & VIEW CONTROLS */}
      <div className="p-4 rounded-2xl bg-background-elevated/80 border border-dark-border space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by article title, slug, excerpt, or author..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-dark-border text-xs sm:text-sm text-white placeholder:text-dark-dim focus:outline-none focus:border-lavender-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-white text-xs font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* View mode toggle + count indicator */}
          <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0">
            <span className="text-xs text-dark-muted font-mono">
              Showing <span className="font-bold text-white">{filteredBlogs.length}</span> of {totalCount}
            </span>

            {/* Grid vs List view switcher */}
            <div className="flex items-center rounded-xl bg-background p-1 border border-dark-border">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-lavender-500/20 text-lavender-300 border border-lavender-500/30'
                    : 'text-dark-muted hover:text-white'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-lavender-500/20 text-lavender-300 border border-lavender-500/30'
                    : 'text-dark-muted hover:text-white'
                }`}
                title="Compact List View"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown filters bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-wrap sm:flex-nowrap">
          {/* Language filter */}
          <select
            value={languageFilter}
            onChange={(e) => {
              setLanguageFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-background border border-dark-border text-xs text-dark-text focus:outline-none focus:border-lavender-500"
          >
            <option value="">All Languages</option>
            <option value="EN">English Only (EN)</option>
            <option value="HI">हिन्दी Only (HI)</option>
          </select>

          {/* Translation Status filter */}
          <select
            value={translationFilter}
            onChange={(e) => {
              setTranslationFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-background border border-dark-border text-xs text-dark-text focus:outline-none focus:border-lavender-500"
          >
            <option value="">All Translation States</option>
            <option value="linked">Linked Translations Only</option>
            <option value="missing">Missing Translations Only</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-background border border-dark-border text-xs text-dark-text focus:outline-none focus:border-lavender-500"
          >
            <option value="">All Categories</option>
            {blogCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Publication status */}
          <select
            value={publishedFilter}
            onChange={(e) => {
              setPublishedFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-background border border-dark-border text-xs text-dark-text focus:outline-none focus:border-lavender-500"
          >
            <option value="">All Statuses</option>
            <option value="published">Published Live</option>
            <option value="draft">Drafts Only</option>
          </select>

          {/* Featured filter */}
          <select
            value={featuredFilter}
            onChange={(e) => {
              setFeaturedFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-background border border-dark-border text-xs text-dark-text focus:outline-none focus:border-lavender-500"
          >
            <option value="">Featured: All</option>
            <option value="featured">Featured Only</option>
            <option value="standard">Standard Only</option>
          </select>

          {/* Clear active filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-500/10 transition-colors ml-auto flex-shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. MAIN ARTICLE DISPLAY: CARD GRID OR COMPACT LIST */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-dark-border bg-background-elevated/40 p-4 space-y-4 animate-pulse"
            >
              <div className="w-full aspect-video rounded-xl bg-white/5" />
              <div className="h-4 bg-white/10 rounded w-1/3" />
              <div className="h-6 bg-white/10 rounded w-3/4" />
              <div className="h-12 bg-white/5 rounded" />
              <div className="h-14 bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      ) : paginatedBlogs.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl bg-background-elevated/40 border border-dashed border-dark-border space-y-4 max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-lavender-500/10 border border-lavender-500/20 flex items-center justify-center text-lavender-400 mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No articles found</h3>
            <p className="text-xs text-dark-muted leading-relaxed">
              {hasActiveFilters
                ? 'Try broadening your search or adjusting your language/category filters.'
                : 'Start by creating your first multilingual study guide or exam notification.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(ROUTES.BLOG_CREATE)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Write First Article
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* ------------------ CARD GRID VIEW ------------------ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedBlogs.map((blog) => {
            const category = blogCategories.find((c) => c.id === blog.category_id);
            const isEnglish = blog.language === 'EN';
            const counterpartLang = isEnglish ? 'Hindi' : 'English';
            const urlPrefix = isEnglish ? '/en/blogs/' : '/hi/blogs/';
            const wordCount = blog.content ? blog.content.split(/\s+/).filter(Boolean).length : 0;
            const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

            return (
              <div
                key={blog.id}
                className="group relative rounded-2xl bg-background-elevated/70 hover:bg-background-elevated border border-dark-border hover:border-lavender-500/40 transition-all duration-300 flex flex-col overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-lavender-500/10"
              >
                {/* A. 16:9 Banner Image Area */}
                <div
                  className="relative aspect-video w-full overflow-hidden bg-slate-900 cursor-pointer"
                  onClick={() => navigate(`/blogs/edit/${blog.id}`)}
                >
                  {blog.featured_image ? (
                    <img
                      src={blog.featured_image}
                      alt={blog.featured_image_alt || blog.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    /* Branded Fallback Banner */
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-4 text-center">
                      <BookOpen className="w-8 h-8 text-lavender-400/60 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        {category?.title || 'NIELIT CCC Study Guide'}
                      </span>
                    </div>
                  )}

                  {/* Gradient bottom overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background-elevated via-transparent to-black/30 pointer-events-none" />

                  {/* Top-Left Badges: Language & Live Status */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap z-10">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-md shadow-md ${
                        isEnglish
                          ? 'bg-blue-600/80 text-white border border-blue-400/40'
                          : 'bg-emerald-600/80 text-white border border-emerald-400/40'
                      }`}
                    >
                      {isEnglish ? 'EN English' : 'HI हिन्दी'}
                    </span>

                    {/* Toggle Live/Draft pill button */}
                    <button
                      type="button"
                      onClick={(e) => handleTogglePublish(e, blog)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-md border transition-all ${
                        blog.is_published
                          ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-500/40'
                      }`}
                      title="Click to toggle Live/Draft status in Hygraph"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          blog.is_published ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                        }`}
                      />
                      <span>{blog.is_published ? 'Live' : 'Draft'}</span>
                    </button>
                  </div>

                  {/* Top-Right Badges: Featured Star & Quick Preview */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                    {blog.is_featured && (
                      <span className="p-1 rounded-md bg-amber-500/80 text-white backdrop-blur-md shadow-md" title="Featured Article">
                        <Star className="w-3.5 h-3.5 fill-white" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewBlog(blog);
                      }}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white/90 hover:text-white backdrop-blur-md transition-colors"
                      title="Quick Preview Article"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* B. Card Content Area */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-2">
                    {/* Meta: Category & Reading Time */}
                    <div className="flex items-center justify-between text-[11px] text-dark-muted font-medium">
                      <span className="text-lavender-400 font-bold uppercase tracking-wider">
                        {category?.title || 'General'}
                      </span>
                      <span className="flex items-center gap-1 text-dark-dim">
                        <Clock className="w-3 h-3" />
                        {readTimeMin} min read
                      </span>
                    </div>

                    {/* Article Title */}
                    <h2
                      onClick={() => navigate(`/blogs/edit/${blog.id}`)}
                      className="text-sm sm:text-base font-bold text-white group-hover:text-lavender-300 transition-colors line-clamp-2 leading-snug cursor-pointer"
                      title={blog.title}
                    >
                      {blog.title}
                    </h2>

                    {/* Excerpt snippet */}
                    {blog.excerpt && (
                      <p className="text-xs text-dark-muted line-clamp-2 leading-relaxed">
                        {blog.excerpt}
                      </p>
                    )}

                    {/* Permalink Preview & Copy */}
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-dark-border/40 text-[11px] font-mono text-dark-dim">
                      <div className="truncate text-dark-muted">
                        <span className="text-dark-dim">{urlPrefix}</span>
                        <span className="text-slate-300 font-semibold">{blog.slug}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopyPermalink(e, blog)}
                        className="p-1 rounded text-dark-muted hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
                        title="Copy full public URL"
                      >
                        {copiedSlugId === blog.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* C. Translation Group Linking Block */}
                  <div className="pt-2">
                    {blog.linked_translation ? (
                      /* Counterpart is Linked */
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/blogs/edit/${blog.linked_translation!.id}`);
                        }}
                        className="p-2.5 rounded-xl bg-background border border-emerald-500/20 hover:border-emerald-500/40 space-y-1 transition-colors cursor-pointer group/trans"
                        title={`Click to open ${counterpartLang} article in editor`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1 font-bold text-emerald-400">
                            <Link2 className="w-3 h-3" />
                            <span>{counterpartLang} Linked</span>
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              blog.linked_translation.is_published
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {blog.linked_translation.is_published ? 'Live' : 'Draft'}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/90 font-medium truncate group-hover/trans:text-lavender-300 transition-colors">
                          {blog.linked_translation.title}
                        </p>
                      </div>
                    ) : (
                      /* Counterpart is Missing */
                      <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            <span>{counterpartLang} Missing</span>
                          </span>
                          <p className="text-[10px] text-dark-dim truncate">
                            SEO requires {counterpartLang} counterpart
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleCreateTranslationDraft(e, blog)}
                          disabled={isCreatingDraft}
                          className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-white text-[10px] font-bold whitespace-nowrap transition-colors flex items-center gap-1 flex-shrink-0"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>+ Translate</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* D. Card Footer: Author & Quick Action Buttons */}
                  <div className="pt-2 border-t border-dark-border/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-dark-muted min-w-0">
                      <UserIcon className="w-3.5 h-3.5 text-lavender-400 flex-shrink-0" />
                      <span className="truncate text-[11px] font-medium text-slate-300">
                        {blog.author || 'CCC Team'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/blogs/edit/${blog.id}`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-lavender-500/10 hover:bg-lavender-500/20 text-lavender-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Edit Article"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(blog);
                        }}
                        className="p-1 rounded-lg hover:bg-rose-500/10 text-dark-muted hover:text-rose-400 transition-colors"
                        title="Delete Article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ------------------ COMPACT LIST VIEW ------------------ */
        <div className="space-y-3">
          {paginatedBlogs.map((blog) => {
            const category = blogCategories.find((c) => c.id === blog.category_id);
            const isEnglish = blog.language === 'EN';
            const counterpartLang = isEnglish ? 'Hindi' : 'English';
            const urlPrefix = isEnglish ? '/en/blogs/' : '/hi/blogs/';

            return (
              <div
                key={blog.id}
                className="group p-3 sm:p-4 rounded-2xl bg-background-elevated/70 hover:bg-background-elevated border border-dark-border hover:border-lavender-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Thumbnail & Title */}
                <div
                  className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/blogs/edit/${blog.id}`)}
                >
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-900 border border-dark-border flex-shrink-0">
                    {blog.featured_image ? (
                      <img
                        src={blog.featured_image}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-950/40 text-lavender-400 font-bold text-xs">
                        BLOG
                      </div>
                    )}
                    <span
                      className={`absolute top-1 left-1 text-[9px] font-extrabold px-1 rounded ${
                        isEnglish ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {blog.language}
                    </span>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-lavender-400 uppercase tracking-wider">
                        {category?.title || 'General'}
                      </span>
                      {blog.is_featured && (
                        <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400" /> Featured
                        </span>
                      )}
                      <span className="text-[11px] text-dark-dim">•</span>
                      <span className="text-[11px] text-dark-dim">{formatDate(blog.created_at)}</span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-lavender-300 transition-colors truncate">
                      {blog.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs font-mono text-dark-dim">
                      <span className="truncate max-w-xs sm:max-w-md">
                        {urlPrefix}
                        <span className="text-slate-300 font-medium">{blog.slug}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Translation info, Status & Action Buttons */}
                <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap md:flex-nowrap border-t md:border-t-0 pt-2 md:pt-0 border-dark-border/40">
                  {/* Translation Pill */}
                  {blog.linked_translation ? (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/blogs/edit/${blog.linked_translation!.id}`);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-background border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                      title={`Linked to: ${blog.linked_translation.title}`}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>{counterpartLang} Linked</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleCreateTranslationDraft(e, blog)}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ {counterpartLang}</span>
                    </button>
                  )}

                  {/* Status Toggle */}
                  <button
                    type="button"
                    onClick={(e) => handleTogglePublish(e, blog)}
                    className="cursor-pointer"
                  >
                    <Badge variant={blog.is_published ? 'success' : 'neutral'} dot size="sm">
                      {blog.is_published ? 'Live' : 'Draft'}
                    </Badge>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewBlog(blog)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-dark-muted hover:text-white transition-colors"
                      title="Preview Article"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/blogs/edit/${blog.id}`)}
                      className="p-1.5 rounded-lg hover:bg-lavender-500/10 text-dark-muted hover:text-lavender-300 transition-colors"
                      title="Edit Article"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(blog)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-dark-muted hover:text-rose-400 transition-colors"
                      title="Delete Article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. PAGINATION */}
      {totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredBlogs.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* 6. ARTICLE LIVE PREVIEW MODAL */}
      {previewBlog && (
        <Modal
          isOpen={Boolean(previewBlog)}
          onClose={() => setPreviewBlog(null)}
          size="2xl"
          title={previewBlog.title}
          subtitle={`Language: ${previewBlog.language === 'EN' ? 'English (/en/blogs/)' : 'हिन्दी (/hi/blogs/)'} • By ${previewBlog.author} • /${previewBlog.slug}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const idToEdit = previewBlog.id;
                  setPreviewBlog(null);
                  navigate(`/blogs/edit/${idToEdit}`);
                }}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit in Full Page Studio
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPreviewBlog(null)}>
                Close Preview
              </Button>
            </div>
          }
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            {previewBlog.featured_image && (
              <img
                src={previewBlog.featured_image}
                alt={previewBlog.featured_image_alt || ''}
                className="w-full h-56 object-cover rounded-2xl border border-lavender-500/20 shadow-md"
              />
            )}

            <div className="space-y-2 border-b border-dark-border pb-4">
              <div className="flex items-center gap-2">
                <Badge variant={previewBlog.language === 'EN' ? 'primary' : 'success'}>
                  {previewBlog.language === 'EN' ? 'English Article' : 'हिंदी लेख'}
                </Badge>
                <Badge variant={previewBlog.is_published ? 'success' : 'neutral'} dot>
                  {previewBlog.is_published ? 'Published Live' : 'Draft'}
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-white">{previewBlog.title}</h2>
              {previewBlog.excerpt && (
                <p className="text-sm text-dark-muted">{previewBlog.excerpt}</p>
              )}
            </div>

            {/* Translation Link Notice */}
            {previewBlog.linked_translation ? (
              <div className="p-3.5 rounded-xl bg-lavender-500/10 border border-lavender-500/30 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-lavender-400">
                    Linked {previewBlog.linked_translation.language === 'EN' ? 'English' : 'Hindi'} Translation:
                  </span>
                  <p className="text-sm font-semibold text-white">
                    {previewBlog.linked_translation.title}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const id = previewBlog.linked_translation!.id;
                    setPreviewBlog(null);
                    navigate(`/blogs/edit/${id}`);
                  }}
                  leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  View Translation
                </Button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-300">
                    No {previewBlog.language === 'EN' ? 'Hindi' : 'English'} translation linked.
                  </span>
                  <p className="text-[11px] text-dark-muted">
                    This article is currently an independent single-language post.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    handleCreateTranslationDraft(e, previewBlog);
                    setPreviewBlog(null);
                  }}
                >
                  Create Translation
                </Button>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-background-elevated/50 border border-dark-border space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-dark-muted">
                Article Content (Markdown)
              </span>
              <div className="prose prose-invert prose-lavender max-w-none text-sm text-dark-text whitespace-pre-line">
                {previewBlog.content}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Article"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}" from Hygraph? Note: Deleting this article will NOT delete or break its translated counterpart.`}
      />

      {/* 8. AI BLOG GENERATION MODAL */}
      <AiBlogGenerateModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        categories={blogCategories}
        authorName={user?.name || 'CCC Prep Team'}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
};
