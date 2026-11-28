import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  CheckSquare,
  ChevronRight,
  Clock,
  Cloud,
  Code2,
  Copy,
  Database,
  Eye,
  EyeOff,
  FileCheck2,
  GitBranch,
  Globe,
  Layers,
  Lock,
  MousePointerClick,
  Navigation,
  Play,
  Plus,
  Power,
  Send,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Trash2,
  Type,
  Variable,
  Zap,
} from 'lucide-react';
import {
  CanvasBlock,
  LogicActionStep,
  LogicConditionOperator,
  LogicFlowRule,
  LogicStepAction,
  LogicTriggerType,
  SiteCloudConfig,
  SitePage,
} from '../../types/builder';
import { StudioRuntimeState } from '../../utils/studioRuntime';

export interface TriggerMeta {
  id: LogicTriggerType;
  label: string;
  siLabel: string;
  shortLabel: string;
  hint: string;
}

export const LOGIC_TRIGGERS: TriggerMeta[] = [
  {
    id: 'when-click',
    label: 'Button / Element Clicked',
    siLabel: 'Button එකක් එබූ විට',
    shortLabel: 'Clicked',
    hint: 'Fires when a Button, IconButton, FAB, or ListTile is clicked.',
  },
  {
    id: 'when-submit',
    label: 'Form Submitted',
    siLabel: 'Form එක Submit කළ විට',
    shortLabel: 'Submitted',
    hint: 'Fires when a Form Validation widget or Submit button submits.',
  },
  {
    id: 'when-checked',
    label: 'Checkbox / Switch Checked (ON)',
    siLabel: 'Checkbox / Switch ON කළ විට',
    shortLabel: 'Checked (ON)',
    hint: 'Fires when a Checkbox, CheckboxTile, Switch, SwitchTile, or CheckboxGroup is checked.',
  },
  {
    id: 'when-unchecked',
    label: 'Checkbox / Switch Unchecked (OFF)',
    siLabel: 'Checkbox / Switch OFF කළ විට',
    shortLabel: 'Unchecked (OFF)',
    hint: 'Fires when a Checkbox or Switch is turned off.',
  },
  {
    id: 'when-change',
    label: 'Input / Form Value Changed',
    siLabel: 'අගය වෙනස් කළ විට',
    shortLabel: 'Value Changed',
    hint: 'Fires on TextField, DropDown, Slider, RatingBar, PinCode, ChoiceChips, Counter, etc.',
  },
  {
    id: 'when-load',
    label: 'Page Loads',
    siLabel: 'Page එක Load වූ විට',
    shortLabel: 'Page Loaded',
    hint: 'Runs automatically when the user enters this page.',
  },
  {
    id: 'when-key',
    label: 'Keyboard Key Pressed',
    siLabel: 'Key එකක් එබූ විට',
    shortLabel: 'Key Pressed',
    hint: 'Runs when Enter, Space, or Escape is pressed.',
  },
];

export type ActionBlockCategory = 'navigation' | 'forms-ui' | 'data-vars' | 'cloud-api' | 'flow';

export interface ActionBlockCatalogItem {
  action: LogicStepAction;
  label: string;
  siLabel: string;
  category: ActionBlockCategory;
  color: string;
  borderColor: string;
  description: string;
  needsPage?: boolean;
  needsWidget?: boolean;
  needsValue?: boolean;
  valueLabel?: string;
  valuePlaceholder?: string;
  needsVar?: boolean;
  needsApi?: boolean;
  needsCollection?: boolean;
  needsValidation?: boolean;
  needsDelay?: boolean;
}

