import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown } from 'lucide-react';
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
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 transition-all border ${
          pill
            ? 'rounded-full px-3.5 py-1.5 text-xs bg-[#111625] hover:bg-[#182035] border-white/15 hover:border-white/30 text-white font-medium shadow-sm'
            : compact
            ? 'rounded-xl px-2.5 py-1 text-xs bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
            : 'rounded-xl px-3 py-1.5 text-xs bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
        }`}
        title="Switch Studio Palette"
      >
        <span className="text-sm select-none">{themeConfig.emoji}</span>
        <span className="font-semibold text-xs text-white">{themeConfig.name}</span>
        <span
          className="w-2.5 h-2.5 rounded-full inline-block shadow-sm ring-1 ring-white/20"
          style={{ backgroundColor: themeConfig.accentHex }}
        />
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-xl bg-[#0c101b] border border-white/10 p-1.5 shadow-2xl z-50 backdrop-blur-2xl">
          <div className="px-2.5 py-1.5 border-b border-white/5 mb-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>COLOR PALETTES</span>
            <span>{allThemes.length} TOTAL</span>
          </div>

          <div className="space-y-0.5">
            {allThemes.map((th) => {
              const isSelected = currentTheme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => {
                    setTheme(th.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-white/10 text-white font-semibold'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm select-none">{th.emoji}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>{th.name}</span>
                        <span
                          className="w-1.5 h-1.5 rounded-full inline-block"
                          style={{ backgroundColor: th.accentHex }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500">{th.subtitle}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
