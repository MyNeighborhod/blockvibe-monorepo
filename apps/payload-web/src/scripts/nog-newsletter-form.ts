import { lexicalRichText, richParagraph } from "./seed-helpers"

export const NOG_NEWSLETTER_FORM_TITLE = "NOG Newsletter Signup Form"

export const nogNewsletterFormFields = [
  {
    name: "email",
    blockName: "email",
    blockType: "email" as const,
    label: "Email Address",
    required: true,
    width: 100,
  },
  {
    blockName: "optionalContactInfoNote",
    blockType: "message" as const,
    message: lexicalRichText([
      richParagraph(
        "Optional: Share your name, address, and phone number so the association board can better communicate with you and know where our neighbors are located.",
      ),
    ]),
  },
  {
    name: "firstName",
    blockName: "firstName",
    blockType: "text" as const,
    label: "First",
    required: false,
    width: 50,
  },
  {
    name: "lastName",
    blockName: "lastName",
    blockType: "text" as const,
    label: "Last",
    required: false,
    width: 50,
  },
  {
    name: "address",
    blockName: "address",
    blockType: "text" as const,
    label: "Address",
    required: false,
    width: 100,
  },
  {
    name: "phone",
    blockName: "phone",
    blockType: "text" as const,
    label: "Phone Number",
    required: false,
    width: 100,
  },
  {
    name: "marketingConsent",
    blockName: "marketingConsent",
    blockType: "checkbox" as const,
    label: "I agree to receiving marketing and promotional materials",
    required: true,
    width: 100,
  },
]
