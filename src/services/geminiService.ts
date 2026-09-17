import { CorrectOption, DifficultyLevel, QuestionType } from '../types/database';

export interface GenerateQuestionsParams {
  chapterTitle?: string;
  chapterHindiTitle?: string;
  customTopic?: string;
  difficulty: DifficultyLevel | 'Mixed';
  mcqCount: number;
  trueFalseCount: number;
  customInstructions?: string;
  existingQuestionsToAvoid?: string[];
  batchSeed?: number;
  apiKey?: string;
  model?: string;
}

export interface GeneratedQuestionItem {
  question_en: string;
  question_hi: string;
  option_a_en: string;
  option_a_hi: string;
  option_b_en: string;
  option_b_hi: string;
  option_c_en: string;
  option_c_hi: string;
  option_d_en: string;
  option_d_hi: string;
  correct_option: CorrectOption;
  explanation_en: string;
  explanation_hi: string;
  difficulty: DifficultyLevel;
  question_type: QuestionType;
  source: string;
}

export const GEMINI_MODEL_OPTIONS = [
  { value: 'auto', label: 'Auto (Best available model)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended & Stable)' },
  { value: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash (Latest Advanced)' },
  { value: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite (Fast)' },
];

export const getGeminiApiKey = (): string => {
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  const localKey = (localStorage.getItem('ccc_gemini_api_key') || '').trim();
  return envKey || localKey || '';
};

export const setStoredGeminiApiKey = (key: string): void => {
  const clean = key.trim();
  if (clean) {
    localStorage.setItem('ccc_gemini_api_key', clean);
  } else {
    localStorage.removeItem('ccc_gemini_api_key');
  }
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseJsonFromResponse = (text: string): any => {
  if (!text) throw new Error('Empty text received from model.');

  // 1. Direct parse attempt
  try {
    return JSON.parse(text);
  } catch (e) {
    // Continue
  }

  // 2. Strip ```json ... ``` code blocks
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(jsonBlockRegex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (e) {
      // Continue
    }
  }

  // 3. Find JSON array substring [ ... ]
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const arraySubstring = text.substring(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(arraySubstring);
    } catch (e) {
      // Continue
    }
  }

  // 4. Find JSON object substring { ... }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const objectSubstring = text.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(objectSubstring);
    } catch (e) {
      // Continue
    }
  }

  throw new Error(`Failed to parse valid JSON from AI response: ${text.substring(0, 100)}...`);
};

