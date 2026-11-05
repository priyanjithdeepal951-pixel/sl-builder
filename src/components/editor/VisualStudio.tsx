import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  Code2,
  Play,
  Sparkles,
  CloudCheck,
  ChevronRight,
  Menu,
  Users,
  Eye,
  Archive,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { CanvasBlock, Project, ViewportMode, BlockType } from '../../types/builder';
import { BlockPalette } from './BlockPalette';
import { CanvasArea } from './CanvasArea';
import { InspectorPanel } from './InspectorPanel';
import { CodeExportModal } from './CodeExportModal';
import { SimulationModal } from './SimulationModal';
import { EditorSettingsMenu } from './EditorSettingsMenu';
import { ThemeSwitcher } from '../ThemeSwitcher';
import { useTheme } from '../../context/ThemeContext';

interface VisualStudioProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onBackToProjects: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isMeteorShower?: boolean;
  onToggleMeteorShower?: () => void;
}

export const VisualStudio: React.FC<VisualStudioProps> = ({
  project,
  onUpdateProject,
  onBackToProjects,
  onToast,
  isMeteorShower = false,
  onToggleMeteorShower,
}) => {
  const { themeConfig } = useTheme();
  const [blocks, setBlocks] = useState<CanvasBlock[]>(project.blocks || []);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    project.blocks?.[0]?.id || null
  );
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [projectName, setProjectName] = useState(project.name);

  // View preferences
  const [editorFontSize, setEditorFontSize] = useState<number>(14);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [settingsInitialModal, setSettingsInitialModal] = useState<'people' | null>(null);
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [isFolded, setIsFolded] = useState<boolean>(false);
  const [localMeteorShower, setLocalMeteorShower] = useState<boolean>(isMeteorShower);

  // Undo / Redo history stacks
  const [history, setHistory] = useState<CanvasBlock[][]>([project.blocks || []]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Sync to parent project whenever blocks or name change
  const pushState = (newBlocks: CanvasBlock[]) => {
    setBlocks(newBlocks);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    onUpdateProject({
      ...project,
      name: projectName,
      blocks: newBlocks,
      updatedAt: 'Just now',
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const prevBlocks = history[prevIndex];
      setBlocks(prevBlocks);
      onUpdateProject({ ...project, blocks: prevBlocks });
      onToast('Undo applied (Ctrl Z)', 'info');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const nextBlocks = history[nextIndex];
      setBlocks(nextBlocks);
      onUpdateProject({ ...project, blocks: nextBlocks });
      onToast('Redo applied (Ctrl Shift Z)', 'info');
    }
  };

  // Keyboard shortcut listener for undo/redo & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setIsSplitView((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '[') {
        e.preventDefault();
        setIsFolded((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Block handlers
  const handleAddBlock = (type: BlockType) => {
    const newId = `block_${type}_${Date.now()}`;
    let newBlock: CanvasBlock;

    switch (type) {
      case 'ui-heading':
        newBlock = {
          id: newId,
          type,
          category: 'ui',
          name: 'Custom Heading Title',
          content: 'Modern Web Experience',
          subtitle: 'Crafted with SL Visual Drag & Drop Studio',
          style: { fontSize: '3xl', textAlign: 'left', textColor: 'text-white' },
        };
        break;
      case 'ui-paragraph':
        newBlock = {
          id: newId,
          type,
          category: 'ui',
          name: 'Paragraph Text',
          content: 'Design layouts with zero limits. Connect interactive wires to trigger client state and microservice calls.',
          style: { fontSize: 'sm', textAlign: 'left', textColor: 'text-gray-300' },
        };
        break;
      case 'ui-button':
        newBlock = {
          id: newId,
          type,
          category: 'ui',
          name: 'Action Button',
          content: 'Click Me',
          buttonVariant: 'primary',
          action: 'change-text',
          actionPayload: 'Hello Universe!',
          style: { bgColor: 'bg-indigo-600', padding: 'py-2.5 px-6', borderRadius: 'rounded-xl' },
        };
        break;
      case 'ui-navbar':
        newBlock = {
          id: newId,
          type,
          category: 'ui',
          name: 'Navigation Bar',
          content: 'Universe Brand',
          subtitle: 'Explore · Features · Docs · Community',
          style: { bgColor: 'bg-gray-950/80', padding: 'p-4', borderRadius: 'rounded-xl' },
        };
        break;
      case 'ui-pricing':
        newBlock = {
          id: newId,
          type,
          category: 'ui',
          name: 'Pricing Tier Block',
          content: 'Pro Developer — $29/mo',
          subtitle: 'Unlimited projects, custom domains, and full code export.',
          style: { bgColor: 'bg-gray-900', padding: 'p-6', borderRadius: 'rounded-2xl' },
        };
        break;
      case 'logic-counter':
        newBlock = {
          id: newId,
          type,
          category: 'logic',
          name: 'Reactive Counter Block',
          content: 'Clicks Registered: 0',
          counterValue: 0,
          action: 'increment-counter',
          style: { bgColor: 'bg-indigo-950/40', padding: 'p-5', borderRadius: 'rounded-2xl' },
        };
        break;
      case 'backend-flask':
        newBlock = {
          id: newId,
          type,
          category: 'backend',
          name: 'Python Flask API Endpoint',
          content: 'GET /api/v1/hello ➔ {"message": "Hello from Flask backend"}',
          apiEndpoint: '/api/v1/hello',
          action: 'call-api',
          subtitle: 'Ready to connect with Python REST server',
          style: { bgColor: 'bg-emerald-950/30', padding: 'p-4', borderRadius: 'rounded-xl' },
        };
        break;
      default:
        newBlock = {
          id: newId,
          type,
          category: 'ui',
          name: `${type} Block`,
          content: `New ${type} Content`,
          style: { bgColor: 'bg-gray-900/60', padding: 'p-4', borderRadius: 'rounded-xl' },
        };
    }

    const updated = [...blocks, newBlock];
    pushState(updated);
    setSelectedBlockId(newBlock.id);
    onToast(`Added ${newBlock.name} to canvas!`, 'success');
  };

  const handleDragStart = (e: React.DragEvent, type: BlockType) => {
    e.dataTransfer.setData('text/plain', type);
  };

  const handleDrop = (e: React.DragEvent) => {
    const type = e.dataTransfer.getData('text/plain') as BlockType;
    if (type) {
      handleAddBlock(type);
    }
  };

  const handleUpdateBlock = (updatedBlock: CanvasBlock) => {
    const updated = blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b));
    pushState(updated);
  };

  const handleDeleteBlock = (id: string) => {
    const updated = blocks.filter((b) => b.id !== id);
    pushState(updated);
    if (selectedBlockId === id) {
      setSelectedBlockId(updated[0]?.id || null);
    }
    onToast('Block removed from canvas.', 'info');
  };

  const handleDuplicateBlock = (id: string) => {
    const target = blocks.find((b) => b.id === id);
    if (!target) return;
    const duplicated: CanvasBlock = {
      ...target,
      id: `block_${target.type}_${Date.now()}`,
      name: `${target.name} (Copy)`,
    };
    const targetIndex = blocks.findIndex((b) => b.id === id);
    const updated = [...blocks];
    updated.splice(targetIndex + 1, 0, duplicated);
    pushState(updated);
    setSelectedBlockId(duplicated.id);
    onToast('Block duplicated!', 'success');
  };

  const handleDuplicateSelected = () => {
    if (selectedBlockId) {
      handleDuplicateBlock(selectedBlockId);
    } else {
      onToast('Select a block on canvas first', 'info');
    }
  };

  const handleDeleteSelected = () => {
    if (selectedBlockId) {
      handleDeleteBlock(selectedBlockId);
    } else {
      onToast('Select a block on canvas first', 'info');
    }
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...blocks];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    pushState(updated);
  };

  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear all blocks from this canvas?')) {
      pushState([]);
      setSelectedBlockId(null);
      onToast('Canvas cleared.', 'info');
    }
  };

  const handleSimulateBlockAction = (block: CanvasBlock) => {
    if (block.action === 'increment-counter') {
      const updated = blocks.map((b) => {
        if (b.id === block.targetId || b.id === block.id) {
          return { ...b, counterValue: (b.counterValue || 0) + 1 };
        }
        return b;
      });
      pushState(updated);
      onToast(`⚡ State updated (+1)!`, 'success');
    } else if (block.action === 'change-text') {
      const payload = block.actionPayload || 'Hello, Universe!';
      const updated = blocks.map((b) => {
        if (b.id === block.targetId) {
          return { ...b, content: payload };
        }
        return b;
      });
      pushState(updated);
      onToast(`⚡ Text updated to "${payload}"!`, 'success');
    } else if (block.action === 'call-api') {
      onToast(`🐍 Dispatched Flask API GET ${block.apiEndpoint || '/api/hello'}`, 'info');
    } else {
      setSelectedBlockId(block.id);
    }
  };

  const handleNameBlur = () => {
    onUpdateProject({
      ...project,
      name: projectName,
      blocks,
      updatedAt: 'Just now',
    });
  };

  const toggleMeteorShower = () => {
    if (onToggleMeteorShower) {
      onToggleMeteorShower();
    }
    setLocalMeteorShower((prev) => !prev);
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  return (
    <div className="flex-grow flex flex-col h-screen overflow-hidden bg-[#07090e]/95 text-[#f1f5f9] relative">
      {/* ================= TOP STUDIO BAR (Exact match to User Screenshot) ================= */}
      <div className="bg-[#0b0e18] border-b border-white/10 px-3 sm:px-4 py-2 flex items-center justify-between text-xs z-30 select-none">
        {/* Left Side: Back to Projects & Project Name with Badges */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToProjects}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Back to Projects"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Projects</span>
          </button>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={handleNameBlur}
              className="bg-transparent text-white font-bold text-sm outline-none border-b border-transparent focus:border-indigo-500 px-1 py-0.5 max-w-[130px] sm:max-w-[180px] md:max-w-[240px]"
            />

            {/* Status chips matching user photo */}
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400">
              Exported
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live</span>
            </span>
          </div>
        </div>

        {/* Center: Viewport Switcher, Zoom Controls & History Undo/Redo */}
        <div className="hidden md:flex items-center gap-2">
          {/* History Controls */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/5">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-25 transition-colors cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-25 transition-colors cursor-pointer"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Viewports */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/5">
            <button
              onClick={() => setViewportMode('desktop')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewportMode === 'desktop' ? 'bg-white/15 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Desktop View (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewportMode('tablet')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewportMode === 'tablet' ? 'bg-white/15 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewportMode('mobile')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewportMode === 'mobile' ? 'bg-white/15 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/5 text-[11px] font-mono text-slate-400">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(50, prev - 10))}
              disabled={zoomLevel <= 50}
              className="p-1 rounded hover:text-white disabled:opacity-25 transition-colors cursor-pointer"
              title="Zoom Out (-10%)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="px-1.5 py-0.5 text-[10px] font-bold hover:text-white transition-colors cursor-pointer"
              title="Reset Zoom to 100%"
            >
              {zoomLevel}%
            </button>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(150, prev + 10))}
              disabled={zoomLevel >= 150}
              className="p-1 rounded hover:text-white disabled:opacity-25 transition-colors cursor-pointer"
              title="Zoom In (+10%)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Side: Actions matching screenshot (People, Preview, Export, and Menu '≡') */}
        <div className="flex items-center gap-1.5 sm:gap-2 relative">
          {/* People button from screenshot */}
          <button
            onClick={() => {
              setSettingsInitialModal('people');
              setIsSettingsMenuOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Collaborators and workspace"
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">People</span>
          </button>

          {/* Preview button from screenshot */}
          <button
            onClick={() => setIsSimulationOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Preview and interactive simulation sandbox"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Export button from screenshot */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Export source code bundle"
          >
            <Archive className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* SETTINGS / MENU BUTTON '≡' (Exact match to User's Screenshot) */}
          <button
            onClick={() => {
              setSettingsInitialModal(null);
              setIsSettingsMenuOpen((prev) => !prev);
            }}
            className={`p-1.5 sm:px-2 rounded-lg border transition-colors flex items-center justify-center cursor-pointer ${
              isSettingsMenuOpen
                ? 'bg-white/20 border-white/30 text-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
            }`}
            title="Settings and workspace menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* THE 2-COLUMN SETTINGS FLYOUT MENU */}
          <EditorSettingsMenu
            isOpen={isSettingsMenuOpen}
            onClose={() => {
              setIsSettingsMenuOpen(false);
              setSettingsInitialModal(null);
            }}
            project={{ ...project, name: projectName, blocks }}
            onUpdateProject={pushState ? (p) => pushState(p.blocks) : onUpdateProject}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onExportCode={() => setIsExportOpen(true)}
            onOpenSimulation={() => setIsSimulationOpen(true)}
            onBackToProjects={onBackToProjects}
            onToast={onToast}
            editorFontSize={editorFontSize}
            onSetEditorFontSize={setEditorFontSize}
            isSplitView={isSplitView}
            onToggleSplitView={() => setIsSplitView((prev) => !prev)}
            isFolded={isFolded}
            onToggleFoldView={() => setIsFolded((prev) => !prev)}
            isMeteorShowerActive={localMeteorShower}
            onToggleMeteorShower={toggleMeteorShower}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onDuplicateSelectedBlock={handleDuplicateSelected}
            onDeleteSelectedBlock={handleDeleteSelected}
            onResumeStudio={() => {
              setIsSettingsMenuOpen(false);
              setSettingsInitialModal(null);
            }}
            initialModal={settingsInitialModal}
          />
        </div>
      </div>

      {/* ================= WORKSPACE (3-COLUMN OR SPLIT VIEW) ================= */}
      <div className="flex-grow flex overflow-hidden">
        {/* Left: Component & Block Palette (Collapsible via fold view) */}
        {!isFolded && (
          <BlockPalette
            onAddBlock={handleAddBlock}
            onDragStart={handleDragStart}
            blocksOnCanvas={blocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onDeleteBlock={handleDeleteBlock}
            onMoveBlock={handleMoveBlock}
          />
        )}

        {/* Center: Canvas Workspace */}
        <CanvasArea
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onDeleteBlock={handleDeleteBlock}
          onDuplicateBlock={handleDuplicateBlock}
          onMoveBlock={handleMoveBlock}
          onDrop={handleDrop}
          viewportMode={viewportMode}
          zoomLevel={zoomLevel}
          onSimulateBlockAction={handleSimulateBlockAction}
        />

        {/* Split View Live Code Pane (When toggled via menu Ctrl \) */}
        {isSplitView && (
          <div className="w-80 lg:w-96 bg-[#05070d] border-l border-white/10 flex flex-col h-full overflow-hidden font-mono text-xs">
            <div className="p-3 border-b border-white/10 bg-[#090c15] flex items-center justify-between text-slate-400">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Split View: Live Code</span>
              </span>
              <span className="text-[10px] text-slate-500">{editorFontSize}px</span>
            </div>
            <div
              className="flex-grow p-4 overflow-y-auto leading-relaxed text-cyan-300"
              style={{ fontSize: `${editorFontSize}px` }}
            >
              <pre className="whitespace-pre-wrap">
{`<!-- SL Builder Component Stack -->
<main class="space-y-4">
${blocks
  .map(
    (b) =>
      `  <div id="${b.id}" class="${b.style.bgColor || 'bg-slate-900'} ${b.style.padding || 'p-4'}">\n    <h2>${b.content}</h2>\n  </div>`
  )
  .join('\n')}
</main>`}
              </pre>
            </div>
          </div>
        )}

        {/* Right: Inspector Properties & Live Code Drawer */}
        <InspectorPanel
          selectedBlock={selectedBlock}
          allBlocks={blocks}
          onUpdateBlock={handleUpdateBlock}
          onDeleteBlock={handleDeleteBlock}
          onDuplicateBlock={handleDuplicateBlock}
        />
      </div>

      {/* CODE EXPORT MODAL */}
      <CodeExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={{ ...project, name: projectName, blocks }}
        onToast={onToast}
      />

      {/* SIMULATION MODAL */}
      <SimulationModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        project={{ ...project, name: projectName, blocks }}
      />
    </div>
  );
};
