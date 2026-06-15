import type { Metadata } from "next/types"

import { CollectionArchive } from "@/components/CollectionArchive"
import configPromise from "@payload-config"
import { getPayload } from "payload"
import React from "react"
import { Search } from "@/search/Component"
import PageClient from "./page.client"
import { CardPostData } from "@/components/Card"

type Args = {
  params: Promise<{
    tenant: string
  }>
  searchParams: Promise<{
    q: string
  }>
}
export default async function Page({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { tenant } = await paramsPromise
  const { q: query } = await searchParamsPromise
  const payload = await getPayload({ config: configPromise })

  // Resolve tenant ID
  const tenantDoc = await payload.find({
    collection: "tenants",
    where: {
      or: [{ slug: { equals: tenant } }, { domain: { equals: tenant } }],
    },
    limit: 1,
  })

  const tenantId = tenantDoc.docs[0]?.id

  const conditions: any[] = []
  if (tenantId) {
    conditions.push({ tenant: { equals: tenantId } })
  }

  if (query) {
    conditions.push({
      or: [
        {
          title: {
            like: query,
          },
        },
        {
          "meta.description": {
            like: query,
          },
        },
        {
          "meta.title": {
            like: query,
          },
        },
        {
          slug: {
            like: query,
          },
        },
      ],
    })
  }

  const posts = await payload.find({
    collection: "search",
    depth: 1,
    limit: 12,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
    },
    // pagination: false reduces overhead if you don't need totalDocs
    pagination: false,
    where: conditions.length > 0 ? { and: conditions } : undefined,
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none text-center">
          <h1 className="mb-8 lg:mb-16">Search</h1>

          <div className="max-w-[50rem] mx-auto">
            <Search />
          </div>
        </div>
      </div>

      {posts.totalDocs > 0 ? (
        <CollectionArchive posts={posts.docs as CardPostData[]} />
      ) : (
        <div className="container">No results found.</div>
      )}
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Payload Website Template Search`,
  }
}
