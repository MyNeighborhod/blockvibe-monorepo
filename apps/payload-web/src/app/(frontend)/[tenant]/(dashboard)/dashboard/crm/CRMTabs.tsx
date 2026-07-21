"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  getResidentsAction,
  updateResidentAction,
  getMailingListsAction,
  saveMailingListAction,
  deleteMailingListAction,
  getCRMFieldsAction,
  saveCRMFieldAction,
  deleteCRMFieldAction,
  evaluateMailingListEmailsAction,
  evaluateRulesAction,
} from "./actions"

interface CRMField {
  id: string | number
  label: string
  key: string
  fieldType: "text" | "number" | "checkbox" | "select"
  options?: { value: string; id?: string }[]
}

interface MailingList {
  id: string | number
  name: string
  description?: string | null
  type: "static" | "dynamic"
  members?: any[] | null
  rules?: any[] | null
}

interface Resident {
  id: string | number
  name?: string | null
  email: string
  role?: string | null
  status?: string | null
  isNeighbor?: boolean | null
  household?: string | null
  memberType: "residential" | "business" | "other"
  customAttributes?: any | null
  unsubscribed?: boolean | null
}

interface CRMTabsProps {
  tenantId: string | number
  initialFields: CRMField[]
  initialLists: MailingList[]
}

