import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  ExternalLink,
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
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [pageCount, setPageCount] = useState(1);
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

  const filteredNotes = notes.filter((n) => {
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
  });

  const totalPages = Math.ceil(filteredNotes.length / pageSize);
  const paginatedNotes = filteredNotes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns: Column<Note>[] = [
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

      <div className="space-y-0">
        <DataTable
          columns={columns}
          data={paginatedNotes}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          emptyTitle="No PDF notes found in Supabase"
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
        subtitle="Stores PDF documents and cover thumbnails in Supabase Storage"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Note Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={noteCategories.map((c) => ({ value: c.id, label: c.title }))}
              error={formErrors.categoryId}
              required
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FileUpload
                bucket={APP_CONFIG.STORAGE_BUCKETS.NOTES_PDF}
                type="pdf"
                accept="application/pdf"
                label="PDF Document *"
                value={pdfUrl}
                currentFileName={fileName}
                onChange={(url, meta) => {
                  setPdfUrl(url);
                  if (meta) {
                    setFileName(meta.fileName);
                    setFileSize(meta.fileSize);
                  }
                }}
                helperText={formErrors.pdfUrl ? formErrors.pdfUrl : 'Upload the study PDF file to Supabase Storage.'}
              />
            </div>
            <div>
              <FileUpload
                bucket={APP_CONFIG.STORAGE_BUCKETS.NOTES_THUMBNAILS}
                type="image"
                accept="image/*"
                label="Cover Thumbnail (Optional)"
                value={thumbnailUrl}
                onChange={(url) => setThumbnailUrl(url)}
                helperText="Optional image preview shown on the mobile screen."
              />
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
        message={`Are you sure you want to delete "${deleteTarget?.title}" from Supabase?`}
      />
    </div>
  );
};
