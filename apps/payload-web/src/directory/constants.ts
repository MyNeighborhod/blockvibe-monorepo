/**
 * Shared constants for the tenant-enableable Business Directory feature.
 * Core fields mirror an Avenues-style listing; tenants can enable/require each via UI.
 */

export const DIRECTORY_CORE_FIELD_KEYS = [
  "name",
  "logo",
  "coverImage",
  "address",
  "phone",
  "email",
  "website",
  "hours",
  "about",
  "categories",
  "facebook",
  "instagram",
] as const

export type DirectoryCoreFieldKey = (typeof DIRECTORY_CORE_FIELD_KEYS)[number]

export type DirectoryFieldConfigRow = {
  fieldKey: DirectoryCoreFieldKey
  label?: string | null
  enabled?: boolean | null
  required?: boolean | null
  showOnCard?: boolean | null
  showOnDetail?: boolean | null
  showInRegistration?: boolean | null
}

export const DIRECTORY_CORE_FIELD_OPTIONS: { label: string; value: DirectoryCoreFieldKey }[] = [
  { label: "Business Name", value: "name" },
  { label: "Logo", value: "logo" },
  { label: "Cover Image", value: "coverImage" },
  { label: "Address", value: "address" },
  { label: "Phone", value: "phone" },
  { label: "Email", value: "email" },
  { label: "Website", value: "website" },
  { label: "Hours", value: "hours" },
  { label: "About", value: "about" },
  { label: "Categories", value: "categories" },
  { label: "Facebook", value: "facebook" },
  { label: "Instagram", value: "instagram" },
]

/** Default Avenues-style field configuration for new tenants who enable the directory. */
export const DEFAULT_DIRECTORY_FIELD_CONFIG: DirectoryFieldConfigRow[] = [
  {
    fieldKey: "name",
    label: "Business Name",
    enabled: true,
    required: true,
    showOnCard: true,
    showOnDetail: true,
    showInRegistration: true,
  },
  {
    fieldKey: "logo",
    label: "Logo",
    enabled: true,
    required: true,
    showOnCard: true,
    showOnDetail: true,
    showInRegistration: true,
  },
  {
    fieldKey: "coverImage",
    label: "Cover Image",
    enabled: true,
    required: false,
    showOnCard: true,
    showOnDetail: true,
    showInRegistration: true,
  },
  {
    fieldKey: "address",
    label: "Address",
    enabled: true,
    required: true,
    showOnCard: true,
    showOnDetail: true,
    showInRegistration: true,
  },
  {
    fieldKey: "phone",
    label: "Phone",
    enabled: true,
    required: false,
    showOnCard: false,
    showOnDetail: true,
    showInRegistration: true,
  },
  {
    fieldKey: "email",
    label: "Email",
    enabled: true,
    required: true,
    showOnCard: false,
    showOnDetail: true,
    showInRegistration: true,
  },
  {
    fieldKey: "website",
    label: "Website",
    enabled: true,
    required: false,
    showOnCard: true,
    showOnDetail: true,
    showInRegistration: true,
  },
  {
    fieldKey: "hours",
    label: "Hours",
    enabled: true,
    required: false,
    showOnCard: true,
    showOnDetail: true,
    showInRegistration: true,
  },
  {
    fieldKey: "about",
    label: "About",
    enabled: true,
    required: true,
    showOnCard: true,
    showOnDetail: true,
    showInRegistration: true,
  },
  {
    fieldKey: "categories",
    label: "Categories",
    enabled: true,
    required: false,
    showOnCard: true,
    showOnDetail: true,
    showInRegistration: true,
  },
  {
    fieldKey: "facebook",
    label: "Facebook",
    enabled: true,
    required: false,
    showOnCard: false,
    showOnDetail: true,
    showInRegistration: false,
  },
  {
    fieldKey: "instagram",
    label: "Instagram",
    enabled: true,
    required: false,
    showOnCard: false,
    showOnDetail: true,
    showInRegistration: false,
  },
]

export const DEFAULT_NOG_BUSINESS_CATEGORIES = [
  { title: "Food & Drink", slug: "food-drink" },
  { title: "Shopping", slug: "shopping" },
  { title: "Services", slug: "services" },
  { title: "Health & Wellness", slug: "health-wellness" },
  { title: "Arts & Culture", slug: "arts-culture" },
  { title: "Organizations", slug: "organizations" },
  { title: "Other", slug: "other" },
]

export function resolveFieldConfig(
  rows: DirectoryFieldConfigRow[] | null | undefined,
): Map<DirectoryCoreFieldKey, DirectoryFieldConfigRow> {
  const map = new Map<DirectoryCoreFieldKey, DirectoryFieldConfigRow>()
  for (const row of DEFAULT_DIRECTORY_FIELD_CONFIG) {
    map.set(row.fieldKey, { ...row })
  }
  for (const row of rows || []) {
    if (!row?.fieldKey) continue
    map.set(row.fieldKey, { ...map.get(row.fieldKey), ...row })
  }
  return map
}

export function isFieldEnabled(
  config: Map<DirectoryCoreFieldKey, DirectoryFieldConfigRow>,
  key: DirectoryCoreFieldKey,
): boolean {
  return config.get(key)?.enabled !== false
}

export function mapsDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
}
