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
      name: "name",
      type: "text",
    },
    {
      name: "role",
      type: "select",
      defaultValue: "contributor",
      options: [
        { label: "Super Admin", value: "superadmin" },
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Contributor", value: "contributor" },
      ],
      admin: {
        description: "Access level control for user permissions.",
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "pending",
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
  ],
  timestamps: true,
}
