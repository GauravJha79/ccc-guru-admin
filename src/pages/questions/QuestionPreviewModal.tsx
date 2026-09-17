import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  Save,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  Question,
  Chapter,
  CorrectOption,
  DifficultyLevel,
  QuestionType,
  TestSeriesItem,
} from '../../types/database';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Select } from '../../components/common/Select';
import { useToast } from '../../contexts/ToastContext';
import { questionService } from '../../services/questionService';
import { DIFFICULTY_OPTIONS } from '../../constants/config';

export interface QuestionPreviewModalProps {
  question: Question | null;
  questionsList?: Question[];
  chapters?: Chapter[];
  testSeriesItems?: TestSeriesItem[];
  isOpen: boolean;
  onClose: () => void;
  onQuestionChange?: (updated: Question) => void;
  onNavigate?: (nextQuestion: Question) => void;
}

export const QuestionPreviewModal: React.FC<QuestionPreviewModalProps> = ({
  question,
  questionsList = [],
  chapters = [],
  testSeriesItems = [],
  isOpen,
  onClose,
  onQuestionChange,
  onNavigate,
}) => {
  const { success, error: toastError } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable Form State
  const [chapterId, setChapterId] = useState('');
  const [questionEn, setQuestionEn] = useState('');
  const [questionHi, setQuestionHi] = useState('');
  const [optAEn, setOptAEn] = useState('');
  const [optAHi, setOptAHi] = useState('');
  const [optBEn, setOptBEn] = useState('');
  const [optBHi, setOptBHi] = useState('');
  const [optCEn, setOptCEn] = useState('');
  const [optCHi, setOptCHi] = useState('');
  const [optDEn, setOptDEn] = useState('');
  const [optDHi, setOptDHi] = useState('');
  const [correctOption, setCorrectOption] = useState<CorrectOption>('A');
  const [explanationEn, setExplanationEn] = useState('');
  const [explanationHi, setExplanationHi] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [questionType, setQuestionType] = useState<QuestionType>('MCQ');
  const [source, setSource] = useState('NIELIT 2026');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);

  // Synchronize form state whenever the active question changes
  useEffect(() => {
    if (question) {
      setChapterId(question.chapter_id || '');
      setQuestionEn(question.question_en || '');
      setQuestionHi(question.question_hi || '');
      setOptAEn(question.option_a_en || '');
      setOptAHi(question.option_a_hi || '');
      setOptBEn(question.option_b_en || '');
      setOptBHi(question.option_b_hi || '');
      setOptCEn(question.option_c_en || '');
      setOptCHi(question.option_c_hi || '');
      setOptDEn(question.option_d_en || '');
      setOptDHi(question.option_d_hi || '');
      setCorrectOption(question.correct_option || 'A');
      setExplanationEn(question.explanation_en || '');
      setExplanationHi(question.explanation_hi || '');
      setDifficulty(question.difficulty || 'Medium');
      setQuestionType(question.question_type || 'MCQ');
      setSource(question.source || 'NIELIT 2026');
      setSelectedTestIds(Array.isArray(question.test_ids) ? question.test_ids : []);
    }
  }, [question]);

  // Determine current index and navigation availability
  const currentIndex = question && questionsList.length > 0
    ? questionsList.findIndex((q) => q.id === question.id)
    : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < questionsList.length - 1;

  const handlePrevious = () => {
    if (hasPrevious && onNavigate) {
      onNavigate(questionsList[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(questionsList[currentIndex + 1]);
    }
  };

  // Keyboard navigation shortcuts (ArrowLeft / ArrowRight)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'ArrowLeft' && hasPrevious) {
        handlePrevious();
      } else if (e.key === 'ArrowRight' && hasNext) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, hasPrevious, hasNext]);

  if (!question) return null;

  const currentChapter = chapters.find((c) => c.id === (isEditing ? chapterId : question.chapter_id));
  const associatedTests = testSeriesItems.filter((t) =>
    (isEditing ? selectedTestIds : question.test_ids || []).includes(t.id)
  );

  const handleSaveQuestion = async () => {
    if (!questionEn.trim()) {
      toastError('Validation Error', 'English question cannot be empty.');
      return;
    }
    if (!questionHi.trim()) {
      toastError('Validation Error', 'Hindi question cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Question> = {
        chapter_id: chapterId || null,
        question_en: questionEn.trim(),
        question_hi: questionHi.trim(),
        option_a_en: questionType === 'True/False' ? 'True' : optAEn.trim(),
        option_a_hi: questionType === 'True/False' ? 'सत्य (True)' : optAHi.trim(),
        option_b_en: questionType === 'True/False' ? 'False' : optBEn.trim(),
        option_b_hi: questionType === 'True/False' ? 'असत्य (False)' : optBHi.trim(),
        option_c_en: questionType === 'True/False' ? '' : optCEn.trim(),
        option_c_hi: questionType === 'True/False' ? '' : optCHi.trim(),
        option_d_en: questionType === 'True/False' ? '' : optDEn.trim(),
        option_d_hi: questionType === 'True/False' ? '' : optDHi.trim(),
        correct_option: correctOption,
        explanation_en: explanationEn.trim() || undefined,
        explanation_hi: explanationHi.trim() || undefined,
        difficulty,
        question_type: questionType,
        source: source.trim() || 'NIELIT 2026',
        test_ids: selectedTestIds,
      };

      const updated = await questionService.updateQuestion(question.id, payload);
      if (onQuestionChange) {
        onQuestionChange(updated);
      }
      setIsEditing(false);
      success('Question Saved', 'Question updated successfully!');
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not update question.');
    } finally {
      setIsSaving(false);
    }
  };

  const options = [
    { key: 'A', en: question.option_a_en, hi: question.option_a_hi },
    { key: 'B', en: question.option_b_en, hi: question.option_b_hi },
    { key: 'C', en: question.option_c_en, hi: question.option_c_hi },
    { key: 'D', en: question.option_d_en, hi: question.option_d_hi },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full pr-6">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-white text-base">
              {isEditing ? 'Edit Question Details' : 'Question Bilingual Preview'}
            </span>
            {currentIndex !== -1 && (
              <Badge variant="neutral" size="sm">
                #{currentIndex + 1} of {questionsList.length}
              </Badge>
            )}
          </div>

          {/* Quick Navigation in Header */}
          {questionsList.length > 1 && (
            <div className="flex items-center gap-1.5 bg-background rounded-xl p-1 border border-dark-border">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={!hasPrevious}
                className="p-1 rounded-lg text-dark-muted hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-dark-border/50 transition-colors flex items-center gap-1 text-xs px-2"
                title="Previous Question (Arrow Left)"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <span className="text-dark-dim text-xs">|</span>
              <button
                type="button"
                onClick={handleNext}
                disabled={!hasNext}
                className="p-1 rounded-lg text-dark-muted hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-dark-border/50 transition-colors flex items-center gap-1 text-xs px-2"
                title="Next Question (Arrow Right)"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      }
      subtitle={`Source: ${question.source || 'Standard Bank'} • Difficulty: ${question.difficulty}`}
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-3">
          {/* Navigation Controls in Footer */}
          <div className="flex items-center gap-2">
            {questionsList.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={!hasPrevious}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={!hasNext}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel Edit
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveQuestion}
                  isLoading={isSaving}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5 text-lavender-400" />}
                >
                  Edit Question
                </Button>
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Close
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5 max-h-[72vh] overflow-y-auto pr-1">
        {/* VIEW MODE */}
        {!isEditing && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary">{question.question_type}</Badge>
                <Badge
                  variant={
                    question.difficulty === 'Easy'
                      ? 'success'
                      : question.difficulty === 'Medium'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {question.difficulty}
                </Badge>
                {currentChapter && (
                  <Badge variant="neutral" className="normal-case">
                    <BookOpen className="w-3 h-3 mr-1 text-lavender-400" />
                    {currentChapter.title}
                  </Badge>
                )}
                {associatedTests.length > 0 && (
                  <Badge variant="neutral" className="normal-case">
                    <Layers className="w-3 h-3 mr-1 text-emerald-400" />
                    {associatedTests.length} Test Set(s)
                  </Badge>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold text-lavender-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-lavender-500/10 hover:bg-lavender-500/20 border border-lavender-500/30 transition-all"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Inline</span>
              </button>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-background-elevated/70 border border-dark-border">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-dark-dim">
                  English Question
                </span>
                <p className="text-base font-semibold text-white mt-1 leading-relaxed">
                  {question.question_en}
                </p>
              </div>
              <div className="pt-2.5 border-t border-dark-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-lavender-400">
                  हिंदी प्रश्न
                </span>
                <p className="text-sm font-medium text-lavender-200 mt-1 leading-relaxed">
                  {question.question_hi}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-dark-muted">
                Options & Correct Answer
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {options.map((opt) => {
                  const isCorrect = question.correct_option === opt.key;
                  if (
                    question.question_type === 'True/False' &&
                    (opt.key === 'C' || opt.key === 'D')
                  ) {
                    return null;
                  }

                  return (
                    <div
                      key={opt.key}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                        isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)]'
                          : 'bg-background-elevated/40 border-dark-border'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-background-hover text-dark-muted'
                        }`}
                      >
                        {opt.key}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-semibold ${
                            isCorrect ? 'text-emerald-200' : 'text-white'
                          }`}
                        >
                          {opt.en}
                        </p>
                        {opt.hi && opt.hi !== opt.en && (
                          <p
                            className={`text-[11px] mt-0.5 ${
                              isCorrect ? 'text-emerald-300' : 'text-dark-muted'
                            }`}
                          >
                            {opt.hi}
                          </p>
                        )}
                      </div>
                      {isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {(question.explanation_en || question.explanation_hi) && (
              <div className="p-4 rounded-2xl bg-lavender-500/5 border border-lavender-500/20 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-lavender-400">
                  Solution & Detailed Explanation
                </span>
                {question.explanation_en && (
                  <p className="text-xs text-dark-text leading-relaxed">
                    <strong className="text-white">EN: </strong>
                    {question.explanation_en}
                  </p>
                )}
                {question.explanation_hi && (
                  <p className="text-xs text-lavender-200 leading-relaxed">
                    <strong className="text-lavender-400">HI: </strong>
                    {question.explanation_hi}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* EDIT MODE */}
        {isEditing && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-background-elevated/40 border border-dark-border">
              <Select
                label="Question Type"
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                options={[
                  { value: 'MCQ', label: '4-Option MCQ' },
                  { value: 'True/False', label: 'True / False' },
                ]}
              />
              <Select
                label="Difficulty Level"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                options={DIFFICULTY_OPTIONS}
              />
              <Select
                label="Syllabus Chapter"
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                options={[
                  { value: '', label: '-- General / Unassigned --' },
                  ...chapters.map((c) => ({ value: c.id, label: c.title })),
                ]}
              />
            </div>

            {/* Questions Textareas */}
            <div className="space-y-3 p-4 rounded-2xl bg-background-elevated/70 border border-dark-border">
              <Textarea
                label="Question (English) *"
                value={questionEn}
                onChange={(e) => setQuestionEn(e.target.value)}
                rows={2}
                placeholder="Type question in English..."
              />
              <Textarea
                label="प्रश्न (Hindi) *"
                value={questionHi}
                onChange={(e) => setQuestionHi(e.target.value)}
                rows={2}
                placeholder="यहाँ हिंदी में प्रश्न लिखें..."
              />
            </div>

            {/* Options Editor */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-dark-muted">
                Options & Correct Answer Selection:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option A */}
                <div
                  className={`p-3 rounded-xl border space-y-2 transition-all ${
                    correctOption === 'A'
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'bg-background-elevated/40 border-dark-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Option A</span>
                    <label className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="preview_correct_opt"
                        checked={correctOption === 'A'}
                        onChange={() => setCorrectOption('A')}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Correct</span>
                    </label>
                  </div>
                  <Input
                    placeholder="Option A (English)"
                    value={optAEn}
                    onChange={(e) => setOptAEn(e.target.value)}
                    disabled={questionType === 'True/False'}
                  />
                  <Input
                    placeholder="Option A (Hindi)"
                    value={optAHi}
                    onChange={(e) => setOptAHi(e.target.value)}
                    disabled={questionType === 'True/False'}
                  />
                </div>

                {/* Option B */}
                <div
                  className={`p-3 rounded-xl border space-y-2 transition-all ${
                    correctOption === 'B'
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'bg-background-elevated/40 border-dark-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Option B</span>
                    <label className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="preview_correct_opt"
                        checked={correctOption === 'B'}
                        onChange={() => setCorrectOption('B')}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Correct</span>
                    </label>
                  </div>
                  <Input
                    placeholder="Option B (English)"
                    value={optBEn}
                    onChange={(e) => setOptBEn(e.target.value)}
                    disabled={questionType === 'True/False'}
                  />
                  <Input
                    placeholder="Option B (Hindi)"
                    value={optBHi}
                    onChange={(e) => setOptBHi(e.target.value)}
                    disabled={questionType === 'True/False'}
                  />
                </div>

                {/* Option C */}
                {questionType === 'MCQ' && (
                  <div
                    className={`p-3 rounded-xl border space-y-2 transition-all ${
                      correctOption === 'C'
                        ? 'bg-emerald-500/10 border-emerald-500/50'
                        : 'bg-background-elevated/40 border-dark-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Option C</span>
                      <label className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="preview_correct_opt"
                          checked={correctOption === 'C'}
                          onChange={() => setCorrectOption('C')}
                          className="text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Correct</span>
                      </label>
                    </div>
                    <Input
                      placeholder="Option C (English)"
                      value={optCEn}
                      onChange={(e) => setOptCEn(e.target.value)}
                    />
                    <Input
                      placeholder="Option C (Hindi)"
                      value={optCHi}
                      onChange={(e) => setOptCHi(e.target.value)}
                    />
                  </div>
                )}

                {/* Option D */}
                {questionType === 'MCQ' && (
                  <div
                    className={`p-3 rounded-xl border space-y-2 transition-all ${
                      correctOption === 'D'
                        ? 'bg-emerald-500/10 border-emerald-500/50'
                        : 'bg-background-elevated/40 border-dark-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Option D</span>
                      <label className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="preview_correct_opt"
                          checked={correctOption === 'D'}
                          onChange={() => setCorrectOption('D')}
                          className="text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Correct</span>
                      </label>
                    </div>
                    <Input
                      placeholder="Option D (English)"
                      value={optDEn}
                      onChange={(e) => setOptDEn(e.target.value)}
                    />
                    <Input
                      placeholder="Option D (Hindi)"
                      value={optDHi}
                      onChange={(e) => setOptDHi(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Explanation Inputs */}
            <div className="space-y-3 p-4 rounded-2xl bg-lavender-500/5 border border-lavender-500/20">
              <span className="text-xs font-bold uppercase tracking-wider text-lavender-400">
                Detailed Solution & Explanation:
              </span>
              <Textarea
                label="Explanation (English)"
                value={explanationEn}
                onChange={(e) => setExplanationEn(e.target.value)}
                rows={2}
                placeholder="Explanation of the correct answer..."
              />
              <Textarea
                label="व्याख्या (Hindi)"
                value={explanationHi}
                onChange={(e) => setExplanationHi(e.target.value)}
                rows={2}
                placeholder="सही उत्तर की विस्तृत व्याख्या..."
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
