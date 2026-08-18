import React from "react"
import type { Config as PuckConfig } from "@puckeditor/core"

import { SlideshowBlock } from "@/blocks/SlideshowBlock/Component"
import { ContactBlock } from "@/blocks/ContactBlock/Component"
import { IframeBlock } from "@/blocks/IframeBlock/Component"
import { colSpanMap } from "./utils"
import { MediaPickerField } from "./MediaPickerModal"

export const puckConfig: PuckConfig = {
  components: {
    HeroSection: {
      fields: {
        title: { type: "text" },
        subheading: { type: "textarea" },
        align: {
          type: "select",
          options: [
            { label: "Left Aligned", value: "left" },
            { label: "Centered", value: "center" },
          ],
        },
      },
      defaultProps: {
        title: "Welcome to Our Community",
        subheading: "Connecting neighbors, supporting local businesses, and hosting community events.",
        align: "center",
      },
      render: ({ title, subheading, align }) => (
        <section className={`theme-nog py-10 px-8 my-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 text-${align || "center"}`}>
          <h1 className="text-3xl md:text-4xl font-serif text-[#42514c] font-bold mb-3">{title}</h1>
          <p className="text-base text-[#7b8c89] max-w-2xl mx-auto leading-relaxed">{subheading}</p>
        </section>
      ),
    },

    ContentSection: {
      fields: {
        columnsCount: {
          type: "select",
          options: [
            { label: "1 Column (Full Width)", value: "1" },
            { label: "2 Columns (Grid)", value: "2" },
            { label: "3 Columns (Grid)", value: "3" },
          ],
        },

        // --- COLUMN 1 ---
        col1Type: {
          type: "select",
          options: [
            { label: "📝 Text Column", value: "text" },
            { label: "🖼️ Media Image Column", value: "media" },
          ],
        },
        col1Size: {
          type: "select",
          options: [
            { label: "Full Width (12/12)", value: "full" },
            { label: "Half Width (6/12)", value: "half" },
            { label: "One Third (4/12)", value: "oneThird" },
            { label: "Two Thirds (8/12)", value: "twoThirds" },
          ],
        },
        col1Title: { type: "text" },
        col1Text: { type: "textarea" },
        col1ImageUrl: {
          type: "custom",
          render: ({ value, onChange }) => (
            <MediaPickerField value={value} onChange={onChange} label="Column 1 Image" />
          ),
        },
        col1Caption: { type: "text" },

        // --- COLUMN 2 ---
        col2Type: {
          type: "select",
          options: [
            { label: "📝 Text Column", value: "text" },
            { label: "🖼️ Media Image Column", value: "media" },
          ],
        },
        col2Size: {
          type: "select",
          options: [
            { label: "Half Width (6/12)", value: "half" },
            { label: "One Third (4/12)", value: "oneThird" },
            { label: "Two Thirds (8/12)", value: "twoThirds" },
            { label: "Full Width (12/12)", value: "full" },
          ],
        },
        col2Title: { type: "text" },
        col2Text: { type: "textarea" },
        col2ImageUrl: {
          type: "custom",
          render: ({ value, onChange }) => (
            <MediaPickerField value={value} onChange={onChange} label="Column 2 Image" />
          ),
        },
        col2Caption: { type: "text" },

        // --- COLUMN 3 ---
        col3Type: {
          type: "select",
          options: [
            { label: "📝 Text Column", value: "text" },
            { label: "🖼️ Media Image Column", value: "media" },
          ],
        },
        col3Size: {
          type: "select",
          options: [
            { label: "One Third (4/12)", value: "oneThird" },
            { label: "Half Width (6/12)", value: "half" },
            { label: "Two Thirds (8/12)", value: "twoThirds" },
            { label: "Full Width (12/12)", value: "full" },
          ],
        },
        col3Title: { type: "text" },
        col3Text: { type: "textarea" },
        col3ImageUrl: {
          type: "custom",
          render: ({ value, onChange }) => (
            <MediaPickerField value={value} onChange={onChange} label="Column 3 Image" />
          ),
        },
        col3Caption: { type: "text" },
      },
      defaultProps: {
        columnsCount: "1",
        col1Type: "text",
        col1Size: "full",
        col1Title: "About Our Community",
        col1Text: "Our neighborhood offers a harmonious blend of urban convenience and historic charm.",
        col1ImageUrl: "",
        col1Caption: "",

        col2Type: "text",
        col2Size: "half",
        col2Title: "Community Initiatives",
        col2Text: "We organize local events, volunteer drives, and seasonal cleanups.",
        col2ImageUrl: "",
        col2Caption: "",

        col3Type: "text",
        col3Size: "oneThird",
        col3Title: "Local Business Network",
        col3Text: "Supporting local merchants, services, and neighborhood programs.",
        col3ImageUrl: "",
        col3Caption: "",
      },
      render: ({
        columnsCount,
        col1Type,
        col1Size,
        col1Title,
        col1Text,
        col1ImageUrl,
        col1Caption,
        col2Type,
        col2Size,
        col2Title,
        col2Text,
        col2ImageUrl,
        col2Caption,
        col3Type,
        col3Size,
        col3Title,
        col3Text,
        col3ImageUrl,
        col3Caption,
      }) => {
        const count = parseInt(columnsCount || "1", 10)

        const renderColContent = (
          type?: string,
          title?: string,
          text?: string,
          imageUrl?: string,
          caption?: string
        ) => {
          if (type === "media") {
            return (
              <div className="w-full text-center">
                {title && <h4 className="text-lg font-serif text-[#42514c] font-bold mb-2">{title}</h4>}
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={caption || title || "Column Image"}
                    className="w-full rounded-xl border border-gray-200 shadow-sm max-h-[450px] object-cover mx-auto"
                  />
                ) : (
                  <div className="w-full h-48 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                    No image selected. Click "Browse" in the properties panel to select an image.
                  </div>
                )}
                {caption && <p className="text-xs text-slate-500 mt-1.5 font-serif italic">{caption}</p>}
              </div>
            )
          }

          return (
            <div>
              {title && <h3 className="text-xl font-serif text-[#42514c] font-bold mb-2">{title}</h3>}
              <div className="text-base text-[#42514c] leading-relaxed whitespace-pre-line">{text}</div>
            </div>
          )
        }

        return (
          <div className="theme-nog py-6 px-6 max-w-5xl mx-auto my-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="grid grid-cols-12 gap-6 items-start">
              {/* Column 1 */}
              <div className={`${colSpanMap[col1Size || "full"] || "col-span-12"}`}>
                {renderColContent(col1Type, col1Title, col1Text, col1ImageUrl, col1Caption)}
              </div>

              {/* Column 2 */}
              {count >= 2 && (
                <div className={`${colSpanMap[col2Size || "half"] || "col-span-6"}`}>
                  {renderColContent(col2Type, col2Title, col2Text, col2ImageUrl, col2Caption)}
                </div>
              )}

              {/* Column 3 */}
              {count >= 3 && (
                <div className={`${colSpanMap[col3Size || "oneThird"] || "col-span-4"}`}>
                  {renderColContent(col3Type, col3Title, col3Text, col3ImageUrl, col3Caption)}
                </div>
              )}
            </div>
          </div>
        )
      },
    },

    MediaSection: {
      fields: {
        title: { type: "text" },
        imageUrl: {
          type: "custom",
          render: ({ value, onChange }) => (
            <MediaPickerField value={value} onChange={onChange} label="Section Image" />
          ),
        },
        caption: { type: "text" },
      },
      defaultProps: {
        title: "Featured Image",
        imageUrl: "",
        caption: "Community photo caption",
      },
      render: ({ title, imageUrl, caption }) => (
        <div className="theme-nog py-6 px-4 max-w-4xl mx-auto my-4 text-center">
          {title && <h3 className="text-2xl font-serif text-[#42514c] font-bold mb-4">{title}</h3>}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={caption || title || "Image"}
              className="w-full rounded-2xl border border-gray-200 shadow-md max-h-[600px] object-cover mx-auto"
            />
          ) : (
            <div className="w-full h-64 bg-slate-100 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-sm">
              No image selected. Click "Browse" in the properties panel to select an image from the Media Library.
            </div>
          )}
          {caption && <p className="text-xs text-slate-500 mt-2 font-serif italic">{caption}</p>}
        </div>
      ),
    },

    SlideshowSection: {
      fields: {
        title: { type: "text" },
      },
      defaultProps: {
        title: "Photo Gallery",
      },
      render: ({ title }) => (
        <div className="theme-nog my-6 max-w-5xl mx-auto">
          <SlideshowBlock title={title} />
        </div>
      ),
    },

    ContactSection: {
      fields: {
        title: { type: "text" },
        email: { type: "text" },
        address: { type: "text" },
      },
      defaultProps: {
        title: "Get in Touch",
        email: "contact@community.org",
        address: "Community Neighborhood Office",
      },
      render: ({ title, email, address }) => (
        <div className="theme-nog my-6 max-w-4xl mx-auto">
          <ContactBlock title={title} email={email} address={address} />
        </div>
      ),
    },

    IframeSection: {
      fields: {
        iframeUrl: { type: "text" },
        height: { type: "number" },
        title: { type: "text" },
      },
      defaultProps: {
        iframeUrl: "https://calendar.google.com/calendar/embed",
        height: 600,
        title: "Events Calendar",
      },
      render: ({ iframeUrl, height, title }) => (
        <div className="theme-nog my-6 max-w-5xl mx-auto">
          <IframeBlock iframeUrl={iframeUrl} height={height || 600} title={title} />
        </div>
      ),
    },

    CtaSection: {
      fields: {
        heading: { type: "text" },
        subheading: { type: "text" },
        buttonText: { type: "text" },
        buttonUrl: { type: "text" },
      },
      defaultProps: {
        heading: "Connect With Us",
        subheading: "Follow our social channels for regular updates, meeting schedules, and local announcements.",
        buttonText: "Visit Social Page",
        buttonUrl: "https://facebook.com",
      },
      render: ({ heading, subheading, buttonText, buttonUrl }) => (
        <div className="theme-nog py-8 px-8 max-w-4xl mx-auto my-6 bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-2xl font-serif font-bold mb-2">{heading}</h3>
            <p className="text-emerald-100 text-sm">{subheading}</p>
          </div>
          {buttonText && (
            <a
              href={buttonUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-emerald-950 px-6 py-2.5 rounded-xl font-bold text-sm shadow hover:bg-emerald-50 transition-colors whitespace-nowrap"
            >
              {buttonText}
            </a>
          )}
        </div>
      ),
    },

    DirectoryBanner: {
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        buttonText: { type: "text" },
      },
      defaultProps: {
        title: "Explore Local Businesses",
        description: "Support local. Discover restaurants, repair services, and community organizations near you.",
        buttonText: "Browse Business Directory →",
      },
      render: ({ title, description, buttonText }) => (
        <div className="theme-nog py-10 px-8 max-w-5xl mx-auto my-6 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white rounded-2xl shadow-lg">
          <h3 className="text-3xl font-serif font-bold mb-3">{title}</h3>
          <p className="text-emerald-100 text-base max-w-xl mb-6 leading-relaxed">{description}</p>
          <a href="/businesses" className="inline-block bg-white text-[#1b4332] font-semibold px-6 py-3 rounded-lg shadow hover:bg-emerald-50 transition-colors">
            {buttonText}
          </a>
        </div>
      ),
    },
  },
}
