import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Question } from '../types/database';

export const questionService = {
  async getQuestions(): Promise<Question[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('questions')
        .select('*, chapter:chapters(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((q: any) => ({
        ...q,
        test_ids: Array.isArray(q.test_ids) ? q.test_ids : [],
      }));
    }
    return [];
  },

  async getQuestionsByTestItem(testItemId: string): Promise<Question[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('questions')
        .select('*, chapter:chapters(*)')
        .contains('test_ids', [testItemId])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((q: any) => ({
        ...q,
        test_ids: Array.isArray(q.test_ids) ? q.test_ids : [],
      }));
    }
    return [];
  },

  async createQuestion(payload: Omit<Question, 'id' | 'created_at' | 'chapter'>): Promise<Question> {
    const cleanPayload = {
      ...payload,
      chapter_id: payload.chapter_id || null,
      test_ids: Array.isArray(payload.test_ids) ? payload.test_ids : [],
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('questions')
        .insert(cleanPayload)
        .select('*, chapter:chapters(*)')
        .single();
      if (error) throw error;
      return {
        ...data,
        test_ids: Array.isArray(data.test_ids) ? data.test_ids : [],
      };
    }
    return {
      ...cleanPayload,
      id: `q-${Date.now()}`,
      created_at: new Date().toISOString(),
    } as Question;
  },

  async createQuestionsBulk(
    questionsList: Array<Omit<Question, 'id' | 'created_at' | 'chapter'>>
  ): Promise<Question[]> {
    const cleanPayloads = questionsList.map((payload) => ({
      chapter_id: payload.chapter_id || null,
      question_en: payload.question_en.trim(),
      question_hi: (payload.question_hi || payload.question_en).trim(),
      option_a_en: payload.option_a_en.trim(),
      option_a_hi: (payload.option_a_hi || payload.option_a_en).trim(),
      option_b_en: payload.option_b_en.trim(),
      option_b_hi: (payload.option_b_hi || payload.option_b_en).trim(),
      option_c_en: payload.question_type === 'True/False' ? '' : (payload.option_c_en || '').trim(),
      option_c_hi: payload.question_type === 'True/False' ? '' : (payload.option_c_hi || payload.option_c_en || '').trim(),
      option_d_en: payload.question_type === 'True/False' ? '' : (payload.option_d_en || '').trim(),
      option_d_hi: payload.question_type === 'True/False' ? '' : (payload.option_d_hi || payload.option_d_en || '').trim(),
      correct_option: payload.correct_option,
      explanation_en: payload.explanation_en ? payload.explanation_en.trim() : null,
      explanation_hi: payload.explanation_hi ? payload.explanation_hi.trim() : null,
      difficulty: payload.difficulty || 'Medium',
      question_type: payload.question_type || 'MCQ',
      source: payload.source ? payload.source.trim() : null,
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      test_ids: Array.isArray(payload.test_ids) ? payload.test_ids : [],
    }));

    if (isSupabaseConfigured && supabase) {
      const BATCH_SIZE = 50;
      const createdQuestions: Question[] = [];

      for (let i = 0; i < cleanPayloads.length; i += BATCH_SIZE) {
        const batch = cleanPayloads.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
          .from('questions')
          .insert(batch)
          .select('*, chapter:chapters(*)');
        if (error) throw error;
        if (data) {
          createdQuestions.push(
            ...data.map((q: any) => ({
              ...q,
              test_ids: Array.isArray(q.test_ids) ? q.test_ids : [],
            }))
          );
        }
      }
      return createdQuestions;
    }

    return cleanPayloads.map((payload, index) => ({
      ...payload,
      id: `q-bulk-${Date.now()}-${index}`,
      created_at: new Date().toISOString(),
    })) as Question[];
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
    const cleanUpdates = {
      ...updates,
      ...(updates.chapter_id !== undefined ? { chapter_id: updates.chapter_id || null } : {}),
      ...(updates.test_ids !== undefined ? { test_ids: Array.isArray(updates.test_ids) ? updates.test_ids : [] } : {}),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('questions')
        .update(cleanUpdates)
        .eq('id', id)
        .select('*, chapter:chapters(*)')
        .single();
      if (error) throw error;
      return {
        ...data,
        test_ids: Array.isArray(data.test_ids) ? data.test_ids : [],
      };
    }
    return { id, ...cleanUpdates } as Question;
  },

  async deleteQuestion(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // Test Question Assignments (using test_ids array on questions table)
  async assignQuestionsToTest(testItemId: string, questionIds: string[]): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      for (const qId of questionIds) {
        const { data: q } = await supabase
          .from('questions')
          .select('test_ids')
          .eq('id', qId)
          .single();
        if (q) {
          const currentTestIds: string[] = Array.isArray(q.test_ids) ? q.test_ids : [];
          if (!currentTestIds.includes(testItemId)) {
            const nextTestIds = [...currentTestIds, testItemId];
            await supabase
              .from('questions')
              .update({ test_ids: nextTestIds })
              .eq('id', qId);
          }
        }
      }
    }
  },

  async removeQuestionFromTest(testItemId: string, questionId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { data: q } = await supabase
        .from('questions')
        .select('test_ids')
        .eq('id', questionId)
        .single();
      if (q) {
        const currentTestIds: string[] = Array.isArray(q.test_ids) ? q.test_ids : [];
        const nextTestIds = currentTestIds.filter((id) => id !== testItemId);
        await supabase
          .from('questions')
          .update({ test_ids: nextTestIds })
          .eq('id', questionId);
      }
    }
  },
};
