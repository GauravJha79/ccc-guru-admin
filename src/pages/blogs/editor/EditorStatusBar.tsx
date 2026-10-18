import React from 'react';
import { BookOpen, FileText, Globe, Layers, Sparkles } from 'lucide-react';
import { ArticleLanguage } from '../../../types/database';

export interface EditorStatusBarProps {
  content: string;
  language: ArticleLanguage;
  categoryName?: string;
  authorName?: string;
}

export const EditorStatusBar: React.FC<EditorStatusBarProps> = ({
  content,
  language,
  categoryName,
  authorName,
}) => {
  // Compute text statistics
  const trimmed = content.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const charCount = content.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Count Markdown headings
  const headingsCount = (content.match(/^#{1,6}\s+/gm) || []).length;

  return (
    <div className="h-8 flex-shrink-0 bg-background-card/90 border-t border-dark-border px-4 sm:px-8 flex items-center justify-between text-[11px] text-dark-muted font-mono z-10 transition-colors">
      {/* Left: Writing Metrics */}
      <div className="flex items-center gap-3 sm:gap-5">
        <span className="flex items-center gap-1.5">
          <FileText className="w-3 h-3 text-lavender-400" />
          <strong className="text-white font-bold">{wordCount.toLocaleString()}</strong> words
        </span>

        <span className="hidden sm:inline-block text-dark-border">•</span>

        <span className="hidden sm:flex items-center gap-1">
          <strong className="text-dark-text font-medium">{charCount.toLocaleString()}</strong> characters
        </span>

        <span className="hidden md:inline-block text-dark-border">•</span>

        <span className="hidden md:flex items-center gap-1.5">
          <BookOpen className="w-3 h-3 text-blue-400" />
          <span>~{readingTime} min read</span>
        </span>

        {headingsCount > 0 && (
          <>
            <span className="hidden lg:inline-block text-dark-border">•</span>
            <span className="hidden lg:flex items-center gap-1">
              <strong className="text-dark-text font-medium">{headingsCount}</strong> headings
            </span>
          </>
        )}
      </div>

      {/* Right: Environment & Author Attribution */}
      <div className="flex items-center gap-3">
        {categoryName && (
          <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-background-elevated border border-dark-border text-[10px] text-dark-muted">
            {categoryName}
          </span>
        )}
        <span className="flex items-center gap-1 text-[10px] text-lavender-400 font-semibold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Hygraph CMS
        </span>
      </div>
    </div>
  );
};
