import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { isDefaultNogTenant } from "@/utilities/resolveTenantSlug"
import {
  businessDetailPath,
  cardMediaPresentation,
  categoryTitlesOf,
  cn,
  mapsDirectionsUrl,
  normalizeSocialUrl,
  type DirectoryBusiness,
} from "@/directory/businessMedia"
import {
  isFieldEnabled,
  resolveFieldConfig,
  type DirectoryCoreFieldKey,
} from "@/directory/constants"

type Args = {
  params: Promise<{
    tenant: string
    slug: string
  }>
}

async function resolveTenant(tenantSlug: string) {
  const payload = await getPayload({ config: configPromise })
  let tenantDoc = await payload.find({
    collection: "tenants",
    where: {
      or: [{ slug: { equals: tenantSlug } }, { domain: { equals: tenantSlug } }],
    },
    limit: 1,
  })

  if (tenantDoc.docs.length === 0 && isDefaultNogTenant(tenantSlug)) {
    tenantDoc = await payload.find({
      collection: "tenants",
      where: { slug: { equals: "nog" } },
      limit: 1,
    })
  }

  return { payload, tenant: tenantDoc.docs[0] }
}

export async function generateMetadata({ params: paramsPromise }: Args) {
  const { tenant: tenantSlug, slug } = await paramsPromise
  const { payload, tenant } = await resolveTenant(tenantSlug)
  if (!tenant || !(tenant as any).enableBusinessDirectory) {
    return { title: "Business" }
  }

  const found = await payload.find({
    collection: "businesses",
    where: {
      and: [
        { tenant: { equals: tenant.id } },
        { slug: { equals: slug } },
        { appearOnNOG: { equals: true } },
      ],
    },
    limit: 1,
    depth: 0,
  })
  const biz = found.docs[0]
  if (!biz) return { title: "Business" }
  return {
    title: `${biz.name} | ${tenant.name || "Businesses"}`,
    description: biz.about || undefined,
  }
}

