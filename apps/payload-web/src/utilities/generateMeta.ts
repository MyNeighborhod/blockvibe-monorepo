import type { Metadata } from "next"

import type { Media, Page, Post, Config } from "../payload-types"

import { mergeOpenGraph } from "./mergeOpenGraph"
import { getServerSideURL } from "./getURL"

const getImageURL = (image?: Media | Config["db"]["defaultIDType"] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + "/og-nog.png"

  if (image && typeof image === "object" && "url" in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args

  const ogImage = getImageURL(doc?.meta?.image)

  const docTitle = doc?.meta?.title || doc?.title
  const title = docTitle
    ? docTitle.includes("North") || docTitle.includes("NOG")
      ? docTitle
      : docTitle + " | North of Grand"
    : "North of Grand Neighborhood Association"

  const description =
    doc?.meta?.description ||
    "Official website of the North of Grand Neighborhood Association in Des Moines, Iowa."

  return {
    description,
    openGraph: mergeOpenGraph({
      description,
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: Array.isArray(doc?.slug) ? doc?.slug.join("/") : "/",
    }),
    title,
  }
}
