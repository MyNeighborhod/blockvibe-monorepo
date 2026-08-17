"use client"

import React, { useMemo, useState } from "react"
import { ShieldCheck, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { registerBusinessAction } from "./actions"
import { cn } from "@/utilities/ui"
import {
  type DirectoryCoreFieldKey,
  type DirectoryFieldConfigRow,
  isFieldEnabled,
  mapsDirectionsUrl,
  resolveFieldConfig,
} from "@/directory/constants"

type MediaLike = { url?: string | null; alt?: string | null } | string | number | null | undefined

interface Business {
  id: string | number
  name: string
  address?: string | null
  website?: string | null
  about?: string | null
  email?: string | null
  phone?: string | null
  hours?: string | null
  facebook?: string | null
  instagram?: string | null
  logo?: MediaLike
  coverImage?: MediaLike
  categories?: Array<{ id: string | number; title?: string | null; slug?: string | null } | string | number> | null
  customAttributes?: Record<string, unknown> | null
  appearOnNOG?: boolean | null
}

interface DirectorySettings {
  pageTitle?: string | null
  pageIntro?: string | null
  allowPublicRegistration?: boolean | null
  showInNav?: boolean | null
  fieldConfig?: DirectoryFieldConfigRow[] | null
}

interface CustomField {
  id: string | number
  label: string
  key: string
  fieldType: "text" | "number" | "checkbox" | "select" | "url"
  options?: { value: string }[] | null
  required?: boolean | null
  showInRegistration?: boolean | null
  showOnCard?: boolean | null
  showOnDetail?: boolean | null
}

interface Category {
  id: string | number
  title: string
  slug?: string | null
}

interface BusinessesClientProps {
  initialBusinesses: Business[]
  categories: Category[]
  customFields: CustomField[]
  directorySettings: DirectorySettings
  tenantId: string | number
  tenantSlug: string
  tenantName: string
}

function mediaUrl(media: MediaLike): string | null {
  if (!media || typeof media !== "object") return null
  return media.url || null
}

function normalizeSocialUrl(value: string, kind: "facebook" | "instagram"): string {
  if (value.startsWith("http")) return value
  if (kind === "facebook") return `https://facebook.com/${value.replace(/^@/, "")}`
  return `https://instagram.com/${value.replace(/^@/, "")}`
}

function categoryIdsOf(biz: Business): string[] {
  if (!biz.categories?.length) return []
  return biz.categories.map((c) => (typeof c === "object" && c ? String(c.id) : String(c)))
}

function categoryTitlesOf(biz: Business): string[] {
  if (!biz.categories?.length) return []
  return biz.categories
    .map((c) => (typeof c === "object" && c ? c.title || "" : ""))
    .filter(Boolean) as string[]
}

export default function BusinessesClient({
  initialBusinesses,
  categories,
  customFields,
  directorySettings,
  tenantId,
  tenantSlug,
  tenantName,
}: BusinessesClientProps) {
  const isNog = tenantSlug === "nog" || tenantSlug === "default"
  const fieldMap = useMemo(
    () => resolveFieldConfig(directorySettings.fieldConfig),
    [directorySettings.fieldConfig],
  )

  const show = (key: DirectoryCoreFieldKey) => isFieldEnabled(fieldMap, key)
  const onCard = (key: DirectoryCoreFieldKey) => show(key) && fieldMap.get(key)?.showOnCard
  const onDetail = (key: DirectoryCoreFieldKey) => show(key) && fieldMap.get(key)?.showOnDetail !== false
  const onForm = (key: DirectoryCoreFieldKey) => show(key) && fieldMap.get(key)?.showInRegistration !== false
  const required = (key: DirectoryCoreFieldKey) => Boolean(fieldMap.get(key)?.required)

  const [businesses] = useState<Business[]>(initialBusinesses)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "name-desc">("name")
  const [selected, setSelected] = useState<Business | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [website, setWebsite] = useState("")
  const [about, setAbout] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [hours, setHours] = useState("")
  const [facebook, setFacebook] = useState("")
  const [instagram, setInstagram] = useState("")
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [customValues, setCustomValues] = useState<Record<string, any>>({})
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoBase64, setLogoBase64] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverBase64, setCoverBase64] = useState("")

  const allowRegistration = directorySettings.allowPublicRegistration !== false
  const pageTitle =
    directorySettings.pageTitle ||
    (isNog ? "Businesses of North Of Grand" : `${tenantName} Business Directory`)
  const pageIntro =
    directorySettings.pageIntro ||
    "Support local. Explore shops, restaurants, and services right here in our neighborhood."

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: businesses.length }
    for (const b of businesses) {
      for (const catId of categoryIdsOf(b)) {
        counts[catId] = (counts[catId] || 0) + 1
      }
    }
    return counts
  }, [businesses])

  const filtered = useMemo(() => {
    let list = [...businesses]
    if (activeCategory !== "all") {
      list = list.filter((b) => categoryIdsOf(b).includes(activeCategory))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.about || "").toLowerCase().includes(q) ||
          (b.address || "").toLowerCase().includes(q),
      )
    }
    list.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name)
      return sortBy === "name" ? cmp : -cmp
    })
    return list
  }, [businesses, activeCategory, searchQuery, sortBy])

  const readFile = (file: File, setter: (v: string) => void) => {
    const reader = new FileReader()
    reader.onloadend = () => setter(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (required("name") && !name.trim()) return setError("Business name is required.")
    if (required("address") && !address.trim()) return setError("Address is required.")
    if (required("website") && !website.trim()) return setError("Website is required.")
    if (required("email") && !email.trim()) return setError("Email is required.")
    if (required("about") && about.trim().length < 10) {
      return setError("About description must be at least 10 characters.")
    }
    if (required("logo") && !logoFile) return setError("Logo is required.")
    if (required("coverImage") && !coverFile) return setError("Cover image is required.")
    if (required("phone") && !phone.trim()) return setError("Phone is required.")

    for (const field of customFields) {
      if (field.showInRegistration === false) continue
      if (field.required && (customValues[field.key] === undefined || customValues[field.key] === "")) {
        return setError(`${field.label} is required.`)
      }
    }

    setLoading(true)
    try {
      const res = await registerBusinessAction(tenantId, {
        name,
        address,
        website,
        about,
        email,
        phone,
        hours,
        facebook,
        instagram,
        categoryIds: selectedCategoryIds,
        customAttributes: customValues,
        logoBase64: logoBase64 || undefined,
        logoName: logoFile?.name,
        logoMime: logoFile?.type,
        coverBase64: coverBase64 || undefined,
        coverName: coverFile?.name,
        coverMime: coverFile?.type,
      })

      if (res.success) {
        setSuccess(true)
        setName("")
        setAddress("")
        setWebsite("")
        setAbout("")
        setEmail("")
        setPhone("")
        setHours("")
        setFacebook("")
        setInstagram("")
        setSelectedCategoryIds([])
        setCustomValues({})
        setLogoFile(null)
        setLogoBase64("")
        setCoverFile(null)
        setCoverBase64("")
        setTimeout(() => {
          setIsModalOpen(false)
          setSuccess(false)
        }, 2200)
      } else {
        setError(res.error || "Failed to register business.")
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const accent = isNog ? "text-[#76b3b8]" : "text-primary"
  const accentBtn = isNog
    ? "bg-[#76b3b8] hover:bg-[#659fa4] text-white"
    : "bg-primary hover:bg-primary/95 text-primary-foreground"
  const accentRing = isNog ? "ring-[#76b3b8]/40" : "ring-primary/40"

  return (
    <div className={cn("relative", isNog && "theme-nog")}>
      {/* Soft atmospheric wash — NOG palette, not flat white */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-[28rem]",
          isNog
            ? "bg-[radial-gradient(ellipse_at_top,_rgba(118,179,184,0.18),_transparent_60%),linear-gradient(180deg,_#f7faf9_0%,_transparent_100%)]"
            : "bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.12),_transparent_55%)]",
        )}
      />

      <div className="container relative py-10 md:py-14 px-4 md:px-8">
        {/* Header — one composition: title, intro, CTA */}
        <header className="mb-10 md:mb-12 max-w-3xl">
          <p
            className={cn(
              "text-xs uppercase tracking-[0.2em] mb-3 font-semibold",
              isNog ? "text-[#76b3b8]" : "text-primary",
            )}
          >
            Local directory
          </p>
          <h1
            className={cn(
              "text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight",
              isNog && "font-serif text-[#42514c]",
            )}
          >
            {pageTitle}
          </h1>
          <p
            className={cn(
              "mt-4 text-base md:text-lg leading-relaxed max-w-2xl",
              isNog ? "text-[#7b8c89]" : "text-muted-foreground",
            )}
          >
            {pageIntro}
          </p>
          {allowRegistration && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button onClick={() => setIsModalOpen(true)} className={cn("font-semibold shadow-sm", accentBtn)}>
                Add your business
              </Button>
              <span className={cn("text-sm", isNog ? "text-[#7b8c89]" : "text-muted-foreground")}>
                Free listing · reviewed before it goes live
              </span>
            </div>
          )}
        </header>

        {/* Filters — Avenues-like pills, NOG color */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterPill
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
              isNog={isNog}
            >
              All
            </FilterPill>
            {categories.map((cat) => (
              <FilterPill
                key={cat.id}
                active={activeCategory === String(cat.id)}
                onClick={() => setActiveCategory(String(cat.id))}
                isNog={isNog}
              >
                {cat.title}
              </FilterPill>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "name-desc")}
              className="h-9 rounded-md border border-border/70 bg-background/80 px-2 text-sm text-foreground"
            >
              <option value="name">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div
            className={cn(
              "text-center py-20 border border-dashed rounded-2xl",
              isNog ? "border-[#76b3b8]/40 bg-[#76b3b8]/5" : "border-border/80 bg-muted/10",
            )}
          >
            <h3 className={cn("text-xl font-semibold mb-2", isNog && "font-serif text-[#42514c]")}>
              No businesses here yet
            </h3>
            <p className={cn("text-sm max-w-md mx-auto mb-5", isNog ? "text-[#7b8c89]" : "text-muted-foreground")}>
              {activeCategory !== "all"
                ? "Try another category, or clear the filter."
                : "Be the first to list your neighborhood business."}
            </p>
            {allowRegistration && (
              <Button onClick={() => setIsModalOpen(true)} variant="outline" className={cn(isNog && "border-[#76b3b8] text-[#76b3b8]")}>
                Register business
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
            {filtered.map((biz, index) => {
              const cover = mediaUrl(biz.coverImage) || mediaUrl(biz.logo)
              const logo = mediaUrl(biz.logo)
              const cats = categoryTitlesOf(biz)
              return (
                <button
                  key={biz.id}
                  type="button"
                  onClick={() => setSelected(biz)}
                  className={cn(
                    "group text-left overflow-hidden rounded-2xl border bg-card/90 backdrop-blur-sm transition-all duration-300",
                    "hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2",
                    accentRing,
                    isNog ? "border-[#d5e3e0] shadow-[0_1px_0_rgba(66,81,76,0.04)]" : "border-border/70 shadow-sm",
                  )}
                  style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted/40">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className={cn(
                          "flex h-full w-full items-center justify-center text-4xl font-serif",
                          isNog ? "bg-[#e8f3f2] text-[#76b3b8]" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {biz.name.charAt(0)}
                      </div>
                    )}
                    {logo && cover && logo !== cover && onCard("logo") && (
                      <div className="absolute bottom-3 left-3 h-12 w-12 rounded-lg border border-white/70 bg-white/95 p-1 shadow-sm overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logo} alt="" className="h-full w-full object-contain" loading="lazy" />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    {onCard("categories") && cats.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {cats.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className={cn(
                              "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full",
                              isNog ? "bg-[#76b3b8]/12 text-[#4a7c80]" : "bg-primary/10 text-primary",
                            )}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <h3
                      className={cn(
                        "text-xl font-semibold leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-4",
                        isNog ? "font-serif text-[#42514c]" : "text-foreground",
                      )}
                    >
                      {biz.name}
                    </h3>
                    {onCard("address") && biz.address && (
                      <p className={cn("mt-1.5 text-sm line-clamp-1", isNog ? "text-[#7b8c89]" : "text-muted-foreground")}>
                        {biz.address}
                      </p>
                    )}
                    {onCard("about") && biz.about && (
                      <p className={cn("mt-3 text-sm leading-relaxed line-clamp-3", isNog ? "text-[#7b8c89]" : "text-muted-foreground")}>
                        {biz.about}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between text-xs font-semibold">
                      <span className={accent}>View details</span>
                      {onCard("hours") && biz.hours && (
                        <span className="text-muted-foreground font-normal truncate max-w-[50%]">{biz.hours}</span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail drawer / modal — Avenues contact block energy, NOG type */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-[#2a2a2a]/45 backdrop-blur-[2px] animate-in fade-in duration-200"
            aria-label="Dismiss details"
            onClick={() => setSelected(null)}
          />
          <article
            role="dialog"
            aria-modal="true"
            aria-label={selected.name}
            className={cn(
              "relative z-10 w-full md:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl md:rounded-3xl bg-card shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300",
              isNog && "theme-nog",
            )}
          >
            <div className="relative aspect-[16/9] bg-muted">
              {(mediaUrl(selected.coverImage) || mediaUrl(selected.logo)) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(mediaUrl(selected.coverImage) || mediaUrl(selected.logo))!}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute right-4 top-4 z-20 rounded-full bg-black/45 text-white px-3 py-1 text-sm hover:bg-black/60"
              >
                Close
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div>
                {onDetail("categories") && categoryTitlesOf(selected).length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {categoryTitlesOf(selected).map((t) => (
                      <span
                        key={t}
                        className={cn(
                          "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full",
                          isNog ? "bg-[#76b3b8]/12 text-[#4a7c80]" : "bg-primary/10 text-primary",
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <h2 className={cn("text-3xl font-semibold", isNog ? "font-serif text-[#42514c]" : "text-foreground")}>
                  {selected.name}
                </h2>
              </div>

              {onDetail("about") && selected.about && (
                <p className={cn("text-base leading-relaxed", isNog ? "text-[#7b8c89]" : "text-muted-foreground")}>
                  {selected.about}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {onDetail("address") && selected.address && (
                  <DetailBlock label="Contact" isNog={isNog}>
                    <p className="font-medium text-foreground">{selected.name}</p>
                    <p>{selected.address}</p>
                    <a
                      href={mapsDirectionsUrl(selected.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("inline-block mt-1 font-semibold hover:underline", accent)}
                    >
                      Get directions
                    </a>
                  </DetailBlock>
                )}
                {onDetail("hours") && selected.hours && (
                  <DetailBlock label="Hours" isNog={isNog}>
                    <p>{selected.hours}</p>
                  </DetailBlock>
                )}
                {onDetail("phone") && selected.phone && (
                  <DetailBlock label="Phone" isNog={isNog}>
                    <a href={`tel:${selected.phone}`} className={cn("font-semibold hover:underline", accent)}>
                      {selected.phone}
                    </a>
                  </DetailBlock>
                )}
                {onDetail("email") && selected.email && (
                  <DetailBlock label="Email" isNog={isNog}>
                    <a href={`mailto:${selected.email}`} className={cn("font-semibold hover:underline", accent)}>
                      {selected.email}
                    </a>
                  </DetailBlock>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {onDetail("website") && selected.website && (
                  <a
                    href={
                      selected.website.startsWith("http") ? selected.website : `https://${selected.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold", accentBtn)}
                  >
                    Visit website
                  </a>
                )}
                {onDetail("facebook") && selected.facebook && (
                  <a
                    href={normalizeSocialUrl(selected.facebook, "facebook")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted/40"
                  >
                    Facebook
                  </a>
                )}
                {onDetail("instagram") && selected.instagram && (
                  <a
                    href={normalizeSocialUrl(selected.instagram, "instagram")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted/40"
                  >
                    Instagram
                  </a>
                )}
              </div>

              {customFields.some((f) => f.showOnDetail !== false) && selected.customAttributes && (
                <div className="border-t border-border/50 pt-4 space-y-2">
                  {customFields
                    .filter((f) => f.showOnDetail !== false)
                    .map((f) => {
                      const val = selected.customAttributes?.[f.key]
                      if (val === undefined || val === null || val === "") return null
                      return (
                        <div key={f.key} className="text-sm">
                          <span className="font-semibold text-foreground">{f.label}: </span>
                          <span className="text-muted-foreground">
                            {typeof val === "boolean" ? (val ? "Yes" : "No") : String(val)}
                          </span>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </article>
        </div>
      )}

      {/* Registration modal */}
      {isModalOpen && allowRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative z-10 bg-card border border-border/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              aria-label="Close modal"
            >
              ✕
            </button>
            <h2 className={cn("text-2xl font-semibold mb-1", isNog && "font-serif text-[#76b3b8]")}>
              Add your business
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Submit for review. Approved listings appear in the public directory.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-xs bg-green-500/10 border border-green-500/20 text-green-700 rounded-lg">
                  Thanks! Your listing was submitted and will appear after approval.
                </div>
              )}

              {onForm("coverImage") && (
                <FileField
                  id="cover"
                  label="Cover image"
                  hint="Landscape image recommended (16:9 aspect ratio, max 5MB, PNG/JPG/WEBP)"
                  required={required("coverImage")}
                  preview={coverBase64}
                  onChange={(file) => {
                    setCoverFile(file)
                    if (file) readFile(file, setCoverBase64)
                  }}
                />
              )}
              {onForm("logo") && (
                <FileField
                  id="logo"
                  label="Logo"
                  hint="Square image recommended (1:1 ratio 500x500px, max 5MB, PNG/JPG/WEBP)"
                  required={required("logo")}
                  preview={logoBase64}
                  onChange={(file) => {
                    setLogoFile(file)
                    if (file) readFile(file, setLogoBase64)
                  }}
                />
              )}
              {onForm("name") && (
                <TextField id="name" label="Business name" required={required("name")} value={name} onChange={setName} />
              )}
              {onForm("address") && (
                <TextField id="address" label="Address" required={required("address")} value={address} onChange={setAddress} />
              )}
              {onForm("phone") && (
                <TextField id="phone" label="Phone" required={required("phone")} value={phone} onChange={setPhone} />
              )}
              {onForm("website") && (
                <TextField id="website" label="Website" required={required("website")} value={website} onChange={setWebsite} />
              )}
              {onForm("email") && (
                <TextField
                  id="email"
                  label="Email"
                  type="email"
                  required={required("email")}
                  value={email}
                  onChange={setEmail}
                  hint='Also added to the neighborhood CRM under "businesses".'
                />
              )}
              {onForm("about") && (
                <div className="space-y-1.5">
                  <Label htmlFor="about" className="text-xs font-semibold">
                    About {required("about") && <span className="text-destructive">*</span>}
                  </Label>
                  <Textarea
                    id="about"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="min-h-[80px]"
                    required={required("about")}
                  />
                </div>
              )}
              {onForm("hours") && (
                <TextField id="hours" label="Hours" required={required("hours")} value={hours} onChange={setHours} />
              )}
              {onForm("facebook") && (
                <TextField id="facebook" label="Facebook" required={required("facebook")} value={facebook} onChange={setFacebook} />
              )}
              {onForm("instagram") && (
                <TextField id="instagram" label="Instagram" required={required("instagram")} value={instagram} onChange={setInstagram} />
              )}

              {onForm("categories") && categories.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Categories {required("categories") && <span className="text-destructive">*</span>}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const id = String(cat.id)
                      const active = selectedCategoryIds.includes(id)
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() =>
                            setSelectedCategoryIds((prev) =>
                              active ? prev.filter((x) => x !== id) : [...prev, id],
                            )
                          }
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold border transition-colors",
                            active
                              ? isNog
                                ? "bg-[#76b3b8] text-white border-[#76b3b8]"
                                : "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:bg-muted/40",
                          )}
                        >
                          {cat.title}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {customFields
                .filter((f) => f.showInRegistration !== false)
                .map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label htmlFor={`cf-${field.key}`} className="text-xs font-semibold">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    {field.fieldType === "checkbox" ? (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={Boolean(customValues[field.key])}
                          onChange={(e) =>
                            setCustomValues((prev) => ({ ...prev, [field.key]: e.target.checked }))
                          }
                        />
                        Yes
                      </label>
                    ) : field.fieldType === "select" ? (
                      <select
                        id={`cf-${field.key}`}
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                        value={customValues[field.key] || ""}
                        required={Boolean(field.required)}
                        onChange={(e) =>
                          setCustomValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                      >
                        <option value="">Select…</option>
                        {(field.options || []).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.value}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={`cf-${field.key}`}
                        type={field.fieldType === "number" ? "number" : field.fieldType === "url" ? "url" : "text"}
                        value={customValues[field.key] || ""}
                        required={Boolean(field.required)}
                        onChange={(e) =>
                          setCustomValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                      />
                    )}
                  </div>
                ))}

              <div className="text-[11px] text-muted-foreground bg-muted/20 border border-border/40 p-2.5 rounded-lg flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#76b3b8] shrink-0" />
                <span>Protected by Google reCAPTCHA and spam validation.</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className={cn("font-semibold", accentBtn)}>
                  {loading ? "Submitting…" : "Submit business"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  children,
  isNog,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  isNog: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all border",
        active
          ? isNog
            ? "bg-[#76b3b8] text-white border-[#76b3b8] shadow-sm"
            : "bg-primary text-primary-foreground border-primary"
          : isNog
            ? "bg-white/80 text-[#42514c] border-[#d5e3e0] hover:border-[#76b3b8]/60"
            : "bg-background text-muted-foreground border-border hover:border-primary/40",
      )}
    >
      {children}
    </button>
  )
}

function DetailBlock({
  label,
  children,
  isNog,
}: {
  label: string
  children: React.ReactNode
  isNog: boolean
}) {
  return (
    <div>
      <h4
        className={cn(
          "text-[11px] uppercase tracking-[0.18em] font-semibold mb-1.5",
          isNog ? "text-[#76b3b8]" : "text-primary",
        )}
      >
        {label}
      </h4>
      <div className={cn("text-sm leading-relaxed", isNog ? "text-[#7b8c89]" : "text-muted-foreground")}>
        {children}
      </div>
    </div>
  )
}

function TextField({
  id,
  label,
  required,
  value,
  onChange,
  type = "text",
  hint,
}: {
  id: string
  label: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  type?: string
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function FileField({
  id,
  label,
  required,
  preview,
  hint,
  onChange,
}: {
  id: string
  label: string
  required?: boolean
  preview?: string
  hint?: string
  onChange: (file: File | null) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex items-center gap-3">
        <Input
          id={id}
          type="file"
          accept="image/png, image/jpeg, image/webp, image/gif"
          required={required}
          className="cursor-pointer text-xs h-9 py-1"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
        {preview && (
          <div className="w-10 h-10 rounded overflow-hidden border border-border/40 bg-muted/30 p-0.5 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="w-full h-full object-contain" />
          </div>
        )}
      </div>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  )
}
