/** Shared helpers for Payload seed scripts. */

export function lexicalRichText(children: unknown[]): any {
  return {
    root: {
      type: "root",
      children,
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    },
  }
}

export function richParagraph(text: string): Record<string, unknown> {
  return {
    type: "paragraph",
    children: [
      {
        type: "text",
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text,
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    textFormat: 0,
    version: 1,
  }
}

export function richHeading(text: string, tag: "h1" | "h2" | "h3" = "h2"): Record<string, unknown> {
  return {
    type: "heading",
    children: [
      {
        type: "text",
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text,
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    tag,
    version: 1,
  }
}

/** Showcase NOG site URL for platform landing CTAs (local vs production). */
export function getNogShowcaseUrl(): string {
  if (process.env.NOG_SHOWCASE_URL) {
    return process.env.NOG_SHOWCASE_URL
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"
  const url = new URL(serverUrl)

  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    const port = url.port || "3000"
    return `http://nog.localhost:${port}`
  }

  return "https://nog.blockvibe.org"
}
