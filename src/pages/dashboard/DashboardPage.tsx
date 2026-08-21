import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileQuestion,
  Layers,
  FileText,
  BookOpen,
  Newspaper,
  BookMarked,
  Users,
  FolderTree,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import { testService } from '../../services/testService';
import { questionService } from '../../services/questionService';
import { chapterService } from '../../services/chapterService';
import { noteService } from '../../services/noteService';
import { blogService } from '../../services/blogService';
import { bookService } from '../../services/bookService';
import { enrollmentService } from '../../services/enrollmentService';
import {
  Question,
  TestCategory,
  TestSeries,
  TestSeriesItem,
  Chapter,
  Note,
  Blog,
  Book,
  SeriesEnrollment,
} from '../../types/database';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton, CardSkeleton } from '../../components/common/LoadingSkeleton';
import { ROUTES } from '../../constants/routes';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [testCategories, setTestCategories] = useState<TestCategory[]>([]);
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [testSeriesItems, setTestSeriesItems] = useState<TestSeriesItem[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [enrollments, setEnrollments] = useState<SeriesEnrollment[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [
          questionsData,
          categoriesData,
          seriesData,
          itemsData,
          chaptersData,
          notesData,
          blogsData,
          booksData,
          enrollmentsData,
        ] = await Promise.allSettled([
          questionService.getQuestions(),
          testService.getCategories(),
          testService.getSeries(),
          testService.getSeriesItems(),
          chapterService.getChapters(),
          noteService.getNotes(),
          blogService.getBlogs(),
          bookService.getBooks(),
          enrollmentService.getEnrollments(),
        ]);

        if (questionsData.status === 'fulfilled') setQuestions(questionsData.value);
        if (categoriesData.status === 'fulfilled') setTestCategories(categoriesData.value);
        if (seriesData.status === 'fulfilled') setTestSeries(seriesData.value);
        if (itemsData.status === 'fulfilled') setTestSeriesItems(itemsData.value);
        if (chaptersData.status === 'fulfilled') setChapters(chaptersData.value);
        if (notesData.status === 'fulfilled') setNotes(notesData.value);
        if (blogsData.status === 'fulfilled') setBlogs(blogsData.value);
        if (booksData.status === 'fulfilled') setBooks(booksData.value);
        if (enrollmentsData.status === 'fulfilled') setEnrollments(enrollmentsData.value);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalQuestions = questions.length;
  const totalCategories = testCategories.length;
  const totalSeries = testSeries.length;
  const totalSets = testSeriesItems.length;
  const totalNotes = notes.length;
  const totalBlogs = blogs.length;
  const totalBooks = books.length;
  const totalEnrolled = enrollments.length;

  const publishedBlogs = blogs.filter((b) => b.is_published).length;
  const featuredSeries = testSeries.filter((s) => s.is_featured);

  const easyQuestions = questions.filter((q) => q.difficulty === 'Easy').length;
  const mediumQuestions = questions.filter((q) => q.difficulty === 'Medium').length;
  const hardQuestions = questions.filter((q) => q.difficulty === 'Hard').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative p-6 md:p-8 rounded-3xl bg-gradient-to-r from-lavender-900/40 via-background-card to-background-card border border-lavender-500/30 overflow-hidden shadow-card">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-lavender-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">
                Supabase Live Database
              </Badge>
              <span className="text-xs text-dark-muted">• Real-Time Backend</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              CCC Prep Admin Console
            </h1>
            <p className="text-sm text-dark-muted leading-relaxed">
              Manage bilingual question banks, practice test sets, chapter notes, affiliate books, and student enrollments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => navigate(ROUTES.QUESTIONS)}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Add New Question
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(ROUTES.TEST_SERIES_ITEMS)}
            >
              Manage Test Sets
            </Button>
          </div>
        </div>
      </div>

      {/* Top 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Questions"
          value={totalQuestions}
          subtitle="Bilingual MCQs & True/False"
          icon={<FileQuestion className="w-6 h-6" />}
          onClick={() => navigate(ROUTES.QUESTIONS)}
        />
        <StatCard
          title="Active Test Series"
          value={totalSeries}
          subtitle={`${totalSets} Total Test Sets`}
          icon={<Layers className="w-6 h-6" />}
          onClick={() => navigate(ROUTES.TEST_SERIES)}
        />
        <StatCard
          title="PDF Notes"
          value={totalNotes}
          subtitle="Handouts & Shortcuts"
          icon={<FileText className="w-6 h-6" />}
          onClick={() => navigate(ROUTES.NOTES)}
        />
        <StatCard
          title="Enrolled Students"
          value={totalEnrolled}
          subtitle="Active App Registrations"
          icon={<Users className="w-6 h-6" />}
          onClick={() => navigate(ROUTES.ENROLLMENTS)}
        />
      </div>

      {/* Secondary Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-background-card border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-xs text-dark-muted font-medium">Test Categories</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalCategories}</p>
          </div>
          <FolderTree className="w-5 h-5 text-lavender-400" />
        </div>
        <div className="p-4 rounded-2xl bg-background-card border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-xs text-dark-muted font-medium">Published Blogs</p>
            <p className="text-xl font-bold text-white mt-0.5">{publishedBlogs} / {totalBlogs}</p>
          </div>
          <Newspaper className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="p-4 rounded-2xl bg-background-card border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-xs text-dark-muted font-medium">Recommended Books</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalBooks}</p>
          </div>
          <BookMarked className="w-5 h-5 text-amber-400" />
        </div>
        <div className="p-4 rounded-2xl bg-background-card border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-xs text-dark-muted font-medium">Syllabus Chapters</p>
            <p className="text-xl font-bold text-white mt-0.5">{chapters.length}</p>
          </div>
          <BookOpen className="w-5 h-5 text-sky-400" />
        </div>
      </div>

      {/* Distribution Charts & Featured Series Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Difficulty Distribution */}
        <div className="p-6 rounded-3xl bg-background-card border border-dark-border space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Question Difficulty</h3>
              <p className="text-xs text-dark-muted">Bank distribution by difficulty</p>
            </div>
            <Badge variant="neutral" size="sm">{totalQuestions} Total</Badge>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-300 font-medium">Easy</span>
                <span className="text-white font-bold">{easyQuestions}</span>
              </div>
              <div className="h-2 w-full bg-background-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(easyQuestions / (totalQuestions || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-300 font-medium">Medium</span>
                <span className="text-white font-bold">{mediumQuestions}</span>
              </div>
              <div className="h-2 w-full bg-background-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${(mediumQuestions / (totalQuestions || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-rose-300 font-medium">Hard</span>
                <span className="text-white font-bold">{hardQuestions}</span>
              </div>
              <div className="h-2 w-full bg-background-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all"
                  style={{ width: `${(hardQuestions / (totalQuestions || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-dark-border/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-dark-muted mb-3">
              Chapters with Questions
            </h4>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {chapters.length === 0 ? (
                <p className="text-xs text-dark-dim italic">No chapters created yet</p>
              ) : (
                chapters.slice(0, 6).map((ch, idx) => {
                  const count = questions.filter((q) => q.chapter_id === ch.id).length;
                  return (
                    <div key={ch.id} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-background-elevated/40">
                      <span className="text-dark-muted truncate max-w-[200px]">
                        {idx + 1}. {ch.title}
                      </span>
                      <span className="font-semibold text-lavender-300">{count} Qs</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Featured Test Series List */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-background-card border border-dark-border space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Featured Test Series</h3>
              <p className="text-xs text-dark-muted">Promoted on mobile app home screen</p>
            </div>
            <Link
              to={ROUTES.TEST_SERIES}
              className="text-xs text-lavender-400 hover:text-lavender-300 flex items-center gap-1 font-medium"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {featuredSeries.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-background-elevated/30 border border-dark-border text-xs text-dark-muted">
              No featured test series currently marked. Create or edit a series to feature it.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredSeries.map((series) => (
                <div
                  key={series.id}
                  onClick={() => navigate(ROUTES.TEST_SERIES)}
                  className="p-5 rounded-2xl bg-background-elevated/50 hover:bg-background-elevated border border-dark-border hover:border-lavender-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="primary" size="sm">
                      {series.featured_tag || 'FEATURED'}
                    </Badge>
                    <span className="text-xs text-emerald-400 font-bold">
                      {series.is_paid ? `₹${series.price}` : 'FREE'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-lavender-300 transition-colors line-clamp-1">
                    {series.title}
                  </h4>
                  <p className="text-xs text-dark-muted mt-1 line-clamp-2 leading-relaxed">
                    {series.featured_short_desc || series.description || 'No description provided'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-dark-border/60 flex items-center justify-between text-xs text-dark-dim">
                    <span>{series.total_sets_available ?? series.total_sets ?? 0} Test Sets</span>
                    <span className="flex items-center gap-1 text-lavender-400">
                      <Users className="w-3.5 h-3.5" />
                      {series.total_enrolled} Enrolled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Shortcuts Bar */}
          <div className="p-4 rounded-2xl bg-background-subtle/70 border border-dark-border flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-dark-muted font-medium">Quick Content Shortcuts:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={ROUTES.NOTES}>
                <button className="px-3 py-1 text-xs rounded-xl bg-background-elevated hover:bg-lavender-500/20 text-white border border-dark-border hover:border-lavender-500/40 transition-all">
                  + Upload PDF Note
                </button>
              </Link>
              <Link to={ROUTES.BLOGS}>
                <button className="px-3 py-1 text-xs rounded-xl bg-background-elevated hover:bg-lavender-500/20 text-white border border-dark-border hover:border-lavender-500/40 transition-all">
                  + Write Article
                </button>
              </Link>
              <Link to={ROUTES.BOOKS}>
                <button className="px-3 py-1 text-xs rounded-xl bg-background-elevated hover:bg-lavender-500/20 text-white border border-dark-border hover:border-lavender-500/40 transition-all">
                  + Add Book Link
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
