import { revalidateRedirects } from "@/hooks/revalidateRedirects"
import { beforeSyncWithSearch } from "@/search/beforeSync"
import { searchFields } from "@/search/fieldOverrides"
import { formBuilderPlugin } from "@payloadcms/plugin-form-builder"
import { multiTenantPlugin } from "@payloadcms/plugin-multi-tenant"
import { nestedDocsPlugin } from "@payloadcms/plugin-nested-docs"
import { redirectsPlugin } from "@payloadcms/plugin-redirects"
import { searchPlugin } from "@payloadcms/plugin-search"
import { seoPlugin } from "@payloadcms/plugin-seo"
import { GenerateTitle, GenerateURL } from "@payloadcms/plugin-seo/types"
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from "@payloadcms/richtext-lexical"
import { Plugin, Field } from "payload"

import { Page, Post } from "@/payload-types"
import { getServerSideURL } from "@/utilities/getURL"

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | North of Grand` : "North of Grand Neighborhood Association"
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

import { visualBuilderPlugin } from "@blockvibe/payload-plugin-visual-builder"

export const plugins: Plugin[] = [
  visualBuilderPlugin({
    collections: ["pages"],
    enableInlineEditing: true,
  }),
  redirectsPlugin({
    collections: ["pages", "posts"],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ("name" in field && field.name === "from") {
            return {
              ...field,
              admin: {
                description: "You will need to rebuild the website when changing this field.",
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ["categories"],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ""),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false
          return true
        },
      },
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        const fieldsWithConfirmationEditor = defaultFields.map((field) => {
          if ("name" in field && field.name === "confirmationMessage") {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4"] }),
                  ]
                },
              }),
            }
          }
          return field
        })

        const confirmationMessageIndex = fieldsWithConfirmationEditor.findIndex(
          (field) => "name" in field && field.name === "confirmationMessage",
        )

        const confirmationMessageDurationField: Field = {
          name: "confirmationMessageDuration",
          type: "number",
          label: "Confirmation Message Duration",
          defaultValue: 5,
          min: 0,
          admin: {
            condition: (_data, siblingData) => siblingData?.confirmationType === "message",
            description:
              "How long to show the confirmation message before the form reappears (in seconds). Set to 0 to keep the message visible permanently.",
            step: 1,
          },
        }

        if (confirmationMessageIndex === -1) {
          return [...fieldsWithConfirmationEditor, confirmationMessageDurationField]
        }

        return [
          ...fieldsWithConfirmationEditor.slice(0, confirmationMessageIndex + 1),
          confirmationMessageDurationField,
          ...fieldsWithConfirmationEditor.slice(confirmationMessageIndex + 1),
        ]
      },
    },
  }),
  searchPlugin({
    collections: ["posts"],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  // Multi-tenant plugin added by me here:
  multiTenantPlugin({
    tenantsSlug: "tenants",
    collections: {
      pages: {},
      posts: {},
      media: {},
      search: {},
      invites: {},
      broadcasts: {},
      "crm-fields": {},
      "mailing-lists": {},
      businesses: {},
      "business-categories": {},
      "directory-fields": {},
      header: {
        isGlobal: true,
      },
      footer: {
        isGlobal: true,
      },
    },
    useTenantsListFilter: false,
    // only super-admin has access to all tenants
    userHasAccessToAllTenants: (user) => {
      return (user as any)?.role === "superadmin"
    },
    // userHasAccessToAllTenants: () => true,
  }),
]