export const normalizeQuestionText = (text: string): string => {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const isDuplicateQuestion = (
  q1: { question_en?: string; question_hi?: string },
  q2: { question_en?: string; question_hi?: string }
): boolean => {
  const norm1En = normalizeQuestionText(q1.question_en || '');
  const norm2En = normalizeQuestionText(q2.question_en || '');
  if (norm1En && norm2En && (norm1En === norm2En || norm1En.includes(norm2En) || norm2En.includes(norm1En))) {
    if (Math.abs(norm1En.length - norm2En.length) < 15) return true;
  }

  const norm1Hi = normalizeQuestionText(q1.question_hi || '');
  const norm2Hi = normalizeQuestionText(q2.question_hi || '');
  if (norm1Hi && norm2Hi && (norm1Hi === norm2Hi || norm1Hi.includes(norm2Hi) || norm2Hi.includes(norm1Hi))) {
    if (Math.abs(norm1Hi.length - norm2Hi.length) < 15) return true;
  }

  return false;
};

export const geminiService = {
  async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestionItem[]> {
    const key = (params.apiKey || getGeminiApiKey()).trim();

    if (!key) {
      throw new Error(
        'Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your .env file or enter your API key in the generator modal.'
      );
    }

    const totalQuestions = params.mcqCount + params.trueFalseCount;
    if (totalQuestions <= 0) {
      throw new Error('Please specify at least 1 MCQ or True/False question to generate.');
    }

    const topicDescription = params.chapterTitle
      ? `Syllabus Chapter: "${params.chapterTitle}" ${
          params.chapterHindiTitle ? `(${params.chapterHindiTitle})` : ''
        }`
      : params.customTopic
      ? `Topic / Subject: "${params.customTopic}"`
      : 'General NIELIT CCC (Course on Computer Concepts) Complete Curriculum';

    const avoidSection =
      params.existingQuestionsToAvoid && params.existingQuestionsToAvoid.length > 0
        ? `\nCRITICAL ANTI-DUPLICATION RULE:\nDO NOT generate any question that is identical, similar, or tests the exact same question stem as any of the following ${params.existingQuestionsToAvoid.length} existing questions:\n${params.existingQuestionsToAvoid
            .slice(0, 60)
            .map((q, idx) => `${idx + 1}. ${q}`)
            .join('\n')}\nEnsure all newly generated questions test distinct formulas, shortcuts, concepts, or subtopics.\n`
        : '';

    const variationSeed = params.batchSeed || Date.now();

    const prompt = `You are a certified senior examiner for the NIELIT CCC (Course on Computer Concepts) examination.
Generate authentic, high-quality bilingual (English & Hindi) examination questions adhering strictly to the official 2026 NIELIT CCC curriculum.

Target Requirements:
- ${topicDescription}
- Total Questions: ${totalQuestions}
- Exact Breakdown: ${params.mcqCount} MCQ (4 Options: A, B, C, D) questions AND ${params.trueFalseCount} True/False (2 Options: A = True/सत्य, B = False/असत्य) questions.
- Target Difficulty: ${params.difficulty === 'Mixed' ? 'Balanced mix of Easy, Medium, and Hard' : params.difficulty}
- Variation Seed: ${variationSeed} (Ensure questions are unique and novel)
${avoidSection}
${params.customInstructions ? `- Special Admin Instructions: ${params.customInstructions}` : ''}

Strict Output Format:
Return ONLY a valid JSON array of objects. Do not include any explanations outside the JSON.
Each object in the array must strictly have these fields:
- "question_en": string (Clear English question)
- "question_hi": string (Accurate and natural Hindi translation of the question)
- "option_a_en": string (Option A in English; for True/False: "True")
- "option_a_hi": string (Option A in Hindi; for True/False: "सत्य (True)")
- "option_b_en": string (Option B in English; for True/False: "False")
- "option_b_hi": string (Option B in Hindi; for True/False: "असत्य (False)")
- "option_c_en": string (Option C in English; for True/False: "")
- "option_c_hi": string (Option C in Hindi; for True/False: "")
- "option_d_en": string (Option D in English; for True/False: "")
- "option_d_hi": string (Option D in Hindi; for True/False: "")
- "correct_option": "A" | "B" | "C" | "D"
- "explanation_en": string (Explanation in English)
- "explanation_hi": string (Explanation in Hindi)
- "difficulty": "Easy" | "Medium" | "Hard"
- "question_type": "MCQ" | "True/False"
- "source": "NIELIT CCC 2026"`;

    let modelsToTry: string[] = ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-3.5-flash-lite'];
    if (params.model && params.model !== 'auto') {
      modelsToTry = [params.model, ...modelsToTry.filter((m) => m !== params.model)];
    }

    let lastErrorDetails = '';

    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
            key
          )}`;

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                responseMimeType: 'application/json',
              },
            }),
          });

          const data = await response.json();

          if (!response.ok || data.error) {
            const errorMsg =
              data.error?.message || `HTTP ${response.status} ${response.statusText}`;
            lastErrorDetails = `Model ${modelName}: ${errorMsg}`;

            if (response.status === 400 && errorMsg.toLowerCase().includes('api key')) {
              throw new Error(`Invalid Gemini API Key: ${errorMsg}`);
            }

            if (response.status === 503 || response.status === 429) {
              if (attempt === 1) {
                await delay(1500);
                continue;
              }
            }
            break; 
          }

          const candidateText =
            data.candidates?.[0]?.content?.parts?.[0]?.text || '';

          if (!candidateText) {
            throw new Error(`Model ${modelName} returned no candidate text.`);
          }

          const parsed = parseJsonFromResponse(candidateText);

          if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error('AI response is not an array of questions.');
          }

          const sanitizedQuestions: GeneratedQuestionItem[] = [];
          for (const item of parsed) {
            const qEn = String(item.question_en || '').trim();
            const qHi = String(item.question_hi || '').trim();

            if (!qEn && !qHi) continue;

            const qType: QuestionType =
              item.question_type === 'True/False' ||
              item.question_type === 'TrueFalse' ||
              (!item.option_c_en && !item.option_d_en)
                ? 'True/False'
                : 'MCQ';

            let correctOpt: CorrectOption = 'A';
            const rawCorrect = String(item.correct_option || 'A').toUpperCase();
            if (['A', 'B', 'C', 'D'].includes(rawCorrect)) {
              correctOpt = rawCorrect as CorrectOption;
            }

            const candidateItem: GeneratedQuestionItem = {
              question_en: qEn || qHi,
              question_hi: qHi || qEn,
              option_a_en: qType === 'True/False' ? 'True' : String(item.option_a_en || '').trim(),
              option_a_hi: qType === 'True/False' ? 'सत्य (True)' : String(item.option_a_hi || item.option_a_en || '').trim(),
              option_b_en: qType === 'True/False' ? 'False' : String(item.option_b_en || '').trim(),
              option_b_hi: qType === 'True/False' ? 'असत्य (False)' : String(item.option_b_hi || item.option_b_en || '').trim(),
              option_c_en: qType === 'True/False' ? '' : String(item.option_c_en || '').trim(),
              option_c_hi: qType === 'True/False' ? '' : String(item.option_c_hi || item.option_c_en || '').trim(),
              option_d_en: qType === 'True/False' ? '' : String(item.option_d_en || '').trim(),
              option_d_hi: qType === 'True/False' ? '' : String(item.option_d_hi || item.option_d_en || '').trim(),
              correct_option: correctOpt,
              explanation_en: String(item.explanation_en || '').trim(),
              explanation_hi: String(item.explanation_hi || item.explanation_en || '').trim(),
              difficulty: (['Easy', 'Medium', 'Hard'].includes(item.difficulty)
                ? item.difficulty
                : params.difficulty === 'Mixed'
                ? 'Medium'
                : params.difficulty) as DifficultyLevel,
              question_type: qType,
              source: String(item.source || 'NIELIT CCC 2026').trim(),
            };

            const isInternalDup = sanitizedQuestions.some((prev) => isDuplicateQuestion(prev, candidateItem));
            if (!isInternalDup) {
              sanitizedQuestions.push(candidateItem);
            }
          }

          if (sanitizedQuestions.length > 0) {
            return sanitizedQuestions;
          }
        } catch (err: any) {
          lastErrorDetails = err?.message || String(err);
          if (err?.message?.includes('Invalid Gemini API Key')) {
            throw err;
          }
          if (attempt === 1) {
            await delay(1000);
          }
        }
      }
    }

    throw new Error(
      lastErrorDetails ||
        'Failed to generate questions with Gemini AI. Please check your API key or try again in a few moments.'
    );
  },

  async generateQuestionsInBatches(
    params: GenerateQuestionsParams,
    onProgress?: (progress: {
      currentBatch: number;
      totalBatches: number;
      generatedSoFar: number;
      targetTotal: number;
    }) => void
  ): Promise<GeneratedQuestionItem[]> {
    const total = params.mcqCount + params.trueFalseCount;
    const batchSize = 25;

    if (total <= batchSize) {
      return this.generateQuestions(params);
    }

    const totalBatches = Math.ceil(total / batchSize);
    const allGenerated: GeneratedQuestionItem[] = [];
    const avoidList: string[] = [...(params.existingQuestionsToAvoid || [])];

    let remainingMcq = params.mcqCount;
    let remainingTf = params.trueFalseCount;

    for (let batch = 1; batch <= totalBatches; batch++) {
      const isLastBatch = batch === totalBatches;
      const targetBatchTotal = isLastBatch
        ? remainingMcq + remainingTf
        : Math.min(batchSize, remainingMcq + remainingTf);

      let batchMcq = 0;
      let batchTf = 0;

      if (remainingMcq + remainingTf > 0) {
        const mcqRatio = remainingMcq / (remainingMcq + remainingTf);
        batchMcq = isLastBatch ? remainingMcq : Math.min(remainingMcq, Math.round(targetBatchTotal * mcqRatio));
        batchTf = isLastBatch ? remainingTf : Math.min(remainingTf, targetBatchTotal - batchMcq);
      }

      if (batchMcq + batchTf === 0) break;

      if (onProgress) {
        onProgress({
          currentBatch: batch,
          totalBatches,
          generatedSoFar: allGenerated.length,
          targetTotal: total,
        });
      }

      const batchResult = await this.generateQuestions({
        ...params,
        mcqCount: batchMcq,
        trueFalseCount: batchTf,
        existingQuestionsToAvoid: avoidList,
        batchSeed: Date.now() + batch * 10000,
      });

      for (const q of batchResult) {
        const isDup = allGenerated.some((existing) => isDuplicateQuestion(existing, q));
        if (!isDup) {
          allGenerated.push(q);
          if (q.question_en) avoidList.push(q.question_en);
        }
      }

      remainingMcq -= batchMcq;
      remainingTf -= batchTf;

      if (batch < totalBatches) {
        await delay(1200);
      }
    }

    return allGenerated;
  },

  async testApiKey(key: string): Promise<{ success: boolean; message: string; model?: string }> {
    const cleanKey = key.trim();
    if (!cleanKey) {
      return { success: false, message: 'API key cannot be empty.' };
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        cleanKey
      )}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply with "OK"' }] }],
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        const errorMsg =
          data.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        return {
          success: false,
          message: errorMsg,
        };
      }

      return {
        success: true,
        message: 'Gemini API key is valid and connected successfully!',
        model: 'gemini-2.5-flash',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error connecting to Google Gemini API.',
      };
    }
  },
};
