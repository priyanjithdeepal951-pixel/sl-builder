import React, { useState } from 'react';
import { ArrowRight, Check, Monitor, Tablet, Smartphone, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SiteSettingsConfig } from '../types/builder';
import { DEFAULT_SITE_SETTINGS } from '../data/siteSettingsDefaults';
import { STUDIO_IMAGES, getBlueprintImageForCategory } from '../assets/studioAssets';
import { StudioImage } from './StudioImage';
import { LiveCanvasGraphic } from './LiveCanvasGraphic';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenProjects: () => void;
  onOpenTemplate: (templateName: string) => void;
  siteSettings?: SiteSettingsConfig;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onOpenProjects,
  onOpenTemplate,
  siteSettings = DEFAULT_SITE_SETTINGS,
}) => {
  const { themeConfig } = useTheme();
  const [heroViewport, setHeroViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [liveCount, setLiveCount] = useState(14);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const templates =
    siteSettings.templates && siteSettings.templates.length > 0
      ? siteSettings.templates
      : DEFAULT_SITE_SETTINGS.templates;

  const kickerParts = (siteSettings.heroKicker || DEFAULT_SITE_SETTINGS.heroKicker)
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="flex-grow flex flex-col relative z-10 w-full overflow-x-hidden">
      {/* 1. SPLIT ARCHITECTURAL HERO */}
      <section className="max-w-6xl mx-auto w-full px-6 pt-12 pb-16 lg:pt-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Column: Editorial Proposition */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-stone-500 dark:text-zinc-400">
              {kickerParts.map((part, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span aria-hidden="true">·</span>}
                  <span>{part}</span>
                </React.Fragment>
              ))}
            </div>

            <h1
              className="font-display font-bold tracking-tight text-stone-900 dark:text-white leading-[1.06]"
              style={{
                fontSize: 'clamp(2.35rem, 4.1vw, 3.65rem)',
                textWrap: 'balance',
              }}
            >
              {siteSettings.heroTitle || DEFAULT_SITE_SETTINGS.heroTitle}{' '}
              <span
                className={`text-transparent bg-clip-text bg-gradient-to-r ${themeConfig.gradientText}`}
              >
                {siteSettings.heroHighlight || DEFAULT_SITE_SETTINGS.heroHighlight}
              </span>
            </h1>

            <p className="text-base text-stone-600 dark:text-zinc-400 leading-relaxed max-w-xl">
              {siteSettings.heroSubtitle || DEFAULT_SITE_SETTINGS.heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onGetStarted}
                className="px-6 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 active:scale-[0.99] inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
                style={{ backgroundColor: themeConfig.accentHex }}
              >
                <span>{siteSettings.heroPrimaryCta || DEFAULT_SITE_SETTINGS.heroPrimaryCta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('features-section')}
                className="px-5 py-3 rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 font-medium text-sm hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                {siteSettings.heroSecondaryCta || DEFAULT_SITE_SETTINGS.heroSecondaryCta}
              </button>
            </div>

            {/* Quiet 3-metric strip */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-stone-200 dark:border-zinc-800">
              <div>
                <div className="font-mono text-xl font-bold tabular-nums text-stone-900 dark:text-white">
                  4
                </div>
                <div className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                  Export targets
                </div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold tabular-nums text-stone-900 dark:text-white">
                  14+
                </div>
                <div className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                  Atomic blocks
                </div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold tabular-nums text-stone-900 dark:text-white">
                  0 ms
                </div>
                <div className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                  Local preview lag
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Studio Photograph + Live Overlay Control */}
          <div className="lg:col-span-6 flex">
            <div className="relative w-full min-h-[360px] lg:min-h-[460px] rounded-2xl overflow-hidden border border-stone-200 dark:border-zinc-800 bg-stone-900">
              <StudioImage
                src={STUDIO_IMAGES.heroWorkspace}
                alt="Minimalist architectural design workstation running BlockCraft Studio wireframes"
                className="w-full h-full object-cover"
                fallbackLabel="BlockCraft Studio Workspace"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

              {/* Compact Live State Interaction Overlay */}
              <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-black/65 backdrop-blur-md border border-white/15 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono text-zinc-300">
                    Interactive State Wire · Live Preview
                  </div>
                  <div className="text-sm font-semibold text-white mt-0.5 tabular-nums">
                    State Counter: {liveCount}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLiveCount((c) => c + 1)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white inline-flex items-center justify-center gap-1.5 transition-transform active:scale-95 whitespace-nowrap cursor-pointer"
                  style={{ backgroundColor: themeConfig.accentHex }}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Trigger Wire (+1)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE GRAPHICS & REACTIVE ENGINE SECTION */}
      <section
        id="features-section"
        className="max-w-6xl mx-auto w-full px-6 py-16 border-t border-stone-200 dark:border-zinc-800 space-y-10"
      >
        <div className="max-w-2xl">
          <div className="text-xs font-mono text-stone-500 dark:text-zinc-400 mb-2">
            01. Live Signal Engine
          </div>
          <h2
            className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-white"
            style={{ textWrap: 'balance' }}
          >
            Visual blocks wired directly to clean code
          </h2>
          <p className="text-sm sm:text-base text-stone-600 dark:text-zinc-400 mt-2.5 leading-relaxed">
            Connect UI actions to state mutations on a visual canvas, inspect responsive scale, and export standalone HTML, React, or Flask code.
          </p>
        </div>

        {/* Live Interactive SVG Signal Wire Graphic */}
        <LiveCanvasGraphic onOpenStudio={onGetStarted} />

        {/* Secondary Responsive Scale & Architecture Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
          <div className="lg:col-span-6 atelier-surface rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <div className="text-xs font-mono text-stone-500 dark:text-zinc-400">
                  Responsive Breakpoint Frame
                </div>
                <div className="text-base font-semibold text-stone-900 dark:text-white mt-0.5">
                  Multi-Device Live Scale
                </div>
              </div>
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-zinc-900 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setHeroViewport('desktop')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    heroViewport === 'desktop'
                      ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-500 dark:text-zinc-400'
                  }`}
                  title="Desktop (1440px)"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setHeroViewport('tablet')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    heroViewport === 'tablet'
                      ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-500 dark:text-zinc-400'
                  }`}
                  title="Tablet (768px)"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setHeroViewport('mobile')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    heroViewport === 'mobile'
                      ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-500 dark:text-zinc-400'
                  }`}
                  title="Mobile (375px)"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-stone-100 dark:bg-zinc-900/80 rounded-xl p-5 flex items-center justify-center min-h-[150px]">
              <div
                className={`transition-all duration-300 atelier-surface rounded-lg p-3.5 flex flex-col justify-between h-28 ${
                  heroViewport === 'mobile'
                    ? 'w-36'
                    : heroViewport === 'tablet'
                    ? 'w-64'
                    : 'w-full'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-zinc-400 border-b border-stone-200 dark:border-zinc-800 pb-1.5">
                  <span>Canvas</span>
                  <span className="tabular-nums">
                    {heroViewport === 'desktop'
                      ? '1440px'
                      : heroViewport === 'tablet'
                      ? '768px'
                      : '375px'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 w-2/3 rounded bg-stone-200 dark:bg-zinc-800" />
                  <div className="h-1.5 w-1/2 rounded bg-stone-200/70 dark:bg-zinc-800/70" />
                </div>
                <div className="flex gap-1.5">
                  <div
                    className="h-3 w-10 rounded"
                    style={{ backgroundColor: themeConfig.accentHex }}
                  />
                  <div className="h-3 w-10 rounded bg-stone-200 dark:bg-zinc-800" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-5">
            <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-white">
              Engineered for clean output
            </h3>
            <p className="text-sm text-stone-600 dark:text-zinc-400 leading-relaxed">
              Visual layout stays decoupled from runtime logic. Preview animated backgrounds, test form validation, and export unbundled code without proprietary dependencies.
            </p>
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 text-sm text-stone-800 dark:text-zinc-200">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Clean HTML5, React 19 TSX, and Python Flask export</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-stone-800 dark:text-zinc-200">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Built-in live canvas animations & responsive frames</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-stone-800 dark:text-zinc-200">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Local-first auto-save with Firebase cloud sync</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VISUAL BLUEPRINTS GALLERY */}
      <section
        id="templates-section"
        className="max-w-6xl mx-auto w-full px-6 py-16 border-t border-stone-200 dark:border-zinc-800"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-mono text-stone-500 dark:text-zinc-400 mb-2">
              02. Starter Blueprints
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-white">
              Ready-to-customize studio templates
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenProjects}
            className="text-sm font-semibold text-stone-900 dark:text-white hover:underline inline-flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap cursor-pointer"
          >
            <span>View all projects</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((tpl, i) => {
            const imgSrc = getBlueprintImageForCategory(tpl.category, tpl.name);
            return (
              <div
                key={tpl.id || i}
                className="atelier-surface atelier-surface-interactive rounded-2xl overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div className="aspect-[4/3] w-full overflow-hidden bg-stone-200 dark:bg-zinc-900 border-b border-stone-200/80 dark:border-zinc-800">
                    <StudioImage
                      src={imgSrc}
                      alt={`${tpl.name} studio blueprint preview`}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      fallbackLabel={tpl.name}
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs font-mono text-stone-500 dark:text-zinc-400 mb-2">
                      <span>{tpl.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{tpl.blocksCount} blocks</span>
                    </div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-white mb-1.5">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button
                    type="button"
                    onClick={() => onOpenTemplate(tpl.name)}
                    className="w-full py-2.5 px-4 rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-900 dark:text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Blueprint</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. QUIET EDITORIAL FOOTER */}
      <footer className="border-t border-stone-200 dark:border-zinc-800 py-8 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 dark:text-zinc-400">
          <span className="font-semibold text-stone-800 dark:text-zinc-200">
            {siteSettings.footerCopyright || DEFAULT_SITE_SETTINGS.footerCopyright}
          </span>
          <div className="flex items-center gap-6">
            {(siteSettings.footerLinksText || DEFAULT_SITE_SETTINGS.footerLinksText)
              .split('·')
              .map((s) => s.trim())
              .filter(Boolean)
              .map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (idx === 0) scrollToSection('features-section');
                    else if (idx === 1) scrollToSection('templates-section');
                    else onOpenProjects();
                  }}
                  className="hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {label}
                </button>
              ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
