import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Code2,
  Layers,
  Check,
  Monitor,
  Tablet,
  Smartphone,
  Play,
  Zap,
  Server,
  FileCode,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { BentoGridShowcase } from './BentoGridShowcase';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenProjects: () => void;
  onOpenTemplate: (templateName: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onOpenProjects,
  onOpenTemplate,
}) => {
  const { themeConfig } = useTheme();
  const [heroViewport, setHeroViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [heroCounter, setHeroCounter] = useState(14);
  const [activeCodeTab, setActiveCodeTab] = useState<'tsx' | 'html' | 'flask'>('tsx');

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const templates = [
    {
      name: 'Agency Studio Showcase',
      category: 'Agency',
      description: 'High-conversion startup showcase with hero narrative, reactive metrics, and CTA triggers.',
      accent: 'from-indigo-600/30 to-purple-600/10',
      tag: 'Full Stack',
      blocksCount: 7,
    },
    {
      name: 'Developer Portfolio',
      category: 'Portfolio',
      description: 'Dark-mode minimal portfolio with interactive project cards, skills grid, and contact event wire.',
      accent: 'from-blue-600/30 to-cyan-600/10',
      tag: 'Interactive',
      blocksCount: 5,
    },
    {
      name: 'SaaS Product Waitlist',
      category: 'SaaS',
      description: 'Early bird launch page with live email input validation, countdown logic, and social proof.',
      accent: 'from-purple-600/30 to-pink-600/10',
      tag: 'Lead Gen',
      blocksCount: 6,
    },
    {
      name: 'Modern E-Commerce Store',
      category: 'Commerce',
      description: 'Electronics catalog with interactive pricing cards, spec badges, and cart simulation.',
      accent: 'from-emerald-600/30 to-teal-600/10',
      tag: 'Reactive Store',
      blocksCount: 8,
    },
  ];

  return (
    <div className="flex-grow flex flex-col relative z-10 w-full overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Subtle ambient glow behind headline */}
        <div
          className="ambient-glow w-96 h-96 -top-20 left-1/2 -translate-x-1/2"
          style={{ backgroundColor: themeConfig.accentHex }}
        />

        {/* Clean Unboxed Metadata Header (Anti-Slop §1.A) */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-6">
          <span>Visual Drag & Drop</span>
          <span aria-hidden="true">·</span>
          <span>Reactive State Wiring</span>
          <span aria-hidden="true">·</span>
          <span>4-Way Code Export</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mb-6">
          Visual web studio for engineers who{' '}
          <span className={`text-transparent bg-clip-text bg-gradient-to-r ${themeConfig.gradientText}`}>
            ship fast.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed mb-9">
          Design responsive layout blocks visually, connect reactive logic wires without configuration, and export pristine HTML, React 19 TSX, and Python Flask REST backends.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-14">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-7 py-3 rounded-xl text-white font-semibold text-xs shadow-xl transition-all flex items-center justify-center gap-2 hover:opacity-95 active:scale-95"
            style={{
              backgroundColor: themeConfig.accentHex,
              boxShadow: `0 12px 28px -6px ${themeConfig.accentHex}40`,
            }}
          >
            <span>Launch Visual Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollToSection('features-section')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>Inspect Studio Engine</span>
          </button>
        </div>

        {/* LIVE INTERACTIVE STUDIO PREVIEW WINDOW (Hero Visual Showcase) */}
        <div className="w-full max-w-5xl studio-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden text-left">
          {/* Bezel Window Header */}
          <div className="bg-[#0b0e18] px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-xs font-mono text-slate-400 ml-2">studio.slbuilder.io — Live Workspace</span>
            </div>

            {/* Viewport switcher mock */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
              <button
                onClick={() => setHeroViewport('desktop')}
                className={`p-1 rounded text-xs transition-colors ${
                  heroViewport === 'desktop' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop (100%)"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setHeroViewport('tablet')}
                className={`p-1 rounded text-xs transition-colors ${
                  heroViewport === 'tablet' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Tablet (768px)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setHeroViewport('mobile')}
                className={`p-1 rounded text-xs transition-colors ${
                  heroViewport === 'mobile' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile (375px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Studio Canvas Preview Mock */}
          <div className="p-6 md:p-8 bg-[#07090e] bg-dot-grid flex flex-col items-center">
            <div
              className={`w-full transition-all duration-300 space-y-4 ${
                heroViewport === 'mobile'
                  ? 'max-w-[360px]'
                  : heroViewport === 'tablet'
                  ? 'max-w-[640px]'
                  : 'max-w-3xl'
              }`}
            >
              {/* Canvas Block 1: Navbar */}
              <div className="studio-card p-3.5 rounded-xl flex items-center justify-between border border-white/10">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] text-white"
                    style={{ backgroundColor: themeConfig.accentHex }}
                  >
                    SL
                  </div>
                  <span className="text-xs font-bold text-white">NextGen Platform</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Features · Logic · REST API
                </div>
                <button
                  onClick={() => setHeroCounter((c) => c + 1)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Interactive Wire
                </button>
              </div>

              {/* Canvas Block 2: Hero headline */}
              <div className="studio-card p-6 rounded-xl border border-white/10 text-center space-y-2">
                <span className="text-[11px] font-mono text-indigo-400 font-semibold uppercase tracking-wider">
                  Reactive Wire Connected
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Drag. Connect. Compile.
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Every element on this canvas is wired to reactive state and ready for export.
                </p>
                <div className="pt-2 flex justify-center items-center gap-3">
                  <button
                    onClick={() => setHeroCounter((c) => c + 1)}
                    className="px-4 py-2 rounded-xl text-white font-semibold text-xs flex items-center gap-2 active:scale-95 transition-all shadow-md"
                    style={{ backgroundColor: themeConfig.accentHex }}
                  >
                    <Zap className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Increment State ({heroCounter})</span>
                  </button>
                </div>
              </div>

              {/* Canvas Block 3: Metrics grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="studio-card p-4 rounded-xl border border-white/10">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">STATE VALUE</span>
                  <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    {heroCounter}
                  </span>
                  <span className="text-[11px] text-emerald-400 block mt-1">Reactive binding</span>
                </div>
                <div className="studio-card p-4 rounded-xl border border-white/10">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">LATENCY</span>
                  <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    0.0 ms
                  </span>
                  <span className="text-[11px] text-indigo-400 block mt-1">Local zero overhead</span>
                </div>
                <div className="studio-card p-4 rounded-xl border border-white/10">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">TARGETS</span>
                  <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    3
                  </span>
                  <span className="text-[11px] text-amber-400 block mt-1">HTML, TSX, Flask</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2026 BENTO GRID ARCHITECTURE SHOWCASE */}
      <section id="features-section" className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="mb-12">
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-2">
            <span>ENGINE CAPABILITIES</span>
            <span aria-hidden="true">·</span>
            <span>2026 BENTO ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built for modern visual engineering
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl">
            Test reactive logic, preview multi-device viewports, and synthesize clean multi-target code in real time.
          </p>
        </div>

        <BentoGridShowcase onLaunchStudio={onGetStarted} />
      </section>

      {/* TEMPLATES & BLUEPRINTS SHOWCASE */}
      <section id="templates-section" className="py-20 px-6 max-w-6xl mx-auto w-full border-t border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-2">
              <span>BLUEPRINT TEMPLATES</span>
              <span aria-hidden="true">·</span>
              <span>ZERO CONFIGURATION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Production blueprints ready to customize
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-xl">
              Clone pre-wired blueprints with headers, interactive logic counters, and backend API wires.
            </p>
          </div>
          <button
            onClick={onOpenProjects}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold self-start md:self-auto flex items-center gap-2 transition-colors"
          >
            <span>All Projects</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {templates.map((tpl, i) => (
            <div
              key={i}
              className="studio-card rounded-2xl p-5 flex flex-col justify-between group border border-white/10 hover:border-indigo-500/40 transition-all duration-200"
            >
              <div>
                <div
                  className={`h-24 rounded-xl bg-gradient-to-br ${tpl.accent} border border-white/10 p-3 mb-4 flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                    <span>{tpl.category}</span>
                    <span>{tpl.blocksCount} blocks</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{tpl.tag}</div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors mb-1.5">
                  {tpl.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-5">{tpl.description}</p>
              </div>

              <button
                onClick={() => onOpenTemplate(tpl.name)}
                className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 text-xs font-semibold transition-colors border border-white/10 flex items-center justify-center gap-1.5"
              >
                <span>Clone & Open Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ARCHITECTURAL PROOF SECTION */}
      <section className="py-16 px-6 max-w-6xl mx-auto w-full border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-2">
              <span>CORE ARCHITECTURE</span>
            </div>
            <h3 className="text-2xl font-bold text-white">Engineered for control</h3>
          </div>
          <div className="md:col-span-2 space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              SL Builder separates visual representation from computational logic. Layouts render instantly in a sandbox canvas with active simulated state, and export directly as clean, unbundled code without runtime dependencies.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero framework lock-in (Export to HTML, React, Python)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Responsive Viewports: Desktop, Tablet & Mobile</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Local-first auto-save & zero cloud downtime</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Reactive drag-and-drop wiring engine</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">SL Builder</span>
            <span>·</span>
            <span>Visual Logic & Web Studio</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => scrollToSection('features-section')} className="hover:text-slate-300">
              Features
            </button>
            <button onClick={() => scrollToSection('templates-section')} className="hover:text-slate-300">
              Blueprints
            </button>
            <button onClick={onOpenProjects} className="hover:text-slate-300">
              Projects Hub
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
