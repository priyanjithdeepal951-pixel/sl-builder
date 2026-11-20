import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  Globe,
  FolderKanban,
  Users,
  Lock,
  Unlock,
  Search,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  AlertTriangle,
  Check,
  X,
  ArrowLeft,
  UserCheck,
  UserX,
  KeyRound,
  FileJson,
  RefreshCw,
  Download,
  Upload,
  Copy,
  Activity,
  Server,
} from 'lucide-react';
import {
  AdminRecord,
  AuditLogEntry,
  Project,
  SitePage,
  SiteSettingsConfig,
  SiteTemplateItem,
  UserProfile,
} from '../../types/builder';
import { ThemeId, THEMES } from '../../types/theme';
import {
  DEFAULT_SITE_SETTINGS,
  SUPER_ADMIN_EMAIL,
} from '../../data/siteSettingsDefaults';
import {
  auth,
  testConnection,
  saveSiteSettings,
  subscribeToAllUsers,
  subscribeToAllProjects,
  subscribeToAdmins,
  subscribeToAuditLogs,
  adminUpdateUser,
  adminDeleteUser,
  adminSaveProject,
  deleteProjectFromFirestore,
  grantAdminRole,
  revokeAdminRole,
  logAdminAudit,
} from '../../lib/firebase';
import { generateHtmlExport } from '../../utils/webStudioCodeGen';

function triggerDownloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type AdminTab = 'overview' | 'cms' | 'projects' | 'users' | 'security';

interface AdminPanelProps {
  currentUser: UserProfile | null;
  isAdmin: boolean;
  isCloudAuthenticated: boolean;
  siteSettings: SiteSettingsConfig;
  localProjects: Project[];
  onUpdateLocalProject: (project: Project) => void;
  onDeleteLocalProject: (id: string) => void;
  onOpenProjectInStudio: (project: Project) => void;
  onBackToApp: () => void;
  onNavigateAuth: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const ACCENT_PRESETS = [
  { label: 'Indigo Violet', value: 'from-indigo-600/30 to-purple-600/10' },
  { label: 'Blue Cyan', value: 'from-blue-600/30 to-cyan-600/10' },
  { label: 'Purple Pink', value: 'from-purple-600/30 to-pink-600/10' },
  { label: 'Emerald Teal', value: 'from-emerald-600/30 to-teal-600/10' },
  { label: 'Amber Orange', value: 'from-amber-600/30 to-orange-600/10' },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  isAdmin,
  isCloudAuthenticated,
  siteSettings,
  localProjects,
  onUpdateLocalProject,
  onDeleteLocalProject,
  onOpenProjectInStudio,
  onBackToApp,
  onNavigateAuth,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isLocked, setIsLocked] = useState(false);
  const [sessionPin, setSessionPin] = useState<string>(() => {
    return sessionStorage.getItem('sl_admin_lock_pin') || '';
  });
  const [pinInput, setPinInput] = useState('');
  const [newPinDraft, setNewPinDraft] = useState('');

