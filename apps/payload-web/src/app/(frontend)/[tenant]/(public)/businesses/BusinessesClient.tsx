"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { registerBusinessAction } from "./actions"
import { cn } from "@/utilities/ui"

interface Business {
  id: string | number
  name: string
  address: string
  website: string
  about: string
  email: string
  hours?: string | null
  logo: any // Media object
  appearOnNOG?: boolean | null
}

interface BusinessesClientProps {
  initialBusinesses: Business[]
  tenantId: string | number
  tenantSlug: string
  tenantName: string
}

export default function BusinessesClient({
  initialBusinesses,
  tenantId,
  tenantSlug,
  tenantName,
}: BusinessesClientProps) {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form State
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [website, setWebsite] = useState("")
  const [about, setAbout] = useState("")
  const [email, setEmail] = useState("")
  const [hours, setHours] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoBase64, setLogoBase64] = useState<string>("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoBase64(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!name || !address || !website || !about || !email || !logoFile || !logoBase64) {
      setError("Please fill out all required fields, including the logo.")
      return
    }

    setLoading(true)

    try {
      const res = await registerBusinessAction(tenantId, {
        name,
        address,
        website,
        about,
        email,
        hours,
        logoBase64,
        logoName: logoFile.name,
        logoMime: logoFile.type,
      })

      if (res.success && res.business) {
        setSuccess(true)
        // Add new business to local state
        setBusinesses((prev) => [res.business as Business, ...prev])
        // Reset form
        setName("")
        setAddress("")
        setWebsite("")
        setAbout("")
        setEmail("")
        setHours("")
        setLogoFile(null)
        setLogoBase64("")
        
        // Auto-close modal after delay
        setTimeout(() => {
          setIsModalOpen(false)
          setSuccess(false)
        }, 2000)
      } else {
        setError(res.error || "Failed to register business.")
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const isNog = tenantSlug === "nog"

  return (
    <div className={cn("container py-12 px-4 md:px-8", isNog && "font-sans")}>
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/60 pb-6 mb-8 gap-4">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight text-foreground", isNog && "font-serif text-4xl text-[#76b3b8]")}>
            {isNog ? `Businesses of North Of Grand` : `${tenantName} Business Directory`}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-2xl">
            Support local. Explore and contact local businesses operating right here in our neighborhood association.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className={cn(
            "md:self-start transition-all font-semibold shadow-sm",
            isNog ? "bg-[#76b3b8] hover:bg-[#659fa4] text-white" : "bg-primary hover:bg-primary/95"
          )}
        >
          Add Your Business
        </Button>
      </div>

      {/* Directory Grid */}
      {businesses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/80 rounded-xl bg-muted/10">
          <h3 className="font-semibold text-lg text-foreground mb-1">No businesses registered yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
            Be the first to list your local business in our community directory directory!
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="outline"
            className={cn(isNog && "border-[#76b3b8] text-[#76b3b8] hover:bg-[#76b3b8]/10")}
          >
            Register Business
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((biz) => {
            const logoUrl = biz.logo && typeof biz.logo === "object" ? biz.logo.url : null
            return (
              <div
                key={biz.id}
                className="flex flex-col justify-between p-6 bg-card border border-border/80 rounded-xl shadow-sm hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 shrink-0 bg-muted/40 border border-border/40 rounded-lg overflow-hidden flex items-center justify-center p-1">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={`${biz.name} Logo`}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <span className="text-xl font-bold text-muted-foreground/60">
                          {biz.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className={cn("font-bold text-lg text-foreground line-clamp-1", isNog && "font-serif text-xl")}>
                        {biz.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{biz.address}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-4 mb-6 leading-relaxed">
                    {biz.about}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/40 text-xs">
                  {biz.hours && (
                    <div className="flex items-center text-muted-foreground gap-1.5">
                      <span className="font-semibold text-foreground/80">Hours:</span>
                      <span>{biz.hours}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs font-semibold text-primary pt-1">
                    {biz.website ? (
                      <a
                        href={biz.website.startsWith("http") ? biz.website : `https://${biz.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("hover:underline", isNog && "text-[#76b3b8]")}
                      >
                        Visit Website
                      </a>
                    ) : (
                      <div />
                    )}
                    <a
                      href={`mailto:${biz.email}`}
                      className={cn("hover:underline", isNog && "text-[#76b3b8]")}
                    >
                      Contact Email
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Registration Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 rounded-xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Close modal"
            >
              ✕
            </button>
            <h2 className={cn("text-2xl font-bold mb-1 text-foreground", isNog && "font-serif text-[#76b3b8]")}>
              Add Your Business
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Complete the details below to list your business in the community directory.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg font-medium">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-xs bg-green-500/10 border border-green-500/20 text-green-600 rounded-lg font-medium">
                  Business registered successfully! Adding to CRM list...
                </div>
              )}

              {/* Logo Upload */}
              <div className="space-y-1.5">
                <Label htmlFor="logo" className="text-xs font-semibold">
                  Business Logo <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer text-xs h-9 py-1 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#76b3b8]/10 file:text-[#76b3b8] hover:file:bg-[#76b3b8]/20"
                    required
                  />
                  {logoBase64 && (
                    <div className="w-10 h-10 bg-muted/40 border border-border/40 rounded overflow-hidden flex items-center justify-center p-0.5">
                      <img src={logoBase64} alt="Preview" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {/* Business Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. NOG Garden Cafe"
                  required
                />
              </div>

              {/* Business Address */}
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-semibold">
                  Business Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 1010 Grand Ave, Des Moines, IA"
                  required
                />
              </div>

              {/* Business Website */}
              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-xs font-semibold">
                  Business Website <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. https://noggardencafe.com"
                  required
                />
              </div>

              {/* Business Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Business Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. contact@noggardencafe.com"
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  This email will also be registered in our neighborhood CRM under the "businesses" list.
                </p>
              </div>

              {/* About Section */}
              <div className="space-y-1.5">
                <Label htmlFor="about" className="text-xs font-semibold">
                  About Section <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="about"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Describe your business, services, and neighborhood involvement..."
                  className="min-h-[80px]"
                  required
                />
              </div>

              {/* Hours (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="hours" className="text-xs font-semibold">
                  Hours <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="hours"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="e.g. Mon-Fri 8 AM - 6 PM, Sat-Sun Closed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "font-semibold",
                    isNog ? "bg-[#76b3b8] hover:bg-[#659fa4] text-white" : "bg-primary hover:bg-primary/95"
                  )}
                >
                  {loading ? "Registering..." : "Submit Business"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
