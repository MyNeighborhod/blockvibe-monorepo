import { type CollectionConfig } from "payload"
import {
  DEFAULT_DIRECTORY_FIELD_CONFIG,
  DIRECTORY_CORE_FIELD_OPTIONS,
} from "../../directory/constants"

export const Tenants: CollectionConfig = {
  slug: "tenants",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "domain", "enableBusinessDirectory"],
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
    {
      name: "emailDeliveryDefault",
      type: "select",
      defaultValue: "ses",
      options: [
        { label: "Platform SES", value: "ses" },
        { label: "Neighborhood Gmail", value: "gmail" },
      ],
      admin: {
        description: "Default delivery channel for Email Broadcaster.",
      },
    },
    {
      name: "transactionalEmailFrom",
      type: "email",
      admin: {
        description:
          "From address for transactional email (password reset, receipts, invites). Must be verified in SES.",
      },
    },
    {
      name: "transactionalEmailFromName",
      type: "text",
      admin: {
        description: "Display name for transactional email From header.",
      },
    },
    {
      type: "collapsible",
      label: "Business Directory",
      admin: {
        initCollapsed: false,
        description: "Enable a public local business directory for this neighborhood.",
      },
      fields: [
        {
          name: "enableBusinessDirectory",
          type: "checkbox",
          defaultValue: false,
          label: "Enable Directory feature",
          admin: {
            description:
              "When enabled, the public /businesses page, CRM Local Businesses tab, and optional nav link become available.",
          },
        },
        {
          name: "directorySettings",
          type: "group",
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enableBusinessDirectory),
          },
          fields: [
            {
              name: "pageTitle",
              type: "text",
              defaultValue: "Businesses",
              admin: {
                description: "Heading on the public directory page.",
              },
            },
            {
              name: "pageIntro",
              type: "textarea",
              admin: {
                description: "Short supporting sentence under the heading.",
              },
            },
            {
              name: "allowPublicRegistration",
              type: "checkbox",
              defaultValue: true,
              label: "Allow public “Add Your Business” submissions",
            },
            {
              name: "showInNav",
              type: "checkbox",
              defaultValue: true,
              label: "Show Businesses link in site navigation",
              admin: {
                description:
                  "Injects a Businesses link when the CMS header does not already include one.",
              },
            },
            {
              name: "fieldConfig",
              type: "array",
              labels: {
                singular: "Core Field",
                plural: "Core Field Configuration",
              },
              admin: {
                description:
                  "Turn core directory fields on/off and choose where they appear. Custom fields are managed under Directory Fields.",
                initCollapsed: true,
              },
              defaultValue: DEFAULT_DIRECTORY_FIELD_CONFIG,
              fields: [
                {
                  name: "fieldKey",
                  type: "select",
                  required: true,
                  options: DIRECTORY_CORE_FIELD_OPTIONS,
                },
                {
                  name: "label",
                  type: "text",
                  admin: {
                    description: "Optional display label override.",
                  },
                },
                {
                  name: "enabled",
                  type: "checkbox",
                  defaultValue: true,
                },
                {
                  name: "required",
                  type: "checkbox",
                  defaultValue: false,
                },
                {
                  name: "showOnCard",
                  type: "checkbox",
                  defaultValue: true,
                  label: "Show on card",
                },
                {
                  name: "showOnDetail",
                  type: "checkbox",
                  defaultValue: true,
                  label: "Show on detail",
                },
                {
                  name: "showInRegistration",
                  type: "checkbox",
                  defaultValue: true,
                  label: "Show on registration form",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
