import React, { useState, useEffect } from 'react';
import { MousePointerClick, Code2, Cpu, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LiveCanvasGraphicProps {
  onOpenStudio?: () => void;
}

export const LiveCanvasGraphic: React.FC<LiveCanvasGraphicProps> = ({ onOpenStudio }) => {
  const { themeConfig } = useTheme();
  const [pulseCount, setPulseCount] = useState(12);
  const [activeNode, setActiveNode] = useState<'trigger' | 'state' | 'export'>('state');
  const [exportLang, setExportLang] = useState<'tsx' | 'html' | 'py'>('tsx');
  const [isPulsing, setIsPulsing] = useState(false);

  // Periodic subtle live pulse so the wire graphic visibly breathes
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing(true);
      const t = setTimeout(() => setIsPulsing(false), 650);
      return () => clearTimeout(t);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const handleEmitSignal = () => {
    setPulseCount((c) => c + 1);
    setActiveNode('state');
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 600);
  };

  const codePreview = {
    tsx: `const [count, setCount] = useState(${pulseCount});\n<Button onClick={() => setCount(c => c + 1)} />`,
    html: `<button data-wire="count:${pulseCount}">\n  State: ${pulseCount}\n</button>`,
    py: `@app.post("/api/state")\ndef update():\n    return {"count": ${pulseCount}}`,
  };

  return (
    <div className="atelier-surface rounded-2xl overflow-hidden shadow-sm">
      {/* Graphic Header */}
      <div className="px-5 py-3.5 border-b border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-stone-500 dark:text-zinc-400">
            Live Signal Graph
          </span>
          <span className="text-stone-300 dark:text-zinc-700" aria-hidden="true">
            ·
          </span>
          <span className="text-xs font-mono tabular-nums text-stone-700 dark:text-zinc-200">
            {pulseCount} events
          </span>
        </div>

        <div className="flex items-center gap-1 bg-stone-100 dark:bg-zinc-900 p-0.5 rounded-lg">
          {(['tsx', 'html', 'py'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setExportLang(lang)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono uppercase transition-colors cursor-pointer whitespace-nowrap ${
                exportLang === lang
                  ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-white font-semibold shadow-xs'
                  : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive SVG Wire + Live Nodes */}
      <div className="relative p-6 sm:p-8 bg-drafting-grid">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center relative z-10">
          {/* Node 1: UI Trigger */}
          <div
            onClick={handleEmitSignal}
            className={`atelier-surface rounded-xl p-4 cursor-pointer transition-all ${
              activeNode === 'trigger'
                ? 'ring-2 ring-offset-2 ring-offset-[#f5f5f2] dark:ring-offset-[#0b0c0f]'
                : ''
            }`}
            style={{
              borderColor: isPulsing ? themeConfig.accentHex : undefined,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400">
                01. UI Trigger
              </span>
              <MousePointerClick
                className="w-4 h-4"
                style={{ color: themeConfig.accentHex }}
              />
            </div>
            <p className="text-sm font-semibold text-stone-900 dark:text-white mb-3">
              Interactive Button
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEmitSignal();
              }}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white transition-transform active:scale-95 cursor-pointer"
              style={{ backgroundColor: themeConfig.accentHex }}
            >
              Emit Signal (+1)
            </button>
          </div>

          {/* Node 2: Reactive State Bus */}
          <div
            onClick={() => setActiveNode('state')}
            className="atelier-surface rounded-xl p-4 cursor-pointer relative"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400">
                02. State Bus
              </span>
              <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-stone-900 dark:text-white mb-2">
              Reactive Counter
            </p>
            <div className="flex items-baseline justify-between pt-2 border-t border-stone-200/80 dark:border-zinc-800">
              <span className="text-xs text-stone-500 dark:text-zinc-400">Current value</span>
              <span
                className={`text-2xl font-bold font-mono tabular-nums transition-transform duration-200 ${
                  isPulsing ? 'scale-110' : 'scale-100'
                }`}
                style={{ color: themeConfig.accentHex }}
              >
                {pulseCount}
              </span>
            </div>
          </div>

          {/* Node 3: Live Output Code */}
          <div
            onClick={() => setActiveNode('export')}
            className="atelier-surface rounded-xl p-4 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400">
                03. Code Target
              </span>
              <Code2 className="w-4 h-4 text-stone-600 dark:text-zinc-300" />
            </div>
            <pre className="text-[11px] font-mono text-stone-800 dark:text-zinc-200 leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {codePreview[exportLang]}
            </pre>
          </div>
        </div>

        {/* Animated SVG Signal Wires behind nodes on desktop */}
        <svg
          className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-0"
          viewBox="0 0 900 200"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 270 100 C 315 100, 315 100, 355 100"
            fill="none"
            stroke={themeConfig.accentHex}
            strokeWidth="2"
            strokeOpacity="0.25"
          />
          <path
            d="M 270 100 C 315 100, 315 100, 355 100"
            fill="none"
            stroke={themeConfig.accentHex}
            strokeWidth="2.5"
            className="signal-wire-flow"
          />
          <path
            d="M 545 100 C 590 100, 590 100, 630 100"
            fill="none"
            stroke={themeConfig.secondaryHex}
            strokeWidth="2"
            strokeOpacity="0.25"
          />
          <path
            d="M 545 100 C 590 100, 590 100, 630 100"
            fill="none"
            stroke={themeConfig.secondaryHex}
            strokeWidth="2.5"
            className="signal-wire-flow"
          />
        </svg>
      </div>

      {/* Footer Strip */}
      {onOpenStudio && (
        <div className="px-5 py-3 border-t border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs text-stone-600 dark:text-zinc-400">
          <span>Click Emit Signal to trace live state updates across generated code.</span>
          <button
            type="button"
            onClick={onOpenStudio}
            className="font-semibold text-stone-900 dark:text-white hover:underline inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Try in Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
