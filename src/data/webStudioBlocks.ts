import { BlockCategory, BlockType, CanvasBlock } from '../types/builder';

export type WebStudioCategoryId =
  | 'layout'
  | 'typography'
  | 'interactive'
  | 'media'
  | 'logic'
  | 'backend';

export interface WebStudioCategoryMeta {
  id: WebStudioCategoryId;
  label: string;
  siLabel: string;
  color: string;
  borderColor: string;
  darkColor: string;
}

export const WEB_STUDIO_CATEGORIES: WebStudioCategoryMeta[] = [
  {
    id: 'layout',
    label: 'Layout',
    siLabel: 'සැකසුම',
    color: '#4C97FF',
    borderColor: '#3373CC',
    darkColor: '#2E66B8',
  },
  {
    id: 'typography',
    label: 'Hero & KPI',
    siLabel: 'ශීර්ෂ',
    color: '#9966FF',
    borderColor: '#774DCB',
    darkColor: '#663DB8',
  },
  {
    id: 'interactive',
    label: 'Forms & UI',
    siLabel: 'පෝරම',
    color: '#CF63CF',
    borderColor: '#BD42BD',
    darkColor: '#A633A6',
  },
  {
    id: 'media',
    label: 'Media',
    siLabel: 'මාධ්‍ය',
    color: '#5CB1D6',
    borderColor: '#2E8EB8',
    darkColor: '#247BA3',
  },
  {
    id: 'logic',
    label: 'Logic',
    siLabel: 'තර්කන',
    color: '#FFAB19',
    borderColor: '#CF8B17',
    darkColor: '#BA7C13',
  },
  {
    id: 'backend',
    label: 'Backend',
    siLabel: 'සේවාදායක',
    color: '#10B981',
    borderColor: '#059669',
    darkColor: '#047857',
  },
];

export interface WebStudioBlockTemplate {
  type: BlockType;
  studioCategory: WebStudioCategoryId;
  blockCategory: BlockCategory;
  name: string;
  siName: string;
  defaultContent: string;
  defaultSubtitle?: string;
  defaults: Partial<CanvasBlock>;
}

