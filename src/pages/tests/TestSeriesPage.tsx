import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, Users, FileText, Sparkles, ExternalLink, BookOpen } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { TestSeries, TestCategory } from "../../types/database";
import { testService } from "../../services/testService";
import { DataTable, Column } from "../../components/common/DataTable";
import { SearchFilterBar } from "../../components/common/SearchFilterBar";
import { Pagination } from "../../components/common/Pagination";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Badge } from "../../components/common/Badge";
import { formatDate, formatCurrency } from "../../lib/utils";
import { APP_CONFIG } from "../../constants/config";
import { ROUTES } from "../../constants/routes";

export const TestSeriesPage: React.FC = () => {
  const navigate = useNavigate();
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
      (item.slug &&
        item.slug.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
          <div className="flex items-center gap-3">
            {item.featured_image ? (
              <img
                src={item.featured_image}
                alt={item.title}
                className="w-11 h-11 object-cover rounded-xl border border-lavender-500/30 shrink-0 bg-background-elevated"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-lavender-500/10 border border-lavender-500/20 flex items-center justify-center text-lavender-400 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
            )}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  onClick={() => navigate(`/tests/series/edit/${item.id}`)}
                  className="font-bold text-white text-sm hover:text-lavender-300 cursor-pointer transition-colors truncate"
                >
                  {item.title}
                </span>
                {item.is_featured && (
                  <Badge variant="primary" size="sm">
                    {item.featured_tag || "FEATURED"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-dark-muted flex-wrap">
                {item.slug && (
                  <span className="font-mono text-[11px] text-lavender-400 bg-lavender-500/10 px-1.5 py-0.5 rounded border border-lavender-500/20">
                    /{item.slug}
                  </span>
                )}
                {item.description_md && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    SEO Content
                  </span>
                )}
                <span>•</span>
                <span>Category: {category?.title || "General"}</span>
                {item.description && (
                  <>
                    <span>•</span>
                    <span className="text-dark-dim truncate max-w-xs">
                      {item.description}
                    </span>
                  </>
                )}
              </div>
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
      width: "120px",
      align: "right",
      render: (item) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => navigate(`/tests/series/edit/${item.id}`)}
            className="p-1.5 text-dark-muted hover:text-lavender-300 hover:bg-lavender-500/10 rounded-lg transition-colors"
            title="Edit Series (Full Page Studio)"
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
        searchPlaceholder="Search test series by title, slug, or description..."
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
          onClick: () => navigate(ROUTES.TEST_SERIES_CREATE),
        }}
      />

      <div className="space-y-0">
        <DataTable
          columns={columns}
          data={paginatedSeries}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          emptyTitle="No test series found"
          emptyDescription="Create your first test series with full SEO markdown syllabus and automated AI generator."
          emptyActionText="Create Test Series"
          onEmptyAction={() => navigate(ROUTES.TEST_SERIES_CREATE)}
          onRowClick={(item) => navigate(`/tests/series/edit/${item.id}`)}
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

