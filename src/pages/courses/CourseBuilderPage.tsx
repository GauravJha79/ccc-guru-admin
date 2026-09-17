import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ChevronLeft,
  Plus,
  Edit2,
  Trash2,
  MoveUp,
  MoveDown,
  Layers,
  FileText,
  Video,
  FileCode,
  FileCheck,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  BookOpen,
  Eye,
  Settings,
  ExternalLink,
  Search,
  Check,
  FolderTree,
  AlertCircle,
  PlayCircle,
  Star,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import {
  Course,
  CourseModule,
  CourseLesson,
  CourseModuleNote,
  CourseModuleTest,
  CourseModuleQuestion,
  Note,
  TestSeriesItem,
  Question,
  LessonType,
  NoteCategory,
  Chapter,
} from '../../types/database';
import { courseService } from '../../services/courseService';
import { noteService } from '../../services/noteService';
import { testService } from '../../services/testService';
import { questionService } from '../../services/questionService';
import { chapterService } from '../../services/chapterService';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Select } from '../../components/common/Select';
import { Switch } from '../../components/common/Switch';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { CardSkeleton, Skeleton } from '../../components/common/LoadingSkeleton';
import { LESSON_TYPE_OPTIONS } from '../../constants/config';
import { cn } from '../../lib/utils';

type ModuleTab = 'overview' | 'lessons' | 'notes' | 'quiz' | 'test';

