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
} from 'lucide-react';
import {
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
import { WebPreviewRenderer } from './WebPreviewRenderer';
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
import { getEffectiveNavLinks } from '../../utils/navLinkHelpers';
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset local studio state when switching project
  useEffect(() => {
    const initial = buildInitialPages(project);
    setPages(initial);
    setActivePageId(initial[0]?.id || 'page_home');
    setProjectName(project.name || 'SL WebStudio Project');
    setSelectedBlockId(initial[0]?.blocks[0]?.id || null);
    setUndoStack([]);
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
  const handleSelectPage = (pageId: string) => {
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

  // =================== BLOCK ACTIONS ===================
  const handleAddTemplateBlock = (tpl: WebStudioBlockTemplate) => {
    const created = createCanvasBlockFromTemplate(tpl);
    commitBlocks((prev) => [...prev, created]);
    setSelectedBlockId(created.id);
    onToast(`Added ${tpl.name} to canvas`, 'success');
  };

  const handlePaletteDragStart = (e: React.DragEvent, tpl: WebStudioBlockTemplate) => {
    e.dataTransfer.setData('application/x-slbuilder-type', tpl.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData('application/x-slbuilder-type');
    if (!blockType) return;
    const tpl = WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.type === blockType);
    if (tpl) handleAddTemplateBlock(tpl);
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

  // Reactive Logic, Navigation & Form Action Executor in Preview Stage
  const handleTriggerAction = (
    sourceBlock: CanvasBlock,
    formValues?: Record<string, string>
  ) => {
    const hasCounter = blocks.some((b) => b.type === 'logic-counter');
    const inputBlocks = blocks.filter(
      (b) => b.type === 'ui-input' || b.type === 'ui-textarea'
    );
    const filledInputs = inputBlocks
      .map((inp) => ({
        label: inp.subtitle || inp.name,
        val: (formValues?.[inp.id] || '').trim(),
      }))
      .filter((item) => item.val.length > 0);

    // Smart fallback if user hasn't picked an explicit action yet
    const action =
      sourceBlock.action ||
      (hasCounter
        ? 'increment-counter'
        : filledInputs.length > 0
        ? 'submit-form'
        : 'increment-counter');

    if (action === 'navigate-page') {
      const targetPage =
        pages.find((p) => p.id === sourceBlock.targetPageId) ||
        pages.find((p) => p.id !== activePage?.id);
      if (targetPage) {
        handleSelectPage(targetPage.id);
        onToast(`Navigated to "${targetPage.name}"`, 'success');
      } else {
        onToast('Add another page or select a Target Page in the JavaScript tab!', 'info');
      }
      return;
    }

    if (action === 'scroll-to-block') {
      const targetBlock =
        blocks.find((b) => b.id === sourceBlock.targetId) ||
        blocks.find((b) => b.id !== sourceBlock.id);
      if (targetBlock) {
        const el = document.getElementById(`sl-el-${targetBlock.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setSelectedBlockId(targetBlock.id);
        onToast(`Scrolled to "${targetBlock.name}"`, 'success');
      } else {
        onToast('Select a Target Block to scroll to in the JavaScript tab.', 'info');
      }
      return;
    }

    if (action === 'submit-form') {
      if (inputBlocks.length > 0 && filledInputs.length === 0) {
        onToast('Type something into your form inputs above, then click Submit!', 'info');
        return;
      }
      const summary = filledInputs.map((i) => `${i.label}: ${i.val}`).join(' · ');
      const customMsg = (sourceBlock.actionPayload || '').trim();
      onToast(
        customMsg
          ? summary
            ? `${customMsg} (${summary})`
            : customMsg
          : summary
          ? `Submitted → ${summary}`
          : 'Form submitted successfully!',
        'success'
      );
      return;
    }

    if (action === 'open-url') {
      const rawUrl = (sourceBlock.actionPayload || '').trim();
      if (!rawUrl) {
        onToast('Enter a URL (e.g. https://... or mailto:...) in the JavaScript tab.', 'info');
        return;
      }
      if (rawUrl.startsWith('#')) {
        const targetId = rawUrl.slice(1);
        const el =
          document.getElementById(targetId) ||
          document.getElementById(`sl-el-${targetId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        onToast(`Jumped to ${rawUrl}`, 'success');
      } else {
        onToast(`Link ready: ${rawUrl} (opens when exported)`, 'success');
      }
      return;
    }

    if (action === 'increment-counter') {
      const targetCounter =
        blocks.find((b) => b.id === sourceBlock.targetId && b.type === 'logic-counter') ||
        blocks.find((b) => b.type === 'logic-counter');
      if (targetCounter) {
        const nextVal = (targetCounter.counterValue ?? 0) + 1;
        handleUpdateBlock({
          ...targetCounter,
          counterValue: nextVal,
          content: `Clicks Registered: ${nextVal}`,
        });
        onToast(`Triggered "${targetCounter.name}" → ${nextVal}`, 'success');
      } else {
        onToast(
          'Button ready! Choose an action (Submit Form, Go to Page, Scroll, or URL) in "When Clicked" below or the JavaScript tab.',
          'info'
        );
      }
    } else if (action === 'toggle-visibility') {
      const toggleTarget =
        blocks.find((b) => b.id === sourceBlock.targetId) ||
        blocks.find((b) => b.type === 'logic-toggle' || b.type === 'ui-accordion');
      if (toggleTarget) {
        handleUpdateBlock({ ...toggleTarget, isExpanded: !toggleTarget.isExpanded });
        onToast(`Toggled "${toggleTarget.name}" state`, 'info');
      } else {
        onToast('Add a Toggle Switch or FAQ Accordion to wire this action.', 'info');
      }
    } else if (action === 'call-api') {
      onToast(
        `Simulated 200 OK response from ${sourceBlock.apiEndpoint || '/api/v1/metrics'}`,
        'success'
      );
    } else {
      onToast(sourceBlock.actionPayload || `Executed "${sourceBlock.name}"`, 'info');
    }
  };

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
    const triggerBtn = blocks.find((b) => b.type === 'ui-button');
    if (triggerBtn) {
      handleTriggerAction(triggerBtn);
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
      } else {
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
    onToast('Reset live preview state.', 'info');
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

                  <div className="flex flex-col gap-2 pb-6">
                    {categoryTemplates.map((tpl) => {
                      const catMeta = WEB_STUDIO_CATEGORIES.find(
                        (c) => c.id === tpl.studioCategory
                      )!;
                      return (
                        <div
                          key={tpl.type}
                          draggable
                          onDragStart={(e) => handlePaletteDragStart(e, tpl)}
                          onClick={() => handleAddTemplateBlock(tpl)}
                          style={{
                            backgroundColor: catMeta.color,
                            borderColor: catMeta.borderColor,
                          }}
                          className="relative rounded-lg px-3 py-2 border shadow-sm cursor-grab active:cursor-grabbing hover:brightness-105 transition-all select-none"
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
                      );
                    })}
                  </div>
                </aside>

                {/* 3c. Center Dotted Visual Blueprint Stack Canvas + HTML Toggle */}
                <main
                  onDragOver={(e) => e.preventDefault()}
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
                      className="min-h-full p-5 max-w-2xl w-full mx-auto space-y-2.5 origin-top"
                      style={{ transform: `scale(${zoomLevel})` }}
                    >
                      {blocks.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/15 rounded-2xl">
                          <p className="text-xs font-semibold text-slate-300">
                            {lang === 'si'
                              ? 'වම් පසින් HTML බ්ලොක් එකක් ක්ලික් කරන්න හෝ අදින්න'
                              : 'Click or drag any HTML block from the left palette'}
                          </p>
                        </div>
                      ) : (
                        blocks.map((blk, idx) => {
                          const catMeta = getCategoryMetaForBlockType(blk.type);
                          const isSelected = blk.id === selectedBlock?.id;
                          return (
                            <div
                              key={blk.id}
                              onClick={() => setSelectedBlockId(blk.id)}
                              className={`rounded-xl bg-[#131822] border transition-all cursor-pointer p-3 ${
                                isSelected
                                  ? 'border-[#4D97FF] ring-2 ring-[#4D97FF]/30 shadow-lg'
                                  : 'border-white/10 hover:border-white/25'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 min-w-0">
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
                                    value={blk.type === 'ui-stat' ? (blk.statValue ?? blk.content) : blk.content}
                                    placeholder="Primary text..."
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBlockId(blk.id);
                                    }}
                                    onChange={(e) =>
                                      handleUpdateBlock(
                                        blk.type === 'ui-stat'
                                          ? { ...blk, content: e.target.value, statValue: e.target.value }
                                          : { ...blk, content: e.target.value }
                                      )
                                    }
                                    className="flex-1 min-w-[160px] bg-[#0A0D13] border border-white/10 focus:border-[#4D97FF] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                                  />
                                  {blk.targetId && (
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

                                {/* Secondary / Subtitle / Role / Badge Text Editor */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <input
                                    type="text"
                                    value={
                                      blk.type === 'ui-stat'
                                        ? (blk.statLabel ?? blk.subtitle ?? '')
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
                                          ? { ...blk, subtitle: e.target.value, statLabel: e.target.value }
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
                                        handleUpdateBlock({ ...blk, authorRole: e.target.value })
                                      }
                                      className="w-36 bg-[#0B0E15] border border-white/5 focus:border-[#4D97FF] rounded-lg px-2 py-1 text-[11px] text-slate-300 placeholder-slate-600 outline-none"
                                    />
                                  )}
                                  {(blk.type === 'ui-navbar' ||
                                    blk.type === 'ui-pricing' ||
                                    blk.type === 'logic-click') && (
                                    <input
                                      type="text"
                                      value={
                                        blk.badgeText ??
                                        (blk.type === 'ui-navbar'
                                          ? 'SL'
                                          : blk.type === 'ui-pricing'
                                          ? 'PRO'
                                          : 'Fire')
                                      }
                                      placeholder="Badge..."
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedBlockId(blk.id);
                                      }}
                                      onChange={(e) =>
                                        handleUpdateBlock({ ...blk, badgeText: e.target.value })
                                      }
                                      className="w-20 bg-[#0B0E15] border border-white/5 focus:border-[#4D97FF] rounded-lg px-2 py-1 text-[11px] font-mono text-sky-300 placeholder-slate-600 outline-none"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
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
                          key={tpl.type}
                          type="button"
                          onClick={() => handleAddTemplateBlock(tpl)}
                          style={{
                            backgroundColor: catMeta.color,
                            borderColor: catMeta.borderColor,
                          }}
                          className="text-left rounded-lg px-3 py-2 border shadow-sm hover:brightness-105 transition-all cursor-pointer"
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
                            Select Button, Navbar, or Element to Wire
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
                              b.type === 'logic-click' ||
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
                                      : b.type === 'ui-button' || b.type === 'logic-click'
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
                              JavaScript Event Binding · {selectedBlock.type}
                            </span>
                            <h3 className="text-sm font-bold text-white">{selectedBlock.name}</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTriggerAction(selectedBlock)}
                            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" /> Test Click
                          </button>
                        </div>

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
                              <option value="navigate-page">Go to Page (Navigate)</option>
                              <option value="scroll-to-block">Scroll to Section / Block</option>
                              <option value="submit-form">Submit Form Inputs</option>
                              <option value="open-url">Open URL / Email Link</option>
                              <option value="increment-counter">Increment Counter (+1)</option>
                              <option value="toggle-visibility">Toggle State / Accordion</option>
                              <option value="call-api">Fetch API Endpoint</option>
                              <option value="alert">Show Notification Toast</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-slate-400 font-semibold">
                              {selectedBlock.action === 'navigate-page'
                                ? 'Target Page'
                                : selectedBlock.action === 'submit-form'
                                ? 'Confirmation Message (Optional)'
                                : selectedBlock.action === 'open-url'
                                ? 'Destination URL'
                                : selectedBlock.action === 'alert'
                                ? 'Toast Message'
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
                              selectedBlock.action === 'alert' ? (
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
                                    ? 'https://example.com or mailto:hi@site.com'
                                    : selectedBlock.action === 'submit-form'
                                    ? 'Thanks! We received your submission.'
                                    : 'Action completed!'
                                }
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
                      </div>
                    )}

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
                    </div>

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
                        selectedBlock.type === 'logic-click') && (
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-400 block">
                            Badge / Button Tag Text
                          </span>
                          <input
                            type="text"
                            value={
                              selectedBlock.badgeText ??
                              (selectedBlock.type === 'ui-navbar'
                                ? 'SL'
                                : selectedBlock.type === 'ui-pricing'
                                ? 'PRO'
                                : 'Fire')
                            }
                            onChange={(e) =>
                              handleUpdateBlock({ ...selectedBlock, badgeText: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#141923] border border-white/10 text-slate-200 outline-none focus:border-[#4C97FF]"
                          />
                        </div>
                      )}

                      {selectedBlock.type === 'ui-image' && (
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-400 block">Image URL (Optional)</span>
                          <input
                            type="text"
                            value={selectedBlock.imageUrl || ''}
                            onChange={(e) =>
                              handleUpdateBlock({ ...selectedBlock, imageUrl: e.target.value })
                            }
                            placeholder="https://..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#141923] border border-white/10 text-slate-200 outline-none focus:border-[#4C97FF]"
                          />
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
                                style: { ...selectedBlock.style, customTextHex: e.target.value },
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
