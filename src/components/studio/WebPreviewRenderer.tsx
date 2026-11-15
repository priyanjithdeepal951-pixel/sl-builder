import React, { useState } from 'react';
import {
  Zap,
  ChevronDown,
  ChevronUp,
  Server,
  Play,
  RotateCcw,
  User,
  Image as ImageIcon,
  Check,
  Clock,
} from 'lucide-react';
import { CanvasBlock } from '../../types/builder';

interface WebPreviewRendererProps {
  blocks: CanvasBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onTriggerAction: (block: CanvasBlock) => void;
  onUpdateBlock: (block: CanvasBlock) => void;
  accentHex?: string;
}

export const WebPreviewRenderer: React.FC<WebPreviewRendererProps> = ({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onTriggerAction,
  onUpdateBlock,
  accentHex = '#4D97FF',
}) => {
  const [apiResponses, setApiResponses] = useState<Record<string, string>>({});
  const [formInputs, setFormInputs] = useState<Record<string, string>>({});

  if (blocks.length === 0) {
    return (
      <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-slate-500">
        <p className="text-xs font-semibold text-slate-300">Empty Web Canvas</p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
          Click or drag any block from the left toolbox to build your live web app.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3.5 text-slate-100">
      {blocks.map((block) => {
        const isSelected = block.id === selectedBlockId;
        const alignClass =
          block.style?.textAlign === 'center'
            ? 'text-center'
            : block.style?.textAlign === 'right'
            ? 'text-right'
            : 'text-left';

        const wrapperClass = `relative rounded-xl transition-all cursor-pointer ${
          isSelected
            ? 'ring-2 ring-[#4D97FF] ring-offset-2 ring-offset-[#07090E]'
            : 'hover:ring-1 hover:ring-white/20'
        }`;

        return (
          <div
            key={block.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectBlock(block.id);
            }}
            className={wrapperClass}
          >
            {/* 1. NAVBAR */}
            {block.type === 'ui-navbar' && (
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: accentHex }}
                  >
                    SL
                  </div>
                  <span className="text-xs font-bold text-white truncate">{block.content}</span>
                </div>
                {block.subtitle && (
                  <span className="text-[10px] text-slate-400 truncate">{block.subtitle}</span>
                )}
              </div>
            )}

            {/* 2. HEADING / HERO */}
            {block.type === 'ui-heading' && (
              <div className={`py-3 px-2 space-y-1.5 ${alignClass}`}>
                <h2 className="text-lg font-extrabold tracking-tight text-white leading-snug">
                  {block.content}
                </h2>
                {block.subtitle && (
                  <p className="text-xs text-slate-400 leading-relaxed">{block.subtitle}</p>
                )}
              </div>
            )}

            {/* 3. PARAGRAPH */}
            {block.type === 'ui-paragraph' && (
              <p className={`p-2 text-xs text-slate-300 leading-relaxed ${alignClass}`}>
                {block.content}
              </p>
            )}

            {/* 4. BADGE / KICKER */}
            {block.type === 'ui-badge' && (
              <div className={`py-1 ${alignClass}`}>
                <span className="text-[11px] font-mono text-indigo-400 font-semibold tracking-wider">
                  {block.content}
                </span>
              </div>
            )}

            {/* 5. KPI STAT */}
            {block.type === 'ui-stat' && (
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="text-[10px] font-mono text-slate-400">
                  {block.statLabel || block.subtitle || block.name}
                </div>
                <div className="text-xl font-extrabold text-white font-mono tabular-nums mt-0.5">
                  {block.statValue || block.content}
                </div>
              </div>
            )}

            {/* 6. CARD */}
            {block.type === 'ui-card' && (
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                <h3 className="text-xs font-bold text-white">{block.content}</h3>
                {block.subtitle && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">{block.subtitle}</p>
                )}
              </div>
            )}

            {/* 7. PRICING */}
            {block.type === 'ui-pricing' && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{block.content}</h3>
                  <span className="text-xs font-mono font-bold text-emerald-400">PRO</span>
                </div>
                {block.subtitle && <p className="text-xs text-slate-300">{block.subtitle}</p>}
              </div>
            )}

            {/* 8. TESTIMONIAL */}
            {block.type === 'ui-testimonial' && (
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  &ldquo;{block.content}&rdquo;
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">
                      {block.subtitle || 'Verified Engineer'}
                    </p>
                    {block.authorRole && (
                      <p className="text-[10px] text-slate-400 truncate">{block.authorRole}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 9. ACCORDION */}
            {block.type === 'ui-accordion' && (
              <div className="rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBlock(block.id);
                    onUpdateBlock({ ...block, isExpanded: !block.isExpanded });
                  }}
                  className="w-full p-3 text-left flex items-center justify-between gap-2 text-xs font-semibold text-white cursor-pointer"
                >
                  <span>{block.content}</span>
                  {block.isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>
                {block.isExpanded && block.subtitle && (
                  <div className="px-3 pb-3 text-[11px] text-slate-400 leading-relaxed border-t border-white/5 pt-2">
                    {block.subtitle}
                  </div>
                )}
              </div>
            )}

            {/* 10. BUTTON */}
            {block.type === 'ui-button' && (
              <div className={`py-1 ${alignClass}`}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBlock(block.id);
                    onTriggerAction(block);
                  }}
                  style={
                    block.buttonVariant === 'primary'
                      ? { backgroundColor: accentHex }
                      : undefined
                  }
                  className={`px-5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer ${
                    block.buttonVariant === 'outline'
                      ? 'border border-white/25 bg-transparent text-white hover:bg-white/10'
                      : block.buttonVariant === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'text-white hover:opacity-95'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{block.content}</span>
                </button>
              </div>
            )}

            {/* 11. INPUT & TEXTAREA */}
            {(block.type === 'ui-input' || block.type === 'ui-textarea') && (
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5">
                {block.subtitle && (
                  <label className="block text-[10px] font-semibold text-slate-400">
                    {block.subtitle}
                  </label>
                )}
                {block.type === 'ui-textarea' ? (
                  <textarea
                    rows={2}
                    value={formInputs[block.id] ?? ''}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      setFormInputs((prev) => ({ ...prev, [block.id]: e.target.value }))
                    }
                    placeholder={block.content}
                    className="w-full rounded-lg bg-[#0B0F17] border border-white/15 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#4D97FF]"
                  />
                ) : (
                  <input
                    type="text"
                    value={formInputs[block.id] ?? ''}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      setFormInputs((prev) => ({ ...prev, [block.id]: e.target.value }))
                    }
                    placeholder={block.content}
                    className="w-full rounded-lg bg-[#0B0F17] border border-white/15 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#4D97FF]"
                  />
                )}
              </div>
            )}

            {/* 12. MEDIA IMAGE / AVATAR */}
            {block.type === 'ui-image' && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-[#111827] border border-white/10 flex flex-col items-center justify-center text-center gap-1.5 min-h-[100px]">
                <ImageIcon className="w-6 h-6 text-sky-400" />
                <p className="text-xs font-bold text-white">{block.content}</p>
                {block.subtitle && <p className="text-[10px] text-slate-400">{block.subtitle}</p>}
              </div>
            )}

            {block.type === 'ui-avatar' && (
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{block.content}</p>
                  {block.subtitle && (
                    <p className="text-[10px] text-slate-400 truncate">{block.subtitle}</p>
                  )}
                </div>
              </div>
            )}

            {/* 13. LOGIC COUNTER */}
            {block.type === 'logic-counter' && (
              <div className="p-4 rounded-xl bg-indigo-950/35 border border-indigo-500/30 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono text-indigo-300 font-semibold">
                    {block.name}
                  </div>
                  <div className="text-xl font-extrabold text-white font-mono tabular-nums">
                    {block.counterValue ?? 0}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextVal = (block.counterValue ?? 0) + 1;
                      onUpdateBlock({
                        ...block,
                        counterValue: nextVal,
                        content: `Clicks Registered: ${nextVal}`,
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateBlock({
                        ...block,
                        counterValue: 0,
                        content: 'Clicks Registered: 0',
                      });
                    }}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
                    title="Reset counter"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* 14. LOGIC TOGGLE / CLICK / TIMER */}
            {block.type === 'logic-toggle' && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/25 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{block.content}</p>
                  <p className="text-[10px] text-amber-300">
                    State: {block.isExpanded ? 'ENABLED' : 'DISABLED'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateBlock({ ...block, isExpanded: !block.isExpanded });
                  }}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    block.isExpanded ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      block.isExpanded ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            {block.type === 'logic-click' && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/25 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{block.content}</p>
                  {block.subtitle && (
                    <p className="text-[10px] text-slate-400 truncate">{block.subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTriggerAction(block);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-bold cursor-pointer shrink-0"
                >
                  Fire
                </button>
              </div>
            )}

            {block.type === 'logic-timer' && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/25 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-white">{block.content}</p>
                    <p className="text-[10px] font-mono text-amber-300 tabular-nums">
                      {block.counterValue ?? 60}s remaining
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateBlock({
                      ...block,
                      counterValue: Math.max(0, (block.counterValue ?? 60) - 5),
                    });
                  }}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-mono text-white cursor-pointer"
                >
                  -5s
                </button>
              </div>
            )}

            {/* 15. BACKEND FLASK / FETCH */}
            {(block.type === 'backend-flask' ||
              block.type === 'backend-fetch' ||
              block.type === 'backend-blockly') && (
              <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Server className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-mono font-bold text-emerald-300 truncate">
                      {block.content}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const endpoint = block.apiEndpoint || '/api/v1/metrics';
                      setApiResponses((prev) => ({
                        ...prev,
                        [block.id]: JSON.stringify(
                          {
                            status: 200,
                            endpoint,
                            uptime: '99.98%',
                            timestamp: new Date().toLocaleTimeString(),
                          },
                          null,
                          0
                        ),
                      }));
                    }}
                    className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" /> Test
                  </button>
                </div>
                {apiResponses[block.id] && (
                  <div className="p-2 rounded bg-[#05070B] border border-emerald-500/20 text-[10px] font-mono text-emerald-300 break-all flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{apiResponses[block.id]}</span>
                  </div>
                )}
              </div>
            )}

            {/* 16. FOOTER */}
            {block.type === 'ui-footer' && (
              <div className="pt-3 mt-1 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                <span>{block.content}</span>
                {block.subtitle && <span>{block.subtitle}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
