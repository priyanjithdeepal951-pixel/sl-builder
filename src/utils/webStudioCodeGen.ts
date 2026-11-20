import { CanvasBlock, PageStyleSettings, SitePage } from '../types/builder';
import {
  getAnimationCount,
  getAnimationSpeedMultiplier,
  isLightPageBackground,
  resolvePageBackgroundCss,
} from './pageStylePresets';
import { getEffectiveNavLinks } from './navLinkHelpers';
import { parseOptionsList } from './studioRuntime';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getCssColor(textColor?: string, customHex?: string, fallback = '#ffffff'): string {
  if (customHex) return customHex;
  switch (textColor) {
    case 'text-slate-300':
      return '#cbd5e1';
    case 'text-indigo-400':
      return '#818cf8';
    case 'text-sky-400':
      return '#38bdf8';
    case 'text-emerald-400':
      return '#34d399';
    case 'text-amber-300':
      return '#fcd34d';
    case 'text-rose-400':
      return '#fb7185';
    case 'text-white':
      return '#ffffff';
    default:
      return fallback;
  }
}

function getCssFontFamily(fontFamily?: string): string {
  switch (fontFamily) {
    case 'serif':
      return "Georgia, Cambria, 'Times New Roman', serif";
    case 'mono':
      return "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";
    case 'display':
      return "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif";
    case 'rounded':
      return "'Nunito', 'Quicksand', system-ui, sans-serif";
    default:
      return 'Inter, system-ui, -apple-system, sans-serif';
  }
}

function getCssFontWeight(fontWeight?: string, fallback = '600'): string {
  switch (fontWeight) {
    case 'normal':
      return '400';
    case 'medium':
      return '500';
    case 'semibold':
      return '600';
    case 'bold':
      return '700';
    case 'extrabold':
      return '800';
    default:
      return fallback;
  }
}

function getHtmlTextSizeClass(fontSize?: string, fallback = 'text-base'): string {
  switch (fontSize) {
    case 'xs':
      return 'text-xs';
    case 'sm':
      return 'text-sm';
    case 'base':
      return 'text-base';
    case 'lg':
      return 'text-lg';
    case 'xl':
      return 'text-xl';
    case '2xl':
      return 'text-2xl sm:text-3xl';
    case '3xl':
      return 'text-3xl sm:text-5xl';
    case '4xl':
      return 'text-4xl sm:text-6xl';
    default:
      return fallback;
  }
}

function getCssBgColor(bgColor?: string, customBgHex?: string): string | undefined {
  if (customBgHex) return customBgHex;
  switch (bgColor) {
    case 'bg-transparent':
      return 'transparent';
    case 'bg-white/5':
      return 'rgba(255, 255, 255, 0.04)';
    case 'bg-[#161B26]':
      return '#161b26';
    case 'bg-indigo-600':
      return '#4f46e5';
    case 'bg-indigo-950/40':
      return 'rgba(30, 27, 75, 0.4)';
    case 'bg-emerald-950/30':
      return 'rgba(6, 78, 59, 0.3)';
    case 'bg-rose-950/30':
      return 'rgba(76, 5, 25, 0.3)';
    case 'bg-amber-950/25':
      return 'rgba(69, 26, 3, 0.25)';
    default:
      return undefined;
  }
}

function getInlineLayoutCss(b: CanvasBlock): string {
  const parts: string[] = [];
  if (b.style?.width && b.style.width !== 'auto') {
    parts.push(`width:${b.style.width};margin-left:auto;margin-right:auto;`);
  }
  if (b.style?.height && b.style.height !== 'auto') {
    parts.push(`min-height:${b.style.height};`);
  }
  if (b.style?.margin) {
    parts.push(`margin:${b.style.margin};`);
  }
  if (b.style?.isHidden) {
    parts.push('display:none;');
  }
  return parts.join('');
}

