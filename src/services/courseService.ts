import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Course,
  CourseModule,
  CourseLesson,
  CourseModuleNote,
  CourseModuleTest,
  CourseModuleQuestion,
  CourseEnrollment,
  CoursePayment,
  CourseLessonProgress,
} from '../types/database';

export const courseService = {
  // ==========================================
  // COURSES
  // ==========================================
  async getCourses(): Promise<Course[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          modules:course_modules(id, lessons:course_lessons(id)),
          enrollments:course_enrollments(id)
        `)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((course: any) => {
        const modules = course.modules || [];
        const modulesCount = modules.length;
        const lessonsCount = modules.reduce(
          (acc: number, m: any) => acc + (m.lessons ? m.lessons.length : 0),
          0
        );
        const enrollmentsCount = (course.enrollments || []).length;

        return {
          ...course,
          modules_count: modulesCount,
          lessons_count: lessonsCount,
          enrollments_count: enrollmentsCount,
        };
      });
    }
    return [];
  },

  async getCourseById(id: string): Promise<Course | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          modules:course_modules(
            *,
            lessons:course_lessons(*),
            notes:course_module_notes(*, note:notes(*)),
            tests:course_module_tests(*, test_item:test_series_items(*)),
            questions:course_module_questions(*, question:questions(*, chapter:chapters(*)))
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      if (data && data.modules) {
        // Sort modules by sort_order
        data.modules.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
        // Sort nested items in each module
        data.modules.forEach((mod: any) => {
          if (mod.lessons) {
            mod.lessons.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
          }
          if (mod.notes) {
            mod.notes.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
          }
          if (mod.tests) {
            mod.tests.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
          }
          if (mod.questions) {
            mod.questions.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
          }
        });
      }

      return data;
    }
    return null;
  },

  async createCourse(payload: Omit<Course, 'id' | 'created_at' | 'updated_at' | 'modules_count' | 'lessons_count' | 'enrollments_count' | 'modules'>): Promise<Course> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, modules_count: 0, lessons_count: 0, enrollments_count: 0 };
    }
    return {
      ...payload,
      id: `course-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      modules_count: 0,
      lessons_count: 0,
      enrollments_count: 0,
    } as Course;
  },

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    if (isSupabaseConfigured && supabase) {
      const { modules, modules_count, lessons_count, enrollments_count, ...cleanUpdates } = updates as any;
      const { data, error } = await supabase
        .from('courses')
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
    return { id, ...updates } as Course;
  },

  async deleteCourse(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
    }
  },

  async duplicateCourse(courseId: string): Promise<Course> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured');
    }

    // 1. Fetch original course with full tree
    const original = await this.getCourseById(courseId);
    if (!original) throw new Error('Original course not found');

    // 2. Insert new course with updated title and slug
    const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;
    const newTitle = `${original.title} (Copy)`;
    const newTitleHi = `${original.title_hi} (प्रतिलिपि)`;

    const { data: newCourse, error: courseErr } = await supabase
      .from('courses')
      .insert({
        title: newTitle,
        title_hi: newTitleHi,
        slug: newSlug,
        description: original.description,
        description_hi: original.description_hi,
        thumbnail: original.thumbnail,
        is_paid: original.is_paid,
        price: original.price,
        currency: original.currency,
        is_featured: false,
        is_published: false,
        sort_order: (original.sort_order || 0) + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (courseErr) throw courseErr;

    // 3. Deep duplicate modules and their children
    if (original.modules && original.modules.length > 0) {
      for (const mod of original.modules) {
        const { data: newMod, error: modErr } = await supabase
          .from('course_modules')
          .insert({
            course_id: newCourse.id,
            title: mod.title,
            title_hi: mod.title_hi,
            description: mod.description,
            description_hi: mod.description_hi,
            sort_order: mod.sort_order,
            is_published: mod.is_published,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (modErr) continue;

        // Duplicate lessons
        if (mod.lessons && mod.lessons.length > 0) {
          const lessonPayloads = mod.lessons.map((l: CourseLesson) => ({
            module_id: newMod.id,
            title: l.title,
            title_hi: l.title_hi,
            lesson_type: l.lesson_type,
            content: l.content,
            content_hi: l.content_hi,
            video_url: l.video_url,
            duration_minutes: l.duration_minutes,
            sort_order: l.sort_order,
            is_free_preview: l.is_free_preview,
            is_published: l.is_published,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
          await supabase.from('course_lessons').insert(lessonPayloads);
        }

        // Duplicate notes attachments
        if (mod.notes && mod.notes.length > 0) {
          const notePayloads = mod.notes.map((n: CourseModuleNote) => ({
            module_id: newMod.id,
            note_id: n.note_id,
            sort_order: n.sort_order,
            created_at: new Date().toISOString(),
          }));
          await supabase.from('course_module_notes').insert(notePayloads);
        }

        // Duplicate tests attachments
        if (mod.tests && mod.tests.length > 0) {
          const testPayloads = mod.tests.map((t: CourseModuleTest) => ({
            module_id: newMod.id,
            test_id: t.test_id,
            sort_order: t.sort_order,
            created_at: new Date().toISOString(),
          }));
          await supabase.from('course_module_tests').insert(testPayloads);
        }

        // Duplicate quiz questions attachments
        if (mod.questions && mod.questions.length > 0) {
          const questionPayloads = mod.questions.map((q: CourseModuleQuestion) => ({
            module_id: newMod.id,
            question_id: q.question_id,
            sort_order: q.sort_order,
            created_at: new Date().toISOString(),
          }));
          await supabase.from('course_module_questions').insert(questionPayloads);
        }
      }
    }

    return newCourse;
  },

  // ==========================================
  // MODULES
  // ==========================================
  async getModulesByCourseId(courseId: string): Promise<CourseModule[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_modules')
        .select(`
          *,
          lessons:course_lessons(*),
          notes:course_module_notes(*, note:notes(*)),
          tests:course_module_tests(*, test_item:test_series_items(*)),
          questions:course_module_questions(*, question:questions(*, chapter:chapters(*)))
        `)
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return (data || []).map((m: any) => {
        const lessons = (m.lessons || []).sort(
          (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
        );
        const notes = (m.notes || []).sort(
          (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
        );
        const tests = (m.tests || []).sort(
          (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
        );
        const questions = (m.questions || []).sort(
          (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
        );

        return {
          ...m,
          lessons_count: lessons.length,
          notes_count: notes.length,
          tests_count: tests.length,
          questions_count: questions.length,
          lessons,
          notes,
          tests,
          questions,
        };
      });
    }
    return [];
  },

  async createModule(payload: Omit<CourseModule, 'id' | 'created_at' | 'updated_at' | 'lessons_count' | 'notes_count' | 'tests_count' | 'questions_count' | 'lessons' | 'notes' | 'tests' | 'questions'>): Promise<CourseModule> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_modules')
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        lessons_count: 0,
        notes_count: 0,
        tests_count: 0,
        questions_count: 0,
        lessons: [],
        notes: [],
        tests: [],
        questions: [],
      };
    }
    return {
      ...payload,
      id: `cmod-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lessons_count: 0,
      notes_count: 0,
      tests_count: 0,
      questions_count: 0,
    } as CourseModule;
  },

  async updateModule(id: string, updates: Partial<CourseModule>): Promise<CourseModule> {
    if (isSupabaseConfigured && supabase) {
      const { lessons, notes, tests, questions, lessons_count, notes_count, tests_count, questions_count, ...cleanUpdates } = updates as any;
      const { data, error } = await supabase
        .from('course_modules')
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
    return { id, ...updates } as CourseModule;
  },

  async deleteModule(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('course_modules').delete().eq('id', id);
      if (error) throw error;
    }
  },

  async reorderModules(items: { id: string; sort_order: number }[]): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      for (const item of items) {
        await supabase
          .from('course_modules')
          .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
          .eq('id', item.id);
      }
    }
  },

  // ==========================================
  // LESSONS
  // ==========================================
  async getLessonsByModuleId(moduleId: string): Promise<CourseLesson[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async createLesson(payload: Omit<CourseLesson, 'id' | 'created_at' | 'updated_at'>): Promise<CourseLesson> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_lessons')
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
    return {
      ...payload,
      id: `clsn-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as CourseLesson;
  },

  async updateLesson(id: string, updates: Partial<CourseLesson>): Promise<CourseLesson> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_lessons')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
    return { id, ...updates } as CourseLesson;
  },

  async deleteLesson(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('course_lessons').delete().eq('id', id);
      if (error) throw error;
    }
  },

  async reorderLessons(items: { id: string; sort_order: number }[]): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      for (const item of items) {
        await supabase
          .from('course_lessons')
          .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
          .eq('id', item.id);
      }
    }
  },

  // ==========================================
  // MODULE NOTES (Attachment)
  // ==========================================
  async getModuleNotes(moduleId: string): Promise<CourseModuleNote[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_module_notes')
        .select('*, note:notes(*, category:note_categories(*))')
        .eq('module_id', moduleId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async attachNoteToModule(moduleId: string, noteId: string, sortOrder: number = 0): Promise<CourseModuleNote> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_module_notes')
        .insert({
          module_id: moduleId,
          note_id: noteId,
          sort_order: sortOrder,
          created_at: new Date().toISOString(),
        })
        .select('*, note:notes(*, category:note_categories(*))')
        .single();

      if (error) throw error;
      return data;
    }
    return {
      id: `cmn-${Date.now()}`,
      module_id: moduleId,
      note_id: noteId,
      sort_order: sortOrder,
      created_at: new Date().toISOString(),
    };
  },

  async detachNoteFromModule(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('course_module_notes').delete().eq('id', id);
      if (error) throw error;
    }
  },

  async reorderModuleNotes(items: { id: string; sort_order: number }[]): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      for (const item of items) {
        await supabase
          .from('course_module_notes')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id);
      }
    }
  },

  // ==========================================
  // MODULE TESTS (Attachment)
  // ==========================================
  async getModuleTests(moduleId: string): Promise<CourseModuleTest[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_module_tests')
        .select('*, test_item:test_series_items(*, series:test_series(*))')
        .eq('module_id', moduleId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async attachTestToModule(moduleId: string, testId: string, sortOrder: number = 0): Promise<CourseModuleTest> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_module_tests')
        .insert({
          module_id: moduleId,
          test_id: testId,
          sort_order: sortOrder,
          created_at: new Date().toISOString(),
        })
        .select('*, test_item:test_series_items(*, series:test_series(*))')
        .single();

      if (error) throw error;
      return data;
    }
    return {
      id: `cmt-${Date.now()}`,
      module_id: moduleId,
      test_id: testId,
      sort_order: sortOrder,
      created_at: new Date().toISOString(),
    };
  },

  async detachTestFromModule(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('course_module_tests').delete().eq('id', id);
      if (error) throw error;
    }
  },

  async reorderModuleTests(items: { id: string; sort_order: number }[]): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      for (const item of items) {
        await supabase
          .from('course_module_tests')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id);
      }
    }
  },

  // ==========================================
  // MODULE QUESTIONS (Quiz Attachment)
  // ==========================================
  async getModuleQuestions(moduleId: string): Promise<CourseModuleQuestion[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_module_questions')
        .select('*, question:questions(*, chapter:chapters(*))')
        .eq('module_id', moduleId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async attachQuestionsToModule(moduleId: string, questionIds: string[]): Promise<void> {
    if (isSupabaseConfigured && supabase && questionIds.length > 0) {
      // Get current max sort_order
      const { data: existing } = await supabase
        .from('course_module_questions')
        .select('sort_order')
        .eq('module_id', moduleId)
        .order('sort_order', { ascending: false })
        .limit(1);

      let currentOrder = existing && existing.length > 0 ? (existing[0].sort_order || 0) : 0;

      const payloads = questionIds.map((qId) => {
        currentOrder += 1;
        return {
          module_id: moduleId,
          question_id: qId,
          sort_order: currentOrder,
          created_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase
        .from('course_module_questions')
        .upsert(payloads, { onConflict: 'module_id,question_id' });

      if (error) throw error;
    }
  },

  async detachQuestionFromModule(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('course_module_questions').delete().eq('id', id);
      if (error) throw error;
    }
  },

  async reorderModuleQuestions(items: { id: string; sort_order: number }[]): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      for (const item of items) {
        await supabase
          .from('course_module_questions')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id);
      }
    }
  },

  // ==========================================
  // COURSE ENROLLMENTS
  // ==========================================
  async getEnrollments(courseId?: string): Promise<CourseEnrollment[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses(id, title, title_hi, thumbnail, is_paid, price)
        `)
        .order('enrolled_at', { ascending: false });

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch progress for each enrollment to compute dynamic progress %
      const enrollments = data || [];
      if (enrollments.length > 0) {
        // Fetch all progress records for these courses
        const { data: progressRecords } = await supabase
          .from('course_lesson_progress')
          .select('user_id, course_id, is_completed');

        // Fetch lesson counts per course
        const { data: modulesData } = await supabase
          .from('course_modules')
          .select('course_id, lessons:course_lessons(id)');

        const totalLessonsByCourse: Record<string, number> = {};
        (modulesData || []).forEach((m: any) => {
          const cId = m.course_id;
          const count = (m.lessons || []).length;
          totalLessonsByCourse[cId] = (totalLessonsByCourse[cId] || 0) + count;
        });

        return enrollments.map((enr: any) => {
          const totalLessons = totalLessonsByCourse[enr.course_id] || 0;
          const completedLessons = (progressRecords || []).filter(
            (p: any) => p.user_id === enr.user_id && p.course_id === enr.course_id && p.is_completed
          ).length;

          const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

          return {
            ...enr,
            total_lessons_count: totalLessons,
            completed_lessons_count: completedLessons,
            progress_percentage: progressPct,
          };
        });
      }

      return enrollments;
    }
    return [];
  },

  async createEnrollment(payload: Omit<CourseEnrollment, 'id' | 'created_at' | 'course' | 'progress_percentage' | 'completed_lessons_count' | 'total_lessons_count'>): Promise<CourseEnrollment> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
          enrolled_at: payload.enrolled_at || new Date().toISOString(),
        })
        .select('*, course:courses(id, title, title_hi, thumbnail, is_paid, price)')
        .single();

      if (error) throw error;
      return {
        ...data,
        progress_percentage: 0,
        completed_lessons_count: 0,
        total_lessons_count: 0,
      };
    }
    return {
      ...payload,
      id: `cenr-${Date.now()}`,
      created_at: new Date().toISOString(),
      enrolled_at: new Date().toISOString(),
      progress_percentage: 0,
    } as CourseEnrollment;
  },

  async updateEnrollment(id: string, updates: Partial<CourseEnrollment>): Promise<CourseEnrollment> {
    if (isSupabaseConfigured && supabase) {
      const { course, progress_percentage, completed_lessons_count, total_lessons_count, ...cleanUpdates } = updates as any;
      const { data, error } = await supabase
        .from('course_enrollments')
        .update(cleanUpdates)
        .eq('id', id)
        .select('*, course:courses(id, title, title_hi, thumbnail, is_paid, price)')
        .single();

      if (error) throw error;
      return data;
    }
    return { id, ...updates } as CourseEnrollment;
  },

  async deleteEnrollment(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('course_enrollments').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // ==========================================
  // COURSE PAYMENTS
  // ==========================================
  async getPayments(courseId?: string): Promise<CoursePayment[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('course_payments')
        .select(`
          *,
          course:courses(id, title, title_hi, thumbnail, price, currency)
        `)
        .order('created_at', { ascending: false });

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    return [];
  },

  async createPayment(payload: Omit<CoursePayment, 'id' | 'created_at' | 'updated_at' | 'course'>): Promise<CoursePayment> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_payments')
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*, course:courses(id, title, title_hi, thumbnail, price, currency)')
        .single();

      if (error) throw error;
      return data;
    }
    return {
      ...payload,
      id: `cpay-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as CoursePayment;
  },

  async updatePaymentStatus(id: string, status: CoursePayment['status']): Promise<CoursePayment> {
    if (isSupabaseConfigured && supabase) {
      const isSuccess = status === 'success';
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (isSuccess) {
        updates.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('course_payments')
        .update(updates)
        .eq('id', id)
        .select('*, course:courses(id, title, title_hi, thumbnail, price, currency)')
        .single();

      if (error) throw error;
      return data;
    }
    return { id, status } as CoursePayment;
  },

  async getRevenueStats(): Promise<{
    totalRevenue: number;
    successfulPaymentsCount: number;
    pendingPaymentsCount: number;
    failedRefundedCount: number;
  }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_payments')
        .select('amount, status');

      if (error) throw error;

      let totalRevenue = 0;
      let successfulPaymentsCount = 0;
      let pendingPaymentsCount = 0;
      let failedRefundedCount = 0;

      (data || []).forEach((p: any) => {
        if (p.status === 'success') {
          totalRevenue += Number(p.amount) || 0;
          successfulPaymentsCount += 1;
        } else if (p.status === 'pending') {
          pendingPaymentsCount += 1;
        } else {
          failedRefundedCount += 1;
        }
      });

      return {
        totalRevenue,
        successfulPaymentsCount,
        pendingPaymentsCount,
        failedRefundedCount,
      };
    }
    return {
      totalRevenue: 0,
      successfulPaymentsCount: 0,
      pendingPaymentsCount: 0,
      failedRefundedCount: 0,
    };
  },

  // ==========================================
  // PROGRESS TRACKING
  // ==========================================
  async getUserCourseProgress(userId: string, courseId: string): Promise<{
    completedLessonIds: string[];
    completedModulesCount: number;
    totalModulesCount: number;
    completedLessonsCount: number;
    totalLessonsCount: number;
    progressPercentage: number;
  }> {
    if (isSupabaseConfigured && supabase) {
      const [modulesRes, progressRes] = await Promise.all([
        supabase
          .from('course_modules')
          .select('id, lessons:course_lessons(id)')
          .eq('course_id', courseId),
        supabase
          .from('course_lesson_progress')
          .select('lesson_id, module_id, is_completed')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .eq('is_completed', true),
      ]);

      const modules = modulesRes.data || [];
      const progress = progressRes.data || [];

      const completedLessonIds = progress.map((p: any) => p.lesson_id);
      let totalLessons = 0;
      let completedModules = 0;

      modules.forEach((m: any) => {
        const modLessons = m.lessons || [];
        totalLessons += modLessons.length;
        if (modLessons.length > 0) {
          const allCompleted = modLessons.every((l: any) => completedLessonIds.includes(l.id));
          if (allCompleted) completedModules += 1;
        }
      });

      const progressPct = totalLessons > 0 ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0;

      return {
        completedLessonIds,
        completedModulesCount: completedModules,
        totalModulesCount: modules.length,
        completedLessonsCount: completedLessonIds.length,
        totalLessonsCount: totalLessons,
        progressPercentage: progressPct,
      };
    }

    return {
      completedLessonIds: [],
      completedModulesCount: 0,
      totalModulesCount: 0,
      completedLessonsCount: 0,
      totalLessonsCount: 0,
      progressPercentage: 0,
    };
  },
};
