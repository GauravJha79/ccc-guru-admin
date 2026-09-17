import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Key,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Filter,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../contexts/ToastContext';
import {
  Chapter,
  TestSeriesItem,
  Question,
  DifficultyLevel,
  QuestionType,
  CorrectOption,
} from '../../types/database';
import {
  geminiService,
  GeneratedQuestionItem,
  getGeminiApiKey,
  setStoredGeminiApiKey,
  GEMINI_MODEL_OPTIONS,
  isDuplicateQuestion,
} from '../../services/geminiService';
import { questionService } from '../../services/questionService';

interface AiQuestionGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  testSeriesItems: TestSeriesItem[];
  defaultTestItemId?: string;
  onSuccess: (newQuestions: Question[]) => void;
}

export const AiQuestionGenerateModal: React.FC<AiQuestionGenerateModalProps> = ({
  isOpen,
  onClose,
  chapters,
  testSeriesItems,
  defaultTestItemId,
  onSuccess,
}) => {
  const { success, error: toastError } = useToast();

  // API Key management
  const [apiKey, setApiKey] = useState(getGeminiApiKey());
  const [showKeyInput, setShowKeyInput] = useState(!getGeminiApiKey());
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const hasEnvKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

  // Configuration Form State
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>(
    defaultTestItemId ? [defaultTestItemId] : []
  );
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'Mixed'>('Medium');
  const [totalCount, setTotalCount] = useState<number>(10);
  const [mcqCount, setMcqCount] = useState<number>(8);
  const [trueFalseCount, setTrueFalseCount] = useState<number>(2);
  const [source, setSource] = useState('NIELIT CCC 2026');
  const [customInstructions, setCustomInstructions] = useState('');

  // Generation & Review State
  const [step, setStep] = useState<'config' | 'generating' | 'review'>('config');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestionItem[]>([]);
  const [batchProgress, setBatchProgress] = useState<{
    currentBatch: number;
    totalBatches: number;
    generatedSoFar: number;
    targetTotal: number;
  } | null>(null);
  const [existingDbQuestions, setExistingDbQuestions] = useState<Question[]>([]);
  const [duplicateIndices, setDuplicateIndices] = useState<number[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<{ [key: number]: boolean }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (defaultTestItemId && !selectedTestIds.includes(defaultTestItemId)) {
      setSelectedTestIds([defaultTestItemId]);
    }
  }, [defaultTestItemId]);

  useEffect(() => {
    if (isOpen) {
      questionService
        .getQuestions()
        .then((qs) => {
          setExistingDbQuestions(qs || []);
        })
        .catch((e) => console.warn('Could not preload database questions for deduplication:', e));
    }
  }, [isOpen]);

  // Adjust MCQ / TF counts when total changes (supporting up to 100 questions)
  const handleTotalCountPreset = (count: number) => {
    setTotalCount(count);
    const tf = Math.max(1, Math.round(count * 0.2));
    const mcq = count - tf;
    setMcqCount(mcq);
    setTrueFalseCount(tf);
  };

  const handleMcqChange = (mcq: number) => {
    const validMcq = Math.max(0, Math.min(100, mcq));
    setMcqCount(validMcq);
    setTotalCount(validMcq + trueFalseCount);
  };

  const handleTrueFalseChange = (tf: number) => {
    const validTf = Math.max(0, Math.min(100, tf));
    setTrueFalseCount(validTf);
    setTotalCount(mcqCount + validTf);
  };

  const handleDistributionPreset = (type: 'mostly_mcq' | 'equal' | 'only_mcq' | 'only_tf') => {
    if (type === 'only_mcq') {
      setMcqCount(totalCount);
      setTrueFalseCount(0);
    } else if (type === 'only_tf') {
      setMcqCount(0);
      setTrueFalseCount(totalCount);
    } else if (type === 'equal') {
      const half = Math.floor(totalCount / 2);
      setMcqCount(half);
      setTrueFalseCount(totalCount - half);
    } else if (type === 'mostly_mcq') {
      const tf = Math.max(1, Math.round(totalCount * 0.2));
      setMcqCount(totalCount - tf);
      setTrueFalseCount(tf);
    }
  };

  const handleToggleTestItem = (itemId: string) => {
    setSelectedTestIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSaveApiKey = () => {
    const clean = apiKey.trim();
    if (clean) {
      setStoredGeminiApiKey(clean);
      setShowKeyInput(false);
      setKeyTestResult(null);
      setGenerationError(null);
      success('API Key Stored', 'Gemini API Key saved for this session.');
    } else {
      toastError('API Key Missing', 'Please enter a valid Gemini API key.');
    }
  };

  const handleTestKeyConnection = async () => {
    const activeKey = (apiKey || getGeminiApiKey()).trim();
    if (!activeKey) {
      toastError('API Key Missing', 'Please enter an API key first to test.');
      return;
    }

    setIsTestingKey(true);
    setKeyTestResult(null);
    try {
      const res = await geminiService.testApiKey(activeKey);
      setKeyTestResult(res);
      if (res.success) {
        success('Key Verified', res.message);
        setGenerationError(null);
      } else {
        toastError('API Key Test Failed', res.message);
      }
    } catch (err: any) {
      setKeyTestResult({ success: false, message: err.message || 'Verification failed.' });
      toastError('Test Failed', err.message);
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleGenerate = async () => {
    const activeKey = (apiKey || getGeminiApiKey()).trim();
    if (!activeKey) {
      setShowKeyInput(true);
      setGenerationError('Gemini API Key is required. Please provide a key in the banner above or in your .env file.');
      toastError('API Key Required', 'Please enter a Google Gemini API Key to proceed.');
      return;
    }

    if (totalCount <= 0 || (mcqCount === 0 && trueFalseCount === 0)) {
      toastError('Invalid Count', 'Please specify at least 1 question to generate.');
      return;
    }

    const selectedChapter = chapters.find((c) => c.id === selectedChapterId);

    // Build anti-duplicate avoid list from existing DB questions
    const relevantDbQuestions = selectedChapterId
      ? existingDbQuestions.filter((q) => q.chapter_id === selectedChapterId)
      : existingDbQuestions;
    const existingStems = relevantDbQuestions
      .map((q) => q.question_en)
      .filter((s): s is string => Boolean(s && s.length > 5));

    setGenerationError(null);
    setIsGenerating(true);
    setBatchProgress(null);
    setStep('generating');

    try {
      const result = await geminiService.generateQuestionsInBatches(
        {
          chapterTitle: selectedChapter?.title,
          chapterHindiTitle: selectedChapter?.hindi_title,
          customTopic: customTopic.trim() || undefined,
          difficulty,
          mcqCount,
          trueFalseCount,
          customInstructions: customInstructions.trim() || undefined,
          existingQuestionsToAvoid: existingStems,
          apiKey: activeKey,
          model: selectedModel,
        },
        (prog) => setBatchProgress(prog)
      );

      if (!result || result.length === 0) {
        throw new Error('No questions generated. Please try again.');
      }

      // Check duplicates against existing DB questions
      const dupIndexes: number[] = [];
      result.forEach((generatedQ, idx) => {
        const isDup = existingDbQuestions.some((dbQ) => isDuplicateQuestion(dbQ, generatedQ));
        if (isDup) dupIndexes.push(idx);
      });

      setDuplicateIndices(dupIndexes);
      setGeneratedQuestions(result);
      setStep('review');

      if (dupIndexes.length > 0) {
        success(
          'Questions Generated',
          `Generated ${result.length} questions. (⚠️ ${dupIndexes.length} possible duplicate detected).`
        );
      } else {
        success('Questions Generated', `Successfully generated ${result.length} 100% unique questions!`);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to generate questions.';
      console.error('Question generation error:', err);
      setGenerationError(errMsg);
      toastError('AI Generation Error', errMsg);
      setStep('config');
    } finally {
      setIsGenerating(false);
      setBatchProgress(null);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    setGeneratedQuestions((prev) => prev.filter((_, i) => i !== index));
    setDuplicateIndices((prev) =>
      prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
    );
  };

  const handleRemoveDuplicates = () => {
    if (duplicateIndices.length === 0) return;
    setGeneratedQuestions((prev) => prev.filter((_, idx) => !duplicateIndices.includes(idx)));
    const removedCount = duplicateIndices.length;
    setDuplicateIndices([]);
    success('Duplicates Removed', `Filtered out ${removedCount} duplicate questions.`);
  };

  const handleUpdateGeneratedQuestion = (index: number, updated: Partial<GeneratedQuestionItem>) => {
    setGeneratedQuestions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updated } : item))
    );
  };

  const handleSaveToDatabase = async () => {
    if (generatedQuestions.length === 0) {
      toastError('No Questions', 'No questions available to save.');
      return;
    }

    setIsSaving(true);
    try {
      const payloads = generatedQuestions.map((q) => ({
        chapter_id: selectedChapterId || null,
        question_en: q.question_en,
        question_hi: q.question_hi,
        option_a_en: q.option_a_en,
        option_a_hi: q.option_a_hi,
        option_b_en: q.option_b_en,
        option_b_hi: q.option_b_hi,
        option_c_en: q.question_type === 'True/False' ? '' : q.option_c_en,
        option_c_hi: q.question_type === 'True/False' ? '' : q.option_c_hi,
        option_d_en: q.question_type === 'True/False' ? '' : q.option_d_en,
        option_d_hi: q.question_type === 'True/False' ? '' : q.option_d_hi,
        correct_option: q.correct_option,
        explanation_en: q.explanation_en || null,
        explanation_hi: q.explanation_hi || null,
        difficulty: q.difficulty,
        question_type: q.question_type,
        source: q.source || source,
        is_active: true,
        test_ids: selectedTestIds,
      }));

      const created = await questionService.createQuestionsBulk(payloads as any);

      success(
        'Questions Added to Database',
        `Successfully saved ${created.length} AI questions to Question Bank!`
      );
      onSuccess(created);
      handleResetAndClose();
    } catch (err: any) {
      toastError('Database Error', err.message || 'Failed to insert questions into Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAndClose = () => {
    setStep('config');
    setGeneratedQuestions([]);
    setEditingIndex(null);
    onClose();
  };

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);

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
              <span className="font-bold text-white text-base">Generate Questions with Gemini AI</span>
              <Badge variant="primary" size="sm">
                {selectedModel === 'auto' ? 'Auto Fallback' : selectedModel}
              </Badge>
            </div>
            <p className="text-xs text-dark-muted font-normal mt-0.5">
              Generate authentic bilingual (English & Hindi) CCC exam questions and save directly to Supabase
            </p>
          </div>
        </div>
      }
      footer={
        step === 'config' ? (
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-dark-muted flex items-center gap-1.5">
              <span>Selected Set:</span>
              <strong className="text-lavender-300 font-semibold">
                {selectedTestIds.length > 0
                  ? `${selectedTestIds.length} Test Set(s)`
                  : 'Question Bank Only'}
              </strong>
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
                Generate {totalCount} Questions
              </Button>
            </div>
          </div>
        ) : step === 'review' ? (
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-dark-muted">
              Ready to save:{' '}
              <strong className="text-emerald-400 font-bold">
                {generatedQuestions.length} Questions
              </strong>{' '}
              ({generatedQuestions.filter((q) => q.question_type === 'MCQ').length} MCQs,{' '}
              {generatedQuestions.filter((q) => q.question_type === 'True/False').length} True/False)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('config')}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Re-configure
              </Button>
              <Button
                onClick={handleSaveToDatabase}
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {isSaving
                  ? 'Saving to Database...'
                  : `Save All (${generatedQuestions.length}) to Database`}
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
            {/* Error Banner if Generation Failed */}
            {generationError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-200">
                        Question Generation Failed
                      </h4>
                      <p className="text-xs text-rose-300/90 mt-0.5 break-words font-mono">
                        {generationError}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGenerationError(null)}
                    className="text-xs text-rose-400 hover:text-white underline shrink-0"
                  >
                    Dismiss
                  </button>
                </div>

                {generationError.toLowerCase().includes('api key') && (
                  <div className="pt-2 border-t border-rose-500/20 text-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="text-rose-200 text-[11px]">
                      Tip: Google Gemini API keys start with <strong>AIzaSy...</strong>. Get a free key at Google AI Studio.
                    </span>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-lavender-300 hover:text-white underline font-semibold"
                    >
                      Open Google AI Studio ↗
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Gemini API Key & Model Banner */}
            <div className="p-3.5 rounded-2xl bg-background-elevated/60 border border-dark-border flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <Key className="w-4 h-4 text-lavender-400" />
                  <span className="font-semibold text-white">Gemini API Key:</span>
                  {hasEnvKey ? (
                    <Badge variant="success" size="sm" dot>
                      Configured in .env
                    </Badge>
                  ) : apiKey ? (
                    <Badge variant="success" size="sm" dot>
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="danger" size="sm" dot>
                      Key Missing
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-dark-muted font-medium">Model:</span>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="bg-background-subtle border border-dark-border text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-lavender-500 cursor-pointer"
                    >
                      {GEMINI_MODEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="text-xs text-lavender-400 hover:text-lavender-300 underline font-medium"
                  >
                    {showKeyInput ? 'Hide Key' : 'Change / Test Key'}
                  </button>
                </div>
              </div>

              {showKeyInput && (
                <div className="space-y-2 pt-1 border-t border-dark-border/50">
                  <div className="flex items-center gap-2">
                    <Input
                      type="password"
                      placeholder="Paste your Gemini API Key (starts with AIzaSy...)..."
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setKeyTestResult(null);
                      }}
                      className="text-xs flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleTestKeyConnection}
                      isLoading={isTestingKey}
                    >
                      Test Connection
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleSaveApiKey}>
                      Save Key
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-dark-muted">
                      Need an API key? Standard keys start with <code className="text-lavender-300">AIzaSy...</code>
                    </span>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lavender-400 hover:text-lavender-300 underline font-semibold"
                    >
                      Get Free Gemini API Key ↗
                    </a>
                  </div>

                  {keyTestResult && (
                    <div
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                        keyTestResult.success
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {keyTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>{keyTestResult.message}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Target Test Set Selection */}
            <div className="p-4 rounded-2xl bg-background-elevated/40 border border-dark-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-lavender-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-lavender-400">
                      Add to Test Series Item / Test Set
                    </span>
                  </div>
                  <p className="text-xs text-dark-muted mt-0.5">
                    Select which test sets will include these generated questions (
                    {selectedTestIds.length} selected)
                  </p>
                </div>
                {testSeriesItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTestIds(testSeriesItems.map((t) => t.id))}
                      className="text-xs text-lavender-400 hover:text-lavender-300 underline"
                    >
                      Select All
                    </button>
                    <span className="text-dark-dim">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTestIds([])}
                      className="text-xs text-dark-muted hover:text-white underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {testSeriesItems.length === 0 ? (
                <p className="text-xs text-dark-dim italic">
                  No test sets created yet. Questions will be added to the General Question Bank.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                  {testSeriesItems.map((item) => {
                    const isSelected = selectedTestIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleTestItem(item.id)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all ${
                          isSelected
                            ? 'bg-lavender-500/15 border-lavender-500/50 text-white shadow-sm'
                            : 'bg-background-subtle/50 border-dark-border text-dark-muted hover:border-dark-border/80 hover:text-dark-text'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 w-3.5 h-3.5 rounded text-lavender-500 cursor-pointer pointer-events-none"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate">{item.title}</div>
                          <div className="text-[10px] text-dark-dim flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 bg-dark-bg/60 rounded">
                              {item.test_type}
                            </span>
                            <span>•</span>
                            <span>{item.question_count} Qs</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chapter & Topic Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Syllabus Chapter (Optional)"
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                options={[
                  { value: '', label: '-- General / Full CCC Syllabus --' },
                  ...chapters.map((c) => ({
                    value: c.id,
                    label: `#${c.sort_order} ${c.title} (${c.hindi_title})`,
                  })),
                ]}
              />

              <Input
                label="Specific Topic / Focus Area (Optional)"
                placeholder="e.g. LibreOffice Calc Formulas, UPI & USSD, Ubuntu Commands"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
              />
            </div>

            {/* Difficulty & Presets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Difficulty Level"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                options={[
                  { value: 'Medium', label: 'Medium (Standard NIELIT Level)' },
                  { value: 'Easy', label: 'Easy (Basic & Fundamentals)' },
                  { value: 'Hard', label: 'Hard (In-depth & Advanced Shortcuts)' },
                  { value: 'Mixed', label: 'Mixed (Balanced Easy, Medium & Hard)' },
                ]}
              />

              <Input
                label="Exam / Source Tag"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. NIELIT CCC 2026"
              />
            </div>

            {/* Questions Count & Type Split */}
            <div className="p-4 rounded-2xl bg-background-elevated/40 border border-dark-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-lavender-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Question Count & Distribution
                    </span>
                  </div>
                  <p className="text-xs text-dark-muted mt-0.5">
                    Configure total questions and specify how many 4-Option MCQs and True/False questions
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {[10, 25, 50, 75, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleTotalCountPreset(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        totalCount === preset
                          ? 'bg-lavender-500 border-lavender-400 text-white shadow-sm'
                          : 'bg-background-subtle border-dark-border text-dark-muted hover:text-white'
                      }`}
                    >
                      {preset} Qs
                    </button>
                  ))}
                </div>
              </div>

              {/* Anti-Duplicate Active Banner */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-emerald-200">Anti-Duplicate Engine Active: </span>
                  <span className="text-emerald-300/90">
                    Cross-checking against {existingDbQuestions.length} existing database questions in real-time. Batched generation automatically feeds previous questions to prevent any duplicate repeats.
                  </span>
                </div>
              </div>

              {/* Sliders / Inputs for MCQ & True/False */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="p-3 rounded-xl bg-background border border-dark-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">4-Option MCQs</span>
                    <Badge variant="primary" size="sm">
                      {mcqCount}
                    </Badge>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={mcqCount}
                    onChange={(e) => handleMcqChange(parseInt(e.target.value, 10) || 0)}
                  />
                  <p className="text-[11px] text-dark-muted">A, B, C, D bilingual choices</p>
                </div>

                <div className="p-3 rounded-xl bg-background border border-dark-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">True / False</span>
                    <Badge variant="warning" size="sm">
                      {trueFalseCount}
                    </Badge>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={trueFalseCount}
                    onChange={(e) => handleTrueFalseChange(parseInt(e.target.value, 10) || 0)}
                  />
                  <p className="text-[11px] text-dark-muted">सत्य (True) / असत्य (False)</p>
                </div>

                <div className="p-3 rounded-xl bg-lavender-500/10 border border-lavender-500/30 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-lavender-400 tracking-wider">
                      Total Generated
                    </span>
                    <div className="text-2xl font-black text-white mt-1">
                      {totalCount}{' '}
                      <span className="text-xs font-normal text-lavender-300">
                        {totalCount > 25 ? `(${Math.ceil(totalCount / 25)} Batches)` : 'Questions'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-2">
                    <button
                      type="button"
                      onClick={() => handleDistributionPreset('mostly_mcq')}
                      className="px-2 py-0.5 rounded bg-background text-[10px] text-dark-muted hover:text-white border border-dark-border"
                    >
                      80/20 Split
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDistributionPreset('equal')}
                      className="px-2 py-0.5 rounded bg-background text-[10px] text-dark-muted hover:text-white border border-dark-border"
                    >
                      50/50 Split
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDistributionPreset('only_mcq')}
                      className="px-2 py-0.5 rounded bg-background text-[10px] text-dark-muted hover:text-white border border-dark-border"
                    >
                      Only MCQ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDistributionPreset('only_tf')}
                      className="px-2 py-0.5 rounded bg-background text-[10px] text-dark-muted hover:text-white border border-dark-border"
                    >
                      Only T/F
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Instructions Textarea */}
            <Textarea
              label="Custom Admin Instructions (Optional)"
              placeholder="e.g. Include questions on LibreOffice Calc shortcut keys like Ctrl+F2 (Function Wizard), LibreOffice Impress slide transition shortcuts, and Digital Payment questions regarding BHIM UPI daily transaction limits."
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
                {batchProgress
                  ? `Generating Batch ${batchProgress.currentBatch} of ${batchProgress.totalBatches}...`
                  : `Generating ${totalCount} Bilingual CCC Questions...`}
              </h3>
              <p className="text-xs text-dark-muted leading-relaxed">
                {batchProgress
                  ? `Generated ${batchProgress.generatedSoFar} of ${batchProgress.targetTotal} questions so far. Cross-checking avoid-list to eliminate duplicate questions.`
                  : 'Gemini AI is analyzing NIELIT curriculum guidelines, formulating questions with authentic Hindi translations, standardizing 4-option answers, and cross-checking against database questions.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-lavender-300 font-medium">
              <Sparkles className="w-4 h-4 animate-spin text-lavender-400" />
              <span>
                {batchProgress
                  ? `Processing Batch ${batchProgress.currentBatch}/${batchProgress.totalBatches} (${Math.round((batchProgress.generatedSoFar / batchProgress.targetTotal) * 100)}% complete)...`
                  : 'Formatting structured JSON schema output...'}
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & EDIT */}
        {step === 'review' && (
          <div className="space-y-4">
            {/* Duplicate Alert Banner */}
            {duplicateIndices.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold">
                      {duplicateIndices.length} Possible Duplicate(s) Found in Database
                    </span>
                    <p className="text-[11px] text-amber-300/80 mt-0.5">
                      Highlighted below with an amber border. You can remove them in 1 click or edit them.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleRemoveDuplicates}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  className="text-xs shrink-0"
                >
                  Remove Duplicates ({duplicateIndices.length})
                </Button>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-background-elevated/70 border border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={duplicateIndices.length > 0 ? 'warning' : 'success'} dot>
                  {generatedQuestions.length} Questions Generated
                </Badge>
                {duplicateIndices.length === 0 && (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>100% Unique - Zero Duplicates</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStep('config')}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Regenerate
                </Button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              {generatedQuestions.map((q, idx) => {
                const isEditing = editingIndex === idx;
                const isExpanded = expandedExplanations[idx] || false;

                const isDuplicate = duplicateIndices.includes(idx);

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isDuplicate
                        ? 'bg-amber-500/5 border-amber-500/40 shadow-sm'
                        : 'bg-background-elevated/40 border-dark-border/80 hover:border-dark-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-lavender-500/20 text-lavender-300 text-xs font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        {isDuplicate && (
                          <Badge variant="warning" size="sm">
                            ⚠️ In Database
                          </Badge>
                        )}
                        <Badge variant="primary" size="sm">
                          {q.question_type}
                        </Badge>
                        <Badge
                          size="sm"
                          variant={
                            q.difficulty === 'Easy'
                              ? 'success'
                              : q.difficulty === 'Medium'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {q.difficulty}
                        </Badge>
                        <Badge variant="neutral" size="sm">
                          Correct: {q.correct_option}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingIndex(isEditing ? null : idx)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isEditing
                              ? 'bg-lavender-500 text-white'
                              : 'text-dark-muted hover:text-lavender-300 hover:bg-lavender-500/10'
                          }`}
                          title={isEditing ? 'Done Editing' : 'Edit Question & Options'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="p-1.5 text-dark-muted hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Remove Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Editing Mode vs Preview Mode */}
                    {isEditing ? (
                      <div className="space-y-4 pt-1 bg-background-elevated/80 p-4 rounded-2xl border border-lavender-500/30">
                        {/* Question Text Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Textarea
                            label="Question (English)"
                            value={q.question_en}
                            onChange={(e) =>
                              handleUpdateGeneratedQuestion(idx, { question_en: e.target.value })
                            }
                            rows={2}
                          />
                          <Textarea
                            label="प्रश्न (Hindi)"
                            value={q.question_hi}
                            onChange={(e) =>
                              handleUpdateGeneratedQuestion(idx, { question_hi: e.target.value })
                            }
                            rows={2}
                          />
                        </div>

                        {/* Question Type & Difficulty Selectors */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Select
                            label="Question Type"
                            value={q.question_type}
                            onChange={(e) => {
                              const newType = e.target.value as QuestionType;
                              if (newType === 'True/False') {
                                handleUpdateGeneratedQuestion(idx, {
                                  question_type: newType,
                                  option_a_en: 'True',
                                  option_a_hi: 'सत्य (True)',
                                  option_b_en: 'False',
                                  option_b_hi: 'असत्य (False)',
                                  option_c_en: '',
                                  option_c_hi: '',
                                  option_d_en: '',
                                  option_d_hi: '',
                                  correct_option: q.correct_option === 'A' || q.correct_option === 'B' ? q.correct_option : 'A',
                                });
                              } else {
                                handleUpdateGeneratedQuestion(idx, { question_type: newType });
                              }
                            }}
                            options={[
                              { value: 'MCQ', label: '4-Option MCQ' },
                              { value: 'True/False', label: 'True / False' },
                            ]}
                          />

                          <Select
                            label="Difficulty"
                            value={q.difficulty}
                            onChange={(e) =>
                              handleUpdateGeneratedQuestion(idx, {
                                difficulty: e.target.value as DifficultyLevel,
                              })
                            }
                            options={[
                              { value: 'Easy', label: 'Easy' },
                              { value: 'Medium', label: 'Medium' },
                              { value: 'Hard', label: 'Hard' },
                            ]}
                          />

                          <Input
                            label="Source Tag"
                            value={q.source}
                            onChange={(e) =>
                              handleUpdateGeneratedQuestion(idx, { source: e.target.value })
                            }
                          />
                        </div>

                        {/* Bilingual Options & Radio Correct Answer Selector */}
                        <div className="space-y-3 p-3.5 rounded-xl bg-background border border-dark-border">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-lavender-300">
                              Options & Correct Answer
                            </span>
                            <span className="text-[11px] text-dark-muted">
                              Select the radio button for the correct option
                            </span>
                          </div>

                          {/* Option A */}
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`correct_opt_${idx}`}
                              checked={q.correct_option === 'A'}
                              onChange={() => handleUpdateGeneratedQuestion(idx, { correct_option: 'A' })}
                              className="w-4 h-4 text-emerald-500 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-white w-5">A:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                              <Input
                                placeholder="Option A (English)"
                                value={q.option_a_en}
                                onChange={(e) =>
                                  handleUpdateGeneratedQuestion(idx, { option_a_en: e.target.value })
                                }
                              />
                              <Input
                                placeholder="विकल्प A (Hindi)"
                                value={q.option_a_hi}
                                onChange={(e) =>
                                  handleUpdateGeneratedQuestion(idx, { option_a_hi: e.target.value })
                                }
                              />
                            </div>
                          </div>

                          {/* Option B */}
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`correct_opt_${idx}`}
                              checked={q.correct_option === 'B'}
                              onChange={() => handleUpdateGeneratedQuestion(idx, { correct_option: 'B' })}
                              className="w-4 h-4 text-emerald-500 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-white w-5">B:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                              <Input
                                placeholder="Option B (English)"
                                value={q.option_b_en}
                                onChange={(e) =>
                                  handleUpdateGeneratedQuestion(idx, { option_b_en: e.target.value })
                                }
                              />
                              <Input
                                placeholder="विकल्प B (Hindi)"
                                value={q.option_b_hi}
                                onChange={(e) =>
                                  handleUpdateGeneratedQuestion(idx, { option_b_hi: e.target.value })
                                }
                              />
                            </div>
                          </div>

                          {/* Option C & D for MCQ */}
                          {q.question_type === 'MCQ' && (
                            <>
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name={`correct_opt_${idx}`}
                                  checked={q.correct_option === 'C'}
                                  onChange={() => handleUpdateGeneratedQuestion(idx, { correct_option: 'C' })}
                                  className="w-4 h-4 text-emerald-500 cursor-pointer"
                                />
                                <span className="text-xs font-bold text-white w-5">C:</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                                  <Input
                                    placeholder="Option C (English)"
                                    value={q.option_c_en}
                                    onChange={(e) =>
                                      handleUpdateGeneratedQuestion(idx, { option_c_en: e.target.value })
                                    }
                                  />
                                  <Input
                                    placeholder="विकल्प C (Hindi)"
                                    value={q.option_c_hi}
                                    onChange={(e) =>
                                      handleUpdateGeneratedQuestion(idx, { option_c_hi: e.target.value })
                                    }
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name={`correct_opt_${idx}`}
                                  checked={q.correct_option === 'D'}
                                  onChange={() => handleUpdateGeneratedQuestion(idx, { correct_option: 'D' })}
                                  className="w-4 h-4 text-emerald-500 cursor-pointer"
                                />
                                <span className="text-xs font-bold text-white w-5">D:</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                                  <Input
                                    placeholder="Option D (English)"
                                    value={q.option_d_en}
                                    onChange={(e) =>
                                      handleUpdateGeneratedQuestion(idx, { option_d_en: e.target.value })
                                    }
                                  />
                                  <Input
                                    placeholder="विकल्प D (Hindi)"
                                    value={q.option_d_hi}
                                    onChange={(e) =>
                                      handleUpdateGeneratedQuestion(idx, { option_d_hi: e.target.value })
                                    }
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Explanations Editing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Textarea
                            label="Explanation (English)"
                            value={q.explanation_en}
                            onChange={(e) =>
                              handleUpdateGeneratedQuestion(idx, { explanation_en: e.target.value })
                            }
                            rows={2}
                          />
                          <Textarea
                            label="स्पष्टीकरण (Hindi)"
                            value={q.explanation_hi}
                            onChange={(e) =>
                              handleUpdateGeneratedQuestion(idx, { explanation_hi: e.target.value })
                            }
                            rows={2}
                          />
                        </div>

                        {/* Done Button */}
                        <div className="flex justify-end pt-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingIndex(null)}
                            leftIcon={<Check className="w-3.5 h-3.5 text-emerald-400" />}
                          >
                            Done Editing Question #{idx + 1}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Question Text Preview */}
                        <div className="space-y-1">
                          <p className="font-semibold text-white text-sm leading-snug">
                            {q.question_en}
                          </p>
                          <p className="text-xs text-lavender-300 font-medium">{q.question_hi}</p>
                        </div>

                        {/* Options Preview */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {(['A', 'B', 'C', 'D'] as CorrectOption[]).map((opt) => {
                            const optEn =
                              opt === 'A'
                                ? q.option_a_en
                                : opt === 'B'
                                ? q.option_b_en
                                : opt === 'C'
                                ? q.option_c_en
                                : q.option_d_en;
                            const optHi =
                              opt === 'A'
                                ? q.option_a_hi
                                : opt === 'B'
                                ? q.option_b_hi
                                : opt === 'C'
                                ? q.option_c_hi
                                : q.option_d_hi;

                            if (q.question_type === 'True/False' && (opt === 'C' || opt === 'D')) {
                              return null;
                            }

                            const isCorrect = q.correct_option === opt;

                            return (
                              <div
                                key={opt}
                                className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                                    : 'bg-background-subtle/50 border-dark-border text-dark-muted'
                                }`}
                              >
                                <span
                                  className={`w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-500 text-white shadow-sm'
                                      : 'bg-dark-bg text-dark-muted'
                                  }`}
                                >
                                  {opt}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-white truncate">{optEn}</div>
                                  {optHi && (
                                    <div className="text-[11px] text-lavender-300/80 truncate">
                                      {optHi}
                                    </div>
                                  )}
                                </div>
                                {isCorrect && (
                                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation Toggle */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedExplanations((prev) => ({
                                ...prev,
                                [idx]: !prev[idx],
                              }))
                            }
                            className="flex items-center gap-1.5 text-xs text-lavender-400 hover:text-lavender-300 font-medium"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span>{isExpanded ? 'Hide Explanation' : 'View Bilingual Explanation'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-3 rounded-xl bg-background border border-dark-border text-xs space-y-1.5">
                              <div>
                                <span className="font-semibold text-white">English: </span>
                                <span className="text-dark-muted">{q.explanation_en}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-lavender-300">Hindi: </span>
                                <span className="text-dark-muted">{q.explanation_hi}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