function buildLiveAnimationCssAndHtml(pageStyle?: PageStyleSettings): {
  css: string;
  html: string;
} {
  const animType = pageStyle?.liveAnimation || 'none';
  if (animType === 'none') {
    return { css: '', html: '' };
  }

  const color = pageStyle?.animationColor || '#818cf8';
  const count = getAnimationCount(pageStyle?.animationDensity);
  const speedMul = getAnimationSpeedMultiplier(pageStyle?.animationSpeed);
  const items = Array.from({ length: count }, (_, idx) => idx);

  const baseLayerCss = `
    .sl-live-bg {
      position: fixed;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    }
    @media (prefers-reduced-motion: reduce) {
      .sl-anim-item { animation: none !important; }
    }`;

  if (animType === 'meteors') {
    const css = `${baseLayerCss}
    @keyframes slMeteorFall {
      0% { transform: rotate(-35deg) translate3d(0, 0, 0); opacity: 0; }
      8% { opacity: 1; }
      75% { opacity: 0.95; }
      100% { transform: rotate(-35deg) translate3d(-900px, 0, 0); opacity: 0; }
    }
    .sl-meteor {
      position: absolute;
      height: 2px;
      border-radius: 9999px;
      background: linear-gradient(90deg, ${color}, rgba(255,255,255,0));
      box-shadow: 0 0 10px ${color};
      opacity: 0;
    }
    .sl-meteor::before {
      content: '';
      position: absolute;
      left: 0;
      top: -1.5px;
      width: 5px;
      height: 5px;
      border-radius: 9999px;
      background: #ffffff;
      box-shadow: 0 0 12px 2px ${color};
    }`;
    const spans = items
      .map((idx) => {
        const topPct = ((idx * 17 + 4) % 72) - 8;
        const leftPct = ((idx * 23 + 18) % 95) + 12;
        const widthPx = 100 + ((idx * 29) % 120);
        const durationSec = ((2.4 + (idx % 5) * 0.65) * speedMul).toFixed(2);
        const delaySec = ((idx * 0.55) % 4.5).toFixed(2);
        return `    <span class="sl-anim-item sl-meteor" style="top:${topPct}%;left:${leftPct}%;width:${widthPx}px;animation:slMeteorFall ${durationSec}s linear ${delaySec}s infinite;"></span>`;
      })
      .join('\n');
    return {
      css,
      html: `  <div class="sl-live-bg" aria-hidden="true">\n${spans}\n  </div>\n`,
    };
  }

  if (animType === 'starfield') {
    const css = `${baseLayerCss}
    @keyframes slStarTwinkle {
      0%, 100% { opacity: 0.2; transform: scale(0.85); }
      50% { opacity: 1; transform: scale(1.25); }
    }
    .sl-star {
      position: absolute;
      border-radius: 9999px;
      background: ${color};
    }`;
    const spans = items
      .concat(items)
      .map((_, renderIdx) => {
        const topPct = (renderIdx * 13 + 7) % 96;
        const leftPct = (renderIdx * 19 + 11) % 97;
        const sizePx = renderIdx % 4 === 0 ? 3 : renderIdx % 2 === 0 ? 2 : 1.5;
        const durationSec = ((1.8 + (renderIdx % 5) * 0.6) * speedMul).toFixed(2);
        const delaySec = ((renderIdx * 0.37) % 3.5).toFixed(2);
        return `    <span class="sl-anim-item sl-star" style="top:${topPct}%;left:${leftPct}%;width:${sizePx}px;height:${sizePx}px;box-shadow:0 0 ${sizePx * 3}px ${color};animation:slStarTwinkle ${durationSec}s ease-in-out ${delaySec}s infinite;"></span>`;
      })
      .join('\n');
    return {
      css,
      html: `  <div class="sl-live-bg" aria-hidden="true">\n${spans}\n  </div>\n`,
    };
  }

  if (animType === 'aurora') {
    const css = `${baseLayerCss}
    @keyframes slAuroraDrift {
      0% { transform: translate3d(-8%, -6%, 0) scale(1); opacity: 0.35; }
      50% { transform: translate3d(8%, 6%, 0) scale(1.12); opacity: 0.65; }
      100% { transform: translate3d(-8%, -6%, 0) scale(1); opacity: 0.35; }
    }
    .sl-aurora-orb {
      position: absolute;
      border-radius: 9999px;
      filter: blur(72px);
    }`;
    const html = `  <div class="sl-live-bg" aria-hidden="true">
    <div class="sl-anim-item sl-aurora-orb" style="top:-12%;left:-10%;width:65%;height:55%;background:radial-gradient(circle, ${color}55 0%, transparent 70%);animation:slAuroraDrift ${(9 * speedMul).toFixed(1)}s ease-in-out infinite;"></div>
    <div class="sl-anim-item sl-aurora-orb" style="top:35%;right:-10%;width:60%;height:55%;background:radial-gradient(circle, ${color}40 0%, transparent 72%);animation:slAuroraDrift ${(12 * speedMul).toFixed(1)}s ease-in-out 2s infinite reverse;"></div>
  </div>\n`;
    return { css, html };
  }

  if (animType === 'particles') {
    const css = `${baseLayerCss}
    @keyframes slFloatUp {
      0% { transform: translate3d(0, 20px, 0) scale(0.7); opacity: 0; }
      20% { opacity: 0.85; }
      80% { opacity: 0.65; }
      100% { transform: translate3d(18px, -320px, 0) scale(1.1); opacity: 0; }
    }
    .sl-particle {
      position: absolute;
      border-radius: 9999px;
      background: ${color};
      box-shadow: 0 0 12px ${color};
      opacity: 0;
    }`;
    const spans = items
      .map((idx) => {
        const leftPct = (idx * 17 + 6) % 94;
        const bottomPct = (idx * 11) % 35;
        const sizePx = 4 + (idx % 4) * 2;
        const durationSec = ((4.5 + (idx % 5) * 0.9) * speedMul).toFixed(2);
        const delaySec = ((idx * 0.48) % 4).toFixed(2);
        return `    <span class="sl-anim-item sl-particle" style="left:${leftPct}%;bottom:${bottomPct}%;width:${sizePx}px;height:${sizePx}px;animation:slFloatUp ${durationSec}s ease-in-out ${delaySec}s infinite;"></span>`;
      })
      .join('\n');
    return {
      css,
      html: `  <div class="sl-live-bg" aria-hidden="true">\n${spans}\n  </div>\n`,
    };
  }

  if (animType === 'cyber-grid') {
    const css = `${baseLayerCss}
    @keyframes slGridPulse {
      0%, 100% { opacity: 0.18; }
      50% { opacity: 0.38; }
    }
    .sl-cyber-grid {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(to right, ${color}33 1px, transparent 1px), linear-gradient(to bottom, ${color}33 1px, transparent 1px);
      background-size: 36px 36px;
      animation: slGridPulse ${(3.2 * speedMul).toFixed(2)}s ease-in-out infinite;
    }`;
    return {
      css,
      html: `  <div class="sl-live-bg" aria-hidden="true">\n    <div class="sl-anim-item sl-cyber-grid"></div>\n  </div>\n`,
    };
  }

  const css = `${baseLayerCss}
    @keyframes slSnowFall {
      0% { transform: translate3d(0, -15px, 0); opacity: 0; }
      15% { opacity: 0.85; }
      85% { opacity: 0.75; }
      100% { transform: translate3d(24px, 100vh, 0); opacity: 0; }
    }
    .sl-snowflake {
      position: absolute;
      top: -10px;
      border-radius: 9999px;
      background: ${color};
      box-shadow: 0 0 6px ${color}88;
      opacity: 0;
    }`;
  const spans = items
    .map((idx) => {
      const leftPct = (idx * 15 + 4) % 96;
      const sizePx = 3 + (idx % 3) * 1.5;
      const durationSec = ((4.2 + (idx % 6) * 0.85) * speedMul).toFixed(2);
      const delaySec = ((idx * 0.42) % 4).toFixed(2);
      return `    <span class="sl-anim-item sl-snowflake" style="left:${leftPct}%;width:${sizePx}px;height:${sizePx}px;animation:slSnowFall ${durationSec}s linear ${delaySec}s infinite;"></span>`;
    })
    .join('\n');
  return {
    css,
    html: `  <div class="sl-live-bg" aria-hidden="true">\n${spans}\n  </div>\n`,
  };
}

