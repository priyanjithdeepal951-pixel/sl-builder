import React from 'react';
import { ArrowDown, ArrowUp, Image as ImageIcon, ListPlus, Plus, Trash2, Upload, X } from 'lucide-react';
import type { CanvasBlock } from '../../types/builder';
import { parseOptionsList } from '../../utils/studioRuntime';
import { readAndCompressImageFile } from '../../utils/imageUpload';

export const MULTI_OPTION_BLOCK_TYPES = new Set<CanvasBlock['type']>([
  'ui-sidebar',
  'ui-tabbar',
  'ui-row',
  'ui-column',
  'ui-listview',
  'ui-grid',
  'ui-pageview',
  'ui-carousel',
  'ui-wrap',
  'ui-form',
  'ui-staggered',
  'ui-swipeable-stack',
  'ui-datatable',
  'ui-flex',
  'ui-vertical-divider',
  'ui-select',
  'ui-calendar',
  'ui-google-map',
  'ui-rive',
  'ui-pdf-viewer',
  'ui-language-selector',
  'ui-chart',
  'ui-sticky-header',
  'ui-genui-chat',
  'ui-choice-chips',
  'ui-place-picker',
  'ui-checkbox-group',
]);

export const PHOTO_ITEM_BLOCK_TYPES = new Set<CanvasBlock['type']>([
  'ui-listview',
  'ui-grid',
  'ui-pageview',
  'ui-carousel',
  'ui-staggered',
  'ui-swipeable-stack',
]);

export function supportsItemPhotos(type: CanvasBlock['type']): boolean {
  return PHOTO_ITEM_BLOCK_TYPES.has(type);
}

export function supportsMultiTextBoxes(block: CanvasBlock): boolean {
  if (MULTI_OPTION_BLOCK_TYPES.has(block.type)) return true;
  if (block.type === 'ui-checkbox' && block.controlVariant === 'radio') return true;
  if (block.type === 'ui-navbar') return true;
  if (Array.isArray(block.children) && block.children.length > 0) return true;
  return false;
}

function getDefaultItemsForBlock(block: CanvasBlock): string[] {
  switch (block.type) {
    case 'ui-column':
      return ['Top Widget', 'Middle Widget', 'Bottom Widget'];
    case 'ui-row':
      return ['Widget 1', 'Widget 2', 'Widget 3'];
    case 'ui-tabbar':
      return ['Tab 1', 'Tab 2', 'Tab 3'];
    case 'ui-sidebar':
      return ['Dashboard', 'Projects', 'Settings'];
    case 'ui-vertical-divider':
      return ['Left Panel Content', 'Right Panel Content'];
    case 'ui-flex':
      return ['Pane 1 (1x)', 'Pane 2 (2x)', 'Pane 3 (1x)'];
    case 'ui-select':
      return ['Option 1', 'Option 2'];
    case 'ui-checkbox':
      return ['Choice A', 'Choice B'];
    case 'ui-choice-chips':
      return ['Design', 'Frontend', 'Mobile App'];
    case 'ui-checkbox-group':
      return ['Option A', 'Option B', 'Option C'];
    case 'ui-place-picker':
      return ['Colombo 03, Sri Lanka', 'Kandy City Center', 'Galle Fort'];
    case 'ui-datatable':
      return ['Deepal P. | Architect | Active', 'Maya Lin | UI Lead | Active'];
    case 'ui-listview':
      return ['Alex Rivera · Hey, UI update looks great!', 'Sarah Chen · Ready to publish build', 'Design Team · 4 new components synced'];
    case 'ui-grid':
      return ['Gallery 01', 'Gallery 02', 'Gallery 03', 'Gallery 04'];
    case 'ui-carousel':
      return ['Minimal Workspace', 'Obsidian Studio', 'Sunset Glass', 'Neon Grid'];
    case 'ui-pageview':
      return ['Welcome to Studio · Drag & drop layouts effortlessly', 'Interactive Logic · Connect events & live data', 'Instant Export · Ship clean production code'];
    case 'ui-wrap':
      return ['UI Design', 'React', 'Tailwind CSS'];
    case 'ui-form':
      return ['Full Name', 'Email Address', 'Password'];
    case 'ui-staggered':
      return ['Architecture Concept', 'Minimal UI Kit', 'Typography Study', 'Color Tokens', 'Motion Curve', 'Dark Theme'];
    case 'ui-swipeable-stack':
      return ['Card 1 · Minimal Villa Design', 'Card 2 · Urban Loft Concept', 'Card 3 · Nordic Studio', 'Card 4 · Glass Pavilion'];
    case 'ui-chart':
      return ['5', '12', '18', '24'];
    case 'ui-sticky-header':
      return ['Group A', 'Group B'];
    default:
      return ['Item 1', 'Item 2', 'Item 3'];
  }
}

