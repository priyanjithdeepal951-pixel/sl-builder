export interface VectorIconDef {
  id: string;
  label: string;
  svgInner: string;
}

export const ICON_LIBRARY: VectorIconDef[] = [
  {
    id: 'sparkles',
    label: 'Sparkles',
    svgInner:
      '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  },
  {
    id: 'zap',
    label: 'Lightning',
    svgInner: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  },
  {
    id: 'rocket',
    label: 'Rocket',
    svgInner:
      '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  },
  {
    id: 'shield',
    label: 'Shield',
    svgInner: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  },
  {
    id: 'heart',
    label: 'Heart',
    svgInner:
      '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  },
  {
    id: 'star',
    label: 'Star',
    svgInner:
      '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  },
  {
    id: 'globe',
    label: 'Globe',
    svgInner:
      '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  },
  {
    id: 'code',
    label: 'Code',
    svgInner: '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
  },
  {
    id: 'database',
    label: 'Database',
    svgInner:
      '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
  },
  {
    id: 'bell',
    label: 'Bell',
    svgInner:
      '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  },
  {
    id: 'user',
    label: 'User',
    svgInner:
      '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  },
  {
    id: 'check',
    label: 'Check',
    svgInner: '<path d="M20 6 9 17l-5-5"/>',
  },
  {
    id: 'camera',
    label: 'Camera',
    svgInner:
      '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  },
  {
    id: 'video',
    label: 'Play Video',
    svgInner:
      '<polygon points="6 3 20 12 6 21 6 3"/>',
  },
  {
    id: 'music',
    label: 'Music',
    svgInner:
      '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  },
  {
    id: 'mail',
    label: 'Mail',
    svgInner:
      '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  },
  {
    id: 'phone',
    label: 'Phone',
    svgInner:
      '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  },
  {
    id: 'home',
    label: 'Home',
    svgInner:
      '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  },
  {
    id: 'search',
    label: 'Search',
    svgInner: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  },
  {
    id: 'settings',
    label: 'Settings',
    svgInner:
      '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  },
  {
    id: 'shopping-bag',
    label: 'Shop',
    svgInner:
      '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  },
  {
    id: 'flame',
    label: 'Flame',
    svgInner:
      '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  },
  {
    id: 'crown',
    label: 'Crown',
    svgInner:
      '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>',
  },
  {
    id: 'compass',
    label: 'Compass',
    svgInner:
      '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  },
];

export function getVectorIconDef(iconName?: string): VectorIconDef {
  const key = (iconName || 'sparkles').toLowerCase().trim();
  return ICON_LIBRARY.find((i) => i.id === key) || ICON_LIBRARY[0];
}

export function getVectorIconSvgHtml(
  iconName?: string,
  sizePx = 28,
  className = ''
): string {
  const def = getVectorIconDef(iconName);
  const clsAttr = className ? ` class="${className}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${clsAttr}>${def.svgInner}</svg>`;
}

export interface ParsedVideoSource {
  kind: 'youtube' | 'vimeo' | 'direct' | 'empty';
  embedUrl: string;
  originalUrl: string;
  videoId?: string;
}

function parseYouTubeTimeToSeconds(tParam: string | null): number {
  if (!tParam) return 0;
  if (/^\d+$/.test(tParam)) return Number(tParam);
  let total = 0;
  const hMatch = tParam.match(/(\d+)h/);
  const mMatch = tParam.match(/(\d+)m/);
  const sMatch = tParam.match(/(\d+)s/);
  if (hMatch) total += Number(hMatch[1]) * 3600;
  if (mMatch) total += Number(mMatch[1]) * 60;
  if (sMatch) total += Number(sMatch[1]);
  return total;
}

export function parseVideoUrl(rawUrl?: string): ParsedVideoSource {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return { kind: 'empty', embedUrl: '', originalUrl: '' };
  }

  const normalized =
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
      ? trimmed
      : `https://${trimmed}`;

  try {
    const u = new URL(normalized);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const vid = u.pathname.replace(/^\/+/, '').split('/')[0];
      if (vid) {
        const start = parseYouTubeTimeToSeconds(u.searchParams.get('t') || u.searchParams.get('start'));
        const qs = start > 0 ? `?start=${start}&rel=0` : '?rel=0';
        return {
          kind: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${vid}${qs}`,
          originalUrl: trimmed,
          videoId: vid,
        };
      }
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
      let vid = u.searchParams.get('v') || '';
      if (!vid && u.pathname.startsWith('/shorts/')) {
        vid = u.pathname.split('/')[2] || '';
      } else if (!vid && u.pathname.startsWith('/live/')) {
        vid = u.pathname.split('/')[2] || '';
      } else if (!vid && u.pathname.startsWith('/embed/')) {
        vid = u.pathname.split('/')[2] || '';
      }
      if (vid) {
        const start = parseYouTubeTimeToSeconds(u.searchParams.get('t') || u.searchParams.get('start'));
        const qs = start > 0 ? `?start=${start}&rel=0` : '?rel=0';
        return {
          kind: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${vid}${qs}`,
          originalUrl: trimmed,
          videoId: vid,
        };
      }
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      const vimeoId = parts[parts.length - 1];
      if (vimeoId && /^\d+$/.test(vimeoId)) {
        return {
          kind: 'vimeo',
          embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
          originalUrl: trimmed,
          videoId: vimeoId,
        };
      }
    }
  } catch {
    // fallback below
  }

  return { kind: 'direct', embedUrl: normalized, originalUrl: trimmed };
}