export function generateHtmlExport(
  projectName: string,
  blocks: CanvasBlock[],
  pages?: SitePage[],
  pageStyle?: PageStyleSettings
): string {
  const isLightPage = isLightPageBackground(pageStyle);
  const pageBg = resolvePageBackgroundCss(pageStyle);
  const defaultBodyColor = pageStyle?.textColor || (isLightPage ? '#0f172a' : '#f1f5f9');
  const defaultPrimaryColor = isLightPage ? '#0f172a' : '#ffffff';
  const defaultMutedColor = isLightPage ? '#475569' : '#94a3b8';
  const resolvedAccent = pageStyle?.accentColor || '#4f46e5';
  const animBundle = buildLiveAnimationCssAndHtml(pageStyle);

  const renderedBlocks = blocks
    .map((b) => {
      const content = escapeHtml(b.content || b.name);
      const subtitle = b.subtitle ? escapeHtml(b.subtitle) : '';
      const align =
        b.style?.textAlign ||
        (b.type === 'ui-heading' || b.type === 'ui-button' ? 'center' : 'left');
      const alignClass =
        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
      const primaryColor = getCssColor(
        b.style?.textColor,
        b.style?.customTextHex,
        defaultPrimaryColor
      );
      const subColor = b.style?.subtitleColorHex || defaultMutedColor;
      const fontFam = getCssFontFamily(b.style?.fontFamily);
      const fontWt = getCssFontWeight(
        b.style?.fontWeight,
        b.type === 'ui-paragraph' ? '400' : '700'
      );
      const bgVal = b.style?.bgGradient || getCssBgColor(b.style?.bgColor, b.style?.customBgHex);
      const surfaceFxCss = `${bgVal ? `background: ${bgVal};` : ''}${
        b.style?.borderColor ? ` border-color: ${b.style.borderColor};` : ''
      }${b.style?.boxShadow ? ` box-shadow: ${b.style.boxShadow};` : ''}`;
      const textFxCss = `${
        b.style?.textGradient
          ? `background-image: ${b.style.textGradient}; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent;`
          : `color: ${primaryColor};`
      }${b.style?.textShadow ? ` text-shadow: ${b.style.textShadow};` : ''}${
        b.style?.textStroke ? ` -webkit-text-stroke: ${b.style.textStroke};` : ''
      }`;
      const radiusClass = b.style?.borderRadius || 'rounded-xl';
      const customCls = b.style?.customClass ? ` ${escapeHtml(b.style.customClass)}` : '';
      const layoutStyle = getInlineLayoutCss(b);
      const elId = `sl-el-${escapeHtml(b.id)}`;
      const parsedOptions = parseOptionsList(b.content, b.options);

      switch (b.type) {
        case 'ui-navbar': {
          const effectiveLinks = getEffectiveNavLinks(b, pages, blocks);
          const linksHtml = effectiveLinks
            .map((link) => {
              const label = escapeHtml(link.label);
              if (link.action === 'navigate-page') {
                const targetPage = pages?.find((p) => p.id === link.targetPageId);
                const href = targetPage ? `${escapeHtml(targetPage.slug)}.html` : '#';
                return `<a href="${href}" class="text-sm opacity-80 hover:opacity-100 transition-opacity no-underline">${label}</a>`;
              }
              if (link.action === 'scroll-to-block' && link.targetBlockId) {
                const targetDomId = `sl-el-${escapeHtml(link.targetBlockId)}`;
                return `<a href="#${targetDomId}" data-scroll-target="${targetDomId}" class="sl-nav-link text-sm opacity-80 hover:opacity-100 transition-opacity no-underline cursor-pointer">${label}</a>`;
              }
              if (link.action === 'open-url') {
                const rawUrl = (link.url || '#').trim();
                const isInternalHash = rawUrl.startsWith('#');
                return isInternalHash
                  ? `<a href="${escapeHtml(rawUrl)}" class="sl-nav-link text-sm opacity-80 hover:opacity-100 transition-opacity no-underline">${label}</a>`
                  : `<a href="${escapeHtml(rawUrl)}" target="_blank" rel="noopener noreferrer" class="text-sm opacity-80 hover:opacity-100 transition-opacity no-underline">${label}</a>`;
              }
              const msg = escapeHtml(link.message || `Clicked "${link.label}"`);
              return `<button type="button" data-nav-msg="${msg}" class="sl-nav-link text-sm opacity-80 hover:opacity-100 transition-opacity bg-transparent border-0 p-0 cursor-pointer text-inherit font-inherit">${label}</button>`;
            })
            .join('\n        ');
          return `  <header id="${elId}" style="${layoutStyle}font-family: ${fontFam}; background: ${
            bgVal || (isLightPage ? 'rgba(255, 255, 255, 0.86)' : 'rgba(13, 17, 26, 0.86)')
          };" class="w-full sticky top-0 z-50 border-b ${
            isLightPage ? 'border-slate-200' : 'border-white/10'
          } backdrop-blur-md${customCls}">
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
      <a href="index.html" class="flex items-center gap-2.5 no-underline">
        <span style="background: ${resolvedAccent};" class="px-2 h-7 rounded-lg text-white text-xs font-bold flex items-center justify-center">${escapeHtml(
            b.badgeText || 'SL'
          )}</span>
        <span style="color: ${primaryColor}; font-weight: ${fontWt};" class="${getHtmlTextSizeClass(
            b.style?.fontSize,
            'text-lg'
          )} tracking-tight">${content}</span>
      </a>
      <nav style="color: ${subColor};" class="flex items-center gap-6">
        ${linksHtml}
      </nav>
    </div>
  </header>`;
        }

        case 'ui-sidebar': {
          const itemsHtml = (parsedOptions.length ? parsedOptions : ['Dashboard', 'Projects', 'Settings'])
            .map(
              (item) =>
                `<a href="#" class="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-slate-200 no-underline">${escapeHtml(
                  item
                )}</a>`
            )
            .join('\n        ');
          return `  <aside id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-white/10 bg-white/5 space-y-2">
      <div style="color:${primaryColor};" class="text-sm font-bold border-b border-white/10 pb-2">${content}</div>
      <nav class="space-y-1">
        ${itemsHtml}
      </nav>
    </div>
  </aside>`;
        }

        case 'ui-tabbar': {
          const tabs = parsedOptions.length ? parsedOptions : ['Overview', 'Specs', 'Reviews'];
          const tabsHtml = tabs
            .map(
              (t, idx) =>
                `<button type="button" data-sl-tab="${escapeHtml(t)}" class="sl-tab-btn px-4 py-2 rounded-lg text-xs font-semibold ${
                  idx === (b.counterValue ?? 0)
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }">${escapeHtml(t)}</button>`
            )
            .join('');
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-4 ${radiusClass} border border-white/10 bg-white/5 space-y-3">
      <div class="flex flex-wrap gap-1 bg-[#090B10] p-1 rounded-xl border border-white/10">${tabsHtml}</div>
      <p class="sl-tab-panel text-sm text-slate-300">${subtitle || 'Active tab panel content.'}</p>
    </div>
  </section>`;
        }

        case 'ui-link': {
          const pg = pages?.find((p) => p.id === b.targetPageId);
          const href =
            b.action === 'navigate-page' && pg
              ? `${escapeHtml(pg.slug)}.html`
              : escapeHtml(b.actionPayload || '#');
          return `  <div id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3 ${alignClass}${customCls}">
    <a href="${href}" style="${textFxCss} font-family:${fontFam};" class="text-sm font-semibold hover:underline">${content}</a>
  </div>`;
        }

        case 'ui-section':
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-6${customCls}">
    <div style="${surfaceFxCss}" class="p-7 ${radiusClass} border border-white/10 bg-white/5 ${alignClass} space-y-2">
      <h2 style="${textFxCss}" class="text-2xl font-bold">${content}</h2>
      ${subtitle ? `<p style="color:${subColor};" class="text-sm">${subtitle}</p>` : ''}
    </div>
  </section>`;

        case 'ui-row': {
          const cols = (parsedOptions.length ? parsedOptions : ['Col A', 'Col B', 'Col C'])
            .map(
              (c) =>
                `<div class="flex-1 min-w-[140px] p-4 rounded-xl bg-[#090B10] border border-white/10 text-sm font-semibold text-white text-center">${escapeHtml(
                  c
                )}</div>`
            )
            .join('');
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div class="flex flex-wrap gap-3">${cols}</div>
  </section>`;
        }

        case 'ui-column': {
          const rows = (parsedOptions.length ? parsedOptions : ['Item 1', 'Item 2', 'Item 3'])
            .map(
              (c) =>
                `<div class="w-full p-4 rounded-xl bg-[#090B10] border border-white/10 text-sm text-slate-200">${escapeHtml(
                  c
                )}</div>`
            )
            .join('');
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div class="flex flex-col gap-3">${rows}</div>
  </section>`;
        }

        case 'ui-grid': {
          const cells = (parsedOptions.length ? parsedOptions : ['Cell 1', 'Cell 2', 'Cell 3', 'Cell 4'])
            .map(
              (c) =>
                `<div class="p-4 rounded-xl bg-[#090B10] border border-white/10 text-sm font-semibold text-white">${escapeHtml(
                  c
                )}</div>`
            )
            .join('');
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div class="grid grid-cols-1 ${b.gridColumns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4">${cells}</div>
  </section>`;
        }

        case 'ui-modal':
          return `  <div id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div id="${escapeHtml(b.id)}-modal" class="hidden fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div class="bg-[#111827] border border-white/15 rounded-2xl max-w-md w-full p-6 space-y-3">
        <h3 class="text-lg font-bold text-white">${content}</h3>
        <p class="text-sm text-slate-300">${subtitle}</p>
        <button type="button" onclick="document.getElementById('${escapeHtml(b.id)}-modal').classList.add('hidden')" class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold">Close</button>
      </div>
    </div>
  </div>`;

        case 'ui-heading':
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="w-full py-16 sm:py-20 px-6${customCls}">
    <div style="${
            bgVal && bgVal !== 'rgba(255, 255, 255, 0.04)' ? `${surfaceFxCss}` : ''
          }" class="max-w-4xl mx-auto space-y-4 ${alignClass} ${
            bgVal && bgVal !== 'rgba(255, 255, 255, 0.04)' ? `p-8 ${radiusClass} border border-white/10` : ''
          }">
      <h1 style="${textFxCss} font-weight: ${getCssFontWeight(
            b.style?.fontWeight,
            '800'
          )};" class="${getHtmlTextSizeClass(
            b.style?.fontSize,
            'text-4xl sm:text-5xl'
          )} tracking-tight leading-tight">${content}</h1>
      ${
        subtitle
          ? `<p style="color: ${subColor};" class="text-base sm:text-lg max-w-2xl ${
              align === 'center' ? 'mx-auto' : ''
            } leading-relaxed">${subtitle}</p>`
          : ''
      }
    </div>
  </section>`;

        case 'ui-paragraph':
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="w-full py-4 px-6${customCls}">
    <div style="${surfaceFxCss}" class="max-w-4xl mx-auto ${alignClass} space-y-2 ${
            bgVal && bgVal !== 'transparent' ? `p-6 ${radiusClass} border border-white/10` : ''
          }">
      <p style="${
        b.style?.textGradient
          ? textFxCss
          : `color: ${getCssColor(
              b.style?.textColor,
              b.style?.customTextHex,
              isLightPage ? '#334155' : '#cbd5e1'
            )};${b.style?.textShadow ? ` text-shadow: ${b.style.textShadow};` : ''}`
      } font-weight: ${fontWt};" class="${getHtmlTextSizeClass(
            b.style?.fontSize,
            'text-base sm:text-lg'
          )} leading-relaxed">${content}</p>
      ${subtitle ? `<p style="color: ${subColor};" class="text-sm">${subtitle}</p>` : ''}
    </div>
  </section>`;

        case 'ui-badge':
          return `  <div id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 pt-8 pb-2 ${alignClass}${customCls}">
    <span style="${
      b.style?.textGradient
        ? textFxCss
        : `color: ${getCssColor(
            b.style?.textColor,
            b.style?.customTextHex,
            '#818cf8'
          )};${b.style?.textShadow ? ` text-shadow: ${b.style.textShadow};` : ''}`
    } font-weight: ${fontWt};" class="inline-block ${getHtmlTextSizeClass(
            b.style?.fontSize,
            'text-xs'
          )} uppercase tracking-widest font-mono">${content}</span>
  </div>`;

        case 'ui-stat':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(255, 255, 255, 0.04)'
          };" class="p-6 ${radiusClass} border border-white/10 ${alignClass}">
      <div style="color: ${subColor};" class="text-xs font-mono uppercase tracking-wider">${escapeHtml(
            b.statLabel ?? b.subtitle ?? b.name
          )}</div>
      <div style="${textFxCss} font-weight: ${getCssFontWeight(
            b.style?.fontWeight,
            '800'
          )};" class="${getHtmlTextSizeClass(
            b.style?.fontSize,
            'text-3xl sm:text-4xl'
          )} font-mono mt-1">${escapeHtml(b.statValue ?? content)}</div>
    </div>
  </section>`;

        case 'ui-card':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(255, 255, 255, 0.04)'
          };" class="p-6 ${radiusClass} border border-white/10 space-y-2 ${alignClass}">
      <h3 style="${textFxCss} font-weight: ${fontWt};" class="${getHtmlTextSizeClass(
            b.style?.fontSize,
            'text-xl'
          )}">${content}</h3>
      ${subtitle ? `<p style="color: ${subColor};" class="text-sm leading-relaxed">${subtitle}</p>` : ''}
    </div>
  </section>`;

        case 'ui-pricing':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="font-family: ${fontFam}; background: ${
            bgVal || 'linear-gradient(135deg, rgba(30,27,75,0.55), rgba(15,23,42,0.9))'
          };" class="p-7 ${radiusClass} border border-indigo-500/30 space-y-3 ${alignClass}">
      <div class="flex items-center justify-between gap-4">
        <h3 style="${textFxCss} font-weight: ${fontWt};" class="${getHtmlTextSizeClass(
            b.style?.fontSize,
            'text-2xl'
          )}">${content}</h3>
        <span class="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-mono font-bold">${escapeHtml(
          b.badgeText || 'PRO'
        )}</span>
      </div>
      ${subtitle ? `<p style="color: ${subColor};" class="text-base">${subtitle}</p>` : ''}
    </div>
  </section>`;

        case 'ui-testimonial':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <blockquote style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(255, 255, 255, 0.04)'
          };" class="p-6 ${radiusClass} border border-white/10 space-y-4 ${alignClass}">
      <p style="${
        b.style?.textGradient
          ? textFxCss
          : `color: ${getCssColor(b.style?.textColor, b.style?.customTextHex, '#e2e8f0')};`
      }" class="${getHtmlTextSizeClass(b.style?.fontSize, 'text-lg')} italic leading-relaxed">&ldquo;${content}&rdquo;</p>
      <footer class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-bold text-xs">${escapeHtml(
          (b.subtitle || 'U').slice(0, 2).toUpperCase()
        )}</div>
        <div>
          <div style="color: ${subColor};" class="text-sm font-bold">${subtitle || 'Verified Customer'}</div>
          ${b.authorRole ? `<div class="text-xs text-slate-400">${escapeHtml(b.authorRole)}</div>` : ''}
        </div>
      </footer>
    </blockquote>
  </section>`;

        case 'ui-accordion':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <details id="${escapeHtml(b.id)}-details" style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(255, 255, 255, 0.04)'
          };" class="${radiusClass} border border-white/10 group">
      <summary style="color: ${primaryColor}; font-weight: ${fontWt};" class="p-5 cursor-pointer list-none flex items-center justify-between ${getHtmlTextSizeClass(
            b.style?.fontSize,
            'text-base'
          )}">
        <span>${content}</span>
        <span class="text-slate-400">+</span>
      </summary>
      ${
        subtitle
          ? `<div style="color: ${subColor};" class="px-5 pb-5 pt-2 text-sm border-t border-white/5 leading-relaxed">${subtitle}</div>`
          : ''
      }
    </details>
  </section>`;

        case 'ui-input':
        case 'ui-textarea':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-3xl mx-auto px-6 py-3${customCls}">
    <div style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(255, 255, 255, 0.04)'
          };" class="p-5 ${radiusClass} border border-white/10 space-y-2 ${alignClass}">
      ${subtitle ? `<label style="color: ${subColor};" class="block text-xs font-semibold">${subtitle}</label>` : ''}
      ${
        b.type === 'ui-textarea'
          ? `<textarea rows="3" data-sl-input-id="${escapeHtml(b.id)}" data-sl-input-label="${escapeHtml(
              b.subtitle || b.name
            )}" placeholder="${content}" class="w-full rounded-lg bg-[#0B0F17] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"></textarea>`
          : `<input type="${escapeHtml(b.inputType || 'text')}" data-sl-input-id="${escapeHtml(
              b.id
            )}" data-sl-input-label="${escapeHtml(
              b.subtitle || b.name
            )}" placeholder="${content}" class="w-full rounded-lg bg-[#0B0F17] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />`
      }
    </div>
  </section>`;

        case 'ui-select': {
          const optsHtml = (parsedOptions.length ? parsedOptions : ['Option 1', 'Option 2'])
            .map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`)
            .join('');
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-3xl mx-auto px-6 py-3${customCls}">
    <div class="p-5 ${radiusClass} border border-white/10 bg-white/5 space-y-2">
      ${subtitle ? `<label class="block text-xs font-semibold text-slate-300">${subtitle}</label>` : ''}
      <select data-sl-input-id="${escapeHtml(b.id)}" data-sl-input-label="${escapeHtml(
            b.subtitle || b.name
          )}" class="w-full rounded-lg bg-[#0B0F17] border border-white/15 px-3.5 py-2.5 text-sm text-white outline-none">
        ${optsHtml}
      </select>
    </div>
  </section>`;
        }

        case 'ui-checkbox':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-3xl mx-auto px-6 py-3${customCls}">
    <label class="p-4 ${radiusClass} border border-white/10 bg-white/5 flex items-center gap-3 cursor-pointer">
      <input type="${b.controlVariant === 'radio' ? 'radio' : 'checkbox'}" data-sl-input-id="${escapeHtml(
            b.id
          )}" ${b.isExpanded ? 'checked' : ''} class="w-4 h-4 accent-indigo-500" />
      <span class="text-sm text-slate-200">${content}</span>
    </label>
  </section>`;

        case 'ui-file-upload':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-3xl mx-auto px-6 py-3${customCls}">
    <label class="block p-6 ${radiusClass} border border-dashed border-white/25 bg-white/5 text-center cursor-pointer space-y-2">
      <div class="text-sm font-semibold text-white">${content}</div>
      ${subtitle ? `<div class="text-xs text-slate-400">${subtitle}</div>` : ''}
      <input type="file" data-sl-input-id="${escapeHtml(b.id)}" class="hidden" />
    </label>
  </section>`;

        case 'ui-image':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-6${customCls}">
    <figure style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(17, 24, 39, 0.7)'
          };" class="overflow-hidden ${radiusClass} border border-white/10 p-6 ${alignClass} space-y-3">
      ${
        b.imageUrl
          ? `<img src="${escapeHtml(b.imageUrl)}" alt="${content}" class="w-full max-h-96 object-cover rounded-xl" />`
          : `<div class="w-full h-48 rounded-xl bg-gradient-to-br from-slate-900 to-[#111827] flex items-center justify-center text-sky-400 text-sm font-mono">Media Showcase</div>`
      }
      <figcaption class="space-y-1">
        <div style="color: ${primaryColor}; font-weight: ${fontWt};" class="${getHtmlTextSizeClass(
            b.style?.fontSize,
            'text-lg'
          )}">${content}</div>
        ${subtitle ? `<p style="color: ${subColor};" class="text-sm">${subtitle}</p>` : ''}
      </figcaption>
    </figure>
  </section>`;

        case 'ui-icon':
          return `  <div id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4 ${alignClass}${customCls}">
    <div class="inline-flex flex-col items-center p-5 ${radiusClass} border border-white/10 bg-white/5 gap-2">
      <span class="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 font-mono text-xs uppercase">${escapeHtml(
        b.iconName || 'sparkles'
      )}</span>
      <span class="text-sm font-bold text-white">${content}</span>
    </div>
  </div>`;

        case 'ui-video':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div class="p-5 ${radiusClass} border border-white/10 bg-white/5 space-y-3">
      ${
        b.videoUrl
          ? `<video controls playsinline src="${escapeHtml(b.videoUrl)}" class="w-full rounded-xl bg-black"></video>`
          : `<div class="h-44 rounded-xl bg-black/60 flex items-center justify-center text-sky-400 text-sm">Video Showcase</div>`
      }
      <div class="text-base font-bold text-white">${content}</div>
    </div>
  </section>`;

        case 'ui-avatar':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <div style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(255, 255, 255, 0.04)'
          };" class="p-5 ${radiusClass} border border-white/10 flex items-center gap-4">
      <div class="w-12 h-12 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 font-bold text-sm shrink-0">${escapeHtml(
        content.slice(0, 2).toUpperCase()
      )}</div>
      <div>
        <div style="color: ${primaryColor}; font-weight: ${fontWt};" class="${getHtmlTextSizeClass(
            b.style?.fontSize,
            'text-base'
          )}">${content}</div>
        ${subtitle ? `<div style="color: ${subColor};" class="text-xs mt-0.5">${subtitle}</div>` : ''}
      </div>
    </div>
  </section>`;

        case 'logic-counter':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div id="${b.id}" style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(30, 27, 75, 0.4)'
          };" class="p-6 ${radiusClass} border border-indigo-500/30 flex items-center justify-between gap-4">
      <div>
        <div style="color: ${subColor};" class="text-xs font-semibold font-mono">${content}</div>
        <div id="${b.id}-val" style="color: ${primaryColor};" class="text-3xl font-extrabold font-mono mt-1">${
            b.counterValue ?? 0
          }</div>
      </div>
      <button onclick="(function(){var el=document.getElementById('${b.id}-val');if(el)el.textContent=String(Number(el.textContent||0)+1);})()" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold cursor-pointer">+1</button>
    </div>
  </section>`;

        case 'logic-toggle':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <label style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(69, 26, 3, 0.25)'
          };" class="p-5 ${radiusClass} border border-amber-500/25 flex items-center justify-between gap-4 cursor-pointer">
      <div>
        <div style="color: ${primaryColor}; font-weight: ${fontWt};" class="text-sm">${content}</div>
        ${subtitle ? `<div style="color: ${subColor};" class="text-xs mt-0.5">${subtitle}</div>` : ''}
      </div>
      <input id="${escapeHtml(b.id)}-toggle" type="checkbox" ${b.isExpanded ? 'checked' : ''} class="w-5 h-5 accent-emerald-500" />
    </label>
  </section>`;

        case 'logic-click':
        case 'logic-onload':
        case 'logic-oninput':
        case 'logic-onsubmit':
        case 'logic-onkey': {
          const targetPage = pages?.find((p) => p.id === b.targetPageId);
          const targetHref = targetPage ? `${escapeHtml(targetPage.slug)}.html` : '';
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <div style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(69, 26, 3, 0.25)'
          };" class="p-5 ${radiusClass} border border-amber-500/25 flex items-center justify-between gap-4">
      <div>
        <div style="color: ${primaryColor}; font-weight: ${fontWt};" class="text-sm">${content}</div>
        ${subtitle ? `<div style="color: ${subColor};" class="text-xs mt-0.5">${subtitle}</div>` : ''}
      </div>
      <button type="button" data-block-id="${escapeHtml(b.id)}" data-target="${escapeHtml(
            b.targetId || ''
          )}" data-target-page="${targetHref}" data-action="${escapeHtml(
            b.action || ''
          )}" data-payload="${escapeHtml(b.actionPayload || '')}" data-endpoint="${escapeHtml(
            b.apiEndpoint || ''
          )}" class="sl-action-btn px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer">${escapeHtml(
            b.badgeText || 'Fire'
          )}</button>
    </div>
  </section>`;
        }

        case 'ui-button': {
          const targetPage = pages?.find((p) => p.id === b.targetPageId);
          const targetHref = targetPage ? `${escapeHtml(targetPage.slug)}.html` : '';
          return `  <div id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4 ${alignClass}${customCls}">
    <button type="button" ${b.isDisabled ? 'disabled' : ''} data-block-id="${escapeHtml(
            b.id
          )}" data-target="${escapeHtml(b.targetId || '')}" data-target-page="${targetHref}" data-action="${escapeHtml(
            b.action || ''
          )}" data-payload="${escapeHtml(b.actionPayload || '')}" data-endpoint="${escapeHtml(
            b.apiEndpoint || ''
          )}" data-method="${escapeHtml(b.httpMethod || 'GET')}" style="font-family: ${fontFam}; background: ${
            bgVal || resolvedAccent
          }; font-weight: ${fontWt};" class="sl-action-btn px-7 py-3 ${radiusClass} text-sm shadow-lg hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-45">
      <span style="${textFxCss}">${content}</span>
    </button>
  </div>`;
        }

        case 'backend-flask':
        case 'backend-fetch':
        case 'backend-storage':
        case 'backend-db':
        case 'backend-auth':
        case 'backend-device':
        case 'backend-blockly':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(6, 78, 59, 0.3)'
          };" class="p-5 ${radiusClass} border border-emerald-500/30 space-y-1">
      <div style="color: ${getCssColor(
        b.style?.textColor,
        b.style?.customTextHex,
        '#34d399'
      )};" class="text-sm font-mono font-bold">${content}</div>
      ${subtitle ? `<p style="color: ${subColor};" class="text-xs">${subtitle}</p>` : ''}
    </div>
  </section>`;

        case 'ui-footer':
          return `  <footer id="${elId}" style="${layoutStyle}font-family: ${fontFam}; background: ${
            bgVal || (isLightPage ? 'rgba(255, 255, 255, 0.85)' : '#0b0e16')
          };" class="w-full mt-auto border-t ${
            isLightPage ? 'border-slate-200' : 'border-white/10'
          }${customCls}">
    <div class="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm">
      <span style="color: ${getCssColor(
        b.style?.textColor,
        b.style?.customTextHex,
        defaultMutedColor
      )};">${content}</span>
      ${subtitle ? `<span style="color: ${subColor};">${subtitle}</span>` : ''}
    </div>
  </footer>`;

        default:
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="font-family: ${fontFam};" class="${alignClass} space-y-1">
      <div style="color: ${primaryColor}; font-weight: ${fontWt};" class="text-base">${content}</div>
      ${subtitle ? `<p style="color: ${subColor};" class="text-sm">${subtitle}</p>` : ''}
    </div>
  </section>`;
      }
    })
    .join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(projectName)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background: ${pageBg};
      background-attachment: fixed;
      color: ${defaultBodyColor};
    }${animBundle.css ? `\n${animBundle.css}` : ''}
  </style>
</head>
<body class="min-h-screen flex flex-col m-0 antialiased relative overflow-x-hidden">
${animBundle.html}  <div class="relative z-10 min-h-screen flex flex-col">
${renderedBlocks}
  </div>

  <script>
    function slShowToast(message) {
      var existing = document.getElementById('sl-runtime-toast');
      if (existing) existing.remove();
      var toast = document.createElement('div');
      toast.id = 'sl-runtime-toast';
      toast.textContent = message;
      toast.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;background:#111827;color:#f8fafc;border:1px solid rgba(99,102,241,0.5);padding:12px 18px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 12px 30px rgba(0,0,0,0.45);max-width:340px;';
      document.body.appendChild(toast);
      setTimeout(function() { if (toast.parentNode) toast.remove(); }, 3200);
    }

    document.querySelectorAll('.sl-nav-link').forEach(function(link) {
      link.addEventListener('click', function(e) {
        var scrollTarget = link.getAttribute('data-scroll-target');
        var msg = link.getAttribute('data-nav-msg');
        if (scrollTarget) {
          var el = document.getElementById(scrollTarget);
          if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        } else if (msg) {
          e.preventDefault();
          slShowToast(msg);
        }
      });
    });

    document.querySelectorAll('.sl-action-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var action = btn.dataset.action || 'increment-counter';
        var targetId = btn.dataset.target || '';
        var targetPage = btn.dataset.targetPage || '';
        var payload = btn.dataset.payload || '';
        var endpoint = btn.dataset.endpoint || '/api/v1/metrics';
        var method = btn.dataset.method || 'GET';

        if (action === 'navigate-page' && targetPage) { window.location.href = targetPage; return; }
        if (action === 'go-back') { window.history.back(); return; }
        if (action === 'scroll-to-block' && targetId) {
          var section = document.getElementById('sl-el-' + targetId);
          if (section) section.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        if (action === 'open-modal' && targetId) {
          var m = document.getElementById(targetId + '-modal');
          if (m) m.classList.remove('hidden');
          return;
        }
        if (action === 'close-modal' && targetId) {
          var m2 = document.getElementById(targetId + '-modal');
          if (m2) m2.classList.add('hidden');
          return;
        }
        if (action === 'show-element' && targetId) {
          var elShow = document.getElementById('sl-el-' + targetId);
          if (elShow) elShow.style.display = '';
          return;
        }
        if (action === 'hide-element' && targetId) {
          var elHide = document.getElementById('sl-el-' + targetId);
          if (elHide) elHide.style.display = 'none';
          return;
        }
        if (action === 'copy-clipboard') {
          navigator.clipboard && navigator.clipboard.writeText(payload || document.title);
          slShowToast('Copied to clipboard!');
          return;
        }
        if (action === 'clear-form') {
          document.querySelectorAll('[data-sl-input-id]').forEach(function(inp) { inp.value = ''; });
          slShowToast('Form cleared');
          return;
        }
        if (action === 'submit-form') {
          var inputs = Array.from(document.querySelectorAll('[data-sl-input-id]'));
          var values = inputs
            .map(function(inp) {
              return (inp.getAttribute('data-sl-input-label') || 'Field') + ': ' + (inp.value || '').trim();
            })
            .filter(function(item) { return !item.endsWith(': '); });
          slShowToast(payload || (values.length ? 'Submitted -> ' + values.join(' | ') : 'Form submitted successfully!'));
          return;
        }
        if (action === 'open-url' && payload) {
          if (payload.startsWith('#')) {
            var anchor = document.querySelector(payload);
            if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            window.location.href = payload;
          }
          return;
        }
        if (action === 'toggle-visibility') {
          var details = targetId ? document.getElementById(targetId + '-details') : document.querySelector('details');
          if (details) { details.open = !details.open; return; }
          var chk = targetId ? document.getElementById(targetId + '-toggle') : document.querySelector('input[type="checkbox"]');
          if (chk) { chk.checked = !chk.checked; return; }
        }
        if (action === 'save-storage') {
          localStorage.setItem('sl_user_data', payload || 'saved');
          slShowToast('Saved to LocalStorage');
          return;
        }
        if (action === 'call-api') {
          fetch(endpoint, { method: method }).then(function(r) { return r.json(); }).then(function(d) {
            slShowToast('API 200 OK: ' + JSON.stringify(d));
          }).catch(function() {
            slShowToast('Called ' + method + ' ' + endpoint);
          });
          return;
        }
        if (action === 'alert') { slShowToast(payload || 'Action executed!'); return; }
        var counterEl = targetId ? document.getElementById(targetId + '-val') : document.querySelector('[id$="-val"]');
        if (counterEl) {
          counterEl.textContent = String(Number(counterEl.textContent || 0) + 1);
        } else {
          slShowToast(payload || 'Button clicked!');
        }
      });
    });
  </script>
</body>
</html>`;
}

