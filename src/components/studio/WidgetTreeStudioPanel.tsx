import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Box,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  FileCode2,
  FolderTree,
  Layers,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { CanvasBlock } from '../../types/builder';

interface WidgetTreeStudioPanelProps {
  lang: 'en' | 'si';
  activePageName: string;
  activePageSlug: string;
  blocks: CanvasBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, dir: -1 | 1) => void;
  onDuplicateBlock: (block: CanvasBlock) => void;
  onToggleHidden: (block: CanvasBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onDeleteChildWidget: (parentId: string, childId: string) => void;
  onToggleChildHidden: (parentId: string, childId: string) => void;
  onOpenWidgetPalette: () => void;
}

function getCategoryDotClass(type: string): string {
  if (type.startsWith('logic-')) return 'bg-amber-400';
  if (type.startsWith('backend-')) return 'bg-emerald-400';
  if (
    type === 'ui-section' ||
    type === 'ui-row' ||
    type === 'ui-column' ||
    type === 'ui-stack' ||
    type === 'ui-card' ||
    type === 'ui-grid' ||
    type === 'ui-listview' ||
    type === 'ui-flex' ||
    type === 'ui-wrap' ||
    type === 'ui-form' ||
    type === 'ui-navbar' ||
    type === 'ui-footer'
  ) {
    return 'bg-violet-400';
  }
  return 'bg-sky-400';
}

