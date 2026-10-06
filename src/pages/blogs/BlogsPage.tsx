import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit2,
  Trash2,
  Eye,
  Calendar,
  User as UserIcon,
  Sparkles,
  Plus,
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
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../lib/utils';
import { APP_CONFIG } from '../../constants/config';
import { ROUTES } from '../../constants/routes';
import { AiBlogGenerateModal } from './AiBlogGenerateModal';

export const BlogsPage: React.FC = () => {
  const navigate = useNavigate();
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

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [previewBlog, setPreviewBlog] = useState<Blog | null>(null);

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
          <div
            className="flex items-start gap-3 py-1 cursor-pointer group"
            onClick={() => navigate(`/blogs/edit/${item.id}`)}
          >
            {item.featured_image ? (
              <img
                src={item.featured_image}
                alt=""
                className="w-12 h-12 rounded-xl object-cover border border-lavender-500/20 flex-shrink-0 group-hover:border-lavender-500/50 transition-colors"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-lavender-500/10 border border-lavender-500/20 flex items-center justify-center text-lavender-400 font-bold text-xs flex-shrink-0">
                BLOG
              </div>
            )}
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm truncate group-hover:text-lavender-300 transition-colors">
                  {item.title_en}
                </span>
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
            onClick={() => navigate(`/blogs/edit/${item.id}`)}
            className="p-1.5 text-dark-muted hover:text-lavender-300 hover:bg-lavender-500/10 rounded-lg transition-colors"
            title="Edit Article in Studio"
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
          onClick: () => navigate(ROUTES.BLOG_CREATE),
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
          onEmptyAction={() => navigate(ROUTES.BLOG_CREATE)}
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

      {/* Article Live Preview Modal */}
      {previewBlog && (
        <Modal
          isOpen={Boolean(previewBlog)}
          onClose={() => setPreviewBlog(null)}
          size="2xl"
          title={previewBlog.title_en}
          subtitle={`By ${previewBlog.author} • /${previewBlog.slug}`}
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
