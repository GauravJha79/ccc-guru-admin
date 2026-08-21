import React from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, rows = 3, ...props }, ref) => {
    const textareaId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold uppercase tracking-wider text-dark-muted"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            "w-full bg-background-elevated/70 border border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-dark-dim transition-all duration-200 focus:outline-none focus:border-lavender-500 focus:ring-1 focus:ring-lavender-500 focus:bg-background-elevated disabled:opacity-50 resize-y",
            error &&
              "border-rose-500/60 focus:border-rose-500 focus:ring-rose-500",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-dark-dim">{helperText}</p>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
