import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutGrid,
  List,
  LayoutTemplate,
  BookOpen,
  Plus,
  Clock,
  Search,
  ListFilter,
  ArrowUpDown,
  MoreHorizontal,
  Pin,
  Copy,
  Trash2,
  Sun,
  Moon,
  Home,
  LogOut,
  LogIn,
  ChevronsUpDown,
  FilePlus,
  X,
  Upload,
  ShieldCheck,
  Menu,
  Eye,
  Tag,
  ArrowRight,
  FolderKanban,
  Sparkles,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Project, SiteTemplateItem, UserProfile } from '../types/builder';
import { INITIAL_DEMO_BLOCKS } from '../data/defaultTemplates';
import { DEFAULT_SITE_SETTINGS } from '../data/siteSettingsDefaults';
import { useTheme } from '../context/ThemeContext';
import { getBlueprintImageForCategory } from '../assets/studioAssets';
import { StudioImage } from './StudioImage';

interface ProjectsHubProps {
  projects: Project[];
  currentUser?: UserProfile | null;
  isAdmin?: boolean;
  maxProjects?: number;
  templates?: SiteTemplateItem[];
  isMeteorShower?: boolean;
  onToggleMeteorShower?: () => void;
  onOpenProject: (project: Project) => void;
  onCreateProject: (project: Project) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onOpenTemplate?: (templateName: string) => void;
  onBackToHome?: () => void;
  onOpenAdmin?: () => void;
  onNavigateAuth?: () => void;
  onLogout?: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type SidebarTab = 'projects' | 'templates' | 'resources';
type SortMode = 'recent' | 'name' | 'blocks';

function formatRelativeEdit(updatedAt: string): string {
  if (!updatedAt) return 'Edited recently';
  if (updatedAt.includes('T') && updatedAt.includes('-')) {
    const parsed = new Date(updatedAt);
    if (!Number.isNaN(parsed.getTime())) {
      const diffMins = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 60000));
      if (diffMins < 1) return 'Edited just now';
      if (diffMins < 60) return `Edited ${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Edited ${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `Edited ${diffDays}d ago`;
    }
  }
  return updatedAt === 'Just now' ? 'Edited just now' : `Edited ${updatedAt.toLowerCase()}`;
}

export const ProjectsHub: React.FC<ProjectsHubProps> = ({
  projects,
  currentUser = null,
  isAdmin = false,
  maxProjects = 50,
  templates = DEFAULT_SITE_SETTINGS.templates,
  isMeteorShower = false,
  onToggleMeteorShower,
  onOpenProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  onOpenTemplate,
  onBackToHome,
  onOpenAdmin,
  onNavigateAuth,
  onLogout,
  onToast,
}) => {
  const { themeConfig, colorMode, toggleColorMode } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  const [activeTab, setActiveTab] = useState<SidebarTab>('projects');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'Landing' | 'Portfolio' | 'E-Commerce' | 'Web Apps'
  >('all');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjCategory, setNewProjCategory] = useState<
    'Landing' | 'Portfolio' | 'E-Commerce' | 'Web Apps'
  >('Landing');
  const [newProjTemplate, setNewProjTemplate] = useState<'blank' | 'interactive'>('blank');

  // Local persistence for Tags & Pinned projects
  const [tags, setTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sl_builder_tags');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sl_builder_pinned');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [projectTags, setProjectTags] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('sl_builder_project_tags');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setWorkspaceMenuOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false);
      }
      const targetEl = e.target as HTMLElement | null;
      if (!targetEl || !targetEl.closest('[data-card-menu="true"]')) {
        setOpenCardMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const persistTags = (next: string[]) => {
    setTags(next);
    localStorage.setItem('sl_builder_tags', JSON.stringify(next));
  };

  const persistPinned = (next: string[]) => {
    setPinnedIds(next);
    localStorage.setItem('sl_builder_pinned', JSON.stringify(next));
  };

  const persistProjectTags = (next: Record<string, string[]>) => {
    setProjectTags(next);
    localStorage.setItem('sl_builder_project_tags', JSON.stringify(next));
  };

  const togglePinProject = (id: string) => {
    const exists = pinnedIds.includes(id);
    const next = exists ? pinnedIds.filter((pid) => pid !== id) : [id, ...pinnedIds];
    persistPinned(next);
    onToast(exists ? 'Project unpinned' : 'Project pinned to sidebar', 'info');
  };

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newTagInput.trim();
    if (!cleaned) return;
    if (!tags.includes(cleaned)) {
      persistTags([...tags, cleaned]);
      onToast(`Tag "${cleaned}" added`, 'success');
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const toggleProjectTag = (projId: string, tag: string) => {
    const current = projectTags[projId] || [];
    const hasTag = current.includes(tag);
    const updated = hasTag ? current.filter((t) => t !== tag) : [...current, tag];
    persistProjectTags({ ...projectTags, [projId]: updated });
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedProject: Project = {
          id: 'proj_' + Date.now(),
          name: parsed.project?.name || parsed.name || 'Imported Blueprint',
          category: parsed.project?.category || 'Landing',
          updatedAt: 'Just now',
          status: 'Active',
          description: parsed.project?.description || 'Imported from JSON blueprint.',
          blocks: parsed.project?.blocks || parsed.blocks || [],
          thumbnailColor: 'from-blue-600 to-sky-700',
        };
        onCreateProject(importedProject);
        onToast(`Blueprint "${importedProject.name}" imported and opened!`, 'success');
      } catch {
        onToast('Invalid JSON blueprint file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) {
      onToast('Please enter a project name', 'error');
      return;
    }

    const initialBlocks = newProjTemplate === 'blank' ? [] : [...INITIAL_DEMO_BLOCKS];

    const newProject: Project = {
      id: 'proj_' + Date.now(),
      name: newProjName.trim(),
      category: newProjCategory,
      updatedAt: 'Just now',
      status: 'Active',
      description: `Custom ${newProjCategory.toLowerCase()} built with BlockCraft Studio.`,
      blocks: initialBlocks,
      thumbnailColor: 'from-blue-600 to-sky-700',
    };

    onCreateProject(newProject);
    setIsModalOpen(false);
    setNewProjName('');
    onToast(`Project "${newProject.name}" created!`, 'success');
  };

  const cycleSortMode = () => {
    const next: SortMode =
      sortMode === 'recent' ? 'name' : sortMode === 'name' ? 'blocks' : 'recent';
    setSortMode(next);
    const labels: Record<SortMode, string> = {
      recent: 'Sorted by recently edited',
      name: 'Sorted alphabetically (A–Z)',
      blocks: 'Sorted by block count',
    };
    onToast(labels[next], 'info');
  };

  const filteredProjects = projects
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchesTag = !activeTagFilter || (projectTags[p.id] || []).includes(activeTagFilter);
      return matchesSearch && matchesCategory && matchesTag;
    })
    .sort((a, b) => {
      if (sortMode === 'name') return a.name.localeCompare(b.name);
      if (sortMode === 'blocks') return (b.blocks?.length || 0) - (a.blocks?.length || 0);
      return 0;
    });

  const pinnedProjects = projects.filter((p) => pinnedIds.includes(p.id));
  const recentProjects = projects.slice(0, 4);

  const userName = currentUser?.name || 'Guest Creator';
  const userInitials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      <div className="space-y-5">
        {/* Top Workspace Switcher */}
        <div className="relative" ref={workspaceRef}>
          <button
            type="button"
            onClick={() => setWorkspaceMenuOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-stone-200/70 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-xs shrink-0"
                style={{ backgroundColor: themeConfig.accentHex }}
              >
                B
              </div>
              <span className="text-sm font-semibold text-stone-900 dark:text-zinc-100 truncate">
                Personal
              </span>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-stone-500 dark:text-zinc-400 shrink-0" />
          </button>

          {workspaceMenuOpen && (
            <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-white dark:bg-[#1b1d24] border border-stone-200 dark:border-zinc-800 p-1.5 shadow-xl z-50 text-xs space-y-0.5">
              {onBackToHome && (
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    onBackToHome();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center gap-2 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Back to Showcase</span>
                </button>
              )}
              {isAdmin && onOpenAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Console</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setWorkspaceMenuOpen(false);
                  fileInputRef.current?.click();
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON Blueprint</span>
              </button>
            </div>
          )}
        </div>

        {/* Primary Sidebar Navigation */}
        <nav className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('projects');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-white dark:bg-[#1e2028] text-stone-900 dark:text-white shadow-xs dark:shadow-none'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200 hover:bg-stone-200/50 dark:hover:bg-white/[0.04]'
            }`}
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span>Projects</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('templates');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-white dark:bg-[#1e2028] text-stone-900 dark:text-white shadow-xs dark:shadow-none'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200 hover:bg-stone-200/50 dark:hover:bg-white/[0.04]'
            }`}
          >
            <LayoutTemplate className="w-4 h-4 shrink-0" />
            <span>Templates</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('resources');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
              activeTab === 'resources'
                ? 'bg-white dark:bg-[#1e2028] text-stone-900 dark:text-white shadow-xs dark:shadow-none'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200 hover:bg-stone-200/50 dark:hover:bg-white/[0.04]'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Resources</span>
          </button>
        </nav>

        {/* TAGS Section */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-semibold tracking-wider text-stone-500 dark:text-zinc-500 uppercase">
              Tags
            </span>
            <button
              type="button"
              onClick={() => setIsAddingTag((prev) => !prev)}
              className="w-6 h-6 rounded-md border border-stone-300/80 dark:border-zinc-800 hover:bg-stone-200/70 dark:hover:bg-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-400 cursor-pointer"
              title="Add tag"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isAddingTag && (
            <form onSubmit={handleAddTagSubmit} className="px-2 pt-1 flex items-center gap-1">
              <input
                type="text"
                autoFocus
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="Tag name..."
                className="flex-1 min-w-0 bg-white dark:bg-[#1b1d24] border border-stone-300 dark:border-zinc-700 rounded-md px-2 py-1 text-xs text-stone-900 dark:text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-2 py-1 rounded-md text-[11px] font-semibold text-white cursor-pointer"
                style={{ backgroundColor: themeConfig.accentHex }}
              >
                Add
              </button>
            </form>
          )}

          {tags.length === 0 ? (
            <button
              type="button"
              onClick={() => setIsAddingTag(true)}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200 hover:bg-stone-200/40 dark:hover:bg-white/[0.04] flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add a tag</span>
            </button>
          ) : (
            <div className="space-y-0.5">
              {tags.map((tag) => {
                const active = activeTagFilter === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setActiveTab('projects');
                      setActiveTagFilter(active ? null : tag);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                      active
                        ? 'bg-white dark:bg-[#1e2028] text-stone-900 dark:text-white font-medium'
                        : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Tag className="w-3 h-3 shrink-0" />
                      <span className="truncate">{tag}</span>
                    </span>
                    {active && <X className="w-3 h-3 shrink-0 opacity-70" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* PINNED Section */}
        <div className="space-y-1.5 pt-2">
          <div className="px-2 text-[11px] font-semibold tracking-wider text-stone-500 dark:text-zinc-500 uppercase">
            Pinned
          </div>
          {pinnedProjects.length === 0 ? (
            <p className="px-2.5 py-1 text-xs text-stone-400 dark:text-zinc-500">
              No pinned projects yet
            </p>
          ) : (
            <div className="space-y-0.5">
              {pinnedProjects.map((proj) => (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => onOpenProject(proj)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-stone-700 dark:text-zinc-300 hover:bg-stone-200/50 dark:hover:bg-white/[0.05] flex items-center gap-2 cursor-pointer truncate"
                >
                  <Pin className="w-3 h-3 shrink-0 text-stone-400 dark:text-zinc-500" />
                  <span className="truncate">{proj.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RECENT Section */}
        <div className="space-y-1.5 pt-2">
          <div className="px-2 text-[11px] font-semibold tracking-wider text-stone-500 dark:text-zinc-500 uppercase">
            Recent
          </div>
          <div className="space-y-0.5">
            {recentProjects.map((proj) => (
              <button
                key={proj.id}
                type="button"
                onClick={() => onOpenProject(proj)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-stone-700 dark:text-zinc-300 hover:bg-stone-200/50 dark:hover:bg-white/[0.05] flex items-center gap-2 cursor-pointer truncate"
              >
                <Clock className="w-3.5 h-3.5 shrink-0 text-stone-400 dark:text-zinc-500" />
                <span className="truncate">{proj.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Bottom Workspace Quota + User Footer */}
      <div className="space-y-3 pt-4">
        <div className="rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#17181f] p-3.5 space-y-2.5">
          <div>
            <div className="text-xs font-semibold text-stone-900 dark:text-white">
              {currentUser ? 'Cloud workspace' : 'Local workspace'}
            </div>
            <div className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5 tabular-nums">
              {projects.length} of {maxProjects} projects used
            </div>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-1.5 px-3 rounded-lg border border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 text-xs font-medium text-stone-800 dark:text-zinc-200 transition-colors cursor-pointer"
          >
            Import blueprint
          </button>
        </div>

        <div className="flex items-center justify-between px-1.5 pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={userName}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-purple-700 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                {userInitials}
              </div>
            )}
            <span className="text-xs font-medium text-stone-900 dark:text-zinc-100 truncate">
              {userName}
            </span>
          </div>

          {currentUser && onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              title="Log out"
              className="p-1.5 rounded-lg text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            onNavigateAuth && (
              <button
                type="button"
                onClick={onNavigateAuth}
                title="Sign in"
                className="p-1.5 rounded-lg text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-transparent text-stone-900 dark:text-zinc-100 relative z-10">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportJson}
        className="hidden"
      />

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 border-r border-stone-200/80 dark:border-zinc-800/80 bg-[#eeede8]/90 dark:bg-[#111216]/90 backdrop-blur-md">
        <div className="sticky top-0 h-screen overflow-y-auto">{sidebarContent}</div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] h-full bg-[#eeede8]/95 dark:bg-[#111216]/95 backdrop-blur-md border-r border-stone-200 dark:border-zinc-800 z-10 overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col bg-transparent">
        {/* Top Utility Icons Bar */}
        <div className="h-14 px-6 flex items-center justify-between md:justify-end gap-2">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg text-stone-600 dark:text-zinc-300 hover:bg-stone-200/60 dark:hover:bg-zinc-800"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                title="Back to Showcase"
                className="p-2 rounded-lg text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
              </button>
            )}
            {onToggleMeteorShower && (
              <button
                type="button"
                onClick={onToggleMeteorShower}
                title={isMeteorShower ? 'Disable Live Meteor Trails' : 'Enable Live Meteor Trails'}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isMeteorShower
                    ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-white/[0.06]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleColorMode}
              title={colorMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              className="p-2 rounded-lg text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              {colorMode === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('resources')}
              title="Studio Resources & Guide"
              className="p-2 rounded-lg text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active View Content */}
        <div className="flex-1 max-w-5xl w-full mx-auto px-6 pb-16">
          {activeTab === 'projects' && (
            <div className="space-y-12 pt-4">
              {/* Centered Hero Action Area with subtle animated accent line */}
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center text-center space-y-5 pt-2 pb-4 relative"
              >
                <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-stone-900 dark:text-white">
                  Start a new project
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('templates')}
                    className="px-4 py-2 rounded-lg border border-stone-300 dark:border-zinc-700/80 bg-white/90 dark:bg-[#1c1e24]/90 backdrop-blur-sm hover:bg-stone-100 dark:hover:bg-[#23262e] text-xs font-medium text-stone-800 dark:text-zinc-100 inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <LayoutTemplate className="w-3.5 h-3.5 text-stone-500 dark:text-zinc-400" />
                    <span>Start from a template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewProjTemplate('blank');
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-lg border border-stone-300 dark:border-zinc-700/80 bg-white/90 dark:bg-[#1c1e24]/90 backdrop-blur-sm hover:bg-stone-100 dark:hover:bg-[#23262e] text-xs font-medium text-stone-800 dark:text-zinc-100 inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <FilePlus className="w-3.5 h-3.5 text-stone-500 dark:text-zinc-400" />
                    <span>Start blank</span>
                  </button>
                </div>
              </motion.div>

              {/* Projects Toolbar Row */}
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-baseline gap-2.5">
                    <h2 className="text-base font-semibold text-stone-900 dark:text-white">
                      Projects
                    </h2>
                    <span className="text-xs font-mono tabular-nums text-stone-500 dark:text-zinc-400">
                      {filteredProjects.length}
                    </span>
                    {activeTagFilter && (
                      <button
                        type="button"
                        onClick={() => setActiveTagFilter(null)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>· {activeTagFilter}</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects..."
                        className="w-full bg-white dark:bg-[#17181f] border border-stone-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Category Filter Popover */}
                    <div className="relative" ref={filterRef}>
                      <button
                        type="button"
                        onClick={() => setFilterMenuOpen((prev) => !prev)}
                        title="Filter by category"
                        className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                          categoryFilter !== 'all'
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                            : 'bg-white dark:bg-[#1c1e24] border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <ListFilter className="w-3.5 h-3.5" />
                      </button>

                      {filterMenuOpen && (
                        <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-[#1b1d24] border border-stone-200 dark:border-zinc-800 p-1 shadow-xl z-40 text-xs">
                          {(['all', 'Landing', 'Portfolio', 'E-Commerce', 'Web Apps'] as const).map(
                            (cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  setCategoryFilter(cat);
                                  setFilterMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                  categoryFilter === cat
                                    ? 'bg-stone-100 dark:bg-zinc-800 font-semibold text-stone-900 dark:text-white'
                                    : 'text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800/60'
                                }`}
                              >
                                {cat === 'all' ? 'All Categories' : cat}
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sort Toggle */}
                    <button
                      type="button"
                      onClick={cycleSortMode}
                      title={`Sort: ${sortMode}`}
                      className="p-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#1c1e24] text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Segmented Grid / List View */}
                    <div className="flex items-center bg-white dark:bg-[#1c1e24] border border-stone-200 dark:border-zinc-800 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        title="Grid view"
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          viewMode === 'grid'
                            ? 'bg-stone-200/80 dark:bg-zinc-700/70 text-stone-900 dark:text-white'
                            : 'text-stone-400 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        title="List view"
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          viewMode === 'list'
                            ? 'bg-stone-200/80 dark:bg-zinc-700/70 text-stone-900 dark:text-white'
                            : 'text-stone-400 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Empty State */}
                {filteredProjects.length === 0 ? (
                  <div className="py-16 text-center rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#1b1d24] flex flex-col items-center justify-center space-y-3">
                    <FolderKanban className="w-8 h-8 text-stone-400 dark:text-zinc-500" />
                    <p className="text-sm font-medium text-stone-800 dark:text-zinc-200">
                      No matching projects
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('all');
                        setActiveTagFilter(null);
                      }}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : viewMode === 'grid' ? (
                  /* Compact Screenshot-Matched Project Cards with smooth entrance */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map((proj, idx) => {
                      const isPinned = pinnedIds.includes(proj.id);
                      const assignedTags = projectTags[proj.id] || [];
                      return (
                        <motion.div
                          key={proj.id}
                          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.24,
                            delay: Math.min(idx * 0.04, 0.2),
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                          onClick={() => onOpenProject(proj)}
                          className="group relative rounded-xl border border-stone-200 dark:border-zinc-800/90 bg-white/90 dark:bg-[#1b1d24]/90 backdrop-blur-sm hover:border-stone-300 dark:hover:border-zinc-700 p-4 transition-colors cursor-pointer flex flex-col justify-between min-h-[144px]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-stone-200 dark:border-zinc-700/70 bg-stone-100 dark:bg-zinc-900 shrink-0">
                                <StudioImage
                                  src={getBlueprintImageForCategory(proj.category, proj.name)}
                                  alt={proj.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-stone-900 dark:text-white truncate">
                                  {proj.name}
                                </h3>
                                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5 truncate">
                                  {formatRelativeEdit(proj.updatedAt)} · {proj.blocks?.length || 0} blocks
                                </p>
                              </div>
                            </div>

                            {/* Card Action Menu */}
                            <div
                              data-card-menu="true"
                              className="relative shrink-0"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenCardMenuId(openCardMenuId === proj.id ? null : proj.id)
                                }
                                className="p-1 rounded-md text-stone-400 dark:text-zinc-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                aria-label="Project options"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {openCardMenuId === proj.id && (
                                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-[#22242d] border border-stone-200 dark:border-zinc-700 p-1 shadow-xl z-30 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenCardMenuId(null);
                                      togglePinProject(proj.id);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Pin className="w-3.5 h-3.5" />
                                    <span>{isPinned ? 'Unpin project' : 'Pin project'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenCardMenuId(null);
                                      onDuplicateProject(proj.id);
                                      onToast(`Project "${proj.name}" duplicated!`, 'success');
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Duplicate</span>
                                  </button>
                                  {tags.length > 0 && (
                                    <div className="border-t border-stone-100 dark:border-zinc-700/60 my-1 pt-1">
                                      <div className="px-2.5 py-0.5 text-[10px] font-mono text-stone-400 dark:text-zinc-500">
                                        Assign tag
                                      </div>
                                      {tags.map((tag) => (
                                        <button
                                          key={tag}
                                          type="button"
                                          onClick={() => toggleProjectTag(proj.id, tag)}
                                          className="w-full text-left px-2.5 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 flex items-center justify-between cursor-pointer"
                                        >
                                          <span>{tag}</span>
                                          {assignedTags.includes(tag) && (
                                            <span className="text-blue-500 font-bold">✓</span>
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenCardMenuId(null);
                                      if (projects.length <= 1) {
                                        onToast('You must keep at least one project.', 'error');
                                        return;
                                      }
                                      onDeleteProject(proj.id);
                                      onToast(`Project "${proj.name}" removed.`, 'info');
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Footer matching screenshot */}
                          <div className="pt-3 mt-6 border-t border-stone-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-stone-500 dark:text-zinc-400">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-purple-700 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                                {userInitials.slice(0, 1)}
                              </span>
                              {assignedTags.length > 0 && (
                                <span className="truncate text-[11px] font-mono">
                                  {assignedTags.join(', ')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] shrink-0">
                              {isPinned && <Pin className="w-3 h-3 text-stone-400" />}
                              <Eye className="w-3.5 h-3.5" />
                              <span>{proj.category}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  /* List View */
                  <div className="rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#1b1d24] divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
                    {filteredProjects.map((proj) => (
                      <div
                        key={proj.id}
                        onClick={() => onOpenProject(proj)}
                        className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg overflow-hidden border border-stone-200 dark:border-zinc-800 shrink-0">
                            <StudioImage
                              src={getBlueprintImageForCategory(proj.category, proj.name)}
                              alt={proj.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-stone-900 dark:text-white truncate">
                              {proj.name}
                            </div>
                            <div className="text-xs text-stone-500 dark:text-zinc-400 truncate">
                              {formatRelativeEdit(proj.updatedAt)} · {proj.blocks?.length || 0} blocks ·{' '}
                              {proj.category}
                            </div>
                          </div>
                        </div>

                        <div
                          className="flex items-center gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => togglePinProject(proj.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                            title="Pin"
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDuplicateProject(proj.id);
                              onToast(`Project "${proj.name}" duplicated!`, 'success');
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (projects.length <= 1) {
                                onToast('You must keep at least one project.', 'error');
                                return;
                              }
                              onDeleteProject(proj.id);
                              onToast(`Project "${proj.name}" removed.`, 'info');
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between gap-4 border-b border-stone-200 dark:border-zinc-800 pb-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-white">
                    Starter Templates
                  </h1>
                  <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
                    Clone a pre-wired layout into your studio workspace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('projects')}
                  className="text-xs font-medium text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                >
                  Back to Projects
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#1b1d24] overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[16/10] w-full overflow-hidden border-b border-stone-200 dark:border-zinc-800">
                        <StudioImage
                          src={getBlueprintImageForCategory(tpl.category, tpl.name)}
                          alt={tpl.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <div className="text-[11px] font-mono text-stone-500 dark:text-zinc-400 mb-1">
                          {tpl.category} · {tpl.blocksCount} blocks
                        </div>
                        <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-1">
                          {tpl.name}
                        </h3>
                        <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenTemplate) {
                            onOpenTemplate(tpl.name);
                          } else {
                            setNewProjName(tpl.name);
                            setNewProjTemplate('interactive');
                            setIsModalOpen(true);
                          }
                        }}
                        className="w-full py-2 px-3 rounded-lg text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90"
                        style={{ backgroundColor: themeConfig.accentHex }}
                      >
                        <span>Use Template</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between gap-4 border-b border-stone-200 dark:border-zinc-800 pb-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-white">
                    Studio Resources
                  </h1>
                  <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
                    Quick workflows for visual editing, state wiring, and multi-target export.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('projects')}
                  className="text-xs font-medium text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                >
                  Back to Projects
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#1b1d24] p-5 space-y-2">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    01. Visual Canvas & Live Animations
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed">
                    Drag UI blocks onto the canvas, switch between Desktop, Tablet, and Mobile viewports, and apply live CSS backgrounds under the CSS tab.
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#1b1d24] p-5 space-y-2">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    02. Reactive State Wiring
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed">
                    Connect buttons to counters, variables, conditionals, or simulated API routes using the Logic inspector with zero boilerplate.
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#1b1d24] p-5 space-y-2">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    03. Multi-Target Code Export
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed">
                    Export standalone HTML + Tailwind, React 19 TSX components, vanilla JavaScript, or Python Flask endpoints anytime.
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#1b1d24] p-5 space-y-3">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    04. Import JSON Blueprint
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed">
                    Load an existing exported JSON blueprint directly into a new project.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 text-xs font-semibold text-stone-800 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose JSON File</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CREATE NEW PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#1b1d24] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Create new project
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-900 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 dark:text-zinc-300 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="My App"
                  className="w-full bg-stone-50 dark:bg-[#121318] border border-stone-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-zinc-300 mb-1.5">
                  Category
                </label>
                <select
                  value={newProjCategory}
                  onChange={(e) => setNewProjCategory(e.target.value as any)}
                  className="w-full bg-stone-50 dark:bg-[#121318] border border-stone-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-stone-900 dark:text-white focus:outline-none focus:border-blue-600"
                >
                  <option value="Landing">Landing Page</option>
                  <option value="Portfolio">Portfolio</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Web Apps">Web Apps</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-zinc-300 mb-1.5">
                  Starter Canvas
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewProjTemplate('blank')}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      newProjTemplate === 'blank'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-stone-900 dark:text-white'
                        : 'border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-[#121318] text-stone-600 dark:text-zinc-400'
                    }`}
                  >
                    <p className="font-semibold text-xs">Blank Canvas</p>
                    <p className="text-[11px] opacity-80 mt-0.5">Empty workspace</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProjTemplate('interactive')}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      newProjTemplate === 'interactive'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-stone-900 dark:text-white'
                        : 'border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-[#121318] text-stone-600 dark:text-zinc-400'
                    }`}
                  >
                    <p className="font-semibold text-xs">Full Blueprint</p>
                    <p className="text-[11px] opacity-80 mt-0.5">Hero, counter & API wire</p>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white font-semibold cursor-pointer"
                  style={{ backgroundColor: themeConfig.accentHex }}
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