export const ACTION_BLOCK_CATALOG: ActionBlockCatalogItem[] = [
  // Navigation (#2563EB)
  {
    action: 'next-page',
    label: 'Go to Next Page',
    siLabel: 'ඊළඟ පිටුවට යන්න',
    category: 'navigation',
    color: '#2563EB',
    borderColor: '#60A5FA',
    description: 'Advances automatically to the next page in your app.',
  },
  {
    action: 'prev-page',
    label: 'Go to Previous Page',
    siLabel: 'පෙර පිටුවට යන්න',
    category: 'navigation',
    color: '#2563EB',
    borderColor: '#60A5FA',
    description: 'Returns to the previous page in page order.',
  },
  {
    action: 'navigate-page',
    label: 'Go to Specific Page',
    siLabel: 'තෝරාගත් පිටුවට යන්න',
    category: 'navigation',
    color: '#2563EB',
    borderColor: '#60A5FA',
    description: 'Navigates to any chosen page.',
    needsPage: true,
  },
  {
    action: 'go-back',
    label: 'Go Back (History)',
    siLabel: 'ආපසු යන්න',
    category: 'navigation',
    color: '#2563EB',
    borderColor: '#60A5FA',
    description: 'Goes back to the last visited page.',
  },
  {
    action: 'open-url',
    label: 'Open External URL',
    siLabel: 'URL එකක් විවෘත කරන්න',
    category: 'navigation',
    color: '#2563EB',
    borderColor: '#60A5FA',
    description: 'Opens a link or scrolls to an #anchor.',
    needsValue: true,
    valueLabel: 'URL or #anchor',
    valuePlaceholder: 'https://example.com',
  },
  {
    action: 'scroll-to-block',
    label: 'Scroll to Widget',
    siLabel: 'Widget එක වෙත Scroll කරන්න',
    category: 'navigation',
    color: '#2563EB',
    borderColor: '#60A5FA',
    description: 'Smoothly scrolls viewport to a widget.',
    needsWidget: true,
  },

  // Forms & UI (#059669)
  {
    action: 'validate-form',
    label: 'Validate Form / Input',
    siLabel: 'Form / Input පරීක්ෂා කරන්න',
    category: 'forms-ui',
    color: '#059669',
    borderColor: '#34D399',
    description: 'Validates input; stops remaining steps if invalid.',
    needsWidget: true,
    needsValidation: true,
  },
  {
    action: 'submit-form',
    label: 'Submit & Collect Form Data',
    siLabel: 'Form දත්ත Submit කරන්න',
    category: 'forms-ui',
    color: '#059669',
    borderColor: '#34D399',
    description: 'Collects all filled form widgets and records submission.',
    needsValue: true,
    valueLabel: 'Success message',
    valuePlaceholder: 'Form submitted successfully!',
  },
  {
    action: 'clear-form',
    label: 'Clear Form Inputs',
    siLabel: 'Form Inputs හිස් කරන්න',
    category: 'forms-ui',
    color: '#059669',
    borderColor: '#34D399',
    description: 'Resets all input fields on the page.',
  },
  {
    action: 'show-toast',
    label: 'Show Alert / Toast',
    siLabel: 'පණිවිඩයක් පෙන්වන්න',
    category: 'forms-ui',
    color: '#059669',
    borderColor: '#34D399',
    description: 'Displays a toast notification to the user.',
    needsValue: true,
    valueLabel: 'Message (supports {{value}})',
    valuePlaceholder: 'Action completed!',
  },
  {
    action: 'show-element',
    label: 'Show Widget',
    siLabel: 'Widget එක පෙන්වන්න',
    category: 'forms-ui',
    color: '#059669',
    borderColor: '#34D399',
    description: 'Makes a hidden widget visible.',
    needsWidget: true,
  },
  {
    action: 'hide-element',
    label: 'Hide Widget',
    siLabel: 'Widget එක සඟවන්න',
    category: 'forms-ui',
    color: '#059669',
    borderColor: '#34D399',
    description: 'Hides a widget from the page.',
    needsWidget: true,
  },
  {
    action: 'toggle-visibility',
    label: 'Toggle Widget Visibility',
    siLabel: 'පෙනුම මාරු කරන්න',
    category: 'forms-ui',
    color: '#059669',
    borderColor: '#34D399',
    description: 'Switches widget visibility or accordion/toggle state.',
    needsWidget: true,
  },
  {
    action: 'enable-element',
    label: 'Enable Widget',
    siLabel: 'Widget සක්‍රීය කරන්න',
    category: 'forms-ui',
    color: '#059669',
    borderColor: '#34D399',
    description: 'Enables a disabled button or input.',
    needsWidget: true,
  },
  {
    action: 'disable-element',
    label: 'Disable Widget',
    siLabel: 'Widget අක්‍රීය කරන්න',
    category: 'forms-ui',
    color: '#059669',
    borderColor: '#34D399',
    description: 'Disables a button or input widget.',
    needsWidget: true,
  },
  {
    action: 'change-text',
    label: 'Change Widget Text',
    siLabel: 'Widget Text වෙනස් කරන්න',
    category: 'forms-ui',
    color: '#059669',
    borderColor: '#34D399',
    description: 'Updates a widget text dynamically (use {{value}} for live value).',
    needsWidget: true,
    needsValue: true,
    valueLabel: 'New text',
    valuePlaceholder: 'Updated: {{value}}',
  },
  {
    action: 'set-input-value',
    label: 'Set Input Field Value',
    siLabel: 'Input අගය සකසන්න',
    category: 'forms-ui',
    color: '#059669',
    borderColor: '#34D399',
    description: 'Writes a value into a TextField or DropDown.',
    needsWidget: true,
    needsValue: true,
    valueLabel: 'Value to set',
    valuePlaceholder: 'Default text...',
  },
  {
    action: 'open-modal',
    label: 'Open Modal / Dialog',
    siLabel: 'Modal විවෘත කරන්න',
    category: 'forms-ui',
    color: '#059669',
    borderColor: '#34D399',
    description: 'Opens a Modal / Drawer widget.',
    needsWidget: true,
  },
  {
    action: 'close-modal',
    label: 'Close Modal / Dialog',
    siLabel: 'Modal වසන්න',
    category: 'forms-ui',
    color: '#059669',
    borderColor: '#34D399',
    description: 'Closes an open Modal / Drawer widget.',
    needsWidget: true,
  },

  // Data & Variables (#D97706)
  {
    action: 'set-variable',
    label: 'Set App Variable',
    siLabel: 'Variable අගය සකසන්න',
    category: 'data-vars',
    color: '#D97706',
    borderColor: '#FBBF24',
    description: 'Stores a value into an in-memory App Variable (use {{value}}).',
    needsVar: true,
    needsValue: true,
    valueLabel: 'Value',
    valuePlaceholder: '{{value}}',
  },
  {
    action: 'increment-counter',
    label: 'Increment Counter (+1)',
    siLabel: 'Counter අගය වැඩි කරන්න',
    category: 'data-vars',
    color: '#D97706',
    borderColor: '#FBBF24',
    description: 'Adds +1 to a Counter widget or score variable.',
    needsWidget: true,
  },
  {
    action: 'save-storage',
    label: 'Save to LocalStorage',
    siLabel: 'Browser Storage හි සුරකින්න',
    category: 'data-vars',
    color: '#D97706',
    borderColor: '#FBBF24',
    description: 'Persists key/value locally in browser storage.',
    needsVar: true,
    needsValue: true,
    valueLabel: 'Stored value',
    valuePlaceholder: '{{value}}',
  },

  // Cloud & API (#0891B2)
  {
    action: 'db-save',
    label: 'Save to Cloud DB (Firebase/Supabase)',
    siLabel: 'Database වෙත සුරකින්න',
    category: 'cloud-api',
    color: '#0891B2',
    borderColor: '#22D3EE',
    description: 'Saves current form & input values to collection/table.',
    needsCollection: true,
  },
  {
    action: 'call-api',
    label: 'Call REST API',
    siLabel: 'REST API ඇමතුමක් ගන්න',
    category: 'cloud-api',
    color: '#0891B2',
    borderColor: '#22D3EE',
    description: 'Sends an HTTP request (GET/POST/PUT/DELETE).',
    needsApi: true,
  },
  {
    action: 'auth-signup',
    label: 'Auth: Sign Up User',
    siLabel: 'පරිශීලක ලියාපදිංචි කරන්න',
    category: 'cloud-api',
    color: '#0891B2',
    borderColor: '#22D3EE',
    description: 'Registers user with email from form or fallback.',
    needsValue: true,
    valueLabel: 'Default email (optional)',
    valuePlaceholder: 'user@example.com',
  },
  {
    action: 'auth-login',
    label: 'Auth: Sign In User',
    siLabel: 'පරිශීලක ඇතුල් වීම (Login)',
    category: 'cloud-api',
    color: '#0891B2',
    borderColor: '#22D3EE',
    description: 'Logs user in and updates authUser session.',
    needsValue: true,
    valueLabel: 'Default email (optional)',
    valuePlaceholder: 'user@example.com',
  },
  {
    action: 'auth-logout',
    label: 'Auth: Sign Out',
    siLabel: 'ඉවත් වන්න (Logout)',
    category: 'cloud-api',
    color: '#0891B2',
    borderColor: '#22D3EE',
    description: 'Clears active user session.',
  },

  // Flow Control (#7C3AED)
  {
    action: 'delay',
    label: 'Wait / Delay (ms)',
    siLabel: 'මොහොතක් රැඳී සිටින්න',
    category: 'flow',
    color: '#7C3AED',
    borderColor: '#A78BFA',
    description: 'Waits specified milliseconds before running next block.',
    needsDelay: true,
  },
];

export interface LogicRecipe {
  id: string;
  name: string;
  siName: string;
  summary: string;
  trigger: LogicTriggerType;
  preferredTypes: CanvasBlock['type'][];
  steps: Omit<LogicActionStep, 'id'>[];
}

