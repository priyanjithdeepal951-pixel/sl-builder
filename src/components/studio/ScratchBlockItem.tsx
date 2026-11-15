import React from 'react';
import { Flag, RotateCw, RotateCcw, Trash2, Play } from 'lucide-react';
import { CATEGORY_COLOR_MAP, SCRATCH_BLOCK_DEFS } from '../../data/scratchBlocks';
import { ScratchBlockDef, WorkspaceBlock } from '../../types/studio';

interface ScratchBlockItemProps {
  def?: ScratchBlockDef;
  block?: WorkspaceBlock;
  lang?: 'en' | 'si';
  inPalette?: boolean;
  onClickPalette?: (def: ScratchBlockDef) => void;
  onDragStartPalette?: (e: React.DragEvent, def: ScratchBlockDef) => void;
  onChangeParam?: (blockId: string, key: string, value: string | number) => void;
  onDeleteBlock?: (blockId: string) => void;
  onRunSingle?: () => void;
  isHighlighted?: boolean;
}

export const ScratchBlockItem: React.FC<ScratchBlockItemProps> = ({
  def: propDef,
  block,
  lang = 'en',
  inPalette = false,
  onClickPalette,
  onDragStartPalette,
  onChangeParam,
  onDeleteBlock,
  onRunSingle,
  isHighlighted = false,
}) => {
  const resolvedDef =
    propDef || SCRATCH_BLOCK_DEFS.find((d) => d.opcode === block?.opcode);

  if (!resolvedDef) return null;

  const meta = CATEGORY_COLOR_MAP[resolvedDef.category];
  const params = block ? block.params : resolvedDef.defaults;
  const shape = block ? block.shape : resolvedDef.shape;

  const isReporter = shape === 'reporter';
  const isBoolean = shape === 'boolean';
  const isHat = shape === 'hat';
  const isCBlock = shape === 'c-block';

  const renderSegments = () =>
    resolvedDef.segments.map((seg, idx) => {
      if (seg.kind === 'text') {
        return (
          <span key={idx} className="font-semibold text-[12px] tracking-tight text-white whitespace-nowrap select-none">
            {lang === 'si' && seg.siValue ? seg.siValue : seg.value}
          </span>
        );
      }

      if (seg.kind === 'icon') {
        if (seg.icon === 'flag') {
          return <Flag key={idx} className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500 shrink-0" />;
        }
        if (seg.icon === 'turn-right') {
          return <RotateCw key={idx} className="w-3.5 h-3.5 text-white shrink-0" />;
        }
        if (seg.icon === 'turn-left') {
          return <RotateCcw key={idx} className="w-3.5 h-3.5 text-white shrink-0" />;
        }
      }

      if (seg.kind === 'input') {
        const val = params[seg.key] ?? '';

        if (seg.inputType === 'dropdown') {
          return (
            <select
              key={idx}
              value={String(val)}
              disabled={inPalette}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                if (block && onChangeParam) {
                  onChangeParam(block.id, seg.key, e.target.value);
                }
              }}
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white outline-none border border-black/15 cursor-pointer appearance-none pr-4 bg-no-repeat"
              style={{
                backgroundColor: meta.darkColor,
                backgroundImage:
                  'url("data:image/svg+xml;utf8,<svg fill=\'white\' height=\'10\' viewBox=\'0 0 24 24\' width=\'10\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/></svg>")',
                backgroundPosition: 'right 4px center',
              }}
            >
              {(seg.options || [String(val)]).map((opt) => (
                <option key={opt} value={opt} className="bg-slate-800 text-white">
                  {opt}
                </option>
              ))}
            </select>
          );
        }

        const isNum = seg.inputType === 'number';
        const inputWidth = Math.max(28, String(val).length * 7 + 16);

        return (
          <input
            key={idx}
            type={isNum ? 'number' : 'text'}
            value={val}
            readOnly={inPalette}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              if (block && onChangeParam) {
                const parsed = isNum ? Number(e.target.value) : e.target.value;
                onChangeParam(block.id, seg.key, parsed);
              }
            }}
            style={{ width: `${Math.min(inputWidth, 140)}px` }}
            className="bg-white text-slate-800 rounded-full px-2 py-0.5 text-[11px] font-bold text-center outline-none border border-black/10 shadow-inner"
          />
        );
      }

      return null;
    });

  // Base Scratch puzzle block styling
  const borderRadiusClass = isReporter
    ? 'rounded-full px-3.5 py-1.5'
    : isBoolean
    ? 'rounded-lg px-3.5 py-1.5'
    : isHat
    ? 'rounded-t-2xl rounded-b-md px-3 py-2 pt-3'
    : 'rounded-md px-3 py-1.5';

  return (
    <div
      draggable={inPalette}
      onDragStart={(e) => {
        if (inPalette && onDragStartPalette) {
          onDragStartPalette(e, resolvedDef);
        }
      }}
      onClick={() => {
        if (inPalette && onClickPalette) {
          onClickPalette(resolvedDef);
        } else if (!inPalette && onRunSingle) {
          onRunSingle();
        }
      }}
      className={`group relative inline-flex flex-col select-none transition-transform ${
        inPalette ? 'cursor-grab active:cursor-grabbing hover:brightness-105' : 'cursor-pointer'
      } ${isHighlighted ? 'ring-2 ring-yellow-300 shadow-[0_0_16px_rgba(253,224,71,0.7)]' : ''}`}
    >
      {/* Hat Block Top Dome Accent */}
      {isHat && (
        <div
          className="h-2.5 w-24 rounded-t-full -mb-1 ml-0.5 border-t border-l border-r"
          style={{
            backgroundColor: meta.color,
            borderColor: meta.borderColor,
          }}
        />
      )}

      {/* Main Block Body */}
      <div
        className={`relative flex items-center gap-1.5 shadow-sm border ${borderRadiusClass}`}
        style={{
          backgroundColor: meta.color,
          borderColor: meta.borderColor,
        }}
      >
        {/* Top puzzle notch indicator for stack/c-blocks */}
        {!isHat && !isReporter && !isBoolean && (
          <div
            className="absolute -top-[1px] left-3 w-5 h-1.5 rounded-b-sm bg-black/15 pointer-events-none"
            aria-hidden="true"
          />
        )}

        {renderSegments()}

        {/* Workspace block quick controls on hover */}
        {!inPalette && block && (
          <div
            className="ml-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {onRunSingle && (
              <button
                type="button"
                onClick={onRunSingle}
                title="Run this block / script"
                className="p-0.5 rounded bg-black/20 hover:bg-black/35 text-white cursor-pointer"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
              </button>
            )}
            {onDeleteBlock && (
              <button
                type="button"
                onClick={() => onDeleteBlock(block.id)}
                title="Remove block"
                className="p-0.5 rounded bg-black/20 hover:bg-rose-600 text-white cursor-pointer"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        )}

        {/* Bottom puzzle tab */}
        {shape !== 'cap' && !isReporter && !isBoolean && !isCBlock && (
          <div
            className="absolute -bottom-[5px] left-3 w-5 h-1.5 rounded-b-sm border-b border-l border-r pointer-events-none z-10"
            style={{
              backgroundColor: meta.color,
              borderColor: meta.borderColor,
            }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* C-Block Visual Jaw for control_repeat / control_forever / control_if */}
      {isCBlock && (
        <div className="flex flex-col">
          <div className="flex">
            <div
              className="w-4 min-h-[26px] border-l border-r"
              style={{
                backgroundColor: meta.color,
                borderColor: meta.borderColor,
              }}
            />
            {!inPalette && block?.children && block.children.length > 0 ? (
              <div className="flex flex-col gap-1 py-1 pl-0.5">
                {block.children.map((child) => (
                  <ScratchBlockItem
                    key={child.id}
                    block={child}
                    lang={lang}
                    onChangeParam={onChangeParam}
                    onDeleteBlock={onDeleteBlock}
                  />
                ))}
              </div>
            ) : (
              <div className="min-w-[90px] min-h-[26px] border-dashed border border-white/20 rounded-r bg-black/30 flex items-center px-2 text-[10px] text-slate-300">
                {inPalette ? '' : 'loop body'}
              </div>
            )}
          </div>
          <div
            className="h-4 w-28 rounded-b-md border relative"
            style={{
              backgroundColor: meta.color,
              borderColor: meta.borderColor,
            }}
          >
            <div
              className="absolute -bottom-[5px] left-3 w-5 h-1.5 rounded-b-sm border-b border-l border-r pointer-events-none"
              style={{
                backgroundColor: meta.color,
                borderColor: meta.borderColor,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
