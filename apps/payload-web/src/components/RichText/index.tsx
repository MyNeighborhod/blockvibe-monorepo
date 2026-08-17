import React from "react"
import { MediaBlock } from "@/blocks/MediaBlock/Component"
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from "@payloadcms/richtext-lexical"
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as ConvertRichText,
} from "@payloadcms/richtext-lexical/react"

import { CodeBlock, CodeBlockProps } from "@/blocks/Code/Component"

import type {
  BannerBlock as BannerBlockProps,
  CallToActionBlock as CTABlockProps,
  MediaBlock as MediaBlockProps,
} from "@/payload-types"
import { BannerBlock } from "@/blocks/Banner/Component"
import { CallToActionBlock } from "@/blocks/CallToAction/Component"
import { SlideshowBlock, type SlideshowBlockType } from "@/blocks/SlideshowBlock/Component"
import { cn } from "@/utilities/ui"

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<
      CTABlockProps | MediaBlockProps | BannerBlockProps | CodeBlockProps | SlideshowBlockType
    >

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!
  if (typeof value !== "object") {
    throw new Error("Expected value to be an object")
  }
  const slug = value.slug
  return relationTo === "posts" ? `/posts/${slug}` : `/${slug}`
}

function renderAutoLinkedText(text: string) {
  if (!text) return null
  const urlRegex = /(https?:\/\/[^\s]+|tinyurl\.com\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null = null

  while ((match = urlRegex.exec(text)) !== null) {
    const rawMatch = match[0]
    const matchIndex = match.index

    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex))
    }

    // Strip trailing punctuation like ), ., ,, ;, :
    let cleanStr = rawMatch
    let trailingPunct = ""
    const punctMatch = rawMatch.match(/([),.;:]+)$/)
    if (punctMatch) {
      trailingPunct = punctMatch[1]
      cleanStr = rawMatch.slice(0, -trailingPunct.length)
    }

    let href = cleanStr
    if (cleanStr.includes("@") && !cleanStr.startsWith("http")) {
      href = `mailto:${cleanStr}`
    } else if (!cleanStr.startsWith("http://") && !cleanStr.startsWith("https://")) {
      href = `https://${cleanStr}`
    }

    parts.push(
      <React.Fragment key={matchIndex}>
        <a
          href={href}
          target={href.startsWith("mailto:") ? undefined : "_blank"}
          rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
          className="text-[#0a5c54] dark:text-emerald-400 font-semibold underline underline-offset-4 hover:text-emerald-600 transition-colors cursor-pointer"
        >
          {cleanStr}
        </a>
        {trailingPunct}
      </React.Fragment>,
    )

    lastIndex = urlRegex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? <>{parts}</> : text
}

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  text: ({ node, parent }) => {
    if (!node.text) return null
    if (parent && ("type" in parent) && (parent.type === "link" || parent.type === "autolink")) {
      return node.text
    }
    return renderAutoLinkedText(node.text)
  },
  blocks: {
    banner: ({ node }) => <BannerBlock className="col-start-2 mb-4" {...node.fields} />,
    mediaBlock: ({ node }) => (
      <MediaBlock
        className="col-start-1 col-span-3"
        imgClassName="m-0"
        {...node.fields}
        captionClassName="mx-auto max-w-[48rem]"
        enableGutter={false}
        disableInnerContainer={true}
      />
    ),
    code: ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
    cta: ({ node }) => <CallToActionBlock {...node.fields} />,
    slideshowBlock: ({ node }: { node: any }) => <SlideshowBlock {...(node.fields as any)} />,
  },
})

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = true, ...rest } = props
  return (
    <ConvertRichText
      converters={jsxConverters}
      className={cn(
        "payload-richtext",
        {
          container: enableGutter,
          "max-w-none": !enableGutter,
          "mx-auto prose md:prose-md dark:prose-invert": enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}
