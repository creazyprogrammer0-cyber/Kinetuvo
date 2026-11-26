/**
 * Zero-Trust Firestore Security Rules Verification Suite (Phase 7 & Phase 8 CMS)
 * Validates that all 12 "Dirty Dozen" adversarial payloads defined in /security_spec.md
 * are rejected by /firestore.rules with PERMISSION_DENIED.
 */

export interface DirtyDozenRuleTestVector {
  id: number;
  name: string;
  title: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  authContext: {
    uid: string | null;
    email?: string;
    emailVerified: boolean;
    assignedRole?: 'super_admin' | 'admin' | 'editor' | 'reviewer' | null;
  };
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
  enforcingRuleGate: string;
  enforcedByRule: string;
}

export const DIRTY_DOZEN_SECURITY_VECTORS: DirtyDozenRuleTestVector[] = [
  {
    id: 1,
    name: 'Self-Assigned Admin Escalation',
    title: 'Self-Assigned Admin Escalation',
    collectionPath: '/admin_roles/attacker_uid',
    operation: 'create',
    authContext: { uid: 'attacker_uid', email: 'attacker@example.com', emailVerified: true, assignedRole: null },
    payload: {
      uid: 'attacker_uid',
      email: 'attacker@example.com',
      displayName: 'Attacker',
      role: 'super_admin',
      assignedByUid: 'attacker_uid',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingRuleGate: 'isSuperAdmin()',
    enforcedByRule: 'isSuperAdmin()',
  },
  {
    id: 2,
    name: 'Unverified Email Spoofing on Root Admin',
    title: 'Unverified Email Spoofing on Root Admin',
    collectionPath: '/admin_roles/victim_uid',
    operation: 'create',
    authContext: { uid: 'spoof_uid', email: 'creazyprogrammer0@gmail.com', emailVerified: false, assignedRole: null },
    payload: {
      uid: 'victim_uid',
      email: 'victim@example.com',
      displayName: 'Victim',
      role: 'admin',
      assignedByUid: 'spoof_uid',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingRuleGate: 'isVerifiedUser() && request.auth.token.email_verified == true',
    enforcedByRule: 'isVerifiedUser() && request.auth.token.email_verified == true',
  },
  {
    id: 3,
    name: 'Shadow Role Field Injection in User Profile',
    title: 'Shadow Role Field Injection in User Profile',
    collectionPath: '/users/user_123',
    operation: 'create',
    authContext: { uid: 'user_123', email: 'user@example.com', emailVerified: true, assignedRole: null },
    payload: {
      uid: 'user_123',
      email: 'user@example.com',
      displayName: 'Standard User',
      role: 'super_admin',
      isAdmin: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingRuleGate: 'isValidUserProfile(incoming()) -> data.keys().hasOnly([...])',
    enforcedByRule: 'isValidUserProfile(incoming()) -> data.keys().hasOnly([...])',
  },
  {
    id: 4,
    name: 'Editor Direct Publish Bypass',
    title: 'Editor Direct Publish Bypass',
    collectionPath: '/cms_resources/spring-button',
    operation: 'update',
    authContext: { uid: 'editor_uid', email: 'editor@example.com', emailVerified: true, assignedRole: 'editor' },
    payload: {
      slug: 'spring-button',
      status: 'published',
      previewVerified: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingRuleGate: 'isAdminOrAbove() required for status == "published"',
    enforcedByRule: 'isAdminOrAbove() required for status == "published"',
  },
  {
    id: 5,
    name: 'Unverified Preview Publish Bypass',
    title: 'Unverified Preview Publish Bypass',
    collectionPath: '/cms_resources/broken-demo',
    operation: 'update',
    authContext: { uid: 'admin_uid', email: 'creazyprogrammer0@gmail.com', emailVerified: true, assignedRole: 'super_admin' },
    payload: {
      slug: 'broken-demo',
      status: 'published',
      previewVerified: false,
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingRuleGate: 'passesPublishValidationGate(incoming()) -> data.previewVerified == true',
    enforcedByRule: 'passesPublishValidationGate(incoming()) -> data.previewVerified == true',
  },
  {
    id: 6,
    name: 'Slug Mismatch Injection',
    title: 'Slug Mismatch Injection',
    collectionPath: '/cms_resources/slug-a',
    operation: 'create',
    authContext: { uid: 'admin_uid', email: 'creazyprogrammer0@gmail.com', emailVerified: true, assignedRole: 'super_admin' },
    payload: {
      slug: 'slug-b',
      status: 'draft',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingRuleGate: 'incoming().slug == resourceSlug',
    enforcedByRule: 'incoming().slug == resourceSlug',
  },
  {
    id: 7,
    name: 'Auto-Approved User Submission Bypass',
    title: 'Auto-Approved User Submission Bypass',
    collectionPath: '/cms_submissions/sub_1',
    operation: 'create',
    authContext: { uid: 'user_123', email: 'user@example.com', emailVerified: true, assignedRole: null },
    payload: {
      submitterUid: 'user_123',
      status: 'approved',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingRuleGate: 'incoming().status == "pending_review"',
    enforcedByRule: 'incoming().status == "pending_review"',
  },
  {
    id: 8,
    name: 'Immutable Audit Log Tampering / Deletion',
    title: 'Immutable Audit Log Tampering / Deletion',
    collectionPath: '/cms_audit_logs/log_1',
    operation: 'delete',
    authContext: { uid: 'admin_uid', email: 'creazyprogrammer0@gmail.com', emailVerified: true, assignedRole: 'super_admin' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingRuleGate: 'allow update, delete: if false;',
    enforcedByRule: 'allow update, delete: if false;',
  },
  {
    id: 9,
    name: 'PII Cross-Tenant Read on User Profile',
    title: 'PII Cross-Tenant Read on User Profile',
    collectionPath: '/users/victim_uid',
    operation: 'get',
    authContext: { uid: 'attacker_uid', email: 'attacker@example.com', emailVerified: true, assignedRole: null },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingRuleGate: 'isOwner(userId)',
    enforcedByRule: 'isOwner(userId)',
  },
  {
    id: 10,
    name: 'Denial-of-Wallet Oversized Code Buffer (>25KB)',
    title: 'Denial-of-Wallet Oversized Code Buffer (>25KB)',
    collectionPath: '/cms_resources/huge-doc',
    operation: 'create',
    authContext: { uid: 'admin_uid', email: 'creazyprogrammer0@gmail.com', emailVerified: true, assignedRole: 'super_admin' },
    payload: {
      slug: 'huge-doc',
      codeJs: 'x'.repeat(30000),
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingRuleGate: 'data.codeJs.size() <= 25000',
    enforcedByRule: 'data.codeJs.size() <= 25000',
  },
  {
    id: 11,
    name: 'Draft Resource Scraping by Public Visitor',
    title: 'Draft Resource Scraping by Public Visitor',
    collectionPath: '/cms_resources/secret-draft',
    operation: 'get',
    authContext: { uid: null, emailVerified: false, assignedRole: null },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingRuleGate: 'existing().status == "published" || isEditorOrAbove()',
    enforcedByRule: 'existing().status == "published" || isEditorOrAbove()',
  },
  {
    id: 12,
    name: 'Category Deletion by Non-Admin Editor',
    title: 'Category Deletion by Non-Admin Editor',
    collectionPath: '/cms_categories/01-design-fundamentals',
    operation: 'delete',
    authContext: { uid: 'editor_uid', email: 'editor@example.com', emailVerified: true, assignedRole: 'editor' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingRuleGate: 'isAdminOrAbove()',
    enforcedByRule: 'isAdminOrAbove()',
  },
];

export const DIRTY_DOZEN_SECURITY_TESTS = DIRTY_DOZEN_SECURITY_VECTORS;
