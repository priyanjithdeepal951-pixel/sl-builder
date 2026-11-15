import { PageLiveAnimationType, PageStyleSettings } from '../types/builder';

export interface PageThemePreset {
  id: string;
  name: string;
  siName: string;
  settings: Pick<
    PageStyleSettings,
    | 'backgroundType'
    | 'backgroundColor'
    | 'gradientFrom'
    | 'gradientTo'
    | 'gradientDirection'
    | 'textColor'
    | 'accentColor'
  >;
}

export const PAGE_THEME_PRESETS: PageThemePreset[] = [
  {
    id: 'obsidian',
    name: 'Obsidian Night',
    siName: 'කළු රාත්‍රී තේමාව',
    settings: {
      backgroundType: 'solid',
      backgroundColor: '#090B10',
      textColor: '#f1f5f9',
      accentColor: '#4D97FF',
    },
  },
  {
    id: 'cosmos',
    name: 'Deep Cosmos',
    siName: 'අභ්‍යවකාශ අඳුරු',
    settings: {
      backgroundType: 'gradient',
      gradientFrom: '#050816',
      gradientTo: '#1b1444',
      gradientDirection: 'to bottom right',
      textColor: '#f8fafc',
      accentColor: '#818cf8',
    },
  },
  {
    id: 'midnight-ocean',
    name: 'Midnight Ocean',
    siName: 'නිල් සාගර',
    settings: {
      backgroundType: 'gradient',
      gradientFrom: '#04111d',
      gradientTo: '#0c3547',
      gradientDirection: 'to bottom',
      textColor: '#e2e8f0',
      accentColor: '#38bdf8',
    },
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Mist',
    siName: 'කොළ අඳුරු',
    settings: {
      backgroundType: 'gradient',
      gradientFrom: '#041410',
      gradientTo: '#064e3b',
      gradientDirection: 'to bottom right',
      textColor: '#ecfdf5',
      accentColor: '#34d399',
    },
  },
  {
    id: 'crimson-velvet',
    name: 'Crimson Velvet',
    siName: 'රතු වෙල්වට්',
    settings: {
      backgroundType: 'gradient',
      gradientFrom: '#14060c',
      gradientTo: '#4c0519',
      gradientDirection: 'radial',
      textColor: '#fff1f2',
      accentColor: '#fb7185',
    },
  },
  {
    id: 'pure-light',
    name: 'Crisp White',
    siName: 'සුදු ආලෝක තේමාව',
    settings: {
      backgroundType: 'solid',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      accentColor: '#2563eb',
    },
  },
  {
    id: 'warm-paper',
    name: 'Warm Editorial',
    siName: 'උණුසුම් සුදු',
    settings: {
      backgroundType: 'gradient',
      gradientFrom: '#faf8f5',
      gradientTo: '#eef2ff',
      gradientDirection: 'to bottom right',
      textColor: '#1e293b',
      accentColor: '#4f46e5',
    },
  },
];

export interface LiveAnimationPreset {
  id: PageLiveAnimationType;
  name: string;
  siName: string;
  description: string;
  defaultColor: string;
}

export const LIVE_ANIMATION_PRESETS: LiveAnimationPreset[] = [
  {
    id: 'none',
    name: 'None (Static)',
    siName: 'සජීවීකරණ නැත',
    description: 'Clean static page background without motion effects.',
    defaultColor: '#818cf8',
  },
  {
    id: 'meteors',
    name: 'Meteor Shower',
    siName: 'උල්කාපාත වැස්ස',
    description: 'Diagonal glowing shooting stars streaking across the sky.',
    defaultColor: '#818cf8',
  },
  {
    id: 'starfield',
    name: 'Twinkling Stars',
    siName: 'දිලිසෙන තරු රටා',
    description: 'Layered cosmic starlight twinkling gently across the canvas.',
    defaultColor: '#e2e8f0',
  },
  {
    id: 'aurora',
    name: 'Aurora Glow',
    siName: 'උතුරු ආලෝක රැළි',
    description: 'Slow-drifting ambient radial light waves behind your site.',
    defaultColor: '#38bdf8',
  },
  {
    id: 'particles',
    name: 'Floating Sparks',
    siName: 'පාවෙන ආලෝක අංශු',
    description: 'Warm rising ambient bokeh sparks floating upward.',
    defaultColor: '#fbbf24',
  },
  {
    id: 'cyber-grid',
    name: 'Pulse Grid',
    siName: 'සජීවී ග්‍රිඩ් රටාව',
    description: 'Architectural wireframe grid softly breathing in the background.',
    defaultColor: '#34d399',
  },
  {
    id: 'snow',
    name: 'Gentle Snowfall',
    siName: 'හිම පතනය',
    description: 'Calm drifting snow flakes falling smoothly down the page.',
    defaultColor: '#ffffff',
  },
];

export function resolvePageBackgroundCss(pageStyle?: PageStyleSettings): string {
  if (!pageStyle) return '#090B10';
  if (pageStyle.backgroundType === 'gradient') {
    const from = pageStyle.gradientFrom || '#050816';
    const to = pageStyle.gradientTo || '#1b1444';
    const dir = pageStyle.gradientDirection || 'to bottom right';
    if (dir === 'radial') {
      return `radial-gradient(circle at top center, ${to} 0%, ${from} 72%)`;
    }
    return `linear-gradient(${dir}, ${from}, ${to})`;
  }
  return pageStyle.backgroundColor || '#090B10';
}

export function isLightPageBackground(pageStyle?: PageStyleSettings): boolean {
  const hex =
    pageStyle?.backgroundType === 'gradient'
      ? pageStyle.gradientFrom || '#090B10'
      : pageStyle?.backgroundColor || '#090B10';
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

export function getAnimationCount(density?: 'low' | 'medium' | 'high'): number {
  if (density === 'low') return 7;
  if (density === 'high') return 22;
  return 13;
}

export function getAnimationSpeedMultiplier(speed?: 'slow' | 'normal' | 'fast'): number {
  if (speed === 'slow') return 1.65;
  if (speed === 'fast') return 0.6;
  return 1;
}
