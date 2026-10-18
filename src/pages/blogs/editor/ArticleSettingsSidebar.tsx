import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Globe,
  Languages,
  Calendar,
  User,
  FolderTree,
  Image as ImageIcon,
  Search,
  ExternalLink,
  Link2,
  Unlink2,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  Copy,
  Check,
  AlertCircle,
  Star,
  Upload,
  X,
} from 'lucide-react';
import {
  Blog,
  BlogCategory,
  ArticleLanguage,
  LinkedTranslation,
  HygraphAuthor,
} from '../../../types/database';
import { Input } from '../../../components/common/Input';
import { Textarea } from '../../../components/common/Textarea';
import { Select } from '../../../components/common/Select';
import { Switch } from '../../../components/common/Switch';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { uploadAssetToHygraph } from '../../../services/hygraphAssetService';

export interface ArticleSettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  // State
  id?: string;
  isEditing: boolean;
  language: ArticleLanguage;
  onChangeLanguage: (lang: ArticleLanguage) => void;
  title: string;
  slug: string;
  onChangeSlug: (slug: string) => void;
  onAutoGenerateSlug: () => void;
  categoryId: string;
  onChangeCategoryId: (catId: string) => void;
  authorId: string;
  onChangeAuthorId: (authId: string) => void;
  excerpt: string;
  onChangeExcerpt: (excerpt: string) => void;
  featuredImage: string;
  onChangeFeaturedImage: (url: string) => void;
  featuredImageAlt: string;
  onChangeFeaturedImageAlt: (alt: string) => void;
  isFeatured: boolean;
  onChangeIsFeatured: (featured: boolean) => void;
  isPublished: boolean;
  onChangeIsPublished: (published: boolean) => void;
  publishedAt?: string;
  // SEO
  metaTitle: string;
  onChangeMetaTitle: (title: string) => void;
  metaDescription: string;
  onChangeMetaDescription: (desc: string) => void;
  // Translation
  translationGroupId: string;
  linkedTranslation: LinkedTranslation | null;
  allBlogs: Blog[];
  onLinkTranslation: (targetPostId: string) => void;
  onUnlinkTranslation: () => void;
  onCreateCounterpartDraft: () => void;
  isLinkingTranslation: boolean;
  isUnlinkingTranslation: boolean;
  isCreatingDraft: boolean;
  // AI banner
  onGenerateAiBanner: () => void;
  isGeneratingBanner: boolean;
  // Save & publish
  isSaving: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  // Delete & Templates
  onDeleteArticle?: () => void;
  onInsertTemplate?: (type: 'faq' | 'practice_table' | 'pro_tip') => void;
  // Data
  blogCategories: BlogCategory[];
  authors: HygraphAuthor[];
}

