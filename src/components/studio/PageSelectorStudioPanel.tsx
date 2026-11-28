import React, { useState } from 'react';
import {
  Check,
  Copy,
  FileText,
  Home,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { SitePage } from '../../types/builder';

interface PagePresetSummary {
  id: 'about' | 'services' | 'contact' | 'blank';
  name: string;
  siName: string;
  description: string;
}

const QUICK_PAGE_PRESETS: PagePresetSummary[] = [
  {
    id: 'blank',
    name: 'Blank Page',
    siName: 'හිස් පිටුව',
    description: 'Empty canvas ready for blocks',
  },
  {
    id: 'about',
    name: 'About Us',
    siName: 'අප ගැන',
    description: 'Navbar, story, team & footer',
  },
  {
    id: 'services',
    name: 'Services',
    siName: 'සේවාවන්',
    description: 'Hero, stats, pricing & CTA',
  },
  {
    id: 'contact',
    name: 'Contact',
    siName: 'සම්බන්ධ වන්න',
    description: 'Contact form & message box',
  },
];

interface PageSelectorStudioPanelProps {
  lang: 'en' | 'si';
  pages: SitePage[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onCreatePage: (name: string, presetId: 'about' | 'services' | 'contact' | 'blank') => void;
  onRenamePage: (pageId: string, newName: string) => void;
  onDuplicatePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onOpenAddModal: () => void;
}

export const PageSelectorStudioPanel: React.FC<PageSelectorStudioPanelProps> = ({
  lang,
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onRenamePage,
  onDuplicatePage,
  onDeletePage,
  onOpenAddModal,
}) => {
  const [search, setSearch] = useState('');
  const [quickPageName, setQuickPageName] = useState('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const query = search.trim().toLowerCase();
  const filteredPages = query
    ? pages.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.slug || '').toLowerCase().includes(query)
      )
    : pages;

  const commitRename = (pageId: string) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      onRenamePage(pageId, trimmed);
    }
    setEditingPageId(null);
    setEditingName('');
  };

  return (
    <div className="space-y-3 pb-8 text-[11px] select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-[#60A5FA]" />
          <span className="text-xs font-bold text-white">
            {lang === 'si' ? 'පිටු (Pages)' : 'Pages'}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
            {pages.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="px-2 py-1 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>{lang === 'si' ? 'අලුත් පිටුව' : 'New Page'}</span>
        </button>
      </div>

      {/* Search Pages (shown when >3 pages or actively searching) */}
      {(pages.length > 3 || search.length > 0) && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'si' ? 'පිටුවක් සොයන්න...' : 'Filter pages...'}
            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-[#090B10] border border-white/10 focus:border-[#4D97FF] text-[11px] text-white placeholder-slate-500 outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Pages List */}
      <div className="space-y-1.5">
        {filteredPages.length === 0 ? (
          <p className="text-[11px] text-slate-500 text-center py-4">
            {lang === 'si' ? 'ගැලපෙන පිටු හමු නොවීය.' : 'No matching pages found.'}
          </p>
        ) : (
          filteredPages.map((pg, idx) => {
            const isActive = pg.id === activePageId;
            const isEditing = editingPageId === pg.id;

            return (
              <div
                key={pg.id}
                onClick={() => {
                  if (!isEditing) onSelectPage(pg.id);
                }}
                className={`group rounded-xl border p-2.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#18243C] border-[#4C97FF] text-white shadow-sm'
                    : 'bg-[#101217] border-white/10 text-slate-300 hover:bg-[#171B24] hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editingName}
                          autoFocus
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename(pg.id);
                            if (e.key === 'Escape') {
                              setEditingPageId(null);
                              setEditingName('');
                            }
                          }}
                          className="w-full px-1.5 py-0.5 rounded bg-[#090B10] border border-[#4C97FF] text-[11px] text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => commitRename(pg.id)}
                          className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                          title="Save name"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {idx === 0 && pg.slug === 'index' ? (
                          <Home
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? 'text-[#60A5FA]' : 'text-slate-400'
                            }`}
                          />
                        ) : (
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isActive ? 'bg-[#60A5FA]' : 'bg-slate-500'
                            }`}
                          />
                        )}
                        <span className="font-semibold text-[12px] truncate">{pg.name}</span>
                        {isActive && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#4C97FF]/20 text-[#93C5FD] shrink-0">
                            {lang === 'si' ? 'සක්‍රීය' : 'Active'}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-slate-400 pl-5">
                      <span className="truncate">/{pg.slug || 'index'}</span>
                      <span>·</span>
                      <span className="shrink-0">
                        {pg.blocks.length} {pg.blocks.length === 1 ? 'block' : 'blocks'}
                      </span>
                    </div>
                  </div>

                  {/* Row Actions */}
                  {!isEditing && (
                    <div
                      className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPageId(pg.id);
                          setEditingName(pg.name);
                        }}
                        title={lang === 'si' ? 'නම වෙනස් කරන්න' : 'Rename page'}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicatePage(pg.id)}
                        title={lang === 'si' ? 'පිටපත් කරන්න' : 'Duplicate page'}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-sky-300 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {pages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeletePage(pg.id)}
                          title={lang === 'si' ? 'පිටුව මකන්න' : 'Delete page'}
                          className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Create Page */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          {lang === 'si' ? 'ඉක්මනින් අලුත් පිටුවක් සාදන්න' : 'Quick Create Page'}
        </span>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreatePage(quickPageName, 'blank');
            setQuickPageName('');
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={quickPageName}
            onChange={(e) => setQuickPageName(e.target.value)}
            placeholder={lang === 'si' ? 'උදා: Pricing, Blog...' : 'e.g. Pricing, Blog...'}
            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 focus:border-[#4D97FF] text-[11px] text-white placeholder-slate-500 outline-none"
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] text-white font-semibold flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'si' ? 'එක් කරන්න' : 'Add'}</span>
          </button>
        </form>

        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          {QUICK_PAGE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onCreatePage(quickPageName.trim() || preset.name, preset.id)}
              className="p-2 rounded-lg bg-[#101217] hover:bg-[#191E28] border border-white/10 hover:border-[#4C97FF]/50 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1 text-[10.5px] font-semibold text-slate-200">
                <Sparkles className="w-3 h-3 text-[#60A5FA] shrink-0" />
                <span className="truncate">{lang === 'si' ? preset.siName : preset.name}</span>
              </div>
              <p className="text-[9px] text-slate-400 truncate mt-0.5">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
