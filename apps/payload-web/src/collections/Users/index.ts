import type { CollectionConfig } from "payload"

import { isApproved, usersRead, usersCreate, usersUpdate, usersDelete } from "../../access/roles"
import { usersBeforeChangeHook } from "./beforeChange"
import { getServerSideURL } from "../../utilities/getURL"

const useSecureCookies = getServerSideURL().startsWith("https://")

export const Users: CollectionConfig = {
  slug: "users",
  access: {
    admin: ({ req: { user } }) =>
      isApproved(user) &&
      ((user as any)?.role === "superadmin" ||
        (user as any)?.role === "admin" ||
        (user as any)?.role === "editor"),
    create: usersCreate,
    delete: usersDelete,
    read: usersRead,
    update: usersUpdate,
  },
  admin: {
    defaultColumns: ["name", "email", "role", "status"],
    useAsTitle: "name",
  },
  auth: {
    cookies: {
      secure: useSecureCookies,
      sameSite: "Lax",
    },
  },
  hooks: {
    beforeChange: [usersBeforeChangeHook],
  },
  fields: [
    {
      name: "accountId",
      type: "text",
      unique: true,
      index: true,
      admin: {
        description: "Immutable ULID account identifier used for CRM, email, and payment services.",
        readOnly: true,
      },
    },
    {
      name: "name",
      type: "text",
    },
    {
      name: "role",
      type: "select",
      defaultValue: "neighbor",
      options: [
        { label: "Super Admin", value: "superadmin" },
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Contributor", value: "contributor" },
        { label: "Neighbor Member", value: "neighbor" },
      ],
      admin: {
        description: "Access level control for user permissions.",
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "approved",
      options: [
        { label: "Pending Approval", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
      ],
      admin: {
        description: "Approval status for registration staging area.",
      },
    },
    {
      name: "isNeighbor",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description: "Designates whether the user is a resident neighbor of the community.",
      },
    },
    {
      name: "household",
      type: "text",
      admin: {
        description: "The household this user belongs to.",
      },
    },
    {
      name: "unsubscribed",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Checked if the user opted out of neighborhood emails.",
      },
    },
    {
      name: "memberType",
      type: "select",
      defaultValue: "residential",
      options: [
        { label: "Residential Member", value: "residential" },
        { label: "Business Member", value: "business" },
        { label: "Other", value: "other" },
      ],
      admin: {
        description: "The primary type of community member.",
      },
    },
    {
      name: "membershipExpiresAt",
      type: "date",
      admin: {
        description: "Yearly expiration date for member annual dues.",
      },
    },
    {
      name: "membershipStatus",
      type: "select",
      defaultValue: "none",
      options: [
        { label: "Active", value: "active" },
        { label: "Expired", value: "expired" },
        { label: "None / Unpaid", value: "none" },
      ],
      admin: {
        description: "Active status of user annual membership dues.",
      },
    },
    {
      name: "membershipTier",
      type: "text",
      admin: {
        description: "Active tier (e.g., individual, household, local-sponsor).",
      },
    },
    {
      name: "customAttributes",
      type: "json",
      admin: {
        description: "Dynamic custom attributes defined for this resident.",
      },
    },
  ],
  timestamps: true,
}
