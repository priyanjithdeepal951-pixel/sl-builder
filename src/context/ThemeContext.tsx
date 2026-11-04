import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeId, ThemeConfig, THEMES } from '../types/theme';

interface ThemeContextType {
  currentTheme: ThemeId;
  themeConfig: ThemeConfig;
  setTheme: (id: ThemeId) => void;
  allThemes: ThemeConfig[];
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

  const setTheme = (id: ThemeId) => {
    if (THEMES[id]) {
      setCurrentThemeState(id);
      localStorage.setItem('sl_builder_theme', id);
    }
  };

  const themeConfig = THEMES[currentTheme] || THEMES.cosmic;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.body.style.backgroundColor = themeConfig.bgHex;
  }, [currentTheme, themeConfig]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeConfig,
        setTheme,
        allThemes: Object.values(THEMES),
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
