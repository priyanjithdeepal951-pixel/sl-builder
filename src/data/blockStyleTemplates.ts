import { BlockStyle, BlockType } from '../types/builder';

export type TemplateCategory = 'text-fx' | 'surface' | 'button';

export interface BlockStyleTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  badge?: string;
  previewText?: string;
  previewBg: string;
  style: Partial<BlockStyle>;
}

export const BLOCK_STYLE_TEMPLATES: BlockStyleTemplate[] = [
  // ==================== CAPCUT-STYLE TEXT FX ====================
  {
    id: 'fx-cyber-neon',
    name: 'Cyber Neon',
    category: 'text-fx',
    badge: 'GLOW',
    previewBg: 'linear-gradient(135deg, #061326 0%, #0a1f3d 100%)',
    style: {
      fontFamily: 'display',
      fontWeight: 'extrabold',
      customTextHex: '#67e8f9',
      subtitleColorHex: '#a5f3fc',
      textGradient: undefined,
      textShadow: '0 0 12px rgba(34,211,238,0.85), 0 0 28px rgba(59,130,246,0.55)',
      textStroke: undefined,
    },
  },
  {
    id: 'fx-sunset-pop',
    name: 'Sunset Pop',
    category: 'text-fx',
    badge: 'GRAD',
    previewBg: 'linear-gradient(135deg, #1f1024 0%, #2a1414 100%)',
    style: {
      fontFamily: 'display',
      fontWeight: 'extrabold',
      customTextHex: '#fb7185',
      subtitleColorHex: '#fed7aa',
      textGradient: 'linear-gradient(135deg, #fb7185 0%, #f59e0b 52%, #fde047 100%)',
      textShadow: undefined,
      textStroke: undefined,
    },
  },
  {
    id: 'fx-aurora-beam',
    name: 'Aurora Beam',
    category: 'text-fx',
    badge: 'GRAD',
    previewBg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
    style: {
      fontFamily: 'sans',
      fontWeight: 'extrabold',
      customTextHex: '#818cf8',
      subtitleColorHex: '#cbd5e1',
      textGradient: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #f472b6 100%)',
      textShadow: undefined,
      textStroke: undefined,
    },
  },
  {
    id: 'fx-gold-luxury',
    name: 'Gold Luxury',
    category: 'text-fx',
    badge: 'VIP',
    previewBg: 'linear-gradient(135deg, #171412 0%, #291e0b 100%)',
    style: {
      fontFamily: 'serif',
      fontWeight: 'bold',
      customTextHex: '#facc15',
      subtitleColorHex: '#fde68a',
      textGradient: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)',
      textShadow: '0 4px 16px rgba(234,179,8,0.35)',
      textStroke: undefined,
    },
  },
  {
    id: 'fx-3d-retro',
    name: '3D Retro',
    category: 'text-fx',
    badge: '3D',
    previewBg: 'linear-gradient(135deg, #160c2b 0%, #2a123b 100%)',
    style: {
      fontFamily: 'display',
      fontWeight: 'extrabold',
      customTextHex: '#ffffff',
      subtitleColorHex: '#f9a8d4',
      textGradient: undefined,
      textShadow: '2px 2px 0px #ec4899, 5px 5px 0px #4f46e5',
      textStroke: undefined,
    },
  },
  {
    id: 'fx-fire-outline',
    name: 'Fire Glow',
    category: 'text-fx',
    badge: 'FX',
    previewBg: 'linear-gradient(135deg, #1e0a12 0%, #2f0d16 100%)',
    style: {
      fontFamily: 'display',
      fontWeight: 'extrabold',
      customTextHex: '#fff1f2',
      subtitleColorHex: '#fda4af',
      textGradient: undefined,
      textShadow: '0 0 18px rgba(244,63,94,0.9)',
      textStroke: '1px #fb7185',
    },
  },
  {
    id: 'fx-emerald-code',
    name: 'Matrix Mint',
    category: 'text-fx',
    badge: 'MONO',
    previewBg: 'linear-gradient(135deg, #061c15 0%, #092b20 100%)',
    style: {
      fontFamily: 'mono',
      fontWeight: 'bold',
      customTextHex: '#34d399',
      subtitleColorHex: '#6ee7b7',
      textGradient: undefined,
      textShadow: '0 0 14px rgba(16,185,129,0.75)',
      textStroke: undefined,
    },
  },
  {
    id: 'fx-candy-bubble',
    name: 'Candy Pop',
    category: 'text-fx',
    badge: 'SOFT',
    previewBg: 'linear-gradient(135deg, #1c102b 0%, #17213d 100%)',
    style: {
      fontFamily: 'rounded',
      fontWeight: 'extrabold',
      customTextHex: '#f472b6',
      subtitleColorHex: '#e9d5ff',
      textGradient: 'linear-gradient(135deg, #f472b6 0%, #c084fc 55%, #60a5fa 100%)',
      textShadow: undefined,
      textStroke: undefined,
    },
  },
  {
    id: 'fx-editorial-serif',
    name: 'Editorial',
    category: 'text-fx',
    badge: 'PRO',
    previewBg: 'linear-gradient(135deg, #111318 0%, #1c2029 100%)',
    style: {
      fontFamily: 'serif',
      fontWeight: 'bold',
      customTextHex: '#f8fafc',
      subtitleColorHex: '#94a3b8',
      textGradient: undefined,
      textShadow: '0 6px 20px rgba(0,0,0,0.65)',
      textStroke: undefined,
    },
  },
  {
    id: 'fx-ice-crystal',
    name: 'Ice Crystal',
    category: 'text-fx',
    badge: 'CRISP',
    previewBg: 'linear-gradient(135deg, #0b192c 0%, #132a47 100%)',
    style: {
      fontFamily: 'sans',
      fontWeight: 'extrabold',
      customTextHex: '#e0f2fe',
      subtitleColorHex: '#bae6fd',
      textGradient: 'linear-gradient(135deg, #ffffff 0%, #bae6fd 50%, #38bdf8 100%)',
      textShadow: '0 0 14px rgba(186,230,253,0.55)',
      textStroke: undefined,
    },
  },

  // ==================== BUTTON TEMPLATES ====================
  {
    id: 'btn-neon-cyan',
    name: 'Neon Pulse',
    category: 'button',
    badge: 'PILL',
    previewBg: '#09111f',
    style: {
      fontFamily: 'sans',
      fontWeight: 'bold',
      customTextHex: '#ffffff',
      textGradient: undefined,
      textShadow: undefined,
      bgGradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
      customBgHex: '#0284c7',
      borderColor: 'rgba(103,232,249,0.8)',
      boxShadow: '0 0 22px rgba(6,182,212,0.55)',
      borderRadius: 'rounded-full',
    },
  },
  {
    id: 'btn-sunset-pill',
    name: 'Sunset Pill',
    category: 'button',
    badge: 'HOT',
    previewBg: '#1c0f18',
    style: {
      fontFamily: 'display',
      fontWeight: 'extrabold',
      customTextHex: '#ffffff',
      textGradient: undefined,
      textShadow: undefined,
      bgGradient: 'linear-gradient(135deg, #f43f5e 0%, #f59e0b 100%)',
      customBgHex: '#f43f5e',
      borderColor: 'rgba(253,186,116,0.65)',
      boxShadow: '0 10px 24px rgba(244,63,94,0.42)',
      borderRadius: 'rounded-full',
    },
  },
  {
    id: 'btn-vip-gold',
    name: 'VIP Gold',
    category: 'button',
    badge: 'LUX',
    previewBg: '#17140d',
    style: {
      fontFamily: 'sans',
      fontWeight: 'extrabold',
      customTextHex: '#1c1917',
      textGradient: undefined,
      textShadow: undefined,
      bgGradient: 'linear-gradient(135deg, #fde047 0%, #ca8a04 100%)',
      customBgHex: '#eab308',
      borderColor: 'rgba(254,240,138,0.85)',
      boxShadow: '0 8px 22px rgba(234,179,8,0.38)',
      borderRadius: 'rounded-xl',
    },
  },
  {
    id: 'btn-3d-arcade',
    name: '3D Arcade',
    category: 'button',
    badge: '3D',
    previewBg: '#140f24',
    style: {
      fontFamily: 'display',
      fontWeight: 'extrabold',
      customTextHex: '#ffffff',
      textGradient: undefined,
      textShadow: undefined,
      bgGradient: 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)',
      customBgHex: '#7c3aed',
      borderColor: '#c4b5fd',
      boxShadow: '0 4px 0 #3b0764, 0 10px 20px rgba(109,40,217,0.45)',
      borderRadius: 'rounded-xl',
    },
  },
  {
    id: 'btn-emerald-cta',
    name: 'Emerald Mint',
    category: 'button',
    badge: 'CTA',
    previewBg: '#091b16',
    style: {
      fontFamily: 'sans',
      fontWeight: 'bold',
      customTextHex: '#ffffff',
      textGradient: undefined,
      textShadow: undefined,
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
      customBgHex: '#10b981',
      borderColor: 'rgba(110,231,183,0.65)',
      boxShadow: '0 8px 22px rgba(16,185,129,0.4)',
      borderRadius: 'rounded-xl',
    },
  },
  {
    id: 'btn-glass-pill',
    name: 'Glass Pill',
    category: 'button',
    badge: 'GLASS',
    previewBg: '#121824',
    style: {
      fontFamily: 'sans',
      fontWeight: 'semibold',
      customTextHex: '#ffffff',
      textGradient: undefined,
      textShadow: undefined,
      bgGradient: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)',
      customBgHex: 'rgba(255,255,255,0.12)',
      borderColor: 'rgba(255,255,255,0.4)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      borderRadius: 'rounded-full',
    },
  },

  // ==================== BLOCK & CARD SURFACE TEMPLATES ====================
  {
    id: 'surf-frosted-glass',
    name: 'Frosted Glass',
    category: 'surface',
    badge: 'GLASS',
    previewBg: '#0d1322',
    style: {
      bgGradient: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)',
      borderColor: 'rgba(255,255,255,0.24)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      borderRadius: 'rounded-2xl',
      customTextHex: '#ffffff',
      subtitleColorHex: '#cbd5e1',
    },
  },
  {
    id: 'surf-cyber-box',
    name: 'Cyber Box',
    category: 'surface',
    badge: 'NEON',
    previewBg: '#071221',
    style: {
      fontFamily: 'mono',
      bgGradient: 'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(8,47,73,0.75) 100%)',
      borderColor: 'rgba(34,211,238,0.65)',
      boxShadow: '0 0 22px rgba(34,211,238,0.25)',
      borderRadius: 'rounded-xl',
      customTextHex: '#67e8f9',
      subtitleColorHex: '#bae6fd',
    },
  },
  {
    id: 'surf-cosmic-indigo',
    name: 'Cosmic Indigo',
    category: 'surface',
    badge: 'PRO',
    previewBg: '#121029',
    style: {
      fontFamily: 'sans',
      bgGradient: 'linear-gradient(135deg, rgba(79,70,229,0.36) 0%, rgba(168,85,247,0.20) 100%)',
      borderColor: 'rgba(129,140,248,0.55)',
      boxShadow: '0 12px 28px rgba(79,70,229,0.28)',
      borderRadius: 'rounded-2xl',
      customTextHex: '#ffffff',
      subtitleColorHex: '#c7d2fe',
    },
  },
  {
    id: 'surf-royal-gold',
    name: 'Royal Gold',
    category: 'surface',
    badge: 'VIP',
    previewBg: '#1a150b',
    style: {
      fontFamily: 'serif',
      bgGradient: 'linear-gradient(135deg, rgba(28,25,23,0.96) 0%, rgba(69,26,3,0.78) 100%)',
      borderColor: 'rgba(250,204,21,0.55)',
      boxShadow: '0 10px 26px rgba(234,179,8,0.22)',
      borderRadius: 'rounded-2xl',
      customTextHex: '#fef08a',
      subtitleColorHex: '#fde68a',
    },
  },
  {
    id: 'surf-emerald-saas',
    name: 'Emerald SaaS',
    category: 'surface',
    badge: 'FRESH',
    previewBg: '#071b16',
    style: {
      fontFamily: 'sans',
      bgGradient: 'linear-gradient(135deg, rgba(6,78,59,0.58) 0%, rgba(15,23,42,0.92) 100%)',
      borderColor: 'rgba(52,211,153,0.5)',
      boxShadow: '0 10px 24px rgba(16,185,129,0.2)',
      borderRadius: 'rounded-xl',
      customTextHex: '#ecfdf5',
      subtitleColorHex: '#6ee7b7',
    },
  },
  {
    id: 'surf-crimson-velvet',
    name: 'Crimson Glow',
    category: 'surface',
    badge: 'BOLD',
    previewBg: '#1e0b13',
    style: {
      fontFamily: 'display',
      bgGradient: 'linear-gradient(135deg, rgba(136,19,55,0.55) 0%, rgba(15,10,20,0.94) 100%)',
      borderColor: 'rgba(251,113,133,0.55)',
      boxShadow: '0 10px 24px rgba(244,63,94,0.22)',
      borderRadius: 'rounded-2xl',
      customTextHex: '#fff1f2',
      subtitleColorHex: '#fda4af',
    },
  },
  {
    id: 'surf-sunset-card',
    name: 'Sunset Card',
    category: 'surface',
    badge: 'WARM',
    previewBg: '#1e1017',
    style: {
      fontFamily: 'sans',
      bgGradient: 'linear-gradient(135deg, rgba(236,72,153,0.30) 0%, rgba(245,158,11,0.24) 100%)',
      borderColor: 'rgba(251,146,60,0.55)',
      boxShadow: '0 10px 25px rgba(249,115,22,0.22)',
      borderRadius: 'rounded-2xl',
      customTextHex: '#ffffff',
      subtitleColorHex: '#fed7aa',
    },
  },
  {
    id: 'surf-clean-ivory',
    name: 'Clean Ivory',
    category: 'surface',
    badge: 'LIGHT',
    previewBg: '#e2e8f0',
    style: {
      fontFamily: 'sans',
      bgGradient: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
      borderColor: 'rgba(148,163,184,0.55)',
      boxShadow: '0 8px 20px rgba(15,23,42,0.14)',
      borderRadius: 'rounded-xl',
      customTextHex: '#0f172a',
      subtitleColorHex: '#475569',
    },
  },
];

