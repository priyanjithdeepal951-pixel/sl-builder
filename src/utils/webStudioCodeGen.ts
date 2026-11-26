import { CanvasBlock, PageStyleSettings, SitePage } from '../types/builder';
import {
  getAnimationCount,
  getAnimationSpeedMultiplier,
  isLightPageBackground,
  resolvePageBackgroundCss,
} from './pageStylePresets';
import { getEffectiveNavLinks } from './navLinkHelpers';
import { parseOptionsList } from './studioRuntime';
import { getVectorIconDef, getVectorIconSvgHtml, parseVideoUrl } from './mediaHelpers';

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

  const renderChildHtml = (child: CanvasBlock, extraCss = ''): string => {
    const cText = escapeHtml(child.content || child.name);
    const cSub = child.subtitle ? escapeHtml(child.subtitle) : '';
    const bgCss = child.style?.customBgHex ? `background-color:${child.style.customBgHex};` : '';
    const txtCss = child.style?.customTextHex ? `color:${child.style.customTextHex};` : '';
    const styleAttr = bgCss || txtCss || extraCss ? ` style="${bgCss}${txtCss}${extraCss}"` : '';

    if (child.type === 'ui-spacer') {
      const sz = child.spacerSize ?? 16;
      return `<div style="height:${sz}px;width:${sz}px;${extraCss}"></div>`;
    }
    if (child.type === 'ui-divider') {
      return `<hr style="border:0;border-top:${escapeHtml(
        child.style?.borderWidth || '1px'
      )} solid ${escapeHtml(child.style?.borderColor || 'rgba(255,255,255,0.2)')};width:100%;margin:4px 0;${extraCss}" />`;
    }
    if (child.type === 'ui-vertical-divider') {
      return `<div style="border-left:${escapeHtml(
        child.style?.borderWidth || '1px'
      )} solid ${escapeHtml(child.style?.borderColor || 'rgba(255,255,255,0.22)')};min-height:28px;align-self:stretch;margin:0 4px;"></div>`;
    }
    if (child.type === 'ui-button') {
      return `<button type="button" onclick="slShowToast(${escapeHtml(
        JSON.stringify(child.actionPayload || cText)
      )})" style="background-color:${escapeHtml(
        child.style?.customBgHex || resolvedAccent
      )};${txtCss}${extraCss}" class="px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer">${cText}</button>`;
    }
    if (child.type === 'ui-image') {
      return child.imageUrl
        ? `<img src="${escapeHtml(child.imageUrl)}" alt="${cText}"${styleAttr} class="w-full h-28 object-cover rounded-lg" />`
        : `<div${styleAttr} class="h-24 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center text-xs text-sky-300">${cText}</div>`;
    }
    if (child.type === 'ui-badge') {
      return `<span${styleAttr} class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300">${cText}</span>`;
    }
    return `<div${styleAttr} class="px-3.5 py-2.5 rounded-lg bg-[#090B10] border border-white/10 text-xs text-slate-200"><div class="font-semibold text-white">${cText}</div>${
      cSub ? `<div class="text-[11px] text-slate-400 mt-0.5">${cSub}</div>` : ''
    }</div>`;
  };

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
      }${b.style?.borderWidth ? ` border-width: ${b.style.borderWidth};` : ''}${
        b.style?.boxShadow ? ` box-shadow: ${b.style.boxShadow};` : ''
      }`;
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
            b.badgeText || 'BC'
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
          const items = parsedOptions.length ? parsedOptions : ['Dashboard', 'Projects', 'Settings'];
          const itemsHtml = items
            .map(
              (item, idx) =>
                `<button type="button" data-sl-sidebar="${escapeHtml(
                  b.id
                )}" data-sl-idx="${idx}" class="sl-sidebar-btn w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                  idx === 0
                    ? 'bg-indigo-600/30 text-white border border-indigo-400/40 font-semibold'
                    : 'text-slate-300 hover:bg-white/10'
                }">${escapeHtml(item)}</button>`
            )
            .join('\n        ');
          return `  <aside id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-white/10 bg-white/5 space-y-2">
      <div style="${textFxCss}" class="text-sm font-bold border-b border-white/10 pb-2">${content}</div>
      <nav class="space-y-1">
        ${itemsHtml}
      </nav>
    </div>
  </aside>`;
        }

        case 'ui-tabbar': {
          const tabs = parsedOptions.length ? parsedOptions : ['Overview', 'Specs', 'Reviews'];
          const rawPanels = (b.subtitle || '')
            .split('|')
            .map((s) => s.trim())
            .filter(Boolean);
          const tabsHtml = tabs
            .map((t, idx) => {
              const panelText =
                rawPanels.length > 1
                  ? rawPanels[idx] || rawPanels[0]
                  : b.subtitle || 'Active tab panel content.';
              return `<button type="button" data-sl-tab-group="${escapeHtml(
                b.id
              )}" data-sl-tab="${escapeHtml(t)}" data-sl-panel="${escapeHtml(
                panelText
              )}" class="sl-tab-btn px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                idx === (b.counterValue ?? 0)
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }">${escapeHtml(t)}</button>`;
            })
            .join('');
          const activeIdx = b.counterValue ?? 0;
          const initialTab = tabs[activeIdx] || tabs[0] || 'Tab 1';
          const initialPanel =
            rawPanels.length > 1
              ? rawPanels[activeIdx] || rawPanels[0]
              : b.subtitle || 'Active tab panel content.';
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-4 ${radiusClass} border border-white/10 bg-white/5 space-y-3">
      <div class="flex flex-wrap gap-1 bg-[#090B10] p-1 rounded-xl border border-white/10">${tabsHtml}</div>
      <p id="sl-tab-panel-${escapeHtml(b.id)}" style="color:${subColor};" class="sl-tab-panel text-sm"><strong class="text-sky-300">${escapeHtml(
            initialTab
          )}:</strong> ${escapeHtml(initialPanel)}</p>
    </div>
  </section>`;
        }

        case 'ui-link': {
          const pg = pages?.find((p) => p.id === b.targetPageId);
          const targetHref = pg ? `${escapeHtml(pg.slug)}.html` : '';
          if (b.action === 'navigate-page' && pg) {
            return `  <div id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3 ${alignClass}${customCls}">
    <a href="${targetHref}" style="${textFxCss} font-family:${fontFam};" class="text-sm font-semibold hover:underline">${content}</a>
  </div>`;
          }
          if (b.action === 'open-url' || !b.action) {
            const href = escapeHtml(b.actionPayload || '#');
            return `  <div id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3 ${alignClass}${customCls}">
    <a href="${href}" class="text-sm font-semibold hover:underline" style="${textFxCss} font-family:${fontFam};">${content}</a>
  </div>`;
          }
          return `  <div id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3 ${alignClass}${customCls}">
    <button type="button" data-block-id="${escapeHtml(b.id)}" data-action="${escapeHtml(
            b.action
          )}" data-target="${escapeHtml(b.targetId || '')}" data-target-page="${targetHref}" data-payload="${escapeHtml(
            b.actionPayload || ''
          )}" style="${textFxCss} font-family:${fontFam};" class="sl-action-btn bg-transparent border-0 text-sm font-semibold hover:underline cursor-pointer">${content}</button>
  </div>`;
        }

        case 'ui-section': {
          const childrenHtml =
            b.children && b.children.length > 0
              ? `<div class="pt-3 space-y-2.5 text-left">${b.children
                  .map((c) => renderChildHtml(c))
                  .join('')}</div>`
              : '';
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-6${customCls}">
    <div style="${surfaceFxCss}" class="p-7 ${radiusClass} border border-white/10 bg-white/5 ${alignClass} space-y-2">
      ${
        b.badgeText === undefined || b.badgeText !== ''
          ? `<span class="text-[10px] font-mono uppercase tracking-widest text-sky-400 block">${escapeHtml(
              b.badgeText || 'Container'
            )}</span>`
          : ''
      }
      <h2 style="${textFxCss}" class="text-2xl font-bold">${content}</h2>
      ${subtitle ? `<p style="color:${subColor};" class="text-sm">${subtitle}</p>` : ''}
      ${childrenHtml}
    </div>
  </section>`;
        }

        case 'ui-row': {
          const inner =
            b.children && b.children.length > 0
              ? b.children
                  .map((c) =>
                    renderChildHtml(c, c.type === 'ui-vertical-divider' ? 'flex:0 0 auto;' : 'flex:1 1 0%;min-width:120px;')
                  )
                  .join('')
              : (parsedOptions.length ? parsedOptions : ['Widget 1', 'Widget 2', 'Widget 3'])
                  .map(
                    (c) =>
                      `<div style="${textFxCss}" class="flex-1 min-w-[140px] p-4 rounded-xl bg-[#090B10] border border-white/10 text-sm font-semibold text-center">${escapeHtml(
                        c
                      )}</div>`
                  )
                  .join('');
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-white/10 bg-white/5 space-y-2.5">
      ${subtitle ? `<div style="color:${subColor};" class="text-xs font-mono">${subtitle}</div>` : ''}
      <div class="flex flex-wrap sm:flex-nowrap items-center gap-3">${inner}</div>
    </div>
  </section>`;
        }

        case 'ui-column': {
          const inner =
            b.children && b.children.length > 0
              ? b.children.map((c) => renderChildHtml(c)).join('')
              : (parsedOptions.length ? parsedOptions : ['Top Widget', 'Middle Widget', 'Bottom Widget'])
                  .map(
                    (c) =>
                      `<div style="${textFxCss}" class="w-full p-4 rounded-xl bg-[#090B10] border border-white/10 text-sm">${escapeHtml(
                        c
                      )}</div>`
                  )
                  .join('');
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-white/10 bg-white/5 space-y-2.5">
      ${subtitle ? `<div style="color:${subColor};" class="text-xs font-mono">${subtitle}</div>` : ''}
      <div class="flex flex-col gap-3">${inner}</div>
    </div>
  </section>`;
        }

        case 'ui-stack': {
          const childrenHtml =
            b.children && b.children.length > 0
              ? `<div class="pt-2 flex flex-wrap gap-2">${b.children.map((c) => renderChildHtml(c)).join('')}</div>`
              : '';
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}min-height:${escapeHtml(
            b.style?.height && b.style.height !== 'auto' ? b.style.height : '180px'
          )};" class="relative overflow-hidden ${radiusClass} border border-white/15 flex flex-col justify-end p-6">
      ${
        b.imageUrl
          ? `<img src="${escapeHtml(b.imageUrl)}" alt="${content}" class="absolute inset-0 w-full h-full object-cover" />`
          : `<div class="absolute inset-0 bg-gradient-to-br from-indigo-700/70 via-slate-900 to-sky-700/60"></div>`
      }
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15"></div>
      ${
        b.badgeText !== ''
          ? `<span style="background:${escapeHtml(resolvedAccent)};" class="absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-bold text-white">${escapeHtml(
              b.badgeText || 'LIVE'
            )}</span>`
          : ''
      }
      <div class="relative z-10 space-y-1.5">
        <h3 style="${textFxCss}" class="text-xl font-bold">${content}</h3>
        ${subtitle ? `<p style="color:${subColor};" class="text-sm">${subtitle}</p>` : ''}
        ${childrenHtml}
      </div>
    </div>
  </section>`;
        }

        case 'ui-listview': {
          const isHoriz = b.direction === 'horizontal';
          const items = (
            parsedOptions.length
              ? parsedOptions
              : ['Alex Rivera · Hey, UI update looks great!', 'Sarah Chen · Ready to publish build', 'Design Team · Synced']
          )
            .map((raw) => {
              const [t, s] = raw.split('·').map((x) => x.trim());
              return `<div class="${
                isHoriz ? 'min-w-[210px] shrink-0' : 'w-full'
              } p-3.5 rounded-xl bg-[#090B10] border border-white/10 flex items-center gap-3">
                <div style="background:${escapeHtml(resolvedAccent)};" class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">${escapeHtml(
                (t || 'U').slice(0, 2).toUpperCase()
              )}</div>
                <div class="min-w-0 flex-1"><div class="text-sm font-semibold text-white truncate">${escapeHtml(
                  t
                )}</div>${s ? `<div class="text-xs text-slate-400 truncate">${escapeHtml(s)}</div>` : ''}</div>
              </div>`;
            })
            .join('');
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-4 ${radiusClass} border border-white/10 bg-white/5">
      <div class="${isHoriz ? 'flex flex-row gap-3 overflow-x-auto pb-2' : 'flex flex-col gap-2 max-h-72 overflow-y-auto'}">${items}</div>
    </div>
  </section>`;
        }

        case 'ui-grid': {
          const cells = (parsedOptions.length ? parsedOptions : ['Gallery 01', 'Gallery 02', 'Gallery 03', 'Gallery 04'])
            .map(
              (c) =>
                `<div style="${textFxCss}" class="p-4 rounded-xl bg-[#090B10] border border-white/10 text-sm font-semibold">${escapeHtml(
                  c
                )}</div>`
            )
            .join('');
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-white/10 bg-white/5 space-y-2.5">
      ${subtitle ? `<div style="color:${subColor};" class="text-xs font-mono">${subtitle}</div>` : ''}
      <div class="grid grid-cols-1 ${b.gridColumns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4">${cells}</div>
    </div>
  </section>`;
        }

        case 'ui-spacer':
          return `  <div id="${elId}" style="height:${b.spacerSize ?? 32}px;" aria-hidden="true"></div>`;

        case 'ui-divider':
          return `  <div id="${elId}" class="max-w-5xl mx-auto px-6 py-3">
    <hr style="border:0;border-top:${escapeHtml(
      b.style?.borderWidth || '1px'
    )} solid ${escapeHtml(b.style?.borderColor || 'rgba(255,255,255,0.18)')};" />
  </div>`;

        case 'ui-vertical-divider':
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-4 ${radiusClass} border border-white/10 bg-white/5 flex items-stretch gap-4">
      <div class="flex-1 flex items-center justify-center text-sm">${escapeHtml(
        parsedOptions[0] || 'Left Panel Content'
      )}</div>
      <div style="border-left:${escapeHtml(b.style?.borderWidth || '1px')} solid ${escapeHtml(
            b.style?.borderColor || 'rgba(255,255,255,0.22)'
          )};min-height:40px;"></div>
      <div class="flex-1 flex items-center justify-center text-sm">${escapeHtml(
        parsedOptions[1] || 'Right Panel Content'
      )}</div>
    </div>
  </section>`;

        case 'ui-pageview': {
          const slides = parsedOptions.length
            ? parsedOptions
            : ['Welcome to Studio · Drag & drop layouts effortlessly', 'Interactive Logic · Connect events & live data', 'Instant Export · Ship clean production code'];
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-6 ${radiusClass} border border-white/15 bg-white/5 space-y-4 text-center" data-sl-pageview='${escapeHtml(
            JSON.stringify(slides)
          )}' data-sl-page-idx="0">
      <div class="min-h-[100px] flex flex-col items-center justify-center gap-1">
        <h3 class="sl-pv-title text-lg font-bold text-white">${escapeHtml(
          (slides[0] || '').split('·')[0].trim()
        )}</h3>
        <p class="sl-pv-sub text-sm text-slate-300">${escapeHtml(
          ((slides[0] || '').split('·')[1] || '').trim()
        )}</p>
      </div>
      <div class="flex items-center justify-between">
        <button type="button" onclick="slStepPageView(this, -1)" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer">&larr; Prev</button>
        <span class="sl-pv-ind text-xs font-mono text-sky-300">Page 1 / ${slides.length}</span>
        <button type="button" onclick="slStepPageView(this, 1)" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer">Next &rarr;</button>
      </div>
    </div>
  </section>`;
        }

        case 'ui-carousel': {
          const items = parsedOptions.length ? parsedOptions : ['Slide 1', 'Slide 2', 'Slide 3', 'Slide 4'];
          const slidesHtml = items
            .map(
              (lbl, idx) =>
                `<div class="min-w-[260px] snap-center p-5 rounded-xl bg-[#090B10] border border-white/10 space-y-2"><div class="h-24 rounded-lg bg-gradient-to-tr from-indigo-500/25 to-sky-500/20"></div><div class="text-sm font-bold text-white">${escapeHtml(
                  lbl
                )}</div><div class="text-xs text-slate-400">Slide #${idx + 1}</div></div>`
            )
            .join('');
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-4 ${radiusClass} border border-white/10 bg-white/5 space-y-3">
      <div class="flex items-center justify-between text-xs font-mono text-sky-300">
        <span>Carousel Slider</span>
        <div class="flex gap-1.5">
          <button type="button" onclick="this.closest('section').querySelector('.sl-carousel-track').scrollBy({left:-280,behavior:'smooth'})" class="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 cursor-pointer">&larr;</button>
          <button type="button" onclick="this.closest('section').querySelector('.sl-carousel-track').scrollBy({left:280,behavior:'smooth'})" class="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 cursor-pointer">&rarr;</button>
        </div>
      </div>
      <div class="sl-carousel-track flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1">${slidesHtml}</div>
    </div>
  </section>`;
        }

        case 'ui-wrap': {
          const inner =
            b.children && b.children.length > 0
              ? b.children.map((c) => renderChildHtml(c)).join('')
              : (parsedOptions.length ? parsedOptions : ['UI Design', 'React', 'Tailwind CSS', 'TypeScript'])
                  .map(
                    (tag) =>
                      `<span style="${textFxCss}" class="px-3.5 py-1.5 rounded-full bg-[#090B10] border border-white/15 text-xs font-medium">${escapeHtml(
                        tag
                      )}</span>`
                  )
                  .join('');
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-white/10 bg-white/5 flex flex-wrap gap-2">${inner}</div>
  </section>`;
        }

        case 'ui-form':
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-3xl mx-auto px-6 py-4${customCls}">
    <form onsubmit="return slValidateDemoForm(event, this)" style="${surfaceFxCss}" class="p-6 ${radiusClass} border border-white/15 bg-white/5 space-y-3" novalidate>
      <div><h3 class="text-base font-bold text-white">${content}</h3>${
            subtitle ? `<p class="text-xs text-slate-400 mt-0.5">${subtitle}</p>` : ''
          }</div>
      <div><input type="text" name="name" placeholder="Full Name *" class="w-full px-3.5 py-2 rounded-lg bg-[#090B10] border border-white/15 text-sm text-white" /><div class="sl-err-name text-xs text-rose-400 mt-1 hidden"></div></div>
      <div><input type="email" name="email" placeholder="Email Address *" class="w-full px-3.5 py-2 rounded-lg bg-[#090B10] border border-white/15 text-sm text-white" /><div class="sl-err-email text-xs text-rose-400 mt-1 hidden"></div></div>
      <div><input type="password" name="password" placeholder="Password (min 6 chars) *" class="w-full px-3.5 py-2 rounded-lg bg-[#090B10] border border-white/15 text-sm text-white" /><div class="sl-err-password text-xs text-rose-400 mt-1 hidden"></div></div>
      <div class="sl-form-ok hidden p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-xs text-emerald-300 font-semibold">Form validated &amp; submitted successfully!</div>
      <button type="submit" style="background:${escapeHtml(resolvedAccent)};" class="w-full py-2.5 rounded-lg text-sm font-bold text-white cursor-pointer">${escapeHtml(
            b.badgeText || 'Validate & Submit'
          )}</button>
    </form>
  </section>`;

        case 'ui-staggered': {
          const heights = ['h-28', 'h-44', 'h-32', 'h-48', 'h-28', 'h-40'];
          const tiles = (
            parsedOptions.length
              ? parsedOptions
              : ['Architecture Concept', 'Minimal UI Kit', 'Typography Study', 'Color Tokens', 'Motion Curve', 'Dark Theme']
          )
            .map(
              (tile, idx) =>
                `<div class="break-inside-avoid rounded-xl p-4 bg-[#090B10] border border-white/10 flex flex-col justify-between ${
                  heights[idx % heights.length]
                }"><span class="text-xs font-mono text-indigo-300">#${idx + 1}</span><span class="text-sm font-semibold text-white">${escapeHtml(
                  tile
                )}</span></div>`
            )
            .join('');
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-4 ${radiusClass} border border-white/10 bg-white/5">
      <div class="${b.gridColumns === 3 ? 'columns-1 sm:columns-3' : 'columns-1 sm:columns-2'} gap-3 space-y-3">${tiles}</div>
    </div>
  </section>`;
        }

        case 'ui-flippable-card':
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div onclick="var inner=this.querySelector('.sl-flip-inner');inner.dataset.flipped=inner.dataset.flipped==='1'?'0':'1';inner.style.transform=inner.dataset.flipped==='1'?'rotateY(180deg)':'rotateY(0deg)';" style="perspective:1000px;" class="cursor-pointer">
      <div class="sl-flip-inner relative min-h-[150px]" style="transform-style:preserve-3d;transition:transform 0.5s ease;">
        <div style="${surfaceFxCss}backface-visibility:hidden;" class="absolute inset-0 p-6 ${radiusClass} border border-white/15 bg-[#121726] flex flex-col justify-between">
          <div class="flex justify-between text-xs"><span class="font-mono text-sky-400">FRONT SIDE</span><span class="px-2 py-0.5 rounded-full bg-white/10 text-slate-300">${escapeHtml(
            b.badgeText || 'Click to Flip'
          )}</span></div>
          <div><h3 class="text-lg font-bold text-white">${content}</h3>${
            subtitle ? `<p class="text-sm text-slate-400 mt-1">${subtitle}</p>` : ''
          }</div>
        </div>
        <div style="backface-visibility:hidden;transform:rotateY(180deg);" class="absolute inset-0 p-6 ${radiusClass} border border-indigo-400/35 bg-indigo-950/90 flex flex-col justify-between">
          <div class="flex justify-between text-xs"><span class="font-mono text-indigo-300">BACK SIDE</span><span class="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200">Flip Back</span></div>
          <div><h3 class="text-lg font-bold text-white">${escapeHtml(
            b.backTitle || 'Back Side · Revealed Answer'
          )}</h3><p class="text-sm text-slate-300 mt-1">${escapeHtml(
            b.backSubtitle || 'Tap again to flip back to the front side.'
          )}</p></div>
        </div>
      </div>
    </div>
  </section>`;

        case 'ui-swipeable-stack': {
          const cards = parsedOptions.length ? parsedOptions : ['Card 1 · Design', 'Card 2 · Prototype', 'Card 3 · Launch'];
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-white/10 bg-white/5 space-y-3" data-sl-swipe-cards='${escapeHtml(
            JSON.stringify(cards)
          )}' data-sl-swipe-idx="0">
      <div class="flex justify-between text-xs font-mono text-sky-300"><span>SwipeableStack</span><span class="sl-sw-count">0 / ${
            cards.length
          } swiped</span></div>
      <div class="sl-sw-card p-6 rounded-2xl bg-gradient-to-br from-[#1b2234] to-[#0c1018] border border-white/15 min-h-[120px] flex flex-col justify-between">
        <span class="sl-sw-num text-xs font-mono text-sky-400">Card #1</span>
        <div class="sl-sw-title text-base font-bold text-white">${escapeHtml(cards[0] || '')}</div>
      </div>
      <div class="flex justify-center gap-2">
        <button type="button" onclick="slSwipeStackNext(this)" class="px-3.5 py-1.5 rounded-lg bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-semibold cursor-pointer">&larr; Swipe Left</button>
        <button type="button" onclick="slSwipeStackNext(this)" class="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold cursor-pointer">Swipe Right &rarr;</button>
        <button type="button" onclick="slSwipeStackReset(this)" class="px-3 py-1.5 rounded-lg bg-white/10 text-slate-200 text-xs font-semibold cursor-pointer">Reset</button>
      </div>
    </div>
  </section>`;
        }

        case 'ui-datatable': {
          const headers = (b.columnsHeader || 'Name | Role | Status')
            .split('|')
            .map((h) => h.trim())
            .filter(Boolean);
          const rows = (
            parsedOptions.length ? parsedOptions : ['Deepal P. | Architect | Active', 'Maya Lin | UI Lead | Active']
          ).map((r) => r.split('|').map((c) => c.trim()));
          const thHtml = headers.map((h) => `<th class="py-2.5 px-3 text-left font-semibold">${escapeHtml(h)}</th>`).join('');
          const trHtml = rows
            .map(
              (cells) =>
                `<tr class="border-t border-white/10">${headers
                  .map((_, i) => `<td class="py-2.5 px-3 text-slate-200">${escapeHtml(cells[i] || '—')}</td>`)
                  .join('')}</tr>`
            )
            .join('');
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-4 ${radiusClass} border border-white/10 bg-white/5 overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead><tr class="text-sky-300 border-b border-white/15">${thHtml}</tr></thead>
        <tbody>${trHtml}</tbody>
      </table>
    </div>
  </section>`;
        }

        case 'ui-flex': {
          const isCol = b.direction === 'column' || b.direction === 'vertical';
          const ratios = (b.flexRatios || '1:2:1').split(/[:,\s]+/).map((n) => Math.max(1, Number(n) || 1));
          const inner =
            b.children && b.children.length > 0
              ? b.children.map((c, i) => renderChildHtml(c, `flex:${ratios[i] ?? 1} 1 0%;`)).join('')
              : (parsedOptions.length ? parsedOptions : ['Pane 1 (1x)', 'Pane 2 (2x)', 'Pane 3 (1x)'])
                  .map(
                    (item, i) =>
                      `<div style="flex:${ratios[i] ?? 1} 1 0%;${textFxCss}" class="min-w-0 p-4 rounded-xl bg-[#090B10] border border-white/10 text-sm font-semibold text-center">${escapeHtml(
                        item
                      )}</div>`
                  )
                  .join('');
          return `  <section id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-white/10 bg-white/5 flex ${
            isCol ? 'flex-col' : 'flex-row'
          } gap-3">${inner}</div>
  </section>`;
        }

        case 'ui-modal':
          return `  <div id="${elId}" style="${layoutStyle}font-family: ${fontFam};" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-indigo-400/30 bg-indigo-950/35 flex items-center justify-between gap-4">
      <div>
        <div style="${textFxCss}" class="text-base font-bold">${content}</div>
        ${subtitle ? `<p style="color:${subColor};" class="text-xs mt-0.5">${subtitle}</p>` : ''}
      </div>
      <button type="button" onclick="document.getElementById('${escapeHtml(b.id)}-modal').classList.remove('hidden')" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer">${escapeHtml(
            b.badgeText || 'Open Dialog'
          )}</button>
    </div>
    <div id="${escapeHtml(b.id)}-modal" data-sl-modal="${escapeHtml(b.id)}" onclick="if(event.target===this)this.classList.add('hidden')" class="${
            b.isExpanded ? '' : 'hidden '
          }fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div class="bg-[#111827] border border-white/15 rounded-2xl max-w-md w-full p-6 space-y-3 shadow-2xl">
        <h3 class="text-lg font-bold text-white">${content}</h3>
        <p class="text-sm text-slate-300 leading-relaxed">${subtitle || 'Interactive modal content dialog.'}</p>
        <div class="flex justify-end pt-2">
          <button type="button" onclick="document.getElementById('${escapeHtml(b.id)}-modal').classList.add('hidden')" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer">Close</button>
        </div>
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
      <h1 data-sl-text-target="${escapeHtml(b.id)}" style="${textFxCss} font-weight: ${getCssFontWeight(
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
      <p data-sl-text-target="${escapeHtml(b.id)}" style="${
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
    <span data-sl-text-target="${escapeHtml(b.id)}" style="${
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
      <div data-sl-text-target="${escapeHtml(b.id)}" style="${textFxCss} font-weight: ${getCssFontWeight(
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
          };" class="p-6 ${radiusClass} border border-white/10 space-y-3 ${alignClass}">
      ${
        b.imageUrl
          ? `<img src="${escapeHtml(b.imageUrl)}" alt="${content}" class="w-full max-h-56 object-cover rounded-xl" />`
          : ''
      }
      <h3 data-sl-text-target="${escapeHtml(b.id)}" style="${textFxCss} font-weight: ${fontWt};" class="${getHtmlTextSizeClass(
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
        <h3 data-sl-text-target="${escapeHtml(b.id)}" style="${textFxCss} font-weight: ${fontWt};" class="${getHtmlTextSizeClass(
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
      <p data-sl-text-target="${escapeHtml(b.id)}" style="${
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
    <details id="${escapeHtml(b.id)}-details" ${b.isExpanded ? 'open' : ''} style="font-family: ${fontFam}; background: ${
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
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-white/10 bg-white/5 space-y-2">
      ${subtitle ? `<label style="color:${subColor};" class="block text-xs font-semibold">${subtitle}</label>` : ''}
      <select data-sl-input-id="${escapeHtml(b.id)}" data-sl-input-label="${escapeHtml(
            b.subtitle || b.name
          )}" class="w-full rounded-lg bg-[#0B0F17] border border-white/15 px-3.5 py-2.5 text-sm text-white outline-none">
        ${optsHtml}
      </select>
    </div>
  </section>`;
        }

        case 'ui-checkbox': {
          if (b.controlVariant === 'radio') {
            const choices = parsedOptions.length ? parsedOptions : ['Choice A', 'Choice B'];
            const radiosHtml = choices
              .map(
                (choice, idx) =>
                  `<label class="flex items-center gap-2.5 text-sm text-slate-200 cursor-pointer"><input type="radio" name="sl-radio-${escapeHtml(
                    b.id
                  )}" value="${escapeHtml(choice)}" data-sl-input-id="${escapeHtml(
                    b.id
                  )}" data-sl-input-label="${escapeHtml(b.subtitle || b.name)}" ${
                    idx === 0 ? 'checked' : ''
                  } class="w-4 h-4 accent-indigo-500" /><span>${escapeHtml(choice)}</span></label>`
              )
              .join('\n        ');
            return `  <section id="${elId}" style="${layoutStyle}" class="max-w-3xl mx-auto px-6 py-3${customCls}">
    <div style="${surfaceFxCss}" class="p-4 ${radiusClass} border border-white/10 bg-white/5 space-y-2">
      ${subtitle ? `<div style="color:${subColor};" class="text-xs font-semibold">${subtitle}</div>` : ''}
      <div class="space-y-2">
        ${radiosHtml}
      </div>
    </div>
  </section>`;
          }
          if (b.controlVariant === 'switch') {
            return `  <section id="${elId}" style="${layoutStyle}" class="max-w-3xl mx-auto px-6 py-3${customCls}">
    <label style="${surfaceFxCss}" class="p-4 ${radiusClass} border border-white/10 bg-white/5 flex items-center justify-between gap-3 cursor-pointer">
      <div>
        <div style="${textFxCss}" class="text-sm font-semibold">${content}</div>
        ${subtitle ? `<div style="color:${subColor};" class="text-xs">${subtitle}</div>` : ''}
      </div>
      <input type="checkbox" data-sl-input-id="${escapeHtml(b.id)}" data-sl-input-label="${escapeHtml(
              b.subtitle || b.name
            )}" ${b.isExpanded ? 'checked' : ''} class="w-5 h-5 accent-indigo-500 cursor-pointer" />
    </label>
  </section>`;
          }
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-3xl mx-auto px-6 py-3${customCls}">
    <label style="${surfaceFxCss}" class="p-4 ${radiusClass} border border-white/10 bg-white/5 flex items-center gap-3 cursor-pointer">
      <input type="checkbox" data-sl-input-id="${escapeHtml(b.id)}" data-sl-input-label="${escapeHtml(
            b.subtitle || b.name
          )}" ${b.isExpanded ? 'checked' : ''} class="w-4 h-4 accent-indigo-500" />
      <span style="${textFxCss}" class="text-sm">${content}</span>
    </label>
  </section>`;
        }

        case 'ui-file-upload':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-3xl mx-auto px-6 py-3${customCls}">
    <div style="${surfaceFxCss}" class="p-6 ${radiusClass} border border-dashed border-white/25 bg-white/5 text-center space-y-2">
      ${subtitle ? `<div style="color:${subColor};" class="text-xs font-semibold">${subtitle}</div>` : ''}
      <label class="block cursor-pointer space-y-1">
        <div style="${textFxCss}" class="text-sm font-semibold">${content}</div>
        <div class="text-xs text-slate-400">Click to choose file or image</div>
        <input type="file" data-sl-input-id="${escapeHtml(b.id)}" data-sl-input-label="${escapeHtml(
            b.subtitle || b.name
          )}" data-sl-upload-preview="sl-upload-preview-${escapeHtml(b.id)}" class="hidden sl-file-input" />
      </label>
      <div id="sl-upload-preview-${escapeHtml(b.id)}" class="hidden p-2 rounded-lg bg-[#090B10] border border-white/10 text-xs text-emerald-300 font-mono"></div>
    </div>
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
        <div data-sl-text-target="${escapeHtml(b.id)}" style="color: ${primaryColor}; font-weight: ${fontWt};" class="${getHtmlTextSizeClass(
            b.style?.fontSize,
            'text-lg'
          )}">${content}</div>
        ${subtitle ? `<p style="color: ${subColor};" class="text-sm">${subtitle}</p>` : ''}
      </figcaption>
    </figure>
  </section>`;

        case 'ui-icon':
          return `  <div id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4 ${alignClass}${customCls}">
    <div style="${surfaceFxCss}" class="inline-flex flex-col items-center p-5 ${radiusClass} border border-white/10 bg-white/5 gap-2">
      <span style="color: ${primaryColor};" class="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">${getVectorIconSvgHtml(
        b.iconName,
        24
      )}</span>
      <span style="${textFxCss}" class="text-sm font-bold">${content}</span>
      ${subtitle ? `<span style="color:${subColor};" class="text-xs">${subtitle}</span>` : ''}
    </div>
  </div>`;

        case 'ui-video': {
          const parsedVid = parseVideoUrl(b.videoUrl);
          const videoInner =
            parsedVid.kind === 'youtube' || parsedVid.kind === 'vimeo'
              ? `<div class="w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10"><iframe src="${escapeHtml(
                  parsedVid.embedUrl
                )}" title="${content}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="w-full h-full border-0"></iframe></div>`
              : parsedVid.kind === 'direct'
              ? `<video controls playsinline src="${escapeHtml(
                  parsedVid.embedUrl
                )}" class="w-full rounded-xl bg-black"></video>`
              : `<div class="h-44 rounded-xl bg-black/60 flex items-center justify-center text-sky-400 text-sm">Paste a YouTube or MP4 video URL</div>`;
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-white/10 bg-white/5 space-y-3">
      ${videoInner}
      <div style="${textFxCss}" class="text-base font-bold">${content}</div>
      ${subtitle ? `<p style="color:${subColor};" class="text-xs">${subtitle}</p>` : ''}
    </div>
  </section>`;
        }

        case 'ui-avatar':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <div style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(255, 255, 255, 0.04)'
          };" class="p-5 ${radiusClass} border border-white/10 flex items-center gap-4">
      ${
        b.imageUrl
          ? `<img src="${escapeHtml(
              b.imageUrl
            )}" alt="${content}" class="w-12 h-12 rounded-full object-cover border border-sky-400/50 shrink-0" />`
          : `<div class="w-12 h-12 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 font-bold text-sm shrink-0">${escapeHtml(
              content.slice(0, 2).toUpperCase()
            )}</div>`
      }
      <div>
        <div data-sl-text-target="${escapeHtml(b.id)}" style="color: ${primaryColor}; font-weight: ${fontWt};" class="${getHtmlTextSizeClass(
            b.style?.fontSize,
            'text-base'
          )}">${content}</div>
        ${subtitle ? `<div style="color: ${subColor};" class="text-xs mt-0.5">${subtitle}</div>` : ''}
      </div>
    </div>
  </section>`;

        case 'logic-counter':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div id="${escapeHtml(b.id)}" style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(30, 27, 75, 0.4)'
          };" class="p-6 ${radiusClass} border border-indigo-500/30 flex items-center justify-between gap-4">
      <div>
        <div style="color: ${subColor};" class="text-xs font-semibold font-mono">${content}</div>
        <div id="${escapeHtml(b.id)}-val" data-sl-counter-val="${escapeHtml(
            b.id
          )}" style="color: ${primaryColor};" class="text-3xl font-extrabold font-mono mt-1">${
            b.counterValue ?? 0
          }</div>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" onclick="slIncrementCounter('${escapeHtml(
          b.id
        )}')" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold cursor-pointer">+1</button>
        <button type="button" onclick="slResetCounter('${escapeHtml(
          b.id
        )}')" class="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold cursor-pointer">Reset</button>
      </div>
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

        case 'logic-timer':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-amber-500/30 bg-amber-950/20 flex items-center justify-between gap-4">
      <div>
        <div style="${textFxCss}" class="text-sm font-bold">${content}</div>
        <div id="sl-timer-val-${escapeHtml(b.id)}" data-sl-timer-default="${
            b.logicConfig?.timerSeconds ?? b.counterValue ?? 10
          }" class="text-xs font-mono text-amber-300 mt-1">${
            b.counterValue ?? b.logicConfig?.timerSeconds ?? 10
          }s · PAUSED</div>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" onclick="slToggleTimer(${escapeHtml(JSON.stringify(b.id))}, ${escapeHtml(
            JSON.stringify(b.actionPayload || 'Timer completed!')
          )})" id="sl-timer-btn-${escapeHtml(
            b.id
          )}" class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer">Start</button>
        <button type="button" onclick="slResetTimer(${escapeHtml(
          JSON.stringify(b.id)
        )})" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer">Reset</button>
      </div>
    </div>
  </section>`;

        case 'logic-if': {
          const cfg = b.logicConfig || {};
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-amber-500/30 bg-amber-950/20 flex items-center justify-between gap-4">
      <div>
        <div class="text-xs font-mono text-amber-300">IF [${escapeHtml(
          cfg.leftOperand || 'score'
        )} ${escapeHtml(cfg.operator || '>=')} ${escapeHtml(cfg.rightOperand || '10')}]</div>
        <div id="sl-if-msg-${escapeHtml(b.id)}" class="text-sm text-white font-semibold mt-1">${content}</div>
      </div>
      <button type="button" onclick="slEvalIf(${escapeHtml(JSON.stringify(b.id))}, ${escapeHtml(
            JSON.stringify(cfg.leftOperand || 'score')
          )}, ${escapeHtml(JSON.stringify(cfg.operator || '>='))}, ${escapeHtml(
            JSON.stringify(cfg.rightOperand || '10')
          )}, ${escapeHtml(JSON.stringify(cfg.thenMessage || 'Condition TRUE!'))}, ${escapeHtml(
            JSON.stringify(cfg.elseMessage || 'Condition FALSE.')
          )})" class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer">${escapeHtml(
            b.badgeText || 'Eval'
          )}</button>
    </div>
  </section>`;
        }

        case 'logic-loop': {
          const cfg = b.logicConfig || {};
          const count = Math.min(50, Math.max(1, cfg.repeatCount ?? 5));
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-amber-500/30 bg-amber-950/20 flex items-center justify-between gap-4">
      <div>
        <div class="text-xs font-mono text-amber-300">${escapeHtml(
          (cfg.loopMode || 'repeat').toUpperCase()
        )} · ${count}x</div>
        <div class="text-sm font-semibold text-white">${content}</div>
      </div>
      <button type="button" onclick="slRunLoop(${count})" class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer">Run Loop</button>
    </div>
  </section>`;
        }

        case 'logic-variable': {
          const cfg = b.logicConfig || {};
          const vName = cfg.varName || 'score';
          const vOp = cfg.varOp || 'set';
          const vVal = cfg.varValue ?? '10';
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-amber-500/30 bg-amber-950/20 flex items-center justify-between gap-4">
      <div>
        <div class="text-xs font-mono text-amber-300">VAR ${escapeHtml(vName)} (${escapeHtml(vOp)})</div>
        <div id="sl-var-display-${escapeHtml(b.id)}" class="text-sm font-mono font-bold text-white mt-0.5">${escapeHtml(
            vName
          )} = ${escapeHtml(vVal)}</div>
      </div>
      <button type="button" onclick="slApplyVar(${escapeHtml(JSON.stringify(b.id))}, ${escapeHtml(
            JSON.stringify(vName)
          )}, ${escapeHtml(JSON.stringify(vOp))}, ${escapeHtml(
            JSON.stringify(vVal)
          )})" class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer">Apply</button>
    </div>
  </section>`;
        }

        case 'logic-list': {
          const cfg = b.logicConfig || {};
          const lName = cfg.listName || 'tasks';
          const lOp = cfg.listOp || 'add';
          const lVal = cfg.varValue || 'New Item';
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-amber-500/30 bg-amber-950/20 flex items-center justify-between gap-4">
      <div>
        <div class="text-xs font-mono text-amber-300">LIST [${escapeHtml(lName)}] (${escapeHtml(lOp)})</div>
        <div id="sl-list-display-${escapeHtml(b.id)}" class="text-xs font-mono text-slate-200 mt-1">${content}</div>
      </div>
      <button type="button" onclick="slRunList(${escapeHtml(JSON.stringify(b.id))}, ${escapeHtml(
            JSON.stringify(lName)
          )}, ${escapeHtml(JSON.stringify(lOp))}, ${escapeHtml(
            JSON.stringify(lVal)
          )})" class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer">Run (${escapeHtml(
            lOp
          )})</button>
    </div>
  </section>`;
        }

        case 'logic-object': {
          const cfg = b.logicConfig || {};
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-amber-500/30 bg-amber-950/20 flex items-center justify-between gap-4">
      <div>
        <div class="text-xs font-mono text-amber-300">JSON Object (${escapeHtml(
          cfg.objectKey || 'name'
        )})</div>
        <div class="text-xs font-mono text-slate-300 mt-0.5">${escapeHtml(
          cfg.varValue || subtitle || '{}'
        )}</div>
      </div>
      <button type="button" onclick="slParseObject(${escapeHtml(
        JSON.stringify(cfg.varValue || '{"name":"BlockCraft Studio"}')
      )}, ${escapeHtml(
            JSON.stringify(cfg.objectKey || 'name')
          )})" class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer">Parse</button>
    </div>
  </section>`;
        }

        case 'logic-math-text': {
          const cfg = b.logicConfig || {};
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-amber-500/30 bg-amber-950/20 flex items-center justify-between gap-4">
      <div>
        <div class="text-xs font-mono text-amber-300">${escapeHtml(
          (cfg.mathTextOp || 'random').toUpperCase()
        )}(${escapeHtml(cfg.argA || '1')}, ${escapeHtml(cfg.argB || '100')})</div>
        <div id="sl-math-res-${escapeHtml(b.id)}" class="text-sm font-mono font-bold text-white mt-0.5">${content}</div>
      </div>
      <button type="button" onclick="slEvalMathText(${escapeHtml(JSON.stringify(b.id))}, ${escapeHtml(
            JSON.stringify(cfg.mathTextOp || 'random')
          )}, ${escapeHtml(JSON.stringify(cfg.argA || '1'))}, ${escapeHtml(
            JSON.stringify(cfg.argB || '100')
          )})" class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer">Compute</button>
    </div>
  </section>`;
        }

        case 'logic-feedback':
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
      <button type="button" data-block-id="${escapeHtml(b.id)}" data-hat-type="${escapeHtml(
            b.type
          )}" data-trigger-source="${escapeHtml(
            b.logicConfig?.triggerSourceId || ''
          )}" data-trigger-key="${escapeHtml(b.triggerKey || 'Enter')}" data-target="${escapeHtml(
            b.targetId || ''
          )}" data-target-page="${targetHref}" data-action="${escapeHtml(
            b.action || (b.type === 'logic-feedback' ? 'alert' : '')
          )}" data-payload="${escapeHtml(b.actionPayload || '')}" data-endpoint="${escapeHtml(
            b.apiEndpoint || ''
          )}" data-style-prop="${escapeHtml(
            b.logicConfig?.styleProp || 'backgroundColor'
          )}" data-style-val="${escapeHtml(
            b.logicConfig?.styleValue || '#312e81'
          )}" data-css-class="${escapeHtml(
            b.logicConfig?.cssClass || 'ring-2 ring-emerald-400'
          )}" data-validation-rule="${escapeHtml(
            b.logicConfig?.validationRule || 'not-empty'
          )}" data-var-name="${escapeHtml(
            b.logicConfig?.varName || ''
          )}" data-var-value="${escapeHtml(
            b.logicConfig?.varValue || b.actionPayload || '1'
          )}" data-list-name="${escapeHtml(
            b.logicConfig?.listName || 'tasks'
          )}" data-storage-key="${escapeHtml(
            b.logicConfig?.storageKey || 'sl_user_data'
          )}" class="sl-action-btn px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer">${escapeHtml(
            b.badgeText || (b.type === 'logic-feedback' ? 'Trigger' : 'Fire')
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
          )}" data-method="${escapeHtml(b.httpMethod || 'GET')}" data-body="${escapeHtml(
            b.requestBody || ''
          )}" data-style-prop="${escapeHtml(
            b.logicConfig?.styleProp || 'backgroundColor'
          )}" data-style-val="${escapeHtml(
            b.logicConfig?.styleValue || '#312e81'
          )}" data-css-class="${escapeHtml(
            b.logicConfig?.cssClass || 'ring-2 ring-emerald-400'
          )}" data-validation-rule="${escapeHtml(
            b.logicConfig?.validationRule || 'not-empty'
          )}" data-var-name="${escapeHtml(
            b.logicConfig?.varName || 'score'
          )}" data-var-value="${escapeHtml(
            b.logicConfig?.varValue || b.actionPayload || '1'
          )}" data-list-name="${escapeHtml(
            b.logicConfig?.listName || 'tasks'
          )}" data-storage-key="${escapeHtml(
            b.logicConfig?.storageKey || 'sl_user_data'
          )}" style="font-family: ${fontFam}; background: ${
            bgVal || resolvedAccent
          }; font-weight: ${fontWt};" class="sl-action-btn px-7 py-3 ${radiusClass} text-sm shadow-lg hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-45">
      <span data-sl-text-target="${escapeHtml(b.id)}" style="${textFxCss}">${content}</span>
    </button>
  </div>`;
        }

        case 'backend-storage': {
          const cfg = b.logicConfig || {};
          const sKey = cfg.storageKey || 'sl_user_data';
          const sVal = cfg.varValue || 'Saved from BlockCraft Studio!';
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(6, 78, 59, 0.3)'
          };" class="p-5 ${radiusClass} border border-emerald-500/30 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <div class="text-xs font-mono text-emerald-300 font-bold">LocalStorage Manager</div>
        <span id="sl-storage-res-${escapeHtml(b.id)}" class="text-xs font-mono text-emerald-200"></span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input id="sl-storage-key-${escapeHtml(b.id)}" type="text" value="${escapeHtml(sKey)}" placeholder="Storage key..." class="px-3 py-2 rounded-lg bg-[#05070B] border border-emerald-500/25 text-xs font-mono text-emerald-200 outline-none" />
        <input id="sl-storage-val-${escapeHtml(b.id)}" type="text" value="${escapeHtml(sVal)}" placeholder="Value to store..." class="px-3 py-2 rounded-lg bg-[#05070B] border border-emerald-500/25 text-xs text-white outline-none" />
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" onclick="slRunStorage(document.getElementById('sl-storage-key-${escapeHtml(b.id)}').value,'save',document.getElementById('sl-storage-val-${escapeHtml(b.id)}').value,${escapeHtml(JSON.stringify(b.id))})" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer">Save</button>
        <button type="button" onclick="slRunStorage(document.getElementById('sl-storage-key-${escapeHtml(b.id)}').value,'load','',${escapeHtml(JSON.stringify(b.id))})" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer">Load</button>
        <button type="button" onclick="slRunStorage(document.getElementById('sl-storage-key-${escapeHtml(b.id)}').value,'remove','',${escapeHtml(JSON.stringify(b.id))})" class="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 text-xs font-semibold cursor-pointer">Remove</button>
      </div>
    </div>
  </section>`;
        }

        case 'backend-db': {
          const cfg = b.logicConfig || {};
          const col = cfg.collectionName || 'users';
          const defJson = cfg.varValue || '{"name":"Creator","role":"Admin"}';
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(6, 78, 59, 0.3)'
          };" class="p-5 ${radiusClass} border border-emerald-500/30 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="text-xs font-mono text-emerald-300 font-bold">Cloud DB Collection [${escapeHtml(col)}]</div>
        <div class="flex gap-1.5">
          <button type="button" onclick="slRunDb(${escapeHtml(JSON.stringify(b.id))},${escapeHtml(JSON.stringify(col))},'save',document.getElementById('sl-db-input-${escapeHtml(b.id)}').value)" class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer">+ Save</button>
          <button type="button" onclick="slRunDb(${escapeHtml(JSON.stringify(b.id))},${escapeHtml(JSON.stringify(col))},'get','')" class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer">Get</button>
          <button type="button" onclick="slRunDb(${escapeHtml(JSON.stringify(b.id))},${escapeHtml(JSON.stringify(col))},'delete','')" class="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 text-xs font-semibold cursor-pointer">Delete</button>
        </div>
      </div>
      <input id="sl-db-input-${escapeHtml(b.id)}" type="text" value="${escapeHtml(defJson)}" class="w-full px-3 py-2 rounded-lg bg-[#05070B] border border-emerald-500/25 text-xs font-mono text-emerald-100 outline-none" />
      <div id="sl-db-res-${escapeHtml(b.id)}" class="space-y-1 text-xs font-mono text-emerald-100">Ready — click + Save to insert record.</div>
    </div>
  </section>`;
        }

        case 'backend-auth': {
          const cfg = b.logicConfig || {};
          const defEmail = cfg.varValue || 'creator@blockcraft.app';
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(6, 78, 59, 0.3)'
          };" class="p-5 ${radiusClass} border border-emerald-500/30 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <div class="text-xs font-mono text-emerald-300 font-bold">AUTHENTICATION FLOW</div>
        <div id="sl-auth-status-${escapeHtml(b.id)}" class="text-xs font-mono text-white">Signed Out</div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input id="sl-auth-email-${escapeHtml(b.id)}" type="email" value="${escapeHtml(defEmail)}" placeholder="Email..." class="px-3 py-2 rounded-lg bg-[#05070B] border border-emerald-500/25 text-xs text-white outline-none" />
        <input id="sl-auth-pass-${escapeHtml(b.id)}" type="password" value="secret123" placeholder="Password..." class="px-3 py-2 rounded-lg bg-[#05070B] border border-emerald-500/25 text-xs text-white outline-none" />
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" onclick="slRunAuth(${escapeHtml(JSON.stringify(b.id))},'signup',document.getElementById('sl-auth-email-${escapeHtml(b.id)}').value)" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer">Sign Up</button>
        <button type="button" onclick="slRunAuth(${escapeHtml(JSON.stringify(b.id))},'login',document.getElementById('sl-auth-email-${escapeHtml(b.id)}').value)" class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer">Login</button>
        <button type="button" onclick="slRunAuth(${escapeHtml(JSON.stringify(b.id))},'logout','')" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold cursor-pointer">Logout</button>
      </div>
    </div>
  </section>`;
        }

        case 'backend-device': {
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(6, 78, 59, 0.3)'
          };" class="p-5 ${radiusClass} border border-emerald-500/30 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="text-xs font-mono text-emerald-300 font-bold uppercase">Device &amp; Browser APIs</div>
        <div class="flex flex-wrap gap-1.5">
          <button type="button" onclick="slRunDevice('gps',${escapeHtml(JSON.stringify(b.id))})" class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer">GPS Location</button>
          <button type="button" onclick="slRunDevice('camera',${escapeHtml(JSON.stringify(b.id))})" class="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer">Camera</button>
          <button type="button" onclick="slRunDevice('vibrate',${escapeHtml(JSON.stringify(b.id))})" class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer">Vibrate</button>
        </div>
      </div>
      <video id="sl-dev-cam-${escapeHtml(b.id)}" autoplay muted playsinline class="hidden w-full max-h-48 rounded-lg bg-black object-cover"></video>
      <div id="sl-dev-res-${escapeHtml(b.id)}" class="hidden p-2 rounded bg-[#05070B] border border-emerald-500/20 text-xs font-mono text-emerald-300"></div>
    </div>
  </section>`;
        }

        case 'backend-flask':
        case 'backend-fetch':
        case 'backend-blockly':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="font-family: ${fontFam}; background: ${
            bgVal || 'rgba(6, 78, 59, 0.3)'
          };" class="p-5 ${radiusClass} border border-emerald-500/30 space-y-2">
      <div class="flex items-center justify-between gap-3">
        <div>
          <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold mr-2">${escapeHtml(
            b.httpMethod || 'GET'
          )}</span>
          <span style="color: ${getCssColor(
            b.style?.textColor,
            b.style?.customTextHex,
            '#34d399'
          )};" class="text-sm font-mono font-bold">${escapeHtml(b.apiEndpoint || content)}</span>
          ${subtitle ? `<p style="color: ${subColor};" class="text-xs mt-1">${subtitle}</p>` : ''}
        </div>
        <button type="button" onclick="slRunFetch(${escapeHtml(JSON.stringify(b.id))}, ${escapeHtml(
            JSON.stringify(b.apiEndpoint || '/api/v1/metrics')
          )}, ${escapeHtml(JSON.stringify(b.httpMethod || 'GET'))}, ${escapeHtml(
            JSON.stringify(b.requestBody || '')
          )})" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer">Test</button>
      </div>
      <div id="sl-fetch-res-${escapeHtml(b.id)}" class="hidden p-2 rounded bg-[#05070B] border border-emerald-500/20 text-xs font-mono text-emerald-300 break-all"></div>
    </div>
  </section>`;

        case 'ui-richtext':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-white/10 bg-white/5 text-sm leading-relaxed">${content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>')}</div>
  </section>`;

        case 'ui-icon-button':
          return `  <div id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3 ${alignClass}${customCls}">
    <button type="button" onclick="slShowToast(${escapeHtml(JSON.stringify(b.actionPayload || content))})" style="background:${resolvedAccent};" class="w-11 h-11 rounded-full text-white inline-flex items-center justify-center shadow-lg cursor-pointer">${getVectorIconSvgHtml(
            b.iconName || 'plus',
            20
          )}</button>
  </div>`;

        case 'ui-list-tile':
        case 'ui-slidable-tile':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-2${customCls}">
    <div style="${surfaceFxCss}" class="p-4 ${radiusClass} border border-white/10 bg-white/5 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center">${getVectorIconSvgHtml(
            b.iconName || 'settings',
            18
          )}</div>
        <div>
          <div style="${textFxCss}" class="text-sm font-bold">${content}</div>
          ${subtitle ? `<div style="color:${subColor};" class="text-xs">${subtitle}</div>` : ''}
        </div>
      </div>
      ${b.badgeText ? `<span style="background:${resolvedAccent};" class="px-2 py-0.5 rounded-full text-[10px] font-bold text-white">${escapeHtml(b.badgeText)}</span>` : ''}
    </div>
  </section>`;

        case 'ui-calendar':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-md mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-white/10 bg-white/5 space-y-3">
      <div class="text-sm font-bold">${content}</div>
      <div class="grid grid-cols-7 gap-1 text-center text-xs">${Array.from(
        { length: 28 },
        (_, i) =>
          `<div class="py-1.5 rounded ${
            i === 11 ? 'bg-indigo-600 text-white font-bold' : 'bg-white/5 text-slate-300'
          }">${i + 1}</div>`
      ).join('')}</div>
    </div>
  </section>`;

        case 'ui-toggle-icon':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <div style="${surfaceFxCss}" class="p-4 ${radiusClass} border border-white/10 bg-white/5 flex items-center justify-between">
      <span style="${textFxCss}" class="text-sm font-bold">${content}</span>
      <button type="button" onclick="this.classList.toggle('text-rose-400')" class="px-3 py-1.5 rounded-full bg-white/10 text-slate-200 inline-flex items-center gap-1.5 cursor-pointer">${getVectorIconSvgHtml(
            b.iconName || 'heart',
            16
          )} <span>${b.counterValue ?? 0}</span></button>
    </div>
  </section>`;

        case 'ui-audio-player':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-white/10 bg-white/5 space-y-2">
      <div style="${textFxCss}" class="text-sm font-bold">${content}</div>
      <audio controls ${b.videoUrl ? `src="${escapeHtml(b.videoUrl)}"` : ''} class="w-full"></audio>
    </div>
  </section>`;

        case 'ui-webview': {
          const rawWeb = b.actionPayload || b.content || 'https://example.com';
          const webSrc = /^https?:\/\//i.test(rawWeb) ? rawWeb : `https://${rawWeb}`;
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div class="rounded-2xl overflow-hidden border border-white/15 bg-black">
      <iframe src="${escapeHtml(webSrc)}" title="${content}" class="w-full h-64 border-0 bg-white"></iframe>
    </div>
  </section>`;
        }

        case 'ui-static-map':
        case 'ui-google-map':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div class="p-6 rounded-2xl border border-white/15 bg-[#101C2E] text-center space-y-2">
      <div class="text-sm font-bold text-white">${content}</div>
      ${subtitle ? `<p class="text-xs text-sky-300 font-mono">${subtitle}</p>` : ''}
    </div>
  </section>`;

        case 'ui-ad-banner':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <div class="p-4 rounded-xl border border-amber-400/30 bg-amber-500/10 flex items-center justify-between gap-3">
      <span class="px-2 py-0.5 rounded bg-amber-400 text-black text-[10px] font-extrabold">${escapeHtml(b.badgeText || 'AD')}</span>
      <span class="text-sm font-bold flex-1">${content}</span>
      <button type="button" onclick="slShowToast(${escapeHtml(JSON.stringify(content))})" style="background:${resolvedAccent};" class="px-3 py-1.5 rounded-lg text-white text-xs font-bold cursor-pointer">${escapeHtml(b.actionPayload || 'Open')}</button>
    </div>
  </section>`;

        case 'ui-lottie':
        case 'ui-rive':
        case 'ui-shader-wrap':
        case 'ui-shader-fill':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="background:linear-gradient(135deg,rgba(56,189,248,0.22),rgba(168,85,247,0.25));" class="p-6 ${radiusClass} border border-white/15 space-y-1">
      <div style="${textFxCss}" class="text-base font-bold">${content}</div>
      ${subtitle ? `<p style="color:${subColor};" class="text-xs">${subtitle}</p>` : ''}
    </div>
  </section>`;

        case 'ui-blur':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="backdrop-filter:blur(${b.blurAmount ?? 12}px); -webkit-backdrop-filter:blur(${b.blurAmount ?? 12}px);" class="p-6 ${radiusClass} border border-white/20 bg-slate-900/50 space-y-1">
      <div style="${textFxCss}" class="text-base font-bold">${content}</div>
      ${subtitle ? `<p style="color:${subColor};" class="text-xs">${subtitle}</p>` : ''}
    </div>
  </section>`;

        case 'ui-aspect-ratio':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="aspect-ratio:${escapeHtml(b.aspectRatio || '16/9')};" class="w-full ${radiusClass} border border-white/15 bg-white/5 overflow-hidden flex items-center justify-center p-4">
      ${b.imageUrl ? `<img src="${escapeHtml(b.imageUrl)}" alt="${content}" class="w-full h-full object-cover" />` : `<span class="text-sm font-bold">${content}</span>`}
    </div>
  </section>`;

        case 'ui-transform':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="transform:translate(${b.transformTranslateX ?? 0}px,${b.transformTranslateY ?? 0}px) rotate(${b.transformRotate ?? -4}deg) scale(${(b.transformScale ?? 100) / 100});" class="p-5 ${radiusClass} border border-indigo-400/35 bg-indigo-950/35">
      <div style="${textFxCss}" class="text-sm font-bold">${content}</div>
      ${subtitle ? `<p style="color:${subColor};" class="text-xs mt-1">${subtitle}</p>` : ''}
    </div>
  </section>`;

        case 'ui-media-display':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div class="p-4 ${radiusClass} border border-white/10 bg-white/5 space-y-2">
      ${b.imageUrl ? `<img src="${escapeHtml(b.imageUrl)}" alt="${content}" class="w-full rounded-xl object-cover max-h-72" />` : ''}
      <div style="${textFxCss}" class="text-sm font-bold">${content}</div>
    </div>
  </section>`;

        case 'ui-pdf-viewer':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div class="p-5 ${radiusClass} border border-white/15 bg-white/5 space-y-2">
      <div class="text-sm font-bold">${content}</div>
      <div class="p-4 rounded-lg bg-slate-100 text-slate-900 text-xs">${escapeHtml(b.options?.[0] || subtitle || 'Document Page 1')}</div>
    </div>
  </section>`;

        case 'ui-progress-bar': {
          const pct = Math.max(0, Math.min(100, b.progressValue ?? 75));
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <div class="p-4 ${radiusClass} border border-white/10 bg-white/5 space-y-2">
      <div class="flex justify-between text-xs font-bold"><span>${content}</span><span>${pct}%</span></div>
      <div class="w-full h-2.5 rounded-full bg-white/10 overflow-hidden"><div style="width:${pct}%;background:${resolvedAccent};" class="h-full rounded-full"></div></div>
    </div>
  </section>`;
        }

        case 'ui-language-selector':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <div class="p-4 ${radiusClass} border border-white/10 bg-white/5 flex items-center justify-between gap-3">
      <span class="text-sm font-bold">${content}</span>
      <select class="px-3 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-xs text-white">${(b.options && b.options.length ? b.options : ['English (EN)', 'සිංහල (SI)']).map((l) => `<option>${escapeHtml(l)}</option>`).join('')}</select>
    </div>
  </section>`;

        case 'ui-notification-badge':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-3${customCls}">
    <div class="p-4 ${radiusClass} border border-white/10 bg-white/5 flex items-center justify-between">
      <span class="text-sm font-bold">${content}</span>
      <span class="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold">${escapeHtml(b.badgeText || String(b.counterValue ?? 3))}</span>
    </div>
  </section>`;

        case 'ui-chart':
        case 'ui-mux-broadcast':
        case 'ui-mouse-region':
        case 'ui-barcode':
        case 'ui-tooltip':
        case 'ui-conditional-builder':
        case 'ui-sticky-header':
        case 'ui-markdown':
        case 'ui-draggable':
        case 'ui-drag-target':
        case 'ui-genui-chat':
          return `  <section id="${elId}" style="${layoutStyle}" class="max-w-5xl mx-auto px-6 py-4${customCls}">
    <div style="${surfaceFxCss}" class="p-5 ${radiusClass} border border-white/10 bg-white/5 space-y-1.5">
      <div style="${textFxCss}" class="text-sm font-bold">${content}</div>
      ${subtitle ? `<p style="color:${subColor};" class="text-xs">${subtitle}</p>` : ''}
    </div>
  </section>`;

        case 'ui-footer':
          return `  <footer id="${elId}" style="${layoutStyle}font-family: ${fontFam}; background: ${
            bgVal || (isLightPage ? 'rgba(255, 255, 255, 0.85)' : '#0b0e16')
          };" class="w-full mt-auto border-t ${
            isLightPage ? 'border-slate-200' : 'border-white/10'
          }${customCls}">
    <div class="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm">
      <span data-sl-text-target="${escapeHtml(b.id)}" style="color: ${getCssColor(
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
      <div data-sl-text-target="${escapeHtml(b.id)}" style="color: ${primaryColor}; font-weight: ${fontWt};" class="text-base">${content}</div>
      ${subtitle ? `<p style="color: ${subColor};" class="text-sm">${subtitle}</p>` : ''}
    </div>
  </section>`;
      }
    })
    .join('\n\n');

  const onLoadHats = blocks.filter((b) => b.type === 'logic-onload');
  const onClickHats = blocks.filter((b) => b.type === 'logic-click');
  const onInputHats = blocks.filter((b) => b.type === 'logic-oninput');
  const onSubmitHats = blocks.filter((b) => b.type === 'logic-onsubmit');
  const onKeyHats = blocks.filter((b) => b.type === 'logic-onkey');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(projectName)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    .hidden { display: none !important; }
    body {
      margin: 0;
      min-height: 100vh;
      background: ${pageBg};
      background-attachment: fixed;
      color: ${defaultBodyColor};
      font-family: Inter, system-ui, -apple-system, sans-serif;
    }${animBundle.css ? `\n${animBundle.css}` : ''}
  </style>
