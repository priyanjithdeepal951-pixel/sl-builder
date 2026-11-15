import { CanvasBlock } from '../types/builder';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateHtmlExport(projectName: string, blocks: CanvasBlock[]): string {
  const renderedBlocks = blocks
    .map((b) => {
      const content = escapeHtml(b.content || b.name);
      const subtitle = b.subtitle ? escapeHtml(b.subtitle) : '';
      switch (b.type) {
        case 'ui-navbar':
          return `  <nav class="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
    <span class="font-bold text-white">${content}</span>
    <span class="text-xs text-slate-400">${subtitle}</span>
  </nav>`;
        case 'ui-heading':
          return `  <header class="py-6 text-center space-y-2">
    <h1 class="text-3xl font-extrabold text-white tracking-tight">${content}</h1>
    ${subtitle ? `<p class="text-sm text-slate-400 max-w-xl mx-auto">${subtitle}</p>` : ''}
  </header>`;
        case 'ui-stat':
          return `  <div class="p-4 rounded-xl bg-white/5 border border-white/10">
    <div class="text-xs font-mono text-slate-400">${escapeHtml(b.statLabel || subtitle || b.name)}</div>
    <div class="text-2xl font-bold text-white mt-1">${escapeHtml(b.statValue || content)}</div>
  </div>`;
        case 'logic-counter':
          return `  <div id="${b.id}" class="p-5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-center">
    <div class="text-xs text-indigo-300 font-semibold">${escapeHtml(b.name)}</div>
    <div id="${b.id}-val" class="text-2xl font-bold text-white mt-1">${b.counterValue ?? 0}</div>
  </div>`;
        case 'ui-button':
          return `  <div class="text-center">
    <button data-target="${b.targetId || ''}" data-action="${b.action || ''}" class="sl-action-btn px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold">
      ${content}
    </button>
  </div>`;
        case 'backend-flask':
        case 'backend-fetch':
          return `  <section class="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
    <div class="text-xs font-mono text-emerald-400">${content}</div>
    <p class="text-xs text-slate-400 mt-1">${subtitle}</p>
  </section>`;
        case 'ui-footer':
          return `  <footer class="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
    <span>${content}</span>
    <span>${subtitle}</span>
  </footer>`;
        default:
          return `  <section class="p-4 rounded-xl bg-white/5 border border-white/10">
    <h3 class="text-base font-bold text-white">${content}</h3>
    ${subtitle ? `<p class="text-xs text-slate-400 mt-1">${subtitle}</p>` : ''}
  </section>`;
      }
    })
    .join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(projectName)} — Exported from SL Builder</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#090B10] text-slate-100 min-h-screen p-6">
  <main class="max-w-3xl mx-auto space-y-5">
${renderedBlocks}
  </main>

  <script>
    document.querySelectorAll('.sl-action-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const counterEl = targetId ? document.getElementById(targetId + '-val') : null;
        if (counterEl) {
          counterEl.textContent = String(Number(counterEl.textContent || 0) + 1);
        }
      });
    });
  </script>
</body>
</html>`;
}

export function generateReactTsxExport(projectName: string, blocks: CanvasBlock[]): string {
  const hasCounter = blocks.some((b) => b.type === 'logic-counter');
  const hasAccordion = blocks.some((b) => b.type === 'ui-accordion');

  const stateHooks = [
    hasCounter ? '  const [counter, setCounter] = useState<number>(0);' : '',
    hasAccordion ? '  const [openFaq, setOpenFaq] = useState<boolean>(false);' : '',
  ]
    .filter(Boolean)
    .join('\n');

  const jsxBody = blocks
    .map((b) => {
      const safeTitle = JSON.stringify(b.content || b.name);
      const safeSub = JSON.stringify(b.subtitle || '');
      switch (b.type) {
        case 'ui-navbar':
          return `      <nav className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
        <span className="font-bold text-white">{${safeTitle}}</span>
        <span className="text-xs text-slate-400">{${safeSub}}</span>
      </nav>`;
        case 'ui-heading':
          return `      <header className="py-6 text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white">{${safeTitle}}</h1>
        <p className="text-sm text-slate-400">{${safeSub}}</p>
      </header>`;
        case 'logic-counter':
          return `      <div className="p-5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-center">
        <p className="text-xs text-indigo-300 font-semibold">${b.name}</p>
        <p className="text-2xl font-bold text-white mt-1 tabular-nums">{counter}</p>
      </div>`;
        case 'ui-button':
          return `      <div className="text-center">
        <button
          onClick={() => ${hasCounter ? 'setCounter((c) => c + 1)' : 'console.log("Clicked")'}}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
        >
          {${safeTitle}}
        </button>
      </div>`;
        case 'ui-accordion':
          return `      <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
        <button
          onClick={() => setOpenFaq((o) => !o)}
          className="w-full text-left p-4 font-semibold text-sm text-white flex justify-between"
        >
          <span>{${safeTitle}}</span>
          <span>{openFaq ? '−' : '+'}</span>
        </button>
        {openFaq && <p className="px-4 pb-4 text-xs text-slate-400">{${safeSub}}</p>}
      </div>`;
        default:
          return `      <section className="p-4 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-base font-bold text-white">{${safeTitle}}</h3>
        {${safeSub} && <p className="text-xs text-slate-400 mt-1">{${safeSub}}</p>}
      </section>`;
      }
    })
    .join('\n\n');

  return `import React${stateHooks ? ', { useState }' : ''} from 'react';

// Generated by SL Builder WebStudio for "${projectName}"
export function GeneratedApp() {
${stateHooks}

  return (
    <main className="min-h-screen bg-[#090B10] text-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-5">
${jsxBody}
      </div>
    </main>
  );
}`;
}

export function generateFlaskExport(projectName: string, blocks: CanvasBlock[]): string {
  const apiBlocks = blocks.filter(
    (b) => b.type === 'backend-flask' || b.type === 'backend-fetch'
  );

  const routes =
    apiBlocks.length > 0
      ? apiBlocks
          .map((b, idx) => {
            const path = b.apiEndpoint || `/api/v1/resource_${idx + 1}`;
            const fnName = `handler_${idx + 1}`;
            return `@app.route("${path}", methods=["GET", "POST"])
def ${fnName}():
    return jsonify({
        "service": ${JSON.stringify(b.name)},
        "endpoint": ${JSON.stringify(path)},
        "status": "ok",
        "uptime": "99.98%"
    })`;
          })
          .join('\n\n')
      : `@app.route("/api/v1/health", methods=["GET"])
def health_check():
    return jsonify({"project": ${JSON.stringify(projectName)}, "status": "healthy"})`;

  return `from flask import Flask, jsonify, request
from flask_cors import CORS

# Generated by SL Builder WebStudio for "${projectName}"
app = Flask(__name__)
CORS(app)

${routes}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
`;
}
