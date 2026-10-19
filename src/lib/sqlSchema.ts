export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- CCC PREP ADMIN PANEL — COMPLETE POSTGRESQL & SUPABASE SCHEMA SETUP SCRIPT
-- Run this in the Supabase SQL Editor to create all tables, indexes, RLS & Storage
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Admin Users Table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'editor' CHECK (role IN ('super_admin', 'editor')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Test Categories Table
CREATE TABLE IF NOT EXISTS public.test_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Test Series Table
CREATE TABLE IF NOT EXISTS public.test_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.test_categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    featured_image TEXT,
    description TEXT,
    description_md TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    featured_tag VARCHAR(100),
    featured_short_desc TEXT,
    total_sets_available INT NOT NULL DEFAULT 0,
    total_enrolled INT NOT NULL DEFAULT 0,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Test Series Items (Individual Test Sets)
CREATE TABLE IF NOT EXISTS public.test_series_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    series_id UUID REFERENCES public.test_series(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    test_type VARCHAR(100) NOT NULL DEFAULT 'Mock',
    question_count INT NOT NULL DEFAULT 100,
    duration INT NOT NULL DEFAULT 90, -- minutes
    difficulty VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    total_marks NUMERIC(8,2) NOT NULL DEFAULT 100.00,
    negative_marking_enabled BOOLEAN NOT NULL DEFAULT false,
    negative_marks NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    sort_order NUMERIC DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Chapters Table
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    hindi_title VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Questions Table (Bilingual)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
    question_en TEXT NOT NULL,
    question_hi TEXT NOT NULL,
    option_a_en TEXT NOT NULL,
    option_a_hi TEXT NOT NULL,
    option_b_en TEXT NOT NULL,
    option_b_hi TEXT NOT NULL,
    option_c_en TEXT NOT NULL,
    option_c_hi TEXT NOT NULL,
    option_d_en TEXT NOT NULL,
    option_d_hi TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    explanation_en TEXT,
    explanation_hi TEXT,
    difficulty VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    question_type VARCHAR(50) NOT NULL DEFAULT 'MCQ' CHECK (question_type IN ('MCQ', 'True/False')),
    source VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    test_ids UUID[] NOT NULL DEFAULT '{}'::UUID[]
);

-- 8. Test Questions (Assignment with question_order)
CREATE TABLE IF NOT EXISTS public.test_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_series_item_id UUID REFERENCES public.test_series_items(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    question_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(test_series_item_id, question_id)
);

-- 9. Note Categories Table
CREATE TABLE IF NOT EXISTS public.note_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    hindi_title VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.note_categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    hindi_title VARCHAR(255) NOT NULL,
    description TEXT,
    hindi_description TEXT,
    pdf_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    page_count INT NOT NULL DEFAULT 1,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Blog Categories Table
CREATE TABLE IF NOT EXISTS public.blog_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    hindi_title VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Blogs Table
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
    title_en VARCHAR(255) NOT NULL,
    title_hi VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    summary_en TEXT,
    summary_hi TEXT,
    content_en TEXT NOT NULL,
    content_hi TEXT NOT NULL,
    featured_image TEXT,
    author VARCHAR(255) NOT NULL DEFAULT 'Admin',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Book Categories Table
CREATE TABLE IF NOT EXISTS public.book_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    hindi_title VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Books Table
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.book_categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    hindi_title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    description TEXT,
    hindi_description TEXT,
    cover_image TEXT,
    language VARCHAR(50) NOT NULL DEFAULT 'Bilingual (Hindi/English)',
    pages INT NOT NULL DEFAULT 200,
    edition VARCHAR(100),
    publisher VARCHAR(255),
    isbn VARCHAR(100),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Book Retailer Affiliate Links Table
CREATE TABLE IF NOT EXISTS public.book_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('Amazon', 'Flipkart', 'BookBazaar', 'Other')),
    affiliate_url TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Series Enrollments Table