export default async function BusinessDetailPage({ params: paramsPromise }: Args) {
  const { tenant: tenantSlug, slug } = await paramsPromise
  const { payload, tenant } = await resolveTenant(tenantSlug)
  if (!tenant || !(tenant as any).enableBusinessDirectory) {
    notFound()
  }

  const isNog = tenant.slug === "nog" || tenant.slug === "default" || isDefaultNogTenant(tenantSlug)
  const fieldMap = resolveFieldConfig((tenant as any).directorySettings?.fieldConfig)
  const show = (key: DirectoryCoreFieldKey) =>
    isFieldEnabled(fieldMap, key) && fieldMap.get(key)?.showOnDetail !== false

  const found = await payload.find({
    collection: "businesses",
    where: {
      and: [
        { tenant: { equals: tenant.id } },
        { slug: { equals: slug } },
        { appearOnNOG: { equals: true } },
      ],
    },
    limit: 1,
    depth: 1,
  })

  const business = found.docs[0] as DirectoryBusiness | undefined
  if (!business) {
    notFound()
  }

  const siblings = await payload.find({
    collection: "businesses",
    where: {
      and: [{ tenant: { equals: tenant.id } }, { appearOnNOG: { equals: true } }],
    },
    sort: "name",
    limit: 500,
    depth: 0,
  })

  const list = siblings.docs.filter((d: any) => d.slug) as DirectoryBusiness[]
  const idx = list.findIndex((d) => d.id === business.id)
  const prev = idx > 0 ? list[idx - 1] : null
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null

  const media = cardMediaPresentation(business)
  const cats = categoryTitlesOf(business)
  const accent = isNog ? "text-[#76b3b8]" : "text-primary"

  return (
    <div
      className={cn(
        "min-h-screen",
        isNog &&
          "bg-[radial-gradient(ellipse_at_top,_rgba(118,179,184,0.14)_0%,_transparent_55%),linear-gradient(to_bottom,#fafbfa,#f3f6f5)]",
      )}
    >
      <div className="container max-w-4xl py-10 md:py-14">
        <Link
          href="/businesses"
          className={cn(
            "inline-flex items-center gap-1.5 text-sm font-semibold mb-8 hover:underline",
            accent,
          )}
        >
          ← All businesses
        </Link>

        <div
          className={cn(
            "overflow-hidden rounded-3xl border bg-card/95 shadow-sm",
            isNog ? "border-[#d5e3e0]" : "border-border/70",
          )}
        >
          <div
            className={cn(
              "relative overflow-hidden",
              media.mode === "photo" ? "aspect-[21/9] bg-muted" : "aspect-[2.4/1]",
              media.mode === "logo" && (isNog ? "bg-[#eef6f5]" : "bg-muted/50"),
              media.mode === "monogram" && (isNog ? "bg-[#e8f3f2]" : "bg-muted"),
            )}
          >
            {media.mode === "photo" && media.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.photoUrl} alt="" className="h-full w-full object-cover" />
            )}
            {media.mode === "logo" && media.logoUrl && (
              <div className="absolute inset-0 flex items-center justify-center p-10 md:p-14">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={media.logoUrl}
                  alt=""
                  className="max-h-full max-w-[50%] object-contain drop-shadow-sm"
                />
              </div>
            )}
            {media.mode === "monogram" && (
              <div
                className={cn(
                  "flex h-full w-full items-center justify-center text-6xl font-serif",
                  isNog ? "text-[#76b3b8]" : "text-muted-foreground",
                )}
              >
                {business.name.charAt(0)}
              </div>
            )}
            {media.mode === "photo" && media.logoUrl && (
              <div className="absolute bottom-4 left-4 h-16 w-16 rounded-xl border border-white/80 bg-white p-1.5 shadow-md overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={media.logoUrl} alt="" className="h-full w-full object-contain" />
              </div>
            )}
          </div>

          <div className="p-6 md:p-10 space-y-8">
            <header>
              {cats.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {cats.map((t) => (
                    <span
                      key={t}
                      className={cn(
                        "text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full",
                        isNog ? "bg-[#76b3b8]/12 text-[#4a7c80]" : "bg-primary/10 text-primary",
                      )}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <h1
                className={cn(
                  "text-3xl md:text-4xl font-semibold tracking-tight",
                  isNog ? "font-serif text-[#42514c]" : "text-foreground",
                )}
              >
                {business.name}
              </h1>
            </header>

            {show("about") && business.about && (
              <p
                className={cn(
                  "text-base md:text-lg leading-relaxed whitespace-pre-line",
                  isNog ? "text-[#5f716d]" : "text-muted-foreground",
                )}
              >
                {business.about}
              </p>
            )}

            <div className="grid gap-8 sm:grid-cols-2 border-t border-border/40 pt-8">
              <section>
                <h2
                  className={cn(
                    "text-xs font-bold uppercase tracking-[0.14em] mb-3",
                    isNog ? "text-[#76b3b8]" : "text-primary",
                  )}
                >
                  Contact
                </h2>
                <div className={cn("space-y-1 text-sm", isNog ? "text-[#42514c]" : "text-foreground")}>
                  <p className="font-semibold">{business.name}</p>
                  {show("address") && business.address && <p>{business.address}</p>}
                  {show("phone") && business.phone && (
                    <p>
                      <a href={`tel:${business.phone.replace(/\s/g, "")}`} className={cn("hover:underline", accent)}>
                        {business.phone}
                      </a>
                    </p>
                  )}
                  {show("email") && business.email && (
                    <p>
                      <a href={`mailto:${business.email}`} className={cn("hover:underline", accent)}>
                        Email
                      </a>
                    </p>
                  )}
                  {show("address") && business.address && (
                    <p className="pt-2">
                      <a
                        href={mapsDirectionsUrl(business.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("font-semibold hover:underline", accent)}
                      >
                        Get directions
                      </a>
                    </p>
                  )}
                </div>
              </section>

              <section>
                <h2
                  className={cn(
                    "text-xs font-bold uppercase tracking-[0.14em] mb-3",
                    isNog ? "text-[#76b3b8]" : "text-primary",
                  )}
                >
                  Hours
                </h2>
                {show("hours") && business.hours ? (
                  <p className={cn("text-sm whitespace-pre-line", isNog ? "text-[#42514c]" : "text-foreground")}>
                    {business.hours}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Hours not listed</p>
                )}

                {(show("website") && business.website) ||
                (show("facebook") && business.facebook) ||
                (show("instagram") && business.instagram) ? (
                  <div className="mt-8">
                    <h2
                      className={cn(
                        "text-xs font-bold uppercase tracking-[0.14em] mb-3",
                        isNog ? "text-[#76b3b8]" : "text-primary",
                      )}
                    >
                      Visit online
                    </h2>
                    <ul className="space-y-1.5 text-sm font-semibold">
                      {show("website") && business.website && (
                        <li>
                          <a
                            href={
                              business.website.startsWith("http")
                                ? business.website
                                : `https://${business.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn("hover:underline", accent)}
                          >
                            Website
                          </a>
                        </li>
                      )}
                      {show("facebook") && business.facebook && (
                        <li>
                          <a
                            href={normalizeSocialUrl(business.facebook, "facebook")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn("hover:underline", accent)}
                          >
                            Facebook
                          </a>
                        </li>
                      )}
                      {show("instagram") && business.instagram && (
                        <li>
                          <a
                            href={normalizeSocialUrl(business.instagram, "instagram")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn("hover:underline", accent)}
                          >
                            Instagram
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>
                ) : null}
              </section>
            </div>
          </div>
        </div>

        <nav className="mt-10 flex items-center justify-between gap-4 text-sm font-semibold">
          {prev?.slug ? (
            <Link href={businessDetailPath(prev.slug)} className={cn("hover:underline", accent)}>
              ← {prev.name}
            </Link>
          ) : (
            <span />
          )}
          {next?.slug ? (
            <Link href={businessDetailPath(next.slug)} className={cn("hover:underline text-right", accent)}>
              {next.name} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </div>
  )
}
