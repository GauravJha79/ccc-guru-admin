import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Users, FileText } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { TestSeries, TestCategory } from "../../types/database";
import { testService } from "../../services/testService";
import { DataTable, Column } from "../../components/common/DataTable";
import { SearchFilterBar } from "../../components/common/SearchFilterBar";
import { Pagination } from "../../components/common/Pagination";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Input } from "../../components/common/Input";
import { Textarea } from "../../components/common/Textarea";
import { Select } from "../../components/common/Select";
import { Switch } from "../../components/common/Switch";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { formatDate, formatCurrency } from "../../lib/utils";
import { APP_CONFIG } from "../../constants/config";

export const TestSeriesPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [testCategories, setTestCategories] = useState<TestCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_CONFIG.DEFAULT_PAGE_SIZE);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<TestSeries | null>(null);

  // Form State
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredTag, setFeaturedTag] = useState("");
  const [featuredShortDesc, setFeaturedShortDesc] = useState("");
  const [totalSets, setTotalSets] = useState(5);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState("INR");
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [deleteTarget, setDeleteTarget] = useState<TestSeries | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [seriesData, catData] = await Promise.all([
        testService.getSeries(),
        testService.getCategories(),
      ]);
      setTestSeries(seriesData);
      setTestCategories(catData);
    } catch (err: any) {
      toastError("Fetch Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingSeries(null);
    setCategoryId(testCategories[0]?.id || "");
    setTitle("");
    setDescription("");
    setIsFeatured(false);
    setFeaturedTag("RECOMMENDED");
    setFeaturedShortDesc("");
    setTotalSets(5);
    setIsPaid(false);
    setPrice(0);
    setCurrency("INR");
    setIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: TestSeries) => {
    setEditingSeries(item);
    setCategoryId(item.category_id || "");
    setTitle(item.title);
    setDescription(item.description || "");
    setIsFeatured(item.is_featured);
    setFeaturedTag(item.featured_tag || "");
    setFeaturedShortDesc(item.featured_short_desc || "");
    setTotalSets(item.total_sets_available ?? item.total_sets ?? 0);
    setIsPaid(item.is_paid);
    setPrice(item.price);
    setCurrency(item.currency || "INR");
    setIsActive(item.is_active ?? true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!title.trim()) errors.title = "Series title is required.";
    if (!categoryId) errors.categoryId = "Please select a test category.";
    if (isPaid && Number(price) <= 0)
      errors.price = "Please enter a valid price for paid series.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload: any = {
        category_id: categoryId,
        title: title.trim(),
        description: description.trim() || null,
        is_featured: isFeatured,
        featured_tag:
          isFeatured && featuredTag.trim() ? featuredTag.trim() : null,
        featured_short_desc:
          isFeatured && featuredShortDesc.trim()
            ? featuredShortDesc.trim()
            : null,
        total_sets_available: Number(totalSets),
        total_enrolled: editingSeries ? editingSeries.total_enrolled : 0,
        is_paid: isPaid,
        price: isPaid ? Number(price) : 0,
        currency: currency || "INR",
      };

      if (editingSeries) {
        const updated = await testService.updateSeries(
          editingSeries.id,
          payload,
        );
        setTestSeries((prev) =>
          prev.map((s) =>
            s.id === editingSeries.id ? { ...s, ...updated } : s,
          ),
        );
        success("Test Series Updated", `Saved "${title}"`);
      } else {
        const created = await testService.createSeries(payload);
        setTestSeries((prev) => [created, ...prev]);
        success("Test Series Created", `Created "${title}"`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toastError("Save Failed", err.message || "Could not save series.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await testService.deleteSeries(deleteTarget.id);
      setTestSeries((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      success("Test Series Deleted", `"${deleteTarget.title}" was removed.`);
      setDeleteTarget(null);
    } catch (err: any) {
      toastError(
        "Delete Failed",
        err.message || "Could not delete test series.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async (item: TestSeries) => {
    try {
      const nextStatus = !item.is_active;
      await testService.updateSeries(item.id, { is_active: nextStatus });
      setTestSeries((prev) =>
        prev.map((s) =>
          s.id === item.id ? { ...s, is_active: nextStatus } : s,
        ),
      );
      success(
        nextStatus ? "Series Published" : "Series Unpublished",
        item.title,
      );
    } catch (err: any) {
      toastError("Update Failed", err.message);
    }
  };

  const filteredSeries = testSeries.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCategory =
      categoryFilter === "" ? true : item.category_id === categoryFilter;
    const matchFeatured =
      featuredFilter === ""
        ? true
        : featuredFilter === "featured"
          ? item.is_featured
          : !item.is_featured;
    const matchStatus =
      statusFilter === ""
        ? true
        : statusFilter === "active"
          ? item.is_active
          : !item.is_active;

    return matchSearch && matchCategory && matchFeatured && matchStatus;
  });

  const totalPages = Math.ceil(filteredSeries.length / pageSize);
  const paginatedSeries = filteredSeries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const columns: Column<TestSeries>[] = [
    {
      key: "title",
      header: "Series Info",
      render: (item) => {
        const category = testCategories.find((c) => c.id === item.category_id);
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{item.title}</span>
              {item.is_featured && (
                <Badge variant="primary" size="sm">
                  {item.featured_tag || "FEATURED"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-dark-muted">
              <span>Category: {category?.title || "General"}</span>
              <span>•</span>
              <span className="text-dark-dim truncate max-w-xs">
                {item.description}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "sets_enrolled",
      header: "Sets & Enrolled",
      width: "160px",
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 text-white">
            <FileText className="w-3.5 h-3.5 text-lavender-400" />
            <span className="font-semibold">
              {item.total_sets_available ?? item.total_sets ?? 0} Sets
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-dark-muted">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{item.total_enrolled} Enrolled</span>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Pricing",
      width: "110px",
      render: (item) =>
        item.is_paid ? (
          <Badge variant="warning">
            {formatCurrency(item.price, item.currency)}
          </Badge>
        ) : (
          <Badge variant="success">FREE</Badge>
        ),
    },
    {
      key: "is_active",
      header: "Status",
      width: "130px",
      render: (item) => (
        <button
          onClick={() => handleTogglePublish(item)}
          className="group cursor-pointer text-left"
          title="Click to toggle publish status"
        >
          <Badge variant={item.is_active ? "success" : "neutral"} dot>
            {item.is_active ? "Published" : "Draft"}
          </Badge>
        </button>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      width: "140px",
      render: (item) => (
        <span className="text-xs text-dark-muted">
          {formatDate(item.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "110px",
      align: "right",
      render: (item) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => openEditModal(item)}
            className="p-1.5 text-dark-muted hover:text-lavender-300 hover:bg-lavender-500/10 rounded-lg transition-colors"
            title="Edit Series"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            className="p-1.5 text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete Series"
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
        searchPlaceholder="Search test series by title or description..."
        filters={[
          {
            key: "category",
            label: "Category",
            value: categoryFilter,
            options: testCategories.map((c) => ({
              value: c.id,
              label: c.title,
            })),
            onChange: setCategoryFilter,
          },
          {
            key: "featured",
            label: "Featured",
            value: featuredFilter,
            options: [
              { value: "featured", label: "Featured Only" },
              { value: "not_featured", label: "Standard Only" },
            ],
            onChange: setFeaturedFilter,
          },
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            options: [
              { value: "active", label: "Published" },
              { value: "inactive", label: "Draft" },
            ],
            onChange: setStatusFilter,
          },
        ]}
        hasActiveFilters={Boolean(
          searchQuery || categoryFilter || featuredFilter || statusFilter,
        )}
        onClearFilters={() => {
          setSearchQuery("");
          setCategoryFilter("");
          setFeaturedFilter("");
          setStatusFilter("");
        }}
        actionButton={{
          label: "New Test Series",
          onClick: openCreateModal,
        }}
      />

      <div className="space-y-0">
        <DataTable
          columns={columns}
          data={paginatedSeries}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          emptyTitle="No test series found"
          emptyDescription="Create your first test series in Supabase to bundle practice tests for users."
          emptyActionText="Create Test Series"
          onEmptyAction={openCreateModal}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredSeries.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        title={editingSeries ? "Edit Test Series" : "Create New Test Series"}
        subtitle="Configure series title, pricing, featured badge and syllabus metadata in Supabase"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingSeries ? "Save Changes" : "Create Series"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Test Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={testCategories.map((c) => ({
                value: c.id,
                label: c.title,
              }))}
              error={formErrors.categoryId}
              required
            />

            <Input
              label="Series Title"
              placeholder="e.g. CCC 2026 Ultimate Test Series"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={formErrors.title}
              required
            />
          </div>

          <Textarea
            label="Full Description"
            placeholder="Detailed description of what this series includes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <div className="p-4 rounded-2xl bg-background-elevated/50 border border-dark-border space-y-4">
            <div className="flex items-center justify-between">
              <Switch
                checked={isPaid}
                onChange={setIsPaid}
                label="Paid Series"
                description="Enable if this is a premium paid test package."
              />
            </div>

            {isPaid && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dark-border/60">
                <Input
                  label="Price"
                  type="number"
                  min={0}
                  step={1}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  error={formErrors.price}
                  required
                />
                <Select
                  label="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={[
                    { value: "INR", label: "INR (₹)" },
                    { value: "USD", label: "USD ($)" },
                  ]}
                />
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-background-elevated/50 border border-dark-border space-y-4">
            <Switch
              checked={isFeatured}
              onChange={setIsFeatured}
              label="Feature on Mobile App Home"
              description="Prominently displays this series in the featured carousel."
            />

            {isFeatured && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dark-border/60">
                <Input
                  label="Featured Badge Tag"
                  placeholder="e.g. MOST POPULAR / TOP RATED"
                  value={featuredTag}
                  onChange={(e) => setFeaturedTag(e.target.value)}
                />
                <Input
                  label="Featured Short Description"
                  placeholder="e.g. 1000+ Questions with timer & analysis"
                  value={featuredShortDesc}
                  onChange={(e) => setFeaturedShortDesc(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Expected Total Sets"
              type="number"
              min={1}
              value={totalSets}
              onChange={(e) => setTotalSets(Number(e.target.value))}
            />
            <div className="pt-2">
              <Switch
                checked={isActive}
                onChange={setIsActive}
                label="Published Status"
                description="Only published series appear in the mobile app."
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
        title="Delete Test Series"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? All associated test sets and assignments in Supabase will be deleted.`}
      />
    </div>
  );
};
