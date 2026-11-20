import React, { useState } from 'react';
import {
  Zap,
  ChevronDown,
  ChevronUp,
  Server,
  Play,
  RotateCcw,
  User,
  Image as ImageIcon,
  Check,
  Clock,
} from 'lucide-react';
import {
  CanvasBlock,
  NavbarLinkItem,
  PageStyleSettings,
  SitePage,
} from '../../types/builder';
import { LiveBackgroundLayer } from './LiveBackgroundLayer';
import {
  isLightPageBackground,
  resolvePageBackgroundCss,
} from '../../utils/pageStylePresets';
import { getEffectiveNavLinks } from '../../utils/navLinkHelpers';

interface WebPreviewRendererProps {
  blocks: CanvasBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onTriggerAction: (block: CanvasBlock, formValues?: Record<string, string>) => void;
  onTriggerNavLink?: (navBlock: CanvasBlock, link: NavbarLinkItem) => void;
  onUpdateBlock: (block: CanvasBlock) => void;
  accentHex?: string;
  pages?: SitePage[];
  onSelectPage?: (pageId: string) => void;
  pageStyle?: PageStyleSettings;
}

const FONT_SIZE_MAP: Record<string, string> = {
  xs: 'text-xs',
  sm: 'text-xs',
  base: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
  '2xl': 'text-xl',
  '3xl': 'text-2xl',
  '4xl': 'text-3xl',
};

const FONT_WEIGHT_MAP: Record<string, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
};

const FONT_FAMILY_CSS: Record<string, string> = {
  sans: 'Inter, system-ui, -apple-system, sans-serif',
  serif: "Georgia, Cambria, 'Times New Roman', serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
  display: "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif",
  rounded: "'Nunito', 'Quicksand', 'Segoe UI', system-ui, sans-serif",
};

const TEXT_COLOR_MAP: Record<string, string> = {
  'text-white': 'text-white',
  'text-slate-300': 'text-slate-300',
  'text-indigo-400': 'text-indigo-400',
  'text-emerald-400': 'text-emerald-400',
  'text-amber-300': 'text-amber-300',
  'text-rose-400': 'text-rose-400',
  'text-sky-400': 'text-sky-400',
};

const BG_COLOR_MAP: Record<string, string> = {
  'bg-transparent': 'bg-transparent',
  'bg-white/5': 'bg-white/[0.04]',
  'bg-[#161B26]': 'bg-[#161B26]',
  'bg-indigo-600': 'bg-indigo-600',
  'bg-indigo-950/40': 'bg-indigo-950/40',
  'bg-emerald-950/30': 'bg-emerald-950/30',
  'bg-rose-950/30': 'bg-rose-950/30',
  'bg-amber-950/25': 'bg-amber-950/25',
};

const RADIUS_MAP: Record<string, string> = {
  'rounded-none': 'rounded-none',
  'rounded-lg': 'rounded-lg',
  'rounded-xl': 'rounded-xl',
  'rounded-2xl': 'rounded-2xl',
  'rounded-full': 'rounded-full',
};

const PADDING_MAP: Record<string, string> = {
  'p-0': 'p-0',
  'p-2': 'p-2',
  'p-3': 'p-3',
  'p-4': 'p-4',
  'p-5': 'p-5',
  'py-3 px-6': 'py-3 px-6',
  'py-4 px-2': 'py-4 px-2',
};

