import React from "react"
import PageTemplate, { generateMetadata as originalGenerateMetadata } from "./[slug]/page"

type Args = {
  params: Promise<{
    tenant: string
  }>
}

export default async function Page(props: Args) {
  const params = await props.params
  return <PageTemplate params={Promise.resolve({ ...params, slug: "home" })} />
}

export async function generateMetadata(props: Args) {
  const params = await props.params
  return originalGenerateMetadata({ params: Promise.resolve({ ...params, slug: "home" }) })
}
