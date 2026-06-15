import { vi, describe, it, expect, beforeEach } from "vitest"
import { middleware } from "@/middleware"
import { NextResponse } from "next/server"

// Mock NextResponse to isolate middleware logic
vi.mock("next/server", () => {
  return {
    NextResponse: {
      next: vi.fn(() => ({ type: "next" })),
      rewrite: vi.fn((url) => ({ type: "rewrite", url })),
    },
  }
})

function createMockRequest(urlStr: string, host: string) {
  const url = new URL(urlStr)
  return {
    nextUrl: url,
    url: urlStr,
    headers: new Headers({ host }),
  } as any
}

describe("Middleware Multi-Tenant Routing", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Static & Internal Routes (Skipped)", () => {
    it("skips _next routes", () => {
      const req = createMockRequest(
        "http://localhost:3000/_next/static/chunks/main.js",
        "localhost:3000",
      )
      const res = middleware(req)
      expect(res).toEqual({ type: "next" })
      expect(NextResponse.next).toHaveBeenCalled()
    })

    it("skips API routes", () => {
      const req = createMockRequest("http://localhost:3000/api/graphql", "localhost:3000")
      const res = middleware(req)
      expect(res).toEqual({ type: "next" })
      expect(NextResponse.next).toHaveBeenCalled()
    })

    it("skips Admin routes", () => {
      const req = createMockRequest("http://localhost:3000/admin", "localhost:3000")
      const res = middleware(req)
      expect(res).toEqual({ type: "next" })
      expect(NextResponse.next).toHaveBeenCalled()
    })

    it("skips routes with file extensions", () => {
      const req = createMockRequest("http://localhost:3000/favicon.ico", "localhost:3000")
      const res = middleware(req)
      expect(res).toEqual({ type: "next" })
      expect(NextResponse.next).toHaveBeenCalled()
    })
  })

  describe("Tenant Resolution & Rewrites", () => {
    it("rewrites localhost root/default requests to /default", () => {
      const req = createMockRequest("http://localhost:3000/about", "localhost:3000")
      const res = middleware(req) as any
      expect(res?.type).toBe("rewrite")
      expect(res?.url.pathname).toBe("/default/about")
    })

    it("rewrites 127.0.0.1 root/default requests to /default", () => {
      const req = createMockRequest("http://127.0.0.1:3000/about", "127.0.0.1:3000")
      const res = middleware(req) as any
      expect(res?.type).toBe("rewrite")
      expect(res?.url.pathname).toBe("/default/about")
    })

    it("rewrites localhost subdomains to subdomain slug (e.g. nog.localhost -> nog)", () => {
      const req = createMockRequest("http://nog.localhost:3000/posts", "nog.localhost:3000")
      const res = middleware(req) as any
      expect(res?.type).toBe("rewrite")
      expect(res?.url.pathname).toBe("/nog/posts")
    })

    it("rewrites platform main site (info.blockvibe.org) to /default", () => {
      const req = createMockRequest("https://info.blockvibe.org/about", "info.blockvibe.org")
      const res = middleware(req) as any
      expect(res?.type).toBe("rewrite")
      expect(res?.url.pathname).toBe("/default/about")
    })

    it("rewrites platform root (blockvibe.org) to /default", () => {
      const req = createMockRequest("https://blockvibe.org/about", "blockvibe.org")
      const res = middleware(req) as any
      expect(res?.type).toBe("rewrite")
      expect(res?.url.pathname).toBe("/default/about")
    })

    it("rewrites platform subdomains to subdomain slug (e.g. nog.blockvibe.org -> nog)", () => {
      const req = createMockRequest("https://nog.blockvibe.org/contact", "nog.blockvibe.org")
      const res = middleware(req) as any
      expect(res?.type).toBe("rewrite")
      expect(res?.url.pathname).toBe("/nog/contact")
    })

    it("rewrites custom domains to full hostname (e.g. www.northofgranddsm.org)", () => {
      const req = createMockRequest(
        "https://www.northofgranddsm.org/posts/my-post",
        "www.northofgranddsm.org",
      )
      const res = middleware(req) as any
      expect(res?.type).toBe("rewrite")
      expect(res?.url.pathname).toBe("/www.northofgranddsm.org/posts/my-post")
    })
  })
})
