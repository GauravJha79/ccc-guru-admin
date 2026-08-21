import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  Layers,
  Edit2,
  Trash2,
  Plus,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { SeriesEnrollment, TestSeries, EnrollmentAccessType, EnrollmentStatus } from '../../types/database';
import { enrollmentService } from '../../services/enrollmentService';
import { testService } from '../../services/testService';
import { DataTable, Column } from '../../components/common/DataTable';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../lib/utils';
import { ENROLLMENT_ACCESS_OPTIONS, ENROLLMENT_STATUS_OPTIONS, APP_CONFIG } from '../../constants/config';

export const EnrollmentsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [enrollments, setEnrollments] = useState<SeriesEnrollment[]>([]);
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('');
  const [accessFilter, setAccessFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_CONFIG.DEFAULT_PAGE_SIZE);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<SeriesEnrollment | null>(null);

  // Form Fields
  const [seriesId, setSeriesId] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [accessType, setAccessType] = useState<EnrollmentAccessType>('free');
  const [status, setStatus] = useState<EnrollmentStatus>('active');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [deleteTarget, setDeleteTarget] = useState<SeriesEnrollment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [enrollmentsData, seriesData] = await Promise.all([
        enrollmentService.getEnrollments(),
        testService.getSeries(),
      ]);
      setEnrollments(enrollmentsData);
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
    setEditingEnrollment(null);
    setSeriesId(testSeries[0]?.id || '');
    setUserName('');
    setUserEmail('');
    setAccessType('free');
    setStatus('active');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: SeriesEnrollment) => {
    setEditingEnrollment(item);
    setSeriesId(item.series_id);
    setUserName(item.user_name || '');
    setUserEmail(item.user_email || '');
    setAccessType(item.access_type);
    setStatus(item.status);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!userName.trim()) errors.userName = 'User name is required.';
    if (!userEmail.trim()) errors.userEmail = 'User email is required.';
    if (!seriesId) errors.seriesId = 'Please select a test series.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        user_id: editingEnrollment?.user_id || `usr-${Date.now()}`,
        user_name: userName.trim(),
        user_email: userEmail.trim().toLowerCase(),
        series_id: seriesId,
        access_type: accessType,
        status,
      };

      if (editingEnrollment) {
        const updated = await enrollmentService.updateEnrollment(editingEnrollment.id, payload);
        setEnrollments((prev) =>
          prev.map((e) => (e.id === editingEnrollment.id ? { ...e, ...updated } : e))
        );
        success('Enrollment Updated', `Saved for ${userName}`);
      } else {
        const created = await enrollmentService.createEnrollment(payload);
        setEnrollments((prev) => [created, ...prev]);
        success('Student Enrolled', `Enrolled ${userName}`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not save enrollment.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await enrollmentService.deleteEnrollment(deleteTarget.id);
      setEnrollments((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      success('Enrollment Revoked', 'Student access removed in Supabase.');
      setDeleteTarget(null);
    } catch (err: any) {
      toastError('Revoke Failed', err.message || 'Could not revoke enrollment.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (item: SeriesEnrollment) => {
    try {
      const nextStatus: EnrollmentStatus = item.status === 'active' ? 'revoked' : 'active';
      const updated = await enrollmentService.updateEnrollment(item.id, { status: nextStatus });
      setEnrollments((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, ...updated } : e))
      );
      success('Status Changed', `Enrollment marked as ${nextStatus}.`);
    } catch (err: any) {
      toastError('Update Failed', err.message);
    }
  };

  const filteredEnrollments = enrollments.filter((e) => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      (e.user_name && e.user_name.toLowerCase().includes(query)) ||
      (e.user_email && e.user_email.toLowerCase().includes(query));

    const matchSeries = seriesFilter === '' ? true : e.series_id === seriesFilter;
    const matchAccess = accessFilter === '' ? true : e.access_type === accessFilter;
    const matchStatus = statusFilter === '' ? true : e.status === statusFilter;

    return matchSearch && matchSeries && matchAccess && matchStatus;
  });

  const totalPages = Math.ceil(filteredEnrollments.length / pageSize);
  const paginatedEnrollments = filteredEnrollments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns: Column<SeriesEnrollment>[] = [
    {
      key: 'user',
      header: 'Student Info',
      render: (item) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-8 h-8 rounded-xl bg-lavender-500/20 text-lavender-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
            {item.user_name ? item.user_name[0].toUpperCase() : 'U'}
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="font-bold text-white text-xs truncate">{item.user_name || 'Anonymous'}</p>
            <p className="text-[11px] text-dark-muted truncate">{item.user_email || 'No email'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'series',
      header: 'Enrolled Test Series',
      render: (item) => {
        const series = testSeries.find((s) => s.id === item.series_id);
        return (
          <div className="flex items-center gap-1.5 text-xs text-white">
            <Layers className="w-3.5 h-3.5 text-lavender-400" />
            <span className="font-semibold">{series?.title || 'Unknown Series'}</span>
          </div>
        );
      },
    },
    {
      key: 'access_type',
      header: 'Access Tier',
      width: '130px',
      render: (item) => {
        const variant =
          item.access_type === 'paid'
            ? 'primary'
            : item.access_type === 'promotional'
            ? 'warning'
            : 'neutral';
        return <Badge variant={variant} size="sm" className="capitalize">{item.access_type}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (item) => {
        const variant =
          item.status === 'active'
            ? 'success'
            : item.status === 'expired'
            ? 'warning'
            : 'danger';

        return (
          <button
            onClick={() => handleToggleStatus(item)}
            className="cursor-pointer text-left"
            title="Click to toggle status"
          >
            <Badge variant={variant} dot className="capitalize">
              {item.status}
            </Badge>
          </button>
        );
      },
    },
    {
      key: 'enrolled_at',
      header: 'Enrolled On',
      width: '140px',
      render: (item) => (
        <span className="text-xs text-dark-muted">{formatDate(item.enrolled_at)}</span>
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
            title="Edit Enrollment"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            className="p-1.5 text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Revoke Enrollment"
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
        searchPlaceholder="Search students by name or email..."
        filters={[
          {
            key: 'series',
            label: 'Series',
            value: seriesFilter,
            options: testSeries.map((s) => ({ value: s.id, label: s.title })),
            onChange: setSeriesFilter,
          },
          {
            key: 'access',
            label: 'Access Type',
            value: accessFilter,
            options: ENROLLMENT_ACCESS_OPTIONS,
            onChange: setAccessFilter,
          },
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            options: ENROLLMENT_STATUS_OPTIONS,
            onChange: setStatusFilter,
          },
        ]}
        hasActiveFilters={Boolean(
          searchQuery || seriesFilter || accessFilter || statusFilter
        )}
        onClearFilters={() => {
          setSearchQuery('');
          setSeriesFilter('');
          setAccessFilter('');
          setStatusFilter('');
        }}
        actionButton={{
          label: 'Manual Enroll',
          onClick: openCreateModal,
        }}
      />

      <div className="space-y-0">
        <DataTable
          columns={columns}
          data={paginatedEnrollments}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          emptyTitle="No enrollments found in Supabase"
          emptyDescription="Mobile app users who enroll in test series will appear here."
          emptyActionText="Enroll Student Manually"
          onEmptyAction={openCreateModal}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredEnrollments.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEnrollment ? 'Edit Enrollment' : 'Grant Series Access'}
        subtitle="Manage student subscription and test series enrollment in Supabase"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingEnrollment ? 'Save Changes' : 'Grant Access'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Select
            label="Test Series *"
            value={seriesId}
            onChange={(e) => setSeriesId(e.target.value)}
            options={testSeries.map((s) => ({ value: s.id, label: s.title }))}
            error={formErrors.seriesId}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Student Name *"
              placeholder="e.g. Rahul Sharma"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              error={formErrors.userName}
              required
            />
            <Input
              label="Student Email *"
              type="email"
              placeholder="rahul@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              error={formErrors.userEmail}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Access Type"
              value={accessType}
              onChange={(e) => setAccessType(e.target.value as EnrollmentAccessType)}
              options={ENROLLMENT_ACCESS_OPTIONS}
            />
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as EnrollmentStatus)}
              options={ENROLLMENT_STATUS_OPTIONS}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Revoke Enrollment"
        message={`Are you sure you want to revoke test series access for "${deleteTarget?.user_name}"?`}
      />
    </div>
  );
};
