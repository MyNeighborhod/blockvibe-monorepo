# How Roles and Access Control Work

This document describes the Role-Based Access Control (RBAC) and User Staging (Approval) system implemented in our Payload CMS multi-tenant application.

---

## 1. Overview of Roles

The system defines four distinct roles, ordered by level of privilege:

| Role | Access Level | Description |
| :--- | :--- | :--- |
| **Super Admin** (`superadmin`) | Global | Sees and manages all tenants, all users, all pages, and all posts. Bypass all tenant scoping restrictions. |
| **Tenant Admin** (`admin`) | Tenant-Scoped | Fully manages content (pages, posts, media) and users *only* within their assigned tenant(s). Can approve or reject pending users. |
| **Editor** (`editor`) | Tenant-Scoped | Can write, edit, and publish posts, pages, and media within their assigned tenant(s). Cannot manage users or change roles. |
| **Contributor** (`contributor`) | Tenant-Scoped | Can add new posts and edit/update their *own* posts or posts they are explicitly assigned to. Can login but cannot manage pages, delete files, or edit others' posts. |

---

## 2. User Registration and the Staging Area

To ensure only authorized personnel can access the administration panels and manage content, the system enforces an approval workflow:

1. **Self-Registration (Sign up)**: 
   - When a new user registers on a tenant's site, they are created with:
     - `status`: `'pending'` (placed in the **Staging Area**)
     - `role`: `'contributor'` (default lowest privilege)
     - `tenants`: Associated automatically with the active tenant based on the request host/origin.
2. **Staging Area Restricted Access**:
   - Users with a `'pending'` or `'rejected'` status are **blocked from logging into the Admin UI** and cannot read or write any API endpoints (except for basic registration).
3. **Admin Approval**:
   - A **Tenant Admin** (assigned to the same tenant) or **Super Admin** can view the staging area by filtering the Users collection for `status: "pending"`.
   - The Admin can update the user's status to `'approved'` or `'rejected'` and assign them an appropriate role (`admin`, `editor`, or `contributor`).
   - Once approved, the user can log into the Admin panel and access resources scoped to their tenant.

---

## 3. Scoped Permissions matrix

### Users Collection
- **Super Admin**: Full CRUD on all users.
- **Tenant Admin**: Can view, create, update, and delete users associated with the same tenant. Cannot view/edit Super Admins or promote users to Super Admin.
- **Editor / Contributor**: Can only read and update their own profile (e.g. change name, password). Cannot modify their own roles, status, or tenant associations.

### Tenants Collection
- **Super Admin**: Full CRUD.
- **Tenant Admin / Editor / Contributor**: Read-only (needed to render UI options).

### Pages and Media Collections
- **Super Admin**: Full CRUD on all documents across all tenants.
- **Tenant Admin / Editor**: Full CRUD on documents belonging to their tenant(s).
- **Contributor**: Read-only access to pages. No delete permissions on media.

### Posts Collection
- **Super Admin**: Full CRUD on all posts.
- **Tenant Admin / Editor**: Full CRUD on posts scoped to their tenant(s).
- **Contributor**:
  - Can read all posts scoped to their tenant.
  - Can create new posts (tenant is automatically set to their tenant, and they are marked as the author).
  - Can update a post *only* if:
    1. It belongs to their tenant, AND
    2. They are the **author** of the post, OR they are listed as a **Contributing Editor**.
  - Can delete a post *only* if they are the author.

---

## 4. Contributing Editors Feature

Each post includes a `contributingEditors` field (a multi-select relationship linking to `Users`).
- Admins and Editors can assign one or more Users as contributing editors.
- Users listed in `contributingEditors` gain update permissions on the post, even if they are a **Contributor** and not the original author.
- The selection list is automatically filtered to show only users belonging to the active tenant.
