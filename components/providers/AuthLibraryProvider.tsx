'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut,
  deleteUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '@/lib/firebase/client';
import { FOUNDATION_RESOURCES } from '@/lib/resources/seed-foundation';
import {
  DEFAULT_COLLECTION,
  loadPersonalCollection,
  savePersonalCollection,
} from '@/lib/collections/storage-adapter';
import { PlaygroundTemplateCategory } from '@/lib/playground/types';

export interface UserProfileRecord {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  roleTitle: string;
  bio: string;
  preferredTheme: 'light' | 'dark';
  reducedMotion: boolean;
  recentlyViewedSlugs: string[];
  createdAtIso: string;
  updatedAtIso: string;
}

export interface UserBookmarkRecord {
  uid: string;
  resourceSlug: string;
  resourceTitle: string;
  categorySlug: string;
  notes: string;
  createdAtIso: string;
}

export interface PersonalCollectionRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  description: string;
  visibility: 'private' | 'public';
  resourceSlugs: string[];
  createdAtIso: string;
  updatedAtIso: string;
}

export interface PlaygroundExperimentRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  templateCategory: PlaygroundTemplateCategory;
  associatedResourceSlug: string;
  activeFile: string;
  codeHtml: string;
  codeCss: string;
  codeJs: string;
  visibility: 'private' | 'public';
  createdAtIso: string;
  updatedAtIso: string;
}

export interface SaveExperimentPayload {
  id?: string;
  title: string;
  description: string;
  templateCategory: PlaygroundTemplateCategory;
  associatedResourceSlug?: string;
  activeFile: string;
  codeHtml: string;
  codeCss: string;
  codeJs: string;
  visibility: 'private' | 'public';
}

interface AuthLibraryContextValue {
  user: User | null;
  isVerified: boolean;
  authReady: boolean;
  authLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  userProfile: UserProfileRecord | null;
  bookmarks: UserBookmarkRecord[];
  bookmarkedSlugs: string[];
  collections: PersonalCollectionRecord[];
  experiments: PlaygroundExperimentRecord[];
  recentlyViewedSlugs: string[];
  isBookmarked: (resourceSlug: string) => boolean;
  signInWithGoogle: () => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<boolean>;
  resendVerificationEmail: () => Promise<boolean>;
  signOutUser: () => Promise<void>;
  deleteUserAccount: () => Promise<{ ok: boolean; message: string }>;
  updateUserProfile: (
    updates: Partial<
      Pick<
        UserProfileRecord,
        'displayName' | 'photoURL' | 'roleTitle' | 'bio' | 'preferredTheme' | 'reducedMotion'
      >
    >
  ) => Promise<boolean>;
  toggleBookmark: (resourceSlug: string, notes?: string) => Promise<{ saved: boolean }>;
  updateBookmarkNotes: (resourceSlug: string, notes: string) => Promise<void>;
  createCollection: (input: {
    name: string;
    description: string;
    visibility: 'private' | 'public';
    initialResourceSlugs?: string[];
  }) => Promise<string | null>;
  updateCollection: (
    collectionId: string,
    updates: {
      name: string;
      description: string;
      visibility: 'private' | 'public';
    }
  ) => Promise<boolean>;
  deleteCollection: (collectionId: string) => Promise<boolean>;
  addResourceToCollection: (collectionId: string, resourceSlug: string) => Promise<boolean>;
  removeResourceFromCollection: (
    collectionId: string,
    resourceSlug: string
  ) => Promise<boolean>;
  reorderResourceInCollection: (
    collectionId: string,
    resourceSlug: string,
    direction: 'up' | 'down'
  ) => Promise<boolean>;
  saveExperiment: (
    payload: SaveExperimentPayload
  ) => Promise<{ ok: boolean; id?: string; error?: string }>;
  updateExperimentVisibility: (
    experimentId: string,
    visibility: 'private' | 'public'
  ) => Promise<boolean>;
  deleteExperiment: (experimentId: string) => Promise<boolean>;
  recordRecentlyViewed: (resourceSlug: string) => Promise<void>;
}

const AuthLibraryContext = createContext<AuthLibraryContextValue | null>(null);

