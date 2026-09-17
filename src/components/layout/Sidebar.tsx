import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderTree,
  Layers,
  FileQuestion,
  BookOpen,
  FileText,
  Newspaper,
  BookMarked,
  Users,
  Settings,
  Shield,
  Database,
  LogOut,
  Sparkles,
  ChevronRight,
  GraduationCap,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../contexts/AuthContext";
import { Badge } from "../common/Badge";
import { ThemeToggle } from "../common/ThemeToggle";
import { cn } from "../../lib/utils";

export interface NavSection {
  title: string;
  items: {
    label: string;
    path: string;
    icon: React.ReactNode;
    badge?: string;
    superAdminOnly?: boolean;
  }[];
}

export const Sidebar: React.FC<{ onCloseMobile?: () => void }> = ({
  onCloseMobile,
}) => {
  const { user, logout, isSuperAdmin } = useAuth();
  const location = useLocation();

  const navSections: NavSection[] = [
    {
      title: "Overview",
      items: [
        {
          label: "Dashboard",
          path: ROUTES.DASHBOARD,
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "Course Management",
      items: [
        {
          label: "All Courses",
          path: ROUTES.COURSES,
          icon: <GraduationCap className="w-4 h-4" />,
        },
        {
          label: "Course Enrollments",
          path: ROUTES.COURSE_ENROLLMENTS,
          icon: <Users className="w-4 h-4" />,
        },
        {
          label: "Course Payments",
          path: ROUTES.COURSE_PAYMENTS,
          icon: <CreditCard className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "Test Management",

      items: [
        {
          label: "Test Categories",
          path: ROUTES.TEST_CATEGORIES,
          icon: <FolderTree className="w-4 h-4" />,
        },
        {
          label: "Test Series",
          path: ROUTES.TEST_SERIES,
          icon: <Layers className="w-4 h-4" />,
        },
        {
          label: "Test Series Items",
          path: ROUTES.TEST_SERIES_ITEMS,
          icon: <FileText className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "Question Bank",
      items: [
        {
          label: "Chapters",
          path: ROUTES.CHAPTERS,
          icon: <BookOpen className="w-4 h-4" />,
        },
        {
          label: "Questions & Sets",
          path: ROUTES.QUESTIONS,
          icon: <FileQuestion className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "Content Library",
      items: [
        {
          label: "PDF Notes Categories",
          path: ROUTES.NOTE_CATEGORIES,
          icon: <FolderTree className="w-4 h-4" />,
        },
        {
          label: "PDF Notes",
          path: ROUTES.NOTES,
          icon: <FileText className="w-4 h-4" />,
        },
        {
          label: "Blog Categories",
          path: ROUTES.BLOG_CATEGORIES,
          icon: <FolderTree className="w-4 h-4" />,
        },
        {
          label: "Blogs & Articles",
          path: ROUTES.BLOGS,
          icon: <Newspaper className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "Books & Affiliate",
      items: [
        {
          label: "Book Categories",
          path: ROUTES.BOOK_CATEGORIES,
          icon: <FolderTree className="w-4 h-4" />,
        },
        {
          label: "Books & Links",
          path: ROUTES.BOOKS,
          icon: <BookMarked className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "Users & System",
      items: [
        {
          label: "Enrollments",
          path: ROUTES.ENROLLMENTS,
          icon: <Users className="w-4 h-4" />,
        },
        {
          label: "Admin Team",
          path: ROUTES.ADMIN_USERS,
          icon: <Shield className="w-4 h-4" />,
          superAdminOnly: true,
        },
        {
          label: "Database Schema & Setup",
          path: ROUTES.DATABASE_SETUP,
          icon: <Database className="w-4 h-4" />,
        },
        {
          label: "My Profile",
          path: ROUTES.PROFILE,
          icon: <Settings className="w-4 h-4" />,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 h-full bg-background-card/95 border-r border-dark-border flex flex-col justify-between select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-dark-border/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-lavender-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-sm border border-lavender-400/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                CCC Prep{" "}
                <span className="text-[10px] text-lavender-300 font-bold px-1.5 py-0.5 bg-lavender-500/20 rounded-md">
                  ADMIN
                </span>
              </h1>
              <p className="text-[11px] text-dark-muted font-medium">
                Management Console
              </p>
            </div>
          </div>
        </div>

        {/* Database Status Pill */}
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-background-elevated/80 border border-dark-border text-xs">
            <span className="text-dark-muted text-[11px]">Backend:</span>
            <Badge variant="success" size="sm" dot>
              Supabase Live
            </Badge>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-230px)]">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-dark-dim">
                {section.title}
              </p>
              {section.items.map((item) => {
                if (item.superAdminOnly && !isSuperAdmin) return null;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                      isActive
                        ? "bg-gradient-to-r from-lavender-600/30 to-lavender-500/10 text-white font-semibold border border-lavender-500/40 shadow-glow-sm"
                        : "text-dark-muted hover:text-white hover:bg-white/5",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          isActive
                            ? "bg-lavender-500 text-white shadow-sm"
                            : "text-dark-muted group-hover:text-lavender-400 group-hover:bg-white/5",
                        )}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-lavender-400" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-dark-border/80 bg-background-subtle/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-lavender-600/30 text-lavender-400 font-bold border border-lavender-500/40 flex items-center justify-center text-sm shadow-sm flex-shrink-0">
              {user?.name ? user.name[0].toUpperCase() : "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-dark-text truncate">
                {user?.name || "Admin User"}
              </p>
              <p className="text-[10px] text-lavender-500 capitalize truncate font-medium">
                {user?.role?.replace("_", " ") || "Super Admin"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle className="p-1.5" />
            <button
              onClick={logout}
              className="p-2 text-dark-dim hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
