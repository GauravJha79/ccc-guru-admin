import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  ExternalLink,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  X,
  GripVertical,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { Note, NoteCategory } from '../../types/database';
import { noteService } from '../../services/noteService';
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
import { formatDate, formatFileSize } from '../../lib/utils';
import { APP_CONFIG } from '../../constants/config';

export const NotesPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [notes, setNotes] = useState<Note[]>([]);
  const [noteCategories, setNoteCategories] = useState<NoteCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_CONFIG.DEFAULT_PAGE_SIZE);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Form State
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [hindiTitle, setHindiTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hindiDescription, setHindiDescription] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfInputMode, setPdfInputMode] = useState<'upload' | 'url'>('upload');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailInputMode, setThumbnailInputMode] = useState<'upload' | 'url'>('upload');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [sortOrder, setSortOrder] = useState(1);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notesData, catsData] = await Promise.all([
        noteService.getNotes(),
        noteService.getCategories(),
      ]);
      setNotes(notesData);
      setNoteCategories(catsData);
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
    setEditingNote(null);
    setCategoryId(noteCategories[0]?.id || '');
    setTitle('');
    setHindiTitle('');
    setDescription('');
    setHindiDescription('');
    setPdfUrl('');
    setThumbnailUrl('');
    setFileName('');
    setFileSize(0);
    setPageCount(10);
    const nextOrder =
      notes.length > 0 ? Math.max(...notes.map((n) => n.sort_order || 0)) + 1 : 1;
    setSortOrder(nextOrder);
    setIsFeatured(false);
    setIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setCategoryId(note.category_id || '');
    setTitle(note.title);
    setHindiTitle(note.hindi_title);
    setDescription(note.description || '');
    setHindiDescription(note.hindi_description || '');
    setPdfUrl(note.pdf_url);
    setThumbnailUrl(note.thumbnail_url || '');
    setFileName(note.file_name);
    setFileSize(note.file_size);
    setPageCount(note.page_count);
    setSortOrder(note.sort_order ?? 1);
    setIsFeatured(note.is_featured);
    setIsActive(note.is_active);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!title.trim()) errors.title = 'English title is required.';
    if (!hindiTitle.trim()) errors.hindiTitle = 'Hindi title is required.';
    if (!categoryId) errors.categoryId = 'Please select a category.';
    if (!pdfUrl) errors.pdfUrl = 'Please upload a PDF document.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        category_id: categoryId,
        title: title.trim(),
        hindi_title: hindiTitle.trim(),
        description: description.trim(),
        hindi_description: hindiDescription.trim(),
        pdf_url: pdfUrl,
        thumbnail_url: thumbnailUrl || undefined,
        file_name: fileName || `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        file_size: Number(fileSize),
        page_count: Number(pageCount),
        sort_order: Number(sortOrder) || 0,
        is_featured: isFeatured,
        is_active: isActive,
      };

      if (editingNote) {
        const updated = await noteService.updateNote(editingNote.id, payload);
        setNotes((prev) => prev.map((n) => (n.id === editingNote.id ? { ...n, ...updated } : n)));
        success('Note Updated', `Saved "${title}"`);
      } else {
        const created = await noteService.createNote(payload);
        setNotes((prev) => [created, ...prev]);
        success('Note Created', `Uploaded "${title}"`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not save PDF note.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await noteService.deleteNote(deleteTarget.id);
      setNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      success('Note Deleted', `"${deleteTarget.title}" was removed.`);
      setDeleteTarget(null);
    } catch (err: any) {
      toastError('Delete Failed', err.message || 'Could not delete note.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReorder = async (reorderedPageItems: Note[]) => {
    // 1. Calculate new sequential order for the visible page items
    const baseOrder = (currentPage - 1) * pageSize;
    const updatedVisible = reorderedPageItems.map((item, idx) => ({
      ...item,
      sort_order: baseOrder + idx + 1,
    }));

    // 2. Optimistic update of local state
    const orderMap = new Map(updatedVisible.map((n) => [n.id, n.sort_order]));
    setNotes((prevNotes) =>
      prevNotes
        .map((n) => (orderMap.has(n.id) ? { ...n, sort_order: orderMap.get(n.id)! } : n))
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    );

    // 3. Persist to Supabase
    try {
      const updates = updatedVisible.map((n) => ({
        id: n.id,
        sort_order: n.sort_order,
      }));
      await noteService.reorderNotes(updates);
      success('Order Saved', 'Notes reordered successfully.');
    } catch (err: any) {
      toastError('Reorder Failed', err.message || 'Could not save new order.');
      fetchData(); // Rollback on error
    }
  };

  const filteredNotes = notes
    .filter((n) => {
      const query = searchQuery.toLowerCase();
      const matchSearch =
        n.title.toLowerCase().includes(query) ||
        n.hindi_title.toLowerCase().includes(query) ||
        n.file_name.toLowerCase().includes(query);
      const matchCategory = categoryFilter === '' ? true : n.category_id === categoryFilter;
      const matchFeatured =
        featuredFilter === '' ? true : featuredFilter === 'featured' ? n.is_featured : !n.is_featured;
      const matchStatus =
        statusFilter === '' ? true : statusFilter === 'active' ? n.is_active : !n.is_active;

      return matchSearch && matchCategory && matchFeatured && matchStatus;
    })
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const totalPages = Math.ceil(filteredNotes.length / pageSize);
  const paginatedNotes = filteredNotes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns: Column<Note>[] = [
    {
      key: 'sort_order',
      header: 'Order',
      width: '80px',
      align: 'center',
      render: (item) => (
        <span className="font-mono text-xs text-lavender-300 font-bold px-2 py-1 bg-lavender-500/10 rounded-lg border border-lavender-500/20">
          #{item.sort_order ?? 0}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'PDF Note & Category',
      render: (item) => {
        const category = noteCategories.find((c) => c.id === item.category_id);
        return (
          <div className="flex items-start gap-3 py-1">
            {item.thumbnail_url ? (
              <img
                src={item.thumbnail_url}
                alt=""
                className="w-10 h-12 rounded-lg object-cover border border-lavender-500/20 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-12 rounded-lg bg-lavender-500/10 border border-lavender-500/20 flex items-center justify-center text-lavender-400 flex-shrink-0">
                <FileText className="w-5 h-5" />
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
                <span>{category?.title || 'General'}</span>
                <span>•</span>
                <span>{item.page_count} Pages</span>
                <span>•</span>
                <span>{formatFileSize(item.file_size)}</span>
              </div>
            </div>
          </div>
        );
      },
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
      key: 'file_actions',
      header: 'Document',
      width: '120px',
      render: (item) => (
        <a
          href={item.pdf_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-lavender-400 hover:text-lavender-300 font-medium bg-lavender-500/10 hover:bg-lavender-500/20 px-2.5 py-1.5 rounded-lg border border-lavender-500/30 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>View PDF</span>
        </a>
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
            title="Edit Note"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            className="p-1.5 text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete Note"
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
        searchPlaceholder="Search notes by title or filename..."
        filters={[
          {
            key: 'category',
            label: 'Category',
            value: categoryFilter,
            options: noteCategories.map((c) => ({ value: c.id, label: c.title })),
            onChange: setCategoryFilter,
          },
          {
            key: 'featured',
            label: 'Featured',
            value: featuredFilter,
            options: [
              { value: 'featured', label: 'Featured Only' },
              { value: 'not_featured', label: 'Standard Only' },
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
        hasActiveFilters={Boolean(searchQuery || categoryFilter || featuredFilter || statusFilter)}
        onClearFilters={() => {
          setSearchQuery('');
          setCategoryFilter('');
          setFeaturedFilter('');
          setStatusFilter('');
        }}
        actionButton={{
          label: 'Upload Note',
          onClick: openCreateModal,
        }}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-dark-muted px-1">
          <span className="flex items-center gap-1.5">
            <GripVertical className="w-3.5 h-3.5 text-lavender-400" />
            Drag & drop table rows to change note sequence for the mobile app
          </span>
          <span>{filteredNotes.length} Total Notes</span>
        </div>

        <DataTable
          columns={columns}
          data={paginatedNotes}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          isReorderable={true}
          onReorder={handleReorder}
          emptyTitle="No PDF notes found"
          emptyDescription="Upload PDF notes, cheat sheets and syllabus summaries for mobile students."
          emptyActionText="Upload PDF Note"
          onEmptyAction={openCreateModal}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredNotes.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="xl"
        title={editingNote ? 'Edit PDF Note' : 'Upload PDF Note & Handout'}
        subtitle="Uploads PDF documents and cover thumbnails directly to Hygraph Assets"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingNote ? 'Save Changes' : 'Save PDF Note'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Note Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={noteCategories.map((c) => ({ value: c.id, label: c.title }))}
              error={formErrors.categoryId}
              required
            />
            <Input
              label="Sort Order"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              helperText="Position in mobile app"
            />
            <Input
              label="Page Count"
              type="number"
              min={1}
              value={pageCount}
              onChange={(e) => setPageCount(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Note Title (English)"
              placeholder="e.g. LibreOffice Complete Shortcut Keys Guide"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={formErrors.title}
              required
            />
            <Input
              label="शीर्षक (Hindi)"
              placeholder="उदा. लिबरेऑफिस सम्पूर्ण शॉर्टकट कुंजी गाइड"
              value={hindiTitle}
              onChange={(e) => setHindiTitle(e.target.value)}
              error={formErrors.hindiTitle}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Description (English)"
              placeholder="Summary of topics covered in this PDF..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <Textarea
              label="विवरण (Hindi)"
              placeholder="इस पीडीएफ में शामिल विषयों का सारांश..."
              value={hindiDescription}
              onChange={(e) => setHindiDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. PDF Document Section */}
            <div className="space-y-3 p-4 rounded-2xl bg-background-elevated/40 border border-dark-border">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-lavender-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white">
                    PDF Document *
                  </span>
                </div>

                {/* Mode Selector */}
                <div className="flex items-center bg-background rounded-lg p-0.5 border border-dark-border text-xs">
                  <button
                    type="button"
                    onClick={() => setPdfInputMode('upload')}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                      pdfInputMode === 'upload'
                        ? 'bg-lavender-500 text-white font-medium shadow-sm'
                        : 'text-dark-muted hover:text-white'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfInputMode('url')}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                      pdfInputMode === 'url'
                        ? 'bg-lavender-500 text-white font-medium shadow-sm'
                        : 'text-dark-muted hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Paste PDF URL</span>
                  </button>
                </div>
              </div>

              {pdfInputMode === 'upload' && (
                <FileUpload
                  provider="hygraph"
                  type="pdf"
                  accept="application/pdf"
                  maxSizeBytes={50 * 1024 * 1024}
                  value={pdfUrl}
                  currentFileName={fileName}
                  onChange={(url, meta) => {
                    setPdfUrl(url);
                    if (meta) {
                      setFileName(meta.fileName);
                      setFileSize(meta.fileSize);
                    }
                  }}
                  helperText={formErrors.pdfUrl ? formErrors.pdfUrl : 'Upload study PDF document directly to Hygraph Assets.'}
                />
              )}

              {pdfInputMode === 'url' && (
                <div className="space-y-3">
                  <Input
                    placeholder="Paste direct PDF URL (e.g. https://.../file.pdf or Cloud Drive link)"
                    value={pdfUrl}
                    onChange={(e) => {
                      const url = e.target.value.trim();
                      setPdfUrl(url);
                      if (url && !fileName) {
                        try {
                          const urlParts = new URL(url).pathname.split('/');
                          const lastPart = urlParts[urlParts.length - 1];
                          if (lastPart) setFileName(decodeURIComponent(lastPart));
                        } catch {
                          setFileName('study-notes.pdf');
                        }
                      }
                    }}
                    error={formErrors.pdfUrl}
                  />

                  {pdfUrl && (
                    <div className="p-3 rounded-xl bg-background border border-dark-border/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-lavender-500/10 text-lavender-400 border border-lavender-500/20 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white truncate">
                              {fileName || 'External PDF Document'}
                            </span>
                            <Badge variant="success" size="sm">
                              Active Link
                            </Badge>
                          </div>
                          <p className="text-[11px] text-dark-muted font-mono truncate">{pdfUrl}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-dark-border/50 transition-colors"
                          title="Open PDF Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPdfUrl('');
                            setFileName('');
                          }}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 h-auto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Cover Thumbnail Section */}
            <div className="space-y-3 p-4 rounded-2xl bg-background-elevated/40 border border-dark-border">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white">
                    Cover Thumbnail
                  </span>
                  <span className="text-[10px] text-dark-muted font-normal">(Optional)</span>
                </div>

                {/* Mode Selector */}
                <div className="flex items-center bg-background rounded-lg p-0.5 border border-dark-border text-xs">
                  <button
                    type="button"
                    onClick={() => setThumbnailInputMode('upload')}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                      thumbnailInputMode === 'upload'
                        ? 'bg-lavender-500 text-white font-medium shadow-sm'
                        : 'text-dark-muted hover:text-white'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbnailInputMode('url')}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                      thumbnailInputMode === 'url'
                        ? 'bg-lavender-500 text-white font-medium shadow-sm'
                        : 'text-dark-muted hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Paste Image URL</span>
                  </button>
                </div>
              </div>

              {thumbnailInputMode === 'upload' && (
                <FileUpload
                  provider="hygraph"
                  type="image"
                  accept="image/*"
                  value={thumbnailUrl}
                  onChange={(url) => setThumbnailUrl(url)}
                  helperText="Upload image preview directly to Hygraph Assets."
                />
              )}

              {thumbnailInputMode === 'url' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste direct thumbnail URL (e.g. https://.../cover.jpg)"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value.trim())}
                      className="flex-1"
                    />
                    {thumbnailUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setThumbnailUrl('')}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {thumbnailUrl && (
                    <div className="p-2.5 rounded-xl bg-background border border-dark-border/80 flex items-center gap-3">
                      <div className="w-20 h-14 rounded-lg overflow-hidden border border-dark-border bg-dark-bg shrink-0">
                        <img
                          src={thumbnailUrl}
                          alt="Thumbnail Preview"
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
                        <p className="text-[11px] text-dark-muted font-mono truncate">{thumbnailUrl}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Switch
              checked={isFeatured}
              onChange={setIsFeatured}
              label="Feature in Mobile App"
              description="Displays prominently under recommended notes."
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

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete PDF Note"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
      />
    </div>
  );
};
