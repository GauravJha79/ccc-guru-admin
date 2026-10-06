import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  Key,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  HelpCircle,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Modal } from "../../components/common/Modal";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Select } from "../../components/common/Select";
import { Textarea } from "../../components/common/Textarea";
import { Badge } from "../../components/common/Badge";
import { useToast } from "../../contexts/ToastContext";
import {
  geminiTestSeriesService,
  GeneratedTestSeriesSeoResult,
} from "../../services/geminiTestSeriesService";
import {
  getGeminiApiKey,
  setStoredGeminiApiKey,
  GEMINI_MODEL_OPTIONS,
} from "../../services/geminiService";
import { TestCategory } from "../../types/database";

export interface AiTestSeriesSeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: TestCategory[];
  currentTitle?: string;
  currentCategoryId?: string;
  onApply: (generated: GeneratedTestSeriesSeoResult) => void;
}

export const AiTestSeriesSeoModal: React.FC<AiTestSeriesSeoModalProps> = ({
  isOpen,
  onClose,
  categories,
  currentTitle = "",
  currentCategoryId = "",
  onApply,
}) => {
  const { success, error: toastError } = useToast();

  const [title, setTitle] = useState(
    currentTitle || "CCC 2026 Ultimate Test Series",
  );
  const [categoryId, setCategoryId] = useState(
    currentCategoryId || categories[0]?.id || "",
  );
  const [focusTopics, setFocusTopics] = useState(
    "LibreOffice Writer, Calc & Impress, Computer Basics, Internet, UPI & Cyber Security",
  );
  const [tone, setTone] = useState<
    | "Comprehensive & Authoritative"
    | "Exam Strategy & High Yield"
    | "Bilingual Quick Pass Guide"
  >("Comprehensive & Authoritative");
  const [selectedModel, setSelectedModel] = useState("auto");
  const [customInstructions, setCustomInstructions] = useState("");

  const [apiKey, setApiKey] = useState(getGeminiApiKey());
  const [showKeyInput, setShowKeyInput] = useState(!getGeminiApiKey());

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewResult, setPreviewResult] =
    useState<GeneratedTestSeriesSeoResult | null>(null);

  // Sync props when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (currentTitle) setTitle(currentTitle);
      if (currentCategoryId) setCategoryId(currentCategoryId);
      setApiKey(getGeminiApiKey());
      setShowKeyInput(!getGeminiApiKey());
      setPreviewResult(null);
    }
  }, [isOpen, currentTitle, currentCategoryId]);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toastError("API Key Missing", "Please enter a valid Gemini API key.");
      return;
    }
    setStoredGeminiApiKey(apiKey.trim());
    setShowKeyInput(false);
    success("API Key Saved", "Gemini API key stored securely in your browser.");
  };

  const handleGenerate = async () => {
    const activeKey = apiKey.trim() || getGeminiApiKey();
    if (!activeKey) {
      setShowKeyInput(true);
      toastError(
        "API Key Required",
        "Please enter your Google Gemini API key to continue.",
      );
      return;
    }

    const selectedCat = categories.find((c) => c.id === categoryId);

    setIsGenerating(true);
    try {
      const result = await geminiTestSeriesService.generateSeoContent({
        title: title.trim(),
        categoryTitle: selectedCat?.title,
        focusTopics: focusTopics.trim(),
        tone,
        model: selectedModel,
        apiKey: activeKey,
        customInstructions: customInstructions.trim(),
      });

      setPreviewResult(result);
      success(
        "SEO Content Generated!",
        "Review the AI generated metadata & long markdown description below.",
      );
    } catch (err: any) {
      toastError(
        "Generation Failed",
        err.message || "Could not generate SEO content.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyAndClose = () => {
    if (!previewResult) return;
    onApply(previewResult);
    success(
      "Applied to Test Series",
      "SEO title, slug, summary and long description updated.",
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Generate SEO Description & Metadata with Gemini AI"
      subtitle="Automatically create high-ranking Google SEO descriptions, syllabus tables, FAQs, and slug"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          {previewResult ? (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setPreviewResult(null)}
                disabled={isGenerating}
              >
                Edit Prompt
              </Button>
              <Button
                onClick={handleApplyAndClose}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Apply to Test Series
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={isGenerating}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Generate SEO Package
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {/* API Key Banner */}
        {showKeyInput ? (
          <div className="p-4 rounded-2xl bg-lavender-500/10 border border-lavender-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lavender-300 font-semibold text-xs uppercase tracking-wider">
                <Key className="w-4 h-4" />
                <span>Gemini API Key Required</span>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-lavender-400 hover:text-lavender-200 flex items-center gap-1 underline"
              >
                <span>Get Free Key at Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="AIzaSy..."
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={handleSaveApiKey}>
                Save Key
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-background-elevated/40 border border-dark-border text-xs">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-medium text-white">Gemini AI Active</span>
              <Badge variant="success" size="sm">
                Connected
              </Badge>
            </div>
            <button
              type="button"
              onClick={() => setShowKeyInput(true)}
              className="text-dark-muted hover:text-lavender-300 text-xs underline"
            >
              Change Key
            </button>
          </div>
        )}

        {!previewResult ? (
          /* Input Configuration */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Target Test Series Title *"
                placeholder="e.g. CCC 2026 Ultimate Test Series"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Select
                label="Target Category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.title,
                }))}
              />
            </div>

            <Input
              label="Key Modules & Topics to Emphasize"
              placeholder="e.g. LibreOffice Writer, Calc, Impress, OS, Linux CLI, Cyber Security, Digital Payments"
              value={focusTopics}
              onChange={(e) => setFocusTopics(e.target.value)}
              helperText="Topics will be included in the structured markdown syllabus and weightage table."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Content Tone & Strategy"
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                options={[
                  {
                    value: "Comprehensive & Authoritative",
                    label: "Comprehensive & Authoritative (Top SEO Rank)",
                  },
                  {
                    value: "Exam Strategy & High Yield",
                    label: "Exam Strategy & High Yield Focus",
                  },
                  {
                    value: "Bilingual Quick Pass Guide",
                    label: "Bilingual Quick Pass Guide",
                  },
                ]}
              />

              <Select
                label="Gemini Model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                options={GEMINI_MODEL_OPTIONS}
              />
            </div>

            <Textarea
              label="Custom Instructions (Optional)"
              placeholder="e.g. Highlight that all test sets include Hindi solutions and latest LibreOffice 7+ interface questions..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={2}
            />
          </div>
        ) : (
          /* Preview Results */
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  AI Generation Successful
                </span>
                <p className="text-xs text-dark-muted mt-0.5">
                  Review the SEO title, slug, summary, and markdown description
                  before applying.
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleApplyAndClose}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Apply Content
              </Button>
            </div>

            {/* Generated Metadata Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-background-elevated/60 border border-dark-border space-y-1.5">
                <span className="text-[11px] font-semibold text-dark-muted uppercase">
                  SEO Title
                </span>
                <p className="text-sm font-bold text-white">
                  {previewResult.suggested_title}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-background-elevated/60 border border-dark-border space-y-1.5">
                <span className="text-[11px] font-semibold text-dark-muted uppercase">
                  URL Slug
                </span>
                <p className="text-xs font-mono text-lavender-300">
                  /{previewResult.slug}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-background-elevated/60 border border-dark-border space-y-1.5">
              <span className="text-[11px] font-semibold text-dark-muted uppercase">
                Short Meta Description (Card Summary)
              </span>
              <p className="text-xs text-dark-text leading-relaxed">
                {previewResult.short_description}
              </p>
            </div>

            {/* Target Keywords */}
            {previewResult.target_keywords &&
              previewResult.target_keywords.length > 0 && (
                <div className="p-3.5 rounded-xl bg-background-elevated/60 border border-dark-border space-y-2">
                  <span className="text-[11px] font-semibold text-dark-muted uppercase">
                    Target Search Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {previewResult.target_keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-lavender-500/10 text-lavender-300 border border-lavender-500/20"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Markdown Preview Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-dark-muted uppercase tracking-wider">
                  Full Markdown Content Preview
                </span>
                <span className="text-[11px] text-dark-dim font-mono">
                  {previewResult.description_md.length} characters
                </span>
              </div>
              <div className="p-4 max-h-[300px] overflow-y-auto rounded-xl bg-background-card border border-dark-border text-xs text-dark-text font-mono whitespace-pre-wrap leading-relaxed">
                {previewResult.description_md}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
