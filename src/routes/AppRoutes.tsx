import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { ProtectedRoute } from './ProtectedRoute';

// Layout
import { AdminLayout } from '../components/layout/AdminLayout';

// Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { CoursesPage } from '../pages/courses/CoursesPage';
import { CourseBuilderPage } from '../pages/courses/CourseBuilderPage';
import { CourseEnrollmentsPage } from '../pages/courses/CourseEnrollmentsPage';
import { CoursePaymentsPage } from '../pages/courses/CoursePaymentsPage';
import { TestCategoriesPage } from '../pages/tests/TestCategoriesPage';
import { TestSeriesPage } from '../pages/tests/TestSeriesPage';
import { TestSeriesItemsPage } from '../pages/tests/TestSeriesItemsPage';
import { ChaptersPage } from '../pages/chapters/ChaptersPage';
import { QuestionBankPage } from '../pages/questions/QuestionBankPage';
import { NoteCategoriesPage } from '../pages/notes/NoteCategoriesPage';
import { NotesPage } from '../pages/notes/NotesPage';
import { BlogCategoriesPage } from '../pages/blogs/BlogCategoriesPage';
import { BlogsPage } from '../pages/blogs/BlogsPage';
import { BookCategoriesPage } from '../pages/books/BookCategoriesPage';
import { BooksPage } from '../pages/books/BooksPage';
import { EnrollmentsPage } from '../pages/enrollments/EnrollmentsPage';
import { AdminProfilePage } from '../pages/settings/AdminProfilePage';
import { AdminUsersPage } from '../pages/settings/AdminUsersPage';
import { DatabaseSetupPage } from '../pages/settings/DatabaseSetupPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

      {/* Protected Admin Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        {/* Course Management */}
        <Route path={ROUTES.COURSES} element={<CoursesPage />} />
        <Route path={ROUTES.COURSE_BUILDER} element={<CourseBuilderPage />} />
        <Route path={ROUTES.COURSE_ENROLLMENTS} element={<CourseEnrollmentsPage />} />
        <Route path={ROUTES.COURSE_PAYMENTS} element={<CoursePaymentsPage />} />

        {/* Test Management */}
        <Route path={ROUTES.TEST_CATEGORIES} element={<TestCategoriesPage />} />
        <Route path={ROUTES.TEST_SERIES} element={<TestSeriesPage />} />

        <Route path={ROUTES.TEST_SERIES_ITEMS} element={<TestSeriesItemsPage />} />

        {/* Chapters & Questions */}
        <Route path={ROUTES.CHAPTERS} element={<ChaptersPage />} />
        <Route path={ROUTES.QUESTIONS} element={<QuestionBankPage />} />

        {/* Notes */}
        <Route path={ROUTES.NOTE_CATEGORIES} element={<NoteCategoriesPage />} />
        <Route path={ROUTES.NOTES} element={<NotesPage />} />

        {/* Blogs */}
        <Route path={ROUTES.BLOG_CATEGORIES} element={<BlogCategoriesPage />} />
        <Route path={ROUTES.BLOGS} element={<BlogsPage />} />

        {/* Books & Affiliate */}
        <Route path={ROUTES.BOOK_CATEGORIES} element={<BookCategoriesPage />} />
        <Route path={ROUTES.BOOKS} element={<BooksPage />} />

        {/* Enrollments */}
        <Route path={ROUTES.ENROLLMENTS} element={<EnrollmentsPage />} />

        {/* Admin & System Settings */}
        <Route path={ROUTES.PROFILE} element={<AdminProfilePage />} />
        <Route
          path={ROUTES.ADMIN_USERS}
          element={
            <ProtectedRoute requireSuperAdmin>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route path={ROUTES.DATABASE_SETUP} element={<DatabaseSetupPage />} />

        {/* Catch All Inside Layout */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
