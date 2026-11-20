import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Project,
  UserProfile,
  CollaboratorMember,
  ProjectMessage,
  ProjectPresence,
  SiteSettingsConfig,
  AdminRecord,
  AuditLogEntry,
} from '../types/builder';
import {
  DEFAULT_SITE_SETTINGS,
  SUPER_ADMIN_EMAIL,
} from '../data/siteSettingsDefaults';

// Suppress internal Watch-stream 10s OnlineStateTracker console.error noise;
// all actual operation/permission failures are surfaced via handleFirestoreError.
setLogLevel('silent');

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with auto-detect long-polling for optimal proxy/network resilience
function createFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = createFirestoreInstance();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Operation Types for error diagnosis
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection to Firestore
export async function testConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
      return false;
    }
    // Document might not exist or other error, connection is established
    return true;
  }
}

// Helper to convert FirebaseUser to UserProfile
export function mapFirebaseUser(user: FirebaseUser): UserProfile {
  const email = user.email || 'developer@universe.io';
  const name = user.displayName || email.split('@')[0] || 'Developer';
  const avatar =
    user.photoURL ||
    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.uid || email)}`;

  return {
    id: user.uid,
    email,
    name,
    avatar,
    role: 'Creator',
  };
}

// Firestore User Profile Sync (preserves admin-assigned role & suspension flags)
export async function syncUserProfile(userProfile: UserProfile): Promise<void> {
  const path = `users/${userProfile.id}`;
  const now = new Date().toISOString();
  try {
    const userDocRef = doc(db, 'users', userProfile.id);
    const existingSnap = await getDoc(userDocRef);
    if (!existingSnap.exists()) {
      await setDoc(userDocRef, {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        avatar: userProfile.avatar,
        role: 'Creator',
        isSuspended: false,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await updateDoc(userDocRef, {
        email: userProfile.email,
        name: userProfile.name,
        avatar: userProfile.avatar,
        updatedAt: now,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    });
    return out as T;
  }
  return value;
}

// Firestore Projects CRUD
export async function saveProjectToFirestore(project: Project, userId: string): Promise<void> {
  const path = `projects/${project.id}`;
  try {
    const projectDocRef = doc(db, 'projects', project.id);
    const payload = stripUndefined({
      ...project,
      userId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(projectDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProjectFromFirestore(projectId: string): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    const projectDocRef = doc(db, 'projects', projectId);
    await deleteDoc(projectDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Subscribe to User's Owned Projects in Firestore
export function subscribeToUserProjects(
  userId: string,
  onProjectsUpdated: (projects: Project[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return () => {};
  }

  const collectionPath = 'projects';
  const q = query(collection(db, collectionPath), where('userId', '==', userId));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items: Project[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as Project;
        items.push({
          ...data,
          id: d.id,
        });
      });
      // Sort by updatedAt descending
      items.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      onProjectsUpdated(items);
    },
    (error) => {
      console.error('Error fetching user projects:', error);
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.GET, collectionPath);
    }
  );

  return unsubscribe;
}

// Subscribe to Projects Shared with User (Collaborative Projects)
export function subscribeToSharedProjects(
  userId: string,
  onSharedProjectsUpdated: (projects: Project[]) => void,
  onError?: (err: Error) => void
): () => void {
  const collectionPath = 'projects';
  const q = query(collection(db, collectionPath), where('collaboratorUids', 'array-contains', userId));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items: Project[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as Project;
        items.push({
          ...data,
          id: d.id,
        });
      });
      items.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      onSharedProjectsUpdated(items);
    },
    (error) => {
      console.error('Error fetching shared projects:', error);
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.GET, collectionPath);
    }
  );

  return unsubscribe;
}

// Subscribe to Live Single Project Document (Live Multi-User Canvas Sync)
export function subscribeToProjectLiveDoc(
  projectId: string,
  onProjectUpdated: (project: Project) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `projects/${projectId}`;
  const docRef = doc(db, 'projects', projectId);

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Project;
        onProjectUpdated({
          ...data,
          id: snapshot.id,
        });
      }
    },
    (error) => {
      console.error(`Error in live sync for project ${projectId}:`, error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

// Real-Time Project Team Chat
export function subscribeToProjectMessages(
  projectId: string,
  onMessages: (messages: ProjectMessage[]) => void,
  onError?: (err: Error) => void
): () => void {
  const collectionPath = `projects/${projectId}/messages`;
  const q = query(collection(db, collectionPath), orderBy('createdAt', 'asc'), limit(100));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages: ProjectMessage[] = [];
      snapshot.forEach((d) => {
        messages.push({
          ...(d.data() as ProjectMessage),
          id: d.id,
        });
      });
      onMessages(messages);
    },
    (error) => {
      console.error('Error fetching project messages:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, collectionPath);
    }
  );

  return unsubscribe;
}

export async function sendProjectMessage(
  projectId: string,
  message: Omit<ProjectMessage, 'id'>
): Promise<void> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `projects/${projectId}/messages/${messageId}`;
  try {
    const msgRef = doc(db, 'projects', projectId, 'messages', messageId);
    await setDoc(msgRef, {
      ...message,
      id: messageId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Real-Time Collaborator Presence & Cursor Tracking
export function subscribeToProjectPresence(
  projectId: string,
  onPresenceUpdate: (presences: ProjectPresence[]) => void,
  onError?: (err: Error) => void
): () => void {
  const collectionPath = `projects/${projectId}/presence`;
  const q = query(collection(db, collectionPath));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const presences: ProjectPresence[] = [];
      const now = Date.now();
      snapshot.forEach((d) => {
        const data = d.data() as ProjectPresence;
        // Consider active if updated within the last 60 seconds
        const lastSeenMs = new Date(data.lastSeen).getTime();
        if (now - lastSeenMs < 60000) {
          presences.push({
            ...data,
            id: d.id,
          });
        }
      });
      onPresenceUpdate(presences);
    },
    (error) => {
      console.error('Error fetching project presence:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, collectionPath);
    }
  );

  return unsubscribe;
}

export async function updateProjectPresence(
  projectId: string,
  presence: ProjectPresence
): Promise<void> {
  const path = `projects/${projectId}/presence/${presence.userId}`;
  try {
    const presenceRef = doc(db, 'projects', projectId, 'presence', presence.userId);
    await setDoc(
      presenceRef,
      {
        ...presence,
        lastSeen: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeProjectPresence(
  projectId: string,
  userId: string
): Promise<void> {
  const path = `projects/${projectId}/presence/${userId}`;
  try {
    const presenceRef = doc(db, 'projects', projectId, 'presence', userId);
    await deleteDoc(presenceRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Add and Remove Collaborators
export async function addCollaboratorToProject(
  projectId: string,
  collaborator: CollaboratorMember
): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    const projectDocRef = doc(db, 'projects', projectId);
    await updateDoc(projectDocRef, {
      collaboratorUids: arrayUnion(collaborator.uid),
      collaborators: arrayUnion(collaborator),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeCollaboratorFromProject(
  projectId: string,
  collaborator: CollaboratorMember
): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    const projectDocRef = doc(db, 'projects', projectId);
    await updateDoc(projectDocRef, {
      collaboratorUids: arrayRemove(collaborator.uid),
      collaborators: arrayRemove(collaborator),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ============================================================================
// ADMIN RBAC, SITE CMS SETTINGS & SECURITY AUDIT HELPERS
// ============================================================================

export async function checkIsAdminInFirestore(
  uid: string,
  email?: string | null,
  emailVerified?: boolean
): Promise<boolean> {
  if (!uid || !emailVerified) return false;
  if (email && email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  const path = `admins/${uid}`;
  try {
    const adminSnap = await getDoc(doc(db, 'admins', uid));
    return adminSnap.exists();
  } catch (error) {
    console.warn('Admin status lookup notice:', error);
    return false;
  }
}

export function subscribeToUserSelf(
  userId: string,
  onProfile: (profile: UserProfile | null) => void
): () => void {
  const path = `users/${userId}`;
  return onSnapshot(
    doc(db, 'users', userId),
    (snapshot) => {
      if (snapshot.exists()) {
        onProfile({ ...(snapshot.data() as UserProfile), id: snapshot.id });
      } else {
        onProfile(null);
      }
    },
    (error) => {
      console.warn(`User self listener notice (${path}):`, error.message);
    }
  );
}

function decodeFirestoreRestValue(val: unknown): unknown {
  if (!val || typeof val !== 'object') return undefined;
  const v = val as Record<string, unknown>;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) {
    const arr = (v.arrayValue as { values?: unknown[] })?.values;
    return Array.isArray(arr) ? arr.map(decodeFirestoreRestValue) : [];
  }
  if ('mapValue' in v) {
    const fields = (v.mapValue as { fields?: Record<string, unknown> })?.fields || {};
    const out: Record<string, unknown> = {};
    Object.entries(fields).forEach(([k, child]) => {
      out[k] = decodeFirestoreRestValue(child);
    });
    return out;
  }
  return undefined;
}

async function fetchSiteSettingsViaRest(): Promise<SiteSettingsConfig> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return DEFAULT_SITE_SETTINGS;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      firebaseConfig.projectId
    )}/databases/${encodeURIComponent(
      firebaseConfig.firestoreDatabaseId
    )}/documents/appConfig/siteSettings?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      return DEFAULT_SITE_SETTINGS;
    }
    const json = (await res.json()) as { fields?: Record<string, unknown> };
    if (!json.fields) {
      return DEFAULT_SITE_SETTINGS;
    }
    const decoded: Record<string, unknown> = {};
    Object.entries(json.fields).forEach(([k, val]) => {
      decoded[k] = decodeFirestoreRestValue(val);
    });
    const data = decoded as Partial<SiteSettingsConfig>;
    return {
      ...DEFAULT_SITE_SETTINGS,
      ...data,
      templates:
        Array.isArray(data.templates) && data.templates.length > 0
          ? data.templates
          : DEFAULT_SITE_SETTINGS.templates,
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function subscribeToSiteSettings(
  onSettings: (settings: SiteSettingsConfig) => void,
  attachLiveListener = false
): () => void {
  const path = 'appConfig/siteSettings';
  let unsubscribeSnapshot: (() => void) | null = null;
  let cancelled = false;

  // Always hydrate immediately via fast REST read without opening an unauthenticated Watch stream
  fetchSiteSettingsViaRest().then((restSettings) => {
    if (!cancelled) {
      onSettings(restSettings);
    }
  });

  // Only attach real-time onSnapshot listener once user is authenticated and online
  if (attachLiveListener && auth.currentUser && (typeof navigator === 'undefined' || navigator.onLine)) {
    unsubscribeSnapshot = onSnapshot(
      doc(db, 'appConfig', 'siteSettings'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<SiteSettingsConfig>;
          onSettings({
            ...DEFAULT_SITE_SETTINGS,
            ...data,
            templates:
              Array.isArray(data.templates) && data.templates.length > 0
                ? data.templates
                : DEFAULT_SITE_SETTINGS.templates,
          });
        } else {
          onSettings(DEFAULT_SITE_SETTINGS);
        }
      },
      (error) => {
        console.warn(`Site settings subscription notice (${path}):`, error.message);
      }
    );
  }

  return () => {
    cancelled = true;
    unsubscribeSnapshot?.();
  };
}

export async function saveSiteSettings(
  settings: SiteSettingsConfig,
  actorEmail: string
): Promise<void> {
  const path = 'appConfig/siteSettings';
  try {
    const payload = stripUndefined({
      ...settings,
      brandName: settings.brandName.slice(0, 80),
      heroTitle: settings.heroTitle.slice(0, 200),
      heroKicker: (settings.heroKicker || '').slice(0, 160),
      heroHighlight: (settings.heroHighlight || '').slice(0, 120),
      heroSubtitle: (settings.heroSubtitle || '').slice(0, 600),
      heroPrimaryCta: (settings.heroPrimaryCta || '').slice(0, 80),
      heroSecondaryCta: (settings.heroSecondaryCta || '').slice(0, 80),
      announcementText: (settings.announcementText || '').slice(0, 240),
      maintenanceMessage: (settings.maintenanceMessage || '').slice(0, 400),
      footerCopyright: (settings.footerCopyright || '').slice(0, 160),
      footerLinksText: (settings.footerLinksText || '').slice(0, 160),
      maxProjectsPerUser: Math.min(1000, Math.max(1, Math.round(Number(settings.maxProjectsPerUser) || 50))),
      templates: (settings.templates || []).slice(0, 24),
      updatedAt: new Date().toISOString(),
      updatedBy: actorEmail.slice(0, 200),
    });
    await setDoc(doc(db, 'appConfig', 'siteSettings'), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToAllUsers(
  onUsers: (users: UserProfile[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'users';
  return onSnapshot(
    query(collection(db, path), limit(200)),
    (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((d) => {
        list.push({ ...(d.data() as UserProfile), id: d.id });
      });
      list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      onUsers(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function adminUpdateUser(
  userId: string,
  patch: Partial<Pick<UserProfile, 'name' | 'role' | 'isSuspended'>>
): Promise<void> {
  const path = `users/${userId}`;
  try {
    await updateDoc(
      doc(db, 'users', userId),
      stripUndefined({
        ...patch,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToAllProjects(
  onProjects: (projects: Project[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'projects';
  return onSnapshot(
    query(collection(db, path), limit(200)),
    (snapshot) => {
      const list: Project[] = [];
      snapshot.forEach((d) => {
        list.push({ ...(d.data() as Project), id: d.id });
      });
      list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      onProjects(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function adminSaveProject(project: Project): Promise<void> {
  const path = `projects/${project.id}`;
  try {
    const payload = stripUndefined({
      ...project,
      name: project.name.slice(0, 100),
      description: (project.description || '').slice(0, 500),
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'projects', project.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToAdmins(
  onAdmins: (admins: AdminRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'admins';
  return onSnapshot(
    query(collection(db, path), limit(100)),
    (snapshot) => {
      const list: AdminRecord[] = [];
      snapshot.forEach((d) => {
        list.push({ ...(d.data() as AdminRecord), uid: d.id });
      });
      onAdmins(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function grantAdminRole(record: AdminRecord): Promise<void> {
  const path = `admins/${record.uid}`;
  try {
    await setDoc(doc(db, 'admins', record.uid), {
      uid: record.uid.trim(),
      email: record.email.trim().slice(0, 200),
      name: record.name.trim().slice(0, 100),
      role: record.role,
      grantedBy: record.grantedBy.slice(0, 200),
      grantedAt: record.grantedAt || new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function revokeAdminRole(uid: string): Promise<void> {
  const path = `admins/${uid}`;
  try {
    await deleteDoc(doc(db, 'admins', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToAuditLogs(
  onLogs: (logs: AuditLogEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'auditLogs';
  return onSnapshot(
    query(collection(db, path), orderBy('createdAt', 'desc'), limit(150)),
    (snapshot) => {
      const logs: AuditLogEntry[] = [];
      snapshot.forEach((d) => {
        logs.push({ ...(d.data() as AuditLogEntry), id: d.id });
      });
      onLogs(logs);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function logAdminAudit(
  entry: Omit<AuditLogEntry, 'id' | 'createdAt'>
): Promise<void> {
  const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `auditLogs/${id}`;
  try {
    await setDoc(doc(db, 'auditLogs', id), {
      id,
      actorUid: entry.actorUid.slice(0, 128),
      actorEmail: entry.actorEmail.slice(0, 200),
      action: entry.action.slice(0, 100),
      targetType: entry.targetType,
      targetId: entry.targetId.slice(0, 128),
      details: entry.details.slice(0, 500),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}


