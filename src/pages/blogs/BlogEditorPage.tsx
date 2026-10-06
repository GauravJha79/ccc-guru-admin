import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Sparkles,
  BookOpen,
  Globe,
  FileText,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  X,
  Eye,
  CheckCircle2,
  Calendar,
  User as UserIcon,
  Layers,
  HelpCircle,
  Code2,
  ListOrdered,
  Quote,
  Table as TableIcon,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Blog, BlogCategory } from '../../types/database';
import { blogService } from '../../services/blogService';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Select } from '../../components/common/Select';
import { Switch } from '../../components/common/Switch';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { FileUpload } from '../../components/common/FileUpload';
import { MDXEditorComponent } from '../../components/common/MDXEditorComponent';
import { Modal } from '../../components/common/Modal';
import { APP_CONFIG } from '../../constants/config';
import { generateSlug, formatDate } from '../../lib/utils';
import { ROUTES } from '../../constants/routes';
import { AiBlogGenerateModal } from './AiBlogGenerateModal';
import { geminiBlogService, BANNER_THEMES, GeneratedBlogResult } from '../../services/geminiBlogService';

export const BlogEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [allBlogs, setAllBlogs] = useState<Blog[]>([]);

  // Form State
  const [categoryId, setCategoryId] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [slug, setSlug] = useState('');
  const [summaryEn, setSummaryEn] = useState('');
  const [summaryHi, setSummaryHi] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentHi, setContentHi] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [author, setAuthor] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [publishedAt, setPublishedAt] = useState<string | undefined>(undefined);

  // Active editor tab in content card
  const [activeContentTab, setActiveContentTab] = useState<'en' | 'hi'>('en');

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [catsData, blogsData] = await Promise.all([
          blogService.getCategories(),
          blogService.getBlogs(),
        ]);
        setBlogCategories(catsData);
        setAllBlogs(blogsData);

        if (isEditing && id) {
          const item =
            blogsData.find((b) => b.id === id) || (await blogService.getBlogById(id));
          if (item) {
            setCategoryId(item.category_id || '');
            setTitleEn(item.title_en);
            setTitleHi(item.title_hi);
            setSlug(item.slug);
            setSummaryEn(item.summary_en || '');
            setSummaryHi(item.summary_hi || '');
            setContentEn(item.content_en || '');
            setContentHi(item.content_hi || '');
            setFeaturedImage(item.featured_image || '');
            setAuthor(item.author || user?.name || 'CCC Prep Team');
            setIsFeatured(item.is_featured);
            setIsPublished(item.is_published);
            setPublishedAt(item.published_at);
          } else {
            toastError('Not Found', 'Article could not be found.');
            navigate(ROUTES.BLOGS);
          }
        } else {
          // Defaults for new article
          if (catsData.length > 0) {
            setCategoryId(catsData[0].id);
          }
          setAuthor(user?.name || 'CCC Prep Team');
          setContentEn(
            '# Pass NIELIT CCC 2026: Complete Strategy & Important Topics\n\n' +
              'The NIELIT CCC (Course on Computer Concepts) examination evaluates candidate proficiency across 8 core modules.\n\n' +
              '## 🎯 Key Focus Topics\n' +
              '- **LibreOffice Suite:** Writer, Calc, and Impress (30%+ weightage)\n' +
              '- **Digital Financial Tools:** UPI, AEPS, USSD, and QR Codes\n' +
              '- **Operating Systems & Linux:** CLI commands and GUI concepts\n\n' +
              '## 📝 Practice Multiple Choice Questions\n\n' +
              '| Q.No | Question | Correct Option |\n' +
              '| :--- | :--- | :--- |\n' +
              '| 1 | Default extension of LibreOffice Writer | **.odt** |\n' +
              '| 2 | Maximum zoom percentage in Calc | **400%** |\n' +
              '| 3 | UPI is developed by which organization? | **NPCI** |\n\n' +
              '> **💡 Pro Tip:** There is NO negative marking in the CCC exam. Attempt all 100 questions!'
          );
          setContentHi(
            '# NIELIT CCC परीक्षा 2026: सम्पूर्ण तैयारी रणनीति एवं महत्वपूर्ण प्रश्न\n\n' +
              'NIELIT CCC (कंप्यूटर अवधारणाओं पर पाठ्यक्रम) परीक्षा में सफलता प्राप्त करने के लिए यह एक सम्पूर्ण मार्गदर्शिका है।\n\n' +
              '## 🎯 मुख्य महत्वपूर्ण विषय\n' +
              '- **लिबरेऑफिस पैकेज:** राइटर, कैल्क और इम्प्रेस\n' +
              '- **डिजिटल वित्तीय उपकरण:** UPI, AEPS, नेट बैंकिंग\n' +
              '- **इंटरनेट एवं साइबर सुरक्षा:** फ़िशिंग, मैलवेयर, IoT और क्लाउड\n\n' +
              '## 💡 परीक्षा टिप्स\n' +
              '> **याद रखें:** परीक्षा में कोई नकारात्मक अंकन (Negative Marking) नहीं होता है, इसलिए सभी 100 प्रश्न अवश्य हल करें।'
          );
        }
      } catch (err: any) {
        toastError('Fetch Error', err.message || 'Could not load article data.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditing, navigate, user?.name]);

  const handleTitleEnChange = (val: string) => {
    setTitleEn(val);
    if (!isEditing) {
      setSlug(generateSlug(val));
    }
  };

  const handleInsertTemplate = (type: 'full_guide' | 'mcq_table' | 'pro_tip') => {
    if (type === 'full_guide') {
      const template =
        `\n\n## 📚 Comprehensive Module Breakdown\n\n` +
        `Pass the NIELIT CCC exam with structured study:\n\n` +
        `| Module Name | Core Topics Covered | Questions | Exam Weightage |\n` +
        `| :--- | :--- | :--- | :--- |\n` +
        `| **Module 1** | Intro to Computer & OS (Windows/Linux) | 15 Qs | 15% |\n` +
        `| **Module 2** | LibreOffice Writer (Word Processing) | 20 Qs | 20% |\n` +
        `| **Module 3** | LibreOffice Calc (Spreadsheet Formulas) | 20 Qs | 20% |\n` +
        `| **Module 4** | LibreOffice Impress (Presentations) | 10 Qs | 10% |\n` +
        `| **Module 5** | Internet, WWW & Email | 15 Qs | 15% |\n` +
        `| **Module 6** | Digital Banking (UPI, AEPS, Cards) | 10 Qs | 10% |\n` +
        `| **Module 7** | Cyber Security & Future Skills | 10 Qs | 10% |\n\n` +
        `## ❓ Frequently Asked Questions (FAQs)\n\n` +
        `### Q1. What is the passing score for CCC?\n` +
        `Candidates need at least 50 marks out of 100 (50%) to pass with Grade D or higher.\n\n` +
        `### Q2. How long is the CCC Certificate valid?\n` +
        `The NIELIT CCC certificate has lifetime validity for all government and private job applications.`;

      if (activeContentTab === 'en') {
        setContentEn((prev) => prev + template);
      } else {
        setContentHi((prev) => prev + template);
      }
      success('Template Inserted', 'Added syllabus breakdown & FAQ section.');
    } else if (type === 'mcq_table') {
      const mcqSnippet =
        `\n\n### 📝 Practice Questions for Revision\n\n` +
        `| # | Question Statement | Options | Answer & Explanation |\n` +
        `| :--- | :--- | :--- | :--- |\n` +
        `| 1 | Shortcut key for Save As in LibreOffice Writer | A) Ctrl+S, B) Ctrl+Shift+S, C) F12 | **B) Ctrl+Shift+S** |\n` +
        `| 2 | Maximum rows available in LibreOffice Calc | A) 10,48,576, B) 65,536, C) 1,00,000 | **A) 10,48,576** |\n` +
        `| 3 | OTP stands for | A) One Time Password, B) Only True Pass | **A) One Time Password** |\n`;

      if (activeContentTab === 'en') {
        setContentEn((prev) => prev + mcqSnippet);
      } else {
        setContentHi((prev) => prev + mcqSnippet);
      }
      success('MCQ Table Inserted', 'Added exam practice questions table.');
    } else if (type === 'pro_tip') {
      const tipSnippet =
        `\n\n> 💡 **Important NIELIT Exam Tip:**\n` +
        `> Make sure to memorize all LibreOffice Writer and Calc shortcut keys. Around 15-20 direct shortcut key questions are frequently asked in the online test.`;

      if (activeContentTab === 'en') {
        setContentEn((prev) => prev + tipSnippet);
      } else {
        setContentHi((prev) => prev + tipSnippet);
      }
      success('Exam Tip Added', 'Inserted highlight callout note.');
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!titleEn.trim()) {
      toastError('Title Required', 'Please enter an English title before generating a banner.');
      return;
    }

    setIsGeneratingBanner(true);
    try {
      const selectedCat = blogCategories.find((c) => c.id === categoryId);
      const url = await geminiBlogService.generateAndUploadBanner(
        titleEn.trim(),
        selectedCat?.title || 'CCC Study Guide',
        BANNER_THEMES[0]
      );
      setFeaturedImage(url);
      success('Banner Generated', 'Created and attached high-resolution blog banner.');
    } catch (err: any) {
      toastError('Banner Failed', err.message || 'Could not generate banner image.');
    } finally {
      setIsGeneratingBanner(false);
    }
  };

  const handleApplyAiGenerated = (
    generated: GeneratedBlogResult,
    thumbnailUrl?: string,
    catId?: string
  ) => {
    if (generated.title_en) setTitleEn(generated.title_en);
    if (generated.title_hi) setTitleHi(generated.title_hi);
    if (generated.slug) setSlug(generated.slug);
    if (generated.summary_en) setSummaryEn(generated.summary_en);
    if (generated.summary_hi) setSummaryHi(generated.summary_hi);
    if (generated.content_en) setContentEn(generated.content_en);
    if (generated.content_hi) setContentHi(generated.content_hi);
    if (thumbnailUrl) setFeaturedImage(thumbnailUrl);
    if (catId) setCategoryId(catId);

    success(
      'AI Content Loaded into Studio',
      `Loaded "${generated.title_en}". You can now review and edit in full-screen.`
    );
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const errors: { [key: string]: string } = {};
    if (!titleEn.trim()) errors.titleEn = 'English title is required.';
    if (!titleHi.trim()) errors.titleHi = 'Hindi title is required.';
    if (!slug.trim()) errors.slug = 'SEO URL slug identifier is required.';
    if (!categoryId) errors.categoryId = 'Please select a category.';
    if (!contentEn.trim()) errors.contentEn = 'English article content is required.';
    if (!contentHi.trim()) errors.contentHi = 'Hindi article content is required.';

    // Check slug uniqueness
    const normalizedSlug = slug.trim().toLowerCase();
    const slugExists = allBlogs.some(
      (b) => b.slug === normalizedSlug && b.id !== id
    );
    if (slugExists) {
      errors.slug = 'This slug is already used by another article. Please enter a unique slug.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toastError('Validation Error', 'Please correct the highlighted form errors before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        category_id: categoryId,
        title_en: titleEn.trim(),
        title_hi: titleHi.trim(),
        slug: normalizedSlug,
        summary_en: summaryEn.trim() || undefined,
        summary_hi: summaryHi.trim() || undefined,
        content_en: contentEn,
        content_hi: contentHi,
        featured_image: featuredImage.trim() || undefined,
        author: author.trim() || user?.name || 'CCC Prep Team',
        is_featured: isFeatured,
        is_published: isPublished,
        published_at: isPublished
          ? (publishedAt || new Date().toISOString())
          : undefined,
      };

      if (isEditing && id) {
        await blogService.updateBlog(id, payload);
        success('Article Updated', `Saved "${titleEn}" successfully.`);
      } else {
        await blogService.createBlog(payload);
        success('Article Published', `Published "${titleEn}" successfully.`);
      }

      navigate(ROUTES.BLOGS);
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not save blog article.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-lavender-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-dark-muted">Loading article studio...</p>
        </div>
      </div>
    );
  }

  const selectedCategory = blogCategories.find((c) => c.id === categoryId);
  const wordCountEn = contentEn.trim() ? contentEn.trim().split(/\s+/).length : 0;
  const wordCountHi = contentHi.trim() ? contentHi.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Floating Action Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background-elevated/50 border border-dark-border p-4 sm:p-5 rounded-2xl backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(ROUTES.BLOGS)}
            className="p-2.5 rounded-xl bg-background-card border border-dark-border text-dark-muted hover:text-white hover:border-lavender-500/50 transition-colors"
            title="Back to Articles List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {isEditing ? `Edit Article: ${titleEn || 'Untitled'}` : 'Write New Article'}
              </h1>
              <Badge variant={isPublished ? 'success' : 'neutral'} dot>
                {isPublished ? 'Published Live' : 'Draft'}
              </Badge>
              {isFeatured && (
                <Badge variant="primary" size="sm">
                  Featured
                </Badge>
              )}
            </div>
            <p className="text-xs text-dark-muted mt-0.5">
              Full-screen bilingual article studio with Markdown, live Google SERP preview, and AI banner generator
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(ROUTES.BLOGS)}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsAiModalOpen(true)}
            className="border-lavender-500/30 text-lavender-300 hover:bg-lavender-500/10"
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-lavender-400" />
            Generate with AI
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPreviewModalOpen(true)}
            className="border-dark-border hover:bg-white/5"
          >
            <Eye className="w-4 h-4 mr-1.5 text-lavender-400" />
            Live Preview
          </Button>

          <Button onClick={() => handleSave()} isLoading={isSaving} disabled={isSaving}>
            <Save className="w-4 h-4 mr-1.5" />
            {isEditing ? 'Save Changes' : 'Publish Article'}
          </Button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Article Writing Studio (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Article Titles & Summaries */}
          <div className="p-5 sm:p-6 rounded-2xl bg-background-card/90 border border-dark-border space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-dark-border/80 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-lavender-400" />
                Article Titles & URL Identifier
              </h2>
              <span className="text-[11px] text-dark-dim font-mono">Bilingual Info</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Article Title (English) *"
                  placeholder="e.g. How to Score Grade S in NIELIT CCC Exam on First Attempt"
                  value={titleEn}
                  onChange={(e) => handleTitleEnChange(e.target.value)}
                  error={formErrors.titleEn}
                  helperText="Primary English headline displayed across web and mobile."
                  required
                />
                <Input
                  label="लेख का शीर्षक (Hindi) *"
                  placeholder="उदा. अपने पहले प्रयास में NIELIT CCC परीक्षा में ग्रेड S कैसे प्राप्त करें"
                  value={titleHi}
                  onChange={(e) => setTitleHi(e.target.value)}
                  error={formErrors.titleHi}
                  helperText="हिंदी शीर्षक जो हिंदी माध्यम के छात्रों को दिखाया जाएगा।"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Input
                  label="Permanent SEO URL Slug *"
                  placeholder="e.g. how-to-score-grade-s-in-nielit-ccc-exam"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
                  }
                  error={formErrors.slug}
                  helperText="Unique permanent link for routing (e.g. /blogs/how-to-score-grade-s...)"
                  required
                />
                {slug && (
                  <div className="flex items-center gap-1.5 text-xs text-lavender-300 font-mono bg-lavender-500/10 px-3 py-1.5 rounded-xl border border-lavender-500/20">
                    <Globe className="w-3.5 h-3.5 text-lavender-400 shrink-0" />
                    <span className="text-dark-muted">https://cccprep.app/blogs/</span>
                    <span className="text-white font-bold">{slug}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <Textarea
                  label="Short Summary / Card Snippet (English)"
                  placeholder="Brief 2-line summary shown on article cards and search snippets..."
                  value={summaryEn}
                  onChange={(e) => setSummaryEn(e.target.value)}
                  rows={2}
                  helperText="120-160 characters recommended for mobile preview cards."
                />
                <Textarea
                  label="संक्षिप्त सारांश (Hindi)"
                  placeholder="कार्ड पर दिखाया जाने वाला संक्षिप्त सारांश..."
                  value={summaryHi}
                  onChange={(e) => setSummaryHi(e.target.value)}
                  rows={2}
                  helperText="मोबाइल ऐप और लिस्टिंग कार्ड्स पर प्रदर्शित संक्षिप्त विवरण।"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Featured Banner Image Studio (Dual Mode + AI Banner Generator) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-background-card/90 border border-dark-border space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-border/80 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-lavender-400" />
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Featured Banner Image
                  </h2>
                  <p className="text-xs text-dark-muted">
                    16:9 banner thumbnail displayed on top of article and in mobile cards
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Mode Selector Tabs */}
                <div className="flex items-center bg-background rounded-xl p-1 border border-dark-border text-xs">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('upload')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                      imageInputMode === 'upload'
                        ? 'bg-lavender-500 text-white shadow-sm'
                        : 'text-dark-muted hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                      imageInputMode === 'url'
                        ? 'bg-lavender-500 text-white shadow-sm'
                        : 'text-dark-muted hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Paste URL</span>
                  </button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateThumbnail}
                  isLoading={isGeneratingBanner}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-lavender-400" />}
                  className="text-xs py-1.5 bg-lavender-500/10 border-lavender-500/30 text-lavender-200 hover:bg-lavender-500/20"
                >
                  {isGeneratingBanner ? 'Generating...' : '✨ Generate AI Banner'}
                </Button>
              </div>
            </div>

            {/* Upload Mode */}
            {imageInputMode === 'upload' && (
              <FileUpload
                bucket={APP_CONFIG.STORAGE_BUCKETS.BLOG_IMAGES}
                type="image"
                accept="image/*"
                value={featuredImage}
                onChange={(url) => setFeaturedImage(url)}
                helperText="Upload 16:9 banner image directly to Supabase Storage, or switch to 'Paste URL'."
              />
            )}

            {/* Direct URL Paste Mode */}
            {imageInputMode === 'url' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste direct image URL (e.g. https://images.unsplash.com/... or Supabase public URL)"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value.trim())}
                    className="flex-1"
                  />
                  {featuredImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeaturedImage('')}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                {/* Live Preview of Pasted URL */}
                {featuredImage && (
                  <div className="p-3 rounded-xl bg-background border border-dark-border flex items-center gap-3">
                    <img
                      src={featuredImage}
                      alt="Banner Preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/600x400/1e293b/94a3b8?text=Invalid+Image+URL';
                      }}
                      className="w-20 h-14 object-cover rounded-lg border border-lavender-500/30 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{featuredImage}</p>
                      <a
                        href={featuredImage}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-lavender-400 hover:underline inline-block mt-0.5"
                      >
                        Open original link ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 3: Full Bilingual Article Content Studio (Spacious MDXEditor) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-background-card/90 border border-dark-border space-y-4 shadow-sm">
            {/* Header & Language Tab Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-border/80 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-lavender-400" />
                  Full Article Content Studio
                </h2>
                <p className="text-xs text-dark-muted mt-0.5">
                  Compose comprehensive study guides with headings, tables, bullet points, and code blocks
                </p>
              </div>

              {/* Language Tabs */}
              <div className="flex items-center bg-background rounded-xl p-1 border border-dark-border text-xs">
                <button
                  type="button"
                  onClick={() => setActiveContentTab('en')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 font-medium ${
                    activeContentTab === 'en'
                      ? 'bg-lavender-500 text-white shadow-sm'
                      : 'text-dark-muted hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>English Article</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                    {wordCountEn}w
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveContentTab('hi')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 font-medium ${
                    activeContentTab === 'hi'
                      ? 'bg-lavender-500 text-white shadow-sm'
                      : 'text-dark-muted hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>हिंदी सामग्री</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                    {wordCountHi}w
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Template Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-background-elevated/60 border border-dark-border/80">
              <span className="text-[11px] font-semibold text-dark-muted uppercase tracking-wider mr-1">
                Insert Blocks:
              </span>
              <button
                type="button"
                onClick={() => handleInsertTemplate('full_guide')}
                className="px-2.5 py-1 rounded-lg text-xs bg-lavender-500/10 hover:bg-lavender-500/20 text-lavender-200 border border-lavender-500/20 transition-colors flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-lavender-400" />
                <span>+ Syllabus & FAQs</span>
              </button>
              <button
                type="button"
                onClick={() => handleInsertTemplate('mcq_table')}
                className="px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 border border-emerald-500/20 transition-colors flex items-center gap-1.5"
              >
                <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Practice MCQs Table</span>
              </button>
              <button
                type="button"
                onClick={() => handleInsertTemplate('pro_tip')}
                className="px-2.5 py-1 rounded-lg text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-500/20 transition-colors flex items-center gap-1.5"
              >
                <Quote className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Exam Tip Callout</span>
              </button>
            </div>

            {/* Editor Canvas Area */}
            {activeContentTab === 'en' ? (
              <div className="space-y-2">
                <MDXEditorComponent
                  label="English Markdown Article Content *"
                  value={contentEn}
                  onChange={setContentEn}
                  placeholder="Write full article in markdown format with headings, bullet points, tables, and guides..."
                  minHeight="480px"
                  helperText="WYSIWYG Markdown Editor with live shortcuts, headings, tables, and diff source view."
                />
                {formErrors.contentEn && (
                  <p className="text-xs text-rose-400 mt-1">{formErrors.contentEn}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <MDXEditorComponent
                  label="सम्पूर्ण लेख सामग्री (Hindi Markdown) *"
                  value={contentHi}
                  onChange={setContentHi}
                  placeholder="यहाँ हिंदी में विस्तृत लेख, अध्याय विश्लेषण और परीक्षा टिप्स लिखें..."
                  minHeight="480px"
                  helperText="हिंदी में विस्तृत लेख सामग्री तैयार करें। इसमें हेडिंग, टेबल, और बुलेट पॉइंट्स का प्रयोग करें।"
                />
                {formErrors.contentHi && (
                  <p className="text-xs text-rose-400 mt-1">{formErrors.contentHi}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Settings, Metadata & Live SERP Preview (1 Col) */}
        <div className="space-y-6">
          {/* Card 1: Category & Publishing Controls */}
          <div className="p-5 rounded-2xl bg-background-card/90 border border-dark-border space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-dark-border/80 pb-3">
              <Layers className="w-4 h-4 text-lavender-400" />
              Category & Publishing
            </h2>

            <Select
              label="Article Category *"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={blogCategories.map((c) => ({
                value: c.id,
                label: `${c.title} (${c.hindi_title})`,
              }))}
              error={formErrors.categoryId}
              required
            />

            <Input
              label="Author Name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Admin Team / Gaurav Jha"
              helperText="Author credit shown in mobile app and web post header."
            />

            <div className="space-y-3 pt-2 border-t border-dark-border/60">
              <Switch
                checked={isPublished}
                onChange={setIsPublished}
                label="Published Status"
                description="Make article immediately readable on the mobile app & web."
              />
              <Switch
                checked={isFeatured}
                onChange={setIsFeatured}
                label="Featured Article"
                description="Prominently displays in the top carousel on the home screen."
              />
            </div>
          </div>

          {/* Card 2: Live Google Search SERP Snippet Preview */}
          <div className="p-5 rounded-2xl bg-background-card/90 border border-dark-border space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-dark-border/80 pb-2.5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-lavender-400" />
                Google SERP Snippet Preview
              </h2>
              <Badge variant="neutral" size="sm">
                Organic SEO
              </Badge>
            </div>

            <div className="p-3.5 rounded-xl bg-background-elevated border border-dark-border space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-dark-muted font-sans truncate">
                <span className="text-white font-medium">cccprep.app</span>
                <span>›</span>
                <span className="text-dark-dim">blogs</span>
                <span>›</span>
                <span className="text-lavender-400 font-mono truncate">
                  {slug || 'your-slug-here'}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer truncate">
                {titleEn || 'Pass NIELIT CCC 2026: Complete Strategy & Syllabus'}
              </h3>
              <p className="text-xs text-dark-muted line-clamp-2 leading-relaxed">
                {summaryEn ||
                  'Comprehensive study guide covering LibreOffice Writer, Calc, Impress, digital banking, and latest NIELIT CCC exam question patterns.'}
              </p>
            </div>
          </div>

          {/* Card 3: Mobile Card Simulation Preview */}
          <div className="p-5 rounded-2xl bg-background-card/90 border border-dark-border space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-dark-border/80 pb-2.5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-lavender-400" />
                Mobile App Card Preview
              </h2>
              <span className="text-[10px] text-dark-dim font-mono">App Feed</span>
            </div>

            <div className="p-3 rounded-2xl bg-background border border-dark-border space-y-2.5 shadow-sm">
              <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-dark-bg border border-dark-border">
                {featuredImage ? (
                  <img src={featuredImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-dark-muted text-xs gap-1">
                    <ImageIcon className="w-6 h-6 text-lavender-400/50" />
                    <span>No Featured Image</span>
                  </div>
                )}
                {isFeatured && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-lavender-500 text-white text-[10px] font-bold shadow-md">
                    Featured
                  </div>
                )}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium">
                  {selectedCategory?.title || 'General'}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white line-clamp-2">
                  {titleEn || 'Article Title in English'}
                </h4>
                <p className="text-[11px] text-lavender-300 font-medium line-clamp-1">
                  {titleHi || 'लेख का शीर्षक हिंदी में'}
                </p>
                <p className="text-[11px] text-dark-muted line-clamp-2 leading-relaxed">
                  {summaryEn || 'Brief preview description shown on the article feed card...'}
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-dark-dim pt-1 border-t border-dark-border/60">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3 h-3 text-lavender-400" />
                  <span className="truncate max-w-[100px]">{author || 'Admin Team'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-dark-muted" />
                  <span>{formatDate(publishedAt || new Date().toISOString())}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Markdown Cheatsheet Card */}
          <div className="p-5 rounded-2xl bg-background-card/90 border border-dark-border space-y-2.5 shadow-sm">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-dark-border/80 pb-2">
              <HelpCircle className="w-3.5 h-3.5 text-lavender-400" />
              Markdown Quick Reference
            </h2>
            <div className="text-[11px] text-dark-muted space-y-1 font-mono leading-relaxed">
              <p><span className="text-lavender-300 font-bold"># Heading 1</span></p>
              <p><span className="text-lavender-300 font-bold">## Heading 2</span></p>
              <p><span className="text-lavender-300 font-bold">**Bold Text**</span> & <span className="text-lavender-300 font-bold">*Italic*</span></p>
              <p><span className="text-lavender-300 font-bold">- Bullet list item</span></p>
              <p><span className="text-lavender-300 font-bold">&gt; Blockquote tip</span></p>
              <p><span className="text-lavender-300 font-bold">| Col 1 | Col 2 |</span> (Tables)</p>
            </div>
          </div>
        </div>
      </form>

      {/* AI Blog Generation Modal */}
      <AiBlogGenerateModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        categories={blogCategories}
        authorName={author || user?.name || 'CCC Prep Team'}
        onSuccess={(created) => {
          navigate(ROUTES.BLOGS);
        }}
        onApplyGenerated={(gen, thumbUrl, catId) => {
          handleApplyAiGenerated(gen, thumbUrl, catId);
        }}
      />

      {/* Full Live Article Preview Modal */}
      {isPreviewModalOpen && (
        <Modal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          size="2xl"
          title={titleEn || 'Article Preview'}
          subtitle={`By ${author || 'Admin Team'} • /${slug || 'preview-slug'}`}
          footer={
            <Button variant="secondary" onClick={() => setIsPreviewModalOpen(false)}>
              Close Preview
            </Button>
          }
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {featuredImage && (
              <img
                src={featuredImage}
                alt=""
                className="w-full h-56 object-cover rounded-2xl border border-lavender-500/20 shadow-md"
              />
            )}

            <div className="space-y-2 border-b border-dark-border pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-lavender-500/20 text-lavender-300 font-semibold text-xs">
                  {selectedCategory?.title || 'General'}
                </span>
                {isFeatured && (
                  <Badge variant="primary" size="sm">
                    Featured
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-bold text-white">{titleEn}</h2>
              <p className="text-base font-medium text-lavender-300">{titleHi}</p>
            </div>

            <div className="p-4 rounded-2xl bg-background-elevated/50 border border-dark-border space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-dark-muted flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-lavender-400" />
                English Content
              </span>
              <div className="prose prose-invert prose-lavender max-w-none text-xs text-dark-text whitespace-pre-wrap leading-relaxed">
                {contentEn}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-background-elevated/50 border border-dark-border space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-lavender-400 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-lavender-400" />
                हिंदी सामग्री
              </span>
              <div className="prose prose-invert prose-lavender max-w-none text-xs text-dark-text whitespace-pre-wrap leading-relaxed">
                {contentHi}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
