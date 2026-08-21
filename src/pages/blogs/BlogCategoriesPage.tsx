import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { BlogCategory } from "../../types/database";
import { blogService } from "../../services/blogService";
import { DataTable, Column } from "../../components/common/DataTable";
import { SearchFilterBar } from "../../components/common/SearchFilterBar";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Input } from "../../components/common/Input";
import { Switch } from "../../components/common/Switch";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";

export const BlogCategoriesPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(
    null,
  );

  // Form State
  const [title, setTitle] = useState("");
  const [hindiTitle, setHindiTitle] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [deleteTarget, setDeleteTarget] = useState<BlogCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await blogService.getCategories();
      setBlogCategories(data);
    } catch (err: any) {
      toastError("Fetch Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setTitle("");
    setHindiTitle("");
    setSortOrder(blogCategories.length + 1);
    setIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (cat: BlogCategory) => {
    setEditingCategory(cat);
    setTitle(cat.title);
    setHindiTitle(cat.hindi_title);
    setSortOrder(cat.sort_order);
    setIsActive(cat.is_active);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!title.trim()) errors.title = "English category title is required.";
    if (!hindiTitle.trim())
      errors.hindiTitle = "Hindi category title is required.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        hindi_title: hindiTitle.trim(),
        sort_order: Number(sortOrder),
        is_active: isActive,
      };

      if (editingCategory) {
        const updated = await blogService.updateCategory(
          editingCategory.id,
          payload,
        );
        setBlogCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id ? { ...c, ...updated } : c,
          ),
        );
        success("Category Updated", `Saved "${title}"`);
      } else {
        const created = await blogService.createCategory(payload);
        setBlogCategories((prev) => [...prev, created]);
        success("Category Created", `Created "${title}"`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toastError("Save Failed", err.message || "Could not save category.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await blogService.deleteCategory(deleteTarget.id);
      setBlogCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      success("Category Deleted", `"${deleteTarget.title}" was removed.`);
      setDeleteTarget(null);
    } catch (err: any) {
      toastError("Delete Failed", err.message || "Could not delete category.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = blogCategories
    .filter((cat) => {
      const query = searchQuery.toLowerCase();
      const matchSearch =
        cat.title.toLowerCase().includes(query) ||
        cat.hindi_title.toLowerCase().includes(query);
      const matchStatus =
        statusFilter === ""
          ? true
          : statusFilter === "active"
            ? cat.is_active
            : !cat.is_active;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => a.sort_order - b.sort_order);

  const columns: Column<BlogCategory>[] = [
    {
      key: "sort_order",
      header: "Order",
      width: "80px",
      align: "center",
      render: (item) => (
        <span className="font-mono text-xs text-lavender-300 font-bold px-2 py-1 bg-lavender-500/10 rounded-lg">
          #{item.sort_order}
        </span>
      ),
    },
    {
      key: "title",
      header: "Bilingual Category Title",
      render: (item) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-white">{item.title}</div>
          <div className="text-xs text-lavender-300 font-medium">
            {item.hindi_title}
          </div>
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      width: "120px",
      render: (item) => (
        <Badge variant={item.is_active ? "success" : "neutral"} dot>
          {item.is_active ? "Active" : "Inactive"}
        </Badge>
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
            title="Edit Category"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            className="p-1.5 text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete Category"
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
        searchPlaceholder="Search blog categories..."
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            options: [
              { value: "active", label: "Active Only" },
              { value: "inactive", label: "Inactive Only" },
            ],
            onChange: setStatusFilter,
          },
        ]}
        hasActiveFilters={Boolean(searchQuery || statusFilter)}
        onClearFilters={() => {
          setSearchQuery("");
          setStatusFilter("");
        }}
        actionButton={{
          label: "New Category",
          onClick: openCreateModal,
        }}
      />

      <DataTable
        columns={columns}
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        emptyTitle="No blog categories found in Supabase"
        emptyDescription="Create categories to organize news, preparation tips, and study articles."
        emptyActionText="Create Category"
        onEmptyAction={openCreateModal}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Blog Category" : "Create Blog Category"}
        subtitle="Organize articles and exam news in Supabase"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Category Title (English)"
            placeholder="e.g. Exam Notifications & Updates"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={formErrors.title}
            required
          />

          <Input
            label="श्रेणी का नाम (Hindi)"
            placeholder="उदा. परीक्षा सूचनाएं और अपडेट"
            value={hindiTitle}
            onChange={(e) => setHindiTitle(e.target.value)}
            error={formErrors.hindiTitle}
            required
          />

          <div className="grid grid-cols-2 gap-4 items-center">
            <Input
              label="Sort Order"
              type="number"
              min={1}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
            <div className="pt-4">
              <Switch
                checked={isActive}
                onChange={setIsActive}
                label="Active"
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
        title="Delete Blog Category"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
      />
    </div>
  );
};
