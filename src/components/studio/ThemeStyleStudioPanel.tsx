import React, { useMemo, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  CopyCheck,
  Droplets,
  Layers,
  RotateCcw,
  Sparkles,
  Type,
} from 'lucide-react';
import { BlockStyle, CanvasBlock } from '../../types/builder';
import {
  BG_GRADIENT_PRESETS,
  BLOCK_STYLE_TEMPLATES,
  BOX_SHADOW_PRESETS,
  BlockStyleTemplate,
  FONT_OPTIONS,
  TEXT_GRADIENT_PRESETS,
  TEXT_SHADOW_PRESETS,
  TEXT_STROKE_PRESETS,
  getTemplatesForBlockType,
} from '../../data/blockStyleTemplates';

interface ThemeStyleStudioPanelProps {
  blocks: CanvasBlock[];
  selectedBlock: CanvasBlock | null;
  onSelectBlock: (id: string) => void;
  onUpdateBlock: (updated: CanvasBlock) => void;
  onBulkApplyStyle: (stylePatch: Partial<BlockStyle>) => void;
  onResetStyle: (blockId: string) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type StudioSubTab = 'templates' | 'font' | 'color' | 'shade';
type TemplateFilter = 'recommended' | 'text-fx' | 'button' | 'surface';

const QUICK_TEXT_SWATCHES = [
  '#ffffff',
  '#f8fafc',
  '#94a3b8',
  '#38bdf8',
  '#818cf8',
  '#f472b6',
  '#34d399',
  '#fbbf24',
  '#fb7185',
  '#0f172a',
];

const QUICK_BG_SWATCHES = [
  '#0f172a',
  '#1e293b',
  '#4f46e5',
  '#2563eb',
  '#0891b2',
  '#059669',
  '#db2777',
  '#e11d48',
  '#d97706',
  '#ffffff',
];

const FONT_SIZE_OPTIONS: { id: NonNullable<BlockStyle['fontSize']>; label: string }[] = [
  { id: 'xs', label: 'XS' },
  { id: 'sm', label: 'SM' },
  { id: 'base', label: 'MD' },
  { id: 'lg', label: 'LG' },
  { id: 'xl', label: 'XL' },
  { id: '2xl', label: '2X' },
  { id: '3xl', label: '3X' },
  { id: '4xl', label: '4X' },
];

const FONT_WEIGHT_OPTIONS: { id: NonNullable<BlockStyle['fontWeight']>; label: string }[] = [
  { id: 'normal', label: '400' },
  { id: 'medium', label: '500' },
  { id: 'semibold', label: '600' },
  { id: 'bold', label: '700' },
  { id: 'extrabold', label: '800' },
];

const RADIUS_OPTIONS: { id: string; label: string }[] = [
  { id: 'rounded-none', label: '0px' },
  { id: 'rounded-lg', label: '8px' },
  { id: 'rounded-xl', label: '12px' },
  { id: 'rounded-2xl', label: '16px' },
  { id: 'rounded-full', label: 'Pill' },
];

export const ThemeStyleStudioPanel: React.FC<ThemeStyleStudioPanelProps> = ({
  blocks,
  selectedBlock,
  onSelectBlock,
  onUpdateBlock,
  onBulkApplyStyle,
  onResetStyle,
  onToast,
}) => {
  const [subTab, setSubTab] = useState<StudioSubTab>('templates');
  const [tplFilter, setTplFilter] = useState<TemplateFilter>('recommended');
  const [gradA, setGradA] = useState('#38bdf8');
  const [gradB, setGradB] = useState('#f472b6');
  const [gradAngle, setGradAngle] = useState(135);
  const [shadowX, setShadowX] = useState(0);
  const [shadowY, setShadowY] = useState(4);
  const [shadowBlur, setShadowBlur] = useState(14);
  const [shadowColor, setShadowColor] = useState('#38bdf8');
  const [strokePx, setStrokePx] = useState(1.2);
  const [strokeColor, setStrokeColor] = useState('#090b10');

  const targetBlock = selectedBlock || blocks[0] || null;
  const st = targetBlock?.style || {};

  const activeFontCss = useMemo(() => {
    return FONT_OPTIONS.find((f) => f.id === (st.fontFamily || 'sans'))?.css || FONT_OPTIONS[0].css;
  }, [st.fontFamily]);

  const patchStyle = (patch: Partial<BlockStyle>) => {
    if (!targetBlock) return;
    onUpdateBlock({
      ...targetBlock,
      style: {
        ...targetBlock.style,
        ...patch,
      },
    });
  };

  const applyTemplate = (tpl: BlockStyleTemplate) => {
    if (!targetBlock) return;
    if (tpl.category === 'text-fx') {
      patchStyle({
        templateId: tpl.id,
        fontFamily: tpl.style.fontFamily,
        fontWeight: tpl.style.fontWeight,
        customTextHex: tpl.style.customTextHex,
        subtitleColorHex: tpl.style.subtitleColorHex,
        textGradient: tpl.style.textGradient,
        textShadow: tpl.style.textShadow,
        textStroke: tpl.style.textStroke,
      });
    } else {
      patchStyle({
        templateId: tpl.id,
        fontFamily: tpl.style.fontFamily || targetBlock.style?.fontFamily,
        fontWeight: tpl.style.fontWeight || targetBlock.style?.fontWeight,
        customTextHex: tpl.style.customTextHex,
        subtitleColorHex: tpl.style.subtitleColorHex,
        textGradient: tpl.style.textGradient,
        textShadow: tpl.style.textShadow,
        textStroke: tpl.style.textStroke,
        customBgHex: tpl.style.customBgHex,
        bgGradient: tpl.style.bgGradient,
        borderColor: tpl.style.borderColor,
        boxShadow: tpl.style.boxShadow,
        borderRadius: tpl.style.borderRadius,
      });
    }
    onToast(`Applied "${tpl.name}" to ${targetBlock.name}`, 'success');
  };

  const applyCustomTextGradient = (cA: string, cB: string, angle: number) => {
    patchStyle({
      textGradient: `linear-gradient(${angle}deg, ${cA} 0%, ${cB} 100%)`,
      customTextHex: cA,
      templateId: undefined,
    });
  };

  const applyCustomTextShadow = (x: number, y: number, blur: number, col: string) => {
    patchStyle({
      textShadow: `${x}px ${y}px ${blur}px ${col}`,
      templateId: undefined,
    });
  };

  const applyCustomTextStroke = (px: number, col: string) => {
    patchStyle({
      textStroke: px <= 0 ? undefined : `${px}px ${col}`,
      templateId: undefined,
    });
  };

  const filteredTemplates = useMemo(() => {
    if (!targetBlock) return BLOCK_STYLE_TEMPLATES;
    if (tplFilter === 'recommended') return getTemplatesForBlockType(targetBlock.type);
    return BLOCK_STYLE_TEMPLATES.filter((t) => t.category === tplFilter);
  }, [targetBlock, tplFilter]);

  const handleApplyStyleToAll = () => {
    if (!targetBlock) return;
    const bulkPatch: Partial<BlockStyle> = {
      fontFamily: st.fontFamily,
      fontWeight: st.fontWeight,
      customTextHex: st.customTextHex,
      subtitleColorHex: st.subtitleColorHex,
      textGradient: st.textGradient,
      textShadow: st.textShadow,
      textStroke: st.textStroke,
      customBgHex: st.customBgHex,
      bgGradient: st.bgGradient,
      borderColor: st.borderColor,
      boxShadow: st.boxShadow,
      borderRadius: st.borderRadius,
    };
    onBulkApplyStyle(bulkPatch);
    onToast('Font, Color & Shade applied to all text & buttons on this page!', 'success');
  };

  if (!targetBlock) {
    return (
      <div className="py-8 px-2 text-center space-y-2">
        <Sparkles className="w-6 h-6 text-sky-400 mx-auto opacity-80" />
        <p className="text-xs font-semibold text-white">No Elements on Canvas Yet</p>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Add any Text, Button, Card, or Form element from the UI Builder first to style its font, color, and shade.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-[11px] font-bold tracking-[0.08em] uppercase text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Text &amp; Shade Studio</span>
          </h3>
          <p className="text-[10px] text-slate-400">CapCut-style Font, Color &amp; Shade FX</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onResetStyle(targetBlock.id);
            onToast(`Reset styles on ${targetBlock.name}`, 'info');
          }}
          title="Reset element styles"
          className="px-2 py-1 rounded-md bg-white/[0.06] hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/40 text-[10px] font-medium text-slate-300 hover:text-rose-200 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Target Element Selector */}
      <div className="space-y-1.5 bg-[#121419] p-2 rounded-xl border border-white/[0.08]">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="font-semibold uppercase tracking-wider">Target Element</span>
          <span className="font-mono text-sky-400">{targetBlock.type.replace('ui-', '')}</span>
        </div>
        <select
          value={targetBlock.id}
          onChange={(e) => onSelectBlock(e.target.value)}
          className="w-full px-2 py-1.5 rounded-lg bg-[#1e2127] border border-white/10 text-[11px] font-medium text-white outline-none focus:border-sky-400 cursor-pointer"
        >
          {blocks.map((b, idx) => (
            <option key={b.id} value={b.id}>
              {idx + 1}. {b.name} — {(b.content || '').slice(0, 24)}
            </option>
          ))}
        </select>

        {/* Live CapCut-Style Preview Card */}
        <div
          className="mt-1.5 min-h-[62px] rounded-xl px-3 py-2.5 flex flex-col items-center justify-center text-center border border-white/10 overflow-hidden"
          style={{
            background: st.bgGradient || st.customBgHex || '#0b0e14',
            borderColor: st.borderColor || 'rgba(255,255,255,0.12)',
            boxShadow: st.boxShadow,
          }}
        >
          <span
            className="leading-tight break-words max-w-full"
            style={{
              fontFamily: activeFontCss,
              fontWeight:
                st.fontWeight === 'extrabold'
                  ? 800
                  : st.fontWeight === 'bold'
                  ? 700
                  : st.fontWeight === 'semibold'
                  ? 600
                  : st.fontWeight === 'medium'
                  ? 500
                  : 400,
              fontSize: '15px',
              color: st.textGradient ? 'transparent' : st.customTextHex || '#ffffff',
              backgroundImage: st.textGradient || undefined,
              WebkitBackgroundClip: st.textGradient ? 'text' : undefined,
              backgroundClip: st.textGradient ? 'text' : undefined,
              WebkitTextFillColor: st.textGradient ? 'transparent' : undefined,
              textShadow: st.textShadow || undefined,
              WebkitTextStroke: st.textStroke || undefined,
            }}
          >
            {targetBlock.content || targetBlock.name || 'Preview Text'}
          </span>
          {targetBlock.subtitle && (
            <span
              className="text-[10px] mt-0.5 truncate max-w-full"
              style={{
                fontFamily: activeFontCss,
                color: st.subtitleColorHex || '#94a3b8',
              }}
            >
              {targetBlock.subtitle}
            </span>
          )}
        </div>
      </div>

      {/* 4 Studio Sub-Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-[#121419] p-1 rounded-xl border border-white/[0.08]">
        {(
          [
            { id: 'templates', label: 'FX', icon: Sparkles },
            { id: 'font', label: 'Font', icon: Type },
            { id: 'color', label: 'Color', icon: Droplets },
            { id: 'shade', label: 'Shade', icon: Layers },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`py-1.5 rounded-lg text-[10px] font-semibold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                active
                  ? 'bg-[#4C97FF] text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: TEMPLATES (STYLE FX) */}
      {subTab === 'templates' && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-1">
            {(
              [
                { id: 'recommended', label: 'For Block' },
                { id: 'text-fx', label: 'Text FX' },
                { id: 'button', label: 'Buttons' },
                { id: 'surface', label: 'Cards' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTplFilter(f.id)}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer border transition-colors ${
                  tplFilter === f.id
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                    : 'bg-[#1e2127] border-white/[0.07] text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {filteredTemplates.map((tpl) => {
              const isActive = st.templateId === tpl.id;
              const fontCss =
                FONT_OPTIONS.find((f) => f.id === (tpl.style.fontFamily || 'sans'))?.css ||
                FONT_OPTIONS[0].css;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className={`rounded-xl p-1.5 border text-left transition-all cursor-pointer overflow-hidden ${
                    isActive
                      ? 'border-[#4C97FF] ring-1 ring-[#4C97FF]/50 bg-[#1a2438]'
                      : 'border-white/10 bg-[#1e2127] hover:border-white/25'
                  }`}
                >
                  <div
                    className="h-10 rounded-lg flex items-center justify-center px-1.5 relative border border-white/10 overflow-hidden"
                    style={{
                      background: tpl.style.bgGradient || tpl.previewBg,
                      borderColor: tpl.style.borderColor || 'rgba(255,255,255,0.1)',
                      boxShadow: tpl.style.boxShadow,
                    }}
                  >
                    <span
                      className="text-[12px] truncate"
                      style={{
                        fontFamily: fontCss,
                        fontWeight: tpl.style.fontWeight === 'extrabold' ? 800 : 700,
                        color: tpl.style.textGradient
                          ? 'transparent'
                          : tpl.style.customTextHex || '#ffffff',
                        backgroundImage: tpl.style.textGradient,
                        WebkitBackgroundClip: tpl.style.textGradient ? 'text' : undefined,
                        backgroundClip: tpl.style.textGradient ? 'text' : undefined,
                        WebkitTextFillColor: tpl.style.textGradient ? 'transparent' : undefined,
                        textShadow: tpl.style.textShadow,
                        WebkitTextStroke: tpl.style.textStroke,
                      }}
                    >
                      {tpl.previewText || 'Aa Style'}
                    </span>
                    {isActive && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#4C97FF] text-slate-950 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="pt-1 px-0.5 text-[10px] font-medium text-slate-200 truncate">
                    {tpl.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FONT & TYPOGRAPHY */}
      {subTab === 'font' && (
        <div className="space-y-3">
          {/* Quick Inline Content Edit */}
          <div className="space-y-1.5 bg-[#121419] p-2.5 rounded-xl border border-white/[0.08]">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Text Content
            </label>
            <input
              type="text"
              value={targetBlock.content}
              onChange={(e) => onUpdateBlock({ ...targetBlock, content: e.target.value })}
              placeholder="Button / Text label..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#1e2127] border border-white/10 focus:border-sky-400 text-xs text-white outline-none"
            />
            {typeof targetBlock.subtitle === 'string' && (
              <input
                type="text"
                value={targetBlock.subtitle}
                onChange={(e) => onUpdateBlock({ ...targetBlock, subtitle: e.target.value })}
                placeholder="Subtitle..."
                className="w-full px-2.5 py-1 rounded-lg bg-[#1e2127] border border-white/10 focus:border-sky-400 text-[11px] text-slate-300 outline-none"
              />
            )}
          </div>

          {/* Font Family Visual Cards */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Font Family
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {FONT_OPTIONS.map((f) => {
                const active = (st.fontFamily || 'sans') === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => patchStyle({ fontFamily: f.id })}
                    className={`px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      active
                        ? 'bg-sky-500/20 border-sky-400 text-white'
                        : 'bg-[#1e2127] border-white/[0.08] text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold truncate">{f.label}</div>
                      <div className="text-[9px] text-slate-400 truncate">{f.sample}</div>
                    </div>
                    <span
                      style={{ fontFamily: f.css }}
                      className="text-base font-bold text-sky-300 shrink-0"
                    >
                      Aa
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Weight */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Weight
            </label>
            <div className="grid grid-cols-5 gap-1">
              {FONT_WEIGHT_OPTIONS.map((w) => {
                const active = (st.fontWeight || 'bold') === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => patchStyle({ fontWeight: w.id })}
                    className={`py-1.5 rounded-lg border text-[10px] cursor-pointer ${
                      active
                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                        : 'bg-[#1e2127] border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Size
            </label>
            <div className="grid grid-cols-4 gap-1">
              {FONT_SIZE_OPTIONS.map((sz) => {
                const active = (st.fontSize || 'base') === sz.id;
                return (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => patchStyle({ fontSize: sz.id })}
                    className={`py-1 rounded-lg border text-[10px] font-mono cursor-pointer ${
                      active
                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                        : 'bg-[#1e2127] border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    {sz.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Align */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Alignment
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'left', label: 'Left', icon: AlignLeft },
                  { id: 'center', label: 'Center', icon: AlignCenter },
                  { id: 'right', label: 'Right', icon: AlignRight },
                ] as const
              ).map((al) => {
                const Icon = al.icon;
                const active = (st.textAlign || 'left') === al.id;
                return (
                  <button
                    key={al.id}
                    type="button"
                    onClick={() => patchStyle({ textAlign: al.id })}
                    className={`py-1.5 rounded-lg border text-[10px] flex items-center justify-center gap-1 cursor-pointer ${
                      active
                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                        : 'bg-[#1e2127] border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{al.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COLOR & GRADIENTS */}
      {subTab === 'color' && (
        <div className="space-y-3">
          {/* Text Solid Color */}
          <div className="space-y-1.5 bg-[#121419] p-2.5 rounded-xl border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Text Colour
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={st.customTextHex || '#ffffff'}
                  onChange={(e) =>
                    patchStyle({ customTextHex: e.target.value, textGradient: undefined })
                  }
                  className="w-5 h-5 rounded border border-white/20 bg-transparent cursor-pointer"
                />
                <span className="text-[10px] font-mono text-slate-300">
                  {st.customTextHex || 'Auto'}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_TEXT_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => patchStyle({ customTextHex: hex, textGradient: undefined })}
                  style={{ backgroundColor: hex }}
                  title={hex}
                  className={`w-5 h-5 rounded-full border cursor-pointer transition-transform hover:scale-110 ${
                    st.customTextHex === hex && !st.textGradient
                      ? 'border-sky-400 ring-2 ring-sky-400/50 scale-110'
                      : 'border-white/25'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Text Gradient Presets + Custom 2-Stop Builder */}
          <div className="space-y-1.5 bg-[#121419] p-2.5 rounded-xl border border-white/[0.08]">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Text Gradient Fill
            </label>
            <div className="grid grid-cols-4 gap-1">
              {TEXT_GRADIENT_PRESETS.map((gp) => {
                const active = (st.textGradient || undefined) === gp.value;
                return (
                  <button
                    key={gp.id}
                    type="button"
                    onClick={() => patchStyle({ textGradient: gp.value })}
                    className={`p-1 rounded-lg border text-[9px] font-semibold text-center cursor-pointer ${
                      active
                        ? 'border-sky-400 bg-sky-500/15 text-white'
                        : 'border-white/10 bg-[#1e2127] text-slate-300'
                    }`}
                  >
                    <div
                      className="h-3 rounded mb-0.5"
                      style={{ background: gp.preview }}
                    />
                    <span className="truncate block">{gp.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="pt-1.5 flex items-center justify-between gap-1.5 border-t border-white/10">
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={gradA}
                  onChange={(e) => {
                    setGradA(e.target.value);
                    applyCustomTextGradient(e.target.value, gradB, gradAngle);
                  }}
                  title="Gradient Start Color"
                  className="w-5 h-5 rounded border border-white/20 bg-transparent cursor-pointer"
                />
                <input
                  type="color"
                  value={gradB}
                  onChange={(e) => {
                    setGradB(e.target.value);
                    applyCustomTextGradient(gradA, e.target.value, gradAngle);
                  }}
                  title="Gradient End Color"
                  className="w-5 h-5 rounded border border-white/20 bg-transparent cursor-pointer"
                />
              </div>
              <input
                type="range"
                min={0}
                max={360}
                step={15}
                value={gradAngle}
                onChange={(e) => {
                  const ang = Number(e.target.value);
                  setGradAngle(ang);
                  applyCustomTextGradient(gradA, gradB, ang);
                }}
                className="flex-1 accent-sky-400 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => applyCustomTextGradient(gradA, gradB, gradAngle)}
                className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-400/30 text-[9px] font-bold cursor-pointer"
              >
                {gradAngle}°
              </button>
            </div>
          </div>

          {/* Subtitle Colour */}
          <div className="space-y-1.5 bg-[#121419] p-2.5 rounded-xl border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Subtitle Colour
              </label>
              <input
                type="color"
                value={st.subtitleColorHex || '#94a3b8'}
                onChange={(e) => patchStyle({ subtitleColorHex: e.target.value })}
                className="w-5 h-5 rounded border border-white/20 bg-transparent cursor-pointer"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['#94a3b8', '#cbd5e1', '#38bdf8', '#a5b4fc', '#f9a8d4', '#6ee7b7', '#fde047'].map(
                (hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => patchStyle({ subtitleColorHex: hex })}
                    style={{ backgroundColor: hex }}
                    className={`w-4 h-4 rounded-full border cursor-pointer ${
                      st.subtitleColorHex === hex
                        ? 'border-sky-400 ring-2 ring-sky-400/40'
                        : 'border-white/20'
                    }`}
                  />
                )
              )}
            </div>
          </div>

          {/* Button / Card Background Fill & Gradient */}
          <div className="space-y-1.5 bg-[#121419] p-2.5 rounded-xl border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Button / Box Fill
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={st.customBgHex || '#4f46e5'}
                  onChange={(e) =>
                    patchStyle({ customBgHex: e.target.value, bgGradient: undefined })
                  }
                  className="w-5 h-5 rounded border border-white/20 bg-transparent cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() =>
                    patchStyle({ customBgHex: undefined, bgGradient: undefined, bgColor: 'bg-transparent' })
                  }
                  className="text-[9px] text-slate-400 hover:text-white cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_BG_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => patchStyle({ customBgHex: hex, bgGradient: undefined })}
                  style={{ backgroundColor: hex }}
                  className={`w-5 h-5 rounded-md border cursor-pointer ${
                    st.customBgHex === hex && !st.bgGradient
                      ? 'border-sky-400 ring-2 ring-sky-400/50'
                      : 'border-white/20'
                  }`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1 pt-1">
              {BG_GRADIENT_PRESETS.map((bg) => {
                const active = (st.bgGradient || undefined) === bg.value;
                return (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() =>
                      patchStyle({
                        bgGradient: bg.value,
                        customBgHex: bg.fallbackHex || st.customBgHex,
                      })
                    }
                    className={`px-2 py-1 rounded-lg border text-[9px] font-semibold flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? 'border-sky-400 bg-sky-500/15 text-white'
                        : 'border-white/10 bg-[#1e2127] text-slate-300'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-sm border border-white/20 shrink-0"
                      style={{ background: bg.value || '#1e293b' }}
                    />
                    <span className="truncate">{bg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SHADE, GLOW, STROKE & SHADOW FX */}
      {subTab === 'shade' && (
        <div className="space-y-3">
          {/* Text Shade / Glow Presets */}
          <div className="space-y-1.5 bg-[#121419] p-2.5 rounded-xl border border-white/[0.08]">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Text Shade &amp; Glow
            </label>
            <div className="grid grid-cols-3 gap-1">
              {TEXT_SHADOW_PRESETS.map((sh) => {
                const active = (st.textShadow || undefined) === sh.value;
                return (
                  <button
                    key={sh.id}
                    type="button"
                    onClick={() => patchStyle({ textShadow: sh.value })}
                    className={`py-1.5 px-1 rounded-lg border text-[10px] font-medium truncate cursor-pointer ${
                      active
                        ? 'bg-sky-500/20 border-sky-400 text-white font-bold'
                        : 'bg-[#1e2127] border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    {sh.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Text Shade Sliders */}
            <div className="pt-2 mt-1.5 border-t border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-semibold">Custom Shade</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={shadowColor}
                    onChange={(e) => {
                      setShadowColor(e.target.value);
                      applyCustomTextShadow(shadowX, shadowY, shadowBlur, e.target.value);
                    }}
                    className="w-4 h-4 rounded border border-white/20 bg-transparent cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => patchStyle({ textShadow: undefined })}
                    className="text-[9px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Off
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[9px] text-slate-400">
                <label className="space-y-0.5">
                  <span>X: {shadowX}px</span>
                  <input
                    type="range"
                    min={-8}
                    max={12}
                    value={shadowX}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setShadowX(v);
                      applyCustomTextShadow(v, shadowY, shadowBlur, shadowColor);
                    }}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </label>
                <label className="space-y-0.5">
                  <span>Y: {shadowY}px</span>
                  <input
                    type="range"
                    min={-8}
                    max={12}
                    value={shadowY}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setShadowY(v);
                      applyCustomTextShadow(shadowX, v, shadowBlur, shadowColor);
                    }}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </label>
                <label className="space-y-0.5">
                  <span>Blur: {shadowBlur}</span>
                  <input
                    type="range"
                    min={0}
                    max={28}
                    value={shadowBlur}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setShadowBlur(v);
                      applyCustomTextShadow(shadowX, shadowY, v, shadowColor);
                    }}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Text Stroke / Outline */}
          <div className="space-y-1.5 bg-[#121419] p-2.5 rounded-xl border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Text Outline / Stroke
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => {
                    setStrokeColor(e.target.value);
                    applyCustomTextStroke(strokePx, e.target.value);
                  }}
                  className="w-4 h-4 rounded border border-white/20 bg-transparent cursor-pointer"
                />
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={0.5}
                  value={strokePx}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setStrokePx(v);
                    applyCustomTextStroke(v, strokeColor);
                  }}
                  className="w-16 accent-sky-400 cursor-pointer"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {TEXT_STROKE_PRESETS.map((sp) => {
                const active = (st.textStroke || undefined) === sp.value;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => patchStyle({ textStroke: sp.value })}
                    className={`py-1 px-1 rounded-lg border text-[10px] truncate cursor-pointer ${
                      active
                        ? 'bg-sky-500/20 border-sky-400 text-white font-bold'
                        : 'bg-[#1e2127] border-white/10 text-slate-300'
                    }`}
                  >
                    {sp.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Button / Box Shadow, Border & Corner Radius */}
          <div className="space-y-2 bg-[#121419] p-2.5 rounded-xl border border-white/[0.08]">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Button &amp; Card Shadow
            </label>
            <div className="grid grid-cols-3 gap-1">
              {BOX_SHADOW_PRESETS.map((bs) => {
                const active = (st.boxShadow || undefined) === bs.value;
                return (
                  <button
                    key={bs.id}
                    type="button"
                    onClick={() => patchStyle({ boxShadow: bs.value })}
                    className={`py-1 px-1 rounded-lg border text-[10px] truncate cursor-pointer ${
                      active
                        ? 'bg-sky-500/20 border-sky-400 text-white font-bold'
                        : 'bg-[#1e2127] border-white/10 text-slate-300'
                    }`}
                  >
                    {bs.label}
                  </button>
                );
              })}
            </div>

            <div className="pt-1 border-t border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold">Corner &amp; Border</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={st.borderColor || '#38bdf8'}
                    onChange={(e) => patchStyle({ borderColor: e.target.value })}
                    title="Border Color"
                    className="w-4 h-4 rounded border border-white/20 bg-transparent cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => patchStyle({ borderColor: undefined })}
                    className="text-[9px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    No Border
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {RADIUS_OPTIONS.map((rad) => {
                  const active = (st.borderRadius || 'rounded-xl') === rad.id;
                  return (
                    <button
                      key={rad.id}
                      type="button"
                      onClick={() => patchStyle({ borderRadius: rad.id })}
                      className={`py-1 rounded-lg border text-[9px] font-mono cursor-pointer ${
                        active
                          ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                          : 'bg-[#1e2127] border-white/10 text-slate-300'
                      }`}
                    >
                      {rad.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Apply Helper */}
      <button
        type="button"
        onClick={handleApplyStyleToAll}
        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#4C97FF]/20 to-indigo-500/20 hover:from-[#4C97FF]/30 hover:to-indigo-500/30 border border-[#4C97FF]/40 text-[11px] font-semibold text-sky-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
      >
        <CopyCheck className="w-3.5 h-3.5" />
        <span>Apply Font, Color &amp; Shade to All</span>
      </button>
    </div>
  );
};
