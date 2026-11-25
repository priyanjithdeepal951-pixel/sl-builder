import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeSwitcherProps {
  compact?: boolean;
  pill?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ compact = false, pill = false }) => {
  const { currentTheme, themeConfig, setTheme, allThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 transition-colors border cursor-pointer ${
          pill
            ? 'rounded-lg px-3 py-2 text-xs bg-stone-100 dark:bg-zinc-900 hover:bg-stone-200/80 dark:hover:bg-zinc-800 border-stone-200 dark:border-zinc-800 text-stone-900 dark:text-zinc-100 font-medium'
            : compact
            ? 'rounded-lg px-2.5 py-1.5 text-xs bg-stone-100 dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-stone-800 dark:text-zinc-200'
            : 'rounded-lg px-3 py-1.5 text-xs bg-stone-100 dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-stone-800 dark:text-zinc-200'
        }`}
        title="Switch Studio Accent Palette"
      >
        <span className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
            style={{ backgroundColor: themeConfig.accentHex }}
          />
          <span className="font-medium text-xs whitespace-nowrap">{themeConfig.name}</span>
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-500 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white dark:bg-[#12141a] border border-stone-200 dark:border-zinc-800 p-1.5 shadow-xl z-50">
          <div className="px-2.5 py-1.5 border-b border-stone-100 dark:border-zinc-800 mb-1 flex items-center justify-between text-[11px] font-mono text-stone-400 dark:text-zinc-500">
            <span>Accent Palette</span>
            <span>{allThemes.length}</span>
          </div>

          <div className="space-y-0.5">
            {allThemes.map((th) => {
              const isSelected = currentTheme === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => {
                    setTheme(th.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between text-xs cursor-pointer ${
                    isSelected
                      ? 'bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-white font-semibold'
                      : 'hover:bg-stone-50 dark:hover:bg-zinc-900 text-stone-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: th.accentHex }}
                    />
                    <div>
                      <div className="text-xs leading-tight">{th.name}</div>
                      <div className="text-[11px] text-stone-500 dark:text-zinc-500">{th.subtitle}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
