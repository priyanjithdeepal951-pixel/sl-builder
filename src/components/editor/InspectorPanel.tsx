import React, { useState } from 'react';
import {
  Sliders,
  Trash2,
  Copy,
  Zap,
  Sparkles,
} from 'lucide-react';
import { CanvasBlock } from '../../types/builder';

interface InspectorPanelProps {
  selectedBlock: CanvasBlock | null;
  allBlocks: CanvasBlock[];
  onUpdateBlock: (updated: CanvasBlock) => void;
  onDeleteBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedBlock,
  allBlocks,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
}) => {
  const [activeTab, setActiveTab] = useState<'props' | 'code' | 'ai'>('props');
  const [codeLang, setCodeLang] = useState<'js' | 'python' | 'react'>('js');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  if (!selectedBlock) {
    return (
      <div className="w-72 bg-[#090c15] border-l border-white/10 flex flex-col h-full p-4 justify-between text-xs text-slate-500 select-none">
        <div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Inspector</span>
          </div>
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 mx-auto">
              <Sliders className="w-4 h-4" />
            </div>
            <p className="font-semibold text-slate-300">No Element Selected</p>
            <p className="text-[11px] text-slate-500">
              Click any element in the canvas to customize its typography, surfaces, and reactive wires.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-400 font-mono">
          <span>Active stack: {allBlocks.length} elements</span>
        </div>
      </div>
    );
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onUpdateBlock({
      ...selectedBlock,
      content: e.target.value,
    });
  };

  const handleSubtitleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onUpdateBlock({
      ...selectedBlock,
      subtitle: e.target.value,
    });
  };

  const handleStatValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateBlock({
      ...selectedBlock,
      statValue: e.target.value,
    });
  };

  const handleStatLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateBlock({
      ...selectedBlock,
      statLabel: e.target.value,
    });
  };

  const handleAuthorRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateBlock({
      ...selectedBlock,
      authorRole: e.target.value,
    });
  };

  const handleAuthorAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateBlock({
      ...selectedBlock,
      authorAvatar: e.target.value,
      imageUrl: e.target.value,
    });
  };

  const handleFontSizeChange = (size: any) => {
    onUpdateBlock({
      ...selectedBlock,
      style: { ...selectedBlock.style, fontSize: size },
    });
  };

  const handleAlignChange = (align: 'left' | 'center' | 'right') => {
    onUpdateBlock({
      ...selectedBlock,
      style: { ...selectedBlock.style, textAlign: align },
    });
  };

  const handleBgChange = (bgColor: string) => {
    onUpdateBlock({
      ...selectedBlock,
      style: { ...selectedBlock.style, bgColor },
    });
  };

  const handleRadiusChange = (radius: string) => {
    onUpdateBlock({
      ...selectedBlock,
      style: { ...selectedBlock.style, borderRadius: radius },
    });
  };

  const handleTargetChange = (targetId: string) => {
    onUpdateBlock({
      ...selectedBlock,
      targetId: targetId || undefined,
    });
  };

  const handleActionChange = (action: any) => {
    onUpdateBlock({
      ...selectedBlock,
      action,
    });
  };

  const handlePayloadChange = (payload: string) => {
    onUpdateBlock({
      ...selectedBlock,
      actionPayload: payload,
    });
  };

  const handleAiRefine = () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setTimeout(() => {
      let refined = selectedBlock.content;
      if (aiPrompt.toLowerCase().includes('punchy') || aiPrompt.toLowerCase().includes('shorter')) {
        refined = 'Ship 10x Faster with SL Studio';
      } else if (aiPrompt.toLowerCase().includes('pro') || aiPrompt.toLowerCase().includes('enterprise')) {
        refined = 'Enterprise Autonomous Cloud Engineering Suite';
      } else {
        refined = `${selectedBlock.content} — Refined with SL Studio AI`;
      }

      onUpdateBlock({
        ...selectedBlock,
        content: refined,
      });
      setAiLoading(false);
      setAiPrompt('');
    }, 500);
  };

  // Generate dynamic code for the selected block
  const generatedJsCode = `// Wire event for: ${selectedBlock.name}
const el = document.getElementById("${selectedBlock.id}");
${
  selectedBlock.action === 'increment-counter'
    ? `let counter = 0;
