import React, { useState } from 'react';
import { X, Copy, Download, Code2, Check, FileCode2, FileJson } from 'lucide-react';
import { CanvasBlock, Project } from '../../types/builder';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  project,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'html' | 'react' | 'python' | 'js' | 'json'>('html');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate HTML code
  const generateHtmlCode = () => {
    const blocksHtml = project.blocks
      .map((b) => {
        if (b.type === 'ui-heading') {
          return `    <div id="${b.id}" class="py-4 text-${b.style.textAlign || 'left'}">
      <h1 class="text-${b.style.fontSize || '3xl'} font-extrabold text-white tracking-tight">${b.content}</h1>
      ${b.subtitle ? `<p class="text-slate-400 text-sm mt-1">${b.subtitle}</p>` : ''}
    </div>`;
        }
        if (b.type === 'ui-paragraph') {
          return `    <div id="${b.id}" class="py-2 text-${b.style.textAlign || 'left'}">
      <p class="text-slate-300 text-${b.style.fontSize || 'base'} leading-relaxed">${b.content}</p>
    </div>`;
        }
        if (b.type === 'ui-button') {
          return `    <div class="py-2 text-${b.style.textAlign || 'left'}">
      <button id="${b.id}" class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg transition-all">
        ${b.content}
      </button>
    </div>`;
        }
        if (b.type === 'ui-stat') {
          return `    <div id="${b.id}" class="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between my-2">
      <div>
        <div class="text-xs font-mono text-slate-400 uppercase">${b.statLabel || b.subtitle || 'KPI METRIC'}</div>
        <div class="text-3xl font-extrabold text-white font-mono">${b.statValue || b.content}</div>
      </div>
    </div>`;
        }
        if (b.type === 'ui-testimonial') {
          return `    <div id="${b.id}" class="p-5 rounded-xl bg-white/5 border border-white/10 space-y-2 my-2">
      <p class="text-sm text-slate-200 italic">"${b.content}"</p>
      <div class="text-xs font-semibold text-white pt-2 border-t border-white/10">${b.subtitle || 'Customer Review'}</div>
    </div>`;
        }
        if (b.type === 'ui-accordion') {
          return `    <details id="${b.id}" class="rounded-xl bg-white/5 border border-white/10 p-3 my-2 cursor-pointer">
      <summary class="font-semibold text-xs text-white">${b.content}</summary>
      <p class="text-xs text-slate-400 pt-2 leading-relaxed">${b.subtitle || 'Details and expanded answer.'}</p>
    </details>`;
        }
        if (b.type === 'ui-footer') {
          return `    <footer id="${b.id}" class="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 my-4">
      <span>${b.content}</span>
      <span>${b.subtitle || 'Terms · Privacy · GitHub'}</span>
    </footer>`;
        }
        if (b.type === 'logic-counter') {
          return `    <div id="${b.id}" class="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 text-center my-3">
      <div class="text-xs font-mono text-indigo-300">Reactive Variable Counter</div>
      <div id="counter-display" class="text-3xl font-extrabold font-mono text-white my-1">${b.counterValue || 0}</div>
      <div class="text-xs text-slate-400">${b.content}</div>
    </div>`;
        }
        if (b.type === 'backend-flask') {
          return `    <div id="${b.id}" class="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 my-3">
      <div class="flex items-center justify-between text-emerald-400 text-xs font-bold">
        <span>${b.name}</span>
        <span class="font-mono text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">REST API</span>
      </div>
      <div class="text-xs font-mono text-emerald-300 mt-1">${b.content}</div>
    </div>`;
        }
        return `    <div id="${b.id}" class="p-3 my-2 text-slate-200">${b.content}</div>`;
      })
      .join('\n\n');

    // Generate wired JS handlers
    const wiredScripts = project.blocks
      .filter((b) => b.action)
      .map((b) => {
        if (b.action === 'increment-counter') {
          return `  let count_${b.id.replace(/-/g, '_')} = 0;
  document.getElementById("${b.id}")?.addEventListener("click", () => {
    count_${b.id.replace(/-/g, '_')}++;
    const target = document.getElementById("counter-display");
    if (target) target.textContent = count_${b.id.replace(/-/g, '_')};
    console.log("Triggered counter:", count_${b.id.replace(/-/g, '_')});
  });`;
        }
        if (b.action === 'change-text') {
          return `  document.getElementById("${b.id}")?.addEventListener("click", () => {
    const target = document.getElementById("${b.targetId || 'target-title'}");
    if (target) target.textContent = "${b.actionPayload || 'Hello Universe!'}";
  });`;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${project.name} — Generated by SL Builder</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#07090e] text-slate-100 min-h-screen p-6 sm:p-12 selection:bg-indigo-500 selection:text-white">
  <main class="max-w-2xl mx-auto bg-[#0c101b] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
${blocksHtml}
  </main>

  <script>
${wiredScripts}
  </script>
</body>
</html>`;
  };

  // Generate React 19 code
  const generateReactCode = () => {
    return `import React, { useState } from 'react';

export default function ${project.name.replace(/[^a-zA-Z0-9]/g, '') || 'App'}() {
  const [counter, setCounter] = useState(0);

  const handleIncrement = () => {
    setCounter(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-6 sm:p-12 flex justify-center">
      <div className="w-full max-w-2xl bg-[#0c101b] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
${project.blocks
  .map((b) => {
    if (b.type === 'ui-heading') {
      return `        <h1 className="text-3xl font-extrabold text-white tracking-tight">${b.content}</h1>`;
    }
    if (b.type === 'ui-button') {
      return `        <button onClick={handleIncrement} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg transition-all">
          ${b.content}
        </button>`;
    }
    if (b.type === 'ui-stat') {
      return `        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
          <span className="text-xs font-mono text-slate-400">${b.statLabel || 'METRIC'}</span>
          <span className="text-2xl font-bold font-mono text-white">${b.statValue || b.content}</span>
        </div>`;
    }
    if (b.type === 'logic-counter') {
      return `        <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 text-center">
          <div className="text-xs font-mono text-indigo-300">Reactive State</div>
          <div className="text-3xl font-extrabold font-mono text-white my-1">{counter}</div>
          <div className="text-xs text-slate-400">${b.content}</div>
        </div>`;
    }
    return `        <div className="p-3 bg-white/5 rounded-xl">${b.content}</div>`;
  })
  .join('\n')}
      </div>
    </div>
  );
}`;
  };

  // Generate Python Flask code
  const generatePythonCode = () => {
    return `from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Generated API Routes for ${project.name}
@app.route("/api/v1/metrics", methods=["GET"])
def get_metrics():
    return jsonify({
        "status": "online",
        "project": "${project.name}",
        "uptime": "99.98%",
        "active_blocks": ${project.blocks.length}
    })

@app.route("/api/v1/events", methods=["POST"])
def log_event():
    data = request.get_json() or {}
    print(f"Logged event: {data}")
    return jsonify({"success": True, "received": data}), 201

if __name__ == "__main__":
    print("SL Studio Flask Server starting on port 5000...")
    app.run(host="0.0.0.0", port=5000, debug=True)`;
  };

  // Generate Vanilla JS code
  const generateJsCode = () => {
    return `// JavaScript Logic Layer for ${project.name}
document.addEventListener("DOMContentLoaded", () => {
  console.log("SL Universe Studio Client Initialized");

  const state = {
    counter: 0,
    activeElements: ${project.blocks.length}
  };

  window.triggerAction = (actionType, payload) => {
    if (actionType === "increment-counter") {
      state.counter++;
      const el = document.getElementById("counter-display");
      if (el) el.textContent = state.counter;
    }
  };
});`;
  };

  // Generate Blueprint JSON
  const generateJsonBlueprint = () => {
    return JSON.stringify(
      {
        version: '2026.1',
        project: {
          id: project.id,
          name: project.name,
          category: project.category,
          updatedAt: new Date().toISOString(),
          blocks: project.blocks,
        },
      },
      null,
      2
    );
  };

  const getActiveCode = () => {
    switch (activeTab) {
      case 'html':
        return generateHtmlCode();
      case 'react':
        return generateReactCode();
      case 'python':
        return generatePythonCode();
      case 'js':
        return generateJsCode();
      case 'json':
        return generateJsonBlueprint();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    onToast('Code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext =
      activeTab === 'html'
        ? 'html'
        : activeTab === 'react'
        ? 'tsx'
        : activeTab === 'python'
        ? 'py'
        : activeTab === 'json'
        ? 'json'
        : 'js';
    const blob = new Blob([getActiveCode()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
    onToast(`Downloaded ${link.download}!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-6 sm:p-7 max-w-3xl w-full shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Generated Output</h3>
              <p className="text-xs text-slate-400">Production-ready source code and blueprint for {project.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 bg-[#07090e] p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('html')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'html' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              HTML + Tailwind
            </button>
            <button
              onClick={() => setActiveTab('react')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'react' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              React 19 TSX
            </button>
            <button
              onClick={() => setActiveTab('python')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'python' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Flask API
            </button>
            <button
              onClick={() => setActiveTab('js')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'js' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Vanilla JS
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'json' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileJson className="w-3 h-3" />
              <span>Blueprint (.json)</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
            {getActiveCode().split('\n').length} lines
          </div>
        </div>

        {/* Code Content Box */}
        <div className="flex-grow bg-[#05070d] border border-white/10 rounded-xl p-4 overflow-y-auto font-mono text-xs text-indigo-300 leading-relaxed mb-4 max-h-[380px]">
          <pre className="whitespace-pre-wrap">{getActiveCode()}</pre>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
            <a
              href="/sl_builder_pro_complete.html"
              download="sl_builder_pro_complete.html"
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download standalone offline studio single file"
            >
              <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Single-File Studio (.html)</span>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