export const CourseBuilderPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ModuleTab>('lessons');

  // Module Modal
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleTitleHi, setModuleTitleHi] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');
  const [moduleDescHi, setModuleDescHi] = useState('');
  const [modulePublished, setModulePublished] = useState(true);
  const [moduleSortOrder, setModuleSortOrder] = useState<number | string>(0);
  const [moduleFormErrors, setModuleFormErrors] = useState<{ [key: string]: string }>({});
  const [isSavingModule, setIsSavingModule] = useState(false);
  const [deleteModuleTarget, setDeleteModuleTarget] = useState<CourseModule | null>(null);
  const [isDeletingModule, setIsDeletingModule] = useState(false);

  // Lesson Modal
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonTitleHi, setLessonTitleHi] = useState('');
  const [lessonType, setLessonType] = useState<LessonType>('text');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonContentHi, setLessonContentHi] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState<number | string>(10);
  const [lessonIsPreview, setLessonIsPreview] = useState(false);
  const [lessonPublished, setLessonPublished] = useState(true);
  const [lessonSortOrder, setLessonSortOrder] = useState<number | string>(0);
  const [lessonFormErrors, setLessonFormErrors] = useState<{ [key: string]: string }>({});
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<CourseLesson | null>(null);
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);

  // Note Selector Modal
  const [isNoteSelectorOpen, setIsNoteSelectorOpen] = useState(false);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [noteCategories, setNoteCategories] = useState<NoteCategory[]>([]);
  const [noteSearch, setNoteSearch] = useState('');
  const [noteCategoryFilter, setNoteCategoryFilter] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [attachingNoteId, setAttachingNoteId] = useState<string | null>(null);

  // Test Selector Modal
  const [isTestSelectorOpen, setIsTestSelectorOpen] = useState(false);
  const [allTests, setAllTests] = useState<TestSeriesItem[]>([]);
  const [testSearch, setTestSearch] = useState('');
  const [loadingTests, setLoadingTests] = useState(false);
  const [attachingTestId, setAttachingTestId] = useState<string | null>(null);

  // Quiz Question Selector Modal
  const [isQuizSelectorOpen, setIsQuizSelectorOpen] = useState(false);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [quizSearch, setQuizSearch] = useState('');
  const [quizChapterFilter, setQuizChapterFilter] = useState('');
  const [quizDifficultyFilter, setQuizDifficultyFilter] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isAttachingQuestions, setIsAttachingQuestions] = useState(false);

  // Preview Lesson Modal
  const [previewingLesson, setPreviewingLesson] = useState<CourseLesson | null>(null);

  const loadCourseData = async () => {
    if (!courseId) return;
    try {
      const data = await courseService.getCourseById(courseId);
      if (!data) {
        toastError('Not Found', 'Course does not exist.');
        navigate('/courses');
        return;
      }
      setCourse(data);

      // Default selected module to the first one if available and none selected
      if (data.modules && data.modules.length > 0) {
        if (!selectedModuleId || !data.modules.some((m) => m.id === selectedModuleId)) {
          setSelectedModuleId(data.modules[0].id);
        }
      } else {
        setSelectedModuleId(null);
      }
    } catch (err: any) {
      toastError('Load Error', err.message || 'Could not load course.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const selectedModule = course?.modules?.find((m) => m.id === selectedModuleId) || null;

  // ==========================================
  // MODULE ACTIONS
  // ==========================================
  const openCreateModuleModal = () => {
    setEditingModule(null);
    setModuleTitle('');
    setModuleTitleHi('');
    setModuleDesc('');
    setModuleDescHi('');
    setModulePublished(true);
    setModuleSortOrder((course?.modules?.length || 0) + 1);
    setModuleFormErrors({});
    setIsModuleModalOpen(true);
  };

  const openEditModuleModal = (mod: CourseModule) => {
    setEditingModule(mod);
    setModuleTitle(mod.title);
    setModuleTitleHi(mod.title_hi || '');
    setModuleDesc(mod.description || '');
    setModuleDescHi(mod.description_hi || '');
    setModulePublished(mod.is_published);
    setModuleSortOrder(mod.sort_order || 0);
    setModuleFormErrors({});
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;

    const errors: { [key: string]: string } = {};
    if (!moduleTitle.trim()) errors.title = 'Module title is required.';
    if (!moduleTitleHi.trim()) errors.titleHi = 'Hindi title is required.';

    if (Object.keys(errors).length > 0) {
      setModuleFormErrors(errors);
      return;
    }

    setIsSavingModule(true);
    try {
      const payload = {
        course_id: courseId,
        title: moduleTitle.trim(),
        title_hi: moduleTitleHi.trim(),
        description: moduleDesc.trim() || null,
        description_hi: moduleDescHi.trim() || null,
        sort_order: Number(moduleSortOrder) || 0,
        is_published: modulePublished,
      };

      if (editingModule) {
        await courseService.updateModule(editingModule.id, payload);
        success('Module Updated', `Saved "${moduleTitle}"`);
      } else {
        const created = await courseService.createModule(payload);
        setSelectedModuleId(created.id);
        success('Module Added', `Added chapter "${moduleTitle}"`);
      }

      setIsModuleModalOpen(false);
      await loadCourseData();
    } catch (err: any) {
      toastError('Module Error', err.message || 'Could not save module.');
    } finally {
      setIsSavingModule(false);
    }
  };

  const handleConfirmDeleteModule = async () => {
    if (!deleteModuleTarget) return;
    setIsDeletingModule(true);
    try {
      await courseService.deleteModule(deleteModuleTarget.id);
      success('Module Deleted', `"${deleteModuleTarget.title}" was removed.`);
      setDeleteModuleTarget(null);
      await loadCourseData();
    } catch (err: any) {
      toastError('Delete Failed', err.message || 'Could not delete module.');
    } finally {
      setIsDeletingModule(false);
    }
  };

  const handleMoveModule = async (index: number, direction: 'up' | 'down') => {
    if (!course?.modules) return;
    const mods = [...course.modules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mods.length) return;

    // Swap items
    const temp = mods[index];
    mods[index] = mods[targetIndex];
    mods[targetIndex] = temp;

    // Assign new sort_orders
    const updates = mods.map((m, idx) => ({ id: m.id, sort_order: idx + 1 }));
    try {
      await courseService.reorderModules(updates);
      await loadCourseData();
    } catch (err: any) {
      toastError('Reorder Failed', err.message);
    }
  };

  // ==========================================
  // LESSON ACTIONS
  // ==========================================
  const openCreateLessonModal = () => {
    if (!selectedModuleId) {
      toastError('Select Module', 'Please select a module first.');
      return;
    }
    setEditingLesson(null);
    setLessonTitle('');
    setLessonTitleHi('');
    setLessonType('text');
    setLessonContent('');
    setLessonContentHi('');
    setLessonVideoUrl('');
    setLessonDuration(10);
    setLessonIsPreview(false);
    setLessonPublished(true);
    setLessonSortOrder((selectedModule?.lessons?.length || 0) + 1);
    setLessonFormErrors({});
    setIsLessonModalOpen(true);
  };

  const openEditLessonModal = (lesson: CourseLesson) => {
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonTitleHi(lesson.title_hi || '');
    setLessonType(lesson.lesson_type);
    setLessonContent(lesson.content || '');
    setLessonContentHi(lesson.content_hi || '');
    setLessonVideoUrl(lesson.video_url || '');
    setLessonDuration(lesson.duration_minutes || 0);
    setLessonIsPreview(lesson.is_free_preview);
    setLessonPublished(lesson.is_published);
    setLessonSortOrder(lesson.sort_order || 0);
    setLessonFormErrors({});
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId) return;

    const errors: { [key: string]: string } = {};
    if (!lessonTitle.trim()) errors.title = 'Lesson title is required.';
    if (!lessonTitleHi.trim()) errors.titleHi = 'Hindi title is required.';

    if ((lessonType === 'video' || lessonType === 'mixed') && !lessonVideoUrl.trim()) {
      errors.videoUrl = 'Video URL is required for video lessons.';
    }

    if (Object.keys(errors).length > 0) {
      setLessonFormErrors(errors);
      return;
    }

    setIsSavingLesson(true);
    try {
      const payload = {
        module_id: selectedModuleId,
        title: lessonTitle.trim(),
        title_hi: lessonTitleHi.trim(),
        lesson_type: lessonType,
        content: lessonContent.trim() || null,
        content_hi: lessonContentHi.trim() || null,
        video_url: lessonVideoUrl.trim() || null,
        duration_minutes: Number(lessonDuration) || 0,
        is_free_preview: lessonIsPreview,
        is_published: lessonPublished,
        sort_order: Number(lessonSortOrder) || 0,
      };

      if (editingLesson) {
        await courseService.updateLesson(editingLesson.id, payload);
        success('Lesson Updated', `Saved "${lessonTitle}"`);
      } else {
        await courseService.createLesson(payload);
        success('Lesson Created', `Added "${lessonTitle}"`);
      }

      setIsLessonModalOpen(false);
      await loadCourseData();
    } catch (err: any) {
      toastError('Lesson Error', err.message || 'Could not save lesson.');
    } finally {
      setIsSavingLesson(false);
    }
  };

  const handleConfirmDeleteLesson = async () => {
    if (!deleteLessonTarget) return;
    setIsDeletingLesson(true);
    try {
      await courseService.deleteLesson(deleteLessonTarget.id);
      success('Lesson Deleted', `"${deleteLessonTarget.title}" was removed.`);
      setDeleteLessonTarget(null);
      await loadCourseData();
    } catch (err: any) {
      toastError('Delete Failed', err.message || 'Could not delete lesson.');
    } finally {
      setIsDeletingLesson(false);
    }
  };

  const handleMoveLesson = async (index: number, direction: 'up' | 'down') => {
    if (!selectedModule?.lessons) return;
    const lessons = [...selectedModule.lessons];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const temp = lessons[index];
    lessons[index] = lessons[targetIndex];
    lessons[targetIndex] = temp;

    const updates = lessons.map((l, idx) => ({ id: l.id, sort_order: idx + 1 }));
    try {
      await courseService.reorderLessons(updates);
      await loadCourseData();
    } catch (err: any) {
      toastError('Reorder Failed', err.message);
    }
  };

  // ==========================================
  // NOTES ATTACHMENT
  // ==========================================
  const openNoteSelector = async () => {
    setIsNoteSelectorOpen(true);
    setLoadingNotes(true);
    try {
      const [notesData, catsData] = await Promise.all([
        noteService.getNotes(),
        noteService.getCategories(),
      ]);
      setAllNotes(notesData);
      setNoteCategories(catsData);
    } catch (err: any) {
      toastError('Fetch Error', err.message);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAttachNote = async (note: Note) => {
    if (!selectedModuleId) return;
    setAttachingNoteId(note.id);
    try {
      const sortOrder = (selectedModule?.notes?.length || 0) + 1;
      await courseService.attachNoteToModule(selectedModuleId, note.id, sortOrder);
      success('Note Attached', `Attached "${note.title}" to this module.`);
      await loadCourseData();
    } catch (err: any) {
      toastError('Attach Failed', err.message);
    } finally {
      setAttachingNoteId(null);
    }
  };

  const handleDetachNote = async (moduleNoteId: string, title: string) => {
    try {
      await courseService.detachNoteFromModule(moduleNoteId);
      success('Note Removed', `Removed note from this module.`);
      await loadCourseData();
    } catch (err: any) {
      toastError('Detach Failed', err.message);
    }
  };

  // ==========================================
  // TESTS ATTACHMENT
  // ==========================================
  const openTestSelector = async () => {
    setIsTestSelectorOpen(true);
    setLoadingTests(true);
    try {
      const testsData = await testService.getSeriesItems();
      setAllTests(testsData);
    } catch (err: any) {
      toastError('Fetch Error', err.message);
    } finally {
      setLoadingTests(false);
    }
  };

  const handleAttachTest = async (testItem: TestSeriesItem) => {
    if (!selectedModuleId) return;
    setAttachingTestId(testItem.id);
    try {
      const sortOrder = (selectedModule?.tests?.length || 0) + 1;
      await courseService.attachTestToModule(selectedModuleId, testItem.id, sortOrder);
      success('Test Attached', `Attached "${testItem.title}" to this module.`);
      await loadCourseData();
    } catch (err: any) {
      toastError('Attach Failed', err.message);
    } finally {
      setAttachingTestId(null);
    }
  };

  const handleDetachTest = async (moduleTestId: string) => {
    try {
      await courseService.detachTestFromModule(moduleTestId);
      success('Test Removed', 'Removed test from this module.');
      await loadCourseData();
    } catch (err: any) {
      toastError('Detach Failed', err.message);
    }
  };

  // ==========================================
  // QUIZ QUESTIONS ATTACHMENT
  // ==========================================
  const openQuizSelector = async () => {
    setIsQuizSelectorOpen(true);
    setLoadingQuestions(true);
    setSelectedQuestionIds([]);
    try {
      const [questionsData, chaptersData] = await Promise.all([
        questionService.getQuestions(),
        chapterService.getChapters(),
      ]);
      setAllQuestions(questionsData);
      setAllChapters(chaptersData);
    } catch (err: any) {
      toastError('Fetch Error', err.message);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleToggleQuestionSelect = (qId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleSaveQuizSelection = async () => {
    if (!selectedModuleId || selectedQuestionIds.length === 0) return;
    setIsAttachingQuestions(true);
    try {
      await courseService.attachQuestionsToModule(selectedModuleId, selectedQuestionIds);
      success('Questions Added', `Added ${selectedQuestionIds.length} questions to module quiz.`);
      setIsQuizSelectorOpen(false);
      await loadCourseData();
    } catch (err: any) {
      toastError('Quiz Error', err.message);
    } finally {
      setIsAttachingQuestions(false);
    }
  };

  const handleDetachQuestion = async (moduleQuestionId: string) => {
    try {
      await courseService.detachQuestionFromModule(moduleQuestionId);
      success('Question Removed', 'Removed question from module quiz.');
      await loadCourseData();
    } catch (err: any) {
      toastError('Detach Failed', err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={3} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-12 text-center text-dark-muted space-y-4">
        <p>Course not found.</p>
        <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
      </div>
    );
  }

  // Filtered selector lists
  const attachedNoteIds = selectedModule?.notes?.map((n) => n.note_id) || [];
  const filteredNotes = allNotes.filter((n) => {
    const query = noteSearch.toLowerCase();
    const matchSearch =
      n.title.toLowerCase().includes(query) ||
      (n.hindi_title && n.hindi_title.toLowerCase().includes(query));
    const matchCat = noteCategoryFilter === '' ? true : n.category_id === noteCategoryFilter;
    return matchSearch && matchCat;
  });

  const attachedTestIds = selectedModule?.tests?.map((t) => t.test_id) || [];
  const filteredTests = allTests.filter((t) => {
    const query = testSearch.toLowerCase();
    return t.title.toLowerCase().includes(query);
  });

  const attachedQuestionIds = selectedModule?.questions?.map((q) => q.question_id) || [];
  const filteredQuestions = allQuestions.filter((q) => {
    const query = quizSearch.toLowerCase();
    const matchSearch =
      q.question_en.toLowerCase().includes(query) ||
      q.question_hi.toLowerCase().includes(query);
    const matchChapter = quizChapterFilter === '' ? true : q.chapter_id === quizChapterFilter;
    const matchDiff = quizDifficultyFilter === '' ? true : q.difficulty === quizDifficultyFilter;
    return matchSearch && matchChapter && matchDiff;
  });

  return (
    <div className="space-y-5">
      {/* Top Header Bar */}
      <div className="p-5 rounded-3xl bg-background-card border border-dark-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/courses')}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            All Courses
          </Button>

          <div className="h-6 w-px bg-dark-border" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lavender-500/20 border border-lavender-500/30 flex items-center justify-center text-lavender-300 flex-shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base text-white">{course.title}</h1>
                <Badge variant={course.is_published ? 'success' : 'neutral'} size="sm" dot>
                  {course.is_published ? 'Published' : 'Draft'}
                </Badge>
                {course.is_paid ? (
                  <Badge variant="primary" size="sm">₹{course.price}</Badge>
                ) : (
                  <Badge variant="success" size="sm">Free</Badge>
                )}
              </div>
              <p className="text-[11px] text-dark-muted font-medium">
                {course.title_hi} · {course.modules?.length || 0} Modules Total
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openCreateModuleModal}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Module
          </Button>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANEL: Module Navigator */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-4 rounded-3xl bg-background-card border border-dark-border shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-lavender-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Course Modules ({course.modules?.length || 0})
                </h3>
              </div>
              <button
                onClick={openCreateModuleModal}
                className="p-1 rounded-lg text-lavender-300 hover:bg-lavender-500/10 transition-colors"
                title="Add Module"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Modules List */}
            {(!course.modules || course.modules.length === 0) ? (
              <div className="p-8 text-center rounded-2xl bg-background-elevated/40 border border-dashed border-dark-border text-dark-muted space-y-2">
                <Layers className="w-8 h-8 mx-auto text-dark-dim" />
                <p className="text-xs font-medium">No chapters created yet.</p>
                <Button size="sm" onClick={openCreateModuleModal} leftIcon={<Plus className="w-3 h-3" />}>
                  Create First Module
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {course.modules.map((mod, index) => {
                  const isSelected = mod.id === selectedModuleId;
                  const lessonsCount = mod.lessons?.length || 0;
                  const notesCount = mod.notes?.length || 0;
                  const testsCount = mod.tests?.length || 0;
                  const quizCount = mod.questions?.length || 0;

                  return (
                    <div
                      key={mod.id}
                      onClick={() => setSelectedModuleId(mod.id)}
                      className={cn(
                        'p-3 rounded-2xl border transition-all cursor-pointer select-none group',
                        isSelected
                          ? 'bg-gradient-to-r from-lavender-600/20 to-lavender-500/10 border-lavender-500/50 shadow-glow-sm'
                          : 'bg-background-elevated/60 border-dark-border hover:border-lavender-500/30 hover:bg-background-elevated'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-lavender-400 font-bold">
                              #{index + 1}
                            </span>
                            <span className={cn(
                              'text-xs font-bold truncate',
                              isSelected ? 'text-white' : 'text-dark-text group-hover:text-white'
                            )}>
                              {mod.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-dark-muted truncate">{mod.title_hi}</p>

                          {/* Resource Badges */}
                          <div className="flex items-center gap-2 pt-1 text-[10px] text-dark-dim">
                            <span title="Lessons" className="flex items-center gap-0.5">
                              <FileText className="w-3 h-3 text-indigo-400" /> {lessonsCount}
                            </span>
                            <span title="Notes" className="flex items-center gap-0.5">
                              <BookOpen className="w-3 h-3 text-emerald-400" /> {notesCount}
                            </span>
                            <span title="Quiz Questions" className="flex items-center gap-0.5">
                              <HelpCircle className="w-3 h-3 text-amber-400" /> {quizCount}
                            </span>
                            <span title="Tests" className="flex items-center gap-0.5">
                              <FileCheck className="w-3 h-3 text-purple-400" /> {testsCount}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleMoveModule(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-dark-dim hover:text-white disabled:opacity-20 rounded"
                            title="Move Up"
                          >
                            <MoveUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveModule(index, 'down')}
                            disabled={index === (course.modules?.length || 0) - 1}
                            className="p-1 text-dark-dim hover:text-white disabled:opacity-20 rounded"
                            title="Move Down"
                          >
                            <MoveDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => openEditModuleModal(mod)}
                            className="p-1 text-dark-muted hover:text-lavender-300 rounded"
                            title="Edit Module"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeleteModuleTarget(mod)}
                            className="p-1 text-dark-muted hover:text-rose-400 rounded"
                            title="Delete Module"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Selected Module Workspace */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedModule ? (
            <div className="p-12 rounded-3xl bg-background-card border border-dark-border text-center text-dark-muted space-y-3">
              <Layers className="w-12 h-12 mx-auto text-dark-dim" />
              <h3 className="text-base font-bold text-white">No Module Selected</h3>
              <p className="text-xs">Create or select a module from the left panel to manage its lessons, notes, tests, and quizzes.</p>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-background-card border border-dark-border shadow-card space-y-6">
              {/* Module Header & Tabs */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dark-border/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-extrabold text-white">{selectedModule.title}</h2>
                      <Badge variant={selectedModule.is_published ? 'success' : 'neutral'} size="sm" dot>
                        {selectedModule.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-xs text-dark-muted">{selectedModule.title_hi}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModuleModal(selectedModule)}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Module Settings
                    </Button>
                  </div>
                </div>

                {/* Tabs Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[
                    { id: 'lessons', label: `Lessons (${selectedModule.lessons?.length || 0})`, icon: <FileText className="w-3.5 h-3.5" /> },
                    { id: 'notes', label: `PDF Notes (${selectedModule.notes?.length || 0})`, icon: <BookOpen className="w-3.5 h-3.5" /> },
                    { id: 'quiz', label: `Quiz Questions (${selectedModule.questions?.length || 0})`, icon: <HelpCircle className="w-3.5 h-3.5" /> },
                    { id: 'test', label: `Mock Tests (${selectedModule.tests?.length || 0})`, icon: <FileCheck className="w-3.5 h-3.5" /> },
                    { id: 'overview', label: 'Overview', icon: <Settings className="w-3.5 h-3.5" /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as ModuleTab)}
                      className={cn(
                        'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap',
                        activeTab === tab.id
                          ? 'bg-lavender-500 text-white shadow-glow-sm'
                          : 'bg-background-elevated/70 text-dark-muted hover:text-white hover:bg-background-elevated'
                      )}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ========================================== */}
              {/* TAB 1: LESSONS */}
              {/* ========================================== */}
              {activeTab === 'lessons' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-dark-dim">
                        Lessons in Chapter
                      </h4>
                      <p className="text-[11px] text-dark-muted">
                        Video tutorials, reading lessons, or mixed format content
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={openCreateLessonModal}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Lesson
                    </Button>
                  </div>

                  {(!selectedModule.lessons || selectedModule.lessons.length === 0) ? (
                    <div className="p-8 text-center rounded-2xl bg-background-elevated/40 border border-dashed border-dark-border text-dark-muted space-y-2">
                      <FileText className="w-8 h-8 mx-auto text-dark-dim" />
                      <p className="text-xs font-medium">No lessons added to this module yet.</p>
                      <Button size="sm" onClick={openCreateLessonModal} leftIcon={<Plus className="w-3 h-3" />}>
                        Add First Lesson
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedModule.lessons.map((lesson, idx) => (
                        <div
                          key={lesson.id}
                          className="p-3.5 rounded-2xl bg-background-elevated/60 border border-dark-border hover:border-lavender-500/30 transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-lavender-500/10 text-lavender-400 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                              {idx + 1}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white truncate">
                                  {lesson.title}
                                </span>
                                <Badge
                                  variant={lesson.lesson_type === 'video' ? 'primary' : lesson.lesson_type === 'mixed' ? 'warning' : 'neutral'}
                                  size="sm"
                                  className="capitalize text-[10px]"
                                >
                                  {lesson.lesson_type}
                                </Badge>
                                {lesson.is_free_preview && (
                                  <Badge variant="success" size="sm" className="text-[10px]">
                                    Free Preview
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-dark-muted truncate">{lesson.title_hi}</p>
                              <div className="flex items-center gap-3 text-[10px] text-dark-dim">
                                {lesson.duration_minutes > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-lavender-400" />
                                    {lesson.duration_minutes} mins
                                  </span>
                                )}
                                {lesson.video_url && (
                                  <span className="flex items-center gap-1 font-mono truncate max-w-[200px]">
                                    <Video className="w-3 h-3 text-indigo-400" />
                                    {lesson.video_url}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleMoveLesson(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1.5 text-dark-dim hover:text-white disabled:opacity-20 rounded-lg"
                              title="Move Up"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveLesson(idx, 'down')}
                              disabled={idx === (selectedModule.lessons?.length || 0) - 1}
                              className="p-1.5 text-dark-dim hover:text-white disabled:opacity-20 rounded-lg"
                              title="Move Down"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setPreviewingLesson(lesson)}
                              className="p-1.5 text-dark-muted hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Preview Lesson"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditLessonModal(lesson)}
                              className="p-1.5 text-dark-muted hover:text-lavender-300 hover:bg-lavender-500/10 rounded-lg transition-colors"
                              title="Edit Lesson"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteLessonTarget(lesson)}
                              className="p-1.5 text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Delete Lesson"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================== */}
              {/* TAB 2: PDF NOTES */}
              {/* ========================================== */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-dark-dim">
                        Attached PDF Notes ({selectedModule.notes?.length || 0})
                      </h4>
                      <p className="text-[11px] text-dark-muted">
                        Reusing existing notes from your central PDF library
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={openNoteSelector}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Attach Existing Note
                    </Button>
                  </div>

                  {(!selectedModule.notes || selectedModule.notes.length === 0) ? (
                    <div className="p-8 text-center rounded-2xl bg-background-elevated/40 border border-dashed border-dark-border text-dark-muted space-y-2">
                      <BookOpen className="w-8 h-8 mx-auto text-dark-dim" />
                      <p className="text-xs font-medium">No PDF notes attached to this chapter.</p>
                      <Button size="sm" onClick={openNoteSelector} leftIcon={<Plus className="w-3 h-3" />}>
                        Select PDF Note
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedModule.notes.map((mn) => (
                        <div
                          key={mn.id}
                          className="p-3.5 rounded-2xl bg-background-elevated/60 border border-dark-border flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                {mn.note?.title || 'Unknown Note'}
                              </p>
                              <p className="text-[11px] text-dark-muted truncate">
                                {mn.note?.hindi_title}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-dark-dim">
                                {mn.note?.page_count && <span>{mn.note.page_count} pages</span>}
                                {mn.note?.pdf_url && (
                                  <a
                                    href={mn.note.pdf_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-lavender-400 hover:underline flex items-center gap-1"
                                  >
                                    View PDF <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDetachNote(mn.id, mn.note?.title || 'Note')}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================== */}
              {/* TAB 3: QUIZ QUESTIONS */}
              {/* ========================================== */}
              {activeTab === 'quiz' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-dark-dim">
                        Module Quiz Questions ({selectedModule.questions?.length || 0})
                      </h4>
                      <p className="text-[11px] text-dark-muted">
                        Explicitly curated questions from Question Bank for chapter quiz
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={openQuizSelector}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Select Questions
                    </Button>
                  </div>

                  {(!selectedModule.questions || selectedModule.questions.length === 0) ? (
                    <div className="p-8 text-center rounded-2xl bg-background-elevated/40 border border-dashed border-dark-border text-dark-muted space-y-2">
                      <HelpCircle className="w-8 h-8 mx-auto text-dark-dim" />
                      <p className="text-xs font-medium">No quiz questions selected for this module yet.</p>
                      <Button size="sm" onClick={openQuizSelector} leftIcon={<Plus className="w-3 h-3" />}>
                        Select from Question Bank
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedModule.questions.map((mq, idx) => (
                        <div
                          key={mq.id}
                          className="p-3.5 rounded-2xl bg-background-elevated/60 border border-dark-border space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-lavender-400">
                                  Q{idx + 1}.
                                </span>
                                <Badge variant="neutral" size="sm" className="text-[10px]">
                                  {mq.question?.difficulty || 'Medium'}
                                </Badge>
                                <Badge variant="primary" size="sm" className="text-[10px]">
                                  {mq.question?.question_type || 'MCQ'}
                                </Badge>
                                <span className="text-xs font-bold text-white">
                                  Correct: Option {mq.question?.correct_option}
                                </span>
                              </div>
                              <p className="text-xs text-white leading-relaxed font-medium">
                                {mq.question?.question_en}
                              </p>
                              <p className="text-[11px] text-dark-muted leading-relaxed">
                                {mq.question?.question_hi}
                              </p>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDetachQuestion(mq.id)}
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================== */}
              {/* TAB 4: MOCK TESTS */}
              {/* ========================================== */}
              {activeTab === 'test' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-dark-dim">
                        Attached Tests ({selectedModule.tests?.length || 0})
                      </h4>
                      <p className="text-[11px] text-dark-muted">
                        Link full tests or chapter exams from the existing Test Series module
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={openTestSelector}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Attach Existing Test
                    </Button>
                  </div>

                  {(!selectedModule.tests || selectedModule.tests.length === 0) ? (
                    <div className="p-8 text-center rounded-2xl bg-background-elevated/40 border border-dashed border-dark-border text-dark-muted space-y-2">
                      <FileCheck className="w-8 h-8 mx-auto text-dark-dim" />
                      <p className="text-xs font-medium">No tests linked to this module.</p>
                      <Button size="sm" onClick={openTestSelector} leftIcon={<Plus className="w-3 h-3" />}>
                        Select Test Set
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedModule.tests.map((mt) => (
                        <div
                          key={mt.id}
                          className="p-3.5 rounded-2xl bg-background-elevated/60 border border-dark-border flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                              <FileCheck className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white truncate">
                                  {mt.test_item?.title || 'Unknown Test'}
                                </span>
                                <Badge variant="primary" size="sm" className="text-[10px]">
                                  {mt.test_item?.test_type || 'Mock'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-dark-muted">
                                <span>{mt.test_item?.question_count || 100} Questions</span>
                                <span>{mt.test_item?.duration || 90} mins</span>
                                <span>{mt.test_item?.total_marks || 100} Marks</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDetachTest(mt.id)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================== */}
              {/* TAB 5: OVERVIEW & SETTINGS */}
              {/* ========================================== */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-background-elevated/60 border border-dark-border space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Module Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-dark-muted">English Title:</span>
                        <p className="font-bold text-white mt-0.5">{selectedModule.title}</p>
                      </div>
                      <div>
                        <span className="text-dark-muted">Hindi Title:</span>
                        <p className="font-bold text-white mt-0.5">{selectedModule.title_hi}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-dark-muted">Description:</span>
                        <p className="text-dark-text mt-0.5">
                          {selectedModule.description || 'No English description provided.'}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-dark-muted">Hindi Description:</span>
                        <p className="text-dark-text mt-0.5">
                          {selectedModule.description_hi || 'कोई हिंदी विवरण नहीं दिया गया।'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-dark-border/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={selectedModule.is_published ? 'success' : 'neutral'} dot>
                          {selectedModule.is_published ? 'Published to Students' : 'Draft Only'}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openEditModuleModal(selectedModule)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit Module Details
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* MODALS */}
      {/* ========================================== */}

      {/* 1. Add / Edit Module Modal */}
      <Modal
        isOpen={isModuleModalOpen}
        onClose={() => setIsModuleModalOpen(false)}
        title={editingModule ? 'Edit Module / Chapter' : 'Add New Module'}
        subtitle="Chapters group lessons, notes, tests, and quizzes inside the course."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModuleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveModule} isLoading={isSavingModule}>
              {editingModule ? 'Save Changes' : 'Create Module'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveModule} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Module Title (English) *"
              placeholder="e.g. Chapter 1: Introduction to Computer"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              error={moduleFormErrors.title}
              required
            />
            <Input
              label="Module Title (Hindi) *"
              placeholder="e.g. अध्याय 1: कंप्यूटर का परिचय"
              value={moduleTitleHi}
              onChange={(e) => setModuleTitleHi(e.target.value)}
              error={moduleFormErrors.titleHi}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Description (English)"
              placeholder="Overview of topics in this chapter..."
              rows={3}
              value={moduleDesc}
              onChange={(e) => setModuleDesc(e.target.value)}
            />
            <Textarea
              label="Description (Hindi)"
              placeholder="इस अध्याय के विषयों का विवरण..."
              rows={3}
              value={moduleDescHi}
              onChange={(e) => setModuleDescHi(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-xl bg-background-elevated/50 border border-dark-border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Publish Module</p>
                <p className="text-[10px] text-dark-muted">Visible to enrolled users</p>
              </div>
              <Switch checked={modulePublished} onChange={setModulePublished} />
            </div>

            <Input
              label="Sort Order"
              type="number"
              value={moduleSortOrder}
              onChange={(e) => setModuleSortOrder(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* 2. Add / Edit Lesson Modal */}
      <Modal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        title={editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
        subtitle="Create video or text-based lesson with bilingual content."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsLessonModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLesson} isLoading={isSavingLesson}>
              {editingLesson ? 'Save Lesson' : 'Add Lesson'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveLesson} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Lesson Title (English) *"
              placeholder="e.g. Understanding Operating Systems"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              error={lessonFormErrors.title}
              required
            />
            <Input
              label="Lesson Title (Hindi) *"
              placeholder="e.g. ऑपरेटिंग सिस्टम को समझना"
              value={lessonTitleHi}
              onChange={(e) => setLessonTitleHi(e.target.value)}
              error={lessonFormErrors.titleHi}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Lesson Type"
              value={lessonType}
              onChange={(e) => setLessonType(e.target.value as LessonType)}
              options={LESSON_TYPE_OPTIONS}
            />
            <Input
              label="Estimated Duration (Minutes)"
              type="number"
              value={lessonDuration}
              onChange={(e) => setLessonDuration(e.target.value)}
            />
          </div>

          {(lessonType === 'video' || lessonType === 'mixed') && (
            <Input
              label="Video URL (YouTube / Vimeo / MP4 / HLS) *"
              placeholder="https://www.youtube.com/watch?v=... or https://..."
              value={lessonVideoUrl}
              onChange={(e) => setLessonVideoUrl(e.target.value)}
              error={lessonFormErrors.videoUrl}
              helperText="Embeddable video link streamable inside mobile app"
              required
            />
          )}

          {(lessonType === 'text' || lessonType === 'mixed') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="Lesson Content (English)"
                placeholder="Full lesson text / notes / key points..."
                rows={5}
                value={lessonContent}
                onChange={(e) => setLessonContent(e.target.value)}
              />
              <Textarea
                label="Lesson Content (Hindi)"
                placeholder="पाठ की मुख्य सामग्री / नोट्स..."
                rows={5}
                value={lessonContentHi}
                onChange={(e) => setLessonContentHi(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-3 rounded-xl bg-background-elevated/50 border border-dark-border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Free Preview</p>
                <p className="text-[10px] text-dark-muted">Unlocked in paid course</p>
              </div>
              <Switch checked={lessonIsPreview} onChange={setLessonIsPreview} />
            </div>

            <div className="p-3 rounded-xl bg-background-elevated/50 border border-dark-border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Published</p>
                <p className="text-[10px] text-dark-muted">Active for students</p>
              </div>
              <Switch checked={lessonPublished} onChange={setLessonPublished} />
            </div>

            <Input
              label="Sort Order"
              type="number"
              value={lessonSortOrder}
              onChange={(e) => setLessonSortOrder(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* 3. Note Selector Modal */}
      <Modal
        isOpen={isNoteSelectorOpen}
        onClose={() => setIsNoteSelectorOpen(false)}
        title="Attach PDF Notes from Content Library"
        subtitle="Select any existing verified PDF note without duplicating database records."
        size="lg"
        footer={
          <Button variant="ghost" onClick={() => setIsNoteSelectorOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Search notes by title..."
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-dark-muted" />}
            />
            <Select
              value={noteCategoryFilter}
              onChange={(e) => setNoteCategoryFilter(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...noteCategories.map((c) => ({ value: c.id, label: c.title })),
              ]}
            />
          </div>

          {loadingNotes ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredNotes.map((note) => {
                const isAttached = attachedNoteIds.includes(note.id);
                return (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-background-elevated/50 border border-dark-border flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{note.title}</p>
                      <p className="text-[11px] text-dark-muted truncate">{note.hindi_title}</p>
                    </div>
                    {isAttached ? (
                      <Badge variant="success" size="sm">Attached</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={attachingNoteId === note.id}
                        onClick={() => handleAttachNote(note)}
                        leftIcon={<Plus className="w-3 h-3" />}
                      >
                        Attach
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* 4. Test Selector Modal */}
      <Modal
        isOpen={isTestSelectorOpen}
        onClose={() => setIsTestSelectorOpen(false)}
        title="Attach Mock / Topic Test"
        subtitle="Select an existing test series set to attach as chapter assessment."
        size="lg"
        footer={
          <Button variant="ghost" onClick={() => setIsTestSelectorOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="space-y-4">
          <Input
            placeholder="Search test sets by title..."
            value={testSearch}
            onChange={(e) => setTestSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-dark-muted" />}
          />

          {loadingTests ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredTests.map((testItem) => {
                const isAttached = attachedTestIds.includes(testItem.id);
                return (
                  <div
                    key={testItem.id}
                    className="p-3 rounded-xl bg-background-elevated/50 border border-dark-border flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{testItem.title}</span>
                        <Badge variant="primary" size="sm" className="text-[10px]">{testItem.test_type}</Badge>
                      </div>
                      <p className="text-[11px] text-dark-muted">
                        {testItem.question_count} Questions · {testItem.duration} mins · {testItem.difficulty}
                      </p>
                    </div>
                    {isAttached ? (
                      <Badge variant="success" size="sm">Attached</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={attachingTestId === testItem.id}
                        onClick={() => handleAttachTest(testItem)}
                        leftIcon={<Plus className="w-3 h-3" />}
                      >
                        Attach
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* 5. Quiz Questions Selector Modal */}
      <Modal
        isOpen={isQuizSelectorOpen}
        onClose={() => setIsQuizSelectorOpen(false)}
        title="Select Questions for Module Quiz"
        subtitle="Choose questions from the central question bank to assemble a quiz."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsQuizSelectorOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuizSelection}
              isLoading={isAttachingQuestions}
              disabled={selectedQuestionIds.length === 0}
            >
              Add Selected ({selectedQuestionIds.length})
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Search question text..."
              value={quizSearch}
              onChange={(e) => setQuizSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-dark-muted" />}
            />
            <Select
              value={quizChapterFilter}
              onChange={(e) => setQuizChapterFilter(e.target.value)}
              options={[
                { value: '', label: 'All Chapters' },
                ...allChapters.map((c) => ({ value: c.id, label: `${c.sort_order}. ${c.title}` })),
              ]}
            />
            <Select
              value={quizDifficultyFilter}
              onChange={(e) => setQuizDifficultyFilter(e.target.value)}
              options={[
                { value: '', label: 'All Difficulties' },
                { value: 'Easy', label: 'Easy' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Hard', label: 'Hard' },
              ]}
            />
          </div>

          {loadingQuestions ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredQuestions.map((q) => {
                const isAlreadyAttached = attachedQuestionIds.includes(q.id);
                const isChecked = selectedQuestionIds.includes(q.id);

                return (
                  <div
                    key={q.id}
                    onClick={() => !isAlreadyAttached && handleToggleQuestionSelect(q.id)}
                    className={cn(
                      'p-3 rounded-xl border transition-all flex items-start gap-3 select-none',
                      isAlreadyAttached
                        ? 'bg-background-elevated/30 border-dark-border opacity-50 cursor-not-allowed'
                        : isChecked
                        ? 'bg-lavender-500/10 border-lavender-500 cursor-pointer shadow-sm'
                        : 'bg-background-elevated/50 border-dark-border hover:border-lavender-500/30 cursor-pointer'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked || isAlreadyAttached}
                      disabled={isAlreadyAttached}
                      onChange={() => {}}
                      className="mt-1 rounded border-dark-border text-lavender-500 focus:ring-lavender-500"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral" size="sm" className="text-[10px]">{q.difficulty}</Badge>
                        <span className="text-[11px] text-dark-muted font-bold">
                          Option {q.correct_option} is correct
                        </span>
                        {isAlreadyAttached && <Badge variant="success" size="sm" className="text-[10px]">Already in Quiz</Badge>}
                      </div>
                      <p className="text-xs text-white leading-snug">{q.question_en}</p>
                      <p className="text-[11px] text-dark-muted leading-snug">{q.question_hi}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* 6. Preview Lesson Modal */}
      <Modal
        isOpen={Boolean(previewingLesson)}
        onClose={() => setPreviewingLesson(null)}
        title={previewingLesson?.title || 'Lesson Preview'}
        subtitle={previewingLesson?.title_hi || ''}
        size="lg"
        footer={
          <Button onClick={() => setPreviewingLesson(null)}>
            Close Preview
          </Button>
        }
      >
        {previewingLesson && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm" className="capitalize">
                {previewingLesson.lesson_type} Lesson
              </Badge>
              {previewingLesson.is_free_preview && (
                <Badge variant="success" size="sm">Free Preview Enabled</Badge>
              )}
              {previewingLesson.duration_minutes > 0 && (
                <span className="text-xs text-dark-muted">
                  ⏱ {previewingLesson.duration_minutes} mins
                </span>
              )}
            </div>

            {previewingLesson.video_url && (
              <div className="p-3 rounded-2xl bg-background border border-dark-border space-y-2">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-indigo-400" /> Video URL:
                </p>
                <a
                  href={previewingLesson.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-lavender-300 hover:underline break-all block"
                >
                  {previewingLesson.video_url}
                </a>
              </div>
            )}

            {previewingLesson.content && (
              <div className="p-4 rounded-2xl bg-background border border-dark-border space-y-2">
                <p className="text-xs font-bold text-lavender-400 uppercase tracking-wider">
                  English Lesson Content
                </p>
                <p className="text-xs text-white whitespace-pre-wrap leading-relaxed">
                  {previewingLesson.content}
                </p>
              </div>
            )}

            {previewingLesson.content_hi && (
              <div className="p-4 rounded-2xl bg-background border border-dark-border space-y-2">
                <p className="text-xs font-bold text-lavender-400 uppercase tracking-wider">
                  Hindi Lesson Content
                </p>
                <p className="text-xs text-white whitespace-pre-wrap leading-relaxed">
                  {previewingLesson.content_hi}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Module Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteModuleTarget)}
        onClose={() => setDeleteModuleTarget(null)}
        onConfirm={handleConfirmDeleteModule}
        isLoading={isDeletingModule}
        title="Delete Chapter Module"
        message={`Are you sure you want to delete module "${deleteModuleTarget?.title}"? All its lessons and quiz links will be removed.`}
      />

      {/* Delete Lesson Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteLessonTarget)}
        onClose={() => setDeleteLessonTarget(null)}
        onConfirm={handleConfirmDeleteLesson}
        isLoading={isDeletingLesson}
        title="Delete Lesson"
        message={`Are you sure you want to delete lesson "${deleteLessonTarget?.title}"?`}
      />
    </div>
  );
};