export const WebPreviewRenderer: React.FC<WebPreviewRendererProps> = ({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onTriggerAction,
  onTriggerNavLink,
  onUpdateBlock,
  accentHex = '#4D97FF',
  pages,
  onSelectPage,
  pageStyle,
}) => {
  const [apiResponses, setApiResponses] = useState<Record<string, string>>({});
  const [formInputs, setFormInputs] = useState<Record<string, string>>({});

  const pageBgCss = resolvePageBackgroundCss(pageStyle);
  const isLightPage = isLightPageBackground(pageStyle);
  const pageTextColor = pageStyle?.textColor || (isLightPage ? '#0f172a' : '#f1f5f9');
  const resolvedAccent = pageStyle?.accentColor || accentHex;

  if (blocks.length === 0) {
    return (
      <div
        className="relative h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 overflow-hidden"
        style={{ background: pageBgCss, color: pageTextColor }}
      >
        <LiveBackgroundLayer pageStyle={pageStyle} />
        <div className="relative z-10">
          <p className="text-xs font-semibold">Empty Web Page</p>
          <p className="text-[11px] opacity-70 mt-1 max-w-xs">
            Click or drag any block from the HTML toolbox to populate this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-full flex flex-col overflow-hidden"
      style={{ background: pageBgCss, color: pageTextColor }}
    >
      <LiveBackgroundLayer pageStyle={pageStyle} />
      <div className="relative z-10 min-h-full flex flex-col flex-1">
      {blocks.map((block) => {
        const isSelected = block.id === selectedBlockId;
        const isEdgeToEdge = block.type === 'ui-navbar' || block.type === 'ui-footer';
        const alignClass =
          block.style?.textAlign === 'center'
            ? 'text-center'
            : block.style?.textAlign === 'right'
            ? 'text-right'
            : 'text-left';

        const customTextColor =
          !block.style?.customTextHex && block.style?.textColor
            ? TEXT_COLOR_MAP[block.style.textColor] || ''
            : '';
        const customBg =
          !block.style?.customBgHex && block.style?.bgColor
            ? BG_COLOR_MAP[block.style.bgColor] || ''
            : '';
        const customRadius = block.style?.borderRadius
          ? RADIUS_MAP[block.style.borderRadius] || 'rounded-xl'
          : 'rounded-xl';
        const customPad = block.style?.padding ? PADDING_MAP[block.style.padding] || '' : '';
        const customFont = block.style?.fontSize ? FONT_SIZE_MAP[block.style.fontSize] || '' : '';
        const customWeight = block.style?.fontWeight
          ? FONT_WEIGHT_MAP[block.style.fontWeight] || ''
          : '';
        const fontFamilyValue = block.style?.fontFamily
          ? FONT_FAMILY_CSS[block.style.fontFamily]
          : undefined;

        const primaryStyle: React.CSSProperties = {
          ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
          ...(block.style?.customTextHex ? { color: block.style.customTextHex } : {}),
          ...(block.style?.textShadow ? { textShadow: block.style.textShadow } : {}),
          ...(block.style?.textStroke ? { WebkitTextStroke: block.style.textStroke } : {}),
          ...(block.style?.textGradient
            ? {
                backgroundImage: block.style.textGradient,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }
            : {}),
        };

        const subtitleStyle: React.CSSProperties = {
          ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
          ...(block.style?.subtitleColorHex ? { color: block.style.subtitleColorHex } : {}),
        };

        const surfaceStyle: React.CSSProperties = {
          ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
          ...(block.style?.customBgHex && !block.style?.bgGradient
            ? { backgroundColor: block.style.customBgHex }
            : {}),
          ...(block.style?.bgGradient ? { background: block.style.bgGradient } : {}),
          ...(block.style?.borderColor ? { borderColor: block.style.borderColor } : {}),
          ...(block.style?.boxShadow ? { boxShadow: block.style.boxShadow } : {}),
        };

        const hasExplicitBg = Boolean(
          block.style?.customBgHex ||
            block.style?.bgGradient ||
            (customBg && customBg !== 'bg-transparent')
        );

        const wrapperClass = `relative transition-all cursor-pointer ${
          block.type === 'ui-footer' ? 'mt-auto w-full' : 'w-full'
        } ${
          isEdgeToEdge
            ? isSelected
              ? 'ring-2 ring-inset ring-[#4D97FF]'
              : 'hover:ring-1 hover:ring-inset hover:ring-white/20'
            : `${customRadius} ${
                isSelected
                  ? 'ring-2 ring-inset ring-[#4D97FF]'
                  : 'hover:bg-white/[0.015]'
              }`
        }`;

        const effectiveNavLinks =
          block.type === 'ui-navbar'
            ? getEffectiveNavLinks(block, pages, blocks)
            : [];

        return (
          <div
            key={block.id}
            id={`sl-el-${block.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectBlock(block.id);
            }}
            className={wrapperClass}
          >
            {/* 1. NAVBAR (Full-bleed sticky site header) */}
            {block.type === 'ui-navbar' && (
              <header
                style={surfaceStyle}
                className={`w-full ${customPad || 'px-5 py-3'} ${
                  customBg || (isLightPage ? 'bg-white/85 border-slate-200' : 'bg-[#0D111A]/85 border-white/10')
                } border-b backdrop-blur-md flex items-center justify-between gap-3`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="px-1.5 min-w-[22px] h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: resolvedAccent }}
                  >
                    {block.badgeText || 'SL'}
                  </div>
                  <span
                    style={primaryStyle}
                    className={`${customFont || 'text-sm'} ${customWeight || 'font-bold'} ${
                      customTextColor || (isLightPage ? 'text-slate-900' : 'text-white')
                    } truncate`}
                  >
                    {block.content}
                  </span>
                </div>
                <nav className="flex items-center gap-3 overflow-x-auto">
                  {effectiveNavLinks.map((link) => (
                    <button
                      key={link.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onTriggerNavLink) {
                          onTriggerNavLink(block, link);
                        } else if (link.action === 'navigate-page' && link.targetPageId) {
                          onSelectPage?.(link.targetPageId);
                        }
                      }}
                      style={subtitleStyle}
                      title={
                        link.action === 'navigate-page'
                          ? 'Click to open page'
                          : link.action === 'scroll-to-block'
                          ? 'Click to scroll to section'
                          : link.action === 'open-url'
                          ? link.url || 'External link'
                          : 'Click navbar button'
                      }
                      className={`text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors hover:underline underline-offset-4 ${
                        isLightPage
                          ? 'text-slate-600 hover:text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>
              </header>
            )}

            {/* 2. HEADING / HERO */}
            {block.type === 'ui-heading' && (
              <section
                style={surfaceStyle}
                className={`${customPad || 'px-5 py-7'} ${
                  hasExplicitBg && customBg !== 'bg-white/[0.04]'
                    ? `${customBg} mx-4 my-2 ${customRadius} border border-white/10`
                    : ''
                } space-y-2 ${alignClass}`}
              >
                <h1
                  style={primaryStyle}
                  className={`${customFont || 'text-2xl'} ${
                    customWeight || 'font-extrabold'
                  } tracking-tight ${
                    customTextColor || (isLightPage ? 'text-slate-900' : 'text-white')
                  } leading-tight`}
                >
                  {block.content}
                </h1>
                {block.subtitle && (
                  <p
                    style={subtitleStyle}
                    className={`text-xs leading-relaxed max-w-2xl mx-auto ${
                      isLightPage ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {block.subtitle}
                  </p>
                )}
              </section>
            )}

            {/* 3. PARAGRAPH */}
            {block.type === 'ui-paragraph' && (
              <section className="px-5 py-2.5">
                <div
                  style={surfaceStyle}
                  className={`${
                    hasExplicitBg
                      ? `${customPad || 'p-4'} ${customRadius} ${customBg} border ${
                          isLightPage ? 'border-slate-200' : 'border-white/10'
                        }`
                      : customPad || 'py-1'
                  } ${alignClass} space-y-1`}
                >
                  <p
                    style={primaryStyle}
                    className={`${customFont || 'text-sm'} ${customWeight || 'font-normal'} ${
                      customTextColor || (isLightPage ? 'text-slate-700' : 'text-slate-200')
                    } leading-relaxed`}
                  >
                    {block.content}
                  </p>
                  {block.subtitle && (
                    <p
                      style={subtitleStyle}
                      className={`text-xs ${isLightPage ? 'text-slate-500' : 'text-slate-400'}`}
                    >
                      {block.subtitle}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* 4. BADGE / KICKER */}
            {block.type === 'ui-badge' && (
              <div style={surfaceStyle} className={`px-5 pt-4 pb-1 ${customBg} ${alignClass}`}>
                <span
                  style={primaryStyle}
                  className={`${customFont || 'text-[11px]'} ${
                    customWeight || 'font-semibold'
                  } font-mono uppercase ${customTextColor || 'text-indigo-400'} tracking-widest`}
                >
                  {block.content}
                </span>
              </div>
            )}

            {/* 5. KPI STAT */}
            {block.type === 'ui-stat' && (
              <div className="px-5 py-1.5">
                <div
                  style={surfaceStyle}
                  className={`${customPad || 'p-3.5'} ${customRadius} ${
                    customBg || 'bg-white/[0.04]'
                  } border border-white/10 ${alignClass}`}
                >
                  <div style={subtitleStyle} className="text-[10px] font-mono text-slate-400">
                    {block.statLabel ?? block.subtitle ?? block.name}
                  </div>
                  <div
                    style={primaryStyle}
                    className={`${customFont || 'text-xl'} ${customWeight || 'font-extrabold'} ${
                      customTextColor || 'text-white'
                    } tabular-nums mt-0.5`}
                  >
                    {block.statValue ?? block.content}
                  </div>
                </div>
              </div>
            )}

            {/* 6. CARD */}
            {block.type === 'ui-card' && (
              <div className="px-5 py-1.5">
                <div
                  style={surfaceStyle}
                  className={`${customPad || 'p-3.5'} ${customRadius} ${
                    customBg || 'bg-white/[0.04]'
                  } border border-white/10 space-y-1 ${alignClass}`}
                >
                  <h3
                    style={primaryStyle}
                    className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                      customTextColor || 'text-white'
                    }`}
                  >
                    {block.content}
                  </h3>
                  {block.subtitle && (
                    <p style={subtitleStyle} className="text-[11px] text-slate-400 leading-relaxed">
                      {block.subtitle}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 7. PRICING */}
            {block.type === 'ui-pricing' && (
              <div className="px-5 py-1.5">
                <div
                  style={surfaceStyle}
                  className={`${customPad || 'p-4'} ${customRadius} ${
                    customBg || 'bg-gradient-to-br from-indigo-950/50 to-slate-900'
                  } border border-indigo-500/25 space-y-2 ${alignClass}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      style={primaryStyle}
                      className={`${customFont || 'text-sm'} ${customWeight || 'font-bold'} ${
                        customTextColor || 'text-white'
                      }`}
                    >
                      {block.content}
                    </h3>
                    <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                      {block.badgeText || 'PRO'}
                    </span>
                  </div>
                  {block.subtitle && (
                    <p style={subtitleStyle} className="text-xs text-slate-300">
                      {block.subtitle}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 8. TESTIMONIAL */}
            {block.type === 'ui-testimonial' && (
              <div className="px-5 py-1.5">
                <div
                  style={surfaceStyle}
                  className={`${customPad || 'p-3.5'} ${customRadius} ${
                    customBg || 'bg-white/[0.04]'
                  } border border-white/10 space-y-2 ${alignClass}`}
                >
                  <p
                    style={primaryStyle}
                    className={`${customFont || 'text-xs'} ${customWeight || 'font-normal'} ${
                      customTextColor || 'text-slate-200'
                    } italic leading-relaxed`}
                  >
                    &ldquo;{block.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p
                        style={subtitleStyle}
                        className="text-[11px] font-bold text-white truncate"
                      >
                        {block.subtitle || 'Verified Engineer'}
                      </p>
                      {block.authorRole && (
                        <p className="text-[10px] text-slate-400 truncate">{block.authorRole}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 9. ACCORDION */}
            {block.type === 'ui-accordion' && (
              <div className="px-5 py-1.5">
                <div
                  style={surfaceStyle}
                  className={`${customRadius} ${
                    customBg || 'bg-white/[0.04]'
                  } border border-white/10 overflow-hidden`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBlock(block.id);
                      onUpdateBlock({ ...block, isExpanded: !block.isExpanded });
                    }}
                    className={`w-full ${customPad || 'p-3'} text-left flex items-center justify-between gap-2 ${
                      customFont || 'text-xs'
                    } ${customWeight || 'font-semibold'} ${
                      customTextColor || 'text-white'
                    } cursor-pointer`}
                    style={primaryStyle}
                  >
                    <span>{block.content}</span>
                    {block.isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {block.isExpanded && block.subtitle && (
                    <div
                      style={subtitleStyle}
                      className="px-3 pb-3 text-[11px] text-slate-400 leading-relaxed border-t border-white/5 pt-2"
                    >
                      {block.subtitle}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 10. BUTTON */}
            {block.type === 'ui-button' && (
              <div className={`px-5 py-2 ${alignClass}`}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBlock(block.id);
                    onTriggerAction(block, formInputs);
                  }}
                  style={{
                    ...(block.buttonVariant === 'primary' &&
                    !block.style?.customBgHex &&
                    !block.style?.bgGradient &&
                    (!customBg || customBg === 'bg-indigo-600')
                      ? { backgroundColor: resolvedAccent }
                      : {}),
                    ...(block.style?.customBgHex && !block.style?.bgGradient
                      ? { backgroundColor: block.style.customBgHex }
                      : {}),
                    ...(block.style?.bgGradient ? { background: block.style.bgGradient } : {}),
                    ...(block.style?.borderColor
                      ? { borderColor: block.style.borderColor, borderWidth: '1px', borderStyle: 'solid' }
                      : {}),
                    ...(block.style?.boxShadow ? { boxShadow: block.style.boxShadow } : {}),
                    ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
                    ...(block.style?.customTextHex && !block.style?.textGradient
                      ? { color: block.style.customTextHex }
                      : {}),
                  }}
                  className={`px-5 py-2 ${customRadius} ${customFont || 'text-xs'} ${
                    customWeight || 'font-semibold'
                  } inline-flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer ${
                    block.buttonVariant === 'outline' && !block.style?.bgGradient
                      ? `border border-white/25 bg-transparent ${customTextColor || 'text-white'} hover:bg-white/10`
                      : block.buttonVariant === 'danger' && !block.style?.bgGradient
                      ? `bg-rose-600 hover:bg-rose-500 ${customTextColor || 'text-white'}`
                      : `${customBg || ''} ${customTextColor || 'text-white'} hover:opacity-95`
                  }`}
                >
                  {!(block.content || '').trim().startsWith('⚡') && (
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span style={primaryStyle}>{block.content}</span>
                </button>
              </div>
            )}

            {/* 11. INPUT & TEXTAREA */}
            {(block.type === 'ui-input' || block.type === 'ui-textarea') && (
              <div className="px-5 py-1.5">
                <div
                  style={surfaceStyle}
                  className={`${customPad || 'p-3'} ${customRadius} ${
                    customBg || 'bg-white/[0.04]'
                  } border border-white/10 space-y-1.5 ${alignClass}`}
                >
                  {block.subtitle && (
                    <label
                      style={subtitleStyle}
                      className="block text-[10px] font-semibold text-slate-400"
                    >
                      {block.subtitle}
                    </label>
                  )}
                  {block.type === 'ui-textarea' ? (
                    <textarea
                      rows={2}
                      value={formInputs[block.id] ?? ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        setFormInputs((prev) => ({ ...prev, [block.id]: e.target.value }))
                      }
                      style={primaryStyle}
                      placeholder={block.content}
                      className={`w-full rounded-lg bg-[#0B0F17] border border-white/15 px-2.5 py-1.5 ${
                        customFont || 'text-xs'
                      } ${customTextColor || 'text-white'} placeholder-slate-500 outline-none focus:border-[#4D97FF]`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={formInputs[block.id] ?? ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        setFormInputs((prev) => ({ ...prev, [block.id]: e.target.value }))
                      }
                      style={primaryStyle}
                      placeholder={block.content}
                      className={`w-full rounded-lg bg-[#0B0F17] border border-white/15 px-2.5 py-1.5 ${
                        customFont || 'text-xs'
                      } ${customTextColor || 'text-white'} placeholder-slate-500 outline-none focus:border-[#4D97FF]`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* 12. MEDIA IMAGE / AVATAR */}
            {block.type === 'ui-image' && (
              <div className="px-5 py-1.5">
                <div
                  style={surfaceStyle}
                  className={`${customPad || 'p-4'} ${customRadius} ${
                    customBg || 'bg-gradient-to-br from-slate-900 to-[#111827]'
                  } border border-white/10 flex flex-col items-center justify-center ${alignClass} gap-1.5 min-h-[100px] overflow-hidden`}
                >
                  {block.imageUrl ? (
                    <img
                      src={block.imageUrl}
                      alt={block.content}
                      className="w-full max-h-40 object-cover rounded-lg mb-1"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-sky-400" />
                  )}
                  <p
                    style={primaryStyle}
                    className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                      customTextColor || 'text-white'
                    }`}
                  >
                    {block.content}
                  </p>
                  {block.subtitle && (
                    <p style={subtitleStyle} className="text-[10px] text-slate-400">
                      {block.subtitle}
                    </p>
                  )}
                </div>
              </div>
            )}

            {block.type === 'ui-avatar' && (
              <div className="px-5 py-1.5">
                <div
                  style={surfaceStyle}
                  className={`${customPad || 'p-3'} ${customRadius} ${
                    customBg || 'bg-white/[0.04]'
                  } border border-white/10 flex items-center gap-3`}
                >
                  <div className="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      style={primaryStyle}
                      className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                        customTextColor || 'text-white'
                      } truncate`}
                    >
                      {block.content}
                    </p>
                    {block.subtitle && (
                      <p style={subtitleStyle} className="text-[10px] text-slate-400 truncate">
                        {block.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 13. LOGIC COUNTER */}
            {block.type === 'logic-counter' && (
              <div className="px-5 py-1.5">
                <div
                  style={surfaceStyle}
                  className={`${customPad || 'p-4'} ${customRadius} ${
                    customBg || 'bg-indigo-950/35'
                  } border border-indigo-500/30 flex items-center justify-between gap-3`}
                >
                  <div>
                    <div style={subtitleStyle} className="text-[10px] font-mono text-indigo-300 font-semibold">
                      {block.content || block.name}
                    </div>
                    <div
                      style={primaryStyle}
                      className={`${customFont || 'text-xl'} ${customWeight || 'font-extrabold'} ${
                        customTextColor || 'text-white'
                      } font-mono tabular-nums`}
                    >
                      {block.counterValue ?? 0}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextVal = (block.counterValue ?? 0) + 1;
                        onUpdateBlock({
                          ...block,
                          counterValue: nextVal,
                          content: `Clicks Registered: ${nextVal}`,
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateBlock({
                          ...block,
                          counterValue: 0,
                          content: 'Clicks Registered: 0',
                        });
                      }}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
                      title="Reset counter"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 14. LOGIC TOGGLE / CLICK / TIMER */}
            {block.type === 'logic-toggle' && (
              <div className="px-5 py-1.5">
                <div
                  style={surfaceStyle}
                  className={`${customPad || 'p-3'} ${customRadius} ${
                    customBg || 'bg-amber-950/20'
                  } border border-amber-500/25 flex items-center justify-between gap-2`}
                >
                  <div className="min-w-0">
                    <p
                      style={primaryStyle}
                      className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                        customTextColor || 'text-white'
                      } truncate`}
                    >
                      {block.content}
                    </p>
                    <p style={subtitleStyle} className="text-[10px] text-amber-300">
                      {block.subtitle ? `${block.subtitle} · ` : ''}
                      State: {block.isExpanded ? 'ENABLED' : 'DISABLED'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateBlock({ ...block, isExpanded: !block.isExpanded });
                    }}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      block.isExpanded ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        block.isExpanded ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {block.type === 'logic-click' && (
              <div className="px-5 py-1.5">
                <div
                  style={surfaceStyle}
                  className={`${customPad || 'p-3'} ${customRadius} ${
                    customBg || 'bg-amber-950/20'
                  } border border-amber-500/25 flex items-center justify-between gap-2`}
                >
                  <div className="min-w-0">
                    <p
                      style={primaryStyle}
                      className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                        customTextColor || 'text-white'
                      } truncate`}
                    >
                      {block.content}
                    </p>
                    {block.subtitle && (
                      <p style={subtitleStyle} className="text-[10px] text-slate-400 truncate">
                        {block.subtitle}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTriggerAction(block, formInputs);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-bold cursor-pointer shrink-0"
                  >
                    {block.badgeText || 'Fire'}
                  </button>
                </div>
              </div>
            )}

            {block.type === 'logic-timer' && (
              <div className="px-5 py-1.5">
                <div
                  style={surfaceStyle}
                  className={`${customPad || 'p-3'} ${customRadius} ${
                    customBg || 'bg-amber-950/20'
                  } border border-amber-500/25 flex items-center justify-between gap-2`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <div>
                      <p
                        style={primaryStyle}
                        className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                          customTextColor || 'text-white'
                        }`}
                      >
                        {block.content}
                      </p>
                      <p style={subtitleStyle} className="text-[10px] font-mono text-amber-300 tabular-nums">
                        {block.counterValue ?? 60}s {block.subtitle || 'remaining'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateBlock({
                        ...block,
                        counterValue: Math.max(0, (block.counterValue ?? 60) - 5),
                      });
                    }}
                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-mono text-white cursor-pointer"
                  >
                    -5s
                  </button>
                </div>
              </div>
            )}

            {/* 15. BACKEND FLASK / FETCH */}
            {(block.type === 'backend-flask' ||
              block.type === 'backend-fetch' ||
              block.type === 'backend-blockly') && (
              <div className="px-5 py-1.5">
                <div
                  style={surfaceStyle}
                  className={`${customPad || 'p-3'} ${customRadius} ${
                    customBg || 'bg-emerald-950/25'
                  } border border-emerald-500/30 space-y-2`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Server className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span
                        style={primaryStyle}
                        className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} font-mono ${
                          customTextColor || 'text-emerald-300'
                        } truncate`}
                      >
                        {block.content}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const endpoint = block.apiEndpoint || '/api/v1/metrics';
                        setApiResponses((prev) => ({
                          ...prev,
                          [block.id]: JSON.stringify(
                            {
                              status: 200,
                              endpoint,
                              uptime: '99.98%',
                              timestamp: new Date().toLocaleTimeString(),
                            },
                            null,
                            0
                          ),
                        }));
                      }}
                      className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" /> Test
                    </button>
                  </div>
                  {block.subtitle && (
                    <p style={subtitleStyle} className="text-[10px] text-slate-400">
                      {block.subtitle}
                    </p>
                  )}
                  {apiResponses[block.id] && (
                    <div className="p-2 rounded bg-[#05070B] border border-emerald-500/20 text-[10px] font-mono text-emerald-300 break-all flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{apiResponses[block.id]}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 16. FOOTER (Full-bleed site footer) */}
            {block.type === 'ui-footer' && (
              <footer
                style={surfaceStyle}
                className={`w-full ${customPad || 'px-5 py-4'} ${
                  customBg || (isLightPage ? 'bg-white/80 border-slate-200' : 'bg-[#0B0E16]/85 border-white/10')
                } border-t backdrop-blur-md flex flex-wrap items-center justify-between gap-2 ${
                  customFont || 'text-[11px]'
                } ${customWeight || 'font-normal'} ${
                  customTextColor || (isLightPage ? 'text-slate-600' : 'text-slate-400')
                }`}
              >
                <span style={primaryStyle}>{block.content}</span>
                {block.subtitle && <span style={subtitleStyle}>{block.subtitle}</span>}
              </footer>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
};
