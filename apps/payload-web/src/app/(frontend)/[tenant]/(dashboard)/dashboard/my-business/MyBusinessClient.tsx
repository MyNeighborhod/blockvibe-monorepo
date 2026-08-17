"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { updateMyBusinessAction } from "./actions"
import { Building2, CheckCircle2, Clock, Upload, Globe, Phone, MapPin, ShieldCheck, AlertCircle } from "lucide-react"

interface MyBusinessClientProps {
  tenantId: string | number
  initialBusiness: any | null
}

export function MyBusinessClient({ tenantId, initialBusiness }: MyBusinessClientProps) {
  const [business, setBusiness] = useState<any>(initialBusiness)

  const [name, setName] = useState(initialBusiness?.name || "")
  const [address, setAddress] = useState(initialBusiness?.address || "")
  const [website, setWebsite] = useState(initialBusiness?.website || "")
  const [about, setAbout] = useState(initialBusiness?.about || "")
  const [phone, setPhone] = useState(initialBusiness?.phone || "")
  const [hours, setHours] = useState(initialBusiness?.hours || "")
  const [facebook, setFacebook] = useState(initialBusiness?.facebook || "")
  const [instagram, setInstagram] = useState(initialBusiness?.instagram || "")

  const [logoBase64, setLogoBase64] = useState<string>("")
  const [logoName, setLogoName] = useState<string>("")
  const [logoMime, setLogoMime] = useState<string>("")

  const [coverBase64, setCoverBase64] = useState<string>("")
  const [coverName, setCoverName] = useState<string>("")
  const [coverMime, setCoverMime] = useState<string>("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  function readFile(file: File, setter: (b: string) => void, nameSetter: (n: string) => void, mimeSetter: (m: string) => void) {
    nameSetter(file.name)
    mimeSetter(file.type)
    const reader = new FileReader()
    reader.onload = () => setter(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!business) return

    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await updateMyBusinessAction(tenantId, business.id, {
        name,
        address,
        website,
        about,
        phone,
        hours,
        facebook,
        instagram,
        logoBase64: logoBase64 || undefined,
        logoName: logoName || undefined,
        logoMime: logoMime || undefined,
        coverBase64: coverBase64 || undefined,
        coverName: coverName || undefined,
        coverMime: coverMime || undefined,
      })

      if (!res.success) {
        throw new Error(res.error || "Failed to update business profile.")
      }

      setSuccessMsg(res.message || "Business profile updated successfully!")
      if (res.business) {
        setBusiness(res.business)
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  if (!business) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6 text-center space-y-3">
            <Building2 className="w-12 h-12 text-amber-600 mx-auto opacity-80" />
            <h3 className="text-lg font-semibold">No Business Listing Found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Your logged-in email is not currently associated with an active business listing in this neighborhood.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isApproved = Boolean(business.appearOnNOG)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#76b3b8]/10 text-[#76b3b8] flex items-center justify-center font-bold text-xl border border-[#76b3b8]/20 shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{business.name}</h1>
              {isApproved ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Live in Directory
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" /> Pending Admin Approval
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Update your business profile details, contact information, hours, and branding images.
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Edit Business Details</CardTitle>
          <CardDescription>
            Changes saved here will immediately update your public business directory profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="biz-name" className="text-xs font-semibold">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="biz-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="biz-address" className="text-xs font-semibold">
                  Address
                </Label>
                <Input
                  id="biz-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 1234 Grand Ave, Des Moines, IA"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="biz-phone" className="text-xs font-semibold">
                  Phone Number
                </Label>
                <Input
                  id="biz-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(515) 555-0199"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="biz-website" className="text-xs font-semibold">
                  Website URL
                </Label>
                <Input
                  id="biz-website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="biz-hours" className="text-xs font-semibold">
                  Business Hours
                </Label>
                <Input
                  id="biz-hours"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="Mon–Fri 8am–5pm · Sat 9am–2pm"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="biz-about" className="text-xs font-semibold">
                  About Description
                </Label>
                <Textarea
                  id="biz-about"
                  rows={4}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Tell neighbors about your products, services, and story…"
                />
              </div>
            </div>

            {/* Branding Images Section */}
            <div className="pt-4 border-t border-border/40 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Branding & Media
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="biz-logo" className="text-xs font-semibold">
                    Logo Image
                  </Label>
                  <Input
                    id="biz-logo"
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    className="cursor-pointer text-xs"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) readFile(file, setLogoBase64, setLogoName, setLogoMime)
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Square 1:1 aspect ratio recommended (PNG, JPG, WEBP max 5MB).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biz-cover" className="text-xs font-semibold">
                    Cover Banner Image
                  </Label>
                  <Input
                    id="biz-cover"
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    className="cursor-pointer text-xs"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) readFile(file, setCoverBase64, setCoverName, setCoverMime)
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Landscape 16:9 banner image recommended (PNG, JPG, WEBP max 5MB).
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="pt-4 border-t border-border/40 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Social Profiles
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="biz-facebook" className="text-xs font-semibold">
                    Facebook Page / URL
                  </Label>
                  <Input
                    id="biz-facebook"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="https://facebook.com/yourbusiness"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="biz-instagram" className="text-xs font-semibold">
                    Instagram Handle / URL
                  </Label>
                  <Input
                    id="biz-instagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@yourbusiness or https://instagram.com/yourbusiness"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end pt-4 border-t border-border/40">
              <Button type="submit" disabled={loading} className="bg-[#76b3b8] hover:bg-[#649fa4] text-white font-semibold">
                {loading ? "Saving Profile…" : "Save Business Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
