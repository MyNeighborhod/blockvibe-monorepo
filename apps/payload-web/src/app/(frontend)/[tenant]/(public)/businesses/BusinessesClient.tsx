"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { loadDirectoryBusinessesAction, registerBusinessAction } from "./actions"
import { cn } from "@/utilities/ui"
import {
  type DirectoryCoreFieldKey,
  type DirectoryFieldConfigRow,
  isFieldEnabled,
  resolveFieldConfig,
} from "@/directory/constants"
import {
  businessDetailPath,
  cardMediaPresentation,
  categoryTitlesOf,
} from "@/directory/businessMedia"

type MediaLike = { url?: string | null; alt?: string | null } | string | number | null | undefined

interface Business {
  id: string | number
  name: string
  slug?: string | null
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
  initialHasNextPage: boolean
  initialTotalDocs: number
  initialPage: number
  categoryCounts: Record<string, number>
  categories: Category[]
  customFields: CustomField[]
  directorySettings: DirectorySettings
  tenantId: string | number
  tenantSlug: string
  tenantName: string
}

export default function BusinessesClient({
  initialBusinesses,
  initialHasNextPage,
  initialTotalDocs,
  initialPage,
  categoryCounts,
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
  const onForm = (key: DirectoryCoreFieldKey) => show(key) && fieldMap.get(key)?.showInRegistration !== false
  const required = (key: DirectoryCoreFieldKey) => Boolean(fieldMap.get(key)?.required)

  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses)
  const [page, setPage] = useState(initialPage)
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage)
  const [totalDocs, setTotalDocs] = useState(initialTotalDocs)
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "name-desc">("name")
  const [isFilterPending, startFilterTransition] = useTransition()
  const [loadingMore, setLoadingMore] = useState(false)
  const loadMoreLock = useRef(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

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

  const fetchPage = useCallback(
    async (nextPage: number, mode: "replace" | "append", category = activeCategory, sort = sortBy) => {
      const res = await loadDirectoryBusinessesAction(tenantId, {
        page: nextPage,
        sortBy: sort,
        categoryId: category,
      })
      if (!res.success) return false

      setBusinesses((prev) => {
        if (mode === "replace") return (res.businesses || []) as Business[]
        const seen = new Set(prev.map((b) => String(b.id)))
        const incoming = ((res.businesses || []) as Business[]).filter((b) => !seen.has(String(b.id)))
        return [...prev, ...incoming]
      })
      setPage(res.page || nextPage)
      setHasNextPage(Boolean(res.hasNextPage))
      setTotalDocs(res.totalDocs || 0)
      return true
    },
    [tenantId, sortBy, activeCategory],
  )

  const resetAndLoad = useCallback(
    (category: string, sort: "name" | "name-desc") => {
      startFilterTransition(async () => {
        loadMoreLock.current = true
        try {
          await fetchPage(1, "replace", category, sort)
        } finally {
          loadMoreLock.current = false
        }
      })
    },
    [fetchPage],
  )

  const onCategoryChange = (category: string) => {
    setActiveCategory(category)
    resetAndLoad(category, sortBy)
  }

  const onSortChange = (sort: "name" | "name-desc") => {
    setSortBy(sort)
    resetAndLoad(activeCategory, sort)
  }

  const loadMore = useCallback(async () => {
    if (!hasNextPage || loadingMore || loadMoreLock.current || isFilterPending) return
    loadMoreLock.current = true
    setLoadingMore(true)
    try {
      await fetchPage(page + 1, "append")
    } finally {
      setLoadingMore(false)
      loadMoreLock.current = false
    }
  }, [hasNextPage, loadingMore, isFilterPending, fetchPage, page])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadMore()
        }
      },
      { rootMargin: "240px 0px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, loadMore])

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
              onClick={() => onCategoryChange("all")}
              isNog={isNog}
            >
              All{typeof categoryCounts.all === "number" ? ` (${categoryCounts.all})` : ""}
            </FilterPill>
            {categories.map((cat) => {
              const id = String(cat.id)
              const count = categoryCounts[id]
              return (
              <FilterPill
                key={cat.id}
                active={activeCategory === id}
                onClick={() => onCategoryChange(id)}
                isNog={isNog}
              >
                {cat.title}{typeof count === "number" ? ` (${count})` : ""}
              </FilterPill>
              )
            })}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as "name" | "name-desc")}
              className="h-9 rounded-md border border-border/70 bg-background/80 px-2 text-sm text-foreground"
            >
              <option value="name">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
            </select>
          </label>
        </div>

        {businesses.length === 0 && !isFilterPending ? (
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
          <>
            <div
              className={cn(
                "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7 transition-opacity",
                isFilterPending && "opacity-60",
              )}
            >
              {businesses.map((biz, index) => {
                const media = cardMediaPresentation(biz)
                const cats = categoryTitlesOf(biz)
                return (
                  <Link
                    key={biz.id}
                    href={biz.slug ? businessDetailPath(biz.slug) : `/businesses?highlight=${biz.id}`}
                    className={cn(
                      "group text-left overflow-hidden rounded-2xl border bg-card/90 backdrop-blur-sm transition-all duration-300 block !no-underline [&_*]:!no-underline",
                      "hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2",
                      accentRing,
                      isNog ? "border-[#d5e3e0] shadow-[0_1px_0_rgba(66,81,76,0.04)]" : "border-border/70 shadow-sm",
                    )}
                    style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
                  >
                    <div
                      className={cn(
                        "relative overflow-hidden",
                        media.mode === "photo" ? "aspect-[16/10]" : "aspect-[5/3]",
                        media.mode === "logo" && (isNog ? "bg-[#eef6f5]" : "bg-muted/50"),
                        media.mode === "monogram" && (isNog ? "bg-[#e8f3f2]" : "bg-muted"),
                      )}
                    >
                      {media.mode === "photo" && media.photoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={media.photoUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      )}
                      {media.mode === "logo" && media.logoUrl && (
                        <div className="absolute inset-0 flex items-center justify-center p-8 md:p-10">
                          <div
                            className={cn(
                              "absolute inset-0 opacity-70",
                              isNog
                                ? "bg-[radial-gradient(ellipse_at_center,_rgba(118,179,184,0.22)_0%,_transparent_65%)]"
                                : "bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.06)_0%,_transparent_65%)]",
                            )}
                          />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={media.logoUrl}
                            alt=""
                            className="relative z-[1] max-h-full max-w-[70%] object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-[1.04]"
                            loading="lazy"
                          />
                        </div>
                      )}
                      {media.mode === "monogram" && (
                        <div
                          className={cn(
                            "flex h-full w-full items-center justify-center text-4xl font-serif",
                            isNog ? "text-[#76b3b8]" : "text-muted-foreground",
                          )}
                        >
                          {biz.name.charAt(0)}
                        </div>
                      )}
                      {media.mode === "photo" && media.logoUrl && onCard("logo") && (
                        <div className="absolute bottom-3 left-3 h-12 w-12 rounded-lg border border-white/70 bg-white/95 p-1 shadow-sm overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={media.logoUrl} alt="" className="h-full w-full object-contain" loading="lazy" />
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
                                "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full !no-underline",
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
                          "text-xl font-semibold leading-snug line-clamp-2 group-hover:!underline decoration-1 underline-offset-4 !no-underline",
                          isNog ? "font-serif text-[#42514c]" : "text-foreground",
                        )}
                      >
                        {biz.name}
                      </h3>
                      {onCard("address") && biz.address && (
                        <p className={cn("mt-1.5 text-sm line-clamp-1 !no-underline", isNog ? "text-[#7b8c89]" : "text-muted-foreground")}>
                          {biz.address}
                        </p>
                      )}
                      {onCard("about") && biz.about && (
                        <p className={cn("mt-3 text-sm leading-relaxed line-clamp-3 !no-underline", isNog ? "text-[#7b8c89]" : "text-muted-foreground")}>
                          {biz.about}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between text-xs font-semibold !no-underline">
                        <span className={cn(accent, "!no-underline")}>View details</span>
                        {onCard("hours") && biz.hours && (
                          <span className="text-muted-foreground font-normal truncate max-w-[50%] !no-underline">{biz.hours}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div
              ref={sentinelRef}
              className="mt-6 mb-8 flex min-h-14 flex-col items-center justify-center gap-2"
              aria-live="polite"
            >
              {hasNextPage ? (
                <>
                  <Loader2
                    className={cn(
                      "h-8 w-8 animate-spin",
                      isNog ? "text-[#76b3b8]" : "text-primary",
                      !loadingMore && !isFilterPending && "opacity-70",
                    )}
                    aria-hidden
                  />
                  <span className="sr-only">
                    {loadingMore || isFilterPending ? "Loading more businesses" : "More businesses available"}
                  </span>
                </>
              ) : businesses.length > 0 ? (
                <p className={cn("text-sm", isNog ? "text-[#7b8c89]" : "text-muted-foreground")}>
                  Showing all {totalDocs} business{totalDocs === 1 ? "" : "es"}
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>

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