</head>
<body class="min-h-screen flex flex-col m-0 antialiased relative overflow-x-hidden">
${animBundle.html}  <div class="relative z-10 min-h-screen flex flex-col">
${renderedBlocks}
  </div>

  <div id="sl-confirm-modal" class="hidden fixed inset-0 z-[9998] bg-black/75 flex items-center justify-center p-4">
    <div style="background:#11151E;border:1px solid rgba(255,255,255,0.15);border-radius:16px;max-width:380px;width:100%;padding:20px;color:#f1f5f9;">
      <h4 id="sl-confirm-title" style="margin:0 0 8px 0;font-size:15px;font-weight:700;">Confirm Action</h4>
      <p id="sl-confirm-msg" style="margin:0 0 16px 0;font-size:13px;color:#cbd5e1;line-height:1.5;">Are you sure?</p>
      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button type="button" id="sl-confirm-cancel" style="padding:7px 14px;border-radius:8px;background:rgba(255,255,255,0.1);color:#e2e8f0;border:0;font-size:12px;font-weight:600;cursor:pointer;">Cancel</button>
        <button type="button" id="sl-confirm-ok" style="padding:7px 14px;border-radius:8px;background:#4f46e5;color:#fff;border:0;font-size:12px;font-weight:700;cursor:pointer;">Confirm</button>
      </div>
    </div>
  </div>

  <script>
    window.slRuntime = {
      vars: { score: 0, isLoggedIn: false, userName: 'Creator' },
      lists: { tasks: ['Design Layout', 'Wire Logic', 'Export App'] },
      timers: {},
      authUser: null
    };

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

    function slShowConfirm(title, message, onConfirm) {
      var modal = document.getElementById('sl-confirm-modal');
      document.getElementById('sl-confirm-title').textContent = title || 'Confirm';
      document.getElementById('sl-confirm-msg').textContent = message || 'Proceed?';
      modal.classList.remove('hidden');
      document.getElementById('sl-confirm-cancel').onclick = function() { modal.classList.add('hidden'); };
      document.getElementById('sl-confirm-ok').onclick = function() { modal.classList.add('hidden'); if (onConfirm) onConfirm(); };
    }

    function slIncrementCounter(targetId) {
      var el = targetId ? document.getElementById(targetId + '-val') : document.querySelector('[data-sl-counter-val]');
      if (el) {
        var next = Number(el.textContent || 0) + 1;
        el.textContent = String(next);
        window.slRuntime.vars.score = next;
        return true;
      }
      return false;
    }

    function slResetCounter(targetId) {
      var el = document.getElementById(targetId + '-val');
      if (el) { el.textContent = '0'; window.slRuntime.vars.score = 0; }
    }

    function slToggleTimer(blockId, finishMsg) {
      var btn = document.getElementById('sl-timer-btn-' + blockId);
      var lbl = document.getElementById('sl-timer-val-' + blockId);
      if (window.slRuntime.timers[blockId]) {
        clearInterval(window.slRuntime.timers[blockId]);
        delete window.slRuntime.timers[blockId];
        if (btn) btn.textContent = 'Start';
        var cur = parseInt((lbl && lbl.textContent) || '10', 10) || 0;
        if (lbl) lbl.textContent = cur + 's · PAUSED';
      } else {
        if (btn) btn.textContent = 'Pause';
        window.slRuntime.timers[blockId] = setInterval(function() {
          var cur = parseInt((lbl && lbl.textContent) || '10', 10) || 0;
          if (cur <= 1) {
            clearInterval(window.slRuntime.timers[blockId]);
            delete window.slRuntime.timers[blockId];
            if (lbl) lbl.textContent = '0s · DONE';
            if (btn) btn.textContent = 'Start';
            slShowToast(finishMsg || 'Timer completed!');
          } else {
            if (lbl) lbl.textContent = (cur - 1) + 's · RUNNING';
          }
        }, 1000);
      }
    }

    function slResetTimer(blockId) {
      if (window.slRuntime.timers[blockId]) {
        clearInterval(window.slRuntime.timers[blockId]);
        delete window.slRuntime.timers[blockId];
      }
      var lbl = document.getElementById('sl-timer-val-' + blockId);
      var btn = document.getElementById('sl-timer-btn-' + blockId);
      var def = lbl ? (lbl.getAttribute('data-sl-timer-default') || '10') : '10';
      if (lbl) lbl.textContent = def + 's · PAUSED';
      if (btn) btn.textContent = 'Start';
    }

    function slEvalIf(blockId, leftOp, op, rightOp, thenMsg, elseMsg) {
      var l = Object.prototype.hasOwnProperty.call(window.slRuntime.vars, leftOp) ? String(window.slRuntime.vars[leftOp]) : leftOp;
      var r = Object.prototype.hasOwnProperty.call(window.slRuntime.vars, rightOp) ? String(window.slRuntime.vars[rightOp]) : rightOp;
      var ln = Number(l), rn = Number(r);
      var numeric = l !== '' && r !== '' && !isNaN(ln) && !isNaN(rn);
      var ok = op === '!=' ? (numeric ? ln !== rn : l !== r)
        : op === '>' ? (numeric ? ln > rn : l > r)
        : op === '<' ? (numeric ? ln < rn : l < r)
        : op === '>=' ? (numeric ? ln >= rn : l >= r)
        : op === '<=' ? (numeric ? ln <= rn : l <= r)
        : op === 'contains' ? l.toLowerCase().indexOf(r.toLowerCase()) !== -1
        : (numeric ? ln === rn : l === r);
      var el = document.getElementById('sl-if-msg-' + blockId);
      if (el) el.textContent = ok ? thenMsg : elseMsg;
      slShowToast(ok ? thenMsg : elseMsg);
    }

    function slRunLoop(count) {
      window.slRuntime.vars.score = Number(window.slRuntime.vars.score || 0) + count;
      slShowToast('Loop executed ' + count + 'x (score=' + window.slRuntime.vars.score + ')');
    }

    function slApplyVar(blockId, name, op, rawVal) {
      var cur = window.slRuntime.vars[name];
      var nextVal = rawVal;
      if (op === 'toggle') nextVal = !Boolean(cur);
      else if (op === 'change') nextVal = (Number(cur) || 0) + (Number(rawVal) || 1);
      else if (rawVal === 'true') nextVal = true;
      else if (rawVal === 'false') nextVal = false;
      else if (rawVal !== '' && !isNaN(Number(rawVal))) nextVal = Number(rawVal);
      window.slRuntime.vars[name] = nextVal;
      var disp = document.getElementById('sl-var-display-' + blockId);
      if (disp) disp.textContent = name + ' = ' + JSON.stringify(nextVal);
      slShowToast(name + ' = ' + JSON.stringify(nextVal));
    }

    function slRunList(blockId, listName, op, itemVal) {
      var arr = window.slRuntime.lists[listName] || [];
      if (op === 'create') arr = itemVal ? itemVal.split(',').map(function(s){return s.trim();}).filter(Boolean) : [];
      else if (op === 'remove') arr.pop();
      else if (op === 'get') { slShowToast(listName + '[0] = ' + (arr[0] || '(empty)')); return; }
      else if (op === 'length') { slShowToast('Length = ' + arr.length); return; }
      else arr.push(itemVal);
      window.slRuntime.lists[listName] = arr;
      var disp = document.getElementById('sl-list-display-' + blockId);
      if (disp) disp.textContent = '[' + arr.join(', ') + ']';
      slShowToast('List ' + listName + ' (' + arr.length + ' items)');
    }

    function slParseObject(jsonStr, key) {
      try {
        var obj = JSON.parse(jsonStr);
        slShowToast(key + ' => ' + JSON.stringify(obj[key]));
      } catch (e) { slShowToast('Invalid JSON payload'); }
    }

    function slEvalMathText(blockId, op, a, b) {
      var va = Object.prototype.hasOwnProperty.call(window.slRuntime.vars, a) ? String(window.slRuntime.vars[a]) : a;
      var vb = Object.prototype.hasOwnProperty.call(window.slRuntime.vars, b) ? String(window.slRuntime.vars[b]) : b;
      var na = Number(va) || 0, nb = Number(vb) || 0, res = va;
      if (op === 'add') res = String(na + nb);
      else if (op === 'sub') res = String(na - nb);
      else if (op === 'mul') res = String(na * nb);
      else if (op === 'div') res = nb === 0 ? 'Infinity' : String(Number((na / nb).toFixed(4)));
      else if (op === 'round') res = String(Math.round(na));
      else if (op === 'random') res = String(Math.floor(Math.random() * (Math.max(na, nb) - Math.min(na, nb) + 1)) + Math.min(na, nb));
      else if (op === 'join') res = va + (vb ? ' ' + vb : '');
      else if (op === 'length') res = String(va.length);
      else if (op === 'contains') res = String(va.toLowerCase().indexOf(vb.toLowerCase()) !== -1);
      else if (op === 'upper') res = va.toUpperCase();
      else if (op === 'lower') res = va.toLowerCase();
      else if (op === 'format-date') res = new Date().toLocaleString();
      var disp = document.getElementById('sl-math-res-' + blockId);
      if (disp) disp.textContent = 'Result: ' + res;
      slShowToast('Result: ' + res);
    }

    function slRunStorage(key, op, val, blockId) {
      var resEl = blockId ? document.getElementById('sl-storage-res-' + blockId) : null;
      try {
        if (op === 'load') {
          var got = localStorage.getItem(key);
          if (resEl) resEl.textContent = 'Loaded: ' + (got || '(empty)');
          slShowToast(key + ' = ' + (got || '(empty)'));
        } else if (op === 'remove') {
          localStorage.removeItem(key);
          if (resEl) resEl.textContent = 'Removed [' + key + ']';
          slShowToast('Removed ' + key);
        } else {
          localStorage.setItem(key, val);
          if (resEl) resEl.textContent = 'Saved [' + key + ']';
          slShowToast('Saved ' + key + '!');
        }
      } catch (e) { slShowToast('LocalStorage unavailable'); }
    }

    function slRunDb(blockId, col, op, jsonVal) {
      var storeKey = 'sl_db_' + col;
      var rows = [];
      try { rows = JSON.parse(localStorage.getItem(storeKey) || '[]'); } catch (e) { rows = []; }
      if (op === 'get') {
        slShowToast('[' + col + '] has ' + rows.length + ' records');
      } else if (op === 'delete') {
        rows.pop();
        localStorage.setItem(storeKey, JSON.stringify(rows));
        slShowToast('Deleted latest doc in [' + col + ']');
      } else {
        var data = { value: jsonVal };
        try { data = JSON.parse(jsonVal); } catch (e) {}
        rows.push({ id: 'doc_' + Date.now().toString(36), data: data });
        localStorage.setItem(storeKey, JSON.stringify(rows));
        slShowToast('Saved to [' + col + '] (' + rows.length + ' total)');
      }
      var el = document.getElementById('sl-db-res-' + blockId);
      if (el) {
        if (!rows.length) { el.textContent = col + ': 0 records'; }
        else {
          el.innerHTML = rows.slice(-4).map(function(d) {
            return '<div style="background:rgba(0,0,0,0.45);padding:4px 8px;border-radius:6px;border:1px solid rgba(16,185,129,0.2);">' + d.id + ': ' + JSON.stringify(d.data).replace(/</g, '&lt;') + '</div>';
          }).join('');
        }
      }
    }

    function slRunAuth(blockId, op, email) {
      var el = document.getElementById('sl-auth-status-' + blockId);
      if (op === 'logout') {
        window.slRuntime.authUser = null;
        localStorage.removeItem('sl_auth_user');
        if (el) el.textContent = 'Signed out';
        slShowToast('Logged out');
      } else if (op === 'current-user') {
        var u = localStorage.getItem('sl_auth_user');
        slShowToast(u ? 'User: ' + u : 'Not signed in');
      } else {
        window.slRuntime.authUser = email;
        localStorage.setItem('sl_auth_user', email);
        if (el) el.textContent = 'Signed in: ' + email;
        slShowToast((op === 'signup' ? 'Registered ' : 'Logged in as ') + email);
      }
    }

    function slRunDevice(op, blockId) {
      var resEl = blockId ? document.getElementById('sl-dev-res-' + blockId) : null;
      var camEl = blockId ? document.getElementById('sl-dev-cam-' + blockId) : null;
      if (op === 'vibrate') {
        if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
        if (resEl) { resEl.textContent = 'Vibrate triggered [120, 60, 120]ms'; resEl.classList.remove('hidden'); }
        slShowToast('Device vibration triggered!');
      } else if (op === 'camera') {
        if (camEl && camEl.srcObject) {
          camEl.srcObject.getTracks().forEach(function(t) { t.stop(); });
          camEl.srcObject = null;
          camEl.classList.add('hidden');
          if (resEl) { resEl.textContent = 'Camera stopped'; resEl.classList.remove('hidden'); }
          return;
        }
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
            if (camEl) { camEl.srcObject = stream; camEl.classList.remove('hidden'); }
            if (resEl) { resEl.textContent = 'Live Camera Active'; resEl.classList.remove('hidden'); }
            slShowToast('Live camera started!');
          }).catch(function() {
            if (resEl) { resEl.textContent = 'Camera permission denied or no webcam'; resEl.classList.remove('hidden'); }
            slShowToast('Camera permission denied');
          });
        } else { slShowToast('Camera API unavailable'); }
      } else {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            function(pos) {
              var c = pos.coords.latitude.toFixed(4) + ', ' + pos.coords.longitude.toFixed(4);
              if (resEl) { resEl.textContent = 'GPS: ' + c; resEl.classList.remove('hidden'); }
              slShowToast('GPS: ' + c);
            },
            function() {
              if (resEl) { resEl.textContent = 'GPS fallback: 6.9271, 79.8612'; resEl.classList.remove('hidden'); }
              slShowToast('GPS fallback: 6.9271, 79.8612');
            }
          );
        } else { slShowToast('GPS unsupported'); }
      }
    }

    function slRunFetch(blockId, endpoint, method, bodyStr) {
      var box = document.getElementById('sl-fetch-res-' + blockId);
      var opts = { method: method || 'GET', headers: { 'Content-Type': 'application/json' } };
      if (method && method !== 'GET' && method !== 'HEAD' && bodyStr) opts.body = bodyStr;
      fetch(endpoint, opts)
        .then(function(r) { return r.text(); })
        .then(function(txt) {
          if (box) { box.textContent = txt.slice(0, 180); box.classList.remove('hidden'); }
          slShowToast(method + ' ' + endpoint + ' OK');
        })
        .catch(function() {
          var fallback = JSON.stringify({ status: 200, simulated: true, method: method, endpoint: endpoint });
          if (box) { box.textContent = fallback; box.classList.remove('hidden'); }
          slShowToast('Called ' + method + ' ' + endpoint);
        });
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

    document.querySelectorAll('.sl-sidebar-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var group = btn.getAttribute('data-sl-sidebar');
        document.querySelectorAll('[data-sl-sidebar="' + group + '"]').forEach(function(other) {
          other.className = 'sl-sidebar-btn w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer text-slate-300 hover:bg-white/10';
        });
        btn.className = 'sl-sidebar-btn w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer bg-indigo-600/30 text-white border border-indigo-400/40 font-semibold';
      });
    });

    document.querySelectorAll('.sl-tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var grp = btn.getAttribute('data-sl-tab-group');
        var tabName = btn.getAttribute('data-sl-tab') || 'Tab';
        var panelTxt = btn.getAttribute('data-sl-panel') || '';
        document.querySelectorAll('[data-sl-tab-group="' + grp + '"]').forEach(function(b) {
          b.className = 'sl-tab-btn px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-slate-400 hover:text-white';
        });
        btn.className = 'sl-tab-btn px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors bg-indigo-600 text-white';
        var panelEl = document.getElementById('sl-tab-panel-' + grp);
        if (panelEl) {
          panelEl.innerHTML = '<strong class="text-sky-300">' + tabName.replace(/</g, '&lt;') + ':</strong> ' + panelTxt.replace(/</g, '&lt;');
        }
      });
    });

    function slStepPageView(btn, delta) {
      var wrap = btn.closest('[data-sl-pageview]');
      if (!wrap) return;
      var slides = [];
      try { slides = JSON.parse(wrap.getAttribute('data-sl-pageview') || '[]'); } catch(e) {}
      if (!slides.length) return;
      var idx = Math.max(0, Math.min(slides.length - 1, (parseInt(wrap.getAttribute('data-sl-page-idx') || '0', 10) || 0) + delta));
      wrap.setAttribute('data-sl-page-idx', String(idx));
      var parts = String(slides[idx] || '').split('·');
      var tEl = wrap.querySelector('.sl-pv-title');
      var sEl = wrap.querySelector('.sl-pv-sub');
      var iEl = wrap.querySelector('.sl-pv-ind');
      if (tEl) tEl.textContent = (parts[0] || '').trim();
      if (sEl) sEl.textContent = (parts[1] || '').trim();
      if (iEl) iEl.textContent = 'Page ' + (idx + 1) + ' / ' + slides.length;
    }

    function slValidateDemoForm(ev, form) {
      ev.preventDefault();
      var name = (form.querySelector('input[name="name"]').value || '').trim();
      var email = (form.querySelector('input[name="email"]').value || '').trim();
      var pw = (form.querySelector('input[name="password"]').value || '');
      var en = form.querySelector('.sl-err-name');
      var ee = form.querySelector('.sl-err-email');
      var ep = form.querySelector('.sl-err-password');
      var okBox = form.querySelector('.sl-form-ok');
      var ok = true;
      if (!name) { en.textContent = 'Name is required'; en.classList.remove('hidden'); ok = false; } else { en.classList.add('hidden'); }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { ee.textContent = 'Valid email required'; ee.classList.remove('hidden'); ok = false; } else { ee.classList.add('hidden'); }
      if (pw.length < 6) { ep.textContent = 'Min 6 characters'; ep.classList.remove('hidden'); ok = false; } else { ep.classList.add('hidden'); }
      if (ok) { okBox.classList.remove('hidden'); slShowToast('Form validated & submitted!'); } else { okBox.classList.add('hidden'); }
      return false;
    }

    function slSwipeStackNext(btn) {
      var box = btn.closest('[data-sl-swipe-cards]');
      if (!box) return;
      var cards = [];
      try { cards = JSON.parse(box.getAttribute('data-sl-swipe-cards') || '[]'); } catch(e) {}
      var idx = (parseInt(box.getAttribute('data-sl-swipe-idx') || '0', 10) || 0) + 1;
      if (idx > cards.length) idx = cards.length;
      box.setAttribute('data-sl-swipe-idx', String(idx));
      var cEl = box.querySelector('.sl-sw-count');
      var nEl = box.querySelector('.sl-sw-num');
      var tEl = box.querySelector('.sl-sw-title');
      if (cEl) cEl.textContent = idx + ' / ' + cards.length + ' swiped';
      if (idx >= cards.length) {
        if (nEl) nEl.textContent = 'DONE';
        if (tEl) tEl.textContent = 'All cards swiped! Click Reset.';
      } else {
        if (nEl) nEl.textContent = 'Card #' + (idx + 1);
        if (tEl) tEl.textContent = cards[idx];
      }
    }

    function slSwipeStackReset(btn) {
      var box = btn.closest('[data-sl-swipe-cards]');
      if (!box) return;
      var cards = [];
      try { cards = JSON.parse(box.getAttribute('data-sl-swipe-cards') || '[]'); } catch(e) {}
      box.setAttribute('data-sl-swipe-idx', '0');
      var cEl = box.querySelector('.sl-sw-count');
      var nEl = box.querySelector('.sl-sw-num');
      var tEl = box.querySelector('.sl-sw-title');
      if (cEl) cEl.textContent = '0 / ' + cards.length + ' swiped';
      if (nEl) nEl.textContent = 'Card #1';
      if (tEl) tEl.textContent = cards[0] || '';
    }

    document.querySelectorAll('.sl-file-input').forEach(function(inp) {
      inp.addEventListener('change', function() {
        var file = inp.files && inp.files[0];
        var boxId = inp.getAttribute('data-sl-upload-preview');
        var box = boxId ? document.getElementById(boxId) : null;
        if (!file || !box) return;
        box.classList.remove('hidden');
        box.innerHTML = '';
        if (file.type && file.type.indexOf('image/') === 0) {
          var img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          img.style.cssText = 'max-height:140px;width:100%;object-fit:cover;border-radius:8px;margin-bottom:6px;';
          box.appendChild(img);
        }
        var txt = document.createElement('div');
        txt.textContent = 'Uploaded: ' + file.name + ' (' + Math.max(1, Math.round(file.size / 1024)) + ' KB)';
        box.appendChild(txt);
      });
    });

    function slReadInputVal(inp) {
      if (!inp) return '';
      if (inp.type === 'radio') {
        var checked = document.querySelector('input[name="' + inp.name + '"]:checked');
        return checked ? checked.value : '';
      }
      if (inp.type === 'checkbox') return inp.checked ? 'Yes' : 'No';
      if (inp.type === 'file') {
        var f = inp.files && inp.files[0];
        return f ? f.name : '';
      }
      if (inp.type === 'password') return (inp.value || '').trim() ? '••••••' : '';
      return (inp.value || '').trim();
    }

    function slRenderSubmissionSummary(msg, fields) {
      var prev = document.getElementById('sl-submission-receipt');
      if (prev) prev.remove();
      var card = document.createElement('div');
      card.id = 'sl-submission-receipt';
      card.style.cssText = 'max-width:48rem;margin:16px auto;padding:16px;border-radius:14px;background:rgba(6,78,59,0.28);border:1px solid rgba(16,185,129,0.45);color:#ecfdf5;font-size:13px;';
      var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><strong>&#10003; ' + msg.replace(/</g, '&lt;') + '</strong><button type="button" onclick="this.closest(\'#sl-submission-receipt\').remove()" style="background:none;border:0;color:#94a3b8;cursor:pointer;font-size:12px;">Dismiss</button></div>';
      if (fields.length) {
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;">';
        fields.forEach(function(f) {
          html += '<div style="background:rgba(0,0,0,0.35);padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);"><div style="font-size:10px;color:#6ee7b7;text-transform:uppercase;">' + f.label.replace(/</g, '&lt;') + '</div><div style="font-weight:600;">' + f.value.replace(/</g, '&lt;') + '</div></div>';
        });
        html += '</div>';
      }
      card.innerHTML = html;
      var root = document.querySelector('body > div');
      if (root) root.appendChild(card);
    }

    function slRunActionSpec(spec, isDirectHat) {
      var action = spec.action || '';
      var targetId = spec.target || '';
      var targetPage = spec.targetPage || '';
      var payload = spec.payload || '';
      var endpoint = spec.endpoint || '/api/v1/metrics';
      var method = spec.method || 'GET';

      if (!action) {
        if (isDirectHat) {
          slShowToast(payload || 'Event executed!');
          return;
        }
        var hasInputs = document.querySelectorAll('[data-sl-input-id]').length > 0;
        var hasCounter = document.querySelectorAll('[data-sl-counter-val]').length > 0;
        action = hasInputs && !hasCounter ? 'submit-form' : 'increment-counter';
      }

      if (action === 'navigate-page' && targetPage) { window.location.href = targetPage; return; }
      if (action === 'go-back') { window.history.back(); return; }
      if (action === 'scroll-to-block') {
        var section = targetId ? document.getElementById('sl-el-' + targetId) : document.querySelector('[id^="sl-el-"]');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (action === 'open-modal') {
        var m = targetId ? document.getElementById(targetId + '-modal') : document.querySelector('[data-sl-modal]');
        if (m) m.classList.remove('hidden');
        return;
      }
      if (action === 'close-modal') {
        var m2 = targetId ? document.getElementById(targetId + '-modal') : document.querySelector('[data-sl-modal]');
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
      if (action === 'change-text' && targetId) {
        var txtTarget = document.querySelector('[data-sl-text-target="' + targetId + '"]') || document.getElementById('sl-el-' + targetId);
        if (txtTarget) txtTarget.textContent = payload || 'Updated Text!';
        return;
      }
      if (action === 'set-style' && targetId) {
        var sEl = document.getElementById('sl-el-' + targetId);
        if (sEl) sEl.style[spec.styleProp || 'backgroundColor'] = spec.styleVal || '#312e81';
        return;
      }
      if (action === 'add-class' && targetId) {
        var aEl = document.getElementById('sl-el-' + targetId);
        (spec.cssClass || '').split(/\s+/).filter(Boolean).forEach(function(c) { if (aEl) aEl.classList.add(c); });
        return;
      }
      if (action === 'remove-class' && targetId) {
        var rEl = document.getElementById('sl-el-' + targetId);
        (spec.cssClass || '').split(/\s+/).filter(Boolean).forEach(function(c) { if (rEl) rEl.classList.remove(c); });
        return;
      }
      if (action === 'toggle-disabled') {
        var dTarget = targetId ? document.querySelector('#sl-el-' + targetId + ' button') : document.querySelector('.sl-action-btn');
        if (dTarget) dTarget.disabled = !dTarget.disabled;
        return;
      }
      if (action === 'copy-clipboard') {
        navigator.clipboard && navigator.clipboard.writeText(payload || document.title);
        slShowToast('Copied to clipboard!');
        return;
      }
      if (action === 'console-log') {
        console.log(payload || 'BlockCraft Studio Event');
        slShowToast('Logged: ' + (payload || 'Event'));
        return;
      }
      if (action === 'show-confirm') {
        slShowConfirm('Confirm Action', payload || 'Are you sure you want to proceed?', function() {
          slShowToast('Confirmed!');
        });
        return;
      }
      if (action === 'clear-form') {
        document.querySelectorAll('[data-sl-input-id]').forEach(function(inp) {
          if (inp.type === 'checkbox') inp.checked = false;
          else if (inp.type !== 'radio') inp.value = '';
        });
        var rec = document.getElementById('sl-submission-receipt');
        if (rec) rec.remove();
        slShowToast('Form cleared');
        return;
      }
      if (action === 'validate-input') {
        var vInp = targetId ? document.querySelector('[data-sl-input-id="' + targetId + '"]') : document.querySelector('[data-sl-input-id]');
        var val = slReadInputVal(vInp);
        var rule = spec.validationRule || 'not-empty';
        var valid = rule === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
          : rule === 'min-length' ? val.length >= 6
          : val.length > 0;
        slShowToast(valid ? 'Field is valid!' : 'Validation failed (' + rule + ')');
        return;
      }
      if (action === 'get-input-value') {
        var gInp = targetId ? document.querySelector('[data-sl-input-id="' + targetId + '"]') : document.querySelector('[data-sl-input-id]');
        var gVal = slReadInputVal(gInp);
        var gVar = spec.varName || 'inputValue';
        window.slRuntime.vars[gVar] = gVal;
        slShowToast('Read ' + gVar + ' = "' + gVal + '"');
        return;
      }
      if (action === 'set-input-value') {
        var sInp = targetId ? document.querySelector('[data-sl-input-id="' + targetId + '"]') : document.querySelector('[data-sl-input-id]');
        if (sInp) sInp.value = payload || 'Hello from BlockCraft Studio';
        return;
      }
      if (action === 'set-variable') {
        var vn = spec.varName || 'score';
        var vv = spec.varValue || payload || '1';
        window.slRuntime.vars[vn] = vv;
        slShowToast('Set ' + vn + ' = ' + vv);
        return;
      }
      if (action === 'toggle-boolean') {
        var bn = spec.varName || 'isLoggedIn';
        window.slRuntime.vars[bn] = !Boolean(window.slRuntime.vars[bn]);
        slShowToast('Toggled ' + bn + ' = ' + window.slRuntime.vars[bn]);
        return;
      }
      if (action === 'list-add') {
        var ln = spec.listName || 'tasks';
        var lv = spec.varValue || payload || 'New Task';
        window.slRuntime.lists[ln] = (window.slRuntime.lists[ln] || []).concat([lv]);
        slShowToast('Added "' + lv + '" to ' + ln);
        return;
      }
      if (action === 'list-remove') {
        var ln2 = spec.listName || 'tasks';
        if (window.slRuntime.lists[ln2]) window.slRuntime.lists[ln2].pop();
        slShowToast('Removed last item from ' + ln2);
        return;
      }
      if (action === 'submit-form') {
        var seen = {};
        var captured = [];
        document.querySelectorAll('[data-sl-input-id]').forEach(function(inp) {
          var id = inp.getAttribute('data-sl-input-id');
          if (seen[id]) return;
          seen[id] = true;
          var val = slReadInputVal(inp);
          if (!val) return;
          captured.push({ label: inp.getAttribute('data-sl-input-label') || 'Field', value: val });
        });
        var subMsg = payload || 'Form submitted successfully!';
        slRenderSubmissionSummary(subMsg, captured);
        slShowToast(captured.length ? 'Submitted (' + captured.length + ' fields)' : subMsg);
        document.querySelectorAll('[data-hat-type="logic-onsubmit"]').forEach(function(hatBtn) {
          if (hatBtn.dataset.action && hatBtn.dataset.action !== 'submit-form') {
            slRunActionSpec(hatBtn.dataset, true);
          }
        });
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
        slRunStorage(spec.storageKey || 'sl_user_data', 'save', payload || spec.varValue || 'saved');
        return;
      }
      if (action === 'call-api') {
        slRunFetch(spec.blockId || 'api', endpoint, method, spec.body || '');
        return;
      }
      if (action === 'alert') { slShowToast(payload || 'Action executed!'); return; }
      if (!slIncrementCounter(targetId)) {
        slShowToast(payload || 'Button clicked!');
      }
    }

    document.querySelectorAll('.sl-action-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var isHat = Boolean(btn.dataset.hatType);
        slRunActionSpec(btn.dataset, isHat);
        if (!isHat) {
          var clickedId = btn.dataset.blockId || '';
          document.querySelectorAll('[data-hat-type="logic-click"]').forEach(function(hatBtn) {
            var src = hatBtn.dataset.triggerSource || hatBtn.dataset.target || '';
            if (!src || src === clickedId) {
              slRunActionSpec(hatBtn.dataset, true);
            }
          });
        }
      });
    });

    document.addEventListener('DOMContentLoaded', function() {
      ${onLoadHats
        .map((h) => {
          const varStmt = h.logicConfig?.varName
            ? `window.slRuntime.vars[${JSON.stringify(h.logicConfig.varName)}] = ${JSON.stringify(h.logicConfig.varValue ?? 'true')};`
            : '';
          const actStmt = h.action
            ? `var hatEl = document.querySelector('[data-block-id=${JSON.stringify(h.id)}]'); if (hatEl) slRunActionSpec(hatEl.dataset, true);`
            : `slShowToast(${JSON.stringify(h.actionPayload || `${h.name} loaded!`)});`;
          return `${varStmt} ${actStmt}`.trim();
        })
        .join('\n      ')}
      ${onInputHats
        .map((h) => {
          const srcId = h.logicConfig?.triggerSourceId || h.targetId || '';
          const selector = srcId ? `[data-sl-input-id="${srcId}"]` : '[data-sl-input-id]';
          const varStmt = h.logicConfig?.varName
            ? `window.slRuntime.vars[${JSON.stringify(h.logicConfig.varName)}] = inp.value;`
            : '';
          const actStmt = h.action
            ? `var hatEl = document.querySelector('[data-block-id=${JSON.stringify(h.id)}]'); if (hatEl) { var copy = Object.assign({}, hatEl.dataset); if ((copy.payload || '').indexOf('{{value}}') !== -1) copy.payload = copy.payload.replace(/\\{\\{value\\}\\}/g, inp.value); slRunActionSpec(copy, true); }`
            : '';
          return `document.querySelectorAll(${JSON.stringify(selector)}).forEach(function(inp){ inp.addEventListener('input', function(){ ${varStmt} ${actStmt} }); });`;
        })
        .join('\n      ')}
      ${onClickHats.length > 0 ? '/* logic-click hats wired via sl-action-btn listener */' : ''}
      ${onSubmitHats.length > 0 ? '/* logic-onsubmit hats wired via submit-form */' : ''}
      ${onKeyHats
        .map(
          (h) =>
            `document.addEventListener('keydown', function(e){ var tag = (e.target && e.target.tagName || '').toLowerCase(); var k = e.key === ' ' ? 'Space' : e.key; if ((tag === 'input' || tag === 'textarea' || tag === 'select') && k === 'Space') return; if (k === ${JSON.stringify(
              h.triggerKey || 'Enter'
            )}) { ${
              h.action
                ? `var hatEl = document.querySelector('[data-block-id=${JSON.stringify(h.id)}]'); if (hatEl) slRunActionSpec(hatEl.dataset, true);`
                : `slShowToast(${JSON.stringify(h.actionPayload || `Key [${h.triggerKey || 'Enter'}] triggered!`)});`
            } } });`
        )
        .join('\n      ')}
      ${
        !onKeyHats.some((h) => (h.triggerKey || 'Enter') === 'Enter')
          ? `document.querySelectorAll('input[data-sl-input-id]').forEach(function(inp){ inp.addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); var subBtn = document.querySelector('.sl-action-btn[data-action="submit-form"]'); if (subBtn) { slRunActionSpec(subBtn.dataset, false); } else { slRunActionSpec({ action: 'submit-form', payload: 'Form submitted successfully!' }, false); } } }); });`
          : ''
      }
    });
  </script>
