import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Globe,
  Lightbulb,
  HelpCircle,
  FileCode2,
  Palette,
  Braces,
  Code2,
  Plus,
  Minus,
  Equal,
  Trash2,
  ArrowLeft,
  Download,
  Upload,
  Zap,
  Sparkles,
  Check,
  X,
  Save,
  Copy,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  Columns2,
  LayoutPanelLeft,
  ArrowUp,
  ArrowDown,
  FileText,
  Server,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Droplets,
  Wand2,
  MousePointerClick,
  Link2,
  Search,
  Terminal,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  Settings,
  Bot,
  Crown,
  ChevronDown,
  Layers,
  LayoutGrid,
  Folder,
  Move,
  SlidersHorizontal,
} from 'lucide-react';
import {
  BlockActionType,
  BlockLogicConfig,
  BlockStyle,
  CanvasBlock,
  LogicFlowRule,
  LogicStepAction,
  LogicTriggerType,
  MediaAssetItem,
  MediaAssetKind,
  NavbarLinkAction,
  NavbarLinkItem,
  PageStyleSettings,
  Project,
  SiteCloudConfig,
  SitePage,
  ViewportMode,
} from '../../types/builder';
import { INITIAL_DEMO_BLOCKS } from '../../data/defaultTemplates';
import {
  WEB_STUDIO_CATEGORIES,
  WEB_STUDIO_BLOCK_TEMPLATES,
  WebStudioCategoryId,
  WebStudioBlockTemplate,
  createCanvasBlockFromTemplate,
  getCategoryMetaForBlockType,
} from '../../data/webStudioBlocks';
import { PreviewConfirmDialog, WebPreviewRenderer, renderVectorIcon } from './WebPreviewRenderer';
import { ThemeStyleStudioPanel } from './ThemeStyleStudioPanel';
import { CloudBackendStudioPanel, DEFAULT_SITE_CLOUD_CONFIG } from './CloudBackendStudioPanel';
import { PageSelectorStudioPanel } from './PageSelectorStudioPanel';
import { WidgetTreeStudioPanel } from './WidgetTreeStudioPanel';
import { SearchStudioPanel } from './SearchStudioPanel';
import { MediaAssetsStudioPanel } from './MediaAssetsStudioPanel';
import { ProBlockInspector, ProInspectorRibbon } from './ProBlockInspector';
import { MultiTextItemsEditor, supportsMultiTextBoxes } from './MultiTextItemsEditor';
import {
  BackendLogicSidebar,
  BackendLogicWorkspace,
  LOGIC_FLOW_RECIPES,
  LogicRecipe,
  createStepFromCatalog,
  getTriggerCandidates,
} from './BackendLogicBuilder';
import { GeminiCodingAgentPanel, GeminiAgentAction } from './GeminiCodingAgentPanel';
import { ICON_LIBRARY } from '../../utils/mediaHelpers';
import {
  deleteMediaBlobFromIdb,
  loadMediaBlobUrlFromIdb,
  resolveMediaAssetUrl,
} from '../../utils/mediaLibraryStore';
import {
  generateHtmlExport,
  generateCssExport,
  generateJsExport,
  generateReactTsxExport,
  generateFlaskExport,
} from '../../utils/webStudioCodeGen';
import {
  LIVE_ANIMATION_PRESETS,
  PAGE_THEME_PRESETS,
  resolvePageBackgroundCss,
} from '../../utils/pageStylePresets';
import { FONT_OPTIONS } from '../../data/blockStyleTemplates';
import { getEffectiveNavLinks } from '../../utils/navLinkHelpers';
import {
  INITIAL_RUNTIME_STATE,
  StudioRuntimeState,
  evaluateLogicCondition,
  evaluateMathTextOperation,
  parseOptionsList,
  validateInputValue,
} from '../../utils/studioRuntime';
import { readAndCompressImageFile } from '../../utils/imageUpload';
import { useTheme } from '../../context/ThemeContext';

interface ScratchStudioProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onBackToProjects: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const SECTION_BUNDLES = [
  {
    id: 'hero-cta',
    name: 'Hero + CTA Wire',
    siName: 'Hero + බොත්තම',
    description: 'Headline, KPI stat, reactive counter & wired trigger button.',
    color: 'bg-indigo-600',
    types: ['ui-heading', 'logic-counter', 'ui-button'] as const,
  },
  {
    id: 'lead-capture',
    name: 'Lead Signup Form',
    siName: 'ලියාපදිංචි පෝරමය',
    description: 'Email input, brief textarea & submit action button.',
    color: 'bg-fuchsia-600',
    types: ['ui-input', 'ui-textarea', 'ui-button'] as const,
  },
  {
    id: 'flask-service',
    name: 'Flask API Stack',
    siName: 'Flask API සේවාව',
    description: 'Python Flask route + REST fetch client card.',
    color: 'bg-emerald-600',
    types: ['backend-flask', 'backend-fetch'] as const,
  },
];

const PAGE_PRESETS = [
  {
    id: 'about',
    name: 'About Us',
    siName: 'අප ගැන',
    slug: 'about',
    description: 'Navbar, story heading, team card & footer.',
    types: ['ui-navbar', 'ui-heading', 'ui-card', 'ui-avatar', 'ui-footer'] as const,
  },
  {
    id: 'services',
    name: 'Services',
    siName: 'සේවාවන්',
    slug: 'services',
    description: 'Navbar, hero headline, KPI stat, pricing & CTA.',
    types: ['ui-navbar', 'ui-heading', 'ui-stat', 'ui-pricing', 'ui-button'] as const,
  },
  {
    id: 'contact',
    name: 'Contact',
    siName: 'සම්බන්ධ වන්න',
    slug: 'contact',
    description: 'Navbar, heading, email input, message box & button.',
    types: ['ui-navbar', 'ui-heading', 'ui-input', 'ui-textarea', 'ui-button'] as const,
  },
  {
    id: 'blank',
    name: 'Blank Page',
    siName: 'හිස් පිටුව',
    slug: 'page',
    description: 'Empty canvas ready for custom blocks.',
    types: [] as const,
  },
];

function buildInitialPages(proj: Project): SitePage[] {
  if (proj.pages && proj.pages.length > 0) {
    return proj.pages.map((p) => ({
      ...p,
      blocks: Array.isArray(p.blocks) ? p.blocks : [],
      logicFlows: Array.isArray(p.logicFlows) ? p.logicFlows : [],
    }));
  }
  const homeBlocks =
    proj.blocks && proj.blocks.length > 0 ? proj.blocks : [...INITIAL_DEMO_BLOCKS];
  return [
    {
      id: 'page_home',
      name: 'Home',
      slug: 'index',
      blocks: homeBlocks,
      logicFlows: [],
    },
  ];
}

