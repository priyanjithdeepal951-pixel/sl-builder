import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const FALLBACK_GEMINI_MODEL = 'gemini-4-hydrogen';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientHighDemandError(err: unknown): boolean {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();
  return (
    lower.includes('503') ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('overloaded') ||
    lower.includes('etimedout') ||
    lower.includes('econnreset')
  );
}

interface AgentChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface StudioBlockSummary {
  id: string;
  type: string;
  name: string;
  content: string;
  subtitle?: string;
  action?: string;
  apiEndpoint?: string;
  style?: Record<string, unknown>;
}

interface StudioContextPayload {
  projectName?: string;
  activePageName?: string;
  activePageSlug?: string;
  activeTab?: 'html' | 'css' | 'js';
  selectedBlock?: StudioBlockSummary | null;
  blocks?: StudioBlockSummary[];
  codeSnippet?: string;
}

const agentResponseSchema = {
  type: Type.OBJECT,
  properties: {
    reply: {
      type: Type.STRING,
      description:
        'Clear, helpful explanation or answer for the user (in Sinhala if the user wrote in Sinhala or mixed Sinhala/English, otherwise English).',
    },
    codeSnippet: {
      type: Type.OBJECT,
      description: 'Optional code snippet or bug fix relevant to the user question or request.',
      properties: {
        language: {
          type: Type.STRING,
          description: 'e.g. html, css, javascript, tsx, python',
        },
        title: {
          type: Type.STRING,
          description: 'Short title describing the snippet',
        },
        code: {
          type: Type.STRING,
          description: 'Clean, ready-to-use code',
        },
      },
      required: ['language', 'title', 'code'],
    },
    actions: {
      type: Type.ARRAY,
      description:
        'Structured studio builder actions to add, edit, style, or delete blocks on the active canvas page.',
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description:
              'One of: add-block, update-block, delete-block, move-block, select-block, update-page-style, create-page, switch-code-tab',
          },
          summary: {
            type: Type.STRING,
            description: 'Short label describing this action',
          },
          templateId: {
            type: Type.STRING,
            description:
              'Template ID for add-block, e.g. tpl-navbar, tpl-section, tpl-row, tpl-column, tpl-card, tpl-heading, tpl-paragraph, tpl-richtext, tpl-button, tpl-submit-button, tpl-icon-button, tpl-text-input, tpl-email-input, tpl-password-input, tpl-textarea, tpl-select, tpl-checkbox, tpl-switch, tpl-rating-bar, tpl-slider, tpl-image, tpl-icon, tpl-avatar, tpl-video, tpl-youtube-player, tpl-badge, tpl-stat, tpl-pricing, tpl-testimonial, tpl-accordion, tpl-datatable, tpl-chart, tpl-progress-bar, tpl-modal, tpl-footer, tpl-fetch, tpl-flask, tpl-storage, tpl-cloud-db, tpl-auth, tpl-counter, tpl-toggle, tpl-timer, tpl-if-else',
          },
          blockType: {
            type: Type.STRING,
            description: 'Fallback block type, e.g. ui-heading, ui-button, ui-card, ui-input',
          },
          targetBlockId: {
            type: Type.STRING,
            description: 'Existing block ID for update-block, delete-block, move-block, or select-block',
          },
          positionIndex: {
            type: Type.NUMBER,
            description: 'Optional 0-based index for inserting or moving a block',
          },
          name: { type: Type.STRING },
          content: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          optionsCsv: {
            type: Type.STRING,
            description: 'Comma or pipe separated options/items for lists, dropdowns, chips, rows, columns',
          },
          imageUrl: { type: Type.STRING },
          videoUrl: { type: Type.STRING },
          actionType: {
            type: Type.STRING,
            description:
              'Optional click action: alert, navigate-page, open-url, call-api, increment-counter, toggle-visibility, submit-form, show-confirm, copy-clipboard',
          },
          actionPayload: { type: Type.STRING },
          apiEndpoint: { type: Type.STRING },
          httpMethod: { type: Type.STRING },
          stylePatch: {
            type: Type.OBJECT,
            properties: {
              customTextHex: { type: Type.STRING },
              customBgHex: { type: Type.STRING },
              bgGradient: { type: Type.STRING },
              textGradient: { type: Type.STRING },
              textShadow: { type: Type.STRING },
              borderColor: { type: Type.STRING },
              borderWidth: { type: Type.STRING },
              borderRadius: { type: Type.STRING },
              fontFamily: { type: Type.STRING },
              fontWeight: { type: Type.STRING },
              fontSize: { type: Type.STRING },
              textAlign: { type: Type.STRING },
              padding: { type: Type.STRING },
              shadow: { type: Type.STRING },
            },
          },
          pageStylePatch: {
            type: Type.OBJECT,
            properties: {
              backgroundType: { type: Type.STRING },
              backgroundColor: { type: Type.STRING },
              gradientFrom: { type: Type.STRING },
              gradientTo: { type: Type.STRING },
              textColor: { type: Type.STRING },
              accentColor: { type: Type.STRING },
              liveAnimation: { type: Type.STRING },
            },
          },
          pageName: { type: Type.STRING },
          codeTab: { type: Type.STRING },
        },
        required: ['type', 'summary'],
      },
    },
  },
  required: ['reply'],
};

