## Issue #8 — Administrator User Management: Implementation Summary

### Endpoints implemented
- GET `/api/admin/users` - List users with optional search/role filters (Requires Administrator)
- POST `/api/admin/users` - Create a new user account (Requires Administrator)
- PATCH `/api/admin/users/:id` - Update user details (Requires Administrator)
- POST `/api/admin/users/:id/reset-password` - Reset a user's initial password (Requires Administrator)

### Files created
- `server/src/routes/adminUsers.ts`
- `server/tests/lab-03/users-admin.api.test.ts`
- `client/src/components/UserManagement.tsx`
- `client/src/tests/lab-03/UserManagement.test.tsx`

### Files modified
- `server/src/app.ts` - Mounted the `adminUsersRouter` on `/api/admin/users` protected by `requireAuth` and `requireRole(["Administrator"])`.
- `client/src/App.tsx` - Added `#admin/users` route and navigation links for Administrators.

### Safety rules implemented and where
- **Self-deactivation block**: Enforced in `server/src/routes/adminUsers.ts` (lines 121-123). Rejects request if the `req.user.id` equals `req.params.id` and `isActive` is set to `false`.
- **Last-admin block**: Enforced in `server/src/routes/adminUsers.ts` (lines 126-138). Counts active administrators before allowing role change or deactivation of an existing active Administrator.
- **Single-role enforcement**: Implicitly handled via payload acceptance in `server/src/routes/adminUsers.ts` where it maps directly to `User` role. A user can only hold one role as defined by the `Role` enum.
- **Duplicate-email check**: Handled via Prisma `findUnique` check on email before creation/update in `server/src/routes/adminUsers.ts`.

### Tests
- `server/tests/lab-03/users-admin.api.test.ts`
  - Access Control
    - should return 401 for unauthenticated
    - should return 403 for non-Administrators
  - GET /api/admin/users
    - should list users with optional filters
  - POST /api/admin/users
    - should create user and set mustChangePassword
    - should reject duplicate email
    - should reject invalid role
  - PATCH /api/admin/users/:id
    - should update basic fields (one role enforcement is implicit via schema enum mapping)
    - should block self-deactivation
    - should block deactivating the last active admin
  - POST /api/admin/users/:id/reset-password
    - should reset password and set mustChangePassword
  - Pass/Fail Status: 10 passed, 0 failed.

- `client/src/tests/lab-03/UserManagement.test.tsx`
  - renders list of users successfully
  - handles search and role filtering
  - handles forbidden error state gracefully
  - creates a new user successfully
  - edits a user and resets password
  - Pass/Fail Status: 5 passed, 0 failed.

Terminal Output Snippets:
```
 ✓ tests/lab-03/users-admin.api.test.ts (10 tests) 391ms
 Test Files  1 passed (1)
      Tests  10 passed (10)
```
```
 ✓ src/tests/lab-03/UserManagement.test.tsx (5 tests) 238ms
 Test Files  1 passed (1)
      Tests  5 passed (5)
```

### Known gaps / assumptions
- For role mapping, the UI sends "IT_Staff" or "IT Staff", so I manually handled parsing it to "IT_Staff" to ensure Prisma doesn't throw a validation error.
- Pagination was excluded per the specification, but the API response matches the shape specified in `docs/lab-03/api-spec.md` with a dummy pagination object.