const LOCAL_RECENT_KEY = 'dde_recently_viewed_slugs_v1';
const LOCAL_COLLECTIONS_KEY = 'dde_guest_collections_v1';
const LOCAL_EXPERIMENTS_KEY = 'dde_playground_experiments_v2';

function timestampToIso(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string' && val.length > 0) {
    return val;
  }
  return new Date().toISOString();
}

function formatFirebaseAuthError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes('auth/popup-closed-by-user')) {
    return 'Sign-in popup was closed before completing authentication.';
  }
  if (raw.includes('auth/operation-not-allowed')) {
    return 'This sign-in provider is not yet enabled in the Firebase Console. Please use Google Sign-In.';
  }
  if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password')) {
    return 'Invalid email or password credentials. Please verify and try again.';
  }
  if (raw.includes('auth/email-already-in-use')) {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (raw.includes('auth/weak-password')) {
    return 'Password must be at least 6 characters long.';
  }
  if (raw.includes('auth/requires-recent-login')) {
    return 'For your security, account deletion requires a recent sign-in. Please sign out, sign back in, and retry.';
  }
  return raw;
}

export function AuthLibraryProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfileRecord | null>(null);
  const [bookmarks, setBookmarks] = useState<UserBookmarkRecord[]>([]);
  const [collections, setCollections] = useState<PersonalCollectionRecord[]>([]);
  const [experiments, setExperiments] = useState<PlaygroundExperimentRecord[]>([]);
  const [guestRecentlyViewed, setGuestRecentlyViewed] = useState<string[]>([]);

  const isVerified = Boolean(user && user.emailVerified);
  const activeUid = user?.uid ?? null;

  // Hydrate guest data on mount
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      try {
        const localCol = loadPersonalCollection();
        const guestBookmarks: UserBookmarkRecord[] = localCol.resourceSlugs.map((slug) => {
          const found = FOUNDATION_RESOURCES.find((r) => r.slug === slug);
          return {
            uid: 'guest',
            resourceSlug: slug,
            resourceTitle: found?.title ?? slug,
            categorySlug: found?.categorySlug ?? 'design-fundamentals',
            notes: '',
            createdAtIso: localCol.updatedAtIso || '2026-11-24T00:00:00.000Z',
          };
        });
        setBookmarks(guestBookmarks);

        const rawGuestCols = window.localStorage.getItem(LOCAL_COLLECTIONS_KEY);
        if (rawGuestCols) {
          const parsedCols = JSON.parse(rawGuestCols) as PersonalCollectionRecord[];
          if (Array.isArray(parsedCols)) {
            setCollections(parsedCols);
          }
        } else {
          const initialGuestCol: PersonalCollectionRecord = {
            id: DEFAULT_COLLECTION.id,
            ownerId: 'guest',
            ownerName: 'Local Guest Workspace',
            name: DEFAULT_COLLECTION.name,
            description: DEFAULT_COLLECTION.description,
            visibility: 'private',
            resourceSlugs: DEFAULT_COLLECTION.resourceSlugs,
            createdAtIso: DEFAULT_COLLECTION.updatedAtIso,
            updatedAtIso: DEFAULT_COLLECTION.updatedAtIso,
          };
          setCollections([initialGuestCol]);
        }

        const rawRecent = window.localStorage.getItem(LOCAL_RECENT_KEY);
        if (rawRecent) {
          const parsedRecent = JSON.parse(rawRecent) as string[];
          if (Array.isArray(parsedRecent)) {
            setGuestRecentlyViewed(parsedRecent);
          }
        }
      } catch {
        // Ignore guest localStorage parse failure
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setUserProfile(null);
        const localCol = loadPersonalCollection();
        setBookmarks(
          localCol.resourceSlugs.map((slug) => {
            const found = FOUNDATION_RESOURCES.find((r) => r.slug === slug);
            return {
              uid: 'guest',
              resourceSlug: slug,
              resourceTitle: found?.title ?? slug,
              categorySlug: found?.categorySlug ?? 'design-fundamentals',
              notes: '',
              createdAtIso: localCol.updatedAtIso,
            };
          })
        );
        return;
      }

      if (nextUser.emailVerified && nextUser.email) {
        const profileRef = doc(db, 'users', nextUser.uid);
        try {
          const snap = await getDoc(profileRef);
          if (!snap.exists()) {
            const safeDisplayName = (
              nextUser.displayName ||
              nextUser.email.split('@')[0] ||
              'Design Engineer'
            ).slice(0, 80);
            const safePhotoUrl = (nextUser.photoURL || '').slice(0, 500);

            await setDoc(profileRef, {
              uid: nextUser.uid,
              email: nextUser.email,
              displayName: safeDisplayName,
              photoURL: safePhotoUrl,
              roleTitle: 'Design Systems & UI Engineer',
              bio: 'Exploring interactive specifications, design systems, and live motion physics.',
              preferredTheme: 'dark',
              reducedMotion: false,
              recentlyViewedSlugs: [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });

            const localCol = loadPersonalCollection();
            for (const slug of localCol.resourceSlugs.slice(0, 15)) {
              const found = FOUNDATION_RESOURCES.find((r) => r.slug === slug);
              if (found) {
                const bmRef = doc(db, 'users', nextUser.uid, 'bookmarks', found.slug);
                await setDoc(bmRef, {
                  uid: nextUser.uid,
                  resourceSlug: found.slug,
                  resourceTitle: found.title.slice(0, 160),
                  categorySlug: found.categorySlug.slice(0, 100),
                  notes: '',
                  createdAt: serverTimestamp(),
                });
              }
            }
          }
        } catch (err) {
          console.error('Error bootstrapping user profile:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to authenticated user's Firestore data using primitive dependencies
  useEffect(() => {
    if (!activeUid || !isVerified) return;

    const uid = activeUid;
    const profileRef = doc(db, 'users', uid);
    const bookmarksRef = collection(db, 'users', uid, 'bookmarks');
    const collectionsQuery = query(
      collection(db, 'collections'),
      where('ownerId', '==', uid)
    );
    const experimentsQuery = query(
      collection(db, 'experiments'),
      where('ownerId', '==', uid)
    );

    const unsubProfile = onSnapshot(
      profileRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        setUserProfile({
          uid: data.uid,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL || '',
          roleTitle: data.roleTitle || '',
          bio: data.bio || '',
          preferredTheme: data.preferredTheme === 'light' ? 'light' : 'dark',
          reducedMotion: Boolean(data.reducedMotion),
          recentlyViewedSlugs: Array.isArray(data.recentlyViewedSlugs)
            ? data.recentlyViewedSlugs
            : [],
          createdAtIso: timestampToIso(data.createdAt),
          updatedAtIso: timestampToIso(data.updatedAt),
        });
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        } catch {
          // Handled and logged
        }
      }
    );

    const unsubBookmarks = onSnapshot(
      bookmarksRef,
      (snap) => {
        const items: UserBookmarkRecord[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            uid: d.uid,
            resourceSlug: d.resourceSlug,
            resourceTitle: d.resourceTitle,
            categorySlug: d.categorySlug,
            notes: d.notes || '',
            createdAtIso: timestampToIso(d.createdAt),
          };
        });
        items.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
        setBookmarks(items);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, `users/${uid}/bookmarks`);
        } catch {
          // Handled and logged
        }
      }
    );

    const unsubCollections = onSnapshot(
      collectionsQuery,
      (snap) => {
        const items: PersonalCollectionRecord[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            ownerId: d.ownerId,
            ownerName: d.ownerName,
            name: d.name,
            description: d.description || '',
            visibility: d.visibility === 'public' ? 'public' : 'private',
            resourceSlugs: Array.isArray(d.resourceSlugs) ? d.resourceSlugs : [],
            createdAtIso: timestampToIso(d.createdAt),
            updatedAtIso: timestampToIso(d.updatedAt),
          };
        });
        items.sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso));
        setCollections(items);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'collections');
        } catch {
          // Handled and logged
        }
      }
    );

    const unsubExperiments = onSnapshot(
      experimentsQuery,
      (snap) => {
        const items: PlaygroundExperimentRecord[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            ownerId: d.ownerId,
            ownerName: d.ownerName,
            title: d.title,
            description: d.description || '',
            templateCategory: (d.templateCategory as PlaygroundTemplateCategory) || 'vanilla',
            associatedResourceSlug: d.associatedResourceSlug || '',
            activeFile: d.activeFile || '/index.html',
            codeHtml: d.codeHtml || '',
            codeCss: d.codeCss || '',
            codeJs: d.codeJs || '',
            visibility: d.visibility === 'public' ? 'public' : 'private',
            createdAtIso: timestampToIso(d.createdAt),
            updatedAtIso: timestampToIso(d.updatedAt),
          };
        });
        items.sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso));
        setExperiments(items);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'experiments');
        } catch {
          // Handled and logged
        }
      }
    );

    return () => {
      unsubProfile();
      unsubBookmarks();
      unsubCollections();
      unsubExperiments();
    };
  }, [activeUid, isVerified]);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (err) {
      setAuthError(formatFirebaseAuthError(err));
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        return true;
      } catch (err) {
        setAuthError(formatFirebaseAuthError(err));
        return false;
      } finally {
        setAuthLoading(false);
      }
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName: string): Promise<boolean> => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (displayName.trim()) {
          await updateProfile(cred.user, { displayName: displayName.trim().slice(0, 80) });
        }
        await sendEmailVerification(cred.user);
        return true;
      } catch (err) {
        setAuthError(formatFirebaseAuthError(err));
        return false;
      } finally {
        setAuthLoading(false);
      }
    },
    []
  );

  const resendVerificationEmail = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
      await sendEmailVerification(auth.currentUser);
      return true;
    } catch (err) {
      setAuthError(formatFirebaseAuthError(err));
      return false;
    }
  }, []);

  const signOutUser = useCallback(async (): Promise<void> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err) {
      setAuthError(formatFirebaseAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const deleteUserAccount = useCallback(async (): Promise<{
    ok: boolean;
    message: string;
  }> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { ok: false, message: 'No authenticated user session found.' };
    }
    setAuthLoading(true);
    setAuthError(null);

    try {
      const uid = currentUser.uid;

      if (currentUser.emailVerified) {
        const bmSnap = await getDocs(collection(db, 'users', uid, 'bookmarks'));
        for (const bmDoc of bmSnap.docs) {
          await deleteDoc(bmDoc.ref);
        }

        const colSnap = await getDocs(
          query(collection(db, 'collections'), where('ownerId', '==', uid))
        );
        for (const colDoc of colSnap.docs) {
          await deleteDoc(colDoc.ref);
        }

        const expSnap = await getDocs(
          query(collection(db, 'experiments'), where('ownerId', '==', uid))
        );
        for (const expDoc of expSnap.docs) {
          await deleteDoc(expDoc.ref);
        }

        await deleteDoc(doc(db, 'users', uid));
      }

      await deleteUser(currentUser);
      return {
        ok: true,
        message: 'Your account and all associated library records have been permanently deleted.',
      };
    } catch (err) {
      const friendly = formatFirebaseAuthError(err);
      setAuthError(friendly);
      return { ok: false, message: friendly };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const updateUserProfile = useCallback(
    async (
      updates: Partial<
        Pick<
          UserProfileRecord,
          'displayName' | 'photoURL' | 'roleTitle' | 'bio' | 'preferredTheme' | 'reducedMotion'
        >
      >
    ): Promise<boolean> => {
      if (!user || !user.emailVerified) return false;
      const profileRef = doc(db, 'users', user.uid);
      try {
        const safeUpdates: Record<string, unknown> = {
          updatedAt: serverTimestamp(),
        };
        if (typeof updates.displayName === 'string' && updates.displayName.trim().length > 0) {
          safeUpdates.displayName = updates.displayName.trim().slice(0, 80);
        }
        if (typeof updates.photoURL === 'string') {
          safeUpdates.photoURL = updates.photoURL.trim().slice(0, 500);
        }
        if (typeof updates.roleTitle === 'string') {
          safeUpdates.roleTitle = updates.roleTitle.trim().slice(0, 80);
        }
        if (typeof updates.bio === 'string') {
          safeUpdates.bio = updates.bio.trim().slice(0, 400);
        }
        if (updates.preferredTheme === 'light' || updates.preferredTheme === 'dark') {
          safeUpdates.preferredTheme = updates.preferredTheme;
        }
        if (typeof updates.reducedMotion === 'boolean') {
          safeUpdates.reducedMotion = updates.reducedMotion;
        }

        await updateDoc(profileRef, safeUpdates);
        return true;
      } catch (err) {
        try {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
        } catch {
          return false;
        }
      }
    },
    [user]
  );

  const bookmarkedSlugs = useMemo(
    () => bookmarks.map((b) => b.resourceSlug),
    [bookmarks]
  );

  const isBookmarked = useCallback(
    (resourceSlug: string) => bookmarkedSlugs.includes(resourceSlug),
    [bookmarkedSlugs]
  );

  const toggleBookmark = useCallback(
    async (resourceSlug: string, notes = ''): Promise<{ saved: boolean }> => {
      const resource = FOUNDATION_RESOURCES.find((r) => r.slug === resourceSlug);
      const safeTitle = (resource?.title ?? resourceSlug).slice(0, 160);
      const safeCategory = (resource?.categorySlug ?? 'design-fundamentals').slice(0, 100);

      if (user && user.emailVerified) {
        const bmRef = doc(db, 'users', user.uid, 'bookmarks', resourceSlug);
        const alreadySaved = bookmarks.some((b) => b.resourceSlug === resourceSlug);
        try {
          if (alreadySaved) {
            await deleteDoc(bmRef);
            return { saved: false };
          } else {
            await setDoc(bmRef, {
              uid: user.uid,
              resourceSlug,
              resourceTitle: safeTitle,
              categorySlug: safeCategory,
              notes: notes.slice(0, 400),
              createdAt: serverTimestamp(),
            });
            return { saved: true };
          }
        } catch (err) {
          handleFirestoreError(
            err,
            alreadySaved ? OperationType.DELETE : OperationType.CREATE,
            `users/${user.uid}/bookmarks/${resourceSlug}`
          );
        }
      }

      const currentLocal = loadPersonalCollection();
      const exists = currentLocal.resourceSlugs.includes(resourceSlug);
      const nextSlugs = exists
        ? currentLocal.resourceSlugs.filter((s) => s !== resourceSlug)
        : [resourceSlug, ...currentLocal.resourceSlugs];

      const updatedLocal = {
        ...currentLocal,
        resourceSlugs: nextSlugs,
        updatedAtIso: new Date().toISOString(),
      };
      savePersonalCollection(updatedLocal);

      setBookmarks(
        nextSlugs.map((slug) => {
          const found = FOUNDATION_RESOURCES.find((r) => r.slug === slug);
          return {
            uid: 'guest',
            resourceSlug: slug,
            resourceTitle: found?.title ?? slug,
            categorySlug: found?.categorySlug ?? 'design-fundamentals',
            notes: '',
            createdAtIso: updatedLocal.updatedAtIso,
          };
        })
      );

      return { saved: !exists };
    },
    [user, bookmarks]
  );

  const updateBookmarkNotes = useCallback(
    async (resourceSlug: string, notes: string): Promise<void> => {
      if (!user || !user.emailVerified) return;
      const bmRef = doc(db, 'users', user.uid, 'bookmarks', resourceSlug);
      try {
        await updateDoc(bmRef, {
          notes: notes.slice(0, 400),
        });
      } catch (err) {
        try {
          handleFirestoreError(
            err,
            OperationType.UPDATE,
            `users/${user.uid}/bookmarks/${resourceSlug}`
          );
        } catch {
          // Logged
        }
      }
    },
    [user]
  );

  const createCollection = useCallback(
    async (input: {
      name: string;
      description: string;
      visibility: 'private' | 'public';
      initialResourceSlugs?: string[];
    }): Promise<string | null> => {
      const cleanName = input.name.trim().slice(0, 100);
      if (!cleanName) return null;
      const cleanDesc = input.description.trim().slice(0, 500);
      const uniqueSlugs = Array.from(new Set(input.initialResourceSlugs ?? [])).slice(0, 50);

      if (user && user.emailVerified) {
        const colId = `col-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const colRef = doc(db, 'collections', colId);
        try {
          await setDoc(colRef, {
            ownerId: user.uid,
            ownerName: (userProfile?.displayName || user.displayName || 'Design Engineer').slice(
              0,
              80
            ),
            name: cleanName,
            description: cleanDesc,
            visibility: input.visibility,
            resourceSlugs: uniqueSlugs,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          return colId;
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.CREATE, `collections/${colId}`);
          } catch {
            return null;
          }
        }
      }

      const nowIso = new Date().toISOString();
      const guestCol: PersonalCollectionRecord = {
        id: `col-guest-${Date.now()}`,
        ownerId: 'guest',
        ownerName: 'Local Guest Workspace',
        name: cleanName,
        description: cleanDesc,
        visibility: input.visibility,
        resourceSlugs: uniqueSlugs,
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
      };
      setCollections((prev) => {
        const next = [guestCol, ...prev];
        try {
          window.localStorage.setItem(LOCAL_COLLECTIONS_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage quota
        }
        return next;
      });
      return guestCol.id;
    },
    [user, userProfile]
  );

  const updateCollection = useCallback(
    async (
      collectionId: string,
      updates: {
        name: string;
        description: string;
        visibility: 'private' | 'public';
      }
    ): Promise<boolean> => {
      const cleanName = updates.name.trim().slice(0, 100);
      if (!cleanName) return false;
      const cleanDesc = updates.description.trim().slice(0, 500);

      if (user && user.emailVerified) {
        const colRef = doc(db, 'collections', collectionId);
        try {
          await updateDoc(colRef, {
            name: cleanName,
            description: cleanDesc,
            visibility: updates.visibility,
            updatedAt: serverTimestamp(),
          });
          return true;
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.UPDATE, `collections/${collectionId}`);
          } catch {
            return false;
          }
        }
      }

      setCollections((prev) => {
        const next = prev.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                name: cleanName,
                description: cleanDesc,
                visibility: updates.visibility,
                updatedAtIso: new Date().toISOString(),
              }
            : c
        );
        try {
          window.localStorage.setItem(LOCAL_COLLECTIONS_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });
      return true;
    },
    [user]
  );

  const deleteCollection = useCallback(
    async (collectionId: string): Promise<boolean> => {
      if (user && user.emailVerified) {
        const colRef = doc(db, 'collections', collectionId);
        try {
          await deleteDoc(colRef);
          return true;
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.DELETE, `collections/${collectionId}`);
          } catch {
            return false;
          }
        }
      }

      setCollections((prev) => {
        const next = prev.filter((c) => c.id !== collectionId);
        try {
          window.localStorage.setItem(LOCAL_COLLECTIONS_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });
      return true;
    },
    [user]
  );

  const addResourceToCollection = useCallback(
    async (collectionId: string, resourceSlug: string): Promise<boolean> => {
      const target = collections.find((c) => c.id === collectionId);
      if (!target) return false;
      if (target.resourceSlugs.includes(resourceSlug)) return true;
      if (target.resourceSlugs.length >= 50) return false;

      const nextSlugs = [...target.resourceSlugs, resourceSlug];

      if (user && user.emailVerified) {
        const colRef = doc(db, 'collections', collectionId);
        try {
          await updateDoc(colRef, {
            resourceSlugs: nextSlugs,
            updatedAt: serverTimestamp(),
          });
          return true;
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.UPDATE, `collections/${collectionId}`);
          } catch {
            return false;
          }
        }
      }

      setCollections((prev) => {
        const next = prev.map((c) =>
          c.id === collectionId
            ? { ...c, resourceSlugs: nextSlugs, updatedAtIso: new Date().toISOString() }
            : c
        );
        try {
          window.localStorage.setItem(LOCAL_COLLECTIONS_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });
      return true;
    },
    [collections, user]
  );

  const removeResourceFromCollection = useCallback(
    async (collectionId: string, resourceSlug: string): Promise<boolean> => {
      const target = collections.find((c) => c.id === collectionId);
      if (!target) return false;
      const nextSlugs = target.resourceSlugs.filter((s) => s !== resourceSlug);

      if (user && user.emailVerified) {
        const colRef = doc(db, 'collections', collectionId);
        try {
          await updateDoc(colRef, {
            resourceSlugs: nextSlugs,
            updatedAt: serverTimestamp(),
          });
          return true;
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.UPDATE, `collections/${collectionId}`);
          } catch {
            return false;
          }
        }
      }

      setCollections((prev) => {
        const next = prev.map((c) =>
          c.id === collectionId
            ? { ...c, resourceSlugs: nextSlugs, updatedAtIso: new Date().toISOString() }
            : c
        );
        try {
          window.localStorage.setItem(LOCAL_COLLECTIONS_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });
      return true;
    },
    [collections, user]
  );

  const reorderResourceInCollection = useCallback(
    async (
      collectionId: string,
      resourceSlug: string,
      direction: 'up' | 'down'
    ): Promise<boolean> => {
      const target = collections.find((c) => c.id === collectionId);
      if (!target) return false;
      const idx = target.resourceSlugs.indexOf(resourceSlug);
      if (idx === -1) return false;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= target.resourceSlugs.length) return false;

      const nextSlugs = [...target.resourceSlugs];
      const temp = nextSlugs[idx];
      nextSlugs[idx] = nextSlugs[swapIdx];
      nextSlugs[swapIdx] = temp;

      if (user && user.emailVerified) {
        const colRef = doc(db, 'collections', collectionId);
        try {
          await updateDoc(colRef, {
            resourceSlugs: nextSlugs,
            updatedAt: serverTimestamp(),
          });
          return true;
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.UPDATE, `collections/${collectionId}`);
          } catch {
            return false;
          }
        }
      }

      setCollections((prev) => {
        const next = prev.map((c) =>
          c.id === collectionId
            ? { ...c, resourceSlugs: nextSlugs, updatedAtIso: new Date().toISOString() }
            : c
        );
        try {
          window.localStorage.setItem(LOCAL_COLLECTIONS_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });
      return true;
    },
    [collections, user]
  );

  const saveExperiment = useCallback(
    async (
      payload: SaveExperimentPayload
    ): Promise<{ ok: boolean; id?: string; error?: string }> => {
      const cleanTitle = payload.title.trim();
      if (!cleanTitle || cleanTitle.length > 120) {
        return {
          ok: false,
          error: 'Experiment title is required and must be 120 characters or fewer.',
        };
      }
      if (payload.description.length > 600) {
        return {
          ok: false,
          error: 'Experiment description must not exceed 600 characters.',
        };
      }
      if (
        payload.codeHtml.length > 25000 ||
        payload.codeCss.length > 25000 ||
        payload.codeJs.length > 25000
      ) {
        return {
          ok: false,
          error:
            'Experiment source buffer exceeds the 25,000-character security boundary per file.',
        };
      }

      const expId =
        payload.id && /^[a-zA-Z0-9_-]+$/.test(payload.id)
          ? payload.id
          : `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      if (user && user.emailVerified) {
        const expRef = doc(db, 'experiments', expId);
        try {
          await setDoc(expRef, {
            ownerId: user.uid,
            ownerName: (userProfile?.displayName || user.displayName || 'Design Engineer').slice(
              0,
              80
            ),
            title: cleanTitle,
            description: payload.description.trim().slice(0, 600),
            templateCategory: payload.templateCategory,
            associatedResourceSlug: (payload.associatedResourceSlug || '').slice(0, 128),
            activeFile: (payload.activeFile || '/index.html').slice(0, 80),
            codeHtml: payload.codeHtml,
            codeCss: payload.codeCss,
            codeJs: payload.codeJs,
            visibility: payload.visibility,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          return { ok: true, id: expId };
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.CREATE, `experiments/${expId}`);
          } catch (formatted) {
            return {
              ok: false,
              error:
                formatted instanceof Error
                  ? formatted.message
                  : 'Firestore rejected experiment write.',
            };
          }
        }
      }

      const nowIso = new Date().toISOString();
      const guestExp: PlaygroundExperimentRecord = {
        id: expId,
        ownerId: 'guest',
        ownerName: 'Local Guest Workspace',
        title: cleanTitle,
        description: payload.description.trim().slice(0, 600),
        templateCategory: payload.templateCategory,
        associatedResourceSlug: payload.associatedResourceSlug || '',
        activeFile: payload.activeFile || '/index.html',
        codeHtml: payload.codeHtml,
        codeCss: payload.codeCss,
        codeJs: payload.codeJs,
        visibility: payload.visibility,
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
      };
      setExperiments((prev) => [guestExp, ...prev.filter((e) => e.id !== expId)]);
      return { ok: true, id: expId };
    },
    [user, userProfile]
  );

  const updateExperimentVisibility = useCallback(
    async (
      experimentId: string,
      visibility: 'private' | 'public'
    ): Promise<boolean> => {
      if (user && user.emailVerified) {
        const expRef = doc(db, 'experiments', experimentId);
        try {
          await updateDoc(expRef, {
            visibility,
            updatedAt: serverTimestamp(),
          });
          return true;
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.UPDATE, `experiments/${experimentId}`);
          } catch {
            return false;
          }
        }
      }

      setExperiments((prev) =>
        prev.map((e) =>
          e.id === experimentId
            ? { ...e, visibility, updatedAtIso: new Date().toISOString() }
            : e
        )
      );
      return true;
    },
    [user]
  );

  const deleteExperiment = useCallback(
    async (experimentId: string): Promise<boolean> => {
      if (user && user.emailVerified) {
        const expRef = doc(db, 'experiments', experimentId);
        try {
          await deleteDoc(expRef);
          return true;
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.DELETE, `experiments/${experimentId}`);
          } catch {
            return false;
          }
        }
      }

      setExperiments((prev) => {
        const next = prev.filter((e) => e.id !== experimentId);
        try {
          window.localStorage.setItem(LOCAL_EXPERIMENTS_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });
      return true;
    },
    [user]
  );

  const recordRecentlyViewed = useCallback(
    async (resourceSlug: string): Promise<void> => {
      if (!resourceSlug) return;

      setGuestRecentlyViewed((prev) => {
        const next = [resourceSlug, ...prev.filter((s) => s !== resourceSlug)].slice(0, 20);
        try {
          window.localStorage.setItem(LOCAL_RECENT_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });

      if (user && user.emailVerified && userProfile) {
        const currentList = userProfile.recentlyViewedSlugs || [];
        if (currentList[0] === resourceSlug) return;
        const nextList = [
          resourceSlug,
          ...currentList.filter((s) => s !== resourceSlug),
        ].slice(0, 20);
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            recentlyViewedSlugs: nextList,
            updatedAt: serverTimestamp(),
          });
        } catch {
          // Non-fatal history update
        }
      }
    },
    [user, userProfile]
  );

  const recentlyViewedSlugs = useMemo(() => {
    if (user && user.emailVerified && userProfile) {
      return userProfile.recentlyViewedSlugs.length > 0
        ? userProfile.recentlyViewedSlugs
        : guestRecentlyViewed;
    }
    return guestRecentlyViewed;
  }, [user, userProfile, guestRecentlyViewed]);

  const value = useMemo<AuthLibraryContextValue>(
    () => ({
      user,
      isVerified,
      authReady,
      authLoading,
      authError,
      clearAuthError,
      userProfile,
      bookmarks,
      bookmarkedSlugs,
      collections,
      experiments,
      recentlyViewedSlugs,
      isBookmarked,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      resendVerificationEmail,
      signOutUser,
      deleteUserAccount,
      updateUserProfile,
      toggleBookmark,
      updateBookmarkNotes,
      createCollection,
      updateCollection,
      deleteCollection,
      addResourceToCollection,
      removeResourceFromCollection,
      reorderResourceInCollection,
      saveExperiment,
      updateExperimentVisibility,
      deleteExperiment,
      recordRecentlyViewed,
    }),
    [
      user,
      isVerified,
      authReady,
      authLoading,
      authError,
      clearAuthError,
      userProfile,
      bookmarks,
      bookmarkedSlugs,
      collections,
      experiments,
      recentlyViewedSlugs,
      isBookmarked,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      resendVerificationEmail,
      signOutUser,
      deleteUserAccount,
      updateUserProfile,
      toggleBookmark,
      updateBookmarkNotes,
      createCollection,
      updateCollection,
      deleteCollection,
      addResourceToCollection,
      removeResourceFromCollection,
      reorderResourceInCollection,
      saveExperiment,
      updateExperimentVisibility,
      deleteExperiment,
      recordRecentlyViewed,
    ]
  );

  return (
    <AuthLibraryContext.Provider value={value}>{children}</AuthLibraryContext.Provider>
  );
}

export function useAuthLibrary(): AuthLibraryContextValue {
  const ctx = useContext(AuthLibraryContext);
  if (!ctx) {
    throw new Error('useAuthLibrary must be used within an AuthLibraryProvider');
  }
  return ctx;
}
