import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Image as ImageIcon,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  Palette,
  Eye,
  FileText,
  Globe,
  Sliders,
  Layers,
  HelpCircle,
  Key,
  Check,
  RefreshCw,
  Camera,
  Cpu,
  Monitor,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Select } from '../../components/common/Select';
import { Switch } from '../../components/common/Switch';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../contexts/ToastContext';
import { Blog, BlogCategory } from '../../types/database';
import { blogService } from '../../services/blogService';
import {
  geminiBlogService,
  GeneratedBlogResult,
  BANNER_THEMES,
  BannerTheme,
  TopicSuggestion,
} from '../../services/geminiBlogService';
import { getGeminiApiKey, GEMINI_MODEL_OPTIONS } from '../../services/geminiService';

interface AiBlogGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: BlogCategory[];
  onSuccess?: (newBlog: Blog) => void;
  onApplyGenerated?: (
    generated: GeneratedBlogResult,
    thumbnailUrl: string,
    catId: string
  ) => void;
  authorName?: string;
}

export const AiBlogGenerateModal: React.FC<AiBlogGenerateModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSuccess,
  onApplyGenerated,
  authorName = 'CCC Prep Team',
}) => {
  const { success, error: toastError } = useToast();

  // Configuration Form State
  const [topic, setTopic] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [articleLength, setArticleLength] = useState<'Comprehensive' | 'Quick Revision' | 'Cheatsheet'>('Comprehensive');
  const [tone, setTone] = useState<'Educational' | 'Exam Focus' | 'Practical Guide'>('Exam Focus');
  const [thumbnailStyle, setThumbnailStyle] = useState<
    'student_portrait' | 'youtube_pro' | 'realistic_photo' | 'cyber_3d' | 'tech_illustration' | 'canvas_banner'
  >('student_portrait');
  const [selectedTheme, setSelectedTheme] = useState<BannerTheme>(BANNER_THEMES[0]);
  const [generateThumbnail, setGenerateThumbnail] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [author, setAuthor] = useState(authorName);
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedModel, setSelectedModel] = useState('auto');

  // AI Topic Suggestions State
  const [suggestedTopics, setSuggestedTopics] = useState<TopicSuggestion[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  // Generation & Review State
  const [step, setStep] = useState<'config' | 'generating' | 'review'>('config');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegeneratingThumbnail, setIsRegeneratingThumbnail] = useState(false);
  const [generatedBlog, setGeneratedBlog] = useState<GeneratedBlogResult | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string>('');
  const [thumbnailType, setThumbnailType] = useState<'nano_banana_realistic' | 'canvas_banner'>('nano_banana_realistic');
  const [persona, setPersona] = useState<
    'female_student' | 'male_student' | 'female_teacher' | 'male_instructor' | 'cyber_hacker' | 'exam_topper' | 'tech_minimalist'
  >('female_student');
  const [customThumbnailPrompt, setCustomThumbnailPrompt] = useState('');
  const [previewTab, setPreviewTab] = useState<'en' | 'hi' | 'meta'>('en');
  const [isSaving, setIsSaving] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const fetchAiSuggestions = async (catTitle?: string, isManualRefresh?: boolean) => {
    setIsLoadingTopics(true);
    try {
      const suggestions = await geminiBlogService.suggestTopicPresets(catTitle, 6);
      setSuggestedTopics(suggestions);
      if (isManualRefresh) {
        success('Fresh AI Ideas', 'Generated 6 new CCC exam topic suggestions.');
      }
    } catch (e: any) {
      console.warn('Failed to load dynamic suggestions:', e);
      if (isManualRefresh) {
        toastError('Refresh Failed', e.message || 'Could not fetch new topic ideas.');
      }
    } finally {
      setIsLoadingTopics(false);
    }
  };

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  useEffect(() => {
    if (isOpen && suggestedTopics.length === 0) {
      const currentCat = categories.find((c) => c.id === categoryId);
      fetchAiSuggestions(currentCat?.title);
    }
  }, [isOpen]);

  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    const cat = categories.find((c) => c.id === newCatId);
    fetchAiSuggestions(cat?.title);
  };

  const handleSelectPreset = (p: TopicSuggestion) => {
    setTopic(p.title);
    if (p.categoryHint) {
      const match = categories.find(
        (c) =>
          c.title.toLowerCase().includes(p.categoryHint.toLowerCase()) ||
          c.hindi_title.toLowerCase().includes(p.categoryHint.toLowerCase())
      );
      if (match) setCategoryId(match.id);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toastError('Topic Required', 'Please enter a topic or select an AI preset.');
      return;
    }

    const key = getGeminiApiKey();
    if (!key) {
      toastError('API Key Missing', 'Please configure your Gemini API Key in .env or settings.');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);

    setIsGenerating(true);
    setGenerationError(null);
    setStep('generating');

    try {
      // 1. Generate text content with Gemini
      const result = await geminiBlogService.generateBlogArticle({
        topic: topic.trim(),
        categoryTitle: selectedCategory?.title,
        articleLength,
        tone,
        thumbnailStyle,
        customInstructions: customInstructions.trim() || undefined,
        apiKey: key,
        model: selectedModel,
      });

      // 2. Generate professional realistic thumbnail (Nano Banana / Imagen or Canvas fallback)
      let thumbUrl = '';
      let thumbType: 'nano_banana_realistic' | 'canvas_banner' = 'nano_banana_realistic';

      if (generateThumbnail) {
        try {
          const thumbRes = await geminiBlogService.generateRealisticThumbnail({
            title: result.title_en,
            thumbnailPrompt: result.thumbnail_prompt,
            customPrompt: customThumbnailPrompt || undefined,
            categoryName: selectedCategory?.title || 'CCC Study Guide',
            style: thumbnailStyle,
            persona,
            theme: selectedTheme,
          });
          thumbUrl = thumbRes.url;
          thumbType = thumbRes.type;
        } catch (thumbErr) {
          console.warn('Thumbnail generation error:', thumbErr);
        }
      }

      setCustomThumbnailPrompt(result.thumbnail_prompt || '');
      setGeneratedBlog({ ...result, thumbnail_url: thumbUrl, thumbnail_type: thumbType });
      setThumbnailPreviewUrl(thumbUrl);
      setThumbnailType(thumbType);
      setStep('review');
      success('Blog & Thumbnail Generated', `"${result.title_en}" is ready for review!`);
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to generate blog article.';
      console.error('Blog generation error:', err);
      setGenerationError(errMsg);
      toastError('Generation Failed', errMsg);
      setStep('config');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateThumbnail = async (
    styleToUse: 'student_portrait' | 'youtube_pro' | 'realistic_photo' | 'cyber_3d' | 'tech_illustration' | 'canvas_banner',
    specificPersona?: 'female_student' | 'male_student' | 'female_teacher' | 'male_instructor' | 'cyber_hacker' | 'exam_topper' | 'tech_minimalist',
    overridePrompt?: string
  ) => {
    if (!generatedBlog) return;
    setIsRegeneratingThumbnail(true);
    if (specificPersona) setPersona(specificPersona);

    try {
      const selectedCategory = categories.find((c) => c.id === categoryId);
      const promptToUse = overridePrompt !== undefined ? overridePrompt : customThumbnailPrompt;
      const res = await geminiBlogService.generateRealisticThumbnail({
        title: generatedBlog.title_en,
        thumbnailPrompt: generatedBlog.thumbnail_prompt,
        customPrompt: promptToUse || undefined,
        categoryName: selectedCategory?.title || 'CCC Study Guide',
        style: styleToUse,
        persona: specificPersona || persona,
        theme: selectedTheme,
      });
      setThumbnailPreviewUrl(res.url);
      setThumbnailType(res.type);
      setGeneratedBlog((prev) => (prev ? { ...prev, thumbnail_url: res.url, thumbnail_type: res.type } : prev));
      success('Thumbnail Regenerated', `Created realistic ${specificPersona || styleToUse} image.`);
    } catch (e: any) {
      toastError('Thumbnail Failed', e.message || 'Could not regenerate thumbnail.');
    } finally {
      setIsRegeneratingThumbnail(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!generatedBlog) return;

    setIsSaving(true);
    try {
      const payload = {
        category_id: categoryId,
        title_en: generatedBlog.title_en,
        title_hi: generatedBlog.title_hi,
        slug: generatedBlog.slug,
        summary_en: generatedBlog.summary_en,
        summary_hi: generatedBlog.summary_hi,
        content_en: generatedBlog.content_en,
        content_hi: generatedBlog.content_hi,
        featured_image: thumbnailPreviewUrl || undefined,
        author: author.trim() || authorName,
        is_featured: isFeatured,
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : undefined,
      };

      const created = await blogService.createBlog(payload);
      success('Article Created', `Published "${created.title_en}"`);
      if (onSuccess) {
        onSuccess(created);
      }
      handleResetAndClose();
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not save article to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAndClose = () => {
    setStep('config');
    setGeneratedBlog(null);
    setThumbnailPreviewUrl('');
    setGenerationError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      size="2xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-lavender-600 to-indigo-500 text-white shadow-glow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">Generate Blog Article & Realistic Thumbnail</span>
              <Badge variant="primary" size="sm">
                Nano Banana & Gemini
              </Badge>
            </div>
            <p className="text-xs text-dark-muted font-normal mt-0.5">
              Auto-generate comprehensive bilingual CCC study guides and realistic, professional educational thumbnails
            </p>
          </div>
        </div>
      }
      footer={
        step === 'config' ? (
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-dark-muted flex items-center gap-2">
              <span>Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-background-subtle border border-dark-border text-white text-xs rounded-lg px-2 py-1"
              >
                {GEMINI_MODEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleResetAndClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                isLoading={isGenerating}
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="bg-gradient-to-r from-lavender-500 to-indigo-600 hover:from-lavender-600 hover:to-indigo-700 shadow-glow-sm"
              >
                Generate Article & Thumbnail
              </Button>
            </div>
          </div>
        ) : step === 'review' ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="text-xs text-dark-muted">
              Ready to save as:{' '}
              <strong className={isPublished ? 'text-emerald-400' : 'text-amber-400'}>
                {isPublished ? 'Published Article' : 'Draft Article'}
              </strong>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('config')}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Re-configure
              </Button>

              {onApplyGenerated && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (generatedBlog) {
                      onApplyGenerated(generatedBlog, thumbnailPreviewUrl, categoryId);
                      handleResetAndClose();
                    }
                  }}
                  className="border-lavender-500/30 text-lavender-200 hover:bg-lavender-500/20"
                >
                  <FileText className="w-4 h-4 mr-1.5 text-lavender-400" />
                  Apply to Editor Page
                </Button>
              )}

              <Button
                onClick={handleSaveToDatabase}
                isLoading={isSaving}
                size="sm"
                leftIcon={<Save className="w-4 h-4" />}
              >
                {isSaving ? 'Saving...' : 'Save Directly to DB'}
              </Button>
            </div>
          </div>
        ) : null
      }
    >
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* STEP 1: CONFIGURATION */}
        {step === 'config' && (
          <div className="space-y-5">
            {/* Error Banner */}
            {generationError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">Generation Failed: </span>
                  <span>{generationError}</span>
                </div>
              </div>
            )}

            {/* AI Suggested Topics Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-lavender-400" />
                  <span>Popular CCC Exam Topic Presets (Suggested by AI)</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const cat = categories.find((c) => c.id === categoryId);
                    fetchAiSuggestions(cat?.title, true);
                  }}
                  disabled={isLoadingTopics}
                  className="text-xs text-lavender-300 hover:text-lavender-200 flex items-center gap-1.5 px-2 py-0.5 rounded-lg hover:bg-lavender-500/10 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTopics ? 'animate-spin' : ''}`} />
                  <span>{isLoadingTopics ? 'Thinking...' : 'Refresh AI Ideas'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestedTopics.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="p-2.5 rounded-xl border border-dark-border/80 bg-background-elevated/40 hover:bg-lavender-500/10 hover:border-lavender-500/40 text-left text-xs transition-all flex items-start gap-2 group"
                  >
                    <span className="w-5 h-5 rounded-md bg-dark-border/60 group-hover:bg-lavender-500/20 text-[10px] font-bold flex items-center justify-center text-dark-muted group-hover:text-lavender-300 shrink-0 mt-0.5">
                      #{idx + 1}
                    </span>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <span className="text-dark-text group-hover:text-white font-medium line-clamp-2">
                        {p.title}
                      </span>
                      {p.description && (
                        <p className="text-[10px] text-dark-muted line-clamp-1">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Topic Input */}
            <Textarea
              label="Article Topic / Title"
              placeholder="e.g. Complete Guide to LibreOffice Calc Functions (SUM, AVERAGE, VLOOKUP) with Practice Exam Questions"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              required
            />

            {/* Category & Format Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Category"
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                options={categories.map((c) => ({
                  value: c.id,
                  label: `${c.title} (${c.hindi_title})`,
                }))}
              />

              <Select
                label="Article Length"
                value={articleLength}
                onChange={(e) => setArticleLength(e.target.value as any)}
                options={[
                  { value: 'Comprehensive', label: 'In-Depth Tutorial (~1000 words)' },
                  { value: 'Quick Revision', label: 'Quick Revision Notes (~600 words)' },
                  { value: 'Cheatsheet', label: 'Shortcut & Formula Cheatsheet' },
                ]}
              />

              <Select
                label="Tone & Focus"
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                options={[
                  { value: 'Exam Focus', label: 'NIELIT Exam Focus & MCQs' },
                  { value: 'Educational', label: 'Educational & Beginner Friendly' },
                  { value: 'Practical Guide', label: 'Step-by-Step Practical Guide' },
                ]}
              />
            </div>

            {/* Thumbnail Generator Style Selector */}
            <div className="p-4 rounded-2xl bg-background-elevated/40 border border-dark-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-lavender-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Nano Banana Realistic Thumbnail Generator
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-dark-muted">Generate Thumbnail:</span>
                  <input
                    type="checkbox"
                    checked={generateThumbnail}
                    onChange={(e) => setGenerateThumbnail(e.target.checked)}
                    className="w-4 h-4 rounded text-lavender-500 cursor-pointer"
                  />
                </div>
              </div>

              {generateThumbnail && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setThumbnailStyle('student_portrait')}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        thumbnailStyle === 'student_portrait'
                          ? 'border-lavender-500 bg-lavender-500/15 shadow-sm'
                          : 'border-dark-border bg-background-subtle/50 hover:border-dark-border/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Camera className="w-4 h-4 text-lavender-400" />
                        {thumbnailStyle === 'student_portrait' && <Check className="w-3.5 h-3.5 text-lavender-400" />}
                      </div>
                      <span className="text-xs font-bold text-white mt-1">🧑‍🎓 Student Portrait</span>
                      <span className="text-[10px] text-dark-muted">Indian student studying on laptop</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThumbnailStyle('youtube_pro')}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        thumbnailStyle === 'youtube_pro'
                          ? 'border-lavender-500 bg-lavender-500/15 shadow-sm'
                          : 'border-dark-border bg-background-subtle/50 hover:border-dark-border/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Sparkles className="w-4 h-4 text-pink-400" />
                        {thumbnailStyle === 'youtube_pro' && <Check className="w-3.5 h-3.5 text-pink-400" />}
                      </div>
                      <span className="text-xs font-bold text-white mt-1">🚀 YouTube Masterclass</span>
                      <span className="text-[10px] text-dark-muted">Educator in studio with holograms</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThumbnailStyle('realistic_photo')}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        thumbnailStyle === 'realistic_photo'
                          ? 'border-lavender-500 bg-lavender-500/15 shadow-sm'
                          : 'border-dark-border bg-background-subtle/50 hover:border-dark-border/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Monitor className="w-4 h-4 text-cyan-400" />
                        {thumbnailStyle === 'realistic_photo' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <span className="text-xs font-bold text-white mt-1">💻 Tech Workstation</span>
                      <span className="text-[10px] text-dark-muted">8K studio dual-screen desk</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThumbnailStyle('cyber_3d')}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        thumbnailStyle === 'cyber_3d'
                          ? 'border-lavender-500 bg-lavender-500/15 shadow-sm'
                          : 'border-dark-border bg-background-subtle/50 hover:border-dark-border/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Cpu className="w-4 h-4 text-emerald-400" />
                        {thumbnailStyle === 'cyber_3d' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <span className="text-xs font-bold text-white mt-1">⚡ Cyber 3D Render</span>
                      <span className="text-[10px] text-dark-muted">Holographic tech visuals</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThumbnailStyle('tech_illustration')}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        thumbnailStyle === 'tech_illustration'
                          ? 'border-lavender-500 bg-lavender-500/15 shadow-sm'
                          : 'border-dark-border bg-background-subtle/50 hover:border-dark-border/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Bot className="w-4 h-4 text-sky-400" />
                        {thumbnailStyle === 'tech_illustration' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                      <span className="text-xs font-bold text-white mt-1">🎨 Vector Graphic</span>
                      <span className="text-[10px] text-dark-muted">Modern flat tech artwork</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThumbnailStyle('canvas_banner')}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        thumbnailStyle === 'canvas_banner'
                          ? 'border-lavender-500 bg-lavender-500/15 shadow-sm'
                          : 'border-dark-border bg-background-subtle/50 hover:border-dark-border/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Palette className="w-4 h-4 text-amber-400" />
                        {thumbnailStyle === 'canvas_banner' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <span className="text-xs font-bold text-white mt-1">🖌️ Graphic Banner</span>
                      <span className="text-[10px] text-dark-muted">Gradient & typography</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Instructions & Author */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Author Name"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="CCC Prep Team"
              />

              <div className="flex items-center gap-6 pt-6">
                <Switch
                  checked={isPublished}
                  onChange={setIsPublished}
                  label="Publish Immediately"
                  description="Make article active on site"
                />
                <Switch
                  checked={isFeatured}
                  onChange={setIsFeatured}
                  label="Featured Article"
                  description="Highlight on home page"
                />
              </div>
            </div>

            <Textarea
              label="Custom Admin Instructions (Optional)"
              placeholder="e.g. Include 5 practice multiple choice questions at the end with solutions, highlight keyboard shortcuts in bold..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={2}
            />
          </div>
        )}

        {/* STEP 2: GENERATING ANIMATION */}
        {step === 'generating' && (
          <div className="py-16 px-4 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-lavender-500/20 animate-ping" />
              <div className="relative p-5 rounded-2xl bg-gradient-to-tr from-lavender-600 to-indigo-600 text-white shadow-glow">
                <Bot className="w-10 h-10 animate-bounce" />
              </div>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-white">
                Generating Full Bilingual Blog & Realistic Thumbnail...
              </h3>
              <p className="text-xs text-dark-muted leading-relaxed">
                Gemini AI is structuring educational sections, generating comprehensive English and Hindi
                Markdown articles, and Nano Banana is generating a realistic professional 16:9 thumbnail image.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-lavender-300 font-medium">
              <Sparkles className="w-4 h-4 animate-spin text-lavender-400" />
              <span>Generating bilingual study guide & realistic visual artwork...</span>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & LIVE PREVIEW */}
        {step === 'review' && generatedBlog && (
          <div className="space-y-5">
            {/* Generated Thumbnail Card */}
            {thumbnailPreviewUrl && (
              <div className="p-4 rounded-2xl bg-background-elevated/40 border border-dark-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <ImageIcon className="w-4 h-4 text-lavender-400" />
                    <span>Realistic 16:9 Thumbnail Artwork</span>
                    <Badge variant={thumbnailType === 'nano_banana_realistic' ? 'primary' : 'neutral'} size="sm">
                      {thumbnailType === 'nano_banana_realistic' ? 'Nano Banana Photorealistic' : 'Canvas Banner'}
                    </Badge>
                  </div>
                </div>

                {/* 1-Click Persona Archetype Switcher */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-dark-muted">
                    Switch Character Persona / Scene Style:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRegenerateThumbnail('student_portrait', 'female_student')}
                      disabled={isRegeneratingThumbnail}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium border border-dark-border bg-background-subtle/80 hover:bg-lavender-500/20 hover:border-lavender-500/50 text-white transition-all flex items-center gap-1.5"
                    >
                      <span>👩‍🎓 Female Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegenerateThumbnail('student_portrait', 'male_student')}
                      disabled={isRegeneratingThumbnail}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium border border-dark-border bg-background-subtle/80 hover:bg-lavender-500/20 hover:border-lavender-500/50 text-white transition-all flex items-center gap-1.5"
                    >
                      <span>👨‍🎓 Male Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegenerateThumbnail('student_portrait', 'female_teacher')}
                      disabled={isRegeneratingThumbnail}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium border border-dark-border bg-background-subtle/80 hover:bg-lavender-500/20 hover:border-lavender-500/50 text-white transition-all flex items-center gap-1.5"
                    >
                      <span>👩‍🏫 Teacher (Smart Board)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegenerateThumbnail('youtube_pro', 'male_instructor')}
                      disabled={isRegeneratingThumbnail}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium border border-dark-border bg-background-subtle/80 hover:bg-pink-500/20 hover:border-pink-500/50 text-white transition-all flex items-center gap-1.5"
                    >
                      <span>🚀 YouTube Masterclass</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegenerateThumbnail('student_portrait', 'exam_topper')}
                      disabled={isRegeneratingThumbnail}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium border border-dark-border bg-background-subtle/80 hover:bg-emerald-500/20 hover:border-emerald-500/50 text-white transition-all flex items-center gap-1.5"
                    >
                      <span>🏆 Exam Topper</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegenerateThumbnail('cyber_3d', 'cyber_hacker')}
                      disabled={isRegeneratingThumbnail}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium border border-dark-border bg-background-subtle/80 hover:bg-cyan-500/20 hover:border-cyan-500/50 text-white transition-all flex items-center gap-1.5"
                    >
                      <span>⚡ Cyber Tech 3D</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegenerateThumbnail('canvas_banner')}
                      disabled={isRegeneratingThumbnail}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium border border-dark-border bg-background-subtle/80 hover:bg-amber-500/20 hover:border-amber-500/50 text-white transition-all flex items-center gap-1.5"
                    >
                      <span>🖌️ Graphic Banner</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-dark-border/80 aspect-[16/9] max-h-64 bg-dark-bg relative group shadow-md">
                  <img
                    src={thumbnailPreviewUrl}
                    alt="Generated Blog Thumbnail"
                    className="w-full h-full object-cover"
                  />
                  {isRegeneratingThumbnail && (
                    <div className="absolute inset-0 bg-dark-bg/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-xs font-semibold text-lavender-300">
                      <Sparkles className="w-6 h-6 animate-spin text-lavender-400" />
                      <span>Synthesizing high-res realistic image...</span>
                    </div>
                  )}
                </div>

                {/* Editable Custom Image Prompt */}
                <div className="space-y-2 pt-1 border-t border-dark-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-dark-muted flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-lavender-400" />
                      <span>Custom Image Prompt (Edit to customize person, clothes, room, or props):</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customThumbnailPrompt}
                      onChange={(e) => setCustomThumbnailPrompt(e.target.value)}
                      placeholder="e.g. Indian female student with glasses studying LibreOffice Calc on MacBook, modern cozy room, soft warm lighting, 8k photo..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-background border border-dark-border text-white text-xs focus:border-lavender-500 focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleRegenerateThumbnail(thumbnailStyle, persona, customThumbnailPrompt)}
                      isLoading={isRegeneratingThumbnail}
                      leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                      className="text-xs shrink-0"
                    >
                      Generate from Prompt
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Title & Slug Header */}
            <div className="p-4 rounded-2xl bg-background-elevated/70 border border-dark-border space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-base leading-snug">
                    {generatedBlog.title_en}
                  </h3>
                  <p className="text-xs text-lavender-300 font-medium">{generatedBlog.title_hi}</p>
                </div>
                <Badge variant={isPublished ? 'success' : 'warning'} size="sm">
                  {isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-dark-muted pt-1 border-t border-dark-border/50">
                <span className="font-mono text-[11px] text-lavender-400">/{generatedBlog.slug}</span>
                <span>•</span>
                <span>Author: {author}</span>
                {generatedBlog.tags && generatedBlog.tags.length > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex flex-wrap gap-1">
                      {generatedBlog.tags.map((t, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-dark-bg text-[10px] text-dark-text">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Content Tabs (English / Hindi / Meta) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-1 bg-background-elevated/70 rounded-xl border border-dark-border">
                <button
                  type="button"
                  onClick={() => setPreviewTab('en')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    previewTab === 'en'
                      ? 'bg-lavender-500 text-white shadow-glow-sm'
                      : 'text-dark-muted hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>English Article ({generatedBlog.content_en.split(' ').length} words)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('hi')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    previewTab === 'hi'
                      ? 'bg-lavender-500 text-white shadow-glow-sm'
                      : 'text-dark-muted hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Hindi Article ({generatedBlog.content_hi.split(' ').length} words)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('meta')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    previewTab === 'meta'
                      ? 'bg-lavender-500 text-white shadow-glow-sm'
                      : 'text-dark-muted hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Summaries & Meta</span>
                </button>
              </div>

              {previewTab === 'en' && (
                <div className="space-y-2">
                  <div className="p-4 rounded-2xl bg-background border border-dark-border max-h-72 overflow-y-auto font-sans text-xs text-dark-text whitespace-pre-wrap leading-relaxed">
                    {generatedBlog.content_en}
                  </div>
                </div>
              )}

              {previewTab === 'hi' && (
                <div className="space-y-2">
                  <div className="p-4 rounded-2xl bg-background border border-dark-border max-h-72 overflow-y-auto font-sans text-xs text-dark-text whitespace-pre-wrap leading-relaxed">
                    {generatedBlog.content_hi}
                  </div>
                </div>
              )}

              {previewTab === 'meta' && (
                <div className="space-y-3 p-4 rounded-2xl bg-background border border-dark-border text-xs">
                  <div>
                    <span className="font-bold text-white">English Summary:</span>
                    <p className="text-dark-muted mt-0.5">{generatedBlog.summary_en}</p>
                  </div>
                  <div className="pt-2 border-t border-dark-border/50">
                    <span className="font-bold text-lavender-300">Hindi Summary:</span>
                    <p className="text-dark-muted mt-0.5">{generatedBlog.summary_hi}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
