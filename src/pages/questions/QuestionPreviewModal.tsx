import React from "react";
import { CheckCircle2, BookOpen } from "lucide-react";
import { Question, Chapter } from "../../types/database";
import { Modal } from "../../components/common/Modal";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";

export interface QuestionPreviewModalProps {
  question: Question | null;
  chapters?: Chapter[];
  isOpen: boolean;
  onClose: () => void;
}

export const QuestionPreviewModal: React.FC<QuestionPreviewModalProps> = ({
  question,
  chapters = [],
  isOpen,
  onClose,
}) => {
  if (!question) return null;

  const chapter = chapters.find((c) => c.id === question.chapter_id);
  const options = [
    { key: "A", en: question.option_a_en, hi: question.option_a_hi },
    { key: "B", en: question.option_b_en, hi: question.option_b_hi },
    { key: "C", en: question.option_c_en, hi: question.option_c_hi },
    { key: "D", en: question.option_d_en, hi: question.option_d_hi },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Question Bilingual Preview"
      subtitle={`Source: ${question.source || "Standard Bank"} • Difficulty: ${question.difficulty}`}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close Preview
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">{question.question_type}</Badge>
          <Badge
            variant={
              question.difficulty === "Easy"
                ? "success"
                : question.difficulty === "Medium"
                  ? "warning"
                  : "danger"
            }
          >
            {question.difficulty}
          </Badge>
          {chapter && (
            <Badge variant="neutral" className="normal-case">
              <BookOpen className="w-3 h-3 mr-1 text-lavender-400" />
              {chapter.title}
            </Badge>
          )}
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
          <div className="pt-2 border-t border-dark-border/60">
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
                question.question_type === "True/False" &&
                (opt.key === "C" || opt.key === "D")
              ) {
                return null;
              }

              return (
                <div
                  key={opt.key}
                  className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                    isCorrect
                      ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)]"
                      : "bg-background-elevated/40 border-dark-border"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      isCorrect
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "bg-background-hover text-dark-muted"
                    }`}
                  >
                    {opt.key}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-semibold ${isCorrect ? "text-emerald-200" : "text-white"}`}
                    >
                      {opt.en}
                    </p>
                    {opt.hi && opt.hi !== opt.en && (
                      <p
                        className={`text-[11px] mt-0.5 ${isCorrect ? "text-emerald-300" : "text-dark-muted"}`}
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
    </Modal>
  );
};
