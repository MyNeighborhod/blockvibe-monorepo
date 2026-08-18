import React from "react"
import { VisualBuilderClient } from "./VisualBuilderClient"

export default async function VisualBuilderPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant } = await params
  return <VisualBuilderClient tenantSlug={tenant || "nog"} />
}
