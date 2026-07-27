import { getPayload, Payload } from "payload"
import config from "@/payload.config"
import { describe, it, beforeAll, expect, afterAll } from "vitest"
import { compileRulesToQuery, evaluateMailingList } from "@/utilities/crmEvaluator"

let payload: Payload
let testTenantId: number
let user1Id: number
let user2Id: number
let mailingListId: number

describe("CRM Evaluator Integration", () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    // Create a temporary test tenant
    const tenant = await payload.create({
      collection: "tenants",
      data: {
        name: "Test CRM Tenant",
        slug: `test-crm-${Date.now()}`,
        emailDeliveryDefault: "ses",
      },
    })
    testTenantId = tenant.id

    // Create custom field definitions for the tenant
    await payload.create({
      collection: "crm-fields",
      data: {
        label: "Dog Owner",
        key: "hasDog",
        fieldType: "checkbox",
        tenant: testTenantId,
      },
    })

    await payload.create({
      collection: "crm-fields",
      data: {
        label: "Category",
        key: "category",
        fieldType: "text",
        tenant: testTenantId,
      },
    })

    // Create test users under this tenant
    const u1 = await payload.create({
      collection: "users",
      data: {
        name: "Resident A (Dog Owner)",
        email: `resident-a-${Date.now()}@test.com`,
        password: "securepassword123",
        role: "contributor",
        status: "approved",
        memberType: "residential",
        tenants: [{ tenant: testTenantId }],
        customAttributes: {
          hasDog: true,
          category: "Retail",
        },
      },
    })
    user1Id = u1.id

    const u2 = await payload.create({
      collection: "users",
      data: {
        name: "Resident B (No Dog)",
        email: `resident-b-${Date.now()}@test.com`,
        password: "securepassword123",
        role: "contributor",
        status: "approved",
        memberType: "residential",
        tenants: [{ tenant: testTenantId }],
        customAttributes: {
          hasDog: false,
          category: "Services",
        },
      },
    })
    user2Id = u2.id
  })

  afterAll(async () => {
    // Clean up created resources
    if (mailingListId) {
      await payload.delete({
        collection: "mailing-lists",
        id: mailingListId,
      })
    }
    await payload.delete({
      collection: "users",
      where: {
        id: { in: [user1Id, user2Id] },
      },
    })
    await payload.delete({
      collection: "crm-fields",
      where: {
        tenant: { equals: testTenantId },
      },
    })
    await payload.delete({
      collection: "tenants",
      id: testTenantId,
    })
  })

  describe("compileRulesToQuery", () => {
    it("returns empty query for empty rules", () => {
      const query = compileRulesToQuery([])
      expect(query).toEqual({})
    })

    it("compiles standard fields rule", () => {
      const query = compileRulesToQuery([
        { field: "memberType", operator: "equals", value: "business" },
      ])
      expect(query).toEqual({ memberType: { equals: "business" } })
    })

    it("compiles custom attribute true boolean check", () => {
      const query = compileRulesToQuery([
        { field: "customAttributes.hasDog", operator: "equals", value: "true" },
      ])
      expect(query).toEqual({ "customAttributes.hasDog": { equals: true } })
    })

    it("compiles compound conditions as 'and'", () => {
      const query = compileRulesToQuery([
        { field: "memberType", operator: "equals", value: "residential" },
        { field: "customAttributes.category", operator: "contains", value: "Retail" },
      ])
      expect(query).toEqual({
        and: [
          { memberType: { equals: "residential" } },
          { "customAttributes.category": { contains: "Retail" } },
        ],
      })
    })
  })

  describe("evaluateMailingList", () => {
    it("evaluates a static mailing list successfully", async () => {
      const staticList = await payload.create({
        collection: "mailing-lists",
        data: {
          name: "Test Static List",
          type: "static",
          members: [user1Id],
          tenant: testTenantId,
        },
      })

      const resolved = await evaluateMailingList(staticList.id, testTenantId)
      expect(resolved.length).toBe(1)
      expect(resolved[0].id).toBe(user1Id)

      // Clean up static list
      await payload.delete({
        collection: "mailing-lists",
        id: staticList.id,
      })
    })

    it("evaluates a dynamic mailing list successfully using custom attributes", async () => {
      const dynamicList = await payload.create({
        collection: "mailing-lists",
        data: {
          name: "Test Dynamic Dog Owners List",
          type: "dynamic",
          rules: [
            { field: "customAttributes.hasDog", operator: "equals", value: "true" },
          ],
          tenant: testTenantId,
        },
      })
      mailingListId = dynamicList.id

      const resolved = await evaluateMailingList(dynamicList.id, testTenantId)
      expect(resolved.length).toBe(1)
      expect(resolved[0].id).toBe(user1Id)
      expect(resolved[0].name).toContain("Dog Owner")
    })
  })
})
