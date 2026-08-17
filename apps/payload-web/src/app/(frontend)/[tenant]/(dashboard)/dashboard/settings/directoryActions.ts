"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"
import { revalidatePath } from "next/cache"
import {
  DEFAULT_DIRECTORY_FIELD_CONFIG,
  DEFAULT_NOG_BUSINESS_CATEGORIES,
  type DirectoryFieldConfigRow,
} from "@/directory/constants"

async function assertTenantAdmin(tenantId: string | number) {
  // Access is enforced by dashboard page role check; still validate tenant exists.
  const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
  const payload = await getPayload({ config: configPromise })
  const tenant = await payload.findByID({
    collection: "tenants",
    id: numericTenantId,
  })
  if (!tenant) throw new Error("Tenant not found.")
  return { payload, tenant, numericTenantId }
}

export async function getDirectorySettingsAction(tenantId: string | number) {
  try {
    const { tenant, numericTenantId, payload } = await assertTenantAdmin(tenantId)

    const [categories, customFields] = await Promise.all([
      payload.find({
        collection: "business-categories",
        where: { tenant: { equals: numericTenantId } },
        sort: "sortOrder",
        limit: 200,
        depth: 0,
      }),
      payload.find({
        collection: "directory-fields",
        where: { tenant: { equals: numericTenantId } },
        sort: "label",
        limit: 200,
        depth: 0,
      }),
    ])

    return {
      success: true,
      enableBusinessDirectory: Boolean((tenant as any).enableBusinessDirectory),
      directorySettings: (tenant as any).directorySettings || {
        pageTitle: "Businesses",
        pageIntro: "",
        allowPublicRegistration: true,
        showInNav: true,
        fieldConfig: DEFAULT_DIRECTORY_FIELD_CONFIG,
      },
      categories: categories.docs,
      customFields: customFields.docs,
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load directory settings." }
  }
}

export async function updateDirectoryFeatureAction(
  tenantId: string | number,
  tenantSlug: string,
  data: {
    enableBusinessDirectory: boolean
    pageTitle?: string
    pageIntro?: string
    allowPublicRegistration?: boolean
    showInNav?: boolean
    fieldConfig?: DirectoryFieldConfigRow[]
  },
) {
  try {
    const { payload, numericTenantId } = await assertTenantAdmin(tenantId)

    await payload.update({
      collection: "tenants",
      id: numericTenantId,
      data: {
        enableBusinessDirectory: data.enableBusinessDirectory,
        directorySettings: {
          pageTitle: data.pageTitle || "Businesses",
          pageIntro: data.pageIntro || "",
          allowPublicRegistration: data.allowPublicRegistration !== false,
          showInNav: data.showInNav !== false,
          fieldConfig: data.fieldConfig?.length
            ? data.fieldConfig
            : DEFAULT_DIRECTORY_FIELD_CONFIG,
        },
      },
    })

    // When enabling for the first time, seed default categories if none exist.
    if (data.enableBusinessDirectory) {
      const existing = await payload.find({
        collection: "business-categories",
        where: { tenant: { equals: numericTenantId } },
        limit: 1,
      })
      if (existing.docs.length === 0) {
        for (let i = 0; i < DEFAULT_NOG_BUSINESS_CATEGORIES.length; i++) {
          const cat = DEFAULT_NOG_BUSINESS_CATEGORIES[i]
          await payload.create({
            collection: "business-categories",
            data: {
              title: cat.title,
              slug: cat.slug,
              sortOrder: i,
              tenant: numericTenantId,
            },
          })
        }
      }
    }

    revalidatePath(`/${tenantSlug}/businesses`)
    revalidatePath(`/${tenantSlug}/dashboard/settings`)
    revalidatePath(`/${tenantSlug}/dashboard/crm`)

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update directory settings." }
  }
}

export async function upsertDirectoryFieldAction(
  tenantId: string | number,
  data: {
    id?: string | number
    label: string
    key: string
    fieldType: "text" | "number" | "checkbox" | "select" | "url"
    options?: { value: string }[]
    required?: boolean
    showInRegistration?: boolean
    showOnCard?: boolean
    showOnDetail?: boolean
  },
) {
  try {
    const { payload, numericTenantId } = await assertTenantAdmin(tenantId)
    const key = data.key.trim().replace(/\s+/g, "")
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
      throw new Error("Field key must be camelCase (letters/numbers only, start with a letter).")
    }

    const body = {
      label: data.label.trim(),
      key,
      fieldType: data.fieldType,
      options: data.options || [],
      required: Boolean(data.required),
      showInRegistration: data.showInRegistration !== false,
      showOnCard: Boolean(data.showOnCard),
      showOnDetail: data.showOnDetail !== false,
      tenant: numericTenantId,
    }

    if (data.id) {
      await payload.update({
        collection: "directory-fields",
        id: data.id,
        data: body,
      })
    } else {
      await payload.create({
        collection: "directory-fields",
        data: body,
      })
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save directory field." }
  }
}

export async function deleteDirectoryFieldAction(tenantId: string | number, fieldId: string | number) {
  try {
    await assertTenantAdmin(tenantId)
    const payload = await getPayload({ config: configPromise })
    await payload.delete({
      collection: "directory-fields",
      id: fieldId,
    })
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete directory field." }
  }
}

export async function upsertBusinessCategoryAction(
  tenantId: string | number,
  data: { id?: string | number; title: string; sortOrder?: number },
) {
  try {
    const { payload, numericTenantId } = await assertTenantAdmin(tenantId)
    const title = data.title.trim()
    if (!title) throw new Error("Category title is required.")

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    if (data.id) {
      await payload.update({
        collection: "business-categories",
        id: data.id,
        data: { title, sortOrder: data.sortOrder ?? 0 },
      })
    } else {
      await payload.create({
        collection: "business-categories",
        data: {
          title,
          slug,
          sortOrder: data.sortOrder ?? 0,
          tenant: numericTenantId,
        },
      })
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save category." }
  }
}

export async function deleteBusinessCategoryAction(
  tenantId: string | number,
  categoryId: string | number,
) {
  try {
    await assertTenantAdmin(tenantId)
    const payload = await getPayload({ config: configPromise })
    await payload.delete({
      collection: "business-categories",
      id: categoryId,
    })
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete category." }
  }
}
