import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Edit2, Trash2, Eye, Layers, Link2, Upload, Sparkles } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import {
  Question,
  Chapter,
  TestSeriesItem,
  TestQuestion,
  CorrectOption,
  DifficultyLevel,
  QuestionType,
} from "../../types/database";
import { questionService } from "../../services/questionService";
import { chapterService } from "../../services/chapterService";
import { testService } from "../../services/testService";
import { DataTable, Column } from "../../components/common/DataTable";
import { SearchFilterBar } from "../../components/common/SearchFilterBar";
import { Pagination } from "../../components/common/Pagination";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Input } from "../../components/common/Input";
import { Textarea } from "../../components/common/Textarea";
import { Select } from "../../components/common/Select";
import { Switch } from "../../components/common/Switch";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { QuestionPreviewModal } from "./QuestionPreviewModal";
import { QuestionAssignmentModal } from "./QuestionAssignmentModal";
import { BulkQuestionUploadModal } from "./BulkQuestionUploadModal";
import { AiQuestionGenerateModal } from "./AiQuestionGenerateModal";
import { DIFFICULTY_OPTIONS, APP_CONFIG } from "../../constants/config";

export const QuestionBankPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTestItemId = searchParams.get("testItemId") || "";

  const { success, error: toastError } = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [testSeriesItems, setTestSeriesItems] = useState<TestSeriesItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [testItemFilter, setTestItemFilter] = useState(initialTestItemId);
  const [statusFilter, setStatusFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_CONFIG.DEFAULT_PAGE_SIZE);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isAiGenerateModalOpen, setIsAiGenerateModalOpen] = useState(false);

  // Form Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form Fields
  const [chapterId, setChapterId] = useState("");
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [questionEn, setQuestionEn] = useState("");
  const [questionHi, setQuestionHi] = useState("");
  const [optAEn, setOptAEn] = useState("");
  const [optAHi, setOptAHi] = useState("");
  const [optBEn, setOptBEn] = useState("");
  const [optBHi, setOptBHi] = useState("");
  const [optCEn, setOptCEn] = useState("");
  const [optCHi, setOptCHi] = useState("");
  const [optDEn, setOptDEn] = useState("");
  const [optDHi, setOptDHi] = useState("");
  const [correctOption, setCorrectOption] = useState<CorrectOption>("A");
  const [explanationEn, setExplanationEn] = useState("");
  const [explanationHi, setExplanationHi] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Medium");
  const [questionType, setQuestionType] = useState<QuestionType>("MCQ");
  const [source, setSource] = useState("NIELIT 2026");
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [questionsData, chaptersData, itemsData] = await Promise.all([
        questionService.getQuestions(),
        chapterService.getChapters(),
        testService.getSeriesItems(),
      ]);
      setQuestions(questionsData);
      setChapters(chaptersData);
      setTestSeriesItems(itemsData);
    } catch (err: any) {
      toastError("Fetch Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (initialTestItemId) {
      setTestItemFilter(initialTestItemId);
    }
  }, [initialTestItemId]);

  const openCreateModal = () => {
    setEditingQuestion(null);
    setChapterId("");
    setSelectedTestIds(testItemFilter ? [testItemFilter] : []);
    setQuestionEn("");
    setQuestionHi("");
    setOptAEn("");
    setOptAHi("");
    setOptBEn("");
    setOptBHi("");
    setOptCEn("");
    setOptCHi("");
    setOptDEn("");
    setOptDHi("");
    setCorrectOption("A");
    setExplanationEn("");
    setExplanationHi("");
    setDifficulty("Medium");
    setQuestionType("MCQ");
    setSource("NIELIT 2026");
    setIsActive(true);
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setChapterId(q.chapter_id || "");
    setSelectedTestIds(Array.isArray(q.test_ids) ? q.test_ids : []);
    setQuestionEn(q.question_en);
    setQuestionHi(q.question_hi);
    setOptAEn(q.option_a_en);
    setOptAHi(q.option_a_hi);
    setOptBEn(q.option_b_en);
    setOptBHi(q.option_b_hi);
    setOptCEn(q.option_c_en);
    setOptCHi(q.option_c_hi);
    setOptDEn(q.option_d_en);
    setOptDHi(q.option_d_hi);
    setCorrectOption(q.correct_option);
    setExplanationEn(q.explanation_en || "");
    setExplanationHi(q.explanation_hi || "");
    setDifficulty(q.difficulty);
    setQuestionType(q.question_type);
    setSource(q.source || "");
    setIsActive(q.is_active);
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleToggleTestItemSelection = (itemId: string) => {
    setSelectedTestIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!questionEn.trim()) errors.questionEn = "English question is required.";
    if (!questionHi.trim()) errors.questionHi = "Hindi question is required.";
    if (!optAEn.trim()) errors.optAEn = "Option A is required.";
    if (!optBEn.trim()) errors.optBEn = "Option B is required.";

    if (questionType === "MCQ") {
      if (!optCEn.trim()) errors.optCEn = "Option C is required for MCQ.";
      if (!optDEn.trim()) errors.optDEn = "Option D is required for MCQ.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload: any = {
        chapter_id: chapterId || null,
        test_ids: selectedTestIds,
        question_en: questionEn.trim(),
        question_hi: questionHi.trim(),
        option_a_en: optAEn.trim(),
        option_a_hi: optAHi.trim() || optAEn.trim(),
        option_b_en: optBEn.trim(),
        option_b_hi: optBHi.trim() || optBEn.trim(),
        option_c_en: questionType === "True/False" ? "" : optCEn.trim(),
        option_c_hi:
          questionType === "True/False" ? "" : optCHi.trim() || optCEn.trim(),
        option_d_en: questionType === "True/False" ? "" : optDEn.trim(),
        option_d_hi:
          questionType === "True/False" ? "" : optDHi.trim() || optDEn.trim(),
        correct_option: correctOption,
        explanation_en: explanationEn.trim() || null,
        explanation_hi: explanationHi.trim() || null,
        difficulty,
        question_type: questionType,
        source: source.trim() || null,
        is_active: isActive,
      };

      if (editingQuestion) {
        const updated = await questionService.updateQuestion(
          editingQuestion.id,
          payload,
        );
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === editingQuestion.id ? { ...q, ...updated } : q,
          ),
        );
        success("Question Updated", "Bilingual question changes saved.");
      } else {
        const created = await questionService.createQuestion(payload);
        setQuestions((prev) => [created, ...prev]);
        success("Question Created", "New bilingual question added to bank.");
      }
      setIsFormModalOpen(false);
    } catch (err: any) {
      toastError("Save Failed", err.message || "Could not save question.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await questionService.deleteQuestion(deleteTarget.id);
      setQuestions((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      success("Question Deleted", "Question removed from question bank.");
      setDeleteTarget(null);
    } catch (err: any) {
      toastError("Delete Failed", err.message || "Could not delete question.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await questionService.deleteQuestionsBulk(selectedIds);
      const deletedSet = new Set(selectedIds);
      setQuestions((prev) => prev.filter((q) => !deletedSet.has(q.id)));
      success(
        "Questions Deleted",
        `Successfully deleted ${selectedIds.length} questions from Supabase.`
      );
      setSelectedIds([]);
      setIsBulkDeleteDialogOpen(false);
    } catch (err: any) {
      toastError("Bulk Delete Failed", err.message || "Could not delete selected questions.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleUnlinkFromCurrentSet = async (questionId: string) => {
    if (!testItemFilter) return;
    try {
      await questionService.removeQuestionFromTest(testItemFilter, questionId);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                test_ids: (q.test_ids || []).filter(
                  (id) => id !== testItemFilter,
                ),
              }
            : q,
        ),
      );
      success("Question Unlinked", "Removed from current test set.");
    } catch (err: any) {
      toastError("Unlink Failed", err.message);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id),
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredQuestions.map((q) => q.id) : []);
  };

  const filteredQuestions = questions.filter((q) => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      q.question_en.toLowerCase().includes(query) ||
      q.question_hi.toLowerCase().includes(query) ||
      (q.source && q.source.toLowerCase().includes(query));

    const matchChapter =
      chapterFilter === "" ? true : q.chapter_id === chapterFilter;
    const matchDifficulty =
      difficultyFilter === "" ? true : q.difficulty === difficultyFilter;
    const matchType = typeFilter === "" ? true : q.question_type === typeFilter;
    const matchStatus =
      statusFilter === ""
        ? true
        : statusFilter === "active"
          ? q.is_active
          : !q.is_active;

    const matchTest =
      testItemFilter === ""
        ? true
        : Boolean(q.test_ids && q.test_ids.includes(testItemFilter));

    return (
      matchSearch &&
      matchChapter &&
      matchDifficulty &&
      matchType &&
      matchStatus &&
      matchTest
    );
  });

  const totalPages = Math.ceil(filteredQuestions.length / pageSize);
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const selectedTestItem = testSeriesItems.find((i) => i.id === testItemFilter);

  const columns: Column<Question>[] = [
    {
      key: "question",
      header: "Bilingual Question & Chapter",
      render: (item) => {
        const chapter = chapters.find((c) => c.id === item.chapter_id);
        const associatedTests = testSeriesItems.filter((t) =>
          item.test_ids?.includes(t.id),
        );

        return (
          <div className="space-y-1.5 py-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm line-clamp-2">
                {item.question_en}
              </span>
            </div>
            <p className="text-xs text-lavender-300 font-medium line-clamp-1">
              {item.question_hi}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-dark-muted pt-0.5">
              <span className="px-2 py-0.5 rounded bg-background-elevated border border-dark-border text-dark-text font-medium">
                {chapter?.title || "General / No Chapter"}
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">
                Ans: Option {item.correct_option}
              </span>
              {item.source && (
                <>
                  <span>•</span>
                  <span className="text-dark-dim truncate max-w-xs">
                    {item.source}
                  </span>
                </>
              )}
            </div>
            {associatedTests.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-dark-dim tracking-wider">
                  Test Sets:
                </span>
                {associatedTests.map((t) => (
                  <Badge key={t.id} variant="neutral" size="sm">
                    {t.title}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "type_diff",
      header: "Type & Level",
      width: "140px",
      render: (item) => (
        <div className="space-y-1">
          <Badge variant="primary" size="sm">
            {item.question_type}
          </Badge>
          <div>
            <Badge
              size="sm"
              variant={
                item.difficulty === "Easy"
                  ? "success"
                  : item.difficulty === "Medium"
                    ? "warning"
                    : "danger"
              }
            >
              {item.difficulty}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "130px",
      align: "right",
      render: (item) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setPreviewQuestion(item)}
            className="p-1.5 text-dark-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Preview Question"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEditModal(item)}
            className="p-1.5 text-dark-muted hover:text-lavender-300 hover:bg-lavender-500/10 rounded-lg transition-colors"
            title="Edit Question"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {testItemFilter ? (
            <button
              onClick={() => handleUnlinkFromCurrentSet(item.id)}
              className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
              title="Remove from this test set"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setDeleteTarget(item)}
              className="p-1.5 text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Delete Question"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {selectedTestItem && (
        <div className="p-4 rounded-2xl bg-lavender-500/10 border border-lavender-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-lavender-500/20 text-lavender-300 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-lavender-400 tracking-wider">
                  Test Set Mode:
                </span>
                <span className="font-bold text-white text-sm">
                  {selectedTestItem.title}
                </span>
              </div>
              <p className="text-xs text-dark-muted mt-0.5">
                Showing questions assigned to this set in Supabase • Target:{" "}
                {selectedTestItem.question_count} Qs
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTestItemFilter("");
              setSearchParams({});
            }}
          >
            Show All Questions
          </Button>
        </div>
      )}

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search question text in English or Hindi..."
        filters={[
          {
            key: "chapter",
            label: "Chapter",
            value: chapterFilter,
            options: chapters.map((c) => ({ value: c.id, label: c.title })),
            onChange: setChapterFilter,
          },
          {
            key: "difficulty",
            label: "Difficulty",
            value: difficultyFilter,
            options: DIFFICULTY_OPTIONS.map((d) => ({
              value: d.value,
              label: d.label,
            })),
            onChange: setDifficultyFilter,
          },
          {
            key: "type",
            label: "Type",
            value: typeFilter,
            options: [
              { value: "MCQ", label: "4-Option MCQ" },
              { value: "True/False", label: "True / False" },
            ],
            onChange: setTypeFilter,
          },
          {
            key: "test_item",
            label: "Test Set",
            value: testItemFilter,
            options: testSeriesItems.map((i) => ({
              value: i.id,
              label: i.title,
            })),
            onChange: (val) => {
              setTestItemFilter(val);
              if (val) setSearchParams({ testItemId: val });
              else setSearchParams({});
            },
          },
        ]}
        hasActiveFilters={Boolean(
          searchQuery ||
          chapterFilter ||
          difficultyFilter ||
          typeFilter ||
          testItemFilter,
        )}
        onClearFilters={() => {
          setSearchQuery("");
          setChapterFilter("");
          setDifficultyFilter("");
          setTypeFilter("");
          setTestItemFilter("");
          setSearchParams({});
        }}
        extraActions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAiGenerateModalOpen(true)}
              leftIcon={<Sparkles className="w-4 h-4 text-lavender-400 animate-pulse" />}
              className="bg-lavender-500/10 hover:bg-lavender-500/20 border-lavender-500/30 text-lavender-200"
            >
              Generate with AI
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsBulkUploadModalOpen(true)}
              leftIcon={<Upload className="w-4 h-4 text-lavender-400" />}
            >
              Bulk Upload
            </Button>
            {selectedIds.length > 0 && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setIsAssignModalOpen(true)}
                  leftIcon={<Link2 className="w-4 h-4 text-lavender-400" />}
                >
                  Assign Selected ({selectedIds.length})
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                  leftIcon={<Trash2 className="w-4 h-4 text-rose-300" />}
                >
                  Delete Selected ({selectedIds.length})
                </Button>
              </>
            )}
          </div>
        }
        actionButton={{
          label: "New Question",
          onClick: openCreateModal,
        }}
      />

      <div className="space-y-0">
        <DataTable
          columns={columns}
          data={paginatedQuestions}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          emptyTitle="No questions found in Supabase"
          emptyDescription="Add bilingual questions with multiple choices and solutions to build the bank."
          emptyActionText="Add Question"
          onEmptyAction={openCreateModal}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredQuestions.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        size="2xl"
        title={
          editingQuestion
            ? "Edit Bilingual Question"
            : "Add New Bilingual Question"
        }
        subtitle="Provide complete English and Hindi text in Supabase"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingQuestion ? "Save Changes" : "Save Question"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Associate Test Series Items */}
          <div className="p-4 rounded-2xl bg-background-elevated/40 border border-dark-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-lavender-400">
                  Associate with Test Series Items / Test Sets
                </span>
                <p className="text-xs text-dark-muted mt-0.5">
                  Select which test sets include this question (
                  {selectedTestIds.length} selected)
                </p>
              </div>
              {testSeriesItems.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedTestIds(testSeriesItems.map((t) => t.id))
                    }
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
                No test series items created yet. You can create them in the
                Test Series section.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {testSeriesItems.map((item) => {
                  const isSelected = selectedTestIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleTestItemSelection(item.id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? "bg-lavender-500/15 border-lavender-500/50 text-white shadow-sm"
                          : "bg-background-subtle/50 border-dark-border text-dark-muted hover:border-dark-border/80 hover:text-dark-text"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-0.5 w-3.5 h-3.5 rounded text-lavender-500 cursor-pointer pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-dark-dim flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 bg-dark-bg/60 rounded">
                            {item.test_type}
                          </span>
                          <span>•</span>
                          <span>{item.question_count} Qs Target</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Select
                label="Syllabus Chapter (Optional)"
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                options={[
                  { value: "", label: "-- General / No Specific Chapter --" },
                  ...chapters.map((c) => ({ value: c.id, label: c.title })),
                ]}
                error={formErrors.chapterId}
              />
            </div>
            <Select
              label="Question Type"
              value={questionType}
              onChange={(e) => {
                const newType = e.target.value as QuestionType;
                setQuestionType(newType);
                if (newType === "True/False") {
                  setOptAEn("True");
                  setOptAHi("सही (True)");
                  setOptBEn("False");
                  setOptBHi("गलत (False)");
                }
              }}
              options={[
                { value: "MCQ", label: "4-Option MCQ" },
                { value: "True/False", label: "True / False" },
              ]}
            />
            <Select
              label="Difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              options={DIFFICULTY_OPTIONS}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Question Text (English)"
              placeholder="e.g. What is the shortcut key to save a file in LibreOffice Writer?"
              value={questionEn}
              onChange={(e) => setQuestionEn(e.target.value)}
              error={formErrors.questionEn}
              rows={3}
              required
            />
            <Textarea
              label="प्रश्न (Hindi)"
              placeholder="उदा. लिबरेऑफिस राइटर में फाइल सेव करने की शॉर्टकट कुंजी क्या है?"
              value={questionHi}
              onChange={(e) => setQuestionHi(e.target.value)}
              error={formErrors.questionHi}
              rows={3}
              required
            />
          </div>

          <div className="space-y-3 p-4 rounded-2xl bg-background-elevated/40 border border-dark-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-dark-muted">
                Bilingual Options & Correct Answer
              </span>
              <span className="text-xs text-lavender-400">
                Select the correct radio option
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="correct_option"
                checked={correctOption === "A"}
                onChange={() => setCorrectOption("A")}
                className="w-4 h-4 text-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-white w-6">A:</span>
              <div className="grid grid-cols-2 gap-2 flex-1">
                <Input
                  placeholder="Option A (English)"
                  value={optAEn}
                  onChange={(e) => setOptAEn(e.target.value)}
                  error={formErrors.optAEn}
                />
                <Input
                  placeholder="विकल्प A (Hindi)"
                  value={optAHi}
                  onChange={(e) => setOptAHi(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="correct_option"
                checked={correctOption === "B"}
                onChange={() => setCorrectOption("B")}
                className="w-4 h-4 text-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-white w-6">B:</span>
              <div className="grid grid-cols-2 gap-2 flex-1">
                <Input
                  placeholder="Option B (English)"
                  value={optBEn}
                  onChange={(e) => setOptBEn(e.target.value)}
                  error={formErrors.optBEn}
                />
                <Input
                  placeholder="विकल्प B (Hindi)"
                  value={optBHi}
                  onChange={(e) => setOptBHi(e.target.value)}
                />
              </div>
            </div>

            {questionType === "MCQ" && (
              <>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct_option"
                    checked={correctOption === "C"}
                    onChange={() => setCorrectOption("C")}
                    className="w-4 h-4 text-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-white w-6">C:</span>
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <Input
                      placeholder="Option C (English)"
                      value={optCEn}
                      onChange={(e) => setOptCEn(e.target.value)}
                      error={formErrors.optCEn}
                    />
                    <Input
                      placeholder="विकल्प C (Hindi)"
                      value={optCHi}
                      onChange={(e) => setOptCHi(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct_option"
                    checked={correctOption === "D"}
                    onChange={() => setCorrectOption("D")}
                    className="w-4 h-4 text-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-white w-6">D:</span>
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <Input
                      placeholder="Option D (English)"
                      value={optDEn}
                      onChange={(e) => setOptDEn(e.target.value)}
                      error={formErrors.optDEn}
                    />
                    <Input
                      placeholder="विकल्प D (Hindi)"
                      value={optDHi}
                      onChange={(e) => setOptDHi(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Detailed Explanation (English)"
              placeholder="Why this answer is correct..."
              value={explanationEn}
              onChange={(e) => setExplanationEn(e.target.value)}
              rows={2}
            />
            <Textarea
              label="विस्तृत व्याख्या (Hindi)"
              placeholder="उत्तर का कारण व विवरण..."
              value={explanationHi}
              onChange={(e) => setExplanationHi(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <Input
              label="Source / Reference Paper"
              placeholder="e.g. NIELIT 2026 / Official Exam"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
            <div className="pt-4">
              <Switch
                checked={isActive}
                onChange={setIsActive}
                label="Active Status"
                description="Active questions are served in tests & quizzes."
              />
            </div>
          </div>
        </form>
      </Modal>

      <QuestionPreviewModal
        question={previewQuestion}
        questionsList={filteredQuestions}
        chapters={chapters}
        testSeriesItems={testSeriesItems}
        isOpen={Boolean(previewQuestion)}
        onClose={() => setPreviewQuestion(null)}
        onQuestionChange={(updated) => {
          setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
          setPreviewQuestion(updated);
        }}
        onNavigate={(nextQ) => setPreviewQuestion(nextQ)}
      />

      <QuestionAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        selectedQuestionIds={selectedIds}
        testSeriesItems={testSeriesItems}
        onComplete={() => {
          setSelectedIds([]);
          fetchData();
        }}
      />

      <BulkQuestionUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        chapters={chapters}
        testSeriesItems={testSeriesItems}
        defaultTestItemId={testItemFilter}
        onSuccess={() => {
          fetchData();
        }}
      />

      <AiQuestionGenerateModal
        isOpen={isAiGenerateModalOpen}
        onClose={() => setIsAiGenerateModalOpen(false)}
        chapters={chapters}
        testSeriesItems={testSeriesItems}
        defaultTestItemId={testItemFilter}
        onSuccess={() => {
          fetchData();
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Question"
        message={`Are you sure you want to permanently delete this question from Supabase?`}
      />

      <ConfirmDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDelete}
        isLoading={isBulkDeleting}
        title={`Delete ${selectedIds.length} Questions`}
        message={`Are you sure you want to permanently delete ${selectedIds.length} selected questions from Supabase? This action cannot be undone.`}
        confirmText={`Delete ${selectedIds.length} Questions`}
      />
    </div>
  );
};
