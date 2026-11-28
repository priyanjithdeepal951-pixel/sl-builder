import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  FileText,
  Film,
  Image as ImageIcon,
  Link2,
  Music,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import type { CanvasBlock, MediaAssetItem, MediaAssetKind } from '../../types/builder';
import { readAndCompressImageFile } from '../../utils/imageUpload';
import { parseVideoUrl } from '../../utils/mediaHelpers';
import {
  detectMediaKindFromFile,
  detectMediaKindFromUrl,
  formatMediaBytes,
  resolveMediaAssetUrl,
  saveMediaBlobToIdb,
} from '../../utils/mediaLibraryStore';

interface MediaAssetsStudioPanelProps {
  lang: 'en' | 'si';
  assets: MediaAssetItem[];
  resolvedIdbUrls: Record<string, string>;
  selectedBlock: CanvasBlock | null;
  onAddAssets: (newItems: MediaAssetItem[], newResolvedUrls?: Record<string, string>) => void;
  onUpdateAsset: (asset: MediaAssetItem) => void;
  onDeleteAsset: (asset: MediaAssetItem) => void;
  onInsertAssetToCanvas: (asset: MediaAssetItem) => void;
  onApplyAssetToSelected: (asset: MediaAssetItem) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const KIND_FILTERS: Array<{ id: 'all' | MediaAssetKind; label: string; siLabel: string }> = [
  { id: 'all', label: 'All', siLabel: 'සියල්ල' },
  { id: 'image', label: 'Images', siLabel: 'Photos' },
  { id: 'video', label: 'Video', siLabel: 'Video' },
  { id: 'audio', label: 'Audio', siLabel: 'Audio' },
  { id: 'pdf', label: 'PDF', siLabel: 'PDF' },
];

export const MediaAssetsStudioPanel: React.FC<MediaAssetsStudioPanelProps> = ({
  lang,
  assets,
  resolvedIdbUrls,
  selectedBlock,
  onAddAssets,
  onUpdateAsset,
  onDeleteAsset,
  onInsertAssetToCanvas,
  onApplyAssetToSelected,
  onToast,
}) => {
  const [filterKind, setFilterKind] = useState<'all' | MediaAssetKind>('all');
  const [search, setSearch] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlName, setUrlName] = useState('');
  const [urlKind, setUrlKind] = useState<MediaAssetKind | 'auto'>('auto');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [previewAsset, setPreviewAsset] = useState<MediaAssetItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (filterKind !== 'all' && a.kind !== filterKind) return false;
      if (q && !a.name.toLowerCase().includes(q) && !a.kind.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [assets, filterKind, search]);

  const countsByKind = useMemo(() => {
    const counts = { all: assets.length, image: 0, video: 0, audio: 0, pdf: 0 };
    assets.forEach((a) => {
      counts[a.kind] = (counts[a.kind] || 0) + 1;
    });
    return counts;
  }, [assets]);

  const processUploadedFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setIsUploading(true);
    const createdItems: MediaAssetItem[] = [];
    const createdUrls: Record<string, string> = {};
    let skippedCount = 0;

