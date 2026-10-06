export const ROUTES = {
  // Auth
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',

  // Dashboard
  DASHBOARD: '/',

  // Test Management
  TEST_CATEGORIES: '/tests/categories',
  TEST_SERIES: '/tests/series',
  TEST_SERIES_CREATE: '/tests/series/new',
  TEST_SERIES_EDIT: '/tests/series/edit/:id',
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

  // Courses
  COURSES: '/courses',
  COURSE_BUILDER: '/courses/:id/builder',
  COURSE_ENROLLMENTS: '/courses/enrollments',
  COURSE_PAYMENTS: '/courses/payments',

  // Enrollments
  ENROLLMENTS: '/enrollments',

  // Admin / Settings
  PROFILE: '/settings/profile',
  ADMIN_USERS: '/settings/admins',
  DATABASE_SETUP: '/settings/database',
} as const;

