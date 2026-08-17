import type { CollectionConfig } from "payload"

import { link } from "@/fields/link"
import { revalidateFooter } from "./hooks/revalidateFooter"

export const Footer: CollectionConfig = {
  slug: "footer",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "logoImage",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Upload a custom logo/wordmark image for this tenant footer.",
      },
    },
    {
      name: "navItems",
      type: "array",
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: "@/Footer/RowLabel#RowLabel",
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
