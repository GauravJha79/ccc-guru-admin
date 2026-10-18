import { generateSlug } from '../lib/utils';
import { getGeminiApiKey } from './geminiService';
import { uploadAssetToHygraph } from './hygraphAssetService';

export interface GenerateBlogParams {
  topic: string;
  categoryTitle?: string;
  articleLength?: 'Comprehensive' | 'Quick Revision' | 'Cheatsheet';
  tone?: 'Educational' | 'Exam Focus' | 'Practical Guide';
  thumbnailStyle?: 'student_portrait' | 'youtube_pro' | 'realistic_photo' | 'cyber_3d' | 'tech_illustration' | 'canvas_banner';
  customInstructions?: string;
  apiKey?: string;
  model?: string;
}

export interface GeneratedBlogResult {
  title_en: string;
  title_hi: string;
  slug: string;
  summary_en: string;
  summary_hi: string;
  content_en: string;
  content_hi: string;
  thumbnail_prompt?: string;
  tags?: string[];
  thumbnail_url?: string;
  thumbnail_type?: 'nano_banana_realistic' | 'canvas_banner';
}

export interface TopicSuggestion {
  title: string;
  categoryHint: string;
  description: string;
}

export interface BannerTheme {
  name: string;
  gradient: [string, string, string];
  accent: string;
  iconName?: string;
}

export const BANNER_THEMES: BannerTheme[] = [
  {
    name: 'Cosmic Lavender',
    gradient: ['#1e1035', '#2d1b69', '#4c1d95'],
    accent: '#a78bfa',
  },
  {
    name: 'Cyber Emerald',
    gradient: ['#062e24', '#064e3b', '#047857'],
    accent: '#34d399',
  },
  {
    name: 'Ocean Cobalt',
    gradient: ['#0f172a', '#1e3a8a', '#1d4ed8'],
    accent: '#60a5fa',
  },
  {
    name: 'Sunset Amber',
    gradient: ['#2e1065', '#7c2d12', '#c2410c'],
    accent: '#fb923c',
  },
  {
    name: 'Dark Graphite',
    gradient: ['#09090b', '#18181b', '#27272a'],
    accent: '#e4e4e7',
  },
];

const parseJsonFromResponse = (text: string): any => {
  if (!text) throw new Error('Empty text received from model.');

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

  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(text.substring(firstBracket, lastBracket + 1));
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

  throw new Error(`Failed to parse valid JSON from AI response: ${text.substring(0, 100)}...`);
};

