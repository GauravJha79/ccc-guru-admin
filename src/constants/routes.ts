export const ROUTES = {
  // Auth
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',

  // Dashboard
  DASHBOARD: '/',

  // Test Management
  TEST_CATEGORIES: '/tests/categories',
  TEST_SERIES: '/tests/series',
  TEST_SERIES_ITEMS: '/tests/items',
  TEST_ITEM_QUESTIONS: '/tests/items/:itemId/questions',

  // Chapters
  CHAPTERS: '/chapters',

  // Question Bank
  QUESTIONS: '/questions',

  // Notes
  NOTE_CATEGORIES: '/notes/categories',
  NOTES: '/notes',

  // Blogs
  BLOG_CATEGORIES: '/blogs/categories',
  BLOGS: '/blogs',
  BLOG_CREATE: '/blogs/new',
  BLOG_EDIT: '/blogs/edit/:id',

  // Books & Affiliates
  BOOK_CATEGORIES: '/books/categories',
  BOOKS: '/books',

  // Enrollments
  ENROLLMENTS: '/enrollments',

  // Admin / Settings
  PROFILE: '/settings/profile',
  ADMIN_USERS: '/settings/admins',
  DATABASE_SETUP: '/settings/database',
} as const;