function buildSystemInstruction(mode: 'agent' | 'ask', ctx: StudioContextPayload): string {
  const blocksList = (ctx.blocks || [])
    .slice(0, 35)
    .map(
      (b, idx) =>
        `${idx}. id="${b.id}" | type="${b.type}" | name="${b.name}" | content="${b.content}"${
          b.subtitle ? ` | subtitle="${b.subtitle}"` : ''
        }${b.action ? ` | action="${b.action}"` : ''}`
    )
    .join('\n');

  const selectedInfo = ctx.selectedBlock
    ? `Selected Block: id="${ctx.selectedBlock.id}", type="${ctx.selectedBlock.type}", name="${ctx.selectedBlock.name}", content="${ctx.selectedBlock.content}", subtitle="${ctx.selectedBlock.subtitle || ''}"`
    : 'Selected Block: none';

  return `You are the built-in Gemini Coding Agent inside a visual Web & App Builder IDE (BlockCraft / SL WebStudio).
Your job is to help the user build UI sections/pages via agent actions AND solve any HTML, CSS, JavaScript, React TSX, or Python Flask coding/debugging questions.

Language Rule:
- Match the user's language. If the user writes in Sinhala (සිංහල) or Singlish, reply naturally in clear Sinhala with accurate technical terms. If the user writes in English, reply in English.

Current Studio Context:
- Project: ${ctx.projectName || 'WebStudio Project'}
- Active Page: ${ctx.activePageName || 'Home'} (/${ctx.activePageSlug || 'index'})
- Active Studio Tab: ${ctx.activeTab || 'html'}
- ${selectedInfo}
- Current Page Blocks (${ctx.blocks?.length || 0}):
${blocksList || '(empty canvas)'}
${ctx.codeSnippet ? `\n- Generated Code Excerpt (${ctx.activeTab || 'html'}):\n\`\`\`\n${ctx.codeSnippet.slice(0, 3500)}\n\`\`\`` : ''}

Available Block Template IDs for "add-block" actions:
- Layout & Navigation: tpl-navbar, tpl-sidebar, tpl-appbar, tpl-fab, tpl-tabbar, tpl-link, tpl-section (Container), tpl-row, tpl-column, tpl-stack, tpl-card, tpl-listview, tpl-grid, tpl-spacer, tpl-divider, tpl-vertical-divider, tpl-pageview, tpl-carousel, tpl-wrap, tpl-datatable, tpl-flex, tpl-modal, tpl-footer
- Typography & Stats: tpl-heading, tpl-paragraph, tpl-richtext, tpl-badge, tpl-stat, tpl-markdown
- Forms & Interactive: tpl-button, tpl-submit-button, tpl-icon-button, tpl-text-input, tpl-email-input, tpl-password-input, tpl-number-input, tpl-date-input, tpl-textarea, tpl-select, tpl-checkbox, tpl-radio, tpl-switch, tpl-checkbox-tile, tpl-switch-tile, tpl-pin-code, tpl-slider, tpl-rating-bar, tpl-credit-card, tpl-counter-button, tpl-choice-chips, tpl-checkbox-group, tpl-file-upload, tpl-form-validation, tpl-pricing, tpl-testimonial, tpl-accordion
- Media & Widgets: tpl-image, tpl-icon, tpl-video, tpl-youtube-player, tpl-avatar, tpl-list-tile, tpl-slidable-tile, tpl-calendar, tpl-toggle-icon, tpl-audio-player, tpl-progress-bar, tpl-chart, tpl-barcode, tpl-tooltip, tpl-genui-chat
- Logic & Backend: tpl-hat-onload, tpl-hat-click, tpl-if-else, tpl-loop, tpl-counter, tpl-toggle, tpl-timer, tpl-variable, tpl-list, tpl-object, tpl-feedback, tpl-storage, tpl-cloud-db, tpl-auth, tpl-fetch, tpl-flask, tpl-device

Valid stylePatch properties:
- customTextHex (e.g. "#FFFFFF"), customBgHex (e.g. "#0F172A"), bgGradient (CSS linear-gradient), textGradient (CSS linear-gradient), textShadow (CSS text-shadow), borderColor (hex), borderWidth ("1px" | "2px"), borderRadius ("rounded-lg" | "rounded-xl" | "rounded-2xl" | "rounded-full"), fontFamily ("sans" | "serif" | "mono" | "display" | "rounded" | "condensed" | "script"), fontWeight ("normal" | "medium" | "semibold" | "bold" | "extrabold"), fontSize ("xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl"), textAlign ("left" | "center" | "right"), padding ("p-2" | "p-4" | "p-6"), shadow ("shadow-none" | "shadow-md" | "shadow-xl" | "shadow-2xl").

