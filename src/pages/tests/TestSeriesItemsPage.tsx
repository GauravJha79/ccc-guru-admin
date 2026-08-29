import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Clock, Award, FileQuestion } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { TestSeriesItem, TestSeries, TestItemType, DifficultyLevel } from '../../types/database';
import { testService } from '../../services/testService';
import { DataTable, Column } from '../../components/common/DataTable';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Switch } from '../../components/common/Switch';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { TEST_TYPE_OPTIONS, DIFFICULTY_OPTIONS, APP_CONFIG } from '../../constants/config';
import { ROUTES } from '../../constants/routes';

export const TestSeriesItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [testSeriesItems, setTestSeriesItems] = useState<TestSeriesItem[]>([]);
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_CONFIG.DEFAULT_PAGE_SIZE);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestSeriesItem | null>(null);

  // Form Fields
  const [seriesId, setSeriesId] = useState('');
  const [title, setTitle] = useState('');
  const [testType, setTestType] = useState<TestItemType>('Mock');
  const [questionCount, setQuestionCount] = useState(100);
  const [duration, setDuration] = useState(90);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [totalMarks, setTotalMarks] = useState(100);
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(false);
  const [negativeMarks, setNegativeMarks] = useState(0.25);
  const [sortOrder, setSortOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [deleteTarget, setDeleteTarget] = useState<TestSeriesItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsData, seriesData] = await Promise.all([
        testService.getSeriesItems(),
        testService.getSeries(),
      ]);
      setTestSeriesItems(itemsData);
      setTestSeries(seriesData);
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
    const defaultSeriesId = seriesFilter || testSeries[0]?.id || '';
    setEditingItem(null);
    setSeriesId(defaultSeriesId);
    setTitle('');
    setTestType('Mock');
    setQuestionCount(100);
    setDuration(90);
    setDifficulty('Medium');
    setTotalMarks(100);
    setNegativeMarkingEnabled(false);
    setNegativeMarks(0.25);
    setSortOrder(testSeriesItems.length + 1);
    setIsPublished(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: TestSeriesItem) => {
    setEditingItem(item);
    setSeriesId(item.series_id);
    setTitle(item.title);
    setTestType(item.test_type);
    setQuestionCount(item.question_count);
    setDuration(item.duration);
    setDifficulty(item.difficulty);
    setTotalMarks(item.total_marks);
    setNegativeMarkingEnabled(item.negative_marking_enabled ?? item.negative_marking ?? false);
    setNegativeMarks(item.negative_marks);
    setSortOrder(item.sort_order ?? 1);
    setIsPublished(item.is_published);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!title.trim()) errors.title = 'Test item title is required.';
    if (!seriesId) errors.seriesId = 'Please select a parent test series.';
    if (Number(duration) <= 0) errors.duration = 'Duration must be greater than 0.';
    if (Number(questionCount) <= 0) errors.questionCount = 'Question count must be greater than 0.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload: any = {
        series_id: seriesId,
        title: title.trim(),
        test_type: testType,
        question_count: Number(questionCount),
        duration: Number(duration),
        difficulty,
        total_marks: Number(totalMarks),
        negative_marking_enabled: negativeMarkingEnabled,
        negative_marks: negativeMarkingEnabled ? Number(negativeMarks) : 0,
        is_published: isPublished,
        sort_order: Number(sortOrder),
      };

      if (editingItem) {
        const updated = await testService.updateSeriesItem(editingItem.id, payload);
        setTestSeriesItems((prev) =>
          prev.map((i) => (i.id === editingItem.id ? { ...i, ...updated } : i))
        );
        success('Test Set Updated', `Saved "${title}"`);
      } else {
        const created = await testService.createSeriesItem(payload);
        setTestSeriesItems((prev) => [...prev, created]);
        success('Test Set Created', `Created "${title}"`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not save test set.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await testService.deleteSeriesItem(deleteTarget.id);
      setTestSeriesItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      success('Test Set Deleted', `"${deleteTarget.title}" was removed.`);
      setDeleteTarget(null);
    } catch (err: any) {
      toastError('Delete Failed', err.message || 'Could not delete test set.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async (item: TestSeriesItem) => {
    try {
      const nextStatus = !item.is_published;
      await testService.updateSeriesItem(item.id, { is_published: nextStatus });
      setTestSeriesItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_published: nextStatus } : i))
      );
      success(nextStatus ? 'Set Published' : 'Set Unpublished', item.title);
    } catch (err: any) {
      toastError('Update Failed', err.message);
    }
  };

  const filteredItems = testSeriesItems
    .filter((item) => {
      const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSeries = seriesFilter === '' ? true : item.series_id === seriesFilter;
      const matchDifficulty = difficultyFilter === '' ? true : item.difficulty === difficultyFilter;
      const matchType = typeFilter === '' ? true : item.test_type === typeFilter;
      const matchStatus =
        statusFilter === '' ? true : statusFilter === 'published' ? item.is_published : !item.is_published;

      return matchSearch && matchSeries && matchDifficulty && matchType && matchStatus;
    })
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns: Column<TestSeriesItem>[] = [
    {
      key: 'sort_order',
      header: 'Order',
      width: '80px',
      align: 'center',
      render: (item) => (
        <span className="font-mono text-xs text-lavender-300 font-bold px-2 py-1 bg-lavender-500/10 rounded-lg">
          #{item.sort_order ?? 0}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Test Set / Title',
      render: (item) => {
        const series = testSeries.find((s) => s.id === item.series_id);
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{item.title}</span>
              <Badge variant="neutral" size="sm">{item.test_type}</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-dark-muted">
              <span className="text-lavender-300 font-medium">Series: {series?.title || 'Unknown'}</span>
              <span>•</span>
              <span className="text-dark-dim font-medium">{item.question_count} Qs Target</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'duration_marks',
      header: 'Duration & Marks',
      width: '160px',
      render: (item) => (
        <div className="text-xs space-y-0.5 text-dark-muted">
          <div className="flex items-center gap-1.5 text-white font-medium">
            <Clock className="w-3.5 h-3.5 text-lavender-400" />
            <span>{item.duration} Mins</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>{item.total_marks} Marks</span>
            {(item.negative_marking_enabled ?? item.negative_marking) && (
              <span className="text-rose-400 font-medium">(-{item.negative_marks})</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'difficulty',
      header: 'Difficulty',
      width: '120px',
      render: (item) => {
        const diffVariant =
          item.difficulty === 'Easy'
            ? 'success'
            : item.difficulty === 'Medium'
            ? 'warning'
            : 'danger';
        return <Badge variant={diffVariant}>{item.difficulty}</Badge>;
      },
    },
    {
      key: 'is_published',
      header: 'Status',
      width: '120px',
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
      key: 'assign_questions',
      header: 'Question Bank',
      width: '150px',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`${ROUTES.QUESTIONS}?testItemId=${item.id}`);
          }}
          leftIcon={<FileQuestion className="w-3.5 h-3.5" />}
        >
          Manage Qs
        </Button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEditModal(item)}
            className="p-1.5 text-dark-muted hover:text-lavender-300 hover:bg-lavender-500/10 rounded-lg transition-colors"
            title="Edit Test Set"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            className="p-1.5 text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete Test Set"
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
        searchPlaceholder="Search test sets by title..."
        filters={[
          {
            key: 'series',
            label: 'Series',
            value: seriesFilter,
            options: testSeries.map((s) => ({ value: s.id, label: s.title })),
            onChange: setSeriesFilter,
          },
          {
            key: 'difficulty',
            label: 'Difficulty',
            value: difficultyFilter,
            options: DIFFICULTY_OPTIONS.map((d) => ({ value: d.value, label: d.label })),
            onChange: setDifficultyFilter,
          },
          {
            key: 'type',
            label: 'Test Type',
            value: typeFilter,
            options: TEST_TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label })),
            onChange: setTypeFilter,
          },
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            options: [
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' },
            ],
            onChange: setStatusFilter,
          },
        ]}
        hasActiveFilters={Boolean(
          searchQuery || seriesFilter || difficultyFilter || typeFilter || statusFilter
        )}
        onClearFilters={() => {
          setSearchQuery('');
          setSeriesFilter('');
          setDifficultyFilter('');
          setTypeFilter('');
          setStatusFilter('');
        }}
        actionButton={{
          label: 'New Test Set',
          onClick: openCreateModal,
        }}
      />

      <div className="space-y-0">
        <DataTable
          columns={columns}
          data={paginatedItems}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          emptyTitle="No test sets found"
          emptyDescription="Create a test set in Supabase and link questions to it."
          emptyActionText="Create Test Set"
          onEmptyAction={openCreateModal}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredItems.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        title={editingItem ? 'Edit Test Set' : 'Create New Test Set'}
        subtitle="Define test parameters, duration, question target and scoring scheme in Supabase"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? 'Save Changes' : 'Create Test Set'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Parent Test Series"
              value={seriesId}
              onChange={(e) => setSeriesId(e.target.value)}
              options={testSeries.map((s) => ({ value: s.id, label: s.title }))}
              error={formErrors.seriesId}
              required
            />

            <Input
              label="Test Set Title"
              placeholder="e.g. CCC Full Mock Test 01"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={formErrors.title}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Test Type"
              value={testType}
              onChange={(e) => setTestType(e.target.value as TestItemType)}
              options={TEST_TYPE_OPTIONS}
            />

            <Select
              label="Difficulty Level"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              options={DIFFICULTY_OPTIONS}
            />

            <Input
              label="Question Count Target"
              type="number"
              min={1}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              error={formErrors.questionCount}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Duration (Minutes)"
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              error={formErrors.duration}
              required
            />

            <Input
              label="Total Marks"
              type="number"
              min={1}
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
              required
            />

            <Input
              label="Sort Order"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              required
            />
          </div>

          <div className="p-4 rounded-2xl bg-background-elevated/50 border border-dark-border space-y-4">
            <Switch
              checked={negativeMarkingEnabled}
              onChange={setNegativeMarkingEnabled}
              label="Enable Negative Marking"
              description="Deducts marks for incorrect answers (CCC NIELIT is normally 0 penalty)."
            />

            {negativeMarkingEnabled && (
              <div className="pt-2 border-t border-dark-border/60 max-w-xs">
                <Input
                  label="Negative Marks per Wrong Answer"
                  type="number"
                  step="0.05"
                  min="0.05"
                  value={negativeMarks}
                  onChange={(e) => setNegativeMarks(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          <div className="pt-1">
            <Switch
              checked={isPublished}
              onChange={setIsPublished}
              label="Published Status"
              description="Users will only see and attempt this test set when published."
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Test Set"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? Any question links to this test set will be unlinked.`}
      />
    </div>
  );
};
