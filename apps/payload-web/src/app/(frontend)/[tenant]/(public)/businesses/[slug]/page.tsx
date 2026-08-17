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

function SectionLabel({ children, isNog }: { children: React.ReactNode; isNog: boolean }) {
  return (
    <h2
      className={cn(
        "text-[11px] font-bold uppercase tracking-[0.16em] mb-3",
        isNog ? "text-[#42514c]" : "text-foreground",
      )}
    >
      {children}
    </h2>
  )
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
  const body = isNog ? "text-[#42514c]" : "text-foreground"
  const muted = isNog ? "text-[#7b8c89]" : "text-muted-foreground"

  const hasOnline =
    (show("website") && business.website) ||
    (show("facebook") && business.facebook) ||
    (show("instagram") && business.instagram)

  return (
    <div className={cn("min-h-screen bg-background", isNog && "bg-[#fafbfa]")}>
      <div className="container max-w-6xl py-8 md:py-12">
        <Link
          href="/businesses"
          className={cn("inline-flex text-sm font-semibold mb-6 md:mb-8 hover:underline", accent)}
        >
          ← All businesses
        </Link>

        {/* Title first — Avenues pattern: name is immediately visible */}
        <header className="mb-6 md:mb-8 text-center md:text-left">
          {cats.length > 0 && (
            <div className="mb-3 flex flex-wrap justify-center md:justify-start gap-1.5">
              {cats.map((t) => (
                <span
                  key={t}
                  className={cn(
                    "text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full",
                    isNog ? "bg-[#76b3b8]/15 text-[#3d6f74]" : "bg-primary/10 text-primary",
                  )}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <h1
            className={cn(
              "text-3xl sm:text-4xl md:text-[2.75rem] font-semibold tracking-tight leading-tight",
              isNog ? "font-serif text-[#42514c]" : "text-foreground",
            )}
          >
            {business.name}
          </h1>
          <div
            className={cn(
              "mt-5 h-px w-full",
              isNog ? "bg-[#d5e3e0]" : "bg-border",
            )}
          />
        </header>

        {/* First viewport: contact/hours left, media right; mobile = media first */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-8 lg:order-2">
            <div
              className={cn(
                "relative w-full overflow-hidden rounded-sm",
                media.mode === "photo" ? "aspect-[16/10] bg-muted" : "aspect-[16/10]",
                media.mode === "logo" && (isNog ? "bg-[#e8f3f2]" : "bg-muted/60"),
                media.mode === "monogram" && (isNog ? "bg-[#e8f3f2]" : "bg-muted"),
              )}
            >
              {media.mode === "photo" && media.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media.photoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
              {media.mode === "logo" && media.logoUrl && (
                <div className="absolute inset-0 flex items-center justify-center p-8 md:p-12">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={media.logoUrl}
                    alt={`${business.name} logo`}
                    className="max-h-[85%] max-w-[70%] object-contain"
                  />
                </div>
              )}
              {media.mode === "monogram" && (
                <div
                  className={cn(
                    "flex h-full w-full items-center justify-center text-7xl font-serif",
                    isNog ? "text-[#76b3b8]" : "text-muted-foreground",
                  )}
                >
                  {business.name.charAt(0)}
                </div>
              )}
              {media.mode === "photo" && media.logoUrl && (
                <div className="absolute bottom-4 left-4 h-16 w-16 rounded-md border border-white bg-white p-1.5 shadow-md overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media.logoUrl} alt="" className="h-full w-full object-contain" />
                </div>
              )}
            </div>
          </div>

          <aside className="lg:col-span-4 lg:order-1 space-y-7 lg:pt-1">
            <section>
              <SectionLabel isNog={isNog}>Contact</SectionLabel>
              <div className={cn("space-y-1.5 text-[15px] leading-relaxed", body)}>
                <p className="font-semibold">{business.name}</p>
                {show("address") && business.address && <p>{business.address}</p>}
                {show("phone") && business.phone && (
                  <p>
                    <a
                      href={`tel:${business.phone.replace(/\s/g, "")}`}
                      className={cn("hover:underline", body)}
                    >
                      {business.phone}
                    </a>
                  </p>
                )}
                {show("email") && business.email && (
                  <p>
                    <a href={`mailto:${business.email}`} className={cn("hover:underline", muted)}>
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
              <SectionLabel isNog={isNog}>Hours</SectionLabel>
              {show("hours") && business.hours ? (
                <p className={cn("text-[15px] leading-relaxed whitespace-pre-line", body)}>
                  {business.hours}
                </p>
              ) : (
                <p className={cn("text-[15px]", muted)}>Hours not listed</p>
              )}
            </section>

            {hasOnline && (
              <section>
                <SectionLabel isNog={isNog}>Visit online</SectionLabel>
                <ul className="space-y-1.5 text-[15px]">
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
                        className={cn("hover:underline", muted)}
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
                        className={cn("hover:underline", muted)}
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
                        className={cn("hover:underline", muted)}
                      >
                        Instagram
                      </a>
                    </li>
                  )}
                </ul>
              </section>
            )}
          </aside>
        </div>

        {/* About below the fold — secondary after the key facts */}
        {show("about") && business.about && (
          <div className="mt-10 md:mt-14 max-w-3xl">
            <SectionLabel isNog={isNog}>About</SectionLabel>
            <p className={cn("text-base md:text-lg leading-relaxed whitespace-pre-line", muted)}>
              {business.about}
            </p>
          </div>
        )}

        <nav
          className={cn(
            "mt-12 pt-6 flex items-center justify-between gap-4 text-sm font-semibold border-t",
            isNog ? "border-[#d5e3e0]" : "border-border",
          )}
        >
          {prev?.slug ? (
            <Link href={businessDetailPath(prev.slug)} className={cn("hover:underline", accent)}>
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          {next?.slug ? (
            <Link
              href={businessDetailPath(next.slug)}
              className={cn("hover:underline text-right", accent)}
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </div>
  )
}
