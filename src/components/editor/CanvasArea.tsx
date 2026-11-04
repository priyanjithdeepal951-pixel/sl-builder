import React, { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Zap,
  Server,
  MousePointer,
  ChevronDown,
  ChevronUp,
  Star,
  Quote,
  TrendingUp,
  Play,
  RotateCcw,
} from 'lucide-react';
import { CanvasBlock, ViewportMode, CanvasSurfaceTheme, CanvasGridPattern } from '../../types/builder';

interface CanvasAreaProps {
  blocks: CanvasBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
  onMoveBlock: (index: number, direction: 'up' | 'down') => void;
  onDrop: (e: React.DragEvent) => void;
  viewportMode: ViewportMode;
  onSimulateBlockAction: (block: CanvasBlock) => void;
  interactivityMode?: 'design' | 'preview';
  surfaceTheme?: CanvasSurfaceTheme;
  gridPattern?: CanvasGridPattern;
  zoomLevel?: number;
  onToggleAccordion?: (blockId: string) => void;
  lastSimulatedEvent?: string | null;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onDrop,
  viewportMode,
  onSimulateBlockAction,
  interactivityMode = 'design',
  surfaceTheme = 'obsidian',
  gridPattern = 'dots',
  zoomLevel = 100,
  onToggleAccordion,
  lastSimulatedEvent,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const getViewportWidthClass = () => {
    switch (viewportMode) {
      case 'mobile':
        return 'max-w-[375px]';
      case 'tablet':
        return 'max-w-[768px]';
      case 'desktop':
      default:
        return 'max-w-3xl';
    }
  };

  const getSurfaceBgClass = () => {
    switch (surfaceTheme) {
      case 'midnight':
        return 'bg-[#060b18]';
      case 'slate':
        return 'bg-[#0f172a]';
      case 'pure-black':
        return 'bg-[#000000]';
      case 'obsidian':
      default:
        return 'bg-[#0c101b]';
    }
  };

