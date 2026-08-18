export const colSpanMap: Record<string, string> = {
  full: "col-span-12",
  half: "col-span-12 md:col-span-6",
  oneThird: "col-span-12 md:col-span-4",
  twoThirds: "col-span-12 md:col-span-8",
}

export function extractTextFromRichText(richTextObj: any): string {
  if (!richTextObj) return ""
  if (typeof richTextObj === "string") return richTextObj

  const paragraphs: string[] = []
  function traverse(node: any) {
    if (!node) return
    if (node.text) {
      paragraphs.push(node.text)
    }
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse)
    }
  }

  if (richTextObj.root) {
    traverse(richTextObj.root)
  }
  return paragraphs.join("\n\n")
}

export interface PageItem {
  id: string | number
  title: string
  slug: string
  tenant?: any
  visualBuilderData?: any
  layout?: any[]
  hero?: any
}

export function convertPageLayoutToPuckContent(page: PageItem): any[] {
  if (page.visualBuilderData && page.visualBuilderData.content && page.visualBuilderData.content.length > 0) {
    return page.visualBuilderData.content
  }

  const generatedContent: any[] = []

  if (page.hero && page.hero.type && page.hero.type !== "none") {
    generatedContent.push({
      type: "HeroSection",
      props: {
        id: `hero-${page.id}`,
        title: page.title,
        subheading: `Welcome to ${page.title}`,
        align: "center",
      },
    })
  }

  if (page.layout && Array.isArray(page.layout)) {
    page.layout.forEach((block, idx) => {
      const blockId = `block-${page.id}-${idx}`

      if (block.blockType === "content") {
        if (block.columns && Array.isArray(block.columns)) {
          const count = Math.min(block.columns.length, 3)
          const contentProps: any = {
            id: `${blockId}-content`,
            columnsCount: String(count || 1),
          }

          block.columns.forEach((col: any, cIdx: number) => {
            if (cIdx >= 3) return
            const colKey = `col${cIdx + 1}`
            contentProps[`${colKey}Size`] = col.size || (cIdx === 0 ? "full" : "half")

            if (col.type === "media" && col.media) {
              const mediaObj = typeof col.media === "object" ? col.media : null
              contentProps[`${colKey}Type`] = "media"
              contentProps[`${colKey}Title`] = mediaObj?.alt || "Column Image"
              contentProps[`${colKey}ImageUrl`] = mediaObj?.url || "/media/nog/nog-board_orig-1.jpg"
              contentProps[`${colKey}Caption`] = mediaObj?.alt || ""
            } else {
              contentProps[`${colKey}Type`] = "text"
              contentProps[`${colKey}Title`] = col.title || (cIdx === 0 ? "About North of Grand" : "Our Mission")
              contentProps[`${colKey}Text`] = extractTextFromRichText(col.richText)
            }
          })

          generatedContent.push({
            type: "ContentSection",
            props: contentProps,
          })
        }
      } else if (block.blockType === "slideshowBlock") {
        generatedContent.push({
          type: "SlideshowSection",
          props: {
            id: `${blockId}-slideshow`,
            title: block.title || "Neighborhood Photo Gallery",
          },
        })
      } else if (block.blockType === "contactBlock") {
        generatedContent.push({
          type: "ContactSection",
          props: {
            id: `${blockId}-contact`,
            title: block.title || "Get in Touch with NOG",
            email: block.email || "info@northofgrand.org",
            address: block.address || "Des Moines, Iowa",
          },
        })
      } else if (block.blockType === "iframeBlock") {
        generatedContent.push({
          type: "IframeSection",
          props: {
            id: `${blockId}-iframe`,
            iframeUrl: block.iframeUrl || "https://calendar.google.com/calendar/embed?src=northofgrandpresident%40gmail.com",
            height: block.height || 600,
            title: block.title || "Yearly Calendar",
          },
        })
      } else if (block.blockType === "cta") {
        generatedContent.push({
          type: "CtaSection",
          props: {
            id: `${blockId}-cta`,
            heading: "Prefer Social Updates?",
            subheading: "Check out our Facebook page for detailed descriptions of meetings and local events.",
            buttonText: "View Facebook Page",
            buttonUrl: "https://facebook.com",
          },
        })
      }
    })
  }

  if (generatedContent.length === 0) {
    generatedContent.push({
      type: "ContentSection",
      props: {
        id: `default-${page.id}`,
        columnsCount: "1",
        col1Type: "text",
        col1Size: "full",
        col1Title: page.title,
        col1Text: `Visual editing layout for ${page.title} (${page.slug})`,
      },
    })
  }

  return generatedContent
}
