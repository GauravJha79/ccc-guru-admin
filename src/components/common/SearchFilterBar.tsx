import React from "react";
import { Search, X, Plus } from "lucide-react";
import { Button } from "./Button";

export interface FilterOption {
  key: string;
  label: string;
  options:
    | readonly {
        readonly value: string | number;
        readonly label: string;
        [key: string]: any;
      }[]
    | { value: string | number; label: string; [key: string]: any }[];
  value: string;
  onChange: (value: string) => void;
}

export interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  extraActions?: React.ReactNode;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search records...",
  filters = [],
  onClearFilters,
  hasActiveFilters = false,
  actionButton,
  extraActions,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 bg-background-card border border-dark-border rounded-2xl">
      {/* Search & Filter select inputs */}
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-dim pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-background-elevated/70 border border-dark-border rounded-xl pl-9.5 pr-8 py-2 text-xs md:text-sm text-dark-text placeholder:text-dark-dim focus:outline-none focus:border-lavender-500 focus:ring-1 focus:ring-lavender-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-dim hover:text-dark-text p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        {filters.map((filter) => (
          <div key={filter.key} className="min-w-[140px]">
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="w-full bg-background-elevated/70 border border-dark-border rounded-xl px-3 py-2 text-xs md:text-sm text-dark-text focus:outline-none focus:border-lavender-500 transition-colors cursor-pointer"
            >
              <option value="" className="bg-background-card text-dark-muted">
                All {filter.label}
              </option>
              {filter.options.map((opt) => (
                <option
                  key={String(opt.value)}
                  value={String(opt.value)}
                  className="bg-background-card text-dark-text"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Reset Filter Button */}
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 self-end md:self-auto">
        {extraActions}
        {actionButton && (
          <Button
            onClick={actionButton.onClick}
            leftIcon={actionButton.icon || <Plus className="w-4 h-4" />}
            size="md"
          >
            {actionButton.label}
          </Button>
        )}
      </div>
    </div>
  );
};
