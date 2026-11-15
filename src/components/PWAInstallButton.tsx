import React, { useState } from 'react';
import { Download, Monitor, CheckCircle, X, Sparkles, Laptop, Smartphone, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'topbar' | 'button' | 'menu-item' | 'hero';
  className?: string;
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'button',
  className = '',
  onToast,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleInstallClick = async () => {
    if (isInstalled) {
      if (onToast) onToast('SL Builder is already installed on your PC!', 'info');
      return;
    }

    if (isInstallable) {
      const success = await install();
      if (success && onToast) {
        onToast('🎉 SL Builder PC App installed successfully!', 'success');
      }
    } else {
      // Show desktop / browser installation instructions
      setShowGuideModal(true);
    }
  };

  // If running inside an already installed PWA window:
  if (isInstalled) {
    if (variant === 'menu-item') {
      return (
        <div className="flex items-center justify-between px-3 py-2 text-xs text-emerald-400 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>PC App Installed</span>
          </span>
          <span className="text-[10px] font-mono">Standalone</span>
        </div>
      );
    }
    return null;
  }

  // Variant: Top bar pill button (compact)
  if (variant === 'topbar') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className={`px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm group ${className}`}
          title="Install SL Builder App on your PC (Desktop PWA)"
        >
          <Monitor className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Install PC App</span>
          <span className="sm:hidden">Install</span>
        </button>

        {showGuideModal && <PWAInstallGuideModal onClose={() => setShowGuideModal(false)} />}
      </>
    );
  }

  // Variant: Settings Menu Item
  if (variant === 'menu-item') {
    return (
      <>
        <div
          onClick={handleInstallClick}
          className="p-2 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-xs text-indigo-200 hover:text-white cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5 text-indigo-400 group-hover:text-cyan-300" />
            <div>
              <div className="font-semibold text-white">Install PC Desktop App</div>
              <div className="text-[10px] text-indigo-300/80">Offline cache, desktop window & dock icon</div>
            </div>
          </div>
          <Download className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-y-0.5 transition-transform" />
        </div>

        {showGuideModal && <PWAInstallGuideModal onClose={() => setShowGuideModal(false)} />}
      </>
    );
  }

  // Default button
  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-xs shadow-lg shadow-indigo-900/30 transition-all flex items-center gap-2 cursor-pointer ${className}`}
      >
        <Monitor className="w-4 h-4 text-indigo-200" />
        <span>Install App on PC</span>
      </button>

      {showGuideModal && <PWAInstallGuideModal onClose={() => setShowGuideModal(false)} />}
    </>
  );
};

// Modal that guides PC (Chrome/Edge), Mac, and Mobile users on installation
interface PWAInstallGuideModalProps {
  onClose: () => void;
}

const PWAInstallGuideModal: React.FC<PWAInstallGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#0c101b] border border-white/15 rounded-2xl p-5 sm:p-6 shadow-2xl text-slate-200 relative select-none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Install SL Builder on PC</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PWA Desktop
              </span>
            </h3>
            <p className="text-xs text-slate-400">Run as a standalone native desktop application</p>
          </div>
        </div>

        {/* Steps for Desktop PC */}
        <div className="space-y-3 my-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Laptop className="w-4 h-4 text-cyan-400" />
              <span>For Chrome, Edge & Brave on Windows / Mac:</span>
            </div>
            <ol className="text-xs text-slate-300 space-y-1.5 pl-5 list-decimal leading-relaxed">
              <li>
                Look at the <strong>right side of your browser's address bar</strong> (URL bar).
              </li>
              <li>
                Click the <strong>Install App icon (⊕ or computer monitor icon)</strong>.
              </li>
              <li>
                Click <strong>"Install"</strong> in the popup to place SL Builder on your Desktop and Taskbar!
              </li>
            </ol>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Browser Menu Alternative:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Click browser menu <strong>( ⋮ or ⋯ at top-right)</strong> ➔ <strong>"Save and share"</strong> or <strong>"Apps"</strong> ➔ Click <strong>"Install SL Builder"</strong>.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Mobile / iOS Safari:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tap the <strong>Share</strong> button at bottom ➔ Select <strong>"Add to Home Screen"</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">sw.js & manifest.json active</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
