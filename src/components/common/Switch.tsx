import React from 'react';
import { cn } from '../../lib/utils';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
}) => {
  return (
    <label className={cn('flex items-start gap-3 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed')}>
      <div className="relative inline-flex items-center mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={cn(
            'bg-background-hover peer-focus:outline-none rounded-full transition-colors duration-200 border border-dark-border peer-checked:bg-lavender-600 peer-checked:border-lavender-500 peer-checked:shadow-glow-sm',
            size === 'sm' ? 'w-8 h-4.5' : 'w-11 h-6'
          )}
        >
          <div
            className={cn(
              'absolute bg-white rounded-full transition-transform duration-200 shadow-sm top-[2px] left-[2px]',
              size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5',
              checked && (size === 'sm' ? 'translate-x-3.5' : 'translate-x-5')
            )}
          />
        </div>
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-white">{label}</span>}
          {description && <span className="text-xs text-dark-muted">{description}</span>}
        </div>
      )}
    </label>
  );
};
