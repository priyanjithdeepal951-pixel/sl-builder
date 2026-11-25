import React, { useState, useRef, useEffect } from 'react';
import {
  FolderKanban,
  LogOut,
  Code2,
  Menu,
  X,
  ArrowUpRight,
  ShieldCheck,
  Sun,
  Moon,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { UserProfile, SiteSettingsConfig } from '../types/builder';
import { DEFAULT_SITE_SETTINGS } from '../data/siteSettingsDefaults';
import { ThemeSwitcher } from './ThemeSwitcher';
import { PWAInstallButton } from './PWAInstallButton';
import { useTheme } from '../context/ThemeContext';
import { STUDIO_IMAGES } from '../assets/studioAssets';

type AppPage = 'welcome' | 'auth' | 'projects' | 'editor' | 'admin';

interface NavbarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  hasActiveProject?: boolean;
  onOpenActiveEditor?: () => void;
  isMeteorShower?: boolean;
  onToggleMeteorShower?: () => void;
  isAdmin?: boolean;
  siteSettings?: SiteSettingsConfig;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  onLogout,
  hasActiveProject = false,
  onOpenActiveEditor,
  isMeteorShower = false,
  onToggleMeteorShower,
  isAdmin = false,
  siteSettings = DEFAULT_SITE_SETTINGS,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const { themeConfig, colorMode, toggleColorMode } = useTheme();
  const settingsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  if (currentPage === 'editor' || currentPage === 'admin' || currentPage === 'projects') {
    return null;
  }

  const handleNavClick = (page: AppPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/90 dark:border-zinc-800/80 bg-[#f5f5f2]/90 dark:bg-[#0b0c0f]/90 backdrop-blur-md">
      {siteSettings.announcementEnabled && siteSettings.announcementText && (
        <div
          className="px-4 py-1.5 text-xs font-medium text-center text-white"
          style={{ backgroundColor: themeConfig.accentHex }}
        >
          {siteSettings.announcementText}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('welcome')}
          className="font-display text-lg font-bold tracking-tight text-stone-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          {siteSettings.brandName || 'BlockCraft Studio'}
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600 dark:text-zinc-400">
          <button
            type="button"
            onClick={() => handleNavClick('welcome')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-900 dark:hover:text-white cursor-pointer ${
              currentPage === 'welcome' ? 'text-stone-900 dark:text-white font-semibold' : ''
            }`}
          >
            Showcase
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
            className="whitespace-nowrap shrink-0 hover:text-stone-900 dark:hover:text-white transition-colors"
          >
            Live Engine
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
            className="whitespace-nowrap shrink-0 hover:text-stone-900 dark:hover:text-white transition-colors"
          >
            Blueprints
          </a>
          <button
            type="button"
            onClick={() => handleNavClick('projects')}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-stone-900 dark:hover:text-white cursor-pointer"
          >
            Projects
          </button>
        </nav>

        {/* Zone 3: Primary Action + Compact Preferences */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={() => setSettingsDropdownOpen((prev) => !prev)}
              className="p-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Appearance & Studio Preferences"
              aria-label="Appearance & Studio Preferences"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {settingsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-[#12141a] border border-stone-200 dark:border-zinc-800 p-3.5 shadow-xl z-50 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-zinc-800">
                  <span className="font-semibold text-stone-900 dark:text-white">
                    Studio Preferences
                  </span>
                  <button
                    type="button"
                    onClick={() => setSettingsDropdownOpen(false)}
                    className="p-1 rounded text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Light / Dark Mode Switch */}
                <div className="flex items-center justify-between">
                  <span className="text-stone-600 dark:text-zinc-400 font-medium">Appearance</span>
                  <button
                    type="button"
                    onClick={toggleColorMode}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-100 dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 font-medium flex items-center gap-1.5 hover:bg-stone-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    {colorMode === 'light' ? (
                      <>
                        <Moon className="w-3.5 h-3.5" />
                        <span>Dark Mode</span>
                      </>
                    ) : (
                      <>
                        <Sun className="w-3.5 h-3.5" />
                        <span>Light Mode</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Accent Palette */}
                <div className="space-y-1.5">
                  <span className="block text-stone-600 dark:text-zinc-400 font-medium">
                    Accent Palette
                  </span>
                  <ThemeSwitcher pill />
                </div>

                {/* Live Meteor Streaks Toggle */}
                {onToggleMeteorShower && (
                  <button
                    type="button"
                    onClick={onToggleMeteorShower}
                    className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isMeteorShower
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-300'
                        : 'bg-stone-50 dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-stone-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Meteor Trails (උල්කාපාත)</span>
                    </span>
                    <span className="font-mono text-[11px]">{isMeteorShower ? 'On' : 'Off'}</span>
                  </button>
                )}

                {hasActiveProject && onOpenActiveEditor && (
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsDropdownOpen(false);
                      onOpenActiveEditor();
                    }}
                    className="w-full px-3 py-2 rounded-lg text-white font-semibold flex items-center justify-center gap-2 cursor-pointer"
                    style={{ backgroundColor: themeConfig.accentHex }}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Resume Studio</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsDropdownOpen(false);
                      onNavigate('admin');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Console</span>
                  </button>
                )}

                <div className="pt-1 border-t border-stone-100 dark:border-zinc-800">
                  <PWAInstallButton variant="menu-item" />
                </div>
              </div>
            )}
          </div>

          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700 text-stone-900 dark:text-white transition-colors text-xs cursor-pointer"
              >
                <img
                  src={currentUser.avatar || STUDIO_IMAGES.creatorAvatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="font-medium hidden sm:inline whitespace-nowrap">
                  {currentUser.name}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-[#12141a] border border-stone-200 dark:border-zinc-800 p-1.5 shadow-xl z-50 text-xs">
                  <div className="px-3 py-2 border-b border-stone-100 dark:border-zinc-800 mb-1">
                    <p className="font-semibold text-stone-900 dark:text-white truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigate('projects');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center gap-2 cursor-pointer"
                  >
                    <FolderKanban className="w-3.5 h-3.5" style={{ color: themeConfig.accentHex }} />
                    <span>Projects</span>
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('admin');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Admin Panel</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleNavClick('auth')}
              className="px-4 py-2 rounded-lg text-white font-semibold text-xs transition-opacity hover:opacity-90 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              style={{ backgroundColor: themeConfig.accentHex }}
            >
              <span>Open Studio</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-700 dark:text-zinc-300"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#12141a] px-6 py-4 space-y-2 text-sm font-medium">
          <button
            type="button"
            onClick={() => handleNavClick('welcome')}
            className="w-full text-left py-2 text-stone-800 dark:text-zinc-200"
          >
            Showcase
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('projects')}
            className="w-full text-left py-2 text-stone-800 dark:text-zinc-200"
          >
            Projects
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleNavClick('admin')}
              className="w-full text-left py-2 text-emerald-700 dark:text-emerald-400"
            >
              Admin Panel
            </button>
          )}
          {!currentUser ? (
            <button
              type="button"
              onClick={() => handleNavClick('auth')}
              className="w-full text-left py-2 font-semibold"
              style={{ color: themeConfig.accentHex }}
            >
              Log in / Sign up
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full text-left py-2 text-rose-600 dark:text-rose-400"
            >
              Log out
            </button>
          )}
        </div>
      )}
    </header>
  );
};
