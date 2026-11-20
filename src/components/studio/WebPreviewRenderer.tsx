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
  Sparkles,
  Shield,
  Rocket,
  Heart,
  Star,
  Globe,
  Code2,
  Database,
  Bell,
  Upload,
  Video,
  Link2,
  EyeOff,
  PanelLeft,
  Columns3,
  LayoutGrid,
  GitBranch,
  Repeat,
  Braces,
  Calculator,
  HardDrive,
  Lock,
  Smartphone,
  MapPin,
  Camera,
  X,
  Pencil,
  GripVertical,
  Music,
  Mail,
  Phone,
  Home,
  Search,
  Settings,
  ShoppingBag,
  Flame,
  Crown,
  Compass,
} from 'lucide-react';
import {
  CanvasBlock,
  NavbarLinkItem,
  PageStyleSettings,
  SitePage,
} from '../../types/builder';
import { LiveBackgroundLayer } from './LiveBackgroundLayer';
import {
  isLightPageBackground,
  resolvePageBackgroundCss,
} from '../../utils/pageStylePresets';
import { getEffectiveNavLinks } from '../../utils/navLinkHelpers';
import {
  INITIAL_RUNTIME_STATE,
  StudioRuntimeState,
  evaluateLogicCondition,
  evaluateMathTextOperation,
  parseOptionsList,
} from '../../utils/studioRuntime';
import { readAndCompressImageFile } from '../../utils/imageUpload';
import { ICON_LIBRARY, parseVideoUrl } from '../../utils/mediaHelpers';

export interface PreviewConfirmDialog {
  id: string;
  title: string;
  message: string;
  confirmLabel?: string;
}

interface WebPreviewRendererProps {
  blocks: CanvasBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onTriggerAction: (block: CanvasBlock, formValues?: Record<string, string>) => void;
  onTriggerNavLink?: (navBlock: CanvasBlock, link: NavbarLinkItem) => void;
  onUpdateBlock: (block: CanvasBlock) => void;
  accentHex?: string;
  pages?: SitePage[];
  onSelectPage?: (pageId: string) => void;
  pageStyle?: PageStyleSettings;
  runtimeState?: StudioRuntimeState;
  formInputs?: Record<string, string>;
  onFormInputChange?: (blockId: string, value: string, fireInputEvent?: boolean) => void;
  confirmDialog?: PreviewConfirmDialog | null;
  onResolveConfirm?: (accepted: boolean) => void;
  runningTimers?: Record<string, boolean>;
  onToggleTimer?: (block: CanvasBlock) => void;
  onDropAtStageIndex?: (
    payload: {
      tplId?: string;
      blockType?: string;
      moveBlockId?: string;
      imageDataUrl?: string;
      fileName?: string;
    },
    index: number
  ) => void;
  onDismissSubmission?: () => void;
}

const FONT_SIZE_MAP: Record<string, string> = {
  xs: 'text-xs',
  sm: 'text-xs',
  base: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
  '2xl': 'text-xl',
  '3xl': 'text-2xl',
  '4xl': 'text-3xl',
};

const FONT_WEIGHT_MAP: Record<string, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
};

const FONT_FAMILY_CSS: Record<string, string> = {
  sans: 'Inter, system-ui, -apple-system, sans-serif',
  serif: "Georgia, Cambria, 'Times New Roman', serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
  display: "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif",
  rounded: "'Nunito', 'Quicksand', 'Segoe UI', system-ui, sans-serif",
};

const TEXT_COLOR_MAP: Record<string, string> = {
  'text-white': 'text-white',
  'text-slate-300': 'text-slate-300',
  'text-indigo-400': 'text-indigo-400',
  'text-emerald-400': 'text-emerald-400',
  'text-amber-300': 'text-amber-300',
  'text-rose-400': 'text-rose-400',
  'text-sky-400': 'text-sky-400',
};

const BG_COLOR_MAP: Record<string, string> = {
  'bg-transparent': 'bg-transparent',
  'bg-white/5': 'bg-white/[0.04]',
  'bg-[#161B26]': 'bg-[#161B26]',
  'bg-indigo-600': 'bg-indigo-600',
  'bg-indigo-950/40': 'bg-indigo-950/40',
  'bg-emerald-950/30': 'bg-emerald-950/30',
  'bg-rose-950/30': 'bg-rose-950/30',
  'bg-amber-950/25': 'bg-amber-950/25',
};

const RADIUS_MAP: Record<string, string> = {
  'rounded-none': 'rounded-none',
  'rounded-lg': 'rounded-lg',
  'rounded-xl': 'rounded-xl',
  'rounded-2xl': 'rounded-2xl',
  'rounded-full': 'rounded-full',
};

const PADDING_MAP: Record<string, string> = {
  'p-0': 'p-0',
  'p-2': 'p-2',
  'p-3': 'p-3',
  'p-4': 'p-4',
  'p-5': 'p-5',
  'py-3 px-6': 'py-3 px-6',
  'py-4 px-2': 'py-4 px-2',
};

