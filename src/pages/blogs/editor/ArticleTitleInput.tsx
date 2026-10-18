import React from 'react';
import { Copy, Check, ExternalLink, Link2, Sparkles } from 'lucide-react';
import { ArticleLanguage } from '../../../types/database';

export interface ArticleTitleInputProps {
  title: string;
  slug: string;
  language: ArticleLanguage;
  onChangeTitle: (newTitle: string) => void;
  onAutoGenerateSlug?: () => void;
}

export const ArticleTitleInput: React.FC<ArticleTitleInputProps> = ({
  title,
  slug,
  language,
  onChangeTitle,
  onAutoGenerateSlug,
}) => {
  const [copied, setCopied] = React.useState(false);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height to accommodate 1-3 line titles cleanly
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.max(48, inputRef.current.scrollHeight)}px`;
    }
  }, [title]);

  const urlPrefix = language === 'EN' ? '/en/blogs/' : '/hi/blogs/';
  const fullUrl = `https://www.cccguru.in${urlPrefix}${slug || 'article-slug'}`;

  const handleCopyPermalink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-shrink-0 border-b border-dark-border/60 bg-background px-4 sm:px-8 lg:px-12 py-4 sm:py-5 z-10 transition-colors">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Prominent Distraction-Free Article Title */}
        <textarea
          ref={inputRef}
          rows={1}
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder={
            language === 'EN'
              ? 'Add Title...'
              : 'लेख का शीर्षक यहाँ लिखें...'
          }
          className="w-full text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white placeholder:text-dark-dim/60 bg-transparent border-none p-0 focus:outline-none focus:ring-0 resize-none leading-tight tracking-tight overflow-hidden"
        />

        {/* Live Permalink & Canonical Indicator */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-dark-muted pt-1">
          <span className="text-[11px] text-dark-dim uppercase tracking-wider font-semibold">
            Permalink:
          </span>
          <span className="text-lavender-400 font-medium truncate max-w-sm sm:max-w-md">
            {fullUrl}
          </span>

          <button
            type="button"
            onClick={handleCopyPermalink}
            className="p-1 rounded-md hover:bg-background-hover text-dark-muted hover:text-white transition-colors"
            title="Copy public URL"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {onAutoGenerateSlug && (
            <button
              type="button"
              onClick={onAutoGenerateSlug}
              className="px-1.5 py-0.5 rounded text-[10px] font-sans bg-background-elevated hover:bg-white/10 text-dark-muted hover:text-lavender-300 transition-colors flex items-center gap-1 border border-dark-border"
              title="Regenerate slug from current title"
            >
              <Sparkles className="w-2.5 h-2.5 text-lavender-400" />
              <span>Sync Slug</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
