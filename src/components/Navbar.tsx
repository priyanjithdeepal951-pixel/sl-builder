import React, { useState } from 'react';
import { Sparkles, FolderKanban, LogOut, Code2, Menu, X, ArrowUpRight } from 'lucide-react';
import { UserProfile } from '../types/builder';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  currentPage: 'welcome' | 'auth' | 'projects' | 'editor';
  onNavigate: (page: 'welcome' | 'auth' | 'projects' | 'editor') => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  hasActiveProject: boolean;
  onOpenActiveEditor: () => void;
  isMeteorShower?: boolean;
  onToggleMeteorShower?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  onLogout,
  hasActiveProject,
  onOpenActiveEditor,
  isMeteorShower = false,
  onToggleMeteorShower,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const { themeConfig } = useTheme();

  if (currentPage === 'editor') {
    return null;
  }

  const handleNavClick = (page: 'welcome' | 'auth' | 'projects') => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-3 z-40 px-4 sm:px-6 transition-all duration-200">
      <div className="max-w-6xl mx-auto studio-glass rounded-2xl px-5 py-3 shadow-2xl flex items-center justify-between gap-6 border border-white/10">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={() => handleNavClick('welcome')}
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
            style={{
              backgroundColor: `${themeConfig.accentHex}20`,
              border: `1px solid ${themeConfig.accentHex}40`,
              color: themeConfig.accentHex,
            }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            SL Builder
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
          <button
            onClick={() => handleNavClick('welcome')}
            className={`transition-colors hover:text-white whitespace-nowrap ${
              currentPage === 'welcome' ? 'text-white font-semibold' : ''
            }`}
            style={{ color: currentPage === 'welcome' ? themeConfig.accentHex : undefined }}
          >
            Home
          </button>
          <a
            href="#features-section"
            onClick={(e) => {
              if (currentPage !== 'welcome') {
                e.preventDefault();
                handleNavClick('welcome');
                setTimeout(() => {
                  document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            Studio Architecture
          </a>
          <a
            href="#templates-section"
            onClick={(e) => {
              if (currentPage !== 'welcome') {
                e.preventDefault();
                handleNavClick('welcome');
                setTimeout(() => {
                  document.getElementById('templates-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            Blueprints
          </a>
          <button
            onClick={() => handleNavClick('projects')}
            className={`transition-colors hover:text-white whitespace-nowrap flex items-center gap-1.5 ${
              currentPage === 'projects' ? 'font-semibold' : ''
            }`}
            style={{ color: currentPage === 'projects' ? themeConfig.accentHex : undefined }}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Projects Hub</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Auth */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* SETTINGS / MENU BUTTON '≡' (Housing: උල්කාපාත, Theme Switcher, Resume Studio) */}
          <div className="relative">
            <button
              onClick={() => setSettingsDropdownOpen((prev) => !prev)}
              className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
                settingsDropdownOpen
                  ? 'bg-white/20 border-white/30 text-white shadow-lg'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
              }`}
              title="Settings & Workspace Preferences"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* SETTINGS POPUP MENU (Containing exact options from user photo) */}
            {settingsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0c101b] border border-white/10 p-3 shadow-2xl z-50 text-xs backdrop-blur-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-semibold">
                    SETTINGS & CONTROLS
                  </span>
                  <button
                    onClick={() => setSettingsDropdownOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* THE EXACT 3 BUTTONS CROPPED IN USER PHOTO: උල්කාපාත, Cosmic Indigo, Resume Studio */}
                <div className="p-3 rounded-2xl bg-[#080b13] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase font-semibold">
                    <span>Active Controls</span>
                    <span className="text-indigo-400 font-mono">Quick Access</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* 1. උල්කාපාත (Meteors) Button */}
                    <button
                      onClick={() => {
                        if (onToggleMeteorShower) onToggleMeteorShower();
                      }}
                      className={`rounded-full px-3.5 py-1.5 border text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
                        isMeteorShower
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-amber-500/20'
                          : 'bg-[#111625] hover:bg-[#182035] border-white/15 hover:border-white/30 text-slate-200 hover:text-white'
                      }`}
                      title="Toggle Live Meteor Shower (උල්කාපාත වර්ෂාව)"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                      <span>උල්කාපාත</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isMeteorShower ? 'bg-amber-400 animate-pulse ring-2 ring-amber-400/40' : 'bg-slate-500'
                        }`}
                      />
                    </button>

                    {/* 2. Theme Switcher (Cosmic Indigo ⌄) */}
                    <ThemeSwitcher pill />
                  </div>

                  {/* 3. Resume Studio Button */}
                  {hasActiveProject && (
                    <button
                      onClick={() => {
                        setSettingsDropdownOpen(false);
                        onOpenActiveEditor();
                      }}
                      className="w-full rounded-full px-4 py-2 bg-[#111625] hover:bg-[#182035] border border-white/15 hover:border-white/30 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Resume Studio</span>
                    </button>
                  )}
                </div>

                {/* Quick Navigation Links */}
                <div className="space-y-1 pt-1">
                  <button
                    onClick={() => {
                      setSettingsDropdownOpen(false);
                      onNavigate('projects');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-2"
                  >
                    <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Projects Mission Control</span>
                  </button>

                  <button
                    onClick={() => {
                      setSettingsDropdownOpen(false);
                      onOpenActiveEditor();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-2"
                  >
                    <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Launch Visual Studio</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white transition-all text-xs"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="font-medium hidden sm:inline text-xs">{currentUser.name}</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#0c101b] border border-white/10 p-1.5 shadow-2xl z-50 text-xs backdrop-blur-2xl">
                  <div className="px-3 py-2 border-b border-white/5 mb-1">
                    <p className="font-semibold text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigate('projects');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-2"
                  >
                    <FolderKanban className="w-3.5 h-3.5" style={{ color: themeConfig.accentHex }} />
                    <span>Projects</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-300 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavClick('auth')}
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors hidden sm:block whitespace-nowrap"
              >
                Log in
              </button>
              <button
                onClick={() => handleNavClick('auth')}
                className="px-4 py-2 rounded-xl text-white font-semibold text-xs shadow-lg transition-all flex items-center gap-1.5 whitespace-nowrap hover:opacity-90 active:scale-95"
                style={{
                  backgroundColor: themeConfig.accentHex,
                  boxShadow: `0 8px 24px -4px ${themeConfig.accentHex}40`,
                }}
              >
                <span>Launch Studio</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden max-w-6xl mx-auto mt-2 studio-glass rounded-2xl p-4 border border-white/10 space-y-2 text-xs font-medium">
          <button
            onClick={() => handleNavClick('welcome')}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-slate-200"
          >
            Home
          </button>
          <button
            onClick={() => handleNavClick('projects')}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-slate-200 flex items-center justify-between"
          >
            <span>Projects Hub</span>
            <FolderKanban className="w-4 h-4 text-indigo-400" />
          </button>
          {!currentUser ? (
            <button
              onClick={() => handleNavClick('auth')}
              className="w-full text-left px-3 py-2 rounded-lg bg-indigo-600/20 text-indigo-300 flex items-center justify-between"
            >
              <span>Log in / Sign up</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-rose-300 hover:bg-rose-500/10 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
