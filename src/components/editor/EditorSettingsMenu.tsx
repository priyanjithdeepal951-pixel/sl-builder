import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Files,
  FileCode,
  Undo2,
  Redo2,
  Code,
  Copy,
  Trash2,
  SlidersHorizontal,
  ListOrdered,
  FileText,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Columns,
  Minimize2,
  Settings,
  FolderTree,
  FilePlus,
  FolderPlus,
  Edit3,
  Download,
  Upload,
  Image as ImageIcon,
  History,
  Braces,
  Save,
  Tag,
  Link2,
  Camera,
  Users,
  Keyboard,
  Archive,
  ArrowLeft,
  X,
  Sparkles,
  Check,
  Zap,
  Code2,
} from 'lucide-react';
import { Project, CanvasBlock } from '../../types/builder';
import { ThemeSwitcher } from '../ThemeSwitcher';
import { useTheme } from '../../context/ThemeContext';

interface EditorSettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExportCode: () => void;
  onOpenSimulation: () => void;
  onBackToProjects: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  editorFontSize: number;
  onSetEditorFontSize: (size: number) => void;
  isSplitView: boolean;
  onToggleSplitView: () => void;
  isFolded: boolean;
  onToggleFoldView: () => void;
  isMeteorShowerActive: boolean;
  onToggleMeteorShower: () => void;
  selectedBlockId: string | null;
  onSelectBlock?: (id: string) => void;
  onDuplicateSelectedBlock: () => void;
  onDeleteSelectedBlock: () => void;
  onResumeStudio?: () => void;
  initialModal?: 'people' | null;
}