  // Live Firestore collections
  const [cloudUsers, setCloudUsers] = useState<UserProfile[]>([]);
  const [cloudProjects, setCloudProjects] = useState<Project[]>([]);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loadingCloud, setLoadingCloud] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [healthResult, setHealthResult] = useState<{
    ok: boolean;
    latencyMs: number;
    checkedAt: string;
  } | null>(null);

  // CMS Draft State
  const [draftSettings, setDraftSettings] = useState<SiteSettingsConfig>(siteSettings);
  const [hasUnsavedCms, setHasUnsavedCms] = useState(false);

  // Search & Filters
  const [projectSearch, setProjectSearch] = useState('');
  const [projectCategoryFilter, setProjectCategoryFilter] = useState<string>('all');
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('all');
  const [ownerFilterUid, setOwnerFilterUid] = useState<string>('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState('');

  // Modals / Edit Drawers
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectJsonMode, setProjectJsonMode] = useState(false);
  const [projectJsonText, setProjectJsonText] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [createProjectModal, setCreateProjectModal] = useState<{
    name: string;
    category: Project['category'];
    status: Project['status'];
    description: string;
  } | null>(null);

  // Confirmation modal (zero native alert/confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // New Admin Form
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'Admin' | 'Super Admin'>('Admin');

  useEffect(() => {
    if (!hasUnsavedCms) {
      setDraftSettings(siteSettings);
    }
  }, [siteSettings, hasUnsavedCms]);

  // Subscribe to Firestore Admin Streams only when verified admin is authenticated
  const emailVerified = Boolean(auth.currentUser?.emailVerified);
  const canAccessAdminCloud = Boolean(isCloudAuthenticated && isAdmin && emailVerified);

  useEffect(() => {
    if (!canAccessAdminCloud) {
      setLoadingCloud(false);
      return;
    }

    setLoadingCloud(true);
    setStreamError(null);
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribeToAllUsers(
        (users) => {
          setCloudUsers(users);
          setLoadingCloud(false);
        },
        (err) => {
          console.warn('Admin users stream notice:', err.message);
          setStreamError(`Users sync notice: ${err.message}`);
          setLoadingCloud(false);
        }
      )
    );

    unsubs.push(
      subscribeToAllProjects(
        (projects) => {
          setCloudProjects(projects);
        },
        (err) => {
          console.warn('Admin projects stream notice:', err.message);
          setStreamError(`Projects sync notice: ${err.message}`);
        }
      )
    );

    unsubs.push(
      subscribeToAdmins(
        (adminList) => {
          setAdmins(adminList);
        },
        (err) => {
          console.warn('Admins allowlist stream notice:', err.message);
          setStreamError(`Admin allowlist sync notice: ${err.message}`);
        }
      )
    );

    unsubs.push(
      subscribeToAuditLogs(
        (logs) => {
          setAuditLogs(logs);
        },
        (err) => {
          console.warn('Audit logs stream notice:', err.message);
          setStreamError(`Audit stream notice: ${err.message}`);
        }
      )
    );

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [canAccessAdminCloud]);

  // Merged project list (Cloud Firestore + any local-only projects)
  const mergedProjects = useMemo(() => {
    const map = new Map<string, Project>();
    localProjects.forEach((p) => map.set(p.id, p));
    cloudProjects.forEach((p) => map.set(p.id, p));
    return Array.from(map.values()).sort((a, b) =>
      (b.updatedAt || '').localeCompare(a.updatedAt || '')
    );
  }, [cloudProjects, localProjects]);

  const userByUid = useMemo(() => {
    const map = new Map<string, UserProfile>();
    cloudUsers.forEach((u) => map.set(u.id, u));
    return map;
  }, [cloudUsers]);

  const adminUidSet = useMemo(() => {
    const set = new Set<string>();
    admins.forEach((a) => set.add(a.uid));
    return set;
  }, [admins]);

  const projectCountByUid = useMemo(() => {
    const counts = new Map<string, number>();
    mergedProjects.forEach((p) => {
      if (p.userId) {
        counts.set(p.userId, (counts.get(p.userId) || 0) + 1);
      }
    });
    return counts;
  }, [mergedProjects]);

  const filteredProjects = useMemo(() => {
    return mergedProjects.filter((p) => {
      const q = projectSearch.toLowerCase().trim();
      const owner = p.userId ? userByUid.get(p.userId) : undefined;
      const matchOwnerFilter = !ownerFilterUid || p.userId === ownerFilterUid;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.userId || '').toLowerCase().includes(q) ||
        (owner?.email || '').toLowerCase().includes(q) ||
        (owner?.name || '').toLowerCase().includes(q);
      const matchCat = projectCategoryFilter === 'all' || p.category === projectCategoryFilter;
      const matchStat = projectStatusFilter === 'all' || p.status === projectStatusFilter;
      return matchOwnerFilter && matchQuery && matchCat && matchStat;
    });
  }, [mergedProjects, projectSearch, projectCategoryFilter, projectStatusFilter, ownerFilterUid, userByUid]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    return cloudUsers.filter((u) => {
      const matchQ =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q);
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchStat =
        userStatusFilter === 'all' ||
        (userStatusFilter === 'suspended' ? Boolean(u.isSuspended) : !u.isSuspended);
      return matchQ && matchRole && matchStat;
    });
  }, [cloudUsers, userSearch, userRoleFilter, userStatusFilter]);

  const filteredLogs = useMemo(() => {
    const q = auditSearch.toLowerCase().trim();
    return auditLogs.filter(
      (l) =>
        !q ||
        l.action.toLowerCase().includes(q) ||
        l.actorEmail.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.targetType.toLowerCase().includes(q)
    );
  }, [auditLogs, auditSearch]);

  const recordAudit = async (
    action: string,
    targetType: AuditLogEntry['targetType'],
    targetId: string,
    details: string
  ) => {
    if (!auth.currentUser) return;
    try {
      await logAdminAudit({
        actorUid: auth.currentUser.uid,
        actorEmail: auth.currentUser.email || currentUser?.email || SUPER_ADMIN_EMAIL,
        action,
        targetType,
        targetId,
        details,
      });
    } catch (err) {
      console.warn('Audit log write notice:', err);
    }
  };

  // ==================== SECURITY GATE CHECKS ====================
  if (!isCloudAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-[#07090F] text-slate-100 flex items-center justify-center p-6 relative z-20">
        <div className="max-w-md w-full bg-[#0E121B] border border-white/10 rounded-2xl p-7 space-y-5 shadow-2xl">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-white">Administrator Sign-In Required</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              The SL Builder Admin Command Center is protected by Firebase Authentication and Firestore zero-trust RBAC rules. Sign in with a verified administrator Google account to continue.
            </p>
          </div>
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onNavigateAuth}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
            >
              Sign In as Admin
            </button>
            <button
              type="button"
              onClick={onBackToApp}
              className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin || !emailVerified) {
    return (
      <div className="min-h-screen bg-[#07090F] text-slate-100 flex items-center justify-center p-6 relative z-20">
        <div className="max-w-md w-full bg-[#0E121B] border border-rose-500/30 rounded-2xl p-7 space-y-5 shadow-2xl">
          <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-white">403 · Restricted Admin Area</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Signed in as <span className="text-slate-200 font-mono">{currentUser.email}</span>
              {!emailVerified
                ? ' (Email not verified — verified Firebase Auth token required).'
                : ' — this account does not hold verified administrator privileges in Firestore.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToApp}
            className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold cursor-pointer"
          >
            Return to Workspace
          </button>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#07090F] text-slate-100 flex items-center justify-center p-6 relative z-20">
        <div className="max-w-sm w-full bg-[#0E121B] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Console Session Locked</h2>
              <p className="text-[11px] text-slate-400 font-mono">{currentUser.email}</p>
            </div>
          </div>

          {sessionPin ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (pinInput === sessionPin) {
                  setIsLocked(false);
                  setPinInput('');
                  onToast('Admin session unlocked.', 'success');
                } else {
                  onToast('Incorrect security PIN.', 'error');
                }
              }}
              className="space-y-3"
            >
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter session PIN to unlock..."
                autoFocus
                className="w-full px-3 py-2 rounded-xl bg-[#07090F] border border-white/15 text-xs text-white outline-none focus:border-indigo-400"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" /> Unlock Console
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsLocked(false);
                onToast('Admin console resumed.', 'info');
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" /> Resume Admin Session
            </button>
          )}
        </div>
      </div>
    );
  }

  // ==================== HANDLERS ====================
  const updateCmsField = <K extends keyof SiteSettingsConfig>(
    key: K,
    val: SiteSettingsConfig[K]
  ) => {
    setDraftSettings((prev) => ({ ...prev, [key]: val }));
    setHasUnsavedCms(true);
  };

  const handleSaveSiteSettings = async (overrideSettings?: SiteSettingsConfig, label?: string) => {
    const payload = overrideSettings || draftSettings;
    setSavingSettings(true);
    try {
      await saveSiteSettings(payload, currentUser.email);
      setHasUnsavedCms(false);
      await recordAudit(
        label || 'Updated Site Settings',
        'settings',
        'siteSettings',
        `Saved ${label || 'CMS & security settings'} (maintenance=${payload.maintenanceMode}, signups=${payload.allowSignups})`
      );
      onToast('Site settings published live to Firestore!', 'success');
    } catch (err: any) {
      onToast(err?.message || 'Failed to save settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleQuickSecurity = async (
    key: 'maintenanceMode' | 'allowSignups' | 'allowDemoLogin' | 'announcementEnabled',
    label: string
  ) => {
    const nextSettings = {
      ...draftSettings,
      [key]: !draftSettings[key],
    };
    setDraftSettings(nextSettings);
    await handleSaveSiteSettings(nextSettings, `Toggle ${label}`);
  };

  const handleAddTemplate = () => {
    const newTpl: SiteTemplateItem = {
      id: `tpl_${Date.now()}`,
      name: 'New Studio Blueprint',
      category: 'SaaS',
      description: 'Pre-configured responsive layout with interactive components.',
      tag: 'Featured',
      blocksCount: 6,
      accent: ACCENT_PRESETS[0].value,
    };
    updateCmsField('templates', [...draftSettings.templates, newTpl]);
  };

  const handleUpdateTemplate = (idx: number, patch: Partial<SiteTemplateItem>) => {
    const next = draftSettings.templates.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    updateCmsField('templates', next);
  };

  const handleRemoveTemplate = (idx: number) => {
    updateCmsField(
      'templates',
      draftSettings.templates.filter((_, i) => i !== idx)
    );
  };

  const handleQuickProjectStatus = async (proj: Project, status: Project['status']) => {
    const updated: Project = { ...proj, status, updatedAt: new Date().toISOString() };
    try {
      await adminSaveProject(updated);
      onUpdateLocalProject(updated);
      await recordAudit(
        'Project Status Changed',
        'project',
        proj.id,
        `Changed "${proj.name}" status to ${status}`
      );
      onToast(`"${proj.name}" set to ${status}`, 'success');
    } catch (err: any) {
      onToast(err?.message || 'Failed to update project status.', 'error');
    }
  };

  const handleSaveEditedProject = async () => {
    if (!editingProject) return;
    try {
      let finalProject = editingProject;
      if (projectJsonMode) {
        const parsed = JSON.parse(projectJsonText);
        if (!Array.isArray(parsed.blocks)) {
          onToast('JSON must contain a valid "blocks" array.', 'error');
          return;
        }
        finalProject = {
          ...editingProject,
          blocks: parsed.blocks,
          pages: Array.isArray(parsed.pages) ? parsed.pages : editingProject.pages,
        };
      }
      await adminSaveProject(finalProject);
      onUpdateLocalProject(finalProject);
      await recordAudit(
        'Edited Project',
        'project',
        finalProject.id,
        `Updated project "${finalProject.name}" (${finalProject.category} · ${finalProject.status})`
      );
      setEditingProject(null);
      setProjectJsonMode(false);
      onToast(`Project "${finalProject.name}" saved to Cloud!`, 'success');
    } catch (err: any) {
      onToast(err?.message || 'Invalid JSON or save error.', 'error');
    }
  };

  const handleDeleteProjectConfirm = (proj: Project) => {
    setConfirmDialog({
      title: `Delete "${proj.name}"?`,
      message:
        'This permanently deletes the project document from Firestore and cannot be undone.',
      confirmLabel: 'Delete Project',
      onConfirm: async () => {
        try {
          await deleteProjectFromFirestore(proj.id);
          onDeleteLocalProject(proj.id);
          await recordAudit('Deleted Project', 'project', proj.id, `Removed "${proj.name}"`);
          onToast(`Deleted "${proj.name}".`, 'info');
        } catch (err: any) {
          onToast(err?.message || 'Delete failed.', 'error');
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    const isRoot = editingUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    try {
      await adminUpdateUser(editingUser.id, {
        name: editingUser.name,
        role: isRoot ? 'Admin' : editingUser.role,
        isSuspended: isRoot ? false : Boolean(editingUser.isSuspended),
      });
      if (editingUser.role === 'Admin') {
        await grantAdminRole({
          uid: editingUser.id,
          email: editingUser.email,
          name: editingUser.name,
          role: 'Admin',
          grantedBy: currentUser.email,
          grantedAt: new Date().toISOString(),
        });
      } else if (!isRoot && adminUidSet.has(editingUser.id)) {
        await revokeAdminRole(editingUser.id);
      }
      await recordAudit(
        'Updated User Account',
        'user',
        editingUser.id,
        `Updated ${editingUser.email} -> role=${editingUser.role}, suspended=${Boolean(
          editingUser.isSuspended
        )}`
      );
      setEditingUser(null);
      onToast(`Updated user "${editingUser.name}"!`, 'success');
    } catch (err: any) {
      onToast(err?.message || 'Failed to update user.', 'error');
    }
  };

  const handleQuickToggleAdmin = async (user: UserProfile) => {
    const isRoot = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    if (isRoot) {
      onToast('Root Super Admin privileges cannot be modified.', 'error');
      return;
    }
    const currentlyAdmin = adminUidSet.has(user.id) || user.role === 'Admin';
    if (currentlyAdmin) {
      setConfirmDialog({
        title: `Revoke Admin Role for ${user.name}?`,
        message: `${user.email} will be reverted to Creator and removed from the Firestore admin allowlist.`,
        confirmLabel: 'Revoke Admin',
        onConfirm: async () => {
          try {
            await adminUpdateUser(user.id, { role: 'Creator' });
            if (adminUidSet.has(user.id)) {
              await revokeAdminRole(user.id);
            }
            await recordAudit(
              'Revoked User Admin Role',
              'admin',
              user.id,
              `Demoted ${user.email} to Creator`
            );
            onToast(`Revoked admin role from ${user.email}.`, 'info');
          } catch (err: any) {
            onToast(err?.message || 'Failed to revoke admin role.', 'error');
          } finally {
            setConfirmDialog(null);
          }
        },
      });
    } else {
      try {
        await adminUpdateUser(user.id, { role: 'Admin' });
        await grantAdminRole({
          uid: user.id,
          email: user.email,
          name: user.name,
          role: 'Admin',
          grantedBy: currentUser.email,
          grantedAt: new Date().toISOString(),
        });
        await recordAudit(
          'Promoted User to Admin',
          'admin',
          user.id,
          `Granted Admin allowlist & role to ${user.email}`
        );
        onToast(`Promoted ${user.name} to Admin!`, 'success');
      } catch (err: any) {
        onToast(err?.message || 'Failed to promote user.', 'error');
      }
    }
  };

  const handleCloneProject = async (proj: Project) => {
    const now = new Date().toISOString();
    const clonedId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const cloned: Project = {
      ...proj,
      id: clonedId,
      name: `${proj.name} (Copy)`.slice(0, 100),
      status: 'Draft',
      userId: currentUser.id,
      collaborators: [],
      collaboratorUids: [],
      updatedAt: now,
    };
    try {
      await adminSaveProject(cloned);
      onUpdateLocalProject(cloned);
      await recordAudit(
        'Cloned Project',
        'project',
        clonedId,
        `Cloned "${proj.name}" (${proj.id}) as "${cloned.name}"`
      );
      onToast(`Cloned "${proj.name}" as Draft.`, 'success');
    } catch (err: any) {
      onToast(err?.message || 'Clone failed.', 'error');
    }
  };

  const handleExportProjectHtml = (proj: Project) => {
    const html = generateHtmlExport(
      proj.name,
      proj.blocks || [],
      proj.pages,
      proj.pages?.[0]?.pageStyle
    );
    const safeSlug = proj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
    triggerDownloadFile(`${safeSlug}.html`, html, 'text/html;charset=utf-8');
    onToast(`Exported "${proj.name}" HTML bundle.`, 'success');
  };

  const handleCreateAdminProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createProjectModal || !createProjectModal.name.trim()) {
      onToast('Enter a project name.', 'error');
      return;
    }
    const now = new Date().toISOString();
    const newId = `proj_${Date.now()}`;
    const starterPage: SitePage = {
      id: 'page-home',
      name: 'Home',
      slug: '/index',
      blocks: [
        {
          id: `blk_${Date.now()}`,
          type: 'ui-heading',
          name: 'Hero Heading',
          content: createProjectModal.name.trim(),
          subtitle: createProjectModal.description.trim() || 'Created from SL Builder Admin Console',
          category: 'ui',
          style: {
            fontSize: '3xl',
            fontWeight: 'extrabold',
            textAlign: 'center',
          },
        },
      ],
    };
    const newProj: Project = {
      id: newId,
      name: createProjectModal.name.trim().slice(0, 100),
      category: createProjectModal.category,
      status: createProjectModal.status,
      description: createProjectModal.description.trim(),
      userId: currentUser.id,
      pages: [starterPage],
      blocks: starterPage.blocks,
      updatedAt: now,
    };
    try {
      await adminSaveProject(newProj);
      onUpdateLocalProject(newProj);
      await recordAudit(
        'Created Project',
        'project',
        newId,
        `Admin provisioned "${newProj.name}" (${newProj.category} · ${newProj.status})`
      );
      setCreateProjectModal(null);
      onToast(`Created project "${newProj.name}".`, 'success');
    } catch (err: any) {
      onToast(err?.message || 'Failed to create project.', 'error');
    }
  };

  const handleRunHealthCheck = async () => {
    setCheckingHealth(true);
    const started = performance.now();
    const ok = await testConnection();
    const latencyMs = Math.max(1, Math.round(performance.now() - started));
    setHealthResult({
      ok,
      latencyMs,
      checkedAt: new Date().toLocaleTimeString(),
    });
    setCheckingHealth(false);
    onToast(
      ok ? `Firestore Cloud responded in ${latencyMs} ms.` : 'Firestore Cloud unreachable or offline.',
      ok ? 'success' : 'error'
    );
  };

  const handleExportCmsJson = () => {
    triggerDownloadFile(
      `sl-builder-cms-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(draftSettings, null, 2),
      'application/json'
    );
    onToast('Exported CMS settings JSON.', 'success');
  };

  const handleImportCmsJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}')) as Partial<SiteSettingsConfig>;
        if (!parsed || typeof parsed !== 'object' || typeof parsed.brandName !== 'string') {
          onToast('Invalid CMS configuration JSON.', 'error');
          return;
        }
        setDraftSettings({
          ...DEFAULT_SITE_SETTINGS,
          ...parsed,
          templates: Array.isArray(parsed.templates) ? parsed.templates : draftSettings.templates,
        });
        setHasUnsavedCms(true);
        onToast('Imported CMS JSON into draft. Click Save & Publish to apply live.', 'info');
      } catch {
        onToast('Could not parse JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPlatformSnapshot = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser.email,
      siteSettings: draftSettings,
      counts: {
        users: cloudUsers.length,
        projects: mergedProjects.length,
        admins: admins.length + 1,
        auditLogs: auditLogs.length,
      },
      users: cloudUsers,
      projects: mergedProjects,
      admins,
      auditLogs,
    };
    triggerDownloadFile(
      `sl-builder-snapshot-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(snapshot, null, 2),
      'application/json'
    );
    recordAudit('Exported Platform Snapshot', 'settings', 'snapshot', `Exported ${mergedProjects.length} projects & ${cloudUsers.length} users`);
    onToast('Downloaded full platform JSON backup.', 'success');
  };

  const handleExportAuditCsv = () => {
    const escapeCsv = (val: string) => `"${String(val || '').replace(/"/g, '""')}"`;
    const rows = [
      ['Timestamp', 'ActorEmail', 'Action', 'TargetType', 'TargetId', 'Details'].join(','),
      ...filteredLogs.map((l) =>
        [
          escapeCsv(l.createdAt),
          escapeCsv(l.actorEmail),
          escapeCsv(l.action),
          escapeCsv(l.targetType),
          escapeCsv(l.targetId),
          escapeCsv(l.details),
        ].join(',')
      ),
    ];
    triggerDownloadFile(
      `sl-builder-audit-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.join('\n'),
      'text/csv;charset=utf-8'
    );
    onToast(`Exported ${filteredLogs.length} audit events to CSV.`, 'success');
  };

  const handleToggleUserSuspend = async (user: UserProfile) => {
    if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      onToast('Root Super Admin cannot be suspended.', 'error');
      return;
    }
    const nextSuspended = !user.isSuspended;
    try {
      await adminUpdateUser(user.id, { isSuspended: nextSuspended });
      await recordAudit(
        nextSuspended ? 'Suspended User' : 'Reactivated User',
        'user',
        user.id,
        `${nextSuspended ? 'Suspended' : 'Reactivated'} ${user.email}`
      );
      onToast(
        nextSuspended ? `Suspended ${user.email}` : `Reactivated ${user.email}`,
        nextSuspended ? 'info' : 'success'
      );
    } catch (err: any) {
      onToast(err?.message || 'Action failed.', 'error');
    }
  };

  const handleGrantAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUid.trim() || !newAdminEmail.trim() || !newAdminName.trim()) {
      onToast('Enter UID, email, and display name.', 'error');
      return;
    }
    try {
      await grantAdminRole({
        uid: newAdminUid.trim(),
        email: newAdminEmail.trim(),
        name: newAdminName.trim(),
        role: newAdminRole,
        grantedBy: currentUser.email,
        grantedAt: new Date().toISOString(),
      });
      await recordAudit(
        'Granted Admin Role',
        'admin',
        newAdminUid.trim(),
        `Granted ${newAdminRole} to ${newAdminEmail.trim()}`
      );
      setNewAdminUid('');
      setNewAdminEmail('');
      setNewAdminName('');
      onToast(`Admin privileges granted to ${newAdminEmail.trim()}`, 'success');
    } catch (err: any) {
      onToast(err?.message || 'Failed to grant admin role.', 'error');
    }
  };

  const handleRevokeAdmin = (rec: AdminRecord) => {
    if (rec.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      onToast('Bootstrapped Super Admin cannot be revoked.', 'error');
      return;
    }
    setConfirmDialog({
      title: `Revoke Admin Access for ${rec.name}?`,
      message: `${rec.email} will immediately lose Firestore admin read/write permissions.`,
      confirmLabel: 'Revoke Access',
      onConfirm: async () => {
        try {
          await revokeAdminRole(rec.uid);
          await recordAudit('Revoked Admin Role', 'admin', rec.uid, `Revoked ${rec.email}`);
          onToast(`Revoked admin role from ${rec.email}`, 'info');
        } catch (err: any) {
          onToast(err?.message || 'Revoke failed.', 'error');
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'cms', label: 'Site & CMS', icon: <Globe className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'users', label: 'Users & Roles', icon: <Users className="w-4 h-4" /> },
    { id: 'security', label: 'Security & Audit', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  const activeTabLabel = navItems.find((n) => n.id === activeTab)?.label || 'Overview';

  return (
    <div className="min-h-screen bg-[#07090F] text-slate-100 flex flex-col lg:flex-row relative z-20">
      {/* LEFT SIDEBAR */}
      <aside className="w-full lg:w-64 bg-[#0B0F17] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col shrink-0">
        <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Admin Console</div>
              <div className="text-[11px] text-slate-400 truncate font-mono">SL Builder</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsLocked(true)}
            title="Lock Admin Session"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 cursor-pointer shrink-0"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>

        <nav className="p-2.5 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible flex-1">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden lg:block p-3 border-t border-white/10 space-y-2.5">
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div className="font-semibold text-slate-200 truncate">{currentUser.name}</div>
            <div className="font-mono text-[10px] truncate">{currentUser.email}</div>
            <div className="text-emerald-400 font-mono text-[10px] flex items-center gap-1 pt-0.5">
              <Check className="w-3 h-3" /> Verified RBAC Active
            </div>
          </div>
          <button
            type="button"
            onClick={onBackToApp}
            className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Exit to App
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER BAR */}
        <header className="h-14 px-6 border-b border-white/10 bg-[#0B0F17]/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
            <span className="font-medium text-slate-300 truncate">SL Builder</span>
            <span aria-hidden="true">/</span>
            <span className="text-white font-semibold truncate">{activeTabLabel}</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {hasUnsavedCms && (
              <button
                type="button"
                onClick={() => handleSaveSiteSettings()}
                disabled={savingSettings}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSettings ? 'Publishing...' : 'Publish Changes'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onBackToApp}
              className="lg:hidden px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Exit Admin
            </button>
          </div>
        </header>

        {/* CONTENT VIEWPORT */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {streamError && (
              <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{streamError}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setStreamError(null)}
                  className="text-amber-300 hover:text-white cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ==================== TAB 1: OVERVIEW ==================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">Platform Overview</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Live Firestore workspace metrics, security switches, and recent administrative activity.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {healthResult && (
                      <div className="px-3 py-1.5 rounded-lg bg-[#0E131D] border border-white/10 text-[11px] font-mono tabular-nums text-slate-300 flex items-center gap-2">
                        <span className={healthResult.ok ? 'text-emerald-400' : 'text-rose-400'}>
                          {healthResult.ok ? 'ONLINE' : 'OFFLINE'}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span>{healthResult.latencyMs} ms</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleRunHealthCheck}
                      disabled={checkingHealth}
                      className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Activity className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{checkingHealth ? 'Probing Cloud...' : 'Check Cloud Health'}</span>
                    </button>
                  </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#0E131D] border border-white/10 rounded-xl p-4">
                    <div className="text-xs text-slate-400">Registered Users</div>
                    <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
                      {loadingCloud ? '—' : cloudUsers.length}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
                      {cloudUsers.filter((u) => u.isSuspended).length} suspended
                    </div>
                  </div>
                  <div className="bg-[#0E131D] border border-white/10 rounded-xl p-4">
                    <div className="text-xs text-slate-400">Total Projects</div>
                    <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
                      {mergedProjects.length}
                    </div>
                    <div className="text-[11px] text-emerald-400 mt-1 tabular-nums">
                      {mergedProjects.filter((p) => p.status === 'Published').length} published
                    </div>
                  </div>
                  <div className="bg-[#0E131D] border border-white/10 rounded-xl p-4">
                    <div className="text-xs text-slate-400">Verified Admins</div>
                    <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
                      {admins.length + 1}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      1 root · {admins.length} delegated
                    </div>
                  </div>
                  <div className="bg-[#0E131D] border border-white/10 rounded-xl p-4">
                    <div className="text-xs text-slate-400">Audit Events</div>
                    <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
                      {auditLogs.length}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Immutable security log</div>
                  </div>
                </div>

                {/* Instant Security Toggles */}
                <div className="bg-[#0E131D] border border-white/10 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <h2 className="text-sm font-bold text-white">Live Security &amp; Access Controls</h2>
                      <p className="text-xs text-slate-400">
                        Changes apply immediately across the entire SL Builder application.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleQuickSecurity('maintenanceMode', 'Maintenance Mode')}
                      className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        draftSettings.maintenanceMode
                          ? 'bg-rose-500/15 border-rose-500/40 text-white'
                          : 'bg-[#090C13] border-white/10 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>Maintenance Mode</span>
                        <span
                          className={`font-mono text-[11px] ${
                            draftSettings.maintenanceMode ? 'text-rose-400' : 'text-slate-500'
                          }`}
                        >
                          {draftSettings.maintenanceMode ? 'ACTIVE' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Locks non-admin visitors out during maintenance.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleQuickSecurity('allowSignups', 'Allow Signups')}
                      className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        draftSettings.allowSignups
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                          : 'bg-amber-500/15 border-amber-500/35 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>Public Signups</span>
                        <span
                          className={`font-mono text-[11px] ${
                            draftSettings.allowSignups ? 'text-emerald-400' : 'text-amber-300'
                          }`}
                        >
                          {draftSettings.allowSignups ? 'OPEN' : 'PAUSED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Allow or pause new user account creation.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleQuickSecurity('allowDemoLogin', 'Demo Sandbox')}
                      className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        draftSettings.allowDemoLogin
                          ? 'bg-[#090C13] border-white/10 text-slate-200'
                          : 'bg-amber-500/10 border-amber-500/30 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>Demo Sandbox Login</span>
                        <span
                          className={`font-mono text-[11px] ${
                            draftSettings.allowDemoLogin ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {draftSettings.allowDemoLogin ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Toggle offline guest sandbox access on Login page.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleQuickSecurity('announcementEnabled', 'Announcement Banner')
                      }
                      className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        draftSettings.announcementEnabled
                          ? 'bg-indigo-500/15 border-indigo-400/40 text-white'
                          : 'bg-[#090C13] border-white/10 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>Site Announcement</span>
                        <span
                          className={`font-mono text-[11px] ${
                            draftSettings.announcementEnabled ? 'text-indigo-300' : 'text-slate-500'
                          }`}
                        >
                          {draftSettings.announcementEnabled ? 'LIVE' : 'HIDDEN'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Display a top banner message across public pages.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Category & Role Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0E131D] border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <h2 className="font-bold text-white">Projects by Category</h2>
                      <span className="text-slate-500 font-mono tabular-nums">{mergedProjects.length} total</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {(['Landing', 'Portfolio', 'E-Commerce', 'Web Apps'] as const).map((cat) => {
                        const count = mergedProjects.filter((p) => p.category === cat).length;
                        const pct = mergedProjects.length > 0 ? Math.round((count / mergedProjects.length) * 100) : 0;
                        return (
                          <div key={cat} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-300">{cat}</span>
                              <span className="font-mono tabular-nums text-slate-400">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-[#0E131D] border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <h2 className="font-bold text-white">Accounts by Role</h2>
                      <span className="text-slate-500 font-mono tabular-nums">{cloudUsers.length} synced</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {(['Creator', 'Pro Creator', 'Moderator', 'Admin'] as const).map((r) => {
                        const count = cloudUsers.filter((u) => u.role === r).length;
                        const pct = cloudUsers.length > 0 ? Math.round((count / cloudUsers.length) * 100) : 0;
                        return (
                          <div key={r} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-300">{r}</span>
                              <span className="font-mono tabular-nums text-slate-400">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Recent Audit Logs */}
                <div className="bg-[#0E131D] border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white">Recent Audit Activity</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('security')}
                      className="text-xs text-indigo-400 hover:underline cursor-pointer"
                    >
                      View Full Log
                    </button>
                  </div>
                  {auditLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No administrative changes recorded yet. Edit any setting or project to generate an immutable audit entry.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5 text-xs">
                      {auditLogs.slice(0, 6).map((log) => (
                        <div
                          key={log.id}
                          className="px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 hover:bg-white/[0.02]"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-white">{log.action}</span>
                            <span className="text-slate-500 mx-2">·</span>
                            <span className="text-slate-300">{log.details}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums shrink-0">
                            {log.actorEmail} · {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== TAB 2: SITE & CMS EDITOR ==================== */}
            {activeTab === 'cms' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">Site &amp; Content CMS</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Edit website branding, hero copy, CTAs, theme defaults, and featured blueprint templates.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" /> Import JSON
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleImportCmsJson}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleExportCmsJson}
                      className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Export JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftSettings(DEFAULT_SITE_SETTINGS);
                        setHasUnsavedCms(true);
                        onToast('Loaded default copy into draft. Click Publish to apply.', 'info');
                      }}
                      className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveSiteSettings()}
                      disabled={savingSettings}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingSettings ? 'Saving...' : 'Save & Publish Live'}</span>
                    </button>
                  </div>
                </div>

                {/* Branding & Theme */}
                <div className="bg-[#0E131D] border border-white/10 rounded-xl p-5 space-y-4 text-xs">
                  <h2 className="text-sm font-bold text-white border-b border-white/10 pb-2.5">
                    Brand Identity &amp; Banner
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold block">Brand Name</label>
                      <input
                        type="text"
                        value={draftSettings.brandName}
                        onChange={(e) => updateCmsField('brandName', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold block">Default Platform Theme</label>
                      <select
                        value={draftSettings.defaultTheme}
                        onChange={(e) => updateCmsField('defaultTheme', e.target.value as ThemeId)}
                        className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                      >
                        {Object.values(THEMES).map((th) => (
                          <option key={th.id} value={th.id}>
                            {th.name} — {th.subtitle}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-400 font-semibold">Announcement Banner Text</label>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={draftSettings.announcementEnabled}
                            onChange={(e) => updateCmsField('announcementEnabled', e.target.checked)}
                            className="accent-indigo-500"
                          />
                          <span>Show Banner</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={draftSettings.announcementText}
                        onChange={(e) => updateCmsField('announcementText', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                      />
                      {draftSettings.announcementEnabled && draftSettings.announcementText.trim() && (
                        <div className="mt-2 px-3 py-2 rounded-lg bg-indigo-600/20 border border-indigo-400/30 text-indigo-100 text-[11px] text-center">
                          Preview: {draftSettings.announcementText}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hero & Footer Copy */}
                <div className="bg-[#0E131D] border border-white/10 rounded-xl p-5 space-y-4 text-xs">
                  <h2 className="text-sm font-bold text-white border-b border-white/10 pb-2.5">
                    Landing Hero &amp; Footer Copy
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-slate-400 font-semibold block">Hero Kicker Line</label>
                      <input
                        type="text"
                        value={draftSettings.heroKicker}
                        onChange={(e) => updateCmsField('heroKicker', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold block">Hero Headline (Main)</label>
                      <input
                        type="text"
                        value={draftSettings.heroTitle}
                        onChange={(e) => updateCmsField('heroTitle', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold block">Highlighted Gradient Phrase</label>
                      <input
                        type="text"
                        value={draftSettings.heroHighlight}
                        onChange={(e) => updateCmsField('heroHighlight', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-indigo-300 outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-slate-400 font-semibold block">Hero Subtitle</label>
                      <textarea
                        rows={3}
                        value={draftSettings.heroSubtitle}
                        onChange={(e) => updateCmsField('heroSubtitle', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold block">Primary Button Label</label>
                      <input
                        type="text"
                        value={draftSettings.heroPrimaryCta}
                        onChange={(e) => updateCmsField('heroPrimaryCta', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold block">Secondary Button Label</label>
                      <input
                        type="text"
                        value={draftSettings.heroSecondaryCta}
                        onChange={(e) => updateCmsField('heroSecondaryCta', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold block">Footer Copyright Text</label>
                      <input
                        type="text"
                        value={draftSettings.footerCopyright}
                        onChange={(e) => updateCmsField('footerCopyright', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold block">Footer Subtitle</label>
                      <input
                        type="text"
                        value={draftSettings.footerLinksText}
                        onChange={(e) => updateCmsField('footerLinksText', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Featured Blueprint Templates */}
                <div className="bg-[#0E131D] border border-white/10 rounded-xl p-5 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div>
                      <h2 className="text-sm font-bold text-white">Featured Blueprints</h2>
                      <p className="text-[11px] text-slate-400">
                        Manage the template showcase cards displayed on the public landing page.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTemplate}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Template
                    </button>
                  </div>

                  <div className="space-y-3">
                    {draftSettings.templates.map((tpl, idx) => (
                      <div
                        key={tpl.id}
                        className="p-3.5 rounded-xl bg-[#07090F] border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-3 items-start"
                      >
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[10px] text-slate-500 block">Template Name</label>
                          <input
                            type="text"
                            value={tpl.name}
                            onChange={(e) => handleUpdateTemplate(idx, { name: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0E131D] border border-white/15 text-white outline-none"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] text-slate-500 block">Category</label>
                          <input
                            type="text"
                            value={tpl.category}
                            onChange={(e) => handleUpdateTemplate(idx, { category: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0E131D] border border-white/15 text-white outline-none"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] text-slate-500 block">Tag</label>
                          <input
                            type="text"
                            value={tpl.tag}
                            onChange={(e) => handleUpdateTemplate(idx, { tag: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0E131D] border border-white/15 text-white outline-none"
                          />
                        </div>
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[10px] text-slate-500 block">Color Gradient</label>
                          <select
                            value={tpl.accent}
                            onChange={(e) => handleUpdateTemplate(idx, { accent: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0E131D] border border-white/15 text-white outline-none"
                          >
                            {ACCENT_PRESETS.map((ap) => (
                              <option key={ap.value} value={ap.value}>
                                {ap.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-1 flex justify-end pt-5">
                          <button
                            type="button"
                            onClick={() => handleRemoveTemplate(idx)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 cursor-pointer"
                            title="Delete Template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="md:col-span-10 space-y-1">
                          <label className="text-[10px] text-slate-500 block">Description</label>
                          <input
                            type="text"
                            value={tpl.description}
                            onChange={(e) =>
                              handleUpdateTemplate(idx, { description: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0E131D] border border-white/15 text-slate-300 outline-none"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] text-slate-500 block">Blocks Count</label>
                          <input
                            type="number"
                            min={1}
                            max={200}
                            value={tpl.blocksCount}
                            onChange={(e) =>
                              handleUpdateTemplate(idx, {
                                blocksCount: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0E131D] border border-white/15 text-white font-mono tabular-nums outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB 3: PROJECTS MANAGER ==================== */}
            {activeTab === 'projects' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">All Projects &amp; Workspaces</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Inspect, create, clone, export HTML, edit JSON structures, or launch any project in Visual Studio.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCreateProjectModal({
                        name: '',
                        category: 'Landing',
                        status: 'Draft',
                        description: '',
                      })
                    }
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Project
                  </button>
                </div>

                {/* Filter Bar */}
                <div className="bg-[#0E131D] border border-white/10 rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="Search by project name, owner email, or UID..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#07090F] border border-white/10 text-white placeholder-slate-500 outline-none focus:border-indigo-400"
                    />
                  </div>
                  {ownerFilterUid && (
                    <button
                      type="button"
                      onClick={() => setOwnerFilterUid('')}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-400/30 text-indigo-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Owner: {userByUid.get(ownerFilterUid)?.email || ownerFilterUid.slice(0, 10)}</span>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <select
                    value={projectCategoryFilter}
                    onChange={(e) => setProjectCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[#07090F] border border-white/10 text-slate-200 outline-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="Landing">Landing</option>
                    <option value="Portfolio">Portfolio</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="Web Apps">Web Apps</option>
                  </select>
                  <select
                    value={projectStatusFilter}
                    onChange={(e) => setProjectStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[#07090F] border border-white/10 text-slate-200 outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

                {/* Projects Table */}
                <div className="bg-[#0E131D] border border-white/10 rounded-xl overflow-hidden">
                  {filteredProjects.length === 0 ? (
                    <div className="p-10 text-center text-xs text-slate-500">
                      No matching projects found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#090C13] text-slate-400 border-b border-white/10 font-medium">
                          <tr>
                            <th className="py-2.5 px-4">Project &amp; Owner</th>
                            <th className="py-2.5 px-4">Category</th>
                            <th className="py-2.5 px-4">Status</th>
                            <th className="py-2.5 px-4 text-right">Structure</th>
                            <th className="py-2.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredProjects.map((proj) => {
                            const owner = proj.userId ? userByUid.get(proj.userId) : undefined;
                            return (
                              <tr key={proj.id} className="hover:bg-white/[0.02]">
                                <td className="py-2.5 px-4 max-w-[280px]">
                                  <div className="font-semibold text-white truncate">{proj.name}</div>
                                  <div className="text-[11px] text-slate-500 font-mono truncate">
                                    {owner ? `${owner.email} · ` : proj.userId ? `${proj.userId.slice(0, 10)} · ` : ''}
                                    {proj.id}
                                  </div>
                                </td>
                                <td className="py-2.5 px-4 text-slate-300">{proj.category}</td>
                                <td className="py-2.5 px-4">
                                  <select
                                    value={proj.status}
                                    onChange={(e) =>
                                      handleQuickProjectStatus(
                                        proj,
                                        e.target.value as Project['status']
                                      )
                                    }
                                    className={`px-2 py-1 rounded-md bg-[#07090F] border border-white/15 font-mono text-[11px] outline-none cursor-pointer ${
                                      proj.status === 'Published'
                                        ? 'text-emerald-400'
                                        : proj.status === 'Active'
                                        ? 'text-indigo-300'
                                        : 'text-amber-300'
                                    }`}
                                  >
                                    <option value="Active">Active</option>
                                    <option value="Published">Published</option>
                                    <option value="Draft">Draft</option>
                                  </select>
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                                  {proj.blocks?.length || 0} blocks · {proj.pages?.length || 1} pages
                                </td>
                                <td className="py-2.5 px-4">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => onOpenProjectInStudio(proj)}
                                      title="Edit in Visual Studio"
                                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                    >
                                      <ExternalLink className="w-3 h-3" /> Studio
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCloneProject(proj)}
                                      title="Clone Project"
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleExportProjectHtml(proj)}
                                      title="Export Standalone HTML"
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-300 cursor-pointer"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingProject({ ...proj });
                                        setProjectJsonMode(false);
                                        setProjectJsonText(
                                          JSON.stringify(
                                            { blocks: proj.blocks, pages: proj.pages || [] },
                                            null,
                                            2
                                          )
                                        );
                                      }}
                                      title="Edit Metadata & JSON"
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteProjectConfirm(proj)}
                                      title="Delete Project"
                                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== TAB 4: USERS & RBAC ==================== */}
            {activeTab === 'users' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-bold text-white">Users &amp; Account Permissions</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Manage registered Firebase accounts, inspect owned projects, toggle Admin RBAC, or suspend access.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-slate-400">
                    <span>{cloudUsers.length} total</span>
                    <span>·</span>
                    <span className="text-emerald-400">{cloudUsers.filter((u) => !u.isSuspended).length} active</span>
                    <span>·</span>
                    <span className="text-rose-400">{cloudUsers.filter((u) => u.isSuspended).length} suspended</span>
                  </div>
                </div>

                <div className="bg-[#0E131D] border border-white/10 rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users by name, email, role, or UID..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#07090F] border border-white/10 text-white placeholder-slate-500 outline-none focus:border-indigo-400"
                    />
                  </div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[#07090F] border border-white/10 text-slate-200 outline-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="Creator">Creator</option>
                    <option value="Pro Creator">Pro Creator</option>
                    <option value="Moderator">Moderator</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[#07090F] border border-white/10 text-slate-200 outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="suspended">Suspended Only</option>
                  </select>
                </div>

                <div className="bg-[#0E131D] border border-white/10 rounded-xl overflow-hidden">
                  {filteredUsers.length === 0 ? (
                    <div className="p-10 text-center text-xs text-slate-500">
                      {loadingCloud
                        ? 'Loading users from Firestore...'
                        : 'No matching user accounts found.'}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#090C13] text-slate-400 border-b border-white/10 font-medium">
                          <tr>
                            <th className="py-2.5 px-4">User</th>
                            <th className="py-2.5 px-4">Projects</th>
                            <th className="py-2.5 px-4">Role</th>
                            <th className="py-2.5 px-4">Account Status</th>
                            <th className="py-2.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredUsers.map((u) => {
                            const isRoot = u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                            const isUserAdmin = isRoot || adminUidSet.has(u.id) || u.role === 'Admin';
                            const ownedCount = projectCountByUid.get(u.id) || 0;
                            return (
                              <tr key={u.id} className="hover:bg-white/[0.02]">
                                <td className="py-2.5 px-4">
                                  <div className="font-semibold text-white">{u.name}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    {u.email} · {u.id.slice(0, 12)}
                                  </div>
                                </td>
                                <td className="py-2.5 px-4">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOwnerFilterUid(u.id);
                                      setActiveTab('projects');
                                    }}
                                    className="font-mono tabular-nums text-indigo-300 hover:text-indigo-200 underline cursor-pointer"
                                  >
                                    {ownedCount} projects
                                  </button>
                                </td>
                                <td className="py-2.5 px-4 text-slate-200 font-medium">
                                  {isRoot ? 'Root Super Admin' : u.role}
                                </td>
                                <td className="py-2.5 px-4">
                                  <span
                                    className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                                      u.isSuspended ? 'text-rose-400' : 'text-emerald-400'
                                    }`}
                                  >
                                    {u.isSuspended ? (
                                      <>
                                        <UserX className="w-3.5 h-3.5" /> Suspended
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="w-3.5 h-3.5" /> Active
                                      </>
                                    )}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {!isRoot && (
                                      <button
                                        type="button"
                                        onClick={() => handleQuickToggleAdmin(u)}
                                        className={`px-2.5 py-1 rounded-lg border cursor-pointer whitespace-nowrap ${
                                          isUserAdmin
                                            ? 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300'
                                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                                        }`}
                                      >
                                        {isUserAdmin ? 'Revoke Admin' : 'Make Admin'}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setEditingUser({ ...u })}
                                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    {!isRoot && (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleUserSuspend(u)}
                                        className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                                          u.isSuspended
                                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                            : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                        }`}
                                      >
                                        {u.isSuspended ? 'Restore' : 'Suspend'}
                                      </button>
                                    )}
                                    {!isRoot && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setConfirmDialog({
                                            title: `Remove User Profile "${u.name}"?`,
                                            message: `Deletes the Firestore profile record for ${u.email}.`,
                                            confirmLabel: 'Remove Profile',
                                            onConfirm: async () => {
                                              try {
                                                await adminDeleteUser(u.id);
                                                await recordAudit(
                                                  'Deleted User Profile',
                                                  'user',
                                                  u.id,
                                                  `Removed ${u.email}`
                                                );
                                                onToast(`Removed profile for ${u.email}`, 'info');
                                              } catch (err: any) {
                                                onToast(err?.message || 'Delete failed.', 'error');
                                              } finally {
                                                setConfirmDialog(null);
                                              }
                                            },
                                          })
                                        }
                                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 cursor-pointer"
                                        title="Delete User Profile"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== TAB 5: SECURITY & AUDIT LOGS ==================== */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">Security Hardening &amp; Audit Logs</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure verified Admin allowlists, platform quotas, session PIN lock, and export audit backups.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportPlatformSnapshot}
                      className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Server className="w-3.5 h-3.5 text-indigo-400" /> Export Snapshot (JSON)
                    </button>
                    <button
                      type="button"
                      onClick={handleRunHealthCheck}
                      disabled={checkingHealth}
                      className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{checkingHealth ? 'Checking...' : 'Test Firestore'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Session Lock & Guardrails */}
                  <div className="bg-[#0E131D] border border-white/10 rounded-xl p-5 space-y-4 text-xs">
                    <h2 className="text-sm font-bold text-white border-b border-white/10 pb-2.5 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>Console PIN &amp; System Limits</span>
                    </h2>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold block">
                        Quick Console Lock PIN (Optional Session Shield)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          value={newPinDraft}
                          onChange={(e) => setNewPinDraft(e.target.value)}
                          placeholder={sessionPin ? 'PIN active (enter new to change)' : 'Set 4-6 digit PIN...'}
                          className="flex-1 px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newPinDraft.trim().length < 4) {
                              onToast('PIN must be at least 4 characters.', 'error');
                              return;
                            }
                            sessionStorage.setItem('sl_admin_lock_pin', newPinDraft.trim());
                            setSessionPin(newPinDraft.trim());
                            setNewPinDraft('');
                            onToast('Session Lock PIN saved.', 'success');
                          }}
                          className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
                        >
                          Set PIN
                        </button>
                        {sessionPin && (
                          <button
                            type="button"
                            onClick={() => {
                              sessionStorage.removeItem('sl_admin_lock_pin');
                              setSessionPin('');
                              onToast('Session Lock PIN cleared.', 'info');
                            }}
                            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold block">
                        Maintenance Screen Message
                      </label>
                      <textarea
                        rows={2}
                        value={draftSettings.maintenanceMessage}
                        onChange={(e) => updateCmsField('maintenanceMessage', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                      />
                    </div>

                    <div className="flex items-end gap-3">
                      <div className="flex-1 space-y-1.5">
                        <label className="text-slate-400 font-semibold block">
                          Max Projects Per User
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={draftSettings.maxProjectsPerUser}
                          onChange={(e) =>
                            updateCmsField(
                              'maxProjectsPerUser',
                              Math.max(1, Number(e.target.value) || 50)
                            )
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white font-mono tabular-nums outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveSiteSettings(draftSettings, 'Updated Security Limits')}
                        disabled={savingSettings}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                      >
                        Save Guardrails
                      </button>
                    </div>
                  </div>

                  {/* Admin Allowlist Manager */}
                  <div className="bg-[#0E131D] border border-white/10 rounded-xl p-5 space-y-4 text-xs">
                    <h2 className="text-sm font-bold text-white border-b border-white/10 pb-2.5 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Verified Administrators</span>
                    </h2>

                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {/* Bootstrapped Root Super Admin */}
                      <div className="p-2.5 rounded-lg bg-[#07090F] border border-emerald-500/25 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">Root Super Admin</div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            {SUPER_ADMIN_EMAIL}
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-400 shrink-0">
                          Protected
                        </span>
                      </div>

                      {admins.map((rec) => (
                        <div
                          key={rec.uid}
                          className="p-2.5 rounded-lg bg-[#07090F] border border-white/10 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate">
                              {rec.name} · {rec.role}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate">
                              {rec.email} · {rec.uid}
                            </div>
                          </div>
                          {rec.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase() && (
                            <button
                              type="button"
                              onClick={() => handleRevokeAdmin(rec)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 font-semibold cursor-pointer shrink-0"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleGrantAdminSubmit} className="space-y-2.5 pt-2 border-t border-white/10">
                      <div className="text-[11px] font-semibold text-slate-300">
                        Delegate Admin Access
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newAdminUid}
                          onChange={(e) => setNewAdminUid(e.target.value)}
                          placeholder="Firebase Auth UID"
                          className="px-2.5 py-1.5 rounded-lg bg-[#07090F] border border-white/15 text-white font-mono outline-none"
                        />
                        <input
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="Verified email address"
                          className="px-2.5 py-1.5 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none"
                        />
                        <input
                          type="text"
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                          placeholder="Full Name"
                          className="px-2.5 py-1.5 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none"
                        />
                        <select
                          value={newAdminRole}
                          onChange={(e) =>
                            setNewAdminRole(e.target.value as 'Admin' | 'Super Admin')
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Super Admin">Super Admin</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
                      >
                        Grant Admin Access
                      </button>
                    </form>
                  </div>
                </div>

                {/* Full Audit Log Table */}
                <div className="bg-[#0E131D] border border-white/10 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-bold text-white">Immutable Audit Log Stream</h2>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64 text-xs">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={auditSearch}
                          onChange={(e) => setAuditSearch(e.target.value)}
                          placeholder="Filter audit logs..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#07090F] border border-white/10 text-white outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleExportAuditCsv}
                        disabled={filteredLogs.length === 0}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" /> CSV
                      </button>
                    </div>
                  </div>
                  {filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No matching audit events.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#090C13] text-slate-400 border-b border-white/10">
                          <tr>
                            <th className="py-2.5 px-4">Timestamp</th>
                            <th className="py-2.5 px-4">Actor</th>
                            <th className="py-2.5 px-4">Action</th>
                            <th className="py-2.5 px-4">Scope</th>
                            <th className="py-2.5 px-4">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-white/[0.02]">
                              <td className="py-2.5 px-4 font-mono tabular-nums text-[11px] text-slate-400 whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-[11px] text-slate-300">
                                {log.actorEmail}
                              </td>
                              <td className="py-2.5 px-4 font-semibold text-white">
                                {log.action}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-indigo-300">
                                {log.targetType}
                              </td>
                              <td className="py-2.5 px-4 text-slate-300">{log.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ==================== EDIT PROJECT MODAL ==================== */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E131D] border border-white/15 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Edit Project · {editingProject.name}</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProjectJsonMode((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                    projectJsonMode
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-white/10 text-slate-200 hover:bg-white/15'
                  }`}
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>{projectJsonMode ? 'Form View' : 'Raw JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {!projectJsonMode ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-slate-400 font-semibold block">Project Name</label>
                      <input
                        type="text"
                        value={editingProject.name}
                        onChange={(e) =>
                          setEditingProject({ ...editingProject, name: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block">Category</label>
                      <select
                        value={editingProject.category}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            category: e.target.value as Project['category'],
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none"
                      >
                        <option value="Landing">Landing</option>
                        <option value="Portfolio">Portfolio</option>
                        <option value="E-Commerce">E-Commerce</option>
                        <option value="Web Apps">Web Apps</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block">Status</label>
                      <select
                        value={editingProject.status}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            status: e.target.value as Project['status'],
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none"
                      >
                        <option value="Active">Active</option>
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-slate-400 font-semibold block">Description</label>
                      <textarea
                        rows={3}
                        value={editingProject.description || ''}
                        onChange={(e) =>
                          setEditingProject({ ...editingProject, description: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-amber-300 font-mono text-[11px] block">
                    Direct Blocks &amp; Multi-Page JSON Editor
                  </label>
                  <textarea
                    rows={14}
                    value={projectJsonText}
                    onChange={(e) => setProjectJsonText(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#05070B] border border-white/15 text-[11px] font-mono text-emerald-300 outline-none focus:border-amber-400"
                  />
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-white/10 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = editingProject;
                  setEditingProject(null);
                  onOpenProjectInStudio(target);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Open in Visual Studio
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/5 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedProject}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT USER MODAL ==================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E131D] border border-white/15 rounded-2xl max-w-md w-full p-5 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white">Edit User Account</h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Email (Read Only)</label>
                <div className="px-3 py-2 rounded-lg bg-[#07090F] border border-white/10 text-slate-400 font-mono">
                  {editingUser.email}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Display Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none"
                >
                  <option value="Creator">Creator</option>
                  <option value="Pro Creator">Pro Creator</option>
                  <option value="Moderator">Moderator</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-slate-200 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={Boolean(editingUser.isSuspended)}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, isSuspended: e.target.checked })
                  }
                  className="accent-rose-500"
                />
                <span>Suspend Account Access</span>
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUserEdit}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
              >
                Save User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CREATE PROJECT MODAL ==================== */}
      {createProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAdminProject}
            className="bg-[#0E131D] border border-white/15 rounded-2xl max-w-md w-full p-5 space-y-4 text-xs shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white">Create New Project</h3>
              <button
                type="button"
                onClick={() => setCreateProjectModal(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Project Name</label>
                <input
                  type="text"
                  required
                  value={createProjectModal.name}
                  onChange={(e) =>
                    setCreateProjectModal({ ...createProjectModal, name: e.target.value })
                  }
                  placeholder="e.g. Enterprise Landing Portal"
                  className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Category</label>
                  <select
                    value={createProjectModal.category}
                    onChange={(e) =>
                      setCreateProjectModal({
                        ...createProjectModal,
                        category: e.target.value as Project['category'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none"
                  >
                    <option value="Landing">Landing</option>
                    <option value="Portfolio">Portfolio</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="Web Apps">Web Apps</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Initial Status</label>
                  <select
                    value={createProjectModal.status}
                    onChange={(e) =>
                      setCreateProjectModal({
                        ...createProjectModal,
                        status: e.target.value as Project['status'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Description</label>
                <textarea
                  rows={2}
                  value={createProjectModal.description}
                  onChange={(e) =>
                    setCreateProjectModal({
                      ...createProjectModal,
                      description: e.target.value,
                    })
                  }
                  placeholder="Optional description or tagline..."
                  className="w-full px-3 py-2 rounded-lg bg-[#07090F] border border-white/15 text-white outline-none focus:border-indigo-400"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCreateProjectModal(null)}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== CONFIRMATION MODAL ==================== */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E131D] border border-rose-500/30 rounded-2xl max-w-sm w-full p-5 space-y-4 text-xs shadow-2xl">
            <h3 className="text-sm font-bold text-white">{confirmDialog.title}</h3>
            <p className="text-slate-300 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer"
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
