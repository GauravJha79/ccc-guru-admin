import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Copy,
  Check,
  HelpCircle,
  Info,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../contexts/ToastContext';
import { Question, Chapter, TestSeriesItem, CorrectOption, DifficultyLevel, QuestionType } from '../../types/database';
import { questionService } from '../../services/questionService';

interface BulkQuestionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  testSeriesItems: TestSeriesItem[];
  defaultTestItemId?: string;
  onSuccess: (newQuestions: Question[]) => void;
}

interface ParsedQuestionRow {
  rowNumber: number;
  question_en: string;
  question_hi: string;
  option_a_en: string;
  option_a_hi: string;
  option_b_en: string;
  option_b_hi: string;
  option_c_en: string;
  option_c_hi: string;
  option_d_en: string;
  option_d_hi: string;
  correct_option: CorrectOption;
  explanation_en?: string;
  explanation_hi?: string;
  difficulty: DifficultyLevel;
  question_type: QuestionType;
  source?: string;
  chapter_id?: string;
  matchedChapterTitle?: string;
  errors: string[];
  isValid: boolean;
}

const SAMPLE_QUESTIONS_JSON = [
  {
    "chapter_id": "",
    "question_en": "Which of the following is the shortcut key to open LibreOffice Calc Help?",
    "question_hi": "LibreOffice Calc में हेल्प (Help) खोलने के लिए निम्न में से कौन सी शॉर्टकट कुंजी है?",
    "option_a_en": "F1",
    "option_a_hi": "F1",
    "option_b_en": "F2",
    "option_b_hi": "F2",
    "option_c_en": "F3",
    "option_c_hi": "F3",
    "option_d_en": "F4",
    "option_d_hi": "F4",
    "correct_option": "A",
    "explanation_en": "F1 is the universal key to open help documentation across LibreOffice applications.",
    "explanation_hi": "F1 लिब्रे ऑफिस अनुप्रयोगों में सहायता (Help) खोलने की सार्वभौमिक कुंजी है।",
    "difficulty": "Easy",
    "question_type": "MCQ",
    "source": "NIELIT 2026"
  },
  {
    "chapter_id": "",
    "question_en": "UPI stands for Unified Payments Interface and is developed by NPCI.",
    "question_hi": "UPI का पूर्ण रूप Unified Payments Interface है और इसे NPCI द्वारा विकसित किया गया है।",
    "option_a_en": "True",
    "option_a_hi": "सत्य (True)",
    "option_b_en": "False",
    "option_b_hi": "असत्य (False)",
    "option_c_en": "",
    "option_c_hi": "",
    "option_d_en": "",
    "option_d_hi": "",
    "correct_option": "A",
    "explanation_en": "UPI (Unified Payments Interface) was introduced by NPCI for instant real-time bank transfers.",
    "explanation_hi": "UPI को नेशनल पेमेंट्स कॉरपोरेशन ऑफ इंडिया (NPCI) द्वारा विकसित किया गया था।",
    "difficulty": "Easy",
    "question_type": "True/False",
    "source": "NIELIT 2026"
  }
];

