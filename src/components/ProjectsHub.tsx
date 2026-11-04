import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Layers,
  CheckCircle2,
  Code2,
  CloudCheck,
  Search,
  Copy,
  Trash2,
  Sparkles,
  X,
  LayoutGrid,
  List,
  ArrowUpRight,
  Upload,
} from 'lucide-react';
import { Project } from '../types/builder';
import { INITIAL_DEMO_BLOCKS } from '../data/defaultTemplates';
import { useTheme } from '../context/ThemeContext';

interface ProjectsHubProps {
  projects: Project[];
  onOpenProject: (project: Project) => void;
  onCreateProject: (project: Project) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProjectsHub: React.FC<ProjectsHubProps> = ({
  projects,
  onOpenProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  onToast,
}) => {
  const { themeConfig } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Landing' | 'Portfolio' | 'E-Commerce' | 'Web Apps'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjCategory, setNewProjCategory] = useState<'Landing' | 'Portfolio' | 'E-Commerce' | 'Web Apps'>('Landing');
  const [newProjTemplate, setNewProjTemplate] = useState<'blank' | 'interactive' | 'portfolio' | 'ecom'>('interactive');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) {
      onToast('Please enter a project name', 'error');
      return;
    }

    let initialBlocks = [...INITIAL_DEMO_BLOCKS];
    if (newProjTemplate === 'blank') {
      initialBlocks = [];
    }

    const newProject: Project = {
      id: 'proj_' + Date.now(),
      name: newProjName.trim(),
      category: newProjCategory,
      updatedAt: 'Just now',
      status: 'Active',
      description: `Custom ${newProjCategory.toLowerCase()} built with SL Studio.`,
      blocks: initialBlocks,
      thumbnailColor: 'from-indigo-600 to-purple-800',
    };