el?.addEventListener("click", () => {
  counter++;
  const target = document.getElementById("${selectedBlock.targetId || 'counter-target'}");
  if (target) target.textContent = \`Clicks: \${counter}\`;
});`
    : selectedBlock.action === 'change-text'
    ? `el?.addEventListener("click", () => {
  const target = document.getElementById("${selectedBlock.targetId || 'text-target'}");
  if (target) target.textContent = "${selectedBlock.actionPayload || 'Updated Content'}";
});`
    : selectedBlock.action === 'call-api'
    ? `el?.addEventListener("click", async () => {
  const res = await fetch("${selectedBlock.apiEndpoint || '/api/hello'}");
  const data = await res.json();
  console.log("Response:", data);
});`
    : `el?.addEventListener("click", () => {
  console.log("Triggered block ${selectedBlock.id}");
});`
}`;

  const generatedPythonCode = `# Python Flask Route for ${selectedBlock.name}
from flask import Flask, jsonify, request
app = Flask(__name__)

@app.route("${selectedBlock.apiEndpoint || '/api/event'}", methods=["GET", "POST"])
def handle_${selectedBlock.id.replace(/-/g, '_')}():
    return jsonify({
        "status": "success",
        "blockId": "${selectedBlock.id}",
        "message": "Processed ${selectedBlock.name} event"
    })`;

  const generatedReactCode = `// React 19 Component
export function ${selectedBlock.name.replace(/[^a-zA-Z0-9]/g, '')}() {
  const [state, setState] = useState("${selectedBlock.content}");

  return (
    <div className="${selectedBlock.style.bgColor || 'bg-slate-900'} ${selectedBlock.style.padding || 'p-4'} ${selectedBlock.style.borderRadius || 'rounded-xl'}">
      <h3 className="text-${selectedBlock.style.fontSize || 'base'} text-${selectedBlock.style.textAlign || 'left'} text-white font-bold">
        {state}
      </h3>
    </div>
  );
}`;

  return (
    <div className="w-72 bg-[#090c15] border-l border-white/10 flex flex-col h-full overflow-hidden select-none">
      {/* Segmented Top Tabs */}
      <div className="p-2 border-b border-white/10 bg-[#07090e]">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('props')}
            className={`flex-1 py-1 text-center rounded transition-colors ${
              activeTab === 'props' ? 'bg-white/15 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Props
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-1 text-center rounded transition-colors ${
              activeTab === 'code' ? 'bg-white/15 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Code
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-1 text-center rounded transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'ai' ? 'bg-white/15 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3 text-indigo-300" />
            <span>AI</span>
          </button>
        </div>
      </div>

      {/* PROPERTIES TAB */}
      {activeTab === 'props' && (
        <div className="flex-grow overflow-y-auto p-3.5 space-y-4 text-xs">
          {/* Header & Quick actions */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
            <div>
              <span className="text-[10px] font-mono text-indigo-400 uppercase">
                {selectedBlock.category}
              </span>
              <h4 className="font-bold text-white text-xs truncate max-w-[150px]">
                {selectedBlock.name}
              </h4>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDuplicateBlock(selectedBlock.id)}
                title="Duplicate"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeleteBlock(selectedBlock.id)}
                title="Delete"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Conditional properties for specific blocks */}
          {selectedBlock.type === 'ui-stat' && (
            <div className="space-y-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Metric Value</label>
                <input
                  type="text"
                  value={selectedBlock.statValue || selectedBlock.content}
                  onChange={handleStatValueChange}
                  placeholder="e.g. 99.98% or 10x"
                  className="w-full bg-[#080b13] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Metric Label</label>
                <input
                  type="text"
                  value={selectedBlock.statLabel || selectedBlock.subtitle || ''}
                  onChange={handleStatLabelChange}
                  placeholder="e.g. DEPLOYMENT UPTIME"
                  className="w-full bg-[#080b13] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          )}

          {selectedBlock.type === 'ui-testimonial' && (
            <div className="space-y-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Reviewer Name</label>
                <input
                  type="text"
                  value={selectedBlock.subtitle || ''}
                  onChange={handleSubtitleChange}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-[#080b13] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Reviewer Role / Company</label>
                <input
                  type="text"
                  value={selectedBlock.authorRole || ''}
                  onChange={handleAuthorRoleChange}
                  placeholder="e.g. VP of Product at Nexus"
                  className="w-full bg-[#080b13] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Primary Text Content */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              {selectedBlock.type === 'ui-accordion'
                ? 'Question Title'
                : selectedBlock.type === 'ui-testimonial'
                ? 'Testimonial Quote'
                : 'Primary Text Content'}
            </label>
            <textarea
              rows={2}
              value={selectedBlock.content}
              onChange={handleTextChange}
              className="w-full bg-[#080b13] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Subtitle / Helper text / Accordion Answer */}
          {selectedBlock.type !== 'ui-stat' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {selectedBlock.type === 'ui-accordion' ? 'Answer Text' : 'Subtitle / Helper Text'}
              </label>
              <textarea
                rows={selectedBlock.type === 'ui-accordion' ? 3 : 1}
                value={selectedBlock.subtitle || ''}
                onChange={handleSubtitleChange}
                placeholder="Optional secondary text or answer..."
                className="w-full bg-[#080b13] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          )}

          {/* Typography Controls */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Font Size</label>
            <div className="grid grid-cols-4 gap-1">
              {(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleFontSizeChange(sz)}
                  className={`py-1 rounded border text-[10px] font-mono transition-colors cursor-pointer ${
                    selectedBlock.style.fontSize === sz
                      ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Alignment Controls */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Text Alignment</label>
            <div className="grid grid-cols-3 gap-1">
              {(['left', 'center', 'right'] as const).map((al) => (
                <button
                  key={al}
                  type="button"
                  onClick={() => handleAlignChange(al)}
                  className={`py-1 rounded border text-xs capitalize transition-colors cursor-pointer ${
                    selectedBlock.style.textAlign === al
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {al}
                </button>
              ))}
            </div>
          </div>

          {/* Background Preset */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Surface Style</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Obsidian Card', val: 'bg-white/5' },
                { label: 'Deep Glass', val: 'bg-black/60' },
                { label: 'Indigo Tint', val: 'bg-indigo-950/30' },
                { label: 'Emerald Tint', val: 'bg-emerald-950/30' },
              ].map((bg) => (
                <button
                  key={bg.val}
                  type="button"
                  onClick={() => handleBgChange(bg.val)}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] truncate transition-colors text-left cursor-pointer ${
                    selectedBlock.style.bgColor === bg.val
                      ? 'border-indigo-500 text-white bg-indigo-600/20'
                      : 'border-white/5 text-slate-400 bg-white/5 hover:text-white'
                  }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Corner Radius */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Corner Radius</label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: 'None', val: 'rounded-none' },
                { label: 'Sm', val: 'rounded-lg' },
                { label: 'Lg', val: 'rounded-2xl' },
                { label: 'Pill', val: 'rounded-full' },
              ].map((rad) => (
                <button
                  key={rad.val}
                  type="button"
                  onClick={() => handleRadiusChange(rad.val)}
                  className={`py-1 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                    selectedBlock.style.borderRadius === rad.val
                      ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {rad.label}
                </button>
              ))}
            </div>
          </div>

          {/* LOGIC WIRING ATTACHMENT */}
          <div className="pt-3 border-t border-white/10 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Zap className="w-3.5 h-3.5" />
              <span>Reactive Logic Event Wire</span>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">TRIGGER ACTION</label>
              <select
                value={selectedBlock.action || 'none'}
                onChange={(e) => handleActionChange(e.target.value === 'none' ? undefined : e.target.value)}
                className="w-full bg-[#080b13] border border-white/10 rounded-lg p-1.5 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="none">None (Static Display)</option>
                <option value="increment-counter">Increment State Counter (+1)</option>
                <option value="change-text">Change Target Element Text</option>
                <option value="call-api">Send Python/REST API Call</option>
                <option value="toggle-visibility">Toggle Element Visibility</option>
              </select>
            </div>

            {selectedBlock.action && (
              <>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">TARGET ELEMENT</label>
                  <select
                    value={selectedBlock.targetId || ''}
                    onChange={(e) => handleTargetChange(e.target.value)}
                    className="w-full bg-[#080b13] border border-white/10 rounded-lg p-1.5 text-xs text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">Select target block...</option>
                    {allBlocks
                      .filter((b) => b.id !== selectedBlock.id)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.id.substring(0, 10)})
                        </option>
                      ))}
                  </select>
                </div>

                {selectedBlock.action === 'change-text' && (
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">REPLACEMENT TEXT</label>
                    <input
                      type="text"
                      value={selectedBlock.actionPayload || ''}
                      onChange={(e) => handlePayloadChange(e.target.value)}
                      placeholder="e.g. Welcome to Universe!"
                      className="w-full bg-[#080b13] border border-white/10 rounded-lg p-1.5 text-xs text-white outline-none"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* LIVE CODE GENERATOR TAB */}
      {activeTab === 'code' && (
        <div className="flex-grow flex flex-col p-3 overflow-hidden space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-[10px] font-mono text-slate-400">OUTPUT:</span>
            <div className="flex items-center gap-1">
              {(['js', 'python', 'react'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCodeLang(lang)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors cursor-pointer ${
                    codeLang === lang ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-grow bg-[#05070d] border border-white/10 rounded-xl p-3 font-mono text-[11px] overflow-y-auto leading-relaxed">
            {codeLang === 'js' && <pre className="text-emerald-400 whitespace-pre-wrap">{generatedJsCode}</pre>}
            {codeLang === 'python' && <pre className="text-indigo-300 whitespace-pre-wrap">{generatedPythonCode}</pre>}
            {codeLang === 'react' && <pre className="text-cyan-300 whitespace-pre-wrap">{generatedReactCode}</pre>}
          </div>

          <div className="text-[10px] text-slate-500 font-mono text-center">
            Updated in real-time as you edit blocks.
          </div>
        </div>
      )}

      {/* AI ASSISTANT TAB */}
      {activeTab === 'ai' && (
        <div className="flex-grow p-3 overflow-y-auto space-y-3.5 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-white text-xs">Content Copilot</p>
              <p className="text-[11px] text-slate-400">
                Ask to adjust tone, phrasing, or value propositions.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Prompt</label>
            <textarea
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Make this headline punchier, or change to enterprise tone..."
              className="w-full bg-[#080b13] border border-white/10 rounded-lg p-2.5 text-white placeholder-slate-600 outline-none focus:border-indigo-500 text-xs resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              'Make it punchy & viral',
              'Convert to enterprise tone',
              'Add compelling CTA phrasing',
            ].map((suggest) => (
              <button
                key={suggest}
                type="button"
                onClick={() => setAiPrompt(suggest)}
                className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                {suggest}
              </button>
            ))}
          </div>

          <button
            onClick={handleAiRefine}
            disabled={aiLoading || !aiPrompt.trim()}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {aiLoading ? (
              <span>Refining block...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply Transformation</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
