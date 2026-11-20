import type { StudioWorkspaceState } from './studio';

export type BlockCategory = 'ui' | 'logic' | 'backend' | 'layout' | 'media';

export type BlockType =
  // Layout & Containers
  | 'ui-navbar'
  | 'ui-sidebar'
  | 'ui-tabbar'
  | 'ui-section'
  | 'ui-row'
  | 'ui-column'
  | 'ui-grid'
  | 'ui-card'
  | 'ui-modal'
  | 'ui-link'
  | 'ui-footer'
  // Typography & KPI
  | 'ui-heading'
  | 'ui-paragraph'
  | 'ui-badge'
  | 'ui-stat'
  // Interactive UI & Forms
  | 'ui-button'
  | 'ui-input'
  | 'ui-textarea'
  | 'ui-select'
  | 'ui-checkbox'
  | 'ui-file-upload'
  | 'ui-pricing'
  | 'ui-testimonial'
  | 'ui-accordion'
  // Media & Basic Elements
  | 'ui-image'
  | 'ui-icon'
  | 'ui-video'
  | 'ui-avatar'
  // Events & Triggers (Hat Blocks)
  | 'logic-onload'
  | 'logic-click'
  | 'logic-oninput'
  | 'logic-onsubmit'
  | 'logic-onkey'
  // Logic, Control, Data & Utilities
  | 'logic-counter'
  | 'logic-toggle'
  | 'logic-timer'
  | 'logic-if'
  | 'logic-loop'
  | 'logic-variable'
  | 'logic-list'
  | 'logic-object'
  | 'logic-math-text'
  | 'logic-feedback'
  // Backend, Storage, Auth & Device
  | 'backend-storage'
  | 'backend-db'
  | 'backend-auth'
  | 'backend-fetch'
  | 'backend-flask'
  | 'backend-device'
  | 'backend-blockly';

export interface BlockStyle {
  textColor?: string;
  customTextHex?: string;
  subtitleColorHex?: string;
  textGradient?: string;
  textShadow?: string;
  textStroke?: string;
  bgColor?: string;
  customBgHex?: string;
  bgGradient?: string;
  borderColor?: string;
  boxShadow?: string;
  templateId?: string;
  fontFamily?: 'sans' | 'serif' | 'mono' | 'display' | 'rounded';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  textAlign?: 'left' | 'center' | 'right';
  padding?: string;
  margin?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
  shadow?: string;
  customClass?: string;
  isHidden?: boolean;
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

export type BlockActionType =
  | 'change-text'
  | 'increment-counter'
  | 'toggle-visibility'
  | 'show-element'
  | 'hide-element'
  | 'set-style'
  | 'add-class'
  | 'remove-class'
  | 'toggle-disabled'
  | 'call-api'
  | 'alert'
  | 'show-confirm'
  | 'copy-clipboard'
  | 'console-log'
  | 'navigate-page'
  | 'go-back'
  | 'scroll-to-block'
  | 'open-url'
  | 'open-modal'
  | 'close-modal'
  | 'submit-form'
  | 'clear-form'
  | 'validate-input'
  | 'get-input-value'
  | 'set-input-value'
  | 'set-variable'
  | 'toggle-boolean'
  | 'list-add'
  | 'list-remove'
  | 'save-storage'
  | 'load-storage'
  | 'remove-storage'
  | 'db-save'
  | 'db-get'
  | 'db-delete'
  | 'auth-signup'
  | 'auth-login'
  | 'auth-logout'
  | 'device-vibrate'
  | 'device-gps'
  | 'device-camera';

export interface BlockLogicConfig {
  // Event Trigger Source (e.g., which button/input fires a Hat block)
  triggerSourceId?: string;
  // Conditionals & Comparisons
  leftOperand?: string;
  operator?: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains';
  rightOperand?: string;
  combinator?: 'NONE' | 'AND' | 'OR' | 'NOT';
  secondLeft?: string;
  secondOp?: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains';
  secondRight?: string;
  thenMessage?: string;
  elseMessage?: string;
  // Loops & Timers
  loopMode?: 'repeat' | 'foreach' | 'while';
  repeatCount?: number;
  intervalMs?: number;
  timerSeconds?: number;
  // Variables, Lists & Objects
  varName?: string;
  varValue?: string;
  varOp?: 'set' | 'change' | 'toggle';
  listName?: string;
  listOp?: 'create' | 'add' | 'remove' | 'get' | 'length';
  listIndex?: number;
  objectKey?: string;
  objectOp?: 'get-prop' | 'parse-json' | 'stringify';
  // Math & Text
  mathTextOp?:
    | 'add'
    | 'sub'
    | 'mul'
    | 'div'
    | 'random'
    | 'round'
    | 'join'
    | 'length'
    | 'contains'
    | 'upper'
    | 'lower'
    | 'format-date';
  argA?: string;
  argB?: string;
  // DOM & Feedback
  toastType?: 'success' | 'info' | 'warning' | 'error';
  styleProp?: string;
  styleValue?: string;
  cssClass?: string;
  validationRule?: 'not-empty' | 'email' | 'min-length';
  // Storage, Cloud DB, Auth & Device
  storageKey?: string;
  storageOp?: 'save' | 'load' | 'remove';
  collectionName?: string;
  dbOp?: 'save' | 'get' | 'update' | 'delete';
  authOp?: 'signup' | 'login' | 'logout' | 'current-user';
  deviceOp?: 'vibrate' | 'camera' | 'gps';
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
  action?: BlockActionType;
  actionPayload?: string;
  apiEndpoint?: string;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requestHeaders?: string;
  requestBody?: string;
  navLinks?: NavbarLinkItem[];
  // Custom metadata & interactive controls
  imageUrl?: string;
  videoUrl?: string;
  iconName?: string;
  badgeText?: string;
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  inputType?: 'text' | 'email' | 'password' | 'number' | 'date';
  controlVariant?: 'checkbox' | 'radio' | 'switch';
  options?: string[];
  gridColumns?: 2 | 3;
  triggerKey?: 'Enter' | 'Space' | 'Escape';
  isDisabled?: boolean;
  counterValue?: number;
  statValue?: string;
  statLabel?: string;
  authorRole?: string;
  authorAvatar?: string;
  isExpanded?: boolean;
  logicConfig?: BlockLogicConfig;
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
