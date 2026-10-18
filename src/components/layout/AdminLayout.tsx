import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileDrawer } from "./MobileDrawer";
import { ROUTES } from "../../constants/routes";

export const AdminLayout: React.FC = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();

  // Determine current page title from route
  const getPageInfo = () => {
    switch (location.pathname) {
      case ROUTES.DASHBOARD:
        return {
          title: "Dashboard Overview",
          subtitle: "Real-time metrics, content distribution & activity",
        };
      case ROUTES.TEST_CATEGORIES:
        return {
          title: "Test Categories",
          subtitle: "Manage test structure & sorting orders",
        };
      case ROUTES.TEST_SERIES:
        return {
          title: "Test Series",
          subtitle: "Manage featured series, free/paid courses & metadata",
        };
      case ROUTES.TEST_SERIES_ITEMS:
        return {
          title: "Test Series Items (Sets)",
          subtitle: "Manage individual mock test sets & parameters",
        };
      case ROUTES.CHAPTERS:
        return {
          title: "Chapter Management",
          subtitle: "Bilingual syllabus modules & question categories",
        };
      case ROUTES.QUESTIONS:
        return {
          title: "Question Bank",
          subtitle: "Bilingual questions, explanations & set assignments",
        };
      case ROUTES.NOTE_CATEGORIES:
        return {
          title: "PDF Note Categories",
          subtitle: "Organize study materials & cheat sheets",
        };
      case ROUTES.NOTES:
        return {
          title: "PDF Notes Management",
          subtitle: "Upload PDFs & thumbnails to Supabase Storage",
        };
      case ROUTES.BLOG_CATEGORIES:
        return {
          title: "Blog Categories",
          subtitle: "Categorize study strategies & updates",
        };
      case ROUTES.BLOGS:
        return {
          title: "Blogs & Articles",
          subtitle: "Rich text editor, slugs & bilingual publishing",
        };
      case ROUTES.BOOK_CATEGORIES:
        return {
          title: "Book Categories",
          subtitle: "Categorize recommended reading & workbooks",
        };
      case ROUTES.BOOKS:
        return {
          title: "Books & Affiliate Retailers",
          subtitle: "Amazon & Flipkart affiliate link management",
        };
      case ROUTES.ENROLLMENTS:
        return {
          title: "Series Enrollments",
          subtitle: "Monitor student access & enrolled test series",
        };
      case ROUTES.ADMIN_USERS:
        return {
          title: "Admin Team Management",
          subtitle: "Manage authorized Super Admins & Editors",
        };
      case ROUTES.DATABASE_SETUP:
        return {
          title: "Database Schema & Setup",
          subtitle: "PostgreSQL migration script & connectivity test",
        };
      case ROUTES.PROFILE:
        return {
          title: "Admin Profile Settings",
          subtitle: "Update account details & security",
        };
      default:
        return { title: "CCC Prep Admin", subtitle: "Management Console" };
    }
  };

  const isEditorRoute =
    location.pathname === ROUTES.BLOG_CREATE ||
    location.pathname.startsWith('/blogs/create') ||
    location.pathname.startsWith('/blogs/edit');

  const pageInfo = isEditorRoute
    ? {
        title: "Article Studio",
        subtitle: "Multilingual CMS Editor • Hygraph GraphQL",
      }
    : getPageInfo();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-background">
      {/* Desktop Fixed Sidebar */}
      <div className="hidden md:block h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          onOpenMobile={() => setMobileDrawerOpen(true)}
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
        />

        <main
          className={
            isEditorRoute
              ? "flex-1 overflow-hidden p-0 m-0 min-h-0 flex flex-col"
              : "flex-1 overflow-y-auto p-4 md:p-8 space-y-6"
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
