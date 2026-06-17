"use client"
import React from "react"
import dynamic from "next/dynamic"
import type { Form as FormType } from "@payloadcms/plugin-form-builder/types"
import type { DefaultTypedEditorState } from "@payloadcms/richtext-lexical"
import { FormBlock } from "@/blocks/Form/Component"
import { Facebook, Mail } from "lucide-react"

// Dynamically import LeafletMap with SSR disabled to prevent Node window/document errors during Next build
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] lg:h-[450px] bg-muted rounded-[0.8rem] flex items-center justify-center border border-border">
      <p className="text-muted-foreground animate-pulse">Loading Map...</p>
    </div>
  ),
})

export type ContactBlockProps = {
  newsletterForm: FormType
  newsletterIntro?: DefaultTypedEditorState
  questionForm: FormType
  questionIntro?: DefaultTypedEditorState
  showMap: boolean
  mapLatitude: number
  mapLongitude: number
  mapZoom: number
  mapBoundaryGeoJSON?: string | null
  facebookUrl?: string
  emailAddress?: string
}

export const ContactBlock: React.FC<ContactBlockProps> = (props) => {
  const {
    newsletterForm,
    newsletterIntro,
    questionForm,
    questionIntro,
    showMap,
    mapLatitude,
    mapLongitude,
    mapZoom,
    mapBoundaryGeoJSON,
    facebookUrl,
    emailAddress,
  } = props

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 2-Column Grid matching Weebly layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column - Forms (Newsletter + Question Form Stacked) */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          {newsletterForm && (
            <div className="w-full">
              <FormBlock
                form={newsletterForm}
                enableIntro={Boolean(newsletterIntro)}
                introContent={newsletterIntro}
              />
            </div>
          )}

          {questionForm && (
            <div className="w-full">
              <FormBlock
                form={questionForm}
                enableIntro={Boolean(questionIntro)}
                introContent={questionIntro}
              />
            </div>
          )}
        </div>

        {/* Right Column - Map */}
        <div className="lg:col-span-7">
          {showMap && (
            <div className="w-full">
              <LeafletMap
                latitude={mapLatitude}
                longitude={mapLongitude}
                zoom={mapZoom}
                boundaryGeoJSON={mapBoundaryGeoJSON}
              />
            </div>
          )}
        </div>
      </div>

      {/* Social Links Row below */}
      {(facebookUrl || emailAddress) && (
        <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-4 items-center justify-start">
          {facebookUrl && (
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 shadow-sm text-sm font-medium"
            >
              <Facebook className="w-4 h-4 text-blue-600" />
              <span>Facebook Page</span>
            </a>
          )}

          {emailAddress && (
            <a
              href={`mailto:${emailAddress}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 shadow-sm text-sm font-medium"
            >
              <Mail className="w-4 h-4 text-primary" />
              <span>Email Association</span>
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default ContactBlock
