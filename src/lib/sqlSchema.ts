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
    description TEXT,
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

-- 17. Row Level Security (RLS) Setup
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

-- Storage Buckets Creation (Run once)
INSERT INTO storage.buckets (id, name, public) VALUES ('notes-pdf', 'notes-pdf', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('notes-thumbnails', 'notes-thumbnails', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
`;
