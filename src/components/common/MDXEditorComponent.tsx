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
  imagePlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  StrikeThroughSupSubToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  InsertCodeBlock,
  ListsToggle,
  Separator,
  DiffSourceToggleWrapper,
  type MDXEditorMethods,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { uploadAssetToHygraph } from '../../services/hygraphAssetService';

export interface MDXEditorComponentProps {
  value: string;
  onChange: (markdown: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  minHeight?: string;
  variant?: 'card' | 'document';
}

export const MDXEditorComponent: React.FC<MDXEditorComponentProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Write your article here or use markdown formatting...',
  helperText,
  minHeight = '360px',
  variant = 'card',
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

  const handleImageUpload = async (imageFile: File): Promise<string> => {
    try {
      const result = await uploadAssetToHygraph(imageFile);
      return result.url;
    } catch (err: any) {
      console.error('Failed to upload image from MDXEditor to Hygraph:', err);
      throw err;
    }
  };

  const isDocument = variant === 'document';

  return (
    <div className={`w-full ${isDocument ? 'h-full flex-1 min-h-0 flex flex-col overflow-hidden' : 'space-y-2'}`}>
      {label && !isDocument && (
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
        className={`mdx-dark-container dark-theme ${
          isDocument
            ? 'flex-1 min-h-0 flex flex-col h-full overflow-hidden bg-transparent border-none'
            : 'rounded-2xl overflow-hidden border border-dark-border focus-within:border-lavender-500 transition-colors shadow-inner bg-[#0D0F17]'
        }`}
        style={!isDocument ? { minHeight } : undefined}
      >
        <MDXEditor
          ref={editorRef}
          markdown={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          className={`dark-theme dark-editor text-white ${
            isDocument ? 'mdxeditor-full-height document-editor-root flex-1 min-h-0 flex flex-col h-full overflow-hidden' : ''
          }`}
          contentEditableClassName={`prose prose-invert text-slate-200 focus:outline-none ${
            isDocument
              ? 'text-base leading-relaxed py-8 px-4 w-full max-w-4xl min-h-[500px]'
              : 'text-sm leading-relaxed p-4 min-h-[300px]'
          }`}
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            tablePlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            imagePlugin({
              imageUploadHandler: handleImageUpload,
              allowSetImageDimensions: true,
            }),
            codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
            codeMirrorPlugin({
              codeBlockLanguages: {
                js: 'JavaScript',
                ts: 'TypeScript',
                html: 'HTML',
                css: 'CSS',
                sql: 'SQL',
                json: 'JSON',
                python: 'Python',
              },
            }),
            diffSourcePlugin({ viewMode: 'rich-text' }),
            markdownShortcutPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <DiffSourceToggleWrapper>
                  <UndoRedo />
                  <Separator />
                  <BlockTypeSelect />
                  <BoldItalicUnderlineToggles />
                  <StrikeThroughSupSubToggles options={['Strikethrough']} />
                  <Separator />
                  <ListsToggle />
                  <CreateLink />
                  <InsertImage />
                  <InsertTable />
                  <InsertCodeBlock />
                  <InsertThematicBreak />
                </DiffSourceToggleWrapper>
              ),
            }),
          ]}
        />
      </div>

      {helperText && !isDocument && <p className="text-[11px] text-dark-dim">{helperText}</p>}
    </div>
  );
};
