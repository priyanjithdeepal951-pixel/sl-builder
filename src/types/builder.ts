import type { StudioWorkspaceState } from './studio';

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

export interface CollaboratorMember {
  uid: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt?: string;
  isOnline?: boolean;
}

export interface ProjectMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar: string;
  text: string;
  createdAt: string;
}

export interface ProjectPresence {
  id: string;
  userId: string;
  name: string;
  email?: string;
  avatar?: string;
  activeBlockId?: string | null;
  cursorX?: number;
  cursorY?: number;
  lastSeen: string;
}

export interface Project {
  id: string;
  userId?: string;
  name: string;
  category: 'Landing' | 'Portfolio' | 'E-Commerce' | 'Web Apps';
  updatedAt: string;
  status: 'Active' | 'Draft' | 'Published';
  blocks: CanvasBlock[];
  studioState?: StudioWorkspaceState;
  thumbnailColor?: string;
  description?: string;
  collaboratorUids?: string[];
  collaborators?: CollaboratorMember[];
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
