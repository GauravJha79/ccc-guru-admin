import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  ShieldAlert,
  Percent,
  CheckCircle2,
  Layers,
  FileText,
  Eye,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import {
  CourseEnrollment,
  Course,
  CourseAccessType,
  CourseEnrollmentStatus,
} from '../../types/database';
import { courseService } from '../../services/courseService';
import { DataTable, Column } from '../../components/common/DataTable';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { formatDate } from '../../lib/utils';
import {
  COURSE_ACCESS_OPTIONS,
  COURSE_STATUS_OPTIONS,
  APP_CONFIG,
} from '../../constants/config';

export const CourseEnrollmentsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [accessFilter, setAccessFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_CONFIG.DEFAULT_PAGE_SIZE);

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<CourseEnrollment | null>(null);

  // Form Fields
  const [courseId, setCourseId] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [accessType, setAccessType] = useState<CourseAccessType>('free');
  const [status, setStatus] = useState<CourseEnrollmentStatus>('active');
  const [expiresAt, setExpiresAt] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete & Revoke
  const [deleteTarget, setDeleteTarget] = useState<CourseEnrollment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Progress Inspector Modal
  const [inspectTarget, setInspectTarget] = useState<CourseEnrollment | null>(null);
  const [userProgressDetails, setUserProgressDetails] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [enrollmentsData, coursesData] = await Promise.all([
        courseService.getEnrollments(),
        courseService.getCourses(),
      ]);
      setEnrollments(enrollmentsData);
      setCourses(coursesData);
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
    setCourseId(courses[0]?.id || '');
    setUserName('');
    setUserEmail('');
    setAccessType('free');
    setStatus('active');
    setExpiresAt('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: CourseEnrollment) => {
    setEditingEnrollment(item);
    setCourseId(item.course_id);
    setUserName(item.user_name || '');
    setUserEmail(item.user_email || '');
    setAccessType(item.access_type);
    setStatus(item.status);
    setExpiresAt(item.expires_at ? item.expires_at.split('T')[0] : '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openProgressModal = async (item: CourseEnrollment) => {
    setInspectTarget(item);
    setLoadingProgress(true);
    try {
      const details = await courseService.getUserCourseProgress(item.user_id, item.course_id);
      setUserProgressDetails(details);
    } catch (err: any) {
      toastError('Progress Error', err.message);
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!userName.trim()) errors.userName = 'User name is required.';
    if (!userEmail.trim()) errors.userEmail = 'User email is required.';
    if (!courseId) errors.courseId = 'Please select a course.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        user_id: editingEnrollment?.user_id || `usr-${Date.now()}`,
        user_name: userName.trim(),
        user_email: userEmail.trim().toLowerCase(),
        course_id: courseId,
        access_type: accessType,
        status,
        enrolled_at: editingEnrollment?.enrolled_at || new Date().toISOString(),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      if (editingEnrollment) {
        const updated = await courseService.updateEnrollment(editingEnrollment.id, payload);
        setEnrollments((prev) =>
          prev.map((e) => (e.id === editingEnrollment.id ? { ...e, ...updated } : e))
        );
        success('Enrollment Updated', `Saved access for ${userName}`);
      } else {
        const created = await courseService.createEnrollment(payload);
        setEnrollments((prev) => [created, ...prev]);
        success('Student Enrolled', `Enrolled ${userName} into course`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not save enrollment.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (item: CourseEnrollment) => {
    try {
      const nextStatus: CourseEnrollmentStatus =
        item.status === 'active' ? 'revoked' : 'active';
      const updated = await courseService.updateEnrollment(item.id, { status: nextStatus });
      setEnrollments((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, ...updated } : e))
      );
      success('Status Changed', `Enrollment marked as ${nextStatus}.`);
    } catch (err: any) {
      toastError('Update Failed', err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await courseService.deleteEnrollment(deleteTarget.id);
      setEnrollments((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      success('Access Revoked', 'Student enrollment removed in Supabase.');
      setDeleteTarget(null);
    } catch (err: any) {
      toastError('Revoke Failed', err.message || 'Could not revoke enrollment.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats
  const total = enrollments.length;
  const activeCount = enrollments.filter((e) => e.status === 'active').length;
  const revokedCount = enrollments.filter((e) => e.status === 'revoked').length;
  const paidCount = enrollments.filter((e) => e.access_type === 'paid').length;

  const filteredEnrollments = enrollments.filter((e) => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      (e.user_name && e.user_name.toLowerCase().includes(query)) ||
      (e.user_email && e.user_email.toLowerCase().includes(query));

    const matchCourse = courseFilter === '' ? true : e.course_id === courseFilter;
    const matchAccess = accessFilter === '' ? true : e.access_type === accessFilter;
    const matchStatus = statusFilter === '' ? true : e.status === statusFilter;

    return matchSearch && matchCourse && matchAccess && matchStatus;
  });

  const totalPages = Math.ceil(filteredEnrollments.length / pageSize);
  const paginatedEnrollments = filteredEnrollments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns: Column<CourseEnrollment>[] = [
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
      key: 'course',
      header: 'Enrolled Course',
      render: (item) => {
        const c = item.course || courses.find((x) => x.id === item.course_id);
        return (
          <div className="flex items-center gap-2 text-xs text-white">
            <GraduationCap className="w-4 h-4 text-lavender-400 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold truncate">{c?.title || 'Unknown Course'}</p>
              <p className="text-[10px] text-dark-muted truncate">{c?.title_hi}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'access_type',
      header: 'Access Tier',
      width: '120px',
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
      key: 'progress',
      header: 'Course Progress',
      width: '160px',
      render: (item) => {
        const pct = item.progress_percentage || 0;
        return (
          <button
            onClick={() => openProgressModal(item)}
            className="w-full text-left group hover:opacity-90 transition-opacity"
            title="Click to view detailed lesson completions"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-white">{pct}%</span>
                <span className="text-[10px] text-dark-muted">
                  {item.completed_lessons_count || 0}/{item.total_lessons_count || 0} Lessons
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-background-elevated overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-lavender-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                />
              </div>
            </div>
          </button>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
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
            title="Click to toggle active/revoked"
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
      width: '130px',
      render: (item) => (
        <span className="text-xs text-dark-muted">{formatDate(item.enrolled_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '140px',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openProgressModal(item)}
            className="p-1.5 text-dark-muted hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
            title="View Progress Details"
          >
            <Eye className="w-4 h-4" />
          </button>
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
            title="Revoke / Delete Access"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-lavender-400" />
            Course Enrollments & Access
          </h2>
          <p className="text-xs text-dark-muted mt-0.5">
            Manage student course admissions, access tiers, completion progress, and permissions.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-glow-sm"
        >
          Manual Enroll Student
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Enrollments"
          value={total}
          icon={<Users className="w-5 h-5" />}
          subtitle="Across all courses"
        />
        <StatCard
          title="Active Students"
          value={activeCount}
          icon={<CheckCircle className="w-5 h-5" />}
          subtitle={`${Math.round((activeCount / (total || 1)) * 100)}% active rate`}
        />
        <StatCard
          title="Paid Enrollments"
          value={paidCount}
          icon={<GraduationCap className="w-5 h-5" />}
          subtitle="From course sales"
        />
        <StatCard
          title="Revoked Access"
          value={revokedCount}
          icon={<ShieldAlert className="w-5 h-5" />}
          subtitle="Blocked accounts"
        />
      </div>

      {/* Filter Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search student name or email..."
        filters={[
          {
            key: 'course',
            label: 'Course',
            value: courseFilter,
            options: courses.map((c) => ({ value: c.id, label: c.title })),
            onChange: setCourseFilter,
          },
          {
            key: 'access',
            label: 'Access Tier',
            value: accessFilter,
            options: COURSE_ACCESS_OPTIONS,
            onChange: setAccessFilter,
          },
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            options: COURSE_STATUS_OPTIONS,
            onChange: setStatusFilter,
          },
        ]}
        hasActiveFilters={Boolean(
          searchQuery || courseFilter || accessFilter || statusFilter
        )}
        onClearFilters={() => {
          setSearchQuery('');
          setCourseFilter('');
          setAccessFilter('');
          setStatusFilter('');
        }}
      />

      {/* Data Table */}
      <div className="space-y-0">
        <DataTable
          columns={columns}
          data={paginatedEnrollments}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          emptyTitle="No course enrollments found"
          emptyDescription="Mobile app users who start or purchase a course will appear here."
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

      {/* Manual / Edit Enrollment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEnrollment ? 'Edit Course Enrollment' : 'Grant Course Access'}
        subtitle="Manage student subscription and course access permissions in Supabase"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              {editingEnrollment ? 'Save Changes' : 'Grant Access'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Select
            label="Course *"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            options={courses.map((c) => ({
              value: c.id,
              label: `${c.title} (${c.is_paid ? `₹${c.price}` : 'Free'})`,
            }))}
            error={formErrors.courseId}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Access Tier"
              value={accessType}
              onChange={(e) => setAccessType(e.target.value as CourseAccessType)}
              options={COURSE_ACCESS_OPTIONS}
            />
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as CourseEnrollmentStatus)}
              options={COURSE_STATUS_OPTIONS}
            />
            <Input
              label="Expiry Date (Optional)"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Progress Inspector Modal */}
      <Modal
        isOpen={Boolean(inspectTarget)}
        onClose={() => setInspectTarget(null)}
        title="Student Learning Progress"
        subtitle={`Detailed breakdown for ${inspectTarget?.user_name} (${inspectTarget?.user_email})`}
        size="lg"
        footer={
          <Button onClick={() => setInspectTarget(null)}>
            Close
          </Button>
        }
      >
        {inspectTarget && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-background-elevated/70 border border-dark-border flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-dark-muted font-semibold">Course:</p>
                <p className="text-sm font-bold text-white">
                  {inspectTarget.course?.title || 'Selected Course'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-lavender-300">
                  {userProgressDetails?.progressPercentage || inspectTarget.progress_percentage || 0}%
                </p>
                <p className="text-[10px] text-dark-muted">Overall Completed</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-xl bg-background border border-dark-border space-y-1">
                <p className="text-xl font-bold text-white">
                  {userProgressDetails?.completedLessonsCount || 0} / {userProgressDetails?.totalLessonsCount || 0}
                </p>
                <p className="text-xs text-dark-muted">Lessons Completed</p>
              </div>
              <div className="p-3 rounded-xl bg-background border border-dark-border space-y-1">
                <p className="text-xl font-bold text-white">
                  {userProgressDetails?.completedModulesCount || 0} / {userProgressDetails?.totalModulesCount || 0}
                </p>
                <p className="text-xs text-dark-muted">Chapters Finished</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-background border border-dark-border text-xs text-dark-muted flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Completion tracking dynamically reads from <code>course_lesson_progress</code>.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete / Revoke Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Revoke Course Enrollment"
        message={`Are you sure you want to revoke course access for "${deleteTarget?.user_name}"?`}
      />
    </div>
  );
};
