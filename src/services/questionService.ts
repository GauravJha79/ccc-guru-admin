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