export const WEB_STUDIO_BLOCK_TEMPLATES: WebStudioBlockTemplate[] = [
  // LAYOUT
  {
    type: 'ui-navbar',
    studioCategory: 'layout',
    blockCategory: 'layout',
    name: 'Navigation Bar',
    siName: 'මෙනු තීරුව',
    defaultContent: 'SL Builder Brand',
    defaultSubtitle: 'Features · Blueprints · Docs · Pricing',
    defaults: {
      style: { bgColor: 'bg-white/5', textColor: 'text-white', borderRadius: 'rounded-xl', padding: 'p-4' },
    },
  },
  {
    type: 'ui-card',
    studioCategory: 'layout',
    blockCategory: 'ui',
    name: 'Feature Card',
    siName: 'විශේෂාංග කාඩ්පත',
    defaultContent: 'Modular Reactive Architecture',
    defaultSubtitle: 'Deploy responsive interfaces with zero runtime overhead and live preview.',
    defaults: {
      style: { bgColor: 'bg-white/5', borderRadius: 'rounded-xl', padding: 'p-5' },
    },
  },
  {
    type: 'ui-footer',
    studioCategory: 'layout',
    blockCategory: 'layout',
    name: 'Footer Strip',
    siName: 'පාදක තීරුව',
    defaultContent: '© 2026 SL Builder WebStudio.',
    defaultSubtitle: 'Privacy · Terms · API Docs',
    defaults: {
      style: { bgColor: 'bg-transparent', borderRadius: 'rounded-none', padding: 'p-3' },
    },
  },

  // TYPOGRAPHY & KPI
  {
    type: 'ui-heading',
    studioCategory: 'typography',
    blockCategory: 'ui',
    name: 'Hero Headline',
    siName: 'ප්‍රධාන ශීර්ෂය',
    defaultContent: 'Ship modern web apps visually',
    defaultSubtitle: 'Design blocks, wire live reactive state, and compile to clean TSX or Flask.',
    defaults: {
      style: { fontSize: '3xl', textAlign: 'center', textColor: 'text-white', padding: 'py-4 px-2' },
    },
  },
  {
    type: 'ui-paragraph',
    studioCategory: 'typography',
    blockCategory: 'ui',
    name: 'Body Paragraph',
    siName: 'ඡේදය',
    defaultContent: 'Every component stays synchronized between visual inspector controls and exportable code.',
    defaults: {
      style: { fontSize: 'sm', textAlign: 'left', textColor: 'text-slate-300', padding: 'p-3' },
    },
  },
  {
    type: 'ui-badge',
    studioCategory: 'typography',
    blockCategory: 'ui',
    name: 'Section Kicker',
    siName: 'කොටස් ලේබලය',
    defaultContent: 'CLOUD INFRASTRUCTURE · PRODUCTION READY',
    defaults: {
      style: { fontSize: 'xs', textAlign: 'center', textColor: 'text-indigo-400' },
    },
  },
  {
    type: 'ui-stat',
    studioCategory: 'typography',
    blockCategory: 'ui',
    name: 'KPI Stat Card',
    siName: 'KPI අගය',
    defaultContent: '99.98%',
    defaultSubtitle: 'UPTIME SLA GUARANTEE',
    defaults: {
      statValue: '99.98%',
      statLabel: 'UPTIME SLA GUARANTEE',
      style: { bgColor: 'bg-white/5', borderRadius: 'rounded-xl', padding: 'p-4' },
    },
  },

  // INTERACTIVE UI & FORMS
  {
    type: 'ui-button',
    studioCategory: 'interactive',
    blockCategory: 'ui',
    name: 'Action Button',
    siName: 'ක්‍රියා බොත්තම',
    defaultContent: '⚡ Trigger Live Action',
    defaults: {
      buttonVariant: 'primary',
      action: 'increment-counter',
      actionPayload: 'Event fired!',
      style: { bgColor: 'bg-indigo-600', textColor: 'text-white', borderRadius: 'rounded-xl', padding: 'py-3 px-6', textAlign: 'center' },
    },
  },
  {
    type: 'ui-input',
    studioCategory: 'interactive',
    blockCategory: 'ui',
    name: 'Text Input Field',
    siName: 'ආදාන කොටුව',
    defaultContent: 'Enter your email address...',
    defaultSubtitle: 'Work Email',
    defaults: {
      style: { bgColor: 'bg-white/5', borderRadius: 'rounded-xl', padding: 'p-3' },
    },
  },
  {
    type: 'ui-textarea',
    studioCategory: 'interactive',
    blockCategory: 'ui',
    name: 'Message Textarea',
    siName: 'පණිවිඩ කොටුව',
    defaultContent: 'Describe your project requirements...',
    defaultSubtitle: 'Project Brief',
    defaults: {
      style: { bgColor: 'bg-white/5', borderRadius: 'rounded-xl', padding: 'p-3' },
    },
  },
  {
    type: 'ui-pricing',
    studioCategory: 'interactive',
    blockCategory: 'ui',
    name: 'Pricing Plan Card',
    siName: 'මිල පැකේජය',
    defaultContent: 'Pro Studio Plan',
    defaultSubtitle: '$29/mo — Unlimited exports, Firestore sync & team preview',
    defaults: {
      style: { bgColor: 'bg-white/5', borderRadius: 'rounded-2xl', padding: 'p-5' },
    },
  },
  {
    type: 'ui-testimonial',
    studioCategory: 'interactive',
    blockCategory: 'ui',
    name: 'Customer Testimonial',
    siName: 'පාරිභෝගික අදහස',
    defaultContent: 'SL Builder cut our frontend prototyping time by 70% with zero lock-in.',
    defaultSubtitle: 'Kasun Perera',
    defaults: {
      authorRole: 'Lead Architect at LankaCloud',
      style: { bgColor: 'bg-white/5', borderRadius: 'rounded-xl', padding: 'p-5' },
    },
  },
  {
    type: 'ui-accordion',
    studioCategory: 'interactive',
    blockCategory: 'ui',
    name: 'FAQ Accordion',
    siName: 'ප්‍රශ්න සහ පිළිතුරු',
    defaultContent: 'How does multi-target export work?',
    defaultSubtitle: 'SL Builder compiles your visual canvas directly to standalone HTML5, React 19 TSX, and Python Flask routes.',
    defaults: {
      isExpanded: false,
      style: { bgColor: 'bg-white/5', borderRadius: 'rounded-xl', padding: 'p-0' },
    },
  },

  // MEDIA
  {
    type: 'ui-image',
    studioCategory: 'media',
    blockCategory: 'media',
    name: 'Visual Media Banner',
    siName: 'රූප රාමුව',
    defaultContent: 'Product Architecture Showcase',
    defaultSubtitle: 'High-contrast SVG / Media Preview Container',
    defaults: {
      style: { bgColor: 'bg-white/5', borderRadius: 'rounded-2xl', padding: 'p-4' },
    },
  },
  {
    type: 'ui-avatar',
    studioCategory: 'media',
    blockCategory: 'media',
    name: 'Profile Card',
    siName: 'පැතිකඩ කාඩ්පත',
    defaultContent: 'Nimali Jayawardena',
    defaultSubtitle: 'Principal Frontend Engineer',
    defaults: {
      style: { bgColor: 'bg-white/5', borderRadius: 'rounded-xl', padding: 'p-4' },
    },
  },

  // REACTIVE LOGIC
  {
    type: 'logic-counter',
    studioCategory: 'logic',
    blockCategory: 'logic',
    name: 'Reactive State Counter',
    siName: 'සජීවී ගණකය',
    defaultContent: 'Clicks Registered',
    defaults: {
      counterValue: 0,
      action: 'increment-counter',
      style: { bgColor: 'bg-indigo-950/40', borderRadius: 'rounded-2xl', padding: 'p-5', textAlign: 'center' },
    },
  },
  {
    type: 'logic-toggle',
    studioCategory: 'logic',
    blockCategory: 'logic',
    name: 'Boolean State Switch',
    siName: 'සක්‍රිය/අක්‍රිය ස්විචය',
    defaultContent: 'Enable Real-Time Telemetry Sync',
    defaultSubtitle: 'Toggles live feature flag inside preview state',
    defaults: {
      isExpanded: true,
      action: 'toggle-visibility',
      style: { bgColor: 'bg-amber-950/25', borderRadius: 'rounded-xl', padding: 'p-4' },
    },
  },
  {
    type: 'logic-click',
    studioCategory: 'logic',
    blockCategory: 'logic',
    name: 'Click Event Listener',
    siName: 'ක්ලික් සිදුවීම',
    defaultContent: 'On Button Trigger -> Emit State Update',
    defaultSubtitle: 'Runs linked target mutation when triggered',
    defaults: {
      action: 'alert',
      actionPayload: 'State mutation executed!',
      style: { bgColor: 'bg-amber-950/25', borderRadius: 'rounded-xl', padding: 'p-4' },
    },
  },
  {
    type: 'logic-timer',
    studioCategory: 'logic',
    blockCategory: 'logic',
    name: 'Countdown / Live Timer',
    siName: 'සජීවී ටයිමරය',
    defaultContent: 'Launch Window Countdown',
    defaultSubtitle: 'Real-time reactive seconds tick',
    defaults: {
      counterValue: 60,
      style: { bgColor: 'bg-amber-950/25', borderRadius: 'rounded-xl', padding: 'p-4' },
    },
  },

  // BACKEND & API
  {
    type: 'backend-flask',
    studioCategory: 'backend',
    blockCategory: 'backend',
    name: 'Python Flask Route',
    siName: 'Flask API මාර්ගය',
    defaultContent: 'GET /api/v1/metrics',
    defaultSubtitle: 'Returns server health and active deployment telemetry',
    defaults: {
      apiEndpoint: '/api/v1/metrics',
      action: 'call-api',
      style: { bgColor: 'bg-emerald-950/30', borderRadius: 'rounded-xl', padding: 'p-4' },
    },
  },
  {
    type: 'backend-fetch',
    studioCategory: 'backend',
    blockCategory: 'backend',
    name: 'REST Fetch Client',
    siName: 'REST Fetch ඉල්ලීම',
    defaultContent: 'POST /api/v1/subscribe',
    defaultSubtitle: 'Submits JSON payload and updates UI response badge',
    defaults: {
      apiEndpoint: '/api/v1/subscribe',
      action: 'call-api',
      style: { bgColor: 'bg-emerald-950/30', borderRadius: 'rounded-xl', padding: 'p-4' },
    },
  },
];

export function createCanvasBlockFromTemplate(tpl: WebStudioBlockTemplate): CanvasBlock {
  return {
    id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: tpl.type,
    category: tpl.blockCategory,
    name: tpl.name,
    content: tpl.defaultContent,
    subtitle: tpl.defaultSubtitle,
    style: { ...(tpl.defaults.style || {}) },
    ...tpl.defaults,
  };
}

export function getCategoryMetaForBlockType(type: BlockType): WebStudioCategoryMeta {
  const match = WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.type === type);
  const catId = match?.studioCategory || 'layout';
  return (
    WEB_STUDIO_CATEGORIES.find((c) => c.id === catId) || WEB_STUDIO_CATEGORIES[0]
  );
}
