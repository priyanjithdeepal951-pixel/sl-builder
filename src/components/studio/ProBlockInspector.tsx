import React, { useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  Check,
  ClipboardPaste,
  Copy,
  Eye,
  EyeOff,
  Film,
  Highlighter,
  Italic,
  Layers,
  LayoutGrid,
  Move,
  PaintBucket,
  Palette,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Strikethrough,
  Trash2,
  Type as TypeIcon,
  Underline,
  Upload,
  Wand2,
  Zap,
} from 'lucide-react';
import type {
  BlockActionType,
  BlockStyle,
  CanvasBlock,
  SitePage,
} from '../../types/builder';
import { BLOCK_STYLE_TEMPLATES, FONT_OPTIONS } from '../../data/blockStyleTemplates';
import { ICON_LIBRARY } from '../../utils/mediaHelpers';
import { renderVectorIcon } from './WebPreviewRenderer';
import { readAndCompressImageFile } from '../../utils/imageUpload';

const PRO_FONT_CHOICES: Array<{ label: string; value: string; familyBucket?: BlockStyle['fontFamily'] }> = [
  { label: 'Inter (Modern Sans)', value: 'Inter, system-ui, sans-serif', familyBucket: 'sans' },
  { label: 'DM Sans', value: "'DM Sans', system-ui, sans-serif", familyBucket: 'sans' },
  { label: 'Bricolage Display', value: "'Bricolage Grotesque', system-ui, sans-serif", familyBucket: 'display' },
  { label: 'Space Grotesk', value: "'Space Grotesk', system-ui, sans-serif", familyBucket: 'display' },
  { label: 'Poppins', value: "'Poppins', system-ui, sans-serif", familyBucket: 'sans' },
  { label: 'Montserrat', value: "'Montserrat', system-ui, sans-serif", familyBucket: 'display' },
  { label: 'Nunito Rounded', value: "'Nunito', system-ui, sans-serif", familyBucket: 'rounded' },
  { label: 'Georgia Serif', value: "Georgia, 'Times New Roman', serif", familyBucket: 'serif' },
  { label: 'Playfair Serif', value: "'Playfair Display', Georgia, serif", familyBucket: 'serif' },
  { label: 'Oswald Condensed', value: "'Oswald', Impact, sans-serif", familyBucket: 'condensed' },
  { label: 'Bebas Neue', value: "'Bebas Neue', Impact, sans-serif", familyBucket: 'condensed' },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace", familyBucket: 'mono' },
  { label: 'Pacifico Script', value: "'Pacifico', cursive", familyBucket: 'script' },
];

const QUICK_SWATCHES = [
  '#ffffff',
  '#e2e8f0',
  '#94a3b8',
  '#0f172a',
  '#38bdf8',
  '#60a5fa',
  '#818cf8',
  '#c084fc',
  '#f472b6',
  '#fb7185',
  '#f59e0b',
  '#facc15',
  '#34d399',
  '#10b981',
];

