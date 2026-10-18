import React from 'react';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Eye,
  PanelRightClose,
  PanelRightOpen,
  CheckCircle2,
  Clock,
  MoreVertical,
  Globe,
  Languages,
  ExternalLink,
  Copy,
  Trash2,
} from 'lucide-react';
import { ArticleLanguage } from '../../../types/database';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export interface ArticleEditorHeaderProps {
  isEditing: boolean;
  isPublished: boolean;
  language: ArticleLanguage;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  isSidebarOpen: boolean;
  slug: string;
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onOpenAiModal: () => void;
  onOpenPreviewModal: () => void;
  onToggleSidebar: () => void;
  onLanguageChange: (lang: ArticleLanguage) => void;
  onInsertTemplate?: (type: 'faq' | 'practice_table' | 'pro_tip') => void;
  onDeleteArticle?: () => void;
}

export const ArticleEditorHeader: React.FC<ArticleEditorHeaderProps> = ({
  isEditing,
  isPublished,
  language,
  isDirty,
  isSaving,
  lastSavedAt,
  isSidebarOpen,
  slug,
  onBack,
  onSaveDraft,
  onPublish,
  onOpenAiModal,
  onOpenPreviewModal,
  onToggleSidebar,
  onLanguageChange,
  onInsertTemplate,
  onDeleteArticle,
}) => {
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  const moreMenuRef = React.useRef<HTMLDivElement>(null);

  // Close more menu on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  const publicUrl = `https://www.cccguru.in${language === 'EN' ? '/en/blogs/' : '/hi/blogs/'}${slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setShowMoreMenu(false);
  };

  return (
    <header className="h-14 flex-shrink-0 bg-background-card/95 border-b border-dark-border px-3 sm:px-6 flex items-center justify-between z-30 transition-colors">
      {/* Left Area: Navigation, Status Badges & Dirty State */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl text-dark-muted hover:text-white hover:bg-background-hover transition-colors flex items-center justify-center"
          title="Back to Articles (Checks for unsaved changes)"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 h-5" />
        </button>

        <div className="h-4 w-px bg-dark-border hidden sm:block" />

        {/* Article Status Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <Badge
            variant={!isEditing ? 'neutral' : isPublished ? 'success' : 'warning'}
            dot
            size="sm"
          >
            {!isEditing ? 'New Article' : isPublished ? 'Published Live' : 'Draft'}
          </Badge>

          {/* Language Toggle Pill */}
          <div className="flex items-center rounded-lg bg-background-elevated border border-dark-border p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onLanguageChange('EN')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                language === 'EN'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-xs'
                  : 'text-dark-muted hover:text-white'
              }`}
              title="Switch to English article"
            >
              <Globe className="w-3 h-3 text-blue-400" />
              <span>EN</span>
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('HI')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                language === 'HI'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                  : 'text-dark-muted hover:text-white'
              }`}
              title="Switch to Hindi article"
            >
              <Languages className="w-3 h-3 text-emerald-400" />
              <span>HI</span>
            </button>
          </div>

          {/* Unsaved Changes Tracker */}
          <div className="hidden md:flex items-center gap-1.5 text-xs">
            {isDirty ? (
              <span className="flex items-center gap-1 text-amber-400 font-medium text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Unsaved changes
              </span>
            ) : (
              <span className="flex items-center gap-1 text-dark-muted text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>
                  {lastSavedAt
                    ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Saved in Hygraph'}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Area: Actions, Preview, Save Draft, Publish & Sidebar Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* AI Generator Button */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onOpenAiModal}
          className="border-lavender-500/30 text-lavender-300 hover:bg-lavender-500/10 text-xs px-2.5 sm:px-3"
          title="Open AI Blog Generator & Researcher"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1 text-lavender-400" />
          <span className="hidden sm:inline">AI Studio</span>
        </Button>

        {/* Live Preview Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenPreviewModal}
          className="border-dark-border hover:bg-white/5 text-xs px-2.5 sm:px-3"
          title="Open article live reading preview"
        >
          <Eye className="w-3.5 h-3.5 sm:mr-1 text-lavender-400" />
          <span className="hidden md:inline">Preview</span>
        </Button>

        {/* Save Draft Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onSaveDraft}
          disabled={isSaving}
          className="text-xs text-dark-muted hover:text-white px-2.5 sm:px-3"
          title="Save as unpublished draft"
        >
          <Clock className="w-3.5 h-3.5 sm:mr-1 text-dark-muted" />
          <span className="hidden sm:inline">Save Draft</span>
        </Button>

        {/* Primary Publish / Update Button */}
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onPublish}
          isLoading={isSaving}
          disabled={isSaving}
          className="text-xs px-3 sm:px-4 font-bold shadow-glow-sm"
          title={isPublished ? 'Update published article live in Hygraph' : 'Publish article live on CCCGuru.in'}
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          <span>{isEditing ? (isPublished ? 'Update Live' : 'Publish') : 'Publish Article'}</span>
        </Button>

        {/* More Actions Dropdown */}
        <div className="relative" ref={moreMenuRef}>
          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-background-hover transition-colors"
            title="More actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl bg-background-elevated border border-dark-border shadow-xl p-1.5 z-50 text-xs space-y-1 backdrop-blur-md">
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-dark-text hover:bg-white/5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-lavender-400" />
                <span>View on Website</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-dark-text hover:bg-white/5 transition-colors text-left"
              >
                <Copy className="w-3.5 h-3.5 text-blue-400" />
                <span>Copy Public Link</span>
              </button>

              {onInsertTemplate && (
                <>
                  <div className="h-px bg-dark-border/60 my-1" />
                  <div className="px-2.5 py-1 text-[10px] font-bold text-dark-muted uppercase tracking-wider">
                    Quick Templates
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onInsertTemplate('faq');
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-dark-text hover:bg-white/5 transition-colors text-left"
                  >
                    <span>❓</span>
                    <span>Insert FAQ Section</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onInsertTemplate('practice_table');
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-dark-text hover:bg-white/5 transition-colors text-left"
                  >
                    <span>📊</span>
                    <span>Insert Practice Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onInsertTemplate('pro_tip');
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-dark-text hover:bg-white/5 transition-colors text-left"
                  >
                    <span>💡</span>
                    <span>Insert Pro-Tip Box</span>
                  </button>
                </>
              )}

              {onDeleteArticle && isEditing && (
                <>
                  <div className="h-px bg-dark-border/60 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      onDeleteArticle();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete Article</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Toggle Right Settings Sidebar */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`p-2 rounded-xl border transition-all ${
            isSidebarOpen
              ? 'bg-lavender-500/15 border-lavender-500 text-lavender-300 shadow-xs'
              : 'bg-background-card border-dark-border text-dark-muted hover:text-white'
          }`}
          title={isSidebarOpen ? 'Collapse Article Settings Sidebar' : 'Open Article Settings Sidebar'}
        >
          {isSidebarOpen ? (
            <PanelRightClose className="w-4 h-4 text-lavender-400" />
          ) : (
            <PanelRightOpen className="w-4 h-4 text-dark-muted" />
          )}
        </button>
      </div>
    </header>
  );
};
