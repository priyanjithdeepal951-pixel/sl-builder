import React, { useState } from 'react';
import {
  Type,
  Square,
  Image as ImageIcon,
  MousePointerClick,
  GitBranch,
  Repeat,
  Binary,
  Server,
  Puzzle,
  Search,
  CreditCard,
  TextCursorInput,
  Compass,
  Plus,
  BarChart3,
  MessageSquareQuote,
  ChevronDown,
  AlignLeft,
  Columns,
  User,
} from 'lucide-react';
import { BlockType, CanvasBlock } from '../../types/builder';

interface BlockPaletteProps {
  onAddBlock: (type: BlockType) => void;
  onDragStart: (e: React.DragEvent, type: BlockType) => void;
  blocksOnCanvas: CanvasBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onMoveBlock: (index: number, direction: 'up' | 'down') => void;
}

export const BlockPalette: React.FC<BlockPaletteProps> = ({
  onAddBlock,
  onDragStart,
  blocksOnCanvas,
  selectedBlockId,
  onSelectBlock,
  onDeleteBlock,
  onMoveBlock,
}) => {
  const [activeTab, setActiveTab] = useState<'blocks' | 'tree' | 'vault'>('blocks');
  const [searchQuery, setSearchQuery] = useState('');

  const paletteItems: {
    type: BlockType;
    category: 'ui' | 'logic' | 'backend' | 'media';
    title: string;
    description: string;
    icon: any;
  }[] = [
    // UI BLOCKS
    {
      type: 'ui-heading',
      category: 'ui',
      title: 'Heading / Title',
      description: 'Bold prominent headline',
      icon: Type,
    },
    {
      type: 'ui-paragraph',
      category: 'ui',
      title: 'Paragraph Text',
      description: 'Body copy and explanatory text',
      icon: AlignLeft,
    },
    {
      type: 'ui-button',
      category: 'ui',
      title: 'Action Button',
      description: 'Clickable interactive trigger',
      icon: MousePointerClick,
    },
    {
      type: 'ui-stat',
      category: 'ui',
      title: 'KPI Stat Counter',
      description: 'Key performance metric card',
      icon: BarChart3,
    },
    {
      type: 'ui-testimonial',
      category: 'ui',
      title: 'Testimonial Card',
      description: 'Customer review with quote & author',
      icon: MessageSquareQuote,
    },
    {
      type: 'ui-accordion',
      category: 'ui',
      title: 'Accordion / FAQ',
      description: 'Interactive collapsible question',
      icon: ChevronDown,
    },
    {
      type: 'ui-input',
      category: 'ui',
      title: 'Input Field',
      description: 'Form text or email capture',
      icon: TextCursorInput,
    },
    {
      type: 'ui-textarea',
      category: 'ui',
      title: 'Textarea Field',
      description: 'Multiline message capture',
      icon: AlignLeft,
    },
    {
      type: 'ui-card',
      category: 'ui',
      title: 'Feature Card',
      description: 'Elevated container with details',
      icon: Square,
    },
    {
      type: 'ui-navbar',
      category: 'ui',
      title: 'Top Navigation',
      description: 'Brand header with links',
      icon: Compass,
    },
    {
      type: 'ui-pricing',
      category: 'ui',
      title: 'Pricing Card',
      description: 'Tier price, features & button',
      icon: CreditCard,
    },
    {
      type: 'ui-footer',
      category: 'ui',
      title: 'Footer Bar',
      description: 'Bottom site links & copyright',
      icon: Columns,
    },
    // MEDIA
    {
      type: 'ui-image',
      category: 'media',
      title: 'Image Frame',
      description: 'Responsive media container',
      icon: ImageIcon,
    },
    {
      type: 'ui-avatar',
      category: 'media',
      title: 'User Avatar',
      description: 'Circular profile badge with name',
      icon: User,
    },
    // LOGIC BLOCKS
    {
      type: 'logic-counter',
      category: 'logic',
      title: 'Interactive Counter',
      description: 'Reactive variable state',
      icon: Binary,
    },
    {
      type: 'logic-click',
      category: 'logic',
      title: 'Event Listener Wire',
      description: 'Targeted click event dispatch',
      icon: MousePointerClick,
    },
    {
      type: 'logic-toggle',
      category: 'logic',
      title: 'Toggle Visibility',
      description: 'Show or hide target element',
      icon: GitBranch,
    },
    // BACKEND BLOCKS
    {
      type: 'backend-flask',
      category: 'backend',
      title: 'Python Flask API',
      description: 'Microservice REST endpoint',
      icon: Server,
    },
    {
      type: 'backend-fetch',
      category: 'backend',
      title: 'Fetch API Wire',
      description: 'Client async fetch() call',
      icon: Repeat,
    },
    {
      type: 'backend-blockly',
      category: 'backend',
      title: 'Visual Code Engine',
      description: 'Algorithmic logic generator',
      icon: Puzzle,
    },
  ];

  const filteredItems = paletteItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-72 bg-[#090c15] border-r border-white/10 flex flex-col h-full overflow-hidden select-none">
      {/* Top Segmented Tabs */}
      <div className="p-2 border-b border-white/10 bg-[#07090e]">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('blocks')}
            className={`flex-1 py-1 text-center rounded transition-colors ${
              activeTab === 'blocks' ? 'bg-white/15 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Blocks
          </button>
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex-1 py-1 text-center rounded transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'tree' ? 'bg-white/15 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Tree</span>
            <span className="text-[10px] text-slate-400 font-mono">({blocksOnCanvas.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`flex-1 py-1 text-center rounded transition-colors ${
              activeTab === 'vault' ? 'bg-white/15 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vault
          </button>
        </div>
      </div>

      {activeTab === 'blocks' && (
        <div className="flex-grow flex flex-col overflow-hidden p-3 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or drag block..."
              className="w-full bg-[#080b13] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between px-1">
            <span>PALETTE</span>
            <span>{filteredItems.length} BLOCKS</span>
          </div>

          {/* Categorized list */}
          <div className="flex-grow overflow-y-auto space-y-4 pr-1">
            {/* UI Category */}
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 px-1">
                UI & Layout Primitives
              </div>
              <div className="space-y-1.5">
                {filteredItems
                  .filter((item) => item.category === 'ui' || item.category === 'media')
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, item.type)}
                        onClick={() => onAddBlock(item.type)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 cursor-grab active:cursor-grabbing flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-black/40 flex items-center justify-center text-slate-300">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-white group-hover:text-indigo-300 transition-colors">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-slate-400">{item.description}</div>
                          </div>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Logic Category */}
            <div>
              <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-2 px-1">
                Reactive Logic & Events
              </div>
              <div className="space-y-1.5">
                {filteredItems
                  .filter((item) => item.category === 'logic')
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, item.type)}
                        onClick={() => onAddBlock(item.type)}
                        className="p-2.5 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 hover:border-amber-500/30 cursor-grab active:cursor-grabbing flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-black/40 flex items-center justify-center text-amber-400">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-white group-hover:text-amber-300 transition-colors">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-slate-400">{item.description}</div>
                          </div>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Backend Category */}
            <div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-2 px-1">
                Backend REST & Microservices
              </div>
              <div className="space-y-1.5">
                {filteredItems
                  .filter((item) => item.category === 'backend')
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, item.type)}
                        onClick={() => onAddBlock(item.type)}
                        className="p-2.5 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 hover:border-emerald-500/30 cursor-grab active:cursor-grabbing flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-black/40 flex items-center justify-center text-emerald-400">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-white group-hover:text-emerald-300 transition-colors">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-slate-400">{item.description}</div>
                          </div>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TREE TAB */}
      {activeTab === 'tree' && (
        <div className="flex-grow p-3 overflow-y-auto space-y-1.5">
          <div className="text-[10px] font-mono text-slate-400 mb-2 px-1">ELEMENT HIERARCHY</div>
          {blocksOnCanvas.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">No elements on canvas.</div>
          ) : (
            blocksOnCanvas.map((blk, idx) => (
              <div
                key={blk.id}
                onClick={() => onSelectBlock(blk.id)}
                className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  selectedBlockId === blk.id
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[10px] font-mono text-slate-500">{idx + 1}</span>
                  <span className="font-medium truncate">{blk.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveBlock(idx, 'up');
                    }}
                    disabled={idx === 0}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                    title="Move Up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveBlock(idx, 'down');
                    }}
                    disabled={idx === blocksOnCanvas.length - 1}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                    title="Move Down"
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VAULT TAB */}
      {activeTab === 'vault' && (
        <div className="flex-grow p-3 overflow-y-auto space-y-2">
          <div className="text-[10px] font-mono text-slate-400 mb-2 px-1">PRE-WIRED BLUEPRINT SNIPPETS</div>
          <div
            onClick={() => {
              onAddBlock('ui-heading');
              onAddBlock('logic-counter');
              onAddBlock('ui-button');
            }}
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/40 cursor-pointer transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white group-hover:text-indigo-300">
                ⚡ Reactive Counter Stack
              </span>
              <span className="text-[10px] font-mono text-slate-400">3 Blocks</span>
            </div>
            <p className="text-[11px] text-slate-400">Title + State Counter + Trigger Button.</p>
          </div>

          <div
            onClick={() => {
              onAddBlock('ui-stat');
              onAddBlock('ui-testimonial');
              onAddBlock('ui-accordion');
            }}
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/40 cursor-pointer transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white group-hover:text-indigo-300">
                📊 Proof & Social Validation
              </span>
              <span className="text-[10px] font-mono text-slate-400">3 Blocks</span>
            </div>
            <p className="text-[11px] text-slate-400">KPI Metric + Customer Review + Collapsible FAQ.</p>
          </div>

          <div
            onClick={() => {
              onAddBlock('ui-navbar');
              onAddBlock('ui-heading');
              onAddBlock('ui-pricing');
              onAddBlock('ui-footer');
            }}
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/40 cursor-pointer transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white group-hover:text-indigo-300">
                💳 Full Landing Stack
              </span>
              <span className="text-[10px] font-mono text-slate-400">4 Blocks</span>
            </div>
            <p className="text-[11px] text-slate-400">Navbar + Hero + Pricing Tier + Footer.</p>
          </div>

          <div
            onClick={() => {
              onAddBlock('backend-flask');
              onAddBlock('backend-fetch');
            }}
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 cursor-pointer transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                🐍 Python REST Endpoint
              </span>
              <span className="text-[10px] font-mono text-slate-400">2 Blocks</span>
            </div>
            <p className="text-[11px] text-slate-400">Flask API route + Client fetch wire.</p>
          </div>
        </div>
      )}
    </div>
  );
};