Valid pageStylePatch properties:
- backgroundType ("solid" | "gradient"), backgroundColor (hex), gradientFrom (hex), gradientTo (hex), textColor (hex), accentColor (hex), liveAnimation ("none" | "meteors" | "starfield" | "aurora" | "particles" | "cyber-grid" | "snow").

Mode Behavior (${mode.toUpperCase()}):
${
  mode === 'agent'
    ? `- In AGENT mode, whenever the user asks to build, add, edit, style, fix, or redesign something on the page, emit concrete "actions" so the IDE updates the live canvas immediately!
- Also include a helpful "codeSnippet" if the user asked for custom code or wants to inspect the HTML/CSS/JS/React/Flask code.
- When styling or updating the currently selected block, include its targetBlockId.`
    : `- In ASK / DEBUG mode, focus on diagnosing coding problems, answering HTML/CSS/JS/React/Python Flask questions, explaining errors clearly, and providing clean, fixed "codeSnippet" blocks.
- Only emit "actions" if the user explicitly asks you to apply a fix directly to their canvas.`
}`;
}

function mapGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes('api_key_invalid') || lower.includes('api key not valid')) {
    return {
      status: 400,
      message: 'GEMINI_API_KEY is invalid. Check your key in Settings > Secrets.',
    };
  }
  if (lower.includes('permission_denied') || lower.includes('403')) {
    return {
      status: 403,
      message: 'Gemini API access denied (403). Verify GEMINI_API_KEY permissions in Settings > Secrets.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429') || lower.includes('quota')) {
    return {
      status: 429,
      message: 'Gemini API rate limit or quota reached (429). Please wait a moment and try again.',
    };
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      status: 404,
      message: `Requested Gemini model (${GEMINI_MODEL}) was not found or is unavailable.`,
    };
  }
  if (isTransientHighDemandError(err)) {
    return {
      status: 503,
      message:
        'Gemini AI servers are temporarily experiencing high demand (503). Please wait a few seconds and click Retry.',
    };
  }
  return {
    status: 500,
    message: raw || 'Failed to generate response from Gemini AI.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/gemini/health', (_req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const configured = Boolean(apiKey && apiKey.trim() && apiKey !== 'MY_GEMINI_API_KEY');
    res.json({ ok: true, configured, model: GEMINI_MODEL });
  });

  app.post('/api/gemini/agent', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim() || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error:
          'GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY in Settings > Secrets to use the Gemini Coding Agent.',
      });
      return;
    }

    const body = (req.body || {}) as {
      messages?: AgentChatMessage[];
      mode?: 'agent' | 'ask';
      model?: string;
      studioContext?: StudioContextPayload;
    };

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const mode = body.mode === 'ask' ? 'ask' : 'agent';
    const primaryModel =
      body.model === 'gemini-4-hydrogen' ? 'gemini-4-hydrogen' : GEMINI_MODEL;
    const fallbackModel =
      primaryModel === 'gemini-4-hydrogen' ? 'gemini-3.1-flash-lite' : FALLBACK_GEMINI_MODEL;
    const studioContext = body.studioContext || {};

    const validMessages = messages
      .filter((m) => m && typeof m.text === 'string' && m.text.trim().length > 0)
      .slice(-12);

    if (validMessages.length === 0) {
      res.status(400).json({ error: 'Prompt message cannot be empty.' });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const contents = validMessages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));

      const systemInstruction = buildSystemInstruction(mode, studioContext);

      const attemptGenerate = async (modelName: string) => {
        return ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: agentResponseSchema,
            ...(modelName === 'gemini-4-hydrogen'
              ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
              : {}),
          },
        });
      };

      let usedModel = primaryModel;
      let response;
      try {
        response = await attemptGenerate(primaryModel);
      } catch (firstErr) {
        if (!isTransientHighDemandError(firstErr)) throw firstErr;
        await sleep(700);
        try {
          response = await attemptGenerate(primaryModel);
        } catch (secondErr) {
          if (!isTransientHighDemandError(secondErr)) throw secondErr;
          await sleep(500);
          usedModel = fallbackModel;
          response = await attemptGenerate(fallbackModel);
        }
      }

      const rawText = response.text?.trim() || '';
      if (!rawText) {
        res.status(502).json({ error: 'Gemini returned an empty response. Please try again.' });
        return;
      }

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        parsed = { reply: rawText, actions: [] };
      }

      res.json({
        reply: typeof parsed.reply === 'string' ? parsed.reply : rawText,
        codeSnippet:
          parsed.codeSnippet && typeof parsed.codeSnippet === 'object' ? parsed.codeSnippet : null,
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
        model: usedModel,
      });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