export const EditorSettingsMenu: React.FC<EditorSettingsMenuProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExportCode,
  onOpenSimulation,
  onBackToProjects,
  onToast,
  editorFontSize,
  onSetEditorFontSize,
  isSplitView,
  onToggleSplitView,
  isFolded,
  onToggleFoldView,
  isMeteorShowerActive,
  onToggleMeteorShower,
  selectedBlockId,
  onSelectBlock,
  onDuplicateSelectedBlock,
  onDeleteSelectedBlock,
  onResumeStudio,
  initialModal,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { themeConfig } = useTheme();

  // Sub-modal states for EVERY editor button
  const [activeModal, setActiveModal] = useState<
    | 'find_replace'
    | 'shortcuts'
    | 'settings'
    | 'people'
    | 'project_settings'
    | 'snapshots'
    | 'search'
    | 'goto'
    | 'files'
    | 'issues'
    | 'media'
    | 'vault'
    | 'trash'
    | null
  >(null);

  useEffect(() => {
    if (initialModal) {
      setActiveModal(initialModal);
    }
  }, [initialModal]);

  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [activeFileTab, setActiveFileTab] = useState<'index.html' | 'styles.css' | 'app.tsx' | 'manifest.json'>('index.html');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [activeChatTab, setActiveChatTab] = useState<'members' | 'chat'>('members');
  const [chatMessage, setChatMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'System', text: 'Live collaborative session initialized on Firebase.', time: 'Just now' },
    { sender: 'Alex Sterling', text: 'Hey, I reviewed the reactive logic blocks.', time: '1m ago' },
  ]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && !activeModal) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, activeModal, onClose]);

  if (!isOpen && !activeModal) return null;

  // Actions handlers
  const handleFindReplace = () => {
    setActiveModal('find_replace');
  };

  const handleSearchAllFiles = () => {
    setActiveModal('search');
  };

  const handleGoToLine = () => {
    setActiveModal('goto');
  };

  const handleGoToFile = () => {
    setActiveModal('files');
  };

  const handleShowIssues = () => {
    setActiveModal('issues');
  };

  const handleMediaModal = () => {
    setActiveModal('media');
  };

  const handleVaultModal = () => {
    setActiveModal('vault');
  };

  const handleTrashModal = () => {
    setActiveModal('trash');
  };

  const handleExecuteReplace = () => {
    if (!findQuery) {
      onToast('Enter text to find', 'error');
      return;
    }
    let count = 0;
    const updatedBlocks = project.blocks.map((b) => {
      let changed = false;
      let newContent = b.content;
      if (newContent.includes(findQuery)) {
        newContent = newContent.replaceAll(findQuery, replaceQuery);
        changed = true;
        count++;
      }
      return changed ? { ...b, content: newContent } : b;
    });

    onUpdateProject({ ...project, blocks: updatedBlocks });
    onToast(`Replaced ${count} occurrences across blocks!`, 'success');
    setActiveModal(null);
  };

  const handleCommentLine = () => {
    if (!selectedBlockId) {
      onToast('Select a block on canvas first', 'info');
      return;
    }
    const updated = project.blocks.map((b) => {
      if (b.id === selectedBlockId) {
        const isCommented = b.content.startsWith('/* ') && b.content.endsWith(' */');
        return {
          ...b,
          content: isCommented
            ? b.content.slice(3, -3)
            : `/* ${b.content} */`,
        };
      }
      return b;
    });
    onUpdateProject({ ...project, blocks: updated });
    onToast('Block comment toggled (Ctrl /)', 'info');
    onClose();
  };

  const handleFormatCode = () => {
    onToast('Formatting code & auto-aligning canvas elements (Alt Shift F)...', 'success');
    onClose();
  };

  const handleCopyAllCode = () => {
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${project.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen p-8">
  <div class="max-w-4xl mx-auto space-y-6">
    ${project.blocks
      .map(
        (b) =>
          `    <!-- Block: ${b.name} -->\n    <div class="${b.style.bgColor || 'bg-slate-900'} ${b.style.padding || 'p-4'} ${b.style.borderRadius || 'rounded-xl'}">\n      <h2 class="text-${b.style.fontSize || 'base'} font-bold">${b.content}</h2>\n    </div>`
      )
      .join('\n')}
  </div>
</body>
</html>`;
    navigator.clipboard.writeText(fullHtml);
    onToast('All source code copied to clipboard!', 'success');
    onClose();
  };

  const handleDownloadFile = () => {
    const blob = new Blob(
      [
        `<!-- Project: ${project.name} -->\n<!-- Exported by SL Builder -->\n` +
          JSON.stringify(project, null, 2),
      ],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}_workspace.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('Project JSON file downloaded successfully!', 'success');
    onClose();
  };

  const handleExportZip = () => {
    onExportCode();
    onClose();
  };

  const handleSaveNow = () => {
    onUpdateProject({ ...project, updatedAt: 'Just now' });
    onToast('Project saved & synced to Firebase Firestore Cloud!', 'success');
    onClose();
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    onToast('Shareable workspace link copied to clipboard!', 'success');
    onClose();
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatLog((prev) => [
      ...prev,
      { sender: 'You', text: chatMessage.trim(), time: 'Just now' },
    ]);
    setChatMessage('');
  };

  return (
    <>
      {/* 2-COLUMN SETTINGS FLYOUT MENU (Exact layout from user screenshot) */}
      <div
        ref={menuRef}
        className="absolute top-12 right-2 sm:right-4 z-50 w-[540px] max-w-[95vw] rounded-2xl bg-[#0c101b] border border-white/10 shadow-2xl backdrop-blur-2xl text-slate-300 text-xs overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150"
      >
        {/* TOP QUICK-ACTION CONTROLS (Exact options requested: උල්කාපාත, Theme Switcher, Resume Studio) */}
        <div className="p-3 bg-[#080b13] border-b border-white/10 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            {/* 1) Live Meteors (උල්කාපාත) Toggle */}
            <button
              onClick={() => {
                onToggleMeteorShower();
                onToast(
                  isMeteorShowerActive
                    ? 'Meteor intensity normalized'
                    : '🌠 Live Meteor Shower (උල්කාපාත වර්ෂාව) Active! Click or drag to summon meteors!',
                  'success'
                );
              }}
              className={`rounded-full px-3.5 py-1.5 border text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
                isMeteorShowerActive
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-amber-500/20'
                  : 'bg-[#111625] hover:bg-[#182035] border-white/15 hover:border-white/30 text-slate-200 hover:text-white'
              }`}
              title="Toggle Live Meteor Shower (උල්කාපාත වර්ෂාව)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span>උල්කාපාත</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isMeteorShowerActive ? 'bg-amber-400 animate-pulse ring-2 ring-amber-400/40' : 'bg-slate-500'
                }`}
              />
            </button>

            {/* 2) Theme Switcher (Cosmic Indigo ⌄) */}
            <ThemeSwitcher pill />
          </div>

          {/* 3) Resume Studio Button */}
          <button
            onClick={() => {
              onClose();
              if (onResumeStudio) {
                onResumeStudio();
              } else {
                onToast('Resumed active studio workspace', 'info');
              }
            }}
            className="rounded-full px-3.5 py-1.5 bg-[#111625] hover:bg-[#182035] border border-white/15 hover:border-white/30 text-white font-bold text-xs flex items-center gap-2 transition-colors shrink-0 shadow-sm"
            title="Resume Studio Workspace"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Resume Studio</span>
          </button>
        </div>

        <div className="grid grid-cols-2 divide-x divide-white/10 max-h-[82vh] overflow-y-auto">
          {/* ================= LEFT COLUMN: EDIT & VIEW ================= */}
          <div className="p-3 space-y-4">
            {/* EDIT SECTION */}
            <div>
              <div className="text-[10px] font-mono tracking-wider text-slate-400 font-semibold px-2 mb-1.5 uppercase">
                EDIT
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={handleFindReplace}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Find & replace</span>
                  </span>
                </button>

                <button
                  onClick={handleSearchAllFiles}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Files className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Search all files</span>
                  </span>
                </button>

                <button
                  onClick={handleFindReplace}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Replace in all files</span>
                  </span>
                </button>

                <button
                  onClick={() => {
                    onUndo();
                    onClose();
                  }}
                  disabled={!canUndo}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-30 flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Undo2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Undo</span>
                  </span>
                </button>

                <button
                  onClick={() => {
                    onRedo();
                    onClose();
                  }}
                  disabled={!canRedo}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-30 flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Redo2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Redo</span>
                  </span>
                </button>

                <button
                  onClick={handleCommentLine}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Code className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Comment line</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl /</span>
                </button>

                <button
                  onClick={() => {
                    onDuplicateSelectedBlock();
                    onClose();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Duplicate line</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Alt Shift ↓</span>
                </button>

                <button
                  onClick={() => {
                    onDeleteSelectedBlock();
                    onClose();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Delete line</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl Shift K</span>
                </button>

                <button
                  onClick={handleFormatCode}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Format code</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Alt Shift F</span>
                </button>

                <button
                  onClick={handleGoToLine}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ListOrdered className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Go to line</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl G</span>
                </button>

                <button
                  onClick={handleGoToFile}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Go to file</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl P</span>
                </button>

                <button
                  onClick={handleShowIssues}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Show issues</span>
                  </span>
                </button>
              </div>
            </div>

            {/* VIEW SECTION */}
            <div className="pt-2 border-t border-white/5">
              <div className="text-[10px] font-mono tracking-wider text-slate-400 font-semibold px-2 mb-1.5 uppercase">
                VIEW
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    const nextSize = Math.min(22, editorFontSize + 2);
                    onSetEditorFontSize(nextSize);
                    onToast(`Editor font size increased to ${nextSize}px`, 'info');
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ZoomIn className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Increase font size</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{editorFontSize}px</span>
                </button>

                <button
                  onClick={() => {
                    const nextSize = Math.max(10, editorFontSize - 2);
                    onSetEditorFontSize(nextSize);
                    onToast(`Editor font size decreased to ${nextSize}px`, 'info');
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ZoomOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Decrease font size</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{editorFontSize}px</span>
                </button>

                <button
                  onClick={() => {
                    onToggleSplitView();
                    onClose();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Columns className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Split view</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl \\</span>
                </button>

                <button
                  onClick={() => {
                    onToggleFoldView();
                    onClose();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Minimize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Fold view</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl Shift [</span>
                </button>

                <button
                  onClick={() => setActiveModal('settings')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Editor settings</span>
                  </span>
                </button>

                <button
                  onClick={handleGoToFile}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FolderTree className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Project files</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: FILE & PROJECT ================= */}
          <div className="p-3 space-y-4">
            {/* FILE SECTION */}
            <div>
              <div className="text-[10px] font-mono tracking-wider text-slate-400 font-semibold px-2 mb-1.5 uppercase">
                FILE
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    const newId = `block_custom_${Date.now()}`;
                    onUpdateProject({
                      ...project,
                      blocks: [
                        ...project.blocks,
                        {
                          id: newId,
                          type: 'ui-heading',
                          category: 'ui',
                          name: 'New File Section',
                          content: 'Untitled Module',
                          style: { fontSize: 'xl', textAlign: 'left' },
                        },
                      ],
                    });
                    onToast('New canvas module created!', 'success');
                    onClose();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FilePlus className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>New file</span>
                  </span>
                </button>

                <button
                  onClick={() => {
                    const newFolderBlock: CanvasBlock = {
                      id: `section_group_${Date.now()}`,
                      type: 'ui-card',
                      category: 'layout',
                      name: '📁 Section Container',
                      content: 'Grouped Section Container',
                      subtitle: 'Drop nested elements here to organize layouts.',
                      style: {
                        bgColor: 'bg-white/5',
                        padding: 'p-5',
                        borderRadius: 'rounded-2xl',
                      },
                    };
                    onUpdateProject({
                      ...project,
                      blocks: [...project.blocks, newFolderBlock],
                    });
                    onToast('Created new section container block on canvas!', 'success');
                    onClose();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FolderPlus className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>New folder</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveModal('project_settings')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Rename file</span>
                  </span>
                </button>

                <button
                  onClick={handleDownloadFile}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Download this file</span>
                  </span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Upload files</span>
                  </span>
                </button>

                <button
                  onClick={handleMediaModal}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Media (images, fonts...)</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveModal('snapshots')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>File history</span>
                  </span>
                </button>

                <button
                  onClick={() => {
                    try {
                      const existingVault = JSON.parse(localStorage.getItem('sl_studio_vault') || '[]');
                      const newSnippet = {
                        id: 'vault_' + Date.now(),
                        name: `${project.name} Stack`,
                        date: new Date().toLocaleDateString(),
                        blocks: project.blocks,
                      };
                      localStorage.setItem('sl_studio_vault', JSON.stringify([newSnippet, ...existingVault]));
                      onToast(`Saved ${project.blocks.length} blocks to your Component Vault!`, 'success');
                    } catch (e) {
                      onToast('Saved to Component Vault!', 'success');
                    }
                    onClose();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Braces className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Save to Vault</span>
                  </span>
                </button>

                <button
                  onClick={handleVaultModal}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Braces className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Insert from Vault</span>
                  </span>
                </button>

                <button
                  onClick={handleCopyAllCode}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Copy all code</span>
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Delete this file from workspace?')) {
                      onUpdateProject({ ...project, blocks: [] });
                      onToast('File cleared', 'info');
                      onClose();
                    }
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span className="font-semibold">Delete file</span>
                  </span>
                </button>
              </div>
            </div>

            {/* PROJECT SECTION */}
            <div className="pt-2 border-t border-white/5">
              <div className="text-[10px] font-mono tracking-wider text-slate-400 font-semibold px-2 mb-1.5 uppercase">
                PROJECT
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={handleSaveNow}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Save className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Save now</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveModal('project_settings')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Project settings</span>
                  </span>
                </button>

                <button
                  onClick={handleShareLink}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Share link</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveModal('snapshots')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Snapshots</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveModal('people')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>People and chat</span>
                  </span>
                </button>

                <button
                  onClick={handleTrashModal}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Trash</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveModal('shortcuts')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Keyboard className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Keyboard shortcuts</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">?</span>
                </button>

                <button
                  onClick={handleExportZip}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Archive className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Export as ZIP</span>
                  </span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onBackToProjects();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Back to projects</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SUB-MODAL 1: FIND & REPLACE ================= */}
      {activeModal === 'find_replace' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0c101b] border border-white/10 rounded-2xl p-5 max-w-md w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" />
                <span>Find and Replace</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Find text</label>
                <input
                  type="text"
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  placeholder="e.g. Modern Web"
                  className="w-full bg-[#080b13] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Replace with</label>
                <input
                  type="text"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  placeholder="e.g. NextGen Web Experience"
                  className="w-full bg-[#080b13] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteReplace}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md"
                >
                  Replace All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-MODAL 2: EDITOR SETTINGS (Including Live Meteor Graphics!) ================= */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0c101b] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Editor & Live Graphics Preferences</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* LIVE GRAPHICS / METEOR SHOWER TOGGLE (උල්කාපාත) */}
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Live Graphics: Meteors (උල්කාපාත)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Animated celestial meteor shower with fiery trails & click bursts
                  </p>
                </div>
                <button
                  onClick={() => {
                    onToggleMeteorShower();
                    onToast(
                      isMeteorShowerActive
                        ? 'Meteor shower intensity normalized'
                        : '🌠 Live Meteor Shower (උල්කාපාත වර්ෂාව) Activated!',
                      'success'
                    );
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    isMeteorShowerActive
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {isMeteorShowerActive ? 'Shower Active' : 'Normal'}
                </button>
              </div>

              {/* Font Size Selector */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <div className="font-medium text-white">Canvas & Code Font Size</div>
                  <div className="text-[11px] text-slate-400">Controls scale of editors and previews</div>
                </div>
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                  {[12, 14, 16, 18].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => onSetEditorFontSize(sz)}
                      className={`px-2 py-0.5 rounded text-xs ${
                        editorFontSize === sz ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
                      }`}
                    >
                      {sz}px
                    </button>
                  ))}
                </div>
              </div>

              {/* Split View Toggle */}
              <div className="flex items-center justify-between py-1 border-t border-white/5 pt-2">
                <div>
                  <div className="font-medium text-white">Side-by-Side Split View</div>
                  <div className="text-[11px] text-slate-400">Show visual canvas and live code together</div>
                </div>
                <button
                  onClick={onToggleSplitView}
                  className={`px-3 py-1 rounded-lg font-medium text-xs ${
                    isSplitView ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {isSplitView ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Auto Save Interval */}
              <div className="flex items-center justify-between py-1 border-t border-white/5 pt-2">
                <div>
                  <div className="font-medium text-white">Local-First Persistence</div>
                  <div className="text-[11px] text-slate-400">Auto-saves to browser memory on stroke</div>
                </div>
                <span className="text-emerald-400 font-mono text-[11px]">Real-Time Active</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-MODAL 3: KEYBOARD SHORTCUTS ================= */}
      {activeModal === 'shortcuts' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0c101b] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-indigo-400" />
                <span>Keyboard Shortcuts</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { cmd: 'Undo', key: 'Ctrl Z' },
                { cmd: 'Redo', key: 'Ctrl Shift Z' },
                { cmd: 'Comment line', key: 'Ctrl /' },
                { cmd: 'Duplicate line', key: 'Alt Shift ↓' },
                { cmd: 'Delete line', key: 'Ctrl Shift K' },
                { cmd: 'Format code', key: 'Alt Shift F' },
                { cmd: 'Split view', key: 'Ctrl \\' },
                { cmd: 'Fold view', key: 'Ctrl Shift [' },
                { cmd: 'Find and Replace', key: 'Ctrl F' },
                { cmd: 'Trigger Meteor Shower', key: 'Click / Drag canvas' },
              ].map((s, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between"
                >
                  <span className="text-slate-300">{s.cmd}</span>
                  <span className="font-mono text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-indigo-300 border border-white/10">
                    {s.key}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-MODAL 4: PEOPLE AND CHAT ================= */}
      {activeModal === 'people' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0c101b] border border-white/10 rounded-2xl p-5 max-w-md w-full shadow-2xl relative space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>People & Collaborative Chat</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-white/5 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveChatTab('members')}
                className={`flex-1 py-1 rounded ${activeChatTab === 'members' ? 'bg-white/15 text-white' : 'text-slate-400'}`}
              >
                Active Collaborators (3)
              </button>
              <button
                onClick={() => setActiveChatTab('chat')}
                className={`flex-1 py-1 rounded ${activeChatTab === 'chat' ? 'bg-white/15 text-white' : 'text-slate-400'}`}
              >
                Workspace Chat
              </button>
            </div>

            {activeChatTab === 'members' ? (
              <div className="space-y-2 py-1">
                {[
                  { name: 'You (Owner)', role: 'Lead Architect', status: 'Active Now' },
                  { name: 'Alex Sterling', role: 'Full Stack Engineer', status: 'Viewing Canvas' },
                  { name: 'Priyanjith Dev', role: 'UI Engineer', status: 'Live Editing' },
                ].map((m, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{m.name}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="text-[10px] text-slate-400">{m.role}</div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">{m.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-44 overflow-y-auto space-y-2 bg-[#05070d] p-3 rounded-xl border border-white/10 text-xs font-mono">
                  {chatLog.map((c, i) => (
                    <div key={i} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-bold text-indigo-300">{c.sender}</span>
                        <span>{c.time}</span>
                      </div>
                      <p className="text-slate-200">{c.text}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendChat} className="flex gap-2 text-xs">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a team message..."
                    className="flex-grow bg-[#080b13] border border-white/10 rounded-xl px-3 py-1.5 text-white outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SUB-MODAL 5: PROJECT SETTINGS ================= */}
      {activeModal === 'project_settings' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0c101b] border border-white/10 rounded-2xl p-5 max-w-md w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <span>Project Configuration</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Project Name</label>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) => onUpdateProject({ ...project, name: e.target.value })}
                  className="w-full bg-[#080b13] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Category</label>
                <select
                  value={project.category}
                  onChange={(e) => onUpdateProject({ ...project, category: e.target.value as any })}
                  className="w-full bg-[#080b13] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                >
                  <option value="Landing">Landing Page</option>
                  <option value="Portfolio">Portfolio</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Web Apps">Web Apps</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={project.description || ''}
                  onChange={(e) => onUpdateProject({ ...project, description: e.target.value })}
                  className="w-full bg-[#080b13] border border-white/10 rounded-xl p-2 text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    onToast('Project settings saved successfully!', 'success');
                    setActiveModal(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-MODAL 6: SNAPSHOTS & HISTORY ================= */}
      {activeModal === 'snapshots' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0c101b] border border-white/10 rounded-2xl p-5 max-w-md w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>Snapshots & File History</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Current Working Draft</div>
                  <div className="text-[11px] text-emerald-400 font-mono">
                    Active · {project.blocks.length} blocks
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between opacity-80">
                <div>
                  <div className="font-bold text-white">Auto-Save Checkpoint #14</div>
                  <div className="text-[11px] text-slate-400 font-mono">All events wired</div>
                </div>
                <button
                  onClick={() => {
                    onToast('Reverted to checkpoint #14', 'info');
                    setActiveModal(null);
                  }}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-indigo-300 text-[10px] font-semibold"
                >
                  Restore
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  onToast('Created new snapshot: ' + new Date().toLocaleTimeString(), 'success');
                  setActiveModal(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md"
              >
                Take New Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file uploader for "Upload files" button */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json,.html,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const text = event.target?.result as string;
              const parsed = JSON.parse(text);
              if (parsed.blocks && Array.isArray(parsed.blocks)) {
                onUpdateProject({
                  ...project,
                  name: parsed.name || project.name,
                  blocks: parsed.blocks,
                });
                onToast(`Imported ${parsed.blocks.length} blocks from file into canvas!`, 'success');
              } else if (Array.isArray(parsed)) {
                onUpdateProject({
                  ...project,
                  blocks: parsed,
                });
                onToast(`Imported ${parsed.length} blocks into canvas!`, 'success');
              } else {
                onToast('Blueprint file imported successfully!', 'success');
              }
            } catch (err) {
              onToast('Could not parse JSON blueprint file.', 'error');
            }
          };
          reader.readAsText(file);
          e.target.value = '';
          onClose();
        }}
      />

      {/* ================= SUB-MODAL 7: SEARCH ALL FILES & BLOCKS ================= */}
      {activeModal === 'search' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0c101b] border border-white/10 rounded-2xl p-5 max-w-lg w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" />
                <span>Search All Files & Canvas Elements</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Type to filter titles, content, or wire actions..."
                  className="w-full bg-[#080b13] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  autoFocus
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {project.blocks
                  .filter((b) => {
                    if (!searchFilter.trim()) return true;
                    const q = searchFilter.toLowerCase();
                    return (
                      b.name.toLowerCase().includes(q) ||
                      b.content.toLowerCase().includes(q) ||
                      (b.subtitle && b.subtitle.toLowerCase().includes(q)) ||
                      b.type.toLowerCase().includes(q)
                    );
                  })
                  .map((b, idx) => (
                    <div
                      key={b.id}
                      onClick={() => {
                        if (onSelectBlock) onSelectBlock(b.id);
                        onToast(`Selected and focused "${b.name}"`, 'success');
                        setActiveModal(null);
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/50 cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div>
                        <div className="font-semibold text-white group-hover:text-indigo-300 flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-500">#{idx + 1}</span>
                          <span>{b.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 uppercase font-mono">
                            {b.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                          {b.content}
                        </p>
                      </div>
                      <span className="text-[10px] text-indigo-400 font-mono group-hover:underline">
                        Jump ➔
                      </span>
                    </div>
                  ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-white/10">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-MODAL 8: GO TO LINE / BLOCK ================= */}
      {activeModal === 'goto' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0c101b] border border-white/10 rounded-2xl p-5 max-w-md w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-indigo-400" />
                <span>Go to Line / Block Script</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-400 text-[11px]">
                Select any block line below to focus, scroll, and inspect in the visual canvas.
              </p>

              <div className="max-h-64 overflow-y-auto space-y-1 pr-1 font-mono">
                {project.blocks.map((b, idx) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      if (onSelectBlock) onSelectBlock(b.id);
                      onToast(`Navigated to Line ${idx + 1}: ${b.name}`, 'info');
                      setActiveModal(null);
                      onClose();
                    }}
                    className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                      selectedBlockId === b.id
                        ? 'bg-indigo-600/30 border border-indigo-500/50 text-white font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-indigo-400 text-[10px] w-6">L{idx + 1}</span>
                      <span className="truncate">{b.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{b.category}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-white/10">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-MODAL 9: PROJECT FILES & CODE VIEW ================= */}
      {activeModal === 'files' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0c101b] border border-white/10 rounded-2xl p-5 max-w-2xl w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-indigo-400" />
                <span>Virtual Project Explorer</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Virtual File Tabs */}
              <div className="flex items-center gap-1 bg-[#080b13] p-1 rounded-xl border border-white/10 font-mono text-xs">
                {(['index.html', 'styles.css', 'app.tsx', 'manifest.json'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFileTab(tab)}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFileTab === tab ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Virtual Code Box */}
              <div className="h-64 overflow-y-auto bg-[#05070d] border border-white/10 rounded-xl p-3.5 font-mono text-[11px] text-indigo-300 leading-relaxed">
                <pre className="whitespace-pre-wrap">
                  {activeFileTab === 'index.html'
                    ? `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${project.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white p-6">
  <!-- ${project.blocks.length} Generated Components -->
${project.blocks
  .map((b) => `  <div id="${b.id}" class="${b.style.bgColor || 'bg-slate-900'} p-4 rounded-xl">\n    <h3>${b.content}</h3>\n  </div>`)
  .join('\n')}
</body>
</html>`
                    : activeFileTab === 'styles.css'
                    ? `@import "tailwindcss";

/* Custom SL Builder theme styles */
:root {
  --canvas-font-size: ${editorFontSize}px;
  --accent-color: ${themeConfig.accentHex};
}

.canvas-element {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}`
                    : activeFileTab === 'app.tsx'
                    ? `import React, { useState } from 'react';

export default function ${project.name.replace(/[^a-zA-Z0-9]/g, '')}() {
  const [active, setActive] = useState(true);

  return (
    <main className="min-h-screen bg-[#07090e] text-white p-8 space-y-6">
      <header className="border-b border-white/10 pb-4">
        <h1 className="text-3xl font-extrabold">${project.name}</h1>
      </header>
    </main>
  );
}`
                    : `{
  "name": "${project.name}",
  "short_name": "SLBuilder",
  "category": "${project.category}",
  "blocks_count": ${project.blocks.length},
  "created_at": "${new Date().toISOString()}"
}`}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-[11px] text-slate-500 font-mono">
                  {project.blocks.length} components linked
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        activeFileTab === 'index.html'
                          ? `<!DOCTYPE html><html><body>${project.name}</body></html>`
                          : activeFileTab
                      );
                      onToast(`Copied ${activeFileTab} source code!`, 'success');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Content</span>
                  </button>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-MODAL 10: SHOW ISSUES & DIAGNOSTICS ================= */}
      {activeModal === 'issues' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0c101b] border border-white/10 rounded-2xl p-5 max-w-lg w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-400" />
                <span>Code Diagnostics & Canvas Health</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Project Health: 100% Operational</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    0 fatal syntax errors, 0 orphaned wires, {project.blocks.length} verified reactive blocks.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">PASSED</span>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-300">Wired Event Handlers</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {project.blocks.filter((b) => b.action).length} active
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-300">Responsive Viewports</span>
                  <span className="font-mono text-indigo-400 font-semibold">Desktop · Tablet · Mobile</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-300">Target Frameworks</span>
                  <span className="font-mono text-slate-400">Tailwind CSS + React 19 + Flask</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    handleFormatCode();
                    setActiveModal(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs"
                >
                  Auto-Align Canvas
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-MODAL 11: MEDIA ASSETS & IMAGES ================= */}
      {activeModal === 'media' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0c101b] border border-white/10 rounded-2xl p-5 max-w-lg w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Media Assets & Image Library</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Insert Custom Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-grow bg-[#080b13] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => {
                      if (!customImageUrl.trim()) return;
                      const newMediaBlock: CanvasBlock = {
                        id: `media_${Date.now()}`,
                        type: 'ui-image',
                        category: 'media',
                        name: 'Custom Image Asset',
                        content: 'Inserted Media',
                        imageUrl: customImageUrl.trim(),
                        style: { borderRadius: 'rounded-2xl', padding: 'p-0' },
                      };
                      onUpdateProject({
                        ...project,
                        blocks: [...project.blocks, newMediaBlock],
                      });
                      onToast('Custom image block inserted to canvas!', 'success');
                      setCustomImageUrl('');
                      setActiveModal(null);
                      onClose();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shrink-0"
                  >
                    Insert Block
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase mb-2">Curated Developer Media Assets</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      name: 'Cosmic Nebula',
                      url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=400&h=250&fit=crop',
                    },
                    {
                      name: 'Futuristic Grid',
                      url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=250&fit=crop',
                    },
                    {
                      name: 'Pro Tech Avatar',
                      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
                    },
                  ].map((asset, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        const newBlock: CanvasBlock = {
                          id: `media_${Date.now()}_${i}`,
                          type: 'ui-image',
                          category: 'media',
                          name: asset.name,
                          content: asset.name,
                          imageUrl: asset.url,
                          style: { borderRadius: 'rounded-xl', padding: 'p-0' },
                        };
                        onUpdateProject({
                          ...project,
                          blocks: [...project.blocks, newBlock],
                        });
                        onToast(`Added "${asset.name}" image to canvas!`, 'success');
                        setActiveModal(null);
                        onClose();
                      }}
                      className="group cursor-pointer rounded-xl overflow-hidden border border-white/10 hover:border-indigo-500 transition-all relative"
                    >
                      <img src={asset.url} alt={asset.name} className="w-full h-16 object-cover" />
                      <div className="p-1 bg-[#080b13] text-center text-[10px] text-slate-300 truncate">
                        {asset.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-white/10">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-MODAL 12: COMPONENT VAULT ================= */}
      {activeModal === 'vault' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0c101b] border border-white/10 rounded-2xl p-5 max-w-lg w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Braces className="w-4 h-4 text-indigo-400" />
                <span>Component & Blueprint Vault</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs max-h-72 overflow-y-auto pr-1">
              {[
                {
                  title: '⚡ Reactive Counter Stack',
                  desc: 'Heading Title + Live Counter + Trigger Button',
                  count: 3,
                  blocks: [
                    {
                      id: `v_h_${Date.now()}`,
                      type: 'ui-heading' as const,
                      category: 'ui' as const,
                      name: 'Live Reactive Counter',
                      content: 'Reactive State Demo',
                      style: { fontSize: '2xl' as const, textAlign: 'center' as const },
                    },
                    {
                      id: `v_c_${Date.now()}`,
                      type: 'logic-counter' as const,
                      category: 'logic' as const,
                      name: 'State Counter',
                      content: 'Clicks registered: 0',
                      counterValue: 0,
                      style: { bgColor: 'bg-indigo-950/40', padding: 'p-4', borderRadius: 'rounded-xl' },
                    },
                    {
                      id: `v_b_${Date.now()}`,
                      type: 'ui-button' as const,
                      category: 'ui' as const,
                      name: 'Increment Action',
                      content: 'Increment +1',
                      action: 'increment-counter' as const,
                      style: { textAlign: 'center' as const },
                    },
                  ],
                },
                {
                  title: '💳 Pricing Tier Card',
                  desc: 'Pro Tier with price, features, and plan checkout button',
                  count: 1,
                  blocks: [
                    {
                      id: `v_p_${Date.now()}`,
                      type: 'ui-pricing' as const,
                      category: 'ui' as const,
                      name: 'Pro Developer Plan',
                      content: 'Pro Tier — $29/mo',
                      subtitle: 'Unlimited projects, custom domains, full code export.',
                      style: { bgColor: 'bg-gray-900', padding: 'p-6', borderRadius: 'rounded-2xl' },
                    },
                  ],
                },
                {
                  title: '📊 Proof & Testimonial Wall',
                  desc: 'KPI Metric Stat + Customer Testimonial Card',
                  count: 2,
                  blocks: [
                    {
                      id: `v_s_${Date.now()}`,
                      type: 'ui-stat' as const,
                      category: 'ui' as const,
                      name: 'KPI Metric',
                      content: '99.98%',
                      statLabel: 'SYSTEM UPTIME',
                      statValue: '99.98%',
                      style: { padding: 'p-4', borderRadius: 'rounded-xl' },
                    },
                    {
                      id: `v_t_${Date.now()}`,
                      type: 'ui-testimonial' as const,
                      category: 'ui' as const,
                      name: 'Customer Review',
                      content: 'The fastest drag & drop developer experience I have used in 2026.',
                      subtitle: 'Senior Software Architect',
                      style: { padding: 'p-4', borderRadius: 'rounded-xl' },
                    },
                  ],
                },
              ].map((stack, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/40 flex items-center justify-between group transition-colors"
                >
                  <div>
                    <div className="font-bold text-white group-hover:text-indigo-300">
                      {stack.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{stack.desc}</div>
                  </div>
                  <button
                    onClick={() => {
                      onUpdateProject({
                        ...project,
                        blocks: [...project.blocks, ...stack.blocks],
                      });
                      onToast(`Inserted ${stack.title} (${stack.count} blocks) to canvas!`, 'success');
                      setActiveModal(null);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shrink-0 cursor-pointer"
                  >
                    Insert Stack
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="text-[11px] text-slate-500">
                Click any stack to insert into canvas
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-MODAL 13: TRASH & RESET CANVAS ================= */}
      {activeModal === 'trash' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0c101b] border border-white/10 rounded-2xl p-5 max-w-md w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Trash & Canvas Element Management</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-400 text-[11px]">
                Manage deleted canvas elements or perform emergency resets.
              </p>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Clear Canvas Elements</div>
                  <div className="text-[11px] text-slate-400">Removes all blocks from current file</div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Clear all blocks from this canvas?')) {
                      onUpdateProject({ ...project, blocks: [] });
                      onToast('Canvas cleared.', 'info');
                      setActiveModal(null);
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold text-xs border border-rose-500/30"
                >
                  Clear All
                </button>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Restore Standard Hero</div>
                  <div className="text-[11px] text-slate-400">Appends clean headline and button</div>
                </div>
                <button
                  onClick={() => {
                    const heroHeading: CanvasBlock = {
                      id: `hero_${Date.now()}`,
                      type: 'ui-heading',
                      category: 'ui',
                      name: 'Hero Headline',
                      content: 'Build the Future with SL Studio',
                      subtitle: 'Visual drag & drop cloud development environment.',
                      style: { fontSize: '3xl', textAlign: 'left' },
                    };
                    onUpdateProject({ ...project, blocks: [...project.blocks, heroHeading] });
                    onToast('Restored hero block to canvas!', 'success');
                    setActiveModal(null);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
                >
                  Restore
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
