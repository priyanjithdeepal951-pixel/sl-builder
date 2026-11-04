export type BlockCategory = 'ui' | 'logic' | 'backend' | 'layout' | 'media';

export type BlockType =
  // UI
  | 'ui-heading'
  | 'ui-paragraph'
  | 'ui-button'
  | 'ui-badge'
  | 'ui-card'
  | 'ui-input'
  | 'ui-textarea'
  | 'ui-navbar'
  | 'ui-footer'
  | 'ui-pricing'
  | 'ui-stat'
  | 'ui-testimonial'
  | 'ui-accordion'
  // Media
  | 'ui-image'
  | 'ui-avatar'
  // Logic
  | 'logic-click'
  | 'logic-counter'
  | 'logic-toggle'
  | 'logic-timer'
  // Backend
  | 'backend-fetch'
  | 'backend-flask'
  | 'backend-blockly';

export interface BlockStyle {
  textColor?: string;
  bgColor?: string;
  borderColor?: string;
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  textAlign?: 'left' | 'center' | 'right';
  padding?: string;
  borderRadius?: string;
  shadow?: string;
}

export interface CanvasBlock {
  id: string;
  type: BlockType;
  category: BlockCategory;
  name: string;
  content: string;
  subtitle?: string;
  style: BlockStyle;
  // Logic wiring
  targetId?: string;
  action?: 'change-text' | 'increment-counter' | 'toggle-visibility' | 'call-api' | 'alert';
  actionPayload?: string;
  apiEndpoint?: string;
  // Custom metadata
  imageUrl?: string;
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  counterValue?: number;
  statValue?: string;
  statLabel?: string;
  authorRole?: string;
  authorAvatar?: string;
  isExpanded?: boolean;
}

export interface Project {
  id: string;
  name: string;
  category: 'Landing' | 'Portfolio' | 'E-Commerce' | 'Web Apps';
  updatedAt: string;
  status: 'Active' | 'Draft' | 'Published';
  blocks: CanvasBlock[];
  thumbnailColor?: string;
  description?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: string;
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export type CanvasSurfaceTheme = 'obsidian' | 'midnight' | 'slate' | 'pure-black';
export type CanvasGridPattern = 'dots' | 'blueprint' | 'plain';
