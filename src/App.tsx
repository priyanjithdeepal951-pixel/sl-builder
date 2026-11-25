import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, LogOut } from 'lucide-react';
import { Project, SiteSettingsConfig, UserProfile } from './types/builder';
import { DEFAULT_PROJECTS } from './data/defaultTemplates';
import { DEFAULT_SITE_SETTINGS } from './data/siteSettingsDefaults';
import { CosmicBackground } from './components/CosmicBackground';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { ProjectsHub } from './components/ProjectsHub';
import { ScratchStudio } from './components/studio/ScratchStudio';
import { AdminPanel } from './components/admin/AdminPanel';
import { ToastContainer, ToastMessage } from './components/Toast';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import {
  auth,
  testConnection,
  mapFirebaseUser,
  saveProjectToFirestore,
  deleteProjectFromFirestore,
  subscribeToUserProjects,
  checkIsAdminInFirestore,
  subscribeToSiteSettings,
  subscribeToUserSelf,
} from './lib/firebase';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';

type AppPage = 'welcome' | 'auth' | 'projects' | 'editor' | 'admin';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<AppPage>('welcome');
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('sl_builder_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_PROJECTS;
      }
    }
    return DEFAULT_PROJECTS;
  });

  const [currentProject, setCurrentProject] = useState<Project | null>(() => {
    return projects[0] || null;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSuspendedUser, setIsSuspendedUser] = useState<boolean>(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsConfig>(DEFAULT_SITE_SETTINGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isMeteorShower, setIsMeteorShower] = useState<boolean>(false);

  const { themeConfig, setTheme } = useTheme();

  const isCloudAuthenticated = Boolean(
    !isAuthChecking &&
      currentUser &&
      auth.currentUser &&
      currentUser.id === auth.currentUser.uid &&
      currentUser.id !== 'demo_user'
  );

  // Test Firestore Connection on Boot
  useEffect(() => {
    testConnection().catch((err) => console.warn('Firestore initial ping:', err));
  }, []);

  // Load Global CMS / Platform Settings (REST on boot, live onSnapshot when authenticated)
  useEffect(() => {
    const unsubscribe = subscribeToSiteSettings((settings) => {
      setSiteSettings(settings);
      if (!localStorage.getItem('sl_builder_theme') && settings.defaultTheme) {
        setTheme(settings.defaultTheme);
      }
    }, isCloudAuthenticated);
    return () => unsubscribe();
  }, [isCloudAuthenticated]);

  // Listen to Firebase Auth state & verify Admin RBAC
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsAuthChecking(false);
      if (firebaseUser) {
        const profile = mapFirebaseUser(firebaseUser);
        setCurrentUser(profile);
        const adminStatus = await checkIsAdminInFirestore(
          firebaseUser.uid,
          firebaseUser.email,
          firebaseUser.emailVerified
        );
        setIsAdmin(adminStatus);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setIsSuspendedUser(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to own user document in Firestore for role updates & suspension enforcement
  useEffect(() => {
    if (!isCloudAuthenticated || !currentUser) return;
    const unsubscribe = subscribeToUserSelf(currentUser.id, (cloudProfile) => {
      if (cloudProfile) {
        setIsSuspendedUser(Boolean(cloudProfile.isSuspended));
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                name: cloudProfile.name || prev.name,
                role: cloudProfile.role || prev.role,
                isSuspended: cloudProfile.isSuspended,
              }
            : prev
        );
      }
    });
    return () => unsubscribe();
  }, [isCloudAuthenticated, currentUser?.id]);

  // Listen to User Projects in Firestore in Real Time (only when Firebase Auth is ready & signed in)
  useEffect(() => {
    if (!isCloudAuthenticated || !currentUser) return;

    const unsubscribe = subscribeToUserProjects(
      currentUser.id,
      (cloudProjects) => {
        if (cloudProjects.length > 0) {
          setProjects(cloudProjects);
          if (!currentProject || !cloudProjects.some((p) => p.id === currentProject.id)) {
            setCurrentProject(cloudProjects[0]);
          }
        } else {
          console.log('Seeding initial projects to Firestore for user:', currentUser.id);
          DEFAULT_PROJECTS.forEach((p, idx) => {
            const seedProject: Project = {
              ...p,
              id: `proj_${Date.now()}_${idx}`,
              updatedAt: new Date().toISOString(),
            };
            saveProjectToFirestore(seedProject, currentUser.id).catch((err) =>
              console.warn('Initial project seed warning:', err)
            );
          });
        }
      },
      (err) => {
        console.warn('Firestore user projects subscription notice:', err.message);
      }
    );

    return () => unsubscribe();
  }, [isCloudAuthenticated, currentUser?.id]);

  // Toast dispatcher helper
  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substring(2, 5);
    const newToast: ToastMessage = { id, text, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleMeteorShower = () => {
    setIsMeteorShower((prev) => {
      const next = !prev;
      addToast(
        next
          ? 'Live Meteor Shower Active! Click or drag anywhere to summon meteors!'
          : 'Meteor intensity normalized',
        'success'
      );
      return next;
    });
  };

  // Auth handlers
  const handleLoginSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    if (auth.currentUser && auth.currentUser.uid === user.id) {
      const adminStatus = await checkIsAdminInFirestore(
        auth.currentUser.uid,
        auth.currentUser.email,
        auth.currentUser.emailVerified
      );
      setIsAdmin(adminStatus);
    } else {
      setIsAdmin(false);
    }
    setCurrentPage('projects');
  };

  const handleLogout = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setCurrentUser(null);
    setIsAdmin(false);
    setIsSuspendedUser(false);
    setCurrentPage('welcome');
    addToast('You have been logged out from Firebase.', 'info');
  };

  // Project handlers (with Firestore Cloud Persistence + Local Fallback for Demo Mode)
  const handleOpenProject = (project: Project) => {
    setCurrentProject(project);
    setCurrentPage('editor');
    addToast(`Opened "${project.name}" in Studio.`, 'success');
  };

  const handleCreateProject = (newProject: Project) => {
    if (!isAdmin && projects.length >= (siteSettings.maxProjectsPerUser || 50)) {
      addToast(
        `Project limit reached (${siteSettings.maxProjectsPerUser} max per user). Delete an old project or contact an admin.`,
        'error'
      );
      return;
    }

    const updated = [newProject, ...projects];
    setProjects(updated);
    setCurrentProject(newProject);
    setCurrentPage('editor');

    if (isCloudAuthenticated && currentUser) {
      saveProjectToFirestore(newProject, currentUser.id).catch((err) => {
        console.warn('Firestore save project notice:', err);
      });
      addToast(`Project "${newProject.name}" synced to Firebase Cloud!`, 'success');
    } else {
      localStorage.setItem('sl_builder_projects', JSON.stringify(updated));
    }
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === updatedProject.id ? updatedProject : p));
      if (!isCloudAuthenticated) {
        localStorage.setItem('sl_builder_projects', JSON.stringify(next));
      }
      return next;
    });
    if (currentProject && currentProject.id === updatedProject.id) {
      setCurrentProject(updatedProject);
    }

    if (isCloudAuthenticated && currentUser) {
      saveProjectToFirestore(updatedProject, currentUser.id).catch((err) => {
        console.warn('Firestore update project notice:', err);
      });
    }
  };

  const handleDuplicateProject = (id: string) => {
    if (!isAdmin && projects.length >= (siteSettings.maxProjectsPerUser || 50)) {
      addToast(
        `Project limit reached (${siteSettings.maxProjectsPerUser} max per user).`,
        'error'
      );
      return;
    }

    const target = projects.find((p) => p.id === id);
    if (!target) return;
    const duplicated: Project = {
      ...target,
      id: 'proj_' + Date.now(),
      name: `${target.name} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => {
      const next = [duplicated, ...prev];
      if (!isCloudAuthenticated) {
        localStorage.setItem('sl_builder_projects', JSON.stringify(next));
      }
      return next;
    });

    if (isCloudAuthenticated && currentUser) {
      saveProjectToFirestore(duplicated, currentUser.id).catch((err) => {
        console.warn('Firestore duplicate project notice:', err);
      });
      addToast('Duplicated project synced to Firebase Cloud!', 'success');
    }
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (!isCloudAuthenticated) {
        localStorage.setItem('sl_builder_projects', JSON.stringify(next));
      }
      return next;
    });
    if (currentProject && currentProject.id === id) {
      setCurrentProject(projects.find((p) => p.id !== id) || null);
    }

    if (isCloudAuthenticated) {
      deleteProjectFromFirestore(id).catch((err) => {
        console.warn('Firestore delete project notice:', err);
      });
      addToast('Project removed from Firebase Cloud.', 'info');
    }
  };

  const handleOpenTemplate = (templateName: string) => {
    const match = projects.find((p) => p.name === templateName);
    if (match) {
      handleOpenProject(match);
    } else {
      const templateProject: Project = {
        id: 'proj_tpl_' + Date.now(),
        name: templateName,
        category: 'Landing',
        updatedAt: new Date().toISOString(),
        status: 'Active',
        description: `Template cloned from ${templateName}`,
        blocks: currentProject?.blocks || DEFAULT_PROJECTS[0].blocks,
      };
      handleCreateProject(templateProject);
    }
  };

  // Security Gate 1: Suspended User Lockout (never locks out verified Admin)
  if (isSuspendedUser && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f5f5f2] dark:bg-[#0b0c0f] text-stone-900 dark:text-zinc-100 relative">
        <CosmicBackground meteorShowerMode={false} />
        <div className="relative z-10 max-w-md w-full rounded-2xl atelier-surface p-7 text-center shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="font-display text-xl font-bold text-stone-900 dark:text-white">
            Account Suspended
          </h1>
          <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed">
            Your workspace access has been temporarily suspended by an administrator. If you believe this is an error, please contact platform support.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </div>
    );
  }

  // Security Gate 2: Maintenance Mode Lockout (Admins & Auth/Admin login remain accessible)
  if (
    siteSettings.maintenanceMode &&
    !isAdmin &&
    currentPage !== 'auth' &&
    currentPage !== 'admin'
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f5f5f2] dark:bg-[#0b0c0f] text-stone-900 dark:text-zinc-100 relative">
        <CosmicBackground meteorShowerMode={false} />
        <div className="relative z-10 max-w-md w-full rounded-2xl atelier-surface p-7 text-center shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-xs font-mono text-amber-600 dark:text-amber-400">
            Scheduled Maintenance
          </div>
          <h1 className="font-display text-xl font-bold text-stone-900 dark:text-white">
            {siteSettings.brandName}
          </h1>
          <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed">
            {siteSettings.maintenanceMessage || DEFAULT_SITE_SETTINGS.maintenanceMessage}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => setCurrentPage('auth')}
              className="flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-semibold transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: themeConfig.accentHex }}
            >
              Admin Sign In
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('admin')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-zinc-900 hover:bg-stone-200 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-stone-800 dark:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Admin Console
            </button>
          </div>
        </div>
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f2] dark:bg-[#0b0c0f] text-stone-900 dark:text-zinc-100 relative overflow-x-hidden transition-colors duration-300">
      {/* Subtle Live Architectural Contour & Interactive Field */}
      <CosmicBackground meteorShowerMode={isMeteorShower} />

      {/* Global Top Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        currentUser={currentUser}
        onLogout={handleLogout}
        hasActiveProject={!!currentProject}
        onOpenActiveEditor={() => setCurrentPage('editor')}
        isMeteorShower={isMeteorShower}
        onToggleMeteorShower={handleToggleMeteorShower}
        isAdmin={isAdmin}
        siteSettings={siteSettings}
      />

      {/* Page Routing */}
      {currentPage === 'welcome' && (
        <LandingPage
          siteSettings={siteSettings}
          onGetStarted={() => {
            if (currentUser) {
              setCurrentPage('projects');
            } else {
              setCurrentPage('auth');
            }
          }}
          onOpenProjects={() => setCurrentPage('projects')}
          onOpenTemplate={handleOpenTemplate}
        />
      )}

      {currentPage === 'auth' && (
        <AuthPage
          onBackToHome={() => setCurrentPage('welcome')}
          onLoginSuccess={handleLoginSuccess}
          onToast={addToast}
          allowSignups={siteSettings.allowSignups}
          allowDemoLogin={siteSettings.allowDemoLogin}
        />
      )}

      {currentPage === 'projects' && (
        <ProjectsHub
          projects={projects}
          currentUser={currentUser}
          isAdmin={isAdmin}
          maxProjects={siteSettings.maxProjectsPerUser || 50}
          templates={siteSettings.templates}
          isMeteorShower={isMeteorShower}
          onToggleMeteorShower={handleToggleMeteorShower}
          onOpenProject={handleOpenProject}
          onCreateProject={handleCreateProject}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
          onOpenTemplate={handleOpenTemplate}
          onBackToHome={() => setCurrentPage('welcome')}
          onOpenAdmin={() => setCurrentPage('admin')}
          onNavigateAuth={() => setCurrentPage('auth')}
          onLogout={handleLogout}
          onToast={addToast}
        />
      )}

      {currentPage === 'editor' && currentProject && (
        <ScratchStudio
          project={currentProject}
          onUpdateProject={handleUpdateProject}
          onBackToProjects={() => setCurrentPage('projects')}
          onToast={addToast}
        />
      )}

      {currentPage === 'admin' && (
        <AdminPanel
          currentUser={currentUser}
          isAdmin={isAdmin}
          isCloudAuthenticated={isCloudAuthenticated}
          siteSettings={siteSettings}
          localProjects={projects}
          onUpdateLocalProject={handleUpdateProject}
          onDeleteLocalProject={handleDeleteProject}
          onOpenProjectInStudio={handleOpenProject}
          onBackToApp={() => setCurrentPage(currentUser ? 'projects' : 'welcome')}
          onNavigateAuth={() => setCurrentPage('auth')}
          onToast={addToast}
        />
      )}

      {/* Global Toast Notifications & PWA Offline Indicator */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