export function renderVectorIcon(iconName: string | undefined, className = 'w-6 h-6') {
  switch ((iconName || 'sparkles').toLowerCase()) {
    case 'zap':
      return <Zap className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'rocket':
      return <Rocket className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'globe':
      return <Globe className={className} />;
    case 'code':
      return <Code2 className={className} />;
    case 'database':
      return <Database className={className} />;
    case 'bell':
      return <Bell className={className} />;
    case 'user':
      return <User className={className} />;
    case 'check':
      return <Check className={className} />;
    case 'camera':
      return <Camera className={className} />;
    case 'video':
      return <Video className={className} />;
    case 'music':
      return <Music className={className} />;
    case 'mail':
      return <Mail className={className} />;
    case 'phone':
      return <Phone className={className} />;
    case 'home':
      return <Home className={className} />;
    case 'search':
      return <Search className={className} />;
    case 'settings':
      return <Settings className={className} />;
    case 'shopping-bag':
      return <ShoppingBag className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'compass':
      return <Compass className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

export const WebPreviewRenderer: React.FC<WebPreviewRendererProps> = ({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onTriggerAction,
  onTriggerNavLink,
  onUpdateBlock,
  accentHex = '#4D97FF',
  pages,
  onSelectPage,
  pageStyle,
  runtimeState = INITIAL_RUNTIME_STATE,
  formInputs: controlledFormInputs,
  onFormInputChange,
  confirmDialog,
  onResolveConfirm,
  runningTimers = {},
  onToggleTimer,
  onDropAtStageIndex,
  onDismissSubmission,
}) => {
  const [apiResponses, setApiResponses] = useState<Record<string, string>>({});
  const [apiLoading, setApiLoading] = useState<Record<string, boolean>>({});
  const [storageOutputs, setStorageOutputs] = useState<Record<string, string>>({});
  const [dbDraftInputs, setDbDraftInputs] = useState<Record<string, string>>({});
  const [authDrafts, setAuthDrafts] = useState<
    Record<string, { email: string; password: string }>
  >({});
  const [deviceOutputs, setDeviceOutputs] = useState<Record<string, string>>({});
  const [cameraStreams, setCameraStreams] = useState<Record<string, MediaStream | null>>({});
  const [localFormInputs, setLocalFormInputs] = useState<Record<string, string>>({});
  const [uploadedPreviews, setUploadedPreviews] = useState<
    Record<string, { name: string; sizeKb: number; imageUrl?: string }>
  >({});
  const [sidebarActiveIdx, setSidebarActiveIdx] = useState<Record<string, number>>({});
  const [inlineEditBlockId, setInlineEditBlockId] = useState<string | null>(null);
  const [stageDropIdx, setStageDropIdx] = useState<number | null>(null);

  React.useEffect(() => {
    return () => {
      Object.values(cameraStreams).forEach((s) => {
        s?.getTracks().forEach((t) => t.stop());
      });
    };
  }, [cameraStreams]);

  const handleStageDragOver = (e: React.DragEvent, idx: number) => {
    if (!onDropAtStageIndex) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const insertIdx = e.clientY < rect.top + rect.height / 2 ? idx : idx + 1;
    if (stageDropIdx !== insertIdx) setStageDropIdx(insertIdx);
  };

  const handleStageDropPayload = async (e: React.DragEvent, fallbackIdx: number) => {
    if (!onDropAtStageIndex) return;
    e.preventDefault();
    e.stopPropagation();
    const targetIdx = stageDropIdx !== null ? stageDropIdx : fallbackIdx;
    setStageDropIdx(null);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const dataUrl = await readAndCompressImageFile(file);
        onDropAtStageIndex({ imageDataUrl: dataUrl, fileName: file.name }, targetIdx);
      } catch {
        // ignore invalid file
      }
      return;
    }

    const moveBlockId = e.dataTransfer.getData('application/x-slbuilder-move-id');
    const tplId = e.dataTransfer.getData('application/x-slbuilder-tpl-id');
    const blockType = e.dataTransfer.getData('application/x-slbuilder-type');
    if (moveBlockId || tplId || blockType) {
      onDropAtStageIndex({ moveBlockId, tplId, blockType }, targetIdx);
    }
  };

  const formInputs = controlledFormInputs ?? localFormInputs;
  const setFormInput = (blockId: string, value: string, fireInputEvent = true) => {
    if (onFormInputChange) {
      onFormInputChange(blockId, value, fireInputEvent);
    } else {
      setLocalFormInputs((prev) => ({ ...prev, [blockId]: value }));
    }
  };

  const pageBgCss = resolvePageBackgroundCss(pageStyle);
  const isLightPage = isLightPageBackground(pageStyle);
  const pageTextColor = pageStyle?.textColor || (isLightPage ? '#0f172a' : '#f1f5f9');
  const resolvedAccent = pageStyle?.accentColor || accentHex;

  if (blocks.length === 0) {
    return (
      <div
        onDragOver={(e) => {
          if (!onDropAtStageIndex) return;
          e.preventDefault();
          setStageDropIdx(0);
        }}
        onDragLeave={() => setStageDropIdx(null)}
        onDrop={(e) => handleStageDropPayload(e, 0)}
        className={`relative h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 overflow-hidden transition-all ${
          stageDropIdx === 0 ? 'ring-2 ring-inset ring-[#4D97FF] bg-[#4D97FF]/10' : ''
        }`}
        style={{ background: pageBgCss, color: pageTextColor }}
      >
        <LiveBackgroundLayer pageStyle={pageStyle} />
        <div className="relative z-10">
          <p className="text-xs font-semibold">
            {stageDropIdx === 0 ? 'Release to place block here' : 'Empty Web Page'}
          </p>
          <p className="text-[11px] opacity-70 mt-1 max-w-xs">
            Click or drag any block from the HTML toolbox — or drop a photo directly here.
          </p>
        </div>
      </div>
    );
  }

  const inlineEditBlock = inlineEditBlockId
    ? blocks.find((b) => b.id === inlineEditBlockId) || null
    : null;
  const supportsOptionsList = (tp: CanvasBlock['type'], variant?: string) =>
    tp === 'ui-sidebar' ||
    tp === 'ui-tabbar' ||
    tp === 'ui-row' ||
    tp === 'ui-column' ||
    tp === 'ui-grid' ||
    tp === 'ui-select' ||
    (tp === 'ui-checkbox' && variant === 'radio');

  return (
    <div
      onDragOver={(e) => {
        if (!onDropAtStageIndex) return;
        e.preventDefault();
        if (stageDropIdx === null) setStageDropIdx(blocks.length);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setStageDropIdx(null);
        }
      }}
      onDrop={(e) => handleStageDropPayload(e, blocks.length)}
      className="relative min-h-full flex flex-col overflow-hidden"
      style={{ background: pageBgCss, color: pageTextColor }}
    >
      <LiveBackgroundLayer pageStyle={pageStyle} />
      <div className="relative z-10 min-h-full flex flex-col flex-1">
        {blocks.map((block, blockIdx) => {
          const isSelected = block.id === selectedBlockId;
          const isEdgeToEdge = block.type === 'ui-navbar' || block.type === 'ui-footer';
          const isCssHidden = Boolean(block.style?.isHidden);
          const isRuntimeHidden = Boolean(runtimeState.hiddenBlocks?.[block.id]);
          if (isRuntimeHidden) {
            return null;
          }
          const isHidden = isCssHidden;
          const isDisabled = Boolean(
            block.isDisabled || runtimeState.disabledBlocks?.[block.id]
          );
          const displayContent = runtimeState.textOverrides?.[block.id] ?? block.content;
          const extraClasses = [
            block.style?.customClass || '',
            ...(runtimeState.extraClasses?.[block.id] || []),
          ]
            .filter(Boolean)
            .join(' ');

          const alignClass =
            block.style?.textAlign === 'center'
              ? 'text-center'
              : block.style?.textAlign === 'right'
              ? 'text-right'
              : 'text-left';

          const customTextColor =
            !block.style?.customTextHex && block.style?.textColor
              ? TEXT_COLOR_MAP[block.style.textColor] || ''
              : '';
          const customBg =
            !block.style?.customBgHex && block.style?.bgColor
              ? BG_COLOR_MAP[block.style.bgColor] || ''
              : '';
          const customRadius = block.style?.borderRadius
            ? RADIUS_MAP[block.style.borderRadius] || 'rounded-xl'
            : 'rounded-xl';
          const customPad = block.style?.padding ? PADDING_MAP[block.style.padding] || '' : '';
          const customFont = block.style?.fontSize ? FONT_SIZE_MAP[block.style.fontSize] || '' : '';
          const customWeight = block.style?.fontWeight
            ? FONT_WEIGHT_MAP[block.style.fontWeight] || ''
            : '';
          const fontFamilyValue = block.style?.fontFamily
            ? FONT_FAMILY_CSS[block.style.fontFamily]
            : undefined;

          const layoutBoxStyle: React.CSSProperties = {
            ...(block.style?.width && block.style.width !== 'auto'
              ? { width: block.style.width, marginLeft: 'auto', marginRight: 'auto' }
              : {}),
            ...(block.style?.height && block.style.height !== 'auto'
              ? { minHeight: block.style.height }
              : {}),
            ...(block.style?.margin ? { margin: block.style.margin } : {}),
          };

          const primaryStyle: React.CSSProperties = {
            ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
            ...(block.style?.customTextHex ? { color: block.style.customTextHex } : {}),
            ...(block.style?.textShadow ? { textShadow: block.style.textShadow } : {}),
            ...(block.style?.textStroke ? { WebkitTextStroke: block.style.textStroke } : {}),
            ...(block.style?.textGradient
              ? {
                  backgroundImage: block.style.textGradient,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                }
              : {}),
          };

          const subtitleStyle: React.CSSProperties = {
            ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
            ...(block.style?.subtitleColorHex ? { color: block.style.subtitleColorHex } : {}),
          };

          const surfaceStyle: React.CSSProperties = {
            ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
            ...(block.style?.customBgHex && !block.style?.bgGradient
              ? { backgroundColor: block.style.customBgHex }
              : {}),
            ...(block.style?.bgGradient ? { background: block.style.bgGradient } : {}),
            ...(block.style?.borderColor ? { borderColor: block.style.borderColor } : {}),
            ...(block.style?.boxShadow ? { boxShadow: block.style.boxShadow } : {}),
            ...(runtimeState.styleOverrides?.[block.id] || {}),
          };

          const hasExplicitBg = Boolean(
            block.style?.customBgHex ||
              block.style?.bgGradient ||
              (customBg && customBg !== 'bg-transparent') ||
              runtimeState.styleOverrides?.[block.id]?.backgroundColor
          );

          const wrapperClass = `relative transition-all cursor-pointer ${
            block.type === 'ui-footer' ? 'mt-auto w-full' : 'w-full'
          } ${
            isEdgeToEdge
              ? isSelected
                ? 'ring-2 ring-inset ring-[#4D97FF]'
                : 'hover:ring-1 hover:ring-inset hover:ring-white/20'
              : `${customRadius} ${
                  isSelected
                    ? 'ring-2 ring-inset ring-[#4D97FF]'
                    : 'hover:bg-white/[0.015]'
                }`
          } ${isHidden ? 'opacity-40' : ''} ${extraClasses}`;

          const effectiveNavLinks =
            block.type === 'ui-navbar' ? getEffectiveNavLinks(block, pages, blocks) : [];

          const parsedOptions = parseOptionsList(block.content, block.options);

          return (
            <React.Fragment key={block.id}>
              {stageDropIdx === blockIdx && (
                <div className="mx-4 my-1 h-1.5 rounded-full bg-[#4D97FF] shadow-[0_0_12px_rgba(77,151,255,0.85)] relative flex items-center justify-center">
                  <span className="px-2 py-0.5 rounded bg-[#4D97FF] text-white text-[9px] font-bold uppercase tracking-wider shadow">
                    Drop Block Here
                  </span>
                </div>
              )}
              <div
                id={`sl-el-${block.id}`}
                style={layoutBoxStyle}
                draggable={Boolean(onDropAtStageIndex)}
                onDragStart={(e) => {
                  const targetTag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
                  if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
                    e.preventDefault();
                    return;
                  }
                  e.stopPropagation();
                  e.dataTransfer.setData('application/x-slbuilder-move-id', block.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => handleStageDragOver(e, blockIdx)}
                onDrop={(e) => handleStageDropPayload(e, blockIdx)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBlock(block.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onSelectBlock(block.id);
                  setInlineEditBlockId(block.id);
                }}
                className={wrapperClass}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 z-30 flex items-center gap-1">
                    {onDropAtStageIndex && (
                      <span
                        title="Drag block to reorder"
                        className="px-1 py-0.5 rounded bg-[#1E2B45]/90 text-slate-300 border border-white/15 cursor-grab active:cursor-grabbing flex items-center shadow-md"
                      >
                        <GripVertical className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInlineEditBlockId(block.id);
                      }}
                      title="Edit all text & media on this block"
                      className="px-1.5 py-0.5 rounded bg-[#1E2B45]/90 hover:bg-[#2563EB] text-white border border-sky-400/40 text-[9px] font-semibold flex items-center gap-1 shadow-md cursor-pointer"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                )}
              {isHidden && (
                <div className="mx-5 mt-1 px-2.5 py-1 rounded-md border border-dashed border-slate-400/50 bg-slate-900/60 text-[10px] font-mono text-slate-300 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <EyeOff className="w-3 h-3 text-slate-400" />
                    Hidden Element: {block.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateBlock({
                        ...block,
                        style: { ...block.style, isHidden: false },
                      });
                    }}
                    className="text-sky-300 hover:underline cursor-pointer"
                  >
                    Unhide
                  </button>
                </div>
              )}

              {/* 1. NAVBAR */}
              {block.type === 'ui-navbar' && (
                <header
                  style={surfaceStyle}
                  className={`w-full ${customPad || 'px-5 py-3'} ${
                    customBg ||
                    (isLightPage
                      ? 'bg-white/85 border-slate-200'
                      : 'bg-[#0D111A]/85 border-white/10')
                  } border-b backdrop-blur-md flex items-center justify-between gap-3`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="px-1.5 min-w-[22px] h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: resolvedAccent }}
                    >
                      {block.badgeText || 'SL'}
                    </div>
                    <span
                      style={primaryStyle}
                      className={`${customFont || 'text-sm'} ${customWeight || 'font-bold'} ${
                        customTextColor || (isLightPage ? 'text-slate-900' : 'text-white')
                      } truncate`}
                    >
                      {displayContent}
                    </span>
                  </div>
                  <nav className="flex items-center gap-3 overflow-x-auto">
                    {effectiveNavLinks.map((link) => (
                      <button
                        key={link.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onTriggerNavLink) {
                            onTriggerNavLink(block, link);
                          } else if (link.action === 'navigate-page' && link.targetPageId) {
                            onSelectPage?.(link.targetPageId);
                          }
                        }}
                        style={subtitleStyle}
                        className={`text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors hover:underline underline-offset-4 ${
                          isLightPage
                            ? 'text-slate-600 hover:text-slate-950'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {link.label}
                      </button>
                    ))}
                  </nav>
                </header>
              )}

              {/* 1b. SIDEBAR */}
              {block.type === 'ui-sidebar' && (
                <div className="px-5 py-1.5">
                  <aside
                    style={surfaceStyle}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 space-y-2`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-white/10 pb-2">
                      <PanelLeft className="w-3.5 h-3.5 text-sky-400" />
                      <span style={primaryStyle}>{displayContent}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {(parsedOptions.length > 0
                        ? parsedOptions
                        : ['Dashboard', 'Projects', 'Settings']
                      ).map((item, idx) => {
                        const active = (sidebarActiveIdx[block.id] ?? 0) === idx;
                        return (
                          <button
                            key={`${item}_${idx}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSidebarActiveIdx((prev) => ({ ...prev, [block.id]: idx }));
                              onTriggerAction(block, { ...formInputs, [block.id]: item });
                            }}
                            className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-between cursor-pointer transition-colors ${
                              active
                                ? 'bg-indigo-600/30 text-white border border-indigo-400/40'
                                : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <span>{item}</span>
                            {active && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </aside>
                </div>
              )}

              {/* 1c. TAB BAR */}
              {block.type === 'ui-tabbar' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 space-y-2.5`}
                  >
                    <div className="flex items-center gap-1 bg-[#090B10] p-1 rounded-lg border border-white/10 overflow-x-auto">
                      {(parsedOptions.length > 0 ? parsedOptions : ['Tab 1', 'Tab 2', 'Tab 3']).map(
                        (tabLabel, idx) => {
                          const isTabActive = (block.counterValue ?? 0) === idx;
                          return (
                            <button
                              key={`${tabLabel}_${idx}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateBlock({ ...block, counterValue: idx });
                              }}
                              className={`flex-1 min-w-[70px] py-1.5 px-2.5 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                                isTabActive
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {tabLabel}
                            </button>
                          );
                        }
                      )}
                    </div>
                    <div className="px-2 py-1 text-[11px] text-slate-300" style={subtitleStyle}>
                      <span className="font-semibold text-sky-300">
                        {parsedOptions[block.counterValue ?? 0] || 'Tab 1'}:
                      </span>{' '}
                      {(() => {
                        const panels = (block.subtitle || '')
                          .split('|')
                          .map((s) => s.trim())
                          .filter(Boolean);
                        if (panels.length > 1) {
                          return panels[block.counterValue ?? 0] || panels[0];
                        }
                        return block.subtitle || 'Active tab panel content ready for customization.';
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* 1d. LINK */}
              {block.type === 'ui-link' && (
                <div className={`px-5 py-1.5 ${alignClass}`}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTriggerAction(block, formInputs);
                    }}
                    style={primaryStyle}
                    className={`inline-flex items-center gap-1.5 ${customFont || 'text-xs'} ${
                      customWeight || 'font-semibold'
                    } ${customTextColor || 'text-indigo-400'} hover:underline underline-offset-4 cursor-pointer`}
                  >
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{displayContent}</span>
                  </button>
                </div>
              )}

              {/* 1e. SECTION CONTAINER */}
              {block.type === 'ui-section' && (
                <div className="px-5 py-2">
                  <section
                    style={surfaceStyle}
                    className={`${customPad || 'p-5'} ${customRadius} ${
                      customBg || 'bg-white/[0.03]'
                    } border border-dashed border-white/15 ${alignClass} space-y-1.5`}
                  >
                    {(block.badgeText === undefined || block.badgeText !== '') && (
                      <span className="text-[9px] font-mono uppercase tracking-widest text-sky-400 block">
                        {block.badgeText || 'Section Container'}
                      </span>
                    )}
                    <h3
                      style={primaryStyle}
                      className={`${customFont || 'text-sm'} ${customWeight || 'font-bold'} ${
                        customTextColor || 'text-white'
                      }`}
                    >
                      {displayContent}
                    </h3>
                    {block.subtitle && (
                      <p style={subtitleStyle} className="text-[11px] text-slate-400">
                        {block.subtitle}
                      </p>
                    )}
                  </section>
                </div>
              )}

              {/* 1f. ROW HORIZONTAL */}
              {block.type === 'ui-row' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 space-y-2`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-sky-400">
                      <Columns3 className="w-3 h-3" />
                      <span style={subtitleStyle}>
                        {block.subtitle || `Flex Row (${parsedOptions.length || 3} items)`}
                      </span>
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2">
                      {(parsedOptions.length > 0 ? parsedOptions : ['Col A', 'Col B', 'Col C']).map(
                        (item, idx) => (
                          <div
                            key={`${item}_${idx}`}
                            style={primaryStyle}
                            className={`flex-1 min-w-[80px] p-2.5 rounded-lg bg-[#090B10] border border-white/10 text-[11px] font-semibold ${
                              customTextColor || 'text-white'
                            } text-center`}
                          >
                            {item}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 1g. COLUMN VERTICAL */}
              {block.type === 'ui-column' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 space-y-2`}
                  >
                    <div style={subtitleStyle} className="text-[10px] font-mono text-sky-400">
                      {block.subtitle || 'Vertical Column Stack'}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {(parsedOptions.length > 0
                        ? parsedOptions
                        : ['Row Item 1', 'Row Item 2', 'Row Item 3']
                      ).map((item, idx) => (
                        <div
                          key={`${item}_${idx}`}
                          style={primaryStyle}
                          className={`w-full px-3 py-2 rounded-lg bg-[#090B10] border border-white/10 text-[11px] ${
                            customTextColor || 'text-slate-200'
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 1h. RESPONSIVE GRID */}
              {block.type === 'ui-grid' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 space-y-2`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-sky-400">
                      <span style={subtitleStyle} className="flex items-center gap-1">
                        <LayoutGrid className="w-3 h-3" />
                        {block.subtitle || `Grid (${block.gridColumns === 3 ? '3 Columns' : '2 Columns'})`}
                      </span>
                    </div>
                    <div
                      className={`grid gap-2 ${
                        block.gridColumns === 3 ? 'grid-cols-3' : 'grid-cols-2'
                      }`}
                    >
                      {(parsedOptions.length > 0
                        ? parsedOptions
                        : ['Grid Card 1', 'Grid Card 2', 'Grid Card 3', 'Grid Card 4']
                      ).map((cell, idx) => (
                        <div
                          key={`${cell}_${idx}`}
                          style={primaryStyle}
                          className={`p-2.5 rounded-lg bg-[#090B10] border border-white/10 text-[11px] font-semibold ${
                            customTextColor || 'text-white'
                          }`}
                        >
                          {cell}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 1i. MODAL / DRAWER */}
              {block.type === 'ui-modal' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-indigo-950/35'
                    } border border-indigo-400/30 flex items-center justify-between gap-2`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{displayContent}</p>
                      <p className="text-[10px] text-indigo-300 truncate">
                        Modal State:{' '}
                        {(runtimeState.openModals?.[block.id] ?? block.isExpanded)
                          ? 'OPEN'
                          : 'CLOSED'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerAction(
                          {
                            ...block,
                            action:
                              (runtimeState.openModals?.[block.id] ?? block.isExpanded)
                                ? 'close-modal'
                                : 'open-modal',
                            targetId: block.id,
                          },
                          formInputs
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold cursor-pointer shrink-0"
                    >
                      {(runtimeState.openModals?.[block.id] ?? block.isExpanded)
                        ? 'Close Modal'
                        : block.badgeText || 'Open Dialog'}
                    </button>
                  </div>

                  {(runtimeState.openModals?.[block.id] ?? block.isExpanded) && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 p-4 rounded-xl bg-[#111827] border border-indigo-400/50 shadow-2xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">{displayContent}</h4>
                        <button
                          type="button"
                          onClick={() =>
                            onTriggerAction(
                              { ...block, action: 'close-modal', targetId: block.id },
                              formInputs
                            )
                          }
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {block.subtitle || 'Interactive modal content dialog.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 2. HEADING / HERO */}
              {block.type === 'ui-heading' && (
                <section
                  style={surfaceStyle}
                  className={`${customPad || 'px-5 py-7'} ${
                    hasExplicitBg && customBg !== 'bg-white/[0.04]'
                      ? `${customBg} mx-4 my-2 ${customRadius} border border-white/10`
                      : ''
                  } space-y-2 ${alignClass}`}
                >
                  <h1
                    style={primaryStyle}
                    className={`${customFont || 'text-2xl'} ${
                      customWeight || 'font-extrabold'
                    } tracking-tight ${
                      customTextColor || (isLightPage ? 'text-slate-900' : 'text-white')
                    } leading-tight`}
                  >
                    {displayContent}
                  </h1>
                  {block.subtitle && (
                    <p
                      style={subtitleStyle}
                      className={`text-xs leading-relaxed max-w-2xl mx-auto ${
                        isLightPage ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      {block.subtitle}
                    </p>
                  )}
                </section>
              )}

              {/* 3. PARAGRAPH */}
              {block.type === 'ui-paragraph' && (
                <section className="px-5 py-2.5">
                  <div
                    style={surfaceStyle}
                    className={`${
                      hasExplicitBg
                        ? `${customPad || 'p-4'} ${customRadius} ${customBg} border ${
                            isLightPage ? 'border-slate-200' : 'border-white/10'
                          }`
                        : customPad || 'py-1'
                    } ${alignClass} space-y-1`}
                  >
                    <p
                      style={primaryStyle}
                      className={`${customFont || 'text-sm'} ${customWeight || 'font-normal'} ${
                        customTextColor || (isLightPage ? 'text-slate-700' : 'text-slate-200')
                      } leading-relaxed`}
                    >
                      {displayContent}
                    </p>
                    {block.subtitle && (
                      <p
                        style={subtitleStyle}
                        className={`text-xs ${isLightPage ? 'text-slate-500' : 'text-slate-400'}`}
                      >
                        {block.subtitle}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* 4. BADGE / KICKER */}
              {block.type === 'ui-badge' && (
                <div style={surfaceStyle} className={`px-5 pt-4 pb-1 ${customBg} ${alignClass}`}>
                  <span
                    style={primaryStyle}
                    className={`${customFont || 'text-[11px]'} ${
                      customWeight || 'font-semibold'
                    } font-mono uppercase ${customTextColor || 'text-indigo-400'} tracking-widest`}
                  >
                    {displayContent}
                  </span>
                </div>
              )}

              {/* 5. KPI STAT */}
              {block.type === 'ui-stat' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 ${alignClass}`}
                  >
                    <div style={subtitleStyle} className="text-[10px] font-mono text-slate-400">
                      {block.statLabel ?? block.subtitle ?? block.name}
                    </div>
                    <div
                      style={primaryStyle}
                      className={`${customFont || 'text-xl'} ${customWeight || 'font-extrabold'} ${
                        customTextColor || 'text-white'
                      } tabular-nums mt-0.5`}
                    >
                      {runtimeState.textOverrides?.[block.id] ?? block.statValue ?? block.content}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. CARD */}
              {block.type === 'ui-card' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 space-y-1 ${alignClass}`}
                  >
                    <h3
                      style={primaryStyle}
                      className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                        customTextColor || 'text-white'
                      }`}
                    >
                      {displayContent}
                    </h3>
                    {block.subtitle && (
                      <p style={subtitleStyle} className="text-[11px] text-slate-400 leading-relaxed">
                        {block.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 7. PRICING */}
              {block.type === 'ui-pricing' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-4'} ${customRadius} ${
                      customBg || 'bg-gradient-to-br from-indigo-950/50 to-slate-900'
                    } border border-indigo-500/25 space-y-2 ${alignClass}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        style={primaryStyle}
                        className={`${customFont || 'text-sm'} ${customWeight || 'font-bold'} ${
                          customTextColor || 'text-white'
                        }`}
                      >
                        {displayContent}
                      </h3>
                      <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                        {block.badgeText || 'PRO'}
                      </span>
                    </div>
                    {block.subtitle && (
                      <p style={subtitleStyle} className="text-xs text-slate-300">
                        {block.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 8. TESTIMONIAL */}
              {block.type === 'ui-testimonial' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 space-y-2 ${alignClass}`}
                  >
                    <p
                      style={primaryStyle}
                      className={`${customFont || 'text-xs'} ${customWeight || 'font-normal'} ${
                        customTextColor || 'text-slate-200'
                      } italic leading-relaxed`}
                    >
                      &ldquo;{displayContent}&rdquo;
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p
                          style={subtitleStyle}
                          className="text-[11px] font-bold text-white truncate"
                        >
                          {block.subtitle || 'Verified Engineer'}
                        </p>
                        {block.authorRole && (
                          <p className="text-[10px] text-slate-400 truncate">{block.authorRole}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. ACCORDION */}
              {block.type === 'ui-accordion' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 overflow-hidden`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBlock(block.id);
                        onUpdateBlock({ ...block, isExpanded: !block.isExpanded });
                      }}
                      className={`w-full ${customPad || 'p-3'} text-left flex items-center justify-between gap-2 ${
                        customFont || 'text-xs'
                      } ${customWeight || 'font-semibold'} ${
                        customTextColor || 'text-white'
                      } cursor-pointer`}
                      style={primaryStyle}
                    >
                      <span>{displayContent}</span>
                      {block.isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {block.isExpanded && block.subtitle && (
                      <div
                        style={subtitleStyle}
                        className="px-3 pb-3 text-[11px] text-slate-400 leading-relaxed border-t border-white/5 pt-2"
                      >
                        {block.subtitle}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 10. BUTTON */}
              {block.type === 'ui-button' && (
                <div className={`px-5 py-2 ${alignClass}`}>
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBlock(block.id);
                      if (!isDisabled) {
                        onTriggerAction(block, formInputs);
                      }
                    }}
                    style={{
                      ...(block.buttonVariant === 'primary' &&
                      !block.style?.customBgHex &&
                      !block.style?.bgGradient &&
                      (!customBg || customBg === 'bg-indigo-600')
                        ? { backgroundColor: resolvedAccent }
                        : {}),
                      ...(block.style?.customBgHex && !block.style?.bgGradient
                        ? { backgroundColor: block.style.customBgHex }
                        : {}),
                      ...(block.style?.bgGradient ? { background: block.style.bgGradient } : {}),
                      ...(block.style?.borderColor
                        ? {
                            borderColor: block.style.borderColor,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                          }
                        : {}),
                      ...(block.style?.boxShadow ? { boxShadow: block.style.boxShadow } : {}),
                      ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
                      ...(block.style?.customTextHex && !block.style?.textGradient
                        ? { color: block.style.customTextHex }
                        : {}),
                    }}
                    className={`px-5 py-2 ${customRadius} ${customFont || 'text-xs'} ${
                      customWeight || 'font-semibold'
                    } inline-flex items-center gap-1.5 shadow-md transition-transform ${
                      isDisabled
                        ? 'opacity-45 cursor-not-allowed'
                        : 'active:scale-95 cursor-pointer'
                    } ${
                      block.buttonVariant === 'outline' && !block.style?.bgGradient
                        ? `border border-white/25 bg-transparent ${customTextColor || 'text-white'} hover:bg-white/10`
                        : block.buttonVariant === 'danger' && !block.style?.bgGradient
                        ? `bg-rose-600 hover:bg-rose-500 ${customTextColor || 'text-white'}`
                        : `${customBg || ''} ${customTextColor || 'text-white'} hover:opacity-95`
                    }`}
                  >
                    {!(displayContent || '').trim().startsWith('⚡') && (
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span style={primaryStyle}>{displayContent}</span>
                  </button>
                </div>
              )}

              {/* 11. INPUT & TEXTAREA */}
              {(block.type === 'ui-input' || block.type === 'ui-textarea') && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 space-y-1.5 ${alignClass}`}
                  >
                    {block.subtitle && (
                      <label
                        style={subtitleStyle}
                        className="block text-[10px] font-semibold text-slate-400"
                      >
                        {block.subtitle}
                      </label>
                    )}
                    {block.type === 'ui-textarea' ? (
                      <textarea
                        rows={2}
                        disabled={isDisabled}
                        value={formInputs[block.id] ?? ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setFormInput(block.id, e.target.value, true)}
                        style={primaryStyle}
                        placeholder={block.content}
                        className={`w-full rounded-lg bg-[#0B0F17] border border-white/15 px-2.5 py-1.5 ${
                          customFont || 'text-xs'
                        } ${customTextColor || 'text-white'} placeholder-slate-500 outline-none focus:border-[#4D97FF]`}
                      />
                    ) : (
                      <input
                        type={block.inputType || 'text'}
                        disabled={isDisabled}
                        value={formInputs[block.id] ?? ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setFormInput(block.id, e.target.value, true)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const hasCustomKeyHat = blocks.some(
                              (b) => b.type === 'logic-onkey' && (b.triggerKey || 'Enter') === 'Enter'
                            );
                            if (!hasCustomKeyHat) {
                              const submitBtn = blocks.find(
                                (b) => b.type === 'ui-button' && b.action === 'submit-form'
                              );
                              if (submitBtn) {
                                e.preventDefault();
                                onTriggerAction(submitBtn, formInputs);
                              }
                            }
                          }
                        }}
                        style={primaryStyle}
                        placeholder={block.content}
                        className={`w-full rounded-lg bg-[#0B0F17] border border-white/15 px-2.5 py-1.5 ${
                          customFont || 'text-xs'
                        } ${customTextColor || 'text-white'} placeholder-slate-500 outline-none focus:border-[#4D97FF]`}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* 11b. DROPDOWN / SELECT */}
              {block.type === 'ui-select' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 space-y-1.5 ${alignClass}`}
                  >
                    {block.subtitle && (
                      <label
                        style={subtitleStyle}
                        className="block text-[10px] font-semibold text-slate-400"
                      >
                        {block.subtitle}
                      </label>
                    )}
                    <select
                      value={formInputs[block.id] ?? (parsedOptions[0] || '')}
                      disabled={isDisabled}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setFormInput(block.id, e.target.value, true)}
                      className="w-full rounded-lg bg-[#0B0F17] border border-white/15 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#4D97FF] cursor-pointer"
                    >
                      {(parsedOptions.length > 0 ? parsedOptions : ['Option 1', 'Option 2']).map(
                        (opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* 11c. CHECKBOX / RADIO / SWITCH */}
              {block.type === 'ui-checkbox' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 space-y-2`}
                  >
                    {block.controlVariant === 'radio' ? (
                      <div className="space-y-1.5">
                        {block.subtitle && (
                          <p className="text-[10px] font-semibold text-slate-400">{block.subtitle}</p>
                        )}
                        {(parsedOptions.length > 0 ? parsedOptions : ['Choice A', 'Choice B']).map(
                          (choice) => {
                            const selected = (formInputs[block.id] || parsedOptions[0]) === choice;
                            return (
                              <label
                                key={choice}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={`radio-${block.id}`}
                                  checked={selected}
                                  onChange={() => setFormInput(block.id, choice, true)}
                                  className="accent-indigo-500"
                                />
                                <span>{choice}</span>
                              </label>
                            );
                          }
                        )}
                      </div>
                    ) : block.controlVariant === 'switch' ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p style={primaryStyle} className="text-xs font-semibold text-white truncate">
                            {displayContent}
                          </p>
                          {block.subtitle && (
                            <p className="text-[10px] text-slate-400 truncate">{block.subtitle}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextState = !block.isExpanded;
                            onUpdateBlock({ ...block, isExpanded: nextState });
                            setFormInput(block.id, String(nextState), true);
                          }}
                          className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                            block.isExpanded ? 'bg-indigo-500' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              block.isExpanded ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ) : (
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(block.isExpanded)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            onUpdateBlock({ ...block, isExpanded: checked });
                            setFormInput(block.id, String(checked), true);
                          }}
                          className="w-4 h-4 accent-indigo-500 rounded"
                        />
                        <div className="min-w-0">
                          <p style={primaryStyle} className="font-medium text-white">
                            {displayContent}
                          </p>
                          {block.subtitle && (
                            <p className="text-[10px] text-slate-400">{block.subtitle}</p>
                          )}
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* 11d. FILE / IMAGE UPLOADER */}
              {block.type === 'ui-file-upload' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-dashed border-white/20 space-y-2 text-center`}
                  >
                    {block.subtitle && (
                      <p className="text-[10px] font-semibold text-slate-400">{block.subtitle}</p>
                    )}
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-col items-center justify-center gap-1.5 py-2 cursor-pointer hover:text-sky-300 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-fuchsia-400" />
                      <span className="text-xs font-semibold text-white">{displayContent}</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const isImg = f.type.startsWith('image/');
                          const imgUrl = isImg ? URL.createObjectURL(f) : undefined;
                          setUploadedPreviews((prev) => ({
                            ...prev,
                            [block.id]: {
                              name: f.name,
                              sizeKb: Math.max(1, Math.round(f.size / 1024)),
                              imageUrl: imgUrl,
                            },
                          }));
                          setFormInput(block.id, f.name, true);
                        }}
                      />
                    </label>
                    {uploadedPreviews[block.id] && (
                      <div className="p-2 rounded-lg bg-[#090B10] border border-white/10 text-[10px] text-emerald-300 space-y-1.5">
                        {uploadedPreviews[block.id].imageUrl && (
                          <img
                            src={uploadedPreviews[block.id].imageUrl}
                            alt={uploadedPreviews[block.id].name}
                            className="w-full max-h-28 object-cover rounded"
                          />
                        )}
                        <div className="font-mono truncate">
                          Uploaded: {uploadedPreviews[block.id].name} (
                          {uploadedPreviews[block.id].sizeKb} KB)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 12. MEDIA IMAGE / ICON / VIDEO / AVATAR */}
              {block.type === 'ui-image' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    onDragOver={(e) => {
                      if (e.dataTransfer.types.includes('Files')) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    onDrop={async (e) => {
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          const dataUrl = await readAndCompressImageFile(file);
                          onUpdateBlock({ ...block, imageUrl: dataUrl });
                        } catch {
                          // ignore invalid file
                        }
                      }
                    }}
                    className={`${customPad || 'p-4'} ${customRadius} ${
                      customBg || 'bg-gradient-to-br from-slate-900 to-[#111827]'
                    } border border-white/10 flex flex-col items-center justify-center ${alignClass} gap-2 min-h-[115px] overflow-hidden relative group`}
                  >
                    {block.imageUrl ? (
                      <div className="relative w-full">
                        <img
                          src={block.imageUrl}
                          alt={block.content}
                          className="w-full max-h-52 object-cover rounded-lg"
                        />
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-indigo-600 text-white text-[10px] font-semibold border border-white/20 flex items-center gap-1 cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Change Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const dataUrl = await readAndCompressImageFile(file);
                                onUpdateBlock({ ...block, imageUrl: dataUrl });
                              } catch {
                                // ignore invalid image
                              }
                            }}
                          />
                        </label>
                      </div>
                    ) : (
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-4 rounded-xl border border-dashed border-sky-400/35 hover:border-sky-400/70 bg-sky-500/5 hover:bg-sky-500/10 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <ImageIcon className="w-6 h-6 text-sky-400" />
                        <span className="text-[11px] font-semibold text-sky-300">
                          Click or Drop Photo Here
                        </span>
                        <span className="text-[9px] text-slate-400">PNG, JPG, WEBP, GIF</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const dataUrl = await readAndCompressImageFile(file);
                              onUpdateBlock({ ...block, imageUrl: dataUrl });
                            } catch {
                              // ignore invalid image
                            }
                          }}
                        />
                      </label>
                    )}
                    <p
                      style={primaryStyle}
                      className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                        customTextColor || 'text-white'
                      }`}
                    >
                      {displayContent}
                    </p>
                    {block.subtitle && (
                      <p style={subtitleStyle} className="text-[10px] text-slate-400">
                        {block.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {block.type === 'ui-icon' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 flex flex-col items-center justify-center ${alignClass} gap-1.5`}
                  >
                    <div
                      style={primaryStyle}
                      className={`w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center ${
                        customTextColor || 'text-sky-400'
                      }`}
                    >
                      {renderVectorIcon(block.iconName, 'w-5 h-5')}
                    </div>
                    <p className="text-xs font-bold text-white">{displayContent}</p>
                    {block.subtitle && (
                      <p className="text-[10px] text-slate-400">{block.subtitle}</p>
                    )}
                  </div>
                </div>
              )}

              {block.type === 'ui-video' && (() => {
                const parsedVid = parseVideoUrl(block.videoUrl);
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 space-y-2`}
                    >
                      {parsedVid.kind === 'youtube' || parsedVid.kind === 'vimeo' ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-white/10"
                        >
                          <iframe
                            src={parsedVid.embedUrl}
                            title={displayContent}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        </div>
                      ) : parsedVid.kind === 'direct' ? (
                        <video
                          controls
                          playsInline
                          src={parsedVid.embedUrl}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full max-h-48 rounded-lg bg-black border border-white/10"
                        />
                      ) : (
                        <div className="h-28 rounded-lg bg-[#090B10] border border-dashed border-sky-400/30 flex flex-col items-center justify-center text-sky-400 gap-1.5 text-xs">
                          <Video className="w-5 h-5" />
                          <span>Paste a YouTube link or MP4 video URL</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{displayContent}</p>
                          {block.subtitle && (
                            <p className="text-[10px] text-slate-400 truncate">{block.subtitle}</p>
                          )}
                        </div>
                        {parsedVid.kind !== 'empty' && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 shrink-0">
                            {parsedVid.kind}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="pt-1 flex items-center gap-1.5"
                        >
                          <input
                            type="text"
                            value={block.videoUrl || ''}
                            onChange={(e) =>
                              onUpdateBlock({ ...block, videoUrl: e.target.value })
                            }
                            placeholder="Paste YouTube URL (youtube.com/watch?v=... / youtu.be/...) or MP4 URL"
                            className="flex-1 px-2.5 py-1 rounded-lg bg-[#090B10] border border-sky-400/35 text-[11px] text-sky-100 placeholder-slate-500 outline-none focus:border-sky-400"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-avatar' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 flex items-center gap-3`}
                  >
                    <label
                      onClick={(e) => e.stopPropagation()}
                      title="Upload profile photo"
                      className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-sky-400"
                    >
                      {block.imageUrl ? (
                        <img
                          src={block.imageUrl}
                          alt={displayContent}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const dataUrl = await readAndCompressImageFile(file, 480, 0.85);
                            onUpdateBlock({ ...block, imageUrl: dataUrl });
                          } catch {
                            // ignore
                          }
                        }}
                      />
                    </label>
                    <div className="min-w-0 flex-1">
                      <p
                        style={primaryStyle}
                        className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                          customTextColor || 'text-white'
                        } truncate`}
                      >
                        {displayContent}
                      </p>
                      {block.subtitle && (
                        <p style={subtitleStyle} className="text-[10px] text-slate-400 truncate">
                          {block.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 13. LOGIC COUNTER */}
              {block.type === 'logic-counter' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-4'} ${customRadius} ${
                      customBg || 'bg-indigo-950/35'
                    } border border-indigo-500/30 flex items-center justify-between gap-3`}
                  >
                    <div>
                      <div
                        style={subtitleStyle}
                        className="text-[10px] font-mono text-indigo-300 font-semibold"
                      >
                        {displayContent || block.name}
                      </div>
                      <div
                        style={primaryStyle}
                        className={`${customFont || 'text-xl'} ${customWeight || 'font-extrabold'} ${
                          customTextColor || 'text-white'
                        } font-mono tabular-nums`}
                      >
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
                </div>
              )}

              {/* 14. HAT EVENT BLOCKS */}
              {(block.type === 'logic-onload' ||
                block.type === 'logic-click' ||
                block.type === 'logic-oninput' ||
                block.type === 'logic-onsubmit' ||
                block.type === 'logic-onkey') && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3'} rounded-b-xl rounded-tr-xl rounded-tl-3xl border-t-4 border-t-amber-400 ${
                      customBg || 'bg-amber-950/25'
                    } border border-amber-500/30 flex items-center justify-between gap-2`}
                  >
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-amber-300 block">
                        {block.type === 'logic-onload'
                          ? 'HAT · ON PAGE LOAD'
                          : block.type === 'logic-oninput'
                          ? 'HAT · ON INPUT CHANGE'
                          : block.type === 'logic-onsubmit'
                          ? 'HAT · ON FORM SUBMIT'
                          : block.type === 'logic-onkey'
                          ? `HAT · ON KEY [${block.triggerKey || 'Enter'}]`
                          : 'HAT · ON CLICK TRIGGER'}
                      </span>
                      <p
                        style={primaryStyle}
                        className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                          customTextColor || 'text-white'
                        } truncate`}
                      >
                        {displayContent}
                      </p>
                      {block.subtitle && (
                        <p style={subtitleStyle} className="text-[10px] text-slate-400 truncate">
                          {block.subtitle}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerAction(block, formInputs);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold cursor-pointer shrink-0"
                    >
                      {block.badgeText || 'Fire'}
                    </button>
                  </div>
                </div>
              )}

              {/* 14b. LOGIC TOGGLE */}
              {block.type === 'logic-toggle' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3'} ${customRadius} ${
                      customBg || 'bg-amber-950/20'
                    } border border-amber-500/25 flex items-center justify-between gap-2`}
                  >
                    <div className="min-w-0">
                      <p
                        style={primaryStyle}
                        className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                          customTextColor || 'text-white'
                        } truncate`}
                      >
                        {displayContent}
                      </p>
                      <p style={subtitleStyle} className="text-[10px] text-amber-300">
                        {block.subtitle ? `${block.subtitle} · ` : ''}
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
                </div>
              )}

              {/* 14c. LOGIC TIMER */}
              {block.type === 'logic-timer' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3'} ${customRadius} ${
                      customBg || 'bg-amber-950/20'
                    } border border-amber-500/25 flex items-center justify-between gap-2`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <p
                          style={primaryStyle}
                          className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                            customTextColor || 'text-white'
                          } truncate`}
                        >
                          {displayContent}
                        </p>
                        <p style={subtitleStyle} className="text-[10px] font-mono text-amber-300 tabular-nums">
                          {block.counterValue ?? 10}s ·{' '}
                          {runningTimers[block.id] ? 'RUNNING' : 'PAUSED'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleTimer) {
                            onToggleTimer(block);
                          } else {
                            onUpdateBlock({
                              ...block,
                              counterValue: Math.max(0, (block.counterValue ?? 10) - 1),
                            });
                          }
                        }}
                        className="px-2 py-1 rounded bg-amber-500 text-slate-950 text-[10px] font-bold cursor-pointer"
                      >
                        {runningTimers[block.id] ? 'Pause' : 'Start'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateBlock({
                            ...block,
                            counterValue: block.logicConfig?.timerSeconds ?? 10,
                          });
                        }}
                        className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                        title="Reset Timer"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 14d. IF / ELSE CONDITION */}
              {block.type === 'logic-if' && (() => {
                const passed = evaluateLogicCondition(
                  block.logicConfig,
                  runtimeState.variables,
                  formInputs,
                  blocks
                );
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3'} ${customRadius} ${
                        customBg || 'bg-amber-950/20'
                      } border border-amber-500/30 space-y-1.5`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          IF [{block.logicConfig?.leftOperand || 'score'}{' '}
                          {block.logicConfig?.operator || '>='}{' '}
                          {block.logicConfig?.rightOperand || '10'}]
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                            passed
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {passed ? 'TRUE' : 'FALSE'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-200 truncate">
                          {passed
                            ? block.logicConfig?.thenMessage || 'Condition met!'
                            : block.logicConfig?.elseMessage || 'Condition false'}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTriggerAction(block, formInputs);
                          }}
                          className="px-2 py-1 rounded bg-amber-500 text-slate-950 text-[10px] font-bold cursor-pointer shrink-0"
                        >
                          {block.badgeText || 'Eval'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 14e. LOOP BLOCK */}
              {block.type === 'logic-loop' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3'} ${customRadius} ${
                      customBg || 'bg-amber-950/20'
                    } border border-amber-500/30 flex items-center justify-between gap-2`}
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                        <Repeat className="w-3 h-3" />
                        {(block.logicConfig?.loopMode || 'repeat').toUpperCase()} ·{' '}
                        {block.logicConfig?.loopMode === 'foreach'
                          ? `list[${block.logicConfig?.listName || 'tasks'}]`
                          : `${block.logicConfig?.repeatCount ?? 5}x`}
                      </span>
                      <p className="text-xs font-semibold text-white truncate">{displayContent}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerAction(block, formInputs);
                      }}
                      className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 text-[10px] font-bold cursor-pointer shrink-0"
                    >
                      Run Loop
                    </button>
                  </div>
                </div>
              )}

              {/* 14f. VARIABLE BLOCK */}
              {block.type === 'logic-variable' && (() => {
                const vName = block.logicConfig?.varName || 'score';
                const vCurrent = runtimeState.variables[vName];
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3'} ${customRadius} ${
                        customBg || 'bg-amber-950/20'
                      } border border-amber-500/30 flex items-center justify-between gap-2`}
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-amber-300 block">
                          VAR {vName} ({block.logicConfig?.varOp || 'set'})
                        </span>
                        <p className="text-xs font-mono font-bold text-white truncate">
                          {vName} = {JSON.stringify(vCurrent ?? 0)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTriggerAction(block, formInputs);
                        }}
                        className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 text-[10px] font-bold cursor-pointer shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 14g. LIST / ARRAY BLOCK */}
              {block.type === 'logic-list' && (() => {
                const lName = block.logicConfig?.listName || 'tasks';
                const items = runtimeState.lists[lName] || [];
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3'} ${customRadius} ${
                        customBg || 'bg-amber-950/20'
                      } border border-amber-500/30 space-y-2`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-amber-300 font-bold">
                          LIST [{lName}] · {items.length} items
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTriggerAction(block, formInputs);
                          }}
                          className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-bold cursor-pointer"
                        >
                          Run ({block.logicConfig?.listOp || 'add'})
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {items.map((it, idx) => (
                          <span
                            key={`${it}_${idx}`}
                            className="px-2 py-0.5 rounded bg-[#090B10] border border-white/10 text-[10px] font-mono text-slate-200"
                          >
                            [{idx}] {it}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 14h. OBJECT / JSON BLOCK */}
              {block.type === 'logic-object' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3'} ${customRadius} ${
                      customBg || 'bg-amber-950/20'
                    } border border-amber-500/30 flex items-center justify-between gap-2`}
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                        <Braces className="w-3 h-3" />
                        JSON ({block.logicConfig?.objectOp || 'get-prop'} · key:{' '}
                        {block.logicConfig?.objectKey || 'name'})
                      </span>
                      <p className="text-[11px] font-mono text-slate-200 truncate">
                        {block.logicConfig?.varValue || block.subtitle || '{}'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerAction(block, formInputs);
                      }}
                      className="px-2 py-1 rounded bg-amber-500 text-slate-950 text-[10px] font-bold cursor-pointer shrink-0"
                    >
                      Parse
                    </button>
                  </div>
                </div>
              )}

              {/* 14i. MATH & TEXT PROCESSOR */}
              {block.type === 'logic-math-text' && (() => {
                const previewVal = evaluateMathTextOperation(
                  block.logicConfig,
                  runtimeState.variables
                );
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3'} ${customRadius} ${
                        customBg || 'bg-amber-950/20'
                      } border border-amber-500/30 flex items-center justify-between gap-2`}
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                          <Calculator className="w-3 h-3" />
                          {(block.logicConfig?.mathTextOp || 'random').toUpperCase()}(
                          {block.logicConfig?.argA || '1'}, {block.logicConfig?.argB || '100'})
                        </span>
                        <p className="text-xs font-mono font-bold text-white truncate">
                          Result: {previewVal}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTriggerAction(block, formInputs);
                        }}
                        className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 text-[10px] font-bold cursor-pointer shrink-0"
                      >
                        Compute
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 14j. FEEDBACK & DOM UTILITIES */}
              {block.type === 'logic-feedback' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3'} ${customRadius} ${
                      customBg || 'bg-amber-950/20'
                    } border border-amber-500/30 flex items-center justify-between gap-2`}
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-amber-300 uppercase">
                        Action: {block.action || 'alert'}
                      </span>
                      <p className="text-xs font-semibold text-white truncate">{displayContent}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerAction(block, formInputs);
                      }}
                      className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 text-[10px] font-bold cursor-pointer shrink-0"
                    >
                      Trigger
                    </button>
                  </div>
                </div>
              )}

              {/* 15. STORAGE / CLOUD DB / AUTH / FETCH / FLASK / DEVICE */}
              {block.type === 'backend-storage' && (() => {
                const sKey = block.logicConfig?.storageKey || 'sl_user_data';
                const sVal = block.logicConfig?.varValue ?? 'Saved from SL Builder!';
                let liveStored: string | null = null;
                try {
                  liveStored = typeof window !== 'undefined' ? window.localStorage.getItem(sKey) : null;
                } catch {
                  liveStored = null;
                }
                const runLocalStorage = (op: 'save' | 'load' | 'remove') => {
                  onUpdateBlock({
                    ...block,
                    logicConfig: { ...block.logicConfig, storageKey: sKey, storageOp: op, varValue: sVal },
                  });
                  onTriggerAction(
                    {
                      ...block,
                      logicConfig: { ...block.logicConfig, storageKey: sKey, storageOp: op, varValue: sVal },
                    },
                    formInputs
                  );
                  if (op === 'save') {
                    setStorageOutputs((p) => ({ ...p, [block.id]: `Saved [${sKey}] = "${sVal}"` }));
                  } else if (op === 'remove') {
                    setStorageOutputs((p) => ({ ...p, [block.id]: `Removed [${sKey}]` }));
                  } else {
                    let loadedVal: string | null = null;
                    try {
                      loadedVal = window.localStorage.getItem(sKey);
                    } catch {
                      loadedVal = null;
                    }
                    setStorageOutputs((p) => ({
                      ...p,
                      [block.id]: `Loaded [${sKey}] = ${loadedVal ?? '(empty)'}`,
                    }));
                  }
                };
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      onClick={(e) => e.stopPropagation()}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-emerald-950/25'
                      } border border-emerald-500/30 space-y-2`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-emerald-300 flex items-center gap-1 font-bold">
                          <HardDrive className="w-3 h-3" />
                          LocalStorage [{sKey}]
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400/90 truncate max-w-[140px]">
                          {liveStored !== null ? `Stored: "${liveStored}"` : 'Empty'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={sKey}
                          onChange={(e) =>
                            onUpdateBlock({
                              ...block,
                              logicConfig: { ...block.logicConfig, storageKey: e.target.value },
                            })
                          }
                          placeholder="Storage key..."
                          className="px-2 py-1 rounded bg-[#05070B] border border-emerald-500/25 text-[11px] font-mono text-emerald-200 outline-none focus:border-emerald-400"
                        />
                        <input
                          type="text"
                          value={sVal}
                          onChange={(e) =>
                            onUpdateBlock({
                              ...block,
                              logicConfig: { ...block.logicConfig, varValue: e.target.value },
                            })
                          }
                          placeholder="Value to save..."
                          className="px-2 py-1 rounded bg-[#05070B] border border-emerald-500/25 text-[11px] text-white outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => runLocalStorage('save')}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => runLocalStorage('load')}
                          className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-100 text-[10px] font-semibold cursor-pointer"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => runLocalStorage('remove')}
                          className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 text-[10px] font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                      {storageOutputs[block.id] && (
                        <div className="px-2 py-1 rounded bg-[#05070B] border border-emerald-500/20 text-[10px] font-mono text-emerald-300 truncate">
                          {storageOutputs[block.id]}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {block.type === 'backend-db' && (() => {
                const colName = block.logicConfig?.collectionName || 'users';
                const rows = runtimeState.dbCollections[colName] || [];
                const draftVal = dbDraftInputs[block.id] ?? (block.logicConfig?.varValue || '{"name":"Nimali","role":"Creator"}');
                const runDbAction = (dbOp: 'save' | 'get' | 'delete') => {
                  onTriggerAction(
                    {
                      ...block,
                      logicConfig: {
                        ...block.logicConfig,
                        collectionName: colName,
                        dbOp,
                        varValue: draftVal,
                      },
                    },
                    formInputs
                  );
                };
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      onClick={(e) => e.stopPropagation()}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-emerald-950/25'
                      } border border-emerald-500/30 space-y-2`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-emerald-300 flex items-center gap-1 font-bold">
                          <Database className="w-3 h-3" />
                          Cloud DB [{colName}] · {rows.length} docs
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => runDbAction('save')}
                            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                          >
                            + Save
                          </button>
                          <button
                            type="button"
                            onClick={() => runDbAction('get')}
                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-100 text-[10px] font-semibold cursor-pointer"
                          >
                            Get
                          </button>
                          <button
                            type="button"
                            onClick={() => runDbAction('delete')}
                            className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 text-[10px] font-semibold cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={draftVal}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDbDraftInputs((p) => ({ ...p, [block.id]: v }));
                          onUpdateBlock({
                            ...block,
                            logicConfig: { ...block.logicConfig, varValue: v },
                          });
                        }}
                        placeholder='{"name":"Creator","role":"Admin"}'
                        className="w-full px-2 py-1 rounded bg-[#05070B] border border-emerald-500/25 text-[11px] font-mono text-emerald-100 outline-none focus:border-emerald-400"
                      />
                      {rows.length === 0 ? (
                        <div className="text-[10px] text-slate-400 font-mono px-1">
                          No documents yet — click &ldquo;+ Save&rdquo; to insert a record.
                        </div>
                      ) : (
                        <div className="space-y-1 max-h-28 overflow-y-auto">
                          {rows.slice(-4).map((doc) => (
                            <div
                              key={doc.id}
                              className="px-2 py-1 rounded bg-[#05070B] border border-emerald-500/20 text-[10px] font-mono text-emerald-200 truncate"
                            >
                              {doc.id}: {JSON.stringify(doc.data)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {block.type === 'backend-auth' && (() => {
                const draft = authDrafts[block.id] || {
                  email: block.logicConfig?.varValue || 'creator@slbuilder.app',
                  password: '••••••••',
                };
                const runAuthOp = (authOp: 'signup' | 'login' | 'logout' | 'current-user') => {
                  onTriggerAction(
                    {
                      ...block,
                      logicConfig: {
                        ...block.logicConfig,
                        authOp,
                        varValue: draft.email || 'creator@slbuilder.app',
                      },
                    },
                    formInputs
                  );
                };
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      onClick={(e) => e.stopPropagation()}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-emerald-950/25'
                      } border border-emerald-500/30 space-y-2`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-emerald-300 flex items-center gap-1 font-bold">
                          <Lock className="w-3 h-3" />
                          AUTH SESSION
                        </span>
                        <span
                          className={`text-[10px] font-mono font-semibold truncate ${
                            runtimeState.authUser ? 'text-emerald-300' : 'text-slate-400'
                          }`}
                        >
                          {runtimeState.authUser
                            ? `Signed in: ${runtimeState.authUser.email}`
                            : 'Signed Out'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="email"
                          value={draft.email}
                          onChange={(e) =>
                            setAuthDrafts((p) => ({
                              ...p,
                              [block.id]: { ...draft, email: e.target.value },
                            }))
                          }
                          placeholder="Email address..."
                          className="px-2 py-1 rounded bg-[#05070B] border border-emerald-500/25 text-[11px] text-white outline-none focus:border-emerald-400"
                        />
                        <input
                          type="password"
                          value={draft.password}
                          onChange={(e) =>
                            setAuthDrafts((p) => ({
                              ...p,
                              [block.id]: { ...draft, password: e.target.value },
                            }))
                          }
                          placeholder="Password..."
                          className="px-2 py-1 rounded bg-[#05070B] border border-emerald-500/25 text-[11px] text-white outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => runAuthOp('signup')}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Sign Up
                        </button>
                        <button
                          type="button"
                          onClick={() => runAuthOp('login')}
                          className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Login
                        </button>
                        <button
                          type="button"
                          onClick={() => runAuthOp('logout')}
                          className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] font-semibold cursor-pointer"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'backend-device' && (() => {
                const activeStream = cameraStreams[block.id];
                const runDevice = async (deviceOp: 'gps' | 'camera' | 'vibrate') => {
                  onUpdateBlock({
                    ...block,
                    logicConfig: { ...block.logicConfig, deviceOp },
                  });
                  if (deviceOp === 'vibrate') {
                    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                      navigator.vibrate([120, 60, 120]);
                    }
                    setDeviceOutputs((p) => ({
                      ...p,
                      [block.id]: 'Vibrate pattern [120, 60, 120]ms dispatched',
                    }));
                    onTriggerAction(
                      { ...block, logicConfig: { ...block.logicConfig, deviceOp: 'vibrate' } },
                      formInputs
                    );
                  } else if (deviceOp === 'camera') {
                    if (activeStream) {
                      activeStream.getTracks().forEach((t) => t.stop());
                      setCameraStreams((p) => ({ ...p, [block.id]: null }));
                      setDeviceOutputs((p) => ({ ...p, [block.id]: 'Camera stream stopped' }));
                      return;
                    }
                    if (navigator.mediaDevices?.getUserMedia) {
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                        setCameraStreams((p) => ({ ...p, [block.id]: stream }));
                        setDeviceOutputs((p) => ({ ...p, [block.id]: 'Live camera stream active' }));
                      } catch {
                        setDeviceOutputs((p) => ({
                          ...p,
                          [block.id]: 'Camera permission denied or no camera device detected',
                        }));
                      }
                    } else {
                      setDeviceOutputs((p) => ({ ...p, [block.id]: 'MediaDevices API unavailable' }));
                    }
                  } else {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          const coords = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
                          setDeviceOutputs((p) => ({ ...p, [block.id]: `GPS: ${coords}` }));
                          onTriggerAction(
                            { ...block, logicConfig: { ...block.logicConfig, deviceOp: 'gps' } },
                            formInputs
                          );
                        },
                        () => {
                          setDeviceOutputs((p) => ({
                            ...p,
                            [block.id]: 'GPS Demo Fallback: 6.9271, 79.8612 (Colombo)',
                          }));
                        },
                        { timeout: 3500 }
                      );
                    } else {
                      setDeviceOutputs((p) => ({
                        ...p,
                        [block.id]: 'GPS Demo: 6.9271, 79.8612 (Colombo)',
                      }));
                    }
                  }
                };
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      onClick={(e) => e.stopPropagation()}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-emerald-950/25'
                      } border border-emerald-500/30 space-y-2`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-emerald-300 uppercase font-bold flex items-center gap-1">
                          <Smartphone className="w-3 h-3" /> Device &amp; Sensor APIs
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => void runDevice('gps')}
                            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <MapPin className="w-2.5 h-2.5" /> GPS
                          </button>
                          <button
                            type="button"
                            onClick={() => void runDevice('camera')}
                            className={`px-2 py-0.5 rounded text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                              activeStream ? 'bg-rose-600 hover:bg-rose-500' : 'bg-sky-600 hover:bg-sky-500'
                            }`}
                          >
                            <Camera className="w-2.5 h-2.5" /> {activeStream ? 'Stop' : 'Camera'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void runDevice('vibrate')}
                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-100 text-[10px] font-semibold cursor-pointer"
                          >
                            Vibrate
                          </button>
                        </div>
                      </div>
                      {activeStream && (
                        <video
                          autoPlay
                          muted
                          playsInline
                          ref={(videoEl) => {
                            if (videoEl && videoEl.srcObject !== activeStream) {
                              videoEl.srcObject = activeStream;
                            }
                          }}
                          className="w-full max-h-36 rounded-lg bg-black object-cover border border-emerald-500/30"
                        />
                      )}
                      {deviceOutputs[block.id] && (
                        <div className="px-2 py-1 rounded bg-[#05070B] border border-emerald-500/20 text-[10px] font-mono text-emerald-300">
                          {deviceOutputs[block.id]}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {(block.type === 'backend-flask' ||
                block.type === 'backend-fetch' ||
                block.type === 'backend-blockly') && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    onClick={(e) => e.stopPropagation()}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-emerald-950/25'
                    } border border-emerald-500/30 space-y-2`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <Server className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <select
                          value={block.httpMethod || 'GET'}
                          onChange={(e) =>
                            onUpdateBlock({
                              ...block,
                              httpMethod: e.target.value as CanvasBlock['httpMethod'],
                            })
                          }
                          className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold outline-none cursor-pointer"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DEL</option>
                        </select>
                        <input
                          type="text"
                          value={block.apiEndpoint || '/api/v1/metrics'}
                          onChange={(e) =>
                            onUpdateBlock({ ...block, apiEndpoint: e.target.value })
                          }
                          className="flex-1 min-w-0 px-2 py-0.5 rounded bg-[#05070B] border border-emerald-500/25 text-[11px] font-mono text-emerald-200 outline-none focus:border-emerald-400"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={Boolean(apiLoading[block.id])}
                        onClick={async (e) => {
                          e.stopPropagation();
                          const endpoint = (block.apiEndpoint || '/api/v1/metrics').trim();
                          const method = block.httpMethod || 'GET';
                          setApiLoading((p) => ({ ...p, [block.id]: true }));
                          try {
                            let isRealResponse = false;
                            let outText = '';
                            if (/^https?:\/\//i.test(endpoint)) {
                              const fetchOpts: RequestInit = { method };
                              if (method !== 'GET' && method !== 'DELETE' && block.requestBody) {
                                fetchOpts.headers = { 'Content-Type': 'application/json' };
                                fetchOpts.body = block.requestBody;
                              }
                              const resp = await fetch(endpoint, fetchOpts);
                              const rawText = await resp.text();
                              isRealResponse = true;
                              outText = `HTTP ${resp.status} ${resp.statusText} · ${rawText.slice(0, 180)}`;
                            } else {
                              outText = JSON.stringify({
                                status: 200,
                                mode: block.type === 'backend-flask' ? 'flask-route-preview' : 'mock-api',
                                method,
                                endpoint,
                                timestamp: new Date().toLocaleTimeString(),
                              });
                            }
                            setApiResponses((prev) => ({ ...prev, [block.id]: outText }));
                            onTriggerAction(block, formInputs);
                            if (isRealResponse) {
                              // handled cleanly
                            }
                          } catch {
                            setApiResponses((prev) => ({
                              ...prev,
                              [block.id]: JSON.stringify({
                                status: 200,
                                fallback: true,
                                method,
                                endpoint,
                                note: 'CORS/offline sandbox fallback',
                              }),
                            }));
                            onTriggerAction(block, formInputs);
                          } finally {
                            setApiLoading((p) => ({ ...p, [block.id]: false }));
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />{' '}
                        {apiLoading[block.id] ? 'Sending' : 'Send'}
                      </button>
                    </div>
                    {block.subtitle && (
                      <p style={subtitleStyle} className="text-[10px] text-slate-400">
                        {block.subtitle}
                      </p>
                    )}
                    {apiResponses[block.id] && (
                      <div className="p-2 rounded bg-[#05070B] border border-emerald-500/20 text-[10px] font-mono text-emerald-300 break-all flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{apiResponses[block.id]}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 16. FOOTER */}
              {block.type === 'ui-footer' && (
                <footer
                  style={surfaceStyle}
                  className={`w-full ${customPad || 'px-5 py-4'} ${
                    customBg ||
                    (isLightPage
                      ? 'bg-white/80 border-slate-200'
                      : 'bg-[#0B0E16]/85 border-white/10')
                  } border-t backdrop-blur-md flex flex-wrap items-center justify-between gap-2 ${
                    customFont || 'text-[11px]'
                  } ${customWeight || 'font-normal'} ${
                    customTextColor || (isLightPage ? 'text-slate-600' : 'text-slate-400')
                  }`}
                >
                  <span style={primaryStyle}>{displayContent}</span>
                  {block.subtitle && <span style={subtitleStyle}>{block.subtitle}</span>}
                </footer>
              )}
              </div>
              {blockIdx === blocks.length - 1 && stageDropIdx === blocks.length && (
                <div className="mx-4 my-1.5 h-1.5 rounded-full bg-[#4D97FF] shadow-[0_0_12px_rgba(77,151,255,0.85)] relative flex items-center justify-center">
                  <span className="px-2 py-0.5 rounded bg-[#4D97FF] text-white text-[9px] font-bold uppercase tracking-wider shadow">
                    Drop Block Here
                  </span>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {runtimeState.lastSubmission && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-5 my-3 p-3.5 rounded-xl bg-emerald-950/85 border border-emerald-400/40 text-xs shadow-lg space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                <Check className="w-3.5 h-3.5" />
                <span>{runtimeState.lastSubmission.message}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-emerald-400/80 font-mono">
                <span>{runtimeState.lastSubmission.timestamp}</span>
                {onDismissSubmission && (
                  <button
                    type="button"
                    onClick={onDismissSubmission}
                    className="p-0.5 rounded hover:bg-white/10 text-emerald-200 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            {runtimeState.lastSubmission.fields.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-emerald-500/20">
                {runtimeState.lastSubmission.fields.map((f, fIdx) => (
                  <div
                    key={`${f.label}_${fIdx}`}
                    className="px-2 py-1 rounded bg-black/30 text-[10px] flex items-center justify-between gap-2"
                  >
                    <span className="text-emerald-300/80 font-semibold truncate">{f.label}:</span>
                    <span className="text-white font-mono truncate">{f.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inline Quick Text Editor Overlay (Double-Click or Edit Text pill on Stage) */}
      {inlineEditBlock && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setInlineEditBlockId(null);
          }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#11151E] border border-sky-500/30 rounded-2xl max-w-md w-full p-4 shadow-2xl space-y-3 text-xs"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Pencil className="w-3.5 h-3.5 text-sky-400" />
                <span>Edit All Text — {inlineEditBlock.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setInlineEditBlockId(null)}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-semibold block">
                  {inlineEditBlock.type === 'ui-stat'
                    ? 'Stat / KPI Value'
                    : 'Primary Text / Title'}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={
                    inlineEditBlock.type === 'ui-stat'
                      ? (inlineEditBlock.statValue ?? inlineEditBlock.content)
                      : inlineEditBlock.content
                  }
                  onChange={(e) =>
                    onUpdateBlock(
                      inlineEditBlock.type === 'ui-stat'
                        ? { ...inlineEditBlock, content: e.target.value, statValue: e.target.value }
                        : { ...inlineEditBlock, content: e.target.value }
                    )
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-white outline-none focus:border-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-semibold block">
                  {inlineEditBlock.type === 'ui-stat'
                    ? 'KPI Label'
                    : inlineEditBlock.type === 'ui-testimonial'
                    ? 'Author Name'
                    : inlineEditBlock.type === 'ui-tabbar'
                    ? 'Tab Panels (separate per tab with |)'
                    : 'Subtitle / Helper Label'}
                </label>
                <input
                  type="text"
                  value={
                    inlineEditBlock.type === 'ui-stat'
                      ? (inlineEditBlock.statLabel ?? inlineEditBlock.subtitle ?? '')
                      : inlineEditBlock.subtitle || ''
                  }
                  onChange={(e) =>
                    onUpdateBlock(
                      inlineEditBlock.type === 'ui-stat'
                        ? { ...inlineEditBlock, subtitle: e.target.value, statLabel: e.target.value }
                        : { ...inlineEditBlock, subtitle: e.target.value }
                    )
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-slate-200 outline-none focus:border-sky-400"
                />
              </div>

              {supportsOptionsList(inlineEditBlock.type, inlineEditBlock.controlVariant) && (
                <div className="space-y-1">
                  <label className="text-[10px] text-sky-300 font-semibold block">
                    Items / Options (comma separated)
                  </label>
                  <input
                    type="text"
                    value={parseOptionsList(inlineEditBlock.content, inlineEditBlock.options).join(', ')}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const parsed = raw
                        .split(/[,|]+/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                      onUpdateBlock({
                        ...inlineEditBlock,
                        options: parsed,
                        content: parsed.join(' | '),
                      });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-sky-200 outline-none focus:border-sky-400"
                  />
                </div>
              )}

              {inlineEditBlock.type === 'ui-testimonial' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-semibold block">
                    Author Role / Company
                  </label>
                  <input
                    type="text"
                    value={inlineEditBlock.authorRole || ''}
                    onChange={(e) =>
                      onUpdateBlock({ ...inlineEditBlock, authorRole: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-slate-200 outline-none focus:border-sky-400"
                  />
                </div>
              )}

              {(inlineEditBlock.type === 'ui-image' ||
                inlineEditBlock.type === 'ui-avatar' ||
                inlineEditBlock.type === 'ui-card') && (
                <div className="space-y-1.5 p-2.5 rounded-xl bg-[#090B10] border border-sky-500/25">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-sky-300 font-semibold">
                      Photo / Image Asset
                    </span>
                    <div className="flex items-center gap-1.5">
                      <label className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-[10px] font-bold flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const dataUrl = await readAndCompressImageFile(file);
                              onUpdateBlock({ ...inlineEditBlock, imageUrl: dataUrl });
                            } catch {
                              // ignore
                            }
                          }}
                        />
                      </label>
                      {inlineEditBlock.imageUrl && (
                        <button
                          type="button"
                          onClick={() => onUpdateBlock({ ...inlineEditBlock, imageUrl: '' })}
                          className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={inlineEditBlock.imageUrl || ''}
                    onChange={(e) =>
                      onUpdateBlock({ ...inlineEditBlock, imageUrl: e.target.value })
                    }
                    placeholder="Or paste Image URL (https://...)"
                    className="w-full px-2.5 py-1 rounded-lg bg-[#11151E] border border-white/10 text-[11px] text-slate-200 outline-none focus:border-sky-400"
                  />
                </div>
              )}

              {inlineEditBlock.type === 'ui-icon' && (
                <div className="space-y-1.5 p-2.5 rounded-xl bg-[#090B10] border border-sky-500/25">
                  <span className="text-[10px] text-sky-300 font-semibold block">
                    Choose Real Vector Icon ({ICON_LIBRARY.length} Icons)
                  </span>
                  <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto">
                    {ICON_LIBRARY.map((ic) => {
                      const active = (inlineEditBlock.iconName || 'sparkles') === ic.id;
                      return (
                        <button
                          key={ic.id}
                          type="button"
                          onClick={() => onUpdateBlock({ ...inlineEditBlock, iconName: ic.id })}
                          title={ic.label}
                          className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                            active
                              ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                              : 'bg-[#11151E] border-white/10 text-slate-300 hover:text-white hover:border-white/25'
                          }`}
                        >
                          {renderVectorIcon(ic.id, 'w-4 h-4')}
                          <span className="text-[8px] truncate w-full text-center">{ic.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {inlineEditBlock.type === 'ui-video' && (
                <div className="space-y-1.5 p-2.5 rounded-xl bg-[#090B10] border border-sky-500/25">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-sky-300 font-semibold">
                      YouTube or Video MP4 URL
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateBlock({
                          ...inlineEditBlock,
                          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        })
                      }
                      className="text-[10px] text-sky-400 hover:underline cursor-pointer"
                    >
                      Try Sample YouTube
                    </button>
                  </div>
                  <input
                    type="text"
                    value={inlineEditBlock.videoUrl || ''}
                    onChange={(e) =>
                      onUpdateBlock({ ...inlineEditBlock, videoUrl: e.target.value })
                    }
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#11151E] border border-white/10 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-semibold block">
                  Badge / Button / Kicker Text (Optional)
                </label>
                <input
                  type="text"
                  value={inlineEditBlock.badgeText ?? ''}
                  placeholder="Custom tag, button label, or section kicker..."
                  onChange={(e) =>
                    onUpdateBlock({ ...inlineEditBlock, badgeText: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-amber-200 outline-none focus:border-sky-400"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setInlineEditBlockId(null)}
                className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirm Dialog Overlay inside Stage (No native window.confirm) */}
      {confirmDialog && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#11151E] border border-white/15 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-white">{confirmDialog.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => onResolveConfirm?.(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onResolveConfirm?.(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer"
              >
                {confirmDialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
