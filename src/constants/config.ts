export const APP_CONFIG = {
  APP_NAME: 'CCC Prep Admin',
  APP_DESCRIPTION: 'Content Management & Administration Panel for CCC Exam Prep',
  VERSION: '1.0.0',
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  STORAGE_BUCKETS: {
    NOTES_PDF: 'notes-pdf',
    NOTES_THUMBNAILS: 'notes-thumbnails',
    BLOG_IMAGES: 'blog-images',
    BOOK_COVERS: 'book-covers',
    AVATARS: 'avatars',
    COURSE_THUMBNAILS: 'course-thumbnails',
    TEST_SERIES_IMAGES: 'test-series-images',
  },
};

export const DIFFICULTY_OPTIONS = [
  { value: 'Easy', label: 'Easy', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { value: 'Medium', label: 'Medium', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { value: 'Hard', label: 'Hard', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
] as const;

export const TEST_TYPE_OPTIONS = [
  { value: 'Mock', label: 'Full Mock Test' },
  { value: 'Topic', label: 'Topic-wise Test' },
  { value: 'Previous Year', label: 'Previous Year Paper' },
  { value: 'Speed Test', label: 'Speed Test' },
  { value: 'Mini Quiz', label: 'Mini Quiz' },
] as const;

export const RETAIL_PLATFORM_OPTIONS = [
  { value: 'Amazon', label: 'Amazon' },
  { value: 'Flipkart', label: 'Flipkart' },
  { value: 'BookBazaar', label: 'BookBazaar' },
  { value: 'Other', label: 'Other Retailer' },
] as const;

export const RETAILER_PLATFORMS = RETAIL_PLATFORM_OPTIONS;

export const ADMIN_ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin', desc: 'Full access to all modules and user administration' },
  { value: 'editor', label: 'Editor', desc: 'Can manage tests, questions, notes, blogs, and books' },
] as const;

export const ADMIN_ROLES = ADMIN_ROLE_OPTIONS;

export const ENROLLMENT_ACCESS_OPTIONS = [
  { value: 'free', label: 'Free Access' },
  { value: 'paid', label: 'Paid Access' },
  { value: 'promotional', label: 'Promotional Pass' },
] as const;

export const ENROLLMENT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
] as const;

export const LESSON_TYPE_OPTIONS = [
  { value: 'text', label: 'Text Lesson' },
  { value: 'video', label: 'Video Lesson' },
  { value: 'mixed', label: 'Mixed (Video + Text)' },
] as const;

export const COURSE_ACCESS_OPTIONS = ENROLLMENT_ACCESS_OPTIONS;
export const COURSE_STATUS_OPTIONS = ENROLLMENT_STATUS_OPTIONS;

export const COURSE_PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
] as const;

export const COURSE_PRICE_CURRENCIES = [
  { value: 'INR', label: 'INR (₹)' },
  { value: 'USD', label: 'USD ($)' },
] as const;

