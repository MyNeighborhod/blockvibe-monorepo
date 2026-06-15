import { HeaderClient } from "./Component.client"
import { getCachedGlobal, getTenantId, getTenant } from "@/utilities/getGlobals"
import React from "react"

export async function Header() {
  const tenantId = await getTenantId()
  const tenant = await getTenant()
  const headerData = await getCachedGlobal("header", tenantId, 1)()

  if (!headerData) return null

  return <HeaderClient data={headerData} tenant={tenant} />
}
