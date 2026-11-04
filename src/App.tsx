import React, { useState, useEffect } from 'react';
import { Project, UserProfile } from './types/builder';
import { DEFAULT_PROJECTS } from './data/defaultTemplates';
import { CosmicBackground } from './components/CosmicBackground';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { ProjectsHub } from './components/ProjectsHub';
import { VisualStudio } from './components/editor/VisualStudio';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import {
  auth,
  testConnection,
  mapFirebaseUser,
  saveProjectToFirestore,
  deleteProjectFromFirestore,
  subscribeToUserProjects,
} from './lib/firebase';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<'welcome' | 'auth' | 'projects' | 'editor'>('welcome');
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('sl_builder_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
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
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isMeteorShower, setIsMeteorShower] = useState<boolean>(false);

  // Test Firestore Connection on Boot
  useEffect(() => {
    testConnection().catch((err) => console.warn('Firestore initial ping:', err));
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setIsAuthChecking(false);
      if (firebaseUser) {
        const profile = mapFirebaseUser(firebaseUser);
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to User Projects in Firestore in Real Time
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUserProjects(
      currentUser.id,
      (cloudProjects) => {
        if (cloudProjects.length > 0) {
          setProjects(cloudProjects);
          // If active project is not in cloud projects, choose the first
          if (!currentProject || !cloudProjects.some((p) => p.id === currentProject.id)) {
            setCurrentProject(cloudProjects[0]);
          }
        } else {
          // New user without projects: seed default templates into their Firestore account
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
  }, [currentUser?.id]);

  const handleToggleMeteorShower = () => {
    setIsMeteorShower((prev) => {
      const next = !prev;
      addToast(
        next
          ? '🌠 Live Meteor Shower (උල්කාපාත වර්ෂාව) Active! Click or drag anywhere to summon meteors!'
          : 'Meteor intensity normalized',
        'success'
      );
      return next;
    });
  };

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

  // Auth handlers
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentPage('projects');
  };

  const handleLogout = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setCurrentUser(null);
    setCurrentPage('welcome');
    addToast('You have been logged out from Firebase.', 'info');
  };

  // Project handlers (with Firestore Cloud Persistence)
  const handleOpenProject = (project: Project) => {
    setCurrentProject(project);
    setCurrentPage('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateProject = (newProject: Project) => {
    const updated = [newProject, ...projects];
    setProjects(updated);
    setCurrentProject(newProject);
    setCurrentPage('editor');

    if (currentUser) {
      saveProjectToFirestore(newProject, currentUser.id).catch((err) => {
        console.warn('Firestore save project notice:', err);
      });
      addToast(`Project "${newProject.name}" synced to Firebase Cloud!`, 'success');
    }
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
    if (currentProject && currentProject.id === updatedProject.id) {
      setCurrentProject(updatedProject);
    }

    if (currentUser) {
      saveProjectToFirestore(updatedProject, currentUser.id).catch((err) => {
        console.warn('Firestore update project notice:', err);
      });
    }
  };

  const handleDuplicateProject = (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    const duplicated: Project = {
      ...target,
      id: 'proj_' + Date.now(),
      name: `${target.name} (Copy)`,
      updatedAt: 'Just now',
    };
    setProjects((prev) => [duplicated, ...prev]);

    if (currentUser) {
      saveProjectToFirestore(duplicated, currentUser.id).catch((err) => {
        console.warn('Firestore duplicate project notice:', err);
      });
      addToast(`Duplicated project synced to Firebase Cloud!`, 'success');
    }
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (currentProject && currentProject.id === id) {
      setCurrentProject(projects.find((p) => p.id !== id) || null);
    }

    if (currentUser) {
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
        updatedAt: 'Just now',
        status: 'Active',
        description: `Template cloned from ${templateName}`,
        blocks: currentProject?.blocks || DEFAULT_PROJECTS[0].blocks,
      };
      handleCreateProject(templateProject);
    }
  };

  const { themeConfig } = useTheme();

  return (
    <div
      className="min-h-screen flex flex-col text-[#f3f4f6] relative overflow-x-hidden transition-colors duration-300"
      style={{
        backgroundColor: themeConfig.bgHex,
      }}
    >
      {/* Dynamic Star & Live Meteor (උල්කාපාත) particles canvas */}
      <CosmicBackground meteorShowerMode={isMeteorShower} />

      {/* Global Top Navbar (visible on Landing, Auth, Projects) */}
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        currentUser={currentUser}
        onLogout={handleLogout}
        hasActiveProject={!!currentProject}
        onOpenActiveEditor={() => setCurrentPage('editor')}
        isMeteorShower={isMeteorShower}
        onToggleMeteorShower={handleToggleMeteorShower}
      />

      {/* Page Routing */}
      {currentPage === 'welcome' && (
        <LandingPage
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
        />
      )}

      {currentPage === 'projects' && (
        <ProjectsHub
          projects={projects}
          onOpenProject={handleOpenProject}
          onCreateProject={handleCreateProject}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
          onToast={addToast}
        />
      )}

      {currentPage === 'editor' && currentProject && (
        <VisualStudio
          project={currentProject}
          onUpdateProject={handleUpdateProject}
          onBackToProjects={() => setCurrentPage('projects')}
          onToast={addToast}
          isMeteorShower={isMeteorShower}
          onToggleMeteorShower={handleToggleMeteorShower}
        />
      )}

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
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
