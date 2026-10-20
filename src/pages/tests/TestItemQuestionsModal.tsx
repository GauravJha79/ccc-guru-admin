import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileQuestion,
  Search,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { TestSeriesItem, Question } from '../../types/database';
import { questionService } from '../../services/questionService';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../contexts/ToastContext';
import { ROUTES } from '../../constants/routes';

interface TestItemQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  testItem: TestSeriesItem | null;
  onQuestionsUpdated?: () => void;
}

export const TestItemQuestionsModal: React.FC<TestItemQuestionsModalProps> = ({
  isOpen,
  onClose,
  testItem,
  onQuestionsUpdated,
}) => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'MCQ' | 'True/False'>('ALL');
  const [unlinkingQuestion, setUnlinkingQuestion] = useState<Question | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  useEffect(() => {
    if (isOpen && testItem) {
      loadQuestions(testItem.id);
    } else {
      setQuestions([]);
      setSearchQuery('');
      setTypeFilter('ALL');
    }
  }, [isOpen, testItem?.id]);

  const loadQuestions = async (itemId: string) => {
    setLoading(true);
    try {
      const data = await questionService.getQuestionsByTestItem(itemId);
      setQuestions(data);
    } catch (err: any) {
      toastError('Fetch Error', err.message || 'Could not load questions for this test set.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUnlink = async () => {
    if (!unlinkingQuestion || !testItem) return;
    setIsUnlinking(true);
    try {
      await questionService.removeQuestionFromTest(testItem.id, unlinkingQuestion.id);
      setQuestions((prev) => prev.filter((q) => q.id !== unlinkingQuestion.id));
      success('Question Unlinked', 'Removed question from this test set.');
      setUnlinkingQuestion(null);
      if (onQuestionsUpdated) {
        onQuestionsUpdated();
      }
    } catch (err: any) {
      toastError('Unlink Failed', err.message || 'Could not unlink question.');
    } finally {
      setIsUnlinking(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      q.question_en.toLowerCase().includes(query) ||
      q.question_hi.toLowerCase().includes(query) ||
      (q.source && q.source.toLowerCase().includes(query));

    const matchesType = typeFilter === 'ALL' || q.question_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (!testItem) return null;

  const targetCount = testItem.question_count || 0;
  const actualCount = questions.length;
  const isTargetMet = actualCount >= targetCount;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        title={
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-lavender-500/10 text-lavender-300 rounded-xl border border-lavender-500/20">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg">{testItem.title}</span>
                <Badge variant="neutral" size="sm">{testItem.test_type}</Badge>
              </div>
              <p className="text-xs text-dark-muted font-normal mt-0.5">
                Questions assigned to this test set in Supabase database
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-dark-muted">Status:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                  isTargetMet
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {actualCount} / {targetCount} Questions {isTargetMet ? '(Target Met)' : '(Target Incomplete)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  navigate(`${ROUTES.QUESTIONS}?testItemId=${testItem.id}`);
                }}
                leftIcon={<ExternalLink className="w-4 h-4" />}
              >
                Open in Question Bank
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 max-h-[70vh] flex flex-col">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-background-elevated/40 border border-dark-border rounded-xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
              <input
                type="text"
                placeholder="Search within this test set..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-background border border-dark-border rounded-lg text-sm text-white placeholder-dark-dim focus:outline-none focus:border-lavender-500/50"
              />
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setTypeFilter('ALL')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  typeFilter === 'ALL'
                    ? 'bg-lavender-500 text-white'
                    : 'bg-background-elevated text-dark-muted hover:text-white'
                }`}
              >
                All ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('MCQ')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  typeFilter === 'MCQ'
                    ? 'bg-lavender-500 text-white'
                    : 'bg-background-elevated text-dark-muted hover:text-white'
                }`}
              >
                MCQ ({questions.filter((q) => q.question_type === 'MCQ').length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('True/False')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  typeFilter === 'True/False'
                    ? 'bg-lavender-500 text-white'
                    : 'bg-background-elevated text-dark-muted hover:text-white'
                }`}
              >
                T/F ({questions.filter((q) => q.question_type === 'True/False').length})
              </button>
            </div>
          </div>

          {/* Question List Area */}
          <div className="overflow-y-auto space-y-3 pr-1 flex-1">
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-lavender-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-dark-muted">Loading assigned questions from database...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-background-elevated/20 border border-dark-border/60 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-2xl bg-lavender-500/10 border border-lavender-500/20 flex items-center justify-center text-lavender-400 mx-auto">
                  <FileQuestion className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">
                    {searchQuery ? 'No matching questions found' : 'No questions assigned yet'}
                  </h4>
                  <p className="text-xs text-dark-muted mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? 'Try clearing your search query to see all questions.'
                      : `This test set target is ${targetCount} questions, but no questions have been linked yet.`}
                  </p>
                </div>
                {!searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      navigate(`${ROUTES.QUESTIONS}?testItemId=${testItem.id}`);
                    }}
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Go to Question Bank to Link Questions
                  </Button>
                )}
              </div>
            ) : (
              filteredQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-background-card border border-dark-border hover:border-lavender-500/30 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-xs font-bold text-lavender-300 bg-lavender-500/10 px-2 py-0.5 rounded border border-lavender-500/20 shrink-0">
                        Q{idx + 1}
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm text-white font-medium leading-relaxed">
                          {q.question_en}
                        </p>
                        {q.question_hi && (
                          <p className="text-xs text-lavender-300 font-normal leading-relaxed">
                            {q.question_hi}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
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
                      <button
                        onClick={() => setUnlinkingQuestion(q)}
                        className="p-1.5 text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Unlink from this test set"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {[
                      { key: 'A', en: q.option_a_en, hi: q.option_a_hi },
                      { key: 'B', en: q.option_b_en, hi: q.option_b_hi },
                      ...(q.question_type !== 'True/False'
                        ? [
                            { key: 'C', en: q.option_c_en, hi: q.option_c_hi },
                            { key: 'D', en: q.option_d_en, hi: q.option_d_hi },
                          ]
                        : []),
                    ].map((opt) => {
                      const isCorrect = q.correct_option === opt.key;
                      return (
                        <div
                          key={opt.key}
                          className={`p-2 rounded-lg text-xs flex items-start gap-2 border transition-all ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold'
                              : 'bg-background-elevated/40 border-dark-border/80 text-dark-muted'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                              isCorrect
                                ? 'bg-emerald-500 text-dark-bg'
                                : 'bg-dark-border text-dark-text'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <div className="min-w-0">
                            <div>{opt.en}</div>
                            {opt.hi && opt.hi !== opt.en && (
                              <div className="text-[11px] opacity-80 mt-0.5">{opt.hi}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation (if any) */}
                  {(q.explanation_en || q.explanation_hi) && (
                    <div className="p-2.5 rounded-lg bg-background-elevated/30 border border-dark-border/60 text-xs text-dark-muted space-y-1">
                      <div className="flex items-center gap-1.5 text-lavender-300 font-medium text-[11px]">
                        <HelpCircle className="w-3 h-3" />
                        <span>Explanation:</span>
                      </div>
                      {q.explanation_en && <p>{q.explanation_en}</p>}
                      {q.explanation_hi && <p className="text-lavender-400">{q.explanation_hi}</p>}
                    </div>
                  )}

                  {/* Metadata Row */}
                  <div className="flex items-center justify-between text-[11px] text-dark-muted pt-1 border-t border-dark-border/40">
                    <span className="text-dark-dim">
                      Chapter: {q.chapter?.title || 'General'}
                    </span>
                    {q.source && (
                      <span className="font-mono text-dark-dim">Source: {q.source}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(unlinkingQuestion)}
        onClose={() => setUnlinkingQuestion(null)}
        onConfirm={handleConfirmUnlink}
        isLoading={isUnlinking}
        title="Unlink Question"
        message={`Are you sure you want to unlink this question from "${testItem.title}"? The question will remain in the general Question Bank.`}
      />
    </>
  );
};