export function generateReactTsxExport(
  projectName: string,
  blocks: CanvasBlock[],
  pageStyle?: PageStyleSettings
): string {
  const hasCounter = blocks.some((b) => b.type === 'logic-counter');
  const hasAccordion = blocks.some((b) => b.type === 'ui-accordion');
  const pageBg = resolvePageBackgroundCss(pageStyle);
  const pageTextColor = pageStyle?.textColor || '#f1f5f9';

  const stateHooks = [
    hasCounter ? '  const [counter, setCounter] = useState<number>(0);' : '',
    hasAccordion ? '  const [openFaq, setOpenFaq] = useState<boolean>(false);' : '',
  ]
    .filter(Boolean)
    .join('\n');

  const jsxBody = blocks
    .map((b) => {
      const safeTitle = JSON.stringify(b.content || b.name);
      const safeSub = JSON.stringify(b.subtitle || '');
      switch (b.type) {
        case 'ui-navbar':
          return `      <header className="w-full border-b border-white/10 bg-[#0D111A]/90 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-bold text-lg text-white">{${safeTitle}}</span>
          <span className="text-sm text-slate-400">{${safeSub}}</span>
        </div>
      </header>`;
        case 'ui-heading':
          return `      <section className="w-full py-16 px-6 text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-white">{${safeTitle}}</h1>
        <p className="text-base text-slate-400 max-w-2xl mx-auto">{${safeSub}}</p>
      </section>`;
        case 'ui-paragraph':
          return `      <section className="max-w-4xl mx-auto px-6 py-4">
        <p className="text-base text-slate-300 leading-relaxed">{${safeTitle}}</p>
      </section>`;
        case 'ui-grid':
          return `      <section className="max-w-5xl mx-auto px-6 py-4 grid grid-cols-1 ${
            b.gridColumns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
          } gap-4">
        {${JSON.stringify(parseOptionsList(b.content, b.options))}.map((item, i) => (
          <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 font-semibold text-white">{item}</div>
        ))}
      </section>`;
        case 'logic-counter':
          return `      <section className="max-w-5xl mx-auto px-6 py-4">
        <div className="p-6 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
          <p className="text-sm text-indigo-300 font-semibold">${b.name}</p>
          <p className="text-3xl font-bold text-white tabular-nums">{counter}</p>
        </div>
      </section>`;
        case 'ui-button': {
          const clickCode =
            b.action === 'alert'
              ? `console.log(${JSON.stringify(b.actionPayload || `Clicked ${b.name}`)})`
              : b.action === 'scroll-to-block' && b.targetId
              ? `document.getElementById(${JSON.stringify(`sl-el-${b.targetId}`)})?.scrollIntoView({ behavior: 'smooth' })`
              : b.action === 'submit-form'
              ? `console.log(${JSON.stringify(b.actionPayload || 'Form submitted!')})`
              : hasCounter
              ? `setCounter((c) => c + 1)`
              : `console.log(${JSON.stringify(b.actionPayload || `Clicked ${b.name}`)})`;
          return `      <div id="sl-el-${b.id}" className="max-w-5xl mx-auto px-6 py-4 text-center">
        <button
          onClick={() => ${clickCode}}
          className="px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
        >
          {${safeTitle}}
        </button>
      </div>`;
        }
        case 'ui-accordion':
          return `      <section className="max-w-5xl mx-auto px-6 py-3">
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
          <button
            onClick={() => setOpenFaq((o) => !o)}
            className="w-full text-left p-5 font-semibold text-base text-white flex justify-between"
          >
            <span>{${safeTitle}}</span>
            <span>{openFaq ? '−' : '+'}</span>
          </button>
          {openFaq && <p className="px-5 pb-5 text-sm text-slate-400">{${safeSub}}</p>}
        </div>
      </section>`;
        case 'ui-footer':
          return `      <footer className="w-full mt-auto border-t border-white/10 bg-[#0B0E16]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-slate-400">
          <span>{${safeTitle}}</span>
          <span>{${safeSub}}</span>
        </div>
      </footer>`;
        default:
          return `      <section className="max-w-5xl mx-auto px-6 py-4">
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-bold text-white">{${safeTitle}}</h3>
          {${safeSub} && <p className="text-sm text-slate-400 mt-1">{${safeSub}}</p>}
        </div>
      </section>`;
      }
    })
    .join('\n\n');

  return `import React${stateHooks ? ', { useState }' : ''} from 'react';

// Generated by SL Builder WebStudio for "${projectName}" (Animation: ${pageStyle?.liveAnimation || 'none'})
export function GeneratedApp() {
${stateHooks}

  return (
    <main
      className="min-h-screen flex flex-col relative overflow-x-hidden"
      style={{ background: ${JSON.stringify(pageBg)}, color: ${JSON.stringify(pageTextColor)} }}
    >
${jsxBody}
    </main>
  );
}`;
}

