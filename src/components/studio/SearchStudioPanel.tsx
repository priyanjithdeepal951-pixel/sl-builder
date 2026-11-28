import React, { useMemo, useState } from 'react';
import {
  FileText,
  Layers,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import type { CanvasBlock, SitePage } from '../../types/builder';
import {
  WEB_STUDIO_BLOCK_TEMPLATES,
  WEB_STUDIO_CATEGORIES,
  WebStudioBlockTemplate,
  getCategoryMetaForBlockType,
} from '../../data/webStudioBlocks';

interface SearchStudioPanelProps {
  lang: 'en' | 'si';
  pages: SitePage[];
  activePageId: string;
  selectedBlockId: string | null;
  onSelectPage: (pageId: string) => void;
  onSelectBlock: (blockId: string) => void;
  onInspectBlock: (blockId: string) => void;
  onAddTemplateBlock: (tpl: WebStudioBlockTemplate) => void;
  onPaletteDragStart: (e: React.DragEvent, tpl: WebStudioBlockTemplate) => void;
}

const QUICK_SEARCH_CHIPS = [
  { label: 'Image / Photo', query: 'image' },
  { label: 'Button', query: 'button' },
  { label: 'Carousel / Grid', query: 'carousel' },
  { label: 'Form / Input', query: 'input' },
  { label: 'Layout', query: 'layout' },
  { label: 'API / DB', query: 'api' },
];

export const SearchStudioPanel: React.FC<SearchStudioPanelProps> = ({
  lang,
  pages,
  activePageId,
  selectedBlockId,
  onSelectPage,
  onSelectBlock,
  onInspectBlock,
  onAddTemplateBlock,
  onPaletteDragStart,
}) => {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'canvas' | 'pages' | 'toolbox'>('all');

  const q = query.trim().toLowerCase();

  // 1. Matching Pages
  const matchedPages = useMemo(() => {
    if (!q) return pages;
    return pages.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    );
  }, [pages, q]);

  // 2. Matching Blocks (including nested child widgets) across ALL pages
  const matchedCanvasItems = useMemo(() => {
    const results: Array<{
      page: SitePage;
      block: CanvasBlock;
      parentName?: string;
      isChild?: boolean;
    }> = [];

    for (const page of pages) {
      for (const blk of page.blocks) {
        const textBlob = [
          blk.name,
          blk.type,
          blk.category,
          blk.content,
          blk.subtitle,
          blk.badgeText,
          blk.action,
          blk.apiEndpoint,
          ...(blk.options || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!q || textBlob.includes(q)) {
          results.push({ page, block: blk });
        }

        if (Array.isArray(blk.children) && blk.children.length > 0) {
          for (const ch of blk.children) {
            const childBlob = [
              ch.name,
              ch.type,
              ch.content,
              ch.subtitle,
              ch.badgeText,
              ch.action,
              ...(ch.options || []),
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();
            if (!q || childBlob.includes(q)) {
              results.push({
                page,
                block: ch,
                parentName: blk.name,
                isChild: true,
              });
            }
          }
        }
      }
    }
    return results;
  }, [pages, q]);

  // 3. Matching Toolbox Block Templates
  const matchedTemplates = useMemo(() => {
    if (!q) return WEB_STUDIO_BLOCK_TEMPLATES.slice(0, 14);
    return WEB_STUDIO_BLOCK_TEMPLATES.filter((t) => {
      const blob = [
        t.name,
        t.siName,
        t.group,
        t.siGroup,
        t.type,
        t.studioCategory,
        t.defaultContent,
        t.defaultSubtitle,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [q]);

  const showPages = scope === 'all' || scope === 'pages';
  const showCanvas = scope === 'all' || scope === 'canvas';
  const showToolbox = scope === 'all' || scope === 'toolbox';

  const totalResults =
    (showPages ? matchedPages.length : 0) +
    (showCanvas ? matchedCanvasItems.length : 0) +
    (showToolbox ? matchedTemplates.length : 0);

  return (
    <div className="space-y-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] font-bold tracking-[0.08em] text-[#9aa3b2] uppercase">
            {lang === 'si' ? 'සෙවීම (Search)' : 'Studio Search'}
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-sky-300">
          {totalResults}
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-sky-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            lang === 'si'
              ? 'Widget, Text, Page, Action සොයන්න...'
              : 'Search widgets, text, pages, blocks...'
          }
          className="w-full pl-8 pr-7 py-2 rounded-lg bg-[#0d1016] border border-sky-500/35 focus:border-[#4D97FF] text-[11.5px] text-white placeholder-slate-500 outline-none shadow-inner"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            title="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Scope Filter Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-[#11141a] p-1 rounded-lg border border-white/[0.07]">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'canvas', label: 'Widgets' },
            { id: 'pages', label: 'Pages' },
            { id: 'toolbox', label: 'Add New' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setScope(tab.id)}
            className={`py-1 rounded text-[10px] font-semibold cursor-pointer transition-colors ${
              scope === tab.id
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap gap-1">
        {QUICK_SEARCH_CHIPS.map((chip) => {
          const active = q === chip.query;
          return (
            <button
              key={chip.query}
              type="button"
              onClick={() => setQuery(active ? '' : chip.query)}
              className={`px-2 py-0.5 rounded-full text-[9.5px] font-medium border cursor-pointer transition-colors ${
                active
                  ? 'bg-sky-500/20 border-sky-400/40 text-sky-200'
                  : 'bg-[#1e2127] border-white/[0.07] text-slate-400 hover:text-white'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Results Area */}
      <div className="space-y-3 pb-6">
        {/* Pages Results */}
        {showPages && matchedPages.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-emerald-400" />
                {lang === 'si' ? 'පිටු (Pages)' : 'Pages'}
              </span>
              <span className="font-mono text-slate-500">{matchedPages.length}</span>
            </div>
            <div className="space-y-1">
              {matchedPages.map((pg) => {
                const isCurrent = pg.id === activePageId;
                return (
                  <button
                    key={pg.id}
                    type="button"
                    onClick={() => onSelectPage(pg.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-emerald-500/15 border-emerald-400/35 text-white'
                        : 'bg-[#1e2127] hover:bg-[#262a33] border-white/[0.07] text-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold truncate">{pg.name}</div>
                      <div className="text-[9.5px] font-mono text-slate-400 truncate">
                        /{pg.slug} · {pg.blocks.length} blocks
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Canvas Widgets Results */}
        {showCanvas && matchedCanvasItems.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-sky-400" />
                {lang === 'si' ? 'Page එකේ ඇති Widgets' : 'Widgets in Project'}
              </span>
              <span className="font-mono text-slate-500">{matchedCanvasItems.length}</span>
            </div>
            <div className="space-y-1.5">
              {matchedCanvasItems.map(({ page, block, parentName, isChild }) => {
                const catMeta = getCategoryMetaForBlockType(block.type);
                const isSelected = block.id === selectedBlockId && page.id === activePageId;
                return (
                  <div
                    key={`${page.id}_${block.id}`}
                    onClick={() => {
                      if (page.id !== activePageId) onSelectPage(page.id);
                      onSelectBlock(block.id);
                    }}
                    className={`px-2.5 py-2 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-400/50'
                        : 'bg-[#1e2127] hover:bg-[#262a33] border-white/[0.07]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: catMeta.color }}
                        />
                        <span className="text-[11px] font-semibold text-white truncate">
                          {block.name}
                        </span>
                        {isChild && parentName && (
                          <span className="text-[9px] text-slate-400 truncate">
                            in {parentName}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (page.id !== activePageId) onSelectPage(page.id);
                          onInspectBlock(block.id);
                        }}
                        title="Open in Pro Inspector"
                        className="px-1.5 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/30 border border-sky-400/30 text-[9.5px] font-semibold text-sky-300 flex items-center gap-0.5 cursor-pointer shrink-0"
                      >
                        <SlidersHorizontal className="w-2.5 h-2.5" />
                        <span>Inspect</span>
                      </button>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                      <span className="truncate">
                        {block.content || block.subtitle || block.type}
                      </span>
                      <span className="font-mono text-[9px] text-slate-500 shrink-0">
                        /{page.slug}
                      </span>
                    </div>
                    {block.action && (
                      <div className="mt-1 text-[9.5px] font-mono text-amber-300 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        {block.action}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Toolbox Block Templates Results */}
        {showToolbox && matchedTemplates.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                {lang === 'si' ? 'අලුත් Blocks එක් කරන්න' : 'Toolbox Blocks (Click / Drag)'}
              </span>
              <span className="font-mono text-slate-500">{matchedTemplates.length}</span>
            </div>
            <div className="space-y-1.5">
              {matchedTemplates.map((tpl) => {
                const catMeta =
                  WEB_STUDIO_CATEGORIES.find((c) => c.id === tpl.studioCategory) ||
                  WEB_STUDIO_CATEGORIES[0];
                return (
                  <div
                    key={tpl.id}
                    draggable
                    onDragStart={(e) => onPaletteDragStart(e, tpl)}
                    onClick={() => onAddTemplateBlock(tpl)}
                    className="px-2.5 py-2 rounded-lg bg-[#1e2127] hover:bg-[#262a33] border border-white/[0.08] hover:border-white/20 cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: catMeta.color }}
                        />
                        <span className="text-[11px] font-semibold text-white truncate">
                          {lang === 'si' ? tpl.siName : tpl.name}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9.5px] font-semibold flex items-center gap-0.5 shrink-0">
                        <Plus className="w-2.5 h-2.5" />
                        Add
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2 text-[9.5px] text-slate-400">
                      <span className="truncate">{tpl.defaultContent || tpl.group}</span>
                      <span className="font-mono text-[9px] text-slate-500 shrink-0">
                        {tpl.group}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {totalResults === 0 && (
          <div className="py-8 text-center space-y-1.5 text-slate-500">
            <Search className="w-6 h-6 mx-auto opacity-40" />
            <p className="text-[11px]">
              {lang === 'si'
                ? `"${query}" සඳහා ප්‍රතිඵල හමු නොවීය`
                : `No matches found for "${query}"`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