export const LOGIC_FLOW_RECIPES: LogicRecipe[] = [
  {
    id: 'btn-next-page',
    name: 'Button Click → Next Page',
    siName: 'Button Click → ඊළඟ පිටුවට',
    summary: 'When button clicked, go to next page',
    trigger: 'when-click',
    preferredTypes: ['ui-button', 'ui-fab', 'ui-icon-button'],
    steps: [{ action: 'next-page' }],
  },
  {
    id: 'form-validate-save',
    name: 'Form Submit → Validate & Save DB',
    siName: 'Form Submit → පරීක්ෂා කර Save කරන්න',
    summary: 'Validate inputs, submit form & save to Database',
    trigger: 'when-submit',
    preferredTypes: ['ui-form', 'ui-button'],
    steps: [
      { action: 'submit-form', value: 'Form saved to backend!' },
      { action: 'db-save', collectionName: 'submissions' },
      { action: 'next-page' },
    ],
  },
  {
    id: 'checkbox-show-widget',
    name: 'Checkbox Checked → Show Element',
    siName: 'Checkbox Tick කළාම → Element පෙන්වන්න',
    summary: 'Show hidden details or enable submit when checked',
    trigger: 'when-checked',
    preferredTypes: ['ui-checkbox', 'ui-checkbox-tile', 'ui-checkbox-group'],
    steps: [
      { action: 'show-toast', value: 'Checkbox enabled!' },
      { action: 'show-element' },
    ],
  },
  {
    id: 'switch-save-setting',
    name: 'Switch Toggled → Save Setting',
    siName: 'Switch ON කළාම → Setting සුරකින්න',
    summary: 'Persist switch/toggle value in App Variables & Storage',
    trigger: 'when-change',
    preferredTypes: ['ui-switch-tile', 'ui-checkbox'],
    steps: [
      { action: 'set-variable', varName: 'featureEnabled', value: '{{value}}' },
      { action: 'save-storage', varName: 'app_setting', value: '{{value}}' },
    ],
  },
  {
    id: 'input-live-update',
    name: 'TextField / Slider → Update Text',
    siName: 'TextField / Slider → Text වෙනස් කරන්න',
    summary: 'Bind live input, slider, rating, or chips directly to UI text',
    trigger: 'when-change',
    preferredTypes: ['ui-input', 'ui-slider', 'ui-rating-bar', 'ui-select', 'ui-choice-chips', 'ui-counter-button'],
    steps: [
      { action: 'set-variable', varName: 'fieldValue', value: '{{value}}' },
      { action: 'change-text', value: '{{value}}' },
    ],
  },
];

export const INTERACTIVE_WIDGET_TYPES = new Set<CanvasBlock['type']>([
  'ui-button',
  'ui-icon-button',
  'ui-fab',
  'ui-list-tile',
  'ui-form',
  'ui-input',
  'ui-textarea',
  'ui-select',
  'ui-checkbox',
  'ui-checkbox-tile',
  'ui-switch-tile',
  'ui-pin-code',
  'ui-slider',
  'ui-rating-bar',
  'ui-credit-card',
  'ui-counter-button',
  'ui-choice-chips',
  'ui-place-picker',
  'ui-checkbox-group',
  'ui-signature',
  'ui-file-upload',
  'ui-toggle-icon',
]);

export function getFriendlyWidgetTypeLabel(b: CanvasBlock): string {
  if (b.type === 'ui-checkbox') {
    if (b.controlVariant === 'switch') return 'Switch';
    if (b.controlVariant === 'radio') return 'RadioButton';
    return 'Checkbox';
  }
  const map: Partial<Record<CanvasBlock['type'], string>> = {
    'ui-button': 'Button',
    'ui-icon-button': 'IconButton',
    'ui-fab': 'FAB',
    'ui-list-tile': 'ListTile',
    'ui-form': 'Form Validation',
    'ui-input': 'TextField',
    'ui-textarea': 'TextArea',
    'ui-select': 'DropDown',
    'ui-checkbox-tile': 'CheckboxListTile',
    'ui-switch-tile': 'SwitchListTile',
    'ui-pin-code': 'PinCode',
    'ui-slider': 'Slider',
    'ui-rating-bar': 'RatingBar',
    'ui-credit-card': 'CreditCardForm',
    'ui-counter-button': 'CounterButton',
    'ui-choice-chips': 'ChoiceChips',
    'ui-place-picker': 'PlacePicker',
    'ui-checkbox-group': 'CheckboxGroup',
    'ui-signature': 'Signature',
    'ui-file-upload': 'FileUpload',
    'ui-toggle-icon': 'ToggleIcon',
    'ui-heading': 'Heading',
    'ui-paragraph': 'Text',
    'ui-card': 'Card',
    'ui-modal': 'Modal',
    'ui-image': 'Image',
  };
  return map[b.type] || b.type.replace(/^ui-/, '');
}

export function getTriggerCandidates(trigger: LogicTriggerType, blocks: CanvasBlock[]): CanvasBlock[] {
  const byOrder = (preferred: CanvasBlock['type'][]) => {
    const prefSet = new Set(preferred);
    const matching = blocks.filter((b) => prefSet.has(b.type));
    const rest = blocks.filter((b) => !prefSet.has(b.type) && !b.type.startsWith('logic-'));
    return [...matching, ...rest];
  };

  if (trigger === 'when-click') {
    return byOrder(['ui-button', 'ui-icon-button', 'ui-fab', 'ui-list-tile', 'ui-toggle-icon']);
  }
  if (trigger === 'when-submit') {
    return byOrder(['ui-form', 'ui-button', 'ui-input']);
  }
  if (trigger === 'when-checked' || trigger === 'when-unchecked') {
    return byOrder(['ui-checkbox', 'ui-checkbox-tile', 'ui-switch-tile', 'ui-checkbox-group']);
  }
  if (trigger === 'when-change') {
    return byOrder([
      'ui-input',
      'ui-textarea',
      'ui-select',
      'ui-checkbox',
      'ui-checkbox-tile',
      'ui-switch-tile',
      'ui-pin-code',
      'ui-slider',
      'ui-rating-bar',
      'ui-credit-card',
      'ui-counter-button',
      'ui-choice-chips',
      'ui-place-picker',
      'ui-checkbox-group',
      'ui-signature',
      'ui-file-upload',
    ]);
  }
  return blocks.filter((b) => !b.type.startsWith('logic-'));
}

export function createStepFromCatalog(action: LogicStepAction, pages: SitePage[], activePageId: string, cloudConfig?: SiteCloudConfig): LogicActionStep {
  const idx = pages.findIndex((p) => p.id === activePageId);
  const nextPage = idx >= 0 && pages.length > 1 ? pages[(idx + 1) % pages.length] : pages[0];
  const defaultCollection =
    cloudConfig?.firebase?.enabled
      ? cloudConfig.firebase.defaultCollection || 'submissions'
      : cloudConfig?.supabase?.enabled
      ? cloudConfig.supabase.defaultTable || 'leads'
      : 'submissions';

  return {
    id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    action,
    targetPageId: action === 'navigate-page' ? nextPage?.id : undefined,
    value:
      action === 'show-toast'
        ? 'Action executed!'
        : action === 'submit-form'
        ? 'Form submitted successfully!'
        : action === 'change-text'
        ? '{{value}}'
        : undefined,
    varName:
      action === 'set-variable'
        ? 'score'
        : action === 'save-storage'
        ? 'sl_saved_data'
        : undefined,
    collectionName: action === 'db-save' ? defaultCollection : undefined,
    apiUrl: action === 'call-api' ? '/api/v1/submit' : undefined,
    httpMethod: action === 'call-api' ? 'POST' : undefined,
    validationRule: action === 'validate-form' ? 'not-empty' : undefined,
    delayMs: action === 'delay' ? 800 : undefined,
  };
}

