# Zero-Trust Firestore Security Architecture Specification (Phase 7 & Phase 8 CMS)

## 1. Data Invariants & Master Source of Truth

1. **Default-Deny Catch-All**: Every path not explicitly matched under `/databases/{database}/documents` is unconditionally denied (`allow read, write: if false;`).
2. **Backend-Verified Administrative Roles (`/admin_roles/{userId}`)**:
   - Administrative privilege is **never** derived from `/users/{userId}`, client-side state, URL parameters, or unverified email tokens.
   - Root Super Administrator identity (`isBootstrappedSuperAdmin()`) requires `isVerifiedUser() && request.auth.token.email == 'creazyprogrammer0@gmail.com'`.
   - Delegated administrative roles (`super_admin`, `admin`, `editor`, `reviewer`) are stored in `/admin_roles/{userId}` and can ONLY be created, updated, or deleted by `isSuperAdmin()`.
   - Role hierarchy helpers:
     - `isSuperAdmin()`: `isBootstrappedSuperAdmin() || hasAssignedRole(['super_admin'])`
     - `isAdminOrAbove()`: `isBootstrappedSuperAdmin() || hasAssignedRole(['super_admin', 'admin'])`
     - `isReviewerOrAbove()`: `isBootstrappedSuperAdmin() || hasAssignedRole(['super_admin', 'admin', 'reviewer'])`
     - `isEditorOrAbove()`: `isBootstrappedSuperAdmin() || hasAssignedRole(['super_admin', 'admin', 'reviewer', 'editor'])`
3. **PII Isolation (`/users/{userId}`)**:
   - User profile documents contain PII (`email`) and workspace preferences. They are strictly isolated to the authenticated, email-verified owner (`request.auth.uid == userId && request.auth.token.email_verified == true`) and contain zero role or privilege fields.
4. **CMS Resource Lifecycle & Preview Validation Gate (`/cms_resources/{resourceSlug}`)**:
   - Document ID `{resourceSlug}` must match `incoming().slug` (kebab-case `^[a-z0-9-]+$`) to prevent duplicate slugs.
   - Public visitors can read (`get`, `list`) resources where `existing().status == 'published'`.
   - Authenticated Editors, Reviewers, and Administrators (`isEditorOrAbove()`) can read resources in any status (`draft`, `in_review`, `approved`, `published`, `rejected`, `archived`).
   - **Publishing Invariant**: Transitioning a resource to `status == 'published'` requires `isAdminOrAbove()` AND `incoming().previewVerified == true`, `incoming().title.size() >= 3`, `incoming().primaryCategory.size() >= 2`, `incoming().conceptExplanation.size() >= 20`, `incoming().license.size() >= 2`, and `(incoming().codeHtml.size() >= 10 || incoming().codeJs.size() >= 10)`.
   - **Approval Invariant**: Transitioning a resource to `status == 'approved'` or `status == 'rejected'` requires `isReviewerOrAbove()`.
   - **Deletion Invariant**: Deleting a CMS resource requires `isAdminOrAbove()`.
5. **CMS Taxonomy Categories (`/cms_categories/{categorySlug}`)**:
   - Publicly readable if `existing().status == 'active' || existing().status == 'archived'`.
   - Only `isAdminOrAbove()` can create, update, or delete categories.
6. **Moderated User Submissions (`/cms_submissions/{submissionId}`)**:
   - Any verified user (`isVerifiedUser()`) can submit a contribution or issue report only if `incoming().submitterUid == request.auth.uid` and `incoming().status == 'pending_review'`.
   - Submissions never auto-publish. Only `isReviewerOrAbove()` can update moderation status (`approved`, `rejected`) or reviewer notes.
7. **Immutable Audit Logs (`/cms_audit_logs/{logId}`)**:
   - Append-only log entries created by `isEditorOrAbove()` with `incoming().actorUid == request.auth.uid` and `incoming().createdAt == request.time`.
   - `allow update, delete: if false;` guarantees audit history cannot be altered or erased.

---

## 2. The "Dirty Dozen" Adversarial Payloads

| # | Attack Vector | Target Path | Malicious Payload Summary | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Self-Assigned Admin Escalation** | `/admin_roles/attacker_uid` | Standard user attempts to create `{ uid: "attacker_uid", role: "super_admin" }` | `PERMISSION_DENIED` |
| 2 | **Unverified Email Spoofing on Root Admin** | `/admin_roles/victim_uid` | Token has `email: "creazyprogrammer0@gmail.com"` but `email_verified: false` | `PERMISSION_DENIED` |
| 3 | **Shadow Role Field in User Profile** | `/users/user_123` | Valid profile + `{ "role": "super_admin", "isAdmin": true }` | `PERMISSION_DENIED` |
| 4 | **Editor Direct Publish Bypass** | `/cms_resources/spring-button` | User with `editor` role attempts to set `status: "published"` without Admin approval | `PERMISSION_DENIED` |
| 5 | **Unverified Preview Publish Bypass** | `/cms_resources/broken-demo` | Admin attempts to set `status: "published"` with `previewVerified: false` | `PERMISSION_DENIED` |
| 6 | **Slug Mismatch Injection** | `/cms_resources/slug-a` | Payload has `slug: "slug-b"` violating document ID parity | `PERMISSION_DENIED` |
| 7 | **Auto-Approved User Submission** | `/cms_submissions/sub_1` | User submits contribution with `status: "approved"` instead of `"pending_review"` | `PERMISSION_DENIED` |
| 8 | **Audit Log Tampering / Deletion** | `/cms_audit_logs/log_1` | Admin or Editor attempts to update or delete an existing audit log entry | `PERMISSION_DENIED` |
| 9 | **PII Cross-Tenant Read** | `/users/victim_uid` | Authenticated user `attacker_uid` attempts `get` on `/users/victim_uid` | `PERMISSION_DENIED` |
| 10 | **Denial-of-Wallet 1MB Code Buffer** | `/cms_resources/huge-doc` | `codeJs` contains 100,000 characters (`> 25000` limit) | `PERMISSION_DENIED` |
| 11 | **Draft Resource Scraping by Public Visitor** | `/cms_resources/secret-draft` | Unauthenticated user attempts `get` on a resource with `status: "draft"` | `PERMISSION_DENIED` |
| 12 | **Category Mutation by Non-Admin Editor** | `/cms_categories/01-design-fundamentals` | User with `editor` role attempts to delete or merge a primary category | `PERMISSION_DENIED` |