const GRADIENT_PRESETS = [
  { name: 'Cyber Indigo', val: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' },
  { name: 'Sunset Flame', val: 'linear-gradient(135deg, #f43f5e 0%, #f59e0b 100%)' },
  { name: 'Emerald Mint', val: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' },
  { name: 'Royal Gold', val: 'linear-gradient(135deg, #b45309 0%, #facc15 100%)' },
  { name: 'Violet Neon', val: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)' },
  { name: 'Midnight Glass', val: 'linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(30,41,59,0.72) 100%)' },
  { name: 'Ocean Deep', val: 'linear-gradient(135deg, #0c4a6e 0%, #1e1b4b 100%)' },
  { name: 'Aurora Soft', val: 'linear-gradient(135deg, rgba(56,189,248,0.22) 0%, rgba(168,85,247,0.22) 100%)' },
];

const SHADOW_PRESETS = [
  { name: 'None', val: 'none' },
  { name: 'Soft', val: '0 4px 14px rgba(0,0,0,0.25)' },
  { name: 'Elevated', val: '0 12px 32px rgba(0,0,0,0.45)' },
  { name: 'Deep 3D', val: '0 22px 48px rgba(0,0,0,0.65)' },
  { name: 'Neon Cyan', val: '0 0 22px rgba(34,211,238,0.55)' },
  { name: 'Neon Purple', val: '0 0 24px rgba(168,85,247,0.55)' },
  { name: 'Gold Glow', val: '0 0 22px rgba(250,204,21,0.45)' },
];

const TEXT_SHADOW_PRESETS = [
  { name: 'None', val: '' },
  { name: 'Soft Drop', val: '0 2px 8px rgba(0,0,0,0.65)' },
  { name: 'Hard 3D', val: '2px 2px 0px #ec4899, 4px 4px 0px #4f46e5' },
  { name: 'Neon Cyan', val: '0 0 12px rgba(34,211,238,0.9), 0 0 26px rgba(59,130,246,0.6)' },
  { name: 'Neon Pink', val: '0 0 14px rgba(244,114,182,0.9)' },
  { name: 'Gold Shine', val: '0 3px 16px rgba(250,204,21,0.5)' },
];

const ANIMATION_PRESETS: Array<{ id: NonNullable<BlockStyle['animationPreset']>; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'fade-in', label: 'Fade In' },
  { id: 'slide-up', label: 'Slide Up' },
  { id: 'slide-down', label: 'Slide Down' },
  { id: 'slide-left', label: 'Slide Left' },
  { id: 'slide-right', label: 'Slide Right' },
  { id: 'zoom-in', label: 'Zoom In' },
  { id: 'bounce', label: 'Bounce (Loop)' },
  { id: 'pulse', label: 'Pulse (Loop)' },
  { id: 'float', label: 'Float (Loop)' },
  { id: 'glow-pulse', label: 'Glow Pulse (Loop)' },
];

const ACTION_OPTIONS: Array<{ value: BlockActionType | ''; label: string }> = [
  { value: '', label: 'None (No Action)' },
  { value: 'alert', label: 'Show Alert / Toast Message' },
  { value: 'navigate-page', label: 'Navigate to Page' },
  { value: 'scroll-to-block', label: 'Scroll to Block' },
  { value: 'open-url', label: 'Open External URL' },
  { value: 'submit-form', label: 'Submit Form Inputs' },
  { value: 'increment-counter', label: 'Increment Counter' },
  { value: 'toggle-visibility', label: 'Toggle Block Visibility' },
  { value: 'change-text', label: 'Change Target Text' },
  { value: 'call-api', label: 'Call REST API (Fetch)' },
  { value: 'db-save', label: 'Save to Cloud DB (Firebase/Supabase)' },
  { value: 'auth-signup', label: 'Auth Sign Up / Login' },
  { value: 'copy-clipboard', label: 'Copy to Clipboard' },
  { value: 'open-modal', label: 'Open Modal Dialog' },
];

interface ProInspectorRibbonProps {
  lang: 'en' | 'si';
  selectedBlock: CanvasBlock | null;
  copiedStyle: Partial<BlockStyle> | null;
  isInspectorOpen: boolean;
  onUpdateBlock: (updated: CanvasBlock) => void;
  onCopyStyle: (style: Partial<BlockStyle>) => void;
  onPasteStyle: () => void;
  onOpenFullInspector: () => void;
  onResetStyle: (blockId: string) => void;
}

export const ProInspectorRibbon: React.FC<ProInspectorRibbonProps> = ({
  lang,
  selectedBlock,
  copiedStyle,
  isInspectorOpen,
  onUpdateBlock,
  onCopyStyle,
  onPasteStyle,
  onOpenFullInspector,
  onResetStyle,
}) => {
  if (!selectedBlock) return null;
  const s = selectedBlock.style || {};
  const patchStyle = (patch: Partial<BlockStyle>) => {
    onUpdateBlock({ ...selectedBlock, style: { ...s, ...patch } });
  };

  const isBold = s.fontWeight === 'bold' || s.fontWeight === 'extrabold';
  const isItalic = s.fontStyle === 'italic';
  const isUnderline = (s.textDecoration || '').includes('underline');
  const isStrike = (s.textDecoration || '').includes('line-through');

  const toggleDecoration = (token: 'underline' | 'line-through') => {
    const hasU = isUnderline;
    const hasS = isStrike;
    const nextU = token === 'underline' ? !hasU : hasU;
    const nextS = token === 'line-through' ? !hasS : hasS;
    const val: BlockStyle['textDecoration'] =
      nextU && nextS ? 'underline line-through' : nextU ? 'underline' : nextS ? 'line-through' : 'none';
    patchStyle({ textDecoration: val });
  };

  const cycleCase = () => {
    const order: Array<NonNullable<BlockStyle['textTransform']>> = [
      'none',
      'uppercase',
      'capitalize',
      'lowercase',
    ];
    const curr = s.textTransform || 'none';
    const next = order[(order.indexOf(curr) + 1) % order.length];
    patchStyle({ textTransform: next });
  };

  const currentPx = s.fontSizePx || 18;

  return (
    <div className="px-3 py-1.5 border-t border-white/5 bg-[#0F131C] flex flex-wrap items-center gap-1.5 text-[10.5px]">
      {/* Font Selector */}
      <select
        value={s.customFontName || ''}
        onChange={(e) => {
          const picked = PRO_FONT_CHOICES.find((f) => f.value === e.target.value);
          patchStyle({
            customFontName: e.target.value || undefined,
            fontFamily: picked?.familyBucket || s.fontFamily,
          });
        }}
        title="Font Family (MS Word)"
        className="h-6 max-w-[116px] px-1.5 rounded bg-[#090B10] border border-white/10 text-slate-200 text-[10px] outline-none cursor-pointer"
      >
        <option value="">Default Font</option>
        {PRO_FONT_CHOICES.map((f) => (
          <option key={f.label} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      {/* Font Size px -/+ */}
      <div className="flex items-center rounded bg-[#090B10] border border-white/10 h-6 overflow-hidden">
        <button
          type="button"
          onClick={() => patchStyle({ fontSizePx: Math.max(10, currentPx - 2) })}
          className="px-1.5 h-full hover:bg-white/10 text-slate-300 cursor-pointer font-bold"
          title="Decrease Font Size"
        >
          -
        </button>
        <span className="px-1.5 font-mono text-[10px] text-sky-300 min-w-[34px] text-center">
          {s.fontSizePx ? `${s.fontSizePx}px` : 'Auto'}
        </span>
        <button
          type="button"
          onClick={() => patchStyle({ fontSizePx: Math.min(96, currentPx + 2) })}
          className="px-1.5 h-full hover:bg-white/10 text-slate-300 cursor-pointer font-bold"
          title="Increase Font Size"
        >
          +
        </button>
      </div>

      <div className="w-px h-4 bg-white/10 mx-0.5" />

      {/* B / I / U / S / AA */}
      <button
        type="button"
        onClick={() => patchStyle({ fontWeight: isBold ? 'normal' : 'bold' })}
        title="Bold"
        className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer ${
          isBold ? 'bg-blue-600 text-white' : 'bg-[#090B10] text-slate-300 hover:bg-white/10 border border-white/10'
        }`}
      >
        <Bold className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={() => patchStyle({ fontStyle: isItalic ? 'normal' : 'italic' })}
        title="Italic"
        className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer ${
          isItalic ? 'bg-blue-600 text-white' : 'bg-[#090B10] text-slate-300 hover:bg-white/10 border border-white/10'
        }`}
      >
        <Italic className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={() => toggleDecoration('underline')}
        title="Underline"
        className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer ${
          isUnderline ? 'bg-blue-600 text-white' : 'bg-[#090B10] text-slate-300 hover:bg-white/10 border border-white/10'
        }`}
      >
        <Underline className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={() => toggleDecoration('line-through')}
        title="Strikethrough"
        className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer ${
          isStrike ? 'bg-blue-600 text-white' : 'bg-[#090B10] text-slate-300 hover:bg-white/10 border border-white/10'
        }`}
      >
        <Strikethrough className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={cycleCase}
        title={`Text Case: ${s.textTransform || 'none'}`}
        className={`px-1.5 h-6 rounded font-bold text-[9.5px] cursor-pointer ${
          s.textTransform && s.textTransform !== 'none'
            ? 'bg-blue-600 text-white'
            : 'bg-[#090B10] text-slate-300 hover:bg-white/10 border border-white/10'
        }`}
      >
        Aa
      </button>

      <div className="w-px h-4 bg-white/10 mx-0.5" />

      {/* Align L/C/R/J */}
      {(['left', 'center', 'right', 'justify'] as const).map((al) => {
        const Icon =
          al === 'left'
            ? AlignLeft
            : al === 'center'
            ? AlignCenter
            : al === 'right'
            ? AlignRight
            : AlignJustify;
        const active = s.textAlign === al;
        return (
          <button
            key={al}
            type="button"
            onClick={() => patchStyle({ textAlign: al })}
            title={`Align ${al}`}
            className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer ${
              active ? 'bg-blue-600 text-white' : 'bg-[#090B10] text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <Icon className="w-3 h-3" />
          </button>
        );
      })}

      <div className="w-px h-4 bg-white/10 mx-0.5" />

      {/* Text Color, Highlight, Fill Color */}
      <label
        title="Text Color"
        className="h-6 px-1.5 rounded bg-[#090B10] border border-white/10 flex items-center gap-1 cursor-pointer hover:border-white/25"
      >
        <span className="font-bold text-[10px]" style={{ color: s.customTextHex || '#ffffff' }}>
          A
        </span>
        <input
          type="color"
          value={s.customTextHex || '#ffffff'}
          onChange={(e) => patchStyle({ customTextHex: e.target.value, textGradient: undefined })}
          className="w-3.5 h-3.5 p-0 border-0 bg-transparent cursor-pointer"
        />
      </label>

      <label
        title="Fill / Background Color"
        className="h-6 px-1.5 rounded bg-[#090B10] border border-white/10 flex items-center gap-1 cursor-pointer hover:border-white/25"
      >
        <PaintBucket className="w-3 h-3 text-sky-300" />
        <input
          type="color"
          value={s.customBgHex || '#131822'}
          onChange={(e) => patchStyle({ customBgHex: e.target.value, bgGradient: undefined })}
          className="w-3.5 h-3.5 p-0 border-0 bg-transparent cursor-pointer"
        />
      </label>

      <label
        title="Text Highlight Color"
        className="h-6 px-1.5 rounded bg-[#090B10] border border-white/10 flex items-center gap-1 cursor-pointer hover:border-white/25"
      >
        <Highlighter className="w-3 h-3 text-amber-300" />
        <input
          type="color"
          value={s.textHighlightHex || '#facc15'}
          onChange={(e) => patchStyle({ textHighlightHex: e.target.value })}
          className="w-3.5 h-3.5 p-0 border-0 bg-transparent cursor-pointer"
        />
      </label>

      <div className="w-px h-4 bg-white/10 mx-0.5" />

      {/* Copy / Paste / Reset */}
      <button
        type="button"
        onClick={() => onCopyStyle(s)}
        title="Copy Style (Format Painter)"
        className="h-6 px-1.5 rounded bg-[#090B10] border border-white/10 hover:bg-white/10 text-slate-300 flex items-center gap-1 cursor-pointer"
      >
        <Copy className="w-3 h-3" />
      </button>
      {copiedStyle && (
        <button
          type="button"
          onClick={onPasteStyle}
          title="Paste Copied Style"
          className="h-6 px-1.5 rounded bg-emerald-600/25 border border-emerald-400/40 text-emerald-200 flex items-center gap-1 cursor-pointer"
        >
          <ClipboardPaste className="w-3 h-3" />
        </button>
      )}
      <button
        type="button"
        onClick={() => onResetStyle(selectedBlock.id)}
        title="Reset Block Styles"
        className="h-6 px-1.5 rounded bg-[#090B10] border border-white/10 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 flex items-center cursor-pointer"
      >
        <RotateCcw className="w-3 h-3" />
      </button>

      {!isInspectorOpen && (
        <button
          type="button"
          onClick={onOpenFullInspector}
          className="ml-auto h-6 px-2 rounded bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold flex items-center gap-1 cursor-pointer"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>{lang === 'si' ? 'සියලුම Options' : 'All Options'}</span>
        </button>
      )}
    </div>
  );
};

interface ProBlockInspectorProps {
  lang: 'en' | 'si';
  blocks: CanvasBlock[];
  pages: SitePage[];
  selectedBlock: CanvasBlock | null;
  copiedStyle: Partial<BlockStyle> | null;
  onSelectBlock: (blockId: string) => void;
  onUpdateBlock: (updated: CanvasBlock) => void;
  onMoveBlock: (blockId: string, dir: -1 | 1) => void;
  onDuplicateBlock: (block: CanvasBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onCopyStyle: (style: Partial<BlockStyle>) => void;
  onPasteStyle: () => void;
  onBulkApplyStyle: (stylePatch: Partial<BlockStyle>) => void;
  onResetStyle: (blockId: string) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProBlockInspector: React.FC<ProBlockInspectorProps> = ({
  lang,
  blocks,
  pages,
  selectedBlock,
  copiedStyle,
  onSelectBlock,
  onUpdateBlock,
  onMoveBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onCopyStyle,
  onPasteStyle,
  onBulkApplyStyle,
  onResetStyle,
  onToast,
}) => {
  const [tab, setTab] = useState<'text' | 'shape' | 'layout' | 'fx' | 'presets' | 'actions'>('text');
  const [gradStart, setGradStart] = useState('#4f46e5');
  const [gradEnd, setGradEnd] = useState('#06b6d4');
  const [gradAngle, setGradAngle] = useState(135);
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [strokeColor, setStrokeColor] = useState('#38bdf8');
  const [textShadowBlur, setTextShadowBlur] = useState(14);
  const [textShadowColor, setTextShadowColor] = useState('#38bdf8');
  const [presetCat, setPresetCat] = useState<'text-fx' | 'surface' | 'button'>('text-fx');

  if (!selectedBlock) {
    return (
      <div className="p-8 text-center space-y-2 text-slate-400 text-xs">
        <SlidersHorizontal className="w-8 h-8 text-slate-600 mx-auto" />
        <p className="font-semibold text-slate-200">
          {lang === 'si' ? 'Inspect කිරීමට block එකක් තෝරන්න' : 'Select any block to inspect'}
        </p>
        <p className="text-[11px] text-slate-500">
          {lang === 'si'
            ? 'Canvas එකෙන් හෝ ඉහත dropdown එකෙන් element එකක් තෝරන්න.'
            : 'Click any block on the canvas or preview stage to edit all its properties.'}
        </p>
      </div>
    );
  }

  const s = selectedBlock.style || {};
  const blkIndex = blocks.findIndex((b) => b.id === selectedBlock.id);

  const patchBlock = (patch: Partial<CanvasBlock>) => {
    onUpdateBlock({ ...selectedBlock, ...patch });
  };

  const patchStyle = (patch: Partial<BlockStyle>) => {
    onUpdateBlock({ ...selectedBlock, style: { ...s, ...patch } });
  };

  const applyCustomBgGradient = (start: string, end: string, angle: number) => {
    setGradStart(start);
    setGradEnd(end);
    setGradAngle(angle);
    patchStyle({
      bgGradient: `linear-gradient(${angle}deg, ${start} 0%, ${end} 100%)`,
      customBgHex: undefined,
      bgImageUrl: undefined,
    });
  };

  const applyCustomTextGradient = (start: string, end: string, angle: number) => {
    setGradStart(start);
    setGradEnd(end);
    setGradAngle(angle);
    patchStyle({
      textGradient: `linear-gradient(${angle}deg, ${start} 0%, ${end} 100%)`,
    });
  };

  const replayAnimation = () => {
    const curr = s.animationPreset || 'fade-in';
    patchStyle({ animationPreset: 'none' });
    window.setTimeout(() => {
      onUpdateBlock({
        ...selectedBlock,
        style: { ...s, animationPreset: curr === 'none' ? 'zoom-in' : curr },
      });
    }, 30);
  };

  const isBold = s.fontWeight === 'bold' || s.fontWeight === 'extrabold';
  const isItalic = s.fontStyle === 'italic';
  const isUnderline = (s.textDecoration || '').includes('underline');
  const isStrike = (s.textDecoration || '').includes('line-through');

  const toggleDeco = (token: 'underline' | 'line-through') => {
    const nextU = token === 'underline' ? !isUnderline : isUnderline;
    const nextS = token === 'line-through' ? !isStrike : isStrike;
    const val: BlockStyle['textDecoration'] =
      nextU && nextS ? 'underline line-through' : nextU ? 'underline' : nextS ? 'line-through' : 'none';
    patchStyle({ textDecoration: val });
  };

  return (
    <div className="p-4 max-w-3xl w-full mx-auto space-y-3 text-xs text-slate-200 pb-16">
      {/* Top Selected Element Bar */}
      <div className="rounded-xl bg-[#131822] border border-white/10 p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="px-2 py-0.5 rounded bg-blue-500/15 border border-blue-400/30 text-[10px] font-mono text-sky-300 shrink-0">
            {selectedBlock.type}
          </span>
          <select
            value={selectedBlock.id}
            onChange={(e) => onSelectBlock(e.target.value)}
            className="bg-[#090B10] border border-white/15 rounded-lg px-2.5 py-1 text-xs font-bold text-white outline-none focus:border-blue-500 max-w-[240px] truncate cursor-pointer"
          >
            {blocks.map((b, idx) => (
              <option key={b.id} value={b.id}>
                {idx + 1}. {b.name} ({b.type})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={blkIndex <= 0}
            onClick={() => onMoveBlock(selectedBlock.id, -1)}
            title="Bring Backward / Move Up"
            className="p-1.5 rounded-lg bg-[#090B10] border border-white/10 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={blkIndex >= blocks.length - 1}
            onClick={() => onMoveBlock(selectedBlock.id, 1)}
            title="Send Forward / Move Down"
            className="p-1.5 rounded-lg bg-[#090B10] border border-white/10 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => patchStyle({ isHidden: !s.isHidden })}
            title={s.isHidden ? 'Show Element' : 'Hide Element'}
            className={`p-1.5 rounded-lg border cursor-pointer ${
              s.isHidden
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                : 'bg-[#090B10] border-white/10 hover:bg-white/10 text-slate-300'
            }`}
          >
            {s.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onDuplicateBlock(selectedBlock)}
            title="Duplicate Block"
            className="p-1.5 rounded-lg bg-[#090B10] border border-white/10 hover:bg-white/10 text-sky-300 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteBlock(selectedBlock.id)}
            title="Delete Block"
            className="p-1.5 rounded-lg bg-[#090B10] border border-white/10 hover:bg-rose-600/30 text-rose-400 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6 Studio Tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-[#11151E] p-1 rounded-xl border border-white/10">
        {[
          { id: 'text' as const, label: lang === 'si' ? 'Text' : 'Text', icon: TypeIcon },
          { id: 'shape' as const, label: lang === 'si' ? 'Fill & Border' : 'Shape & Fill', icon: Palette },
          { id: 'layout' as const, label: lang === 'si' ? 'Layout' : 'Layout & Media', icon: LayoutGrid },
          { id: 'fx' as const, label: lang === 'si' ? 'FX & Motion' : 'FX & Motion', icon: Film },
          { id: 'presets' as const, label: lang === 'si' ? 'Presets' : 'Presets', icon: Sparkles },
          { id: 'actions' as const, label: lang === 'si' ? 'Actions' : 'Actions', icon: Zap },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`py-1.5 px-2 rounded-lg text-[10.5px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                active
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== TAB 1: MS WORD TEXT & TYPOGRAPHY ==================== */}
      {tab === 'text' && (
        <div className="space-y-3">
          {/* Content Inputs */}
          <div className="rounded-xl bg-[#131822] border border-white/10 p-3 space-y-2.5">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-sky-400 flex items-center justify-between">
              <span>{lang === 'si' ? 'අන්තර්ගතය (Content)' : 'Content & Labels'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Block Label</label>
                <input
                  type="text"
                  value={selectedBlock.name}
                  onChange={(e) => patchBlock({ name: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 focus:border-blue-500 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Badge / Kicker Tag</label>
                <input
                  type="text"
                  value={selectedBlock.badgeText ?? ''}
                  onChange={(e) => patchBlock({ badgeText: e.target.value })}
                  placeholder="Optional badge text..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 focus:border-blue-500 text-sky-200 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Primary Text / Content</label>
              <textarea
                rows={2}
                value={
                  selectedBlock.type === 'ui-stat'
                    ? selectedBlock.statValue ?? selectedBlock.content
                    : selectedBlock.content
                }
                onChange={(e) =>
                  patchBlock(
                    selectedBlock.type === 'ui-stat'
                      ? { content: e.target.value, statValue: e.target.value }
                      : { content: e.target.value }
                  )
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 focus:border-blue-500 text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Subtitle / Description</label>
                <input
                  type="text"
                  value={
                    selectedBlock.type === 'ui-stat'
                      ? selectedBlock.statLabel ?? selectedBlock.subtitle ?? ''
                      : selectedBlock.subtitle || ''
                  }
                  onChange={(e) =>
                    patchBlock(
                      selectedBlock.type === 'ui-stat'
                        ? { subtitle: e.target.value, statLabel: e.target.value }
                        : { subtitle: e.target.value }
                    )
                  }
                  placeholder="Optional subtitle..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 focus:border-blue-500 text-slate-200 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Options / List Items (comma separated)
                </label>
                <input
                  type="text"
                  value={(selectedBlock.options || []).join(', ')}
                  onChange={(e) =>
                    patchBlock({
                      options: e.target.value
                        .split(/[,|]+/)
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Option A, Option B, Option C"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 focus:border-blue-500 text-slate-200 outline-none"
                />
              </div>
            </div>
          </div>

          {/* MS Word Font & Format Toolbar */}
          <div className="rounded-xl bg-[#131822] border border-white/10 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-sky-400">
                {lang === 'si' ? 'MS Word Typography & Formatting' : 'Typography (MS Word Style)'}
              </span>
              <button
                type="button"
                onClick={() =>
                  patchStyle({
                    fontFamily: undefined,
                    customFontName: undefined,
                    fontSize: undefined,
                    fontSizePx: undefined,
                    fontWeight: undefined,
                    fontStyle: undefined,
                    textDecoration: undefined,
                    textTransform: undefined,
                    letterSpacing: undefined,
                    lineHeight: undefined,
                    textHighlightHex: undefined,
                  })
                }
                className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
              >
                Clear Formatting
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Font Family</label>
                <select
                  value={s.customFontName || ''}
                  onChange={(e) => {
                    const picked = PRO_FONT_CHOICES.find((f) => f.value === e.target.value);
                    patchStyle({
                      customFontName: e.target.value || undefined,
                      fontFamily: picked?.familyBucket || s.fontFamily,
                    });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 text-white outline-none cursor-pointer"
                >
                  <option value="">Default Theme Font</option>
                  {PRO_FONT_CHOICES.map((f) => (
                    <option key={f.label} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Font Weight ({s.fontWeight || 'default'})
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {(['normal', 'medium', 'semibold', 'bold', 'extrabold'] as const).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => patchStyle({ fontWeight: w })}
                      className={`py-1.5 rounded text-[10px] font-semibold cursor-pointer ${
                        s.fontWeight === w
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#090B10] border border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {w === 'normal'
                        ? 'Reg'
                        : w === 'medium'
                        ? 'Med'
                        : w === 'semibold'
                        ? 'Semi'
                        : w === 'bold'
                        ? 'Bold'
                        : 'Blk'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Exact Font Size px Slider + Word Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-slate-400">
                  Font Size: <span className="font-mono text-sky-300">{s.fontSizePx ? `${s.fontSizePx}px` : 'Auto'}</span>
                </label>
                <div className="flex gap-1">
                  {[12, 14, 16, 20, 24, 32, 44, 60].map((px) => (
                    <button
                      key={px}
                      type="button"
                      onClick={() => patchStyle({ fontSizePx: px })}
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono cursor-pointer ${
                        s.fontSizePx === px
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#090B10] border border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {px}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min={10}
                max={96}
                value={s.fontSizePx || 18}
                onChange={(e) => patchStyle({ fontSizePx: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Format Toggles + Align + Case */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => patchStyle({ fontWeight: isBold ? 'normal' : 'bold' })}
                  className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${
                    isBold ? 'bg-blue-600 text-white' : 'bg-[#090B10] border border-white/10 text-slate-300'
                  }`}
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => patchStyle({ fontStyle: isItalic ? 'normal' : 'italic' })}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer ${
                    isItalic ? 'bg-blue-600 text-white' : 'bg-[#090B10] border border-white/10 text-slate-300'
                  }`}
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleDeco('underline')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer ${
                    isUnderline ? 'bg-blue-600 text-white' : 'bg-[#090B10] border border-white/10 text-slate-300'
                  }`}
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleDeco('line-through')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer ${
                    isStrike ? 'bg-blue-600 text-white' : 'bg-[#090B10] border border-white/10 text-slate-300'
                  }`}
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                {(['left', 'center', 'right', 'justify'] as const).map((al) => {
                  const Icon =
                    al === 'left'
                      ? AlignLeft
                      : al === 'center'
                      ? AlignCenter
                      : al === 'right'
                      ? AlignRight
                      : AlignJustify;
                  return (
                    <button
                      key={al}
                      type="button"
                      onClick={() => patchStyle({ textAlign: al })}
                      className={`px-2 py-1.5 rounded-lg cursor-pointer ${
                        s.textAlign === al
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#090B10] border border-white/10 text-slate-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1 ml-auto">
                {([
                  { id: 'none', lbl: 'Aa' },
                  { id: 'uppercase', lbl: 'AA' },
                  { id: 'lowercase', lbl: 'aa' },
                  { id: 'capitalize', lbl: 'Cap' },
                ] as const).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => patchStyle({ textTransform: c.id })}
                    className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                      (s.textTransform || 'none') === c.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#090B10] border border-white/10 text-slate-400'
                    }`}
                  >
                    {c.lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Letter Spacing & Line Height */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Letter Spacing</span>
                  <span className="font-mono text-sky-300">{s.letterSpacing ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min={-2}
                  max={16}
                  step={0.5}
                  value={s.letterSpacing ?? 0}
                  onChange={(e) => patchStyle({ letterSpacing: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Line Spacing (Height)</span>
                  <span className="font-mono text-sky-300">{s.lineHeight ?? 1.4}x</span>
                </div>
                <input
                  type="range"
                  min={0.9}
                  max={2.6}
                  step={0.1}
                  value={s.lineHeight ?? 1.4}
                  onChange={(e) => patchStyle({ lineHeight: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Text Colors & MS Word Highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-[#090B10] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Text Color</span>
                  <input
                    type="color"
                    value={s.customTextHex || '#ffffff'}
                    onChange={(e) =>
                      patchStyle({ customTextHex: e.target.value, textGradient: undefined })
                    }
                    className="w-6 h-5 p-0 border-0 bg-transparent cursor-pointer"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {QUICK_SWATCHES.slice(0, 7).map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => patchStyle({ customTextHex: hex, textGradient: undefined })}
                      className="w-4 h-4 rounded-full border border-white/25 cursor-pointer"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-[#090B10] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Subtitle Color</span>
                  <input
                    type="color"
                    value={s.subtitleColorHex || '#94a3b8'}
                    onChange={(e) => patchStyle({ subtitleColorHex: e.target.value })}
                    className="w-6 h-5 p-0 border-0 bg-transparent cursor-pointer"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {QUICK_SWATCHES.slice(7, 14).map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => patchStyle({ subtitleColorHex: hex })}
                      className="w-4 h-4 rounded-full border border-white/25 cursor-pointer"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-[#090B10] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Highlight Color</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={s.textHighlightHex || '#facc15'}
                      onChange={(e) => patchStyle({ textHighlightHex: e.target.value })}
                      className="w-6 h-5 p-0 border-0 bg-transparent cursor-pointer"
                    />
                    {s.textHighlightHex && (
                      <button
                        type="button"
                        onClick={() => patchStyle({ textHighlightHex: undefined })}
                        className="text-[9px] text-rose-400 cursor-pointer"
                      >
                        Off
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {['#facc15', '#22d3ee', '#f472b6', '#4ade80', '#fb923c'].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => patchStyle({ textHighlightHex: hex })}
                      className="w-4 h-4 rounded border border-white/25 cursor-pointer"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CapCut Text FX: Gradient, Outline/Stroke & Shadow */}
          <div className="rounded-xl bg-[#131822] border border-white/10 p-3 space-y-3">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-300 block">
              {lang === 'si' ? 'CapCut Text Effects (Gradient, Outline, Glow)' : 'Text FX (CapCut Style)'}
            </span>

            {/* Text Gradient Builder */}
            <div className="space-y-2 p-2.5 rounded-lg bg-[#090B10] border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-slate-200">Text Gradient Fill</span>
                {s.textGradient && (
                  <button
                    type="button"
                    onClick={() => patchStyle({ textGradient: undefined })}
                    className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Remove Gradient
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  value={gradStart}
                  onChange={(e) => applyCustomTextGradient(e.target.value, gradEnd, gradAngle)}
                  className="w-7 h-6 p-0 border-0 bg-transparent cursor-pointer"
                />
                <input
                  type="color"
                  value={gradEnd}
                  onChange={(e) => applyCustomTextGradient(gradStart, e.target.value, gradAngle)}
                  className="w-7 h-6 p-0 border-0 bg-transparent cursor-pointer"
                />
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={gradAngle}
                  onChange={(e) => applyCustomTextGradient(gradStart, gradEnd, Number(e.target.value))}
                  className="flex-1 accent-amber-400 cursor-pointer"
                />
                <span className="text-[10px] font-mono text-slate-400">{gradAngle}°</span>
              </div>
            </div>

            {/* Text Stroke & Shadow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-[#090B10] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-semibold text-slate-200">Text Stroke (Outline)</span>
                  {s.textStroke && (
                    <button
                      type="button"
                      onClick={() => patchStyle({ textStroke: undefined })}
                      className="text-[10px] text-rose-400 cursor-pointer"
                    >
                      Off
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => {
                      setStrokeColor(e.target.value);
                      patchStyle({ textStroke: `${strokeWidth}px ${e.target.value}` });
                    }}
                    className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="range"
                    min={0}
                    max={4}
                    step={0.5}
                    value={strokeWidth}
                    onChange={(e) => {
                      const w = Number(e.target.value);
                      setStrokeWidth(w);
                      patchStyle({ textStroke: w > 0 ? `${w}px ${strokeColor}` : undefined });
                    }}
                    className="flex-1 accent-sky-400 cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-sky-300">{strokeWidth}px</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#090B10] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-semibold text-slate-200">Text Glow / Shadow</span>
                  {s.textShadow && (
                    <button
                      type="button"
                      onClick={() => patchStyle({ textShadow: undefined })}
                      className="text-[10px] text-rose-400 cursor-pointer"
                    >
                      Off
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textShadowColor}
                    onChange={(e) => {
                      setTextShadowColor(e.target.value);
                      patchStyle({ textShadow: `0 0 ${textShadowBlur}px ${e.target.value}` });
                    }}
                    className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={textShadowBlur}
                    onChange={(e) => {
                      const b = Number(e.target.value);
                      setTextShadowBlur(b);
                      patchStyle({ textShadow: b > 0 ? `0 0 ${b}px ${textShadowColor}` : undefined });
                    }}
                    className="flex-1 accent-purple-400 cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-purple-300">{textShadowBlur}px</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {TEXT_SHADOW_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => patchStyle({ textShadow: p.val || undefined })}
                      className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[9.5px] text-slate-300 cursor-pointer"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: POWERPOINT SHAPE, FILL, BORDER & SHADOW ==================== */}
      {tab === 'shape' && (
        <div className="space-y-3">
          {/* Background Fill */}
          <div className="rounded-xl bg-[#131822] border border-white/10 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-sky-400">
                {lang === 'si' ? 'Surface Fill & Background (PowerPoint)' : 'Surface Fill & Background'}
              </span>
              <button
                type="button"
                onClick={() =>
                  patchStyle({
                    customBgHex: undefined,
                    bgGradient: undefined,
                    bgImageUrl: undefined,
                    bgColor: undefined,
                    backdropBlurPx: undefined,
                  })
                }
                className="text-[10px] text-rose-400 hover:underline cursor-pointer"
              >
                No Fill (Transparent)
              </button>
            </div>

            {/* Solid Background */}
            <div className="p-2.5 rounded-lg bg-[#090B10] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-slate-200">Solid Fill Color</span>
                <input
                  type="color"
                  value={s.customBgHex || '#131822'}
                  onChange={(e) =>
                    patchStyle({
                      customBgHex: e.target.value,
                      bgGradient: undefined,
                      bgImageUrl: undefined,
                    })
                  }
                  className="w-7 h-5 p-0 border-0 bg-transparent cursor-pointer"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['#0f172a', '#1e293b', '#1e1b4b', '#14532d', '#4c1d95', '#831843', '#2563eb', '#059669', '#d97706', '#dc2626', '#ffffff'].map(
                  (hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() =>
                        patchStyle({
                          customBgHex: hex,
                          bgGradient: undefined,
                          bgImageUrl: undefined,
                        })
                      }
                      className="w-5 h-5 rounded-md border border-white/25 cursor-pointer"
                      style={{ backgroundColor: hex }}
                    />
                  )
                )}
              </div>
            </div>

            {/* Gradient Builder & Presets */}
            <div className="p-2.5 rounded-lg bg-[#090B10] border border-white/10 space-y-2">
              <span className="text-[10.5px] font-semibold text-slate-200 block">
                Gradient Fill Builder
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={gradStart}
                  onChange={(e) => applyCustomBgGradient(e.target.value, gradEnd, gradAngle)}
                  className="w-7 h-6 p-0 border-0 bg-transparent cursor-pointer"
                />
                <input
                  type="color"
                  value={gradEnd}
                  onChange={(e) => applyCustomBgGradient(gradStart, e.target.value, gradAngle)}
                  className="w-7 h-6 p-0 border-0 bg-transparent cursor-pointer"
                />
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={gradAngle}
                  onChange={(e) => applyCustomBgGradient(gradStart, gradEnd, Number(e.target.value))}
                  className="flex-1 accent-blue-500 cursor-pointer"
                />
                <span className="font-mono text-[10px] text-slate-400">{gradAngle}°</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {GRADIENT_PRESETS.map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() =>
                      patchStyle({ bgGradient: g.val, customBgHex: undefined, bgImageUrl: undefined })
                    }
                    className="h-8 rounded-lg border border-white/15 hover:border-white/50 text-[9px] font-bold text-white shadow cursor-pointer flex items-center justify-center text-center px-1"
                    style={{ background: g.val }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Glassmorphism & Image Fill */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-[#090B10] border border-white/10 space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-300">
                  <span>Glassmorphism Blur</span>
                  <span className="font-mono text-sky-300">{s.backdropBlurPx ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={s.backdropBlurPx ?? 0}
                  onChange={(e) => patchStyle({ backdropBlurPx: Number(e.target.value) })}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-[#090B10] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-300">Background Image Fill</span>
                  {s.bgImageUrl && (
                    <button
                      type="button"
                      onClick={() => patchStyle({ bgImageUrl: undefined })}
                      className="text-[9.5px] text-rose-400 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={s.bgImageUrl || ''}
                    onChange={(e) => patchStyle({ bgImageUrl: e.target.value || undefined })}
                    placeholder="Image URL..."
                    className="flex-1 min-w-0 px-2 py-1 rounded bg-[#131822] border border-white/10 text-[10px] text-white outline-none"
                  />
                  <label className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-semibold cursor-pointer shrink-0">
                    <Upload className="w-3 h-3" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        try {
                          const url = await readAndCompressImageFile(file);
                          patchStyle({ bgImageUrl: url });
                          onToast('Background image applied!', 'success');
                        } catch (err) {
                          onToast(err instanceof Error ? err.message : 'Upload failed', 'error');
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Border, Corner Radius & Shadow */}
          <div className="rounded-xl bg-[#131822] border border-white/10 p-3 space-y-3">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-sky-400 block">
              Border, Corners & Shadow (PowerPoint Outline)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Border Style</label>
                <select
                  value={s.borderStyle || 'solid'}
                  onChange={(e) =>
                    patchStyle({ borderStyle: e.target.value as BlockStyle['borderStyle'] })
                  }
                  className="w-full px-2 py-1.5 rounded-lg bg-[#090B10] border border-white/10 text-white outline-none cursor-pointer"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Border Width</span>
                  <span className="font-mono text-sky-300">{s.borderWidthPx ?? 1}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  value={s.borderWidthPx ?? 1}
                  onChange={(e) => patchStyle({ borderWidthPx: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10">
                <span className="text-[10px] text-slate-300">Border Color</span>
                <input
                  type="color"
                  value={s.borderColor || '#38bdf8'}
                  onChange={(e) => patchStyle({ borderColor: e.target.value })}
                  className="w-7 h-6 p-0 border-0 bg-transparent cursor-pointer"
                />
              </div>
            </div>

            {/* Corner Radius Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Corner Radius: <span className="font-mono text-sky-300">{s.borderRadiusPx ?? 12}px</span>
                </span>
                <div className="flex gap-1">
                  {[
                    { lbl: 'Sharp', px: 0 },
                    { lbl: 'Soft', px: 10 },
                    { lbl: 'Round', px: 22 },
                    { lbl: 'Pill', px: 48 },
                  ].map((r) => (
                    <button
                      key={r.lbl}
                      type="button"
                      onClick={() => patchStyle({ borderRadiusPx: r.px })}
                      className={`px-2 py-0.5 rounded text-[9.5px] cursor-pointer ${
                        s.borderRadiusPx === r.px
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#090B10] border border-white/10 text-slate-300'
                      }`}
                    >
                      {r.lbl}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={64}
                value={s.borderRadiusPx ?? 12}
                onChange={(e) => patchStyle({ borderRadiusPx: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Box Shadows */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 block">Elevation & Box Shadow</span>
              <div className="flex flex-wrap gap-1.5">
                {SHADOW_PRESETS.map((sh) => (
                  <button
                    key={sh.name}
                    type="button"
                    onClick={() =>
                      patchStyle({ boxShadow: sh.val === 'none' ? undefined : sh.val })
                    }
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold cursor-pointer ${
                      (s.boxShadow || 'none') === sh.val
                        ? 'bg-blue-600 border-blue-400 text-white'
                        : 'bg-[#090B10] border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    {sh.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: LAYOUT, SPACING & MEDIA ==================== */}
      {tab === 'layout' && (
        <div className="space-y-3">
          <div className="rounded-xl bg-[#131822] border border-white/10 p-3 space-y-3">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-sky-400 block">
              Dimensions, Padding & Margin
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Width</label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {['auto', '100%', '90%', '75%', '50%', '320px'].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => patchStyle({ width: w })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                        (s.width || 'auto') === w
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#090B10] border border-white/10 text-slate-300'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={s.width || ''}
                  onChange={(e) => patchStyle({ width: e.target.value })}
                  placeholder="Custom e.g. 420px or 80%"
                  className="w-full px-2.5 py-1 rounded-lg bg-[#090B10] border border-white/10 text-white font-mono text-[10.5px] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Min Height</label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {['auto', '80px', '140px', '220px', '340px'].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => patchStyle({ height: h })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                        (s.height || 'auto') === h
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#090B10] border border-white/10 text-slate-300'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={s.height || ''}
                  onChange={(e) => patchStyle({ height: e.target.value })}
                  placeholder="Custom e.g. 260px"
                  className="w-full px-2.5 py-1 rounded-lg bg-[#090B10] border border-white/10 text-white font-mono text-[10.5px] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Inner Padding</span>
                  <span className="font-mono text-sky-300">{s.paddingPx ?? 16}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={64}
                  value={s.paddingPx ?? 16}
                  onChange={(e) => patchStyle({ paddingPx: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Outer Margin</span>
                  <span className="font-mono text-sky-300">{s.marginPx ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={48}
                  value={s.marginPx ?? 0}
                  onChange={(e) => patchStyle({ marginPx: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Layer Z-Index</span>
                  <span className="font-mono text-sky-300">{s.zIndex ?? 0}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={s.zIndex ?? 0}
                  onChange={(e) => patchStyle({ zIndex: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Media, Icon & Component-Specific Properties */}
          <div className="rounded-xl bg-[#131822] border border-white/10 p-3 space-y-3">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-sky-400 block">
              Media, Icons & Element Options
            </span>

            {/* Image Upload / URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Image / Avatar URL</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={selectedBlock.imageUrl || ''}
                    onChange={(e) => patchBlock({ imageUrl: e.target.value })}
                    placeholder="https://... or upload"
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 text-white text-[10.5px] outline-none"
                  />
                  <label className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold cursor-pointer flex items-center gap-1 shrink-0">
                    <Upload className="w-3 h-3" />
                    <span>Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        try {
                          const url = await readAndCompressImageFile(file);
                          patchBlock({ imageUrl: url });
                          onToast(`Uploaded "${file.name}"`, 'success');
                        } catch (err) {
                          onToast(err instanceof Error ? err.message : 'Upload failed', 'error');
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Video / YouTube / Audio / PDF URL
                </label>
                <input
                  type="text"
                  value={selectedBlock.videoUrl || ''}
                  onChange={(e) => patchBlock({ videoUrl: e.target.value })}
                  placeholder="https://youtu.be/... or MP4 / MP3 / PDF URL"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 text-sky-200 text-[10.5px] outline-none"
                />
              </div>
            </div>

            {/* Vector Icon Picker */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Vector Icon</label>
              <div className="flex flex-wrap gap-1.5">
                {ICON_LIBRARY.map((ic) => {
                  const active = (selectedBlock.iconName || 'sparkles') === ic.id;
                  return (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => patchBlock({ iconName: ic.id })}
                      title={ic.label}
                      className={`p-1.5 rounded-lg border cursor-pointer ${
                        active
                          ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                          : 'bg-[#090B10] border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {renderVectorIcon(ic.id, 'w-3.5 h-3.5')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Variant / Input / State Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Button Variant</label>
                <select
                  value={selectedBlock.buttonVariant || 'primary'}
                  onChange={(e) =>
                    patchBlock({ buttonVariant: e.target.value as CanvasBlock['buttonVariant'] })
                  }
                  className="w-full px-2 py-1.5 rounded-lg bg-[#090B10] border border-white/10 text-white outline-none"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="outline">Outline</option>
                  <option value="danger">Danger</option>
                  <option value="ghost">Ghost</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Input Type</label>
                <select
                  value={selectedBlock.inputType || 'text'}
                  onChange={(e) =>
                    patchBlock({ inputType: e.target.value as CanvasBlock['inputType'] })
                  }
                  className="w-full px-2 py-1.5 rounded-lg bg-[#090B10] border border-white/10 text-white outline-none"
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="password">Password</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Grid Columns</label>
                <select
                  value={selectedBlock.gridColumns || 2}
                  onChange={(e) =>
                    patchBlock({ gridColumns: Number(e.target.value) as 2 | 3 })
                  }
                  className="w-full px-2 py-1.5 rounded-lg bg-[#090B10] border border-white/10 text-white outline-none"
                >
                  <option value={2}>2 Columns</option>
                  <option value={3}>3 Columns</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 flex items-center justify-between cursor-pointer">
                  <span className="text-[10px] text-slate-300">Disabled</span>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedBlock.isDisabled)}
                    onChange={(e) => patchBlock({ isDisabled: e.target.checked })}
                    className="accent-blue-500"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: CAPCUT FX, TRANSFORM & ANIMATIONS ==================== */}
      {tab === 'fx' && (
        <div className="space-y-3">
          {/* Opacity & Color Grading Filters */}
          <div className="rounded-xl bg-[#131822] border border-white/10 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-purple-300">
                Opacity & Filters (CapCut Adjust)
              </span>
              <button
                type="button"
                onClick={() =>
                  patchStyle({
                    opacity: 100,
                    filterBlurPx: 0,
                    filterBrightness: 100,
                    filterContrast: 100,
                    filterSaturate: 100,
                  })
                }
                className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                  <span>Opacity</span>
                  <span className="font-mono text-purple-300">{s.opacity ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={s.opacity ?? 100}
                  onChange={(e) => patchStyle({ opacity: Number(e.target.value) })}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                  <span>Blur</span>
                  <span className="font-mono text-purple-300">{s.filterBlurPx ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  step={0.5}
                  value={s.filterBlurPx ?? 0}
                  onChange={(e) => patchStyle({ filterBlurPx: Number(e.target.value) })}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                  <span>Brightness</span>
                  <span className="font-mono text-purple-300">{s.filterBrightness ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={s.filterBrightness ?? 100}
                  onChange={(e) => patchStyle({ filterBrightness: Number(e.target.value) })}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                  <span>Contrast</span>
                  <span className="font-mono text-purple-300">{s.filterContrast ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={s.filterContrast ?? 100}
                  onChange={(e) => patchStyle({ filterContrast: Number(e.target.value) })}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
              <div className="sm:col-span-2">
                <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                  <span>Saturation</span>
                  <span className="font-mono text-purple-300">{s.filterSaturate ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={s.filterSaturate ?? 100}
                  onChange={(e) => patchStyle({ filterSaturate: Number(e.target.value) })}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 2D Transform */}
          <div className="rounded-xl bg-[#131822] border border-white/10 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                <Move className="w-3.5 h-3.5" /> 2D Transform (Scale / Rotate / Offset)
              </span>
              <button
                type="button"
                onClick={() => {
                  onUpdateBlock({
                    ...selectedBlock,
                    transformRotate: 0,
                    transformScale: 1,
                    transformTranslateX: 0,
                    transformTranslateY: 0,
                    style: { ...s, skewX: 0 },
                  });
                }}
                className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
              >
                Reset Transform
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                  <span>Rotate</span>
                  <span className="font-mono text-sky-300">{selectedBlock.transformRotate ?? 0}°</span>
                </div>
                <input
                  type="range"
                  min={-45}
                  max={45}
                  value={selectedBlock.transformRotate ?? 0}
                  onChange={(e) => patchBlock({ transformRotate: Number(e.target.value) })}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                  <span>Scale</span>
                  <span className="font-mono text-sky-300">
                    {(selectedBlock.transformScale ?? 1).toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={1.4}
                  step={0.02}
                  value={selectedBlock.transformScale ?? 1}
                  onChange={(e) => patchBlock({ transformScale: Number(e.target.value) })}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                  <span>Move X</span>
                  <span className="font-mono text-sky-300">{selectedBlock.transformTranslateX ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min={-60}
                  max={60}
                  value={selectedBlock.transformTranslateX ?? 0}
                  onChange={(e) => patchBlock({ transformTranslateX: Number(e.target.value) })}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                  <span>Move Y</span>
                  <span className="font-mono text-sky-300">{selectedBlock.transformTranslateY ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min={-60}
                  max={60}
                  value={selectedBlock.transformTranslateY ?? 0}
                  onChange={(e) => patchBlock({ transformTranslateY: Number(e.target.value) })}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>
              <div className="sm:col-span-2">
                <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                  <span>Skew X</span>
                  <span className="font-mono text-sky-300">{s.skewX ?? 0}°</span>
                </div>
                <input
                  type="range"
                  min={-25}
                  max={25}
                  value={s.skewX ?? 0}
                  onChange={(e) => patchStyle({ skewX: Number(e.target.value) })}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* CapCut Animations & Hover FX */}
          <div className="rounded-xl bg-[#131822] border border-white/10 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-300">
                Animations & Hover Effects
              </span>
              <button
                type="button"
                onClick={replayAnimation}
                className="px-2 py-0.5 rounded bg-emerald-600/25 border border-emerald-400/40 text-emerald-200 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-2.5 h-2.5" /> Replay
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {ANIMATION_PRESETS.map((ap) => (
                <button
                  key={ap.id}
                  type="button"
                  onClick={() => patchStyle({ animationPreset: ap.id })}
                  className={`py-1.5 px-2 rounded-lg border text-[10px] font-semibold cursor-pointer ${
                    (s.animationPreset || 'none') === ap.id
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-[#090B10] border-white/10 text-slate-300 hover:border-white/25'
                  }`}
                >
                  {ap.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                  <span>Animation Duration</span>
                  <span className="font-mono text-emerald-300">{s.animationDurationMs ?? 600}ms</span>
                </div>
                <input
                  type="range"
                  min={200}
                  max={3000}
                  step={100}
                  value={s.animationDurationMs ?? 600}
                  onChange={(e) => patchStyle({ animationDurationMs: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-300 block mb-1">Hover Micro-Interaction</label>
                <div className="flex gap-1">
                  {(['none', 'lift', 'scale', 'glow', 'tilt'] as const).map((hf) => (
                    <button
                      key={hf}
                      type="button"
                      onClick={() => patchStyle({ hoverEffect: hf })}
                      className={`flex-1 py-1 rounded text-[10px] font-semibold capitalize cursor-pointer ${
                        (s.hoverEffect || 'none') === hf
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#090B10] border border-white/10 text-slate-400'
                      }`}
                    >
                      {hf}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: PRESETS & STYLE MANAGER ==================== */}
      {tab === 'presets' && (
        <div className="space-y-3">
          {/* Style Clipboard & Bulk Actions */}
          <div className="rounded-xl bg-[#131822] border border-white/10 p-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onCopyStyle(s)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-sky-400" />
              <span>Copy Style</span>
            </button>
            <button
              type="button"
              disabled={!copiedStyle}
              onClick={onPasteStyle}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-400/30 text-emerald-200 font-semibold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste Style</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onBulkApplyStyle(s);
                onToast('Applied current block style to all blocks on page!', 'success');
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-400/30 text-indigo-200 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Apply to All Blocks</span>
            </button>
            <button
              type="button"
              onClick={() => onResetStyle(selectedBlock.id)}
              className="ml-auto px-3 py-1.5 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 border border-rose-400/30 text-rose-200 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          </div>

          {/* Preset Category Tabs */}
          <div className="flex gap-1.5 bg-[#11151E] p-1 rounded-xl border border-white/10">
            {[
              { id: 'text-fx' as const, label: 'CapCut Text FX' },
              { id: 'surface' as const, label: 'PowerPoint Card Surfaces' },
              { id: 'button' as const, label: 'Button Styles' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setPresetCat(c.id)}
                className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-semibold cursor-pointer ${
                  presetCat === c.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BLOCK_STYLE_TEMPLATES.filter((t) => t.category === presetCat).map((tpl) => {
              const active = s.templateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() =>
                    patchStyle({
                      ...tpl.style,
                      templateId: tpl.id,
                    })
                  }
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'border-blue-400 ring-2 ring-blue-500/30'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  style={{ background: tpl.previewBg }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-white">{tpl.name}</span>
                    {tpl.badge && (
                      <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-sky-300 border border-white/15">
                        {tpl.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-300 flex items-center justify-between">
                    <span>Click to apply</span>
                    {active && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 6: ACTIONS, API & CUSTOM CSS ==================== */}
      {tab === 'actions' && (
        <div className="space-y-3">
          <div className="rounded-xl bg-[#131822] border border-white/10 p-3 space-y-3">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5" /> Interactive Action & API Wiring
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">On Click / Trigger Action</label>
                <select
                  value={selectedBlock.action || ''}
                  onChange={(e) =>
                    patchBlock({
                      action: (e.target.value || undefined) as BlockActionType | undefined,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 text-white outline-none cursor-pointer"
                >
                  {ACTION_OPTIONS.map((ao) => (
                    <option key={ao.label} value={ao.value}>
                      {ao.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Action Payload (Message / URL / Value)
                </label>
                <input
                  type="text"
                  value={selectedBlock.actionPayload || ''}
                  onChange={(e) => patchBlock({ actionPayload: e.target.value })}
                  placeholder="e.g. Saved! or https://..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 text-amber-200 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Target Element</label>
                <select
                  value={selectedBlock.targetId || ''}
                  onChange={(e) => patchBlock({ targetId: e.target.value || undefined })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 text-white outline-none cursor-pointer"
                >
                  <option value="">None</option>
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Target Page</label>
                <select
                  value={selectedBlock.targetPageId || ''}
                  onChange={(e) => patchBlock({ targetPageId: e.target.value || undefined })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 text-white outline-none cursor-pointer"
                >
                  <option value="">None</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (/{p.slug})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">HTTP Method</label>
                <select
                  value={selectedBlock.httpMethod || 'POST'}
                  onChange={(e) =>
                    patchBlock({ httpMethod: e.target.value as CanvasBlock['httpMethod'] })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 text-white outline-none"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] text-slate-400 block mb-1">API Endpoint</label>
                <input
                  type="text"
                  value={selectedBlock.apiEndpoint || ''}
                  onChange={(e) => patchBlock({ apiEndpoint: e.target.value })}
                  placeholder="/api/v1/submit"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 text-emerald-300 font-mono outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Custom Tailwind / CSS Classes</label>
              <input
                type="text"
                value={s.customClass || ''}
                onChange={(e) => patchStyle({ customClass: e.target.value })}
                placeholder="e.g. tracking-wide backdrop-blur-lg"
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 text-sky-300 font-mono outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl bg-[#131822] border border-white/10 p-3 flex items-center justify-between text-[10.5px] text-slate-400">
            <span>Quick Font Presets</span>
            <div className="flex flex-wrap gap-1">
              {FONT_OPTIONS.map((fo) => (
                <button
                  key={fo.id}
                  type="button"
                  onClick={() => patchStyle({ fontFamily: fo.id, customFontName: undefined })}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    s.fontFamily === fo.id && !s.customFontName
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#090B10] border border-white/10 text-slate-300'
                  }`}
                >
                  {fo.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
