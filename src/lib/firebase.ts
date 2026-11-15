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
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Project,
  UserProfile,
  CollaboratorMember,
  ProjectMessage,
  ProjectPresence,
} from '../types/builder';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID (CRITICAL: Required for multi-database instances)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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

// Firestore User Profile Sync
export async function syncUserProfile(userProfile: UserProfile): Promise<void> {
  const path = `users/${userProfile.id}`;
  try {
    const userDocRef = doc(db, 'users', userProfile.id);
    await setDoc(
      userDocRef,
      {
        ...userProfile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Firestore Projects CRUD
export async function saveProjectToFirestore(project: Project, userId: string): Promise<void> {
  const path = `projects/${project.id}`;
  try {
    const projectDocRef = doc(db, 'projects', project.id);
    const payload = {
      ...project,
      userId,
      updatedAt: new Date().toISOString(),
    };
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

