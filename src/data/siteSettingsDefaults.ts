import { SiteSettingsConfig } from '../types/builder';

export const SUPER_ADMIN_EMAIL = 'priyanjithdeepal951@gmail.com';

export const DEFAULT_SITE_SETTINGS: SiteSettingsConfig = {
  brandName: 'BlockCraft Studio',
  heroKicker: 'Visual Drag & Drop · Reactive State Wiring · 4-Way Code Export',
  heroTitle: 'Visual web studio for engineers who',
  heroHighlight: 'ship fast.',
  heroSubtitle:
    'Design responsive layout blocks visually, connect reactive logic wires without configuration, and export pristine HTML, React 19 TSX, and Python Flask REST backends.',
  heroPrimaryCta: 'Launch Visual Studio',
  heroSecondaryCta: 'Inspect Studio Engine',
  announcementEnabled: false,
  announcementText:
    'BlockCraft Studio WebStudio 2026 — Multi-page visual builder and live CSS animations are ready.',
  maintenanceMode: false,
  maintenanceMessage:
    'BlockCraft Studio is currently undergoing scheduled maintenance. Please check back shortly.',
  allowSignups: true,
  allowDemoLogin: true,
  maxProjectsPerUser: 50,
  defaultTheme: 'cosmic',
  footerCopyright: 'BlockCraft Studio · Visual Logic & Web Studio',
  footerLinksText: 'Features · Blueprints · Projects Hub',
  templates: [
    {
      id: 'tpl-agency',
      name: 'Agency Studio Showcase',
      category: 'Agency',
      description:
        'High-conversion startup showcase with hero narrative, reactive metrics, and CTA triggers.',
      accent: 'from-indigo-600/30 to-purple-600/10',
      tag: 'Full Stack',
      blocksCount: 7,
    },
    {
      id: 'tpl-portfolio',
      name: 'Developer Portfolio',
      category: 'Portfolio',
      description:
        'Dark-mode minimal portfolio with interactive project cards, skills grid, and contact event wire.',
      accent: 'from-blue-600/30 to-cyan-600/10',
      tag: 'Interactive',
      blocksCount: 5,
    },
    {
      id: 'tpl-saas',
      name: 'SaaS Product Waitlist',
      category: 'SaaS',
      description:
        'Early bird launch page with live email input validation, countdown logic, and social proof.',
      accent: 'from-purple-600/30 to-pink-600/10',
      tag: 'Lead Gen',
      blocksCount: 6,
    },
    {
      id: 'tpl-ecom',
      name: 'Modern E-Commerce Store',
      category: 'Commerce',
      description:
        'Electronics catalog with interactive pricing cards, spec badges, and cart simulation.',
      accent: 'from-emerald-600/30 to-teal-600/10',
      tag: 'Reactive Store',
      blocksCount: 8,
    },
  ],
};
