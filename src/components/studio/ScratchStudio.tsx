import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Globe,
  Lightbulb,
  HelpCircle,
  LayoutGrid,
  Sliders,
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
  Layers,
  Server,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { CanvasBlock, Project, ViewportMode } from '../../types/builder';
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
  generateReactTsxExport,
  generateFlaskExport,
} from '../../utils/webStudioCodeGen';
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

export const ScratchStudio: React.FC<ScratchStudioProps> = ({
  project,
  onUpdateProject,
  onBackToProjects,
  onToast,
}) => {
  const { themeConfig } = useTheme();
  const [blocks, setBlocks] = useState<CanvasBlock[]>(() =>
    project.blocks && project.blocks.length > 0 ? project.blocks : [...INITIAL_DEMO_BLOCKS]
  );
  const [projectName, setProjectName] = useState<string>(project.name || 'SL WebStudio Project');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    () => (project.blocks && project.blocks[0]?.id) || INITIAL_DEMO_BLOCKS[0]?.id || null
  );
  const [lang, setLang] = useState<'en' | 'si'>('en');
  const [activeTab, setActiveTab] = useState<'canvas' | 'style' | 'export'>('canvas');
  const [activeCategory, setActiveCategory] = useState<WebStudioCategoryId>('layout');
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [stageSize, setStageSize] = useState<'small' | 'normal' | 'fullscreen'>('normal');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [undoStack, setUndoStack] = useState<CanvasBlock[][]>([]);
  const [exportTarget, setExportTarget] = useState<'html' | 'react' | 'flask'>('html');
  const [copiedExport, setCopiedExport] = useState(false);

  // Dropdowns & Modals
  const [openMenu, setOpenMenu] = useState<'lang' | 'file' | 'edit' | null>(null);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset local studio state when switching project
  useEffect(() => {
    const nextBlocks =
      project.blocks && project.blocks.length > 0 ? project.blocks : [...INITIAL_DEMO_BLOCKS];
    setBlocks(nextBlocks);
    setProjectName(project.name || 'SL WebStudio Project');
    setSelectedBlockId(nextBlocks[0]?.id || null);
    setUndoStack([]);
  }, [project.id]);

  // Debounced persistence to App / Firestore
  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdateProject({
        ...project,
        name: projectName,
        blocks,
        updatedAt: 'Just now',
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [blocks, projectName]);

  const commitBlocks = useCallback(
    (updater: (prev: CanvasBlock[]) => CanvasBlock[], recordUndo = true) => {
      setBlocks((prev) => {
        if (recordUndo) {
          setUndoStack((u) => [...u.slice(-19), prev]);
        }
        return updater(prev);
      });
    },
    []
  );

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || blocks[0] || null;

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

  // Reactive Logic Action Executor in Preview Stage
  const handleTriggerAction = (sourceBlock: CanvasBlock) => {
    const action = sourceBlock.action || 'increment-counter';
    if (action === 'increment-counter') {
      const targetCounter =
        blocks.find((b) => b.id === sourceBlock.targetId) ||
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
        onToast('No counter block wired yet. Add a Reactive State Counter!', 'info');
      }
    } else if (action === 'toggle-visibility') {
      const toggleTarget =
        blocks.find((b) => b.id === sourceBlock.targetId) ||
        blocks.find((b) => b.type === 'logic-toggle' || b.type === 'ui-accordion');
      if (toggleTarget) {
        handleUpdateBlock({ ...toggleTarget, isExpanded: !toggleTarget.isExpanded });
        onToast(`Toggled "${toggleTarget.name}" state`, 'info');
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
    const blob = new Blob([JSON.stringify({ name: projectName, blocks }, null, 2)], {
      type: 'application/json',
    });
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
        const loadedBlocks = parsed.blocks || parsed.project?.blocks;
        if (Array.isArray(loadedBlocks)) {
          commitBlocks(() => loadedBlocks);
          if (parsed.name) setProjectName(parsed.name);
          onToast('Blueprint imported into SL Studio!', 'success');
        } else {
          onToast('Invalid SL Builder blueprint file.', 'error');
        }
      } catch {
        onToast('Could not parse JSON blueprint.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setOpenMenu(null);
  };

  const generatedCode =
    exportTarget === 'html'
      ? generateHtmlExport(projectName, blocks)
      : exportTarget === 'react'
      ? generateReactTsxExport(projectName, blocks)
      : generateFlaskExport(projectName, blocks);

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
                      setBlocks(last);
                      setUndoStack((u) => u.slice(0, -1));
                      onToast('Undid last block change.', 'info');
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
            onClick={() => setActiveTab('export')}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/8 hover:bg-white/15 border border-white/10 text-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'si' ? 'කේතය' : 'Export Code'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onUpdateProject({ ...project, name: projectName, blocks, updatedAt: 'Just now' });
              onToast('Project saved cleanly!', 'success');
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

      {/* ================= 2. SUB-HEADER: STUDIO TABS + VIEWPORT & STAGE CONTROLS ================= */}
      <div className="h-11 bg-[#0D1017] px-2 pt-1.5 flex items-end justify-between border-b border-white/10 shrink-0">
        {/* Left 3 WebStudio Tabs */}
        <div className="flex items-end gap-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('canvas')}
            className={`px-4 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'canvas'
                ? 'bg-[#161B26] text-[#60A5FA] border-t border-l border-r border-white/15 -mb-[1px] pb-[9px]'
                : 'bg-[#0F131B] text-slate-400 hover:text-slate-100 border border-transparent'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{lang === 'si' ? 'බ්ලොක් සහ කැන්වසය' : 'Blocks & Canvas'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('style')}
            className={`px-4 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'style'
                ? 'bg-[#161B26] text-[#60A5FA] border-t border-l border-r border-white/15 -mb-[1px] pb-[9px]'
                : 'bg-[#0F131B] text-slate-400 hover:text-slate-100 border border-transparent'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{lang === 'si' ? 'හැඩතල සහ තර්කන' : 'Style & Logic'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'export'
                ? 'bg-[#161B26] text-[#60A5FA] border-t border-l border-r border-white/15 -mb-[1px] pb-[9px]'
                : 'bg-[#0F131B] text-slate-400 hover:text-slate-100 border border-transparent'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{lang === 'si' ? 'කේත අපනයනය' : 'Export Code'}</span>
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
            {/* TAB 1: BLOCKS & CANVAS */}
            {activeTab === 'canvas' && (
              <>
                {/* 3a. Far-Left Category Rail (Colored Circles matching Scratch structure) */}
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

                {/* 3c. Center Dotted Visual Blueprint Stack Canvas */}
                <main
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleCanvasDrop}
                  className="flex-1 relative overflow-auto bg-[#0A0D13]"
                  style={{
                    backgroundImage:
                      'radial-gradient(rgba(255, 255, 255, 0.14) 1.2px, transparent 1.2px)',
                    backgroundSize: '24px 24px',
                  }}
                >
                  <div
                    className="min-h-full p-5 max-w-2xl mx-auto space-y-2.5 origin-top"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    {blocks.length === 0 ? (
                      <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/15 rounded-2xl">
                        <p className="text-xs font-semibold text-slate-300">
                          {lang === 'si'
                            ? 'වම් පසින් WebStudio බ්ලොක් එකක් ක්ලික් කරන්න හෝ අදින්න'
                            : 'Click or drag any WebStudio block from the left palette'}
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
                            {/* Block Top Row */}
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

                            {/* Inline Block Content & Wire Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="text"
                                value={blk.content}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBlockId(blk.id);
                                }}
                                onChange={(e) =>
                                  handleUpdateBlock({ ...blk, content: e.target.value })
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
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Floating Bottom-Right Zoom Controls */}
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
                </main>
              </>
            )}

            {/* TAB 2: STYLE & LOGIC CONFIGURATOR */}
            {activeTab === 'style' && (
              <div className="flex-1 p-6 overflow-y-auto bg-[#0A0D13]">
                {!selectedBlock ? (
                  <p className="text-xs text-slate-400">Select any block to configure styles & logic.</p>
                ) : (
                  <div className="max-w-2xl mx-auto space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <span className="text-[11px] font-mono text-[#60A5FA] uppercase">
                          Selected Block · {selectedBlock.type}
                        </span>
                        <h2 className="text-lg font-bold text-white">{selectedBlock.name}</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDuplicateBlock(selectedBlock)}
                        className="px-3 py-1.5 rounded-lg bg-[#161B26] hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Duplicate Block
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#11151E] p-5 rounded-2xl border border-white/10 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Block Label</label>
                        <input
                          type="text"
                          value={selectedBlock.name}
                          onChange={(e) =>
                            handleUpdateBlock({ ...selectedBlock, name: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#090B10] border border-white/15 text-white outline-none focus:border-[#4D97FF]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Text Alignment</label>
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
                                  ? 'bg-[#2563EB] text-white'
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

                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-slate-400 font-semibold">Primary Content / Headline</label>
                        <input
                          type="text"
                          value={selectedBlock.content}
                          onChange={(e) =>
                            handleUpdateBlock({ ...selectedBlock, content: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#090B10] border border-white/15 text-white outline-none focus:border-[#4D97FF]"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-slate-400 font-semibold">Subtitle / Description</label>
                        <textarea
                          rows={2}
                          value={selectedBlock.subtitle || ''}
                          onChange={(e) =>
                            handleUpdateBlock({ ...selectedBlock, subtitle: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#090B10] border border-white/15 text-white outline-none focus:border-[#4D97FF]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Reactive Wire Action</label>
                        <select
                          value={selectedBlock.action || ''}
                          onChange={(e) =>
                            handleUpdateBlock({
                              ...selectedBlock,
                              action: (e.target.value || undefined) as CanvasBlock['action'],
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#090B10] border border-white/15 text-white outline-none focus:border-[#4D97FF]"
                        >
                          <option value="">None</option>
                          <option value="increment-counter">Increment Counter (+1)</option>
                          <option value="toggle-visibility">Toggle State / Accordion</option>
                          <option value="call-api">Call Flask / REST API</option>
                          <option value="alert">Show Toast Notification</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Wire Target / Endpoint</label>
                        {selectedBlock.type.startsWith('backend-') ? (
                          <input
                            type="text"
                            value={selectedBlock.apiEndpoint || '/api/v1/metrics'}
                            onChange={(e) =>
                              handleUpdateBlock({ ...selectedBlock, apiEndpoint: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-[#090B10] border border-white/15 text-emerald-300 font-mono outline-none"
                          />
                        ) : (
                          <select
                            value={selectedBlock.targetId || ''}
                            onChange={(e) =>
                              handleUpdateBlock({ ...selectedBlock, targetId: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-[#090B10] border border-white/15 text-white outline-none"
                          >
                            <option value="">Auto-detect target block</option>
                            {blocks.map((b) => (
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
              </div>
            )}

            {/* TAB 3: EXPORT CODE COMPILER */}
            {activeTab === 'export' && (
              <div className="flex-1 p-5 flex flex-col gap-4 bg-[#0A0D13] overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1 bg-[#11151E] p-1 rounded-xl border border-white/10">
                    {(
                      [
                        { id: 'html', label: 'HTML5 + Tailwind' },
                        { id: 'react', label: 'React 19 TSX' },
                        { id: 'flask', label: 'Python Flask' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setExportTarget(t.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
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
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCode);
                        setCopiedExport(true);
                        onToast('Code copied to clipboard!', 'success');
                        setTimeout(() => setCopiedExport(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#161B26] hover:bg-white/10 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedExport ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedExport ? 'Copied' : 'Copy Code'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const ext =
                          exportTarget === 'html' ? 'html' : exportTarget === 'react' ? 'tsx' : 'py';
                        const blob = new Blob([generatedCode], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}.${ext}`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <pre className="flex-1 overflow-auto rounded-xl bg-[#05070B] border border-white/10 p-4 text-[11px] font-mono text-sky-300 leading-relaxed select-text">
                  {generatedCode}
                </pre>
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
              stageSize === 'fullscreen' ? 'h-full max-w-5xl' : 'h-[54%]'
            } flex flex-col items-center justify-center bg-[#05070B] rounded-xl border border-white/15 overflow-hidden shadow-lg`}
          >
            {/* Browser Preview Frame respecting Desktop/Tablet/Mobile */}
            <div
              className={`h-full flex flex-col bg-[#07090E] transition-all duration-300 overflow-hidden ${
                viewport === 'mobile'
                  ? 'w-[280px] border-x border-white/15'
                  : viewport === 'tablet'
                  ? 'w-[375px] border-x border-white/15'
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
                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[180px]">
                  preview.slbuilder.app · {viewport}
                </span>
                <span className="text-[10px] font-mono text-emerald-400">Live</span>
              </div>

              {/* Scrollable Interactive Rendered App */}
              <div className="flex-1 overflow-y-auto">
                <WebPreviewRenderer
                  blocks={blocks}
                  selectedBlockId={selectedBlock?.id || null}
                  onSelectBlock={setSelectedBlockId}
                  onTriggerAction={handleTriggerAction}
                  onUpdateBlock={handleUpdateBlock}
                  accentHex={themeConfig.accentHex}
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
                        <span className="font-semibold text-slate-400">Text</span>
                        <input
                          type="text"
                          value={selectedBlock.content}
                          onChange={(e) =>
                            handleUpdateBlock({ ...selectedBlock, content: e.target.value })
                          }
                          className="flex-1 min-w-0 px-2.5 py-1 rounded-full bg-[#0A0D13] border border-white/15 text-slate-100 outline-none focus:border-[#4C97FF]"
                        />
                      </div>
                    </div>

                    <div className="flex-1 p-3 bg-[#0C0F16] overflow-y-auto space-y-2 text-[11px]">
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-400 block">Subtitle / Helper</span>
                        <input
                          type="text"
                          value={selectedBlock.subtitle || ''}
                          onChange={(e) =>
                            handleUpdateBlock({ ...selectedBlock, subtitle: e.target.value })
                          }
                          placeholder="Optional subtitle or link text..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#141923] border border-white/10 text-slate-200 outline-none focus:border-[#4C97FF]"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab('style')}
                          className="text-[11px] font-semibold text-[#60A5FA] hover:underline cursor-pointer"
                        >
                          Open full Style &amp; Logic wiring &rarr;
                        </button>
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

              {/* Right Narrow Layers Column (Matches Scratch Stage/Backdrops panel) */}
              <div className="w-[105px] bg-[#11151E] rounded-xl border border-white/10 flex flex-col justify-between p-2 relative shrink-0 overflow-hidden">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 pb-1.5 border-b border-white/10">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#60A5FA]" /> Layers
                  </span>
                  <span className="font-mono text-slate-400">{blocks.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 py-1.5">
                  {blocks.map((b) => {
                    const meta = getCategoryMetaForBlockType(b.type);
                    const active = b.id === selectedBlock?.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBlockId(b.id)}
                        className={`w-full text-left px-1.5 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                          active
                            ? 'bg-[#1E2B45] border-[#4C97FF] text-white'
                            : 'bg-[#161B26] border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span className="truncate">{b.name}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setShowSectionModal(true)}
                  title="Add Section Kit"
                  className="mt-1 w-full h-8 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] text-white flex items-center justify-center cursor-pointer shrink-0"
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
              <li>Select any category on the left rail and click or drag blocks onto the canvas.</li>
              <li>Edit headlines, counters, or API routes in the canvas or bottom-right Inspector.</li>
              <li>Switch Desktop, Tablet, and Mobile preview frames above the Live Stage.</li>
              <li>Export clean HTML5, React 19 TSX, or Python Flask code in the Export Code tab.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