export const ScratchStudio: React.FC<ScratchStudioProps> = ({
  project,
  onUpdateProject,
  onBackToProjects,
  onToast,
}) => {
  const { themeConfig } = useTheme();
  const [pages, setPages] = useState<SitePage[]>(() => buildInitialPages(project));
  const [activePageId, setActivePageId] = useState<string>(() => {
    const initial = buildInitialPages(project);
    return initial[0]?.id || 'page_home';
  });
  const [projectName, setProjectName] = useState<string>(project.name || 'SL WebStudio Project');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(() => {
    const initial = buildInitialPages(project);
    return initial[0]?.blocks[0]?.id || null;
  });
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(() => {
    const initial = buildInitialPages(project);
    return initial[0]?.logicFlows?.[0]?.id || null;
  });
  const [lang, setLang] = useState<'en' | 'si'>('en');
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [cssSection, setCssSection] = useState<'page-style' | 'live-animations' | 'element'>(
    'page-style'
  );
  const [htmlViewMode, setHtmlViewMode] = useState<'visual' | 'inspector' | 'logic' | 'code'>('visual');
  const [copiedBlockStyle, setCopiedBlockStyle] = useState<Partial<BlockStyle> | null>(null);
  const [activeCategory, setActiveCategory] = useState<WebStudioCategoryId>('layout');
  const [activeRailItem, setActiveRailItem] = useState<string>('widget-palette');
  const [frequentlyUsedOpen, setFrequentlyUsedOpen] = useState<boolean>(true);
  const [layoutElementsOpen, setLayoutElementsOpen] = useState<boolean>(true);
  const [baseElementsOpen, setBaseElementsOpen] = useState<boolean>(true);
  const [pageElementsOpen, setPageElementsOpen] = useState<boolean>(true);
  const [formElementsOpen, setFormElementsOpen] = useState<boolean>(true);
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [stageSize, setStageSize] = useState<'small' | 'normal' | 'fullscreen'>('normal');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [undoStack, setUndoStack] = useState<SitePage[][]>([]);
  const [jsViewTarget, setJsViewTarget] = useState<'js' | 'react' | 'flask'>('js');
  const [exportTarget, setExportTarget] = useState<'html' | 'css' | 'js' | 'react' | 'flask'>('html');
  const [copiedExport, setCopiedExport] = useState(false);

  // Dropdowns & Modals
  const [openMenu, setOpenMenu] = useState<'lang' | 'file' | 'edit' | null>(null);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [runtimeState, setRuntimeState] = useState<StudioRuntimeState>(() => INITIAL_RUNTIME_STATE);
  const [formInputs, setFormInputs] = useState<Record<string, string>>({});
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [runningTimers, setRunningTimers] = useState<Record<string, boolean>>({});
  const [confirmDialog, setConfirmDialog] = useState<PreviewConfirmDialog | null>(null);
  const pendingConfirmActionRef = useRef<(() => void) | null>(null);
  const [canvasDropIndex, setCanvasDropIndex] = useState<number | null>(null);
  const [draggingCanvasBlockId, setDraggingCanvasBlockId] = useState<string | null>(null);
  const [cloudConfig, setCloudConfig] = useState<SiteCloudConfig>(() => ({
    firebase: { ...DEFAULT_SITE_CLOUD_CONFIG.firebase, ...(project.cloudConfig?.firebase || {}) },
    supabase: { ...DEFAULT_SITE_CLOUD_CONFIG.supabase, ...(project.cloudConfig?.supabase || {}) },
  }));
  const [mediaAssets, setMediaAssets] = useState<MediaAssetItem[]>(
    () => (Array.isArray(project.mediaAssets) ? project.mediaAssets : [])
  );
  const [resolvedIdbUrls, setResolvedIdbUrls] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const appendConsoleLog = useCallback(
    (level: 'log' | 'success' | 'warn' | 'error', message: string) => {
      setRuntimeState((prev) => ({
        ...prev,
        consoleLogs: [
          {
            id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            time: new Date().toLocaleTimeString(),
            level,
            message,
          },
          ...prev.consoleLogs.slice(0, 29),
        ],
      }));
    },
    []
  );

  // Reset local studio state when switching project
  useEffect(() => {
    const initial = buildInitialPages(project);
    setPages(initial);
    setActivePageId(initial[0]?.id || 'page_home');
    setProjectName(project.name || 'SL WebStudio Project');
    setSelectedBlockId(initial[0]?.blocks[0]?.id || null);
    setSelectedFlowId(initial[0]?.logicFlows?.[0]?.id || null);
    setUndoStack([]);
    setFormInputs({});
    setPageHistory([]);
    setRunningTimers({});
    setConfirmDialog(null);
    setRuntimeState(INITIAL_RUNTIME_STATE);
    setCloudConfig({
      firebase: { ...DEFAULT_SITE_CLOUD_CONFIG.firebase, ...(project.cloudConfig?.firebase || {}) },
      supabase: { ...DEFAULT_SITE_CLOUD_CONFIG.supabase, ...(project.cloudConfig?.supabase || {}) },
    });
    setMediaAssets(Array.isArray(project.mediaAssets) ? project.mediaAssets : []);
  }, [project.id]);

  // Resolve any idb:// media assets to active browser blob: URLs
  useEffect(() => {
    const idbAssets = mediaAssets.filter((a) => a.url.startsWith('idb://'));
    if (idbAssets.length === 0) return;
    let cancelled = false;
    (async () => {
      const updates: Record<string, string> = {};
      for (const item of idbAssets) {
        const assetId = item.url.slice('idb://'.length);
        if (!resolvedIdbUrls[assetId]) {
          const objUrl = await loadMediaBlobUrlFromIdb(assetId);
          if (objUrl) updates[assetId] = objUrl;
        }
      }
      if (!cancelled && Object.keys(updates).length > 0) {
        setResolvedIdbUrls((prev) => ({ ...prev, ...updates }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mediaAssets, resolvedIdbUrls]);

  // Debounced persistence to App / Firestore
  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdateProject({
        ...project,
        name: projectName,
        blocks: pages[0]?.blocks || [],
        pages,
        cloudConfig,
        mediaAssets,
        updatedAt: 'Just now',
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [pages, projectName, cloudConfig, mediaAssets]);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];
  const blocks = activePage?.blocks || [];
  const activeLogicFlows = activePage?.logicFlows || [];
  const activePageStyle: PageStyleSettings = activePage?.pageStyle || {};

  const commitLogicFlows = useCallback(
    (updater: (prev: LogicFlowRule[]) => LogicFlowRule[], recordUndo = true) => {
      setPages((prevPages) => {
        if (recordUndo) {
          setUndoStack((u) => [...u.slice(-19), prevPages]);
        }
        return prevPages.map((p) =>
          p.id === activePageId
            ? { ...p, logicFlows: updater(Array.isArray(p.logicFlows) ? p.logicFlows : []) }
            : p
        );
      });
    },
    [activePageId]
  );

  const handleCreateLogicFlow = useCallback(
    (preset?: LogicRecipe) => {
      const trigger: LogicTriggerType = preset?.trigger || 'when-click';
      const candidates = preset
        ? blocks.filter((b) => preset.preferredTypes.includes(b.type))
        : getTriggerCandidates(trigger, blocks);
      const fallbackTarget = candidates[0]?.id || getTriggerCandidates(trigger, blocks)[0]?.id || 'any';
      const steps = (preset?.steps || [{ action: 'next-page' as LogicStepAction }]).map((s) => ({
        ...createStepFromCatalog(s.action, pages, activePageId, cloudConfig),
        ...s,
        id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      }));
      const newFlow: LogicFlowRule = {
        id: `flow_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        name: preset ? preset.name : `Logic Flow ${activeLogicFlows.length + 1}`,
        enabled: true,
        trigger,
        targetBlockId: fallbackTarget,
        steps,
        createdAt: new Date().toLocaleTimeString(),
      };
      commitLogicFlows((prev) => [...prev, newFlow]);
      setSelectedFlowId(newFlow.id);
      onToast(
        lang === 'si'
          ? `"${newFlow.name}" Backend Flow එක් කළා!`
          : `Created backend flow "${newFlow.name}"`,
        'success'
      );
    },
    [blocks, pages, activePageId, cloudConfig, activeLogicFlows.length, commitLogicFlows, onToast, lang]
  );

  const handleAppendActionToActiveFlow = useCallback(
    (action: LogicStepAction) => {
      const targetFlow =
        activeLogicFlows.find((f) => f.id === selectedFlowId) || activeLogicFlows[0] || null;
      const newStep = createStepFromCatalog(action, pages, activePageId, cloudConfig);
      if (!targetFlow) {
        const candidates = getTriggerCandidates('when-click', blocks);
        const newFlow: LogicFlowRule = {
          id: `flow_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          name: `Flow ${activeLogicFlows.length + 1}`,
          enabled: true,
          trigger: 'when-click',
          targetBlockId: candidates[0]?.id || 'any',
          steps: [newStep],
          createdAt: new Date().toLocaleTimeString(),
        };
        commitLogicFlows((prev) => [...prev, newFlow]);
        setSelectedFlowId(newFlow.id);
        onToast('Created flow with action block!', 'success');
        return;
      }
      commitLogicFlows((prev) =>
        prev.map((f) =>
          f.id === targetFlow.id ? { ...f, steps: [...f.steps, newStep] } : f
        )
      );
      setSelectedFlowId(targetFlow.id);
      onToast(`Snapped "${action}" into "${targetFlow.name}"`, 'success');
    },
    [activeLogicFlows, selectedFlowId, pages, activePageId, cloudConfig, blocks, commitLogicFlows, onToast]
  );

  const handleUpdatePageStyle = useCallback(
    (patch: Partial<PageStyleSettings>, applyToAllPages = false) => {
      setPages((prevPages) =>
        prevPages.map((p) =>
          applyToAllPages || p.id === activePageId
            ? { ...p, pageStyle: { ...(p.pageStyle || {}), ...patch } }
            : p
        )
      );
    },
    [activePageId]
  );

  const handleResetPageStyle = useCallback(() => {
    setPages((prevPages) =>
      prevPages.map((p) => (p.id === activePageId ? { ...p, pageStyle: {} } : p))
    );
    onToast('Reset page color & live animation to default.', 'info');
  }, [activePageId, onToast]);

  const commitBlocks = useCallback(
    (updater: (prev: CanvasBlock[]) => CanvasBlock[], recordUndo = true) => {
      setPages((prevPages) => {
        if (recordUndo) {
          setUndoStack((u) => [...u.slice(-19), prevPages]);
        }
        return prevPages.map((p) =>
          p.id === activePageId ? { ...p, blocks: updater(p.blocks) } : p
        );
      });
    },
    [activePageId]
  );

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || blocks[0] || null;

  // =================== PAGE ACTIONS ===================
  const handleSelectPage = (pageId: string, recordHistory = true) => {
    if (recordHistory && pageId !== activePageId) {
      setPageHistory((prev) => [...prev.slice(-9), activePageId]);
    }
    setActivePageId(pageId);
    const target = pages.find((p) => p.id === pageId);
    setSelectedBlockId(target?.blocks[0]?.id || null);
    setSelectedFlowId(target?.logicFlows?.[0]?.id || null);
  };

  const handleCreatePage = (
    rawName: string,
    presetId: 'about' | 'services' | 'contact' | 'blank' = 'blank'
  ) => {
    const preset = PAGE_PRESETS.find((pr) => pr.id === presetId) || PAGE_PRESETS[3];
    const cleanName = rawName.trim() || preset.name;
    let baseSlug =
      cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || `page-${pages.length + 1}`;
    if (pages.some((p) => p.slug === baseSlug)) {
      baseSlug = `${baseSlug}-${pages.length + 1}`;
    }

    const starterBlocks: CanvasBlock[] = preset.types
      .map((tp) => WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.type === tp))
      .filter((x): x is WebStudioBlockTemplate => Boolean(x))
      .map((tpl) => {
        const blk = createCanvasBlockFromTemplate(tpl);
        if (tpl.type === 'ui-heading') {
          blk.content = `${cleanName} — ${projectName}`;
        }
        return blk;
      });

    const newPage: SitePage = {
      id: `page_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: cleanName,
      slug: baseSlug,
      blocks: starterBlocks,
    };

    setUndoStack((u) => [...u.slice(-19), pages]);
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
    setSelectedBlockId(newPage.blocks[0]?.id || null);
    setNewPageName('');
    setShowAddPageModal(false);
    onToast(`Added page "${cleanName}" (/${baseSlug})`, 'success');
  };

  const handleDeletePage = (pageId: string) => {
    if (pages.length <= 1) {
      onToast('At least one page is required in your website.', 'info');
      return;
    }
    const target = pages.find((p) => p.id === pageId);
    const remaining = pages.filter((p) => p.id !== pageId);
    setUndoStack((u) => [...u.slice(-19), pages]);
    setPages(remaining);
    if (activePageId === pageId && remaining[0]) {
      setActivePageId(remaining[0].id);
      setSelectedBlockId(remaining[0].blocks[0]?.id || null);
    }
    onToast(`Removed page "${target?.name || 'Page'}"`, 'info');
  };

  const handleRenamePage = (pageId: string, newName: string) => {
    const cleanName = newName.trim();
    if (!cleanName) return;
    setUndoStack((u) => [...u.slice(-19), pages]);
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== pageId) return p;
        const nextSlug =
          p.slug === 'index'
            ? 'index'
            : cleanName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '') || p.slug;
        return { ...p, name: cleanName, slug: nextSlug };
      })
    );
    onToast(`Renamed page to "${cleanName}"`, 'success');
  };

  const handleDuplicatePage = (pageId: string) => {
    const source = pages.find((p) => p.id === pageId);
    if (!source) return;
    const copyName = `${source.name} Copy`;
    let copySlug = `${source.slug === 'index' ? 'home' : source.slug}-copy`;
    if (pages.some((p) => p.slug === copySlug)) {
      copySlug = `${copySlug}-${pages.length + 1}`;
    }
    const clonedBlocks: CanvasBlock[] = source.blocks.map((b) => ({
      ...b,
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      children: b.children?.map((ch) => ({
        ...ch,
        id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      })),
    }));
    const duplicated: SitePage = {
      id: `page_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: copyName,
      slug: copySlug,
      blocks: clonedBlocks,
      pageStyle: source.pageStyle ? { ...source.pageStyle } : undefined,
      logicFlows: source.logicFlows ? source.logicFlows.map((f) => ({ ...f })) : [],
    };
    setUndoStack((u) => [...u.slice(-19), pages]);
    setPages((prev) => [...prev, duplicated]);
    setActivePageId(duplicated.id);
    setSelectedBlockId(clonedBlocks[0]?.id || null);
    onToast(`Duplicated "${source.name}"`, 'success');
  };

  // =================== BLOCK ACTIONS & EXACT-POSITION DRAG & DROP ===================
  const handleInsertTemplateAt = (tpl: WebStudioBlockTemplate, targetIndex?: number) => {
    const created = createCanvasBlockFromTemplate(tpl);
    commitBlocks((prev) => {
      if (targetIndex === undefined || targetIndex < 0 || targetIndex >= prev.length) {
        return [...prev, created];
      }
      const next = [...prev];
      next.splice(targetIndex, 0, created);
      return next;
    });
    setSelectedBlockId(created.id);
    onToast(`Added ${tpl.name}`, 'success');
  };

  const handleAddTemplateBlock = (tpl: WebStudioBlockTemplate) => {
    handleInsertTemplateAt(tpl);
  };

  const handleAddCloudBackendBlocks = (
    preset: 'firebase-db' | 'firebase-auth' | 'firebase-form' | 'supabase-db' | 'supabase-auth' | 'supabase-form'
  ) => {
    const findTpl = (id: string) =>
      WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === id) || WEB_STUDIO_BLOCK_TEMPLATES[0];

    const isFirebase = preset.startsWith('firebase');
    if (isFirebase && !cloudConfig.firebase.enabled) {
      setCloudConfig((prev) => ({
        ...prev,
        firebase: { ...prev.firebase, enabled: true },
      }));
    } else if (!isFirebase && !cloudConfig.supabase.enabled) {
      setCloudConfig((prev) => ({
        ...prev,
        supabase: { ...prev.supabase, enabled: true },
      }));
    }

    const col = cloudConfig.firebase.defaultCollection?.trim() || 'submissions';
    const tbl = cloudConfig.supabase.defaultTable?.trim() || 'leads';
    const created: CanvasBlock[] = [];

    if (preset === 'firebase-db') {
      const dbBlk = createCanvasBlockFromTemplate(findTpl('tpl-cloud-db'));
      dbBlk.name = 'Firebase Firestore';
      dbBlk.content = `Firestore [${col}]: Save / Get / Delete`;
      dbBlk.subtitle = 'Connected to Firebase Firestore SDK on export';
      dbBlk.action = 'db-save';
      dbBlk.logicConfig = { ...(dbBlk.logicConfig || {}), collectionName: col, dbOp: 'save' };
      created.push(dbBlk);
    } else if (preset === 'firebase-auth') {
      const authBlk = createCanvasBlockFromTemplate(findTpl('tpl-auth'));
      authBlk.name = 'Firebase Auth';
      authBlk.content = 'Firebase Email & Password Auth';
      authBlk.subtitle = 'Sign Up, Login & Logout via Firebase Auth SDK';
      authBlk.action = 'auth-signup';
      created.push(authBlk);
    } else if (preset === 'firebase-form') {
      const heading = createCanvasBlockFromTemplate(findTpl('tpl-heading'));
      heading.content = 'Create Your Account';
      heading.subtitle = 'Powered by Firebase Auth & Firestore';
      const email = createCanvasBlockFromTemplate(findTpl('tpl-email-input'));
      const pass = createCanvasBlockFromTemplate(findTpl('tpl-password-input'));
      const btn = createCanvasBlockFromTemplate(findTpl('tpl-submit-button'));
      btn.content = 'Sign Up & Save to Firebase';
      btn.action = 'db-save';
      btn.actionPayload = col;
      const dbBlk = createCanvasBlockFromTemplate(findTpl('tpl-cloud-db'));
      dbBlk.name = 'Firebase Firestore';
      dbBlk.content = `Firestore [${col}]: Save / Get / Delete`;
      dbBlk.subtitle = 'Auto-wired to Firebase Firestore on export';
      dbBlk.logicConfig = { ...(dbBlk.logicConfig || {}), collectionName: col, dbOp: 'save' };
      created.push(heading, email, pass, btn, dbBlk);
    } else if (preset === 'supabase-db') {
      const dbBlk = createCanvasBlockFromTemplate(findTpl('tpl-cloud-db'));
      dbBlk.name = 'Supabase Postgres';
      dbBlk.content = `Supabase [${tbl}]: Insert / Select / Delete`;
      dbBlk.subtitle = 'Connected to Supabase JS Client on export';
      dbBlk.action = 'db-save';
      dbBlk.logicConfig = { ...(dbBlk.logicConfig || {}), collectionName: tbl, dbOp: 'save' };
      created.push(dbBlk);
    } else if (preset === 'supabase-auth') {
      const authBlk = createCanvasBlockFromTemplate(findTpl('tpl-auth'));
      authBlk.name = 'Supabase Auth';
      authBlk.content = 'Supabase Email & Password Auth';
      authBlk.subtitle = 'Sign Up, Login & Logout via Supabase Auth';
      authBlk.action = 'auth-signup';
      created.push(authBlk);
    } else if (preset === 'supabase-form') {
      const heading = createCanvasBlockFromTemplate(findTpl('tpl-heading'));
      heading.content = 'Join & Save Lead';
      heading.subtitle = 'Powered by Supabase Postgres & Auth';
      const email = createCanvasBlockFromTemplate(findTpl('tpl-email-input'));
      const pass = createCanvasBlockFromTemplate(findTpl('tpl-password-input'));
      const btn = createCanvasBlockFromTemplate(findTpl('tpl-submit-button'));
      btn.content = 'Save to Supabase';
      btn.action = 'db-save';
      btn.actionPayload = tbl;
      const dbBlk = createCanvasBlockFromTemplate(findTpl('tpl-cloud-db'));
      dbBlk.name = 'Supabase Postgres';
      dbBlk.content = `Supabase [${tbl}]: Insert / Select / Delete`;
      dbBlk.subtitle = 'Auto-wired to Supabase JS Client on export';
      dbBlk.logicConfig = { ...(dbBlk.logicConfig || {}), collectionName: tbl, dbOp: 'save' };
      created.push(heading, email, pass, btn, dbBlk);
    }

    if (created.length > 0) {
      commitBlocks((prev) => [...prev, ...created]);
      setSelectedBlockId(created[created.length - 1].id);
      appendConsoleLog(
        'success',
        `Added ${isFirebase ? 'Firebase' : 'Supabase'} block preset (${created.length} block${created.length > 1 ? 's' : ''}).`
      );
      onToast(
        lang === 'si'
          ? `${isFirebase ? 'Firebase' : 'Supabase'} block${created.length > 1 ? 's' : ''} canvas එකට එක් කළා!`
          : `Added ${isFirebase ? 'Firebase' : 'Supabase'} block${created.length > 1 ? 's' : ''} to canvas!`,
        'success'
      );
    }
  };

  const handleMoveBlockToIndex = (draggedId: string, targetIndex: number) => {
    commitBlocks((prev) => {
      const fromIdx = prev.findIndex((b) => b.id === draggedId);
      if (fromIdx < 0) return prev;
      let insertAt = Math.max(0, Math.min(prev.length, targetIndex));
      if (fromIdx < insertAt) insertAt -= 1;
      if (insertAt === fromIdx) return prev;
      const copy = [...prev];
      const [item] = copy.splice(fromIdx, 1);
      copy.splice(insertAt, 0, item);
      return copy;
    });
  };

  const handlePaletteDragStart = (e: React.DragEvent, tpl: WebStudioBlockTemplate) => {
    e.dataTransfer.setData('application/x-slbuilder-tpl-id', tpl.id);
    e.dataTransfer.setData('application/x-slbuilder-type', tpl.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasBlockDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggingCanvasBlockId(blockId);
    e.dataTransfer.setData('application/x-slbuilder-move-id', blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const createBlockFromMediaAsset = (media: {
    name: string;
    kind: MediaAssetKind;
    url: string;
  }): CanvasBlock => {
    const tplId =
      media.kind === 'video'
        ? 'tpl-video'
        : media.kind === 'audio'
        ? 'tpl-audio-player'
        : media.kind === 'pdf'
        ? 'tpl-pdf-viewer'
        : 'tpl-image';
    const tpl =
      WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === tplId) || WEB_STUDIO_BLOCK_TEMPLATES[0];
    const created = createCanvasBlockFromTemplate(tpl);
    created.content = media.name || created.content;
    if (media.kind === 'image') {
      created.imageUrl = media.url;
    } else {
      created.videoUrl = media.url;
    }
    return created;
  };

  const handleInsertMediaAsset = (asset: MediaAssetItem) => {
    const url = resolveMediaAssetUrl(asset.url, resolvedIdbUrls);
    if (!url) {
      onToast('Media file is still loading or unavailable.', 'error');
      return;
    }
    const created = createBlockFromMediaAsset({ name: asset.name, kind: asset.kind, url });
    commitBlocks((prev) => [...prev, created]);
    setSelectedBlockId(created.id);
    if (htmlViewMode === 'logic') setHtmlViewMode('visual');
    onToast(`Added "${asset.name}" to canvas`, 'success');
  };

  const handleApplyMediaToSelected = (asset: MediaAssetItem) => {
    const target = blocks.find((b) => b.id === selectedBlockId);
    if (!target) {
      onToast('Select a block on the canvas first.', 'info');
      return;
    }
    const url = resolveMediaAssetUrl(asset.url, resolvedIdbUrls);
    if (!url) {
      onToast('Media file is still loading or unavailable.', 'error');
      return;
    }

    if (asset.kind === 'image') {
      const imagePrimaryTypes = [
        'ui-image',
        'ui-avatar',
        'ui-card',
        'ui-stack',
        'ui-media-display',
        'ui-aspect-ratio',
        'ui-blur',
        'ui-testimonial',
      ];
      if (imagePrimaryTypes.includes(target.type)) {
        handleUpdateBlock({ ...target, imageUrl: url });
      } else {
        handleUpdateBlock({
          ...target,
          style: { ...target.style, bgImageUrl: url },
        });
      }
      onToast(`Applied "${asset.name}" image to "${target.name}"`, 'success');
      return;
    }

    handleUpdateBlock({ ...target, videoUrl: url });
    onToast(`Applied "${asset.name}" to "${target.name}"`, 'success');
  };

  const handleDropAtIndex = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCanvasDropIndex(null);
    setDraggingCanvasBlockId(null);

    // 1. Dropped real photo file from computer
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const imgFile = Array.from(droppedFiles).find((f) => f.type.startsWith('image/'));
      if (imgFile) {
        try {
          const dataUrl = await readAndCompressImageFile(imgFile);
          const imgTpl =
            WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === 'tpl-image') ||
            WEB_STUDIO_BLOCK_TEMPLATES[0];
          const created = createCanvasBlockFromTemplate(imgTpl);
          created.imageUrl = dataUrl;
          created.content = imgFile.name.replace(/\.[^.]+$/, '') || 'Uploaded Photo';
          commitBlocks((prev) => {
            const idx = Math.max(0, Math.min(prev.length, targetIndex));
            const next = [...prev];
            next.splice(idx, 0, created);
            return next;
          });
          setSelectedBlockId(created.id);
          onToast(`Added photo "${imgFile.name}"`, 'success');
        } catch (err) {
          onToast(err instanceof Error ? err.message : 'Failed to load image', 'error');
        }
        return;
      }
    }

    // 2. Dropped asset from Media Library
    const mediaRaw = e.dataTransfer.getData('application/x-slbuilder-media-asset');
    if (mediaRaw) {
      try {
        const mediaAsset = JSON.parse(mediaRaw) as {
          id: string;
          name: string;
          kind: MediaAssetKind;
          url: string;
        };
        if (mediaAsset?.url && mediaAsset?.kind) {
          const created = createBlockFromMediaAsset(mediaAsset);
          commitBlocks((prev) => {
            const idx = Math.max(0, Math.min(prev.length, targetIndex));
            const next = [...prev];
            next.splice(idx, 0, created);
            return next;
          });
          setSelectedBlockId(created.id);
          onToast(`Added "${mediaAsset.name}" to canvas`, 'success');
          return;
        }
      } catch {
        // fall through
      }
    }

    // 3. Reordering existing block
    const moveId = e.dataTransfer.getData('application/x-slbuilder-move-id');
    if (moveId) {
      handleMoveBlockToIndex(moveId, targetIndex);
      return;
    }

    // 4. New block from left palette
    const tplId = e.dataTransfer.getData('application/x-slbuilder-tpl-id');
    const blockType = e.dataTransfer.getData('application/x-slbuilder-type');
    const tpl =
      (tplId ? WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === tplId) : undefined) ||
      (blockType ? WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.type === blockType) : undefined);
    if (tpl) {
      handleInsertTemplateAt(tpl, targetIndex);
    }
  };

  const handleDropPayloadAtIndex = (
    payload: {
      tplId?: string;
      blockType?: string;
      moveBlockId?: string;
      imageDataUrl?: string;
      fileName?: string;
      mediaAsset?: { id: string; name: string; kind: MediaAssetKind; url: string };
    },
    targetIndex: number
  ) => {
    setCanvasDropIndex(null);
    setDraggingCanvasBlockId(null);

    if (payload.mediaAsset) {
      const created = createBlockFromMediaAsset(payload.mediaAsset);
      commitBlocks((prev) => {
        const idx = Math.max(0, Math.min(prev.length, targetIndex));
        const next = [...prev];
        next.splice(idx, 0, created);
        return next;
      });
      setSelectedBlockId(created.id);
      onToast(`Added "${payload.mediaAsset.name}"`, 'success');
      return;
    }

    if (payload.imageDataUrl) {
      const imgTpl =
        WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === 'tpl-image') ||
        WEB_STUDIO_BLOCK_TEMPLATES[0];
      const created = createCanvasBlockFromTemplate(imgTpl);
      created.imageUrl = payload.imageDataUrl;
      created.content =
        (payload.fileName || 'Uploaded Photo').replace(/\.[^.]+$/, '') || 'Uploaded Photo';
      commitBlocks((prev) => {
        const idx = Math.max(0, Math.min(prev.length, targetIndex));
        const next = [...prev];
        next.splice(idx, 0, created);
        return next;
      });
      setSelectedBlockId(created.id);
      onToast(`Added photo "${payload.fileName || 'image'}"`, 'success');
      return;
    }

    if (payload.moveBlockId) {
      handleMoveBlockToIndex(payload.moveBlockId, targetIndex);
      return;
    }

    const tpl =
      (payload.tplId
        ? WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === payload.tplId)
        : undefined) ||
      (payload.blockType
        ? WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.type === payload.blockType)
        : undefined);
    if (tpl) {
      handleInsertTemplateAt(tpl, targetIndex);
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    const fallbackIdx = canvasDropIndex !== null ? canvasDropIndex : blocks.length;
    void handleDropAtIndex(e, fallbackIdx);
  };

  const handleUpdateBlock = (updated: CanvasBlock) => {
    commitBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)), false);
  };

  const handleAddChildWidget = (containerId: string, tplId: string) => {
    const tpl = WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    const child = createCanvasBlockFromTemplate(tpl);
    commitBlocks((prev) =>
      prev.map((b) =>
        b.id === containerId ? { ...b, children: [...(b.children || []), child] } : b
      )
    );
    onToast(`Added ${tpl.name} inside container`, 'success');
  };

  const handleDropChildInContainer = (
    containerId: string,
    payload: {
      tplId?: string;
      blockType?: string;
      imageDataUrl?: string;
      fileName?: string;
      mediaAsset?: { id: string; name: string; kind: MediaAssetKind; url: string };
    }
  ) => {
    if (payload.mediaAsset) {
      const created = createBlockFromMediaAsset(payload.mediaAsset);
      commitBlocks((prev) =>
        prev.map((b) =>
          b.id === containerId ? { ...b, children: [...(b.children || []), created] } : b
        )
      );
      setSelectedBlockId(containerId);
      onToast(`Added "${payload.mediaAsset.name}" inside container`, 'success');
      return;
    }

    if (payload.imageDataUrl) {
      const imgTpl =
        WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === 'tpl-image') ||
        WEB_STUDIO_BLOCK_TEMPLATES[0];
      const created = createCanvasBlockFromTemplate(imgTpl);
      created.imageUrl = payload.imageDataUrl;
      created.content =
        (payload.fileName || 'Uploaded Photo').replace(/\.[^.]+$/, '') || 'Uploaded Photo';
      commitBlocks((prev) =>
        prev.map((b) =>
          b.id === containerId ? { ...b, children: [...(b.children || []), created] } : b
        )
      );
      setSelectedBlockId(containerId);
      onToast(`Added photo "${payload.fileName || 'image'}" inside container`, 'success');
      return;
    }

    const tpl =
      (payload.tplId
        ? WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === payload.tplId)
        : undefined) ||
      (payload.blockType
        ? WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.type === payload.blockType)
        : undefined);
    if (!tpl) return;

    const child = createCanvasBlockFromTemplate(tpl);
    commitBlocks((prev) =>
      prev.map((b) =>
        b.id === containerId ? { ...b, children: [...(b.children || []), child] } : b
      )
    );
    setSelectedBlockId(containerId);
    onToast(`Added ${tpl.name} inside container`, 'success');
  };

  const handleDeleteBlock = (id: string) => {
    commitBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      if (selectedBlockId === id) {
        setSelectedBlockId(next[0]?.id || null);
      }
      return next;
    });
  };

  const handleMoveBlock = (id: string, dir: -1 | 1) => {
    commitBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, item);
      return copy;
    });
  };

  const handleDuplicateBlock = (block: CanvasBlock) => {
    const copy: CanvasBlock = {
      ...block,
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: `${block.name} (Copy)`,
      style: { ...block.style },
    };
    commitBlocks((prev) => [...prev, copy]);
    setSelectedBlockId(copy.id);
  };

  const handleCopyBlockStyle = (styleToCopy: Partial<BlockStyle>) => {
    setCopiedBlockStyle({ ...styleToCopy });
    onToast('Style copied! Select any block and click Paste Style.', 'success');
  };

  const handlePasteBlockStyle = () => {
    if (!copiedBlockStyle || !selectedBlock) return;
    handleUpdateBlock({
      ...selectedBlock,
      style: { ...selectedBlock.style, ...copiedBlockStyle },
    });
    onToast(`Applied copied style to ${selectedBlock.name}`, 'success');
  };

  const handleBulkApplyBlockStyle = (stylePatch: Partial<BlockStyle>) => {
    commitBlocks((prev) =>
      prev.map((b) => ({
        ...b,
        style: { ...b.style, ...stylePatch },
        children: b.children?.map((ch) => ({
          ...ch,
          style: { ...ch.style, ...stylePatch },
        })),
      }))
    );
  };

  const handleResetBlockStyle = (blockId: string) => {
    commitBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              style: {
                isHidden: b.style?.isHidden,
              },
            }
          : b
      )
    );
    onToast('Reset block styles to default', 'info');
  };

  const handleApplyGeminiActions = useCallback(
    (actions: GeminiAgentAction[]): number => {
      if (!Array.isArray(actions) || actions.length === 0) return 0;
      let applied = 0;
      let nextSelectedId: string | null = null;

      const hasBlockOps = actions.some((a) =>
        ['add-block', 'update-block', 'delete-block', 'move-block'].includes(a.type)
      );

      if (hasBlockOps) {
        commitBlocks((prev) => {
          let next = [...prev];
          for (const act of actions) {
            if (act.type === 'add-block') {
              const tpl =
                (act.templateId
                  ? WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === act.templateId)
                  : undefined) ||
                (act.blockType
                  ? WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.type === act.blockType)
                  : undefined) ||
                WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === 'tpl-card');
              if (!tpl) continue;
              const created = createCanvasBlockFromTemplate(tpl);
              if (act.name) created.name = act.name;
              if (act.content !== undefined) created.content = act.content;
              if (act.subtitle !== undefined) created.subtitle = act.subtitle;
              if (act.optionsCsv) {
                const parsed = act.optionsCsv
                  .split(/[,|]+/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                if (parsed.length > 0) created.options = parsed;
              }
              if (act.imageUrl) created.imageUrl = act.imageUrl;
              if (act.videoUrl) created.videoUrl = act.videoUrl;
              if (act.actionType) {
                created.action = act.actionType as BlockActionType;
              }
              if (act.actionPayload !== undefined) created.actionPayload = act.actionPayload;
              if (act.apiEndpoint !== undefined) created.apiEndpoint = act.apiEndpoint;
              if (
                act.httpMethod === 'GET' ||
                act.httpMethod === 'POST' ||
                act.httpMethod === 'PUT' ||
                act.httpMethod === 'DELETE'
              ) {
                created.httpMethod = act.httpMethod;
              }
              if (act.stylePatch) {
                created.style = { ...created.style, ...act.stylePatch };
              }
              if (
                typeof act.positionIndex === 'number' &&
                act.positionIndex >= 0 &&
                act.positionIndex <= next.length
              ) {
                next.splice(act.positionIndex, 0, created);
              } else {
                next.push(created);
              }
              nextSelectedId = created.id;
              applied++;
            } else if (act.type === 'update-block') {
              const targetId = act.targetBlockId || selectedBlockId || next[0]?.id;
              if (!targetId) continue;
              let matched = false;
              next = next.map((b) => {
                if (b.id !== targetId) return b;
                matched = true;
                const updated: CanvasBlock = {
                  ...b,
                  ...(act.name ? { name: act.name } : {}),
                  ...(act.content !== undefined ? { content: act.content } : {}),
                  ...(act.subtitle !== undefined ? { subtitle: act.subtitle } : {}),
                  ...(act.imageUrl ? { imageUrl: act.imageUrl } : {}),
                  ...(act.videoUrl ? { videoUrl: act.videoUrl } : {}),
                  ...(act.actionType ? { action: act.actionType as BlockActionType } : {}),
                  ...(act.actionPayload !== undefined ? { actionPayload: act.actionPayload } : {}),
                  ...(act.apiEndpoint !== undefined ? { apiEndpoint: act.apiEndpoint } : {}),
                  ...(act.httpMethod === 'GET' ||
                  act.httpMethod === 'POST' ||
                  act.httpMethod === 'PUT' ||
                  act.httpMethod === 'DELETE'
                    ? { httpMethod: act.httpMethod }
                    : {}),
                  style: act.stylePatch ? { ...b.style, ...act.stylePatch } : b.style,
                };
                if (act.optionsCsv) {
                  const parsed = act.optionsCsv
                    .split(/[,|]+/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  if (parsed.length > 0) updated.options = parsed;
                }
                nextSelectedId = updated.id;
                return updated;
              });
              if (matched) applied++;
            } else if (act.type === 'delete-block') {
              const targetId = act.targetBlockId || selectedBlockId;
              if (!targetId) continue;
              const beforeLen = next.length;
              next = next.filter((b) => b.id !== targetId);
              if (next.length < beforeLen) {
                applied++;
                nextSelectedId = next[0]?.id || null;
              }
            } else if (act.type === 'move-block') {
              const targetId = act.targetBlockId || selectedBlockId;
              if (!targetId || typeof act.positionIndex !== 'number') continue;
              const idx = next.findIndex((b) => b.id === targetId);
              if (idx < 0) continue;
              const clamped = Math.max(0, Math.min(next.length - 1, act.positionIndex));
              const [item] = next.splice(idx, 1);
              next.splice(clamped, 0, item);
              nextSelectedId = item.id;
              applied++;
            }
          }
          return next;
        });
      }

      for (const act of actions) {
        if (act.type === 'select-block' && act.targetBlockId) {
          nextSelectedId = act.targetBlockId;
          applied++;
        } else if (act.type === 'update-page-style' && act.pageStylePatch) {
          handleUpdatePageStyle(act.pageStylePatch);
          applied++;
        } else if (act.type === 'create-page' && act.pageName) {
          handleCreatePage(act.pageName, 'blank');
          applied++;
        } else if (
          act.type === 'switch-code-tab' &&
          (act.codeTab === 'html' || act.codeTab === 'css' || act.codeTab === 'js')
        ) {
          setActiveTab(act.codeTab);
          applied++;
        }
      }

      if (nextSelectedId) {
        setSelectedBlockId(nextSelectedId);
      }

      return applied;
    },
    [commitBlocks, handleCreatePage, handleUpdatePageStyle, selectedBlockId]
  );

  const evaluateFlowCondition = (
    flow: LogicFlowRule,
    currentInputs: Record<string, string>
  ): boolean => {
    const cond = flow.condition;
    if (!cond || !cond.enabled) return true;
    let leftRaw = '';
    if (cond.sourceType === 'widget') {
      const targetBlk = blocks.find((b) => b.id === cond.leftId);
      if (currentInputs[cond.leftId] !== undefined) {
        leftRaw = currentInputs[cond.leftId];
      } else if (targetBlk) {
        if (targetBlk.type === 'ui-checkbox' || targetBlk.type === 'ui-checkbox-tile' || targetBlk.type === 'ui-switch-tile') {
          leftRaw = targetBlk.isExpanded ? 'true' : 'false';
        } else if (targetBlk.type === 'ui-slider') {
          leftRaw = String(targetBlk.progressValue ?? 65);
        } else if (targetBlk.type === 'ui-counter-button' || targetBlk.type === 'ui-rating-bar') {
          leftRaw = String(targetBlk.counterValue ?? 0);
        } else {
          leftRaw = targetBlk.content || '';
        }
      }
    } else {
      leftRaw = String(runtimeState.variables[cond.leftId] ?? '');
    }
    const rightRaw = String(cond.rightValue ?? '');
    if (cond.operator === 'not-empty') {
      return leftRaw.trim().length > 0 && leftRaw !== 'false' && leftRaw !== 'Unchecked' && leftRaw !== 'Disabled';
    }
    if (cond.operator === 'is-empty') {
      return leftRaw.trim().length === 0 || leftRaw === 'false' || leftRaw === 'Unchecked' || leftRaw === 'Disabled';
    }
    if (cond.operator === 'is-checked') {
      return leftRaw === 'true' || leftRaw === 'Checked' || leftRaw === 'Enabled';
    }
    if (cond.operator === 'contains') {
      return leftRaw.toLowerCase().includes(rightRaw.toLowerCase());
    }
    const ln = Number(leftRaw);
    const rn = Number(rightRaw);
    const numeric = leftRaw.trim() !== '' && rightRaw.trim() !== '' && !Number.isNaN(ln) && !Number.isNaN(rn);
    switch (cond.operator) {
      case '!=':
        return numeric ? ln !== rn : leftRaw !== rightRaw;
      case '>':
        return numeric ? ln > rn : leftRaw > rightRaw;
      case '<':
        return numeric ? ln < rn : leftRaw < rightRaw;
      case '>=':
        return numeric ? ln >= rn : leftRaw >= rightRaw;
      case '<=':
        return numeric ? ln <= rn : leftRaw <= rightRaw;
      default:
        return numeric ? ln === rn : leftRaw === rightRaw;
    }
  };

  const executeSingleLogicFlow = (
    flow: LogicFlowRule,
    currentInputs: Record<string, string>,
    liveValue = ''
  ) => {
    if (!flow.enabled) return;
    if (!evaluateFlowCondition(flow, currentInputs)) {
      appendConsoleLog('warn', `Flow "${flow.name}" skipped (IF condition false)`);
      return;
    }
    appendConsoleLog('success', `Running Flow "${flow.name}" (${flow.steps.length} steps)`);

    const runStepAt = (idx: number) => {
      if (idx >= flow.steps.length) return;
      const step = flow.steps[idx];
      const interpolated = (step.value || '').replace(/\{\{value\}\}/g, liveValue);

      if (step.action === 'delay') {
        const ms = Math.max(100, Math.min(10000, step.delayMs || 800));
        appendConsoleLog('log', `Wait ${ms}ms...`);
        window.setTimeout(() => runStepAt(idx + 1), ms);
        return;
      }

      if (step.action === 'next-page') {
        const curIdx = pages.findIndex((p) => p.id === activePageId);
        if (pages.length > 1 && curIdx >= 0) {
          const nextPg = pages[(curIdx + 1) % pages.length];
          handleSelectPage(nextPg.id);
          onToast(`Navigated to "${nextPg.name}"`, 'success');
          appendConsoleLog('success', `Next Page → /${nextPg.slug}`);
        } else {
          onToast('Add a second page in Pages to navigate to Next Page!', 'info');
        }
        return;
      }

      if (step.action === 'prev-page') {
        const curIdx = pages.findIndex((p) => p.id === activePageId);
        if (pages.length > 1 && curIdx >= 0) {
          const prevPg = pages[(curIdx - 1 + pages.length) % pages.length];
          handleSelectPage(prevPg.id);
          onToast(`Navigated to "${prevPg.name}"`, 'success');
          appendConsoleLog('success', `Previous Page → /${prevPg.slug}`);
        } else {
          onToast('Add a second page in Pages first!', 'info');
        }
        return;
      }

      if (step.action === 'navigate-page') {
        const targetPg =
          pages.find((p) => p.id === step.targetPageId) ||
          pages.find((p) => p.id !== activePageId);
        if (targetPg) {
          handleSelectPage(targetPg.id);
          onToast(`Navigated to "${targetPg.name}"`, 'success');
          appendConsoleLog('success', `Navigate → /${targetPg.slug}`);
        } else {
          onToast('Select a Target Page in the Logic Flow step.', 'info');
        }
        return;
      }

      if (step.action === 'go-back') {
        const prevId = pageHistory[pageHistory.length - 1];
        if (prevId && pages.some((p) => p.id === prevId)) {
          setPageHistory((h) => h.slice(0, -1));
          handleSelectPage(prevId, false);
          onToast('Returned to previous page', 'info');
        } else {
          onToast('No previous page in history yet.', 'info');
        }
        return;
      }

      if (step.action === 'open-url') {
        const rawUrl = interpolated.trim();
        if (rawUrl.startsWith('#')) {
          const el = document.getElementById(rawUrl.slice(1)) || document.getElementById(`sl-el-${rawUrl.slice(1)}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          onToast(`Jumped to ${rawUrl}`, 'success');
        } else if (rawUrl) {
          onToast(`Link ready: ${rawUrl}`, 'success');
        }
      } else if (step.action === 'scroll-to-block') {
        const targetBlk = blocks.find((b) => b.id === step.targetBlockId) || blocks[0];
        if (targetBlk) {
          const el = document.getElementById(`sl-el-${targetBlk.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setSelectedBlockId(targetBlk.id);
        }
      } else if (step.action === 'validate-form') {
        const targetInp = step.targetBlockId
          ? blocks.find((b) => b.id === step.targetBlockId)
          : blocks.find((b) =>
              ['ui-input', 'ui-textarea', 'ui-select', 'ui-pin-code', 'ui-checkbox', 'ui-checkbox-tile'].includes(b.type)
            );
        const valToCheck = targetInp ? currentInputs[targetInp.id] ?? '' : liveValue;
        const check = validateInputValue(valToCheck, step.validationRule || 'not-empty');
        if (!check.valid) {
          onToast(check.reason, 'error');
          appendConsoleLog('error', `Flow stopped: ${check.reason}`);
          return;
        }
        appendConsoleLog('success', `Validated: ${check.reason}`);
      } else if (step.action === 'submit-form') {
        const { fields } = collectFormFields(currentInputs);
        const summary = fields.map((i) => `${i.label}: ${i.value}`).join(' · ');
        const msg = interpolated.trim() || 'Form submitted successfully!';
        const recordData: Record<string, unknown> = {};
        fields.forEach((f) => {
          recordData[f.label] = f.value;
        });
        setRuntimeState((prev) => ({
          ...prev,
          lastSubmission: {
            timestamp: new Date().toLocaleTimeString(),
            message: msg,
            fields: fields.map((f) => ({ label: f.label, value: f.value })),
          },
          variables: {
            ...prev.variables,
            lastSubmissionCount: fields.length,
            ...(fields[0] ? { lastInput: fields[0].value } : {}),
          },
          dbCollections: {
            ...prev.dbCollections,
            submissions: [
              ...(prev.dbCollections.submissions || []),
              {
                id: `sub_${Date.now().toString(36).slice(-4)}`,
                data: recordData,
                createdAt: new Date().toLocaleTimeString(),
              },
            ],
          },
        }));
        onToast(summary ? `${msg} (${summary})` : msg, 'success');
        appendConsoleLog('success', summary ? `Submitted → ${summary}` : msg);
      } else if (step.action === 'clear-form') {
        setFormInputs({});
        setRuntimeState((prev) => ({ ...prev, lastSubmission: null }));
        onToast('Cleared all form inputs', 'info');
      } else if (step.action === 'show-toast') {
        const mappedToastType = step.toastType === 'warning' ? 'info' : (step.toastType || 'success');
        onToast(interpolated || 'Action executed!', mappedToastType);
      } else if (step.action === 'show-element' || step.action === 'hide-element') {
        const tid = step.targetBlockId || blocks.find((b) => !b.type.startsWith('logic-'))?.id;
        if (tid) {
          const hide = step.action === 'hide-element';
          setRuntimeState((prev) => ({
            ...prev,
            hiddenBlocks: { ...prev.hiddenBlocks, [tid]: hide },
          }));
          onToast(`${hide ? 'Hidden' : 'Shown'} widget`, 'info');
        }
      } else if (step.action === 'toggle-visibility') {
        const tid = step.targetBlockId || blocks.find((b) => !b.type.startsWith('logic-'))?.id;
        if (tid) {
          setRuntimeState((prev) => ({
            ...prev,
            hiddenBlocks: { ...prev.hiddenBlocks, [tid]: !prev.hiddenBlocks[tid] },
          }));
        }
      } else if (step.action === 'enable-element' || step.action === 'disable-element') {
        const tid =
          step.targetBlockId ||
          blocks.find((b) => b.type === 'ui-button' || b.type === 'ui-input')?.id;
        if (tid) {
          const dis = step.action === 'disable-element';
          setRuntimeState((prev) => ({
            ...prev,
            disabledBlocks: { ...prev.disabledBlocks, [tid]: dis },
          }));
          onToast(`${dis ? 'Disabled' : 'Enabled'} widget`, 'info');
        }
      } else if (step.action === 'change-text') {
        const tid =
          step.targetBlockId ||
          blocks.find((b) => b.type === 'ui-heading' || b.type === 'ui-paragraph')?.id ||
          blocks[0]?.id;
        if (tid) {
          const nextTxt = interpolated || 'Updated!';
          setRuntimeState((prev) => ({
            ...prev,
            textOverrides: { ...prev.textOverrides, [tid]: nextTxt },
          }));
        }
      } else if (step.action === 'set-input-value') {
        const tid =
          step.targetBlockId ||
          blocks.find((b) => b.type === 'ui-input' || b.type === 'ui-textarea' || b.type === 'ui-select')?.id;
        if (tid) {
          setFormInputs((prev) => ({ ...prev, [tid]: interpolated || '' }));
        }
      } else if (step.action === 'open-modal' || step.action === 'close-modal') {
        const modalTarget =
          blocks.find((b) => b.id === step.targetBlockId && b.type === 'ui-modal') ||
          blocks.find((b) => b.type === 'ui-modal');
        if (modalTarget) {
          setRuntimeState((prev) => ({
            ...prev,
            openModals: { ...prev.openModals, [modalTarget.id]: step.action === 'open-modal' },
          }));
        }
      } else if (step.action === 'set-variable') {
        const vn = (step.varName || 'score').trim() || 'score';
        const rawV = interpolated || liveValue || '1';
        const parsedV: string | number | boolean =
          rawV === 'true'
            ? true
            : rawV === 'false'
            ? false
            : rawV.trim() !== '' && !Number.isNaN(Number(rawV))
            ? Number(rawV)
            : rawV;
        setRuntimeState((prev) => ({
          ...prev,
          variables: { ...prev.variables, [vn]: parsedV },
        }));
      } else if (step.action === 'increment-counter') {
        const targetCounter =
          blocks.find((b) => b.id === step.targetBlockId && b.type === 'logic-counter') ||
          blocks.find((b) => b.type === 'logic-counter');
        if (targetCounter) {
          const nextVal = (targetCounter.counterValue ?? 0) + 1;
          handleUpdateBlock({
            ...targetCounter,
            counterValue: nextVal,
            content: `Clicks Registered: ${nextVal}`,
          });
        }
        setRuntimeState((prev) => ({
          ...prev,
          variables: { ...prev.variables, score: Number(prev.variables.score || 0) + 1 },
        }));
      } else if (step.action === 'save-storage') {
        const k = step.varName || 'sl_saved_data';
        const v = interpolated || liveValue || 'saved';
        try {
          window.localStorage.setItem(k, v);
          onToast(`Saved "${k}" to LocalStorage`, 'success');
        } catch {
          onToast('LocalStorage write blocked', 'error');
        }
      } else if (step.action === 'db-save') {
        const col = (step.collectionName || 'submissions').trim() || 'submissions';
        const { fields } = collectFormFields(currentInputs);
        const docPayload: Record<string, unknown> = {};
        fields.forEach((f) => {
          docPayload[f.label] = f.value;
        });
        if (Object.keys(docPayload).length === 0) {
          docPayload.value = interpolated || liveValue || 'record';
        }
        const doc = {
          id: `doc_${Date.now().toString(36).slice(-4)}`,
          data: docPayload,
          createdAt: new Date().toLocaleTimeString(),
        };
        setRuntimeState((prev) => {
          const nextRows = [...(prev.dbCollections[col] || []), doc];
          try {
            window.localStorage.setItem(`sl_db_${col}`, JSON.stringify(nextRows));
          } catch {
            // ignore
          }
          return { ...prev, dbCollections: { ...prev.dbCollections, [col]: nextRows } };
        });
        onToast(`Saved record to [${col}]`, 'success');
        appendConsoleLog('success', `Cloud DB Save [${col}/${doc.id}]`);
      } else if (step.action === 'call-api') {
        const endpoint = (step.apiUrl || '/api/v1/submit').trim();
        const method = step.httpMethod || 'POST';
        const { fields } = collectFormFields(currentInputs);
        const bodyObj = Object.fromEntries(fields.map((f) => [f.label, f.value]));
        if (/^https?:\/\//i.test(endpoint)) {
          fetch(endpoint, {
            method,
            ...(method !== 'GET' && method !== 'DELETE'
              ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyObj) }
              : {}),
          })
            .then((r) => {
              onToast(`${method} ${endpoint} → HTTP ${r.status}`, r.ok ? 'success' : 'info');
              appendConsoleLog(r.ok ? 'success' : 'warn', `${method} ${endpoint} → ${r.status}`);
            })
            .catch(() => {
              onToast(`${method} ${endpoint} → 200 OK (sandbox)`, 'info');
              appendConsoleLog('warn', `${method} ${endpoint} → sandbox fallback`);
            });
        } else {
          onToast(`${method} ${endpoint} → 200 OK`, 'success');
          appendConsoleLog('success', `${method} ${endpoint} → 200 OK`);
        }
      } else if (step.action === 'auth-logout') {
        setRuntimeState((prev) => ({
          ...prev,
          authUser: null,
          variables: { ...prev.variables, isLoggedIn: false },
        }));
        onToast('Signed out user', 'info');
      } else if (step.action === 'auth-signup' || step.action === 'auth-login') {
        const email = interpolated.trim() || currentInputs[blocks.find((b) => b.inputType === 'email')?.id || ''] || 'user@blockcraft.app';
        setRuntimeState((prev) => ({
          ...prev,
          authUser: { email, uid: `uid_${Date.now().toString(36).slice(-5)}` },
          variables: { ...prev.variables, isLoggedIn: true, userName: email.split('@')[0] },
        }));
        onToast(`${step.action === 'auth-signup' ? 'Registered' : 'Signed in'}: ${email}`, 'success');
      }

      runStepAt(idx + 1);
    };

    runStepAt(0);
  };

  const executeLogicFlowsForEvent = (
    trigger: LogicTriggerType,
    sourceBlock: CanvasBlock | null,
    currentInputs: Record<string, string>,
    liveValue = '',
    keyPressed?: string
  ): number => {
    const matching = activeLogicFlows.filter((flow) => {
      if (!flow.enabled || flow.trigger !== trigger) return false;
      if (trigger === 'when-load') return true;
      if (trigger === 'when-key') {
        return !keyPressed || (flow.triggerKey || 'Enter') === keyPressed;
      }
      if (flow.targetBlockId === 'any') return true;
      return sourceBlock ? flow.targetBlockId === sourceBlock.id : false;
    });
    matching.forEach((flow) => executeSingleLogicFlow(flow, currentInputs, liveValue));
    return matching.length;
  };

  const handleFormInputChange = (blockId: string, value: string, fireInputEvent = true) => {
    const updatedInputs = { ...formInputs, [blockId]: value };
    setFormInputs(updatedInputs);
    if (!fireInputEvent) return;

    const changedBlock = blocks.find((b) => b.id === blockId) || null;
    if (changedBlock) {
      if (
        changedBlock.type === 'ui-checkbox' ||
        changedBlock.type === 'ui-checkbox-tile' ||
        changedBlock.type === 'ui-switch-tile' ||
        changedBlock.type === 'ui-checkbox-group'
      ) {
        const isChecked =
          value === 'true' ||
          value === 'Checked' ||
          value === 'Enabled' ||
          (changedBlock.type === 'ui-checkbox-group' && value.trim().length > 0);
        executeLogicFlowsForEvent(
          isChecked ? 'when-checked' : 'when-unchecked',
          changedBlock,
          updatedInputs,
          value
        );
      }
      executeLogicFlowsForEvent('when-change', changedBlock, updatedInputs, value);
    }

    const listeners = blocks.filter((b) => {
      if (b.type !== 'logic-oninput') return false;
      const sourceMatch = b.logicConfig?.triggerSourceId || b.targetId;
      return !sourceMatch || sourceMatch === blockId;
    });
    listeners.forEach((hat) => {
      const varName = hat.logicConfig?.varName;
      if (varName) {
        setRuntimeState((rs) => ({
          ...rs,
          variables: { ...rs.variables, [varName]: value },
        }));
      }
      if (hat.action === 'validate-input') {
        const res = validateInputValue(value, hat.logicConfig?.validationRule || 'not-empty');
        appendConsoleLog(res.valid ? 'success' : 'warn', `${hat.name}: ${res.reason}`);
      } else if (hat.action) {
        const resolvedPayload = (hat.actionPayload || '').includes('{{value}}')
          ? (hat.actionPayload || '').replace(/\{\{value\}\}/g, value)
          : hat.action === 'change-text' && !hat.actionPayload
          ? value || ' '
          : hat.actionPayload;
        handleTriggerAction(
          { ...hat, actionPayload: resolvedPayload },
          updatedInputs,
          1
        );
      }
    });
  };

  // Helper to read any form input block's effective value (including dropdown/radio/checkbox defaults)
  const collectFormFields = (currentInputs: Record<string, string>) => {
    const inputBlocks = blocks.filter(
      (b) =>
        b.type === 'ui-input' ||
        b.type === 'ui-textarea' ||
        b.type === 'ui-select' ||
        b.type === 'ui-checkbox' ||
        b.type === 'ui-file-upload' ||
        b.type === 'ui-checkbox-tile' ||
        b.type === 'ui-switch-tile' ||
        b.type === 'ui-pin-code' ||
        b.type === 'ui-slider' ||
        b.type === 'ui-rating-bar' ||
        b.type === 'ui-credit-card' ||
        b.type === 'ui-counter-button' ||
        b.type === 'ui-choice-chips' ||
        b.type === 'ui-place-picker' ||
        b.type === 'ui-checkbox-group' ||
        b.type === 'ui-signature'
    );
    const fields: Array<{ id: string; label: string; value: string; hasUserEntry: boolean }> = [];
    inputBlocks.forEach((inp) => {
      const label = (inp.subtitle || inp.name || 'Field').trim();
      const rawTyped = currentInputs[inp.id];
      if (inp.type === 'ui-select') {
        const opts = parseOptionsList(inp.content, inp.options, ['Option 1', 'Option 2']);
        const val = (rawTyped !== undefined ? rawTyped : opts[0] || '').trim();
        if (val) fields.push({ id: inp.id, label, value: val, hasUserEntry: true });
      } else if (inp.type === 'ui-checkbox') {
        if (inp.controlVariant === 'radio') {
          const choices = parseOptionsList(inp.content, inp.options, ['Choice A', 'Choice B']);
          const val = (rawTyped !== undefined ? rawTyped : choices[0] || '').trim();
          if (val) fields.push({ id: inp.id, label, value: val, hasUserEntry: true });
        } else {
          const checked = rawTyped !== undefined ? rawTyped === 'true' : Boolean(inp.isExpanded);
          fields.push({
            id: inp.id,
            label,
            value: checked ? 'Yes' : 'No',
            hasUserEntry: checked || rawTyped !== undefined,
          });
        }
      } else if (inp.type === 'ui-checkbox-tile' || inp.type === 'ui-switch-tile') {
        const checked = rawTyped !== undefined ? rawTyped === 'Checked' || rawTyped === 'Enabled' : Boolean(inp.isExpanded);
        fields.push({
          id: inp.id,
          label,
          value: rawTyped || (checked ? 'Yes' : 'No'),
          hasUserEntry: true,
        });
      } else if (inp.type === 'ui-slider') {
        fields.push({
          id: inp.id,
          label,
          value: rawTyped || String(inp.progressValue ?? 65),
          hasUserEntry: true,
        });
      } else if (inp.type === 'ui-rating-bar') {
        fields.push({
          id: inp.id,
          label,
          value: rawTyped || `${inp.counterValue ?? 4} / 5 stars`,
          hasUserEntry: true,
        });
      } else if (inp.type === 'ui-counter-button') {
        fields.push({
          id: inp.id,
          label,
          value: rawTyped || String(inp.counterValue ?? 2),
          hasUserEntry: true,
        });
      } else {
        const val = (rawTyped || '').trim();
        if (val) {
          const displayVal = inp.inputType === 'password' ? '••••••' : val;
          fields.push({ id: inp.id, label, value: displayVal, hasUserEntry: true });
        }
      }
    });
    return { inputBlocks, fields };
  };

  // Reactive Logic, Navigation, Data, Storage, Cloud DB, Auth, Events & DOM Executor
  const handleTriggerAction = (
    sourceBlock: CanvasBlock,
    passedFormValues?: Record<string, string>,
    recursionDepth = 0
  ) => {
    if (recursionDepth > 2) return;
    const currentInputs = passedFormValues ?? formInputs;
    const cfg = sourceBlock.logicConfig;

    const runAction = (action: BlockActionType, actor: CanvasBlock) => {
      const aCfg = actor.logicConfig;

      if (action === 'navigate-page') {
        const targetPage =
          pages.find((p) => p.id === actor.targetPageId) ||
          pages.find((p) => p.id !== activePage?.id);
        if (targetPage) {
          handleSelectPage(targetPage.id);
          onToast(`Navigated to "${targetPage.name}"`, 'success');
          appendConsoleLog('log', `Navigated to /${targetPage.slug}`);
        } else {
          onToast('Add another page or select a Target Page in the JavaScript tab!', 'info');
        }
        return;
      }

      if (action === 'go-back') {
        const prevId = pageHistory[pageHistory.length - 1];
        if (prevId && pages.some((p) => p.id === prevId)) {
          setPageHistory((h) => h.slice(0, -1));
          handleSelectPage(prevId, false);
          onToast('Returned to previous page', 'info');
        } else {
          onToast('No previous page in history yet.', 'info');
        }
        return;
      }

      if (action === 'scroll-to-block') {
        const targetBlock =
          blocks.find((b) => b.id === actor.targetId) ||
          blocks.find((b) => b.id !== actor.id);
        if (targetBlock) {
          const el = document.getElementById(`sl-el-${targetBlock.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setSelectedBlockId(targetBlock.id);
          onToast(`Scrolled to "${targetBlock.name}"`, 'success');
        } else {
          onToast('Select a Target Block to scroll to in the JavaScript tab.', 'info');
        }
        return;
      }

      if (action === 'open-modal' || action === 'close-modal') {
        const modalTarget =
          blocks.find((b) => b.id === actor.targetId && b.type === 'ui-modal') ||
          blocks.find((b) => b.type === 'ui-modal');
        if (modalTarget) {
          const open = action === 'open-modal';
          setRuntimeState((prev) => ({
            ...prev,
            openModals: { ...prev.openModals, [modalTarget.id]: open },
          }));
          appendConsoleLog('log', `${open ? 'Opened' : 'Closed'} modal "${modalTarget.name}"`);
        } else {
          onToast('Add a Modal / Drawer block to wire this action.', 'info');
        }
        return;
      }

      if (action === 'show-element' || action === 'hide-element') {
        const targetId = actor.targetId || blocks.find((b) => b.id !== actor.id)?.id;
        if (targetId) {
          const hide = action === 'hide-element';
          setRuntimeState((prev) => ({
            ...prev,
            hiddenBlocks: { ...prev.hiddenBlocks, [targetId]: hide },
          }));
          onToast(`${hide ? 'Hid' : 'Shown'} target element`, 'info');
        }
        return;
      }

      if (action === 'change-text') {
        const targetId = actor.targetId || blocks.find((b) => b.id !== actor.id)?.id;
        if (targetId) {
          const nextText = actor.actionPayload || 'Updated Text!';
          setRuntimeState((prev) => ({
            ...prev,
            textOverrides: { ...prev.textOverrides, [targetId]: nextText },
          }));
          onToast(`Updated element text -> "${nextText}"`, 'success');
        }
        return;
      }

      if (action === 'set-style') {
        const targetId = actor.targetId || blocks.find((b) => b.id !== actor.id)?.id;
        if (targetId) {
          const prop = aCfg?.styleProp || 'backgroundColor';
          const val = aCfg?.styleValue || '#312e81';
          setRuntimeState((prev) => ({
            ...prev,
            styleOverrides: {
              ...prev.styleOverrides,
              [targetId]: { ...(prev.styleOverrides[targetId] || {}), [prop]: val },
            },
          }));
          onToast(`Applied style ${prop}: ${val}`, 'success');
        }
        return;
      }

      if (action === 'add-class' || action === 'remove-class') {
        const targetId = actor.targetId || blocks.find((b) => b.id !== actor.id)?.id;
        const cls = (aCfg?.cssClass || 'ring-2 ring-emerald-400').trim();
        if (targetId && cls) {
          setRuntimeState((prev) => {
            const existing = prev.extraClasses[targetId] || [];
            const next =
              action === 'add-class'
                ? Array.from(new Set([...existing, cls]))
                : existing.filter((c) => c !== cls);
            return { ...prev, extraClasses: { ...prev.extraClasses, [targetId]: next } };
          });
          onToast(`${action === 'add-class' ? 'Added' : 'Removed'} class "${cls}"`, 'info');
        }
        return;
      }

      if (action === 'toggle-disabled') {
        const targetId = actor.targetId || blocks.find((b) => b.type === 'ui-button')?.id;
        if (targetId) {
          setRuntimeState((prev) => ({
            ...prev,
            disabledBlocks: {
              ...prev.disabledBlocks,
              [targetId]: !prev.disabledBlocks[targetId],
            },
          }));
          onToast('Toggled target button disabled state', 'info');
        }
        return;
      }

      if (action === 'clear-form') {
        setFormInputs({});
        setRuntimeState((prev) => ({ ...prev, lastSubmission: null }));
        onToast('Cleared all form inputs', 'info');
        appendConsoleLog('log', 'Form inputs cleared');
        return;
      }

      if (action === 'validate-input') {
        const targetInp =
          blocks.find((b) => b.id === actor.targetId) ||
          blocks.find(
            (b) =>
              b.type === 'ui-input' ||
              b.type === 'ui-textarea' ||
              b.type === 'ui-select' ||
              b.type === 'ui-checkbox'
          );
        const val = targetInp ? currentInputs[targetInp.id] || '' : '';
        const check = validateInputValue(val, aCfg?.validationRule || 'not-empty');
        onToast(check.reason, check.valid ? 'success' : 'error');
        appendConsoleLog(check.valid ? 'success' : 'error', `Validation: ${check.reason}`);
        return;
      }

      if (action === 'get-input-value') {
        const targetInp =
          blocks.find((b) => b.id === actor.targetId) ||
          blocks.find(
            (b) =>
              b.type === 'ui-input' ||
              b.type === 'ui-textarea' ||
              b.type === 'ui-select' ||
              b.type === 'ui-checkbox'
          );
        const val = targetInp ? currentInputs[targetInp.id] || '' : '';
        const varName = aCfg?.varName || 'inputValue';
        setRuntimeState((prev) => ({
          ...prev,
          variables: { ...prev.variables, [varName]: val },
        }));
        onToast(`Read ${varName} = "${val}"`, 'info');
        appendConsoleLog('log', `Get Input => ${varName} = "${val}"`);
        return;
      }

      if (action === 'set-input-value') {
        const targetInp =
          blocks.find((b) => b.id === actor.targetId) ||
          blocks.find(
            (b) =>
              b.type === 'ui-input' ||
              b.type === 'ui-textarea' ||
              b.type === 'ui-select'
          );
        if (targetInp) {
          const newVal = actor.actionPayload || 'Hello from BlockCraft Studio';
          setFormInputs((prev) => ({ ...prev, [targetInp.id]: newVal }));
          onToast(`Set input value to "${newVal}"`, 'success');
        }
        return;
      }

      if (action === 'submit-form') {
        const { inputBlocks, fields } = collectFormFields(currentInputs);
        const anyMeaningful = fields.some((f) => f.hasUserEntry);
        if (inputBlocks.length > 0 && fields.length === 0) {
          onToast('Fill in at least one form input above, then click Submit!', 'info');
          return;
        }
        const summary = fields.map((i) => `${i.label}: ${i.value}`).join(' · ');
        const customMsg = (actor.actionPayload || '').trim();
        const msg = customMsg || (anyMeaningful ? 'Form submitted successfully!' : 'Submitted form values!');
        const snapshot = {
          timestamp: new Date().toLocaleTimeString(),
          message: msg,
          fields: fields.map((f) => ({ label: f.label, value: f.value })),
        };
        const recordData: Record<string, unknown> = {};
        fields.forEach((f) => {
          recordData[f.label] = f.value;
        });
        setRuntimeState((prev) => ({
          ...prev,
          lastSubmission: snapshot,
          variables: {
            ...prev.variables,
            lastSubmissionCount: fields.length,
            ...(fields[0] ? { lastInput: fields[0].value } : {}),
          },
          dbCollections: {
            ...prev.dbCollections,
            submissions: [
              ...(prev.dbCollections.submissions || []),
              {
                id: `sub_${Date.now().toString(36).slice(-4)}`,
                data: recordData,
                createdAt: snapshot.timestamp,
              },
            ],
          },
        }));
        onToast(summary ? `${msg} (${summary})` : msg, 'success');
        appendConsoleLog('success', summary ? `Form Submitted → ${summary}` : msg);

        // Execute any "When Form is Submitted" Hat blocks
        if (actor.type !== 'logic-onsubmit') {
          blocks
            .filter((b) => b.type === 'logic-onsubmit')
            .forEach((hat) => {
              if (hat.action && hat.action !== 'submit-form') {
                handleTriggerAction(hat, currentInputs, recursionDepth + 1);
              } else {
                appendConsoleLog(
                  'success',
                  `OnSubmit Hat "${hat.name}": ${hat.actionPayload || 'Form handled!'}`
                );
              }
            });
        }
        return;
      }

      if (action === 'show-confirm') {
        pendingConfirmActionRef.current = () => {
          onToast('Confirmed!', 'success');
          appendConsoleLog('success', `Confirmed dialog: ${actor.actionPayload || 'OK'}`);
        };
        setConfirmDialog({
          id: actor.id,
          title: actor.name || 'Confirm Action',
          message: actor.actionPayload || 'Are you sure you want to proceed?',
          confirmLabel: 'Confirm',
        });
        return;
      }

      if (action === 'copy-clipboard') {
        const text = actor.actionPayload || projectName;
        navigator.clipboard?.writeText(text);
        onToast(`Copied "${text}" to clipboard!`, 'success');
        appendConsoleLog('log', `Clipboard copied: ${text}`);
        return;
      }

      if (action === 'console-log') {
        const msg = actor.actionPayload || `Event from ${actor.name}`;
        appendConsoleLog('log', msg);
        onToast(`Logged: ${msg}`, 'info');
        return;
      }

      if (action === 'open-url') {
        const rawUrl = (actor.actionPayload || '').trim();
        if (!rawUrl) {
          onToast('Enter a URL (e.g. https://... or mailto:...) in the JavaScript tab.', 'info');
          return;
        }
        if (rawUrl.startsWith('#')) {
          const targetId = rawUrl.slice(1);
          const el =
            document.getElementById(targetId) || document.getElementById(`sl-el-${targetId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          onToast(`Jumped to ${rawUrl}`, 'success');
        } else {
          onToast(`Link ready: ${rawUrl} (navigates when exported)`, 'success');
        }
        return;
      }

      if (action === 'set-variable') {
        const varName = aCfg?.varName || 'score';
        const rawVal = aCfg?.varValue || actor.actionPayload || '1';
        const parsedVal: string | number | boolean =
          rawVal === 'true'
            ? true
            : rawVal === 'false'
            ? false
            : rawVal.trim() !== '' && !Number.isNaN(Number(rawVal))
            ? Number(rawVal)
            : rawVal;
        setRuntimeState((prev) => ({
          ...prev,
          variables: { ...prev.variables, [varName]: parsedVal },
        }));
        onToast(`Set ${varName} = ${parsedVal}`, 'success');
        appendConsoleLog('success', `Set ${varName} = ${parsedVal}`);
        return;
      }

      if (action === 'toggle-boolean') {
        const varName = aCfg?.varName || 'isLoggedIn';
        setRuntimeState((prev) => {
          const nextBool = !Boolean(prev.variables[varName]);
          onToast(`Toggled ${varName} = ${nextBool}`, 'info');
          return { ...prev, variables: { ...prev.variables, [varName]: nextBool } };
        });
        return;
      }

      if (action === 'list-add') {
        const lName = aCfg?.listName || 'tasks';
        const item = aCfg?.varValue || actor.actionPayload || 'New Task';
        setRuntimeState((prev) => ({
          ...prev,
          lists: { ...prev.lists, [lName]: [...(prev.lists[lName] || []), item] },
        }));
        onToast(`Added "${item}" to ${lName}`, 'success');
        return;
      }

      if (action === 'list-remove') {
        const lName = aCfg?.listName || 'tasks';
        setRuntimeState((prev) => ({
          ...prev,
          lists: { ...prev.lists, [lName]: (prev.lists[lName] || []).slice(0, -1) },
        }));
        onToast(`Removed last item from ${lName}`, 'info');
        return;
      }

      if (action === 'save-storage') {
        const key = aCfg?.storageKey || 'sl_user_data';
        const val = actor.actionPayload || aCfg?.varValue || 'saved';
        try {
          window.localStorage.setItem(key, val);
          onToast(`Saved "${key}" to LocalStorage!`, 'success');
        } catch {
          onToast('LocalStorage write blocked.', 'error');
        }
        return;
      }

      if (action === 'increment-counter') {
        const targetCounter =
          blocks.find((b) => b.id === actor.targetId && b.type === 'logic-counter') ||
          blocks.find((b) => b.type === 'logic-counter');
        if (targetCounter) {
          const nextVal = (targetCounter.counterValue ?? 0) + 1;
          handleUpdateBlock({
            ...targetCounter,
            counterValue: nextVal,
            content: `Clicks Registered: ${nextVal}`,
          });
          setRuntimeState((prev) => ({
            ...prev,
            variables: { ...prev.variables, score: nextVal },
          }));
          onToast(`Triggered "${targetCounter.name}" → ${nextVal}`, 'success');
          appendConsoleLog('success', `Counter "${targetCounter.name}" => ${nextVal}`);
        } else {
          onToast(
            'Counter +1 ready! Add a Click Counter or pick another action in JavaScript tab.',
            'info'
          );
        }
        return;
      }

      if (action === 'toggle-visibility') {
        const toggleTarget =
          blocks.find((b) => b.id === actor.targetId) ||
          blocks.find((b) => b.type === 'logic-toggle' || b.type === 'ui-accordion');
        if (toggleTarget) {
          handleUpdateBlock({ ...toggleTarget, isExpanded: !toggleTarget.isExpanded });
          onToast(`Toggled "${toggleTarget.name}" state`, 'info');
        } else {
          onToast('Add a Toggle Switch or FAQ Accordion to wire this action.', 'info');
        }
        return;
      }

      if (action === 'call-api') {
        const endpoint = (actor.apiEndpoint || '/api/v1/metrics').trim();
        const method = actor.httpMethod || 'GET';
        if (/^https?:\/\//i.test(endpoint)) {
          fetch(endpoint, {
            method,
            ...(method !== 'GET' && method !== 'DELETE' && actor.requestBody
              ? { headers: { 'Content-Type': 'application/json' }, body: actor.requestBody }
              : {}),
          })
            .then((r) => {
              const msg = `${method} ${endpoint} -> HTTP ${r.status}`;
              onToast(msg, r.ok ? 'success' : 'info');
              appendConsoleLog(r.ok ? 'success' : 'warn', msg);
            })
            .catch(() => {
              const msg = `${method} ${endpoint} -> 200 OK (sandbox fallback)`;
              onToast(msg, 'info');
              appendConsoleLog('warn', msg);
            });
        } else {
          const msg = `${method} ${endpoint} -> 200 OK`;
          onToast(msg, 'success');
          appendConsoleLog('success', msg);
        }
        return;
      }

      const msg = actor.actionPayload || `Executed "${actor.name}"`;
      onToast(msg, 'info');
      appendConsoleLog('log', msg);
    };

    // 1. Direct Logic / Data / Backend Block Execution
    if (sourceBlock.type === 'logic-if') {
      const ok = evaluateLogicCondition(cfg, runtimeState.variables, currentInputs, blocks);
      const msg = ok
        ? cfg?.thenMessage || 'Condition is TRUE!'
        : cfg?.elseMessage || 'Condition is FALSE.';
      onToast(msg, ok ? 'success' : 'info');
      appendConsoleLog(
        ok ? 'success' : 'warn',
        `IF [${cfg?.leftOperand || 'score'} ${cfg?.operator || '>='} ${
          cfg?.rightOperand || '10'
        }] => ${ok ? 'TRUE' : 'FALSE'}`
      );
      if (ok && sourceBlock.action) {
        runAction(sourceBlock.action, sourceBlock);
      }
      return;
    }

    if (sourceBlock.type === 'logic-loop') {
      const mode = cfg?.loopMode || 'repeat';
      if (mode === 'foreach') {
        const list = runtimeState.lists[cfg?.listName || 'tasks'] || [];
        list.forEach((item, idx) => appendConsoleLog('log', `ForEach[${idx}]: ${item}`));
        onToast(`Iterated ${list.length} items in list "${cfg?.listName || 'tasks'}"`, 'success');
      } else {
        let count = Math.min(50, Math.max(1, cfg?.repeatCount ?? 5));
        if (mode === 'while') {
          let i = 0;
          const simVars = { ...runtimeState.variables };
          while (
            i < Math.min(25, count) &&
            evaluateLogicCondition(cfg, simVars, currentInputs, blocks)
          ) {
            i += 1;
            simVars.score = Number(simVars.score || 0) + 1;
          }
          count = i;
        }
        setRuntimeState((prev) => ({
          ...prev,
          variables: {
            ...prev.variables,
            score: Number(prev.variables.score || 0) + count,
          },
        }));
        const targetCounter = blocks.find((b) => b.type === 'logic-counter');
        if (targetCounter && count > 0) {
          const nextVal = (targetCounter.counterValue ?? 0) + count;
          handleUpdateBlock({
            ...targetCounter,
            counterValue: nextVal,
            content: `Clicks Registered: ${nextVal}`,
          });
        }
        appendConsoleLog('success', `Loop (${mode}) ran ${count} iterations (+${count} score)`);
        onToast(`Loop executed ${count} times!`, 'success');
      }
      if (sourceBlock.action) {
        runAction(sourceBlock.action, sourceBlock);
      }
      return;
    }

    if (sourceBlock.type === 'logic-variable') {
      const vName = (cfg?.varName || 'score').trim() || 'score';
      const op = cfg?.varOp || 'set';
      const rawVal = cfg?.varValue ?? '10';
      setRuntimeState((prev) => {
        const cur = prev.variables[vName];
        let nextVal: string | number | boolean = rawVal;
        if (op === 'toggle') {
          nextVal = !Boolean(cur);
        } else if (op === 'change') {
          nextVal = (Number(cur) || 0) + (Number(rawVal) || 1);
        } else {
          if (rawVal === 'true') nextVal = true;
          else if (rawVal === 'false') nextVal = false;
          else if (rawVal.trim() !== '' && !Number.isNaN(Number(rawVal))) nextVal = Number(rawVal);
        }
        appendConsoleLog('success', `Var ${vName} = ${JSON.stringify(nextVal)}`);
        onToast(`Variable ${vName} = ${JSON.stringify(nextVal)}`, 'success');
        return { ...prev, variables: { ...prev.variables, [vName]: nextVal } };
      });
      return;
    }

    if (sourceBlock.type === 'logic-list') {
      const lName = (cfg?.listName || 'tasks').trim() || 'tasks';
      const op = cfg?.listOp || 'add';
      const itemVal = (cfg?.varValue || 'New Item').trim();
      setRuntimeState((prev) => {
        const existing = [...(prev.lists[lName] || [])];
        if (op === 'create') {
          const seeded = itemVal ? itemVal.split(',').map((s) => s.trim()).filter(Boolean) : [];
          appendConsoleLog('log', `Created list [${lName}] (${seeded.length} items)`);
          onToast(`Created list "${lName}"`, 'success');
          return { ...prev, lists: { ...prev.lists, [lName]: seeded } };
        }
        if (op === 'remove') {
          const idx = Math.max(0, Math.min(existing.length - 1, cfg?.listIndex ?? existing.length - 1));
          const removed = existing.splice(idx, 1);
          onToast(`Removed "${removed[0] || 'item'}" from ${lName}`, 'info');
          appendConsoleLog('log', `Removed index ${idx} from list [${lName}]`);
          return { ...prev, lists: { ...prev.lists, [lName]: existing } };
        }
        if (op === 'get') {
          const idx = cfg?.listIndex ?? 0;
          const got = existing[idx] ?? '(empty)';
          onToast(`${lName}[${idx}] = "${got}"`, 'info');
          appendConsoleLog('log', `Get ${lName}[${idx}] => ${got}`);
          return prev;
        }
        if (op === 'length') {
          onToast(`Length of ${lName} = ${existing.length}`, 'info');
          appendConsoleLog('log', `Length(${lName}) = ${existing.length}`);
          return prev;
        }
        existing.push(itemVal);
        onToast(`Added "${itemVal}" to ${lName} (${existing.length})`, 'success');
        appendConsoleLog('success', `Added "${itemVal}" to list [${lName}]`);
        return { ...prev, lists: { ...prev.lists, [lName]: existing } };
      });
      return;
    }

    if (sourceBlock.type === 'logic-object') {
      try {
        const parsed = JSON.parse(cfg?.varValue || '{"name":"BlockCraft Studio"}');
        const key = (cfg?.objectKey || 'name').trim();
        const op = cfg?.objectOp || 'get-prop';
        if (op === 'stringify') {
          const str = JSON.stringify(parsed);
          appendConsoleLog('log', `JSON.stringify => ${str}`);
          onToast(`Stringified JSON (${str.length} chars)`, 'info');
        } else {
          const extracted = parsed?.[key];
          appendConsoleLog('success', `Object["${key}"] => ${JSON.stringify(extracted)}`);
          onToast(`Property "${key}": ${JSON.stringify(extracted)}`, 'success');
        }
      } catch {
        onToast('Invalid JSON string inside Object block.', 'error');
        appendConsoleLog('error', 'Failed to parse JSON payload');
      }
      return;
    }

    if (sourceBlock.type === 'logic-math-text') {
      const result = evaluateMathTextOperation(cfg, runtimeState.variables);
      setRuntimeState((prev) => ({
        ...prev,
        variables: { ...prev.variables, lastResult: result },
      }));
      appendConsoleLog('success', `Math/Text (${cfg?.mathTextOp || 'random'}) => ${result}`);
      onToast(`Computed result: ${result}`, 'success');
      return;
    }

    if (sourceBlock.type === 'backend-storage') {
      const key = cfg?.storageKey || 'sl_user_data';
      const op = cfg?.storageOp || 'save';
      try {
        if (op === 'load') {
          const loaded = window.localStorage.getItem(key);
          onToast(`LocalStorage["${key}"] = ${loaded ?? '(empty)'}`, 'info');
          appendConsoleLog('log', `LocalStorage GET ${key} => ${loaded ?? 'null'}`);
        } else if (op === 'remove') {
          window.localStorage.removeItem(key);
          onToast(`Removed LocalStorage key "${key}"`, 'info');
          appendConsoleLog('warn', `LocalStorage REMOVE ${key}`);
        } else {
          const val = cfg?.varValue || 'Saved from BlockCraft Studio';
          window.localStorage.setItem(key, val);
          onToast(`Saved "${key}" to LocalStorage!`, 'success');
          appendConsoleLog('success', `LocalStorage SET ${key} = "${val}"`);
        }
      } catch {
        onToast('LocalStorage unavailable in sandboxed mode.', 'error');
      }
      return;
    }

    if (sourceBlock.type === 'backend-db') {
      const col = (cfg?.collectionName || 'users').trim() || 'users';
      const op = cfg?.dbOp || 'save';
      const storeKey = `sl_db_${col}`;
      setRuntimeState((prev) => {
        let docs = [...(prev.dbCollections[col] || [])];
        if (docs.length === 0) {
          try {
            const persisted = window.localStorage.getItem(storeKey);
            if (persisted) {
              const parsed = JSON.parse(persisted);
              if (Array.isArray(parsed)) docs = parsed;
            }
          } catch {
            // ignore storage errors
          }
        }
        if (op === 'get') {
          onToast(`Fetched ${docs.length} records from [${col}]`, 'info');
          appendConsoleLog('log', `DB GET [${col}] => ${docs.length} docs`);
          return { ...prev, dbCollections: { ...prev.dbCollections, [col]: docs } };
        }
        if (op === 'delete') {
          docs.pop();
          try {
            window.localStorage.setItem(storeKey, JSON.stringify(docs));
          } catch {
            // ignore
          }
          onToast(`Deleted latest record from [${col}] (${docs.length} left)`, 'info');
          appendConsoleLog('warn', `DB DELETE from [${col}]`);
          return { ...prev, dbCollections: { ...prev.dbCollections, [col]: docs } };
        }
        let parsedData: Record<string, unknown> = { note: cfg?.varValue || 'Record' };
        try {
          parsedData = JSON.parse(cfg?.varValue || '{"name":"Creator"}');
        } catch {
          // keep fallback object
        }
        const doc = {
          id: `doc_${Date.now().toString(36).slice(-4)}`,
          data: parsedData,
          createdAt: new Date().toLocaleTimeString(),
        };
        docs.push(doc);
        try {
          window.localStorage.setItem(storeKey, JSON.stringify(docs));
        } catch {
          // ignore
        }
        onToast(`Saved doc ${doc.id} to [${col}]!`, 'success');
        appendConsoleLog('success', `DB SAVE [${col}/${doc.id}]`);
        return { ...prev, dbCollections: { ...prev.dbCollections, [col]: docs } };
      });
      return;
    }

    if (sourceBlock.type === 'backend-auth') {
      const op = cfg?.authOp || 'login';
      const email = (cfg?.varValue || 'creator@blockcraft.app').trim();
      if (op === 'logout') {
        setRuntimeState((prev) => ({
          ...prev,
          authUser: null,
          variables: { ...prev.variables, isLoggedIn: false },
        }));
        onToast('Signed out user session.', 'info');
        appendConsoleLog('warn', 'Auth Logout completed');
      } else if (op === 'current-user') {
        const msg = runtimeState.authUser
          ? `Current User: ${runtimeState.authUser.email}`
          : 'No user signed in';
        onToast(msg, 'info');
        appendConsoleLog('log', msg);
      } else {
        setRuntimeState((prev) => ({
          ...prev,
          authUser: { email, uid: `uid_${Date.now().toString(36).slice(-5)}` },
          variables: { ...prev.variables, isLoggedIn: true, userName: email.split('@')[0] },
        }));
        onToast(`${op === 'signup' ? 'Registered' : 'Logged in'} as ${email}`, 'success');
        appendConsoleLog('success', `Auth ${op} => ${email}`);
      }
      return;
    }

    if (sourceBlock.type === 'backend-device') {
      const op = cfg?.deviceOp || 'gps';
      if (op === 'vibrate') {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([120, 60, 120]);
        }
        onToast('Device vibration triggered!', 'success');
        appendConsoleLog('log', 'Device API: vibrate([120,60,120])');
      } else if (op === 'camera') {
        onToast('Camera permission check ready (uses MediaDevices API on export).', 'info');
        appendConsoleLog('log', 'Device API: camera stream check');
      } else {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const coords = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
              onToast(`GPS Location: ${coords}`, 'success');
              appendConsoleLog('success', `GPS => ${coords}`);
            },
            () => {
              onToast('GPS Demo Location: 6.9271, 79.8612 (Colombo)', 'info');
              appendConsoleLog('warn', 'GPS permission denied -> simulated Colombo coordinates');
            },
            { timeout: 3500 }
          );
        } else {
          onToast('GPS Demo Location: 6.9271, 79.8612 (Colombo)', 'info');
        }
      }
      return;
    }

    if (
      sourceBlock.type === 'backend-fetch' ||
      sourceBlock.type === 'backend-flask' ||
      sourceBlock.type === 'backend-blockly'
    ) {
      runAction('call-api', sourceBlock);
      return;
    }

    // 2. Hat / Event Blocks (run configured action, or fallback to event toast/log)
    if (
      sourceBlock.type === 'logic-onload' ||
      sourceBlock.type === 'logic-click' ||
      sourceBlock.type === 'logic-oninput' ||
      sourceBlock.type === 'logic-onsubmit' ||
      sourceBlock.type === 'logic-onkey' ||
      sourceBlock.type === 'logic-timer' ||
      sourceBlock.type === 'logic-feedback'
    ) {
      if (sourceBlock.logicConfig?.varName && sourceBlock.type === 'logic-onload') {
        const val = sourceBlock.logicConfig.varValue ?? 'true';
        setRuntimeState((prev) => ({
          ...prev,
          variables: { ...prev.variables, [sourceBlock.logicConfig!.varName!]: val },
        }));
      }
      if (sourceBlock.action) {
        runAction(sourceBlock.action, sourceBlock);
      } else {
        const msg = sourceBlock.actionPayload || `Event "${sourceBlock.name}" executed!`;
        onToast(msg, 'info');
        appendConsoleLog('success', `${sourceBlock.type}: ${msg}`);
      }
      return;
    }

    // 3. Fire matching Non-Visual Backend Logic Flows for clicks & form submissions
    let backendFlowsTriggered = 0;
    if (sourceBlock.type === 'ui-form') {
      backendFlowsTriggered += executeLogicFlowsForEvent('when-submit', sourceBlock, currentInputs, 'submitted');
    } else if (
      sourceBlock.type === 'ui-button' ||
      sourceBlock.type === 'ui-icon-button' ||
      sourceBlock.type === 'ui-fab' ||
      sourceBlock.type === 'ui-list-tile'
    ) {
      backendFlowsTriggered += executeLogicFlowsForEvent('when-click', sourceBlock, currentInputs);
      if (sourceBlock.action === 'submit-form') {
        backendFlowsTriggered += executeLogicFlowsForEvent('when-submit', sourceBlock, currentInputs, 'submitted');
      }
    }

    // 4. Standard Button / Link Auto-Smart Action Wiring
    if (backendFlowsTriggered > 0 && !sourceBlock.action) {
      // Backend logic flow already handled this interaction cleanly without fallback noise.
    } else {
      const hasCounter = blocks.some((b) => b.type === 'logic-counter');
      const { inputBlocks, fields } = collectFormFields(currentInputs);
      const hasFilled = fields.some((f) => f.hasUserEntry);
      const resolvedAction: BlockActionType =
        sourceBlock.action ||
        (hasFilled
          ? 'submit-form'
          : hasCounter
          ? 'increment-counter'
          : inputBlocks.length > 0
          ? 'submit-form'
          : 'increment-counter');

      runAction(resolvedAction, sourceBlock);
    }

    // 5. Fire matching "When Button is Clicked" Hat blocks
    if (sourceBlock.type === 'ui-button') {
      blocks
        .filter((b) => {
          if (b.type !== 'logic-click') return false;
          const srcMatch = b.logicConfig?.triggerSourceId || b.targetId;
          return !srcMatch || srcMatch === sourceBlock.id;
        })
        .forEach((hat) => {
          appendConsoleLog(
            'success',
            `OnClick Hat "${hat.name}" triggered by "${sourceBlock.name}"`
          );
          if (hat.action) {
            handleTriggerAction(hat, currentInputs, recursionDepth + 1);
          } else if (hat.actionPayload && !sourceBlock.actionPayload) {
            onToast(hat.actionPayload, 'info');
          }
        });
    }
  };

  // Keep a ref to latest trigger handler & blocks so keyboard / timer / onload effects execute cleanly
  const latestActionRef = useRef(handleTriggerAction);
  latestActionRef.current = handleTriggerAction;
  const latestBlocksRef = useRef(blocks);
  latestBlocksRef.current = blocks;
  const latestInputsRef = useRef(formInputs);
  latestInputsRef.current = formInputs;
  const latestLogicFlowTriggerRef = useRef(executeLogicFlowsForEvent);
  latestLogicFlowTriggerRef.current = executeLogicFlowsForEvent;

  // Keyboard listener for logic-onkey hat blocks & non-visual backend key flows
  useEffect(() => {
    const keyHats = blocks.filter((b) => b.type === 'logic-onkey');
    const hasKeyFlows = activeLogicFlows.some((f) => f.enabled && f.trigger === 'when-key');
    if (keyHats.length === 0 && !hasKeyFlows) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      const normalized = e.key === ' ' ? 'Space' : e.key;
      if ((tag === 'input' || tag === 'textarea' || tag === 'select') && normalized === 'Space') {
        return;
      }
      keyHats.forEach((hat) => {
        if ((hat.triggerKey || 'Enter') === normalized) {
          e.preventDefault();
          latestActionRef.current(hat, latestInputsRef.current, 1);
        }
      });
      if (hasKeyFlows && (normalized === 'Enter' || normalized === 'Space' || normalized === 'Escape')) {
        latestLogicFlowTriggerRef.current('when-key', null, latestInputsRef.current, normalized, normalized);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [blocks, activeLogicFlows]);

  // Active Countdown Timer Engine for logic-timer blocks
  const hasActiveTimers = Object.values(runningTimers).some(Boolean);
  useEffect(() => {
    if (!hasActiveTimers) return;
    const interval = window.setInterval(() => {
      const finishedIds: string[] = [];
      commitBlocks(
        (prev) =>
          prev.map((blk) => {
            if (blk.type !== 'logic-timer' || !runningTimers[blk.id]) return blk;
            const current = blk.counterValue ?? 10;
            if (current <= 1) {
              finishedIds.push(blk.id);
              return { ...blk, counterValue: 0 };
            }
            return { ...blk, counterValue: current - 1 };
          }),
        false
      );
      if (finishedIds.length > 0) {
        setRunningTimers((prev) => {
          const next = { ...prev };
          finishedIds.forEach((id) => {
            next[id] = false;
          });
          return next;
        });
        finishedIds.forEach((id) => {
          const blk = latestBlocksRef.current.find((b) => b.id === id);
          if (blk) {
            appendConsoleLog('success', `Timer "${blk.name}" completed!`);
            if (blk.action) {
              latestActionRef.current(blk, latestInputsRef.current, 1);
            } else {
              onToast(blk.actionPayload || `Timer "${blk.name}" finished!`, 'success');
            }
          }
        });
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [hasActiveTimers, runningTimers, commitBlocks, appendConsoleLog, onToast]);

  // Execute "When Page Loads" hat blocks & non-visual backend flows when navigating to a page
  useEffect(() => {
    const loadHats = latestBlocksRef.current.filter((b) => b.type === 'logic-onload');
    loadHats.forEach((hat) => {
      appendConsoleLog('log', `Page "${activePage?.name || 'Home'}" loaded -> ${hat.name}`);
      if (hat.logicConfig?.varName) {
        const val = hat.logicConfig.varValue ?? 'true';
        setRuntimeState((prev) => ({
          ...prev,
          variables: { ...prev.variables, [hat.logicConfig!.varName!]: val },
        }));
      }
      if (hat.action && hat.action !== 'navigate-page' && hat.action !== 'go-back') {
        latestActionRef.current(hat, latestInputsRef.current, 1);
      }
    });
    latestLogicFlowTriggerRef.current('when-load', null, latestInputsRef.current);
  }, [activePageId]);

  const handleTriggerNavLink = (navBlock: CanvasBlock, link: NavbarLinkItem) => {
    if (link.action === 'navigate-page') {
      const targetPage =
        pages.find((p) => p.id === link.targetPageId) ||
        pages.find((p) => p.name.toLowerCase() === link.label.toLowerCase());
      if (targetPage) {
        handleSelectPage(targetPage.id);
        onToast(`Navigated to "${targetPage.name}"`, 'success');
      } else {
        setSelectedBlockId(navBlock.id);
        onToast(`"${link.label}" — select a Target Page in the JavaScript tab.`, 'info');
      }
      return;
    }

    if (link.action === 'scroll-to-block') {
      const targetBlock = blocks.find((b) => b.id === link.targetBlockId);
      if (targetBlock) {
        const el = document.getElementById(`sl-el-${targetBlock.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setSelectedBlockId(targetBlock.id);
        onToast(`Scrolled to "${targetBlock.name}"`, 'success');
      } else {
        setSelectedBlockId(navBlock.id);
        onToast(`"${link.label}" — pick a section to scroll to in JavaScript tab.`, 'info');
      }
      return;
    }

    if (link.action === 'open-url') {
      const url = (link.url || '').trim();
      onToast(
        url
          ? `Navbar Link "${link.label}" → ${url}`
          : `Enter a URL for "${link.label}" in the JavaScript tab.`,
        url ? 'success' : 'info'
      );
      return;
    }

    setSelectedBlockId(navBlock.id);
    onToast(
      link.message || `Clicked "${link.label}" — wire this navbar button in JavaScript tab!`,
      'info'
    );
  };

  const handleRunSimulation = () => {
    const onLoadHats = blocks.filter((b) => b.type === 'logic-onload');
    onLoadHats.forEach((h) => handleTriggerAction(h, formInputs));

    const triggerBtn = blocks.find((b) => b.type === 'ui-button');
    if (triggerBtn) {
      handleTriggerAction(triggerBtn, formInputs);
    } else {
      const counter = blocks.find((b) => b.type === 'logic-counter');
      if (counter) {
        const nextVal = (counter.counterValue ?? 0) + 1;
        handleUpdateBlock({
          ...counter,
          counterValue: nextVal,
          content: `Clicks Registered: ${nextVal}`,
        });
        onToast('Simulated reactive state update!', 'success');
      } else if (onLoadHats.length === 0) {
        onToast('Preview simulation ready — click interactive blocks on the Stage.', 'info');
      }
    }
  };

  const handleResetSimulation = () => {
    commitBlocks(
      (prev) =>
        prev.map((b) =>
          b.type === 'logic-counter'
            ? { ...b, counterValue: 0, content: 'Clicks Registered: 0' }
            : b.type === 'ui-accordion'
            ? { ...b, isExpanded: false }
            : b
        ),
      false
    );
    setFormInputs({});
    setConfirmDialog(null);
    setRunningTimers({});
    setRuntimeState(INITIAL_RUNTIME_STATE);
    onToast('Reset live preview & runtime state.', 'info');
  };

  // =================== IMPORT / EXPORT BLUEPRINT ===================
  const handleDownloadBlueprint = () => {
    const blob = new Blob(
      [JSON.stringify({ name: projectName, pages, blocks: pages[0]?.blocks || [] }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}.blueprint.json`;
    a.click();
    URL.revokeObjectURL(url);
    setOpenMenu(null);
    onToast('Blueprint exported as JSON.', 'success');
  };

  const handleImportBlueprint = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          setUndoStack((u) => [...u.slice(-19), pages]);
          setPages(parsed.pages);
          setActivePageId(parsed.pages[0].id);
          setSelectedBlockId(parsed.pages[0].blocks?.[0]?.id || null);
          if (parsed.name) setProjectName(parsed.name);
          onToast('Multi-page blueprint imported!', 'success');
        } else {
          const loadedBlocks = parsed.blocks || parsed.project?.blocks;
          if (Array.isArray(loadedBlocks)) {
            commitBlocks(() => loadedBlocks);
            if (parsed.name) setProjectName(parsed.name);
            onToast('Blueprint imported into current page!', 'success');
          } else {
            onToast('Invalid BlockCraft Studio blueprint file.', 'error');
          }
        }
      } catch {
        onToast('Could not parse JSON blueprint.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setOpenMenu(null);
  };

  const htmlCode = generateHtmlExport(projectName, blocks, pages, activePage?.pageStyle, cloudConfig, activeLogicFlows);
  const cssCode = generateCssExport(projectName, blocks, activePage?.pageStyle);
  const jsCode = generateJsExport(projectName, blocks, pages, cloudConfig, activeLogicFlows);
  const reactCode = generateReactTsxExport(projectName, blocks, activePage?.pageStyle, pages, cloudConfig);
  const flaskCode = generateFlaskExport(projectName, blocks);

  const activeJsPanelCode =
    jsViewTarget === 'js' ? jsCode : jsViewTarget === 'react' ? reactCode : flaskCode;

  const generatedCode =
    exportTarget === 'html'
      ? htmlCode
      : exportTarget === 'css'
      ? cssCode
      : exportTarget === 'js'
      ? jsCode
      : exportTarget === 'react'
      ? reactCode
      : flaskCode;

  const copySnippet = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedExport(true);
    onToast(`${label} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedExport(false), 1800);
  };

  const downloadSnippet = (code: string, ext: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slugName = activePage?.slug || 'index';
    a.download = ext === 'html' ? `${slugName}.html` : `${slugName}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stageWidthClass =
    stageSize === 'small' ? 'w-[300px] lg:w-[340px]' : 'w-[420px] lg:w-[490px]';

  const categoryTemplates = WEB_STUDIO_BLOCK_TEMPLATES.filter(
    (t) => t.studioCategory === activeCategory
  );

  return (
    <div
      className="h-screen w-screen flex flex-col bg-[#090B10] text-slate-100 overflow-hidden select-none relative z-20"
      onClick={() => openMenu && setOpenMenu(null)}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportBlueprint}
        className="hidden"
      />

      {/* ================= 1. TOP BLACK BLOCKCRAFT STUDIO BAR ================= */}
      <header className="h-12 bg-[#11151E] text-slate-100 px-3 flex items-center justify-between shrink-0 border-b border-white/10 shadow-md relative z-40">
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Back to Projects & BLOCKCRAFT STUDIO Wordmark */}
          <button
            type="button"
            onClick={onBackToProjects}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 transition-colors text-xs font-extrabold tracking-tight cursor-pointer whitespace-nowrap shrink-0"
            title="Back to Projects Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-300" />
            <span style={{ color: themeConfig.accentHex }} className="font-black tracking-wide">
              BLOCKCRAFT STUDIO
            </span>
            <span className="hidden md:inline text-slate-300 font-semibold">WebStudio</span>
          </button>

          {/* Language Globe Dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'lang' ? null : 'lang')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
              title="Switch Language"
            >
              <Globe className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline text-[11px]">{lang === 'en' ? 'EN' : 'සිං'}</span>
            </button>
            {openMenu === 'lang' && (
              <div className="absolute left-0 mt-1 w-40 bg-[#161B26] text-slate-200 rounded-xl shadow-2xl border border-white/15 py-1 text-xs z-50">
                <button
                  type="button"
                  onClick={() => {
                    setLang('en');
                    setOpenMenu(null);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-white/10 flex items-center justify-between ${
                    lang === 'en' ? 'font-bold text-[#60A5FA]' : ''
                  }`}
                >
                  <span>English</span>
                  {lang === 'en' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLang('si');
                    setOpenMenu(null);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-white/10 flex items-center justify-between ${
                    lang === 'si' ? 'font-bold text-[#60A5FA]' : ''
                  }`}
                >
                  <span>සිංහල (Sinhala)</span>
                  {lang === 'si' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* File Menu */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
              className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              {lang === 'si' ? 'ගොනුව' : 'File'}
            </button>
            {openMenu === 'file' && (
              <div className="absolute left-0 mt-1 w-52 bg-[#161B26] text-slate-200 rounded-xl shadow-2xl border border-white/15 py-1 text-xs z-50">
                <button
                  type="button"
                  onClick={() => {
                    commitBlocks(() => [...INITIAL_DEMO_BLOCKS]);
                    setSelectedBlockId(INITIAL_DEMO_BLOCKS[0]?.id || null);
                    setOpenMenu(null);
                    onToast('Loaded default BlockCraft Studio blueprint.', 'info');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>Load Default Blueprint</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>Import Blueprint (.json)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBlueprint}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>Export Blueprint (.json)</span>
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    onBackToProjects();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2 text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Projects Hub</span>
                </button>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'edit' ? null : 'edit')}
              className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              {lang === 'si' ? 'සංස්කරණය' : 'Edit'}
            </button>
            {openMenu === 'edit' && (
              <div className="absolute left-0 mt-1 w-52 bg-[#161B26] text-slate-200 rounded-xl shadow-2xl border border-white/15 py-1 text-xs z-50">
                <button
                  type="button"
                  disabled={undoStack.length === 0}
                  onClick={() => {
                    const last = undoStack[undoStack.length - 1];
                    if (last) {
                      setPages(last);
                      setUndoStack((u) => u.slice(0, -1));
                      onToast('Undid last change.', 'info');
                    }
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 disabled:opacity-40 flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>Undo Edit ({undoStack.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedBlock) handleDuplicateBlock(selectedBlock);
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>Duplicate Selected Block</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleResetSimulation();
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reset Counters & Toggles</span>
                </button>
              </div>
            )}
          </div>

          {/* Section Kits Button */}
          <button
            type="button"
            onClick={() => setShowSectionModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>{lang === 'si' ? 'කොටස් කට්ටල' : 'Blueprints'}</span>
          </button>

          {/* Editable Project Name */}
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            aria-label="Project title"
            className="ml-1 w-36 sm:w-52 bg-[#090B10] hover:bg-[#0D1017] focus:bg-[#161B26] text-slate-100 placeholder-slate-500 rounded-md px-2.5 py-1 text-xs font-semibold border border-white/15 focus:border-[#4D97FF] outline-none transition-colors"
          />
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/8 hover:bg-white/15 border border-white/10 text-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'si' ? 'කේතය' : 'Export Code'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onUpdateProject({
                ...project,
                name: projectName,
                blocks: pages[0]?.blocks || [],
                pages,
                updatedAt: 'Just now',
              });
              onToast('All pages saved cleanly!', 'success');
            }}
            style={{ backgroundColor: themeConfig.accentHex }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md hover:opacity-90 text-white text-xs font-semibold cursor-pointer transition-opacity whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{lang === 'si' ? 'සුරකින්න' : 'Save'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
            title="WebStudio Quick Guide"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ================= 3. MAIN WORKSPACE AREA ================= */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* LEFT EDITOR PANEL (Hidden only when Preview Stage is Fullscreen) */}
        {stageSize !== 'fullscreen' && (
          <div className="flex-1 min-w-0 flex bg-[#0A0D13] border-r border-white/10">
            {/* TAB 1: HTML (DOM Blocks & Visual Canvas + HTML Markup) */}
            {activeTab === 'html' && (
              <>
                {/* 3a. Far-Left Studio Navigation Rail */}
                <aside className="w-[54px] bg-[#14161b] border-r border-white/[0.08] flex flex-col shrink-0 overflow-y-auto select-none">
                  <div className="flex-1 min-h-full py-2.5 flex flex-col items-center justify-between">
                    {/* Top & Middle Tool Icons */}
                    <div className="flex flex-col items-center gap-1.5 w-full">
                      {/* Top Group */}
                      <button
                        type="button"
                        onClick={() => setActiveRailItem('widget-palette')}
                        title="UI Builder"
                        aria-label="UI Builder"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'widget-palette'
                            ? 'bg-white/[0.07] border border-white/[0.14] text-white'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                          <path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
                          <path d="M18 3v6" />
                          <path d="M15 6h6" />
                          <circle cx="9" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
                          <circle cx="9" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveRailItem('page-selector')}
                        title="Page Selector"
                        aria-label="Page Selector"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'page-selector'
                            ? 'bg-white/[0.07] border border-white/[0.14] text-white'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                          <rect x="4" y="4" width="12" height="14" rx="2" />
                          <path d="M8 8h4" />
                          <path d="M8 11.5h4" />
                          <path d="M8 15h2.5" />
                          <path d="M16 7h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-1" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveRailItem('widget-tree')}
                        title="Widget Tree"
                        aria-label="Widget Tree"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'widget-tree'
                            ? 'bg-white/[0.07] border border-white/[0.14] text-white'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                          <circle cx="5.5" cy="7" r="1.4" />
                          <circle cx="5.5" cy="12" r="1.4" />
                          <circle cx="5.5" cy="17" r="1.4" />
                          <path d="M10 7h9" />
                          <path d="M10 12h9" />
                          <path d="M10 17h9" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveRailItem('search')}
                        title="Search"
                        aria-label="Search"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'search'
                            ? 'bg-white/[0.07] border border-white/[0.14] text-white'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <Search className="w-[18px] h-[18px] stroke-[1.8]" />
                      </button>

                      {/* Divider */}
                      <div className="w-5 h-px bg-white/[0.1] my-1" />

                      {/* Middle Group */}
                      <button
                        type="button"
                        onClick={() => setActiveRailItem('storyboard')}
                        title="Storyboard"
                        aria-label="Storyboard"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'storyboard'
                            ? 'bg-white/[0.07] border border-white/[0.14] text-white'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                          <rect x="4" y="4.5" width="7" height="10" rx="1.5" />
                          <rect x="13" y="9.5" width="7" height="10" rx="1.5" />
                          <path d="M11 8.5c2 0 3.5 1.5 3.5 3.5" />
                          <path d="M13 15.5c-2 0-3.5-1.5-3.5-3.5" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveRailItem('actions');
                          setHtmlViewMode('logic');
                        }}
                        title="Action Flow · Backend Logic"
                        aria-label="Action Flow"
                        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'actions'
                            ? 'bg-amber-500/15 border border-amber-400/40 text-amber-300'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <Zap className="w-[18px] h-[18px] fill-current stroke-[1.5]" />
                        {activeLogicFlows.length > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-extrabold flex items-center justify-center">
                            {activeLogicFlows.length}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveRailItem('database')}
                        title="Database"
                        aria-label="Database"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'database'
                            ? 'bg-white/[0.07] border border-white/[0.14] text-white'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                          <rect x="4" y="4" width="16" height="4.5" rx="1" />
                          <rect x="4" y="9.75" width="16" height="4.5" rx="1" />
                          <rect x="4" y="15.5" width="16" height="4.5" rx="1" />
                          <circle cx="7" cy="6.25" r="0.6" fill="currentColor" />
                          <circle cx="7" cy="12" r="0.6" fill="currentColor" />
                          <circle cx="7" cy="17.75" r="0.6" fill="currentColor" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveRailItem('api-calls')}
                        title="API Calls"
                        aria-label="API Calls"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'api-calls'
                            ? 'bg-white/[0.07] border border-white/[0.14] text-white'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                          <rect x="4" y="5" width="7.5" height="14" rx="1.5" />
                          <circle cx="7.75" cy="12" r="1" fill="currentColor" stroke="none" />
                          <path d="M14.5 7h5.5" />
                          <path d="M14.5 12h5.5" />
                          <path d="M14.5 17h5.5" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveRailItem('app-state')}
                        title="App State"
                        aria-label="App State"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'app-state'
                            ? 'bg-white/[0.07] border border-white/[0.14] text-white'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                          <rect x="6" y="3.5" width="12" height="17" rx="2.2" />
                          <path d="M8.5 10.5a1 1 0 0 1 1-1h1.5l1 1h2.5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-4z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveRailItem('components')}
                        title="Components"
                        aria-label="Components"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'components'
                            ? 'bg-white/[0.07] border border-white/[0.14] text-white'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                          <polygon points="12,4 15.5,6 15.5,10 12,12 8.5,10 8.5,6" />
                          <polygon points="7.5,12 11,14 11,18 7.5,20 4,18 4,14" />
                          <polygon points="16.5,12 20,14 20,18 16.5,20 13,18 13,14" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveRailItem('media-assets')}
                        title="Media Assets"
                        aria-label="Media Assets"
                        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'media-assets'
                            ? 'bg-sky-500/15 border border-sky-400/40 text-sky-300'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <ImageIcon className="w-[18px] h-[18px] stroke-[1.75]" />
                        {mediaAssets.length > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-sky-500 text-white text-[9px] font-bold flex items-center justify-center leading-none ring-2 ring-[#14161b]">
                            {mediaAssets.length > 9 ? '9+' : mediaAssets.length}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveRailItem('cloud-sync')}
                        title="Firebase & Supabase"
                        aria-label="Firebase & Supabase"
                        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'cloud-sync'
                            ? 'bg-white/[0.07] border border-white/[0.14] text-white'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                          <path d="M6.5 18h11a4 4 0 0 0 .8-7.92A5.5 5.5 0 0 0 7.7 8.5 4.2 4.2 0 0 0 6.5 18Z" />
                          <path d="m9.8 13.5 1.8 1.8 3.2-3.4" />
                        </svg>
                        {(cloudConfig.firebase.enabled || cloudConfig.supabase.enabled) && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveRailItem('project-checks')}
                        title="Automated Tests"
                        aria-label="Automated Tests"
                        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'project-checks'
                            ? 'bg-white/[0.07] border border-white/[0.14] text-white'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                          <path d="M12 4.5a7.5 7.5 0 1 0 0 15" />
                          <path d="m8.8 12.2 2.2 2.2 4.2-4.4" />
                          <path d="M17.5 14v5" />
                          <path d="M15 16.5h5" />
                        </svg>
                        <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#5B4DFF] flex items-center justify-center ring-2 ring-[#14161b]">
                          <Crown className="w-2 h-2 text-white fill-white" />
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveRailItem('ai-assistant')}
                        title="AI Assistant"
                        aria-label="AI Assistant"
                        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'ai-assistant'
                            ? 'bg-white/[0.07] border border-white/[0.14] text-white'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <Bot className="w-[18px] h-[18px] stroke-[1.75]" />
                        <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#5B4DFF] flex items-center justify-center ring-2 ring-[#14161b]">
                          <Crown className="w-2 h-2 text-white fill-white" />
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveRailItem('triggers');
                          setHtmlViewMode('logic');
                        }}
                        title="Quick Triggers · Backend Logic"
                        aria-label="Quick Triggers"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'triggers'
                            ? 'bg-amber-500/15 border border-amber-400/40 text-amber-300'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <Zap className="w-[18px] h-[18px] fill-current stroke-[1.5]" />
                      </button>
                    </div>

                    {/* Bottom Group */}
                    <div className="pt-4 pb-1 flex flex-col items-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => setActiveRailItem('theme-palette')}
                        title="Text, Font, Color & Shade Studio"
                        aria-label="Text, Font, Color & Shade Studio"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'theme-palette'
                            ? 'bg-white/[0.07] border border-white/[0.14] text-white'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <Palette className="w-[18px] h-[18px] stroke-[1.75]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveRailItem('settings')}
                        title="Settings"
                        aria-label="Settings"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          activeRailItem === 'settings'
                            ? 'bg-white/[0.07] border border-white/[0.14] text-white'
                            : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <Settings className="w-[18px] h-[18px] stroke-[1.75]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveRailItem('profile')}
                        title="Account"
                        aria-label="Account"
                        className="mt-0.5 w-8 h-8 rounded-full bg-[#8c5a44] hover:bg-[#9c664e] text-white text-[12px] font-bold tracking-tight flex items-center justify-center transition-colors cursor-pointer"
                      >
                        DP
                      </button>
                    </div>
                  </div>
                </aside>

                {/* 3b. Block Toolbox Palette */}
                <aside className="w-[264px] lg:w-[278px] bg-[#181a1f] border-r border-white/[0.08] overflow-y-auto px-3 py-3 shrink-0 space-y-3 select-none">
                  {activeRailItem === 'widget-palette' ? (
                    <>
                      {/* FREQUENTLY USED ELEMENTS Section */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setFrequentlyUsedOpen((o) => !o)}
                          className="w-full flex items-center justify-between py-1 text-left cursor-pointer group"
                        >
                          <span className="text-[11px] font-medium tracking-[0.08em] text-[#9aa3b2] group-hover:text-white uppercase transition-colors">
                            FREQUENTLY USED ELEMENTS
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-[#8b949e] transition-transform duration-150 ${
                              frequentlyUsedOpen ? 'rotate-0' : '-rotate-90'
                            }`}
                          />
                        </button>

                        {frequentlyUsedOpen && (
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            {(
                              [
                                {
                                  id: 'Text',
                                  tplId: 'tpl-paragraph',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[20px] h-[20px]">
                                      <path d="M4 5.5h10v2.2h-3.8V18H7.8V7.7H4V5.5zm9.5 4.5h6.5v2h-2.1v6h-2.3v-6h-2.1v-2z" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Column',
                                  tplId: 'tpl-column',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="w-[20px] h-[20px]">
                                      <path d="M6 5v14" />
                                      <rect x="9.5" y="4.5" width="5" height="4" rx="0.8" />
                                      <rect x="9.5" y="10" width="5" height="4" rx="0.8" />
                                      <rect x="9.5" y="15.5" width="5" height="4" rx="0.8" />
                                      <path d="M18 5v14" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Row',
                                  tplId: 'tpl-row',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="w-[20px] h-[20px]">
                                      <path d="M5 6h14" />
                                      <rect x="4.5" y="9.5" width="4" height="5" rx="0.8" />
                                      <rect x="10" y="9.5" width="4" height="5" rx="0.8" />
                                      <rect x="15.5" y="9.5" width="4" height="5" rx="0.8" />
                                      <path d="M5 18h14" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Container',
                                  tplId: 'tpl-section',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-[20px] h-[20px]">
                                      <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Image',
                                  tplId: 'tpl-image',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="4.5" y="4.5" width="15" height="11.5" rx="2" />
                                      <circle cx="9" cy="8.5" r="1.1" />
                                      <path d="m6 14 3.5-3.2 2.8 2.4 2.2-1.8 3 2.6" />
                                      <path d="M6.5 19h11" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Button',
                                  tplId: 'tpl-button',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" className="w-[20px] h-[20px]">
                                      <rect x="3.5" y="5" width="17" height="14" rx="4" stroke="currentColor" strokeWidth="1.7" />
                                      <text
                                        x="12"
                                        y="14"
                                        textAnchor="middle"
                                        fill="currentColor"
                                        fontSize="6.5"
                                        fontWeight="700"
                                        fontFamily="system-ui, sans-serif"
                                        letterSpacing="0.3"
                                      >
                                        BTN
                                      </text>
                                    </svg>
                                  ),
                                },
                              ] as const
                            ).map((item) => {
                              const tpl =
                                WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === item.tplId) ||
                                WEB_STUDIO_BLOCK_TEMPLATES[0];
                              return (
                                <button
                                  key={`freq-${item.id}`}
                                  type="button"
                                  draggable
                                  onDragStart={(e) => handlePaletteDragStart(e, tpl)}
                                  onClick={() => handleAddTemplateBlock(tpl)}
                                  title={`Add ${item.id}`}
                                  className="h-[74px] rounded-[8px] bg-[#1e2127] hover:bg-[#262a33] border border-white/[0.07] hover:border-white/[0.16] px-1.5 flex flex-col items-center justify-center gap-1.5 text-center transition-colors cursor-grab active:cursor-grabbing"
                                >
                                  <span className="text-[#c9d1d9] flex items-center justify-center">
                                    {item.icon}
                                  </span>
                                  <span className="text-[11px] font-normal text-[#9aa3b2] truncate w-full leading-tight">
                                    {item.id}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* LAYOUT ELEMENTS Section (matches reference screenshot) */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setLayoutElementsOpen((o) => !o)}
                          className="w-full flex items-center justify-between py-1 text-left cursor-pointer group"
                        >
                          <span className="text-[11px] font-medium tracking-[0.08em] text-[#9aa3b2] group-hover:text-white uppercase transition-colors">
                            LAYOUT ELEMENTS
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-[#8b949e] transition-transform duration-150 ${
                              layoutElementsOpen ? 'rotate-0' : '-rotate-90'
                            }`}
                          />
                        </button>

                        {layoutElementsOpen && (
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            {(
                              [
                                {
                                  id: 'Container',
                                  tplId: 'tpl-section',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-[20px] h-[20px]">
                                      <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Row',
                                  tplId: 'tpl-row',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="w-[20px] h-[20px]">
                                      <path d="M5 6h14" />
                                      <rect x="4.5" y="9.5" width="4" height="5" rx="0.8" />
                                      <rect x="10" y="9.5" width="4" height="5" rx="0.8" />
                                      <rect x="15.5" y="9.5" width="4" height="5" rx="0.8" />
                                      <path d="M5 18h14" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Column',
                                  tplId: 'tpl-column',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="w-[20px] h-[20px]">
                                      <path d="M6 5v14" />
                                      <rect x="9.5" y="4.5" width="5" height="4" rx="0.8" />
                                      <rect x="9.5" y="10" width="5" height="4" rx="0.8" />
                                      <rect x="9.5" y="15.5" width="5" height="4" rx="0.8" />
                                      <path d="M18 5v14" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Stack',
                                  tplId: 'tpl-stack',
                                  icon: <Layers className="w-[20px] h-[20px] stroke-[1.75]" />,
                                },
                                {
                                  id: 'Card',
                                  tplId: 'tpl-card',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="w-[20px] h-[20px]">
                                      <rect x="4" y="5.5" width="16" height="13" rx="2" />
                                      <path d="M7.5 9.5h5" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'ListView',
                                  tplId: 'tpl-listview',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" className="w-[20px] h-[20px]">
                                      <path d="M5 7h14" />
                                      <path d="M5 12h14" />
                                      <path d="M5 17h14" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'GridView',
                                  tplId: 'tpl-grid',
                                  icon: <LayoutGrid className="w-[20px] h-[20px] stroke-[1.75]" />,
                                },
                                {
                                  id: 'Spacer',
                                  tplId: 'tpl-spacer',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <path d="M5 5h14" />
                                      <path d="M12 8v8" />
                                      <path d="m9.5 10.5 2.5-2.5 2.5 2.5" />
                                      <path d="m9.5 13.5 2.5 2.5 2.5-2.5" />
                                      <path d="M5 19h14" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Divider',
                                  tplId: 'tpl-divider',
                                  icon: <Minus className="w-[20px] h-[20px] stroke-[2]" />,
                                },
                                {
                                  id: 'VerticalDivider',
                                  tplId: 'tpl-vertical-divider',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[20px] h-[20px]">
                                      <path d="M12 5v14" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'TabBar',
                                  tplId: 'tpl-tabbar',
                                  icon: <Folder className="w-[20px] h-[20px] stroke-[1.75]" />,
                                },
                                {
                                  id: 'PageView',
                                  tplId: 'tpl-pageview',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="5" y="4" width="14" height="12" rx="2" />
                                      <circle cx="9.5" cy="8.5" r="1.1" />
                                      <path d="m6.5 14 3.5-3.2 2.8 2.4 2.2-1.8 2.5 2.6" />
                                      <path d="m7 19-1.5-1 1.5-1" />
                                      <path d="m17 19 1.5-1-1.5-1" />
                                      <circle cx="10" cy="18" r="0.6" fill="currentColor" stroke="none" />
                                      <circle cx="12" cy="18" r="0.6" fill="currentColor" stroke="none" />
                                      <circle cx="14" cy="18" r="0.6" fill="currentColor" stroke="none" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Carousel',
                                  tplId: 'tpl-carousel',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="7" y="6" width="10" height="12" rx="1.5" />
                                      <path d="M4 8v8" />
                                      <path d="M20 8v8" />
                                      <path d="m9 15 2.2-2.2 1.8 1.5 2-2 1.8 2.7" />
                                      <circle cx="10.2" cy="9.5" r="0.9" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Expandable',
                                  tplId: 'tpl-accordion',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <path d="M15 5h4v4" />
                                      <path d="M19 5l-5.5 5.5" />
                                      <path d="M9 19H5v-4" />
                                      <path d="M5 19l5.5-5.5" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Wrap',
                                  tplId: 'tpl-wrap',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="4" y="6" width="6" height="4.5" rx="0.8" />
                                      <rect x="12" y="6" width="6" height="4.5" rx="0.8" />
                                      <rect x="4" y="13.5" width="6" height="4.5" rx="0.8" />
                                      <path d="M18 11.5v2.5a2 2 0 0 1-2 2h-3.5" />
                                      <path d="m14.5 14-2 2 2 2" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Form Validation',
                                  tplId: 'tpl-form-validation',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-[20px] h-[20px]">
                                      <path d="M5 6.5h14" />
                                      <path d="M5 10h14" />
                                      <path d="M5 13.5h14" />
                                      <path d="M5 17h6" />
                                      <rect x="13" y="15.5" width="6" height="3" rx="1.5" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'StaggeredView',
                                  tplId: 'tpl-staggered',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="5" y="4.5" width="6" height="8" rx="1" />
                                      <rect x="13" y="4.5" width="6" height="5" rx="1" />
                                      <rect x="5" y="14.5" width="6" height="5" rx="1" />
                                      <rect x="13" y="11.5" width="6" height="8" rx="1" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'FlippableCard',
                                  tplId: 'tpl-flippable-card',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="6" y="4.5" width="12" height="9.5" rx="1.5" />
                                      <path d="M8.5 8h4" />
                                      <path d="M6.5 16.5c-1.5 1.2-1 3 1.5 3.3h8c2.5-.3 3-2.1 1.5-3.3" />
                                      <path d="m14.5 18 2 1.8-2 1.8" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'SwipeableStack',
                                  tplId: 'tpl-swipeable-stack',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="5" y="7" width="8.5" height="10.5" rx="1.2" transform="rotate(-12 9 12)" />
                                      <rect x="9.5" y="5.5" width="8.5" height="10.5" rx="1.2" transform="rotate(8 13 11)" />
                                      <path d="M12.5 18.5c2.2 0 4-1.3 4.5-3.2" />
                                      <path d="m15 16 2-1.2 1.2 2" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'DataTable',
                                  tplId: 'tpl-datatable',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="4" y="5" width="16" height="14" rx="1.8" />
                                      <path d="M4 9.5h16" />
                                      <path d="M4 14h16" />
                                      <path d="M9.5 5v14" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Flex',
                                  tplId: 'tpl-flex',
                                  icon: <Move className="w-[20px] h-[20px] stroke-[1.75]" />,
                                },
                              ] as const
                            ).map((item) => {
                              const tpl =
                                WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === item.tplId) ||
                                WEB_STUDIO_BLOCK_TEMPLATES[0];
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  draggable
                                  onDragStart={(e) => handlePaletteDragStart(e, tpl)}
                                  onClick={() => handleAddTemplateBlock(tpl)}
                                  title={`Add ${item.id}`}
                                  className="h-[74px] rounded-[8px] bg-[#1e2127] hover:bg-[#262a33] border border-white/[0.07] hover:border-white/[0.16] px-1.5 flex flex-col items-center justify-center gap-1.5 text-center transition-colors cursor-grab active:cursor-grabbing"
                                >
                                  <span className="text-[#c9d1d9] flex items-center justify-center">
                                    {item.icon}
                                  </span>
                                  <span className="text-[11px] font-normal text-[#9aa3b2] truncate w-full leading-tight">
                                    {item.id}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* BASE ELEMENTS Section (matches reference screenshots) */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setBaseElementsOpen((o) => !o)}
                          className="w-full flex items-center justify-between py-1 text-left cursor-pointer group"
                        >
                          <span className="text-[11px] font-medium tracking-[0.08em] text-[#9aa3b2] group-hover:text-white uppercase transition-colors">
                            BASE ELEMENTS
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-[#8b949e] transition-transform duration-150 ${
                              baseElementsOpen ? 'rotate-0' : '-rotate-90'
                            }`}
                          />
                        </button>

                        {baseElementsOpen && (
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            {(
                              [
                                {
                                  id: 'Text',
                                  tplId: 'tpl-paragraph',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[20px] h-[20px]">
                                      <path d="M4 5.5h10v2.2h-3.8V18H7.8V7.7H4V5.5zm9.5 4.5h6.5v2h-2.1v6h-2.3v-6h-2.1v-2z" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'RichText',
                                  tplId: 'tpl-richtext',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <path d="M7 4h7l4 4v11.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5v-14A1.5 1.5 0 0 1 7.5 4z" />
                                      <path d="M9 8.5h4M11 8.5v4" />
                                      <path d="M9 15h6M9 17.8h4.5" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Image',
                                  tplId: 'tpl-image',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="4.5" y="4.5" width="15" height="11.5" rx="2" />
                                      <circle cx="9" cy="8.5" r="1.1" />
                                      <path d="m6 14 3.5-3.2 2.8 2.4 2.2-1.8 3 2.6" />
                                      <path d="M6.5 19h11" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'CircleImage',
                                  tplId: 'tpl-avatar',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <circle cx="12" cy="12" r="8" />
                                      <circle cx="9.2" cy="9.2" r="1.1" />
                                      <path d="m5.5 15 3.8-3.5 2.7 2.4 2.3-2 3.7 3.3" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Icon',
                                  tplId: 'tpl-icon',
                                  icon: <Settings className="w-[20px] h-[20px] stroke-[1.75]" />,
                                },
                                {
                                  id: 'Button',
                                  tplId: 'tpl-button',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" className="w-[20px] h-[20px]">
                                      <rect x="3.5" y="5" width="17" height="14" rx="4" stroke="currentColor" strokeWidth="1.7" />
                                      <text
                                        x="12"
                                        y="14"
                                        textAnchor="middle"
                                        fill="currentColor"
                                        fontSize="6.5"
                                        fontWeight="700"
                                        fontFamily="system-ui, sans-serif"
                                        letterSpacing="0.3"
                                      >
                                        BTN
                                      </text>
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'IconButton',
                                  tplId: 'tpl-icon-button',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="w-[20px] h-[20px]">
                                      <rect x="4.5" y="4.5" width="15" height="15" rx="3.5" />
                                      <path d="M12 8.8v6.4M8.8 12h6.4" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'ListTile',
                                  tplId: 'tpl-list-tile',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="w-[20px] h-[20px]">
                                      <rect x="4.5" y="4.5" width="15" height="15" rx="1.8" />
                                      <path d="M8 8.5h1M11 8.5h5M8 12h1M11 12h5M8 15.5h1M11 15.5h5" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'SlidableListTile',
                                  tplId: 'tpl-slidable-tile',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" className="w-[20px] h-[20px]">
                                      <rect x="3.5" y="8" width="12.5" height="8" rx="1.2" fill="currentColor" fillOpacity="0.85" />
                                      <path d="M5.5 10.7h7M5.5 13.3h4.5" stroke="#1e2127" strokeWidth="1.5" />
                                      <rect x="17" y="8" width="3.5" height="8" rx="1" />
                                      <circle cx="18.75" cy="12" r="0.8" fill="currentColor" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'VideoPlayer',
                                  tplId: 'tpl-video',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="7" y="4.5" width="12.5" height="12.5" rx="2" />
                                      <path d="M4.5 8v9.5A2 2 0 0 0 6.5 19.5H16" />
                                      <polygon points="11.5,8.5 16,11 11.5,13.5" fill="currentColor" stroke="none" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'YoutubePlayer',
                                  tplId: 'tpl-youtube-player',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[20px] h-[20px]">
                                      <path d="M20.5 7.5a2.4 2.4 0 0 0-1.7-1.7C17.3 5.4 12 5.4 12 5.4s-5.3 0-6.8.4A2.4 2.4 0 0 0 3.5 7.5 25 25 0 0 0 3 12a25 25 0 0 0 .5 4.5 2.4 2.4 0 0 0 1.7 1.7c1.5.4 6.8.4 6.8.4s5.3 0 6.8-.4a2.4 2.4 0 0 0 1.7-1.7A25 25 0 0 0 21 12a25 25 0 0 0-.5-4.5zM10.2 14.8V9.2l4.8 2.8-4.8 2.8z" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Calendar',
                                  tplId: 'tpl-calendar',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="4.5" y="5.5" width="15" height="14" rx="2" />
                                      <path d="M8.5 3.5v3M15.5 3.5v3M4.5 9.5h15" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'ToggleIcon',
                                  tplId: 'tpl-toggle-icon',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <path d="M12 19.5s-7-4.4-7-9.6a4.1 4.1 0 0 1 7-2.8 4.1 4.1 0 0 1 7 2.8c0 5.2-7 9.6-7 9.6z" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'AudioPlayer',
                                  tplId: 'tpl-audio-player',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[20px] h-[20px]">
                                      <path d="M5 10.5v3M8.5 8v8M12 5v14M15.5 8v8M19 10.5v3" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'WebView',
                                  tplId: 'tpl-webview',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
                                      <path d="M4.5 9h15" />
                                      <path d="M7.5 14.5s1.8-2.8 4.5-2.8 4.5 2.8 4.5 2.8-1.8 2.8-4.5 2.8-4.5-2.8-4.5-2.8z" />
                                      <circle cx="12" cy="14.5" r="1" fill="currentColor" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'StaticMap',
                                  tplId: 'tpl-static-map',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <path d="M12 16.5s4.8-4.4 4.8-8.2a4.8 4.8 0 1 0-9.6 0c0 3.8 4.8 8.2 4.8 8.2z" />
                                      <circle cx="12" cy="8.3" r="1.5" />
                                      <path d="M6 19.5h12" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'GoogleMap',
                                  tplId: 'tpl-google-map',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <polygon points="4,6.5 9.5,4.5 14.5,6.5 20,4.5 20,17.5 14.5,19.5 9.5,17.5 4,19.5" />
                                      <path d="M9.5 4.5v13M14.5 6.5v13" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'AdBanner',
                                  tplId: 'tpl-ad-banner',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="7" y="3.8" width="10" height="16.4" rx="2" />
                                      <path d="M9.5 17h5" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'LottieAnimation',
                                  tplId: 'tpl-lottie',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="w-[20px] h-[20px]">
                                      <path d="M4.5 10.5c3.5 0 5.5 3 5.5 6.5 0-4.2 2.2-6.5 4.5-7" />
                                      <circle cx="16.8" cy="9.2" r="2.3" fill="currentColor" stroke="none" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Blur',
                                  tplId: 'tpl-blur',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[20px] h-[20px]">
                                      <circle cx="12" cy="5.5" r="0.9" />
                                      <circle cx="9.2" cy="6.6" r="1" />
                                      <circle cx="14.8" cy="6.6" r="1" />
                                      <circle cx="6.8" cy="9.2" r="1" />
                                      <circle cx="9.8" cy="9.2" r="1.2" />
                                      <circle cx="12.6" cy="9.2" r="1.2" />
                                      <circle cx="15.5" cy="9.2" r="1" />
                                      <circle cx="6" cy="12" r="1" />
                                      <circle cx="9" cy="12" r="1.3" />
                                      <circle cx="12" cy="12" r="1.4" />
                                      <circle cx="15" cy="12" r="1.3" />
                                      <circle cx="18" cy="12" r="1" />
                                      <circle cx="6.8" cy="14.8" r="1" />
                                      <circle cx="9.8" cy="14.8" r="1.2" />
                                      <circle cx="12.6" cy="14.8" r="1.2" />
                                      <circle cx="15.5" cy="14.8" r="1" />
                                      <circle cx="9.2" cy="17.4" r="1" />
                                      <circle cx="14.8" cy="17.4" r="1" />
                                      <circle cx="12" cy="18.5" r="0.9" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'AspectRatio',
                                  tplId: 'tpl-aspect-ratio',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="4" y="5.5" width="16" height="13" rx="1.8" />
                                      <path d="M7.5 11.5v-3h3M16.5 12.5v3h-3" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'ShaderWrapper',
                                  tplId: 'tpl-shader-wrap',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-[20px] h-[20px]">
                                      <rect x="5" y="5" width="14" height="14" rx="2" />
                                      <path d="M7.5 8.5h1M11.5 8.5h1M15.5 8.5h1M9.5 11.5h1M13.5 11.5h1M7.5 14.5h1M11.5 14.5h1M15.5 14.5h1" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'ShaderFill',
                                  tplId: 'tpl-shader-fill',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" className="w-[20px] h-[20px]">
                                      <path d="M5 10l5-5M5 15.5L15.5 5M6.5 19L19 6.5M12 19l7-7M17.5 19L19 17.5" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Transform',
                                  tplId: 'tpl-transform',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <path d="M6.5 4v11.5a1.5 1.5 0 0 0 1.5 1.5h11.5" />
                                      <path d="M4.5 6l2-2 2 2M17.5 15l2 2-2 2" />
                                      <path d="M9.5 8.5h5a1 1 0 0 1 1 1v5" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'MediaDisplay',
                                  tplId: 'tpl-media-display',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="6.5" y="4.5" width="13" height="11.5" rx="1.8" />
                                      <path d="M4 8.5v9a2 2 0 0 0 2 2h10.5" />
                                      <circle cx="10.5" cy="8.5" r="1" />
                                      <path d="m8 14 3.2-3 2.3 2 1.8-1.6 2.5 2.6" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'RiveAnimation',
                                  tplId: 'tpl-rive',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <path d="M6.5 6.5h6.5a3.5 3.5 0 0 1 0 7H10l5.5 5" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'PdfViewer',
                                  tplId: 'tpl-pdf-viewer',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" className="w-[20px] h-[20px]">
                                      <rect x="6.5" y="4" width="12.5" height="13.5" rx="1.8" stroke="currentColor" strokeWidth="1.65" />
                                      <path d="M4.5 7.5v10.5a2 2 0 0 0 2 2h9.5" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
                                      <text
                                        x="12.8"
                                        y="12.7"
                                        textAnchor="middle"
                                        fill="currentColor"
                                        fontSize="5.4"
                                        fontWeight="700"
                                        fontFamily="system-ui, sans-serif"
                                      >
                                        PDF
                                      </text>
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'ProgressBar',
                                  tplId: 'tpl-progress-bar',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" className="w-[20px] h-[20px]">
                                      <text
                                        x="12"
                                        y="9.5"
                                        textAnchor="middle"
                                        fill="currentColor"
                                        fontSize="6"
                                        fontWeight="700"
                                        fontFamily="system-ui, sans-serif"
                                      >
                                        75%
                                      </text>
                                      <rect x="4" y="12.5" width="16" height="4.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                      <rect x="4.8" y="13.3" width="10.5" height="2.9" rx="1.2" fill="currentColor" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'LanguageSelector',
                                  tplId: 'tpl-language-selector',
                                  icon: <Globe className="w-[20px] h-[20px] stroke-[1.75]" />,
                                },
                                {
                                  id: 'Badge',
                                  tplId: 'tpl-notification-badge',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <path d="M18 15.5H6l1.4-2V10a4.6 4.6 0 0 1 7.2-3.8" />
                                      <path d="M10 18a2.2 2.2 0 0 0 4 0" />
                                      <circle cx="16.5" cy="7.5" r="3" fill="currentColor" stroke="none" />
                                      <text x="16.5" y="9.3" textAnchor="middle" fill="#1e2127" fontSize="5" fontWeight="800">
                                        1
                                      </text>
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Chart',
                                  tplId: 'tpl-chart',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <path d="M5 4.5v15h14.5" />
                                      <path d="m7.5 16 3.5-3.8 3 .8 4-5.5" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'MuxBroadcast',
                                  tplId: 'tpl-mux-broadcast',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="7" y="4" width="9" height="16" rx="2" />
                                      <polygon points="10.2,9.5 14,12 10.2,14.5" fill="currentColor" stroke="none" />
                                      <path d="M18.5 7.5a5.5 5.5 0 0 1 0 6" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Timer',
                                  tplId: 'tpl-timer',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" className="w-[20px] h-[20px]">
                                      <path d="M10 4.5h4M12 4.5V7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                                      <rect x="4.5" y="7" width="15" height="11.5" rx="3" stroke="currentColor" strokeWidth="1.7" />
                                      <text
                                        x="12"
                                        y="14.7"
                                        textAnchor="middle"
                                        fill="currentColor"
                                        fontSize="5.4"
                                        fontWeight="700"
                                        fontFamily="ui-monospace, monospace"
                                      >
                                        0:02
                                      </text>
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'MouseRegion',
                                  tplId: 'tpl-mouse-region',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="4.5" y="5.5" width="15" height="12" rx="1.8" />
                                      <path d="M4.5 9.5h15" />
                                      <polygon points="13,12 19,15 16,16 14.5,19" fill="currentColor" stroke="none" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Barcode',
                                  tplId: 'tpl-barcode',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="w-[20px] h-[20px]">
                                      <path d="M5 7V5h2.5M16.5 5H19v2M5 17v2h2.5M16.5 19H19v-2" />
                                      <path d="M7.5 8.5v7M10 8.5v7M12.5 8.5v7M15 8.5v7M16.8 8.5v7" strokeWidth="1.4" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'DataTable',
                                  tplId: 'tpl-datatable',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="4" y="5" width="16" height="14" rx="1.8" />
                                      <path d="M4 9.5h16M4 14h16M9.5 5v14" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Tooltip',
                                  tplId: 'tpl-tooltip',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <path d="M5 6h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 17h-9l-4.5 3v-3H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 6z" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'ConditionalBuilder',
                                  tplId: 'tpl-conditional-builder',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="4" y="10" width="4.5" height="4.5" rx="0.8" />
                                      <rect x="14.5" y="6" width="4.5" height="4.5" rx="0.8" />
                                      <rect x="14.5" y="14" width="4.5" height="4.5" rx="0.8" />
                                      <path d="M8.5 12.2h3V8.2h3M11.5 12.2v4h3" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'StickyHeader',
                                  tplId: 'tpl-sticky-header',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="w-[20px] h-[20px]">
                                      <path d="M5 7h1.5M9.5 7h6M5 12h1.5M9.5 12h8M5 17h1.5M9.5 17h8" />
                                      <path d="M18 4.5v3M16.5 6h3" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Markdown',
                                  tplId: 'tpl-markdown',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" className="w-[20px] h-[20px]">
                                      <rect x="4" y="5.5" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
                                      <text
                                        x="10.2"
                                        y="14.2"
                                        textAnchor="middle"
                                        fill="currentColor"
                                        fontSize="7.5"
                                        fontWeight="800"
                                        fontFamily="system-ui, sans-serif"
                                      >
                                        M
                                      </text>
                                      <path d="M16 9.5v5m-1.6-1.6L16 14.5l1.6-1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Draggable',
                                  tplId: 'tpl-draggable',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="4.5" y="6.5" width="10" height="11" rx="1.8" strokeDasharray="2.2 2" />
                                      <rect x="8.5" y="4.5" width="10" height="11" rx="1.8" />
                                      <circle cx="16.5" cy="14" r="2.2" fill="currentColor" stroke="none" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'DragTarget',
                                  tplId: 'tpl-drag-target',
                                  icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                                      <rect x="4.5" y="6.5" width="14" height="11.5" rx="2" strokeDasharray="2.4 2" />
                                      <circle cx="15.8" cy="8.5" r="2.4" />
                                      <path d="m6.5 15 3.5-3 2.5 2 2-1.5 2.5 2.5" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'GenUI Chat',
                                  tplId: 'tpl-genui-chat',
                                  icon: <Bot className="w-[20px] h-[20px] stroke-[1.75]" />,
                                },
                              ] as const
                            ).map((item) => {
                              const tpl =
                                WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === item.tplId) ||
                                WEB_STUDIO_BLOCK_TEMPLATES[0];
                              return (
                                <button
                                  key={`base_${item.id}`}
                                  type="button"
                                  draggable
                                  onDragStart={(e) => handlePaletteDragStart(e, tpl)}
                                  onClick={() => handleAddTemplateBlock(tpl)}
                                  title={`Add ${item.id}`}
                                  className="h-[74px] rounded-[8px] bg-[#1e2127] hover:bg-[#262a33] border border-white/[0.07] hover:border-white/[0.16] px-1.5 flex flex-col items-center justify-center gap-1.5 text-center transition-colors cursor-grab active:cursor-grabbing"
                                >
                                  <span className="text-[#c9d1d9] flex items-center justify-center">
                                    {item.icon}
                                  </span>
                                  <span className="text-[11px] font-normal text-[#9aa3b2] truncate w-full leading-tight">
                                    {item.id}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* PAGE ELEMENTS */}
                      <div className="pt-2 border-t border-white/[0.06]">
                        <button
                          type="button"
                          onClick={() => setPageElementsOpen((o) => !o)}
                          className="w-full flex items-center justify-between py-1 text-left cursor-pointer group"
                        >
                          <span className="text-[11px] font-medium tracking-[0.08em] text-[#9aa3b2] group-hover:text-white uppercase transition-colors">
                            PAGE ELEMENTS
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-[#8b949e] transition-transform duration-150 ${
                              pageElementsOpen ? 'rotate-0' : '-rotate-90'
                            }`}
                          />
                        </button>
                        {pageElementsOpen && (
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            {(
                              [
                                {
                                  id: 'AppBar',
                                  tplId: 'tpl-appbar',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="3" y="8" width="18" height="8" rx="1.5" />
                                      <path d="M6.5 12h1.5" />
                                      <line x1="10.5" y1="12" x2="17" y2="12" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'FAB',
                                  tplId: 'tpl-fab',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="8.5" />
                                      <line x1="12" y1="8.5" x2="12" y2="15.5" />
                                      <line x1="8.5" y1="12" x2="15.5" y2="12" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Drawer',
                                  tplId: 'tpl-drawer',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="4" y1="7" x2="12" y2="7" />
                                      <line x1="4" y1="12" x2="11" y2="12" />
                                      <line x1="4" y1="17" x2="12" y2="17" />
                                      <polyline points="19 8 15 12 19 16" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'EndDrawer',
                                  tplId: 'tpl-end-drawer',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="4" y1="7" x2="12" y2="7" />
                                      <line x1="4" y1="12" x2="11" y2="12" />
                                      <line x1="4" y1="17" x2="12" y2="17" />
                                      <polyline points="19 8 15 12 19 16" />
                                    </svg>
                                  ),
                                },
                              ] as const
                            ).map((item) => {
                              const tpl =
                                WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === item.tplId) ||
                                WEB_STUDIO_BLOCK_TEMPLATES[0];
                              return (
                                <button
                                  key={`page_${item.id}`}
                                  type="button"
                                  draggable
                                  onDragStart={(e) => handlePaletteDragStart(e, tpl)}
                                  onClick={() => handleAddTemplateBlock(tpl)}
                                  title={`Add ${item.id}`}
                                  className="h-[74px] rounded-[8px] bg-[#1e2127] hover:bg-[#262a33] border border-white/[0.07] hover:border-white/[0.16] px-1.5 flex flex-col items-center justify-center gap-1.5 text-center transition-colors cursor-grab active:cursor-grabbing"
                                >
                                  <span className="text-[#c9d1d9] flex items-center justify-center">
                                    {item.icon}
                                  </span>
                                  <span className="text-[11px] font-normal text-[#9aa3b2] truncate w-full leading-tight">
                                    {item.id}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* FORM ELEMENTS */}
                      <div className="pt-2 border-t border-white/[0.06]">
                        <button
                          type="button"
                          onClick={() => setFormElementsOpen((o) => !o)}
                          className="w-full flex items-center justify-between py-1 text-left cursor-pointer group"
                        >
                          <span className="text-[11px] font-medium tracking-[0.08em] text-[#9aa3b2] group-hover:text-white uppercase transition-colors">
                            FORM ELEMENTS
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-[#8b949e] transition-transform duration-150 ${
                              formElementsOpen ? 'rotate-0' : '-rotate-90'
                            }`}
                          />
                        </button>
                        {formElementsOpen && (
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            {(
                              [
                                {
                                  id: 'TextField',
                                  tplId: 'tpl-text-input',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
                                      <path d="M18.4 2.6a2 2 0 0 1 3 3L12 15l-4 1 1-4Z" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'DropDown',
                                  tplId: 'tpl-select',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.5">
                                      <rect x="2.5" y="7" width="19" height="10" rx="2" />
                                      <text x="10.2" y="13.5" textAnchor="middle" fill="currentColor" stroke="none" fontSize="5.2" fontWeight="700" fontFamily="sans-serif">DROP</text>
                                      <path d="M17 11l1.5 2 1.5-2" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Checkbox',
                                  tplId: 'tpl-checkbox',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="4" y="4" width="16" height="16" rx="2.5" />
                                      <polyline points="8.5 12.2 11 14.8 16 9.2" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'CheckboxListTile',
                                  tplId: 'tpl-checkbox-tile',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="2.5" y="7" width="19" height="10" rx="2" />
                                      <line x1="5.5" y1="10.5" x2="10.5" y2="10.5" />
                                      <line x1="5.5" y1="13.5" x2="9" y2="13.5" />
                                      <rect x="13" y="9" width="6" height="6" rx="1" />
                                      <polyline points="14.5 12 15.6 13.2 17.6 10.8" strokeWidth="1.3" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Switch',
                                  tplId: 'tpl-switch',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.8">
                                      <rect x="2.5" y="7.5" width="19" height="9" rx="4.5" />
                                      <circle cx="16.5" cy="12" r="2.6" fill="currentColor" stroke="none" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'SwitchListTile',
                                  tplId: 'tpl-switch-tile',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                      <rect x="2.5" y="7" width="19" height="10" rx="2" />
                                      <line x1="5.5" y1="10.5" x2="10" y2="10.5" />
                                      <line x1="5.5" y1="13.5" x2="8.5" y2="13.5" />
                                      <rect x="12" y="9.5" width="7" height="5" rx="2.5" />
                                      <circle cx="16.8" cy="12" r="1.4" fill="currentColor" stroke="none" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'RadioButton',
                                  tplId: 'tpl-radio',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                                      <circle cx="7" cy="8" r="2.8" />
                                      <circle cx="7" cy="8" r="1" fill="currentColor" stroke="none" />
                                      <line x1="12.5" y1="8" x2="19.5" y2="8" />
                                      <circle cx="7" cy="16" r="2.8" />
                                      <line x1="12.5" y1="16" x2="19.5" y2="16" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'PinCode',
                                  tplId: 'tpl-pin-code',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="9.5" y="5.5" width="5" height="4" rx="0.8" />
                                      <path d="M10.5 5.5V4.2a1.5 1.5 0 0 1 3 0v1.3" />
                                      <rect x="3" y="12" width="18" height="6.5" rx="1.8" strokeDasharray="2.5 1.5" />
                                      <circle cx="6.5" cy="15.2" r="1" fill="currentColor" stroke="none" />
                                      <circle cx="10.2" cy="15.2" r="1" fill="currentColor" stroke="none" />
                                      <circle cx="13.8" cy="15.2" r="1" fill="currentColor" stroke="none" />
                                      <circle cx="17.5" cy="15.2" r="1" fill="currentColor" stroke="none" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Slider',
                                  tplId: 'tpl-slider',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                      <line x1="3" y1="12" x2="9" y2="12" />
                                      <line x1="15" y1="12" x2="21" y2="12" />
                                      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'RatingBar',
                                  tplId: 'tpl-rating-bar',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="currentColor">
                                      <path d="M5 9.2l.9 1.8 2 .3-1.4 1.4.3 2L5 13.7l-1.8 1 .3-2-1.4-1.4 2-.3L5 9.2zM12 9.2l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3L12 9.2zM19 9.2l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3L19 9.2z" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'CreditCardForm',
                                  tplId: 'tpl-credit-card',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="3" y="6" width="18" height="12" rx="2" />
                                      <line x1="3" y1="10.5" x2="21" y2="10.5" strokeWidth="2.2" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Counter Button',
                                  tplId: 'tpl-counter-button',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                      <rect x="2.5" y="7" width="19" height="10" rx="2" />
                                      <line x1="5.5" y1="12" x2="8" y2="12" />
                                      <text x="12" y="14.2" textAnchor="middle" fill="currentColor" stroke="none" fontSize="7" fontWeight="700" fontFamily="sans-serif">2</text>
                                      <line x1="16" y1="12" x2="18.8" y2="12" />
                                      <line x1="17.4" y1="10.6" x2="17.4" y2="13.4" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'ChoiceChips',
                                  tplId: 'tpl-choice-chips',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.4">
                                      <rect x="3" y="6.5" width="12" height="6" rx="3" fill="currentColor" fillOpacity="0.2" />
                                      <rect x="8.5" y="11.5" width="12.5" height="6" rx="3" />
                                      <text x="9" y="10.8" textAnchor="middle" fill="currentColor" stroke="none" fontSize="3.8" fontWeight="700" fontFamily="sans-serif">Option</text>
                                      <text x="14.8" y="15.8" textAnchor="middle" fill="currentColor" stroke="none" fontSize="3.8" fontWeight="700" fontFamily="sans-serif">Option</text>
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'PlacePicker',
                                  tplId: 'tpl-place-picker',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="currentColor">
                                      <path d="M12 2.5a6.5 6.5 0 0 0-6.5 6.5c0 4.8 6.5 12 6.5 12s6.5-7.2 6.5-12A6.5 6.5 0 0 0 12 2.5zm0 9a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Form Validation',
                                  tplId: 'tpl-form-validation',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                                      <line x1="4" y1="5" x2="20" y2="5" />
                                      <line x1="4" y1="8.5" x2="20" y2="8.5" />
                                      <line x1="4" y1="12" x2="20" y2="12" />
                                      <line x1="4" y1="15.5" x2="20" y2="15.5" />
                                      <rect x="13" y="18.2" width="7" height="2.6" rx="1.3" fill="currentColor" stroke="none" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'CheckboxGroup',
                                  tplId: 'tpl-checkbox-group',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="4" y="5" width="4" height="4" rx="0.8" />
                                      <line x1="11" y1="7" x2="20" y2="7" />
                                      <rect x="4" y="10.5" width="4" height="4" rx="0.8" />
                                      <line x1="11" y1="12.5" x2="20" y2="12.5" />
                                      <polyline points="4.2 17.8 5.6 19.2 8.2 16.4" />
                                      <line x1="11" y1="18" x2="20" y2="18" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'Signature',
                                  tplId: 'tpl-signature',
                                  icon: (
                                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M4 17c3-1 5-9 6.5-11.5C12 3 13 5 11.5 9c-1.2 3.2-3 7.5-1.5 7.5 1.2 0 2.5-3.5 3.5-3.5 1 0 .5 3 1.5 3s2-2 3-2 1.2 2 2 2" />
                                      <line x1="4" y1="20" x2="20" y2="20" />
                                    </svg>
                                  ),
                                },
                              ] as const
                            ).map((item) => {
                              const tpl =
                                WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === item.tplId) ||
                                WEB_STUDIO_BLOCK_TEMPLATES[0];
                              return (
                                <button
                                  key={`form_${item.id}`}
                                  type="button"
                                  draggable
                                  onDragStart={(e) => handlePaletteDragStart(e, tpl)}
                                  onClick={() => handleAddTemplateBlock(tpl)}
                                  title={`Add ${item.id}`}
                                  className="h-[74px] rounded-[8px] bg-[#1e2127] hover:bg-[#262a33] border border-white/[0.07] hover:border-white/[0.16] px-1.5 flex flex-col items-center justify-center gap-1.5 text-center transition-colors cursor-grab active:cursor-grabbing"
                                >
                                  <span className="text-[#c9d1d9] flex items-center justify-center">
                                    {item.icon}
                                  </span>
                                  <span className="text-[11px] font-normal text-[#9aa3b2] truncate w-full leading-tight">
                                    {item.id}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </>
                  ) : null}

                  {activeRailItem === 'theme-palette' && (
                    <ThemeStyleStudioPanel
                      blocks={blocks}
                      selectedBlock={selectedBlock}
                      onSelectBlock={(id) => setSelectedBlockId(id)}
                      onUpdateBlock={handleUpdateBlock}
                      onBulkApplyStyle={(stylePatch: Partial<BlockStyle>) => {
                        commitBlocks((prev) =>
                          prev.map((b) => ({
                            ...b,
                            style: { ...b.style, ...stylePatch },
                            children: b.children?.map((ch) => ({
                              ...ch,
                              style: { ...ch.style, ...stylePatch },
                            })),
                          }))
                        );
                      }}
                      onResetStyle={(blockId: string) => {
                        commitBlocks((prev) =>
                          prev.map((b) =>
                            b.id === blockId
                              ? {
                                  ...b,
                                  style: {
                                    ...b.style,
                                    templateId: undefined,
                                    fontFamily: undefined,
                                    fontWeight: undefined,
                                    fontSize: undefined,
                                    textAlign: undefined,
                                    customTextHex: undefined,
                                    subtitleColorHex: undefined,
                                    textGradient: undefined,
                                    textShadow: undefined,
                                    textStroke: undefined,
                                    customBgHex: undefined,
                                    bgGradient: undefined,
                                    borderColor: undefined,
                                    boxShadow: undefined,
                                    borderRadius: undefined,
                                  },
                                }
                              : b
                          )
                        );
                      }}
                      onToast={onToast}
                    />
                  )}

                  {activeRailItem === 'cloud-sync' && (
                    <CloudBackendStudioPanel
                      lang={lang}
                      cloudConfig={cloudConfig}
                      onChangeCloudConfig={setCloudConfig}
                      onAddBackendBlocks={handleAddCloudBackendBlocks}
                      onToast={onToast}
                    />
                  )}

                  {activeRailItem === 'page-selector' && (
                    <PageSelectorStudioPanel
                      lang={lang}
                      pages={pages}
                      activePageId={activePageId}
                      onSelectPage={(pageId) => handleSelectPage(pageId)}
                      onCreatePage={handleCreatePage}
                      onRenamePage={handleRenamePage}
                      onDuplicatePage={handleDuplicatePage}
                      onDeletePage={handleDeletePage}
                      onOpenAddModal={() => {
                        setNewPageName('');
                        setShowAddPageModal(true);
                      }}
                    />
                  )}

                  {activeRailItem === 'widget-tree' && (
                    <WidgetTreeStudioPanel
                      lang={lang}
                      activePageName={activePage?.name || 'Home'}
                      activePageSlug={activePage?.slug || 'index'}
                      blocks={blocks}
                      selectedBlockId={selectedBlockId}
                      onSelectBlock={(id) => setSelectedBlockId(id)}
                      onMoveBlock={handleMoveBlock}
                      onDuplicateBlock={handleDuplicateBlock}
                      onToggleHidden={(blk) =>
                        handleUpdateBlock({
                          ...blk,
                          style: { ...blk.style, isHidden: !blk.style?.isHidden },
                        })
                      }
                      onDeleteBlock={handleDeleteBlock}
                      onDeleteChildWidget={(parentId, childId) => {
                        commitBlocks((prev) =>
                          prev.map((b) =>
                            b.id === parentId
                              ? { ...b, children: (b.children || []).filter((ch) => ch.id !== childId) }
                              : b
                          )
                        );
                      }}
                      onToggleChildHidden={(parentId, childId) => {
                        commitBlocks((prev) =>
                          prev.map((b) =>
                            b.id === parentId
                              ? {
                                  ...b,
                                  children: (b.children || []).map((ch) =>
                                    ch.id === childId
                                      ? { ...ch, style: { ...ch.style, isHidden: !ch.style?.isHidden } }
                                      : ch
                                  ),
                                }
                              : b
                          )
                        );
                      }}
                      onOpenWidgetPalette={() => setActiveRailItem('widget-palette')}
                    />
                  )}

                  {activeRailItem === 'search' && (
                    <SearchStudioPanel
                      lang={lang}
                      pages={pages}
                      activePageId={activePageId}
                      selectedBlockId={selectedBlockId}
                      onSelectPage={(pageId) => handleSelectPage(pageId)}
                      onSelectBlock={(id) => setSelectedBlockId(id)}
                      onInspectBlock={(id) => {
                        setSelectedBlockId(id);
                        setHtmlViewMode('inspector');
                      }}
                      onAddTemplateBlock={handleAddTemplateBlock}
                      onPaletteDragStart={handlePaletteDragStart}
                    />
                  )}

                  {(activeRailItem === 'actions' || activeRailItem === 'triggers') && (
                    <BackendLogicSidebar
                      lang={lang}
                      blocks={blocks}
                      pages={pages}
                      activePageId={activePageId}
                      flows={activeLogicFlows}
                      selectedFlowId={selectedFlowId}
                      cloudConfig={cloudConfig}
                      onSelectFlow={(flowId) => setSelectedFlowId(flowId)}
                      onCreateFlow={handleCreateLogicFlow}
                      onToggleFlowEnabled={(flowId) =>
                        commitLogicFlows((prev) =>
                          prev.map((f) => (f.id === flowId ? { ...f, enabled: !f.enabled } : f))
                        )
                      }
                      onDeleteFlow={(flowId) => {
                        commitLogicFlows((prev) => {
                          const next = prev.filter((f) => f.id !== flowId);
                          if (selectedFlowId === flowId) {
                            setSelectedFlowId(next[0]?.id || null);
                          }
                          return next;
                        });
                        onToast('Deleted backend logic flow', 'info');
                      }}
                      onAppendActionStep={handleAppendActionToActiveFlow}
                      onRunFlowTest={(flow) => executeSingleLogicFlow(flow, formInputs, 'Test')}
                      onOpenLogicWorkspace={() => setHtmlViewMode('logic')}
                    />
                  )}

                  {activeRailItem === 'media-assets' && (
                    <MediaAssetsStudioPanel
                      lang={lang}
                      assets={mediaAssets}
                      resolvedIdbUrls={resolvedIdbUrls}
                      selectedBlock={blocks.find((b) => b.id === selectedBlockId) || null}
                      onAddAssets={(newItems, newUrls) => {
                        if (newUrls && Object.keys(newUrls).length > 0) {
                          setResolvedIdbUrls((prev) => ({ ...prev, ...newUrls }));
                        }
                        setMediaAssets((prev) => [...newItems, ...prev]);
                      }}
                      onUpdateAsset={(updatedAsset) =>
                        setMediaAssets((prev) =>
                          prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a))
                        )
                      }
                      onDeleteAsset={(asset) => {
                        setMediaAssets((prev) => prev.filter((a) => a.id !== asset.id));
                        if (asset.url.startsWith('idb://')) {
                          void deleteMediaBlobFromIdb(asset.url.slice('idb://'.length));
                        }
                        onToast(`Removed "${asset.name}" from Media Library`, 'info');
                      }}
                      onInsertAssetToCanvas={handleInsertMediaAsset}
                      onApplyAssetToSelected={handleApplyMediaToSelected}
                      onToast={onToast}
                    />
                  )}

                  {activeRailItem !== 'widget-palette' &&
                    activeRailItem !== 'theme-palette' &&
                    activeRailItem !== 'cloud-sync' &&
                    activeRailItem !== 'page-selector' &&
                    activeRailItem !== 'widget-tree' &&
                    activeRailItem !== 'search' &&
                    activeRailItem !== 'actions' &&
                    activeRailItem !== 'triggers' &&
                    activeRailItem !== 'media-assets' && (
                    <>
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-xs font-bold text-slate-200">
                          {lang === 'si'
                            ? WEB_STUDIO_CATEGORIES.find((c) => c.id === activeCategory)?.siLabel
                            : WEB_STUDIO_CATEGORIES.find((c) => c.id === activeCategory)?.label}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {lang === 'si' ? 'ක්ලික් / අදින්න' : 'Click or drag'}
                        </span>
                      </div>

                      {/* Quick Block Search Input */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={paletteSearch}
                          onChange={(e) => setPaletteSearch(e.target.value)}
                          placeholder={lang === 'si' ? 'බ්ලොක් සොයන්න...' : 'Search all blocks...'}
                          className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-[#090B10] border border-white/10 focus:border-[#4D97FF] text-[11px] text-white placeholder-slate-500 outline-none"
                        />
                        {paletteSearch && (
                          <button
                            type="button"
                            onClick={() => setPaletteSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 pb-6">
                        {(() => {
                          const query = paletteSearch.trim().toLowerCase();
                          const filtered = query
                            ? WEB_STUDIO_BLOCK_TEMPLATES.filter(
                                (t) =>
                                  t.name.toLowerCase().includes(query) ||
                                  t.siName.toLowerCase().includes(query) ||
                                  t.group.toLowerCase().includes(query) ||
                                  t.type.toLowerCase().includes(query)
                              )
                            : categoryTemplates;

                          if (filtered.length === 0) {
                            return (
                              <p className="text-[11px] text-slate-500 text-center py-6">
                                No blocks match &ldquo;{paletteSearch}&rdquo;
                              </p>
                            );
                          }

                          let lastGroup = '';
                          return filtered.map((tpl) => {
                            const catMeta = WEB_STUDIO_CATEGORIES.find(
                              (c) => c.id === tpl.studioCategory
                            )!;
                            const groupLabel = lang === 'si' ? tpl.siGroup : tpl.group;
                            const showGroupHeader = groupLabel !== lastGroup;
                            lastGroup = groupLabel;
                            return (
                              <React.Fragment key={tpl.id}>
                                {showGroupHeader && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-1.5 pb-0.5 block">
                                    {groupLabel}
                                  </span>
                                )}
                                <div
                                  draggable
                                  onDragStart={(e) => handlePaletteDragStart(e, tpl)}
                                  onClick={() => handleAddTemplateBlock(tpl)}
                                  style={{
                                    backgroundColor: catMeta.color,
                                    borderColor: catMeta.borderColor,
                                  }}
                                  className={`relative px-3 py-2 border shadow-sm cursor-grab active:cursor-grabbing hover:brightness-105 transition-all select-none ${
                                    tpl.isHatBlock
                                      ? 'rounded-b-lg rounded-tr-lg rounded-tl-2xl border-t-4 border-t-white/40'
                                      : 'rounded-lg'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-white truncate">
                                      {lang === 'si' ? tpl.siName : tpl.name}
                                    </span>
                                    <Plus className="w-3.5 h-3.5 text-white/80 shrink-0" />
                                  </div>
                                  <p className="text-[10px] text-white/85 truncate mt-0.5">
                                    {tpl.defaultContent}
                                  </p>
                                </div>
                              </React.Fragment>
                            );
                          });
                        })()}
                      </div>
                    </>
                  )}
                </aside>

                {/* 3c. Center Dotted Visual Blueprint Stack Canvas + HTML Toggle */}
                <main
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (canvasDropIndex === null) {
                      setCanvasDropIndex(blocks.length);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setCanvasDropIndex(null);
                    }
                  }}
                  onDrop={handleCanvasDrop}
                  className="flex-1 relative overflow-auto bg-[#0A0D13] flex flex-col"
                  style={{
                    backgroundImage:
                      htmlViewMode === 'visual'
                        ? 'radial-gradient(rgba(255, 255, 255, 0.14) 1.2px, transparent 1.2px)'
                        : undefined,
                    backgroundSize: '24px 24px',
                  }}
                >
                  {/* Top Canvas Mode Switcher + MS Word / PowerPoint / CapCut Ribbon */}
                  <div className="sticky top-0 z-10 bg-[#0A0D13]/95 backdrop-blur-xs border-b border-white/10">
                    <div className="px-4 py-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-orange-400 font-semibold truncate">
                        {activePage?.slug || 'index'}.html · {blocks.length} elements
                      </span>
                      <div className="flex items-center gap-1 bg-[#11151E] border border-white/10 rounded-lg p-0.5 text-[11px] shrink-0">
                        <button
                          type="button"
                          onClick={() => setHtmlViewMode('visual')}
                          className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                            htmlViewMode === 'visual'
                              ? 'bg-orange-500/20 text-orange-300'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Visual Blocks
                        </button>
                        <button
                          type="button"
                          onClick={() => setHtmlViewMode('inspector')}
                          className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                            htmlViewMode === 'inspector'
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span>Inspector</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHtmlViewMode('logic')}
                          className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                            htmlViewMode === 'logic'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Zap className="w-3 h-3" />
                          <span>
                            Logic Blocks{activeLogicFlows.length > 0 ? ` (${activeLogicFlows.length})` : ''}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHtmlViewMode('code')}
                          className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                            htmlViewMode === 'code'
                              ? 'bg-orange-500/20 text-orange-300'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          &lt;&gt; HTML Code
                        </button>
                      </div>
                    </div>

                    {htmlViewMode !== 'code' && htmlViewMode !== 'logic' && (
                      <ProInspectorRibbon
                        lang={lang}
                        selectedBlock={selectedBlock}
                        copiedStyle={copiedBlockStyle}
                        isInspectorOpen={htmlViewMode === 'inspector'}
                        onUpdateBlock={handleUpdateBlock}
                        onCopyStyle={handleCopyBlockStyle}
                        onPasteStyle={handlePasteBlockStyle}
                        onOpenFullInspector={() =>
                          setHtmlViewMode((m) => (m === 'inspector' ? 'visual' : 'inspector'))
                        }
                        onResetStyle={handleResetBlockStyle}
                      />
                    )}
                  </div>

                  {htmlViewMode === 'logic' ? (
                    <BackendLogicWorkspace
                      lang={lang}
                      pages={pages}
                      activePage={activePage}
                      blocks={blocks}
                      flows={activeLogicFlows}
                      selectedFlowId={selectedFlowId}
                      runtimeState={runtimeState}
                      cloudConfig={cloudConfig}
                      onSelectFlow={(flowId) => setSelectedFlowId(flowId)}
                      onCreateFlow={handleCreateLogicFlow}
                      onUpdateFlow={(updatedFlow) =>
                        commitLogicFlows(
                          (prev) => prev.map((f) => (f.id === updatedFlow.id ? updatedFlow : f)),
                          false
                        )
                      }
                      onDeleteFlow={(flowId) => {
                        commitLogicFlows((prev) => {
                          const next = prev.filter((f) => f.id !== flowId);
                          if (selectedFlowId === flowId) {
                            setSelectedFlowId(next[0]?.id || null);
                          }
                          return next;
                        });
                        onToast('Deleted backend logic flow', 'info');
                      }}
                      onDuplicateFlow={(flow) => {
                        const copy: LogicFlowRule = {
                          ...flow,
                          id: `flow_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                          name: `${flow.name} (Copy)`,
                          steps: flow.steps.map((s) => ({
                            ...s,
                            id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                          })),
                        };
                        commitLogicFlows((prev) => [...prev, copy]);
                        setSelectedFlowId(copy.id);
                        onToast(`Duplicated "${flow.name}"`, 'success');
                      }}
                      onRunFlowTest={(flow) => executeSingleLogicFlow(flow, formInputs, 'Test')}
                      onBackToVisual={() => setHtmlViewMode('visual')}
                      onOpenCodeView={() => setHtmlViewMode('code')}
                    />
                  ) : htmlViewMode === 'inspector' ? (
                    <div className="flex-1 overflow-y-auto">
                      <ProBlockInspector
                        lang={lang}
                        blocks={blocks}
                        pages={pages}
                        selectedBlock={selectedBlock}
                        copiedStyle={copiedBlockStyle}
                        onSelectBlock={(id) => setSelectedBlockId(id)}
                        onUpdateBlock={handleUpdateBlock}
                        onMoveBlock={handleMoveBlock}
                        onDuplicateBlock={handleDuplicateBlock}
                        onDeleteBlock={handleDeleteBlock}
                        onCopyStyle={handleCopyBlockStyle}
                        onPasteStyle={handlePasteBlockStyle}
                        onBulkApplyStyle={handleBulkApplyBlockStyle}
                        onResetStyle={handleResetBlockStyle}
                        onToast={onToast}
                      />
                    </div>
                  ) : htmlViewMode === 'visual' ? (
                    <div
                      className="min-h-full p-5 max-w-2xl w-full mx-auto space-y-2 origin-top"
                      style={{ transform: `scale(${zoomLevel})` }}
                    >
                      {blocks.length === 0 ? (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCanvasDropIndex(0);
                          }}
                          onDrop={(e) => void handleDropAtIndex(e, 0)}
                          className={`h-64 flex flex-col items-center justify-center border border-dashed rounded-2xl transition-colors ${
                            canvasDropIndex !== null
                              ? 'border-[#4D97FF] bg-[#4D97FF]/10 text-[#60A5FA]'
                              : 'border-white/15 text-slate-500'
                          }`}
                        >
                          <p className="text-xs font-semibold text-slate-300">
                            {lang === 'si'
                              ? 'වම් පසින් බ්ලොක් එකක් හෝ Photo එකක් මෙතැනට අදින්න'
                              : 'Click or drag any HTML block or photo here'}
                          </p>
                        </div>
                      ) : (
                        <>
                          {blocks.map((blk, idx) => {
                            const catMeta = getCategoryMetaForBlockType(blk.type);
                            const isSelected = blk.id === selectedBlock?.id;
                            const isBeingDragged = draggingCanvasBlockId === blk.id;
                            const showTopBar = canvasDropIndex === idx;
                            return (
                              <React.Fragment key={blk.id}>
                                {showTopBar && (
                                  <div
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onDrop={(e) => void handleDropAtIndex(e, idx)}
                                    className="h-2.5 rounded-full bg-[#4D97FF] shadow-[0_0_12px_rgba(77,151,255,0.8)] flex items-center justify-center transition-all"
                                  >
                                    <span className="px-2 py-0.5 rounded bg-[#0A0D13] border border-[#4D97FF] text-[9px] font-bold text-[#60A5FA] uppercase tracking-wider">
                                      Drop Block Here
                                    </span>
                                  </div>
                                )}
                                <div
                                  draggable
                                  onDragStart={(e) => handleCanvasBlockDragStart(e, blk.id)}
                                  onDragEnd={() => {
                                    setDraggingCanvasBlockId(null);
                                    setCanvasDropIndex(null);
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const midY = rect.top + rect.height / 2;
                                    setCanvasDropIndex(e.clientY < midY ? idx : idx + 1);
                                  }}
                                  onDrop={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const midY = rect.top + rect.height / 2;
                                    void handleDropAtIndex(e, e.clientY < midY ? idx : idx + 1);
                                  }}
                                  onClick={() => setSelectedBlockId(blk.id)}
                                  className={`rounded-xl bg-[#131822] border transition-all cursor-pointer p-3 ${
                                    isBeingDragged ? 'opacity-45 scale-[0.99]' : ''
                                  } ${
                                    isSelected
                                      ? 'border-[#4D97FF] ring-2 ring-[#4D97FF]/30 shadow-lg'
                                      : 'border-white/10 hover:border-white/25'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span
                                        title="Drag to reorder"
                                        className="text-slate-500 hover:text-white cursor-grab active:cursor-grabbing shrink-0"
                                      >
                                        <GripVertical className="w-3.5 h-3.5" />
                                      </span>
                                      <span
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: catMeta.color }}
                                      />
                                      <span className="text-xs font-bold text-white truncate">
                                        {blk.name}
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-500">
                                        {blk.type}
                                      </span>
                                    </div>

                                    <div
                                      className="flex items-center gap-1 shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedBlockId(blk.id);
                                          setHtmlViewMode('inspector');
                                        }}
                                        title="Open Pro Inspector (MS Word / PowerPoint / CapCut)"
                                        className="px-1.5 py-1 rounded bg-sky-500/15 hover:bg-sky-500/30 border border-sky-400/25 text-sky-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                                      >
                                        <SlidersHorizontal className="w-3 h-3" />
                                        <span>Inspect</span>
                                      </button>
                                      <button
                                        type="button"
                                        disabled={idx === 0}
                                        onClick={() => handleMoveBlock(blk.id, -1)}
                                        title="Move Up"
                                        className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 disabled:opacity-30 cursor-pointer"
                                      >
                                        <ArrowUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={idx === blocks.length - 1}
                                        onClick={() => handleMoveBlock(blk.id, 1)}
                                        title="Move Down"
                                        className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 disabled:opacity-30 cursor-pointer"
                                      >
                                        <ArrowDown className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteBlock(blk.id)}
                                        title="Delete Block"
                                        className="p-1 rounded bg-white/5 hover:bg-rose-600/80 text-slate-300 hover:text-white cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <input
                                        type="text"
                                        value={
                                          blk.type === 'ui-stat'
                                            ? blk.statValue ?? blk.content
                                            : blk.content
                                        }
                                        placeholder="Primary text..."
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedBlockId(blk.id);
                                        }}
                                        onChange={(e) =>
                                          handleUpdateBlock(
                                            blk.type === 'ui-stat'
                                              ? {
                                                  ...blk,
                                                  content: e.target.value,
                                                  statValue: e.target.value,
                                                }
                                              : { ...blk, content: e.target.value }
                                          )
                                        }
                                        className="flex-1 min-w-[160px] bg-[#0A0D13] border border-white/10 focus:border-[#4D97FF] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                                      />
                                      {blk.action && (
                                        <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                                          <Zap className="w-3 h-3" />
                                          {blk.action}
                                        </span>
                                      )}
                                      {blk.apiEndpoint && (
                                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                                          <Server className="w-3 h-3" />
                                          {blk.apiEndpoint}
                                        </span>
                                      )}
                                    </div>

                                    {(blk.type === 'ui-image' ||
                                      blk.type === 'ui-avatar' ||
                                      blk.type === 'ui-card' ||
                                      blk.type === 'ui-stack' ||
                                      blk.type === 'ui-media-display' ||
                                      blk.type === 'ui-aspect-ratio' ||
                                      blk.type === 'ui-blur') && (
                                      <div
                                        className="flex items-center gap-2 pt-0.5"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {blk.imageUrl && (
                                          <img
                                            src={blk.imageUrl}
                                            alt=""
                                            className="w-8 h-8 rounded object-cover border border-white/15 shrink-0"
                                          />
                                        )}
                                        <label className="px-2 py-1 rounded bg-sky-600/80 hover:bg-sky-500 text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer shrink-0">
                                          <Upload className="w-3 h-3" />
                                          <span>{blk.imageUrl ? 'Change Photo' : 'Upload Photo'}</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              e.target.value = '';
                                              if (!file) return;
                                              try {
                                                const url = await readAndCompressImageFile(file);
                                                handleUpdateBlock({ ...blk, imageUrl: url });
                                                onToast(`Uploaded photo "${file.name}"`, 'success');
                                              } catch (err) {
                                                onToast(
                                                  err instanceof Error
                                                    ? err.message
                                                    : 'Failed to load image',
                                                  'error'
                                                );
                                              }
                                            }}
                                          />
                                        </label>
                                        {blk.imageUrl && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleUpdateBlock({ ...blk, imageUrl: '' })
                                            }
                                            className="px-2 py-1 rounded bg-white/5 hover:bg-rose-500/30 text-[10px] text-slate-300 cursor-pointer"
                                          >
                                            Clear
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    {(blk.type === 'ui-video' ||
                                      blk.type === 'ui-audio-player' ||
                                      blk.type === 'ui-media-display' ||
                                      blk.type === 'ui-pdf-viewer') && (
                                      <div
                                        className="flex items-center gap-1.5 pt-0.5"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <input
                                          type="text"
                                          value={blk.videoUrl || ''}
                                          placeholder={
                                            blk.type === 'ui-audio-player'
                                              ? 'MP3 / Audio URL (optional)'
                                              : blk.type === 'ui-pdf-viewer'
                                              ? 'PDF File URL (optional)'
                                              : 'YouTube URL (youtube.com/watch?v=... / youtu.be/...) or MP4 URL'
                                          }
                                          onChange={(e) =>
                                            handleUpdateBlock({ ...blk, videoUrl: e.target.value })
                                          }
                                          className="flex-1 bg-[#0A0D13] border border-sky-500/25 focus:border-[#4D97FF] rounded-lg px-2.5 py-1 text-[11px] text-sky-200 placeholder-slate-500 outline-none"
                                        />
                                      </div>
                                    )}

                                    {(blk.type === 'ui-icon' ||
                                      blk.type === 'ui-icon-button' ||
                                      blk.type === 'ui-list-tile' ||
                                      blk.type === 'ui-slidable-tile' ||
                                      blk.type === 'ui-toggle-icon' ||
                                      blk.type === 'ui-notification-badge') && (
                                      <div
                                        className="flex items-center gap-1 overflow-x-auto pb-1 pt-0.5"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {ICON_LIBRARY.slice(0, 12).map((ic) => {
                                          const active = (blk.iconName || 'sparkles') === ic.id;
                                          return (
                                            <button
                                              key={ic.id}
                                              type="button"
                                              onClick={() =>
                                                handleUpdateBlock({ ...blk, iconName: ic.id })
                                              }
                                              title={ic.label}
                                              className={`p-1.5 rounded-lg border shrink-0 cursor-pointer ${
                                                active
                                                  ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                                                  : 'bg-[#0A0D13] border-white/10 text-slate-400 hover:text-white'
                                              }`}
                                            >
                                              {renderVectorIcon(ic.id, 'w-3.5 h-3.5')}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {/* Secondary / Subtitle / Role / Badge Text Editor */}
                                    <div className="flex flex-wrap items-center gap-2">
                                      <input
                                        type="text"
                                        value={
                                          blk.type === 'ui-stat'
                                            ? blk.statLabel ?? blk.subtitle ?? ''
                                            : blk.subtitle || ''
                                        }
                                        placeholder={
                                          blk.type === 'ui-navbar'
                                            ? 'Nav links (e.g. Home · About · Contact)'
                                            : blk.type === 'ui-testimonial'
                                            ? 'Author name...'
                                            : blk.type === 'ui-input' || blk.type === 'ui-textarea'
                                            ? 'Field label...'
                                            : 'Subtitle / secondary text...'
                                        }
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedBlockId(blk.id);
                                        }}
                                        onChange={(e) =>
                                          handleUpdateBlock(
                                            blk.type === 'ui-stat'
                                              ? {
                                                  ...blk,
                                                  subtitle: e.target.value,
                                                  statLabel: e.target.value,
                                                }
                                              : { ...blk, subtitle: e.target.value }
                                          )
                                        }
                                        className="flex-1 min-w-[140px] bg-[#0B0E15] border border-white/5 focus:border-[#4D97FF] rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-600 outline-none"
                                      />
                                      {blk.type === 'ui-testimonial' && (
                                        <input
                                          type="text"
                                          value={blk.authorRole || ''}
                                          placeholder="Author role..."
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedBlockId(blk.id);
                                          }}
                                          onChange={(e) =>
                                            handleUpdateBlock({
                                              ...blk,
                                              authorRole: e.target.value,
                                            })
                                          }
                                          className="w-36 bg-[#0B0E15] border border-white/5 focus:border-[#4D97FF] rounded-lg px-2 py-1 text-[11px] text-slate-300 placeholder-slate-600 outline-none"
                                        />
                                      )}
                                      {(blk.type === 'ui-navbar' ||
                                        blk.type === 'ui-pricing' ||
                                        blk.type === 'ui-modal' ||
                                        blk.type === 'ui-section' ||
                                        blk.type === 'ui-list-tile' ||
                                        blk.type === 'ui-ad-banner' ||
                                        blk.type === 'ui-notification-badge' ||
                                        blk.type === 'ui-mux-broadcast' ||
                                        blk.type === 'ui-draggable' ||
                                        blk.type === 'logic-click' ||
                                        blk.type === 'logic-if') && (
                                        <input
                                          type="text"
                                          value={
                                            blk.badgeText ??
                                            (blk.type === 'ui-navbar'
                                              ? 'BC'
                                              : blk.type === 'ui-pricing'
                                              ? 'PRO'
                                              : blk.type === 'ui-modal'
                                              ? 'Open Dialog'
                                              : blk.type === 'ui-section'
                                              ? 'Section'
                                              : blk.type === 'logic-if'
                                              ? 'Eval'
                                              : 'Badge')
                                          }
                                          placeholder="Badge..."
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedBlockId(blk.id);
                                          }}
                                          onChange={(e) =>
                                            handleUpdateBlock({
                                              ...blk,
                                              badgeText: e.target.value,
                                            })
                                          }
                                          className="w-24 bg-[#0B0E15] border border-white/5 focus:border-[#4D97FF] rounded-lg px-2 py-1 text-[11px] font-mono text-sky-300 placeholder-slate-600 outline-none"
                                        />
                                      )}
                                    </div>

                                    {supportsMultiTextBoxes(blk) && (
                                      <MultiTextItemsEditor
                                        block={blk}
                                        onUpdateBlock={handleUpdateBlock}
                                        onSelectBlock={setSelectedBlockId}
                                        compact
                                        lang={lang}
                                      />
                                    )}
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })}
                          {canvasDropIndex === blocks.length && (
                            <div
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onDrop={(e) => void handleDropAtIndex(e, blocks.length)}
                              className="h-2.5 rounded-full bg-[#4D97FF] shadow-[0_0_12px_rgba(77,151,255,0.8)] flex items-center justify-center transition-all"
                            >
                              <span className="px-2 py-0.5 rounded bg-[#0A0D13] border border-[#4D97FF] text-[9px] font-bold text-[#60A5FA] uppercase tracking-wider">
                                Drop Block Here
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => copySnippet(htmlCode, 'index.html')}
                          className="px-3 py-1.5 rounded-lg bg-[#161B26] hover:bg-white/10 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy HTML
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadSnippet(htmlCode, 'html')}
                          className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Download .html
                        </button>
                      </div>
                      <pre className="flex-1 overflow-auto rounded-xl bg-[#05070B] border border-white/10 p-4 text-[11px] font-mono text-orange-200 leading-relaxed select-text">
                        {htmlCode}
                      </pre>
                    </div>
                  )}

                  {/* Floating Bottom-Right Zoom Controls */}
                  {htmlViewMode === 'visual' && (
                    <div className="fixed bottom-4 right-[445px] lg:right-[515px] z-20 flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.min(1.25, Number((z + 0.05).toFixed(2))))}
                        title="Zoom In"
                        className="w-8 h-8 rounded-full bg-[#161B26] hover:bg-[#1E2636] border border-white/15 shadow-lg flex items-center justify-center text-slate-200 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.max(0.75, Number((z - 0.05).toFixed(2))))}
                        title="Zoom Out"
                        className="w-8 h-8 rounded-full bg-[#161B26] hover:bg-[#1E2636] border border-white/15 shadow-lg flex items-center justify-center text-slate-200 cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(1)}
                        title="Reset Zoom"
                        className="w-8 h-8 rounded-full bg-[#161B26] hover:bg-[#1E2636] border border-white/15 shadow-lg flex items-center justify-center text-slate-200 cursor-pointer"
                      >
                        <Equal className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </main>
              </>
            )}

            {/* TAB 2: CSS (PAGE COLOUR, LIVE ANIMATIONS, ELEMENT STYLING & styles.css) */}
            {activeTab === 'css' && (
              <div className="flex-1 flex min-h-0 overflow-hidden bg-[#0A0D13]">
                {/* Left CSS Controls & Element Selectors */}
                <aside className="w-[225px] bg-[#11151E] border-r border-white/10 p-3 overflow-y-auto shrink-0 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between pb-1 border-b border-white/10">
                      <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                        {lang === 'si' ? 'පිටු සැකසුම්' : 'Page & Live FX'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCssSection('page-style')}
                      className={`w-full text-left px-2.5 py-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                        cssSection === 'page-style'
                          ? 'bg-[#1A2438] border-sky-400/70 text-white font-semibold'
                          : 'bg-[#161B26] border-white/5 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Droplets className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-[11px]">
                          {lang === 'si' ? 'පිටුවේ වර්ණ (Page Color)' : 'Page Colour & Theme'}
                        </p>
                        <p className="truncate text-[10px] font-mono text-slate-500">
                          body / :root
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCssSection('live-animations')}
                      className={`w-full text-left px-2.5 py-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                        cssSection === 'live-animations'
                          ? 'bg-[#1A2438] border-purple-400/70 text-white font-semibold'
                          : 'bg-[#161B26] border-white/5 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Wand2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px]">
                          {lang === 'si' ? 'සජීවීකරණ (Animations)' : 'Live Animations'}
                        </p>
                        <p className="truncate text-[10px] font-mono text-slate-500">
                          {activePageStyle.liveAnimation && activePageStyle.liveAnimation !== 'none'
                            ? activePageStyle.liveAnimation
                            : '@keyframes'}
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between pb-1 border-b border-white/10">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        CSS Selectors
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{blocks.length}</span>
                    </div>
                    <div className="space-y-1">
                      {blocks.map((b, i) => {
                        const active = cssSection === 'element' && b.id === selectedBlock?.id;
                        const meta = getCategoryMetaForBlockType(b.type);
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setSelectedBlockId(b.id);
                              setCssSection('element');
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                              active
                                ? 'bg-[#1A2438] border-sky-400/70 text-white font-semibold'
                                : 'bg-[#161B26] border-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: meta.color }}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-[11px]">{b.name}</p>
                              <p className="truncate text-[10px] font-mono text-slate-500">
                                .sl-block-{i + 1}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </aside>

                {/* Main CSS Inspector + Generated styles.css */}
                <div className="flex-1 p-5 overflow-y-auto space-y-5">
                  <div className="max-w-3xl mx-auto space-y-5">
                    {/* MODE A: PAGE COLOUR & BACKGROUND SETTINGS */}
                    {cssSection === 'page-style' && (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                          <div>
                            <span className="text-[11px] font-mono text-sky-400 uppercase">
                              Page Background &amp; Colour Settings · /{activePage?.slug || 'index'}
                            </span>
                            <h2 className="text-lg font-bold text-white">
                              {lang === 'si' ? 'පිටුවේ වර්ණ සහ පසුබිම' : 'Page Colour & Theme'}
                            </h2>
                          </div>
                          <div className="flex items-center gap-2">
                            {pages.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdatePageStyle(activePageStyle, true);
                                  onToast('Applied page colours to all pages!', 'success');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white cursor-pointer"
                              >
                                Apply to All Pages
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={handleResetPageStyle}
                              className="px-3 py-1.5 rounded-lg bg-[#161B26] hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-300 cursor-pointer"
                            >
                              Reset Page CSS
                            </button>
                          </div>
                        </div>

                        {/* Quick Page Theme Presets */}
                        <div className="bg-[#11151E] p-4 rounded-2xl border border-white/10 space-y-3 text-xs">
                          <span className="text-slate-300 font-semibold block">
                            {lang === 'si' ? 'වේගවත් පිටු වර්ණ තේමා' : 'Curated Page Themes'}
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {PAGE_THEME_PRESETS.map((preset) => {
                              const bgPreview = resolvePageBackgroundCss(preset.settings);
                              const isCurrent =
                                (activePageStyle.backgroundType || 'solid') ===
                                  preset.settings.backgroundType &&
                                (preset.settings.backgroundType === 'solid'
                                  ? (activePageStyle.backgroundColor || '#090B10').toLowerCase() ===
                                    preset.settings.backgroundColor?.toLowerCase()
                                  : activePageStyle.gradientFrom?.toLowerCase() ===
                                      preset.settings.gradientFrom?.toLowerCase() &&
                                    activePageStyle.gradientTo?.toLowerCase() ===
                                      preset.settings.gradientTo?.toLowerCase());
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => handleUpdatePageStyle(preset.settings)}
                                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                    isCurrent
                                      ? 'border-sky-400 bg-[#1A2438]'
                                      : 'border-white/10 bg-[#090B10] hover:border-white/25'
                                  }`}
                                >
                                  <div
                                    className="w-full h-8 rounded-lg border border-white/15 mb-1.5"
                                    style={{ background: bgPreview }}
                                  />
                                  <p className="font-semibold text-[11px] text-white truncate">
                                    {lang === 'si' ? preset.siName : preset.name}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Custom Background Mode + Pickers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#11151E] p-4 rounded-2xl border border-white/10 text-xs">
                          <div className="space-y-1.5">
                            <label className="text-slate-400 font-semibold block">
                              Background Mode
                            </label>
                            <div className="flex items-center gap-1 bg-[#090B10] p-1 rounded-lg border border-white/15">
                              {(['solid', 'gradient'] as const).map((mode) => (
                                <button
                                  key={mode}
                                  type="button"
                                  onClick={() => handleUpdatePageStyle({ backgroundType: mode })}
                                  className={`flex-1 py-1.5 rounded text-xs font-semibold capitalize cursor-pointer ${
                                    (activePageStyle.backgroundType || 'solid') === mode
                                      ? 'bg-sky-500 text-slate-950 font-bold'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {mode === 'solid' ? 'Solid Colour' : 'Gradient'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {(activePageStyle.backgroundType || 'solid') === 'solid' ? (
                            <div className="space-y-1.5">
                              <label className="text-slate-400 font-semibold block">
                                Page Background Colour
                              </label>
                              <label className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#090B10] border border-white/15 cursor-pointer">
                                <span className="font-mono text-slate-200">
                                  {activePageStyle.backgroundColor || '#090B10'}
                                </span>
                                <input
                                  type="color"
                                  value={activePageStyle.backgroundColor || '#090B10'}
                                  onChange={(e) =>
                                    handleUpdatePageStyle({
                                      backgroundType: 'solid',
                                      backgroundColor: e.target.value,
                                    })
                                  }
                                  className="w-6 h-5 bg-transparent border-0 cursor-pointer p-0"
                                />
                              </label>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <label className="text-slate-400 font-semibold block">
                                Gradient Direction
                              </label>
                              <select
                                value={activePageStyle.gradientDirection || 'to bottom right'}
                                onChange={(e) =>
                                  handleUpdatePageStyle({
                                    gradientDirection: e.target.value as PageStyleSettings['gradientDirection'],
                                  })
                                }
                                className="w-full px-3 py-2 rounded-lg bg-[#090B10] border border-white/15 text-slate-200 outline-none cursor-pointer"
                              >
                                <option value="to bottom">Top to Bottom</option>
                                <option value="to bottom right">Diagonal</option>
                                <option value="to right">Left to Right</option>
                                <option value="radial">Radial Spotlight</option>
                              </select>
                            </div>
                          )}

                          {activePageStyle.backgroundType === 'gradient' && (
                            <>
                              <div className="space-y-1.5">
                                <label className="text-slate-400 font-semibold block">
                                  Gradient Start Colour
                                </label>
                                <label className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#090B10] border border-white/15 cursor-pointer">
                                  <span className="font-mono text-slate-200">
                                    {activePageStyle.gradientFrom || '#050816'}
                                  </span>
                                  <input
                                    type="color"
                                    value={activePageStyle.gradientFrom || '#050816'}
                                    onChange={(e) =>
                                      handleUpdatePageStyle({
                                        backgroundType: 'gradient',
                                        gradientFrom: e.target.value,
                                      })
                                    }
                                    className="w-6 h-5 bg-transparent border-0 cursor-pointer p-0"
                                  />
                                </label>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-slate-400 font-semibold block">
                                  Gradient End Colour
                                </label>
                                <label className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#090B10] border border-white/15 cursor-pointer">
                                  <span className="font-mono text-slate-200">
                                    {activePageStyle.gradientTo || '#1b1444'}
                                  </span>
                                  <input
                                    type="color"
                                    value={activePageStyle.gradientTo || '#1b1444'}
                                    onChange={(e) =>
                                      handleUpdatePageStyle({
                                        backgroundType: 'gradient',
                                        gradientTo: e.target.value,
                                      })
                                    }
                                    className="w-6 h-5 bg-transparent border-0 cursor-pointer p-0"
                                  />
                                </label>
                              </div>
                            </>
                          )}

                          <div className="space-y-1.5">
                            <label className="text-slate-400 font-semibold block">
                              Default Page Text Colour
                            </label>
                            <label className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#090B10] border border-white/15 cursor-pointer">
                              <span className="font-mono text-slate-200">
                                {activePageStyle.textColor || '#f1f5f9'}
                              </span>
                              <input
                                type="color"
                                value={activePageStyle.textColor || '#f1f5f9'}
                                onChange={(e) =>
                                  handleUpdatePageStyle({ textColor: e.target.value })
                                }
                                className="w-6 h-5 bg-transparent border-0 cursor-pointer p-0"
                              />
                            </label>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-slate-400 font-semibold block">
                              Site Accent / Brand Colour
                            </label>
                            <label className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#090B10] border border-white/15 cursor-pointer">
                              <span className="font-mono text-slate-200">
                                {activePageStyle.accentColor || '#4D97FF'}
                              </span>
                              <input
                                type="color"
                                value={activePageStyle.accentColor || '#4D97FF'}
                                onChange={(e) =>
                                  handleUpdatePageStyle({ accentColor: e.target.value })
                                }
                                className="w-6 h-5 bg-transparent border-0 cursor-pointer p-0"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODE B: LIVE ANIMATIONS (METEORS / උල්කාපාත / STARFIELD / AURORA / PARTICLES) */}
                    {cssSection === 'live-animations' && (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                          <div>
                            <span className="text-[11px] font-mono text-purple-400 uppercase">
                              Live CSS Animations · @keyframes
                            </span>
                            <h2 className="text-lg font-bold text-white">
                              {lang === 'si'
                                ? 'සජීවී පසුබිම් සජීවීකරණ (උල්කාපාත ආදිය)'
                                : 'Live Background Animations'}
                            </h2>
                          </div>
                          {pages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdatePageStyle(
                                  {
                                    liveAnimation: activePageStyle.liveAnimation || 'none',
                                    animationColor: activePageStyle.animationColor,
                                    animationSpeed: activePageStyle.animationSpeed,
                                    animationDensity: activePageStyle.animationDensity,
                                  },
                                  true
                                );
                                onToast('Applied live animation to all pages!', 'success');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white cursor-pointer"
                            >
                              Apply to All Pages
                            </button>
                          )}
                        </div>

                        {/* Animation Effect Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {LIVE_ANIMATION_PRESETS.map((anim) => {
                            const active =
                              (activePageStyle.liveAnimation || 'none') === anim.id;
                            return (
                              <button
                                key={anim.id}
                                type="button"
                                onClick={() =>
                                  handleUpdatePageStyle({
                                    liveAnimation: anim.id,
                                    animationColor:
                                      activePageStyle.animationColor || anim.defaultColor,
                                  })
                                }
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                  active
                                    ? 'bg-[#1A2438] border-purple-400 shadow-lg'
                                    : 'bg-[#11151E] border-white/10 hover:border-white/25'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-white">
                                    {lang === 'si' ? anim.siName : anim.name}
                                  </span>
                                  {active && (
                                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                                  {anim.description}
                                </p>
                              </button>
                            );
                          })}
                        </div>

                        {/* Speed, Density & Effect Color Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#11151E] p-4 rounded-2xl border border-white/10 text-xs">
                          <div className="space-y-1.5">
                            <label className="text-slate-400 font-semibold block">
                              Effect Colour
                            </label>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {['#818cf8', '#38bdf8', '#fbbf24', '#34d399', '#fb7185', '#ffffff'].map(
                                (hex) => (
                                  <button
                                    key={hex}
                                    type="button"
                                    onClick={() =>
                                      handleUpdatePageStyle({ animationColor: hex })
                                    }
                                    className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                                      (activePageStyle.animationColor || '#818cf8').toLowerCase() ===
                                      hex.toLowerCase()
                                        ? 'border-purple-400 scale-110'
                                        : 'border-white/20'
                                    }`}
                                    style={{ backgroundColor: hex }}
                                  />
                                )
                              )}
                              <input
                                type="color"
                                value={activePageStyle.animationColor || '#818cf8'}
                                onChange={(e) =>
                                  handleUpdatePageStyle({ animationColor: e.target.value })
                                }
                                title="Pick custom animation colour"
                                className="w-7 h-6 bg-transparent border-0 cursor-pointer p-0"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-slate-400 font-semibold block">Speed</label>
                            <div className="flex items-center gap-1 bg-[#090B10] p-1 rounded-lg border border-white/15">
                              {(['slow', 'normal', 'fast'] as const).map((sp) => (
                                <button
                                  key={sp}
                                  type="button"
                                  onClick={() => handleUpdatePageStyle({ animationSpeed: sp })}
                                  className={`flex-1 py-1 rounded text-[11px] capitalize cursor-pointer ${
                                    (activePageStyle.animationSpeed || 'normal') === sp
                                      ? 'bg-purple-500 text-white font-bold'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {sp}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-slate-400 font-semibold block">Density</label>
                            <div className="flex items-center gap-1 bg-[#090B10] p-1 rounded-lg border border-white/15">
                              {(['low', 'medium', 'high'] as const).map((dn) => (
                                <button
                                  key={dn}
                                  type="button"
                                  onClick={() => handleUpdatePageStyle({ animationDensity: dn })}
                                  className={`flex-1 py-1 rounded text-[11px] capitalize cursor-pointer ${
                                    (activePageStyle.animationDensity || 'medium') === dn
                                      ? 'bg-purple-500 text-white font-bold'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {dn}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODE C: INDIVIDUAL ELEMENT CSS INSPECTOR */}
                    {cssSection === 'element' &&
                      (!selectedBlock ? (
                        <p className="text-xs text-slate-400">
                          Select an HTML element to style its CSS.
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div>
                              <span className="text-[11px] font-mono text-sky-400 uppercase">
                                CSS Style Rules · {selectedBlock.type}
                              </span>
                              <h2 className="text-lg font-bold text-white">{selectedBlock.name}</h2>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  style: {},
                                })
                              }
                              className="px-3 py-1.5 rounded-lg bg-[#161B26] hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-300 cursor-pointer"
                            >
                              Reset CSS
                            </button>
                          </div>

                          {/* Visual CSS Properties Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#11151E] p-4 rounded-2xl border border-white/10 text-xs">
                        {/* Font Family */}
                        <div className="space-y-1.5">
                          <label className="text-slate-400 font-semibold">Font Family</label>
                          <div className="flex flex-wrap gap-1">
                            {FONT_OPTIONS.map((ff) => (
                              <button
                                key={ff.id}
                                type="button"
                                onClick={() =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    style: { ...selectedBlock.style, fontFamily: ff.id },
                                  })
                                }
                                className={`px-2.5 py-1 rounded border text-[11px] cursor-pointer ${
                                  (selectedBlock.style?.fontFamily || 'sans') === ff.id
                                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                                    : 'bg-[#090B10] border-white/10 text-slate-300 hover:border-white/25'
                                }`}
                              >
                                {ff.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Font Weight */}
                        <div className="space-y-1.5">
                          <label className="text-slate-400 font-semibold">Font Weight</label>
                          <div className="flex flex-wrap gap-1">
                            {(
                              [
                                { id: 'normal', label: '400' },
                                { id: 'medium', label: '500' },
                                { id: 'semibold', label: '600' },
                                { id: 'bold', label: '700' },
                                { id: 'extrabold', label: '800' },
                              ] as const
                            ).map((fw) => (
                              <button
                                key={fw.id}
                                type="button"
                                onClick={() =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    style: { ...selectedBlock.style, fontWeight: fw.id },
                                  })
                                }
                                className={`px-2.5 py-1 rounded border text-[11px] font-mono cursor-pointer ${
                                  selectedBlock.style?.fontWeight === fw.id
                                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                                    : 'bg-[#090B10] border-white/10 text-slate-300 hover:border-white/25'
                                }`}
                              >
                                {fw.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Font Size */}
                        <div className="space-y-1.5">
                          <label className="text-slate-400 font-semibold">Font Size</label>
                          <div className="flex flex-wrap gap-1">
                            {(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'] as const).map((sz) => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    style: { ...selectedBlock.style, fontSize: sz },
                                  })
                                }
                                className={`px-2 py-1 rounded border text-[11px] font-mono cursor-pointer ${
                                  selectedBlock.style?.fontSize === sz
                                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                                    : 'bg-[#090B10] border-white/10 text-slate-300 hover:border-white/25'
                                }`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Text Alignment */}
                        <div className="space-y-1.5">
                          <label className="text-slate-400 font-semibold">Text Align</label>
                          <div className="flex items-center gap-1 bg-[#090B10] p-1 rounded-lg border border-white/15">
                            {(['left', 'center', 'right'] as const).map((align) => (
                              <button
                                key={align}
                                type="button"
                                onClick={() =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    style: { ...selectedBlock.style, textAlign: align },
                                  })
                                }
                                className={`flex-1 py-1.5 rounded flex items-center justify-center cursor-pointer ${
                                  selectedBlock.style?.textAlign === align
                                    ? 'bg-sky-500 text-slate-950'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                {align === 'left' ? (
                                  <AlignLeft className="w-3.5 h-3.5" />
                                ) : align === 'center' ? (
                                  <AlignCenter className="w-3.5 h-3.5" />
                                ) : (
                                  <AlignRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Primary Font Color + Custom Color Picker */}
                        <div className="space-y-1.5">
                          <label className="text-slate-400 font-semibold">Font Color</label>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[
                              { cls: 'text-white', hex: '#ffffff', label: 'White' },
                              { cls: 'text-slate-300', hex: '#cbd5e1', label: 'Slate' },
                              { cls: 'text-indigo-400', hex: '#818cf8', label: 'Indigo' },
                              { cls: 'text-sky-400', hex: '#38bdf8', label: 'Sky' },
                              { cls: 'text-emerald-400', hex: '#34d399', label: 'Emerald' },
                              { cls: 'text-amber-300', hex: '#fcd34d', label: 'Amber' },
                              { cls: 'text-rose-400', hex: '#fb7185', label: 'Rose' },
                            ].map((c) => (
                              <button
                                key={c.cls}
                                type="button"
                                title={c.label}
                                onClick={() =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    style: {
                                      ...selectedBlock.style,
                                      textColor: c.cls,
                                      customTextHex: c.hex,
                                    },
                                  })
                                }
                                className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                                  selectedBlock.style?.customTextHex === c.hex ||
                                  selectedBlock.style?.textColor === c.cls
                                    ? 'border-sky-400 scale-110'
                                    : 'border-white/20'
                                }`}
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                            <label
                              title="Pick any font color"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#090B10] border border-white/15 cursor-pointer text-[10px] font-mono text-slate-300"
                            >
                              <input
                                type="color"
                                value={selectedBlock.style?.customTextHex || '#ffffff'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    style: {
                                      ...selectedBlock.style,
                                      customTextHex: e.target.value,
                                    },
                                  })
                                }
                                className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0"
                              />
                              <span>{selectedBlock.style?.customTextHex || 'Custom'}</span>
                            </label>
                          </div>
                        </div>

                        {/* Subtitle Color + Surface Background */}
                        <div className="space-y-1.5">
                          <label className="text-slate-400 font-semibold">
                            Subtitle Color &amp; Surface BG
                          </label>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <label
                              title="Pick subtitle text color"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#090B10] border border-white/15 cursor-pointer text-[10px] font-mono text-slate-300"
                            >
                              <input
                                type="color"
                                value={selectedBlock.style?.subtitleColorHex || '#94a3b8'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    style: {
                                      ...selectedBlock.style,
                                      subtitleColorHex: e.target.value,
                                    },
                                  })
                                }
                                className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0"
                              />
                              <span>Sub</span>
                            </label>
                            {[
                              { cls: 'bg-transparent', hex: 'transparent', label: 'None' },
                              { cls: 'bg-white/5', hex: '#1a202c', label: 'Glass' },
                              { cls: 'bg-[#161B26]', hex: '#161B26', label: 'Carbon' },
                              { cls: 'bg-indigo-600', hex: '#4f46e5', label: 'Indigo' },
                              { cls: 'bg-emerald-950/30', hex: '#064e3b', label: 'Emerald' },
                              { cls: 'bg-rose-950/30', hex: '#4c0519', label: 'Rose' },
                            ].map((bg) => (
                              <button
                                key={bg.cls}
                                type="button"
                                title={bg.label}
                                onClick={() =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    style: {
                                      ...selectedBlock.style,
                                      bgColor: bg.cls,
                                      customBgHex: undefined,
                                    },
                                  })
                                }
                                className={`w-6 h-6 rounded-md border-2 cursor-pointer ${
                                  !selectedBlock.style?.customBgHex &&
                                  selectedBlock.style?.bgColor === bg.cls
                                    ? 'border-sky-400 scale-110'
                                    : 'border-white/20'
                                }`}
                                style={{
                                  backgroundColor: bg.hex === 'transparent' ? '#090B10' : bg.hex,
                                }}
                              />
                            ))}
                            <label
                              title="Pick custom background color"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#090B10] border border-white/15 cursor-pointer text-[10px] font-mono text-slate-300"
                            >
                              <input
                                type="color"
                                value={selectedBlock.style?.customBgHex || '#11151e'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    style: {
                                      ...selectedBlock.style,
                                      customBgHex: e.target.value,
                                    },
                                  })
                                }
                                className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0"
                              />
                              <span>BG</span>
                            </label>
                          </div>
                        </div>

                        {/* Border Radius */}
                        <div className="space-y-1.5">
                          <label className="text-slate-400 font-semibold">Border Radius</label>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { cls: 'rounded-none', label: '0px' },
                              { cls: 'rounded-lg', label: '8px' },
                              { cls: 'rounded-xl', label: '12px' },
                              { cls: 'rounded-2xl', label: '16px' },
                              { cls: 'rounded-full', label: 'Full' },
                            ].map((r) => (
                              <button
                                key={r.cls}
                                type="button"
                                onClick={() =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    style: { ...selectedBlock.style, borderRadius: r.cls },
                                  })
                                }
                                className={`px-2 py-1 rounded border text-[11px] font-mono cursor-pointer ${
                                  selectedBlock.style?.borderRadius === r.cls
                                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                                    : 'bg-[#090B10] border-white/10 text-slate-300'
                                }`}
                              >
                                {r.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Padding */}
                        <div className="space-y-1.5">
                          <label className="text-slate-400 font-semibold">Padding</label>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { cls: 'p-0', label: '0' },
                              { cls: 'p-2', label: '8px' },
                              { cls: 'p-3', label: '12px' },
                              { cls: 'p-4', label: '16px' },
                              { cls: 'p-5', label: '20px' },
                            ].map((p) => (
                              <button
                                key={p.cls}
                                type="button"
                                onClick={() =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    style: { ...selectedBlock.style, padding: p.cls },
                                  })
                                }
                                className={`px-2 py-1 rounded border text-[11px] font-mono cursor-pointer ${
                                  selectedBlock.style?.padding === p.cls
                                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                                    : 'bg-[#090B10] border-white/10 text-slate-300'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Width & Height */}
                        <div className="space-y-1.5">
                          <label className="text-slate-400 font-semibold">Width / Height</label>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={selectedBlock.style?.width || 'auto'}
                              onChange={(e) =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  style: {
                                    ...selectedBlock.style,
                                    width: e.target.value === 'auto' ? undefined : e.target.value,
                                  },
                                })
                              }
                              className="px-2 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-slate-200 outline-none cursor-pointer"
                            >
                              <option value="auto">Width: Auto</option>
                              <option value="100%">Width: 100%</option>
                              <option value="75%">Width: 75%</option>
                              <option value="50%">Width: 50%</option>
                              <option value="320px">Width: 320px</option>
                            </select>
                            <select
                              value={selectedBlock.style?.height || 'auto'}
                              onChange={(e) =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  style: {
                                    ...selectedBlock.style,
                                    height: e.target.value === 'auto' ? undefined : e.target.value,
                                  },
                                })
                              }
                              className="px-2 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-slate-200 outline-none cursor-pointer"
                            >
                              <option value="auto">Height: Auto</option>
                              <option value="120px">Min-H: 120px</option>
                              <option value="200px">Min-H: 200px</option>
                              <option value="320px">Min-H: 320px</option>
                            </select>
                          </div>
                        </div>

                        {/* Margin, Custom Class & Show/Hide Toggle */}
                        <div className="space-y-1.5">
                          <label className="text-slate-400 font-semibold">
                            Margin, CSS Class &amp; Visibility
                          </label>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <select
                              value={selectedBlock.style?.margin || ''}
                              onChange={(e) =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  style: {
                                    ...selectedBlock.style,
                                    margin: e.target.value || undefined,
                                  },
                                })
                              }
                              className="px-2 py-1 rounded-lg bg-[#090B10] border border-white/15 text-slate-200 outline-none cursor-pointer"
                            >
                              <option value="">Margin: 0</option>
                              <option value="8px 0">Margin: 8px</option>
                              <option value="16px 0">Margin: 16px</option>
                              <option value="24px 0">Margin: 24px</option>
                            </select>
                            <input
                              type="text"
                              value={selectedBlock.style?.customClass || ''}
                              onChange={(e) =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  style: { ...selectedBlock.style, customClass: e.target.value },
                                })
                              }
                              placeholder="Custom CSS class..."
                              className="flex-1 min-w-[100px] px-2 py-1 rounded-lg bg-[#090B10] border border-white/15 text-sky-300 font-mono outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  style: {
                                    ...selectedBlock.style,
                                    isHidden: !selectedBlock.style?.isHidden,
                                  },
                                })
                              }
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                                selectedBlock.style?.isHidden
                                  ? 'bg-rose-500/20 border-rose-400/50 text-rose-300'
                                  : 'bg-[#090B10] border-white/15 text-slate-200 hover:border-sky-400/50'
                              }`}
                            >
                              {selectedBlock.style?.isHidden ? (
                                <>
                                  <EyeOff className="w-3 h-3" /> Hidden
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" /> Visible
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                          </div>
                        </>
                      ))}

                    {/* Live Generated styles.css Preview */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-sky-400">
                          styles.css (Live Output)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copySnippet(cssCode, 'styles.css')}
                            className="px-2.5 py-1 rounded-lg bg-[#161B26] hover:bg-white/10 border border-white/15 text-[11px] font-semibold text-white flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" /> Copy CSS
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadSnippet(cssCode, 'css')}
                            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-[11px] font-semibold text-white flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" /> Download .css
                          </button>
                        </div>
                      </div>
                      <pre className="max-h-64 overflow-auto rounded-xl bg-[#05070B] border border-white/10 p-4 text-[11px] font-mono text-sky-300 leading-relaxed select-text">
                        {cssCode}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: JAVASCRIPT (LOGIC BLOCKS, EVENT WIRING & script.js) */}
            {activeTab === 'js' && (
              <div className="flex-1 flex min-h-0 overflow-hidden bg-[#0A0D13]">
                {/* Left JS Logic & API Toolbox */}
                <aside className="w-[235px] bg-[#11151E] border-r border-white/10 p-3 overflow-y-auto shrink-0 space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                    <span className="text-xs font-bold text-amber-300">JS Logic &amp; API</span>
                    <span className="text-[10px] text-slate-500">Click to add</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {WEB_STUDIO_BLOCK_TEMPLATES.filter(
                      (t) => t.studioCategory === 'logic' || t.studioCategory === 'backend'
                    ).map((tpl) => {
                      const catMeta = WEB_STUDIO_CATEGORIES.find(
                        (c) => c.id === tpl.studioCategory
                      )!;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleAddTemplateBlock(tpl)}
                          style={{
                            backgroundColor: catMeta.color,
                            borderColor: catMeta.borderColor,
                          }}
                          className={`text-left px-3 py-2 border shadow-sm hover:brightness-105 transition-all cursor-pointer ${
                            tpl.isHatBlock
                              ? 'rounded-b-lg rounded-tr-lg rounded-tl-2xl border-t-4 border-t-white/40'
                              : 'rounded-lg'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-white truncate">
                              {lang === 'si' ? tpl.siName : tpl.name}
                            </span>
                            <Plus className="w-3.5 h-3.5 text-white/85 shrink-0" />
                          </div>
                          <p className="text-[10px] text-white/85 truncate mt-0.5">
                            {tpl.defaultContent}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                {/* Main JS Event Wiring & Generated script.js */}
                <div className="flex-1 p-5 overflow-y-auto space-y-5">
                  <div className="max-w-3xl mx-auto space-y-5">
                    {/* Quick Block / Navbar Selector Strip */}
                    {blocks.length > 0 && (
                      <div className="bg-[#11151E] p-3 rounded-2xl border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300 flex items-center gap-1.5">
                            <MousePointerClick className="w-3.5 h-3.5 text-amber-300" />
                            Select Button, Navbar, or Logic Block to Configure
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {blocks.length} elements on page
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {blocks.map((b) => {
                            const isSel = selectedBlock?.id === b.id;
                            const isInteractive =
                              b.type === 'ui-navbar' ||
                              b.type === 'ui-button' ||
                              b.type.startsWith('logic-') ||
                              b.type.startsWith('backend-') ||
                              Boolean(b.action);
                            return (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => setSelectedBlockId(b.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isSel
                                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                                    : isInteractive
                                    ? 'bg-[#171E2C] text-slate-100 border-white/15 hover:border-amber-400/50'
                                    : 'bg-[#090B10] text-slate-400 border-white/10 hover:text-white'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    b.type === 'ui-navbar'
                                      ? 'bg-sky-400'
                                      : b.type === 'ui-button' || b.type.startsWith('logic-')
                                      ? 'bg-amber-400'
                                      : b.type.startsWith('backend-')
                                      ? 'bg-emerald-400'
                                      : 'bg-slate-500'
                                  }`}
                                />
                                <span className="truncate max-w-[140px]">{b.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedBlock && selectedBlock.type === 'ui-navbar' && (
                      <div className="bg-[#11151E] p-4 rounded-2xl border border-sky-500/25 space-y-4 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
                          <div>
                            <span className="text-[10px] font-mono text-sky-400 uppercase flex items-center gap-1">
                              <Link2 className="w-3 h-3" /> Navbar Buttons &amp; Navigation Wiring
                            </span>
                            <h3 className="text-sm font-bold text-white">
                              {selectedBlock.content || selectedBlock.name}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const currentLinks = getEffectiveNavLinks(
                                selectedBlock,
                                pages,
                                blocks
                              );
                              const nextLinks: NavbarLinkItem[] = [
                                ...currentLinks,
                                {
                                  id: `nav_${Date.now()}`,
                                  label: `Button ${currentLinks.length + 1}`,
                                  action: pages.length > 1 ? 'navigate-page' : 'scroll-to-block',
                                  targetPageId: pages[0]?.id,
                                  targetBlockId: blocks.find((b) => b.id !== selectedBlock.id)?.id,
                                },
                              ];
                              handleUpdateBlock({
                                ...selectedBlock,
                                navLinks: nextLinks,
                                subtitle: nextLinks.map((l) => l.label).join(' · '),
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Nav Button
                          </button>
                        </div>

                        {(() => {
                          const effectiveLinks = getEffectiveNavLinks(
                            selectedBlock,
                            pages,
                            blocks
                          );
                          const updateNavLinkAt = (
                            idx: number,
                            patch: Partial<NavbarLinkItem>
                          ) => {
                            const next = effectiveLinks.map((item, i) =>
                              i === idx ? { ...item, ...patch } : item
                            );
                            handleUpdateBlock({
                              ...selectedBlock,
                              navLinks: next,
                              subtitle: next.map((l) => l.label).join(' · '),
                            });
                          };
                          const removeNavLinkAt = (idx: number) => {
                            const next = effectiveLinks.filter((_, i) => i !== idx);
                            handleUpdateBlock({
                              ...selectedBlock,
                              navLinks: next,
                              subtitle: next.map((l) => l.label).join(' · '),
                            });
                          };

                          return (
                            <div className="space-y-2.5">
                              {effectiveLinks.length === 0 && (
                                <p className="text-slate-400 text-center py-4">
                                  No navbar buttons yet. Click &ldquo;+ Add Nav Button&rdquo; above.
                                </p>
                              )}
                              {effectiveLinks.map((link, idx) => (
                                <div
                                  key={link.id}
                                  className="p-3 rounded-xl bg-[#090B10] border border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                                >
                                  <div className="sm:col-span-3 space-y-1">
                                    <label className="text-[10px] text-slate-500 font-semibold block">
                                      Button Text
                                    </label>
                                    <input
                                      type="text"
                                      value={link.label}
                                      onChange={(e) =>
                                        updateNavLinkAt(idx, { label: e.target.value })
                                      }
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none focus:border-sky-400"
                                    />
                                  </div>

                                  <div className="sm:col-span-4 space-y-1">
                                    <label className="text-[10px] text-slate-500 font-semibold block">
                                      When Clicked
                                    </label>
                                    <select
                                      value={link.action}
                                      onChange={(e) =>
                                        updateNavLinkAt(idx, {
                                          action: e.target.value as NavbarLinkAction,
                                        })
                                      }
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none focus:border-sky-400"
                                    >
                                      <option value="scroll-to-block">
                                        Scroll to Section / Block
                                      </option>
                                      <option value="navigate-page">Go to Page</option>
                                      <option value="open-url">Open URL / Link</option>
                                      <option value="alert">Show Message Toast</option>
                                    </select>
                                  </div>

                                  <div className="sm:col-span-4 space-y-1">
                                    <label className="text-[10px] text-slate-500 font-semibold block">
                                      {link.action === 'navigate-page'
                                        ? 'Target Page'
                                        : link.action === 'scroll-to-block'
                                        ? 'Target Section'
                                        : link.action === 'open-url'
                                        ? 'Link URL'
                                        : 'Notification Message'}
                                    </label>
                                    {link.action === 'navigate-page' ? (
                                      <select
                                        value={link.targetPageId || ''}
                                        onChange={(e) =>
                                          updateNavLinkAt(idx, {
                                            targetPageId: e.target.value,
                                          })
                                        }
                                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none"
                                      >
                                        <option value="">Select page...</option>
                                        {pages.map((p) => (
                                          <option key={p.id} value={p.id}>
                                            {p.name} ({p.slug}.html)
                                          </option>
                                        ))}
                                      </select>
                                    ) : link.action === 'scroll-to-block' ? (
                                      <select
                                        value={link.targetBlockId || ''}
                                        onChange={(e) =>
                                          updateNavLinkAt(idx, {
                                            targetBlockId: e.target.value,
                                          })
                                        }
                                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none"
                                      >
                                        <option value="">Select block...</option>
                                        {blocks
                                          .filter((b) => b.id !== selectedBlock.id)
                                          .map((b) => (
                                            <option key={b.id} value={b.id}>
                                              {b.name} — {(b.content || '').slice(0, 22)}
                                            </option>
                                          ))}
                                      </select>
                                    ) : link.action === 'open-url' ? (
                                      <input
                                        type="text"
                                        value={link.url || ''}
                                        onChange={(e) =>
                                          updateNavLinkAt(idx, { url: e.target.value })
                                        }
                                        placeholder="https://example.com"
                                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-sky-300 outline-none"
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={link.message || ''}
                                        onChange={(e) =>
                                          updateNavLinkAt(idx, { message: e.target.value })
                                        }
                                        placeholder="Welcome to this section!"
                                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-amber-200 outline-none"
                                      />
                                    )}
                                  </div>

                                  <div className="sm:col-span-1 flex items-center justify-end gap-1 pt-3 sm:pt-4">
                                    <button
                                      type="button"
                                      onClick={() => handleTriggerNavLink(selectedBlock, link)}
                                      title="Test this navbar button"
                                      className="p-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/30 text-amber-300 cursor-pointer"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeNavLinkAt(idx)}
                                      title="Delete nav button"
                                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {selectedBlock && selectedBlock.type !== 'ui-navbar' && (
                      <div className="bg-[#11151E] p-4 rounded-2xl border border-white/10 space-y-4 text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <div>
                            <span className="text-[10px] font-mono text-amber-300 uppercase">
                              JavaScript Logic &amp; Event Configurator · {selectedBlock.type}
                            </span>
                            <h3 className="text-sm font-bold text-white">{selectedBlock.name}</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTriggerAction(selectedBlock)}
                            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" /> Test / Run
                          </button>
                        </div>

                        {/* Specialized Logic / Data / Backend Editors */}
                        {(selectedBlock.type === 'logic-click' ||
                          selectedBlock.type === 'logic-oninput') && (
                          <div className="p-3 rounded-xl bg-[#090B10] border border-amber-500/20 space-y-1.5">
                            <label className="text-[10px] text-amber-300 font-semibold block">
                              {selectedBlock.type === 'logic-click'
                                ? 'Triggered When Button Clicked (Source Button)'
                                : 'Triggered When Input Changes (Source Field)'}
                            </label>
                            <select
                              value={selectedBlock.logicConfig?.triggerSourceId || ''}
                              onChange={(e) =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  logicConfig: {
                                    ...selectedBlock.logicConfig,
                                    triggerSourceId: e.target.value || undefined,
                                  },
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none"
                            >
                              <option value="">
                                {selectedBlock.type === 'logic-click'
                                  ? 'Any Button on Page'
                                  : 'Any Input Field on Page'}
                              </option>
                              {blocks
                                .filter((b) =>
                                  selectedBlock.type === 'logic-click'
                                    ? b.type === 'ui-button'
                                    : b.type === 'ui-input' ||
                                      b.type === 'ui-textarea' ||
                                      b.type === 'ui-select' ||
                                      b.type === 'ui-checkbox'
                                )
                                .map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.name} — &quot;{(b.content || b.subtitle || b.type).slice(0, 28)}&quot;
                                  </option>
                                ))}
                            </select>
                            {selectedBlock.type === 'logic-oninput' && (
                              <div className="pt-1 space-y-1">
                                <label className="text-[10px] text-slate-400">
                                  Sync Typed Value Into Variable Name (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={selectedBlock.logicConfig?.varName ?? ''}
                                  placeholder="e.g. searchQuery or userName"
                                  onChange={(e) =>
                                    handleUpdateBlock({
                                      ...selectedBlock,
                                      logicConfig: {
                                        ...selectedBlock.logicConfig,
                                        varName: e.target.value,
                                      },
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-amber-200 font-mono outline-none"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {selectedBlock.type === 'logic-onkey' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#090B10] border border-amber-500/20">
                            <div className="space-y-1">
                              <label className="text-[10px] text-amber-300 font-semibold">
                                Trigger Key
                              </label>
                              <select
                                value={selectedBlock.triggerKey || 'Enter'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    triggerKey: e.target.value as 'Enter' | 'Space' | 'Escape',
                                  })
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none"
                              >
                                <option value="Enter">Enter Key</option>
                                <option value="Space">Space Bar</option>
                                <option value="Escape">Escape Key</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-amber-300 font-semibold">
                                Trigger Message
                              </label>
                              <input
                                type="text"
                                value={selectedBlock.actionPayload || ''}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    actionPayload: e.target.value,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-amber-200 outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {selectedBlock.type === 'logic-timer' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#090B10] border border-amber-500/20">
                            <div className="space-y-1">
                              <label className="text-[10px] text-amber-300 font-semibold">
                                Countdown Seconds
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={3600}
                                value={selectedBlock.logicConfig?.timerSeconds ?? selectedBlock.counterValue ?? 10}
                                onChange={(e) => {
                                  const secs = Math.max(1, Number(e.target.value) || 10);
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    counterValue: secs,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      timerSeconds: secs,
                                    },
                                  });
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-amber-200 font-mono outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-amber-300 font-semibold">
                                Completion Message
                              </label>
                              <input
                                type="text"
                                value={selectedBlock.actionPayload || 'Timer completed!'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    actionPayload: e.target.value,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {selectedBlock.type === 'logic-if' && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#090B10] border border-amber-500/20">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Left (Var or Value)</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.leftOperand ?? 'score'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      leftOperand: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white font-mono outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Operator</label>
                              <select
                                value={selectedBlock.logicConfig?.operator ?? '>='}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      operator: e.target.value as BlockLogicConfig['operator'],
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-amber-300 font-mono outline-none"
                              >
                                <option value="==">== (Equals)</option>
                                <option value="!=">!= (Not Equal)</option>
                                <option value=">">&gt; (Greater)</option>
                                <option value="<">&lt; (Less)</option>
                                <option value=">=">&gt;= (Greater/Eq)</option>
                                <option value="<=">&lt;= (Less/Eq)</option>
                                <option value="contains">contains</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Right Value</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.rightOperand ?? '10'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      rightOperand: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white font-mono outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Logical Gate</label>
                              <select
                                value={selectedBlock.logicConfig?.combinator ?? 'NONE'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      combinator: e.target.value as BlockLogicConfig['combinator'],
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none"
                              >
                                <option value="NONE">Single Check</option>
                                <option value="AND">AND (2nd Check)</option>
                                <option value="OR">OR (2nd Check)</option>
                                <option value="NOT">NOT (Invert)</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-emerald-400">Then Message</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.thenMessage ?? ''}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      thenMessage: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-emerald-300 outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-rose-400">Else Message</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.elseMessage ?? ''}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      elseMessage: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-rose-300 outline-none"
                              />
                            </div>
                            {(selectedBlock.logicConfig?.combinator === 'AND' ||
                              selectedBlock.logicConfig?.combinator === 'OR') && (
                              <>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-amber-300">2nd Left Var</label>
                                  <input
                                    type="text"
                                    value={selectedBlock.logicConfig?.secondLeft ?? 'isLoggedIn'}
                                    onChange={(e) =>
                                      handleUpdateBlock({
                                        ...selectedBlock,
                                        logicConfig: {
                                          ...selectedBlock.logicConfig,
                                          secondLeft: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white font-mono outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-amber-300">2nd Operator</label>
                                  <select
                                    value={selectedBlock.logicConfig?.secondOp ?? '=='}
                                    onChange={(e) =>
                                      handleUpdateBlock({
                                        ...selectedBlock,
                                        logicConfig: {
                                          ...selectedBlock.logicConfig,
                                          secondOp: e.target.value as BlockLogicConfig['secondOp'],
                                        },
                                      })
                                    }
                                    className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-amber-300 font-mono outline-none"
                                  >
                                    <option value="==">==</option>
                                    <option value="!=">!=</option>
                                    <option value=">">&gt;</option>
                                    <option value="<">&lt;</option>
                                    <option value=">=">&gt;=</option>
                                    <option value="<=">&lt;=</option>
                                    <option value="contains">contains</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-amber-300">2nd Right Val</label>
                                  <input
                                    type="text"
                                    value={selectedBlock.logicConfig?.secondRight ?? 'true'}
                                    onChange={(e) =>
                                      handleUpdateBlock({
                                        ...selectedBlock,
                                        logicConfig: {
                                          ...selectedBlock.logicConfig,
                                          secondRight: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white font-mono outline-none"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {selectedBlock.type === 'logic-loop' && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#090B10] border border-amber-500/20">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Loop Mode</label>
                              <select
                                value={selectedBlock.logicConfig?.loopMode ?? 'repeat'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      loopMode: e.target.value as BlockLogicConfig['loopMode'],
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none"
                              >
                                <option value="repeat">Repeat N Times</option>
                                <option value="foreach">For Each in List</option>
                                <option value="while">While Condition</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Repeat Count</label>
                              <input
                                type="number"
                                value={selectedBlock.logicConfig?.repeatCount ?? 5}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      repeatCount: Number(e.target.value) || 1,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white font-mono outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">List Name</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.listName ?? 'tasks'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      listName: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-amber-200 font-mono outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {selectedBlock.type === 'logic-variable' && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#090B10] border border-amber-500/20">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Variable Name</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.varName ?? 'score'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      varName: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white font-mono outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Operation</label>
                              <select
                                value={selectedBlock.logicConfig?.varOp ?? 'set'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      varOp: e.target.value as BlockLogicConfig['varOp'],
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none"
                              >
                                <option value="set">Set Variable To</option>
                                <option value="change">Change Variable By</option>
                                <option value="toggle">Toggle Boolean (!val)</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Value / Delta</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.varValue ?? '10'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      varValue: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-amber-200 font-mono outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {selectedBlock.type === 'logic-list' && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#090B10] border border-amber-500/20">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">List Name</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.listName ?? 'tasks'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      listName: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white font-mono outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">List Action</label>
                              <select
                                value={selectedBlock.logicConfig?.listOp ?? 'add'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      listOp: e.target.value as BlockLogicConfig['listOp'],
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none"
                              >
                                <option value="add">Add Item to List</option>
                                <option value="remove">Remove Item at Index</option>
                                <option value="get">Get Item at Index</option>
                                <option value="length">Length of List</option>
                                <option value="create">Create / Reset List</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">
                                {selectedBlock.logicConfig?.listOp === 'remove' ||
                                selectedBlock.logicConfig?.listOp === 'get'
                                  ? 'Index (0-based)'
                                  : 'Item Value'}
                              </label>
                              {selectedBlock.logicConfig?.listOp === 'remove' ||
                              selectedBlock.logicConfig?.listOp === 'get' ? (
                                <input
                                  type="number"
                                  value={selectedBlock.logicConfig?.listIndex ?? 0}
                                  onChange={(e) =>
                                    handleUpdateBlock({
                                      ...selectedBlock,
                                      logicConfig: {
                                        ...selectedBlock.logicConfig,
                                        listIndex: Number(e.target.value) || 0,
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-amber-200 font-mono outline-none"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={selectedBlock.logicConfig?.varValue ?? 'New Task'}
                                  onChange={(e) =>
                                    handleUpdateBlock({
                                      ...selectedBlock,
                                      logicConfig: {
                                        ...selectedBlock.logicConfig,
                                        varValue: e.target.value,
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-amber-200 outline-none"
                                />
                              )}
                            </div>
                          </div>
                        )}

                        {selectedBlock.type === 'logic-object' && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#090B10] border border-amber-500/20">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">JSON Mode</label>
                              <select
                                value={selectedBlock.logicConfig?.objectOp ?? 'get-prop'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      objectOp: e.target.value as BlockLogicConfig['objectOp'],
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none"
                              >
                                <option value="get-prop">Get Property [key]</option>
                                <option value="parse-json">Parse JSON</option>
                                <option value="stringify">Stringify JSON</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Property Key</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.objectKey ?? 'name'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      objectKey: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white font-mono outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">JSON Object</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.varValue ?? '{"name":"BlockCraft Studio"}'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      varValue: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-amber-200 font-mono outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {selectedBlock.type === 'logic-math-text' && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#090B10] border border-amber-500/20">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Operation</label>
                              <select
                                value={selectedBlock.logicConfig?.mathTextOp ?? 'random'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      mathTextOp: e.target.value as BlockLogicConfig['mathTextOp'],
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none"
                              >
                                <optgroup label="Math">
                                  <option value="add">Add (A + B)</option>
                                  <option value="sub">Subtract (A - B)</option>
                                  <option value="mul">Multiply (A * B)</option>
                                  <option value="div">Divide (A / B)</option>
                                  <option value="random">Random [A .. B]</option>
                                  <option value="round">Round (A)</option>
                                </optgroup>
                                <optgroup label="Text & Date">
                                  <option value="join">Join Text A + B</option>
                                  <option value="length">Length of Text A</option>
                                  <option value="contains">Text A Contains B?</option>
                                  <option value="upper">Convert to UPPERCASE</option>
                                  <option value="lower">Convert to lowercase</option>
                                  <option value="format-date">Format Current Date/Time</option>
                                </optgroup>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Arg A / Text 1</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.argA ?? '1'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      argA: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white font-mono outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Arg B / Text 2</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.argB ?? '100'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      argB: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-amber-200 font-mono outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {selectedBlock.type === 'backend-storage' && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#090B10] border border-emerald-500/20">
                            <div className="space-y-1">
                              <label className="text-[10px] text-emerald-300">Operation</label>
                              <select
                                value={selectedBlock.logicConfig?.storageOp ?? 'save'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      storageOp: e.target.value as BlockLogicConfig['storageOp'],
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none"
                              >
                                <option value="save">Save [key] with Data</option>
                                <option value="load">Load from [key]</option>
                                <option value="remove">Remove [key]</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Storage Key</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.storageKey ?? 'sl_user_data'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      storageKey: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-emerald-200 font-mono outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Value</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.varValue ?? ''}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      varValue: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {selectedBlock.type === 'backend-db' && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#090B10] border border-emerald-500/20">
                            <div className="space-y-1">
                              <label className="text-[10px] text-emerald-300">DB Action</label>
                              <select
                                value={selectedBlock.logicConfig?.dbOp ?? 'save'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      dbOp: e.target.value as BlockLogicConfig['dbOp'],
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none"
                              >
                                <option value="save">Save Data to Collection</option>
                                <option value="get">Get Data from Collection</option>
                                <option value="delete">Delete Latest Record</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Collection Name</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.collectionName ?? 'users'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      collectionName: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-emerald-200 font-mono outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Document JSON</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.varValue ?? '{"name":"Creator"}'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      varValue: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white font-mono outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {selectedBlock.type === 'backend-auth' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#090B10] border border-emerald-500/20">
                            <div className="space-y-1">
                              <label className="text-[10px] text-emerald-300">Auth Flow</label>
                              <select
                                value={selectedBlock.logicConfig?.authOp ?? 'login'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      authOp: e.target.value as BlockLogicConfig['authOp'],
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none"
                              >
                                <option value="signup">Sign Up with Email &amp; Password</option>
                                <option value="login">Login with Email &amp; Password</option>
                                <option value="logout">Logout User</option>
                                <option value="current-user">Get Current User</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">Demo Email</label>
                              <input
                                type="email"
                                value={selectedBlock.logicConfig?.varValue ?? 'creator@blockcraft.app'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      varValue: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-emerald-200 outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {selectedBlock.type === 'backend-device' && (
                          <div className="p-3 rounded-xl bg-[#090B10] border border-emerald-500/20 space-y-1">
                            <label className="text-[10px] text-emerald-300 font-semibold">
                              Device / Hardware Capability
                            </label>
                            <select
                              value={selectedBlock.logicConfig?.deviceOp ?? 'gps'}
                              onChange={(e) =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  logicConfig: {
                                    ...selectedBlock.logicConfig,
                                    deviceOp: e.target.value as BlockLogicConfig['deviceOp'],
                                  },
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-white outline-none"
                            >
                              <option value="gps">Get GPS Location (Geolocation)</option>
                              <option value="vibrate">Vibrate Device</option>
                              <option value="camera">Open Camera Check</option>
                            </select>
                          </div>
                        )}

                        {(selectedBlock.type === 'backend-fetch' ||
                          selectedBlock.type === 'backend-flask') && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#090B10] border border-emerald-500/20">
                            <div className="space-y-1">
                              <label className="text-[10px] text-emerald-300">HTTP Method</label>
                              <select
                                value={selectedBlock.httpMethod || 'GET'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    httpMethod: e.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE',
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-emerald-300 font-mono outline-none"
                              >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option>
                              </select>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <label className="text-[10px] text-slate-400">API URL / Path</label>
                              <input
                                type="text"
                                value={selectedBlock.apiEndpoint || '/api/v1/metrics'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    apiEndpoint: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-emerald-200 font-mono outline-none"
                              />
                            </div>
                            <div className="space-y-1 sm:col-span-3">
                              <label className="text-[10px] text-slate-400">Request JSON Body</label>
                              <input
                                type="text"
                                value={selectedBlock.requestBody || '{"plan":"pro"}'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    requestBody: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-[#11151E] border border-white/15 text-slate-200 font-mono outline-none"
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-slate-400 font-semibold">
                              onClick / Event Action
                            </label>
                            <select
                              value={selectedBlock.action || ''}
                              onChange={(e) =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  action: (e.target.value || undefined) as CanvasBlock['action'],
                                })
                              }
                              className="w-full px-3 py-2 rounded-lg bg-[#090B10] border border-white/15 text-white outline-none focus:border-amber-400"
                            >
                              <option value="">Auto / Default</option>
                              <optgroup label="Navigation & Modals">
                                <option value="navigate-page">Go to Page (Navigate)</option>
                                <option value="go-back">Go Back to Previous Page</option>
                                <option value="scroll-to-block">Scroll to Section / Block</option>
                                <option value="open-url">Open URL / Email Link</option>
                                <option value="open-modal">Open Modal / Popup</option>
                                <option value="close-modal">Close Modal / Popup</option>
                              </optgroup>
                              <optgroup label="User Input & Forms">
                                <option value="submit-form">Submit Form Inputs</option>
                                <option value="clear-form">Clear All Form Inputs</option>
                                <option value="validate-input">Validate Input Field</option>
                                <option value="get-input-value">Get Input Value into Variable</option>
                                <option value="set-input-value">Set Input Field Value</option>
                              </optgroup>
                              <optgroup label="DOM & Styling Manipulation">
                                <option value="change-text">Set Text of Target Element</option>
                                <option value="show-element">Show Target Element</option>
                                <option value="hide-element">Hide Target Element</option>
                                <option value="toggle-visibility">Toggle Accordion / Switch</option>
                                <option value="set-style">Set Style Property (CSS)</option>
                                <option value="add-class">Add CSS Class</option>
                                <option value="remove-class">Remove CSS Class</option>
                                <option value="toggle-disabled">Enable / Disable Button</option>
                              </optgroup>
                              <optgroup label="Variables, Lists & Counters">
                                <option value="increment-counter">Increment Counter (+1)</option>
                                <option value="set-variable">Set Variable Value</option>
                                <option value="toggle-boolean">Toggle Boolean State</option>
                                <option value="list-add">Add Item to List</option>
                                <option value="list-remove">Remove Last List Item</option>
                              </optgroup>
                              <optgroup label="Feedback, Storage & API">
                                <option value="alert">Show Notification Toast</option>
                                <option value="show-confirm">Show Confirm Dialog</option>
                                <option value="copy-clipboard">Copy Text to Clipboard</option>
                                <option value="console-log">Write to Runtime Console</option>
                                <option value="save-storage">Save to LocalStorage</option>
                                <option value="call-api">Fetch API Endpoint</option>
                              </optgroup>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-slate-400 font-semibold">
                              {selectedBlock.action === 'navigate-page'
                                ? 'Target Page'
                                : selectedBlock.action === 'submit-form' ||
                                  selectedBlock.action === 'show-confirm'
                                ? 'Message Text'
                                : selectedBlock.action === 'open-url'
                                ? 'Destination URL'
                                : selectedBlock.action === 'alert' ||
                                  selectedBlock.action === 'copy-clipboard' ||
                                  selectedBlock.action === 'console-log' ||
                                  selectedBlock.action === 'change-text' ||
                                  selectedBlock.action === 'set-input-value'
                                ? 'Payload / Value'
                                : selectedBlock.type.startsWith('backend-') ||
                                  selectedBlock.action === 'call-api'
                                ? 'API Endpoint'
                                : 'Target Element'}
                            </label>
                            {selectedBlock.action === 'navigate-page' ? (
                              <select
                                value={selectedBlock.targetPageId || ''}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    targetPageId: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-lg bg-[#090B10] border border-white/15 text-white outline-none"
                              >
                                <option value="">Select page...</option>
                                {pages.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.slug}.html)
                                  </option>
                                ))}
                              </select>
                            ) : selectedBlock.action === 'submit-form' ||
                              selectedBlock.action === 'open-url' ||
                              selectedBlock.action === 'alert' ||
                              selectedBlock.action === 'show-confirm' ||
                              selectedBlock.action === 'copy-clipboard' ||
                              selectedBlock.action === 'console-log' ||
                              selectedBlock.action === 'change-text' ||
                              selectedBlock.action === 'set-input-value' ? (
                              <input
                                type="text"
                                value={selectedBlock.actionPayload || ''}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    actionPayload: e.target.value,
                                  })
                                }
                                placeholder="Enter text, URL, or message..."
                                className="w-full px-3 py-2 rounded-lg bg-[#090B10] border border-white/15 text-amber-200 outline-none focus:border-amber-400"
                              />
                            ) : selectedBlock.type.startsWith('backend-') ||
                              selectedBlock.action === 'call-api' ? (
                              <input
                                type="text"
                                value={selectedBlock.apiEndpoint || '/api/v1/metrics'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    apiEndpoint: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-lg bg-[#090B10] border border-white/15 text-emerald-300 font-mono outline-none"
                              />
                            ) : (
                              <select
                                value={selectedBlock.targetId || ''}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    targetId: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-lg bg-[#090B10] border border-white/15 text-white outline-none"
                              >
                                <option value="">Auto-detect target block</option>
                                {blocks
                                  .filter((b) => b.id !== selectedBlock.id)
                                  .map((b) => (
                                    <option key={b.id} value={b.id}>
                                      {b.name} ({b.type})
                                    </option>
                                  ))}
                              </select>
                            )}
                          </div>
                        </div>

                        {selectedBlock.action === 'set-style' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">CSS Property</label>
                              <select
                                value={selectedBlock.logicConfig?.styleProp || 'backgroundColor'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      styleProp: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-white outline-none"
                              >
                                <option value="backgroundColor">backgroundColor</option>
                                <option value="color">color (Text Color)</option>
                                <option value="borderColor">borderColor</option>
                                <option value="opacity">opacity</option>
                                <option value="borderRadius">borderRadius</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">CSS Value</label>
                              <input
                                type="text"
                                value={selectedBlock.logicConfig?.styleValue ?? '#312e81'}
                                onChange={(e) =>
                                  handleUpdateBlock({
                                    ...selectedBlock,
                                    logicConfig: {
                                      ...selectedBlock.logicConfig,
                                      styleValue: e.target.value,
                                    },
                                  })
                                }
                                placeholder="#312e81 or 0.5"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-amber-200 font-mono outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {(selectedBlock.action === 'add-class' ||
                          selectedBlock.action === 'remove-class') && (
                          <div className="space-y-1 pt-2 border-t border-white/10">
                            <label className="text-[10px] text-slate-400">CSS Class Name</label>
                            <input
                              type="text"
                              value={selectedBlock.logicConfig?.cssClass ?? 'ring-2 ring-emerald-400'}
                              onChange={(e) =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  logicConfig: {
                                    ...selectedBlock.logicConfig,
                                    cssClass: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g. highlight-card"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-sky-200 font-mono outline-none"
                            />
                          </div>
                        )}

                        {selectedBlock.action === 'validate-input' && (
                          <div className="space-y-1 pt-2 border-t border-white/10">
                            <label className="text-[10px] text-slate-400">Validation Rule</label>
                            <select
                              value={selectedBlock.logicConfig?.validationRule || 'not-empty'}
                              onChange={(e) =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  logicConfig: {
                                    ...selectedBlock.logicConfig,
                                    validationRule: e.target.value as BlockLogicConfig['validationRule'],
                                  },
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-white outline-none"
                            >
                              <option value="not-empty">Required (Not Empty)</option>
                              <option value="email">Valid Email Format</option>
                              <option value="min-length">Min Length (6+ chars)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Live Runtime State & Console Inspector */}
                    <div className="bg-[#11151E] p-4 rounded-2xl border border-white/10 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" />
                          Live Runtime Variables, Lists &amp; Console
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setRuntimeState((prev) => ({ ...prev, consoleLogs: [] }))
                          }
                          className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                        >
                          Clear Console
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] font-mono">
                        <div className="p-2.5 rounded-xl bg-[#090B10] border border-white/10 space-y-1">
                          <div className="text-[10px] text-amber-300 font-bold uppercase">
                            Variables
                          </div>
                          {Object.entries(runtimeState.variables).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-slate-300">
                              <span>{k}:</span>
                              <span className="text-sky-300">{JSON.stringify(v)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#090B10] border border-white/10 space-y-1">
                          <div className="text-[10px] text-emerald-300 font-bold uppercase">
                            Lists &amp; Auth
                          </div>
                          {Object.entries(runtimeState.lists).map(([k, arr]) => (
                            <div key={k} className="text-slate-300 truncate">
                              {k} [{arr.length}]: {arr.join(', ')}
                            </div>
                          ))}
                          <div className="text-slate-400">
                            Auth: {runtimeState.authUser ? runtimeState.authUser.email : 'Signed out'}
                          </div>
                        </div>
                      </div>
                      {runtimeState.consoleLogs.length > 0 && (
                        <div className="max-h-28 overflow-y-auto p-2.5 rounded-xl bg-[#05070B] border border-white/10 space-y-1 font-mono text-[10px]">
                          {runtimeState.consoleLogs.map((log) => (
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

                    {/* Generated script.js / TSX / Flask Output */}
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1 bg-[#11151E] p-1 rounded-xl border border-white/10">
                          {(
                            [
                              { id: 'js', label: 'script.js' },
                              { id: 'react', label: 'React TSX' },
                              { id: 'flask', label: 'Python Flask' },
                            ] as const
                          ).map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setJsViewTarget(t.id)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                                jsViewTarget === t.id
                                  ? 'bg-amber-400 text-slate-950 font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              copySnippet(
                                activeJsPanelCode,
                                jsViewTarget === 'js'
                                  ? 'script.js'
                                  : jsViewTarget === 'react'
                                  ? 'React TSX'
                                  : 'Python Flask'
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-[#161B26] hover:bg-white/10 border border-white/15 text-[11px] font-semibold text-white flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              downloadSnippet(
                                activeJsPanelCode,
                                jsViewTarget === 'js'
                                  ? 'js'
                                  : jsViewTarget === 'react'
                                  ? 'tsx'
                                  : 'py'
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" /> Download
                          </button>
                        </div>
                      </div>

                      <pre className="max-h-72 overflow-auto rounded-xl bg-[#05070B] border border-white/10 p-4 text-[11px] font-mono text-amber-200 leading-relaxed select-text">
                        {activeJsPanelCode}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 4. RIGHT COLUMN: LIVE STAGE + BLOCK INSPECTOR / LAYERS ================= */}
        <aside
          className={`flex flex-col p-2 bg-[#0D1017] shrink-0 ${
            stageSize === 'fullscreen'
              ? 'flex-1 items-center justify-center'
              : stageWidthClass
          }`}
        >
          {/* 4a. LIVE INTERACTIVE WEB PREVIEW STAGE */}
          <div
            className={`w-full ${
              stageSize === 'fullscreen'
                ? viewport === 'desktop'
                  ? 'h-full'
                  : 'h-full max-w-5xl'
                : 'h-[54%]'
            } flex flex-col items-center justify-center bg-[#05070B] rounded-xl border border-white/15 overflow-hidden shadow-lg`}
          >
            {/* Browser Preview Frame respecting Desktop/Tablet/Mobile */}
            <div
              className={`h-full flex flex-col bg-[#090B10] transition-all duration-300 overflow-hidden ${
                viewport === 'mobile'
                  ? stageSize === 'fullscreen'
                    ? 'w-[390px] max-w-full border-x border-white/15'
                    : 'w-[280px] border-x border-white/15'
                  : viewport === 'tablet'
                  ? stageSize === 'fullscreen'
                    ? 'w-[768px] max-w-full border-x border-white/15'
                    : 'w-[375px] border-x border-white/15'
                  : 'w-full'
              }`}
            >
              {/* Slim Browser Bezel */}
              <div className="h-7 bg-[#11151E] border-b border-white/10 px-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500/80" />
                  <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[210px]">
                  preview.blockcraft.app/{activePage?.slug === 'index' ? '' : activePage?.slug} · {viewport}
                </span>
                <span className="text-[10px] font-mono text-emerald-400">Live</span>
              </div>

              {/* Multi-Page Route Bar inside Browser Frame when >1 pages */}
              {pages.length > 1 && (
                <div className="px-2.5 py-1 bg-[#0C1018] border-b border-white/10 flex items-center gap-1 overflow-x-auto shrink-0">
                  {pages.map((p) => {
                    const isActive = p.id === activePage?.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPage(p.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-[#2563EB] text-white'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Scrollable Interactive Rendered App */}
              <div className="flex-1 overflow-y-auto">
                <WebPreviewRenderer
                  blocks={blocks}
                  selectedBlockId={selectedBlock?.id || null}
                  onSelectBlock={setSelectedBlockId}
                  onTriggerAction={handleTriggerAction}
                  onTriggerNavLink={handleTriggerNavLink}
                  onUpdateBlock={handleUpdateBlock}
                  accentHex={themeConfig.accentHex}
                  pages={pages}
                  onSelectPage={handleSelectPage}
                  pageStyle={activePage?.pageStyle}
                  runtimeState={runtimeState}
                  formInputs={formInputs}
                  onFormInputChange={handleFormInputChange}
                  confirmDialog={confirmDialog}
                  onResolveConfirm={(accepted) => {
                    const pending = pendingConfirmActionRef.current;
                    pendingConfirmActionRef.current = null;
                    setConfirmDialog(null);
                    if (accepted && pending) {
                      pending();
                    } else if (!accepted) {
                      onToast('Action cancelled.', 'info');
                    }
                  }}
                  runningTimers={runningTimers}
                  onToggleTimer={(blk) =>
                    setRunningTimers((prev) => ({ ...prev, [blk.id]: !prev[blk.id] }))
                  }
                  onDropAtStageIndex={(payload, idx) => {
                    handleDropPayloadAtIndex(payload, idx);
                  }}
                  onDropChildInContainer={(containerId, payload) => {
                    handleDropChildInContainer(containerId, payload);
                  }}
                  onDismissSubmission={() =>
                    setRuntimeState((prev) => ({ ...prev, lastSubmission: null }))
                  }
                />
              </div>
            </div>
          </div>

          {/* 4b. BOTTOM BLOCK INSPECTOR + PAGE LAYERS COLUMN */}
          {stageSize !== 'fullscreen' && (
            <div className="flex-1 min-h-0 flex gap-2 mt-2">
              {/* Gemini AI Coding Agent Panel */}
              <div className="flex-1 bg-[#11151E] rounded-xl border border-white/10 flex flex-col overflow-hidden">
                <GeminiCodingAgentPanel
                  lang={lang}
                  projectName={projectName}
                  activePage={activePage}
                  blocks={blocks}
                  selectedBlock={selectedBlock}
                  activeTab={activeTab}
                  htmlCode={htmlCode}
                  cssCode={cssCode}
                  jsCode={jsCode}
                  reactCode={reactCode}
                  flaskCode={flaskCode}
                  onApplyAgentActions={handleApplyGeminiActions}
                  onToast={onToast}
                />
              </div>

              {/* Right Narrow Pages Column (Multi-Page Website Manager) */}
              <div className="w-[122px] bg-[#11151E] rounded-xl border border-white/10 flex flex-col justify-between p-2 relative shrink-0 overflow-hidden">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-200 pb-1.5 border-b border-white/10">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-[#60A5FA]" />
                    <span>{lang === 'si' ? 'පිටු' : 'Pages'}</span>
                  </span>
                  <span className="font-mono text-slate-400">{pages.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 py-1.5">
                  {pages.map((p) => {
                    const active = p.id === activePage?.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPage(p.id)}
                        className={`group w-full px-2 py-1.5 rounded-lg border text-[10px] cursor-pointer transition-colors flex items-center justify-between gap-1 ${
                          active
                            ? 'bg-[#1E2B45] border-[#4C97FF] text-white'
                            : 'bg-[#161B26] border-white/5 text-slate-400 hover:text-white hover:border-white/15'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                active ? 'bg-[#60A5FA]' : 'bg-slate-500'
                              }`}
                            />
                            <span className="font-semibold truncate">{p.name}</span>
                          </div>
                          <p className="text-[9px] font-mono text-slate-500 truncate pl-3">
                            /{p.slug} · {p.blocks.length}
                          </p>
                        </div>
                        {pages.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePage(p.id);
                            }}
                            title="Delete Page"
                            className="opacity-60 hover:opacity-100 text-slate-400 hover:text-rose-400 p-0.5 cursor-pointer shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNewPageName('');
                    setShowAddPageModal(true);
                  }}
                  title={lang === 'si' ? 'අලුත් පිටුවක් එක් කරන්න' : 'Add New Page'}
                  className="mt-1 w-full h-8 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] text-white flex items-center justify-center gap-1 cursor-pointer shrink-0 text-[11px] font-semibold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ================= MODALS ================= */}

      {/* Prebuilt Section Kit Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121620] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-white/15">
            <div className="bg-[#181E2B] border-b border-white/10 text-white px-5 py-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">Add BlockCraft Studio Section Bundle</h3>
              <button
                type="button"
                onClick={() => setShowSectionModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0B0E14]">
              {SECTION_BUNDLES.map((bundle) => (
                <button
                  key={bundle.id}
                  type="button"
                  onClick={() => {
                    const addedBlocks = bundle.types
                      .map((tp) => WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.type === tp))
                      .filter((x): x is WebStudioBlockTemplate => Boolean(x))
                      .map((tpl) => createCanvasBlockFromTemplate(tpl));
                    commitBlocks((prev) => [...prev, ...addedBlocks]);
                    if (addedBlocks[0]) setSelectedBlockId(addedBlocks[0].id);
                    setShowSectionModal(false);
                    onToast(`Added ${bundle.name} section!`, 'success');
                  }}
                  className="p-4 bg-[#161B26] rounded-xl border border-white/10 hover:border-[#4C97FF] text-left transition-all cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${bundle.color} mb-2 flex items-center justify-center text-white font-bold text-xs`}
                  >
                    +
                  </div>
                  <p className="text-xs font-bold text-slate-100">
                    {lang === 'si' ? bundle.siName : bundle.name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">{bundle.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add New Website Page Modal */}
      {showAddPageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121620] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-white/15">
            <div className="bg-[#181E2B] border-b border-white/10 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#60A5FA]" />
                <h3 className="text-sm font-bold">
                  {lang === 'si' ? 'අලුත් Website පිටුවක් එක් කරන්න' : 'Add New Website Page'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPageModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 bg-[#0B0E14]">
              <div className="space-y-1.5 text-xs">
                <label className="text-slate-400 font-semibold block">
                  {lang === 'si' ? 'පිටුවේ නම (Page Name)' : 'Page Name (e.g. About, Pricing, Contact)'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPageName}
                    onChange={(e) => setNewPageName(e.target.value)}
                    placeholder="e.g. About Us"
                    className="flex-1 px-3 py-2 rounded-lg bg-[#161B26] border border-white/15 text-white outline-none focus:border-[#4C97FF]"
                  />
                  <button
                    type="button"
                    onClick={() => handleCreatePage(newPageName || `Page ${pages.length + 1}`, 'blank')}
                    className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] text-white font-semibold cursor-pointer"
                  >
                    + Add Page
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {lang === 'si' ? 'හෝ Starter පිටුවක් තෝරන්න' : 'Or pick a starter page layout'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        handleCreatePage(
                          newPageName.trim() || preset.name,
                          preset.id as 'about' | 'services' | 'contact' | 'blank'
                        )
                      }
                      className="p-3 bg-[#161B26] hover:border-[#4C97FF] border border-white/10 rounded-xl text-left transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          {lang === 'si' ? preset.siName : preset.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#60A5FA]">/{preset.slug}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Format Export Code Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121620] rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-white/15 flex flex-col max-h-[85vh]">
            <div className="bg-[#181E2B] border-b border-white/10 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  Export Code — {projectName} ({activePage?.name || 'Home'} / {activePage?.slug || 'index'}.html)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-wrap items-center justify-between gap-2 bg-[#0D1017] border-b border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-1 bg-[#161B26] p-1 rounded-xl border border-white/10">
                  {(
                    [
                      { id: 'html', label: 'HTML5' },
                      { id: 'css', label: 'CSS' },
                      { id: 'js', label: 'JavaScript' },
                      { id: 'react', label: 'React TSX' },
                      { id: 'flask', label: 'Python Flask' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setExportTarget(t.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        exportTarget === t.id
                          ? 'bg-[#2563EB] text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {pages.length > 1 && (
                  <select
                    value={activePage?.id || ''}
                    onChange={(e) => handleSelectPage(e.target.value, false)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#161B26] border border-white/15 text-xs text-sky-300 outline-none cursor-pointer"
                  >
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>
                        Page: {p.name} ({p.slug}.html)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copySnippet(generatedCode, exportTarget.toUpperCase())}
                  className="px-3 py-1.5 rounded-lg bg-[#161B26] hover:bg-white/10 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedExport ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedExport ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadSnippet(
                      generatedCode,
                      exportTarget === 'html'
                        ? 'html'
                        : exportTarget === 'css'
                        ? 'css'
                        : exportTarget === 'js'
                        ? 'js'
                        : exportTarget === 'react'
                        ? 'tsx'
                        : 'py'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                {pages.length > 1 && exportTarget === 'html' && (
                  <button
                    type="button"
                    onClick={() => {
                      pages.forEach((pg, index) => {
                        setTimeout(() => {
                          const code = generateHtmlExport(
                            projectName,
                            pg.blocks,
                            pages,
                            pg.pageStyle,
                            cloudConfig,
                            pg.logicFlows || []
                          );
                          const blob = new Blob([code], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${pg.slug || 'page'}.html`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }, index * 180);
                      });
                      onToast(`Exported all ${pages.length} HTML pages!`, 'success');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>All Pages ({pages.length})</span>
                  </button>
                )}
              </div>
            </div>

            <pre className="flex-1 overflow-auto p-4 bg-[#05070B] text-[11px] font-mono text-sky-300 leading-relaxed select-text">
              {generatedCode}
            </pre>
          </div>
        </div>
      )}

      {/* Quick Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#121620] rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-white/15 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">BlockCraft Studio WebStudio Guide</h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2 text-slate-300 list-disc pl-4">
              <li>Use the HTML tab to drag &amp; drop blocks or inspect generated HTML5.</li>
              <li>Use the CSS tab to style typography, colors, radius, padding, and styles.css.</li>
              <li>Use the JavaScript tab to wire click events, counters, API routes, and script.js.</li>
              <li>Click Export Code in the header anytime to download HTML, CSS, JS, TSX, or Flask.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
