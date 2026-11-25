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
      if (onToast) onToast('BlockCraft Studio is already installed on your PC!', 'info');
      return;
    }

    if (isInstallable) {
      const success = await install();
      if (success && onToast) {
        onToast('🎉 BlockCraft Studio PC App installed successfully!', 'success');
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
          title="Install BlockCraft Studio App on your PC (Desktop PWA)"
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
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full p-2.5 rounded-lg bg-stone-50 dark:bg-zinc-900 hover:bg-stone-100 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-xs text-stone-800 dark:text-zinc-200 cursor-pointer transition-colors flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5 text-stone-500 dark:text-zinc-400" />
            <div>
              <div className="font-semibold">Install Desktop App</div>
              <div className="text-[11px] text-stone-500 dark:text-zinc-400">Offline cache & window</div>
            </div>
          </div>
          <Download className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-500" />
        </button>

        {showGuideModal && <PWAInstallGuideModal onClose={() => setShowGuideModal(false)} />}
      </>
    );
  }

  // Default button
  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer ${className}`}
      >
        <Monitor className="w-4 h-4" />
        <span>Install App on PC</span>
      </button>

      {showGuideModal && <PWAInstallGuideModal onClose={() => setShowGuideModal(false)} />}
    </>
  );
};

interface PWAInstallGuideModalProps {
  onClose: () => void;
}

const PWAInstallGuideModal: React.FC<PWAInstallGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md atelier-surface rounded-2xl p-6 shadow-2xl text-stone-800 dark:text-zinc-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-700 dark:text-zinc-200">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              Install BlockCraft Studio
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400">Run as a standalone desktop app</p>
          </div>
        </div>

        <div className="space-y-3 my-4 text-xs text-stone-600 dark:text-zinc-300">
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-stone-900 dark:text-white">
              <Laptop className="w-4 h-4" />
              <span>Chrome, Edge & Brave (Windows / Mac)</span>
            </div>
            <ol className="space-y-1 pl-5 list-decimal leading-relaxed">
              <li>Look at the right side of your browser's address bar.</li>
              <li>Click the Install App icon and confirm installation.</li>
            </ol>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-stone-900 dark:text-white">
              <Smartphone className="w-4 h-4" />
              <span>Mobile / iOS Safari</span>
            </div>
            <p className="leading-relaxed">
              Tap Share at the bottom of your browser and select Add to Home Screen.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-semibold text-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
