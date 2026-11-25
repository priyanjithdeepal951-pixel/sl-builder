import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeId, ThemeConfig, THEMES } from '../types/theme';

export type ColorMode = 'light' | 'dark';

interface ThemeContextType {
  currentTheme: ThemeId;
  themeConfig: ThemeConfig;
  setTheme: (id: ThemeId) => void;
  allThemes: ThemeConfig[];
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('sl_builder_theme') as ThemeId;
    if (saved && THEMES[saved]) {
      return saved;
    }
    return 'cosmic';
  });

  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    const saved = localStorage.getItem('sl_builder_color_mode') as ColorMode;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return 'light';
  });

  const setTheme = (id: ThemeId) => {
    if (THEMES[id]) {
      setCurrentThemeState(id);
      localStorage.setItem('sl_builder_theme', id);
    }
  };

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode);
    localStorage.setItem('sl_builder_color_mode', mode);
  };

  const toggleColorMode = () => {
    setColorMode(colorMode === 'light' ? 'dark' : 'light');
  };

  const themeConfig = THEMES[currentTheme] || THEMES.cosmic;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', currentTheme);

    if (colorMode === 'dark') {
      root.classList.add('dark');
      document.body.style.backgroundColor = themeConfig.bgHex;
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#f5f5f2';
    }
  }, [currentTheme, themeConfig, colorMode]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeConfig,
        setTheme,
        allThemes: Object.values(THEMES),
        colorMode,
        setColorMode,
        toggleColorMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