function getItemNoun(type: CanvasBlock['type']): string {
  switch (type) {
    case 'ui-tabbar':
      return 'Tab';
    case 'ui-column':
    case 'ui-row':
      return 'Widget';
    case 'ui-carousel':
    case 'ui-pageview':
      return 'Slide';
    case 'ui-staggered':
      return 'Tile';
    case 'ui-swipeable-stack':
      return 'Card';
    case 'ui-grid':
      return 'Gallery Item';
    case 'ui-listview':
      return 'Row';
    case 'ui-flex':
      return 'Pane';
    case 'ui-form':
      return 'Field';
    case 'ui-sidebar':
      return 'Link';
    case 'ui-choice-chips':
    case 'ui-wrap':
      return 'Chip';
    case 'ui-chart':
      return 'Value';
    case 'ui-vertical-divider':
      return 'Panel';
    default:
      return 'Item';
  }
}

function shouldKeepContentSeparate(type: CanvasBlock['type']): boolean {
  return (
    type === 'ui-sidebar' ||
    type === 'ui-calendar' ||
    type === 'ui-rive' ||
    type === 'ui-language-selector' ||
    type === 'ui-chart' ||
    type === 'ui-choice-chips' ||
    type === 'ui-place-picker' ||
    type === 'ui-checkbox-group' ||
    type === 'ui-form' ||
    type === 'ui-checkbox'
  );
}

interface MultiTextItemsEditorProps {
  block: CanvasBlock;
  onUpdateBlock: (updated: CanvasBlock) => void;
  onSelectBlock?: (blockId: string) => void;
  compact?: boolean;
  lang?: 'en' | 'si';
}