export function generateFlaskExport(projectName: string, blocks: CanvasBlock[]): string {
  const apiBlocks = blocks.filter(
    (b) => b.type === 'backend-flask' || b.type === 'backend-fetch' || b.type === 'backend-db'
  );

  const routes =
    apiBlocks.length > 0
      ? apiBlocks
          .map((b, idx) => {
            if (b.type === 'backend-db') {
              const col = b.logicConfig?.collectionName || 'users';
              return `@app.route("/api/v1/${col}", methods=["GET", "POST", "DELETE"])
def collection_${idx + 1}():
    payload = request.get_json(silent=True) or {}
    return jsonify({
        "collection": ${JSON.stringify(col)},
        "method": request.method,
        "received": payload,
        "status": "ok"
    })`;
            }
            const path = b.apiEndpoint || `/api/v1/resource_${idx + 1}`;
            const method = b.httpMethod || 'GET';
            const fnName = `handler_${idx + 1}`;
            return `@app.route("${path}", methods=[${JSON.stringify(method)}, "OPTIONS"])
def ${fnName}():
    return jsonify({
        "service": ${JSON.stringify(b.name)},
        "method": request.method,
        "endpoint": ${JSON.stringify(path)},
        "status": "ok"
    })`;
          })
          .join('\n\n')
      : `@app.route("/api/v1/health", methods=["GET"])
def health_check():
    return jsonify({"project": ${JSON.stringify(projectName)}, "status": "healthy"})`;

  return `from flask import Flask, jsonify, request
from flask_cors import CORS

# Generated by SL Builder WebStudio for "${projectName}"
app = Flask(__name__)
CORS(app)

${routes}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
`;
}

