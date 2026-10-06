import React, { useRef, useEffect } from 'react';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  tablePlugin,
  linkPlugin,
  linkDialogPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  InsertThematicBreak,
  InsertCodeBlock,
  ListsToggle,
  DiffSourceToggleWrapper,
  type MDXEditorMethods,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

export interface MDXEditorComponentProps {
  value: string;
  onChange: (markdown: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  minHeight?: string;
}

export const MDXEditorComponent: React.FC<MDXEditorComponentProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Write in Markdown format or generate with AI...',
  helperText,
  minHeight = '360px',
}) => {
  const editorRef = useRef<MDXEditorMethods>(null);

  // Sanitize common unclosed HTML void tags (like <br>, <hr>) that cause MDX parser errors
  const sanitizedValue = React.useMemo(() => {
    if (!value) return '';
    return value
      .replace(/<br(?!\s*\/)>/gi, '<br />')
      .replace(/<hr(?!\s*\/)>/gi, '<hr />');
  }, [value]);

  // Sync external changes (e.g. from AI generator or template loader)
  useEffect(() => {
    if (editorRef.current) {
      const currentMarkdown = editorRef.current.getMarkdown();
      if (sanitizedValue !== currentMarkdown) {
        editorRef.current.setMarkdown(sanitizedValue || '');
      }
    }
  }, [sanitizedValue]);

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted">
            {label}
          </label>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            MDXEditor (Free & Open Source)
          </span>
        </div>
      )}

      <div
        className="mdx-dark-container rounded-2xl overflow-hidden border border-dark-border focus-within:border-lavender-500 transition-colors shadow-inner bg-[#0D0F17]"
        style={{ minHeight }}
      >
        <MDXEditor
          ref={editorRef}
          markdown={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          className="dark-theme dark-editor text-white"
          contentEditableClassName="prose prose-invert max-w-none text-sm leading-relaxed p-4 min-h-[300px] focus:outline-none"
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            tablePlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
            codeMirrorPlugin({
              codeBlockLanguages: {
                js: 'JavaScript',
                ts: 'TypeScript',
                html: 'HTML',
                css: 'CSS',
                sql: 'SQL',
                json: 'JSON',
              },
            }),
            diffSourcePlugin({ viewMode: 'rich-text' }),
            markdownShortcutPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <DiffSourceToggleWrapper>
                  <UndoRedo />
                  <BlockTypeSelect />
                  <BoldItalicUnderlineToggles />
                  <ListsToggle />
                  <CreateLink />
                  <InsertTable />
                  <InsertCodeBlock />
                  <InsertThematicBreak />
                </DiffSourceToggleWrapper>
              ),
            }),
          ]}
        />
      </div>

      {helperText && <p className="text-[11px] text-dark-dim">{helperText}</p>}
    </div>
  );
};
