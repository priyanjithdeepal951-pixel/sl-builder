import React, { useState } from 'react';
import {
  Zap,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
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
  Plus,
  Trash2,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  MousePointer2,
  ZoomIn,
  ZoomOut,
  Send,
  RefreshCw,
  QrCode,
  FileText,
  Languages,
  Bot,
  Layers,
  Maximize2,
  AlertCircle,
  CreditCard,
  Minus,
  PanelRight,
  PenTool,
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
  onDropChildInContainer?: (
    containerId: string,
    payload: {
      tplId?: string;
      blockType?: string;
      imageDataUrl?: string;
      fileName?: string;
    }
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
  condensed: "'Oswald', 'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
  script: "'Pacifico', 'Brush Script MT', 'Segoe Script', cursive",
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

function renderRichTextSpans(raw: string): React.ReactNode {
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|#[0-9a-fA-F]{3,8}\|[^`\n]+|`[^`]+`)/g;
  const parts = raw.split(tokenRegex);
  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-extrabold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-sky-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('__') && part.endsWith('__') && part.length > 4) {
      return (
        <span key={idx} className="underline decoration-sky-400 decoration-2 underline-offset-4">
          {part.slice(2, -2)}
        </span>
      );
    }
    if (part.startsWith('#') && part.includes('|')) {
      const pipeIdx = part.indexOf('|');
      const hex = part.slice(0, pipeIdx);
      const label = part.slice(pipeIdx + 1);
      const safeHex = /^#[0-9a-fA-F]{3,8}$/.test(hex) ? hex : '#38bdf8';
      return (
        <span key={idx} style={{ color: safeHex }} className="font-bold">
          {label}
        </span>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-white/10 font-mono text-[11px] text-amber-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function renderMarkdownBlocks(raw: string): React.ReactNode {
  const lines = raw.replace(/\\n/g, '\n').split('\n');
  const nodes: React.ReactNode[] = [];
  let inCode = false;
  let codeLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      if (inCode) {
        nodes.push(
          <pre
            key={`code_${i}`}
            className="p-2.5 rounded-lg bg-[#05070C] border border-white/10 font-mono text-[11px] text-emerald-300 overflow-x-auto"
          >
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    const trimmed = line.trim();
    if (!trimmed) {
      nodes.push(<div key={`sp_${i}`} className="h-1" />);
      continue;
    }
    if (trimmed.startsWith('### ')) {
      nodes.push(
        <h5 key={`h3_${i}`} className="text-xs font-bold text-sky-300">
          {renderRichTextSpans(trimmed.slice(4))}
        </h5>
      );
    } else if (trimmed.startsWith('## ')) {
      nodes.push(
        <h4 key={`h2_${i}`} className="text-sm font-bold text-white">
          {renderRichTextSpans(trimmed.slice(3))}
        </h4>
      );
    } else if (trimmed.startsWith('# ')) {
      nodes.push(
        <h3 key={`h1_${i}`} className="text-base font-extrabold text-white border-b border-white/10 pb-1">
          {renderRichTextSpans(trimmed.slice(2))}
        </h3>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      nodes.push(
        <div key={`li_${i}`} className="flex items-start gap-2 text-xs text-slate-200 pl-1">
          <span className="text-sky-400 font-bold leading-5">&bull;</span>
          <span className="flex-1 leading-5">{renderRichTextSpans(trimmed.slice(2))}</span>
        </div>
      );
    } else {
      nodes.push(
        <p key={`p_${i}`} className="text-xs text-slate-200 leading-relaxed">
          {renderRichTextSpans(trimmed)}
        </p>
      );
    }
  }
  return <div className="space-y-1.5">{nodes}</div>;
}

function buildBarcodeBars(value: string): Array<{ x: number; w: number }> {
  const safe = value || 'SL-STUDIO';
  const bars: Array<{ x: number; w: number }> = [];
  let cursor = 4;
  // Guard start
  bars.push({ x: cursor, w: 2 });
  cursor += 4;
  bars.push({ x: cursor, w: 2 });
  cursor += 4;
  for (let i = 0; i < Math.min(safe.length * 3, 44); i++) {
    const ch = safe.charCodeAt(i % safe.length);
    const w = ((ch + i * 7) % 3) + 1;
    const gap = ((ch * 3 + i) % 3) + 1.5;
    bars.push({ x: cursor, w });
    cursor += w + gap;
    if (cursor > 192) break;
  }
  bars.push({ x: cursor, w: 2 });
  cursor += 4;
  bars.push({ x: cursor, w: 2 });
  return bars;
}

function buildQrCells(value: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const paintFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };
  paintFinder(0, 0);
  paintFinder(0, size - 7);
  paintFinder(size - 7, 0);

  let seed = 0;
  for (let i = 0; i < value.length; i++) {
    seed = (seed * 31 + value.charCodeAt(i)) >>> 0;
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;
      if (r === 6 || c === 6) {
        grid[r][c] = (r + c) % 2 === 0;
        continue;
      }
      seed = (seed * 1664525 + 1013904223) >>> 0;
      grid[r][c] = ((seed >>> 16) & 1) === 1;
    }
  }
  return grid;
}

const SignaturePadWidget: React.FC<{
  blockId: string;
  accentColor: string;
  onSignedChange: (hasSig: boolean) => void;
}> = ({ accentColor, onSignedChange }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const drawingRef = React.useRef(false);
  const [hasStroke, setHasStroke] = React.useState(false);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / Math.max(1, rect.width)) * canvas.width,
      y: ((e.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const { x, y } = getPos(e);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.stopPropagation();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasStroke) {
      setHasStroke(true);
      onSignedChange(true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.stopPropagation();
    drawingRef.current = false;
  };

  const clearPad = (e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
    onSignedChange(false);
  };

  return (
    <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
      <div className="relative rounded-xl bg-[#090B10] border border-dashed border-white/20 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={360}
          height={110}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-[104px] touch-none cursor-crosshair block"
        />
        {!hasStroke && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] text-slate-500">
            Sign here with mouse or touch
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-4 bottom-3 border-b border-white/15" />
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span style={{ color: hasStroke ? accentColor : '#94a3b8' }} className="font-mono">
          {hasStroke ? 'Signature captured' : 'Awaiting signature'}
        </span>
        <button
          type="button"
          onClick={clearPad}
          className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 font-semibold cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

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
  onDropChildInContainer,
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
  const [dragOverContainerId, setDragOverContainerId] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [swipeIndex, setSwipeIndex] = useState<Record<string, number>>({});
  const [swipeDragX, setSwipeDragX] = useState<Record<string, number>>({});
  const [formDrafts, setFormDrafts] = useState<
    Record<string, { name: string; email: string; password: string }>
  >({});
  const [formErrors, setFormErrors] = useState<
    Record<string, { name?: string; email?: string; password?: string; submitted?: boolean }>
  >({});
  const pageDragStartX = React.useRef<Record<string, number | null>>({});
  const carouselRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const audioRefs = React.useRef<Record<string, HTMLAudioElement | null>>({});
  const mapDragRef = React.useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const [slidableState, setSlidableState] = useState<Record<string, 'closed' | 'actions' | 'deleted'>>({});
  const [slidableEditingId, setSlidableEditingId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Record<string, { year: number; month: number; day: number }>>({});
  const [audioPlayState, setAudioPlayState] = useState<Record<string, { playing: boolean; progress: number; muted: boolean }>>({});
  const [webviewUrls, setWebviewUrls] = useState<Record<string, string>>({});
  const [webviewReloadKey, setWebviewReloadKey] = useState<Record<string, number>>({});
  const [mapViewState, setMapViewState] = useState<
    Record<
      string,
      {
        zoom: number;
        panX: number;
        panY: number;
        extraMarkers: Array<{ label: string; x: number; y: number }>;
        activeMarkerLabel: string | null;
      }
    >
  >({});
  const [dismissedAds, setDismissedAds] = useState<Record<string, boolean>>({});
  const [lottieSpeeds, setLottieSpeeds] = useState<Record<string, number>>({});
  const [pdfStates, setPdfStates] = useState<Record<string, { page: number; zoom: number }>>({});
  const [muxStates, setMuxStates] = useState<Record<string, { live: boolean; viewers: number }>>({});
  const [mouseStates, setMouseStates] = useState<
    Record<string, { hovering: boolean; x: number; y: number; enters: number }>
  >({});
  const [tooltipVisible, setTooltipVisible] = useState<Record<string, boolean>>({});
  const [chartHoveredIdx, setChartHoveredIdx] = useState<Record<string, number | null>>({});
  const [dragTargetOver, setDragTargetOver] = useState<Record<string, boolean>>({});
  const [dragTargetItems, setDragTargetItems] = useState<Record<string, string[]>>({});
  const [genUiChats, setGenUiChats] = useState<
    Record<
      string,
      {
        draft: string;
        messages: Array<{ role: 'user' | 'assistant'; text: string; cardTitle?: string; chips?: string[] }>;
      }
    >
  >({});
  const [drawerCollapsed, setDrawerCollapsed] = useState<Record<string, boolean>>({});
  const [pinMaskState, setPinMaskState] = useState<Record<string, boolean>>({});
  const pinInputRefs = React.useRef<Record<string, Array<HTMLInputElement | null>>>({});
  const [ratingHover, setRatingHover] = useState<Record<string, number>>({});
  const [creditCardState, setCreditCardState] = useState<
    Record<string, { number: string; expiry: string; cvc: string; holder: string }>
  >({});
  const [choiceChipsSelected, setChoiceChipsSelected] = useState<Record<string, string[]>>({});
  const [placePickerSearch, setPlacePickerSearch] = useState<Record<string, string>>({});
  const [checkboxGroupSelected, setCheckboxGroupSelected] = useState<Record<string, string[]>>({});

  React.useEffect(() => {
    const activeIds = Object.keys(audioPlayState).filter((id) => audioPlayState[id]?.playing);
    if (activeIds.length === 0) return;
    const timer = window.setInterval(() => {
      setAudioPlayState((prev) => {
        const next = { ...prev };
        activeIds.forEach((id) => {
          const cur = prev[id];
          if (!cur?.playing) return;
          const nextProg = cur.progress >= 100 ? 0 : cur.progress + 2;
          next[id] = { ...cur, progress: nextProg };
        });
        return next;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [audioPlayState]);

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

  const handleContainerDragOver = (e: React.DragEvent, containerId: string) => {
    if (!onDropChildInContainer) return;
    const hasTpl =
      e.dataTransfer.types.includes('application/x-slbuilder-tpl-id') ||
      e.dataTransfer.types.includes('application/x-slbuilder-type') ||
      e.dataTransfer.types.includes('Files');
    if (!hasTpl) return;
    e.preventDefault();
    e.stopPropagation();
    if (dragOverContainerId !== containerId) {
      setDragOverContainerId(containerId);
    }
  };

  const handleContainerDrop = async (e: React.DragEvent, containerId: string) => {
    if (!onDropChildInContainer) return;
    const tplId = e.dataTransfer.getData('application/x-slbuilder-tpl-id');
    const blockType = e.dataTransfer.getData('application/x-slbuilder-type');
    const file = e.dataTransfer.files?.[0];
    if (!tplId && !blockType && !(file && file.type.startsWith('image/'))) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setDragOverContainerId(null);
    setStageDropIdx(null);

    if (file && file.type.startsWith('image/')) {
      try {
        const dataUrl = await readAndCompressImageFile(file);
        onDropChildInContainer(containerId, { imageDataUrl: dataUrl, fileName: file.name });
      } catch {
        // ignore invalid file
      }
      return;
    }

    onDropChildInContainer(containerId, { tplId, blockType });
  };

  const renderChildWidget = (
    child: CanvasBlock,
    parentBlock: CanvasBlock,
    childIdx: number,
    extraStyle?: React.CSSProperties
  ): React.ReactNode => {
    const childBg = child.style?.customBgHex || (child.style?.bgColor === 'bg-transparent' ? 'transparent' : undefined);
    const childColor = child.style?.customTextHex;
    const cFontSize = child.style?.fontSize ? FONT_SIZE_MAP[child.style.fontSize] || '' : '';
    const cFontWeight = child.style?.fontWeight ? FONT_WEIGHT_MAP[child.style.fontWeight] || '' : '';
    const cTextColor = !childColor && child.style?.textColor ? TEXT_COLOR_MAP[child.style.textColor] || '' : '';
    const cRadius = child.style?.borderRadius ? RADIUS_MAP[child.style.borderRadius] || 'rounded-lg' : 'rounded-lg';
    const cFontFamily = child.style?.fontFamily ? FONT_FAMILY_CSS[child.style.fontFamily] : undefined;
    const cTextStyle: React.CSSProperties = {
      ...(cFontFamily ? { fontFamily: cFontFamily } : {}),
      ...(childColor ? { color: childColor } : {}),
      ...(child.style?.textShadow ? { textShadow: child.style.textShadow } : {}),
      ...(child.style?.textStroke ? { WebkitTextStroke: child.style.textStroke } : {}),
      ...(child.style?.textGradient
        ? {
            backgroundImage: child.style.textGradient,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
          }
        : {}),
    };
    const cSurfaceStyle: React.CSSProperties = {
      ...(cFontFamily ? { fontFamily: cFontFamily } : {}),
      ...(child.style?.bgGradient
        ? { background: child.style.bgGradient }
        : childBg
        ? { backgroundColor: childBg }
        : {}),
      ...(child.style?.borderColor ? { borderColor: child.style.borderColor } : {}),
      ...(child.style?.boxShadow ? { boxShadow: child.style.boxShadow } : {}),
    };
    const removeChild = (e: React.MouseEvent) => {
      e.stopPropagation();
      const nextChildren = (parentBlock.children || []).filter((c) => c.id !== child.id);
      onUpdateBlock({ ...parentBlock, children: nextChildren });
    };

    return (
      <div
        key={child.id || `child_${childIdx}`}
        style={extraStyle}
        className="group/child relative min-w-0"
      >
        {onDropAtStageIndex && (
          <button
            type="button"
            onClick={removeChild}
            title="Remove child widget"
            className="opacity-0 group-hover/child:opacity-100 absolute -top-1.5 -right-1.5 z-20 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] shadow cursor-pointer transition-opacity"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}

        {child.type === 'ui-spacer' ? (
          <div
            style={{
              height: `${child.spacerSize ?? 16}px`,
              width: `${child.spacerSize ?? 16}px`,
            }}
            className="border border-dashed border-white/10 rounded flex items-center justify-center text-[9px] font-mono text-slate-500"
          >
            {child.spacerSize ?? 16}px
          </div>
        ) : child.type === 'ui-divider' ? (
          <hr
            style={{
              borderColor: child.style?.borderColor || 'rgba(255,255,255,0.2)',
              borderTopWidth: child.style?.borderWidth || '1px',
            }}
            className="w-full border-0 border-t my-1"
          />
        ) : child.type === 'ui-vertical-divider' ? (
          <div
            style={{
              borderColor: child.style?.borderColor || 'rgba(255,255,255,0.22)',
              borderLeftWidth: child.style?.borderWidth || '1px',
            }}
            className="h-full min-h-[28px] border-l mx-1 self-stretch"
          />
        ) : child.type === 'ui-button' ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTriggerAction(child, formInputs);
            }}
            style={{
              backgroundColor: child.style?.customBgHex || resolvedAccent,
              ...cSurfaceStyle,
            }}
            className={`px-3.5 py-1.5 ${cRadius} ${cFontSize || 'text-xs'} ${cFontWeight || 'font-semibold'} ${cTextColor || 'text-white'} border border-white/10 shadow cursor-pointer hover:opacity-90 transition-opacity`}
          >
            <span style={cTextStyle}>{child.content || 'Button'}</span>
          </button>
        ) : child.type === 'ui-image' ? (
          <div className="rounded-lg overflow-hidden border border-white/10 bg-[#090B10]">
            {child.imageUrl ? (
              <img src={child.imageUrl} alt={child.content} className="w-full h-24 object-cover" />
            ) : (
              <div className="h-20 flex items-center justify-center gap-1.5 text-[11px] text-sky-300 bg-gradient-to-br from-slate-800/80 to-indigo-950/60">
                <ImageIcon className="w-4 h-4" />
                <span style={cTextStyle}>{child.content || 'Image'}</span>
              </div>
            )}
          </div>
        ) : child.type === 'ui-icon' ? (
          <div
            style={cSurfaceStyle}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 ${cRadius} bg-white/5 border border-white/10 ${cTextColor || 'text-sky-300'} ${cFontSize || 'text-xs'} ${cFontWeight}`}
          >
            {renderVectorIcon(child.iconName, 'w-4 h-4')}
            <span style={cTextStyle}>{child.content}</span>
          </div>
        ) : child.type === 'ui-badge' ? (
          <span
            style={{ ...cSurfaceStyle, ...cTextStyle }}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full ${cFontSize || 'text-[10px]'} ${cFontWeight || 'font-bold'} bg-indigo-500/20 border border-indigo-400/30 ${cTextColor || 'text-indigo-300'}`}
          >
            {child.content}
          </span>
        ) : child.type === 'ui-heading' ? (
          <h4
            style={cTextStyle}
            className={`${cFontSize || 'text-sm'} ${cFontWeight || 'font-bold'} ${cTextColor || 'text-white'}`}
          >
            {child.content}
          </h4>
        ) : (
          <div
            style={cSurfaceStyle}
            className={`px-3 py-2 ${cRadius} bg-[#090B10]/90 border border-white/10 ${cFontSize || 'text-xs'} text-slate-200`}
          >
            <p
              style={cTextStyle}
              className={`${cFontWeight || 'font-semibold'} ${cTextColor || 'text-white'} truncate`}
            >
              {child.content}
            </p>
            {child.subtitle && (
              <p
                style={{
                  ...(cFontFamily ? { fontFamily: cFontFamily } : {}),
                  ...(child.style?.subtitleColorHex ? { color: child.style.subtitleColorHex } : {}),
                }}
                className="text-[10px] text-slate-400 truncate mt-0.5"
              >
                {child.subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const inlineEditBlock = inlineEditBlockId
    ? blocks.find((b) => b.id === inlineEditBlockId) || null
    : null;
  const supportsOptionsList = (tp: CanvasBlock['type'], variant?: string) =>
    tp === 'ui-sidebar' ||
    tp === 'ui-tabbar' ||
    tp === 'ui-row' ||
    tp === 'ui-column' ||
    tp === 'ui-listview' ||
    tp === 'ui-grid' ||
    tp === 'ui-pageview' ||
    tp === 'ui-carousel' ||
    tp === 'ui-wrap' ||
    tp === 'ui-staggered' ||
    tp === 'ui-swipeable-stack' ||
    tp === 'ui-datatable' ||
    tp === 'ui-flex' ||
    tp === 'ui-vertical-divider' ||
    tp === 'ui-select' ||
    tp === 'ui-calendar' ||
    tp === 'ui-google-map' ||
    tp === 'ui-rive' ||
    tp === 'ui-pdf-viewer' ||
    tp === 'ui-language-selector' ||
    tp === 'ui-chart' ||
    tp === 'ui-sticky-header' ||
    tp === 'ui-genui-chat' ||
    tp === 'ui-choice-chips' ||
    tp === 'ui-place-picker' ||
    tp === 'ui-checkbox-group' ||
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
                      {block.badgeText || 'BC'}
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

              {/* 1b. SIDEBAR / DRAWER / ENDDRAWER */}
              {block.type === 'ui-sidebar' && (() => {
                const isEndDrawer = block.tooltipPosition === 'right';
                const isCollapsed = Boolean(drawerCollapsed[block.id]);
                return (
                  <div className={`px-5 py-1.5 flex ${isEndDrawer ? 'justify-end' : 'justify-start'}`}>
                    <aside
                      style={surfaceStyle}
                      className={`w-full ${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 space-y-2`}
                    >
                      <div
                        className={`flex items-center justify-between gap-2 text-xs font-bold text-white ${
                          isCollapsed ? '' : 'border-b border-white/10 pb-2'
                        } ${isEndDrawer ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`flex items-center gap-2 ${isEndDrawer ? 'flex-row-reverse' : ''}`}>
                          {isEndDrawer ? (
                            <PanelRight className="w-3.5 h-3.5 text-sky-400" />
                          ) : (
                            <PanelLeft className="w-3.5 h-3.5 text-sky-400" />
                          )}
                          <span
                            style={primaryStyle}
                            className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${customTextColor || 'text-white'}`}
                          >
                            {displayContent}
                          </span>
                          {block.badgeText && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-[9px] font-mono text-sky-300">
                              {block.badgeText}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDrawerCollapsed((p) => ({ ...p, [block.id]: !p[block.id] }));
                          }}
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                          title={isCollapsed ? 'Open Drawer' : 'Collapse Drawer'}
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              isCollapsed ? '-rotate-90' : 'rotate-0'
                            }`}
                          />
                        </button>
                      </div>
                      {!isCollapsed && (
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
                                style={{
                                  ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
                                  ...(active ? primaryStyle : {}),
                                }}
                                className={`text-left px-2.5 py-1.5 rounded-lg ${customFont || 'text-[11px]'} ${customWeight || 'font-medium'} flex items-center justify-between cursor-pointer transition-colors ${
                                  active
                                    ? 'bg-indigo-600/30 text-white border border-indigo-400/40'
                                    : `${customTextColor || 'text-slate-300'} hover:bg-white/5`
                                }`}
                              >
                                <span style={active ? primaryStyle : undefined}>{item}</span>
                                {active && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </aside>
                  </div>
                );
              })()}

              {/* 1b2. FLOATING ACTION BUTTON (FAB) */}
              {block.type === 'ui-fab' && (
                <div
                  className={`px-5 py-2 flex items-center ${
                    block.style?.textAlign === 'left'
                      ? 'justify-start'
                      : block.style?.textAlign === 'center'
                      ? 'justify-center'
                      : 'justify-end'
                  }`}
                >
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTriggerAction(block, formInputs);
                    }}
                    title={displayContent}
                    style={{
                      backgroundColor: block.style?.customBgHex || resolvedAccent,
                      ...surfaceStyle,
                    }}
                    className={`group inline-flex items-center gap-2 h-12 px-4 ${
                      block.style?.borderRadius ? customRadius : 'rounded-full'
                    } ${customTextColor || 'text-white'} ${customWeight || 'font-semibold'} ${
                      customFont || 'text-xs'
                    } border border-white/15 shadow-[0_8px_24px_rgba(79,70,229,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer`}
                  >
                    <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                      {renderVectorIcon(block.iconName || 'plus', 'w-4 h-4')}
                    </span>
                    {displayContent && <span style={primaryStyle}>{displayContent}</span>}
                  </button>
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
                              style={{
                                ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
                                ...(isTabActive && block.style?.bgGradient
                                  ? { background: block.style.bgGradient }
                                  : isTabActive && block.style?.customBgHex
                                  ? { backgroundColor: block.style.customBgHex }
                                  : {}),
                              }}
                              className={`flex-1 min-w-[70px] py-1.5 px-2.5 rounded-md ${
                                customFont || 'text-[11px]'
                              } ${customWeight || 'font-semibold'} cursor-pointer transition-colors ${
                                isTabActive
                                  ? `bg-indigo-600 ${customTextColor || 'text-white'} shadow-xs`
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <span style={isTabActive ? primaryStyle : undefined}>{tabLabel}</span>
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

              {/* 1e. CONTAINER (SECTION / BOX) */}
              {block.type === 'ui-section' && (
                <div className="px-5 py-2">
                  <section
                    onDragOver={(e) => handleContainerDragOver(e, block.id)}
                    onDragLeave={() => dragOverContainerId === block.id && setDragOverContainerId(null)}
                    onDrop={(e) => void handleContainerDrop(e, block.id)}
                    style={{
                      ...surfaceStyle,
                      borderWidth: block.style?.borderWidth || '1px',
                      borderStyle: block.children?.length ? 'solid' : 'dashed',
                    }}
                    className={`${customPad || 'p-5'} ${customRadius} ${
                      customBg || 'bg-white/[0.03]'
                    } ${
                      dragOverContainerId === block.id
                        ? 'ring-2 ring-[#4D97FF] border-[#4D97FF]'
                        : 'border-white/15'
                    } ${alignClass} space-y-2 transition-all`}
                  >
                    {(block.badgeText === undefined || block.badgeText !== '') && (
                      <span className="text-[9px] font-mono uppercase tracking-widest text-sky-400 block">
                        {block.badgeText || 'Container'}
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
                    {block.children && block.children.length > 0 && (
                      <div className="pt-2 space-y-2">
                        {block.children.map((child, cIdx) => renderChildWidget(child, block, cIdx))}
                      </div>
                    )}
                  </section>
                </div>
              )}

              {/* 1f. ROW HORIZONTAL */}
              {block.type === 'ui-row' && (
                <div className="px-5 py-1.5">
                  <div
                    onDragOver={(e) => handleContainerDragOver(e, block.id)}
                    onDragLeave={() => dragOverContainerId === block.id && setDragOverContainerId(null)}
                    onDrop={(e) => void handleContainerDrop(e, block.id)}
                    style={{
                      ...surfaceStyle,
                      borderWidth: block.style?.borderWidth || '1px',
                    }}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border ${
                      dragOverContainerId === block.id
                        ? 'border-[#4D97FF] ring-2 ring-[#4D97FF]/50'
                        : 'border-white/10'
                    } space-y-2`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-sky-400">
                      <Columns3 className="w-3 h-3" />
                      <span style={subtitleStyle}>
                        {block.subtitle || `Row (${block.children?.length || parsedOptions.length || 3} items)`}
                      </span>
                    </div>
                    <div className="flex flex-row items-center flex-wrap sm:flex-nowrap gap-2 overflow-x-auto">
                      {block.children && block.children.length > 0
                        ? block.children.map((child, cIdx) =>
                            renderChildWidget(child, block, cIdx, {
                              flex: child.type === 'ui-vertical-divider' ? '0 0 auto' : '1 1 0%',
                            })
                          )
                        : (parsedOptions.length > 0 ? parsedOptions : ['Widget 1', 'Widget 2', 'Widget 3']).map(
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
                    onDragOver={(e) => handleContainerDragOver(e, block.id)}
                    onDragLeave={() => dragOverContainerId === block.id && setDragOverContainerId(null)}
                    onDrop={(e) => void handleContainerDrop(e, block.id)}
                    style={{
                      ...surfaceStyle,
                      borderWidth: block.style?.borderWidth || '1px',
                    }}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border ${
                      dragOverContainerId === block.id
                        ? 'border-[#4D97FF] ring-2 ring-[#4D97FF]/50'
                        : 'border-white/10'
                    } space-y-2`}
                  >
                    <div style={subtitleStyle} className="text-[10px] font-mono text-sky-400">
                      {block.subtitle || 'Vertical Column Stack'}
                    </div>
                    <div className="flex flex-col gap-2">
                      {block.children && block.children.length > 0
                        ? block.children.map((child, cIdx) => renderChildWidget(child, block, cIdx))
                        : (parsedOptions.length > 0
                            ? parsedOptions
                            : ['Top Widget', 'Middle Widget', 'Bottom Widget']
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

              {/* 1g2. STACK (OVERLAPPING LAYERS) */}
              {block.type === 'ui-stack' && (
                <div className="px-5 py-1.5">
                  <div
                    onDragOver={(e) => handleContainerDragOver(e, block.id)}
                    onDragLeave={() => dragOverContainerId === block.id && setDragOverContainerId(null)}
                    onDrop={(e) => void handleContainerDrop(e, block.id)}
                    style={{
                      ...surfaceStyle,
                      minHeight: block.style?.height && block.style.height !== 'auto' ? block.style.height : '180px',
                    }}
                    className={`relative overflow-hidden ${customRadius} border ${
                      dragOverContainerId === block.id
                        ? 'border-[#4D97FF] ring-2 ring-[#4D97FF]/50'
                        : 'border-white/15'
                    } flex flex-col justify-end p-4`}
                  >
                    {/* Base Layer: Image or Gradient */}
                    {block.imageUrl ? (
                      <img
                        src={block.imageUrl}
                        alt={displayContent}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/70 via-slate-900 to-sky-700/60" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15" />

                    {/* Top-Right Overlapping Badge Layer */}
                    {block.badgeText !== '' && (
                      <span
                        style={{ backgroundColor: resolvedAccent }}
                        className="absolute top-3 right-3 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow"
                      >
                        {block.badgeText || 'LIVE'}
                      </span>
                    )}

                    {/* Top-Left Overlapping Icon Layer */}
                    <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-xl bg-black/45 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                      {renderVectorIcon(block.iconName || 'sparkles', 'w-4 h-4')}
                    </div>

                    {/* Foreground Overlapping Text / Children */}
                    <div className="relative z-10 space-y-1.5 pt-10">
                      <h4
                        style={primaryStyle}
                        className={`${customFont || 'text-sm'} ${customWeight || 'font-bold'} ${
                          customTextColor || 'text-white'
                        }`}
                      >
                        {displayContent}
                      </h4>
                      {block.subtitle && (
                        <p style={subtitleStyle} className="text-[11px] text-slate-200/90">
                          {block.subtitle}
                        </p>
                      )}
                      {block.children && block.children.length > 0 && (
                        <div className="pt-1.5 flex flex-wrap items-center gap-2">
                          {block.children.map((child, cIdx) => renderChildWidget(child, block, cIdx))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 1g3. LISTVIEW (SCROLLABLE LIST) */}
              {block.type === 'ui-listview' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 space-y-2`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-sky-400">
                      <span>ListView · {block.direction === 'horizontal' ? 'Horizontal Scroll' : 'Vertical Scroll'}</span>
                      <span className="text-slate-500">{parsedOptions.length || 5} items</span>
                    </div>
                    <div
                      className={
                        block.direction === 'horizontal'
                          ? 'flex flex-row gap-2.5 overflow-x-auto pb-1.5'
                          : 'flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1'
                      }
                    >
                      {(parsedOptions.length > 0
                        ? parsedOptions
                        : ['Alex Rivera · Hey there!', 'Sarah Chen · Ready to deploy', 'Design Team · Synced']
                      ).map((raw, idx) => {
                        const [titlePart, subPart] = raw.split('·').map((s) => s.trim());
                        const initials = (titlePart || 'U').slice(0, 2).toUpperCase();
                        return (
                          <div
                            key={`${raw}_${idx}`}
                            className={`${
                              block.direction === 'horizontal' ? 'min-w-[180px] shrink-0' : 'w-full'
                            } px-3 py-2 rounded-xl bg-[#090B10] border border-white/10 flex items-center gap-2.5 hover:border-white/25 transition-colors`}
                          >
                            <div
                              style={{ backgroundColor: resolvedAccent }}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            >
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-semibold text-white truncate">{titlePart}</p>
                              {subPart && (
                                <p className="text-[10px] text-slate-400 truncate">{subPart}</p>
                              )}
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 1h. GRIDVIEW (SCROLLABLE GRID) */}
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
                        {block.subtitle || `GridView (${block.gridColumns === 3 ? '3 Columns' : '2 Columns'})`}
                      </span>
                    </div>
                    <div
                      className={`grid gap-2 max-h-64 overflow-y-auto pr-0.5 ${
                        block.gridColumns === 3 ? 'grid-cols-3' : 'grid-cols-2'
                      }`}
                    >
                      {(parsedOptions.length > 0
                        ? parsedOptions
                        : ['Gallery 01', 'Gallery 02', 'Gallery 03', 'Gallery 04']
                      ).map((cell, idx) => (
                        <div
                          key={`${cell}_${idx}`}
                          style={primaryStyle}
                          className={`p-3 rounded-xl bg-[#090B10] border border-white/10 text-[11px] font-semibold ${
                            customTextColor || 'text-white'
                          } flex flex-col gap-1.5`}
                        >
                          <div className="h-12 rounded-lg bg-gradient-to-br from-indigo-500/25 via-sky-500/15 to-transparent border border-white/5 flex items-center justify-center text-sky-300">
                            <ImageIcon className="w-4 h-4 opacity-70" />
                          </div>
                          <span className="truncate">{cell}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 1h2. SPACER */}
              {block.type === 'ui-spacer' && (
                <div className="px-5">
                  <div
                    style={{ height: `${block.spacerSize ?? 32}px` }}
                    className={`w-full flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border border-dashed border-sky-400/50 bg-sky-500/5 rounded-lg'
                        : 'border border-dashed border-transparent hover:border-white/10 rounded-lg'
                    }`}
                  >
                    {isSelected && (
                      <span className="text-[9px] font-mono text-sky-300 bg-[#090B10]/90 px-2 py-0.5 rounded">
                        Spacer · {block.spacerSize ?? 32}px
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 1h3. DIVIDER (HORIZONTAL LINE) */}
              {block.type === 'ui-divider' && (
                <div className="px-5 py-2">
                  <hr
                    style={{
                      borderColor: block.style?.borderColor || 'rgba(255,255,255,0.18)',
                      borderTopWidth: block.style?.borderWidth || '1px',
                    }}
                    className="w-full border-0 border-t"
                  />
                </div>
              )}

              {/* 1h4. VERTICAL DIVIDER */}
              {block.type === 'ui-vertical-divider' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-white/[0.03]'
                    } border border-white/10 flex items-stretch gap-3`}
                  >
                    <div className="flex-1 text-xs text-slate-200 flex items-center justify-center py-2">
                      {parsedOptions[0] || 'Left Panel Content'}
                    </div>
                    <div
                      style={{
                        borderColor: block.style?.borderColor || 'rgba(255,255,255,0.22)',
                        borderLeftWidth: block.style?.borderWidth || '1px',
                      }}
                      className="border-l self-stretch min-h-[36px]"
                    />
                    <div className="flex-1 text-xs text-slate-200 flex items-center justify-center py-2">
                      {parsedOptions[1] || 'Right Panel Content'}
                    </div>
                  </div>
                </div>
              )}

              {/* 1h5. PAGEVIEW (SWIPEABLE ONBOARDING PAGES) */}
              {block.type === 'ui-pageview' && (
                <div className="px-5 py-1.5">
                  {(() => {
                    const slides =
                      parsedOptions.length > 0
                        ? parsedOptions
                        : [
                            'Welcome to Studio · Drag & drop layouts effortlessly',
                            'Interactive Logic · Connect events & live data',
                            'Instant Export · Ship clean production code',
                          ];
                    const activeSlide = Math.max(
                      0,
                      Math.min(slides.length - 1, block.counterValue ?? 0)
                    );
                    const [slideTitle, slideSub] = slides[activeSlide].split('·').map((s) => s.trim());
                    return (
                      <div
                        style={surfaceStyle}
                        onPointerDown={(e) => {
                          pageDragStartX.current[block.id] = e.clientX;
                        }}
                        onPointerUp={(e) => {
                          const startX = pageDragStartX.current[block.id];
                          pageDragStartX.current[block.id] = null;
                          if (startX == null) return;
                          const dx = e.clientX - startX;
                          if (dx < -40 && activeSlide < slides.length - 1) {
                            onUpdateBlock({ ...block, counterValue: activeSlide + 1 });
                          } else if (dx > 40 && activeSlide > 0) {
                            onUpdateBlock({ ...block, counterValue: activeSlide - 1 });
                          }
                        }}
                        className={`${customPad || 'p-4'} ${customRadius} ${
                          customBg || 'bg-gradient-to-br from-indigo-950/60 via-[#121726] to-slate-900'
                        } border border-white/15 space-y-3 select-none`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-sky-300">
                          <span>PageView (Swipe left/right)</span>
                          <span>
                            Page {activeSlide + 1} / {slides.length}
                          </span>
                        </div>
                        <div className="min-h-[84px] rounded-xl bg-[#090B10]/70 border border-white/10 p-4 flex flex-col items-center justify-center text-center space-y-1.5">
                          <h4 className="text-sm font-bold text-white">{slideTitle}</h4>
                          {slideSub && <p className="text-[11px] text-slate-300">{slideSub}</p>}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            disabled={activeSlide === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateBlock({ ...block, counterValue: Math.max(0, activeSlide - 1) });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-[10px] font-semibold text-white cursor-pointer flex items-center gap-1"
                          >
                            <ChevronLeft className="w-3 h-3" /> Prev
                          </button>
                          <div className="flex items-center gap-1.5">
                            {slides.map((_, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateBlock({ ...block, counterValue: sIdx });
                                }}
                                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                  sIdx === activeSlide ? 'w-5 bg-[#4D97FF]' : 'w-1.5 bg-white/25'
                                }`}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            disabled={activeSlide === slides.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateBlock({
                                ...block,
                                counterValue: Math.min(slides.length - 1, activeSlide + 1),
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-[10px] font-semibold text-white cursor-pointer flex items-center gap-1"
                          >
                            Next <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 1h6. CAROUSEL (HORIZONTAL IMAGE / CARD SLIDER) */}
              {block.type === 'ui-carousel' && (
                <div className="px-5 py-1.5">
                  {(() => {
                    const items =
                      parsedOptions.length > 0
                        ? parsedOptions
                        : ['Slide 1', 'Slide 2', 'Slide 3', 'Slide 4'];
                    const activeIdx = Math.max(0, Math.min(items.length - 1, block.counterValue ?? 0));
                    const scrollToSlide = (idx: number) => {
                      onUpdateBlock({ ...block, counterValue: idx });
                      const container = carouselRefs.current[block.id];
                      const el = container?.children?.[idx] as HTMLElement | undefined;
                      el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    };
                    return (
                      <div
                        style={surfaceStyle}
                        className={`${customPad || 'p-3'} ${customRadius} ${
                          customBg || 'bg-white/[0.04]'
                        } border border-white/10 space-y-2.5`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-sky-400">
                          <span>Carousel Slider</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                scrollToSlide((activeIdx - 1 + items.length) % items.length);
                              }}
                              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                scrollToSlide((activeIdx + 1) % items.length);
                              }}
                              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div
                          ref={(el) => {
                            carouselRefs.current[block.id] = el;
                          }}
                          className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-1"
                        >
                          {items.map((slideLabel, idx) => (
                            <div
                              key={`${slideLabel}_${idx}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                scrollToSlide(idx);
                              }}
                              className={`min-w-[78%] snap-center rounded-xl p-4 border transition-all cursor-pointer ${
                                idx === activeIdx
                                  ? 'border-[#4D97FF] bg-gradient-to-br from-indigo-900/60 to-slate-900'
                                  : 'border-white/10 bg-[#090B10]'
                              }`}
                            >
                              <div className="h-20 rounded-lg bg-gradient-to-tr from-sky-500/20 via-indigo-500/20 to-purple-500/20 border border-white/10 mb-2 flex items-center justify-center text-sky-300">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                              <p className="text-xs font-bold text-white truncate">{slideLabel}</p>
                              <p className="text-[10px] text-slate-400">Slide #{idx + 1}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 1h7. WRAP (AUTO WRAPPING FLOW) */}
              {block.type === 'ui-wrap' && (
                <div className="px-5 py-1.5">
                  <div
                    onDragOver={(e) => handleContainerDragOver(e, block.id)}
                    onDragLeave={() => dragOverContainerId === block.id && setDragOverContainerId(null)}
                    onDrop={(e) => void handleContainerDrop(e, block.id)}
                    style={surfaceStyle}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border ${
                      dragOverContainerId === block.id
                        ? 'border-[#4D97FF] ring-2 ring-[#4D97FF]/50'
                        : 'border-white/10'
                    } space-y-2`}
                  >
                    <div className="text-[10px] font-mono text-sky-400">
                      {block.subtitle || 'Wrap (Auto wraps items to next line)'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {block.children && block.children.length > 0
                        ? block.children.map((child, cIdx) => renderChildWidget(child, block, cIdx))
                        : (parsedOptions.length > 0
                            ? parsedOptions
                            : ['UI Design', 'React', 'Tailwind', 'TypeScript', 'Firebase', 'Mobile']
                          ).map((chip, idx) => (
                            <span
                              key={`${chip}_${idx}`}
                              style={primaryStyle}
                              className="px-3 py-1 rounded-full bg-[#090B10] border border-white/15 text-[11px] font-medium text-slate-200"
                            >
                              {chip}
                            </span>
                          ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 1h8. FORM VALIDATION */}
              {block.type === 'ui-form' && (
                <div className="px-5 py-1.5">
                  {(() => {
                    const draft = formDrafts[block.id] || { name: '', email: '', password: '' };
                    const errs = formErrors[block.id] || {};
                    const handleValidateForm = (e: React.FormEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const nextErrs: {
                        name?: string;
                        email?: string;
                        password?: string;
                        submitted?: boolean;
                      } = {};
                      if (!draft.name.trim()) {
                        nextErrs.name = 'Name is required (cannot be empty)';
                      }
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
                        nextErrs.email = 'Please enter a valid email address';
                      }
                      if (!draft.password || draft.password.length < 6) {
                        nextErrs.password = 'Password must be at least 6 characters';
                      }
                      if (!nextErrs.name && !nextErrs.email && !nextErrs.password) {
                        nextErrs.submitted = true;
                        onTriggerAction(block, {
                          ...formInputs,
                          [`${block.id}_name`]: draft.name,
                          [`${block.id}_email`]: draft.email,
                        });
                      }
                      setFormErrors((prev) => ({ ...prev, [block.id]: nextErrs }));
                    };

                    return (
                      <form
                        onSubmit={handleValidateForm}
                        onClick={(e) => e.stopPropagation()}
                        style={surfaceStyle}
                        className={`${customPad || 'p-4'} ${customRadius} ${
                          customBg || 'bg-white/[0.04]'
                        } border border-white/15 space-y-2.5`}
                      >
                        <div>
                          <h4
                            style={primaryStyle}
                            className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${customTextColor || 'text-white'}`}
                          >
                            {displayContent}
                          </h4>
                          {block.subtitle && (
                            <p style={subtitleStyle} className="text-[10px] text-slate-400">
                              {block.subtitle}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={draft.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormDrafts((p) => ({ ...p, [block.id]: { ...draft, name: val } }));
                            }}
                            placeholder="Full Name *"
                            className="w-full px-3 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-xs text-white outline-none focus:border-[#4D97FF]"
                          />
                          {errs.name && <p className="text-[10px] text-rose-400">{errs.name}</p>}
                        </div>
                        <div className="space-y-1">
                          <input
                            type="email"
                            value={draft.email}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormDrafts((p) => ({ ...p, [block.id]: { ...draft, email: val } }));
                            }}
                            placeholder="Email Address * (e.g. user@mail.com)"
                            className="w-full px-3 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-xs text-white outline-none focus:border-[#4D97FF]"
                          />
                          {errs.email && <p className="text-[10px] text-rose-400">{errs.email}</p>}
                        </div>
                        <div className="space-y-1">
                          <input
                            type="password"
                            value={draft.password}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormDrafts((p) => ({
                                ...p,
                                [block.id]: { ...draft, password: val },
                              }));
                            }}
                            placeholder="Password * (min 6 chars)"
                            className="w-full px-3 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-xs text-white outline-none focus:border-[#4D97FF]"
                          />
                          {errs.password && (
                            <p className="text-[10px] text-rose-400">{errs.password}</p>
                          )}
                        </div>
                        {errs.submitted && (
                          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            <span>Form validated &amp; submitted successfully!</span>
                          </div>
                        )}
                        <button
                          type="submit"
                          style={{
                            backgroundColor: resolvedAccent,
                            ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
                            ...(block.style?.boxShadow ? { boxShadow: block.style.boxShadow } : {}),
                          }}
                          className={`w-full py-2 ${customRadius} ${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${customTextColor || 'text-white'} cursor-pointer hover:opacity-90 transition-opacity`}
                        >
                          <span style={primaryStyle}>{block.badgeText || 'Validate & Submit'}</span>
                        </button>
                      </form>
                    );
                  })()}
                </div>
              )}

              {/* 1h9. STAGGEREDVIEW (PINTEREST MASONRY) */}
              {block.type === 'ui-staggered' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 space-y-2`}
                  >
                    <div className="text-[10px] font-mono text-sky-400">
                      StaggeredView (Masonry Grid)
                    </div>
                    <div className={`${block.gridColumns === 3 ? 'columns-3' : 'columns-2'} gap-2 space-y-2`}>
                      {(parsedOptions.length > 0
                        ? parsedOptions
                        : ['Tile 1', 'Tile 2', 'Tile 3', 'Tile 4', 'Tile 5', 'Tile 6']
                      ).map((tile, idx) => {
                        const heights = ['h-24', 'h-36', 'h-28', 'h-40', 'h-24', 'h-32'];
                        return (
                          <div
                            key={`${tile}_${idx}`}
                            className={`break-inside-avoid rounded-xl p-3 bg-[#090B10] border border-white/10 flex flex-col justify-between ${
                              heights[idx % heights.length]
                            }`}
                          >
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-[10px] font-bold">
                              {idx + 1}
                            </div>
                            <span className="text-[11px] font-semibold text-white leading-tight">
                              {tile}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 1h10. FLIPPABLE CARD (3D FRONT & BACK) */}
              {block.type === 'ui-flippable-card' && (
                <div className="px-5 py-1.5">
                  {(() => {
                    const isFlipped = Boolean(flippedCards[block.id]);
                    return (
                      <div
                        style={{ perspective: '1000px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBlock(block.id);
                          setFlippedCards((p) => ({ ...p, [block.id]: !isFlipped }));
                        }}
                        className="cursor-pointer"
                      >
                        <div
                          style={{
                            transformStyle: 'preserve-3d',
                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                            transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                          }}
                          className="relative min-h-[136px]"
                        >
                          {/* Front */}
                          <div
                            style={{
                              ...surfaceStyle,
                              backfaceVisibility: 'hidden',
                            }}
                            className={`absolute inset-0 ${customPad || 'p-5'} ${customRadius} ${
                              customBg || 'bg-gradient-to-br from-[#161c2c] to-[#0d111a]'
                            } border border-white/15 flex flex-col justify-between`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-mono uppercase tracking-wider text-sky-400">
                                Front Side
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] text-slate-300">
                                {block.badgeText || 'Click to Flip'}
                              </span>
                            </div>
                            <div>
                              <h4
                                style={primaryStyle}
                                className={`${customFont || 'text-sm'} ${customWeight || 'font-bold'} ${customTextColor || 'text-white'}`}
                              >
                                {displayContent}
                              </h4>
                              {block.subtitle && (
                                <p style={subtitleStyle} className="text-[11px] text-slate-400 mt-1">
                                  {block.subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Back */}
                          <div
                            style={{
                              ...surfaceStyle,
                              backfaceVisibility: 'hidden',
                              transform: 'rotateY(180deg)',
                            }}
                            className={`absolute inset-0 ${customPad || 'p-5'} ${customRadius} bg-gradient-to-br from-indigo-950/90 to-slate-900 border border-indigo-400/35 flex flex-col justify-between`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-mono uppercase tracking-wider text-indigo-300">
                                Back Side
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-[9px] text-indigo-200">
                                Flip Back
                              </span>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">
                                {block.backTitle || 'Back Side · Revealed Answer'}
                              </h4>
                              <p className="text-[11px] text-slate-300 mt-1">
                                {block.backSubtitle ||
                                  'Tap again to flip back to the front side.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 1h11. SWIPEABLE STACK */}
              {block.type === 'ui-swipeable-stack' && (
                <div className="px-5 py-1.5">
                  {(() => {
                    const cards =
                      parsedOptions.length > 0
                        ? parsedOptions
                        : ['Card 1 · Design', 'Card 2 · Prototype', 'Card 3 · Launch'];
                    const topIdx = swipeIndex[block.id] ?? 0;
                    const remaining = cards.slice(topIdx);
                    const dragOffset = swipeDragX[block.id] ?? 0;

                    const advanceCard = () => {
                      setSwipeDragX((p) => ({ ...p, [block.id]: 0 }));
                      setSwipeIndex((p) => ({ ...p, [block.id]: topIdx + 1 }));
                    };

                    return (
                      <div
                        style={surfaceStyle}
                        className={`${customPad || 'p-4'} ${customRadius} ${
                          customBg || 'bg-white/[0.04]'
                        } border border-white/10 space-y-3`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-sky-400">
                          <span>SwipeableStack</span>
                          <span>
                            {Math.min(topIdx, cards.length)} / {cards.length} swiped
                          </span>
                        </div>

                        {remaining.length === 0 ? (
                          <div className="h-32 rounded-xl bg-[#090B10] border border-dashed border-white/15 flex flex-col items-center justify-center gap-2 text-center p-4">
                            <p className="text-xs text-slate-300 font-semibold">
                              All cards swiped!
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSwipeIndex((p) => ({ ...p, [block.id]: 0 }));
                              }}
                              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold cursor-pointer"
                            >
                              Reset Stack
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="relative h-36 select-none">
                              {remaining
                                .slice(0, 3)
                                .reverse()
                                .map((cardLabel, revIdx, arr) => {
                                  const layerIdx = arr.length - 1 - revIdx;
                                  const isTop = layerIdx === 0;
                                  return (
                                    <div
                                      key={`${cardLabel}_${topIdx + layerIdx}`}
                                      onPointerDown={
                                        isTop
                                          ? (e) => {
                                              pageDragStartX.current[block.id] = e.clientX;
                                            }
                                          : undefined
                                      }
                                      onPointerMove={
                                        isTop
                                          ? (e) => {
                                              const sx = pageDragStartX.current[block.id];
                                              if (sx != null) {
                                                setSwipeDragX((p) => ({
                                                  ...p,
                                                  [block.id]: e.clientX - sx,
                                                }));
                                              }
                                            }
                                          : undefined
                                      }
                                      onPointerUp={
                                        isTop
                                          ? () => {
                                              const sx = pageDragStartX.current[block.id];
                                              pageDragStartX.current[block.id] = null;
                                              if (sx != null && Math.abs(dragOffset) > 45) {
                                                advanceCard();
                                              } else {
                                                setSwipeDragX((p) => ({ ...p, [block.id]: 0 }));
                                              }
                                            }
                                          : undefined
                                      }
                                      style={{
                                        transform: isTop
                                          ? `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`
                                          : `translateY(${layerIdx * 8}px) scale(${1 - layerIdx * 0.04})`,
                                        zIndex: 10 - layerIdx,
                                        transition: isTop && dragOffset !== 0 ? 'none' : 'transform 0.25s ease',
                                      }}
                                      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1b2234] to-[#0c1018] border border-white/15 p-4 shadow-xl flex flex-col justify-between cursor-grab active:cursor-grabbing"
                                    >
                                      <span className="text-[10px] font-mono text-sky-400">
                                        Card #{topIdx + layerIdx + 1}
                                      </span>
                                      <div>
                                        <p className="text-sm font-bold text-white">{cardLabel}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                          Drag card or click Swipe below
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                            <div className="flex items-center justify-center gap-2 pt-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  advanceCard();
                                }}
                                className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 text-[11px] font-semibold cursor-pointer"
                              >
                                &larr; Swipe Left
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  advanceCard();
                                }}
                                className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-[11px] font-semibold cursor-pointer"
                              >
                                Swipe Right &rarr;
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 1h12. DATATABLE */}
              {block.type === 'ui-datatable' && (
                <div className="px-5 py-1.5">
                  {(() => {
                    const headers = (block.columnsHeader || 'Name | Role | Status')
                      .split('|')
                      .map((h) => h.trim())
                      .filter(Boolean);
                    const rows = (
                      parsedOptions.length > 0
                        ? parsedOptions
                        : ['Deepal P. | Architect | Active', 'Maya Lin | UI Lead | Active']
                    ).map((r) => r.split('|').map((c) => c.trim()));
                    return (
                      <div
                        style={surfaceStyle}
                        className={`${customPad || 'p-3'} ${customRadius} ${
                          customBg || 'bg-white/[0.04]'
                        } border border-white/10 overflow-x-auto`}
                      >
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b border-white/15 text-sky-300 font-semibold">
                              {headers.map((h, i) => (
                                <th key={i} className="py-2 px-2.5 whitespace-nowrap">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {rows.map((cells, rIdx) => (
                              <tr key={rIdx} className="hover:bg-white/[0.03]">
                                {headers.map((_, cIdx) => (
                                  <td key={cIdx} className="py-2 px-2.5 text-slate-200 whitespace-nowrap">
                                    {cells[cIdx] || '—'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 1h13. FLEX (PROPORTIONAL RATIO ROW/COLUMN) */}
              {block.type === 'ui-flex' && (
                <div className="px-5 py-1.5">
                  {(() => {
                    const isCol = block.direction === 'column' || block.direction === 'vertical';
                    const ratios = (block.flexRatios || '1:2:1')
                      .split(/[:,\s]+/)
                      .map((n) => Math.max(1, Number(n) || 1));
                    return (
                      <div
                        onDragOver={(e) => handleContainerDragOver(e, block.id)}
                        onDragLeave={() => dragOverContainerId === block.id && setDragOverContainerId(null)}
                        onDrop={(e) => void handleContainerDrop(e, block.id)}
                        style={surfaceStyle}
                        className={`${customPad || 'p-3.5'} ${customRadius} ${
                          customBg || 'bg-white/[0.04]'
                        } border ${
                          dragOverContainerId === block.id
                            ? 'border-[#4D97FF] ring-2 ring-[#4D97FF]/50'
                            : 'border-white/10'
                        } space-y-2`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-sky-400">
                          <span>Flex ({isCol ? 'Column' : 'Row'})</span>
                          <span>Ratio: {block.flexRatios || '1:2:1'}</span>
                        </div>
                        <div className={`flex gap-2 ${isCol ? 'flex-col' : 'flex-row items-stretch'}`}>
                          {block.children && block.children.length > 0
                            ? block.children.map((child, cIdx) =>
                                renderChildWidget(child, block, cIdx, {
                                  flex: `${ratios[cIdx] ?? 1} 1 0%`,
                                })
                              )
                            : (parsedOptions.length > 0
                                ? parsedOptions
                                : ['Pane 1 (1x)', 'Pane 2 (2x)', 'Pane 3 (1x)']
                              ).map((item, idx) => (
                                <div
                                  key={`${item}_${idx}`}
                                  style={{ ...primaryStyle, flex: `${ratios[idx] ?? 1} 1 0%` }}
                                  className={`min-w-0 p-2.5 rounded-lg bg-[#090B10] border border-white/10 ${customFont || 'text-[11px]'} ${customWeight || 'font-semibold'} ${customTextColor || 'text-white'} text-center truncate`}
                                >
                                  {item}
                                </div>
                              ))}
                        </div>
                      </div>
                    );
                  })()}
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
                      <p
                        style={primaryStyle}
                        className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${customTextColor || 'text-white'} truncate`}
                      >
                        {displayContent}
                      </p>
                      <p style={subtitleStyle} className="text-[10px] text-indigo-300 truncate">
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
                      style={{ ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}) }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold cursor-pointer shrink-0"
                    >
                      <span style={primaryStyle}>
                        {(runtimeState.openModals?.[block.id] ?? block.isExpanded)
                          ? 'Close Modal'
                          : block.badgeText || 'Open Dialog'}
                      </span>
                    </button>
                  </div>

                  {(runtimeState.openModals?.[block.id] ?? block.isExpanded) && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 p-4 rounded-xl bg-[#111827] border border-indigo-400/50 shadow-2xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4
                          style={primaryStyle}
                          className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${customTextColor || 'text-white'}`}
                        >
                          {displayContent}
                        </h4>
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
                    onDragOver={(e) => handleContainerDragOver(e, block.id)}
                    onDragLeave={() => dragOverContainerId === block.id && setDragOverContainerId(null)}
                    onDrop={(e) => void handleContainerDrop(e, block.id)}
                    style={{
                      boxShadow: block.style?.boxShadow || '0 14px 34px rgba(0, 0, 0, 0.4)',
                      ...surfaceStyle,
                    }}
                    className={`${customPad || 'p-4'} ${customRadius || 'rounded-2xl'} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 space-y-2 ${alignClass}`}
                  >
                    {block.imageUrl && (
                      <img
                        src={block.imageUrl}
                        alt={displayContent}
                        className="w-full h-32 object-cover rounded-xl border border-white/10"
                      />
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        style={primaryStyle}
                        className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                          customTextColor || 'text-white'
                        }`}
                      >
                        {displayContent}
                      </h3>
                      {block.badgeText && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shrink-0">
                          {block.badgeText}
                        </span>
                      )}
                    </div>
                    {block.subtitle && (
                      <p style={subtitleStyle} className="text-[11px] text-slate-400 leading-relaxed">
                        {block.subtitle}
                      </p>
                    )}
                    {block.children && block.children.length > 0 && (
                      <div className="pt-1 space-y-2">
                        {block.children.map((child, cIdx) => renderChildWidget(child, block, cIdx))}
                      </div>
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
                          <p style={subtitleStyle} className="text-[10px] font-semibold text-slate-400">
                            {block.subtitle}
                          </p>
                        )}
                        {(parsedOptions.length > 0 ? parsedOptions : ['Choice A', 'Choice B']).map(
                          (choice) => {
                            const selected = (formInputs[block.id] || parsedOptions[0]) === choice;
                            return (
                              <label
                                key={choice}
                                onClick={(e) => e.stopPropagation()}
                                style={primaryStyle}
                                className={`flex items-center gap-2 ${customFont || 'text-xs'} ${customWeight} ${
                                  customTextColor || 'text-slate-200'
                                } cursor-pointer`}
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
                          <p
                            style={primaryStyle}
                            className={`${customFont || 'text-xs'} ${customWeight || 'font-semibold'} ${
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
                          <p
                            style={primaryStyle}
                            className={`${customFont || 'text-xs'} ${customWeight || 'font-medium'} ${
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
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* 11c2. CHECKBOX LIST TILE */}
              {block.type === 'ui-checkbox-tile' && (
                <div className="px-5 py-1.5">
                  <label
                    onClick={(e) => e.stopPropagation()}
                    style={surfaceStyle}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border ${
                      block.isExpanded ? 'border-indigo-400/40' : 'border-white/10'
                    } flex items-center justify-between gap-3 cursor-pointer transition-colors hover:bg-white/[0.06]`}
                  >
                    <div className="min-w-0">
                      <p
                        style={primaryStyle}
                        className={`${customFont || 'text-xs'} ${customWeight || 'font-semibold'} ${
                          customTextColor || 'text-white'
                        } truncate`}
                      >
                        {displayContent}
                      </p>
                      {block.subtitle && (
                        <p style={subtitleStyle} className="text-[10px] text-slate-400 truncate mt-0.5">
                          {block.subtitle}
                        </p>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(block.isExpanded)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        onUpdateBlock({ ...block, isExpanded: checked });
                        setFormInput(block.id, checked ? 'Checked' : 'Unchecked', true);
                      }}
                      className="w-4 h-4 accent-indigo-500 rounded shrink-0 cursor-pointer"
                    />
                  </label>
                </div>
              )}

              {/* 11c3. SWITCH LIST TILE */}
              {block.type === 'ui-switch-tile' && (
                <div className="px-5 py-1.5">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextState = !block.isExpanded;
                      onUpdateBlock({ ...block, isExpanded: nextState });
                      setFormInput(block.id, nextState ? 'Enabled' : 'Disabled', true);
                    }}
                    style={surfaceStyle}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border ${
                      block.isExpanded ? 'border-indigo-400/40' : 'border-white/10'
                    } flex items-center justify-between gap-3 cursor-pointer transition-colors hover:bg-white/[0.06]`}
                  >
                    <div className="min-w-0">
                      <p
                        style={primaryStyle}
                        className={`${customFont || 'text-xs'} ${customWeight || 'font-semibold'} ${
                          customTextColor || 'text-white'
                        } truncate`}
                      >
                        {displayContent}
                      </p>
                      {block.subtitle && (
                        <p style={subtitleStyle} className="text-[10px] text-slate-400 truncate mt-0.5">
                          {block.subtitle}
                        </p>
                      )}
                    </div>
                    <div
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                        block.isExpanded ? 'bg-indigo-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          block.isExpanded ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 11c4. PIN CODE / OTP */}
              {block.type === 'ui-pin-code' && (() => {
                const pinLen = Math.min(6, Math.max(4, block.counterValue ?? 4));
                const rawPin = (formInputs[block.id] || '').slice(0, pinLen);
                const isMasked = Boolean(pinMaskState[block.id]);
                const updatePinAt = (idx: number, char: string) => {
                  const arr = Array.from({ length: pinLen }, (_, i) => rawPin[i] || '');
                  arr[idx] = char.replace(/[^0-9a-zA-Z]/g, '').slice(-1);
                  const joined = arr.join('');
                  setFormInput(block.id, joined, true);
                  if (arr[idx] && idx < pinLen - 1) {
                    pinInputRefs.current[block.id]?.[idx + 1]?.focus();
                  }
                };
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 space-y-2.5`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span
                            style={primaryStyle}
                            className={`${customFont || 'text-xs'} ${customWeight || 'font-semibold'} ${
                              customTextColor || 'text-white'
                            } truncate`}
                          >
                            {displayContent}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPinMaskState((p) => ({ ...p, [block.id]: !p[block.id] }));
                          }}
                          className="text-[10px] font-mono text-slate-400 hover:text-white cursor-pointer"
                        >
                          {isMasked ? 'Show' : 'Hide'}
                        </button>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        {Array.from({ length: pinLen }, (_, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              if (!pinInputRefs.current[block.id]) pinInputRefs.current[block.id] = [];
                              pinInputRefs.current[block.id][idx] = el;
                            }}
                            type={isMasked ? 'password' : 'text'}
                            inputMode="numeric"
                            maxLength={1}
                            value={rawPin[idx] || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updatePinAt(idx, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Backspace' && !rawPin[idx] && idx > 0) {
                                pinInputRefs.current[block.id]?.[idx - 1]?.focus();
                              }
                            }}
                            className="w-10 h-11 rounded-xl bg-[#090B10] border border-white/20 focus:border-[#4D97FF] text-center text-base font-mono font-bold text-white outline-none"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 11c5. SLIDER */}
              {block.type === 'ui-slider' && (() => {
                const sliderVal = Number(formInputs[block.id] ?? block.progressValue ?? 65);
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 space-y-2`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          style={primaryStyle}
                          className={`${customFont || 'text-xs'} ${customWeight || 'font-semibold'} ${
                            customTextColor || 'text-white'
                          }`}
                        >
                          {displayContent}
                        </span>
                        <span
                          style={{ backgroundColor: resolvedAccent }}
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-white"
                        >
                          {sliderVal}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={sliderVal}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          onUpdateBlock({ ...block, progressValue: v });
                          setFormInput(block.id, String(v), true);
                        }}
                        style={{ accentColor: resolvedAccent }}
                        className="w-full cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-slate-500">
                        <span>0</span>
                        <span>50</span>
                        <span>100</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 11c6. RATING BAR */}
              {block.type === 'ui-rating-bar' && (() => {
                const currentRating = block.counterValue ?? 4;
                const activeHover = ratingHover[block.id] ?? 0;
                const displayStars = activeHover || currentRating;
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 flex items-center justify-between gap-3`}
                    >
                      <div className="min-w-0">
                        <p
                          style={primaryStyle}
                          className={`${customFont || 'text-xs'} ${customWeight || 'font-semibold'} ${
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
                      <div
                        className="flex items-center gap-1 shrink-0"
                        onMouseLeave={() => setRatingHover((p) => ({ ...p, [block.id]: 0 }))}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setRatingHover((p) => ({ ...p, [block.id]: star }))}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateBlock({ ...block, counterValue: star });
                              setFormInput(block.id, `${star} / 5 stars`, true);
                            }}
                            className="p-0.5 cursor-pointer transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                star <= displayStars
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="ml-1 text-[10px] font-mono text-amber-300 font-bold">
                          {currentRating}/5
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 11c7. CREDIT CARD FORM */}
              {block.type === 'ui-credit-card' && (() => {
                const cc = creditCardState[block.id] || {
                  number: '',
                  expiry: '',
                  cvc: '',
                  holder: '',
                };
                const patchCard = (patch: Partial<typeof cc>) => {
                  const next = { ...cc, ...patch };
                  setCreditCardState((p) => ({ ...p, [block.id]: next }));
                  const last4 = next.number.replace(/\s+/g, '').slice(-4);
                  setFormInput(
                    block.id,
                    last4 ? `Card •••• ${last4} (${next.expiry || 'MM/YY'})` : '',
                    true
                  );
                };
                const digits = cc.number.replace(/\D/g, '');
                const brand = digits.startsWith('4')
                  ? 'VISA'
                  : digits.startsWith('5')
                  ? 'MASTERCARD'
                  : digits.startsWith('3')
                  ? 'AMEX'
                  : block.badgeText || 'CARD';
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      onClick={(e) => e.stopPropagation()}
                      className={`${customPad || 'p-4'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 space-y-2.5`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-sky-400" />
                          <span
                            style={primaryStyle}
                            className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                              customTextColor || 'text-white'
                            }`}
                          >
                            {displayContent}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-[9px] font-mono font-bold text-indigo-300">
                          {brand}
                        </span>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={19}
                        value={cc.number}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                          const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
                          patchCard({ number: formatted });
                        }}
                        placeholder="4242 4242 4242 4242"
                        className="w-full rounded-lg bg-[#090B10] border border-white/15 px-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-[#4D97FF]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          maxLength={5}
                          value={cc.expiry}
                          onChange={(e) => {
                            const d = e.target.value.replace(/\D/g, '').slice(0, 4);
                            const formatted = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
                            patchCard({ expiry: formatted });
                          }}
                          placeholder="MM/YY"
                          className="w-full rounded-lg bg-[#090B10] border border-white/15 px-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-[#4D97FF]"
                        />
                        <input
                          type="password"
                          maxLength={4}
                          value={cc.cvc}
                          onChange={(e) =>
                            patchCard({ cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })
                          }
                          placeholder="CVC"
                          className="w-full rounded-lg bg-[#090B10] border border-white/15 px-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-[#4D97FF]"
                        />
                      </div>
                      <input
                        type="text"
                        value={cc.holder}
                        onChange={(e) => patchCard({ holder: e.target.value })}
                        placeholder="Cardholder Name"
                        className="w-full rounded-lg bg-[#090B10] border border-white/15 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#4D97FF]"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* 11c8. COUNTER BUTTON */}
              {block.type === 'ui-counter-button' && (() => {
                const val = block.counterValue ?? 2;
                const setCount = (nextVal: number) => {
                  const clamped = Math.max(0, nextVal);
                  onUpdateBlock({ ...block, counterValue: clamped });
                  setFormInput(block.id, String(clamped), true);
                };
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 flex items-center justify-between gap-3`}
                    >
                      <div className="min-w-0">
                        <p
                          style={primaryStyle}
                          className={`${customFont || 'text-xs'} ${customWeight || 'font-semibold'} ${
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
                      <div className="inline-flex items-center rounded-xl bg-[#090B10] border border-white/15 overflow-hidden shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCount(val - 1);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-mono font-bold text-white tabular-nums">
                          {val}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCount(val + 1);
                          }}
                          style={{ backgroundColor: resolvedAccent }}
                          className="w-8 h-8 flex items-center justify-center text-white hover:brightness-110 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 11c9. CHOICE CHIPS */}
              {block.type === 'ui-choice-chips' && (() => {
                const chips =
                  parsedOptions.length > 0
                    ? parsedOptions
                    : ['Design', 'Frontend', 'Mobile App', 'Backend API'];
                const activeChips = choiceChipsSelected[block.id] ?? [chips[0]];
                const toggleChip = (chip: string) => {
                  const exists = activeChips.includes(chip);
                  const next = exists
                    ? activeChips.filter((c) => c !== chip)
                    : [...activeChips, chip];
                  setChoiceChipsSelected((p) => ({ ...p, [block.id]: next }));
                  setFormInput(block.id, next.join(', '), true);
                };
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 space-y-2`}
                    >
                      <span
                        style={primaryStyle}
                        className={`${customFont || 'text-xs'} ${customWeight || 'font-semibold'} ${
                          customTextColor || 'text-white'
                        } block`}
                      >
                        {displayContent}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {chips.map((chip) => {
                          const isChosen = activeChips.includes(chip);
                          return (
                            <button
                              key={chip}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleChip(chip);
                              }}
                              style={{
                                ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
                                ...(isChosen
                                  ? {
                                      backgroundColor: block.style?.customBgHex || resolvedAccent,
                                      ...(block.style?.bgGradient ? { background: block.style.bgGradient } : {}),
                                      ...(block.style?.boxShadow ? { boxShadow: block.style.boxShadow } : {}),
                                    }
                                  : {}),
                              }}
                              className={`px-3 py-1 rounded-full ${customFont || 'text-[11px]'} ${
                                customWeight || 'font-medium'
                              } border transition-colors cursor-pointer ${
                                isChosen
                                  ? `${customTextColor || 'text-white'} border-transparent shadow-xs`
                                  : 'bg-[#090B10] border-white/15 text-slate-300 hover:border-white/30'
                              }`}
                            >
                              <span style={isChosen ? primaryStyle : undefined}>{chip}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 11c10. PLACE PICKER */}
              {block.type === 'ui-place-picker' && (() => {
                const places =
                  parsedOptions.length > 0
                    ? parsedOptions
                    : ['Colombo 03, Sri Lanka', 'Kandy City Center', 'Galle Fort'];
                const query = placePickerSearch[block.id] ?? '';
                const filteredPlaces = query.trim()
                  ? places.filter((pl) => pl.toLowerCase().includes(query.toLowerCase()))
                  : places;
                const pickedPlace = formInputs[block.id] || places[0];
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      onClick={(e) => e.stopPropagation()}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 space-y-2`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          style={primaryStyle}
                          className={`${customFont || 'text-xs'} ${customWeight || 'font-semibold'} ${
                            customTextColor || 'text-white'
                          } flex items-center gap-1.5`}
                        >
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          <span>{displayContent}</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-300 truncate max-w-[140px]">
                          {pickedPlace}
                        </span>
                      </div>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={query}
                          onChange={(e) =>
                            setPlacePickerSearch((p) => ({ ...p, [block.id]: e.target.value }))
                          }
                          placeholder="Search place or city..."
                          className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/15 text-xs text-white placeholder-slate-500 outline-none focus:border-[#4D97FF]"
                        />
                      </div>
                      <div className="space-y-1 max-h-28 overflow-y-auto">
                        {(filteredPlaces.length > 0 ? filteredPlaces : [query]).map((pl) => {
                          const isSelectedPlace = pickedPlace === pl;
                          return (
                            <button
                              key={pl}
                              type="button"
                              onClick={() => setFormInput(block.id, pl, true)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex items-center justify-between cursor-pointer transition-colors ${
                                isSelectedPlace
                                  ? 'bg-indigo-600/25 border border-indigo-400/40 text-white font-semibold'
                                  : 'bg-[#090B10]/70 border border-white/5 text-slate-300 hover:bg-white/5'
                              }`}
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                                <span className="truncate">{pl}</span>
                              </span>
                              {isSelectedPlace && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 11c11. CHECKBOX GROUP */}
              {block.type === 'ui-checkbox-group' && (() => {
                const choices =
                  parsedOptions.length > 0
                    ? parsedOptions
                    : ['UI/UX Prototyping', 'E-Commerce Store', 'SaaS Dashboard'];
                const checkedList = checkboxGroupSelected[block.id] ?? [choices[0]];
                const toggleItem = (item: string) => {
                  const exists = checkedList.includes(item);
                  const next = exists
                    ? checkedList.filter((i) => i !== item)
                    : [...checkedList, item];
                  setCheckboxGroupSelected((p) => ({ ...p, [block.id]: next }));
                  setFormInput(block.id, next.join(', '), true);
                };
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          style={primaryStyle}
                          className={`${customFont || 'text-xs'} ${customWeight || 'font-semibold'} ${
                            customTextColor || 'text-white'
                          }`}
                        >
                          {displayContent}
                        </span>
                        <span className="text-[10px] font-mono text-sky-300">
                          {checkedList.length}/{choices.length} selected
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {choices.map((item) => {
                          const isChecked = checkedList.includes(item);
                          return (
                            <label
                              key={item}
                              onClick={(e) => e.stopPropagation()}
                              style={primaryStyle}
                              className={`flex items-center gap-2 ${customFont || 'text-xs'} ${customWeight} ${
                                customTextColor || 'text-slate-200'
                              } cursor-pointer`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleItem(item)}
                                className="w-3.5 h-3.5 accent-indigo-500 rounded"
                              />
                              <span>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 11c12. SIGNATURE PAD */}
              {block.type === 'ui-signature' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-3.5'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 space-y-2`}
                  >
                    <div className="flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-sky-400" />
                      <span
                        style={primaryStyle}
                        className={`${customFont || 'text-xs'} ${customWeight || 'font-semibold'} ${
                          customTextColor || 'text-white'
                        }`}
                      >
                        {displayContent}
                      </span>
                    </div>
                    <SignaturePadWidget
                      blockId={block.id}
                      accentColor={resolvedAccent}
                      onSignedChange={(signed) =>
                        setFormInput(block.id, signed ? 'Signature Captured' : '', true)
                      }
                    />
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
                      <p style={subtitleStyle} className="text-[10px] font-semibold text-slate-400">
                        {block.subtitle}
                      </p>
                    )}
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-col items-center justify-center gap-1.5 py-2 cursor-pointer hover:text-sky-300 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-fuchsia-400" />
                      <span
                        style={primaryStyle}
                        className={`${customFont || 'text-xs'} ${customWeight || 'font-semibold'} ${
                          customTextColor || 'text-white'
                        }`}
                      >
                        {displayContent}
                      </span>
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

              {/* 12b. EXTENDED BASE ELEMENTS (34 Widgets) */}
              {block.type === 'ui-richtext' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-4'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 ${alignClass} space-y-1.5`}
                  >
                    <div
                      style={primaryStyle}
                      className={`${customFont || 'text-sm'} ${customWeight || 'font-normal'} ${
                        customTextColor || 'text-slate-100'
                      } leading-relaxed`}
                    >
                      {renderRichTextSpans(displayContent)}
                    </div>
                    {block.subtitle && (
                      <p style={subtitleStyle} className="text-[10px] text-slate-400">
                        {block.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {block.type === 'ui-icon-button' && (
                <div className={`px-5 py-1.5 ${alignClass}`}>
                  <div className="inline-flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={isDisabled}
                      title={displayContent}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBlock(block.id);
                        if (!isDisabled) onTriggerAction(block, formInputs);
                      }}
                      style={{
                        backgroundColor: block.style?.customBgHex || resolvedAccent,
                        ...(block.style?.bgGradient ? { background: block.style.bgGradient } : {}),
                        ...(block.style?.borderColor ? { borderColor: block.style.borderColor } : {}),
                        color: block.style?.customTextHex || '#ffffff',
                        boxShadow: block.style?.boxShadow,
                      }}
                      className={`w-11 h-11 ${
                        block.style?.borderRadius || 'rounded-full'
                      } flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:brightness-110 cursor-pointer border border-white/15`}
                    >
                      {renderVectorIcon(block.iconName || 'plus', 'w-5 h-5')}
                    </button>
                    {displayContent && (
                      <span
                        style={primaryStyle}
                        className={`${customFont || 'text-xs'} ${customWeight || 'font-medium'} ${
                          customTextColor || 'text-slate-300'
                        }`}
                      >
                        {displayContent}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {block.type === 'ui-list-tile' && (
                <div className="px-5 py-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBlock(block.id);
                      onTriggerAction(block, formInputs);
                    }}
                    style={surfaceStyle}
                    className={`w-full ${customPad || 'p-3'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10 hover:border-sky-400/40 flex items-center gap-3 text-left transition-all cursor-pointer`}
                  >
                    <div
                      style={{ backgroundColor: `${resolvedAccent}22`, color: resolvedAccent }}
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-white/10"
                    >
                      {renderVectorIcon(block.iconName || 'settings', 'w-4 h-4')}
                    </div>
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
                    {block.badgeText && (
                      <span
                        style={{ backgroundColor: resolvedAccent }}
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white shrink-0"
                      >
                        {block.badgeText}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                </div>
              )}

              {block.type === 'ui-slidable-tile' && (() => {
                const mode = slidableState[block.id] || 'closed';
                if (mode === 'deleted') {
                  return (
                    <div className="px-5 py-1.5">
                      <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between text-xs text-rose-200">
                        <span>Item archived/deleted</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSlidableState((p) => ({ ...p, [block.id]: 'closed' }));
                          }}
                          className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white cursor-pointer"
                        >
                          Undo
                        </button>
                      </div>
                    </div>
                  );
                }
                const actionsOpen = mode === 'actions';
                return (
                  <div className="px-5 py-1.5">
                    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0B0E14]">
                      <div className="absolute inset-y-0 right-0 flex items-stretch z-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSlidableEditingId(slidableEditingId === block.id ? null : block.id);
                          }}
                          className="px-3 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSlidableState((p) => ({ ...p, [block.id]: 'deleted' }));
                          }}
                          className="px-3 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                      <div
                        style={{
                          ...surfaceStyle,
                          transform: actionsOpen ? 'translateX(-118px)' : 'translateX(0px)',
                        }}
                        className={`relative z-10 ${customPad || 'p-3'} ${
                          customBg || 'bg-[#161B26]'
                        } flex items-center gap-3 transition-transform duration-200`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-300 shrink-0">
                          {renderVectorIcon(block.iconName || 'sparkles', 'w-4 h-4')}
                        </div>
                        <div className="min-w-0 flex-1">
                          {slidableEditingId === block.id ? (
                            <input
                              type="text"
                              value={block.content}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => onUpdateBlock({ ...block, content: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && setSlidableEditingId(null)}
                              className="w-full px-2 py-0.5 rounded bg-black/50 border border-sky-400 text-xs text-white outline-none"
                            />
                          ) : (
                            <p
                              style={primaryStyle}
                              className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                                customTextColor || 'text-white'
                              } truncate`}
                            >
                              {displayContent}
                            </p>
                          )}
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
                            setSlidableState((p) => ({
                              ...p,
                              [block.id]: actionsOpen ? 'closed' : 'actions',
                            }));
                          }}
                          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-sky-300 flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <ChevronLeft className={`w-3 h-3 transition-transform ${actionsOpen ? 'rotate-180' : ''}`} />
                          <span>{actionsOpen ? 'Close' : 'Slide'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-calendar' && (() => {
                const now = new Date();
                const cal = calendarMonth[block.id] || {
                  year: now.getFullYear(),
                  month: now.getMonth(),
                  day: now.getDate(),
                };
                const firstDayIdx = new Date(cal.year, cal.month, 1).getDay();
                const daysInMonth = new Date(cal.year, cal.month + 1, 0).getDate();
                const monthNames = [
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December',
                ];
                const eventDays = new Set(
                  (parsedOptions.length > 0 ? parsedOptions : ['5', '12', '18', '24'])
                    .map((s) => Number.parseInt(s, 10))
                    .filter((n) => !Number.isNaN(n))
                );
                const stepMonth = (delta: number) => {
                  const d = new Date(cal.year, cal.month + delta, 1);
                  setCalendarMonth((p) => ({
                    ...p,
                    [block.id]: { year: d.getFullYear(), month: d.getMonth(), day: 1 },
                  }));
                };
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 space-y-2.5`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            style={primaryStyle}
                            className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                              customTextColor || 'text-white'
                            }`}
                          >
                            {displayContent}
                          </p>
                          <p style={subtitleStyle} className="text-[10px] text-sky-300 font-semibold">
                            {monthNames[cal.month]} {cal.year} · Selected: {cal.day}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              stepMonth(-1);
                            }}
                            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              stepMonth(1);
                            }}
                            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-mono text-slate-400">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                          <div key={d} className="py-0.5">{d}</div>
                        ))}
                        {Array.from({ length: firstDayIdx }).map((_, idx) => (
                          <div key={`blank_${idx}`} />
                        ))}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                          const isSelectedDay = cal.day === dayNum;
                          const hasEvent = eventDays.has(dayNum);
                          return (
                            <button
                              key={dayNum}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCalendarMonth((p) => ({
                                  ...p,
                                  [block.id]: { ...cal, day: dayNum },
                                }));
                              }}
                              style={isSelectedDay ? { backgroundColor: resolvedAccent } : undefined}
                              className={`relative py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-colors ${
                                isSelectedDay
                                  ? 'text-white shadow'
                                  : 'text-slate-200 hover:bg-white/10'
                              }`}
                            >
                              {dayNum}
                              {hasEvent && (
                                <span
                                  className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                                    isSelectedDay ? 'bg-white' : 'bg-amber-400'
                                  }`}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {eventDays.has(cal.day) && (
                        <div className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 text-[10px] text-amber-200">
                          Event scheduled for {monthNames[cal.month]} {cal.day}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-toggle-icon' && (() => {
                const active = Boolean(block.isExpanded);
                const count = block.counterValue ?? 0;
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 flex items-center justify-between gap-3`}
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
                          onUpdateBlock({
                            ...block,
                            isExpanded: !active,
                            counterValue: active ? Math.max(0, count - 1) : count + 1,
                          });
                        }}
                        style={{
                          ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
                          ...(block.style?.bgGradient ? { background: block.style.bgGradient } : {}),
                          ...(block.style?.customBgHex ? { backgroundColor: block.style.customBgHex } : {}),
                          ...(block.style?.borderColor ? { borderColor: block.style.borderColor } : {}),
                          ...(block.style?.boxShadow ? { boxShadow: block.style.boxShadow } : {}),
                        }}
                        className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? 'bg-rose-500/20 border-rose-400/60 text-rose-300 scale-105'
                            : 'bg-white/5 border-white/15 text-slate-300 hover:text-white'
                        }`}
                      >
                        {renderVectorIcon(block.iconName || 'heart', 'w-4 h-4')}
                        <span style={primaryStyle} className="font-mono tabular-nums">
                          {count}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-audio-player' && (() => {
                const state = audioPlayState[block.id] || { playing: false, progress: 28, muted: false };
                const totalSec = 165;
                const currentSec = Math.round((state.progress / 100) * totalSec);
                const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
                const playToggle = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const nextPlaying = !state.playing;
                  const audioEl = audioRefs.current[block.id];
                  if (audioEl && block.videoUrl) {
                    if (nextPlaying) void audioEl.play().catch(() => {});
                    else audioEl.pause();
                  } else if (nextPlaying && !state.muted) {
                    try {
                      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                      const ctx = new AudioCtx();
                      const osc = ctx.createOscillator();
                      const gain = ctx.createGain();
                      osc.type = 'sine';
                      osc.frequency.setValueAtTime(440, ctx.currentTime);
                      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.18);
                      gain.gain.setValueAtTime(0.06, ctx.currentTime);
                      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
                      osc.connect(gain);
                      gain.connect(ctx.destination);
                      osc.start();
                      osc.stop(ctx.currentTime + 0.3);
                    } catch {
                      // ignore autoplay block
                    }
                  }
                  setAudioPlayState((p) => ({
                    ...p,
                    [block.id]: { ...state, playing: nextPlaying },
                  }));
                };
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 space-y-2.5`}
                    >
                      {block.videoUrl && (
                        <audio
                          ref={(el) => {
                            audioRefs.current[block.id] = el;
                          }}
                          src={block.videoUrl}
                          muted={state.muted}
                          onEnded={() =>
                            setAudioPlayState((p) => ({
                              ...p,
                              [block.id]: { ...state, playing: false, progress: 0 },
                            }))
                          }
                        />
                      )}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={playToggle}
                          style={{ backgroundColor: resolvedAccent }}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow shrink-0 cursor-pointer hover:brightness-110"
                        >
                          {state.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAudioPlayState((p) => ({
                              ...p,
                              [block.id]: { ...state, muted: !state.muted },
                            }));
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 cursor-pointer"
                        >
                          {state.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-end gap-1 h-7 px-1">
                        {[35, 65, 50, 90, 75, 45, 85, 60, 95, 70, 50, 80, 65, 92, 48, 72, 55, 84, 42, 60].map(
                          (h, idx) => {
                            const pct = (idx / 20) * 100;
                            const filled = pct <= state.progress;
                            return (
                              <div
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAudioPlayState((p) => ({
                                    ...p,
                                    [block.id]: { ...state, progress: Math.round(pct) },
                                  }));
                                }}
                                style={{
                                  height: `${state.playing ? Math.max(25, ((h + (state.progress % 30)) % 95)) : h}%`,
                                  backgroundColor: filled ? resolvedAccent : 'rgba(255,255,255,0.16)',
                                }}
                                className="flex-1 rounded-full transition-all duration-150 cursor-pointer"
                              />
                            );
                          }
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{fmt(currentSec)}</span>
                        <span>{fmt(totalSec)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-webview' && (() => {
                const rawUrl = webviewUrls[block.id] ?? block.actionPayload ?? block.content ?? 'https://example.com';
                const safeUrl = /^https?:\/\//i.test(rawUrl.trim())
                  ? rawUrl.trim()
                  : `https://${rawUrl.trim() || 'example.com'}`;
                const reloadNum = webviewReloadKey[block.id] || 0;
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`rounded-2xl overflow-hidden border border-white/15 bg-[#090C12] flex flex-col`}
                    >
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-2 bg-[#141923] border-b border-white/10 flex items-center gap-2"
                      >
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-rose-400/80" />
                          <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                          <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
                        </div>
                        <input
                          type="text"
                          value={rawUrl}
                          onChange={(e) =>
                            setWebviewUrls((p) => ({ ...p, [block.id]: e.target.value }))
                          }
                          className="flex-1 min-w-0 px-2 py-1 rounded bg-[#090B10] border border-white/10 text-[10px] font-mono text-sky-200 outline-none focus:border-sky-400"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setWebviewReloadKey((p) => ({ ...p, [block.id]: (p[block.id] || 0) + 1 }))
                          }
                          title="Reload WebView"
                          className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="relative h-48 bg-white">
                        <iframe
                          key={`${safeUrl}_${reloadNum}`}
                          src={safeUrl}
                          title={displayContent}
                          sandbox="allow-scripts allow-same-origin allow-forms"
                          className="w-full h-full border-0"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-static-map' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customRadius} overflow-hidden border border-white/15 bg-[#0E1624]`}
                  >
                    <div className="relative h-36 bg-[#131C2B] overflow-hidden select-none">
                      <svg viewBox="0 0 320 140" className="w-full h-full">
                        <rect width="320" height="140" fill="#131C2B" />
                        <path d="M0 30 H320 M0 75 H320 M0 112 H320" stroke="#1E293B" strokeWidth="5" />
                        <path d="M55 0 V140 M145 0 V140 M245 0 V140" stroke="#1E293B" strokeWidth="6" />
                        <path d="M0 95 Q160 65 320 98" stroke="#0284C7" strokeOpacity="0.4" strokeWidth="10" fill="none" />
                        <rect x="70" y="38" width="60" height="28" rx="4" fill="#14532D" fillOpacity="0.45" />
                        <rect x="160" y="80" width="70" height="25" rx="4" fill="#1E293B" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 rounded-full bg-rose-500/25 border border-rose-400 flex items-center justify-center text-rose-400 shadow-lg">
                          <MapPin className="w-4 h-4 fill-rose-500/40" />
                        </div>
                        <span
                          style={primaryStyle}
                          className={`mt-1 px-2 py-0.5 rounded bg-black/75 border border-white/15 ${
                            customFont || 'text-[10px]'
                          } ${customWeight || 'font-bold'} ${customTextColor || 'text-white'}`}
                        >
                          {displayContent}
                        </span>
                      </div>
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[8px] font-mono uppercase text-slate-300 border border-white/10">
                        Static Map
                      </span>
                    </div>
                    {block.subtitle && (
                      <div
                        style={subtitleStyle}
                        className="px-3 py-2 text-[10px] font-mono text-slate-400 border-t border-white/10"
                      >
                        {block.subtitle}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {block.type === 'ui-google-map' && (() => {
                const ms = mapViewState[block.id] || {
                  zoom: 1,
                  panX: 0,
                  panY: 0,
                  extraMarkers: [],
                  activeMarkerLabel: null,
                };
                const baseMarkers = (parsedOptions.length > 0
                  ? parsedOptions
                  : ['HQ Studio | 45 | 42', 'Cafe Spot | 68 | 58']
                ).map((raw, idx) => {
                  const [lbl, xStr, yStr] = raw.split('|').map((s) => s.trim());
                  return {
                    label: lbl || `Pin ${idx + 1}`,
                    x: Number(xStr) || 35 + idx * 25,
                    y: Number(yStr) || 40 + idx * 15,
                  };
                });
                const allMarkers = [...baseMarkers, ...ms.extraMarkers];
                return (
                  <div className="px-5 py-1.5">
                    <div className="rounded-2xl overflow-hidden border border-white/15 bg-[#0D1520]">
                      <div
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => {
                          mapDragRef.current = {
                            id: block.id,
                            startX: e.clientX,
                            startY: e.clientY,
                            origX: ms.panX,
                            origY: ms.panY,
                          };
                        }}
                        onPointerMove={(e) => {
                          const drag = mapDragRef.current;
                          if (!drag || drag.id !== block.id) return;
                          const dx = e.clientX - drag.startX;
                          const dy = e.clientY - drag.startY;
                          const nextPanX = Math.max(-80, Math.min(80, drag.origX + dx));
                          const nextPanY = Math.max(-50, Math.min(50, drag.origY + dy));
                          setMapViewState((p) => ({
                            ...p,
                            [block.id]: {
                              ...(p[block.id] || ms),
                              panX: nextPanX,
                              panY: nextPanY,
                            },
                          }));
                        }}
                        onPointerUp={() => {
                          mapDragRef.current = null;
                        }}
                        onPointerLeave={() => {
                          mapDragRef.current = null;
                        }}
                        className="relative h-44 bg-[#101C2E] overflow-hidden cursor-grab active:cursor-grabbing select-none"
                      >
                        <div
                          style={{
                            transform: `translate(${ms.panX}px, ${ms.panY}px) scale(${ms.zoom})`,
                          }}
                          className="absolute inset-0 transition-transform duration-75 origin-center"
                        >
                          <svg viewBox="0 0 360 180" className="w-full h-full">
                            <rect width="360" height="180" fill="#101C2E" />
                            <path d="M0 35 H360 M0 90 H360 M0 142 H360" stroke="#1E2F47" strokeWidth="6" />
                            <path d="M70 0 V180 M180 0 V180 M285 0 V180" stroke="#1E2F47" strokeWidth="7" />
                            <path d="M0 120 C110 70, 220 150, 360 65" stroke="#0EA5E9" strokeOpacity="0.35" strokeWidth="12" fill="none" />
                            <rect x="88" y="45" width="76" height="36" rx="6" fill="#166534" fillOpacity="0.4" />
                          </svg>
                          {allMarkers.map((mk, mIdx) => (
                            <button
                              key={`${mk.label}_${mIdx}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMapViewState((p) => ({
                                  ...p,
                                  [block.id]: { ...ms, activeMarkerLabel: mk.label },
                                }));
                              }}
                              style={{ left: `${mk.x}%`, top: `${mk.y}%` }}
                              className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center cursor-pointer group"
                            >
                              <span className="px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-semibold text-white whitespace-nowrap mb-0.5 border border-white/15">
                                {mk.label}
                              </span>
                              <MapPin className="w-4 h-4 text-rose-400 fill-rose-500/40 drop-shadow" />
                            </button>
                          ))}
                        </div>

                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 border border-white/15 text-[9px] font-semibold text-sky-300">
                          {ms.activeMarkerLabel
                            ? `Pin: ${ms.activeMarkerLabel}`
                            : `${displayContent} · ${ms.zoom.toFixed(1)}x`}
                        </div>

                        <div className="absolute bottom-2 right-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const n = ms.extraMarkers.length + 1;
                              setMapViewState((p) => ({
                                ...p,
                                [block.id]: {
                                  ...ms,
                                  extraMarkers: [
                                    ...ms.extraMarkers,
                                    { label: `New Pin #${n}`, x: 25 + ((n * 19) % 55), y: 30 + ((n * 17) % 50) },
                                  ],
                                },
                              }));
                            }}
                            className="px-2 py-1 rounded bg-[#2563EB] hover:bg-blue-500 text-white text-[9px] font-bold cursor-pointer shadow"
                          >
                            + Pin
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMapViewState((p) => ({
                                ...p,
                                [block.id]: { ...ms, zoom: Math.min(2.4, ms.zoom + 0.3) },
                              }));
                            }}
                            className="p-1 rounded bg-black/75 hover:bg-black text-white border border-white/15 cursor-pointer"
                          >
                            <ZoomIn className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMapViewState((p) => ({
                                ...p,
                                [block.id]: { ...ms, zoom: Math.max(0.8, ms.zoom - 0.3) },
                              }));
                            }}
                            className="p-1 rounded bg-black/75 hover:bg-black text-white border border-white/15 cursor-pointer"
                          >
                            <ZoomOut className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-ad-banner' && (
                <div className="px-5 py-1.5">
                  {dismissedAds[block.id] ? (
                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Ad banner hidden</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDismissedAds((p) => ({ ...p, [block.id]: false }));
                        }}
                        className="text-sky-400 hover:underline cursor-pointer"
                      >
                        Show Ad
                      </button>
                    </div>
                  ) : (
                    <div
                      style={surfaceStyle}
                      className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-sky-500/15 border border-amber-400/30 flex items-center gap-2.5"
                    >
                      <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black text-[9px] font-extrabold tracking-wider shrink-0">
                        {block.badgeText || 'AD'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          style={primaryStyle}
                          className={`${customFont || 'text-[11px]'} ${customWeight || 'font-bold'} ${
                            customTextColor || 'text-white'
                          } truncate`}
                        >
                          {displayContent}
                        </p>
                        {block.subtitle && (
                          <p style={subtitleStyle} className="text-[9px] text-slate-300 truncate">
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
                        style={{
                          backgroundColor: resolvedAccent,
                          ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}),
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shrink-0 cursor-pointer"
                      >
                        {block.actionPayload || 'Open'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDismissedAds((p) => ({ ...p, [block.id]: true }));
                        }}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                        title="Dismiss Ad"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {block.type === 'ui-lottie' && (() => {
                const playing = block.isExpanded !== false;
                const speed = lottieSpeeds[block.id] || 1;
                const preset = block.shaderPreset || 'orbit';
                const dur = `${(2.4 / speed).toFixed(2)}s`;
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-4'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 flex items-center gap-4`}
                    >
                      <div className="w-16 h-16 rounded-xl bg-[#090B10] border border-sky-400/25 flex items-center justify-center shrink-0 overflow-hidden">
                        <svg viewBox="0 0 64 64" className="w-14 h-14">
                          <circle cx="32" cy="32" r="22" stroke="#38BDF8" strokeOpacity="0.25" strokeWidth="2" fill="none" />
                          {preset === 'pulse' ? (
                            <circle cx="32" cy="32" r="10" fill="#38BDF8" fillOpacity="0.8">
                              {playing && (
                                <animate attributeName="r" values="8;20;8" dur={dur} repeatCount="indefinite" />
                              )}
                            </circle>
                          ) : preset === 'check' ? (
                            <path d="M18 33 L28 43 L47 22" stroke="#34D399" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                              {playing && (
                                <animate attributeName="stroke-opacity" values="0.35;1;0.35" dur={dur} repeatCount="indefinite" />
                              )}
                            </path>
                          ) : (
                            <g>
                              <circle cx="32" cy="10" r="5" fill="#38BDF8" />
                              <circle cx="32" cy="32" r="6" fill="#818CF8" />
                              {playing && (
                                <animateTransform
                                  attributeName="transform"
                                  type="rotate"
                                  from="0 32 32"
                                  to="360 32 32"
                                  dur={dur}
                                  repeatCount="indefinite"
                                />
                              )}
                            </g>
                          )}
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div>
                          <p
                            style={primaryStyle}
                            className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                              customTextColor || 'text-white'
                            } truncate`}
                          >
                            {displayContent}
                          </p>
                          <p style={subtitleStyle} className="text-[10px] text-slate-400 truncate">
                            Preset: {preset} · {speed}x
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateBlock({ ...block, isExpanded: !playing });
                            }}
                            className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/30 text-[10px] font-semibold text-sky-200 cursor-pointer"
                          >
                            {playing ? 'Pause' : 'Play'}
                          </button>
                          {[0.5, 1, 2].map((sp) => (
                            <button
                              key={sp}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLottieSpeeds((p) => ({ ...p, [block.id]: sp }));
                              }}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono cursor-pointer ${
                                speed === sp
                                  ? 'bg-white/20 text-white font-bold'
                                  : 'bg-white/5 text-slate-400 hover:text-white'
                              }`}
                            >
                              {sp}x
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-blur' && (() => {
                const blurPx = block.blurAmount ?? 12;
                return (
                  <div className="px-5 py-1.5">
                    <div
                      onDragOver={(e) => handleContainerDragOver(e, block.id)}
                      onDragLeave={() => dragOverContainerId === block.id && setDragOverContainerId(null)}
                      onDrop={(e) => void handleContainerDrop(e, block.id)}
                      className={`relative overflow-hidden ${customRadius} border ${
                        dragOverContainerId === block.id ? 'border-[#4D97FF] ring-2 ring-[#4D97FF]' : 'border-white/20'
                      }`}
                    >
                      {block.imageUrl ? (
                        <img
                          src={block.imageUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/50 via-fuchsia-500/40 to-amber-400/40">
                          <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-cyan-400/60" />
                          <div className="absolute -bottom-6 right-4 w-32 h-32 rounded-full bg-purple-500/60" />
                        </div>
                      )}
                      <div
                        style={{
                          backdropFilter: `blur(${blurPx}px)`,
                          WebkitBackdropFilter: `blur(${blurPx}px)`,
                        }}
                        className="relative z-10 p-4 bg-slate-950/40 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            style={primaryStyle}
                            className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                              customTextColor || 'text-white'
                            }`}
                          >
                            {displayContent}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-black/50 border border-white/15 text-[9px] font-mono text-sky-200">
                            blur({blurPx}px)
                          </span>
                        </div>
                        {block.subtitle && (
                          <p style={subtitleStyle} className="text-[10px] text-slate-200/85">
                            {block.subtitle}
                          </p>
                        )}
                        {block.children && block.children.length > 0 && (
                          <div className="pt-1 space-y-2">
                            {block.children.map((ch, idx) => renderChildWidget(ch, block, idx))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-aspect-ratio' && (() => {
                const ratio = block.aspectRatio || '16/9';
                return (
                  <div className="px-5 py-1.5">
                    <div
                      onDragOver={(e) => handleContainerDragOver(e, block.id)}
                      onDragLeave={() => dragOverContainerId === block.id && setDragOverContainerId(null)}
                      onDrop={(e) => void handleContainerDrop(e, block.id)}
                      style={{ ...surfaceStyle, aspectRatio: ratio }}
                      className={`relative w-full max-h-64 overflow-hidden ${customRadius} ${
                        customBg || 'bg-[#0C1018]'
                      } border ${
                        dragOverContainerId === block.id ? 'border-[#4D97FF] ring-2 ring-[#4D97FF]' : 'border-sky-400/30'
                      } flex flex-col items-center justify-center p-3`}
                    >
                      {block.imageUrl && (
                        <img
                          src={block.imageUrl}
                          alt={displayContent}
                          className="absolute inset-0 w-full h-full object-cover opacity-85"
                        />
                      )}
                      <div className="relative z-10 text-center space-y-1 bg-black/45 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/10">
                        <div
                          style={primaryStyle}
                          className={`flex items-center justify-center gap-1.5 ${
                            customTextColor || 'text-sky-300'
                          } ${customFont || 'text-xs'} ${customWeight || 'font-bold'}`}
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>{displayContent}</span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-300">Ratio: {ratio.replace('/', ':')}</p>
                      </div>
                      {block.children && block.children.length > 0 && (
                        <div className="relative z-10 w-full mt-2 space-y-1.5">
                          {block.children.map((ch, idx) => renderChildWidget(ch, block, idx))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-shader-wrap' && (() => {
                const preset = block.shaderPreset || 'hologram';
                const overlayGradient =
                  preset === 'neon-wave'
                    ? 'linear-gradient(120deg, rgba(236,72,153,0.35), rgba(56,189,248,0.35), rgba(16,185,129,0.35))'
                    : preset === 'prism'
                    ? 'conic-gradient(from 90deg, rgba(244,63,94,0.3), rgba(234,179,8,0.3), rgba(34,211,238,0.3), rgba(168,85,247,0.3))'
                    : 'linear-gradient(135deg, rgba(56,189,248,0.28), rgba(168,85,247,0.28), rgba(45,212,191,0.28))';
                return (
                  <div className="px-5 py-1.5">
                    <div
                      onDragOver={(e) => handleContainerDragOver(e, block.id)}
                      onDragLeave={() => dragOverContainerId === block.id && setDragOverContainerId(null)}
                      onDrop={(e) => void handleContainerDrop(e, block.id)}
                      className={`relative overflow-hidden ${customRadius} border border-cyan-400/35 p-4 bg-[#0D111A]`}
                    >
                      <div
                        style={{ background: overlayGradient }}
                        className="absolute inset-0 animate-pulse pointer-events-none"
                      />
                      {preset === 'scanline' && (
                        <div
                          style={{
                            backgroundImage:
                              'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 4px)',
                          }}
                          className="absolute inset-0 pointer-events-none"
                        />
                      )}
                      <div className="relative z-10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            style={primaryStyle}
                            className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                              customTextColor || 'text-white'
                            }`}
                          >
                            {displayContent}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/30 text-[9px] font-mono text-cyan-200 uppercase">
                            {preset}
                          </span>
                        </div>
                        {block.subtitle && (
                          <p style={subtitleStyle} className="text-[10px] text-slate-200/80">
                            {block.subtitle}
                          </p>
                        )}
                        {block.children && block.children.length > 0 && (
                          <div className="pt-1 space-y-2">
                            {block.children.map((ch, idx) => renderChildWidget(ch, block, idx))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-shader-fill' && (() => {
                const preset = block.shaderPreset || 'plasma';
                const shaderBg =
                  preset === 'aurora'
                    ? 'radial-gradient(circle at 20% 25%, #10b981, transparent 50%), radial-gradient(circle at 80% 70%, #6366f1, transparent 55%), linear-gradient(135deg, #042f2e, #0f172a)'
                    : preset === 'liquid-cyan'
                    ? 'radial-gradient(circle at 30% 30%, #22d3ee, transparent 48%), radial-gradient(circle at 75% 65%, #3b82f6, transparent 52%), #082f49'
                    : 'radial-gradient(circle at 18% 20%, #ec4899, transparent 48%), radial-gradient(circle at 82% 75%, #38bdf8, transparent 52%), linear-gradient(135deg, #3b0764, #0f172a)';
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={{ background: shaderBg, height: block.style?.height || '120px' }}
                      className={`${customRadius} border border-white/20 p-4 flex flex-col justify-between relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse pointer-events-none" />
                      <span className="relative z-10 self-end px-2 py-0.5 rounded bg-black/50 text-[9px] font-mono uppercase text-white border border-white/15">
                        Shader: {preset}
                      </span>
                      <div className="relative z-10">
                        <p
                          style={primaryStyle}
                          className={`${customFont || 'text-sm'} ${customWeight || 'font-extrabold'} ${
                            customTextColor || 'text-white'
                          } drop-shadow`}
                        >
                          {displayContent}
                        </p>
                        {block.subtitle && (
                          <p style={subtitleStyle} className="text-[10px] text-white/85">
                            {block.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-transform' && (() => {
                const rot = block.transformRotate ?? -4;
                const scl = (block.transformScale ?? 100) / 100;
                const tx = block.transformTranslateX ?? 0;
                const ty = block.transformTranslateY ?? 0;
                return (
                  <div className="px-5 py-3">
                    <div
                      onDragOver={(e) => handleContainerDragOver(e, block.id)}
                      onDragLeave={() => dragOverContainerId === block.id && setDragOverContainerId(null)}
                      onDrop={(e) => void handleContainerDrop(e, block.id)}
                      style={{
                        ...surfaceStyle,
                        transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${scl})`,
                      }}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-indigo-950/40'
                      } border border-indigo-400/35 transition-transform duration-150 space-y-1.5`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          style={primaryStyle}
                          className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                            customTextColor || 'text-white'
                          }`}
                        >
                          {displayContent}
                        </span>
                        <span className="text-[9px] font-mono text-indigo-300 bg-black/40 px-1.5 py-0.5 rounded">
                          {rot}° · {Math.round(scl * 100)}%
                        </span>
                      </div>
                      {block.subtitle && (
                        <p style={subtitleStyle} className="text-[10px] text-slate-300">
                          {block.subtitle}
                        </p>
                      )}
                      {block.children && block.children.length > 0 && (
                        <div className="pt-1 space-y-1.5">
                          {block.children.map((ch, idx) => renderChildWidget(ch, block, idx))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-media-display' && (() => {
                const parsedVid = parseVideoUrl(block.videoUrl);
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 space-y-2`}
                    >
                      {parsedVid.kind === 'youtube' || parsedVid.kind === 'vimeo' ? (
                        <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
                          <iframe src={parsedVid.embedUrl} title={displayContent} className="w-full h-full border-0" allowFullScreen />
                        </div>
                      ) : parsedVid.kind === 'direct' ? (
                        <video controls playsInline src={parsedVid.embedUrl} className="w-full max-h-44 rounded-lg bg-black" />
                      ) : block.imageUrl ? (
                        <img src={block.imageUrl} alt={displayContent} className="w-full max-h-48 object-cover rounded-lg border border-white/10" />
                      ) : (
                        <div className="h-32 rounded-lg bg-gradient-to-br from-slate-900 to-sky-950/60 border border-dashed border-sky-400/35 flex flex-col items-center justify-center gap-1.5 text-sky-300 text-xs">
                          <Layers className="w-5 h-5" />
                          <span>Upload Photo or Paste Video URL</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <p
                          style={primaryStyle}
                          className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                            customTextColor || 'text-white'
                          } truncate`}
                        >
                          {displayContent}
                        </p>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/10 text-sky-300">
                          {block.videoUrl ? 'VIDEO' : 'MEDIA'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-rive' && (() => {
                const states = parsedOptions.length > 0 ? parsedOptions : ['Idle', 'Active', 'Celebrate'];
                const activeIdx = (block.counterValue ?? 0) % states.length;
                const activeState = states[activeIdx];
                const isCelebrate = activeState.toLowerCase().includes('celeb');
                const isActive = activeState.toLowerCase().includes('act');
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-4'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 space-y-2.5`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateBlock({ ...block, counterValue: (activeIdx + 1) % states.length });
                          }}
                          className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0 ${
                            isCelebrate
                              ? 'bg-amber-500/25 border-amber-400 text-amber-300 scale-110 rotate-6'
                              : isActive
                              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 scale-105'
                              : 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300'
                          }`}
                        >
                          {isCelebrate ? (
                            <Sparkles className="w-7 h-7 animate-bounce" />
                          ) : isActive ? (
                            <Rocket className="w-7 h-7 animate-pulse" />
                          ) : (
                            <Zap className="w-6 h-6" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p
                            style={primaryStyle}
                            className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                              customTextColor || 'text-white'
                            } truncate`}
                          >
                            {displayContent}
                          </p>
                          <p style={subtitleStyle} className="text-[10px] text-sky-300 font-mono">
                            State: {activeState}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {states.map((st, idx) => (
                          <button
                            key={st}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateBlock({ ...block, counterValue: idx });
                            }}
                            style={idx === activeIdx ? { backgroundColor: resolvedAccent } : undefined}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer ${
                              idx === activeIdx
                                ? 'text-white shadow'
                                : 'bg-white/5 text-slate-300 hover:text-white'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-pdf-viewer' && (() => {
                const pagesList =
                  parsedOptions.length > 0
                    ? parsedOptions
                    : ['Page 1 · Document Summary', 'Page 2 · Specifications', 'Page 3 · Appendix'];
                const pdf = pdfStates[block.id] || { page: 0, zoom: 100 };
                const safePage = Math.max(0, Math.min(pagesList.length - 1, pdf.page));
                return (
                  <div className="px-5 py-1.5">
                    <div className="rounded-2xl overflow-hidden border border-white/15 bg-[#0B0E15]">
                      <div className="px-3 py-2 bg-[#141923] border-b border-white/10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span
                            style={primaryStyle}
                            className={`${customFont || 'text-[11px]'} ${customWeight || 'font-semibold'} ${
                              customTextColor || 'text-white'
                            } truncate`}
                          >
                            {displayContent}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPdfStates((p) => ({
                                ...p,
                                [block.id]: { ...pdf, zoom: Math.max(80, pdf.zoom - 10) },
                              }));
                            }}
                            className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-[9px] font-mono text-slate-300">{pdf.zoom}%</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPdfStates((p) => ({
                                ...p,
                                [block.id]: { ...pdf, zoom: Math.min(130, pdf.zoom + 10) },
                              }));
                            }}
                            className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {block.videoUrl ? (
                        <iframe src={block.videoUrl} title={displayContent} className="w-full h-44 bg-white border-0" />
                      ) : (
                        <div className="p-3 bg-[#090B10] flex justify-center overflow-auto">
                          <div
                            style={{ transform: `scale(${pdf.zoom / 100})`, transformOrigin: 'top center' }}
                            className="w-full bg-slate-100 text-slate-900 rounded-lg p-3.5 shadow-md space-y-1.5 transition-transform"
                          >
                            <div className="text-[9px] font-mono uppercase tracking-wider text-slate-500">
                              Page {safePage + 1} of {pagesList.length}
                            </div>
                            <p className="text-xs font-bold text-slate-900">{displayContent}</p>
                            <p className="text-[11px] text-slate-700 leading-relaxed">{pagesList[safePage]}</p>
                          </div>
                        </div>
                      )}
                      <div className="px-3 py-1.5 bg-[#141923] border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPdfStates((p) => ({
                              ...p,
                              [block.id]: { ...pdf, page: Math.max(0, safePage - 1) },
                            }));
                          }}
                          className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
                        >
                          Prev
                        </button>
                        <span className="font-mono">
                          {safePage + 1} / {pagesList.length}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPdfStates((p) => ({
                              ...p,
                              [block.id]: { ...pdf, page: Math.min(pagesList.length - 1, safePage + 1) },
                            }));
                          }}
                          className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-progress-bar' && (() => {
                const pct = Math.max(0, Math.min(100, block.progressValue ?? 75));
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 space-y-2`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          style={primaryStyle}
                          className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                            customTextColor || 'text-white'
                          } truncate`}
                        >
                          {displayContent}
                        </span>
                        <span className="text-xs font-mono font-bold text-sky-300">{pct}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          style={{
                            width: `${pct}%`,
                            backgroundColor: block.style?.customBgHex || resolvedAccent,
                          }}
                          className="h-full rounded-full transition-all duration-300"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span style={subtitleStyle} className="text-slate-400 truncate">
                          {block.subtitle}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateBlock({ ...block, progressValue: Math.max(0, pct - 10) });
                            }}
                            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 font-mono cursor-pointer"
                          >
                            -10%
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateBlock({ ...block, progressValue: Math.min(100, pct + 10) });
                            }}
                            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 font-mono cursor-pointer"
                          >
                            +10%
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-language-selector' && (() => {
                const langs =
                  parsedOptions.length > 0
                    ? parsedOptions
                    : ['English (EN)', 'සිංහල (SI)', 'தமிழ் (TA)'];
                const activeIdx = (block.counterValue ?? 0) % langs.length;
                const activeLang = langs[activeIdx];
                const greeting = activeLang.includes('සිංහල')
                  ? 'ආයුබෝවන්! භාෂාව සාර්ථකව මාරු විය.'
                  : activeLang.includes('தமிழ்')
                  ? 'வணக்கம்! மொழி மாற்றப்பட்டது.'
                  : activeLang.includes('Español')
                  ? '¡Hola! Idioma actualizado.'
                  : activeLang.includes('日本語')
                  ? 'こんにちは！言語を変更しました。'
                  : 'Hello! App language switched cleanly.';
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 space-y-2`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div
                          style={primaryStyle}
                          className={`flex items-center gap-1.5 ${customFont || 'text-xs'} ${
                            customWeight || 'font-bold'
                          } ${customTextColor || 'text-white'}`}
                        >
                          <Languages className="w-4 h-4 text-sky-400" />
                          <span>{displayContent}</span>
                        </div>
                        <select
                          value={activeIdx}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            onUpdateBlock({ ...block, counterValue: Number(e.target.value) })
                          }
                          className="px-2 py-1 rounded-lg bg-[#090B10] border border-white/15 text-[11px] text-white outline-none cursor-pointer"
                        >
                          {langs.map((l, idx) => (
                            <option key={l} value={idx}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 border border-sky-400/25 text-[11px] text-sky-200">
                        {greeting}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-notification-badge' && (() => {
                const count = block.counterValue ?? (Number.parseInt(block.badgeText || '3', 10) || 0);
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 flex items-center justify-between gap-3`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
                          {renderVectorIcon(block.iconName || 'bell', 'w-5 h-5')}
                          {count > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow">
                              {count > 99 ? '99+' : count}
                            </span>
                          )}
                        </div>
                        <div>
                          <p
                            style={primaryStyle}
                            className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                              customTextColor || 'text-white'
                            }`}
                          >
                            {displayContent}
                          </p>
                          <p style={subtitleStyle} className="text-[10px] text-slate-400">
                            {count === 0 ? 'No unread alerts' : `${count} unread notification${count === 1 ? '' : 's'}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateBlock({ ...block, counterValue: count + 1, badgeText: String(count + 1) });
                          }}
                          className="px-2 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 text-[10px] font-bold cursor-pointer"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateBlock({ ...block, counterValue: 0, badgeText: '0' });
                          }}
                          className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-chart' && (() => {
                const mode = block.chartType || 'line';
                const pts = (parsedOptions.length > 0
                  ? parsedOptions
                  : ['Jan:32', 'Feb:54', 'Mar:48', 'Apr:82', 'May:71', 'Jun:95']
                ).map((item, idx) => {
                  const [lbl, valStr] = item.split(':').map((s) => s.trim());
                  return {
                    label: lbl || `P${idx + 1}`,
                    value: Math.max(0, Number.parseFloat(valStr) || (idx + 1) * 15),
                  };
                });
                const maxVal = Math.max(10, ...pts.map((p) => p.value));
                const hoverIdx = chartHoveredIdx[block.id] ?? null;
                const svgW = 280;
                const svgH = 110;
                const padX = 16;
                const padY = 14;
                const coords = pts.map((p, i) => ({
                  x: padX + (pts.length > 1 ? (i / (pts.length - 1)) * (svgW - padX * 2) : (svgW - padX * 2) / 2),
                  y: svgH - padY - (p.value / maxVal) * (svgH - padY * 2),
                  ...p,
                }));
                const polyPoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 space-y-2`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p
                            style={primaryStyle}
                            className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                              customTextColor || 'text-white'
                            }`}
                          >
                            {displayContent}
                          </p>
                          <p style={subtitleStyle} className="text-[10px] text-sky-300 font-mono">
                            {hoverIdx !== null && coords[hoverIdx]
                              ? `${coords[hoverIdx].label}: ${coords[hoverIdx].value}`
                              : block.subtitle || `${mode.toUpperCase()} · ${pts.length} pts`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateBlock({ ...block, chartType: mode === 'line' ? 'bar' : 'line' });
                          }}
                          className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-slate-200 cursor-pointer"
                        >
                          {mode === 'line' ? 'Switch Bar' : 'Switch Line'}
                        </button>
                      </div>
                      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-28 bg-[#090B10] rounded-xl border border-white/10">
                        <line x1={padX} y1={svgH - padY} x2={svgW - padX} y2={svgH - padY} stroke="rgba(255,255,255,0.12)" />
                        <line x1={padX} y1={svgH / 2} x2={svgW - padX} y2={svgH / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                        {mode === 'bar' ? (
                          coords.map((c, idx) => {
                            const bw = Math.max(12, Math.min(28, (svgW - padX * 2) / pts.length - 8));
                            const bh = svgH - padY - c.y;
                            return (
                              <g
                                key={idx}
                                onMouseEnter={() => setChartHoveredIdx((p) => ({ ...p, [block.id]: idx }))}
                                onMouseLeave={() => setChartHoveredIdx((p) => ({ ...p, [block.id]: null }))}
                                className="cursor-pointer"
                              >
                                <rect
                                  x={c.x - bw / 2}
                                  y={c.y}
                                  width={bw}
                                  height={Math.max(2, bh)}
                                  rx="4"
                                  fill={hoverIdx === idx ? '#38BDF8' : resolvedAccent}
                                />
                              </g>
                            );
                          })
                        ) : (
                          <>
                            <polyline fill="none" stroke={resolvedAccent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={polyPoints} />
                            {coords.map((c, idx) => (
                              <circle
                                key={idx}
                                cx={c.x}
                                cy={c.y}
                                r={hoverIdx === idx ? 5 : 3.5}
                                fill={hoverIdx === idx ? '#FBBF24' : '#ffffff'}
                                stroke={resolvedAccent}
                                strokeWidth="2"
                                onMouseEnter={() => setChartHoveredIdx((p) => ({ ...p, [block.id]: idx }))}
                                onMouseLeave={() => setChartHoveredIdx((p) => ({ ...p, [block.id]: null }))}
                                className="cursor-pointer"
                              />
                            ))}
                          </>
                        )}
                      </svg>
                      <div className="flex justify-between px-2 text-[9px] font-mono text-slate-400">
                        {coords.map((c, idx) => (
                          <span key={idx}>{c.label}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-mux-broadcast' && (() => {
                const mux = muxStates[block.id] || { live: false, viewers: 142 };
                return (
                  <div className="px-5 py-1.5">
                    <div className="rounded-2xl overflow-hidden border border-white/15 bg-[#090B10] p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider flex items-center gap-1 ${
                              mux.live
                                ? 'bg-rose-600 text-white animate-pulse'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            <Radio className="w-3 h-3" />
                            <span>{mux.live ? 'LIVE' : block.badgeText || 'STANDBY'}</span>
                          </span>
                          <span
                            style={primaryStyle}
                            className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                              customTextColor || 'text-white'
                            } truncate`}
                          >
                            {displayContent}
                          </span>
                        </div>
                        {mux.live && (
                          <span className="text-[10px] font-mono text-emerald-300 shrink-0">
                            {mux.viewers} watching
                          </span>
                        )}
                      </div>
                      <div className="h-24 rounded-xl bg-gradient-to-br from-slate-900 via-[#12192A] to-rose-950/35 border border-white/10 flex flex-col items-center justify-center gap-1">
                        <Video className={`w-6 h-6 ${mux.live ? 'text-rose-400' : 'text-slate-500'}`} />
                        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[90%]">
                          {block.actionPayload || 'rtmps://global-live.mux.com:443/app'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 truncate">{block.subtitle}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMuxStates((p) => ({
                              ...p,
                              [block.id]: { live: !mux.live, viewers: mux.live ? 0 : 148 },
                            }));
                          }}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer shrink-0 ${
                            mux.live
                              ? 'bg-rose-600 hover:bg-rose-500 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {mux.live ? 'End Stream' : 'Go Live'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-mouse-region' && (() => {
                const ms = mouseStates[block.id] || { hovering: false, x: 0, y: 0, enters: 0 };
                return (
                  <div className="px-5 py-1.5">
                    <div
                      onMouseEnter={() =>
                        setMouseStates((p) => ({
                          ...p,
                          [block.id]: { ...ms, hovering: true, enters: ms.enters + 1 },
                        }))
                      }
                      onMouseLeave={() =>
                        setMouseStates((p) => ({
                          ...p,
                          [block.id]: { ...ms, hovering: false },
                        }))
                      }
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMouseStates((p) => ({
                          ...p,
                          [block.id]: {
                            ...ms,
                            hovering: true,
                            x: Math.round(e.clientX - rect.left),
                            y: Math.round(e.clientY - rect.top),
                          },
                        }));
                      }}
                      className={`p-4 rounded-2xl border transition-all ${
                        ms.hovering
                          ? 'bg-sky-500/15 border-sky-400 ring-2 ring-sky-400/30'
                          : 'bg-white/[0.04] border-white/15'
                      } space-y-1.5`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          style={primaryStyle}
                          className={`flex items-center gap-1.5 ${customFont || 'text-xs'} ${
                            customWeight || 'font-bold'
                          } ${customTextColor || 'text-white'}`}
                        >
                          <MousePointer2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>{displayContent}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                            ms.hovering ? 'bg-emerald-500/25 text-emerald-300' : 'bg-white/10 text-slate-400'
                          }`}
                        >
                          {ms.hovering ? 'HOVERING' : 'IDLE'}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-300">
                        Pointer: ({ms.x}, {ms.y}) · Hover enters: {ms.enters}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-barcode' && (() => {
                const mode = block.barcodeMode || 'barcode';
                const val = displayContent || 'SL-STUDIO-2026';
                const bars = buildBarcodeBars(val);
                const qr = buildQrCells(val);
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-4'} ${customRadius} ${
                        customBg || 'bg-white/[0.04]'
                      } border border-white/10 flex flex-col items-center gap-2.5`}
                    >
                      <div className="w-full flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{mode}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateBlock({ ...block, barcodeMode: mode === 'barcode' ? 'qr' : 'barcode' });
                          }}
                          className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-sky-300 flex items-center gap-1 cursor-pointer"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>{mode === 'barcode' ? 'Show QR' : 'Show Barcode'}</span>
                        </button>
                      </div>
                      <div className="p-3 rounded-xl bg-white shadow-inner">
                        {mode === 'qr' ? (
                          <svg viewBox="0 0 105 105" className="w-24 h-24">
                            <rect width="105" height="105" fill="#ffffff" />
                            {qr.map((row, rIdx) =>
                              row.map((on, cIdx) =>
                                on ? (
                                  <rect
                                    key={`${rIdx}_${cIdx}`}
                                    x={cIdx * 5}
                                    y={rIdx * 5}
                                    width="5"
                                    height="5"
                                    fill="#0f172a"
                                  />
                                ) : null
                              )
                            )}
                          </svg>
                        ) : (
                          <svg viewBox="0 0 200 52" className="w-48 h-12">
                            <rect width="200" height="52" fill="#ffffff" />
                            {bars.map((b, i) => (
                              <rect key={i} x={b.x} y="4" width={b.w} height="44" fill="#0f172a" />
                            ))}
                          </svg>
                        )}
                      </div>
                      <span className="text-[11px] font-mono font-bold text-white tracking-widest">
                        {val}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-tooltip' && (() => {
                const open = Boolean(tooltipVisible[block.id]);
                const pos = block.tooltipPosition || 'top';
                return (
                  <div className={`px-5 py-3 ${alignClass}`}>
                    <div
                      onMouseEnter={() => setTooltipVisible((p) => ({ ...p, [block.id]: true }))}
                      onMouseLeave={() => setTooltipVisible((p) => ({ ...p, [block.id]: false }))}
                      className="relative inline-block"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTooltipVisible((p) => ({ ...p, [block.id]: !open }));
                        }}
                        style={surfaceStyle}
                        className={`px-3.5 py-2 ${customRadius} ${
                          customBg || 'bg-white/10'
                        } hover:bg-white/15 border border-white/15 ${customFont || 'text-xs'} ${
                          customWeight || 'font-semibold'
                        } ${customTextColor || 'text-white'} inline-flex items-center gap-1.5 cursor-pointer`}
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
                        <span style={primaryStyle}>{displayContent}</span>
                      </button>
                      {open && (
                        <div
                          className={`absolute z-30 whitespace-nowrap max-w-[240px] truncate px-2.5 py-1.5 rounded-lg bg-[#05080F] border border-sky-400/50 text-[10px] font-medium text-sky-100 shadow-xl ${
                            pos === 'bottom'
                              ? 'top-full left-1/2 -translate-x-1/2 mt-1.5'
                              : pos === 'left'
                              ? 'right-full top-1/2 -translate-y-1/2 mr-2'
                              : pos === 'right'
                              ? 'left-full top-1/2 -translate-y-1/2 ml-2'
                              : 'bottom-full left-1/2 -translate-x-1/2 mb-1.5'
                          }`}
                        >
                          {block.subtitle || 'Helpful tooltip guidance'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-conditional-builder' && (() => {
                const condTrue = block.isExpanded !== false;
                return (
                  <div className="px-5 py-1.5">
                    <div
                      style={surfaceStyle}
                      className={`${customPad || 'p-3.5'} ${customRadius} ${
                        customBg || 'bg-amber-950/20'
                      } border border-amber-400/30 space-y-2.5`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <GitBranch className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span
                            style={primaryStyle}
                            className={`${customFont || 'text-[11px]'} font-mono ${
                              customWeight || 'font-bold'
                            } ${customTextColor || 'text-amber-200'} truncate`}
                          >
                            IF ({displayContent})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateBlock({ ...block, isExpanded: !condTrue });
                          }}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold cursor-pointer ${
                            condTrue
                              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
                              : 'bg-rose-500/25 text-rose-300 border border-rose-400/40'
                          }`}
                        >
                          {condTrue ? 'TRUE' : 'FALSE'}
                        </button>
                      </div>
                      <div
                        className={`p-3 rounded-xl border text-xs ${
                          condTrue
                            ? 'bg-emerald-950/35 border-emerald-400/35 text-emerald-100'
                            : 'bg-slate-900/70 border-white/15 text-slate-300'
                        }`}
                      >
                        {condTrue
                          ? block.conditionTrueText || 'True branch rendered'
                          : block.conditionFalseText || 'False branch rendered'}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-sticky-header' && (() => {
                const groups = (parsedOptions.length > 0
                  ? parsedOptions
                  : ['Pinned: Today|Design Update|Component Sync|Review', 'Pinned: Earlier|Icon Export|QA']
                ).map((entry) => {
                  const parts = entry.split('|').map((s) => s.trim()).filter(Boolean);
                  return { header: parts[0] || displayContent, items: parts.slice(1) };
                });
                return (
                  <div className="px-5 py-1.5">
                    <div className="rounded-2xl border border-white/15 bg-[#0A0D14] overflow-hidden">
                      <div className="max-h-52 overflow-y-auto">
                        {groups.map((grp, gIdx) => (
                          <div key={gIdx}>
                            <div
                              style={{ backgroundColor: `${resolvedAccent}22` }}
                              className="sticky top-0 z-10 backdrop-blur-md px-3 py-1.5 border-y border-white/10 text-[10px] font-bold uppercase tracking-wider text-sky-300"
                            >
                              {grp.header}
                            </div>
                            <div className="divide-y divide-white/5">
                              {(grp.items.length > 0 ? grp.items : ['List Row A', 'List Row B']).map(
                                (item, iIdx) => (
                                  <div key={iIdx} className="px-3 py-2 text-xs text-slate-200">
                                    {item}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-markdown' && (
                <div className="px-5 py-1.5">
                  <div
                    style={surfaceStyle}
                    className={`${customPad || 'p-4'} ${customRadius} ${
                      customBg || 'bg-white/[0.04]'
                    } border border-white/10`}
                  >
                    {renderMarkdownBlocks(displayContent)}
                  </div>
                </div>
              )}

              {block.type === 'ui-draggable' && (
                <div className="px-5 py-1.5">
                  <div
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.setData(
                        'application/x-slbuilder-drag-item',
                        JSON.stringify({ id: block.id, label: displayContent })
                      );
                    }}
                    style={surfaceStyle}
                    className={`${customPad || 'p-3'} ${customRadius} ${
                      customBg || 'bg-indigo-950/35'
                    } border border-indigo-400/40 flex items-center justify-between gap-2.5 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-4 h-4 text-indigo-300 shrink-0" />
                      <div className="min-w-0">
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
                    <span className="px-2 py-0.5 rounded bg-indigo-500/25 text-indigo-200 text-[9px] font-mono font-bold shrink-0">
                      {block.badgeText || 'DRAG'}
                    </span>
                  </div>
                </div>
              )}

              {block.type === 'ui-drag-target' && (() => {
                const dropped = dragTargetItems[block.id] ?? parsedOptions;
                const isOver = Boolean(dragTargetOver[block.id]);
                return (
                  <div className="px-5 py-1.5">
                    <div
                      onDragOver={(e) => {
                        if (e.dataTransfer.types.includes('application/x-slbuilder-drag-item')) {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isOver) setDragTargetOver((p) => ({ ...p, [block.id]: true }));
                        }
                      }}
                      onDragLeave={() => setDragTargetOver((p) => ({ ...p, [block.id]: false }))}
                      onDrop={(e) => {
                        const raw = e.dataTransfer.getData('application/x-slbuilder-drag-item');
                        if (!raw) return;
                        e.preventDefault();
                        e.stopPropagation();
                        setDragTargetOver((p) => ({ ...p, [block.id]: false }));
                        try {
                          const parsed = JSON.parse(raw) as { label?: string };
                          const lbl = parsed.label || 'Dropped Item';
                          setDragTargetItems((p) => ({ ...p, [block.id]: [...dropped, lbl] }));
                          onUpdateBlock({ ...block, options: [...dropped, lbl] });
                        } catch {
                          // ignore malformed drag payload
                        }
                      }}
                      className={`p-4 rounded-2xl border-2 border-dashed transition-all space-y-2 ${
                        isOver
                          ? 'border-emerald-400 bg-emerald-500/15'
                          : 'border-white/20 bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p
                            style={primaryStyle}
                            className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                              customTextColor || 'text-white'
                            }`}
                          >
                            {displayContent}
                          </p>
                          <p style={subtitleStyle} className="text-[10px] text-slate-400">
                            {isOver ? 'Release to drop item here' : block.subtitle || 'Drop Draggable widgets here'}
                          </p>
                        </div>
                        {dropped.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDragTargetItems((p) => ({ ...p, [block.id]: [] }));
                              onUpdateBlock({ ...block, options: [] });
                            }}
                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-rose-500/30 text-[10px] text-slate-200 cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      {dropped.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {dropped.map((lbl, idx) => (
                            <span
                              key={`${lbl}_${idx}`}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-[11px] font-semibold text-emerald-200"
                            >
                              {lbl}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {block.type === 'ui-genui-chat' && (() => {
                const thread = genUiChats[block.id] || {
                  draft: '',
                  messages: [
                    {
                      role: 'assistant' as const,
                      text: parsedOptions[0] || 'How can I help design your screen today?',
                      cardTitle: 'Quick UI Actions',
                      chips: ['Create Login Card', 'Add Pricing Grid'],
                    },
                  ],
                };
                const sendChat = (promptText?: string) => {
                  const text = (promptText ?? thread.draft).trim();
                  if (!text) return;
                  const nextMsgs = [
                    ...thread.messages,
                    { role: 'user' as const, text },
                    {
                      role: 'assistant' as const,
                      text: `Generated structured UI card for "${text}"`,
                      cardTitle: text,
                      chips: ['Apply Theme', 'Preview Layout'],
                    },
                  ];
                  setGenUiChats((p) => ({
                    ...p,
                    [block.id]: { draft: promptText ? thread.draft : '', messages: nextMsgs },
                  }));
                };
                return (
                  <div className="px-5 py-1.5">
                    <div className="rounded-2xl border border-white/15 bg-[#0B0E16] overflow-hidden flex flex-col">
                      <div className="px-3 py-2 bg-[#141923] border-b border-white/10 flex items-center gap-2">
                        <Bot className="w-4 h-4 text-sky-400" />
                        <span
                          style={primaryStyle}
                          className={`${customFont || 'text-xs'} ${customWeight || 'font-bold'} ${
                            customTextColor || 'text-white'
                          }`}
                        >
                          {displayContent}
                        </span>
                      </div>
                      <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                        {thread.messages.map((m, mIdx) => (
                          <div
                            key={mIdx}
                            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] space-y-1.5 ${
                                m.role === 'user'
                                  ? 'bg-[#2563EB] text-white'
                                  : 'bg-[#161C28] border border-white/10 text-slate-200'
                              }`}
                            >
                              <p>{m.text}</p>
                              {m.role === 'assistant' && m.chips && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {m.chips.map((ch) => (
                                    <button
                                      key={ch}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        sendChat(ch);
                                      }}
                                      className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/35 text-[9px] font-semibold text-sky-200 cursor-pointer hover:bg-sky-500/30"
                                    >
                                      {ch}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-[#11151E] border-t border-white/10 flex items-center gap-1.5"
                      >
                        <input
                          type="text"
                          value={thread.draft}
                          onChange={(e) =>
                            setGenUiChats((p) => ({
                              ...p,
                              [block.id]: { ...thread, draft: e.target.value },
                            }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                          placeholder="Ask to generate a UI card..."
                          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 text-[11px] text-white placeholder-slate-500 outline-none focus:border-sky-400"
                        />
                        <button
                          type="button"
                          onClick={() => sendChat()}
                          style={{ backgroundColor: resolvedAccent }}
                          className="p-1.5 rounded-lg text-white cursor-pointer hover:brightness-110"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                      <p
                        style={primaryStyle}
                        className={`${customFont || 'text-xs'} ${customWeight || 'font-semibold'} ${
                          customTextColor || 'text-white'
                        } truncate`}
                      >
                        {displayContent}
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
                        <p
                          style={primaryStyle}
                          className={`${customFont || 'text-xs'} font-mono ${
                            customWeight || 'font-bold'
                          } ${customTextColor || 'text-white'} truncate`}
                        >
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
                        <p
                          style={primaryStyle}
                          className={`${customFont || 'text-xs'} font-mono ${
                            customWeight || 'font-bold'
                          } ${customTextColor || 'text-white'} truncate`}
                        >
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
                      <p
                        style={primaryStyle}
                        className={`${customFont || 'text-xs'} ${customWeight || 'font-semibold'} ${
                          customTextColor || 'text-white'
                        } truncate`}
                      >
                        {displayContent}
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
                      Trigger
                    </button>
                  </div>
                </div>
              )}

              {/* 15. STORAGE / CLOUD DB / AUTH / FETCH / FLASK / DEVICE */}
              {block.type === 'backend-storage' && (() => {
                const sKey = block.logicConfig?.storageKey || 'sl_user_data';
                const sVal = block.logicConfig?.varValue ?? 'Saved from BlockCraft Studio!';
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
                  email: block.logicConfig?.varValue || 'creator@blockcraft.app',
                  password: '••••••••',
                };
                const runAuthOp = (authOp: 'signup' | 'login' | 'logout' | 'current-user') => {
                  onTriggerAction(
                    {
                      ...block,
                      logicConfig: {
                        ...block.logicConfig,
                        authOp,
                        varValue: draft.email || 'creator@blockcraft.app',
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
