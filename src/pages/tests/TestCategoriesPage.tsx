import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { TestCategory } from '../../types/database';
import { testService } from '../../services/testService';
import { DataTable, Column } from '../../components/common/DataTable';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Input } from '../../components/common/Input';
import { Switch } from '../../components/common/Switch';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../lib/utils';

export const TestCategoriesPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [testCategories, setTestCategories] = useState<TestCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TestCategory | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [deleteTarget, setDeleteTarget] = useState<TestCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await testService.getCategories();
      setTestCategories(data);
    } catch (err: any) {
      toastError('Fetch Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setTitle('');
    setSortOrder(testCategories.length + 1);
    setIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (cat: TestCategory) => {
    setEditingCategory(cat);
    setTitle(cat.title);
    setSortOrder(cat.sort_order);
    setIsActive(cat.is_active);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!title.trim()) errors.title = 'Category title is required.';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (editingCategory) {
        const updated = await testService.updateCategory(editingCategory.id, {
          title: title.trim(),
          sort_order: Number(sortOrder),
          is_active: isActive,
        });
        setTestCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, ...updated } : c))
        );
        success('Category Updated', `Updated "${title}"`);
      } else {
        const created = await testService.createCategory({
          title: title.trim(),
          sort_order: Number(sortOrder),
          is_active: isActive,
        });
        setTestCategories((prev) => [...prev, created]);
        success('Category Created', `Created "${title}"`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not save category.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await testService.deleteCategory(deleteTarget.id);
      setTestCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      success('Category Deleted', `"${deleteTarget.title}" was removed.`);
      setDeleteTarget(null);
    } catch (err: any) {
      toastError('Delete Failed', err.message || 'Could not delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = testCategories
    .filter((cat) => {
      const matchSearch = cat.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === '' ? true : statusFilter === 'active' ? cat.is_active : !cat.is_active;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => a.sort_order - b.sort_order);

  const columns: Column<TestCategory>[] = [
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
      header: 'Category Title',
      render: (item) => (
        <div className="font-semibold text-white">{item.title}</div>
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
      key: 'created_at',
      header: 'Created On',
      width: '180px',
      render: (item) => (
        <span className="text-xs text-dark-muted">{formatDate(item.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEditModal(item)}
            className="p-1.5 text-dark-muted hover:text-lavender-300 hover:bg-lavender-500/10 rounded-lg transition-colors"
            title="Edit category"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            className="p-1.5 text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Search & Action Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search test categories..."
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
          label: 'New Category',
          onClick: openCreateModal,
        }}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        emptyTitle="No test categories found"
        emptyDescription="Create your first test category to organize mock tests and series."
        emptyActionText="Create Category"
        onEmptyAction={openCreateModal}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Test Category' : 'Create Test Category'}
        subtitle="Organize mock test series into logical syllabus groups"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Category Title"
            placeholder="e.g. CCC Full Mock Tests"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={formErrors.title}
            required
          />

          <Input
            label="Sort Order"
            type="number"
            min={1}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            helperText="Lower numbers appear first on the mobile app home screen."
          />

          <div className="pt-2">
            <Switch
              checked={isActive}
              onChange={setIsActive}
              label="Active Status"
              description="Inactive categories will be hidden from mobile users."
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Test Category"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? Any test series belonging to this category will become unassigned.`}
      />
    </div>
  );
};