export function generateCssExport(
  projectName: string,
  blocks: CanvasBlock[],
  pageStyle?: PageStyleSettings
): string {
  const pageBg = resolvePageBackgroundCss(pageStyle);
  const pageText = pageStyle?.textColor || '#f1f5f9';
  const pageAccent = pageStyle?.accentColor || '#4c97ff';
  const animBundle = buildLiveAnimationCssAndHtml(pageStyle);

  const blockRules = blocks
    .map((b, idx) => {
      const selector = `.sl-block-${idx + 1}-${b.type}${
        b.style?.customClass ? `.${b.style.customClass.trim().replace(/\s+/g, '.')}` : ''
      }`;
      const align =
        b.style?.textAlign ||
        (b.type === 'ui-heading' || b.type === 'ui-button' ? 'center' : 'left');
      const radius =
        b.style?.borderRadius === 'rounded-full'
          ? '9999px'
          : b.style?.borderRadius === 'rounded-2xl'
          ? '1rem'
          : b.style?.borderRadius === 'rounded-xl'
          ? '0.75rem'
          : b.style?.borderRadius === 'rounded-lg'
          ? '0.5rem'
          : b.style?.borderRadius === 'rounded-none'
          ? '0px'
          : '0.75rem';
      const pad =
        b.style?.padding === 'p-5'
          ? '1.25rem'
          : b.style?.padding === 'p-4'
          ? '1rem'
          : b.style?.padding === 'p-3'
          ? '0.75rem'
          : b.style?.padding === 'p-0'
          ? '0px'
          : '1rem';
      const fontSize =
        b.style?.fontSize === '4xl'
          ? '2.25rem'
          : b.style?.fontSize === '3xl'
          ? '1.875rem'
          : b.style?.fontSize === '2xl'
          ? '1.5rem'
          : b.style?.fontSize === 'xl'
          ? '1.25rem'
          : b.style?.fontSize === 'lg'
          ? '1.125rem'
          : b.style?.fontSize === 'base'
          ? '1rem'
          : b.style?.fontSize === 'xs'
          ? '0.75rem'
          : '0.875rem';
      const fontFamily = getCssFontFamily(b.style?.fontFamily);
      const fontWeight = getCssFontWeight(b.style?.fontWeight, '400');
      const bg = getCssBgColor(b.style?.bgColor, b.style?.customBgHex) || 'transparent';
      const color = getCssColor(b.style?.textColor, b.style?.customTextHex, pageText);

      return `/* ${b.name} (${b.type}) */
${selector} {
  font-family: ${fontFamily};
  font-weight: ${fontWeight};
  text-align: ${align};
  font-size: ${fontSize};
  color: ${color};
  background: ${bg};
  border-radius: ${radius};
  padding: ${pad};${b.style?.width ? `\n  width: ${b.style.width};` : ''}${
        b.style?.height ? `\n  min-height: ${b.style.height};` : ''
      }${b.style?.margin ? `\n  margin: ${b.style.margin};` : ''}${
        b.style?.isHidden ? '\n  display: none;' : ''
      }
}`;
    })
    .join('\n\n');

  return `/* SL Builder WebStudio — styles.css for "${projectName}" */
:root {
  --sl-bg: ${pageBg};
  --sl-accent: ${pageAccent};
  --sl-text: ${pageText};
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--sl-bg);
  background-attachment: fixed;
  color: var(--sl-text);
  font-family: Inter, system-ui, -apple-system, sans-serif;
}
${animBundle.css ? `\n/* Live Page Animation: ${pageStyle?.liveAnimation} */${animBundle.css}\n` : ''}
${blockRules}`;
}

