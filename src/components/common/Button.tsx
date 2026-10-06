import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none whitespace-nowrap shrink-0 leading-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-lavender-600 via-lavender-500 to-indigo-600 hover:from-lavender-500 hover:to-indigo-500 text-white shadow-glow-sm hover:shadow-glow focus:ring-lavender-400 border border-lavender-400/30',
    secondary:
      'bg-background-elevated hover:bg-background-hover text-white border border-dark-border hover:border-lavender-500/40 focus:ring-lavender-500',
    outline:
      'bg-transparent hover:bg-lavender-500/10 text-lavender-300 border border-lavender-500/40 hover:border-lavender-400 focus:ring-lavender-500',
    danger:
      'bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 hover:border-rose-500 shadow-[0_0_15px_-3px_rgba(244,63,94,0.2)] focus:ring-rose-500',
    ghost:
      'bg-transparent hover:bg-white/5 text-dark-muted hover:text-white focus:ring-white/20',
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        leftIcon && <span className="inline-flex items-center shrink-0">{leftIcon}</span>
      )}
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex items-center shrink-0">{rightIcon}</span>}
    </button>
  );
};
