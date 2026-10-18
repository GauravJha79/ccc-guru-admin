import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Globe,
  Eye,
  BookOpen,
  Calendar,
  User as UserIcon,
  X,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Blog,
  BlogCategory,
  ArticleLanguage,
  LinkedTranslation,
  HygraphAuthor,
} from '../../types/database';
import { blogService } from '../../services/blogService';
import { MDXEditorComponent } from '../../components/common/MDXEditorComponent';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { generateSlug } from '../../lib/utils';
import { ROUTES } from '../../constants/routes';
import { AiBlogGenerateModal } from './AiBlogGenerateModal';
import { geminiBlogService, GeneratedBlogResult } from '../../services/geminiBlogService';
import { ArticleEditorHeader } from './editor/ArticleEditorHeader';
import { ArticleTitleInput } from './editor/ArticleTitleInput';
import { EditorStatusBar } from './editor/EditorStatusBar';
import { ArticleSettingsSidebar } from './editor/ArticleSettingsSidebar';

interface FormSnapshot {
  title: string;
  slug: string;
  language: ArticleLanguage;
  categoryId: string;
  authorId: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  featuredImage: string;
  featuredImageAlt: string;
  isFeatured: boolean;
  isPublished: boolean;
}

export const BlogEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const isEditing = Boolean(id);

  // Loading & Async action states
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isCreatingTranslation, setIsCreatingTranslation] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // UI Drawer / Sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Entities Data
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [authors, setAuthors] = useState<HygraphAuthor[]>([]);
  const [allBlogs, setAllBlogs] = useState<Blog[]>([]);

  // Core Form State
  const [language, setLanguage] = useState<ArticleLanguage>('EN');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [publishedAt, setPublishedAt] = useState<string | undefined>(undefined);
  const [translationGroupId, setTranslationGroupId] = useState('');
  const [linkedTranslation, setLinkedTranslation] = useState<LinkedTranslation | null>(null);

  // SEO Fields
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // Snapshot for dirty-checking
  const initialSnapshot = useRef<FormSnapshot | null>(null);

  // Modals & Dialogs
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isUnlinkConfirmOpen, setIsUnlinkConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isBackConfirmOpen, setIsBackConfirmOpen] = useState(false);

  // Compute dirty/unsaved state
  const isDirty = useMemo(() => {
    if (!initialSnapshot.current) return false;
    const s = initialSnapshot.current;
    return (
      title !== s.title ||
      slug !== s.slug ||
      language !== s.language ||
      categoryId !== s.categoryId ||
      authorId !== s.authorId ||
      content !== s.content ||
      excerpt !== s.excerpt ||
      metaTitle !== s.metaTitle ||
      metaDescription !== s.metaDescription ||
      featuredImage !== s.featuredImage ||
      featuredImageAlt !== s.featuredImageAlt ||
      isFeatured !== s.isFeatured ||
      isPublished !== s.isPublished
    );
  }, [
    title,
    slug,
    language,
    categoryId,
    authorId,
    content,
    excerpt,
    metaTitle,
    metaDescription,
    featuredImage,
    featuredImageAlt,
    isFeatured,
    isPublished,
  ]);

  // Warn user on browser refresh/close if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Initial Fetch Data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [catsData, blogsData, authorsData] = await Promise.all([
          blogService.getCategories(),
          blogService.getBlogs(),
          blogService.getAuthors(),
        ]);
        setBlogCategories(catsData);
        setAllBlogs(blogsData);
        setAuthors(authorsData);

        if (isEditing && id) {
          const item = blogsData.find((b) => b.id === id) || (await blogService.getBlogById(id));
          if (item) {
            const itemLang = item.language || 'EN';
            const itemCatId = item.category_id || (catsData[0]?.id ?? '');
            const itemAuthId = item.author_id || (authorsData[0]?.id ?? '');

            setLanguage(itemLang);
            setTitle(item.title);
            setSlug(item.slug);
            setCategoryId(itemCatId);
            setAuthorId(itemAuthId);
            setAuthorName(item.author || user?.name || 'CCC Prep Team');
            setExcerpt(item.excerpt || '');
            setContent(item.content || '');
            setFeaturedImage(item.featured_image || '');
            setFeaturedImageAlt(item.featured_image_alt || '');
            setIsFeatured(item.is_featured);
            setIsPublished(item.is_published);
            setPublishedAt(item.published_at);
            setTranslationGroupId(item.translation_group_id || '');
            setLinkedTranslation(item.linked_translation || null);
            setMetaTitle(item.meta_title || '');
            setMetaDescription(item.meta_description || '');

            initialSnapshot.current = {
              title: item.title,
              slug: item.slug,
              language: itemLang,
              categoryId: itemCatId,
              authorId: itemAuthId,
              content: item.content || '',
              excerpt: item.excerpt || '',
              metaTitle: item.meta_title || '',
              metaDescription: item.meta_description || '',
              featuredImage: item.featured_image || '',
              featuredImageAlt: item.featured_image_alt || '',
              isFeatured: item.is_featured,
              isPublished: item.is_published,
            };
          } else {
            toastError('Not Found', 'Article could not be found.');
            navigate(ROUTES.BLOGS);
          }
        } else {
          // Defaults for new article
          const defaultCatId = catsData[0]?.id ?? '';
          const defaultAuthId = authorsData[0]?.id ?? '';
          setCategoryId(defaultCatId);
          setAuthorId(defaultAuthId);
          setAuthorName(user?.name || 'CCC Prep Team');
          setLanguage('EN');
          setContent('');

          initialSnapshot.current = {
            title: '',
            slug: '',
            language: 'EN',
            categoryId: defaultCatId,
            authorId: defaultAuthId,
            content: '',
            excerpt: '',
            metaTitle: '',
            metaDescription: '',
            featuredImage: '',
            featuredImageAlt: '',
            isFeatured: false,
            isPublished: true,
          };
        }
      } catch (err: any) {
        toastError('Fetch Error', err.message || 'Could not load article data.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditing, navigate, user?.name]);

  // Title change with auto-slug generation on new articles
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing && !slug) {
      setSlug(generateSlug(val));
    }
  };

  const handleAutoGenerateSlug = () => {
    if (!title.trim()) {
      toastError('Title Required', 'Please enter an article title first.');
      return;
    }
    const newSlug = generateSlug(title);
    setSlug(language === 'HI' ? `${newSlug}-hi` : newSlug);
    success('Slug Updated', 'Auto-generated SEO slug from article title.');
  };

  // Language switch
  const handleLanguageChange = (newLang: ArticleLanguage) => {
    if (newLang === language) return;
    setLanguage(newLang);

    // Update slug suffix recommendation if new article
    if (!isEditing && slug) {
      if (newLang === 'HI' && !slug.endsWith('-hi')) {
        setSlug(`${slug}-hi`);
      } else if (newLang === 'EN' && slug.endsWith('-hi')) {
        setSlug(slug.replace(/-hi$/, ''));
      }
    }
  };

  // Quick Content Templates
  const handleInsertTemplate = (type: 'faq' | 'practice_table' | 'pro_tip') => {
    if (type === 'faq') {
      const template =
        `\n\n## ❓ Frequently Asked Questions (FAQs)\n\n` +
        `### Q1. What is the passing score for CCC?\n` +
        `Candidates need at least 50 marks out of 100 (50%) to pass with Grade D or higher.\n\n` +
        `### Q2. How long is the CCC Certificate valid?\n` +
        `The NIELIT CCC certificate has lifetime validity for all government and private job applications.`;

      setContent((prev) => prev + template);
      success('Template Inserted', 'Added FAQ section.');
    } else if (type === 'practice_table') {
      const mcqSnippet =
        `\n\n### 📝 Practice Revision Questions\n\n` +
        `| # | Question Statement | Options | Answer & Explanation |\n` +
        `| :--- | :--- | :--- | :--- |\n` +
        `| 1 | Shortcut key for Save As in LibreOffice Writer | A) Ctrl+S, B) Ctrl+Shift+S, C) F12 | **B) Ctrl+Shift+S** |\n` +
        `| 2 | Maximum rows available in LibreOffice Calc | A) 10,48,576, B) 65,536, C) 1,00,000 | **A) 10,48,576** |\n` +
        `| 3 | OTP stands for | A) One Time Password, B) Only True Pass | **A) One Time Password** |\n`;

      setContent((prev) => prev + mcqSnippet);
      success('Template Inserted', 'Added practice questions table.');
    } else if (type === 'pro_tip') {
      const tipSnippet =
        `\n\n> **💡 Expert Exam Strategy:**\n` +
        `> Make sure to read every question carefully. In True/False questions, absolute words like "always", "never", and "only" often indicate false statements.`;

      setContent((prev) => prev + tipSnippet);
      success('Tip Inserted', 'Added pro-tip alert box.');
    }
  };

  // AI Banner generator
  const handleGenerateThumbnail = async () => {
    if (!title.trim()) {
      toastError('Title Required', 'Enter an article title before generating a banner.');
      return;
    }
    setIsGeneratingBanner(true);
    try {
      const cat = blogCategories.find((c) => c.id === categoryId);
      const prompt = `Modern educational thumbnail banner for blog post: "${title}". Topic: ${cat?.title || 'Computer Concepts'}. High quality 16:9 banner with clean tech gradient background.`;
      const generated = await geminiBlogService.generateRealisticThumbnail({
        title,
        categoryName: cat?.title || 'CCC Study Guide',
        customPrompt: prompt,
        style: 'student_portrait',
      });
      if (generated?.url) {
        setFeaturedImage(generated.url);
        if (!featuredImageAlt) setFeaturedImageAlt(title);
        success('AI Banner Ready', 'Generated 16:9 banner image for your article.');
      }
    } catch (e: any) {
      toastError('Banner Failed', e.message || 'Could not generate banner.');
    } finally {
      setIsGeneratingBanner(false);
    }
  };

  // Load AI modal results into state
  const handleApplyAiGenerated = (
    generated: GeneratedBlogResult,
    thumbnailUrl?: string,
    catId?: string
  ) => {
    if (language === 'EN') {
      if (generated.title_en) setTitle(generated.title_en);
      if (generated.slug) setSlug(generated.slug);
      if (generated.summary_en) setExcerpt(generated.summary_en);
      if (generated.content_en) setContent(generated.content_en);
    } else {
      if (generated.title_hi) setTitle(generated.title_hi);
      if (generated.slug) setSlug(`${generated.slug}-hi`);
      if (generated.summary_hi) setExcerpt(generated.summary_hi);
      if (generated.content_hi) setContent(generated.content_hi);
    }

    if (thumbnailUrl) setFeaturedImage(thumbnailUrl);
    if (catId) setCategoryId(catId);

    success(
      'AI Content Loaded into Studio',
      `Loaded content for ${language === 'EN' ? 'English' : 'Hindi'} article.`
    );
  };

  // Save / Publish Core Mutation Handler
  const handleSave = async (overridePublished?: boolean) => {
    const targetPublished = overridePublished !== undefined ? overridePublished : isPublished;

    // Form Validations
    if (!title.trim()) {
      toastError('Title Required', 'Please enter an article title before saving.');
      return;
    }
    if (!slug.trim()) {
      toastError('Slug Required', 'Please enter a unique URL slug before saving.');
      return;
    }
    if (!categoryId) {
      toastError('Category Required', 'Please select an article category.');
      return;
    }
    if (!content.trim()) {
      toastError('Content Required', 'Article content cannot be empty.');
      return;
    }

    // Check slug uniqueness in same language
    const normalizedSlug = slug.trim().toLowerCase();
    const slugExists = allBlogs.some(
      (b) => b.slug === normalizedSlug && b.language === language && b.id !== id
    );
    if (slugExists) {
      toastError(
        'Duplicate Slug',
        `This slug is already used by another ${language === 'EN' ? 'English' : 'Hindi'} article. Please modify the slug.`
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        slug: normalizedSlug,
        language,
        category_id: categoryId,
        author_id: authorId || undefined,
        content,
        excerpt: excerpt.trim() || undefined,
        meta_title: metaTitle.trim() || undefined,
        meta_description: metaDescription.trim() || undefined,
        featured_image: featuredImage.trim() || undefined,
        featured_image_alt: featuredImageAlt.trim() || undefined,
        is_featured: isFeatured,
        is_published: targetPublished,
        translation_group_id: translationGroupId || undefined,
      };

      if (isEditing && id) {
        await blogService.updateBlog(id, payload);
        setIsPublished(targetPublished);
        success(
          targetPublished ? 'Article Published Live' : 'Draft Saved',
          `Successfully updated "${title}" in Hygraph.`
        );
      } else {
        const created = await blogService.createBlog(payload);
        setIsPublished(targetPublished);
        success(
          targetPublished ? 'Article Created & Published' : 'Draft Created',
          `Successfully saved "${title}" in Hygraph.`
        );
        navigate(`/blogs/edit/${created.id}`);
        return;
      }

      // Update snapshot
      initialSnapshot.current = {
        title: title.trim(),
        slug: normalizedSlug,
        language,
        categoryId,
        authorId,
        content,
        excerpt: excerpt.trim(),
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        featuredImage: featuredImage.trim(),
        featuredImageAlt: featuredImageAlt.trim(),
        isFeatured,
        isPublished: targetPublished,
      };
      setLastSavedAt(new Date());

      // Refresh list
      const updatedList = await blogService.getBlogs();
      setAllBlogs(updatedList);
      const current = updatedList.find((b) => b.id === id);
      if (current) {
        setLinkedTranslation(current.linked_translation || null);
      }
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not save blog article to Hygraph.');
    } finally {
      setIsSaving(false);
    }
  };

  // Translation linking handlers
  const handleLinkTranslation = async (targetPostId: string) => {
    if (!id || !targetPostId) {
      toastError('Selection Required', 'Please select an article to link.');
      return;
    }

    setIsLinking(true);
    try {
      await blogService.linkTranslations(id, targetPostId);
      success('Translations Linked', 'Articles successfully connected as translations of each other.');

      // Refresh current article
      const updatedList = await blogService.getBlogs();
      setAllBlogs(updatedList);
      const current = updatedList.find((b) => b.id === id);
      if (current) {
        setTranslationGroupId(current.translation_group_id);
        setLinkedTranslation(current.linked_translation || null);
      }
    } catch (err: any) {
      toastError('Linking Failed', err.message);
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkTranslation = async () => {
    if (!id) return;
    setIsUnlinking(true);
    try {
      await blogService.unlinkTranslation(id);
      success('Translation Unlinked', 'Article disconnected. Both records preserved.');
      setIsUnlinkConfirmOpen(false);

      // Refresh
      const updatedList = await blogService.getBlogs();
      setAllBlogs(updatedList);
      const current = updatedList.find((b) => b.id === id);
      if (current) {
        setTranslationGroupId(current.translation_group_id);
        setLinkedTranslation(null);
      }
    } catch (err: any) {
      toastError('Unlinking Failed', err.message);
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleCreateCounterpartDraft = async () => {
    if (!id) return;
    setIsCreatingTranslation(true);
    try {
      const counterpartLang = language === 'EN' ? 'Hindi' : 'English';
      const newDraft = await blogService.createTranslationDraft(id);
      success('Translation Draft Created', `Created new ${counterpartLang} draft. Opening in studio...`);
      navigate(`/blogs/edit/${newDraft.id}`);
    } catch (err: any) {
      toastError('Draft Creation Failed', err.message);
    } finally {
      setIsCreatingTranslation(false);
    }
  };

  // Delete handler
  const handleDeleteArticle = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await blogService.deleteBlog(id);
      success('Article Deleted', 'Article was permanently removed from Hygraph.');
      setIsDeleteConfirmOpen(false);
      navigate(ROUTES.BLOGS);
    } catch (err: any) {
      toastError('Delete Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBackNavigation = () => {
    if (isDirty) {
      setIsBackConfirmOpen(true);
    } else {
      navigate(ROUTES.BLOGS);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-lavender-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-dark-muted font-medium">Opening WordPress-style CMS Workspace...</p>
        </div>
      </div>
    );
  }

  const selectedCategory = blogCategories.find((c) => c.id === categoryId);
  const selectedAuthor = authors.find((a) => a.id === authorId);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background select-text">
      {/* 1. STICKY TOP CMS EDITOR HEADER */}
      <ArticleEditorHeader
        isEditing={isEditing}
        isPublished={isPublished}
        language={language}
        isDirty={isDirty}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        isSidebarOpen={isSidebarOpen}
        slug={slug}
        onBack={handleBackNavigation}
        onSaveDraft={() => handleSave(false)}
        onPublish={() => handleSave(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenPreviewModal={() => setIsPreviewModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onLanguageChange={handleLanguageChange}
        onInsertTemplate={handleInsertTemplate}
        onDeleteArticle={isEditing ? () => setIsDeleteConfirmOpen(true) : undefined}
      />

      {/* 2. BODY SPLIT: WRITING WORKSPACE (CENTER) + CONTEXTUAL SETTINGS (RIGHT) */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* CENTER PANE: DEDICATED BLOG WRITING WORKSPACE */}
        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-background transition-all">
          {/* A. Prominent Article Title Bar */}
          <ArticleTitleInput
            title={title}
            slug={slug}
            language={language}
            onChangeTitle={handleTitleChange}
            onAutoGenerateSlug={handleAutoGenerateSlug}
          />

          {/* B. Dedicated Writing Workspace */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative bg-background">
            <MDXEditorComponent
              value={content}
              onChange={setContent}
              variant="document"
              placeholder={
                language === 'EN'
                  ? 'Start typing your article content or use markdown formatting...'
                  : 'यहाँ अपना लेख लिखना शुरू करें...'
              }
            />
          </div>

          {/* C. Subtle Bottom Writing Statistics Bar */}
          <EditorStatusBar
            content={content}
            language={language}
            categoryName={selectedCategory?.title}
            authorName={selectedAuthor?.name || authorName}
          />
        </div>

        {/* RIGHT PANE: CONTEXTUAL ARTICLE SETTINGS SIDEBAR */}
        <ArticleSettingsSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          id={id}
          isEditing={isEditing}
          language={language}
          onChangeLanguage={handleLanguageChange}
          title={title}
          slug={slug}
          onChangeSlug={setSlug}
          onAutoGenerateSlug={handleAutoGenerateSlug}
          categoryId={categoryId}
          onChangeCategoryId={setCategoryId}
          authorId={authorId}
          onChangeAuthorId={setAuthorId}
          excerpt={excerpt}
          onChangeExcerpt={setExcerpt}
          featuredImage={featuredImage}
          onChangeFeaturedImage={setFeaturedImage}
          featuredImageAlt={featuredImageAlt}
          onChangeFeaturedImageAlt={setFeaturedImageAlt}
          isFeatured={isFeatured}
          onChangeIsFeatured={setIsFeatured}
          isPublished={isPublished}
          onChangeIsPublished={setIsPublished}
          publishedAt={publishedAt}
          metaTitle={metaTitle}
          onChangeMetaTitle={setMetaTitle}
          metaDescription={metaDescription}
          onChangeMetaDescription={setMetaDescription}
          translationGroupId={translationGroupId}
          linkedTranslation={linkedTranslation}
          allBlogs={allBlogs}
          onLinkTranslation={handleLinkTranslation}
          onUnlinkTranslation={() => setIsUnlinkConfirmOpen(true)}
          onCreateCounterpartDraft={handleCreateCounterpartDraft}
          isLinkingTranslation={isLinking}
          isUnlinkingTranslation={isUnlinking}
          isCreatingDraft={isCreatingTranslation}
          onGenerateAiBanner={handleGenerateThumbnail}
          isGeneratingBanner={isGeneratingBanner}
          isSaving={isSaving}
          onSaveDraft={() => handleSave(false)}
          onPublish={() => handleSave(true)}
          onDeleteArticle={isEditing ? () => setIsDeleteConfirmOpen(true) : undefined}
          onInsertTemplate={handleInsertTemplate}
          blogCategories={blogCategories}
          authors={authors}
        />
      </div>

      {/* AI Blog Generation Modal */}
      <AiBlogGenerateModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyGenerated={handleApplyAiGenerated}
        categories={blogCategories}
      />

      {/* Live Reading Preview Modal */}
      {isPreviewModalOpen && (
        <Modal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title={`Live Article Preview: ${title || 'Untitled'}`}
          size="xl"
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            <div className="p-4 rounded-xl bg-slate-900 border border-dark-border flex items-center justify-between text-xs">
              <span className="font-mono text-lavender-400">
                https://www.cccguru.in{language === 'EN' ? '/en/blogs/' : '/hi/blogs/'}
                {slug || 'preview'}
              </span>
              <span className="text-dark-muted">
                {language === 'EN' ? 'English Article' : 'हिंदी लेख'}
              </span>
            </div>

            {featuredImage && (
              <div className="rounded-xl overflow-hidden border border-dark-border aspect-video max-h-80 bg-black">
                <img
                  src={featuredImage}
                  alt={featuredImageAlt || title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                {title || 'Article Title'}
              </h1>
              {excerpt && <p className="text-sm text-dark-muted mb-4 italic">{excerpt}</p>}
            </div>

            <div className="prose prose-invert max-w-none text-sm text-slate-200 border-t border-dark-border pt-4">
              <div
                style={{ whiteSpace: 'pre-line' }}
                dangerouslySetInnerHTML={{
                  __html: content
                    .replace(/### (.*?)\n/g, '<h3 class="text-base font-bold mt-4 mb-2 text-white">$1</h3>')
                    .replace(/## (.*?)\n/g, '<h2 class="text-lg font-bold mt-6 mb-2 text-white border-b border-dark-border pb-1">$1</h2>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>'),
                }}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Unlink Translation Confirmation */}
      <ConfirmDialog
        isOpen={isUnlinkConfirmOpen}
        onClose={() => setIsUnlinkConfirmOpen(false)}
        onConfirm={handleUnlinkTranslation}
        title="Unlink Translated Article?"
        message="This will disconnect this article from its counterpart translation. Both articles will remain saved in Hygraph with their respective content and slugs intact."
        confirmText="Yes, Unlink"
        type="warning"
        isLoading={isUnlinking}
      />

      {/* Delete Article Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteArticle}
        title="Delete Article from Hygraph?"
        message={`Are you sure you want to permanently delete "${title}"? This cannot be undone. Any linked translation will be safely preserved.`}
        confirmText="Yes, Delete Permanently"
        type="danger"
        isLoading={isDeleting}
      />

      {/* Unsaved Changes Confirmation on Navigation */}
      <ConfirmDialog
        isOpen={isBackConfirmOpen}
        onClose={() => setIsBackConfirmOpen(false)}
        onConfirm={() => {
          setIsBackConfirmOpen(false);
          navigate(ROUTES.BLOGS);
        }}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this article. Are you sure you want to leave? All unsaved modifications will be lost."
        confirmText="Discard & Leave"
        type="warning"
      />
    </div>
  );
};
