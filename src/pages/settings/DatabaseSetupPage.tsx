import React, { useState, useEffect } from 'react';
import {
  Database,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  FileCode,
  Layers,
  Download,
  Terminal,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SUPABASE_SQL_SCHEMA } from '../../lib/sqlSchema';
import { isSupabaseConfigured, testSupabaseConnection } from '../../lib/supabase';
import { chapterService } from '../../services/chapterService';
import { Chapter } from '../../types/database';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const DatabaseSetupPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedAiPrompt, setCopiedAiPrompt] = useState(false);
  const [copiedJsonOnly, setCopiedJsonOnly] = useState(false);
  const [copiedChapterId, setCopiedChapterId] = useState<string | null>(null);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);

  useEffect(() => {
    const fetchChapters = async () => {
      setLoadingChapters(true);
      try {
        const data = await chapterService.getChapters();
        setChapters(data);
      } catch (err: any) {
        console.error('Error fetching chapters:', err);
      } finally {
        setLoadingChapters(false);
      }
    };
    fetchChapters();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    success('Copied to Clipboard', 'Full PostgreSQL SQL schema copied.');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    const res = await testSupabaseConnection();
    setTestResult(res);
    setTesting(false);
    if (res.success) {
      success('Connected to Supabase', res.message);
    } else {
      toastError('Connection Check', res.message);
    }
  };

  const chaptersMappingText = chapters.length > 0
    ? chapters
        .map((c) => `- Chapter ${c.sort_order}: "${c.title}" (Hindi: ${c.hindi_title}) => use "chapter_number": ${c.sort_order}`)
        .join('\n')
    : `- Chapter 1: "Introduction to Computer" => use "chapter_number": 1\n- Chapter 2: "Introduction to Operating System" => use "chapter_number": 2`;

  const sampleJsonOnly = [
    {
      chapter_number: 1,
      question_en: "Which shortcut key is used to save a file in LibreOffice Writer?",
      question_hi: "LibreOffice Writer में फ़ाइल को सेव (Save) करने के लिए किस शॉर्टकट कुंजी का उपयोग किया जाता है?",
      option_a_en: "Ctrl + S",
      option_a_hi: "Ctrl + S",
      option_b_en: "Ctrl + P",
      option_b_hi: "Ctrl + P",
      option_c_en: "Ctrl + N",
      option_c_hi: "Ctrl + N",
      option_d_en: "Ctrl + V",
      option_d_hi: "Ctrl + V",
      correct_option: "A",
      explanation_en: "Ctrl + S is the universal keyboard shortcut to save document changes.",
      explanation_hi: "Ctrl + S दस्तावेज़ में किए गए परिवर्तनों को सहेजने के लिए उपयोग किया जाता है।",
      difficulty: "Easy",
      question_type: "MCQ",
      source: "NIELIT 2026"
    },
    {
      chapter_number: 2,
      question_en: "A byte consists of 8 bits.",
      question_hi: "एक बाइट (Byte) में 8 बिट्स (Bits) होते हैं।",
      option_a_en: "True",
      option_a_hi: "सत्य (True)",
      option_b_en: "False",
      option_b_hi: "असत्य (False)",
      option_c_en: "",
      option_c_hi: "",
      option_d_en: "",
      option_d_hi: "",
      correct_option: "A",
      explanation_en: "1 Byte = 8 bits, 1 Nibble = 4 bits, 1 KB = 1024 Bytes.",
      explanation_hi: "1 बाइट = 8 बिट्स, 1 निब्बल = 4 बिट्स, 1 KB = 1024 बाइट्स।",
      difficulty: "Easy",
      question_type: "True/False",
      source: "NIELIT 2026"
    }
  ];

  const fullAiPrompt = `You are an expert NIELIT CCC Exam Question Creator. Generate high-quality, verified bilingual questions (English & Hindi) matching the latest CCC syllabus and exam pattern.

OUTPUT FORMAT REQUIREMENTS:
1. Return ONLY a valid, raw JSON array of objects (no markdown code fence, no extra conversational text).
2. Each object MUST strictly adhere to the following schema:

[
  {
    "chapter_number": 1, // Number corresponding to the chapter list below (e.g. 1, 2, 3...)
    "question_en": "Clear English question text",
    "question_hi": "सटीक और मानक हिंदी प्रश्न",
    "option_a_en": "Option A in English",
    "option_a_hi": "विकल्प A हिंदी में",
    "option_b_en": "Option B in English",
    "option_b_hi": "विकल्प B हिंदी में",
    "option_c_en": "Option C in English (leave empty \"\" for True/False questions)",
    "option_c_hi": "विकल्प C हिंदी में (leave empty \"\" for True/False questions)",
    "option_d_en": "Option D in English (leave empty \"\" for True/False questions)",
    "option_d_hi": "विकल्प D हिंदी में (leave empty \"\" for True/False questions)",
    "correct_option": "A", // Exactly one of: "A", "B", "C", "D"
    "explanation_en": "Concise factual explanation in English",
    "explanation_hi": "संक्षिप्त और सटीक व्याख्या हिंदी में",
    "difficulty": "Easy", // Exactly one of: "Easy", "Medium", "Hard"
    "question_type": "MCQ", // Exactly one of: "MCQ", "True/False"
    "source": "NIELIT 2026"
  }
]

VALID CHAPTERS & THEIR NUMBERS:
${chaptersMappingText}

ADDITIONAL RULES:
- For True/False questions:
  - set "question_type": "True/False"
  - set "option_a_en": "True", "option_a_hi": "सत्य (True)"
  - set "option_b_en": "False", "option_b_hi": "असत्य (False)"
  - set "option_c_en": "", "option_c_hi": "", "option_d_en": "", "option_d_hi": ""
  - "correct_option" must be either "A" (True) or "B" (False).
- For 4-option MCQ:
  - set "question_type": "MCQ"
  - fill options A, B, C, and D in both English and Hindi.
- All translations must use standard computer terminology used in NIELIT exams.`;

  const handleCopyAiPrompt = () => {
    navigator.clipboard.writeText(fullAiPrompt);
    setCopiedAiPrompt(true);
    success('AI Prompt Copied', 'Complete AI Generator prompt with live Chapter IDs copied.');
    setTimeout(() => setCopiedAiPrompt(false), 2500);
  };

  const handleCopyJsonOnly = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleJsonOnly, null, 2));
    setCopiedJsonOnly(true);
    success('JSON Schema Copied', 'Sample question JSON schema copied.');
    setTimeout(() => setCopiedJsonOnly(false), 2500);
  };

  const handleCopyChapterId = (id: string, title: string) => {
    navigator.clipboard.writeText(id);
    setCopiedChapterId(id);
    success('ID Copied', `Copied ID for "${title}"`);
    setTimeout(() => setCopiedChapterId(null), 2000);
  };

  const handleDownloadSampleExcel = () => {
    const sampleData = chapters.map((c, idx) => ({
      chapter_id: c.id,
      chapter_title: c.title,
      question_en: `Sample question for ${c.title}?`,
      question_hi: `${c.hindi_title} के लिए नमूना प्रश्न?`,
      option_a_en: 'Option A',
      option_a_hi: 'विकल्प A',
      option_b_en: 'Option B',
      option_b_hi: 'विकल्प B',
      option_c_en: 'Option C',
      option_c_hi: 'विकल्प C',
      option_d_en: 'Option D',
      option_d_hi: 'विकल्प D',
      correct_option: 'A',
      difficulty: idx % 2 === 0 ? 'Easy' : 'Medium',
      question_type: 'MCQ',
      explanation_en: 'Factual explanation of the correct answer.',
      explanation_hi: 'सही उत्तर का संक्षिप्त विवरण।',
      source: 'NIELIT 2026',
    }));

    const ws = XLSX.utils.json_to_sheet(sampleData.length > 0 ? sampleData : [sampleJsonOnly[0]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, 'CCC_Bulk_Questions_Template_With_Chapters.xlsx');
    success('Excel Template Downloaded', 'Spreadsheet with real Chapter IDs downloaded.');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Overview Card */}
      <div className="p-6 rounded-3xl bg-background-card border border-dark-border shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-lavender-500/10 text-lavender-400 border border-lavender-500/20 shadow-glow-sm">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Database & Supabase Configuration</h2>
              <p className="text-xs text-dark-muted">
                Complete PostgreSQL Schema, Row Level Security (RLS) & Storage Buckets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              isLoading={testing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Test Supabase Live Connection
            </Button>
            <Button
              size="sm"
              onClick={handleCopySql}
              leftIcon={copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedSql ? 'Copied SQL' : 'Copy All SQL'}
            </Button>
          </div>
        </div>

        {/* Status Alert Banner */}
        <div className="p-4 rounded-2xl bg-background-elevated/70 border border-dark-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-dark-muted">Current Connection Status:</span>
            {isSupabaseConfigured ? (
              <Badge variant="success" dot>
                Supabase URL & Anon Key Configured
              </Badge>
            ) : (
              <Badge variant="warning" dot>
                Using Reactive Local State / Mock Mode
              </Badge>
            )}
          </div>

          {testResult && (
            <span className={`font-semibold ${testResult.success ? 'text-emerald-300' : 'text-rose-400'}`}>
              {testResult.message}
            </span>
          )}
        </div>

        {/* Security Warning */}
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white">Security Golden Rule:</p>
            <p className="leading-relaxed">
              NEVER expose your Supabase <code>service_role</code> secret key in this frontend application or in the <code>.env</code> file. The admin panel operates strictly via Supabase Auth and RLS role verification.
            </p>
          </div>
        </div>
      </div>

      {/* AI Question Generator & Chapter Schema Reference Card */}
      <div className="p-6 rounded-3xl bg-background-card border border-lavender-500/30 shadow-card space-y-5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-lavender-500/20 text-lavender-300 border border-lavender-500/30 shadow-glow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">AI Question Generator Prompt & JSON Schema</h3>
                <Badge variant="primary" size="sm">Bilingual + Chapters</Badge>
              </div>
              <p className="text-xs text-dark-muted mt-0.5">
                Copy this prompt into ChatGPT, Gemini, or Claude to auto-generate questions with your database's real Chapter IDs
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSampleExcel}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download Excel Template
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyJsonOnly}
              leftIcon={copiedJsonOnly ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileCode className="w-3.5 h-3.5" />}
            >
              {copiedJsonOnly ? 'Copied JSON' : 'Copy JSON Only'}
            </Button>
            <Button
              size="sm"
              onClick={handleCopyAiPrompt}
              leftIcon={copiedAiPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
            >
              {copiedAiPrompt ? 'Copied AI Prompt!' : 'Copy Full AI Prompt'}
            </Button>
          </div>
        </div>

        {/* Live Chapters Reference Grid */}
        <div className="p-4 rounded-2xl bg-background-elevated/60 border border-dark-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-lavender-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Live Chapters in Database ({chapters.length})
              </span>
            </div>
            <span className="text-[11px] text-dark-muted">Click any ID to copy</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {chapters.map((c) => (
              <div
                key={c.id}
                onClick={() => handleCopyChapterId(c.id, c.title)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-dark-border/70 hover:border-lavender-500/40 hover:bg-lavender-500/5 transition-all cursor-pointer group"
              >
                <div className="space-y-0.5 overflow-hidden pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-lavender-400 font-bold">
                      #{c.sort_order}
                    </span>
                    <span className="text-xs font-semibold text-white truncate">{c.title}</span>
                  </div>
                  <p className="text-[11px] text-dark-muted truncate">{c.hindi_title}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-[10px] text-dark-dim group-hover:text-lavender-300 transition-colors">
                    {c.id.slice(0, 8)}...
                  </span>
                  {copiedChapterId === c.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-dark-dim group-hover:text-lavender-400 transition-colors" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Prompt Preview */}
        <div className="relative rounded-2xl bg-background overflow-hidden border border-dark-border">
          <div className="flex items-center justify-between px-4 py-2 bg-background-elevated/70 border-b border-dark-border text-xs text-dark-muted">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-lavender-400" />
              <span className="font-semibold text-white">Complete AI Prompt & JSON Schema Preview</span>
            </div>
            <button
              onClick={handleCopyAiPrompt}
              className="text-lavender-300 hover:text-white font-medium transition-colors flex items-center gap-1"
            >
              {copiedAiPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedAiPrompt ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-lavender-200 overflow-x-auto max-h-[350px] leading-relaxed select-all">
            {fullAiPrompt}
          </pre>
        </div>
      </div>

      {/* SQL Script Viewer */}
      <div className="p-6 rounded-3xl bg-background-card border border-dark-border shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">PostgreSQL Migration & Schema Setup Script</h3>
            <p className="text-xs text-dark-muted">Paste into your Supabase Dashboard &gt; SQL Editor and click Run</p>
          </div>
          <button
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-lavender-300 bg-lavender-500/10 hover:bg-lavender-500/20 border border-lavender-500/30 rounded-xl transition-colors"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Copied!' : 'Copy Script'}</span>
          </button>
        </div>

        <div className="relative rounded-2xl bg-background overflow-hidden border border-dark-border">
          <pre className="p-5 text-xs font-mono text-lavender-200 overflow-x-auto max-h-[400px] leading-relaxed select-all">
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>
      </div>
    </div>
  );
};