    for (const file of files) {
      const kind = detectMediaKindFromFile(file);
      if (!kind) {
        skippedCount += 1;
        continue;
      }

      const id = `media_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const cleanName = file.name.replace(/\.[^.]+$/, '') || 'Media File';

      try {
        if (kind === 'image') {
          const dataUrl = await readAndCompressImageFile(file, 1080, 0.84);
          // Store compact data URLs directly inside project for cloud & export portability;
          // store larger images (> 220 KB) in local IndexedDB to respect Firestore 1MB limit.
          if (dataUrl.length <= 220_000) {
            createdItems.push({
              id,
              name: cleanName,
              kind: 'image',
              url: dataUrl,
              mimeType: file.type || 'image/jpeg',
              sizeBytes: file.size,
              source: 'upload',
              createdAt: new Date().toISOString(),
            });
          } else {
            const blobRes = await fetch(dataUrl);
            const blob = await blobRes.blob();
            const objUrl = await saveMediaBlobToIdb(id, blob);
            createdUrls[id] = objUrl;
            createdItems.push({
              id,
              name: cleanName,
              kind: 'image',
              url: `idb://${id}`,
              mimeType: file.type || 'image/jpeg',
              sizeBytes: blob.size,
              source: 'upload',
              createdAt: new Date().toISOString(),
            });
          }
        } else {
          // Video, Audio, PDF -> save binary blob into IndexedDB
          const objUrl = await saveMediaBlobToIdb(id, file);
          createdUrls[id] = objUrl;
          createdItems.push({
            id,
            name: cleanName,
            kind,
            url: `idb://${id}`,
            mimeType: file.type,
            sizeBytes: file.size,
            source: 'upload',
            createdAt: new Date().toISOString(),
          });
        }
      } catch {
        skippedCount += 1;
      }
    }

    setIsUploading(false);
    if (createdItems.length > 0) {
      onAddAssets(createdItems, createdUrls);
      onToast(
        createdItems.length === 1
          ? `Added "${createdItems[0].name}" to Media Library`
          : `Added ${createdItems.length} media files to library`,
        'success'
      );
    }
    if (skippedCount > 0) {
      onToast(
        `${skippedCount} unsupported or unreadable file(s) skipped. Use Image, Video, Audio, or PDF.`,
        'info'
      );
    }
  };

  const handleAddExternalUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = urlInput.trim();
    if (!raw) return;
    const normalizedUrl =
      /^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('/')
        ? raw
        : `https://${raw}`;
    const detected = urlKind === 'auto' ? detectMediaKindFromUrl(normalizedUrl) : urlKind;
    let defaultName = urlName.trim();
    if (!defaultName) {
      try {
        const u = new URL(normalizedUrl, 'https://example.com');
        const seg = u.pathname.split('/').filter(Boolean).pop();
        defaultName = seg ? decodeURIComponent(seg).replace(/\.[^.]+$/, '') : `${detected} link`;
      } catch {
        defaultName = `${detected} link`;
      }
    }
    const newItem: MediaAssetItem = {
      id: `media_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: defaultName.slice(0, 48),
      kind: detected,
      url: normalizedUrl,
      source: 'url',
      createdAt: new Date().toISOString(),
    };
    onAddAssets([newItem]);
    setUrlInput('');
    setUrlName('');
    setShowUrlForm(false);
    onToast(`Saved "${newItem.name}" (${detected.toUpperCase()})`, 'success');
  };

  const handleDragStartAsset = (e: React.DragEvent, asset: MediaAssetItem) => {
    const resolvedUrl = resolveMediaAssetUrl(asset.url, resolvedIdbUrls);
    e.dataTransfer.setData(
      'application/x-slbuilder-media-asset',
      JSON.stringify({
        id: asset.id,
        name: asset.name,
        kind: asset.kind,
        url: resolvedUrl,
      })
    );
    if (asset.kind === 'image') {
      e.dataTransfer.setData('application/x-slbuilder-type', 'ui-image');
    } else if (asset.kind === 'video') {
      e.dataTransfer.setData('application/x-slbuilder-type', 'ui-video');
    } else if (asset.kind === 'audio') {
      e.dataTransfer.setData('application/x-slbuilder-type', 'ui-audio-player');
    } else {
      e.dataTransfer.setData('application/x-slbuilder-type', 'ui-pdf-viewer');
    }
    e.dataTransfer.effectAllowed = 'copy';
  };

  const getKindIcon = (kind: MediaAssetKind, cls = 'w-3.5 h-3.5') => {
    if (kind === 'video') return <Film className={cls} />;
    if (kind === 'audio') return <Music className={cls} />;
    if (kind === 'pdf') return <FileText className={cls} />;
    return <ImageIcon className={cls} />;
  };

  const getKindColorClass = (kind: MediaAssetKind) => {
    if (kind === 'video') return 'text-violet-300 bg-violet-500/15 border-violet-500/30';
    if (kind === 'audio') return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
    if (kind === 'pdf') return 'text-rose-300 bg-rose-500/15 border-rose-500/30';
    return 'text-sky-300 bg-sky-500/15 border-sky-500/30';
  };

  const resolvedPreviewUrl = previewAsset
    ? resolveMediaAssetUrl(previewAsset.url, resolvedIdbUrls)
    : '';

  return (
    <div className="space-y-3 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-slate-100 block">
            {lang === 'si' ? 'Media ගබඩාව' : 'Media Library'}
          </span>
          <span className="text-[10px] text-slate-400">
            {assets.length} {assets.length === 1 ? 'file' : 'files'} ·{' '}
            {lang === 'si' ? 'Photos, Video, Audio & PDF' : 'Photos, Video, Audio & PDF'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowUrlForm((s) => !s)}
          title="Add Media by URL"
          className={`px-2 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
            showUrlForm
              ? 'bg-sky-500/20 border-sky-400/50 text-sky-200'
              : 'bg-white/[0.04] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <Link2 className="w-3 h-3" />
          <span>URL</span>
        </button>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          if (e.dataTransfer.files?.length) {
            void processUploadedFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-xl border border-dashed p-3 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-sky-400 bg-sky-500/15 ring-2 ring-sky-400/30'
            : 'border-white/15 bg-[#11151d] hover:border-sky-400/50 hover:bg-[#141a24]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              void processUploadedFiles(e.target.files);
            }
            e.target.value = '';
          }}
        />
        <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/25 text-sky-300 flex items-center justify-center mx-auto mb-1.5">
          <Upload className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
        </div>
        <p className="text-[11px] font-semibold text-slate-100">
          {isUploading
            ? lang === 'si'
              ? 'Files add වෙමින් පවතී...'
              : 'Adding media files...'
            : lang === 'si'
            ? 'Media Files Upload / Drop කරන්න'
            : 'Upload or Drop Media Files'}
        </p>
        <p className="text-[9.5px] text-slate-400 mt-0.5">
          PNG, JPG, SVG, MP4, MP3, PDF
        </p>
      </div>

      {/* Add External Media URL Form */}
      {showUrlForm && (
        <form
          onSubmit={handleAddExternalUrl}
          className="rounded-xl bg-[#11151d] border border-sky-500/30 p-2.5 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">
              Add from URL / YouTube
            </span>
            <button
              type="button"
              onClick={() => setShowUrlForm(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://... (Image, YouTube, MP4, MP3, PDF)"
            className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B10] border border-white/10 focus:border-sky-400 text-[11px] text-white placeholder-slate-500 outline-none"
          />
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={urlName}
              onChange={(e) => setUrlName(e.target.value)}
              placeholder="Label (optional)"
              className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-[#090B10] border border-white/10 text-[10.5px] text-white placeholder-slate-500 outline-none"
            />
            <select
              value={urlKind}
              onChange={(e) => setUrlKind(e.target.value as MediaAssetKind | 'auto')}
              className="px-1.5 py-1 rounded-lg bg-[#090B10] border border-white/10 text-[10.5px] text-slate-200 outline-none"
            >
              <option value="auto">Auto</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={!urlInput.trim()}
            className="w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-[10.5px] font-semibold cursor-pointer"
          >
            Save to Media Library
          </button>
        </form>
      )}

      {/* Search + Kind Filter */}
      {assets.length > 0 && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'si' ? 'Media සොයන්න...' : 'Search media files...'}
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

          <div className="grid grid-cols-5 gap-1 bg-[#11151d] p-1 rounded-lg border border-white/[0.07]">
            {KIND_FILTERS.map((f) => {
              const active = filterKind === f.id;
              const cnt = countsByKind[f.id];
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterKind(f.id)}
                  className={`py-1 px-1 rounded-md text-[9.5px] font-semibold transition-colors cursor-pointer truncate ${
                    active
                      ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                  title={`${f.label} (${cnt})`}
                >
                  {lang === 'si' ? f.siLabel : f.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Block Context Banner */}
      {selectedBlock && assets.length > 0 && (
        <div className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-400/25 text-[10px] text-indigo-200 flex items-center gap-1.5">
          <Wand2 className="w-3 h-3 shrink-0 text-indigo-300" />
          <span className="truncate">
            Selected: <strong className="text-white">{selectedBlock.name}</strong>
          </span>
        </div>
      )}

      {/* Media Asset Cards */}
      {filteredAssets.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#11151d]/60 px-3 py-6 text-center space-y-1.5">
          <ImageIcon className="w-6 h-6 text-slate-600 mx-auto" />
          <p className="text-[11px] font-medium text-slate-300">
            {assets.length === 0
              ? lang === 'si'
                ? 'තවම media files add කරලා නෑ'
                : 'No media files added yet'
              : 'No media files match this filter'}
          </p>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            {assets.length === 0
              ? lang === 'si'
                ? 'උඩ box එකෙන් photos, videos, audio හෝ PDF upload කරලා canvas එකට add කරන්න.'
                : 'Upload photos, videos, audio, or PDFs above, then drag or click to insert into your page.'
              : 'Try switching filter tabs or clearing your search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAssets.map((asset) => {
            const resolvedUrl = resolveMediaAssetUrl(asset.url, resolvedIdbUrls);
            const parsedVid = asset.kind === 'video' ? parseVideoUrl(resolvedUrl) : null;
            const ytThumb =
              parsedVid?.kind === 'youtube' && parsedVid.videoId
                ? `https://img.youtube.com/vi/${parsedVid.videoId}/mqdefault.jpg`
                : null;
            const isEditing = editingId === asset.id;

            return (
              <div
                key={asset.id}
                draggable={Boolean(resolvedUrl)}
                onDragStart={(e) => handleDragStartAsset(e, asset)}
                className="group rounded-xl bg-[#11151d] border border-white/[0.08] hover:border-sky-400/40 overflow-hidden transition-all"
              >
                {/* Visual Thumbnail / Media Preview Area */}
                <div className="relative bg-[#090B10] border-b border-white/[0.06]">
                  {asset.kind === 'image' && resolvedUrl ? (
                    <div
                      onClick={() => setPreviewAsset(asset)}
                      className="h-24 w-full overflow-hidden cursor-pointer relative"
                    >
                      <img
                        src={resolvedUrl}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                      />
                    </div>
                  ) : asset.kind === 'video' ? (
                    <div
                      onClick={() => setPreviewAsset(asset)}
                      className="h-24 w-full overflow-hidden cursor-pointer relative flex items-center justify-center bg-black"
                    >
                      {ytThumb ? (
                        <img src={ytThumb} alt={asset.name} className="w-full h-full object-cover opacity-85" />
                      ) : resolvedUrl && parsedVid?.kind === 'direct' ? (
                        <video
                          src={resolvedUrl}
                          muted
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover opacity-80"
                        />
                      ) : (
                        <Film className="w-6 h-6 text-violet-400" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <span className="w-7 h-7 rounded-full bg-black/70 border border-white/25 text-white flex items-center justify-center">
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ) : asset.kind === 'audio' ? (
                    <div className="p-2.5 flex flex-col gap-1.5 bg-gradient-to-r from-emerald-950/30 to-[#090B10]">
                      <div className="flex items-center gap-2 text-emerald-300 text-[10.5px] font-semibold">
                        <Music className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{asset.name}</span>
                      </div>
                      {resolvedUrl ? (
                        <audio controls src={resolvedUrl} className="w-full h-7" />
                      ) : (
                        <span className="text-[9.5px] text-slate-500">Loading audio...</span>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => setPreviewAsset(asset)}
                      className="h-16 px-3 flex items-center gap-2.5 cursor-pointer bg-gradient-to-r from-rose-950/25 to-[#090B10]"
                    >
                      <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-white truncate">{asset.name}</p>
                        <p className="text-[9.5px] text-slate-400">
                          PDF Document {asset.sizeBytes ? `· ${formatMediaBytes(asset.sizeBytes)}` : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Top-left Type Tag */}
                  <span
                    className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase flex items-center gap-1 backdrop-blur-sm ${getKindColorClass(
                      asset.kind
                    )}`}
                  >
                    {getKindIcon(asset.kind, 'w-2.5 h-2.5')}
                    <span>{asset.kind}</span>
                  </span>

                  {/* Top-right Preview Button */}
                  <button
                    type="button"
                    onClick={() => setPreviewAsset(asset)}
                    title="Preview"
                    className="absolute top-1.5 right-1.5 p-1 rounded bg-black/65 hover:bg-black text-slate-200 hover:text-white border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                </div>

                {/* Metadata & Actions */}
                <div className="p-2 space-y-2">
                  <div className="flex items-center justify-between gap-1.5">
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editingName.trim()) {
                              onUpdateAsset({ ...asset, name: editingName.trim() });
                              setEditingId(null);
                            } else if (e.key === 'Escape') {
                              setEditingId(null);
                            }
                          }}
                          autoFocus
                          className="flex-1 min-w-0 px-1.5 py-0.5 rounded bg-[#090B10] border border-sky-400 text-[11px] text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (editingName.trim()) {
                              onUpdateAsset({ ...asset, name: editingName.trim() });
                            }
                            setEditingId(null);
                          }}
                          className="p-1 rounded bg-emerald-600 text-white cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-slate-100 truncate" title={asset.name}>
                            {asset.name}
                          </p>
                          <p className="text-[9.5px] text-slate-500">
                            {asset.source === 'url' ? 'External URL' : formatMediaBytes(asset.sizeBytes) || 'Local File'}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(asset.id);
                              setEditingName(asset.name);
                            }}
                            title="Rename"
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          {asset.source === 'url' && (
                            <button
                              type="button"
                              onClick={() => {
                                void navigator.clipboard.writeText(asset.url);
                                onToast('Media URL copied!', 'info');
                              }}
                              title="Copy URL"
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteAsset(asset)}
                            title="Delete media"
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onInsertAssetToCanvas(asset)}
                      className="py-1 px-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{lang === 'si' ? 'Canvas එකට' : 'Add Block'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={!selectedBlock}
                      onClick={() => onApplyAssetToSelected(asset)}
                      title={
                        selectedBlock
                          ? `Apply to "${selectedBlock.name}"`
                          : 'Select a block on canvas first'
                      }
                      className="py-1 px-2 rounded-lg bg-white/[0.06] hover:bg-indigo-500/25 border border-white/10 hover:border-indigo-400/40 disabled:opacity-35 disabled:cursor-not-allowed text-slate-200 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>{lang === 'si' ? 'Select කළ එකට' : 'Use Selected'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Media Preview Modal */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-[#12161f] border border-white/15 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${getKindColorClass(previewAsset.kind)}`}>
                  {previewAsset.kind}
                </span>
                <span className="text-sm font-semibold text-white truncate">{previewAsset.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-[#090B10] flex items-center justify-center min-h-[240px] max-h-[65vh] overflow-auto">
              {previewAsset.kind === 'image' && resolvedPreviewUrl && (
                <img
                  src={resolvedPreviewUrl}
                  alt={previewAsset.name}
                  className="max-w-full max-h-[58vh] rounded-lg object-contain"
                />
              )}
              {previewAsset.kind === 'video' && (() => {
                const parsed = parseVideoUrl(resolvedPreviewUrl);
                if (parsed.kind === 'youtube' || parsed.kind === 'vimeo') {
                  return (
                    <iframe
                      src={parsed.embedUrl}
                      title={previewAsset.name}
                      className="w-full aspect-video rounded-lg border-0"
                      allowFullScreen
                    />
                  );
                }
                return resolvedPreviewUrl ? (
                  <video
                    controls
                    autoPlay
                    src={resolvedPreviewUrl}
                    className="w-full max-h-[55vh] rounded-lg bg-black"
                  />
                ) : (
                  <p className="text-xs text-slate-400">Video preview unavailable.</p>
                );
              })()}
              {previewAsset.kind === 'audio' && (
                <div className="w-full max-w-md space-y-3 text-center py-6">
                  <Music className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-300">{previewAsset.name}</p>
                  {resolvedPreviewUrl && <audio controls autoPlay src={resolvedPreviewUrl} className="w-full" />}
                </div>
              )}
              {previewAsset.kind === 'pdf' && (
                resolvedPreviewUrl ? (
                  <iframe
                    src={resolvedPreviewUrl}
                    title={previewAsset.name}
                    className="w-full h-[55vh] rounded-lg bg-white border-0"
                  />
                ) : (
                  <p className="text-xs text-slate-400">PDF preview unavailable.</p>
                )
              )}
            </div>
            <div className="px-4 py-3 border-t border-white/10 flex items-center justify-end gap-2 bg-[#12161f]">
              {selectedBlock && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyAssetToSelected(previewAsset);
                    setPreviewAsset(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer"
                >
                  Apply to {selectedBlock.name}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onInsertAssetToCanvas(previewAsset);
                  setPreviewAsset(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Canvas</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