export const FONT_OPTIONS: {
  id: NonNullable<BlockStyle['fontFamily']>;
  label: string;
  sample: string;
  css: string;
}[] = [
  { id: 'sans', label: 'Sans', sample: 'Clean', css: 'Inter, system-ui, -apple-system, sans-serif' },
  { id: 'display', label: 'Display', sample: 'Modern', css: "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif" },
  { id: 'condensed', label: 'Poster', sample: 'BOLD', css: "'Oswald', 'Bebas Neue', Impact, 'Arial Narrow', sans-serif" },
  { id: 'rounded', label: 'Rounded', sample: 'Soft', css: "'Nunito', 'Quicksand', 'Segoe UI', system-ui, sans-serif" },
  { id: 'serif', label: 'Serif', sample: 'Classic', css: "Georgia, Cambria, 'Times New Roman', serif" },
  { id: 'mono', label: 'Mono', sample: 'Code', css: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace" },
  { id: 'script', label: 'Script', sample: 'Signature', css: "'Pacifico', 'Brush Script MT', 'Segoe Script', cursive" },
];

export const TEXT_GRADIENT_PRESETS: { id: string; label: string; value?: string; preview: string }[] = [
  { id: 'none', label: 'Solid', value: undefined, preview: 'linear-gradient(135deg, #ffffff, #cbd5e1)' },
  { id: 'sunset', label: 'Sunset', value: 'linear-gradient(135deg, #fb7185 0%, #f59e0b 52%, #fde047 100%)', preview: 'linear-gradient(135deg, #fb7185, #f59e0b, #fde047)' },
  { id: 'aurora', label: 'Aurora', value: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #f472b6 100%)', preview: 'linear-gradient(135deg, #38bdf8, #818cf8, #f472b6)' },
  { id: 'gold', label: 'VIP Gold', value: 'linear-gradient(135deg, #fef08a 0%, #eab308 55%, #ca8a04 100%)', preview: 'linear-gradient(135deg, #fef08a, #eab308, #ca8a04)' },
  { id: 'candy', label: 'Candy', value: 'linear-gradient(135deg, #f472b6 0%, #c084fc 55%, #60a5fa 100%)', preview: 'linear-gradient(135deg, #f472b6, #c084fc, #60a5fa)' },
  { id: 'ice', label: 'Ice', value: 'linear-gradient(135deg, #ffffff 0%, #bae6fd 50%, #38bdf8 100%)', preview: 'linear-gradient(135deg, #ffffff, #bae6fd, #38bdf8)' },
  { id: 'emerald', label: 'Mint', value: 'linear-gradient(135deg, #a7f3d0 0%, #34d399 55%, #06b6d4 100%)', preview: 'linear-gradient(135deg, #a7f3d0, #34d399, #06b6d4)' },
  { id: 'fire', label: 'Flame', value: 'linear-gradient(135deg, #fde047 0%, #f97316 55%, #ef4444 100%)', preview: 'linear-gradient(135deg, #fde047, #f97316, #ef4444)' },
];

export const TEXT_SHADOW_PRESETS: { id: string; label: string; value?: string }[] = [
  { id: 'none', label: 'None', value: undefined },
  { id: 'soft', label: 'Soft Drop', value: '0 3px 10px rgba(0,0,0,0.65)' },
  { id: 'noir', label: 'Deep Noir', value: '0 6px 20px rgba(0,0,0,0.9)' },
  { id: 'hard', label: 'Hard Offset', value: '2px 2px 0px rgba(0,0,0,0.95)' },
  { id: 'cyan', label: 'Cyan Glow', value: '0 0 12px rgba(34,211,238,0.9), 0 0 26px rgba(59,130,246,0.55)' },
  { id: 'rose', label: 'Rose Neon', value: '0 0 14px rgba(244,63,94,0.95), 0 0 28px rgba(236,72,153,0.55)' },
  { id: 'gold', label: 'Gold Halo', value: '0 0 14px rgba(250,204,21,0.8), 0 4px 14px rgba(202,138,4,0.45)' },
  { id: 'retro', label: '3D Retro', value: '2px 2px 0px #ec4899, 4px 4px 0px #4f46e5' },
  { id: 'mint', label: 'Mint Glow', value: '0 0 14px rgba(16,185,129,0.85)' },
];

export const TEXT_STROKE_PRESETS: { id: string; label: string; value?: string }[] = [
  { id: 'none', label: 'None', value: undefined },
  { id: 'dark-thin', label: 'Dark 1px', value: '1px #090b10' },
  { id: 'dark-bold', label: 'Dark 1.5px', value: '1.5px #000000' },
  { id: 'white-thin', label: 'White 1px', value: '1px rgba(255,255,255,0.85)' },
  { id: 'cyan', label: 'Cyan Edge', value: '1px #22d3ee' },
  { id: 'rose', label: 'Rose Edge', value: '1px #fb7185' },
  { id: 'gold', label: 'Gold Edge', value: '1px #facc15' },
];

export const BG_GRADIENT_PRESETS: { id: string; label: string; value?: string; fallbackHex?: string }[] = [
  { id: 'none', label: 'Solid / Default', value: undefined },
  { id: 'cyan-blue', label: 'Neon Cyan', value: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', fallbackHex: '#0284c7' },
  { id: 'sunset', label: 'Sunset Pop', value: 'linear-gradient(135deg, #f43f5e 0%, #f59e0b 100%)', fallbackHex: '#f43f5e' },
  { id: 'royal-violet', label: 'Royal Violet', value: 'linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%)', fallbackHex: '#6366f1' },
  { id: 'emerald', label: 'Emerald Mint', value: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)', fallbackHex: '#10b981' },
  { id: 'vip-gold', label: 'VIP Gold', value: 'linear-gradient(135deg, #fde047 0%, #ca8a04 100%)', fallbackHex: '#eab308' },
  { id: 'midnight', label: 'Midnight Glass', value: 'linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 100%)', fallbackHex: '#1e293b' },
];

export const BOX_SHADOW_PRESETS: { id: string; label: string; value?: string }[] = [
  { id: 'none', label: 'Flat', value: undefined },
  { id: 'soft', label: 'Soft Card', value: '0 8px 20px rgba(0,0,0,0.35)' },
  { id: 'elevated', label: 'Deep Pop', value: '0 14px 34px rgba(0,0,0,0.6)' },
  { id: 'neon-cyan', label: 'Cyan Glow', value: '0 0 22px rgba(6,182,212,0.55)' },
  { id: 'neon-rose', label: 'Rose Glow', value: '0 0 22px rgba(244,63,94,0.5)' },
  { id: 'neon-gold', label: 'Gold Glow', value: '0 8px 24px rgba(234,179,8,0.45)' },
  { id: 'arcade', label: '3D Press', value: '0 4px 0 #1e1b4b, 0 10px 22px rgba(79,70,229,0.45)' },
];

export function getTemplatesForBlockType(type: BlockType): BlockStyleTemplate[] {
  if (
    type === 'ui-button' ||
    type === 'ui-fab' ||
    type === 'ui-icon-button' ||
    type === 'ui-counter-button' ||
    type === 'ui-choice-chips' ||
    type === 'ui-toggle-icon' ||
    type === 'ui-tabbar' ||
    type === 'ui-link' ||
    type === 'logic-click'
  ) {
    return [
      ...BLOCK_STYLE_TEMPLATES.filter((t) => t.category === 'button'),
      ...BLOCK_STYLE_TEMPLATES.filter((t) => t.category === 'text-fx'),
    ];
  }
  if (
    type === 'ui-heading' ||
    type === 'ui-paragraph' ||
    type === 'ui-richtext' ||
    type === 'ui-badge' ||
    type === 'ui-stat'
  ) {
    return [
      ...BLOCK_STYLE_TEMPLATES.filter((t) => t.category === 'text-fx'),
      ...BLOCK_STYLE_TEMPLATES.filter((t) => t.category === 'surface'),
    ];
  }
  return [
    ...BLOCK_STYLE_TEMPLATES.filter((t) => t.category === 'surface'),
    ...BLOCK_STYLE_TEMPLATES.filter((t) => t.category === 'text-fx'),
    ...BLOCK_STYLE_TEMPLATES.filter((t) => t.category === 'button'),
  ];
}
