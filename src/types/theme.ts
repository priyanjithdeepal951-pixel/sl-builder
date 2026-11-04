export type ThemeId = 'cosmic' | 'cyberpunk' | 'emerald' | 'amber' | 'titanium';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  subtitle: string;
  emoji: string;
  accentHex: string;
  secondaryHex: string;
  bgHex: string;
  cardBg: string;
  primaryBg: string;
  primaryHover: string;
  primaryText: string;
  borderAccent: string;
  borderHover: string;
  glowShadow: string;
  badgeBg: string;
  badgeText: string;
  gradientText: string;
  particleColors: [string, string];
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic Indigo',
    subtitle: 'Deep space glow & violet aura',
    emoji: '🌌',
    accentHex: '#6366f1',
    secondaryHex: '#a855f7',
    bgHex: '#060913',
    cardBg: 'rgba(11, 15, 25, 0.75)',
    primaryBg: 'bg-indigo-600',
    primaryHover: 'hover:bg-indigo-500',
    primaryText: 'text-indigo-400',
    borderAccent: 'border-indigo-500/30',
    borderHover: 'hover:border-indigo-500/60',
    glowShadow: 'shadow-indigo-600/30',
    badgeBg: 'bg-indigo-950/70 border-indigo-800/50',
    badgeText: 'text-indigo-300',
    gradientText: 'from-indigo-300 via-indigo-400 to-purple-400',
    particleColors: ['199, 210, 254', '224, 231, 255'],
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    subtitle: 'Electric cyan & neon magenta',
    emoji: '⚡',
    accentHex: '#06b6d4',
    secondaryHex: '#ec4899',
    bgHex: '#030712',
    cardBg: 'rgba(9, 14, 26, 0.8)',
    primaryBg: 'bg-cyan-500',
    primaryHover: 'hover:bg-cyan-400',
    primaryText: 'text-cyan-400',
    borderAccent: 'border-cyan-500/40',
    borderHover: 'hover:border-cyan-400/80',
    glowShadow: 'shadow-cyan-500/35',
    badgeBg: 'bg-cyan-950/70 border-cyan-800/50',
    badgeText: 'text-cyan-300',
    gradientText: 'from-cyan-300 via-teal-300 to-fuchsia-400',
    particleColors: ['6, 182, 212', '236, 72, 153'],
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Matrix',
    subtitle: 'Obsidian terminal & hacker mint',
    emoji: '🌲',
    accentHex: '#10b981',
    secondaryHex: '#059669',
    bgHex: '#020d08',
    cardBg: 'rgba(6, 18, 12, 0.8)',
    primaryBg: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-500',
    primaryText: 'text-emerald-400',
    borderAccent: 'border-emerald-500/30',
    borderHover: 'hover:border-emerald-500/70',
    glowShadow: 'shadow-emerald-600/30',
    badgeBg: 'bg-emerald-950/70 border-emerald-800/50',
    badgeText: 'text-emerald-300',
    gradientText: 'from-emerald-300 via-teal-300 to-green-400',
    particleColors: ['52, 211, 153', '167, 243, 208'],
  },
  amber: {
    id: 'amber',
    name: 'Solar Amber',
    subtitle: 'Warm gold & dark espresso carbon',
    emoji: '🌅',
    accentHex: '#f59e0b',
    secondaryHex: '#ea580c',
    bgHex: '#0c0803',
    cardBg: 'rgba(18, 13, 7, 0.8)',
    primaryBg: 'bg-amber-500',
    primaryHover: 'hover:bg-amber-400',
    primaryText: 'text-amber-400',
    borderAccent: 'border-amber-500/30',
    borderHover: 'hover:border-amber-500/70',
    glowShadow: 'shadow-amber-500/30',
    badgeBg: 'bg-amber-950/70 border-amber-800/50',
    badgeText: 'text-amber-300',
    gradientText: 'from-amber-200 via-amber-400 to-orange-400',
    particleColors: ['251, 191, 36', '253, 230, 138'],
  },
  titanium: {
    id: 'titanium',
    name: 'Frost Titanium',
    subtitle: 'Sleek slate graphite & ice blue',
    emoji: '❄️',
    accentHex: '#38bdf8',
    secondaryHex: '#94a3b8',
    bgHex: '#080c14',
    cardBg: 'rgba(12, 17, 28, 0.8)',
    primaryBg: 'bg-sky-600',
    primaryHover: 'hover:bg-sky-500',
    primaryText: 'text-sky-400',
    borderAccent: 'border-sky-500/30',
    borderHover: 'hover:border-sky-500/70',
    glowShadow: 'shadow-sky-600/30',
    badgeBg: 'bg-sky-950/70 border-sky-800/50',
    badgeText: 'text-sky-300',
    gradientText: 'from-sky-200 via-blue-300 to-slate-200',
    particleColors: ['186, 230, 253', '241, 245, 249'],
  },
};
