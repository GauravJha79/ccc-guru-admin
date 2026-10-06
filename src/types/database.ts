export type AdminRole = 'super_admin' | 'editor';

export interface AdminUser {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface TestCategory {
  id: string;
  title: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface TestSeries {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  featured_image?: string | null;
  description?: string | null;
  description_md?: string | null;
  is_featured: boolean;
  featured_tag?: string | null;
  featured_short_desc?: string | null;
  total_sets_available: number;
  total_enrolled: number;
  is_paid: boolean;
  price: number;
  currency: string;
  is_active?: boolean;
  created_at: string;
  last_updated_at?: string;
  // Joins & aliases
  category?: TestCategory;
  total_sets?: number;
}

export type TestItemType = 'Mock' | 'Topic' | 'Previous Year' | 'Speed Test' | 'Mini Quiz';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface TestSeriesItem {
  id: string;
  series_id: string;
  title: string;
  test_type: TestItemType;
  question_count: number;
  duration: number; // minutes
  difficulty: DifficultyLevel;
  total_marks: number;
  negative_marking_enabled: boolean;
  negative_marks: number;
  is_published: boolean;
  sort_order?: number;
  created_at: string;
  // Joins & backward-compatible aliases
  negative_marking?: boolean;
  updated_at?: string;
  series?: TestSeries;
  assigned_questions_count?: number;
}

export interface Chapter {
  id: string;
  title: string;
  hindi_title: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export type CorrectOption = 'A' | 'B' | 'C' | 'D';
export type QuestionType = 'MCQ' | 'True/False';

export interface Question {
  id: string;
  chapter_id?: string | null;
  question_en: string;
  question_hi: string;
  option_a_en: string;
  option_a_hi: string;
  option_b_en: string;
  option_b_hi: string;
  option_c_en: string;
  option_c_hi: string;
  option_d_en: string;
  option_d_hi: string;
  correct_option: CorrectOption;
  explanation_en?: string | null;
  explanation_hi?: string | null;
  difficulty: DifficultyLevel;
  question_type: QuestionType;
  source?: string | null;
  is_active: boolean;
  created_at: string;
  test_ids: string[];
  // Joins & computed
  chapter?: Chapter;
  assigned_tests_count?: number;
}

export interface TestQuestion {
  id: string;
  test_series_item_id: string;
  question_id: string;
  question_order: number;
  created_at: string;
  // Joins
  question?: Question;
  test_item?: TestSeriesItem;
}

export interface NoteCategory {
  id: string;
  title: string;
  hindi_title: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Note {
  id: string;
  category_id: string;
  title: string;
  hindi_title: string;
  description?: string;
  hindi_description?: string;
  pdf_url: string;
  thumbnail_url?: string;
  file_name: string;
  file_size: number; // bytes or KB
  page_count: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  // Joins
  category?: NoteCategory;
}

export interface BlogCategory {
  id: string;
  title: string;
  hindi_title: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Blog {
  id: string;
  category_id: string;
  title_en: string;
  title_hi: string;
  slug: string;
  summary_en: string;
  summary_hi: string;
  content_en: string;
  content_hi: string;
  featured_image?: string;
  author: string;
  is_featured: boolean;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  // Joins
  category?: BlogCategory;
}

export interface BookCategory {
  id: string;
  title: string;
  hindi_title: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Book {
  id: string;
  category_id: string;
  title: string;
  hindi_title: string;
  author: string;
  description?: string;
  hindi_description?: string;
  cover_image?: string;
  language: string;
  pages: number;
  edition?: string;
  publisher?: string;
  isbn?: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  // Joins
  category?: BookCategory;
  links_count?: number;
}

export type RetailerPlatform = 'Amazon' | 'Flipkart' | 'BookBazaar' | 'Other';
export type RetailPlatform = RetailerPlatform;

export interface BookLink {
  id: string;
  book_id: string;
  platform: RetailerPlatform;
  affiliate_url: string;
  price: number;
  currency: string;
  is_available: boolean;
  created_at: string;
}

export type AccessType = 'free' | 'paid' | 'promotional';
export type EnrollmentAccessType = AccessType;
export type EnrollmentStatus = 'active' | 'expired' | 'revoked';

export interface SeriesEnrollment {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  series_id: string;
  access_type: AccessType;
  status: EnrollmentStatus;
  enrolled_at: string;
  expires_at?: string;
  // Joins
  series?: TestSeries;
}

// Course Management Types
export type LessonType = 'text' | 'video' | 'mixed';
export type CourseAccessType = 'free' | 'paid' | 'promotional';
export type CourseEnrollmentStatus = 'active' | 'expired' | 'revoked';
export type CoursePaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface Course {
  id: string;
  title: string;
  title_hi: string;
  slug: string;
  description?: string | null;
  description_hi?: string | null;
  thumbnail?: string | null;
  is_paid: boolean;
  price: number;
  currency: string;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joins & computed
  modules_count?: number;
  lessons_count?: number;
  enrollments_count?: number;
  modules?: CourseModule[];
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  title_hi: string;
  description?: string | null;
  description_hi?: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // Joins & counts
  lessons_count?: number;
  notes_count?: number;
  tests_count?: number;
  questions_count?: number;
  lessons?: CourseLesson[];
  notes?: CourseModuleNote[];
  tests?: CourseModuleTest[];
  questions?: CourseModuleQuestion[];
}

export interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  title_hi: string;
  lesson_type: LessonType;
  content?: string | null;
  content_hi?: string | null;
  video_url?: string | null;
  duration_minutes: number;
  sort_order: number;
  is_free_preview: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseModuleNote {
  id: string;
  module_id: string;
  note_id: string;
  sort_order: number;
  created_at: string;
  // Joins
  note?: Note;
}

export interface CourseModuleTest {
  id: string;
  module_id: string;
  test_id: string;
  sort_order: number;
  created_at: string;
  // Joins
  test_item?: TestSeriesItem;
}

export interface CourseModuleQuestion {
  id: string;
  module_id: string;
  question_id: string;
  sort_order: number;
  created_at: string;
  // Joins
  question?: Question;
}

export interface CourseEnrollment {
  id: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  course_id: string;
  access_type: CourseAccessType;
  status: CourseEnrollmentStatus;
  enrolled_at: string;
  expires_at?: string | null;
  created_at: string;
  // Joins
  course?: Course;
  progress_percentage?: number;
  completed_lessons_count?: number;
  total_lessons_count?: number;
}

export interface CoursePayment {
  id: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  course_id: string;
  order_id?: string | null;
  payment_id?: string | null;
  signature?: string | null;
  amount: number;
  currency: string;
  payment_gateway: string;
  status: CoursePaymentStatus;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  course?: Course;
}

export interface CourseLessonProgress {
  id: string;
  user_id: string;
  course_id: string;
  module_id: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

