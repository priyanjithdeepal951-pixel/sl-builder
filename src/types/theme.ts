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
    name: 'Studio Cobalt',
    subtitle: 'Architectural cobalt & crisp slate',
    emoji: '◈',
    accentHex: '#2563eb',
    secondaryHex: '#0ea5e9',
    bgHex: '#0b0c0f',
    cardBg: 'rgba(18, 20, 26, 0.85)',
    primaryBg: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-500',
    primaryText: 'text-blue-600 dark:text-blue-400',
    borderAccent: 'border-blue-600/30',
    borderHover: 'hover:border-blue-500/60',
    glowShadow: 'shadow-blue-600/20',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/50',
    badgeText: 'text-blue-700 dark:text-blue-300',
    gradientText: 'from-blue-600 via-sky-600 to-teal-500 dark:from-blue-400 dark:via-sky-300 dark:to-teal-300',
    particleColors: ['37, 99, 235', '14, 165, 233'],
  },
  emerald: {
    id: 'emerald',
    name: 'Alpine Jade',
    subtitle: 'Botanical teal & mineral stone',
    emoji: '◇',
    accentHex: '#059669',
    secondaryHex: '#0d9488',
    bgHex: '#080e0c',
    cardBg: 'rgba(12, 20, 17, 0.85)',
    primaryBg: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-500',
    primaryText: 'text-emerald-600 dark:text-emerald-400',
    borderAccent: 'border-emerald-600/30',
    borderHover: 'hover:border-emerald-500/60',
    glowShadow: 'shadow-emerald-600/20',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/50',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    gradientText: 'from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300',
    particleColors: ['5, 150, 105', '13, 148, 136'],
  },
  amber: {
    id: 'amber',
    name: 'Ochre Brass',
    subtitle: 'Warm bronze & graphite carbon',
    emoji: '◎',
    accentHex: '#d97706',
    secondaryHex: '#ea580c',
    bgHex: '#0e0c09',
    cardBg: 'rgba(20, 17, 12, 0.85)',
    primaryBg: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-500',
    primaryText: 'text-amber-600 dark:text-amber-400',
    borderAccent: 'border-amber-600/30',
    borderHover: 'hover:border-amber-500/60',
    glowShadow: 'shadow-amber-600/20',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/50',
    badgeText: 'text-amber-700 dark:text-amber-300',
    gradientText: 'from-amber-600 via-orange-500 to-rose-500 dark:from-amber-300 dark:via-orange-300 dark:to-rose-300',
    particleColors: ['217, 119, 6', '234, 88, 12'],
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Nordic Cyan',
    subtitle: 'Crisp glacier cyan & obsidian',
    emoji: '△',
    accentHex: '#0284c7',
    secondaryHex: '#06b6d4',
    bgHex: '#090d12',
    cardBg: 'rgba(13, 19, 27, 0.85)',
    primaryBg: 'bg-sky-600',
    primaryHover: 'hover:bg-sky-500',
    primaryText: 'text-sky-600 dark:text-sky-400',
    borderAccent: 'border-sky-600/30',
    borderHover: 'hover:border-sky-500/60',
    glowShadow: 'shadow-sky-600/20',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800/50',
    badgeText: 'text-sky-700 dark:text-sky-300',
    gradientText: 'from-sky-600 via-cyan-600 to-teal-500 dark:from-sky-300 dark:via-cyan-300 dark:to-teal-300',
    particleColors: ['2, 132, 199', '6, 182, 212'],
  },
  titanium: {
    id: 'titanium',
    name: 'Monochrome Ink',
    subtitle: 'Pure editorial slate & silver',
    emoji: '■',
    accentHex: '#18181b',
    secondaryHex: '#52525b',
    bgHex: '#09090b',
    cardBg: 'rgba(20, 20, 23, 0.85)',
    primaryBg: 'bg-zinc-900 dark:bg-zinc-100',
    primaryHover: 'hover:bg-zinc-800 dark:hover:bg-white',
    primaryText: 'text-zinc-900 dark:text-zinc-100',
    borderAccent: 'border-zinc-500/30',
    borderHover: 'hover:border-zinc-400/60',
    glowShadow: 'shadow-zinc-900/15',
    badgeBg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
    badgeText: 'text-zinc-800 dark:text-zinc-200',
    gradientText: 'from-zinc-900 via-stone-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500',
    particleColors: ['63, 63, 70', '113, 113, 122'],
  },
};
