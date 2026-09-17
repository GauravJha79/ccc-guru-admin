import React from "react";
import { Menu, ShieldCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { ThemeToggle } from "../common/ThemeToggle";

export interface HeaderProps {
  onOpenMobile: () => void;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobile,
  title,
  subtitle,
}) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-background-card/90 backdrop-blur-md border-b border-dark-border px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="md:hidden p-2 rounded-xl text-dark-muted hover:text-dark-text hover:bg-background-hover"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <div>
            <h2 className="text-base font-extrabold text-dark-text tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-dark-muted hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right: Role indicator, Theme Toggle & User profile */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background-elevated border border-dark-border text-xs">
          <ShieldCheck className="w-4 h-4 text-lavender-500" />
          <span className="text-dark-muted">Role:</span>
          <span className="font-semibold text-dark-text capitalize">
            {user?.role?.replace("_", " ") || "Super Admin"}
          </span>
        </div>

        {/* User Avatar Circle */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-dark-border">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-lavender-600 to-purple-500 text-white font-bold flex items-center justify-center text-xs shadow-glow-sm">
            {user?.name ? user.name[0].toUpperCase() : "A"}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-dark-text leading-tight">
              {user?.name || "Admin"}
            </p>
            <p className="text-[10px] text-dark-muted">
              {user?.email || "admin@cccprep.com"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