    onCreateProject(newProject);
    setIsModalOpen(false);
    setNewProjName('');
    onToast(`Project "${newProject.name}" created and loaded into Studio!`, 'success');
  };

  return (
    <div className="flex-grow flex flex-col relative z-10 px-6 py-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Header & Metrics Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
            <span>PROJECT MISSION CONTROL</span>
            <span aria-hidden="true">·</span>
            <span>{projects.length} REPOSITORIES</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Projects Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your visual canvases, reactive state graphs, and compiled target bundles.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <label className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Import Blueprint</span>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
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
                      thumbnailColor: 'from-indigo-600 to-purple-800',
                    };
                    onCreateProject(importedProject);
                    onToast(`Blueprint "${importedProject.name}" imported and opened!`, 'success');
                  } catch (err) {
                    onToast('Invalid JSON blueprint file.', 'error');
                  }
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-xs shadow-lg transition-all flex items-center gap-2 hover:opacity-95 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: themeConfig.accentHex,
              boxShadow: `0 8px 24px -4px ${themeConfig.accentHex}40`,
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS (Anti-Slop §1.A: Clean unboxed metrics with tabular-nums) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="studio-card rounded-xl p-4 border border-white/10">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">ALL PROJECTS</span>
          <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {projects.length}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Total in workspace</span>
        </div>

        <div className="studio-card rounded-xl p-4 border border-white/10">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">STATUS</span>
          <span className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
            {projects.filter((p) => p.status === 'Active').length} Active
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Ready to compile</span>
        </div>

        <div className="studio-card rounded-xl p-4 border border-white/10">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">EXPORT TARGETS</span>
          <span className="text-xl font-bold text-white font-mono">
            HTML · TSX · Flask
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Zero config outputs</span>
        </div>

        <div className="studio-card rounded-xl p-4 border border-white/10">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">DATA STORAGE</span>
          <span className="text-xl font-bold text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Firebase
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Firestore Cloud Sync</span>
        </div>
      </div>

      {/* FILTER & TOOLBAR BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 studio-glass p-2.5 rounded-xl border border-white/10">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by name..."
            className="w-full bg-[#080b13] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Category Segmented Buttons & View Mode */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5 overflow-x-auto">
            {(['all', 'Landing', 'Portfolio', 'E-Commerce', 'Web Apps'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          {/* Grid vs List toggle */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded text-xs transition-colors ${
                viewMode === 'list' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* PROJECTS LIST OR GRID */}
      {filteredProjects.length === 0 ? (
        <div className="py-20 text-center text-slate-500 studio-card rounded-2xl flex flex-col items-center justify-center space-y-3 border border-white/10">
          <FolderKanban className="w-10 h-10 text-indigo-400/40 mb-1" />
          <p className="text-sm font-semibold text-slate-300">No matching projects found</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Try tweaking your search keywords or create a new project right away.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-xl text-white text-xs font-semibold"
            style={{ backgroundColor: themeConfig.accentHex }}
          >
            Create New Project
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="studio-card rounded-2xl p-5 border border-white/10 hover:border-indigo-500/40 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                {/* Card header metadata */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3 font-mono">
                  <span>{proj.category}</span>
                  <span className="tabular-nums">{proj.updatedAt}</span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors mb-1.5">
                  {proj.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">
                  {proj.description || 'Custom responsive layout crafted with SL Visual Studio.'}
                </p>

                {/* Unboxed metadata row */}
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="tabular-nums">{proj.blocks?.length || 0} Blocks</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-400">Reactive State</span>
                </div>
              </div>

              {/* Action buttons row */}
              <div className="pt-5 mt-5 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={() => onOpenProject(proj)}
                  className="px-3.5 py-1.5 rounded-xl text-white text-xs font-semibold transition-all flex items-center gap-1.5 hover:opacity-90 active:scale-95"
                  style={{
                    backgroundColor: themeConfig.accentHex,
                  }}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Open Studio</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      onDuplicateProject(proj.id);
                      onToast(`Project "${proj.name}" duplicated!`, 'success');
                    }}
                    title="Duplicate Project"
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (projects.length <= 1) {
                        onToast('You must keep at least one project.', 'error');
                        return;
                      }
                      onDeleteProject(proj.id);
                      onToast(`Project "${proj.name}" removed.`, 'info');
                    }}
                    title="Delete Project"
                    className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="studio-card rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${themeConfig.accentHex}20`,
                    border: `1px solid ${themeConfig.accentHex}40`,
                    color: themeConfig.accentHex,
                  }}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white hover:text-indigo-300 transition-colors">
                    {proj.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                    <span>{proj.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{proj.blocks?.length || 0} blocks</span>
                    <span aria-hidden="true">·</span>
                    <span>Updated {proj.updatedAt}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => onOpenProject(proj)}
                  className="px-3 py-1.5 rounded-xl text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                  style={{ backgroundColor: themeConfig.accentHex }}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Launch Studio</span>
                </button>
                <button
                  onClick={() => {
                    onDuplicateProject(proj.id);
                    onToast(`Project "${proj.name}" duplicated!`, 'success');
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (projects.length <= 1) {
                      onToast('You must keep at least one project.', 'error');
                      return;
                    }
                    onDeleteProject(proj.id);
                    onToast(`Project "${proj.name}" removed.`, 'info');
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE NEW PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Create New Studio Project</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="e.g. NextGen Web Platform"
                  className="w-full bg-[#080b13] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Category</label>
                <select
                  value={newProjCategory}
                  onChange={(e) => setNewProjCategory(e.target.value as any)}
                  className="w-full bg-[#080b13] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Landing">Landing Page</option>
                  <option value="Portfolio">Portfolio</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Web Apps">Web Apps</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Starter Blueprint</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewProjTemplate('interactive')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newProjTemplate === 'interactive'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <p className="font-semibold text-xs text-white">Full Blueprint</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Hero, state counter, API wires</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProjTemplate('blank')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newProjTemplate === 'blank'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <p className="font-semibold text-xs text-white">Clean Canvas</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Start with an empty space</p>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white font-semibold shadow-lg transition-all"
                  style={{ backgroundColor: themeConfig.accentHex }}
                >
                  Create & Open Studio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