CREATE TABLE IF NOT EXISTS public.series_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    series_id UUID REFERENCES public.test_series(id) ON DELETE CASCADE,
    access_type VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (access_type IN ('free', 'paid', 'promotional')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 17. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    title_hi VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    description_hi TEXT,
    thumbnail TEXT,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. Course Modules Table
CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    title_hi VARCHAR(255) NOT NULL,
    description TEXT,
    description_hi TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 19. Course Lessons Table
CREATE TABLE IF NOT EXISTS public.course_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    title_hi VARCHAR(255) NOT NULL,
    lesson_type VARCHAR(50) NOT NULL DEFAULT 'text' CHECK (lesson_type IN ('text', 'video', 'mixed')),
    content TEXT,
    content_hi TEXT,
    video_url TEXT,
    duration_minutes INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    is_free_preview BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20. Course Module Notes Table
CREATE TABLE IF NOT EXISTS public.course_module_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(module_id, note_id)
);

-- 21. Course Module Tests Table
CREATE TABLE IF NOT EXISTS public.course_module_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES public.test_series_items(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(module_id, test_id)
);

-- 22. Course Module Questions Table
CREATE TABLE IF NOT EXISTS public.course_module_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(module_id, question_id)
);

-- 23. Course Enrollments Table
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    access_type VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (access_type IN ('free', 'paid', 'promotional')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, course_id)
);

-- 24. Course Payments Table
CREATE TABLE IF NOT EXISTS public.course_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    order_id VARCHAR(255),
    payment_id VARCHAR(255),
    signature VARCHAR(255),
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    payment_gateway VARCHAR(50) NOT NULL DEFAULT 'razorpay',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 25. Course Lesson Progress Table
CREATE TABLE IF NOT EXISTS public.course_lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, lesson_id)
);

-- 26. Row Level Security (RLS) Setup
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_series_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_module_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_module_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_module_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Helper function to check if requesting user is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin Full Access Policies
CREATE POLICY "Admins have full access to admin_users" ON public.admin_users FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to test_categories" ON public.test_categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to test_series" ON public.test_series FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to test_series_items" ON public.test_series_items FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to chapters" ON public.chapters FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to questions" ON public.questions FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to test_questions" ON public.test_questions FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to note_categories" ON public.note_categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to notes" ON public.notes FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to blog_categories" ON public.blog_categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to blogs" ON public.blogs FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to book_categories" ON public.book_categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to books" ON public.books FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to book_links" ON public.book_links FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to series_enrollments" ON public.series_enrollments FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to courses" ON public.courses FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to course_modules" ON public.course_modules FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to course_lessons" ON public.course_lessons FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to course_module_notes" ON public.course_module_notes FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to course_module_tests" ON public.course_module_tests FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to course_module_questions" ON public.course_module_questions FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to course_enrollments" ON public.course_enrollments FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to course_payments" ON public.course_payments FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to course_lesson_progress" ON public.course_lesson_progress FOR ALL USING (public.is_admin());

-- Public Read Policies for mobile app clients
CREATE POLICY "Public can view active test_categories" ON public.test_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active test_series" ON public.test_series FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view published test_series_items" ON public.test_series_items FOR SELECT USING (is_published = true);
CREATE POLICY "Public can view active chapters" ON public.chapters FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active questions" ON public.questions FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active notes" ON public.notes FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view published blogs" ON public.blogs FOR SELECT USING (is_published = true);
CREATE POLICY "Public can view active books" ON public.books FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active book_links" ON public.book_links FOR SELECT USING (is_available = true);
CREATE POLICY "Public can view published courses" ON public.courses FOR SELECT USING (is_published = true);
CREATE POLICY "Public can view published course_modules" ON public.course_modules FOR SELECT USING (is_published = true);
CREATE POLICY "Public can view published course_lessons" ON public.course_lessons FOR SELECT USING (is_published = true);
CREATE POLICY "Public can view course_module_notes" ON public.course_module_notes FOR SELECT USING (true);
CREATE POLICY "Public can view course_module_tests" ON public.course_module_tests FOR SELECT USING (true);
CREATE POLICY "Public can view course_module_questions" ON public.course_module_questions FOR SELECT USING (true);

-- Storage Buckets Creation (Run once)
INSERT INTO storage.buckets (id, name, public) VALUES ('notes-pdf', 'notes-pdf', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('notes-thumbnails', 'notes-thumbnails', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('course-thumbnails', 'course-thumbnails', true) ON CONFLICT (id) DO NOTHING;
`;

