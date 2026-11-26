'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Copy,
  Edit3,
  Eye,
  FileCheck2,
  FilePlus2,
  FileText,
  FolderGit2,
  FolderTree,
  GitMerge,
  History,
  Layers,
  LayoutDashboard,
  Lock,
  LogIn,
  Monitor,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Trash2,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  buildFirestoreErrorInfo,
  getFirebaseDb,
  OperationType,
} from '@/lib/firebase/client';
import { useAuthLibrary } from '@/components/providers/AuthLibraryProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { FOUNDATION_RESOURCES } from '@/lib/resources/seed-foundation';
import {
  CLASSIFICATION_DESCRIPTORS,
  TAXONOMY_CATEGORIES,
} from '@/lib/taxonomy/registry';
import {
  ADMIN_ROLE_CAPABILITIES,
  AdminRoleRecord,
  AdminRoleType,
  BOOTSTRAPPED_SUPER_ADMIN_EMAIL,
  CmsAuditLogRecord,
  CmsCategoryRecord,
  CmsDifficultyLevel,
  CmsPreviewType,
  CmsResourceRecord,
  CmsResourceStatus,
  convertSeedCategoryToCmsCategory,
  convertSeedResourceToCmsRecord,
  createDefaultCmsResourceDraft,
  sanitizeKebabSlug,
  sanitizeRichTextField,
  UserSubmissionRecord,
  UserSubmissionType,
  validateAllowedMediaReference,
} from '@/lib/admin/cms-types';
import {
  compileCmsResourcePreviewSrcDoc,
  evaluateCmsResourcePublishReadiness,
} from '@/lib/admin/preview-validator';

interface SecurityRuleContext {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: unknown;
}

type AdminMainSection =
  | 'overview'
  | 'resources'
  | 'editor'
  | 'categories'
  | 'submissions'
  | 'roles-audit';

type EditorFieldGroupTab =
  | '1-identity'
  | '2-preview'
  | '3-documentation'
  | '4-visuals'
  | '5-implementation'
  | '6-compatibility'
  | '7-customization'
  | '8-relationships';

function formatTimestampToIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (
    typeof val === 'object' &&
    val !== null &&
    'toDate' in val &&
    typeof (val as { toDate: () => Date }).toDate === 'function'
  ) {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function parseListInput(raw: string, maxItems: number): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

export function AdminCmsWorkbench() {
  const {
    user,
    authReady: isAuthReady,
    authLoading: isAuthenticating,
    authError,
    signInWithGoogle,
  } = useAuthLibrary();
  const { isDarkTheme: isDark, reducedMotionSim: reducedMotion } = useTheme();

  // Fatal Firestore Rule Error Bridge
  const [fatalRuleError, setFatalRuleError] = useState<Error | null>(null);
  if (fatalRuleError) {
    throw fatalRuleError;
  }

  const reportRuleFailure = useCallback(
    (ctx: SecurityRuleContext, err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes('permission-denied') ||
        msg.toLowerCase().includes('insufficient permissions')
      ) {
        const errInfo = buildFirestoreErrorInfo(
          err,
          ctx.operation as OperationType,
          ctx.path
        );
        setFatalRuleError(new Error(JSON.stringify(errInfo)));
      }
    },
    []
  );

  // Navigation & status Banner
  const [activeSection, setActiveSection] =
    useState<AdminMainSection>('overview');
  const [activeEditorTab, setActiveEditorTab] =
    useState<EditorFieldGroupTab>('1-identity');
  const [statusNotice, setStatusNotice] = useState<{
    tone: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // 1. Backend-Verified Role State
  const [verifiedRole, setVerifiedRole] = useState<AdminRoleType | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  // 2. Real Firestore Collections State
  const [cmsResources, setCmsResources] = useState<CmsResourceRecord[]>([]);
  const [cmsCategories, setCmsCategories] = useState<CmsCategoryRecord[]>([]);
  const [cmsSubmissions, setCmsSubmissions] = useState<UserSubmissionRecord[]>(
    []
  );
  const [cmsAuditLogs, setCmsAuditLogs] = useState<CmsAuditLogRecord[]>([]);
  const [adminRolesList, setAdminRolesList] = useState<AdminRoleRecord[]>([]);

  // 3. Resource Management Filter & Selection State
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceStatusFilter, setResourceStatusFilter] = useState<
    'all' | CmsResourceStatus
  >('all');
  const [resourceCategoryFilter, setResourceCategoryFilter] =
    useState<string>('all');
  const [deleteTargetSlug, setDeleteTargetSlug] = useState<string | null>(null);

  // 4. Structured Resource Editor State (8 Field Groups)
  const [editorDraft, setEditorDraft] = useState<CmsResourceRecord>(() =>
    createDefaultCmsResourceDraft('system', 'Editorial Architect')
  );
  const [isEditingExistingDoc, setIsEditingExistingDoc] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<
    'desktop' | 'tablet' | 'mobile'
  >('desktop');
  const [previewRenderCycle, setPreviewRenderCycle] = useState(0);
  const [sandboxRuntimeErrors, setSandboxRuntimeErrors] = useState<string[]>(
    []
  );

  // Raw string buffers for array fields in the editor so typing commas/newlines feels natural
  const [subcategoriesInput, setSubcategoriesInput] = useState(
    'Cards & Containers, Interactive Surfaces'
  );
  const [tagsInput, setTagsInput] = useState(
    'spring-physics, card-anatomy, wcag-focus, reduced-motion'
  );
  const [aliasesInput, setAliasesInput] = useState(
    'Tactile Surface Card, Physics Interactive Container'
  );
  const [dependenciesInput, setDependenciesInput] = useState(
    'None (Zero-dependency native web standard)'
  );
  const [relatedResourcesInput, setRelatedResourcesInput] = useState(
    'material-3-semantic-token-hierarchy, spring-physics-choreography'
  );
  const [prerequisitesInput, setPrerequisitesInput] = useState(
    'wcag-apca-contrast-architecture'
  );
  const [alternativesInput, setAlternativesInput] = useState(
    'glassmorphism-depth-architecture'
  );
  const [relatedTechInput, setRelatedTechInput] = useState(
    'CSS Custom Properties, WAI-ARIA 1.2, Web Animations API'
  );

  // 5. Category Editor & Merge/Migration Modal State
  const [editingCategory, setEditingCategory] =
    useState<CmsCategoryRecord | null>(null);
  const [categorySubcatsInput, setCategorySubcatsInput] = useState('');
  const [mergeSourceSlug, setMergeSourceSlug] = useState('');
  const [mergeTargetSlug, setMergeTargetSlug] = useState('');

  // 6. User Submissions & New Submission Drawer State
  const [showNewSubmissionForm, setShowNewSubmissionForm] = useState(false);
  const [submissionType, setSubmissionType] =
    useState<UserSubmissionType>('design-resource');
  const [submissionTitle, setSubmissionTitle] = useState('');
  const [submissionTargetSlug, setSubmissionTargetSlug] = useState('');
  const [submissionCategorySlug, setSubmissionCategorySlug] = useState(
    'design-fundamentals'
  );
  const [submissionSummary, setSubmissionSummary] = useState('');
  const [submissionCode, setSubmissionCode] = useState('');
  const [submissionSourceUrl, setSubmissionSourceUrl] = useState('');
  const [submissionLicense, setSubmissionLicense] = useState(
    'MIT / CC-BY-4.0 Original Contribution'
  );
  const [moderationNotesMap, setModerationNotesMap] = useState<
    Record<string, string>
  >({});

  // 7. Role Assignment Form (Super Admin)
  const [newRoleUid, setNewRoleUid] = useState('');
  const [newRoleEmail, setNewRoleEmail] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleTier, setNewRoleTier] = useState<AdminRoleType>('editor');

  const activeUid = user?.uid ?? null;
  const activeEmail = user?.email ?? null;
  const isEmailVerified = Boolean(user?.emailVerified);

  // Listen for sandbox runtime error messages from the live preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (
        data &&
        typeof data === 'object' &&
        data.type === 'DDE_PLAYGROUND_DIAGNOSTIC' &&
        data.severity === 'error'
      ) {
        const msg = String(data.message || 'Runtime sandbox error');
        setSandboxRuntimeErrors((prev) =>
          prev.includes(msg) ? prev : [...prev, msg]
        );
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Verify user's backend role from Firebase Auth token + /admin_roles/{uid}
  useEffect(() => {
    if (!isAuthReady) return;
    if (!activeUid || !isEmailVerified) {
      window.requestAnimationFrame(() => {
        setVerifiedRole(null);
        setIsRoleLoading(false);
      });
      return;
    }

    let isMounted = true;
    const db = getFirebaseDb();

    const verifyBackendRole = async () => {
      // 1. Check root Super Administrator identity (matched by firestore.rules isBootstrappedSuperAdmin())
      if (activeEmail === BOOTSTRAPPED_SUPER_ADMIN_EMAIL && isEmailVerified) {
        if (isMounted) {
          setVerifiedRole('super_admin');
          setIsRoleLoading(false);
        }
        return;
      }

      // 2. Check /admin_roles/{activeUid} document enforced by firestore.rules
      try {
        const roleRef = doc(db, 'admin_roles', activeUid);
        const snap = await getDoc(roleRef);
        if (!isMounted) return;
        if (snap.exists()) {
          const data = snap.data();
          const role = data.role as AdminRoleType;
          if (
            role === 'super_admin' ||
            role === 'admin' ||
            role === 'reviewer' ||
            role === 'editor'
          ) {
            setVerifiedRole(role);
          } else {
            setVerifiedRole(null);
          }
        } else {
          setVerifiedRole(null);
        }
      } catch {
        if (isMounted) {
          setVerifiedRole(null);
        }
      } finally {
        if (isMounted) {
          setIsRoleLoading(false);
        }
      }
    };

    verifyBackendRole();
    return () => {
      isMounted = false;
    };
  }, [isAuthReady, activeUid, activeEmail, isEmailVerified]);

  // Subscribe to CMS collections according to verified role
  useEffect(() => {
    if (!isAuthReady || !activeUid || !isEmailVerified) {
      window.requestAnimationFrame(() => {
        setCmsResources([]);
        setCmsCategories([]);
        setCmsSubmissions([]);
        setCmsAuditLogs([]);
        setAdminRolesList([]);
      });
      return;
    }

    const db = getFirebaseDb();
    const isRootSuperAdmin =
      activeEmail === BOOTSTRAPPED_SUPER_ADMIN_EMAIL && isEmailVerified;

    // 1. Subscribe to /cms_resources
    // Root super admin can list all resources; other authenticated users query their authored resources or published resources
    const resourcesQuery = isRootSuperAdmin
      ? collection(db, 'cms_resources')
      : query(
          collection(db, 'cms_resources'),
          where('authorUid', '==', activeUid)
        );

    const unsubResources = onSnapshot(
      resourcesQuery,
      (snap) => {
        const list: CmsResourceRecord[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            slug: String(d.slug || docSnap.id),
            title: String(d.title || ''),
            shortDescription: String(d.shortDescription || ''),
            fullDescription: String(d.fullDescription || ''),
            resourceType: String(d.resourceType || 'ui-component'),
            primaryCategory: String(d.primaryCategory || 'ui-components'),
            subcategories: Array.isArray(d.subcategories)
              ? d.subcategories.map(String)
              : [],
            tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
            aliases: Array.isArray(d.aliases) ? d.aliases.map(String) : [],
            difficulty: (d.difficulty as CmsDifficultyLevel) || 'intermediate',
            previewType: (d.previewType as CmsPreviewType) || 'html-css-js',
            codeHtml: String(d.codeHtml || ''),
            codeCss: String(d.codeCss || ''),
            codeJs: String(d.codeJs || ''),
            responsiveViewports: Array.isArray(d.responsiveViewports)
              ? d.responsiveViewports.map(String)
              : ['desktop', 'tablet', 'mobile'],
            previewVerified: Boolean(d.previewVerified),
            conceptExplanation: String(d.conceptExplanation || ''),
            howItWorks: String(d.howItWorks || ''),
            useCases: String(d.useCases || ''),
            advantages: String(d.advantages || ''),
            limitations: String(d.limitations || ''),
            bestPractices: String(d.bestPractices || ''),
            commonMistakes: String(d.commonMistakes || ''),
            referenceImageUrl: String(d.referenceImageUrl || ''),
            referenceCaption: String(d.referenceCaption || ''),
            referenceAttribution: String(d.referenceAttribution || ''),
            framework: String(d.framework || ''),
            dependenciesList: Array.isArray(d.dependenciesList)
              ? d.dependenciesList.map(String)
              : [],
            installInstructions: String(d.installInstructions || ''),
            desktopBehavior: String(d.desktopBehavior || ''),
            tabletBehavior: String(d.tabletBehavior || ''),
            mobileBehavior: String(d.mobileBehavior || ''),
            browserSupport: String(d.browserSupport || ''),
            accessibilityNotes: String(d.accessibilityNotes || ''),
            reducedMotionFallback: String(d.reducedMotionFallback || ''),
            performanceNotes: String(d.performanceNotes || ''),
            editableControlsSpec: String(d.editableControlsSpec || ''),
            relatedResources: Array.isArray(d.relatedResources)
              ? d.relatedResources.map(String)
              : [],
            prerequisites: Array.isArray(d.prerequisites)
              ? d.prerequisites.map(String)
              : [],
            alternatives: Array.isArray(d.alternatives)
              ? d.alternatives.map(String)
              : [],
            relatedTechnologies: Array.isArray(d.relatedTechnologies)
              ? d.relatedTechnologies.map(String)
              : [],
            status: (d.status as CmsResourceStatus) || 'draft',
            authorUid: String(d.authorUid || ''),
            authorName: String(d.authorName || ''),
            reviewerName: String(d.reviewerName || ''),
            reviewNotes: String(d.reviewNotes || ''),
            license: String(d.license || ''),
            sources: String(d.sources || ''),
            revisionNumber: Number(d.revisionNumber || 1),
            publishedAtIso: String(d.publishedAtIso || ''),
            lastVerifiedIso: String(d.lastVerifiedIso || ''),
            createdAtIso: formatTimestampToIso(d.createdAt),
            updatedAtIso: formatTimestampToIso(d.updatedAt),
          });
        });
        list.sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso));
        setCmsResources(list);
      },
      (err) =>
        reportRuleFailure({ path: '/cms_resources', operation: 'list' }, err)
    );

    // 2. Subscribe to /cms_categories
    const categoriesQuery = isRootSuperAdmin
      ? collection(db, 'cms_categories')
      : query(
          collection(db, 'cms_categories'),
          where('status', 'in', ['active', 'archived'])
        );

    const unsubCategories = onSnapshot(
      categoriesQuery,
      (snap) => {
        const list: CmsCategoryRecord[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            slug: String(d.slug || docSnap.id),
            code: String(d.code || '00'),
            name: String(d.name || ''),
            shortDescription: String(d.shortDescription || ''),
            architecturalScope: String(d.architecturalScope || ''),
            iconName: String(d.iconName || 'Layers'),
            orderIndex: Number(d.orderIndex ?? 1),
            isFeatured: Boolean(d.isFeatured),
            status: d.status === 'archived' ? 'archived' : 'active',
            subcategories: Array.isArray(d.subcategories)
              ? d.subcategories.map(String)
              : [],
            mergedIntoSlug: String(d.mergedIntoSlug || ''),
            updatedByUid: String(d.updatedByUid || ''),
            createdAtIso: formatTimestampToIso(d.createdAt),
            updatedAtIso: formatTimestampToIso(d.updatedAt),
          });
        });
        list.sort((a, b) => a.orderIndex - b.orderIndex);
        setCmsCategories(list);
      },
      (err) =>
        reportRuleFailure({ path: '/cms_categories', operation: 'list' }, err)
    );

    // 3. Subscribe to /cms_submissions
    const submissionsQuery = isRootSuperAdmin
      ? collection(db, 'cms_submissions')
      : query(
          collection(db, 'cms_submissions'),
          where('submitterUid', '==', activeUid)
        );

    const unsubSubmissions = onSnapshot(
      submissionsQuery,
      (snap) => {
        const list: UserSubmissionRecord[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            submitterUid: String(d.submitterUid || ''),
            submitterName: String(d.submitterName || ''),
            submissionType:
              (d.submissionType as UserSubmissionType) || 'design-resource',
            title: String(d.title || ''),
            targetResourceSlug: String(d.targetResourceSlug || ''),
            categorySlug: String(d.categorySlug || ''),
            summary: String(d.summary || ''),
            proposedCodeOrContent: String(d.proposedCodeOrContent || ''),
            sourceUrl: String(d.sourceUrl || ''),
            licenseAttestation: String(d.licenseAttestation || ''),
            status:
              (d.status as UserSubmissionRecord['status']) || 'pending_review',
            reviewerNotes: String(d.reviewerNotes || ''),
            reviewedByUid: String(d.reviewedByUid || ''),
            createdAtIso: formatTimestampToIso(d.createdAt),
            updatedAtIso: formatTimestampToIso(d.updatedAt),
          });
        });
        list.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
        setCmsSubmissions(list);
      },
      (err) =>
        reportRuleFailure({ path: '/cms_submissions', operation: 'list' }, err)
    );

    // 4. Subscribe to /cms_audit_logs
    const auditQuery = isRootSuperAdmin
      ? collection(db, 'cms_audit_logs')
      : query(
          collection(db, 'cms_audit_logs'),
          where('actorUid', '==', activeUid)
        );

    const unsubAudit = onSnapshot(
      auditQuery,
      (snap) => {
        const list: CmsAuditLogRecord[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            actorUid: String(d.actorUid || ''),
            actorName: String(d.actorName || ''),
            actorRole: (d.actorRole as AdminRoleType) || 'editor',
            action: String(d.action || ''),
            targetType:
              (d.targetType as CmsAuditLogRecord['targetType']) || 'resource',
            targetId: String(d.targetId || ''),
            summary: String(d.summary || ''),
            createdAtIso: formatTimestampToIso(d.createdAt),
          });
        });
        list.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
        setCmsAuditLogs(list);
      },
      (err) =>
        reportRuleFailure({ path: '/cms_audit_logs', operation: 'list' }, err)
    );

    // 5. Subscribe to /admin_roles
    const rolesQuery = isRootSuperAdmin
      ? collection(db, 'admin_roles')
      : query(collection(db, 'admin_roles'), where('uid', '==', activeUid));

    const unsubRoles = onSnapshot(
      rolesQuery,
      (snap) => {
        const list: AdminRoleRecord[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            uid: String(d.uid || docSnap.id),
            email: String(d.email || ''),
            displayName: String(d.displayName || ''),
            role: (d.role as AdminRoleType) || 'editor',
            assignedByUid: String(d.assignedByUid || ''),
            createdAtIso: formatTimestampToIso(d.createdAt),
            updatedAtIso: formatTimestampToIso(d.updatedAt),
          });
        });
        setAdminRolesList(list);
      },
      (err) =>
        reportRuleFailure({ path: '/admin_roles', operation: 'list' }, err)
    );

    return () => {
      unsubResources();
      unsubCategories();
      unsubSubmissions();
      unsubAudit();
      unsubRoles();
    };
  }, [
    isAuthReady,
    activeUid,
    activeEmail,
    isEmailVerified,
    reportRuleFailure,
  ]);

  // Record an immutable audit log entry in /cms_audit_logs
  const writeAuditLog = useCallback(
    async (
      action: string,
      targetType: CmsAuditLogRecord['targetType'],
      targetId: string,
      summary: string
    ) => {
      if (!user || !verifiedRole) return;
      const db = getFirebaseDb();
      const logId = `audit-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`;
      const payload = {
        actorUid: user.uid,
        actorName: (user.displayName || user.email || 'Administrator').slice(
          0,
          80
        ),
        actorRole: verifiedRole,
        action: action.slice(0, 80),
        targetType,
        targetId: targetId.slice(0, 128),
        summary: summary.slice(0, 500),
        createdAt: serverTimestamp(),
      };
      try {
        await setDoc(doc(db, 'cms_audit_logs', logId), payload);
      } catch (err) {
        reportRuleFailure(
          {
            path: `/cms_audit_logs/${logId}`,
            operation: 'create',
            requestResourceData: payload,
          },
          err
        );
      }
    },
    [user, verifiedRole, reportRuleFailure]
  );

  // Merge baseline seed categories with CMS categories
  const effectiveCategories = useMemo<CmsCategoryRecord[]>(() => {
    const map = new Map<string, CmsCategoryRecord>();
    TAXONOMY_CATEGORIES.forEach((cat, idx) => {
      map.set(
        cat.slug,
        convertSeedCategoryToCmsCategory(cat, idx, activeUid || 'system')
      );
    });
    cmsCategories.forEach((cmsCat) => {
      map.set(cmsCat.slug, cmsCat);
    });
    return Array.from(map.values()).sort((a, b) => a.orderIndex - b.orderIndex);
  }, [cmsCategories, activeUid]);

  // Combined resources view (CMS database records + baseline seed resources)
  const combinedResources = useMemo(() => {
    const cmsSlugSet = new Set(cmsResources.map((r) => r.slug));
    const seedConverted = FOUNDATION_RESOURCES.filter(
      (seed) => !cmsSlugSet.has(sanitizeKebabSlug(seed.slug))
    ).map((seed) => ({
      ...convertSeedResourceToCmsRecord(
        seed,
        activeUid || 'system',
        'Canonical Encyclopedia Seed'
      ),
      isBaselineSeed: true,
    }));
    const cmsTagged = cmsResources.map((r) => ({
      ...r,
      isBaselineSeed: false,
    }));
    return [...cmsTagged, ...seedConverted];
  }, [cmsResources, activeUid]);

  // Section 2: Real Non-Fabricated Database & Registry Metrics
  const dashboardMetrics = useMemo(() => {
    const publishedCount = combinedResources.filter(
      (r) => r.status === 'published'
    ).length;
    const cmsPublishedCount = cmsResources.filter(
      (r) => r.status === 'published'
    ).length;
    const draftCount = cmsResources.filter((r) => r.status === 'draft').length;
    const inReviewResourcesCount = cmsResources.filter(
      (r) => r.status === 'in_review'
    ).length;
    const approvedCount = cmsResources.filter(
      (r) => r.status === 'approved'
    ).length;

    const activeCategories = effectiveCategories.filter(
      (c) => c.status === 'active'
    );
    const totalSubcategories = activeCategories.reduce(
      (acc, c) => acc + c.subcategories.length,
      0
    );

    const pendingSubmissionsCount = cmsSubmissions.filter(
      (s) => s.status === 'pending_review'
    ).length;
    const reportedResourcesCount = cmsSubmissions.filter(
      (s) => s.submissionType === 'correction-report'
    ).length;

    return {
      publishedCount,
      cmsPublishedCount,
      draftCount,
      pendingReviewsCount: inReviewResourcesCount + pendingSubmissionsCount,
      inReviewResourcesCount,
      approvedCount,
      categoriesCount: activeCategories.length,
      subcategoriesCount: totalSubcategories,
      userSubmissionsCount: cmsSubmissions.length,
      pendingSubmissionsCount,
      reportedResourcesCount,
    };
  }, [combinedResources, cmsResources, effectiveCategories, cmsSubmissions]);

  // Filtered resources for Section 3 Resource Management Table
  const filteredResources = useMemo(() => {
    const q = resourceSearch.trim().toLowerCase();
    return combinedResources.filter((res) => {
      if (
        resourceStatusFilter !== 'all' &&
        res.status !== resourceStatusFilter
      ) {
        return false;
      }
      if (
        resourceCategoryFilter !== 'all' &&
        res.primaryCategory !== resourceCategoryFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        res.title.toLowerCase().includes(q) ||
        res.slug.toLowerCase().includes(q) ||
        res.shortDescription.toLowerCase().includes(q) ||
        res.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [
    combinedResources,
    resourceSearch,
    resourceStatusFilter,
    resourceCategoryFilter,
  ]);

  // Synchronize array input text buffers when loading a resource into the Structured Editor
  const loadResourceIntoEditor = useCallback(
    (record: CmsResourceRecord, existsInCmsDb: boolean) => {
      setEditorDraft(record);
      setIsEditingExistingDoc(existsInCmsDb);
      setSubcategoriesInput(record.subcategories.join(', '));
      setTagsInput(record.tags.join(', '));
      setAliasesInput(record.aliases.join(', '));
      setDependenciesInput(record.dependenciesList.join(', '));
      setRelatedResourcesInput(record.relatedResources.join(', '));
      setPrerequisitesInput(record.prerequisites.join(', '));
      setAlternativesInput(record.alternatives.join(', '));
      setRelatedTechInput(record.relatedTechnologies.join(', '));
      setSandboxRuntimeErrors([]);
      setPreviewRenderCycle((c) => c + 1);
      setActiveSection('editor');
    },
    []
  );

  // Section 5: Live Preview Validation Report for the current editor draft
  const existingCmsSlugs = useMemo(
    () => cmsResources.map((r) => r.slug),
    [cmsResources]
  );

  const synchronizedDraft = useMemo<CmsResourceRecord>(() => {
    return {
      ...editorDraft,
      slug: sanitizeKebabSlug(editorDraft.slug || editorDraft.title),
      subcategories: parseListInput(subcategoriesInput, 15),
      tags: parseListInput(tagsInput, 25),
      aliases: parseListInput(aliasesInput, 15),
      dependenciesList: parseListInput(dependenciesInput, 15),
      relatedResources: parseListInput(relatedResourcesInput, 15),
      prerequisites: parseListInput(prerequisitesInput, 15),
      alternatives: parseListInput(alternativesInput, 15),
      relatedTechnologies: parseListInput(relatedTechInput, 15),
    };
  }, [
    editorDraft,
    subcategoriesInput,
    tagsInput,
    aliasesInput,
    dependenciesInput,
    relatedResourcesInput,
    prerequisitesInput,
    alternativesInput,
    relatedTechInput,
  ]);

  const validationReport = useMemo(
    () =>
      evaluateCmsResourcePublishReadiness(
        synchronizedDraft,
        existingCmsSlugs,
        isEditingExistingDoc,
        sandboxRuntimeErrors
      ),
    [
      synchronizedDraft,
      existingCmsSlugs,
      isEditingExistingDoc,
      sandboxRuntimeErrors,
    ]
  );

  const previewIframeSrcDoc = useMemo(
    () =>
      compileCmsResourcePreviewSrcDoc(
        synchronizedDraft,
        isDark,
        reducedMotion
      ),
    [synchronizedDraft, isDark, reducedMotion]
  );

  const roleCapabilities = verifiedRole
    ? ADMIN_ROLE_CAPABILITIES[verifiedRole]
    : null;

  // Persist a CMS Resource with a target workflow status
  const handleSaveResourceWithStatus = async (
    targetStatus: CmsResourceStatus,
    explicitRecord?: CmsResourceRecord
  ) => {
    if (!user || !verifiedRole || !roleCapabilities) return;
    const recordToSave = explicitRecord || synchronizedDraft;
    const cleanSlug = sanitizeKebabSlug(recordToSave.slug || recordToSave.title);

    if (!cleanSlug || cleanSlug.length < 2) {
      setStatusNotice({
        tone: 'error',
        text: 'Validation Error: Resource slug must be at least 2 kebab-case characters.',
      });
      return;
    }

    // Section 5: Enforce 7-Point Preview Validation Gate before publishing
    if (targetStatus === 'published') {
      if (!roleCapabilities.canPublishAndManageTaxonomy) {
        setStatusNotice({
          tone: 'error',
          text: 'Role Restriction: Only Administrators and Super Administrators can publish resources.',
        });
        return;
      }
      const checkReport = evaluateCmsResourcePublishReadiness(
        recordToSave,
        existingCmsSlugs,
        true,
        sandboxRuntimeErrors
      );
      if (!checkReport.canPublish) {
        const failed = checkReport.checks
          .filter((c) => !c.passed)
          .map((c) => `${c.number}. ${c.label}`)
          .join(' · ');
        setStatusNotice({
          tone: 'error',
          text: `Publish Blocked by Preview Validation Gate (${checkReport.passedCount}/7 passed). Resolve: ${failed}`,
        });
        setActiveSection('editor');
        setActiveEditorTab('2-preview');
        return;
      }
    }

    if (
      (targetStatus === 'approved' || targetStatus === 'rejected') &&
      !roleCapabilities.canReviewAndApprove
    ) {
      setStatusNotice({
        tone: 'error',
        text: 'Role Restriction: Reviewer, Administrator, or Super Administrator privileges are required to approve or reject resources.',
      });
      return;
    }

    // Section 9: Validate media reference URL file type & protocol before saving
    const mediaCheck = validateAllowedMediaReference(
      recordToSave.referenceImageUrl
    );
    if (!mediaCheck.isValid) {
      setStatusNotice({
        tone: 'error',
        text: `Media Security Validation Error: ${mediaCheck.reason}`,
      });
      setActiveSection('editor');
      setActiveEditorTab('4-visuals');
      return;
    }

    setIsBusy(true);
    setStatusNotice(null);
    const db = getFirebaseDb();
    const docRef = doc(db, 'cms_resources', cleanSlug);
    const alreadyExistsInFirestore = cmsResources.some(
      (r) => r.slug === cleanSlug
    );
    const nowDateStr = new Date().toISOString().slice(0, 10);

    const basePayload = {
      slug: cleanSlug,
      title: sanitizeRichTextField(recordToSave.title, 140),
      shortDescription: sanitizeRichTextField(
        recordToSave.shortDescription,
        300
      ),
      fullDescription: sanitizeRichTextField(
        recordToSave.fullDescription,
        4000
      ),
      resourceType: (recordToSave.resourceType || 'ui-component').slice(0, 80),
      primaryCategory: (
        recordToSave.primaryCategory || 'design-fundamentals'
      ).slice(0, 100),
      subcategories: recordToSave.subcategories.slice(0, 15),
      tags: recordToSave.tags.slice(0, 25),
      aliases: recordToSave.aliases.slice(0, 15),
      difficulty: recordToSave.difficulty,
      previewType: recordToSave.previewType,
      codeHtml: recordToSave.codeHtml.slice(0, 25000),
      codeCss: recordToSave.codeCss.slice(0, 25000),
      codeJs: recordToSave.codeJs.slice(0, 25000),
      responsiveViewports: recordToSave.responsiveViewports.slice(0, 5),
      previewVerified: Boolean(recordToSave.previewVerified),
      conceptExplanation: sanitizeRichTextField(
        recordToSave.conceptExplanation,
        5000
      ),
      howItWorks: sanitizeRichTextField(recordToSave.howItWorks, 4000),
      useCases: sanitizeRichTextField(recordToSave.useCases, 3000),
      advantages: sanitizeRichTextField(recordToSave.advantages, 3000),
      limitations: sanitizeRichTextField(recordToSave.limitations, 3000),
      bestPractices: sanitizeRichTextField(recordToSave.bestPractices, 3000),
      commonMistakes: sanitizeRichTextField(recordToSave.commonMistakes, 3000),
      referenceImageUrl: recordToSave.referenceImageUrl.trim().slice(0, 500),
      referenceCaption: sanitizeRichTextField(
        recordToSave.referenceCaption,
        400
      ),
      referenceAttribution: sanitizeRichTextField(
        recordToSave.referenceAttribution,
        400
      ),
      framework: sanitizeRichTextField(
        recordToSave.framework || 'Web Standards',
        120
      ),
      dependenciesList: recordToSave.dependenciesList.slice(0, 15),
      installInstructions: sanitizeRichTextField(
        recordToSave.installInstructions,
        2000
      ),
      desktopBehavior: sanitizeRichTextField(
        recordToSave.desktopBehavior,
        1500
      ),
      tabletBehavior: sanitizeRichTextField(recordToSave.tabletBehavior, 1500),
      mobileBehavior: sanitizeRichTextField(recordToSave.mobileBehavior, 1500),
      browserSupport: sanitizeRichTextField(recordToSave.browserSupport, 1000),
      accessibilityNotes: sanitizeRichTextField(
        recordToSave.accessibilityNotes,
        2000
      ),
      reducedMotionFallback: sanitizeRichTextField(
        recordToSave.reducedMotionFallback,
        1500
      ),
      performanceNotes: sanitizeRichTextField(
        recordToSave.performanceNotes,
        1500
      ),
      editableControlsSpec: sanitizeRichTextField(
        recordToSave.editableControlsSpec,
        3000
      ),
      relatedResources: recordToSave.relatedResources.slice(0, 15),
      prerequisites: recordToSave.prerequisites.slice(0, 15),
      alternatives: recordToSave.alternatives.slice(0, 15),
      relatedTechnologies: recordToSave.relatedTechnologies.slice(0, 15),
      status: targetStatus,
      authorUid: user.uid,
      authorName: (
        user.displayName ||
        recordToSave.authorName ||
        'Administrator'
      ).slice(0, 80),
      reviewerName:
        targetStatus === 'approved' ||
        targetStatus === 'published' ||
        targetStatus === 'rejected'
          ? (user.displayName || user.email || 'Reviewer').slice(0, 80)
          : recordToSave.reviewerName.slice(0, 80),
      reviewNotes: recordToSave.reviewNotes.trim().slice(0, 1500),
      license: recordToSave.license.trim().slice(0, 160),
      sources: recordToSave.sources.trim().slice(0, 1500),
      revisionNumber: alreadyExistsInFirestore
        ? recordToSave.revisionNumber + 1
        : 1,
      publishedAtIso:
        targetStatus === 'published'
          ? nowDateStr
          : recordToSave.publishedAtIso.slice(0, 40),
      lastVerifiedIso: nowDateStr,
      updatedAt: serverTimestamp(),
    };

    try {
      if (alreadyExistsInFirestore) {
        await updateDoc(docRef, basePayload);
      } else {
        await setDoc(docRef, {
          ...basePayload,
          createdAt: serverTimestamp(),
        });
      }

      setIsEditingExistingDoc(true);
      setEditorDraft((prev) => ({
        ...prev,
        ...recordToSave,
        slug: cleanSlug,
        status: targetStatus,
        revisionNumber: basePayload.revisionNumber,
        publishedAtIso: basePayload.publishedAtIso,
        lastVerifiedIso: basePayload.lastVerifiedIso,
      }));

      await writeAuditLog(
        `resource.${targetStatus}`,
        'resource',
        cleanSlug,
        `Transitioned "${basePayload.title}" (${cleanSlug}) to [${targetStatus.toUpperCase()}] (Rev #${basePayload.revisionNumber}).`
      );

      setStatusNotice({
        tone: 'success',
        text: `Saved "${basePayload.title}" (${cleanSlug}) with status [${targetStatus.toUpperCase()}] · Revision #${basePayload.revisionNumber}.`,
      });
    } catch (err) {
      reportRuleFailure(
        {
          path: `/cms_resources/${cleanSlug}`,
          operation: alreadyExistsInFirestore ? 'update' : 'create',
          requestResourceData: basePayload,
        },
        err
      );
      setStatusNotice({
        tone: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Failed to save CMS resource document.',
      });
    } finally {
      setIsBusy(false);
    }
  };

  // Duplicate a resource into a new CMS draft
  const handleDuplicateResource = async (source: CmsResourceRecord) => {
    if (!user) return;
    const baseCopySlug = sanitizeKebabSlug(`${source.slug}-copy`);
    const uniqueSlug = existingCmsSlugs.includes(baseCopySlug)
      ? sanitizeKebabSlug(`${source.slug}-copy-${Date.now().toString().slice(-4)}`)
      : baseCopySlug;

    const duplicated: CmsResourceRecord = {
      ...source,
      slug: uniqueSlug,
      title: `${source.title} (Copy)`.slice(0, 140),
      status: 'draft',
      previewVerified: false,
      revisionNumber: 1,
      authorUid: user.uid,
      authorName: user.displayName || user.email || 'Editor',
      publishedAtIso: '',
    };

    loadResourceIntoEditor(duplicated, false);
    setStatusNotice({
      tone: 'success',
      text: `Duplicated "${source.title}" into draft "${uniqueSlug}". Review fields and click Save as Draft.`,
    });
  };

  // Delete a CMS resource with confirmation
  const handleConfirmDeleteResource = async () => {
    if (!deleteTargetSlug || !user || !roleCapabilities?.canDeleteResources)
      return;
    setIsBusy(true);
    const db = getFirebaseDb();
    try {
      await deleteDoc(doc(db, 'cms_resources', deleteTargetSlug));
      await writeAuditLog(
        'resource.delete',
        'resource',
        deleteTargetSlug,
        `Permanently deleted CMS resource "${deleteTargetSlug}".`
      );
      setStatusNotice({
        tone: 'warning',
        text: `Deleted CMS resource "${deleteTargetSlug}".`,
      });
      setDeleteTargetSlug(null);
    } catch (err) {
      reportRuleFailure(
        {
          path: `/cms_resources/${deleteTargetSlug}`,
          operation: 'delete',
        },
        err
      );
    } finally {
      setIsBusy(false);
    }
  };

  // Section 6: Save or Update Category in /cms_categories
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !user || !roleCapabilities?.canPublishAndManageTaxonomy)
      return;

    const cleanSlug = sanitizeKebabSlug(
      editingCategory.slug || editingCategory.name
    );
    if (!cleanSlug || cleanSlug.length < 2) {
      setStatusNotice({
        tone: 'error',
        text: 'Category slug must be at least 2 kebab-case characters.',
      });
      return;
    }

    // Section 6 Protection Guard: Do not allow archiving a category with published resources unless mergedIntoSlug is set
    const publishedInCat = combinedResources.filter(
      (r) => r.primaryCategory === cleanSlug && r.status === 'published'
    ).length;

    if (
      editingCategory.status === 'archived' &&
      publishedInCat > 0 &&
      !editingCategory.mergedIntoSlug
    ) {
      setStatusNotice({
        tone: 'error',
        text: `Taxonomy Safety Guard: Cannot archive "${editingCategory.name}" because it contains ${publishedInCat} published resource(s). Use the Merge & Reassign tool first.`,
      });
      return;
    }

    setIsBusy(true);
    const db = getFirebaseDb();
    const docRef = doc(db, 'cms_categories', cleanSlug);
    const existsInDb = cmsCategories.some((c) => c.slug === cleanSlug);
    const subcats = parseListInput(categorySubcatsInput, 30);

    const payload = {
      slug: cleanSlug,
      code: (editingCategory.code || '17').trim().slice(0, 10),
      name: editingCategory.name.trim().slice(0, 100),
      shortDescription: editingCategory.shortDescription.trim().slice(0, 400),
      architecturalScope: editingCategory.architecturalScope
        .trim()
        .slice(0, 1500),
      iconName: (editingCategory.iconName || 'Layers').trim().slice(0, 60),
      orderIndex: Number(editingCategory.orderIndex || 1),
      isFeatured: Boolean(editingCategory.isFeatured),
      status: editingCategory.status,
      subcategories: subcats,
      mergedIntoSlug: editingCategory.mergedIntoSlug.trim().slice(0, 120),
      updatedByUid: user.uid,
      updatedAt: serverTimestamp(),
    };

    try {
      if (existsInDb) {
        await updateDoc(docRef, payload);
      } else {
        await setDoc(docRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      await writeAuditLog(
        existsInDb ? 'category.update' : 'category.create',
        'category',
        cleanSlug,
        `Saved taxonomy category "${payload.name}" (${cleanSlug}) with ${subcats.length} subcategories.`
      );
      setStatusNotice({
        tone: 'success',
        text: `Saved category "${payload.name}" (${cleanSlug}).`,
      });
      setEditingCategory(null);
    } catch (err) {
      reportRuleFailure(
        {
          path: `/cms_categories/${cleanSlug}`,
          operation: existsInDb ? 'update' : 'create',
          requestResourceData: payload,
        },
        err
      );
    } finally {
      setIsBusy(false);
    }
  };

  // Section 6: Reorder Category (Move Up / Down)
  const handleMoveCategoryOrder = async (
    cat: CmsCategoryRecord,
    direction: 'up' | 'down'
  ) => {
    if (!user || !roleCapabilities?.canPublishAndManageTaxonomy) return;
    const newOrder =
      direction === 'up'
        ? Math.max(1, cat.orderIndex - 1)
        : Math.min(999, cat.orderIndex + 1);

    setIsBusy(true);
    const db = getFirebaseDb();
    const docRef = doc(db, 'cms_categories', cat.slug);
    const existsInDb = cmsCategories.some((c) => c.slug === cat.slug);

    const payload = {
      slug: cat.slug,
      code: cat.code,
      name: cat.name,
      shortDescription: cat.shortDescription,
      architecturalScope: cat.architecturalScope,
      iconName: cat.iconName,
      orderIndex: newOrder,
      isFeatured: cat.isFeatured,
      status: cat.status,
      subcategories: cat.subcategories,
      mergedIntoSlug: cat.mergedIntoSlug,
      updatedByUid: user.uid,
      updatedAt: serverTimestamp(),
    };

    try {
      if (existsInDb) {
        await updateDoc(docRef, payload);
      } else {
        await setDoc(docRef, { ...payload, createdAt: serverTimestamp() });
      }
      await writeAuditLog(
        'category.reorder',
        'category',
        cat.slug,
        `Reordered category "${cat.name}" to index #${newOrder}.`
      );
    } catch (err) {
      reportRuleFailure(
        {
          path: `/cms_categories/${cat.slug}`,
          operation: existsInDb ? 'update' : 'create',
          requestResourceData: payload,
        },
        err
      );
    } finally {
      setIsBusy(false);
    }
  };

  // Section 6: Merge Category & Migrate Resources
  const handleMergeAndMigrateCategories = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !roleCapabilities?.canPublishAndManageTaxonomy) return;
    if (!mergeSourceSlug || !mergeTargetSlug || mergeSourceSlug === mergeTargetSlug) {
      setStatusNotice({
        tone: 'error',
        text: 'Select two distinct categories to execute a category merge and resource migration.',
      });
      return;
    }

    const sourceCat = effectiveCategories.find(
      (c) => c.slug === mergeSourceSlug
    );
    const targetCat = effectiveCategories.find(
      (c) => c.slug === mergeTargetSlug
    );
    if (!sourceCat || !targetCat) return;

    setIsBusy(true);
    const db = getFirebaseDb();

    try {
      // 1. Reassign any CMS resources from mergeSourceSlug to mergeTargetSlug
      const resourcesToMigrate = cmsResources.filter(
        (r) => r.primaryCategory === mergeSourceSlug
      );

      for (const res of resourcesToMigrate) {
        await updateDoc(doc(db, 'cms_resources', res.slug), {
          primaryCategory: mergeTargetSlug,
          revisionNumber: res.revisionNumber + 1,
          updatedAt: serverTimestamp(),
        });
      }

      // 2. Archive source category and record mergedIntoSlug
      const sourceExistsInDb = cmsCategories.some(
        (c) => c.slug === sourceCat.slug
      );
      const sourcePayload = {
        slug: sourceCat.slug,
        code: sourceCat.code,
        name: sourceCat.name,
        shortDescription: sourceCat.shortDescription,
        architecturalScope: sourceCat.architecturalScope,
        iconName: sourceCat.iconName,
        orderIndex: sourceCat.orderIndex,
        isFeatured: false,
        status: 'archived' as const,
        subcategories: sourceCat.subcategories,
        mergedIntoSlug: targetCat.slug,
        updatedByUid: user.uid,
        updatedAt: serverTimestamp(),
      };

      if (sourceExistsInDb) {
        await updateDoc(doc(db, 'cms_categories', sourceCat.slug), sourcePayload);
      } else {
        await setDoc(doc(db, 'cms_categories', sourceCat.slug), {
          ...sourcePayload,
          createdAt: serverTimestamp(),
        });
      }

      await writeAuditLog(
        'category.merge',
        'category',
        sourceCat.slug,
        `Merged category "${sourceCat.name}" into "${targetCat.name}" and migrated ${resourcesToMigrate.length} CMS resource(s).`
      );

      setStatusNotice({
        tone: 'success',
        text: `Merged "${sourceCat.name}" into "${targetCat.name}" (${resourcesToMigrate.length} CMS resources reassigned).`,
      });
      setMergeSourceSlug('');
      setMergeTargetSlug('');
    } catch (err) {
      reportRuleFailure(
        {
          path: `/cms_categories/${mergeSourceSlug}`,
          operation: 'update',
        },
        err
      );
    } finally {
      setIsBusy(false);
    }
  };

  // Section 8: Create a Moderated User Submission / Issue Report
  const handleCreateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (
      submissionTitle.trim().length < 3 ||
      submissionSummary.trim().length < 10
    ) {
      setStatusNotice({
        tone: 'error',
        text: 'Provide a descriptive title (>= 3 chars) and detailed summary (>= 10 chars).',
      });
      return;
    }

    setIsBusy(true);
    const db = getFirebaseDb();
    const subId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const payload = {
      submitterUid: user.uid,
      submitterName: (user.displayName || user.email || 'Contributor').slice(
        0,
        80
      ),
      submissionType,
      title: submissionTitle.trim().slice(0, 140),
      targetResourceSlug: sanitizeKebabSlug(submissionTargetSlug),
      categorySlug: submissionCategorySlug.slice(0, 100),
      summary: submissionSummary.trim().slice(0, 3000),
      proposedCodeOrContent: submissionCode.slice(0, 15000),
      sourceUrl: submissionSourceUrl.trim().slice(0, 500),
      licenseAttestation: (
        submissionLicense || 'MIT / CC-BY-4.0 Contribution'
      )
        .trim()
        .slice(0, 200),
      status: 'pending_review' as const,
      reviewerNotes: '',
      reviewedByUid: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'cms_submissions', subId), payload);
      setStatusNotice({
        tone: 'success',
        text: `Submitted "${payload.title}" to the moderation queue (Status: PENDING_REVIEW).`,
      });
      setSubmissionTitle('');
      setSubmissionTargetSlug('');
      setSubmissionSummary('');
      setSubmissionCode('');
      setSubmissionSourceUrl('');
      setShowNewSubmissionForm(false);
    } catch (err) {
      reportRuleFailure(
        {
          path: `/cms_submissions/${subId}`,
          operation: 'create',
          requestResourceData: payload,
        },
        err
      );
    } finally {
      setIsBusy(false);
    }
  };

  // Section 8: Moderate User Submission (Approve & Convert to CMS Draft, or Reject)
  const handleModerateSubmission = async (
    sub: UserSubmissionRecord,
    decision: 'approved' | 'rejected',
    convertToDraft: boolean
  ) => {
    if (!user || !roleCapabilities?.canReviewAndApprove) return;
    setIsBusy(true);
    const db = getFirebaseDb();
    const notes = (
      moderationNotesMap[sub.id] ||
      (decision === 'approved'
        ? 'Approved by editorial moderation review.'
        : 'Rejected during moderation review.')
    )
      .trim()
      .slice(0, 1000);

    try {
      await updateDoc(doc(db, 'cms_submissions', sub.id), {
        status: decision,
        reviewerNotes: notes,
        reviewedByUid: user.uid,
        updatedAt: serverTimestamp(),
      });

      if (decision === 'approved' && convertToDraft) {
        const draftSlug = sanitizeKebabSlug(
          sub.targetResourceSlug || `${sub.title}-${sub.id.slice(-4)}`
        );
        const draftTemplate = createDefaultCmsResourceDraft(
          user.uid,
          sub.submitterName
        );
        const newDraft: CmsResourceRecord = {
          ...draftTemplate,
          slug: draftSlug,
          title: sub.title.slice(0, 140),
          shortDescription: sub.summary.slice(0, 280),
          fullDescription: sub.summary.slice(0, 4000),
          primaryCategory: sub.categorySlug || 'design-fundamentals',
          conceptExplanation: sub.summary.slice(0, 5000),
          codeHtml:
            sub.proposedCodeOrContent.trim().length > 0
              ? sub.proposedCodeOrContent.slice(0, 25000)
              : draftTemplate.codeHtml,
          license: sub.licenseAttestation.slice(0, 160),
          sources: (sub.sourceUrl || 'Moderated Community Contribution').slice(
            0,
            1500
          ),
          status: 'draft',
          previewVerified: false,
        };
        loadResourceIntoEditor(newDraft, false);
      }

      await writeAuditLog(
        `submission.${decision}`,
        'submission',
        sub.id,
        `Moderated submission "${sub.title}" as [${decision.toUpperCase()}].`
      );

      setStatusNotice({
        tone: 'success',
        text:
          decision === 'approved' && convertToDraft
            ? `Approved submission "${sub.title}" and loaded it into the Structured Resource Editor as a draft.`
            : `Marked submission "${sub.title}" as [${decision.toUpperCase()}].`,
      });
    } catch (err) {
      reportRuleFailure(
        {
          path: `/cms_submissions/${sub.id}`,
          operation: 'update',
        },
        err
      );
    } finally {
      setIsBusy(false);
    }
  };

  // Section 1: Assign or Update Administrative Role (/admin_roles/{uid}) — Super Admin Only
  const handleAssignAdminRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !roleCapabilities?.canManageAdminRoles) return;
    const targetUid = newRoleUid.trim();
    const targetEmail = newRoleEmail.trim();
    const targetName = newRoleName.trim();

    if (!targetUid || !targetEmail || !targetName) {
      setStatusNotice({
        tone: 'error',
        text: 'Provide target Firebase Auth UID, verified email, and display name.',
      });
      return;
    }

    setIsBusy(true);
    const db = getFirebaseDb();
    const docRef = doc(db, 'admin_roles', targetUid);
    const existsInDb = adminRolesList.some((r) => r.uid === targetUid);

    const payload = {
      uid: targetUid,
      email: targetEmail,
      displayName: targetName.slice(0, 80),
      role: newRoleTier,
      assignedByUid: user.uid,
      updatedAt: serverTimestamp(),
    };

    try {
      if (existsInDb) {
        await updateDoc(docRef, payload);
      } else {
        await setDoc(docRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      await writeAuditLog(
        'role.assign',
        'role',
        targetUid,
        `Assigned role [${newRoleTier.toUpperCase()}] to ${targetName} (${targetEmail}).`
      );
      setStatusNotice({
        tone: 'success',
        text: `Assigned role [${ADMIN_ROLE_CAPABILITIES[newRoleTier].label}] to ${targetName}.`,
      });
      setNewRoleUid('');
      setNewRoleEmail('');
      setNewRoleName('');
    } catch (err) {
      reportRuleFailure(
        {
          path: `/admin_roles/${targetUid}`,
          operation: existsInDb ? 'update' : 'create',
          requestResourceData: payload,
        },
        err
      );
    } finally {
      setIsBusy(false);
    }
  };

  // Unauthenticated or Loading Gate
  if (!isAuthReady || isRoleLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-8">
          <div className="h-5 w-52 animate-pulse rounded bg-[var(--ds-surface-2)]" />
          <div className="mt-3 h-4 w-96 animate-pulse rounded bg-[var(--ds-surface-2)]" />
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-24 animate-pulse rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Gate 1: Visitor is not signed in
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-8">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--ds-accent-primary)]">
            <Lock className="h-4 w-4" />
            <span>ISOLATED ADMIN AREA · BACKEND-VERIFIED RBAC</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--ds-text-primary)] sm:text-3xl">
            Encyclopedia Administration & Content Management System
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ds-text-secondary)]">
            Administrative privileges are verified strictly by Firebase
            Authentication tokens and Firestore Security Rules (
            <code className="font-mono text-xs text-[var(--ds-text-primary)]">
              /admin_roles/&#123;uid&#125;
            </code>
            ). Role access is never granted through frontend state, URL
            parameters, or user-editable profile fields.
          </p>

          {authError && (
            <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-400">
              {authError}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              disabled={isAuthenticating}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--ds-accent-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              <span>
                {isAuthenticating
                  ? 'Verifying Credentials...'
                  : 'Sign In with Google to Verify Role'}
              </span>
            </button>
            <Link
              href="/directory"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-4 py-2.5 text-sm font-medium text-[var(--ds-text-primary)] transition hover:border-[var(--ds-border-strong)]"
            >
              Return to Public Encyclopedia
            </Link>
          </div>

          <div className="mt-8 border-t border-[var(--ds-border-subtle)] pt-6">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--ds-text-muted)]">
              RBAC Authorization Matrix
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Object.values(ADMIN_ROLE_CAPABILITIES).map((cap) => (
                <div
                  key={cap.role}
                  className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--ds-text-primary)]">
                      {cap.label}
                    </span>
                    <span className="font-mono text-xs text-[var(--ds-accent-primary)] tabular-nums">
                      TIER 0{cap.tierNumber}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--ds-text-secondary)]">
                    {cap.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Gate 2: Authenticated user without an assigned administrative role can submit moderated contributions
  if (!verifiedRole || !roleCapabilities) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-8">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-amber-500">
            <ShieldAlert className="h-4 w-4" />
            <span>RESTRICTED GOVERNANCE CONSOLE · CONTRIBUTOR PORTAL ACTIVE</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-[var(--ds-text-primary)]">
            Standard Contributor Account Verified ({user.email})
          </h1>
          <p className="mt-2 text-sm text-[var(--ds-text-secondary)]">
            Your account (<code className="font-mono text-xs">{user.uid}</code>)
            does not hold a server-verified record in{' '}
            <code className="font-mono text-xs">/admin_roles</code>. You can
            submit design resources, visual examples, interactive demos, or
            issue reports below for editorial moderation.
          </p>

          {statusNotice && (
            <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              {statusNotice.text}
            </div>
          )}

          <form
            onSubmit={handleCreateSubmission}
            className="mt-6 space-y-4 rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-5"
          >
            <h2 className="text-base font-semibold text-[var(--ds-text-primary)]">
              Submit Moderated Encyclopedia Contribution or Issue Report
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                  Submission Type
                </label>
                <select
                  value={submissionType}
                  onChange={(e) =>
                    setSubmissionType(e.target.value as UserSubmissionType)
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] px-3 py-2 text-sm text-[var(--ds-text-primary)]"
                >
                  <option value="design-resource">Design Resource</option>
                  <option value="visual-example">Visual Example</option>
                  <option value="interactive-demo">
                    Interactive Demonstration
                  </option>
                  <option value="correction-report">
                    Correction / Issue Report
                  </option>
                  <option value="new-technology">New Technology</option>
                  <option value="related-reference">Related Reference</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                  Target Category
                </label>
                <select
                  value={submissionCategorySlug}
                  onChange={(e) => setSubmissionCategorySlug(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] px-3 py-2 text-sm text-[var(--ds-text-primary)]"
                >
                  {effectiveCategories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.code}. {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                Submission Title
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={140}
                value={submissionTitle}
                onChange={(e) => setSubmissionTitle(e.target.value)}
                placeholder="e.g., View Transitions API Shared Element Morphing"
                className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] px-3 py-2 text-sm text-[var(--ds-text-primary)]"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                Architectural Summary & Rationale
              </label>
              <textarea
                required
                minLength={10}
                maxLength={3000}
                rows={3}
                value={submissionSummary}
                onChange={(e) => setSubmissionSummary(e.target.value)}
                placeholder="Describe the design pattern, specification reference, or correction details..."
                className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] px-3 py-2 text-sm text-[var(--ds-text-primary)]"
              />
            </div>
            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--ds-accent-primary)] px-4 py-2 text-sm font-semibold text-white"
            >
              <Send className="h-4 w-4" />
              <span>Submit for Editorial Review</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated & Backend-Verified Admin / Editor / Reviewer Workbench
  return (
    <div className="min-h-screen bg-[var(--ds-bg-canvas)] text-[var(--ds-text-primary)]">
      {/* Top Bar Contract: Breadcrumb trail on left, primary actions on right */}
      <div className="border-b border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href="/"
              className="font-mono text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)]"
            >
              Encyclopedia
            </Link>
            <span className="text-[var(--ds-text-muted)]">/</span>
            <span className="font-mono font-semibold text-[var(--ds-text-primary)]">
              Admin CMS
            </span>
            <span className="text-[var(--ds-text-muted)]">·</span>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>
                Verified {roleCapabilities.label} (Tier 0
                {roleCapabilities.tierNumber})
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                const fresh = createDefaultCmsResourceDraft(
                  user.uid,
                  user.displayName || user.email || 'Editorial Architect'
                );
                fresh.slug = `resource-specimen-${Date.now()
                  .toString()
                  .slice(-4)}`;
                loadResourceIntoEditor(fresh, false);
              }}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--ds-accent-primary)] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-95"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              <span>New Resource</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewSubmissionForm(true);
                setActiveSection('submissions');
              }}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--ds-text-primary)] transition hover:border-[var(--ds-border-strong)]"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Log Submission / Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Canvas: Sidebar Navigation (250px) + Content Viewport */}
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[250px_1fr]">
        {/* Left Sidebar Navigation */}
        <aside className="border-b border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-4 lg:min-h-[calc(100vh-120px)] lg:border-b-0 lg:border-r">
          <div className="mb-3 px-2 font-mono text-[11px] uppercase tracking-wider text-[var(--ds-text-muted)]">
            CMS Modules
          </div>
          <nav className="space-y-1">
            {(
              [
                {
                  id: 'overview',
                  label: 'Admin Dashboard',
                  icon: LayoutDashboard,
                  count: dashboardMetrics.publishedCount,
                },
                {
                  id: 'resources',
                  label: 'Resource Directory',
                  icon: Layers,
                  count: combinedResources.length,
                },
                {
                  id: 'editor',
                  label: 'Structured Editor',
                  icon: Edit3,
                  count: `${validationReport.passedCount}/7`,
                },
                {
                  id: 'categories',
                  label: 'Taxonomy & Merges',
                  icon: FolderTree,
                  count: dashboardMetrics.categoriesCount,
                },
                {
                  id: 'submissions',
                  label: 'User Submissions',
                  icon: ClipboardCheck,
                  count: dashboardMetrics.pendingSubmissionsCount,
                },
                {
                  id: 'roles-audit',
                  label: 'Roles & Audit Log',
                  icon: Shield,
                  count: cmsAuditLogs.length,
                },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                    isActive
                      ? 'bg-[var(--ds-accent-primary)] text-white'
                      : 'text-[var(--ds-text-secondary)] hover:bg-[var(--ds-surface-2)] hover:text-[var(--ds-text-primary)]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      isActive ? 'text-white/90' : 'text-[var(--ds-text-muted)]'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Active User & Role Card */}
          <div className="mt-8 rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--ds-text-muted)]">
              Authenticated Operator
            </div>
            <div className="mt-1 truncate text-xs font-semibold text-[var(--ds-text-primary)]">
              {user.displayName || user.email}
            </div>
            <div className="truncate font-mono text-[11px] text-[var(--ds-text-muted)]">
              {user.email}
            </div>
            <div className="mt-2 border-t border-[var(--ds-border-subtle)] pt-2 font-mono text-[11px] text-emerald-500">
              Role: {roleCapabilities.label}
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Status Feedback Banner */}
          {statusNotice && (
            <div
              className={`mb-6 flex items-center justify-between gap-3 rounded-lg border p-3.5 text-xs ${
                statusNotice.tone === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : statusNotice.tone === 'warning'
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                    : 'border-red-500/40 bg-red-500/10 text-red-400'
              }`}
            >
              <span>{statusNotice.text}</span>
              <button
                type="button"
                onClick={() => setStatusNotice(null)}
                className="rounded p-1 hover:bg-black/10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ===============================================================
           * SECTION 2: ADMIN DASHBOARD (REAL DATABASE METRICS)
           * =============================================================== */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--ds-border-subtle)] pb-4">
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-[var(--ds-text-muted)]">
                    LIVE FIRESTORE & REGISTRY METRICS
                  </div>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight">
                    Encyclopedia Operations & Content Governance
                  </h1>
                </div>
                <div className="font-mono text-xs text-[var(--ds-text-muted)] tabular-nums">
                  CMS Docs: {cmsResources.length} · Seed Baseline:{' '}
                  {FOUNDATION_RESOURCES.length}
                </div>
              </div>

              {/* 8 Required Real Database Metric Cards — Single-elevation 1px border */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: 'Published Resources',
                    value: dashboardMetrics.publishedCount,
                    sub: `${dashboardMetrics.cmsPublishedCount} CMS · ${FOUNDATION_RESOURCES.length} baseline`,
                    action: () => {
                      setResourceStatusFilter('published');
                      setActiveSection('resources');
                    },
                  },
                  {
                    label: 'Draft Resources',
                    value: dashboardMetrics.draftCount,
                    sub: 'Active work-in-progress specs',
                    action: () => {
                      setResourceStatusFilter('draft');
                      setActiveSection('resources');
                    },
                  },
                  {
                    label: 'Pending Reviews',
                    value: dashboardMetrics.pendingReviewsCount,
                    sub: `${dashboardMetrics.inReviewResourcesCount} drafts · ${dashboardMetrics.pendingSubmissionsCount} submissions`,
                    action: () => {
                      setResourceStatusFilter('in_review');
                      setActiveSection('resources');
                    },
                  },
                  {
                    label: 'Primary Categories',
                    value: dashboardMetrics.categoriesCount,
                    sub: `${cmsCategories.length} customized in CMS`,
                    action: () => setActiveSection('categories'),
                  },
                  {
                    label: 'Nested Subcategories',
                    value: dashboardMetrics.subcategoriesCount,
                    sub: 'Multi-depth taxonomy nodes',
                    action: () => setActiveSection('categories'),
                  },
                  {
                    label: 'User Submissions',
                    value: dashboardMetrics.userSubmissionsCount,
                    sub: `${dashboardMetrics.pendingSubmissionsCount} awaiting moderation`,
                    action: () => setActiveSection('submissions'),
                  },
                  {
                    label: 'Reported Resources',
                    value: dashboardMetrics.reportedResourcesCount,
                    sub: 'Correction & issue reports',
                    action: () => setActiveSection('submissions'),
                  },
                  {
                    label: 'Approved & Ready',
                    value: dashboardMetrics.approvedCount,
                    sub: `${cmsAuditLogs.length} recorded audit events`,
                    action: () => {
                      setResourceStatusFilter('approved');
                      setActiveSection('resources');
                    },
                  },
                ].map((metric) => (
                  <button
                    key={metric.label}
                    type="button"
                    onClick={metric.action}
                    className="group rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-4 text-left transition hover:border-[var(--ds-accent-primary)]"
                  >
                    <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--ds-text-muted)]">
                      {metric.label}
                    </div>
                    <div className="mt-1.5 font-mono text-2xl font-bold text-[var(--ds-text-primary)] tabular-nums">
                      {metric.value}
                    </div>
                    <div className="mt-1 text-xs text-[var(--ds-text-secondary)]">
                      {metric.sub}
                    </div>
                  </button>
                ))}
              </div>

              {/* Content Workflow Pipeline Summary */}
              <div className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--ds-text-primary)]">
                      Editorial Lifecycle Pipeline (Draft → In Review → Approved
                      → Published)
                    </h2>
                    <p className="text-xs text-[var(--ds-text-secondary)]">
                      Every published resource must pass the 7-point Preview
                      Validation Gate enforced in both the editor and Firestore
                      Security Rules.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {roleCapabilities.canPublishAndManageTaxonomy && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={async () => {
                          const testDraft = createDefaultCmsResourceDraft(
                            user.uid,
                            user.displayName || user.email || 'Super Administrator'
                          );
                          testDraft.slug = 'verified-adaptive-token-specimen';
                          testDraft.title =
                            'Verified Adaptive Token & Spring Surface Specimen';
                          testDraft.previewVerified = true;
                          testDraft.status = 'published';
                          loadResourceIntoEditor(
                            testDraft,
                            cmsResources.some(
                              (r) => r.slug === testDraft.slug
                            )
                          );
                          await handleSaveResourceWithStatus(
                            'published',
                            testDraft
                          );
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>
                          Verify End-to-End Content &amp; Publishing Workflow
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveSection('editor')}
                      className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-1.5 text-xs font-medium hover:border-[var(--ds-border-strong)]"
                    >
                      Open Structured Editor
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-6">
                  {(
                    [
                      { status: 'draft', label: '01. Draft' },
                      { status: 'in_review', label: '02. In Review' },
                      { status: 'approved', label: '03. Approved' },
                      { status: 'published', label: '04. Published' },
                      { status: 'rejected', label: '05. Rejected' },
                      { status: 'archived', label: '06. Archived' },
                    ] as const
                  ).map((stage) => {
                    const count = combinedResources.filter(
                      (r) => r.status === stage.status
                    ).length;
                    return (
                      <button
                        key={stage.status}
                        type="button"
                        onClick={() => {
                          setResourceStatusFilter(stage.status);
                          setActiveSection('resources');
                        }}
                        className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-2.5 text-left transition hover:border-[var(--ds-accent-primary)]"
                      >
                        <div className="font-mono text-[11px] text-[var(--ds-text-muted)]">
                          {stage.label}
                        </div>
                        <div className="mt-1 font-mono text-lg font-bold tabular-nums">
                          {count}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recently Updated Content & Real Audit Stream */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recently Updated Content Table */}
                <div className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)]">
                  <div className="flex items-center justify-between border-b border-[var(--ds-border-subtle)] px-4 py-3">
                    <h2 className="text-sm font-semibold">
                      Recently Updated Content
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveSection('resources')}
                      className="font-mono text-xs text-[var(--ds-accent-primary)] hover:underline"
                    >
                      View All ({combinedResources.length})
                    </button>
                  </div>
                  <div className="divide-y divide-[var(--ds-border-subtle)]">
                    {combinedResources.slice(0, 6).map((res) => (
                      <div
                        key={res.slug}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs hover:bg-[var(--ds-surface-2)]"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium text-[var(--ds-text-primary)]">
                            {res.title}
                          </div>
                          <div className="font-mono text-[11px] text-[var(--ds-text-muted)] tabular-nums">
                            /concept/{res.slug} · Rev #{res.revisionNumber} ·{' '}
                            {res.updatedAtIso.slice(0, 10)}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-mono text-[11px] uppercase text-[var(--ds-text-secondary)]">
                            {res.status}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              loadResourceIntoEditor(
                                res,
                                !res.isBaselineSeed
                              )
                            }
                            className="rounded border border-[var(--ds-border-subtle)] px-2 py-1 font-mono text-[11px] hover:border-[var(--ds-accent-primary)]"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Audit Logs */}
                <div className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)]">
                  <div className="flex items-center justify-between border-b border-[var(--ds-border-subtle)] px-4 py-3">
                    <h2 className="text-sm font-semibold">
                      Recent Administrative Audit Events
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveSection('roles-audit')}
                      className="font-mono text-xs text-[var(--ds-accent-primary)] hover:underline"
                    >
                      Full Log ({cmsAuditLogs.length})
                    </button>
                  </div>
                  {cmsAuditLogs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--ds-text-muted)]">
                      No CMS mutations logged in this session yet. Edit or
                      publish a resource to record an immutable audit entry.
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--ds-border-subtle)]">
                      {cmsAuditLogs.slice(0, 6).map((log) => (
                        <div key={log.id} className="px-4 py-2.5 text-xs">
                          <div className="flex items-center justify-between font-mono text-[11px] text-[var(--ds-text-muted)] tabular-nums">
                            <span>
                              {log.action} · {log.actorName} ({log.actorRole})
                            </span>
                            <span>{log.createdAtIso.slice(0, 19)}</span>
                          </div>
                          <div className="mt-0.5 text-[var(--ds-text-secondary)]">
                            {log.summary}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
           * SECTION 3: RESOURCE MANAGEMENT DIRECTORY & WORKFLOW ACTIONS
           * =============================================================== */}
          {activeSection === 'resources' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--ds-border-subtle)] pb-4">
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-[var(--ds-text-muted)]">
                    RESOURCE LIFECYCLE & INVENTORY
                  </div>
                  <h1 className="mt-1 text-xl font-bold">
                    Resource Management ({filteredResources.length})
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--ds-text-muted)]" />
                    <input
                      type="search"
                      value={resourceSearch}
                      onChange={(e) => setResourceSearch(e.target.value)}
                      placeholder="Filter title, slug, tag..."
                      className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] py-1.5 pl-8 pr-3 text-xs text-[var(--ds-text-primary)]"
                    />
                  </div>

                  <select
                    value={resourceStatusFilter}
                    onChange={(e) =>
                      setResourceStatusFilter(
                        e.target.value as 'all' | CmsResourceStatus
                      )
                    }
                    className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] px-2.5 py-1.5 text-xs text-[var(--ds-text-primary)]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                    <option value="rejected">Rejected</option>
                    <option value="archived">Archived</option>
                  </select>

                  <select
                    value={resourceCategoryFilter}
                    onChange={(e) => setResourceCategoryFilter(e.target.value)}
                    className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] px-2.5 py-1.5 text-xs text-[var(--ds-text-primary)]"
                  >
                    <option value="all">All Categories</option>
                    {effectiveCategories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.code}. {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Delete Confirmation Modal Banner */}
              {deleteTargetSlug && (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-xs">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      Confirm permanent deletion of CMS resource{' '}
                      <strong className="font-mono">{deleteTargetSlug}</strong>?
                      This action is logged in the immutable audit trail.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmDeleteResource}
                      disabled={isBusy}
                      className="rounded bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-500"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetSlug(null)}
                      className="rounded border border-[var(--ds-border-subtle)] px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* High-Density Data Grid */}
              <div className="overflow-x-auto rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)]">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] font-mono text-[11px] uppercase text-[var(--ds-text-muted)]">
                      <th className="px-3.5 py-2.5">Resource & Slug</th>
                      <th className="px-3.5 py-2.5">Category & Type</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5 text-right">Rev</th>
                      <th className="px-3.5 py-2.5 text-right">Preview Gate</th>
                      <th className="px-3.5 py-2.5 text-right">
                        Lifecycle Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ds-border-subtle)]">
                    {filteredResources.map((res) => {
                      const check = evaluateCmsResourcePublishReadiness(
                        res,
                        existingCmsSlugs,
                        true,
                        []
                      );
                      return (
                        <tr
                          key={res.slug}
                          className="transition hover:bg-[var(--ds-surface-2)]"
                        >
                          <td className="px-3.5 py-2.5">
                            <div className="font-semibold text-[var(--ds-text-primary)]">
                              {res.title}
                            </div>
                            <div className="font-mono text-[11px] text-[var(--ds-text-muted)]">
                              /concept/{res.slug}{' '}
                              {res.isBaselineSeed ? '· Baseline Seed' : '· CMS DB'}
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="text-[var(--ds-text-primary)]">
                              {res.primaryCategory}
                            </div>
                            <div className="font-mono text-[11px] text-[var(--ds-text-muted)]">
                              {res.resourceType} · {res.difficulty}
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-[11px] uppercase">
                            <span
                              className={
                                res.status === 'published'
                                  ? 'text-emerald-500'
                                  : res.status === 'approved'
                                    ? 'text-sky-400'
                                    : res.status === 'in_review'
                                      ? 'text-amber-400'
                                      : res.status === 'rejected'
                                        ? 'text-red-400'
                                        : 'text-[var(--ds-text-muted)]'
                              }
                            >
                              {res.status}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">
                            v{res.revisionNumber}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">
                            <span
                              className={
                                check.canPublish
                                  ? 'text-emerald-500'
                                  : 'text-amber-500'
                              }
                            >
                              {check.passedCount}/7
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  loadResourceIntoEditor(
                                    res,
                                    !res.isBaselineSeed
                                  )
                                }
                                className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] px-2 py-1 font-mono text-[11px] hover:border-[var(--ds-accent-primary)]"
                              >
                                {res.isBaselineSeed ? 'Fork to CMS' : 'Edit'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  loadResourceIntoEditor(
                                    res,
                                    !res.isBaselineSeed
                                  );
                                  setActiveEditorTab('2-preview');
                                }}
                                className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] px-2 py-1 font-mono text-[11px] hover:border-[var(--ds-accent-primary)]"
                              >
                                Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateResource(res)}
                                className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] px-2 py-1 font-mono text-[11px] hover:border-[var(--ds-accent-primary)]"
                              >
                                Duplicate
                              </button>

                              {!res.isBaselineSeed &&
                                res.status !== 'published' &&
                                roleCapabilities.canPublishAndManageTaxonomy && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSaveResourceWithStatus(
                                        'published',
                                        res
                                      )
                                    }
                                    className="rounded bg-emerald-600 px-2 py-1 font-mono text-[11px] font-semibold text-white hover:bg-emerald-500"
                                  >
                                    Publish
                                  </button>
                                )}

                              {!res.isBaselineSeed &&
                                res.status === 'published' &&
                                roleCapabilities.canPublishAndManageTaxonomy && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSaveResourceWithStatus('draft', res)
                                    }
                                    className="rounded border border-amber-500/40 px-2 py-1 font-mono text-[11px] text-amber-400"
                                  >
                                    Unpublish
                                  </button>
                                )}

                              {!res.isBaselineSeed &&
                                res.status !== 'archived' &&
                                roleCapabilities.canPublishAndManageTaxonomy && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSaveResourceWithStatus(
                                        'archived',
                                        res
                                      )
                                    }
                                    className="rounded border border-[var(--ds-border-subtle)] px-2 py-1 font-mono text-[11px] text-[var(--ds-text-muted)]"
                                  >
                                    Archive
                                  </button>
                                )}

                              {!res.isBaselineSeed &&
                                roleCapabilities.canDeleteResources && (
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTargetSlug(res.slug)}
                                    className="rounded border border-red-500/30 px-2 py-1 font-mono text-[11px] text-red-400 hover:bg-red-500/10"
                                  >
                                    Delete
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
            </div>
          )}

          {/* ===============================================================
           * SECTION 4 & 5: 8-GROUP STRUCTURED RESOURCE EDITOR & PREVIEW VALIDATOR
           * =============================================================== */}
          {activeSection === 'editor' && (
            <div className="space-y-6">
              {/* Editor Top Sticky Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-4">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs text-[var(--ds-text-muted)]">
                    <span>STRUCTURED RESOURCE EDITOR</span>
                    <span>·</span>
                    <span className="uppercase text-[var(--ds-accent-primary)]">
                      STATUS: {synchronizedDraft.status}
                    </span>
                    <span>·</span>
                    <span className="tabular-nums">
                      REV #{synchronizedDraft.revisionNumber}
                    </span>
                    <span>·</span>
                    <span
                      className={`tabular-nums ${
                        validationReport.canPublish
                          ? 'text-emerald-500'
                          : 'text-amber-400'
                      }`}
                    >
                      VALIDATION GATE: {validationReport.passedCount}/7 PASSED
                    </span>
                  </div>
                  <h1 className="mt-1 text-lg font-bold">
                    {synchronizedDraft.title || 'Untitled Resource Draft'}{' '}
                    <span className="font-mono text-xs font-normal text-[var(--ds-text-muted)]">
                      (/concept/{synchronizedDraft.slug})
                    </span>
                  </h1>
                </div>

                {/* Section 3 & Section 7 Lifecycle Workflow Transitions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleSaveResourceWithStatus('draft')}
                    className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-1.5 text-xs font-medium hover:border-[var(--ds-border-strong)]"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleSaveResourceWithStatus('in_review')}
                    className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20"
                  >
                    Submit for Review
                  </button>

                  {roleCapabilities.canReviewAndApprove && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleSaveResourceWithStatus('approved')}
                        className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleSaveResourceWithStatus('rejected')}
                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {roleCapabilities.canPublishAndManageTaxonomy && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSaveResourceWithStatus('published')}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white transition ${
                        validationReport.canPublish
                          ? 'bg-emerald-600 hover:bg-emerald-500'
                          : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>
                        Publish ({validationReport.passedCount}/7 Verified)
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* 8 Field Group Navigation Bar */}
              <div className="flex flex-wrap gap-1.5 border-b border-[var(--ds-border-subtle)] pb-3">
                {(
                  [
                    { id: '1-identity', label: '01 · Identity' },
                    { id: '2-preview', label: '02 · Preview & Gate' },
                    { id: '3-documentation', label: '03 · Documentation' },
                    { id: '4-visuals', label: '04 · Visual References' },
                    { id: '5-implementation', label: '05 · Implementation' },
                    { id: '6-compatibility', label: '06 · Compatibility' },
                    { id: '7-customization', label: '07 · Customization' },
                    {
                      id: '8-relationships',
                      label: '08 · Relations & Publishing',
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveEditorTab(tab.id)}
                    className={`rounded-lg px-3 py-1.5 font-mono text-xs transition ${
                      activeEditorTab === tab.id
                        ? 'bg-[var(--ds-accent-primary)] font-semibold text-white'
                        : 'border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* GROUP 1: IDENTITY */}
              {activeEditorTab === '1-identity' && (
                <div className="grid grid-cols-1 gap-4 rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-5 sm:grid-cols-2">
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Resource Title (3–140 chars)
                    </label>
                    <input
                      type="text"
                      value={editorDraft.title}
                      onChange={(e) =>
                        setEditorDraft((p) => ({ ...p, title: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Canonical Kebab-Case Slug (Document ID)
                    </label>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        value={editorDraft.slug}
                        onChange={(e) =>
                          setEditorDraft((p) => ({
                            ...p,
                            slug: sanitizeKebabSlug(e.target.value),
                          }))
                        }
                        className="w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditorDraft((p) => ({
                            ...p,
                            slug: sanitizeKebabSlug(p.title),
                          }))
                        }
                        className="shrink-0 rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 font-mono text-xs"
                      >
                        Auto-Slug
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Resource Type (Classification)
                    </label>
                    <select
                      value={editorDraft.resourceType}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          resourceType: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    >
                      {CLASSIFICATION_DESCRIPTORS.map((desc) => (
                        <option key={desc.id} value={desc.id}>
                          {desc.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Primary Taxonomy Category
                    </label>
                    <select
                      value={editorDraft.primaryCategory}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          primaryCategory: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    >
                      {effectiveCategories.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>
                          {cat.code}. {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Difficulty Level
                    </label>
                    <select
                      value={editorDraft.difficulty}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          difficulty: e.target.value as CmsDifficultyLevel,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    >
                      <option value="foundation">Foundation</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Subcategories (Comma-separated paths)
                    </label>
                    <input
                      type="text"
                      value={subcategoriesInput}
                      onChange={(e) => setSubcategoriesInput(e.target.value)}
                      placeholder="Cards & Containers, Interactive Surfaces"
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Short Description (Directory Summary · 10–300 chars)
                    </label>
                    <textarea
                      rows={2}
                      value={editorDraft.shortDescription}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          shortDescription: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Full Architectural Description
                    </label>
                    <textarea
                      rows={3}
                      value={editorDraft.fullDescription}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          fullDescription: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Search Tags (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Aliases & Synonyms (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={aliasesInput}
                      onChange={(e) => setAliasesInput(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* GROUP 2: PREVIEW & SECTION 5 VALIDATION WORKFLOW */}
              {activeEditorTab === '2-preview' && (
                <div className="space-y-6">
                  {/* Live Sandbox Preview + 7-Point Validation Checklist */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left 7 Cols: Live Sandboxed Specimen Stage */}
                    <div className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-4 lg:col-span-7">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ds-border-subtle)] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold uppercase">
                            Origin-Isolated Sandbox Preview
                          </span>
                          <select
                            value={editorDraft.previewType}
                            onChange={(e) =>
                              setEditorDraft((p) => ({
                                ...p,
                                previewType: e.target.value as CmsPreviewType,
                                previewVerified: false,
                              }))
                            }
                            className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-2 py-1 font-mono text-xs"
                          >
                            <option value="html-css-js">HTML / CSS / JS</option>
                            <option value="react">React TSX</option>
                            <option value="svg">SVG Vector</option>
                            <option value="canvas">HTML5 Canvas</option>
                            <option value="three-webgl">
                              Three.js / WebGL
                            </option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {(
                            [
                              { id: 'desktop', icon: Monitor, label: '100%' },
                              { id: 'tablet', icon: Tablet, label: '768px' },
                              { id: 'mobile', icon: Smartphone, label: '375px' },
                            ] as const
                          ).map((vp) => {
                            const Icon = vp.icon;
                            return (
                              <button
                                key={vp.id}
                                type="button"
                                onClick={() => setPreviewViewport(vp.id)}
                                className={`inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[11px] ${
                                  previewViewport === vp.id
                                    ? 'bg-[var(--ds-accent-primary)] text-white'
                                    : 'border border-[var(--ds-border-subtle)]'
                                }`}
                              >
                                <Icon className="h-3 w-3" />
                                <span>{vp.label}</span>
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => {
                              setSandboxRuntimeErrors([]);
                              setPreviewRenderCycle((c) => c + 1);
                            }}
                            className="inline-flex items-center gap-1 rounded border border-[var(--ds-border-subtle)] px-2 py-1 font-mono text-[11px]"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Re-run</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-center rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-bg-canvas)] p-3">
                        <div
                          className={`transition-all ${
                            previewViewport === 'mobile'
                              ? 'w-[375px]'
                              : previewViewport === 'tablet'
                                ? 'w-[768px]'
                                : 'w-full'
                          }`}
                        >
                          <iframe
                            key={previewRenderCycle}
                            title="CMS Resource Sandbox Preview"
                            sandbox="allow-scripts"
                            srcDoc={previewIframeSrcDoc}
                            className="h-[300px] w-full rounded border border-[var(--ds-border-subtle)] bg-transparent"
                          />
                        </div>
                      </div>

                      {sandboxRuntimeErrors.length > 0 && (
                        <div className="mt-3 rounded border border-red-500/40 bg-red-500/10 p-3 font-mono text-xs text-red-400">
                          Runtime Sandbox Error: {sandboxRuntimeErrors[0]}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ds-border-subtle)] pt-3">
                        <div className="text-xs text-[var(--ds-text-secondary)]">
                          {editorDraft.previewVerified
                            ? 'Live preview render verified and attested for publication.'
                            : 'Test the interactive demo above, then click Verify to pass Check #06.'}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (sandboxRuntimeErrors.length > 0) {
                              setStatusNotice({
                                tone: 'error',
                                text: 'Cannot mark preview as verified while runtime errors exist in the sandbox.',
                              });
                              return;
                            }
                            setEditorDraft((p) => ({
                              ...p,
                              previewVerified: true,
                            }));
                            setStatusNotice({
                              tone: 'success',
                              text: 'Live sandbox preview render verified (Check #06 passed).',
                            });
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white ${
                            editorDraft.previewVerified
                              ? 'bg-emerald-600'
                              : 'bg-[var(--ds-accent-primary)]'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>
                            {editorDraft.previewVerified
                              ? 'Preview Render Verified'
                              : 'Verify Live Preview Render'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Right 5 Cols: Section 5 7-Point Preview Validation Gate */}
                    <div className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-4 lg:col-span-5">
                      <div className="flex items-center justify-between border-b border-[var(--ds-border-subtle)] pb-3">
                        <span className="font-mono text-xs font-semibold uppercase">
                          Section 5 · Publish Validation Gate
                        </span>
                        <span
                          className={`font-mono text-xs font-bold tabular-nums ${
                            validationReport.canPublish
                              ? 'text-emerald-500'
                              : 'text-amber-400'
                          }`}
                        >
                          {validationReport.passedCount} /{' '}
                          {validationReport.totalChecks} PASSED
                        </span>
                      </div>

                      <div className="mt-3 space-y-2.5">
                        {validationReport.checks.map((chk) => (
                          <div
                            key={chk.id}
                            className={`rounded-lg border p-2.5 text-xs ${
                              chk.passed
                                ? 'border-emerald-500/30 bg-emerald-500/5'
                                : 'border-amber-500/40 bg-amber-500/5'
                            }`}
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span>
                                {chk.number}. {chk.label}
                              </span>
                              <span
                                className={`font-mono text-[11px] ${
                                  chk.passed
                                    ? 'text-emerald-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {chk.passed ? 'PASS' : 'REQUIRED'}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-[var(--ds-text-secondary)]">
                              {chk.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Source Code Buffers (HTML, CSS, JS) */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-4">
                      <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                        HTML / SVG Markup Buffer
                      </label>
                      <textarea
                        rows={10}
                        value={editorDraft.codeHtml}
                        onChange={(e) =>
                          setEditorDraft((p) => ({
                            ...p,
                            codeHtml: e.target.value,
                            previewVerified: false,
                          }))
                        }
                        className="mt-2 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-2.5 font-mono text-xs"
                      />
                    </div>
                    <div className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-4">
                      <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                        CSS Stylesheet Buffer
                      </label>
                      <textarea
                        rows={10}
                        value={editorDraft.codeCss}
                        onChange={(e) =>
                          setEditorDraft((p) => ({
                            ...p,
                            codeCss: e.target.value,
                            previewVerified: false,
                          }))
                        }
                        className="mt-2 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-2.5 font-mono text-xs"
                      />
                    </div>
                    <div className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-4">
                      <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                        JavaScript / React TSX Buffer
                      </label>
                      <textarea
                        rows={10}
                        value={editorDraft.codeJs}
                        onChange={(e) =>
                          setEditorDraft((p) => ({
                            ...p,
                            codeJs: e.target.value,
                            previewVerified: false,
                          }))
                        }
                        className="mt-2 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-2.5 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* GROUP 3: DOCUMENTATION */}
              {activeEditorTab === '3-documentation' && (
                <div className="grid grid-cols-1 gap-4 rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Concept Explanation (Required &gt;= 20 chars)
                    </label>
                    <textarea
                      rows={4}
                      value={editorDraft.conceptExplanation}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          conceptExplanation: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      How It Works (Architectural Mechanics)
                    </label>
                    <textarea
                      rows={3}
                      value={editorDraft.howItWorks}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          howItWorks: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Purpose & Use Cases
                    </label>
                    <textarea
                      rows={3}
                      value={editorDraft.useCases}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          useCases: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Advantages
                    </label>
                    <textarea
                      rows={3}
                      value={editorDraft.advantages}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          advantages: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Limitations & Tradeoffs
                    </label>
                    <textarea
                      rows={3}
                      value={editorDraft.limitations}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          limitations: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Best Practices
                    </label>
                    <textarea
                      rows={3}
                      value={editorDraft.bestPractices}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          bestPractices: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Common Mistakes & Anti-Patterns
                    </label>
                    <textarea
                      rows={2}
                      value={editorDraft.commonMistakes}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          commonMistakes: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* GROUP 4: VISUAL REFERENCES */}
              {activeEditorTab === '4-visuals' && (
                <div className="grid grid-cols-1 gap-4 rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                        Reference Image or Diagram URL (Permitted: .png, .jpg,
                        .jpeg, .webp, .avif, .svg or https://)
                      </label>
                      {(() => {
                        const check = validateAllowedMediaReference(
                          editorDraft.referenceImageUrl
                        );
                        return (
                          <span
                            className={`font-mono text-[11px] ${
                              check.isValid
                                ? 'text-emerald-500'
                                : 'text-red-400'
                            }`}
                          >
                            {check.isValid
                              ? 'MEDIA FILE-TYPE VALID'
                              : check.reason}
                          </span>
                        );
                      })()}
                    </div>
                    <input
                      type="text"
                      value={editorDraft.referenceImageUrl}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          referenceImageUrl: e.target.value,
                        }))
                      }
                      placeholder="https://picsum.photos/seed/design-specimen/1200/675.webp"
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Visual Caption &amp; Gallery Annotation
                    </label>
                    <input
                      type="text"
                      value={editorDraft.referenceCaption}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          referenceCaption: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Visual Attribution, Credit &amp; Source URL
                    </label>
                    <input
                      type="text"
                      value={editorDraft.referenceAttribution}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          referenceAttribution: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      License Information (Required for Check #07)
                    </label>
                    <input
                      type="text"
                      value={editorDraft.license}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          license: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* GROUP 5: IMPLEMENTATION */}
              {activeEditorTab === '5-implementation' && (
                <div className="grid grid-cols-1 gap-4 rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-5 sm:grid-cols-2">
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Language & Framework
                    </label>
                    <input
                      type="text"
                      value={editorDraft.framework}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          framework: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Dependencies (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={dependenciesInput}
                      onChange={(e) => setDependenciesInput(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Installation & Integration Instructions
                    </label>
                    <textarea
                      rows={4}
                      value={editorDraft.installInstructions}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          installInstructions: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* GROUP 6: COMPATIBILITY */}
              {activeEditorTab === '6-compatibility' && (
                <div className="grid grid-cols-1 gap-4 rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-5 sm:grid-cols-2">
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Desktop Behavior
                    </label>
                    <textarea
                      rows={2}
                      value={editorDraft.desktopBehavior}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          desktopBehavior: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Tablet Behavior
                    </label>
                    <textarea
                      rows={2}
                      value={editorDraft.tabletBehavior}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          tabletBehavior: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Mobile Behavior
                    </label>
                    <textarea
                      rows={2}
                      value={editorDraft.mobileBehavior}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          mobileBehavior: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Browser Support Matrix
                    </label>
                    <textarea
                      rows={2}
                      value={editorDraft.browserSupport}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          browserSupport: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Accessibility Notes (WCAG / ARIA / Keyboard)
                    </label>
                    <textarea
                      rows={2}
                      value={editorDraft.accessibilityNotes}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          accessibilityNotes: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Reduced-Motion Alternative
                    </label>
                    <textarea
                      rows={2}
                      value={editorDraft.reducedMotionFallback}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          reducedMotionFallback: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Performance Considerations (Frame Budget / Compositor)
                    </label>
                    <textarea
                      rows={2}
                      value={editorDraft.performanceNotes}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          performanceNotes: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* GROUP 7: CUSTOMIZATION */}
              {activeEditorTab === '7-customization' && (
                <div className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-5">
                  <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                    Editable Parameter Controls Specification, Default Values &
                    Reset Behavior
                  </label>
                  <textarea
                    rows={5}
                    value={editorDraft.editableControlsSpec}
                    onChange={(e) =>
                      setEditorDraft((p) => ({
                        ...p,
                        editableControlsSpec: e.target.value,
                      }))
                    }
                    placeholder="stiffness: 280 (100..500) | damping: 24 (10..60) | borderRadius: 12px (0..28px)"
                    className="mt-2 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-3 font-mono text-xs"
                  />
                </div>
              )}

              {/* GROUP 8: RELATIONSHIPS & PUBLISHING */}
              {activeEditorTab === '8-relationships' && (
                <div className="grid grid-cols-1 gap-4 rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-5 sm:grid-cols-2">
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Related Resources (Comma-separated slugs)
                    </label>
                    <input
                      type="text"
                      value={relatedResourcesInput}
                      onChange={(e) => setRelatedResourcesInput(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Prerequisites (Comma-separated slugs)
                    </label>
                    <input
                      type="text"
                      value={prerequisitesInput}
                      onChange={(e) => setPrerequisitesInput(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Alternatives (Comma-separated slugs)
                    </label>
                    <input
                      type="text"
                      value={alternativesInput}
                      onChange={(e) => setAlternativesInput(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Related Technologies (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={relatedTechInput}
                      onChange={(e) => setRelatedTechInput(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Authoritative Sources & Citations (Required for Check #07)
                    </label>
                    <input
                      type="text"
                      value={editorDraft.sources}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          sources: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Editorial Review Notes
                    </label>
                    <textarea
                      rows={2}
                      value={editorDraft.reviewNotes}
                      onChange={(e) =>
                        setEditorDraft((p) => ({
                          ...p,
                          reviewNotes: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm"
                    />
                  </div>

                  {/* Section 4 Publishing Metadata Readout (Author, Reviewer, Created, Updated, Published, Last Verified) */}
                  <div className="sm:col-span-2 border-t border-[var(--ds-border-subtle)] pt-4">
                    <div className="font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Publishing &amp; Verification Record
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-6 font-mono text-xs tabular-nums">
                      <div className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-2.5">
                        <div className="text-[10px] text-[var(--ds-text-muted)]">
                          AUTHOR
                        </div>
                        <div className="mt-0.5 truncate text-[var(--ds-text-primary)]">
                          {editorDraft.authorName || user.displayName || 'Admin'}
                        </div>
                      </div>
                      <div className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-2.5">
                        <div className="text-[10px] text-[var(--ds-text-muted)]">
                          REVIEWER
                        </div>
                        <div className="mt-0.5 truncate text-[var(--ds-text-primary)]">
                          {editorDraft.reviewerName || 'Pending Review'}
                        </div>
                      </div>
                      <div className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-2.5">
                        <div className="text-[10px] text-[var(--ds-text-muted)]">
                          CREATED DATE
                        </div>
                        <div className="mt-0.5 text-[var(--ds-text-primary)]">
                          {editorDraft.createdAtIso.slice(0, 10)}
                        </div>
                      </div>
                      <div className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-2.5">
                        <div className="text-[10px] text-[var(--ds-text-muted)]">
                          UPDATED DATE
                        </div>
                        <div className="mt-0.5 text-[var(--ds-text-primary)]">
                          {editorDraft.updatedAtIso.slice(0, 10)}
                        </div>
                      </div>
                      <div className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-2.5">
                        <div className="text-[10px] text-[var(--ds-text-muted)]">
                          PUBLISHED DATE
                        </div>
                        <div className="mt-0.5 text-[var(--ds-text-primary)]">
                          {editorDraft.publishedAtIso || 'Unpublished'}
                        </div>
                      </div>
                      <div className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-2.5">
                        <div className="text-[10px] text-[var(--ds-text-muted)]">
                          LAST VERIFIED
                        </div>
                        <div className="mt-0.5 text-[var(--ds-text-primary)]">
                          {editorDraft.lastVerifiedIso.slice(0, 10)}
                        </div>
                      </div>
                    </div>

                    {synchronizedDraft.status === 'published' && (
                      <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs text-emerald-400">
                        <span>
                          This resource is live on the public encyclopedia.
                        </span>
                        <Link
                          href={`/concept/${synchronizedDraft.slug}`}
                          className="font-mono font-semibold underline"
                        >
                          View Public Resource Page (/concept/
                          {synchronizedDraft.slug}) →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===============================================================
           * SECTION 6: CATEGORY MANAGEMENT & MERGE / MIGRATION ENGINE
           * =============================================================== */}
          {activeSection === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--ds-border-subtle)] pb-4">
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-[var(--ds-text-muted)]">
                    TAXONOMY HIERARCHY & MIGRATION GOVERNANCE
                  </div>
                  <h1 className="mt-1 text-xl font-bold">
                    Primary Categories & Nested Subcategory Trees (
                    {effectiveCategories.length})
                  </h1>
                </div>

                {roleCapabilities.canPublishAndManageTaxonomy && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextOrder = effectiveCategories.length + 1;
                      const fresh: CmsCategoryRecord = {
                        slug: `custom-category-${nextOrder}`,
                        code: String(nextOrder).padStart(2, '0'),
                        name: 'New Design Category',
                        shortDescription:
                          'Architectural domain for emerging spatial, adaptive, or design system patterns.',
                        architecturalScope:
                          'Tokens · Spatial Ergonomics · Adaptive Contracts',
                        iconName: 'Sparkles',
                        orderIndex: nextOrder,
                        isFeatured: false,
                        status: 'active',
                        subcategories: [
                          'Foundational Patterns',
                          'Foundational Patterns > Deep Nested Node',
                        ],
                        mergedIntoSlug: '',
                        updatedByUid: user.uid,
                        createdAtIso: new Date().toISOString(),
                        updatedAtIso: new Date().toISOString(),
                      };
                      setEditingCategory(fresh);
                      setCategorySubcatsInput(fresh.subcategories.join('\n'));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ds-accent-primary)] px-3.5 py-2 text-xs font-semibold text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Category</span>
                  </button>
                )}
              </div>

              {/* Category Editor Drawer / Form */}
              {editingCategory && (
                <form
                  onSubmit={handleSaveCategory}
                  className="rounded-lg border border-[var(--ds-accent-primary)] bg-[var(--ds-surface-1)] p-5"
                >
                  <div className="flex items-center justify-between border-b border-[var(--ds-border-subtle)] pb-3">
                    <h2 className="text-sm font-bold">
                      Edit Taxonomy Category: {editingCategory.name}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="text-xs text-[var(--ds-text-muted)]"
                    >
                      Close
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                        Category Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editingCategory.name}
                        onChange={(e) =>
                          setEditingCategory((p) =>
                            p ? { ...p, name: e.target.value } : null
                          )
                        }
                        className="mt-1 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                        Category Slug
                      </label>
                      <input
                        type="text"
                        required
                        value={editingCategory.slug}
                        onChange={(e) =>
                          setEditingCategory((p) =>
                            p
                              ? {
                                  ...p,
                                  slug: sanitizeKebabSlug(e.target.value),
                                }
                              : null
                          )
                        }
                        className="mt-1 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-1.5 font-mono text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                          Code
                        </label>
                        <input
                          type="text"
                          value={editingCategory.code}
                          onChange={(e) =>
                            setEditingCategory((p) =>
                              p ? { ...p, code: e.target.value } : null
                            )
                          }
                          className="mt-1 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-2 py-1.5 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                          Order
                        </label>
                        <input
                          type="number"
                          value={editingCategory.orderIndex}
                          onChange={(e) =>
                            setEditingCategory((p) =>
                              p
                                ? {
                                    ...p,
                                    orderIndex: Number(e.target.value || 1),
                                  }
                                : null
                            )
                          }
                          className="mt-1 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-2 py-1.5 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                          Icon
                        </label>
                        <input
                          type="text"
                          value={editingCategory.iconName}
                          onChange={(e) =>
                            setEditingCategory((p) =>
                              p ? { ...p, iconName: e.target.value } : null
                            )
                          }
                          className="mt-1 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-2 py-1.5 font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                        Short Description
                      </label>
                      <input
                        type="text"
                        value={editingCategory.shortDescription}
                        onChange={(e) =>
                          setEditingCategory((p) =>
                            p
                              ? { ...p, shortDescription: e.target.value }
                              : null
                          )
                        }
                        className="mt-1 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-1.5 text-sm"
                      />
                    </div>

                    <div className="flex items-end gap-4">
                      <label className="inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={editingCategory.isFeatured}
                          onChange={(e) =>
                            setEditingCategory((p) =>
                              p ? { ...p, isFeatured: e.target.checked } : null
                            )
                          }
                        />
                        <span>Featured Category</span>
                      </label>
                      <select
                        value={editingCategory.status}
                        onChange={(e) =>
                          setEditingCategory((p) =>
                            p
                              ? {
                                  ...p,
                                  status: e.target.value as
                                    | 'active'
                                    | 'archived',
                                }
                              : null
                          )
                        }
                        className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-2 py-1.5 text-xs"
                      >
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                        Nested Subcategories (One per line · Use &quot;Parent
                        &gt; Child &gt; Grandchild&quot; for unlimited depth)
                      </label>
                      <textarea
                        rows={4}
                        value={categorySubcatsInput}
                        onChange={(e) =>
                          setCategorySubcatsInput(e.target.value)
                        }
                        className="mt-1 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-2.5 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="rounded border border-[var(--ds-border-subtle)] px-3 py-1.5 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isBusy}
                      className="rounded bg-[var(--ds-accent-primary)] px-4 py-1.5 text-xs font-semibold text-white"
                    >
                      Save Category to CMS
                    </button>
                  </div>
                </form>
              )}

              {/* Category Merge & Resource Migration Tool */}
              {roleCapabilities.canPublishAndManageTaxonomy && (
                <form
                  onSubmit={handleMergeAndMigrateCategories}
                  className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-4"
                >
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase text-[var(--ds-text-primary)]">
                    <GitMerge className="h-4 w-4 text-[var(--ds-accent-primary)]" />
                    <span>
                      Category Merge & Safe Resource Reassignment Process
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--ds-text-secondary)]">
                    Categories containing published resources cannot be deleted
                    without reassignment. Select a source category to archive
                    and a target category to inherit its resources.
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <select
                      value={mergeSourceSlug}
                      onChange={(e) => setMergeSourceSlug(e.target.value)}
                      className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-1.5 text-xs"
                    >
                      <option value="">Select Source Category...</option>
                      {effectiveCategories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.code}. {c.name} ({c.status})
                        </option>
                      ))}
                    </select>
                    <select
                      value={mergeTargetSlug}
                      onChange={(e) => setMergeTargetSlug(e.target.value)}
                      className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-1.5 text-xs"
                    >
                      <option value="">Select Target Category...</option>
                      {effectiveCategories
                        .filter((c) => c.status === 'active')
                        .map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.code}. {c.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="submit"
                      disabled={isBusy}
                      className="rounded bg-[var(--ds-accent-primary)] px-3.5 py-1.5 text-xs font-semibold text-white"
                    >
                      Merge & Migrate Resources
                    </button>
                  </div>
                </form>
              )}

              {/* Categories Table */}
              <div className="overflow-x-auto rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)]">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] font-mono text-[11px] uppercase text-[var(--ds-text-muted)]">
                      <th className="px-3.5 py-2.5">Order / Code</th>
                      <th className="px-3.5 py-2.5">Category & Slug</th>
                      <th className="px-3.5 py-2.5">Subcategories</th>
                      <th className="px-3.5 py-2.5 text-right">Resources</th>
                      <th className="px-3.5 py-2.5 text-right">Status</th>
                      <th className="px-3.5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ds-border-subtle)]">
                    {effectiveCategories.map((cat) => {
                      const resCount = combinedResources.filter(
                        (r) => r.primaryCategory === cat.slug
                      ).length;
                      return (
                        <tr
                          key={cat.slug}
                          className="hover:bg-[var(--ds-surface-2)]"
                        >
                          <td className="px-3.5 py-2.5 font-mono tabular-nums">
                            #{cat.orderIndex} · {cat.code}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="font-semibold text-[var(--ds-text-primary)]">
                              {cat.name}{' '}
                              {cat.isFeatured && (
                                <span className="font-mono text-[10px] text-[var(--ds-accent-primary)]">
                                  · FEATURED
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-[var(--ds-text-muted)]">
                              /taxonomy/{cat.slug}
                              {cat.mergedIntoSlug
                                ? ` → merged into ${cat.mergedIntoSlug}`
                                : ''}
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="font-mono text-[11px] tabular-nums">
                              {cat.subcategories.length} nested nodes
                            </div>
                            <div className="max-w-xs truncate text-[11px] text-[var(--ds-text-muted)]">
                              {cat.subcategories.slice(0, 3).join(' · ')}
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">
                            {resCount}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono uppercase">
                            <span
                              className={
                                cat.status === 'active'
                                  ? 'text-emerald-500'
                                  : 'text-amber-400'
                              }
                            >
                              {cat.status}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              {roleCapabilities.canPublishAndManageTaxonomy && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMoveCategoryOrder(cat, 'up')
                                    }
                                    title="Move Up"
                                    className="rounded border border-[var(--ds-border-subtle)] p-1 hover:border-[var(--ds-accent-primary)]"
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMoveCategoryOrder(cat, 'down')
                                    }
                                    title="Move Down"
                                    className="rounded border border-[var(--ds-border-subtle)] p-1 hover:border-[var(--ds-accent-primary)]"
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCategory(cat);
                                      setCategorySubcatsInput(
                                        cat.subcategories.join('\n')
                                      );
                                    }}
                                    className="rounded border border-[var(--ds-border-subtle)] px-2 py-1 font-mono text-[11px] hover:border-[var(--ds-accent-primary)]"
                                  >
                                    Edit / Subtree
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===============================================================
           * SECTION 8: MODERATED USER SUBMISSIONS & REPORTED RESOURCES
           * =============================================================== */}
          {activeSection === 'submissions' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--ds-border-subtle)] pb-4">
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-[var(--ds-text-muted)]">
                    MODERATED COMMUNITY CONTRIBUTIONS & ISSUE REPORTS
                  </div>
                  <h1 className="mt-1 text-xl font-bold">
                    Submissions Moderation Queue ({cmsSubmissions.length})
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setShowNewSubmissionForm(!showNewSubmissionForm)
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ds-accent-primary)] px-3.5 py-2 text-xs font-semibold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>
                    {showNewSubmissionForm
                      ? 'Hide Submission Form'
                      : 'New Submission / Report'}
                  </span>
                </button>
              </div>

              {showNewSubmissionForm && (
                <form
                  onSubmit={handleCreateSubmission}
                  className="space-y-4 rounded-lg border border-[var(--ds-accent-primary)] bg-[var(--ds-surface-1)] p-5"
                >
                  <h2 className="text-sm font-bold">
                    Submit Resource Proposal, Interactive Demo, or Correction
                    Report
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                        Submission Type
                      </label>
                      <select
                        value={submissionType}
                        onChange={(e) =>
                          setSubmissionType(
                            e.target.value as UserSubmissionType
                          )
                        }
                        className="mt-1 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-1.5 text-xs"
                      >
                        <option value="design-resource">Design Resource</option>
                        <option value="visual-example">Visual Example</option>
                        <option value="interactive-demo">
                          Interactive Demonstration
                        </option>
                        <option value="correction-report">
                          Correction / Issue Report
                        </option>
                        <option value="new-technology">New Technology</option>
                        <option value="related-reference">
                          Related Reference
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                        Target Category
                      </label>
                      <select
                        value={submissionCategorySlug}
                        onChange={(e) =>
                          setSubmissionCategorySlug(e.target.value)
                        }
                        className="mt-1 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-1.5 text-xs"
                      >
                        {effectiveCategories.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.code}. {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                        Target Resource Slug (If Report)
                      </label>
                      <input
                        type="text"
                        value={submissionTargetSlug}
                        onChange={(e) =>
                          setSubmissionTargetSlug(e.target.value)
                        }
                        placeholder="e.g., spring-physics-choreography"
                        className="mt-1 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-1.5 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                        Title
                      </label>
                      <input
                        type="text"
                        required
                        minLength={3}
                        value={submissionTitle}
                        onChange={(e) => setSubmissionTitle(e.target.value)}
                        className="mt-1 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                        Source URL & License Attestation
                      </label>
                      <input
                        type="text"
                        required
                        value={submissionLicense}
                        onChange={(e) => setSubmissionLicense(e.target.value)}
                        className="mt-1 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Summary & Technical Rationale
                    </label>
                    <textarea
                      rows={2}
                      required
                      minLength={10}
                      value={submissionSummary}
                      onChange={(e) => setSubmissionSummary(e.target.value)}
                      className="mt-1 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-2.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase text-[var(--ds-text-muted)]">
                      Proposed Code or Markup Specimen (Inspected as Inert Plain
                      Text During Moderation)
                    </label>
                    <textarea
                      rows={3}
                      value={submissionCode}
                      onChange={(e) => setSubmissionCode(e.target.value)}
                      className="mt-1 w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-2.5 font-mono text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      disabled={isBusy}
                      className="rounded bg-[var(--ds-accent-primary)] px-4 py-1.5 text-xs font-semibold text-white"
                    >
                      Submit to Moderation Queue
                    </button>
                  </div>
                </form>
              )}

              {cmsSubmissions.length === 0 ? (
                <div className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-8 text-center">
                  <div className="text-sm font-semibold">
                    No User Submissions or Issue Reports in Queue
                  </div>
                  <p className="mt-1 text-xs text-[var(--ds-text-secondary)]">
                    All user contributions enter as pending_review and never
                    execute or publish automatically. Click &quot;New Submission
                    / Report&quot; above to test the moderation workflow.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cmsSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ds-border-subtle)] pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold uppercase text-[var(--ds-accent-primary)]">
                            {sub.submissionType}
                          </span>
                          <span>·</span>
                          <span className="font-semibold text-sm">
                            {sub.title}
                          </span>
                        </div>
                        <span className="font-mono text-xs uppercase tabular-nums">
                          {sub.status} · {sub.createdAtIso.slice(0, 10)}
                        </span>
                      </div>

                      <p className="mt-2.5 text-xs leading-relaxed text-[var(--ds-text-secondary)]">
                        {sub.summary}
                      </p>

                      {sub.proposedCodeOrContent && (
                        <pre className="mt-3 max-h-40 overflow-auto rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] p-3 font-mono text-[11px] text-[var(--ds-text-primary)]">
                          {sub.proposedCodeOrContent}
                        </pre>
                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ds-border-subtle)] pt-3 text-xs">
                        <div className="font-mono text-[11px] text-[var(--ds-text-muted)]">
                          Submitter: {sub.submitterName} · Category:{' '}
                          {sub.categorySlug || 'Unassigned'} · License:{' '}
                          {sub.licenseAttestation}
                        </div>

                        {roleCapabilities.canReviewAndApprove && (
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              value={moderationNotesMap[sub.id] ?? ''}
                              onChange={(e) =>
                                setModerationNotesMap((p) => ({
                                  ...p,
                                  [sub.id]: e.target.value,
                                }))
                              }
                              placeholder="Reviewer notes..."
                              className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-2.5 py-1 text-xs"
                            />
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleModerateSubmission(sub, 'approved', true)
                              }
                              className="rounded bg-emerald-600 px-3 py-1 font-semibold text-white hover:bg-emerald-500"
                            >
                              Approve & Convert to CMS Draft
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleModerateSubmission(sub, 'rejected', false)
                              }
                              className="rounded border border-red-500/40 px-3 py-1 text-red-400 hover:bg-red-500/10"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===============================================================
           * SECTION 1 & 7: RBAC ROLE MANAGEMENT & IMMUTABLE AUDIT LOGS
           * =============================================================== */}
          {activeSection === 'roles-audit' && (
            <div className="space-y-6">
              <div className="border-b border-[var(--ds-border-subtle)] pb-4">
                <div className="font-mono text-xs uppercase tracking-wider text-[var(--ds-text-muted)]">
                  ZERO-TRUST RBAC & IMMUTABLE AUDIT LEDGER
                </div>
                <h1 className="mt-1 text-xl font-bold">
                  Server-Verified Administrative Roles & Audit History
                </h1>
              </div>

              {/* Super Admin Role Assignment Form */}
              {roleCapabilities.canManageAdminRoles && (
                <form
                  onSubmit={handleAssignAdminRole}
                  className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)] p-5"
                >
                  <h2 className="text-sm font-bold">
                    Assign or Update Administrative Role (
                    <code className="font-mono text-xs">
                      /admin_roles/&#123;userId&#125;
                    </code>
                    )
                  </h2>
                  <p className="mt-1 text-xs text-[var(--ds-text-secondary)]">
                    Enforced by Firestore Security Rules: only a verified Super
                    Administrator can create or modify role documents.
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <input
                      type="text"
                      required
                      value={newRoleUid}
                      onChange={(e) => setNewRoleUid(e.target.value)}
                      placeholder="Target Firebase Auth UID"
                      className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-1.5 font-mono text-xs"
                    />
                    <input
                      type="email"
                      required
                      value={newRoleEmail}
                      onChange={(e) => setNewRoleEmail(e.target.value)}
                      placeholder="Verified email address"
                      className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="Display name"
                      className="rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-3 py-1.5 text-xs"
                    />
                    <div className="flex gap-2">
                      <select
                        value={newRoleTier}
                        onChange={(e) =>
                          setNewRoleTier(e.target.value as AdminRoleType)
                        }
                        className="w-full rounded border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-2)] px-2.5 py-1.5 text-xs"
                      >
                        <option value="editor">Editor</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="admin">Administrator</option>
                        <option value="super_admin">Super Administrator</option>
                      </select>
                      <button
                        type="submit"
                        disabled={isBusy}
                        className="shrink-0 rounded bg-[var(--ds-accent-primary)] px-3.5 py-1.5 text-xs font-semibold text-white"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Active Admin Role Assignments Table */}
              <div className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)]">
                <div className="border-b border-[var(--ds-border-subtle)] px-4 py-3 text-sm font-semibold">
                  Verified Administrative Identities
                </div>
                <div className="divide-y divide-[var(--ds-border-subtle)] text-xs">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="font-semibold">
                        Project Owner Bootstrap Identity (
                        {BOOTSTRAPPED_SUPER_ADMIN_EMAIL})
                      </div>
                      <div className="font-mono text-[11px] text-[var(--ds-text-muted)]">
                        Verified via request.auth.token.email_verified == true
                        in firestore.rules
                      </div>
                    </div>
                    <span className="font-mono text-xs font-semibold text-emerald-500">
                      SUPER ADMINISTRATOR (ROOT)
                    </span>
                  </div>
                  {adminRolesList.map((r) => (
                    <div
                      key={r.uid}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div>
                        <div className="font-semibold">
                          {r.displayName} ({r.email})
                        </div>
                        <div className="font-mono text-[11px] text-[var(--ds-text-muted)]">
                          UID: {r.uid} · Updated: {r.updatedAtIso.slice(0, 10)}
                        </div>
                      </div>
                      <span className="font-mono text-xs uppercase text-[var(--ds-accent-primary)]">
                        {ADMIN_ROLE_CAPABILITIES[r.role]?.label || r.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immutable Audit Log Stream */}
              <div className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-1)]">
                <div className="flex items-center justify-between border-b border-[var(--ds-border-subtle)] px-4 py-3">
                  <span className="text-sm font-semibold">
                    Immutable CMS Audit Trail (/cms_audit_logs)
                  </span>
                  <span className="font-mono text-xs text-[var(--ds-text-muted)]">
                    allow update, delete: if false;
                  </span>
                </div>
                {cmsAuditLogs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--ds-text-muted)]">
                    No audit events recorded yet. Perform any resource,
                    category, submission, or role action to append an entry.
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--ds-border-subtle)] text-xs">
                    {cmsAuditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
                      >
                        <div>
                          <span className="font-mono font-semibold text-[var(--ds-accent-primary)]">
                            [{log.action}]
                          </span>{' '}
                          <span>{log.summary}</span>
                        </div>
                        <div className="font-mono text-[11px] text-[var(--ds-text-muted)] tabular-nums">
                          {log.actorName} ({log.actorRole}) ·{' '}
                          {log.createdAtIso.slice(0, 19)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
