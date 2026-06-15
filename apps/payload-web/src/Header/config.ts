import type { CollectionConfig } from "payload"

import { link } from "@/fields/link"
import { revalidateHeader } from "./hooks/revalidateHeader"

export const Header: CollectionConfig = {
  slug: "header",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "logoImage",
      type: "upload",
      relationTo: "media",
      admin: {
        description:
          "Upload a custom logo image for this tenant header. If not provided, a default logo or text will be used.",
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
          RowLabel: "@/Header/RowLabel#RowLabel",
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
