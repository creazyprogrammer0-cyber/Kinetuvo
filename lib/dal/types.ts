import {
  AdminRoleRecord,
  AdminRoleType,
  CmsAuditLogRecord,
  CmsCategoryRecord,
  CmsDifficultyLevel,
  CmsPreviewType,
  CmsResourceRecord,
  CmsResourceStatus,
  UserSubmissionRecord,
} from '@/lib/admin/cms-types';
import {
  PersonalCollectionRecord,
  PlaygroundExperimentRecord,
  UserBookmarkRecord,
  UserProfileRecord,
} from '@/components/providers/AuthLibraryProvider';

export const CURRENT_RESOURCE_SCHEMA_VERSION = 2;

export type ContentProvenanceOrigin = 'sample-seed' | 'verified-editorial';

export type StorageBucketNamespace =
  | 'resource-thumbnails'
  | 'verified-visual-references'
  | 'user-uploads'
  | 'admin-assets';

export type AllowedStorageExtension =
  | '.png'
  | '.jpg'
  | '.jpeg'
  | '.webp'
  | '.avif'
  | '.svg';

export type AllowedStorageMimeType =
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/avif'
  | 'image/svg+xml';

export interface DalSubcategoryRecord {
  subcategoryId: string;
  slug: string;
  name: string;
  parentCategorySlug: string;
  parentSubcategoryId: string;
  depth: number;
  description: string;
  orderIndex: number;
  status: 'active' | 'archived';
  updatedByUid: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface DalResourceRevisionRecord {
  revisionId: string;
  resourceSlug: string;
  revisionNumber: number;
  schemaVersion: number;
  dataOrigin: ContentProvenanceOrigin;
  title: string;
  status: CmsResourceStatus;
  changeSummary: string;
  snapshotJson: string;
  authorUid: string;
  authorName: string;
  createdAtIso: string;
}

export interface DalResourceExampleRecord {
  exampleId: string;
  resourceSlug: string;
  title: string;
  summary: string;
  previewType: CmsPreviewType;
  codeHtml: string;
  codeCss: string;
  codeJs: string;
  isPublic: boolean;
  authorUid: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface DalImplementationVariantRecord {
  variantId: string;
  resourceSlug: string;
  framework: string;
  language: string;
  title: string;
  codeSnippet: string;
  dependenciesList: string[];
  installCommand: string;
  isPublic: boolean;
  authorUid: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface DalPreviewConfigRecord {
  configId: string;
  resourceSlug: string;
  previewType: CmsPreviewType;
  defaultViewport: 'desktop' | 'tablet' | 'mobile';
  supportedViewports: string[];
  backgroundTheme: 'adaptive' | 'dark' | 'light' | 'grid';
  reducedMotionDefault: boolean;
  sandboxPolicy: string;
  controlsSchemaJson: string;
  isPublic: boolean;
  updatedByUid: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface DalTechnologyRecord {
  slug: string;
  name: string;
  category: string;
  version: string;
  documentationUrl: string;
  description: string;
  status: 'active' | 'deprecated';
  updatedByUid: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface DalTagRecord {
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  usageCount: number;
  status: 'active' | 'archived';
  updatedByUid: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface DalResourceRelationshipRecord {
  relationshipId: string;
  sourceResourceSlug: string;
  targetResourceSlug: string;
  relationType: 'related' | 'prerequisite' | 'alternative' | 'extends';
  notes: string;
  isPublic: boolean;
  updatedByUid: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface DalCollectionItemRecord {
  itemId: string;
  collectionId: string;
  ownerId: string;
  resourceSlug: string;
  resourceTitle: string;
  categorySlug: string;
  orderIndex: number;
  notes: string;
  visibility: 'private' | 'public';
  createdAtIso: string;
}

export interface DalReviewRecord {
  reviewId: string;
  targetType: 'resource' | 'submission';
  targetId: string;
  resourceSlug: string;
  reviewerUid: string;
  reviewerName: string;
  decision: 'approved' | 'rejected' | 'changes_requested';
  notes: string;
  checklistPassedCount: number;
  createdAtIso: string;
}

export interface DalStorageAssetRecord {
  assetId: string;
  bucketNamespace: StorageBucketNamespace;
  ownerUid: string;
  fileName: string;
  fileExtension: AllowedStorageExtension;
  contentType: AllowedStorageMimeType;
  sizeBytes: number;
  url: string;
  associatedResourceSlug: string;
  visibility: 'private' | 'public';
  createdAtIso: string;
}

export interface PaginatedQueryOptions {
  pageSize?: number;
  pageNumber?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pageSize: number;
  pageNumber: number;
  totalFetched: number;
  hasMore: boolean;
  nextCursorId: string | null;
}

export type DalErrorCode =
  | 'connection-failure'
  | 'permission-denied'
  | 'validation-error'
  | 'not-found'
  | 'write-failed'
  | 'concurrent-update'
  | 'unauthenticated'
  | 'search-index-failure';

export interface DalError {
  code: DalErrorCode;
  message: string;
  service: string;
  operation: string;
  collectionPath: string;
  retryable: boolean;
  timestampIso: string;
}

export interface DalResult<T> {
  ok: boolean;
  data: T | null;
  error: DalError | null;
  latencyMs: number;
}

export interface DalObservabilityLogEntry {
  id: string;
  timestampIso: string;
  service: string;
  operation: string;
  collectionPath: string;
  status: 'ok' | 'error' | 'retried';
  latencyMs: number;
  retryCount: number;
  errorCode?: DalErrorCode;
  sanitizedSummary: string;
}

export interface IdempotentMigrationReport {
  executedAtIso: string;
  schemaVersion: number;
  categoriesSeeded: number;
  subcategoriesSeeded: number;
  resourcesSeeded: number;
  revisionsCreated: number;
  previewConfigsSynced: number;
  implementationVariantsSynced: number;
  resourceExamplesSynced: number;
  technologiesSeeded: number;
  tagsSeeded: number;
  relationshipsSynced: number;
  skippedExistingRecords: number;
  upgradedLegacyRecords: number;
}

export interface LiveVerificationCheckResult {
  id: string;
  number: string;
  title: string;
  category:
    | 'persistence'
    | 'user-isolation'
    | 'permissions'
    | 'admin-auth'
    | 'publish-search'
    | 'pagination'
    | 'storage-validation';
  passed: boolean;
  latencyMs: number;
  detail: string;
}

export interface LiveVerificationSuiteReport {
  executedAtIso: string;
  allPassed: boolean;
  passedCount: number;
  totalChecks: number;
  checks: LiveVerificationCheckResult[];
}

export type {
  AdminRoleRecord,
  AdminRoleType,
  CmsAuditLogRecord,
  CmsCategoryRecord,
  CmsDifficultyLevel,
  CmsPreviewType,
  CmsResourceRecord,
  CmsResourceStatus,
  PersonalCollectionRecord,
  PlaygroundExperimentRecord,
  UserBookmarkRecord,
  UserProfileRecord,
  UserSubmissionRecord,
};
