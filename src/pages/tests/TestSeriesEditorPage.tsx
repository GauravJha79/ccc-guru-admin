import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Sparkles,
  BookOpen,
  Globe,
  Tag,
  DollarSign,
  Layers,
  FileText,
  CheckCircle2,
  Eye,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  X,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { TestSeries, TestCategory } from "../../types/database";
import { testService } from "../../services/testService";
import { Input } from "../../components/common/Input";
import { Textarea } from "../../components/common/Textarea";
import { Select } from "../../components/common/Select";
import { Switch } from "../../components/common/Switch";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { FileUpload } from "../../components/common/FileUpload";
import { MDXEditorComponent } from "../../components/common/MDXEditorComponent";
import { APP_CONFIG } from "../../constants/config";
import { generateSlug, formatCurrency } from "../../lib/utils";
import { ROUTES } from "../../constants/routes";
import { AiTestSeriesSeoModal } from "./AiTestSeriesSeoModal";
import { GeneratedTestSeriesSeoResult } from "../../services/geminiTestSeriesService";

export const TestSeriesEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [allSeries, setAllSeries] = useState<TestSeries[]>([]);

  // Form State
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");
  const [description, setDescription] = useState("");
  const [descriptionMd, setDescriptionMd] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredTag, setFeaturedTag] = useState("");
  const [featuredShortDesc, setFeaturedShortDesc] = useState("");
  const [totalSets, setTotalSets] = useState(5);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState("INR");
  const [isActive, setIsActive] = useState(true);
  const [totalEnrolled, setTotalEnrolled] = useState(0);

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [cats, seriesList] = await Promise.all([
          testService.getCategories(),
          testService.getSeries(),
        ]);
        setCategories(cats);
        setAllSeries(seriesList);

        if (isEditing && id) {
          const item =
            seriesList.find((s) => s.id === id) ||
            (await testService.getSeriesById(id));
          if (item) {
            setCategoryId(item.category_id || "");
            setTitle(item.title);
            setSlug(item.slug || generateSlug(item.title));
            setFeaturedImage(item.featured_image || "");
            setDescription(item.description || "");
            setDescriptionMd(item.description_md || "");
            setIsFeatured(item.is_featured);
            setFeaturedTag(item.featured_tag || "");
            setFeaturedShortDesc(item.featured_short_desc || "");
            setTotalSets(item.total_sets_available ?? item.total_sets ?? 0);
            setIsPaid(item.is_paid);
            setPrice(item.price);
            setCurrency(item.currency || "INR");
            setIsActive(item.is_active ?? true);
            setTotalEnrolled(item.total_enrolled || 0);
          } else {
            toastError("Not Found", "Test series not found.");
            navigate(ROUTES.TEST_SERIES);
          }
        } else {
          // Default category for new series
          if (cats.length > 0) {
            setCategoryId(cats[0].id);
          }
          setFeaturedTag("RECOMMENDED");
        }
      } catch (err: any) {
        toastError("Fetch Error", err.message || "Could not load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditing, navigate]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      setSlug(generateSlug(val));
    }
  };

  const handleInsertSeoTemplate = () => {
    const currentTitle = title.trim() || "CCC 2026 Ultimate Test Series";
    const templateMarkdown = `# ${currentTitle} — Complete Preparation Guide & Syllabus

Pass the NIELIT CCC (Course on Computer Concepts) online examination on your first try with our expertly crafted test series.

## 🎯 Key Highlights & Features
- **100% Latest Syllabus Aligned:** Based strictly on the updated NIELIT CCC exam format.
- **Bilingual Solutions:** Complete question-by-question explanations in both English and Hindi.
- **Exam Interface Simulation:** 90-minute timer countdown and instant scorecards.
- **Comprehensive Coverage:** Special deep-dive sets on LibreOffice Writer, Calc, and Impress.

## 📋 Module & Topic-wise Syllabus Breakdown

| Module | Topic Coverage | Questions | Weightage |
| :--- | :--- | :--- | :--- |
| **Module 1** | Introduction to Computer, GUI, Windows & Linux Desktop | 15 Qs | 15% |
| **Module 2** | LibreOffice Writer (Word Processing & Mail Merge) | 20 Qs | 20% |
| **Module 3** | LibreOffice Calc (Spreadsheet formulas & Functions) | 15 Qs | 15% |
| **Module 4** | LibreOffice Impress (Presentation Design & Slides) | 10 Qs | 10% |
| **Module 5** | Internet, WWW, Web Browsers & Email Communication | 15 Qs | 15% |
| **Module 6** | Digital Financial Services, UPI, Net Banking & Cyber Security | 15 Qs | 15% |
| **Module 7** | Future Skills & Overview of Cyber Security Fundamentals | 10 Qs | 10% |

## 💡 Exam Strategy & Pass Criteria
> **Passing Score:** You need at least **50 marks out of 100** to qualify for NIELIT CCC certification. There is **no negative marking**, so make sure to attempt all 100 questions!

## ❓ Frequently Asked Questions (FAQs)

### What is the minimum score required to pass CCC?
Students must score at least 50% (50 marks out of 100) to receive a passing grade (Grade S, A, B, C, or D).

### Are these tests accessible on mobile devices?
Yes! You can take every test set seamlessly on mobile phones, tablets, or desktop web browsers with realtime syncing.`;

    setDescriptionMd(templateMarkdown);
    success(
      "SEO Template Inserted",
      "Rich SEO structure and syllabus table loaded into MDXEditor.",
    );
  };

  const handleApplyAiGenerated = (generated: GeneratedTestSeriesSeoResult) => {
    if (generated.suggested_title) setTitle(generated.suggested_title);
    if (generated.slug) setSlug(generated.slug);
    if (generated.short_description)
      setDescription(generated.short_description);
    if (generated.featured_tag) setFeaturedTag(generated.featured_tag);
    if (generated.featured_short_desc)
      setFeaturedShortDesc(generated.featured_short_desc);
    if (generated.description_md) setDescriptionMd(generated.description_md);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const errors: { [key: string]: string } = {};
    if (!title.trim()) errors.title = "Series title is required.";
    if (!slug.trim()) errors.slug = "SEO URL slug is required.";
    if (!categoryId) errors.categoryId = "Please select a test category.";
    if (isPaid && Number(price) <= 0) {
      errors.price = "Please enter a valid price for paid series.";
    }

    // Check slug uniqueness
    const normalizedSlug = slug.trim().toLowerCase();
    const slugExists = allSeries.some(
      (s) => s.slug === normalizedSlug && s.id !== id,
    );
    if (slugExists) {
      errors.slug =
        "This slug is already in use by another test series. Please choose a unique slug.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toastError(
        "Form Error",
        "Please correct the highlighted errors before saving.",
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        category_id: categoryId,
        title: title.trim(),
        slug: normalizedSlug,
        featured_image: featuredImage.trim() || null,
        description: description.trim() || null,
        description_md: descriptionMd.trim() || null,
        is_featured: isFeatured,
        featured_tag:
          isFeatured && featuredTag.trim() ? featuredTag.trim() : null,
        featured_short_desc:
          isFeatured && featuredShortDesc.trim()
            ? featuredShortDesc.trim()
            : null,
        total_sets_available: Number(totalSets),
        total_enrolled: totalEnrolled,
        is_paid: isPaid,
        price: isPaid ? Number(price) : 0,
        currency: currency || "INR",
        is_active: isActive,
      };

      if (isEditing && id) {
        await testService.updateSeries(id, payload);
        success("Test Series Saved", `Updated "${title}" successfully.`);
      } else {
        await testService.createSeries(payload);
        success("Test Series Created", `Created "${title}" successfully.`);
      }

      navigate(ROUTES.TEST_SERIES);
    } catch (err: any) {
      toastError("Save Failed", err.message || "Could not save test series.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-lavender-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-dark-muted">
            Loading test series studio...
          </p>
        </div>
      </div>
    );
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Action Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background-elevated/40 border border-dark-border p-4 sm:p-5 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(ROUTES.TEST_SERIES)}
            className="p-2 rounded-xl bg-background-card border border-dark-border text-dark-muted hover:text-white hover:border-lavender-500/50 transition-colors"
            title="Back to Test Series List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {isEditing
                  ? `Edit: ${title || "Test Series"}`
                  : "Create New Test Series"}
              </h1>
              <Badge variant={isActive ? "success" : "neutral"} dot>
                {isActive ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-xs text-dark-muted mt-0.5">
              Configure series details, SEO slug, pricing, and rich MDXEditor
              syllabus overview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(ROUTES.TEST_SERIES)}
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
            AI SEO Generator
          </Button>

          <Button
            onClick={() => handleSave()}
            isLoading={isSaving}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-1.5" />
            {isEditing ? "Save Changes" : "Publish Series"}
          </Button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left Column: Core SEO & MDXEditor Studio (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Series Information Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-background-card/90 border border-dark-border space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-dark-border/80 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-lavender-400" />
                Series Overview & SEO URLs
              </h2>
              <span className="text-[11px] text-dark-dim font-mono">
                Step 1 of 2
              </span>
            </div>

            <div className="space-y-4">
              <Input
                label="Series Title *"
                placeholder="e.g. CCC 2026 Ultimate Test Series (10 Full Mock Tests)"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                error={formErrors.title}
                helperText="Clear, keyword-rich title for student search appeal."
                required
              />

              <Input
                label="SEO URL Slug *"
                placeholder="e.g. ccc-2026-ultimate-test-series"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                  )
                }
                error={formErrors.slug}
                helperText="Permanent, readable URL slug used in routes (e.g. /tests/series/ccc-2026-ultimate-test-series)"
                required
              />

              <Textarea
                label="Short Card Summary / Meta Description"
                placeholder="Brief 2-sentence summary displayed on mobile cards and search result snippets..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                helperText="Recommended 120-160 characters for optimal search snippet display."
              />
            </div>
          </div>

          {/* Featured Cover Image Card (Dual Mode: Upload or URL) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-background-card/90 border border-dark-border space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-border/80 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-lavender-400" />
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Featured Cover Image
                  </h2>
                  <p className="text-xs text-dark-muted">
                    High-resolution banner/thumbnail displayed in mobile app & web cards
                  </p>
                </div>
              </div>

              {/* Mode Selector Tabs */}
              <div className="flex items-center bg-background rounded-xl p-1 border border-dark-border text-xs">
                <button
                  type="button"
                  onClick={() => setImageInputMode("upload")}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                    imageInputMode === "upload"
                      ? "bg-lavender-500 text-white shadow-sm"
                      : "text-dark-muted hover:text-white"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode("url")}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                    imageInputMode === "url"
                      ? "bg-lavender-500 text-white shadow-sm"
                      : "text-dark-muted hover:text-white"
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Paste Image URL</span>
                </button>
              </div>
            </div>

            {/* Upload Mode */}
            {imageInputMode === "upload" && (
              <FileUpload
                bucket={APP_CONFIG.STORAGE_BUCKETS.TEST_SERIES_IMAGES}
                type="image"
                accept="image/*"
                value={featuredImage}
                onChange={(url) => setFeaturedImage(url)}
                helperText="Upload image to Supabase Storage, or switch to 'Paste Image URL' for direct links."
              />
            )}

            {/* Direct URL Paste Mode */}
            {imageInputMode === "url" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste direct image URL e.g. https://images.unsplash.com/... or CDN link"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value.trim())}
                    className="flex-1"
                  />
                  {featuredImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeaturedImage("")}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                {/* Live Preview of Pasted URL */}
                {featuredImage && (
                  <div className="p-3 rounded-xl bg-background border border-dark-border/80 flex items-center gap-3">
                    <img
                      src={featuredImage}
                      alt="Preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/600x400/1e293b/94a3b8?text=Invalid+Image+URL";
                      }}
                      className="w-16 h-16 object-cover rounded-lg border border-lavender-500/30 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">
                        {featuredImage}
                      </p>
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

          {/* AI-Optimized MDXEditor Syllabus & Long Description Studio */}
          <div className="p-5 sm:p-6 rounded-2xl bg-background-card/90 border border-dark-border space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-border/80 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-lavender-400" />
                  Detailed SEO Description
                </h2>
                <p className="text-xs text-dark-muted mt-0.5">
                  Free & open-source markdown editor with live tables,
                  shortcuts, and source code diff view.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleInsertSeoTemplate}
                  className="text-xs text-lavender-300 hover:text-white bg-lavender-500/10 hover:bg-lavender-500/20 border border-lavender-500/20 py-1.5 h-8"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                  Load CCC Template
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAiModalOpen(true)}
                  className="text-xs bg-lavender-600/20 text-lavender-200 border-lavender-500/40 hover:bg-lavender-600/30 py-1.5 h-8"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-lavender-400" />
                  Generate with AI
                </Button>
              </div>
            </div>

            <MDXEditorComponent
              value={descriptionMd}
              onChange={setDescriptionMd}
              placeholder="Write rich markdown content for Google SEO ranking, including syllabus tables, exam highlights, and FAQs..."
              helperText="Rich formatted Markdown with headings, tables, bullet points, and FAQs enhances user engagement and organic SEO rankings."
              minHeight="350px"
            />
          </div>
        </div>

        {/* Right Column: Settings, Pricing & Live Google Preview (1 Col) */}
        <div className="space-y-6">
          {/* Publishing & Category Settings */}
          <div className="p-5 rounded-2xl bg-background-card/90 border border-dark-border space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-dark-border/80 pb-3">
              <Layers className="w-4 h-4 text-lavender-400" />
              Category & Status
            </h2>

            <Select
              label="Test Category *"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={categories.map((c) => ({
                value: c.id,
                label: c.title,
              }))}
              error={formErrors.categoryId}
              required
            />

            <Input
              label="Total Practice Sets"
              type="number"
              min={0}
              value={totalSets}
              onChange={(e) => setTotalSets(Number(e.target.value))}
              helperText="Automatically syncs as individual test sets are attached."
            />

            <div className="pt-2 border-t border-dark-border/60">
              <Switch
                checked={isActive}
                onChange={setIsActive}
                label="Published Status"
                description="When enabled, this series will immediately appear in the mobile app & web portal."
              />
            </div>
          </div>

          {/* Pricing Card */}
          <div className="p-5 rounded-2xl bg-background-card/90 border border-dark-border space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-dark-border/80 pb-3">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Pricing & Access
            </h2>

            <Switch
              checked={isPaid}
              onChange={setIsPaid}
              label="Paid Test Package"
              description="Enable if users must purchase this package."
            />

            {isPaid ? (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dark-border/60 animate-fadeIn">
                <Input
                  label="Price *"
                  type="number"
                  min={1}
                  step={1}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  error={formErrors.price}
                  required
                />
                <Select
                  label="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={[
                    { value: "INR", label: "INR (₹)" },
                    { value: "USD", label: "USD ($)" },
                  ]}
                />
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  This test series is configured as <strong>100% Free</strong>{" "}
                  for all students.
                </span>
              </div>
            )}
          </div>

          {/* Featured & Badges Card */}
          <div className="p-5 rounded-2xl bg-background-card/90 border border-dark-border space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-dark-border/80 pb-3">
              <Tag className="w-4 h-4 text-amber-400" />
              Featured Highlights
            </h2>

            <Switch
              checked={isFeatured}
              onChange={setIsFeatured}
              label="Feature on Home Screen"
              description="Prominently displays in the mobile app hero carousel."
            />

            {isFeatured && (
              <div className="space-y-3 pt-2 border-t border-dark-border/60 animate-fadeIn">
                <Input
                  label="Featured Badge Tag"
                  placeholder="e.g. MOST POPULAR / TOP RATED"
                  value={featuredTag}
                  onChange={(e) => setFeaturedTag(e.target.value)}
                />
                <Input
                  label="Featured Short Highlight"
                  placeholder="e.g. 1000+ Questions with timer & analytics"
                  value={featuredShortDesc}
                  onChange={(e) => setFeaturedShortDesc(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Live Google Search Snippet Preview */}
          <div className="p-5 rounded-2xl bg-background-card/90 border border-dark-border space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-dark-border/80 pb-2.5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-lavender-400" />
                Google SERP Snippet Preview
              </h2>
              <Badge variant="neutral" size="sm">
                Live SEO
              </Badge>
            </div>

            <div className="p-3.5 rounded-xl bg-background-elevated border border-dark-border space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-dark-muted font-sans truncate">
                <span className="text-white font-medium">cccprep.app</span>
                <span>›</span>
                <span className="text-dark-dim">tests</span>
                <span>›</span>
                <span className="text-lavender-400 font-mono">series</span>
                <span>›</span>
                <span className="text-lavender-400 font-mono truncate">
                  {slug || "your-slug-here"}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer truncate">
                {title || "CCC 2026 Test Series — Practice Online Mock Tests"}
              </h3>
              <p className="text-xs text-dark-muted line-clamp-2 leading-relaxed">
                {description ||
                  "Prepare for the NIELIT CCC exam with our comprehensive test series covering LibreOffice, OS, and digital financial services with bilingual solutions."}
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* AI SEO Generation Modal */}
      <AiTestSeriesSeoModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        categories={categories}
        currentTitle={title}
        currentCategoryId={categoryId}
        onApply={handleApplyAiGenerated}
      />
    </div>
  );
};
