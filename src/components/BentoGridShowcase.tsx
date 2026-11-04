import React, { useState } from 'react';
import {
  Zap,
  Code2,
  Monitor,
  Tablet,
  Smartphone,
  Copy,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
  CloudCheck,
  MousePointerClick,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface BentoGridShowcaseProps {
  onLaunchStudio: () => void;
}

export const BentoGridShowcase: React.FC<BentoGridShowcaseProps> = ({ onLaunchStudio }) => {
  const { themeConfig } = useTheme();

  // Widget 1: Interactive Reactive Wire Reactor
  const [reactorCount, setReactorCount] = useState(42);
  const [reactorLang, setReactorLang] = useState<'js' | 'python'>('js');
  const [reactorTriggered, setReactorTriggered] = useState(false);

  // Widget 2: Polyglot Exporter tab
  const [exporterLang, setExporterLang] = useState<'html' | 'react' | 'python' | 'js'>('html');
  const [copiedCode, setCopiedCode] = useState(false);

  // Widget 3: Viewport Matrix
  const [activeViewport, setActiveViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Widget 4: AI Copilot demo
  const [aiHeadline, setAiHeadline] = useState('Build high performance apps visually');
  const [aiLoading, setAiLoading] = useState(false);

  const handleReactorClick = () => {
    setReactorCount((prev) => prev + 1);
    setReactorTriggered(true);
    setTimeout(() => setReactorTriggered(false), 400);
  };

  const handleAiTransform = (promptText: string) => {
    setAiLoading(true);
    setTimeout(() => {
      if (promptText.includes('punchy')) {
        setAiHeadline('Ship 10x Faster with SL Studio');
      } else if (promptText.includes('enterprise')) {
        setAiHeadline('Enterprise Distributed Cloud Architecture');
      } else {
        setAiHeadline('Next-Gen Responsive Web Builder 2026');
      }
      setAiLoading(false);
    }, 450);
  };

  const codeSnippets = {
    html: `<!-- SL Builder Export -->
<div class="p-6 bg-slate-950 rounded-2xl border border-slate-800">
  <h1 class="text-2xl font-bold text-white">Quantum App</h1>
  <button id="btn" class="px-5 py-2 rounded-xl bg-indigo-600 text-white">Trigger</button>
</div>`,
    react: `export function App() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Clicks: {count}</button>;
}`,
    python: `@app.route("/api/v1/metrics")
def get_metrics():
    return jsonify({"status": "healthy", "uptime": "99.98%"})`,
    js: `document.querySelector("#btn").addEventListener("click", () => {
  state.counter++;
  console.log("Triggered reactive wire:", state.counter);
});`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[exporterLang]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full">
      {/* ASYMMETRIC BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
        {/* BENTO 1: Reactive Logic Reactor (Span 8) */}
        <div className="lg:col-span-8 studio-card rounded-2xl p-6 sm:p-7 border border-white/10 flex flex-col justify-between group">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-5">
            <div>
              <div className="text-xs font-mono text-indigo-400 font-semibold mb-1">
                1. Reactive Logic Reactor
              </div>
              <h3 className="text-lg font-bold text-white">Wire Buttons Directly to State Mutations</h3>
            </div>
            <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <span>Engine Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center my-1">
            {/* Left: Interactive Canvas Trigger */}
            <div className="bg-[#080b13] p-4 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>CANVAS BLOCK</span>
                <span className="text-emerald-400">#wire-trigger-btn</span>
              </div>

              <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 space-y-1">
                <div className="text-xs text-slate-400 font-mono">Reactive Counter Value:</div>
                <div
                  className={`text-2xl font-extrabold font-mono transition-transform duration-200 tabular-nums ${
                    reactorTriggered ? 'scale-105 text-white' : 'text-slate-100'
                  }`}
                  style={{ color: reactorTriggered ? themeConfig.accentHex : undefined }}
                >
                  {reactorCount}
                </div>
              </div>

              <button
                onClick={handleReactorClick}
                className="w-full py-2.5 px-4 rounded-xl text-white font-semibold text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                style={{
                  backgroundColor: themeConfig.accentHex,
                  boxShadow: `0 8px 20px -4px ${themeConfig.accentHex}40`,
                }}
              >
                <MousePointerClick className="w-3.5 h-3.5" />
                <span>Click to Trigger Event (+1)</span>
              </button>
            </div>

            {/* Right: Live Generated Stream */}
            <div className="bg-[#05070d] p-3.5 rounded-xl border border-white/10 font-mono text-xs flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2 text-xs">
                  <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5">
                    <button
                      onClick={() => setReactorLang('js')}
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        reactorLang === 'js' ? 'bg-white/15 text-white font-bold' : 'text-slate-400'
                      }`}
                    >
                      JavaScript
                    </button>
                    <button
                      onClick={() => setReactorLang('python')}
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        reactorLang === 'python' ? 'bg-white/15 text-white font-bold' : 'text-slate-400'
                      }`}
                    >
                      Flask API
                    </button>
                  </div>
                  <span className="text-slate-500 text-[10px]">live wired</span>
                </div>

                {reactorLang === 'js' ? (
                  <pre className="text-emerald-400 leading-relaxed text-[11px] overflow-x-auto py-1">
{`const trigger = document.querySelector("#wire-trigger-btn");
trigger.addEventListener("click", () => {
  state.counter = ${reactorCount};
  console.log("Mutated state:", state.counter);
});`}
                  </pre>
                ) : (
                  <pre className="text-indigo-300 leading-relaxed text-[11px] overflow-x-auto py-1">
{`@app.route("/api/counter", methods=["POST"])
def increment():
    current_val = ${reactorCount}
    return jsonify({"counter": current_val})`}
                  </pre>
                )}
              </div>
              <div className="text-[10px] text-slate-500 pt-2 border-t border-white/10">
                Reactive binding updates with zero compile lag
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Visual Event Bus</span>
            <span
              onClick={onLaunchStudio}
              className="font-mono text-xs text-white flex items-center gap-1 cursor-pointer hover:underline"
            >
              Open Studio Workspace &rarr;
            </span>
          </div>
        </div>

        {/* BENTO 2: Polyglot Code Exporter (Span 4) */}
        <div className="lg:col-span-4 studio-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-indigo-400 font-semibold">
                2. Code Exporter
              </span>
              <button
                onClick={handleCopyCode}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <h3 className="text-base font-bold text-white mb-1.5">Zero Framework Lock-In</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Export standard clean source code ready to paste into your Next.js, Vite, or Python project.
            </p>

            {/* Language Switcher Tabs */}
            <div className="grid grid-cols-4 gap-1 p-0.5 bg-[#080b13] rounded-lg border border-white/10 mb-2.5 text-xs font-mono">
              {(['html', 'react', 'python', 'js'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setExporterLang(lang)}
                  className={`py-1 rounded uppercase text-[10px] transition-colors ${
                    exporterLang === lang
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="bg-[#05070d] p-3 rounded-lg border border-white/10 font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-32">
              <pre className="whitespace-pre-wrap leading-relaxed">{codeSnippets[exporterLang]}</pre>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-white/10 text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Stand-alone ready</span>
            <span className="text-emerald-400">W3C Valid</span>
          </div>
        </div>

        {/* BENTO 3: Responsive Viewport Matrix (Span 4) */}
        <div className="lg:col-span-4 studio-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-indigo-400 font-semibold">
                3. Viewport Matrix
              </span>
              <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5 text-xs">
                <button
                  onClick={() => setActiveViewport('desktop')}
                  className={`p-1 rounded ${activeViewport === 'desktop' ? 'bg-white/15 text-white' : 'text-slate-400'}`}
                  title="Desktop (1440px)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveViewport('tablet')}
                  className={`p-1 rounded ${activeViewport === 'tablet' ? 'bg-white/15 text-white' : 'text-slate-400'}`}
                  title="Tablet (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveViewport('mobile')}
                  className={`p-1 rounded ${activeViewport === 'mobile' ? 'bg-white/15 text-white' : 'text-slate-400'}`}
                  title="Mobile (375px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <h3 className="text-base font-bold text-white mb-1">Pixel-Perfect Scale</h3>
            <p className="text-xs text-slate-400 mb-3">
              Real-time canvas scaling matches desktop, tablet, and mobile breakpoints seamlessly.
            </p>

            {/* Interactive Device Preview Frame */}
            <div className="bg-[#080b13] p-3.5 rounded-xl border border-white/10 text-center flex flex-col items-center justify-center">
              <div
                className={`transition-all duration-300 border border-white/15 rounded-lg bg-black/40 p-2.5 ${
                  activeViewport === 'mobile'
                    ? 'w-32 h-24'
                    : activeViewport === 'tablet'
                    ? 'w-48 h-24'
                    : 'w-full h-24'
                } flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-1 text-[9px] font-mono text-slate-400">
                  <span>SL Studio</span>
                  <span className="text-emerald-400">
                    {activeViewport === 'desktop' ? '1440px' : activeViewport === 'tablet' ? '768px' : '375px'}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 w-3/4 bg-white/20 rounded-full mx-auto" />
                  <div className="h-1 w-1/2 bg-white/10 rounded-full mx-auto" />
                </div>
                <div className="flex justify-center gap-1">
                  <div className="h-2.5 w-6 rounded bg-indigo-600/60" />
                  <div className="h-2.5 w-6 rounded bg-white/10" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-white/10 text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Breakpoints</span>
            <span className="text-indigo-400">Zero Refresh</span>
          </div>
        </div>

        {/* BENTO 4: Component Vault (Span 4) */}
        <div className="lg:col-span-4 studio-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-indigo-400 font-semibold mb-3">
              4. Component Vault
            </div>
            <h3 className="text-base font-bold text-white mb-1">Snappable Atomic Blocks</h3>
            <p className="text-xs text-slate-400 mb-3">
              Curated UI and backend primitives ready to drop onto your canvas.
            </p>

            <div className="space-y-2">
              <div className="p-2 rounded-lg bg-[#080b13] border border-white/10 flex items-center justify-between text-xs">
                <span className="font-medium text-white">Hero Banner Block</span>
                <span className="text-[10px] font-mono text-slate-500">UI / Heading</span>
              </div>
              <div className="p-2 rounded-lg bg-[#080b13] border border-white/10 flex items-center justify-between text-xs">
                <span className="font-medium text-white">Event Wire Trigger</span>
                <span className="text-[10px] font-mono text-slate-500">Logic State</span>
              </div>
              <div className="p-2 rounded-lg bg-[#080b13] border border-white/10 flex items-center justify-between text-xs">
                <span className="font-medium text-white">Flask API Route</span>
                <span className="text-[10px] font-mono text-slate-500">Python REST</span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-white/10 text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Library</span>
            <span className="text-indigo-400">14+ Primitives</span>
          </div>
        </div>

        {/* BENTO 5: AI Studio Copilot (Span 4) */}
        <div className="lg:col-span-4 studio-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-indigo-400 font-semibold">
                5. AI Studio Copilot
              </span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>

            <h3 className="text-base font-bold text-white mb-1">Content & Copy Copilot</h3>
            <p className="text-xs text-slate-400 mb-3">
              Transform block messaging and tone with natural language suggestions.
            </p>

            <div className="p-3 bg-[#080b13] rounded-xl border border-white/10 mb-2.5 space-y-1">
              <div className="text-[10px] font-mono text-slate-500">ACTIVE OUTPUT:</div>
              <p className={`text-xs font-semibold text-white transition-opacity ${aiLoading ? 'opacity-40' : 'opacity-100'}`}>
                "{aiHeadline}"
              </p>
            </div>

            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => handleAiTransform('punchy')}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 border border-white/10 transition-colors"
              >
                Make Punchy
              </button>
              <button
                onClick={() => handleAiTransform('enterprise')}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 border border-white/10 transition-colors"
              >
                Enterprise Tone
              </button>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-white/10 text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Natural Language</span>
            <span className="text-indigo-400">Instant Output</span>
          </div>
        </div>

        {/* BENTO 6: Local-First Engine (Span 12) */}
        <div className="lg:col-span-12 studio-card rounded-2xl p-6 sm:p-7 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl text-left">
            <div className="text-xs font-mono text-indigo-400 font-semibold flex items-center gap-1.5">
              <CloudCheck className="w-3.5 h-3.5" />
              <span>6. Local-First Engine & Real-Time Sync</span>
            </div>
            <h3 className="text-xl font-bold text-white">Your designs never vanish. Every stroke auto-saved.</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              SL Builder works entirely in your browser with zero latency. Drafts are locally synced, simulation events stream in real-time, and you can export anytime without dependencies.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={onLaunchStudio}
              className="px-5 py-2.5 rounded-xl text-white font-semibold text-xs shadow-xl transition-all flex items-center gap-2 hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: themeConfig.accentHex,
                boxShadow: `0 8px 24px -4px ${themeConfig.accentHex}40`,
              }}
            >
              <span>Launch Studio Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