export function CRMTabs({ tenantId, initialFields, initialLists }: CRMTabsProps) {
  const [activeTab, setActiveTab] = useState<"directory" | "lists" | "fields">("directory")

  // --- CRM Fields State ---
  const [fields, setFields] = useState<CRMField[]>(initialFields)
  const [editingField, setEditingField] = useState<CRMField | null>(null)
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false)
  const [fieldLabel, setFieldLabel] = useState("")
  const [fieldType, setFieldType] = useState<"text" | "number" | "checkbox" | "select">("text")
  const [fieldOptions, setFieldOptions] = useState<string>("")

  // --- Mailing Lists State ---
  const [lists, setLists] = useState<MailingList[]>(initialLists)
  const [editingList, setEditingList] = useState<MailingList | null>(null)
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [listName, setListName] = useState("")
  const [listDescription, setListDescription] = useState("")
  const [listType, setListType] = useState<"static" | "dynamic">("static")
  const [staticMembers, setStaticMembers] = useState<(string | number)[]>([])
  const [dynamicRules, setDynamicRules] = useState<{ field: string; operator: string; value: string }[]>([])
  const [listPreviewLoading, setListPreviewLoading] = useState(false)
  const [listPreviewMembers, setListPreviewMembers] = useState<any[]>([])

  // --- Residents Directory State ---
  const [residents, setResidents] = useState<Resident[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [editingResident, setEditingResident] = useState<Resident | null>(null)
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false)
  const [residentName, setResidentName] = useState("")
  const [residentMemberType, setResidentMemberType] = useState<"residential" | "business" | "other">("residential")
  const [residentHousehold, setResidentHousehold] = useState("")
  const [residentCustomAttrs, setResidentCustomAttrs] = useState<Record<string, any>>({})

  // Load residents based on filters
  const fetchResidents = useCallback(async () => {
    setLoading(true)
    const res = await getResidentsAction(tenantId, searchTerm, typeFilter, 10, page)
    if (res.success && res.docs) {
      setResidents(res.docs as Resident[])
      setTotalPages(res.totalPages || 1)
    }
    setLoading(false)
  }, [tenantId, searchTerm, typeFilter, page])

  useEffect(() => {
    fetchResidents()
  }, [fetchResidents])

  // Load dynamic preview list when rules are changed
  useEffect(() => {
    if (listType !== "dynamic" || !isListModalOpen) {
      setListPreviewMembers([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setListPreviewLoading(true)
      const res = await evaluateRulesAction(tenantId, dynamicRules)
      if (res.success && res.members) {
        setListPreviewMembers(res.members)
      }
      setListPreviewLoading(false)
    }, 400) // debounce evaluation to avoid spamming the DB on key presses

    return () => clearTimeout(delayDebounce)
  }, [tenantId, listType, isListModalOpen, dynamicRules])

  // --- CRM Fields Handlers ---
  const handleOpenAddField = () => {
    setEditingField(null)
    setFieldLabel("")
    setFieldType("text")
    setFieldOptions("")
    setIsFieldModalOpen(true)
  }

  const handleOpenEditField = (field: CRMField) => {
    setEditingField(field)
    setFieldLabel(field.label)
    setFieldType(field.fieldType)
    setFieldOptions(field.options?.map((o) => o.value).join(", ") || "")
    setIsFieldModalOpen(true)
  }

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault()
    // Generate key from label
    const key = fieldLabel
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
      .replace(/\s+/g, "")

    const optionsArray = fieldOptions
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((o) => ({ value: o }))

    const res = await saveCRMFieldAction(tenantId, {
      id: editingField?.id,
      label: fieldLabel,
      key: editingField?.key || key,
      fieldType,
      options: optionsArray,
    })

    if (res.success) {
      setIsFieldModalOpen(false)
      // Refresh fields list
      const fieldsRes = await getCRMFieldsAction(tenantId)
      if (fieldsRes.success && fieldsRes.docs) {
        setFields(fieldsRes.docs as CRMField[])
      }
    } else {
      alert(res.error || "Failed to save field.")
    }
  }

  const handleDeleteField = async (fieldId: string | number) => {
    if (!confirm("Are you sure you want to delete this custom field? This will not delete data stored on residents but the field will no longer be managed.")) {
      return
    }
    const res = await deleteCRMFieldAction(tenantId, fieldId)
    if (res.success) {
      setFields((prev) => prev.filter((f) => f.id !== fieldId))
    } else {
      alert(res.error || "Failed to delete field.")
    }
  }

  // --- Residents Directory Handlers ---
  const handleOpenEditResident = (resident: Resident) => {
    setEditingResident(resident)
    setResidentName(resident.name || "")
    setResidentMemberType(resident.memberType)
    setResidentHousehold(resident.household || "")
    setResidentCustomAttrs(resident.customAttributes || {})
    setIsResidentModalOpen(true)
  }

  const handleSaveResident = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingResident) return

    const res = await updateResidentAction(editingResident.id, tenantId, {
      name: residentName,
      memberType: residentMemberType,
      household: residentHousehold,
      customAttributes: residentCustomAttrs,
    })

    if (res.success) {
      setIsResidentModalOpen(false)
      fetchResidents()
    } else {
      alert(res.error || "Failed to update resident.")
    }
  }

  const handleCustomAttrChange = (key: string, val: any) => {
    setResidentCustomAttrs((prev) => ({
      ...prev,
      [key]: val,
    }))
  }

  // --- Mailing Lists Handlers ---
  const handleOpenAddList = () => {
    setEditingList(null)
    setListName("")
    setListDescription("")
    setListType("static")
    setStaticMembers([])
    setDynamicRules([{ field: "memberType", operator: "equals", value: "residential" }])
    setListPreviewMembers([])
    setIsListModalOpen(true)
  }

  const handleOpenEditList = async (list: MailingList) => {
    setEditingList(list)
    setListName(list.name)
    setListDescription(list.description || "")
    setListType(list.type)

    if (list.type === "static") {
      const memberIds = list.members?.map((m: any) => typeof m === "object" ? m.id : m) || []
      setStaticMembers(memberIds)
      setDynamicRules([])
    } else {
      setStaticMembers([])
      setDynamicRules((list.rules as any[]) || [])
      // Fetch dynamic preview
      setListPreviewLoading(true)
      const previewRes = await evaluateMailingListEmailsAction(tenantId, list.id)
      if (previewRes.success && previewRes.members) {
        setListPreviewMembers(previewRes.members)
      }
      setListPreviewLoading(false)
    }

    setIsListModalOpen(true)
  }

  const handleSaveList = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await saveMailingListAction(tenantId, {
      id: editingList?.id,
      name: listName,
      description: listDescription,
      type: listType,
      members: listType === "static" ? staticMembers : [],
      rules: listType === "dynamic" ? dynamicRules : [],
    })

    if (res.success) {
      setIsListModalOpen(false)
      const listsRes = await getMailingListsAction(tenantId)
      if (listsRes.success && listsRes.docs) {
        setLists(listsRes.docs as MailingList[])
      }
    } else {
      alert(res.error || "Failed to save mailing list.")
    }
  }

  const handleDeleteList = async (listId: string | number) => {
    if (!confirm("Are you sure you want to delete this mailing list?")) return
    const res = await deleteMailingListAction(tenantId, listId)
    if (res.success) {
      setLists((prev) => prev.filter((l) => l.id !== listId))
    } else {
      alert(res.error || "Failed to delete list.")
    }
  }

  const handleAddRule = () => {
    setDynamicRules((prev) => [...prev, { field: "memberType", operator: "equals", value: "" }])
  }

  const handleRemoveRule = (index: number) => {
    setDynamicRules((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRuleChange = (index: number, key: "field" | "operator" | "value", val: string) => {
    setDynamicRules((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r
        const updated = { ...r, [key]: val }
        // Default operator and reset value if field changes
        if (key === "field") {
          updated.operator = "equals"
          updated.value = ""
        }
        return updated
      })
    )
  }

  const handleToggleStaticMember = (residentId: string | number) => {
    setStaticMembers((prev) =>
      prev.includes(residentId) ? prev.filter((id) => id !== residentId) : [...prev, residentId]
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs Selector */}
      <div className="flex border-b border-border/40 pb-px">
        <button
          onClick={() => setActiveTab("directory")}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
            activeTab === "directory"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Resident Directory
        </button>
        <button
          onClick={() => setActiveTab("lists")}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
            activeTab === "lists"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Mailing Lists
        </button>
        <button
          onClick={() => setActiveTab("fields")}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
            activeTab === "fields"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Custom Attributes
        </button>
      </div>

      {/* --- TAB 1: DIRECTORY --- */}
      {activeTab === "directory" && (
        <Card className="backdrop-blur-md bg-card/60 border border-border/40">
          <CardHeader>
            <CardTitle className="font-sans text-xl">Directory List</CardTitle>
            <CardDescription>
              View and manage your neighborhood members, business registrations, and tags.
            </CardDescription>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
              <Input
                placeholder="Search by name, email or household..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="max-w-xs"
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="filter-member-type" className="text-sm text-muted-foreground">Type:</Label>
                <select
                  id="filter-member-type"
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value)
                    setPage(1)
                  }}
                  className="p-2 text-sm bg-background border border-border rounded-lg"
                >
                  <option value="all">All Members</option>
                  <option value="residential">Residential Members</option>
                  <option value="business">Business Members</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-medium">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Household</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Loading directory...
                      </td>
                    </tr>
                  ) : residents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No members found.
                      </td>
                    </tr>
                  ) : (
                    residents.map((r) => (
                      <tr key={r.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <td className="p-4 font-medium text-foreground">{r.name || "Unnamed"}</td>
                        <td className="p-4 text-muted-foreground">
                          {r.email}
                          {r.unsubscribed && (
                            <span className="ml-2 px-1.5 py-0.5 bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 text-[10px] font-semibold rounded">
                              Unsubscribed
                            </span>
                          )}
                        </td>
                        <td className="p-4 uppercase text-xs tracking-wider">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            r.memberType === "business"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : r.memberType === "residential"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          }`}>
                            {r.memberType}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">{r.household || "N/A"}</td>
                        <td className="p-4 capitalize">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            r.status === "approved"
                              ? "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300"
                              : r.status === "pending"
                              ? "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300"
                              : "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300"
                          }`}>
                            {r.status || "pending"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEditResident(r)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t border-border/40 p-4">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* --- TAB 2: MAILING LISTS --- */}
      {activeTab === "lists" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleOpenAddList}>Create Mailing List</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lists.map((l) => (
              <Card key={l.id} className="backdrop-blur-md bg-card/60 border border-border/40">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-sans text-lg">{l.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {l.description || "No description provided."}
                      </CardDescription>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      l.type === "dynamic"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                        : "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                    }`}>
                      {l.type}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="text-sm">
                  {l.type === "dynamic" ? (
                    <div className="space-y-1">
                      <span className="font-medium text-xs text-muted-foreground uppercase tracking-wider block">Rules:</span>
                      <div className="bg-muted/40 p-2 rounded-lg space-y-1 text-xs">
                        {(l.rules as any[])?.map((rule, idx) => {
                          const displayField = fields.find((f) => f.key === rule.field || `customAttributes.${f.key}` === rule.field)?.label || rule.field
                          return (
                            <div key={idx} className="flex items-center gap-1 text-muted-foreground">
                              <span className="font-semibold text-foreground">{displayField}</span>
                              <span className="italic">{rule.operator}</span>
                              <span className="font-semibold text-foreground">"{rule.value}"</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-muted-foreground">
                        Static Members count: <strong className="text-foreground">{(l.members || []).length}</strong>
                      </span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t border-border/20 pt-4">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEditList(l)}>
                    Configure
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteList(l.id)}>
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: CUSTOM FIELDS --- */}
      {activeTab === "fields" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleOpenAddField}>Add Custom Field</Button>
          </div>
          <Card className="backdrop-blur-md bg-card/60 border border-border/40">
            <CardHeader>
              <CardTitle className="font-sans text-xl">CRM Fields Schema</CardTitle>
              <CardDescription>
                Define new custom properties for contacts in this neighborhood (e.g. membership tiers, tags).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-medium">
                    <th className="p-4">Label</th>
                    <th className="p-4">Database Key</th>
                    <th className="p-4">Field Type</th>
                    <th className="p-4">Options</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No custom fields defined. Create one above to start custom-tagging!
                      </td>
                    </tr>
                  ) : (
                    fields.map((f) => (
                      <tr key={f.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <td className="p-4 font-medium text-foreground">{f.label}</td>
                        <td className="p-4 font-mono text-xs text-muted-foreground">{f.key}</td>
                        <td className="p-4 capitalize">{f.fieldType}</td>
                        <td className="p-4 text-muted-foreground max-w-xs truncate">
                          {f.fieldType === "select"
                            ? f.options?.map((o) => o.value).join(", ")
                            : "N/A"}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEditField(f)}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteField(f.id)}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- MODAL 1: RESIDENT EDITOR --- */}
      {isResidentModalOpen && editingResident && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-card border border-border/80 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsResidentModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground text-lg"
            >
              ✕
            </button>
            <CardHeader>
              <CardTitle className="font-sans text-2xl">Edit Resident CRM Profile</CardTitle>
              <CardDescription>
                Modify details for {editingResident.email}.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveResident}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resName">Full Name</Label>
                  <Input
                    id="resName"
                    value={residentName}
                    onChange={(e) => setResidentName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resType">Member Type</Label>
                  <select
                    id="resType"
                    value={residentMemberType}
                    onChange={(e) => setResidentMemberType(e.target.value as any)}
                    className="w-full p-2 bg-background border border-border rounded-lg text-sm"
                  >
                    <option value="residential">Residential Member</option>
                    <option value="business">Business Member</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resHousehold">Household / Address</Label>
                  <Input
                    id="resHousehold"
                    placeholder="e.g. 104 Elm St"
                    value={residentHousehold}
                    onChange={(e) => setResidentHousehold(e.target.value)}
                  />
                </div>

                {/* DYNAMIC CUSTOM ATTRIBUTES */}
                {fields.length > 0 && (
                  <div className="border-t border-border/40 pt-4 mt-4 space-y-4">
                    <h4 className="font-medium text-sm text-foreground">Custom Attributes</h4>
                    {fields.map((field) => {
                      const value = residentCustomAttrs[field.key] ?? ""
                      return (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={`custom-${field.key}`}>{field.label}</Label>
                          {field.fieldType === "text" && (
                            <Input
                              id={`custom-${field.key}`}
                              value={value}
                              onChange={(e) => handleCustomAttrChange(field.key, e.target.value)}
                            />
                          )}
                          {field.fieldType === "number" && (
                            <Input
                              id={`custom-${field.key}`}
                              type="number"
                              value={value}
                              onChange={(e) => handleCustomAttrChange(field.key, Number(e.target.value))}
                            />
                          )}
                          {field.fieldType === "checkbox" && (
                            <div className="flex items-center gap-2">
                              <input
                                id={`custom-${field.key}`}
                                type="checkbox"
                                checked={!!value}
                                onChange={(e) => handleCustomAttrChange(field.key, e.target.checked)}
                                className="h-4 w-4 rounded border-border"
                              />
                              <span className="text-xs text-muted-foreground">Enabled</span>
                            </div>
                          )}
                          {field.fieldType === "select" && (
                            <select
                              id={`custom-${field.key}`}
                              value={value}
                              onChange={(e) => handleCustomAttrChange(field.key, e.target.value)}
                              className="w-full p-2 bg-background border border-border rounded-lg text-sm"
                            >
                              <option value="">Select option...</option>
                              {field.options?.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.value}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-border/40 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsResidentModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* --- MODAL 2: CUSTOM FIELD EDITOR --- */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-card border border-border/80 shadow-2xl relative">
            <button
              onClick={() => setIsFieldModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground text-lg"
            >
              ✕
            </button>
            <CardHeader>
              <CardTitle className="font-sans text-2xl">
                {editingField ? "Edit Custom Field" : "Create Custom Field"}
              </CardTitle>
              <CardDescription>
                Custom fields will appear on all contact profiles in this neighborhood.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveField}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fieldLabel">Field Label</Label>
                  <Input
                    id="fieldLabel"
                    placeholder="e.g. Dog Owner"
                    value={fieldLabel}
                    onChange={(e) => setFieldLabel(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fieldSelectType">Field Type</Label>
                  <select
                    id="fieldSelectType"
                    value={fieldType}
                    disabled={!!editingField}
                    onChange={(e) => setFieldType(e.target.value as any)}
                    className="w-full p-2 bg-background border border-border rounded-lg text-sm"
                  >
                    <option value="text">Text Input</option>
                    <option value="number">Number Input</option>
                    <option value="checkbox">Checkbox Toggle</option>
                    <option value="select">Dropdown Select</option>
                  </select>
                </div>
                {fieldType === "select" && (
                  <div className="space-y-2">
                    <Label htmlFor="fieldOptions">Options (Comma separated)</Label>
                    <Input
                      id="fieldOptions"
                      placeholder="e.g. Gold, Silver, Bronze"
                      value={fieldOptions}
                      onChange={(e) => setFieldOptions(e.target.value)}
                      required
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-border/40 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsFieldModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Field</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* --- MODAL 3: MAILING LIST EDITOR --- */}
      {isListModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-card border border-border/80 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsListModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground text-lg"
            >
              ✕
            </button>
            <CardHeader>
              <CardTitle className="font-sans text-2xl">
                {editingList ? "Configure Mailing List" : "Create Mailing List"}
              </CardTitle>
              <CardDescription>
                Define who should be included in this broadcast group.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveList}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="listName">Mailing List Name</Label>
                  <Input
                    id="listName"
                    placeholder="e.g. Business Owners"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="listDesc">Description</Label>
                  <Input
                    id="listDesc"
                    placeholder="e.g. Residents who operate businesses in the area"
                    value={listDescription}
                    onChange={(e) => setListDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="listSelectType">List Type</Label>
                  <select
                    id="listSelectType"
                    value={listType}
                    onChange={(e) => setListType(e.target.value as any)}
                    className="w-full p-2 bg-background border border-border rounded-lg text-sm"
                  >
                    <option value="static">Static List (Manually Added)</option>
                    <option value="dynamic">Dynamic List (Rules Filtered)</option>
                  </select>
                </div>

                {/* STATIC LIST BUILDER */}
                {listType === "static" && (
                  <div className="space-y-2">
                    <Label>Select Members</Label>
                    <div className="max-h-60 overflow-y-auto border border-border/40 rounded-lg p-2 space-y-2 bg-muted/20">
                      {residents.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No residents loaded.</p>
                      ) : (
                        residents.map((r) => {
                          const isChecked = staticMembers.includes(r.id)
                          return (
                            <div key={r.id} className="flex items-center gap-3 text-sm p-1">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleStaticMember(r.id)}
                                className="h-4 w-4 rounded border-border"
                              />
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">{r.name || "Unnamed"}</span>
                                <span className="text-[10px] text-muted-foreground">{r.email} ({r.memberType})</span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* DYNAMIC LIST RULES BUILDER */}
                {listType === "dynamic" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Define Filter Rules (All rules must match - AND logic)</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddRule}>
                        Add Condition
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {dynamicRules.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2 italic">
                          No conditions added. This list will include all subscribed residents.
                        </p>
                      ) : (
                        dynamicRules.map((rule, idx) => {
                          return (
                            <div key={idx} className="flex items-center gap-2 bg-muted/40 p-2 rounded-lg">
                              <select
                                value={rule.field}
                                onChange={(e) => handleRuleChange(idx, "field", e.target.value)}
                                className="p-1 text-xs bg-background border border-border rounded rule-field-select"
                              >
                                <option value="memberType">Member Type</option>
                                <option value="household">Household Address</option>
                                <option value="status">Status</option>
                                {fields.map((f) => (
                                  <option key={f.key} value={`customAttributes.${f.key}`}>
                                    {f.label} (Custom)
                                  </option>
                                ))}
                              </select>

                              <select
                                value={rule.operator}
                                onChange={(e) => handleRuleChange(idx, "operator", e.target.value)}
                                className="p-1 text-xs bg-background border border-border rounded rule-operator-select"
                              >
                                <option value="equals">Equals</option>
                                <option value="not_equals">Not Equals</option>
                                <option value="contains">Contains</option>
                                <option value="exists">Exists</option>
                                <option value="not_exists">Does Not Exist</option>
                              </select>

                              {rule.operator !== "exists" && rule.operator !== "not_exists" && (
                                <>
                                  {rule.field === "memberType" ? (
                                    <select
                                      value={rule.value}
                                      onChange={(e) => handleRuleChange(idx, "value", e.target.value)}
                                      className="p-1 text-xs bg-background border border-border rounded rule-value-select"
                                    >
                                      <option value="">Select type...</option>
                                      <option value="residential">Residential</option>
                                      <option value="business">Business</option>
                                      <option value="other">Other</option>
                                    </select>
                                  ) : rule.field === "status" ? (
                                    <select
                                      value={rule.value}
                                      onChange={(e) => handleRuleChange(idx, "value", e.target.value)}
                                      className="p-1 text-xs bg-background border border-border rounded rule-value-select"
                                    >
                                      <option value="">Select status...</option>
                                      <option value="approved">Approved</option>
                                      <option value="pending">Pending</option>
                                      <option value="rejected">Rejected</option>
                                    </select>
                                  ) : (
                                    <Input
                                      value={rule.value}
                                      placeholder="Value..."
                                      onChange={(e) => handleRuleChange(idx, "value", e.target.value)}
                                      className="h-8 max-w-xs text-xs rule-value-input"
                                    />
                                  )}
                                </>
                              )}

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveRule(idx)}
                                className="text-destructive h-auto p-1"
                              >
                                ✕
                              </Button>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Preview Area */}
                    <div className="border-t border-border/40 pt-4 mt-2">
                      <h4 className="font-semibold text-sm text-foreground mb-2">Matching Members Preview</h4>
                      {listPreviewLoading ? (
                        <p className="text-xs text-muted-foreground">Evaluating rules...</p>
                      ) : listPreviewMembers.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No members currently match these rules.</p>
                      ) : (
                        <div className="max-h-40 overflow-y-auto bg-muted/10 p-2 rounded border border-border/20 text-xs space-y-1">
                          {listPreviewMembers.map((m) => (
                            <div key={m.id} className="text-muted-foreground preview-member-item">
                              <span className="font-semibold text-foreground">{m.name || "Unnamed"}</span> ({m.email}) - {m.memberType}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-border/40 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsListModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save List</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