export const WidgetTreeStudioPanel: React.FC<WidgetTreeStudioPanelProps> = ({
  lang,
  activePageName,
  activePageSlug,
  blocks,
  selectedBlockId,
  onSelectBlock,
  onMoveBlock,
  onDuplicateBlock,
  onToggleHidden,
  onDeleteBlock,
  onDeleteChildWidget,
  onToggleChildHidden,
  onOpenWidgetPalette,
}) => {
  const [search, setSearch] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
  const [pageExpanded, setPageExpanded] = useState(true);

  const totalWidgets = blocks.reduce((acc, b) => acc + 1 + (b.children?.length || 0), 0);
  const query = search.trim().toLowerCase();

  const matchesQuery = (blk: CanvasBlock): boolean => {
    if (!query) return true;
    return (
      blk.name.toLowerCase().includes(query) ||
      blk.type.toLowerCase().includes(query) ||
      (blk.content || '').toLowerCase().includes(query)
    );
  };

  const visibleBlocks = query
    ? blocks.filter((b) => matchesQuery(b) || (b.children || []).some(matchesQuery))
    : blocks;

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectAndScroll = (blockId: string) => {
    onSelectBlock(blockId);
    const el = document.getElementById(`sl-el-${blockId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-3 pb-8 text-[11px] select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <FolderTree className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-white">
            {lang === 'si' ? 'Widget Tree' : 'Widget Tree'}
          </span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
          {totalWidgets}
        </span>
      </div>

      {/* Filter Input */}
      {blocks.length > 0 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'si' ? 'Widget සොයන්න...' : 'Filter widget tree...'}
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

      {/* Root Page Tree Node */}
      <div className="rounded-xl bg-[#101217] border border-white/10 overflow-hidden">
        <button
          type="button"
          onClick={() => setPageExpanded((v) => !v)}
          className="w-full px-2.5 py-2 bg-[#151922] border-b border-white/10 flex items-center justify-between text-left cursor-pointer hover:bg-[#1A1F2B] transition-colors"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {pageExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <FileCode2 className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
            <span className="font-bold text-slate-100 truncate">{activePageName}</span>
          </div>
          <span className="text-[9.5px] font-mono text-slate-400 shrink-0">
            /{activePageSlug || 'index'}
          </span>
        </button>

        {pageExpanded && (
          <div className="p-2">
            {blocks.length === 0 ? (
              <div className="py-5 px-2 text-center space-y-2.5">
                <Layers className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="text-[11px] text-slate-400">
                  {lang === 'si'
                    ? 'මේ පිටුවේ තවම Widgets කිසිවක් නැත.'
                    : 'No widgets on this page yet.'}
                </p>
                <button
                  type="button"
                  onClick={onOpenWidgetPalette}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] text-white text-[10.5px] font-semibold cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{lang === 'si' ? 'Widget එකක් එක් කරන්න' : 'Add Widgets'}</span>
                </button>
              </div>
            ) : visibleBlocks.length === 0 ? (
              <p className="text-[11px] text-slate-500 text-center py-4">
                {lang === 'si' ? 'ගැලපෙන widget හමු නොවීය.' : 'No matching widgets.'}
              </p>
            ) : (
              <div className="border-l border-white/10 ml-2 pl-2 space-y-1">
                {visibleBlocks.map((blk) => {
                  const idxInPage = blocks.findIndex((x) => x.id === blk.id);
                  const isSelected = blk.id === selectedBlockId;
                  const children = blk.children || [];
                  const hasChildren = children.length > 0;
                  const isCollapsed = Boolean(collapsedIds[blk.id]) && !query;
                  const isHidden = Boolean(blk.style?.isHidden);

                  return (
                    <div key={blk.id} className="space-y-1">
                      {/* Parent / Top-Level Widget Row */}
                      <div
                        onClick={() => selectAndScroll(blk.id)}
                        className={`group rounded-lg px-2 py-1.5 border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#18243C] border-[#4C97FF] text-white'
                            : 'bg-[#14171F] border-transparent hover:border-white/15 hover:bg-[#191D28] text-slate-300'
                        } ${isHidden ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {hasChildren ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCollapse(blk.id);
                                }}
                                className="p-0.5 -ml-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer shrink-0"
                                title={isCollapsed ? 'Expand children' : 'Collapse children'}
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>
                            ) : (
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${getCategoryDotClass(
                                  blk.type
                                )}`}
                              />
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-[11px] truncate">
                                  {blk.name}
                                </span>
                                {hasChildren && (
                                  <span className="text-[9px] font-mono px-1 rounded bg-white/10 text-slate-300 shrink-0">
                                    {children.length}
                                  </span>
                                )}
                              </div>
                              <p className="text-[9.5px] font-mono text-slate-500 truncate">
                                {blk.type}
                                {blk.content ? ` · ${blk.content}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Inline Tree Controls */}
                          <div
                            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              disabled={idxInPage <= 0}
                              onClick={() => onMoveBlock(blk.id, -1)}
                              title="Move Up"
                              className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-25 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idxInPage >= blocks.length - 1}
                              onClick={() => onMoveBlock(blk.id, 1)}
                              title="Move Down"
                              className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-25 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleHidden(blk)}
                              title={isHidden ? 'Show widget' : 'Hide widget'}
                              className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-amber-300 cursor-pointer"
                            >
                              {isHidden ? (
                                <EyeOff className="w-3 h-3 text-amber-400" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDuplicateBlock(blk)}
                              title="Duplicate widget"
                              className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-sky-300 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteBlock(blk.id)}
                              title="Delete widget"
                              className="p-0.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Nested Child Widgets */}
                      {hasChildren && !isCollapsed && (
                        <div className="ml-3 pl-2.5 border-l border-white/15 space-y-1">
                          {children
                            .filter((ch) => !query || matchesQuery(ch) || matchesQuery(blk))
                            .map((child) => {
                              const childHidden = Boolean(child.style?.isHidden);
                              return (
                                <div
                                  key={child.id}
                                  onClick={() => selectAndScroll(blk.id)}
                                  className={`group/child rounded-md px-2 py-1 bg-[#0D1017] hover:bg-[#161B26] border border-white/5 hover:border-white/15 flex items-center justify-between gap-1 cursor-pointer ${
                                    childHidden ? 'opacity-50' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <Box className="w-3 h-3 text-slate-400 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[10.5px] font-medium text-slate-200 truncate">
                                        {child.name}
                                      </p>
                                      <p className="text-[9px] font-mono text-slate-500 truncate">
                                        {child.type}
                                      </p>
                                    </div>
                                  </div>
                                  <div
                                    className="flex items-center gap-0.5 opacity-0 group-hover/child:opacity-100 shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => onToggleChildHidden(blk.id, child.id)}
                                      title={childHidden ? 'Show child' : 'Hide child'}
                                      className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-amber-300 cursor-pointer"
                                    >
                                      {childHidden ? (
                                        <EyeOff className="w-2.5 h-2.5 text-amber-400" />
                                      ) : (
                                        <Eye className="w-2.5 h-2.5" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDeleteChildWidget(blk.id, child.id)}
                                      title="Remove child"
                                      className="p-0.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