interface SidebarProps {
  lang: 'en' | 'si';
  blocks: CanvasBlock[];
  pages: SitePage[];
  activePageId: string;
  flows: LogicFlowRule[];
  selectedFlowId: string | null;
  cloudConfig?: SiteCloudConfig;
  onSelectFlow: (flowId: string) => void;
  onCreateFlow: (preset?: LogicRecipe) => void;
  onToggleFlowEnabled: (flowId: string) => void;
  onDeleteFlow: (flowId: string) => void;
  onAppendActionStep: (action: LogicStepAction) => void;
  onRunFlowTest: (flow: LogicFlowRule) => void;
  onOpenLogicWorkspace: () => void;
}

export const BackendLogicSidebar: React.FC<SidebarProps> = ({
  lang,
  flows,
  selectedFlowId,
  onSelectFlow,
  onCreateFlow,
  onToggleFlowEnabled,
  onDeleteFlow,
  onAppendActionStep,
  onRunFlowTest,
  onOpenLogicWorkspace,
}) => {
  const [activeCat, setActiveCat] = useState<ActionBlockCategory | 'all'>('all');

  const filteredCatalog = useMemo(
    () =>
      activeCat === 'all'
        ? ACTION_BLOCK_CATALOG
        : ACTION_BLOCK_CATALOG.filter((item) => item.category === activeCat),
    [activeCat]
  );

  return (
    <div className="space-y-3.5 pb-6 select-none">
      {/* Header Banner */}
      <div className="rounded-xl bg-[#11151E] border border-amber-500/30 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-white truncate">
                {lang === 'si' ? 'Backend Logic Blocks' : 'Backend Logic Studio'}
              </h3>
              <p className="text-[10px] text-slate-400 truncate">
                {lang === 'si'
                  ? 'Canvas එකේ නොපෙනෙන Logic'
                  : 'Non-visual · Hidden from Canvas'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenLogicWorkspace}
            title="Open Logic Blocks Workspace"
            className="px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold cursor-pointer shrink-0 whitespace-nowrap"
          >
            {lang === 'si' ? 'විවෘත කරන්න' : 'Open Editor'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => onCreateFlow()}
          className="w-full py-2 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{lang === 'si' ? 'නව Logic Flow එකක් හදන්න' : 'New Logic Flow'}</span>
        </button>
      </div>

      {/* 1-Click Starter Recipes */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {lang === 'si' ? 'ක්ෂණික Recipes' : '1-Click Recipes'}
          </span>
        </div>
        <div className="space-y-1.5">
          {LOGIC_FLOW_RECIPES.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => {
                onCreateFlow(recipe);
                onOpenLogicWorkspace();
              }}
              className="w-full text-left p-2.5 rounded-lg bg-[#1e2127] hover:bg-[#262a33] border border-white/[0.08] hover:border-amber-400/40 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-white group-hover:text-amber-300 truncate">
                  {lang === 'si' ? recipe.siName : recipe.name}
                </span>
                <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 shrink-0" />
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{recipe.summary}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Saved Flows List */}
      <div className="space-y-1.5 pt-1 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {lang === 'si' ? 'Page Flows' : `Active Flows (${flows.length})`}
          </span>
        </div>

        {flows.length === 0 ? (
          <div className="p-3 rounded-lg bg-[#11151E] border border-dashed border-white/10 text-center space-y-1">
            <p className="text-[11px] text-slate-400">
              {lang === 'si'
                ? 'තවම Backend Flows නැත.'
                : 'No backend flows on this page yet.'}
            </p>
            <p className="text-[10px] text-slate-500">
              {lang === 'si'
                ? 'ඉහත Recipe එකක් හෝ + New Logic Flow ඔබන්න.'
                : 'Pick a 1-click recipe above or click + New Logic Flow.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {flows.map((flow) => {
              const isSelected = flow.id === selectedFlowId;
              const trigMeta = LOGIC_TRIGGERS.find((t) => t.id === flow.trigger);
              return (
                <div
                  key={flow.id}
                  onClick={() => {
                    onSelectFlow(flow.id);
                    onOpenLogicWorkspace();
                  }}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400/50'
                      : 'bg-[#1e2127] border-white/[0.07] hover:border-white/20'
                  } ${!flow.enabled ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[11px] font-semibold text-white truncate flex-1">
                      {flow.name}
                    </span>
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onRunFlowTest(flow)}
                        title="Test Flow Now"
                        className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 cursor-pointer"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleFlowEnabled(flow.id)}
                        title={flow.enabled ? 'Disable Flow' : 'Enable Flow'}
                        className={`p-1 rounded cursor-pointer ${
                          flow.enabled
                            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/35'
                            : 'bg-white/5 text-slate-500 hover:text-white'
                        }`}
                      >
                        <Power className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteFlow(flow.id)}
                        title="Delete Flow"
                        className="p-1 rounded bg-white/5 hover:bg-rose-600/80 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 truncate">
                    <span className="text-amber-300 font-medium">
                      {trigMeta?.shortLabel || flow.trigger}
                    </span>
                    <span>→</span>
                    <span>
                      {flow.steps.length} {flow.steps.length === 1 ? 'action' : 'actions'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scratch Action Block Palette */}
      <div className="space-y-2 pt-2 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {lang === 'si' ? 'Action බ්ලොක්ස් (+ එක් කරන්න)' : 'Snap Action Blocks'}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'navigation', label: 'Nav' },
              { id: 'forms-ui', label: 'Forms & UI' },
              { id: 'data-vars', label: 'Data' },
              { id: 'cloud-api', label: 'Cloud' },
              { id: 'flow', label: 'Wait' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCat(cat.id)}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                activeCat === cat.id
                  ? 'bg-white/15 text-white'
                  : 'bg-[#11151E] text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          {filteredCatalog.map((item) => (
            <button
              key={item.action}
              type="button"
              onClick={() => {
                onAppendActionStep(item.action);
                onOpenLogicWorkspace();
              }}
              style={{
                backgroundColor: item.color,
                borderColor: item.borderColor,
              }}
              title={item.description}
              className="w-full text-left px-3 py-2 rounded-lg border shadow-xs hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-white truncate">
                  {lang === 'si' ? item.siLabel : item.label}
                </span>
                <Plus className="w-3.5 h-3.5 text-white/90 shrink-0" />
              </div>
              <p className="text-[10px] text-white/80 truncate mt-0.5">{item.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface WorkspaceProps {
  lang: 'en' | 'si';
  pages: SitePage[];
  activePage: SitePage | undefined;
  blocks: CanvasBlock[];
  flows: LogicFlowRule[];
  selectedFlowId: string | null;
  runtimeState: StudioRuntimeState;
  cloudConfig?: SiteCloudConfig;
  onSelectFlow: (flowId: string) => void;
  onCreateFlow: (preset?: LogicRecipe) => void;
  onUpdateFlow: (flow: LogicFlowRule) => void;
  onDeleteFlow: (flowId: string) => void;
  onDuplicateFlow: (flow: LogicFlowRule) => void;
  onRunFlowTest: (flow: LogicFlowRule) => void;
  onBackToVisual: () => void;
  onOpenCodeView: () => void;
}

export const BackendLogicWorkspace: React.FC<WorkspaceProps> = ({
  lang,
  pages,
  activePage,
  blocks,
  flows,
  selectedFlowId,
  runtimeState,
  cloudConfig,
  onSelectFlow,
  onCreateFlow,
  onUpdateFlow,
  onDeleteFlow,
  onDuplicateFlow,
  onRunFlowTest,
  onBackToVisual,
  onOpenCodeView,
}) => {
  const [showAddStepDrawer, setShowAddStepDrawer] = useState(false);

  const activeFlow = flows.find((f) => f.id === selectedFlowId) || flows[0] || null;

  const uiWidgets = useMemo(
    () => blocks.filter((b) => !b.type.startsWith('logic-')),
    [blocks]
  );

  const triggerWidgets = useMemo(
    () => (activeFlow ? getTriggerCandidates(activeFlow.trigger, blocks) : uiWidgets),
    [activeFlow, blocks, uiWidgets]
  );

  const handleAddStep = (action: LogicStepAction) => {
    if (!activeFlow) return;
    const step = createStepFromCatalog(action, pages, activePage?.id || '', cloudConfig);
    onUpdateFlow({
      ...activeFlow,
      steps: [...activeFlow.steps, step],
    });
    setShowAddStepDrawer(false);
  };

  const handleUpdateStep = (stepId: string, patch: Partial<LogicActionStep>) => {
    if (!activeFlow) return;
    onUpdateFlow({
      ...activeFlow,
      steps: activeFlow.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
    });
  };

  const handleMoveStep = (stepId: string, dir: -1 | 1) => {
    if (!activeFlow) return;
    const idx = activeFlow.steps.findIndex((s) => s.id === stepId);
    const nextIdx = idx + dir;
    if (idx < 0 || nextIdx < 0 || nextIdx >= activeFlow.steps.length) return;
    const copy = [...activeFlow.steps];
    const [moved] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, moved);
    onUpdateFlow({ ...activeFlow, steps: copy });
  };

  const handleRemoveStep = (stepId: string) => {
    if (!activeFlow) return;
    onUpdateFlow({
      ...activeFlow,
      steps: activeFlow.steps.filter((s) => s.id !== stepId),
    });
  };

  const activeTargetWidget = useMemo(() => {
    if (!activeFlow || activeFlow.targetBlockId === 'any') return null;
    return blocks.find((b) => b.id === activeFlow.targetBlockId) || null;
  }, [activeFlow, blocks]);

  const activeTriggerMeta = LOGIC_TRIGGERS.find((t) => t.id === activeFlow?.trigger);

  const conditionOperators: Array<{ id: LogicConditionOperator; label: string }> = [
    { id: '==', label: 'equals (==)' },
    { id: '!=', label: 'not equal (!=)' },
    { id: 'not-empty', label: 'is not empty' },
    { id: 'is-empty', label: 'is empty' },
    { id: 'is-checked', label: 'is checked (ON)' },
    { id: 'contains', label: 'contains text' },
    { id: '>', label: 'greater than (>)' },
    { id: '<', label: 'less than (<)' },
    { id: '>=', label: '>=' },
    { id: '<=', label: '<=' },
  ];

  const getStepIcon = (action: LogicStepAction) => {
    if (action === 'next-page' || action === 'prev-page' || action === 'navigate-page' || action === 'go-back') {
      return <Navigation className="w-3.5 h-3.5 text-white shrink-0" />;
    }
    if (action === 'open-url' || action === 'scroll-to-block') {
      return <Globe className="w-3.5 h-3.5 text-white shrink-0" />;
    }
    if (action === 'validate-form' || action === 'submit-form' || action === 'clear-form') {
      return <FileCheck2 className="w-3.5 h-3.5 text-white shrink-0" />;
    }
    if (action === 'show-element' || action === 'hide-element' || action === 'toggle-visibility') {
      return action === 'hide-element' ? (
        <EyeOff className="w-3.5 h-3.5 text-white shrink-0" />
      ) : (
        <Eye className="w-3.5 h-3.5 text-white shrink-0" />
      );
    }
    if (action === 'change-text' || action === 'set-input-value') {
      return <Type className="w-3.5 h-3.5 text-white shrink-0" />;
    }
    if (action === 'db-save') {
      return <Database className="w-3.5 h-3.5 text-white shrink-0" />;
    }
    if (action === 'call-api' || action.startsWith('auth-')) {
      return <Cloud className="w-3.5 h-3.5 text-white shrink-0" />;
    }
    if (action === 'delay') {
      return <Clock className="w-3.5 h-3.5 text-white shrink-0" />;
    }
    if (action === 'set-variable' || action === 'increment-counter' || action === 'save-storage') {
      return <Variable className="w-3.5 h-3.5 text-white shrink-0" />;
    }
    return <Zap className="w-3.5 h-3.5 text-white shrink-0" />;
  };

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden bg-[#0A0D13]"
      style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1.1px, transparent 1.1px)',
        backgroundSize: '22px 22px',
      }}
    >
      {/* Top Flow Selector Strip */}
      <div className="px-4 py-2.5 bg-[#0F131C]/95 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 shrink-0 pr-1">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{activePage?.name || 'Home'} Backend</span>
          </div>
          {flows.map((f) => {
            const active = f.id === activeFlow?.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectFlow(f.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors flex items-center gap-1.5 ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-[#161B26] text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span className="truncate max-w-[160px]">{f.name}</span>
                {!f.enabled && <span className="text-[9px] opacity-70">(OFF)</span>}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onCreateFlow()}
            className="px-2.5 py-1 rounded-md bg-white/8 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Flow</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onBackToVisual}
            className="px-2.5 py-1 rounded-md bg-[#161B26] hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 cursor-pointer whitespace-nowrap"
          >
            Visual Blocks
          </button>
          <button
            type="button"
            onClick={onOpenCodeView}
            className="px-2.5 py-1 rounded-md bg-[#161B26] hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>
        </div>
      </div>

      {/* Main Scratch-Style Block Workspace */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-2xl mx-auto space-y-5">
          {!activeFlow ? (
            <div className="rounded-2xl bg-[#121620] border border-white/10 p-6 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center">
                <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h2 className="text-base font-bold text-white">
                  {lang === 'si'
                    ? 'Backend Logic Blocks (Canvas එකේ නොපෙනේ)'
                    : 'Non-Visual Backend Logic Blocks'}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'si'
                    ? 'Button එකක් එබූ විට, Form එකක් Submit කළ විට, Checkbox/Switch එකක් fill කළ විට සිදුවිය යුතු දේ Scratch blocks මගින් සකසන්න. මේවා Page Preview එකේ පෙන්නන්නේ නැත.'
                    : 'Build invisible Scratch-style workflows for Buttons, Forms, Checkboxes, Switches, Sliders, and all Form Elements. These rules run behind the scenes and stay hidden from your page canvas.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
                {LOGIC_FLOW_RECIPES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onCreateFlow(r)}
                    className="p-3 rounded-xl bg-[#171C28] hover:bg-[#1E2434] border border-white/10 hover:border-amber-400/50 transition-colors cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-300">
                        {lang === 'si' ? r.siName : r.name}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-400">{r.summary}</p>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onCreateFlow()}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'si' ? 'හිස් Logic Flow එකක් අරඹන්න' : 'Start Blank Logic Flow'}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Active Flow Header Bar */}
              <div className="rounded-xl bg-[#121620] border border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                  <span className="text-[11px] font-medium text-slate-400 shrink-0">Flow Name:</span>
                  <input
                    type="text"
                    value={activeFlow.name}
                    onChange={(e) => onUpdateFlow({ ...activeFlow, name: e.target.value })}
                    className="flex-1 min-w-[140px] px-2.5 py-1 rounded-md bg-[#090B10] border border-white/15 focus:border-amber-400 text-xs font-bold text-white outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onRunFlowTest(activeFlow)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{lang === 'si' ? 'Test කරන්න' : 'Test Flow'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateFlow({ ...activeFlow, enabled: !activeFlow.enabled })
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer whitespace-nowrap ${
                      activeFlow.enabled
                        ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    {activeFlow.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateFlow(activeFlow)}
                    title="Duplicate Flow"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteFlow(activeFlow.id)}
                    title="Delete Flow"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-600/80 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* SCRATCH PUZZLE BLOCK STACK */}
              <div className="space-y-0">
                {/* 1. AMBER HAT TRIGGER BLOCK */}
                <div className="relative bg-gradient-to-b from-[#F59E0B] to-[#D97706] border-2 border-[#FCD34D] rounded-tl-[28px] rounded-tr-xl rounded-b-lg p-4 shadow-lg">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <MousePointerClick className="w-4 h-4 text-slate-950 shrink-0" />
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-950">
                        WHEN EVENT TRIGGER
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-950/80">
                      Hidden from Canvas
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-950">
                    <span className="px-2 py-1 rounded bg-black/15 text-slate-950">WHEN</span>

                    <select
                      value={activeFlow.trigger}
                      onChange={(e) => {
                        const nextTrig = e.target.value as LogicTriggerType;
                        const candidates = getTriggerCandidates(nextTrig, blocks);
                        const keepSame =
                          activeFlow.targetBlockId === 'any' ||
                          candidates.some((c) => c.id === activeFlow.targetBlockId);
                        onUpdateFlow({
                          ...activeFlow,
                          trigger: nextTrig,
                          targetBlockId: keepSame
                            ? activeFlow.targetBlockId
                            : candidates[0]?.id || 'any',
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0B0F17] text-amber-200 border border-black/30 text-xs font-semibold outline-none cursor-pointer"
                    >
                      {LOGIC_TRIGGERS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {lang === 'si' ? t.siLabel : t.label}
                        </option>
                      ))}
                    </select>

                    {activeFlow.trigger === 'when-key' ? (
                      <select
                        value={activeFlow.triggerKey || 'Enter'}
                        onChange={(e) =>
                          onUpdateFlow({
                            ...activeFlow,
                            triggerKey: e.target.value as 'Enter' | 'Space' | 'Escape',
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-[#0B0F17] text-amber-200 border border-black/30 text-xs font-semibold outline-none cursor-pointer"
                      >
                        <option value="Enter">Key: Enter</option>
                        <option value="Space">Key: Space</option>
                        <option value="Escape">Key: Escape</option>
                      </select>
                    ) : activeFlow.trigger !== 'when-load' ? (
                      <>
                        <span className="px-1.5 py-1 rounded bg-black/15 text-slate-950">ON</span>
                        <select
                          value={activeFlow.targetBlockId}
                          onChange={(e) =>
                            onUpdateFlow({ ...activeFlow, targetBlockId: e.target.value })
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-[#0B0F17] text-white border border-black/30 text-xs font-semibold outline-none cursor-pointer max-w-[260px]"
                        >
                          <option value="any">Any Matching Widget on Page</option>
                          {triggerWidgets.map((w) => (
                            <option key={w.id} value={w.id}>
                              [{getFriendlyWidgetTypeLabel(w)}] {(w.content || w.name).slice(0, 32)}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : null}
                  </div>

                  {activeTriggerMeta && (
                    <p className="text-[11px] font-medium text-slate-950/85 mt-2">
                      {activeTriggerMeta.hint}
                    </p>
                  )}

                  {activeFlow.trigger !== 'when-load' &&
                    activeFlow.trigger !== 'when-key' &&
                    uiWidgets.length === 0 && (
                      <p className="mt-2 text-[11px] font-semibold text-slate-950 bg-white/25 rounded-md px-2.5 py-1.5">
                        Add a Button, Form, Checkbox, Switch, or TextField to your page to target a specific widget.
                      </p>
                    )}

                  {/* Puzzle Bottom Tab Connector */}
                  <div className="absolute left-7 -bottom-2 w-8 h-2.5 rounded-b-md bg-[#D97706] border-x-2 border-b-2 border-[#FCD34D] z-10" />
                </div>

                {/* 2. OPTIONAL PURPLE IF CONDITION BLOCK */}
                <div className="pt-2 pl-4 pr-1">
                  {!activeFlow.condition?.enabled ? (
                    <div className="flex items-center gap-2 py-1.5">
                      <div className="w-0.5 h-5 bg-white/20 ml-3" />
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateFlow({
                            ...activeFlow,
                            condition: {
                              enabled: true,
                              sourceType: uiWidgets.length > 0 ? 'widget' : 'variable',
                              leftId:
                                activeTargetWidget?.id || uiWidgets[0]?.id || 'score',
                              operator: 'not-empty',
                              rightValue: '',
                            },
                          })
                        }
                        className="px-2.5 py-1 rounded-md bg-violet-600/20 hover:bg-violet-600/35 border border-violet-400/35 text-violet-300 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <GitBranch className="w-3 h-3" />
                        <span>+ Add IF Condition (Optional)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="relative bg-gradient-to-b from-[#7C3AED] to-[#6D28D9] border-2 border-[#C4B5FD] rounded-xl p-3 shadow-md mt-0.5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5 text-white" />
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-white">
                            IF CONDITION MATCHES
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateFlow({
                              ...activeFlow,
                              condition: { ...activeFlow.condition!, enabled: false },
                            })
                          }
                          className="text-[10px] text-white/80 hover:text-white underline cursor-pointer"
                        >
                          Remove IF
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <select
                          value={activeFlow.condition.sourceType}
                          onChange={(e) => {
                            const st = e.target.value as 'widget' | 'variable';
                            onUpdateFlow({
                              ...activeFlow,
                              condition: {
                                ...activeFlow.condition!,
                                sourceType: st,
                                leftId:
                                  st === 'widget'
                                    ? uiWidgets[0]?.id || ''
                                    : 'score',
                              },
                            });
                          }}
                          className="px-2 py-1 rounded bg-[#0B0F17] text-violet-200 border border-white/20 text-[11px] font-semibold outline-none cursor-pointer"
                        >
                          <option value="widget">Widget Value</option>
                          <option value="variable">App Variable</option>
                        </select>

                        {activeFlow.condition.sourceType === 'widget' ? (
                          <select
                            value={activeFlow.condition.leftId}
                            onChange={(e) =>
                              onUpdateFlow({
                                ...activeFlow,
                                condition: {
                                  ...activeFlow.condition!,
                                  leftId: e.target.value,
                                },
                              })
                            }
                            className="px-2 py-1 rounded bg-[#0B0F17] text-white border border-white/20 text-[11px] font-semibold outline-none cursor-pointer max-w-[190px]"
                          >
                            {uiWidgets.map((w) => (
                              <option key={w.id} value={w.id}>
                                [{getFriendlyWidgetTypeLabel(w)}] {(w.content || w.name).slice(0, 24)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={activeFlow.condition.leftId}
                            onChange={(e) =>
                              onUpdateFlow({
                                ...activeFlow,
                                condition: {
                                  ...activeFlow.condition!,
                                  leftId: e.target.value,
                                },
                              })
                            }
                            placeholder="variable name (e.g. score)"
                            className="w-28 px-2 py-1 rounded bg-[#0B0F17] text-white border border-white/20 text-[11px] font-mono outline-none"
                          />
                        )}

                        <select
                          value={activeFlow.condition.operator}
                          onChange={(e) =>
                            onUpdateFlow({
                              ...activeFlow,
                              condition: {
                                ...activeFlow.condition!,
                                operator: e.target.value as LogicConditionOperator,
                              },
                            })
                          }
                          className="px-2 py-1 rounded bg-[#0B0F17] text-amber-200 border border-white/20 text-[11px] font-semibold outline-none cursor-pointer"
                        >
                          {conditionOperators.map((op) => (
                            <option key={op.id} value={op.id}>
                              {op.label}
                            </option>
                          ))}
                        </select>

                        {activeFlow.condition.operator !== 'not-empty' &&
                          activeFlow.condition.operator !== 'is-empty' &&
                          activeFlow.condition.operator !== 'is-checked' && (
                            <input
                              type="text"
                              value={activeFlow.condition.rightValue}
                              onChange={(e) =>
                                onUpdateFlow({
                                  ...activeFlow,
                                  condition: {
                                    ...activeFlow.condition!,
                                    rightValue: e.target.value,
                                  },
                                })
                              }
                              placeholder="Compare value..."
                              className="w-32 px-2 py-1 rounded bg-[#0B0F17] text-white border border-white/20 text-[11px] outline-none"
                            />
                          )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. STACKED ACTION PUZZLE BLOCKS */}
                <div className="space-y-2.5 pt-1 pl-4">
                  {activeFlow.steps.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#131822] border border-dashed border-white/15 text-center space-y-2">
                      <p className="text-xs text-slate-300">
                        {lang === 'si'
                          ? 'දැන් මෙතැනට Action Block එකක් එක් කරන්න (උදා: Go to Next Page)'
                          : 'Snap your first Action Block below (e.g. Go to Next Page)'}
                      </p>
                    </div>
                  ) : (
                    activeFlow.steps.map((step, sIdx) => {
                      const meta =
                        ACTION_BLOCK_CATALOG.find((c) => c.action === step.action) ||
                        ACTION_BLOCK_CATALOG[0];
                      return (
                        <div
                          key={step.id}
                          style={{
                            backgroundColor: meta.color,
                            borderColor: meta.borderColor,
                          }}
                          className="relative rounded-xl border-2 p-3.5 shadow-md space-y-2.5"
                        >
                          {/* Top Scratch Connector Row */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-black/25 text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                                {sIdx + 1}
                              </span>
                              {getStepIcon(step.action)}
                              <select
                                value={step.action}
                                onChange={(e) => {
                                  const nextAction = e.target.value as LogicStepAction;
                                  const nextDefaults = createStepFromCatalog(
                                    nextAction,
                                    pages,
                                    activePage?.id || '',
                                    cloudConfig
                                  );
                                  handleUpdateStep(step.id, {
                                    action: nextAction,
                                    targetPageId: nextDefaults.targetPageId,
                                    value: step.value ?? nextDefaults.value,
                                    varName: step.varName ?? nextDefaults.varName,
                                    collectionName: step.collectionName ?? nextDefaults.collectionName,
                                    apiUrl: step.apiUrl ?? nextDefaults.apiUrl,
                                    httpMethod: step.httpMethod ?? nextDefaults.httpMethod,
                                    validationRule: step.validationRule ?? nextDefaults.validationRule,
                                    delayMs: step.delayMs ?? nextDefaults.delayMs,
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#090D16] text-white border border-black/30 text-xs font-bold outline-none cursor-pointer"
                              >
                                {ACTION_BLOCK_CATALOG.map((cat) => (
                                  <option key={cat.action} value={cat.action}>
                                    {lang === 'si' ? cat.siLabel : cat.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={sIdx === 0}
                                onClick={() => handleMoveStep(step.id, -1)}
                                title="Move Up"
                                className="p-1 rounded bg-black/20 hover:bg-black/35 text-white disabled:opacity-35 cursor-pointer"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={sIdx === activeFlow.steps.length - 1}
                                onClick={() => handleMoveStep(step.id, 1)}
                                title="Move Down"
                                className="p-1 rounded bg-black/20 hover:bg-black/35 text-white disabled:opacity-35 cursor-pointer"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveStep(step.id)}
                                title="Remove Step"
                                className="p-1 rounded bg-black/20 hover:bg-rose-700 text-white cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Step Parameter Inputs */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {meta.needsPage && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-white/90">
                                  Target Page:
                                </span>
                                <select
                                  value={step.targetPageId || ''}
                                  onChange={(e) =>
                                    handleUpdateStep(step.id, { targetPageId: e.target.value })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-[#090D16] text-sky-200 border border-black/30 text-xs font-semibold outline-none cursor-pointer"
                                >
                                  {pages.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} (/{p.slug})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {meta.needsWidget && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-white/90">
                                  Target Widget:
                                </span>
                                <select
                                  value={step.targetBlockId || ''}
                                  onChange={(e) =>
                                    handleUpdateStep(step.id, { targetBlockId: e.target.value })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-[#090D16] text-white border border-black/30 text-xs font-semibold outline-none cursor-pointer max-w-[230px]"
                                >
                                  <option value="">Auto / First Matching Widget</option>
                                  {uiWidgets.map((w) => (
                                    <option key={w.id} value={w.id}>
                                      [{getFriendlyWidgetTypeLabel(w)}] {(w.content || w.name).slice(0, 28)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {meta.needsValidation && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-white/90">
                                  Rule:
                                </span>
                                <select
                                  value={step.validationRule || 'not-empty'}
                                  onChange={(e) =>
                                    handleUpdateStep(step.id, {
                                      validationRule: e.target.value as 'not-empty' | 'email' | 'min-length',
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-[#090D16] text-emerald-200 border border-black/30 text-xs font-semibold outline-none cursor-pointer"
                                >
                                  <option value="not-empty">Required (Not Empty)</option>
                                  <option value="email">Valid Email</option>
                                  <option value="min-length">Min 6 Characters</option>
                                </select>
                              </div>
                            )}

                            {meta.needsVar && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-white/90">
                                  Key/Var:
                                </span>
                                <input
                                  type="text"
                                  value={step.varName || ''}
                                  onChange={(e) =>
                                    handleUpdateStep(step.id, { varName: e.target.value })
                                  }
                                  placeholder="variableName"
                                  className="w-32 px-2.5 py-1 rounded-lg bg-[#090D16] text-amber-200 font-mono border border-black/30 text-xs outline-none"
                                />
                              </div>
                            )}

                            {meta.needsCollection && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-white/90">
                                  Collection / Table:
                                </span>
                                <input
                                  type="text"
                                  value={step.collectionName || ''}
                                  onChange={(e) =>
                                    handleUpdateStep(step.id, { collectionName: e.target.value })
                                  }
                                  placeholder="submissions"
                                  className="w-36 px-2.5 py-1 rounded-lg bg-[#090D16] text-cyan-200 font-mono border border-black/30 text-xs outline-none"
                                />
                              </div>
                            )}

                            {meta.needsApi && (
                              <div className="flex flex-wrap items-center gap-1.5 w-full">
                                <select
                                  value={step.httpMethod || 'POST'}
                                  onChange={(e) =>
                                    handleUpdateStep(step.id, {
                                      httpMethod: e.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE',
                                    })
                                  }
                                  className="px-2 py-1 rounded-lg bg-[#090D16] text-cyan-200 font-mono border border-black/30 text-xs font-bold outline-none cursor-pointer"
                                >
                                  <option value="GET">GET</option>
                                  <option value="POST">POST</option>
                                  <option value="PUT">PUT</option>
                                  <option value="DELETE">DELETE</option>
                                </select>
                                <input
                                  type="text"
                                  value={step.apiUrl || ''}
                                  onChange={(e) =>
                                    handleUpdateStep(step.id, { apiUrl: e.target.value })
                                  }
                                  placeholder="https://api.example.com/endpoint"
                                  className="flex-1 min-w-[180px] px-2.5 py-1 rounded-lg bg-[#090D16] text-white font-mono border border-black/30 text-xs outline-none"
                                />
                              </div>
                            )}

                            {meta.needsDelay && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-white/90">
                                  Duration (ms):
                                </span>
                                <input
                                  type="number"
                                  min={100}
                                  max={10000}
                                  step={100}
                                  value={step.delayMs ?? 800}
                                  onChange={(e) =>
                                    handleUpdateStep(step.id, {
                                      delayMs: Math.max(100, Number(e.target.value) || 800),
                                    })
                                  }
                                  className="w-24 px-2.5 py-1 rounded-lg bg-[#090D16] text-violet-200 font-mono border border-black/30 text-xs outline-none"
                                />
                              </div>
                            )}

                            {meta.needsValue && (
                              <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                                <span className="text-[11px] font-semibold text-white/90 shrink-0">
                                  {meta.valueLabel || 'Value'}:
                                </span>
                                <input
                                  type="text"
                                  value={step.value ?? ''}
                                  onChange={(e) =>
                                    handleUpdateStep(step.id, { value: e.target.value })
                                  }
                                  placeholder={meta.valuePlaceholder || 'Value...'}
                                  className="flex-1 min-w-[140px] px-2.5 py-1 rounded-lg bg-[#090D16] text-white border border-black/30 text-xs outline-none"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Add Action Block Button + Picker */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddStepDrawer((o) => !o)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#161B26] hover:bg-[#1E2534] border border-dashed border-amber-400/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        {lang === 'si'
                          ? '+ Action Block එකක් එක් කරන්න'
                          : '+ Snap Another Action Block'}
                      </span>
                    </button>

                    {showAddStepDrawer && (
                      <div className="mt-2 p-3 rounded-xl bg-[#121620] border border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-1.5 shadow-xl">
                        {ACTION_BLOCK_CATALOG.map((item) => (
                          <button
                            key={`pick-${item.action}`}
                            type="button"
                            onClick={() => handleAddStep(item.action)}
                            className="flex items-center gap-2 p-2 rounded-lg bg-[#181E2B] hover:bg-white/10 border border-white/10 text-left cursor-pointer transition-colors"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-bold text-white truncate">
                                {lang === 'si' ? item.siLabel : item.label}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {item.description}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Plain-Language Flow Summary + Live Execution Console */}
              <div className="rounded-xl bg-[#11151E] border border-white/10 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live Logic Summary &amp; Execution Log</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {pages.length} page{pages.length === 1 ? '' : 's'} · {Object.keys(runtimeState.variables).length} vars
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#090B10] border border-white/10 text-xs text-slate-300 flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-amber-300">
                    When {activeTargetWidget ? `"${activeTargetWidget.content || activeTargetWidget.name}"` : 'any widget'}{' '}
                    {activeTriggerMeta?.shortLabel || activeFlow.trigger}
                  </span>
                  {activeFlow.condition?.enabled && (
                    <>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="font-semibold text-violet-300">
                        if {activeFlow.condition.operator}
                      </span>
                    </>
                  )}
                  {activeFlow.steps.map((s) => {
                    const meta = ACTION_BLOCK_CATALOG.find((c) => c.action === s.action);
                    return (
                      <React.Fragment key={`sum-${s.id}`}>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="font-semibold text-emerald-300">
                          {meta?.label || s.action}
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>

                {runtimeState.consoleLogs.length > 0 && (
                  <div className="max-h-28 overflow-y-auto p-2.5 rounded-lg bg-[#05070B] border border-white/10 space-y-1 font-mono text-[10px]">
                    {runtimeState.consoleLogs.slice(0, 8).map((log) => (
                      <div
                        key={log.id}
                        className={
                          log.level === 'error'
                            ? 'text-rose-400'
                            : log.level === 'warn'
                            ? 'text-amber-300'
                            : log.level === 'success'
                            ? 'text-emerald-300'
                            : 'text-slate-300'
                        }
                      >
                        [{log.time}] {log.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
