import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  BookMarked,
  Link as LinkIcon,
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { Book, BookCategory } from '../../types/database';
import { bookService } from '../../services/bookService';
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
import { BookLinksModal } from './BookLinksModal';
import { APP_CONFIG } from '../../constants/config';

export const BooksPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [books, setBooks] = useState<Book[]>([]);
  const [bookCategories, setBookCategories] = useState<BookCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_CONFIG.DEFAULT_PAGE_SIZE);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedBookForLinks, setSelectedBookForLinks] = useState<Book | null>(null);

  // Form Fields
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [hindiTitle, setHindiTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [hindiDescription, setHindiDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverInputMode, setCoverInputMode] = useState<'upload' | 'url'>('upload');
  const [language, setLanguage] = useState('Bilingual (Hindi/English)');
  const [pages, setPages] = useState(250);
  const [edition, setEdition] = useState('2026 Edition');
  const [publisher, setPublisher] = useState('');
  const [isbn, setIsbn] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [booksData, catsData] = await Promise.all([
        bookService.getBooks(),
        bookService.getCategories(),
      ]);
      setBooks(booksData);
      setBookCategories(catsData);
    } catch (err: any) {
      toastError('Fetch Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingBook(null);
    setCategoryId(bookCategories[0]?.id || '');
    setTitle('');
    setHindiTitle('');
    setAuthor('');
    setDescription('');
    setHindiDescription('');
    setCoverImage('');
    setLanguage('Bilingual (Hindi/English)');
    setPages(250);
    setEdition('2026 Edition');
    setPublisher('Arihant / Youth Competition');
    setIsbn('');
    setIsFeatured(false);
    setIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setCategoryId(book.category_id || '');
    setTitle(book.title);
    setHindiTitle(book.hindi_title);
    setAuthor(book.author);
    setDescription(book.description || '');
    setHindiDescription(book.hindi_description || '');
    setCoverImage(book.cover_image || '');
    setLanguage(book.language);
    setPages(book.pages);
    setEdition(book.edition || '');
    setPublisher(book.publisher || '');
    setIsbn(book.isbn || '');
    setIsFeatured(book.is_featured);
    setIsActive(book.is_active);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!title.trim()) errors.title = 'English title is required.';
    if (!hindiTitle.trim()) errors.hindiTitle = 'Hindi title is required.';
    if (!author.trim()) errors.author = 'Author name is required.';
    if (!categoryId) errors.categoryId = 'Please select a book category.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        category_id: categoryId,
        title: title.trim(),
        hindi_title: hindiTitle.trim(),
        author: author.trim(),
        description: description.trim(),
        hindi_description: hindiDescription.trim(),
        cover_image: coverImage || undefined,
        language,
        pages: Number(pages),
        edition: edition.trim(),
        publisher: publisher.trim(),
        isbn: isbn.trim(),
        is_featured: isFeatured,
        is_active: isActive,
      };

      if (editingBook) {
        const updated = await bookService.updateBook(editingBook.id, payload);
        setBooks((prev) => prev.map((b) => (b.id === editingBook.id ? { ...b, ...updated } : b)));
        success('Book Updated', `Saved "${title}"`);
      } else {
        const created = await bookService.createBook(payload);
        setBooks((prev) => [created, ...prev]);
        success('Book Created', `Added "${title}"`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not save book.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await bookService.deleteBook(deleteTarget.id);
      setBooks((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      success('Book Deleted', `"${deleteTarget.title}" was removed.`);
      setDeleteTarget(null);
    } catch (err: any) {
      toastError('Delete Failed', err.message || 'Could not delete book.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBooks = books.filter((b) => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      b.title.toLowerCase().includes(query) ||
      b.hindi_title.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query) ||
      (b.publisher && b.publisher.toLowerCase().includes(query));

    const matchCategory = categoryFilter === '' ? true : b.category_id === categoryFilter;
    const matchFeatured =
      featuredFilter === '' ? true : featuredFilter === 'featured' ? b.is_featured : !b.is_featured;
    const matchStatus =
      statusFilter === '' ? true : statusFilter === 'active' ? b.is_active : !b.is_active;

    return matchSearch && matchCategory && matchFeatured && matchStatus;
  });

  const totalPages = Math.ceil(filteredBooks.length / pageSize);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns: Column<Book>[] = [
    {
      key: 'title',
      header: 'Book Info & Author',
      render: (item) => {
        const category = bookCategories.find((c) => c.id === item.category_id);
        return (
          <div className="flex items-start gap-3 py-1">
            {item.cover_image ? (
              <img
                src={item.cover_image}
                alt=""
                className="w-10 h-14 rounded-lg object-cover border border-lavender-500/20 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-14 rounded-lg bg-lavender-500/10 border border-lavender-500/20 flex items-center justify-center text-lavender-400 flex-shrink-0">
                <BookMarked className="w-5 h-5" />
              </div>
            )}
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm truncate">{item.title}</span>
                {item.is_featured && (
                  <Badge variant="primary" size="sm">
                    Featured
                  </Badge>
                )}
              </div>
              <p className="text-xs text-lavender-300 font-medium truncate">{item.hindi_title}</p>
              <div className="flex items-center gap-2 text-xs text-dark-muted">
                <span className="text-white font-medium">By {item.author}</span>
                <span>•</span>
                <span>{category?.title || 'General'}</span>
                <span>•</span>
                <span>{item.edition || 'Latest'}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'links',
      header: 'Affiliate Links',
      width: '150px',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedBookForLinks(item);
          }}
          leftIcon={<LinkIcon className="w-3.5 h-3.5" />}
        >
          Retailers
        </Button>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      width: '120px',
      render: (item) => (
        <Badge variant={item.is_active ? 'success' : 'neutral'} dot>
          {item.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '110px',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEditModal(item)}
            className="p-1.5 text-dark-muted hover:text-lavender-300 hover:bg-lavender-500/10 rounded-lg transition-colors"
            title="Edit Book"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            className="p-1.5 text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete Book"
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
        searchPlaceholder="Search books by title, author, publisher..."
        filters={[
          {
            key: 'category',
            label: 'Category',
            value: categoryFilter,
            options: bookCategories.map((c) => ({ value: c.id, label: c.title })),
            onChange: setCategoryFilter,
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
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            options: [
              { value: 'active', label: 'Active Only' },
              { value: 'inactive', label: 'Inactive Only' },
            ],
            onChange: setStatusFilter,
          },
        ]}
        hasActiveFilters={Boolean(
          searchQuery || categoryFilter || featuredFilter || statusFilter
        )}
        onClearFilters={() => {
          setSearchQuery('');
          setCategoryFilter('');
          setFeaturedFilter('');
          setStatusFilter('');
        }}
        actionButton={{
          label: 'New Book',
          onClick: openCreateModal,
        }}
      />

      <div className="space-y-0">
        <DataTable
          columns={columns}
          data={paginatedBooks}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          emptyTitle="No books found in Supabase"
          emptyDescription="Add recommended books and attach affiliate store links (Amazon/Flipkart)."
          emptyActionText="Add Book"
          onEmptyAction={openCreateModal}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBooks.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="xl"
        title={editingBook ? 'Edit Book Details' : 'Add New Book'}
        subtitle="Manage book metadata, cover art and edition info in Supabase"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingBook ? 'Save Changes' : 'Add Book'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Book Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={bookCategories.map((c) => ({ value: c.id, label: c.title }))}
              error={formErrors.categoryId}
              required
            />
            <Input
              label="Author Name"
              placeholder="e.g. Preeti Sinha / Team Arihant"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              error={formErrors.author}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Book Title (English)"
              placeholder="e.g. Master Guide CCC Computer Concepts 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={formErrors.title}
              required
            />
            <Input
              label="किताब का नाम (Hindi)"
              placeholder="उदा. मास्टर गाइड सीसीसी कंप्यूटर कॉन्सेप्ट्स"
              value={hindiTitle}
              onChange={(e) => setHindiTitle(e.target.value)}
              error={formErrors.hindiTitle}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
            <Input
              label="Total Pages"
              type="number"
              value={pages}
              onChange={(e) => setPages(Number(e.target.value))}
            />
            <Input
              label="Edition"
              placeholder="2026 Edition"
              value={edition}
              onChange={(e) => setEdition(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Publisher"
              placeholder="e.g. Arihant Publications"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
            />
            <Input
              label="ISBN (Optional)"
              placeholder="978-93-XXXX-XXX-X"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Description (English)"
              placeholder="Key highlights and contents of the book..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <Textarea
              label="विवरण (Hindi)"
              placeholder="पुस्तक की मुख्य विशेषताएं..."
              value={hindiDescription}
              onChange={(e) => setHindiDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-3 p-4 rounded-2xl bg-background-elevated/40 border border-dark-border">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-lavender-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  Book Cover Image
                </span>
                <span className="text-[10px] text-dark-muted font-normal">(Optional)</span>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center bg-background rounded-lg p-0.5 border border-dark-border text-xs">
                <button
                  type="button"
                  onClick={() => setCoverInputMode('upload')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    coverInputMode === 'upload'
                      ? 'bg-lavender-500 text-white font-medium shadow-sm'
                      : 'text-dark-muted hover:text-white'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCoverInputMode('url')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    coverInputMode === 'url'
                      ? 'bg-lavender-500 text-white font-medium shadow-sm'
                      : 'text-dark-muted hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Paste Cover URL</span>
                </button>
              </div>
            </div>

            {/* Upload Mode */}
            {coverInputMode === 'upload' && (
              <FileUpload
                bucket={APP_CONFIG.STORAGE_BUCKETS.BOOK_COVERS}
                type="image"
                accept="image/*"
                value={coverImage}
                onChange={(url) => setCoverImage(url)}
                helperText="Upload book cover to Supabase Storage, or switch to 'Paste Cover URL' for external links."
              />
            )}

            {/* Direct URL Paste Mode */}
            {coverInputMode === 'url' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste direct cover image URL (e.g. https://images-na.ssl-images-amazon.com/... or CDN link)"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value.trim())}
                    className="flex-1"
                  />
                  {coverImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCoverImage('')}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                {/* Live Preview */}
                {coverImage && (
                  <div className="p-2.5 rounded-xl bg-background border border-dark-border/80 flex items-center gap-3">
                    <div className="w-16 h-20 rounded-lg overflow-hidden border border-dark-border bg-dark-bg shrink-0 shadow-sm">
                      <img
                        src={coverImage}
                        alt="Book Cover Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23f43f5e" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
                        }}
                      />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">External Cover Linked</span>
                        <Badge variant="success" size="sm">
                          Active URL
                        </Badge>
                      </div>
                      <p className="text-[11px] text-dark-muted font-mono truncate">{coverImage}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Switch
              checked={isFeatured}
              onChange={setIsFeatured}
              label="Feature in Mobile App"
              description="Displays prominently on the mobile store."
            />
            <Switch
              checked={isActive}
              onChange={setIsActive}
              label="Active Status"
              description="Make visible to mobile users."
            />
          </div>
        </form>
      </Modal>

      <BookLinksModal
        book={selectedBookForLinks}
        isOpen={Boolean(selectedBookForLinks)}
        onClose={() => setSelectedBookForLinks(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Book"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}" from Supabase?`}
      />
    </div>
  );
};
