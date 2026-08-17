import type { Response } from "express"
import { generateText, type CoreMessage } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import { getDocsContext } from "../utilities/docParser.js"
import type { AuthenticatedRequest } from "../middleware/auth.js"

interface IncomingAttachment {
  url: string
  name?: string
  contentType?: string
}

interface IncomingMessage {
  role: "user" | "assistant" | "system"
  content: string
  experimental_attachments?: IncomingAttachment[]
}

/**
 * Converts client-sent message structure (including Vercel AI SDK experimental_attachments)
 * into CoreMessage format compatible with generateText.
 */
function mapMessages(messages: IncomingMessage[]): CoreMessage[] {
  return messages.map((msg) => {
    if (msg.role === "user" && msg.experimental_attachments && msg.experimental_attachments.length > 0) {
      const contentParts: any[] = [{ type: "text", text: msg.content }]

      for (const attachment of msg.experimental_attachments) {
        if (attachment.url.startsWith("data:")) {
          try {
            const [, base64Data] = attachment.url.split(",")
            const buffer = Buffer.from(base64Data, "base64")
            contentParts.push({
              type: "image",
              image: buffer,
              mimeType: attachment.contentType || "image/png",
            })
          } catch (err) {
            console.error("Failed to parse base64 attachment:", err)
          }
        }
      }

      return {
        role: "user",
        content: contentParts,
      } as CoreMessage
    }

    return {
      role: msg.role,
      content: msg.content,
    } as CoreMessage
  })
}

export async function handleChat(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { messages } = req.body

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Missing or invalid messages array in request body" })
      return
    }

    const docsContext = getDocsContext()
    
    // Strict SOP System Instructions: Only allow questions about the docs and site management.
    const systemPrompt = `
      STANDARD OPERATING PROCEDURE (SOP):
      You are the BlockVibe Platform AI Assistant. Your access is strictly limited to information regarding:
      1. The BlockVibe platform (an open-source multi-tenant neighborhood CRM, email broadcaster, voting, and fundraising system).
      2. The documentation context provided below.
      3. Practical local site management, operations, and troubleshooting for neighborhood admins.

      CRITICAL RESTRICTION:
      You must refuse to answer any questions or perform any tasks that are outside of this scope. If a user asks about general topics (e.g. general software development, coding in other frameworks/languages, unrelated math, recipes, or casual conversation), you must politely decline by stating that you are only authorized to assist with BlockVibe-specific documentation and site management.
      
      If the user uploads a screenshot, analyze the screenshot ONLY in the context of the BlockVibe platform (e.g. identifying UI components, checking status details, diagnosing admin errors, etc.).

      [Official Documentation Context]
      ${docsContext}
    `

    const mappedCoreMessages = mapMessages(messages)

    // Determine primary and secondary providers based on random selection
    const chooseGeminiFirst = Math.random() < 0.5
    const attempts = chooseGeminiFirst ? ["gemini", "cursor"] : ["cursor", "gemini"]

    let successText = ""
    let answeredBy = ""
    let errorDetails: string[] = []

    for (const provider of attempts) {
      try {
        if (provider === "gemini") {
          const geminiKey = process.env.GEMINI_GENERAL_API_KEY
          if (!geminiKey) {
            throw new Error("GEMINI_GENERAL_API_KEY is not defined")
          }
          // gemini-1.5-flash is multimodal and fast
          const googleProvider = createGoogleGenerativeAI({ apiKey: geminiKey })
          const model = googleProvider("gemini-1.5-flash")
          console.log(`Attempting to generate response using Gemini (role: ${req.user?.role})...`)
          const result = await generateText({
            model,
            system: systemPrompt,
            messages: mappedCoreMessages,
          })
          successText = result.text
          answeredBy = "Gemini"
          break
        } else if (provider === "cursor") {
          const cursorKey = process.env.CURSOR_GENERAL_API_KEY
          if (!cursorKey) {
            throw new Error("CURSOR_GENERAL_API_KEY is not defined")
          }
          const cursorProvider = createOpenAI({
            apiKey: cursorKey,
            baseURL: process.env.CURSOR_API_URL || "https://api.cursor.sh/v1",
          })
          // gpt-4o-mini is multimodal and fast
          const model = cursorProvider("gpt-4o-mini")
          console.log(`Attempting to generate response using Cursor (role: ${req.user?.role})...`)
          const result = await generateText({
            model,
            system: systemPrompt,
            messages: mappedCoreMessages,
          })
          successText = result.text
          answeredBy = "Cursor"
          break
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err)
        console.warn(`Provider '${provider}' failed: ${errMsg}`)
        errorDetails.push(`${provider}: ${errMsg}`)
      }
    }

    if (!successText) {
      res.status(500).json({
        error: "All AI providers failed to generate a response",
        details: errorDetails,
      })
      return
    }

    const finalResponseText = `${successText}\n\n(answered by ${answeredBy})`
    res.json({ text: finalResponseText })
  } catch (err: any) {
    console.error("Critical error in handleChat:", err)
    res.status(500).json({ error: err.message || "An unexpected error occurred during generation" })
  }
}