  const getGridPatternClass = () => {
    switch (gridPattern) {
      case 'blueprint':
        return 'bg-blueprint-grid';
      case 'plain':
        return '';
      case 'dots':
      default:
        return 'bg-dot-grid';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (interactivityMode === 'preview') return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDropInternal = (e: React.DragEvent) => {
    if (interactivityMode === 'preview') return;
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e);
  };

  const renderBlockContent = (block: CanvasBlock) => {
    const style = block.style;
    const textSizeClass =
      style.fontSize === '4xl'
        ? 'text-4xl'
        : style.fontSize === '3xl'
        ? 'text-3xl'
        : style.fontSize === '2xl'
        ? 'text-2xl'
        : style.fontSize === 'xl'
        ? 'text-xl'
        : style.fontSize === 'lg'
        ? 'text-lg'
        : style.fontSize === 'sm'
        ? 'text-sm'
        : style.fontSize === 'xs'
        ? 'text-xs'
        : 'text-base';

    const textAlignClass =
      style.textAlign === 'center'
        ? 'text-center'
        : style.textAlign === 'right'
        ? 'text-right'
        : 'text-left';

    switch (block.type) {
      case 'ui-heading':
        return (
          <div className={`${textAlignClass} space-y-1`}>
            <h1 className={`font-extrabold text-white tracking-tight ${textSizeClass}`}>
              {block.content}
            </h1>
            {block.subtitle && (
              <p className="text-xs text-slate-400 font-normal leading-relaxed">
                {block.subtitle}
              </p>
            )}
          </div>
        );

      case 'ui-paragraph':
        return (
          <div className={textAlignClass}>
            <p className={`text-slate-300 leading-relaxed ${textSizeClass}`}>{block.content}</p>
          </div>
        );

      case 'ui-button':
        return (
          <div className={`${textAlignClass} py-0.5`}>
            <button
              onClick={(e) => {
                if (interactivityMode === 'preview') {
                  e.stopPropagation();
                  onSimulateBlockAction(block);
                } else {
                  e.stopPropagation();
                  onSimulateBlockAction(block);
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>{block.content}</span>
              {block.action && <Zap className="w-3.5 h-3.5 text-yellow-300" />}
            </button>
          </div>
        );

      case 'ui-stat':
        return (
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-0.5">
                {block.statLabel || block.subtitle || 'PERFORMANCE KPI'}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
                {block.statValue || block.content || '99.98%'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        );

      case 'ui-testimonial':
        return (
          <div className="p-4 sm:p-5 rounded-xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
              "{block.content}"
            </p>
            <div className="flex items-center gap-2.5 pt-1 border-t border-white/5">
              <img
                src={block.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face'}
                alt={block.subtitle || 'Author'}
                className="w-7 h-7 rounded-full object-cover"
              />
              <div>
                <p className="text-xs font-semibold text-white">{block.subtitle || 'Alex Chen'}</p>
                <p className="text-[10px] text-slate-400">{block.authorRole || 'Lead Software Architect'}</p>
              </div>
            </div>
          </div>
        );

      case 'ui-accordion':
        return (
          <div className="rounded-xl bg-white/5 border border-white/5 overflow-hidden transition-all">
            <div
              onClick={(e) => {
                if (onToggleAccordion) {
                  e.stopPropagation();
                  onToggleAccordion(block.id);
                }
              }}
              className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
            >
              <span className="font-semibold text-xs text-white">{block.content}</span>
              {block.isExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
            {block.isExpanded && (
              <div className="px-3.5 pb-3.5 text-xs text-slate-400 border-t border-white/5 pt-2.5 leading-relaxed">
                {block.subtitle || 'SL Builder compiles zero-runtime HTML, standard React TSX, and Python Flask microservices directly from your visual graph.'}
              </div>
            )}
          </div>
        );

      case 'ui-card':
        return (
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-white">{block.content}</h3>
            {block.subtitle && <p className="text-xs text-slate-400 leading-relaxed">{block.subtitle}</p>}
          </div>
        );

      case 'ui-navbar':
        return (
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                SL
              </div>
              <span className="font-bold text-white text-xs">{block.content}</span>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {block.subtitle || 'Home · Features · Docs'}
            </div>
          </div>
        );

      case 'ui-footer':
        return (
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span className="font-semibold text-white">{block.content}</span>
            <div className="flex items-center gap-4 text-[11px]">
              {block.subtitle || 'Privacy · Terms · Docs · GitHub'}
            </div>
          </div>
        );

      case 'ui-input':
        return (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">{block.name}</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={block.content}
                className="w-full bg-[#080b13] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shrink-0 cursor-pointer">
                Submit
              </button>
            </div>
            {block.subtitle && <p className="text-[11px] text-slate-500">{block.subtitle}</p>}
          </div>
        );

      case 'ui-textarea':
        return (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">{block.name}</label>
            <textarea
              rows={3}
              placeholder={block.content}
              className="w-full bg-[#080b13] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none resize-none"
            />
            {block.subtitle && <p className="text-[11px] text-slate-500">{block.subtitle}</p>}
          </div>
        );

      case 'ui-pricing':
        return (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-indigo-400">
              <span>TIER PLAN</span>
              <span className="text-[10px] text-emerald-400">Popular</span>
            </div>
            <div>
              <h4 className="text-lg font-extrabold text-white">{block.content}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{block.subtitle}</p>
            </div>
            <button className="w-full py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md cursor-pointer">
              Choose Plan
            </button>
          </div>
        );

      case 'ui-avatar':
        return (
          <div className="flex items-center gap-2.5">
            <img
              src={block.imageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face'}
              alt={block.content}
              className="w-9 h-9 rounded-full object-cover border border-white/10"
            />
            <div>
              <div className="text-xs font-bold text-white">{block.content}</div>
              <div className="text-[10px] text-slate-400">{block.subtitle || 'Active Developer'}</div>
            </div>
          </div>
        );

      case 'ui-image':
        return (
          <div className="space-y-1.5">
            <div className="w-full h-36 rounded-xl bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-white/10 flex items-center justify-center text-xs text-slate-400">
              Responsive Media Container
            </div>
            <p className="text-[11px] text-slate-400 text-center">{block.content}</p>
          </div>
        );

      case 'logic-counter':
        return (
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 flex flex-col items-center justify-center space-y-1.5">
            <div className="flex items-center gap-1.5 text-indigo-300 font-mono text-xs">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Reactive State Variable</span>
            </div>
            <div className="text-3xl font-extrabold font-mono text-white tabular-nums">
              {block.counterValue !== undefined ? block.counterValue : 0}
            </div>
            <p className="text-xs text-slate-400">{block.content}</p>
          </div>
        );

      case 'logic-click':
      case 'logic-toggle':
        return (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>{block.name}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-300 bg-black/40 p-2 rounded-lg border border-white/5 truncate">
              [ When Triggered ] ➔ [ Action: {block.action || 'change-text'} ] ➔{' '}
              {block.targetId ? `Target: #${block.targetId}` : 'No target wired'}
            </div>
          </div>
        );

      case 'backend-flask':
      case 'backend-fetch':
      case 'backend-blockly':
        return (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-emerald-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" />
                <span>{block.name}</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                REST API
              </span>
            </div>
            <div className="text-[11px] font-mono text-emerald-200/90 bg-black/40 p-2 rounded-lg border border-white/5 truncate">
              {block.content}
            </div>
            {block.subtitle && <p className="text-[11px] text-slate-400">{block.subtitle}</p>}
          </div>
        );

      default:
        return <div>{block.content}</div>;
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropInternal}
      className={`flex-grow bg-[#05070d] p-6 overflow-y-auto flex flex-col items-center justify-start relative select-none ${getGridPatternClass()}`}
    >
      {/* Simulation Banner in Interactive/Preview Mode */}
      {interactivityMode === 'preview' && (
        <div className="w-full max-w-3xl mb-4 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-between text-xs text-emerald-300 shadow-lg">
          <div className="flex items-center gap-2">
            <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
            <span className="font-semibold">Interactive Sandbox Live Mode:</span>
            <span className="text-slate-300 truncate max-w-md">
              {lastSimulatedEvent || 'Click any wired button, counter, or accordion to test state updates directly!'}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700/60 text-emerald-200">
            0ms Latency
          </span>
        </div>
      )}

      {/* Device Bezel Shell */}
      <div
        id="builder-canvas-container"
        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        className={`w-full ${getViewportWidthClass()} min-h-[640px] ${getSurfaceBgClass()} border border-white/10 rounded-2xl shadow-2xl transition-all duration-200 relative overflow-hidden flex flex-col ${
          isDragOver ? 'drag-over-canvas' : ''
        }`}
      >
        {/* Device Window Top Header */}
        <div className="bg-[#090c15] px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 text-[11px] text-slate-500">
              viewport: {viewportMode} ({viewportMode === 'mobile' ? '375px' : viewportMode === 'tablet' ? '768px' : '100%'})
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>{interactivityMode === 'preview' ? 'INTERACTIVE PREVIEW' : 'DESIGN CANVAS'}</span>
            <span>·</span>
            <span>{blocks.length} elements</span>
          </div>
        </div>

        {/* Canvas Body */}
        <div className="p-6 sm:p-7 space-y-3.5 flex-grow">
          {blocks.length === 0 ? (
            <div className="h-80 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">
                <MousePointer className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300">Canvas is Ready</h4>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Drag blocks from the left palette or click any block to insert into this view.
              </p>
            </div>
          ) : (
            blocks.map((block, index) => {
              const isSelected = interactivityMode === 'design' && selectedBlockId === block.id;
              return (
                <div
                  key={block.id}
                  onClick={(e) => {
                    if (interactivityMode === 'design') {
                      e.stopPropagation();
                      onSelectBlock(block.id);
                    }
                  }}
                  className={`relative p-4 rounded-xl transition-all ${
                    interactivityMode === 'design' ? 'cursor-pointer group' : ''
                  } border ${
                    isSelected
                      ? 'canvas-element-selected bg-white/10 border-indigo-500 shadow-xl'
                      : 'border-white/5 bg-white/5 hover:border-white/15 hover:bg-white/[0.07]'
                  } ${block.style.bgColor || ''} ${block.style.padding || ''} ${block.style.borderRadius || ''}`}
                >
                  {/* Floating Action Strip in Design Mode */}
                  {interactivityMode === 'design' && (
                    <div
                      className={`absolute -top-3 right-3 items-center gap-1 bg-[#0c101b] border border-white/10 rounded-lg p-1 text-xs shadow-xl z-20 ${
                        isSelected ? 'flex' : 'hidden group-hover:flex'
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveBlock(index, 'up');
                        }}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20 rounded"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveBlock(index, 'down');
                        }}
                        disabled={index === blocks.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20 rounded"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateBlock(block.id);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-300 rounded"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBlock(block.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Render block */}
                  {renderBlockContent(block)}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
