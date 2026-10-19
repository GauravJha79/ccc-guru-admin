import React from "react";
import { ChevronUp, ChevronDown, ArrowUpDown, GripVertical } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { TableSkeleton } from "./LoadingSkeleton";
import { cn } from "../../lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionText?: string;
  onEmptyAction?: () => void;
  selectedIds?: string[];
  onSelectRow?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRowClick?: (item: T) => void;
  isReorderable?: boolean;
  onReorder?: (reorderedData: T[]) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search query or filters to find what you are looking for.",
  emptyActionText,
  onEmptyAction,
  selectedIds,
  onSelectRow,
  onSelectAll,
  sortKey,
  sortDirection,
  onSort,
  onRowClick,
  isReorderable = false,
  onReorder,
}: DataTableProps<T>) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...data];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setDraggedIndex(null);
    setDragOverIndex(null);

    if (onReorder) {
      onReorder(reordered);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (isLoading) {
    return (
      <div className="bg-background-card border border-dark-border rounded-2xl overflow-hidden">
        <TableSkeleton rows={6} cols={columns.length + (selectedIds ? 1 : 0) + (isReorderable ? 1 : 0)} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-background-card border border-dark-border rounded-2xl p-6">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionText={emptyActionText}
          onAction={onEmptyAction}
        />
      </div>
    );
  }

  const allSelected =
    selectedIds &&
    data.length > 0 &&
    data.every((item) => selectedIds.includes(keyExtractor(item)));
  const someSelected = selectedIds && selectedIds.length > 0 && !allSelected;

  return (
    <div className="bg-background-card border border-dark-border rounded-2xl overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-dark-border bg-background-subtle/70">
              {/* Drag Handle Column */}
              {isReorderable && (
                <th className="w-10 px-2 py-3.5 text-center text-xs font-bold text-dark-muted" title="Drag to reorder">
                  <span className="sr-only">Reorder</span>
                </th>
              )}

              {/* Select All Checkbox */}
              {selectedIds && onSelectAll && (
                <th className="w-12 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = Boolean(someSelected);
                    }}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-dark-border bg-background-elevated text-lavender-600 focus:ring-lavender-500 focus:ring-offset-0 cursor-pointer"
                  />
                </th>
              )}

              {columns.map((column) => {
                const isSorted = sortKey === column.key;
                return (
                  <th
                    key={column.key}
                    style={{ width: column.width }}
                    className={cn(
                      "px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-dark-muted select-none",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      column.sortable &&
                        "cursor-pointer hover:text-white transition-colors",
                      column.className,
                    )}
                    onClick={() =>
                      column.sortable && onSort && onSort(column.key)
                    }
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1.5",
                        column.align === "center" && "justify-center",
                        column.align === "right" && "justify-end",
                      )}
                    >
                      <span>{column.header}</span>
                      {column.sortable && (
                        <span className="text-dark-dim">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="w-3.5 h-3.5 text-lavender-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-lavender-400" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/60">
            {data.map((item, index) => {
              const id = keyExtractor(item);
              const isSelected = selectedIds?.includes(id);
              const isBeingDragged = draggedIndex === index;
              const isDragTarget = dragOverIndex === index && draggedIndex !== index;

              return (
                <tr
                  key={id}
                  draggable={Boolean(isReorderable)}
                  onDragStart={(e) => isReorderable && handleDragStart(e, index)}
                  onDragOver={(e) => isReorderable && handleDragOver(e, index)}
                  onDrop={(e) => isReorderable && handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={cn(
                    "group transition-all duration-150",
                    isSelected
                      ? "bg-lavender-500/10"
                      : "hover:bg-background-hover/50",
                    isBeingDragged && "opacity-30 bg-lavender-500/20",
                    isDragTarget && "border-t-2 border-lavender-400 bg-lavender-500/10 shadow-glow-sm",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {/* Drag Handle */}
                  {isReorderable && (
                    <td
                      className="w-10 px-2 py-3.5 text-center cursor-grab active:cursor-grabbing text-dark-dim group-hover:text-lavender-400 hover:text-lavender-300 transition-colors select-none"
                      onClick={(e) => e.stopPropagation()}
                      title="Drag to reorder"
                    >
                      <div className="flex items-center justify-center p-1 rounded hover:bg-white/5">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    </td>
                  )}

                  {/* Row Checkbox */}
                  {selectedIds && onSelectRow && (
                    <td
                      className="w-12 px-4 py-3.5 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelectRow(id, e.target.checked)}
                        className="w-4 h-4 rounded border-dark-border bg-background-elevated text-lavender-600 focus:ring-lavender-500 focus:ring-offset-0 cursor-pointer"
                      />
                    </td>
                  )}

                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3.5 text-sm text-white/90",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right",
                        column.className,
                      )}
                    >
                      {column.render
                        ? column.render(item, index)
                        : (item as any)[column.key] !== undefined
                          ? String((item as any)[column.key])
                          : "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