export const MultiTextItemsEditor: React.FC<MultiTextItemsEditorProps> = ({
  block,
  onUpdateBlock,
  onSelectBlock,
  compact = false,
  lang = 'en',
}) => {
  const stopAndSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectBlock?.(block.id);
  };

  // 1. Nested Child Widgets inside Column / Row / Section / Flex / Stack
  const hasChildren = Array.isArray(block.children) && block.children.length > 0;

  // 2. DataTable (Headers + Per-Cell Rows)
  if (block.type === 'ui-datatable' && !hasChildren) {
    const headers = (block.columnsHeader || 'Name | Role | Status')
      .split('|')
      .map((h) => h.trim());
    const safeHeaders = headers.length > 0 ? headers : ['Column 1', 'Column 2'];

    const rawRows =
      Array.isArray(block.options) && block.options.length > 0
        ? block.options
        : parseOptionsList(block.content, block.options, getDefaultItemsForBlock(block));

    const rowCells = rawRows.map((r) => {
      const cells = r.split('|').map((c) => c.trim());
      while (cells.length < safeHeaders.length) cells.push('');
      return cells.slice(0, safeHeaders.length);
    });

    const commitHeaders = (nextHeaders: string[], nextRows?: string[][]) => {
      const rowsSource = nextRows || rowCells;
      const serializedRows = rowsSource.map((cells) => cells.join(' | '));
      onUpdateBlock({
        ...block,
        columnsHeader: nextHeaders.join(' | '),
        options: serializedRows,
      });
    };

    const commitRows = (nextRows: string[][]) => {
      onUpdateBlock({
        ...block,
        options: nextRows.map((cells) => cells.join(' | ')),
      });
    };

    return (
      <div
        onClick={stopAndSelect}
        className={`rounded-xl bg-[#090B10] border border-sky-500/25 ${compact ? 'p-2.5' : 'p-3'} space-y-2.5`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
            <ListPlus className="w-3.5 h-3.5" />
            {lang === 'si' ? 'Column Headers වෙනම වෙනස් කරන්න' : 'Table Column Headers'}
          </span>
          <button
            type="button"
            onClick={() => {
              const nextHeaders = [...safeHeaders, `Col ${safeHeaders.length + 1}`];
              const nextRows = rowCells.map((r) => [...r, 'Value']);
              commitHeaders(nextHeaders, nextRows);
            }}
            className="px-2 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/30 border border-sky-400/30 text-[10px] font-semibold text-sky-300 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Col
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {safeHeaders.map((h, cIdx) => (
            <div key={cIdx} className="flex items-center gap-1">
              <input
                type="text"
                value={h}
                placeholder={`Header ${cIdx + 1}`}
                onChange={(e) => {
                  const next = [...safeHeaders];
                  next[cIdx] = e.target.value;
                  commitHeaders(next);
                }}
                className="flex-1 min-w-0 bg-[#11151E] border border-white/10 focus:border-[#4D97FF] rounded-lg px-2 py-1 text-[11px] font-semibold text-sky-200 outline-none"
              />
              {safeHeaders.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const nextHeaders = safeHeaders.filter((_, i) => i !== cIdx);
                    const nextRows = rowCells.map((r) => r.filter((_, i) => i !== cIdx));
                    commitHeaders(nextHeaders, nextRows);
                  }}
                  title="Remove column"
                  className="p-1 rounded bg-white/5 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="pt-1 border-t border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              {lang === 'si' ? 'Table Rows (එක එක කොටුව වෙනම)' : 'Table Rows (Per Cell)'}
            </span>
            <button
              type="button"
              onClick={() => {
                commitRows([...rowCells, safeHeaders.map((_, i) => `Cell ${i + 1}`)]);
              }}
              className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-400/30 text-[10px] font-semibold text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Row
            </button>
          </div>

          <div className="space-y-1.5">
            {rowCells.map((cells, rIdx) => (
              <div
                key={rIdx}
                className="p-1.5 rounded-lg bg-[#11151E] border border-white/10 flex items-center gap-1.5"
              >
                <span className="text-[9px] font-mono text-slate-500 w-5 text-center shrink-0">
                  #{rIdx + 1}
                </span>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {cells.map((cell, cIdx) => (
                    <input
                      key={cIdx}
                      type="text"
                      value={cell}
                      placeholder={safeHeaders[cIdx] || `Col ${cIdx + 1}`}
                      onChange={(e) => {
                        const next = rowCells.map((row, ri) =>
                          ri === rIdx
                            ? row.map((val, ci) => (ci === cIdx ? e.target.value : val))
                            : row
                        );
                        commitRows(next);
                      }}
                      className="w-full min-w-0 bg-[#090B10] border border-white/10 focus:border-[#4D97FF] rounded px-2 py-1 text-[11px] text-slate-100 outline-none"
                    />
                  ))}
                </div>
                {rowCells.length > 1 && (
                  <button
                    type="button"
                    onClick={() => commitRows(rowCells.filter((_, i) => i !== rIdx))}
                    title="Delete row"
                    className="p-1 rounded bg-white/5 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. Navbar Individual Link Boxes
  if (block.type === 'ui-navbar') {
    const hasCustomLinks = Array.isArray(block.navLinks) && block.navLinks.length > 0;
    const labels = hasCustomLinks
      ? block.navLinks!.map((l) => l.label)
      : (block.subtitle || 'Features · Blueprints · Docs · Pricing')
          .split(/[·,|]+/)
          .map((s) => s.trim());

    const commitNavLabels = (nextLabels: string[]) => {
      if (hasCustomLinks) {
        const nextNavLinks = nextLabels.map((lbl, idx) => {
          const existing = block.navLinks![idx];
          return existing
            ? { ...existing, label: lbl }
            : {
                id: `nav_${Date.now()}_${idx}`,
                label: lbl,
                action: 'alert' as const,
                message: `Clicked ${lbl}`,
              };
        });
        onUpdateBlock({
          ...block,
          navLinks: nextNavLinks,
          subtitle: nextLabels.filter(Boolean).join(' · '),
        });
      } else {
        onUpdateBlock({
          ...block,
          subtitle: nextLabels.join(' · '),
        });
      }
    };

    return (
      <div
        onClick={stopAndSelect}
        className={`rounded-xl bg-[#090B10] border border-sky-500/25 ${compact ? 'p-2.5' : 'p-3'} space-y-2`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
            <ListPlus className="w-3.5 h-3.5" />
            {lang === 'si' ? 'Navbar Links වෙන වෙනම වෙනස් කරන්න' : `Navbar Link Boxes (${labels.length})`}
          </span>
          <button
            type="button"
            onClick={() => commitNavLabels([...labels, `Link ${labels.length + 1}`])}
            className="px-2 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/30 border border-sky-400/30 text-[10px] font-semibold text-sky-300 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Link
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {labels.map((lbl, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-slate-500 w-5 text-center shrink-0">
                #{idx + 1}
              </span>
              <input
                type="text"
                value={lbl}
                placeholder={`Link ${idx + 1}`}
                onChange={(e) => {
                  const next = [...labels];
                  next[idx] = e.target.value;
                  commitNavLabels(next);
                }}
                className="flex-1 min-w-0 bg-[#11151E] border border-white/10 focus:border-[#4D97FF] rounded-lg px-2 py-1 text-[11px] text-white outline-none"
              />
              {labels.length > 1 && (
                <button
                  type="button"
                  onClick={() => commitNavLabels(labels.filter((_, i) => i !== idx))}
                  title="Remove link"
                  className="p-1 rounded bg-white/5 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. Nested Child Widgets inside Containers (e.g. Column / Row with dropped widgets)
  if (hasChildren) {
    const children = block.children!;
    const updateChild = (idx: number, patch: Partial<CanvasBlock>) => {
      const next = children.map((ch, i) => (i === idx ? { ...ch, ...patch } : ch));
      onUpdateBlock({ ...block, children: next });
    };
    const moveChild = (idx: number, dir: -1 | 1) => {
      const target = idx + dir;
      if (target < 0 || target >= children.length) return;
      const next = [...children];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      onUpdateBlock({ ...block, children: next });
    };
    const removeChild = (idx: number) => {
      onUpdateBlock({ ...block, children: children.filter((_, i) => i !== idx) });
    };

    return (
      <div
        onClick={stopAndSelect}
        className={`rounded-xl bg-[#090B10] border border-sky-500/25 ${compact ? 'p-2.5' : 'p-3'} space-y-2`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
            <ListPlus className="w-3.5 h-3.5" />
            {lang === 'si'
              ? `ඇතුළත Widgets වෙන වෙනම (${children.length})`
              : `Child Widget Text Boxes (${children.length})`}
          </span>
        </div>

        <div className="space-y-1.5">
          {children.map((child, idx) => (
            <div
              key={child.id}
              className="p-2 rounded-lg bg-[#11151E] border border-white/10 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-sky-300 truncate">
                  #{idx + 1} · {child.name} ({child.type})
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveChild(idx, -1)}
                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === children.length - 1}
                    onClick={() => moveChild(idx, 1)}
                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeChild(idx)}
                    className="p-1 rounded bg-white/5 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={child.content}
                  placeholder="Widget text..."
                  onChange={(e) => updateChild(idx, { content: e.target.value })}
                  className="w-full bg-[#090B10] border border-white/10 focus:border-[#4D97FF] rounded px-2 py-1 text-[11px] text-white outline-none"
                />
                <input
                  type="text"
                  value={child.subtitle || ''}
                  placeholder="Subtitle (optional)..."
                  onChange={(e) => updateChild(idx, { subtitle: e.target.value })}
                  className="w-full bg-[#090B10] border border-white/10 focus:border-[#4D97FF] rounded px-2 py-1 text-[11px] text-slate-300 outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. Standard & Tabbar Option List Boxes (ui-column, ui-row, ui-tabbar, ui-listview, ui-grid, ui-pageview, ui-carousel, ui-staggered, ui-swipeable-stack, etc.)
  const fallbackItems = getDefaultItemsForBlock(block);
  const items =
    Array.isArray(block.options) && block.options.length > 0
      ? block.options
      : parseOptionsList(block.content, block.options, fallbackItems);

  const allowPhotos = supportsItemPhotos(block.type);
  const currentImages = Array.isArray(block.itemImages) ? block.itemImages : [];
  const alignedImages = items.map((_, idx) => currentImages[idx] || '');

  const keepContent = shouldKeepContentSeparate(block.type);
  const itemNoun = getItemNoun(block.type);

  // Tabbar also stores per-tab panel text in `block.subtitle` split by `|`
  const isTabbar = block.type === 'ui-tabbar';
  const rawPanels = isTabbar
    ? (block.subtitle || '').split('|').map((p) => p.trim())
    : [];
  const panels = isTabbar
    ? items.map((_, idx) => rawPanels[idx] ?? (idx === 0 && rawPanels.length === 1 ? rawPanels[0] : ''))
    : [];

  const commitItems = (
    nextItems: string[],
    nextPanels?: string[],
    nextImages?: string[]
  ) => {
    const safeItems = nextItems.length > 0 ? nextItems : [''];
    const patch: Partial<CanvasBlock> = {
      options: safeItems,
      ...(keepContent ? {} : { content: safeItems.filter(Boolean).join(' | ') }),
    };
    if (isTabbar && nextPanels) {
      patch.subtitle = nextPanels.join(' | ');
    }
    if (allowPhotos) {
      patch.itemImages = nextImages || alignedImages.slice(0, safeItems.length);
    }
    onUpdateBlock({ ...block, ...patch });
  };

  const handleItemChange = (idx: number, val: string) => {
    const next = [...items];
    next[idx] = val;
    commitItems(next, isTabbar ? panels : undefined, alignedImages);
  };

  const handleImageChange = (idx: number, url: string) => {
    const nextImages = [...alignedImages];
    nextImages[idx] = url;
    commitItems(items, isTabbar ? panels : undefined, nextImages);
  };

  const handlePanelChange = (idx: number, val: string) => {
    const nextPanels = [...panels];
    nextPanels[idx] = val;
    commitItems(items, nextPanels, alignedImages);
  };

  const handleMoveItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [it] = next.splice(idx, 1);
    next.splice(target, 0, it);

    const nextImages = [...alignedImages];
    const [img] = nextImages.splice(idx, 1);
    nextImages.splice(target, 0, img || '');

    if (isTabbar) {
      const nextPanels = [...panels];
      const [pn] = nextPanels.splice(idx, 1);
      nextPanels.splice(target, 0, pn);
      commitItems(next, nextPanels, nextImages);
    } else {
      commitItems(next, undefined, nextImages);
    }
  };

  const handleDeleteItem = (idx: number) => {
    if (items.length <= 1) return;
    const next = items.filter((_, i) => i !== idx);
    const nextImages = alignedImages.filter((_, i) => i !== idx);
    const nextPanels = isTabbar ? panels.filter((_, i) => i !== idx) : undefined;
    commitItems(next, nextPanels, nextImages);
  };

  const handleAddItem = () => {
    const nextLabel = `${itemNoun} ${items.length + 1}`;
    const next = [...items, nextLabel];
    const nextImages = allowPhotos ? [...alignedImages, ''] : undefined;
    const nextPanels = isTabbar ? [...panels, `${nextLabel} content`] : undefined;
    commitItems(next, nextPanels, nextImages);
  };

  return (
    <div
      onClick={stopAndSelect}
      className={`rounded-xl bg-[#090B10] border border-sky-500/25 ${compact ? 'p-2.5' : 'p-3'} space-y-2`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
          <ListPlus className="w-3.5 h-3.5" />
          {allowPhotos
            ? lang === 'si'
              ? `එක එක ${itemNoun} Text & Photo වෙනම (${items.length})`
              : `${itemNoun} Text & Photo Boxes (${items.length})`
            : lang === 'si'
            ? `එක එක ${itemNoun} Text වෙනම වෙනස් කරන්න (${items.length})`
            : `${itemNoun} Boxes — Edit Each Individually (${items.length})`}
        </span>
        <button
          type="button"
          onClick={handleAddItem}
          className="px-2 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/30 border border-sky-400/30 text-[10px] font-semibold text-sky-300 flex items-center gap-1 cursor-pointer shrink-0"
        >
          <Plus className="w-3 h-3" /> Add {itemNoun}
        </button>
      </div>

      <div className="space-y-1.5">
        {items.map((itemText, idx) => {
          const itemPhoto = alignedImages[idx] || '';
          return (
            <div
              key={idx}
              className={
                allowPhotos
                  ? 'p-2 rounded-lg bg-[#11151E] border border-white/10 space-y-1.5'
                  : 'flex items-center gap-1.5'
              }
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-sky-400/80 bg-sky-500/10 border border-sky-500/20 rounded px-1.5 py-1 min-w-[28px] text-center shrink-0">
                  {idx + 1}
                </span>

                {isTabbar ? (
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 min-w-0">
                    <input
                      type="text"
                      value={itemText}
                      placeholder={`Tab ${idx + 1} Title`}
                      onChange={(e) => handleItemChange(idx, e.target.value)}
                      className="w-full min-w-0 bg-[#11151E] border border-white/10 focus:border-[#4D97FF] rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white placeholder-slate-600 outline-none"
                    />
                    <input
                      type="text"
                      value={panels[idx] || ''}
                      placeholder={`Tab ${idx + 1} Panel Content`}
                      onChange={(e) => handlePanelChange(idx, e.target.value)}
                      className="w-full min-w-0 bg-[#11151E] border border-white/10 focus:border-[#4D97FF] rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-600 outline-none"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={itemText}
                    placeholder={`${itemNoun} ${idx + 1} text...`}
                    onChange={(e) => handleItemChange(idx, e.target.value)}
                    className={`flex-1 min-w-0 ${
                      allowPhotos ? 'bg-[#090B10]' : 'bg-[#11151E]'
                    } border border-white/10 focus:border-[#4D97FF] rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-slate-600 outline-none`}
                  />
                )}

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveItem(idx, -1)}
                    title="Move Up"
                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 disabled:opacity-25 cursor-pointer"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => handleMoveItem(idx, 1)}
                    title="Move Down"
                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 disabled:opacity-25 cursor-pointer"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={items.length <= 1}
                    onClick={() => handleDeleteItem(idx)}
                    title={`Remove ${itemNoun}`}
                    className="p-1 rounded bg-white/5 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 disabled:opacity-25 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {allowPhotos && (
                <div className="flex items-center gap-1.5 pl-8">
                  {itemPhoto ? (
                    <img
                      src={itemPhoto}
                      alt=""
                      className="w-7 h-7 rounded-md object-cover border border-sky-400/40 shrink-0"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-md bg-[#090B10] border border-white/10 flex items-center justify-center text-slate-500 shrink-0">
                      <ImageIcon className="w-3.5 h-3.5" />
                    </span>
                  )}

                  <label className="px-2 py-1 rounded-md bg-sky-600/85 hover:bg-sky-500 text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer shrink-0">
                    <Upload className="w-3 h-3" />
                    <span>{itemPhoto ? 'Change' : 'Add Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        try {
                          const dataUrl = await readAndCompressImageFile(file);
                          handleImageChange(idx, dataUrl);
                        } catch {
                          // ignore invalid image
                        }
                      }}
                    />
                  </label>

                  <input
                    type="text"
                    value={itemPhoto.startsWith('data:') ? '' : itemPhoto}
                    onChange={(e) => handleImageChange(idx, e.target.value)}
                    placeholder={
                      itemPhoto.startsWith('data:')
                        ? 'Uploaded photo attached'
                        : 'Or paste image URL (https://...)'
                    }
                    className="flex-1 min-w-0 bg-[#090B10] border border-white/10 focus:border-[#4D97FF] rounded-md px-2 py-1 text-[10.5px] text-sky-200 placeholder-slate-500 outline-none"
                  />

                  {itemPhoto && (
                    <button
                      type="button"
                      onClick={() => handleImageChange(idx, '')}
                      title="Remove photo"
                      className="p-1 rounded-md bg-white/5 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 cursor-pointer shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
