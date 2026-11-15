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
  customTextHex?: string;
  subtitleColorHex?: string;
  bgColor?: string;
  customBgHex?: string;
  borderColor?: string;
  fontFamily?: 'sans' | 'serif' | 'mono' | 'display' | 'rounded';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  textAlign?: 'left' | 'center' | 'right';
  padding?: string;
  borderRadius?: string;
  shadow?: string;
}

export type NavbarLinkAction =
  | 'navigate-page'
  | 'scroll-to-block'
  | 'open-url'
  | 'alert';

export interface NavbarLinkItem {
  id: string;
  label: string;
  action: NavbarLinkAction;
  targetPageId?: string;
  targetBlockId?: string;
  url?: string;
  message?: string;
}

export interface CanvasBlock {
  id: string;
  type: BlockType;
  category: BlockCategory;
  name: string;
  content: string;
  subtitle?: string;
  style: BlockStyle;
  // Logic & navigation wiring
  targetId?: string;
  targetPageId?: string;
  action?:
    | 'change-text'
    | 'increment-counter'
    | 'toggle-visibility'
    | 'call-api'
    | 'alert'
    | 'navigate-page'
    | 'scroll-to-block'
    | 'open-url'
    | 'submit-form';
  actionPayload?: string;
  apiEndpoint?: string;
  navLinks?: NavbarLinkItem[];
  // Custom metadata
  imageUrl?: string;
  badgeText?: string;
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

export type PageLiveAnimationType =
  | 'none'
  | 'meteors'
  | 'starfield'
  | 'aurora'
  | 'particles'
  | 'cyber-grid'
  | 'snow';

export interface PageStyleSettings {
  backgroundType?: 'solid' | 'gradient';
  backgroundColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: 'to bottom' | 'to bottom right' | 'to right' | 'radial';
  textColor?: string;
  accentColor?: string;
  liveAnimation?: PageLiveAnimationType;
  animationColor?: string;
  animationSpeed?: 'slow' | 'normal' | 'fast';
  animationDensity?: 'low' | 'medium' | 'high';
}

export interface SitePage {
  id: string;
  name: string;
  slug: string;
  blocks: CanvasBlock[];
  pageStyle?: PageStyleSettings;
}

export interface Project {
  id: string;
  userId?: string;
  name: string;
  category: 'Landing' | 'Portfolio' | 'E-Commerce' | 'Web Apps';
  updatedAt: string;
  status: 'Active' | 'Draft' | 'Published';
  blocks: CanvasBlock[];
  pages?: SitePage[];
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
  isSuspended?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteTemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  tag: string;
  blocksCount: number;
  accent: string;
}

export interface SiteSettingsConfig {
  brandName: string;
  heroKicker: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  announcementEnabled: boolean;
  announcementText: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowSignups: boolean;
  allowDemoLogin: boolean;
  maxProjectsPerUser: number;
  defaultTheme: 'cosmic' | 'cyberpunk' | 'emerald' | 'amber' | 'titanium';
  footerCopyright: string;
  footerLinksText: string;
  templates: SiteTemplateItem[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface AdminRecord {
  uid: string;
  email: string;
  name: string;
  role: 'Super Admin' | 'Admin';
  grantedBy: string;
  grantedAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  targetType: 'settings' | 'user' | 'project' | 'admin' | 'security';
  targetId: string;
  details: string;
  createdAt: string;
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export type CanvasSurfaceTheme = 'obsidian' | 'midnight' | 'slate' | 'pure-black';
export type CanvasGridPattern = 'dots' | 'blueprint' | 'plain';
