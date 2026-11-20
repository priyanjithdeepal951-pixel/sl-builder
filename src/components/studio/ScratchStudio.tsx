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
} from 'lucide-react';
import {
  BlockActionType,
  BlockLogicConfig,
  CanvasBlock,
  NavbarLinkAction,
  NavbarLinkItem,
  PageStyleSettings,
  Project,
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
import { ICON_LIBRARY } from '../../utils/mediaHelpers';
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
import {
  BLOCK_STYLE_TEMPLATES,
  BlockStyleTemplate,
  TemplateCategory,
  getTemplatesForBlockType,
} from '../../data/blockStyleTemplates';
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
  const [lang, setLang] = useState<'en' | 'si'>('en');
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [cssSection, setCssSection] = useState<'page-style' | 'live-animations' | 'element'>(
    'page-style'
  );
  const [htmlViewMode, setHtmlViewMode] = useState<'visual' | 'code'>('visual');
  const [activeCategory, setActiveCategory] = useState<WebStudioCategoryId>('layout');
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
  const [inspectorMode, setInspectorMode] = useState<'templates' | 'properties'>('templates');
  const [templateFilter, setTemplateFilter] = useState<'recommended' | TemplateCategory>('recommended');
  const [paletteSearch, setPaletteSearch] = useState('');
  const [runtimeState, setRuntimeState] = useState<StudioRuntimeState>(() => INITIAL_RUNTIME_STATE);
  const [formInputs, setFormInputs] = useState<Record<string, string>>({});
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [runningTimers, setRunningTimers] = useState<Record<string, boolean>>({});
  const [confirmDialog, setConfirmDialog] = useState<PreviewConfirmDialog | null>(null);
  const pendingConfirmActionRef = useRef<(() => void) | null>(null);
  const [canvasDropIndex, setCanvasDropIndex] = useState<number | null>(null);
  const [draggingCanvasBlockId, setDraggingCanvasBlockId] = useState<string | null>(null);

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
    setUndoStack([]);
    setFormInputs({});
    setPageHistory([]);
    setRunningTimers({});
    setConfirmDialog(null);
    setRuntimeState(INITIAL_RUNTIME_STATE);
  }, [project.id]);

  // Debounced persistence to App / Firestore
  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdateProject({
        ...project,
        name: projectName,
        blocks: pages[0]?.blocks || [],
        pages,
        updatedAt: 'Just now',
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [pages, projectName]);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];
  const blocks = activePage?.blocks || [];
  const activePageStyle: PageStyleSettings = activePage?.pageStyle || {};

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

    // 2. Reordering existing block
    const moveId = e.dataTransfer.getData('application/x-slbuilder-move-id');
    if (moveId) {
      handleMoveBlockToIndex(moveId, targetIndex);
      return;
    }

    // 3. New block from left palette
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
    },
    targetIndex: number
  ) => {
    setCanvasDropIndex(null);
    setDraggingCanvasBlockId(null);

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

  const handleFormInputChange = (blockId: string, value: string, fireInputEvent = true) => {
    const updatedInputs = { ...formInputs, [blockId]: value };
    setFormInputs(updatedInputs);
    if (!fireInputEvent) return;
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
        b.type === 'ui-file-upload'
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
          const newVal = actor.actionPayload || 'Hello from SL Builder';
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
        const parsed = JSON.parse(cfg?.varValue || '{"name":"SL Builder"}');
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
          const val = cfg?.varValue || 'Saved from SL Builder';
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
      const email = (cfg?.varValue || 'creator@slbuilder.app').trim();
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

    // 3. Standard Button / Link Auto-Smart Action Wiring
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

    // 4. Fire matching "When Button is Clicked" Hat blocks
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

  // Keyboard listener for logic-onkey hat blocks inside studio stage
  useEffect(() => {
    const keyHats = blocks.filter((b) => b.type === 'logic-onkey');
    if (keyHats.length === 0) return;
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
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [blocks]);

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

  // Execute "When Page Loads" hat blocks when navigating to a page
  useEffect(() => {
    const loadHats = latestBlocksRef.current.filter((b) => b.type === 'logic-onload');
    if (loadHats.length === 0) return;
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
            onToast('Invalid SL Builder blueprint file.', 'error');
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

  const htmlCode = generateHtmlExport(projectName, blocks, pages, activePage?.pageStyle);
  const cssCode = generateCssExport(projectName, blocks, activePage?.pageStyle);
  const jsCode = generateJsExport(projectName, blocks, pages);
  const reactCode = generateReactTsxExport(projectName, blocks, activePage?.pageStyle);
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

      {/* ================= 1. TOP BLACK SL BUILDER STUDIO BAR ================= */}
      <header className="h-12 bg-[#11151E] text-slate-100 px-3 flex items-center justify-between shrink-0 border-b border-white/10 shadow-md relative z-40">
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Back to Projects & SL BUILDER Wordmark */}
          <button
            type="button"
            onClick={onBackToProjects}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 transition-colors text-xs font-extrabold tracking-tight cursor-pointer whitespace-nowrap shrink-0"
            title="Back to Projects Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-300" />
            <span style={{ color: themeConfig.accentHex }} className="font-black tracking-wide">
              SL BUILDER
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
                    onToast('Loaded default SL Builder blueprint.', 'info');
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

      {/* ================= 2. SUB-HEADER: HTML / CSS / JAVASCRIPT TABS + VIEWPORT & STAGE CONTROLS ================= */}
      <div className="h-11 bg-[#0D1017] px-2 pt-1.5 flex items-end justify-between border-b border-white/10 shrink-0">
        {/* Left 3 Core Web Tabs: HTML, CSS, JavaScript */}
        <div className="flex items-end gap-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('html')}
            className={`px-4 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'html'
                ? 'bg-[#161B26] text-orange-400 border-t border-l border-r border-white/15 -mb-[1px] pb-[9px]'
                : 'bg-[#0F131B] text-slate-400 hover:text-slate-100 border border-transparent'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-orange-400" />
            <span>HTML</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('css')}
            className={`px-4 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'css'
                ? 'bg-[#161B26] text-sky-400 border-t border-l border-r border-white/15 -mb-[1px] pb-[9px]'
                : 'bg-[#0F131B] text-slate-400 hover:text-slate-100 border border-transparent'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-sky-400" />
            <span>CSS</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('js')}
            className={`px-4 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'js'
                ? 'bg-[#161B26] text-amber-300 border-t border-l border-r border-white/15 -mb-[1px] pb-[9px]'
                : 'bg-[#0F131B] text-slate-400 hover:text-slate-100 border border-transparent'
            }`}
          >
            <Braces className="w-3.5 h-3.5 text-amber-300" />
            <span>JavaScript</span>
          </button>
        </div>

        {/* Right Controls above Preview Stage: Run, Reset, Viewports & Stage Size */}
        <div
          className={`flex items-center justify-between pb-1.5 pl-2 ${
            stageSize === 'fullscreen' ? 'gap-6' : stageWidthClass
          }`}
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRunSimulation}
              title="Run Reactive Simulation"
              className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-400 cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
            >
              <Play className="w-3.5 h-3.5 fill-emerald-400" />
              <span className="hidden sm:inline">Run</span>
            </button>
            <button
              type="button"
              onClick={handleResetSimulation}
              title="Reset Preview State"
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Responsive Viewport Selector */}
            <div className="flex items-center bg-[#161B26] border border-white/15 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                title="Desktop Preview"
                className={`p-1.5 cursor-pointer ${
                  viewport === 'desktop' ? 'bg-[#232C3F] text-[#60A5FA]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewport('tablet')}
                title="Tablet Preview (768px)"
                className={`p-1.5 border-l border-r border-white/10 cursor-pointer ${
                  viewport === 'tablet' ? 'bg-[#232C3F] text-[#60A5FA]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                title="Mobile Preview (375px)"
                className={`p-1.5 cursor-pointer ${
                  viewport === 'mobile' ? 'bg-[#232C3F] text-[#60A5FA]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stage Split Layout Toggles */}
            <div className="flex items-center bg-[#161B26] border border-white/15 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setStageSize('small')}
                title="Compact Preview"
                className={`p-1.5 cursor-pointer ${
                  stageSize === 'small' ? 'bg-[#232C3F] text-[#60A5FA]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setStageSize('normal')}
                title="Normal Preview"
                className={`p-1.5 border-l border-r border-white/10 cursor-pointer ${
                  stageSize === 'normal' ? 'bg-[#232C3F] text-[#60A5FA]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutPanelLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setStageSize((s) => (s === 'fullscreen' ? 'normal' : 'fullscreen'))
                }
                title="Fullscreen Preview"
                className={`p-1.5 cursor-pointer ${
                  stageSize === 'fullscreen' ? 'bg-[#232C3F] text-[#60A5FA]' : 'text-slate-400 hover:text-white'
                }`}
              >
                {stageSize === 'fullscreen' ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. MAIN WORKSPACE AREA ================= */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* LEFT EDITOR PANEL (Hidden only when Preview Stage is Fullscreen) */}
        {stageSize !== 'fullscreen' && (
          <div className="flex-1 min-w-0 flex bg-[#0A0D13] border-r border-white/10">
            {/* TAB 1: HTML (DOM Blocks & Visual Canvas + HTML Markup) */}
            {activeTab === 'html' && (
              <>
                {/* 3a. Far-Left Category Rail */}
                <aside className="w-[68px] bg-[#0E121A] border-r border-white/10 flex flex-col justify-between shrink-0 overflow-y-auto">
                  <div className="py-1.5 flex flex-col items-center gap-0.5">
                    {WEB_STUDIO_CATEGORIES.map((cat) => {
                      const active = activeCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setActiveCategory(cat.id)}
                          className={`w-full py-2.5 px-1 flex flex-col items-center gap-1 text-center transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#1A2233] text-white font-bold'
                              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border shadow-xs"
                            style={{
                              backgroundColor: cat.color,
                              borderColor: cat.borderColor,
                            }}
                          />
                          <span className="text-[10px] leading-tight truncate w-full">
                            {lang === 'si' ? cat.siLabel : cat.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom-Left Blue + Add Section Kit Button */}
                  <button
                    type="button"
                    onClick={() => setShowSectionModal(true)}
                    title="Add Prebuilt Section Bundle"
                    className="w-full h-11 bg-[#2563EB] hover:bg-[#3B82F6] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </aside>

                {/* 3b. Block Toolbox Palette */}
                <aside className="w-[235px] lg:w-[260px] bg-[#11151E] border-r border-white/10 overflow-y-auto px-3 py-3 shrink-0 space-y-2.5">
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
                  {/* Top Canvas Mode Switcher: Visual HTML Blocks vs <slug>.html */}
                  <div className="sticky top-0 z-10 px-4 py-2 flex items-center justify-between bg-[#0A0D13]/90 backdrop-blur-xs border-b border-white/5">
                    <span className="text-[11px] font-mono text-orange-400 font-semibold">
                      {activePage?.slug || 'index'}.html · {blocks.length} elements
                    </span>
                    <div className="flex items-center gap-1 bg-[#11151E] border border-white/10 rounded-lg p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setHtmlViewMode('visual')}
                        className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                          htmlViewMode === 'visual'
                            ? 'bg-orange-500/20 text-orange-300'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Visual Blocks
                      </button>
                      <button
                        type="button"
                        onClick={() => setHtmlViewMode('code')}
                        className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                          htmlViewMode === 'code'
                            ? 'bg-orange-500/20 text-orange-300'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        &lt;&gt; HTML Code
                      </button>
                    </div>
                  </div>

                  {htmlViewMode === 'visual' ? (
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
                                      blk.type === 'ui-card') && (
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

                                    {blk.type === 'ui-video' && (
                                      <div
                                        className="flex items-center gap-1.5 pt-0.5"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <input
                                          type="text"
                                          value={blk.videoUrl || ''}
                                          placeholder="YouTube URL (youtube.com/watch?v=... / youtu.be/...) or MP4 URL"
                                          onChange={(e) =>
                                            handleUpdateBlock({ ...blk, videoUrl: e.target.value })
                                          }
                                          className="flex-1 bg-[#0A0D13] border border-sky-500/25 focus:border-[#4D97FF] rounded-lg px-2.5 py-1 text-[11px] text-sky-200 placeholder-slate-500 outline-none"
                                        />
                                      </div>
                                    )}

                                    {blk.type === 'ui-icon' && (
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
                                        blk.type === 'logic-click' ||
                                        blk.type === 'logic-if') && (
                                        <input
                                          type="text"
                                          value={
                                            blk.badgeText ??
                                            (blk.type === 'ui-navbar'
                                              ? 'SL'
                                              : blk.type === 'ui-pricing'
                                              ? 'PRO'
                                              : blk.type === 'ui-modal'
                                              ? 'Open Dialog'
                                              : blk.type === 'ui-section'
                                              ? 'Section'
                                              : blk.type === 'logic-if'
                                              ? 'Eval'
                                              : 'Fire')
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

                                    {(blk.type === 'ui-sidebar' ||
                                      blk.type === 'ui-tabbar' ||
                                      blk.type === 'ui-row' ||
                                      blk.type === 'ui-column' ||
                                      blk.type === 'ui-grid' ||
                                      blk.type === 'ui-select' ||
                                      (blk.type === 'ui-checkbox' &&
                                        blk.controlVariant === 'radio')) && (
                                      <input
                                        type="text"
                                        value={
                                          Array.isArray(blk.options) && blk.options.length > 0
                                            ? blk.options.join(', ')
                                            : blk.content
                                        }
                                        placeholder="Items (comma separated, e.g. Item 1, Item 2, Item 3)"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedBlockId(blk.id);
                                        }}
                                        onChange={(e) => {
                                          const raw = e.target.value;
                                          const parsed = raw
                                            .split(/[,|]+/)
                                            .map((s) => s.trim())
                                            .filter(Boolean);
                                          handleUpdateBlock({
                                            ...blk,
                                            options: parsed,
                                            content: parsed.join(' | '),
                                          });
                                        }}
                                        className="w-full bg-[#0B0E15] border border-sky-500/20 focus:border-[#4D97FF] rounded-lg px-2.5 py-1 text-[11px] text-sky-200 placeholder-slate-600 outline-none"
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
                            {(
                              [
                                { id: 'sans', label: 'Sans' },
                                { id: 'serif', label: 'Serif' },
                                { id: 'mono', label: 'Mono' },
                                { id: 'display', label: 'Display' },
                                { id: 'rounded', label: 'Rounded' },
                              ] as const
                            ).map((ff) => (
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
                                value={selectedBlock.logicConfig?.varValue ?? '{"name":"SL Builder"}'}
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
                                value={selectedBlock.logicConfig?.varValue ?? 'creator@slbuilder.app'}
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
                  preview.slbuilder.app/{activePage?.slug === 'index' ? '' : activePage?.slug} · {viewport}
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
              {/* Selected Block Quick Inspector (Matches Scratch Sprite Properties box) */}
              <div className="flex-1 bg-[#11151E] rounded-xl border border-white/10 flex flex-col overflow-hidden">
                {selectedBlock ? (
                  <>
                    <div className="p-2.5 border-b border-white/10 bg-[#141923] space-y-2 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-400">Block</span>
                        <input
                          type="text"
                          value={selectedBlock.name}
                          onChange={(e) =>
                            handleUpdateBlock({ ...selectedBlock, name: e.target.value })
                          }
                          className="flex-1 min-w-0 px-2.5 py-1 rounded-full bg-[#0A0D13] border border-white/15 text-slate-100 font-semibold outline-none focus:border-[#4C97FF]"
                        />
                        <div className="inline-flex rounded-full border border-white/15 overflow-hidden shrink-0">
                          {(['left', 'center', 'right'] as const).map((al) => (
                            <button
                              key={al}
                              type="button"
                              onClick={() =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  style: { ...selectedBlock.style, textAlign: al },
                                })
                              }
                              className={`px-2 py-1 cursor-pointer ${
                                selectedBlock.style?.textAlign === al
                                  ? 'bg-[#1E2B45] text-[#60A5FA]'
                                  : 'bg-[#0A0D13] text-slate-400'
                              }`}
                            >
                              {al === 'left' ? (
                                <AlignLeft className="w-3 h-3" />
                              ) : al === 'center' ? (
                                <AlignCenter className="w-3 h-3" />
                              ) : (
                                <AlignRight className="w-3 h-3" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-400 w-9 shrink-0">Text</span>
                        <input
                          type="text"
                          value={
                            selectedBlock.type === 'ui-stat'
                              ? (selectedBlock.statValue ?? selectedBlock.content)
                              : selectedBlock.content
                          }
                          onChange={(e) =>
                            handleUpdateBlock(
                              selectedBlock.type === 'ui-stat'
                                ? {
                                    ...selectedBlock,
                                    content: e.target.value,
                                    statValue: e.target.value,
                                  }
                                : { ...selectedBlock, content: e.target.value }
                            )
                          }
                          className="flex-1 min-w-0 px-2.5 py-1 rounded-full bg-[#0A0D13] border border-white/15 text-slate-100 outline-none focus:border-[#4C97FF]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-400 w-9 shrink-0">Sub</span>
                        <input
                          type="text"
                          value={
                            selectedBlock.type === 'ui-stat'
                              ? (selectedBlock.statLabel ?? selectedBlock.subtitle ?? '')
                              : selectedBlock.subtitle || ''
                          }
                          placeholder={
                            selectedBlock.type === 'ui-tabbar'
                              ? 'Panel text (separate tabs with |)...'
                              : 'Subtitle / label...'
                          }
                          onChange={(e) =>
                            handleUpdateBlock(
                              selectedBlock.type === 'ui-stat'
                                ? {
                                    ...selectedBlock,
                                    subtitle: e.target.value,
                                    statLabel: e.target.value,
                                  }
                                : { ...selectedBlock, subtitle: e.target.value }
                            )
                          }
                          className="flex-1 min-w-0 px-2.5 py-1 rounded-full bg-[#0A0D13] border border-white/10 text-slate-300 placeholder-slate-600 outline-none focus:border-[#4C97FF]"
                        />
                      </div>

                      {(selectedBlock.type === 'ui-sidebar' ||
                        selectedBlock.type === 'ui-tabbar' ||
                        selectedBlock.type === 'ui-row' ||
                        selectedBlock.type === 'ui-column' ||
                        selectedBlock.type === 'ui-grid' ||
                        selectedBlock.type === 'ui-select' ||
                        (selectedBlock.type === 'ui-checkbox' &&
                          selectedBlock.controlVariant === 'radio')) && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sky-400 w-9 shrink-0">Items</span>
                          <input
                            type="text"
                            value={
                              Array.isArray(selectedBlock.options) && selectedBlock.options.length > 0
                                ? selectedBlock.options.join(', ')
                                : selectedBlock.content
                            }
                            placeholder="Comma separated items..."
                            onChange={(e) => {
                              const raw = e.target.value;
                              const parsed = raw
                                .split(/[,|]+/)
                                .map((s) => s.trim())
                                .filter(Boolean);
                              handleUpdateBlock({
                                ...selectedBlock,
                                options: parsed,
                                content: parsed.join(' | '),
                              });
                            }}
                            className="flex-1 min-w-0 px-2.5 py-1 rounded-full bg-[#0A0D13] border border-sky-500/30 text-sky-200 outline-none focus:border-[#4C97FF]"
                          />
                        </div>
                      )}

                      {/* Inspector Mode Switcher: CapCut Templates vs Custom Properties */}
                      <div className="flex items-center gap-1 bg-[#0A0D13] p-0.5 rounded-lg border border-white/10">
                        <button
                          type="button"
                          onClick={() => setInspectorMode('templates')}
                          className={`flex-1 py-1 px-2 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            inspectorMode === 'templates'
                              ? 'bg-[#2563EB] text-white shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{lang === 'si' ? 'ටෙම්ප්ලේට් (Templates)' : 'Style Templates'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInspectorMode('properties')}
                          className={`flex-1 py-1 px-2 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            inspectorMode === 'properties'
                              ? 'bg-[#1E2B45] text-sky-300 border border-sky-400/30'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>{lang === 'si' ? 'වෙනස් කරන්න (Edit)' : 'Customize'}</span>
                        </button>
                      </div>
                    </div>

                    {inspectorMode === 'templates' ? (
                      <div className="flex-1 p-2.5 bg-[#0C0F16] overflow-y-auto flex flex-col gap-2 text-[11px]">
                        {/* Filter Pills + Reset */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1">
                            {(
                              [
                                { id: 'recommended', label: 'For Block' },
                                { id: 'text-fx', label: 'Text FX' },
                                { id: 'surface', label: 'Box FX' },
                                { id: 'button', label: 'Buttons' },
                              ] as const
                            ).map((tab) => (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setTemplateFilter(tab.id)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                                  templateFilter === tab.id
                                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                                    : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>
                          {selectedBlock.style?.templateId && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  style: {
                                    textAlign: selectedBlock.style?.textAlign,
                                    fontSize: selectedBlock.style?.fontSize,
                                  },
                                })
                              }
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/5 hover:bg-white/10 text-slate-300 flex items-center gap-1 cursor-pointer"
                              title="Reset Template Style"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Reset</span>
                            </button>
                          )}
                        </div>

                        {/* CapCut-Style Visual Template Cards Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {(templateFilter === 'recommended'
                            ? getTemplatesForBlockType(selectedBlock.type)
                            : BLOCK_STYLE_TEMPLATES.filter((t) => t.category === templateFilter)
                          ).map((tpl: BlockStyleTemplate) => {
                            const isActive = selectedBlock.style?.templateId === tpl.id;
                            const previewFont =
                              tpl.style.fontFamily === 'serif'
                                ? "Georgia, Cambria, 'Times New Roman', serif"
                                : tpl.style.fontFamily === 'mono'
                                ? "'JetBrains Mono', ui-monospace, monospace"
                                : tpl.style.fontFamily === 'display'
                                ? "'Space Grotesk', system-ui, sans-serif"
                                : tpl.style.fontFamily === 'rounded'
                                ? "'Nunito', 'Quicksand', system-ui, sans-serif"
                                : 'Inter, system-ui, sans-serif';

                            const applyTemplate = () => {
                              if (tpl.category === 'text-fx') {
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  style: {
                                    ...selectedBlock.style,
                                    templateId: tpl.id,
                                    fontFamily: tpl.style.fontFamily,
                                    fontWeight: tpl.style.fontWeight,
                                    customTextHex: tpl.style.customTextHex,
                                    subtitleColorHex: tpl.style.subtitleColorHex,
                                    textGradient: tpl.style.textGradient,
                                    textShadow: tpl.style.textShadow,
                                    textStroke: tpl.style.textStroke,
                                  },
                                });
                              } else {
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  style: {
                                    ...selectedBlock.style,
                                    templateId: tpl.id,
                                    fontFamily: tpl.style.fontFamily || selectedBlock.style?.fontFamily,
                                    fontWeight: tpl.style.fontWeight || selectedBlock.style?.fontWeight,
                                    customTextHex: tpl.style.customTextHex,
                                    subtitleColorHex: tpl.style.subtitleColorHex,
                                    textGradient: undefined,
                                    textShadow: undefined,
                                    textStroke: undefined,
                                    customBgHex: tpl.style.customBgHex,
                                    bgGradient: tpl.style.bgGradient,
                                    borderColor: tpl.style.borderColor,
                                    boxShadow: tpl.style.boxShadow,
                                    borderRadius: tpl.style.borderRadius,
                                  },
                                });
                              }
                            };

                            return (
                              <button
                                key={tpl.id}
                                type="button"
                                onClick={applyTemplate}
                                className={`group relative rounded-xl p-1.5 border text-left transition-all cursor-pointer overflow-hidden ${
                                  isActive
                                    ? 'border-[#4C97FF] ring-2 ring-[#4C97FF]/40 bg-[#182236]'
                                    : 'border-white/10 bg-[#141923] hover:border-white/30 hover:bg-[#19202e]'
                                }`}
                              >
                                <div
                                  className="h-11 rounded-lg flex items-center justify-center px-2 relative overflow-hidden border border-white/10"
                                  style={{
                                    background: tpl.style.bgGradient || tpl.previewBg,
                                    borderColor: tpl.style.borderColor || 'rgba(255,255,255,0.1)',
                                    boxShadow: tpl.style.boxShadow,
                                  }}
                                >
                                  {tpl.badge && (
                                    <span className="absolute top-1 left-1 text-[8px] font-mono font-bold px-1 rounded bg-black/50 text-slate-300">
                                      {tpl.badge}
                                    </span>
                                  )}
                                  {isActive && (
                                    <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#4C97FF] text-white flex items-center justify-center">
                                      <Check className="w-2.5 h-2.5" />
                                    </span>
                                  )}
                                  {tpl.category === 'button' ? (
                                    <span
                                      className={`px-2.5 py-0.5 text-[10px] font-bold ${
                                        tpl.style.borderRadius || 'rounded-lg'
                                      }`}
                                      style={{
                                        background: tpl.style.bgGradient,
                                        color: tpl.style.customTextHex || '#ffffff',
                                        border: tpl.style.borderColor
                                          ? `1px solid ${tpl.style.borderColor}`
                                          : undefined,
                                        boxShadow: tpl.style.boxShadow,
                                        fontFamily: previewFont,
                                      }}
                                    >
                                      {(selectedBlock.content || 'Click').slice(0, 8)}
                                    </span>
                                  ) : (
                                    <span
                                      className="text-sm font-extrabold tracking-tight truncate max-w-full"
                                      style={{
                                        fontFamily: previewFont,
                                        color: tpl.style.customTextHex || '#ffffff',
                                        textShadow: tpl.style.textShadow,
                                        WebkitTextStroke: tpl.style.textStroke,
                                        ...(tpl.style.textGradient
                                          ? {
                                              backgroundImage: tpl.style.textGradient,
                                              WebkitBackgroundClip: 'text',
                                              backgroundClip: 'text',
                                              WebkitTextFillColor: 'transparent',
                                              color: 'transparent',
                                            }
                                          : {}),
                                      }}
                                    >
                                      Aa{' '}
                                      {selectedBlock.content
                                        ? selectedBlock.content.slice(0, 7)
                                        : 'Style'}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex items-center justify-between px-0.5">
                                  <span className="text-[10px] font-semibold text-slate-200 truncate">
                                    {tpl.name}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between pt-1 mt-auto border-t border-white/10">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setInspectorMode('properties')}
                              className="text-[10px] font-semibold text-slate-300 hover:text-white cursor-pointer"
                            >
                              Customize &rarr;
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCssSection('element');
                                setActiveTab('css');
                              }}
                              className="text-[10px] font-semibold text-sky-400 hover:underline cursor-pointer"
                            >
                              More CSS &rarr;
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab('js')}
                              className="text-[10px] font-semibold text-amber-300 hover:underline cursor-pointer"
                            >
                              Edit JS &rarr;
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteBlock(selectedBlock.id)}
                            className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 p-3 bg-[#0C0F16] overflow-y-auto space-y-2.5 text-[11px]">
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-400 block">
                          {selectedBlock.type === 'ui-stat'
                            ? 'KPI Label'
                            : selectedBlock.type === 'ui-testimonial'
                            ? 'Author Name'
                            : 'Subtitle / Helper Text'}
                        </span>
                        <input
                          type="text"
                          value={
                            selectedBlock.type === 'ui-stat'
                              ? (selectedBlock.statLabel ?? selectedBlock.subtitle ?? '')
                              : selectedBlock.subtitle || ''
                          }
                          onChange={(e) =>
                            handleUpdateBlock(
                              selectedBlock.type === 'ui-stat'
                                ? {
                                    ...selectedBlock,
                                    subtitle: e.target.value,
                                    statLabel: e.target.value,
                                  }
                                : { ...selectedBlock, subtitle: e.target.value }
                            )
                          }
                          placeholder="Edit subtitle, links, or secondary text..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#141923] border border-white/10 text-slate-200 outline-none focus:border-[#4C97FF]"
                        />
                      </div>

                      {/* Block-specific extra editable text fields */}
                      {selectedBlock.type === 'ui-testimonial' && (
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-400 block">Author Role</span>
                          <input
                            type="text"
                            value={selectedBlock.authorRole || ''}
                            onChange={(e) =>
                              handleUpdateBlock({ ...selectedBlock, authorRole: e.target.value })
                            }
                            placeholder="e.g. Lead Architect"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#141923] border border-white/10 text-slate-200 outline-none focus:border-[#4C97FF]"
                          />
                        </div>
                      )}

                      {(selectedBlock.type === 'ui-navbar' ||
                        selectedBlock.type === 'ui-pricing' ||
                        selectedBlock.type === 'ui-modal' ||
                        selectedBlock.type === 'ui-section' ||
                        selectedBlock.type === 'logic-click' ||
                        selectedBlock.type === 'logic-if') && (
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-400 block">
                            Badge / Button / Kicker Text
                          </span>
                          <input
                            type="text"
                            value={
                              selectedBlock.badgeText ??
                              (selectedBlock.type === 'ui-navbar'
                                ? 'SL'
                                : selectedBlock.type === 'ui-pricing'
                                ? 'PRO'
                                : selectedBlock.type === 'ui-modal'
                                ? 'Open Dialog'
                                : selectedBlock.type === 'ui-section'
                                ? 'Section Container'
                                : selectedBlock.type === 'logic-if'
                                ? 'Eval'
                                : 'Fire')
                            }
                            onChange={(e) =>
                              handleUpdateBlock({ ...selectedBlock, badgeText: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#141923] border border-white/10 text-slate-200 outline-none focus:border-[#4C97FF]"
                          />
                        </div>
                      )}

                      {(selectedBlock.type === 'ui-image' ||
                        selectedBlock.type === 'ui-avatar' ||
                        selectedBlock.type === 'ui-card') && (
                        <div className="space-y-1.5 p-2 rounded-lg bg-[#141923] border border-sky-500/20">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sky-300 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              Photo / Image
                            </span>
                            <div className="flex items-center gap-1.5">
                              <label className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer">
                                <Upload className="w-3 h-3" />
                                <span>Upload Photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    e.target.value = '';
                                    if (!file) return;
                                    try {
                                      const dataUrl = await readAndCompressImageFile(file);
                                      handleUpdateBlock({ ...selectedBlock, imageUrl: dataUrl });
                                      onToast(`Uploaded photo "${file.name}"`, 'success');
                                    } catch (err) {
                                      onToast(
                                        err instanceof Error ? err.message : 'Failed to load image',
                                        'error'
                                      );
                                    }
                                  }}
                                />
                              </label>
                              {selectedBlock.imageUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateBlock({ ...selectedBlock, imageUrl: '' })
                                  }
                                  className="px-2 py-1 rounded bg-white/10 hover:bg-rose-500/30 text-[10px] text-slate-300 cursor-pointer"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>
                          {selectedBlock.imageUrl && (
                            <img
                              src={selectedBlock.imageUrl}
                              alt={selectedBlock.name}
                              className="w-full h-20 object-cover rounded border border-white/10"
                            />
                          )}
                          <input
                            type="text"
                            value={selectedBlock.imageUrl || ''}
                            onChange={(e) =>
                              handleUpdateBlock({ ...selectedBlock, imageUrl: e.target.value })
                            }
                            placeholder="Or paste Image URL (https://...)"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0A0D13] border border-white/10 text-slate-200 outline-none focus:border-[#4C97FF]"
                          />
                        </div>
                      )}

                      {selectedBlock.type === 'ui-video' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-400">YouTube / Video URL</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                                })
                              }
                              className="text-[10px] text-sky-400 hover:underline cursor-pointer"
                            >
                              Sample YouTube
                            </button>
                          </div>
                          <input
                            type="text"
                            value={selectedBlock.videoUrl || ''}
                            onChange={(e) =>
                              handleUpdateBlock({ ...selectedBlock, videoUrl: e.target.value })
                            }
                            placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#141923] border border-white/10 text-slate-200 outline-none focus:border-[#4C97FF]"
                          />
                        </div>
                      )}

                      {selectedBlock.type === 'ui-icon' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-400">Real Vector Icon</span>
                            <span className="text-[10px] font-mono text-sky-400">
                              {selectedBlock.iconName || 'sparkles'}
                            </span>
                          </div>
                          <div className="grid grid-cols-6 gap-1 max-h-32 overflow-y-auto p-1 rounded-lg bg-[#0B0E15] border border-white/10">
                            {ICON_LIBRARY.map((ic) => {
                              const active = (selectedBlock.iconName || 'sparkles') === ic.id;
                              return (
                                <button
                                  key={ic.id}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateBlock({ ...selectedBlock, iconName: ic.id })
                                  }
                                  title={ic.label}
                                  className={`p-1.5 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                                    active
                                      ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                                      : 'bg-[#141923] border-white/10 text-slate-300 hover:text-white'
                                  }`}
                                >
                                  {renderVectorIcon(ic.id, 'w-3.5 h-3.5')}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {selectedBlock.type === 'ui-input' && (
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-400 block">Input Field Type</span>
                          <select
                            value={selectedBlock.inputType || 'text'}
                            onChange={(e) =>
                              handleUpdateBlock({
                                ...selectedBlock,
                                inputType: e.target.value as CanvasBlock['inputType'],
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#141923] border border-white/10 text-slate-200 outline-none cursor-pointer"
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="password">Password</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                          </select>
                        </div>
                      )}

                      {selectedBlock.type === 'ui-grid' && (
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-400 block">Grid Columns</span>
                          <select
                            value={selectedBlock.gridColumns ?? 2}
                            onChange={(e) =>
                              handleUpdateBlock({
                                ...selectedBlock,
                                gridColumns: Number(e.target.value) === 3 ? 3 : 2,
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#141923] border border-white/10 text-slate-200 outline-none cursor-pointer"
                          >
                            <option value={2}>2 Columns</option>
                            <option value={3}>3 Columns</option>
                          </select>
                        </div>
                      )}

                      {/* Quick Font, Size & Font Color Strip */}
                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        <select
                          value={selectedBlock.style?.fontFamily || 'sans'}
                          onChange={(e) =>
                            handleUpdateBlock({
                              ...selectedBlock,
                              style: {
                                ...selectedBlock.style,
                                fontFamily: e.target.value as 'sans' | 'serif' | 'mono' | 'display' | 'rounded',
                              },
                            })
                          }
                          title="Font Family"
                          className="px-2 py-1 rounded-lg bg-[#141923] border border-white/10 text-slate-200 outline-none cursor-pointer"
                        >
                          <option value="sans">Font: Sans</option>
                          <option value="serif">Font: Serif</option>
                          <option value="mono">Font: Mono</option>
                          <option value="display">Font: Display</option>
                          <option value="rounded">Font: Rounded</option>
                        </select>

                        <select
                          value={selectedBlock.style?.fontSize || 'base'}
                          onChange={(e) =>
                            handleUpdateBlock({
                              ...selectedBlock,
                              style: {
                                ...selectedBlock.style,
                                fontSize: e.target.value as 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl',
                              },
                            })
                          }
                          title="Font Size"
                          className="px-2 py-1 rounded-lg bg-[#141923] border border-white/10 text-slate-200 outline-none cursor-pointer"
                        >
                          <option value="xs">Size: XS</option>
                          <option value="sm">Size: SM</option>
                          <option value="base">Size: Base</option>
                          <option value="lg">Size: LG</option>
                          <option value="xl">Size: XL</option>
                          <option value="2xl">Size: 2XL</option>
                          <option value="3xl">Size: 3XL</option>
                          <option value="4xl">Size: 4XL</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-between px-2 py-1 rounded-lg bg-[#141923] border border-white/10 cursor-pointer">
                          <span className="text-slate-400">Font Color</span>
                          <input
                            type="color"
                            value={selectedBlock.style?.customTextHex || '#ffffff'}
                            onChange={(e) =>
                              handleUpdateBlock({
                                ...selectedBlock,
                                style: {
                                  ...selectedBlock.style,
                                  customTextHex: e.target.value,
                                  textGradient: undefined,
                                },
                              })
                            }
                            className="w-5 h-4 bg-transparent border-0 cursor-pointer p-0"
                          />
                        </label>
                        <label className="flex-1 flex items-center justify-between px-2 py-1 rounded-lg bg-[#141923] border border-white/10 cursor-pointer">
                          <span className="text-slate-400">Sub Color</span>
                          <input
                            type="color"
                            value={selectedBlock.style?.subtitleColorHex || '#94a3b8'}
                            onChange={(e) =>
                              handleUpdateBlock({
                                ...selectedBlock,
                                style: { ...selectedBlock.style, subtitleColorHex: e.target.value },
                              })
                            }
                            className="w-5 h-4 bg-transparent border-0 cursor-pointer p-0"
                          />
                        </label>
                      </div>

                      {/* Quick Button Click Wiring / Navbar Shortcut */}
                      {(selectedBlock.type === 'ui-button' ||
                        selectedBlock.type === 'logic-click') && (
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-400/25 space-y-1.5">
                          <span className="font-semibold text-amber-300 flex items-center gap-1">
                            <MousePointerClick className="w-3 h-3" /> When Clicked (Action)
                          </span>
                          <select
                            value={selectedBlock.action || ''}
                            onChange={(e) =>
                              handleUpdateBlock({
                                ...selectedBlock,
                                action: (e.target.value || undefined) as CanvasBlock['action'],
                              })
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-slate-100 outline-none cursor-pointer"
                          >
                            <option value="">Auto / Default</option>
                            <option value="submit-form">Submit Form Inputs</option>
                            <option value="navigate-page">Go to Page</option>
                            <option value="scroll-to-block">Scroll to Section</option>
                            <option value="open-url">Open URL / Link</option>
                            <option value="increment-counter">Increment Counter (+1)</option>
                            <option value="toggle-visibility">Toggle State / FAQ</option>
                            <option value="call-api">Fetch API Endpoint</option>
                            <option value="alert">Show Toast Message</option>
                          </select>
                          {selectedBlock.action === 'navigate-page' && (
                            <select
                              value={selectedBlock.targetPageId || ''}
                              onChange={(e) =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  targetPageId: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 rounded-lg bg-[#090B10] border border-white/15 text-slate-100 outline-none cursor-pointer"
                            >
                              <option value="">Pick target page...</option>
                              {pages.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          )}
                          {selectedBlock.action === 'scroll-to-block' && (
                            <select
                              value={selectedBlock.targetId || ''}
                              onChange={(e) =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  targetId: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 rounded-lg bg-[#090B10] border border-white/15 text-slate-100 outline-none cursor-pointer"
                            >
                              <option value="">Pick section to scroll to...</option>
                              {blocks
                                .filter((b) => b.id !== selectedBlock.id)
                                .map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.name}
                                  </option>
                                ))}
                            </select>
                          )}
                          {(selectedBlock.action === 'open-url' ||
                            selectedBlock.action === 'submit-form' ||
                            selectedBlock.action === 'alert') && (
                            <input
                              type="text"
                              value={selectedBlock.actionPayload || ''}
                              onChange={(e) =>
                                handleUpdateBlock({
                                  ...selectedBlock,
                                  actionPayload: e.target.value,
                                })
                              }
                              placeholder={
                                selectedBlock.action === 'open-url'
                                  ? 'https://...'
                                  : 'Confirmation message...'
                              }
                              className="w-full px-2 py-1 rounded-lg bg-[#090B10] border border-white/15 text-amber-200 outline-none"
                            />
                          )}
                        </div>
                      )}

                      {selectedBlock.type === 'ui-navbar' && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('js')}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-300 font-semibold flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5" />
                            Configure Navbar Buttons (
                            {getEffectiveNavLinks(selectedBlock, pages, blocks).length})
                          </span>
                          <span>&rarr;</span>
                        </button>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setCssSection('element');
                              setActiveTab('css');
                            }}
                            className="text-[11px] font-semibold text-sky-400 hover:underline cursor-pointer"
                          >
                            More CSS &rarr;
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('js')}
                            className="text-[11px] font-semibold text-amber-300 hover:underline cursor-pointer"
                          >
                            Edit JS &rarr;
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(selectedBlock.id)}
                          className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-xs text-slate-500 p-4">
                    Select any block on the canvas or preview
                  </div>
                )}
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
              <h3 className="text-sm font-bold">Add SL Builder Section Bundle</h3>
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
                            pg.pageStyle
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
              <h3 className="text-sm font-bold text-slate-100">SL Builder WebStudio Guide</h3>
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
