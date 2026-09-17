import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SelectOption {
  value: string | number;
  label: string;
  [key: string]: any;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options:
    | readonly SelectOption[]
    | SelectOption[]
    | readonly {
        readonly value: string | number;
        readonly label: string;
        [key: string]: any;
      }[];
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className, id, ...props }, ref) => {
    const selectId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-dark-muted"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none bg-background-elevated/70 border border-dark-border rounded-xl px-3.5 py-2.5 pr-10 text-sm text-dark-text transition-all duration-200 focus:outline-none focus:border-lavender-500 focus:ring-1 focus:ring-lavender-500 focus:bg-background-elevated disabled:opacity-50 cursor-pointer",
              error &&
                "border-rose-500/60 focus:border-rose-500 focus:ring-rose-500",
              className,
            )}
            {...props}
          >
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-background-elevated text-dark-text py-1.5"
              >
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-dark-muted">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-dark-dim">{helperText}</p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";
