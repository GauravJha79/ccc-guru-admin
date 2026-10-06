import { generateSlug } from '../lib/utils';
import { getGeminiApiKey } from './geminiService';

export interface GenerateTestSeriesSeoParams {
  title: string;
  categoryTitle?: string;
  focusTopics?: string;
  examName?: string;
  tone?: 'Comprehensive & Authoritative' | 'Exam Strategy & High Yield' | 'Bilingual Quick Pass Guide';
  totalSets?: number;
  customInstructions?: string;
  apiKey?: string;
  model?: string;
}

export interface GeneratedTestSeriesSeoResult {
  suggested_title: string;
  slug: string;
  short_description: string;
  featured_tag: string;
  featured_short_desc: string;
  description_md: string;
  target_keywords: string[];
}

const parseJsonFromResponse = (text: string): any => {
  if (!text) throw new Error('Empty text received from AI model.');

  try {
    return JSON.parse(text);
  } catch (e) {
    // Continue
  }

  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(jsonBlockRegex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (e) {
      // Continue
    }
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    } catch (e) {
      // Continue
    }
  }

  throw new Error('Could not parse structured JSON from AI output.');
};

export const geminiTestSeriesService = {
  async generateSeoContent(params: GenerateTestSeriesSeoParams): Promise<GeneratedTestSeriesSeoResult> {
    const key = (params.apiKey || getGeminiApiKey()).trim();
    if (!key) {
      throw new Error('Gemini API Key is required. Please set it in Settings or the AI generator.');
    }

    const candidateModels = [
      params.model && params.model !== 'auto' ? params.model : null,
      'gemini-2.5-flash',
      'gemini-3.7-flash',
      'gemini-3.5-flash-lite',
    ].filter(Boolean) as string[];

    const prompt = `You are a world-class SEO content strategist and top NIELIT CCC (Course on Computer Concepts) education expert.
Your goal is to generate a comprehensive, high-converting, and SEO-optimized overview page for a Test Series package for Markdown editing (MDXEditor) and search engine indexing.

### TEST SERIES DETAILS:
- Title / Focus: "${params.title || 'NIELIT CCC Complete Test Series 2026'}"
- Category: "${params.categoryTitle || 'Mock Exams & Chapter Practice'}"
- Exam: "${params.examName || 'NIELIT CCC Examination 2026'}"
- Estimated Total Sets: ${params.totalSets || 10}
- Tone: "${params.tone || 'Comprehensive & Authoritative'}"
${params.focusTopics ? `- Key Focus Topics: ${params.focusTopics}` : ''}
${params.customInstructions ? `- Additional Admin Instructions: ${params.customInstructions}` : ''}

### SEO REQUIREMENTS:
1. "suggested_title": High CTR, SEO-optimized title (e.g. "CCC 2026 Ultimate Test Series — 10 Full Mock Tests (Hindi & English)").
2. "slug": Clean, lowercase, hyphen-only URL slug (e.g. "ccc-2026-ultimate-test-series-mock-tests").
3. "short_description": High-impact 2-sentence summary for card previews and meta description.
4. "featured_tag": Short 2-3 word punchy badge (e.g., "MOST POPULAR", "TOP RATED", "100% SYLLABUS").
5. "featured_short_desc": Concise highlight text (e.g., "1000+ Questions • Timer • Bilingual Solutions").
6. "target_keywords": Array of 6-8 high-intent search keywords (e.g., "NIELIT CCC mock test", "CCC LibreOffice practice questions", "CCC online exam test series 2026").
7. "description_md": Rich, in-depth Markdown content (500–1000 words) formatted with:
   - # H1 Catchy Title
   - Engaging introduction explaining why this test series guarantees success in NIELIT CCC exam.
   - ## 🎯 Key Features & Benefits (bullet points with bold terms)
   - ## 📋 Complete Syllabus & Module Weightage Breakdown (Include a formatted Markdown table with Module Name, Key Topics, Questions count, and % Weightage)
   - ## 💡 Smart Preparation & Exam Strategy (Tips on time management, passing score 50%, no negative marking, etc.)
   - ## ❓ Frequently Asked Questions (FAQ) (4-5 practical Q&As about passing grade, mobile access, exam pattern).

CRITICAL FORMATTING INSTRUCTIONS:
- The "description_md" MUST use clean, valid GitHub-flavored Markdown (proper headers ##, ###, bold **, bullet lists -, and tables | ... |).
- Support bilingual nuances where helpful (e.g., mentioning both Hindi & English support).
- Return ONLY a valid JSON object matching the schema below.

JSON SCHEMA:
{
  "suggested_title": "string",
  "slug": "string",
  "short_description": "string",
  "featured_tag": "string",
  "featured_short_desc": "string",
  "target_keywords": ["string"],
  "description_md": "string"
}`;

    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(key)}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 3500,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`[${modelName}] API Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = parseJsonFromResponse(rawContent);

        const cleanSlug = String(parsed.slug || generateSlug(parsed.suggested_title || params.title)).trim();

        return {
          suggested_title: parsed.suggested_title || params.title,
          slug: cleanSlug.replace(/^-+|-+$/g, '').toLowerCase(),
          short_description: parsed.short_description || '',
          featured_tag: parsed.featured_tag || 'RECOMMENDED',
          featured_short_desc: parsed.featured_short_desc || '',
          target_keywords: Array.isArray(parsed.target_keywords) ? parsed.target_keywords : [],
          description_md: parsed.description_md || '',
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini generation with ${modelName} failed:`, err.message);
      }
    }

    throw new Error(lastError?.message || 'Failed to generate SEO content with Gemini AI.');
  },
};
