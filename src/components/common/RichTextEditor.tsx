import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Quote,
  Eye,
  Edit3,
  Link2,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Write in Markdown format...',
  rows = 10,
}) => {
  const [isPreview, setIsPreview] = useState(false);

  const insertFormat = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('rich-text-input') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || 'text';
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  };

  const renderSimpleMarkdown = (content: string) => {
    if (!content) return <p className="text-dark-dim italic">No content to preview</p>;

    const lines = content.split('\n');
    return (
      <div className="space-y-3 text-sm text-dark-text leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-lg font-bold text-lavender-300 mt-4 mb-2">
                {line.replace('## ', '')}
              </h3>
            );
          }
          if (line.startsWith('# ')) {
            return (
              <h2 key={idx} className="text-xl font-extrabold text-white mt-5 mb-2">
                {line.replace('# ', '')}
              </h2>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <li key={idx} className="ml-4 list-disc text-white/90">
                {line.substring(2)}
              </li>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote
                key={idx}
                className="pl-4 border-l-2 border-lavender-500 text-lavender-200 italic bg-lavender-500/5 py-1 rounded-r"
              >
                {line.substring(2)}
              </blockquote>
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-2" />;
          }
          return <p key={idx}>{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted">
            {label}
          </label>
          <span className="text-[11px] text-dark-dim">Markdown Supported</span>
        </div>
      )}

      <div className="border border-dark-border rounded-2xl bg-background-elevated/70 overflow-hidden focus-within:border-lavender-500 transition-colors">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 bg-background-subtle/80 border-b border-dark-border">
          <button
            type="button"
            onClick={() => insertFormat('**', '**')}
            title="Bold"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('*', '*')}
            title="Italic"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5"
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-dark-border mx-1" />
          <button
            type="button"
            onClick={() => insertFormat('# ')}
            title="Heading 1"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('## ')}
            title="Heading 2"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-dark-border mx-1" />
          <button
            type="button"
            onClick={() => insertFormat('- ')}
            title="Bullet List"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('1. ')}
            title="Numbered List"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('> ')}
            title="Blockquote"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('`', '`')}
            title="Inline Code"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('[Link Text](', ')')}
            title="Add Link"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5"
          >
            <Link2 className="w-4 h-4" />
          </button>

          {/* Mode Switcher */}
          <div className="ml-auto flex items-center bg-background-card rounded-lg p-0.5 border border-dark-border">
            <button
              type="button"
              onClick={() => setIsPreview(false)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors',
                !isPreview ? 'bg-lavender-600 text-white shadow-sm' : 'text-dark-muted hover:text-white'
              )}
            >
              <Edit3 className="w-3 h-3" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPreview(true)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors',
                isPreview ? 'bg-lavender-600 text-white shadow-sm' : 'text-dark-muted hover:text-white'
              )}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Input / Preview Area */}
        {isPreview ? (
          <div className="p-4 min-h-[160px] max-h-[350px] overflow-y-auto bg-background-card/50">
            {renderSimpleMarkdown(value)}
          </div>
        ) : (
          <textarea
            id="rich-text-input"
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder:text-dark-dim focus:outline-none resize-y font-mono"
          />
        )}
      </div>
    </div>
  );
};
