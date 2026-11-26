import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Check,
  Code2,
  Copy,
  Eraser,
  Loader2,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Terminal,
  Wand2,
  Wrench,
} from 'lucide-react';
import type { BlockStyle, CanvasBlock, PageStyleSettings, SitePage } from '../../types/builder';

export interface GeminiAgentAction {
  type:
    | 'add-block'
    | 'update-block'
    | 'delete-block'
    | 'move-block'
    | 'select-block'
    | 'update-page-style'
    | 'create-page'
    | 'switch-code-tab';
  summary: string;
  templateId?: string;
  blockType?: string;
  targetBlockId?: string;
  positionIndex?: number;
  name?: string;
  content?: string;
  subtitle?: string;
  optionsCsv?: string;
  imageUrl?: string;
  videoUrl?: string;
  actionType?: string;
  actionPayload?: string;
  apiEndpoint?: string;
  httpMethod?: string;
  stylePatch?: Partial<BlockStyle>;
  pageStylePatch?: Partial<PageStyleSettings>;
  pageName?: string;
  codeTab?: 'html' | 'css' | 'js';
}

interface AgentCodeSnippet {
  language: string;
  title: string;
  code: string;
}

interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  codeSnippet?: AgentCodeSnippet | null;
  actions?: GeminiAgentAction[];
  appliedCount?: number;
  error?: boolean;
  retryPrompt?: string;
  retryMode?: 'agent' | 'ask';
}