export function generateJsExport(
  projectName: string,
  blocks: CanvasBlock[],
  pages?: SitePage[]
): string {
  const wiredBlocks = blocks.filter(
    (b) =>
      b.action ||
      b.type.startsWith('logic-') ||
      b.type.startsWith('backend-') ||
      b.type === 'ui-button' ||
      b.type === 'ui-navbar'
  );

  const listeners = wiredBlocks
    .map((b) => {
      if (b.type === 'ui-navbar') {
        const navLinks = getEffectiveNavLinks(b, pages, blocks);
        const linkSummary = navLinks
          .map(
            (l) =>
              `//   - "${l.label}" -> ${l.action}${
                l.action === 'navigate-page' && l.targetPageId
                  ? ` (${pages?.find((p) => p.id === l.targetPageId)?.slug || 'page'}.html)`
                  : l.action === 'scroll-to-block' && l.targetBlockId
                  ? ` (#sl-el-${l.targetBlockId})`
                  : l.action === 'open-url' && l.url
                  ? ` (${l.url})`
                  : ''
              }`
          )
          .join('\n');
        return `// Navbar Navigation Wire: ${b.name}
${linkSummary || '//   (Configure navbar links in Studio JavaScript tab)'}
document.querySelectorAll('#sl-el-${b.id} .sl-nav-link').forEach((linkEl) => {
  linkEl.addEventListener('click', (e) => {
    const scrollTarget = linkEl.getAttribute('data-scroll-target');
    const msg = linkEl.getAttribute('data-nav-msg');
    if (scrollTarget) {
      e.preventDefault();
      document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (msg) {
      e.preventDefault();
      slShowToast(msg);
    }
  });
});`;
      }
      if (b.type === 'logic-counter') {
        return `// Reactive Counter State: ${b.name}
let counter_${b.id.replace(/[^a-zA-Z0-9_]/g, '_')} = ${b.counterValue ?? 0};`;
      }
      if (b.type === 'logic-onkey') {
        return `// Keyboard Shortcut Hat: ${b.name}
document.addEventListener('keydown', (e) => {
  if (e.key === ${JSON.stringify(b.triggerKey || 'Enter')}) {
    slShowToast(${JSON.stringify(b.actionPayload || 'Shortcut triggered!')});
  }
});`;
      }
      if (b.type === 'backend-storage') {
        const key = b.logicConfig?.storageKey || 'sl_user_data';
        return `// LocalStorage Action: ${b.name}
localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(b.logicConfig?.varValue || '')});`;
      }
      if (b.type === 'backend-flask' || b.type === 'backend-fetch') {
        const endpoint = b.apiEndpoint || '/api/v1/metrics';
        const method = b.httpMethod || 'GET';
        return `// HTTP Request (${method}): ${b.name}
async function call_${b.id.replace(/[^a-zA-Z0-9_]/g, '_')}() {
  const res = await fetch(${JSON.stringify(endpoint)}, {
    method: ${JSON.stringify(method)},
    headers: ${b.requestHeaders || '{"Content-Type":"application/json"}'},
    ${method !== 'GET' ? `body: ${JSON.stringify(b.requestBody || '{}')},` : ''}
  });
  return res.json();
}`;
      }
      if (b.type === 'ui-button' || b.type.startsWith('logic-')) {
        const targetId = b.targetId || blocks.find((t) => t.type === 'logic-counter')?.id || '';
        const action = b.action || 'increment-counter';
        let bodyCode = `slShowToast(${JSON.stringify(b.actionPayload || `Executed ${b.name}`)});`;
        if (action === 'navigate-page') {
          const pg = pages?.find((p) => p.id === b.targetPageId);
          bodyCode = pg
            ? `window.location.href = ${JSON.stringify(`${pg.slug}.html`)};`
            : `slShowToast('Select a target page in the JavaScript tab.');`;
        } else if (action === 'go-back') {
          bodyCode = `window.history.back();`;
        } else if (action === 'scroll-to-block' && b.targetId) {
          bodyCode = `document.getElementById(${JSON.stringify(`sl-el-${b.targetId}`)})?.scrollIntoView({ behavior: 'smooth', block: 'center' });`;
        } else if (action === 'submit-form') {
          bodyCode = `const fields = Array.from(document.querySelectorAll('[data-sl-input-id]'))
    .map((el) => (el.getAttribute('data-sl-input-label') || 'Field') + ': ' + (el.value || '').trim())
    .filter((v) => !v.endsWith(': '));
  slShowToast(${JSON.stringify(b.actionPayload || '')} || (fields.length ? 'Submitted -> ' + fields.join(' | ') : 'Form submitted!'));`;
        } else if (action === 'clear-form') {
          bodyCode = `document.querySelectorAll('[data-sl-input-id]').forEach((el) => { el.value = ''; });`;
        } else if (action === 'copy-clipboard') {
          bodyCode = `navigator.clipboard?.writeText(${JSON.stringify(b.actionPayload || projectName)}); slShowToast('Copied!');`;
        } else if (action === 'show-element' && b.targetId) {
          bodyCode = `const t = document.getElementById(${JSON.stringify(`sl-el-${b.targetId}`)}); if (t) t.style.display = '';`;
        } else if (action === 'hide-element' && b.targetId) {
          bodyCode = `const t = document.getElementById(${JSON.stringify(`sl-el-${b.targetId}`)}); if (t) t.style.display = 'none';`;
        } else if (action === 'open-url') {
          bodyCode = `window.location.href = ${JSON.stringify(b.actionPayload || 'https://example.com')};`;
        } else if (action === 'call-api') {
          bodyCode = `fetch(${JSON.stringify(b.apiEndpoint || '/api/v1/metrics')}).then((r) => r.json()).then((d) => slShowToast('API 200 OK: ' + JSON.stringify(d)));`;
        } else if (action === 'increment-counter' && targetId) {
          bodyCode = `const el = document.getElementById('${targetId}-val'); if (el) el.textContent = String(Number(el.textContent || 0) + 1);`;
        }

        return `// Event Listener (${action}): ${b.name}
document.querySelector('[data-block-id="${b.id}"]')?.addEventListener('click', () => {
  ${bodyCode}
});`;
      }
      return `// Block Behavior: ${b.name} (${b.type})
console.log('Initialized module:', ${JSON.stringify(b.name)});`;
    })
    .join('\n\n');

  return `// SL Builder WebStudio — script.js for "${projectName}"
function slShowToast(message) {
  const old = document.getElementById('sl-runtime-toast');
  if (old) old.remove();
  const toast = document.createElement('div');
  toast.id = 'sl-runtime-toast';
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;background:#111827;color:#f8fafc;border:1px solid rgba(99,102,241,0.5);padding:12px 18px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 12px 30px rgba(0,0,0,0.45);';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('SL Builder WebStudio app booted:', ${JSON.stringify(projectName)});

${listeners
  .split('\n')
  .map((line) => `  ${line}`)
  .join('\n')}
});
`;
}
