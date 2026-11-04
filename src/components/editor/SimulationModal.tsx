import React, { useState } from 'react';
import {
  X,
  Play,
  RotateCcw,
  Monitor,
  Tablet,
  Smartphone,
  Terminal,
  Zap,
  CheckCircle2,
  Server,
} from 'lucide-react';
import { CanvasBlock, Project, ViewportMode } from '../../types/builder';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [simulatedBlocks, setSimulatedBlocks] = useState<CanvasBlock[]>(project.blocks);
  const [consoleLogs, setConsoleLogs] = useState<
    { id: string; time: string; message: string; type: 'info' | 'success' | 'api' }[]
  >([
    {
      id: 'init',
      time: new Date().toLocaleTimeString(),
      message: `Simulation sandbox mounted for "${project.name}". Ready for interactions.`,
      type: 'info',
    },
  ]);

  if (!isOpen) return null;

  const handleReset = () => {
    setSimulatedBlocks(project.blocks);
    setConsoleLogs([
      {
        id: 'reset',
        time: new Date().toLocaleTimeString(),
        message: 'Sandbox state re-initialized to default project layout.',
        type: 'info',
      },
    ]);
  };

  const handleBlockClick = (block: CanvasBlock) => {
    const time = new Date().toLocaleTimeString();

    if (block.action === 'increment-counter') {
      setSimulatedBlocks((prev) =>
        prev.map((b) => {
          if (b.id === block.targetId || b.id === block.id) {
            const currentVal = b.counterValue || 0;
            return { ...b, counterValue: currentVal + 1 };
          }
          return b;
        })
      );
      setConsoleLogs((prev) => [
        {
          id: 'log_' + Date.now(),
          time,
          message: `⚡ Triggered event: Incremented counter on #${block.targetId || block.id}`,
          type: 'success',
        },
        ...prev,
      ]);
    } else if (block.action === 'change-text') {
      const payload = block.actionPayload || 'Hello, Universe!';
      setSimulatedBlocks((prev) =>
        prev.map((b) => {
          if (b.id === block.targetId) {
            return { ...b, content: payload };
          }
          return b;
        })
      );
      setConsoleLogs((prev) => [
        {
          id: 'log_' + Date.now(),
          time,
          message: `⚡ Wire Action: Updated text content of #${block.targetId} to "${payload}"`,
          type: 'success',
        },
        ...prev,
      ]);
    } else if (block.action === 'call-api') {
      const endpoint = block.apiEndpoint || '/api/v1/metrics';
      setConsoleLogs((prev) => [
        {
          id: 'log_' + Date.now(),
          time,
          message: `🐍 Dispatched HTTP GET ${endpoint} ➔ Received 200 OK: {"status":"healthy", "node":"sl-cosmic-cluster"}`,
          type: 'api',
        },
        ...prev,
      ]);
    } else {
      setConsoleLogs((prev) => [
        {
          id: 'log_' + Date.now(),
          time,
          message: `Clicked element [${block.name}] (${block.id})`,
          type: 'info',
        },
        ...prev,
      ]);
    }
  };

  const getViewportWidthClass = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-[375px]';
      case 'tablet':
        return 'max-w-[768px]';
      case 'desktop':
      default:
        return 'max-w-2xl';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-[#0b0f19] border border-gray-800 rounded-3xl w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Top Control Bar */}
        <div className="bg-gray-950 border-b border-gray-900 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/70 border border-emerald-800/50 text-emerald-400 text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SIMULATION RUNNING</span>
            </div>
            <span className="text-sm font-bold text-white hidden sm:inline">{project.name}</span>
          </div>

          {/* Viewport switchers */}
          <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded-lg transition-all ${
                viewport === 'desktop' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded-lg transition-all ${
                viewport === 'tablet' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Tablet View"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded-lg transition-all ${
                viewport === 'mobile' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-gray-900 hover:bg-gray-850 text-gray-400 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all"
              title="Reset Sandbox"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-900 hover:bg-gray-850 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Sandbox Canvas */}
        <div className="flex-grow bg-[#04060c] p-6 overflow-y-auto flex justify-center items-start">
          <div
            className={`w-full ${getViewportWidthClass()} bg-[#0b0f19] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-300 space-y-4`}
          >
            {simulatedBlocks.map((block) => (
              <div
                key={block.id}
                onClick={() => handleBlockClick(block)}
                className={`p-4 rounded-2xl transition-all cursor-pointer ${
                  block.style.bgColor || 'bg-gray-900/60'
                } ${block.style.borderRadius || 'rounded-xl'} hover:ring-2 hover:ring-indigo-500/50`}
              >
                {block.type === 'ui-heading' && (
                  <div className={`text-${block.style.textAlign || 'left'}`}>
                    <h2
                      className={`font-extrabold text-white text-${
                        block.style.fontSize || '2xl'
                      } tracking-tight`}
                    >
                      {block.content}
                    </h2>
                    {block.subtitle && <p className="text-xs text-gray-400 mt-1">{block.subtitle}</p>}
                  </div>
                )}

                {block.type === 'ui-paragraph' && (
                  <p className={`text-gray-300 text-${block.style.fontSize || 'sm'} text-${block.style.textAlign || 'left'}`}>
                    {block.content}
                  </p>
                )}

                {block.type === 'ui-button' && (
                  <div className={`text-${block.style.textAlign || 'left'}`}>
                    <button className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg transition-all active:scale-95 flex items-center gap-2">
                      <span>{block.content}</span>
                      <Zap className="w-3.5 h-3.5 text-yellow-300" />
                    </button>
                  </div>
                )}

                {block.type === 'logic-counter' && (
                  <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-800/60 text-center">
                    <span className="text-[10px] font-mono text-indigo-300 uppercase">Live State Counter</span>
                    <div className="text-3xl font-extrabold font-mono text-white my-1">
                      {block.counterValue !== undefined ? block.counterValue : 0}
                    </div>
                    <span className="text-xs text-gray-400">{block.content}</span>
                  </div>
                )}

                {block.type === 'ui-navbar' && (
                  <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
                    <span className="font-bold text-white text-sm">{block.content}</span>
                    <span className="text-xs text-gray-400">{block.subtitle || 'Home · Features'}</span>
                  </div>
                )}

                {block.type === 'backend-flask' && (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs">
                    <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
                      <span>{block.name}</span>
                      <span className="text-[10px] font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        CLICK TO CALL API
                      </span>
                    </div>
                    <p className="font-mono text-emerald-300 text-[11px]">{block.content}</p>
                  </div>
                )}

                {block.type !== 'ui-heading' &&
                  block.type !== 'ui-paragraph' &&
                  block.type !== 'ui-button' &&
                  block.type !== 'logic-counter' &&
                  block.type !== 'ui-navbar' &&
                  block.type !== 'backend-flask' && (
                    <div className="text-xs text-gray-300">{block.content}</div>
                  )}
              </div>
            ))}
          </div>
        </div>

        {/* Live Interaction Console Log Drawer */}
        <div className="h-44 bg-[#080c16] border-t border-gray-900 flex flex-col p-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-gray-900 text-gray-400 text-[11px]">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-bold text-white">Interactive Event Console</span>
            </div>
            <button
              onClick={() => setConsoleLogs([])}
              className="text-gray-500 hover:text-white text-[10px]"
            >
              Clear Logs
            </button>
          </div>
          <div className="flex-grow overflow-y-auto space-y-1.5 pt-2 text-[11px]">
            {consoleLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2">
                <span className="text-gray-500 shrink-0">[{log.time}]</span>
                <span
                  className={
                    log.type === 'success'
                      ? 'text-emerald-400'
                      : log.type === 'api'
                      ? 'text-indigo-300'
                      : 'text-gray-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
