import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  User as UserIcon,
  Sparkles,
  Palette,
  Link as LinkIcon,
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Blog, BlogCategory } from '../../types/database';
import { blogService } from '../../services/blogService';
import { DataTable, Column } from '../../components/common/DataTable';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Select } from '../../components/common/Select';
import { Switch } from '../../components/common/Switch';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { FileUpload } from '../../components/common/FileUpload';
import { RichTextEditor } from '../../components/common/RichTextEditor';
import { formatDate, generateSlug } from '../../lib/utils';
import { APP_CONFIG } from '../../constants/config';
import { AiBlogGenerateModal } from './AiBlogGenerateModal';
import { geminiBlogService, BANNER_THEMES } from '../../services/geminiBlogService';

export const BlogsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_CONFIG.DEFAULT_PAGE_SIZE);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [previewBlog, setPreviewBlog] = useState<Blog | null>(null);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);

  // Form State
  const [categoryId, setCategoryId] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [slug, setSlug] = useState('');
  const [summaryEn, setSummaryEn] = useState('');
  const [summaryHi, setSummaryHi] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentHi, setContentHi] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [author, setAuthor] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      toastError('Fetch Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTitleEnChange = (val: string) => {
    setTitleEn(val);
    if (!editingBlog) {
      setSlug(generateSlug(val));
    }
  };

  const openCreateModal = () => {
    setEditingBlog(null);
    setCategoryId(blogCategories[0]?.id || '');
    setTitleEn('');
    setTitleHi('');
    setSlug('');
    setSummaryEn('');
    setSummaryHi('');
    setContentEn('# Guide Title\n\nWrite article content with markdown formatting here...');
    setContentHi('# गाइड का शीर्षक\n\nयहाँ हिंदी में लेख की सामग्री लिखें...');
    setFeaturedImage('');
    setAuthor(user?.name || 'CCC Prep Team');
    setIsFeatured(false);
    setIsPublished(false);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (blog: Blog) => {
    setEditingBlog(blog);
    setCategoryId(blog.category_id || '');
    setTitleEn(blog.title_en);
    setTitleHi(blog.title_hi);
    setSlug(blog.slug);
    setSummaryEn(blog.summary_en || '');
    setSummaryHi(blog.summary_hi || '');
    setContentEn(blog.content_en);
    setContentHi(blog.content_hi);
    setFeaturedImage(blog.featured_image || '');
    setAuthor(blog.author);
    setIsFeatured(blog.is_featured);
    setIsPublished(blog.is_published);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleGenerateThumbnailForForm = async () => {
    if (!titleEn.trim()) {
      toastError('Title Required', 'Please enter an English title before generating a banner.');
      return;
    }

    setIsGeneratingBanner(true);
    try {
      const selectedCat = blogCategories.find((c) => c.id === categoryId);
      const url = await geminiBlogService.generateAndUploadBanner(
        titleEn.trim(),
        selectedCat?.title || 'CCC Study Guide',
        BANNER_THEMES[0]
      );
      setFeaturedImage(url);
      success('Banner Generated', 'Created and attached high-resolution blog banner.');
    } catch (err: any) {
      toastError('Banner Failed', err.message || 'Could not generate banner image.');
    } finally {
      setIsGeneratingBanner(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!titleEn.trim()) errors.titleEn = 'English title is required.';
    if (!titleHi.trim()) errors.titleHi = 'Hindi title is required.';
    if (!slug.trim()) errors.slug = 'Slug identifier is required.';
    if (!categoryId) errors.categoryId = 'Please select a category.';
    if (!contentEn.trim()) errors.contentEn = 'English article content is required.';
    if (!contentHi.trim()) errors.contentHi = 'Hindi article content is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        category_id: categoryId,
        title_en: titleEn.trim(),
        title_hi: titleHi.trim(),
        slug: slug.trim(),
        summary_en: summaryEn.trim(),
        summary_hi: summaryHi.trim(),
        content_en: contentEn,
        content_hi: contentHi,
        featured_image: featuredImage || undefined,
        author: author.trim() || user?.name || 'CCC Prep Team',
        is_featured: isFeatured,
        is_published: isPublished,
        published_at: isPublished ? (editingBlog?.published_at || new Date().toISOString()) : undefined,
      };

      if (editingBlog) {
        const updated = await blogService.updateBlog(editingBlog.id, payload);
        setBlogs((prev) => prev.map((b) => (b.id === editingBlog.id ? { ...b, ...updated } : b)));
        success('Article Updated', `Saved "${titleEn}"`);
      } else {
        const created = await blogService.createBlog(payload);
        setBlogs((prev) => [created, ...prev]);
        success('Article Created', `Published "${titleEn}"`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not save article.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await blogService.deleteBlog(deleteTarget.id);
      setBlogs((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      success('Article Deleted', `"${deleteTarget.title_en}" was removed.`);
      setDeleteTarget(null);
    } catch (err: any) {
      toastError('Delete Failed', err.message || 'Could not delete article.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async (blog: Blog) => {
    try {
      const nextStatus = !blog.is_published;
      const updated = await blogService.updateBlog(blog.id, {
        is_published: nextStatus,
        published_at: nextStatus ? (blog.published_at || new Date().toISOString()) : undefined,
      });
      setBlogs((prev) => prev.map((b) => (b.id === blog.id ? { ...b, ...updated } : b)));
      success(nextStatus ? 'Article Published' : 'Article Set to Draft', blog.title_en);
    } catch (err: any) {
      toastError('Update Failed', err.message);
    }
  };

  const filteredBlogs = blogs.filter((b) => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      b.title_en.toLowerCase().includes(query) ||
      b.title_hi.toLowerCase().includes(query) ||
      b.slug.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query);

    const matchCategory = categoryFilter === '' ? true : b.category_id === categoryFilter;
    const matchPublished =
      publishedFilter === '' ? true : publishedFilter === 'published' ? b.is_published : !b.is_published;
    const matchFeatured =
      featuredFilter === '' ? true : featuredFilter === 'featured' ? b.is_featured : !b.is_featured;

    return matchSearch && matchCategory && matchPublished && matchFeatured;
  });

  const totalPages = Math.ceil(filteredBlogs.length / pageSize);
  const paginatedBlogs = filteredBlogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns: Column<Blog>[] = [
    {
      key: 'title',
      header: 'Article Title & Category',
      render: (item) => {
        const category = blogCategories.find((c) => c.id === item.category_id);
        return (
          <div className="flex items-start gap-3 py-1">
            {item.featured_image ? (
              <img
                src={item.featured_image}
                alt=""
                className="w-12 h-12 rounded-xl object-cover border border-lavender-500/20 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-lavender-500/10 border border-lavender-500/20 flex items-center justify-center text-lavender-400 font-bold text-xs flex-shrink-0">
                BLOG
              </div>
            )}
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm truncate">{item.title_en}</span>
                {item.is_featured && (
                  <Badge variant="primary" size="sm">
                    Featured
                  </Badge>
                )}
              </div>
              <p className="text-xs text-lavender-300 font-medium truncate">{item.title_hi}</p>
              <div className="flex items-center gap-2 text-[11px] text-dark-muted">
                <span>{category?.title || 'General'}</span>
                <span>•</span>
                <span className="font-mono text-dark-dim">/{item.slug}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'author_date',
      header: 'Author & Date',
      width: '160px',
      render: (item) => (
        <div className="text-xs space-y-0.5 text-dark-muted">
          <div className="flex items-center gap-1.5 text-white font-medium">
            <UserIcon className="w-3.5 h-3.5 text-lavender-400" />
            <span className="truncate">{item.author}</span>
          </div>
          <div className="flex items-center gap-1.5 text-dark-dim">
            <Calendar className="w-3.5 h-3.5 text-dark-muted" />
            <span>{formatDate(item.created_at)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'is_published',
      header: 'Status',
      width: '130px',
      render: (item) => (
        <button
          onClick={() => handleTogglePublish(item)}
          className="group cursor-pointer text-left"
          title="Click to toggle publish status"
        >
          <Badge variant={item.is_published ? 'success' : 'neutral'} dot>
            {item.is_published ? 'Published' : 'Draft'}
          </Badge>
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setPreviewBlog(item)}
            className="p-1.5 text-dark-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Preview Article"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEditModal(item)}
            className="p-1.5 text-dark-muted hover:text-lavender-300 hover:bg-lavender-500/10 rounded-lg transition-colors"
            title="Edit Article"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            className="p-1.5 text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete Article"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search blogs by title, slug, or author..."
        filters={[
          {
            key: 'category',
            label: 'Category',
            value: categoryFilter,
            options: blogCategories.map((c) => ({ value: c.id, label: c.title })),
            onChange: setCategoryFilter,
          },
          {
            key: 'status',
            label: 'Status',
            value: publishedFilter,
            options: [
              { value: 'published', label: 'Published Only' },
              { value: 'draft', label: 'Drafts Only' },
            ],
            onChange: setPublishedFilter,
          },
          {
            key: 'featured',
            label: 'Featured',
            value: featuredFilter,
            options: [
              { value: 'featured', label: 'Featured Only' },
              { value: 'standard', label: 'Standard Only' },
            ],
            onChange: setFeaturedFilter,
          },
        ]}
        hasActiveFilters={Boolean(
          searchQuery || categoryFilter || publishedFilter || featuredFilter
        )}
        onClearFilters={() => {
          setSearchQuery('');
          setCategoryFilter('');
          setPublishedFilter('');
          setFeaturedFilter('');
        }}
        extraActions={
          <Button
            variant="outline"
            onClick={() => setIsAiModalOpen(true)}
            leftIcon={<Sparkles className="w-4 h-4 text-lavender-400 animate-pulse" />}
            className="bg-lavender-500/10 hover:bg-lavender-500/20 border-lavender-500/30 text-lavender-200"
          >
            Generate with AI
          </Button>
        }
        actionButton={{
          label: 'Write Article',
          onClick: openCreateModal,
        }}
      />

      <div className="space-y-0">
        <DataTable
          columns={columns}
          data={paginatedBlogs}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          emptyTitle="No articles found in Supabase"
          emptyDescription="Write and publish exam notifications, study tips, and guide articles."
          emptyActionText="Write Article"
          onEmptyAction={openCreateModal}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBlogs.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Write / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="2xl"
        title={editingBlog ? 'Edit Article' : 'Write New Article'}
        subtitle="Compose bilingual articles with Markdown and Supabase Storage images"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingBlog ? 'Save Changes' : 'Save Article'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Article Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={blogCategories.map((c) => ({ value: c.id, label: c.title }))}
              error={formErrors.categoryId}
              required
            />
            <Input
              label="URL Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              error={formErrors.slug}
              placeholder="ccc-2026-exam-tips"
              required
            />
            <Input
              label="Author Name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Admin Team"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Article Title (English)"
              placeholder="e.g. How to Pass CCC Exam on First Attempt in 2026"
              value={titleEn}
              onChange={(e) => handleTitleEnChange(e.target.value)}
              error={formErrors.titleEn}
              required
            />
            <Input
              label="लेख का शीर्षक (Hindi)"
              placeholder="उदा. 2026 में पहली बार में CCC परीक्षा कैसे पास करें"
              value={titleHi}
              onChange={(e) => setTitleHi(e.target.value)}
              error={formErrors.titleHi}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Short Summary (English)"
              placeholder="Brief preview snippet shown on card..."
              value={summaryEn}
              onChange={(e) => setSummaryEn(e.target.value)}
              rows={2}
            />
            <Textarea
              label="संक्षिप्त सारांश (Hindi)"
              placeholder="कार्ड पर दिखाया जाने वाला संक्षिप्त विवरण..."
              value={summaryHi}
              onChange={(e) => setSummaryHi(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-3 p-4 rounded-2xl bg-background-elevated/40 border border-dark-border">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  Featured Banner Image
                </span>
                <span className="text-[10px] text-dark-muted font-normal">(Optional)</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Mode Selector Tabs */}
                <div className="flex items-center bg-background rounded-lg p-0.5 border border-dark-border text-xs">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('upload')}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                      imageInputMode === 'upload'
                        ? 'bg-lavender-500 text-white font-medium shadow-sm'
                        : 'text-dark-muted hover:text-white'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                      imageInputMode === 'url'
                        ? 'bg-lavender-500 text-white font-medium shadow-sm'
                        : 'text-dark-muted hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Paste Image URL</span>
                  </button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateThumbnailForForm}
                  isLoading={isGeneratingBanner}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-lavender-400" />}
                  className="text-xs py-1"
                >
                  {isGeneratingBanner ? 'Generating...' : '✨ Generate AI Banner'}
                </Button>
              </div>
            </div>

            {/* Upload Mode */}
            {imageInputMode === 'upload' && (
              <FileUpload
                bucket={APP_CONFIG.STORAGE_BUCKETS.BLOG_IMAGES}
                type="image"
                accept="image/*"
                value={featuredImage}
                onChange={(url) => setFeaturedImage(url)}
                helperText="Upload image to Supabase Storage, or switch to 'Paste Image URL' for external links."
              />
            )}

            {/* Direct URL Paste Mode */}
            {imageInputMode === 'url' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste direct image URL e.g. https://images.unsplash.com/photo-... or external bucket link"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value.trim())}
                    className="flex-1"
                  />
                  {featuredImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeaturedImage('')}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                {/* Live Preview of Pasted URL */}
                {featuredImage && (
                  <div className="p-2.5 rounded-xl bg-background border border-dark-border/80 flex items-center gap-3">
                    <div className="w-24 h-16 rounded-lg overflow-hidden border border-dark-border bg-dark-bg shrink-0">
                      <img
                        src={featuredImage}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23f43f5e" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
                        }}
                      />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5 text-lavender-400" />
                        <span className="text-xs font-semibold text-white">External Image Linked</span>
                        <Badge variant="success" size="sm">
                          Active URL
                        </Badge>
                      </div>
                      <p className="text-[11px] text-dark-muted font-mono truncate">
                        {featuredImage}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <RichTextEditor
              label="Full Article Content (English) *"
              value={contentEn}
              onChange={setContentEn}
              placeholder="Type markdown or rich text..."
            />
            <RichTextEditor
              label="सम्पूर्ण लेख सामग्री (Hindi) *"
              value={contentHi}
              onChange={setContentHi}
              placeholder="यहाँ हिंदी में विस्तृत लेख लिखें..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Switch
              checked={isFeatured}
              onChange={setIsFeatured}
              label="Featured Article"
              description="Displays in the top carousel on the mobile app."
            />
            <Switch
              checked={isPublished}
              onChange={setIsPublished}
              label="Published Status"
              description="Make article immediately accessible to mobile users."
            />
          </div>
        </form>
      </Modal>

      {/* Article Live Preview Modal */}
      {previewBlog && (
        <Modal
          isOpen={Boolean(previewBlog)}
          onClose={() => setPreviewBlog(null)}
          size="2xl"
          title={previewBlog.title_en}
          subtitle={`By ${previewBlog.author} • /${previewBlog.slug}`}
          footer={
            <Button variant="secondary" onClick={() => setPreviewBlog(null)}>
              Close Preview
            </Button>
          }
        >
          <div className="space-y-6">
            {previewBlog.featured_image && (
              <img
                src={previewBlog.featured_image}
                alt=""
                className="w-full h-56 object-cover rounded-2xl border border-lavender-500/20 shadow-md"
              />
            )}

            <div className="space-y-2 border-b border-dark-border pb-4">
              <h2 className="text-xl font-bold text-white">{previewBlog.title_en}</h2>
              <p className="text-base font-medium text-lavender-300">{previewBlog.title_hi}</p>
            </div>

            <div className="p-4 rounded-2xl bg-background-elevated/50 border border-dark-border space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-dark-muted">
                English Content
              </span>
              <div className="prose prose-invert prose-lavender max-w-none text-sm text-dark-text whitespace-pre-line">
                {previewBlog.content_en}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-background-elevated/50 border border-dark-border space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-lavender-400">
                हिंदी सामग्री
              </span>
              <div className="prose prose-invert prose-lavender max-w-none text-sm text-dark-text whitespace-pre-line">
                {previewBlog.content_hi}
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Article"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title_en}" from Supabase?`}
      />

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
