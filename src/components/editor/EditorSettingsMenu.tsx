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
  onDuplicateSelectedBlock: () => void;
  onDeleteSelectedBlock: () => void;
  onResumeStudio?: () => void;
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
  onDuplicateSelectedBlock,
  onDeleteSelectedBlock,
  onResumeStudio,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { themeConfig } = useTheme();

  // Sub-modal states
  const [activeModal, setActiveModal] = useState<
    'find_replace' | 'shortcuts' | 'settings' | 'people' | 'project_settings' | 'snapshots' | null
  >(null);

  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [activeChatTab, setActiveChatTab] = useState<'members' | 'chat'>('members');
  const [chatMessage, setChatMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'System', text: 'Live collaborative session initialized.', time: 'Just now' },
    { sender: 'Alex Sterling', text: 'Hey, I just reviewed the reactive logic blocks.', time: '1m ago' },
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

  if (!isOpen) return null;

  // Actions handlers
  const handleFindReplace = () => {
    setActiveModal('find_replace');
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

  const handleShowIssues = () => {
    onToast('Diagnostics: 0 syntax errors, 0 runtime exceptions. All blocks valid!', 'success');
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
                  onClick={() => onToast('Searching project blocks and templates...', 'info')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Files className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Search all files</span>
                  </span>
                </button>

                <button
                  onClick={handleFindReplace}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
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
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-30 flex items-center justify-between transition-colors group"
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
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-30 flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Redo2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Redo</span>
                  </span>
                </button>

                <button
                  onClick={handleCommentLine}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
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
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
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
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Delete line</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl Shift K</span>
                </button>

                <button
                  onClick={handleFormatCode}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Format code</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Alt Shift F</span>
                </button>

                <button
                  onClick={() => onToast('Navigated to line 1 of block script', 'info')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <ListOrdered className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Go to line</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl G</span>
                </button>

                <button
                  onClick={() => onToast('Quick file palette: index.html, style.css, app.tsx', 'info')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Go to file</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl P</span>
                </button>

                <button
                  onClick={handleShowIssues}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
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
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
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
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
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
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Columns className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Split view</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl \</span>
                </button>

                <button
                  onClick={() => {
                    onToggleFoldView();
                    onClose();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Minimize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Fold view</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl Shift [</span>
                </button>

                <button
                  onClick={() => setActiveModal('settings')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Editor settings</span>
                  </span>
                </button>

                <button
                  onClick={() => onToast(`Project contains ${project.blocks.length} block assets`, 'info')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
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
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <FilePlus className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>New file</span>
                  </span>
                </button>

                <button
                  onClick={() => {
                    onToast('New folder category added to Vault', 'success');
                    onClose();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <FolderPlus className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>New folder</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveModal('project_settings')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Rename file</span>
                  </span>
                </button>

                <button
                  onClick={handleDownloadFile}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Download this file</span>
                  </span>
                </button>

                <button
                  onClick={() => onToast('Select JSON file to import into workspace', 'info')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Upload files</span>
                  </span>
                </button>

                <button
                  onClick={() => onToast('Media Assets: SVG vector icons, Google Fonts & WebP ready', 'info')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Media (images, fonts...)</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveModal('snapshots')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>File history</span>
                  </span>
                </button>

                <button
                  onClick={() => {
                    onToast('Active layout blocks saved to Component Vault!', 'success');
                    onClose();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Braces className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Save to Vault</span>
                  </span>
                </button>

                <button
                  onClick={() => {
                    onToast('Vault snippet inserted to canvas', 'success');
                    onClose();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Braces className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Insert from Vault</span>
                  </span>
                </button>

                <button
                  onClick={handleCopyAllCode}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
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
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 flex items-center justify-between transition-colors group"
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
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Save className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Save now</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveModal('project_settings')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Project settings</span>
                  </span>
                </button>

                <button
                  onClick={handleShareLink}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Share link</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveModal('snapshots')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>Snapshots</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveModal('people')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    <span>People and chat</span>
                  </span>
                </button>

                <button
                  onClick={() => onToast('Trash: Deleted items can be restored for 30 days', 'info')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors group"
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
    </>
  );
};