interface GeminiCodingAgentPanelProps {
  lang: 'en' | 'si';
  projectName: string;
  activePage: SitePage | undefined;
  blocks: CanvasBlock[];
  selectedBlock: CanvasBlock | null;
  activeTab: 'html' | 'css' | 'js';
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  reactCode: string;
  flaskCode: string;
  onApplyAgentActions: (actions: GeminiAgentAction[]) => number;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const STARTER_PROMPTS = [
  {
    id: 'hero',
    mode: 'agent' as const,
    labelSi: 'Hero + CTA හදන්න',
    labelEn: 'Build Hero + CTA',
    prompt: 'මේ page එකට ලස්සන Hero heading එකක්, description එකක් සහ gradient CTA button එකක් add කරන්න.',
  },
  {
    id: 'contact',
    mode: 'agent' as const,
    labelSi: 'Contact Form දාන්න',
    labelEn: 'Add Contact Form',
    prompt: 'Email input එකක්, message textarea එකක් සහ Submit button එකක් එක්ක Contact Form section එකක් හදන්න.',
  },
  {
    id: 'style',
    mode: 'agent' as const,
    labelSi: 'Selected එක Style කරන්න',
    labelEn: 'Style Selected',
    prompt: 'දැනට select වෙලා තියෙන block එකට modern glass gradient look එකක් සහ shadow එකක් apply කරන්න.',
  },
  {
    id: 'debug',
    mode: 'ask' as const,
    labelSi: 'Code Debug / ප්‍රශ්න',
    labelEn: 'Debug / Fix Code',
    prompt: 'දැනට තියෙන page blocks සහ code එක check කරලා වැඩිදියුණු කරන්න පුළුවන් දේවල් හෝ bugs තියෙනවා නම් කියන්න.',
  },
];

export const GeminiCodingAgentPanel: React.FC<GeminiCodingAgentPanelProps> = ({
  lang,
  projectName,
  activePage,
  blocks,
  selectedBlock,
  activeTab,
  htmlCode,
  cssCode,
  jsCode,
  reactCode,
  flaskCode,
  onApplyAgentActions,
  onToast,
}) => {
  const [mode, setMode] = useState<'agent' | 'ask'>('agent');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.1-flash-lite' | 'gemini-4-hydrogen'>(
    'gemini-3.1-flash-lite'
  );
  const [autoApply, setAutoApply] = useState<boolean>(true);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const getActiveCodeExcerpt = () => {
    if (activeTab === 'css') return cssCode;
    if (activeTab === 'js') return `${jsCode}\n\n// --- React TSX ---\n${reactCode.slice(0, 1200)}\n\n# --- Flask ---\n${flaskCode.slice(0, 800)}`;
    return htmlCode;
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    onToast(lang === 'si' ? 'Code copy විය!' : 'Code copied!', 'success');
    setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 1600);
  };

  const handleSend = async (overridePrompt?: string, overrideMode?: 'agent' | 'ask') => {
    const text = (overridePrompt ?? input).trim();
    if (!text || isLoading) return;

    const effectiveMode = overrideMode || mode;
    if (overrideMode && overrideMode !== mode) {
      setMode(overrideMode);
    }

    const userMsg: ChatEntry = {
      id: `u_${Date.now()}`,
      role: 'user',
      text,
    };

    const cleanedMessages = messages.filter((m) => !m.error);
    const nextHistory = [...cleanedMessages, userMsg];
    setMessages(nextHistory);
    if (!overridePrompt) setInput('');
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutHandle = window.setTimeout(() => controller.abort(), 32000);
      let res: Response;
      try {
        res = await fetch('/api/gemini/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            mode: effectiveMode,
            model: selectedModel,
            messages: nextHistory
              .filter((m) => !m.error)
              .map((m) => ({ role: m.role, text: m.text })),
            studioContext: {
              projectName,
              activePageName: activePage?.name || 'Home',
              activePageSlug: activePage?.slug || 'index',
              activeTab,
              selectedBlock: selectedBlock
                ? {
                    id: selectedBlock.id,
                    type: selectedBlock.type,
                    name: selectedBlock.name,
                    content: selectedBlock.content,
                    subtitle: selectedBlock.subtitle,
                    action: selectedBlock.action,
                    apiEndpoint: selectedBlock.apiEndpoint,
                    style: selectedBlock.style as Record<string, unknown>,
                  }
                : null,
              blocks: blocks.slice(0, 35).map((b) => ({
                id: b.id,
                type: b.type,
                name: b.name,
                content: b.content,
                subtitle: b.subtitle,
                action: b.action,
                apiEndpoint: b.apiEndpoint,
              })),
              codeSnippet: getActiveCodeExcerpt(),
            },
          }),
        });
      } finally {
        window.clearTimeout(timeoutHandle);
      }

      const rawBody = await res.text();
      let data: {
        reply?: string;
        codeSnippet?: AgentCodeSnippet | null;
        actions?: GeminiAgentAction[];
        error?: string;
      } = {};
      try {
        data = JSON.parse(rawBody) as typeof data;
      } catch {
        throw new Error(
          lang === 'si'
            ? `Server ප්‍රතිචාරය ප්‍රමාද විය හෝ reconnect වෙමින් පවතී (HTTP ${res.status}). කරුණාකර Retry click කරන්න (හෝ Flash Lite model එක තෝරන්න).`
            : `Gateway timeout or server restart (HTTP ${res.status}). Please click Retry or switch to Flash Lite.`
        );
      }

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const actions = Array.isArray(data.actions) ? data.actions : [];
      let appliedCount = 0;
      if (actions.length > 0 && autoApply && effectiveMode === 'agent') {
        appliedCount = onApplyAgentActions(actions);
        if (appliedCount > 0) {
          onToast(
            lang === 'si'
              ? `Gemini Agent විසින් actions ${appliedCount}ක් apply කළා!`
              : `Gemini Agent applied ${appliedCount} action${appliedCount > 1 ? 's' : ''}!`,
            'success'
          );
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: data.reply || 'Done.',
          codeSnippet: data.codeSnippet || null,
          actions,
          appliedCount,
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gemini request failed.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: msg,
          error: true,
          retryPrompt: text,
          retryMode: effectiveMode,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualApply = (entryId: string, actions: GeminiAgentAction[]) => {
    const count = onApplyAgentActions(actions);
    setMessages((prev) =>
      prev.map((m) => (m.id === entryId ? { ...m, appliedCount: count } : m))
    );
    if (count > 0) {
      onToast(
        lang === 'si'
          ? `Actions ${count}ක් canvas එකට apply කළා!`
          : `Applied ${count} action${count > 1 ? 's' : ''} to canvas!`,
        'success'
      );
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-[#11151E]">
      {/* Header Bar */}
      <div className="px-2.5 py-2 border-b border-white/10 bg-[#141923] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-white truncate">Gemini AI</span>
              <select
                value={selectedModel}
                onChange={(e) =>
                  setSelectedModel(
                    e.target.value === 'gemini-4-hydrogen'
                      ? 'gemini-4-hydrogen'
                      : 'gemini-3.1-flash-lite'
                  )
                }
                title="Select Gemini Model"
                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-400/25 outline-none cursor-pointer shrink-0"
              >
                <option value="gemini-3.1-flash-lite" className="bg-[#0F131C] text-slate-100">
                  Flash Lite
                </option>
                <option value="gemini-4-hydrogen" className="bg-[#0F131C] text-slate-100">
                  4-Hydrogen
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="inline-flex rounded-lg bg-[#0A0D13] p-0.5 border border-white/10 text-[10px]">
            <button
              type="button"
              onClick={() => setMode('agent')}
              className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                mode === 'agent'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={lang === 'si' ? 'Canvas & Code Agent' : 'Agent Coding Mode'}
            >
              <Wand2 className="w-2.5 h-2.5" />
              <span>Agent</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('ask')}
              className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                mode === 'ask'
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={lang === 'si' ? 'Coding ප්‍රශ්න සහ Debug' : 'Ask & Debug Mode'}
            >
              <Wrench className="w-2.5 h-2.5" />
              <span>Debug</span>
            </button>
          </div>

          {mode === 'agent' && (
            <button
              type="button"
              onClick={() => setAutoApply((v) => !v)}
              title={
                autoApply
                  ? 'Auto-apply agent edits to canvas: ON'
                  : 'Auto-apply agent edits to canvas: OFF'
              }
              className={`px-1.5 py-1 rounded-md text-[9px] font-semibold border cursor-pointer transition-colors ${
                autoApply
                  ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                  : 'bg-[#0A0D13] border-white/10 text-slate-400'
              }`}
            >
              Auto
            </button>
          )}

          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              title={lang === 'si' ? 'Chat මකන්න' : 'Clear chat'}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Context Strip */}
      <div className="px-2.5 py-1 border-b border-white/5 bg-[#0D1119] flex items-center justify-between text-[10px] text-slate-400 shrink-0">
        <span className="truncate flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-sky-400 shrink-0" />
          <span className="text-slate-300 font-medium truncate">
            /{activePage?.slug || 'index'}
          </span>
          <span>·</span>
          <span className="truncate">
            {selectedBlock ? `Target: ${selectedBlock.name}` : `${blocks.length} blocks`}
          </span>
        </span>
        <span className="font-mono text-[9px] uppercase text-slate-500 shrink-0">{activeTab}</span>
      </div>

      {/* Chat / Output Area */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5">
        {messages.length === 0 ? (
          <div className="space-y-2.5">
            <div className="rounded-xl bg-[#161C28] border border-white/10 p-2.5 text-[11px] text-slate-300 leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
                <Bot className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {lang === 'si'
                    ? 'Gemini Coding Agent සූදානම්!'
                    : 'Gemini Coding Agent Ready'}
                </span>
              </div>
              <p className="text-slate-400 text-[10.5px]">
                {lang === 'si'
                  ? 'UI blocks add/style කරන්න, layouts හදන්න, හෝ HTML/CSS/JS/React/Flask coding ප්‍රශ්න සහ errors විසඳගන්න අහන්න.'
                  : 'Ask Gemini to build UI blocks, style elements, or debug HTML, CSS, JS, React & Flask code.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {STARTER_PROMPTS.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => handleSend(sp.prompt, sp.mode)}
                  className="text-left p-2 rounded-lg bg-[#161B26] hover:bg-[#1E2636] border border-white/10 hover:border-blue-400/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-300 mb-0.5">
                    {sp.mode === 'agent' ? (
                      <Wand2 className="w-2.5 h-2.5 shrink-0" />
                    ) : (
                      <Wrench className="w-2.5 h-2.5 text-violet-300 shrink-0" />
                    )}
                    <span className="truncate">{lang === 'si' ? sp.labelSi : sp.labelEn}</span>
                  </div>
                  <p className="text-[9.5px] text-slate-400 line-clamp-2 leading-snug">
                    {sp.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((entry) => (
            <div
              key={entry.id}
              className={`flex flex-col ${
                entry.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[96%] rounded-xl px-2.5 py-2 text-[11px] leading-relaxed ${
                  entry.role === 'user'
                    ? 'bg-blue-600/25 border border-blue-400/30 text-blue-50'
                    : entry.error
                    ? 'bg-rose-950/50 border border-rose-500/40 text-rose-200 w-full'
                    : 'bg-[#161C28] border border-white/10 text-slate-200 w-full'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{entry.text}</p>

                {entry.error && entry.retryPrompt && (
                  <div className="mt-2">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSend(entry.retryPrompt, entry.retryMode)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/40 text-rose-100 text-[10px] font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{lang === 'si' ? 'නැවත උත්සාහ කරන්න (Retry)' : 'Retry'}</span>
                    </button>
                  </div>
                )}

                {entry.actions && entry.actions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-sky-300 flex items-center gap-1">
                        <Wand2 className="w-3 h-3" />
                        Actions ({entry.actions.length})
                      </span>
                      {entry.appliedCount && entry.appliedCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
                          <Check className="w-3 h-3" />
                          Applied ({entry.appliedCount})
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleManualApply(entry.id, entry.actions!)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold cursor-pointer"
                        >
                          <Play className="w-2.5 h-2.5" />
                          Apply
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {entry.actions.map((act, idx) => (
                        <span
                          key={`${entry.id}_act_${idx}`}
                          className="px-1.5 py-0.5 rounded bg-[#0B0F17] border border-white/10 text-[9.5px] text-slate-300"
                        >
                          {act.summary}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {entry.codeSnippet && entry.codeSnippet.code && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-white/10 bg-[#0A0D13]">
                    <div className="px-2 py-1 bg-[#111722] border-b border-white/10 flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-slate-300 flex items-center gap-1 truncate">
                        <Code2 className="w-3 h-3 text-amber-300 shrink-0" />
                        <span className="truncate">{entry.codeSnippet.title}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(entry.id, entry.codeSnippet!.code)}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer shrink-0"
                      >
                        {copiedId === entry.id ? (
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-2.5 h-2.5" />
                        )}
                        <span>{copiedId === entry.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-2 text-[10px] font-mono text-emerald-200 overflow-x-auto max-h-36">
                      <code>{entry.codeSnippet.code}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-[#161C28] border border-white/10 text-[11px] text-blue-300">
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>
              {mode === 'agent'
                ? lang === 'si'
                  ? 'Gemini Agent නිර්මාණය කරමින් සිටී...'
                  : 'Gemini Agent is coding...'
                : lang === 'si'
                ? 'Gemini විසඳුම සොයමින් සිටී...'
                : 'Gemini is analyzing...'}
            </span>
          </div>
        )}
      </div>

      {/* Prompt Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
        className="p-2 border-t border-white/10 bg-[#141923] flex items-end gap-1.5 shrink-0"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          rows={2}
          placeholder={
            mode === 'agent'
              ? lang === 'si'
                ? 'Gemini Agent ට UI/Code හදන්න කියන්න... (Enter = Send)'
                : 'Tell Gemini Agent what to build or edit... (Enter = Send)'
              : lang === 'si'
              ? 'Coding ප්‍රශ්නය හෝ Error එක මෙතන ලියන්න...'
              : 'Ask a coding question or paste an error...'
          }
          className="flex-1 min-w-0 resize-none px-2.5 py-1.5 rounded-lg bg-[#0A0D13] border border-white/15 focus:border-blue-500 text-[11px] text-slate-100 placeholder-slate-500 outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="h-9 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer shrink-0 transition-all"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </form>
    </div>
  );
};
