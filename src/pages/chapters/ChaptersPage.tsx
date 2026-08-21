import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { Chapter } from '../../types/database';
import { chapterService } from '../../services/chapterService';
import { DataTable, Column } from '../../components/common/DataTable';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Switch } from '../../components/common/Switch';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export const ChaptersPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [hindiTitle, setHindiTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [deleteTarget, setDeleteTarget] = useState<Chapter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchChapters = async () => {
    setLoading(true);
    try {
      const data = await chapterService.getChapters();
      setChapters(data);
    } catch (err: any) {
      toastError('Fetch Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, []);

  const openCreateModal = () => {
    setEditingChapter(null);
    setTitle('');
    setHindiTitle('');
    setDescription('');
    setSortOrder(chapters.length + 1);
    setIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (ch: Chapter) => {
    setEditingChapter(ch);
    setTitle(ch.title);
    setHindiTitle(ch.hindi_title);
    setDescription(ch.description || '');
    setSortOrder(ch.sort_order);
    setIsActive(ch.is_active);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!title.trim()) errors.title = 'English chapter title is required.';
    if (!hindiTitle.trim()) errors.hindiTitle = 'Hindi chapter title is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        hindi_title: hindiTitle.trim(),
        description: description.trim(),
        sort_order: Number(sortOrder),
        is_active: isActive,
      };

      if (editingChapter) {
        const updated = await chapterService.updateChapter(editingChapter.id, payload);
        setChapters((prev) =>
          prev.map((c) => (c.id === editingChapter.id ? { ...c, ...updated } : c))
        );
        success('Chapter Updated', `Saved "${title}"`);
      } else {
        const created = await chapterService.createChapter(payload);
        setChapters((prev) => [...prev, created]);
        success('Chapter Created', `Created "${title}"`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not save chapter.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await chapterService.deleteChapter(deleteTarget.id);
      setChapters((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      success('Chapter Deleted', `"${deleteTarget.title}" was removed.`);
      setDeleteTarget(null);
    } catch (err: any) {
      toastError('Delete Failed', err.message || 'Could not delete chapter.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredChapters = chapters
    .filter((ch) => {
      const query = searchQuery.toLowerCase();
      const matchSearch =
        ch.title.toLowerCase().includes(query) ||
        ch.hindi_title.toLowerCase().includes(query) ||
        (ch.description && ch.description.toLowerCase().includes(query));
      const matchStatus =
        statusFilter === '' ? true : statusFilter === 'active' ? ch.is_active : !ch.is_active;

      return matchSearch && matchStatus;
    })
    .sort((a, b) => a.sort_order - b.sort_order);

  const columns: Column<Chapter>[] = [
    {
      key: 'sort_order',
      header: 'Order',
      width: '80px',
      align: 'center',
      render: (item) => (
        <span className="font-mono text-xs text-lavender-300 font-bold px-2 py-1 bg-lavender-500/10 rounded-lg">
          #{item.sort_order}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Bilingual Chapter Title',
      render: (item) => (
        <div className="space-y-1">
          <div className="font-bold text-white text-sm">{item.title}</div>
          <div className="text-xs text-lavender-300 font-medium">{item.hindi_title}</div>
          {item.description && (
            <p className="text-xs text-dark-dim truncate max-w-md">{item.description}</p>
          )}
        </div>
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
            title="Edit Chapter"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            className="p-1.5 text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete Chapter"
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
        searchPlaceholder="Search chapters by English or Hindi name..."
        filters={[
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
        hasActiveFilters={Boolean(searchQuery || statusFilter)}
        onClearFilters={() => {
          setSearchQuery('');
          setStatusFilter('');
        }}
        actionButton={{
          label: 'New Chapter',
          onClick: openCreateModal,
        }}
      />

      <DataTable
        columns={columns}
        data={filteredChapters}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        emptyTitle="No syllabus chapters found"
        emptyDescription="Create your first chapter in Supabase to begin categorizing exam questions."
        emptyActionText="Create Chapter"
        onEmptyAction={openCreateModal}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        title={editingChapter ? 'Edit Syllabus Chapter' : 'Create New Syllabus Chapter'}
        subtitle="Provide bilingual title and descriptions in Supabase"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingChapter ? 'Save Changes' : 'Create Chapter'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Chapter Title (English)"
              placeholder="e.g. Introduction to Computer & Operating System"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={formErrors.title}
              required
            />

            <Input
              label="अध्याय का नाम (Hindi)"
              placeholder="उदा. कंप्यूटर का परिचय और ऑपरेटिंग सिस्टम"
              value={hindiTitle}
              onChange={(e) => setHindiTitle(e.target.value)}
              error={formErrors.hindiTitle}
              required
            />
          </div>

          <Textarea
            label="Key Topics / Description"
            placeholder="Hardware, software, GUI concepts, file extensions..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <Input
              label="Syllabus Order Number"
              type="number"
              min={1}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
            <div className="pt-4">
              <Switch
                checked={isActive}
                onChange={setIsActive}
                label="Active Status"
                description="Inactive chapters will be hidden from mobile filters."
              />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Chapter"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
      />
    </div>
  );
};
