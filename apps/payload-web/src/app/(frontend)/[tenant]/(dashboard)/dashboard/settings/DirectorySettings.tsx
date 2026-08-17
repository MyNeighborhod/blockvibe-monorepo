"use client"

import React, { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DEFAULT_DIRECTORY_FIELD_CONFIG,
  DIRECTORY_CORE_FIELD_OPTIONS,
  type DirectoryFieldConfigRow,
} from "@/directory/constants"
import {
  deleteBusinessCategoryAction,
  deleteDirectoryFieldAction,
  getDirectorySettingsAction,
  updateDirectoryFeatureAction,
  upsertBusinessCategoryAction,
  upsertDirectoryFieldAction,
} from "./directoryActions"

type Props = {
  tenantId: string | number
  tenantSlug: string
}

export function DirectorySettings({ tenantId, tenantSlug }: Props) {
  const [pending, startTransition] = useTransition()
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [enabled, setEnabled] = useState(false)
  const [pageTitle, setPageTitle] = useState("Businesses")
  const [pageIntro, setPageIntro] = useState("")
  const [allowPublicRegistration, setAllowPublicRegistration] = useState(true)
  const [showInNav, setShowInNav] = useState(true)
  const [fieldConfig, setFieldConfig] = useState<DirectoryFieldConfigRow[]>(DEFAULT_DIRECTORY_FIELD_CONFIG)
  const [categories, setCategories] = useState<any[]>([])
  const [customFields, setCustomFields] = useState<any[]>([])

  const [newCategoryTitle, setNewCategoryTitle] = useState("")
  const [newFieldLabel, setNewFieldLabel] = useState("")
  const [newFieldKey, setNewFieldKey] = useState("")
  const [newFieldType, setNewFieldType] = useState<"text" | "number" | "checkbox" | "select" | "url">(
    "text",
  )

  const reload = async () => {
    const res = await getDirectorySettingsAction(tenantId)
    if (!res.success) {
      setError(res.error || "Failed to load settings")
      return
    }
    setEnabled(Boolean(res.enableBusinessDirectory))
    setPageTitle(res.directorySettings?.pageTitle || "Businesses")
    setPageIntro(res.directorySettings?.pageIntro || "")
    setAllowPublicRegistration(res.directorySettings?.allowPublicRegistration !== false)
    setShowInNav(res.directorySettings?.showInNav !== false)
    setFieldConfig(
      res.directorySettings?.fieldConfig?.length
        ? res.directorySettings.fieldConfig
        : DEFAULT_DIRECTORY_FIELD_CONFIG,
    )
    setCategories(res.categories || [])
    setCustomFields(res.customFields || [])
    setLoaded(true)
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  const saveFeature = () => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await updateDirectoryFeatureAction(tenantId, tenantSlug, {
        enableBusinessDirectory: enabled,
        pageTitle,
        pageIntro,
        allowPublicRegistration,
        showInNav,
        fieldConfig,
      })
      if (!res.success) {
        setError(res.error || "Save failed")
        return
      }
      setSuccess(
        enabled
          ? "Directory enabled and settings saved. Public page: /businesses"
          : "Directory disabled for this neighborhood.",
      )
      await reload()
    })
  }

  const updateCoreRow = (index: number, patch: Partial<DirectoryFieldConfigRow>) => {
    setFieldConfig((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const addCategory = () => {
    if (!newCategoryTitle.trim()) return
    startTransition(async () => {
      const res = await upsertBusinessCategoryAction(tenantId, { title: newCategoryTitle })
      if (!res.success) {
        setError(res.error || "Failed to add category")
        return
      }
      setNewCategoryTitle("")
      await reload()
    })
  }

  const addCustomField = () => {
    if (!newFieldLabel.trim() || !newFieldKey.trim()) return
    startTransition(async () => {
      const res = await upsertDirectoryFieldAction(tenantId, {
        label: newFieldLabel,
        key: newFieldKey,
        fieldType: newFieldType,
        showInRegistration: true,
        showOnDetail: true,
        showOnCard: false,
      })
      if (!res.success) {
        setError(res.error || "Failed to add field")
        return
      }
      setNewFieldLabel("")
      setNewFieldKey("")
      setNewFieldType("text")
      await reload()
    })
  }

  if (!loaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Directory</CardTitle>
          <CardDescription>Loading directory settings…</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-sans text-xl">Business Directory</CardTitle>
          <CardDescription>
            Enable an Avenues-style local business directory for this neighborhood. Configure core
            fields, categories, and custom fields below — no code required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700">
              {success}
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span>
              <span className="font-semibold text-foreground">Enable Directory feature</span>
              <span className="block text-sm text-muted-foreground">
                Turns on the public directory page, CRM Local Businesses tab, and optional nav link.
              </span>
            </span>
          </label>

          {enabled && (
            <div className="space-y-4 border-t border-border/50 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="dir-title">Page title</Label>
                <Input
                  id="dir-title"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="Businesses of North Of Grand"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dir-intro">Page intro</Label>
                <Textarea
                  id="dir-intro"
                  value={pageIntro}
                  onChange={(e) => setPageIntro(e.target.value)}
                  placeholder="Support local. Explore businesses in our neighborhood."
                  className="min-h-[72px]"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={allowPublicRegistration}
                  onChange={(e) => setAllowPublicRegistration(e.target.checked)}
                />
                Allow public “Add Your Business” submissions
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showInNav}
                  onChange={(e) => setShowInNav(e.target.checked)}
                />
                Show Businesses link in site navigation
              </label>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={saveFeature} disabled={pending}>
              {pending ? "Saving…" : "Save directory settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Core fields</CardTitle>
              <CardDescription>
                Toggle which Avenues-style fields are used on cards, the detail view, and the
                registration form.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3">Field</th>
                    <th className="py-2 px-2">On</th>
                    <th className="py-2 px-2">Required</th>
                    <th className="py-2 px-2">Card</th>
                    <th className="py-2 px-2">Detail</th>
                    <th className="py-2 px-2">Form</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldConfig.map((row, index) => {
                    const opt = DIRECTORY_CORE_FIELD_OPTIONS.find((o) => o.value === row.fieldKey)
                    return (
                      <tr key={row.fieldKey} className="border-b border-border/40">
                        <td className="py-2 pr-3 font-medium">{opt?.label || row.fieldKey}</td>
                        {(
                          [
                            ["enabled", row.enabled !== false],
                            ["required", Boolean(row.required)],
                            ["showOnCard", Boolean(row.showOnCard)],
                            ["showOnDetail", row.showOnDetail !== false],
                            ["showInRegistration", row.showInRegistration !== false],
                          ] as const
                        ).map(([key, checked]) => (
                          <td key={key} className="py-2 px-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={row.fieldKey === "name" && key === "enabled"}
                              onChange={(e) => updateCoreRow(index, { [key]: e.target.checked })}
                            />
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted-foreground">
                Click <strong>Save directory settings</strong> above after changing core fields.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories</CardTitle>
              <CardDescription>
                Filter pills on the public directory (Food &amp; Drink, Shopping, etc.).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {categories.map((cat) => (
                  <li
                    key={cat.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm"
                  >
                    <span>{cat.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteBusinessCategoryAction(tenantId, cat.id)
                          await reload()
                        })
                      }
                    >
                      Delete
                    </Button>
                  </li>
                ))}
                {categories.length === 0 && (
                  <li className="text-sm text-muted-foreground">
                    No categories yet. Saving with Directory enabled seeds a default set.
                  </li>
                )}
              </ul>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={newCategoryTitle}
                  onChange={(e) => setNewCategoryTitle(e.target.value)}
                  placeholder="New category name"
                />
                <Button type="button" onClick={addCategory} disabled={pending || !newCategoryTitle.trim()}>
                  Add category
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom directory fields</CardTitle>
              <CardDescription>
                Add neighborhood-specific fields (e.g. “Outdoor seating”, “Accepts reservations”).
                Values are stored per business.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {customFields.map((field) => (
                  <li
                    key={field.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{field.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {field.key} · {field.fieldType}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteDirectoryFieldAction(tenantId, field.id)
                          await reload()
                        })
                      }
                    >
                      Delete
                    </Button>
                  </li>
                ))}
                {customFields.length === 0 && (
                  <li className="text-sm text-muted-foreground">No custom fields yet.</li>
                )}
              </ul>

              <div className="grid gap-2 sm:grid-cols-4">
                <Input
                  value={newFieldLabel}
                  onChange={(e) => {
                    setNewFieldLabel(e.target.value)
                    if (!newFieldKey) {
                      setNewFieldKey(
                        e.target.value
                          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, i) =>
                            i === 0 ? word.toLowerCase() : word.toUpperCase(),
                          )
                          .replace(/\s+/g, "")
                          .replace(/[^a-zA-Z0-9]/g, ""),
                      )
                    }
                  }}
                  placeholder="Label"
                />
                <Input
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  placeholder="camelCaseKey"
                />
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="select">Select</option>
                  <option value="url">URL</option>
                </select>
                <Button type="button" onClick={addCustomField} disabled={pending}>
                  Add field
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
