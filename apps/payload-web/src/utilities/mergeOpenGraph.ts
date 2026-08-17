import type { Metadata } from "next"
import { getServerSideURL } from "./getURL"

const defaultOpenGraph: Metadata["openGraph"] = {
  type: "website",
  description: "Official website of the North of Grand Neighborhood Association in Des Moines, Iowa.",
  images: [
    {
      url: `${getServerSideURL()}/og-nog.png`,
    },
  ],
  siteName: "North of Grand Neighborhood Association",
  title: "North of Grand Neighborhood Association",
}

export const mergeOpenGraph = (og?: Metadata["openGraph"]): Metadata["openGraph"] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