export const BulkQuestionUploadModal: React.FC<BulkQuestionUploadModalProps> = ({
  isOpen,
  onClose,
  chapters,
  testSeriesItems,
  defaultTestItemId,
  onSuccess,
}) => {
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'excel' | 'json'>('excel');
  const [jsonText, setJsonText] = useState('');
  const [defaultChapterId, setDefaultChapterId] = useState('');
  const [targetTestId, setTargetTestId] = useState(defaultTestItemId || '');
  const [fileName, setFileName] = useState('');
  const [copiedSample, setCopiedSample] = useState(false);

  const [parsedRows, setParsedRows] = useState<ParsedQuestionRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const resetState = () => {
    setParsedRows([]);
    setFileName('');
    setJsonText('');
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const matchChapter = (val: any): { id?: string; title?: string } => {
    if (!val) return {};
    const str = String(val).trim();
    if (!str) return {};

    // 1. Direct UUID / ID match
    const byId = chapters.find((c) => c.id.toLowerCase() === str.toLowerCase());
    if (byId) return { id: byId.id, title: byId.title };

    // 2. Exact Title or Hindi Title match
    const byTitle = chapters.find(
      (c) =>
        c.title.toLowerCase() === str.toLowerCase() ||
        c.hindi_title.toLowerCase() === str.toLowerCase()
    );
    if (byTitle) return { id: byTitle.id, title: byTitle.title };

    // 3. Partial title match
    const byPartial = chapters.find(
      (c) =>
        c.title.toLowerCase().includes(str.toLowerCase()) ||
        str.toLowerCase().includes(c.title.toLowerCase())
    );
    if (byPartial) return { id: byPartial.id, title: byPartial.title };

    // 4. Chapter number match (e.g., "1", "Chapter 1", "Ch 1")
    const numMatch = str.match(/\d+/);
    if (numMatch) {
      const num = parseInt(numMatch[0], 10);
      const byOrder = chapters.find((c) => c.sort_order === num);
      if (byOrder) return { id: byOrder.id, title: byOrder.title };
    }

    return { id: str }; // keep raw if UUID
  };

  const normalizeCorrectOption = (raw: any): CorrectOption => {
    if (!raw) return 'A';
    const str = String(raw).trim().toUpperCase();
    if (str === 'A' || str === '1' || str === 'TRUE' || str === 'T' || str === 'OPTION A') return 'A';
    if (str === 'B' || str === '2' || str === 'FALSE' || str === 'F' || str === 'OPTION B') return 'B';
    if (str === 'C' || str === '3' || str === 'OPTION C') return 'C';
    if (str === 'D' || str === '4' || str === 'OPTION D') return 'D';
    return 'A';
  };

  const validateAndNormalizeRow = (raw: any, index: number): ParsedQuestionRow => {
    const rowNumber = index + 1;
    const errors: string[] = [];

    // Header aliases normalization
    const getField = (...keys: string[]) => {
      for (const k of keys) {
        if (raw[k] !== undefined && raw[k] !== null && String(raw[k]).trim() !== '') {
          return String(raw[k]).trim();
        }
      }
      return '';
    };

    const question_en = getField('question_en', 'question', 'questionEn', 'Question', 'English Question', 'question_text');
    const question_hi = getField('question_hi', 'hindi_question', 'questionHi', 'Hindi Question', 'Question Hindi') || question_en;

    const optAEn = getField('option_a_en', 'option_a', 'optionA', 'Option A', 'opt_a_en', 'opt_a');
    const optAHi = getField('option_a_hi', 'optionAHi', 'Option A Hindi', 'opt_a_hi') || optAEn;

    const optBEn = getField('option_b_en', 'option_b', 'optionB', 'Option B', 'opt_b_en', 'opt_b');
    const optBHi = getField('option_b_hi', 'optionBHi', 'Option B Hindi', 'opt_b_hi') || optBEn;

    const optCEn = getField('option_c_en', 'option_c', 'optionC', 'Option C', 'opt_c_en', 'opt_c');
    const optCHi = getField('option_c_hi', 'optionCHi', 'Option C Hindi', 'opt_c_hi') || optCEn;

    const optDEn = getField('option_d_en', 'option_d', 'optionD', 'Option D', 'opt_d_en', 'opt_d');
    const optDHi = getField('option_d_hi', 'optionDHi', 'Option D Hindi', 'opt_d_hi') || optDEn;

    const rawType = getField('question_type', 'type', 'questionType', 'Question Type').toUpperCase();
    const isTF = rawType === 'TRUE/FALSE' || rawType === 'TF' || rawType === 'TRUE_FALSE' || (!optCEn && !optDEn && (optAEn.toLowerCase() === 'true' || optBEn.toLowerCase() === 'false'));
    const question_type: QuestionType = isTF ? 'True/False' : 'MCQ';

    const rawCorrect = getField('correct_option', 'correct_answer', 'answer', 'Correct Option', 'Correct Answer', 'Answer');
    const correct_option = normalizeCorrectOption(rawCorrect);

    const rawDiff = getField('difficulty', 'Difficulty').toLowerCase();
    const difficulty: DifficultyLevel = rawDiff.includes('easy')
      ? 'Easy'
      : rawDiff.includes('hard')
      ? 'Hard'
      : 'Medium';

    const explanation_en = getField('explanation_en', 'explanation', 'Explanation', 'explanationEn');
    const explanation_hi = getField('explanation_hi', 'explanationHi', 'Explanation Hindi') || explanation_en;
    const source = getField('source', 'Source', 'exam', 'Exam') || 'NIELIT 2026';

    const rawChapter = getField(
      'chapter_number',
      'chapter_no',
      'chapter_order',
      'chapter_id',
      'chapter',
      'Chapter',
      'chapter_title',
      'Chapter ID'
    );
    const matched = matchChapter(rawChapter || defaultChapterId);

    // Validations
    if (!question_en) errors.push('English question text is missing.');
    if (!optAEn) errors.push('Option A is missing.');
    if (!optBEn) errors.push('Option B is missing.');
    if (question_type === 'MCQ') {
      if (!optCEn) errors.push('Option C is required for 4-option MCQ.');
      if (!optDEn) errors.push('Option D is required for 4-option MCQ.');
    }

    return {
      rowNumber,
      question_en,
      question_hi,
      option_a_en: optAEn,
      option_a_hi: optAHi,
      option_b_en: optBEn,
      option_b_hi: optBHi,
      option_c_en: question_type === 'True/False' ? '' : optCEn,
      option_c_hi: question_type === 'True/False' ? '' : optCHi,
      option_d_en: question_type === 'True/False' ? '' : optDEn,
      option_d_hi: question_type === 'True/False' ? '' : optDHi,
      correct_option,
      explanation_en: explanation_en || undefined,
      explanation_hi: explanation_hi || undefined,
      difficulty,
      question_type,
      source,
      chapter_id: matched.id || defaultChapterId || undefined,
      matchedChapterTitle: matched.title || chapters.find((c) => c.id === defaultChapterId)?.title,
      errors,
      isValid: errors.length === 0,
    };
  };

  const handleExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rawData.length === 0) {
        toastError('Empty File', 'The selected Excel/CSV sheet contains no data rows.');
        setIsProcessing(false);
        return;
      }

      const rows = rawData.map((row, idx) => validateAndNormalizeRow(row, idx));
      setParsedRows(rows);
      success('File Parsed', `Parsed ${rows.length} questions (${rows.filter((r) => r.isValid).length} valid).`);
    } catch (err: any) {
      toastError('Parsing Failed', err.message || 'Could not parse Excel/CSV file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParseJson = () => {
    if (!jsonText.trim()) {
      toastError('Empty JSON', 'Please paste JSON array or sample data.');
      return;
    }

    setIsProcessing(true);
    try {
      const parsed = JSON.parse(jsonText.trim());
      const arr = Array.isArray(parsed) ? parsed : [parsed];

      if (arr.length === 0) {
        toastError('Empty Array', 'JSON array must contain at least one question object.');
        setIsProcessing(false);
        return;
      }

      const rows = arr.map((item, idx) => validateAndNormalizeRow(item, idx));
      setParsedRows(rows);
      success('JSON Validated', `Parsed ${rows.length} questions (${rows.filter((r) => r.isValid).length} valid).`);
    } catch (err: any) {
      toastError('Invalid JSON', `JSON syntax error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSampleExcel = () => {
    const sampleData = [
      {
        chapter_id: chapters[0]?.id || 'uuid-of-chapter-1',
        chapter_title: chapters[0]?.title || 'Chapter 1: Introduction to Computer',
        question_en: 'Which of the following is the shortcut key to open LibreOffice Calc Help?',
        question_hi: 'LibreOffice Calc में हेल्प खोलने के लिए निम्न में से कौन सी शॉर्टकट कुंजी है?',
        option_a_en: 'F1',
        option_a_hi: 'F1',
        option_b_en: 'F2',
        option_b_hi: 'F2',
        option_c_en: 'F3',
        option_c_hi: 'F3',
        option_d_en: 'F4',
        option_d_hi: 'F4',
        correct_option: 'A',
        difficulty: 'Easy',
        question_type: 'MCQ',
        explanation_en: 'F1 is the universal key for help in LibreOffice.',
        explanation_hi: 'F1 लिब्रे ऑफिस में हेल्प की यूनिवर्सल कुंजी है।',
        source: 'NIELIT 2026',
      },
      {
        chapter_id: chapters[1]?.id || 'uuid-of-chapter-2',
        chapter_title: chapters[1]?.title || 'Chapter 2: Operating Systems',
        question_en: 'Linux is an open-source operating system kernel.',
        question_hi: 'लिनक्स एक ओपन-सोर्स ऑपरेटिंग सिस्टम कर्नेल है।',
        option_a_en: 'True',
        option_a_hi: 'सत्य (True)',
        option_b_en: 'False',
        option_b_hi: 'असत्य (False)',
        option_c_en: '',
        option_c_hi: '',
        option_d_en: '',
        option_d_hi: '',
        correct_option: 'A',
        difficulty: 'Easy',
        question_type: 'True/False',
        explanation_en: 'Linux was developed by Linus Torvalds and is free/open source.',
        explanation_hi: 'लिनक्स को लिनुस टोरवाल्ड्स द्वारा विकसित किया गया था और यह ओपन सोर्स है।',
        source: 'NIELIT 2026',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, 'CCC_Question_Bank_Sample_Template.xlsx');
    success('Template Downloaded', 'Sample Excel template saved.');
  };

  const handleCopySampleJson = () => {
    const sampleWithChapters = SAMPLE_QUESTIONS_JSON.map((q, idx) => ({
      ...q,
      chapter_id: chapters[idx % chapters.length]?.id || '',
    }));
    navigator.clipboard.writeText(JSON.stringify(sampleWithChapters, null, 2));
    setCopiedSample(true);
    success('Copied JSON', 'Sample JSON format copied to clipboard.');
    setTimeout(() => setCopiedSample(false), 2000);
  };

  const handleUploadToDatabase = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toastError('No Valid Questions', 'Please resolve errors in the parsed questions before uploading.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const payloads = validRows.map((row) => ({
        chapter_id: row.chapter_id || defaultChapterId || null,
        question_en: row.question_en,
        question_hi: row.question_hi,
        option_a_en: row.option_a_en,
        option_a_hi: row.option_a_hi,
        option_b_en: row.option_b_en,
        option_b_hi: row.option_b_hi,
        option_c_en: row.option_c_en,
        option_c_hi: row.option_c_hi,
        option_d_en: row.option_d_en,
        option_d_hi: row.option_d_hi,
        correct_option: row.correct_option,
        explanation_en: row.explanation_en,
        explanation_hi: row.explanation_hi,
        difficulty: row.difficulty,
        question_type: row.question_type,
        source: row.source,
        is_active: true,
        test_ids: targetTestId ? [targetTestId] : [],
      }));

      setUploadProgress(40);
      const inserted = await questionService.createQuestionsBulk(payloads as any);
      setUploadProgress(100);

      success(
        'Bulk Upload Complete',
        `Successfully uploaded ${inserted.length} questions to the database!`
      );
      onSuccess(inserted);
      onClose();
      resetState();
    } catch (err: any) {
      toastError('Upload Failed', err.message || 'Could not insert questions into Supabase.');
    } finally {
      setIsUploading(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isUploading) {
          onClose();
          resetState();
        }
      }}
      size="2xl"
      title="Bulk Upload Questions"
      subtitle="Import questions in bulk via Excel spreadsheet (.xlsx/.xls/.csv) or JSON format"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-dark-muted">
            {parsedRows.length > 0 && (
              <span>
                Ready to upload:{' '}
                <strong className="text-emerald-400 font-bold">{validCount} valid</strong>
                {invalidCount > 0 && (
                  <span className="text-rose-400 ml-1.5">({invalidCount} errors skipped)</span>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                onClose();
                resetState();
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadToDatabase}
              disabled={validCount === 0 || isUploading}
              isLoading={isUploading}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              {isUploading
                ? `Uploading ${validCount} Questions...`
                : `Upload ${validCount} Questions to Database`}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* Source Mode Tabs */}
        <div className="flex items-center gap-2 p-1 bg-background-elevated/70 rounded-2xl border border-dark-border">
          <button
            type="button"
            onClick={() => {
              setActiveTab('excel');
              resetState();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'excel'
                ? 'bg-lavender-500 text-white shadow-glow-sm'
                : 'text-dark-muted hover:text-white hover:bg-dark-border/40'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel / CSV File Upload (.xlsx, .xls, .csv)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('json');
              resetState();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'json'
                ? 'bg-lavender-500 text-white shadow-glow-sm'
                : 'text-dark-muted hover:text-white hover:bg-dark-border/40'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Paste / Upload JSON Array</span>
          </button>
        </div>

        {/* Global Import Settings (Chapter / Test Set Defaults) */}
        <div className="p-4 rounded-2xl bg-background-elevated/40 border border-dark-border/80 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Default Chapter (Fallback)"
            value={defaultChapterId}
            onChange={(e) => {
              const val = e.target.value;
              setDefaultChapterId(val);
              // Re-validate parsed rows if any
              if (parsedRows.length > 0) {
                setParsedRows((prev) =>
                  prev.map((r) => ({
                    ...r,
                    chapter_id: r.chapter_id || val,
                    matchedChapterTitle:
                      r.matchedChapterTitle || chapters.find((c) => c.id === val)?.title,
                  }))
                );
              }
            }}
            options={[
              { value: '', label: 'Auto-detect from file / General' },
              ...chapters.map((c) => ({
                value: c.id,
                label: `#${c.sort_order} ${c.title}`,
              })),
            ]}
          />

          <Select
            label="Assign All to Test Set (Optional)"
            value={targetTestId}
            onChange={(e) => setTargetTestId(e.target.value)}
            options={[
              { value: '', label: 'Do not assign to test set' },
              ...testSeriesItems.map((item) => ({
                value: item.id,
                label: `${item.title} (${item.question_count} Qs)`,
              })),
            ]}
          />
        </div>

        {/* Tab 1: Excel / CSV Mode */}
        {activeTab === 'excel' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Upload Spreadsheet</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSampleExcel}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download Sample Excel Template (.xlsx)
              </Button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-dark-border hover:border-lavender-500/50 bg-background-elevated/30 hover:bg-background-elevated/50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelFile}
                className="hidden"
              />
              <div className="p-3.5 rounded-2xl bg-lavender-500/10 text-lavender-400 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">
                {fileName ? fileName : 'Click to select or drop .xlsx, .xls or .csv file'}
              </p>
              <p className="text-xs text-dark-muted">
                Supports bilingual columns, chapter IDs, option A-D, answer, and explanations
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: JSON Mode */}
        {activeTab === 'json' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Paste JSON Question Array</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySampleJson}
                  leftIcon={copiedSample ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedSample ? 'Copied Sample' : 'Copy Sample JSON'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleParseJson}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Parse & Validate JSON
                </Button>
              </div>
            </div>

            <textarea
              rows={8}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={`[\n  {\n    "chapter_id": "${chapters[0]?.id || ''}",\n    "question_en": "Example Question?",\n    "question_hi": "उदाहरण प्रश्न?",\n    "option_a_en": "Option A",\n    "option_a_hi": "विकल्प A",\n    "option_b_en": "Option B",\n    "option_b_hi": "विकल्प B",\n    "option_c_en": "Option C",\n    "option_c_hi": "विकल्प C",\n    "option_d_en": "Option D",\n    "option_d_hi": "विकल्प D",\n    "correct_option": "A",\n    "difficulty": "Easy",\n    "question_type": "MCQ",\n    "explanation_en": "Explanation...",\n    "source": "NIELIT 2026"\n  }\n]`}
              className="w-full font-mono text-xs p-3.5 rounded-2xl bg-background border border-dark-border focus:border-lavender-500 focus:ring-1 focus:ring-lavender-500 text-lavender-200 resize-y"
            />
          </div>
        )}

        {/* Parsing Progress / Stats */}
        {parsedRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-background-elevated border border-dark-border">
              <div className="flex items-center gap-3">
                <Badge variant={validCount > 0 ? 'success' : 'neutral'} dot>
                  {validCount} Ready to Upload
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="danger" dot>
                    {invalidCount} Invalid Rows (Skipped)
                  </Badge>
                )}
              </div>
              <span className="text-xs text-dark-muted">Total Processed: {parsedRows.length}</span>
            </div>

            {/* Preview List */}
            <div className="rounded-2xl border border-dark-border overflow-hidden bg-background">
              <div className="max-h-60 overflow-y-auto divide-y divide-dark-border/50 text-xs">
                {parsedRows.map((row) => (
                  <div
                    key={row.rowNumber}
                    className={`p-3 transition-colors ${
                      row.isValid ? 'hover:bg-dark-border/20' : 'bg-rose-500/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-[11px] text-dark-muted font-bold pt-0.5">
                          #{row.rowNumber}
                        </span>
                        <div className="space-y-1">
                          <p className="font-semibold text-white leading-tight">
                            {row.question_en}
                          </p>
                          {row.question_hi && (
                            <p className="text-lavender-300 text-[11px]">{row.question_hi}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Badge variant="neutral" size="sm">
                              Ans: {row.correct_option}
                            </Badge>
                            <Badge variant="primary" size="sm">
                              {row.question_type}
                            </Badge>
                            <Badge variant="neutral" size="sm">
                              {row.difficulty}
                            </Badge>
                            {row.matchedChapterTitle && (
                              <span className="text-[11px] text-dark-muted font-medium">
                                Chapter: {row.matchedChapterTitle}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        {row.isValid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-1" />
                        )}
                      </div>
                    </div>

                    {!row.isValid && row.errors.length > 0 && (
                      <div className="mt-2 pl-6 text-[11px] text-rose-400 space-y-0.5">
                        {row.errors.map((err, errIdx) => (
                          <p key={errIdx}>• {err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