export const geminiBlogService = {
  /**
   * Dynamically suggests fresh, trending CCC exam study guide topics via Gemini AI
   */
  async suggestTopicPresets(categoryTitle?: string, count: number = 6): Promise<TopicSuggestion[]> {
    const key = getGeminiApiKey();
    if (!key) {
      return [
        {
          title: 'LibreOffice Calc Formulas & Functions (SUM, COUNT, IF, AVERAGE)',
          categoryHint: 'LibreOffice',
          description: 'High-yield formula syntax and cell referencing questions for CCC',
        },
        {
          title: 'Top 50 LibreOffice Writer & Calc Shortcut Keys for CCC Exam 2026',
          categoryHint: 'Shortcuts',
          description: 'Essential keyboard shortcuts commonly tested in NIELIT exams',
        },
        {
          title: 'Complete Guide to Digital Financial Services (UPI, USSD, AEPS, QR Codes, BHIM)',
          categoryHint: 'Digital Payments',
          description: 'Transaction limits, security PINs, and modern NPCI payment protocols',
        },
        {
          title: 'Cyber Security Essentials: Malware, Phishing, Ransomware & Safe Browsing',
          categoryHint: 'Cyber Security',
          description: 'Important terminology, firewall rules, and computer protection',
        },
        {
          title: 'Linux & Ubuntu Operating System Commands & GUI Fundamentals',
          categoryHint: 'Operating Systems',
          description: 'Terminal navigation, file permissions, and open-source concepts',
        },
        {
          title: 'Networking Basics, IP Addressing, OSI Model & Internet Protocols (HTTP, FTP, SMTP)',
          categoryHint: 'Internet & Networking',
          description: 'Network topologies, protocol ports, and web architectures',
        },
      ];
    }

    const randomSeed = Math.floor(Math.random() * 1000000);
    const prompt = `You are a curriculum director for the NIELIT CCC (Course on Computer Concepts) examination.
Generate ${count} completely unique, innovative, high-yield blog article & study guide topics for candidate preparation for the 2026 CCC exam ${
      categoryTitle ? `focusing on "${categoryTitle}"` : ''
    }.
Variation Seed: ${randomSeed} (ensure these topics are distinct and novel).

Return ONLY a valid JSON array of objects with schema:
[
  {
    "title": "Clear, catchy, highly relevant topic title (e.g. Master LibreOffice Impress Slide Transitions & Shortcuts for CCC 2026)",
    "categoryHint": "Short category name (e.g. LibreOffice, Cyber Security, Operating Systems, Digital Banking)",
    "description": "One sentence describing why this is a high-yield exam topic"
  }
]`;

    const candidateModels = ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-3.5-flash-lite'];

    for (const modelName of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
          key
        )}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.9,
              responseMimeType: 'application/json',
            },
          }),
        });

        const data = await response.json();
        if (!response.ok || data.error) {
          continue;
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = parseJsonFromResponse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, count).map((item: any) => ({
            title: String(item.title || '').trim(),
            categoryHint: String(item.categoryHint || 'General').trim(),
            description: String(item.description || '').trim(),
          }));
        }
      } catch (e) {
        // Try next model
      }
    }

    throw new Error('Failed to generate fresh AI topic ideas. Please check API Key or try again.');
  },

  async generateBlogArticle(params: GenerateBlogParams): Promise<GeneratedBlogResult> {
    const key = (params.apiKey || getGeminiApiKey()).trim();

    if (!key) {
      throw new Error(
        'Gemini API Key is missing. Please configure VITE_GEMINI_API_KEY in .env or enter it in the AI generator.'
      );
    }

    if (!params.topic.trim()) {
      throw new Error('Please specify a topic or keyword for the blog article.');
    }

    const lengthGuide =
      params.articleLength === 'Quick Revision'
        ? 'around 500-700 words, focused strictly on high-yield exam points, key definitions, and quick revision notes'
        : params.articleLength === 'Cheatsheet'
        ? 'a concise cheatsheet format filled with markdown tables of shortcut keys, syntax, formulas, and acronyms'
        : 'an in-depth comprehensive tutorial (800-1200 words) with structured headings, code/formula examples, exam tips, and FAQ section';

    const prompt = `You are a chief technical author and master educator for the NIELIT CCC (Course on Computer Concepts) examination.
Generate a complete, high-quality bilingual (English and Hindi) educational study guide / blog article for candidates preparing for the 2026 CCC exam.

Target Topic: "${params.topic}"
Target Category: "${params.categoryTitle || 'General CCC Prep'}"
Length & Format: ${lengthGuide}
Tone: ${params.tone || 'Educational & Exam Focus'}
${params.customInstructions ? `Special Instructions: ${params.customInstructions}` : ''}

Strict Formatting Requirements:
1. "title_en": Catchy, SEO-friendly, professional English title (e.g. "Complete Guide to LibreOffice Calc Formulas for CCC Exam 2026").
2. "title_hi": Fluent, professional Hindi translation of the title.
3. "slug": SEO-friendly URL slug (lowercase, hyphens only).
4. "summary_en": Engaging 2-3 sentence meta summary in English highlighting key takeaways.
5. "summary_hi": Professional Hindi translation of the summary.
6. "content_en": Complete, formatted Markdown article in English including:
   - ## Introduction & Concepts
   - ## Key Features & Real-world Usage
   - ## Important Shortcut Keys & Tables (use markdown tables)
   - ## Important NIELIT Exam Questions & Tips
   - ## Frequently Asked Questions (FAQ)
7. "content_hi": Complete, fluent, natural Hindi translation of the Markdown article mirroring the English structure with proper computer terminology (देवनागरी लिपि में स्पष्ट भाषा).
8. "thumbnail_prompt": A highly detailed visual prompt for Nano Banana image generation: describing an Indian student / educator with a modern laptop, glowing study desk, professional lighting, and computer concepts screen, 16:9 aspect ratio.
9. "tags": An array of 4-6 relevant keyword strings.

Return ONLY a valid JSON object matching this schema. Do not wrap in markdown outside the JSON.`;

    const candidateModels = ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-3.5-flash-lite'];
    const modelsToTry = params.model && params.model !== 'auto'
      ? [params.model, ...candidateModels.filter((m) => m !== params.model)]
      : candidateModels;

    let lastError = '';

    for (const modelName of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
          key
        )}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.65,
              responseMimeType: 'application/json',
            },
          }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          const errorMsg = data.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          lastError = `Model ${modelName}: ${errorMsg}`;
          continue;
        }

        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!candidateText) {
          throw new Error(`Model ${modelName} returned empty text.`);
        }

        const parsed = parseJsonFromResponse(candidateText);

        const titleEn = String(parsed.title_en || params.topic).trim();
        const titleHi = String(parsed.title_hi || titleEn).trim();
        const slug = String(parsed.slug || generateSlug(titleEn)).trim();

        return {
          title_en: titleEn,
          title_hi: titleHi,
          slug: slug.startsWith('/') ? slug.substring(1) : slug,
          summary_en: String(parsed.summary_en || '').trim(),
          summary_hi: String(parsed.summary_hi || '').trim(),
          content_en: String(parsed.content_en || '').trim(),
          content_hi: String(parsed.content_hi || '').trim(),
          thumbnail_prompt: String(parsed.thumbnail_prompt || '').trim(),
          tags: Array.isArray(parsed.tags) ? parsed.tags : ['CCC Exam', 'Study Guide', 'NIELIT 2026'],
        };
      } catch (err: any) {
        lastError = err.message || String(err);
      }
    }

    throw new Error(lastError || 'Failed to generate blog article via Gemini AI. Please check your API key.');
  },

  /**
   * Generates a Realistic Professional Thumbnail directly using Google Gemini Nano Banana
   * (gemini-3.1-flash-image-preview / gemini-3-pro-image-preview / imagen-3.0-generate-002).
   */
  async generateRealisticThumbnail(params: {
    title: string;
    thumbnailPrompt?: string;
    customPrompt?: string;
    categoryName?: string;
    style?: string;
    persona?: 'female_student' | 'male_student' | 'female_teacher' | 'male_instructor' | 'cyber_hacker' | 'exam_topper' | 'tech_minimalist';
    theme?: BannerTheme;
  }): Promise<{ url: string; type: 'nano_banana_realistic' | 'canvas_banner' }> {
    const key = getGeminiApiKey().trim();
    if (!key) {
      throw new Error('Gemini API Key is missing. Please configure VITE_GEMINI_API_KEY in .env.');
    }

    const style = params.style || 'student_portrait';

    if (style === 'canvas_banner') {
      const bannerUrl = await this.generateAndUploadBanner(
        params.title,
        params.categoryName || 'CCC Study Guide',
        params.theme || BANNER_THEMES[0]
      );
      return { url: bannerUrl, type: 'canvas_banner' };
    }

    const persona = params.persona || (style === 'youtube_pro' ? 'male_instructor' : 'female_student');
    const topicDesc = params.thumbnailPrompt ? `${params.thumbnailPrompt}, ` : '';

    let aiPrompt = '';
    if (params.customPrompt && params.customPrompt.trim().length > 10) {
      aiPrompt = params.customPrompt.trim();
    } else {
      switch (persona) {
        case 'female_student':
          aiPrompt = `Hyper-realistic 8k cinematic photography of an intelligent young Indian female student with glasses and warm smile, studying for CCC computer exam on a sleek silver laptop at a modern wooden study desk, screen displaying spreadsheet formulas and computer concepts for "${params.title}". ${topicDesc}Warm golden hour lighting, clean library background, crisp detail, Sony A7R IV photography, 16:9 aspect ratio.`;
          break;

        case 'male_student':
          aiPrompt = `Hyper-realistic 8k studio photo of a smart Indian male tech student with headphones sitting at a modern dark desk with glowing laptop and dual monitors, learning computer concepts for "${params.title}". ${topicDesc}Cyan and amber rim lighting, aesthetic modern room, natural expression, ultra-sharp detail, cinematic bokeh, 16:9 aspect ratio.`;
          break;

        case 'female_teacher':
          aiPrompt = `Professional Indian female educator in elegant attire standing in a modern smart classroom, pointing enthusiastically at a large digital interactive whiteboard displaying "${params.title}". ${topicDesc}Bright studio lighting, masterclass lecture setting, highly detailed, photorealistic 8k, 16:9 aspect ratio.`;
          break;

        case 'male_instructor':
          aiPrompt = `High-CTR YouTube masterclass thumbnail photo of an energetic Indian male computer teacher with headset in a modern high-tech studio, gesturing towards floating glowing 3D hologram badges of "${params.title}". ${topicDesc}Vibrant neon magenta and electric blue studio lighting, 8k resolution, 16:9 aspect ratio.`;
          break;

        case 'exam_topper':
          aiPrompt = `Joyful Indian college student smiling with thumbs up, holding a NIELIT CCC Computer Course certificate of excellence, sitting next to a modern laptop in a university computer lab for "${params.title}". ${topicDesc}Bright motivational lighting, sharp focus, 16:9 aspect ratio.`;
          break;

        case 'cyber_hacker':
          aiPrompt = `Futuristic cyber security specialist working in a dark control room with holographic neon data streams, glowing security lock shields, and computer terminals for "${params.title}". ${topicDesc}8k resolution, Octane 3D render lighting, 16:9 aspect ratio.`;
          break;

        default:
          aiPrompt = `Ultra-realistic 8k studio photography of modern educational computer workstation with Indian student for "${params.title}". ${topicDesc}Dual monitors with software UI, soft ambient lighting, clean aesthetic workspace, 16:9 aspect ratio.`;
          break;
      }
    }

    const nanoBananaModels = [
      'gemini-3.1-flash-image-preview',
      'gemini-3-pro-image-preview',
      'gemini-3.1-flash-lite-image-preview',
    ];

    let lastError = '';

    // 1. Try Gemini Nano Banana models (generateContent with responseModalities IMAGE)
    for (const model of nanoBananaModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          key
        )}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate a 16:9 high-resolution photorealistic educational thumbnail: ${aiPrompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ['IMAGE', 'TEXT'],
            },
          }),
        });

        const data = await response.json();
        if (response.ok && data.candidates?.[0]?.content?.parts) {
          const parts = data.candidates[0].content.parts;
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              const base64 = part.inlineData.data;
              const mime = part.inlineData.mimeType || 'image/jpeg';
              const byteChars = atob(base64);
              const byteNums = new Array(byteChars.length);
              for (let i = 0; i < byteChars.length; i++) {
                byteNums[i] = byteChars.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNums);
              const blob = new Blob([byteArray], { type: mime });

              const fileName = `nano-banana-${Date.now()}-${generateSlug(params.title.slice(0, 20))}.jpg`;
              const file = new File([blob], fileName, { type: mime });

              try {
                const uploadRes = await uploadAssetToHygraph(file);
                return { url: uploadRes.url, type: 'nano_banana_realistic' };
              } catch (e) {
                console.warn('Hygraph upload failed for Nano Banana banner, falling back to data URL:', e);
                return { url: `data:${mime};base64,${base64}`, type: 'nano_banana_realistic' };
              }
            }
          }
        }
      } catch (err: any) {
        lastError = err.message || String(err);
      }
    }

    // 2. Try Google Imagen 3 Predict endpoint
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(
        key
      )}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: aiPrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '16:9',
            outputMimeType: 'image/jpeg',
          },
        }),
      });

      const data = await response.json();
      if (response.ok && data.predictions?.[0]?.bytesBase64Encoded) {
        const base64 = data.predictions[0].bytesBase64Encoded;
        const mime = 'image/jpeg';
        const byteChars = atob(base64);
        const byteNums = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNums[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNums);
        const blob = new Blob([byteArray], { type: mime });

        const fileName = `imagen-${Date.now()}-${generateSlug(params.title.slice(0, 20))}.jpg`;
        const file = new File([blob], fileName, { type: mime });

        try {
          const uploadRes = await uploadAssetToHygraph(file);
          return { url: uploadRes.url, type: 'nano_banana_realistic' };
        } catch (e) {
          console.warn('Hygraph upload failed for Imagen 3 banner, falling back to data URL:', e);
          return { url: `data:${mime};base64,${base64}`, type: 'nano_banana_realistic' };
        }
      }
    } catch (e) {
      console.warn('Imagen 3 predict call failed:', e);
    }

    // 3. Fallback: High-resolution branded canvas banner
    const fallbackBannerUrl = await this.generateAndUploadBanner(
      params.title,
      params.categoryName || 'CCC Study Guide',
      params.theme || BANNER_THEMES[0]
    );

    return { url: fallbackBannerUrl, type: 'canvas_banner' };
  },

  /**
   * Generates a modern high-resolution 1200x630 Canvas Banner with gradients,
   * typography, category badge, and glowing elements, returning a Blob and Data URL.
   */
  async createBlogBannerCanvas(
    title: string,
    categoryName: string = 'CCC Study Guide',
    theme: BannerTheme = BANNER_THEMES[0]
  ): Promise<{ dataUrl: string; blob: Blob }> {
    return new Promise((resolve, reject) => {
      try {
        const width = 1200;
        const height = 630;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas 2D context not available.');
        }

        // 1. Background Gradient
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, theme.gradient[0]);
        bgGrad.addColorStop(0.5, theme.gradient[1]);
        bgGrad.addColorStop(1, theme.gradient[2]);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. Abstract Geometric / Tech Glow Circles
        ctx.save();
        const glow1 = ctx.createRadialGradient(width * 0.85, height * 0.2, 10, width * 0.85, height * 0.2, 350);
        glow1.addColorStop(0, `${theme.accent}44`);
        glow1.addColorStop(1, 'transparent');
        ctx.fillStyle = glow1;
        ctx.beginPath();
        ctx.arc(width * 0.85, height * 0.2, 350, 0, Math.PI * 2);
        ctx.fill();

        const glow2 = ctx.createRadialGradient(width * 0.15, height * 0.85, 10, width * 0.15, height * 0.85, 300);
        glow2.addColorStop(0, `${theme.accent}33`);
        glow2.addColorStop(1, 'transparent');
        ctx.fillStyle = glow2;
        ctx.beginPath();
        ctx.arc(width * 0.15, height * 0.85, 300, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3. Grid Pattern Overlay
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        ctx.restore();

        // 4. Glassmorphic Card Container
        const cardX = 80;
        const cardY = 70;
        const cardW = width - 160;
        const cardH = height - 140;
        const radius = 28;

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, radius);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 5. Header Badges: "NIELIT CCC 2026" & Category
        const badgeY = cardY + 50;

        // Badge 1: NIELIT CCC 2026 (Left)
        ctx.save();
        ctx.fillStyle = theme.accent;
        ctx.beginPath();
        ctx.roundRect(cardX + 45, badgeY, 160, 36, 18);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★ NIELIT CCC 2026', cardX + 45 + 80, badgeY + 18);
        ctx.restore();

        // Badge 2: Category Pill (Right of badge 1)
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const catWidth = Math.min(300, Math.max(140, categoryName.length * 9 + 30));
        ctx.roundRect(cardX + 220, badgeY, catWidth, 36, 18);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 13px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(categoryName, cardX + 220 + catWidth / 2, badgeY + 18);
        ctx.restore();

        // 6. Main Title (Word-wrapped with bold modern typography)
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const titleX = cardX + 45;
        let titleY = badgeY + 65;
        const maxTitleWidth = cardW - 90;
        const words = title.split(' ');
        let currentLine = '';
        const lines: string[] = [];

        for (let i = 0; i < words.length; i++) {
          const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxTitleWidth && i > 0) {
            lines.push(currentLine);
            currentLine = words[i];
            if (lines.length === 3) {
              currentLine += '...';
              break;
            }
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine && lines.length < 3) {
          lines.push(currentLine);
        }

        const lineHeight = 56;
        for (let j = 0; j < lines.length; j++) {
          ctx.fillText(lines[j], titleX, titleY + j * lineHeight);
        }
        ctx.restore();

        // 7. Footer Branding Bar
        const footerY = cardY + cardH - 55;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cardX + 45, footerY);
        ctx.lineTo(cardX + cardW - 45, footerY);
        ctx.stroke();

        ctx.fillStyle = theme.accent;
        ctx.font = 'bold 15px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('CCC PREP ACADEMY', cardX + 45, footerY + 25);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '500 13px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('Official Study Guide & Exam Notes', cardX + cardW - 45, footerY + 25);
        ctx.restore();

        // 8. Convert to Data URL and Blob
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ dataUrl, blob });
            } else {
              reject(new Error('Failed to create image blob from canvas.'));
            }
          },
          'image/png',
          0.95
        );
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * Generates a banner image and uploads it to Supabase Storage, returning the public URL.
   */
  async generateAndUploadBanner(
    title: string,
    categoryName: string = 'CCC Study Guide',
    theme: BannerTheme = BANNER_THEMES[0]
  ): Promise<string> {
    const { blob, dataUrl } = await this.createBlogBannerCanvas(title, categoryName, theme);
    const fileName = `blog-banner-${Date.now()}-${generateSlug(title.slice(0, 20))}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    try {
      const result = await uploadAssetToHygraph(file);
      return result.url;
    } catch (e) {
      console.warn('Direct Hygraph banner upload fallback to Data URL:', e);
      return dataUrl;
    }
  },
};