</body>
</html>`;
}

export function generateReactTsxExport(
  projectName: string,
  blocks: CanvasBlock[],
  pageStyle?: PageStyleSettings,
  pages?: SitePage[]
): string {
  const pageBg = resolvePageBackgroundCss(pageStyle);
  const pageTextColor = pageStyle?.textColor || '#f1f5f9';
  const defaultCounter = blocks.find((b) => b.type === 'logic-counter')?.counterValue ?? 0;

  const jsxBody = blocks
    .map((b) => {
      const safeTitle = JSON.stringify(b.content || b.name);
      const safeSub = JSON.stringify(b.subtitle || '');
      const elId = `sl-el-${b.id}`;
      const blockStyleObj: Record<string, string> = {};
      if (b.style?.customTextHex) blockStyleObj.color = b.style.customTextHex;
      if (b.style?.customBgHex) blockStyleObj.backgroundColor = b.style.customBgHex;
      if (b.style?.bgGradient) blockStyleObj.background = b.style.bgGradient;
      if (b.style?.borderColor) blockStyleObj.borderColor = b.style.borderColor;
      if (b.style?.borderWidth) blockStyleObj.borderWidth = b.style.borderWidth;
      if (b.style?.boxShadow) blockStyleObj.boxShadow = b.style.boxShadow;
      if (b.style?.textShadow) blockStyleObj.textShadow = b.style.textShadow;
      if (b.style?.width && b.style.width !== 'auto') blockStyleObj.width = b.style.width;
      if (b.style?.height && b.style.height !== 'auto') blockStyleObj.minHeight = b.style.height;
      const styleAttr =
        Object.keys(blockStyleObj).length > 0 ? ` style={${JSON.stringify(blockStyleObj)}}` : '';

      const renderChildJsx = (child: CanvasBlock, extraFlex?: string): string => {
        const cTitle = JSON.stringify(child.content || child.name);
        if (child.type === 'ui-spacer') {
          return `<div style={{ height: ${child.spacerSize ?? 16}, width: ${child.spacerSize ?? 16} }} />`;
        }
        if (child.type === 'ui-divider') {
          return `<hr className="w-full border-0 border-t border-white/20 my-1" />`;
        }
        if (child.type === 'ui-vertical-divider') {
          return `<div className="border-l border-white/20 min-h-[28px] self-stretch mx-1" />`;
        }
        if (child.type === 'ui-button') {
          return `<button type="button" onClick={() => showToast(${cTitle})} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer"${extraFlex ? ` style={{ flex: ${JSON.stringify(extraFlex)} }}` : ''}>{${cTitle}}</button>`;
        }
        return `<div className="px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"${extraFlex ? ` style={{ flex: ${JSON.stringify(extraFlex)} }}` : ''}>{${cTitle}}</div>`;
      };

      switch (b.type) {
        case 'ui-navbar': {
          const links = getEffectiveNavLinks(b, pages, blocks);
          return `      <header id=${JSON.stringify(elId)} className="w-full border-b border-white/10 bg-[#0D111A]/90 sticky top-0 z-50"${styleAttr}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <span className="font-bold text-lg">{${safeTitle}}</span>
          <nav className="flex items-center gap-5 text-sm">
            {${JSON.stringify(links.map((l) => l.label))}.map((lbl, idx) => (
              <button key={idx} type="button" onClick={() => showToast(\`Navigated: \${lbl}\`)} className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
                {lbl}
              </button>
            ))}
          </nav>
        </div>
      </header>`;
        }
        case 'ui-sidebar': {
          const items = parseOptionsList(b.content, b.options, ['Overview', 'Analytics', 'Users', 'Settings']);
          return `      <aside id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2"${styleAttr}>
          <div className="text-xs font-bold uppercase tracking-wider opacity-70">{${safeSub} || ${JSON.stringify(b.name)}}</div>
          <div className="space-y-1">
            {${JSON.stringify(items)}.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { setSidebarIdx((p) => ({ ...p, [${JSON.stringify(b.id)}]: idx })); showToast(\`Selected: \${item}\`); }}
                className={\`w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer \${(sidebarIdx[${JSON.stringify(b.id)}] ?? 0) === idx ? 'bg-indigo-600/30 text-white font-semibold' : 'text-slate-300 hover:bg-white/10'}\`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </aside>`;
        }
        case 'ui-tabbar': {
          const tabs = parseOptionsList(b.content, b.options, ['Overview', 'Specs', 'Reviews']);
          const panels = (b.subtitle || '').split('|').map((s) => s.trim()).filter(Boolean);
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3"${styleAttr}>
          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
            {${JSON.stringify(tabs)}.map((tab, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTabIdx((p) => ({ ...p, [${JSON.stringify(b.id)}]: idx }))}
                className={\`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer \${(tabIdx[${JSON.stringify(b.id)}] ?? 0) === idx ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}\`}
              >
                {tab}
              </button>
            ))}
          </div>
          <p className="text-xs opacity-80">
            {${JSON.stringify(panels)}[(tabIdx[${JSON.stringify(b.id)}] ?? 0)] || \`Active Tab: \${${JSON.stringify(tabs)}[(tabIdx[${JSON.stringify(b.id)}] ?? 0)]}\`}
          </p>
        </div>
      </section>`;
        }
        case 'ui-link':
          return `      <div id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-3 w-full">
        <button type="button" onClick={() => showToast(${JSON.stringify(b.actionPayload || `Link clicked: ${b.content}`)})} className="text-sm font-semibold text-sky-400 underline cursor-pointer">
          {${safeTitle}}
        </button>
      </div>`;
        case 'ui-heading':
          return `      <section id=${JSON.stringify(elId)} className="w-full py-14 px-6 text-center space-y-3"${styleAttr}>
        <h1 className="text-4xl font-extrabold">{textOverrides[${JSON.stringify(b.id)}] ?? ${safeTitle}}</h1>
        {${safeSub} && <p className="text-base opacity-75 max-w-2xl mx-auto">{${safeSub}}</p>}
      </section>`;
        case 'ui-paragraph':
          return `      <section id=${JSON.stringify(elId)} className="max-w-4xl mx-auto px-6 py-4 w-full">
        <p className="text-base opacity-85 leading-relaxed"{...{}}>{textOverrides[${JSON.stringify(b.id)}] ?? ${safeTitle}}</p>
      </section>`;
        case 'ui-section':
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="p-6 rounded-2xl border border-white/15 bg-white/5 space-y-2"${styleAttr}>
          <div className="text-[11px] font-mono uppercase tracking-wider text-sky-300">{${JSON.stringify(b.badgeText || 'Container')}}</div>
          <h3 className="text-lg font-bold">{textOverrides[${JSON.stringify(b.id)}] ?? ${safeTitle}}</h3>
          {${safeSub} && <p className="text-sm opacity-75">{${safeSub}}</p>}
          ${b.children && b.children.length > 0 ? `<div className="pt-2 space-y-2">${b.children.map((c) => renderChildJsx(c)).join('\n          ')}</div>` : ''}
        </div>
      </section>`;
        case 'ui-row':
        case 'ui-column':
        case 'ui-grid': {
          const items = parseOptionsList(b.content, b.options, ['Item 1', 'Item 2', 'Item 3']);
          const gridClass =
            b.type === 'ui-column'
              ? 'flex flex-col gap-3'
              : b.type === 'ui-row'
              ? 'flex flex-wrap gap-3 items-center'
              : `grid grid-cols-1 ${b.gridColumns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`;
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="${gridClass}"${styleAttr}>
          ${
            b.children && b.children.length > 0 && b.type !== 'ui-grid'
              ? b.children.map((c) => renderChildJsx(c, b.type === 'ui-row' && c.type !== 'ui-vertical-divider' ? '1 1 0%' : undefined)).join('\n          ')
              : `{${JSON.stringify(items)}.map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 font-semibold">{item}</div>
          ))}`
          }
        </div>
      </section>`;
        }
        case 'ui-stack':
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="relative overflow-hidden rounded-2xl border border-white/15 min-h-[180px] flex flex-col justify-end p-6"${styleAttr}>
          ${b.imageUrl ? `<img src=${JSON.stringify(b.imageUrl)} alt={${safeTitle}} className="absolute inset-0 w-full h-full object-cover" />` : `<div className="absolute inset-0 bg-gradient-to-br from-indigo-700/70 via-slate-900 to-sky-700/60" />`}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15" />
          <div className="relative z-10 space-y-1.5">
            <h3 className="text-xl font-bold text-white">{${safeTitle}}</h3>
            {${safeSub} && <p className="text-sm text-slate-200">{${safeSub}}</p>}
            ${b.children && b.children.length > 0 ? `<div className="pt-2 flex flex-wrap gap-2">${b.children.map((c) => renderChildJsx(c)).join('\n            ')}</div>` : ''}
          </div>
        </div>
      </section>`;
        case 'ui-listview': {
          const items = parseOptionsList(b.content, b.options, ['Item 1 · Description', 'Item 2 · Description']);
          const isH = b.direction === 'horizontal';
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="${isH ? 'flex flex-row gap-3 overflow-x-auto pb-2' : 'flex flex-col gap-2 max-h-64 overflow-y-auto'}"${styleAttr}>
          {${JSON.stringify(items)}.map((item, i) => (
            <div key={i} className="${isH ? 'min-w-[200px] shrink-0' : 'w-full'} p-3.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium">{item}</div>
          ))}
        </div>
      </section>`;
        }
        case 'ui-spacer':
          return `      <div id=${JSON.stringify(elId)} style={{ height: ${b.spacerSize ?? 32} }} aria-hidden="true" />`;
        case 'ui-divider':
          return `      <div id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-3 w-full"><hr style={{ borderColor: ${JSON.stringify(b.style?.borderColor || 'rgba(255,255,255,0.2)')}, borderTopWidth: ${JSON.stringify(b.style?.borderWidth || '1px')} }} className="w-full border-0 border-t" /></div>`;
        case 'ui-vertical-divider': {
          const lr = parseOptionsList(b.content, b.options, ['Left Section', 'Right Section']);
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-stretch gap-4"${styleAttr}>
          <div className="flex-1 text-sm flex items-center justify-center">{${JSON.stringify(lr[0] || 'Left')}}</div>
          <div style={{ borderColor: ${JSON.stringify(b.style?.borderColor || 'rgba(255,255,255,0.22)')}, borderLeftWidth: ${JSON.stringify(b.style?.borderWidth || '1px')} }} className="border-l self-stretch min-h-[36px]" />
          <div className="flex-1 text-sm flex items-center justify-center">{${JSON.stringify(lr[1] || 'Right')}}</div>
        </div>
      </section>`;
        }
        case 'ui-pageview': {
          const slides = parseOptionsList(b.content, b.options, ['Welcome · Step 1', 'Features · Step 2', 'Launch · Step 3']);
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/15 space-y-4 text-center"${styleAttr}>
          <div className="text-lg font-bold">{${JSON.stringify(slides)}[tabIdx[${JSON.stringify(`${b.id}_pv`)}] ?? 0]}</div>
          <div className="flex justify-between items-center">
            <button type="button" onClick={() => setTabIdx((p) => ({ ...p, [${JSON.stringify(`${b.id}_pv`)}]: Math.max(0, (p[${JSON.stringify(`${b.id}_pv`)}] ?? 0) - 1) }))} className="px-3 py-1 rounded bg-white/10 text-xs cursor-pointer">Prev</button>
            <span className="text-xs font-mono opacity-70">{(tabIdx[${JSON.stringify(`${b.id}_pv`)}] ?? 0) + 1} / ${slides.length}</span>
            <button type="button" onClick={() => setTabIdx((p) => ({ ...p, [${JSON.stringify(`${b.id}_pv`)}]: Math.min(${slides.length - 1}, (p[${JSON.stringify(`${b.id}_pv`)}] ?? 0) + 1) }))} className="px-3 py-1 rounded bg-white/10 text-xs cursor-pointer">Next</button>
          </div>
        </div>
      </section>`;
        }
        case 'ui-carousel': {
          const slides = parseOptionsList(b.content, b.options, ['Slide 1', 'Slide 2', 'Slide 3']);
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"${styleAttr}>
          {${JSON.stringify(slides)}.map((s, idx) => (
            <div key={idx} className="min-w-[260px] snap-center p-5 rounded-xl bg-white/5 border border-white/10 font-bold">{s}</div>
          ))}
        </div>
      </section>`;
        }
        case 'ui-wrap': {
          const tags = parseOptionsList(b.content, b.options, ['UI Design', 'React', 'Tailwind CSS', 'TypeScript']);
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-wrap gap-2"${styleAttr}>
          ${
            b.children && b.children.length > 0
              ? b.children.map((c) => renderChildJsx(c)).join('\n          ')
              : `{${JSON.stringify(tags)}.map((tag, i) => <span key={i} className="px-3 py-1 rounded-full bg-black/40 border border-white/15 text-xs font-medium">{tag}</span>)}`
          }
        </div>
      </section>`;
        }
        case 'ui-form':
          return `      <section id=${JSON.stringify(elId)} className="max-w-3xl mx-auto px-6 py-4 w-full">
        <form onSubmit={(e) => { e.preventDefault(); const n = inputs[${JSON.stringify(`${b.id}_name`)}] || ''; const em = inputs[${JSON.stringify(`${b.id}_email`)}] || ''; const pw = inputs[${JSON.stringify(`${b.id}_pw`)}] || ''; if (!n.trim() || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(em) || pw.length < 6) { showToast('Check Name, valid Email & 6+ char Password'); return; } handleSubmitForm('Validated & Submitted!'); }} className="p-5 rounded-2xl bg-white/5 border border-white/15 space-y-3"${styleAttr}>
          <h3 className="text-base font-bold">{${safeTitle}}</h3>
          <input type="text" placeholder="Full Name *" value={inputs[${JSON.stringify(`${b.id}_name`)}] || ''} onChange={(e) => setInputs((p) => ({ ...p, [${JSON.stringify(`${b.id}_name`)}]: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-sm" />
          <input type="email" placeholder="Email Address *" value={inputs[${JSON.stringify(`${b.id}_email`)}] || ''} onChange={(e) => setInputs((p) => ({ ...p, [${JSON.stringify(`${b.id}_email`)}]: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-sm" />
          <input type="password" placeholder="Password (6+ chars) *" value={inputs[${JSON.stringify(`${b.id}_pw`)}] || ''} onChange={(e) => setInputs((p) => ({ ...p, [${JSON.stringify(`${b.id}_pw`)}]: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-sm" />
          <button type="submit" className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-bold cursor-pointer">{${JSON.stringify(b.badgeText || 'Validate & Submit')}}</button>
        </form>
      </section>`;
        case 'ui-staggered': {
          const tiles = parseOptionsList(b.content, b.options, ['Tile 1', 'Tile 2', 'Tile 3', 'Tile 4']);
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="${b.gridColumns === 3 ? 'columns-1 md:columns-3' : 'columns-1 md:columns-2'} gap-4 space-y-4"${styleAttr}>
          {${JSON.stringify(tiles)}.map((t, i) => (
            <div key={i} className="break-inside-avoid p-5 rounded-xl bg-white/5 border border-white/10 font-semibold">{t}</div>
          ))}
        </div>
      </section>`;
        }
        case 'ui-flippable-card':
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <button type="button" onClick={() => setOpenAccordions((p) => ({ ...p, [${JSON.stringify(b.id)}]: !p[${JSON.stringify(b.id)}] }))} className="w-full text-left p-6 rounded-2xl bg-white/5 border border-white/15 space-y-2 cursor-pointer"${styleAttr}>
          <div className="text-xs font-mono text-sky-400">{openAccordions[${JSON.stringify(b.id)}] ? 'BACK SIDE' : 'FRONT SIDE'}</div>
          <h3 className="text-lg font-bold">{openAccordions[${JSON.stringify(b.id)}] ? ${JSON.stringify(b.backTitle || 'Back Side')} : ${safeTitle}}</h3>
          <p className="text-sm opacity-75">{openAccordions[${JSON.stringify(b.id)}] ? ${JSON.stringify(b.backSubtitle || 'Tap to flip back')} : ${safeSub}}</p>
        </button>
      </section>`;
        case 'ui-swipeable-stack': {
          const cards = parseOptionsList(b.content, b.options, ['Card 1', 'Card 2', 'Card 3']);
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3"${styleAttr}>
          <div className="p-5 rounded-xl bg-black/30 border border-white/10 font-bold">{${JSON.stringify(cards)}[tabIdx[${JSON.stringify(`${b.id}_sw`)}] ?? 0] ?? 'All cards swiped!'}</div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setTabIdx((p) => ({ ...p, [${JSON.stringify(`${b.id}_sw`)}]: Math.min(${cards.length}, (p[${JSON.stringify(`${b.id}_sw`)}] ?? 0) + 1) }))} className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs font-semibold cursor-pointer">Swipe Next</button>
            <button type="button" onClick={() => setTabIdx((p) => ({ ...p, [${JSON.stringify(`${b.id}_sw`)}]: 0 }))} className="px-3 py-1.5 rounded bg-white/10 text-xs cursor-pointer">Reset</button>
          </div>
        </div>
      </section>`;
        }
        case 'ui-datatable': {
          const headers = (b.columnsHeader || 'Name | Role | Status').split('|').map((s) => s.trim()).filter(Boolean);
          const rows = parseOptionsList(b.content, b.options, ['Deepal P. | Architect | Active']).map((r) => r.split('|').map((c) => c.trim()));
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm rounded-xl bg-white/5 border border-white/10"${styleAttr}>
          <thead><tr className="border-b border-white/15 text-sky-300">{${JSON.stringify(headers)}.map((h, i) => <th key={i} className="p-3">{h}</th>)}</tr></thead>
          <tbody>{${JSON.stringify(rows)}.map((row, r) => <tr key={r} className="border-t border-white/10">{row.map((cell, c) => <td key={c} className="p-3">{cell}</td>)}</tr>)}</tbody>
        </table>
      </section>`;
        }
        case 'ui-flex': {
          const isCol = b.direction === 'column' || b.direction === 'vertical';
          const ratios = (b.flexRatios || '1:2:1').split(/[:,\s]+/).map((n) => Math.max(1, Number(n) || 1));
          const items = parseOptionsList(b.content, b.options, ['Pane 1', 'Pane 2', 'Pane 3']);
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="flex ${isCol ? 'flex-col' : 'flex-row'} gap-3"${styleAttr}>
          ${
            b.children && b.children.length > 0
              ? b.children.map((c, i) => renderChildJsx(c, `${ratios[i] ?? 1} 1 0%`)).join('\n          ')
              : `{${JSON.stringify(items)}.map((item, i) => (
            <div key={i} style={{ flex: \`\${${JSON.stringify(ratios)}[i] ?? 1} 1 0%\` }} className="p-4 rounded-xl bg-white/5 border border-white/10 font-semibold text-center">{item}</div>
          ))}`
          }
        </div>
      </section>`;
        }
        case 'ui-card':
        case 'ui-testimonial':
        case 'ui-pricing':
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3"${styleAttr}>
          ${
            b.imageUrl
              ? `<img src=${JSON.stringify(b.imageUrl)} alt={${safeTitle}} className="w-full max-h-56 object-cover rounded-xl" />`
              : ''
          }
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl font-bold">{textOverrides[${JSON.stringify(b.id)}] ?? ${safeTitle}}</h3>
            {${JSON.stringify(b.badgeText || '')} && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300">{${JSON.stringify(b.badgeText || '')}}</span>}
          </div>
          {${safeSub} && <p className="text-sm opacity-75">{${safeSub}}</p>}
          {${JSON.stringify(b.authorRole || '')} && <p className="text-xs opacity-60">{${JSON.stringify(b.authorRole || '')}}</p>}
        </div>
      </section>`;
        case 'ui-image':
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <figure className="overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3"${styleAttr}>
          ${
            b.imageUrl
              ? `<img src=${JSON.stringify(b.imageUrl)} alt={${safeTitle}} className="w-full max-h-80 object-cover rounded-xl" />`
              : `<div className="h-44 rounded-xl bg-slate-900 flex items-center justify-center text-xs text-sky-400">Media Showcase</div>`
          }
          <figcaption>
            <div className="text-base font-bold">{textOverrides[${JSON.stringify(b.id)}] ?? ${safeTitle}}</div>
            {${safeSub} && <p className="text-xs opacity-75 mt-0.5">{${safeSub}}</p>}
          </figcaption>
        </figure>
      </section>`;
        case 'ui-icon': {
          const def = getVectorIconDef(b.iconName);
          return `      <div id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 text-center w-full">
        <div className="inline-flex flex-col items-center p-5 rounded-xl bg-white/5 border border-white/10 gap-2"${styleAttr}>
          <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(
            `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${def.svgInner}</svg>`
          )} }} />
          <span className="text-sm font-bold">{${safeTitle}}</span>
          {${safeSub} && <span className="text-xs opacity-75">{${safeSub}}</span>}
        </div>
      </div>`;
        }
        case 'ui-video': {
          const parsedVid = parseVideoUrl(b.videoUrl);
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3"${styleAttr}>
          ${
            parsedVid.kind === 'youtube' || parsedVid.kind === 'vimeo'
              ? `<div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10"><iframe src=${JSON.stringify(
                  parsedVid.embedUrl
                )} title={${safeTitle}} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full border-0" /></div>`
              : parsedVid.kind === 'direct'
              ? `<video controls playsInline src=${JSON.stringify(
                  parsedVid.embedUrl
                )} className="w-full rounded-xl bg-black" />`
              : `<div className="h-44 rounded-xl bg-black/50 flex items-center justify-center text-sky-400 text-sm">Video URL not configured</div>`
          }
          <div className="text-base font-bold">{${safeTitle}}</div>
          {${safeSub} && <p className="text-xs opacity-75">{${safeSub}}</p>}
        </div>
      </section>`;
        }
        case 'ui-file-upload':
          return `      <section id=${JSON.stringify(elId)} className="max-w-3xl mx-auto px-6 py-3 w-full">
        <div className="p-6 rounded-xl border border-dashed border-white/25 bg-white/5 text-center space-y-2">
          {${safeSub} && <div className="text-xs font-semibold opacity-75">{${safeSub}}</div>}
          <label className="block cursor-pointer space-y-1">
            <div className="text-sm font-semibold">{${safeTitle}}</div>
            <input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) setInputs((p) => ({ ...p, [${JSON.stringify(b.id)}]: f.name })); }} className="hidden" />
          </label>
          {inputs[${JSON.stringify(b.id)}] && <div className="text-xs font-mono text-emerald-300">Selected: {inputs[${JSON.stringify(b.id)}]}</div>}
        </div>
      </section>`;
        case 'ui-avatar':
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-3 w-full">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4"${styleAttr}>
          ${
            b.imageUrl
              ? `<img src=${JSON.stringify(b.imageUrl)} alt={${safeTitle}} className="w-12 h-12 rounded-full object-cover border border-sky-400/50 shrink-0" />`
              : `<div className="w-12 h-12 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 font-bold text-sm shrink-0">${escapeHtml((b.content || b.name).slice(0, 2).toUpperCase())}</div>`
          }
          <div>
            <div className="text-sm font-bold">{textOverrides[${JSON.stringify(b.id)}] ?? ${safeTitle}}</div>
            {${safeSub} && <div className="text-xs opacity-75">{${safeSub}}</div>}
          </div>
        </div>
      </section>`;
        case 'ui-modal':
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-3 w-full">
        <div className="p-5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm">{${safeTitle}}</h4>
            {${safeSub} && <p className="text-xs opacity-75">{${safeSub}}</p>}
          </div>
          <button type="button" onClick={() => setOpenModals((p) => ({ ...p, [${JSON.stringify(b.id)}]: true }))} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold cursor-pointer">
            {${JSON.stringify(b.badgeText || 'Open Modal')}}
          </button>
        </div>
        {openModals[${JSON.stringify(b.id)}] && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" onClick={() => setOpenModals((p) => ({ ...p, [${JSON.stringify(b.id)}]: false }))}>
            <div className="max-w-md w-full rounded-2xl bg-[#11151E] border border-white/15 p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white">{${safeTitle}}</h3>
              <p className="text-sm text-slate-300">{${safeSub} || 'Interactive Modal Content'}</p>
              <button type="button" onClick={() => setOpenModals((p) => ({ ...p, [${JSON.stringify(b.id)}]: false }))} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold cursor-pointer">Close</button>
            </div>
          </div>
        )}
      </section>`;
        case 'ui-input':
        case 'ui-textarea':
          return `      <section id=${JSON.stringify(elId)} className="max-w-3xl mx-auto px-6 py-3 w-full">
        {${safeSub} && <label className="block text-xs font-semibold mb-1.5 opacity-80">{${safeSub}}</label>}
        ${
          b.type === 'ui-textarea'
            ? `<textarea rows={4} placeholder={${safeTitle}} value={inputs[${JSON.stringify(b.id)}] || ''} onChange={(e) => setInputs((p) => ({ ...p, [${JSON.stringify(b.id)}]: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/15 text-sm outline-none" />`
            : `<input type=${JSON.stringify(b.inputType || 'text')} placeholder={${safeTitle}} value={inputs[${JSON.stringify(b.id)}] || ''} onChange={(e) => setInputs((p) => ({ ...p, [${JSON.stringify(b.id)}]: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/15 text-sm outline-none" />`
        }
      </section>`;
        case 'ui-select': {
          const opts = parseOptionsList(b.content, b.options, ['Option 1', 'Option 2', 'Option 3']);
          return `      <section id=${JSON.stringify(elId)} className="max-w-3xl mx-auto px-6 py-3 w-full">
        {${safeSub} && <label className="block text-xs font-semibold mb-1.5 opacity-80">{${safeSub}}</label>}
        <select value={inputs[${JSON.stringify(b.id)}] || ${JSON.stringify(opts[0] || '')}} onChange={(e) => setInputs((p) => ({ ...p, [${JSON.stringify(b.id)}]: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-[#0D111A] border border-white/15 text-sm text-white">
          {${JSON.stringify(opts)}.map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
        </select>
      </section>`;
        }
        case 'ui-checkbox':
          return `      <section id=${JSON.stringify(elId)} className="max-w-3xl mx-auto px-6 py-3 w-full">
        <label className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={inputs[${JSON.stringify(b.id)}] === 'true'} onChange={(e) => setInputs((p) => ({ ...p, [${JSON.stringify(b.id)}]: String(e.target.checked) }))} className="w-4 h-4 accent-indigo-500" />
          <span className="text-sm font-medium">{${safeTitle}}</span>
        </label>
      </section>`;
        case 'logic-counter':
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="p-6 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-indigo-300 font-mono">{${safeTitle}}</p>
            <p className="text-3xl font-extrabold text-white tabular-nums">{counter}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setCounter((c) => c + 1)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold cursor-pointer">+1</button>
            <button type="button" onClick={() => setCounter(0)} className="px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold cursor-pointer">Reset</button>
          </div>
        </div>
      </section>`;
        case 'ui-button': {
          const action = b.action || 'increment-counter';
          const handler =
            action === 'scroll-to-block' && b.targetId
              ? `document.getElementById(${JSON.stringify(`sl-el-${b.targetId}`)})?.scrollIntoView({ behavior: 'smooth' })`
              : action === 'open-modal'
              ? `setOpenModals((p) => ({ ...p, [${JSON.stringify(b.targetId || blocks.find((m) => m.type === 'ui-modal')?.id || '')}]: true }))`
              : action === 'close-modal'
              ? `setOpenModals((p) => ({ ...p, [${JSON.stringify(b.targetId || blocks.find((m) => m.type === 'ui-modal')?.id || '')}]: false }))`
              : action === 'hide-element' && b.targetId
              ? `setHiddenIds((p) => ({ ...p, [${JSON.stringify(b.targetId)}]: true }))`
              : action === 'show-element' && b.targetId
              ? `setHiddenIds((p) => ({ ...p, [${JSON.stringify(b.targetId)}]: false }))`
              : action === 'change-text' && b.targetId
              ? `setTextOverrides((p) => ({ ...p, [${JSON.stringify(b.targetId)}]: ${JSON.stringify(b.actionPayload || 'Updated Text!')} }))`
              : action === 'clear-form'
              ? `setInputs({}); setReceipt(null); showToast('Form cleared')`
              : action === 'submit-form'
              ? `handleSubmitForm(${JSON.stringify(b.actionPayload || 'Form inputs entered & saved!')})`
              : action === 'alert'
              ? `showToast(${JSON.stringify(b.actionPayload || `Clicked ${b.name}`)})`
              : `setCounter((c) => c + 1)`;
          return `      {!hiddenIds[${JSON.stringify(b.id)}] && (
        <div id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 text-center w-full">
          <button type="button" onClick={() => { ${handler}; }} className="px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold cursor-pointer"${styleAttr}>
            {textOverrides[${JSON.stringify(b.id)}] ?? ${safeTitle}}
          </button>
        </div>
      )}`;
        }
        case 'backend-storage': {
          const cfg = b.logicConfig || {};
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
          <div className="text-xs font-mono text-emerald-300 font-bold">LocalStorage [${escapeHtml(cfg.storageKey || 'sl_user_data')}]</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { localStorage.setItem(${JSON.stringify(cfg.storageKey || 'sl_user_data')}, ${JSON.stringify(cfg.varValue || 'Saved!')}); showToast('Saved to LocalStorage!'); }} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer">Save</button>
            <button type="button" onClick={() => { showToast(localStorage.getItem(${JSON.stringify(cfg.storageKey || 'sl_user_data')}) || '(empty)'); }} className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold cursor-pointer">Load</button>
            <button type="button" onClick={() => { localStorage.removeItem(${JSON.stringify(cfg.storageKey || 'sl_user_data')}); showToast('Removed'); }} className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-semibold cursor-pointer">Remove</button>
          </div>
        </div>
      </section>`;
        }
        case 'backend-db': {
          const col = b.logicConfig?.collectionName || 'users';
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-300 font-bold">Cloud DB [${escapeHtml(col)}] ({(dbRows[${JSON.stringify(col)}] || []).length} docs)</span>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => { const next = [...(dbRows[${JSON.stringify(col)}] || []), { id: 'doc_' + Date.now().toString(36), data: ${JSON.stringify(b.logicConfig?.varValue || '{"name":"Creator"}')} }]; setDbRows((p) => ({ ...p, [${JSON.stringify(col)}]: next })); showToast('Saved doc!'); }} className="px-3 py-1 rounded bg-emerald-600 text-white text-xs font-bold cursor-pointer">+ Save</button>
              <button type="button" onClick={() => { const next = (dbRows[${JSON.stringify(col)}] || []).slice(0, -1); setDbRows((p) => ({ ...p, [${JSON.stringify(col)}]: next })); showToast('Deleted latest'); }} className="px-3 py-1 rounded bg-rose-500/20 text-rose-300 text-xs font-semibold cursor-pointer">Delete</button>
            </div>
          </div>
          {(dbRows[${JSON.stringify(col)}] || []).map((r) => <div key={r.id} className="text-xs font-mono text-emerald-200 bg-black/40 p-2 rounded">{r.id}: {r.data}</div>)}
        </div>
      </section>`;
        }
        case 'backend-auth':
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono"><span className="text-emerald-300 font-bold">AUTH SESSION</span><span>{authEmail ? \`Signed in: \${authEmail}\` : 'Signed Out'}</span></div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setAuthEmail(${JSON.stringify(b.logicConfig?.varValue || 'creator@blockcraft.app')}); showToast('Signed in!'); }} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer">Login</button>
            <button type="button" onClick={() => { setAuthEmail(null); showToast('Logged out'); }} className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold cursor-pointer">Logout</button>
          </div>
        </div>
      </section>`;
        case 'backend-device':
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-mono text-emerald-300 font-bold">DEVICE &amp; SENSOR APIS</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigator.geolocation?.getCurrentPosition((pos) => showToast(\`GPS: \${pos.coords.latitude.toFixed(4)}, \${pos.coords.longitude.toFixed(4)}\`), () => showToast('GPS fallback: 6.9271, 79.8612'))} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer">GPS</button>
            <button type="button" onClick={() => { navigator.vibrate?.([120, 60, 120]); showToast('Vibrated!'); }} className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold cursor-pointer">Vibrate</button>
          </div>
        </div>
      </section>`;
        case 'backend-flask':
        case 'backend-fetch':
        case 'backend-blockly':
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-3">
          <div className="font-mono text-xs"><span className="text-emerald-300 font-bold mr-2">${escapeHtml(b.httpMethod || 'GET')}</span><span>${escapeHtml(b.apiEndpoint || '/api/v1/metrics')}</span></div>
          <button type="button" onClick={() => { fetch(${JSON.stringify(b.apiEndpoint || '/api/v1/metrics')}, { method: ${JSON.stringify(b.httpMethod || 'GET')} }).then((r) => showToast(\`HTTP \${r.status}\`)).catch(() => showToast('API endpoint simulated OK')); }} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer">Send</button>
        </div>
      </section>`;
        case 'ui-accordion':
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-3 w-full">
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
          <button type="button" onClick={() => setOpenAccordions((p) => ({ ...p, [${JSON.stringify(b.id)}]: !p[${JSON.stringify(b.id)}] }))} className="w-full text-left p-5 font-semibold text-base text-white flex justify-between cursor-pointer">
            <span>{${safeTitle}}</span>
            <span>{openAccordions[${JSON.stringify(b.id)}] ? '−' : '+'}</span>
          </button>
          {openAccordions[${JSON.stringify(b.id)}] && <p className="px-5 pb-5 text-sm opacity-75">{${safeSub}}</p>}
        </div>
      </section>`;
        case 'ui-richtext':
        case 'ui-markdown':
        case 'ui-progress-bar':
        case 'ui-chart':
        case 'ui-barcode':
        case 'ui-calendar':
        case 'ui-audio-player':
        case 'ui-webview':
        case 'ui-static-map':
        case 'ui-google-map':
        case 'ui-ad-banner':
        case 'ui-lottie':
        case 'ui-blur':
        case 'ui-aspect-ratio':
        case 'ui-shader-wrap':
        case 'ui-shader-fill':
        case 'ui-transform':
        case 'ui-media-display':
        case 'ui-rive':
        case 'ui-pdf-viewer':
        case 'ui-language-selector':
        case 'ui-notification-badge':
        case 'ui-mux-broadcast':
        case 'ui-mouse-region':
        case 'ui-tooltip':
        case 'ui-conditional-builder':
        case 'ui-sticky-header':
        case 'ui-draggable':
        case 'ui-drag-target':
        case 'ui-genui-chat':
        case 'ui-list-tile':
        case 'ui-slidable-tile':
        case 'ui-toggle-icon':
        case 'ui-icon-button':
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-3 w-full">
        <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-1.5"${styleAttr}>
          <div className="text-sm font-bold">{textOverrides[${JSON.stringify(b.id)}] ?? ${safeTitle}}</div>
          {${safeSub} && <p className="text-xs opacity-75">{${safeSub}}</p>}
        </div>
      </section>`;
        case 'ui-footer':
          return `      <footer id=${JSON.stringify(elId)} className="w-full mt-auto border-t border-white/10 bg-[#0B0E16]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm opacity-75">
          <span>{${safeTitle}}</span>
          <span>{${safeSub}}</span>
        </div>
      </footer>`;
        default:
          return `      <section id=${JSON.stringify(elId)} className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="p-5 rounded-xl bg-white/5 border border-white/10"${styleAttr}>
          <h3 className="text-base font-bold">{textOverrides[${JSON.stringify(b.id)}] ?? ${safeTitle}}</h3>
          {${safeSub} && <p className="text-sm opacity-75 mt-1">{${safeSub}}</p>}
        </div>
      </section>`;
      }
    })
    .join('\n\n');

  return `import React, { useState } from 'react';

// Generated by BlockCraft Studio WebStudio for "${projectName}" (Animation: ${pageStyle?.liveAnimation || 'none'})
export function GeneratedApp() {
  const [counter, setCounter] = useState<number>(${defaultCounter});
  const [toast, setToast] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [receipt, setReceipt] = useState<{ msg: string; entries: Array<[string, string]> } | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [openModals, setOpenModals] = useState<Record<string, boolean>>({});
  const [hiddenIds, setHiddenIds] = useState<Record<string, boolean>>({});
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>({});
  const [tabIdx, setTabIdx] = useState<Record<string, number>>({});
  const [sidebarIdx, setSidebarIdx] = useState<Record<string, number>>({});
  const [dbRows, setDbRows] = useState<Record<string, Array<{ id: string; data: string }>>>({});
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 3200);
  };

  const handleSubmitForm = (msg: string) => {
    const entries = Object.entries(inputs).filter(([, v]) => Boolean(v));
    setReceipt({ msg, entries });
    showToast(entries.length ? \`Submitted \${entries.length} fields!\` : msg);
  };

  return (
    <main
      className="min-h-screen flex flex-col relative overflow-x-hidden"
      style={{ background: ${JSON.stringify(pageBg)}, color: ${JSON.stringify(pageTextColor)} }}
    >
${jsxBody}
      {receipt && (
        <div className="max-w-3xl mx-auto my-4 p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs space-y-2 w-full">
          <div className="font-bold text-emerald-300">{receipt.msg}</div>
          {receipt.entries.map(([k, v]) => (
            <div key={k} className="font-mono text-white bg-black/30 px-2 py-1 rounded">{k}: {v}</div>
          ))}
        </div>
      )}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white border border-indigo-500/40 text-xs font-semibold shadow-xl">
          {toast}
        </div>
      )}
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

# Generated by BlockCraft Studio WebStudio for "${projectName}"
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
  background: ${b.style?.bgGradient || bg};
  border-radius: ${radius};
  padding: ${pad};${b.style?.borderColor ? `\n  border: 1px solid ${b.style.borderColor};` : ''}${
        b.style?.boxShadow ? `\n  box-shadow: ${b.style.boxShadow};` : ''
      }${b.style?.textShadow ? `\n  text-shadow: ${b.style.textShadow};` : ''}${
        b.style?.textStroke ? `\n  -webkit-text-stroke: ${b.style.textStroke};` : ''
      }${
        b.style?.textGradient
          ? `\n  background-image: ${b.style.textGradient};\n  -webkit-background-clip: text;\n  background-clip: text;\n  -webkit-text-fill-color: transparent;`
          : ''
      }${b.style?.width ? `\n  width: ${b.style.width};` : ''}${
        b.style?.height ? `\n  min-height: ${b.style.height};` : ''
      }${b.style?.margin ? `\n  margin: ${b.style.margin};` : ''}${
        b.style?.isHidden ? '\n  display: none;' : ''
      }
}`;
    })
    .join('\n\n');

  return `/* BlockCraft Studio WebStudio — styles.css for "${projectName}" */
:root {
  --sl-bg: ${pageBg};
  --sl-accent: ${pageAccent};
  --sl-text: ${pageText};
}

*, *::before, *::after {
  box-sizing: border-box;
}

.hidden {
  display: none !important;
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
  const onLoadHats = blocks.filter((b) => b.type === 'logic-onload');
  const onInputHats = blocks.filter((b) => b.type === 'logic-oninput');
  const onSubmitHats = blocks.filter((b) => b.type === 'logic-onsubmit');
  const onKeyHats = blocks.filter((b) => b.type === 'logic-onkey');

  const navCommentLines = blocks
    .filter((b) => b.type === 'ui-navbar')
    .flatMap((b) =>
      getEffectiveNavLinks(b, pages, blocks).map(
        (l) => `// Navbar [${b.name}]: "${l.label}" -> ${l.action}`
      )
    )
    .join('\n');

  return `// BlockCraft Studio WebStudio — Complete Runtime script.js for "${projectName}"
${navCommentLines ? `${navCommentLines}\n` : ''}
window.slRuntime = {
  vars: { score: 0, isLoggedIn: false, userName: 'Creator' },
  lists: { tasks: ['Design Layout', 'Wire Logic', 'Export App'] },
  timers: {},
  authUser: null
};

function slShowToast(message) {
  var old = document.getElementById('sl-runtime-toast');
  if (old) old.remove();
  var toast = document.createElement('div');
  toast.id = 'sl-runtime-toast';
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;background:#111827;color:#f8fafc;border:1px solid rgba(99,102,241,0.5);padding:12px 18px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 12px 30px rgba(0,0,0,0.45);max-width:340px;';
  document.body.appendChild(toast);
  setTimeout(function() { if (toast.parentNode) toast.remove(); }, 3200);
}

function slShowConfirm(title, message, onConfirm) {
  var modal = document.getElementById('sl-confirm-modal');
  if (!modal) { slShowToast(message || title || 'Confirmed'); if (onConfirm) onConfirm(); return; }
  document.getElementById('sl-confirm-title').textContent = title || 'Confirm';
  document.getElementById('sl-confirm-msg').textContent = message || 'Proceed?';
  modal.classList.remove('hidden');
  document.getElementById('sl-confirm-cancel').onclick = function() { modal.classList.add('hidden'); };
  document.getElementById('sl-confirm-ok').onclick = function() { modal.classList.add('hidden'); if (onConfirm) onConfirm(); };
}

function slIncrementCounter(targetId) {
  var el = targetId ? document.getElementById(targetId + '-val') : document.querySelector('[data-sl-counter-val]');
  if (el) {
    var next = Number(el.textContent || 0) + 1;
    el.textContent = String(next);
    window.slRuntime.vars.score = next;
    return true;
  }
  return false;
}

function slResetCounter(targetId) {
  var el = document.getElementById(targetId + '-val');
  if (el) { el.textContent = '0'; window.slRuntime.vars.score = 0; }
}

function slToggleTimer(blockId, finishMsg) {
  var btn = document.getElementById('sl-timer-btn-' + blockId);
  var lbl = document.getElementById('sl-timer-val-' + blockId);
  if (window.slRuntime.timers[blockId]) {
    clearInterval(window.slRuntime.timers[blockId]);
    delete window.slRuntime.timers[blockId];
    if (btn) btn.textContent = 'Start';
    var cur = parseInt((lbl && lbl.textContent) || '10', 10) || 0;
    if (lbl) lbl.textContent = cur + 's · PAUSED';
  } else {
    if (btn) btn.textContent = 'Pause';
    window.slRuntime.timers[blockId] = setInterval(function() {
      var cur = parseInt((lbl && lbl.textContent) || '10', 10) || 0;
      if (cur <= 1) {
        clearInterval(window.slRuntime.timers[blockId]);
        delete window.slRuntime.timers[blockId];
        if (lbl) lbl.textContent = '0s · DONE';
        if (btn) btn.textContent = 'Start';
        slShowToast(finishMsg || 'Timer completed!');
      } else {
        if (lbl) lbl.textContent = (cur - 1) + 's · RUNNING';
      }
    }, 1000);
  }
}

function slResetTimer(blockId) {
  if (window.slRuntime.timers[blockId]) {
    clearInterval(window.slRuntime.timers[blockId]);
    delete window.slRuntime.timers[blockId];
  }
  var lbl = document.getElementById('sl-timer-val-' + blockId);
  var btn = document.getElementById('sl-timer-btn-' + blockId);
  var def = lbl ? (lbl.getAttribute('data-sl-timer-default') || '10') : '10';
  if (lbl) lbl.textContent = def + 's · PAUSED';
  if (btn) btn.textContent = 'Start';
}

function slEvalIf(blockId, leftOp, op, rightOp, thenMsg, elseMsg) {
  var l = Object.prototype.hasOwnProperty.call(window.slRuntime.vars, leftOp) ? String(window.slRuntime.vars[leftOp]) : leftOp;
  var r = Object.prototype.hasOwnProperty.call(window.slRuntime.vars, rightOp) ? String(window.slRuntime.vars[rightOp]) : rightOp;
  var ln = Number(l), rn = Number(r);
  var numeric = l !== '' && r !== '' && !isNaN(ln) && !isNaN(rn);
  var ok = op === '!=' ? (numeric ? ln !== rn : l !== r)
    : op === '>' ? (numeric ? ln > rn : l > r)
    : op === '<' ? (numeric ? ln < rn : l < r)
    : op === '>=' ? (numeric ? ln >= rn : l >= r)
    : op === '<=' ? (numeric ? ln <= rn : l <= r)
    : op === 'contains' ? l.toLowerCase().indexOf(r.toLowerCase()) !== -1
    : (numeric ? ln === rn : l === r);
  var el = document.getElementById('sl-if-msg-' + blockId);
  if (el) el.textContent = ok ? thenMsg : elseMsg;
  slShowToast(ok ? thenMsg : elseMsg);
}

function slRunLoop(count) {
  window.slRuntime.vars.score = Number(window.slRuntime.vars.score || 0) + count;
  slShowToast('Loop executed ' + count + 'x (score=' + window.slRuntime.vars.score + ')');
}

function slApplyVar(blockId, name, op, rawVal) {
  var cur = window.slRuntime.vars[name];
  var nextVal = rawVal;
  if (op === 'toggle') nextVal = !Boolean(cur);
  else if (op === 'change') nextVal = (Number(cur) || 0) + (Number(rawVal) || 1);
  else if (rawVal === 'true') nextVal = true;
  else if (rawVal === 'false') nextVal = false;
  else if (rawVal !== '' && !isNaN(Number(rawVal))) nextVal = Number(rawVal);
  window.slRuntime.vars[name] = nextVal;
  var disp = document.getElementById('sl-var-display-' + blockId);
  if (disp) disp.textContent = name + ' = ' + JSON.stringify(nextVal);
  slShowToast(name + ' = ' + JSON.stringify(nextVal));
}

function slRunList(blockId, listName, op, itemVal) {
  var arr = window.slRuntime.lists[listName] || [];
  if (op === 'create') arr = itemVal ? itemVal.split(',').map(function(s){return s.trim();}).filter(Boolean) : [];
  else if (op === 'remove') arr.pop();
  else if (op === 'get') { slShowToast(listName + '[0] = ' + (arr[0] || '(empty)')); return; }
  else if (op === 'length') { slShowToast('Length = ' + arr.length); return; }
  else arr.push(itemVal);
  window.slRuntime.lists[listName] = arr;
  var disp = document.getElementById('sl-list-display-' + blockId);
  if (disp) disp.textContent = '[' + arr.join(', ') + ']';
  slShowToast('List ' + listName + ' (' + arr.length + ' items)');
}

function slParseObject(jsonStr, key) {
  try {
    var obj = JSON.parse(jsonStr);
    slShowToast(key + ' => ' + JSON.stringify(obj[key]));
  } catch (e) { slShowToast('Invalid JSON payload'); }
}

function slEvalMathText(blockId, op, a, b) {
  var va = Object.prototype.hasOwnProperty.call(window.slRuntime.vars, a) ? String(window.slRuntime.vars[a]) : a;
  var vb = Object.prototype.hasOwnProperty.call(window.slRuntime.vars, b) ? String(window.slRuntime.vars[b]) : b;
  var na = Number(va) || 0, nb = Number(vb) || 0, res = va;
  if (op === 'add') res = String(na + nb);
  else if (op === 'sub') res = String(na - nb);
  else if (op === 'mul') res = String(na * nb);
  else if (op === 'div') res = nb === 0 ? 'Infinity' : String(Number((na / nb).toFixed(4)));
  else if (op === 'round') res = String(Math.round(na));
  else if (op === 'random') res = String(Math.floor(Math.random() * (Math.max(na, nb) - Math.min(na, nb) + 1)) + Math.min(na, nb));
  else if (op === 'join') res = va + (vb ? ' ' + vb : '');
  else if (op === 'length') res = String(va.length);
  else if (op === 'contains') res = String(va.toLowerCase().indexOf(vb.toLowerCase()) !== -1);
  else if (op === 'upper') res = va.toUpperCase();
  else if (op === 'lower') res = va.toLowerCase();
  else if (op === 'format-date') res = new Date().toLocaleString();
  var disp = document.getElementById('sl-math-res-' + blockId);
  if (disp) disp.textContent = 'Result: ' + res;
  slShowToast('Result: ' + res);
}

function slRunStorage(key, op, val) {
  try {
    if (op === 'load') { slShowToast(key + ' = ' + (localStorage.getItem(key) || '(empty)')); }
    else if (op === 'remove') { localStorage.removeItem(key); slShowToast('Removed ' + key); }
    else { localStorage.setItem(key, val); slShowToast('Saved ' + key + '!'); }
  } catch (e) { slShowToast('LocalStorage unavailable'); }
}

function slRunDb(blockId, col, op, jsonVal) {
  var storeKey = 'sl_db_' + col;
  var rows = [];
  try { rows = JSON.parse(localStorage.getItem(storeKey) || '[]'); } catch (e) { rows = []; }
  if (op === 'get') {
    slShowToast('[' + col + '] has ' + rows.length + ' records');
  } else if (op === 'delete') {
    rows.pop();
    localStorage.setItem(storeKey, JSON.stringify(rows));
    slShowToast('Deleted latest doc in [' + col + ']');
  } else {
    var data = { value: jsonVal };
    try { data = JSON.parse(jsonVal); } catch (e) {}
    rows.push({ id: 'doc_' + Date.now().toString(36), data: data });
    localStorage.setItem(storeKey, JSON.stringify(rows));
    slShowToast('Saved to [' + col + '] (' + rows.length + ' total)');
  }
  var el = document.getElementById('sl-db-res-' + blockId);
  if (el) el.textContent = col + ': ' + rows.length + ' records';
}

function slRunAuth(blockId, op, email) {
  var el = document.getElementById('sl-auth-status-' + blockId);
  if (op === 'logout') {
    window.slRuntime.authUser = null;
    localStorage.removeItem('sl_auth_user');
    if (el) el.textContent = 'Signed out';
    slShowToast('Logged out');
  } else if (op === 'current-user') {
    var u = localStorage.getItem('sl_auth_user');
    slShowToast(u ? 'User: ' + u : 'Not signed in');
  } else {
    window.slRuntime.authUser = email;
    localStorage.setItem('sl_auth_user', email);
    if (el) el.textContent = 'Signed in: ' + email;
    slShowToast((op === 'signup' ? 'Registered ' : 'Logged in as ') + email);
  }
}

function slRunDevice(op) {
  if (op === 'vibrate') {
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
    slShowToast('Device vibration triggered!');
  } else if (op === 'camera') {
    slShowToast(navigator.mediaDevices ? 'Camera API supported!' : 'Camera unavailable');
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(pos) { slShowToast('GPS: ' + pos.coords.latitude.toFixed(4) + ', ' + pos.coords.longitude.toFixed(4)); },
      function() { slShowToast('GPS fallback: 6.9271, 79.8612'); }
    );
  }
}

function slRunFetch(blockId, endpoint, method, bodyStr) {
  var box = document.getElementById('sl-fetch-res-' + blockId);
  var opts = { method: method || 'GET', headers: { 'Content-Type': 'application/json' } };
  if (method && method !== 'GET' && method !== 'HEAD' && bodyStr) opts.body = bodyStr;
  fetch(endpoint, opts)
    .then(function(r) { return r.text(); })
    .then(function(txt) {
      if (box) { box.textContent = txt.slice(0, 180); box.classList.remove('hidden'); }
      slShowToast(method + ' ' + endpoint + ' OK');
    })
    .catch(function() {
      var fallback = JSON.stringify({ status: 200, simulated: true, method: method, endpoint: endpoint });
      if (box) { box.textContent = fallback; box.classList.remove('hidden'); }
      slShowToast('Called ' + method + ' ' + endpoint);
    });
}

function slReadInputVal(inp) {
  if (!inp) return '';
  if (inp.type === 'radio') {
    var checked = document.querySelector('input[name="' + inp.name + '"]:checked');
    return checked ? checked.value : '';
  }
  if (inp.type === 'checkbox') return inp.checked ? 'true' : 'false';
  return (inp.value || '').trim();
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('BlockCraft Studio WebStudio app booted:', ${JSON.stringify(projectName)});

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

  document.querySelectorAll('.sl-sidebar-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var group = btn.getAttribute('data-sl-sidebar');
      document.querySelectorAll('[data-sl-sidebar="' + group + '"]').forEach(function(other) {
        other.className = 'sl-sidebar-btn w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer text-slate-300 hover:bg-white/10';
      });
      btn.className = 'sl-sidebar-btn w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer bg-indigo-600/30 text-white border border-indigo-400/40 font-semibold';
    });
  });

  document.querySelectorAll('.sl-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var grp = btn.getAttribute('data-sl-tab-group');
      var tabName = btn.getAttribute('data-sl-tab') || 'Tab';
      var panelTxt = btn.getAttribute('data-sl-panel') || '';
      document.querySelectorAll('[data-sl-tab-group="' + grp + '"]').forEach(function(b) {
        b.className = 'sl-tab-btn px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-slate-400 hover:text-white';
      });
      btn.className = 'sl-tab-btn px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors bg-indigo-600 text-white';
      var panelEl = document.getElementById('sl-tab-panel-' + grp);
      if (panelEl) {
        panelEl.innerHTML = '<strong class="text-sky-300">' + tabName.replace(/</g, '&lt;') + ':</strong> ' + panelTxt.replace(/</g, '&lt;');
      }
    });
  });

  document.querySelectorAll('.sl-file-input').forEach(function(inp) {
    inp.addEventListener('change', function() {
      var file = inp.files && inp.files[0];
      var boxId = inp.getAttribute('data-sl-upload-preview');
      var box = boxId ? document.getElementById(boxId) : null;
      if (!file || !box) return;
      box.classList.remove('hidden');
      box.innerHTML = '';
      if (file.type && file.type.indexOf('image/') === 0) {
        var img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.style.cssText = 'max-height:140px;width:100%;object-fit:cover;border-radius:8px;margin-bottom:6px;';
        box.appendChild(img);
      }
      var txt = document.createElement('div');
      txt.textContent = 'Uploaded: ' + file.name + ' (' + Math.max(1, Math.round(file.size / 1024)) + ' KB)';
      box.appendChild(txt);
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
      if (action === 'scroll-to-block') {
        var sec = targetId ? document.getElementById('sl-el-' + targetId) : document.querySelector('[id^="sl-el-"]');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (action === 'open-modal') {
        var m = targetId ? document.getElementById(targetId + '-modal') : document.querySelector('[data-sl-modal]');
        if (m) m.classList.remove('hidden');
        return;
      }
      if (action === 'close-modal') {
        var m2 = targetId ? document.getElementById(targetId + '-modal') : document.querySelector('[data-sl-modal]');
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
      if (action === 'change-text' && targetId) {
        var txtTarget = document.querySelector('[data-sl-text-target="' + targetId + '"]') || document.getElementById('sl-el-' + targetId);
        if (txtTarget) txtTarget.textContent = payload || 'Updated Text!';
        return;
      }
      if (action === 'set-style' && targetId) {
        var sEl = document.getElementById('sl-el-' + targetId);
        if (sEl) sEl.style[btn.dataset.styleProp || 'backgroundColor'] = btn.dataset.styleVal || '#312e81';
        return;
      }
      if (action === 'add-class' && targetId) {
        var aEl = document.getElementById('sl-el-' + targetId);
        (btn.dataset.cssClass || '').split(/\\s+/).filter(Boolean).forEach(function(c) { if (aEl) aEl.classList.add(c); });
        return;
      }
      if (action === 'remove-class' && targetId) {
        var rEl = document.getElementById('sl-el-' + targetId);
        (btn.dataset.cssClass || '').split(/\\s+/).filter(Boolean).forEach(function(c) { if (rEl) rEl.classList.remove(c); });
        return;
      }
      if (action === 'toggle-disabled') {
        var dTarget = targetId ? document.querySelector('#sl-el-' + targetId + ' button') : document.querySelector('.sl-action-btn');
        if (dTarget) dTarget.disabled = !dTarget.disabled;
        return;
      }
      if (action === 'copy-clipboard') {
        navigator.clipboard && navigator.clipboard.writeText(payload || document.title);
        slShowToast('Copied to clipboard!');
        return;
      }
      if (action === 'console-log') {
        console.log(payload || 'BlockCraft Studio Event');
        slShowToast('Logged: ' + (payload || 'Event'));
        return;
      }
      if (action === 'show-confirm') {
        slShowConfirm('Confirm Action', payload || 'Are you sure you want to proceed?', function() { slShowToast('Confirmed!'); });
        return;
      }
      if (action === 'clear-form') {
        document.querySelectorAll('[data-sl-input-id]').forEach(function(inp) {
          if (inp.type === 'checkbox') inp.checked = false;
          else if (inp.type !== 'radio') inp.value = '';
        });
        slShowToast('Form cleared');
        return;
      }
      if (action === 'validate-input') {
        var vInp = targetId ? document.querySelector('[data-sl-input-id="' + targetId + '"]') : document.querySelector('[data-sl-input-id]');
        var val = slReadInputVal(vInp);
        var rule = btn.dataset.validationRule || 'not-empty';
        var valid = rule === 'email' ? /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(val)
          : rule === 'min-length' ? val.length >= 6
          : val.length > 0;
        slShowToast(valid ? 'Field is valid!' : 'Validation failed (' + rule + ')');
        return;
      }
      if (action === 'get-input-value') {
        var gInp = targetId ? document.querySelector('[data-sl-input-id="' + targetId + '"]') : document.querySelector('[data-sl-input-id]');
        var gVal = slReadInputVal(gInp);
        var gVar = btn.dataset.varName || 'inputValue';
        window.slRuntime.vars[gVar] = gVal;
        slShowToast('Read ' + gVar + ' = "' + gVal + '"');
        return;
      }
      if (action === 'set-input-value') {
        var sInp = targetId ? document.querySelector('[data-sl-input-id="' + targetId + '"]') : document.querySelector('[data-sl-input-id]');
        if (sInp) sInp.value = payload || 'Hello from BlockCraft Studio';
        return;
      }
      if (action === 'set-variable') {
        var vn = btn.dataset.varName || 'score';
        var vv = btn.dataset.varValue || payload || '1';
        window.slRuntime.vars[vn] = vv;
        slShowToast('Set ' + vn + ' = ' + vv);
        return;
      }
      if (action === 'toggle-boolean') {
        var bn = btn.dataset.varName || 'isLoggedIn';
        window.slRuntime.vars[bn] = !Boolean(window.slRuntime.vars[bn]);
        slShowToast('Toggled ' + bn + ' = ' + window.slRuntime.vars[bn]);
        return;
      }
      if (action === 'list-add') {
        var ln = btn.dataset.listName || 'tasks';
        var lv = btn.dataset.varValue || payload || 'New Task';
        window.slRuntime.lists[ln] = (window.slRuntime.lists[ln] || []).concat([lv]);
        slShowToast('Added "' + lv + '" to ' + ln);
        return;
      }
      if (action === 'list-remove') {
        var ln2 = btn.dataset.listName || 'tasks';
        if (window.slRuntime.lists[ln2]) window.slRuntime.lists[ln2].pop();
        slShowToast('Removed last item from ' + ln2);
        return;
      }
      if (action === 'submit-form') {
        var seen = {};
        var values = Array.from(document.querySelectorAll('[data-sl-input-id]'))
          .map(function(inp) {
            var id = inp.getAttribute('data-sl-input-id');
            if (seen[id]) return '';
            seen[id] = true;
            var val = slReadInputVal(inp);
            if (!val) return '';
            return (inp.getAttribute('data-sl-input-label') || 'Field') + ': ' + val;
          })
          .filter(Boolean);
        slShowToast(payload || (values.length ? 'Submitted -> ' + values.join(' | ') : 'Form submitted successfully!'));
        ${onSubmitHats.map((h) => `console.log(${JSON.stringify(`OnSubmit: ${h.actionPayload || h.name}`)});`).join('\n        ')}
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
        slRunStorage(btn.dataset.storageKey || 'sl_user_data', 'save', payload || btn.dataset.varValue || 'saved');
        return;
      }
      if (action === 'call-api') {
        slRunFetch(btn.dataset.blockId || 'api', endpoint, method, btn.dataset.body || '');
        return;
      }
      if (action === 'alert') { slShowToast(payload || 'Action executed!'); return; }
      if (!slIncrementCounter(targetId)) {
        slShowToast(payload || 'Button clicked!');
      }
    });
  });

  ${onLoadHats.map((h) => `slShowToast(${JSON.stringify(h.actionPayload || `${h.name} loaded!`)});`).join('\n  ')}
  ${onInputHats
    .map(
      (h) =>
        `document.querySelectorAll(${JSON.stringify(
          h.targetId ? `[data-sl-input-id="${h.targetId}"]` : '[data-sl-input-id]'
        )}).forEach(function(inp){ inp.addEventListener('input', function(){ ${
          h.logicConfig?.varName
            ? `window.slRuntime.vars[${JSON.stringify(h.logicConfig.varName)}] = inp.value;`
            : `console.log('Input changed:', inp.value);`
        } }); });`
    )
    .join('\n  ')}
  ${onKeyHats
    .map(
      (h) =>
        `document.addEventListener('keydown', function(e){ var k = e.key === ' ' ? 'Space' : e.key; if (k === ${JSON.stringify(
          h.triggerKey || 'Enter'
        )}) { slShowToast(${JSON.stringify(h.actionPayload || `Key [${h.triggerKey || 'Enter'}] triggered!`)}); } });`
    )
    .join('\n  ')}
});
`;
}
