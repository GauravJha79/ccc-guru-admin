import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Layers,
  FileText,
  Users,
  Eye,
  CheckCircle,
  Clock,
  Sparkles,
  DollarSign,
  Star,
  BookOpen,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { Course } from '../../types/database';
import { courseService } from '../../services/courseService';
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
import { StatCard } from '../../components/common/StatCard';
import { FileUpload } from '../../components/common/FileUpload';
import { formatDate } from '../../lib/utils';
import { APP_CONFIG, COURSE_PRICE_CURRENCIES } from '../../constants/config';

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    freeCourses: 0,
    paidCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [publishFilter, setPublishFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_CONFIG.DEFAULT_PAGE_SIZE);

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionHi, setDescriptionHi] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<number | string>(0);
  const [currency, setCurrency] = useState('INR');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState<number | string>(0);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete & Duplicate
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<Course | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const [coursesData, revenueData] = await Promise.all([
        courseService.getCourses(),
        courseService.getRevenueStats(),
      ]);

      setCourses(coursesData);

      const published = coursesData.filter((c) => c.is_published).length;
      const free = coursesData.filter((c) => !c.is_paid).length;
      const paid = coursesData.filter((c) => c.is_paid).length;
      const enrollments = coursesData.reduce((acc, c) => acc + (c.enrollments_count || 0), 0);

      setStats({
        totalCourses: coursesData.length,
        publishedCourses: published,
        draftCourses: coursesData.length - published,
        freeCourses: free,
        paidCourses: paid,
        totalEnrollments: enrollments,
        totalRevenue: revenueData.totalRevenue,
      });
    } catch (err: any) {
      toastError('Fetch Error', err.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingCourse) {
      setSlug(generateSlug(val));
    }
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setTitle('');
    setTitleHi('');
    setSlug('');
    setDescription('');
    setDescriptionHi('');
    setThumbnail('');
    setIsPaid(false);
    setPrice(0);
    setCurrency('INR');
    setIsFeatured(false);
    setIsPublished(false);
    setSortOrder(courses.length + 1);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setTitleHi(course.title_hi || '');
    setSlug(course.slug);
    setDescription(course.description || '');
    setDescriptionHi(course.description_hi || '');
    setThumbnail(course.thumbnail || '');
    setIsPaid(course.is_paid);
    setPrice(course.price);
    setCurrency(course.currency || 'INR');
    setIsFeatured(course.is_featured);
    setIsPublished(course.is_published);
    setSortOrder(course.sort_order || 0);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!title.trim()) errors.title = 'Course title is required.';
    if (!titleHi.trim()) errors.titleHi = 'Hindi title is required.';
    if (!slug.trim()) errors.slug = 'Slug is required.';

    // Check slug uniqueness
    const slugExists = courses.some(
      (c) => c.slug === slug.trim() && c.id !== editingCourse?.id
    );
    if (slugExists) errors.slug = 'This slug is already in use. Please choose another.';

    if (isPaid && (Number(price) <= 0 || isNaN(Number(price)))) {
      errors.price = 'Paid courses must have a price greater than 0.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        title_hi: titleHi.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || null,
        description_hi: descriptionHi.trim() || null,
        thumbnail: thumbnail.trim() || null,
        is_paid: isPaid,
        price: isPaid ? Number(price) : 0,
        currency,
        is_featured: isFeatured,
        is_published: isPublished,
        sort_order: Number(sortOrder) || 0,
      };

      if (editingCourse) {
        const updated = await courseService.updateCourse(editingCourse.id, payload);
        setCourses((prev) =>
          prev.map((c) => (c.id === editingCourse.id ? { ...c, ...updated } : c))
        );
        success('Course Updated', `"${title}" was saved successfully.`);
      } else {
        const created = await courseService.createCourse(payload);
        setCourses((prev) => [created, ...prev]);
        success('Course Created', `"${title}" has been created.`);
        // Ask if admin wants to go directly to course builder
        setIsModalOpen(false);
        navigate(`/courses/${created.id}/builder`);
        return;
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not save course.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (course: Course) => {
    try {
      const nextPublished = !course.is_published;
      const updated = await courseService.updateCourse(course.id, {
        is_published: nextPublished,
      });
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, ...updated } : c))
      );
      success(
        nextPublished ? 'Course Published' : 'Course Unpublished',
        `"${course.title}" is now ${nextPublished ? 'Live' : 'Draft'}.`
      );
    } catch (err: any) {
      toastError('Update Failed', err.message);
    }
  };

  const handleToggleFeatured = async (course: Course) => {
    try {
      const nextFeatured = !course.is_featured;
      const updated = await courseService.updateCourse(course.id, {
        is_featured: nextFeatured,
      });
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, ...updated } : c))
      );
      success(
        nextFeatured ? 'Marked Featured' : 'Removed Featured',
        `"${course.title}" updated.`
      );
    } catch (err: any) {
      toastError('Update Failed', err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await courseService.deleteCourse(deleteTarget.id);
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      success('Course Deleted', `"${deleteTarget.title}" and its modules were removed.`);
      setDeleteTarget(null);
      fetchCourses();
    } catch (err: any) {
      toastError('Delete Failed', err.message || 'Could not delete course.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDuplicate = async () => {
    if (!duplicateTarget) return;
    setIsDuplicating(true);
    try {
      const duplicated = await courseService.duplicateCourse(duplicateTarget.id);
      success('Course Duplicated', `Created "${duplicated.title}" with complete module hierarchy.`);
      setDuplicateTarget(null);
      fetchCourses();
    } catch (err: any) {
      toastError('Duplicate Failed', err.message || 'Could not duplicate course structure.');
    } finally {
      setIsDuplicating(false);
    }
  };

  // Filtered Courses
  const filteredCourses = courses.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      c.title.toLowerCase().includes(query) ||
      (c.title_hi && c.title_hi.toLowerCase().includes(query)) ||
      c.slug.toLowerCase().includes(query);

    const matchPrice =
      priceFilter === ''
        ? true
        : priceFilter === 'paid'
        ? c.is_paid
        : !c.is_paid;

    const matchPublish =
      publishFilter === ''
        ? true
        : publishFilter === 'published'
        ? c.is_published
        : !c.is_published;

    const matchFeatured =
      featuredFilter === ''
        ? true
        : featuredFilter === 'featured'
        ? c.is_featured
        : !c.is_featured;

    return matchSearch && matchPrice && matchPublish && matchFeatured;
  });

  const totalPages = Math.ceil(filteredCourses.length / pageSize);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns: Column<Course>[] = [
    {
      key: 'course',
      header: 'Course',
      render: (item) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-12 h-12 rounded-2xl bg-lavender-500/10 border border-lavender-500/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <GraduationCap className="w-6 h-6 text-lavender-400" />
            )}
          </div>
          <div className="space-y-1 min-w-0 max-w-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-white text-xs hover:text-lavender-300 transition-colors">
                {item.title}
              </span>
              {item.is_featured && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Star className="w-2.5 h-2.5 fill-amber-400" /> Featured
                </span>
              )}
            </div>
            <p className="text-[11px] text-dark-muted truncate">{item.title_hi}</p>
            <p className="text-[10px] font-mono text-dark-dim truncate">/{item.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'pricing',
      header: 'Pricing',
      width: '130px',
      render: (item) => (
        <div className="space-y-1">
          {item.is_paid ? (
            <Badge variant="primary" size="sm">
              ₹{Number(item.price).toFixed(2)}
            </Badge>
          ) : (
            <Badge variant="success" size="sm">
              Free Course
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'structure',
      header: 'Content Structure',
      width: '180px',
      render: (item) => (
        <div className="flex items-center gap-2 text-xs">
          <div
            className="flex items-center gap-1 text-lavender-300 bg-lavender-500/10 px-2 py-1 rounded-lg border border-lavender-500/20"
            title="Total Modules"
          >
            <Layers className="w-3 h-3 text-lavender-400" />
            <span className="font-semibold">{item.modules_count || 0}</span>
            <span className="text-[10px] text-dark-muted">Mods</span>
          </div>
          <div
            className="flex items-center gap-1 text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20"
            title="Total Lessons"
          >
            <FileText className="w-3 h-3 text-indigo-400" />
            <span className="font-semibold">{item.lessons_count || 0}</span>
            <span className="text-[10px] text-dark-muted">Lessons</span>
          </div>
        </div>
      ),
    },
    {
      key: 'enrollments',
      header: 'Enrollments',
      width: '120px',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-white">
          <Users className="w-3.5 h-3.5 text-lavender-400" />
          <span className="font-bold">{item.enrollments_count || 0}</span>
          <span className="text-[11px] text-dark-muted">students</span>
        </div>
      ),
    },
    {
      key: 'published',
      header: 'Status',
      width: '130px',
      render: (item) => (
        <button
          onClick={() => handleTogglePublish(item)}
          className="cursor-pointer text-left group"
          title="Click to toggle status"
        >
          <Badge
            variant={item.is_published ? 'success' : 'neutral'}
            dot
          >
            {item.is_published ? 'Published' : 'Draft'}
          </Badge>
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '180px',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate(`/courses/${item.id}/builder`)}
            leftIcon={<Layers className="w-3 h-3" />}
          >
            Builder
          </Button>
          <button
            onClick={() => openEditModal(item)}
            className="p-1.5 text-dark-muted hover:text-lavender-300 hover:bg-lavender-500/10 rounded-lg transition-colors"
            title="Edit Course Settings"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDuplicateTarget(item)}
            className="p-1.5 text-dark-muted hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
            title="Duplicate Full Course"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            className="p-1.5 text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete Course"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-lavender-400" />
            Course Management
          </h2>
          <p className="text-xs text-dark-muted mt-0.5">
            Create structured courses with chapters, lessons, notes, tests, and quizzes.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-glow-sm"
        >
          Create New Course
        </Button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Courses"
          value={stats.totalCourses}
          icon={<GraduationCap className="w-5 h-5" />}
          subtitle={`${stats.publishedCourses} Published · ${stats.draftCourses} Draft`}
        />
        <StatCard
          title="Free vs Paid"
          value={`${stats.freeCourses} / ${stats.paidCourses}`}
          icon={<DollarSign className="w-5 h-5" />}
          subtitle={`${stats.freeCourses} Free · ${stats.paidCourses} Paid`}
        />
        <StatCard
          title="Total Enrollments"
          value={stats.totalEnrollments}
          icon={<Users className="w-5 h-5" />}
          subtitle="Across all courses"
        />
        <StatCard
          title="Verified Revenue"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          icon={<Sparkles className="w-5 h-5" />}
          subtitle="From successful transactions"
        />
      </div>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search courses by title, Hindi title, or slug..."
        filters={[
          {
            key: 'pricing',
            label: 'Pricing',
            value: priceFilter,
            options: [
              { value: 'free', label: 'Free Only' },
              { value: 'paid', label: 'Paid Only' },
            ],
            onChange: setPriceFilter,
          },
          {
            key: 'status',
            label: 'Status',
            value: publishFilter,
            options: [
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' },
            ],
            onChange: setPublishFilter,
          },
          {
            key: 'featured',
            label: 'Featured',
            value: featuredFilter,
            options: [
              { value: 'featured', label: 'Featured Only' },
              { value: 'regular', label: 'Regular Only' },
            ],
            onChange: setFeaturedFilter,
          },
        ]}
        hasActiveFilters={Boolean(
          searchQuery || priceFilter || publishFilter || featuredFilter
        )}
        onClearFilters={() => {
          setSearchQuery('');
          setPriceFilter('');
          setPublishFilter('');
          setFeaturedFilter('');
        }}
      />

      {/* Course Data Table */}
      <div className="space-y-0">
        <DataTable
          columns={columns}
          data={paginatedCourses}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          emptyTitle="No courses created yet"
          emptyDescription="Create your first structured CCC course with video lessons, study notes, and quizzes."
          emptyActionText="Create New Course"
          onEmptyAction={openCreateModal}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCourses.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Create / Edit Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? 'Edit Course Settings' : 'Create New Course'}
        subtitle="Configure course identity, bilingual titles, pricing and publishing options."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCourse} isLoading={isSaving}>
              {editingCourse ? 'Save Changes' : 'Create & Open Builder'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveCourse} className="space-y-5">
          {/* Titles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Course Title (English) *"
              placeholder="e.g. CCC Complete Master Course 2026"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              error={formErrors.title}
              required
            />
            <Input
              label="Course Title (Hindi) *"
              placeholder="e.g. सीसीसी सम्पूर्ण मास्टर कोर्स 2026"
              value={titleHi}
              onChange={(e) => setTitleHi(e.target.value)}
              error={formErrors.titleHi}
              required
            />
          </div>

          {/* Slug */}
          <Input
            label="URL Slug *"
            placeholder="e.g. ccc-complete-master-course-2026"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            error={formErrors.slug}
            helperText="Unique URL identifier for the course in mobile app and API"
            required
          />

          {/* Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Description (English)"
              placeholder="Detailed course overview..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Textarea
              label="Description (Hindi)"
              placeholder="कोर्स का विस्तृत विवरण..."
              rows={3}
              value={descriptionHi}
              onChange={(e) => setDescriptionHi(e.target.value)}
            />
          </div>

          {/* Thumbnail */}
          <div>
            <FileUpload
              bucket={APP_CONFIG.STORAGE_BUCKETS.COURSE_THUMBNAILS}
              value={thumbnail}
              onChange={(url: string) => setThumbnail(url)}
              type="image"
              label="Course Thumbnail Image"
              accept="image/*"
              helperText="Upload 16:9 banner or square poster (JPG, PNG, WebP up to 5MB)"
            />
          </div>

          {/* Pricing Section */}
          <div className="p-4 rounded-2xl bg-background-elevated/70 border border-dark-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Paid Course Option</p>
                <p className="text-[11px] text-dark-muted">
                  Toggle on to charge students via Razorpay checkout
                </p>
              </div>
              <Switch
                checked={isPaid}
                onChange={setIsPaid}
                label={isPaid ? 'Paid Course' : 'Free Course'}
              />
            </div>

            {isPaid && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dark-border/60">
                <Input
                  label="Price (₹) *"
                  type="number"
                  placeholder="199"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  error={formErrors.price}
                  min={1}
                  required
                />
                <Select
                  label="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={COURSE_PRICE_CURRENCIES}
                />
              </div>
            )}
          </div>

          {/* Publishing & Sort Order */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-3 rounded-xl bg-background-elevated/50 border border-dark-border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Publish Course</p>
                <p className="text-[10px] text-dark-muted">Visible to students</p>
              </div>
              <Switch checked={isPublished} onChange={setIsPublished} />
            </div>

            <div className="p-3 rounded-xl bg-background-elevated/50 border border-dark-border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Featured Badge</p>
                <p className="text-[10px] text-dark-muted">Highlight on home screen</p>
              </div>
              <Switch checked={isFeatured} onChange={setIsFeatured} />
            </div>

            <Input
              label="Sort Order"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All chapters, lessons, and enrollment records will be permanently removed.`}
      />

      {/* Confirm Duplicate Dialog */}
      <ConfirmDialog
        isOpen={Boolean(duplicateTarget)}
        onClose={() => setDuplicateTarget(null)}
        onConfirm={handleConfirmDuplicate}
        isLoading={isDuplicating}
        title="Duplicate Course"
        message={`Create a complete copy of "${duplicateTarget?.title}" including all its modules, lessons, notes, quizzes, and tests?`}
      />
    </div>
  );
};