export const ArticleSettingsSidebar: React.FC<ArticleSettingsSidebarProps> = ({
  isOpen,
  onClose,
  id,
  isEditing,
  language,
  onChangeLanguage,
  title,
  slug,
  onChangeSlug,
  onAutoGenerateSlug,
  categoryId,
  onChangeCategoryId,
  authorId,
  onChangeAuthorId,
  excerpt,
  onChangeExcerpt,
  featuredImage,
  onChangeFeaturedImage,
  featuredImageAlt,
  onChangeFeaturedImageAlt,
  isFeatured,
  onChangeIsFeatured,
  isPublished,
  onChangeIsPublished,
  publishedAt,
  metaTitle,
  onChangeMetaTitle,
  metaDescription,
  onChangeMetaDescription,
  translationGroupId,
  linkedTranslation,
  allBlogs,
  onLinkTranslation,
  onUnlinkTranslation,
  onCreateCounterpartDraft,
  isLinkingTranslation,
  isUnlinkingTranslation,
  isCreatingDraft,
  onGenerateAiBanner,
  isGeneratingBanner,
  isSaving,
  onSaveDraft,
  onPublish,
  onDeleteArticle,
  onInsertTemplate,
  blogCategories,
  authors,
}) => {
  // Accordion open/collapse states
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    publishing: true,
    translation: true,
    categoryAuthor: true,
    featuredImage: true,
    excerpt: false,
    seo: true,
    tools: false,
  });

  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [searchTranslationQuery, setSearchTranslationQuery] = useState('');
  const [selectedTranslationToLink, setSelectedTranslationToLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isEnglish = language === 'EN';
  const targetCounterpartLang: ArticleLanguage = isEnglish ? 'HI' : 'EN';
  const urlPrefix = isEnglish ? '/en/blogs/' : '/hi/blogs/';
  const fullPublicUrl = `https://www.cccguru.in${urlPrefix}${slug || 'article-slug'}`;

  // Filter eligible articles for translation linking
  const eligibleTranslations = allBlogs.filter(
    (b) =>
      b.language === targetCounterpartLang &&
      b.id !== id &&
      (!searchTranslationQuery ||
        b.title.toLowerCase().includes(searchTranslationQuery.toLowerCase()) ||
        b.slug.toLowerCase().includes(searchTranslationQuery.toLowerCase()))
  );

  const uploadAndSetImage = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const res = await uploadAssetToHygraph(file);
      onChangeFeaturedImage(res.url);
      if (!featuredImageAlt) {
        onChangeFeaturedImageAlt(title || file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      console.error('Featured image upload to Hygraph failed:', err);
      alert(`Image upload to Hygraph failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAndSetImage(file);
    e.target.value = '';
  };

  const handleDropImage = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await uploadAndSetImage(file);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullPublicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <aside className="fixed inset-y-0 right-0 z-50 lg:static lg:z-auto w-80 sm:w-96 flex-shrink-0 h-full bg-background-card border-l border-dark-border flex flex-col overflow-hidden shadow-2xl lg:shadow-none transition-all">
        {/* Top Header */}
        <div className="h-14 flex-shrink-0 px-5 border-b border-dark-border flex items-center justify-between bg-background-elevated/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Article Settings
            </span>
            <Badge variant={isEnglish ? 'primary' : 'success'} size="sm">
              {isEnglish ? 'EN' : 'HI'}
            </Badge>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-background-hover transition-colors"
            title="Collapse Settings Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Accordions */}
        <div className="flex-1 overflow-y-auto divide-y divide-dark-border/60 text-xs">
          {/* SECTION A: PUBLISHING */}
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('publishing')}
              className="w-full flex items-center justify-between text-left font-bold text-dark-text uppercase tracking-wider text-[11px] group"
            >
              <span className="flex items-center gap-2 text-white">
                <Clock className="w-3.5 h-3.5 text-lavender-400" />
                Publishing & Status
              </span>
              {openSections.publishing ? (
                <ChevronDown className="w-3.5 h-3.5 text-dark-muted group-hover:text-white" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-dark-muted group-hover:text-white" />
              )}
            </button>

            {openSections.publishing && (
              <div className="space-y-3 pt-1">
                {/* Status Switch */}
                <div className="p-3 rounded-xl bg-background-elevated border border-dark-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">Publication Status</p>
                      <p className="text-[11px] text-dark-muted">
                        {isPublished ? 'Visible on public site' : 'Saved in draft mode only'}
                      </p>
                    </div>
                    <Badge variant={isPublished ? 'success' : 'warning'} dot size="sm">
                      {isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onChangeIsPublished(false)}
                      className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        !isPublished
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-background-card border-dark-border text-dark-muted hover:text-white'
                      }`}
                    >
                      Draft Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeIsPublished(true)}
                      className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        isPublished
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-background-card border-dark-border text-dark-muted hover:text-white'
                      }`}
                    >
                      Publish Live
                    </button>
                  </div>
                </div>

                {/* Featured Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-background-elevated border border-dark-border">
                  <div className="flex items-center gap-2">
                    <Star
                      className={`w-4 h-4 ${isFeatured ? 'text-amber-400 fill-amber-400' : 'text-dark-muted'}`}
                    />
                    <div>
                      <p className="font-semibold text-white text-xs">Featured Article</p>
                      <p className="text-[10px] text-dark-muted">Pin to homepage banner carousel</p>
                    </div>
                  </div>
                  <Switch checked={isFeatured} onChange={onChangeIsFeatured} />
                </div>

                {/* Date info */}
                {publishedAt && (
                  <p className="text-[11px] text-dark-dim flex items-center gap-1.5 px-1 font-mono">
                    <Calendar className="w-3 h-3 text-dark-muted" />
                    Published: {new Date(publishedAt).toLocaleDateString()}
                  </p>
                )}

                {/* Quick Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs text-dark-muted hover:text-white"
                    onClick={onSaveDraft}
                    disabled={isSaving}
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="flex-1 text-xs font-bold"
                    onClick={onPublish}
                    isLoading={isSaving}
                    disabled={isSaving}
                  >
                    {isPublished ? 'Update Live' : 'Publish'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION B: LANGUAGE & TRANSLATION */}
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('translation')}
              className="w-full flex items-center justify-between text-left font-bold text-dark-text uppercase tracking-wider text-[11px] group"
            >
              <span className="flex items-center gap-2 text-white">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                Language & Translation
              </span>
              {openSections.translation ? (
                <ChevronDown className="w-3.5 h-3.5 text-dark-muted group-hover:text-white" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-dark-muted group-hover:text-white" />
              )}
            </button>

            {openSections.translation && (
              <div className="space-y-3 pt-1">
                {/* Language Switch */}
                <div>
                  <label className="block text-[11px] font-bold text-dark-muted uppercase mb-1.5">
                    Article Language
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onChangeLanguage('EN')}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        isEnglish
                          ? 'bg-blue-500/15 border-blue-500 text-white font-bold'
                          : 'bg-background-elevated border-dark-border text-dark-muted hover:text-white'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      <div>
                        <p className="text-xs">English</p>
                        <p className="text-[10px] text-dark-muted font-mono">/en/blogs/...</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onChangeLanguage('HI')}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        !isEnglish
                          ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold'
                          : 'bg-background-elevated border-dark-border text-dark-muted hover:text-white'
                      }`}
                    >
                      <Languages className="w-3.5 h-3.5 text-emerald-400" />
                      <div>
                        <p className="text-xs">हिन्दी</p>
                        <p className="text-[10px] text-dark-muted font-mono">/hi/blogs/...</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Translation Group ID */}
                {translationGroupId && (
                  <div className="p-2 rounded-lg bg-background-elevated border border-dark-border/80 text-[10px] font-mono text-dark-dim flex items-center justify-between">
                    <span className="text-dark-muted">Translation Group:</span>
                    <span className="text-lavender-400 font-semibold truncate max-w-[160px]">
                      {translationGroupId}
                    </span>
                  </div>
                )}

                {/* Linked Counterpart Card */}
                {linkedTranslation ? (
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-indigo-300 flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        Linked {isEnglish ? 'Hindi' : 'English'} Counterpart
                      </span>
                      <Badge
                        variant={linkedTranslation.is_published ? 'success' : 'warning'}
                        size="sm"
                      >
                        {linkedTranslation.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-white line-clamp-1">
                        {linkedTranslation.title}
                      </p>
                      <p className="text-[10px] font-mono text-dark-muted truncate">
                        {isEnglish ? '/hi/blogs/' : '/en/blogs/'}
                        {linkedTranslation.slug}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-indigo-500/20">
                      <a
                        href={`/blogs/edit/${linkedTranslation.id}`}
                        className="flex-1 py-1 px-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-[11px] font-medium text-center transition-colors"
                      >
                        Edit Counterpart
                      </a>
                      <button
                        type="button"
                        onClick={onUnlinkTranslation}
                        disabled={isUnlinkingTranslation}
                        className="py-1 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] transition-colors"
                        title="Disconnect translation link"
                      >
                        <Unlink2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-background-elevated border border-dark-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-dark-muted">
                        No {isEnglish ? 'Hindi' : 'English'} Translation Linked
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono">Unlinked</span>
                    </div>

                    {/* Create Counterpart Draft Button */}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs font-semibold"
                      onClick={onCreateCounterpartDraft}
                      isLoading={isCreatingDraft}
                      disabled={!isEditing || isCreatingDraft}
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1 text-lavender-400" />
                      Create {isEnglish ? 'Hindi' : 'English'} Draft
                    </Button>

                    {/* Link Existing Search */}
                    <div className="space-y-1.5 pt-1 border-t border-dark-border">
                      <label className="block text-[10px] font-bold text-dark-muted uppercase">
                        Or Link Existing Article
                      </label>
                      <input
                        type="text"
                        value={searchTranslationQuery}
                        onChange={(e) => setSearchTranslationQuery(e.target.value)}
                        placeholder={`Search ${isEnglish ? 'Hindi' : 'English'} articles...`}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background-card border border-dark-border text-xs text-white placeholder:text-dark-dim focus:outline-none focus:border-lavender-500"
                      />

                      {eligibleTranslations.length > 0 && (
                        <div className="max-h-28 overflow-y-auto space-y-1 rounded-lg bg-background-card border border-dark-border p-1">
                          {eligibleTranslations.slice(0, 5).map((trans) => (
                            <button
                              key={trans.id}
                              type="button"
                              onClick={() => setSelectedTranslationToLink(trans.id)}
                              className={`w-full text-left p-1.5 rounded text-[11px] truncate transition-colors ${
                                selectedTranslationToLink === trans.id
                                  ? 'bg-lavender-500/20 text-lavender-300 font-bold'
                                  : 'text-dark-muted hover:text-white hover:bg-white/5'
                              }`}
                            >
                              {trans.title}
                            </button>
                          ))}
                        </div>
                      )}

                      {selectedTranslationToLink && (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => onLinkTranslation(selectedTranslationToLink)}
                          isLoading={isLinkingTranslation}
                        >
                          <Link2 className="w-3.5 h-3.5 mr-1" />
                          Link Selected Article
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION C: CATEGORY & AUTHOR */}
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('categoryAuthor')}
              className="w-full flex items-center justify-between text-left font-bold text-dark-text uppercase tracking-wider text-[11px] group"
            >
              <span className="flex items-center gap-2 text-white">
                <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                Category & Author
              </span>
              {openSections.categoryAuthor ? (
                <ChevronDown className="w-3.5 h-3.5 text-dark-muted group-hover:text-white" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-dark-muted group-hover:text-white" />
              )}
            </button>

            {openSections.categoryAuthor && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-dark-muted uppercase mb-1">
                    Article Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => onChangeCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background-elevated border border-dark-border text-xs text-white focus:outline-none focus:border-lavender-500 transition-colors"
                  >
                    <option value="">Select Category...</option>
                    {blogCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title} {cat.hindi_title ? `(${cat.hindi_title})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-dark-muted uppercase mb-1">
                    Author
                  </label>
                  <select
                    value={authorId}
                    onChange={(e) => onChangeAuthorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background-elevated border border-dark-border text-xs text-white focus:outline-none focus:border-lavender-500 transition-colors"
                  >
                    <option value="">Select Author...</option>
                    {authors.map((auth) => (
                      <option key={auth.id} value={auth.id}>
                        {auth.name} {auth.role ? `(${auth.role})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* SECTION D: FEATURED IMAGE */}
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('featuredImage')}
              className="w-full flex items-center justify-between text-left font-bold text-dark-text uppercase tracking-wider text-[11px] group"
            >
              <span className="flex items-center gap-2 text-white">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                Featured Image & Banner
              </span>
              {openSections.featuredImage ? (
                <ChevronDown className="w-3.5 h-3.5 text-dark-muted group-hover:text-white" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-dark-muted group-hover:text-white" />
              )}
            </button>

            {openSections.featuredImage && (
              <div className="space-y-3 pt-1">
                {/* Image Preview */}
                {featuredImage ? (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden border border-dark-border aspect-video bg-black/40 group">
                      <img
                        src={featuredImage}
                        alt={featuredImageAlt || title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-emerald-500/30 text-[10px] text-emerald-300 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {featuredImage.includes('graphassets.com') ? 'Hygraph CDN' : 'External Asset'}
                      </div>
                      <button
                        type="button"
                        onClick={() => onChangeFeaturedImage('')}
                        className="absolute top-2 right-2 p-1 rounded-lg bg-black/70 hover:bg-rose-600 text-white transition-colors"
                        title="Remove featured image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={featuredImageAlt}
                      onChange={(e) => onChangeFeaturedImageAlt(e.target.value)}
                      placeholder="Image Alt text (Crucial for SEO)..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-background-elevated border border-dark-border text-xs text-white placeholder:text-dark-dim focus:outline-none focus:border-lavender-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Toggle upload vs URL */}
                    <div className="flex rounded-lg bg-background-elevated p-0.5 border border-dark-border">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('upload')}
                        className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all ${
                          imageInputMode === 'upload'
                            ? 'bg-lavender-500/20 text-lavender-300 border border-lavender-500/30'
                            : 'text-dark-muted hover:text-white'
                        }`}
                      >
                        Upload Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('url')}
                        className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all ${
                          imageInputMode === 'url'
                            ? 'bg-lavender-500/20 text-lavender-300 border border-lavender-500/30'
                            : 'text-dark-muted hover:text-white'
                        }`}
                      >
                        Image URL
                      </button>
                    </div>

                    {imageInputMode === 'upload' ? (
                      <label
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropImage}
                        className="border-2 border-dashed border-dark-border hover:border-lavender-500/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group bg-background-elevated/40"
                      >
                        <Upload className="w-5 h-5 text-dark-muted group-hover:text-lavender-400 mb-1" />
                        <span className="text-[11px] font-bold text-white">
                          {isUploadingImage ? 'Uploading to Hygraph CDN...' : 'Click or drop to upload banner'}
                        </span>
                        <span className="text-[10px] text-dark-dim mt-0.5">Direct to Hygraph CDN (WebP, PNG, JPG)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={isUploadingImage}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <input
                        type="text"
                        value={featuredImage}
                        onChange={(e) => onChangeFeaturedImage(e.target.value)}
                        placeholder="https://example.com/banner.jpg"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background-elevated border border-dark-border text-xs text-white placeholder:text-dark-dim focus:outline-none focus:border-lavender-500"
                      />
                    )}
                  </div>
                )}

                {/* AI Banner Generator Button */}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs border-lavender-500/30 text-lavender-300 hover:bg-lavender-500/10"
                  onClick={onGenerateAiBanner}
                  isLoading={isGeneratingBanner}
                  disabled={isGeneratingBanner}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-lavender-400" />
                  Generate AI 16:9 Banner
                </Button>
              </div>
            )}
          </div>

          {/* SECTION E: EXCERPT & SUMMARY */}
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('excerpt')}
              className="w-full flex items-center justify-between text-left font-bold text-dark-text uppercase tracking-wider text-[11px] group"
            >
              <span className="flex items-center gap-2 text-white">
                <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
                Excerpt & Summary
              </span>
              {openSections.excerpt ? (
                <ChevronDown className="w-3.5 h-3.5 text-dark-muted group-hover:text-white" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-dark-muted group-hover:text-white" />
              )}
            </button>

            {openSections.excerpt && (
              <div className="space-y-2 pt-1">
                <p className="text-[10px] text-dark-muted">
                  Used in blog archive listings, search snippet fallback, and social cards.
                </p>
                <textarea
                  rows={3}
                  value={excerpt}
                  onChange={(e) => onChangeExcerpt(e.target.value)}
                  placeholder="Provide a concise 1-2 sentence overview of this article..."
                  className="w-full px-3 py-2 rounded-xl bg-background-elevated border border-dark-border text-xs text-white placeholder:text-dark-dim focus:outline-none focus:border-lavender-500 resize-none leading-relaxed"
                />
                <div className="text-right text-[10px] text-dark-dim font-mono">
                  {excerpt.length} characters
                </div>
              </div>
            )}
          </div>

          {/* SECTION F: SEO SETTINGS */}
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('seo')}
              className="w-full flex items-center justify-between text-left font-bold text-dark-text uppercase tracking-wider text-[11px] group"
            >
              <span className="flex items-center gap-2 text-white">
                <Search className="w-3.5 h-3.5 text-lavender-400" />
                SEO & Technical Metadata
              </span>
              {openSections.seo ? (
                <ChevronDown className="w-3.5 h-3.5 text-dark-muted group-hover:text-white" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-dark-muted group-hover:text-white" />
              )}
            </button>

            {openSections.seo && (
              <div className="space-y-3 pt-1">
                {/* URL Slug */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-dark-muted uppercase">
                      URL Slug *
                    </label>
                    <button
                      type="button"
                      onClick={onAutoGenerateSlug}
                      className="text-[10px] text-lavender-400 hover:text-lavender-300 flex items-center gap-1 font-mono"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      Auto-Slug
                    </button>
                  </div>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => onChangeSlug(e.target.value)}
                    placeholder="my-article-slug"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-background-elevated border border-dark-border text-xs font-mono text-white placeholder:text-dark-dim focus:outline-none focus:border-lavender-500"
                  />
                </div>

                {/* Meta Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-dark-muted uppercase">
                      SEO Meta Title
                    </label>
                    <span
                      className={`text-[10px] font-mono ${
                        metaTitle.length > 60 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {metaTitle.length}/60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => onChangeMetaTitle(e.target.value)}
                    placeholder={title || 'Primary search title'}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-background-elevated border border-dark-border text-xs text-white placeholder:text-dark-dim focus:outline-none focus:border-lavender-500"
                  />
                </div>

                {/* Meta Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-dark-muted uppercase">
                      Meta Description
                    </label>
                    <span
                      className={`text-[10px] font-mono ${
                        metaDescription.length > 160 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {metaDescription.length}/160
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={metaDescription}
                    onChange={(e) => onChangeMetaDescription(e.target.value)}
                    placeholder={excerpt || 'Brief search snippet summary...'}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-background-elevated border border-dark-border text-xs text-white placeholder:text-dark-dim focus:outline-none focus:border-lavender-500 resize-none leading-relaxed"
                  />
                </div>

                {/* Google SERP Snippet Preview */}
                <div className="p-3 rounded-xl bg-slate-900 border border-dark-border space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[9px]">
                      G
                    </span>
                    <span className="truncate">cccguru.in {urlPrefix.replace(/\/$/, '')}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-blue-400 hover:underline line-clamp-1">
                    {metaTitle || title || 'Article Title'}
                  </h4>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {metaDescription || excerpt || 'Article description will appear in Google search results.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION G: ARTICLE TOOLS */}
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('tools')}
              className="w-full flex items-center justify-between text-left font-bold text-dark-text uppercase tracking-wider text-[11px] group"
            >
              <span className="flex items-center gap-2 text-white">
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                Article Tools & Actions
              </span>
              {openSections.tools ? (
                <ChevronDown className="w-3.5 h-3.5 text-dark-muted group-hover:text-white" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-dark-muted group-hover:text-white" />
              )}
            </button>

            {openSections.tools && (
              <div className="space-y-2 pt-1">
                {/* Copy Public Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-background-elevated hover:bg-white/5 border border-dark-border text-dark-text transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5 text-blue-400" />
                    <span>Copy Canonical Link</span>
                  </span>
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] text-dark-dim font-mono">/en or /hi</span>
                  )}
                </button>

                {/* View on Live Website */}
                <a
                  href={fullPublicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-background-elevated hover:bg-white/5 border border-dark-border text-dark-text transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-lavender-400" />
                    <span>Open on Public Site</span>
                  </span>
                  <span className="text-[10px] text-dark-dim">↗</span>
                </a>

                {/* Insert Templates */}
                {onInsertTemplate && (
                  <div className="pt-2 border-t border-dark-border/60 space-y-1.5">
                    <p className="text-[10px] font-bold text-dark-muted uppercase">
                      Insert Quick Snippets
                    </p>
                    <button
                      type="button"
                      onClick={() => onInsertTemplate('faq')}
                      className="w-full text-left p-1.5 rounded-lg bg-background-elevated hover:bg-white/5 text-dark-text text-[11px] transition-colors"
                    >
                      ❓ FAQ Schema Section
                    </button>
                    <button
                      type="button"
                      onClick={() => onInsertTemplate('practice_table')}
                      className="w-full text-left p-1.5 rounded-lg bg-background-elevated hover:bg-white/5 text-dark-text text-[11px] transition-colors"
                    >
                      📊 Practice Questions Table
                    </button>
                    <button
                      type="button"
                      onClick={() => onInsertTemplate('pro_tip')}
                      className="w-full text-left p-1.5 rounded-lg bg-background-elevated hover:bg-white/5 text-dark-text text-[11px] transition-colors"
                    >
                      💡 Pro-Tip Strategy Box
                    </button>
                  </div>
                )}

                {/* Delete Article */}
                {onDeleteArticle && isEditing && (
                  <div className="pt-2 border-t border-dark-border/60">
                    <button
                      type="button"
                      onClick={onDeleteArticle}
                      className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Article</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
