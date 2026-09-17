import React, { useState, useRef } from 'react';
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
  Table,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  helperText?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Write in Markdown format...',
  rows = 10,
  helperText,
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormat = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
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

  const insertTable = () => {
    const tableTemplate = `\n| Section / Topic | Questions | Weightage |\n| :--- | :--- | :--- |\n| Module 1: Intro | 20 Qs | 20% |\n| Module 2: LibreOffice | 40 Qs | 40% |\n\n`;
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + tableTemplate);
      return;
    }
    const start = textarea.selectionStart;
    const newValue = value.substring(0, start) + tableTemplate + value.substring(start);
    onChange(newValue);
  };

  const renderSimpleMarkdown = (content: string) => {
    if (!content || !content.trim()) {
      return <p className="text-dark-dim italic">No content to preview</p>;
    }

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let tableHeaders: string[] = [];

    const flushTable = (key: string) => {
      if (tableHeaders.length > 0 || tableRows.length > 0) {
        elements.push(
          <div key={key} className="my-3 overflow-x-auto rounded-xl border border-dark-border">
            <table className="w-full text-left text-xs border-collapse">
              {tableHeaders.length > 0 && (
                <thead>
                  <tr className="bg-background-elevated border-b border-dark-border">
                    {tableHeaders.map((th, thIdx) => (
                      <th key={thIdx} className="px-3 py-2 font-semibold text-white">
                        {th.trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-dark-border/40 bg-background-card/40">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/[0.02]">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-dark-text">
                        {cell.trim()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableHeaders = [];
        tableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const cells = trimmed.slice(1, -1).split('|');
        if (trimmed.includes('---') || trimmed.includes(':---')) {
          // Separator row, skip
          inTable = true;
        } else if (!inTable && tableHeaders.length === 0) {
          tableHeaders = cells;
          inTable = true;
        } else {
          tableRows.push(cells);
        }
        return;
      } else if (inTable) {
        flushTable(`table-${idx}`);
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={idx} className="text-base font-semibold text-lavender-200 mt-3 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h3 key={idx} className="text-lg font-bold text-lavender-300 mt-4 mb-1">
            {line.replace('## ', '')}
          </h3>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h2 key={idx} className="text-xl font-extrabold text-white mt-4 mb-2">
            {line.replace('# ', '')}
          </h2>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={idx} className="ml-4 list-disc text-white/90 text-xs py-0.5">
            {line.substring(2)}
          </li>
        );
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote
            key={idx}
            className="pl-3.5 my-2 border-l-2 border-lavender-500 text-lavender-200 italic bg-lavender-500/5 py-1.5 rounded-r text-xs"
          >
            {line.substring(2)}
          </blockquote>
        );
      } else if (!trimmed) {
        elements.push(<div key={idx} className="h-2" />);
      } else {
        elements.push(
          <p key={idx} className="text-xs text-dark-text leading-relaxed">
            {line}
          </p>
        );
      }
    });

    if (inTable) {
      flushTable(`table-end`);
    }

    return <div className="space-y-1.5 text-sm text-dark-text leading-relaxed">{elements}</div>;
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
            title="Bold (**text**)"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('*', '*')}
            title="Italic (*text*)"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-dark-border mx-1" />
          <button
            type="button"
            onClick={() => insertFormat('# ')}
            title="Heading 1"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('## ')}
            title="Heading 2"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-dark-border mx-1" />
          <button
            type="button"
            onClick={() => insertFormat('- ')}
            title="Bullet List"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('1. ')}
            title="Numbered List"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('> ')}
            title="Blockquote"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('`', '`')}
            title="Inline Code"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('[Link Text](', ')')}
            title="Add Link"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={insertTable}
            title="Insert Markdown Table"
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <Table className="w-4 h-4" />
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
          <div className="p-4 min-h-[180px] max-h-[400px] overflow-y-auto bg-background-card/50">
            {renderSimpleMarkdown(value)}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent px-4 py-3 text-xs leading-relaxed text-white placeholder:text-dark-dim focus:outline-none resize-y font-mono"
          />
        )}
      </div>
      {helperText && <p className="text-[11px] text-dark-dim">{helperText}</p>}
    </div>
  );
};
