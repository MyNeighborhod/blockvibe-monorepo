import { type CollectionConfig } from "payload"

export const Tenants: CollectionConfig = {
  slug: "tenants",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "domain"],
  },
  access: {
    // Modify these access controls based on your roles/permissions
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: 'Unique identifier used for subdomains or URL routing (e.g., "tenant-a").',
      },
    },
    {
      name: "domain",
      type: "text",
      unique: true,
      admin: {
        description: 'Custom domain mapped to this tenant (e.g., "tenant-a.com").',
      },
    },
    {
      name: "template",
      type: "select",
      defaultValue: "light",
      options: [
        { label: "Light Theme", value: "light" },
        { label: "Dark Theme", value: "dark" },
        { label: "System Preference (Auto)", value: "auto" },
      ],
      admin: {
        description: "Visual template layout for this tenant.",
      },
    },
    {
      name: "organizationLegalName",
      type: "text",
      admin: {
        description: "Official legal entity name for receipts (e.g., North of Grand Neighborhood Association).",
      },
    },
    {
      name: "is501c3",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Check if this tenant is a registered 501(c)(3) tax-exempt organization.",
      },
    },
  ],
}
